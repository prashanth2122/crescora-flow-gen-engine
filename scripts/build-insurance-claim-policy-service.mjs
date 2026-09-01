import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { notificationData } from "./notification-data.mjs";

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const domainRoot = join(rootDir, "domains", "insurance");
const sourcePath = join(
  domainRoot,
  "templates-source",
  "insurance-claim-policy-service.source.flow.json"
);
const builtPath = join(
  domainRoot,
  "templates",
  "insurance-claim-policy-service.flow.json"
);
const stablePath = join(
  domainRoot,
  "templates-stable",
  "insurance-claim-policy-service.flow.json"
);

const exportDoc = {
  version: "1.0",
  exportedAt: "2026-08-25T00:00:00.000Z",
  bot: {
    name: "Insurance Claim & Policy Service Assistant",
    description:
      "Automation-first insurance assistant covering policy help, policy details, claim registration, document follow-up, claim status, settlement status, service requests, and grievance escalation.",
    headerTitle: "Insurance Assistance",
    headerTagline: "Policy help and digital claims operations",
    globalVariables: [
      { key: "insurer_name", value: "Northstar Insurance" },
      { key: "brand_name", value: "Crescora.ai" },
      { key: "default_currency", value: "INR" },
      { key: "default_timezone", value: "Asia/Kolkata" },
      { key: "claims_support_phone", value: "+91-90000-81000" },
      { key: "policy_support_phone", value: "+91-90000-82000" },
      { key: "service_support_email", value: "service@northstar-insurance.example" },
      { key: "settlement_support_email", value: "settlements@northstar-insurance.example" }
    ]
  },
  flow: {
    version: { major: 1, minor: 0, patch: 0 },
    nodes: [],
    edges: []
  },
  metadata: {
    flowVersion: 1,
    nodeCount: 0
  }
};

const { nodes, edges } = exportDoc.flow;
let edgeSeq = 1;
const DOMAIN_RECORD_SCHEMA = "insurance";

function pretty(value) {
  return JSON.stringify(value, null, 2);
}

function text(value) {
  return [{ type: "text", text: value }];
}

function node(id, type, x, y, data = {}) {
  nodes.push({ id, type, position: { x, y }, data });
}

function edge(source, target, options = {}) {
  const item = {
    id: `edge_${String(edgeSeq++).padStart(3, "0")}_${source}_${target}`,
    source,
    target,
    type: "smoothstep",
    isDefault: Boolean(options.isDefault)
  };

  if (options.label) item.label = options.label;
  if (options.condition) item.condition = options.condition;
  edges.push(item);
}

function edgeValue(source, value, target, label = value) {
  edge(source, target, {
    label,
    condition: { operator: "equals", value }
  });
}

function msgData(message, buttons = []) {
  return {
    messages: text(message),
    buttons
  };
}

function inputData(message, variable, buttons = [], disableChatInput = false) {
  return {
    messages: text(message),
    variable,
    buttons,
    disableChatInput
  };
}

function formData(message, fields, outputVar) {
  return {
    messages: [message],
    fields,
    fieldsJson: pretty(fields),
    outputVar,
    mapToVariables: true
  };
}

function setVars(assignments) {
  return {
    assignments: Object.entries(assignments).map(([key, value]) => ({
      key,
      value
    }))
  };
}

function scriptData(script, outputVar, timeoutMs = 120) {
  return {
    script,
    outputVar,
    timeoutMs
  };
}

function switchData(variable) {
  return { variable };
}

function recordData({
  action,
  collection,
  where = {},
  data = {},
  schema,
  uniqueKey = "",
  idempotencyKey = "",
  outputVar,
  limit = 20,
  sortBy = "updatedAt",
  sortOrder = "desc",
  piiFields = ""
}) {
  return {
    action,
    schemaName: DOMAIN_RECORD_SCHEMA,
    collection,
    where,
    whereJson: pretty(where),
    data,
    dataJson: pretty(data),
    collectionSchema: schema,
    uniqueKey,
    idempotencyKey,
    outputVar,
    limit,
    offset: 0,
    sortBy,
    sortOrder,
    softDelete: true,
    encryptPii: false,
    piiFields
  };
}

function schedulerData({
  runAt,
  offsetValue,
  offsetUnit,
  offsetDirection,
  payload,
  outputVar,
  dedupeKey
}) {
  return {
    scheduleType: "relative",
    runAt,
    offsetValue,
    offsetUnit,
    offsetDirection,
    timezone: "{{default_timezone}}",
    dedupeKey,
    payload,
    payloadJson: pretty(payload),
    maxExecutions: 1,
    expiryAt: "",
    pastTimePolicy: "send_immediately",
    sendWindowStart: "08:00",
    sendWindowEnd: "20:00",
    sendWindowTimezone: "{{default_timezone}}",
    outsideWindowPolicy: "send_next_window",
    outputVar
  };
}

function queueData(queueName, priority, skillsRequiredCsv, slaFirstResponseMinutes, outputVar) {
  return {
    queueName,
    assignmentStrategy: priority === "critical" ? "priority" : "skill_based",
    priority,
    skillsRequiredCsv,
    skillsRequired: skillsRequiredCsv.split(",").filter(Boolean),
    slaFirstResponseMinutes,
    dedupeKey: `{{system.sessionId}}:${queueName}`,
    outputVar
  };
}

function handoverData(message) {
  return {
    channel: "human",
    messages: [message]
  };
}

function approvalData({ title, message, approvers, outputVar, waitingMessage }) {
  return {
    approvalTitle: title,
    approvalMessage: message,
    approversJson: pretty(approvers),
    approvers,
    approvalMode: "any_one",
    timeoutValue: 4,
    timeoutUnit: "hours",
    onTimeout: "escalate",
    buttonsCsv: "approve,reject,request_more_info",
    buttons: ["approve", "reject", "request_more_info"],
    approvalExpiryPolicy: "reject_late_action",
    waitingMessage,
    outputVar
  };
}

function recordRoutes(recordId, successId, defaultId, duplicateId = successId, notFoundId = defaultId) {
  edgeValue(recordId, "success", successId, "success");
  edgeValue(recordId, "duplicate", duplicateId, "duplicate");
  edgeValue(recordId, "not_found", notFoundId, "not_found");
  edge(recordId, defaultId, { isDefault: true, label: "validation_failed/failed/default" });
}

function scriptRoutes(scriptId, successId, failureId) {
  edgeValue(scriptId, "success", successId, "success");
  edge(scriptId, failureId, { isDefault: true, label: "failed/default" });
}

function notificationRoutes(notificationId, nextId) {
  edgeValue(notificationId, "sent", nextId, "sent");
  edgeValue(notificationId, "partially_sent", nextId, "partially_sent");
  edge(notificationId, nextId, { isDefault: true, label: "failed/default" });
}

function schedulerRoutes(schedulerId, nextId) {
  edgeValue(schedulerId, "scheduled", nextId, "scheduled");
  edgeValue(schedulerId, "skipped", nextId, "skipped");
  edge(schedulerId, nextId, { isDefault: true, label: "failed/default" });
}

function queueRoutes(queueId, nextId) {
  edgeValue(queueId, "assigned", nextId, "assigned");
  edgeValue(queueId, "queued", nextId, "queued");
  edge(queueId, nextId, { isDefault: true, label: "failed/default" });
}

const schemas = {
  customers: pretty({
    collection: "insurance_customers",
    fields: {
      customer_id: { type: "string", required: true, unique: true },
      external_customer_id: { type: "string", required: false, unique: true },
      full_name: { type: "string", required: true },
      phone: { type: "phone", required: true, unique: true },
      email: { type: "email", required: false },
      preferred_language: { type: "string", required: false },
      status: { type: "string", required: true }
    }
  }),
  products: pretty({
    collection: "insurance_products",
    fields: {
      product_id: { type: "string", required: true, unique: true },
      product_code: { type: "string", required: true, unique: true },
      product_name: { type: "string", required: true },
      product_type: { type: "string", required: true },
      version: { type: "string", required: false },
      status: { type: "string", required: true }
    }
  }),
  policies: pretty({
    collection: "policies",
    fields: {
      policy_id: { type: "string", required: true, unique: true },
      policy_number: { type: "string", required: true, unique: true },
      external_policy_id: { type: "string", required: false, unique: true },
      product_id: { type: "string", required: true },
      product_code: { type: "string", required: true },
      product_name: { type: "string", required: true },
      primary_customer_id: { type: "string", required: true },
      primary_customer_phone: { type: "phone", required: true },
      primary_customer_name: { type: "string", required: true },
      status: { type: "string", required: true },
      start_date: { type: "string", required: true },
      end_date: { type: "string", required: true },
      sum_insured: { type: "number", required: false },
      currency: { type: "string", required: true },
      members_summary: { type: "string", required: false },
      coverage_summary: { type: "string", required: false },
      exclusions_summary: { type: "string", required: false },
      policy_download_url: { type: "url", required: false },
      premium_status: { type: "string", required: false }
    }
  }),
  claimTypes: pretty({
    collection: "claim_types",
    fields: {
      claim_type_id: { type: "string", required: true, unique: true },
      product_code: { type: "string", required: true },
      claim_type_code: { type: "string", required: true },
      display_name: { type: "string", required: true },
      status: { type: "string", required: true },
      form_hint: { type: "string", required: false }
    }
  }),
  claimDocumentRules: pretty({
    collection: "claim_document_rules",
    fields: {
      rule_id: { type: "string", required: true, unique: true },
      product_code: { type: "string", required: true },
      claim_type_code: { type: "string", required: true },
      document_type_code: { type: "string", required: true },
      document_name: { type: "string", required: true },
      requirement_type: { type: "string", required: true },
      display_order: { type: "number", required: true },
      status: { type: "string", required: true }
    }
  }),
  claims: pretty({
    collection: "claims",
    fields: {
      claim_id: { type: "string", required: true, unique: true },
      claim_number: { type: "string", required: true, unique: true },
      claim_request_id: { type: "string", required: false, unique: true },
      policy_id: { type: "string", required: true },
      policy_number: { type: "string", required: true },
      customer_id: { type: "string", required: true },
      customer_mobile: { type: "phone", required: true },
      product_code: { type: "string", required: true },
      claim_type_code: { type: "string", required: true },
      claim_type_name: { type: "string", required: true },
      canonical_status: { type: "string", required: true },
      external_status: { type: "string", required: false },
      incident_date: { type: "string", required: true },
      incident_time: { type: "string", required: false },
      incident_location: { type: "string", required: false },
      incident_summary: { type: "string", required: false },
      claimed_amount_minor: { type: "number", required: false },
      currency: { type: "string", required: true },
      required_document_count: { type: "number", required: false },
      received_document_count: { type: "number", required: false },
      outstanding_requirements: { type: "string", required: false },
      requirements_summary: { type: "string", required: false },
      document_completeness_pct: { type: "number", required: false },
      sync_state: { type: "string", required: true },
      dedupe_fingerprint: { type: "string", required: false },
      external_claim_number: { type: "string", required: false },
      created_at: { type: "string", required: false },
      updated_at: { type: "string", required: false },
      last_status_label: { type: "string", required: false }
    }
  }),
  claimRequirements: pretty({
    collection: "claim_requirements",
    fields: {
      requirement_set_id: { type: "string", required: true, unique: true },
      claim_id: { type: "string", required: true },
      claim_number: { type: "string", required: true },
      requirement_status: { type: "string", required: true },
      outstanding_requirements: { type: "string", required: false },
      received_requirements: { type: "string", required: false },
      required_document_count: { type: "number", required: false },
      received_document_count: { type: "number", required: false }
    }
  }),
  claimDocuments: pretty({
    collection: "claim_documents",
    fields: {
      claim_document_id: { type: "string", required: true, unique: true },
      claim_id: { type: "string", required: true },
      claim_number: { type: "string", required: true },
      document_batch_ref: { type: "string", required: true },
      uploaded_document_count: { type: "number", required: true },
      processing_status: { type: "string", required: true },
      verification_status: { type: "string", required: true },
      notes: { type: "string", required: false }
    }
  }),
  claimStatusHistory: pretty({
    collection: "claim_status_history",
    fields: {
      status_event_id: { type: "string", required: true, unique: true },
      claim_id: { type: "string", required: true },
      claim_number: { type: "string", required: true },
      from_status: { type: "string", required: false },
      to_status: { type: "string", required: true },
      external_status: { type: "string", required: false },
      customer_message: { type: "string", required: false },
      source: { type: "string", required: true },
      created_at: { type: "string", required: true }
    }
  }),
  claimSettlements: pretty({
    collection: "claim_settlements",
    fields: {
      settlement_id: { type: "string", required: true, unique: true },
      claim_id: { type: "string", required: true },
      claim_number: { type: "string", required: true },
      settlement_reference: { type: "string", required: true, unique: true },
      decision_type: { type: "string", required: true },
      approved_amount_minor: { type: "number", required: false },
      currency: { type: "string", required: true },
      payment_status: { type: "string", required: true },
      payment_reference: { type: "string", required: false }
    }
  }),
  serviceRequests: pretty({
    collection: "service_requests",
    fields: {
      service_request_id: { type: "string", required: true, unique: true },
      request_number: { type: "string", required: true, unique: true },
      policy_id: { type: "string", required: true },
      policy_number: { type: "string", required: true },
      customer_id: { type: "string", required: true },
      request_type: { type: "string", required: true },
      status: { type: "string", required: true },
      request_summary: { type: "string", required: false },
      created_at: { type: "string", required: true }
    }
  }),
  grievances: pretty({
    collection: "insurance_grievances",
    fields: {
      grievance_id: { type: "string", required: true, unique: true },
      grievance_number: { type: "string", required: true, unique: true },
      claim_id: { type: "string", required: false },
      claim_number: { type: "string", required: false },
      customer_id: { type: "string", required: true },
      priority: { type: "string", required: true },
      status: { type: "string", required: true },
      summary: { type: "string", required: true },
      assigned_queue: { type: "string", required: true },
      created_at: { type: "string", required: true }
    }
  }),
  integrationOutbox: pretty({
    collection: "integration_outbox",
    fields: {
      outbox_event_id: { type: "string", required: true, unique: true },
      aggregate_type: { type: "string", required: true },
      aggregate_id: { type: "string", required: true },
      event_type: { type: "string", required: true },
      payload_summary: { type: "string", required: false },
      status: { type: "string", required: true },
      attempt_count: { type: "number", required: false },
      next_attempt_at: { type: "string", required: false }
    }
  })
};

const policyLookupFields = [
  {
    key: "policy_lookup_value",
    label: "Policy number or registered mobile",
    type: "text",
    required: true
  }
];

