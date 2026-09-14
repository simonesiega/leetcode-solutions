'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { afterEach, test } = require('node:test');

const topicFixtures = [
  ['Arrays & Hashing', 'arrays-and-hashing', 175],
  ['Two Pointers', 'two-pointers', 43],
  ['Sliding Window', 'sliding-window', 41],
  ['Stack', 'stack', 39],
  ['Binary Search', 'binary-search', 43],
  ['Linked List', 'linked-list', 40],
  ['Trees', 'trees', 93],
  ['Heap / Priority Queue', 'heap-priority-queue', 33],
  ['Backtracking', 'backtracking', 36],
  ['Tries', 'tries', 12],
  ['Graphs', 'graphs', 71],
  ['Advanced Graphs', 'advanced-graphs', 30],
  ['1-D Dynamic Programming', '1d-dynamic-programming', 55],
  ['2-D Dynamic Programming', '2d-dynamic-programming', 50],
  ['Greedy', 'greedy', 67],
  ['Intervals', 'intervals', 21],
  ['Math & Geometry', 'math-and-geometry', 63],
  ['Bit Manipulation', 'bit-manipulation', 31],
];
const fixtures = [];

afterEach(() => {
  while (fixtures.length) fs.rmSync(fixtures.pop(), { recursive: true, force: true });
});

test('generates the solution catalog, roadmap counts, and Mermaid topic chart from JSON', () => {
  const root = createRepository([0, 1, 0]);

  run(root, []);
  run(root, ['--check']);

  const catalog = fs.readFileSync(path.join(root, 'SOLUTIONS.md'), 'utf8');
  assert.match(catalog, /Generated from data\/roadmap\.json/);
  assert.match(catalog, /\[Problem 1\]\(https:\/\/leetcode\.com\/problems\/problem-1\/\)/);
  assert.match(catalog, /neetcode-all\/arrays-and-hashing\/1\.py/);
  assert.match(catalog, /`O\(n\)`, where `n` is the input size\./);

  const readme = fs.readFileSync(path.join(root, 'README.md'), 'utf8');
  assert.match(readme, /Solved-3-brightgreen/);
  assert.match(readme, /title Solved Problems by Difficulty \(3 Total\)/);
  assert.match(readme, /\| Arrays & Hashing \| 2 \| 175 \|/);
  assert.match(readme, /\| Two Pointers \| 1 \| 43 \|/);
  assert.match(readme, /title Solved Problems by Topic \(3 Total\)/);
  assert.match(readme, /"Arrays & Hashing" : 2/);
  assert.match(readme, /"Two Pointers" : 1/);
  assert.doesNotMatch(readme, /"Sliding Window" : 0/);

  const config = readTopicChartConfig(readme);
  assert.equal(Object.keys(config.themeVariables).length, 2);
  const colors = JSON.stringify(config).match(/#[0-9a-f]{6}/g);
  assert.equal(new Set(colors).size, 2);
});

test('counts and catalogs only solved roadmap entries', () => {
  const root = createRepository([0, 1, 2]);
  const roadmap = readRoadmap(root);
  roadmap.problems[1].status = 'planned';
  roadmap.problems[1].timeComplexity = '';
  roadmap.problems[1].spaceComplexity = '';
  roadmap.problems[2].status = 'in-progress';
  roadmap.problems[2].timeComplexity = '';
  roadmap.problems[2].spaceComplexity = '';
  writeRoadmap(root, roadmap);
  fs.rmSync(path.join(root, 'neetcode-all/two-pointers/2.py'));

  run(root, []);

  const catalog = fs.readFileSync(path.join(root, 'SOLUTIONS.md'), 'utf8');
  assert.match(catalog, /\[Problem 1\]/);
  assert.doesNotMatch(catalog, /\[Problem [23]\]/);
  assert.match(fs.readFileSync(path.join(root, 'README.md'), 'utf8'), /Solved-1-brightgreen/);
});

test('renders an empty topic state when every tracked problem is planned', () => {
  const root = createRepository([0]);
  const roadmap = readRoadmap(root);
  roadmap.problems[0].status = 'planned';
  roadmap.problems[0].timeComplexity = '';
  roadmap.problems[0].spaceComplexity = '';
  writeRoadmap(root, roadmap);
  fs.rmSync(path.join(root, 'neetcode-all/arrays-and-hashing/1.py'));

  run(root, []);

  const readme = fs.readFileSync(path.join(root, 'README.md'), 'utf8');
  assert.match(readme, /Solved-0-brightgreen/);
  assert.match(readme, /_No solved roadmap problems yet\._/);
  assert.doesNotMatch(fs.readFileSync(path.join(root, 'SOLUTIONS.md'), 'utf8'), /\[Problem 1\]/);
});

test('supports a unique configured color for every roadmap topic', () => {
  const root = createRepository(topicFixtures.map((_, index) => index));

  run(root, []);

  const config = readTopicChartConfig(fs.readFileSync(path.join(root, 'README.md'), 'utf8'));
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

test('check mode detects a stale README', () => {
  const root = createRepository([0, 1, 0]);
  run(root, []);
  const readmePath = path.join(root, 'README.md');
  fs.writeFileSync(readmePath, fs.readFileSync(readmePath, 'utf8').replace('"Two Pointers" : 1', '"Two Pointers" : 2'));

  const result = run(root, ['--check'], false);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Generated roadmap documentation is outdated: README\.md/);
});

test('check mode detects a stale generated solution catalog', () => {
  const root = createRepository([0]);
  run(root, []);
  fs.appendFileSync(path.join(root, 'SOLUTIONS.md'), 'stale\n');

  const result = run(root, ['--check'], false);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Generated roadmap documentation is outdated: SOLUTIONS\.md/);
});

test('rejects invalid or missing problem metadata', () => {
  const root = createRepository([0]);
  const roadmap = readRoadmap(root);
  delete roadmap.problems[0].url;
  writeRoadmap(root, roadmap);

  const result = run(root, [], false);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Problem at index 0 is missing required field\(s\): url/);
});

