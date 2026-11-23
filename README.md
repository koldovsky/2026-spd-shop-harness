# 2026-spd-shop-harness

The shared agent harness for the Shop demo repos, published as a **Claude Code plugin marketplace**.
Used in the SPD «Team AI Engineering» workshop, Session 1, Demo 2.

| Plugin | What it carries |
|---|---|
| `team-core` | skills `create-pr`, `handoff`, `api-errors` (v1.5.0+), the `reviewer` subagent, the `protect-paths` hook |
| `kotlin-service` | Kotlin + Spring Boot conventions (skill) |
| `node-service` | TypeScript/Express conventions (skill) |
| `web` | Next.js app and BFF conventions (skill) |

A plugin can't ship `.claude/rules` or an `AGENTS.md`. Always-on rules stay in each repo's short `AGENTS.md`;
shared conventions travel as skills, which load when their description matches the task.

## Use it in a repo

Commit this to the repo's `.claude/settings.json`, pinned to a tag:

```json
{
  "extraKnownMarketplaces": {
    "shop-harness": { "source": { "source": "github", "repo": "koldovsky/2026-spd-shop-harness", "ref": "v1.6.0" } }
  },
  "enabledPlugins": { "team-core@shop-harness": true, "kotlin-service@shop-harness": true }
}
```

Each person, once, after trusting the folder:

```bash
claude plugin install team-core@shop-harness --scope project
```

A repo can ask, not force: enabled is not installed until each person installs.

## Change process

- Changes by PR only; `.github/CODEOWNERS` names the owners. Every skill, agent and script carries `owner`, `why`, `review-by`.
- Release = a tag `vX.Y.Z` plus a `CHANGELOG.md` entry. Service repos move by a bump PR.
- PR gates (v1.6.0+): trace gate and diff-size gate, reusable workflows for service repos. Copy
  `templates/pr-gates.yml` to `.github/workflows/`; rules and thresholds in [docs/gates.md](docs/gates.md).
- `ci/drift-check.mjs` runs in each service repo (reusable workflow `.github/workflows/drift-check.yml`): pinned ref vs latest tag, shadow copies of shared skills, rules past `review-by`.
