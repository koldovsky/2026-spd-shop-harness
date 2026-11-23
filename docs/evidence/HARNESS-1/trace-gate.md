# Evidence — HARNESS-1 trace gate

- Revision: `43d25655f904f02b46234b01f4f3f2e3a4b23577` (the commands below ran on this commit)
- Branch: `HARNESS-1-trace-gate`
- Ran: 2026-11-23T17:26Z · Node v24.18.0 · git version 2.55.0.windows.2 · MINGW64
- Who ran it: Claude Code (claude-opus-5-5), driven by the workshop author

The trace-gate runs below are expected to fail: this file does not exist yet at the revision they ran on, and the second run has no key in the title.

## `node --test "ci/*.test.mjs"`

```text
warning: in the working copy of 'a.txt', LF will be replaced by CRLF the next time Git touches it
warning: in the working copy of 'a.txt', LF will be replaced by CRLF the next time Git touches it
warning: in the working copy of 'a.txt', LF will be replaced by CRLF the next time Git touches it
warning: in the working copy of 'docs/evidence/TASK-7/change.md', LF will be replaced by CRLF the next time Git touches it
✔ findKey takes the first key and ignores look-alikes (0.5549ms)
✔ passes: key, Refs on every commit, evidence names the last code commit (0.5718ms)
✔ fails: no key in the title, commits without Refs, no Evidence trailer (0.1339ms)
✔ fails: Refs names another key (0.1055ms)
✔ merge commits need no Refs (0.0997ms)
✔ fails: evidence file missing at head (0.0791ms)
✔ fails: evidence names no commit of the PR, or code changed after the named commit (0.1379ms)
✔ warns when the title does not start with the key or the branch lacks it (0.0847ms)
✔ end to end on a real git repo: red without evidence, green after the evidence commit (755.2215ms)
ℹ tests 9
ℹ suites 0
ℹ pass 9
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 823.5991
```

Exit code: 0

## `node ci/trace-gate.mjs --base origin/main --head HEAD --title "HARNESS-1 Trace gate" --branch HARNESS-1-trace-gate`

```text
key HARNESS-1 (from the PR title)
1 commit(s), 1 with Assisted-by
::error::evidence file docs/evidence/HARNESS-1/trace-gate.md (from 43d2565) does not exist at head
trace gate: FAIL (1 error(s))
```

Exit code: 1

## `node ci/trace-gate.mjs --base origin/main --head HEAD --title "Trace gate"`

```text
1 commit(s), 1 with Assisted-by
::error::PR title has no requirement key matching /[A-Z][A-Z0-9]+-[0-9]+/: "Trace gate"
::error::evidence file docs/evidence/HARNESS-1/trace-gate.md (from 43d2565) does not exist at head
trace gate: FAIL (2 error(s))
```

Exit code: 1

