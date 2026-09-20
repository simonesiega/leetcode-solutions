'use strict';

// High-signal integration coverage for safe imports and both problem-tracking workflows.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { afterEach, test } = require('node:test');
const { readJson, writeJson } = require('./lib/json');

const fixtures = [];

afterEach(() => {
  while (fixtures.length) fs.rmSync(fixtures.pop(), { recursive: true, force: true });
});

test('automation imports safely and preserves both problem workflows', () => {
  assertImportBehavior();
  assertRoadmapWorkflow();
  assertCompanyWorkflow();
});

/** Verify that importing production modules is silent, side-effect free, and usable. */
function assertImportBehavior() {
  const root = createRepository();
  const watchedPaths = ['README.md', 'SOLUTIONS.md', 'data/roadmap.json'];
  const before = new Map(watchedPaths.map((file) => [
    file,
    fs.readFileSync(path.join(root, file), 'utf8'),
  ]));
  const script = `
    const assert = require('node:assert/strict');
    for (const entry of [
      './scripts/company-tracker.js',
      './scripts/roadmap-tracker.js',
    ]) {
      assert.equal(typeof require(entry).main, 'function');
    }
    const validation = require('./scripts/lib/validation.js');
    const solutions = require('./scripts/lib/solutions.js');
    const markdown = require('./scripts/lib/markdown.js');
    assert.equal(typeof validation.parsePositiveIntegerId, 'function');
    assert.equal(typeof solutions.validateSolutionHeader, 'function');
    assert.equal(typeof markdown.replaceBlock, 'function');
  `;
  const result = spawnSync(process.execPath, ['-e', script], {
    cwd: root,
    encoding: 'utf8',
  });

  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, '');
  assert.equal(result.stderr, '');
  for (const [file, content] of before) {
    assert.equal(fs.readFileSync(path.join(root, file), 'utf8'), content);
  }
  assert.equal(fs.existsSync(path.join(root, 'companies/README.md')), false);
}

