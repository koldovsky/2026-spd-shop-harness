// owner: @koldovsky · why: the gate decides merges, its rules need their own proof · review-by: 2027-02-26
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { evaluate, findKey, gitAccess, readCommits } from "./trace-gate.mjs";

const A = "a".repeat(40), B = "b".repeat(40), C = "c".repeat(40);
const commit = (sha, extra = {}) => ({ sha, subject: `commit ${sha[0]}`, merge: false, refs: ["PRICE-42"], evidence: [], ...extra });
const fakeGit = (files = {}, changedAfter = {}) => ({ fileAt: (p) => files[p] ?? null, changedFiles: (sha) => changedAfter[sha] ?? [] });
const ev = "docs/evidence/PRICE-42/slice-1.md";

test("findKey takes the first key and ignores look-alikes", () => {
  assert.equal(findKey("PRICE-42: Kotlin skeleton"), "PRICE-42");
  assert.equal(findKey("[TASK-7] whole-hour estimates"), "TASK-7");
  assert.equal(findKey("Add gates"), null);
  assert.equal(findKey("utf-8 and SHA-256 are not keys"), "SHA-256"); // pattern matches; narrow it per repo
  assert.equal(findKey("SHA-256", "PRICE-[0-9]+"), null);
});

test("passes: key, Refs on every commit, evidence names the last code commit", () => {
  const commits = [commit(A), commit(B, { evidence: [ev] })];
  const r = evaluate({ title: "PRICE-42 Kotlin skeleton", branch: "PRICE-42-kotlin-skeleton", commits },
    fakeGit({ [ev]: `Revision: ${A.slice(0, 12)}\n` }, { [A]: [ev] }));
  assert.deepEqual(r.errors, []);
  assert.deepEqual(r.warnings, []);
  assert.equal(r.key, "PRICE-42");
});

test("fails: no key in the title, commits without Refs, no Evidence trailer", () => {
  const r = evaluate({ title: "Add PR gates", commits: [commit(A, { refs: [] })] }, fakeGit());
  assert.match(r.errors[0], /no requirement key/);
  assert.match(r.errors[1], /has no Refs: trailer/);
  assert.match(r.errors[2], /no commit carries an Evidence: trailer/);
});

test("fails: Refs names another key", () => {
  const r = evaluate({ title: "PRICE-42 x", commits: [commit(A, { refs: ["PRICE-41"], evidence: [ev] })] }, fakeGit({ [ev]: A }));
  assert.equal(r.errors.length, 1);
  assert.match(r.errors[0], /Refs: PRICE-41 but not PRICE-42/);
});

test("merge commits need no Refs", () => {
  const commits = [commit(A, { evidence: [ev] }), commit(B, { merge: true, refs: [] })];
  const r = evaluate({ title: "PRICE-42 x", commits }, fakeGit({ [ev]: A }, { [A]: [] }));
  assert.deepEqual(r.errors, []);
});

test("fails: evidence file missing at head", () => {
  const r = evaluate({ title: "PRICE-42 x", commits: [commit(A, { evidence: [ev] })] }, fakeGit());
  assert.match(r.errors[0], /does not exist at head/);
});

test("fails: evidence names no commit of the PR, or code changed after the named commit", () => {
  const none = evaluate({ title: "PRICE-42 x", commits: [commit(A, { evidence: [ev] })] }, fakeGit({ [ev]: "all tests green" }));
  assert.match(none.errors[0], /names no commit of this PR/);
  const commits = [commit(A), commit(B), commit(C, { evidence: [ev] })];
  const stale = evaluate({ title: "PRICE-42 x", commits }, fakeGit({ [ev]: `ran on ${A.slice(0, 7)}` }, { [A]: ["src/price.ts", ev] }));
  assert.match(stale.errors[0], /names aaaaaaa, but code changed after it: src\/price.ts/);
});

test("warns when the title does not start with the key or the branch lacks it", () => {
  const r = evaluate({ title: "Fix rounding (PRICE-42)", branch: "fix-rounding", commits: [commit(A, { evidence: [ev] })] }, fakeGit({ [ev]: A }));
  assert.deepEqual(r.errors, []);
  assert.equal(r.warnings.length, 2);
});

test("end to end on a real git repo: red without evidence, green after the evidence commit", () => {
  const dir = mkdtempSync(join(tmpdir(), "trace-gate-"));
  const g = (...args) => execFileSync("git", ["-C", dir, ...args], { encoding: "utf8" }).trim();
  g("init", "-q", "-b", "main");
  g("config", "user.email", "gate@example.test"); g("config", "user.name", "Gate Test"); g("config", "commit.gpgsign", "false");
  writeFileSync(join(dir, "a.txt"), "1\n"); g("add", "."); g("commit", "-qm", "start");
  const base = g("rev-parse", "HEAD");
  writeFileSync(join(dir, "a.txt"), "2\n"); g("add", ".");
  g("commit", "-qm", "Change a", "-m", "Refs: TASK-7\nAssisted-by: Claude Code (test)");
  const code = g("rev-parse", "HEAD");
  const run = (title) => evaluate({ title, commits: readCommits(base, "HEAD", dir) }, gitAccess(g("rev-parse", "HEAD"), dir));
  assert.match(run("TASK-7 change a").errors.join("\n"), /no commit carries an Evidence/);
  mkdirSync(join(dir, "docs/evidence/TASK-7"), { recursive: true });
  writeFileSync(join(dir, "docs/evidence/TASK-7/change.md"), `Revision: ${code}\n$ npm test\nexit 0\n`); g("add", ".");
  g("commit", "-qm", "Evidence for TASK-7", "-m", "Refs: TASK-7\nEvidence: docs/evidence/TASK-7/change.md");
  const ok = run("TASK-7 change a");
  assert.deepEqual(ok.errors, []);
  assert.equal(readCommits(base, "HEAD", dir)[0].assisted[0], "Claude Code (test)");
  assert.match(run("change a").errors[0], /no requirement key/);
});
