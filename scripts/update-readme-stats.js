#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const roadmapPath = path.join(root, 'data', 'roadmap.json');
const readmePath = path.join(root, 'README.md');
const solutionsPath = path.join(root, 'SOLUTIONS.md');
const solutionsDir = path.join(root, 'neetcode-all');
const checkOnly = process.argv[2] === '--check';
const validDifficulties = new Set(['Easy', 'Medium', 'Hard']);
const validStatuses = new Set(['planned', 'in-progress', 'solved']);
const difficultyColors = { Easy: '1f883d', Medium: 'd29922', Hard: 'd1242f' };
const topicColors = [
  '#277ace', '#ce2748', '#27ce35', '#6727ce', '#ce9627',
  '#27cec8', '#ce27a4', '#72ce27', '#2743ce', '#ce3d27',
  '#27ce6d', '#9e27ce', '#cece27', '#279cce', '#ce276d',
  '#3bce27', '#4327ce', '#ce7527',
];

if (process.argv.length > (checkOnly ? 3 : 2)) {
  fail('Usage: node scripts/update-readme-stats.js [--check]');
}

// Validate the source of truth and its solution files before generating anything.
const roadmap = readRoadmap();
validateRoadmap(roadmap);

// Planned and in-progress entries remain in JSON but do not count as completed.
const solved = roadmap.problems.filter((problem) => problem.status === 'solved');
const difficultyCounts = { Easy: 0, Medium: 0, Hard: 0 };
const topicCounts = new Map(roadmap.topics.map((topic) => [topic.slug, 0]));
for (const problem of solved) {
  difficultyCounts[problem.difficulty]++;
  topicCounts.set(problem.topic, topicCounts.get(problem.topic) + 1);
}

if (roadmap.topics.length > topicColors.length) {
  fail(`The topic chart needs ${roadmap.topics.length} colors, but only ${topicColors.length} are configured.`);
}

const chartTopics = roadmap.topics
  .map((topic, index) => ({ ...topic, index, count: topicCounts.get(topic.slug) }))
  .filter((topic) => topic.count > 0);
const roadmapTotal = roadmap.total;
const originalReadme = readRequiredFile(readmePath);
const eol = originalReadme.includes('\r\n') ? '\r\n' : '\n';
let updatedReadme = replaceBlock(originalReadme, 'solved-count', [
  `    <img src="https://img.shields.io/badge/NeetCode%20Solved-${solved.length}-brightgreen" alt="NeetCode solved problems: ${solved.length}" />`,
], '    ', eol);
updatedReadme = replaceBlock(updatedReadme, 'difficulty-chart', [
  '```mermaid',
  '%%{init: {"themeVariables": {"pie1": "#1f883d", "pie2": "#d29922", "pie3": "#d1242f"}}}%%',
  'pie showData',
  `    title Solved Problems by Difficulty (${solved.length} Total)`,
  `    "Easy" : ${difficultyCounts.Easy}`,
  `    "Medium" : ${difficultyCounts.Medium}`,
  `    "Hard" : ${difficultyCounts.Hard}`,
  '```',
], '', eol);
updatedReadme = replaceBlock(
  updatedReadme,
  'topic-chart',
  renderTopicChart(chartTopics, solved.length),
  '',
  eol,
);
updatedReadme = replaceBlock(
  updatedReadme,
  'topic-table',
  renderTopicTable(roadmap.topics, topicCounts, solved.length, roadmapTotal),
  '',
  eol,
);

// SOLUTIONS.md is fully generated; README.md retains prose outside its marker blocks.
const expectedFiles = [
  { path: solutionsPath, content: renderSolutions(solved) },
  { path: readmePath, content: updatedReadme },
];
const stale = expectedFiles.filter((file) => (
  !fs.existsSync(file.path) || fs.readFileSync(file.path, 'utf8') !== file.content
));
const summary = `${solved.length} solved: ${difficultyCounts.Easy} Easy, ${difficultyCounts.Medium} Medium, ${difficultyCounts.Hard} Hard across ${chartTopics.length} topics`;

