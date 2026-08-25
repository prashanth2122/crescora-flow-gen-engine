import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const registryPath = join(rootDir, "domains", "registry.json");
const registry = JSON.parse(readFileSync(registryPath, "utf8"));
const domains = Array.isArray(registry?.domains) ? registry.domains : [];
const mode = process.argv[2] ?? "check";
const nodeBin = process.execPath;

if (domains.length === 0) {
  throw new Error(`No domain bundles registered in ${registryPath}`);
}

function runNodeScript(scriptRelativePath, extraArgs = []) {
  execFileSync(nodeBin, [join(rootDir, scriptRelativePath), ...extraArgs], {
    cwd: rootDir,
    stdio: "inherit"
  });
}

function runDomainBuild(domain) {
  console.log(`\n[flow-generator] build domain: ${domain.id}`);
  runNodeScript(domain.buildScript);
}

function runDomainValidate(domain) {
  console.log(`\n[flow-generator] validate domain: ${domain.id}`);
  runNodeScript(domain.validateScript, [join(rootDir, domain.builtFlow)]);
}

function runDomainJourneyAudit(domain) {
  if (!domain.journeyAuditScript) return;
  console.log(`\n[flow-generator] journey audit domain: ${domain.id}`);
  runNodeScript(domain.journeyAuditScript, [join(rootDir, domain.builtFlow)]);
}

function runDomainContentAudit(domain) {
  if (!domain.contentAuditScript) return;
  console.log(`\n[flow-generator] content audit domain: ${domain.id}`);
  runNodeScript(domain.contentAuditScript, [join(rootDir, domain.builtFlow)]);
}

switch (mode) {
  case "build":
    for (const domain of domains) {
      runDomainBuild(domain);
    }
    break;

  case "validate":
    for (const domain of domains) {
      runDomainValidate(domain);
    }
    break;

  case "check":
    for (const domain of domains) {
      runDomainBuild(domain);
      runDomainValidate(domain);
    }
    break;

  case "check:strict":
    for (const domain of domains) {
      runDomainBuild(domain);
      runDomainValidate(domain);
      runDomainJourneyAudit(domain);
      runDomainContentAudit(domain);
    }
    break;

  default:
    throw new Error(
      `Unsupported mode "${mode}". Use build, validate, check, or check:strict.`
    );
}
