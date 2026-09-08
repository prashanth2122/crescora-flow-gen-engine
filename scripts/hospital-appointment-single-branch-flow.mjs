import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  normalizeNotificationFlow,
  notificationData as buildNotificationData
} from "./notification-data.mjs";

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const domainRoot = join(rootDir, "domains", "hospital");
const baseSourcePath = join(
  domainRoot,
  "templates-source",
  "hospital-full-automation.source.flow.json"
);
const baseExportFallbackPath = join(
  domainRoot,
  "templates",
  "hospital-full-automation.flow.json"
);
export const outputPath = join(
  domainRoot,
  "templates",
  "assai-deepa-hospital-appointment-single-branch.flow.json"
);
const DOMAIN_RECORD_SCHEMA = "healthcare";

// FLOW input buttons do not support a dynamic button source or a native icon
// field. Keep this deterministic export-time presentation list in sync with
// the verified Sai Deepa catalog; the runtime DB catalog remains authoritative
// for validation and selection routing. The final item is a routing action, not
// a department record.
const SAI_DEEPA_SUPPORTED_DEPARTMENT_KEYS = [
  "cardiology",
  "ent",
  "general_medicine",
  "general_surgery",
  "neuro_physiotherapy",
  "neurology",
  "obstetrics_gynecology",
  "orthopedics",
  "psychiatry",
  "pulmonology",
  "urology",
  "vascular_surgery"
];
const SAI_DEEPA_DEPARTMENT_BUTTONS = [
  ["❤️ Cardiology", "cardiology"],
  ["👂 ENT", "ent"],
  ["🩺 General Medicine", "general_medicine"],
  ["🏥 General Surgery", "general_surgery"],
  ["🧠 Neurology", "neurology"],
  ["🦴 Orthopedics", "orthopedics"],
  ["🫁 Pulmonology", "pulmonology"],
  ["👩‍⚕️ Obstetrics & Gynecology", "obstetrics_gynecology"],
  ["🧠 Psychiatry", "psychiatry"],
  ["🩻 Neuro Physiotherapy", "neuro_physiotherapy"],
  ["🚹 Urology", "urology"],
  ["🩸 Vascular Surgery", "vascular_surgery"]
];

function deepClone(value) {
  return structuredClone(value);
}

function getNodeMap(doc) {
  return new Map(doc.flow.nodes.map((node) => [node.id, node]));
}

function findNode(doc, id) {
  const node = getNodeMap(doc).get(id);
  if (!node) {
    throw new Error(`Missing node ${id}`);
  }
  return node;
}

function upsertNode(doc, node) {
  const index = doc.flow.nodes.findIndex((item) => item.id === node.id);
  if (index >= 0) {
    doc.flow.nodes[index] = node;
    return;
  }
  doc.flow.nodes.push(node);
}

function removeEdges(doc, predicate) {
  doc.flow.edges = doc.flow.edges.filter((edge) => !predicate(edge));
}

function addEdge(doc, edge) {
  removeEdges(doc, (item) => item.id === edge.id);
  doc.flow.edges.push({ type: "smoothstep", ...edge });
}

function replaceOutgoing(doc, sourceId, newEdges) {
  removeEdges(doc, (edge) => edge.source === sourceId);
  for (const edge of newEdges) {
    addEdge(doc, { source: sourceId, ...edge });
  }
}

function replaceEdgeTarget(doc, edgeId, nextTarget) {
  const edge = doc.flow.edges.find((item) => item.id === edgeId);
  if (!edge) {
    throw new Error(`Missing edge ${edgeId}`);
  }
  edge.target = nextTarget;
}

function appendAssignment(node, key, value) {
  node.data.assignments = Array.isArray(node.data.assignments)
    ? node.data.assignments
    : [];
  const existing = node.data.assignments.find((item) => item.key === key);
  if (existing) {
    existing.value = value;
    return;
  }
  node.data.assignments.push({ key, value });
}

function placeScriptAssignmentBeforeReturn(node, statement) {
  const script = String(node.data.script || "")
    .split("\n")
    .filter((line) => line.trim() !== statement)
    .join("\n");
  const returnIndex = script.indexOf("return {");
  if (returnIndex < 0) {
    throw new Error(`Script node ${node.id} must contain a return object`);
  }
  node.data.script = `${script.slice(0, returnIndex)}${statement}\n${script.slice(returnIndex)}`;
}

function setGlobal(doc, key, value) {
  doc.bot.globalVariables = Array.isArray(doc.bot.globalVariables)
    ? doc.bot.globalVariables
    : [];
  const existing = doc.bot.globalVariables.find((item) => item.key === key);
  if (existing) {
    existing.value = value;
    return;
  }
  doc.bot.globalVariables.push({ key, value });
}

function applyDomainRecordSchema(doc) {
  for (const node of doc.flow?.nodes ?? []) {
    if (node?.type === "record") {
      node.data = {
        ...node.data,
        schemaName: node.data?.schemaName || DOMAIN_RECORD_SCHEMA
      };
    }
  }
}

function configureScheduleExceptionScript(node, exceptionResultVar) {
  let script = String(node.data?.script || "");
  const exceptionMarker = `const exceptions = rowsFrom(vars.${exceptionResultVar});`;
  if (!script.includes(exceptionMarker)) {
    throw new Error(`Availability node ${node.id} is missing ${exceptionMarker}`);
  }

  script = script.replace(
    exceptionMarker,
    `${exceptionMarker}
const exceptionIsActive = (exception) =>
  String(exception.is_active ?? "true").toLowerCase() !== "false" &&
  !String(exception.deleted_at ?? exception.deletedAt ?? "").trim();
const boundaryMinutes = (value, fallback) => {
  if (String(value || "").trim() === "24:00") return 24 * 60;
  const parsed = toMinutes(value);
  return parsed == null ? fallback : parsed;
};
const isBlockingException = (exception) => ["block", "unavailable", "leave", "closed", "holiday", "personal_leave", "sick_leave", "vacation"].includes(
  String(exception.exception_type || "").trim().toLowerCase()
);`
  );
  script = script
    .replace(
      'if (exceptionType !== "add") continue;',
      'if (!["add", "available", "open", "override"].includes(exceptionType)) continue;'
    )
    .replace(
      'if (String(exception.is_active ?? "true").toLowerCase() === "false") continue;',
      'if (!exceptionIsActive(exception)) continue;'
    )
    .replaceAll(
      'doctor_id: rule.doctor_id || vars.doctor_id || vars.reschedule_original_doctor_id || "",',
      'doctor_id: rule.doctor_id || vars.doctor_id || vars.reschedule_original_doctor_id || "",\n        doctor_scope_key: rule.doctor_scope_key || vars.appointment_selected_doctor_scope_key || vars.reschedule_original_doctor_scope_key || "",'
    )
    .replaceAll(
      'doctor_id: exception.doctor_id || vars.doctor_id || vars.reschedule_original_doctor_id || "",',
      'doctor_id: exception.doctor_id || vars.doctor_id || vars.reschedule_original_doctor_id || "",\n      doctor_scope_key: exception.doctor_scope_key || vars.appointment_selected_doctor_scope_key || vars.reschedule_original_doctor_scope_key || "",'
    )
    .replace(
      'const blocked = exceptions.filter((exception) => String(exception.exception_type || "").toLowerCase() === "block");',
      'const blocked = exceptions.filter((exception) => exceptionIsActive(exception) && isBlockingException(exception));'
    )
    .replace(
      'if (String(item.doctor_id || "") !== String(slot.doctor_id || "")) return false;',
      'const itemScopeKey = String(item.doctor_scope_key || "").trim();\n    if (itemScopeKey && itemScopeKey !== String(slot.doctor_scope_key || "") && itemScopeKey !== String(vars.appointment_selected_doctor_scope_key || "")) return false;\n    const itemDoctorId = String(item.doctor_id || "").trim();\n    if (itemDoctorId && itemDoctorId !== String(slot.doctor_id || "")) return false;'
    )
    .replace(
      'const blockStart = toMinutes(item.start_time || "00:00");\n    const blockEnd = toMinutes(item.end_time || "23:59");',
      'const allDay = String(item.all_day ?? "false").toLowerCase() === "true";\n    const blockStart = allDay ? 0 : boundaryMinutes(item.start_time || "00:00", 0);\n    const blockEnd = allDay ? 24 * 60 : boundaryMinutes(item.end_time || "24:00", 24 * 60);'
    );

  if (!script.includes("const isBlockingException") || !script.includes("itemScopeKey")) {
    throw new Error(`Availability node ${node.id} could not be configured for schedule exceptions`);
  }
  node.data.script = script;
}

function replyButton(label, value) {
  return {
    label,
    value,
    actionType: "reply",
    url: "",
    phone: ""
  };
}

function phoneButton(label, phone) {
  return {
    label,
    value: "call",
    actionType: "phone",
    url: "",
    phone
  };
}

function dynamicCarouselNode(id, position, introText, slidesSource, slideTemplate) {
  return {
    id,
    type: "carousel",
    position,
    data: {
      introText,
      slides: [],
      slidesJson: "[]",
      slidesMode: "dynamic",
      slidesSource,
      designPreset: "modern",
      cardLayout: "spotlight",
      cardSize: "comfortable",
      showPagination: true,
      autoAdvanceMs: 0,
      customCss: "",
      slideTemplate,
      slideTemplateJson: JSON.stringify(slideTemplate, null, 2)
    }
  };
}

function staticCarouselNode(id, position, introText, slides) {
  return {
    id,
    type: "carousel",
    position,
    data: {
      introText,
      slidesMode: "static",
      designPreset: "modern",
      cardLayout: "spotlight",
      cardSize: "comfortable",
      showPagination: true,
      autoAdvanceMs: 0,
      customCss: "",
      slides,
      slidesJson: JSON.stringify(slides, null, 2),
      slidesSource: "",
      slideTemplate: {},
      slideTemplateJson: "{}"
    }
  };
}

function inputNode(id, position, message, variable, buttons = [], disableChatInput = false) {
  return {
    id,
    type: "input",
    position,
    data: {
      buttons,
      messages: [message],
      variable,
      disableChatInput
    }
  };
}

function messageNode(id, position, text) {
  return {
    id,
    type: "message",
    position,
    data: {
      buttons: [],
      messages: [{ type: "text", text }]
    }
  };
}

function setVariableNode(id, position, assignments) {
  return {
    id,
    type: "setVariable",
    position,
    data: {
      assignments: assignments.map(([key, value]) => ({ key, value }))
    }
  };
}

function switchNode(id, position, variable) {
  return {
    id,
    type: "switch",
    position,
    data: { variable }
  };
}

function scriptNode(id, position, script, outputVar) {
  return {
    id,
    type: "script",
    position,
    data: {
      script,
      outputVar,
      timeoutMs: 100
    }
  };
}

function notificationNode(id, position, payload) {
  return {
    id,
    type: "notification",
    position,
    data: buildNotificationData(payload)
  };
}

function templateMessageNode(id, position, templateName, outputVar) {
  const variables = {
    "1": "{{patient_name}}",
    "2": "{{appointment_scheduled_at}}",
    "3": "{{hospital_name}}"
  };
  return {
    id,
    type: "template-message",
    position,
    data: {
      channel: "whatsapp",
      templateName,
      language: "{{whatsapp_template_language}}",
      variables,
      variablesJson: JSON.stringify(variables, null, 2),
      to: "{{patient_mobile}}",
      category: "transactional",
      approvedTemplates: [templateName],
      approvedTemplatesCsv: templateName,
      requiresMediaHeader: false,
      mediaHeader: "",
      outputVar
    }
  };
}

function formatDoctorLabelScript({
  useDepartmentFilter,
  optionsVar,
  promptVar,
  routeVar,
  sourceVar,
  includeBranchLabel = false,
  carouselSlidesVar = "appointment_doctor_carousel_slides"
}) {
  const departmentFilter = useDepartmentFilter
    ? `  if (expectedDepartment && String(row.department || "").trim().toLowerCase() !== expectedDepartment) return false;
`
    : "";
  const branchSegment = includeBranchLabel
    ? ` + " | " + (row.branch_name || titleCase(row.branch_id || ""))`
    : "";
  return String.raw`
function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}
function titleCase(value) {
  return String(value || "")
    .replace(/[_-]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.toLowerCase() === "ent" ? "ENT" : part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
function departmentLabel(value) {
  const raw = String(value || "").trim();
  if (!raw) return "Department";
  if (raw.toLowerCase() === "ent") return "ENT";
  return titleCase(raw);
}
function consultationLabel(value) {
  const raw = String(value || "").trim().toLowerCase();
  if (raw === "online") return "Online consultation";
  if (raw === "in_person") return "In-person consultation";
  return titleCase(raw);
}

function matchesExpectedDoctorContext(row) {
  const expectedDepartment = String(vars.department || "").trim().toLowerCase();
  const expectedBranch = String(vars.doctor_scope_branch_id || vars.branch_id || "").trim().toLowerCase();
  const expectedMode = String(vars.consultation_type || "").trim().toLowerCase();
  if (String(row.is_active ?? "true").toLowerCase() === "false") return false;
  if (String(row.booking_enabled ?? "true").toLowerCase() === "false") return false;
${departmentFilter}  if (expectedBranch && String(row.branch_id || "").trim().toLowerCase() !== expectedBranch) return false;
  if (expectedMode && String(row.consultation_mode || "").trim().toLowerCase() !== expectedMode) return false;
  return true;
}

const rows = Array.isArray(vars.${sourceVar}?.data) ? vars.${sourceVar}.data : [];
const unique = [];
const seen = new Set();
for (const row of rows.filter(matchesExpectedDoctorContext)) {
  const key = String(row.doctor_scope_key || row.doctor_id || "").trim();
  if (!key || seen.has(key)) continue;
  seen.add(key);
  unique.push(row);
}
unique.sort((a, b) => String(a.display_name || a.doctor_id || "").localeCompare(String(b.display_name || b.doctor_id || "")));
function feeValue(row) {
  const rupees = row.consultation_fee != null
    ? Number(row.consultation_fee)
    : Number(row.consultation_fee_paise || 0) / 100;
  return Number.isFinite(rupees) && rupees > 0 ? rupees : 0;
}
function feeLabel(row) {
  const rupees = feeValue(row);
  return rupees > 0 ? "₹" + rupees.toLocaleString("en-IN") : "To be confirmed";
}
function experienceLabel(row) {
  return String(row.experience_label || row.experience || "Experience not provided").trim();
}
function languageLabel(row) {
  return Array.isArray(row.languages) && row.languages.length > 0
    ? row.languages.join(", ")
    : String(row.languages || "Language support available").trim();
}
vars.${optionsVar} = unique.map((row, index) => {
  const department = departmentLabel(row.department_display_name || row.department);
  const fee = row.consultation_fee_display
    ? " | Fee " + row.consultation_fee_display
    : Number(row.consultation_fee || row.consultation_fee_paise || 0) > 0
      ? " | Fee INR " + (Number(row.consultation_fee || row.consultation_fee_paise / 100) || 0)
      : "";
  const mode = consultationLabel(row.consultation_mode);
  const experience = row.experience_label ? " | " + row.experience_label : "";
  const languages = Array.isArray(row.languages) && row.languages.length > 0 ? " | " + row.languages.join(", ") : "";
  return String(index + 1) + ". " + (row.display_name || row.doctor_id || "Doctor") + " | " + (row.designation || department) + " | " + department${branchSegment} + " | " + mode + experience + languages + fee;
}).join("\n");
vars.${carouselSlidesVar} = unique.map((row, index) => ({
  id: String(row.doctor_id || row.doctor_scope_key || "doctor_" + (index + 1)).trim(),
  doctor_id: String(row.doctor_id || "").trim(),
  image_url: String(row.image_url || row.profile_photo_url || row.profile_image_url || row.photo_url || "").trim(),
  icon: "👨‍⚕️",
  display_name: String(row.display_name || row.doctor_id || "Doctor").trim(),
  designation: String(row.designation || row.title || departmentLabel(row.department_display_name || row.department)).trim(),
  department: departmentLabel(row.department_display_name || row.department),
  experience: experienceLabel(row),
  languages: languageLabel(row),
  fee_display: feeLabel(row),
  selection_value: String(row.doctor_id || row.doctor_scope_key || "").trim()
}));
vars.${promptVar} = "";
vars.appointment_doctor_rows = unique;
if (unique.length === 0) {
  vars.${routeVar} = "none";
} else if (unique.length === 1) {
  vars.doctor_id = String(unique[0].doctor_id || "").trim();
  vars.${routeVar} = "single";
  vars.${promptVar} = "I found one matching doctor:\n\n" + vars.${optionsVar} + "\n\nWould you like to continue with this doctor?";
} else {
  vars.doctor_id = "";
  vars.${routeVar} = "multiple";
}
return { route: vars.${routeVar}, count: unique.length };
`;
}