if (checkOnly) {
  if (stale.length) {
    fail(`Generated roadmap documentation is outdated: ${stale.map(relativePath).join(', ')}. Run: node scripts/update-readme-stats.js`);
  }
  console.log(`Roadmap data and documentation are valid (${summary}).`);
} else {
  for (const file of stale) fs.writeFileSync(file.path, file.content);
  const action = stale.length ? 'Updated roadmap documentation' : 'Roadmap documentation already up to date';
  console.log(`${action} (${summary}).`);
}

/**
 * Read and parse the roadmap source of truth.
 * @returns {object}
 */
function readRoadmap() {
  if (!fs.existsSync(roadmapPath)) fail('Missing roadmap source: data/roadmap.json');
  try {
    return JSON.parse(fs.readFileSync(roadmapPath, 'utf8'));
  } catch (error) {
    fail(`Invalid JSON in data/roadmap.json: ${error.message}`);
  }
}

/**
 * Validate roadmap metadata and its relationship to solution files.
 * @param {object} roadmap - Parsed roadmap manifest.
 */
function validateRoadmap(roadmap) {
  assertObject(roadmap, 'data/roadmap.json');
  assertKeys(roadmap, ['schemaVersion', 'name', 'total', 'topics', 'problems'], 'data/roadmap.json');
  if (roadmap.schemaVersion !== 2) fail('data/roadmap.json schemaVersion must be 2.');
  assertNonemptyText(roadmap.name, 'Roadmap name');
  if (!Number.isInteger(roadmap.total) || roadmap.total < 0) {
    fail('data/roadmap.json total must be a non-negative integer.');
  }
  if (!Array.isArray(roadmap.topics) || !roadmap.topics.length) {
    fail('data/roadmap.json topics must be a non-empty array.');
  }
  if (!Array.isArray(roadmap.problems)) fail('data/roadmap.json problems must be an array.');

  const topicSlugs = new Set();
  const topicLabels = new Set();
  roadmap.topics.forEach((topic, index) => {
    const context = `Topic at index ${index}`;
    assertObject(topic, context);
    assertKeys(topic, ['slug', 'label', 'total'], context);
    if (typeof topic.slug !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(topic.slug)) {
      fail(`${context} has invalid slug "${topic.slug}"; use lowercase words separated by hyphens.`);
    }
    assertTableText(topic.label, `${context} label`);
    if (!Number.isInteger(topic.total) || topic.total < 0) fail(`${context} total must be a non-negative integer.`);
    if (topicSlugs.has(topic.slug)) fail(`Duplicate roadmap topic slug: ${topic.slug}`);
    if (topicLabels.has(topic.label)) fail(`Duplicate roadmap topic label: ${topic.label}`);
    topicSlugs.add(topic.slug);
    topicLabels.add(topic.label);
  });

  if (roadmap.problems.length > roadmap.total) {
    fail(`Roadmap has ${roadmap.problems.length} tracked problems but its total is only ${roadmap.total}.`);
  }

  const ids = new Set();
  let previousId = 0;
  const problemCounts = new Map(roadmap.topics.map((topic) => [topic.slug, 0]));
  const expectedSolutions = new Map();
  roadmap.problems.forEach((problem, index) => {
    const context = `Problem at index ${index}`;
    assertObject(problem, context);
    assertKeys(problem, [
      'id', 'title', 'url', 'topic', 'difficulty', 'personalDifficulty', 'status',
      'timeComplexity', 'spaceComplexity',
    ], context);
    if (!Number.isInteger(problem.id) || problem.id <= 0) fail(`${context} ID must be a positive integer.`);
    if (ids.has(problem.id)) fail(`Duplicate roadmap problem ID: ${problem.id}`);
    if (problem.id <= previousId) fail(`Roadmap problem IDs must be numerically ordered; found ${problem.id} after ${previousId}.`);
    ids.add(problem.id);
    previousId = problem.id;

    assertTableText(problem.title, `Problem ${problem.id} title`);
    validateProblemUrl(problem.url, problem.id);
    if (!topicSlugs.has(problem.topic)) fail(`Problem ${problem.id} has invalid topic "${problem.topic}".`);
    problemCounts.set(problem.topic, problemCounts.get(problem.topic) + 1);
    if (!validDifficulties.has(problem.difficulty)) {
      fail(`Problem ${problem.id} has invalid difficulty "${problem.difficulty}"; expected Easy, Medium, or Hard.`);
    }
    assertPersonalDifficulty(problem.personalDifficulty, `Problem ${problem.id}`);
    if (!validStatuses.has(problem.status)) {
      fail(`Problem ${problem.id} has invalid status "${problem.status}"; expected planned, in-progress, or solved.`);
    }
    assertComplexity(problem.timeComplexity, problem.id, 'time');
    assertComplexity(problem.spaceComplexity, problem.id, 'space');
    if (problem.status === 'solved' && (!problem.timeComplexity || !problem.spaceComplexity)) {
      fail(`Solved problem ${problem.id} must include time and space complexity.`);
    }

    const solutionPath = path.join(solutionsDir, problem.topic, `${problem.id}.py`);
    const solutionRelativePath = relativePath(solutionPath);
    const solutionExists = fs.existsSync(solutionPath);
    expectedSolutions.set(solutionRelativePath, problem);

    if (solutionExists && !fs.statSync(solutionPath).isFile()) {
      fail(`${solutionRelativePath} must be a Python file.`);
    }
    if (problem.status === 'planned' && solutionExists) {
      fail(`${solutionRelativePath} exists, but problem ${problem.id} is planned. Set it to in-progress or remove the file.`);
    }
    if (problem.status !== 'planned' && !solutionExists) {
      fail(`Missing solution file for ${problem.status} problem ${problem.id}: ${solutionRelativePath}`);
    }

    if (solutionExists) {
      const source = fs.readFileSync(solutionPath, 'utf8');
      validateSolutionHeader(source, problem, solutionRelativePath);
      if (problem.status === 'solved' && !containsPythonCode(source)) {
        fail(`${solutionRelativePath} is marked solved but does not contain a Python solution.`);
      }
    }
  });

  for (const topic of roadmap.topics) {
    const count = problemCounts.get(topic.slug);
    if (count > topic.total) {
      fail(`Topic "${topic.slug}" has ${count} tracked problems but its total is only ${topic.total}.`);
    }
  }

  for (const solutionPath of findPythonSolutions(solutionsDir)) {
    const relative = relativePath(solutionPath);
    if (!expectedSolutions.has(relative)) {
      fail(`Untracked roadmap solution file: ${relative}. Add it to data/roadmap.json or remove it.`);
    }
  }
}

