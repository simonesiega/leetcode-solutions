'use strict';

// Dependency-free argument parsing and consistent top-level CLI error handling.

/**
 * Parse positional values and a strict allowlist of long options.
 * Options consume exactly one following value; boolean flags are intentionally unsupported.
 * @param {string[]} args - Arguments after the command name.
 * @param {Set<string>} allowedOptions - Long option names without the `--` prefix.
 * @returns {{positionals: string[], options: Object<string, string>}}
 */
function parseArguments(args, allowedOptions) {
  const positionals = [];
  const options = {};
  for (let index = 0; index < args.length; index++) {
    const value = args[index];
    if (!value.startsWith('--')) {
      positionals.push(value);
      continue;
    }
    const name = value.slice(2);
    if (!allowedOptions.has(name)) throw new Error(`Unknown option --${name}.`);
    if (options[name] !== undefined) throw new Error(`Option --${name} was provided more than once.`);
    if (index + 1 >= args.length || args[index + 1].startsWith('--')) {
      throw new Error(`Option --${name} requires a value.`);
    }
    options[name] = args[++index];
  }
  return { positionals, options };
}

/**
 * Convert display text to the lowercase hyphenated form used by folder and URL slugs.
 * @param {string} value - Text to normalize.
 * @returns {string}
 */
function slugify(value) {
  return value.trim().toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

/**
 * Reject trailing arguments for commands that do not accept options or positionals.
 * @param {string[]} argv - Full process argument vector.
 * @param {number} maxLength - Maximum accepted vector length.
 * @param {string} usage - Usage text included in the error.
 */
function assertNoExtraArguments(argv, maxLength, usage) {
  if (argv.length > maxLength) throw new Error(`Usage: ${usage}`);
}

/**
 * Run a CLI entry point and convert synchronous or asynchronous failures to concise errors.
 * @param {() => void|Promise<void>} main - Command dispatcher.
 */
async function runCli(main) {
  try {
    await main();
  } catch (error) {
    // Preserve concise CLI output even if a dependency rejects with a non-Error value.
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Error: ${message}`);
    process.exitCode = 1;
  }
}

module.exports = { assertNoExtraArguments, parseArguments, runCli, slugify };
