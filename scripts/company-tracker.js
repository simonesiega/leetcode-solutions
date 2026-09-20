#!/usr/bin/env node
'use strict';

// Thin company CLI: parse commands and delegate state, source, and rendering work.
const {
  assertNoExtraArguments, parseArguments, runCli, slugify,
} = require('./lib/cli');
const {
  addManualProblem,
  addSourceProblem,
  createCompanyWorkspace,
  readCompany,
  solveCompanyProblem,
  startCompanyProblem,
  updateCompanyDocumentation,
  validateCompany,
} = require('./lib/company');
const {
  findSourceProblem,
  getNextSourceProblem,
  loadCompanySource,
  syncCompanySource,
} = require('./lib/company-source');
const { parseOptionalPersonalDifficulty } = require('./lib/validation');

/** Dispatch the requested company tracker command. */
async function main() {
  const command = process.argv[2] || 'update';
  switch (command) {
    case 'update':
      assertNoExtraArguments(process.argv, 3, 'node scripts/company-tracker.js [update]');
      updateCompanyDocumentation(false);
      break;
    case '--check':
    case 'check':
      assertNoExtraArguments(process.argv, 3, 'node scripts/company-tracker.js --check');
      updateCompanyDocumentation(true);
      break;
    case 'add-company':
      addCompanyCommand(process.argv.slice(3));
      break;
    case 'add-problem':
      addProblemCommand(process.argv.slice(3));
      break;
    case 'start':
      startCommand(process.argv.slice(3));
      break;
    case 'solve':
      solveCommand(process.argv.slice(3));
      break;
    case 'source-sync':
      await sourceSyncCommand(process.argv.slice(3));
      break;
    case 'next':
      nextCommand(process.argv.slice(3));
      break;
    case 'add-from-source':
      addFromSourceCommand(process.argv.slice(3));
      break;
    case 'help':
    case '--help':
    case '-h':
      printHelp();
      break;
    default:
      throw new Error(`Unknown command "${command}". Run with --help for usage.`);
  }
}

if (require.main === module) runCli(main);

function addCompanyCommand(args) {
  const { positionals, options } = parseArguments(args, new Set(['slug', 'website', 'focus']));
  if (positionals.length !== 1) {
    throw new Error('Usage: node scripts/company-tracker.js add-company "Company Name" [--slug company-name] [--website URL] [--focus TEXT]');
  }
  const name = positionals[0].trim();
  if (!name) throw new Error('The company name cannot be empty.');
  console.log(createCompanyWorkspace({
    name,
    slug: options.slug || slugify(name),
    website: options.website || '',
    focus: options.focus || '',
  }));
}

function addProblemCommand(args) {
  const { positionals, options } = parseArguments(args, new Set(['url', 'notes', 'personal-difficulty']));
  if (positionals.length !== 4) {
    throw new Error('Usage: node scripts/company-tracker.js add-problem <company> <id> "Title" <Easy|Medium|Hard> [--personal-difficulty 1-10] [--url URL] [--notes TEXT]');
  }
  const [slug, id, rawTitle, difficulty] = positionals;
  const title = rawTitle.trim();
  console.log(addManualProblem(slug, {
    id,
    title,
    difficulty,
    personalDifficulty: parseOptionalPersonalDifficulty(options, null),
    url: options.url,
    notes: options.notes || '',
  }));
}

function startCommand(args) {
  const { positionals } = parseArguments(args, new Set());
  if (positionals.length !== 2) {
    throw new Error('Usage: node scripts/company-tracker.js start <company> <problem-id>');
  }
  console.log(startCompanyProblem(positionals[0], positionals[1]));
}

function solveCommand(args) {
  const { positionals, options } = parseArguments(args, new Set(['time', 'space', 'notes', 'personal-difficulty']));
  if (positionals.length !== 2 || !options.time?.trim() || !options.space?.trim()) {
    throw new Error('Usage: node scripts/company-tracker.js solve <company> <problem-id> --time "O(...)" --space "O(...)" [--personal-difficulty 1-10] [--notes TEXT]');
  }
  console.log(solveCompanyProblem(positionals[0], positionals[1], {
    time: options.time,
    space: options.space,
    personalDifficulty: parseOptionalPersonalDifficulty(options, undefined),
    notes: options.notes,
  }));
}

async function sourceSyncCommand(args) {
  const { positionals, options } = parseArguments(args, new Set(['file']));
  if (positionals.length !== 1) {
    throw new Error('Usage: node scripts/company-tracker.js source-sync <company> [--file CSV]');
  }
  const company = readValidatedCompany(positionals[0]);
  const result = await syncCompanySource(company, options.file);
  console.log(`Cached ${result.problems.length} source problems for ${company.data.name}.`);
}

function nextCommand(args) {
  const { positionals } = parseArguments(args, new Set());
  if (positionals.length !== 1) {
    throw new Error('Usage: node scripts/company-tracker.js next <company>');
  }
  const company = readValidatedCompany(positionals[0]);
  const problem = getNextSourceProblem(company, loadCompanySource(company));
  if (!problem) {
    console.log(`Every cached source problem is already tracked for ${company.data.name}.`);
    return;
  }
  console.log(`#${problem.sourceRank} ${problem.title} | ${problem.frequency}% | ${problem.difficulty} | ${problem.sourceKey} | ${problem.url}`);
}

function addFromSourceCommand(args) {
  const { positionals, options } = parseArguments(
    args,
    new Set(['id', 'notes', 'personal-difficulty']),
  );
  if (positionals.length !== 2) {
    throw new Error('Usage: node scripts/company-tracker.js add-from-source <company> <source-key> [--id problem-id] [--personal-difficulty 1-10] [--notes TEXT]');
  }
  const [slug, sourceKey] = positionals;
  const company = readValidatedCompany(slug);
  const problem = findSourceProblem(loadCompanySource(company), sourceKey);
  if (!problem) throw new Error(`Source problem "${sourceKey}" was not found in the cached list for ${company.data.name}.`);
  console.log(addSourceProblem(company, problem, {
    id: options.id || problem.sourceKey,
    personalDifficulty: parseOptionalPersonalDifficulty(options, null),
    notes: options.notes || '',
  }));
}

function readValidatedCompany(slug) {
  const company = readCompany(slug);
  validateCompany(company);
  return company;
}

function printHelp() {
  console.log(`Company interview preparation tracker

Usage:
  node scripts/company-tracker.js
  node scripts/company-tracker.js --check
  node scripts/company-tracker.js add-company "Company Name" [--slug slug] [--website URL] [--focus TEXT]
  node scripts/company-tracker.js add-problem <company> <id> "Title" <Easy|Medium|Hard> [--personal-difficulty 1-10] [--url URL] [--notes TEXT]
  node scripts/company-tracker.js start <company> <problem-id>
  node scripts/company-tracker.js solve <company> <problem-id> --time "O(...)" --space "O(...)" [--personal-difficulty 1-10] [--notes TEXT]
  node scripts/company-tracker.js source-sync <company> [--file CSV]
  node scripts/company-tracker.js next <company>
  node scripts/company-tracker.js add-from-source <company> <source-key> [--id problem-id] [--personal-difficulty 1-10] [--notes TEXT]

Source commands use the exact provenance pinned in company.json. Normal validation and generated
documentation never fetch external data.`);
}

module.exports = { main };
