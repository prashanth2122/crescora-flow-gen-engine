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

function removeEdges(match) {
  flow.edges = flow.edges.filter((edge) => !match(edge));
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

function listDepartmentsNode(id, outputVar, x, y) {
  return {
    id,
    type: "record",
    position: { x, y },
    data: {
      action: "list",
      collection: "departments",
      collectionSchema: departmentsCollectionSchema(),
      outputVar,
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

function buildCatalogPrepareScript({ resultVar, catalogVar, optionsVar, aiContextVar, onlineOnly, includeNotSure }) {
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
const rows = Array.isArray(vars.${resultVar}?.data) ? vars.${resultVar}.data : [];
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
  .filter((item) => ${onlineOnly ? "(!hasOnlineFlag || toBoolean(item.supports_online, false))" : "true"})
  .sort((left, right) => {
    const orderDiff = Number(left.sort_order || 9999) - Number(right.sort_order || 9999);
    if (orderDiff !== 0) return orderDiff;
    return String(left.label || left.key || "").localeCompare(String(right.label || right.key || ""));
  });
vars.${catalogVar} = catalog;
const optionLines = catalog.map((item, index) => String(index + 1) + ". " + item.label);
${includeNotSure ? 'optionLines.push(String(catalog.length + 1) + ". Not sure / describe issue");' : ""}
vars.${optionsVar} = optionLines.length
  ? optionLines.join("\\n")
  : "No departments are configured right now. Please type the department name if you already know it.";
const departmentLines = catalog.map((item) => "- " + item.key + ": " + (item.description || (item.label + " related concerns.")));
vars.${aiContextVar} = [
  "Hospital department routing reference:",
  "- Routine department keys: " + (catalog.map((item) => item.key).join(", ") || "none configured") + ".",
  ...departmentLines,
  "- Emergency override key: emergency_medicine for severe chest pain, trouble breathing, heavy bleeding, stroke-like symptoms, unconsciousness, seizures, major trauma, collapse, or any immediately life-threatening concern.",
  "- If the concern is broad or unclear but not urgent, prefer general_medicine when that key exists; otherwise choose the closest routine department key from the configured list.",
  "- Output must be one department key only and nothing else."
].join("\\n");
return { count: catalog.length };
`;
}

function buildResolveScript({ inputVar, catalogVar, resolvedVar, labelVar, includeNotSure }) {
  return `
function normalizeText(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
}
const catalog = Array.isArray(vars.${catalogVar}) ? vars.${catalogVar} : [];
const raw = String(vars.${inputVar} || "").trim();
const normalized = normalizeText(raw);
function resolveChoice(value) {
  if (!value) return null;
  if (["emergency", "emergency_medicine", "urgent", "ambulance", "er"].includes(value)) {
    return { key: "emergency_medicine", label: "Emergency Medicine", emergency: true };
  }
  if (/^\\d+$/.test(value)) {
    const index = Number(value);
    if (index >= 1 && index <= catalog.length) return catalog[index - 1];
    ${includeNotSure ? 'if (index === catalog.length + 1) return { key: "not_sure", label: "Not sure / describe issue", notSure: true };' : ""}
  }
  for (const item of catalog) {
    const labelNormalized = normalizeText(item.label || "");
    if (value === item.key || value === labelNormalized || (Array.isArray(item.aliases) && item.aliases.includes(value))) {
      return item;
    }
  }
  return null;
}
const match = resolveChoice(normalized);
vars.${resolvedVar} = match?.key || "";
vars.${labelVar} = match?.label || "";
`;
}

function buildAppointmentDepartmentPrepareScript() {
  return `
${buildResolveScript({
    inputVar: "appointment_department_choice",
    catalogVar: "appointment_department_catalog_rows",
    resolvedVar: "appointment_department_resolved_key",
    labelVar: "appointment_department_selected_label",
    includeNotSure: true
  })}
vars.department_help_entry_source = "appointment_booking";
const key = String(vars.appointment_department_resolved_key || "").trim();
if (!raw || key === "not_sure") {
  vars.appointment_department_route = "ask_concern";
  return { route: vars.appointment_department_route };
}
if (key === "emergency_medicine") {
  vars.appointment_department_route = "emergency";
  return { route: vars.appointment_department_route };
}
if (key) {
  vars.department = key;
  vars.availability_department = key;
  vars.appointment_department_route = "department";
  return { route: vars.appointment_department_route, department: key };
}
vars.department_reason = raw;
vars.department = "";
vars.availability_department = "";
vars.appointment_department_route = "resolve_concern";
return { route: vars.appointment_department_route, concern: raw };
`;
}

function buildAiMatchPrepareScript({ catalogVar, resultVar, routeVar, textVar, departmentVar, prefixText }) {
  return `
function normalizeText(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
}
const catalog = Array.isArray(vars.${catalogVar}) ? vars.${catalogVar} : [];
const raw = String(vars.${resultVar} || "").trim();
const normalized = normalizeText(raw);
let match = null;
if (["emergency", "emergency_medicine", "urgent", "ambulance", "er"].includes(normalized)) {
  match = { key: "emergency_medicine", label: "Emergency Medicine" };
} else {
  for (const item of catalog) {
    const labelNormalized = normalizeText(item.label || "");
    if (normalized === item.key || normalized === labelNormalized || (Array.isArray(item.aliases) && item.aliases.includes(normalized))) {
      match = item;
      break;
    }
  }
}
vars.${departmentVar} = match?.key || "";
vars.${routeVar} = match?.key === "emergency_medicine" ? "emergency" : (match ? "matched" : "manual");
if (match && match.key !== "emergency_medicine") {
  vars.department = match.key;
  vars.availability_department = match.key;
  vars.${textVar} = "${prefixText}" + String(match.label || match.key) + "${prefixText.includes("concern") ? ' looks like the right department for this concern.' : '.'}";
} else if (match?.key === "emergency_medicine") {
  vars.${textVar} = "The concern sounds urgent. Please use the emergency support options below instead of a routine appointment booking.";
} else {
  vars.${textVar} = "I could not confidently match the concern to one department. Please choose the closest department so I can continue.";
}
return { route: vars.${routeVar}, matched_department: match?.key || "", raw };
`;
}

function buildAppointmentAiMatchPrepareScript() {
  return `
function normalizeText(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
}
const catalog = Array.isArray(vars.appointment_department_catalog_rows) ? vars.appointment_department_catalog_rows : [];
const raw = String(vars.appointment_department_ai_raw_match || vars.appointment_department_ai_match_result || "").trim();
const normalized = normalizeText(raw);
let match = null;
if (["emergency", "emergency_medicine", "urgent", "ambulance", "er"].includes(normalized)) {
  match = { key: "emergency_medicine", label: "Emergency Medicine" };
} else {
  for (const item of catalog) {
    const labelNormalized = normalizeText(item.label || "");
    if (normalized === item.key || normalized === labelNormalized || (Array.isArray(item.aliases) && item.aliases.includes(normalized))) {
      match = item;
      break;
    }
  }
}
vars.appointment_department_ai_route = match?.key === "emergency_medicine" ? "emergency" : (match ? "matched" : "manual");
if (match && match.key !== "emergency_medicine") {
  vars.department = match.key;
  vars.availability_department = match.key;
  vars.appointment_department_match_text = "Based on what you described, " + String(match.label || match.key) + " looks like the right department for this concern. I will continue with the booking.";
} else if (match?.key === "emergency_medicine") {
  vars.appointment_department_match_text = "The concern sounds urgent. Please use the emergency support options below instead of a routine appointment booking.";
} else {
  vars.appointment_department_match_text = "I could not confidently match the concern to one department. Please choose the closest department so I can continue with the booking.";
}
return { route: vars.appointment_department_ai_route, matched_department: match?.key || "", raw };
`;
}

function buildAppointmentManualPrepareScript() {
  return `
${buildResolveScript({
    inputVar: "appointment_department_manual_choice",
    catalogVar: "appointment_department_catalog_rows",
    resolvedVar: "appointment_department_manual_resolved_key",
    labelVar: "appointment_department_manual_selected_label",
    includeNotSure: false
  })}
const key = String(vars.appointment_department_manual_resolved_key || "").trim();
if (key === "emergency_medicine") {
  vars.appointment_department_manual_route = "emergency";
  return { route: vars.appointment_department_manual_route };
}
if (key) {
  vars.department = key;
  vars.availability_department = key;
  vars.appointment_department_match_text = "I will continue the booking in " + String(vars.appointment_department_manual_selected_label || key) + ".";
  vars.appointment_department_manual_route = "matched";
  return { route: vars.appointment_department_manual_route, department: key };
}
vars.appointment_department_manual_route = "invalid";
return { route: vars.appointment_department_manual_route };
`;
}

function buildDepartmentHelpManualPrepareScript() {
  return `
${buildResolveScript({
    inputVar: "department_help_manual_choice",
    catalogVar: "department_help_department_catalog_rows",
    resolvedVar: "department_help_manual_resolved_key",
    labelVar: "department_help_manual_selected_label",
    includeNotSure: false
  })}
const key = String(vars.department_help_manual_resolved_key || "").trim();
if (key === "emergency_medicine") {
  vars.department_help_manual_route = "emergency";
  return { route: vars.department_help_manual_route };
}
if (key) {
  vars.department = key;
  vars.availability_department = key;
  vars.department_help_match_text = "I will now show the available doctors in " + String(vars.department_help_manual_selected_label || key) + ".";
  vars.department_help_manual_route = "matched";
  return { route: vars.department_help_manual_route, department: key };
}
vars.department_help_manual_route = "invalid";
return { route: vars.department_help_manual_route };
`;
}

function buildSimpleDepartmentPrepareScript({ inputVar, catalogVar, resolvedVar, labelVar, routeVar, outputDepartmentVar }) {
  return `
${buildResolveScript({ inputVar, catalogVar, resolvedVar, labelVar, includeNotSure: false })}
const key = String(vars.${resolvedVar} || "").trim();
if (key === "emergency_medicine") {
  vars.${routeVar} = "emergency";
  return { route: vars.${routeVar} };
}
if (key) {
  vars.${outputDepartmentVar} = key;
  return { route: vars.${routeVar} = "matched", department: key };
}
vars.${routeVar} = "invalid";
return { route: vars.${routeVar} };
`;
}

function setInputNode(id, variable, message) {
  const node = getNode(id);
  node.data = { ...node.data, buttons: [], messages: [message], variable };
}

setInputNode(
  "appointment_department_input",
  "appointment_department_choice",
  "Choose the department for this appointment.\\n\\n{{appointment_department_options_text}}\\n\\nType the option number. If you are not sure, choose the last option or describe the concern in your own words."
);
setInputNode(
  "appointment_department_manual_input",
  "appointment_department_manual_choice",
  "I could not confidently map the concern to one department. Please choose the closest department.\\n\\n{{appointment_department_options_text}}\\n\\nType the option number or department name."
);
setInputNode(
  "department_choice_input",
  "department_help_manual_choice",
  "I could not confidently map the concern to one department. Please choose the closest department so I can continue.\\n\\n{{department_help_department_options_text}}\\n\\nType the option number or department name."
);
setInputNode(
  "availability_department_input",
  "availability_department_choice",
  "Choose a department to see available doctors in this branch.\\n\\n{{availability_department_options_text}}\\n\\nType the option number or department name."
);
setInputNode(
  "doctor_profile_department_input",
  "doctor_profile_department_choice",
  "Choose a department to see available doctors in this branch.\\n\\n{{doctor_profile_department_options_text}}\\n\\nType the option number or department name."
);
setInputNode(
  "online_symptom_form",
  "online_department_choice",
  "Choose the department for the online consultation.\\n\\n{{online_department_options_text}}\\n\\nType the option number or department name."
);

getNode("appointment_department_prepare").data.script = buildAppointmentDepartmentPrepareScript();
getNode("appointment_department_ai_match").data = {
  ...getNode("appointment_department_ai_match").data,
  contextTemplate: "{{appointment_department_ai_context_text}}",
  inputTemplate: "{{department_reason}}",
  instructions:
    "Review the patient concern using only the routing context. Return exactly one routine department key or emergency_medicine for urgent conditions. If the concern is too broad or lacks enough detail for a specialty, return general_medicine when that key exists; otherwise return the closest configured routine department key. Do not add explanation.",
  emitResponse: false
};
getNode("appointment_department_match_prepare").data.script = buildAppointmentAiMatchPrepareScript();
getNode("department_help_ai_match").data = {
  ...getNode("department_help_ai_match").data,
  contextTemplate: "{{department_help_ai_context_text}}",
  inputTemplate: "{{department_reason}}",
  instructions:
    "Review the patient concern using only the routing context. Return exactly one routine department key or emergency_medicine for urgent conditions. If the concern is too broad or lacks enough detail for a specialty, return general_medicine when that key exists; otherwise return the closest configured routine department key. Do not add explanation.",
  emitResponse: false
};
getNode("department_help_match_prepare").data.script = `
function normalizeText(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
}
const catalog = Array.isArray(vars.department_help_department_catalog_rows) ? vars.department_help_department_catalog_rows : [];
const raw = String(vars.department_help_ai_raw_match || vars.department_help_ai_match_result || "").trim();
const normalized = normalizeText(raw);
let match = null;
if (["emergency", "emergency_medicine", "urgent", "ambulance", "er"].includes(normalized)) {
  match = { key: "emergency_medicine", label: "Emergency Medicine" };
} else {
  for (const item of catalog) {
    const labelNormalized = normalizeText(item.label || "");
    if (normalized === item.key || normalized === labelNormalized || (Array.isArray(item.aliases) && item.aliases.includes(normalized))) {
      match = item;
      break;
    }
  }
}
vars.department_help_matched_department = match?.key || "";
vars.department_help_route = match?.key === "emergency_medicine" ? "emergency" : (match ? "matched" : "manual");
if (match && match.key !== "emergency_medicine") {
  vars.department = match.key;
  vars.availability_department = match.key;
  vars.department_help_match_text = "Based on what you described, " + String(match.label || match.key) + " looks like the right department for this concern. I will now show the available doctors.";
} else if (match?.key === "emergency_medicine") {
  vars.department_help_match_text = "The concern sounds urgent. Please use the emergency support options below instead of a routine appointment booking.";
} else {
  vars.department_help_match_text = "I could not confidently match the concern to one department. Please choose the closest department so I can continue.";
}
return { route: vars.department_help_route, matched_department: match?.key || "", raw };
`;
getNode("department_help_manual_prepare").data.script = buildDepartmentHelpManualPrepareScript();

getNode("appointment_prepare_scope").data.script = `
function normalizeKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
}
function normalizeBranchLookup(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}
const branchAliases = {
  jubilee: "jubilee_hills_branch",
  "jubilee hills": "jubilee_hills_branch",
  miyapur: "miyapur_branch",
  kukatpally: "kukatpally_branch",
  madeenaguda: "madeenaguda_branch"
};
const normalizedBranch = branchAliases[normalizeBranchLookup(vars.branch_id || "")] || normalizeKey(vars.branch_id || "");
const normalizedDepartment = normalizeKey(vars.department || vars.availability_department || "");
vars.branch_id = normalizedBranch;
if (normalizedDepartment) {
  vars.department = normalizedDepartment;
  vars.availability_department = normalizedDepartment;
}
vars.doctor_scope_branch_id = String(vars.consultation_type || "").trim() === "online" ? "online" : normalizedBranch;
return {
  branch_id: vars.branch_id,
  doctor_scope_branch_id: vars.doctor_scope_branch_id,
  department: vars.department,
  availability_department: vars.availability_department
};
`;

upsertNode(listDepartmentsNode("appointment_departments_fetch", "appointment_departments_result", 18740, 4624));
upsertNode({
  id: "appointment_departments_catalog_prepare",
  type: "script",
  position: { x: 19080, y: 4624 },
  data: {
    outputVar: "appointment_departments_catalog_prepare_result",
    timeoutMs: 100,
    script: buildCatalogPrepareScript({
      resultVar: "appointment_departments_result",
      catalogVar: "appointment_department_catalog_rows",
      optionsVar: "appointment_department_options_text",
      aiContextVar: "appointment_department_ai_context_text",
      onlineOnly: false,
      includeNotSure: true
    })
  }
});
upsertNode({
  id: "appointment_department_manual_prepare",
  type: "script",
  position: { x: 21428, y: 4460 },
  data: {
    outputVar: "appointment_department_manual_prepare_result",
    timeoutMs: 100,
    script: buildAppointmentManualPrepareScript()
  }
});
upsertNode({
  id: "appointment_department_manual_route",
  type: "switch",
  position: { x: 21668, y: 4460 },
  data: { variable: "appointment_department_manual_route" }
});
upsertNode({
  id: "appointment_department_manual_invalid_message",
  type: "message",
  position: { x: 21928, y: 4620 },
  data: {
    buttons: [],
    messages: [
      {
        type: "text",
        text: "I could not match that selection to a configured department. Please start a fresh appointment request so I can show the latest department list."
      }
    ]
  }
});
upsertNode({
  id: "appointment_department_manual_invalid_end",
  type: "end",
  position: { x: 22188, y: 4620 },
  data: { title: "Appointment department not resolved" }
});

upsertNode(listDepartmentsNode("department_help_departments_fetch", "department_help_departments_result", 6488, 5510));
upsertNode({
  id: "department_help_departments_catalog_prepare",
  type: "script",
  position: { x: 6668, y: 5510 },
  data: {
    outputVar: "department_help_departments_catalog_prepare_result",
    timeoutMs: 100,
    script: buildCatalogPrepareScript({
      resultVar: "department_help_departments_result",
      catalogVar: "department_help_department_catalog_rows",
      optionsVar: "department_help_department_options_text",
      aiContextVar: "department_help_ai_context_text",
      onlineOnly: false,
      includeNotSure: false
    })
  }
});
upsertNode({
  id: "department_help_manual_route",
  type: "switch",
  position: { x: 7528, y: 5850 },
  data: { variable: "department_help_manual_route" }
});
upsertNode({
  id: "department_help_manual_invalid_message",
  type: "message",
  position: { x: 7768, y: 6008 },
  data: {
    buttons: [],
    messages: [
      {
        type: "text",
        text: "I could not match that selection to a configured department. Please start again so I can show the latest department list."
      }
    ]
  }
});
upsertNode({
  id: "department_help_manual_invalid_end",
  type: "end",
  position: { x: 8008, y: 6008 },
  data: { title: "Department guidance not resolved" }
});

upsertNode(listDepartmentsNode("availability_departments_fetch", "availability_departments_result", 6840, 3811));
upsertNode({
  id: "availability_departments_catalog_prepare",
  type: "script",
  position: { x: 7060, y: 3811 },
  data: {
    outputVar: "availability_departments_catalog_prepare_result",
    timeoutMs: 100,
    script: buildCatalogPrepareScript({
      resultVar: "availability_departments_result",
      catalogVar: "availability_department_catalog_rows",
      optionsVar: "availability_department_options_text",
      aiContextVar: "availability_department_ai_context_text",
      onlineOnly: false,
      includeNotSure: false
    })
  }
});
upsertNode({
  id: "availability_department_prepare",
  type: "script",
  position: { x: 7480, y: 3811 },
  data: {
    outputVar: "availability_department_prepare_result",
    timeoutMs: 100,
    script: buildSimpleDepartmentPrepareScript({
      inputVar: "availability_department_choice",
      catalogVar: "availability_department_catalog_rows",
      resolvedVar: "availability_department_resolved_key",
      labelVar: "availability_department_selected_label",
      routeVar: "availability_department_route",
      outputDepartmentVar: "availability_department"
    })
  }
});
upsertNode({
  id: "availability_department_route",
  type: "switch",
  position: { x: 7720, y: 3811 },
  data: { variable: "availability_department_route" }
});
upsertNode({
  id: "availability_department_invalid_message",
  type: "message",
  position: { x: 7960, y: 3970 },
  data: {
    buttons: [],
    messages: [
      {
        type: "text",
        text: "I could not match that selection to a configured department in this hospital. Please start again and choose one of the listed options."
      }
    ]
  }
});
upsertNode({
  id: "availability_department_invalid_end",
  type: "end",
  position: { x: 8200, y: 3970 },
  data: { title: "Availability department not resolved" }
});

upsertNode(listDepartmentsNode("doctor_profile_departments_fetch", "doctor_profile_departments_result", 6940, 4519));
upsertNode({
  id: "doctor_profile_departments_catalog_prepare",
  type: "script",
  position: { x: 7140, y: 4519 },
  data: {
    outputVar: "doctor_profile_departments_catalog_prepare_result",
    timeoutMs: 100,
    script: buildCatalogPrepareScript({
      resultVar: "doctor_profile_departments_result",
      catalogVar: "doctor_profile_department_catalog_rows",
      optionsVar: "doctor_profile_department_options_text",
      aiContextVar: "doctor_profile_department_ai_context_text",
      onlineOnly: false,
      includeNotSure: false
    })
  }
});
upsertNode({
  id: "doctor_profile_department_prepare",
  type: "script",
  position: { x: 7480, y: 4519 },
  data: {
    outputVar: "doctor_profile_department_prepare_result",
    timeoutMs: 100,
    script: buildSimpleDepartmentPrepareScript({
      inputVar: "doctor_profile_department_choice",
      catalogVar: "doctor_profile_department_catalog_rows",
      resolvedVar: "doctor_profile_department_resolved_key",
      labelVar: "doctor_profile_department_selected_label",
      routeVar: "doctor_profile_department_route",
      outputDepartmentVar: "doctor_profile_department"
    })
  }
});
upsertNode({
  id: "doctor_profile_department_route",
  type: "switch",
  position: { x: 7720, y: 4519 },
  data: { variable: "doctor_profile_department_route" }
});
upsertNode({
  id: "doctor_profile_department_invalid_message",
  type: "message",
  position: { x: 7960, y: 4680 },
  data: {
    buttons: [],
    messages: [
      {
        type: "text",
        text: "I could not match that selection to a configured department in this branch. Please start again and choose one of the listed options."
      }
    ]
  }
});
upsertNode({
  id: "doctor_profile_department_invalid_end",
  type: "end",
  position: { x: 8200, y: 4680 },
  data: { title: "Doctor profile department not resolved" }
});

upsertNode(listDepartmentsNode("online_departments_fetch", "online_departments_result", 11260, 7210));
upsertNode({
  id: "online_departments_catalog_prepare",
  type: "script",
  position: { x: 11580, y: 7210 },
  data: {
    outputVar: "online_departments_catalog_prepare_result",
    timeoutMs: 100,
    script: buildCatalogPrepareScript({
      resultVar: "online_departments_result",
      catalogVar: "online_department_catalog_rows",
      optionsVar: "online_department_options_text",
      aiContextVar: "online_department_ai_context_text",
      onlineOnly: true,
      includeNotSure: false
    })
  }
});
upsertNode({
  id: "online_department_prepare",
  type: "script",
  position: { x: 12160, y: 7210 },
  data: {
    outputVar: "online_department_prepare_result",
    timeoutMs: 100,
    script: buildSimpleDepartmentPrepareScript({
      inputVar: "online_department_choice",
      catalogVar: "online_department_catalog_rows",
      resolvedVar: "online_department_resolved_key",
      labelVar: "online_department_selected_label",
      routeVar: "online_department_route",
      outputDepartmentVar: "availability_department"
    })
  }
});
upsertNode({
  id: "online_department_route",
  type: "switch",
  position: { x: 12400, y: 7210 },
  data: { variable: "online_department_route" }
});
upsertNode({
  id: "online_department_invalid_message",
  type: "message",
  position: { x: 12640, y: 7370 },
  data: {
    buttons: [],
    messages: [
      {
        type: "text",
        text: "I could not match that selection to a configured online consultation department. Please start again and choose one of the listed options."
      }
    ]
  }
});
upsertNode({
  id: "online_department_invalid_end",
  type: "end",
  position: { x: 12880, y: 7370 },
  data: { title: "Online department not resolved" }
});

removeEdges(
  (edge) =>
    (edge.source === "appointment_consultation_type_input" && edge.target === "appointment_department_input") ||
    (edge.source === "appointment_department_ai_route" && edge.target === "appointment_department_manual_input") ||
    edge.source === "appointment_department_manual_input" ||
    (edge.source === "department_reason_input" && edge.target === "department_help_ai_match") ||
    (edge.source === "department_help_route" && edge.target === "department_choice_input") ||
    edge.source === "department_choice_input" ||
    (edge.source === "availability_entry_branch_input" && edge.target === "availability_department_input") ||
    (edge.source === "availability_department_input" && edge.target === "availability_branch_doctor_list") ||
    (edge.source === "doctor_profile_input" && edge.target === "doctor_profile_department_input") ||
    (edge.source === "doctor_profile_department_input" && edge.target === "doctor_profile_lookup") ||
    (edge.source === "online_booking_defaults" && edge.target === "online_symptom_form") ||
    (edge.source === "online_symptom_form" && edge.target === "online_record") ||
    (edge.source === "appointment_department_route" && edge.target === "emergency_safety_message")
);

[
  makeEdge("appointment_consultation_type_input", "appointment_departments_fetch", {
    id: "edge_appointment_consultation_type_input_appointment_departments_fetch"
  }),
  makeEdge("appointment_departments_fetch", "appointment_departments_catalog_prepare", {
    id: "edge_appointment_departments_fetch_appointment_departments_catalog_prepare"
  }),
  makeEdge("appointment_departments_catalog_prepare", "appointment_department_input", {
    id: "edge_appointment_departments_catalog_prepare_appointment_department_input"
  }),
  makeEdge("appointment_department_route", "emergency_safety_message", {
    id: "edge_appointment_department_route_emergency_safety_message",
    label: "emergency",
    condition: { value: "emergency", operator: "equals" }
  }),
  makeEdge("appointment_department_ai_route", "appointment_department_manual_input", {
    id: "edge_appointment_department_ai_route_appointment_department_manual_input",
    isDefault: true
  }),
  makeEdge("appointment_department_manual_input", "appointment_department_manual_prepare"),
  makeEdge("appointment_department_manual_prepare", "appointment_department_manual_route"),
  makeEdge("appointment_department_manual_route", "appointment_prepare_scope", {
    label: "matched",
    condition: { value: "matched", operator: "equals" }
  }),
  makeEdge("appointment_department_manual_route", "emergency_safety_message", {
    label: "emergency",
    condition: { value: "emergency", operator: "equals" }
  }),
  makeEdge("appointment_department_manual_route", "appointment_department_manual_invalid_message", {
    isDefault: true
  }),
  makeEdge("appointment_department_manual_invalid_message", "appointment_department_manual_invalid_end"),
  makeEdge("department_reason_input", "department_help_departments_fetch"),
  makeEdge("department_help_departments_fetch", "department_help_departments_catalog_prepare"),
  makeEdge("department_help_departments_catalog_prepare", "department_help_ai_match"),
  makeEdge("department_help_route", "department_choice_input", {
    isDefault: true
  }),
  makeEdge("department_choice_input", "department_help_manual_prepare"),
  makeEdge("department_help_manual_prepare", "department_help_manual_route"),
  makeEdge("department_help_manual_route", "department_safe_message", {
    label: "matched",
    condition: { value: "matched", operator: "equals" }
  }),
  makeEdge("department_help_manual_route", "emergency_safety_message", {
    label: "emergency",
    condition: { value: "emergency", operator: "equals" }
  }),
  makeEdge("department_help_manual_route", "department_help_manual_invalid_message", {
    isDefault: true
  }),
  makeEdge("department_help_manual_invalid_message", "department_help_manual_invalid_end"),
  makeEdge("availability_entry_branch_input", "availability_departments_fetch"),
  makeEdge("availability_departments_fetch", "availability_departments_catalog_prepare"),
  makeEdge("availability_departments_catalog_prepare", "availability_department_input"),
  makeEdge("availability_department_input", "availability_department_prepare"),
  makeEdge("availability_department_prepare", "availability_department_route"),
  makeEdge("availability_department_route", "availability_branch_doctor_list", {
    label: "matched",
    condition: { value: "matched", operator: "equals" }
  }),
  makeEdge("availability_department_route", "emergency_safety_message", {
    label: "emergency",
    condition: { value: "emergency", operator: "equals" }
  }),
  makeEdge("availability_department_route", "availability_department_invalid_message", {
    isDefault: true
  }),
  makeEdge("availability_department_invalid_message", "availability_department_invalid_end"),
  makeEdge("doctor_profile_input", "doctor_profile_departments_fetch"),
  makeEdge("doctor_profile_departments_fetch", "doctor_profile_departments_catalog_prepare"),
  makeEdge("doctor_profile_departments_catalog_prepare", "doctor_profile_department_input"),
  makeEdge("doctor_profile_department_input", "doctor_profile_department_prepare"),
  makeEdge("doctor_profile_department_prepare", "doctor_profile_department_route"),
  makeEdge("doctor_profile_department_route", "doctor_profile_lookup", {
    label: "matched",
    condition: { value: "matched", operator: "equals" }
  }),
  makeEdge("doctor_profile_department_route", "emergency_safety_message", {
    label: "emergency",
    condition: { value: "emergency", operator: "equals" }
  }),
  makeEdge("doctor_profile_department_route", "doctor_profile_department_invalid_message", {
    isDefault: true
  }),
  makeEdge("doctor_profile_department_invalid_message", "doctor_profile_department_invalid_end"),
  makeEdge("online_booking_defaults", "online_departments_fetch"),
  makeEdge("online_departments_fetch", "online_departments_catalog_prepare"),
  makeEdge("online_departments_catalog_prepare", "online_symptom_form"),
  makeEdge("online_symptom_form", "online_department_prepare"),
  makeEdge("online_department_prepare", "online_department_route"),
  makeEdge("online_department_route", "online_record", {
    label: "matched",
    condition: { value: "matched", operator: "equals" }
  }),
  makeEdge("online_department_route", "emergency_safety_message", {
    label: "emergency",
    condition: { value: "emergency", operator: "equals" }
  }),
  makeEdge("online_department_route", "online_department_invalid_message", {
    isDefault: true
  }),
  makeEdge("online_department_invalid_message", "online_department_invalid_end")
].forEach(ensureEdge);

document.metadata = document.metadata || {};
document.metadata.departmentCatalogSource = "departments_collection";
document.metadata.departmentCatalogNotes =
  "Department pickers now read from the departments collection and resolve numbered or text selections across booking, guidance, availability, doctor profile, and online consultation journeys.";
document.metadata.nodeCount = flow.nodes.length;
document.metadata.edgeCount = flow.edges.length;

const tempPath = `${sourcePath}.tmp`;
fs.writeFileSync(tempPath, JSON.stringify(document, null, 2) + "\n");
console.log(`Wrote ${tempPath} with ${flow.nodes.length} nodes and ${flow.edges.length} edges.`);
