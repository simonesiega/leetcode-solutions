'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { afterEach, test } = require('node:test');

// Tests run against disposable repositories because the CLI resolves paths from its own location.
const fixtures = [];

afterEach(() => {
  while (fixtures.length) fs.rmSync(fixtures.pop(), { recursive: true, force: true });
});

test('tracks a company problem from planning through completion', () => {
  const root = createRepository();

  // Exercise the public commands in the same order used during real interview preparation.
  run(root, ['add-company', 'Amazon', '--website', 'https://amazon.jobs', '--focus', 'Americas OA']);
  assert.equal(fs.existsSync(path.join(root, 'companies/amazon/solutions/.gitkeep')), true);
  const initialReadme = fs.readFileSync(path.join(root, 'companies/amazon/README.md'), 'utf8');
  assert.match(initialReadme, /title Solved Problems by Difficulty \(0 Total\)/);
  assert.match(initialReadme, /"Easy" : 0/);
  run(root, ['add-problem', 'amazon', '1', 'Two Sum', 'Easy', '--notes', 'Hash map']);

  let manifest = readManifest(root, 'amazon');
  assert.equal(manifest.focus, 'Americas OA');
  assert.equal(manifest.problems[0].status, 'planned');
  assert.equal(manifest.problems[0].url, 'https://leetcode.com/problems/two-sum/');
  assert.equal(fs.existsSync(path.join(root, 'companies/amazon/solutions/1.py')), false);

  run(root, ['start', 'amazon', '1']);
  const solutionPath = path.join(root, 'companies/amazon/solutions/1.py');
  assert.match(fs.readFileSync(solutionPath, 'utf8'), /TODO\(company-solution\)/);
  assert.equal(fs.existsSync(path.join(root, 'companies/amazon/solutions/.gitkeep')), false);
  assert.equal(readManifest(root, 'amazon').problems[0].status, 'in-progress');

  fs.writeFileSync(solutionPath, 'class Solution:\n    pass\n');
  run(root, ['solve', 'amazon', '1', '--time', 'O(n)', '--space', 'O(n)']);
  run(root, ['--check']);

  manifest = readManifest(root, 'amazon');
  assert.equal(manifest.problems[0].status, 'solved');
  assert.equal(manifest.problems[0].time, 'O(n)');
  const companyReadme = fs.readFileSync(path.join(root, 'companies/amazon/README.md'), 'utf8');
  assert.match(companyReadme, /\*\*Focus:\*\* Americas OA/);
  assert.match(companyReadme, /✅ Solved/);
  assert.match(companyReadme, /title Solved Problems by Difficulty \(1 Total\)/);
  assert.match(companyReadme, /"Easy" : 1/);
  assert.match(companyReadme, /"Medium" : 0/);
  assert.match(companyReadme, /"Hard" : 0/);
  assert.match(fs.readFileSync(path.join(root, 'companies/README.md'), 'utf8'), /\[Amazon\]\(amazon\/README.md\) \| 1 \/ 1/);
  const rootReadme = fs.readFileSync(path.join(root, 'README.md'), 'utf8');
  assert.match(rootReadme, /1 company · 1 solved/);
  assert.match(rootReadme, /img\.shields\.io\/badge\/Companies-1-blue/);
  assert.match(rootReadme, /alt="Companies covered: 1"/);
  assert.match(rootReadme, /\| Amazon \| \[`companies\/amazon\/`\]\(companies\/amazon\/\) \|/);
});

test('supports named OA problems and detects stale generated documentation', () => {
  const root = createRepository();

  run(root, ['add-company', 'Example Labs']);
  run(root, [
    'add-problem', 'example-labs', 'oa-pairs', 'Pair Optimization', 'Medium',
    '--url', 'https://example.com/oa/pairs',
  ]);

  const manifest = readManifest(root, 'example-labs');
  assert.equal(manifest.problems[0].id, 'oa-pairs');
  assert.equal(manifest.problems[0].url, 'https://example.com/oa/pairs');

  // Check mode must report drift without silently overwriting a manually changed dashboard.
  fs.appendFileSync(path.join(root, 'companies/README.md'), '\nstale\n');
  const result = run(root, ['--check'], false);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /documentation is outdated/);
});

test('will not mark an unfinished template as solved', () => {
  const root = createRepository();

  run(root, ['add-company', 'Acme']);
  run(root, ['add-problem', 'acme', '42', 'Rain Water', 'Hard']);
  run(root, ['start', 'acme', '42']);

  // The generated TODO marker prevents an untouched scaffold from inflating solved counts.
  const result = run(root, ['solve', 'acme', '42', '--time', 'O(n)', '--space', 'O(1)'], false);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /remove the TODO\(company-solution\) marker/);
  assert.equal(readManifest(root, 'acme').problems[0].status, 'in-progress');
});

test('will not count an empty or comment-only file as a solution', () => {
  const root = createRepository();

  run(root, ['add-company', 'Acme']);
  run(root, ['add-problem', 'acme', '1', 'Two Sum', 'Easy']);
  run(root, ['start', 'acme', '1']);
  fs.writeFileSync(path.join(root, 'companies/acme/solutions/1.py'), '# Notes only.\n');

  const result = run(root, ['solve', 'acme', '1', '--time', 'O(n)', '--space', 'O(n)'], false);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /does not contain a Python solution/);
  assert.equal(readManifest(root, 'acme').problems[0].status, 'in-progress');
});

// Create the smallest repository layout needed to test the script as a true subprocess.
function createRepository() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'company-tracker-'));
  fixtures.push(root);
  fs.mkdirSync(path.join(root, 'scripts'), { recursive: true });
  fs.mkdirSync(path.join(root, 'companies'), { recursive: true });
  fs.copyFileSync(path.join(__dirname, 'company-tracker.js'), path.join(root, 'scripts/company-tracker.js'));
  fs.writeFileSync(path.join(root, 'README.md'), [
    '# Test repository',
    '',
    '  <!-- company-count:start -->',
    '  Not generated.',
    '  <!-- company-count:end -->',
    '',
    '<!-- company-progress:start -->',
    'Not generated.',
    '<!-- company-progress:end -->',
    '',
    '<!-- company-list:start -->',
    'Not generated.',
    '<!-- company-list:end -->',
    '',
  ].join('\n'));
  return root;
}

function run(root, args, expectSuccess = true) {
  const result = spawnSync(process.execPath, ['scripts/company-tracker.js', ...args], {
    cwd: root,
    encoding: 'utf8',
  });
  if (expectSuccess && result.status !== 0) {
    assert.fail(`Command failed: ${args.join(' ')}\nstdout: ${result.stdout}\nstderr: ${result.stderr}`);
  }
  return result;
}

function readManifest(root, slug) {
  return JSON.parse(fs.readFileSync(path.join(root, 'companies', slug, 'company.json'), 'utf8'));
}
