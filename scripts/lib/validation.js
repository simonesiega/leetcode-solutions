'use strict';

// Shared metadata validation for both trackers and roadmap generation.
const VALID_DIFFICULTIES = new Set(['Easy', 'Medium', 'Hard']);
const VALID_STATUSES = new Set(['planned', 'in-progress', 'solved']);

/**
 * Require a plain JSON object.
 * @param {unknown} value - Candidate value.
 * @param {string} context - Human-readable field location.
 */
function assertObject(value, context) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${context} must be an object.`);
  }
}

/**
 * Require exactly the expected object keys so metadata typos fail early.
 * @param {object} value - Object to inspect.
 * @param {string[]} expected - Complete allowed-key list.
 * @param {string} context - Human-readable field location.
 */
function assertKeys(value, expected, context) {
  const missing = expected.filter((key) => !Object.prototype.hasOwnProperty.call(value, key));
  const unknown = Object.keys(value).filter((key) => !expected.includes(key));
  if (missing.length) throw new Error(`${context} is missing required field(s): ${missing.join(', ')}.`);
  if (unknown.length) throw new Error(`${context} has unknown field(s): ${unknown.join(', ')}.`);
}

/**
 * Require trimmed, non-empty text.
 * @param {unknown} value - Candidate value.
 * @param {string} context - Human-readable field name.
 */
function assertNonemptyText(value, context) {
  if (
    typeof value !== 'string'
    || !value.trim()
    || value !== value.trim()
    || /[\u0000-\u001F\u007F]/.test(value)
  ) {
    throw new Error(`${context} must be non-empty, trimmed, single-line text without control characters.`);
  }
}

/**
 * Require non-empty text that can be rendered safely in the roadmap table.
 * @param {unknown} value - Candidate value.
 * @param {string} context - Human-readable field name.
 */
function assertTableText(value, context) {
  assertNonemptyText(value, context);
  if (/[|\[\]\r\n]/.test(value)) {
    throw new Error(`${context} contains characters that cannot be rendered safely in the catalog.`);
  }
}

/**
 * Require an unrated value or a personal difficulty from 1 through 10.
 * @param {unknown} value - Candidate rating.
 * @param {string} context - Human-readable problem identifier.
 */
function assertPersonalDifficulty(value, context) {
  if (value !== null && (!Number.isInteger(value) || value < 1 || value > 10)) {
    throw new Error(`${context} personalDifficulty must be null or an integer from 1 to 10.`);
  }
}

/**
 * Require a real calendar date in the repository's YYYY-MM-DD format.
 * @param {unknown} value - Candidate date.
 * @param {string} context - Human-readable field name.
 */
function assertDateOnly(value, context) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(`${context} must be a valid date in YYYY-MM-DD format.`);
  }
  const [year] = value.split('-').map(Number);
  const date = new Date(`${value}T00:00:00.000Z`);
  if (year === 0 || Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw new Error(`${context} must be a valid date in YYYY-MM-DD format.`);
  }
}

/**
 * Require a canonical UTC ISO timestamp representing a real instant.
 * @param {unknown} value - Candidate timestamp.
 * @param {string} context - Human-readable field name.
 */
function assertIsoInstant(value, context) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)) {
    throw new Error(`${context} must be a valid UTC ISO timestamp.`);
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime()) || date.toISOString() !== value || value.startsWith('0000-')) {
    throw new Error(`${context} must be a valid UTC ISO timestamp.`);
  }
}

/** Return the current instant in canonical UTC ISO format. */
function getCurrentIsoInstant() {
  return new Date().toISOString();
}

/**
 * Parse a strict personal-difficulty CLI value.
 * @param {string} value - Raw option value.
 * @returns {number}
 */
function parsePersonalDifficulty(value) {
  if (!/^(?:[1-9]|10)$/.test(value)) {
    throw new Error('Personal difficulty must be an integer from 1 to 10.');
  }
  return Number(value);
}

/**
 * Parse an optional `--personal-difficulty` value with a caller-selected fallback.
 * @param {Object<string, string>} options - Parsed CLI options.
 * @param {null|undefined} missingValue - Value returned when the option is absent.
 * @returns {number|null|undefined}
 */
function parseOptionalPersonalDifficulty(options, missingValue) {
  const value = options['personal-difficulty'];
  return value === undefined ? missingValue : parsePersonalDifficulty(value);
}

/**
 * Require one of the platform difficulty labels.
 * @param {unknown} value - Candidate difficulty.
 * @param {string} context - Human-readable problem identifier.
 * @param {boolean} [detailed=false] - Whether to include accepted values in the error.
 */
function assertDifficulty(value, context, detailed = false) {
  if (!VALID_DIFFICULTIES.has(value)) {
    const suffix = detailed ? ` "${value}"; expected Easy, Medium, or Hard.` : '.';
    throw new Error(`${context} has invalid difficulty${suffix}`);
  }
}

/**
 * Require one of the supported workflow statuses.
 * @param {unknown} value - Candidate status.
 * @param {string} context - Human-readable problem identifier.
 * @param {boolean} [detailed=false] - Whether to include accepted values in the error.
 */
function assertStatus(value, context, detailed = false) {
  if (!VALID_STATUSES.has(value)) {
    const suffix = detailed ? ` "${value}"; expected planned, in-progress, or solved.` : '.';
    throw new Error(`${context} has invalid status${suffix}`);
  }
}

/**
 * Require trimmed, single-line complexity text that is safe in a Markdown table.
 * @param {unknown} value - Complexity description.
 * @param {string} context - Human-readable field name.
 */
function assertComplexity(value, context) {
  if (typeof value !== 'string' || /[|\r\n]/.test(value)) {
    throw new Error(`${context} must be a single-line Markdown string without table separators.`);
  }
  if (value !== value.trim()) throw new Error(`${context} must not have leading or trailing whitespace.`);
}

/**
 * Require an HTTP or HTTPS URL without credentials.
 * @param {unknown} value - Candidate URL.
 * @param {string} context - Human-readable field name.
 * @param {boolean} [allowEmpty=false] - Whether an empty string is accepted.
 */
function assertHttpUrl(value, context, allowEmpty = false) {
  if (allowEmpty && value === '') return;
  if (
    typeof value !== 'string'
    || value !== value.trim()
    || /[\s\u007F]/u.test(value)
  ) {
    throw new Error(`${context} must be an HTTP or HTTPS URL without whitespace or control characters.`);
  }
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`${context} must be a valid HTTP or HTTPS URL.`);
  }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || !url.hostname) {
    throw new Error(`${context} must be a valid HTTP or HTTPS URL without credentials.`);
  }
}

/**
 * Require the canonical HTTPS LeetCode problem URL shape used by roadmap entries.
 * @param {unknown} value - Candidate URL.
 * @param {string} context - Human-readable problem identifier.
 */
function validateCanonicalLeetCodeUrl(value, context) {
  if (typeof value !== 'string' || value !== value.trim()) {
    throw new Error(`${context} URL must be a string without leading or trailing whitespace.`);
  }
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`${context} has invalid URL "${value}".`);
  }
  if (
    url.protocol !== 'https:'
    || url.hostname !== 'leetcode.com'
    || url.port
    || url.username
    || url.password
    || url.search
    || url.hash
    || !/^\/problems\/[a-z0-9-]+\/$/.test(url.pathname)
  ) {
    throw new Error(`${context} URL must be a canonical https://leetcode.com/problems/<slug>/ URL.`);
  }
}

