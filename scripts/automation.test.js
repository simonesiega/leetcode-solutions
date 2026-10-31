'use strict';

// Integration coverage for safe imports, both trackers, generated files, and source parsing.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { afterEach, test } = require('node:test');
const {
  buildRawSourceUrl, getSourceCachePath, normalizeLeetCodeUrl, parseCompanySourceCsv,
} = require('./lib/company-source');
const { parseCsv } = require('./lib/csv');
const { readJson, writeJson } = require('./lib/json');
const {
  escapeLinkDestination, escapeMarkdown, escapeTable, renderColoredPieChart, renderDifficultyChart,
  renderMermaidChart, renderPersonalDifficultyChart, replaceBlock,
} = require('./lib/markdown');
const { getSolvedPersonalDifficultyCounts } = require('./lib/progress');
const { createSolutionScaffold } = require('./lib/solutions');
const {
  assertComplexity, assertHttpUrl, assertIsoInstant, assertPersonalDifficulty, parseOptionalPersonalDifficulty,
  validateCanonicalLeetCodeUrl,
  validateProblemId, validateSlug,
} = require('./lib/validation');

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

test('root company pie includes only solved counts and handles empty progress', () => {
  const root = createRepository();
  run(root, 'company-tracker.js', []);
  assert.match(fs.readFileSync(path.join(root, 'README.md'), 'utf8'), /No company plans yet/);
  for (const name of ['Alpha', 'Beta']) {
    run(root, 'company-tracker.js', ['add-company', name]);
    run(root, 'company-tracker.js', ['add-problem', name.toLowerCase(), '1', 'Two Sum', 'Easy']);
  }
  assert.match(fs.readFileSync(path.join(root, 'README.md'), 'utf8'), /No solved company problems yet/);
  run(root, 'company-tracker.js', ['start', 'alpha', '1']);
  fs.writeFileSync(path.join(root, 'companies/alpha/solutions/1.py'), '# Two Sum - 1\n\nclass Solution:\n    pass\n');
  run(root, 'company-tracker.js', ['solve', 'alpha', '1', '--time', 'O(n)', '--space', 'O(n)']);
  run(root, 'company-tracker.js', ['start', 'beta', '1']);
  const readme = fs.readFileSync(path.join(root, 'README.md'), 'utf8');
  const block = readme.split('<!-- company-progress:start -->')[1].split('<!-- company-progress:end -->')[0];
  assert.match(block, /Company practice currently contains \*\*2 companies\*\*/);
  assert.match(block, /pie showData\n    title Solved Problems by Company \(1 Total\)\n    "Alpha" : 1/);
  assert.doesNotMatch(block, /Beta|in progress|planned/);
  assert.match(fs.readFileSync(path.join(root, 'companies/beta/README.md'), 'utf8'), /In progress/i);
  run(root, 'company-tracker.js', ['--check']);
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
  const readme = fs.readFileSync(path.join(root, 'README.md'), 'utf8');
  assert.match(readme, /captured on September 14, 2026/);
  assert.match(readme, /Solved Problems by Personal Difficulty \(1 Rated\)\n    "4\/10" : 1/);
  assert.match(fs.readFileSync(path.join(root, 'SOLUTIONS.md'), 'utf8'), new RegExp(`\\| ${solvedAt.slice(0, 10)} \\|`));
});

test('roadmap solve preserves a preassigned rating and repeated start preserves uploaded code', () => {
  const root = createRepository();
  run(root, 'roadmap-tracker.js', [
    'add', '5', 'Longest Palindromic Substring', 'arrays-and-hashing', 'Medium',
    '--url', 'https://leetcode.com/problems/longest-palindromic-substring/', '--personal-difficulty', '10',
  ]);
  assert.doesNotMatch(fs.readFileSync(path.join(root, 'README.md'), 'utf8'), /"10\/10"/);
  run(root, 'roadmap-tracker.js', ['start', '5']);
  const solutionPath = path.join(root, 'neetcode-all/arrays-and-hashing/5.py');
  const source = '# Longest Palindromic Substring - 5\n\nclass Solution:\n    pass\n';
  fs.writeFileSync(solutionPath, source);
  run(root, 'roadmap-tracker.js', ['start', '5']);
  assert.equal(fs.readFileSync(solutionPath, 'utf8'), source);
  assert.doesNotMatch(fs.readFileSync(path.join(root, 'README.md'), 'utf8'), /"10\/10"/);
  run(root, 'roadmap-tracker.js', ['solve', '5', '--time', 'O(n²)', '--space', 'O(n)']);
  assert.equal(readRoadmap(root).problems[0].personalDifficulty, 10);
  assert.match(fs.readFileSync(path.join(root, 'README.md'), 'utf8'), /Solved Problems by Personal Difficulty \(1 Rated\)\n    "10\/10" : 1/);
  run(root, 'roadmap-tracker.js', ['--check']);
});

