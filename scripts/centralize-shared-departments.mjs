import fs from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const sourcePath = join(
  rootDir,
  "domains",
  "hospital",
  "templates-source",
  "hospital-full-automation.source.flow.json"
);
const document = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
const flow = document.flow;

function getNode(id) {
  const node = flow.nodes.find((item) => item.id === id);
  if (!node) throw new Error(`Missing node: ${id}`);
  return node;
}

function upsertNode(node) {
  const index = flow.nodes.findIndex((item) => item.id === node.id);
  if (index >= 0) {
    flow.nodes[index] = node;
    return;
  }
  flow.nodes.push(node);
}

function makeEdge(source, target, opts = {}) {
  const edge = {
    id:
      opts.id ||
      `edge_${source}_${target}${opts.label ? `_${String(opts.label).replace(/[^a-z0-9]+/gi, "_")}` : ""}`,
    type: "smoothstep",
    source,
    target
  };
  if (opts.label) edge.label = opts.label;
  if (opts.isDefault) edge.isDefault = true;
  if (opts.condition) edge.condition = opts.condition;
  return edge;
}

function ensureEdge(edge) {
  const index = flow.edges.findIndex(
    (item) =>
      item.id === edge.id ||
      (item.source === edge.source &&
        item.target === edge.target &&
        String(item.label || "") === String(edge.label || ""))
  );
  if (index >= 0) {
    flow.edges[index] = { ...flow.edges[index], ...edge };
    return;
  }
  flow.edges.push(edge);
}

function removeEdges(match) {
  flow.edges = flow.edges.filter((edge) => !match(edge));
}

function removeNodes(ids) {
  const idSet = new Set(ids);
  flow.nodes = flow.nodes.filter((node) => !idSet.has(node.id));
}

function departmentsCollectionSchema() {
  return {
    collection: "departments",
    fields: {
      department_key: { type: "string", unique: true, required: false },
      display_name: { type: "string", required: false },
      short_label: { type: "string", required: false },
      sort_order: { type: "number", required: false },
      is_active: { type: "string", required: false },
      visible_in_menu: { type: "string", required: false },
      supports_online: { type: "string", required: false },
      description: { type: "string", required: false },
      aliases: { type: "string", required: false }
    }
  };
}

function sharedDepartmentsFetchNode() {
  return {
    id: "shared_departments_fetch",
    type: "record",
    position: { x: 5840, y: 6370 },
    data: {
      action: "list",
      collection: "departments",
      collectionSchema: departmentsCollectionSchema(),
      outputVar: "shared_departments_result",
      data: {},
      dataJson: "{}",
      where: {},
      whereJson: "{}",
      limit: 200,
      offset: 0,
      sortBy: "updatedAt",
      sortOrder: "desc",
      uniqueKey: "",
      piiFields: "",
      encryptPii: false,
      softDelete: true,
      idempotencyKey: ""
    }
  };
}

function sharedDepartmentsCatalogScript() {
  return `
function normalizeText(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
}
function titleCase(value) {
  return String(value || "")
    .replace(/[_-]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.toLowerCase() === "ent" ? "ENT" : part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
function toBoolean(value, fallbackValue) {
  if (value === undefined || value === null || value === "") return fallbackValue;
  if (typeof value === "boolean") return value;
  const normalized = String(value).trim().toLowerCase();
  if (["true", "1", "yes", "y"].includes(normalized)) return true;
  if (["false", "0", "no", "n"].includes(normalized)) return false;
  return fallbackValue;
}
function optionText(rows, includeNotSure) {
  const lines = rows.map((item, index) => String(index + 1) + ". " + item.label);
  if (includeNotSure) lines.push(String(rows.length + 1) + ". Not sure / describe issue");
  return lines.length
    ? lines.join("\\n")
    : "No departments are configured right now. Please type the department name if you already know it.";
}
const rows = Array.isArray(vars.shared_departments_result?.data) ? vars.shared_departments_result.data : [];
const hasOnlineFlag = rows.some((row) => Object.prototype.hasOwnProperty.call(row || {}, "supports_online"));
const catalog = rows
  .map((row) => {
    const key = normalizeText(
      row?.department_key ||
      row?.id ||
      row?.department ||
      row?.slug ||
      row?.name ||
      row?.display_name ||
      row?.short_label
    );
    if (!key) return null;
    const label = String(
      row?.display_name ||
      row?.short_label ||
      row?.label ||
      titleCase(key)
    ).trim() || titleCase(key);
    const aliasValues = [];
    if (Array.isArray(row?.aliases)) aliasValues.push(...row.aliases);
    if (!Array.isArray(row?.aliases) && String(row?.aliases || "").trim()) {
      aliasValues.push(...String(row.aliases).split(","));
    }
    if (String(row?.alias_list || "").trim()) aliasValues.push(...String(row.alias_list).split(","));
    aliasValues.push(key, label, row?.short_label || "", row?.name || "");
    return {
      key,
      label,
      description: String(row?.description || row?.summary || row?.profile_summary || "").trim(),
      sort_order: Number(row?.sort_order ?? row?.sequence ?? row?.display_order ?? 9999),
      is_active: row?.is_active,
      visible_in_menu: row?.visible_in_menu,
      supports_online: row?.supports_online,
      aliases: Array.from(new Set(aliasValues.map((value) => normalizeText(value)).filter(Boolean)))
    };
  })
  .filter(Boolean)
  .filter((item) => toBoolean(item.is_active, true))
  .filter((item) => toBoolean(item.visible_in_menu, true))
  .sort((left, right) => {
    const orderDiff = Number(left.sort_order || 9999) - Number(right.sort_order || 9999);
    if (orderDiff !== 0) return orderDiff;
    return String(left.label || left.key || "").localeCompare(String(right.label || right.key || ""));
  });
const onlineCatalog = catalog.filter((item) => (!hasOnlineFlag || toBoolean(item.supports_online, false)));
const departmentLines = catalog.map((item) => "- " + item.key + ": " + (item.description || (item.label + " related concerns.")));
const aiContextText = [
  "Hospital department routing reference:",
  "- Routine department keys: " + (catalog.map((item) => item.key).join(", ") || "none configured") + ".",
  ...departmentLines,
  "- Emergency override key: emergency_medicine for severe chest pain, trouble breathing, heavy bleeding, stroke-like symptoms, unconsciousness, seizures, major trauma, collapse, or any immediately life-threatening concern.",
  "- If the concern is broad or unclear but not urgent, prefer general_medicine when that key exists; otherwise choose the closest routine department key from the configured list.",
  "- Output must be one department key only and nothing else."
].join("\\n");
vars.shared_department_catalog_rows = catalog;
vars.shared_online_department_catalog_rows = onlineCatalog;
vars.shared_department_ai_context_text = aiContextText;
vars.appointment_department_catalog_rows = catalog;
vars.appointment_department_options_text = optionText(catalog, true);
vars.appointment_department_ai_context_text = aiContextText;
vars.department_help_department_catalog_rows = catalog;
vars.department_help_department_options_text = optionText(catalog, false);
vars.department_help_ai_context_text = aiContextText;
vars.availability_department_catalog_rows = catalog;
vars.availability_department_options_text = optionText(catalog, false);
vars.availability_department_ai_context_text = aiContextText;
vars.doctor_profile_department_catalog_rows = catalog;
vars.doctor_profile_department_options_text = optionText(catalog, false);
vars.doctor_profile_department_ai_context_text = aiContextText;
vars.online_department_catalog_rows = onlineCatalog;
vars.online_department_options_text = optionText(onlineCatalog, false);
vars.online_department_ai_context_text = aiContextText;
return { total_departments: catalog.length, online_departments: onlineCatalog.length };
`;
}

