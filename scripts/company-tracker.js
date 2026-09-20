#!/usr/bin/env node
'use strict';

// Company workspace CLI: mutate manifests, validate solutions, and regenerate company dashboards.
const fs = require('node:fs');
const path = require('node:path');
const {
  assertNoExtraArguments, defaultProblemUrl, parseArguments, runCli, slugify,
} = require('./lib/cli');
const { findStaleFiles, writeFiles } = require('./lib/generated-files');
const { readJson, writeJson } = require('./lib/json');
const {
  encodePath, escapeMarkdown, escapeTable, pluralize, renderDifficultyChart, replaceBlock,
} = require('./lib/markdown');
const { paths, relativePath } = require('./lib/paths');
const { getProblemCounts, getSolvedDifficultyCounts } = require('./lib/progress');
const { containsPythonCode, solutionTemplate, validateSolutionHeader } = require('./lib/solutions');
const {
  VALID_DIFFICULTIES: validDifficulties,
  VALID_STATUSES: validStatuses,
  assertPersonalDifficulty: validatePersonalDifficulty,
  parsePersonalDifficulty,
  validateProblemId,
  validateSlug,
} = require('./lib/validation');

const companiesDir = paths.companies;
const rootReadmePath = paths.readme;

/** Dispatch the requested company tracker command. */
function main() {
  const command = process.argv[2] || 'update';
  switch (command) {
    case 'update':
      assertNoExtraArguments(process.argv, 3, 'node scripts/company-tracker.js [update]');
      updateDocumentation(false);
      break;
    case '--check':
    case 'check':
      assertNoExtraArguments(process.argv, 3, 'node scripts/company-tracker.js --check');
      updateDocumentation(true);
      break;
    case 'add-company':
      addCompany(process.argv.slice(3));
      break;
    case 'add-problem':
      addProblem(process.argv.slice(3));
      break;
    case 'start':
      startProblem(process.argv.slice(3));
      break;
    case 'solve':
      solveProblem(process.argv.slice(3));
      break;
    case 'help':
    case '--help':
    case '-h':
      printHelp();
      break;
    default:
      fail(`Unknown command "${command}". Run with --help for usage.`);
  }
}

// Importing the tracker is side-effect free; only direct CLI execution dispatches commands.
if (require.main === module) runCli(main);

/**
 * Create a company workspace and regenerate all derived dashboards.
 * @param {string[]} args - Command arguments after `add-company`.
 */
function addCompany(args) {
  const { positionals, options } = parseArguments(args, new Set(['slug', 'website', 'focus']));
  if (positionals.length !== 1) {
    fail('Usage: node scripts/company-tracker.js add-company "Company Name" [--slug company-name] [--website URL] [--focus TEXT]');
  }

  const name = positionals[0].trim();
  if (!name) fail('The company name cannot be empty.');
  const slug = options.slug || slugify(name);
  validateCompanySlug(slug);

  const directory = path.join(companiesDir, slug);
  if (fs.existsSync(directory)) fail(`Company "${slug}" already exists.`);

  const solutionsDirectory = path.join(directory, 'solutions');
  fs.mkdirSync(solutionsDirectory, { recursive: true });
  fs.writeFileSync(path.join(solutionsDirectory, '.gitkeep'), '');
  writeJson(path.join(directory, 'company.json'), {
    schemaVersion: 2,
    name,
    focus: options.focus || '',
    website: options.website || '',
    problems: [],
  });
  updateDocumentation(false);
  console.log(`Created company workspace: companies/${slug}`);
}

/**
 * Add a planned problem to a company manifest.
 * @param {string[]} args - Command arguments after `add-problem`.
 */
