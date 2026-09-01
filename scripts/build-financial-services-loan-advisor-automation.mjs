import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { notificationData } from "./notification-data.mjs";

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const domainRoot = join(rootDir, "domains", "financial-services");
const sourcePath = join(
  domainRoot,
  "templates-source",
  "financial-services-loan-advisor-automation.source.flow.json"
);
const builtPath = join(
  domainRoot,
  "templates",
  "financial-services-loan-advisor-automation.flow.json"
);
const stablePath = join(
  domainRoot,
  "templates-stable",
  "financial-services-loan-advisor-automation.flow.json"
);

const exportDoc = {
  version: "1.0",
  exportedAt: "2026-08-25T00:00:00.000Z",
  bot: {
    name: "Loans & Financial Services Lead to Advisor Appointment",
    description:
      "Automation-first loan assistant that captures structured lending requirements, produces indicative guidance, saves qualified lead data, supports status lookups, accepts document uploads, books advisor consultations, and schedules follow-up.",
    headerTitle: "Loan Advisor Automation",
    headerTagline: "Financial lead qualification and advisor booking",
    globalVariables: [
      { key: "brand_name", value: "Crescora.ai" },
      { key: "institution_name", value: "Northstar Lending" },
      { key: "default_currency", value: "INR" },
      { key: "default_timezone", value: "Asia/Kolkata" },
      { key: "advisor_support_phone", value: "+91-90000-91000" },
      { key: "loan_ops_email", value: "ops@northstar-lending.example" },
      { key: "crm_provider", value: "generic_crm" }
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
const DOMAIN_RECORD_SCHEMA = "financial_services";

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
  sortBy = "updated_at",
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

function appointmentData(message, dynamicSlotsVar, outputVar) {
  return {
    slots: [],
    slotsJson: "[]",
    messages: [message],
    slotMode: "dynamic",
    timezone: "{{default_timezone}}",
    outputVar,
    dateVar: "advisor_appointment_date",
    horizonDays: 10,
    maxSlotsPerDay: 6,
    dynamicSlotsVar,
    dynamicSlotsPath: "data",
    slotDurationMins: 30,
    slotIntervalMins: 30,
    availableWeekdays: "1,2,3,4,5,6",
    workingHoursStart: "10:00",
    workingHoursEnd: "18:00"
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
  edge(scriptId, failureId, { isDefault: true, label: "failure/default" });
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

function yesNoButtons() {
  return [
    { label: "Yes", value: "yes" },
    { label: "No", value: "no" }
  ];
}

function loanTypeButtons() {
  return [
    { label: "🏠 Home Loan", value: "home_loan" },
    { label: "👤 Personal Loan", value: "personal_loan" },
    { label: "🏢 Business Loan", value: "business_loan" }
  ];
}

function mainMenuButtons() {
  return [
    { label: "🏠 Home Loan", value: "home_loan" },
    { label: "👤 Personal Loan", value: "personal_loan" },
    { label: "🏢 Business Loan", value: "business_loan" },
    { label: "✅ Check Indicative Eligibility", value: "check_eligibility" },
    { label: "📋 Documents Required", value: "documents_required" },
    { label: "📊 Existing Request Status", value: "request_status" },
    { label: "📅 Book an Advisor", value: "book_advisor" },
    { label: "💬 Loan Questions", value: "loan_questions" },
    { label: "👨‍💼 Talk to an Advisor", value: "talk_to_advisor" }
  ];
}

const arrayReaderBlock = `
function getRows(result) {
  if (!result) return [];
  if (Array.isArray(result.records)) {
    return result.records.map((item) => item?.data || item?.dataJson || item);
  }
  if (Array.isArray(result.items)) {
    return result.items.map((item) => item?.data || item?.dataJson || item);
  }
  if (Array.isArray(result.data)) {
    return result.data.map((item) => item?.data || item?.dataJson || item);
  }
  if (result.data && typeof result.data === "object" && !Array.isArray(result.data)) {
    return [result.data];
  }
  return [];
}
function firstRow(result) {
  const rows = getRows(result);
  return rows.length ? rows[0] : null;
}
function normalizePhone(value) {
  const digits = String(value || "").replace(/\\D/g, "");
  if (!digits) return "";
  const last10 = digits.slice(-10);
  return last10 ? "+91" + last10 : "";
}
function formatMoneyMinor(value) {
  const amountMinor = Number(value || 0);
  const rupees = amountMinor / 100;
  if (!Number.isFinite(rupees) || rupees <= 0) return "";
  return "₹" + rupees.toLocaleString("en-IN");
}
function titleCase(value) {
  return String(value || "")
    .replace(/[_-]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
`;

const schemas = {
  customers: pretty({
    collection: "loan_customers",
    fields: {
      customer_id: { type: "string", required: true, unique: true },
      full_name: { type: "string", required: true },
      phone_e164: { type: "phone", required: true, unique: true },
      email: { type: "email", required: false },
      city: { type: "string", required: false },
      preferred_language: { type: "string", required: false },
      latest_active_lead_id: { type: "string", required: false },
      latest_product_code: { type: "string", required: false },
      latest_status: { type: "string", required: false }
    }
  }),
  products: pretty({
    collection: "loan_products",
    fields: {
      product_id: { type: "string", required: true, unique: true },
      product_code: { type: "string", required: true, unique: true },
      product_name: { type: "string", required: true },
      description: { type: "string", required: true },
      min_amount_minor: { type: "number", required: false },
      max_amount_minor: { type: "number", required: false },
      min_tenure_years: { type: "number", required: false },
      max_tenure_years: { type: "number", required: false },
      active: { type: "boolean", required: true }
    }
  }),
  guidelines: pretty({
    collection: "loan_product_guidelines",
    fields: {
      rule_id: { type: "string", required: true, unique: true },
      product_code: { type: "string", required: true },
      employment_type: { type: "string", required: true },
      min_income_minor: { type: "number", required: false },
      max_emi_to_income_ratio_pct: { type: "number", required: false },
      min_amount_minor: { type: "number", required: false },
      max_amount_minor: { type: "number", required: false },
      max_ltv_pct: { type: "number", required: false },
      supported_cities: { type: "string", required: false },
      active: { type: "boolean", required: true }
    }
  }),
  documentRules: pretty({
    collection: "loan_document_rules",
    fields: {
      rule_id: { type: "string", required: true, unique: true },
      product_code: { type: "string", required: true },
      employment_type: { type: "string", required: true },
      document_code: { type: "string", required: true },
      document_name: { type: "string", required: true },
      requirement_type: { type: "string", required: true },
      display_order: { type: "number", required: true },
      active: { type: "boolean", required: true }
    }
  }),
  leads: pretty({
    collection: "loan_leads",
    fields: {
      lead_id: { type: "string", required: true, unique: true },
      lead_number: { type: "string", required: true, unique: true },
      customer_id: { type: "string", required: true },
      customer_mobile: { type: "phone", required: true },
      customer_name: { type: "string", required: true },
      customer_email: { type: "email", required: false },
      city: { type: "string", required: false },
      preferred_language: { type: "string", required: false },
      product_code: { type: "string", required: true },
      product_name: { type: "string", required: true },
      requested_amount_minor: { type: "number", required: false },
      requested_amount_display: { type: "string", required: false },
      employment_type: { type: "string", required: false },
      monthly_income_minor: { type: "number", required: false },
      existing_monthly_emi_minor: { type: "number", required: false },
      preferred_tenure_years: { type: "number", required: false },
      loan_purpose: { type: "string", required: false },
      preferred_contact_time: { type: "string", required: false },
      qualification_status: { type: "string", required: true },
      lead_status: { type: "string", required: true },
      lead_priority: { type: "string", required: true },
      lead_score: { type: "number", required: false },
      reason_codes: { type: "string", required: false },
      assigned_advisor_id: { type: "string", required: false },
      assigned_advisor_name: { type: "string", required: false },
      latest_appointment_id: { type: "string", required: false },
      source_channel: { type: "string", required: true },
      source_campaign: { type: "string", required: false },
      conversation_summary: { type: "string", required: false },
      created_at: { type: "string", required: false },
      updated_at: { type: "string", required: false }
    }
  }),
  leadProfiles: pretty({
    collection: "loan_lead_profiles",
    fields: {
      profile_id: { type: "string", required: true, unique: true },
      lead_id: { type: "string", required: true },
      product_code: { type: "string", required: true },
      property_value_minor: { type: "number", required: false },
      property_stage: { type: "string", required: false },
      property_type: { type: "string", required: false },
      property_city: { type: "string", required: false },
      co_applicant_available: { type: "string", required: false },
      employer_category: { type: "string", required: false },
      work_experience_years: { type: "number", required: false },
      current_employer_tenure_years: { type: "number", required: false },
      business_type: { type: "string", required: false },
      industry: { type: "string", required: false },
      business_vintage_years: { type: "number", required: false },
      annual_turnover_minor: { type: "number", required: false },
      profitability_range: { type: "string", required: false },
      existing_business_loans: { type: "string", required: false }
    }
  }),
  prequalificationRuns: pretty({
    collection: "loan_prequalification_runs",
    fields: {
      run_id: { type: "string", required: true, unique: true },
      lead_id: { type: "string", required: true },
      product_code: { type: "string", required: true },
      result: { type: "string", required: true },
      reason_codes: { type: "string", required: false },
      summary_text: { type: "string", required: false },
      created_at: { type: "string", required: false }
    }
  }),
  leadDocuments: pretty({
    collection: "loan_lead_documents",
    fields: {
      lead_document_id: { type: "string", required: true, unique: true },
      lead_id: { type: "string", required: true },
      customer_id: { type: "string", required: true },
      uploaded_document_count: { type: "number", required: true },
      processing_status: { type: "string", required: true },
      verification_status: { type: "string", required: true },
      extraction_summary: { type: "string", required: false }
    }
  }),
  advisorSlots: pretty({
    collection: "loan_advisor_slots",
    fields: {
      slot_id: { type: "string", required: true, unique: true },
      advisor_id: { type: "string", required: true },
      advisor_name: { type: "string", required: true },
      advisor_language: { type: "string", required: false },
      city: { type: "string", required: false },
      product_code: { type: "string", required: true },
      date: { type: "string", required: true },
      start: { type: "string", required: true },
      end: { type: "string", required: false },
      label: { type: "string", required: true },
      status: { type: "string", required: true },
      hold_id: { type: "string", required: false },
      held_by_session: { type: "string", required: false },
      hold_expires_at: { type: "string", required: false },
      appointment_id: { type: "string", required: false }
    }
  }),
  slotHolds: pretty({
    collection: "loan_slot_holds",
    fields: {
      hold_id: { type: "string", required: true, unique: true },
      slot_id: { type: "string", required: true },
      lead_id: { type: "string", required: true },
      session_id: { type: "string", required: true },
      status: { type: "string", required: true },
      expires_at: { type: "string", required: false }
    }
  }),
  appointments: pretty({
    collection: "loan_appointments",
    fields: {
      appointment_id: { type: "string", required: true, unique: true },
      appointment_number: { type: "string", required: true, unique: true },
      lead_id: { type: "string", required: true },
      customer_id: { type: "string", required: true },
      advisor_id: { type: "string", required: true },
      advisor_name: { type: "string", required: true },
      slot_id: { type: "string", required: true },
      product_code: { type: "string", required: true },
      appointment_date: { type: "string", required: true },
      appointment_time: { type: "string", required: true },
      appointment_datetime: { type: "string", required: true },
      status: { type: "string", required: true }
    }
  }),
  followupJobs: pretty({
    collection: "loan_followup_jobs",
    fields: {
      followup_id: { type: "string", required: true, unique: true },
      lead_id: { type: "string", required: true },
      appointment_id: { type: "string", required: false },
      job_type: { type: "string", required: true },
      run_at: { type: "string", required: false },
      channel: { type: "string", required: true },
      status: { type: "string", required: true }
    }
  }),
  statusHistory: pretty({
    collection: "loan_status_history",
    fields: {
      status_event_id: { type: "string", required: true, unique: true },
      lead_id: { type: "string", required: true },
      lead_number: { type: "string", required: true },
      from_status: { type: "string", required: false },
      to_status: { type: "string", required: true },
      customer_message: { type: "string", required: false },
      source: { type: "string", required: true },
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

const basicProfileFields = [
  { key: "customer_name", label: "Full name", type: "text", required: true },
  { key: "customer_city", label: "City", type: "text", required: true },
  { key: "customer_email", label: "Email", type: "email", required: false },
  {
    key: "preferred_language",
    label: "Preferred contact language",
    type: "select",
    required: true,
    options: ["English", "Hindi", "Telugu"]
  }
];

const financialProfileFields = [
  {
    key: "employment_type",
    label: "Employment type",
    type: "select",
    required: true,
    options: ["salaried", "self_employed", "business"]
  },
  {
    key: "monthly_income_rupees",
    label: "Monthly income in rupees",
    type: "number",
    required: true
  },
  {
    key: "existing_monthly_emi_rupees",
    label: "Existing monthly EMIs in rupees",
    type: "number",
    required: true
  }
];

const requirementMetaFields = [
  {
    key: "preferred_tenure_years",
    label: "Preferred tenure",
    type: "select",
    required: true,
    options: ["10", "15", "20", "25", "30"]
  },
  { key: "loan_purpose", label: "Loan purpose", type: "text", required: true },
  {
    key: "preferred_contact_time",
    label: "Preferred contact time",
    type: "select",
    required: true,
    options: ["Morning", "Afternoon", "Evening"]
  }
];

const requestedAmountField = [
  {
    key: "requested_amount_rupees",
    label: "Requested loan amount in rupees",
    type: "number",
    required: true
  }
];

const homeLoanFields = [
  {
    key: "property_value_rupees",
    label: "Property value in rupees",
    type: "number",
    required: true
  },
  {
    key: "property_stage",
    label: "Property stage",
    type: "select",
    required: true,
    options: ["identified", "searching", "under_construction", "ready_property"]
  },
  {
    key: "property_type",
    label: "Property type",
    type: "select",
    required: true,
    options: ["Apartment", "Independent House", "Villa", "Plot + Construction"]
  },
  { key: "property_city", label: "Property city", type: "text", required: true },
  {
    key: "co_applicant_available",
    label: "Co-applicant available",
    type: "select",
    required: true,
    options: ["yes", "no"]
  }
];

const personalLoanFields = [
  { key: "personal_loan_purpose", label: "Personal loan purpose", type: "text", required: true },
  {
    key: "employer_category",
    label: "Employer category",
    type: "select",
    required: true,
    options: ["private", "government", "public_sector", "professional"]
  },
  {
    key: "work_experience_years",
    label: "Total work experience in years",
    type: "number",
    required: true
  },
  {
    key: "current_employer_tenure_years",
    label: "Current employer tenure in years",
    type: "number",
    required: true
  }
];

const businessLoanFields = [
  { key: "business_loan_purpose", label: "Business loan purpose", type: "text", required: true },
  { key: "business_type", label: "Business type", type: "text", required: true },
  { key: "industry", label: "Industry", type: "text", required: true },
  {
    key: "business_vintage_years",
    label: "Business vintage in years",
    type: "number",
    required: true
  },
  {
    key: "annual_turnover_rupees",
    label: "Approximate annual turnover in rupees",
    type: "number",
    required: true
  },
  {
    key: "profitability_range",
    label: "Profitability range",
    type: "select",
    required: true,
    options: ["profitable", "break_even", "seasonal", "needs_review"]
  },
  {
    key: "existing_business_loans",
    label: "Existing business loans",
    type: "select",
    required: true,
    options: ["yes", "no"]
  }
];

const parseRequirementScript = `
${arrayReaderBlock}
function toMinorFromLakh(value) {
  return Math.round(Number(value) * 100000 * 100);
}
function toMinorFromCrore(value) {
  return Math.round(Number(value) * 10000000 * 100);
}
const raw = String(vars.customer_requirement_text || "").trim();
const lowered = raw.toLowerCase();
if (/home loan|housing loan/i.test(raw)) vars.loan_type = "home_loan";
if (/personal loan/i.test(raw)) vars.loan_type = "personal_loan";
if (/business loan|working capital|msme/i.test(raw)) vars.loan_type = "business_loan";
const rangeMatch = raw.match(/(\\d+(?:\\.\\d+)?)\\s*(crore|cr|lakh|lakhs|lakhs|lac|l)\\b/i);
if (rangeMatch) {
  const value = Number(rangeMatch[1]);
  const unit = String(rangeMatch[2] || "").toLowerCase();
  vars.requested_amount_minor = unit.startsWith("c")
    ? toMinorFromCrore(value)
    : toMinorFromLakh(value);
}
if (/hyderabad/i.test(raw)) vars.customer_city = vars.customer_city || "Hyderabad";
if (/bengaluru|bangalore/i.test(raw)) vars.customer_city = vars.customer_city || "Bengaluru";
if (/pune/i.test(raw)) vars.customer_city = vars.customer_city || "Pune";
if (/property purchase/i.test(lowered)) vars.loan_purpose = vars.loan_purpose || "Property purchase";
if (/working capital/i.test(lowered)) vars.loan_purpose = vars.loan_purpose || "Working capital";
if (/personal expense|medical|wedding|education/i.test(lowered)) vars.loan_purpose = vars.loan_purpose || "Personal expense";
vars.loan_type_route = vars.loan_type ? "known" : "needs_selection";
vars.requested_amount_route = Number(vars.requested_amount_minor || 0) > 0 ? "known" : "missing";
vars.requested_amount_display = formatMoneyMinor(vars.requested_amount_minor || 0);
return "success";
`;

const existingCustomerHydrateScript = `
${arrayReaderBlock}
const customer = firstRow(vars.customer_find_result);
const leadRows = getRows(vars.existing_lead_list_result);
if (!customer || !customer.customer_id) {
  vars.customer_lookup_state = "new";
  return "success";
}
vars.customer_lookup_state = "returning";
vars.customer_id = customer.customer_id || "";
vars.customer_name = customer.full_name || vars.customer_name || "";
vars.customer_email = customer.email || vars.customer_email || "";
vars.customer_city = customer.city || vars.customer_city || "";
vars.preferred_language = customer.preferred_language || vars.preferred_language || "";
const activeLead = leadRows.find((row) => {
  return ["profile_in_progress", "ready_for_advisor", "advisor_booked", "assigned", "qualified"]
    .includes(String(row?.lead_status || "").trim().toLowerCase());
});
if (activeLead) {
  vars.active_lead_id = activeLead.lead_id || "";
  vars.active_lead_number = activeLead.lead_number || "";
  vars.active_lead_status = activeLead.lead_status || "";
  vars.active_lead_amount_display = activeLead.requested_amount_display || formatMoneyMinor(activeLead.requested_amount_minor || 0);
  vars.active_lead_product_name = activeLead.product_name || titleCase(activeLead.product_code || "");
  vars.customer_lookup_state = "active_lead";
}
return "success";
`;

const prepareIdentityScript = `
${arrayReaderBlock}
const now = "2026-08-25T12:00:00.000Z";
const sessionId = String(vars.system?.sessionId || "SESSION");
const suffix = sessionId.replace(/[^A-Za-z0-9]/g, "").slice(-6).toUpperCase() || "DEMO01";
const phone = normalizePhone(vars.customer_mobile || vars.status_lookup_mobile || "");
vars.customer_mobile = phone || vars.customer_mobile || "";
if (!vars.customer_id) {
  vars.customer_id = "CUST-FS-" + suffix;
}
vars.lead_id = "LEAD-FS-" + suffix;
vars.lead_number = "LD-20260825-" + suffix;
vars.profile_id = "PROFILE-FS-" + suffix;
vars.prequal_run_id = "PREQUAL-FS-" + suffix;
vars.lead_document_id = "DOC-FS-" + suffix;
vars.appointment_id = "APPT-FS-" + suffix;
vars.appointment_number = "APT-20260825-" + suffix;
vars.hold_id = "HOLD-FS-" + suffix;
vars.created_at = now;
vars.updated_at = now;
vars.source_channel = vars.system?.channel || "WEB";
return "success";
`;

const normalizeFinancialInputsScript = `
${arrayReaderBlock}
function rupeesToMinor(value) {
  const numeric = Number(value || 0);
  return numeric > 0 ? Math.round(numeric * 100) : 0;
}
if (Number(vars.requested_amount_rupees || 0) > 0) {
  vars.requested_amount_minor = rupeesToMinor(vars.requested_amount_rupees);
}
vars.monthly_income_minor = rupeesToMinor(vars.monthly_income_rupees);
vars.existing_monthly_emi_minor = rupeesToMinor(vars.existing_monthly_emi_rupees);
vars.property_value_minor = rupeesToMinor(vars.property_value_rupees);
vars.annual_turnover_minor = rupeesToMinor(vars.annual_turnover_rupees);
vars.requested_amount_display = formatMoneyMinor(vars.requested_amount_minor);
vars.monthly_income_display = formatMoneyMinor(vars.monthly_income_minor);
vars.existing_monthly_emi_display = formatMoneyMinor(vars.existing_monthly_emi_minor);
vars.property_value_display = formatMoneyMinor(vars.property_value_minor);
vars.annual_turnover_display = formatMoneyMinor(vars.annual_turnover_minor);
vars.product_name = vars.product_find_result?.data?.product_name || titleCase(vars.loan_type || "");
return "success";
`;

const guidelineSelectionScript = `
${arrayReaderBlock}
const rows = getRows(vars.guideline_list_result);
const normalizedEmployment = String(vars.employment_type || "").trim().toLowerCase();
const row = rows.find((item) => String(item?.employment_type || "").trim().toLowerCase() === normalizedEmployment)
  || rows[0]
  || null;
if (!row) {
  vars.guideline_selection_state = "missing";
  return "success";
}
vars.guideline_selection_state = "selected";
vars.rule_id = row.rule_id || "";
vars.guideline_min_income_minor = Number(row.min_income_minor || 0);
vars.guideline_max_emi_to_income_ratio_pct = Number(row.max_emi_to_income_ratio_pct || 0);
vars.guideline_min_amount_minor = Number(row.min_amount_minor || 0);
vars.guideline_max_amount_minor = Number(row.max_amount_minor || 0);
vars.guideline_max_ltv_pct = Number(row.max_ltv_pct || 0);
vars.guideline_supported_cities = row.supported_cities || "";
return "success";
`;

const prequalificationScript = `
${arrayReaderBlock}
const reasons = [];
const income = Number(vars.monthly_income_minor || 0);
const emi = Number(vars.existing_monthly_emi_minor || 0);
const requested = Number(vars.requested_amount_minor || 0);
const propertyValue = Number(vars.property_value_minor || 0);
const minIncome = Number(vars.guideline_min_income_minor || 0);
const maxAmount = Number(vars.guideline_max_amount_minor || 0);
const minAmount = Number(vars.guideline_min_amount_minor || 0);
const maxRatio = Number(vars.guideline_max_emi_to_income_ratio_pct || 0);
const maxLtv = Number(vars.guideline_max_ltv_pct || 0);
const cityList = String(vars.guideline_supported_cities || "")
  .split("|")
  .map((value) => value.trim().toLowerCase())
  .filter(Boolean);
const city = String(vars.customer_city || vars.property_city || "").trim().toLowerCase();
if (minIncome && income && income < minIncome) reasons.push("income_below_guideline");
if (minAmount && requested && requested < minAmount) reasons.push("requested_amount_below_guideline");
if (maxAmount && requested && requested > maxAmount) reasons.push("requested_amount_outside_auto_guidance");
if (income > 0 && maxRatio > 0) {
  const ratio = ((emi || 0) / income) * 100;
  if (ratio > maxRatio) reasons.push("emi_ratio_high");
}
if (maxLtv > 0 && propertyValue > 0 && requested > 0) {
  const ltv = (requested / propertyValue) * 100;
  if (ltv > maxLtv) reasons.push("ltv_outside_guideline");
}
if (cityList.length && city && !cityList.includes(city)) {
  reasons.push("city_needs_manual_review");
}
let result = "likely_match";
if (!requested || !income) {
  result = "insufficient_information";
} else if (reasons.length) {
  result = reasons.includes("requested_amount_outside_auto_guidance")
    ? "needs_review"
    : "possible_match";
}
vars.prequalification_status = result;
vars.reason_codes = reasons.join("|");
vars.qualification_status = result;
vars.prequalification_summary =
  result === "likely_match"
    ? "✅ Your information appears broadly aligned with the initial requirements for this " + (vars.product_name || "loan") + ". Final eligibility, pricing, verification, and approval are determined by the authorised lending team."
    : result === "insufficient_information"
      ? "I need a complete requirement and income profile before I can provide even an initial indication."
      : "I cannot reliably determine an initial match from the current information. An advisor should review this requirement and explain the suitable options.";
return "success";
`;

const documentChecklistScript = `
${arrayReaderBlock}
const rows = getRows(vars.document_rule_list_result)
  .filter((row) => String(row?.product_code || "").trim().toLowerCase() === String(vars.loan_type || "").trim().toLowerCase())
  .filter((row) => String(row?.employment_type || "").trim().toLowerCase() === String(vars.employment_type || "").trim().toLowerCase())
  .sort((a, b) => Number(a.display_order || 0) - Number(b.display_order || 0));
if (!rows.length) {
  vars.required_document_summary = "The exact document checklist will be confirmed by the lending team.";
  vars.required_document_count = 0;
  return "success";
}
vars.required_document_count = rows.length;
vars.required_document_summary = rows
  .map((row, index) => String(index + 1) + ". " + (row.document_name || row.document_code || "Document"))
  .join("\\n");
return "success";
`;

const documentResultScript = `
${arrayReaderBlock}
const result = vars.loan_document_processor_result || {};
const files = Array.isArray(vars.loan_document_files) ? vars.loan_document_files : [];
const status = String(result.status || result.outcome || result.result || "").trim().toLowerCase();
const extracted = result.fields || result.extractedFields || result.data || {};
vars.uploaded_document_count = files.length;
vars.document_processing_status = status || (files.length ? "processed" : "invalid_file");
vars.document_verification_status =
  status === "success" || status === "partial"
    ? "received"
    : status === "low_confidence" || status === "manual_review_required"
      ? "manual_review_required"
      : "invalid_file";
vars.document_extraction_summary = JSON.stringify(extracted || {});
vars.document_result_route =
  status === "success" || status === "partial"
    ? "record"
    : status === "low_confidence" || status === "manual_review_required"
      ? "manual_review"
      : "invalid";
return "success";
`;

const leadSummaryScript = `
${arrayReaderBlock}
const reasons = String(vars.reason_codes || "").split("|").filter(Boolean);
let score = 20;
if (vars.loan_type) score += 10;
if (Number(vars.requested_amount_minor || 0) > 0) score += 15;
if (Number(vars.monthly_income_minor || 0) > 0) score += 10;
if (String(vars.customer_mobile || "").trim()) score += 10;
if (String(vars.preferred_contact_time || "").trim()) score += 5;
if (Number(vars.uploaded_document_count || 0) > 0) score += 10;
if (vars.loan_type === "home_loan" && Number(vars.property_value_minor || 0) > 0) score += 10;
if (vars.loan_type === "business_loan" && Number(vars.annual_turnover_minor || 0) > 0) score += 10;
if (vars.prequalification_status === "likely_match") score += 8;
if (reasons.length) score -= Math.min(12, reasons.length * 4);
if (String(vars.entry_action || "") === "book_advisor") score += 5;
score = Math.max(0, Math.min(99, score));
vars.lead_score = score;
vars.lead_priority = score >= 80 ? "hot" : score >= 55 ? "warm" : "review";
vars.lead_status = vars.prequalification_status === "likely_match" ? "ready_for_advisor" : "profile_captured";
vars.conversation_summary = [
  "Customer: " + (vars.customer_name || "Not captured"),
  "Product: " + (vars.product_name || vars.loan_type || "Not selected"),
  "Requested amount: " + (vars.requested_amount_display || "Not available"),
  "Employment: " + (vars.employment_type || "Not available"),
  "Monthly income: " + (vars.monthly_income_display || "Not available"),
  "Existing EMI: " + (vars.existing_monthly_emi_display || "Not available"),
  "Indicative result: " + (vars.prequalification_status || "Not available"),
  "Documents received: " + String(vars.uploaded_document_count || 0),
  "Preferred contact time: " + (vars.preferred_contact_time || "Not available")
].join("\\n");
return "success";
`;

const advisorSlotsScript = `
${arrayReaderBlock}
function formatTimeLabel(timeValue) {
  const match = String(timeValue || "").match(/^(\\d{1,2}):(\\d{2})$/);
  if (!match) return String(timeValue || "");
  const hour24 = Number(match[1]);
  const minutes = match[2];
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  const suffix = hour24 >= 12 ? "PM" : "AM";
  return String(hour12) + ":" + minutes + " " + suffix;
}
const rows = getRows(vars.advisor_slot_list_result);
const preferredCity = String(vars.property_city || vars.customer_city || "").trim().toLowerCase();
const preferredLanguage = String(vars.preferred_language || "").trim().toLowerCase();
const filtered = rows.filter((row) => String(row?.status || "").trim().toLowerCase() === "available")
  .filter((row) => String(row?.product_code || "").trim().toLowerCase() === String(vars.loan_type || "").trim().toLowerCase())
  .filter((row) => {
    if (!preferredCity) return true;
    return String(row?.city || "").trim().toLowerCase() === preferredCity;
  });
const prioritized = filtered.length ? filtered : rows.filter((row) => String(row?.status || "").trim().toLowerCase() === "available");
const slots = prioritized
  .sort((a, b) => String(a.date || "").localeCompare(String(b.date || "")) || String(a.start || "").localeCompare(String(b.start || "")))
  .slice(0, 8)
  .map((row) => ({
    slot_id: row.slot_id,
    date: row.date,
    start_time: row.start,
    end_time: row.end,
    label: (row.label || (row.date + " " + formatTimeLabel(row.start))) + (preferredLanguage && String(row.advisor_language || "").trim().toLowerCase() === preferredLanguage ? " • Preferred language" : "")
  }));
vars.advisor_slot_options = { data: slots };
vars.advisor_slot_state = slots.length ? "available" : "unavailable";
return "success";
`;

const appointmentPreparationScript = `
${arrayReaderBlock}
const booking = vars.advisor_appointment_booking && typeof vars.advisor_appointment_booking === "object" && !Array.isArray(vars.advisor_appointment_booking)
  ? vars.advisor_appointment_booking
  : {};
const slotId = String(booking.slotId || booking.slot_id || "").trim();
const rows = getRows(vars.advisor_slot_list_result);
const row = rows.find((item) => String(item?.slot_id || "") === slotId);
if (!slotId || !row) {
  throw new Error("missing advisor appointment selection");
}
vars.selected_slot_id = row.slot_id || slotId;
vars.selected_slot_date = row.date || booking.date || "";
vars.selected_slot_time = row.start || booking.startTime || booking.start_time || "";
vars.selected_slot_end = row.end || booking.endTime || booking.end_time || "";
vars.selected_slot_label = row.label || booking.slotLabel || booking.slot_label || "";
vars.assigned_advisor_id = row.advisor_id || "";
vars.assigned_advisor_name = row.advisor_name || "";
vars.assigned_advisor_language = row.advisor_language || "";
vars.appointment_datetime = vars.selected_slot_date + "T" + vars.selected_slot_time + ":00+05:30";
vars.hold_expires_at = "2026-08-25T12:05:00.000Z";
vars.lead_status = "advisor_booked";
return "success";
`;

const statusSelectionScript = `
${arrayReaderBlock}
const customer = firstRow(vars.status_customer_find_result);
const leadRows = getRows(vars.status_lead_list_result);
if (!customer || !customer.customer_id) {
  vars.status_lookup_state = "customer_not_found";
  return "success";
}
const row = leadRows.find((item) => String(item?.lead_id || "") === String(customer.latest_active_lead_id || ""))
  || leadRows[0]
  || null;
if (!row) {
  vars.status_lookup_state = "lead_not_found";
  return "success";
}
vars.status_lookup_state = "selected";
vars.status_customer_name = customer.full_name || "";
vars.status_selected_lead_id = row.lead_id || "";
vars.status_selected_lead_number = row.lead_number || "";
vars.status_selected_product_name = row.product_name || titleCase(row.product_code || "");
vars.status_selected_lead_status = row.lead_status || "";
vars.status_selected_amount = row.requested_amount_display || formatMoneyMinor(row.requested_amount_minor || 0);
return "success";
`;

const statusTimelineScript = `
${arrayReaderBlock}
const rows = getRows(vars.status_history_list_result)
  .sort((a, b) => String(a.created_at || "").localeCompare(String(b.created_at || "")));
const timeline = rows.map((row) => {
  return [
    row.created_at || "",
    "→",
    row.to_status || "",
    row.customer_message || ""
  ].filter(Boolean).join(" ");
}).join("\\n");
vars.status_timeline_text = [
  "📊 Loan Request Status",
  "",
  "Reference: " + (vars.status_selected_lead_number || ""),
  "Customer: " + (vars.status_customer_name || ""),
  "Product: " + (vars.status_selected_product_name || ""),
  "Requested amount: " + (vars.status_selected_amount || ""),
  "Current status: " + (vars.status_selected_lead_status || ""),
  "",
  timeline || "No status events were found yet."
].join("\\n");
return "success";
`;

node("start_1", "start", 0, 0, { messages: [] });
node("set_defaults", "setVariable", 240, 0, setVars({
  entry_action: "new_enquiry",
  requested_amount_minor: 0,
  uploaded_document_count: 0
}));
node("welcome_message", "message", 480, 0, msgData(
  "👋 Welcome!\n\nI can help you explore loan options, understand general eligibility requirements, prepare required documents, check an existing request, and schedule a discussion with a loan advisor.\n\nWhat would you like help with?"
));
node("main_menu_input", "input", 720, 0, inputData(
  "Choose an option or type your loan requirement directly.",
  "main_menu_choice",
  mainMenuButtons()
));

node("route_home_loan", "setVariable", 960, -240, setVars({ loan_type: "home_loan", entry_action: "new_enquiry" }));
node("route_personal_loan", "setVariable", 960, -120, setVars({ loan_type: "personal_loan", entry_action: "new_enquiry" }));
node("route_business_loan", "setVariable", 960, 0, setVars({ loan_type: "business_loan", entry_action: "new_enquiry" }));
node("route_docs", "setVariable", 960, 120, setVars({ entry_action: "documents_only" }));
node("route_status", "setVariable", 960, 240, setVars({ entry_action: "status_lookup" }));
node("route_book_advisor", "setVariable", 960, 360, setVars({ entry_action: "book_advisor" }));
node("route_talk_to_advisor", "setVariable", 960, 480, setVars({ entry_action: "talk_to_advisor" }));
node("faq_message", "message", 1200, 600, msgData(
  "I can answer general loan process questions, but final eligibility, pricing, approval, exceptions, and document verification are handled only by the authorised lending team."
));
node("advisor_handover_form", "form", 1200, 480, formData(
  "Share your name, mobile number, and the loan requirement so I can connect you with an advisor.",
  [
    { key: "customer_name", label: "Full name", type: "text", required: true },
    { key: "customer_mobile", label: "Mobile number", type: "phone", required: true },
    { key: "loan_requirement_summary", label: "Requirement summary", type: "textarea", required: true }
  ],
  "advisor_handover_form_result"
));
node("advisor_handover", "handover", 1440, 480, {
  channel: "human",
  messages: ["Connecting you to a loan advisor with your requirement context."]
});

node("docs_loan_type_input", "input", 1200, 120, inputData(
  "Select the loan type to view the usual document checklist.",
  "docs_loan_type",
  loanTypeButtons()
));
node("docs_employment_input", "input", 1440, 120, inputData(
  "Select your employment type.",
  "employment_type",
  [
    { label: "Salaried", value: "salaried" },
    { label: "Self-employed", value: "self_employed" },
    { label: "Business", value: "business" }
  ]
));
node("docs_type_sync", "setVariable", 1680, 120, setVars({ loan_type: "{{docs_loan_type}}" }));
node("document_rule_list_docs", "record", 1920, 120, recordData({
  action: "list",
  collection: "loan_document_rules",
  where: { product_code: "{{loan_type}}" },
  schema: schemas.documentRules,
  outputVar: "document_rule_list_result",
  limit: 20,
  sortBy: "display_order",
  sortOrder: "asc"
}));
node("document_checklist_script_docs", "script", 2160, 120, scriptData(documentChecklistScript, "document_checklist_result_docs"));
node("document_checklist_message_docs", "message", 2400, 120, msgData(
  "📄 Documents normally required\n\n{{required_document_summary}}\n\nYour advisor will confirm the exact documents required for your case."
));
node("document_checklist_end_docs", "end", 2640, 120, { messages: [] });

node("requirement_input", "input", 1200, 0, inputData(
  "Tell me the loan type and approximate requirement. Example: I need a home loan around 40 lakhs.",
  "customer_requirement_text"
));
node("parse_requirement", "script", 1440, 0, scriptData(parseRequirementScript, "parse_requirement_result"));
node("loan_type_switch", "switch", 1680, 0, switchData("loan_type_route"));
node("loan_type_input", "input", 1920, 0, inputData(
  "Which type of loan are you interested in?",
  "loan_type",
  loanTypeButtons()
));
node("product_find", "record", 2160, -120, recordData({
  action: "find",
  collection: "loan_products",
  where: { product_code: "{{loan_type}}" },
  schema: schemas.products,
  uniqueKey: "product_code",
  outputVar: "product_find_result"
}));
node("product_explanation_message", "message", 2400, -120, msgData(
  "{{product_find_result.data.product_name}}\n\n{{product_find_result.data.description}}\n\nActual loan amount, pricing, tenure, documentation, and approval depend on lender policy, financial assessment, verification, and authorised review."
));
node("mobile_form", "form", 2640, -120, formData(
  "To continue, please enter your mobile number.",
  [{ key: "customer_mobile", label: "Mobile number", type: "phone", required: true }],
  "mobile_form_result"
));
node("mobile_otp_input", "input", 2880, -120, inputData(
  "Enter the 6-digit OTP sent to your mobile number.",
  "customer_mobile_otp"
));
node("mobile_otp_validate", "script", 3120, -120, scriptData(
  'const otp = String(vars.customer_mobile_otp || "").trim(); vars.customer_mobile_otp_route = /^\\d{6}$/.test(otp) ? "valid" : "retry"; return "success";',
  "mobile_otp_validate_result"
));
node("mobile_otp_route", "switch", 3360, -120, switchData("customer_mobile_otp_route"));
node("mobile_otp_invalid_message_1", "message", 3600, -220, msgData("That OTP format is invalid. Please enter a 6-digit OTP."));
node("mobile_otp_input_2", "input", 3840, -220, inputData("Enter the 6-digit OTP again.", "customer_mobile_otp"));
node("mobile_otp_validate_2", "script", 4080, -220, scriptData(
  'const otp = String(vars.customer_mobile_otp || "").trim(); vars.customer_mobile_otp_route = /^\\d{6}$/.test(otp) ? "valid" : "retry"; return "success";',
  "mobile_otp_validate_2_result"
));
node("mobile_otp_route_2", "switch", 4320, -220, switchData("customer_mobile_otp_route"));
node("mobile_otp_invalid_message_2", "message", 4560, -320, msgData("That OTP format is still invalid. Please try one final time with a 6-digit OTP."));
node("mobile_otp_input_3", "input", 4800, -320, inputData("Enter the 6-digit OTP one final time.", "customer_mobile_otp"));
node("mobile_otp_validate_3", "script", 5040, -320, scriptData(
  'const otp = String(vars.customer_mobile_otp || "").trim(); vars.customer_mobile_otp_route = /^\\d{6}$/.test(otp) ? "valid" : "max_exceeded"; return "success";',
  "mobile_otp_validate_3_result"
));
node("mobile_otp_route_3", "switch", 5280, -320, switchData("customer_mobile_otp_route"));
node("mobile_otp_failed_message", "message", 5520, -420, msgData("Maximum OTP attempts exceeded. Please start a new chat to try again."));
node("mobile_otp_failed_end", "end", 5760, -420, { messages: [] });

node("customer_find", "record", 3600, -40, recordData({
  action: "find",
  collection: "loan_customers",
  where: { phone_e164: "{{customer_mobile}}" },
  schema: schemas.customers,
  uniqueKey: "phone_e164",
  outputVar: "customer_find_result"
}));
node("existing_lead_list", "record", 3840, -40, recordData({
  action: "list",
  collection: "loan_leads",
  where: { customer_mobile: "{{customer_mobile}}" },
  schema: schemas.leads,
  outputVar: "existing_lead_list_result",
  limit: 10,
  sortBy: "updated_at",
  sortOrder: "desc"
}));
node("existing_customer_hydrate", "script", 4080, -40, scriptData(existingCustomerHydrateScript, "existing_customer_hydrate_result"));
node("customer_lookup_switch", "switch", 4320, -40, switchData("customer_lookup_state"));
node("active_lead_message", "message", 4560, -160, msgData(
  "Welcome back, {{customer_name}}.\n\nYou already have an active {{active_lead_product_name}} enquiry.\n\nReference: {{active_lead_number}}\nAmount: {{active_lead_amount_display}}\nStatus: {{active_lead_status}}\n\nWould you like to view its status or start another enquiry?"
));
node("active_lead_options_input", "input", 4800, -160, inputData(
  "Choose how to continue.",
  "active_lead_choice",
  [
    { label: "View Status", value: "view_status" },
    { label: "Start Another", value: "start_new" }
  ]
));
node("status_history_list_inline", "record", 5040, -240, recordData({
  action: "list",
  collection: "loan_status_history",
  where: { lead_id: "{{active_lead_id}}" },
  schema: schemas.statusHistory,
  outputVar: "status_history_list_result",
  limit: 20,
  sortBy: "created_at",
  sortOrder: "asc"
}));
node("status_timeline_script_inline", "script", 5280, -240, scriptData(statusTimelineScript, "status_timeline_script_inline_result"));
node("status_message_inline", "message", 5520, -240, msgData("{{status_timeline_text}}"));
node("status_end_inline", "end", 5760, -240, { messages: [] });

node("returning_customer_message", "message", 4560, 0, msgData(
  "Welcome back, {{customer_name}}. I found your saved details and will continue with only the information needed for this loan enquiry."
));
node("new_customer_basic_form", "form", 4560, 120, formData(
  "Great. I need a few details to continue.",
  basicProfileFields,
  "new_customer_basic_form_result"
));
node("amount_known_switch", "switch", 4800, 40, switchData("requested_amount_route"));
node("requested_amount_form", "form", 5040, 120, formData(
  "What loan amount do you want to explore?",
  requestedAmountField,
  "requested_amount_form_result"
));
node("financial_profile_form", "form", 5280, 40, formData(
  "Share your income and employment profile for initial guidance.",
  financialProfileFields,
  "financial_profile_form_result"
));
node("requirement_meta_form", "form", 5520, 40, formData(
  "Tell me the remaining requirement details.",
  requirementMetaFields,
  "requirement_meta_form_result"
));
node("normalize_financial_inputs", "script", 5760, 40, scriptData(normalizeFinancialInputsScript, "normalize_financial_inputs_result"));

node("loan_type_profile_switch", "switch", 6000, 40, switchData("loan_type"));
node("home_loan_form", "form", 6240, -120, formData(
  "Share the home-loan-specific details.",
  homeLoanFields,
  "home_loan_form_result"
));
node("personal_loan_form", "form", 6240, 40, formData(
  "Share the personal-loan-specific details.",
  personalLoanFields,
  "personal_loan_form_result"
));
node("business_loan_form", "form", 6240, 200, formData(
  "Share the business-loan-specific details.",
  businessLoanFields,
  "business_loan_form_result"
));
node("prepare_identity", "script", 6480, 40, scriptData(prepareIdentityScript, "prepare_identity_result"));
node("customer_upsert", "record", 6720, 40, recordData({
  action: "upsert",
  collection: "loan_customers",
  where: { customer_id: "{{customer_id}}" },
  data: {
    customer_id: "{{customer_id}}",
    full_name: "{{customer_name}}",
    phone_e164: "{{customer_mobile}}",
    email: "{{customer_email}}",
    city: "{{customer_city}}",
    preferred_language: "{{preferred_language}}",
    latest_active_lead_id: "{{lead_id}}",
    latest_product_code: "{{loan_type}}",
    latest_status: "profile_in_progress"
  },
  schema: schemas.customers,
  uniqueKey: "customer_id",
  idempotencyKey: "{{customer_id}}",
  outputVar: "customer_upsert_result",
  piiFields: "phone_e164,email,full_name"
}));
node("lead_draft_record", "record", 6960, 40, recordData({
  action: "upsert",
  collection: "loan_leads",
  where: { lead_id: "{{lead_id}}" },
  data: {
    lead_id: "{{lead_id}}",
    lead_number: "{{lead_number}}",
    customer_id: "{{customer_id}}",
    customer_mobile: "{{customer_mobile}}",
    customer_name: "{{customer_name}}",
    customer_email: "{{customer_email}}",
    city: "{{customer_city}}",
    preferred_language: "{{preferred_language}}",
    product_code: "{{loan_type}}",
    product_name: "{{product_find_result.data.product_name}}",
    requested_amount_minor: "{{requested_amount_minor}}",
    requested_amount_display: "{{requested_amount_display}}",
    employment_type: "{{employment_type}}",
    monthly_income_minor: "{{monthly_income_minor}}",
    existing_monthly_emi_minor: "{{existing_monthly_emi_minor}}",
    preferred_tenure_years: "{{preferred_tenure_years}}",
    loan_purpose: "{{loan_purpose}}",
    preferred_contact_time: "{{preferred_contact_time}}",
    qualification_status: "profile_in_progress",
    lead_status: "profile_in_progress",
    lead_priority: "review",
    lead_score: 0,
    reason_codes: "",
    assigned_advisor_id: "",
    assigned_advisor_name: "",
    latest_appointment_id: "",
    source_channel: "{{source_channel}}",
    source_campaign: "website",
    conversation_summary: "",
    created_at: "{{created_at}}",
    updated_at: "{{updated_at}}"
  },
  schema: schemas.leads,
  uniqueKey: "lead_id",
  idempotencyKey: "{{lead_id}}:draft",
  outputVar: "lead_draft_record_result",
  piiFields: "customer_mobile,customer_email,customer_name"
}));
node("status_event_profile_record", "record", 7200, 40, recordData({
  action: "upsert",
  collection: "loan_status_history",
  where: { status_event_id: "{{lead_id}}:profile" },
  data: {
    status_event_id: "{{lead_id}}:profile",
    lead_id: "{{lead_id}}",
    lead_number: "{{lead_number}}",
    from_status: "",
    to_status: "profile_in_progress",
    customer_message: "Profile capture started",
    source: "assistant",
    created_at: "{{created_at}}"
  },
  schema: schemas.statusHistory,
  uniqueKey: "status_event_id",
  idempotencyKey: "{{lead_id}}:profile",
  outputVar: "status_event_profile_record_result"
}));

node("guideline_list", "record", 7440, 40, recordData({
  action: "list",
  collection: "loan_product_guidelines",
  where: { product_code: "{{loan_type}}" },
  schema: schemas.guidelines,
  outputVar: "guideline_list_result",
  limit: 10
}));
node("guideline_selection", "script", 7680, 40, scriptData(guidelineSelectionScript, "guideline_selection_result"));
node("prequalification_script", "script", 7920, 40, scriptData(prequalificationScript, "prequalification_script_result"));
node("prequalification_record", "record", 8160, 40, recordData({
  action: "upsert",
  collection: "loan_prequalification_runs",
  where: { run_id: "{{prequal_run_id}}" },
  data: {
    run_id: "{{prequal_run_id}}",
    lead_id: "{{lead_id}}",
    product_code: "{{loan_type}}",
    result: "{{prequalification_status}}",
    reason_codes: "{{reason_codes}}",
    summary_text: "{{prequalification_summary}}",
    created_at: "{{created_at}}"
  },
  schema: schemas.prequalificationRuns,
  uniqueKey: "run_id",
  idempotencyKey: "{{prequal_run_id}}",
  outputVar: "prequalification_record_result"
}));
node("prequalification_message", "message", 8400, 40, msgData(
  "{{prequalification_summary}}\n\nRequested amount: {{requested_amount_display}}\nEmployment: {{employment_type}}\nMonthly income: {{monthly_income_display}}"
));
node("document_rule_list", "record", 8640, 40, recordData({
  action: "list",
  collection: "loan_document_rules",
  where: { product_code: "{{loan_type}}" },
  schema: schemas.documentRules,
  outputVar: "document_rule_list_result",
  limit: 20,
  sortBy: "display_order",
  sortOrder: "asc"
}));
node("document_checklist_script", "script", 8880, 40, scriptData(documentChecklistScript, "document_checklist_script_result"));
node("document_checklist_message", "message", 9120, 40, msgData(
  "📄 Documents normally required\n\n{{required_document_summary}}\n\nWould you like to upload any available documents now?"
));
node("document_upload_choice", "input", 9360, 40, inputData(
  "You can upload now or continue and provide the documents later.",
  "upload_documents_now",
  yesNoButtons()
));
node("document_upload_intake", "document-intake", 9600, -40, {
  messages: ["Upload salary slips, bank statements, ID documents, or property files as PDF or images."],
  acceptedTypesCsv: "pdf,jpg,jpeg,png",
  maxFiles: 6,
  minFiles: 1,
  outputVar: "loan_document_files"
});
node("document_processor", "file-processor", 9840, -40, {
  inputFiles: "{{loan_document_files}}",
  processingMode: "extract_fields",
  acceptedTypesText: "pdf,jpg,jpeg,png",
  maxFileSizeMb: 15,
  expectedDocumentType: "loan_application_document",
  confidenceThreshold: 0.75,
  strictExtraction: false,
  pageMode: "process_all_pages",
  schemaJson: pretty({
    fields: {
      document_type: "string",
      applicant_name: "string",
      document_number: "string",
      employer_name: "string"
    }
  }),
  outputVar: "loan_document_processor_result"
});
node("document_result_script", "script", 10080, -40, scriptData(documentResultScript, "document_result_script_result"));
node("document_result_switch", "switch", 10320, -40, switchData("document_result_route"));
node("document_record", "record", 10560, -120, recordData({
  action: "upsert",
  collection: "loan_lead_documents",
  where: { lead_document_id: "{{lead_document_id}}" },
  data: {
    lead_document_id: "{{lead_document_id}}",
    lead_id: "{{lead_id}}",
    customer_id: "{{customer_id}}",
    uploaded_document_count: "{{uploaded_document_count}}",
    processing_status: "{{document_processing_status}}",
    verification_status: "{{document_verification_status}}",
    extraction_summary: "{{document_extraction_summary}}"
  },
  schema: schemas.leadDocuments,
  uniqueKey: "lead_document_id",
  idempotencyKey: "{{lead_document_id}}",
  outputVar: "document_record_result"
}));
node("document_manual_review_message", "message", 10560, -20, msgData(
  "We received the document, but some information could not be read reliably. Your advisor will review it during processing."
));
node("document_invalid_message", "message", 10560, 80, msgData(
  "This file could not be used. You can continue without it and provide the document to the advisor later."
));
node("document_skip_message", "message", 9600, 120, msgData(
  "No problem. I will continue with your enquiry and note that documents will be provided later."
));

node("lead_summary_script", "script", 10800, 40, scriptData(leadSummaryScript, "lead_summary_script_result"));
node("lead_profile_record", "record", 11040, 40, recordData({
  action: "upsert",
  collection: "loan_lead_profiles",
  where: { profile_id: "{{profile_id}}" },
  data: {
    profile_id: "{{profile_id}}",
    lead_id: "{{lead_id}}",
    product_code: "{{loan_type}}",
    property_value_minor: "{{property_value_minor}}",
    property_stage: "{{property_stage}}",
    property_type: "{{property_type}}",
    property_city: "{{property_city}}",
    co_applicant_available: "{{co_applicant_available}}",
    employer_category: "{{employer_category}}",
    work_experience_years: "{{work_experience_years}}",
    current_employer_tenure_years: "{{current_employer_tenure_years}}",
    business_type: "{{business_type}}",
    industry: "{{industry}}",
    business_vintage_years: "{{business_vintage_years}}",
    annual_turnover_minor: "{{annual_turnover_minor}}",
    profitability_range: "{{profitability_range}}",
    existing_business_loans: "{{existing_business_loans}}"
  },
  schema: schemas.leadProfiles,
  uniqueKey: "profile_id",
  idempotencyKey: "{{profile_id}}",
  outputVar: "lead_profile_record_result"
}));
node("lead_summary_message", "message", 11280, 40, msgData(
  "Lead reference: {{lead_number}}\n\n{{conversation_summary}}\n\nLead priority: {{lead_priority}} (score {{lead_score}})"
));
node("advisor_slot_list", "record", 11520, 40, recordData({
  action: "list",
  collection: "loan_advisor_slots",
  where: { product_code: "{{loan_type}}" },
  schema: schemas.advisorSlots,
  outputVar: "advisor_slot_list_result",
  limit: 20,
  sortBy: "date",
  sortOrder: "asc"
}));
node("advisor_slots_script", "script", 11760, 40, scriptData(advisorSlotsScript, "advisor_slots_script_result"));
node("advisor_slots_switch", "switch", 12000, 40, switchData("advisor_slot_state"));
node("advisor_slots_unavailable_message", "message", 12240, 140, msgData(
  "I could not find a suitable advisor slot right now. I will forward this enquiry so the team can propose the next available options."
));
node("advisor_slots_unavailable_handover", "handover", 12480, 140, {
  channel: "human",
  messages: ["Connecting the enquiry to loan operations for advisor scheduling."]
});
node("advisor_appointment", "appointment", 12240, 40, appointmentData(
  "📅 Choose a convenient time to speak with a loan advisor.",
  "advisor_slot_options",
  "advisor_appointment_booking"
));
node("appointment_prepare", "script", 12480, 40, scriptData(appointmentPreparationScript, "appointment_prepare_result"));
node("appointment_confirm_input", "input", 12720, 40, inputData(
  "Confirm your advisor consultation.\n\nAdvisor: {{assigned_advisor_name}}\nDate: {{selected_slot_date}}\nTime: {{selected_slot_label}}",
  "confirm_advisor_appointment",
  yesNoButtons()
));
node("appointment_cancelled_message", "message", 12960, 140, msgData(
  "No problem. Your lead is saved, and an advisor can still contact you using your preferred time."
));
node("appointment_cancelled_end", "end", 13200, 140, { messages: [] });
node("slot_hold_record", "record", 12960, 40, recordData({
  action: "upsert",
  collection: "loan_slot_holds",
  where: { hold_id: "{{hold_id}}" },
  data: {
    hold_id: "{{hold_id}}",
    slot_id: "{{selected_slot_id}}",
    lead_id: "{{lead_id}}",
    session_id: "{{system.sessionId}}",
    status: "active",
    expires_at: "{{hold_expires_at}}"
  },
  schema: schemas.slotHolds,
  uniqueKey: "hold_id",
  idempotencyKey: "{{hold_id}}",
  outputVar: "slot_hold_record_result"
}));
node("slot_held_record", "record", 13200, 40, recordData({
  action: "upsert",
  collection: "loan_advisor_slots",
  where: { slot_id: "{{selected_slot_id}}" },
  data: {
    slot_id: "{{selected_slot_id}}",
    advisor_id: "{{assigned_advisor_id}}",
    advisor_name: "{{assigned_advisor_name}}",
    advisor_language: "{{assigned_advisor_language}}",
    city: "{{customer_city}}",
    product_code: "{{loan_type}}",
    date: "{{selected_slot_date}}",
    start: "{{selected_slot_time}}",
    end: "{{selected_slot_end}}",
    label: "{{selected_slot_label}}",
    status: "held",
    hold_id: "{{hold_id}}",
    held_by_session: "{{system.sessionId}}",
    hold_expires_at: "{{hold_expires_at}}",
    appointment_id: "{{appointment_id}}"
  },
  schema: schemas.advisorSlots,
  uniqueKey: "slot_id",
  idempotencyKey: "{{selected_slot_id}}:held",
  outputVar: "slot_held_record_result"
}));
node("appointment_record", "record", 13440, 40, recordData({
  action: "upsert",
  collection: "loan_appointments",
  where: { appointment_id: "{{appointment_id}}" },
  data: {
    appointment_id: "{{appointment_id}}",
    appointment_number: "{{appointment_number}}",
    lead_id: "{{lead_id}}",
    customer_id: "{{customer_id}}",
    advisor_id: "{{assigned_advisor_id}}",
    advisor_name: "{{assigned_advisor_name}}",
    slot_id: "{{selected_slot_id}}",
    product_code: "{{loan_type}}",
    appointment_date: "{{selected_slot_date}}",
    appointment_time: "{{selected_slot_time}}",
    appointment_datetime: "{{appointment_datetime}}",
    status: "confirmed"
  },
  schema: schemas.appointments,
  uniqueKey: "appointment_id",
  idempotencyKey: "{{appointment_id}}",
  outputVar: "appointment_record_result"
}));
node("slot_booked_record", "record", 13680, 40, recordData({
  action: "upsert",
  collection: "loan_advisor_slots",
  where: { slot_id: "{{selected_slot_id}}" },
  data: {
    slot_id: "{{selected_slot_id}}",
    advisor_id: "{{assigned_advisor_id}}",
    advisor_name: "{{assigned_advisor_name}}",
    advisor_language: "{{assigned_advisor_language}}",
    city: "{{customer_city}}",
    product_code: "{{loan_type}}",
    date: "{{selected_slot_date}}",
    start: "{{selected_slot_time}}",
    end: "{{selected_slot_end}}",
    label: "{{selected_slot_label}}",
    status: "booked",
    hold_id: "{{hold_id}}",
    held_by_session: "{{system.sessionId}}",
    hold_expires_at: "{{hold_expires_at}}",
    appointment_id: "{{appointment_id}}"
  },
  schema: schemas.advisorSlots,
  uniqueKey: "slot_id",
  idempotencyKey: "{{selected_slot_id}}:booked",
  outputVar: "slot_booked_record_result"
}));
node("lead_final_record", "record", 13920, 40, recordData({
  action: "upsert",
  collection: "loan_leads",
  where: { lead_id: "{{lead_id}}" },
  data: {
    lead_id: "{{lead_id}}",
    lead_number: "{{lead_number}}",
    customer_id: "{{customer_id}}",
    customer_mobile: "{{customer_mobile}}",
    customer_name: "{{customer_name}}",
    customer_email: "{{customer_email}}",
    city: "{{customer_city}}",
    preferred_language: "{{preferred_language}}",
    product_code: "{{loan_type}}",
    product_name: "{{product_find_result.data.product_name}}",
    requested_amount_minor: "{{requested_amount_minor}}",
    requested_amount_display: "{{requested_amount_display}}",
    employment_type: "{{employment_type}}",
    monthly_income_minor: "{{monthly_income_minor}}",
    existing_monthly_emi_minor: "{{existing_monthly_emi_minor}}",
    preferred_tenure_years: "{{preferred_tenure_years}}",
    loan_purpose: "{{loan_purpose}}",
    preferred_contact_time: "{{preferred_contact_time}}",
    qualification_status: "{{qualification_status}}",
    lead_status: "{{lead_status}}",
    lead_priority: "{{lead_priority}}",
    lead_score: "{{lead_score}}",
    reason_codes: "{{reason_codes}}",
    assigned_advisor_id: "{{assigned_advisor_id}}",
    assigned_advisor_name: "{{assigned_advisor_name}}",
    latest_appointment_id: "{{appointment_id}}",
    source_channel: "{{source_channel}}",
    source_campaign: "website",
    conversation_summary: "{{conversation_summary}}",
    created_at: "{{created_at}}",
    updated_at: "{{updated_at}}"
  },
  schema: schemas.leads,
  uniqueKey: "lead_id",
  idempotencyKey: "{{lead_id}}:final",
  outputVar: "lead_final_record_result",
  piiFields: "customer_mobile,customer_email,customer_name"
}));
node("customer_final_record", "record", 14160, 40, recordData({
  action: "upsert",
  collection: "loan_customers",
  where: { customer_id: "{{customer_id}}" },
  data: {
    customer_id: "{{customer_id}}",
    full_name: "{{customer_name}}",
    phone_e164: "{{customer_mobile}}",
    email: "{{customer_email}}",
    city: "{{customer_city}}",
    preferred_language: "{{preferred_language}}",
    latest_active_lead_id: "{{lead_id}}",
    latest_product_code: "{{loan_type}}",
    latest_status: "{{lead_status}}"
  },
  schema: schemas.customers,
  uniqueKey: "customer_id",
  idempotencyKey: "{{customer_id}}:final",
  outputVar: "customer_final_record_result",
  piiFields: "phone_e164,email,full_name"
}));
node("status_event_booked_record", "record", 14400, 40, recordData({
  action: "upsert",
  collection: "loan_status_history",
  where: { status_event_id: "{{lead_id}}:advisor_booked" },
  data: {
    status_event_id: "{{lead_id}}:advisor_booked",
    lead_id: "{{lead_id}}",
    lead_number: "{{lead_number}}",
    from_status: "profile_in_progress",
    to_status: "advisor_booked",
    customer_message: "Advisor consultation confirmed",
    source: "assistant",
    created_at: "{{created_at}}"
  },
  schema: schemas.statusHistory,
  uniqueKey: "status_event_id",
  idempotencyKey: "{{lead_id}}:advisor_booked",
  outputVar: "status_event_booked_record_result"
}));
node("followup_24h_record", "record", 14640, 40, recordData({
  action: "upsert",
  collection: "loan_followup_jobs",
  where: { followup_id: "{{appointment_id}}:24h" },
  data: {
    followup_id: "{{appointment_id}}:24h",
    lead_id: "{{lead_id}}",
    appointment_id: "{{appointment_id}}",
    job_type: "appointment_reminder_24h",
    run_at: "{{appointment_datetime}}",
    channel: "whatsapp",
    status: "scheduled"
  },
  schema: schemas.followupJobs,
  uniqueKey: "followup_id",
  idempotencyKey: "{{appointment_id}}:24h",
  outputVar: "followup_24h_record_result"
}));
node("followup_1h_record", "record", 14880, 40, recordData({
  action: "upsert",
  collection: "loan_followup_jobs",
  where: { followup_id: "{{appointment_id}}:1h" },
  data: {
    followup_id: "{{appointment_id}}:1h",
    lead_id: "{{lead_id}}",
    appointment_id: "{{appointment_id}}",
    job_type: "appointment_reminder_1h",
    run_at: "{{appointment_datetime}}",
    channel: "whatsapp",
    status: "scheduled"
  },
  schema: schemas.followupJobs,
  uniqueKey: "followup_id",
  idempotencyKey: "{{appointment_id}}:1h",
  outputVar: "followup_1h_record_result"
}));
node("integration_outbox_record", "record", 15120, 40, recordData({
  action: "upsert",
  collection: "integration_outbox",
  where: { outbox_event_id: "{{lead_id}}:crm" },
  data: {
    outbox_event_id: "{{lead_id}}:crm",
    aggregate_type: "loan_lead",
    aggregate_id: "{{lead_id}}",
    event_type: "loan_lead.upsert",
    payload_summary: "{{lead_number}} | {{product_find_result.data.product_name}} | {{requested_amount_display}} | {{assigned_advisor_name}}",
    status: "pending",
    attempt_count: 0,
    next_attempt_at: "{{created_at}}"
  },
  schema: schemas.integrationOutbox,
  uniqueKey: "outbox_event_id",
  idempotencyKey: "{{lead_id}}:crm",
  outputVar: "integration_outbox_record_result"
}));
node("confirmation_notification", "notification", 15360, 40, notificationData({
  recipients: [
    {
      type: "customer",
      phone: "{{customer_mobile}}",
      email: "{{customer_email}}"
    }
  ],
  channels: [
    {
      type: "whatsapp",
      enabled: true,
      templateId: "loan_advisor_consultation_confirmed"
    },
    {
      type: "sms",
      enabled: true,
      message:
        "Loan advisor consultation confirmed. Ref {{lead_number}} with {{assigned_advisor_name}} on {{selected_slot_date}} at {{selected_slot_label}}."
    },
    {
      type: "email",
      enabled: true,
      subject: "Your loan advisor consultation is confirmed",
      body:
        "Reference: {{lead_number}}\\nLoan: {{product_find_result.data.product_name}}\\nRequested amount: {{requested_amount_display}}\\nAdvisor: {{assigned_advisor_name}}\\nDate: {{selected_slot_date}}\\nTime: {{selected_slot_label}}\\n\\nFinal eligibility, pricing, verification, and approval are determined only after authorised lending review."
    }
  ],
  outputVar: "confirmation_notification_result",
  dedupeKey: "{{lead_id}}:advisor_confirmation"
}));
node("reminder_scheduler_24h", "scheduler", 15600, 40, schedulerData({
  runAt: "{{appointment_datetime}}",
  offsetValue: 24,
  offsetUnit: "hours",
  offsetDirection: "before",
  payload: {
    type: "loan_advisor_reminder_24h",
    lead_id: "{{lead_id}}",
    appointment_id: "{{appointment_id}}"
  },
  outputVar: "reminder_scheduler_24h_result",
  dedupeKey: "{{appointment_id}}:scheduler:24h"
}));
node("reminder_scheduler_1h", "scheduler", 15840, 40, schedulerData({
  runAt: "{{appointment_datetime}}",
  offsetValue: 1,
  offsetUnit: "hours",
  offsetDirection: "before",
  payload: {
    type: "loan_advisor_reminder_1h",
    lead_id: "{{lead_id}}",
    appointment_id: "{{appointment_id}}"
  },
  outputVar: "reminder_scheduler_1h_result",
  dedupeKey: "{{appointment_id}}:scheduler:1h"
}));
node("final_confirmation_message", "message", 16080, 40, msgData(
  "✅ Your loan advisor consultation is confirmed\n\nReference: {{lead_number}}\nLoan: {{product_find_result.data.product_name}}\nRequested amount: {{requested_amount_display}}\nAdvisor: {{assigned_advisor_name}}\nDate: {{selected_slot_date}}\nTime: {{selected_slot_label}}\n\nWe saved the information you provided so the advisor can understand your requirement before the discussion. Final eligibility and approval are determined only after authorised lending review."
));
node("final_end", "end", 16320, 40, { messages: [] });

node("status_mobile_form", "form", 1200, 240, formData(
  "Enter the registered mobile number for the loan request.",
  [{ key: "status_lookup_mobile", label: "Mobile number", type: "phone", required: true }],
  "status_mobile_form_result"
));
node("status_otp_input", "input", 1440, 240, inputData(
  "Enter the 6-digit OTP sent to that mobile number.",
  "status_lookup_otp"
));
node("status_otp_validate", "script", 1680, 240, scriptData(
  'const otp = String(vars.status_lookup_otp || "").trim(); vars.status_lookup_otp_route = /^\\d{6}$/.test(otp) ? "valid" : "retry"; return "success";',
  "status_otp_validate_result"
));
node("status_otp_route", "switch", 1920, 240, switchData("status_lookup_otp_route"));
node("status_otp_invalid_message_1", "message", 2160, 160, msgData("That OTP format is invalid. Please enter a 6-digit OTP."));
node("status_otp_input_2", "input", 2400, 160, inputData("Enter the 6-digit OTP again.", "status_lookup_otp"));
node("status_otp_validate_2", "script", 2640, 160, scriptData(
  'const otp = String(vars.status_lookup_otp || "").trim(); vars.status_lookup_otp_route = /^\\d{6}$/.test(otp) ? "valid" : "retry"; return "success";',
  "status_otp_validate_2_result"
));
node("status_otp_route_2", "switch", 2880, 160, switchData("status_lookup_otp_route"));
node("status_otp_invalid_message_2", "message", 3120, 80, msgData("That OTP format is still invalid. Please try one final time with a 6-digit OTP."));
node("status_otp_input_3", "input", 3360, 80, inputData("Enter the 6-digit OTP one final time.", "status_lookup_otp"));
node("status_otp_validate_3", "script", 3600, 80, scriptData(
  'const otp = String(vars.status_lookup_otp || "").trim(); vars.status_lookup_otp_route = /^\\d{6}$/.test(otp) ? "valid" : "max_exceeded"; return "success";',
  "status_otp_validate_3_result"
));
node("status_otp_route_3", "switch", 3840, 80, switchData("status_lookup_otp_route"));
node("status_otp_failed_message", "message", 4080, 0, msgData("Maximum OTP attempts exceeded. Please start a new chat to try again."));
node("status_otp_failed_end", "end", 4320, 0, { messages: [] });
node("status_customer_find", "record", 2160, 320, recordData({
  action: "find",
  collection: "loan_customers",
  where: { phone_e164: "{{status_lookup_mobile}}" },
  schema: schemas.customers,
  uniqueKey: "phone_e164",
  outputVar: "status_customer_find_result"
}));
node("status_lead_list", "record", 2400, 320, recordData({
  action: "list",
  collection: "loan_leads",
  where: { customer_mobile: "{{status_lookup_mobile}}" },
  schema: schemas.leads,
  outputVar: "status_lead_list_result",
  limit: 10
}));
node("status_selection_script", "script", 2640, 320, scriptData(statusSelectionScript, "status_selection_script_result"));
node("status_selection_switch", "switch", 2880, 320, switchData("status_lookup_state"));
node("status_not_found_message", "message", 3120, 320, msgData("I could not find a saved loan request using those details."));
node("status_not_found_end", "end", 3360, 320, { messages: [] });
node("status_history_list", "record", 3120, 420, recordData({
  action: "list",
  collection: "loan_status_history",
  where: { lead_id: "{{status_selected_lead_id}}" },
  schema: schemas.statusHistory,
  outputVar: "status_history_list_result",
  limit: 20,
  sortBy: "created_at",
  sortOrder: "asc"
}));
node("status_timeline_script", "script", 3360, 420, scriptData(statusTimelineScript, "status_timeline_script_result"));
node("status_timeline_message", "message", 3600, 420, msgData("{{status_timeline_text}}"));
node("status_timeline_end", "end", 3840, 420, { messages: [] });

node("system_failure_message", "message", 8400, 260, msgData(
  "I could not complete that step because the operational data or persistence layer did not respond cleanly. I am forwarding the context so your enquiry is not lost."
));
node("system_failure_handover", "handover", 8640, 260, {
  channel: "human",
  messages: ["Connecting this enquiry to loan operations."]
});

edge("start_1", "set_defaults", { label: "next" });
edge("set_defaults", "welcome_message", { label: "next" });
edge("welcome_message", "main_menu_input", { label: "next" });
edgeValue("main_menu_input", "home_loan", "route_home_loan", "home_loan");
edgeValue("main_menu_input", "personal_loan", "route_personal_loan", "personal_loan");
edgeValue("main_menu_input", "business_loan", "route_business_loan", "business_loan");
edgeValue("main_menu_input", "documents_required", "route_docs", "documents_required");
edgeValue("main_menu_input", "request_status", "route_status", "request_status");
edgeValue("main_menu_input", "book_advisor", "route_book_advisor", "book_advisor");
edgeValue("main_menu_input", "talk_to_advisor", "route_talk_to_advisor", "talk_to_advisor");
edgeValue("main_menu_input", "loan_questions", "faq_message", "loan_questions");
edgeValue("main_menu_input", "check_eligibility", "requirement_input", "check_eligibility");
edge("main_menu_input", "requirement_input", { isDefault: true, label: "free_text/default" });

edge("route_home_loan", "product_find", { label: "next" });
edge("route_personal_loan", "product_find", { label: "next" });
edge("route_business_loan", "product_find", { label: "next" });
edge("faq_message", "requirement_input", { label: "next" });
edge("route_docs", "docs_loan_type_input", { label: "next" });
edge("docs_loan_type_input", "docs_employment_input", { label: "next" });
edge("docs_employment_input", "docs_type_sync", { label: "next" });
edge("docs_type_sync", "document_rule_list_docs", { label: "next" });
recordRoutes("document_rule_list_docs", "document_checklist_script_docs", "system_failure_message");
scriptRoutes("document_checklist_script_docs", "document_checklist_message_docs", "system_failure_message");
edge("document_checklist_message_docs", "document_checklist_end_docs", { label: "next" });

edge("route_status", "status_mobile_form", { label: "next" });
edge("route_book_advisor", "requirement_input", { label: "next" });
edge("route_talk_to_advisor", "advisor_handover_form", { label: "next" });
edge("advisor_handover_form", "advisor_handover", { label: "next" });

edge("requirement_input", "parse_requirement", { label: "next" });
scriptRoutes("parse_requirement", "loan_type_switch", "system_failure_message");
edgeValue("loan_type_switch", "known", "product_find", "known");
edge("loan_type_switch", "loan_type_input", { isDefault: true, label: "needs_selection/default" });
edge("loan_type_input", "product_find", { label: "next" });
recordRoutes("product_find", "product_explanation_message", "system_failure_message");
edge("product_explanation_message", "mobile_form", { label: "next" });
edge("mobile_form", "mobile_otp_input", { label: "next" });
edge("mobile_otp_input", "mobile_otp_validate", { label: "next" });
scriptRoutes("mobile_otp_validate", "mobile_otp_route", "system_failure_message");
edgeValue("mobile_otp_route", "valid", "customer_find", "valid");
edge("mobile_otp_route", "mobile_otp_invalid_message_1", { isDefault: true, label: "retry/default" });
edge("mobile_otp_invalid_message_1", "mobile_otp_input_2", { label: "next" });
edge("mobile_otp_input_2", "mobile_otp_validate_2", { label: "next" });
scriptRoutes("mobile_otp_validate_2", "mobile_otp_route_2", "system_failure_message");
edgeValue("mobile_otp_route_2", "valid", "customer_find", "valid");
edge("mobile_otp_route_2", "mobile_otp_invalid_message_2", { isDefault: true, label: "retry/default" });
edge("mobile_otp_invalid_message_2", "mobile_otp_input_3", { label: "next" });
edge("mobile_otp_input_3", "mobile_otp_validate_3", { label: "next" });
scriptRoutes("mobile_otp_validate_3", "mobile_otp_route_3", "system_failure_message");
edgeValue("mobile_otp_route_3", "valid", "customer_find", "valid");
edge("mobile_otp_route_3", "mobile_otp_failed_message", { isDefault: true, label: "max_exceeded/default" });
edge("mobile_otp_failed_message", "mobile_otp_failed_end", { label: "next" });

recordRoutes("customer_find", "existing_lead_list", "new_customer_basic_form", "existing_lead_list", "new_customer_basic_form");
recordRoutes("existing_lead_list", "existing_customer_hydrate", "system_failure_message");
scriptRoutes("existing_customer_hydrate", "customer_lookup_switch", "system_failure_message");
edgeValue("customer_lookup_switch", "active_lead", "active_lead_message", "active_lead");
edgeValue("customer_lookup_switch", "returning", "returning_customer_message", "returning");
edge("customer_lookup_switch", "new_customer_basic_form", { isDefault: true, label: "new/default" });
edge("active_lead_message", "active_lead_options_input", { label: "next" });
edgeValue("active_lead_options_input", "view_status", "status_history_list_inline", "view_status");
edge("active_lead_options_input", "amount_known_switch", { isDefault: true, label: "start_new/default" });
recordRoutes("status_history_list_inline", "status_timeline_script_inline", "system_failure_message");
scriptRoutes("status_timeline_script_inline", "status_message_inline", "system_failure_message");
edge("status_message_inline", "status_end_inline", { label: "next" });
edge("returning_customer_message", "amount_known_switch", { label: "next" });
edge("new_customer_basic_form", "amount_known_switch", { label: "next" });
edgeValue("amount_known_switch", "known", "financial_profile_form", "known");
edge("amount_known_switch", "requested_amount_form", { isDefault: true, label: "missing/default" });
edge("requested_amount_form", "financial_profile_form", { label: "next" });
edge("financial_profile_form", "requirement_meta_form", { label: "next" });
edge("requirement_meta_form", "normalize_financial_inputs", { label: "next" });
scriptRoutes("normalize_financial_inputs", "loan_type_profile_switch", "system_failure_message");
edgeValue("loan_type_profile_switch", "home_loan", "home_loan_form", "home_loan");
edgeValue("loan_type_profile_switch", "personal_loan", "personal_loan_form", "personal_loan");
edge("loan_type_profile_switch", "business_loan_form", { isDefault: true, label: "business_loan/default" });
edge("home_loan_form", "prepare_identity", { label: "next" });
edge("personal_loan_form", "prepare_identity", { label: "next" });
edge("business_loan_form", "prepare_identity", { label: "next" });
scriptRoutes("prepare_identity", "customer_upsert", "system_failure_message");
recordRoutes("customer_upsert", "lead_draft_record", "system_failure_message");
recordRoutes("lead_draft_record", "status_event_profile_record", "system_failure_message");
recordRoutes("status_event_profile_record", "guideline_list", "system_failure_message");
recordRoutes("guideline_list", "guideline_selection", "system_failure_message");
scriptRoutes("guideline_selection", "prequalification_script", "system_failure_message");
scriptRoutes("prequalification_script", "prequalification_record", "system_failure_message");
recordRoutes("prequalification_record", "prequalification_message", "system_failure_message");
edge("prequalification_message", "document_rule_list", { label: "next" });
recordRoutes("document_rule_list", "document_checklist_script", "system_failure_message");
scriptRoutes("document_checklist_script", "document_checklist_message", "system_failure_message");
edge("document_checklist_message", "document_upload_choice", { label: "next" });
edgeValue("document_upload_choice", "yes", "document_upload_intake", "yes");
edge("document_upload_choice", "document_skip_message", { isDefault: true, label: "no/default" });
edge("document_upload_intake", "document_processor", { label: "next" });
edge("document_processor", "document_result_script", { label: "next" });
scriptRoutes("document_result_script", "document_result_switch", "system_failure_message");
edgeValue("document_result_switch", "record", "document_record", "record");
edgeValue("document_result_switch", "manual_review", "document_manual_review_message", "manual_review");
edge("document_result_switch", "document_invalid_message", { isDefault: true, label: "invalid/default" });
recordRoutes("document_record", "lead_summary_script", "system_failure_message");
edge("document_manual_review_message", "lead_summary_script", { label: "next" });
edge("document_invalid_message", "lead_summary_script", { label: "next" });
edge("document_skip_message", "lead_summary_script", { label: "next" });
scriptRoutes("lead_summary_script", "lead_profile_record", "system_failure_message");
recordRoutes("lead_profile_record", "lead_summary_message", "system_failure_message");
edge("lead_summary_message", "advisor_slot_list", { label: "next" });
recordRoutes("advisor_slot_list", "advisor_slots_script", "system_failure_message");
scriptRoutes("advisor_slots_script", "advisor_slots_switch", "system_failure_message");
edgeValue("advisor_slots_switch", "available", "advisor_appointment", "available");
edge("advisor_slots_switch", "advisor_slots_unavailable_message", { isDefault: true, label: "unavailable/default" });
edge("advisor_slots_unavailable_message", "advisor_slots_unavailable_handover", { label: "next" });
edge("advisor_appointment", "appointment_prepare", { label: "selected" });
scriptRoutes("appointment_prepare", "appointment_confirm_input", "system_failure_message");
edgeValue("appointment_confirm_input", "yes", "slot_hold_record", "yes");
edge("appointment_confirm_input", "appointment_cancelled_message", { isDefault: true, label: "no/default" });
edge("appointment_cancelled_message", "appointment_cancelled_end", { label: "next" });
recordRoutes("slot_hold_record", "slot_held_record", "system_failure_message");
recordRoutes("slot_held_record", "appointment_record", "system_failure_message");
recordRoutes("appointment_record", "slot_booked_record", "system_failure_message");
recordRoutes("slot_booked_record", "lead_final_record", "system_failure_message");
recordRoutes("lead_final_record", "customer_final_record", "system_failure_message");
recordRoutes("customer_final_record", "status_event_booked_record", "system_failure_message");
recordRoutes("status_event_booked_record", "followup_24h_record", "system_failure_message");
recordRoutes("followup_24h_record", "followup_1h_record", "system_failure_message");
recordRoutes("followup_1h_record", "integration_outbox_record", "system_failure_message");
recordRoutes("integration_outbox_record", "confirmation_notification", "system_failure_message");
notificationRoutes("confirmation_notification", "reminder_scheduler_24h");
schedulerRoutes("reminder_scheduler_24h", "reminder_scheduler_1h");
schedulerRoutes("reminder_scheduler_1h", "final_confirmation_message");
edge("final_confirmation_message", "final_end", { label: "next" });

edge("status_mobile_form", "status_otp_input", { label: "next" });
edge("status_otp_input", "status_otp_validate", { label: "next" });
scriptRoutes("status_otp_validate", "status_otp_route", "system_failure_message");
edgeValue("status_otp_route", "valid", "status_customer_find", "valid");
edge("status_otp_route", "status_otp_invalid_message_1", { isDefault: true, label: "retry/default" });
edge("status_otp_invalid_message_1", "status_otp_input_2", { label: "next" });
edge("status_otp_input_2", "status_otp_validate_2", { label: "next" });
scriptRoutes("status_otp_validate_2", "status_otp_route_2", "system_failure_message");
edgeValue("status_otp_route_2", "valid", "status_customer_find", "valid");
edge("status_otp_route_2", "status_otp_invalid_message_2", { isDefault: true, label: "retry/default" });
edge("status_otp_invalid_message_2", "status_otp_input_3", { label: "next" });
edge("status_otp_input_3", "status_otp_validate_3", { label: "next" });
scriptRoutes("status_otp_validate_3", "status_otp_route_3", "system_failure_message");
edgeValue("status_otp_route_3", "valid", "status_customer_find", "valid");
edge("status_otp_route_3", "status_otp_failed_message", { isDefault: true, label: "max_exceeded/default" });
edge("status_otp_failed_message", "status_otp_failed_end", { label: "next" });
recordRoutes("status_customer_find", "status_lead_list", "status_not_found_message", "status_lead_list", "status_not_found_message");
recordRoutes("status_lead_list", "status_selection_script", "system_failure_message");
scriptRoutes("status_selection_script", "status_selection_switch", "system_failure_message");
edgeValue("status_selection_switch", "selected", "status_history_list", "selected");
edge("status_selection_switch", "status_not_found_message", { isDefault: true, label: "not_found/default" });
edge("status_not_found_message", "status_not_found_end", { label: "next" });
recordRoutes("status_history_list", "status_timeline_script", "system_failure_message");
scriptRoutes("status_timeline_script", "status_timeline_message", "system_failure_message");
edge("status_timeline_message", "status_timeline_end", { label: "next" });

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
