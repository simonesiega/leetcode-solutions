<h1 align="center">
  Contributing to LeetCode Solutions
</h1>

<p align="center">
  Guidelines for contributing clear, direct, and educational Python solutions.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Python-3-blue?logo=python" alt="Python 3" />
  <img src="https://img.shields.io/badge/PRs-welcome-brightgreen" alt="Pull requests welcome" />
  <img src="https://img.shields.io/github/license/simonesiega/leetcode-solutions" alt="License" />
  <img src="https://img.shields.io/github/issues-pr/simonesiega/leetcode-solutions" alt="Open pull requests" />
</p>

## Contributions are welcome

Contributions are welcome and appreciated.

This repository prioritizes solutions that are easy to understand, easy to explain, and useful for learning data structures and algorithms. Alternative implementations are welcome when they provide a meaningful improvement over the current solution.

A proposed solution should be at least one of the following:

- easier to understand;
- more clearly written;
- less abstract or less overengineered;
- more efficient in time or space complexity;
- better at communicating the core algorithmic idea;
- more reliable for valid edge cases.

A different implementation is not automatically a better implementation. A pull request may be declined when it changes the code without making the solution clearer, simpler, more educational, or more efficient.

## Ways to contribute

You can contribute by:

- improving an existing solution;
- adding a problem from the current roadmap;
- reporting an incorrect or incomplete solution;
- improving comments or documentation;
- proposing a clearer algorithmic approach.

Before starting, read the [README](README.md) for the repository scope, current roadmap, organization, and solution style.

## Use the issue forms

The repository provides guided issue forms for:

- proposing an improvement to an existing solution;
- reporting an incorrect solution;
- requesting a problem to be added.

Use the [issue chooser](https://github.com/simonesiega/leetcode-solutions/issues/new/choose) when a change needs discussion, when you found a bug, or when you want to request a problem.

For a small and straightforward contribution, you may open a pull request directly. For a substantial replacement of an existing solution, opening a solution-improvement issue first is recommended so the approach and trade-offs can be discussed.

## Contribution workflow

| Step | Action |
| --- | --- |
| 1 | Fork the repository. |
| 2 | Create a branch from `main`. |
| 3 | Make one focused contribution. |
| 4 | Test the solution and confirm that LeetCode accepts it. |
| 5 | Open a pull request and complete the provided template. |

## Branch naming

Use a short and descriptive branch name.

| Contribution | Pattern | Example |
| --- | --- | --- |
| Improve a solution | `improve/<problem-number>-<name>` | `improve/125-valid-palindrome` |
| Add a solution | `solve/<problem-number>-<name>` | `solve/15-three-sum` |
| Fix a solution | `fix/<problem-number>-<name>` | `fix/36-valid-sudoku` |
| Documentation | `docs/<description>` | `docs/update-contributing-guide` |

## Solution requirements

All contributed solutions must:

- use Python 3;
- follow the method signature required by LeetCode;
- use clear and descriptive names;
- focus on the main algorithmic idea;
- avoid unnecessary abstraction, helper layers, and special cases;
- avoid external dependencies;
- handle the required edge cases;
- be accepted by LeetCode;
- match the style of nearby solution files.

Keep implementations direct and interview-friendly. A reader should be able to understand the approach without having to navigate unnecessary indirection.

## Comments

Comments should explain the reasoning behind an algorithmic decision or clarify a non-obvious step. They should not simply translate each line of code into English.

Prefer:

```python
# Only count from values that begin a consecutive sequence.
if number - 1 not in numbers:
```

Avoid:

```python
# Check whether number minus one is not in numbers.
if number - 1 not in numbers:
```

The first comment explains why the condition matters. The second only repeats what the code does.

## Improving an existing solution

Before replacing an existing solution, compare the two implementations carefully.

Your issue or pull request must explain the concrete improvement. Useful reasons include:

- fewer or simpler steps;
- clearer control flow;
- better variable names;
- less duplicated logic;
- fewer unnecessary special cases;
- improved time or space complexity;
- easier explanation during a technical interview;
- better edge-case handling.

Do not replace a straightforward implementation only because another version uses fewer lines. Shorter code can be harder to read, explain, or maintain.

When performance changes, compare the time and space complexity of both solutions. When complexity remains the same, explain the readability or educational improvement instead.

## Adding a new problem

Only add problems that fit the repository's current roadmap and organization.

Before opening the pull request:

1. confirm that the problem is not already present;
2. place the solution in the correct roadmap and topic;
3. name the file with the numeric LeetCode problem ID;
4. follow the style of the surrounding solutions;
5. confirm that the solution is accepted by LeetCode;
6. update the progress information and solved-problem list in `README.md`.

Keep one problem per pull request whenever possible.

## Pull requests

The pull request template is loaded automatically. Complete every relevant section instead of deleting it.

The pull request title must include the LeetCode problem number.

Examples:

```text
Improve #125: simplify the two-pointer solution
```

```text
Solve #15: add Three Sum solution
```

```text
Fix #36: handle duplicate values correctly
```

A good pull request explains:

- which problem and file are affected;
- what changed;
- why the contribution is better;
- the previous and proposed complexity when applicable;
- any trade-offs;
- how the solution was validated.

Be specific. Instead of writing:

```text
This solution is cleaner.
```

Explain the concrete difference:

```text
This version uses two pointers directly instead of building a filtered
copy of the string. It keeps O(n) time complexity while reducing the
additional space from O(n) to O(1).
```

## Before requesting review

Verify that:

- [ ] the contribution is focused on one problem or improvement;
- [ ] the problem number appears in the pull request title;
- [ ] the solution is in the correct location;
- [ ] the filename matches the LeetCode problem number;
- [ ] the solution uses Python 3;
- [ ] LeetCode accepts the solution;
- [ ] relevant edge cases were tested;
- [ ] time and space complexity are accurate;
- [ ] the reason for the change is clearly explained;
- [ ] the implementation avoids unnecessary abstraction;
- [ ] documentation was updated when required;
- [ ] no unrelated changes are included.

## Review and discussion

Algorithmic solutions often involve trade-offs. A solution may use less memory while being harder to explain, or it may be shorter while being less readable.

Discussion is encouraged. Be prepared to explain your decisions, consider alternatives, and revise the contribution when feedback identifies a clearer approach.

The goal is not to prove that one coding style is universally correct. The goal is to keep the repository clear, approachable, and educational.

## Community guidelines

Be respectful and constructive in issues, pull requests, and reviews.

Feedback should focus on the implementation and its trade-offs, not on the contributor. Beginners are welcome, and questions asked in good faith are encouraged.

Thanks for contributing to **LeetCode Solutions**.