function addProblem(args) {
  const { positionals, options } = parseArguments(args, new Set(['url', 'notes', 'personal-difficulty']));
  if (positionals.length !== 4) {
    fail('Usage: node scripts/company-tracker.js add-problem <company> <id> "Title" <Easy|Medium|Hard> [--personal-difficulty 1-10] [--url URL] [--notes TEXT]');
  }

  const [slug, id, title, difficulty] = positionals;
  validateProblemId(id);
  if (!title.trim()) fail('The problem title cannot be empty.');
  if (!validDifficulties.has(difficulty)) fail('Difficulty must be Easy, Medium, or Hard.');
  const personalDifficulty = options['personal-difficulty'] === undefined
    ? null
    : parsePersonalDifficulty(options['personal-difficulty']);

  const company = readCompany(slug);
  if (company.data.problems.some((problem) => problem.id === id)) {
    fail(`Problem "${id}" is already tracked for ${company.data.name}.`);
  }

  company.data.problems.push({
    id,
    title: title.trim(),
    url: options.url || defaultProblemUrl(id, title),
    difficulty,
    personalDifficulty,
    status: 'planned',
    time: '',
    space: '',
    notes: options.notes || '',
  });
  sortProblems(company.data.problems);
  writeJson(company.manifestPath, company.data);
  updateDocumentation(false);
  console.log(`Added ${id} - ${title.trim()} to ${company.data.name} as planned.`);
}

/**
 * Create a solution scaffold and mark a company problem as in progress.
 * @param {string[]} args - Command arguments after `start`.
 */
function startProblem(args) {
  const { positionals, options } = parseArguments(args, new Set());
  if (Object.keys(options).length || positionals.length !== 2) {
    fail('Usage: node scripts/company-tracker.js start <company> <problem-id>');
  }

  const [slug, id] = positionals;
  const company = readCompany(slug);
  const problem = findProblem(company.data, id);
  if (problem.status === 'solved') fail(`Problem "${id}" is already solved.`);

  const solutionPath = getSolutionPath(company.directory, id);
  if (!fs.existsSync(solutionPath)) {
    fs.mkdirSync(path.dirname(solutionPath), { recursive: true });
    fs.writeFileSync(solutionPath, solutionTemplate(problem, 'company-solution'));
  }
  const placeholderPath = path.join(path.dirname(solutionPath), '.gitkeep');
  if (fs.existsSync(placeholderPath)) fs.unlinkSync(placeholderPath);
  problem.status = 'in-progress';
  writeJson(company.manifestPath, company.data);
  updateDocumentation(false);
  console.log(`Started ${id} - ${problem.title}: ${relativePath(solutionPath)}`);
}

/**
 * Validate and mark a company problem as solved.
 * @param {string[]} args - Command arguments after `solve`.
 */
function solveProblem(args) {
  const { positionals, options } = parseArguments(args, new Set(['time', 'space', 'notes', 'personal-difficulty']));
  if (
    positionals.length !== 2
    || !options.time?.trim()
    || !options.space?.trim()
  ) {
    fail('Usage: node scripts/company-tracker.js solve <company> <problem-id> --time "O(...)" --space "O(...)" [--personal-difficulty 1-10] [--notes TEXT]');
  }
  const personalDifficulty = options['personal-difficulty'] === undefined
    ? undefined
    : parsePersonalDifficulty(options['personal-difficulty']);

  const [slug, id] = positionals;
  const company = readCompany(slug);
  const problem = findProblem(company.data, id);
  const solutionPath = getSolutionPath(company.directory, id);
  if (!fs.existsSync(solutionPath)) {
    fail(`Missing solution ${relativePath(solutionPath)}. Run the start command first.`);
  }
  const source = fs.readFileSync(solutionPath, 'utf8');
  validateSolutionHeader(source, problem, relativePath(solutionPath));
  if (source.includes('TODO(company-solution)')) {
    fail(`Finish ${relativePath(solutionPath)} and remove the TODO(company-solution) marker before marking it solved.`);
  }
  if (!containsPythonCode(source)) {
    fail(`${relativePath(solutionPath)} does not contain a Python solution.`);
  }

  problem.status = 'solved';
  problem.time = options.time;
  problem.space = options.space;
  if (personalDifficulty !== undefined) problem.personalDifficulty = personalDifficulty;
  if (options.notes !== undefined) problem.notes = options.notes;
  writeJson(company.manifestPath, company.data);
  updateDocumentation(false);
  console.log(`Marked ${id} - ${problem.title} as solved for ${company.data.name}.`);
}

/**
 * Regenerate derived documentation or verify that it is current.
 * @param {boolean} checkOnly - Whether to report stale files without writing them.
 */
