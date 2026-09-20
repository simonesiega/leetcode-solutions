# Company interview preparation

[← Project README](../README.md) · [Solutions](../SOLUTIONS.md) · [Contributing](../CONTRIBUTING.md)

This directory contains locally tracked preparation for OAs and technical interviews. Candidate lists come from [liquidslr/leetcode-company-wise-problems](https://github.com/liquidslr/leetcode-company-wise-problems), and source-backed problems are practiced from highest reported frequency to lowest. Frequency is only the source's relative ranking signal, not a prediction that a problem will appear in an interview.

Each manifest records the selected source window, snapshot date, commit, and CSV path. The external candidate list remains separate from the problems selected for practice, so progress totals below count only local manifest entries.

## Progress

| Company | Solved | In progress | Planned |
|---|---:|---:|---:|
| [IBM](ibm/README.md) | 7 / 7 | 0 | 0 |
| [Roblox](roblox/README.md) | 4 / 4 | 0 | 0 |

**Total:** 11 solved, 0 in progress, and 0 planned across 2 companies.

## Source-backed workflow

Source data is cached locally and is never required for normal validation or CI. For a company with source provenance in its manifest:

```bash
node scripts/company-tracker.js source-sync ibm
node scripts/company-tracker.js next ibm
node scripts/company-tracker.js add-from-source ibm valid-parentheses --id 20
```

`source-sync` fetches the exact pinned commit, not the latest upstream data. Use `--file PATH` to populate the same gitignored cache from a local CSV. Refreshing source provenance is an intentional data update, separate from importing one candidate.

## Manual workflow

Manual and OA-specific entries remain supported:

```bash
node scripts/company-tracker.js add-company "Amazon" --focus "US OA"
node scripts/company-tracker.js add-problem amazon oa-pairs "Pair Optimization" Medium --url https://example.com/problems/pairs
node scripts/company-tracker.js start amazon oa-pairs
node scripts/company-tracker.js solve amazon oa-pairs --time "O(n)" --space "O(n)" --personal-difficulty 3
```

Run `node scripts/company-tracker.js --help` to see every option.

## Folder layout

```text
companies/
└── amazon/
    ├── company.json       # personal tracked state and optional source provenance
    ├── README.md          # generated dashboard
    └── solutions/
        └── oa-pairs.py    # independent company-specific attempt
```

`company.json` is the source of truth for selected personal practice, not a copy of the complete external dataset. Statuses follow `planned → in-progress → solved`, and solved entries require a Python solution plus time and space complexity. See [the data model reference](../docs/DATA_MODEL.md) for exact fields and provenance semantics.

> [!IMPORTANT]
> Company README files are generated. Update the manifest through the tracker or source data, then run `node scripts/company-tracker.js` instead of editing Markdown directly.
