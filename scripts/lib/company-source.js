'use strict';

// External company-list parsing, caching, normalization, ranking, and selection.
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { parseCsv } = require('./csv');
const { paths, relativePath } = require('./paths');
const { assertHttpUrl, assertNonemptyText } = require('./validation');

const REQUIRED_COLUMNS = ['Difficulty', 'Title', 'Frequency', 'Link'];
const SOURCE_FETCH_TIMEOUT_MS = 15_000;
const MAX_SOURCE_BYTES = 10 * 1024 * 1024;
const DIFFICULTIES = new Map([
  ['EASY', 'Easy'],
  ['MEDIUM', 'Medium'],
  ['HARD', 'Hard'],
]);

/** Normalize a source Link into the canonical LeetCode problem URL used by manifests. */
function normalizeLeetCodeUrl(value, context = 'Source problem Link') {
  assertHttpUrl(value, context);
  const url = new URL(value);
  if (!['leetcode.com', 'www.leetcode.com'].includes(url.hostname.toLowerCase())) {
    throw new Error(`${context} must point to leetcode.com.`);
  }
  const match = url.pathname.match(/^\/problems\/([a-z0-9-]+)\/?$/);
  if (!match) throw new Error(`${context} must identify a LeetCode problem slug.`);
  return `https://leetcode.com/problems/${match[1]}/`;
}

/** Parse and normalize one company CSV, then rank by frequency with stable ties. */
function parseCompanySourceCsv(content) {
  const rows = parseCsv(content);
  if (!rows.length) throw new Error('Company source CSV is empty.');
  const headers = rows[0].map((header) => header.trim());
  const duplicateHeader = headers.find((header, index) => headers.indexOf(header) !== index);
  if (duplicateHeader !== undefined) {
    throw new Error(`Company source CSV contains duplicate column "${duplicateHeader}".`);
  }
  for (const column of REQUIRED_COLUMNS) {
    if (!headers.includes(column)) throw new Error(`Company source CSV is missing required column "${column}".`);
  }
  const positions = Object.fromEntries(headers.map((header, index) => [header, index]));
  const seen = new Set();
  const problems = rows.slice(1).map((row, index) => {
    const sourceRow = index + 2;
    if (row.length !== headers.length) {
      throw new Error(`Company source row ${sourceRow} has ${row.length} fields; expected ${headers.length}.`);
    }
    const rawDifficulty = row[positions.Difficulty].trim().toUpperCase();
    const difficulty = DIFFICULTIES.get(rawDifficulty);
    if (!difficulty) throw new Error(`Company source row ${sourceRow} has invalid difficulty "${rawDifficulty}".`);
    const title = row[positions.Title].trim();
    assertNonemptyText(title, `Company source row ${sourceRow} title`);
    const rawFrequency = row[positions.Frequency].trim();
    // Keep source data predictable: JavaScript also accepts hex and exponent syntax as numbers.
    const frequency = Number(rawFrequency);
    if (!/^(?:\d+(?:\.\d+)?|\.\d+)$/.test(rawFrequency) || frequency < 0 || frequency > 100) {
      throw new Error(`Company source row ${sourceRow} has invalid frequency.`);
    }
    const url = normalizeLeetCodeUrl(row[positions.Link].trim(), `Company source row ${sourceRow} Link`);
    const sourceKey = url.split('/').at(-2);
    if (seen.has(sourceKey)) throw new Error(`Company source CSV contains duplicate source identity "${sourceKey}".`);
    seen.add(sourceKey);
    return {
      sourceKey,
      title,
      url,
      difficulty,
      frequency,
      topics: positions.Topics === undefined ? '' : row[positions.Topics].trim(),
      sourceOrder: index,
    };
  });

  problems.sort((a, b) => b.frequency - a.frequency || a.sourceOrder - b.sourceOrder);
  return problems.map(({ sourceOrder, ...problem }, index) => ({ ...problem, sourceRank: index + 1 }));
}

/** Build the deterministic cache path for a company's exact pinned source snapshot. */
function getSourceCachePath(company) {
  requireSource(company);
  const { repository, commit, path: sourcePath } = company.data.source;
  // A commit can contain several company windows, so the path must be part of the cache identity.
  const fingerprint = crypto.createHash('sha256')
    .update(`${repository}\0${sourcePath}`)
    .digest('hex')
    .slice(0, 16);
  return path.join(paths.companySourceCache, company.slug, `${commit}-${fingerprint}.csv`);
}

