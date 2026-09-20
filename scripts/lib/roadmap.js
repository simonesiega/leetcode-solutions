'use strict';

// Roadmap domain logic: validate the source of truth and render every derived document.
const fs = require('node:fs');
const path = require('node:path');
const { findStaleFiles, writeFiles } = require('./generated-files');
const { readJson } = require('./json');
const { escapeMermaidLabel, renderDifficultyChart, replaceBlock } = require('./markdown');
const { paths, relativePath } = require('./paths');
const { getSolvedDifficultyCounts } = require('./progress');
const {
  findPythonSolutions, validateSolutionFileState, validateSolutionHeader, validateSolvedSolution,
} = require('./solutions');
const {
  assertComplexity,
  assertDifficulty,
  assertKeys,
  assertNonemptyText,
  assertObject,
  assertPersonalDifficulty,
  assertStatus,
  assertTableText,
  isSlug,
  validateCanonicalLeetCodeUrl,
} = require('./validation');

const difficultyColors = { Easy: '1f883d', Medium: 'd29922', Hard: 'd1242f' };
// Colors follow the full topic order so a topic keeps its identity even when earlier counts are zero.
const topicColors = [
  '#277ace', '#ce2748', '#27ce35', '#6727ce', '#ce9627',
  '#27cec8', '#ce27a4', '#72ce27', '#2743ce', '#ce3d27',
  '#27ce6d', '#9e27ce', '#cece27', '#279cce', '#ce276d',
  '#3bce27', '#4327ce', '#ce7527',
];

/**
 * Read the roadmap source of truth.
 * @returns {object}
 */
function readRoadmap() {
  return readJson(paths.roadmap, 'Missing roadmap source: data/roadmap.json');
}

/**
 * Build the absolute solution path for a roadmap problem's registered topic.
 * @param {{id: number, topic: string}} problem - Roadmap problem metadata.
 * @returns {string}
 */
function getRoadmapSolutionPath(problem) {
  return path.join(paths.roadmapSolutions, problem.topic, `${problem.id}.py`);
}

/**
 * Validate roadmap metadata, ordering, capacities, and every tracked solution file.
 * Validation is intentionally side-effect free so check mode never changes the repository.
 * @param {object} roadmap - Parsed `data/roadmap.json` value.
 */
function validateRoadmap(roadmap) {
  assertObject(roadmap, 'data/roadmap.json');
  assertKeys(roadmap, ['schemaVersion', 'name', 'total', 'topics', 'problems'], 'data/roadmap.json');
  if (roadmap.schemaVersion !== 2) throw new Error('data/roadmap.json schemaVersion must be 2.');
  assertNonemptyText(roadmap.name, 'Roadmap name');
  if (!Number.isInteger(roadmap.total) || roadmap.total < 0) {
    throw new Error('data/roadmap.json total must be a non-negative integer.');
  }
  if (!Array.isArray(roadmap.topics) || !roadmap.topics.length) {
    throw new Error('data/roadmap.json topics must be a non-empty array.');
  }
  if (!Array.isArray(roadmap.problems)) throw new Error('data/roadmap.json problems must be an array.');

  const topicSlugs = new Set();
  const topicLabels = new Set();
  roadmap.topics.forEach((topic, index) => {
    const context = `Topic at index ${index}`;
    assertObject(topic, context);
    assertKeys(topic, ['slug', 'label', 'total'], context);
    if (!isSlug(topic.slug)) {
      throw new Error(`${context} has invalid slug "${topic.slug}"; use lowercase words separated by hyphens.`);
    }
    assertTableText(topic.label, `${context} label`);
    if (!Number.isInteger(topic.total) || topic.total < 0) {
      throw new Error(`${context} total must be a non-negative integer.`);
    }
    if (topicSlugs.has(topic.slug)) throw new Error(`Duplicate roadmap topic slug: ${topic.slug}`);
    if (topicLabels.has(topic.label)) throw new Error(`Duplicate roadmap topic label: ${topic.label}`);
    topicSlugs.add(topic.slug);
    topicLabels.add(topic.label);
  });

  if (roadmap.problems.length > roadmap.total) {
    throw new Error(`Roadmap has ${roadmap.problems.length} tracked problems but its total is only ${roadmap.total}.`);
  }

  const ids = new Set();
  let previousId = 0;
  const problemCounts = new Map(roadmap.topics.map((topic) => [topic.slug, 0]));
  // Track every registered path so the final filesystem scan can reject orphaned solutions.
  const expectedSolutions = new Map();
  roadmap.problems.forEach((problem, index) => {
    const context = `Problem at index ${index}`;
    assertObject(problem, context);
    assertKeys(problem, [
      'id', 'title', 'url', 'topic', 'difficulty', 'personalDifficulty', 'status',
      'timeComplexity', 'spaceComplexity',
    ], context);
    if (!Number.isInteger(problem.id) || problem.id <= 0) throw new Error(`${context} ID must be a positive integer.`);
    if (ids.has(problem.id)) throw new Error(`Duplicate roadmap problem ID: ${problem.id}`);
    if (problem.id <= previousId) {
      throw new Error(`Roadmap problem IDs must be numerically ordered; found ${problem.id} after ${previousId}.`);
    }
    ids.add(problem.id);
    previousId = problem.id;

    assertTableText(problem.title, `Problem ${problem.id} title`);
    validateCanonicalLeetCodeUrl(problem.url, `Problem ${problem.id}`);
    if (!topicSlugs.has(problem.topic)) throw new Error(`Problem ${problem.id} has invalid topic "${problem.topic}".`);
    problemCounts.set(problem.topic, problemCounts.get(problem.topic) + 1);
    assertDifficulty(problem.difficulty, `Problem ${problem.id}`, true);
    assertPersonalDifficulty(problem.personalDifficulty, `Problem ${problem.id}`);
    assertStatus(problem.status, `Problem ${problem.id}`, true);
    assertComplexity(problem.timeComplexity, `Problem ${problem.id} timeComplexity`);
    assertComplexity(problem.spaceComplexity, `Problem ${problem.id} spaceComplexity`);
    if (problem.status === 'solved' && (!problem.timeComplexity || !problem.spaceComplexity)) {
      throw new Error(`Solved problem ${problem.id} must include time and space complexity.`);
    }

    const solutionPath = getRoadmapSolutionPath(problem);
    const solutionRelativePath = relativePath(solutionPath);
    const solutionExists = validateSolutionFileState(
      solutionPath,
      solutionRelativePath,
      problem.status,
      {
        planned: `${solutionRelativePath} exists, but problem ${problem.id} is planned. Set it to in-progress or remove the file.`,
        missing: `Missing solution file for ${problem.status} problem ${problem.id}: ${solutionRelativePath}`,
      },
    );
    expectedSolutions.set(solutionRelativePath, problem);

    if (solutionExists) {
      const source = fs.readFileSync(solutionPath, 'utf8');
      if (problem.status === 'solved') {
        validateSolvedSolution(source, problem, solutionRelativePath, 'roadmap-solution');
      } else {
        validateSolutionHeader(source, problem, solutionRelativePath);
      }
    }
  });

  for (const topic of roadmap.topics) {
    const count = problemCounts.get(topic.slug);
    if (count > topic.total) {
      throw new Error(`Topic "${topic.slug}" has ${count} tracked problems but its total is only ${topic.total}.`);
    }
  }

  for (const solutionPath of findPythonSolutions(paths.roadmapSolutions)) {
    const relative = relativePath(solutionPath);
    if (!expectedSolutions.has(relative)) {
      throw new Error(`Untracked roadmap solution file: ${relative}. Add it to data/roadmap.json or remove it.`);
    }
  }
}

