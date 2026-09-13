# Contributing

[← Project README](README.md) · [Solutions](SOLUTIONS.md) · [Companies](companies/README.md) · [Code of Conduct](CODE_OF_CONDUCT.md)

Thanks for checking this out! This is mostly my personal LeetCode workspace, so contributions don’t need to be anything huge. A bug fix, a cleaner solution, a small docs improvement, or a useful new problem is more than enough.

## Quick version

1. Check that the problem or change isn’t already here.
2. Fork the repo and create a branch from `main`.
3. Keep the change focused.
4. Make sure the solution is accepted, or test it with a few representative cases.
5. Update the related progress info and metadata.
6. Run the checks in [Before opening the PR](#before-opening-the-pr).
7. Open a [Pull Request](https://github.com/simonesiega/leetcode-solutions/compare).

For small fixes, just open a Pull Request. If you want to change something bigger or replace an approach entirely, opening an [issue](https://github.com/simonesiega/leetcode-solutions/issues/new/choose) first is probably easier.

## Where should I put a solution?

| Collection | Path | Purpose |
|---|---|---|
| NeetCode All | `neetcode-all/<topic>/<problem-number>.py` | My main roadmap practice. |
| Company prep | `companies/<company>/solutions/<problem-id>.py` | A separate attempt for a specific OA or interview. |

The same problem can show up in both places. That’s intentional — if I solve something again for an OA or interview, I like keeping that attempt separate from the roadmap version.

For company prep, only add questions, notes, or material that is public or that you’re allowed to share.

Please don’t add confidential assessment content, private recruiter/interviewer messages, someone else’s application details, or anything that clearly isn’t meant to be public.

## What I’m looking for in a solution

Nothing too strict — just try to keep it:

- compatible with Python 3 unless the problem explicitly requires another language;
- in the method signature expected by the relevant platform;
- direct, readable, and easy to explain in an interview;
- free of external dependencies;
- correct for the required edge cases; and
- consistent with nearby files.

If you’re replacing an existing solution, there should be a real reason for it — clearer code, better naming, simpler control flow, fixed edge cases, or better complexity are all good reasons.

For comments, I prefer explaining **why** something matters instead of describing code that already explains itself.

```python
# Start counting only at the beginning of a sequence.
if number - 1 not in numbers:
```

## Adding a NeetCode problem

Use the numeric LeetCode ID as the filename:

```text
neetcode-all/<topic>/<problem-number>.py
```

After that:

1. confirm that the problem is not already listed in [`SOLUTIONS.md`](SOLUTIONS.md);
2. add the accepted solution to the correct topic folder;
3. add its title, link, difficulty, time complexity, and space complexity to [`SOLUTIONS.md`](SOLUTIONS.md);
4. confirm that its topic and the current roadmap total are present in [`README.md`](README.md); and
5. regenerate the solved counts, difficulty chart, and completed-topic chart:
   ```bash
   node scripts/update-readme-stats.js
   ```

The script handles the solved counts from `SOLUTIONS.md`. The roadmap totals stay manual since NeetCode can add or move problems around.

## Adding company prep

For company prep, use the tracker instead of creating and syncing everything by hand:

```bash
# Create the company workspace once.
node scripts/company-tracker.js add-company "Company Name" --focus "Region or interview stage"

# Add a problem to the preparation plan.
node scripts/company-tracker.js add-problem company-name 1 "Two Sum" Easy

# Create the solution file and mark the problem in progress.
node scripts/company-tracker.js start company-name 1

# After solving it, remove TODO(company-solution) and record the complexity.
node scripts/company-tracker.js solve company-name 1 --time "O(n)" --space "O(n)"
```

`add-company` also supports `--slug` and `--website`.

`add-problem` supports `--url` for problems outside LeetCode and `--notes` for a quick pattern, reminder, or review note. Problem IDs can use letters, numbers, dots, underscores, and hyphens.

Each company’s `company.json` is the source of truth. The tracker uses it to generate the dashboard, badge, folder links, and progress counts.

So if something needs changing, update it through the tracker or the source data instead of editing generated company READMEs directly.

A solved company problem should have its solution file plus time and space complexity.

## Branches and PRs

No need to overthink branch names:

| Change | Example |
|---|---|
| New roadmap solution | `solve/15-three-sum` |
| Fix | `fix/36-valid-sudoku` |
| Clearer approach | `improve/125-valid-palindrome` |
| Company preparation | `company/roblox-oa` |
| Documentation | `docs/update-progress` |

If the change is for a specific problem, include its ID in the PR title.

For example:

```
Solve #15: add Three Sum
Improve #125: simplify Valid Palindrome
Solve Roblox OA Pairs
```

In the PR, a short note is enough. Mention:
- what changed;
- why the change is useful;
- the relevant time and space complexity for solution changes; and
- how you validated the result.

Try to keep unrelated cleanup out of the same PR so it stays easy to read.

## Before opening the PR

Before opening a PR, run the checks below:

```bash
node --check scripts/update-readme-stats.js
node --check scripts/update-readme-stats.test.js
node --check scripts/company-tracker.js
node --check scripts/company-tracker.test.js

node scripts/update-readme-stats.js --check
node --test scripts/update-readme-stats.test.js
node scripts/company-tracker.js --check
node --test scripts/company-tracker.test.js

python -m compileall -q neetcode-all companies

git diff --check
```

And do one quick pass through this:

- [ ] the solution is in the correct roadmap topic or company workspace;
- [ ] the filename matches its LeetCode or tracked OA problem ID;
- [ ] the solution was accepted by the relevant platform or tested with representative cases;
- [ ] important edge cases and complexity notes are accurate;
- [ ] `SOLUTIONS.md` and generated README statistics and charts are updated for roadmap additions;
- [ ] `company.json` contains the correct metadata and status for company additions;
- [ ] generated documentation is up to date; and
- [ ] the Pull Request contains one focused change.

## One last thing

Just be respectful in issues, PRs, and reviews. Questions are welcome — this repo is here for learning, and nobody needs to know everything already.

The usual [Code of Conduct](CODE_OF_CONDUCT.md) applies too.

If you have a question that doesn’t really need an issue:
- GitHub: [@simonesiega](https://github.com/simonesiega)
- Email: [simonesiega1@gmail.com](mailto:simonesiega1@gmail.com).

Thanks for helping out!
