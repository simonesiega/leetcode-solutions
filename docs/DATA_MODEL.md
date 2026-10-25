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

I keep files in UTF-8. JSON and CSV can include a BOM, and the generated-doc checks accept both LF and CRLF line endings.

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

Each topic stores `slug`, `label`, and `total`. The slug also matches the folder under `neetcode-all/`. Topic totals must sum to the roadmap total, and tracked entries cannot exceed the overall or per-topic capacity.

Each roadmap problem stores (IDs and canonical URLs must both be unique):

| Field | Meaning |
|---|---|
| `id` | Positive safe-integer LeetCode ID, ordered numerically |
| `title` | Official title |
| `url` | Canonical LeetCode URL |
| `topic` | Registered topic slug |
| `difficulty` | `Easy`, `Medium`, or `Hard` |
| `personalDifficulty` | My rating from 1 to 10, or `null` when unrated |
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
{
  "solvedAt": "2026-09-20T17:14:31.000Z"
}
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
| `id` | String containing a LeetCode ID or custom OA ID, such as `"1"` or `"oa-pairs"` |
| `title` | Problem title |
| `url` | Problem URL when available |
| `difficulty` | Platform difficulty |
| `personalDifficulty` | My 1–10 rating, or `null` when unrated |
| `status` | `planned`, `in-progress`, or `solved` |
| `time` | Time complexity |
| `space` | Space complexity |
| `notes` | Short notes or reminders |

The same lifecycle applies here: planned problems have no solution file, while in-progress and solved problems do. Solved entries need time and space complexity.

Company attempts do not currently store `solvedAt`.

A few naming rules keep the folders usable across systems:

- Folder slugs use lowercase letters, digits, and single hyphens.
- Company problem IDs can also use uppercase letters, dots, and underscores, but must start and end with a letter or digit.
- Windows names like `CON`, `aux`, and `NUL.txt` aren’t allowed. Two IDs in one company can’t differ only by case either.
- Source-backed entries come first. Manual IDs use a fixed English sort with numeric ordering and a lexical tie-breaker, so system language settings don’t change the order.

I check solutions on LeetCode. The tracker just checks their metadata, files, headers, and TODO markers; lint and compilation are separate checks.

## Company source data

For company-specific practice, I often use [liquidslr/leetcode-company-wise-problems](https://github.com/liquidslr/leetcode-company-wise-problems) as the problem source.

When a company uses it, `source` keeps the exact snapshot:

```json
{
  "source": {
    "repository": "liquidslr/leetcode-company-wise-problems",
    "commit": "03850eb5d16892514491cf1381c32ec0330a2719",
    "snapshotDate": "2026-08-16",
    "window": "all",
    "path": "IBM/5. All.csv"
  }
}
```

| Field | Meaning |
|---|---|
| `repository` | Source repository |
| `commit` | Exact pinned commit |
| `snapshotDate` | Date represented by that source snapshot |
| `window` | Selected source window |
| `path` | Exact CSV path inside the source repo |

This keeps the ranking reproducible even if the upstream repository changes later. The company `snapshotDate` is unrelated to the roadmap `snapshotDate`. New workspaces start with `source: null`; for a new source-backed workspace, record verified provenance in `company.json` and regenerate the dashboard before running `source-sync`.

Source-backed problems also store:

| Field | Meaning |
|---|---|
| `sourceKey` | Canonical LeetCode slug |
| `sourceRank` | Stable position in the source list |
| `frequency` | Reported source frequency |

I use frequency to pick what to practice, not as a prediction of what an interviewer will ask. I keep both rank and frequency because tied problems still need a stable order; ties keep their CSV row order. Source-backed entries are sorted by `sourceRank`, while manual and OA-specific entries still work normally.

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

With `--file`, I need to supply the CSV from the pinned snapshot myself. The tracker checks its format, not where it came from. Normal `--check` stays offline, so it doesn’t compare saved ranks and frequencies with upstream either.

The dependency-free CSV parser supports quoted values, commas inside quotes, escaped quotes, LF and CRLF line endings, and empty fields. Completely empty records are ignored.

| Source column | Used for |
|---|---|
| `Difficulty` | Platform difficulty |
| `Title` | Problem title |
| `Frequency` | Source ranking value |
| `Link` | Canonical problem URL |
| `Topics` | Optional source metadata |
| `Acceptance Rate` | Currently ignored |

## Complexity conventions

I write the notes for the code that’s actually in the repo, using the problem’s constraints. Each entry explains its variables in the complexity fields or company notes.

Unless an entry says otherwise:

- Time bounds assume expected `O(1)` dictionary/set lookups. They aren’t worst-case guarantees against hash collisions. List append/pop costs are amortized because resizing can take longer.
- I treat arithmetic on problem-sized integers as constant-time and count stored values or references, not individual bits. Strings still cost time and space to build or copy.
- Input storage doesn’t count as extra space. I call out returned output separately where useful, and include Python’s sorting workspace: `list.sort()` can still need `O(n)` extra space.
- A fixed alphabet can make character storage `O(1)`. Where useful, I also give the bound for a growing alphabet.
- I don’t rely on interpreter shortcuts for repeated string concatenation. That’s why `#271` has a quadratic worst-case encoding bound and Roblox `#68` has `O(nw)` time, where `n` counts output characters and `w` is the line width.
- For string output, I count characters too, not just list entries. IBM `#412`, for example, returns `O(n d)` characters for `n` entries and maximum decimal length `d`.

The individual entries explain these costs in more detail.

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
