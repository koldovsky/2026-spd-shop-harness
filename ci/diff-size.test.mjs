// owner: @koldovsky · why: the gate decides merges, its rules need their own proof · review-by: 2027-02-26
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { evaluate, globToRegExp, parseNumstat, readFiles, readGenerated } from "./diff-size.mjs";

const f = (path, added, deleted = 0) => ({ path, added, deleted, binary: false });

test("globs: bare names match anywhere, ** crosses folders, * does not", () => {
  assert.ok(globToRegExp("package-lock.json").test("web/package-lock.json"));
  assert.ok(globToRegExp("docs/evidence/**").test("docs/evidence/PRICE-42/a.md"));
  assert.ok(!globToRegExp("docs/evidence/**").test("src/docs/evidence/a.md"));
  assert.ok(globToRegExp("**/gradle/wrapper/**").test("kotlin/gradle/wrapper/gradle-wrapper.jar"));
  assert.ok(globToRegExp("parity/corpus/*.json").test("parity/corpus/a.json"));
  assert.ok(!globToRegExp("parity/corpus/*.json").test("parity/corpus/x/a.json"));
});

test("numstat -z: plain, binary and renamed files", () => {
  const z = "3\t1\tsrc/a.ts\0-\t-\tlogo.png\0" + "2\t2\t\0old/b.ts\0new/b.ts\0";
  assert.deepEqual(parseNumstat(z), [
    { path: "src/a.ts", added: 3, deleted: 1, binary: false },
    { path: "logo.png", added: 0, deleted: 0, binary: true },
    { path: "new/b.ts", added: 2, deleted: 2, binary: false },
  ]);
});

test("ok at the limit, warn above warn, fail above fail", () => {
  assert.deepEqual(evaluate({ files: [f("a.ts", 150, 50)] }).warnings, []);
  const w = evaluate({ files: [f("a.ts", 201)] });
  assert.equal(w.errors.length, 0);
  assert.equal(w.warnings.length, 1);
  assert.equal(evaluate({ files: [f("a.ts", 400)] }).errors.length, 0);
  const r = evaluate({ files: [f("a.ts", 300, 101)] });
  assert.equal(r.total, 401);
  assert.match(r.errors[0], /401 changed lines is above the limit of 400/);
});

test("lockfiles, generated files, evidence and caller excludes do not count", () => {
  const files = [f("src/a.ts", 10), f("package-lock.json", 5000), f("kotlin/gradlew", 250), f("docs/evidence/PRICE-42/s1.md", 900),
    f("parity/corpus/cases.json", 3000), f("src/schema.ts", 700)];
  const r = evaluate({ files, exclude: ["parity/corpus/**"], generated: new Set(["src/schema.ts"]) });
  assert.equal(r.total, 10);
  assert.equal(r.excluded.length, 5);
  assert.deepEqual(r.errors, []);
});

test("thresholds are inputs", () => {
  assert.equal(evaluate({ files: [f("a.ts", 120)], warn: 50, fail: 100 }).errors.length, 1);
});

test("end to end on a real git repo, with linguist-generated from .gitattributes", () => {
  const dir = mkdtempSync(join(tmpdir(), "diff-size-"));
  const g = (...args) => execFileSync("git", ["-C", dir, ...args], { encoding: "utf8" }).trim();
  g("init", "-q", "-b", "main");
  g("config", "user.email", "gate@example.test"); g("config", "user.name", "Gate Test"); g("config", "commit.gpgsign", "false");
  writeFileSync(join(dir, "a.txt"), "1\n"); g("add", "."); g("commit", "-qm", "start");
  const base = g("rev-parse", "HEAD");
  writeFileSync(join(dir, ".gitattributes"), "api.gen.ts linguist-generated=true\n");
  writeFileSync(join(dir, "api.gen.ts"), "x\n".repeat(500));
  writeFileSync(join(dir, "a.txt"), "2\n3\n"); g("add", "."); g("commit", "-qm", "change");
  const files = readFiles(base, "HEAD", dir);
  const r = evaluate({ files, generated: readGenerated(files.map((x) => x.path), dir) });
  assert.equal(r.total, 4); // .gitattributes 1 + a.txt 2 added 1 deleted
  assert.deepEqual(r.excluded.map((x) => x.path), ["api.gen.ts"]);
});
