<div align="center">
  <h1>Contributing</h1>
</div>

Thanks for wanting to help! This repo is a relaxed study project following the [NeetCode All roadmap](https://neetcode.io/roadmap). Clear fixes, useful alternative solutions, and new roadmap problems are all welcome.

## The short version

1. Fork the repo and branch from `main`.
2. Make one focused change.
3. Check that the solution works and is accepted by LeetCode.
4. Update the docs if you added a problem.
5. Open a pull request using the template.

Small, obvious fixes can go straight to a pull request. For a big rewrite or a new approach with trade-offs, opening an [issue](https://github.com/simonesiega/leetcode-solutions/issues/new/choose) first is a good idea.

## What makes a good solution?

Please keep it:

- compatible with Python 3 (unless the problem specifically requires another language);
- in the method signature LeetCode expects;
- direct and interview-friendly;
- free of external dependencies;
- correct for the required edge cases;
- consistent with nearby files.

A new version should make something meaningfully better: clarity, naming, control flow, edge-case handling, or time/space complexity. Fewer lines alone are not always an improvement.

Comments are useful when they explain **why** a step matters. They do not need to narrate code that is already obvious.

```python
# Start counting only at the beginning of a sequence.
if number - 1 not in numbers:
```

## Adding a problem

Put each solution under its NeetCode All topic and use the numeric LeetCode ID as the filename:

```text
neetcode-all/topic/problem-number.py
```

Before opening the pull request:

1. make sure the problem is not already here;
2. add the accepted solution to the right topic folder;
3. add its link, difficulty, and complexity to `SOLUTIONS.md`;
4. update the topic's solved count in `README.md`;
5. regenerate the README stats:

   ```bash
   node scripts/update-readme-stats.js
   ```

6. run the same quick checks as CI:

   ```bash
   node scripts/update-readme-stats.js --check
   python -m compileall -q neetcode-all
   ```

The script updates the overall solved badge and difficulty chart. The topic table is kept manually because it also tracks unsolved roadmap topics and roadmap totals.

## Branches and pull requests

A short descriptive branch name is plenty:

- `solve/15-three-sum`
- `fix/36-valid-sudoku`
- `improve/125-valid-palindrome`
- `docs/update-progress`

Include the problem number in solution pull request titles, for example `Solve #15: add Three Sum`.

In the pull request, briefly say what changed, why it is useful, what the complexity is, and how you tested it. Keep unrelated cleanup out so the review stays easy.

## Before you send it

- [ ] The file is in the right `neetcode-all` topic folder.
- [ ] The filename is the numeric LeetCode ID.
- [ ] LeetCode accepts the solution.
- [ ] Relevant edge cases were checked.
- [ ] Complexity notes are accurate.
- [ ] `SOLUTIONS.md` and the README progress table are current.
- [ ] The generated README stats and syntax checks pass.
- [ ] The pull request contains one focused change.

Be kind in issues and reviews. Beginners and questions are welcome—we are all here to get better at this stuff.
