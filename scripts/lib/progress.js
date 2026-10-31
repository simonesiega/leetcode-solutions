'use strict';

// Status and difficulty aggregation shared by roadmap and company dashboards.

/**
 * Count tracked problems in each workflow state.
 * @param {Array<{status: string}>} problems - Roadmap or company problem metadata.
 * @returns {{solved: number, inProgress: number, planned: number}}
 */
function getProblemCounts(problems) {
  return problems.reduce((counts, problem) => {
    if (problem.status === 'solved') counts.solved++;
    else if (problem.status === 'in-progress') counts.inProgress++;
    else if (problem.status === 'planned') counts.planned++;
    return counts;
  }, { solved: 0, inProgress: 0, planned: 0 });
}

/**
 * Count solved problems by platform difficulty.
 * Metadata validation must run first so every solved difficulty is a known key.
 * @param {Array<{status: string, difficulty: string}>} problems - Validated problem metadata.
 * @returns {{Easy: number, Medium: number, Hard: number}}
 */
function getSolvedDifficultyCounts(problems) {
  return problems.reduce((counts, problem) => {
    if (problem.status === 'solved') counts[problem.difficulty]++;
    return counts;
  }, { Easy: 0, Medium: 0, Hard: 0 });
}

/**
 * Count rated, solved problems on the personal 1–10 scale.
 * Metadata validation must run first; index 0 represents rating 1, index 9 rating 10.
 * @param {Array<{status: string, personalDifficulty: number|null}>} problems - Validated metadata.
 * @returns {number[]} Ten rating counts in ascending order, including unused ratings.
 */
function getSolvedPersonalDifficultyCounts(problems) {
  return problems.reduce((counts, problem) => {
    if (problem.status === 'solved' && problem.personalDifficulty !== null) {
      counts[problem.personalDifficulty - 1]++;
    }
    return counts;
  }, Array(10).fill(0));
}

module.exports = { getProblemCounts, getSolvedDifficultyCounts, getSolvedPersonalDifficultyCounts };