test('scaffolds cannot overwrite a concurrently created solution and propagate other write errors', (t) => {
  const root = createRepository();
  const solutionPath = path.join(root, 'solutions/1.py');
  fs.mkdirSync(path.dirname(solutionPath), { recursive: true });
  const source = '# Two Sum - 1\n\nclass Solution:\n    pass\n';
  const writeFile = fs.writeFileSync;
  t.mock.method(fs, 'writeFileSync', (filePath, content, options) => {
    // Simulate an upload after any existence check but before the scaffold write.
    writeFile(filePath, source);
    return writeFile(filePath, content, options);
  });
  createSolutionScaffold(solutionPath, { id: 1, title: 'Two Sum' }, 'roadmap-solution');
  assert.equal(fs.readFileSync(solutionPath, 'utf8'), source);
  assert.equal(fs.writeFileSync.mock.calls[0].arguments[2].flag, 'wx');

  t.mock.restoreAll();
  const denied = Object.assign(new Error('Write denied'), { code: 'EACCES' });
  t.mock.method(fs, 'writeFileSync', () => { throw denied; });
  assert.throws(
    () => createSolutionScaffold(path.join(root, 'solutions/2.py'), { id: 2, title: 'Another' }, 'roadmap-solution'),
    (error) => error === denied,
  );
});

test('personal difficulty counts only solved ratings, including both scale boundaries', () => {
  const problems = [
    { status: 'solved', personalDifficulty: 10 },
    { status: 'solved', personalDifficulty: 1 },
    { status: 'solved', personalDifficulty: 10 },
    { status: 'solved', personalDifficulty: null },
    { status: 'planned', personalDifficulty: 5 },
    { status: 'in-progress', personalDifficulty: 9 },
  ];
  const before = structuredClone(problems);
  assert.deepEqual(getSolvedPersonalDifficultyCounts(problems), [1, 0, 0, 0, 0, 0, 0, 0, 0, 2]);
  assert.deepEqual(getSolvedPersonalDifficultyCounts([]), Array(10).fill(0));
  assert.deepEqual(problems, before);
});

test('Mermaid charts use a centered container with blank lines around the fenced block', () => {
  const source = ['pie showData', '    title Test chart', '    "A" : 1'];
  const before = [...source];
  assert.deepEqual(renderMermaidChart(source), [
    '<div align="center">', '', '```mermaid', ...source, '```', '', '</div>',
  ]);
  assert.deepEqual(source, before);
});

test('personal difficulty charts omit unused ratings, sort numerically, and keep stable colors', () => {
  assert.deepEqual(renderPersonalDifficultyChart(Array(10).fill(0)), [
    '_No personally rated solved roadmap problems yet._',
  ]);
  const sparse = renderPersonalDifficultyChart([1, 0, 0, 0, 0, 0, 0, 0, 0, 2]).slice(2, -2);
  assert.deepEqual(sparse.slice(3, -1), [
    '    title Solved Problems by Personal Difficulty (3 Rated)',
    '    "1/10" : 1',
    '    "10/10" : 2',
  ]);
  const full = renderPersonalDifficultyChart(Array(10).fill(1)).slice(2, -2);
  assert.deepEqual(full.slice(4, -1), Array.from({ length: 10 }, (_, index) => `    "${index + 1}/10" : 1`));
  const config = (lines) => JSON.parse(lines[1].match(/^%%\{init: (.*)\}%%$/)[1]);
  const sparseColors = config(sparse).themeVariables;
  const fullColors = config(full).themeVariables;
  assert.equal(sparseColors.pie1, fullColors.pie1);
  assert.equal(sparseColors.pie2, fullColors.pie10);
  assert.equal(new Set(Object.values(fullColors)).size, 10);
  assert.ok(config(sparse).themeCSS.includes(`.pieCircle:nth-of-type(2){fill:${fullColors.pie10}!important}`));
  assert.ok(config(sparse).themeCSS.includes(`.legend:nth-of-type(3) rect{fill:${fullColors.pie10}!important;stroke:${fullColors.pie10}!important}`));
});

test('colored pie rendering preserves topic palettes beyond Mermaid’s twelve theme colors', () => {
  const slices = Array.from({ length: 18 }, (_, index) => ({
    label: `Topic "${index + 1}"`, count: index + 1, color: `#${index.toString(16).padStart(6, '0')}`,
  }));
  const lines = renderColoredPieChart('Test topics', slices).slice(2, -2);
  const config = JSON.parse(lines[1].match(/^%%\{init: (.*)\}%%$/)[1]);
  assert.equal(Object.keys(config.themeVariables).length, 12);
  assert.deepEqual(lines.slice(4, -1), slices.map((slice, index) => `    "Topic #quot;${index + 1}#quot;" : ${slice.count}`));
  for (const [index, slice] of slices.entries()) {
    if (index < 12) assert.equal(config.themeVariables[`pie${index + 1}`], slice.color);
    assert.ok(config.themeCSS.includes(`.pieCircle:nth-of-type(${index + 1}){fill:${slice.color}!important}`));
    assert.ok(config.themeCSS.includes(`.legend:nth-of-type(${index + 2}) rect{fill:${slice.color}!important;stroke:${slice.color}!important}`));
  }
});

