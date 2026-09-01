import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const exportPath = resolve(
  process.argv[2] ??
    join(
      rootDir,
      "domains",
      "hospital",
      "templates",
      "hospital-full-automation.flow.json"
    )
);
const schemaPath = join(rootDir, "flow-export-schema.snapshot.json");

const flowExport = JSON.parse(readFileSync(exportPath, "utf8"));
const schema = JSON.parse(readFileSync(schemaPath, "utf8"));
const allowedTypes = new Set(schema.exportWrapper.flow.nodes.allowedTypes);
const requiredTopLevelKeys = schema.exportWrapper.requiredKeys;
const errors = [];
const reportedTemplateErrors = new Set();
const CAROUSEL_LOCAL_TEMPLATE_VARS = new Set([
  "item",
  "carouselItem",
  "currentItem",
  "index",
  "slideIndex"
]);
const RECORD_SCHEMA_NAMES = new Set([
  "public",
  "automobile",
  "education",
  "financial_services",
  "healthcare",
  "hospitality",
  "insurance",
  "professional_services",
  "realestate",
  "retail"
]);
const templatePattern = /\{\{\s*([A-Za-z_$][A-Za-z0-9_$]*(?:\.[A-Za-z_$][A-Za-z0-9_$]*)*)\s*\}\}/g;

function fail(message) {
  errors.push(message);
}

function sameKeys(actual, expected) {
  return actual.length === expected.length && expected.every((key, index) => actual[index] === key);
}

function validateScriptSyntax(node) {
  const script = node?.data?.script;
  if (script == null || script === "") return;
  if (typeof script !== "string") {
    fail(`Script node ${node.id} must use a string data.script value`);
    return;
  }
  try {
    new Function("vars", script);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    fail(`Script node ${node.id} contains invalid JavaScript: ${message}`);
  }
}

function extractTemplateVars(value) {
  if (typeof value !== "string" || value.length === 0) {
    return [];
  }

  return [...value.matchAll(templatePattern)].map((match) => match[1]);
}

function collectTemplateVars(value, matches = []) {
  if (value == null) return matches;

  if (typeof value === "string") {
    matches.push(...extractTemplateVars(value));
    return matches;
  }

  if (Array.isArray(value)) {
    for (const entry of value) {
      collectTemplateVars(entry, matches);
    }
    return matches;
  }

  if (typeof value === "object") {
    for (const entry of Object.values(value)) {
      collectTemplateVars(entry, matches);
    }
  }

  return matches;
}

function getNodeLocalTemplateVars(node) {
  const localVars = new Set();

  if (node?.type === "carousel") {
    for (const varName of CAROUSEL_LOCAL_TEMPLATE_VARS) {
      localVars.add(varName);
    }
  }

  if (node?.type === "ai-grounded" || node?.type === "web-crawl") {
    localVars.add("answer");
  }

  if (node?.type === "otp") {
    localVars.add("otp");
    localVars.add("otp_ttl_minutes");
  }

  return localVars;
}

function checkTemplateContainer(value, safeVariables, localTemplateVars = new Set()) {
  for (const variable of collectTemplateVars(value)) {
    const baseVariable = variable.split(".")[0];
    if (safeVariables.has(variable) || safeVariables.has(baseVariable)) {
      continue;
    }
    if (localTemplateVars.has(baseVariable)) {
      continue;
    }

    const errorKey = `${baseVariable}:${variable}`;
    if (reportedTemplateErrors.has(errorKey)) {
      continue;
    }
    reportedTemplateErrors.add(errorKey);
    fail(`Template variable {{${variable}}} is not declared by globals or a writer node`);
  }
}

