#!/usr/bin/env node
'use strict';

// Main roadmap CLI: move problems through planned, in-progress, and solved states.
const fs = require('node:fs');
const path = require('node:path');
const { assertNoExtraArguments, parseArguments, runCli } = require('./lib/cli');
const { writeJson } = require('./lib/json');
const { paths, relativePath } = require('./lib/paths');
const {
  getRoadmapSolutionPath,
  readRoadmap,
  updateRoadmapDocumentation,
  validateRoadmap,
} = require('./lib/roadmap');
const { containsPythonCode, solutionTemplate, validateSolutionHeader } = require('./lib/solutions');
const {
  VALID_DIFFICULTIES,
  assertComplexity,
  assertTableText,
  parsePersonalDifficulty,
  parsePositiveIntegerId,
  validateCanonicalLeetCodeUrl,
} = require('./lib/validation');

/** Dispatch the requested roadmap tracker command. */
function main() {
  const command = process.argv[2] || 'update';
  switch (command) {
    case 'update':
      assertNoExtraArguments(process.argv, 3, 'node scripts/roadmap-tracker.js [update]');
      updateRoadmapDocumentation(false);
      break;
    case '--check':
    case 'check':
      assertNoExtraArguments(process.argv, 3, 'node scripts/roadmap-tracker.js --check');
      updateRoadmapDocumentation(true);
      break;
    case 'add':
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
      throw new Error(`Unknown command "${command}". Run with --help for usage.`);
  }
}

// Importing the tracker is side-effect free; only direct CLI execution dispatches commands.
if (require.main === module) runCli(main);

/**
 * Register a planned roadmap problem and regenerate derived documentation.
 * @param {string[]} args - Arguments after `add`.
 */
function addProblem(args) {
  const { positionals, options } = parseArguments(args, new Set(['url', 'personal-difficulty']));
  if (positionals.length !== 4 || !options.url) {
    throw new Error('Usage: node scripts/roadmap-tracker.js add <id> "Title" <topic-slug> <Easy|Medium|Hard> --url URL [--personal-difficulty 1-10]');
  }
  const [rawId, rawTitle, topic, difficulty] = positionals;
  const id = parsePositiveIntegerId(rawId);
  const title = rawTitle.trim();
  assertTableText(title, `Problem ${id} title`);
  validateCanonicalLeetCodeUrl(options.url, `Problem ${id}`);
  if (!VALID_DIFFICULTIES.has(difficulty)) throw new Error('Difficulty must be Easy, Medium, or Hard.');
  const personalDifficulty = options['personal-difficulty'] === undefined
    ? null
    : parsePersonalDifficulty(options['personal-difficulty']);

  const roadmap = readRoadmap();
  validateRoadmap(roadmap);
  if (roadmap.problems.some((problem) => problem.id === id)) {
    throw new Error(`Roadmap problem ${id} is already tracked.`);
  }
  const topicMetadata = roadmap.topics.find((entry) => entry.slug === topic);
  if (!topicMetadata) throw new Error(`Unknown roadmap topic "${topic}".`);
  const topicCount = roadmap.problems.filter((problem) => problem.topic === topic).length;
  if (roadmap.problems.length >= roadmap.total) throw new Error(`Roadmap already tracks its configured total of ${roadmap.total} problems.`);
  if (topicCount >= topicMetadata.total) {
    throw new Error(`Topic "${topic}" already tracks its configured total of ${topicMetadata.total} problems.`);
  }

  roadmap.problems.push({
    id,
    title,
    url: options.url,
    topic,
    difficulty,
    personalDifficulty,
    status: 'planned',
    timeComplexity: '',
    spaceComplexity: '',
  });
  // Keep the manifest deterministic regardless of the order in which problems are added.
  roadmap.problems.sort((a, b) => a.id - b.id);
  writeJson(paths.roadmap, roadmap);
  updateRoadmapDocumentation(false);
  console.log(`Added ${id} - ${title} to ${topic} as planned.`);
}

/**
 * Create the topic-specific scaffold and move a planned problem to in progress.
 * Existing files are never overwritten.
 * @param {string[]} args - Arguments after `start`.
 */
