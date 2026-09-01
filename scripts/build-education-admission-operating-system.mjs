import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { notificationData } from "./notification-data.mjs";

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const domainRoot = join(rootDir, "domains", "education");
const sourcePath = join(
  domainRoot,
  "templates-source",
  "education-admission-operating-system.source.flow.json"
);
const builtPath = join(
  domainRoot,
  "templates",
  "education-admission-operating-system.flow.json"
);
const stablePath = join(
  domainRoot,
  "templates-stable",
  "education-admission-operating-system.flow.json"
);

const exportDoc = {
  version: "1.0",
  exportedAt: "2026-08-25T00:00:00.000Z",
  bot: {
    name: "Education Admission Operating System",
    description:
      "Automation-first school and college admission flow covering course discovery, eligibility, fees, application drafting, documents, visit or counsellor booking, application fee collection, reminders, and status tracking.",
    headerTitle: "Education Admission Operating System",
    headerTagline: "School and college admissions automation",
    globalVariables: [
      { key: "institution_name", value: "Northstar Academy" },
      { key: "institution_type", value: "school_or_college" },
      { key: "default_currency", value: "INR" },
      { key: "default_timezone", value: "Asia/Kolkata" },
      { key: "admissions_phone", value: "+91-90000-71000" },
      { key: "admissions_email", value: "admissions@example.edu" },
      { key: "transport_support_phone", value: "+91-90000-72000" },
      { key: "hostel_support_phone", value: "+91-90000-73000" }
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
const DOMAIN_RECORD_SCHEMA = "education";

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

function inputData(message, variable, buttons = [], disableChatInput = true) {
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

function appointmentData(message, dynamicSlotsVar, outputVar) {
  return {
    slots: [],
    slotsJson: "[]",
    messages: [message],
    slotMode: "dynamic",
    timezone: "{{default_timezone}}",
    outputVar,
    dynamicSlotsVar,
    dynamicSlotsPath: "data",
    dateVar: "selected_visit_date",
    horizonDays: 30,
    maxSlotsPerDay: 6,
    slotDurationMins: 45,
    slotIntervalMins: 30,
    availableWeekdays: "1,2,3,4,5,6",
    workingHoursStart: "09:00",
    workingHoursEnd: "18:00"
  };
}

function paymentData({ amount, description, outputVar }) {
  return {
    messages: [
      "Complete the application fee using the secure payment flow. I will continue only after the payment result is confirmed."
    ],
    amount,
    currency: "{{default_currency}}",
    provider: "razorpay",
    autoVerify: true,
    paymentLink: "",
    description,
    customerName: "{{applicant_name}}",
    customerEmail: "{{contact_email}}",
    customerContact: "{{contact_mobile}}",
    notifySms: true,
    notifyEmail: true,
    expireMinutes: 15,
    callbackUrl: "",
    notesJson: pretty({
      application_id: "{{application_id}}",
      program_name: "{{selected_program_name}}",
      campus_name: "{{selected_campus_name}}",
      channel: "{{system.channel}}"
    }),
    outputVar
  };
}

function switchData(variable) {
  return { variable };
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

const schemas = {
  guardians: pretty({
    collection: "guardians",
    fields: {
      guardian_id: { type: "string", required: true, unique: true },
      guardian_name: { type: "string", required: true },
      guardian_mobile: { type: "phone", required: true, unique: true },
      guardian_email: { type: "email", required: false },
      relationship: { type: "string", required: false },
      occupation: { type: "string", required: false },
      alternate_mobile: { type: "phone", required: false }
    }
  }),
  applicants: pretty({
    collection: "applicants",
    fields: {
      applicant_id: { type: "string", required: true, unique: true },
      applicant_name: { type: "string", required: true },
      applicant_mobile: { type: "phone", required: false },
      applicant_email: { type: "email", required: false },
      applicant_user_type: { type: "string", required: true },
      date_of_birth: { type: "string", required: false },
      gender: { type: "string", required: false },
      address_line: { type: "string", required: false },
      city: { type: "string", required: false },
      state: { type: "string", required: false },
      pin_code: { type: "string", required: false },
      current_class: { type: "string", required: false },
      desired_class: { type: "string", required: false },
      current_school: { type: "string", required: false },
      board_or_curriculum: { type: "string", required: false },
      highest_qualification: { type: "string", required: false },
      completion_year: { type: "string", required: false },
      percentage_or_cgpa: { type: "string", required: false },
      entrance_exam: { type: "string", required: false },
      entrance_score: { type: "string", required: false }
    }
  }),
  applicantGuardians: pretty({
    collection: "applicant_guardians",
    fields: {
      relation_id: { type: "string", required: true, unique: true },
      applicant_id: { type: "string", required: true },
      guardian_id: { type: "string", required: true },
      relationship: { type: "string", required: false },
      is_primary: { type: "boolean", required: true }
    }
  }),
  academicYears: pretty({
    collection: "academic_years",
    fields: {
      academic_year_id: { type: "string", required: true, unique: true },
      label: { type: "string", required: true },
      admission_open_from: { type: "string", required: false },
      admission_close_on: { type: "string", required: false },
      status: { type: "string", required: true }
    }
  }),
  campuses: pretty({
    collection: "campuses",
    fields: {
      campus_id: { type: "string", required: true, unique: true },
      campus_name: { type: "string", required: true },
      city: { type: "string", required: false },
      summary: { type: "string", required: false },
      active: { type: "boolean", required: true }
    }
  }),
  programOfferings: pretty({
    collection: "program_offerings",
    fields: {
      program_offering_id: { type: "string", required: true, unique: true },
      academic_year_id: { type: "string", required: true },
      campus_id: { type: "string", required: true },
      program_name: { type: "string", required: true },
      duration_label: { type: "string", required: false },
      level: { type: "string", required: false },
      eligibility_summary: { type: "string", required: false },
      application_fee_amount_minor: { type: "number", required: false },
      admission_status: { type: "string", required: true }
    }
  }),
  admissionRules: pretty({
    collection: "admission_rules",
    fields: {
      rule_id: { type: "string", required: true, unique: true },
      program_offering_id: { type: "string", required: true },
      applicant_type: { type: "string", required: false },
      admission_open: { type: "boolean", required: true },
      age_min_years: { type: "number", required: false },
      age_max_years: { type: "number", required: false },
      minimum_percentage: { type: "number", required: false },
      required_qualification: { type: "string", required: false },
      required_subjects: { type: "string", required: false },
      notes: { type: "string", required: false }
    }
  }),
  feeStructures: pretty({
    collection: "fee_structures",
    fields: {
      fee_structure_id: { type: "string", required: true, unique: true },
      program_offering_id: { type: "string", required: true },
      academic_year_id: { type: "string", required: true },
      tuition_fee_minor: { type: "number", required: false },
      admission_fee_minor: { type: "number", required: false },
      academic_fee_minor: { type: "number", required: false },
      application_fee_amount_minor: { type: "number", required: false },
      currency: { type: "string", required: true }
    }
  }),
  scholarshipRules: pretty({
    collection: "scholarship_rules",
    fields: {
      scholarship_rule_id: { type: "string", required: true, unique: true },
      program_offering_id: { type: "string", required: true },
      scholarship_name: { type: "string", required: true },
      minimum_percentage: { type: "number", required: false },
      benefit_summary: { type: "string", required: false },
      status: { type: "string", required: true }
    }
  }),
  scholarshipAssessments: pretty({
    collection: "scholarship_assessments",
    fields: {
      assessment_id: { type: "string", required: true, unique: true },
      application_id: { type: "string", required: true },
      eligibility_status: { type: "string", required: true },
      assessment_summary: { type: "string", required: false }
    }
  }),
  documentRequirements: pretty({
    collection: "document_requirements",
    fields: {
      requirement_id: { type: "string", required: true, unique: true },
      program_offering_id: { type: "string", required: true },
      document_name: { type: "string", required: true },
      required: { type: "boolean", required: true },
      verification_method: { type: "string", required: false }
    }
  }),
  applications: pretty({
    collection: "applications",
    fields: {
      application_id: { type: "string", required: true, unique: true },
      application_number: { type: "string", required: true, unique: true },
      applicant_id: { type: "string", required: false },
      guardian_id: { type: "string", required: false },
      applicant_user_type: { type: "string", required: true },
      contact_mobile: { type: "phone", required: true },
      contact_email: { type: "email", required: false },
      student_name: { type: "string", required: false },
      guardian_name: { type: "string", required: false },
      academic_year_id: { type: "string", required: true },
      academic_year_label: { type: "string", required: false },
      campus_id: { type: "string", required: true },
      campus_name: { type: "string", required: false },
      program_offering_id: { type: "string", required: true },
      program_name: { type: "string", required: false },
      status: { type: "string", required: true },
      stage: { type: "string", required: true },
      eligibility_status: { type: "string", required: false },
      document_status: { type: "string", required: false },
      payment_status: { type: "string", required: false },
      application_fee_amount_minor: { type: "number", required: false },
      application_fee_display: { type: "string", required: false }
    }
  }),
  applicationDocuments: pretty({
    collection: "application_documents",
    fields: {
      application_document_id: { type: "string", required: true, unique: true },
      application_id: { type: "string", required: true },
      requirement_id: { type: "string", required: false },
      document_type: { type: "string", required: false },
      upload_status: { type: "string", required: true },
      processing_status: { type: "string", required: true },
      verification_status: { type: "string", required: true },
      extraction_status: { type: "string", required: false }
    }
  }),
  payments: pretty({
    collection: "application_payments",
    fields: {
      payment_id: { type: "string", required: true, unique: true },
      application_id: { type: "string", required: true },
      amount: { type: "number", required: true },
      currency: { type: "string", required: true },
      provider: { type: "string", required: true },
      provider_reference: { type: "string", required: false },
      purpose: { type: "string", required: true },
      status: { type: "string", required: true }
    }
  }),
  admissionSlots: pretty({
    collection: "admission_slots",
    fields: {
      slot_id: { type: "string", required: true, unique: true },
      campus_id: { type: "string", required: true },
      slot_type: { type: "string", required: true },
      date: { type: "string", required: true },
      start: { type: "string", required: true },
      end: { type: "string", required: false },
      label: { type: "string", required: true },
      status: { type: "string", required: true }
    }
  }),
  admissionAppointments: pretty({
    collection: "admission_appointments",
    fields: {
      appointment_id: { type: "string", required: true, unique: true },
      application_id: { type: "string", required: true },
      slot_id: { type: "string", required: true },
      appointment_type: { type: "string", required: true },
      status: { type: "string", required: true },
      scheduled_start_at: { type: "string", required: false },
      scheduled_end_at: { type: "string", required: false }
    }
  }),
  applicationStatusHistory: pretty({
    collection: "application_status_history",
    fields: {
      history_id: { type: "string", required: true, unique: true },
      application_id: { type: "string", required: true },
      from_status: { type: "string", required: false },
      to_status: { type: "string", required: true },
      reason_code: { type: "string", required: false }
    }
  })
};

const mainMenuButtons = [
  { label: "🎓 Start Admission", value: "start_admission" },
  { label: "📚 Courses / Classes", value: "courses_classes" },
  { label: "✅ Check Eligibility", value: "check_eligibility" },
  { label: "💰 Fees & Scholarships", value: "fees_scholarships" },
  { label: "📝 Continue Application", value: "continue_application" },
  { label: "📄 Upload Documents", value: "upload_documents" },
  { label: "🏫 Book Campus Visit", value: "book_campus_visit" },
  { label: "👨‍🏫 Book Counsellor Call", value: "book_counsellor_call" },
  { label: "🔎 Application Status", value: "application_status" },
  { label: "🚌 Transport / Hostel", value: "transport_hostel" },
  { label: "📅 Admission Dates", value: "admission_dates" },
  { label: "❓ Ask a Question", value: "ask_question" },
  { label: "👨‍💼 Talk to Admissions Team", value: "talk_to_admissions" }
];

const arrayReaderBlock = `
function getRows(raw) {
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.records)) return raw.records;
  if (Array.isArray(raw?.data)) return raw.data;
  if (Array.isArray(raw?.items)) return raw.items;
  return [];
}
`;

function hydrateApplicationBlock(itemRef) {
  return `
vars.selected_application_id = ${itemRef}.application_number || ${itemRef}.application_id || "";
vars.application_id = vars.selected_application_id;
vars.selected_application_status = ${itemRef}.status || "";
vars.selected_document_status = ${itemRef}.document_status || "";
vars.selected_payment_status = ${itemRef}.payment_status || "";
vars.selected_program_offering_id = ${itemRef}.program_offering_id || vars.selected_program_offering_id || "";
vars.selected_program_name = ${itemRef}.program_name || vars.selected_program_name || "";
vars.selected_campus_id = ${itemRef}.campus_id || vars.selected_campus_id || "";
vars.selected_campus_name = ${itemRef}.campus_name || vars.selected_campus_name || "";
vars.selected_academic_year_id = ${itemRef}.academic_year_id || vars.selected_academic_year_id || "";
vars.selected_academic_year_label = ${itemRef}.academic_year_label || vars.selected_academic_year_label || "";
vars.selected_application_fee_amount_minor = Number(${itemRef}.application_fee_amount_minor || vars.selected_application_fee_amount_minor || 0);
vars.application_fee_display = ${itemRef}.application_fee_display || vars.application_fee_display || "";
vars.applicant_name = ${itemRef}.student_name || ${itemRef}.applicant_name || vars.applicant_name || "";
vars.guardian_name = ${itemRef}.guardian_name || vars.guardian_name || "";
vars.contact_mobile = ${itemRef}.contact_mobile || vars.contact_mobile || "";
vars.contact_email = ${itemRef}.contact_email || vars.contact_email || "";
`;
}

const existingApplicationSummaryScript = `
${arrayReaderBlock}
const rows = getRows(vars.existing_application_list_result);
if (!rows.length) {
  vars.existing_application_state = "not_found";
  vars.existing_application_options_text = "";
  return "success";
}
vars.existing_application_state = "found";
${hydrateApplicationBlock("rows[0]")}
vars.existing_application_options_text = rows
  .slice(0, 5)
  .map((item, index) => {
    const ref = item.application_number || item.application_id || "Application";
    const name = item.student_name || item.applicant_name || "Applicant";
    const stage = item.status || "draft";
    return String(index + 1) + ". " + ref + " | " + name + " | " + stage;
  })
  .join("\\n");
return "success";
`;

const academicYearOptionsScript = `
${arrayReaderBlock}
const rows = getRows(vars.academic_year_list_result);
if (!rows.length) {
  vars.academic_year_selection_state = "empty";
  vars.academic_year_options_text = "No active academic years are configured.";
  return "success";
}
vars.academic_year_selection_state = "ready";
vars.academic_year_options_text = rows
  .map((item, index) => String(index + 1) + ". " + (item.label || item.academic_year_label || item.academic_year_id))
  .join("\\n");
return "success";
`;

const academicYearChoiceScript = `
${arrayReaderBlock}
const rows = getRows(vars.academic_year_list_result);
const choice = Number(String(vars.academic_year_choice || "").trim());
if (!Number.isInteger(choice) || choice < 1 || choice > rows.length) {
  vars.academic_year_selection_state = "invalid";
  return "success";
}
const selected = rows[choice - 1];
vars.selected_academic_year_id = selected.academic_year_id || selected.id || "";
vars.selected_academic_year_label = selected.label || selected.academic_year_label || vars.selected_academic_year_id;
vars.academic_year_selection_state = "selected";
return "success";
`;

const campusOptionsScript = `
${arrayReaderBlock}
const rows = getRows(vars.campus_list_result);
if (!rows.length) {
  vars.campus_selection_state = "empty";
  vars.campus_options_text = "No active campuses are available for the selected year.";
  return "success";
}
vars.campus_selection_state = "ready";
vars.campus_options_text = rows
  .map((item, index) => {
    const line1 = String(index + 1) + ". " + (item.campus_name || item.name || item.campus_id);
    const line2 = [item.city, item.summary].filter(Boolean).join(" | ");
    return line2 ? line1 + " - " + line2 : line1;
  })
  .join("\\n");
return "success";
`;

const campusChoiceScript = `
${arrayReaderBlock}
const rows = getRows(vars.campus_list_result);
const choice = Number(String(vars.campus_choice || "").trim());
if (!Number.isInteger(choice) || choice < 1 || choice > rows.length) {
  vars.campus_selection_state = "invalid";
  return "success";
}
const selected = rows[choice - 1];
vars.selected_campus_id = selected.campus_id || selected.id || "";
vars.selected_campus_name = selected.campus_name || selected.name || vars.selected_campus_id;
vars.campus_selection_state = "selected";
return "success";
`;

const programOptionsScript = `
${arrayReaderBlock}
const rows = getRows(vars.program_offering_list_result);
if (!rows.length) {
  vars.program_selection_state = "empty";
  vars.program_options_text = "No open classes or programmes are available for this campus and academic year.";
  return "success";
}
vars.program_selection_state = "ready";
vars.program_options_text = rows
  .map((item, index) => {
    const title = String(index + 1) + ". " + (item.program_name || item.name || item.program_offering_id);
    const meta = [item.duration_label, item.level, item.admission_status].filter(Boolean).join(" | ");
    return meta ? title + " - " + meta : title;
  })
  .join("\\n");
return "success";
`;

const programChoiceScript = `
${arrayReaderBlock}
const rows = getRows(vars.program_offering_list_result);
const choice = Number(String(vars.program_choice || "").trim());
if (!Number.isInteger(choice) || choice < 1 || choice > rows.length) {
  vars.program_selection_state = "invalid";
  return "success";
}
const selected = rows[choice - 1];
vars.selected_program_offering_id = selected.program_offering_id || selected.id || "";
vars.selected_program_name = selected.program_name || selected.name || vars.selected_program_offering_id;
vars.program_selection_state = "selected";
return "success";
`;

const programContextScript = `
${arrayReaderBlock}
const offering = vars.program_offering_detail_result?.record || vars.program_offering_detail_result?.data || vars.program_offering_detail_result || {};
const rule = vars.admission_rule_result?.record || vars.admission_rule_result?.data || vars.admission_rule_result || {};
const fee = vars.fee_structure_result?.record || vars.fee_structure_result?.data || vars.fee_structure_result || {};
const requirements = getRows(vars.document_requirements_preview_result);
const applicationFeeMinor = Number(
  fee.application_fee_amount_minor ||
    offering.application_fee_amount_minor ||
    vars.selected_application_fee_amount_minor ||
    0
);
const formatMinor = (value) => {
  const amount = Number(value || 0) / 100;
  return "₹" + amount.toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
};
vars.selected_program_name = offering.program_name || vars.selected_program_name || "";
vars.selected_duration_label = offering.duration_label || offering.level || "";
vars.eligibility_summary =
  rule.notes ||
  offering.eligibility_summary ||
  rule.required_qualification ||
  "Eligibility is checked against maintained admission rules and final document verification.";
vars.selected_application_fee_amount_minor = applicationFeeMinor;
vars.application_fee_display = applicationFeeMinor ? formatMinor(applicationFeeMinor) : "Available from fee structure";
vars.required_document_summary = requirements.length
  ? requirements
      .map((item) => {
        const name = item.document_name || item.name || item.document_code || "Required document";
        return (item.required === false ? "Optional - " : "Required - ") + name;
      })
      .join("\\n")
  : "Required documents are loaded from institution-maintained records at runtime.";
return "success";
`;

const eligibilityCheckScript = `
const rule = vars.admission_rule_result?.record || vars.admission_rule_result?.data || vars.admission_rule_result || {};
const isSchoolFlow = String(vars.applicant_user_type || "") === "parent";
function getNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}
let status = "manual_review";
let reason = "The admission team should verify the record-backed rule outcome.";
if (isSchoolFlow) {
  const dobText = String(vars.date_of_birth || "").trim();
  const dob = dobText ? new Date(dobText) : null;
  const now = new Date("2026-08-25T00:00:00.000Z");
  const ageYears = dob instanceof Date && !Number.isNaN(dob.valueOf())
    ? (now - dob) / (365.25 * 24 * 60 * 60 * 1000)
    : null;
  const minAge = rule.age_min_years == null ? null : getNumber(rule.age_min_years);
  const maxAge = rule.age_max_years == null ? null : getNumber(rule.age_max_years);
  const admissionOpen = rule.admission_open !== false;
  if (admissionOpen && ageYears != null) {
    const minOk = minAge == null || ageYears >= minAge;
    const maxOk = maxAge == null || ageYears <= maxAge;
    status = minOk && maxOk ? "eligible" : "not_eligible";
    reason = minOk && maxOk
      ? "The applicant meets the maintained age and intake rule checks. Final admission still depends on document verification."
      : "The applicant does not meet the configured age window for this class or intake.";
  }
} else {
  const admissionOpen = rule.admission_open !== false;
  const marks = getNumber(vars.percentage_or_cgpa);
  const minPercentage = getNumber(rule.minimum_percentage);
  if (admissionOpen && marks > 0) {
    status = marks >= minPercentage ? "eligible" : "not_eligible";
    reason = marks >= minPercentage
      ? "The applicant meets the maintained qualification or marks rule. Final admission still depends on document verification."
      : "The provided academic score is below the configured minimum rule for this programme.";
  }
}
vars.eligibility_status = status;
vars.eligibility_reason = reason;
vars.applicant_name = vars.student_name || vars.applicant_name || "";
return "success";
`;

const scholarshipAssessmentScript = `
${arrayReaderBlock}
const rows = getRows(vars.scholarship_rules_list_result);
const score = Number(vars.scholarship_score || vars.percentage_or_cgpa || 0);
let matched = rows.find((item) => {
  const threshold = Number(item.minimum_percentage || 0);
  return threshold > 0 && score >= threshold;
});
if (!matched && rows.length) matched = rows[0];
vars.scholarship_assessment_status = matched ? "potentially_eligible" : "manual_review";
vars.scholarship_summary = matched
  ? "Potential scholarship match: " + (matched.scholarship_name || "Institution scholarship") + ". Final approval depends on verification."
  : "A scholarship case has been recorded for manual review because no automatic rule match was available.";
return "success";
`;

const createApplicationIdentityScript = `
const seed = String(vars.system?.sessionId || vars.system_session_id || vars.contact_mobile || "000000").replace(/[^A-Za-z0-9]/g, "").slice(-6) || "000000";
const year = "2026";
const applicationNumber = vars.selected_application_id || ("ADM-" + year + "-" + seed.toUpperCase());
vars.selected_application_id = applicationNumber;
vars.application_id = applicationNumber;
vars.application_status_value = vars.application_status_value || "draft";
vars.selected_application_status = vars.selected_application_status || "draft";
vars.selected_document_status = vars.selected_document_status || "documents_pending";
vars.selected_payment_status = vars.selected_payment_status || "pending";
return "success";
`;

const lookupApplicationSummaryScript = `
${arrayReaderBlock}
const rows = getRows(vars.lookup_application_list_result);
if (!rows.length) {
  vars.lookup_application_state = "not_found";
  vars.lookup_application_options_text = "";
  return "success";
}
if (rows.length === 1) {
  vars.lookup_application_state = "single";
  ${hydrateApplicationBlock("rows[0]")}
  return "success";
}
vars.lookup_application_state = "multiple";
vars.lookup_application_options_text = rows
  .slice(0, 8)
  .map((item, index) => {
    const ref = item.application_number || item.application_id || "Application";
    const name = item.student_name || item.applicant_name || "Applicant";
    const stage = item.status || "draft";
    return String(index + 1) + ". " + ref + " | " + name + " | " + stage;
  })
  .join("\\n");
return "success";
`;

const lookupApplicationChoiceScript = `
${arrayReaderBlock}
const rows = getRows(vars.lookup_application_list_result);
const choice = Number(String(vars.lookup_application_choice || "").trim());
if (!Number.isInteger(choice) || choice < 1 || choice > rows.length) {
  vars.lookup_application_state = "invalid_choice";
  return "success";
}
const selected = rows[choice - 1];
${hydrateApplicationBlock("selected")}
vars.lookup_application_state = "selected";
return "success";
`;

const resumeRouteScript = `
const status = String(vars.selected_application_status || "").toLowerCase();
const paymentStatus = String(vars.selected_payment_status || "").toLowerCase();
const documentStatus = String(vars.selected_document_status || "").toLowerCase();
let route = "profile";
if (
  status === "submitted" ||
  status === "shortlisted" ||
  status === "offer_issued" ||
  status === "admitted"
) {
  route = "status";
} else if (paymentStatus === "pending" || status === "payment_pending") {
  route = "payment";
} else if (
  documentStatus === "documents_pending" ||
  documentStatus === "missing" ||
  documentStatus === "needs_reupload" ||
  documentStatus === "manual_review"
) {
  route = "documents";
}
vars.resume_route = route;
return "success";
`;

const progressSummaryScript = `
const status = vars.selected_application_status || "draft";
const documentStatus = vars.selected_document_status || "documents_pending";
const paymentStatus = vars.selected_payment_status || "pending";
const steps = [
  status === "draft" ? "🔄 Application Started" : "✅ Application Started",
  ["profile_completed", "documents_pending", "documents_received", "payment_pending", "submitted", "shortlisted", "offer_issued", "admitted"].includes(status)
    ? "✅ Details Completed"
    : "⏳ Details Pending",
  ["documents_received", "payment_pending", "submitted", "shortlisted", "offer_issued", "admitted"].includes(status) || documentStatus === "documents_received"
    ? "✅ Documents Uploaded"
    : documentStatus === "manual_review"
      ? "🔄 Documents Under Review"
      : "⏳ Documents Pending",
  paymentStatus === "paid"
    ? "✅ Application Fee Paid"
    : paymentStatus === "pending"
      ? "⏳ Application Fee Pending"
      : "⏳ Application Fee Pending",
  status === "submitted" || status === "shortlisted" || status === "offer_issued" || status === "admitted"
    ? "🔄 Admission Review In Progress"
    : "⏳ Admission Review Pending"
];
vars.application_progress_text = [
  "Application ID: " + (vars.selected_application_id || "Draft"),
  "Applicant: " + (vars.applicant_name || "Pending"),
  "Programme: " + (vars.selected_program_name || "Pending"),
  "Campus: " + (vars.selected_campus_name || "Pending"),
  "Current Stage: " + status,
  "",
  "Progress",
  ...steps
].join("\\n");
return "success";
`;

const documentRequirementTextScript = `
${arrayReaderBlock}
const rows = getRows(vars.document_requirements_live_result);
vars.required_document_summary = rows.length
  ? rows
      .map((item) => {
        const name = item.document_name || item.document_code || "Required document";
        return (item.required === false ? "Optional - " : "Required - ") + name;
      })
      .join("\\n")
  : "No dynamic document requirements were returned. Use the maintained institution records in production.";
return "success";
`;

const documentResultScript = `
const status = String(vars.document_processing_result || "").toLowerCase();
let route = "ready";
let verificationStatus = "processing";
if (
  status === "low_confidence" ||
  status === "manual_review_required" ||
  status === "invalid_file" ||
  status === "failed"
) {
  route = "reupload";
  verificationStatus = "needs_reupload";
}
vars.document_result_route = route;
vars.document_verification_status = verificationStatus;
vars.selected_document_status = route === "ready" ? "documents_received" : "needs_reupload";
return "success";
`;

const documentRetryResultScript = `
const status = String(vars.document_retry_processing_result || "").toLowerCase();
vars.document_verification_status =
  status === "success" || status === "partial" ? "manual_review" : "manual_review";
vars.selected_document_status = "manual_review";
return "success";
`;

const slotNormalizerScript = `
${arrayReaderBlock}
const rows = getRows(vars.admission_slot_list_result);
const data = rows
  .filter((item) => String(item.status || "").toLowerCase() === "available")
  .map((item) => ({
    id: item.slot_id || item.id,
    slot_id: item.slot_id || item.id,
    date: item.date || "",
    start: item.start || "",
    end: item.end || "",
    label: item.label || [item.date, item.start].filter(Boolean).join(" ")
  }));
vars.available_admission_slots = { data };
vars.slot_inventory_state = data.length ? "available" : "no_slots";
vars.selected_slot_type_label =
  vars.selected_slot_type === "counsellor_call" ? "Counsellor Call" : "Campus Visit";
return "success";
`;

const selectedSlotScript = `
const raw = vars.admission_booking_selection;
const selected = raw?.selectedSlot || raw?.slot || raw || {};
vars.selected_slot_id = selected.slot_id || selected.id || "";
vars.selected_visit_date = selected.date || "";
vars.selected_visit_start = selected.start || "";
vars.selected_visit_end = selected.end || "";
vars.selected_visit_label = selected.label || [vars.selected_visit_date, vars.selected_visit_start].filter(Boolean).join(" ");
vars.selected_visit_datetime = [vars.selected_visit_date, vars.selected_visit_start].filter(Boolean).join(" ");
vars.appointment_selected = vars.selected_slot_id ? "yes" : "no";
return "success";
`;

node("start_1", "start", 120, 200, { messages: [] });
node(
  "set_defaults",
  "setVariable",
  360,
  200,
  setVars({
    service_context: "education_admission_operating_system",
    escalation_policy: "human_only_for_sensitive_exceptions_or_system_failure",
    admission_entry_mode: "",
    entry_requires_mobile: "no",
    lookup_action: "",
    applicant_user_type: "student",
    applicant_name: "",
    guardian_name: "",
    guardian_id: "",
    applicant_id: "",
    contact_mobile: "",
    contact_email: "",
    application_id: "",
    selected_application_id: "",
    selected_application_status: "",
    selected_document_status: "documents_pending",
    selected_payment_status: "pending",
    application_status_value: "",
    selected_academic_year_id: "",
    selected_academic_year_label: "",
    selected_campus_id: "",
    selected_campus_name: "",
    selected_program_offering_id: "",
    selected_program_name: "",
    selected_duration_label: "",
    selected_application_fee_amount_minor: "0",
    application_fee_display: "",
    eligibility_status: "",
    eligibility_reason: "",
    required_document_summary: "",
    scholarship_summary: "",
    application_progress_text: "",
    selected_slot_type: "",
    selected_slot_type_label: "",
    selected_slot_id: "",
    selected_visit_date: "",
    selected_visit_start: "",
    selected_visit_end: "",
    selected_visit_label: "",
    selected_visit_datetime: "",
    appointment_selected: "no",
    document_verification_status: "processing",
    document_result_route: "ready"
  })
);
node(
  "welcome_message",
  "message",
  600,
  200,
  msgData(
    "👋 Welcome to {{institution_name}} Admissions.\n\nI can help you explore programmes, check eligibility, understand fees, continue an existing application, upload documents, book a campus visit, book a counsellor call, and track admission status."
  )
);
node(
  "main_menu_input",
  "input",
  840,
  200,
  inputData(
    "What would you like to do?\n\nYou can also type a direct question if you need institution-approved guidance.",
    "main_menu_choice",
    mainMenuButtons,
    false
  )
);

node("route_start_admission", "setVariable", 1080, 80, setVars({
  admission_entry_mode: "start_admission",
  entry_requires_mobile: "yes",
  lookup_action: ""
}));
node("route_courses", "setVariable", 1080, 140, setVars({
  admission_entry_mode: "courses_only",
  entry_requires_mobile: "no",
  lookup_action: ""
}));
node("route_eligibility", "setVariable", 1080, 200, setVars({
  admission_entry_mode: "eligibility_only",
  entry_requires_mobile: "no",
  lookup_action: ""
}));
node("route_fees", "setVariable", 1080, 260, setVars({
  admission_entry_mode: "fees_only",
  entry_requires_mobile: "no",
  lookup_action: ""
}));
node("route_continue", "setVariable", 1080, 320, setVars({
  lookup_action: "continue_application"
}));
node("route_upload_docs", "setVariable", 1080, 380, setVars({
  lookup_action: "upload_documents"
}));
node("route_book_visit", "setVariable", 1080, 440, setVars({
  lookup_action: "book_campus_visit",
  selected_slot_type: "campus_visit"
}));
node("route_book_counsellor", "setVariable", 1080, 500, setVars({
  lookup_action: "book_counsellor_call",
  selected_slot_type: "counsellor_call"
}));
node("route_status", "setVariable", 1080, 560, setVars({
  lookup_action: "application_status"
}));

node(
  "transport_hostel_message",
  "message",
  1320,
  620,
  msgData(
    "Transport and hostel information should be grounded from institution-maintained routes, pickup areas, hostel inventory, and approved policies.\n\nFor live deployments, connect this menu to those records or APIs before release.\n\nTransport help: {{transport_support_phone}}\nHostel help: {{hostel_support_phone}}"
  )
);
node("transport_hostel_end", "end", 1560, 620, { messages: [] });

node(
  "admission_dates_list",
  "record",
  1320,
  700,
  recordData({
    action: "list",
    collection: "academic_years",
    where: { status: "active" },
    schema: schemas.academicYears,
    outputVar: "admission_dates_list_result",
    limit: 10,
    sortBy: "admission_open_from",
    sortOrder: "asc"
  })
);
node(
  "admission_dates_script",
  "script",
  1560,
  700,
  scriptData(
    `
${arrayReaderBlock}
const rows = getRows(vars.admission_dates_list_result);
vars.admission_dates_text = rows.length
  ? rows
      .map((item) => {
        const label = item.label || item.academic_year_id || "Academic year";
        const open = item.admission_open_from || "Configured in DB";
        const close = item.admission_close_on || "Configured in DB";
        return label + ": Opens " + open + " | Closes " + close;
      })
      .join("\\n")
  : "No active admission cycles are configured.";
return "success";
`,
    "admission_dates_script_result"
  )
);
node(
  "admission_dates_message",
  "message",
  1800,
  700,
  msgData("Admission dates\\n\\n{{admission_dates_text}}")
);
node("admission_dates_end", "end", 2040, 700, { messages: [] });

node(
  "faq_input",
  "input",
  1320,
  780,
  inputData(
    "Ask your question about admissions, policies, transport, hostel, documents, fee guidance, or campus facilities.",
    "faq_question",
    [],
    false
  )
);
node(
  "faq_ai_grounded",
  "ai-grounded",
  1560,
  780,
  {
    contextTemplate:
      "Education admissions scope: courses and classes, programme availability, eligibility explanation from maintained rules, fees, scholarship guidance, application steps, required documents, campus visits, counsellor calls, transport, hostel, admission dates, and admissions-team escalation. Do not invent fees, seat availability, scholarship approval, deadlines, or eligibility exceptions.",
    inputTemplate: "{{faq_question}}",
    instructions:
      "Answer only with institution-approved admissions guidance. For live operational truth such as availability, fees, status, or deadlines, prefer maintained records. Escalate exception requests, disputes, and unsupported operational questions.",
    responseStyle: "concise",
    strictGrounding: true,
    includeCitations: false,
    includeCitationsInResponse: false,
    responseTemplate: "",
    fallbackResponseTemplate: "I should connect you to the admissions team for that request.",
    fallbackMessage: "I should connect you to the admissions team for that request.",
    outputVar: "faq_ai_result",
    answerVar: "faq_answer",
    answerKeyValueVar: "faq_answer_key",
    emitResponse: true
  }
);
node("faq_end", "end", 1800, 780, { messages: [] });

node(
  "talk_to_admissions_handover",
  "handover",
  1320,
  860,
  {
    channel: "human",
    messages: ["Connecting you to the admissions team with your conversation context."]
  }
);

node(
  "applicant_type_input",
  "input",
  1320,
  120,
  inputData(
    "Who is applying?",
    "applicant_user_type",
    [
      { label: "👨‍👩‍👧 Parent applying for child", value: "parent" },
      { label: "🎓 Student applying myself", value: "student" }
    ]
  )
);
node("entry_mobile_switch", "switch", 1560, 120, switchData("entry_requires_mobile"));
node(
  "contact_mobile_input",
  "input",
  1800,
  80,
  inputData(
    "Please enter the applicant or parent mobile number so I can check existing admission activity.",
    "contact_mobile",
    [],
    false
  )
);
node("contact_type_switch", "switch", 2040, 80, switchData("applicant_user_type"));
node(
  "guardian_find",
  "record",
  2280,
  20,
  recordData({
    action: "find",
    collection: "guardians",
    where: { guardian_mobile: "{{contact_mobile}}" },
    schema: schemas.guardians,
    outputVar: "guardian_find_result"
  })
);
node(
  "applicant_find",
  "record",
  2280,
  140,
  recordData({
    action: "find",
    collection: "applicants",
    where: { applicant_mobile: "{{contact_mobile}}" },
    schema: schemas.applicants,
    outputVar: "applicant_find_result"
  })
);
node(
  "contact_hydrate_script",
  "script",
  2520,
  80,
  scriptData(
    `
const guardian = vars.guardian_find_result?.record || vars.guardian_find_result?.data || vars.guardian_find_result || {};
const applicant = vars.applicant_find_result?.record || vars.applicant_find_result?.data || vars.applicant_find_result || {};
if (String(vars.applicant_user_type || "") === "parent" && guardian.guardian_id) {
  vars.guardian_id = guardian.guardian_id;
  vars.guardian_name = guardian.guardian_name || vars.guardian_name || "";
  vars.contact_email = guardian.guardian_email || vars.contact_email || "";
}
if (String(vars.applicant_user_type || "") === "student" && applicant.applicant_id) {
  vars.applicant_id = applicant.applicant_id;
  vars.applicant_name = applicant.applicant_name || vars.applicant_name || "";
  vars.contact_email = applicant.applicant_email || vars.contact_email || "";
}
return "success";
`,
    "contact_hydrate_result"
  )
);
node(
  "existing_application_list",
  "record",
  2760,
  80,
  recordData({
    action: "list",
    collection: "applications",
    where: { contact_mobile: "{{contact_mobile}}" },
    schema: schemas.applications,
    outputVar: "existing_application_list_result",
    limit: 8,
    sortBy: "updatedAt",
    sortOrder: "desc"
  })
);
node(
  "existing_application_summary_script",
  "script",
  3000,
  80,
  scriptData(existingApplicationSummaryScript, "existing_application_summary_result")
);
node("existing_application_state_switch", "switch", 3240, 80, switchData("existing_application_state"));
node(
  "welcome_back_message",
  "message",
  3480,
  20,
  msgData(
    "Welcome back 👋\n\nI found an existing application.\n\nApplication: {{selected_application_id}}\nProgramme: {{selected_program_name}}\nCampus: {{selected_campus_name}}\nCurrent Stage: {{selected_application_status}}\n\nWould you like to continue from where you stopped?"
  )
);
node(
  "existing_application_action_input",
  "input",
  3720,
  20,
  inputData(
    "Choose the next step.",
    "existing_application_action",
    [
      { label: "▶️ Continue Application", value: "continue_application" },
      { label: "🔎 View Status", value: "view_status" },
      { label: "➕ Start Another Application", value: "start_another_application" }
    ]
  )
);
node(
  "lookup_mobile_input",
  "input",
  1320,
  340,
  inputData(
    "Please enter the registered mobile number for the application.",
    "lookup_mobile",
    [],
    false
  )
);
node("copy_lookup_mobile", "setVariable", 1560, 340, setVars({
  contact_mobile: "{{lookup_mobile}}"
}));
node(
  "lookup_application_list",
  "record",
  1800,
  340,
  recordData({
    action: "list",
    collection: "applications",
    where: { contact_mobile: "{{contact_mobile}}" },
    schema: schemas.applications,
    outputVar: "lookup_application_list_result",
    limit: 8,
    sortBy: "updatedAt",
    sortOrder: "desc"
  })
);
node(
  "lookup_application_summary_script",
  "script",
  2040,
  340,
  scriptData(lookupApplicationSummaryScript, "lookup_application_summary_result")
);
node("lookup_application_state_switch", "switch", 2280, 340, switchData("lookup_application_state"));
node(
  "lookup_application_choice_input",
  "input",
  2520,
  340,
  inputData(
    "Multiple applications were found. Reply with the application number from this list.\n\n{{lookup_application_options_text}}",
    "lookup_application_choice",
    [],
    false
  )
);
node(
  "lookup_application_choice_script",
  "script",
  2760,
  340,
  scriptData(lookupApplicationChoiceScript, "lookup_application_choice_result")
);
node("lookup_application_choice_switch", "switch", 3000, 340, switchData("lookup_application_state"));
node(
  "no_application_message",
  "message",
  2520,
  420,
  msgData(
    "I could not find an active application for that mobile number. Start a fresh admission journey or let the admissions team help you reconcile the contact details."
  )
);
node("no_application_end", "end", 2760, 420, { messages: [] });
node("lookup_action_switch", "switch", 3240, 340, switchData("lookup_action"));
node(
  "progress_summary_script",
  "script",
  3480,
  340,
  scriptData(progressSummaryScript, "progress_summary_result")
);
node(
  "application_status_message",
  "message",
  3720,
  340,
  msgData("{{application_progress_text}}")
);
node("application_status_end", "end", 3960, 340, { messages: [] });
node(
  "resume_route_script",
  "script",
  3480,
  420,
  scriptData(resumeRouteScript, "resume_route_result")
);
node("resume_route_switch", "switch", 3720, 420, switchData("resume_route"));

node(
  "academic_year_list",
  "record",
  4200,
  120,
  recordData({
    action: "list",
    collection: "academic_years",
    where: { status: "active" },
    schema: schemas.academicYears,
    outputVar: "academic_year_list_result",
    limit: 10,
    sortBy: "admission_open_from",
    sortOrder: "asc"
  })
);
node(
  "academic_year_options_script",
  "script",
  4440,
  120,
  scriptData(academicYearOptionsScript, "academic_year_options_result")
);
node(
  "academic_year_choice_input",
  "input",
  4680,
  120,
  inputData(
    "Which academic year are you applying for?\n\n{{academic_year_options_text}}",
    "academic_year_choice",
    [],
    false
  )
);
node(
  "academic_year_choice_script",
  "script",
  4920,
  120,
  scriptData(academicYearChoiceScript, "academic_year_choice_result")
);
node("academic_year_state_switch", "switch", 5160, 120, switchData("academic_year_selection_state"));
node(
  "academic_year_invalid_message",
  "message",
  5400,
  40,
  msgData("That was not a valid academic year selection. Please restart the journey and choose one of the listed options.")
);
node("academic_year_invalid_end", "end", 5640, 40, { messages: [] });

node(
  "campus_list",
  "record",
  5400,
  120,
  recordData({
    action: "list",
    collection: "campuses",
    where: { active: true },
    schema: schemas.campuses,
    outputVar: "campus_list_result",
    limit: 20,
    sortBy: "campus_name",
    sortOrder: "asc"
  })
);
node(
  "campus_options_script",
  "script",
  5640,
  120,
  scriptData(campusOptionsScript, "campus_options_result")
);
node(
  "campus_choice_input",
  "input",
  5880,
  120,
  inputData(
    "Choose the campus or branch.\n\n{{campus_options_text}}",
    "campus_choice",
    [],
    false
  )
);
node(
  "campus_choice_script",
  "script",
  6120,
  120,
  scriptData(campusChoiceScript, "campus_choice_result")
);
node("campus_state_switch", "switch", 6360, 120, switchData("campus_selection_state"));
node(
  "campus_invalid_message",
  "message",
  6600,
  40,
  msgData("That was not a valid campus selection. Please restart and choose one of the listed campus options.")
);
node("campus_invalid_end", "end", 6840, 40, { messages: [] });

node(
  "program_offering_list",
  "record",
  6600,
  120,
  recordData({
    action: "list",
    collection: "program_offerings",
    where: {
      campus_id: "{{selected_campus_id}}",
      academic_year_id: "{{selected_academic_year_id}}",
      admission_status: "open"
    },
    schema: schemas.programOfferings,
    outputVar: "program_offering_list_result",
    limit: 30,
    sortBy: "program_name",
    sortOrder: "asc"
  })
);
node(
  "program_options_script",
  "script",
  6840,
  120,
  scriptData(programOptionsScript, "program_options_result")
);
node(
  "program_choice_input",
  "input",
  7080,
  120,
  inputData(
    "Choose the class or programme.\n\n{{program_options_text}}",
    "program_choice",
    [],
    false
  )
);
node(
  "program_choice_script",
  "script",
  7320,
  120,
  scriptData(programChoiceScript, "program_choice_result")
);
node("program_state_switch", "switch", 7560, 120, switchData("program_selection_state"));
node(
  "program_invalid_message",
  "message",
  7800,
  40,
  msgData("That was not a valid programme selection. Please restart and choose one of the listed classes or programmes.")
);
node("program_invalid_end", "end", 8040, 40, { messages: [] });

node(
  "program_offering_detail",
  "record",
  7800,
  120,
  recordData({
    action: "find",
    collection: "program_offerings",
    where: { program_offering_id: "{{selected_program_offering_id}}" },
    schema: schemas.programOfferings,
    outputVar: "program_offering_detail_result"
  })
);
node(
  "admission_rule_find",
  "record",
  8040,
  120,
  recordData({
    action: "find",
    collection: "admission_rules",
    where: { program_offering_id: "{{selected_program_offering_id}}" },
    schema: schemas.admissionRules,
    outputVar: "admission_rule_result"
  })
);
node(
  "fee_structure_find",
  "record",
  8280,
  120,
  recordData({
    action: "find",
    collection: "fee_structures",
    where: {
      program_offering_id: "{{selected_program_offering_id}}",
      academic_year_id: "{{selected_academic_year_id}}"
    },
    schema: schemas.feeStructures,
    outputVar: "fee_structure_result"
  })
);
node(
  "document_requirements_preview",
  "record",
  8520,
  120,
  recordData({
    action: "list",
    collection: "document_requirements",
    where: { program_offering_id: "{{selected_program_offering_id}}" },
    schema: schemas.documentRequirements,
    outputVar: "document_requirements_preview_result",
    limit: 20,
    sortBy: "document_name",
    sortOrder: "asc"
  })
);
node(
  "program_context_script",
  "script",
  8760,
  120,
  scriptData(programContextScript, "program_context_result")
);
node(
  "program_information_message",
  "message",
  9000,
  120,
  msgData(
    "{{selected_program_name}}\n\n📍 {{selected_campus_name}}\n⏱ {{selected_duration_label}}\n✅ Eligibility: {{eligibility_summary}}\n💳 Application Fee: {{application_fee_display}}\n\nI can now check eligibility, show the fee structure, list required documents, or continue the admission application."
  )
);
node("program_entry_mode_switch", "switch", 9240, 120, switchData("admission_entry_mode"));
node(
  "course_catalog_end_message",
  "message",
  9480,
  40,
  msgData(
    "This selection path is ready for course or class discovery. In production, keep programme availability, fees, and rules grounded from maintained records before publishing."
  )
);
node("course_catalog_end", "end", 9720, 40, { messages: [] });
node("eligibility_form_switch", "switch", 9480, 140, switchData("applicant_user_type"));
node(
  "program_action_input",
  "input",
  9480,
  240,
  inputData(
    "Choose the next step.",
    "program_action",
    [
      { label: "✅ Check My Eligibility", value: "check_eligibility" },
      { label: "💰 View Full Fees", value: "view_fees" },
      { label: "📄 View Required Documents", value: "view_documents" },
      { label: "📝 Continue Application", value: "continue_application" }
    ]
  )
);
node("program_action_switch", "switch", 9720, 240, switchData("program_action"));

node(
  "school_eligibility_form",
  "form",
  9960,
  120,
  formData(
    "Share the student details for the eligibility check.",
    [
      { key: "student_name", label: "Student full name", type: "text", required: true },
      { key: "date_of_birth", label: "Date of birth", type: "date", required: true },
      { key: "current_class", label: "Current class", type: "text", required: true },
      { key: "desired_class", label: "Desired class", type: "text", required: true },
      { key: "current_school", label: "Current or previous school", type: "text", required: false },
      { key: "board_or_curriculum", label: "Board or curriculum", type: "text", required: false }
    ],
    "school_eligibility_form_result"
  )
);
node(
  "college_eligibility_form",
  "form",
  9960,
  200,
  formData(
    "Share the academic details for the eligibility check.",
    [
      { key: "student_name", label: "Applicant full name", type: "text", required: true },
      { key: "highest_qualification", label: "Highest qualification", type: "text", required: true },
      { key: "board_or_curriculum", label: "Board or university", type: "text", required: false },
      { key: "completion_year", label: "Year of completion", type: "text", required: false },
      { key: "percentage_or_cgpa", label: "Percentage or CGPA", type: "text", required: true },
      { key: "entrance_exam", label: "Entrance exam", type: "text", required: false },
      { key: "entrance_score", label: "Entrance score", type: "text", required: false }
    ],
    "college_eligibility_form_result"
  )
);
node(
  "eligibility_check_script",
  "script",
  10200,
  160,
  scriptData(eligibilityCheckScript, "eligibility_check_result")
);
node(
  "eligibility_result_message",
  "message",
  10440,
  160,
  msgData(
    "Eligibility result: {{eligibility_status}}\n\n{{eligibility_reason}}"
  )
);
node(
  "eligibility_action_input",
  "input",
  10680,
  160,
  inputData(
    "Choose the next step.",
    "eligibility_action",
    [
      { label: "📝 Continue Application", value: "continue_application" },
      { label: "💰 View Fees", value: "view_fees" },
      { label: "👨‍🏫 Book Counsellor", value: "book_counsellor" }
    ]
  )
);
node("eligibility_action_switch", "switch", 10920, 160, switchData("eligibility_action"));

node(
  "fees_message",
  "message",
  9960,
  320,
  msgData(
    "Fee structure for {{selected_program_name}}\\n\\nApplication Fee: {{application_fee_display}}\\n\\nThe live deployment should load the full tuition, admission, academic, transport, hostel, and scholarship terms from maintained fee records rather than hardcoded copy."
  )
);
node(
  "fees_action_input",
  "input",
  10200,
  320,
  inputData(
    "Choose the next step.",
    "fees_action",
    [
      { label: "📝 Continue Application", value: "continue_application" },
      { label: "🎓 Check Scholarship", value: "check_scholarship" },
      { label: "🚌 Transport / Hostel", value: "transport_hostel" }
    ]
  )
);
node("fees_action_switch", "switch", 10440, 320, switchData("fees_action"));
node(
  "scholarship_rules_list",
  "record",
  10680,
  320,
  recordData({
    action: "list",
    collection: "scholarship_rules",
    where: { program_offering_id: "{{selected_program_offering_id}}" },
    schema: schemas.scholarshipRules,
    outputVar: "scholarship_rules_list_result",
    limit: 10,
    sortBy: "scholarship_name",
    sortOrder: "asc"
  })
);
node(
  "scholarship_form",
  "form",
  10920,
  320,
  formData(
    "Share the details needed for a preliminary scholarship check.",
    [
      { key: "scholarship_score", label: "Academic percentage or score", type: "text", required: true },
      { key: "scholarship_category", label: "Scholarship category if applicable", type: "text", required: false }
    ],
    "scholarship_form_result"
  )
);
node(
  "scholarship_script",
  "script",
  11160,
  320,
  scriptData(scholarshipAssessmentScript, "scholarship_script_result")
);
node(
  "scholarship_record",
  "record",
  11400,
  320,
  recordData({
    action: "upsert",
    collection: "scholarship_assessments",
    where: { assessment_id: "SCH-{{application_id}}" },
    data: {
      assessment_id: "SCH-{{application_id}}",
      application_id: "{{application_id}}",
      eligibility_status: "{{scholarship_assessment_status}}",
      assessment_summary: "{{scholarship_summary}}"
    },
    schema: schemas.scholarshipAssessments,
    uniqueKey: "assessment_id",
    idempotencyKey: "SCH-{{application_id}}",
    outputVar: "scholarship_record_result"
  })
);
node(
  "scholarship_message",
  "message",
  11640,
  320,
  msgData("{{scholarship_summary}}")
);

node(
  "required_documents_message",
  "message",
  9960,
  420,
  msgData(
    "Documents Required\\n\\n{{required_document_summary}}"
  )
);
node(
  "required_documents_action_input",
  "input",
  10200,
  420,
  inputData(
    "Choose the next step.",
    "documents_action",
    [
      { label: "📝 Continue Application", value: "continue_application" },
      { label: "👨‍🏫 Book Counsellor", value: "book_counsellor" }
    ]
  )
);
node("required_documents_action_switch", "switch", 10440, 420, switchData("documents_action"));

node(
  "set_counsellor_from_eligibility",
  "setVariable",
  11160,
  160,
  setVars({
    selected_slot_type: "counsellor_call"
  })
);
node(
  "set_counsellor_from_documents",
  "setVariable",
  10680,
  420,
  setVars({
    selected_slot_type: "counsellor_call"
  })
);

node(
  "create_application_identity",
  "script",
  11940,
  220,
  scriptData(createApplicationIdentityScript, "create_application_identity_result")
);
node(
  "application_draft_record",
  "record",
  12180,
  220,
  recordData({
    action: "upsert",
    collection: "applications",
    where: { application_id: "{{application_id}}" },
    data: {
      application_id: "{{application_id}}",
      application_number: "{{application_id}}",
      applicant_id: "{{applicant_id}}",
      guardian_id: "{{guardian_id}}",
      applicant_user_type: "{{applicant_user_type}}",
      contact_mobile: "{{contact_mobile}}",
      contact_email: "{{contact_email}}",
      student_name: "{{applicant_name}}",
      guardian_name: "{{guardian_name}}",
      academic_year_id: "{{selected_academic_year_id}}",
      academic_year_label: "{{selected_academic_year_label}}",
      campus_id: "{{selected_campus_id}}",
      campus_name: "{{selected_campus_name}}",
      program_offering_id: "{{selected_program_offering_id}}",
      program_name: "{{selected_program_name}}",
      status: "draft",
      stage: "draft",
      eligibility_status: "{{eligibility_status}}",
      document_status: "documents_pending",
      payment_status: "pending",
      application_fee_amount_minor: "{{selected_application_fee_amount_minor}}",
      application_fee_display: "{{application_fee_display}}"
    },
    schema: schemas.applications,
    uniqueKey: "application_id",
    idempotencyKey: "{{application_id}}:draft",
    outputVar: "application_draft_record_result"
  })
);
node(
  "status_history_draft_record",
  "record",
  12420,
  220,
  recordData({
    action: "upsert",
    collection: "application_status_history",
    where: { history_id: "{{application_id}}-draft" },
    data: {
      history_id: "{{application_id}}-draft",
      application_id: "{{application_id}}",
      from_status: "",
      to_status: "draft",
      reason_code: "draft_created"
    },
    schema: schemas.applicationStatusHistory,
    uniqueKey: "history_id",
    idempotencyKey: "{{application_id}}:status:draft",
    outputVar: "status_history_draft_record_result"
  })
);
node(
  "applicant_profile_form",
  "form",
  12660,
  220,
  formData(
    "Share the applicant profile details.",
    [
      { key: "student_name", label: "Student full name", type: "text", required: true },
      { key: "date_of_birth", label: "Date of birth", type: "date", required: false },
      { key: "gender", label: "Gender", type: "text", required: false },
      { key: "contact_email", label: "Email", type: "email", required: false },
      { key: "address_line", label: "Address", type: "text", required: false },
      { key: "city", label: "City", type: "text", required: false },
      { key: "state", label: "State", type: "text", required: false },
      { key: "pin_code", label: "PIN code", type: "text", required: false },
      { key: "current_school", label: "Current school or institution", type: "text", required: false },
      { key: "current_class", label: "Current class", type: "text", required: false },
      { key: "highest_qualification", label: "Highest qualification", type: "text", required: false },
      { key: "percentage_or_cgpa", label: "Percentage or CGPA", type: "text", required: false }
    ],
    "applicant_profile_form_result"
  )
);
node(
  "applicant_record",
  "record",
  12900,
  220,
  recordData({
    action: "upsert",
    collection: "applicants",
    where: { applicant_id: "APP-{{application_id}}" },
    data: {
      applicant_id: "APP-{{application_id}}",
      applicant_name: "{{student_name}}",
      applicant_mobile: "{{contact_mobile}}",
      applicant_email: "{{contact_email}}",
      applicant_user_type: "{{applicant_user_type}}",
      date_of_birth: "{{date_of_birth}}",
      gender: "{{gender}}",
      address_line: "{{address_line}}",
      city: "{{city}}",
      state: "{{state}}",
      pin_code: "{{pin_code}}",
      current_class: "{{current_class}}",
      desired_class: "{{desired_class}}",
      current_school: "{{current_school}}",
      board_or_curriculum: "{{board_or_curriculum}}",
      highest_qualification: "{{highest_qualification}}",
      completion_year: "{{completion_year}}",
      percentage_or_cgpa: "{{percentage_or_cgpa}}",
      entrance_exam: "{{entrance_exam}}",
      entrance_score: "{{entrance_score}}"
    },
    schema: schemas.applicants,
    uniqueKey: "applicant_id",
    idempotencyKey: "APP-{{application_id}}",
    outputVar: "applicant_record_result"
  })
);
node("guardian_needed_switch", "switch", 13140, 220, switchData("applicant_user_type"));
node(
  "guardian_form",
  "form",
  13380,
  160,
  formData(
    "Share the parent or guardian details.",
    [
      { key: "guardian_name", label: "Parent or guardian name", type: "text", required: true },
      { key: "relationship", label: "Relationship", type: "text", required: true },
      { key: "contact_mobile", label: "Mobile number", type: "phone", required: true },
      { key: "contact_email", label: "Email", type: "email", required: false },
      { key: "occupation", label: "Occupation", type: "text", required: false },
      { key: "alternate_mobile", label: "Alternate contact", type: "phone", required: false }
    ],
    "guardian_form_result"
  )
);
node(
  "guardian_record",
  "record",
  13620,
  160,
  recordData({
    action: "upsert",
    collection: "guardians",
    where: { guardian_id: "GRD-{{application_id}}" },
    data: {
      guardian_id: "GRD-{{application_id}}",
      guardian_name: "{{guardian_name}}",
      guardian_mobile: "{{contact_mobile}}",
      guardian_email: "{{contact_email}}",
      relationship: "{{relationship}}",
      occupation: "{{occupation}}",
      alternate_mobile: "{{alternate_mobile}}"
    },
    schema: schemas.guardians,
    uniqueKey: "guardian_id",
    idempotencyKey: "GRD-{{application_id}}",
    outputVar: "guardian_record_result"
  })
);
node(
  "applicant_guardian_link_record",
  "record",
  13860,
  160,
  recordData({
    action: "upsert",
    collection: "applicant_guardians",
    where: { relation_id: "REL-{{application_id}}" },
    data: {
      relation_id: "REL-{{application_id}}",
      applicant_id: "APP-{{application_id}}",
      guardian_id: "GRD-{{application_id}}",
      relationship: "{{relationship}}",
      is_primary: true
    },
    schema: schemas.applicantGuardians,
    uniqueKey: "relation_id",
    idempotencyKey: "REL-{{application_id}}",
    outputVar: "applicant_guardian_link_result"
  })
);
node(
  "application_profile_update",
  "record",
  14100,
  220,
  recordData({
    action: "update",
    collection: "applications",
    where: { application_id: "{{application_id}}" },
    data: {
      applicant_id: "APP-{{application_id}}",
      guardian_id: "{{guardian_id}}",
      student_name: "{{student_name}}",
      guardian_name: "{{guardian_name}}",
      contact_email: "{{contact_email}}",
      status: "profile_completed",
      stage: "profile_completed",
      document_status: "documents_pending"
    },
    schema: schemas.applications,
    outputVar: "application_profile_update_result"
  })
);
node(
  "review_summary_message",
  "message",
  14340,
  220,
  msgData(
    "Please review your application\\n\\nStudent: {{student_name}}\\nApplying for: {{selected_program_name}}\\nCampus: {{selected_campus_name}}\\nAcademic Year: {{selected_academic_year_label}}\\nParent or Contact: {{guardian_name}}\\nMobile: {{contact_mobile}}\\n\\nNext I will collect the required documents."
  )
);
node(
  "review_action_input",
  "input",
  14580,
  220,
  inputData(
    "Are the details correct?",
    "review_action",
    [
      { label: "✅ Details Are Correct", value: "details_correct" },
      { label: "✏️ Update Details", value: "update_details" }
    ]
  )
);
node("review_action_switch", "switch", 14820, 220, switchData("review_action"));
node(
  "profile_correction_form",
  "form",
  15060,
  220,
  formData(
    "Update the applicant details that need correction.",
    [
      { key: "student_name", label: "Student full name", type: "text", required: true },
      { key: "contact_email", label: "Email", type: "email", required: false },
      { key: "address_line", label: "Address", type: "text", required: false },
      { key: "city", label: "City", type: "text", required: false },
      { key: "state", label: "State", type: "text", required: false },
      { key: "pin_code", label: "PIN code", type: "text", required: false }
    ],
    "profile_correction_form_result"
  )
);
node(
  "profile_correction_record",
  "record",
  15300,
  220,
  recordData({
    action: "update",
    collection: "applicants",
    where: { applicant_id: "APP-{{application_id}}" },
    data: {
      applicant_name: "{{student_name}}",
      applicant_email: "{{contact_email}}",
      address_line: "{{address_line}}",
      city: "{{city}}",
      state: "{{state}}",
      pin_code: "{{pin_code}}"
    },
    schema: schemas.applicants,
    outputVar: "profile_correction_record_result"
  })
);

node(
  "document_requirements_live",
  "record",
  15540,
  220,
  recordData({
    action: "list",
    collection: "document_requirements",
    where: { program_offering_id: "{{selected_program_offering_id}}" },
    schema: schemas.documentRequirements,
    outputVar: "document_requirements_live_result",
    limit: 20,
    sortBy: "document_name",
    sortOrder: "asc"
  })
);
node(
  "document_requirements_text_script",
  "script",
  15780,
  220,
  scriptData(documentRequirementTextScript, "document_requirements_text_result")
);
node(
  "document_requirements_live_message",
  "message",
  16020,
  220,
  msgData("Documents Required\\n\\n{{required_document_summary}}")
);
node(
  "document_upload_intake",
  "document-intake",
  16260,
  220,
  {
    messages: ["Upload the required admission documents as images or PDFs."],
    acceptedTypesCsv: "pdf,jpg,jpeg,png",
    maxFiles: 8,
    minFiles: 1,
    outputVar: "document_upload_files"
  }
);
node(
  "document_file_processor",
  "file-processor",
  16500,
  220,
  {
    inputFiles: "{{document_upload_files}}",
    processingMode: "extract_fields",
    acceptedTypesText: "pdf,jpg,jpeg,png",
    maxFileSizeMb: 15,
    expectedDocumentType: "admission_document",
    confidenceThreshold: 0.75,
    strictExtraction: false,
    pageMode: "process_all_pages",
    schemaJson: pretty({
      fields: {
        document_type: "string",
        candidate_name: "string",
        document_number: "string"
      }
    }),
    outputVar: "document_processing_result"
  }
);
node(
  "document_result_script",
  "script",
  16740,
  220,
  scriptData(documentResultScript, "document_result_script_result")
);
node("document_result_switch", "switch", 16980, 220, switchData("document_result_route"));
node(
  "document_reupload_message",
  "message",
  17220,
  140,
  msgData(
    "I could not validate one or more documents with enough confidence. Please upload a clearer copy with all four corners visible and the text readable."
  )
);
node(
  "document_reupload_intake",
  "document-intake",
  17460,
  140,
  {
    messages: ["Upload the clearer replacement document or image."],
    acceptedTypesCsv: "pdf,jpg,jpeg,png",
    maxFiles: 4,
    minFiles: 1,
    outputVar: "document_retry_files"
  }
);
node(
  "document_reupload_processor",
  "file-processor",
  17700,
  140,
  {
    inputFiles: "{{document_retry_files}}",
    processingMode: "extract_fields",
    acceptedTypesText: "pdf,jpg,jpeg,png",
    maxFileSizeMb: 15,
    expectedDocumentType: "admission_document",
    confidenceThreshold: 0.8,
    strictExtraction: false,
    pageMode: "process_all_pages",
    schemaJson: pretty({
      fields: {
        document_type: "string",
        candidate_name: "string",
        document_number: "string"
      }
    }),
    outputVar: "document_retry_processing_result"
  }
);
node(
  "document_retry_result_script",
  "script",
  17940,
  140,
  scriptData(documentRetryResultScript, "document_retry_result_script_result")
);
node(
  "application_document_record",
  "record",
  17220,
  260,
  recordData({
    action: "upsert",
    collection: "application_documents",
    where: { application_document_id: "DOC-{{application_id}}" },
    data: {
      application_document_id: "DOC-{{application_id}}",
      application_id: "{{application_id}}",
      requirement_id: "",
      document_type: "admission_document_bundle",
      upload_status: "uploaded",
      processing_status: "processed",
      verification_status: "{{document_verification_status}}",
      extraction_status: "completed"
    },
    schema: schemas.applicationDocuments,
    uniqueKey: "application_document_id",
    idempotencyKey: "DOC-{{application_id}}",
    outputVar: "application_document_record_result"
  })
);
node(
  "application_document_retry_record",
  "record",
  18180,
  140,
  recordData({
    action: "upsert",
    collection: "application_documents",
    where: { application_document_id: "DOC-{{application_id}}" },
    data: {
      application_document_id: "DOC-{{application_id}}",
      application_id: "{{application_id}}",
      requirement_id: "",
      document_type: "admission_document_bundle",
      upload_status: "uploaded",
      processing_status: "processed",
      verification_status: "{{document_verification_status}}",
      extraction_status: "retry_completed"
    },
    schema: schemas.applicationDocuments,
    uniqueKey: "application_document_id",
    idempotencyKey: "DOC-{{application_id}}",
    outputVar: "application_document_retry_record_result"
  })
);
node(
  "application_documents_update",
  "record",
  18420,
  220,
  recordData({
    action: "update",
    collection: "applications",
    where: { application_id: "{{application_id}}" },
    data: {
      status: "documents_received",
      stage: "documents_received",
      document_status: "{{selected_document_status}}"
    },
    schema: schemas.applications,
    outputVar: "application_documents_update_result"
  })
);
node(
  "visit_choice_input",
  "input",
  18660,
  220,
  inputData(
    "Before submitting, would you like to speak with our admissions team or visit the campus?",
    "visit_choice",
    [
      { label: "🏫 Campus Visit", value: "campus_visit" },
      { label: "📞 Counsellor Call", value: "counsellor_call" },
      { label: "⏭ Continue Without Booking", value: "continue_without_booking" }
    ]
  )
);
node("visit_choice_switch", "switch", 18900, 220, switchData("visit_choice"));
node("set_slot_type_visit", "setVariable", 19140, 160, setVars({
  selected_slot_type: "campus_visit"
}));
node("set_slot_type_counsellor", "setVariable", 19140, 220, setVars({
  selected_slot_type: "counsellor_call"
}));
node(
  "admission_slot_list",
  "record",
  19380,
  190,
  recordData({
    action: "list",
    collection: "admission_slots",
    where: {
      campus_id: "{{selected_campus_id}}",
      slot_type: "{{selected_slot_type}}",
      status: "available"
    },
    schema: schemas.admissionSlots,
    outputVar: "admission_slot_list_result",
    limit: 20,
    sortBy: "date",
    sortOrder: "asc"
  })
);
node(
  "slot_normalizer_script",
  "script",
  19620,
  190,
  scriptData(slotNormalizerScript, "slot_normalizer_result")
);
node("slot_inventory_switch", "switch", 19860, 190, switchData("slot_inventory_state"));
node(
  "slot_unavailable_message",
  "message",
  20100,
  120,
  msgData(
    "No live {{selected_slot_type_label}} availability was returned for the selected campus right now."
  )
);
node(
  "slot_unavailable_action_input",
  "input",
  20340,
  120,
  inputData(
    "Choose the next step.",
    "slot_unavailable_action",
    [
      { label: "⏭ Continue Without Booking", value: "continue_without_booking" },
      { label: "👨‍💼 Talk to Admissions Team", value: "talk_to_admissions" }
    ]
  )
);
node("slot_unavailable_switch", "switch", 20580, 120, switchData("slot_unavailable_action"));
node(
  "admission_booking_node",
  "appointment",
  20100,
  240,
  appointmentData(
    "Select your preferred {{selected_slot_type_label}} time.",
    "available_admission_slots",
    "admission_booking_selection"
  )
);
node(
  "selected_slot_script",
  "script",
  20340,
  240,
  scriptData(selectedSlotScript, "selected_slot_script_result")
);
node(
  "admission_appointment_record",
  "record",
  20580,
  240,
  recordData({
    action: "upsert",
    collection: "admission_appointments",
    where: { appointment_id: "APT-{{application_id}}" },
    data: {
      appointment_id: "APT-{{application_id}}",
      application_id: "{{application_id}}",
      slot_id: "{{selected_slot_id}}",
      appointment_type: "{{selected_slot_type}}",
      status: "confirmed",
      scheduled_start_at: "{{selected_visit_datetime}}",
      scheduled_end_at: "{{selected_visit_end}}"
    },
    schema: schemas.admissionAppointments,
    uniqueKey: "appointment_id",
    idempotencyKey: "APT-{{application_id}}",
    outputVar: "admission_appointment_record_result"
  })
);
node(
  "booking_confirmation_message",
  "message",
  20820,
  240,
  msgData(
    "{{selected_slot_type_label}} booked\\n\\n{{selected_visit_label}}"
  )
);

node(
  "pre_submit_summary_message",
  "message",
  21060,
  220,
  msgData(
    "Your admission application is almost complete 🎓\\n\\nApplication ID: {{application_id}}\\nStudent: {{student_name}}\\nProgramme: {{selected_program_name}}\\nCampus: {{selected_campus_name}}\\nDocuments: {{selected_document_status}}\\n{{selected_slot_type_label}}: {{selected_visit_label}}\\n\\nApplication Fee: {{application_fee_display}}\\n\\nComplete the application fee to submit your application."
  )
);
node(
  "application_fee_payment",
  "payment",
  21300,
  220,
  paymentData({
    amount: "{{selected_application_fee_amount_minor}}",
    description: "Application fee for {{selected_program_name}}",
    outputVar: "application_fee_payment_result"
  })
);
node(
  "payment_record",
  "record",
  21540,
  180,
  recordData({
    action: "upsert",
    collection: "application_payments",
    where: { payment_id: "PAY-{{application_id}}" },
    data: {
      payment_id: "PAY-{{application_id}}",
      application_id: "{{application_id}}",
      amount: "{{selected_application_fee_amount_minor}}",
      currency: "{{default_currency}}",
      provider: "razorpay",
      provider_reference: "{{application_fee_payment_result}}",
      purpose: "application_fee",
      status: "paid"
    },
    schema: schemas.payments,
    uniqueKey: "payment_id",
    idempotencyKey: "PAY-{{application_id}}",
    outputVar: "payment_record_result"
  })
);
node(
  "application_submit_update",
  "record",
  21780,
  180,
  recordData({
    action: "update",
    collection: "applications",
    where: { application_id: "{{application_id}}" },
    data: {
      status: "submitted",
      stage: "submitted",
      payment_status: "paid",
      document_status: "{{selected_document_status}}"
    },
    schema: schemas.applications,
    outputVar: "application_submit_update_result"
  })
);
node(
  "status_history_submitted_record",
  "record",
  22020,
  180,
  recordData({
    action: "upsert",
    collection: "application_status_history",
    where: { history_id: "{{application_id}}-submitted" },
    data: {
      history_id: "{{application_id}}-submitted",
      application_id: "{{application_id}}",
      from_status: "payment_pending",
      to_status: "submitted",
      reason_code: "application_fee_paid"
    },
    schema: schemas.applicationStatusHistory,
    uniqueKey: "history_id",
    idempotencyKey: "{{application_id}}:status:submitted",
    outputVar: "status_history_submitted_record_result"
  })
);
node(
  "confirmation_notification",
  "notification",
  22260,
  180,
  notificationData({
    recipients: [
      {
        type: "customer",
        phone: "{{contact_mobile}}",
        email: "{{contact_email}}"
      }
    ],
    channels: [
      {
        type: "whatsapp",
        enabled: true,
        templateId: "admission_application_submitted"
      },
      {
        type: "sms",
        enabled: true,
        message:
          "Admission submitted: {{application_id}} for {{selected_program_name}} at {{selected_campus_name}}."
      },
      {
        type: "email",
        enabled: true,
        subject: "Admission application submitted",
        body:
          "Application ID: {{application_id}}\\nProgramme: {{selected_program_name}}\\nCampus: {{selected_campus_name}}\\nAcademic Year: {{selected_academic_year_label}}\\nFee Paid: {{application_fee_display}}"
      }
    ],
    outputVar: "confirmation_notification_result",
    dedupeKey: "{{application_id}}:submitted"
  })
);
node(
  "status_followup_scheduler",
  "scheduler",
  22500,
  180,
  schedulerData({
    runAt: "",
    offsetValue: 3,
    offsetUnit: "days",
    offsetDirection: "after",
    payload: {
      type: "application_status_followup",
      application_id: "{{application_id}}"
    },
    outputVar: "status_followup_scheduler_result",
    dedupeKey: "{{application_id}}:status-followup"
  })
);
node("appointment_reminder_switch", "switch", 22740, 180, switchData("appointment_selected"));
node(
  "appointment_reminder_24h",
  "scheduler",
  22980,
  140,
  schedulerData({
    runAt: "{{selected_visit_datetime}}",
    offsetValue: 24,
    offsetUnit: "hours",
    offsetDirection: "before",
    payload: {
      type: "admission_appointment_reminder_24h",
      application_id: "{{application_id}}",
      appointment_type: "{{selected_slot_type}}"
    },
    outputVar: "appointment_reminder_24h_result",
    dedupeKey: "{{application_id}}:appointment-24h"
  })
);
node(
  "appointment_reminder_2h",
  "scheduler",
  23220,
  140,
  schedulerData({
    runAt: "{{selected_visit_datetime}}",
    offsetValue: 2,
    offsetUnit: "hours",
    offsetDirection: "before",
    payload: {
      type: "admission_appointment_reminder_2h",
      application_id: "{{application_id}}",
      appointment_type: "{{selected_slot_type}}"
    },
    outputVar: "appointment_reminder_2h_result",
    dedupeKey: "{{application_id}}:appointment-2h"
  })
);
node(
  "submission_success_message",
  "message",
  23460,
  180,
  msgData(
    "🎉 Application Submitted Successfully\\n\\nThank you, {{student_name}}.\\n\\nApplication ID: {{application_id}}\\nProgramme: {{selected_program_name}}\\nCampus: {{selected_campus_name}}\\nAcademic Year: {{selected_academic_year_label}}\\nApplication Fee: {{application_fee_display}} - Paid ✅\\nDocuments: {{selected_document_status}}\\n{{selected_slot_type_label}}: {{selected_visit_label}}\\n\\nWe will keep sending updates as your admission progresses."
  )
);
node("submission_success_end", "end", 23700, 180, { messages: [] });
node(
  "payment_failure_message",
  "message",
  21540,
  280,
  msgData(
    "The payment was not completed, but your application details and uploaded documents are safely saved."
  )
);
node(
  "payment_failure_action_input",
  "input",
  21780,
  280,
  inputData(
    "Choose the next step.",
    "payment_failure_action",
    [
      { label: "🔄 Try Payment Again", value: "try_payment_again" },
      { label: "⏰ Pay Later", value: "pay_later" }
    ]
  )
);
node("payment_failure_action_switch", "switch", 22020, 280, switchData("payment_failure_action"));
node(
  "application_fee_payment_retry",
  "payment",
  22260,
  280,
  paymentData({
    amount: "{{selected_application_fee_amount_minor}}",
    description: "Retry application fee for {{selected_program_name}}",
    outputVar: "application_fee_payment_retry_result"
  })
);
node(
  "application_payment_pending_update",
  "record",
  22500,
  320,
  recordData({
    action: "update",
    collection: "applications",
    where: { application_id: "{{application_id}}" },
    data: {
      status: "payment_pending",
      stage: "payment_pending",
      payment_status: "pending"
    },
    schema: schemas.applications,
    outputVar: "application_payment_pending_update_result"
  })
);
node(
  "status_history_payment_pending_record",
  "record",
  22740,
  320,
  recordData({
    action: "upsert",
    collection: "application_status_history",
    where: { history_id: "{{application_id}}-payment-pending" },
    data: {
      history_id: "{{application_id}}-payment-pending",
      application_id: "{{application_id}}",
      from_status: "documents_received",
      to_status: "payment_pending",
      reason_code: "payment_not_completed"
    },
    schema: schemas.applicationStatusHistory,
    uniqueKey: "history_id",
    idempotencyKey: "{{application_id}}:status:payment-pending",
    outputVar: "status_history_payment_pending_record_result"
  })
);
node(
  "payment_pending_scheduler_2h",
  "scheduler",
  22980,
  320,
  schedulerData({
    runAt: "",
    offsetValue: 2,
    offsetUnit: "hours",
    offsetDirection: "after",
    payload: {
      type: "payment_pending_reminder_2h",
      application_id: "{{application_id}}"
    },
    outputVar: "payment_pending_scheduler_2h_result",
    dedupeKey: "{{application_id}}:payment-pending-2h"
  })
);
node(
  "payment_pending_scheduler_24h",
  "scheduler",
  23220,
  320,
  schedulerData({
    runAt: "",
    offsetValue: 24,
    offsetUnit: "hours",
    offsetDirection: "after",
    payload: {
      type: "payment_pending_reminder_24h",
      application_id: "{{application_id}}"
    },
    outputVar: "payment_pending_scheduler_24h_result",
    dedupeKey: "{{application_id}}:payment-pending-24h"
  })
);
node(
  "pay_later_message",
  "message",
  23460,
  320,
  msgData(
    "Your application is saved with payment pending. We will remind you to complete the application fee so submission does not stall."
  )
);
node("pay_later_end", "end", 23700, 320, { messages: [] });

node(
  "system_failure_message",
  "message",
  9600,
  880,
  msgData(
    "I could not complete that step because the operational data or persistence layer did not respond cleanly. I am forwarding the context to the admissions team so the application does not stall."
  )
);
node(
  "system_failure_handover",
  "handover",
  9840,
  880,
  {
    channel: "human",
    messages: ["Connecting this admission request to the admissions operations team."]
  }
);

edge("start_1", "set_defaults", { label: "next" });
edge("set_defaults", "welcome_message", { label: "next" });
edge("welcome_message", "main_menu_input", { label: "next" });
edgeValue("main_menu_input", "start_admission", "route_start_admission", "start_admission");
edgeValue("main_menu_input", "courses_classes", "route_courses", "courses_classes");
edgeValue("main_menu_input", "check_eligibility", "route_eligibility", "check_eligibility");
edgeValue("main_menu_input", "fees_scholarships", "route_fees", "fees_scholarships");
edgeValue("main_menu_input", "continue_application", "route_continue", "continue_application");
edgeValue("main_menu_input", "upload_documents", "route_upload_docs", "upload_documents");
edgeValue("main_menu_input", "book_campus_visit", "route_book_visit", "book_campus_visit");
edgeValue("main_menu_input", "book_counsellor_call", "route_book_counsellor", "book_counsellor_call");
edgeValue("main_menu_input", "application_status", "route_status", "application_status");
edgeValue("main_menu_input", "transport_hostel", "transport_hostel_message", "transport_hostel");
edgeValue("main_menu_input", "admission_dates", "admission_dates_list", "admission_dates");
edgeValue("main_menu_input", "talk_to_admissions", "talk_to_admissions_handover", "talk_to_admissions");
edge("main_menu_input", "faq_input", { isDefault: true, label: "ask_question/free_text/default" });
edge("transport_hostel_message", "transport_hostel_end", { label: "next" });
recordRoutes("admission_dates_list", "admission_dates_script", "system_failure_message");
scriptRoutes("admission_dates_script", "admission_dates_message", "system_failure_message");
edge("admission_dates_message", "admission_dates_end", { label: "next" });
edge("faq_input", "faq_ai_grounded", { label: "next" });
edgeValue("faq_ai_grounded", "grounded", "faq_end", "grounded");
edge("faq_ai_grounded", "talk_to_admissions_handover", { isDefault: true, label: "fallback/default" });

for (const routeId of [
  "route_start_admission",
  "route_courses",
  "route_eligibility",
  "route_fees"
]) {
  edge(routeId, "applicant_type_input", { label: "next" });
}
for (const routeId of [
  "route_continue",
  "route_upload_docs",
  "route_book_visit",
  "route_book_counsellor",
  "route_status"
]) {
  edge(routeId, "lookup_mobile_input", { label: "next" });
}

edge("applicant_type_input", "entry_mobile_switch", { label: "next" });
edgeValue("entry_mobile_switch", "yes", "contact_mobile_input", "yes");
edge("entry_mobile_switch", "academic_year_list", { isDefault: true, label: "no/default" });
edge("contact_mobile_input", "contact_type_switch", { label: "next" });
edgeValue("contact_type_switch", "parent", "guardian_find", "parent");
edgeValue("contact_type_switch", "student", "applicant_find", "student");
edge("contact_type_switch", "applicant_find", { isDefault: true, label: "default" });
recordRoutes("guardian_find", "contact_hydrate_script", "contact_hydrate_script", "contact_hydrate_script", "contact_hydrate_script");
recordRoutes("applicant_find", "contact_hydrate_script", "contact_hydrate_script", "contact_hydrate_script", "contact_hydrate_script");
scriptRoutes("contact_hydrate_script", "existing_application_list", "system_failure_message");
recordRoutes("existing_application_list", "existing_application_summary_script", "system_failure_message");
scriptRoutes("existing_application_summary_script", "existing_application_state_switch", "system_failure_message");
edgeValue("existing_application_state_switch", "found", "welcome_back_message", "found");
edge("existing_application_state_switch", "academic_year_list", { isDefault: true, label: "not_found/default" });
edge("welcome_back_message", "existing_application_action_input", { label: "next" });
edgeValue("existing_application_action_input", "continue_application", "resume_route_script", "continue_application");
edgeValue("existing_application_action_input", "view_status", "progress_summary_script", "view_status");
edge("existing_application_action_input", "academic_year_list", { isDefault: true, label: "start_another/default" });

edge("lookup_mobile_input", "copy_lookup_mobile", { label: "next" });
edge("copy_lookup_mobile", "lookup_application_list", { label: "next" });
recordRoutes("lookup_application_list", "lookup_application_summary_script", "system_failure_message");
scriptRoutes("lookup_application_summary_script", "lookup_application_state_switch", "system_failure_message");
edgeValue("lookup_application_state_switch", "single", "lookup_action_switch", "single");
edgeValue("lookup_application_state_switch", "multiple", "lookup_application_choice_input", "multiple");
edge("lookup_application_state_switch", "no_application_message", { isDefault: true, label: "not_found/default" });
edge("lookup_application_choice_input", "lookup_application_choice_script", { label: "next" });
scriptRoutes("lookup_application_choice_script", "lookup_application_choice_switch", "system_failure_message");
edgeValue("lookup_application_choice_switch", "selected", "lookup_action_switch", "selected");
edge("lookup_application_choice_switch", "no_application_message", { isDefault: true, label: "invalid/default" });
edge("no_application_message", "no_application_end", { label: "next" });
edgeValue("lookup_action_switch", "application_status", "progress_summary_script", "application_status");
edgeValue("lookup_action_switch", "continue_application", "resume_route_script", "continue_application");
edgeValue("lookup_action_switch", "upload_documents", "document_requirements_live", "upload_documents");
edgeValue("lookup_action_switch", "book_campus_visit", "admission_slot_list", "book_campus_visit");
edgeValue("lookup_action_switch", "book_counsellor_call", "admission_slot_list", "book_counsellor_call");
edge("lookup_action_switch", "progress_summary_script", { isDefault: true, label: "default" });

scriptRoutes("resume_route_script", "resume_route_switch", "system_failure_message");
edgeValue("resume_route_switch", "status", "progress_summary_script", "status");
edgeValue("resume_route_switch", "payment", "pre_submit_summary_message", "payment");
edgeValue("resume_route_switch", "documents", "document_requirements_live", "documents");
edge("resume_route_switch", "applicant_profile_form", { isDefault: true, label: "profile/default" });
scriptRoutes("progress_summary_script", "application_status_message", "system_failure_message");
edge("application_status_message", "application_status_end", { label: "next" });

recordRoutes("academic_year_list", "academic_year_options_script", "system_failure_message");
scriptRoutes("academic_year_options_script", "academic_year_choice_input", "system_failure_message");
edge("academic_year_choice_input", "academic_year_choice_script", { label: "next" });
scriptRoutes("academic_year_choice_script", "academic_year_state_switch", "system_failure_message");
edgeValue("academic_year_state_switch", "selected", "campus_list", "selected");
edge("academic_year_state_switch", "academic_year_invalid_message", { isDefault: true, label: "invalid/default" });
edge("academic_year_invalid_message", "academic_year_invalid_end", { label: "next" });

recordRoutes("campus_list", "campus_options_script", "system_failure_message");
scriptRoutes("campus_options_script", "campus_choice_input", "system_failure_message");
edge("campus_choice_input", "campus_choice_script", { label: "next" });
scriptRoutes("campus_choice_script", "campus_state_switch", "system_failure_message");
edgeValue("campus_state_switch", "selected", "program_offering_list", "selected");
edge("campus_state_switch", "campus_invalid_message", { isDefault: true, label: "invalid/default" });
edge("campus_invalid_message", "campus_invalid_end", { label: "next" });

recordRoutes("program_offering_list", "program_options_script", "system_failure_message");
scriptRoutes("program_options_script", "program_choice_input", "system_failure_message");
edge("program_choice_input", "program_choice_script", { label: "next" });
scriptRoutes("program_choice_script", "program_state_switch", "system_failure_message");
edgeValue("program_state_switch", "selected", "program_offering_detail", "selected");
edge("program_state_switch", "program_invalid_message", { isDefault: true, label: "invalid/default" });
edge("program_invalid_message", "program_invalid_end", { label: "next" });
recordRoutes("program_offering_detail", "admission_rule_find", "system_failure_message");
recordRoutes("admission_rule_find", "fee_structure_find", "fee_structure_find", "fee_structure_find", "fee_structure_find");
recordRoutes("fee_structure_find", "document_requirements_preview", "document_requirements_preview", "document_requirements_preview", "document_requirements_preview");
recordRoutes("document_requirements_preview", "program_context_script", "system_failure_message");
scriptRoutes("program_context_script", "program_information_message", "system_failure_message");
edge("program_information_message", "program_entry_mode_switch", { label: "next" });
edgeValue("program_entry_mode_switch", "courses_only", "course_catalog_end_message", "courses_only");
edgeValue("program_entry_mode_switch", "eligibility_only", "eligibility_form_switch", "eligibility_only");
edgeValue("program_entry_mode_switch", "fees_only", "fees_message", "fees_only");
edge("program_entry_mode_switch", "program_action_input", { isDefault: true, label: "start_admission/default" });
edge("course_catalog_end_message", "course_catalog_end", { label: "next" });
edgeValue("eligibility_form_switch", "parent", "school_eligibility_form", "parent");
edge("eligibility_form_switch", "college_eligibility_form", { isDefault: true, label: "student/default" });
edge("program_action_input", "program_action_switch", { label: "next" });
edgeValue("program_action_switch", "check_eligibility", "eligibility_form_switch", "check_eligibility");
edgeValue("program_action_switch", "view_fees", "fees_message", "view_fees");
edgeValue("program_action_switch", "view_documents", "required_documents_message", "view_documents");
edge("program_action_switch", "create_application_identity", { isDefault: true, label: "continue_application/default" });

edge("school_eligibility_form", "eligibility_check_script", { label: "next" });
edge("college_eligibility_form", "eligibility_check_script", { label: "next" });
scriptRoutes("eligibility_check_script", "eligibility_result_message", "system_failure_message");
edge("eligibility_result_message", "eligibility_action_input", { label: "next" });
edge("eligibility_action_input", "eligibility_action_switch", { label: "next" });
edgeValue("eligibility_action_switch", "view_fees", "fees_message", "view_fees");
edgeValue("eligibility_action_switch", "book_counsellor", "set_counsellor_from_eligibility", "book_counsellor");
edge("eligibility_action_switch", "create_application_identity", { isDefault: true, label: "continue_application/default" });
edge("set_counsellor_from_eligibility", "admission_slot_list", { label: "next" });

edge("fees_message", "fees_action_input", { label: "next" });
edge("fees_action_input", "fees_action_switch", { label: "next" });
edgeValue("fees_action_switch", "check_scholarship", "scholarship_rules_list", "check_scholarship");
edgeValue("fees_action_switch", "transport_hostel", "transport_hostel_message", "transport_hostel");
edge("fees_action_switch", "create_application_identity", { isDefault: true, label: "continue_application/default" });
recordRoutes("scholarship_rules_list", "scholarship_form", "system_failure_message");
edge("scholarship_form", "scholarship_script", { label: "next" });
scriptRoutes("scholarship_script", "scholarship_record", "system_failure_message");
recordRoutes("scholarship_record", "scholarship_message", "system_failure_message");
edge("scholarship_message", "create_application_identity", { label: "next" });

edge("required_documents_message", "required_documents_action_input", { label: "next" });
edge("required_documents_action_input", "required_documents_action_switch", { label: "next" });
edgeValue("required_documents_action_switch", "book_counsellor", "set_counsellor_from_documents", "book_counsellor");
edge("required_documents_action_switch", "create_application_identity", { isDefault: true, label: "continue_application/default" });
edge("set_counsellor_from_documents", "admission_slot_list", { label: "next" });

scriptRoutes("create_application_identity", "application_draft_record", "system_failure_message");
recordRoutes("application_draft_record", "status_history_draft_record", "system_failure_message");
recordRoutes("status_history_draft_record", "applicant_profile_form", "system_failure_message");
edge("applicant_profile_form", "applicant_record", { label: "next" });
recordRoutes("applicant_record", "guardian_needed_switch", "system_failure_message");
edgeValue("guardian_needed_switch", "parent", "guardian_form", "parent");
edge("guardian_needed_switch", "application_profile_update", { isDefault: true, label: "student/default" });
edge("guardian_form", "guardian_record", { label: "next" });
recordRoutes("guardian_record", "applicant_guardian_link_record", "system_failure_message");
recordRoutes("applicant_guardian_link_record", "application_profile_update", "system_failure_message");
recordRoutes("application_profile_update", "review_summary_message", "system_failure_message");
edge("review_summary_message", "review_action_input", { label: "next" });
edge("review_action_input", "review_action_switch", { label: "next" });
edgeValue("review_action_switch", "update_details", "profile_correction_form", "update_details");
edge("review_action_switch", "document_requirements_live", { isDefault: true, label: "details_correct/default" });
edge("profile_correction_form", "profile_correction_record", { label: "next" });
recordRoutes("profile_correction_record", "document_requirements_live", "system_failure_message");

recordRoutes("document_requirements_live", "document_requirements_text_script", "system_failure_message");
scriptRoutes("document_requirements_text_script", "document_requirements_live_message", "system_failure_message");
edge("document_requirements_live_message", "document_upload_intake", { label: "next" });
edge("document_upload_intake", "document_file_processor", { label: "next" });
edgeValue("document_file_processor", "success", "document_result_script", "success");
edgeValue("document_file_processor", "partial", "document_result_script", "partial");
edge("document_file_processor", "document_result_script", { isDefault: true, label: "low_confidence/default" });
scriptRoutes("document_result_script", "document_result_switch", "system_failure_message");
edgeValue("document_result_switch", "ready", "application_document_record", "ready");
edge("document_result_switch", "document_reupload_message", { isDefault: true, label: "reupload/default" });
edge("document_reupload_message", "document_reupload_intake", { label: "next" });
edge("document_reupload_intake", "document_reupload_processor", { label: "next" });
edgeValue("document_reupload_processor", "success", "document_retry_result_script", "success");
edgeValue("document_reupload_processor", "partial", "document_retry_result_script", "partial");
edge("document_reupload_processor", "document_retry_result_script", { isDefault: true, label: "manual_review/default" });
scriptRoutes("document_retry_result_script", "application_document_retry_record", "system_failure_message");
recordRoutes("application_document_record", "application_documents_update", "system_failure_message");
recordRoutes("application_document_retry_record", "application_documents_update", "system_failure_message");
recordRoutes("application_documents_update", "visit_choice_input", "system_failure_message");

edge("visit_choice_input", "visit_choice_switch", { label: "next" });
edgeValue("visit_choice_switch", "campus_visit", "set_slot_type_visit", "campus_visit");
edgeValue("visit_choice_switch", "counsellor_call", "set_slot_type_counsellor", "counsellor_call");
edge("visit_choice_switch", "pre_submit_summary_message", { isDefault: true, label: "continue_without_booking/default" });
edge("set_slot_type_visit", "admission_slot_list", { label: "next" });
edge("set_slot_type_counsellor", "admission_slot_list", { label: "next" });
recordRoutes("admission_slot_list", "slot_normalizer_script", "system_failure_message", "slot_normalizer_script", "slot_normalizer_script");
scriptRoutes("slot_normalizer_script", "slot_inventory_switch", "system_failure_message");
edgeValue("slot_inventory_switch", "available", "admission_booking_node", "available");
edge("slot_inventory_switch", "slot_unavailable_message", { isDefault: true, label: "no_slots/default" });
edge("slot_unavailable_message", "slot_unavailable_action_input", { label: "next" });
edge("slot_unavailable_action_input", "slot_unavailable_switch", { label: "next" });
edgeValue("slot_unavailable_switch", "talk_to_admissions", "talk_to_admissions_handover", "talk_to_admissions");
edge("slot_unavailable_switch", "pre_submit_summary_message", { isDefault: true, label: "continue_without_booking/default" });
edge("admission_booking_node", "selected_slot_script", { label: "selected" });
scriptRoutes("selected_slot_script", "admission_appointment_record", "system_failure_message");
recordRoutes("admission_appointment_record", "booking_confirmation_message", "system_failure_message");
edge("booking_confirmation_message", "pre_submit_summary_message", { label: "next" });

edge("pre_submit_summary_message", "application_fee_payment", { label: "next" });
edgeValue("application_fee_payment", "paid", "payment_record", "paid");
edge("application_fee_payment", "payment_failure_message", { isDefault: true, label: "failed/default" });
recordRoutes("payment_record", "application_submit_update", "system_failure_message");
recordRoutes("application_submit_update", "status_history_submitted_record", "system_failure_message");
recordRoutes("status_history_submitted_record", "confirmation_notification", "system_failure_message");
notificationRoutes("confirmation_notification", "status_followup_scheduler");
schedulerRoutes("status_followup_scheduler", "appointment_reminder_switch");
edgeValue("appointment_reminder_switch", "yes", "appointment_reminder_24h", "yes");
edge("appointment_reminder_switch", "submission_success_message", { isDefault: true, label: "no/default" });
schedulerRoutes("appointment_reminder_24h", "appointment_reminder_2h");
schedulerRoutes("appointment_reminder_2h", "submission_success_message");
edge("submission_success_message", "submission_success_end", { label: "next" });

edge("payment_failure_message", "payment_failure_action_input", { label: "next" });
edge("payment_failure_action_input", "payment_failure_action_switch", { label: "next" });
edgeValue("payment_failure_action_switch", "try_payment_again", "application_fee_payment_retry", "try_payment_again");
edge("payment_failure_action_switch", "application_payment_pending_update", { isDefault: true, label: "pay_later/default" });
edgeValue("application_fee_payment_retry", "paid", "payment_record", "paid");
edge("application_fee_payment_retry", "application_payment_pending_update", { isDefault: true, label: "failed/default" });
recordRoutes("application_payment_pending_update", "status_history_payment_pending_record", "system_failure_message");
recordRoutes("status_history_payment_pending_record", "payment_pending_scheduler_2h", "system_failure_message");
schedulerRoutes("payment_pending_scheduler_2h", "payment_pending_scheduler_24h");
schedulerRoutes("payment_pending_scheduler_24h", "pay_later_message");
edge("pay_later_message", "pay_later_end", { label: "next" });

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
