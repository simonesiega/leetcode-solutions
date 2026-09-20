'use strict';

// Shared Python solution headers, scaffolds, implementation checks, and file discovery.
const fs = require('node:fs');
const path = require('node:path');

/**
 * Build the mandatory one-line title and ID comment for a Python solution.
 * @param {{title: string, id: string|number}} problem - Problem metadata.
 * @returns {string}
 */
function solutionHeader(problem) {
  const oneLine = (value) => String(value).replace(/\r?\n/g, ' ');
  return `# ${oneLine(problem.title)} - ${oneLine(problem.id)}`;
}

/**
 * Require a solution to begin with its exact header followed by a blank line.
 * @param {string} source - Python source text.
 * @param {{title: string, id: string|number}} problem - Problem metadata.
 * @param {string} displayPath - Repository-relative path used in errors.
 */
function validateSolutionHeader(source, problem, displayPath) {
  const [header, separator] = source.split(/\r?\n/);
  const expected = solutionHeader(problem);
  if (header !== expected || separator !== '') {
    throw new Error(`${displayPath} must begin with "${expected}" followed by a blank line.`);
  }
}

/**
 * Detect executable-looking Python rather than an empty or comment-only file.
 * Syntax and semantic correctness remain the responsibility of Python checks and LeetCode.
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
 * Create a deliberately unfinished scaffold that cannot be marked solved unchanged.
 * @param {{title: string, id: string|number}} problem - Problem metadata.
 * @param {string} marker - Workflow-specific TODO marker.
 * @returns {string}
 */
function solutionTemplate(problem, marker) {
  return `${solutionHeader(problem)}\n\n# TODO(${marker}): implement the accepted solution, then remove this marker.\n`;
}

/**
 * Find Python files recursively below a solution root.
 * @param {string} directory - Absolute directory path.
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

module.exports = {
  containsPythonCode,
  findPythonSolutions,
  solutionTemplate,
  validateSolutionHeader,
};
