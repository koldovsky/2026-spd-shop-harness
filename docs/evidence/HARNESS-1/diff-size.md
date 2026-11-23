# Evidence — HARNESS-1 diff-size gate

- Revision: `5c42e580230d28a8d9f12a3b12f3b3d3479625f2` (the commands below ran on this commit)
- Branch: `HARNESS-1-diff-size`
- Ran: 2026-11-23T17:27Z · Node v24.18.0 · git version 2.55.0.windows.2 · MINGW64
- Who ran it: Claude Code (claude-opus-5-5), driven by the workshop author

The trace-gate run is expected to fail only because this file does not exist yet at the revision it ran on.

## `node --test "ci/*.test.mjs"`

```text
warning: in the working copy of 'a.txt', LF will be replaced by CRLF the next time Git touches it
warning: in the working copy of 'a.txt', LF will be replaced by CRLF the next time Git touches it
warning: in the working copy of '.gitattributes', LF will be replaced by CRLF the next time Git touches it
warning: in the working copy of 'api.gen.ts', LF will be replaced by CRLF the next time Git touches it
✔ globs: bare names match anywhere, ** crosses folders, * does not (0.6737ms)
✔ numstat -z: plain, binary and renamed files (0.4957ms)
✔ ok at the limit, warn above warn, fail above fail (0.8143ms)
✔ lockfiles, generated files, evidence and caller excludes do not count (0.1592ms)
✔ thresholds are inputs (0.146ms)
✔ end to end on a real git repo, with linguist-generated from .gitattributes (427.483ms)
warning: in the working copy of 'a.txt', LF will be replaced by CRLF the next time Git touches it
warning: in the working copy of 'a.txt', LF will be replaced by CRLF the next time Git touches it
warning: in the working copy of 'a.txt', LF will be replaced by CRLF the next time Git touches it
warning: in the working copy of 'docs/evidence/TASK-7/change.md', LF will be replaced by CRLF the next time Git touches it
✔ findKey takes the first key and ignores look-alikes (0.6663ms)
✔ passes: key, Refs on every commit, evidence names the last code commit (0.6563ms)
✔ fails: no key in the title, commits without Refs, no Evidence trailer (0.1471ms)
✔ fails: Refs names another key (0.1149ms)
✔ merge commits need no Refs (0.1089ms)
✔ fails: evidence file missing at head (0.0812ms)
✔ fails: evidence names no commit of the PR, or code changed after the named commit (0.1495ms)
✔ warns when the title does not start with the key or the branch lacks it (0.0931ms)
✔ end to end on a real git repo: red without evidence, green after the evidence commit (779.5098ms)
ℹ tests 15
ℹ suites 0
ℹ pass 15
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 858.4754
```

Exit code: 0

## `node ci/diff-size.mjs --base origin/main --head HEAD`

```text
283 changed line(s) in 13 file(s); 0 file(s) excluded; warn > 200, fail > 400
    108  ci/diff-size.mjs
     68  ci/diff-size.test.mjs
     49  .github/workflows/diff-size.yml
     29  docs/gates.md
      6  CHANGELOG.md
      5  templates/pr-gates.yml
      4  .github/workflows/pr-gates.yml
      4  README.md
      2  .claude-plugin/marketplace.json
      2  plugins/kotlin-service/.claude-plugin/plugin.json
::warning::283 changed lines is above 200: consider splitting
diff-size gate: OK
```

Exit code: 0

## `node ci/diff-size.mjs --base origin/main --head HEAD --warn 50 --fail 100`

```text
283 changed line(s) in 13 file(s); 0 file(s) excluded; warn > 50, fail > 100
    108  ci/diff-size.mjs
     68  ci/diff-size.test.mjs
     49  .github/workflows/diff-size.yml
     29  docs/gates.md
      6  CHANGELOG.md
      5  templates/pr-gates.yml
      4  .github/workflows/pr-gates.yml
      4  README.md
      2  .claude-plugin/marketplace.json
      2  plugins/kotlin-service/.claude-plugin/plugin.json
::error::283 changed lines is above the limit of 100: split the PR by concern (one purpose per PR)
diff-size gate: FAIL (1 error(s))
```

Exit code: 1

## `node ci/trace-gate.mjs --base origin/main --head HEAD --title "HARNESS-1 Diff-size gate" --branch HARNESS-1-diff-size`

```text
key HARNESS-1 (from the PR title)
1 commit(s), 1 with Assisted-by
::error::evidence file docs/evidence/HARNESS-1/diff-size.md (from 5c42e58) does not exist at head
trace gate: FAIL (1 error(s))
```

Exit code: 1