/**
 * Validate the roadmap and either regenerate or verify every derived roadmap document.
 * @param {boolean} [checkOnly=false] - Report drift without writing when true.
 */
function updateRoadmapDocumentation(checkOnly = false) {
  const roadmap = readRoadmap();
  validateRoadmap(roadmap);
  // Planned and in-progress entries remain in JSON but never inflate completion statistics.
  const solved = roadmap.problems.filter((problem) => problem.status === 'solved');
  const difficultyCounts = getSolvedDifficultyCounts(roadmap.problems);
  const topicCounts = new Map(roadmap.topics.map((topic) => [topic.slug, 0]));
  for (const problem of solved) topicCounts.set(problem.topic, topicCounts.get(problem.topic) + 1);

  if (roadmap.topics.length > topicColors.length) {
    throw new Error(`The topic chart needs ${roadmap.topics.length} colors, but only ${topicColors.length} are configured.`);
  }
  const chartTopics = roadmap.topics
    .map((topic, index) => ({ ...topic, index, count: topicCounts.get(topic.slug) }))
    .filter((topic) => topic.count > 0);

  if (!fs.existsSync(paths.readme)) throw new Error('Missing required file: README.md');
  const originalReadme = fs.readFileSync(paths.readme, 'utf8');
  let updatedReadme = replaceBlock(originalReadme, 'solved-count', [
    `<img src="https://img.shields.io/badge/NeetCode%20Solved-${solved.length}-brightgreen" alt="NeetCode solved problems: ${solved.length}" />`,
  ]);
  updatedReadme = replaceBlock(
    updatedReadme,
    'difficulty-chart',
    renderDifficultyChart(difficultyCounts, solved.length),
  );
  updatedReadme = replaceBlock(updatedReadme, 'topic-chart', renderTopicChart(chartTopics, solved.length));
  updatedReadme = replaceBlock(
    updatedReadme,
    'topic-table',
    renderTopicTable(roadmap.topics, topicCounts, solved.length, roadmap.total),
  );

  // SOLUTIONS.md is fully generated; README.md keeps all prose outside marker blocks.
  const expectedFiles = [
    { path: paths.solutionsCatalog, content: renderSolutions(roadmap.topics, solved) },
    { path: paths.readme, content: updatedReadme },
  ];
  const stale = findStaleFiles(expectedFiles);
  const summary = `${solved.length} solved: ${difficultyCounts.Easy} Easy, ${difficultyCounts.Medium} Medium, ${difficultyCounts.Hard} Hard across ${chartTopics.length} topics`;
  if (checkOnly) {
    if (stale.length) {
      throw new Error(`Generated roadmap documentation is outdated: ${stale.map(relativePath).join(', ')}. Run: node scripts/roadmap-tracker.js`);
    }
    console.log(`Roadmap data and documentation are valid (${summary}).`);
    return;
  }
  writeFiles(stale);
  const action = stale.length ? 'Updated roadmap documentation' : 'Roadmap documentation already up to date';
  console.log(`${action} (${summary}).`);
}