test('roadmap charts handle empty and unrated progress, preserve order, and detect personal chart drift', () => {
  const root = createRepository();
  const readmePath = path.join(root, 'README.md');
  const personalBlock = (readme) => readme.split('<!-- personal-difficulty-chart:start -->')[1]
    .split('<!-- personal-difficulty-chart:end -->')[0];
  run(root, 'roadmap-tracker.js', []);
  assert.match(personalBlock(fs.readFileSync(readmePath, 'utf8')), /No personally rated solved roadmap problems yet/);

  const roadmap = readRoadmap(root);
  roadmap.problems = [
    { id: 1, status: 'solved', personalDifficulty: 10 },
    { id: 2, status: 'solved', personalDifficulty: 1 },
    { id: 3, status: 'solved', personalDifficulty: null },
    { id: 4, status: 'planned', personalDifficulty: 5 },
    { id: 5, status: 'in-progress', personalDifficulty: 9 },
  ].map((problem) => ({
    ...problem,
    title: `Task ${problem.id}`,
    url: `https://leetcode.com/problems/task-${problem.id}/`,
    topic: 'arrays-and-hashing',
    difficulty: 'Easy',
    solvedAt: problem.status === 'solved' ? '2026-09-20T17:14:31.000Z' : null,
    timeComplexity: problem.status === 'solved' ? 'O(1)' : '',
    spaceComplexity: problem.status === 'solved' ? 'O(1)' : '',
  }));
  const solutions = path.join(root, 'neetcode-all/arrays-and-hashing');
  fs.mkdirSync(solutions, { recursive: true });
  for (const problem of roadmap.problems.filter((entry) => entry.status !== 'planned')) {
    fs.writeFileSync(path.join(solutions, `${problem.id}.py`), `# ${problem.title} - ${problem.id}\n\nclass Solution:\n    pass\n`);
  }
  writeJson(path.join(root, 'data/roadmap.json'), roadmap);
  run(root, 'roadmap-tracker.js', []);
  const generated = fs.readFileSync(readmePath, 'utf8');
  assert.match(generated, /Solved Problems by Topic \(3 Total\)/);
  assert.match(generated, /Solved Problems by Difficulty \(3 Total\)/);
  assert.match(personalBlock(generated), /Solved Problems by Personal Difficulty \(2 Rated\)\n    "1\/10" : 1\n    "10\/10" : 1/);
  const markers = ['topic-chart', 'difficulty-chart', 'personal-difficulty-chart', 'topic-table'];
  for (let index = 1; index < markers.length; index++) {
    assert.ok(generated.indexOf(`<!-- ${markers[index - 1]}:end -->`) < generated.indexOf(`<!-- ${markers[index]}:start -->`));
  }
  run(root, 'roadmap-tracker.js', ['--check']);
  run(root, 'roadmap-tracker.js', []);
  assert.equal(fs.readFileSync(readmePath, 'utf8'), generated);

  const stale = generated.replace('"1/10" : 1', '"1/10" : 999');
  fs.writeFileSync(readmePath, stale);
  assert.match(run(root, 'roadmap-tracker.js', ['--check'], false).stderr, /Generated roadmap documentation is outdated/);
  assert.equal(fs.readFileSync(readmePath, 'utf8'), stale);
  run(root, 'roadmap-tracker.js', []);
  assert.equal(fs.readFileSync(readmePath, 'utf8'), generated);
  const missing = generated.replace('<!-- personal-difficulty-chart:start -->', '');
  fs.writeFileSync(readmePath, missing);
  assert.match(run(root, 'roadmap-tracker.js', ['--check'], false).stderr, /Missing README.md markers for "personal-difficulty-chart"/);
  assert.equal(fs.readFileSync(readmePath, 'utf8'), missing);

  for (const problem of roadmap.problems) problem.personalDifficulty = null;
  writeJson(path.join(root, 'data/roadmap.json'), roadmap);
  fs.writeFileSync(readmePath, generated);
  run(root, 'roadmap-tracker.js', []);
  assert.match(personalBlock(fs.readFileSync(readmePath, 'utf8')), /No personally rated solved roadmap problems yet/);
  run(root, 'roadmap-tracker.js', ['--check']);
});

