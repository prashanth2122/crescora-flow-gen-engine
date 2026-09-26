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
      "assai-deepa-hospital-appointment-single-branch.flow.json"
    )
);
const flowExport = JSON.parse(readFileSync(exportPath, "utf8"));
const nodes = flowExport.flow?.nodes ?? [];
const errors = [];

function fail(message) {
  errors.push(message);
}

function recordNodes(collection, action = "list") {
  return nodes.filter((node) =>
    node.type === "record" &&
    node.data?.collection === collection &&
    (!action || node.data?.action === action)
  );
}

function requireWhere(node, key, expected) {
  const actual = node.data?.where?.[key];
  if (actual !== expected) {
    fail(`${node.id}: where.${key} must be ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

const departments = recordNodes("departments");
if (departments.length === 0) fail("No departments list node found");
for (const node of departments) {
  requireWhere(node, "branch_id", "{{doctor_scope_branch_id}}");
  requireWhere(node, "is_active", true);
}

const doctors = recordNodes("doctors");
if (doctors.length === 0) fail("No doctors list node found");
for (const node of doctors) {
  const where = node.data?.where ?? {};
  if (Object.prototype.hasOwnProperty.call(where, "query")) continue;
  requireWhere(node, "branch_id", "{{doctor_scope_branch_id}}");
  requireWhere(node, "department", "{{department}}");
  requireWhere(node, "consultation_mode", "{{consultation_type}}");
  requireWhere(node, "is_active", true);
  requireWhere(node, "booking_enabled", true);
}

const rules = recordNodes("doctor_availability_rules");
if (rules.length === 0) fail("No doctor_availability_rules list node found");
for (const node of rules) {
  requireWhere(node, "branch_id", "{{doctor_scope_branch_id}}");
  requireWhere(node, "doctor_id", "{{doctor_id}}");
  requireWhere(node, "is_active", true);
}

const exceptions = recordNodes("doctor_schedule_exceptions");
if (exceptions.length === 0) fail("No doctor_schedule_exceptions list node found");
for (const node of exceptions) {
  requireWhere(node, "branch_id", "{{doctor_scope_branch_id}}");
  requireWhere(node, "doctor_scope_key", "{{appointment_selected_doctor_scope_key}}");
}

const policies = recordNodes("appointment_booking_policies");
if (policies.length === 0) fail("No appointment_booking_policies list node found");
for (const node of policies) {
  requireWhere(node, "branch_id", "{{doctor_scope_branch_id}}");
  requireWhere(node, "is_active", true);
}

const dynamicAppointments = nodes.filter(
  (node) => node.type === "appointment" && node.data?.slotMode === "dynamic"
);
if (dynamicAppointments.length === 0) fail("No dynamic appointment node found");
const allWeekdays = new Set([0, 1, 2, 3, 4, 5, 6]);
for (const node of dynamicAppointments) {
  if (!String(node.data?.dynamicSlotsVar ?? "").trim()) {
    fail(`${node.id}: dynamicSlotsVar is required`);
  }
  if (node.data?.dynamicSlotsPath !== "data") {
    fail(`${node.id}: dynamicSlotsPath must be data`);
  }
  if (node.data?.disableGeneratedFallback !== true) {
    fail(`${node.id}: disableGeneratedFallback must be true`);
  }
  const weekdays = String(node.data?.availableWeekdays ?? "")
    .split(",")
    .map((value) => Number(value.trim()))
    .filter((value) => Number.isInteger(value));
  if (weekdays.length !== allWeekdays.size || !weekdays.every((value) => allWeekdays.has(value))) {
    fail(`${node.id}: availableWeekdays must be the permissive 0-6 renderer fallback`);
  }
}

if (errors.length > 0) {
  console.error(`Hospital appointment CRM-sync validation failed for ${exportPath}`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Hospital appointment CRM-sync validation passed: ${exportPath}`);
console.log(`Checked ${doctors.length} doctor queries, ${rules.length} availability queries, ${dynamicAppointments.length} dynamic appointment nodes.`);