/**
 * Render the complete solved-problem catalog.
 * @param {object[]} topics - Ordered roadmap topics.
 * @param {object[]} problems - Solved roadmap problems in numeric order.
 * @returns {string}
 */
function renderSolutions(topics, problems) {
  const problemsByTopic = new Map(topics.map((topic) => [topic.slug, []]));
  for (const problem of problems) problemsByTopic.get(problem.topic).push(problem);
  const lines = [
    '# NeetCode All solutions',
    '',
    '[← Project README](README.md) · [Company preparation](companies/README.md) · [Contributing](CONTRIBUTING.md)',
    '',
    'Here are the NeetCode All problems I have finished so far, along with each solution, its official and personal difficulty, and a quick time and space complexity breakdown.',
    '',
    'Company-specific attempts live separately in the [company preparation dashboard](companies/README.md), keeping this list focused on progress through the main NeetCode All roadmap.',
    '',
    '<!-- Generated from data/roadmap.json by the roadmap automation. Do not edit directly. -->',
    '',
    `**Topics:** ${topics.map((topic) => `[${topic.label}](#${topic.slug})`).join(' · ')}`,
    '',
  ];
  for (const topic of topics) {
    const topicProblems = problemsByTopic.get(topic.slug);
    lines.push(`<a id="${topic.slug}"></a>`, '', `## ${topic.label}`, '');
    if (!topicProblems.length) {
      lines.push('_No solved problems in this topic yet._', '');
      continue;
    }
    lines.push(
      '| Problem | Title | File | Time Complexity | Space Complexity | Difficulty | Personal Difficulty |',
      '|---:|---|---|---|---|:---:|:---:|',
    );
    for (const problem of topicProblems) {
      const solutionPath = `neetcode-all/${problem.topic}/${problem.id}.py`;
      const color = difficultyColors[problem.difficulty];
      lines.push(`| ${problem.id} | [${problem.title}](${problem.url}) | [${problem.id}.py](${solutionPath}) | ${problem.timeComplexity} | ${problem.spaceComplexity} | ![${problem.difficulty}](https://img.shields.io/badge/${problem.difficulty}-${color}?style=flat-square) | ${problem.personalDifficulty ?? '—'} |`);
    }
    lines.push('');
  }
  return lines.join('\n');
}

/**
 * Render a Mermaid topic chart with stable colors from each topic's roadmap position.
 * @param {Array<{label: string, count: number, index: number}>} topics - Solved topic totals.
 * @param {number} total - Total solved problems.
 * @returns {string[]}
 */
function renderTopicChart(topics, total) {
  if (!topics.length) return ['_No solved roadmap problems yet._'];
  const themeVariables = Object.fromEntries(
    topics.slice(0, 12).map((topic, index) => [`pie${index + 1}`, topicColors[topic.index]]),
  );
  const colorRules = topics.flatMap((topic, index) => {
    const color = topicColors[topic.index];
    return [
      `.pieCircle:nth-of-type(${index + 1}){fill:${color}!important}`,
      `.legend:nth-of-type(${index + 2}) rect{fill:${color}!important;stroke:${color}!important}`,
    ];
  });
  const config = { themeVariables, themeCSS: colorRules.join('') };
  return [
    '```mermaid',
    `%%{init: ${JSON.stringify(config)}}%%`,
    'pie showData',
    `    title Solved Problems by Topic (${total} Total)`,
    ...topics.map((topic) => `    "${escapeMermaidLabel(topic.label)}" : ${topic.count}`),
    '```',
  ];
}

/**
 * Render the README progress table for all roadmap topics.
 * @param {object[]} topics - Ordered roadmap topics.
 * @param {Map<string, number>} counts - Solved counts keyed by topic slug.
 * @param {number} solvedTotal - Total solved problems.
 * @param {number} roadmapTotal - Configured roadmap size.
 * @returns {string[]}
 */
function renderTopicTable(topics, counts, solvedTotal, roadmapTotal) {
  return [
    '| Topic | Solved | Total | Solutions |',
    '|---|---:|---:|:---:|',
    ...topics.map((topic) => `| ${topic.label} | ${counts.get(topic.slug)} | ${topic.total} | [View](SOLUTIONS.md#${topic.slug}) |`),
    `| **All topics** | <!-- progress-total:start -->**${solvedTotal}**<!-- progress-total:end --> | **${roadmapTotal}** | [Browse all](SOLUTIONS.md) |`,
  ];
}

module.exports = {
  getRoadmapSolutionPath,
  readRoadmap,
  updateRoadmapDocumentation,
  validateRoadmap,
};
