# HARNESS-2 evidence: create-pr skill follows the gates

Verified revision: `69ebd2ce55e2ae85c0aae449a8326eee83a019c8` (branch HARNESS-2-create-pr-trace). Run 2026-11-23 on Windows 11, Node v24.18.0.

## Gate unit tests
```text
$ node --test "ci/*.test.mjs"   (last 8 lines shown)
ℹ tests 15
ℹ suites 0
ℹ pass 15
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 930.4152
exit 0
```

## Manifests parse, versions
```text
marketplace 1.6.1
ok team-core 1.6.1
ok kotlin-service 1.6.1
ok node-service 1.6.1
ok web 1.6.1
exit 0
```

## Every skill has description and review-by
```text
ok plugins/kotlin-service/skills/kotlin-conventions/SKILL.md
ok plugins/node-service/skills/node-conventions/SKILL.md
ok plugins/team-core/skills/api-errors/SKILL.md
ok plugins/team-core/skills/create-pr/SKILL.md
ok plugins/team-core/skills/handoff/SKILL.md
ok plugins/web/skills/web-conventions/SKILL.md
exit 0
```

## Trace gate on this branch (before the evidence commit, expected to fail rule 3 only)
```text
key HARNESS-2 (from the PR title)
1 commit(s), 1 with Assisted-by
::error::no commit carries an Evidence: trailer (e.g. Evidence: docs/evidence/<KEY>/<slice>.md)
trace gate: FAIL (1 error(s))
exit 1
```

## Diff size
```text
38 changed line(s) in 7 file(s); 0 file(s) excluded; warn > 200, fail > 400
     25  plugins/team-core/skills/create-pr/SKILL.md
      3  CHANGELOG.md
      2  .claude-plugin/marketplace.json
      2  plugins/kotlin-service/.claude-plugin/plugin.json
      2  plugins/node-service/.claude-plugin/plugin.json
      2  plugins/team-core/.claude-plugin/plugin.json
      2  plugins/web/.claude-plugin/plugin.json
diff-size gate: OK
exit 0
```

Not verified: the skill was not run by an agent end to end in this PR; the migration PRs in 2026-spd-shop-pricing are its first real use.
