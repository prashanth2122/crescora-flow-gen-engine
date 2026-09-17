import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const validator = join(root, "scripts", "validate-flow-export.mjs");
const example = JSON.parse(
  readFileSync(join(root, "flow-valid-export.example.json"), "utf8")
);

function validate(mutator = () => {}) {
  const directory = mkdtempSync(join(tmpdir(), "flow-localized-content-"));
  try {
    const payload = structuredClone(example);
    mutator(payload);
    const file = join(directory, "flow.json");
    writeFileSync(file, JSON.stringify(payload));
    return spawnSync(process.execPath, [validator, file], { encoding: "utf8" });
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

test("accepts localized content keys as declared readonly template variables", () => {
  const result = validate();
  assert.equal(result.status, 0, result.stderr + result.stdout);
});

test("requires complete enabled-language catalogs for catalog_only bots", () => {
  const result = validate((payload) => {
    delete payload.bot.localizedVariables.languages.te.welcome_message;
  });

  assert.notEqual(result.status, 0);
  assert.match(
    result.stderr + result.stdout,
    /language te is missing required keys: welcome_message/
  );
});

test("requires English base content and disallows global key collisions", () => {
  const missingEnglish = validate((payload) => {
    payload.bot.localizedVariables.languages.en.welcome_message = "";
  });
  assert.notEqual(missingEnglish.status, 0);
  assert.match(
    missingEnglish.stderr + missingEnglish.stdout,
    /welcome_message requires a non-empty English value/
  );

  const collision = validate((payload) => {
    payload.bot.globalVariables.push({
      key: "welcome_message",
      value: "duplicate"
    });
  });
  assert.notEqual(collision.status, 0);
  assert.match(
    collision.stderr + collision.stdout,
    /cannot exist in both bot globals and localized content/
  );
});
