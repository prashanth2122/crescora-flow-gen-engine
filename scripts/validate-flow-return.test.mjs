import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const validator = join(root, "scripts", "validate-flow-export.mjs");
const example = JSON.parse(readFileSync(join(root, "flow-valid-export.example.json"), "utf8"));

function validate(edges, maxRetries = 3) {
  const directory = mkdtempSync(join(tmpdir(), "flow-return-"));
  try {
    const payload = {
      ...example,
      flow: {
        version: { major: 1, minor: 0, patch: 0 },
        nodes: [
          { id: "start", type: "start" },
          { id: "department", type: "input", data: { variable: "department" } },
          { id: "confirm", type: "input", data: { variable: "confirmed" } },
          { id: "retry", type: "retry", data: { maxRetries } },
          { id: "booked", type: "end" },
          { id: "exhausted", type: "end" },
        ],
        edges,
      },
      metadata: { ...example.metadata, nodeCount: 6 },
    };
    const file = join(directory, "flow.json");
    writeFileSync(file, JSON.stringify(payload));
    return spawnSync(process.execPath, [validator, file], { encoding: "utf8" });
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

const edges = [
  { id: "enter", source: "start", target: "department" },
  { id: "ask", source: "department", target: "confirm" },
  { id: "no", source: "confirm", target: "retry" },
  { id: "yes", source: "confirm", target: "booked" },
  { id: "return", source: "retry", target: "department", isRetry: true },
  { id: "exit", source: "retry", target: "exhausted", isDefault: true },
];

test("accepts a bounded return and rejects an ordinary backward edge", () => {
  const bounded = validate(edges);
  assert.equal(bounded.status, 0, bounded.stderr + bounded.stdout);

  const ordinary = validate(edges.map((edge) => edge.id === "return"
    ? { ...edge, isRetry: false }
    : edge));
  assert.notEqual(ordinary.status, 0);
  assert.match(ordinary.stderr + ordinary.stdout, /Infinite loop detected/);
});

test("rejects a return without an exhausted exit or a safe limit", () => {
  const missingExit = validate(edges.filter((edge) => edge.id !== "exit"));
  assert.notEqual(missingExit.status, 0);
  assert.match(missingExit.stderr + missingExit.stdout, /default exhausted exit/);

  const unbounded = validate(edges, 20);
  assert.notEqual(unbounded.status, 0);
  assert.match(unbounded.stderr + unbounded.stdout, /maxRetries between 1 and 4/);
});
