# Repository data model

[← Project README](../README.md) · [Contributing](../CONTRIBUTING.md)

This is the technical reference for the small JSON files behind the repo automation. Most of the time the trackers handle everything for me, so this page just explains what each source file stores, what gets generated from it, and the rules that keep the data consistent.

## Sources of truth

| Area | Source | Generated from it |
|---|---|---|
| NeetCode roadmap | `data/roadmap.json` | `SOLUTIONS.md` and the roadmap blocks in `README.md` |
| Company prep | `companies/<company>/company.json` | `companies/<company>/README.md`, `companies/README.md`, and the company blocks in `README.md` |
| External company lists | Local gitignored cache | Nothing is committed automatically |

Generated Markdown should not be edited by hand. Change the JSON or use the tracker, then regenerate the docs.

## Roadmap data

`data/roadmap.json` uses `schemaVersion: 3`.

| Field | What it stores |
|---|---|
| `schemaVersion` | Current roadmap schema version, `3` |
| `name` | Roadmap name |
| `snapshotDate` | Date when the stored NeetCode totals were last verified |
| `total` | Total number of problems in that snapshot |
| `topics` | Ordered topic metadata |
| `problems` | Problems I currently track |

Each topic stores `slug`, `label`, and `total`. The slug also matches the folder under `neetcode-all/`.

Each roadmap problem stores:

| Field | Meaning |
|---|---|
| `id` | Numeric LeetCode ID |
| `title` | Official title |
| `url` | Canonical LeetCode URL |
| `topic` | Registered topic slug |
| `difficulty` | `Easy`, `Medium`, or `Hard` |
| `personalDifficulty` | My optional rating from 1 to 10 |
| `status` | `planned`, `in-progress`, or `solved` |
| `solvedAt` | UTC completion timestamp, or `null` |
| `timeComplexity` | Time complexity note |
| `spaceComplexity` | Space complexity note |

### Roadmap lifecycle

| Status | Solution file | `solvedAt` | Complexity |
|---|---|---|---|
| `planned` | Does not exist | `null` | Can be empty |
| `in-progress` | Exists | `null` | Can be empty |
| `solved` | Finished implementation | UTC timestamp | Time and space required |

The normal flow is `planned → in-progress → solved`.

When `solve` succeeds, the tracker records `solvedAt` once. Re-solving the same problem fails instead of replacing the original timestamp. Historical dates should come from a real completion record, such as the original `solve leetcode #<id>` commit, and should never be guessed.

Example:

```json
"solvedAt": "2026-09-20T17:14:31.000Z"
```

`SOLUTIONS.md` only shows the date part.

`snapshotDate` is different: it only changes when I intentionally refresh the stored NeetCode roadmap totals or topic structure. Solving problems or regenerating docs does not change it.

## Company data

Every company workspace has its own `company.json`, also using `schemaVersion: 3`.

| Field | What it stores |
|---|---|
| `schemaVersion` | Current company schema version, `3` |
| `name` | Company name |
| `focus` | Optional prep context, such as an OA or region |
| `website` | Optional public company URL |
| `source` | External list information, or `null` |
| `problems` | Problems I actually selected for practice |

The manifest is personal tracked state, not a copy of the full external company list.

A manually added problem stores:

| Field | Meaning |
|---|---|
| `id` | Numeric LeetCode ID or custom OA ID |
| `title` | Problem title |
| `url` | Problem URL when available |
| `difficulty` | Platform difficulty |
| `personalDifficulty` | My optional 1–10 rating |
| `status` | `planned`, `in-progress`, or `solved` |
| `time` | Time complexity |
| `space` | Space complexity |
| `notes` | Short notes or reminders |

The same lifecycle applies here: planned problems have no solution file, while in-progress and solved problems do. Solved entries need time and space complexity.

Company attempts do not currently store `solvedAt`.

## Company source data

For company-specific practice, I often use [liquidslr/leetcode-company-wise-problems](https://github.com/liquidslr/leetcode-company-wise-problems) as the problem source.

When a company uses it, `source` keeps the exact snapshot:

```json
"source": {
  "repository": "liquidslr/leetcode-company-wise-problems",
  "commit": "03850eb5d16892514491cf1381c32ec0330a2719",
  "snapshotDate": "2026-08-16",
  "window": "all",
  "path": "IBM/5. All.csv"
}
```

| Field | Meaning |
|---|---|
| `repository` | Source repository |
| `commit` | Exact pinned commit |
| `snapshotDate` | Date represented by that source snapshot |
| `window` | Selected source window |
| `path` | Exact CSV path inside the source repo |

This keeps the ranking reproducible even if the upstream repository changes later. The company `snapshotDate` is unrelated to the roadmap `snapshotDate`.

Source-backed problems also store:

| Field | Meaning |
|---|---|
| `sourceKey` | Canonical LeetCode slug |
| `sourceRank` | Stable position in the source list |
| `frequency` | Reported source frequency |

I keep both rank and frequency because multiple problems can have the same frequency while still having a deterministic order. Source-backed entries are sorted by `sourceRank`, while manual and OA-specific entries still work normally.

## Source cache

The full external dataset is never committed. `source-sync` stores only the selected CSV in:

```text
.cache/company-source/<company>/<commit>-<source-fingerprint>.csv
```

The fingerprint identifies the pinned repository path, preventing different source windows at the same commit from sharing a cache file. `.cache/` is gitignored, and normal validation or CI does not need network access.

An already downloaded CSV can also be used:

```bash
node scripts/company-tracker.js source-sync ibm --file PATH
```

The dependency-free CSV parser supports quoted values, commas inside quotes, escaped quotes, LF and CRLF line endings, and empty fields.

| Source column | Used for |
|---|---|
| `Difficulty` | Platform difficulty |
| `Title` | Problem title |
| `Frequency` | Source ranking value |
| `Link` | Canonical problem URL |
| `Topics` | Optional source metadata |
| `Acceptance Rate` | Currently ignored |

## Generated docs

The automation stays split into small pieces:

```text
scripts/
├── roadmap-tracker.js
├── company-tracker.js
└── lib/
    ├── roadmap.js
    ├── company.js
    ├── company-source.js
    └── csv.js
```

The CLI files handle commands, while the heavier validation, source parsing, and rendering logic lives in `scripts/lib/`.

Both trackers support check mode:

```bash
node scripts/roadmap-tracker.js --check
node scripts/company-tracker.js --check
```

These validate the source data and check that generated Markdown is still in sync without changing files. Running generation twice without changing the source data should produce no second diff.
