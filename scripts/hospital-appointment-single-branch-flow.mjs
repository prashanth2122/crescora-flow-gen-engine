import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
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
export const outputPath = join(
  domainRoot,
  "templates",
  "assai-deepa-hospital-appointment-single-branch.flow.json"
);
const DOMAIN_RECORD_SCHEMA = "healthcare";

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

function replyButton(label, value) {
  return {
    label,
    value,
    actionType: "reply",
    url: "",
    phone: ""
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

function formatDoctorLabelScript({ useDepartmentFilter, optionsVar, promptVar, routeVar, sourceVar, includeBranchLabel = false }) {
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
  if (raw === "in_person") return "Hospital visit";
  return titleCase(raw);
}

function matchesExpectedDoctorContext(row) {
  const expectedDepartment = String(vars.department || "").trim().toLowerCase();
  const expectedBranch = String(vars.doctor_scope_branch_id || vars.branch_id || "").trim().toLowerCase();
  const expectedMode = String(vars.consultation_type || "").trim().toLowerCase();
  if (String(row.is_active ?? "true").toLowerCase() === "false") return false;
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
vars.${optionsVar} = unique.map((row, index) => {
  const department = departmentLabel(row.department);
  const fee = Number(row.consultation_fee || 0) > 0 ? " | Fee INR " + Number(row.consultation_fee) : "";
  const mode = consultationLabel(row.consultation_mode);
  return String(index + 1) + ". " + (row.display_name || row.doctor_id || "Doctor") + " | " + department${branchSegment} + " | " + mode + fee;
}).join("\n");
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
  return JSON.parse(readFileSync(baseSourcePath, "utf8"));
}

export function buildHospitalAppointmentSingleBranchFlow(baseDoc = loadBaseHospitalFlow()) {
  const doc = deepClone(baseDoc);
  doc.exportedAt = new Date().toISOString();
  doc.bot.name = "Hospital Appointment Booking - Single Branch";
  doc.bot.description =
    "Single-branch hospital appointment automation with WhatsApp OTP verification, department or doctor selection, schedule-backed slot booking, pay-at-hospital confirmation, and reminder scheduling.";
  doc.bot.headerTitle = "Hospital Appointment Booking";
  doc.bot.headerTagline = "Single-branch appointment automation";
  setGlobal(doc, "default_branch_id", "main_branch");
  setGlobal(doc, "default_branch_name", "Main Branch");
  setGlobal(doc, "otp_expiry_minutes", "5");
  doc.metadata.clientVariant = "single_branch_appointment_only";
  doc.metadata.runtimeDomainSchema = "healthcare";
  doc.metadata.runtimeTableFamily = "healthcare.flow_records";
  doc.metadata.variantBuiltFrom = "domains/hospital/templates-source/hospital-full-automation.source.flow.json";

  const appointmentIntro = findNode(doc, "appointment_intro");
  appointmentIntro.data.messages = [
    {
      type: "text",
      text: "I will help you book an appointment for this hospital. I will verify the patient's mobile number first, then continue through department or doctor selection, slot selection, and confirmation."
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
      ["appointment_consultation_type_label", "Hospital visit"]
    ]
  );
  upsertNode(doc, clientDefaultsNode);
  replaceOutgoing(doc, "set_template_defaults", [
    {
      id: "edge_variant_set_template_defaults_client_defaults",
      target: "appointment_client_defaults_set"
    }
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
    "Enter the patient's mobile number. I will send a WhatsApp OTP to this number before I check any appointment data."
  ];

  const otpNode = {
    id: "existing_patient_lookup_otp",
    type: "otp",
    position: { x: 15360, y: 7836 },
    data: {
      promptText: "Enter the 6-digit verification code sent on WhatsApp to continue.",
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
      smsMessageTemplate: "Your verification code is {{otp}}. It expires in {{otp_ttl_minutes}} minutes.",
      smsTemplateName: "",
      smsTemplateVariablesJson: "{\n  \"1\": \"{{otp}}\"\n}",
      smsSenderId: "",
      smsPeid: "",
      smsCtid: "",
      whatsappMessageTemplate: "Your verification code is {{otp}}. It expires in {{otp_ttl_minutes}} minutes.",
      whatsappTemplateName: "",
      whatsappTemplateLanguage: "en",
      whatsappTemplateVariablesJson: "{\n  \"1\": \"{{otp}}\",\n  \"2\": \"{{otp_ttl_minutes}}\",\n  \"3\": \"{{hospital_name}}\"\n}",
      emailSubject: "Your verification code",
      emailBody: "Your verification code is {{otp}}. It expires in {{otp_ttl_minutes}} minutes.",
      emailBodyType: "text",
      emailReplyTo: "",
      outputVar: "existing_patient_lookup_otp_result"
    }
  };
  const otpSendFailedMessage = messageNode(
    "existing_patient_lookup_otp_send_failed_message",
    { x: 15960, y: 8460 },
    "I could not send the appointment verification OTP on WhatsApp right now. Please call {{front_desk_phone}} to complete the booking with the hospital team."
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
      text: "We could not verify the OTP after 3 attempts. Please call {{front_desk_phone}} to continue the appointment booking, or close this conversation and try again later."
    }
  ];

  const selectionModeInput = inputNode(
    "appointment_selection_mode_input",
    { x: 25800, y: 7050 },
    "How would you like to choose the doctor for this appointment?",
    "appointment_selection_mode",
    [
      replyButton("Select department", "department"),
      replyButton("Select doctor", "doctor")
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
    [replyButton("Proceed", "proceed"), replyButton("Close conversation", "close")],
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
  if (raw === "in_person") return "Hospital visit";
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
      {
        type: "customer",
        phone: "{{patient_mobile}}",
        whatsappPhone: "{{patient_mobile}}"
      }
    ],
    channels: [
      {
        type: "whatsapp",
        enabled: true,
        templateName: "appointment_confirmed"
      }
    ],
    dedupeKey: "{{system.sessionId}}:appointment_confirmation_whatsapp",
    outputVar: "appointment_notification_result",
    messageCategory: "transactional"
  });

  const reminder12h = deepClone(findNode(doc, "appointment_reminder_scheduler"));
  reminder12h.id = "appointment_reminder_12h_scheduler";
  reminder12h.position = { x: 59580, y: 10040 };
  reminder12h.data.runAt = "{{appointment_scheduled_at}}";
  reminder12h.data.offset = { unit: "hours", value: 12, direction: "before" };
  reminder12h.data.payload = {
    type: "appointment_reminder",
    reminder_window: "12_hours",
    appointment_id: "{{appointment_id}}",
    patient_mobile: "{{patient_mobile}}"
  };
  reminder12h.data.dedupeKey = "{{system.sessionId}}:appointment_reminder_12h";
  reminder12h.data.outputVar = "appointment_reminder_12h_result";
  const reminder2h = deepClone(findNode(doc, "appointment_reminder_scheduler"));
  reminder2h.id = "appointment_reminder_2h_scheduler";
  reminder2h.position = { x: 60120, y: 10040 };
  reminder2h.data.runAt = "{{appointment_scheduled_at}}";
  reminder2h.data.offset = { unit: "hours", value: 2, direction: "before" };
  reminder2h.data.payload = {
    type: "appointment_reminder",
    reminder_window: "2_hours",
    appointment_id: "{{appointment_id}}",
    patient_mobile: "{{patient_mobile}}"
  };
  reminder2h.data.dedupeKey = "{{system.sessionId}}:appointment_reminder_2h";
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
  appointmentConfirmation.data.messages = [
    {
      type: "text",
      text: "Your appointment booking is confirmed.\n\nAppointment ID: {{appointment_id}}\nDoctor: {{appointment_doctor_name}}\nDepartment: {{appointment_department_name}}\nDate: {{appointment_date}}\nTime: {{appointment_slot_label}}\nPayment: Pay at hospital\n\nA confirmation WhatsApp notification has been sent. Reminder notifications are scheduled for 12 hours and 2 hours before the appointment. Please arrive 15 minutes early."
    }
  ];
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
    "Your existing future appointment remains unchanged. If you need any help, please call {{front_desk_phone}}."
  );
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