/**
 * Render the generated solution catalog.
 * @param {object[]} problems - Solved roadmap problems.
 * @returns {string}
 */
function renderSolutions(problems) {
  const lines = [
    '# NeetCode All solutions',
    '',
    '[← Project README](README.md) · [Company preparation](companies/README.md) · [Contributing](CONTRIBUTING.md)',
    '',
    'Here are the NeetCode All problems I have finished so far, along with each solution, its official and personal difficulty, and a quick time and space complexity breakdown.',
    '',
    'Company-specific attempts live separately in the [company preparation dashboard](companies/README.md), keeping this list focused on progress through the main NeetCode All roadmap.',
    '',
    '<!-- Generated from data/roadmap.json by scripts/update-readme-stats.js. Do not edit directly. -->',
    '',
    '## Solution catalog',
    '',
    '| Problem | Title | File | Time Complexity | Space Complexity | Difficulty | Personal Difficulty |',
    '|---:|---|---|---|---|:---:|:---:|',
  ];
  for (const problem of problems) {
    const solutionPath = `neetcode-all/${problem.topic}/${problem.id}.py`;
    const color = difficultyColors[problem.difficulty];
    lines.push(`| ${problem.id} | [${problem.title}](${problem.url}) | [${problem.id}.py](${solutionPath}) | ${problem.timeComplexity} | ${problem.spaceComplexity} | ![${problem.difficulty}](https://img.shields.io/badge/${problem.difficulty}-${color}?style=flat-square) | ${problem.personalDifficulty ?? '—'} |`);
  }
  return `${lines.join('\n')}\n`;
}