function startProblem(args) {
  const { positionals, options } = parseArguments(args, new Set());
  if (Object.keys(options).length || positionals.length !== 1) {
    throw new Error('Usage: node scripts/roadmap-tracker.js start <problem-id>');
  }
  const id = parsePositiveIntegerId(positionals[0]);
  const roadmap = readRoadmap();
  validateRoadmap(roadmap);
  const problem = findProblem(roadmap, id);
  if (problem.status === 'solved') throw new Error(`Roadmap problem ${id} is already solved.`);

  const solutionPath = getRoadmapSolutionPath(problem);
  if (!fs.existsSync(solutionPath)) {
    fs.mkdirSync(path.dirname(solutionPath), { recursive: true });
    fs.writeFileSync(solutionPath, solutionTemplate(problem, 'roadmap-solution'));
  }
  problem.status = 'in-progress';
  writeJson(paths.roadmap, roadmap);
  updateRoadmapDocumentation(false);
  console.log(`Started ${id} - ${problem.title}: ${relativePath(solutionPath)}`);
}

/**
 * Validate an implemented solution, record complexity, and mark the problem solved.
 * @param {string[]} args - Arguments after `solve`.
 */
function solveProblem(args) {
  const { positionals, options } = parseArguments(args, new Set(['time', 'space', 'personal-difficulty']));
  if (positionals.length !== 1 || !options.time || !options.space) {
    throw new Error('Usage: node scripts/roadmap-tracker.js solve <problem-id> --time "O(...)" --space "O(...)" [--personal-difficulty 1-10]');
  }
  const id = parsePositiveIntegerId(positionals[0]);
  assertComplexity(options.time, `Problem ${id} timeComplexity`);
  assertComplexity(options.space, `Problem ${id} spaceComplexity`);
  const personalDifficulty = options['personal-difficulty'] === undefined
    ? undefined
    : parsePersonalDifficulty(options['personal-difficulty']);

  const roadmap = readRoadmap();
  validateRoadmap(roadmap);
  const problem = findProblem(roadmap, id);
  const solutionPath = getRoadmapSolutionPath(problem);
  if (!fs.existsSync(solutionPath)) {
    throw new Error(`Missing solution ${relativePath(solutionPath)}. Run the start command first.`);
  }
  const source = fs.readFileSync(solutionPath, 'utf8');
  validateSolutionHeader(source, problem, relativePath(solutionPath));
  // The workflow-specific marker prevents an untouched scaffold from counting as solved.
  if (source.includes('TODO(roadmap-solution)')) {
    throw new Error(`Finish ${relativePath(solutionPath)} and remove the TODO(roadmap-solution) marker before marking it solved.`);
  }
  if (!containsPythonCode(source)) throw new Error(`${relativePath(solutionPath)} does not contain a Python solution.`);

  problem.status = 'solved';
  problem.timeComplexity = options.time;
  problem.spaceComplexity = options.space;
  if (personalDifficulty !== undefined) problem.personalDifficulty = personalDifficulty;
  writeJson(paths.roadmap, roadmap);
  updateRoadmapDocumentation(false);
  console.log(`Marked ${id} - ${problem.title} as solved.`);
}

/**
 * Find a tracked roadmap problem by numeric ID.
 * @param {{problems: object[]}} roadmap - Parsed roadmap metadata.
 * @param {number} id - Numeric LeetCode ID.
 * @returns {object}
 */
function findProblem(roadmap, id) {
  const problem = roadmap.problems.find((entry) => entry.id === id);
  if (!problem) throw new Error(`Roadmap problem ${id} is not tracked.`);
  return problem;
}

/** Print command-line usage information. */
function printHelp() {
  console.log(`NeetCode roadmap tracker

Usage:
  node scripts/roadmap-tracker.js
  node scripts/roadmap-tracker.js --check
  node scripts/roadmap-tracker.js add <id> "Title" <topic-slug> <Easy|Medium|Hard> --url URL [--personal-difficulty 1-10]
  node scripts/roadmap-tracker.js start <problem-id>
  node scripts/roadmap-tracker.js solve <problem-id> --time "O(...)" --space "O(...)" [--personal-difficulty 1-10]

The default command regenerates roadmap documentation. The check command validates metadata,
solution files, and generated documentation without changing files.`);
}

module.exports = { main };
