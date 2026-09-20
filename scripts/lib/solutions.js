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
 * Create a scaffold without replacing an existing solution.
 * @param {string} filePath - Absolute destination path.
 * @param {{title: string, id: string|number}} problem - Problem metadata.
 * @param {string} marker - Workflow-specific TODO marker.
 */
function createSolutionScaffold(filePath, problem, marker) {
  if (fs.existsSync(filePath)) return;
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, solutionTemplate(problem, marker));
}

/**
 * Validate a solution before a CLI marks it solved.
 * @param {string} source - Python source text.
 * @param {{title: string, id: string|number}} problem - Problem metadata.
 * @param {string} displayPath - Repository-relative path used in errors.
 * @param {string} marker - Workflow-specific TODO marker.
 */
function validateSolutionForSolve(source, problem, displayPath, marker) {
  validateSolutionImplementation(source, problem, displayPath, marker, false);
}

/**
 * Validate implementation requirements for metadata already marked solved.
 * @param {string} source - Python source text.
 * @param {{title: string, id: string|number}} problem - Problem metadata.
 * @param {string} displayPath - Repository-relative path used in errors.
 * @param {string} marker - Workflow-specific TODO marker.
 */
function validateSolvedSolution(source, problem, displayPath, marker) {
  validateSolutionImplementation(source, problem, displayPath, marker, true);
}

/** Apply common header, TODO, and implementation checks for either validation context. */
function validateSolutionImplementation(source, problem, displayPath, marker, alreadySolved) {
  validateSolutionHeader(source, problem, displayPath);
  const todo = `TODO(${marker})`;
  if (source.includes(todo)) {
    const message = alreadySolved
      ? `${displayPath} is marked solved but still contains ${todo}.`
      : `Finish ${displayPath} and remove the ${todo} marker before marking it solved.`;
    throw new Error(message);
  }
  if (!containsPythonCode(source)) {
    const message = alreadySolved
      ? `${displayPath} is marked solved but does not contain a Python solution.`
      : `${displayPath} does not contain a Python solution.`;
    throw new Error(message);
  }
}

/**
 * Enforce the shared relationship between a workflow status and its solution path.
 * Domain callers provide wording so errors retain roadmap or company context.
 * @param {string} filePath - Absolute solution path.
 * @param {string} displayPath - Repository-relative path used in errors.
 * @param {string} status - Planned, in-progress, or solved.
 * @param {{planned: string, missing: string}} messages - Domain-specific state errors.
 * @returns {boolean} Whether the solution exists.
 */
function validateSolutionFileState(filePath, displayPath, status, messages) {
  const exists = fs.existsSync(filePath);
  if (exists && !fs.statSync(filePath).isFile()) {
    throw new Error(`${displayPath} must be a Python file.`);
  }
  if (status === 'planned' && exists) throw new Error(messages.planned);
  if (status !== 'planned' && !exists) throw new Error(messages.missing);
  return exists;
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
  createSolutionScaffold,
  findPythonSolutions,
  validateSolutionFileState,
  validateSolutionForSolve,
  validateSolutionHeader,
  validateSolvedSolution,
};