const claimLookupFields = [
  {
    key: "claim_lookup_value",
    label: "Claim number or registered mobile",
    type: "text",
    required: true
  }
];

const incidentCoreFields = [
  {
    key: "incident_date",
    label: "Incident date",
    type: "date",
    required: true
  },
  {
    key: "incident_time",
    label: "Incident time",
    type: "text",
    required: false
  },
  {
    key: "incident_location",
    label: "Incident location",
    type: "text",
    required: false
  },
  {
    key: "incident_description",
    label: "Describe what happened",
    type: "textarea",
    required: true
  },
  {
    key: "claimant_relationship",
    label: "Claimant relationship",
    type: "select",
    required: true,
    options: ["self", "spouse", "child", "parent", "insured_driver", "nominee", "other"]
  },
  {
    key: "contact_phone",
    label: "Contact phone",
    type: "phone",
    required: true
  },
  {
    key: "contact_email",
    label: "Contact email",
    type: "email",
    required: false
  },
  {
    key: "claimed_amount_inr",
    label: "Claim amount (INR)",
    type: "number",
    required: false
  }
];

const claimSpecificFields = [
  {
    key: "product_specific_details",
    label: "Additional claim details",
    type: "textarea",
    required: true
  },
  {
    key: "incident_supporting_reference",
    label: "Hospital, garage, flight, police, or provider reference",
    type: "text",
    required: false
  }
];

const serviceRequestFields = [
  {
    key: "service_request_summary",
    label: "Request details",
    type: "textarea",
    required: true
  }
];

const grievanceFields = [
  {
    key: "grievance_reason",
    label: "Reason",
    type: "select",
    required: true,
    options: ["claim_rejected", "document_query", "delay", "settlement_dispute", "service_issue", "other"]
  },
  {
    key: "grievance_summary",
    label: "Explain the issue",
    type: "textarea",
    required: true
  }
];

const talkAgentFields = [
  {
    key: "agent_context_reference",
    label: "Policy number, claim number, or request reference",
    type: "text",
    required: false
  },
  {
    key: "agent_reason",
    label: "Reason",
    type: "textarea",
    required: true
  }
];

const arrayReaderBlock = `
function getRows(result) {
  if (!result) return [];
  if (Array.isArray(result)) return result;
  if (Array.isArray(result.records)) {
    return result.records.map((item) => item?.data || item?.dataJson || item);
  }
  if (Array.isArray(result.items)) {
    return result.items.map((item) => item?.data || item?.dataJson || item);
  }
  if (Array.isArray(result.data)) {
    return result.data.map((item) => item?.data || item?.dataJson || item);
  }
  if (result.record) return [result.record];
  if (result.data && typeof result.data === "object" && !Array.isArray(result.data)) {
    return [result.data];
  }
  if (typeof result === "object") return [result];
  return [];
}
function firstRow(result) {
  return getRows(result)[0] || {};
}
function normalizePhone(value) {
  const digits = String(value || "").replace(/\\D/g, "");
  if (!digits) return "";
  const local = digits.slice(-10);
  return local ? "+91" + local : "";
}
function formatMoneyMinor(value) {
  const amount = Number(value || 0) / 100;
  return "₹" + amount.toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
}
function splitRequirements(value) {
  return String(value || "")
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean);
}
`;

function otpValidationScript(inputVar) {
  return `
const otp = String(vars.${inputVar} || "").trim();
vars.verification_status = /^\\d{6}$/.test(otp) ? "valid" : "invalid";
return "success";
`;
}

const policyLookupModeScript = `
${arrayReaderBlock}
const raw = String(vars.policy_lookup_value || "").trim();
const digits = raw.replace(/\\D/g, "");
vars.policy_lookup_phone_e164 = digits.length >= 10 ? normalizePhone(raw) : "";
vars.policy_search_mode = vars.policy_lookup_phone_e164 ? "mobile" : "policy_number";
return "success";
`;

const setPolicyFromRecordScript = `
${arrayReaderBlock}
const row = firstRow(vars.policy_find_by_number_result);
if (!row || !row.policy_id) {
  vars.policy_selection_state = "not_found";
  return "success";
}
vars.policy_selection_state = "selected";
vars.selected_policy_id = row.policy_id || "";
vars.selected_policy_number = row.policy_number || "";
vars.selected_product_id = row.product_id || "";
vars.selected_product_code = row.product_code || "";
vars.selected_product_name = row.product_name || "";
vars.selected_customer_id = row.primary_customer_id || "";
vars.selected_customer_name = row.primary_customer_name || "";
vars.selected_customer_mobile = row.primary_customer_phone || "";
vars.selected_policy_status = row.status || "";
vars.selected_policy_start_date = row.start_date || "";
vars.selected_policy_end_date = row.end_date || "";
vars.selected_policy_sum_insured = row.sum_insured || "";
vars.selected_policy_members_summary = row.members_summary || "";
vars.selected_policy_coverage_summary = row.coverage_summary || "";
vars.selected_policy_exclusions_summary = row.exclusions_summary || "";
vars.selected_policy_download_url = row.policy_download_url || "";
return "success";
`;

const policyOptionsScript = `
${arrayReaderBlock}
const rows = getRows(vars.policy_find_by_mobile_result);
if (!rows.length) {
  vars.policy_selection_state = "not_found";
  vars.policy_options_text = "";
  return "success";
}
if (rows.length === 1) {
  const row = rows[0];
  vars.policy_selection_state = "selected";
  vars.selected_policy_id = row.policy_id || "";
  vars.selected_policy_number = row.policy_number || "";
  vars.selected_product_id = row.product_id || "";
  vars.selected_product_code = row.product_code || "";
  vars.selected_product_name = row.product_name || "";
  vars.selected_customer_id = row.primary_customer_id || "";
  vars.selected_customer_name = row.primary_customer_name || "";
  vars.selected_customer_mobile = row.primary_customer_phone || "";
  vars.selected_policy_status = row.status || "";
  vars.selected_policy_start_date = row.start_date || "";
  vars.selected_policy_end_date = row.end_date || "";
  vars.selected_policy_sum_insured = row.sum_insured || "";
  vars.selected_policy_members_summary = row.members_summary || "";
  vars.selected_policy_coverage_summary = row.coverage_summary || "";
  vars.selected_policy_exclusions_summary = row.exclusions_summary || "";
  vars.selected_policy_download_url = row.policy_download_url || "";
  return "success";
}
vars.policy_selection_state = "multiple";
vars.policy_options_text = rows
  .map((row, index) => {
    return [
      String(index + 1) + ". " + (row.product_name || row.product_code || "Policy"),
      "Policy: " + (row.policy_number || ""),
      "Status: " + (row.status || ""),
      "Coverage: " + formatMoneyMinor(row.sum_insured || 0)
    ].join(" | ");
  })
  .join("\\n");
return "success";
`;

const policyChoiceScript = `
${arrayReaderBlock}
const rows = getRows(vars.policy_find_by_mobile_result);
const choice = Number(String(vars.policy_choice || "").trim());
if (!Number.isInteger(choice) || choice < 1 || choice > rows.length) {
  vars.policy_selection_state = "invalid";
  return "success";
}
const row = rows[choice - 1];
vars.policy_selection_state = "selected";
vars.selected_policy_id = row.policy_id || "";
vars.selected_policy_number = row.policy_number || "";
vars.selected_product_id = row.product_id || "";
vars.selected_product_code = row.product_code || "";
vars.selected_product_name = row.product_name || "";
vars.selected_customer_id = row.primary_customer_id || "";
vars.selected_customer_name = row.primary_customer_name || "";
vars.selected_customer_mobile = row.primary_customer_phone || "";
vars.selected_policy_status = row.status || "";
vars.selected_policy_start_date = row.start_date || "";
vars.selected_policy_end_date = row.end_date || "";
vars.selected_policy_sum_insured = row.sum_insured || "";
vars.selected_policy_members_summary = row.members_summary || "";
vars.selected_policy_coverage_summary = row.coverage_summary || "";
vars.selected_policy_exclusions_summary = row.exclusions_summary || "";
vars.selected_policy_download_url = row.policy_download_url || "";
return "success";
`;

const policyCardScript = `
${arrayReaderBlock}
vars.selected_policy_card = [
  (vars.selected_product_name || "Policy"),
  "",
  "Policy: " + (vars.selected_policy_number || ""),
  "Status: " + (vars.selected_policy_status || ""),
  "Coverage: " + formatMoneyMinor(vars.selected_policy_sum_insured || 0),
  "Start: " + (vars.selected_policy_start_date || ""),
  "End: " + (vars.selected_policy_end_date || ""),
  "Members: " + (vars.selected_policy_members_summary || "Not available"),
  "",
  "Coverage summary: " + (vars.selected_policy_coverage_summary || "Loaded from policy snapshot")
].join("\\n");
return "success";
`;

const claimLookupModeScript = `
${arrayReaderBlock}
const raw = String(vars.claim_lookup_value || "").trim();
const digits = raw.replace(/\\D/g, "");
vars.claim_lookup_phone_e164 = digits.length >= 10 ? normalizePhone(raw) : "";
vars.claim_search_mode = /^CLM/i.test(raw) ? "claim_number" : vars.claim_lookup_phone_e164 ? "mobile" : "claim_number";
return "success";
`;

const setClaimFromRecordScript = `
${arrayReaderBlock}
const row = firstRow(vars.claim_find_by_number_result);
if (!row || !row.claim_id) {
  vars.claim_selection_state = "not_found";
  return "success";
}
vars.claim_selection_state = "selected";
vars.selected_claim_id = row.claim_id || "";
vars.selected_claim_number = row.claim_number || "";
vars.selected_claim_request_id = row.claim_request_id || "";
vars.selected_claim_policy_id = row.policy_id || "";
vars.selected_claim_policy_number = row.policy_number || "";
vars.selected_customer_id = row.customer_id || vars.selected_customer_id || "";
vars.selected_customer_mobile = row.customer_mobile || vars.selected_customer_mobile || "";
vars.selected_product_code = row.product_code || vars.selected_product_code || "";
vars.selected_claim_type_code = row.claim_type_code || "";
vars.selected_claim_type_name = row.claim_type_name || "";
vars.selected_claim_status = row.canonical_status || "";
vars.selected_claim_status_label = row.last_status_label || row.canonical_status || "";
vars.selected_claim_outstanding_requirements = row.outstanding_requirements || "";
vars.selected_claim_required_document_count = row.required_document_count || 0;
vars.selected_claim_received_document_count = row.received_document_count || 0;
vars.selected_claimed_amount_display = formatMoneyMinor(row.claimed_amount_minor || 0);
return "success";
`;

const claimOptionsScript = `
${arrayReaderBlock}
const rows = getRows(vars.claim_find_by_mobile_result);
if (!rows.length) {
  vars.claim_selection_state = "not_found";
  vars.claim_options_text = "";
  return "success";
}
if (rows.length === 1) {
  const row = rows[0];
  vars.claim_selection_state = "selected";
  vars.selected_claim_id = row.claim_id || "";
  vars.selected_claim_number = row.claim_number || "";
  vars.selected_claim_request_id = row.claim_request_id || "";
  vars.selected_claim_policy_id = row.policy_id || "";
  vars.selected_claim_policy_number = row.policy_number || "";
  vars.selected_customer_id = row.customer_id || vars.selected_customer_id || "";
  vars.selected_customer_mobile = row.customer_mobile || vars.selected_customer_mobile || "";
  vars.selected_product_code = row.product_code || vars.selected_product_code || "";
  vars.selected_claim_type_code = row.claim_type_code || "";
  vars.selected_claim_type_name = row.claim_type_name || "";
  vars.selected_claim_status = row.canonical_status || "";
  vars.selected_claim_status_label = row.last_status_label || row.canonical_status || "";
  vars.selected_claim_outstanding_requirements = row.outstanding_requirements || "";
  vars.selected_claim_required_document_count = row.required_document_count || 0;
  vars.selected_claim_received_document_count = row.received_document_count || 0;
  vars.selected_claimed_amount_display = formatMoneyMinor(row.claimed_amount_minor || 0);
  return "success";
}
vars.claim_selection_state = "multiple";
vars.claim_options_text = rows
  .map((row, index) => {
    return [
      String(index + 1) + ". " + (row.claim_number || ""),
      (row.claim_type_name || row.claim_type_code || ""),
      "Status: " + (row.canonical_status || ""),
      "Amount: " + formatMoneyMinor(row.claimed_amount_minor || 0)
    ].join(" | ");
  })
  .join("\\n");
return "success";
`;

const claimChoiceScript = `
${arrayReaderBlock}
const rows = getRows(vars.claim_find_by_mobile_result);
const choice = Number(String(vars.claim_choice || "").trim());
if (!Number.isInteger(choice) || choice < 1 || choice > rows.length) {
  vars.claim_selection_state = "invalid";
  return "success";
}
const row = rows[choice - 1];
vars.claim_selection_state = "selected";
vars.selected_claim_id = row.claim_id || "";
vars.selected_claim_number = row.claim_number || "";
vars.selected_claim_request_id = row.claim_request_id || "";
vars.selected_claim_policy_id = row.policy_id || "";
vars.selected_claim_policy_number = row.policy_number || "";
vars.selected_customer_id = row.customer_id || vars.selected_customer_id || "";
vars.selected_customer_mobile = row.customer_mobile || vars.selected_customer_mobile || "";
vars.selected_product_code = row.product_code || vars.selected_product_code || "";
vars.selected_claim_type_code = row.claim_type_code || "";
vars.selected_claim_type_name = row.claim_type_name || "";
vars.selected_claim_status = row.canonical_status || "";
vars.selected_claim_status_label = row.last_status_label || row.canonical_status || "";
vars.selected_claim_outstanding_requirements = row.outstanding_requirements || "";
vars.selected_claim_required_document_count = row.required_document_count || 0;
vars.selected_claim_received_document_count = row.received_document_count || 0;
vars.selected_claimed_amount_display = formatMoneyMinor(row.claimed_amount_minor || 0);
return "success";
`;

const verificationSuccessScript = `
const now = "2026-08-25T10:30:00.000Z";
vars.verified_customer_id = vars.selected_customer_id || "";
vars.verification_reference = "VER-" + String(vars.system?.sessionId || "SESSION");
vars.verified_at = now;
vars.verification_method = "accept_any_6_digit_code";
return "success";
`;

const claimTypeOptionsScript = `
${arrayReaderBlock}
const rows = getRows(vars.claim_type_list_result);
if (!rows.length) {
  vars.claim_type_selection_state = "empty";
  vars.claim_type_options_text = "No configured claim types are available for this policy.";
  return "success";
}
vars.claim_type_selection_state = "ready";
vars.claim_type_options_text = rows
  .map((row, index) => {
    return String(index + 1) + ". " + (row.display_name || row.claim_type_code || "");
  })
  .join("\\n");
return "success";
`;

