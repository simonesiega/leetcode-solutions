'use strict';

// Repository-standard JSON reads, errors, formatting, and writes.
const fs = require('node:fs');
const { relativePath } = require('./paths');

/**
 * Read and parse a required UTF-8 JSON file with repository-relative errors.
 * @param {string} filePath - Absolute path to the JSON file.
 * @param {string} [missingMessage] - Optional domain-specific missing-file error.
 * @returns {unknown}
 */
function readJson(filePath, missingMessage) {
  if (!fs.existsSync(filePath)) {
    throw new Error(missingMessage || `Missing JSON file: ${relativePath(filePath)}`);
  }
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    throw new Error(`Invalid JSON in ${relativePath(filePath)}: ${error.message}`);
  }
}

/**
 * Write JSON using the repository's two-space indentation and final newline.
 * @param {string} filePath - Absolute destination path.
 * @param {unknown} value - JSON-serializable value.
 */
function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

module.exports = { readJson, writeJson };
