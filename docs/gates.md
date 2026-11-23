<!-- owner: @koldovsky · why: one place for the exact gate rules that service repos and reviewers rely on · review-by: 2027-02-26 -->
# PR gates

Deterministic checks that run on every pull request before a human reviews it. They don't judge the code; they
reject a PR that can't be traced. Scripts are dependency-free Node (24+), tested with `node --test "ci/*.test.mjs"`.

## Trace gate — `ci/trace-gate.mjs`

The PR **fails** when any of these is true:

1. **No key in the PR title.** The key is the first match of `key-pattern` (default `[A-Z][A-Z0-9]+-[0-9]+`,
   e.g. `PRICE-42`) in the title.
2. **A commit without `Refs:`.** Every non-merge commit in `base..head` needs a `Refs:` trailer that includes the
   PR key. Trailers are read with git's own parser, so they must sit in the last paragraph of the message.
3. **No evidence for the head.** The newest commit that carries an `Evidence:` trailer names one or more files.
   Each must exist at the head. At least one must name a **verified revision**: a commit of this PR, written as a
   full SHA or a prefix of at least 7 hex characters, after which only evidence files changed (files under
   `evidence-dir`, default `docs/evidence/`, or the files named in that trailer).

An evidence file can't contain the SHA of the commit that adds it. So the order is: commit the code, run the
checks on that commit, write the evidence with that SHA, commit the evidence. Any later code commit makes the
evidence stale and the gate red again.

It **warns** (does not fail) when the title doesn't start with the key or the branch name doesn't contain it.
`Assisted-by:` is counted and reported, not required: human-only commits omit it.

Commit trailers (one line each, last paragraph):

```text
Refs: PRICE-42
Assisted-by: Claude Code (claude-opus-5-5)
Evidence: docs/evidence/PRICE-42/kotlin-skeleton.md
```

With git 2.32 or newer: `git commit -m "Add the Kotlin skeleton" --trailer "Refs: PRICE-42" --trailer "Evidence: docs/evidence/PRICE-42/kotlin-skeleton.md"`

Run it locally before pushing (from the service repo root, with the harness checked out next to it):

```bash
node ../2026-spd-shop-harness/ci/trace-gate.mjs --base origin/main --head HEAD --title "PRICE-42 Kotlin skeleton" --branch PRICE-42-kotlin-skeleton
```

Exit code 0 = pass, 1 = rule failed, 2 = no PR context (missing `--base` or `--title`).

## Using the gates in a service repo

Copy [`templates/pr-gates.yml`](../templates/pr-gates.yml) to `.github/workflows/pr-gates.yml`. It calls the
reusable workflows pinned to a tag. The `edited` trigger re-runs the gate when someone fixes the PR title.

| Reusable workflow | Inputs (defaults) |
|---|---|
| `.github/workflows/trace-gate.yml` | `key-pattern` (`[A-Z][A-Z0-9]+-[0-9]+`), `evidence-dir` (`docs/evidence/`), `harness-ref` (the tag the file ships in) |

`harness-ref` selects the version of the script. Its default equals the release tag, so `@v1.6.0` runs the
v1.6.0 scripts. The harness's own `pr-gates.yml` passes the PR head SHA instead, so a harness PR is checked by
the scripts it changes.

The gates are not required checks until a repo admin adds them to branch protection; a red gate is a signal,
not a block, until then.