const claimTypeChoiceScript = `
${arrayReaderBlock}
const rows = getRows(vars.claim_type_list_result);
const choice = Number(String(vars.claim_type_choice || "").trim());
if (!Number.isInteger(choice) || choice < 1 || choice > rows.length) {
  vars.claim_type_selection_state = "invalid";
  return "success";
}
const row = rows[choice - 1];
vars.claim_type_selection_state = "selected";
vars.selected_claim_type_id = row.claim_type_id || "";
vars.selected_claim_type_code = row.claim_type_code || "";
vars.selected_claim_type_name = row.display_name || row.claim_type_code || "";
vars.selected_claim_type_hint = row.form_hint || "Capture only the details needed for the selected claim type.";
return "success";
`;

const claimPrepareScript = `
${arrayReaderBlock}
const sessionId = String(vars.system?.sessionId || "SESSION");
const incidentDate = String(vars.incident_date || "2026-08-25");
const amountMinor = Math.round(Number(vars.claimed_amount_inr || 0) * 100);
vars.claim_id = "CLAIM-" + sessionId;
vars.claim_number = "CLM-" + sessionId.toUpperCase();
vars.claim_request_id = "CLMREQ-" + sessionId.toUpperCase();
vars.claim_created_at = "2026-08-25T10:45:00.000Z";
vars.claim_updated_at = vars.claim_created_at;
vars.claimed_amount_minor = amountMinor;
vars.selected_claimed_amount_display = amountMinor ? formatMoneyMinor(amountMinor) : "Awaiting invoice-backed amount";
vars.dedupe_fingerprint = [
  vars.selected_policy_id || vars.selected_claim_policy_id || "",
  vars.selected_claim_type_code || "",
  incidentDate,
  vars.claimant_relationship || ""
].join("|");
vars.claim_last_status_label = "Draft saved";
return "success";
`;

const claimDedupeScript = `
${arrayReaderBlock}
const rows = getRows(vars.claim_existing_list_result);
const targetFingerprint = String(vars.dedupe_fingerprint || "");
const match = rows.find((row) => {
  if (!row || !row.claim_id || row.claim_id === vars.claim_id) return false;
  const status = String(row.canonical_status || "").toLowerCase();
  return String(row.dedupe_fingerprint || "") === targetFingerprint &&
    status !== "cancelled" &&
    status !== "withdrawn";
});
if (match) {
  vars.duplicate_claim_state = "duplicate";
  vars.duplicate_claim_number = match.claim_number || "";
  vars.duplicate_claim_status = match.canonical_status || "";
} else {
  vars.duplicate_claim_state = "clear";
  vars.duplicate_claim_number = "";
  vars.duplicate_claim_status = "";
}
return "success";
`;

const checklistScript = `
${arrayReaderBlock}
const rows = getRows(vars.claim_document_rule_list_result)
  .filter((row) => String(row.status || "active").toLowerCase() === "active")
  .sort((a, b) => Number(a.display_order || 0) - Number(b.display_order || 0));
const requiredRows = rows.filter((row) => String(row.requirement_type || "").toLowerCase() === "required");
vars.required_document_count = requiredRows.length;
vars.required_document_names = requiredRows.map((row) => row.document_name || row.document_type_code || "Required document").join("|");
vars.outstanding_requirement_names = vars.required_document_names;
vars.requirement_checklist_text = rows.length
  ? rows
      .map((row) => {
        const prefix = String(row.requirement_type || "").toLowerCase() === "required" ? "✅ Required" : "• Conditional";
        return prefix + " - " + (row.document_name || row.document_type_code || "Document");
      })
      .join("\\n")
  : "No document rules are configured for this claim type.";
return "success";
`;

function documentValidationScript(filesVar, outputPrefix) {
  return `
${arrayReaderBlock}
const required = splitRequirements(vars.required_document_names);
const previousOutstanding = splitRequirements(vars.outstanding_requirement_names);
const currentOutstanding = previousOutstanding.length ? previousOutstanding : required;
const inputFiles = Array.isArray(vars.${filesVar}) ? vars.${filesVar} : [];
const processor = vars.${outputPrefix}_processor_result || vars.${outputPrefix}_result || {};
const uploadedCount = inputFiles.length || Number(processor.fileCount || 0) || 0;
const receivedBefore = Number(vars.received_document_count || 0);
const receivedNow = Math.min(required.length, receivedBefore + uploadedCount);
const remaining = currentOutstanding.slice(Math.min(uploadedCount, currentOutstanding.length));
vars.received_document_count = receivedNow;
vars.document_completeness_pct = required.length ? Math.round((receivedNow / required.length) * 100) : 100;
vars.outstanding_requirement_names = remaining.join("|");
vars.document_review_needed = processor === "low_confidence" || processor?.status === "low_confidence" ? "yes" : "no";
vars.document_result_route = remaining.length ? "missing" : "complete";
vars.document_summary_text = [
  "Documents received: " + String(receivedNow) + " of " + String(required.length),
  remaining.length ? "Still required: " + remaining.join(", ") : "All required documents are available."
].join("\\n");
vars.claim_requirements_status = remaining.length ? "documents_pending" : "documents_complete";
return "success";
`;
}

const claimSummaryScript = `
${arrayReaderBlock}
vars.claim_summary_text = [
  "Policy: ****" + String(vars.selected_policy_number || vars.selected_claim_policy_number || "").slice(-4),
  "Claim type: " + (vars.selected_claim_type_name || ""),
  "Incident date: " + (vars.incident_date || ""),
  "Claimed amount: " + (vars.selected_claimed_amount_display || "Awaiting invoice-backed amount"),
  "Documents received: " + String(vars.received_document_count || 0),
  "Outstanding requirements: " + (splitRequirements(vars.outstanding_requirement_names).length || 0)
].join("\\n");
return "success";
`;

const claimSyncScript = `
const amountMinor = Number(vars.claimed_amount_minor || 0);
vars.claim_sync_route = amountMinor >= 10000000 ? "sync_pending" : "submitted";
vars.external_claim_number = vars.claim_sync_route === "submitted"
  ? "EXT-" + String(vars.claim_number || "").replace(/^CLM-/, "")
  : "";
vars.external_status = vars.claim_sync_route === "submitted" ? "received" : "pending_submission";
vars.claim_last_status_label = vars.claim_sync_route === "submitted"
  ? "Claim submitted"
  : "Submission pending";
return "success";
`;

const claimStatusTimelineScript = `
${arrayReaderBlock}
const rows = getRows(vars.claim_status_history_list_result);
const lines = rows.length
  ? rows
      .map((row) => {
        return (row.created_at || "") + " - " + (row.to_status || "") + (row.customer_message ? " - " + row.customer_message : "");
      })
      .join("\\n")
  : "No status history is available yet.";
vars.claim_status_timeline_text = [
  "Claim " + (vars.selected_claim_number || ""),
  "",
  lines,
  "",
  splitRequirements(vars.selected_claim_outstanding_requirements).length
    ? "Additional document requested: " + splitRequirements(vars.selected_claim_outstanding_requirements).join(", ")
    : "No outstanding customer document requirements."
].join("\\n");
return "success";
`;

const settlementStatusScript = `
${arrayReaderBlock}
const row = firstRow(vars.claim_settlement_result);
if (!row || !row.settlement_reference) {
  vars.settlement_status_text = "No settlement record is available yet for claim " + (vars.selected_claim_number || "") + ".";
  return "success";
}
vars.settlement_status_text = [
  "Claim: " + (row.claim_number || vars.selected_claim_number || ""),
  "Decision: " + (row.decision_type || ""),
  "Approved amount: " + formatMoneyMinor(row.approved_amount_minor || 0),
  "Payment status: " + (row.payment_status || ""),
  "Payment reference: " + (row.payment_reference || "Available after dispatch")
].join("\\n");
return "success";
`;

const serviceApprovalScript = `
const type = String(vars.service_request_type || "");
vars.service_request_needs_approval =
  type === "bank_details_update" || type === "nominee_update" ? "yes" : "no";
return "success";
`;

const grievanceReferenceScript = `
const sessionId = String(vars.system?.sessionId || "SESSION");
vars.grievance_id = "GRV-" + sessionId.toUpperCase();
vars.grievance_number = "GR-" + sessionId.toUpperCase();
vars.grievance_priority = vars.grievance_reason === "claim_rejected" || vars.grievance_reason === "settlement_dispute"
  ? "high"
  : "normal";
vars.grievance_created_at = "2026-08-25T12:00:00.000Z";
return "success";
`;

node("start_1", "start", 0, 0, { messages: [] });
node(
  "set_template_defaults",
  "setVariable",
  240,
  0,
  setVars({
    preferred_language: "en",
    main_user_request: "",
    policy_question: "",
    policy_question_scope: "",
    policy_lookup_value: "",
    policy_lookup_phone_e164: "",
    policy_search_mode: "",
    policy_selection_state: "",
    policy_options_text: "",
    policy_choice: "",
    selected_policy_id: "",
    selected_policy_number: "",
    selected_product_id: "",
    selected_product_code: "",
    selected_product_name: "",
    selected_customer_id: "",
    selected_customer_name: "",
    selected_customer_mobile: "",
    selected_policy_status: "",
    selected_policy_start_date: "",
    selected_policy_end_date: "",
    selected_policy_sum_insured: "0",
    selected_policy_members_summary: "",
    selected_policy_coverage_summary: "",
    selected_policy_exclusions_summary: "",
    selected_policy_download_url: "",
    selected_policy_card: "",
    verified_journey: "",
    verification_status: "",
    verification_reference: "",
    verified_customer_id: "",
    verified_at: "",
    verification_method: "",
    otp_input: "",
    otp_input_2: "",
    otp_input_3: "",
    claim_lookup_value: "",
    claim_lookup_phone_e164: "",
    claim_search_mode: "",
    claim_selection_state: "",
    claim_options_text: "",
    claim_choice: "",
    selected_claim_id: "",
    selected_claim_number: "",
    selected_claim_request_id: "",
    selected_claim_policy_id: "",
    selected_claim_policy_number: "",
    selected_claim_type_id: "",
    selected_claim_type_code: "",
    selected_claim_type_name: "",
    selected_claim_status: "",
    selected_claim_status_label: "",
    selected_claim_outstanding_requirements: "",
    selected_claim_required_document_count: "0",
    selected_claim_received_document_count: "0",
    selected_claimed_amount_display: "",
    claim_type_selection_state: "",
    claim_type_options_text: "",
    claim_type_choice: "",
    selected_claim_type_hint: "",
    incident_date: "",
    incident_time: "",
    incident_location: "",
    incident_description: "",
    claimant_relationship: "",
    contact_phone: "",
    contact_email: "",
    claimed_amount_inr: "0",
    claimed_amount_minor: "0",
    product_specific_details: "",
    incident_supporting_reference: "",
    claim_id: "",
    claim_number: "",
    claim_request_id: "",
    claim_created_at: "",
    claim_updated_at: "",
    claim_last_status_label: "",
    dedupe_fingerprint: "",
    duplicate_claim_state: "",
    duplicate_claim_number: "",
    duplicate_claim_status: "",
    required_document_count: "0",
    required_document_names: "",
    outstanding_requirement_names: "",
    received_document_count: "0",
    document_completeness_pct: "0",
    document_review_needed: "no",
    requirement_checklist_text: "",
    document_result_route: "",
    document_summary_text: "",
    claim_requirements_status: "",
    claim_summary_text: "",
    claim_sync_route: "",
    external_claim_number: "",
    external_status: "",
    claim_status_timeline_text: "",
    settlement_status_text: "",
    checklist_product_code: "",
    checklist_claim_type_code: "",
    checklist_claim_type_name: "",
    service_request_type: "",
    service_request_summary: "",
    service_request_needs_approval: "no",
    grievance_reason: "",
    grievance_summary: "",
    grievance_id: "",
    grievance_number: "",
    grievance_priority: "",
    grievance_created_at: "",
    upload_more_evidence: "",
    agent_context_reference: "",
    agent_reason: ""
  })
);
node(
  "welcome_message",
  "message",
  480,
  0,
  msgData(
    "👋 Welcome. I can help you understand your policy, start a claim, upload missing documents, track claim updates, check settlement status, and submit service requests."
  )
);
node("language_detection", "language", 720, 0, {
  action: "detect",
  inputText: "{{input}}",
  targetLanguage: "en",
  supportedLanguagesCsv: "en,hi,te,ta,kn,mr,bn",
  lowConfidenceThreshold: 0.7,
  outputVar: "language_result",
  preferredLanguageVar: "preferred_language"
});
node(
  "language_selection_input",
  "input",
  960,
  -120,
  inputData("Choose your preferred language.", "preferred_language", [
    { label: "English", value: "en" },
    { label: "Hindi", value: "hi" },
    { label: "Telugu", value: "te" },
    { label: "Tamil", value: "ta" }
  ], true)
);
node(
  "default_language_message",
  "message",
  960,
  120,
  msgData("I will continue in English. You can still type your request in the language you prefer.")
);
node(
  "main_menu_input",
  "input",
  1200,
  0,
  inputData(
    "Hi 👋 Welcome to Insurance Assistance. How can I help you today?",
    "main_user_request",
    [
      { label: "🛡️ Policy Questions", value: "policy_questions" },
      { label: "📋 My Policy Details", value: "my_policy_details" },
      { label: "🧾 Start a New Claim", value: "start_new_claim" },
      { label: "📤 Upload Missing Documents", value: "upload_missing_documents" },
      { label: "🔎 Track Claim Status", value: "claim_status" },
      { label: "✅ Claim Document Checklist", value: "claim_document_checklist" },
      { label: "💰 Settlement / Payment Status", value: "settlement_status" },
      { label: "✏️ Policy Service Request", value: "policy_service_request" },
      { label: "⚠️ Complaint / Claim Dispute", value: "complaint_dispute" },
      { label: "👨‍💼 Talk to an Agent", value: "talk_to_agent" }
    ]
  )
);
node("main_intent_router", "intent-router", 1440, 0, {
  intents: [
    { key: "policy_questions", label: "Policy Questions" },
    { key: "my_policy_details", label: "My Policy Details" },
    { key: "start_new_claim", label: "Start New Claim" },
    { key: "upload_missing_documents", label: "Upload Missing Documents" },
    { key: "claim_status", label: "Claim Status" },
    { key: "claim_document_checklist", label: "Claim Checklist" },
    { key: "settlement_status", label: "Settlement Status" },
    { key: "policy_service_request", label: "Policy Service Request" },
    { key: "complaint_dispute", label: "Complaint or Dispute" },
    { key: "talk_to_agent", label: "Talk to Agent" }
  ],
  fallbackIntent: "unknown"
});

