'use strict';

// Company workspace state, validation, mutations, and deterministic Markdown generation.
const fs = require('node:fs');
const path = require('node:path');
const { slugify } = require('./cli');
const { normalizeLeetCodeUrl } = require('./company-source');
const { findStaleFiles, writeFiles } = require('./generated-files');
const { readJson, writeJson } = require('./json');
const {
  encodePath, escapeLinkDestination, escapeMarkdown, escapeTable, formatDateOnly, pluralize,
  renderDifficultyChart, replaceBlock,
} = require('./markdown');
const { paths, relativePath } = require('./paths');
const { getProblemCounts, getSolvedDifficultyCounts } = require('./progress');
const {
  createSolutionScaffold,
  findPythonSolutions,
  validateSolutionFileState,
  validateSolutionForSolve,
  validateSolutionHeader,
  validateSolvedSolution,
} = require('./solutions');
const {
  assertComplexity,
  assertDateOnly,
  assertDifficulty,
  assertHttpUrl,
  assertKeys,
  assertNonemptyText,
  assertObject,
  assertPersonalDifficulty,
  assertStatus,
  isSlug,
  validateProblemId,
  validateSlug,
} = require('./validation');

const MANUAL_PROBLEM_KEYS = [
  'id', 'title', 'url', 'difficulty', 'personalDifficulty', 'status', 'time', 'space', 'notes',
];
const SOURCE_PROBLEM_KEYS = [
  'id', 'sourceKey', 'sourceRank', 'frequency', 'title', 'url', 'difficulty',
  'personalDifficulty', 'status', 'time', 'space', 'notes',
];

/** Create a company workspace with a schema v3 manifest. */
function createCompanyWorkspace({ name, slug, website = '', focus = '' }) {
  assertNonemptyText(name, 'Company name');
  validateCompanySlug(slug);
  if (focus !== '') assertNonemptyText(focus, 'Company focus');
  assertHttpUrl(website, 'Company website', true);
  const directory = path.join(paths.companies, slug);
  if (fs.existsSync(directory)) throw new Error(`Company "${slug}" already exists.`);
  const solutionsDirectory = path.join(directory, 'solutions');
  fs.mkdirSync(solutionsDirectory, { recursive: true });
  fs.writeFileSync(path.join(solutionsDirectory, '.gitkeep'), '');
  writeJson(path.join(directory, 'company.json'), {
    schemaVersion: 3,
    name,
    focus,
    website,
    source: null,
    problems: [],
  });
  updateCompanyDocumentation(false);
  return `Created company workspace: companies/${slug}`;
}

/** Build the conventional LeetCode URL only for numeric manual problem IDs. */
function defaultProblemUrl(id, title) {
  if (!/^\d+$/.test(id)) return '';
  const titleSlug = slugify(title);
  if (!titleSlug) {
    throw new Error(`Problem ${id} title cannot produce a default LeetCode URL; provide --url explicitly.`);
  }
  return `https://leetcode.com/problems/${titleSlug}/`;
}

/** Add a manually specified planned problem while retaining custom OA identifiers. */
function addManualProblem(slug, { id, title, difficulty, personalDifficulty, url, notes = '' }) {
  validateProblemId(id);
  assertNonemptyText(title, `Problem ${id} title`);
  assertDifficulty(difficulty, `Problem ${id}`, true);
  assertPersonalDifficulty(personalDifficulty, `Problem ${id}`);
  const problemUrl = url === undefined ? defaultProblemUrl(id, title) : url;
  assertHttpUrl(problemUrl, `Problem ${id} URL`, true);
  if (typeof notes !== 'string') throw new Error(`Problem ${id} notes must be a string.`);

  const company = readCompany(slug);
  validateCompany(company);
  assertProblemNotTracked(company.data, id);
  company.data.problems.push({
    id,
    title,
    url: problemUrl,
    difficulty,
    personalDifficulty,
    status: 'planned',
    time: '',
    space: '',
    notes,
  });
  sortProblems(company.data.problems);
  // Validate the complete candidate state before committing it to the source-of-truth manifest.
  validateCompany(company);
  writeJson(company.manifestPath, company.data);
  updateCompanyDocumentation(false);
  return `Added ${id} - ${title} to ${company.data.name} as planned.`;
}