function doctorChoiceValidationScript({ rowsVar, routeVar }) {
  return String.raw`
function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const rows = Array.isArray(vars.${rowsVar}) ? vars.${rowsVar} : [];
const choice = String(vars.doctor_id || "").trim();
const normalizedChoice = normalizeText(choice);
const number = Number.parseInt(choice, 10);
let selected = Number.isFinite(number) && number >= 1 ? rows[number - 1] : null;
if (!selected && choice) {
  selected = rows.find((row) => String(row.doctor_id || "").trim().toLowerCase() === choice.toLowerCase())
    || rows.find((row) => String(row.doctor_scope_key || "").trim().toLowerCase() === choice.toLowerCase())
    || rows.find((row) => normalizeText(row.display_name || "") === normalizedChoice);
}
vars.${routeVar} = selected ? "found" : "not_found";
if (selected) {
  vars.doctor_id = String(selected.doctor_id || "").trim();
}
return { route: vars.${routeVar}, doctor_id: vars.doctor_id || "" };
`;
}

function addOperationalFields(recordNode) {
  const data = recordNode.data.data;
  const schemaFields = recordNode.data.collectionSchema.fields;
  data.location_id = "{{doctor_scope_branch_id}}";
  data.location_name = "{{appointment_branch_name}}";
  data.scheduled_start_at = "{{appointment_scheduled_at}}";
  data.scheduled_end_at = "{{appointment_scheduled_end_at}}";
  recordNode.data.dataJson = `${JSON.stringify(data, null, 2)}\n`;
  schemaFields.location_id = { type: "string", required: false };
  schemaFields.location_name = { type: "string", required: false };
  schemaFields.scheduled_start_at = { type: "string", required: false };
  schemaFields.scheduled_end_at = { type: "string", required: false };
  recordNode.data.collectionSchema = {
    ...recordNode.data.collectionSchema,
    fields: schemaFields
  };
}

function pruneUnreachable(doc) {
  const outgoing = new Map();
  for (const edge of doc.flow.edges) {
    if (!outgoing.has(edge.source)) {
      outgoing.set(edge.source, []);
    }
    outgoing.get(edge.source).push(edge);
  }
  const reachable = new Set(["start_1"]);
  const queue = ["start_1"];
  while (queue.length > 0) {
    const current = queue.shift();
    for (const edge of outgoing.get(current) ?? []) {
      if (!reachable.has(edge.target)) {
        reachable.add(edge.target);
        queue.push(edge.target);
      }
    }
  }
  doc.flow.nodes = doc.flow.nodes.filter((node) => reachable.has(node.id));
  doc.flow.edges = doc.flow.edges.filter(
    (edge) => reachable.has(edge.source) && reachable.has(edge.target)
  );
}

export function loadBaseHospitalFlow() {
  const path = existsSync(baseSourcePath) ? baseSourcePath : baseExportFallbackPath;
  return JSON.parse(readFileSync(path, "utf8"));
}