test('rejects duplicate problem IDs', () => {
  const root = createRepository([0, 1]);
  const roadmap = readRoadmap(root);
  roadmap.problems[1].id = roadmap.problems[0].id;
  writeRoadmap(root, roadmap);

  const result = run(root, [], false);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Duplicate roadmap problem ID: 1/);
});

test('rejects invalid topics, difficulties, and statuses', async (t) => {
  await t.test('invalid topic', () => {
    const root = createRepository([0]);
    const roadmap = readRoadmap(root);
    roadmap.problems[0].topic = 'not-a-topic';
    writeRoadmap(root, roadmap);

    const result = run(root, [], false);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /Problem 1 has invalid topic "not-a-topic"/);
  });

  await t.test('invalid difficulty', () => {
    const root = createRepository([0]);
    const roadmap = readRoadmap(root);
    roadmap.problems[0].difficulty = 'Very Hard';
    writeRoadmap(root, roadmap);

    const result = run(root, [], false);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /Problem 1 has invalid difficulty "Very Hard"/);
  });

  await t.test('invalid status', () => {
    const root = createRepository([0]);
    const roadmap = readRoadmap(root);
    roadmap.problems[0].status = 'done';
    writeRoadmap(root, roadmap);

    const result = run(root, [], false);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /Problem 1 has invalid status "done"/);
  });
});

test('rejects a solved entry without both complexities', () => {
  const root = createRepository([0]);
  const roadmap = readRoadmap(root);
  roadmap.problems[0].spaceComplexity = '';
  writeRoadmap(root, roadmap);

  const result = run(root, [], false);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Solved problem 1 must include time and space complexity/);
});

