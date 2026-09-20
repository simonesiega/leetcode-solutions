# Company interview preparation

[← Project README](../README.md) · [Solutions](../SOLUTIONS.md) · [Contributing](../CONTRIBUTING.md)

This is where I keep separate practice for specific companies, OAs, and interviews.

For the main company lists, I often use [liquidslr/leetcode-company-wise-problems](https://github.com/liquidslr/leetcode-company-wise-problems) and generally work through each company from the highest reported frequency to the lowest.

I only add a problem here when I actually decide to practice it, so `company.json` stays focused on my own progress instead of becoming a copy of the full external dataset.

## Progress

| Company | Solved | In progress | Planned |
|---|---:|---:|---:|
| [IBM](ibm/README.md) | 7 / 7 | 0 | 0 |
| [Roblox](roblox/README.md) | 4 / 4 | 0 | 0 |

**Total:** 11 solved, 0 in progress, and 0 planned across 2 companies.

## Picking the next problem

The source list stays in a local gitignored cache, so normal checks and CI do not need it. These commands sync the CSV from the pinned commit, show the next highest-ranked problem, and add it to my own list:

```bash
node scripts/company-tracker.js source-sync ibm
node scripts/company-tracker.js next ibm
node scripts/company-tracker.js add-from-source ibm valid-parentheses --id 20
```

If I already have the CSV locally, I can use it without downloading anything:

```bash
node scripts/company-tracker.js source-sync ibm --file PATH
```

`source-sync` always uses the exact source commit saved for that company rather than silently switching to the latest upstream data.

## Adding something manually

Manual and OA-specific problems work too:

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

The exact schema and source metadata rules are documented in [the data model reference](../docs/DATA_MODEL.md).

> [!IMPORTANT]
> Company README files are generated. Update the manifest through the tracker or source data, then run `node scripts/company-tracker.js` instead of editing Markdown directly.
