# Contributing

[← Project README](README.md) · [Solutions](SOLUTIONS.md) · [Companies](companies/README.md) · [Data model](docs/DATA_MODEL.md) · [Code of Conduct](CODE_OF_CONDUCT.md)

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
| NeetCode All | `neetcode-all/<topic-slug>/<problem-number>.py` | My main roadmap practice. |
| Company prep | `companies/<company>/solutions/<problem-id>.py` | A separate attempt for a specific OA or interview. |

The same problem can show up in both places. That’s intentional. If I solve something again for an OA or interview, I like keeping that attempt separate from the roadmap version.

For company prep, only add questions, notes, or material that is public or that you’re allowed to share. Please don’t add confidential assessment content, private recruiter/interviewer messages, someone else’s application details, or anything that clearly isn’t meant to be public.

## What I’m looking for in a solution

Nothing complicated. Just try to keep it:

- compatible with Python 3 unless the problem explicitly requires another language;
- in the method signature expected by the relevant platform;
- direct, readable, and easy to explain in an interview;
- free of external dependencies;
- correct for the required edge cases; and
- consistent with nearby files.

If you’re replacing an existing solution, there should be a real reason for it. Clearer code, better naming, simpler control flow, fixed edge cases, or better complexity are all good reasons.

For comments, I prefer explaining **why** something matters instead of describing code that already explains itself.

```python
# Start counting only at the beginning of a sequence.
if number - 1 not in numbers:
```

Start every solution with `# <Problem title> - <ID>`, leave a blank line, and then write the solution. Keep the problem statement out of the file. Just link to the official problem instead of copying or rewriting its description, examples, constraints, or editorial content.

## Adding a NeetCode problem

[`data/roadmap.json`](data/roadmap.json) is the source of truth for roadmap metadata. `SOLUTIONS.md` and the generated roadmap blocks in `README.md` should not be edited by hand.

Use the roadmap tracker from the repository root:

```bash
# Register the problem.
node scripts/roadmap-tracker.js add 217 "Contains Duplicate" arrays-and-hashing Easy --url https://leetcode.com/problems/contains-duplicate/

# Create the solution file and mark it in progress.
node scripts/roadmap-tracker.js start 217

# After implementing the solution, record complexity and finish it.
node scripts/roadmap-tracker.js solve 217 --time "O(n), where n is the number of values" --space "O(n) for the set of input values" --personal-difficulty 2
```

`--personal-difficulty` is optional. The tracker handles ordering, state changes, solve dates, generated docs, and validation for you.

For metadata-only maintenance:

```bash
node scripts/roadmap-tracker.js
node scripts/roadmap-tracker.js --check
```

The exact roadmap schema, date rules, and lifecycle invariants are documented in [docs/DATA_MODEL.md](docs/DATA_MODEL.md).

## Adding company prep

For company-specific practice, use the company tracker instead of syncing files by hand:

```bash
# Create the company workspace once.
node scripts/company-tracker.js add-company "Company Name" --focus "Region or interview stage"

# Add a problem manually.
node scripts/company-tracker.js add-problem company-name 1 "Two Sum" Easy --personal-difficulty 3

# Create the solution file and mark it in progress.
node scripts/company-tracker.js start company-name 1

# Finish it and record complexity.
node scripts/company-tracker.js solve company-name 1 --time "O(n)" --space "O(n)" --personal-difficulty 3
```

`add-company` also supports `--slug` and `--website`. `add-problem` supports `--url`, `--notes`, and custom OA-style IDs.

For source-backed company lists:

```bash
node scripts/company-tracker.js source-sync ibm
node scripts/company-tracker.js next ibm
node scripts/company-tracker.js add-from-source ibm valid-parentheses --id 20
```

You can also use a local CSV with:

```bash
node scripts/company-tracker.js source-sync ibm --file PATH
```

Manual and OA-specific entries still work normally. The tracker owns the company manifests, generated dashboards, source ordering, and root summary.

The exact company schema and source metadata rules are documented in [docs/DATA_MODEL.md](docs/DATA_MODEL.md).

## Working on automation

The automation is deliberately split into small entry points and shared helpers:

```text
scripts/
├── company-tracker.js       # company CLI
├── roadmap-tracker.js       # roadmap CLI
├── automation.test.js       # automation test suite
└── lib/
    ├── cli.js
    ├── company.js
    ├── company-source.js
    ├── csv.js
    ├── generated-files.js
    ├── json.js
    ├── markdown.js
    ├── paths.js
    ├── progress.js
    ├── roadmap.js
    ├── solutions.js
    └── validation.js
```

Keep the CLI entry points small. Shared parsing, validation, file handling, and Markdown logic should live in the narrowest existing `scripts/lib/` module instead of being duplicated.

The goal is simple shared code, not a framework.

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

```text
Solve #15: add Three Sum
Improve #125: simplify Valid Palindrome
Solve Roblox OA Pairs
```

In the PR, a short note is enough. Mention what changed, why it is useful, the relevant complexity for solution changes, and how you validated it.

Try to keep unrelated cleanup out of the same PR so it stays easy to review.

## Before opening the PR

Run the checks below from the repository root:

```bash
for file in scripts/*.js scripts/lib/*.js; do node --check "$file"; done

node scripts/roadmap-tracker.js --check
node scripts/company-tracker.js --check
node --test scripts/automation.test.js

python -m pip install --requirement requirements-dev.txt
ruff check neetcode-all companies
python -m compileall -q neetcode-all companies

git diff --check
```

`git diff --check` stays a local review command because CI checks a clean checkout rather than your working-tree diff.

One last pass:

- [ ] the solution is in the correct roadmap topic or company workspace;
- [ ] the filename matches its LeetCode or tracked OA problem ID;
- [ ] the solution was accepted or tested with representative cases;
- [ ] edge cases and complexity notes are accurate;
- [ ] roadmap or company metadata is correct;
- [ ] generated docs are up to date; and
- [ ] the Pull Request contains one focused change.

## One last thing

Just be respectful in issues, PRs, and reviews. Questions are welcome. This repo is here for learning, and nobody needs to know everything already.

The usual [Code of Conduct](CODE_OF_CONDUCT.md) applies too.

If you have a question that doesn’t really need an issue:

- GitHub: [@simonesiega](https://github.com/simonesiega)
- Email: [simonesiega1@gmail.com](mailto:simonesiega1@gmail.com)

Thanks for helping out!
