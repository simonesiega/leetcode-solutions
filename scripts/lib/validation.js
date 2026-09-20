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
  if (typeof value !== 'string' || !value.trim() || value !== value.trim()) {
    throw new Error(`${context} must be a non-empty string without leading or trailing whitespace.`);
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
  assertDifficulty,
  assertKeys,
  assertNonemptyText,
  assertObject,
  assertPersonalDifficulty,
  assertStatus,
  assertTableText,
  isSlug,
  parsePersonalDifficulty,
  parsePositiveIntegerId,
  validateCanonicalLeetCodeUrl,
  validateProblemId,
  validateSlug,
};
