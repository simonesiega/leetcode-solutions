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
| NeetCode All | `neetcode-all/<topic-slug>/<problem-number>.py` | My main roadmap practice. |
| Company prep | `companies/<company>/solutions/<problem-id>.py` | A separate attempt for a specific OA or interview. |

The same problem can show up in both places. That’s intentional. If I solve something again for an OA or interview, I like keeping that attempt separate from the roadmap version.

For company prep, only add questions, notes, or material that is public or that you’re allowed to share.

Please don’t add confidential assessment content, private recruiter/interviewer messages, someone else’s application details, or anything that clearly isn’t meant to be public.

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

[`data/roadmap.json`](data/roadmap.json) is the source of truth for roadmap metadata, topic definitions, and the roadmap total. `SOLUTIONS.md` and the roadmap blocks in `README.md` are generated files, so don’t edit them directly.

Use the roadmap tracker from the repository root instead of synchronizing files by hand:

```bash
# Register canonical metadata as a planned problem.
node scripts/roadmap-tracker.js add 217 "Contains Duplicate" arrays-and-hashing Easy --url https://leetcode.com/problems/contains-duplicate/

# Create neetcode-all/arrays-and-hashing/217.py and mark it in progress.
node scripts/roadmap-tracker.js start 217

# After implementing the solution and removing TODO(roadmap-solution), record complexity.
node scripts/roadmap-tracker.js solve 217 --time "O(n), where n is the number of values" --space "O(n) for the set of input values" --personal-difficulty 2
```

`add` requires a numeric LeetCode ID, exact title, registered topic slug, platform difficulty, and canonical LeetCode URL. The available topic slugs are listed in `data/roadmap.json`. `--personal-difficulty` is optional on both `add` and `solve`; omit it to keep the rating `null`. The tracker inserts metadata in numeric ID order, creates the solution in the registered topic, validates state transitions, and regenerates `SOLUTIONS.md` and the roadmap blocks in `README.md` after each mutation.

The shared roadmap validation checks the JSON schema, IDs, URLs, topics, difficulties, ratings, statuses, complexities, solution paths, implementations, and `# <Title> - <ID>` headers before writing Markdown. Only solved entries appear in the catalog and progress statistics. A planned entry must not have a solution file, while in-progress and solved entries must have one. Both complexity fields are required before `solve` succeeds.

For metadata-only maintenance, `node scripts/roadmap-tracker.js` regenerates the derived files and `node scripts/roadmap-tracker.js --check` checks them without writing. The older `node scripts/update-readme-stats.js [--check]` entry point remains supported and uses the same shared roadmap logic.

## Adding company prep

For company prep, use the tracker instead of creating and syncing everything by hand:

```bash
# Create the company workspace once.
node scripts/company-tracker.js add-company "Company Name" --focus "Region or interview stage"

# Add a problem to the preparation plan.
node scripts/company-tracker.js add-problem company-name 1 "Two Sum" Easy --personal-difficulty 3

# Create the solution file and mark the problem in progress.
node scripts/company-tracker.js start company-name 1

# After solving it, remove TODO(company-solution) and record the complexity.
node scripts/company-tracker.js solve company-name 1 --time "O(n)" --space "O(n)" --personal-difficulty 3
```

`add-company` also supports `--slug` and `--website`.

`add-problem` supports `--personal-difficulty` for an optional rating from 1 to 10, `--url` for problems outside LeetCode, and `--notes` for a quick pattern, reminder, or review note. The `solve` command also accepts `--personal-difficulty`, so an unrated problem can be rated later. Problem IDs can use letters, numbers, dots, underscores, and hyphens.

Each company’s `company.json` is the source of truth. The tracker uses it to generate the dashboard, badge, folder links, and progress counts.

If something needs changing, update it through the tracker or the source data instead of editing generated company READMEs directly.

A solved company problem should include its solution file along with its time and space complexity. Personal difficulty may remain unrated as `null` until the maintainer assigns a value.

## Working on automation

The automation is deliberately split into small entry points and shared helpers:

```text
scripts/
├── company-tracker.js       # company CLI + dashboard generation
├── roadmap-tracker.js       # roadmap lifecycle CLI
├── update-readme-stats.js   # backwards-compatible generator entry point
├── automation.test.js       # single high-signal integration test
└── lib/
    ├── cli.js               # CLI parsing + error handling
    ├── generated-files.js   # generated-file drift + writes
    ├── json.js              # JSON reads + formatting
    ├── markdown.js          # Markdown generation + escaping
    ├── paths.js             # canonical repository paths
    ├── progress.js          # progress aggregation
    ├── roadmap.js           # roadmap validation + generation
    ├── solutions.js         # solution scaffolds + checks
    └── validation.js        # shared metadata validation
```

Keep the entry points thin. If roadmap and company automation need the same rule, parsing, validation, file handling, or Markdown helper, put it in the matching `scripts/lib/` module instead of copying it into both CLIs.

Before adding a new helper, check whether it naturally belongs in one of the existing modules. The goal is simple shared code, not a framework.

`scripts/automation.test.js` is the main integration test for this layer. It should cover the important roadmap and company workflows, generated-file drift, shared validation, and import-time safety using disposable repository fixtures rather than touching the real working tree.

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
for file in scripts/*.js scripts/lib/*.js; do node --check "$file"; done

node scripts/update-readme-stats.js --check
node scripts/roadmap-tracker.js --check
node scripts/company-tracker.js --check
node --test scripts/automation.test.js

python -m pip install --requirement requirements-dev.txt
ruff check neetcode-all companies
python -m compileall -q neetcode-all companies

git diff --check
```

And do one quick pass through this:

- [ ] the solution is in the correct roadmap topic or company workspace;
- [ ] the filename matches its LeetCode or tracked OA problem ID;
- [ ] the solution was accepted by the relevant platform or tested with representative cases;
- [ ] important edge cases and complexity notes are accurate;
- [ ] `data/roadmap.json` contains the correct roadmap metadata;
- [ ] `company.json` contains the correct metadata and status for company additions;
- [ ] generated `SOLUTIONS.md`, README blocks, and company dashboards are up to date; and
- [ ] the Pull Request contains one focused change.

## One last thing

Just be respectful in issues, PRs, and reviews. Questions are welcome. This repo is here for learning, and nobody needs to know everything already.

The usual [Code of Conduct](CODE_OF_CONDUCT.md) applies too.

If you have a question that doesn’t really need an issue:
- GitHub: [@simonesiega](https://github.com/simonesiega)
- Email: [simonesiega1@gmail.com](mailto:simonesiega1@gmail.com).

Thanks for helping out!