/** Load and parse a previously synchronized source snapshot without network access. */
function loadCompanySource(company) {
  const cachePath = getSourceCachePath(company);
  if (!fs.existsSync(cachePath)) {
    throw new Error(`Missing company source cache ${relativePath(cachePath)}. Run source-sync ${company.slug} first.`);
  }
  return parseCompanySourceCsv(readLocalSource(cachePath));
}

/**
 * Populate the local cache from a local file or the manifest's explicitly pinned source commit.
 * Network access occurs only when this command is called without a file path.
 */
async function syncCompanySource(company, filePath) {
  requireSource(company);
  const content = filePath
    ? readLocalSource(filePath)
    : await fetchPinnedSource(company.data.source);
  const problems = parseCompanySourceCsv(content);
  const cachePath = getSourceCachePath(company);
  fs.mkdirSync(path.dirname(cachePath), { recursive: true });
  fs.writeFileSync(cachePath, content);
  return { cachePath, problems };
}

/** Read a local source defensively so an accidental huge file cannot exhaust the process. */
function readLocalSource(filePath) {
  const absolutePath = path.resolve(filePath);
  const size = fs.statSync(absolutePath).size;
  if (size > MAX_SOURCE_BYTES) throw new Error(`Company source exceeds the ${MAX_SOURCE_BYTES}-byte limit.`);
  return fs.readFileSync(absolutePath, 'utf8');
}

/** Fetch only the pinned raw file, with bounded time and memory use. */
async function fetchPinnedSource(source) {
  const url = buildRawSourceUrl(source);
  let response;
  try {
    response = await fetch(url, {
      headers: { 'user-agent': 'leetcode-solutions-company-tracker' },
      signal: AbortSignal.timeout(SOURCE_FETCH_TIMEOUT_MS),
    });
  } catch (error) {
    throw new Error(`Could not fetch company source: ${error.message}`);
  }
  if (!response.ok) throw new Error(`Could not fetch company source (${response.status} ${response.statusText}).`);
  const advertisedSize = Number(response.headers.get('content-length'));
  if (Number.isFinite(advertisedSize) && advertisedSize > MAX_SOURCE_BYTES) {
    throw new Error(`Company source exceeds the ${MAX_SOURCE_BYTES}-byte limit.`);
  }
  if (!response.body) return '';

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let bytesRead = 0;
  let content = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    bytesRead += value.byteLength;
    if (bytesRead > MAX_SOURCE_BYTES) {
      await reader.cancel();
      throw new Error(`Company source exceeds the ${MAX_SOURCE_BYTES}-byte limit.`);
    }
    content += decoder.decode(value, { stream: true });
  }
  return content + decoder.decode();
}

/** Select the highest-priority source problem that is not already tracked. */
function getNextSourceProblem(company, sourceProblems) {
  const keys = new Set(company.data.problems.map((problem) => problem.sourceKey).filter(Boolean));
  const urls = new Set(company.data.problems.map((problem) => problem.url).filter(Boolean).map((url) => {
    try {
      return normalizeLeetCodeUrl(url);
    } catch {
      return url;
    }
  }));
  return sourceProblems.find((problem) => (
    !keys.has(problem.sourceKey) && !urls.has(problem.url)
  )) || null;
}

/** Find one source problem by its stable source key. */
function findSourceProblem(sourceProblems, sourceKey) {
  return sourceProblems.find((problem) => problem.sourceKey === sourceKey) || null;
}

/** Build the raw GitHub URL for a manifest's pinned source file. */
function buildRawSourceUrl(source) {
  const repository = source.repository.split('/').map(encodeURIComponent).join('/');
  const sourcePath = source.path.split('/').map(encodeURIComponent).join('/');
  return `https://raw.githubusercontent.com/${repository}/${source.commit}/${sourcePath}`;
}

/** Require source provenance before a source command is used. */
function requireSource(company) {
  if (!company.data.source) {
    throw new Error(`${company.data.name} does not define company source metadata in company.json.`);
  }
}

module.exports = {
  buildRawSourceUrl,
  findSourceProblem,
  getNextSourceProblem,
  getSourceCachePath,
  loadCompanySource,
  normalizeLeetCodeUrl,
  parseCompanySourceCsv,
  syncCompanySource,
};