node("policy_question_input", "input", 1800, -1000, inputData("Ask your policy question.", "policy_question", []));
node(
  "policy_question_scope_input",
  "input",
  2040,
  -1000,
  inputData(
    "Is this a general policy question or a question about your own policy coverage?",
    "policy_question_scope",
    [
      { label: "General Policy Question", value: "general" },
      { label: "My Policy Coverage", value: "policy_specific" }
    ],
    true
  )
);
node("policy_question_scope_switch", "switch", 2280, -1000, switchData("policy_question_scope"));
node("policy_general_ai", "ai-grounded", 2520, -1120, {
  contextTemplate:
    "Approved insurer knowledge scope: policy wording, product brochures, FAQ, exclusions, waiting periods, claims procedures, service rules, and approved insurer documentation. Never invent coverage or approval outcomes.",
  inputTemplate: "{{policy_question}}",
  instructions:
    "Answer only from approved insurer policy knowledge. Explain terms clearly. If the question requires a customer-specific policy lookup or a claim decision, use the fallback response.",
  responseStyle: "concise",
  strictGrounding: true,
  includeCitations: false,
  includeCitationsInResponse: false,
  responseTemplate: "",
  fallbackResponseTemplate: "I need your verified policy details before I can answer that safely.",
  fallbackMessage: "I need your verified policy details before I can answer that safely.",
  outputVar: "policy_general_ai_result",
  answerVar: "policy_general_answer",
  answerKeyValueVar: "policy_general_answer_key",
  emitResponse: false
});
node("policy_general_answer_message", "message", 2760, -1120, msgData("{{policy_general_answer}}"));
node("policy_general_end", "end", 3000, -1120, { messages: [] });

node("policy_specific_lookup_form", "form", 2520, -920, formData("Enter your policy number or registered mobile.", policyLookupFields, "policy_specific_lookup_form_result"));
node("policy_specific_set_journey", "setVariable", 2760, -920, setVars({ verified_journey: "policy_specific_question" }));

node("policy_details_lookup_form", "form", 1800, -560, formData("Enter your policy number or registered mobile.", policyLookupFields, "policy_details_lookup_form_result"));
node("policy_details_set_journey", "setVariable", 2040, -560, setVars({ verified_journey: "policy_details" }));

node("claim_lookup_form", "form", 1800, 320, formData("Please enter your policy number. If you do not know it, enter the registered mobile number instead.", policyLookupFields, "claim_lookup_form_result"));
node("claim_set_journey", "setVariable", 2040, 320, setVars({ verified_journey: "claim_start" }));

node("shared_policy_lookup_mode", "script", 2280, -520, scriptData(policyLookupModeScript, "policy_lookup_mode_result"));
node("shared_policy_lookup_switch", "switch", 2520, -520, switchData("policy_search_mode"));
node(
  "policy_find_by_number",
  "record",
  2760,
  -640,
  recordData({
    action: "find",
    collection: "policies",
    where: { policy_number: "{{policy_lookup_value}}" },
    schema: schemas.policies,
    uniqueKey: "policy_number",
    outputVar: "policy_find_by_number_result"
  })
);
node(
  "policy_find_by_mobile",
  "record",
  2760,
  -400,
  recordData({
    action: "list",
    collection: "policies",
    where: { primary_customer_phone: "{{policy_lookup_phone_e164}}" },
    schema: schemas.policies,
    outputVar: "policy_find_by_mobile_result",
    limit: 10,
    sortBy: "policy_number",
    sortOrder: "asc"
  })
);
node("policy_from_number_script", "script", 3000, -640, scriptData(setPolicyFromRecordScript, "policy_from_number_result"));
node("policy_from_mobile_script", "script", 3000, -400, scriptData(policyOptionsScript, "policy_from_mobile_result"));
node("policy_selection_switch", "switch", 3240, -480, switchData("policy_selection_state"));
node("policy_selection_message", "message", 3480, -520, msgData("I found multiple policies for that mobile number. Reply with the policy number you want to use:\\n\\n{{policy_options_text}}"));
node("policy_selection_input", "input", 3720, -520, inputData("Enter the option number.", "policy_choice", []));
node("policy_choice_script", "script", 3960, -520, scriptData(policyChoiceScript, "policy_choice_result"));
node("policy_choice_switch", "switch", 4200, -520, switchData("policy_selection_state"));
node("policy_lookup_not_found_message", "message", 3480, -280, msgData("I could not locate an eligible policy using those details. Please check the details or contact policy support at {{policy_support_phone}}."));
node("policy_lookup_invalid_message", "message", 4440, -520, msgData("That selection did not match the policy list. Please restart this journey and choose a valid policy number."));
node("policy_lookup_end", "end", 4680, -400, { messages: [] });

node("send_otp_message", "message", 4440, -120, msgData("For security, please enter the 6-digit OTP sent to your registered mobile number."));
node("otp_input_1", "input", 4680, -120, inputData("Enter the 6-digit OTP.", "otp_input", [], false));
node("otp_validate_1", "script", 4920, -120, scriptData(otpValidationScript("otp_input"), "otp_validate_1_result"));
node("otp_switch_1", "switch", 5160, -120, switchData("verification_status"));
node("otp_invalid_message_1", "message", 5400, -220, msgData("That OTP format was invalid. Please enter exactly 6 digits."));
node("otp_input_2", "input", 5640, -220, inputData("Enter the 6-digit OTP again.", "otp_input_2", [], false));
node("otp_validate_2", "script", 5880, -220, scriptData(otpValidationScript("otp_input_2"), "otp_validate_2_result"));
node("otp_switch_2", "switch", 6120, -220, switchData("verification_status"));
node("otp_invalid_message_2", "message", 6360, -320, msgData("That OTP format was still invalid. Please enter exactly 6 digits."));
node("otp_input_3", "input", 6600, -320, inputData("Enter the 6-digit OTP one last time.", "otp_input_3", [], false));
node("otp_validate_3", "script", 6840, -320, scriptData(otpValidationScript("otp_input_3"), "otp_validate_3_result"));
node("otp_switch_3", "switch", 7080, -320, switchData("verification_status"));
node("otp_max_attempts_message", "message", 7320, -420, msgData("I could not verify the OTP format after 3 attempts. Please restart the journey when you are ready."));
node("otp_max_attempts_end", "end", 7560, -420, { messages: [] });
node("verification_success_script", "script", 7320, -120, scriptData(verificationSuccessScript, "verification_success_result"));
node("verified_journey_switch", "switch", 7560, -120, switchData("verified_journey"));

node("policy_card_script", "script", 7800, -560, scriptData(policyCardScript, "policy_card_script_result"));
node("policy_card_message", "message", 8040, -560, msgData("{{selected_policy_card}}"));
node(
  "policy_details_next_input",
  "input",
  8280,
  -560,
  inputData(
    "What would you like next?",
    "policy_details_next_step",
    [
      { label: "Coverage Details", value: "coverage" },
      { label: "Exclusions", value: "exclusions" },
      { label: "Download Policy", value: "download" },
      { label: "Start Claim", value: "start_claim" },
      { label: "Claim Checklist", value: "claim_checklist" }
    ],
    true
  )
);
node("policy_details_next_switch", "switch", 8520, -560, switchData("policy_details_next_step"));
node("policy_coverage_message", "message", 8760, -760, msgData("Coverage details\\n\\n{{selected_policy_coverage_summary}}"));
node("policy_exclusions_message", "message", 8760, -640, msgData("Exclusions\\n\\n{{selected_policy_exclusions_summary}}"));
node("policy_download_message", "message", 8760, -520, msgData("Download your policy document here:\\n{{selected_policy_download_url}}"));
node("policy_detail_end", "end", 9000, -640, { messages: [] });

node("policy_specific_ai", "ai-grounded", 7800, -920, {
  contextTemplate:
    "Use the verified policy snapshot only. Product: {{selected_product_name}}. Policy number: {{selected_policy_number}}. Coverage summary: {{selected_policy_coverage_summary}}. Exclusions summary: {{selected_policy_exclusions_summary}}. Never promise approval, settlement, or a final claims decision.",
  inputTemplate: "{{policy_question}}",
  instructions:
    "Explain the policy-specific context conservatively. You may describe the policy snapshot and the relevant clause area, but do not guarantee claim approval or legal eligibility.",
  responseStyle: "concise",
  strictGrounding: true,
  includeCitations: false,
  includeCitationsInResponse: false,
  responseTemplate: "",
  fallbackResponseTemplate: "I do not have enough verified policy information to answer that safely.",
  fallbackMessage: "I do not have enough verified policy information to answer that safely.",
  outputVar: "policy_specific_ai_result",
  answerVar: "policy_specific_answer",
  answerKeyValueVar: "policy_specific_answer_key",
  emitResponse: false
});
node("policy_specific_answer_message", "message", 8040, -920, msgData("{{policy_specific_answer}}"));
node("policy_specific_end", "end", 8280, -920, { messages: [] });

node(
  "claim_type_list",
  "record",
  7800,
  320,
  recordData({
    action: "list",
    collection: "claim_types",
    where: { product_code: "{{selected_product_code}}" },
    schema: schemas.claimTypes,
    outputVar: "claim_type_list_result",
    limit: 10,
    sortBy: "display_name",
    sortOrder: "asc"
  })
);
node("claim_type_options_script", "script", 8040, 320, scriptData(claimTypeOptionsScript, "claim_type_options_result"));
node("claim_type_options_message", "message", 8280, 320, msgData("Select the claim type for your {{selected_product_name}} policy:\\n\\n{{claim_type_options_text}}"));
node("claim_type_choice_input", "input", 8520, 320, inputData("Enter the option number.", "claim_type_choice", []));
node("claim_type_choice_script", "script", 8760, 320, scriptData(claimTypeChoiceScript, "claim_type_choice_result"));
node("claim_type_choice_switch", "switch", 9000, 320, switchData("claim_type_selection_state"));
node("claim_type_invalid_message", "message", 9240, 180, msgData("That claim type selection was invalid. Please restart and choose one of the listed options."));
node("claim_type_empty_message", "message", 9240, 460, msgData("No configured claim types are available for this policy right now. Please contact claims support at {{claims_support_phone}}."));
node("claim_type_end", "end", 9480, 320, { messages: [] });
node("claim_type_hint_message", "message", 9240, 320, msgData("{{selected_claim_type_hint}}"));
node("incident_core_form", "form", 9480, 320, formData("Share the incident details.", incidentCoreFields, "incident_core_form_result"));
node("claim_specific_form", "form", 9720, 320, formData("Share the product-specific details that support this claim.", claimSpecificFields, "claim_specific_form_result"));
node("claim_prepare_script", "script", 9960, 320, scriptData(claimPrepareScript, "claim_prepare_result"));
node(
  "claim_draft_record",
  "record",
  10200,
  320,
  recordData({
    action: "upsert",
    collection: "claims",
    where: { claim_id: "{{claim_id}}" },
    data: {
      claim_id: "{{claim_id}}",
      claim_number: "{{claim_number}}",
      claim_request_id: "{{claim_request_id}}",
      policy_id: "{{selected_policy_id}}",
      policy_number: "{{selected_policy_number}}",
      customer_id: "{{selected_customer_id}}",
      customer_mobile: "{{selected_customer_mobile}}",
      product_code: "{{selected_product_code}}",
      claim_type_code: "{{selected_claim_type_code}}",
      claim_type_name: "{{selected_claim_type_name}}",
      canonical_status: "draft",
      external_status: "",
      incident_date: "{{incident_date}}",
      incident_time: "{{incident_time}}",
      incident_location: "{{incident_location}}",
      incident_summary: "{{incident_description}}",
      claimed_amount_minor: "{{claimed_amount_minor}}",
      currency: "{{default_currency}}",
      required_document_count: 0,
      received_document_count: 0,
      outstanding_requirements: "",
      requirements_summary: "",
      document_completeness_pct: 0,
      sync_state: "local_only",
      dedupe_fingerprint: "{{dedupe_fingerprint}}",
      external_claim_number: "",
      created_at: "{{claim_created_at}}",
      updated_at: "{{claim_updated_at}}",
      last_status_label: "Draft saved"
    },
    schema: schemas.claims,
    uniqueKey: "claim_id",
    idempotencyKey: "{{claim_id}}:draft",
    outputVar: "claim_draft_record_result"
  })
);
node(
  "claim_draft_status_record",
  "record",
  10440,
  320,
  recordData({
    action: "upsert",
    collection: "claim_status_history",
    where: { status_event_id: "{{claim_id}}:draft" },
    data: {
      status_event_id: "{{claim_id}}:draft",
      claim_id: "{{claim_id}}",
      claim_number: "{{claim_number}}",
      from_status: "",
      to_status: "draft",
      external_status: "",
      customer_message: "Claim draft created",
      source: "assistant",
      created_at: "{{claim_created_at}}"
    },
    schema: schemas.claimStatusHistory,
    uniqueKey: "status_event_id",
    idempotencyKey: "{{claim_id}}:draft-status",
    outputVar: "claim_draft_status_record_result"
  })
);
node(
  "claim_existing_list",
  "record",
  10680,
  320,
  recordData({
    action: "list",
    collection: "claims",
    where: { policy_id: "{{selected_policy_id}}" },
    schema: schemas.claims,
    outputVar: "claim_existing_list_result",
    limit: 20,
    sortBy: "created_at",
    sortOrder: "desc"
  })
);
node("claim_dedupe_script", "script", 10920, 320, scriptData(claimDedupeScript, "claim_dedupe_result"));
node("claim_dedupe_switch", "switch", 11160, 320, switchData("duplicate_claim_state"));
node("duplicate_claim_message", "message", 11400, 200, msgData("There is already a claim that appears to match this incident.\\n\\nClaim {{duplicate_claim_number}}\\nStatus: {{duplicate_claim_status}}"));
node(
  "duplicate_claim_decision",
  "input",
  11640,
  200,
  inputData(
    "Choose how to continue.",
    "duplicate_claim_resolution",
    [
      { label: "View Existing Claim", value: "view_existing" },
      { label: "This Is Different", value: "different_incident" }
    ],
    true
  )
);
node("duplicate_claim_resolution_switch", "switch", 11880, 200, switchData("duplicate_claim_resolution"));
node("duplicate_claim_existing_message", "message", 12120, 80, msgData("Use claim {{duplicate_claim_number}} in the claim status journey to track that incident."));
node("duplicate_claim_end", "end", 12360, 80, { messages: [] });

