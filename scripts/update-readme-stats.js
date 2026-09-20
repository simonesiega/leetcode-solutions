#!/usr/bin/env node
'use strict';

// Backwards-compatible entry point for roadmap validation and documentation generation.
const { assertNoExtraArguments, runCli } = require('./lib/cli');
const { updateRoadmapDocumentation } = require('./lib/roadmap');

/** Run the backwards-compatible roadmap documentation generator. */
function main() {
  const checkOnly = process.argv[2] === '--check';
  assertNoExtraArguments(
    process.argv,
    checkOnly ? 3 : 2,
    'node scripts/update-readme-stats.js [--check]',
  );
  updateRoadmapDocumentation(checkOnly);
}

// Importing the legacy entry point must not validate or rewrite the repository.
if (require.main === module) runCli(main);

module.exports = { main };
