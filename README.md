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
    <img src="https://img.shields.io/badge/Python-3.10%2B-blue" alt="Python 3.10 or newer" />
    <!-- solved-count:start -->
    <img src="https://img.shields.io/badge/NeetCode%20Solved-43-brightgreen" alt="NeetCode solved problems: 43" />
    <!-- solved-count:end -->
    <!-- company-count:start -->
    <img src="https://img.shields.io/badge/Companies-2-blue" alt="Companies covered: 2" />
    <!-- company-count:end -->
    <img src="https://img.shields.io/badge/Roadmap-NeetCode%20All-purple" alt="Roadmap: NeetCode All" />
  </p>
</div>

## What's this?

Nothing fancy. This is where I keep the LeetCode problems I solve while working through the [NeetCode All roadmap](https://neetcode.io/roadmap) and preparing for OAs and interviews.

The repo keeps progress, complexity notes, solve dates, personal difficulty, and company-specific practice in sync so I can mostly focus on solving problems and come back later to see how I’ve improved.

## Using the repo locally

You’ll need **Python 3.10+** for the solutions and **Node.js 22+** for the trackers. The solutions only use the standard library, and there’s no npm install to worry about.

I test my solutions on LeetCode before adding them here. The local checks just keep the tooling, metadata, lint, and syntax in order. You can find those commands, including the Windows setup, in [Contributing](CONTRIBUTING.md#before-opening-the-pr).

## Personal difficulty rating

For both **NeetCode roadmap problems** and **company-specific practice**, I can assign an optional personal difficulty score from **1 to 10**.

It represents how difficult it felt to derive a correct and reasonably optimal solution from scratch, not how difficult the implementation looks after the solution is known.

<details>
<summary><strong>View the rating scale</strong></summary>

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

</details>

Because the rating is personal, it can change as I become more familiar with a pattern. A LeetCode **Hard** can receive a relatively low score if its core idea feels natural to me, while a **Medium** can receive a higher score if its main insight is difficult to discover.

## NeetCode progress

<!-- roadmap-snapshot:start -->
The roadmap totals are a snapshot of NeetCode All captured on September 14, 2026 and may change as NeetCode adds or reorganizes problems.
<!-- roadmap-snapshot:end -->

The full solved catalog, including complexity and solve dates, is in [SOLUTIONS.md](SOLUTIONS.md).

<!-- topic-chart:start -->
<div align="center">

```mermaid
%%{init: {"themeVariables":{"pie1":"#277ace","pie2":"#ce2748","pie3":"#27ce35","pie4":"#6727ce"},"themeCSS":".pieCircle:nth-of-type(1){fill:#277ace!important}.legend:nth-of-type(2) rect{fill:#277ace!important;stroke:#277ace!important}.pieCircle:nth-of-type(2){fill:#ce2748!important}.legend:nth-of-type(3) rect{fill:#ce2748!important;stroke:#ce2748!important}.pieCircle:nth-of-type(3){fill:#27ce35!important}.legend:nth-of-type(4) rect{fill:#27ce35!important;stroke:#27ce35!important}.pieCircle:nth-of-type(4){fill:#6727ce!important}.legend:nth-of-type(5) rect{fill:#6727ce!important;stroke:#6727ce!important}"}}%%
pie showData
    title Solved Problems by Topic (43 Total)
    "Arrays & Hashing" : 23
    "Two Pointers" : 8
    "Sliding Window" : 6
    "Stack" : 6
```

</div>
<!-- topic-chart:end -->

<!-- difficulty-chart:start -->
<div align="center">

```mermaid
%%{init: {"themeVariables": {"pie1": "#1f883d", "pie2": "#d29922", "pie3": "#d1242f"}}}%%
pie showData
    title Solved Problems by Difficulty (43 Total)
    "Easy" : 21
    "Medium" : 18
    "Hard" : 4
```

</div>
<!-- difficulty-chart:end -->

<!-- personal-difficulty-chart:start -->
<div align="center">

```mermaid
%%{init: {"themeVariables":{"pie1":"#1f883d","pie2":"#3d9140","pie3":"#5c993f","pie4":"#7f9e3a","pie5":"#a39e32","pie6":"#c49225","pie7":"#d37a23"},"themeCSS":".pieCircle:nth-of-type(1){fill:#1f883d!important}.legend:nth-of-type(2) rect{fill:#1f883d!important;stroke:#1f883d!important}.pieCircle:nth-of-type(2){fill:#3d9140!important}.legend:nth-of-type(3) rect{fill:#3d9140!important;stroke:#3d9140!important}.pieCircle:nth-of-type(3){fill:#5c993f!important}.legend:nth-of-type(4) rect{fill:#5c993f!important;stroke:#5c993f!important}.pieCircle:nth-of-type(4){fill:#7f9e3a!important}.legend:nth-of-type(5) rect{fill:#7f9e3a!important;stroke:#7f9e3a!important}.pieCircle:nth-of-type(5){fill:#a39e32!important}.legend:nth-of-type(6) rect{fill:#a39e32!important;stroke:#a39e32!important}.pieCircle:nth-of-type(6){fill:#c49225!important}.legend:nth-of-type(7) rect{fill:#c49225!important;stroke:#c49225!important}.pieCircle:nth-of-type(7){fill:#d37a23!important}.legend:nth-of-type(8) rect{fill:#d37a23!important;stroke:#d37a23!important}"}}%%
pie showData
    title Solved Problems by Personal Difficulty (43 Rated)
    "1/10" : 9
    "2/10" : 14
    "3/10" : 6
    "4/10" : 7
    "5/10" : 4
    "6/10" : 2
    "7/10" : 1
```

</div>
<!-- personal-difficulty-chart:end -->

### Progress by topic

If you want to see the full topic breakdown, including solved counts and links to solutions, click below.

<details>
<summary><strong>View detailed topic progress</strong></summary>

<!-- topic-table:start -->
| Topic | Solved | Total | Solutions |
|---|---:|---:|:---:|
| Arrays &amp; Hashing | 23 | 175 | [View](SOLUTIONS.md#arrays-and-hashing) |
| Two Pointers | 8 | 43 | [View](SOLUTIONS.md#two-pointers) |
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
| Math &amp; Geometry | 0 | 63 | [View](SOLUTIONS.md#math-and-geometry) |
| Bit Manipulation | 0 | 31 | [View](SOLUTIONS.md#bit-manipulation) |
| **All topics** | <!-- progress-total:start -->**43**<!-- progress-total:end --> | **943** | [Browse all](SOLUTIONS.md) |
<!-- topic-table:end -->

</details>

## Company prep

I also keep some separate practice for specific companies in [`companies/`](companies/README.md).

For company-specific practice, I often use [liquidslr/leetcode-company-wise-problems](https://github.com/liquidslr/leetcode-company-wise-problems) as the problem source and work through each company's list from highest reported frequency to lowest.

If I solve the same problem again while preparing for an OA or interview, I keep that attempt separate. I like being able to see how I approached the same problem at different times.

<!-- company-progress:start -->
Company practice currently contains **2 companies**

<div align="center">

```mermaid
pie showData
    title Solved Problems by Company (14 Total)
    "IBM" : 10
    "Roblox" : 4
```

</div>
<!-- company-progress:end -->

### Companies

<!-- company-list:start -->
| Company | Folder |
|---|---|
| IBM | [`companies/ibm/`](companies/ibm/) |
| Roblox | [`companies/roblox/`](companies/roblox/) |
<!-- company-list:end -->

You can find more information in the [company prep guide](companies/README.md).

## How I write my solutions

Everything here is Python 3.10 or newer. I write for the problem’s constraints, so a solution might sort the input or update it in place when that’s allowed.

The complexity notes describe my actual code, not just the best-known approach. There’s a short explanation of [how I count time and space](docs/DATA_MODEL.md#complexity-conventions) in the data model docs.

I try to keep the solutions simple and readable: basically code I’d be comfortable explaining out loud in an interview. I’m not trying to write the cleverest one-liner possible.

## Want to contribute?

Found a mistake or have a cleaner solution? Feel free to open a PR. Have a look at [CONTRIBUTING.md](CONTRIBUTING.md) first so everything stays consistent.

If you want, you can also fill out the [Pull Request template](.github/pull_request_template.md) to provide more context for your changes.

## License

The repository’s original code and documentation are licensed under the [MIT License](LICENSE). Third-party content, platform names, and trademarks remain the property of their respective owners.

## Contributors

Thanks to all the people who have contributed to this project!

<p align="center">
  <a href="https://github.com/simonesiega/leetcode-solutions/graphs/contributors">
    <img src="https://contrib.rocks/image?repo=simonesiega/leetcode-solutions&max=24&columns=12" alt="Contributors" />
  </a>
</p>