/** Exercise the roadmap lifecycle, validation failures, and generated documentation. */
function assertRoadmapWorkflow() {
  const root = createRepository();
  run(root, 'roadmap-tracker.js', [
    'add', '20', 'Valid Parentheses', 'stack', 'Easy',
    '--url', 'https://leetcode.com/problems/valid-parentheses/',
  ]);
  run(root, 'roadmap-tracker.js', [
    'add', '5', 'Longest Palindromic Substring', 'arrays-and-hashing', 'Medium',
    '--url', 'https://leetcode.com/problems/longest-palindromic-substring/',
  ]);

  let roadmap = readJson(path.join(root, 'data/roadmap.json'));
  assert.deepEqual(roadmap.problems.map((problem) => problem.id), [5, 20]);
  assert.equal(roadmap.problems[0].status, 'planned');

  let result = run(root, 'roadmap-tracker.js', [
    'add', '5', 'Duplicate', 'stack', 'Hard',
    '--url', 'https://leetcode.com/problems/duplicate/',
  ], false);
  assert.match(result.stderr, /already tracked/);

  result = run(root, 'roadmap-tracker.js', [
    'add', '6', 'Invalid URL', 'stack', 'Easy', '--url', 'http://example.com/problem',
  ], false);
  assert.match(result.stderr, /canonical https:\/\/leetcode\.com/);

  result = run(root, 'roadmap-tracker.js', [
    'solve', '20', '--time', 'O(n)', '--space', 'O(n)',
  ], false);
  assert.match(result.stderr, /Run the start command first/);

  run(root, 'roadmap-tracker.js', ['start', '5']);
  const solutionPath = path.join(root, 'neetcode-all/arrays-and-hashing/5.py');
  result = run(root, 'roadmap-tracker.js', [
    'solve', '5', '--time', 'O(n²)', '--space', 'O(n)',
  ], false);
  assert.match(result.stderr, /remove the TODO\(roadmap-solution\) marker/);

  roadmap = readJson(path.join(root, 'data/roadmap.json'));
  roadmap.problems[0].status = 'solved';
  roadmap.problems[0].timeComplexity = 'O(n²)';
  roadmap.problems[0].spaceComplexity = 'O(n)';
  writeJson(path.join(root, 'data/roadmap.json'), roadmap);
  result = run(root, 'roadmap-tracker.js', ['--check'], false);
  assert.match(result.stderr, /marked solved but still contains TODO\(roadmap-solution\)/);
  roadmap.problems[0].status = 'in-progress';
  roadmap.problems[0].timeComplexity = '';
  roadmap.problems[0].spaceComplexity = '';
  writeJson(path.join(root, 'data/roadmap.json'), roadmap);

  fs.writeFileSync(solutionPath, '# Wrong Title - 5\n\nclass Solution:\n    pass\n');
  result = run(root, 'roadmap-tracker.js', [
    'solve', '5', '--time', 'O(n²)', '--space', 'O(n)',
  ], false);
  assert.match(result.stderr, /must begin with "# Longest Palindromic Substring - 5"/);

  fs.writeFileSync(
    solutionPath,
    '# Longest Palindromic Substring - 5\n\nclass Solution:\n    pass\n',
  );
  run(root, 'roadmap-tracker.js', [
    'solve', '5', '--time', 'O(n²), where n is the string length',
    '--space', 'O(n) auxiliary space', '--personal-difficulty', '4',
  ]);
  run(root, 'roadmap-tracker.js', ['--check']);

  roadmap = readJson(path.join(root, 'data/roadmap.json'));
  assert.equal(roadmap.problems[0].status, 'solved');
  assert.equal(roadmap.problems[0].personalDifficulty, 4);
  const readme = fs.readFileSync(path.join(root, 'README.md'), 'utf8');
  const catalog = fs.readFileSync(path.join(root, 'SOLUTIONS.md'), 'utf8');
  assert.match(readme, /NeetCode%20Solved-1-brightgreen/);
  assert.match(readme, /"Medium" : 1/);
  assert.match(readme, /\| Arrays & Hashing \| 1 \| 5 \|/);
  assert.match(catalog, /\[Longest Palindromic Substring\]/);
  assert.doesNotMatch(catalog, /Valid Parentheses/);

  fs.appendFileSync(path.join(root, 'SOLUTIONS.md'), 'stale\n');
  result = run(root, 'roadmap-tracker.js', ['--check'], false);
  assert.match(result.stderr, /Generated roadmap documentation is outdated/);
}

