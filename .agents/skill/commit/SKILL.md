---
name: commit
description: Review, stage, validate, and commit repository changes with the required LeetCode, company, general-change, and Dependabot squash conventions.
---

# Commit changes

Use this skill when the user explicitly asks to commit, prepare a commit, or squash-merge a Dependabot pull request. Follow `AGENTS.md` and `CONTRIBUTING.md` first.

## Safety rules

- Never commit without an explicit request.
- Never discard, rewrite, or include unrelated user changes.
- Never use `git add .`, `git add -A`, `git commit -a`, `git reset --hard`, or a force push.
- Do not amend or rebase existing commits unless explicitly requested.
- Stop and ask when changes cannot form one coherent commit, when multiple problem IDs are present, or when the intended files are ambiguous.
- A failed or unavailable check must be reported, not called successful.

## Prepare the commit

1. Inspect all repository state:

   ```bash
   git status --short
   git diff --stat
   git diff
   git diff --cached --stat
   git diff --cached
   ```

2. Include untracked files in the review. Read their contents directly; remember that `git diff` and `git diff --check` omit untracked files.
3. Classify the change from its paths and content, not merely from the user's suggested title:
   - roadmap solution: `neetcode-all/<topic-slug>/<id>.py` plus `data/roadmap.json` and generated roadmap documentation;
   - company solution: `companies/<slug>/solutions/<id>.py` plus tracker metadata and generated documentation;
   - company source refresh: provenance, rank, or frequency updates without a newly solved implementation;
   - docs, CI, tooling, fixes, or maintenance: any other coherent diff.
4. Confirm generated documentation is current and ensure no cache, bytecode, secret, editor, temporary, or unrelated file will be staged.
5. Run the complete validation block from `AGENTS.md` and any focused tests appropriate to the diff.

## Choose the subject

Use exactly these formats for one solved problem:

- NeetCode All: `solve leetcode #<id>`
- Company workspace: `solve leetcode #<id> @ <company-slug>`

The company slug must match the folder under `companies/` exactly. For example:

```text
solve leetcode #767 @ roblox
```

For a company source refresh or source-data-only update, use an imperative data subject such as `Refresh company problem source snapshot`. Do not use a `solve leetcode #...` subject unless the commit actually adds a solved solution.

For documentation, CI, tooling, review fixes, or general maintenance, derive a concise imperative subject from the final diff. Prefer a specific description such as `Document agent workflows and commit conventions` or `Validate generated company dashboards in CI`. Keep the subject focused and normally at most 72 characters. Do not add issue-closing text unless requested.

If a diff mixes a solution with unrelated maintenance, do not invent one broad subject; ask to split it or commit only the explicitly requested scope.

## Stage and verify

1. Stage only explicit, reviewed paths with `git add -- <path>...`.
2. Re-run:

   ```bash
   git status --short
   git diff --cached --stat
   git diff --cached --check
   git diff --cached
   ```

3. Verify that the staged diff is complete and contains nothing unrelated. If staging changed the scope, recalculate the subject.
4. Create one commit:

   ```bash
   git commit -m "<subject>"
   ```

5. Verify the result:

   ```bash
   git show --stat --oneline --decorate HEAD
   git status --short
   ```

Report the commit hash, subject, checks run, and any remaining unstaged or untracked changes. Do not push unless explicitly requested.

## Squash a Dependabot pull request

The goal is one dependency-update commit on the base branch, never both a Dependabot commit and a separate `Merge pull request #<number>` commit. This repository is configured on GitHub to allow squash merges only; do not re-enable merge commits or rebase merges.

1. Require the PR number and a clean working tree. Do not hide local work to perform the merge.
2. Inspect the PR before merging:

   ```bash
   gh pr view <number> --json author,baseRefName,headRefName,title,commits,mergeStateStatus,statusCheckRollup
   ```

3. Confirm the author is Dependabot, the changed files are only the expected dependency update, required checks pass, and the PR is mergeable.
4. Use the Dependabot update subject. For a normal one-commit Dependabot PR, use that commit's subject (typically `Bump <dependency> from <old> to <new>`). Do not create a local preparatory commit and do not use a local merge commit.
5. Squash through GitHub so the base branch receives exactly one commit:

   ```bash
   gh pr merge <number> --squash --delete-branch --subject "<Dependabot update subject>" --body ""
   ```

6. Update the local base branch without creating a merge commit:

   ```bash
   git switch <base-branch>
   git pull --ff-only
   git log -3 --oneline
   ```

7. Verify there is one new dependency-update commit and no additional `Merge pull request #<number>` commit. Also verify the repository still has `allow_squash_merge=true`, `allow_merge_commit=false`, and `allow_rebase_merge=false`. If repository rules, a merge queue, conflicts, or a dirty tree prevent this flow, stop and explain instead of choosing another merge strategy silently.