function updateDocumentation(checkOnly) {
  fs.mkdirSync(companiesDir, { recursive: true });
  const companies = loadCompanies();
  validateUnregisteredDirectories(companies);

  const expectedFiles = [];
  for (const company of companies) {
    validateCompany(company);
    expectedFiles.push({
      path: path.join(company.directory, 'README.md'),
      content: renderCompanyReadme(company),
    });
  }
  expectedFiles.push({ path: path.join(companiesDir, 'README.md'), content: renderCompaniesReadme(companies) });

  const originalRootReadme = fs.readFileSync(rootReadmePath, 'utf8');
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
  expectedFiles.push({ path: rootReadmePath, content: updatedRootReadme });

  const stale = findStaleFiles(expectedFiles);
  if (checkOnly) {
    if (stale.length) {
      fail(`Generated company documentation is outdated: ${stale.map((file) => relativePath(file.path)).join(', ')}. Run: node scripts/company-tracker.js`);
    }
    console.log(summaryMessage(companies, 'Company tracking is up to date'));
    return;
  }

  writeFiles(stale);
  console.log(summaryMessage(companies, stale.length ? 'Updated company tracking' : 'Company tracking already up to date'));
}

/**
 * Load every manifest-backed company workspace.
 * @returns {Array<{slug: string, directory: string, manifestPath: string, data: object}>}
 */