/**
 * Generate a Mermaid pie chart. Mermaid has 12 native pie colors, so CSS extends
 * the palette for any remaining roadmap topics.
 * @param {Array<{label: string, count: number, index: number}>} topics - Completed roadmap topics.
 * @param {number} total - Total solved problems.
 * @returns {string[]}
 */
function renderTopicChart(topics, total) {
  if (!topics.length) return ['_No solved roadmap problems yet._'];

  const themeVariables = Object.fromEntries(
    topics.slice(0, 12).map((topic, index) => [`pie${index + 1}`, topicColors[topic.index]]),
  );
  const colorRules = topics.flatMap((topic, index) => {
    const color = topicColors[topic.index];
    return [
      `.pieCircle:nth-of-type(${index + 1}){fill:${color}!important}`,
      `.legend:nth-of-type(${index + 2}) rect{fill:${color}!important;stroke:${color}!important}`,
    ];
  });
  const config = { themeVariables, themeCSS: colorRules.join('') };

  return [
    '```mermaid',
    `%%{init: ${JSON.stringify(config)}}%%`,
    'pie showData',
    `    title Solved Problems by Topic (${total} Total)`,
    ...topics.map((topic) => `    "${escapeMermaidLabel(topic.label)}" : ${topic.count}`),
    '```',
  ];
}

/**
 * Render the complete generated topic table.
 * @param {object[]} topics - Ordered topic metadata.
 * @param {Map<string, number>} counts - Solved counts by topic slug.
 * @param {number} solvedTotal - Number of solved problems.
 * @param {number} roadmapTotal - Number of problems in the full roadmap snapshot.
 * @returns {string[]}
 */
function renderTopicTable(topics, counts, solvedTotal, roadmapTotal) {
  return [
    '| Topic | Solved | Total |',
    '|---|---:|---:|',
    ...topics.map((topic) => `| ${topic.label} | ${counts.get(topic.slug)} | ${topic.total} |`),
    `| **All topics** | <!-- progress-total:start -->**${solvedTotal}**<!-- progress-total:end --> | **${roadmapTotal}** |`,
  ];
}

/**
 * Validate the mandatory solution header.
 * @param {string} source - Solution source code.
 * @param {object} problem - Roadmap problem metadata.
 * @param {string} solutionPath - Repository-relative solution path.
 */
function validateSolutionHeader(source, problem, solutionPath) {
  const [header, separator] = source.split(/\r?\n/);
  const expected = `# ${problem.title} - ${problem.id}`;
  if (header !== expected || separator !== '') {
    fail(`${solutionPath} must begin with "${expected}" followed by a blank line.`);
  }
}

/**
 * Check whether a solution contains executable Python rather than only comments.
 * @param {string} source - Python source text.
 * @returns {boolean}
 */
function containsPythonCode(source) {
  return source.split(/\r?\n/).some((line) => {
    const trimmed = line.trim();
    return trimmed && !trimmed.startsWith('#');
  });
}

/**
 * Find Python solution files recursively.
 * @param {string} directory - Roadmap solution root.
 * @returns {string[]}
 */
function findPythonSolutions(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return findPythonSolutions(entryPath);
    return entry.isFile() && entry.name.endsWith('.py') ? [entryPath] : [];
  });
}

/**
 * Validate a canonical LeetCode problem URL.
 * @param {unknown} value - URL value.
 * @param {number} id - Problem ID for errors.
 */
function validateProblemUrl(value, id) {
  if (typeof value !== 'string' || value !== value.trim()) {
    fail(`Problem ${id} URL must be a string without leading or trailing whitespace.`);
  }
  let url;
  try {
    url = new URL(value);
  } catch {
    fail(`Problem ${id} has invalid URL "${value}".`);
  }
  if (
    url.protocol !== 'https:'
    || url.hostname !== 'leetcode.com'
    || url.port
    || url.username
    || url.password
    || url.search
    || url.hash
    || !/^\/problems\/[a-z0-9-]+\/$/.test(url.pathname)
  ) {
    fail(`Problem ${id} URL must be a canonical https://leetcode.com/problems/<slug>/ URL.`);
  }
}

/**
 * Validate a personal difficulty rating.
 * @param {unknown} value - Personal difficulty value.
 * @param {string} context - Human-readable problem identifier.
 */
