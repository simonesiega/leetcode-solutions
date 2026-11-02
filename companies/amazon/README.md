# Amazon

> This file is generated from [`company.json`](company.json). Do not edit it directly.

[← Companies](../README.md) · [Project README](../../README.md)

**Source:** Manual entries only

## Progress

- **Solved:** 3 / 3
- **In progress:** 0
- **Planned:** 0

<div align="center">

```mermaid
%%{init: {"themeVariables": {"pie1": "#1f883d", "pie2": "#d29922", "pie3": "#d1242f"}}}%%
pie showData
    title Solved Problems by Difficulty (3 Total)
    "Easy" : 3
    "Medium" : 0
    "Hard" : 0
```

</div>

| Rank | Problem | Frequency | Difficulty | Status | Personal | Solution |
|---:|---|---:|:---:|:---:|:---:|---|
| Manual | [Merge Two Sorted Lists](https://leetcode.com/problems/merge-two-sorted-lists/) | Not sourced | Easy | Solved | 2 | [21.py](solutions/21.py) |
| Manual | [Linked List Cycle](https://leetcode.com/problems/linked-list-cycle/) | Not sourced | Easy | Solved | 2 | [141.py](solutions/141.py) |
| Manual | [Reverse Linked List](https://leetcode.com/problems/reverse-linked-list/) | Not sourced | Easy | Solved | 2 | [206.py](solutions/206.py) |

## Attempt details

The [complexity notes](../../docs/DATA_MODEL.md#complexity-conventions) explain how I count time and space. I use source frequency to choose what to practice, not to predict interview questions.

| ID | Time | Space | Notes |
|---|---|---|---|
| 21 | O(n + m) | O(1) auxiliary space | n and m = number of nodes in the two input lists; reuses existing nodes |
| 141 | O(n) | O(1) auxiliary space | n = number of distinct nodes reachable from head; uses Floyd's slow and fast pointers |
| 206 | O(n) | O(1) auxiliary space | n = number of nodes in the linked list; reverses the list in place |

## Commands

Run these from the repository root, replacing the placeholders with your values. Anything in square brackets is optional. For source commands, set up the company’s source first and run `source-sync` before `next` or `add-from-source`.

```text
node scripts/company-tracker.js source-sync amazon
node scripts/company-tracker.js next amazon
node scripts/company-tracker.js add-from-source amazon <source-key> [--id problem-id]
node scripts/company-tracker.js add-problem amazon <id> "<title>" <Easy|Medium|Hard> [--url URL]
node scripts/company-tracker.js start amazon <id>
node scripts/company-tracker.js solve amazon <id> --time "O(...)" --space "O(...)" [--personal-difficulty 1-10]
```