function validateRecordSchemaName(node) {
  if (node?.type !== "record") return;

  const schemaName = node?.data?.schemaName;
  if (schemaName == null || schemaName === "") return;
  if (typeof schemaName !== "string") {
    fail(`Record node ${node.id} data.schemaName must be a string when provided`);
    return;
  }
  if (!RECORD_SCHEMA_NAMES.has(schemaName)) {
    fail(
      `Record node ${node.id} uses unsupported schemaName ${schemaName}; allowed values are ${[
        ...RECORD_SCHEMA_NAMES
      ].join(", ")}`
    );
  }
}

function validateOtpNode(node) {
  if (node?.type !== "otp") return;

  const data = node.data ?? {};
  const channels = data.channels;
  if (channels != null && !Array.isArray(channels)) {
    fail(`OTP node ${node.id} data.channels must be an array when provided`);
  }
  if (Array.isArray(channels)) {
    for (const channel of channels) {
      if (!["sms", "whatsapp", "email"].includes(channel)) {
        fail(`OTP node ${node.id} uses unsupported delivery channel ${channel}`);
      }
    }
  }

  if (data.resendCooldownSeconds != null && Number(data.resendCooldownSeconds) < 30) {
    fail(`OTP node ${node.id} resendCooldownSeconds must be at least 30`);
  }
  if (data.maxResends != null && Number(data.maxResends) > 3) {
    fail(`OTP node ${node.id} maxResends must not exceed 3`);
  }

  const outputVar = typeof data.outputVar === "string" ? data.outputVar.toLowerCase() : "";
  if (outputVar === "otp" || outputVar.includes("code")) {
    fail(`OTP node ${node.id} outputVar must not expose the generated OTP code`);
  }
}

const topLevelKeys = Object.keys(flowExport);
if (!sameKeys(topLevelKeys, requiredTopLevelKeys)) {
  fail(`Top-level keys must be ${requiredTopLevelKeys.join(", ")}; got ${topLevelKeys.join(", ")}`);
}

if (flowExport.version !== "1.0") {
  fail(`Expected export version 1.0, got ${flowExport.version}`);
}

if (!flowExport.flow || !Array.isArray(flowExport.flow.nodes) || !Array.isArray(flowExport.flow.edges)) {
  fail("Export must include flow.nodes and flow.edges arrays");
}

const nodes = flowExport.flow?.nodes ?? [];
const edges = flowExport.flow?.edges ?? [];
const nodeIds = new Set();
const edgeIds = new Set();
const duplicateNodeIds = new Set();
const duplicateEdgeIds = new Set();

for (const node of nodes) {
  if (!node.id) fail("Every node must include id");
  if (!node.type) fail(`Node ${node.id ?? "<missing>"} must include type`);
  if (node.id && nodeIds.has(node.id)) duplicateNodeIds.add(node.id);
  if (node.id) nodeIds.add(node.id);
  if (node.type && !allowedTypes.has(node.type)) {
    fail(`Node ${node.id} uses unsupported type ${node.type}`);
  }
  if (node.position) {
    if (typeof node.position.x !== "number" || typeof node.position.y !== "number") {
      fail(`Node ${node.id} position must contain numeric x/y`);
    }
  }
  if (node.type === "script") {
    validateScriptSyntax(node);
  }
  validateRecordSchemaName(node);
  validateOtpNode(node);
}

for (const id of duplicateNodeIds) fail(`Duplicate node id: ${id}`);

for (const edge of edges) {
  if (!edge.id) fail("Every edge must include id");
  if (edge.id && edgeIds.has(edge.id)) duplicateEdgeIds.add(edge.id);
  if (edge.id) edgeIds.add(edge.id);
  if (!nodeIds.has(edge.source)) fail(`Edge ${edge.id} has missing source ${edge.source}`);
  if (!nodeIds.has(edge.target)) fail(`Edge ${edge.id} has missing target ${edge.target}`);
  if (edge.condition && !["equals", "contains"].includes(edge.condition.operator)) {
    fail(`Edge ${edge.id} uses unsupported condition operator ${edge.condition.operator}`);
  }
}

