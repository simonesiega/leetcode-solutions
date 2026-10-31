'use strict';

// Markdown block replacement, escaping, links, and shared chart rendering.

const personalDifficultyColors = [
  '#1f883d', '#3d9140', '#5c993f', '#7f9e3a', '#a39e32',
  '#c49225', '#d37a23', '#d76028', '#d5442d', '#d1242f',
];

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
  const markerPattern = (marker) => new RegExp(`^([ \\t]*)${escapeRegExp(marker)}[ \\t]*(?=\\r?$)`, 'gm');
  const startMatches = [...content.matchAll(markerPattern(start))];
  const endMatches = [...content.matchAll(markerPattern(end))];
  if (!startMatches.length || !endMatches.length) {
    throw new Error(`Missing README.md markers for "${name}".`);
  }
  if (startMatches.length !== 1 || endMatches.length !== 1 || startMatches[0].index > endMatches[0].index) {
    throw new Error(`README.md markers for "${name}" must form exactly one ordered pair.`);
  }

  const [startMatch] = startMatches;
  const [endMatch] = endMatches;
  const eol = content.includes('\r\n') ? '\r\n' : '\n';
  const indent = startMatch[1];
  const replacement = [start, ...lines, end].map((line) => `${indent}${line}`).join(eol);
  // Slice instead of String.replace so generated `$&`-style text is always treated literally.
  return content.slice(0, startMatch.index) + replacement + content.slice(endMatch.index + endMatch[0].length);
}

/**
 * Center a Mermaid diagram without preventing GitHub from parsing its fenced Markdown.
 * @param {string[]} lines - Mermaid source lines, without the code fence.
 * @returns {string[]}
 */
function renderMermaidChart(lines) {
  return ['<div align="center">', '', '```mermaid', ...lines, '```', '', '</div>'];
}

/**
 * Render the difficulty pie chart shared by roadmap and company dashboards.
 * @param {{Easy: number, Medium: number, Hard: number}} counts - Solved difficulty totals.
 * @param {number} total - Total solved problems represented by the chart.
 * @returns {string[]}
 */
function renderDifficultyChart(counts, total) {
  return renderMermaidChart([
    '%%{init: {"themeVariables": {"pie1": "#1f883d", "pie2": "#d29922", "pie3": "#d1242f"}}}%%',
    'pie showData',
    `    title Solved Problems by Difficulty (${total} Total)`,
    `    "Easy" : ${counts.Easy}`,
    `    "Medium" : ${counts.Medium}`,
    `    "Hard" : ${counts.Hard}`,
  ]);
}

/**
 * Render only used personal ratings in numeric order, excluding unrated problems from the total.
 * @param {number[]} counts - Ten validated rating counts, from rating 1 through 10.
 * @returns {string[]}
 */
function renderPersonalDifficultyChart(counts) {
  const ratings = counts.map((count, index) => ({
    label: `${index + 1}/10`, count, color: personalDifficultyColors[index],
  })).filter((rating) => rating.count > 0);
  if (!ratings.length) return ['_No personally rated solved roadmap problems yet._'];
  const total = ratings.reduce((sum, rating) => sum + rating.count, 0);
  return renderColoredPieChart(`Solved Problems by Personal Difficulty (${total} Rated)`, ratings);
}

/**
 * Render a non-empty pie with explicit slice and legend colors, including beyond Mermaid's palette.
 * @param {string} title - Chart title.
 * @param {Array<{label: string, count: number, color: string}>} slices - Ordered, non-zero slices.
 * @returns {string[]}
 */
function renderColoredPieChart(title, slices) {
  const themeVariables = Object.fromEntries(
    slices.slice(0, 12).map((slice, index) => [`pie${index + 1}`, slice.color]),
  );
  const colorRules = slices.flatMap((slice, index) => [
    `.pieCircle:nth-of-type(${index + 1}){fill:${slice.color}!important}`,
    `.legend:nth-of-type(${index + 2}) rect{fill:${slice.color}!important;stroke:${slice.color}!important}`,
  ]);
  const config = { themeVariables, themeCSS: colorRules.join('') };
  return renderMermaidChart([
    `%%{init: ${JSON.stringify(config)}}%%`,
    'pie showData',
    `    title ${title}`,
    ...slices.map((slice) => `    "${escapeMermaidLabel(slice.label)}" : ${slice.count}`),
  ]);
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
  renderColoredPieChart,
  renderDifficultyChart,
  renderMermaidChart,
  renderPersonalDifficultyChart,
  replaceBlock,
};
