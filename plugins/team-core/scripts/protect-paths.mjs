#!/usr/bin/env node
// PreToolUse hook (Edit|Write) shipped by team-core.
// Blocks changes to existing files under the repo's protected paths. A repo lists them in
// .claude/protected-paths.json: { "immutable": ["src/main/resources/db/migration/", "db/migrations/"] }.
// Without that file the defaults below apply. New files are allowed.
// owner: @koldovsky · why: applied migrations were edited by agents · review-by: 2027-02-19
import { appendFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const DEFAULTS = ["src/main/resources/db/migration/", "db/migrations/", "migrations/"];
const input = JSON.parse(readFileSync(0, "utf8") || "{}");
const projectDir = process.env.CLAUDE_PROJECT_DIR || input.cwd || process.cwd();
const filePath = input.tool_input?.file_path;
if (!filePath) process.exit(0);

let immutable = DEFAULTS;
const cfg = join(projectDir, ".claude/protected-paths.json");
if (existsSync(cfg)) {
  try { immutable = JSON.parse(readFileSync(cfg, "utf8")).immutable ?? DEFAULTS; } catch {}
}

const abs = resolve(projectDir, filePath);
const rel = relative(projectDir, abs).split("\\").join("/");
const hit = immutable.find((p) => rel.startsWith(p));
if (hit && existsSync(abs)) {
  try { mkdirSync(join(projectDir, ".claude/hooks"), { recursive: true }); appendFileSync(join(projectDir, ".claude/hooks/protect-paths.log"), `${new Date().toISOString()} BLOCK ${input.tool_name} ${rel}\n`); } catch {}
  process.stderr.write(`Blocked by team-core protect-paths: ${rel} is under ${hit}, which is immutable. Add a new file instead.\n`);
  process.exit(2);
}
process.exit(0);