for (const id of duplicateEdgeIds) fail(`Duplicate edge id: ${id}`);

const starts = nodes.filter((node) => node.type === "start");
if (starts.length !== 1) {
  fail(`Expected exactly one start node, got ${starts.length}`);
}

const outgoing = new Map();
const incoming = new Map();
for (const edge of edges) {
  if (!outgoing.has(edge.source)) outgoing.set(edge.source, []);
  outgoing.get(edge.source).push(edge);
  if (!incoming.has(edge.target)) incoming.set(edge.target, []);
  incoming.get(edge.target).push(edge);
}

for (const node of nodes) {
  const nodeOutgoing = outgoing.get(node.id) ?? [];
  if (node.type === "end" && nodeOutgoing.length > 0) {
    fail(`End node ${node.id} must not have outgoing edges`);
  }
  if (node.type === "handover" && nodeOutgoing.length > 0) {
    fail(`Handover node ${node.id} must not have outgoing edges`);
  }
  const hasConditional = nodeOutgoing.some((edge) => Boolean(edge.condition));
  if (hasConditional) {
    const defaultEdges = nodeOutgoing.filter((edge) => edge.isDefault);
    if (defaultEdges.length !== 1) {
      fail(`Conditional source ${node.id} must have exactly one default edge; got ${defaultEdges.length}`);
    }
  }
}

if (starts.length === 1) {
  const visited = new Set([starts[0].id]);
  const queue = [starts[0].id];
  while (queue.length > 0) {
    const current = queue.shift();
    for (const edge of outgoing.get(current) ?? []) {
      if (!visited.has(edge.target)) {
        visited.add(edge.target);
        queue.push(edge.target);
      }
    }
  }
  for (const node of nodes) {
    if (!visited.has(node.id)) fail(`Unreachable node: ${node.id}`);
  }
}

const visitState = new Map();
const path = [];

function detectCycle(nodeId) {
  const state = visitState.get(nodeId);
  if (state === "visiting") {
    const cycleStart = path.indexOf(nodeId);
    const cyclePath = [...path.slice(cycleStart), nodeId].join(" -> ");
    fail(`Infinite loop detected involving node ${nodeId}: ${cyclePath}`);
    return;
  }
  if (state === "visited") return;

  visitState.set(nodeId, "visiting");
  path.push(nodeId);
  for (const edge of outgoing.get(nodeId) ?? []) {
    detectCycle(edge.target);
  }
  path.pop();
  visitState.set(nodeId, "visited");
}

for (const node of nodes) {
  detectCycle(node.id);
}

for (const node of nodes) {
  if (node.type !== "start" && !incoming.has(node.id)) {
    fail(`Node ${node.id} has no incoming edge`);
  }
}

if (flowExport.metadata?.nodeCount !== nodes.length) {
  fail(`metadata.nodeCount ${flowExport.metadata?.nodeCount} does not match flow.nodes.length ${nodes.length}`);
}

