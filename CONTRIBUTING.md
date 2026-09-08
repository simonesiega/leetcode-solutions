# Contributing to LeetCode Solutions

[← Project README](README.md) · [Solutions](SOLUTIONS.md) · [Companies](companies/README.md) · [Code of Conduct](CODE_OF_CONDUCT.md)

Thanks for wanting to help! This is a personal study repository, so contributions should stay lightweight and focused. A clear fix, a better solution, a documentation improvement, or a useful new problem is enough.

## The short version

1. Check that the problem, fix, or improvement is not already present.
2. Fork the repository and create a branch from `main`.
3. Make one focused change.
4. Confirm that the solution is accepted by the relevant platform or test it with representative cases.
5. Update the matching progress information and metadata.
6. Run the checks in [Before you send it](#before-you-send-it).
7. Open a [Pull Request](https://github.com/simonesiega/leetcode-solutions/compare).

Small, obvious fixes can go directly to a Pull Request. For a major rewrite or an approach with important trade-offs, open an [issue](https://github.com/simonesiega/leetcode-solutions/issues/new/choose) first.

## Where does a solution go?

| Collection | Path | Purpose |
|---|---|---|
| NeetCode All | `neetcode-all/<topic>/<problem-number>.py` | The year-round roadmap and main structured practice collection. |
| Company preparation | `companies/<company>/solutions/<problem-id>.py` | An independent attempt for a specific OA or technical interview. |

A problem may appear in both collections or in several company workspaces. This is intentional: company attempts are separate practice sessions and do not count as duplicate roadmap progress.

Only add company-specific questions, notes, or materials that are public or that you are permitted to share.

Do not publish confidential assessment content, private recruiter or interviewer messages, personal application details belonging to someone else, or any interview information that should remain private.

## What makes a good solution?

Please keep it:

- compatible with Python 3 unless the problem explicitly requires another language;
- in the method signature expected by the relevant platform;
- direct, readable, and easy to explain in an interview;
- free of external dependencies;
- correct for the required edge cases; and
- consistent with nearby files.

A replacement should provide a meaningful improvement in correctness, clarity, naming, control flow, edge-case handling, or time and space complexity.

Comments are most useful when they explain **why** a step matters rather than narrating obvious code.

```python
# Start counting only at the beginning of a sequence.
if number - 1 not in numbers:
```

## Adding a NeetCode All problem

Use the numeric LeetCode ID as the filename:

```text
neetcode-all/<topic>/<problem-number>.py
```

Then:

1. confirm that the problem is not already listed in [`SOLUTIONS.md`](SOLUTIONS.md);
2. add the accepted solution to the correct topic folder;
3. add its title, link, difficulty, time complexity, and space complexity to [`SOLUTIONS.md`](SOLUTIONS.md);
4. update the topic's solved count in [`README.md`](README.md); and
5. regenerate the overall solved badge and difficulty chart:
   ```bash
   node scripts/update-readme-stats.js
   ```

The topic progress table remains manual because it also tracks unsolved topics and roadmap totals, which may change as NeetCode updates the roadmap.

## Adding company preparation

Use the company tracker instead of creating or synchronizing company files manually:

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

`add-company` also accepts `--slug` and `--website`.

`add-problem` accepts `--url` for problems outside LeetCode and `--notes` for a short pattern, reminder, or review note. Problem IDs may contain letters, numbers, dots, underscores, and hyphens.

Each company's `company.json` is the source of truth. The tracker uses it to generate the company dashboard, root company badge, folder links, and progress counts.

Update the manifest through the tracker or the appropriate source data. Do not edit generated company README files directly.

A solved company entry must include its solution file together with non-empty time and space complexity.

## Branches and Pull Requests

Short branch names are enough:

| Change | Example |
|---|---|
| New roadmap solution | `solve/15-three-sum` |
| Fix | `fix/36-valid-sudoku` |
| Clearer approach | `improve/125-valid-palindrome` |
| Company preparation | `company/roblox-oa` |
| Documentation | `docs/update-progress` |

Include the problem ID in solution Pull Request titles when applicable.

For example:

```
Solve #15: add Three Sum
Improve #125: simplify Valid Palindrome
Solve Roblox OA Pairs
```

In the Pull Request, briefly explain:
- what changed;
- why the change is useful;
- the relevant time and space complexity for solution changes; and
- how you validated the result.

Keep unrelated cleanup out of the Pull Request so the change remains easy to understand and review.

## Before you send it

Run the complete validation pipeline before opening a Pull Request:

```bash
node --check scripts/update-readme-stats.js
node --check scripts/company-tracker.js
node --check scripts/company-tracker.test.js

node scripts/update-readme-stats.js --check
node scripts/company-tracker.js --check
node --test scripts/company-tracker.test.js

python -m compileall -q neetcode-all companies

git diff --check
```

Then make sure:

- [ ] the solution is in the correct roadmap topic or company workspace;
- [ ] the filename matches its LeetCode or tracked OA problem ID;
- [ ] the solution was accepted by the relevant platform or tested with representative cases;
- [ ] important edge cases and complexity notes are accurate;
- [ ] `SOLUTIONS.md` and the README topic count are updated for roadmap additions;
- [ ] `company.json` contains the correct metadata and status for company additions;
- [ ] generated documentation is up to date; and
- [ ] the Pull Request contains one focused change.

## Community

Be respectful and constructive in issues, Pull Requests, and reviews. Beginners, questions, and good-faith discussion are welcome: we are all here to learn and improve.

Every project interaction follows the [Code of Conduct](CODE_OF_CONDUCT.md).

For contribution questions that do not fit an existing issue:
- GitHub: [@simonesiega](https://github.com/simonesiega)
- Email: [simonesiega1@gmail.com](mailto:simonesiega1@gmail.com).

Thanks for contributing to **LeetCode Solutions**!