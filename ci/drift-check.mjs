#!/usr/bin/env node
// Drift check for a service repo that consumes shop-harness. Run from the service repo root.
// 1. pinned ref of the shop-harness marketplace vs the latest harness tag (warning: behind)
// 2. shadow copies: a local .claude/skills/<name> or .claude/rules/<name>.md that shadows a team-core skill (error)
// 3. rules and skills past their review-by date (error)
// Usage: node drift-check.mjs --harness <path-to-shop-harness-checkout>
// owner: @koldovsky · why: per-repo copies drifted silently · review-by: 2027-02-19
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";

const args = process.argv.slice(2);
const harness = args[args.indexOf("--harness") + 1];
const repo = process.cwd();
let errors = 0;
const err = (m) => { errors++; console.log(`::error::${m}`); };
const warn = (m) => console.log(`::warning::${m}`);

// 1. pinned ref
const settingsPath = join(repo, ".claude/settings.json");
const settings = existsSync(settingsPath) ? JSON.parse(readFileSync(settingsPath, "utf8")) : {};
const pinned = settings.extraKnownMarketplaces?.["shop-harness"]?.source?.ref;
const tags = execFileSync("git", ["-C", harness, "tag", "--list", "v*", "--sort=-v:refname"], { encoding: "utf8" }).trim().split("\n").filter(Boolean);
if (!pinned) err("shop-harness is not pinned to a ref in .claude/settings.json");
else if (tags[0] && pinned !== tags[0]) warn(`shop-harness pinned to ${pinned}, latest is ${tags[0]} — open a bump PR`);
else console.log(`harness ref ${pinned} is current`);

// 2. shadow copies of shared skills
const shared = new Set();
const pluginsDir = join(harness, "plugins");
for (const p of readdirSync(pluginsDir)) {
  const skills = join(pluginsDir, p, "skills");
  if (existsSync(skills)) for (const s of readdirSync(skills)) shared.add(s);
}
for (const kind of ["skills", "rules"]) {
  const dir = join(repo, ".claude", kind);
  if (!existsSync(dir)) continue;
  for (const entry of readdirSync(dir)) {
    const name = entry.replace(/\.md$/, "");
    if (shared.has(name)) err(`.claude/${kind}/${entry} shadows the shared skill "${name}" from shop-harness — delete the local copy`);
  }
}

// 3. review-by dates
const today = new Date().toISOString().slice(0, 10);
const walk = (d) => readdirSync(d).flatMap((e) => { const p = join(d, e); return statSync(p).isDirectory() ? walk(p) : [p]; });
for (const base of ["AGENTS.md", ".claude"]) {
  const p = join(repo, base);
  if (!existsSync(p)) continue;
  for (const f of statSync(p).isDirectory() ? walk(p) : [p]) {
    if (!/\.(md|mjs|js|json)$/.test(f)) continue;
    const m = readFileSync(f, "utf8").match(/review-by:\s*(\d{4}-\d{2}-\d{2})/);
    if (m && m[1] < today) err(`${f.slice(repo.length + 1)} passed its review-by date ${m[1]}`);
  }
}

console.log(errors ? `drift check: ${errors} error(s)` : "drift check: OK");
process.exit(errors ? 1 : 0);
