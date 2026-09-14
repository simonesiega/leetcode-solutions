'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { afterEach, test } = require('node:test');

const topicFixtures = [
  ['Arrays & Hashing', 'arrays&hashing', 175],
  ['Two Pointers', 'twopointers', 43],
  ['Sliding Window', 'slidingwindow', 41],
  ['Stack', 'stack', 39],
  ['Binary Search', 'binarysearch', 43],
  ['Linked List', 'linkedlist', 40],
  ['Trees', 'trees', 93],
  ['Heap / Priority Queue', 'heap&priorityqueue', 33],
  ['Backtracking', 'backtracking', 36],
  ['Tries', 'tries', 12],
  ['Graphs', 'graphs', 71],
  ['Advanced Graphs', 'advancedgraphs', 30],
  ['1-D Dynamic Programming', '1-ddynamicprogramming', 55],
  ['2-D Dynamic Programming', '2-ddynamicprogramming', 50],
  ['Greedy', 'greedy', 67],
  ['Intervals', 'intervals', 21],
  ['Math & Geometry', 'math&geometry', 63],
  ['Bit Manipulation', 'bitmanipulation', 31],
];
const fixtures = [];

afterEach(() => {
  while (fixtures.length) fs.rmSync(fixtures.pop(), { recursive: true, force: true });
});

