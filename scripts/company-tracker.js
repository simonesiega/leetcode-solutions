#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const companiesDir = path.join(root, 'companies');
const rootReadmePath = path.join(root, 'README.md');
const validStatuses = new Set(['planned', 'in-progress', 'solved']);
const validDifficulties = new Set(['Easy', 'Medium', 'Hard']);
const command = process.argv[2] || 'update';

// Keep every operation behind one dependency-free CLI so local usage and CI share the same rules.
try {
  switch (command) {
    case 'update':
      assertNoExtraArguments(3, 'node scripts/company-tracker.js [update]');
      updateDocumentation(false);
      break;
    case '--check':
    case 'check':
      assertNoExtraArguments(3, 'node scripts/company-tracker.js --check');
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
} catch (error) {
  fail(error.message);
}

// Command handlers update the manifest first, then regenerate every derived README.
function addCompany(args) {
  const { positionals, options } = parseArguments(args, new Set(['slug', 'website', 'focus']));
  if (positionals.length !== 1) {
    fail('Usage: node scripts/company-tracker.js add-company "Company Name" [--slug company-name] [--website URL] [--focus TEXT]');
  }

  const name = positionals[0].trim();
  const slug = options.slug || slugify(name);
  validateCompanySlug(slug);
  if (!name) fail('The company name cannot be empty.');

  const directory = path.join(companiesDir, slug);
  if (fs.existsSync(directory)) fail(`Company "${slug}" already exists.`);

  const solutionsDirectory = path.join(directory, 'solutions');
  fs.mkdirSync(solutionsDirectory, { recursive: true });
  fs.writeFileSync(path.join(solutionsDirectory, '.gitkeep'), '');
  writeJson(path.join(directory, 'company.json'), {
    schemaVersion: 1,
    name,
    focus: options.focus || '',
    website: options.website || '',
    problems: [],
  });
  updateDocumentation(false);
  console.log(`Created company workspace: companies/${slug}`);
}

function addProblem(args) {
  const { positionals, options } = parseArguments(args, new Set(['url', 'notes']));
  if (positionals.length !== 4) {
    fail('Usage: node scripts/company-tracker.js add-problem <company> <id> "Title" <Easy|Medium|Hard> [--url URL] [--notes TEXT]');
  }

  const [slug, id, title, difficulty] = positionals;
  validateProblemId(id);
  if (!title.trim()) fail('The problem title cannot be empty.');
  if (!validDifficulties.has(difficulty)) fail('Difficulty must be Easy, Medium, or Hard.');

  const company = readCompany(slug);
  if (company.data.problems.some((problem) => problem.id === id)) {
    fail(`Problem "${id}" is already tracked for ${company.data.name}.`);
  }

  company.data.problems.push({
    id,
    title: title.trim(),
    url: options.url || defaultProblemUrl(id, title),
    difficulty,
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
    fs.writeFileSync(solutionPath, solutionTemplate(company.data.name, problem));
  }
  const placeholderPath = path.join(path.dirname(solutionPath), '.gitkeep');
  if (fs.existsSync(placeholderPath)) fs.unlinkSync(placeholderPath);
  problem.status = 'in-progress';
  writeJson(company.manifestPath, company.data);
  updateDocumentation(false);
  console.log(`Started ${id} - ${problem.title}: ${relativePath(solutionPath)}`);
}

function solveProblem(args) {
  const { positionals, options } = parseArguments(args, new Set(['time', 'space', 'notes']));
  if (positionals.length !== 2 || !options.time || !options.space) {
    fail('Usage: node scripts/company-tracker.js solve <company> <problem-id> --time "O(...)" --space "O(...)" [--notes TEXT]');
  }

  const [slug, id] = positionals;
  const company = readCompany(slug);
  const problem = findProblem(company.data, id);
  const solutionPath = getSolutionPath(company.directory, id);
  if (!fs.existsSync(solutionPath)) {
    fail(`Missing solution ${relativePath(solutionPath)}. Run the start command first.`);
  }
  const source = fs.readFileSync(solutionPath, 'utf8');
  if (source.includes('TODO(company-solution)')) {
    fail(`Finish ${relativePath(solutionPath)} and remove the TODO(company-solution) marker before marking it solved.`);
  }
  if (!containsPythonCode(source)) {
    fail(`${relativePath(solutionPath)} does not contain a Python solution.`);
  }

  problem.status = 'solved';
  problem.time = options.time;
  problem.space = options.space;
  if (options.notes !== undefined) problem.notes = options.notes;
  writeJson(company.manifestPath, company.data);
  updateDocumentation(false);
  console.log(`Marked ${id} - ${problem.title} as solved for ${company.data.name}.`);
}

// Build the expected files in memory so update mode and --check use identical rendering logic.
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

  const stale = expectedFiles.filter((file) => !fs.existsSync(file.path) || fs.readFileSync(file.path, 'utf8') !== file.content);
  if (checkOnly) {
    if (stale.length) {
      fail(`Generated company documentation is outdated: ${stale.map((file) => relativePath(file.path)).join(', ')}. Run: node scripts/company-tracker.js`);
    }
    console.log(summaryMessage(companies, 'Company tracking is up to date'));
    return;
  }

  for (const file of stale) fs.writeFileSync(file.path, file.content);
  console.log(summaryMessage(companies, stale.length ? 'Updated company tracking' : 'Company tracking already up to date'));
}

// Only manifest-backed directories directly inside companies/ count as company workspaces.
function loadCompanies() {
  if (!fs.existsSync(companiesDir)) return [];
  return fs.readdirSync(companiesDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.'))
    .map((entry) => readCompany(entry.name))
    .sort((a, b) => a.data.name.localeCompare(b.data.name));
}

function readCompany(slug) {
  validateCompanySlug(slug);
  const directory = path.join(companiesDir, slug);
  const manifestPath = path.join(directory, 'company.json');
  if (!fs.existsSync(manifestPath)) fail(`Company "${slug}" does not exist (missing ${relativePath(manifestPath)}).`);

  let data;
  try {
    data = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  } catch (error) {
    fail(`Invalid JSON in ${relativePath(manifestPath)}: ${error.message}`);
  }
  return { slug, directory, manifestPath, data };
}

// Enforce the relationship between status and files before publishing generated progress.
function validateCompany(company) {
  const { data, slug, directory, manifestPath } = company;
  const location = relativePath(manifestPath);
  if (!data || typeof data !== 'object' || Array.isArray(data)) fail(`${location} must contain a JSON object.`);
  if (data.schemaVersion !== 1) fail(`${location} must use schemaVersion 1.`);
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
    if (problem.status === 'solved') {
      if (!problem.time.trim() || !problem.space.trim()) {
        fail(`${location}: solved problem ${problem.id} requires time and space complexity.`);
      }
      const source = fs.readFileSync(solutionPath, 'utf8');
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

function validateUnregisteredDirectories(companies) {
  const names = new Set(companies.map((company) => company.slug));
  if (!fs.existsSync(companiesDir)) return;
  for (const entry of fs.readdirSync(companiesDir, { withFileTypes: true })) {
    if (entry.isDirectory() && !entry.name.startsWith('.') && !names.has(entry.name)) {
      fail(`Unregistered company directory: companies/${entry.name}`);
    }
  }
}

// Render dashboards deterministically so CI can detect hand-edited or stale generated files.
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
node scripts/company-tracker.js add-problem amazon 1 "Two Sum" Easy

# Create companies/amazon/solutions/1.py and mark the problem in progress.
node scripts/company-tracker.js start amazon 1

# After implementing the solution and removing TODO(company-solution),
# record its time and space complexity.
node scripts/company-tracker.js solve amazon 1 --time "O(n)" --space "O(n)"
\`\`\`

Use \`--focus\` when the workspace targets a particular region, assessment, or interview stage:

\`\`\`bash
node scripts/company-tracker.js add-company "Roblox" --focus "US OA"
\`\`\`

Use \`add-problem --url\` when the problem is not from LeetCode, and \`--notes\` for a short pattern, reminder, or review note.

Run the following command to see all available options:

\`\`\`bash
node scripts/company-tracker.js --help
\`\`\`

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

Statuses follow \`planned → in-progress → solved\`. A solved entry must include its Python solution together with time and space complexity. The manifest, generated dashboard, and solutions are committed so preparation progress remains visible over time.

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
      return `| ${escapeTable(problem.id)} | ${title} | ${problem.difficulty} | ${formatStatus(problem.status)} | ${solution} | ${escapeTable(problem.time || '—')} | ${escapeTable(problem.space || '—')} | ${escapeTable(problem.notes || '—')} |`;
    }).join('\n')
    : '| — | _No problems tracked yet_ | — | — | — | — | — | — |';

  return `# ${heading}

> This file is generated from [\`company.json\`](company.json). Do not edit it directly.

[← Companies](../README.md) · [Project README](../../README.md)
${focus}
## Progress

- **Solved:** ${counts.solved} / ${data.problems.length}
- **In progress:** ${counts.inProgress}
- **Planned:** ${counts.planned}

\`\`\`mermaid
%%{init: {"themeVariables": {"pie1": "#1f883d", "pie2": "#d29922", "pie3": "#d1242f"}}}%%
pie showData
    title Solved Problems by Difficulty (${counts.solved} Total)
    "Easy" : ${difficulties.Easy}
    "Medium" : ${difficulties.Medium}
    "Hard" : ${difficulties.Hard}
\`\`\`

| ID | Problem | Difficulty | Status | Solution | Time | Space | Notes |
|---|---|:---:|:---:|---|---|---|---|
${rows}

## Commands

\`\`\`bash
node scripts/company-tracker.js add-problem ${slug} <id> "<title>" <Easy|Medium|Hard> [--url URL]
node scripts/company-tracker.js start ${slug} <id>
node scripts/company-tracker.js solve ${slug} <id> --time "O(...)" --space "O(...)"
\`\`\`
`;
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
    : '| _No companies yet_ | — |';
  return `| Company | Folder |\n|---|---|\n${rows}`;
}

function containsPythonCode(source) {
  return source.split(/\r?\n/).some((line) => {
    const trimmed = line.trim();
    return trimmed && !trimmed.startsWith('#');
  });
}

function solutionTemplate(companyName, problem) {
  const source = problem.url || 'Add the problem URL to company.json';
  const oneLine = (value) => String(value).replace(/\r?\n/g, ' ');
  return `# ${oneLine(problem.id)} - ${oneLine(problem.title)}\n# Company: ${oneLine(companyName)}\n# Problem: ${oneLine(source)}\n\n\n# TODO(company-solution): implement the accepted solution, then remove this marker.\n`;
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

function getProblemCounts(problems) {
  return problems.reduce((counts, problem) => {
    if (problem.status === 'solved') counts.solved++;
    else if (problem.status === 'in-progress') counts.inProgress++;
    else if (problem.status === 'planned') counts.planned++;
    return counts;
  }, { solved: 0, inProgress: 0, planned: 0 });
}

function getSolvedDifficultyCounts(problems) {
  return problems.reduce((counts, problem) => {
    if (problem.status === 'solved') counts[problem.difficulty]++;
    return counts;
  }, { Easy: 0, Medium: 0, Hard: 0 });
}

function findProblem(company, id) {
  validateProblemId(id);
  const problem = company.problems.find((entry) => entry.id === id);
  if (!problem) fail(`Problem "${id}" is not tracked for ${company.name}.`);
  return problem;
}

function getSolutionPath(directory, id) {
  return path.join(directory, 'solutions', `${id}.py`);
}

function sortProblems(problems) {
  problems.sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

// A small strict parser keeps the script dependency-free and rejects ambiguous options.
function parseArguments(args, allowedOptions) {
  const positionals = [];
  const options = {};
  for (let index = 0; index < args.length; index++) {
    const value = args[index];
    if (!value.startsWith('--')) {
      positionals.push(value);
      continue;
    }
    const name = value.slice(2);
    if (!allowedOptions.has(name)) fail(`Unknown option --${name}.`);
    if (options[name] !== undefined) fail(`Option --${name} was provided more than once.`);
    if (index + 1 >= args.length || args[index + 1].startsWith('--')) fail(`Option --${name} requires a value.`);
    options[name] = args[++index];
  }
  return { positionals, options };
}

// Replace only marked generated regions while preserving each block's existing indentation and EOL style.
function replaceBlock(content, name, lines) {
  const start = `<!-- ${name}:start -->`;
  const end = `<!-- ${name}:end -->`;
  const pattern = new RegExp(`^([ \\t]*)${start}[\\s\\S]*?^[ \\t]*${end}`, 'm');
  const match = content.match(pattern);
  if (!match) fail(`Missing README.md markers for "${name}".`);
  const eol = content.includes('\r\n') ? '\r\n' : '\n';
  const indent = match[1];
  const replacement = [start, ...lines, end].map((line) => `${indent}${line}`).join(eol);
  return content.replace(pattern, replacement);
}

function slugify(value) {
  return value.trim().toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function validateCompanySlug(slug) {
  if (typeof slug !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    fail(`Invalid company slug "${slug}". Use lowercase letters, numbers, and single hyphens.`);
  }
}

function validateProblemId(id) {
  if (typeof id !== 'string' || !/^[A-Za-z0-9](?:[A-Za-z0-9._-]*[A-Za-z0-9])?$/.test(id)) {
    fail(`Invalid problem id "${id}". Use letters, numbers, dots, underscores, or hyphens.`);
  }
}

function defaultProblemUrl(id, title) {
  if (!/^\d+$/.test(id)) return '';
  return `https://leetcode.com/problems/${slugify(title)}/`;
}

function formatStatus(status) {
  if (status === 'solved') return '✅ Solved';
  if (status === 'in-progress') return '🟡 In progress';
  return '⬜ Planned';
}

function escapeMarkdown(value) {
  return String(value).replace(/([\\[\]])/g, '\\$1');
}

function escapeTable(value) {
  return escapeMarkdown(value).replace(/\|/g, '\\|').replace(/\r?\n/g, '<br>');
}

function encodePath(value) {
  return value.split('/').map(encodeURIComponent).join('/');
}

function pluralize(count, singular, plural) {
  return count === 1 ? singular : plural;
}

function relativePath(filePath) {
  return path.relative(root, filePath).split(path.sep).join('/');
}

function summaryMessage(companies, prefix) {
  const totals = getTotals(companies);
  return `${prefix} (${companies.length} ${pluralize(companies.length, 'company', 'companies')}; ${totals.solved} solved, ${totals.inProgress} in progress, ${totals.planned} planned).`;
}

function assertNoExtraArguments(maxLength, usage) {
  if (process.argv.length > maxLength) fail(`Usage: ${usage}`);
}

function printHelp() {
  console.log(`Company interview preparation tracker

Usage:
  node scripts/company-tracker.js
  node scripts/company-tracker.js --check
  node scripts/company-tracker.js add-company "Company Name" [--slug slug] [--website URL] [--focus TEXT]
  node scripts/company-tracker.js add-problem <company> <id> "Title" <Easy|Medium|Hard> [--url URL] [--notes TEXT]
  node scripts/company-tracker.js start <company> <problem-id>
  node scripts/company-tracker.js solve <company> <problem-id> --time "O(...)" --space "O(...)" [--notes TEXT]

The default command regenerates company dashboards. The check command validates manifests,
solution files, and generated documentation without changing files.`);
}

function fail(message) {
  console.error(`Error: ${message}`);
  process.exit(1);
}
