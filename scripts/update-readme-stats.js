#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const readmePath = path.join(root, 'README.md');
const solutionsPath = path.join(root, 'SOLUTIONS.md');
const checkOnly = process.argv[2] === '--check';

if (process.argv.length > (checkOnly ? 3 : 2)) fail('Usage: node scripts/update-readme-stats.js [--check]');

const solutions = fs.readFileSync(solutionsPath, 'utf8');
const rows = solutions.split(/\r?\n/).filter((line) => /^\|\s*\d+\s*\|/.test(line));
const counts = { Easy: 0, Medium: 0, Hard: 0 };

if (!rows.length) fail('No solution rows found in SOLUTIONS.md.');
for (const row of rows) {
  const difficulty = row.match(/!\[(Easy|Medium|Hard)\]/)?.[1];
  if (!difficulty) fail(`Missing or invalid difficulty: ${row}`);
  counts[difficulty]++;
}

const total = rows.length;
const original = fs.readFileSync(readmePath, 'utf8');
const eol = original.includes('\r\n') ? '\r\n' : '\n';
let updated = replaceBlock(original, 'solved-count', [
  `    <img src="https://img.shields.io/badge/Solved-${total}-brightgreen" alt="Solved problems: ${total}" />`,
], '    ');

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

function replaceBlock(content, name, lines, indent = '') {
  const start = `<!-- ${name}:start -->`;
  const end = `<!-- ${name}:end -->`;
  const pattern = new RegExp(`^[ \\t]*${start}[\\s\\S]*?^[ \\t]*${end}`, 'm');
  if (!pattern.test(content)) fail(`Missing README.md markers for "${name}".`);
  return content.replace(pattern, `${indent}${start}${eol}${lines.join(eol)}${eol}${indent}${end}`);
}

function fail(message) {
  console.error(`Error: ${message}`);
  process.exit(1);
}
