#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const readmePath = path.join(root, 'README.md');
const solutionsPath = path.join(root, 'SOLUTIONS.md');
const checkOnly = process.argv[2] === '--check';

// Check the command-line arguments.
if (process.argv.length > (checkOnly ? 3 : 2)) fail('Usage: node scripts/update-readme-stats.js [--check]');

// Read the SOLUTIONS.md file and count the number of problems solved by difficulty.
const solutions = fs.readFileSync(solutionsPath, 'utf8');
const rows = solutions.split(/\r?\n/).filter((line) => /^\|\s*\d+\s*\|/.test(line));
const counts = { Easy: 0, Medium: 0, Hard: 0 };

// Validate the rows and count the difficulties.
if (!rows.length) fail('No solution rows found in SOLUTIONS.md.');
for (const row of rows) {
  const difficulty = row.match(/!\[(Easy|Medium|Hard)\]/)?.[1];
  if (!difficulty) fail(`Missing or invalid difficulty: ${row}`);
  counts[difficulty]++;
}

// Read the README.md file and update the statistics blocks.
const total = rows.length;
const original = fs.readFileSync(readmePath, 'utf8');
const eol = original.includes('\r\n') ? '\r\n' : '\n';
let updated = replaceInlineBlock(original, 'progress-total', `**${total}**`);
updated = replaceBlock(updated, 'solved-count', [
  `    <img src="https://img.shields.io/badge/Solved-${total}-brightgreen" alt="Solved problems: ${total}" />`,
], '    ');

// Update the difficulty chart block in the README.md file.
updated = replaceBlock(updated, 'difficulty-chart', [
  '```mermaid',
  '%%{init: {"themeVariables": {"pie1": "#1f883d", "pie2": "#d29922", "pie3": "#d1242f"}}}%%',
  'pie showData',
  `    title Solved Problems by Difficulty (${total} Total)`,
  `    "Easy" : ${counts.Easy}`,
  `    "Medium" : ${counts.Medium}`,
  `    "Hard" : ${counts.Hard}`,
  '```',
]);

// Log the results and update the README.md file if necessary.
const summary = `${total} total: ${counts.Easy} Easy, ${counts.Medium} Medium, ${counts.Hard} Hard`;
if (checkOnly) {
  if (updated !== original) fail('README.md statistics are outdated. Run: node scripts/update-readme-stats.js');
  console.log(`README.md statistics are up to date (${summary}).`);
} else if (updated === original) {
  console.log(`README.md statistics already up to date (${summary}).`);
} else {
  fs.writeFileSync(readmePath, updated);
  console.log(`Updated README.md statistics (${summary}).`);
}

/**
 * Replace the value between a pair of inline README markers.
 * @param {*} content - The original content.
 * @param {*} name - The name of the marker.
 * @param {*} value - The new value.
 * @returns {string} - The updated content.
 */
function replaceInlineBlock(content, name, value) {
  const start = `<!-- ${name}:start -->`;
  const end = `<!-- ${name}:end -->`;
  const pattern = new RegExp(`${start}[\\s\\S]*?${end}`);
  if (!pattern.test(content)) fail(`Missing README.md markers for "${name}".`);
  return content.replace(pattern, `${start}${value}${end}`);
}

/**
 * Replace a block of text in the content.
 * @param {*} content - The original content.
 * @param {*} name - The name of the block to replace.
 * @param {*} lines - The new lines to insert.
 * @param {*} indent - The indentation to use.
 * @returns {string} - The updated content.
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