upsertNode(sharedDepartmentsFetchNode());
upsertNode({
  id: "shared_departments_catalog_prepare",
  type: "script",
  position: { x: 6080, y: 6370 },
  data: {
    outputVar: "shared_departments_catalog_prepare_result",
    timeoutMs: 100,
    script: sharedDepartmentsCatalogScript()
  }
});

for (const edge of flow.edges) {
  if (edge.target === "main_intent_router") {
    edge.target = "shared_departments_fetch";
  }
}

removeEdges(
  (edge) =>
    (edge.source === "appointment_consultation_type_input" && edge.target === "appointment_departments_fetch") ||
    (edge.source === "appointment_departments_fetch" && edge.target === "appointment_departments_catalog_prepare") ||
    (edge.source === "appointment_departments_catalog_prepare" && edge.target === "appointment_department_input") ||
    (edge.source === "department_reason_input" && edge.target === "department_help_departments_fetch") ||
    (edge.source === "department_help_departments_fetch" && edge.target === "department_help_departments_catalog_prepare") ||
    (edge.source === "department_help_departments_catalog_prepare" && edge.target === "department_help_ai_match") ||
    (edge.source === "availability_entry_branch_input" && edge.target === "availability_departments_fetch") ||
    (edge.source === "availability_departments_fetch" && edge.target === "availability_departments_catalog_prepare") ||
    (edge.source === "availability_departments_catalog_prepare" && edge.target === "availability_department_input") ||
    (edge.source === "doctor_profile_input" && edge.target === "doctor_profile_departments_fetch") ||
    (edge.source === "doctor_profile_departments_fetch" && edge.target === "doctor_profile_departments_catalog_prepare") ||
    (edge.source === "doctor_profile_departments_catalog_prepare" && edge.target === "doctor_profile_department_input") ||
    (edge.source === "online_booking_defaults" && edge.target === "online_departments_fetch") ||
    (edge.source === "online_departments_fetch" && edge.target === "online_departments_catalog_prepare") ||
    (edge.source === "online_departments_catalog_prepare" && edge.target === "online_symptom_form")
);

[
  makeEdge("shared_departments_fetch", "shared_departments_catalog_prepare"),
  makeEdge("shared_departments_catalog_prepare", "main_intent_router"),
  makeEdge("appointment_consultation_type_input", "appointment_department_input"),
  makeEdge("department_reason_input", "department_help_ai_match"),
  makeEdge("availability_entry_branch_input", "availability_department_input"),
  makeEdge("doctor_profile_input", "doctor_profile_department_input"),
  makeEdge("online_booking_defaults", "online_symptom_form")
].forEach(ensureEdge);

removeNodes([
  "appointment_departments_fetch",
  "appointment_departments_catalog_prepare",
  "department_help_departments_fetch",
  "department_help_departments_catalog_prepare",
  "availability_departments_fetch",
  "availability_departments_catalog_prepare",
  "doctor_profile_departments_fetch",
  "doctor_profile_departments_catalog_prepare",
  "online_departments_fetch",
  "online_departments_catalog_prepare"
]);

document.metadata = document.metadata || {};
document.metadata.departmentCatalogFetchMode = "shared_once_per_fresh_journey";
document.metadata.departmentCatalogNotes =
  "Fresh journeys now refresh departments once through shared_departments_fetch and shared_departments_catalog_prepare, then downstream department pickers reuse the prepared variables instead of hitting the database again.";
document.metadata.nodeCount = flow.nodes.length;
document.metadata.edgeCount = flow.edges.length;

const tempPath = `${sourcePath}.tmp`;
fs.writeFileSync(tempPath, JSON.stringify(document, null, 2) + "\n");
console.log(`Wrote ${tempPath} with ${flow.nodes.length} nodes and ${flow.edges.length} edges.`);