/** Import one normalized source candidate into personal tracked state. */
function addSourceProblem(company, sourceProblem, { id, personalDifficulty = null, notes = '' }) {
  validateCompany(company);
  validateProblemId(id);
  assertPersonalDifficulty(personalDifficulty, `Problem ${id}`);
  if (typeof notes !== 'string') throw new Error(`Problem ${id} notes must be a string.`);
  assertProblemNotTracked(company.data, id);
  if (company.data.problems.some((problem) => problem.sourceKey === sourceProblem.sourceKey)) {
    throw new Error(`Source problem "${sourceProblem.sourceKey}" is already tracked for ${company.data.name}.`);
  }
  const duplicateUrl = company.data.problems.some((problem) => {
    if (!problem.url) return false;
    try {
      return normalizeLeetCodeUrl(problem.url) === sourceProblem.url;
    } catch {
      return false;
    }
  });
  if (duplicateUrl) {
    throw new Error(`Source problem "${sourceProblem.sourceKey}" is already tracked by URL for ${company.data.name}.`);
  }
  company.data.problems.push({
    id,
    sourceKey: sourceProblem.sourceKey,
    sourceRank: sourceProblem.sourceRank,
    frequency: sourceProblem.frequency,
    title: sourceProblem.title,
    url: sourceProblem.url,
    difficulty: sourceProblem.difficulty,
    personalDifficulty,
    status: 'planned',
    time: '',
    space: '',
    notes,
  });
  sortProblems(company.data.problems);
  // This also catches rank or source-key collisions before a bad manifest reaches disk.
  validateCompany(company);
  writeJson(company.manifestPath, company.data);
  updateCompanyDocumentation(false);
  return `Imported source rank ${sourceProblem.sourceRank}: ${id} - ${sourceProblem.title} for ${company.data.name}.`;
}

/** Create a solution scaffold and move a company problem into progress. */
function startCompanyProblem(slug, id) {
  const company = readCompany(slug);
  validateCompany(company);
  const problem = findProblem(company.data, id);
  if (problem.status === 'solved') throw new Error(`Problem "${id}" is already solved.`);
  const solutionPath = getSolutionPath(company.directory, id);
  createSolutionScaffold(solutionPath, problem, 'company-solution');
  const placeholderPath = path.join(path.dirname(solutionPath), '.gitkeep');
  if (fs.existsSync(placeholderPath)) fs.unlinkSync(placeholderPath);
  problem.status = 'in-progress';
  validateCompany(company);
  writeJson(company.manifestPath, company.data);
  updateCompanyDocumentation(false);
  return `Started ${id} - ${problem.title}: ${relativePath(solutionPath)}`;
}

/** Validate an implementation, record attempt metadata, and mark it solved. */
function solveCompanyProblem(slug, id, { time, space, personalDifficulty, notes }) {
  assertComplexity(time, `Problem ${id} time`);
  assertComplexity(space, `Problem ${id} space`);
  if (!time || !space) throw new Error('Solving a company problem requires non-empty time and space complexity.');
  if (personalDifficulty !== undefined) assertPersonalDifficulty(personalDifficulty, `Problem ${id}`);
  if (notes !== undefined && typeof notes !== 'string') throw new Error(`Problem ${id} notes must be a string.`);
  const company = readCompany(slug);
  validateCompany(company);
  const problem = findProblem(company.data, id);
  if (problem.status === 'solved') throw new Error(`Problem "${id}" is already solved.`);
  const solutionPath = getSolutionPath(company.directory, id);
  if (!fs.existsSync(solutionPath)) {
    throw new Error(`Missing solution ${relativePath(solutionPath)}. Run the start command first.`);
  }
  const source = fs.readFileSync(solutionPath, 'utf8');
  validateSolutionForSolve(source, problem, relativePath(solutionPath), 'company-solution');
  problem.status = 'solved';
  problem.time = time;
  problem.space = space;
  if (personalDifficulty !== undefined) problem.personalDifficulty = personalDifficulty;
  if (notes !== undefined) problem.notes = notes;
  validateCompany(company);
  writeJson(company.manifestPath, company.data);
  updateCompanyDocumentation(false);
  return `Marked ${id} - ${problem.title} as solved for ${company.data.name}.`;
}

