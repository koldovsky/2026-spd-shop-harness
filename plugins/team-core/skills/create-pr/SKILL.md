---
name: create-pr
description: Open a pull request for the current branch the team way (key, trailers, evidence file, size check), so it passes the trace and diff-size gates. Use when the user asks to open, create or prepare a PR.
---
<!-- owner: @koldovsky · why: PRs arrived without evidence and too big to review; since 1.6.0 the gates reject them · review-by: 2027-02-26 -->
# Create a PR

The rules are the harness gates in `docs/gates.md` of `2026-spd-shop-harness`. Follow them exactly; the gate is the judge.

1. **Key.** Find the requirement key (e.g. `PRICE-42`) in the branch name or the ticket. Unknown → ask; never invent one.
2. **Size.** `git diff --stat origin/main...HEAD`. Over 400 changed lines (lockfiles, generated files and `docs/evidence/**` don't count) → stop and propose a split by concern.
3. **Trailers.** Every commit on the branch ends with a trailer paragraph:
   ```text
   Refs: PRICE-42
   Assisted-by: Claude Code (<model id>)
   ```
   A commit without `Refs:` fails the gate. If an existing commit lacks it, tell the user: rewriting history needs their consent.
4. **Checks.** Run the repo's test command from `AGENTS.md` on the current head. Red → fix first; never open a PR on red.
5. **Evidence.** Write `docs/evidence/<KEY>/<slice>.md` with: the head SHA the checks ran on, each command, its exit code, and the relevant output lines (not a summary). Commit only that file, with `Refs: <KEY>` and `Evidence: docs/evidence/<KEY>/<slice>.md`. Any later code commit makes it stale: re-run and re-write.
6. **Title and body.** Title: `<KEY> <imperative summary>`. Body: fill `.github/pull_request_template.md` (requirement link, scope, what was verified at which SHA, known gaps, rollback, agent involvement, accountable person).
7. Ask before `git push` (it is an `ask` rule), then `gh pr create --title ... --body-file ...`.
8. Return the PR URL, the counted size from step 2, and the gate results once Actions finish (`gh pr checks`). Never write `Reviewed-by:` for a review that did not happen.