const safeVariables = new Set([
  "input",
  "intent",
  "lastError",
  "system.botId",
  "system.channel",
  "system.sessionId"
]);
const scriptVarWritePattern = /\bvars(?:\s*\.\s*([A-Za-z_$][\w$]*)|\s*\[\s*(['"])([^'"]+)\2\s*\])\s*(?:\+\+|--|\*\*=|>>>=|>>=|<<=|&&=|\|\|=|\?\?=|[+\-*/%&|^]?=)/g;

for (const item of flowExport.bot?.globalVariables ?? []) {
  if (item?.key) safeVariables.add(item.key);
}

for (const node of nodes) {
  const data = node.data ?? {};
  if (node.type === "input" && data.variable) safeVariables.add(data.variable);
  if (node.type === "decision" && data.outputVar) safeVariables.add(data.outputVar);
  if (node.type === "form") {
    if (data.outputVar) safeVariables.add(data.outputVar);
    if (data.mapToVariables) {
      for (const field of data.fields ?? []) {
        if (field.key) safeVariables.add(field.key);
      }
    }
  }
  if (node.type === "appointment") {
    // The deployed import validator currently accepts the appointment booking output
    // as a runtime writer, but does not reliably accept dateVar reads in imports.
    // Keep this bundle stricter so generated exports do not pass locally and fail
    // during /bots/import with UNDEFINED_VARIABLE.
    if (data.outputVar) safeVariables.add(data.outputVar);
  }
  if (node.type === "record" && data.outputVar) safeVariables.add(data.outputVar);
  if (node.type === "otp" && data.outputVar) safeVariables.add(data.outputVar);
  if (node.type === "payment" && data.outputVar) safeVariables.add(data.outputVar);
  if (node.type === "queue" && data.outputVar) safeVariables.add(data.outputVar);
  if (node.type === "notification" && data.outputVar) safeVariables.add(data.outputVar);
  if (node.type === "template-message" && data.outputVar) safeVariables.add(data.outputVar);
  if (node.type === "track-event" && data.outputVar) safeVariables.add(data.outputVar);
  if (node.type === "audit-log" && data.outputVar) safeVariables.add(data.outputVar);
  if (node.type === "scheduler" && data.outputVar) safeVariables.add(data.outputVar);
  if (node.type === "language") {
    if (data.outputVar) safeVariables.add(data.outputVar);
    if (data.preferredLanguageVar) safeVariables.add(data.preferredLanguageVar);
  }
  if (node.type === "auth-consent" && data.outputVar) safeVariables.add(data.outputVar);
  if (node.type === "approval" && data.outputVar) safeVariables.add(data.outputVar);
  if (node.type === "dedupe" && data.outputVar) safeVariables.add(data.outputVar);
  if (node.type === "api") {
    if (data.saveAs) safeVariables.add(data.saveAs);
    for (const mapping of data.responseMap ?? []) {
      if (mapping.variable) safeVariables.add(mapping.variable);
    }
  }
  if (node.type === "connector") {
    if (data.saveAs) safeVariables.add(data.saveAs);
    for (const mapping of data.responseMap ?? []) {
      if (mapping.variable) safeVariables.add(mapping.variable);
    }
  }
  if (node.type === "ai-grounded") {
    if (data.outputVar) safeVariables.add(data.outputVar);
    if (data.answerVar) safeVariables.add(data.answerVar);
    if (data.answerKeyValueVar) safeVariables.add(data.answerKeyValueVar);
  }
  if (node.type === "web-crawl") {
    if (data.outputVar) safeVariables.add(data.outputVar);
    if (data.answerVar) safeVariables.add(data.answerVar);
  }
  if (node.type === "document-intake" && data.outputVar) safeVariables.add(data.outputVar);
  if (node.type === "script") {
    if (data.outputVar) safeVariables.add(data.outputVar);
    const script = typeof data.script === "string" ? data.script : "";
    for (const match of script.matchAll(scriptVarWritePattern)) {
      const varName = (match[1] ?? match[3] ?? "").trim();
      if (varName) safeVariables.add(varName);
    }
    safeVariables.add("lastScriptError");
  }
  if (node.type === "setVariable") {
    for (const assignment of data.assignments ?? []) {
      if (assignment.key) safeVariables.add(assignment.key);
    }
  }
}

checkTemplateContainer(flowExport.bot, safeVariables);
checkTemplateContainer(flowExport.metadata, safeVariables);

for (const edge of edges) {
  checkTemplateContainer(edge, safeVariables);
}

for (const node of nodes) {
  checkTemplateContainer(node, safeVariables, getNodeLocalTemplateVars(node));
}

if (errors.length > 0) {
  console.error(`Validation failed for ${exportPath}`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Validation passed: ${exportPath}`);
console.log(`Nodes: ${nodes.length}`);
console.log(`Edges: ${edges.length}`);