node(
  "claim_document_rule_list",
  "record",
  11400,
  440,
  recordData({
    action: "list",
    collection: "claim_document_rules",
    where: { claim_type_code: "{{selected_claim_type_code}}" },
    schema: schemas.claimDocumentRules,
    outputVar: "claim_document_rule_list_result",
    limit: 20,
    sortBy: "display_order",
    sortOrder: "asc"
  })
);
node("claim_checklist_script", "script", 11640, 440, scriptData(checklistScript, "claim_checklist_result"));
node("claim_checklist_message", "message", 11880, 440, msgData("Documents Required\\n\\n{{requirement_checklist_text}}"));
node("claim_document_intake", "document-intake", 12120, 440, {
  messages: ["Upload the available documents as PDF or images. I will check them before submission."],
  acceptedTypesCsv: "pdf,jpg,jpeg,png",
  maxFiles: 8,
  minFiles: 1,
  outputVar: "claim_document_files"
});
node("claim_document_processor", "file-processor", 12360, 440, {
  inputFiles: "{{claim_document_files}}",
  processingMode: "extract_fields",
  acceptedTypesText: "pdf,jpg,jpeg,png",
  maxFileSizeMb: 15,
  expectedDocumentType: "insurance_claim_document",
  confidenceThreshold: 0.75,
  strictExtraction: false,
  pageMode: "process_all_pages",
  schemaJson: pretty({
    fields: {
      document_type: "string",
      customer_name: "string",
      provider_name: "string",
      amount: "number"
    }
  }),
  outputVar: "claim_document_processor_result"
});
node("claim_document_validation_script", "script", 12600, 440, scriptData(documentValidationScript("claim_document_files", "claim_document"), "claim_document_validation_result"));
node(
  "claim_document_record",
  "record",
  12840,
  440,
  recordData({
    action: "upsert",
    collection: "claim_documents",
    where: { claim_document_id: "{{claim_id}}:batch1" },
    data: {
      claim_document_id: "{{claim_id}}:batch1",
      claim_id: "{{claim_id}}",
      claim_number: "{{claim_number}}",
      document_batch_ref: "batch1",
      uploaded_document_count: "{{received_document_count}}",
      processing_status: "processed",
      verification_status: "{{claim_requirements_status}}",
      notes: "{{document_summary_text}}"
    },
    schema: schemas.claimDocuments,
    uniqueKey: "claim_document_id",
    idempotencyKey: "{{claim_id}}:batch1",
    outputVar: "claim_document_record_result"
  })
);
node(
  "claim_requirements_record",
  "record",
  13080,
  440,
  recordData({
    action: "upsert",
    collection: "claim_requirements",
    where: { requirement_set_id: "{{claim_id}}" },
    data: {
      requirement_set_id: "{{claim_id}}",
      claim_id: "{{claim_id}}",
      claim_number: "{{claim_number}}",
      requirement_status: "{{claim_requirements_status}}",
      outstanding_requirements: "{{outstanding_requirement_names}}",
      received_requirements: "{{required_document_names}}",
      required_document_count: "{{required_document_count}}",
      received_document_count: "{{received_document_count}}"
    },
    schema: schemas.claimRequirements,
    uniqueKey: "requirement_set_id",
    idempotencyKey: "{{claim_id}}:requirements",
    outputVar: "claim_requirements_record_result"
  })
);
node(
  "claim_update_after_docs",
  "record",
  13320,
  440,
  recordData({
    action: "upsert",
    collection: "claims",
    where: { claim_id: "{{claim_id}}" },
    data: {
      claim_id: "{{claim_id}}",
      claim_number: "{{claim_number}}",
      claim_request_id: "{{claim_request_id}}",
      policy_id: "{{selected_policy_id}}",
      policy_number: "{{selected_policy_number}}",
      customer_id: "{{selected_customer_id}}",
      customer_mobile: "{{selected_customer_mobile}}",
      product_code: "{{selected_product_code}}",
      claim_type_code: "{{selected_claim_type_code}}",
      claim_type_name: "{{selected_claim_type_name}}",
      canonical_status: "{{claim_requirements_status}}",
      external_status: "",
      incident_date: "{{incident_date}}",
      incident_time: "{{incident_time}}",
      incident_location: "{{incident_location}}",
      incident_summary: "{{incident_description}}",
      claimed_amount_minor: "{{claimed_amount_minor}}",
      currency: "{{default_currency}}",
      required_document_count: "{{required_document_count}}",
      received_document_count: "{{received_document_count}}",
      outstanding_requirements: "{{outstanding_requirement_names}}",
      requirements_summary: "{{requirement_checklist_text}}",
      document_completeness_pct: "{{document_completeness_pct}}",
      sync_state: "local_only",
      dedupe_fingerprint: "{{dedupe_fingerprint}}",
      external_claim_number: "",
      created_at: "{{claim_created_at}}",
      updated_at: "{{claim_created_at}}",
      last_status_label: "{{document_summary_text}}"
    },
    schema: schemas.claims,
    uniqueKey: "claim_id",
    idempotencyKey: "{{claim_id}}:docs",
    outputVar: "claim_update_after_docs_result"
  })
);
node("claim_document_route_switch", "switch", 13560, 440, switchData("document_result_route"));
node("claim_missing_docs_message", "message", 13800, 320, msgData("I received {{received_document_count}} of {{required_document_count}} required documents.\\n\\nStill required: {{outstanding_requirement_names}}"));
node("claim_missing_docs_intake", "document-intake", 14040, 320, {
  messages: ["Upload the remaining required documents now, or submit later and I will save your progress."],
  acceptedTypesCsv: "pdf,jpg,jpeg,png",
  maxFiles: 6,
  minFiles: 1,
  outputVar: "claim_document_files_retry"
});
node("claim_missing_docs_processor", "file-processor", 14280, 320, {
  inputFiles: "{{claim_document_files_retry}}",
  processingMode: "extract_fields",
  acceptedTypesText: "pdf,jpg,jpeg,png",
  maxFileSizeMb: 15,
  expectedDocumentType: "insurance_claim_document",
  confidenceThreshold: 0.75,
  strictExtraction: false,
  pageMode: "process_all_pages",
  schemaJson: pretty({
    fields: {
      document_type: "string",
      customer_name: "string",
      provider_name: "string",
      amount: "number"
    }
  }),
  outputVar: "claim_document_retry_processor_result"
});
node("claim_missing_docs_validation_script", "script", 14520, 320, scriptData(documentValidationScript("claim_document_files_retry", "claim_document_retry"), "claim_missing_docs_validation_result"));
node("claim_retry_route_switch", "switch", 14760, 320, switchData("document_result_route"));
node(
  "claim_pending_record",
  "record",
  15000,
  220,
  recordData({
    action: "upsert",
    collection: "claims",
    where: { claim_id: "{{claim_id}}" },
    data: {
      claim_id: "{{claim_id}}",
      claim_number: "{{claim_number}}",
      claim_request_id: "{{claim_request_id}}",
      policy_id: "{{selected_policy_id}}",
      policy_number: "{{selected_policy_number}}",
      customer_id: "{{selected_customer_id}}",
      customer_mobile: "{{selected_customer_mobile}}",
      product_code: "{{selected_product_code}}",
      claim_type_code: "{{selected_claim_type_code}}",
      claim_type_name: "{{selected_claim_type_name}}",
      canonical_status: "documents_pending",
      external_status: "",
      incident_date: "{{incident_date}}",
      incident_time: "{{incident_time}}",
      incident_location: "{{incident_location}}",
      incident_summary: "{{incident_description}}",
      claimed_amount_minor: "{{claimed_amount_minor}}",
      currency: "{{default_currency}}",
      required_document_count: "{{required_document_count}}",
      received_document_count: "{{received_document_count}}",
      outstanding_requirements: "{{outstanding_requirement_names}}",
      requirements_summary: "{{requirement_checklist_text}}",
      document_completeness_pct: "{{document_completeness_pct}}",
      sync_state: "local_only",
      dedupe_fingerprint: "{{dedupe_fingerprint}}",
      external_claim_number: "",
      created_at: "{{claim_created_at}}",
      updated_at: "{{claim_created_at}}",
      last_status_label: "Documents pending"
    },
    schema: schemas.claims,
    uniqueKey: "claim_id",
    idempotencyKey: "{{claim_id}}:pending",
    outputVar: "claim_pending_record_result"
  })
);
node("claim_pending_scheduler", "scheduler", 15240, 220, schedulerData({
  runAt: "2026-08-26T10:00:00.000Z",
  offsetValue: 0,
  offsetUnit: "hours",
  offsetDirection: "after",
  payload: {
    type: "claim_missing_document_reminder",
    claim_id: "{{claim_id}}",
    claim_number: "{{claim_number}}"
  },
  outputVar: "claim_pending_scheduler_result",
  dedupeKey: "{{claim_id}}:missing-document-reminder"
}));
node("claim_pending_message", "message", 15480, 220, msgData("Your claim information has been saved under {{claim_number}}. Submission is waiting for the remaining documents: {{outstanding_requirement_names}}."));
node("claim_pending_end", "end", 15720, 220, { messages: [] });
node("document_review_switch", "switch", 13800, 560, switchData("document_review_needed"));
node("document_review_queue", "queue", 14040, 560, queueData("claims_document_review", "normal", "claims,documents", 30, "document_review_queue_result"));

node("claim_summary_script", "script", 14280, 560, scriptData(claimSummaryScript, "claim_summary_script_result"));
node("claim_summary_message", "message", 14520, 560, msgData("Claim Summary\\n\\n{{claim_summary_text}}"));
node(
  "claim_submit_input",
  "input",
  14760,
  560,
  inputData(
    "Please confirm that you want to submit this claim.",
    "claim_submit_decision",
    [
      { label: "Submit Claim", value: "submit" },
      { label: "Cancel", value: "cancel" }
    ],
    true
  )
);
node("claim_submit_switch", "switch", 15000, 560, switchData("claim_submit_decision"));
node("claim_cancelled_message", "message", 15240, 480, msgData("Your draft claim has been saved as {{claim_number}}. You can return later to continue from the saved progress."));
node("claim_cancelled_end", "end", 15480, 480, { messages: [] });
node("claim_sync_script", "script", 15240, 620, scriptData(claimSyncScript, "claim_sync_script_result"));
node("claim_sync_switch", "switch", 15480, 620, switchData("claim_sync_route"));
node(
  "claim_submitted_record",
  "record",
  15720,
  560,
  recordData({
    action: "upsert",
    collection: "claims",
    where: { claim_id: "{{claim_id}}" },
    data: {
      claim_id: "{{claim_id}}",
      claim_number: "{{claim_number}}",
      claim_request_id: "{{claim_request_id}}",
      policy_id: "{{selected_policy_id}}",
      policy_number: "{{selected_policy_number}}",
      customer_id: "{{selected_customer_id}}",
      customer_mobile: "{{selected_customer_mobile}}",
      product_code: "{{selected_product_code}}",
      claim_type_code: "{{selected_claim_type_code}}",
      claim_type_name: "{{selected_claim_type_name}}",
      canonical_status: "submitted",
      external_status: "{{external_status}}",
      incident_date: "{{incident_date}}",
      incident_time: "{{incident_time}}",
      incident_location: "{{incident_location}}",
      incident_summary: "{{incident_description}}",
      claimed_amount_minor: "{{claimed_amount_minor}}",
      currency: "{{default_currency}}",
      required_document_count: "{{required_document_count}}",
      received_document_count: "{{received_document_count}}",
      outstanding_requirements: "{{outstanding_requirement_names}}",
      requirements_summary: "{{requirement_checklist_text}}",
      document_completeness_pct: "{{document_completeness_pct}}",
      sync_state: "synced",
      dedupe_fingerprint: "{{dedupe_fingerprint}}",
      external_claim_number: "{{external_claim_number}}",
      created_at: "{{claim_created_at}}",
      updated_at: "{{claim_created_at}}",
      last_status_label: "Claim submitted"
    },
    schema: schemas.claims,
    uniqueKey: "claim_id",
    idempotencyKey: "{{claim_id}}:submitted",
    outputVar: "claim_submitted_record_result"
  })
);
node(
  "claim_submitted_status_record",
  "record",
  15960,
  560,
  recordData({
    action: "upsert",
    collection: "claim_status_history",
    where: { status_event_id: "{{claim_id}}:submitted" },
    data: {
      status_event_id: "{{claim_id}}:submitted",
      claim_id: "{{claim_id}}",
      claim_number: "{{claim_number}}",
      from_status: "documents_complete",
      to_status: "submitted",
      external_status: "{{external_status}}",
      customer_message: "Claim submitted successfully",
      source: "assistant",
      created_at: "{{claim_created_at}}"
    },
    schema: schemas.claimStatusHistory,
    uniqueKey: "status_event_id",
    idempotencyKey: "{{claim_id}}:submitted-status",
    outputVar: "claim_submitted_status_record_result"
  })
);
node("claim_submit_notification", "notification", 16200, 560, notificationData({
  recipients: [
    {
      type: "customer",
      phone: "{{selected_customer_mobile}}",
      email: "{{contact_email}}"
    }
  ],
  channels: [
    {
      type: "whatsapp",
      enabled: true,
      templateId: "claim_submitted"
    },
    {
      type: "sms",
      enabled: true,
      message: "Claim {{claim_number}} has been submitted successfully. Status: Submitted."
    },
    {
      type: "email",
      enabled: true,
      subject: "Your claim was submitted",
      body: "Claim {{claim_number}} has been submitted successfully. Status: Submitted."
    }
  ],
  outputVar: "claim_submit_notification_result",
  dedupeKey: "{{claim_id}}:claim-submit-notify"
}));
node("claim_submit_success_message", "message", 16440, 560, msgData("✅ Claim successfully registered\\n\\nClaim Reference: {{claim_number}}\\nPolicy: ****{{selected_policy_number}}\\nStatus: Submitted\\nDocuments received: {{received_document_count}}"));
node("claim_submit_end", "end", 16680, 560, { messages: [] });

