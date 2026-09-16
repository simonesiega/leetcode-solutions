<div align="center">
  <h1>LeetCode Solutions</h1>

  <p>My LeetCode solutions in Python while I work through NeetCode and prepare for interviews.</p>

  <p>
    <a href="#personal-difficulty-rating">Difficulty rating</a> ·
    <a href="#neetcode-progress">NeetCode progress</a> ·
    <a href="SOLUTIONS.md">Solutions</a> ·
    <a href="#company-prep">Companies</a> ·
    <a href="#want-to-contribute">Want to contribute?</a>
  </p>

  <p>
    <img src="https://img.shields.io/badge/Python-3-blue" alt="Python 3" />
    <!-- solved-count:start -->
    <img src="https://img.shields.io/badge/NeetCode%20Solved-29-brightgreen" alt="NeetCode solved problems: 29" />
    <!-- solved-count:end -->
    <!-- company-count:start -->
    <img src="https://img.shields.io/badge/Companies-1-blue" alt="Companies covered: 1" />
    <!-- company-count:end -->
    <img src="https://img.shields.io/badge/Roadmap-NeetCode%20All-purple" alt="Roadmap: NeetCode All" />
  </p>
</div>

## What's this?

Nothing fancy, this is where I keep the LeetCode problems I solve while working through the [NeetCode All roadmap](https://neetcode.io/roadmap) and preparing for OAs and interviews.

Mostly here so I can keep track of what I’ve done, come back to old problems, and hopefully see myself getting better over time.

## Personal difficulty rating

For both **NeetCode roadmap problems** and **company-specific practice**, I optionally assign a personal difficulty score from **1 to 10**.

The score represents how difficult it felt to derive a correct and reasonably optimal solution from scratch, not how difficult the implementation looks after the solution is known. It is separate from LeetCode's official Easy / Medium / Hard classification and is meant to track how my own problem-solving ability changes over time.

| Rating | Level | Meaning |
|---:|---|---|
| **1** | Immediate | I see the solution almost instantly. The right data structure or algorithm is obvious, with almost no real reasoning required. |
| **2** | Easy | I need a little thought, but the approach appears naturally. There may be small implementation details or edge cases, but no important hidden insight. |
| **3** | Comfortable | I need to recognize a known pattern, but once I identify it, the solution follows naturally. I can usually derive it independently without getting stuck. |
| **4** | Moderate | The solution is not immediately obvious. I need to explore the problem, identify the right pattern, or make one useful observation before the approach becomes clear. |
| **5** | Significant insight | The problem depends on one important idea that I may not discover immediately. I may spend a meaningful amount of time exploring before finding the key insight. |
| **6** | Difficult | The problem requires a non-obvious insight, several coordinated steps, or tricky implementation. Deriving the full solution from scratch in an interview would be uncertain. |
| **7** | Very difficult | The optimal solution relies on a technique or invariant that I am unlikely to discover quickly. Even recognizing the general category may not be enough to reach the full algorithm. |
| **8** | Major non-obvious insight | The solution requires changing how I initially view the problem or combining several important deductions. Missing one of them can prevent me from reaching the intended approach. |
| **9** | Extremely hard to derive | I would probably not reach the intended optimal solution from scratch under interview pressure and would likely need a substantial hint. |
| **10** | No realistic path from scratch | I would have essentially no path to the intended solution without seeing a major part of the idea first. The required technique or transformation is outside my current problem-solving instincts. |

Because the rating is personal, it can change as I become more familiar with a pattern. A LeetCode **Hard** can receive a relatively low score if its core idea feels natural to me, while a **Medium** can receive a higher score if its main insight is difficult to discover.

## NeetCode progress

The roadmap totals are a snapshot of NeetCode All and may change as NeetCode adds or reorganizes problems.

[`data/roadmap.json`](data/roadmap.json) keeps the roadmap data in one place. The generator checks it against the solution files, then uses it to build [SOLUTIONS.md](SOLUTIONS.md), update the solved counts, and generate the README charts and topic table.

<!-- difficulty-chart:start -->
```mermaid
%%{init: {"themeVariables": {"pie1": "#1f883d", "pie2": "#d29922", "pie3": "#d1242f"}}}%%
pie showData
    title Solved Problems by Difficulty (29 Total)
    "Easy" : 9
    "Medium" : 16
    "Hard" : 4
```
<!-- difficulty-chart:end -->

<!-- topic-chart:start -->
```mermaid
%%{init: {"themeVariables":{"pie1":"#277ace","pie2":"#ce2748","pie3":"#27ce35","pie4":"#6727ce"},"themeCSS":".pieCircle:nth-of-type(1){fill:#277ace!important}.legend:nth-of-type(2) rect{fill:#277ace!important;stroke:#277ace!important}.pieCircle:nth-of-type(2){fill:#ce2748!important}.legend:nth-of-type(3) rect{fill:#ce2748!important;stroke:#ce2748!important}.pieCircle:nth-of-type(3){fill:#27ce35!important}.legend:nth-of-type(4) rect{fill:#27ce35!important;stroke:#27ce35!important}.pieCircle:nth-of-type(4){fill:#6727ce!important}.legend:nth-of-type(5) rect{fill:#6727ce!important;stroke:#6727ce!important}"}}%%
pie showData
    title Solved Problems by Topic (29 Total)
    "Arrays & Hashing" : 12
    "Two Pointers" : 5
    "Sliding Window" : 6
    "Stack" : 6
```
<!-- topic-chart:end -->

### Progress by topic

Open the table below to see solved and total problem counts for every roadmap topic and jump to its solution catalog section.

<details>
<summary><strong>View detailed topic progress</strong></summary>

<!-- topic-table:start -->
| Topic | Solved | Total | Solutions |
|---|---:|---:|:---:|
| Arrays & Hashing | 12 | 175 | [View](SOLUTIONS.md#arrays-and-hashing) |
| Two Pointers | 5 | 43 | [View](SOLUTIONS.md#two-pointers) |
| Sliding Window | 6 | 41 | [View](SOLUTIONS.md#sliding-window) |
| Stack | 6 | 39 | [View](SOLUTIONS.md#stack) |
| Binary Search | 0 | 43 | [View](SOLUTIONS.md#binary-search) |
| Linked List | 0 | 40 | [View](SOLUTIONS.md#linked-list) |
| Trees | 0 | 93 | [View](SOLUTIONS.md#trees) |
| Heap / Priority Queue | 0 | 33 | [View](SOLUTIONS.md#heap-priority-queue) |
| Backtracking | 0 | 36 | [View](SOLUTIONS.md#backtracking) |
| Tries | 0 | 12 | [View](SOLUTIONS.md#tries) |
| Graphs | 0 | 71 | [View](SOLUTIONS.md#graphs) |
| Advanced Graphs | 0 | 30 | [View](SOLUTIONS.md#advanced-graphs) |
| 1-D Dynamic Programming | 0 | 55 | [View](SOLUTIONS.md#1d-dynamic-programming) |
| 2-D Dynamic Programming | 0 | 50 | [View](SOLUTIONS.md#2d-dynamic-programming) |
| Greedy | 0 | 67 | [View](SOLUTIONS.md#greedy) |
| Intervals | 0 | 21 | [View](SOLUTIONS.md#intervals) |
| Math & Geometry | 0 | 63 | [View](SOLUTIONS.md#math-and-geometry) |
| Bit Manipulation | 0 | 31 | [View](SOLUTIONS.md#bit-manipulation) |
| **All topics** | <!-- progress-total:start -->**29**<!-- progress-total:end --> | **973** | [Browse all](SOLUTIONS.md) |
<!-- topic-table:end -->

</details>

## Company prep

I also keep some separate practice for specific companies in [`companies/`](companies/README.md).

If I solve the same problem again while preparing for an OA or interview, I keep that attempt separate. I like being able to see how I approached the same problem at different times.

<!-- company-progress:start -->
**1 company · 4 solved · 0 in progress · 0 planned**
<!-- company-progress:end -->

### Companies

<!-- company-list:start -->
| Company | Folder |
|---|---|
| Roblox | [`companies/roblox/`](companies/roblox/) |
<!-- company-list:end -->

There’s also a small tracker behind this so I don’t have to update everything by hand. It keeps track of `planned → in-progress → solved` problems and checks that solved ones include the solution, time complexity, and space complexity.

If you’re curious, the full setup is in the [company prep guide](companies/README.md).

## Folder layout

NeetCode solutions are grouped by topic, while company prep gets its own folder for each company:

```text
# Roadmap metadata
data/roadmap.json

# NeetCode All roadmap solutions
neetcode-all/<topic-slug>/<problem-number>.py

# Company preparation solutions
companies/<company-name>/solutions/<problem-id>.py
```

For example, a roadmap solution is [`neetcode-all/arrays-and-hashing/217.py`](neetcode-all/arrays-and-hashing/217.py).

Company attempts use the same simple Python style, but they stay inside their own company folder.

## How I write my solutions

Everything is Python 3 unless I have a reason to use something else.

I try to keep the solutions simple and readable — basically code I’d be comfortable explaining out loud in an interview. I’m not trying to write the cleverest one-liner possible.

## Want to contribute?

Found a mistake or have a cleaner solution? Feel free to open a PR. Have a look at [CONTRIBUTING.md](CONTRIBUTING.md) first so everything stays consistent.

## Problem references

Solution files identify each problem only by its title and ID. For the full statement, examples, and constraints, use the official link in [SOLUTIONS.md](SOLUTIONS.md) or the relevant company dashboard.

## License

The repository’s original code and documentation are licensed under the [MIT License](LICENSE). Third-party content, platform names, and trademarks remain the property of their respective owners.

## Contributors

<p align="center">
  <a href="https://github.com/simonesiega/leetcode-solutions/graphs/contributors">
    <img src="https://contrib.rocks/image?repo=simonesiega/leetcode-solutions&max=24&columns=12" alt="Contributors" />
  </a>
</p>