test('rejects a solved entry without its solution file', () => {
  const root = createRepository([0]);
  fs.rmSync(path.join(root, 'neetcode-all/arrays-and-hashing/1.py'));

  const result = run(root, [], false);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Missing solution file for solved problem 1/);
});

test('rejects a planned entry that already has a solution file', () => {
  const root = createRepository([0]);
  const roadmap = readRoadmap(root);
  roadmap.problems[0].status = 'planned';
  roadmap.problems[0].timeComplexity = '';
  roadmap.problems[0].spaceComplexity = '';
  writeRoadmap(root, roadmap);

  const result = run(root, [], false);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /exists, but problem 1 is planned/);
});

test('rejects an untracked solution file', () => {
  const root = createRepository([0]);
  fs.writeFileSync(
    path.join(root, 'neetcode-all/arrays-and-hashing/2.py'),
    '# Extra Problem - 2\n\nclass Solution:\n    pass\n',
  );

  const result = run(root, [], false);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Untracked roadmap solution file: neetcode-all\/arrays-and-hashing\/2\.py/);
});

test('rejects a solved file containing only comments', () => {
  const root = createRepository([0]);
  fs.writeFileSync(
    path.join(root, 'neetcode-all/arrays-and-hashing/1.py'),
    '# Problem 1 - 1\n\n# Notes only.\n',
  );

  const result = run(root, [], false);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /is marked solved but does not contain a Python solution/);
});

test('rejects a solution without its exact title and ID header', () => {
  const root = createRepository([0]);
  fs.writeFileSync(
    path.join(root, 'neetcode-all/arrays-and-hashing/1.py'),
    '# A copied problem statement\n\nclass Solution:\n    pass\n',
  );

  const result = run(root, [], false);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /must begin with "# Problem 1 - 1" followed by a blank line/);
});

function createRepository(solutionTopics) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'roadmap-stats-'));
  fixtures.push(root);
  fs.mkdirSync(path.join(root, 'scripts'), { recursive: true });
  fs.mkdirSync(path.join(root, 'data'), { recursive: true });
  fs.copyFileSync(path.join(__dirname, 'update-readme-stats.js'), path.join(root, 'scripts/update-readme-stats.js'));

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
    'stale',
    '<!-- topic-table:end -->',
    '',
  ].join('\n'));
  fs.writeFileSync(path.join(root, 'SOLUTIONS.md'), 'stale\n');

  const problems = solutionTopics.map((topicIndex, index) => {
    const id = index + 1;
    const [, topic] = topicFixtures[topicIndex];
    const directory = path.join(root, 'neetcode-all', topic);
    fs.mkdirSync(directory, { recursive: true });
    fs.writeFileSync(
      path.join(directory, `${id}.py`),
      `# Problem ${id} - ${id}\n\nclass Solution:\n    pass\n`,
    );
    return {
      id,
      title: `Problem ${id}`,
      url: `https://leetcode.com/problems/problem-${id}/`,
      topic,
      difficulty: ['Easy', 'Medium', 'Hard'][index % 3],
      status: 'solved',
      timeComplexity: '`O(n)`, where `n` is the input size.',
      spaceComplexity: '`O(n)` auxiliary space.',
    };
  });
  writeRoadmap(root, {
    schemaVersion: 1,
    name: 'NeetCode All',
    total: 973,
    topics: topicFixtures.map(([label, slug, total]) => ({ slug, label, total })),
    problems,
  });
  return root;
}

function readTopicChartConfig(readme) {
  const directives = readme.split(/\r?\n/).filter((line) => line.startsWith('%%{init: '));
  assert.equal(directives.length, 2);
  return JSON.parse(directives[1].slice('%%{init: '.length, -3));
}

function readRoadmap(root) {
  return JSON.parse(fs.readFileSync(path.join(root, 'data/roadmap.json'), 'utf8'));
}

function writeRoadmap(root, roadmap) {
  fs.writeFileSync(path.join(root, 'data/roadmap.json'), `${JSON.stringify(roadmap, null, 2)}\n`);
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
