import { copyFileSync, existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = resolve(fileURLToPath(new URL("..", import.meta.url)));
const appRoot = resolve(
  process.env.BOT_CODE_ZERO_ROOT ?? join(rootDir, "..", "bot-code-zero")
);
const sourceDir = join(appRoot, "docs", "external-flow-contract");
const files = [
  "FLOW_EXTERNAL_LLM_CONTRACT.md",
  "flow-export-schema.snapshot.json",
  "flow-node-catalog.snapshot.json",
  "flow-valid-export.example.json"
];
const checkMode = process.argv.includes("--check");

function normalize(content) {
  return content.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

if (!existsSync(sourceDir)) {
  throw new Error(
    `Application contract source not found at ${sourceDir}. Set BOT_CODE_ZERO_ROOT to the bot-code-zero checkout.`
  );
}

const mismatches = [];
for (const file of files) {
  const sourcePath = join(sourceDir, file);
  const targetPath = join(rootDir, file);
  if (!existsSync(sourcePath)) {
    mismatches.push(`missing source file ${file}`);
    continue;
  }

  if (checkMode) {
    if (!existsSync(targetPath)) {
      mismatches.push(file);
      continue;
    }
    if (normalize(readFileSync(targetPath, "utf8")) !== normalize(readFileSync(sourcePath, "utf8"))) {
      mismatches.push(file);
    }
    continue;
  }

  copyFileSync(sourcePath, targetPath);
}

if (mismatches.length > 0) {
  throw new Error(`External flow contract bundle is stale: ${mismatches.join(", ")}`);
}

console.log(
  checkMode
    ? "External flow contract bundle is up to date."
    : `Copied external flow contract bundle from ${sourceDir}.`
);
