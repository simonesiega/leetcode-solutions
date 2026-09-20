'use strict';

// Markdown block replacement, escaping, links, and shared chart rendering.

/**
 * Replace one marker-delimited generated block while preserving indentation and EOL style.
 * @param {string} content - Complete Markdown document.
 * @param {string} name - Marker name without the `:start` or `:end` suffix.
 * @param {string[]} lines - Generated lines inserted between the markers.
 * @returns {string}
 */
function replaceBlock(content, name, lines) {
  const start = `<!-- ${name}:start -->`;
  const end = `<!-- ${name}:end -->`;
  const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const markerPattern = (marker) => new RegExp(`^[ \\t]*${escapeRegExp(marker)}[ \\t]*\\r?$`, 'gm');
  const startMatches = [...content.matchAll(markerPattern(start))];
  const endMatches = [...content.matchAll(markerPattern(end))];
  if (!startMatches.length || !endMatches.length) {
    throw new Error(`Missing README.md markers for "${name}".`);
  }
  if (startMatches.length !== 1 || endMatches.length !== 1 || startMatches[0].index > endMatches[0].index) {
    throw new Error(`README.md markers for "${name}" must form exactly one ordered pair.`);
  }

  const pattern = new RegExp(
    `^([ \\t]*)${escapeRegExp(start)}[ \\t]*\\r?$[\\s\\S]*?^[ \\t]*${escapeRegExp(end)}[ \\t]*\\r?$`,
    'm',
  );
  const match = content.match(pattern);
  const eol = content.includes('\r\n') ? '\r\n' : '\n';
  const indent = match[1];
  const replacement = [start, ...lines, end].map((line) => `${indent}${line}`).join(eol);
  // Slice instead of String.replace so generated `$&`-style text is always treated literally.
  return content.slice(0, match.index) + replacement + content.slice(match.index + match[0].length);
}

/**
 * Render the difficulty pie chart shared by roadmap and company dashboards.
 * @param {{Easy: number, Medium: number, Hard: number}} counts - Solved difficulty totals.
 * @param {number} total - Total solved problems represented by the chart.
 * @returns {string[]}
 */
function renderDifficultyChart(counts, total) {
  return [
    '```mermaid',
    '%%{init: {"themeVariables": {"pie1": "#1f883d", "pie2": "#d29922", "pie3": "#d1242f"}}}%%',
    'pie showData',
    `    title Solved Problems by Difficulty (${total} Total)`,
    `    "Easy" : ${counts.Easy}`,
    `    "Medium" : ${counts.Medium}`,
    `    "Hard" : ${counts.Hard}`,
    '```',
  ];
}

/**
 * Escape double quotes inside a Mermaid quoted label.
 * @param {string} value - Label text.
 * @returns {string}
 */
function escapeMermaidLabel(value) {
  return value.replace(/"/g, '#quot;');
}

/**
 * Escape Markdown characters used by generated links and tables.
 * @param {unknown} value - Value rendered as text.
 * @returns {string}
 */
function escapeMarkdown(value) {
  return String(value).replace(/([\\[\]])/g, '\\$1');
}

/**
 * Escape Markdown table delimiters and convert line breaks to HTML breaks.
 * @param {unknown} value - Table cell value.
 * @returns {string}
 */
function escapeTable(value) {
  return escapeMarkdown(value).replace(/\|/g, '\\|').replace(/\r?\n/g, '<br>');
}

/** Encode URL characters that would otherwise terminate a Markdown link destination. */
function escapeLinkDestination(value) {
  const encoded = { '(': '%28', ')': '%29', '<': '%3C', '>': '%3E' };
  return String(value).replace(/[()<>]/g, (character) => encoded[character]);
}

/**
 * URL-encode each segment of a slash-delimited repository path.
 * @param {string} value - Repository-relative path.
 * @returns {string}
 */
function encodePath(value) {
  return value.split('/').map(encodeURIComponent).join('/');
}

/** Format a validated YYYY-MM-DD date for prose without depending on the local timezone. */
function formatDateOnly(value) {
  const [year, month, day] = value.split('-').map(Number);
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  return `${months[month - 1]} ${day}, ${year}`;
}

/**
 * Select a singular or plural label for a count.
 * @param {number} count - Quantity controlling the label.
 * @param {string} singular - Singular label.
 * @param {string} plural - Plural label.
 * @returns {string}
 */
function pluralize(count, singular, plural) {
  return count === 1 ? singular : plural;
}

module.exports = {
  encodePath,
  escapeLinkDestination,
  escapeMarkdown,
  escapeMermaidLabel,
  escapeTable,
  formatDateOnly,
  pluralize,
  renderDifficultyChart,
  replaceBlock,
};