function assertPersonalDifficulty(value, context) {
  if (value !== null && (!Number.isInteger(value) || value < 1 || value > 10)) {
    fail(`${context} personalDifficulty must be null or an integer from 1 to 10.`);
  }
}

/**
 * Validate one complexity field.
 * @param {unknown} value - Complexity text.
 * @param {number} id - Problem ID.
 * @param {string} kind - Complexity kind.
 */
function assertComplexity(value, id, kind) {
  if (typeof value !== 'string' || /[|\r\n]/.test(value)) {
    fail(`Problem ${id} ${kind}Complexity must be a single-line Markdown string without table separators.`);
  }
  if (value !== value.trim()) fail(`Problem ${id} ${kind}Complexity must not have leading or trailing whitespace.`);
}

/**
 * Validate text rendered directly in a Markdown table.
 * @param {unknown} value - Text value.
 * @param {string} context - Human-readable field name.
 */
function assertTableText(value, context) {
  assertNonemptyText(value, context);
  if (/[|\[\]\r\n]/.test(value)) fail(`${context} contains characters that cannot be rendered safely in the catalog.`);
}

/**
 * Validate a non-empty, trimmed string.
 * @param {unknown} value - Text value.
 * @param {string} context - Human-readable field name.
 */
function assertNonemptyText(value, context) {
  if (typeof value !== 'string' || !value.trim() || value !== value.trim()) {
    fail(`${context} must be a non-empty string without leading or trailing whitespace.`);
  }
}

/**
 * Validate a plain JSON object.
 * @param {unknown} value - Candidate object.
 * @param {string} context - Human-readable location.
 */
function assertObject(value, context) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail(`${context} must be an object.`);
}

/**
 * Reject missing and unknown keys so metadata typos fail clearly.
 * @param {object} value - Object to inspect.
 * @param {string[]} expected - Exact allowed keys.
 * @param {string} context - Human-readable location.
 */
function assertKeys(value, expected, context) {
  const missing = expected.filter((key) => !Object.prototype.hasOwnProperty.call(value, key));
  const unknown = Object.keys(value).filter((key) => !expected.includes(key));
  if (missing.length) fail(`${context} is missing required field(s): ${missing.join(', ')}.`);
  if (unknown.length) fail(`${context} has unknown field(s): ${unknown.join(', ')}.`);
}

/**
 * Replace a generated block in the README.
 * @param {string} content - Original README contents.
 * @param {string} name - Marker name.
 * @param {string[]} lines - Generated lines.
 * @param {string} indent - Marker indentation.
 * @param {string} eol - README line ending.
 * @returns {string}
 */
function replaceBlock(content, name, lines, indent, eol) {
  const start = `<!-- ${name}:start -->`;
  const end = `<!-- ${name}:end -->`;
  const pattern = new RegExp(`^[ \\t]*${start}[\\s\\S]*?^[ \\t]*${end}`, 'm');
  if (!pattern.test(content)) fail(`Missing README.md markers for "${name}".`);
  return content.replace(pattern, `${indent}${start}${eol}${lines.join(eol)}${eol}${indent}${end}`);
}

/**
 * Escape a value for use in a Mermaid label.
 * @param {string} value - Label value.
 * @returns {string}
 */
function escapeMermaidLabel(value) {
  return value.replace(/"/g, '#quot;');
}

/**
 * Read a required UTF-8 file.
 * @param {string} filePath - Absolute path.
 * @returns {string}
 */
function readRequiredFile(filePath) {
  if (!fs.existsSync(filePath)) fail(`Missing required file: ${relativePath(filePath)}`);
  return fs.readFileSync(filePath, 'utf8');
}

/**
 * Convert a file object or absolute path to a repository-relative path.
 * @param {string|{path: string}} value - Path value.
 * @returns {string}
 */
function relativePath(value) {
  const filePath = typeof value === 'string' ? value : value.path;
  return path.relative(root, filePath).split(path.sep).join('/');
}

/**
 * Fail the script with a clear error.
 * @param {string} message - Error text.
 */
function fail(message) {
  console.error(`Error: ${message}`);
  process.exit(1);
}
