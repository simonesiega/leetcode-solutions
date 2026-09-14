#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const readmePath = path.join(root, 'README.md');
const solutionsPath = path.join(root, 'SOLUTIONS.md');
const checkOnly = process.argv[2] === '--check';
const topicColors = [
  '#277ace', '#ce2748', '#27ce35', '#6727ce', '#ce9627',
  '#27cec8', '#ce27a4', '#72ce27', '#2743ce', '#ce3d27',
  '#27ce6d', '#9e27ce', '#cece27', '#279cce', '#ce276d',
  '#3bce27', '#4327ce', '#ce7527',
];

// Check the command-line arguments.
if (process.argv.length > (checkOnly ? 3 : 2)) fail('Usage: node scripts/update-readme-stats.js [--check]');

// Read the catalog and count solved problems by difficulty and roadmap topic.
const solutions = fs.readFileSync(solutionsPath, 'utf8');
const rows = solutions.split(/\r?\n/).filter((line) => /^\|\s*\d+\s*\|/.test(line));
const difficultyCounts = { Easy: 0, Medium: 0, Hard: 0 };
const topicCounts = new Map();
let previousId = 0;

if (!rows.length) fail('No solution rows found in SOLUTIONS.md.');
for (const row of rows) {
  const id = Number(row.match(/^\|\s*(\d+)\s*\|/)?.[1]);
  if (!id || id <= previousId) fail(`Solution IDs must be unique and numerically ordered: ${row}`);
  previousId = id;

  const title = row.match(/^\|\s*\d+\s*\|\s*\[([^\]]+)\]\([^)]+\)\s*\|/)?.[1];
  if (!title) fail(`Missing or invalid problem title: ${row}`);

  const difficulty = row.match(/!\[(Easy|Medium|Hard)\]/)?.[1];
  if (!difficulty) fail(`Missing or invalid difficulty: ${row}`);
  difficultyCounts[difficulty]++;

  const solutionMatch = row.match(/\]\((neetcode-all\/([^/)]+)\/([^/)]+\.py))\)/);
  if (!solutionMatch) fail(`Missing or invalid NeetCode solution path: ${row}`);
  if (solutionMatch[3] !== `${id}.py`) fail(`Solution filename must match problem ID ${id}: ${row}`);

  let solutionPath;
  let topic;
  try {
    solutionPath = decodeURIComponent(solutionMatch[1]);
    topic = decodeURIComponent(solutionMatch[2]);
  } catch {
    fail(`Invalid URL encoding in NeetCode solution path: ${row}`);
  }
  const absoluteSolutionPath = path.join(root, solutionPath);
  if (!fs.existsSync(absoluteSolutionPath)) fail(`Missing solution file: ${solutionPath}`);
  validateSolutionHeader(fs.readFileSync(absoluteSolutionPath, 'utf8'), title, id, solutionPath);

  const key = normalizeTopic(topic);
  topicCounts.set(key, (topicCounts.get(key) || 0) + 1);
}

// Read the README, including its manually maintained roadmap labels, order, and totals.
const total = rows.length;
const original = fs.readFileSync(readmePath, 'utf8');
const eol = original.includes('\r\n') ? '\r\n' : '\n';
const topics = readTopicMetadata(extractBlock(original, 'topic-table'));
if (topics.length > topicColors.length) {
  fail(`The topic chart needs ${topics.length} colors, but only ${topicColors.length} are configured.`);
}
for (const key of topicCounts.keys()) {
  if (!topics.some((topic) => topic.key === key)) {
    fail(`README.md topic table has no row matching solution folder "${key}".`);
  }
}

const chartTopics = topics
  .map((topic) => ({ ...topic, count: topicCounts.get(topic.key) || 0 }))
  .filter((topic) => topic.count > 0);
const solvedTopicCount = chartTopics.length;

// Update all generated README statistics and charts from SOLUTIONS.md.
let updated = replaceInlineBlock(original, 'progress-total', `**${total}**`);
updated = replaceBlock(updated, 'solved-count', [
  `    <img src="https://img.shields.io/badge/Solved-${total}-brightgreen" alt="Solved problems: ${total}" />`,
], '    ');
updated = replaceBlock(updated, 'difficulty-chart', [
  '```mermaid',
  '%%{init: {"themeVariables": {"pie1": "#1f883d", "pie2": "#d29922", "pie3": "#d1242f"}}}%%',
  'pie showData',
  `    title Solved Problems by Difficulty (${total} Total)`,
  `    "Easy" : ${difficultyCounts.Easy}`,
  `    "Medium" : ${difficultyCounts.Medium}`,
  `    "Hard" : ${difficultyCounts.Hard}`,
  '```',
]);
updated = replaceBlock(updated, 'topic-chart', renderTopicChart(chartTopics, total));
updated = updateTopicSolvedCounts(updated, topics, topicCounts);

const summary = `${total} total: ${difficultyCounts.Easy} Easy, ${difficultyCounts.Medium} Medium, ${difficultyCounts.Hard} Hard across ${solvedTopicCount} topics`;
if (checkOnly) {
  if (updated !== original) fail('README.md roadmap documentation is outdated. Run: node scripts/update-readme-stats.js');
  console.log(`Roadmap documentation is up to date (${summary}).`);
} else if (updated === original) {
  console.log(`Roadmap documentation already up to date (${summary}).`);
} else {
  fs.writeFileSync(readmePath, updated);
  console.log(`Updated roadmap documentation (${summary}).`);
}