function loadCompanies() {
  if (!fs.existsSync(companiesDir)) return [];
  return fs.readdirSync(companiesDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.'))
    .map((entry) => readCompany(entry.name))
    .sort((a, b) => a.data.name.localeCompare(b.data.name));
}

/**
 * Read one company workspace and parse its manifest.
 * @param {string} slug - Company directory slug.
 * @returns {{slug: string, directory: string, manifestPath: string, data: object}}
 */
function readCompany(slug) {
  validateCompanySlug(slug);
  const directory = path.join(companiesDir, slug);
  const manifestPath = path.join(directory, 'company.json');
  if (!fs.existsSync(manifestPath)) fail(`Company "${slug}" does not exist (missing ${relativePath(manifestPath)}).`);

  const data = readJson(manifestPath);
  return { slug, directory, manifestPath, data };
}

/**
 * Validate a company manifest and its relationship with solution files.
 * @param {{slug: string, directory: string, manifestPath: string, data: object}} company - Loaded company workspace.
 */
function validateCompany(company) {
  const { data, slug, directory, manifestPath } = company;
  const location = relativePath(manifestPath);
  if (!data || typeof data !== 'object' || Array.isArray(data)) fail(`${location} must contain a JSON object.`);
  if (data.schemaVersion !== 2) fail(`${location} must use schemaVersion 2.`);
  if (typeof data.name !== 'string' || !data.name.trim()) fail(`${location} requires a non-empty name.`);
  if (data.focus !== undefined && typeof data.focus !== 'string') fail(`${location} focus must be a string when provided.`);
  if (typeof data.website !== 'string') fail(`${location} website must be a string.`);
  if (!Array.isArray(data.problems)) fail(`${location} problems must be an array.`);

  const ids = new Set();
  for (const problem of data.problems) {
    if (!problem || typeof problem !== 'object' || Array.isArray(problem)) fail(`${location} has an invalid problem entry.`);
    validateProblemId(problem.id);
    if (ids.has(problem.id)) fail(`${location} contains duplicate problem id "${problem.id}".`);
    ids.add(problem.id);
    if (typeof problem.title !== 'string' || !problem.title.trim()) fail(`${location}: problem ${problem.id} requires a title.`);
    if (typeof problem.url !== 'string') fail(`${location}: problem ${problem.id} url must be a string.`);
    if (!validDifficulties.has(problem.difficulty)) fail(`${location}: problem ${problem.id} has invalid difficulty.`);
    if (!Object.prototype.hasOwnProperty.call(problem, 'personalDifficulty')) {
      fail(`${location}: problem ${problem.id} requires personalDifficulty.`);
    }
    validatePersonalDifficulty(problem.personalDifficulty, `${location}: problem ${problem.id}`);
    if (!validStatuses.has(problem.status)) fail(`${location}: problem ${problem.id} has invalid status.`);
    for (const field of ['time', 'space', 'notes']) {
      if (typeof problem[field] !== 'string') fail(`${location}: problem ${problem.id} ${field} must be a string.`);
    }

    const solutionPath = getSolutionPath(directory, problem.id);
    const solutionExists = fs.existsSync(solutionPath);
    if (solutionExists && !fs.statSync(solutionPath).isFile()) {
      fail(`${relativePath(solutionPath)} must be a Python file.`);
    }
    if (problem.status === 'planned' && solutionExists) {
      fail(`${relativePath(solutionPath)} exists, but its status is planned. Set it to in-progress or remove the file.`);
    }
    if (problem.status !== 'planned' && !solutionExists) {
      fail(`${location}: ${problem.status} problem ${problem.id} is missing its solution file.`);
    }

    let source;
    if (solutionExists) {
      source = fs.readFileSync(solutionPath, 'utf8');
      validateSolutionHeader(source, problem, relativePath(solutionPath));
    }
    if (problem.status === 'solved') {
      if (!problem.time.trim() || !problem.space.trim()) {
        fail(`${location}: solved problem ${problem.id} requires time and space complexity.`);
      }
      if (source.includes('TODO(company-solution)')) {
        fail(`${relativePath(solutionPath)} is marked solved but still contains TODO(company-solution).`);
      }
      if (!containsPythonCode(source)) {
        fail(`${relativePath(solutionPath)} is marked solved but does not contain a Python solution.`);
      }
    }
  }

  const solutionsDir = path.join(directory, 'solutions');
  if (fs.existsSync(solutionsDir)) {
    for (const entry of fs.readdirSync(solutionsDir, { withFileTypes: true })) {
      if (entry.isFile() && entry.name.endsWith('.py')) {
        const id = entry.name.slice(0, -3);
        if (!ids.has(id)) fail(`${relativePath(path.join(solutionsDir, entry.name))} is not registered in company.json.`);
      }
    }
  }
  if (slug !== path.basename(directory)) fail(`Invalid company directory for ${data.name}.`);
}

/**
 * Reject company directories that do not have a loaded manifest.
 * @param {Array<{slug: string}>} companies - Loaded company workspaces.
 */
function validateUnregisteredDirectories(companies) {
  const names = new Set(companies.map((company) => company.slug));
  if (!fs.existsSync(companiesDir)) return;
  for (const entry of fs.readdirSync(companiesDir, { withFileTypes: true })) {
    if (entry.isDirectory() && !entry.name.startsWith('.') && !names.has(entry.name)) {
      fail(`Unregistered company directory: companies/${entry.name}`);
    }
  }
}

/**
 * Render the repository-wide company preparation dashboard.
 * @param {Array<{slug: string, data: object}>} companies - Loaded company workspaces.
 * @returns {string}
 */
function renderCompaniesReadme(companies) {
  const totals = getTotals(companies);
  const rows = companies.length
    ? companies.map((company) => {
      const counts = getProblemCounts(company.data.problems);
      const companyLink = encodePath(`${company.slug}/README.md`);
      return `| [${escapeTable(company.data.name)}](${companyLink}) | ${counts.solved} / ${company.data.problems.length} | ${counts.inProgress} | ${counts.planned} |`;
    }).join('\n')
    : '| _No companies yet_ | 0 / 0 | 0 | 0 |';

  return `# Company interview preparation

[← Project README](../README.md) · [Solutions](../SOLUTIONS.md) · [Contributing](../CONTRIBUTING.md)

This directory contains focused preparation for upcoming OAs and technical interviews.

Company-specific attempts stay separate from the year-round NeetCode roadmap, so revisiting the same problem for a particular interview remains visible as an independent practice session.

## Progress

| Company | Solved | In progress | Planned |
|---|---:|---:|---:|
${rows}

**Total:** ${totals.solved} solved, ${totals.inProgress} in progress, and ${totals.planned} planned across ${companies.length} ${pluralize(companies.length, 'company', 'companies')}.

## Quick start

Run these commands from the repository root:

\`\`\`bash
# Create companies/amazon with its manifest and generated dashboard.
node scripts/company-tracker.js add-company "Amazon"

# Add a problem to the preparation plan.
# Numeric IDs default to the corresponding LeetCode problem URL.
node scripts/company-tracker.js add-problem amazon 1 "Two Sum" Easy --personal-difficulty 3

# Create companies/amazon/solutions/1.py and mark the problem in progress.
node scripts/company-tracker.js start amazon 1

# After implementing the solution and removing TODO(company-solution),
# record its time and space complexity.
node scripts/company-tracker.js solve amazon 1 --time "O(n)" --space "O(n)" --personal-difficulty 3
\`\`\`

Use \`--focus\` when the workspace targets a particular region, assessment, or interview stage:

\`\`\`bash
node scripts/company-tracker.js add-company "Roblox" --focus "US OA"
\`\`\`

Use \`--personal-difficulty\` to record a personal rating from 1 to 10, \`add-problem --url\` when the problem is not from LeetCode, and \`--notes\` for a short pattern, reminder, or review note.

Run \`node scripts/company-tracker.js --help\` to see every option.

## Folder layout

Each company gets a small tracked workspace containing its source metadata, generated progress page, and independent solutions:

\`\`\`text
companies/
└── amazon/
    ├── company.json       # problem metadata, status, and workspace settings
    ├── README.md          # generated company progress dashboard
    └── solutions/
        └── 1.py           # independent company-specific attempt
\`\`\`

\`company.json\` is the source of truth for each workspace.

Statuses follow \`planned → in-progress → solved\`. Personal difficulty is an optional rating from 1 to 10 and is separate from the platform difficulty. A solved entry must include its Python solution together with time and space complexity. The manifest, generated dashboard, and solutions are committed so preparation progress remains visible over time.

> [!IMPORTANT]
> Company README files are generated. Do not edit them directly.
>
> Update \`company.json\` through the tracker or the appropriate source data, then regenerate the documentation with:
>
> \`\`\`bash
> node scripts/company-tracker.js
> \`\`\`
`;
}

/**
 * Render the dashboard for one company workspace.
 * @param {{slug: string, data: object}} company - Loaded company workspace.
 * @returns {string}
 */
function renderCompanyReadme(company) {
  const { data, slug } = company;
  const counts = getProblemCounts(data.problems);
  const difficulties = getSolvedDifficultyCounts(data.problems);
  const heading = data.website ? `[${escapeMarkdown(data.name)}](${data.website})` : escapeMarkdown(data.name);
  const focus = data.focus ? `\n**Focus:** ${escapeMarkdown(data.focus)}\n` : '';
  const rows = data.problems.length
    ? data.problems.map((problem) => {
      const title = problem.url ? `[${escapeTable(problem.title)}](${problem.url})` : escapeTable(problem.title);
      const solution = problem.status === 'planned' ? '—' : `[${problem.id}.py](${encodePath(`solutions/${problem.id}.py`)})`;
      return `| ${escapeTable(problem.id)} | ${title} | ${problem.difficulty} | ${problem.personalDifficulty ?? '—'} | ${formatStatus(problem.status)} | ${solution} | ${escapeTable(problem.time || '—')} | ${escapeTable(problem.space || '—')} | ${escapeTable(problem.notes || '—')} |`;
    }).join('\n')
    : '| — | _No problems tracked yet_ | — | — | — | — | — | — | — |';

  return `# ${heading}

> This file is generated from [\`company.json\`](company.json). Do not edit it directly.

[← Companies](../README.md) · [Project README](../../README.md)
${focus}
## Progress

- **Solved:** ${counts.solved} / ${data.problems.length}
- **In progress:** ${counts.inProgress}
- **Planned:** ${counts.planned}

${renderDifficultyChart(difficulties, counts.solved).join('\n')}

| ID | Problem | Difficulty | Personal Difficulty | Status | Solution | Time | Space | Notes |
|---|---|:---:|:---:|:---:|---|---|---|---|
${rows}

## Commands

\`\`\`bash
node scripts/company-tracker.js add-problem ${slug} <id> "<title>" <Easy|Medium|Hard> [--personal-difficulty 1-10] [--url URL]
node scripts/company-tracker.js start ${slug} <id>
node scripts/company-tracker.js solve ${slug} <id> --time "O(...)" --space "O(...)" [--personal-difficulty 1-10]
\`\`\`
`;
}

/**
 * Render the company progress summary embedded in the root README.
 * @param {Array<{data: object}>} companies - Loaded company workspaces.
 * @returns {string}
 */
function renderRootSummary(companies) {
  if (!companies.length) {
    return 'No company plans yet. Create one with `node scripts/company-tracker.js add-company "Company Name"`.';
  }
  const totals = getTotals(companies);
  return `**${companies.length} ${pluralize(companies.length, 'company', 'companies')} · ${totals.solved} solved · ${totals.inProgress} in progress · ${totals.planned} planned**`;
}

/**
 * Render the company folder table embedded in the root README.
 * @param {Array<{slug: string, data: object}>} companies - Loaded company workspaces.
 * @returns {string}
 */
function renderRootCompanyList(companies) {
  const rows = companies.length
    ? companies.map((company) => {
      const folder = `companies/${company.slug}/`;
      return `| ${escapeTable(company.data.name)} | [\`${folder}\`](${encodePath(folder)}) |`;
    }).join('\n')
    : '| _No companies yet_ | — |';
  return `| Company | Folder |\n|---|---|\n${rows}`;
}

/**
 * Combine problem-status totals across company workspaces.
 * @param {Array<{data: object}>} companies - Loaded company workspaces.
 * @returns {{solved: number, inProgress: number, planned: number}}
 */
function getTotals(companies) {
  return companies.reduce((total, company) => {
    const counts = getProblemCounts(company.data.problems);
    total.solved += counts.solved;
    total.inProgress += counts.inProgress;
    total.planned += counts.planned;
    return total;
  }, { solved: 0, inProgress: 0, planned: 0 });
}

/**
 * Find a tracked problem by ID.
 * @param {{name: string, problems: Array<object>}} company - Company manifest data.
 * @param {string} id - Problem identifier.
 * @returns {object}
 */
function findProblem(company, id) {
  validateProblemId(id);
  const problem = company.problems.find((entry) => entry.id === id);
  if (!problem) fail(`Problem "${id}" is not tracked for ${company.name}.`);
  return problem;
}

/**
 * Build the path to a company solution file.
 * @param {string} directory - Company workspace directory.
 * @param {string} id - Problem identifier.
 * @returns {string}
 */
function getSolutionPath(directory, id) {
  return path.join(directory, 'solutions', `${id}.py`);
}

/**
 * Sort problem metadata in place by identifier.
 * @param {Array<{id: string}>} problems - Problems from a company manifest.
 */
function sortProblems(problems) {
  problems.sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
}

/**
 * Require a valid lowercase company directory slug.
 * @param {string} slug - Company slug to validate.
 */
function validateCompanySlug(slug) {
  validateSlug(slug, 'company slug');
}

/**
 * Format a manifest status for dashboard display.
 * @param {string} status - Tracked problem status.
 * @returns {string}
 */
function formatStatus(status) {
  if (status === 'solved') return 'Solved';
  if (status === 'in-progress') return 'In progress';
  return 'Planned';
}

/**
 * Build the tracker completion message with aggregate status totals.
 * @param {Array<{data: object}>} companies - Loaded company workspaces.
 * @param {string} prefix - Message prefix describing the completed operation.
 * @returns {string}
 */
function summaryMessage(companies, prefix) {
  const totals = getTotals(companies);
  return `${prefix} (${companies.length} ${pluralize(companies.length, 'company', 'companies')}; ${totals.solved} solved, ${totals.inProgress} in progress, ${totals.planned} planned).`;
}

/**
 * Print command-line usage information.
 */
function printHelp() {
  console.log(`Company interview preparation tracker

Usage:
  node scripts/company-tracker.js
  node scripts/company-tracker.js --check
  node scripts/company-tracker.js add-company "Company Name" [--slug slug] [--website URL] [--focus TEXT]
  node scripts/company-tracker.js add-problem <company> <id> "Title" <Easy|Medium|Hard> [--personal-difficulty 1-10] [--url URL] [--notes TEXT]
  node scripts/company-tracker.js start <company> <problem-id>
  node scripts/company-tracker.js solve <company> <problem-id> --time "O(...)" --space "O(...)" [--personal-difficulty 1-10] [--notes TEXT]

The default command regenerates company dashboards. The check command validates manifests,
solution files, and generated documentation without changing files.`);
}

/**
 * Stop the current command with a user-facing error.
 * @param {string} message - Error message.
 */
function fail(message) {
  throw new Error(message);
}

module.exports = { main };