/** Load every manifest-backed company workspace in display order. */
function loadCompanies() {
  if (!fs.existsSync(paths.companies)) return [];
  return fs.readdirSync(paths.companies, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.'))
    .map((entry) => readCompany(entry.name))
    .sort((a, b) => a.data.name.localeCompare(b.data.name));
}

/** Read one company manifest. Validation remains explicit at operation boundaries. */
function readCompany(slug) {
  validateCompanySlug(slug);
  const directory = path.join(paths.companies, slug);
  const manifestPath = path.join(directory, 'company.json');
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Company "${slug}" does not exist (missing ${relativePath(manifestPath)}).`);
  }
  return { slug, directory, manifestPath, data: readJson(manifestPath) };
}

/** Validate a company manifest and every relationship with its solution workspace. */
function validateCompany(company) {
  const { data, slug, directory, manifestPath } = company;
  const location = relativePath(manifestPath);
  assertObject(data, location);
  assertKeys(data, ['schemaVersion', 'name', 'focus', 'website', 'source', 'problems'], location);
  if (data.schemaVersion !== 3) throw new Error(`${location} must use schemaVersion 3.`);
  assertNonemptyText(data.name, `${location} name`);
  if (data.focus !== '') assertNonemptyText(data.focus, `${location} focus`);
  assertHttpUrl(data.website, `${location} website`, true);
  validateSourceMetadata(data.source, `${location} source`);
  if (!Array.isArray(data.problems)) throw new Error(`${location} problems must be an array.`);

  const ids = new Set();
  const sourceKeys = new Set();
  const sourceRanks = new Set();
  const canonicalLeetCodeUrls = new Set();
  for (const problem of data.problems) {
    const context = `${location}: problem ${problem?.id ?? '(unknown)'}`;
    assertObject(problem, `${location} problem entry`);
    const sourceBacked = Object.prototype.hasOwnProperty.call(problem, 'sourceKey');
    assertKeys(problem, sourceBacked ? SOURCE_PROBLEM_KEYS : MANUAL_PROBLEM_KEYS, context);
    validateProblemId(problem.id);
    if (ids.has(problem.id)) throw new Error(`${location} contains duplicate problem id "${problem.id}".`);
    ids.add(problem.id);
    assertNonemptyText(problem.title, `${context} title`);
    assertHttpUrl(problem.url, `${context} URL`, !sourceBacked);
    assertDifficulty(problem.difficulty, context);
    assertPersonalDifficulty(problem.personalDifficulty, context);
    assertStatus(problem.status, context);
    assertComplexity(problem.time, `${context} time`);
    assertComplexity(problem.space, `${context} space`);
    if (typeof problem.notes !== 'string') throw new Error(`${context} notes must be a string.`);

    if (sourceBacked) {
      if (!data.source) throw new Error(`${context} is source-backed but the company has no source metadata.`);
      if (!isSlug(problem.sourceKey)) throw new Error(`${context} sourceKey must be a lowercase hyphenated slug.`);
      if (sourceKeys.has(problem.sourceKey)) {
        throw new Error(`${location} contains duplicate source identity "${problem.sourceKey}".`);
      }
      sourceKeys.add(problem.sourceKey);
      if (!Number.isInteger(problem.sourceRank) || problem.sourceRank <= 0) {
        throw new Error(`${context} sourceRank must be a positive integer.`);
      }
      if (sourceRanks.has(problem.sourceRank)) {
        throw new Error(`${location} contains duplicate sourceRank ${problem.sourceRank}.`);
      }
      sourceRanks.add(problem.sourceRank);
      if (!Number.isFinite(problem.frequency) || problem.frequency < 0 || problem.frequency > 100) {
        throw new Error(`${context} frequency must be a number from 0 to 100.`);
      }
      const canonicalUrl = normalizeLeetCodeUrl(problem.url, `${context} URL`);
      if (canonicalUrl !== problem.url || problem.sourceKey !== canonicalUrl.split('/').at(-2)) {
        throw new Error(`${context} URL and sourceKey must use the same canonical LeetCode slug.`);
      }
    }

    if (problem.url) {
      let canonicalUrl = null;
      try {
        canonicalUrl = normalizeLeetCodeUrl(problem.url);
      } catch {
        // Manual entries may intentionally point to another platform.
      }
      if (canonicalUrl) {
        if (canonicalLeetCodeUrls.has(canonicalUrl)) {
          throw new Error(`${location} contains duplicate LeetCode URL "${canonicalUrl}".`);
        }
        canonicalLeetCodeUrls.add(canonicalUrl);
      }
    }

    validateCompanySolution(company, problem, context);
  }

  const ordered = [...data.problems];
  sortProblems(ordered);
  if (ordered.some((problem, index) => problem !== data.problems[index])) {
    throw new Error(`${location} problems are not in source-priority order.`);
  }
  validateRegisteredSolutions(directory, ids);
  if (slug !== path.basename(directory)) throw new Error(`Invalid company directory for ${data.name}.`);
}

/** Validate source provenance when a company uses an external candidate list. */
function validateSourceMetadata(source, context) {
  if (source === null) return;
  assertObject(source, context);
  assertKeys(source, ['repository', 'commit', 'snapshotDate', 'window', 'path'], context);
  if (typeof source.repository !== 'string' || !/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(source.repository)) {
    throw new Error(`${context} repository must use owner/repository form.`);
  }
  if (typeof source.commit !== 'string' || !/^[0-9a-f]{40}$/.test(source.commit)) {
    throw new Error(`${context} commit must be a full lowercase Git commit hash.`);
  }
  assertDateOnly(source.snapshotDate, `${context} snapshotDate`);
  assertNonemptyText(source.window, `${context} window`);
  if (
    typeof source.path !== 'string'
    || !source.path.endsWith('.csv')
    || source.path.startsWith('/')
    || source.path.includes('\\')
    || source.path.split('/').some((segment) => !segment || segment === '.' || segment === '..')
    || /[\u0000-\u001F\u007F]/.test(source.path)
  ) {
    throw new Error(`${context} path must be a safe repository-relative CSV path.`);
  }
}

/** Validate or regenerate every company-owned Markdown file and root README block. */
function updateCompanyDocumentation(checkOnly = false) {
  // Check mode must remain read-only, including when the company directory does not exist.
  if (!checkOnly) fs.mkdirSync(paths.companies, { recursive: true });
  const companies = loadCompanies();
  const expectedFiles = [];
  for (const company of companies) {
    validateCompany(company);
    expectedFiles.push({
      path: path.join(company.directory, 'README.md'),
      content: renderCompanyReadme(company),
    });
  }
  expectedFiles.push({
    path: path.join(paths.companies, 'README.md'),
    content: renderCompaniesReadme(companies),
  });

  const originalRootReadme = fs.readFileSync(paths.readme, 'utf8');
  let updatedRootReadme = replaceBlock(
    originalRootReadme,
    'company-progress',
    renderRootSummary(companies).split('\n'),
  );
  updatedRootReadme = replaceBlock(updatedRootReadme, 'company-count', [
    `<img src="https://img.shields.io/badge/Companies-${companies.length}-blue" alt="Companies covered: ${companies.length}" />`,
  ]);
  updatedRootReadme = replaceBlock(
    updatedRootReadme,
    'company-list',
    renderRootCompanyList(companies).split('\n'),
  );
  expectedFiles.push({ path: paths.readme, content: updatedRootReadme });

  const stale = findStaleFiles(expectedFiles);
  if (checkOnly) {
    if (stale.length) {
      throw new Error(`Generated company documentation is outdated: ${stale.map(relativePath).join(', ')}. Run: node scripts/company-tracker.js`);
    }
    console.log(summaryMessage(companies, 'Company tracking is up to date'));
    return;
  }
  writeFiles(stale);
  console.log(summaryMessage(companies, stale.length ? 'Updated company tracking' : 'Company tracking already up to date'));
}

/** Sort source-backed entries by source rank, followed by manual IDs. */
function sortProblems(problems) {
  problems.sort((a, b) => {
    const aSource = Number.isInteger(a.sourceRank);
    const bSource = Number.isInteger(b.sourceRank);
    if (aSource && bSource) return a.sourceRank - b.sourceRank || a.id.localeCompare(b.id, undefined, { numeric: true });
    if (aSource !== bSource) return aSource ? -1 : 1;
    return a.id.localeCompare(b.id, undefined, { numeric: true });
  });
}

/** Render the repository-wide company dashboard and contributor workflow. */
function renderCompaniesReadme(companies) {
  const totals = getTotals(companies);
  const rows = companies.length
    ? companies.map((company) => {
      const counts = getProblemCounts(company.data.problems);
      return `| [${escapeTable(company.data.name)}](${encodePath(`${company.slug}/README.md`)}) | ${counts.solved} / ${company.data.problems.length} | ${counts.inProgress} | ${counts.planned} |`;
    }).join('\n')
    : '| _No companies yet_ | 0 / 0 | 0 | 0 |';

  return `# Company interview preparation

[← Project README](../README.md) · [Solutions](../SOLUTIONS.md) · [Contributing](../CONTRIBUTING.md)

This directory contains locally tracked preparation for OAs and technical interviews. Candidate lists come from [liquidslr/leetcode-company-wise-problems](https://github.com/liquidslr/leetcode-company-wise-problems), and source-backed problems are practiced from highest reported frequency to lowest. Frequency is only the source's relative ranking signal, not a prediction that a problem will appear in an interview.

Each manifest records the selected source window, snapshot date, commit, and CSV path. The external candidate list remains separate from the problems selected for practice, so progress totals below count only local manifest entries.

## Progress

| Company | Solved | In progress | Planned |
|---|---:|---:|---:|
${rows}

**Total:** ${totals.solved} solved, ${totals.inProgress} in progress, and ${totals.planned} planned across ${companies.length} ${pluralize(companies.length, 'company', 'companies')}.

## Source-backed workflow

Source data is cached locally and is never required for normal validation or CI. For a company with source provenance in its manifest:

\`\`\`bash
node scripts/company-tracker.js source-sync ibm
node scripts/company-tracker.js next ibm
node scripts/company-tracker.js add-from-source ibm valid-parentheses --id 20
\`\`\`

\`source-sync\` fetches the exact pinned commit, not the latest upstream data. Use \`--file PATH\` to populate the same gitignored cache from a local CSV. Refreshing source provenance is an intentional data update, separate from importing one candidate.

## Manual workflow

Manual and OA-specific entries remain supported:

\`\`\`bash
node scripts/company-tracker.js add-company "Amazon" --focus "US OA"
node scripts/company-tracker.js add-problem amazon oa-pairs "Pair Optimization" Medium --url https://example.com/problems/pairs
node scripts/company-tracker.js start amazon oa-pairs
node scripts/company-tracker.js solve amazon oa-pairs --time "O(n)" --space "O(n)" --personal-difficulty 3
\`\`\`

Run \`node scripts/company-tracker.js --help\` to see every option.

## Folder layout

\`\`\`text
companies/
└── amazon/
    ├── company.json       # personal tracked state and optional source provenance
    ├── README.md          # generated dashboard
    └── solutions/
        └── oa-pairs.py    # independent company-specific attempt
\`\`\`

\`company.json\` is the source of truth for selected personal practice, not a copy of the complete external dataset. Statuses follow \`planned → in-progress → solved\`, and solved entries require a Python solution plus time and space complexity. See [the data model reference](../docs/DATA_MODEL.md) for exact fields and provenance semantics.

> [!IMPORTANT]
> Company README files are generated. Update the manifest through the tracker or source data, then run \`node scripts/company-tracker.js\` instead of editing Markdown directly.
`;
}

/** Render one compact ranking dashboard plus detailed attempt metadata. */
function renderCompanyReadme(company) {
  const { data, slug } = company;
  const counts = getProblemCounts(data.problems);
  const difficulties = getSolvedDifficultyCounts(data.problems);
  const heading = data.website
    ? `[${escapeMarkdown(data.name)}](${escapeLinkDestination(data.website)})`
    : escapeMarkdown(data.name);
  const focus = data.focus ? `\n**Focus:** ${escapeMarkdown(data.focus)}\n` : '';
  const provenance = data.source
    ? `\n**Source:** [${escapeMarkdown(data.source.repository)}](https://github.com/${data.source.repository}) · **Window:** ${escapeMarkdown(data.source.window)} · **Snapshot:** ${formatDateOnly(data.source.snapshotDate)} · **Commit:** [\`${data.source.commit.slice(0, 12)}\`](https://github.com/${data.source.repository}/commit/${data.source.commit})\n`
    : '\n**Source:** Manual entries only\n';
  const rankingRows = data.problems.length
    ? data.problems.map((problem) => {
      const title = problem.url
        ? `[${escapeTable(problem.title)}](${escapeLinkDestination(problem.url)})`
        : escapeTable(problem.title);
      const solution = problem.status === 'planned' ? 'Not started' : `[${problem.id}.py](${encodePath(`solutions/${problem.id}.py`)})`;
      const rank = problem.sourceRank ?? 'Manual';
      const frequency = problem.frequency === undefined ? 'Not sourced' : formatFrequency(problem.frequency);
      return `| ${rank} | ${title} | ${frequency} | ${problem.difficulty} | ${formatStatus(problem.status)} | ${problem.personalDifficulty ?? 'Not rated'} | ${solution} |`;
    }).join('\n')
    : '| - | _No problems tracked yet_ | - | - | - | - | - |';
  const detailRows = data.problems.length
    ? data.problems.map((problem) => `| ${escapeTable(problem.id)} | ${escapeTable(problem.time || 'Not recorded')} | ${escapeTable(problem.space || 'Not recorded')} | ${escapeTable(problem.notes || 'None')} |`).join('\n')
    : '| - | Not recorded | Not recorded | None |';

  return `# ${heading}

> This file is generated from [\`company.json\`](company.json). Do not edit it directly.

[← Companies](../README.md) · [Project README](../../README.md)
${focus}${provenance}
## Progress

- **Solved:** ${counts.solved} / ${data.problems.length}
- **In progress:** ${counts.inProgress}
- **Planned:** ${counts.planned}

${renderDifficultyChart(difficulties, counts.solved).join('\n')}

| Rank | Problem | Frequency | Difficulty | Status | Personal | Solution |
|---:|---|---:|:---:|:---:|:---:|---|
${rankingRows}

## Attempt details

| ID | Time | Space | Notes |
|---|---|---|---|
${detailRows}

## Commands

\`\`\`bash
node scripts/company-tracker.js source-sync ${slug}
node scripts/company-tracker.js next ${slug}
node scripts/company-tracker.js add-from-source ${slug} <source-key> [--id problem-id]
node scripts/company-tracker.js add-problem ${slug} <id> "<title>" <Easy|Medium|Hard> [--url URL]
node scripts/company-tracker.js start ${slug} <id>
node scripts/company-tracker.js solve ${slug} <id> --time "O(...)" --space "O(...)" [--personal-difficulty 1-10]
\`\`\`
`;
}

/** Validate one problem's expected solution file and solved metadata. */
function validateCompanySolution(company, problem, context) {
  const solutionPath = getSolutionPath(company.directory, problem.id);
  const solutionRelativePath = relativePath(solutionPath);
  const solutionExists = validateSolutionFileState(
    solutionPath,
    solutionRelativePath,
    problem.status,
    {
      planned: `${solutionRelativePath} exists, but its status is planned. Set it to in-progress or remove the file.`,
      missing: `${context.replace(`: problem ${problem.id}`, '')}: ${problem.status} problem ${problem.id} is missing its solution file.`,
    },
  );
  let source;
  if (solutionExists) {
    source = fs.readFileSync(solutionPath, 'utf8');
    if (problem.status !== 'solved') validateSolutionHeader(source, problem, solutionRelativePath);
  }
  if (problem.status === 'solved') {
    if (!problem.time.trim() || !problem.space.trim()) {
      throw new Error(`${context}: solved problem requires time and space complexity.`);
    }
    validateSolvedSolution(source, problem, solutionRelativePath, 'company-solution');
  }
}

/** Reject untracked Python files in a company solution directory. */
function validateRegisteredSolutions(directory, ids) {
  const solutionsDir = path.join(directory, 'solutions');
  for (const solutionPath of findPythonSolutions(solutionsDir)) {
    const expectedDirectory = path.dirname(solutionPath) === solutionsDir;
    const id = path.basename(solutionPath, '.py');
    if (!expectedDirectory || !ids.has(id)) {
      throw new Error(`${relativePath(solutionPath)} is not registered in company.json.`);
    }
  }
}

function assertProblemNotTracked(data, id) {
  if (data.problems.some((problem) => problem.id === id)) {
    throw new Error(`Problem "${id}" is already tracked for ${data.name}.`);
  }
}

function findProblem(data, id) {
  validateProblemId(id);
  const problem = data.problems.find((entry) => entry.id === id);
  if (!problem) throw new Error(`Problem "${id}" is not tracked for ${data.name}.`);
  return problem;
}

function getSolutionPath(directory, id) {
  return path.join(directory, 'solutions', `${id}.py`);
}

function validateCompanySlug(slug) {
  validateSlug(slug, 'company slug');
}

function formatStatus(status) {
  if (status === 'solved') return 'Solved';
  if (status === 'in-progress') return 'In progress';
  return 'Planned';
}

function formatFrequency(frequency) {
  return `${Number.isInteger(frequency) ? frequency.toFixed(1) : frequency}%`;
}

function getTotals(companies) {
  return companies.reduce((total, company) => {
    const counts = getProblemCounts(company.data.problems);
    total.solved += counts.solved;
    total.inProgress += counts.inProgress;
    total.planned += counts.planned;
    return total;
  }, { solved: 0, inProgress: 0, planned: 0 });
}

function renderRootSummary(companies) {
  if (!companies.length) {
    return 'No company plans yet. Create one with `node scripts/company-tracker.js add-company "Company Name"`.';
  }
  const totals = getTotals(companies);
  return `**${companies.length} ${pluralize(companies.length, 'company', 'companies')} · ${totals.solved} solved · ${totals.inProgress} in progress · ${totals.planned} planned**`;
}

function renderRootCompanyList(companies) {
  const rows = companies.length
    ? companies.map((company) => {
      const folder = `companies/${company.slug}/`;
      return `| ${escapeTable(company.data.name)} | [\`${folder}\`](${encodePath(folder)}) |`;
    }).join('\n')
    : '| _No companies yet_ | Not available |';
  return `| Company | Folder |\n|---|---|\n${rows}`;
}

function summaryMessage(companies, prefix) {
  const totals = getTotals(companies);
  return `${prefix} (${companies.length} ${pluralize(companies.length, 'company', 'companies')}; ${totals.solved} solved, ${totals.inProgress} in progress, ${totals.planned} planned).`;
}

module.exports = {
  addManualProblem,
  addSourceProblem,
  createCompanyWorkspace,
  readCompany,
  solveCompanyProblem,
  startCompanyProblem,
  updateCompanyDocumentation,
  validateCompany,
};
