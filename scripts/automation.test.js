'use strict';

// Integration coverage for safe imports, both trackers, generated files, and source parsing.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { afterEach, test } = require('node:test');
const {
  buildRawSourceUrl, getSourceCachePath, parseCompanySourceCsv,
} = require('./lib/company-source');
const { parseCsv } = require('./lib/csv');
const { readJson, writeJson } = require('./lib/json');
const { escapeLinkDestination, replaceBlock } = require('./lib/markdown');
const { assertIsoInstant } = require('./lib/validation');

const fixtures = [];

afterEach(() => {
  while (fixtures.length) fs.rmSync(fixtures.pop(), { recursive: true, force: true });
});

test('automation modules import without output or side effects', () => {
  const root = createRepository();
  const watched = ['README.md', 'SOLUTIONS.md', 'data/roadmap.json'];
  const before = new Map(watched.map((file) => [file, fs.readFileSync(path.join(root, file), 'utf8')]));
  const script = `
    const assert = require('node:assert/strict');
    assert.equal(typeof require('./scripts/company-tracker.js').main, 'function');
    assert.equal(typeof require('./scripts/roadmap-tracker.js').main, 'function');
    assert.equal(typeof require('./scripts/lib/company.js').validateCompany, 'function');
    assert.equal(typeof require('./scripts/lib/company-source.js').parseCompanySourceCsv, 'function');
    assert.equal(typeof require('./scripts/lib/csv.js').parseCsv, 'function');
    assert.equal(typeof require('./scripts/lib/validation.js').assertIsoInstant, 'function');
  `;
  const result = spawnSync(process.execPath, ['-e', script], { cwd: root, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, '');
  assert.equal(result.stderr, '');
  for (const [file, content] of before) assert.equal(fs.readFileSync(path.join(root, file), 'utf8'), content);
  assert.equal(fs.existsSync(path.join(root, 'companies/README.md')), false);
});

test('roadmap lifecycle records one immutable solvedAt instant', () => {
  const root = createRepository();
  run(root, 'roadmap-tracker.js', [
    'add', '5', 'Longest Palindromic Substring', 'arrays-and-hashing', 'Medium',
    '--url', 'https://leetcode.com/problems/longest-palindromic-substring/',
  ]);
  let roadmap = readRoadmap(root);
  assert.equal(roadmap.problems[0].status, 'planned');
  assert.equal(roadmap.problems[0].solvedAt, null);
  assert.equal(roadmap.snapshotDate, '2026-09-14');

  run(root, 'roadmap-tracker.js', ['start', '5']);
  roadmap = readRoadmap(root);
  assert.equal(roadmap.problems[0].status, 'in-progress');
  assert.equal(roadmap.problems[0].solvedAt, null);
  const solutionPath = path.join(root, 'neetcode-all/arrays-and-hashing/5.py');
  fs.writeFileSync(solutionPath, '# Longest Palindromic Substring - 5\n\nclass Solution:\n    pass\n');
  run(root, 'roadmap-tracker.js', [
    'solve', '5', '--time', 'O(n²), where n is the string length',
    '--space', 'O(n) auxiliary space', '--personal-difficulty', '4',
  ]);

  roadmap = readRoadmap(root);
  const solvedAt = roadmap.problems[0].solvedAt;
  assert.doesNotThrow(() => assertIsoInstant(solvedAt, 'solvedAt'));
  assert.equal(roadmap.problems[0].personalDifficulty, 4);
  assert.equal(roadmap.snapshotDate, '2026-09-14');
  const result = run(root, 'roadmap-tracker.js', [
    'solve', '5', '--time', 'O(1)', '--space', 'O(1)',
  ], false);
  assert.match(result.stderr, /already solved/);
  assert.equal(readRoadmap(root).problems[0].solvedAt, solvedAt);

  run(root, 'roadmap-tracker.js', []);
  const regenerated = readRoadmap(root);
  assert.equal(regenerated.snapshotDate, '2026-09-14');
  assert.equal(regenerated.problems[0].solvedAt, solvedAt);
  assert.match(fs.readFileSync(path.join(root, 'README.md'), 'utf8'), /captured on September 14, 2026/);
  assert.match(fs.readFileSync(path.join(root, 'SOLUTIONS.md'), 'utf8'), new RegExp(`\\| ${solvedAt.slice(0, 10)} \\|`));
});

test('roadmap validation enforces schema v3 dates and generated-file drift', () => {
  const root = createSolvedRoadmapRepository();
  const roadmapPath = path.join(root, 'data/roadmap.json');
  const valid = readJson(roadmapPath);
  const cases = [
    [(roadmap) => { roadmap.extra = true; }, /unknown field.*extra/],
    [(roadmap) => { roadmap.problems[0].extra = true; }, /unknown field.*extra/],
    [(roadmap) => { roadmap.snapshotDate = '2026-02-30'; }, /snapshotDate must be a valid date/],
    [(roadmap) => { roadmap.problems[0].solvedAt = null; }, /Solved problem 5 must include solvedAt/],
    [(roadmap) => { roadmap.problems[0].status = 'planned'; }, /planned problem 5 must have solvedAt set to null/],
    [(roadmap) => { roadmap.problems[0].status = 'in-progress'; }, /in-progress problem 5 must have solvedAt set to null/],
    [(roadmap) => { roadmap.problems[0].solvedAt = '2026-09-20'; }, /valid UTC ISO timestamp/],
    [(roadmap) => { roadmap.problems[0].solvedAt = '2026-09-20T17:14:31+02:00'; }, /valid UTC ISO timestamp/],
    [(roadmap) => { roadmap.problems[0].solvedAt = '2026-02-30T17:14:31.000Z'; }, /valid UTC ISO timestamp/],
  ];
  for (const [mutate, error] of cases) {
    const invalid = structuredClone(valid);
    mutate(invalid);
    writeJson(roadmapPath, invalid);
    assert.match(run(root, 'roadmap-tracker.js', ['--check'], false).stderr, error);
  }
  writeJson(roadmapPath, valid);
  fs.appendFileSync(path.join(root, 'SOLUTIONS.md'), 'stale\n');
  assert.match(
    run(root, 'roadmap-tracker.js', ['--check'], false).stderr,
    /Generated roadmap documentation is outdated/,
  );
});

test('company lifecycle keeps manual and OA entries working', () => {
  const root = createRepository();
  run(root, 'company-tracker.js', ['add-company', 'Example Labs', '--focus', 'Practice']);
  run(root, 'company-tracker.js', [
    'add-problem', 'example-labs', 'oa-pairs', 'Pair Optimization', 'Medium',
    '--url', 'https://example.com/problems/pairs', '--notes', 'Hash map',
  ]);
  const manifestPath = path.join(root, 'companies/example-labs/company.json');
  let manifest = readJson(manifestPath);
  assert.equal(manifest.schemaVersion, 3);
  assert.equal(manifest.source, null);
  assert.equal(manifest.problems[0].id, 'oa-pairs');

  run(root, 'company-tracker.js', ['start', 'example-labs', 'oa-pairs']);
  const solutionPath = path.join(root, 'companies/example-labs/solutions/oa-pairs.py');
  fs.writeFileSync(solutionPath, '# Pair Optimization - oa-pairs\n\nclass Solution:\n    pass\n');
  run(root, 'company-tracker.js', [
    'solve', 'example-labs', 'oa-pairs', '--time', 'O(n)', '--space', 'O(n)',
    '--personal-difficulty', '3', '--notes', 'n = number of values',
  ]);
  manifest = readJson(manifestPath);
  assert.equal(manifest.problems[0].status, 'solved');
  assert.equal(manifest.problems[0].personalDifficulty, 3);
  assert.match(fs.readFileSync(path.join(root, 'companies/example-labs/README.md'), 'utf8'), /Manual.*Pair Optimization/);
  assert.match(fs.readFileSync(path.join(root, 'README.md'), 'utf8'), /1 solved/);

  const solvedManifest = fs.readFileSync(manifestPath, 'utf8');
  const result = run(root, 'company-tracker.js', [
    'solve', 'example-labs', 'oa-pairs', '--time', 'O(1)', '--space', 'O(1)',
  ], false);
  assert.match(result.stderr, /already solved/);
  assert.equal(fs.readFileSync(manifestPath, 'utf8'), solvedManifest);
});

test('company validation rejects unknown fields, bad URLs, invalid source values, and drift', () => {
  const root = createRepository();
  const manifestPath = createSourceCompany(root);
  run(root, 'company-tracker.js', []);
  const valid = readJson(manifestPath);
  const cases = [
    [(manifest) => { manifest.extra = true; }, /unknown field.*extra/],
    [(manifest) => { manifest.source.extra = true; }, /unknown field.*extra/],
    [(manifest) => { manifest.problems[0].frequecy = 90; }, /unknown field.*frequecy/],
    [(manifest) => { manifest.website = 'javascript:alert(1)'; }, /HTTP or HTTPS URL/],
    [(manifest) => { manifest.website = 'https://example.com/\nspoofed'; }, /HTTP or HTTPS URL/],
    [(manifest) => { manifest.problems[0].url = 'not a url'; }, /HTTP or HTTPS URL/],
    [(manifest) => { manifest.problems[0].frequency = -1; }, /frequency must be a number from 0 to 100/],
    [(manifest) => { manifest.problems[0].sourceRank = 0; }, /sourceRank must be a positive integer/],
    [(manifest) => {
      manifest.problems.push({ ...manifest.problems[0], id: '2', sourceRank: 2 });
    }, /duplicate source identity/],
    [(manifest) => {
      manifest.problems.push({
        id: 'manual-example',
        title: 'Example again',
        url: 'https://www.leetcode.com/problems/example',
        difficulty: 'Easy',
        personalDifficulty: null,
        status: 'planned',
        time: '',
        space: '',
        notes: '',
      });
    }, /duplicate LeetCode URL/],
  ];
  for (const [mutate, error] of cases) {
    const invalid = structuredClone(valid);
    mutate(invalid);
    writeJson(manifestPath, invalid);
    assert.match(run(root, 'company-tracker.js', ['--check'], false).stderr, error);
  }
  writeJson(manifestPath, valid);
  run(root, 'company-tracker.js', []);
  const nestedSolution = path.join(root, 'companies/source-labs/solutions/nested/orphan.py');
  fs.mkdirSync(path.dirname(nestedSolution), { recursive: true });
  fs.writeFileSync(nestedSolution, '# orphan\n');
  assert.match(
    run(root, 'company-tracker.js', ['--check'], false).stderr,
    /nested\/orphan\.py is not registered/,
  );
  fs.rmSync(path.dirname(nestedSolution), { recursive: true });

  fs.appendFileSync(path.join(root, 'companies/source-labs/README.md'), 'stale\n');
  assert.match(
    run(root, 'company-tracker.js', ['--check'], false).stderr,
    /Generated company documentation is outdated/,
  );
});

test('company check mode does not create a missing workspace directory', () => {
  const root = createRepository();
  fs.rmSync(path.join(root, 'companies'), { recursive: true });
  const result = run(root, 'company-tracker.js', ['--check'], false);
  assert.match(result.stderr, /Generated company documentation is outdated/);
  assert.equal(fs.existsSync(path.join(root, 'companies')), false);
});

test('company source CSV parsing handles quoting, CRLF, optional topics, and stable ranking', () => {
  const fixture = fs.readFileSync(path.join(__dirname, 'fixtures/company-source.csv'), 'utf8');
  const problems = parseCompanySourceCsv(`\uFEFF${fixture.replace(/\n/g, '\r\n')}`);
  assert.equal(problems[0].title, 'Problem, With Comma');
  assert.equal(problems[1].title, 'Quoted "Title"');
  assert.deepEqual(problems.map((problem) => problem.sourceRank), [1, 2, 3]);
  assert.deepEqual(problems.map((problem) => problem.frequency), [90, 90, 75.5]);
  assert.equal(problems[0].sourceKey, 'problem-with-comma');
  assert.equal(problems[1].url, 'https://leetcode.com/problems/quoted-title/');
  assert.equal(problems[2].topics, '');
  assert.equal(problems[0].difficulty, 'Medium');

  const withoutTopics = [
    'Difficulty,Title,Frequency,Link',
    'hard,Example,12.5,https://leetcode.com/problems/example/',
  ].join('\n');
  const [problem] = parseCompanySourceCsv(withoutTopics);
  assert.equal(problem.difficulty, 'Hard');
  assert.equal(problem.topics, '');
  assert.equal(
    buildRawSourceUrl(sourceMetadata('Source Labs/5. All.csv')),
    'https://raw.githubusercontent.com/liquidslr/leetcode-company-wise-problems/0123456789abcdef0123456789abcdef01234567/Source%20Labs/5.%20All.csv',
  );

  assert.throws(() => parseCsv('a,b\n"value"suffix,x'), /characters after a closing quote/);
  assert.throws(
    () => parseCompanySourceCsv('Difficulty,Title,Frequency,Link,Link\nEASY,X,1,x,x'),
    /duplicate column "Link"/,
  );
  assert.throws(
    () => parseCompanySourceCsv('Difficulty,Title,Frequency,Link\nEASY,X,1'),
    /has 3 fields; expected 4/,
  );
  assert.throws(
    () => parseCompanySourceCsv('Difficulty,Title,Frequency,Link\nEASY,X,1e2,https:\/\/leetcode.com\/problems\/x\/'),
    /invalid frequency/,
  );
});

test('Markdown helpers preserve literal text and safe link destinations', () => {
  const input = 'before\n  <!-- sample:start -->\n  stale\n  <!-- sample:end -->\nafter\n';
  assert.equal(
    replaceBlock(input, 'sample', ['$& is literal']),
    'before\n  <!-- sample:start -->\n  $& is literal\n  <!-- sample:end -->\nafter\n',
  );
  assert.throws(
    () => replaceBlock(`${input}<!-- sample:start -->\n<!-- sample:end -->\n`, 'sample', []),
    /exactly one ordered pair/,
  );
  assert.equal(
    escapeLinkDestination('https://example.com/a_(b)<c>'),
    'https://example.com/a_%28b%29%3Cc%3E',
  );
});

test('source cache identity includes repository path as well as commit', () => {
  const company = { slug: 'source-labs', data: { source: sourceMetadata('Source Labs/5. All.csv') } };
  const firstPath = getSourceCachePath(company);
  company.data.source.path = 'Source Labs/6. Six Months.csv';
  const secondPath = getSourceCachePath(company);
  assert.notEqual(firstPath, secondPath);
  assert.match(path.basename(firstPath), /^0123456789abcdef0123456789abcdef01234567-[0-9a-f]{16}\.csv$/);
});

test('source imports reject collisions before changing the manifest', () => {
  const root = createRepository();
  const manifestPath = createSourceCompany(root);
  run(root, 'company-tracker.js', []);
  run(root, 'company-tracker.js', [
    'source-sync', 'source-labs', '--file', 'scripts/fixtures/company-source.csv',
  ]);
  const before = fs.readFileSync(manifestPath, 'utf8');
  const result = run(root, 'company-tracker.js', [
    'add-from-source', 'source-labs', 'problem-with-comma', '--id', '101',
  ], false);
  assert.match(result.stderr, /duplicate sourceRank 1/);
  assert.equal(fs.readFileSync(manifestPath, 'utf8'), before);
});

test('company source cache supports next and deterministic import without network access', () => {
  const root = createRepository();
  run(root, 'company-tracker.js', ['add-company', 'Source Labs']);
  const manifestPath = path.join(root, 'companies/source-labs/company.json');
  const manifest = readJson(manifestPath);
  manifest.source = sourceMetadata('Source Labs/5. All.csv');
  writeJson(manifestPath, manifest);
  run(root, 'company-tracker.js', []);

  const sourceBefore = structuredClone(manifest.source);
  run(root, 'company-tracker.js', [
    'source-sync', 'source-labs', '--file', 'scripts/fixtures/company-source.csv',
  ]);
  let result = run(root, 'company-tracker.js', ['next', 'source-labs']);
  assert.match(result.stdout, /#1 Problem, With Comma.*90%.*problem-with-comma/);
  run(root, 'company-tracker.js', [
    'add-from-source', 'source-labs', 'problem-with-comma', '--id', '101', '--notes', 'Source import',
  ]);
  const updated = readJson(manifestPath);
  assert.deepEqual(updated.source, sourceBefore);
  assert.equal(updated.problems[0].id, '101');
  assert.equal(updated.problems[0].sourceKey, 'problem-with-comma');
  assert.equal(updated.problems[0].sourceRank, 1);
  assert.equal(updated.problems[0].frequency, 90);
  assert.equal(updated.problems[0].url, 'https://leetcode.com/problems/problem-with-comma/');
  result = run(root, 'company-tracker.js', ['next', 'source-labs']);
  assert.match(result.stdout, /#2 Quoted "Title"/);
  assert.match(fs.readFileSync(path.join(root, 'companies/source-labs/README.md'), 'utf8'), /\| 1 \| \[Problem, With Comma\]/);
});

function createSolvedRoadmapRepository() {
  const root = createRepository();
  run(root, 'roadmap-tracker.js', [
    'add', '5', 'Longest Palindromic Substring', 'arrays-and-hashing', 'Medium',
    '--url', 'https://leetcode.com/problems/longest-palindromic-substring/',
  ]);
  run(root, 'roadmap-tracker.js', ['start', '5']);
  fs.writeFileSync(
    path.join(root, 'neetcode-all/arrays-and-hashing/5.py'),
    '# Longest Palindromic Substring - 5\n\nclass Solution:\n    pass\n',
  );
  run(root, 'roadmap-tracker.js', ['solve', '5', '--time', 'O(n²)', '--space', 'O(n)']);
  return root;
}

function createSourceCompany(root) {
  const directory = path.join(root, 'companies/source-labs');
  fs.mkdirSync(path.join(directory, 'solutions'), { recursive: true });
  const manifestPath = path.join(directory, 'company.json');
  writeJson(manifestPath, {
    schemaVersion: 3,
    name: 'Source Labs',
    focus: '',
    website: 'https://example.com/',
    source: sourceMetadata('Source Labs/5. All.csv'),
    problems: [{
      id: '1',
      sourceKey: 'example',
      sourceRank: 1,
      frequency: 90,
      title: 'Example',
      url: 'https://leetcode.com/problems/example/',
      difficulty: 'Easy',
      personalDifficulty: null,
      status: 'planned',
      time: '',
      space: '',
      notes: '',
    }],
  });
  return manifestPath;
}

function sourceMetadata(sourcePath) {
  return {
    repository: 'liquidslr/leetcode-company-wise-problems',
    commit: '0123456789abcdef0123456789abcdef01234567',
    snapshotDate: '2026-08-16',
    window: 'all',
    path: sourcePath,
  };
}

function createRepository() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'automation-'));
  fixtures.push(root);
  for (const directory of ['scripts', 'data', 'companies']) {
    fs.mkdirSync(path.join(root, directory), { recursive: true });
  }
  fs.cpSync(path.join(__dirname, 'lib'), path.join(root, 'scripts/lib'), { recursive: true });
  fs.cpSync(path.join(__dirname, 'fixtures'), path.join(root, 'scripts/fixtures'), { recursive: true });
  for (const script of ['company-tracker.js', 'roadmap-tracker.js']) {
    fs.copyFileSync(path.join(__dirname, script), path.join(root, 'scripts', script));
  }
  fs.writeFileSync(path.join(root, 'README.md'), [
    '# Test repository',
    '',
    '<!-- solved-count:start -->', 'stale', '<!-- solved-count:end -->',
    '',
    '<!-- roadmap-snapshot:start -->', 'stale', '<!-- roadmap-snapshot:end -->',
    '',
    '<!-- company-count:start -->', 'stale', '<!-- company-count:end -->',
    '',
    '<!-- difficulty-chart:start -->', 'stale', '<!-- difficulty-chart:end -->',
    '',
    '<!-- topic-chart:start -->', 'stale', '<!-- topic-chart:end -->',
    '',
    '<!-- topic-table:start -->', 'stale', '<!-- topic-table:end -->',
    '',
    '<!-- company-progress:start -->', 'stale', '<!-- company-progress:end -->',
    '',
    '<!-- company-list:start -->', 'stale', '<!-- company-list:end -->',
    '',
  ].join('\n'));
  fs.writeFileSync(path.join(root, 'SOLUTIONS.md'), 'stale\n');
  writeJson(path.join(root, 'data/roadmap.json'), {
    schemaVersion: 3,
    name: 'NeetCode All',
    snapshotDate: '2026-09-14',
    total: 10,
    topics: [
      { slug: 'arrays-and-hashing', label: 'Arrays & Hashing', total: 5 },
      { slug: 'stack', label: 'Stack', total: 5 },
    ],
    problems: [],
  });
  return root;
}

function readRoadmap(root) {
  return readJson(path.join(root, 'data/roadmap.json'));
}

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
