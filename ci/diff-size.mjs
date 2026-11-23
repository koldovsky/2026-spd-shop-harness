#!/usr/bin/env node
// Diff-size gate for a pull request (docs/gates.md). Changed lines = added + deleted in `git diff base...head`,
// without lockfiles, generated files (default list + .gitattributes linguist-generated) and --exclude globs.
// Warn above --warn (default 200), fail above --fail (default 400).
// Usage: node diff-size.mjs --base <sha> [--head <sha>] [--warn 200] [--fail 400] [--exclude "glob,glob"]
//        (env: BASE_SHA, HEAD_SHA, SIZE_WARN, SIZE_FAIL, SIZE_EXCLUDE)
// owner: @koldovsky · why: thousand-line agent PRs were approved unread · review-by: 2027-02-26
import { execFileSync } from "node:child_process";
import { appendFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

export const DEFAULT_EXCLUDES = [
  // lockfiles
  "package-lock.json", "npm-shrinkwrap.json", "pnpm-lock.yaml", "yarn.lock", "bun.lock", "bun.lockb", "go.sum",
  "Cargo.lock", "poetry.lock", "Pipfile.lock", "uv.lock", "Gemfile.lock", "composer.lock", "*.lockfile",
  // generated
  "gradlew", "gradlew.bat", "**/gradle/wrapper/**", "*.min.js", "*.min.css", "*.map", "**/generated/**",
  "*.generated.*", "*.pb.go", "**/__snapshots__/**",
  // evidence is raw command output, read on demand, not reviewed line by line
  "docs/evidence/**",
];

/** gitignore-like glob: no "/" → matches the file name anywhere; "**" crosses folders, "*" does not. */
export function globToRegExp(glob) {
  const g = glob.trim().replace(/^\.?\//, "");
  const body = g.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*\*\/|\*\*|\*|\?/g, (t) =>
    ({ "**/": "(?:.*/)?", "**": ".*", "*": "[^/]*", "?": "[^/]" })[t]);
  return new RegExp(g.includes("/") ? `^${body}$` : `(?:^|/)${body}$`);
}

/** Parses `git diff --numstat -z` output into [{ path, added, deleted, binary }]. Renames keep the new path. */
export function parseNumstat(z) {
  const parts = z.split("\0");
  const files = [];
  for (let i = 0; i < parts.length; i++) {
    const m = parts[i].match(/^(-|\d+)\t(-|\d+)\t(.*)$/s);
    if (!m) continue;
    let path = m[3];
    if (path === "") { path = parts[i + 2]; i += 2; } // rename: "A\tD\t" \0 old \0 new
    const binary = m[1] === "-";
    files.push({ path, added: binary ? 0 : +m[1], deleted: binary ? 0 : +m[2], binary });
  }
  return files;
}

/** Pure evaluation. `generated` is a Set of paths marked linguist-generated in .gitattributes. */
export function evaluate({ files, warn = 200, fail = 400, exclude = [], generated = new Set() }) {
  const patterns = [...DEFAULT_EXCLUDES, ...exclude].map((g) => [g, globToRegExp(g)]);
  const counted = [], excluded = [];
  for (const f of files) {
    const hit = generated.has(f.path) ? "linguist-generated" : patterns.find(([, re]) => re.test(f.path))?.[0];
    (hit ? excluded : counted).push({ ...f, lines: f.added + f.deleted, why: hit });
  }
  const total = counted.reduce((s, f) => s + f.lines, 0);
  const errors = [], warnings = [];
  const notes = [`${total} changed line(s) in ${counted.length} file(s); ${excluded.length} file(s) excluded; warn > ${warn}, fail > ${fail}`];
  if (total > fail) errors.push(`${total} changed lines is above the limit of ${fail}: split the PR by concern (one purpose per PR)`);
  else if (total > warn) warnings.push(`${total} changed lines is above ${warn}: consider splitting`);
  for (const f of [...counted].sort((a, b) => b.lines - a.lines).slice(0, 10)) notes.push(`  ${String(f.lines).padStart(5)}  ${f.path}${f.binary ? " (binary)" : ""}`);
  for (const f of excluded) notes.push(`  excl.  ${f.path} (${f.why})`);
  return { total, counted, excluded, errors, warnings, notes };
}

// ---- git and CLI wrappers ----
const git = (args, cwd, input) => execFileSync("git", args, { cwd, input, encoding: "utf8", maxBuffer: 64 << 20, stdio: "pipe" });

export function readFiles(base, head, cwd) {
  return parseNumstat(git(["diff", "--numstat", "-z", "-M", `${base}...${head}`], cwd));
}

/** Paths with linguist-generated set in the working tree's .gitattributes (check out the head first). */
export function readGenerated(paths, cwd) {
  if (paths.length === 0) return new Set();
  const out = git(["check-attr", "-z", "--stdin", "linguist-generated"], cwd, paths.join("\0") + "\0").split("\0");
  const set = new Set();
  for (let i = 0; i + 2 < out.length; i += 3) if (out[i + 2] === "set" || out[i + 2] === "true") set.add(out[i]);
  return set;
}

function arg(name, env) {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : process.env[env] || undefined;
}

function report({ errors, warnings, notes }, label) {
  for (const n of notes) console.log(n);
  for (const w of warnings) console.log(`::warning::${w}`);
  for (const e of errors) console.log(`::error::${e}`);
  const verdict = errors.length ? `FAIL (${errors.length} error(s))` : "OK";
  console.log(`${label}: ${verdict}`);
  if (process.env.GITHUB_STEP_SUMMARY) {
    const lines = [`### ${label}: ${verdict}`, ...errors.map((e) => `- ❌ ${e}`), ...warnings.map((w) => `- ⚠️ ${w}`), "```", ...notes, "```"];
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, lines.join("\n") + "\n");
  }
  return errors.length ? 1 : 0;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const base = arg("base", "BASE_SHA"), head = arg("head", "HEAD_SHA") ?? "HEAD";
  if (!base) { console.log("::error::no PR context: pass --base <sha> (and --head) or run on pull_request"); process.exit(2); }
  const files = readFiles(base, head);
  const result = evaluate({
    files, generated: readGenerated(files.map((f) => f.path)),
    warn: Number(arg("warn", "SIZE_WARN") ?? 200), fail: Number(arg("fail", "SIZE_FAIL") ?? 400),
    exclude: (arg("exclude", "SIZE_EXCLUDE") ?? "").split(/[,\n]/).map((s) => s.trim()).filter(Boolean),
  });
  process.exit(report(result, "diff-size gate"));
}
