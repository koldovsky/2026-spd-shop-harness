#!/usr/bin/env node
// Trace gate for a pull request. Rules (docs/gates.md):
// 1. the PR title contains a requirement key (default pattern [A-Z][A-Z0-9]+-[0-9]+)
// 2. every non-merge commit in base..head has a `Refs:` trailer that includes that key
// 3. the newest commit with an `Evidence:` trailer names files that exist at head, and one of them names
//    a verified revision: a commit of the PR (7+ hex chars) after which only evidence files changed
// Usage: node trace-gate.mjs --base <sha> --head <sha> --title "<PR title>" [--branch <name>]
//        [--key-pattern <regex>] [--evidence-dir docs/evidence/]   (env: BASE_SHA, HEAD_SHA, PR_TITLE, ...)
// owner: @koldovsky · why: PRs arrived without a requirement or proof, review had to reconstruct both · review-by: 2027-02-26
import { execFileSync } from "node:child_process";
import { appendFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

export const DEFAULTS = { keyPattern: "[A-Z][A-Z0-9]+-[0-9]+", evidenceDir: "docs/evidence/" };

export function findKey(text, keyPattern = DEFAULTS.keyPattern) {
  const m = String(text ?? "").match(new RegExp(`(?<![A-Za-z0-9])(?:${keyPattern})(?![0-9])`));
  return m ? m[0] : null;
}

const list = (v) => String(v ?? "").split(/[,\s]+/).filter(Boolean);

/**
 * Pure rule evaluation. `commits` are oldest → newest: { sha, subject, merge, refs[], evidence[] }.
 * `git` gives { fileAt(path) → string|null, changedFiles(fromSha) → string[] (fromSha..head) }.
 */
export function evaluate({ title, branch, commits, keyPattern = DEFAULTS.keyPattern, evidenceDir = DEFAULTS.evidenceDir }, git) {
  const errors = [], warnings = [], notes = [];
  const key = findKey(title, keyPattern);
  if (!key) {
    errors.push(`PR title has no requirement key matching /${keyPattern}/: "${title ?? ""}"`);
  } else {
    notes.push(`key ${key} (from the PR title)`);
    if (!String(title).trimStart().replace(/^\[/, "").startsWith(key)) warnings.push(`PR title should start with ${key}`);
    if (branch && !branch.includes(key)) warnings.push(`branch "${branch}" does not contain ${key}`);
  }

  const own = commits.filter((c) => !c.merge);
  if (own.length === 0) errors.push("the PR has no commits of its own");
  for (const c of own) {
    const id = `${c.sha.slice(0, 7)} "${c.subject}"`;
    if (c.refs.length === 0) errors.push(`${id} has no Refs: trailer`);
    else if (key && !c.refs.includes(key)) errors.push(`${id} has Refs: ${c.refs.join(", ")} but not ${key}`);
  }
  const assisted = own.filter((c) => c.assisted?.length).length;
  notes.push(`${own.length} commit(s), ${assisted} with Assisted-by`);

  const withEvidence = [...own].reverse().find((c) => c.evidence.length);
  if (!withEvidence) {
    errors.push("no commit carries an Evidence: trailer (e.g. Evidence: docs/evidence/<KEY>/<slice>.md)");
    return { key, errors, warnings, notes };
  }
  const paths = withEvidence.evidence.map((p) => p.replace(/^\.\//, ""));
  const isEvidence = (f) => f.startsWith(evidenceDir) || paths.includes(f);
  const prShas = commits.map((c) => c.sha);
  const stale = [];
  let verified = null;
  for (const path of paths) {
    const text = git.fileAt(path);
    if (text == null) { errors.push(`evidence file ${path} (from ${withEvidence.sha.slice(0, 7)}) does not exist at head`); continue; }
    const named = [...new Set(text.match(/\b[0-9a-f]{7,40}\b/g) ?? [])];
    const candidates = named.map((t) => prShas.find((s) => s.startsWith(t))).filter(Boolean);
    if (candidates.length === 0) stale.push(`${path} names no commit of this PR (write the SHA the commands ran on)`);
    for (const sha of candidates) {
      const after = git.changedFiles(sha).filter((f) => !isEvidence(f));
      if (after.length === 0) { verified ??= { path, sha }; break; }
      stale.push(`${path} names ${sha.slice(0, 7)}, but code changed after it: ${after.slice(0, 5).join(", ")}`);
    }
  }
  if (verified) notes.push(`evidence ${verified.path} names ${verified.sha.slice(0, 7)}; only evidence files changed after it`);
  else errors.push(...stale);
  return { key, errors, warnings, notes };
}

// ---- git and CLI wrappers ----
const git = (args, cwd) => execFileSync("git", args, { cwd, encoding: "utf8", maxBuffer: 64 << 20, stdio: "pipe" });

export function readCommits(base, head, cwd) {
  const fmt = "%H%x1f%P%x1f%s%x1f%(trailers:key=Refs,valueonly,separator=%x2C)%x1f%(trailers:key=Evidence,valueonly,separator=%x2C)%x1f%(trailers:key=Assisted-by,valueonly,separator=%x2C)%x1e";
  return git(["log", "--reverse", `--format=${fmt}`, `${base}..${head}`], cwd).split("\x1e").map((r) => r.trim()).filter(Boolean).map((r) => {
    const [sha, parents, subject, refs, evidence, assisted] = r.split("\x1f");
    return { sha, subject, merge: list(parents).length > 1, refs: list(refs), evidence: list(evidence), assisted: assisted.split(",").map((s) => s.trim()).filter(Boolean) };
  });
}

export function gitAccess(head, cwd) {
  return {
    fileAt: (path) => { try { return git(["show", `${head}:${path}`], cwd); } catch { return null; } },
    changedFiles: (from) => git(["diff", "--name-only", from, head], cwd).split("\n").filter(Boolean),
  };
}

function arg(name, env) {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : process.env[env] || undefined;
}

export function report({ errors, warnings, notes }, label) {
  for (const n of notes) console.log(n);
  for (const w of warnings) console.log(`::warning::${w}`);
  for (const e of errors) console.log(`::error::${e}`);
  const verdict = errors.length ? `FAIL (${errors.length} error(s))` : "OK";
  console.log(`${label}: ${verdict}`);
  if (process.env.GITHUB_STEP_SUMMARY) {
    const lines = [`### ${label}: ${verdict}`, ...errors.map((e) => `- ❌ ${e}`), ...warnings.map((w) => `- ⚠️ ${w}`), ...notes.map((n) => `- ${n}`)];
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, lines.join("\n") + "\n");
  }
  return errors.length ? 1 : 0;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const base = arg("base", "BASE_SHA"), head = arg("head", "HEAD_SHA") ?? "HEAD", title = arg("title", "PR_TITLE");
  if (!base || title === undefined) {
    console.log("::error::no PR context: pass --base <sha> --title \"<PR title>\" (and --head) or run on pull_request");
    process.exit(2);
  }
  const result = evaluate({
    title, branch: arg("branch", "PR_BRANCH"), commits: readCommits(base, head),
    keyPattern: arg("key-pattern", "KEY_PATTERN") ?? DEFAULTS.keyPattern,
    evidenceDir: arg("evidence-dir", "EVIDENCE_DIR") ?? DEFAULTS.evidenceDir,
  }, gitAccess(head));
  process.exit(report(result, "trace gate"));
}
