'use strict';

// Canonical repository paths shared by production commands and disposable test fixtures.
const path = require('node:path');

// Resolve from this module so every CLI behaves the same regardless of the caller's cwd.
const root = path.resolve(__dirname, '..', '..');

// Centralizing repository paths keeps fixtures and production commands on the same layout.
const paths = Object.freeze({
  root,
  roadmap: path.join(root, 'data', 'roadmap.json'),
  readme: path.join(root, 'README.md'),
  solutionsCatalog: path.join(root, 'SOLUTIONS.md'),
  roadmapSolutions: path.join(root, 'neetcode-all'),
  companies: path.join(root, 'companies'),
});

/**
 * Convert an absolute file path to a slash-delimited repository-relative path.
 * @param {string|{path: string}} value - Absolute path or generated-file definition.
 * @returns {string}
 */
function relativePath(value) {
  const filePath = typeof value === 'string' ? value : value.path;
  return path.relative(root, filePath).split(path.sep).join('/');
}

module.exports = { paths, relativePath };
