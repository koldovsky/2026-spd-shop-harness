---
name: create-pr
description: Open a pull request for the current branch the team way (title, template, evidence, size check). Use when the user asks to open, create or prepare a PR.
---
<!-- owner: @koldovsky · why: PRs arrived without evidence and too big to review · review-by: 2027-02-19 -->
# Create a PR

1. `git diff --stat origin/main...HEAD`. Over 400 changed lines → stop and propose a split by concern.
2. Run the repo's test command from `AGENTS.md`. Red → fix first; never open a PR on red.
3. Title: `SHOP-<n>: <imperative summary>` (ask for the ticket if you don't know it).
4. Body: fill the repo's `.github/pull_request_template.md`. Evidence = the exact test command and its summary line.
5. Ask before `git push` (it is an `ask` rule), then `gh pr create --fill-first` with the body from step 4.
6. Return the PR URL and the size from step 1.
