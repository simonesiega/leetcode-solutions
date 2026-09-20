# IBM

> This file is generated from [`company.json`](company.json). Do not edit it directly.

[← Companies](../README.md) · [Project README](../../README.md)

## Progress

- **Solved:** 2 / 2
- **In progress:** 0
- **Planned:** 0

```mermaid
%%{init: {"themeVariables": {"pie1": "#1f883d", "pie2": "#d29922", "pie3": "#d1242f"}}}%%
pie showData
    title Solved Problems by Difficulty (2 Total)
    "Easy" : 1
    "Medium" : 1
    "Hard" : 0
```

| ID | Problem | Difficulty | Personal Difficulty | Status | Solution | Time | Space | Notes |
|---|---|:---:|:---:|:---:|---|---|---|---|
| 56 | [Merge Intervals](https://leetcode.com/problems/merge-intervals/) | Medium | 3 | Solved | [56.py](solutions/56.py) | O(n log n), where n is the number of intervals | O(n) for the returned merged intervals | n = the number of intervals |
| 412 | [Fizz Buzz](https://leetcode.com/problems/fizz-buzz/) | Easy | 1 | Solved | [412.py](solutions/412.py) | O(n) | O(1) auxiliary; O(n) including the output | n = the input integer and number of generated entries |

## Commands

```bash
node scripts/company-tracker.js add-problem ibm <id> "<title>" <Easy|Medium|Hard> [--personal-difficulty 1-10] [--url URL]
node scripts/company-tracker.js start ibm <id>
node scripts/company-tracker.js solve ibm <id> --time "O(...)" --space "O(...)" [--personal-difficulty 1-10]
```
