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
  const pattern = new RegExp(`^([ \\t]*)${start}[\\s\\S]*?^[ \\t]*${end}`, 'm');
  const match = content.match(pattern);
  if (!match) throw new Error(`Missing README.md markers for "${name}".`);
  const eol = content.includes('\r\n') ? '\r\n' : '\n';
  const indent = match[1];
  const replacement = [start, ...lines, end].map((line) => `${indent}${line}`).join(eol);
  return content.replace(pattern, replacement);
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

/**
 * URL-encode each segment of a slash-delimited repository path.
 * @param {string} value - Repository-relative path.
 * @returns {string}
 */
function encodePath(value) {
  return value.split('/').map(encodeURIComponent).join('/');
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
  escapeMarkdown,
  escapeMermaidLabel,
  escapeTable,
  pluralize,
  renderDifficultyChart,
  replaceBlock,
};