export function buildHospitalAppointmentSingleBranchFlow(baseDoc = loadBaseHospitalFlow()) {
  const doc = deepClone(baseDoc);
  doc.exportedAt = new Date().toISOString();
  doc.bot.name = "Sai Deepa Hospital Assistant";
  doc.bot.description =
    "Appointment and patient-support assistant for Sai Deepa Hospitals, Chanda Nagar, Hyderabad. Helps patients find the right department and doctor, verify their mobile number, check available appointment dates and slots, view upcoming appointments, book appointments, and receive confirmation and reminder updates through WhatsApp. For medical emergencies, patients are directed to the hospital’s emergency services.";
  doc.bot.headerLogoUrl = "https://ik.imagekit.io/uzhmjh0td/Helthcare/Sai_Deepa_Hospitals/sai_deepa_logo%20.png?updatedAt=1788013389008";
  doc.bot.headerTitle = "Sai Deepa Hospital Appointments";
  doc.bot.headerTagline = "Find doctors, check availability and book your appointment easily.";
  setGlobal(doc, "default_branch_id", "main_branch");
  setGlobal(doc, "default_branch_name", "Main Branch");
  setGlobal(doc, "otp_expiry_minutes", "5");
  doc.metadata.clientVariant = "single_branch_appointment_only";
  doc.metadata.runtimeDomainSchema = "healthcare";
  doc.metadata.runtimeTableFamily = "healthcare.flow_records";
  doc.metadata.runtimeStorageContract = "healthcare.flow_records and its companion healthcare.flow_record_* tables, selected by schemaName and scoped to the bot tenant";
  doc.metadata.runtimeDataPrerequisite = "Run scripts/ensure-sai-deepa-healthcare-schema.sql before local runtime E2E; the healthcare FLOW record-table family must be provisioned";
  doc.metadata.variantBuiltFrom = "domains/hospital/templates-source/hospital-full-automation.source.flow.json";

  const appointmentIntro = findNode(doc, "appointment_intro");
  appointmentIntro.data.messages = [
    {
      type: "text",
      text: "Welcome to Sai Deepa Hospital, Chanda Nagar."
    }
  ];

  const setTemplateDefaults = findNode(doc, "set_template_defaults");
  const clientDefaultsNode = setVariableNode(
    "appointment_client_defaults_set",
    { x: 1080, y: 80 },
    [
      ["booking_entry_source", "standard"],
      ["branch_id", "{{default_branch_id}}"],
      ["doctor_scope_branch_id", "{{default_branch_id}}"],
      ["consultation_type", "in_person"],
      ["appointment_branch_name", "{{default_branch_name}}"],
      ["appointment_consultation_type_label", "In-person consultation"]
    ]
  );
  const reminderTriggerRouter = switchNode(
    "appointment_reminder_trigger_router",
    { x: 780, y: 40 },
    "input"
  );
  const reminder12hTemplate = templateMessageNode(
    "appointment_reminder_12h_template",
    { x: 1980, y: -260 },
    "appointment_reminder",
    "appointment_reminder_12h_delivery_result"
  );
  const reminder2hTemplate = templateMessageNode(
    "appointment_reminder_2h_template",
    { x: 1980, y: 340 },
    "appointment_reminder",
    "appointment_reminder_2h_delivery_result"
  );
  const reminderDeliveryEnd = {
    id: "appointment_reminder_delivery_end",
    type: "end",
    position: { x: 4380, y: 40 },
    data: { messages: [] }
  };
  const reminder12hFailed = messageNode(
    "appointment_reminder_12h_failed",
    { x: 3180, y: -120 },
    "I could not send the 12-hour WhatsApp appointment reminder. The hospital team can confirm the appointment if needed."
  );
  const reminder2hFailed = messageNode(
    "appointment_reminder_2h_failed",
    { x: 3180, y: 480 },
    "I could not send the 2-hour WhatsApp appointment reminder. Please contact {{front_desk_phone}} if you need help before your visit."
  );
  upsertNode(doc, reminderTriggerRouter);
  upsertNode(doc, reminder12hTemplate);
  upsertNode(doc, reminder2hTemplate);
  upsertNode(doc, reminderDeliveryEnd);
  upsertNode(doc, reminder12hFailed);
  upsertNode(doc, reminder2hFailed);
  upsertNode(doc, clientDefaultsNode);
  replaceOutgoing(doc, "set_template_defaults", [
    {
      id: "edge_variant_set_template_defaults_reminder_router",
      target: "appointment_reminder_trigger_router"
    }
  ]);
  replaceOutgoing(doc, "appointment_reminder_trigger_router", [
    {
      id: "edge_variant_reminder_router_12h",
      target: "appointment_reminder_12h_template",
      label: "appointment_reminder_12h",
      condition: { operator: "equals", value: "appointment_reminder_12h" }
    },
    {
      id: "edge_variant_reminder_router_2h",
      target: "appointment_reminder_2h_template",
      label: "appointment_reminder_2h",
      condition: { operator: "equals", value: "appointment_reminder_2h" }
    },
    {
      id: "edge_variant_reminder_router_default",
      target: "appointment_client_defaults_set",
      label: "default",
      isDefault: true
    }
  ]);
  replaceOutgoing(doc, "appointment_reminder_12h_template", [
    {
      id: "edge_variant_reminder_12h_template_sent",
      target: "appointment_reminder_delivery_end",
      label: "sent",
      condition: { operator: "equals", value: "sent" }
    },
    {
      id: "edge_variant_reminder_12h_template_failed",
      target: "appointment_reminder_12h_failed",
      label: "failed/default",
      isDefault: true
    }
  ]);
  replaceOutgoing(doc, "appointment_reminder_2h_template", [
    {
      id: "edge_variant_reminder_2h_template_sent",
      target: "appointment_reminder_delivery_end",
      label: "sent",
      condition: { operator: "equals", value: "sent" }
    },
    {
      id: "edge_variant_reminder_2h_template_failed",
      target: "appointment_reminder_2h_failed",
      label: "failed/default",
      isDefault: true
    }
  ]);
  replaceOutgoing(doc, "appointment_reminder_12h_failed", [
    { id: "edge_variant_reminder_12h_failed_end", target: "appointment_reminder_delivery_end" }
  ]);
  replaceOutgoing(doc, "appointment_reminder_2h_failed", [
    { id: "edge_variant_reminder_2h_failed_end", target: "appointment_reminder_delivery_end" }
  ]);
  replaceOutgoing(doc, "appointment_client_defaults_set", [
    {
      id: "edge_variant_client_defaults_intro",
      target: "appointment_intro"
    }
  ]);
  appendAssignment(setTemplateDefaults, "ip_address", "");

  const patientLookupForm = findNode(doc, "existing_patient_lookup_form");
  patientLookupForm.data.messages = [
    "Please enter the patient's 10-digit mobile number to continue. We'll send a 6-digit OTP for verification."
  ];

  const otpNode = {
    id: "existing_patient_lookup_otp",
    type: "otp",
    position: { x: 15360, y: 7836 },
    data: {
      promptText: "Enter the 6-digit OTP to continue your booking.",
      channels: ["whatsapp"],
      phone: "{{patient_mobile}}",
      smsPhone: "",
      whatsappPhone: "{{patient_mobile}}",
      email: "",
      defaultCountryCode: "+91",
      codeLength: 6,
      otpTtlSeconds: 300,
      resendCooldownSeconds: 30,
      maxResends: 3,
      maxAttempts: 3,
      smsMessageTemplate: "Sai Deepa Hospital – Chanda Nagar\n\nYour OTP for appointment booking is {{otp}}.\n\nEnter this OTP to continue your booking.\n\nThis OTP is valid for {{otp_ttl_minutes}} minutes.\n\nPlease do not share this OTP with anyone.",
      smsTemplateName: "",
      smsTemplateVariablesJson: "{\n  \"1\": \"{{otp}}\"\n}",
      smsSenderId: "",
      smsPeid: "",
      smsCtid: "",
      whatsappMessageTemplate: "Sai Deepa Hospital – Chanda Nagar\n\nYour OTP for appointment booking is {{otp}}.\n\nEnter this OTP to continue your booking.\n\nThis OTP is valid for {{otp_ttl_minutes}} minutes.\n\nPlease do not share this OTP with anyone.",
      whatsappTemplateName: "verify_otp_usecase",
      whatsappTemplateLanguage: "en",
      whatsappTemplateVariablesJson: "{\n  \"1\": \"{{otp}}\",\n  \"2\": \"{{otp_ttl_minutes}}\",\n  \"3\": \"{{hospital_name}}\"\n}",
      emailSubject: "",
      emailBody: "",
      emailBodyType: "text",
      emailReplyTo: "",
      outputVar: "existing_patient_lookup_otp_result"
    }
  };
  const otpSendFailedMessage = messageNode(
    "existing_patient_lookup_otp_send_failed_message",
    { x: 15960, y: 8460 },
    "I couldn't send your appointment OTP right now. Please call {{front_desk_phone}} to complete the booking with the hospital team."
  );
  upsertNode(doc, otpNode);
  upsertNode(doc, otpSendFailedMessage);
  replaceOutgoing(doc, "existing_patient_lookup_form", [
    {
      id: "edge_variant_patient_lookup_form_otp",
      target: "existing_patient_lookup_otp"
    }
  ]);
  replaceOutgoing(doc, "existing_patient_lookup_otp", [
    {
      id: "edge_variant_patient_lookup_otp_verified",
      target: "existing_patient_find",
      label: "verified",
      condition: { operator: "equals", value: "verified" }
    },
    {
      id: "edge_variant_patient_lookup_otp_failed",
      target: "existing_patient_lookup_otp_max_attempts_message",
      label: "failed",
      condition: { operator: "equals", value: "failed" }
    },
    {
      id: "edge_variant_patient_lookup_otp_delivery_failed",
      target: "existing_patient_lookup_otp_send_failed_message",
      label: "delivery_failed/default",
      isDefault: true
    }
  ]);
  addEdge(doc, {
    id: "edge_variant_otp_send_failed_end",
    source: "existing_patient_lookup_otp_send_failed_message",
    target: "existing_patient_lookup_otp_invalid_end"
  });

  findNode(doc, "existing_patient_lookup_otp_max_attempts_message").data.messages = [
    {
      type: "text",
      text: "We couldn't verify that OTP after 3 attempts. Please call {{front_desk_phone}} to continue your appointment booking, or try again later."
    }
  ];

  const selectionModeInput = inputNode(
    "appointment_selection_mode_input",
    { x: 25800, y: 7050 },
    "How would you like to choose the doctor for this appointment?",
    "appointment_selection_mode",
    [
      replyButton("🏥 Select department", "department"),
      replyButton("👨‍⚕️ Select doctor", "doctor")
    ],
    true
  );
  const directDoctorFetch = deepClone(findNode(doc, "appointment_doctors_fetch"));
  directDoctorFetch.id = "appointment_direct_doctors_fetch";
  directDoctorFetch.position = { x: 27000, y: 7400 };
  directDoctorFetch.data.where = {
    branch_id: "{{doctor_scope_branch_id}}",
    consultation_mode: "{{consultation_type}}",
    is_active: true
  };
  directDoctorFetch.data.whereJson = JSON.stringify(directDoctorFetch.data.where, null, 2);
  const directDoctorPrepare = scriptNode(
    "appointment_direct_doctor_selection_prepare",
    { x: 28140, y: 7400 },
    formatDoctorLabelScript({
      useDepartmentFilter: false,
      optionsVar: "appointment_doctor_options_text",
      promptVar: "appointment_single_doctor_prompt",
      routeVar: "appointment_direct_doctor_route",
      sourceVar: "appointment_doctors_result"
    }),
    "appointment_direct_doctor_selection_prepare_result"
  );
  const directDoctorRoute = switchNode(
    "appointment_direct_doctor_route",
    { x: 29280, y: 7400 },
    "appointment_direct_doctor_route"
  );
  const directDoctorNoDoctors = messageNode(
    "appointment_direct_no_doctors_message",
    { x: 30420, y: 7220 },
    "I could not find any active doctors for this hospital branch right now. Please contact {{front_desk_phone}} so the hospital team can help you book manually."
  );
  const directDoctorSingle = inputNode(
    "appointment_direct_single_doctor_proceed_input",
    { x: 30420, y: 7580 },
    "{{appointment_single_doctor_prompt}}",
    "appointment_direct_single_doctor_proceed",
    [replyButton("✅ Proceed", "proceed"), replyButton("✖️ Close conversation", "close")],
    true
  );
  upsertNode(doc, selectionModeInput);
  upsertNode(doc, directDoctorFetch);
  upsertNode(doc, directDoctorPrepare);
  upsertNode(doc, directDoctorRoute);
  upsertNode(doc, directDoctorNoDoctors);
  upsertNode(doc, directDoctorSingle);

  replaceOutgoing(doc, "appointment_continue_after_patient_router", [
    {
      id: "edge_variant_patient_router_to_selection_mode",
      target: "appointment_selection_mode_input",
      label: "standard/default",
      isDefault: true
    }
  ]);
  replaceOutgoing(doc, "appointment_selection_mode_input", [
    {
      id: "edge_variant_selection_mode_department",
      target: "appointment_department_input",
      label: "department",
      condition: { operator: "equals", value: "department" }
    },
    {
      id: "edge_variant_selection_mode_doctor",
      target: "appointment_direct_doctors_fetch",
      label: "doctor/default",
      isDefault: true
    }
  ]);
  // The production journey always loads the reusable department catalog first.
  // Keep the legacy doctor-first branch in source only for backwards-compatible
  // graph construction; it becomes unreachable and is pruned from the export.
  replaceOutgoing(doc, "appointment_continue_after_patient_router", [
    {
      id: "edge_variant_patient_router_department_catalog",
      target: "appointment_department_catalog_fetch",
      label: "standard/default",
      isDefault: true
    }
  ]);
  addEdge(doc, {
    id: "edge_variant_direct_doctors_fetch_prepare",
    source: "appointment_direct_doctors_fetch",
    target: "appointment_direct_doctor_selection_prepare"
  });
  addEdge(doc, {
    id: "edge_variant_direct_doctor_prepare_route",
    source: "appointment_direct_doctor_selection_prepare",
    target: "appointment_direct_doctor_route"
  });
  replaceOutgoing(doc, "appointment_direct_doctor_route", [
    {
      id: "edge_variant_direct_doctor_route_none",
      target: "appointment_direct_no_doctors_message",
      label: "none",
      condition: { operator: "equals", value: "none" }
    },
    {
      id: "edge_variant_direct_doctor_route_single",
      target: "appointment_direct_single_doctor_proceed_input",
      label: "single",
      condition: { operator: "equals", value: "single" }
    },
    {
      id: "edge_variant_direct_doctor_route_multiple",
      target: "appointment_doctor_input",
      label: "multiple/default",
      isDefault: true
    }
  ]);
  addEdge(doc, {
    id: "edge_variant_direct_no_doctors_end",
    source: "appointment_direct_no_doctors_message",
    target: "existing_patient_lookup_otp_invalid_end"
  });
  replaceOutgoing(doc, "appointment_direct_single_doctor_proceed_input", [
    {
      id: "edge_variant_direct_single_doctor_proceed",
      target: "appointment_display_labels_set",
      label: "proceed/default",
      isDefault: true
    },
    {
      id: "edge_variant_direct_single_doctor_close",
      target: "existing_patient_lookup_otp_invalid_end",
      label: "close",
      condition: { operator: "equals", value: "close" }
    }
  ]);

  findNode(doc, "appointment_doctor_selection_prepare").data.script = formatDoctorLabelScript({
    useDepartmentFilter: true,
    optionsVar: "appointment_doctor_options_text",
    promptVar: "appointment_single_doctor_prompt",
    routeVar: "appointment_doctor_route",
    sourceVar: "appointment_doctors_result"
  });
  const doctorCarousel = dynamicCarouselNode(
    "appointment_doctor_carousel",
    { x: 32700, y: 7860 },
    "Please choose a doctor to continue.",
    "{{appointment_doctor_carousel_slides}}",
    {
      id: "doctor_{{item.id}}",
      type: "card",
      icon: "{{item.icon}}",
      imageUrl: "{{item.image_url}}",
      eyebrow: "{{item.department}}",
      heading: "{{item.display_name}}",
      title: "{{item.designation}}",
      description: "Experience: {{item.experience}} | Languages: {{item.languages}}",
        fields: {
        "Consultation Fee": "{{item.fee_display}}"
        },
      actions: [
        {
          label: "✅ Select Doctor",
          value: "{{item.selection_value}}"
        }
      ]
    }
  );
  upsertNode(doc, doctorCarousel);
  replaceOutgoing(doc, "appointment_doctor_route", [
    {
      id: "edge_variant_doctor_route_none",
      target: "appointment_doctors_alternatives_fetch",
      label: "none",
      condition: { operator: "equals", value: "none" }
    },
    {
      id: "edge_variant_doctor_route_single",
      target: "appointment_doctor_carousel",
      label: "single",
      condition: { operator: "equals", value: "single" }
    },
    {
      id: "edge_variant_doctor_route_multiple",
      target: "appointment_doctor_carousel",
      label: "multiple/default",
      isDefault: true
    }
  ]);
  replaceOutgoing(doc, "appointment_doctor_carousel", [
    {
      id: "edge_variant_doctor_carousel_selection",
      target: "appointment_doctor_input"
    }
  ]);
  const doctorInput = findNode(doc, "appointment_doctor_input");
  // The carousel already provides the doctor instructions and selection CTA.
  // Keep this input silent so the same doctor list is not announced twice.
  doctorInput.data.messages = [];
  doctorInput.data.disableChatInput = false;
  findNode(doc, "appointment_no_doctors_message").data.messages = [
    "I couldn't find an available doctor for this department right now. Please choose another department or call {{front_desk_phone}} for help."
  ];
  findNode(doc, "appointment_doctors_alternatives_prepare").data.script = String.raw`
function titleCase(value) {
  return String(value || "")
    .replace(/[_-]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.toLowerCase() === "ent" ? "ENT" : part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
function departmentLabel(value) {
  const raw = String(value || "").trim();
  if (!raw) return "Department";
  if (raw.toLowerCase() === "ent") return "ENT";
  return titleCase(raw);
}
function consultationLabel(value) {
  const raw = String(value || "").trim().toLowerCase();
  if (raw === "online") return "Online consultation";
  if (raw === "in_person") return "In-person consultation";
  return titleCase(raw);
}

const selectedDepartment = departmentLabel(vars.department || "");
const selectedMode = consultationLabel(vars.consultation_type || "");
const rows = Array.isArray(vars.appointment_doctors_alternatives_result?.data)
  ? vars.appointment_doctors_alternatives_result.data
  : [];
const unique = [];
const seen = new Set();
for (const row of rows) {
  if (String(row.is_active ?? "true").toLowerCase() === "false") continue;
  if (String(row.department || "").trim().toLowerCase() !== String(vars.department || "").trim().toLowerCase()) continue;
  if (String(row.consultation_mode || "").trim().toLowerCase() !== String(vars.consultation_type || "").trim().toLowerCase()) continue;
  const key = String(row.doctor_scope_key || row.doctor_id || "").trim();
  if (!key || seen.has(key)) continue;
  seen.add(key);
  unique.push(row);
}
unique.sort((a, b) => String(a.display_name || a.doctor_id || "").localeCompare(String(b.display_name || b.doctor_id || "")));
vars.appointment_doctor_alternative_rows = unique;
vars.appointment_doctor_alternative_options_text = unique.map((row, index) => {
  const fee = Number(row.consultation_fee || 0) > 0 ? " | Fee INR " + Number(row.consultation_fee) : "";
  return String(index + 1) + ". " + (row.display_name || row.doctor_id || "Doctor") + fee;
}).join("\n");
if (unique.length === 0) {
  vars.appointment_doctors_alternatives_route = "none";
  vars.appointment_alternative_doctor_prompt = "I could not find another active " + selectedDepartment + " doctor for " + selectedMode + " right now. Please call {{front_desk_phone}} if you want the hospital team to assist.";
  return { route: vars.appointment_doctors_alternatives_route, count: 0 };
}
if (unique.length === 1) {
  vars.doctor_id = String(unique[0].doctor_id || "").trim();
  vars.appointment_doctors_alternatives_route = "single";
  vars.appointment_alternative_doctor_prompt = "I found one alternative doctor:\n\n" + vars.appointment_doctor_alternative_options_text + "\n\nWould you like to continue with this doctor?";
  return { route: vars.appointment_doctors_alternatives_route, count: 1 };
}
vars.appointment_doctors_alternatives_route = "available";
vars.appointment_alternative_doctor_prompt = "These alternative doctors are available. Reply with the doctor number from the list below, for example 1 or 2.\n\n" + vars.appointment_doctor_alternative_options_text;
return { route: vars.appointment_doctors_alternatives_route, count: unique.length };
`;

  const doctorChoicePrepare = scriptNode(
    "appointment_doctor_choice_prepare",
    { x: 31440, y: 7860 },
    doctorChoiceValidationScript({
      rowsVar: "appointment_doctor_rows",
      routeVar: "appointment_doctor_choice_route"
    }),
    "appointment_doctor_choice_prepare_result"
  );
  const doctorChoiceRoute = switchNode(
    "appointment_doctor_choice_route",
    { x: 31740, y: 7860 },
    "appointment_doctor_choice_route"
  );
  const doctorChoiceInvalid = messageNode(
    "appointment_doctor_choice_invalid_message",
    { x: 32040, y: 8040 },
    "I could not match that doctor selection. Please start the booking again and choose one of the doctors shown."
  );
  const alternateDoctorChoicePrepare = scriptNode(
    "appointment_alternate_doctor_choice_prepare",
    { x: 38340, y: 11646 },
    doctorChoiceValidationScript({
      rowsVar: "appointment_doctor_rows",
      routeVar: "appointment_alternate_doctor_choice_route"
    }),
    "appointment_alternate_doctor_choice_prepare_result"
  );
  const alternateDoctorChoiceRoute = switchNode(
    "appointment_alternate_doctor_choice_route",
    { x: 38640, y: 11646 },
    "appointment_alternate_doctor_choice_route"
  );
  const alternateDoctorChoiceInvalid = messageNode(
    "appointment_alternate_doctor_choice_invalid_message",
    { x: 38940, y: 11830 },
    "I could not match that doctor selection. Please start the booking again and choose one of the listed alternatives."
  );
  const alternativeDoctorChoicePrepare = scriptNode(
    "appointment_doctor_alternative_choice_prepare",
    { x: 33360, y: 6942 },
    doctorChoiceValidationScript({
      rowsVar: "appointment_doctor_alternative_rows",
      routeVar: "appointment_doctor_alternative_choice_route"
    }),
    "appointment_doctor_alternative_choice_prepare_result"
  );
  const alternativeDoctorChoiceRoute = switchNode(
    "appointment_doctor_alternative_choice_route",
    { x: 33660, y: 6942 },
    "appointment_doctor_alternative_choice_route"
  );
  const alternativeDoctorChoiceInvalid = messageNode(
    "appointment_doctor_alternative_choice_invalid_message",
    { x: 33960, y: 7126 },
    "I could not match that doctor selection. Please start the booking again and choose one of the listed alternatives."
  );
  upsertNode(doc, doctorChoicePrepare);
  upsertNode(doc, doctorChoiceRoute);
  upsertNode(doc, doctorChoiceInvalid);
  upsertNode(doc, alternateDoctorChoicePrepare);
  upsertNode(doc, alternateDoctorChoiceRoute);
  upsertNode(doc, alternateDoctorChoiceInvalid);
  upsertNode(doc, alternativeDoctorChoicePrepare);
  upsertNode(doc, alternativeDoctorChoiceRoute);
  upsertNode(doc, alternativeDoctorChoiceInvalid);

  replaceOutgoing(doc, "appointment_doctor_input", [
    {
      id: "edge_variant_doctor_input_choice_prepare",
      target: "appointment_doctor_choice_prepare"
    }
  ]);
  replaceOutgoing(doc, "appointment_doctor_choice_prepare", [
    {
      id: "edge_variant_doctor_choice_prepare_route",
      target: "appointment_doctor_choice_route"
    }
  ]);
  replaceOutgoing(doc, "appointment_doctor_choice_route", [
    {
      id: "edge_variant_doctor_choice_found",
      target: "appointment_display_labels_set",
      label: "found",
      condition: { operator: "equals", value: "found" }
    },
    {
      id: "edge_variant_doctor_choice_not_found",
      target: "appointment_doctor_choice_invalid_message",
      label: "not_found/default",
      isDefault: true
    }
  ]);
  addEdge(doc, {
    id: "edge_variant_doctor_choice_invalid_end",
    source: "appointment_doctor_choice_invalid_message",
    target: "existing_patient_lookup_otp_invalid_end"
  });

  replaceOutgoing(doc, "appointment_alternate_doctor_input", [
    {
      id: "edge_variant_alternate_doctor_input_choice_prepare",
      target: "appointment_alternate_doctor_choice_prepare"
    }
  ]);
  replaceOutgoing(doc, "appointment_alternate_doctor_choice_prepare", [
    {
      id: "edge_variant_alternate_doctor_choice_prepare_route",
      target: "appointment_alternate_doctor_choice_route"
    }
  ]);
  replaceOutgoing(doc, "appointment_alternate_doctor_choice_route", [
    {
      id: "edge_variant_alternate_doctor_choice_found",
      target: "appointment_alternate_display_labels_set",
      label: "found",
      condition: { operator: "equals", value: "found" }
    },
    {
      id: "edge_variant_alternate_doctor_choice_not_found",
      target: "appointment_alternate_doctor_choice_invalid_message",
      label: "not_found/default",
      isDefault: true
    }
  ]);
  addEdge(doc, {
    id: "edge_variant_alternate_doctor_choice_invalid_end",
    source: "appointment_alternate_doctor_choice_invalid_message",
    target: "existing_patient_lookup_otp_invalid_end"
  });

  replaceOutgoing(doc, "appointment_doctor_alternative_input", [
    {
      id: "edge_variant_doctor_alternative_input_choice_prepare",
      target: "appointment_doctor_alternative_choice_prepare"
    }
  ]);
  replaceOutgoing(doc, "appointment_doctor_alternative_choice_prepare", [
    {
      id: "edge_variant_doctor_alternative_choice_prepare_route",
      target: "appointment_doctor_alternative_choice_route"
    }
  ]);
  replaceOutgoing(doc, "appointment_doctor_alternative_choice_route", [
    {
      id: "edge_variant_doctor_alternative_choice_found",
      target: "appointment_alternative_display_labels_set",
      label: "found",
      condition: { operator: "equals", value: "found" }
    },
    {
      id: "edge_variant_doctor_alternative_choice_not_found",
      target: "appointment_doctor_alternative_choice_invalid_message",
      label: "not_found/default",
      isDefault: true
    }
  ]);
  addEdge(doc, {
    id: "edge_variant_doctor_alternative_choice_invalid_end",
    source: "appointment_doctor_alternative_choice_invalid_message",
    target: "existing_patient_lookup_otp_invalid_end"
  });

  const appointmentSetIds = findNode(doc, "appointment_set_ids");
  appendAssignment(
    appointmentSetIds,
    "appointment_scheduled_at",
    "{{appointment_selected_slot.date}}T{{appointment_selected_slot.start}}:00+05:30"
  );
  appendAssignment(
    appointmentSetIds,
    "appointment_scheduled_end_at",
    "{{appointment_selected_slot.date}}T{{appointment_selected_slot.end}}:00+05:30"
  );
  // This marker is reset for every review and is set only by an explicit
  // confirmation action. The payment record uses it as a final write gate.
  appendAssignment(
    appointmentSetIds,
    "appointment_confirmation_authorized",
    "pending"
  );

  const slotHoldUpdate = findNode(doc, "appointment_slot_hold_update");
  const appointmentConfirmUpdate = findNode(doc, "appointment_confirm_record_update");
  addOperationalFields(slotHoldUpdate);
  addOperationalFields(appointmentConfirmUpdate);

  const appointmentSummary = findNode(doc, "appointment_summary");
  appointmentSummary.data.messages = [
    {
      type: "text",
      text: "Your appointment slot is available with {{appointment_doctor_name}} on {{appointment_date}} at {{appointment_slot_label}}. Payment mode for this hospital is pay at hospital. I am confirming the booking now."
    }
  ];
  replaceOutgoing(doc, "appointment_summary", [
    {
      id: "edge_variant_appointment_summary_pay_at_hospital",
      target: "appointment_set_pay_at_hospital"
    }
  ]);

  findNode(doc, "appointment_notify").data = buildNotificationData({
    recipients: [
      { type: "customer", whatsappPhone: "{{patient_mobile}}" }
    ],
    channels: [
      {
        type: "whatsapp",
        enabled: true,
        templateName: "appointment_confirmed",
        language: "{{whatsapp_template_language}}",
        requiresMediaHeader: false,
        variables: {
          "1": "{{patient_name}}",
          "2": "{{appointment_id}}",
          "3": "{{appointment_doctor_name}}",
          "4": "{{appointment_department_name}}",
          "5": "{{appointment_date}}",
          "6": "{{appointment_slot_label}}",
          "7": "{{appointment_branch_name}}",
          "8": "{{appointment_consultation_type_label}}",
          "9": "{{currency}} {{appointment_booking_fee}}",
          "10": "{{payment_status_label}}"
        }
      }
    ],
    dedupeKey: "{{appointment_id}}:confirmation",
    outputVar: "appointment_notification_result",
    messageCategory: "transactional"
  });

  const reminder12h = deepClone(findNode(doc, "appointment_reminder_scheduler"));
  reminder12h.id = "appointment_reminder_12h_scheduler";
  reminder12h.position = { x: 59580, y: 10040 };
  reminder12h.data.runAt = "{{appointment_scheduled_at}}";
  reminder12h.data.expiryAt = "{{appointment_scheduled_at}}";
  reminder12h.data.offset = { unit: "hours", value: 12, direction: "before" };
  reminder12h.data.payload = {
    triggerText: "appointment_reminder_12h",
    type: "appointment_reminder",
    reminder_window: "12_hours",
    appointment_id: "{{appointment_id}}",
    patient_mobile: "{{patient_mobile}}"
  };
  reminder12h.data.dedupeKey = "{{appointment_id}}:{{appointment_scheduled_at}}:appointment_reminder_12h";
  reminder12h.data.outputVar = "appointment_reminder_12h_result";
  const reminder2h = deepClone(findNode(doc, "appointment_reminder_scheduler"));
  reminder2h.id = "appointment_reminder_2h_scheduler";
  reminder2h.position = { x: 60120, y: 10040 };
  reminder2h.data.runAt = "{{appointment_scheduled_at}}";
  reminder2h.data.expiryAt = "{{appointment_scheduled_at}}";
  reminder2h.data.offset = { unit: "hours", value: 2, direction: "before" };
  reminder2h.data.payload = {
    triggerText: "appointment_reminder_2h",
    type: "appointment_reminder",
    reminder_window: "2_hours",
    appointment_id: "{{appointment_id}}",
    patient_mobile: "{{patient_mobile}}"
  };
  reminder2h.data.dedupeKey = "{{appointment_id}}:{{appointment_scheduled_at}}:appointment_reminder_2h";
  reminder2h.data.outputVar = "appointment_reminder_2h_result";
  upsertNode(doc, reminder12h);
  upsertNode(doc, reminder2h);
  replaceOutgoing(doc, "appointment_notify", [
    {
      id: "edge_variant_notify_reminder_12h_sent",
      target: "appointment_reminder_12h_scheduler",
      label: "sent",
      condition: { operator: "equals", value: "sent" }
    },
    {
      id: "edge_variant_notify_reminder_12h_partial",
      target: "appointment_reminder_12h_scheduler",
      label: "partially_sent",
      condition: { operator: "equals", value: "partially_sent" }
    },
    {
      id: "edge_variant_notify_reminder_12h_default",
      target: "appointment_reminder_12h_scheduler",
      label: "failed/default",
      isDefault: true
    }
  ]);
  replaceOutgoing(doc, "appointment_reminder_12h_scheduler", [
    {
      id: "edge_variant_reminder_12h_to_2h_scheduled",
      target: "appointment_reminder_2h_scheduler",
      label: "scheduled",
      condition: { operator: "equals", value: "scheduled" }
    },
    {
      id: "edge_variant_reminder_12h_to_2h_skipped",
      target: "appointment_reminder_2h_scheduler",
      label: "skipped",
      condition: { operator: "equals", value: "skipped" }
    },
    {
      id: "edge_variant_reminder_12h_to_2h_default",
      target: "appointment_reminder_2h_scheduler",
      label: "failed/default",
      isDefault: true
    }
  ]);
  replaceOutgoing(doc, "appointment_reminder_2h_scheduler", [
    {
      id: "edge_variant_reminder_2h_to_audit_scheduled",
      target: "appointment_audit",
      label: "scheduled",
      condition: { operator: "equals", value: "scheduled" }
    },
    {
      id: "edge_variant_reminder_2h_to_audit_skipped",
      target: "appointment_audit",
      label: "skipped",
      condition: { operator: "equals", value: "skipped" }
    },
    {
      id: "edge_variant_reminder_2h_to_audit_default",
      target: "appointment_audit",
      label: "failed/default",
      isDefault: true
    }
  ]);

  const appointmentConfirmation = findNode(doc, "appointment_confirmation");
  appointmentConfirmation.type = "carousel";
  appointmentConfirmation.data = staticCarouselNode(
    "appointment_confirmation",
    { x: 60684, y: 10190 },
    "✅ Your appointment has been confirmed.",
    [
      {
        id: "appointment_confirmation_card",
        type: "card",
        icon: "✅",
        eyebrow: "Sai Deepa Hospital, Chanda Nagar",
        heading: "Appointment Confirmed",
        title: "{{appointment_doctor_name}}",
        description: "{{appointment_department_name}} | In-person consultation",
        fields: {
          "Appointment ID": "{{appointment_id}}",
          "Consultation Fee": "{{currency}} {{appointment_booking_fee}}",
          "Date": "{{appointment_date}}",
          "Time": "{{appointment_slot_label}}",
          "Location": "Sai Deepa Hospital, Chanda Nagar",
          "Payment": "Pay at hospital"
        },
        footer: "Please arrive at the hospital a little early and keep the confirmation message for reference."
      }
    ]
  ).data;
  const appointmentBookingEnd = {
    id: "appointment_booking_complete_end",
    type: "end",
    position: { x: 61500, y: 10190 },
    data: { messages: [] }
  };
  upsertNode(doc, appointmentBookingEnd);
  replaceOutgoing(doc, "appointment_confirmation", [
    {
      id: "edge_variant_appointment_confirmation_end",
      target: "appointment_booking_complete_end"
    }
  ]);

  const upcomingDeclineMessage = messageNode(
    "appointment_upcoming_decline_message",
    { x: 24480, y: 6540 },
    "No problem. Your existing appointments remain confirmed.\n\nIf you need any further help, you can start a new request anytime."
  );
  const upcomingProceedDecision = findNode(doc, "appointment_upcoming_proceed_decision");
  upcomingProceedDecision.data.messages = ["Would you like to book another appointment?"];
  upcomingProceedDecision.data.buttons = [
    replyButton("Yes, Book Another", "yes"),
    replyButton("No, Thanks", "no")
  ];
  upsertNode(doc, upcomingDeclineMessage);
  replaceEdgeTarget(
    doc,
    "edge_184_appointment_upcoming_proceed_decision_appointment_upcoming_end_message",
    "appointment_upcoming_decline_message"
  );
  addEdge(doc, {
    id: "edge_variant_upcoming_decline_end",
    source: "appointment_upcoming_decline_message",
    target: "existing_patient_lookup_otp_invalid_end"
  });

  // Sai Deepa production configuration. Values are sourced from the verified
  // Chanda Nagar seed; provider template names remain deployment configuration.
  setGlobal(doc, "hospital_name", "Sai Deepa Hospital, Chanda Nagar");
  setGlobal(doc, "default_branch_id", "chanda_nagar");
  setGlobal(doc, "default_branch_name", "Chanda Nagar");
  setGlobal(doc, "main_branch_address", "Plot No. 387, Church Road, HUDA Colony, Chanda Nagar, Hyderabad, Telangana 500050");
  setGlobal(doc, "front_desk_phone", "+91 7093762716");
  setGlobal(doc, "billing_phone", "+91 7093762716");
  setGlobal(doc, "emergency_phone", "+91 7093762716");
  setGlobal(doc, "payment_link", "https://saideepahospitals.com");
  setGlobal(doc, "report_portal_url", "https://saideepahospitals.com");
  setGlobal(doc, "appointment_fee", "0");
  setGlobal(doc, "whatsapp_otp_template_name", "verify_otp_usecase");
  setGlobal(doc, "whatsapp_confirmation_template_name", "appointment_confirmed");
  setGlobal(doc, "whatsapp_reminder_template_name", "appointment_reminder");
  setGlobal(doc, "whatsapp_reminder_12h_template_name", "appointment_reminder");
  setGlobal(doc, "whatsapp_reminder_2h_template_name", "appointment_reminder");
  setGlobal(doc, "whatsapp_template_language", "en");
  doc.bot.description = "Appointment and patient-support assistant for Sai Deepa Hospitals, Chanda Nagar, Hyderabad. Helps patients find the right department and doctor, verify their mobile number, check available appointment dates and slots, view upcoming appointments, book appointments, and receive confirmation and reminder updates through WhatsApp. For medical emergencies, patients are directed to the hospital’s emergency services.";
  doc.metadata.requiredProductionConfiguration = [
    "emergency_phone",
    "whatsapp_otp_template_name",
    "whatsapp_confirmation_template_name",
    "whatsapp_reminder_12h_template_name",
    "whatsapp_reminder_2h_template_name"
  ];
  doc.metadata.whatsappDeliveryConfiguration = {
    otpTemplate: "{{whatsapp_otp_template_name}}",
    confirmationTemplate: "{{whatsapp_confirmation_template_name}}",
    language: "{{whatsapp_template_language}}",
    recipient: "{{patient_mobile}}",
    category: "transactional",
    requiresMediaHeader: false
  };
  doc.metadata.emergencyPhoneSource = "Sai Deepa support_phone fallback; verify dedicated emergency number before production";

  // The patient-facing entry point is intentionally only two actions.
  const mainMenu = inputNode(
    "main_menu",
    { x: 2580, y: 40 },
    "How can I help you today?",
    "main_menu",
    [replyButton("📅 Book Appointment", "book_appointment"), replyButton("🚨 Emergency Help", "emergency")],
    true
  );
  const emergencyActions = inputNode(
    "emergency_actions",
    { x: 3780, y: 520 },
    "If this is a medical emergency, please seek immediate hospital care or call {{emergency_phone}}. This chat is not a substitute for urgent medical care.",
    "emergency_action",
    [phoneButton("📞 Call hospital emergency team", "{{emergency_phone}}"), replyButton("✖️ End conversation", "end")],
    true
  );
  const emergencyEnd = {
    id: "emergency_end",
    type: "end",
    position: { x: 4980, y: 520 },
    data: { messages: [] }
  };
  upsertNode(doc, mainMenu);
  upsertNode(doc, emergencyActions);
  upsertNode(doc, emergencyEnd);
  appointmentIntro.data.messages = [
    {
      type: "text",
      text: "Welcome to Sai Deepa Hospital, Chanda Nagar."
    }
  ];
  replaceOutgoing(doc, "appointment_intro", [
    {
      id: "edge_variant_intro_main_menu",
      target: "main_menu"
    }
  ]);
  replaceOutgoing(doc, "main_menu", [
    {
      id: "edge_variant_main_menu_book_appointment",
      target: "existing_patient_lookup_form",
      label: "book_appointment",
      condition: { operator: "equals", value: "book_appointment" }
    },
    {
      id: "edge_variant_main_menu_emergency",
      target: "emergency_safety_message",
      label: "emergency",
      condition: { operator: "equals", value: "emergency" },
      isDefault: true
    }
  ]);
  replaceOutgoing(doc, "emergency_safety_message", [
    {
      id: "edge_variant_emergency_safety_actions",
      target: "emergency_end"
    }
  ]);

  // Normalize and verify the patient mobile before any healthcare lookup.
  patientLookupForm.data.fields = [
    {
      key: "patient_mobile",
      type: "phone",
      label: "Mobile Number",
      placeholder: "Enter 10-digit mobile number",
      required: true,
      pattern: "^(?:\\+91[\\s-]?)?[6-9]\\d{9}$",
      showPatternHint: false,
    }
  ];
  patientLookupForm.data.fieldsJson = JSON.stringify(patientLookupForm.data.fields, null, 2);
  patientLookupForm.data.messages = [
    "Please enter the patient's 10-digit mobile number to continue. We'll send a 6-digit OTP for verification."
  ];
  patientLookupForm.data.formErrorMessage = "Enter a valid mobile number starting with 6, 7, 8, or 9.";
  const mobileNormalize = scriptNode(
    "appointment_mobile_normalize",
    { x: 7200, y: 2140 },
    String.raw`
const raw = String(vars.patient_mobile || "").trim();
const compact = raw.replace(/[\s-]/g, "");
if (!/^(?:\+91)?[6-9]\d{9}$/.test(compact)) {
  vars.appointment_mobile_validation_route = "invalid";
  return { route: "invalid" };
}
vars.patient_mobile = "+91" + compact.slice(-10);
vars.patient_mobile_normalized = "91" + compact.slice(-10);
vars.appointment_mobile_validation_route = "valid";
return { route: "valid", mobile: vars.patient_mobile };
`,
    "appointment_mobile_normalize_result"
  );
  const mobileValidationRoute = switchNode(
    "appointment_mobile_validation_route",
    { x: 8400, y: 2140 },
    "appointment_mobile_validation_route"
  );
  const mobileInvalidMessage = messageNode(
    "appointment_mobile_invalid_message",
    { x: 9600, y: 2320 },
    "That mobile number doesn't look right. Please enter a 10-digit mobile number beginning with 6, 7, 8, or 9."
  );
  upsertNode(doc, mobileNormalize);
  upsertNode(doc, mobileValidationRoute);
  upsertNode(doc, mobileInvalidMessage);
  replaceOutgoing(doc, "existing_patient_lookup_form", [
    {
      id: "edge_variant_patient_form_mobile_normalize",
      target: "appointment_mobile_normalize"
    }
  ]);
  replaceOutgoing(doc, "appointment_mobile_normalize", [
    {
      id: "edge_variant_mobile_valid",
      target: "appointment_mobile_validation_route"
    }
  ]);
  replaceOutgoing(doc, "appointment_mobile_validation_route", [
    {
      id: "edge_variant_mobile_validation_valid",
      target: "existing_patient_lookup_otp",
      label: "valid",
      condition: { operator: "equals", value: "valid" }
    },
    {
      id: "edge_variant_mobile_validation_invalid",
      target: "appointment_mobile_invalid_message",
      label: "invalid",
      isDefault: true
    }
  ]);
  addEdge(doc, {
    id: "edge_variant_mobile_invalid_end",
    source: "appointment_mobile_invalid_message",
    target: "existing_patient_lookup_otp_invalid_end"
  });
  otpNode.data.whatsappTemplateName = "verify_otp_usecase";
  otpNode.data.whatsappTemplateLanguage = "{{whatsapp_template_language}}";

  // Read existing appointments broadly, then apply the exact future-time rule
  // in one deterministic script because the record node has no range operator.
  const upcomingFind = findNode(doc, "appointment_upcoming_find");
  // Appointments are linked to the canonical patient record; the live seed
  // stores display-formatted mobiles on patients and does not duplicate them
  // on appointment rows.
  upcomingFind.data.where = { patient_id: "{{patient_id}}" };
  upcomingFind.data.whereJson = JSON.stringify(upcomingFind.data.where, null, 2);
  upcomingFind.data.sortBy = "scheduled_start_at";
  upcomingFind.data.collectionSchema.fields.status.values = [
    "pending_payment",
    "booked",
    "confirmed",
    "manual_verify",
    "cancelled",
    "reschedule_requested",
    "completed",
    "checked_in",
    "called"
  ];
  upcomingFind.data.collectionSchema.fields.patient_id = { type: "string", required: true };
  upcomingFind.data.collectionSchema.fields.patient_mobile = { type: "phone", required: false };
  upcomingFind.data.collectionSchema.fields.scheduled_start_at = { type: "string", required: false };
  upcomingFind.data.collectionSchema.fields.scheduled_end_at = { type: "string", required: false };
  upcomingFind.data.script = undefined;
  findNode(doc, "appointment_upcoming_format").data.script = String.raw`
function rowsFrom(value) {
  return Array.isArray(value?.data) ? value.data : Array.isArray(value) ? value : [];
}
function titleCase(value) {
  return String(value || "")
    .replace(/[_-]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
function toDate(value) {
  const raw = String(value || "").trim();
  if (!raw) return null;
  const parsed = Date.parse(raw);
  if (Number.isFinite(parsed)) return parsed;
  return null;
}
function fallbackDate(item) {
  const date = String(item.appointment_date || "").trim();
  const time = String(item.appointment_time || "").trim();
  return date && time ? toDate(date + "T" + time + ":00+05:30") : null;
}
function formatDateTime(item) {
  const timestamp = toDate(item.scheduled_start_at) ?? fallbackDate(item);
  if (timestamp == null) {
    const date = String(item.appointment_date || "").trim();
    const time = String(item.appointment_time || "").trim();
    return date && time ? date + " at " + time : "Date and time to be confirmed";
  }
  const parts = new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  }).formatToParts(new Date(timestamp));
  const value = (type) => parts.find((part) => part.type === type)?.value || "";
  return value("day") + " " + value("month") + " " + value("year") + " at " + value("hour") + ":" + value("minute") + " " + value("dayPeriod").toUpperCase();
}
function line(item) {
  const doctor = item.doctor_name || titleCase(item.doctor_id || "doctor");
  const department = item.department_display_name || titleCase(item.department || "");
  return doctor + "\n" + department + "\n📅 " + formatDateTime(item) + "\n✅ Confirmed";
}
const activeStatuses = new Set(["confirmed", "booked"]);
const now = Date.now();
const future = rowsFrom(vars.appointment_upcoming_result)
  .filter((item) => activeStatuses.has(String(item.status || "").trim().toLowerCase()))
  .filter((item) => (toDate(item.scheduled_start_at) ?? fallbackDate(item)) > now)
  .sort((a, b) => (toDate(a.scheduled_start_at) ?? fallbackDate(a) ?? 0) - (toDate(b.scheduled_start_at) ?? fallbackDate(b) ?? 0));
vars.appointment_upcoming_future_appointments = future;
vars.appointment_upcoming_future_appointment_count = future.length;
vars.appointment_upcoming_route = future.length > 0 ? "future" : "none";
vars.appointment_upcoming_summary_text = future.map((item, index) => String(index + 1) + ". " + line(item)).join("\n\n");
const upcomingHeading = future.length > 1
  ? "You currently have " + future.length + " upcoming appointments."
  : "You already have the following upcoming appointment:";
vars.appointment_upcoming_response_text = future.length > 0
  ? upcomingHeading + "\n\n" + vars.appointment_upcoming_summary_text
  : "";
return { route: vars.appointment_upcoming_route, count: future.length };
`;

  // Department catalog is DB-backed and prepared once for reuse.
  const departmentCatalogFetch = {
    id: "appointment_department_catalog_fetch",
    type: "record",
    position: { x: 22200, y: 6500 },
    data: {
      data: {},
      limit: 100,
      where: { branch_id: "{{doctor_scope_branch_id}}", is_active: true },
      action: "list",
      offset: 0,
      sortBy: "department_name",
      dataJson: "{}",
      outputVar: "appointment_department_catalog_result",
      piiFields: "",
      sortOrder: "asc",
      uniqueKey: "",
      whereJson: JSON.stringify({ branch_id: "{{doctor_scope_branch_id}}", is_active: true }, null, 2),
      collection: "departments",
      encryptPii: false,
      softDelete: true,
      idempotencyKey: "",
      collectionSchema: {
        collection: "departments",
        fields: {
          branch_id: { type: "string", required: true },
          department_id: { type: "string", unique: true, required: true },
          department_name: { type: "string", required: true },
          default_slot_duration_minutes: { type: "number", required: false },
          is_active: { type: "boolean", required: true }
        }
      },
      schemaName: DOMAIN_RECORD_SCHEMA
    }
  };
  const departmentCatalogPrepare = scriptNode(
    "appointment_department_catalog_prepare",
    { x: 23400, y: 6500 },
    String.raw`
function normalize(value) {
  return String(value || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/_+/g, "_").replace(/^_|_$/g, "");
}
function rowsFrom(value) {
  return Array.isArray(value?.data) ? value.data : Array.isArray(value) ? value : [];
}
const branch = normalize(vars.doctor_scope_branch_id || vars.branch_id);
const supported = new Set(${JSON.stringify(SAI_DEEPA_SUPPORTED_DEPARTMENT_KEYS)});
const rows = rowsFrom(vars.appointment_department_catalog_result)
  .filter((row) => String(row.is_active ?? "true").toLowerCase() !== "false")
  .filter((row) => !branch || normalize(row.branch_id) === branch)
  .map((row) => ({ key: normalize(row.department_id || row.department_name), label: String(row.department_name || row.department_id || "").trim() }))
  .filter((row) => row.key && row.label && supported.has(row.key));
const unique = [];
const seen = new Set();
for (const row of rows) {
  if (seen.has(row.key)) continue;
  seen.add(row.key);
  unique.push(row);
}
unique.sort((a, b) => a.label.localeCompare(b.label));
vars.department_map = Object.fromEntries(unique.map((row) => [row.key, row.label]));
vars.department_keys = unique.map((row) => row.key);
vars.department_options_text = unique.map((row, index) => String(index + 1) + ". " + row.label).join("\n");
vars.appointment_department_catalog_route = unique.length > 0 ? "available" : "none";
return { route: vars.appointment_department_catalog_route, count: unique.length };
`,
    "appointment_department_catalog_prepare_result"
  );
  const departmentCatalogRoute = switchNode(
    "appointment_department_catalog_route",
    { x: 24600, y: 6500 },
    "appointment_department_catalog_route"
  );
  const departmentCatalogUnavailable = messageNode(
    "appointment_department_catalog_unavailable_message",
    { x: 25800, y: 6300 },
    "We couldn't show the hospital departments right now. Please call {{front_desk_phone}} and our hospital team will help you."
  );
  const departmentInput = findNode(doc, "appointment_department_input");
  departmentInput.data.buttons = SAI_DEEPA_DEPARTMENT_BUTTONS.map(([label, value]) => replyButton(label, value));
  departmentInput.data.messages = [
    "Please choose the department you would like to visit.\n\nNot sure which department to choose? Describe your health concern, and we'll help you choose."
  ];
  departmentInput.data.variable = "department";
  departmentInput.data.disableChatInput = false;
  const departmentPrepare = findNode(doc, "appointment_department_prepare");
  departmentPrepare.data.script = String.raw`
function normalize(value) {
  return String(value || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/_+/g, "_").replace(/^_|_$/g, "");
}
const supported = new Set(${JSON.stringify(SAI_DEEPA_SUPPORTED_DEPARTMENT_KEYS)});
const keys = Array.isArray(vars.department_keys) ? vars.department_keys : [];
const map = vars.department_map && typeof vars.department_map === "object" ? vars.department_map : {};
const raw = String(vars.department || "").trim();
const normalized = normalize(raw);
if (!raw || normalized === "not_sure") {
  vars.appointment_department_route = "ask_concern";
  vars.department_reason = "";
  vars.department = "";
  vars.availability_department = "";
  return { route: vars.appointment_department_route };
}
const number = Number.parseInt(raw, 10);
let key = Number.isInteger(number) && number >= 1 && number <= keys.length ? keys[number - 1] : normalized;
if (!supported.has(key) || !keys.includes(key)) {
  key = keys.find((candidate) => supported.has(candidate) && normalize(map[candidate]) === normalized) || "";
}
if (key) {
  vars.appointment_department_route = "department";
  vars.department = key;
  vars.availability_department = key;
  return { route: vars.appointment_department_route, department: key };
}
// A typed phrase is already a concern description. Send it directly to the
// constrained matcher instead of asking the patient to repeat it.
vars.department_reason = raw;
vars.department = "";
vars.availability_department = "";
vars.appointment_department_route = "ai_match";
return { route: vars.appointment_department_route, concern: raw };
`;
  const departmentReasonInput = findNode(doc, "appointment_department_reason_input");
  departmentReasonInput.data.messages = [
    "Please briefly describe the health concern.\n\nFor example: “Cough for the last 3 days” or “Knee pain while walking.”\n\nI’ll help you choose the most suitable department for booking.\n\nIf this is a medical emergency, please seek immediate hospital care."
  ];
  departmentReasonInput.data.variable = "department_reason";
  departmentReasonInput.data.buttons = [];
  departmentReasonInput.data.disableChatInput = false;

  const departmentAiMatch = findNode(doc, "appointment_department_ai_match");
  departmentAiMatch.data = {
    answerVar: "appointment_department_ai_raw_match",
    outputVar: "appointment_department_ai_match_result",
    emitResponse: false,
    instructions: `Review the concern using only the routing guide. Return exactly one value from this list: ${SAI_DEEPA_SUPPORTED_DEPARTMENT_KEYS.join(", ")}, emergency_medicine. Use emergency_medicine only for clearly urgent or life-threatening symptoms. Use general_medicine when the concern is unclear or does not match a supported department. Return only the value.`,
    inputTemplate: "{{department_reason}}",
    responseStyle: "concise",
    contextTemplate: String.raw`Sai Deepa Hospital appointment routing guide. Return exactly one supported key.
- general_medicine: unclear, mixed, fever, weakness, routine adult concerns, or symptoms that do not clearly fit another supported department.
- cardiology: stable heart concerns, palpitations, or blood-pressure concerns. Severe chest pain is emergency_medicine.
- ent: ear, nose, throat, sinus, hearing, or voice concerns.
- general_surgery: hernia, piles, gallbladder, appendix, or other routine surgical concerns.
- neuro_physiotherapy: rehabilitation, mobility, exercise, or recovery support.
- neurology: migraine, nerve symptoms, numbness, tremor, or non-emergency seizure follow-up.
- obstetrics_gynecology: pregnancy, antenatal care, periods, PCOS, fertility, or women's health concerns.
- orthopedics: bones, joints, fracture follow-up, back, muscle, ligament, or sports injury concerns.
- psychiatry: anxiety, depression, stress, sleep, behavior, or mental-health concerns.
- pulmonology: cough, asthma, wheezing, or non-emergency breathing and lung concerns.
- urology: urine, bladder, prostate, or other urinary concerns.
- vascular_surgery: blood-vessel, circulation, or varicose-vein concerns.
- emergency_medicine: severe chest pain, severe breathing difficulty, stroke signs, uncontrolled bleeding, unconsciousness, active seizure, collapse, major trauma, or any life-threatening concern.
Emergency overrides all other matches. If unclear but not urgent, use general_medicine. Return one key only.`,
    fallbackMessage: "",
    strictGrounding: true,
    includeCitations: false,
    responseContract: "single-key-text",
    responseTemplate: "{{answer}}",
    answerKeyValueVar: "appointment_department_ai_match_key",
    fallbackResponseTemplate: "",
    includeCitationsInResponse: false
  };

  const departmentAiPrepare = findNode(doc, "appointment_department_match_prepare");
  departmentAiPrepare.data.script = String.raw`
function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "")
    .trim();
}
function valueFrom(value) {
  if (typeof value === "string") return value;
  if (value && typeof value === "object") {
    return value.value || value.label || value.answer || value.answerKeyValue?.value || "";
  }
  return "";
}
function titleCase(value) {
  return String(value || "")
    .replace(/[_-]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.toLowerCase() === "ent" ? "ENT" : part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
const supportedDepartments = new Set(${JSON.stringify(SAI_DEEPA_SUPPORTED_DEPARTMENT_KEYS)});
const aliases = {
  obstetrics: "obstetrics_gynecology",
  obstetric: "obstetrics_gynecology",
  gynecology: "obstetrics_gynecology",
  gynaecology: "obstetrics_gynecology",
  pregnancy: "obstetrics_gynecology",
  women_health: "obstetrics_gynecology",
  physiotherapy: "neuro_physiotherapy",
  physical_therapy: "neuro_physiotherapy",
  rehab: "neuro_physiotherapy",
  rehabilitation: "neuro_physiotherapy",
  mobility: "neuro_physiotherapy",
  exercise: "neuro_physiotherapy",
  vascular: "vascular_surgery",
  varicose_veins: "vascular_surgery",
  circulation: "vascular_surgery",
  blood_vessel: "vascular_surgery",
  orthopedic: "orthopedics",
  orthopaedic: "orthopedics",
  ortho: "orthopedics",
  general: "general_medicine",
  gp: "general_medicine",
  family_doctor: "general_medicine",
  routine: "general_medicine",
  unclear: "general_medicine",
  emergency: "emergency_medicine"
};
function resolveDepartment(value) {
  const normalized = normalizeText(value);
  if (!normalized) return "";
  if (aliases[normalized]) return aliases[normalized];
  if (normalized === "emergency_medicine") return normalized;
  if (supportedDepartments.has(normalized)) return normalized;
  return "";
}
const raw = valueFrom(vars.appointment_department_ai_raw_match)
  || valueFrom(vars.appointment_department_ai_match_result)
  || valueFrom(vars.appointment_department_ai_match_key);
const matched = resolveDepartment(raw);
const catalogKeys = new Set(Array.isArray(vars.department_keys) ? vars.department_keys : []);
const usable = matched === "emergency_medicine"
  ? matched
  : supportedDepartments.has(matched) && catalogKeys.has(matched)
    ? matched
    : "general_medicine";
if (usable === "emergency_medicine") {
  vars.appointment_department_ai_route = "emergency";
  vars.appointment_department_match_text = "This may need urgent medical attention. Please use the emergency support options below instead of a routine appointment booking.";
  vars.department = "";
  vars.availability_department = "";
} else if (usable === "general_medicine") {
  vars.appointment_department_ai_route = "general_medicine";
  vars.appointment_department_match_text = "Based on your description, General Medicine may be the most suitable department for this appointment.\n\nI'll show you the available doctors.";
  vars.department = usable;
  vars.availability_department = usable;
} else {
  vars.appointment_department_ai_route = "matched";
  const departmentName = vars.department_map && typeof vars.department_map[usable] === "string"
    ? vars.department_map[usable]
    : titleCase(usable);
  vars.appointment_department_match_text = "Based on your description, " + departmentName + " may be the most suitable department for this appointment.\n\nI'll show you the available doctors.";
  vars.department = usable;
  vars.availability_department = usable;
}
return { route: vars.appointment_department_ai_route, department: vars.department, raw };
`;
  const departmentAiRoute = findNode(doc, "appointment_department_ai_route");
  departmentAiRoute.data.variable = "appointment_department_ai_route";
  const departmentSafeMessage = findNode(doc, "appointment_department_safe_message");
  departmentSafeMessage.data.messages = [
    { type: "text", text: "{{appointment_department_match_text}}" }
  ];
  departmentSafeMessage.data.buttons = [];
  const emergencySafetyMessage = findNode(doc, "emergency_safety_message");
  emergencySafetyMessage.data.messages = [
    {
      type: "text",
      text: "🚨 **Medical Emergency**\n\nIf you are experiencing a medical emergency, please **visit the nearest hospital immediately** or contact our emergency support team at **📞 +91 7093762716**.\n\n⚠️ This chat is not a substitute for emergency medical care."
    }
  ];
  emergencySafetyMessage.data.buttons = [];
  const departmentManual = findNode(doc, "appointment_department_manual_input");
  departmentManual.data.buttons = [];
  departmentManual.data.messages = [];
  departmentManual.data.disableChatInput = true;
  upsertNode(doc, departmentReasonInput);
  upsertNode(doc, departmentAiMatch);
  upsertNode(doc, departmentAiPrepare);
  upsertNode(doc, departmentAiRoute);
  upsertNode(doc, departmentSafeMessage);
  upsertNode(doc, departmentManual);
  upsertNode(doc, emergencySafetyMessage);
  const departmentInvalid = messageNode(
    "appointment_department_invalid_message",
    { x: 25800, y: 6900 },
    "I could not match that department. Please choose one of the buttons shown or enter its name."
  );
  upsertNode(doc, departmentCatalogFetch);
  upsertNode(doc, departmentCatalogPrepare);
  upsertNode(doc, departmentCatalogRoute);
  upsertNode(doc, departmentCatalogUnavailable);
  upsertNode(doc, departmentInvalid);
  replaceOutgoing(doc, "appointment_department_input", [
    {
      id: "edge_variant_department_input_prepare",
      target: "appointment_department_prepare"
    }
  ]);
  replaceOutgoing(doc, "appointment_department_prepare", [
    {
      id: "edge_variant_department_prepare_route",
      target: "appointment_department_route"
    }
  ]);
  replaceOutgoing(doc, "appointment_department_route", [
    {
      id: "edge_variant_department_route_valid",
      target: "appointment_prepare_scope",
      label: "department",
      condition: { operator: "equals", value: "department" }
    },
    {
      id: "edge_variant_department_route_direct_concern",
      target: "appointment_department_ai_match",
      label: "direct_concern",
      condition: { operator: "equals", value: "ai_match" }
    },
    {
      id: "edge_variant_department_route_ask_concern",
      target: "appointment_department_reason_input",
      label: "ask_concern",
      condition: { operator: "equals", value: "ask_concern" },
      isDefault: true
    }
  ]);
  replaceOutgoing(doc, "appointment_department_reason_input", [
    {
      id: "edge_variant_department_reason_ai_match",
      target: "appointment_department_ai_match"
    }
  ]);
  replaceOutgoing(doc, "appointment_department_ai_match", [
    {
      id: "edge_variant_department_ai_prepare",
      target: "appointment_department_match_prepare"
    }
  ]);
  replaceOutgoing(doc, "appointment_department_match_prepare", [
    {
      id: "edge_variant_department_ai_route",
      target: "appointment_department_ai_route"
    }
  ]);
  replaceOutgoing(doc, "appointment_department_ai_route", [
    {
      id: "edge_variant_department_ai_route_matched",
      target: "appointment_department_safe_message",
      label: "matched",
      condition: { operator: "equals", value: "matched" }
    },
    {
      id: "edge_variant_department_ai_route_general_medicine",
      target: "appointment_department_safe_message",
      label: "general_medicine",
      condition: { operator: "equals", value: "general_medicine" }
    },
    {
      id: "edge_variant_department_ai_route_emergency",
      target: "emergency_safety_message",
      label: "emergency",
      condition: { operator: "equals", value: "emergency" }
    },
    {
      id: "edge_variant_department_ai_route_default",
      target: "appointment_department_safe_message",
      label: "default",
      isDefault: true
    }
  ]);
  replaceOutgoing(doc, "appointment_department_safe_message", [
    {
      id: "edge_variant_department_safe_message_prepare_scope",
      target: "appointment_prepare_scope"
    }
  ]);
  addEdge(doc, {
    id: "edge_variant_department_invalid_end",
    source: "appointment_department_invalid_message",
    target: "existing_patient_lookup_otp_invalid_end"
  });
  replaceOutgoing(doc, "appointment_selection_mode_input", [
    {
      id: "edge_variant_selection_mode_department_catalog",
      target: "appointment_department_catalog_fetch",
      label: "department",
      condition: { operator: "equals", value: "department" }
    },
    {
      id: "edge_variant_selection_mode_doctor",
      target: "appointment_direct_doctors_fetch",
      label: "doctor/default",
      isDefault: true
    }
  ]);
  addEdge(doc, {
    id: "edge_variant_department_catalog_prepare",
    source: "appointment_department_catalog_fetch",
    target: "appointment_department_catalog_prepare"
  });
  addEdge(doc, {
    id: "edge_variant_department_catalog_route",
    source: "appointment_department_catalog_prepare",
    target: "appointment_department_catalog_route"
  });
  replaceOutgoing(doc, "appointment_department_catalog_route", [
    {
      id: "edge_variant_department_catalog_available",
      target: "appointment_department_input",
      label: "available",
      condition: { operator: "equals", value: "available" }
    },
    {
      id: "edge_variant_department_catalog_none",
      target: "appointment_department_catalog_unavailable_message",
      label: "none/default",
      isDefault: true
    }
  ]);
  addEdge(doc, {
    id: "edge_variant_department_catalog_unavailable_end",
    source: "appointment_department_catalog_unavailable_message",
    target: "existing_patient_lookup_otp_invalid_end"
  });

  // Match the current healthcare seed field names and booking status values.
  const existingPatientSet = findNode(doc, "appointment_existing_patient_set");
  existingPatientSet.data.assignments = existingPatientSet.data.assignments.map((assignment) =>
    assignment.key === "patient_name"
      ? { ...assignment, value: "{{existing_patient_result.data.display_name}}" }
      : assignment.key === "patient_mobile"
        ? { ...assignment, value: "{{patient_mobile}}" }
        : assignment
  );
  const patientRecord = findNode(doc, "appointment_patient_record");
  patientRecord.data.data = {
    patient_id: "PAT-{{patient_mobile}}",
    display_name: "{{patient_name}}",
    mobile: "{{patient_mobile}}",
    mobile_normalized: "{{patient_mobile_normalized}}",
    email: "{{patient_email}}",
    age: "{{patient_age}}",
    gender: "{{patient_gender}}",
    branch_id: "{{doctor_scope_branch_id}}",
    is_active: true
  };
  patientRecord.data.dataJson = `${JSON.stringify(patientRecord.data.data, null, 2)}\n`;
  patientRecord.data.collectionSchema = {
    collection: "patients",
    fields: {
      patient_id: { type: "string", unique: true, required: true },
      display_name: { type: "string", required: true },
      mobile: { type: "phone", unique: true, required: true },
      mobile_normalized: { type: "string", required: false },
      email: { type: "email", required: false },
      age: { type: "number", required: false },
      gender: { type: "string", required: false },
      branch_id: { type: "string", required: false },
      is_active: { type: "boolean", required: false }
    }
  };
  patientRecord.data.where = { mobile: "{{patient_mobile}}" };
  patientRecord.data.whereJson = JSON.stringify(patientRecord.data.where, null, 2);
  patientRecord.data.uniqueKey = "mobile";
  patientRecord.data.idempotencyKey = "{{patient_mobile}}:patient";
  const existingPatientFind = findNode(doc, "existing_patient_find");
  existingPatientFind.data.collectionSchema = patientRecord.data.collectionSchema;
  existingPatientFind.data.where = { mobile_normalized: "{{patient_mobile_normalized}}" };
  existingPatientFind.data.whereJson = JSON.stringify(existingPatientFind.data.where, null, 2);
  findNode(doc, "existing_patient_not_found_message").data.messages = [
    "I couldn't find an existing hospital profile for this mobile number. I'll collect a few more details to continue your appointment booking."
  ];
  findNode(doc, "appointment_patient_lookup_unavailable_message").data.messages = [
    "I couldn't check the patient details right now. Please try again in a few minutes."
  ];
  const confirmUpdate = findNode(doc, "appointment_confirm_record_update");
  const holdUpdate = findNode(doc, "appointment_slot_hold_update");
  for (const node of [confirmUpdate, holdUpdate]) {
    node.data.data.patient_id = "{{patient_id}}";
    node.data.dataJson = `${JSON.stringify(node.data.data, null, 2)}\n`;
  }
  confirmUpdate.data.data.booking_source = "whatsapp_workflow";
  confirmUpdate.data.data.consultation_mode = "{{consultation_type}}";
  confirmUpdate.data.data.consultation_fee_paise = "{{appointment_booking_fee_paise}}";
  confirmUpdate.data.dataJson = `${JSON.stringify(confirmUpdate.data.data, null, 2)}\n`;
  const duplicateCheck = findNode(doc, "appointment_duplicate_check");
  duplicateCheck.data.where = {
    slot_id: "{{appointment_slot_id}}",
    doctor_id: "{{doctor_id}}",
    patient_id: "{{patient_id}}"
  };
  duplicateCheck.data.whereJson = JSON.stringify(duplicateCheck.data.where, null, 2);
  for (const node of [findNode(doc, "appointment_available_slots_list"), findNode(doc, "appointment_alternate_available_slots_list"), findNode(doc, "appointment_conflict_available_slots_list")]) {
    node.data.where = {
      branch_id: "{{doctor_scope_branch_id}}",
      doctor_id: "{{doctor_id}}",
      is_active: true
    };
    node.data.whereJson = JSON.stringify(node.data.where, null, 2);
  }
  for (const node of [findNode(doc, "appointment_booking_policy_list"), findNode(doc, "appointment_alternate_booking_policy_list"), findNode(doc, "appointment_conflict_booking_policy_list")]) {
    node.data.where = { branch_id: "{{doctor_scope_branch_id}}" };
    node.data.whereJson = JSON.stringify(node.data.where, null, 2);
  }
  for (const node of [findNode(doc, "appointment_schedule_exceptions_list"), findNode(doc, "appointment_alternate_schedule_exceptions_list"), findNode(doc, "appointment_conflict_schedule_exceptions_list")]) {
    node.data.where = {
      branch_id: "{{doctor_scope_branch_id}}",
      doctor_scope_key: "{{appointment_selected_doctor_scope_key}}"
    };
    node.data.whereJson = JSON.stringify(node.data.where, null, 2);
    node.data.collectionSchema = {
      ...node.data.collectionSchema,
      collection: "doctor_schedule_exceptions",
      fields: {
        ...node.data.collectionSchema?.fields,
        exception_id: { type: "string", unique: true, required: false },
        doctor_scope_key: { type: "string", required: true },
        doctor_id: { type: "string", required: false },
        branch_id: { type: "string", required: true },
        exception_date: { type: "string", required: true },
        exception_type: { type: "string", required: true },
        all_day: { type: "boolean", required: false },
        start_time: { type: "string", required: false },
        end_time: { type: "string", required: false },
        reason_code: { type: "string", required: false },
        is_active: { type: "boolean", required: false },
        consultation_mode: { type: "string", required: false }
      }
    };
  }
  for (const node of [findNode(doc, "appointment_active_reservations_list"), findNode(doc, "appointment_alternate_active_reservations_list"), findNode(doc, "appointment_conflict_active_reservations_list")]) {
    node.data.where = {
      branch_id: "{{doctor_scope_branch_id}}",
      doctor_id: "{{doctor_id}}"
    };
    node.data.whereJson = JSON.stringify(node.data.where, null, 2);
  }

  const activeAppointmentNodes = [
    ["appointment_active_appointments_list", "appointment_active_appointments_result", { x: 43080, y: 10440 }],
    ["appointment_alternate_active_appointments_list", "appointment_alternate_active_appointments_result", { x: 43080, y: 12440 }],
    ["appointment_conflict_active_appointments_list", "appointment_conflict_active_appointments_result", { x: 43080, y: 14440 }]
  ];
  for (const [id, outputVar, position] of activeAppointmentNodes) {
    upsertNode(doc, {
      id,
      type: "record",
      position,
      data: {
        data: {},
        limit: 500,
        where: {
          branch_id: "{{doctor_scope_branch_id}}",
          doctor_id: "{{doctor_id}}"
        },
        action: "list",
        offset: 0,
        sortBy: "scheduled_start_at",
        dataJson: "{}",
        outputVar,
        piiFields: "",
        sortOrder: "asc",
        uniqueKey: "",
        whereJson: JSON.stringify({ branch_id: "{{doctor_scope_branch_id}}", doctor_id: "{{doctor_id}}" }, null, 2),
        collection: "appointments",
        encryptPii: false,
        softDelete: true,
        idempotencyKey: "",
        collectionSchema: {
          collection: "appointments",
          fields: {
            appointment_id: { type: "string", required: true },
            status: { type: "string", required: true },
            branch_id: { type: "string", required: false },
            doctor_id: { type: "string", required: true },
            appointment_date: { type: "string", required: false },
            appointment_time: { type: "string", required: false },
            scheduled_start_at: { type: "string", required: false },
            scheduled_end_at: { type: "string", required: false },
            slot_id: { type: "string", required: false }
          }
        },
        schemaName: DOMAIN_RECORD_SCHEMA
      }
    });
  }
  const inventoryChains = [
    ["appointment_active_reservations_list", "appointment_active_appointments_list", "appointment_filter_available_slots", "edge_variant_active_reservations_appointments"],
    ["appointment_alternate_active_reservations_list", "appointment_alternate_active_appointments_list", "appointment_filter_alternate_slots", "edge_variant_alt_active_reservations_appointments"],
    ["appointment_conflict_active_reservations_list", "appointment_conflict_active_appointments_list", "appointment_filter_conflict_slots", "edge_variant_conflict_active_reservations_appointments"]
  ];
  for (const [source, target, filter, edgeId] of inventoryChains) {
    replaceOutgoing(doc, source, [{ id: edgeId, target }]);
    addEdge(doc, { id: `${edgeId}_filter`, source: target, target: filter });
  }
  for (const [id, outputVar] of [
    ["appointment_filter_available_slots", "appointment_active_appointments_result"],
    ["appointment_filter_alternate_slots", "appointment_alternate_active_appointments_result"],
    ["appointment_filter_conflict_slots", "appointment_conflict_active_appointments_result"]
  ]) {
    const node = findNode(doc, id);
    node.data.script = node.data.script.replace(
      /const reservations = rowsFrom\((vars\.[^)]+)\)\.filter\(reservationIsActive\);/,
      (match, reservationVar) => `${match}\nconst appointments = rowsFrom(vars.${outputVar});`
    );
    node.data.script = node.data.script.replace(
      /if \(activeCount >= slot\.capacity\) continue;/,
      `const bookedCount = appointments.filter((appointment) => {
    const status = String(appointment.status || "").toLowerCase();
    if (!["pending_payment", "booked", "confirmed", "checked_in", "called"].includes(status)) return false;
    if (String(appointment.doctor_id || "") !== String(slot.doctor_id || "")) return false;
    const appointmentStart = appointment.scheduled_start_at
      ? Date.parse(String(appointment.scheduled_start_at))
      : Date.parse(String(appointment.appointment_date || "") + "T" + String(appointment.appointment_time || "") + ":00+05:30");
    const slotStart = Date.parse(slot.date + "T" + slot.start + ":00+05:30");
    return Number.isFinite(appointmentStart) && appointmentStart === slotStart;
  }).length;
  const isBooked = activeCount + bookedCount >= slot.capacity;
  unique.set(slotId, {
    ...slot,
    id: slotId,
    slot_id: slotId,
    reservation_key: reservationKey,
    status: isBooked ? "booked" : "available",
    booked: isBooked,
    label: timeLabel(slot.start) + " - " + timeLabel(slot.end)
  });`
    );
    node.data.script = node.data.script.replace(
      /  if \(false\) continue;\n  unique\.set\(slotId, \{\n    \.\.\.slot,\n    id: slotId,\n    slot_id: slotId,\n    reservation_key: reservationKey,\n    label: timeLabel\(slot\.start\) \+ " - " \+ timeLabel\(slot\.end\)\n  \}\);\n/,
      "",
    );
  }
  for (const node of [findNode(doc, "appointment_doctors_fetch"), findNode(doc, "appointment_direct_doctors_fetch")]) {
    node.data.where.booking_enabled = true;
    node.data.whereJson = JSON.stringify(node.data.where, null, 2);
  }
  findNode(doc, "appointment_display_labels_set").data.script = String.raw`
function titleCase(value) {
  return String(value || "")
    .replace(/[_-]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.toLowerCase() === "ent" ? "ENT" : part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
function departmentLabel(value) {
  const raw = String(value || "").trim();
  return raw.toLowerCase() === "ent" ? "ENT" : titleCase(raw);
}
function consultationLabel(value) {
  return String(value || "").toLowerCase() === "in_person" ? "In-person consultation" : titleCase(value);
}
const rows = Array.isArray(vars.appointment_doctors_result?.data) ? vars.appointment_doctors_result.data : [];
const selectedId = String(vars.doctor_id || "").trim();
const selected = rows.find((row) => String(row.doctor_id || "").trim() === selectedId)
  || rows.find((row) => String(row.doctor_scope_key || "").trim() === selectedId)
  || rows[0]
  || {};
vars.appointment_selected_doctor_record = selected;
vars.doctor_id = String(selected.doctor_id || selectedId).trim();
vars.doctor_scope_branch_id = String(selected.branch_id || vars.doctor_scope_branch_id || vars.branch_id || "").trim();
vars.appointment_selected_doctor_scope_key = String(selected.doctor_scope_key || "").trim();
vars.appointment_selected_doctor_fee_paise = Number(selected.consultation_fee_paise || 0) || 0;
vars.appointment_selected_doctor_fee = vars.appointment_selected_doctor_fee_paise > 0
  ? vars.appointment_selected_doctor_fee_paise / 100
  : Number(selected.consultation_fee || vars.appointment_fee || 0) || 0;
vars.appointment_booking_fee = vars.appointment_selected_doctor_fee;
vars.appointment_booking_fee_paise = Math.round(vars.appointment_booking_fee * 100);
vars.appointment_doctor_name = String(selected.display_name || selected.doctor_id || "Doctor").trim();
vars.appointment_department_name = String(selected.department_display_name || departmentLabel(selected.department || vars.department || "")).trim();
vars.appointment_branch_name = String(selected.branch_name || vars.appointment_branch_name || titleCase(selected.branch_id || vars.branch_id || "")).trim();
vars.appointment_consultation_type_label = String(selected.consultation_type_label || consultationLabel(selected.consultation_mode || vars.consultation_type || "")).trim();
vars.payment_status_label = String(vars.payment_status || "pay_at_hospital");
return {
  doctor: vars.appointment_doctor_name,
  department: vars.appointment_department_name,
  branch: vars.appointment_branch_name,
  fee_paise: vars.appointment_booking_fee_paise
  };
  `;
  const prepareHold = findNode(doc, "appointment_prepare_reservation_hold");
  placeScriptAssignmentBeforeReturn(
    prepareHold,
    "vars.appointment_booking_fee_paise = Math.round(Number(vars.appointment_booking_fee || 0) * 100);"
  );

  // Persist the DB's current appointment status and make the final commit
  // order explicit: appointment row first, reservation confirmation second.
  confirmUpdate.data.data.status = "booked";
  confirmUpdate.data.dataJson = `${JSON.stringify(confirmUpdate.data.data, null, 2)}\n`;
  confirmUpdate.data.idempotencyKey = "{{appointment_id}}:booked";
  confirmUpdate.data.collectionSchema.fields.status.values = [
    "pending_payment",
    "booked",
    "confirmed",
    "manual_verify",
    "cancelled",
    "reschedule_requested",
    "completed",
    "checked_in",
    "called"
  ];
  Object.assign(confirmUpdate.data.collectionSchema.fields, {
    booking_source: { type: "string", required: false },
    consultation_mode: { type: "string", required: false },
    consultation_fee_paise: { type: "number", required: false }
  });
  const commitRelease = deepClone(findNode(doc, "appointment_slot_release_update"));
  commitRelease.id = "appointment_commit_release_hold";
  commitRelease.position = { x: 49200, y: 12600 };
  commitRelease.data.outputVar = "appointment_commit_release_result";
  commitRelease.data.idempotencyKey = "{{appointment_reservation_id}}:commit_failed_release";
  const commitCancel = deepClone(confirmUpdate);
  commitCancel.id = "appointment_commit_cancel_record";
  commitCancel.position = { x: 49200, y: 14400 };
  commitCancel.data.data = { status: "cancelled", appointment_id: "{{appointment_id}}" };
  commitCancel.data.dataJson = `${JSON.stringify(commitCancel.data.data, null, 2)}\n`;
  commitCancel.data.where = { appointment_id: "{{appointment_id}}" };
  commitCancel.data.whereJson = JSON.stringify(commitCancel.data.where, null, 2);
  commitCancel.data.outputVar = "appointment_commit_cancel_result";
  commitCancel.data.idempotencyKey = "{{appointment_id}}:commit_failed_cancel";
  upsertNode(doc, commitRelease);
  upsertNode(doc, commitCancel);
  replaceOutgoing(doc, "appointment_payment_record", [
    {
      id: "edge_variant_payment_record_appointment_notify_success",
      target: "appointment_notify",
      label: "success",
      condition: { operator: "equals", value: "success" }
    },
    {
      id: "edge_variant_payment_record_appointment_notify_default",
      target: "appointment_notify",
      label: "failed/default",
      isDefault: true
    }
  ]);
  replaceOutgoing(doc, "appointment_confirm_record_update", [
    {
      id: "edge_variant_appointment_commit_record_success",
      target: "appointment_slot_booked_update",
      label: "success",
      condition: { operator: "equals", value: "success" }
    },
    {
      id: "edge_variant_appointment_commit_record_failure",
      target: "appointment_commit_release_hold",
      label: "failed/default",
      isDefault: true
    }
  ]);
  replaceOutgoing(doc, "appointment_slot_booked_update", [
    {
      id: "edge_variant_appointment_reservation_confirmed",
      target: "appointment_payment_record",
      label: "success",
      condition: { operator: "equals", value: "success" }
    },
    {
      id: "edge_variant_appointment_reservation_conflict",
      target: "appointment_commit_cancel_record",
      label: "failed/default",
      isDefault: true
    }
  ]);
  replaceOutgoing(doc, "appointment_commit_cancel_record", [
    { id: "edge_variant_commit_cancel_release", target: "appointment_commit_release_hold" }
  ]);
  replaceOutgoing(doc, "appointment_commit_release_hold", [
    { id: "edge_variant_commit_release_failed_message", target: "appointment_booking_commit_failed_message" }
  ]);
  findNode(doc, "appointment_booking_commit_failed_message").data.messages = [
    {
      type: "text",
      text: "I couldn't complete that appointment because the selected time was just taken. No appointment was confirmed. Please choose another available date or call {{front_desk_phone}}."
    }
  ];

  const paymentRecord = findNode(doc, "appointment_payment_record");
  appendAssignment(
    findNode(doc, "appointment_set_pay_at_hospital"),
    "payment_id",
    "PAY-HOSPITAL-{{appointment_id}}"
  );
  paymentRecord.data.data = {
    amount_paise: "{{appointment_booking_fee_paise}}",
    status: "{{payment_status}}",
    currency: "{{currency}}",
    provider: "cash_counter",
    payment_method: "cash",
    collected_source: "workflow",
    payment_id: "{{payment_id}}",
    appointment_id: "{{appointment_id}}",
    transaction_ref: "{{appointment_reservation_id}}",
    branch_id: "{{doctor_scope_branch_id}}",
    doctor_id: "{{doctor_id}}",
    patient_id: "{{patient_id}}"
  };
  paymentRecord.data.dataJson = `${JSON.stringify(paymentRecord.data.data, null, 2)}\n`;
  paymentRecord.data.collectionSchema = {
    collection: "payments",
    fields: {
      amount_paise: { type: "number", required: true },
      status: { type: "string", required: true },
      currency: { type: "string", required: true },
      provider: { type: "string", required: false },
      payment_method: { type: "string", required: false },
      collected_source: { type: "string", required: false },
      payment_id: { type: "string", unique: true, required: true },
      appointment_id: { type: "string", required: false },
      transaction_ref: { type: "string", required: false },
      branch_id: { type: "string", required: false },
      doctor_id: { type: "string", required: false },
      patient_id: { type: "string", required: false }
    }
  };
  paymentRecord.data.where = { payment_id: "{{payment_id}}" };
  paymentRecord.data.whereJson = JSON.stringify(paymentRecord.data.where, null, 2);
  paymentRecord.data.idempotencyKey = "{{payment_id}}";

  // The DB uses booking_horizon_days and same_day_booking_allowed names.
  for (const id of ["appointment_filter_available_slots", "appointment_filter_alternate_slots", "appointment_filter_conflict_slots"]) {
    const node = findNode(doc, id);
    node.data.script = node.data.script
      .replace(/Number\(policy\.maximum_advance_booking_days \|\| 31\)/g, "Number(policy.maximum_advance_booking_days ?? policy.booking_horizon_days ?? 30)")
      .replace(/Number\(policy\.minimum_advance_minutes \|\| 60\)/g, "Number(policy.minimum_advance_minutes ?? 30)")
      .replace(/policy\.allow_same_day_booking \?\? \"true\"/g, "(policy.allow_same_day_booking ?? policy.same_day_booking_allowed ?? \"true\")")
      .replace(/Math\.min\(31, Number\(policy\.maximum_advance_booking_days \?\? policy\.booking_horizon_days \?\? 30\) \|\| 31\)/g, "Math.min(30, Number(policy.maximum_advance_booking_days ?? policy.booking_horizon_days ?? 30) || 30)")
      .replace(/Number\(policy\.minimum_advance_minutes \?\? 30\) \|\| 60/g, "Number(policy.minimum_advance_minutes ?? 30) || 30");
  }
  for (const [nodeId, exceptionResultVar] of [
    ["appointment_filter_available_slots", "appointment_schedule_exceptions_result"],
    ["appointment_filter_alternate_slots", "appointment_alternate_schedule_exceptions_result"],
    ["appointment_filter_conflict_slots", "appointment_conflict_schedule_exceptions_result"]
  ]) {
    configureScheduleExceptionScript(findNode(doc, nodeId), exceptionResultVar);
  }
  for (const id of ["appointment_slot_booking", "appointment_alternate_slot_booking", "appointment_conflict_slot_booking"]) {
    const node = findNode(doc, id);
    node.data.horizonDays = 30;
    // The runtime applies this to dynamic slot buttons. Allow both sessions
    // to render when a doctor has a full morning and evening schedule.
    node.data.maxSlotsPerDay = 32;
    node.data.messages = ["Please choose a convenient appointment date."];
    node.data.bookedSlotBehavior = "strikethrough";
  }
  findNode(doc, "appointment_no_slots_message").data.messages = [
    "I couldn't find an available appointment date for this doctor in the next 30 days. Please choose another doctor or try again later."
  ];
  findNode(doc, "appointment_no_slots_end_message").data.messages = [
    "I couldn't find an available appointment date for the selected doctors right now. Please try again later or start a new request from the menu."
  ];
  findNode(doc, "appointment_slot_conflict_message").data.messages = [
    "That appointment time is no longer available. I'll refresh the available dates so you can choose another time."
  ];
  findNode(doc, "appointment_booking_commit_failed_message").data.messages = [
    {
      type: "text",
      text: "I couldn't complete that appointment because the selected time was just taken. No appointment was confirmed. Please choose another available date or call {{front_desk_phone}}."
    }
  ];
  // Sai Deepa's initial configuration is pay-at-hospital only; remove the
  // online payment branch from this focused production variant.
  replaceOutgoing(doc, "appointment_summary_route", [
    { id: "edge_variant_summary_pay_at_hospital_only", target: "appointment_set_pay_at_hospital", isDefault: true }
  ]);

  // Booking commits are an explicit post-confirmation side effect. Keep this
  // guard immediately before the commit chain so legacy or stale paths cannot
  // finalize an appointment without a current confirmation action. The payment
  // record is written only after both the appointment and reservation commit.
  const paymentConfirmationAuthorize = setVariableNode(
    "appointment_payment_confirmation_authorize",
    { x: 48000, y: 9000 },
    [["appointment_confirmation_authorized", "confirmed"]]
  );
  const paymentConfirmationGate = switchNode(
    "appointment_payment_confirmation_gate",
    { x: 49200, y: 9000 },
    "appointment_confirmation_authorized"
  );
  upsertNode(doc, paymentConfirmationAuthorize);
  upsertNode(doc, paymentConfirmationGate);
  replaceOutgoing(doc, "appointment_set_pay_at_hospital", [
    {
      id: "edge_variant_payment_confirmation_gate",
      target: "appointment_payment_confirmation_gate"
    }
  ]);
  replaceOutgoing(doc, "appointment_payment_confirmation_gate", [
    {
      id: "edge_variant_payment_confirmation_authorized",
      target: "appointment_confirm_record_update",
      label: "confirmed",
      condition: { operator: "equals", value: "confirmed" }
    },
    {
      id: "edge_variant_payment_confirmation_blocked",
      target: "appointment_no_booking_message",
      label: "not confirmed/default",
      isDefault: true
    }
  ]);

  // Insert a user confirmation before the reservation hold/booking commit.
  const appointmentReviewText = "Please review your appointment details\n\n👨‍⚕️ Doctor: {{appointment_doctor_name}}\n🏥 Department: {{appointment_department_name}}\n📍 Hospital: Sai Deepa Hospital, Chanda Nagar\n📅 Date: {{appointment_date}}\n🕐 Appointment: {{appointment_slot_label}}\n🩺 Visit Type: In-person consultation\n💰 Consultation Fee: {{currency}} {{appointment_booking_fee}}\n💳 Payment: Pay at hospital";
  const bookingConfirmation = inputNode(
    "appointment_booking_confirmation",
    { x: 46800, y: 9000 },
    appointmentReviewText + "\n\nWould you like to confirm this appointment?",
    "appointment_booking_confirmation_choice",
    [replyButton("✅ Confirm Appointment", "confirm"), replyButton("← Change Appointment", "change_slot")],
    true
  );
  const noBookingMessage = messageNode(
    "appointment_no_booking_message",
    { x: 49200, y: 10300 },
    "No problem. Your appointment was not booked. You can start a new booking whenever you're ready."
  );
  const reselectSlot = deepClone(findNode(doc, "appointment_slot_booking"));
  reselectSlot.id = "appointment_reselect_slot";
  reselectSlot.position = { x: 49200, y: 9000 };
  reselectSlot.data.outputVar = "appointment_reselect_booking";
  reselectSlot.data.messages = ["Please choose a convenient appointment date."];
  const reselectResolve = deepClone(findNode(doc, "appointment_resolve_selected_slot"));
  reselectResolve.id = "appointment_reselect_resolve_selected_slot";
  reselectResolve.position = { x: 50400, y: 9000 };
  reselectResolve.data.script = reselectResolve.data.script
    .replace(/vars\.appointment_booking/g, "vars.appointment_reselect_booking")
    .replace(/vars\.appointment_selected_slot/g, "vars.appointment_reselected_slot");
  reselectResolve.data.outputVar = "appointment_reselected_slot";
  const reselectSetIds = deepClone(findNode(doc, "appointment_set_ids"));
  reselectSetIds.id = "appointment_reselect_set_ids";
  reselectSetIds.position = { x: 51600, y: 9000 };
  const reselectConfirmation = inputNode(
    "appointment_reselect_confirmation",
    { x: 52800, y: 9000 },
    "Would you like to confirm this appointment?",
    "appointment_reselect_confirmation_choice",
    [replyButton("✅ Confirm appointment", "confirm"), replyButton("✖️ Cancel", "cancel")],
    true
  );
  upsertNode(doc, bookingConfirmation);
  upsertNode(doc, noBookingMessage);
  upsertNode(doc, reselectSlot);
  upsertNode(doc, reselectResolve);
  upsertNode(doc, reselectSetIds);
  upsertNode(doc, reselectConfirmation);
  replaceOutgoing(doc, "appointment_set_ids", [
    {
      id: "edge_variant_set_ids_confirmation",
      target: "appointment_booking_confirmation"
    }
  ]);
  replaceOutgoing(doc, "appointment_booking_confirmation", [
    {
      id: "edge_variant_confirmation_confirm",
      target: "appointment_payment_confirmation_authorize",
      label: "confirm",
      condition: { operator: "equals", value: "confirm" }
    },
    {
      id: "edge_variant_confirmation_change_slot",
      target: "appointment_reselect_slot",
      label: "change_slot",
      isDefault: true
    }
  ]);
  replaceOutgoing(doc, "appointment_reselect_slot", [
    { id: "edge_variant_reselect_resolve", target: "appointment_reselect_resolve_selected_slot" }
  ]);
  replaceOutgoing(doc, "appointment_reselect_resolve_selected_slot", [
    { id: "edge_variant_reselect_set_ids", target: "appointment_reselect_set_ids" }
  ]);
  replaceOutgoing(doc, "appointment_reselect_set_ids", [
    { id: "edge_variant_reselect_confirmation", target: "appointment_reselect_confirmation" }
  ]);
  replaceOutgoing(doc, "appointment_reselect_confirmation", [
    {
      id: "edge_variant_reselect_confirm",
      target: "appointment_payment_confirmation_authorize",
      label: "confirm",
      condition: { operator: "equals", value: "confirm" }
    },
    {
      id: "edge_variant_reselect_cancel",
      target: "appointment_no_booking_message",
      label: "cancel",
      isDefault: true
    }
  ]);
  addEdge(doc, {
    id: "edge_variant_no_booking_end",
    source: "appointment_no_booking_message",
    target: "existing_patient_lookup_otp_invalid_end"
  });
  addEdge(doc, {
    id: "edge_variant_payment_authorize_prepare_hold",
    source: "appointment_payment_confirmation_authorize",
    target: "appointment_prepare_reservation_hold"
  });
  // The confirmation input owns the review prompt so the details are shown
  // exactly once immediately before the confirmation buttons. The old
  // summary node is bypassed above and pruned from the export.

  // Use stable appointment IDs for all delivery and scheduler deduplication.
  findNode(doc, "appointment_notify").data = buildNotificationData({
    recipients: [
      { type: "customer", whatsappPhone: "{{patient_mobile}}" }
    ],
    channels: [
      {
        type: "whatsapp",
        enabled: true,
        templateName: "appointment_confirmed",
        language: "{{whatsapp_template_language}}",
        requiresMediaHeader: false,
        variables: {
          "1": "{{patient_name}}",
          "2": "{{appointment_id}}",
          "3": "{{appointment_doctor_name}}",
          "4": "{{appointment_department_name}}",
          "5": "{{appointment_date}}",
          "6": "{{appointment_slot_label}}",
          "7": "{{appointment_branch_name}}",
          "8": "{{appointment_consultation_type_label}}",
          "9": "{{currency}} {{appointment_booking_fee}}",
          "10": "{{payment_status_label}}"
        }
      }
    ],
    dedupeKey: "{{appointment_id}}:confirmation",
    outputVar: "appointment_notification_result",
    messageCategory: "transactional"
  });
  for (const [node, window, template, triggerText] of [
    [reminder12h, "12_hours", "appointment_reminder", "appointment_reminder_12h"],
    [reminder2h, "2_hours", "appointment_reminder", "appointment_reminder_2h"]
  ]) {
    node.data.payload = {
      triggerText,
      type: "appointment_reminder",
      channel: "whatsapp",
      templateName: template,
      language: "{{whatsapp_template_language}}",
      reminder_window: window,
      appointment_id: "{{appointment_id}}",
      patient_mobile: "{{patient_mobile}}",
      variables: {
        appointment_id: "{{appointment_id}}",
        doctor_name: "{{appointment_doctor_name}}",
        department: "{{appointment_department_name}}",
        appointment_date: "{{appointment_date}}",
        appointment_time: "{{appointment_slot_label}}",
        hospital_name: "{{hospital_name}}"
      }
    };
    node.data.dedupeKey = `{{appointment_id}}:{{appointment_scheduled_at}}:appointment_reminder_${window === "12_hours" ? "12h" : "2h"}`;
    node.data.pastTimePolicy = "skip";
    node.data.sendWindow = {
      start: "00:00",
      end: "23:59",
      timezone: "Asia/Kolkata",
      outsideWindowPolicy: "skip"
    };
  }
  appointmentConfirmation.type = "carousel";
  appointmentConfirmation.data = staticCarouselNode(
    "appointment_confirmation",
    { x: 60684, y: 10190 },
    "✅ Your appointment has been confirmed.",
    [
      {
        id: "appointment_confirmation_card",
        type: "card",
        icon: "✅",
        eyebrow: "Sai Deepa Hospital, Chanda Nagar",
        heading: "Appointment Confirmed",
        title: "{{appointment_doctor_name}}",
        description: "{{appointment_department_name}} | In-person consultation",
        fields: {
          "Appointment ID": "{{appointment_id}}",
          "Consultation Fee": "{{currency}} {{appointment_booking_fee}}",
          "Date": "{{appointment_date}}",
          "Time": "{{appointment_slot_label}}",
          "Location": "Sai Deepa Hospital, Chanda Nagar",
          "Payment": "Pay at hospital"
        },
        footer: "Please arrive at the hospital a little early and keep the confirmation message for reference."
      }
    ]
  ).data;

  pruneUnreachable(doc);
  applyDomainRecordSchema(doc);
  doc.metadata.nodeCount = doc.flow.nodes.length;
  return normalizeNotificationFlow(doc);
}

export function writeHospitalAppointmentSingleBranchFlow(doc = buildHospitalAppointmentSingleBranchFlow()) {
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(doc, null, 2)}\n`, "utf8");
  return doc;
}