/** Exercise the company lifecycle, validation failures, and all generated dashboards. */
function assertCompanyWorkflow() {
  const root = createRepository();
  run(root, 'company-tracker.js', [
    'add-company', 'Example Labs', '--focus', 'Practice',
  ]);
  run(root, 'company-tracker.js', [
    'add-problem', 'example-labs', 'oa-pairs', 'Pair Optimization', 'Medium',
    '--url', 'https://example.com/problems/pairs', '--notes', 'Hash map',
  ]);

  let result = run(root, 'company-tracker.js', [
    'add-problem', 'example-labs', 'oa-pairs', 'Duplicate', 'Easy',
  ], false);
  assert.match(result.stderr, /already tracked for Example Labs/);

  run(root, 'company-tracker.js', ['start', 'example-labs', 'oa-pairs']);
  const solutionPath = path.join(root, 'companies/example-labs/solutions/oa-pairs.py');
  result = run(root, 'company-tracker.js', [
    'solve', 'example-labs', 'oa-pairs', '--time', ' ', '--space', 'O(n)',
  ], false);
  assert.match(result.stderr, /Usage: node scripts\/company-tracker\.js solve/);

  result = run(root, 'company-tracker.js', [
    'solve', 'example-labs', 'oa-pairs', '--time', 'O(n)', '--space', 'O(n)',
  ], false);
  assert.match(result.stderr, /remove the TODO\(company-solution\) marker/);

  fs.writeFileSync(
    solutionPath,
    '# Pair Optimization - oa-pairs\n\nclass Solution:\n    pass\n',
  );
  run(root, 'company-tracker.js', [
    'solve', 'example-labs', 'oa-pairs', '--time', 'O(n)', '--space', 'O(n)',
    '--personal-difficulty', '3', '--notes', 'n = number of values',
  ]);
  run(root, 'company-tracker.js', ['--check']);

  const manifestPath = path.join(root, 'companies/example-labs/company.json');
  const manifest = readJson(manifestPath);
  assert.equal(manifest.problems[0].status, 'solved');
  assert.equal(manifest.problems[0].personalDifficulty, 3);
  assert.match(
    fs.readFileSync(path.join(root, 'companies/example-labs/README.md'), 'utf8'),
    /\| 3 \| Solved \|/,
  );
  assert.match(
    fs.readFileSync(path.join(root, 'companies/README.md'), 'utf8'),
    /\[Example Labs\]\(example-labs\/README\.md\) \| 1 \/ 1/,
  );
  assert.match(
    fs.readFileSync(path.join(root, 'README.md'), 'utf8'),
    /1 company · 1 solved/,
  );

  fs.rmSync(solutionPath);
  result = run(root, 'company-tracker.js', ['--check'], false);
  assert.match(result.stderr, /solved problem oa-pairs is missing its solution file/);
  fs.writeFileSync(solutionPath, '# Pair Optimization - oa-pairs\n\nclass Solution:\n    pass\n');

  const invalid = readJson(manifestPath);
  invalid.problems[0].difficulty = 'Extreme';
  writeJson(manifestPath, invalid);
  result = run(root, 'company-tracker.js', ['--check'], false);
  assert.match(result.stderr, /invalid difficulty/);
  invalid.problems[0].difficulty = 'Medium';
  writeJson(manifestPath, invalid);

  fs.appendFileSync(path.join(root, 'companies/README.md'), 'stale\n');
  result = run(root, 'company-tracker.js', ['--check'], false);
  assert.match(result.stderr, /Generated company documentation is outdated/);
}

/**
 * Create the smallest complete repository needed by both production CLIs.
 * @returns {string} Absolute fixture root.
 */
function createRepository() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'automation-'));
  fixtures.push(root);
  fs.mkdirSync(path.join(root, 'scripts'), { recursive: true });
  fs.mkdirSync(path.join(root, 'data'), { recursive: true });
  fs.mkdirSync(path.join(root, 'companies'), { recursive: true });
  fs.cpSync(path.join(__dirname, 'lib'), path.join(root, 'scripts/lib'), { recursive: true });
  for (const script of ['company-tracker.js', 'roadmap-tracker.js']) {
    fs.copyFileSync(path.join(__dirname, script), path.join(root, 'scripts', script));
  }
  fs.writeFileSync(path.join(root, 'README.md'), [
    '# Test repository',
    '',
    '  <!-- solved-count:start -->',
    '  stale',
    '  <!-- solved-count:end -->',
    '',
    '  <!-- company-count:start -->',
    '  stale',
    '  <!-- company-count:end -->',
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
    '<!-- company-progress:start -->',
    'stale',
    '<!-- company-progress:end -->',
    '',
    '<!-- company-list:start -->',
    'stale',
    '<!-- company-list:end -->',
    '',
  ].join('\n'));
  fs.writeFileSync(path.join(root, 'SOLUTIONS.md'), 'stale\n');
  writeJson(path.join(root, 'data/roadmap.json'), {
    schemaVersion: 2,
    name: 'NeetCode All',
    total: 10,
    topics: [
      { slug: 'arrays-and-hashing', label: 'Arrays & Hashing', total: 5 },
      { slug: 'stack', label: 'Stack', total: 5 },
    ],
    problems: [],
  });
  return root;
}

/**
 * Run a copied CLI inside a disposable repository.
 * @returns {import('node:child_process').SpawnSyncReturns<string>}
 */
function run(root, script, args, expectSuccess = true) {
  const result = spawnSync(process.execPath, [`scripts/${script}`, ...args], {
    cwd: root,
    encoding: 'utf8',
  });
  if (expectSuccess && result.status !== 0) {
    assert.fail(`Command failed: ${script} ${args.join(' ')}\nstdout: ${result.stdout}\nstderr: ${result.stderr}`);
  }
  return result;
}