node(
  "claim_sync_pending_record",
  "record",
  15720,
  740,
  recordData({
    action: "upsert",
    collection: "claims",
    where: { claim_id: "{{claim_id}}" },
    data: {
      claim_id: "{{claim_id}}",
      claim_number: "{{claim_number}}",
      claim_request_id: "{{claim_request_id}}",
      policy_id: "{{selected_policy_id}}",
      policy_number: "{{selected_policy_number}}",
      customer_id: "{{selected_customer_id}}",
      customer_mobile: "{{selected_customer_mobile}}",
      product_code: "{{selected_product_code}}",
      claim_type_code: "{{selected_claim_type_code}}",
      claim_type_name: "{{selected_claim_type_name}}",
      canonical_status: "sync_pending",
      external_status: "pending_submission",
      incident_date: "{{incident_date}}",
      incident_time: "{{incident_time}}",
      incident_location: "{{incident_location}}",
      incident_summary: "{{incident_description}}",
      claimed_amount_minor: "{{claimed_amount_minor}}",
      currency: "{{default_currency}}",
      required_document_count: "{{required_document_count}}",
      received_document_count: "{{received_document_count}}",
      outstanding_requirements: "{{outstanding_requirement_names}}",
      requirements_summary: "{{requirement_checklist_text}}",
      document_completeness_pct: "{{document_completeness_pct}}",
      sync_state: "retry_pending",
      dedupe_fingerprint: "{{dedupe_fingerprint}}",
      external_claim_number: "",
      created_at: "{{claim_created_at}}",
      updated_at: "{{claim_created_at}}",
      last_status_label: "Submission pending"
    },
    schema: schemas.claims,
    uniqueKey: "claim_id",
    idempotencyKey: "{{claim_id}}:sync-pending",
    outputVar: "claim_sync_pending_record_result"
  })
);
node(
  "claim_outbox_record",
  "record",
  15960,
  740,
  recordData({
    action: "upsert",
    collection: "integration_outbox",
    where: { outbox_event_id: "{{claim_id}}:submit" },
    data: {
      outbox_event_id: "{{claim_id}}:submit",
      aggregate_type: "claim",
      aggregate_id: "{{claim_id}}",
      event_type: "claim.submit.retry",
      payload_summary: "{{claim_number}} waiting for insurer core sync",
      status: "pending",
      attempt_count: 0,
      next_attempt_at: "2026-08-25T11:00:00.000Z"
    },
    schema: schemas.integrationOutbox,
    uniqueKey: "outbox_event_id",
    idempotencyKey: "{{claim_id}}:outbox",
    outputVar: "claim_outbox_record_result"
  })
);
node("claim_sync_pending_notification", "notification", 16200, 740, notificationData({
  recipients: [
    {
      type: "customer",
      phone: "{{selected_customer_mobile}}",
      email: "{{contact_email}}"
    }
  ],
  channels: [
    {
      type: "whatsapp",
      enabled: true,
      templateId: "claim_sync_pending"
    },
    {
      type: "sms",
      enabled: true,
      message: "Your claim {{claim_number}} was saved safely. Submission to the claims system is pending and will retry automatically."
    },
    {
      type: "email",
      enabled: true,
      subject: "Your claim was saved safely",
      body: "Your claim {{claim_number}} was saved safely. Submission to the claims system is pending and will retry automatically."
    }
  ],
  outputVar: "claim_sync_pending_notification_result",
  dedupeKey: "{{claim_id}}:claim-sync-pending-notify"
}));
node("claim_sync_pending_message", "message", 16440, 740, msgData("Your claim information has been safely recorded under {{claim_number}}. Submission to the claims system is temporarily pending. You do not need to enter the information again."));
node("claim_sync_pending_end", "end", 16680, 740, { messages: [] });

node("claim_status_lookup_form", "form", 1800, 1040, formData("Enter your claim number or registered mobile.", claimLookupFields, "claim_status_lookup_form_result"));
node("claim_status_set_journey", "setVariable", 2040, 1040, setVars({ verified_journey: "claim_status" }));
node("settlement_lookup_form", "form", 1800, 1360, formData("Enter your claim number or registered mobile.", claimLookupFields, "settlement_lookup_form_result"));
node("settlement_set_journey", "setVariable", 2040, 1360, setVars({ verified_journey: "settlement_status" }));
node("upload_docs_lookup_form", "form", 1800, 720, formData("Enter your claim number or registered mobile.", claimLookupFields, "upload_docs_lookup_form_result"));
node("upload_docs_set_journey", "setVariable", 2040, 720, setVars({ verified_journey: "upload_missing_documents" }));
node("dispute_lookup_form", "form", 1800, 2000, formData("Enter your claim number or registered mobile.", claimLookupFields, "dispute_lookup_form_result"));
node("dispute_set_journey", "setVariable", 2040, 2000, setVars({ verified_journey: "complaint_dispute" }));
node("shared_claim_lookup_mode", "script", 2280, 1120, scriptData(claimLookupModeScript, "claim_lookup_mode_result"));
node("shared_claim_lookup_switch", "switch", 2520, 1120, switchData("claim_search_mode"));
node(
  "claim_find_by_number",
  "record",
  2760,
  1000,
  recordData({
    action: "find",
    collection: "claims",
    where: { claim_number: "{{claim_lookup_value}}" },
    schema: schemas.claims,
    uniqueKey: "claim_number",
    outputVar: "claim_find_by_number_result"
  })
);
node(
  "claim_find_by_mobile",
  "record",
  2760,
  1240,
  recordData({
    action: "list",
    collection: "claims",
    where: { customer_mobile: "{{claim_lookup_phone_e164}}" },
    schema: schemas.claims,
    outputVar: "claim_find_by_mobile_result",
    limit: 10,
    sortBy: "created_at",
    sortOrder: "desc"
  })
);
node("claim_from_number_script", "script", 3000, 1000, scriptData(setClaimFromRecordScript, "claim_from_number_result"));
node("claim_from_mobile_script", "script", 3000, 1240, scriptData(claimOptionsScript, "claim_from_mobile_result"));
node("claim_selection_switch", "switch", 3240, 1120, switchData("claim_selection_state"));
node("claim_selection_message", "message", 3480, 1120, msgData("I found multiple claims for that mobile number. Reply with the option number:\\n\\n{{claim_options_text}}"));
node("claim_selection_input", "input", 3720, 1120, inputData("Enter the option number.", "claim_choice", []));
node("claim_choice_script", "script", 3960, 1120, scriptData(claimChoiceScript, "claim_choice_result"));
node("claim_choice_switch", "switch", 4200, 1120, switchData("claim_selection_state"));
node("claim_lookup_not_found_message", "message", 3480, 1360, msgData("I could not find a claim using those details. Please check the claim number or use the registered mobile number."));
node("claim_lookup_invalid_message", "message", 4440, 1120, msgData("That selection did not match the available claims. Please restart and choose a valid option."));
node("claim_lookup_end", "end", 4680, 1120, { messages: [] });

node("claim_status_history_list", "record", 7800, 1040, recordData({
  action: "list",
  collection: "claim_status_history",
  where: { claim_id: "{{selected_claim_id}}" },
  schema: schemas.claimStatusHistory,
  outputVar: "claim_status_history_list_result",
  limit: 20,
  sortBy: "created_at",
  sortOrder: "asc"
}));
node("claim_status_timeline_script", "script", 8040, 1040, scriptData(claimStatusTimelineScript, "claim_status_timeline_script_result"));
node("claim_status_message", "message", 8280, 1040, msgData("{{claim_status_timeline_text}}"));
node("claim_status_end", "end", 8520, 1040, { messages: [] });

node("claim_settlement_record", "record", 7800, 1360, recordData({
  action: "find",
  collection: "claim_settlements",
  where: { claim_id: "{{selected_claim_id}}" },
  schema: schemas.claimSettlements,
  uniqueKey: "claim_id",
  outputVar: "claim_settlement_result"
}));
node("claim_settlement_script", "script", 8040, 1360, scriptData(settlementStatusScript, "claim_settlement_script_result"));
node("claim_settlement_message", "message", 8280, 1360, msgData("💰 Settlement Status\\n\\n{{settlement_status_text}}"));
node("claim_settlement_end", "end", 8520, 1360, { messages: [] });

node("upload_docs_message", "message", 7800, 720, msgData("Outstanding requirements for {{selected_claim_number}}:\\n\\n{{selected_claim_outstanding_requirements}}"));
node("upload_docs_intake", "document-intake", 8040, 720, {
  messages: ["Upload the missing claim documents as PDF or images."],
  acceptedTypesCsv: "pdf,jpg,jpeg,png",
  maxFiles: 6,
  minFiles: 1,
  outputVar: "upload_docs_files"
});
node("upload_docs_processor", "file-processor", 8280, 720, {
  inputFiles: "{{upload_docs_files}}",
  processingMode: "extract_fields",
  acceptedTypesText: "pdf,jpg,jpeg,png",
  maxFileSizeMb: 15,
  expectedDocumentType: "insurance_claim_document",
  confidenceThreshold: 0.75,
  strictExtraction: false,
  pageMode: "process_all_pages",
  schemaJson: pretty({
    fields: {
      document_type: "string",
      customer_name: "string",
      provider_name: "string",
      amount: "number"
    }
  }),
  outputVar: "upload_docs_processor_result"
});
node("upload_docs_validation_script", "script", 8520, 720, scriptData(`
${arrayReaderBlock}
const requiredCount = Number(vars.selected_claim_required_document_count || 0);
const receivedCount = Number(vars.selected_claim_received_document_count || 0);
const files = Array.isArray(vars.upload_docs_files) ? vars.upload_docs_files : [];
const nextReceived = Math.min(requiredCount, receivedCount + files.length);
const outstanding = splitRequirements(vars.selected_claim_outstanding_requirements);
const remaining = outstanding.slice(Math.min(files.length, outstanding.length));
vars.received_document_count = nextReceived;
vars.outstanding_requirement_names = remaining.join("|");
vars.document_completeness_pct = requiredCount ? Math.round((nextReceived / requiredCount) * 100) : 100;
vars.claim_requirements_status = remaining.length ? "documents_pending" : "documents_complete";
return "success";
`, "upload_docs_validation_result"));
node("upload_docs_route_switch", "switch", 8760, 720, switchData("claim_requirements_status"));
node("upload_docs_claim_update", "record", 9000, 660, recordData({
  action: "upsert",
  collection: "claims",
  where: { claim_id: "{{selected_claim_id}}" },
  data: {
    claim_id: "{{selected_claim_id}}",
    claim_number: "{{selected_claim_number}}",
    claim_request_id: "{{selected_claim_request_id}}",
    policy_id: "{{selected_claim_policy_id}}",
    policy_number: "{{selected_claim_policy_number}}",
    customer_id: "{{selected_customer_id}}",
    customer_mobile: "{{selected_customer_mobile}}",
    product_code: "{{selected_product_code}}",
    claim_type_code: "{{selected_claim_type_code}}",
    claim_type_name: "{{selected_claim_type_name}}",
    canonical_status: "{{claim_requirements_status}}",
    external_status: "",
    incident_date: "{{incident_date}}",
    claimed_amount_minor: "{{claimed_amount_minor}}",
    currency: "{{default_currency}}",
    required_document_count: "{{selected_claim_required_document_count}}",
    received_document_count: "{{received_document_count}}",
    outstanding_requirements: "{{outstanding_requirement_names}}",
    requirements_summary: "",
    document_completeness_pct: "{{document_completeness_pct}}",
    sync_state: "local_only",
    dedupe_fingerprint: "{{dedupe_fingerprint}}",
    external_claim_number: "",
    created_at: "{{claim_created_at}}",
    updated_at: "2026-08-25T12:20:00.000Z",
    last_status_label: "{{claim_requirements_status}}"
  },
  schema: schemas.claims,
  uniqueKey: "claim_id",
  idempotencyKey: "{{selected_claim_id}}:upload-docs",
  outputVar: "upload_docs_claim_update_result"
}));
node("upload_docs_post_update_switch", "switch", 9240, 660, switchData("claim_requirements_status"));
node("upload_docs_complete_message", "message", 9240, 660, msgData("All requested documents for {{selected_claim_number}} are now available. The claim can continue in the review workflow."));
node("upload_docs_pending_message", "message", 9240, 820, msgData("I added the uploaded files to {{selected_claim_number}}, but these documents are still pending: {{outstanding_requirement_names}}."));
node("upload_docs_end", "end", 9480, 740, { messages: [] });

node("checklist_product_input", "input", 1800, 1680, inputData("Which product do you need the checklist for?", "checklist_product_code", [
  { label: "Health", value: "health" },
  { label: "Motor", value: "motor" },
  { label: "Travel", value: "travel" },
  { label: "Life", value: "life" }
], true));
node("checklist_type_list", "record", 2040, 1680, recordData({
  action: "list",
  collection: "claim_types",
  where: { product_code: "{{checklist_product_code}}" },
  schema: schemas.claimTypes,
  outputVar: "checklist_type_list_result",
  limit: 10,
  sortBy: "display_name",
  sortOrder: "asc"
}));
node("checklist_type_options_script", "script", 2280, 1680, scriptData(`
${arrayReaderBlock}
const rows = getRows(vars.checklist_type_list_result);
vars.claim_type_options_text = rows.map((row, index) => String(index + 1) + ". " + (row.display_name || row.claim_type_code || "")).join("\\n");
return "success";
`, "checklist_type_options_result"));
node("checklist_type_message", "message", 2520, 1680, msgData("Select the claim type:\\n\\n{{claim_type_options_text}}"));
node("checklist_type_input", "input", 2760, 1680, inputData("Enter the option number.", "claim_type_choice", []));
node("checklist_type_choice_script", "script", 3000, 1680, scriptData(`
${arrayReaderBlock}
const rows = getRows(vars.checklist_type_list_result);
const choice = Number(String(vars.claim_type_choice || "").trim());
if (!Number.isInteger(choice) || choice < 1 || choice > rows.length) {
  vars.claim_type_selection_state = "invalid";
  return "success";
}
const row = rows[choice - 1];
vars.claim_type_selection_state = "selected";
vars.checklist_claim_type_code = row.claim_type_code || "";
vars.checklist_claim_type_name = row.display_name || row.claim_type_code || "";
return "success";
`, "checklist_type_choice_result"));
node("checklist_type_choice_switch", "switch", 3240, 1680, switchData("claim_type_selection_state"));
node("checklist_invalid_message", "message", 3480, 1600, msgData("That checklist selection was invalid. Please restart and choose one of the listed options."));
node("checklist_rule_list", "record", 3480, 1760, recordData({
  action: "list",
  collection: "claim_document_rules",
  where: { claim_type_code: "{{checklist_claim_type_code}}" },
  schema: schemas.claimDocumentRules,
  outputVar: "checklist_rule_list_result",
  limit: 20,
  sortBy: "display_order",
  sortOrder: "asc"
}));
node("checklist_rule_script", "script", 3720, 1760, scriptData(`
${arrayReaderBlock}
const rows = getRows(vars.checklist_rule_list_result)
  .filter((row) => String(row.status || "active").toLowerCase() === "active")
  .sort((a, b) => Number(a.display_order || 0) - Number(b.display_order || 0));
vars.requirement_checklist_text = rows.length
  ? rows.map((row) => (String(row.requirement_type || "").toLowerCase() === "required" ? "✅ Required - " : "• Conditional - ") + (row.document_name || row.document_type_code || "")).join("\\n")
  : "No maintained checklist is available for this claim type.";
return "success";
`, "checklist_rule_script_result"));
node("checklist_message", "message", 3960, 1760, msgData("Claim Document Checklist\\n\\n{{requirement_checklist_text}}"));
node("checklist_end", "end", 4200, 1760, { messages: [] });