test('all generated README charts are centered once without centering surrounding prose', () => {
  const root = createSolvedRoadmapRepository();
  const roadmap = readRoadmap(root);
  roadmap.problems[0].personalDifficulty = 4;
  writeJson(path.join(root, 'data/roadmap.json'), roadmap);
  run(root, 'roadmap-tracker.js', []);
  run(root, 'company-tracker.js', ['add-company', 'Alpha']);
  run(root, 'company-tracker.js', ['add-problem', 'alpha', '1', 'Two Sum', 'Easy']);
  run(root, 'company-tracker.js', ['start', 'alpha', '1']);
  fs.writeFileSync(path.join(root, 'companies/alpha/solutions/1.py'), '# Two Sum - 1\n\nclass Solution:\n    pass\n');
  run(root, 'company-tracker.js', ['solve', 'alpha', '1', '--time', 'O(n)', '--space', 'O(n)']);
  const readmePath = path.join(root, 'README.md');
  const generated = fs.readFileSync(readmePath, 'utf8');
  const centeredChart = /<div align="center">\n\n```mermaid\n([\s\S]*?)\n```\n\n<\/div>/g;
  const charts = [...generated.matchAll(centeredChart)];
  assert.equal(charts.length, 4);
  assert.equal((generated.match(/^```mermaid$/gm) || []).length, charts.length);
  assert.deepEqual(charts.map((chart) => chart[1].match(/title Solved Problems by (.*) \(/)[1]), [
    'Topic', 'Difficulty', 'Personal Difficulty', 'Company',
  ]);
  assert.match(generated, /Company practice currently contains \*\*1 company\*\*\n\n<div align="center">/);
  const companyReadme = fs.readFileSync(path.join(root, 'companies/alpha/README.md'), 'utf8');
  assert.equal([...companyReadme.matchAll(centeredChart)].length, 1);
  assert.match(companyReadme, /<\/div>\n\n\| Rank \| Problem/);

  const watched = ['README.md', 'SOLUTIONS.md', 'data/roadmap.json', 'companies/README.md',
    'companies/alpha/company.json', 'companies/alpha/README.md'];
  const before = new Map(watched.map((file) => [file, fs.readFileSync(path.join(root, file), 'utf8')]));
  for (const script of ['roadmap-tracker.js', 'company-tracker.js']) {
    run(root, script, []);
    run(root, script, ['--check']);
  }
  for (const [file, content] of before) assert.equal(fs.readFileSync(path.join(root, file), 'utf8'), content);

  const uncentered = generated.replace(centeredChart, '```mermaid\n$1\n```');
  fs.writeFileSync(readmePath, uncentered);
  for (const script of ['roadmap-tracker.js', 'company-tracker.js']) {
    assert.match(run(root, script, ['--check'], false).stderr, /documentation is outdated/);
    assert.equal(fs.readFileSync(readmePath, 'utf8'), uncentered);
  }
  for (const script of ['roadmap-tracker.js', 'company-tracker.js']) run(root, script, []);
  assert.equal(fs.readFileSync(readmePath, 'utf8'), generated);
});

test('personal difficulty metadata and CLI values enforce the optional integer 1–10 scale', () => {
  for (const rating of [null, 1, 10]) assert.doesNotThrow(() => assertPersonalDifficulty(rating, 'Problem'));
  for (const rating of [undefined, 0, 11, -1, 1.5, '3', NaN, Infinity]) {
    assert.throws(() => assertPersonalDifficulty(rating, 'Problem'), /null or an integer from 1 to 10/);
  }
  assert.equal(parseOptionalPersonalDifficulty({}, null), null);
  assert.equal(parseOptionalPersonalDifficulty({}, undefined), undefined);
  for (const rating of ['1', '10']) {
    assert.equal(parseOptionalPersonalDifficulty({ 'personal-difficulty': rating }, null), Number(rating));
  }
  for (const rating of ['0', '11', '-1', '1.5', '01', '1e1', '3x', ' 3', '']) {
    assert.throws(() => parseOptionalPersonalDifficulty({ 'personal-difficulty': rating }, null), /integer from 1 to 10/);
  }
});

test('roadmap validation enforces schema v3 dates and generated-file drift', () => {
  const root = createSolvedRoadmapRepository();
  const roadmapPath = path.join(root, 'data/roadmap.json');
  const valid = readJson(roadmapPath);
  const cases = [
    [(roadmap) => { roadmap.extra = true; }, /unknown field.*extra/],
    [(roadmap) => { roadmap.problems[0].extra = true; }, /unknown field.*extra/],
    [(roadmap) => {
      roadmap.problems.push({
        ...roadmap.problems[0], id: 6, status: 'planned', solvedAt: null,
        timeComplexity: '', spaceComplexity: '',
      });
    }, /Duplicate roadmap problem URL/],
    [(roadmap) => { roadmap.snapshotDate = '2026-02-30'; }, /snapshotDate must be a valid date/],
    [(roadmap) => { roadmap.total++; }, /topic totals must sum/],
    [(roadmap) => { roadmap.topics[0].slug = 'aux'; }, /reserved filename on Windows/],
    [(roadmap) => { roadmap.problems[0].id = 2 ** 53; }, /positive safe integer/],
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
  const duplicate = run(root, 'roadmap-tracker.js', [
    'add', '6', 'Another Title', 'arrays-and-hashing', 'Easy',
    '--url', valid.problems[0].url,
  ], false);
  assert.match(duplicate.stderr, /Duplicate roadmap problem URL/);
  assert.deepEqual(readJson(roadmapPath), valid);

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
  assert.match(fs.readFileSync(path.join(root, 'README.md'), 'utf8'), /Solved Problems by Company \(1 Total\)/);

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

test('company manifests are validated before display sorting without writing generated files', () => {
  const root = createRepository();
  for (const name of ['Alpha', 'Beta']) run(root, 'company-tracker.js', ['add-company', name]);
  const manifestPath = path.join(root, 'companies/beta/company.json');
  const valid = readJson(manifestPath);
  const watched = ['README.md', 'companies/README.md', 'companies/alpha/README.md', 'companies/beta/README.md'];
  const before = new Map(watched.map((file) => [file, fs.readFileSync(path.join(root, file), 'utf8')]));
  const cases = [
    [null, /companies\/beta\/company\.json must be an object/],
    [[], /companies\/beta\/company\.json must be an object/],
    [{}, /companies\/beta\/company\.json is missing required field/],
    [{ ...valid, name: null }, /companies\/beta\/company\.json name must be non-empty/],
    [{ ...valid, name: 42 }, /companies\/beta\/company\.json name must be non-empty/],
  ];
  for (const [invalid, error] of cases) {
    writeJson(manifestPath, invalid);
    const manifestBefore = fs.readFileSync(manifestPath, 'utf8');
    for (const command of ['--check', 'update']) {
      const result = run(root, 'company-tracker.js', [command], false);
      assert.match(result.stderr, error);
      assert.doesNotMatch(result.stderr, /TypeError|localeCompare/);
      assert.equal(fs.readFileSync(manifestPath, 'utf8'), manifestBefore);
      for (const [file, content] of before) assert.equal(fs.readFileSync(path.join(root, file), 'utf8'), content);
    }
  }
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

test('source normalization rejects malformed slugs before they can enter the cache', () => {
  assert.equal(
    normalizeLeetCodeUrl('http://www.leetcode.com/problems/two-sum?envType=company#details'),
    'https://leetcode.com/problems/two-sum/',
  );
  for (const slug of ['--', '-two-sum', 'two-sum-', 'two--sum']) {
    const url = `https://leetcode.com/problems/${slug}/`;
    assert.throws(() => normalizeLeetCodeUrl(url), /must identify a LeetCode problem slug/);
    assert.throws(() => parseCompanySourceCsv([
      'Difficulty,Title,Frequency,Link', `EASY,Example,90,${url}`,
    ].join('\n')), /Company source row 2 Link must identify a LeetCode problem slug/);
  }

  const root = createRepository();
  const manifestPath = createSourceCompany(root);
  run(root, 'company-tracker.js', []);
  run(root, 'company-tracker.js', ['source-sync', 'source-labs', '--file', 'scripts/fixtures/company-source.csv']);
  const cacheDirectory = path.join(root, '.cache/company-source/source-labs');
  const cachePath = path.join(cacheDirectory, fs.readdirSync(cacheDirectory)[0]);
  const cached = fs.readFileSync(cachePath, 'utf8');
  const manifest = fs.readFileSync(manifestPath, 'utf8');
  fs.writeFileSync(path.join(root, 'invalid.csv'), [
    'Difficulty,Title,Frequency,Link',
    'EASY,Invalid,90,https://leetcode.com/problems/two--sum/',
  ].join('\n'));
  assert.match(run(root, 'company-tracker.js', [
    'source-sync', 'source-labs', '--file', 'invalid.csv',
  ], false).stderr, /must identify a LeetCode problem slug/);
  assert.equal(fs.readFileSync(cachePath, 'utf8'), cached);
  assert.equal(fs.readFileSync(manifestPath, 'utf8'), manifest);
});

test('Markdown helpers preserve literal text and safe link destinations', () => {
  const input = 'before\n  <!-- sample:start -->\n  stale\n  <!-- sample:end -->\nafter\n';
  assert.equal(
    replaceBlock(input, 'sample', ['$& is literal']),
    'before\n  <!-- sample:start -->\n  $& is literal\n  <!-- sample:end -->\nafter\n',
  );
  assert.equal(
    replaceBlock(input.replace(/\n/g, '\r\n'), 'sample', ['fresh']),
    'before\r\n  <!-- sample:start -->\r\n  fresh\r\n  <!-- sample:end -->\r\nafter\r\n',
  );
  assert.throws(() => replaceBlock('no markers', 'sample', []), /Missing README.md markers/);
  assert.throws(
    () => replaceBlock('<!-- sample:end -->\n<!-- sample:start -->\n', 'sample', []),
    /exactly one ordered pair/,
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

test('portable names reject Windows devices but retain ordinary custom IDs', () => {
  for (const id of ['CON', 'nul', 'Aux.txt', 'com1', 'LPT9.extra']) {
    assert.throws(() => validateProblemId(id), /reserved filename on Windows/);
  }
  for (const slug of ['con', 'prn', 'aux', 'nul', 'com9', 'lpt1']) {
    assert.throws(() => validateSlug(slug), /reserved filename on Windows/);
  }
  for (const id of ['oa-pairs', 'CON-test', 'com10', 'Round_1.2']) {
    assert.doesNotThrow(() => validateProblemId(id));
  }
});

test('company IDs cannot collide on case-insensitive filesystems', () => {
  const root = createRepository();
  run(root, 'company-tracker.js', ['add-company', 'Portable']);
  run(root, 'company-tracker.js', ['add-problem', 'portable', 'Task', 'First', 'Easy']);
  const manifestPath = path.join(root, 'companies/portable/company.json');
  const before = fs.readFileSync(manifestPath, 'utf8');
  const result = run(root, 'company-tracker.js', ['add-problem', 'portable', 'task', 'Second', 'Easy'], false);
  assert.match(result.stderr, /case-insensitive filenames/);
  assert.equal(fs.readFileSync(manifestPath, 'utf8'), before);
  assert.match(
    run(root, 'company-tracker.js', ['add-problem', 'portable', 'NUL.txt', 'Device', 'Easy'], false).stderr,
    /reserved filename on Windows/,
  );
  assert.equal(fs.readFileSync(manifestPath, 'utf8'), before);
});

test('company ordering is independent of insertion order and environment locale', () => {
  const root = createRepository();
  run(root, 'company-tracker.js', ['add-company', 'Portable']);
  for (const id of ['10', '2', '1', '01', 'z-task', 'a-task']) {
    run(root, 'company-tracker.js', ['add-problem', 'portable', id, `Task ${id}`, 'Easy']);
  }
  const manifest = readJson(path.join(root, 'companies/portable/company.json'));
  assert.deepEqual(manifest.problems.map((problem) => problem.id), ['01', '1', '2', '10', 'a-task', 'z-task']);
  // Swedish sorts Å after Z; English sorts it with A.
  for (const name of ['Zulu', 'Ångström']) run(root, 'company-tracker.js', ['add-company', name]);
  const readme = fs.readFileSync(path.join(root, 'companies/README.md'), 'utf8');
  assert.ok(readme.indexOf('[Ångström]') < readme.indexOf('[Zulu]'));
  const result = spawnSync(process.execPath, ['scripts/company-tracker.js', '--check'], {
    cwd: root, encoding: 'utf8', env: { ...process.env, LANG: 'sv_SE.UTF-8', LC_ALL: 'sv_SE.UTF-8' },
  });
  assert.equal(result.status, 0, result.stderr);
});

test('UTF-8 BOM, CRLF, spaces in paths, and an outside cwd do not cause drift', () => {
  const root = createSolvedRoadmapRepository();
  run(root, 'company-tracker.js', ['add-company', 'Portable']);
  const files = ['data/roadmap.json', 'companies/portable/company.json'];
  for (const file of files) {
    const filePath = path.join(root, file);
    fs.writeFileSync(filePath, `\uFEFF${fs.readFileSync(filePath, 'utf8').replace(/\n/g, '\r\n')}`);
  }
  const markdown = ['README.md', 'SOLUTIONS.md', 'companies/README.md', 'companies/portable/README.md'];
  for (const file of markdown) {
    const filePath = path.join(root, file);
    fs.writeFileSync(filePath, fs.readFileSync(filePath, 'utf8').replace(/\n/g, '\r\n'));
  }
  const before = new Map([...files, ...markdown].map((file) => [file, fs.readFileSync(path.join(root, file), 'utf8')]));
  for (const script of ['roadmap-tracker.js', 'company-tracker.js']) {
    for (const args of [['--check'], [], []]) {
      const result = spawnSync(process.execPath, [path.join(root, 'scripts', script), ...args], {
        cwd: os.tmpdir(), encoding: 'utf8',
      });
      assert.equal(result.status, 0, result.stderr);
    }
  }
  for (const [file, content] of before) assert.equal(fs.readFileSync(path.join(root, file), 'utf8'), content);
  fs.appendFileSync(path.join(root, 'SOLUTIONS.md'), 'real drift\r\n');
  assert.match(run(root, 'roadmap-tracker.js', ['--check'], false).stderr, /outdated/);
});

test('URL and complexity validation reject normalized-away controls and noncanonical forms', () => {
  for (const url of [
    'https://leetcode.com/prob\nlems/two-sum/',
    'https://leetcode.com:443/problems/two-sum/',
    'https://LEETCODE.com/problems/two-sum/',
    'https://leetcode.com/problems/--/',
    'https://leetcode.com/problems/two-sum/?',
  ]) {
    assert.throws(() => validateCanonicalLeetCodeUrl(url, 'Problem'), /canonical/);
  }
  assert.doesNotThrow(() => validateCanonicalLeetCodeUrl('https://leetcode.com/problems/two-sum/', 'Problem'));
  for (const character of ['\u0000', '\u0001', '\t', '\n', '\u007F']) {
    assert.throws(() => assertHttpUrl(`https://example.com/a${character}b`, 'URL'), /control characters/);
    assert.throws(() => assertComplexity(`O(n)${character}note`, 'Time'), /single-line/);
  }
});

test('metadata renders as literal text without breaking links, tables, or headers', () => {
  const title = 'Task [x] | <tag> &amp; *star* _name_ `code` \\ path';
  const escaped = 'Task \\[x\\] | \\<tag\\> &amp;amp; \\*star\\* \\_name\\_ \\`code\\` \\\\ path';
  assert.equal(escapeMarkdown(title), escaped);
  assert.equal(escapeMarkdown('Task # ~~note~~'), 'Task \\# \\~\\~note\\~\\~');
  for (const eol of ['\n', '\r\n', '\r']) {
    assert.equal(escapeTable(`${title}${eol}Next line`), `${escaped.replace('|', '\\|')}<br>Next line`);
  }
  assert.equal(
    escapeLinkDestination('https://example.com/a|b\\c`d(e)<f>'),
    'https://example.com/a%7Cb%5Cc%60d%28e%29%3Cf%3E',
  );

  const root = createRepository();
  const roadmapPath = path.join(root, 'data/roadmap.json');
  const roadmap = readRoadmap(root);
  roadmap.topics[0].label = title;
  writeJson(roadmapPath, roadmap);
  run(root, 'roadmap-tracker.js', [
    'add', '1', title, 'arrays-and-hashing', 'Easy', '--url', 'https://leetcode.com/problems/task/',
  ]);
  run(root, 'roadmap-tracker.js', ['start', '1']);
  const solution = `# ${title} - 1\n\nclass Solution:\n    pass\n`;
  fs.writeFileSync(path.join(root, 'neetcode-all/arrays-and-hashing/1.py'), solution);
  run(root, 'roadmap-tracker.js', ['solve', '1', '--time', '`O(1)`', '--space', '`O(1)`']);
  const catalog = fs.readFileSync(path.join(root, 'SOLUTIONS.md'), 'utf8');
  assert.ok(catalog.includes(`## ${escaped}\n`));
  assert.ok(catalog.includes(`[${escapeTable(title)}](https://leetcode.com/problems/task/)`));
  assert.ok(catalog.includes('| `O(1)` | `O(1)` |'));
  assert.equal(readRoadmap(root).problems[0].title, title);

  run(root, 'company-tracker.js', ['add-company', 'Literal']);
  run(root, 'company-tracker.js', [
    'add-problem', 'literal', 'task', title, 'Easy',
    '--url', 'https://example.com/a|b', '--notes', '<img> **note**\nNext line',
  ]);
  const dashboard = fs.readFileSync(path.join(root, 'companies/literal/README.md'), 'utf8');
  assert.ok(dashboard.includes(`[${escapeTable(title)}](https://example.com/a%7Cb)`));
  assert.ok(dashboard.includes('\\<img\\> \\*\\*note\\*\\*<br>Next line'));
  for (const script of ['roadmap-tracker.js', 'company-tracker.js']) run(root, script, ['--check']);
});

test('empty difficulty charts use prose instead of a zero-total pie', () => {
  assert.deepEqual(renderDifficultyChart({ Easy: 0, Medium: 0, Hard: 0 }, 0), ['_No solved problems yet._']);
  const root = createRepository();
  run(root, 'roadmap-tracker.js', []);
  run(root, 'company-tracker.js', ['add-company', 'Empty']);
  for (const file of ['README.md', 'companies/empty/README.md']) {
    const content = fs.readFileSync(path.join(root, file), 'utf8');
    assert.ok(content.includes('_No solved problems yet._'));
    assert.doesNotMatch(content, /```mermaid/);
  }
});

test('both lifecycles reject unfinished solutions without changing metadata or dashboards', () => {
  const root = createRepository();
  run(root, 'roadmap-tracker.js', [
    'add', '1', 'Two Sum', 'arrays-and-hashing', 'Easy', '--url', 'https://leetcode.com/problems/two-sum/',
  ]);
  run(root, 'company-tracker.js', ['add-company', 'Example']);
  run(root, 'company-tracker.js', ['add-problem', 'example', '1', 'Two Sum', 'Easy']);
  const workflows = [
    ['roadmap-tracker.js', ['1'], 'neetcode-all/arrays-and-hashing/1.py', 'roadmap-solution'],
    ['company-tracker.js', ['example', '1'], 'companies/example/solutions/1.py', 'company-solution'],
  ];
  for (const [script, args, file, marker] of workflows) {
    assert.match(run(root, script, ['solve', ...args, '--time', 'O(n)', '--space', 'O(n)'], false).stderr, /Run the start command first/);
    run(root, script, ['start', ...args]);
    const watched = ['README.md', 'SOLUTIONS.md', 'data/roadmap.json', 'companies/README.md',
      'companies/example/company.json', 'companies/example/README.md'];
    const before = new Map(watched.map((name) => [name, fs.readFileSync(path.join(root, name), 'utf8')]));
    const cases = [
      [`# Two Sum - 1\n\n# TODO(${marker}): unfinished\n`, /TODO/],
      ['# Two Sum - 1\n\n# comments only\n', /does not contain a Python solution/],
      ['# Wrong header\n\nclass Solution:\n    pass\n', /must begin with/],
    ];
    for (const [source, error] of cases) {
      fs.writeFileSync(path.join(root, file), source);
      assert.match(run(root, script, ['solve', ...args, '--time', 'O(n)', '--space', 'O(n)'], false).stderr, error);
      assert.equal(fs.readFileSync(path.join(root, file), 'utf8'), source);
      for (const [name, content] of before) assert.equal(fs.readFileSync(path.join(root, name), 'utf8'), content);
    }
    fs.writeFileSync(path.join(root, file), '# Two Sum - 1\n\nclass Solution:\n    pass\n');
  }
});

test('invalid CLI options fail before writing either source of truth', () => {
  const root = createRepository();
  run(root, 'roadmap-tracker.js', []);
  run(root, 'company-tracker.js', ['add-company', 'Example']);
  const watched = ['README.md', 'SOLUTIONS.md', 'data/roadmap.json', 'companies/README.md',
    'companies/example/company.json', 'companies/example/README.md'];
  const before = new Map(watched.map((name) => [name, fs.readFileSync(path.join(root, name), 'utf8')]));
  const commands = [
    ['roadmap-tracker.js', ['add', '1', 'Two Sum', 'arrays-and-hashing', 'Easy']],
    ['company-tracker.js', ['add-problem', 'example', '1', 'Two Sum', 'Easy']],
  ];
  for (const [script, args] of commands) {
    for (const [options, error] of [
      [['--url'], /requires a value/],
      [['--url', 'https://leetcode.com/problems/two-sum/', '--url', 'other'], /more than once/],
      [['--typo', 'value'], /Unknown option/],
      [['--url', 'https://leetcode.com/problems/two-sum/', '--personal-difficulty', '11'], /integer from 1 to 10/],
    ]) {
      assert.match(run(root, script, [...args, ...options], false).stderr, error);
    }
    assert.match(run(root, script, ['--check', 'extra'], false).stderr, /Usage/);
  }
  for (const [name, content] of before) assert.equal(fs.readFileSync(path.join(root, name), 'utf8'), content);
});

test('pinned downloads enforce timeout and size limits and preserve a good cache on failure', async (t) => {
  const root = createRepository();
  const { getSourceCachePath: cachePathFor, syncCompanySource } = require(path.join(root, 'scripts/lib/company-source.js'));
  const company = { slug: 'example', data: { source: sourceMetadata('Example/5. All.csv') } };
  const csv = fs.readFileSync(path.join(__dirname, 'fixtures/company-source.csv'), 'utf8');
  const cachePath = cachePathFor(company);
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(url, buildRawSourceUrl(company.data.source));
    assert.ok(options.signal instanceof AbortSignal);
    assert.equal(options.signal.aborted, false);
    return new Response(csv);
  });
  const result = await syncCompanySource(company);
  assert.equal(result.problems.length, 3);
  assert.equal(fs.readFileSync(cachePath, 'utf8'), csv);

  for (const [response, error] of [
    [() => { throw new Error('offline'); }, /Could not fetch company source: offline/],
    [() => new Response('missing', { status: 404 }), /Could not fetch company source \(404/],
    [() => new Response(csv, { headers: { 'content-length': String(11 * 1024 * 1024) } }), /byte limit/],
    [() => new Response(new Uint8Array(10 * 1024 * 1024 + 1)), /byte limit/],
    [() => new Response('not a CSV'), /missing required column/],
  ]) {
    globalThis.fetch.mock.mockImplementation(async () => response());
    await assert.rejects(syncCompanySource(company), error);
    assert.equal(fs.readFileSync(cachePath, 'utf8'), csv);
  }
  const oversized = path.join(root, 'oversized.csv');
  fs.writeFileSync(oversized, '');
  fs.truncateSync(oversized, 10 * 1024 * 1024 + 1);
  await assert.rejects(syncCompanySource(company, oversized), /byte limit/);
  assert.equal(fs.readFileSync(cachePath, 'utf8'), csv);
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
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'automation review-'));
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
    '<!-- topic-chart:start -->', 'stale', '<!-- topic-chart:end -->',
    '',
    '<!-- difficulty-chart:start -->', 'stale', '<!-- difficulty-chart:end -->',
    '',
    '<!-- personal-difficulty-chart:start -->', 'stale', '<!-- personal-difficulty-chart:end -->',
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
  if (!expectSuccess) assert.notEqual(result.status, 0, `Command unexpectedly succeeded: ${script} ${args.join(' ')}`);
  return result;
}