test('generates roadmap counts and a Mermaid topic chart', () => {
  const root = createRepository([0, 1, 0]);

  run(root, []);
  run(root, ['--check']);

  const readme = fs.readFileSync(path.join(root, 'README.md'), 'utf8');
  assert.match(readme, /Solved-3-brightgreen/);
  assert.match(readme, /title Solved Problems by Difficulty \(3 Total\)/);
  assert.match(readme, /\| Arrays & Hashing \| 2 \| 175 \|/);
  assert.match(readme, /\| Two Pointers \| 1 \| 43 \|/);
  assert.match(readme, /title Solved Problems by Topic \(3 Total\)/);
  assert.match(readme, /"Arrays & Hashing" : 2/);
  assert.match(readme, /"Two Pointers" : 1/);
  assert.doesNotMatch(readme, /"Sliding Window" : 0/);
  assert.doesNotMatch(readme, /"Bit Manipulation" : 0/);
  assert.doesNotMatch(readme, /assets\/neetcode-topic-progress\.svg/);

  const config = readTopicChartConfig(readme);
  assert.equal(Object.keys(config.themeVariables).length, 2);
  const colors = JSON.stringify(config).match(/#[0-9a-f]{6}/g);
  assert.equal(new Set(colors).size, 2);
});

test('supports a unique configured color for every roadmap topic', () => {
  const root = createRepository(topicFixtures.map((_, index) => index));

  run(root, []);

  const readme = fs.readFileSync(path.join(root, 'README.md'), 'utf8');
  const config = readTopicChartConfig(readme);
  const colors = JSON.stringify(config).match(/#[0-9a-f]{6}/g);
  assert.equal(new Set(colors).size, topicFixtures.length);
  assert.equal(Object.keys(config.themeVariables).length, 12);
  assert.equal([...config.themeCSS.matchAll(/\.legend:nth-of-type/g)].length, topicFixtures.length);
  assert.match(config.themeCSS, /\.pieCircle:nth-of-type\(18\)/);
  assert.match(config.themeCSS, /\.legend:nth-of-type\(19\) rect/);
});

test('keeps extended-palette slice colors aligned when earlier topics are zero', () => {
  const root = createRepository([0, 17]);

  run(root, []);

  const config = readTopicChartConfig(fs.readFileSync(path.join(root, 'README.md'), 'utf8'));
  assert.match(config.themeCSS, /\.pieCircle:nth-of-type\(2\)\{fill:#ce7527!important\}/);
});

test('check mode detects stale generated Mermaid content', () => {
  const root = createRepository([0, 1, 0]);
  run(root, []);
  const readmePath = path.join(root, 'README.md');
  fs.writeFileSync(readmePath, fs.readFileSync(readmePath, 'utf8').replace('"Two Pointers" : 1', '"Two Pointers" : 2'));

  const result = run(root, ['--check'], false);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /README\.md roadmap documentation is outdated/);
});

test('rejects a catalog entry without its solution file', () => {
  const root = createRepository([0]);
  fs.rmSync(path.join(root, 'neetcode-all/arrays&hashing/1.py'));

  const result = run(root, [], false);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Missing solution file/);
});

test('rejects a solution without its title and ID header', () => {
  const root = createRepository([0]);
  fs.writeFileSync(
    path.join(root, 'neetcode-all/arrays&hashing/1.py'),
    '# A copied problem statement\n\nclass Solution:\n    pass\n',
  );

  const result = run(root, [], false);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /must begin with "# Problem 1 - 1" followed by a blank line/);
});

function createRepository(solutionTopics) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'readme-stats-'));
  fixtures.push(root);
  fs.mkdirSync(path.join(root, 'scripts'), { recursive: true });
  fs.copyFileSync(path.join(__dirname, 'update-readme-stats.js'), path.join(root, 'scripts/update-readme-stats.js'));

  const roadmapTotal = 973;
  fs.writeFileSync(path.join(root, 'README.md'), [
    '# Test repository',
    '',
    '    <!-- solved-count:start -->',
    '    stale',
    '    <!-- solved-count:end -->',
    '',
    '<!-- difficulty-chart:start -->',
    'stale',
    '<!-- difficulty-chart:end -->',
    '',
    '<!-- topic-chart:start -->',
    'stale',
    '<!-- topic-chart:end -->',
    '',
    '<!-- topic-table:start -->',
    '| Topic | Solved | Total |',
    '|---|---:|---:|',
    ...topicFixtures.map(([label, , total]) => `| ${label} | 0 | ${total} |`),
    `| **All topics** | <!-- progress-total:start -->**0**<!-- progress-total:end --> | **${roadmapTotal}** |`,
    '<!-- topic-table:end -->',
    '',
  ].join('\n'));

  solutionTopics.forEach((topicIndex, index) => {
    const [, folder] = topicFixtures[topicIndex];
    const directory = path.join(root, 'neetcode-all', folder);
    fs.mkdirSync(directory, { recursive: true });
    fs.writeFileSync(
      path.join(directory, `${index + 1}.py`),
      `# Problem ${index + 1} - ${index + 1}\n\nclass Solution:\n    pass\n`,
    );
  });

  fs.writeFileSync(path.join(root, 'SOLUTIONS.md'), [
    '| Problem | Title | File | Time Complexity | Space Complexity | Difficulty |',
    '|---:|---|---|---|---|:---:|',
    ...solutionTopics.map((topicIndex, index) => {
      const id = index + 1;
      const [, folder] = topicFixtures[topicIndex];
      const encodedFolder = encodeURIComponent(folder);
      const difficulty = ['Easy', 'Medium', 'Hard'][index % 3];
      return `| ${id} | [Problem ${id}](https://leetcode.com/problems/problem-${id}/) | [${id}.py](neetcode-all/${encodedFolder}/${id}.py) | \`O(n)\` | \`O(n)\` | ![${difficulty}](${difficulty.toLowerCase()}) |`;
    }),
    '',
  ].join('\n'));
  return root;
}

function readTopicChartConfig(readme) {
  const directives = readme.split(/\r?\n/).filter((line) => line.startsWith('%%{init: '));
  assert.equal(directives.length, 2);
  return JSON.parse(directives[1].slice('%%{init: '.length, -3));
}

function run(root, args, expectSuccess = true) {
  const result = spawnSync(process.execPath, ['scripts/update-readme-stats.js', ...args], {
    cwd: root,
    encoding: 'utf8',
  });
  if (expectSuccess && result.status !== 0) {
    assert.fail(`Command failed: ${args.join(' ')}\nstdout: ${result.stdout}\nstderr: ${result.stderr}`);
  }
  return result;
}