node("service_request_lookup_form", "form", 1800, 2320, formData("Enter your policy number or registered mobile.", policyLookupFields, "service_request_lookup_form_result"));
node("service_request_set_journey", "setVariable", 2040, 2320, setVars({ verified_journey: "policy_service_request" }));
node("service_request_type_input", "input", 7800, 2320, inputData("What kind of policy service request do you need?", "service_request_type", [
  { label: "Update Contact", value: "contact_update" },
  { label: "Address Change", value: "address_change" },
  { label: "Nominee Update", value: "nominee_update" },
  { label: "Bank Details Update", value: "bank_details_update" },
  { label: "Policy Copy", value: "policy_copy" },
  { label: "Renewal Assistance", value: "renewal_assistance" }
], true));
node("service_request_form", "form", 8040, 2320, formData("Share the request details.", serviceRequestFields, "service_request_form_result"));
node("service_request_approval_script", "script", 8280, 2320, scriptData(serviceApprovalScript, "service_request_approval_script_result"));
node("service_request_approval_switch", "switch", 8520, 2320, switchData("service_request_needs_approval"));
node("service_request_record", "record", 8760, 2320, recordData({
  action: "upsert",
  collection: "service_requests",
  where: { service_request_id: "SR-{{system.sessionId}}" },
  data: {
    service_request_id: "SR-{{system.sessionId}}",
    request_number: "SR-{{system.sessionId}}",
    policy_id: "{{selected_policy_id}}",
    policy_number: "{{selected_policy_number}}",
    customer_id: "{{selected_customer_id}}",
    request_type: "{{service_request_type}}",
    status: "submitted",
    request_summary: "{{service_request_summary}}",
    created_at: "2026-08-25T12:40:00.000Z"
  },
  schema: schemas.serviceRequests,
  uniqueKey: "service_request_id",
  idempotencyKey: "SR-{{system.sessionId}}",
  outputVar: "service_request_record_result"
}));
node("service_request_post_record_switch", "switch", 9000, 2320, switchData("service_request_needs_approval"));
node("service_request_approval", "approval", 9000, 2240, approvalData({
  title: "Review insurance policy service request",
  message: "Review the service request details before the insurer-side update continues.",
  approvers: [{ type: "role", id: "policy_service_manager" }],
  outputVar: "service_request_approval_result",
  waitingMessage: "Your service request has been submitted for review."
}));
node("service_request_notification", "notification", 9240, 2320, notificationData({
  recipients: [
    {
      type: "customer",
      phone: "{{selected_customer_mobile}}",
      email: "{{service_support_email}}"
    }
  ],
  channels: [
    {
      type: "whatsapp",
      enabled: true,
      templateId: "policy_service_request"
    },
    {
      type: "sms",
      enabled: true,
      message: "Policy service request {{service_request_type}} submitted. Reference: SR-{{system.sessionId}}."
    }
  ],
  outputVar: "service_request_notification_result",
  dedupeKey: "SR-{{system.sessionId}}:notify"
}));
node("service_request_message", "message", 9480, 2320, msgData("Your policy service request has been saved. Reference: SR-{{system.sessionId}}."));
node("service_request_end", "end", 9720, 2320, { messages: [] });

node("grievance_form", "form", 7800, 2000, formData("Tell me about the complaint or dispute.", grievanceFields, "grievance_form_result"));
node("grievance_reference_script", "script", 8040, 2000, scriptData(grievanceReferenceScript, "grievance_reference_result"));
node("grievance_evidence_input", "input", 8280, 2000, inputData("Do you want to upload supporting documents or evidence?", "upload_more_evidence", [
  { label: "Upload Evidence", value: "yes" },
  { label: "Continue Without Evidence", value: "no" }
], true));
node("grievance_evidence_switch", "switch", 8520, 2000, switchData("upload_more_evidence"));
node("grievance_document_intake", "document-intake", 8760, 1920, {
  messages: ["Upload the dispute evidence as PDF or images."],
  acceptedTypesCsv: "pdf,jpg,jpeg,png",
  maxFiles: 5,
  minFiles: 1,
  outputVar: "grievance_documents"
});
node("grievance_document_processor", "file-processor", 9000, 1920, {
  inputFiles: "{{grievance_documents}}",
  processingMode: "validate",
  acceptedTypesText: "pdf,jpg,jpeg,png",
  maxFileSizeMb: 15,
  expectedDocumentType: "insurance_grievance_document",
  confidenceThreshold: 0.7,
  strictExtraction: false,
  pageMode: "process_all_pages",
  schemaJson: pretty({
    fields: {
      document_type: "string",
      claim_number: "string",
      note: "string"
    }
  }),
  outputVar: "grievance_document_processor_result"
});
node("grievance_record", "record", 9240, 2000, recordData({
  action: "upsert",
  collection: "insurance_grievances",
  where: { grievance_id: "{{grievance_id}}" },
  data: {
    grievance_id: "{{grievance_id}}",
    grievance_number: "{{grievance_number}}",
    claim_id: "{{selected_claim_id}}",
    claim_number: "{{selected_claim_number}}",
    customer_id: "{{selected_customer_id}}",
    priority: "{{grievance_priority}}",
    status: "open",
    summary: "{{grievance_summary}}",
    assigned_queue: "claims_grievance",
    created_at: "{{grievance_created_at}}"
  },
  schema: schemas.grievances,
  uniqueKey: "grievance_id",
  idempotencyKey: "{{grievance_id}}",
  outputVar: "grievance_record_result"
}));
node("grievance_queue", "queue", 9480, 2000, queueData("claims_grievance", "high", "claims,grievance", 30, "grievance_queue_result"));
node("grievance_handover", "handover", 9720, 2000, handoverData("Connecting you to the claims grievance team with your verified claim context and summary."));

node("talk_agent_form", "form", 1800, 2640, formData("Share the context for the agent handover.", talkAgentFields, "talk_agent_form_result"));
node("talk_agent_queue", "queue", 2040, 2640, queueData("insurance_agent_support", "normal", "claims,policy,service", 15, "talk_agent_queue_result"));
node("talk_agent_handover", "handover", 2280, 2640, handoverData("Connecting you to an insurance agent with the conversation context collected so far."));

node("unknown_ai", "ai-grounded", 1800, 2960, {
  contextTemplate:
    "Insurance support scope: policy questions, policy details, claim registration, upload missing documents, claim status, settlement status, service requests, complaint handling, and verified escalation. Never invent policy coverage, claim approval, settlement amounts, or regulated decisions.",
  inputTemplate: "{{main_user_request}}",
  instructions:
    "Answer only when the question is safely covered by approved insurance support knowledge. If it needs a verified account lookup, a live claim decision, or a human action, use the fallback response.",
  responseStyle: "concise",
  strictGrounding: true,
  includeCitations: false,
  includeCitationsInResponse: false,
  responseTemplate: "",
  fallbackResponseTemplate: "I do not have enough verified policy information to answer that safely.",
  fallbackMessage: "I do not have enough verified policy information to answer that safely.",
  outputVar: "unknown_ai_result",
  answerVar: "unknown_answer",
  answerKeyValueVar: "unknown_answer_key",
  emitResponse: false
});
node("unknown_answer_message", "message", 2040, 2960, msgData("{{unknown_answer}}"));
node("unknown_end", "end", 2280, 2960, { messages: [] });

node("system_failure_message", "message", 1800, 3320, msgData("I could not complete that step because the operational data or persistence layer did not respond cleanly. I am forwarding the context to the insurance team so your request does not stall."));
node("system_failure_handover", "handover", 2040, 3320, handoverData("Connecting this request to the insurance support team now."));

edge("start_1", "set_template_defaults", { label: "next" });
edge("set_template_defaults", "welcome_message", { label: "next" });
edge("welcome_message", "language_detection", { label: "next" });
edgeValue("language_detection", "detected", "main_menu_input", "detected");
edgeValue("language_detection", "low_confidence", "language_selection_input", "low_confidence");
edgeValue("language_detection", "unsupported", "default_language_message", "unsupported");
edge("language_detection", "default_language_message", { isDefault: true, label: "failed/default" });
edge("language_selection_input", "main_menu_input", { label: "next" });
edge("default_language_message", "main_menu_input", { label: "next" });
edge("main_menu_input", "main_intent_router", { label: "next" });
edgeValue("main_intent_router", "policy_questions", "policy_question_input", "policy_questions");
edgeValue("main_intent_router", "my_policy_details", "policy_details_lookup_form", "my_policy_details");
edgeValue("main_intent_router", "start_new_claim", "claim_lookup_form", "start_new_claim");
edgeValue("main_intent_router", "upload_missing_documents", "upload_docs_lookup_form", "upload_missing_documents");
edgeValue("main_intent_router", "claim_status", "claim_status_lookup_form", "claim_status");
edgeValue("main_intent_router", "claim_document_checklist", "checklist_product_input", "claim_document_checklist");
edgeValue("main_intent_router", "settlement_status", "settlement_lookup_form", "settlement_status");
edgeValue("main_intent_router", "policy_service_request", "service_request_lookup_form", "policy_service_request");
edgeValue("main_intent_router", "complaint_dispute", "dispute_lookup_form", "complaint_dispute");
edgeValue("main_intent_router", "talk_to_agent", "talk_agent_form", "talk_to_agent");
edge("main_intent_router", "unknown_ai", { isDefault: true, label: "unknown/default" });

edge("policy_question_input", "policy_question_scope_input", { label: "next" });
edge("policy_question_scope_input", "policy_question_scope_switch", { label: "next" });
edgeValue("policy_question_scope_switch", "general", "policy_general_ai", "general");
edge("policy_question_scope_switch", "policy_specific_lookup_form", { isDefault: true, label: "policy_specific/default" });
edge("policy_general_ai", "policy_general_answer_message", { label: "next" });
edge("policy_general_answer_message", "policy_general_end", { label: "next" });

edge("policy_specific_lookup_form", "policy_specific_set_journey", { label: "next" });
edge("policy_details_lookup_form", "policy_details_set_journey", { label: "next" });
edge("claim_lookup_form", "claim_set_journey", { label: "next" });
edge("service_request_lookup_form", "service_request_set_journey", { label: "next" });
edge("policy_specific_set_journey", "shared_policy_lookup_mode", { label: "next" });
edge("policy_details_set_journey", "shared_policy_lookup_mode", { label: "next" });
edge("claim_set_journey", "shared_policy_lookup_mode", { label: "next" });
edge("service_request_set_journey", "shared_policy_lookup_mode", { label: "next" });
scriptRoutes("shared_policy_lookup_mode", "shared_policy_lookup_switch", "system_failure_message");
edgeValue("shared_policy_lookup_switch", "policy_number", "policy_find_by_number", "policy_number");
edge("shared_policy_lookup_switch", "policy_find_by_mobile", { isDefault: true, label: "mobile/default" });
recordRoutes("policy_find_by_number", "policy_from_number_script", "system_failure_message", "policy_from_number_script", "policy_lookup_not_found_message");
scriptRoutes("policy_from_number_script", "policy_selection_switch", "system_failure_message");
recordRoutes("policy_find_by_mobile", "policy_from_mobile_script", "system_failure_message");
scriptRoutes("policy_from_mobile_script", "policy_selection_switch", "system_failure_message");
edgeValue("policy_selection_switch", "selected", "send_otp_message", "selected");
edgeValue("policy_selection_switch", "multiple", "policy_selection_message", "multiple");
edgeValue("policy_selection_switch", "not_found", "policy_lookup_not_found_message", "not_found");
edge("policy_selection_switch", "policy_lookup_not_found_message", { isDefault: true, label: "invalid/default" });
edge("policy_selection_message", "policy_selection_input", { label: "next" });
edge("policy_selection_input", "policy_choice_script", { label: "next" });
scriptRoutes("policy_choice_script", "policy_choice_switch", "system_failure_message");
edgeValue("policy_choice_switch", "selected", "send_otp_message", "selected");
edge("policy_choice_switch", "policy_lookup_invalid_message", { isDefault: true, label: "invalid/default" });
edge("policy_lookup_not_found_message", "policy_lookup_end", { label: "next" });
edge("policy_lookup_invalid_message", "policy_lookup_end", { label: "next" });

edge("send_otp_message", "otp_input_1", { label: "next" });
edge("otp_input_1", "otp_validate_1", { label: "next" });
scriptRoutes("otp_validate_1", "otp_switch_1", "system_failure_message");
edgeValue("otp_switch_1", "valid", "verification_success_script", "valid");
edge("otp_switch_1", "otp_invalid_message_1", { isDefault: true, label: "invalid/default" });
edge("otp_invalid_message_1", "otp_input_2", { label: "retry" });
edge("otp_input_2", "otp_validate_2", { label: "next" });
scriptRoutes("otp_validate_2", "otp_switch_2", "system_failure_message");
edgeValue("otp_switch_2", "valid", "verification_success_script", "valid");
edge("otp_switch_2", "otp_invalid_message_2", { isDefault: true, label: "invalid/default" });
edge("otp_invalid_message_2", "otp_input_3", { label: "retry" });
edge("otp_input_3", "otp_validate_3", { label: "next" });
scriptRoutes("otp_validate_3", "otp_switch_3", "system_failure_message");
edgeValue("otp_switch_3", "valid", "verification_success_script", "valid");
edge("otp_switch_3", "otp_max_attempts_message", { isDefault: true, label: "invalid/default" });
edge("otp_max_attempts_message", "otp_max_attempts_end", { label: "next" });
scriptRoutes("verification_success_script", "verified_journey_switch", "system_failure_message");
edgeValue("verified_journey_switch", "policy_specific_question", "policy_specific_ai", "policy_specific_question");
edgeValue("verified_journey_switch", "policy_details", "policy_card_script", "policy_details");
edgeValue("verified_journey_switch", "claim_start", "claim_type_list", "claim_start");
edgeValue("verified_journey_switch", "claim_status", "claim_status_history_list", "claim_status");
edgeValue("verified_journey_switch", "settlement_status", "claim_settlement_record", "settlement_status");
edgeValue("verified_journey_switch", "upload_missing_documents", "upload_docs_message", "upload_missing_documents");
edgeValue("verified_journey_switch", "policy_service_request", "service_request_type_input", "policy_service_request");
edgeValue("verified_journey_switch", "complaint_dispute", "grievance_form", "complaint_dispute");
edge("verified_journey_switch", "system_failure_message", { isDefault: true, label: "unknown/default" });

