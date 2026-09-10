# Company interview preparation

[← Project README](../README.md) · [Solutions](../SOLUTIONS.md) · [Contributing](../CONTRIBUTING.md)

This directory contains focused preparation for upcoming OAs and technical interviews.

Company-specific attempts stay separate from the year-round NeetCode roadmap, so revisiting the same problem for a particular interview remains visible as an independent practice session.

## Progress

| Company | Solved | In progress | Planned |
|---|---:|---:|---:|
| [Roblox](roblox/README.md) | 1 / 1 | 0 | 0 |

**Total:** 1 solved, 0 in progress, and 0 planned across 1 company.

## Quick start

Run these commands from the repository root:

```bash
# Create companies/amazon with its manifest and generated dashboard.
node scripts/company-tracker.js add-company "Amazon"

# Add a problem to the preparation plan.
# Numeric IDs default to the corresponding LeetCode problem URL.
node scripts/company-tracker.js add-problem amazon 1 "Two Sum" Easy

# Create companies/amazon/solutions/1.py and mark the problem in progress.
node scripts/company-tracker.js start amazon 1

# After implementing the solution and removing TODO(company-solution),
# record its time and space complexity.
node scripts/company-tracker.js solve amazon 1 --time "O(n)" --space "O(n)"
```

Use `--focus` when the workspace targets a particular region, assessment, or interview stage:

```bash
node scripts/company-tracker.js add-company "Roblox" --focus "US OA"
```

Use `add-problem --url` when the problem is not from LeetCode, and `--notes` for a short pattern, reminder, or review note.

Run the following command to see all available options:

```bash
node scripts/company-tracker.js --help
```

## Folder layout

Each company gets a small tracked workspace containing its source metadata, generated progress page, and independent solutions:

```text
companies/
└── amazon/
    ├── company.json       # problem metadata, status, and workspace settings
    ├── README.md          # generated company progress dashboard
    └── solutions/
        └── 1.py           # independent company-specific attempt
```

`company.json` is the source of truth for each workspace.

Statuses follow `planned → in-progress → solved`. A solved entry must include its Python solution together with time and space complexity. The manifest, generated dashboard, and solutions are committed so preparation progress remains visible over time.

> [!IMPORTANT]
> Company README files are generated. Do not edit them directly.
>
> Update `company.json` through the tracker or the appropriate source data, then regenerate the documentation with:
>
> ```bash
> node scripts/company-tracker.js
> ```
