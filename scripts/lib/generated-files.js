'use strict';

// Compare generated output with disk and write only files whose contents changed.
const fs = require('node:fs');

/**
 * Return generated files whose current contents differ from their expected contents.
 * @param {Array<{path: string, content: string}>} expectedFiles - Generated file definitions.
 * @returns {Array<{path: string, content: string}>}
 */
function findStaleFiles(expectedFiles) {
  return expectedFiles.filter((file) => (
    !fs.existsSync(file.path) || fs.readFileSync(file.path, 'utf8') !== file.content
  ));
}

/**
 * Write generated files that were previously identified as stale.
 * @param {Array<{path: string, content: string}>} files - Files to update.
 */
function writeFiles(files) {
  for (const file of files) fs.writeFileSync(file.path, file.content);
}

module.exports = { findStaleFiles, writeFiles };
