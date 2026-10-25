# Company interview preparation

[← Project README](../README.md) · [Solutions](../SOLUTIONS.md) · [Contributing](../CONTRIBUTING.md)

This is where I keep separate practice for specific companies, OAs, and interviews.

For the main company lists, I often use [liquidslr/leetcode-company-wise-problems](https://github.com/liquidslr/leetcode-company-wise-problems) and generally work through each company from the highest reported frequency to the lowest.

I only add a problem here when I actually decide to practice it, so `company.json` stays focused on my own progress instead of becoming a copy of the full external dataset.

## Progress

| Company | Solved | In progress | Planned |
|---|---:|---:|---:|
| [IBM](ibm/README.md) | 10 / 10 | 0 | 0 |
| [Roblox](roblox/README.md) | 4 / 4 | 0 | 0 |

**Total:** 14 solved, 0 in progress, and 0 planned across 2 companies.

## Picking the next problem

The source list stays in a local gitignored cache, so normal checks and CI do not need it. I use these commands to download the pinned CSV and see the next highest-ranked problem:

```bash
node scripts/company-tracker.js source-sync ibm
node scripts/company-tracker.js next ibm
```

Then I add the key shown by `next`, with its verified LeetCode ID:

```text
node scripts/company-tracker.js add-from-source ibm <source-key> --id <problem-id>
```

Replace the placeholders with the problem you picked. You can also leave out `--id` and use the source key as the filename.

If I already have the CSV locally, I can use it without downloading anything:

```bash
node scripts/company-tracker.js source-sync ibm --file PATH
```

Downloads use the saved commit, not the latest upstream version. If I use `--file`, I make sure the CSV comes from that same snapshot; the tracker can check its format, but not where I got it.

## Adding something manually

Manual and OA-specific problems work too:

```bash
node scripts/company-tracker.js add-company "Amazon" --focus "US OA"
node scripts/company-tracker.js add-problem amazon oa-pairs "Pair Optimization" Medium --url https://example.com/problems/pairs
node scripts/company-tracker.js start amazon oa-pairs
# Finish companies/amazon/solutions/oa-pairs.py and remove its TODO marker first.
node scripts/company-tracker.js solve amazon oa-pairs --time "O(n)" --space "O(n)" --personal-difficulty 3 --notes "n = number of values"
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