/**
 * Check the lowercase, single-hyphen slug format used by repository folders.
 * @param {unknown} value - Candidate slug.
 * @returns {boolean}
 */
function isSlug(value) {
  return typeof value === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
}

/**
 * Require a safe repository folder slug.
 * @param {unknown} slug - Candidate slug.
 * @param {string} [context='slug'] - Slug type used in the error.
 */
function validateSlug(slug, context = 'slug') {
  if (!isSlug(slug)) {
    throw new Error(`Invalid ${context} "${slug}". Use lowercase letters, numbers, and single hyphens.`);
  }
}

/**
 * Require a company problem ID that is safe for use as a filename.
 * @param {unknown} id - Candidate identifier.
 */
function validateProblemId(id) {
  if (typeof id !== 'string' || !/^[A-Za-z0-9](?:[A-Za-z0-9._-]*[A-Za-z0-9])?$/.test(id)) {
    throw new Error(`Invalid problem id "${id}". Use letters, numbers, dots, underscores, or hyphens.`);
  }
}

/**
 * Parse a roadmap ID as a positive safe integer without accepting partial numbers.
 * @param {string} value - Raw positional value.
 * @returns {number}
 */
function parsePositiveIntegerId(value) {
  if (!/^[1-9]\d*$/.test(value)) throw new Error(`Invalid roadmap problem ID "${value}"; expected a positive integer.`);
  const id = Number(value);
  if (!Number.isSafeInteger(id)) throw new Error(`Invalid roadmap problem ID "${value}"; expected a positive integer.`);
  return id;
}

module.exports = {
  VALID_DIFFICULTIES,
  VALID_STATUSES,
  assertComplexity,
  assertDateOnly,
  assertDifficulty,
  assertHttpUrl,
  assertIsoInstant,
  assertKeys,
  assertNonemptyText,
  assertObject,
  assertPersonalDifficulty,
  assertStatus,
  assertTableText,
  getCurrentIsoInstant,
  isSlug,
  parseOptionalPersonalDifficulty,
  parsePositiveIntegerId,
  validateCanonicalLeetCodeUrl,
  validateProblemId,
  validateSlug,
};
