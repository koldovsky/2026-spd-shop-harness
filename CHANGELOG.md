# Changelog

## 1.6.1 — 2026-11-23
- team-core: `create-pr` follows the 1.6.0 gates: requirement key, `Refs:`/`Assisted-by:` trailers, an evidence file that names the verified head SHA, and no `Reviewed-by:` for a review that did not happen (HARNESS-2).

## 1.6.0 — 2026-11-23
- PR gates (HARNESS-1), rules in `docs/gates.md`:
  - **trace gate** `ci/trace-gate.mjs`: key in the PR title, `Refs:` on every commit, an evidence file that names the verified head revision;
  - **diff-size gate** `ci/diff-size.mjs`: warn above 200, fail above 400 changed lines, without lockfiles, generated files and evidence.
- Reusable workflows `trace-gate.yml` and `diff-size.yml` (`workflow_call`), caller template `templates/pr-gates.yml`; the harness gates its own PRs.
- team-core: `protect-paths` creates `.claude/hooks/` for its log, so the log appears in a fresh clone.

## 1.5.0 — 2026-11-19
- team-core: new `api-errors` skill. Replaces the drifted per-repo copies of the API error rule in shop-orders, shop-web and shop-pricing.

## 1.4.0 — 2026-11-12
- team-core: `create-pr`, `handoff`, `reviewer`, `protect-paths` hook.
- Stack plugins: `kotlin-service`, `node-service`, `web`.