scriptRoutes("policy_card_script", "policy_card_message", "system_failure_message");
edge("policy_card_message", "policy_details_next_input", { label: "next" });
edge("policy_details_next_input", "policy_details_next_switch", { label: "next" });
edgeValue("policy_details_next_switch", "coverage", "policy_coverage_message", "coverage");
edgeValue("policy_details_next_switch", "exclusions", "policy_exclusions_message", "exclusions");
edgeValue("policy_details_next_switch", "download", "policy_download_message", "download");
edgeValue("policy_details_next_switch", "start_claim", "claim_type_list", "start_claim");
edgeValue("policy_details_next_switch", "claim_checklist", "checklist_product_input", "claim_checklist");
edge("policy_details_next_switch", "policy_coverage_message", { isDefault: true, label: "coverage/default" });
edge("policy_coverage_message", "policy_detail_end", { label: "next" });
edge("policy_exclusions_message", "policy_detail_end", { label: "next" });
edge("policy_download_message", "policy_detail_end", { label: "next" });
edge("policy_specific_ai", "policy_specific_answer_message", { label: "next" });
edge("policy_specific_answer_message", "policy_specific_end", { label: "next" });

recordRoutes("claim_type_list", "claim_type_options_script", "system_failure_message");
scriptRoutes("claim_type_options_script", "claim_type_options_message", "system_failure_message");
edge("claim_type_options_message", "claim_type_choice_input", { label: "next" });
edge("claim_type_choice_input", "claim_type_choice_script", { label: "next" });
scriptRoutes("claim_type_choice_script", "claim_type_choice_switch", "system_failure_message");
edgeValue("claim_type_choice_switch", "selected", "claim_type_hint_message", "selected");
edgeValue("claim_type_choice_switch", "empty", "claim_type_empty_message", "empty");
edge("claim_type_choice_switch", "claim_type_invalid_message", { isDefault: true, label: "invalid/default" });
edge("claim_type_invalid_message", "claim_type_end", { label: "next" });
edge("claim_type_empty_message", "claim_type_end", { label: "next" });
edge("claim_type_hint_message", "incident_core_form", { label: "next" });
edge("incident_core_form", "claim_specific_form", { label: "next" });
edge("claim_specific_form", "claim_prepare_script", { label: "next" });
scriptRoutes("claim_prepare_script", "claim_draft_record", "system_failure_message");
recordRoutes("claim_draft_record", "claim_draft_status_record", "system_failure_message");
recordRoutes("claim_draft_status_record", "claim_existing_list", "system_failure_message");
recordRoutes("claim_existing_list", "claim_dedupe_script", "system_failure_message");
scriptRoutes("claim_dedupe_script", "claim_dedupe_switch", "system_failure_message");
edgeValue("claim_dedupe_switch", "duplicate", "duplicate_claim_message", "duplicate");
edge("claim_dedupe_switch", "claim_document_rule_list", { isDefault: true, label: "clear/default" });
edge("duplicate_claim_message", "duplicate_claim_decision", { label: "next" });
edge("duplicate_claim_decision", "duplicate_claim_resolution_switch", { label: "next" });
edgeValue("duplicate_claim_resolution_switch", "view_existing", "duplicate_claim_existing_message", "view_existing");
edge("duplicate_claim_resolution_switch", "claim_document_rule_list", { isDefault: true, label: "different_incident/default" });
edge("duplicate_claim_existing_message", "duplicate_claim_end", { label: "next" });
recordRoutes("claim_document_rule_list", "claim_checklist_script", "system_failure_message");
scriptRoutes("claim_checklist_script", "claim_checklist_message", "system_failure_message");
edge("claim_checklist_message", "claim_document_intake", { label: "next" });
edge("claim_document_intake", "claim_document_processor", { label: "next" });
edge("claim_document_processor", "claim_document_validation_script", { label: "next" });
scriptRoutes("claim_document_validation_script", "claim_document_record", "system_failure_message");
recordRoutes("claim_document_record", "claim_requirements_record", "system_failure_message");
recordRoutes("claim_requirements_record", "claim_update_after_docs", "system_failure_message");
recordRoutes("claim_update_after_docs", "claim_document_route_switch", "system_failure_message");
edgeValue("claim_document_route_switch", "missing", "claim_missing_docs_message", "missing");
edge("claim_document_route_switch", "document_review_switch", { isDefault: true, label: "complete/default" });
edge("claim_missing_docs_message", "claim_missing_docs_intake", { label: "next" });
edge("claim_missing_docs_intake", "claim_missing_docs_processor", { label: "next" });
edge("claim_missing_docs_processor", "claim_missing_docs_validation_script", { label: "next" });
scriptRoutes("claim_missing_docs_validation_script", "claim_retry_route_switch", "system_failure_message");
edgeValue("claim_retry_route_switch", "missing", "claim_pending_record", "missing");
edge("claim_retry_route_switch", "document_review_switch", { isDefault: true, label: "complete/default" });
recordRoutes("claim_pending_record", "claim_pending_scheduler", "system_failure_message");
schedulerRoutes("claim_pending_scheduler", "claim_pending_message");
edge("claim_pending_message", "claim_pending_end", { label: "next" });
edgeValue("document_review_switch", "yes", "document_review_queue", "yes");
edge("document_review_switch", "claim_summary_script", { isDefault: true, label: "no/default" });
queueRoutes("document_review_queue", "claim_summary_script");
scriptRoutes("claim_summary_script", "claim_summary_message", "system_failure_message");
edge("claim_summary_message", "claim_submit_input", { label: "next" });
edge("claim_submit_input", "claim_submit_switch", { label: "next" });
edgeValue("claim_submit_switch", "submit", "claim_sync_script", "submit");
edge("claim_submit_switch", "claim_cancelled_message", { isDefault: true, label: "cancel/default" });
edge("claim_cancelled_message", "claim_cancelled_end", { label: "next" });
scriptRoutes("claim_sync_script", "claim_sync_switch", "system_failure_message");
edgeValue("claim_sync_switch", "submitted", "claim_submitted_record", "submitted");
edge("claim_sync_switch", "claim_sync_pending_record", { isDefault: true, label: "sync_pending/default" });
recordRoutes("claim_submitted_record", "claim_submitted_status_record", "system_failure_message");
recordRoutes("claim_submitted_status_record", "claim_submit_notification", "system_failure_message");
notificationRoutes("claim_submit_notification", "claim_submit_success_message");
edge("claim_submit_success_message", "claim_submit_end", { label: "next" });
recordRoutes("claim_sync_pending_record", "claim_outbox_record", "system_failure_message");
recordRoutes("claim_outbox_record", "claim_sync_pending_notification", "system_failure_message");
notificationRoutes("claim_sync_pending_notification", "claim_sync_pending_message");
edge("claim_sync_pending_message", "claim_sync_pending_end", { label: "next" });

edge("upload_docs_lookup_form", "upload_docs_set_journey", { label: "next" });
edge("claim_status_lookup_form", "claim_status_set_journey", { label: "next" });
edge("settlement_lookup_form", "settlement_set_journey", { label: "next" });
edge("dispute_lookup_form", "dispute_set_journey", { label: "next" });
edge("upload_docs_set_journey", "shared_claim_lookup_mode", { label: "next" });
edge("claim_status_set_journey", "shared_claim_lookup_mode", { label: "next" });
edge("settlement_set_journey", "shared_claim_lookup_mode", { label: "next" });
edge("dispute_set_journey", "shared_claim_lookup_mode", { label: "next" });
scriptRoutes("shared_claim_lookup_mode", "shared_claim_lookup_switch", "system_failure_message");
edgeValue("shared_claim_lookup_switch", "claim_number", "claim_find_by_number", "claim_number");
edge("shared_claim_lookup_switch", "claim_find_by_mobile", { isDefault: true, label: "mobile/default" });
recordRoutes("claim_find_by_number", "claim_from_number_script", "system_failure_message", "claim_from_number_script", "claim_lookup_not_found_message");
scriptRoutes("claim_from_number_script", "claim_selection_switch", "system_failure_message");
recordRoutes("claim_find_by_mobile", "claim_from_mobile_script", "system_failure_message");
scriptRoutes("claim_from_mobile_script", "claim_selection_switch", "system_failure_message");
edgeValue("claim_selection_switch", "selected", "send_otp_message", "selected");
edgeValue("claim_selection_switch", "multiple", "claim_selection_message", "multiple");
edgeValue("claim_selection_switch", "not_found", "claim_lookup_not_found_message", "not_found");
edge("claim_selection_switch", "claim_lookup_not_found_message", { isDefault: true, label: "invalid/default" });
edge("claim_selection_message", "claim_selection_input", { label: "next" });
edge("claim_selection_input", "claim_choice_script", { label: "next" });
scriptRoutes("claim_choice_script", "claim_choice_switch", "system_failure_message");
edgeValue("claim_choice_switch", "selected", "send_otp_message", "selected");
edge("claim_choice_switch", "claim_lookup_invalid_message", { isDefault: true, label: "invalid/default" });
edge("claim_lookup_not_found_message", "claim_lookup_end", { label: "next" });
edge("claim_lookup_invalid_message", "claim_lookup_end", { label: "next" });

recordRoutes("claim_status_history_list", "claim_status_timeline_script", "system_failure_message");
scriptRoutes("claim_status_timeline_script", "claim_status_message", "system_failure_message");
edge("claim_status_message", "claim_status_end", { label: "next" });

recordRoutes("claim_settlement_record", "claim_settlement_script", "system_failure_message", "claim_settlement_script", "claim_settlement_script");
scriptRoutes("claim_settlement_script", "claim_settlement_message", "system_failure_message");
edge("claim_settlement_message", "claim_settlement_end", { label: "next" });

edge("upload_docs_message", "upload_docs_intake", { label: "next" });
edge("upload_docs_intake", "upload_docs_processor", { label: "next" });
edge("upload_docs_processor", "upload_docs_validation_script", { label: "next" });
scriptRoutes("upload_docs_validation_script", "upload_docs_route_switch", "system_failure_message");
edgeValue("upload_docs_route_switch", "documents_complete", "upload_docs_claim_update", "documents_complete");
edge("upload_docs_route_switch", "upload_docs_claim_update", { isDefault: true, label: "documents_pending/default" });
recordRoutes("upload_docs_claim_update", "upload_docs_post_update_switch", "system_failure_message");
edgeValue("upload_docs_post_update_switch", "documents_complete", "upload_docs_complete_message", "documents_complete");
edge("upload_docs_post_update_switch", "upload_docs_pending_message", { isDefault: true, label: "documents_pending/default" });
edge("upload_docs_complete_message", "upload_docs_end", { label: "next" });
edge("upload_docs_pending_message", "upload_docs_end", { label: "next" });

edge("checklist_product_input", "checklist_type_list", { label: "next" });
recordRoutes("checklist_type_list", "checklist_type_options_script", "system_failure_message");
scriptRoutes("checklist_type_options_script", "checklist_type_message", "system_failure_message");
edge("checklist_type_message", "checklist_type_input", { label: "next" });
edge("checklist_type_input", "checklist_type_choice_script", { label: "next" });
scriptRoutes("checklist_type_choice_script", "checklist_type_choice_switch", "system_failure_message");
edgeValue("checklist_type_choice_switch", "selected", "checklist_rule_list", "selected");
edge("checklist_type_choice_switch", "checklist_invalid_message", { isDefault: true, label: "invalid/default" });
edge("checklist_invalid_message", "checklist_end", { label: "next" });
recordRoutes("checklist_rule_list", "checklist_rule_script", "system_failure_message");
scriptRoutes("checklist_rule_script", "checklist_message", "system_failure_message");
edge("checklist_message", "checklist_end", { label: "next" });

edge("service_request_type_input", "service_request_form", { label: "next" });
edge("service_request_form", "service_request_approval_script", { label: "next" });
scriptRoutes("service_request_approval_script", "service_request_approval_switch", "system_failure_message");
edgeValue("service_request_approval_switch", "yes", "service_request_record", "yes");
edge("service_request_approval_switch", "service_request_record", { isDefault: true, label: "no/default" });
recordRoutes("service_request_record", "service_request_post_record_switch", "system_failure_message");
edgeValue("service_request_post_record_switch", "yes", "service_request_approval", "yes");
edge("service_request_post_record_switch", "service_request_notification", { isDefault: true, label: "no/default" });
notificationRoutes("service_request_notification", "service_request_message");
edge("service_request_message", "service_request_end", { label: "next" });
edge("service_request_approval", "service_request_notification", { condition: { operator: "equals", value: "approved" }, label: "approved" });
edge("service_request_approval", "service_request_notification", { condition: { operator: "equals", value: "more_info_required" }, label: "more_info_required" });
edge("service_request_approval", "service_request_notification", { condition: { operator: "equals", value: "timeout" }, label: "timeout" });
edge("service_request_approval", "service_request_notification", { isDefault: true, label: "rejected/failed/default" });

edge("grievance_form", "grievance_reference_script", { label: "next" });
scriptRoutes("grievance_reference_script", "grievance_evidence_input", "system_failure_message");
edge("grievance_evidence_input", "grievance_evidence_switch", { label: "next" });
edgeValue("grievance_evidence_switch", "yes", "grievance_document_intake", "yes");
edge("grievance_evidence_switch", "grievance_record", { isDefault: true, label: "no/default" });
edge("grievance_document_intake", "grievance_document_processor", { label: "next" });
edge("grievance_document_processor", "grievance_record", { label: "next" });
recordRoutes("grievance_record", "grievance_queue", "system_failure_message");
queueRoutes("grievance_queue", "grievance_handover");

edge("talk_agent_form", "talk_agent_queue", { label: "next" });
queueRoutes("talk_agent_queue", "talk_agent_handover");

edge("unknown_ai", "unknown_answer_message", { label: "next" });
edge("unknown_answer_message", "unknown_end", { label: "next" });

edge("system_failure_message", "system_failure_handover", { label: "next" });

exportDoc.metadata.nodeCount = nodes.length;

for (const path of [sourcePath, builtPath, stablePath]) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(exportDoc, null, 2)}\n`, "utf8");
}

console.log(`Wrote ${sourcePath}`);
console.log(`Wrote ${builtPath}`);
console.log(`Wrote ${stablePath}`);
console.log(`Nodes: ${nodes.length}`);
console.log(`Edges: ${edges.length}`);