function validateSolutionHeader(source, title, id, solutionPath) {
  const [header, separator] = source.split(/\r?\n/);
  const expected = `# ${title} - ${id}`;
  if (header !== expected || separator !== '') {
    fail(`${solutionPath} must begin with "${expected}" followed by a blank line.`);
  }
}

/**
 * Generate a Mermaid pie chart. Mermaid has 12 native pie colors, so CSS extends
 * the palette for any remaining roadmap topics.
 * @param {Array<{label: string, count: number, index: number}>} topics - Completed roadmap topics.
 * @param {number} total - Total solved problems.
 * @returns {string[]}
 */
function renderTopicChart(topics, total) {
  if (!topics.length || !total) fail('Cannot render a topic chart without solved problems.');

  const themeVariables = Object.fromEntries(
    topics.slice(0, 12)
      .map((topic, index) => [`pie${index + 1}`, topicColors[topic.index]]),
  );
  const colorRules = topics.flatMap((topic, index) => {
    const color = topicColors[topic.index];
    const rules = [
      `.legend:nth-of-type(${index + 2}) rect{fill:${color}!important;stroke:${color}!important}`,
    ];
    rules.unshift(`.pieCircle:nth-of-type(${index + 1}){fill:${color}!important}`);
    return rules;
  });
  const config = {
    themeVariables,
    themeCSS: colorRules.join(''),
  };

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
 * Extract a marker-delimited README block.
 * @param {string} content - README contents.
 * @param {string} name - Marker name.
 * @returns {string}
 */
function extractBlock(content, name) {
  const start = `<!-- ${name}:start -->`;
  const end = `<!-- ${name}:end -->`;
  const match = content.match(new RegExp(`${start}[\\s\\S]*?${end}`));
  if (!match) fail(`Missing README.md markers for "${name}".`);
  return match[0];
}

/**
 * Read topic labels and order from the roadmap table. The Total column stays manual.
 * @param {string} content - Topic table contents.
 * @returns {Array<{key: string, label: string, index: number}>}
 */
function readTopicMetadata(content) {
  const topics = [];
  for (const line of content.split(/\r?\n/)) {
    const match = line.match(/^\|\s*([^|*][^|]*?)\s*\|\s*\d+\s*\|\s*\d+\s*\|$/);
    if (!match) continue;
    const label = match[1].trim();
    const key = normalizeTopic(label);
    if (topics.some((topic) => topic.key === key)) fail(`Duplicate README.md topic row: ${label}`);
    topics.push({ key, label, index: topics.length });
  }
  if (!topics.length) fail('No roadmap topic rows found in README.md.');
  return topics;
}

/**
 * Update only the Solved column of each topic row.
 * @param {string} content - README contents.
 * @param {Array<{key: string, label: string}>} topics - Ordered topic metadata.
 * @param {Map<string, number>} counts - Solved counts keyed by normalized topic.
 * @returns {string}
 */
function updateTopicSolvedCounts(content, topics, counts) {
  const byKey = new Map(topics.map((topic) => [topic.key, topic]));
  return content.split(/\r?\n/).map((line) => {
    const match = line.match(/^\|\s*([^|*][^|]*?)\s*\|\s*\d+\s*\|\s*(\d+)\s*\|$/);
    if (!match) return line;
    const topic = byKey.get(normalizeTopic(match[1]));
    if (!topic) return line;
    return `| ${topic.label} | ${counts.get(topic.key) || 0} | ${match[2]} |`;
  }).join(eol);
}

/**
 * Normalize a topic name for consistent comparison.
 * @param {string} value - The topic name to normalize.
 * @returns {string}
 */
function normalizeTopic(value) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Escape a value for use in a Mermaid label.
 * @param {string} value - The value to escape.
 * @returns {string}
 */
function escapeMermaidLabel(value) {
  return value.replace(/"/g, '#quot;');
}

/**
 * Replace the value between a pair of inline README markers.
 * @param {string} content - The original content.
 * @param {string} name - The marker name.
 * @param {string} value - The new value.
 * @returns {string}
 */
function replaceInlineBlock(content, name, value) {
  const start = `<!-- ${name}:start -->`;
  const end = `<!-- ${name}:end -->`;
  const pattern = new RegExp(`${start}[\\s\\S]*?${end}`);
  if (!pattern.test(content)) fail(`Missing README.md markers for "${name}".`);
  return content.replace(pattern, `${start}${value}${end}`);
}

/**
 * Replace a generated block in the README.
 * @param {string} content - The original content.
 * @param {string} name - The marker name.
 * @param {string[]} lines - Generated lines.
 * @param {string} indent - Marker indentation.
 * @returns {string}
 */
function replaceBlock(content, name, lines, indent = '') {
  const start = `<!-- ${name}:start -->`;
  const end = `<!-- ${name}:end -->`;
  const pattern = new RegExp(`^[ \\t]*${start}[\\s\\S]*?^[ \\t]*${end}`, 'm');
  if (!pattern.test(content)) fail(`Missing README.md markers for "${name}".`);
  return content.replace(pattern, `${indent}${start}${eol}${lines.join(eol)}${eol}${indent}${end}`);
}

/**
 * Fail the script with an error message.
 * @param {string} message - The error message.
 */
function fail(message) {
  console.error(`Error: ${message}`);
  process.exit(1);
}
