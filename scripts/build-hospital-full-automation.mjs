import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  normalizeNotificationFlow,
  notificationData as buildNotificationData
} from "./notification-data.mjs";

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const domainRoot = join(rootDir, "domains", "hospital");
const outputPath = join(domainRoot, "templates", "hospital-full-automation.flow.json");
const sourcePath = join(
  domainRoot,
  "templates-source",
  "hospital-full-automation.source.flow.json"
);
const DOMAIN_RECORD_SCHEMA = "healthcare";

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

if (existsSync(sourcePath) && process.env.HOSPITAL_FLOW_LEGACY_GENERATOR !== "1") {
  mkdirSync(dirname(outputPath), { recursive: true });
  const sourceDoc = normalizeNotificationFlow(
    JSON.parse(readFileSync(sourcePath, "utf8"))
  );
  applyDomainRecordSchema(sourceDoc);
  writeFileSync(outputPath, `${JSON.stringify(sourceDoc, null, 2)}\n`, "utf8");
  console.log(`Wrote ${outputPath}`);
  console.log(`Source: ${sourcePath}`);
  console.log(`Nodes: ${sourceDoc.flow.nodes.length}`);
  console.log(`Edges: ${sourceDoc.flow.edges.length}`);
  process.exit(0);
}

const exportDoc = {
  version: "1.0",
  exportedAt: "2026-07-13T00:00:00.000Z",
  bot: {
    name: "Hospital Full Automation",
    description:
      "Healthcare operations automation template for hospital front desk, appointments, lab, billing, insurance, admission, emergency routing, and human handover.",
    headerTitle: "Hospital Full Automation",
    headerTagline: "Healthcare operations automation",
    globalVariables: [
      { key: "hospital_name", value: "CityCare Hospital" },
      { key: "emergency_phone", value: "+91-00000-10800" },
      { key: "front_desk_phone", value: "+91-00000-10000" },
      { key: "billing_phone", value: "+91-00000-12000" },
      { key: "main_branch_address", value: "Main Road, Hyderabad" },
      { key: "report_portal_url", value: "https://hospital.example.com/reports" },
      { key: "payment_link", value: "https://hospital.example.com/pay" },
      { key: "appointment_fee", value: "500" },
      { key: "online_consult_fee", value: "750" },
      { key: "health_package_fee", value: "1499" },
      { key: "lab_test_fee", value: "799" },
      { key: "currency", value: "INR" }
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
const FLOW_RECORD_PII_ENCRYPTION_ENABLED = false;

function node(id, type, x, y, data = {}) {
  nodes.push({ id, type, position: { x, y }, data });
  return id;
}

function edge(source, target, options = {}) {
  const item = {
    id: `edge_${String(edgeSeq++).padStart(3, "0")}_${source}_${target}`,
    source,
    target,
    type: "smoothstep"
  };
  if (options.condition) item.condition = options.condition;
  if (options.isDefault) item.isDefault = true;
  if (options.label) item.label = options.label;
  edges.push(item);
}

function text(value) {
  return [{ type: "text", text: value }];
}

function msgData(value, buttons = []) {
  return { messages: text(value), buttons };
}

function inputData(message, variable, buttons = []) {
  return { messages: [message], variable, buttons };
}

function decisionData(message, outputVar) {
  return { messages: [message], outputVar };
}

function setVars(assignments) {
  return {
    assignments: Object.entries(assignments).map(([key, value]) => ({ key, value }))
  };
}

function scriptData(script, outputVar, timeoutMs = 50) {
  return { script, outputVar, timeoutMs };
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

function carouselData(introText, slides) {
  return {
    introText,
    designPreset: "modern",
    cardLayout: "stacked",
    cardSize: "comfortable",
    showPagination: true,
    autoAdvanceMs: 0,
    customCss: "",
    slides,
    slidesJson: pretty(slides)
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
  encryptPii = false,
  piiFields = ""
}) {
  const shouldEncryptPii = Boolean(encryptPii && FLOW_RECORD_PII_ENCRYPTION_ENABLED);
  return {
    action,
    schemaName: DOMAIN_RECORD_SCHEMA,
    collection,
    where,
    whereJson: pretty(where),
    data,
    dataJson: pretty(data),
    collectionSchema: pretty(schema),
    uniqueKey,
    idempotencyKey,
    outputVar,
    limit,
    offset: 0,
    sortBy,
    sortOrder,
    softDelete: true,
    encryptPii: shouldEncryptPii,
    piiFields: shouldEncryptPii ? piiFields : ""
  };
}

function queueData(queueName, priority, skillsRequiredCsv, slaFirstResponseMinutes, outputVar) {
  return {
    queueName,
    assignmentStrategy: priority === "critical" ? "priority" : "skill_based",
    priority,
    caseType: queueName,
    routingReason: `${queueName}_support`,
    skillsRequiredCsv,
    skillsRequired: skillsRequiredCsv.split(",").filter(Boolean),
    slaFirstResponseMinutes,
    patientContext: {
      patient_mobile: "{{patient_mobile}}",
      appointment_id: "{{appointment_id}}",
      channel: "{{system.channel}}"
    },
    patientContextJson: pretty({
      patient_mobile: "{{patient_mobile}}",
      appointment_id: "{{appointment_id}}",
      channel: "{{system.channel}}"
    }),
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

function notificationData({ templateId, sms, emailSubject, emailBody, outputVar, dedupeSuffix }) {
  const recipients = [
    {
      type: "customer",
      phone: "{{patient_mobile}}",
      email: "{{patient_email}}"
    }
  ];
  const channels = [
    { type: "whatsapp", templateId, enabled: true },
    { type: "sms", message: sms, enabled: true },
    { type: "email", subject: emailSubject, body: emailBody, enabled: true }
  ];
  return buildNotificationData({
    recipients,
    channels,
    dedupeKey: `{{system.sessionId}}:${dedupeSuffix}`,
    outputVar
  });
}

function paymentData({ amount, description, outputVar }) {
  return {
    messages: [
      "Please complete the payment using the secure hospital payment link. I will continue once the payment is verified."
    ],
    amount,
    currency: "{{currency}}",
    provider: "razorpay",
    autoVerify: true,
    paymentLink: "{{payment_link}}",
    description,
    customerName: "{{patient_name}}",
    customerEmail: "{{patient_email}}",
    customerContact: "{{patient_mobile}}",
    notifySms: true,
    notifyEmail: true,
    expireMinutes: 10,
    callbackUrl: "",
    notesJson: pretty({ session_id: "{{system.sessionId}}", channel: "{{system.channel}}" }),
    outputVar
  };
}

function auditData({ action, entityType, entityId, metadata, sensitivity, outputVar }) {
  return {
    action,
    entityType,
    entityId,
    metadata,
    metadataJson: pretty(metadata),
    sensitivity,
    failurePolicy: "continue",
    piiMasking: true,
    outputVar
  };
}

function schedulerData({ runAt, offsetValue, offsetUnit, offsetDirection, payload, outputVar, dedupeSuffix }) {
  return {
    scheduleType: "relative",
    runAt,
    offsetValue,
    offsetUnit,
    offsetDirection,
    timezone: "Asia/Kolkata",
    dedupeKey: `{{system.sessionId}}:${dedupeSuffix}`,
    payload,
    payloadJson: pretty(payload),
    maxExecutions: 1,
    expiryAt: "",
    pastTimePolicy: "send_immediately",
    sendWindowStart: "08:00",
    sendWindowEnd: "20:00",
    sendWindowTimezone: "Asia/Kolkata",
    outsideWindowPolicy: "send_next_window",
    outputVar
  };
}

function pretty(value) {
  return JSON.stringify(value, null, 2);
}

const patientFields = [
  { key: "patient_name", label: "Patient name", type: "text", required: true },
  { key: "patient_mobile", label: "Mobile number", type: "phone", required: true },
  { key: "patient_email", label: "Email", type: "email", required: false },
  { key: "patient_age", label: "Age", type: "number", required: false },
  { key: "patient_gender", label: "Gender", type: "select", required: false, options: ["female", "male", "other", "prefer_not_to_say"] },
  { key: "patient_location", label: "Nearest branch or area", type: "text", required: false },
  { key: "preferred_language", label: "Preferred language", type: "select", required: false, options: ["english", "hindi", "telugu", "tamil", "kannada"] }
];

const bookingPatientDetailFields = patientFields.filter((field) => field.key !== "patient_mobile");

const schemas = {
  patients: {
    collection: "patients",
    fields: {
      patient_id: { type: "string", required: true, unique: true },
      name: { type: "string", required: true },
      mobile: { type: "phone", required: true, unique: true },
      email: { type: "email", required: false },
      age: { type: "number", required: false },
      gender: { type: "string", required: false },
      location: { type: "string", required: false },
      preferred_language: { type: "string", required: false }
    }
  },
  appointments: {
    collection: "appointments",
    fields: {
      appointment_id: { type: "string", required: true, unique: true },
      patient_id: { type: "string", required: true },
      patient_mobile: { type: "phone", required: true },
      branch_id: { type: "string", required: false },
      consultation_type: { type: "string", required: false },
      department: { type: "string", required: true },
      doctor_id: { type: "string", required: false },
      slot_id: { type: "string", required: false },
      slot_label: { type: "string", required: false },
      slot_hold_id: { type: "string", required: false },
      appointment_date: { type: "string", required: false },
      appointment_time: { type: "string", required: false },
      status: { type: "enum", values: ["pending_payment", "confirmed", "manual_verify", "cancelled", "reschedule_requested", "completed"] },
      payment_status: { type: "enum", values: ["paid", "pending", "pay_at_hospital", "failed", "manual_verify"] }
    }
  },
  appointmentSlots: {
    collection: "appointment_slots",
    fields: {
      id: { type: "string", required: true, unique: true },
      slot_id: { type: "string", required: true, unique: true },
      doctor_id: { type: "string", required: true },
      department: { type: "string", required: true },
      date: { type: "string", required: true },
      label: { type: "string", required: true },
      start: { type: "string", required: true },
      end: { type: "string", required: false },
      status: { type: "enum", values: ["available", "held", "booked", "blocked"] },
      hold_id: { type: "string", required: false },
      held_by_session: { type: "string", required: false },
      patient_mobile: { type: "phone", required: false },
      appointment_id: { type: "string", required: false },
      branch_id: { type: "string", required: false },
      consultation_mode: { type: "string", required: false },
      hold_ttl_minutes: { type: "number", required: false }
    }
  },
  consentRecords: {
    collection: "consent_records",
    fields: {
      consent_id: { type: "string", required: true, unique: true },
      consent_type: { type: "string", required: true },
      consent_status: { type: "enum", values: ["accepted", "declined"] },
      patient_mobile: { type: "phone", required: false },
      related_entity_id: { type: "string", required: false },
      purpose: { type: "string", required: true },
      channel: { type: "string", required: true },
      session_id: { type: "string", required: true },
      sensitivity: { type: "string", required: true }
    }
  },
  payments: {
    collection: "payments",
    fields: {
      payment_id: { type: "string", required: true, unique: true },
      appointment_id: { type: "string", required: false },
      amount: { type: "number", required: true },
      currency: { type: "string", required: true },
      status: { type: "string", required: true },
      transaction_ref: { type: "string", required: false }
    }
  },
  labReports: {
    collection: "lab_reports",
    fields: {
      report_id: { type: "string", required: true, unique: true },
      patient_mobile: { type: "phone", required: true },
      status: { type: "string", required: true },
      report_link: { type: "url", required: false },
      share_allowed: { type: "boolean", required: true }
    }
  },
  labRequests: {
    collection: "lab_requests",
    fields: {
      lab_request_id: { type: "string", required: true, unique: true },
      test_id: { type: "string", required: true },
      patient_mobile: { type: "phone", required: true },
      sample_collection_type: { type: "string", required: true },
      location: { type: "string", required: false },
      preferred_date: { type: "string", required: false },
      preferred_time: { type: "string", required: false },
      status: { type: "string", required: true }
    }
  },
  tickets: {
    collection: "support_tickets",
    fields: {
      ticket_id: { type: "string", required: true, unique: true },
      patient_mobile: { type: "phone", required: false },
      department: { type: "string", required: true },
      priority: { type: "string", required: true },
      issue_type: { type: "string", required: true },
      status: { type: "string", required: true },
      conversation_summary: { type: "string", required: false }
    }
  },
  insurance: {
    collection: "insurance_cases",
    fields: {
      insurance_id: { type: "string", required: true, unique: true },
      patient_mobile: { type: "phone", required: true },
      insurer_name: { type: "string", required: true },
      policy_number: { type: "string", required: true },
      case_status: { type: "string", required: true }
    }
  },
  admissions: {
    collection: "admissions",
    fields: {
      admission_id: { type: "string", required: true, unique: true },
      patient_mobile: { type: "phone", required: true },
      department: { type: "string", required: true },
      room_type: { type: "string", required: false },
      status: { type: "string", required: true }
    }
  },
  followUps: {
    collection: "follow_ups",
    fields: {
      followup_id: { type: "string", required: true, unique: true },
      appointment_id: { type: "string", required: true },
      patient_mobile: { type: "phone", required: true },
      followup_time: { type: "string", required: false },
      status: { type: "string", required: true }
    }
  },
  doctors: {
    collection: "doctors",
    fields: {
      doctor_id: { type: "string", required: true, unique: true },
      display_name: { type: "string", required: true },
      department: { type: "string", required: true },
      qualification: { type: "string", required: false },
      languages: { type: "string", required: false },
      branch_id: { type: "string", required: false },
      consultation_mode: { type: "string", required: false },
      consultation_fee: { type: "number", required: false },
      profile_summary: { type: "string", required: false },
      image_url: { type: "url", required: false },
      next_available_slot: { type: "string", required: false }
    }
  }
};

function patientUpsert(outputVar) {
  return recordData({
    action: "upsert",
    collection: "patients",
    where: { mobile: "{{patient_mobile}}" },
    data: {
      patient_id: "PAT-{{patient_mobile}}",
      name: "{{patient_name}}",
      mobile: "{{patient_mobile}}",
      email: "{{patient_email}}",
      age: "{{patient_age}}",
      gender: "{{patient_gender}}",
      location: "{{patient_location}}",
      preferred_language: "{{preferred_language}}"
    },
    schema: schemas.patients,
    uniqueKey: "mobile",
    idempotencyKey: "{{system.sessionId}}:patient",
    outputVar,
    encryptPii: true,
    piiFields: "name,mobile,email,age,gender,location"
  });
}

function consentRecordData({ id, type, status, purpose, relatedEntityId = "", patientMobile = "{{patient_mobile}}", outputVar }) {
  const data = {
    consent_id: id,
    consent_type: type,
    consent_status: status,
    related_entity_id: relatedEntityId,
    purpose,
    channel: "{{system.channel}}",
    session_id: "{{system.sessionId}}",
    sensitivity: "medical"
  };
  if (patientMobile) data.patient_mobile = patientMobile;

  return recordData({
    action: "upsert",
    collection: "consent_records",
    where: { consent_id: id },
    data,
    schema: schemas.consentRecords,
    uniqueKey: "consent_id",
    idempotencyKey: id,
    outputVar,
    encryptPii: true,
    piiFields: "patient_mobile"
  });
}

function queueToHandover(queueId, handoverId) {
  edge(queueId, handoverId, { condition: { operator: "equals", value: "assigned" }, label: "assigned" });
  edge(queueId, handoverId, { condition: { operator: "equals", value: "queued" }, label: "queued" });
  edge(queueId, handoverId, { isDefault: true, label: "failed/default" });
}

function recordSuccessOrManual(recordId, successId, manualId) {
  if (successId === manualId) {
    edge(recordId, successId, { label: "continue" });
    return;
  }
  edge(recordId, successId, { condition: { operator: "equals", value: "success" }, label: "success" });
  edge(recordId, successId, { condition: { operator: "equals", value: "duplicate" }, label: "duplicate" });
  edge(recordId, manualId, { isDefault: true, label: "not_found/failed/default" });
}

function recordSuccessOnly(recordId, successId, fallbackId) {
  edge(recordId, successId, { condition: { operator: "equals", value: "success" }, label: "success" });
  edge(recordId, fallbackId, { isDefault: true, label: "not_found/duplicate/failed/default" });
}

function recordContinue(recordId, nextId) {
  edge(recordId, nextId, { label: "continue" });
}

function notifyToNext(notificationId, nextId) {
  edge(notificationId, nextId, { condition: { operator: "equals", value: "sent" }, label: "sent" });
  edge(notificationId, nextId, { condition: { operator: "equals", value: "partially_sent" }, label: "partially_sent" });
  edge(notificationId, nextId, { isDefault: true, label: "failed/default" });
}

function auditToNext(auditId, nextId) {
  edge(auditId, nextId, { condition: { operator: "equals", value: "logged" }, label: "logged" });
  edge(auditId, nextId, { isDefault: true, label: "failed/default" });
}

function schedulerToNext(schedulerId, nextId) {
  edge(schedulerId, nextId, { condition: { operator: "equals", value: "scheduled" }, label: "scheduled" });
  edge(schedulerId, nextId, { condition: { operator: "equals", value: "skipped" }, label: "skipped" });
  edge(schedulerId, nextId, { isDefault: true, label: "failed/default" });
}

node("start_1", "start", 80, 260, { messages: [] });
node("set_template_defaults", "setVariable", 320, 260, setVars({
  service_context: "hospital_operations",
  case_priority: "normal",
  escalation_policy: "human_for_medical_financial_legal_decisions"
}));
node(
  "welcome_message",
  "message",
  560,
  260,
  msgData(
    "Welcome to {{hospital_name}}. I can help with appointments, doctor availability, lab reports, billing, insurance, admissions, health packages, and connecting you to the hospital team. For emergencies, call {{emergency_phone}} immediately."
  )
);
node("language_detection", "language", 680, 260, {
  action: "detect",
  inputText: "{{input}}",
  targetLanguage: "en",
  supportedLanguagesCsv: "en,hi,te,ta,kn,ml,mr,bn,gu,pa,ur",
  lowConfidenceThreshold: 0.7,
  outputVar: "language_result",
  preferredLanguageVar: "preferred_language"
});
node("language_selection_input", "input", 800, 120, inputData("Choose your preferred language.", "preferred_language", [
  { label: "English", value: "en" },
  { label: "Hindi", value: "hi" },
  { label: "Telugu", value: "te" },
  { label: "Tamil", value: "ta" }
]));
node("default_language_message", "message", 800, 400, msgData("I will continue in English. You can still type your request in the language you prefer."));
node(
  "main_request_input",
  "input",
  1040,
  260,
  inputData("Tell me what you need today, for example: book an appointment, check a report, ask about billing, request an ambulance, or speak with the hospital team.", "main_user_request", [])
);
node("main_intent_router", "intent-router", 1280, 260, {
  intents: [
    { key: "book_appointment", label: "Book appointment" },
    { key: "existing_patient_booking", label: "Existing patient booking" },
    { key: "appointment_status", label: "Appointment status" },
    { key: "reschedule_appointment", label: "Reschedule appointment" },
    { key: "cancel_appointment", label: "Cancel appointment" },
    { key: "doctor_availability", label: "Doctor availability" },
    { key: "doctor_profile", label: "Doctor profile or timings" },
    { key: "department_help", label: "Department guidance" },
    { key: "online_consultation", label: "Online consultation" },
    { key: "follow_up", label: "Follow-up booking" },
    { key: "second_opinion", label: "Second opinion" },
    { key: "health_packages", label: "Health packages" },
    { key: "vaccination_services", label: "Vaccination services" },
    { key: "lab_tests", label: "Lab tests" },
    { key: "report_status", label: "Report status" },
    { key: "billing_support", label: "Billing support" },
    { key: "insurance_help", label: "Insurance help" },
    { key: "admission_enquiry", label: "Admission or bed enquiry" },
    { key: "surgery_procedure_help", label: "Surgery or procedure help" },
    { key: "discharge_support", label: "Discharge support" },
    { key: "pharmacy_help", label: "Pharmacy" },
    { key: "medical_records", label: "Medical records" },
    { key: "home_care_services", label: "Home care services" },
    { key: "patient_transport", label: "Patient transport" },
    { key: "blood_bank_help", label: "Blood bank help" },
    { key: "hospital_locations", label: "Hospital locations" },
    { key: "general_hospital_question", label: "General hospital question" },
    { key: "feedback_complaint", label: "Feedback or complaint" },
    { key: "emergency_help", label: "Emergency department" },
    { key: "ambulance_request", label: "Ambulance" },
    { key: "emergency_contact", label: "Emergency contact details" },
    { key: "talk_to_hospital", label: "Talk to hospital" }
  ],
  fallbackIntent: "unknown"
});
node("vaccination_services_intro", "message", 1800, 1760, msgData("I can help with vaccination information, eligibility, pricing, and booking support."));
node("vaccination_services_form", "form", 2040, 1760, formData("Share vaccination request details.", [
  ...patientFields,
  { key: "vaccine_name", label: "Vaccine name or purpose", type: "text", required: true },
  { key: "preferred_branch", label: "Preferred branch", type: "text", required: false },
  { key: "preferred_date", label: "Preferred date", type: "date", required: false }
], "vaccination_form_result"));
node("vaccination_services_record", "record", 2280, 1760, recordData({
  action: "upsert",
  collection: "support_tickets",
  where: { ticket_id: "VAC-{{system.sessionId}}" },
  data: { ticket_id: "VAC-{{system.sessionId}}", patient_mobile: "{{patient_mobile}}", department: "front_desk", priority: "normal", issue_type: "vaccination_services", status: "open", conversation_summary: "{{vaccine_name}} {{preferred_branch}} {{preferred_date}}" },
  schema: schemas.tickets,
  uniqueKey: "ticket_id",
  idempotencyKey: "VAC-{{system.sessionId}}",
  outputVar: "vaccination_ticket_result",
  encryptPii: true,
  piiFields: "patient_mobile,conversation_summary"
}));
node("vaccination_services_confirmation", "message", 2520, 1760, msgData("Your vaccination request has been received. The hospital team will confirm eligibility, stock, and next available slot."));
node("vaccination_services_end", "end", 2760, 1760, { messages: [] });
node("second_opinion_intro", "message", 1800, 1420, msgData("I can help start a second opinion request. Please do not use this chat for emergencies."));
node("second_opinion_form", "form", 2040, 1420, formData("Share patient and second opinion details.", [
  ...patientFields,
  { key: "second_opinion_department", label: "Department", type: "text", required: true },
  { key: "second_opinion_summary", label: "Reason for second opinion", type: "textarea", required: true }
], "second_opinion_form_result"));
node("second_opinion_record", "record", 2280, 1420, recordData({
  action: "upsert",
  collection: "support_tickets",
  where: { ticket_id: "SO-{{system.sessionId}}" },
  data: { ticket_id: "SO-{{system.sessionId}}", patient_mobile: "{{patient_mobile}}", department: "doctor_callback", priority: "normal", issue_type: "second_opinion", status: "open", conversation_summary: "{{second_opinion_department}} {{second_opinion_summary}}" },
  schema: schemas.tickets,
  uniqueKey: "ticket_id",
  idempotencyKey: "SO-{{system.sessionId}}",
  outputVar: "second_opinion_ticket_result",
  encryptPii: true,
  piiFields: "patient_mobile,conversation_summary"
}));
node("second_opinion_confirmation", "message", 2520, 1420, msgData("Your second opinion request has been received. A suitable specialist review path will be arranged."));
node("second_opinion_end", "end", 2760, 1420, { messages: [] });
node("surgery_procedure_intro", "message", 1800, 3820, msgData("I can help with procedure information, required tests, cost-estimate requests, or scheduling a consultation."));
node("surgery_procedure_form", "form", 2040, 3820, formData("Share procedure support details.", [
  ...patientFields,
  { key: "procedure_department", label: "Department or procedure", type: "text", required: true },
  { key: "procedure_help_type", label: "Support needed", type: "select", required: true, options: ["procedure_information", "cost_estimate", "required_tests", "schedule_consultation"] }
], "surgery_procedure_form_result"));
node("surgery_procedure_record", "record", 2280, 3820, recordData({
  action: "upsert",
  collection: "support_tickets",
  where: { ticket_id: "PROC-{{system.sessionId}}" },
  data: { ticket_id: "PROC-{{system.sessionId}}", patient_mobile: "{{patient_mobile}}", department: "admission_support", priority: "normal", issue_type: "{{procedure_help_type}}", status: "open", conversation_summary: "{{procedure_department}}" },
  schema: schemas.tickets,
  uniqueKey: "ticket_id",
  idempotencyKey: "PROC-{{system.sessionId}}",
  outputVar: "surgery_procedure_ticket_result",
  encryptPii: true,
  piiFields: "patient_mobile,conversation_summary"
}));
node("surgery_procedure_confirmation", "message", 2520, 3820, msgData("Your procedure support request has been received. The relevant hospital team will review and respond with next steps."));
node("surgery_procedure_end", "end", 2760, 3820, { messages: [] });
node("discharge_support_form", "form", 1800, 3860, formData("Share discharge support details.", [
  { key: "patient_name", label: "Patient name", type: "text", required: true },
  { key: "patient_mobile", label: "Mobile number", type: "phone", required: true },
  { key: "admission_id", label: "Admission ID", type: "text", required: false },
  { key: "discharge_need", label: "Support needed", type: "select", required: true, options: ["discharge_status", "final_bill_status", "discharge_summary", "medicine_instructions", "follow_up_appointment", "transport"] }
], "discharge_support_form_result"));
node("discharge_support_record", "record", 2040, 3860, recordData({
  action: "upsert",
  collection: "support_tickets",
  where: { ticket_id: "DIS-{{system.sessionId}}" },
  data: { ticket_id: "DIS-{{system.sessionId}}", patient_mobile: "{{patient_mobile}}", department: "admission_support", priority: "normal", issue_type: "{{discharge_need}}", status: "open", conversation_summary: "{{admission_id}}" },
  schema: schemas.tickets,
  uniqueKey: "ticket_id",
  idempotencyKey: "DIS-{{system.sessionId}}",
  outputVar: "discharge_ticket_result",
  encryptPii: true,
  piiFields: "patient_mobile,conversation_summary"
}));
node("discharge_support_confirmation", "message", 2280, 3860, msgData("Your discharge support request has been received. The hospital team will confirm status and next steps."));
node("discharge_support_end", "end", 2520, 3860, { messages: [] });
node("medical_records_form", "form", 1800, 4040, formData("Share medical record request details.", [
  { key: "patient_name", label: "Patient name", type: "text", required: true },
  { key: "patient_mobile", label: "Registered mobile number", type: "phone", required: true },
  { key: "record_type", label: "Document needed", type: "select", required: true, options: ["prescription", "discharge_summary", "medical_certificate", "previous_reports", "invoice_receipt", "full_record_request"] },
  { key: "visit_or_record_id", label: "Visit or record ID", type: "text", required: false }
], "medical_records_form_result"));
node("medical_records_consent", "auth-consent", 2040, 4040, {
  consentText: "Medical records are sensitive information. Reply YES to confirm consent before this request is processed.",
  requireOtp: false,
  otpVar: "medical_records_otp",
  outputVar: "medical_records_consent_status"
});
node("medical_records_record", "record", 2280, 4040, recordData({
  action: "upsert",
  collection: "support_tickets",
  where: { ticket_id: "MR-{{system.sessionId}}" },
  data: { ticket_id: "MR-{{system.sessionId}}", patient_mobile: "{{patient_mobile}}", department: "front_desk", priority: "normal", issue_type: "medical_records", status: "open", conversation_summary: "{{record_type}} {{visit_or_record_id}}" },
  schema: schemas.tickets,
  uniqueKey: "ticket_id",
  idempotencyKey: "MR-{{system.sessionId}}",
  outputVar: "medical_records_ticket_result",
  encryptPii: true,
  piiFields: "patient_mobile,conversation_summary"
}));
node("medical_records_confirmation", "message", 2520, 4040, msgData("Your medical record request has been received after consent. Records will be shared only through approved secure channels."));
node("medical_records_end", "end", 2760, 4040, { messages: [] });
node("home_care_form", "form", 1800, 4300, formData("Share home care service details.", [
  ...patientFields,
  { key: "home_care_service", label: "Service needed", type: "select", required: true, options: ["home_nursing", "physiotherapy", "doctor_home_visit", "home_sample_collection", "elder_care", "medical_equipment"] },
  { key: "home_address", label: "Service address", type: "textarea", required: true }
], "home_care_form_result"));
node("home_care_record", "record", 2040, 4300, recordData({
  action: "upsert",
  collection: "support_tickets",
  where: { ticket_id: "HOME-{{system.sessionId}}" },
  data: { ticket_id: "HOME-{{system.sessionId}}", patient_mobile: "{{patient_mobile}}", department: "front_desk", priority: "normal", issue_type: "{{home_care_service}}", status: "open", conversation_summary: "{{home_address}}" },
  schema: schemas.tickets,
  uniqueKey: "ticket_id",
  idempotencyKey: "HOME-{{system.sessionId}}",
  outputVar: "home_care_ticket_result",
  encryptPii: true,
  piiFields: "patient_mobile,conversation_summary"
}));
node("home_care_confirmation", "message", 2280, 4300, msgData("Your home care request has been received. Serviceability and available options will be confirmed."));
node("home_care_end", "end", 2520, 4300, { messages: [] });
node("patient_transport_form", "form", 1800, 4380, formData("Share patient transport details.", [
  ...patientFields,
  { key: "transport_type", label: "Transport type", type: "select", required: true, options: ["hospital_pickup", "discharge_transport", "inter_branch_transport", "wheelchair_assistance", "non_emergency_ambulance"] },
  { key: "pickup_location", label: "Pickup location", type: "textarea", required: true },
  { key: "destination_location", label: "Destination", type: "textarea", required: true }
], "patient_transport_form_result"));
node("patient_transport_record", "record", 2040, 4380, recordData({
  action: "upsert",
  collection: "support_tickets",
  where: { ticket_id: "TRANS-{{system.sessionId}}" },
  data: { ticket_id: "TRANS-{{system.sessionId}}", patient_mobile: "{{patient_mobile}}", department: "front_desk", priority: "normal", issue_type: "{{transport_type}}", status: "open", conversation_summary: "{{pickup_location}} to {{destination_location}}" },
  schema: schemas.tickets,
  uniqueKey: "ticket_id",
  idempotencyKey: "TRANS-{{system.sessionId}}",
  outputVar: "patient_transport_ticket_result",
  encryptPii: true,
  piiFields: "patient_mobile,conversation_summary"
}));
node("patient_transport_confirmation", "message", 2280, 4380, msgData("Your patient transport request has been received. Availability and next steps will be confirmed."));
node("patient_transport_end", "end", 2520, 4380, { messages: [] });
node("blood_bank_form", "form", 1800, 4500, formData("Share blood bank request details.", [
  { key: "patient_name", label: "Name", type: "text", required: true },
  { key: "patient_mobile", label: "Mobile number", type: "phone", required: true },
  { key: "blood_bank_action", label: "Request type", type: "select", required: true, options: ["check_availability", "request_blood", "donate_blood", "donor_eligibility", "emergency_contact"] },
  { key: "blood_group", label: "Blood group", type: "select", required: false, options: ["a_positive", "a_negative", "b_positive", "b_negative", "ab_positive", "ab_negative", "o_positive", "o_negative"] },
  { key: "blood_component", label: "Component", type: "select", required: false, options: ["whole_blood", "platelets", "plasma", "packed_cells"] }
], "blood_bank_form_result"));
node("blood_bank_record", "record", 2040, 4500, recordData({
  action: "upsert",
  collection: "support_tickets",
  where: { ticket_id: "BLOOD-{{system.sessionId}}" },
  data: { ticket_id: "BLOOD-{{system.sessionId}}", patient_mobile: "{{patient_mobile}}", department: "front_desk", priority: "high", issue_type: "{{blood_bank_action}}", status: "open", conversation_summary: "{{blood_group}} {{blood_component}}" },
  schema: schemas.tickets,
  uniqueKey: "ticket_id",
  idempotencyKey: "BLOOD-{{system.sessionId}}",
  outputVar: "blood_bank_ticket_result",
  encryptPii: true,
  piiFields: "patient_mobile,conversation_summary"
}));
node("blood_bank_confirmation", "message", 2280, 4500, msgData("Your blood bank request has been received. Availability and required next steps will be confirmed by the hospital team."));
node("blood_bank_end", "end", 2520, 4500, { messages: [] });
node("general_hospital_question_input", "input", 1800, 4180, inputData("Ask your hospital information question.", "general_hospital_question", []));
node("general_hospital_question_answer", "ai-grounded", 2040, 4180, {
  instruction: "Answer only from hospital operational scope: locations, timings, facilities, departments, parking, accessibility, billing contacts, reports, appointments, and emergency contact guidance. Do not diagnose or provide medical advice.",
  context: "Hospital support scope: appointments, doctor availability, health packages, lab tests, report status, billing support, insurance help, admission enquiry, locations, follow-up, emergency routing, and hospital staff connection.",
  question: "{{general_hospital_question}}",
  fallbackMessage: "I do not have enough verified hospital information to answer that safely.",
  outputVar: "general_hospital_answer_result",
  answerVar: "general_hospital_answer"
});
node("general_hospital_question_message", "message", 2280, 4180, msgData("{{general_hospital_answer}}"));
node("general_hospital_question_end", "end", 2520, 4180, { messages: [] });

edge("start_1", "set_template_defaults");
edge("set_template_defaults", "welcome_message");
edge("welcome_message", "language_detection");
edge("language_detection", "main_request_input", { condition: { operator: "equals", value: "detected" }, label: "detected" });
edge("language_detection", "language_selection_input", { condition: { operator: "equals", value: "low_confidence" }, label: "low_confidence" });
edge("language_detection", "default_language_message", { condition: { operator: "equals", value: "unsupported" }, label: "unsupported" });
edge("language_detection", "default_language_message", { isDefault: true, label: "failed/default" });
edge("language_selection_input", "main_request_input");
edge("default_language_message", "main_request_input");
edge("main_request_input", "main_intent_router");

const mainRoutes = [
  ["book_appointment", "appointment_intro"],
  ["existing_patient_booking", "existing_patient_lookup_form"],
  ["appointment_status", "existing_appointment_form"],
  ["reschedule_appointment", "reschedule_mobile_form"],
  ["cancel_appointment", "cancel_mobile_form"],
  ["doctor_availability", "availability_intro"],
  ["doctor_profile", "doctor_profile_input"],
  ["department_help", "department_reason_input"],
  ["online_consultation", "online_patient_lookup_form"],
  ["follow_up", "followup_form"],
  ["second_opinion", "second_opinion_intro"],
  ["health_packages", "packages_carousel"],
  ["vaccination_services", "vaccination_services_intro"],
  ["lab_tests", "lab_form"],
  ["report_status", "report_form"],
  ["billing_support", "billing_form"],
  ["insurance_help", "insurance_form"],
  ["admission_enquiry", "admission_form"],
  ["surgery_procedure_help", "surgery_procedure_intro"],
  ["discharge_support", "discharge_support_form"],
  ["pharmacy_help", "pharmacy_form"],
  ["medical_records", "medical_records_form"],
  ["home_care_services", "home_care_form"],
  ["patient_transport", "patient_transport_form"],
  ["blood_bank_help", "blood_bank_form"],
  ["hospital_locations", "locations_carousel"],
  ["general_hospital_question", "general_hospital_question_input"],
  ["feedback_complaint", "feedback_form"],
  ["emergency_help", "emergency_safety_message"],
  ["ambulance_request", "ambulance_safety_message"],
  ["emergency_contact", "locations_carousel"],
  ["talk_to_hospital", "talk_form"]
];

for (const [value, target] of mainRoutes) {
  edge("main_intent_router", target, { condition: { operator: "equals", value }, label: value });
}
edge("main_intent_router", "unknown_faq", { isDefault: true, label: "default" });
edge("vaccination_services_intro", "vaccination_services_form");
edge("vaccination_services_form", "vaccination_services_record");
recordSuccessOrManual("vaccination_services_record", "vaccination_services_confirmation", "vaccination_services_confirmation");
edge("vaccination_services_confirmation", "vaccination_services_end");
edge("second_opinion_intro", "second_opinion_form");
edge("second_opinion_form", "second_opinion_record");
recordSuccessOrManual("second_opinion_record", "second_opinion_confirmation", "second_opinion_confirmation");
edge("second_opinion_confirmation", "second_opinion_end");
edge("surgery_procedure_intro", "surgery_procedure_form");
edge("surgery_procedure_form", "surgery_procedure_record");
recordSuccessOrManual("surgery_procedure_record", "surgery_procedure_confirmation", "surgery_procedure_confirmation");
edge("surgery_procedure_confirmation", "surgery_procedure_end");
edge("discharge_support_form", "discharge_support_record");
recordSuccessOrManual("discharge_support_record", "discharge_support_confirmation", "discharge_support_confirmation");
edge("discharge_support_confirmation", "discharge_support_end");
edge("medical_records_form", "medical_records_consent");
edge("medical_records_consent", "medical_records_record", { condition: { operator: "equals", value: "accepted" }, label: "accepted" });
edge("medical_records_consent", "medical_records_end", { isDefault: true, label: "denied/default" });
recordSuccessOrManual("medical_records_record", "medical_records_confirmation", "medical_records_confirmation");
edge("medical_records_confirmation", "medical_records_end");
edge("home_care_form", "home_care_record");
recordSuccessOrManual("home_care_record", "home_care_confirmation", "home_care_confirmation");
edge("home_care_confirmation", "home_care_end");
edge("patient_transport_form", "patient_transport_record");
recordSuccessOrManual("patient_transport_record", "patient_transport_confirmation", "patient_transport_confirmation");
edge("patient_transport_confirmation", "patient_transport_end");
edge("blood_bank_form", "blood_bank_record");
recordSuccessOrManual("blood_bank_record", "blood_bank_confirmation", "blood_bank_confirmation");
edge("blood_bank_confirmation", "blood_bank_end");
edge("general_hospital_question_input", "general_hospital_question_answer");
edge("general_hospital_question_answer", "general_hospital_question_message", { condition: { operator: "equals", value: "grounded" }, label: "grounded" });
edge("general_hospital_question_answer", "unknown_faq", { isDefault: true, label: "fallback/default" });
edge("general_hospital_question_message", "general_hospital_question_end");

node("emergency_safety_message", "message", 1320, 0, msgData("If this is a medical emergency, call {{emergency_phone}} or go to the nearest emergency department now. I will also connect you to the emergency team."));
node("emergency_form", "form", 1560, 0, formData("Share callback and location details for emergency escalation. Do not wait for the chat if the situation is urgent.", [
  { key: "patient_name", label: "Patient name", type: "text", required: false },
  { key: "patient_mobile", label: "Callback mobile number", type: "phone", required: true },
  { key: "patient_email", label: "Email", type: "email", required: false },
  { key: "emergency_location", label: "Current location", type: "textarea", required: true },
  { key: "emergency_reason", label: "Emergency reason", type: "textarea", required: false }
], "emergency_form_result"));
node("emergency_ticket_record", "record", 1800, 0, recordData({
  action: "upsert",
  collection: "support_tickets",
  where: { ticket_id: "EMG-{{system.sessionId}}" },
  data: {
    ticket_id: "EMG-{{system.sessionId}}",
    patient_mobile: "{{patient_mobile}}",
    department: "emergency_support",
    priority: "critical",
    issue_type: "emergency_help",
    status: "open",
    conversation_summary: "{{emergency_reason}} | Location: {{emergency_location}}"
  },
  schema: schemas.tickets,
  uniqueKey: "ticket_id",
  idempotencyKey: "EMG-{{system.sessionId}}",
  outputVar: "emergency_ticket_result",
  encryptPii: true,
  piiFields: "patient_mobile,conversation_summary"
}));
node("emergency_audit", "audit-log", 2040, 0, auditData({
  action: "emergency_help_requested",
  entityType: "support_ticket",
  entityId: "EMG-{{system.sessionId}}",
  metadata: { channel: "{{system.channel}}", priority: "critical", source: "main_intent_router" },
  sensitivity: "medical",
  outputVar: "emergency_audit_result"
}));
node("emergency_queue", "queue", 2280, 0, queueData("emergency_support", "critical", "emergency,front_desk", 1, "emergency_queue_result"));
node("emergency_handover", "handover", 2520, 0, handoverData("Connecting you to the emergency support team now. Keep calling {{emergency_phone}} if the situation is urgent."));
edge("emergency_safety_message", "emergency_form");
edge("emergency_form", "emergency_ticket_record");
recordSuccessOrManual("emergency_ticket_record", "emergency_audit", "emergency_audit");
auditToNext("emergency_audit", "emergency_queue");
queueToHandover("emergency_queue", "emergency_handover");

node("ambulance_safety_message", "message", 1320, 160, msgData("If ambulance support is urgent, call {{emergency_phone}} immediately. I will collect pickup details and alert the emergency team."));
node("ambulance_form", "form", 1560, 160, formData("Share ambulance pickup details.", [
  { key: "patient_name", label: "Patient name", type: "text", required: true },
  { key: "patient_mobile", label: "Callback mobile number", type: "phone", required: true },
  { key: "patient_email", label: "Email", type: "email", required: false },
  { key: "pickup_location", label: "Pickup location", type: "textarea", required: true },
  { key: "emergency_reason", label: "Emergency reason", type: "textarea", required: true }
], "ambulance_form_result"));
node("ambulance_ticket_record", "record", 1800, 160, recordData({
  action: "upsert",
  collection: "support_tickets",
  where: { ticket_id: "AMB-{{system.sessionId}}" },
  data: {
    ticket_id: "AMB-{{system.sessionId}}",
    patient_mobile: "{{patient_mobile}}",
    department: "emergency_support",
    priority: "critical",
    issue_type: "ambulance_request",
    status: "open",
    conversation_summary: "{{emergency_reason}} | Pickup: {{pickup_location}}"
  },
  schema: schemas.tickets,
  uniqueKey: "ticket_id",
  idempotencyKey: "AMB-{{system.sessionId}}",
  outputVar: "ambulance_ticket_result",
  encryptPii: true,
  piiFields: "patient_mobile,conversation_summary"
}));
node("ambulance_notify", "notification", 2040, 160, notificationData({
  templateId: "ambulance_request_alert",
  sms: "Ambulance request received. Emergency team will call back immediately.",
  emailSubject: "Ambulance request received",
  emailBody: "Ambulance request received. Emergency team will call back immediately.",
  outputVar: "ambulance_notification_result",
  dedupeSuffix: "ambulance_request"
}));
node("ambulance_queue", "queue", 2280, 160, queueData("emergency_support", "critical", "emergency,ambulance,front_desk", 1, "ambulance_queue_result"));
node("ambulance_handover", "handover", 2520, 160, handoverData("Connecting you to emergency support for ambulance coordination now."));
edge("ambulance_safety_message", "ambulance_form");
edge("ambulance_form", "ambulance_ticket_record");
recordSuccessOrManual("ambulance_ticket_record", "ambulance_notify", "ambulance_queue");
notifyToNext("ambulance_notify", "ambulance_queue");
queueToHandover("ambulance_queue", "ambulance_handover");

node("appointment_intro", "message", 1320, 420, msgData("I will help you book a hospital appointment. First, I will check whether the patient already has a hospital profile or an upcoming appointment."));
node("appointment_consent", "auth-consent", 1440, 420, {
  consentText: "To book the appointment, I need to collect and save the patient details, selected doctor, slot, payment status, and reminder preference. Reply YES to continue.",
  requireOtp: false,
  otpVar: "appointment_consent_otp",
  outputVar: "appointment_booking_consent"
});
node("appointment_consent_accept_record", "record", 1560, 300, consentRecordData({
  id: "CONS-APPT-{{system.sessionId}}",
  type: "appointment_booking",
  status: "accepted",
  purpose: "Appointment booking consent for patient details, slot hold, payment status, confirmation, and reminder scheduling.",
  outputVar: "appointment_consent_accept_record_result"
}));
node("appointment_consent_decline_record", "record", 1560, 560, consentRecordData({
  id: "CONS-APPT-DENIED-{{system.sessionId}}",
  type: "appointment_booking",
  status: "declined",
  purpose: "Appointment booking consent declined before continuing into appointment selection.",
  outputVar: "appointment_consent_decline_record_result"
}));
node("appointment_consent_declined_message", "message", 1800, 560, msgData("I cannot continue with appointment booking without consent to save the required appointment details."));
node("appointment_consent_declined_end", "end", 2040, 560, { messages: [] });
node("appointment_patient_flow_router", "switch", 1680, 420, { variable: "appointment_patient_flow_type" });
node("appointment_patient_form", "form", 1560, 420, formData("Please share the remaining patient details for the appointment.", bookingPatientDetailFields, "patient_form"));
node("appointment_patient_record", "record", 1800, 420, patientUpsert("appointment_patient_record_result"));
node("appointment_branch_input", "input", 2040, 420, inputData("Choose the hospital branch.", "branch_id", [
  { label: "Main Branch", value: "main_branch" },
  { label: "North Branch", value: "north_branch" },
  { label: "South Branch", value: "south_branch" }
]));
node("appointment_consultation_type_input", "input", 2280, 420, inputData("Choose consultation type.", "consultation_type", [
  { label: "Hospital visit", value: "in_person" },
  { label: "Online consultation", value: "online" }
]));
node("appointment_department_input", "input", 2520, 420, inputData("Choose the department.", "department", [
  { label: "General Medicine", value: "general_medicine" },
  { label: "Cardiology", value: "cardiology" },
  { label: "Orthopedics", value: "orthopedics" },
  { label: "Pediatrics", value: "pediatrics" },
  { label: "Gynecology", value: "gynecology" },
  { label: "Dermatology", value: "dermatology" }
]));
node("appointment_doctors_fetch", "record", 2760, 420, recordData({
  action: "list",
  collection: "doctors",
  where: { department: "{{department}}", branch_id: "{{branch_id}}", consultation_mode: "{{consultation_type}}" },
  data: {},
  schema: schemas.doctors,
  outputVar: "appointment_doctors_result",
  limit: 20,
  sortBy: "next_available_slot",
  sortOrder: "asc"
}));
node("appointment_no_doctors_message", "message", 3000, 700, msgData("I could not find available doctors for this branch, consultation type, and department. Please try another combination later."));
node("appointment_no_doctors_end", "end", 3240, 700, { messages: [] });
node("appointment_doctor_carousel", "carousel", 3000, 420, carouselData("Available doctors and care teams.", [
  { id: "doc_general_1", type: "card", title: "General Medicine", heading: "OPD consultation", body: "For general health concerns, fever, routine illness, and follow-up visits.", cta: { label: "Select", value: "doc_general_1" } },
  { id: "doc_cardio_1", type: "card", title: "Cardiology", heading: "Heart care consultation", body: "For heart-related concerns, cardiac review, and specialist follow-up.", cta: { label: "Select", value: "doc_cardio_1" } },
  { id: "doc_ortho_1", type: "card", title: "Orthopedics", heading: "Bone and joint consultation", body: "For joint, spine, injury, and mobility-related concerns.", cta: { label: "Select", value: "doc_ortho_1" } }
]));
node("appointment_doctor_input", "input", 3240, 420, inputData("Select the doctor or care team you want to book.", "doctor_id", [
  { label: "General Medicine", value: "doc_general_1" },
  { label: "Cardiology", value: "doc_cardio_1" },
  { label: "Orthopedics", value: "doc_ortho_1" }
]));
node("appointment_available_slots_list", "record", 3480, 420, recordData({
  action: "list",
  collection: "appointment_slots",
  where: { doctor_id: "{{doctor_id}}", branch_id: "{{branch_id}}", consultation_mode: "{{consultation_type}}", status: "available" },
  data: {},
  schema: schemas.appointmentSlots,
  outputVar: "available_appointment_slots",
  limit: 20,
  sortBy: "start",
  sortOrder: "asc"
}));
node("appointment_no_slots_message", "message", 3000, 560, msgData("I could not find an open slot for this care team right now. You can choose another care team and I will check available slots again."));
node("appointment_alternate_doctor_input", "input", 3240, 560, inputData("Choose another care team to check available slots.", "doctor_id", [
  { label: "General Medicine", value: "doc_general_1" },
  { label: "Cardiology", value: "doc_cardio_1" },
  { label: "Orthopedics", value: "doc_ortho_1" }
]));
node("appointment_alternate_available_slots_list", "record", 3480, 560, recordData({
  action: "list",
  collection: "appointment_slots",
  where: { doctor_id: "{{doctor_id}}", branch_id: "{{branch_id}}", consultation_mode: "{{consultation_type}}", status: "available" },
  data: {},
  schema: schemas.appointmentSlots,
  outputVar: "alternate_appointment_slots",
  limit: 20,
  sortBy: "start",
  sortOrder: "asc"
}));
node("appointment_alternate_slot_booking", "appointment", 3720, 560, {
  messages: ["Please choose one of the available appointment slots."],
  slotMode: "dynamic",
  timezone: "Asia/Kolkata",
  slotIntervalMins: 30,
  slotDurationMins: 20,
  horizonDays: 14,
  maxSlotsPerDay: 6,
  workingHoursStart: "00:00",
  workingHoursEnd: "00:00",
  availableWeekdays: "1,2,3,4,5,6",
  dynamicSlotsVar: "alternate_appointment_slots",
  dynamicSlotsPath: "data",
  slotsJson: "[]",
  dateVar: "appointment_date",
  outputVar: "appointment_booking"
});
node("appointment_no_slots_end_message", "message", 3720, 700, msgData("I could not find an open slot for the selected care teams right now. Please try again later when new slots are released."));
node("appointment_no_slots_end", "end", 3960, 700, { messages: [] });
node("appointment_slot_booking", "appointment", 3000, 420, {
  messages: ["Please choose the appointment date and preferred time slot."],
  slotMode: "dynamic",
  timezone: "Asia/Kolkata",
  slotIntervalMins: 30,
  slotDurationMins: 20,
  horizonDays: 14,
  maxSlotsPerDay: 6,
  workingHoursStart: "00:00",
  workingHoursEnd: "00:00",
  availableWeekdays: "1,2,3,4,5,6",
  dynamicSlotsVar: "available_appointment_slots",
  dynamicSlotsPath: "data",
  slotsJson: "[]",
  dateVar: "appointment_date",
  outputVar: "appointment_booking"
});
node("appointment_set_ids", "setVariable", 3240, 420, setVars({
  appointment_id: "APT-{{system.sessionId}}",
  slot_hold_id: "HOLD-{{system.sessionId}}",
  appointment_date: "{{appointment_booking.date}}",
  appointment_slot_id: "{{appointment_booking.slotId}}",
  appointment_slot_label: "{{appointment_booking.slotLabel}}",
  appointment_time: "{{appointment_booking.startTime}}",
  appointment_end_time: "{{appointment_booking.endTime}}",
  payment_status: "pending"
}));
node("appointment_duplicate_check", "record", 3360, 420, recordData({
  action: "find",
  collection: "appointments",
  where: { patient_mobile: "{{patient_mobile}}", doctor_id: "{{doctor_id}}", slot_id: "{{appointment_slot_id}}" },
  data: {},
  schema: schemas.appointments,
  outputVar: "appointment_duplicate_result",
  encryptPii: true,
  piiFields: "patient_mobile"
}));
node("appointment_duplicate_message", "message", 3480, 700, msgData("An appointment already exists for this patient, doctor, and slot. Please check existing appointments if you need to reschedule or cancel."));
node("appointment_duplicate_end", "end", 3720, 700, { messages: [] });
node("appointment_duplicate_check_unavailable_message", "message", 3480, 820, msgData("I could not complete the duplicate appointment check right now. Please try booking again after a few minutes."));
node("appointment_duplicate_check_unavailable_end", "end", 3720, 820, { messages: [] });
node("appointment_slot_hold_update", "record", 3480, 420, recordData({
  action: "update",
  collection: "appointment_slots",
  where: { slot_id: "{{appointment_slot_id}}", doctor_id: "{{doctor_id}}", branch_id: "{{branch_id}}", consultation_mode: "{{consultation_type}}", status: "available" },
  data: {
    id: "{{appointment_slot_id}}",
    slot_id: "{{appointment_slot_id}}",
    doctor_id: "{{doctor_id}}",
    department: "{{department}}",
    date: "{{appointment_date}}",
    label: "{{appointment_slot_label}}",
    start: "{{appointment_time}}",
    end: "{{appointment_end_time}}",
    status: "held",
    hold_id: "{{slot_hold_id}}",
    held_by_session: "{{system.sessionId}}",
    appointment_id: "{{appointment_id}}",
    branch_id: "{{branch_id}}",
    consultation_mode: "{{consultation_type}}",
    hold_ttl_minutes: 10
  },
  schema: schemas.appointmentSlots,
  uniqueKey: "slot_id",
  idempotencyKey: "{{slot_hold_id}}",
  outputVar: "appointment_slot_hold_result",
  encryptPii: false
}));
node("appointment_hold_expiry_scheduler", "scheduler", 3600, 420, schedulerData({
  runAt: "",
  offsetValue: 10,
  offsetUnit: "minutes",
  offsetDirection: "after",
  payload: {
    type: "release_expired_slot_hold",
    slot_id: "{{appointment_slot_id}}",
    hold_id: "{{slot_hold_id}}",
    appointment_id: "{{appointment_id}}"
  },
  outputVar: "appointment_hold_expiry_scheduler_result",
  dedupeSuffix: "slot_hold_expiry"
}));
node("appointment_slot_conflict_message", "message", 3720, 840, msgData("I could not reserve that slot from the latest availability. I will refresh the open slots for the same doctor so you can choose again."));
node("appointment_conflict_available_slots_list", "record", 3960, 840, recordData({
  action: "list",
  collection: "appointment_slots",
  where: { doctor_id: "{{doctor_id}}", branch_id: "{{branch_id}}", consultation_mode: "{{consultation_type}}", status: "available" },
  data: {},
  schema: schemas.appointmentSlots,
  outputVar: "conflict_appointment_slots",
  limit: 20,
  sortBy: "start",
  sortOrder: "asc"
}));
node("appointment_conflict_slot_booking", "appointment", 4200, 840, {
  messages: ["Please choose another available appointment slot."],
  slotMode: "dynamic",
  timezone: "Asia/Kolkata",
  slotIntervalMins: 30,
  slotDurationMins: 20,
  horizonDays: 14,
  maxSlotsPerDay: 6,
  workingHoursStart: "00:00",
  workingHoursEnd: "00:00",
  availableWeekdays: "1,2,3,4,5,6",
  dynamicSlotsVar: "conflict_appointment_slots",
  dynamicSlotsPath: "data",
  slotsJson: "[]",
  dateVar: "appointment_date",
  outputVar: "appointment_booking"
});
node("appointment_conflict_set_ids", "setVariable", 4440, 840, setVars({
  appointment_date: "{{appointment_booking.date}}",
  appointment_slot_id: "{{appointment_booking.slotId}}",
  appointment_slot_label: "{{appointment_booking.slotLabel}}",
  appointment_time: "{{appointment_booking.startTime}}",
  appointment_end_time: "{{appointment_booking.endTime}}"
}));
node("appointment_conflict_duplicate_check", "record", 4680, 840, recordData({
  action: "find",
  collection: "appointments",
  where: { patient_mobile: "{{patient_mobile}}", doctor_id: "{{doctor_id}}", slot_id: "{{appointment_slot_id}}" },
  data: {},
  schema: schemas.appointments,
  outputVar: "appointment_conflict_duplicate_result",
  encryptPii: true,
  piiFields: "patient_mobile"
}));
node("appointment_conflict_slot_hold_update", "record", 4920, 840, recordData({
  action: "update",
  collection: "appointment_slots",
  where: { slot_id: "{{appointment_slot_id}}", doctor_id: "{{doctor_id}}", branch_id: "{{branch_id}}", consultation_mode: "{{consultation_type}}", status: "available" },
  data: {
    id: "{{appointment_slot_id}}",
    slot_id: "{{appointment_slot_id}}",
    doctor_id: "{{doctor_id}}",
    department: "{{department}}",
    date: "{{appointment_date}}",
    label: "{{appointment_slot_label}}",
    start: "{{appointment_time}}",
    end: "{{appointment_end_time}}",
    status: "held",
    hold_id: "{{slot_hold_id}}",
    held_by_session: "{{system.sessionId}}",
    appointment_id: "{{appointment_id}}",
    branch_id: "{{branch_id}}",
    consultation_mode: "{{consultation_type}}",
    hold_ttl_minutes: 10
  },
  schema: schemas.appointmentSlots,
  uniqueKey: "slot_id",
  idempotencyKey: "{{slot_hold_id}}:conflict-retry",
  outputVar: "appointment_conflict_slot_hold_result",
  encryptPii: false
}));
node("appointment_conflict_no_slots_message", "message", 4200, 980, msgData("I could not reserve another open slot for this doctor right now. Please choose another care team or try again later when new slots are released."));
node("appointment_slot_conflict_end", "end", 3960, 840, { messages: [] });
node("appointment_summary", "message", 3840, 420, msgData("Appointment summary: Branch {{branch_id}}, consultation type {{consultation_type}}, department {{department}}, doctor {{doctor_id}}, date {{appointment_date}}, slot {{appointment_slot_label}}. The booking fee is {{currency}} {{appointment_fee}}."));
node("appointment_payment_choice_input", "input", 4080, 420, inputData("How would you like to handle the appointment fee?", "appointment_payment_choice", [
  { label: "Pay now", value: "pay_now" },
  { label: "Pay at hospital", value: "pay_at_hospital" }
]));
node("appointment_payment_cancel_message", "message", 4320, 700, msgData("I could not confirm a payment option, so I will release the selected slot. You can start a new booking whenever you are ready."));
node("appointment_payment", "payment", 4320, 420, paymentData({ amount: "{{appointment_fee}}", description: "Hospital appointment booking fee", outputVar: "appointment_payment_result" }));
node("appointment_payment_retry_notice", "message", 4200, 560, msgData("The payment was not confirmed. Please try once more. If it still does not go through, I will connect you to billing support."));
node("appointment_payment_retry", "payment", 4440, 560, paymentData({ amount: "{{appointment_fee}}", description: "Hospital appointment booking fee retry", outputVar: "appointment_payment_retry_result" }));
node("appointment_slot_release_update", "record", 4680, 560, recordData({
  action: "update",
  collection: "appointment_slots",
  where: { slot_id: "{{appointment_slot_id}}", hold_id: "{{slot_hold_id}}", status: "held" },
  data: {
    id: "{{appointment_slot_id}}",
    slot_id: "{{appointment_slot_id}}",
    doctor_id: "{{doctor_id}}",
    department: "{{department}}",
    date: "{{appointment_date}}",
    label: "{{appointment_slot_label}}",
    start: "{{appointment_time}}",
    end: "{{appointment_end_time}}",
    status: "available",
    hold_id: "",
    held_by_session: "",
    appointment_id: "",
    branch_id: "{{branch_id}}",
    consultation_mode: "{{consultation_type}}"
  },
  schema: schemas.appointmentSlots,
  uniqueKey: "slot_id",
  idempotencyKey: "{{slot_hold_id}}:release",
  outputVar: "appointment_slot_release_result",
  encryptPii: false
}));
node("appointment_payment_failed_message", "message", 4920, 560, msgData("The payment was not completed, so the selected slot has been released. You can start a new booking whenever you are ready."));
node("appointment_payment_failed_end", "end", 5160, 560, { messages: [] });
node("appointment_set_paid", "setVariable", 4200, 420, setVars({ payment_status: "paid", payment_id: "PAY-{{system.sessionId}}" }));
node("appointment_set_pay_at_hospital", "setVariable", 4200, 300, setVars({ payment_status: "pay_at_hospital", payment_id: "PAY-HOSPITAL-{{system.sessionId}}" }));
node("appointment_payment_record", "record", 4440, 420, recordData({
  action: "upsert",
  collection: "payments",
  where: { payment_id: "{{payment_id}}" },
  data: {
    payment_id: "{{payment_id}}",
    appointment_id: "{{appointment_id}}",
    amount: "{{appointment_fee}}",
    currency: "{{currency}}",
    status: "{{payment_status}}",
    transaction_ref: "{{system.sessionId}}"
  },
  schema: schemas.payments,
  uniqueKey: "payment_id",
  idempotencyKey: "{{payment_id}}",
  outputVar: "appointment_payment_record_result",
  encryptPii: false
}));
node("appointment_slot_booked_update", "record", 4680, 420, recordData({
  action: "update",
  collection: "appointment_slots",
  where: { slot_id: "{{appointment_slot_id}}", hold_id: "{{slot_hold_id}}", status: "held" },
  data: {
    id: "{{appointment_slot_id}}",
    slot_id: "{{appointment_slot_id}}",
    doctor_id: "{{doctor_id}}",
    department: "{{department}}",
    date: "{{appointment_date}}",
    label: "{{appointment_slot_label}}",
    start: "{{appointment_time}}",
    end: "{{appointment_end_time}}",
    status: "booked",
    hold_id: "{{slot_hold_id}}",
    held_by_session: "{{system.sessionId}}",
    appointment_id: "{{appointment_id}}",
    branch_id: "{{branch_id}}",
    consultation_mode: "{{consultation_type}}"
  },
  schema: schemas.appointmentSlots,
  uniqueKey: "slot_id",
  idempotencyKey: "{{slot_hold_id}}:booked",
  outputVar: "appointment_slot_booked_result",
  encryptPii: false
}));
node("appointment_booking_commit_failed_message", "message", 4920, 700, msgData("The payment was confirmed, but I could not finalize the selected appointment slot. No duplicate appointment was created. Please contact the hospital with payment reference {{payment_id}} if the amount was debited."));
node("appointment_booking_commit_failed_end", "end", 5160, 700, { messages: [] });
node("appointment_confirm_record_update", "record", 4920, 420, recordData({
  action: "upsert",
  collection: "appointments",
  where: { appointment_id: "{{appointment_id}}" },
  data: {
    appointment_id: "{{appointment_id}}",
    patient_id: "PAT-{{patient_mobile}}",
    patient_mobile: "{{patient_mobile}}",
    branch_id: "{{branch_id}}",
    consultation_type: "{{consultation_type}}",
    department: "{{department}}",
    doctor_id: "{{doctor_id}}",
    slot_id: "{{appointment_slot_id}}",
    slot_label: "{{appointment_slot_label}}",
    slot_hold_id: "{{slot_hold_id}}",
    appointment_date: "{{appointment_date}}",
    appointment_time: "{{appointment_time}}",
    status: "confirmed",
    payment_status: "{{payment_status}}"
  },
  schema: schemas.appointments,
  uniqueKey: "appointment_id",
  idempotencyKey: "{{appointment_id}}:confirmed",
  outputVar: "appointment_confirm_record_result",
  encryptPii: true,
  piiFields: "patient_mobile"
}));
node("appointment_notify", "notification", 5160, 420, notificationData({
  templateId: "appointment_confirmed",
  sms: "Your appointment {{appointment_id}} is confirmed for {{appointment_date}} at {{appointment_slot_label}}. Please arrive 15 minutes early.",
  emailSubject: "Appointment confirmed",
  emailBody: "Your appointment {{appointment_id}} is confirmed with {{doctor_id}} in {{department}} for {{appointment_date}} at {{appointment_slot_label}}. Please arrive 15 minutes early.",
  outputVar: "appointment_notification_result",
  dedupeSuffix: "appointment_notification"
}));
node("appointment_reminder_scheduler", "scheduler", 5400, 420, schedulerData({
  runAt: "{{appointment_time}}",
  offsetValue: 24,
  offsetUnit: "hours",
  offsetDirection: "before",
  payload: { type: "appointment_reminder", appointment_id: "{{appointment_id}}", patient_mobile: "{{patient_mobile}}" },
  outputVar: "appointment_reminder_result",
  dedupeSuffix: "appointment_reminder"
}));
node("appointment_audit", "audit-log", 5640, 420, auditData({
  action: "appointment_confirmed",
  entityType: "appointment",
  entityId: "{{appointment_id}}",
  metadata: { channel: "{{system.channel}}", department: "{{department}}", payment_status: "{{payment_status}}" },
  sensitivity: "medical",
  outputVar: "appointment_audit_result"
}));
node("appointment_confirmation", "message", 5880, 420, msgData("Your appointment has been confirmed.\n\nAppointment ID: {{appointment_id}}\nPatient: {{patient_name}}\nDoctor: {{doctor_id}}\nDepartment: {{department}}\nPayment status: {{payment_status}}\nDate and time: {{appointment_date}} at {{appointment_slot_label}}\nConsultation type: {{consultation_type}}\nHospital location: {{hospital_name}}, {{main_branch_address}}\n\nPlease arrive 15 minutes before your appointment time."));
node("appointment_end", "end", 6120, 420, { messages: [] });
edge("appointment_intro", "existing_patient_lookup_form");
edge("appointment_consent", "appointment_consent_accept_record", { condition: { operator: "equals", value: "accepted" }, label: "accepted" });
edge("appointment_consent", "appointment_consent_decline_record", { isDefault: true, label: "declined/default" });
recordSuccessOrManual("appointment_consent_accept_record", "appointment_patient_flow_router", "appointment_patient_flow_router");
recordSuccessOrManual("appointment_consent_decline_record", "appointment_consent_declined_message", "appointment_consent_declined_message");
edge("appointment_consent_declined_message", "appointment_consent_declined_end");
edge("appointment_patient_flow_router", "appointment_branch_input", { condition: { operator: "equals", value: "existing" }, label: "existing" });
edge("appointment_patient_flow_router", "appointment_patient_form", { isDefault: true, label: "new/default" });
edge("appointment_patient_form", "appointment_patient_record");
recordContinue("appointment_patient_record", "appointment_branch_input");
edge("appointment_branch_input", "appointment_consultation_type_input");
edge("appointment_consultation_type_input", "appointment_department_input");
edge("appointment_department_input", "appointment_doctors_fetch");
edge("appointment_doctors_fetch", "appointment_doctor_carousel", { condition: { operator: "equals", value: "success" }, label: "success" });
edge("appointment_doctors_fetch", "appointment_no_doctors_message", { isDefault: true, label: "not_found/failed/default" });
edge("appointment_no_doctors_message", "appointment_no_doctors_end");
edge("appointment_doctor_carousel", "appointment_doctor_input");
edge("appointment_doctor_input", "appointment_available_slots_list");
edge("appointment_available_slots_list", "appointment_slot_booking", { condition: { operator: "equals", value: "success" }, label: "success" });
edge("appointment_available_slots_list", "appointment_no_slots_message", { isDefault: true, label: "not_found/failed/default" });
edge("appointment_no_slots_message", "appointment_alternate_doctor_input");
edge("appointment_alternate_doctor_input", "appointment_alternate_available_slots_list");
edge("appointment_alternate_available_slots_list", "appointment_alternate_slot_booking", { condition: { operator: "equals", value: "success" }, label: "success" });
edge("appointment_alternate_available_slots_list", "appointment_no_slots_end_message", { isDefault: true, label: "not_found/failed/default" });
edge("appointment_alternate_slot_booking", "appointment_set_ids");
edge("appointment_no_slots_end_message", "appointment_no_slots_end");
edge("appointment_slot_booking", "appointment_set_ids");
edge("appointment_set_ids", "appointment_duplicate_check");
edge("appointment_duplicate_check", "appointment_duplicate_message", { condition: { operator: "equals", value: "success" }, label: "duplicate_found" });
edge("appointment_duplicate_check", "appointment_slot_hold_update", { condition: { operator: "equals", value: "not_found" }, label: "no_duplicate" });
edge("appointment_duplicate_check", "appointment_duplicate_check_unavailable_message", { isDefault: true, label: "failed/default" });
edge("appointment_duplicate_message", "appointment_duplicate_end");
edge("appointment_duplicate_check_unavailable_message", "appointment_duplicate_check_unavailable_end");
recordSuccessOnly("appointment_slot_hold_update", "appointment_hold_expiry_scheduler", "appointment_slot_conflict_message");
schedulerToNext("appointment_hold_expiry_scheduler", "appointment_summary");
edge("appointment_slot_conflict_message", "appointment_conflict_available_slots_list");
edge("appointment_conflict_available_slots_list", "appointment_conflict_slot_booking", { condition: { operator: "equals", value: "success" }, label: "success" });
edge("appointment_conflict_available_slots_list", "appointment_conflict_no_slots_message", { isDefault: true, label: "not_found/failed/default" });
edge("appointment_conflict_no_slots_message", "appointment_slot_conflict_end");
edge("appointment_conflict_slot_booking", "appointment_conflict_set_ids");
edge("appointment_conflict_set_ids", "appointment_conflict_duplicate_check");
edge("appointment_conflict_duplicate_check", "appointment_duplicate_message", { condition: { operator: "equals", value: "success" }, label: "duplicate_found" });
edge("appointment_conflict_duplicate_check", "appointment_conflict_slot_hold_update", { condition: { operator: "equals", value: "not_found" }, label: "no_duplicate" });
edge("appointment_conflict_duplicate_check", "appointment_duplicate_check_unavailable_message", { isDefault: true, label: "failed/default" });
recordSuccessOnly("appointment_conflict_slot_hold_update", "appointment_hold_expiry_scheduler", "appointment_conflict_no_slots_message");
edge("appointment_summary", "appointment_payment_choice_input");
edge("appointment_payment_choice_input", "appointment_payment", { condition: { operator: "equals", value: "pay_now" }, label: "pay_now" });
edge("appointment_payment_choice_input", "appointment_set_pay_at_hospital", { condition: { operator: "equals", value: "pay_at_hospital" }, label: "pay_at_hospital" });
edge("appointment_payment_choice_input", "appointment_payment_cancel_message", { isDefault: true, label: "failed/default" });
edge("appointment_payment_cancel_message", "appointment_slot_release_update");
edge("appointment_payment", "appointment_set_paid", { condition: { operator: "equals", value: "paid" }, label: "paid" });
edge("appointment_payment", "appointment_payment_retry_notice", { isDefault: true, label: "failed/default" });
edge("appointment_payment_retry_notice", "appointment_payment_retry");
edge("appointment_payment_retry", "appointment_set_paid", { condition: { operator: "equals", value: "paid" }, label: "paid" });
edge("appointment_payment_retry", "appointment_slot_release_update", { isDefault: true, label: "failed/default" });
edge("appointment_slot_release_update", "appointment_payment_failed_message", { condition: { operator: "equals", value: "success" }, label: "success" });
edge("appointment_slot_release_update", "appointment_payment_failed_message", { isDefault: true, label: "failed/default" });
edge("appointment_payment_failed_message", "appointment_payment_failed_end");
edge("appointment_set_paid", "appointment_payment_record");
edge("appointment_set_pay_at_hospital", "appointment_payment_record");
recordContinue("appointment_payment_record", "appointment_slot_booked_update");
recordSuccessOnly("appointment_slot_booked_update", "appointment_confirm_record_update", "appointment_booking_commit_failed_message");
edge("appointment_booking_commit_failed_message", "appointment_booking_commit_failed_end");
recordContinue("appointment_confirm_record_update", "appointment_notify");
notifyToNext("appointment_notify", "appointment_reminder_scheduler");
schedulerToNext("appointment_reminder_scheduler", "appointment_audit");
auditToNext("appointment_audit", "appointment_confirmation");
edge("appointment_confirmation", "appointment_end");

node("existing_patient_lookup_form", "form", 1320, 700, formData("Enter the patient's mobile number so I can check the hospital record before booking.", [
  { key: "patient_mobile", label: "Mobile number", type: "phone", required: true }
], "existing_patient_lookup_form_result"));
node("existing_patient_find", "record", 1560, 700, recordData({
  action: "find",
  collection: "patients",
  where: { mobile: "{{patient_mobile}}" },
  data: {},
  schema: schemas.patients,
  outputVar: "existing_patient_result",
  encryptPii: true,
  piiFields: "patient_mobile"
}));
node("appointment_existing_patient_set", "setVariable", 1800, 700, setVars({
  appointment_patient_flow_type: "existing",
  patient_id: "{{existing_patient_result.data.patient_id}}",
  patient_name: "{{existing_patient_result.data.name}}",
  patient_mobile: "{{existing_patient_result.data.mobile}}",
  patient_email: "{{existing_patient_result.data.email}}",
  patient_age: "{{existing_patient_result.data.age}}",
  patient_gender: "{{existing_patient_result.data.gender}}",
  patient_location: "{{existing_patient_result.data.location}}",
  preferred_language: "{{existing_patient_result.data.preferred_language}}"
}));
node("appointment_upcoming_find", "record", 2040, 700, recordData({
  action: "find",
  collection: "appointments",
  where: { patient_mobile: "{{patient_mobile}}", status: "confirmed" },
  data: {},
  schema: schemas.appointments,
  outputVar: "appointment_upcoming_result",
  encryptPii: true,
  piiFields: "patient_mobile"
}));
node("appointment_upcoming_message", "message", 2280, 700, msgData("I found an active appointment for this patient before we book another one.\n\nAppointment ID: {{appointment_upcoming_result.data.appointment_id}}\nDoctor: {{appointment_upcoming_result.data.doctor_id}}\nDepartment: {{appointment_upcoming_result.data.department}}\nDate and time: {{appointment_upcoming_result.data.appointment_date}} at {{appointment_upcoming_result.data.slot_label}}\nPayment status: {{appointment_upcoming_result.data.payment_status}}"));
node("appointment_upcoming_proceed_decision", "decision", 2520, 700, decisionData("Do you still want to book another appointment?", "appointment_proceed_with_new_booking"));
node("appointment_upcoming_end_message", "message", 2760, 700, msgData("No new appointment has been booked. You can ask me to reschedule, cancel, or check this appointment if needed."));
node("appointment_upcoming_end", "end", 3000, 700, { messages: [] });
node("appointment_upcoming_check_unavailable_message", "message", 2280, 840, msgData("I could not check existing appointments right now. Please try booking again after a few minutes so we do not create a duplicate appointment."));
node("appointment_upcoming_check_unavailable_end", "end", 2520, 840, { messages: [] });
node("appointment_new_patient_prepare", "setVariable", 1800, 900, setVars({
  appointment_patient_flow_type: "new"
}));
node("existing_patient_not_found_message", "message", 2040, 900, msgData("I could not find an existing hospital profile for this mobile number. I will collect the remaining details to create the appointment profile."));
node("appointment_patient_lookup_unavailable_message", "message", 1800, 1040, msgData("I could not check the patient profile right now. Please try again after a few minutes so we can avoid duplicate patient records."));
node("appointment_patient_lookup_unavailable_end", "end", 2040, 1040, { messages: [] });
edge("existing_patient_lookup_form", "existing_patient_find");
edge("existing_patient_find", "appointment_existing_patient_set", { condition: { operator: "equals", value: "success" }, label: "success" });
edge("existing_patient_find", "appointment_new_patient_prepare", { condition: { operator: "equals", value: "not_found" }, label: "not_found" });
edge("existing_patient_find", "appointment_patient_lookup_unavailable_message", { isDefault: true, label: "failed/default" });
edge("appointment_existing_patient_set", "appointment_upcoming_find");
edge("appointment_upcoming_find", "appointment_upcoming_message", { condition: { operator: "equals", value: "success" }, label: "active_appointment_found" });
edge("appointment_upcoming_find", "appointment_consent", { condition: { operator: "equals", value: "not_found" }, label: "no_active_appointment" });
edge("appointment_upcoming_find", "appointment_upcoming_check_unavailable_message", { isDefault: true, label: "failed/default" });
edge("appointment_upcoming_message", "appointment_upcoming_proceed_decision");
edge("appointment_upcoming_proceed_decision", "appointment_consent", { condition: { operator: "equals", value: "yes" }, label: "yes" });
edge("appointment_upcoming_proceed_decision", "appointment_upcoming_end_message", { isDefault: true, label: "no/default" });
edge("appointment_upcoming_end_message", "appointment_upcoming_end");
edge("appointment_upcoming_check_unavailable_message", "appointment_upcoming_check_unavailable_end");
edge("appointment_new_patient_prepare", "existing_patient_not_found_message");
edge("existing_patient_not_found_message", "appointment_consent");
edge("appointment_patient_lookup_unavailable_message", "appointment_patient_lookup_unavailable_end");

node("existing_appointment_form", "form", 1320, 720, formData("Enter existing appointment details.", [
  { key: "appointment_id", label: "Appointment ID", type: "text", required: true },
  { key: "patient_name", label: "Patient name", type: "text", required: false },
  { key: "patient_mobile", label: "Registered mobile number", type: "phone", required: true },
  { key: "patient_email", label: "Email", type: "email", required: false },
  { key: "appointment_action", label: "What do you want to do?", type: "select", required: true, options: ["status"] }
], "existing_appointment_form_result"));
node("existing_appointment_find", "record", 1560, 720, recordData({
  action: "find",
  collection: "appointments",
  where: { appointment_id: "{{appointment_id}}", patient_mobile: "{{patient_mobile}}" },
  data: {},
  schema: schemas.appointments,
  outputVar: "existing_appointment_result",
  encryptPii: true,
  piiFields: "patient_mobile"
}));
node("existing_appointment_router", "switch", 1800, 720, { variable: "appointment_action" });
node("appointment_status_message", "message", 2040, 720, msgData("We found your appointment details. If you need to reschedule or cancel, start that request from the main menu so I can show all eligible future appointments safely."));
node("appointment_status_end", "end", 2280, 720, { messages: [] });
node("existing_appointment_not_found_message", "message", 1800, 1020, msgData("I could not verify an appointment with those details. Please check the appointment ID and registered mobile number, then try again."));
node("existing_appointment_not_found_end", "end", 2040, 1020, { messages: [] });

const rescheduleFilterFutureScript = `
const rows = Array.isArray(vars.reschedule_future_appointments_result?.data)
  ? vars.reschedule_future_appointments_result.data
  : [];
const today = helpers.nowIso().slice(0, 10);
const future = rows
  .filter((row) => String(row.appointment_date || "").slice(0, 10) >= today)
  .sort((a, b) => String(a.appointment_date || "").localeCompare(String(b.appointment_date || "")));
const first = future[0] || {};
vars.reschedule_future_appointments = future;
vars.reschedule_future_appointment_count = future.length;
vars.reschedule_future_appointment_route = future.length === 0 ? "none" : future.length === 1 ? "single" : "multiple";
vars.reschedule_future_appointment_options_text = future.map((item, index) => {
  const when = [item.appointment_date, item.slot_label || item.appointment_time].filter(Boolean).join(" at ");
  return String(index + 1) + ". " + item.appointment_id + " | " + when + " | " + item.department + " | " + item.doctor_id;
}).join("\\n");
vars.reschedule_original_appointment_id = first.appointment_id || "";
vars.reschedule_original_patient_id = first.patient_id || ("PAT-" + String(vars.patient_mobile || ""));
vars.reschedule_original_slot_id = first.slot_id || "";
vars.reschedule_original_slot_hold_id = first.slot_hold_id || "";
vars.reschedule_original_slot_label = first.slot_label || "";
vars.reschedule_original_doctor_id = first.doctor_id || "";
vars.reschedule_original_branch_id = first.branch_id || "";
vars.reschedule_original_department = first.department || "";
vars.reschedule_original_consultation_type = first.consultation_type || "";
vars.reschedule_original_appointment_date = first.appointment_date || "";
vars.reschedule_original_appointment_time = first.appointment_time || "";
vars.reschedule_original_payment_status = first.payment_status || "manual_verify";
return { route: vars.reschedule_future_appointment_route, count: future.length };
`;

const rescheduleSelectAppointmentScript = `
const future = Array.isArray(vars.reschedule_future_appointments) ? vars.reschedule_future_appointments : [];
const selectedId = String(vars.reschedule_selected_appointment_id || "").trim().toLowerCase();
const selected = future.find((item) => String(item.appointment_id || "").trim().toLowerCase() === selectedId);
vars.reschedule_selection_route = selected ? "found" : "not_found";
const item = selected || {};
vars.reschedule_original_appointment_id = item.appointment_id || "";
vars.reschedule_original_patient_id = item.patient_id || ("PAT-" + String(vars.patient_mobile || ""));
vars.reschedule_original_slot_id = item.slot_id || "";
vars.reschedule_original_slot_hold_id = item.slot_hold_id || "";
vars.reschedule_original_slot_label = item.slot_label || "";
vars.reschedule_original_doctor_id = item.doctor_id || "";
vars.reschedule_original_branch_id = item.branch_id || "";
vars.reschedule_original_department = item.department || "";
vars.reschedule_original_consultation_type = item.consultation_type || "";
vars.reschedule_original_appointment_date = item.appointment_date || "";
vars.reschedule_original_appointment_time = item.appointment_time || "";
vars.reschedule_original_payment_status = item.payment_status || "manual_verify";
return { route: vars.reschedule_selection_route, appointment_id: vars.reschedule_original_appointment_id };
`;

const rescheduleFilterSlotsScript = `
const rows = Array.isArray(vars.reschedule_available_slots_result?.data)
  ? vars.reschedule_available_slots_result.data
  : [];
const today = helpers.nowIso().slice(0, 10);
const slots = rows
  .filter((row) => String(row.date || "").slice(0, 10) >= today)
  .filter((row) => String(row.slot_id || row.id || "") !== String(vars.reschedule_original_slot_id || ""))
  .sort((a, b) => String(a.start || "").localeCompare(String(b.start || "")));
vars.reschedule_open_slots_result = { data: slots };
vars.reschedule_open_slot_count = slots.length;
vars.reschedule_slot_route = slots.length > 0 ? "available" : "none";
vars.reschedule_open_slots_text = slots.map((slot, index) => {
  return String(index + 1) + ". " + (slot.label || slot.slot_id || slot.id) + " | " + slot.date + " | " + slot.start;
}).join("\\n");
return { route: vars.reschedule_slot_route, count: slots.length };
`;

node("reschedule_mobile_form", "form", 1320, 560, formData("Enter the registered mobile number so I can find future appointments eligible for reschedule.", [
  { key: "patient_mobile", label: "Registered mobile number", type: "phone", required: true }
], "reschedule_mobile_form_result"));
node("reschedule_future_appointments_list", "record", 1560, 560, recordData({
  action: "list",
  collection: "appointments",
  where: { patient_mobile: "{{patient_mobile}}", status: "confirmed" },
  data: {},
  schema: schemas.appointments,
  outputVar: "reschedule_future_appointments_result",
  limit: 20,
  sortBy: "appointment_date",
  sortOrder: "asc",
  encryptPii: true,
  piiFields: "patient_mobile"
}));
node("reschedule_filter_future_appointments", "script", 1800, 560, scriptData(rescheduleFilterFutureScript, "reschedule_filter_future_result", 100));
node("reschedule_future_route", "switch", 2040, 560, { variable: "reschedule_future_appointment_route" });
node("reschedule_no_future_message", "message", 2280, 720, msgData("I could not find any future confirmed appointments for this mobile number. Completed, cancelled, or unconfirmed appointments cannot be rescheduled here."));
node("reschedule_no_future_end", "end", 2520, 720, { messages: [] });
node("reschedule_single_details_message", "message", 2280, 500, msgData("I found this future appointment:\n\n{{reschedule_future_appointment_options_text}}\n\nDo you want to reschedule this appointment?"));
node("reschedule_multiple_details_message", "message", 2280, 580, msgData("I found multiple future appointments for this mobile number:\n\n{{reschedule_future_appointment_options_text}}\n\nPlease enter the Appointment ID you want to reschedule."));
node("reschedule_select_appointment_form", "form", 2520, 580, formData("Enter the Appointment ID to reschedule.", [
  { key: "reschedule_selected_appointment_id", label: "Appointment ID", type: "text", required: true }
], "reschedule_select_appointment_form_result"));
node("reschedule_select_appointment", "script", 2760, 580, scriptData(rescheduleSelectAppointmentScript, "reschedule_select_appointment_result", 100));
node("reschedule_selection_route", "switch", 3000, 580, { variable: "reschedule_selection_route" });
node("reschedule_selected_details_message", "message", 3240, 580, msgData("Selected appointment:\n\nAppointment ID: {{reschedule_original_appointment_id}}\nDoctor: {{reschedule_original_doctor_id}}\nDepartment: {{reschedule_original_department}}\nDate and time: {{reschedule_original_appointment_date}} at {{reschedule_original_slot_label}}\n\nDo you want to reschedule this appointment?"));
node("reschedule_selection_not_found_message", "message", 3240, 720, msgData("I could not match that Appointment ID with the future confirmed appointments for this mobile number. Please check the ID and start the reschedule request again."));
node("reschedule_selection_not_found_end", "end", 3480, 720, { messages: [] });
node("reschedule_confirm_decision", "decision", 3480, 500, decisionData("Reschedule this appointment?", "reschedule_confirmed"));
node("reschedule_cancel_message", "message", 3720, 720, msgData("No changes were made to the appointment."));
node("reschedule_cancel_end", "end", 3960, 720, { messages: [] });
node("reschedule_available_slots_list", "record", 3720, 500, recordData({
  action: "list",
  collection: "appointment_slots",
  where: { doctor_id: "{{reschedule_original_doctor_id}}", branch_id: "{{reschedule_original_branch_id}}", consultation_mode: "{{reschedule_original_consultation_type}}", status: "available" },
  data: {},
  schema: schemas.appointmentSlots,
  outputVar: "reschedule_available_slots_result",
  limit: 30,
  sortBy: "start",
  sortOrder: "asc"
}));
node("reschedule_filter_available_slots", "script", 3960, 500, scriptData(rescheduleFilterSlotsScript, "reschedule_filter_slots_result", 100));
node("reschedule_slot_route", "switch", 4200, 500, { variable: "reschedule_slot_route" });
node("reschedule_no_slots_message", "message", 4440, 720, msgData("I could not find another future open slot for the same doctor and consultation mode right now. The existing appointment has not been changed."));
node("reschedule_no_slots_end", "end", 4680, 720, { messages: [] });
node("reschedule_slot_booking", "appointment", 4440, 500, {
  messages: ["Choose a new available date and time for the same doctor."],
  slotMode: "dynamic",
  timezone: "Asia/Kolkata",
  slotIntervalMins: 30,
  slotDurationMins: 20,
  horizonDays: 14,
  maxSlotsPerDay: 6,
  workingHoursStart: "00:00",
  workingHoursEnd: "00:00",
  availableWeekdays: "1,2,3,4,5,6",
  dynamicSlotsVar: "reschedule_open_slots_result",
  dynamicSlotsPath: "data",
  slotsJson: "[]",
  dateVar: "reschedule_date",
  outputVar: "reschedule_booking"
});
node("reschedule_set_new_slot_vars", "setVariable", 4680, 500, setVars({
  reschedule_new_appointment_id: "APT-RESCH-{{system.sessionId}}",
  reschedule_new_slot_hold_id: "HOLD-RESCH-{{system.sessionId}}",
  reschedule_new_date: "{{reschedule_booking.date}}",
  reschedule_new_slot_id: "{{reschedule_booking.slotId}}",
  reschedule_new_slot_label: "{{reschedule_booking.slotLabel}}",
  reschedule_new_start_time: "{{reschedule_booking.startTime}}",
  reschedule_new_end_time: "{{reschedule_booking.endTime}}"
}));
node("reschedule_duplicate_check", "record", 4920, 500, recordData({
  action: "find",
  collection: "appointments",
  where: { patient_mobile: "{{patient_mobile}}", doctor_id: "{{reschedule_original_doctor_id}}", slot_id: "{{reschedule_new_slot_id}}", status: "confirmed" },
  data: {},
  schema: schemas.appointments,
  outputVar: "reschedule_duplicate_result",
  encryptPii: true,
  piiFields: "patient_mobile"
}));
node("reschedule_duplicate_message", "message", 5160, 720, msgData("This patient already has a confirmed appointment for the selected new slot. No changes were made to the existing appointment."));
node("reschedule_duplicate_end", "end", 5400, 720, { messages: [] });
node("reschedule_duplicate_check_unavailable_message", "message", 5160, 860, msgData("I could not complete the duplicate appointment check right now. The existing appointment has not been changed. Please try again after a few minutes."));
node("reschedule_duplicate_check_unavailable_end", "end", 5400, 860, { messages: [] });
node("reschedule_new_slot_hold_update", "record", 5160, 500, recordData({
  action: "update",
  collection: "appointment_slots",
  where: { slot_id: "{{reschedule_new_slot_id}}", doctor_id: "{{reschedule_original_doctor_id}}", branch_id: "{{reschedule_original_branch_id}}", consultation_mode: "{{reschedule_original_consultation_type}}", status: "available" },
  data: {
    id: "{{reschedule_new_slot_id}}",
    slot_id: "{{reschedule_new_slot_id}}",
    doctor_id: "{{reschedule_original_doctor_id}}",
    department: "{{reschedule_original_department}}",
    date: "{{reschedule_new_date}}",
    label: "{{reschedule_new_slot_label}}",
    start: "{{reschedule_new_start_time}}",
    end: "{{reschedule_new_end_time}}",
    status: "held",
    hold_id: "{{reschedule_new_slot_hold_id}}",
    held_by_session: "{{system.sessionId}}",
    appointment_id: "{{reschedule_new_appointment_id}}",
    branch_id: "{{reschedule_original_branch_id}}",
    consultation_mode: "{{reschedule_original_consultation_type}}",
    hold_ttl_minutes: 10
  },
  schema: schemas.appointmentSlots,
  uniqueKey: "slot_id",
  idempotencyKey: "{{reschedule_new_slot_hold_id}}",
  outputVar: "reschedule_new_slot_hold_result",
  encryptPii: false
}));
node("reschedule_new_slot_hold_failed_message", "message", 5400, 860, msgData("I could not reserve that new slot from the latest availability. The existing appointment has not been changed. Please start the reschedule again to see fresh open slots."));
node("reschedule_new_slot_hold_failed_end", "end", 5640, 860, { messages: [] });
node("reschedule_summary", "message", 5400, 500, msgData("Reschedule summary:\n\nCurrent appointment: {{reschedule_original_appointment_id}} on {{reschedule_original_appointment_date}} at {{reschedule_original_slot_label}}\nNew slot: {{reschedule_new_date}} at {{reschedule_new_slot_label}}\nDoctor: {{reschedule_original_doctor_id}}\nDepartment: {{reschedule_original_department}}\n\nIf you confirm, I will book the new slot, cancel the old appointment, and release the old slot."));
node("reschedule_final_confirm_decision", "decision", 5640, 500, decisionData("Confirm this reschedule?", "reschedule_final_confirmed"));
node("reschedule_new_slot_release_update", "record", 5880, 720, recordData({
  action: "update",
  collection: "appointment_slots",
  where: { slot_id: "{{reschedule_new_slot_id}}", hold_id: "{{reschedule_new_slot_hold_id}}", status: "held" },
  data: {
    id: "{{reschedule_new_slot_id}}",
    slot_id: "{{reschedule_new_slot_id}}",
    doctor_id: "{{reschedule_original_doctor_id}}",
    department: "{{reschedule_original_department}}",
    date: "{{reschedule_new_date}}",
    label: "{{reschedule_new_slot_label}}",
    start: "{{reschedule_new_start_time}}",
    end: "{{reschedule_new_end_time}}",
    status: "available",
    hold_id: "",
    held_by_session: "",
    appointment_id: "",
    branch_id: "{{reschedule_original_branch_id}}",
    consultation_mode: "{{reschedule_original_consultation_type}}"
  },
  schema: schemas.appointmentSlots,
  uniqueKey: "slot_id",
  idempotencyKey: "{{reschedule_new_slot_hold_id}}:release",
  outputVar: "reschedule_new_slot_release_result",
  encryptPii: false
}));
node("reschedule_final_cancel_message", "message", 6120, 720, msgData("No reschedule was made, and the newly held slot has been released."));
node("reschedule_final_cancel_end", "end", 6360, 720, { messages: [] });
node("reschedule_new_slot_booked_update", "record", 5880, 500, recordData({
  action: "update",
  collection: "appointment_slots",
  where: { slot_id: "{{reschedule_new_slot_id}}", hold_id: "{{reschedule_new_slot_hold_id}}", status: "held" },
  data: {
    id: "{{reschedule_new_slot_id}}",
    slot_id: "{{reschedule_new_slot_id}}",
    doctor_id: "{{reschedule_original_doctor_id}}",
    department: "{{reschedule_original_department}}",
    date: "{{reschedule_new_date}}",
    label: "{{reschedule_new_slot_label}}",
    start: "{{reschedule_new_start_time}}",
    end: "{{reschedule_new_end_time}}",
    status: "booked",
    hold_id: "{{reschedule_new_slot_hold_id}}",
    held_by_session: "{{system.sessionId}}",
    appointment_id: "{{reschedule_new_appointment_id}}",
    branch_id: "{{reschedule_original_branch_id}}",
    consultation_mode: "{{reschedule_original_consultation_type}}"
  },
  schema: schemas.appointmentSlots,
  uniqueKey: "slot_id",
  idempotencyKey: "{{reschedule_new_slot_hold_id}}:booked",
  outputVar: "reschedule_new_slot_booked_result",
  encryptPii: false
}));
node("reschedule_new_slot_book_failed_message", "message", 6120, 860, msgData("I could not finalize the new slot. The existing appointment has not been changed. Please try again after a few minutes."));
node("reschedule_new_slot_book_failed_end", "end", 6360, 860, { messages: [] });
node("reschedule_new_appointment_record", "record", 6120, 500, recordData({
  action: "upsert",
  collection: "appointments",
  where: { appointment_id: "{{reschedule_new_appointment_id}}" },
  data: {
    appointment_id: "{{reschedule_new_appointment_id}}",
    patient_id: "{{reschedule_original_patient_id}}",
    patient_mobile: "{{patient_mobile}}",
    branch_id: "{{reschedule_original_branch_id}}",
    consultation_type: "{{reschedule_original_consultation_type}}",
    department: "{{reschedule_original_department}}",
    doctor_id: "{{reschedule_original_doctor_id}}",
    slot_id: "{{reschedule_new_slot_id}}",
    slot_label: "{{reschedule_new_slot_label}}",
    slot_hold_id: "{{reschedule_new_slot_hold_id}}",
    appointment_date: "{{reschedule_new_date}}",
    appointment_time: "{{reschedule_new_start_time}}",
    status: "confirmed",
    payment_status: "{{reschedule_original_payment_status}}"
  },
  schema: schemas.appointments,
  uniqueKey: "appointment_id",
  idempotencyKey: "{{reschedule_new_appointment_id}}:confirmed",
  outputVar: "reschedule_new_appointment_record_result",
  encryptPii: true,
  piiFields: "patient_mobile"
}));
node("reschedule_new_appointment_record_failed_message", "message", 6360, 860, msgData("The new slot was reserved, but I could not create the new appointment record. Please contact the hospital with reference {{reschedule_new_appointment_id}} if this repeats."));
node("reschedule_new_appointment_record_failed_end", "end", 6600, 860, { messages: [] });
node("reschedule_old_cancel_update", "record", 6360, 500, recordData({
  action: "update",
  collection: "appointments",
  where: { appointment_id: "{{reschedule_original_appointment_id}}", patient_mobile: "{{patient_mobile}}", status: "confirmed" },
  data: {
    status: "cancelled",
    payment_status: "{{reschedule_original_payment_status}}"
  },
  schema: schemas.appointments,
  uniqueKey: "appointment_id",
  idempotencyKey: "{{reschedule_original_appointment_id}}:cancelled-for-reschedule",
  outputVar: "reschedule_old_cancel_result",
  encryptPii: true,
  piiFields: "patient_mobile"
}));
node("reschedule_old_cancel_failed_message", "message", 6600, 860, msgData("The new appointment was created, but I could not cancel the old appointment automatically. Please contact the hospital with new appointment ID {{reschedule_new_appointment_id}} and old appointment ID {{reschedule_original_appointment_id}}."));
node("reschedule_old_cancel_failed_end", "end", 6840, 860, { messages: [] });
node("reschedule_old_slot_release_update", "record", 6600, 500, recordData({
  action: "update",
  collection: "appointment_slots",
  where: { slot_id: "{{reschedule_original_slot_id}}", status: "booked" },
  data: {
    id: "{{reschedule_original_slot_id}}",
    slot_id: "{{reschedule_original_slot_id}}",
    doctor_id: "{{reschedule_original_doctor_id}}",
    department: "{{reschedule_original_department}}",
    date: "{{reschedule_original_appointment_date}}",
    label: "{{reschedule_original_slot_label}}",
    start: "{{reschedule_original_appointment_time}}",
    end: "",
    status: "available",
    hold_id: "",
    held_by_session: "",
    appointment_id: "",
    branch_id: "{{reschedule_original_branch_id}}",
    consultation_mode: "{{reschedule_original_consultation_type}}"
  },
  schema: schemas.appointmentSlots,
  uniqueKey: "slot_id",
  idempotencyKey: "{{reschedule_original_slot_id}}:released-after-reschedule",
  outputVar: "reschedule_old_slot_release_result",
  encryptPii: false
}));
node("reschedule_old_slot_release_failed_message", "message", 6840, 860, msgData("The appointment was rescheduled, but I could not confirm release of the old slot. New appointment ID: {{reschedule_new_appointment_id}}. Please ask the hospital team to review old slot {{reschedule_original_slot_id}}."));
node("reschedule_old_slot_release_failed_end", "end", 7080, 860, { messages: [] });
node("reschedule_notify", "notification", 6840, 500, notificationData({
  templateId: "appointment_rescheduled",
  sms: "Your appointment has been rescheduled. New appointment {{reschedule_new_appointment_id}} is on {{reschedule_new_date}} at {{reschedule_new_slot_label}}.",
  emailSubject: "Appointment rescheduled",
  emailBody: "Your appointment has been rescheduled. New appointment {{reschedule_new_appointment_id}} is on {{reschedule_new_date}} at {{reschedule_new_slot_label}}. Old appointment {{reschedule_original_appointment_id}} has been cancelled.",
  outputVar: "reschedule_notification_result",
  dedupeSuffix: "appointment_reschedule"
}));
node("reschedule_audit", "audit-log", 7080, 500, auditData({
  action: "appointment_rescheduled",
  entityType: "appointment",
  entityId: "{{reschedule_new_appointment_id}}",
  metadata: { old_appointment_id: "{{reschedule_original_appointment_id}}", old_slot_id: "{{reschedule_original_slot_id}}", new_slot_id: "{{reschedule_new_slot_id}}" },
  sensitivity: "medical",
  outputVar: "reschedule_audit_result"
}));
node("reschedule_end_message", "message", 7320, 500, msgData("Your appointment has been rescheduled.\n\nOld appointment cancelled: {{reschedule_original_appointment_id}}\nNew appointment ID: {{reschedule_new_appointment_id}}\nDoctor: {{reschedule_original_doctor_id}}\nDepartment: {{reschedule_original_department}}\nNew date and time: {{reschedule_new_date}} at {{reschedule_new_slot_label}}\n\nThe previous slot has been released for other patients."));
node("reschedule_end", "end", 7560, 500, { messages: [] });

const cancelFilterFutureScript = `
const rows = Array.isArray(vars.cancel_future_appointments_result?.data)
  ? vars.cancel_future_appointments_result.data
  : [];
const today = helpers.nowIso().slice(0, 10);
const future = rows
  .filter((row) => String(row.appointment_date || "").slice(0, 10) >= today)
  .sort((a, b) => String(a.appointment_date || "").localeCompare(String(b.appointment_date || "")));
const first = future[0] || {};
vars.cancel_future_appointments = future;
vars.cancel_future_appointment_count = future.length;
vars.cancel_future_appointment_route = future.length === 0 ? "none" : future.length === 1 ? "single" : "multiple";
vars.cancel_future_appointment_options_text = future.map((item, index) => {
  const when = [item.appointment_date, item.slot_label || item.appointment_time].filter(Boolean).join(" at ");
  return String(index + 1) + ". " + item.appointment_id + " | " + when + " | " + item.department + " | " + item.doctor_id;
}).join("\\n");
vars.cancel_original_appointment_id = first.appointment_id || "";
vars.cancel_original_patient_id = first.patient_id || ("PAT-" + String(vars.patient_mobile || ""));
vars.cancel_original_slot_id = first.slot_id || "";
vars.cancel_original_slot_label = first.slot_label || "";
vars.cancel_original_doctor_id = first.doctor_id || "";
vars.cancel_original_branch_id = first.branch_id || "";
vars.cancel_original_department = first.department || "";
vars.cancel_original_consultation_type = first.consultation_type || "";
vars.cancel_original_appointment_date = first.appointment_date || "";
vars.cancel_original_appointment_time = first.appointment_time || "";
vars.cancel_original_payment_status = first.payment_status || "manual_verify";
return { route: vars.cancel_future_appointment_route, count: future.length };
`;

const cancelSelectAppointmentScript = `
const future = Array.isArray(vars.cancel_future_appointments) ? vars.cancel_future_appointments : [];
const selectedId = String(vars.cancel_selected_appointment_id || "").trim().toLowerCase();
const selected = future.find((item) => String(item.appointment_id || "").trim().toLowerCase() === selectedId);
vars.cancel_selection_route = selected ? "found" : "not_found";
const item = selected || {};
vars.cancel_original_appointment_id = item.appointment_id || "";
vars.cancel_original_patient_id = item.patient_id || ("PAT-" + String(vars.patient_mobile || ""));
vars.cancel_original_slot_id = item.slot_id || "";
vars.cancel_original_slot_label = item.slot_label || "";
vars.cancel_original_doctor_id = item.doctor_id || "";
vars.cancel_original_branch_id = item.branch_id || "";
vars.cancel_original_department = item.department || "";
vars.cancel_original_consultation_type = item.consultation_type || "";
vars.cancel_original_appointment_date = item.appointment_date || "";
vars.cancel_original_appointment_time = item.appointment_time || "";
vars.cancel_original_payment_status = item.payment_status || "manual_verify";
return { route: vars.cancel_selection_route, appointment_id: vars.cancel_original_appointment_id };
`;

node("cancel_mobile_form", "form", 1320, 860, formData("Enter the registered mobile number so I can find future appointments eligible for cancellation.", [
  { key: "patient_mobile", label: "Registered mobile number", type: "phone", required: true }
], "cancel_mobile_form_result"));
node("cancel_future_appointments_list", "record", 1560, 860, recordData({
  action: "list",
  collection: "appointments",
  where: { patient_mobile: "{{patient_mobile}}", status: "confirmed" },
  data: {},
  schema: schemas.appointments,
  outputVar: "cancel_future_appointments_result",
  limit: 20,
  sortBy: "appointment_date",
  sortOrder: "asc",
  encryptPii: true,
  piiFields: "patient_mobile"
}));
node("cancel_filter_future_appointments", "script", 1800, 860, scriptData(cancelFilterFutureScript, "cancel_filter_future_result", 100));
node("cancel_future_route", "switch", 2040, 860, { variable: "cancel_future_appointment_route" });
node("cancel_no_future_message", "message", 2280, 1020, msgData("I could not find any future confirmed appointments for this mobile number. Completed, cancelled, or unconfirmed appointments cannot be cancelled here."));
node("cancel_no_future_end", "end", 2520, 1020, { messages: [] });
node("cancel_single_details_message", "message", 2280, 820, msgData("I found this future appointment:\n\n{{cancel_future_appointment_options_text}}\n\nDo you want to cancel this appointment?"));
node("cancel_multiple_details_message", "message", 2280, 900, msgData("I found multiple future appointments for this mobile number:\n\n{{cancel_future_appointment_options_text}}\n\nPlease enter the Appointment ID you want to cancel."));
node("cancel_select_appointment_form", "form", 2520, 900, formData("Enter the Appointment ID to cancel.", [
  { key: "cancel_selected_appointment_id", label: "Appointment ID", type: "text", required: true }
], "cancel_select_appointment_form_result"));
node("cancel_select_appointment", "script", 2760, 900, scriptData(cancelSelectAppointmentScript, "cancel_select_appointment_result", 100));
node("cancel_selection_route", "switch", 3000, 900, { variable: "cancel_selection_route" });
node("cancel_selected_details_message", "message", 3240, 900, msgData("Selected appointment:\n\nAppointment ID: {{cancel_original_appointment_id}}\nDoctor: {{cancel_original_doctor_id}}\nDepartment: {{cancel_original_department}}\nDate and time: {{cancel_original_appointment_date}} at {{cancel_original_slot_label}}\nPayment status: {{cancel_original_payment_status}}\n\nDo you want to cancel this appointment?"));
node("cancel_selection_not_found_message", "message", 3240, 1040, msgData("I could not match that Appointment ID with the future confirmed appointments for this mobile number. Please check the ID and start the cancellation request again."));
node("cancel_selection_not_found_end", "end", 3480, 1040, { messages: [] });
node("cancel_confirm_decision", "decision", 3480, 860, decisionData("Confirm cancellation for this appointment?", "cancel_confirmed"));
node("cancel_abort_message", "message", 3720, 1040, msgData("No changes were made to the appointment."));
node("cancel_abort_end", "end", 3960, 1040, { messages: [] });
node("cancel_record_update", "record", 3720, 860, recordData({
  action: "update",
  collection: "appointments",
  where: { appointment_id: "{{cancel_original_appointment_id}}", patient_mobile: "{{patient_mobile}}", status: "confirmed" },
  data: {
    status: "cancelled",
    payment_status: "{{cancel_original_payment_status}}"
  },
  schema: schemas.appointments,
  uniqueKey: "appointment_id",
  idempotencyKey: "{{cancel_original_appointment_id}}:cancelled",
  outputVar: "cancel_record_result",
  encryptPii: true,
  piiFields: "patient_mobile"
}));
node("cancel_record_failed_message", "message", 3960, 1040, msgData("I could not cancel the selected appointment right now. Please try again after a few minutes. No slot was released."));
node("cancel_record_failed_end", "end", 4200, 1040, { messages: [] });
node("cancel_slot_release_update", "record", 3960, 860, recordData({
  action: "update",
  collection: "appointment_slots",
  where: { slot_id: "{{cancel_original_slot_id}}", status: "booked" },
  data: {
    id: "{{cancel_original_slot_id}}",
    slot_id: "{{cancel_original_slot_id}}",
    doctor_id: "{{cancel_original_doctor_id}}",
    department: "{{cancel_original_department}}",
    date: "{{cancel_original_appointment_date}}",
    label: "{{cancel_original_slot_label}}",
    start: "{{cancel_original_appointment_time}}",
    end: "",
    status: "available",
    hold_id: "",
    held_by_session: "",
    appointment_id: "",
    branch_id: "{{cancel_original_branch_id}}",
    consultation_mode: "{{cancel_original_consultation_type}}"
  },
  schema: schemas.appointmentSlots,
  uniqueKey: "slot_id",
  idempotencyKey: "{{cancel_original_slot_id}}:released-after-cancel",
  outputVar: "cancel_slot_release_result",
  encryptPii: false
}));
node("cancel_slot_release_failed_message", "message", 4200, 1040, msgData("The appointment was cancelled, but I could not confirm release of the old slot. Please ask the hospital team to review slot {{cancel_original_slot_id}}."));
node("cancel_slot_release_failed_end", "end", 4440, 1040, { messages: [] });
node("cancel_notify", "notification", 4200, 860, notificationData({
  templateId: "appointment_cancelled",
  sms: "Your appointment {{cancel_original_appointment_id}} has been cancelled. The finance team will contact you if refund processing is applicable.",
  emailSubject: "Appointment cancelled",
  emailBody: "Your appointment {{cancel_original_appointment_id}} has been cancelled. The finance team will contact you if refund processing is applicable under hospital policy.",
  outputVar: "cancel_notification_result",
  dedupeSuffix: "appointment_cancel"
}));
node("cancel_audit", "audit-log", 4440, 860, auditData({
  action: "appointment_cancelled",
  entityType: "appointment",
  entityId: "{{cancel_original_appointment_id}}",
  metadata: { slot_id: "{{cancel_original_slot_id}}", payment_status: "{{cancel_original_payment_status}}", refund_review: "finance_team" },
  sensitivity: "medical",
  outputVar: "cancel_audit_result"
}));
node("cancel_end_message", "message", 4680, 860, msgData("Your appointment has been cancelled.\n\nAppointment ID: {{cancel_original_appointment_id}}\nDoctor: {{cancel_original_doctor_id}}\nDepartment: {{cancel_original_department}}\nCancelled slot: {{cancel_original_appointment_date}} at {{cancel_original_slot_label}}\n\nThe slot has been released for other patients. If any refund is applicable, the finance team will contact you and process it according to hospital policy."));
node("cancel_end", "end", 4920, 860, { messages: [] });
edge("existing_appointment_form", "existing_appointment_find");
edge("existing_appointment_find", "existing_appointment_router", { condition: { operator: "equals", value: "success" }, label: "success" });
edge("existing_appointment_find", "existing_appointment_not_found_message", { isDefault: true, label: "not_found/default" });
edge("existing_appointment_not_found_message", "existing_appointment_not_found_end");
edge("existing_appointment_router", "appointment_status_message", { condition: { operator: "equals", value: "status" }, label: "status" });
edge("existing_appointment_router", "appointment_status_message", { isDefault: true, label: "default" });
edge("appointment_status_message", "appointment_status_end");
edge("reschedule_mobile_form", "reschedule_future_appointments_list");
recordContinue("reschedule_future_appointments_list", "reschedule_filter_future_appointments");
edge("reschedule_filter_future_appointments", "reschedule_future_route", { condition: { operator: "equals", value: "success" }, label: "success" });
edge("reschedule_filter_future_appointments", "reschedule_no_future_message", { isDefault: true, label: "failure/default" });
edge("reschedule_future_route", "reschedule_no_future_message", { condition: { operator: "equals", value: "none" }, label: "none" });
edge("reschedule_future_route", "reschedule_single_details_message", { condition: { operator: "equals", value: "single" }, label: "single" });
edge("reschedule_future_route", "reschedule_multiple_details_message", { condition: { operator: "equals", value: "multiple" }, label: "multiple" });
edge("reschedule_future_route", "reschedule_no_future_message", { isDefault: true, label: "default" });
edge("reschedule_no_future_message", "reschedule_no_future_end");
edge("reschedule_single_details_message", "reschedule_confirm_decision");
edge("reschedule_multiple_details_message", "reschedule_select_appointment_form");
edge("reschedule_select_appointment_form", "reschedule_select_appointment");
edge("reschedule_select_appointment", "reschedule_selection_route", { condition: { operator: "equals", value: "success" }, label: "success" });
edge("reschedule_select_appointment", "reschedule_selection_not_found_message", { isDefault: true, label: "failure/default" });
edge("reschedule_selection_route", "reschedule_selected_details_message", { condition: { operator: "equals", value: "found" }, label: "found" });
edge("reschedule_selection_route", "reschedule_selection_not_found_message", { isDefault: true, label: "not_found/default" });
edge("reschedule_selected_details_message", "reschedule_confirm_decision");
edge("reschedule_selection_not_found_message", "reschedule_selection_not_found_end");
edge("reschedule_confirm_decision", "reschedule_available_slots_list", { condition: { operator: "equals", value: "yes" }, label: "yes" });
edge("reschedule_confirm_decision", "reschedule_cancel_message", { isDefault: true, label: "no/default" });
edge("reschedule_cancel_message", "reschedule_cancel_end");
edge("reschedule_available_slots_list", "reschedule_filter_available_slots");
edge("reschedule_filter_available_slots", "reschedule_slot_route", { condition: { operator: "equals", value: "success" }, label: "success" });
edge("reschedule_filter_available_slots", "reschedule_no_slots_message", { isDefault: true, label: "failure/default" });
edge("reschedule_slot_route", "reschedule_slot_booking", { condition: { operator: "equals", value: "available" }, label: "available" });
edge("reschedule_slot_route", "reschedule_no_slots_message", { isDefault: true, label: "none/default" });
edge("reschedule_no_slots_message", "reschedule_no_slots_end");
edge("reschedule_slot_booking", "reschedule_set_new_slot_vars");
edge("reschedule_set_new_slot_vars", "reschedule_duplicate_check");
edge("reschedule_duplicate_check", "reschedule_duplicate_message", { condition: { operator: "equals", value: "success" }, label: "duplicate_found" });
edge("reschedule_duplicate_check", "reschedule_new_slot_hold_update", { condition: { operator: "equals", value: "not_found" }, label: "no_duplicate" });
edge("reschedule_duplicate_check", "reschedule_duplicate_check_unavailable_message", { isDefault: true, label: "failed/default" });
edge("reschedule_duplicate_message", "reschedule_duplicate_end");
edge("reschedule_duplicate_check_unavailable_message", "reschedule_duplicate_check_unavailable_end");
recordSuccessOnly("reschedule_new_slot_hold_update", "reschedule_summary", "reschedule_new_slot_hold_failed_message");
edge("reschedule_new_slot_hold_failed_message", "reschedule_new_slot_hold_failed_end");
edge("reschedule_summary", "reschedule_final_confirm_decision");
edge("reschedule_final_confirm_decision", "reschedule_new_slot_booked_update", { condition: { operator: "equals", value: "yes" }, label: "yes" });
edge("reschedule_final_confirm_decision", "reschedule_new_slot_release_update", { isDefault: true, label: "no/default" });
recordContinue("reschedule_new_slot_release_update", "reschedule_final_cancel_message");
edge("reschedule_final_cancel_message", "reschedule_final_cancel_end");
recordSuccessOnly("reschedule_new_slot_booked_update", "reschedule_new_appointment_record", "reschedule_new_slot_book_failed_message");
edge("reschedule_new_slot_book_failed_message", "reschedule_new_slot_book_failed_end");
recordSuccessOnly("reschedule_new_appointment_record", "reschedule_old_cancel_update", "reschedule_new_appointment_record_failed_message");
edge("reschedule_new_appointment_record_failed_message", "reschedule_new_appointment_record_failed_end");
recordSuccessOnly("reschedule_old_cancel_update", "reschedule_old_slot_release_update", "reschedule_old_cancel_failed_message");
edge("reschedule_old_cancel_failed_message", "reschedule_old_cancel_failed_end");
recordSuccessOnly("reschedule_old_slot_release_update", "reschedule_notify", "reschedule_old_slot_release_failed_message");
edge("reschedule_old_slot_release_failed_message", "reschedule_old_slot_release_failed_end");
notifyToNext("reschedule_notify", "reschedule_audit");
auditToNext("reschedule_audit", "reschedule_end_message");
edge("reschedule_end_message", "reschedule_end");
edge("cancel_mobile_form", "cancel_future_appointments_list");
recordContinue("cancel_future_appointments_list", "cancel_filter_future_appointments");
edge("cancel_filter_future_appointments", "cancel_future_route", { condition: { operator: "equals", value: "success" }, label: "success" });
edge("cancel_filter_future_appointments", "cancel_no_future_message", { isDefault: true, label: "failure/default" });
edge("cancel_future_route", "cancel_no_future_message", { condition: { operator: "equals", value: "none" }, label: "none" });
edge("cancel_future_route", "cancel_single_details_message", { condition: { operator: "equals", value: "single" }, label: "single" });
edge("cancel_future_route", "cancel_multiple_details_message", { condition: { operator: "equals", value: "multiple" }, label: "multiple" });
edge("cancel_future_route", "cancel_no_future_message", { isDefault: true, label: "default" });
edge("cancel_no_future_message", "cancel_no_future_end");
edge("cancel_single_details_message", "cancel_confirm_decision");
edge("cancel_multiple_details_message", "cancel_select_appointment_form");
edge("cancel_select_appointment_form", "cancel_select_appointment");
edge("cancel_select_appointment", "cancel_selection_route", { condition: { operator: "equals", value: "success" }, label: "success" });
edge("cancel_select_appointment", "cancel_selection_not_found_message", { isDefault: true, label: "failure/default" });
edge("cancel_selection_route", "cancel_selected_details_message", { condition: { operator: "equals", value: "found" }, label: "found" });
edge("cancel_selection_route", "cancel_selection_not_found_message", { isDefault: true, label: "not_found/default" });
edge("cancel_selected_details_message", "cancel_confirm_decision");
edge("cancel_selection_not_found_message", "cancel_selection_not_found_end");
edge("cancel_confirm_decision", "cancel_record_update", { condition: { operator: "equals", value: "yes" }, label: "yes" });
edge("cancel_confirm_decision", "cancel_abort_message", { isDefault: true, label: "no/default" });
edge("cancel_abort_message", "cancel_abort_end");
recordSuccessOnly("cancel_record_update", "cancel_slot_release_update", "cancel_record_failed_message");
edge("cancel_record_failed_message", "cancel_record_failed_end");
recordSuccessOnly("cancel_slot_release_update", "cancel_notify", "cancel_slot_release_failed_message");
edge("cancel_slot_release_failed_message", "cancel_slot_release_failed_end");
notifyToNext("cancel_notify", "cancel_audit");
auditToNext("cancel_audit", "cancel_end_message");
edge("cancel_end_message", "cancel_end");

node("availability_intro", "message", 1320, 880, msgData("I can help you check available consultation options by department."));
node("availability_department_input", "input", 1560, 880, inputData("Choose a department to check availability.", "availability_department", [
  { label: "General Medicine", value: "general_medicine" },
  { label: "Cardiology", value: "cardiology" },
  { label: "Orthopedics", value: "orthopedics" },
  { label: "Pediatrics", value: "pediatrics" }
]));
node("availability_doctor_list", "record", 1800, 880, recordData({
  action: "list",
  collection: "doctors",
  where: { department: "{{availability_department}}" },
  data: {},
  schema: schemas.doctors,
  outputVar: "availability_doctors_result",
  limit: 10
}));
node("availability_carousel", "carousel", 2040, 880, carouselData("Available consultation options.", [
  { id: "availability_1", type: "card", title: "General Medicine", heading: "Main branch OPD", body: "Check consultation mode, fee, language, and next available slot before booking." },
  { id: "availability_2", type: "card", title: "Cardiology", heading: "Specialist consultation", body: "Review branch timing, consultation fee, language, and available appointment options." },
  { id: "availability_3", type: "card", title: "Orthopedics", heading: "Bone and joint consultation", body: "Choose from available care-team slots for injury, joint, spine, and mobility concerns." }
]));
node("availability_book_decision", "decision", 2280, 880, decisionData("Do you want to book one of these doctors?", "availability_book_appointment"));
node("availability_set_department", "setVariable", 2520, 880, setVars({ department: "{{availability_department}}" }));
node("availability_end_message", "message", 2520, 1040, msgData("No problem. You can return any time to book an appointment or talk to the hospital team."));
node("availability_end", "end", 2760, 1040, { messages: [] });
edge("availability_intro", "availability_department_input");
edge("availability_department_input", "availability_doctor_list");
edge("availability_doctor_list", "availability_carousel", { condition: { operator: "equals", value: "success" }, label: "success" });
edge("availability_doctor_list", "availability_carousel", { isDefault: true, label: "default" });
edge("availability_carousel", "availability_book_decision");
edge("availability_book_decision", "availability_set_department", { condition: { operator: "equals", value: "yes" }, label: "yes" });
edge("availability_book_decision", "availability_end_message", { isDefault: true, label: "no/default" });
edge("availability_set_department", "existing_patient_lookup_form");
edge("availability_end_message", "availability_end");

node("doctor_profile_input", "input", 1320, 1040, inputData("Enter a doctor name or department to view consultation details.", "doctor_profile_query", []));
node("doctor_profile_lookup", "record", 1560, 1040, recordData({
  action: "list",
  collection: "doctors",
  where: { query: "{{doctor_profile_query}}" },
  data: {},
  schema: schemas.doctors,
  outputVar: "doctor_profile_result",
  limit: 10
}));
node("doctor_profile_carousel", "carousel", 1800, 1040, carouselData("Consultation details and available care teams.", [
  {
    id: "profile_general_medicine",
    type: "card",
    title: "General Medicine Consultant",
    heading: "OPD, follow-up, and routine care",
    body: "View qualification, languages, branch, consultation mode, fee, timings, and next available slot before booking.",
    cta: { label: "Book", value: "general_medicine" }
  },
  {
    id: "profile_cardiology",
    type: "card",
    title: "Cardiology Consultant",
    heading: "Heart care consultation",
    body: "Review branch, timing, language, consultation mode, fee, and next availability before booking.",
    cta: { label: "Book", value: "cardiology" }
  },
  {
    id: "profile_orthopedics",
    type: "card",
    title: "Orthopedics Consultant",
    heading: "Bone, joint, and spine consultation",
    body: "Check care-team profile details and available slots for injury, joint, spine, and mobility concerns.",
    cta: { label: "Book", value: "orthopedics" }
  }
]));
node("doctor_profile_book_decision", "decision", 2040, 1040, decisionData("Would you like to book an appointment with one of these care teams?", "doctor_profile_book_appointment"));
node("doctor_profile_department_input", "input", 2280, 1040, inputData("Choose the department you want to book.", "department", [
  { label: "General Medicine", value: "general_medicine" },
  { label: "Cardiology", value: "cardiology" },
  { label: "Orthopedics", value: "orthopedics" },
  { label: "Pediatrics", value: "pediatrics" },
  { label: "Gynecology", value: "gynecology" },
  { label: "Dermatology", value: "dermatology" }
]));
node("doctor_profile_end_message", "message", 2280, 1180, msgData("No problem. You can come back any time to check doctor information or book an appointment."));
node("doctor_profile_end", "end", 2520, 1180, { messages: [] });
edge("doctor_profile_input", "doctor_profile_lookup");
edge("doctor_profile_lookup", "doctor_profile_carousel", { condition: { operator: "equals", value: "success" }, label: "success" });
edge("doctor_profile_lookup", "doctor_profile_carousel", { isDefault: true, label: "default" });
edge("doctor_profile_carousel", "doctor_profile_book_decision");
edge("doctor_profile_book_decision", "doctor_profile_department_input", { condition: { operator: "equals", value: "yes" }, label: "yes" });
edge("doctor_profile_book_decision", "doctor_profile_end_message", { isDefault: true, label: "no/default" });
edge("doctor_profile_department_input", "existing_patient_lookup_form");
edge("doctor_profile_end_message", "doctor_profile_end");

node("department_reason_input", "input", 1320, 1120, inputData("Briefly describe the concern. I can guide you to the right department, but this chat cannot diagnose medical conditions.", "department_reason", []));
node("department_choice_input", "input", 1560, 1120, inputData("Choose the department that best matches your concern. If symptoms feel urgent, choose emergency.", "department_choice", [
  { label: "Emergency", value: "emergency_symptom" },
  { label: "General Medicine", value: "general_medicine" },
  { label: "Cardiology", value: "cardiology" },
  { label: "Orthopedics", value: "orthopedics" },
  { label: "Dermatology", value: "dermatology" },
  { label: "Pediatrics", value: "pediatrics" },
  { label: "Gynecology", value: "gynecology" }
]));
node("department_safe_message", "message", 1800, 1120, msgData("Based on what you shared, I will continue with the relevant department for appointment support. A doctor will make the medical assessment."));
node("department_set_general", "setVariable", 2040, 1120, setVars({ department: "general_medicine" }));
node("department_set_cardiology", "setVariable", 2040, 1000, setVars({ department: "cardiology" }));
node("department_set_orthopedics", "setVariable", 2040, 1240, setVars({ department: "orthopedics" }));
node("department_set_dermatology", "setVariable", 2040, 1360, setVars({ department: "dermatology" }));
node("department_set_pediatrics", "setVariable", 2040, 1480, setVars({ department: "pediatrics" }));
node("department_set_gynecology", "setVariable", 2040, 1600, setVars({ department: "gynecology" }));
edge("department_reason_input", "department_choice_input");
edge("department_choice_input", "emergency_safety_message", { condition: { operator: "equals", value: "emergency_symptom" }, label: "emergency_symptom" });
edge("department_choice_input", "department_set_cardiology", { condition: { operator: "equals", value: "cardiology" }, label: "cardiology" });
edge("department_choice_input", "department_set_general", { condition: { operator: "equals", value: "general_medicine" }, label: "general_medicine" });
edge("department_choice_input", "department_set_orthopedics", { condition: { operator: "equals", value: "orthopedics" }, label: "orthopedics" });
edge("department_choice_input", "department_set_dermatology", { condition: { operator: "equals", value: "dermatology" }, label: "dermatology" });
edge("department_choice_input", "department_set_pediatrics", { condition: { operator: "equals", value: "pediatrics" }, label: "pediatrics" });
edge("department_choice_input", "department_set_gynecology", { condition: { operator: "equals", value: "gynecology" }, label: "gynecology" });
edge("department_choice_input", "department_set_general", { isDefault: true, label: "default" });
edge("department_set_cardiology", "department_safe_message");
edge("department_set_general", "department_safe_message");
edge("department_set_orthopedics", "department_safe_message");
edge("department_set_dermatology", "department_safe_message");
edge("department_set_pediatrics", "department_safe_message");
edge("department_set_gynecology", "department_safe_message");
edge("department_safe_message", "existing_patient_lookup_form");

node("online_patient_lookup_form", "form", 1320, 1260, formData("Enter the patient's mobile number so I can check the hospital record before booking an online consultation.", [
  { key: "patient_mobile", label: "Mobile number", type: "phone", required: true }
], "online_patient_lookup_form_result"));
node("online_patient_find", "record", 1560, 1260, recordData({
  action: "find",
  collection: "patients",
  where: { mobile: "{{patient_mobile}}" },
  data: {},
  schema: schemas.patients,
  outputVar: "online_patient_result",
  encryptPii: true,
  piiFields: "patient_mobile"
}));
node("online_existing_patient_set", "setVariable", 1800, 1260, setVars({
  online_patient_flow_type: "existing",
  patient_id: "{{online_patient_result.data.patient_id}}",
  patient_name: "{{online_patient_result.data.name}}",
  patient_mobile: "{{online_patient_result.data.mobile}}",
  patient_email: "{{online_patient_result.data.email}}",
  patient_age: "{{online_patient_result.data.age}}",
  patient_gender: "{{online_patient_result.data.gender}}",
  patient_location: "{{online_patient_result.data.location}}",
  preferred_language: "{{online_patient_result.data.preferred_language}}"
}));
node("online_new_patient_prepare", "setVariable", 1800, 1400, setVars({
  online_patient_flow_type: "new"
}));
node("online_patient_not_found_message", "message", 2040, 1400, msgData("I could not find an existing hospital profile for this mobile number. I will collect the remaining details before booking the online consultation."));
node("online_patient_lookup_unavailable_message", "message", 1800, 1540, msgData("I could not check the patient profile right now. Please try again after a few minutes so we can avoid duplicate patient records."));
node("online_patient_lookup_unavailable_end", "end", 2040, 1540, { messages: [] });
node("online_consent", "auth-consent", 2280, 1260, {
  consentText: "Online consultation is not for emergencies. For urgent symptoms, call the emergency number or visit the nearest emergency department. Reply YES to continue with consultation booking and hospital staff review.",
  requireOtp: false,
  otpVar: "online_consult_otp",
  outputVar: "online_consult_consent"
});
node("online_consent_accept_record", "record", 2520, 1260, consentRecordData({
  id: "CONS-ONLINE-{{system.sessionId}}",
  type: "online_consultation",
  status: "accepted",
  purpose: "Online consultation consent before symptom intake and doctor callback routing.",
  outputVar: "online_consent_accept_record_result"
}));
node("online_consent_decline_record", "record", 2520, 1400, consentRecordData({
  id: "CONS-ONLINE-DENIED-{{system.sessionId}}",
  type: "online_consultation",
  status: "declined",
  purpose: "Online consultation consent declined before symptom intake.",
  outputVar: "online_consent_decline_record_result"
}));
node("online_patient_flow_router", "switch", 2760, 1260, { variable: "online_patient_flow_type" });
node("online_symptom_form", "form", 3000, 1120, formData("Briefly share the reason for the online consultation.", [
  { key: "symptom_summary", label: "Symptoms or reason", type: "textarea", required: true }
], "online_consult_existing_form"));
node("online_form", "form", 3000, 1260, formData("Share the remaining patient details and the consultation reason.", [
  ...bookingPatientDetailFields,
  { key: "symptom_summary", label: "Symptoms or reason", type: "textarea", required: true }
], "online_consult_form"));
node("online_patient_record", "record", 3240, 1260, patientUpsert("online_patient_record_result"));
node("online_record", "record", 3480, 1260, recordData({
  action: "upsert",
  collection: "support_tickets",
  where: { ticket_id: "OC-{{system.sessionId}}" },
  data: { ticket_id: "OC-{{system.sessionId}}", patient_mobile: "{{patient_mobile}}", department: "doctor_callback", priority: "normal", issue_type: "online_consultation", status: "pending_payment", conversation_summary: "{{symptom_summary}}" },
  schema: schemas.tickets,
  uniqueKey: "ticket_id",
  idempotencyKey: "OC-{{system.sessionId}}",
  outputVar: "online_consult_ticket_result",
  encryptPii: true,
  piiFields: "patient_mobile,conversation_summary"
}));
node("online_appointment", "appointment", 3720, 1260, {
  messages: ["Choose a preferred online consultation slot."],
  slotMode: "static",
  timezone: "Asia/Kolkata",
  slotIntervalMins: 30,
  slotDurationMins: 20,
  horizonDays: 7,
  maxSlotsPerDay: 5,
  workingHoursStart: "10:00",
  workingHoursEnd: "19:00",
  availableWeekdays: "1,2,3,4,5,6",
  slotsJson: pretty([{ id: "online_morning", label: "Online morning", time: "11:00" }, { id: "online_evening", label: "Online evening", time: "18:00" }]),
  dateVar: "online_consult_date",
  outputVar: "online_consult_booking"
});
node("online_payment", "payment", 3960, 1260, paymentData({ amount: "{{online_consult_fee}}", description: "Online consultation fee", outputVar: "online_payment_result" }));
node("online_payment_failed_message", "message", 4200, 1400, msgData("The online consultation payment was not completed. No consultation request has been confirmed. You can start a new online consultation booking whenever you are ready."));
node("online_payment_failed_end", "end", 4440, 1400, { messages: [] });
node("online_paid_record_update", "record", 4200, 1260, recordData({
  action: "upsert",
  collection: "support_tickets",
  where: { ticket_id: "OC-{{system.sessionId}}" },
  data: {
    ticket_id: "OC-{{system.sessionId}}",
    patient_mobile: "{{patient_mobile}}",
    department: "doctor_callback",
    priority: "normal",
    issue_type: "online_consultation",
    status: "paid_pending_callback",
    conversation_summary: "{{symptom_summary}}"
  },
  schema: schemas.tickets,
  uniqueKey: "ticket_id",
  idempotencyKey: "OC-{{system.sessionId}}:paid",
  outputVar: "online_paid_ticket_result",
  encryptPii: true,
  piiFields: "patient_mobile,conversation_summary"
}));
node("online_notify", "notification", 4440, 1260, notificationData({
  templateId: "online_consultation_booked",
  sms: "Your online consultation is booked. Keep your phone available for the selected slot.",
  emailSubject: "Online consultation request received",
  emailBody: "Your online consultation is booked. Keep your phone available for the selected slot.",
  outputVar: "online_notification_result",
  dedupeSuffix: "online_consultation"
}));
node("online_audit", "audit-log", 4680, 1260, auditData({
  action: "online_consultation_requested",
  entityType: "support_ticket",
  entityId: "OC-{{system.sessionId}}",
  metadata: { consent: "{{online_consult_consent}}", channel: "{{system.channel}}" },
  sensitivity: "medical",
  outputVar: "online_audit_result"
}));
node("online_confirmation", "message", 4920, 1260, msgData("Your online consultation has been booked and payment is confirmed. For urgent symptoms, call {{emergency_phone}}."));
node("online_end", "end", 5160, 1260, { messages: [] });
node("online_denied_message", "message", 2760, 1540, msgData("Consent is required for online consultation booking. No consultation request has been created."));
node("online_denied_end", "end", 3000, 1540, { messages: [] });
edge("online_patient_lookup_form", "online_patient_find");
edge("online_patient_find", "online_existing_patient_set", { condition: { operator: "equals", value: "success" }, label: "success" });
edge("online_patient_find", "online_new_patient_prepare", { condition: { operator: "equals", value: "not_found" }, label: "not_found" });
edge("online_patient_find", "online_patient_lookup_unavailable_message", { isDefault: true, label: "failed/default" });
edge("online_existing_patient_set", "online_consent");
edge("online_new_patient_prepare", "online_patient_not_found_message");
edge("online_patient_not_found_message", "online_consent");
edge("online_patient_lookup_unavailable_message", "online_patient_lookup_unavailable_end");
edge("online_consent", "online_consent_accept_record", { condition: { operator: "equals", value: "accepted" }, label: "accepted" });
edge("online_consent", "online_consent_decline_record", { isDefault: true, label: "denied/default" });
recordSuccessOrManual("online_consent_accept_record", "online_patient_flow_router", "online_denied_message");
edge("online_consent_decline_record", "online_denied_message");
edge("online_denied_message", "online_denied_end");
edge("online_patient_flow_router", "online_symptom_form", { condition: { operator: "equals", value: "existing" }, label: "existing" });
edge("online_patient_flow_router", "online_form", { isDefault: true, label: "new/default" });
edge("online_symptom_form", "online_record");
edge("online_form", "online_patient_record");
recordContinue("online_patient_record", "online_record");
recordContinue("online_record", "online_appointment");
edge("online_appointment", "online_payment");
edge("online_payment", "online_paid_record_update", { condition: { operator: "equals", value: "paid" }, label: "paid" });
edge("online_payment", "online_payment_failed_message", { isDefault: true, label: "failed/default" });
edge("online_payment_failed_message", "online_payment_failed_end");
recordContinue("online_paid_record_update", "online_notify");
notifyToNext("online_notify", "online_audit");
auditToNext("online_audit", "online_confirmation");
edge("online_confirmation", "online_end");

node("packages_carousel", "carousel", 1320, 1660, carouselData("Choose a health checkup package.", [
  { id: "basic_health", type: "card", title: "Basic Health", heading: "Vitals, CBC, sugar", body: "Starter preventive checkup.", cta: { label: "Choose", value: "basic_health" } },
  { id: "cardiac_care", type: "card", title: "Cardiac Care", heading: "Heart risk screening", body: "Recommended for cardiac risk review.", cta: { label: "Choose", value: "cardiac_care" } },
  { id: "executive_health", type: "card", title: "Executive Health", heading: "Comprehensive profile", body: "Full preventive package.", cta: { label: "Choose", value: "executive_health" } }
]));
node("package_input", "input", 1560, 1660, inputData("Select the package.", "package_id", [
  { label: "Basic Health", value: "basic_health" },
  { label: "Cardiac Care", value: "cardiac_care" },
  { label: "Executive Health", value: "executive_health" }
]));
node("package_form", "form", 1800, 1660, formData("Share patient details for the package booking.", [
  ...patientFields,
  { key: "package_preferred_date", label: "Preferred package date", type: "date", required: true },
  { key: "package_preferred_time", label: "Preferred time window", type: "select", required: false, options: ["morning", "afternoon", "evening"] }
], "package_patient_form"));
node("package_record", "record", 2040, 1660, recordData({
  action: "upsert",
  collection: "lab_requests",
  where: { lab_request_id: "PKG-{{system.sessionId}}" },
  data: {
    lab_request_id: "PKG-{{system.sessionId}}",
    test_id: "{{package_id}}",
    patient_mobile: "{{patient_mobile}}",
    sample_collection_type: "hospital_visit",
    location: "{{patient_location}}",
    preferred_date: "{{package_preferred_date}}",
    preferred_time: "{{package_preferred_time}}",
    status: "pending_payment"
  },
  schema: schemas.labRequests,
  uniqueKey: "lab_request_id",
  idempotencyKey: "PKG-{{system.sessionId}}",
  outputVar: "package_record_result",
  encryptPii: true,
  piiFields: "patient_mobile,location"
}));
node("package_payment", "payment", 2280, 1660, paymentData({ amount: "{{health_package_fee}}", description: "Health checkup package fee", outputVar: "package_payment_result" }));
node("package_payment_failed_message", "message", 2520, 1800, msgData("The health package payment was not completed, so the package request has not been confirmed. You can start a new package booking whenever you are ready."));
node("package_payment_failed_end", "end", 2760, 1800, { messages: [] });
node("package_paid_record_update", "record", 2520, 1660, recordData({
  action: "upsert",
  collection: "lab_requests",
  where: { lab_request_id: "PKG-{{system.sessionId}}" },
  data: {
    lab_request_id: "PKG-{{system.sessionId}}",
    test_id: "{{package_id}}",
    patient_mobile: "{{patient_mobile}}",
    sample_collection_type: "hospital_visit",
    location: "{{patient_location}}",
    preferred_date: "{{package_preferred_date}}",
    preferred_time: "{{package_preferred_time}}",
    status: "paid_pending_confirmation"
  },
  schema: schemas.labRequests,
  uniqueKey: "lab_request_id",
  idempotencyKey: "PKG-{{system.sessionId}}:paid",
  outputVar: "package_paid_record_result",
  encryptPii: true,
  piiFields: "patient_mobile,location"
}));
node("package_notify", "notification", 2760, 1660, notificationData({
  templateId: "health_package_booked",
  sms: "Your health package request is received. The hospital team will confirm preparation instructions.",
  emailSubject: "Health package request received",
  emailBody: "Your health package request is received. The hospital team will confirm preparation instructions.",
  outputVar: "package_notification_result",
  dedupeSuffix: "health_package"
}));
node("package_end_message", "message", 3000, 1660, msgData("Your health package booking is confirmed. Please follow the preparation instructions sent to your registered contact information."));
node("package_end", "end", 3240, 1660, { messages: [] });
edge("packages_carousel", "package_input");
edge("package_input", "package_form");
edge("package_form", "package_record");
recordContinue("package_record", "package_payment");
edge("package_payment", "package_paid_record_update", { condition: { operator: "equals", value: "paid" }, label: "paid" });
edge("package_payment", "package_payment_failed_message", { isDefault: true, label: "failed/default" });
edge("package_payment_failed_message", "package_payment_failed_end");
recordContinue("package_paid_record_update", "package_notify");
notifyToNext("package_notify", "package_end_message");
edge("package_end_message", "package_end");

node("lab_form", "form", 1320, 2100, formData("Share lab test or home collection details.", [
  ...patientFields,
  { key: "test_id", label: "Test or package name", type: "text", required: true },
  { key: "sample_collection_type", label: "Sample collection", type: "select", required: true, options: ["hospital_visit", "home_collection"] },
  { key: "lab_preferred_date", label: "Preferred date", type: "date", required: true },
  { key: "lab_preferred_time", label: "Preferred time window", type: "select", required: false, options: ["morning", "afternoon", "evening"] }
], "lab_request_form"));
node("lab_record", "record", 1560, 2100, recordData({
  action: "upsert",
  collection: "lab_requests",
  where: { lab_request_id: "LAB-{{system.sessionId}}" },
  data: {
    lab_request_id: "LAB-{{system.sessionId}}",
    test_id: "{{test_id}}",
    patient_mobile: "{{patient_mobile}}",
    sample_collection_type: "{{sample_collection_type}}",
    location: "{{patient_location}}",
    preferred_date: "{{lab_preferred_date}}",
    preferred_time: "{{lab_preferred_time}}",
    status: "pending_payment"
  },
  schema: schemas.labRequests,
  uniqueKey: "lab_request_id",
  idempotencyKey: "LAB-{{system.sessionId}}",
  outputVar: "lab_request_record_result",
  encryptPii: true,
  piiFields: "patient_mobile,location"
}));
node("lab_payment", "payment", 1800, 2100, paymentData({ amount: "{{lab_test_fee}}", description: "Lab test or sample collection fee", outputVar: "lab_payment_result" }));
node("lab_payment_failed_message", "message", 2040, 2240, msgData("The lab payment was not completed, so the lab request has not been confirmed. You can start a new lab booking whenever you are ready."));
node("lab_payment_failed_end", "end", 2280, 2240, { messages: [] });
node("lab_paid_record_update", "record", 2040, 2100, recordData({
  action: "upsert",
  collection: "lab_requests",
  where: { lab_request_id: "LAB-{{system.sessionId}}" },
  data: {
    lab_request_id: "LAB-{{system.sessionId}}",
    test_id: "{{test_id}}",
    patient_mobile: "{{patient_mobile}}",
    sample_collection_type: "{{sample_collection_type}}",
    location: "{{patient_location}}",
    preferred_date: "{{lab_preferred_date}}",
    preferred_time: "{{lab_preferred_time}}",
    status: "paid_pending_confirmation"
  },
  schema: schemas.labRequests,
  uniqueKey: "lab_request_id",
  idempotencyKey: "LAB-{{system.sessionId}}:paid",
  outputVar: "lab_paid_record_result",
  encryptPii: true,
  piiFields: "patient_mobile,location"
}));
node("lab_notify", "notification", 2520, 2100, notificationData({
  templateId: "lab_request_received",
  sms: "Your lab request is confirmed. Please follow the preparation and timing details shared.",
  emailSubject: "Lab request received",
  emailBody: "Your lab request is confirmed. Please follow the preparation and timing details shared.",
  outputVar: "lab_notification_result",
  dedupeSuffix: "lab_request"
}));
node("lab_end_message", "message", 2760, 2100, msgData("Your lab request is confirmed. Please follow the instructions sent to your registered contact information."));
node("lab_end", "end", 3000, 2100, { messages: [] });
edge("lab_form", "lab_record");
recordContinue("lab_record", "lab_payment");
edge("lab_payment", "lab_paid_record_update", { condition: { operator: "equals", value: "paid" }, label: "paid" });
edge("lab_payment", "lab_payment_failed_message", { isDefault: true, label: "failed/default" });
edge("lab_payment_failed_message", "lab_payment_failed_end");
recordContinue("lab_paid_record_update", "lab_notify");
notifyToNext("lab_notify", "lab_end_message");
edge("lab_end_message", "lab_end");

node("report_form", "form", 1320, 2500, formData("Enter the report ID and registered mobile number.", [
  { key: "report_id", label: "Report ID", type: "text", required: true },
  { key: "patient_mobile", label: "Registered mobile number", type: "phone", required: true },
  { key: "patient_email", label: "Email for secure link", type: "email", required: false }
], "report_lookup_form"));
node("report_consent", "auth-consent", 1560, 2500, {
  consentText: "Report status and links are sensitive medical information. Reply YES to confirm consent before status sharing.",
  requireOtp: false,
  otpVar: "report_otp",
  outputVar: "report_consent_status"
});
node("report_consent_accept_record", "record", 1800, 2500, consentRecordData({
  id: "CONS-REPORT-{{system.sessionId}}",
  type: "report_access",
  status: "accepted",
  purpose: "Patient consent for report status lookup and secure report link guidance.",
  relatedEntityId: "{{report_id}}",
  outputVar: "report_consent_accept_record_result"
}));
node("report_consent_decline_record", "record", 1800, 2640, consentRecordData({
  id: "CONS-REPORT-DENIED-{{system.sessionId}}",
  type: "report_access",
  status: "declined",
  purpose: "Patient declined report access consent.",
  relatedEntityId: "{{report_id}}",
  outputVar: "report_consent_decline_record_result"
}));
node("report_record_find", "record", 2040, 2500, recordData({
  action: "find",
  collection: "lab_reports",
  where: { report_id: "{{report_id}}", patient_mobile: "{{patient_mobile}}" },
  data: {},
  schema: schemas.labReports,
  outputVar: "report_lookup_result",
  encryptPii: true,
  piiFields: "patient_mobile"
}));
node("report_access_audit", "audit-log", 2280, 2500, auditData({
  action: "report_status_accessed",
  entityType: "lab_report",
  entityId: "{{report_id}}",
  metadata: { patient_mobile: "{{patient_mobile}}", consent: "{{report_consent_status}}", channel: "{{system.channel}}" },
  sensitivity: "medical",
  outputVar: "report_audit_result"
}));
node("report_status_message", "message", 2520, 2500, msgData("Your report request has been verified. If the report is ready, please use the secure report portal: {{report_portal_url}}. The lab desk can help if you need assistance."));
node("report_end", "end", 2760, 2500, { messages: [] });
node("report_consent_declined_message", "message", 2040, 2780, msgData("Consent is required before report status or links can be shared. No report details have been opened."));
node("report_consent_declined_end", "end", 2280, 2780, { messages: [] });
node("report_not_found_message", "message", 2280, 2640, msgData("I could not verify the report with the details provided. Please check the report ID and registered mobile number, then try again."));
node("report_not_found_end", "end", 2520, 2640, { messages: [] });
edge("report_form", "report_consent");
edge("report_consent", "report_consent_accept_record", { condition: { operator: "equals", value: "accepted" }, label: "accepted" });
edge("report_consent", "report_consent_decline_record", { isDefault: true, label: "denied/default" });
recordContinue("report_consent_accept_record", "report_record_find");
edge("report_consent_decline_record", "report_consent_declined_message");
edge("report_record_find", "report_access_audit", { condition: { operator: "equals", value: "success" }, label: "success" });
edge("report_record_find", "report_not_found_message", { isDefault: true, label: "not_found/failed/default" });
auditToNext("report_access_audit", "report_status_message");
edge("report_status_message", "report_end");
edge("report_consent_declined_message", "report_consent_declined_end");
edge("report_not_found_message", "report_not_found_end");

node("billing_form", "form", 1320, 2900, formData("Share billing or payment issue details.", [
  { key: "patient_name", label: "Name", type: "text", required: true },
  { key: "patient_mobile", label: "Mobile number", type: "phone", required: true },
  { key: "patient_email", label: "Email", type: "email", required: false },
  { key: "invoice_or_payment_ref", label: "Invoice or payment reference", type: "text", required: false },
  { key: "billing_issue_type", label: "Issue type", type: "select", required: true, options: ["refund", "duplicate_payment", "invoice_copy", "failed_payment", "other"] },
  { key: "billing_summary", label: "Issue summary", type: "textarea", required: true }
], "billing_form_result"));
node("billing_ticket_record", "record", 1560, 2900, recordData({
  action: "upsert",
  collection: "support_tickets",
  where: { ticket_id: "BILL-{{system.sessionId}}" },
  data: { ticket_id: "BILL-{{system.sessionId}}", patient_mobile: "{{patient_mobile}}", department: "billing_support", priority: "high", issue_type: "{{billing_issue_type}}", status: "open", conversation_summary: "{{billing_summary}}" },
  schema: schemas.tickets,
  uniqueKey: "ticket_id",
  idempotencyKey: "BILL-{{system.sessionId}}",
  outputVar: "billing_ticket_result",
  encryptPii: true,
  piiFields: "patient_mobile,conversation_summary"
}));
node("billing_notify", "notification", 1800, 2900, notificationData({
  templateId: "billing_case_received",
  sms: "Your billing request has been saved. Use reference BILL-{{system.sessionId}} for follow-up.",
  emailSubject: "Billing request saved",
  emailBody: "Your billing request has been saved. Use reference BILL-{{system.sessionId}} for follow-up.",
  outputVar: "billing_notification_result",
  dedupeSuffix: "billing_case"
}));
node("billing_end_message", "message", 2040, 2900, msgData("Your billing request has been saved. Reference: BILL-{{system.sessionId}}."));
node("billing_end", "end", 2280, 2900, { messages: [] });
edge("billing_form", "billing_ticket_record");
recordContinue("billing_ticket_record", "billing_notify");
notifyToNext("billing_notify", "billing_end_message");
edge("billing_end_message", "billing_end");

node("insurance_form", "form", 1320, 3300, formData("Share insurance and treatment details for pre-authorization or claim help.", [
  ...patientFields,
  { key: "insurer_name", label: "Insurance provider", type: "text", required: true },
  { key: "policy_number", label: "Policy number", type: "text", required: true },
  { key: "insurance_case_summary", label: "Admission or treatment summary", type: "textarea", required: true }
], "insurance_form_result"));
node("insurance_document_intake", "document-intake", 1560, 3300, {
  messages: ["Upload policy, ID, or insurer documents if available. If documents are not ready, the insurance desk can still review the details you provided."],
  acceptedTypesCsv: "pdf,jpg,jpeg,png",
  maxFiles: 5,
  minFiles: 0,
  outputVar: "insurance_documents"
});
node("insurance_document_consent", "auth-consent", 1560, 3180, {
  consentText: "Insurance documents may contain sensitive health and policy information. Reply YES to allow the hospital insurance desk to review uploaded documents for this request.",
  requireOtp: false,
  otpVar: "insurance_document_otp",
  outputVar: "insurance_document_consent_status"
});
node("insurance_document_consent_record", "record", 1800, 3180, consentRecordData({
  id: "CONS-INS-{{system.sessionId}}",
  type: "insurance_document_review",
  status: "accepted",
  purpose: "Patient consent for insurance document upload and hospital insurance desk review.",
  relatedEntityId: "INS-{{system.sessionId}}",
  outputVar: "insurance_document_consent_record_result"
}));
node("insurance_document_decline_record", "record", 1800, 3440, consentRecordData({
  id: "CONS-INS-DENIED-{{system.sessionId}}",
  type: "insurance_document_review",
  status: "declined",
  purpose: "Patient declined insurance document upload review consent.",
  relatedEntityId: "INS-{{system.sessionId}}",
  outputVar: "insurance_document_decline_record_result"
}));
node("insurance_file_processor", "file-processor", 1800, 3300, {
  inputFiles: "{{insurance_documents}}",
  processingMode: "validate",
  acceptedTypesText: "pdf,jpg,jpeg,png",
  maxFileSizeMb: 10,
  expectedDocumentType: "insurance_policy_or_identity_document",
  confidenceThreshold: 0.7,
  strictExtraction: false,
  pageMode: "process_all_pages",
  schemaJson: pretty({
    fields: {
      patient_name: "string",
      insurer_name: "string",
      policy_number: "string",
      document_type: "string"
    }
  }),
  outputVar: "insurance_file_result"
});
node("insurance_record", "record", 2040, 3300, recordData({
  action: "upsert",
  collection: "insurance_cases",
  where: { insurance_id: "INS-{{system.sessionId}}" },
  data: { insurance_id: "INS-{{system.sessionId}}", patient_mobile: "{{patient_mobile}}", insurer_name: "{{insurer_name}}", policy_number: "{{policy_number}}", case_status: "pending_human_review" },
  schema: schemas.insurance,
  uniqueKey: "insurance_id",
  idempotencyKey: "INS-{{system.sessionId}}",
  outputVar: "insurance_record_result",
  encryptPii: true,
  piiFields: "patient_mobile,policy_number"
}));
node("insurance_approval", "approval", 2280, 3300, {
  approvalTitle: "Review insurance support request",
  approvalMessage: "Review the insurance details before any final guidance is sent to the patient.",
  approversJson: pretty([{ type: "role", id: "insurance_manager" }]),
  approvers: [{ type: "role", id: "insurance_manager" }],
  approvalMode: "any_one",
  timeoutValue: 4,
  timeoutUnit: "hours",
  onTimeout: "escalate",
  buttonsCsv: "approve,reject,request_more_info",
  buttons: ["approve", "reject", "request_more_info"],
  approvalExpiryPolicy: "reject_late_action",
  waitingMessage: "Your insurance request is under review. A hospital insurance team member will confirm next steps.",
  outputVar: "insurance_approval_result"
});
node("insurance_notify", "notification", 2520, 3300, notificationData({
  templateId: "insurance_case_recorded",
  sms: "Your insurance request has been saved. Reference: INS-{{system.sessionId}}.",
  emailSubject: "Insurance request saved",
  emailBody: "Your insurance request has been saved. Reference: INS-{{system.sessionId}}.",
  outputVar: "insurance_notification_result",
  dedupeSuffix: "insurance_case"
}));
node("insurance_end_message", "message", 2760, 3300, msgData("Your insurance request has been saved. Reference: INS-{{system.sessionId}}. The status will be updated through approved hospital channels."));
node("insurance_end", "end", 3000, 3300, { messages: [] });
edge("insurance_form", "insurance_record");
recordContinue("insurance_record", "insurance_document_consent");
edge("insurance_document_consent", "insurance_document_consent_record", { condition: { operator: "equals", value: "accepted" }, label: "accepted" });
edge("insurance_document_consent", "insurance_document_decline_record", { isDefault: true, label: "denied/default" });
recordContinue("insurance_document_consent_record", "insurance_document_intake");
edge("insurance_document_decline_record", "insurance_notify");
edge("insurance_document_intake", "insurance_file_processor");
edge("insurance_file_processor", "insurance_approval", { condition: { operator: "equals", value: "success" }, label: "success" });
edge("insurance_file_processor", "insurance_approval", { condition: { operator: "equals", value: "partial" }, label: "partial" });
edge("insurance_file_processor", "insurance_notify", { condition: { operator: "equals", value: "low_confidence" }, label: "low_confidence" });
edge("insurance_file_processor", "insurance_notify", { condition: { operator: "equals", value: "manual_review_required" }, label: "manual_review_required" });
edge("insurance_file_processor", "insurance_notify", { condition: { operator: "equals", value: "invalid_file" }, label: "invalid_file" });
edge("insurance_file_processor", "insurance_notify", { isDefault: true, label: "failed/default" });
edge("insurance_approval", "insurance_notify", { condition: { operator: "equals", value: "approved" }, label: "approved" });
edge("insurance_approval", "insurance_notify", { condition: { operator: "equals", value: "more_info_required" }, label: "more_info_required" });
edge("insurance_approval", "insurance_notify", { condition: { operator: "equals", value: "timeout" }, label: "timeout" });
edge("insurance_approval", "insurance_notify", { isDefault: true, label: "rejected/failed/default" });
notifyToNext("insurance_notify", "insurance_end_message");
edge("insurance_end_message", "insurance_end");

node("admission_form", "form", 1320, 3700, formData("Share admission enquiry details.", [
  ...patientFields,
  { key: "admission_action", label: "Admission support needed", type: "select", required: true, options: ["admission_enquiry", "bed_availability", "planned_admission", "discharge_help"] },
  { key: "admission_department", label: "Department", type: "text", required: true },
  { key: "room_type", label: "Preferred room type", type: "select", required: false, options: ["general", "semi_private", "private", "icu", "not_sure"] },
  { key: "admission_summary", label: "Reason for admission enquiry", type: "textarea", required: true }
], "admission_form_result"));
node("admission_record", "record", 1560, 3700, recordData({
  action: "upsert",
  collection: "admissions",
  where: { admission_id: "ADM-{{system.sessionId}}" },
  data: { admission_id: "ADM-{{system.sessionId}}", patient_mobile: "{{patient_mobile}}", department: "{{admission_department}}", room_type: "{{room_type}}", status: "{{admission_action}}" },
  schema: schemas.admissions,
  uniqueKey: "admission_id",
  idempotencyKey: "ADM-{{system.sessionId}}",
  outputVar: "admission_record_result",
  encryptPii: true,
  piiFields: "patient_mobile"
}));
node("admission_notify", "notification", 1800, 3700, notificationData({
  templateId: "admission_request_recorded",
  sms: "Your admission request has been saved. Reference: ADM-{{system.sessionId}}.",
  emailSubject: "Admission request saved",
  emailBody: "Your admission request has been saved. Reference: ADM-{{system.sessionId}}.",
  outputVar: "admission_notification_result",
  dedupeSuffix: "admission_request"
}));
node("admission_end_message", "message", 2040, 3700, msgData("Your admission request has been saved. Reference: ADM-{{system.sessionId}}."));
node("admission_end", "end", 2280, 3700, { messages: [] });
edge("admission_form", "admission_record");
recordContinue("admission_record", "admission_notify");
notifyToNext("admission_notify", "admission_end_message");
edge("admission_end_message", "admission_end");

node("pharmacy_form", "form", 1320, 3940, formData("Share pharmacy or medicine request details.", [
  { key: "patient_name", label: "Name", type: "text", required: true },
  { key: "patient_mobile", label: "Mobile number", type: "phone", required: true },
  { key: "patient_email", label: "Email", type: "email", required: false },
  { key: "pharmacy_request_type", label: "Request type", type: "select", required: true, options: ["medicine_enquiry", "prescription_upload", "callback"] },
  { key: "medicine_name", label: "Medicine name", type: "text", required: false },
  { key: "pharmacy_notes", label: "Notes", type: "textarea", required: false }
], "pharmacy_form_result"));
node("pharmacy_router", "switch", 1560, 3940, { variable: "pharmacy_request_type" });
node("prescription_upload_consent", "auth-consent", 1680, 3820, {
  consentText: "Prescription uploads contain sensitive medical information. Reply YES to allow the pharmacy team to review the uploaded prescription for this request.",
  requireOtp: false,
  otpVar: "prescription_upload_otp",
  outputVar: "prescription_upload_consent_status"
});
node("prescription_upload_consent_record", "record", 1800, 3820, consentRecordData({
  id: "CONS-PHARM-{{system.sessionId}}",
  type: "prescription_upload",
  status: "accepted",
  purpose: "Patient consent for prescription upload and pharmacy review.",
  relatedEntityId: "PHARM-{{system.sessionId}}",
  outputVar: "prescription_upload_consent_record_result"
}));
node("prescription_upload_decline_record", "record", 1800, 4040, consentRecordData({
  id: "CONS-PHARM-DENIED-{{system.sessionId}}",
  type: "prescription_upload",
  status: "declined",
  purpose: "Patient declined prescription upload review consent.",
  relatedEntityId: "PHARM-{{system.sessionId}}",
  outputVar: "prescription_upload_decline_record_result"
}));
node("prescription_document_intake", "document-intake", 1800, 3880, {
  messages: ["Upload the prescription image or PDF. If it is unclear, the pharmacy team will review it and contact you."],
  acceptedTypesCsv: "pdf,jpg,jpeg,png",
  maxFiles: 3,
  minFiles: 1,
  outputVar: "prescription_documents"
});
node("prescription_file_processor", "file-processor", 2040, 3880, {
  inputFiles: "{{prescription_documents}}",
  processingMode: "extract_fields",
  acceptedTypesText: "pdf,jpg,jpeg,png",
  maxFileSizeMb: 10,
  expectedDocumentType: "doctor_prescription",
  confidenceThreshold: 0.75,
  strictExtraction: false,
  pageMode: "process_all_pages",
  schemaJson: pretty({ fields: { medicine_names: "string[]", doctor_name: "string", prescription_date: "string" } }),
  outputVar: "prescription_file_result"
});
node("pharmacy_ticket_record", "record", 2280, 3940, recordData({
  action: "upsert",
  collection: "support_tickets",
  where: { ticket_id: "PHARM-{{system.sessionId}}" },
  data: {
    ticket_id: "PHARM-{{system.sessionId}}",
    patient_mobile: "{{patient_mobile}}",
    department: "pharmacy_support",
    priority: "normal",
    issue_type: "{{pharmacy_request_type}}",
    status: "open",
    conversation_summary: "{{medicine_name}} {{pharmacy_notes}}"
  },
  schema: schemas.tickets,
  uniqueKey: "ticket_id",
  idempotencyKey: "PHARM-{{system.sessionId}}",
  outputVar: "pharmacy_ticket_result",
  encryptPii: true,
  piiFields: "patient_mobile,conversation_summary"
}));
node("pharmacy_notify", "notification", 2760, 3940, notificationData({
  templateId: "pharmacy_request_received",
  sms: "Your pharmacy request has been saved. Reference: PHARM-{{system.sessionId}}.",
  emailSubject: "Pharmacy request received",
  emailBody: "Your pharmacy request has been saved. Reference: PHARM-{{system.sessionId}}.",
  outputVar: "pharmacy_notification_result",
  dedupeSuffix: "pharmacy_request"
}));
node("pharmacy_end_message", "message", 3000, 3940, msgData("Your pharmacy request has been saved. Reference: PHARM-{{system.sessionId}}."));
node("pharmacy_end", "end", 3240, 3940, { messages: [] });
edge("pharmacy_form", "pharmacy_ticket_record");
recordContinue("pharmacy_ticket_record", "pharmacy_router");
edge("pharmacy_router", "prescription_upload_consent", { condition: { operator: "equals", value: "prescription_upload" }, label: "prescription_upload" });
edge("pharmacy_router", "pharmacy_notify", { condition: { operator: "equals", value: "medicine_enquiry" }, label: "medicine_enquiry" });
edge("pharmacy_router", "pharmacy_notify", { condition: { operator: "equals", value: "callback" }, label: "callback" });
edge("pharmacy_router", "pharmacy_notify", { isDefault: true, label: "default" });
edge("prescription_upload_consent", "prescription_upload_consent_record", { condition: { operator: "equals", value: "accepted" }, label: "accepted" });
edge("prescription_upload_consent", "prescription_upload_decline_record", { isDefault: true, label: "denied/default" });
recordContinue("prescription_upload_consent_record", "prescription_document_intake");
edge("prescription_upload_decline_record", "pharmacy_notify");
edge("prescription_document_intake", "prescription_file_processor");
edge("prescription_file_processor", "pharmacy_notify", { condition: { operator: "equals", value: "success" }, label: "success" });
edge("prescription_file_processor", "pharmacy_notify", { condition: { operator: "equals", value: "partial" }, label: "partial" });
edge("prescription_file_processor", "pharmacy_notify", { condition: { operator: "equals", value: "low_confidence" }, label: "low_confidence" });
edge("prescription_file_processor", "pharmacy_notify", { condition: { operator: "equals", value: "manual_review_required" }, label: "manual_review_required" });
edge("prescription_file_processor", "pharmacy_notify", { condition: { operator: "equals", value: "invalid_file" }, label: "invalid_file" });
edge("prescription_file_processor", "pharmacy_notify", { isDefault: true, label: "failed/default" });
notifyToNext("pharmacy_notify", "pharmacy_end_message");
edge("pharmacy_end_message", "pharmacy_end");

node("locations_carousel", "carousel", 1320, 4100, carouselData("Hospital locations and contact points.", [
  { id: "main_branch", type: "card", title: "Main Branch", heading: "{{main_branch_address}}", body: "OPD, emergency, lab, billing, admission desk. Phone: {{front_desk_phone}}" },
  { id: "emergency_contact", type: "card", title: "Emergency", heading: "{{emergency_phone}}", body: "For urgent medical situations, call immediately." },
  { id: "billing_contact", type: "card", title: "Billing Desk", heading: "{{billing_phone}}", body: "Invoices, failed payments, receipts, and refunds." }
]));
node("locations_book_decision", "decision", 1560, 4100, decisionData("Do you want to book an appointment at a hospital branch?", "locations_book_appointment"));
node("locations_end", "end", 1800, 4100, { messages: [] });
edge("locations_carousel", "locations_book_decision");
edge("locations_book_decision", "existing_patient_lookup_form", { condition: { operator: "equals", value: "yes" }, label: "yes" });
edge("locations_book_decision", "locations_end", { isDefault: true, label: "no/default" });

node("followup_form", "form", 1320, 4500, formData("Enter follow-up or existing appointment details.", [
  { key: "appointment_id", label: "Appointment ID", type: "text", required: true },
  { key: "patient_mobile", label: "Registered mobile number", type: "phone", required: true },
  { key: "patient_email", label: "Email", type: "email", required: false },
  { key: "followup_reason", label: "Follow-up reason", type: "textarea", required: false }
], "followup_form_result"));
node("followup_record_find", "record", 1560, 4500, recordData({
  action: "find",
  collection: "appointments",
  where: { appointment_id: "{{appointment_id}}", patient_mobile: "{{patient_mobile}}" },
  data: {},
  schema: schemas.appointments,
  outputVar: "followup_appointment_result",
  encryptPii: true,
  piiFields: "patient_mobile"
}));
node("followup_slot_booking", "appointment", 1800, 4500, {
  messages: ["Choose a preferred follow-up date and time."],
  slotMode: "static",
  timezone: "Asia/Kolkata",
  slotIntervalMins: 30,
  slotDurationMins: 20,
  horizonDays: 14,
  maxSlotsPerDay: 5,
  workingHoursStart: "09:00",
  workingHoursEnd: "18:00",
  availableWeekdays: "1,2,3,4,5,6",
  slotsJson: pretty([
    { id: "followup_morning", label: "Follow-up morning", time: "10:00" },
    { id: "followup_afternoon", label: "Follow-up afternoon", time: "15:30" }
  ]),
  dateVar: "followup_date",
  outputVar: "followup_booking"
});
node("followup_create", "record", 2040, 4500, recordData({
  action: "upsert",
  collection: "follow_ups",
  where: { followup_id: "FUP-{{system.sessionId}}" },
  data: { followup_id: "FUP-{{system.sessionId}}", appointment_id: "{{appointment_id}}", patient_mobile: "{{patient_mobile}}", followup_time: "{{followup_booking}}", status: "requested" },
  schema: schemas.followUps,
  uniqueKey: "followup_id",
  idempotencyKey: "FUP-{{system.sessionId}}",
  outputVar: "followup_record_result",
  encryptPii: true,
  piiFields: "patient_mobile"
}));
node("followup_not_found_message", "message", 1800, 4640, msgData("I could not verify an appointment with those details. Please check the appointment ID and registered mobile number, then try again."));
node("followup_not_found_end", "end", 2040, 4640, { messages: [] });
node("followup_scheduler", "scheduler", 2280, 4500, schedulerData({
  runAt: "",
  offsetValue: 2,
  offsetUnit: "hours",
  offsetDirection: "after",
  payload: { type: "followup_callback", appointment_id: "{{appointment_id}}", patient_mobile: "{{patient_mobile}}" },
  outputVar: "followup_scheduler_result",
  dedupeSuffix: "followup_callback"
}));
node("followup_notify", "notification", 2520, 4500, notificationData({
  templateId: "followup_requested",
  sms: "Your follow-up request is received. The hospital team will contact you.",
  emailSubject: "Follow-up request received",
  emailBody: "Your follow-up request is received. The hospital team will contact you.",
  outputVar: "followup_notification_result",
  dedupeSuffix: "followup"
}));
node("followup_end_message", "message", 2760, 4500, msgData("Your follow-up request has been received. The hospital team will contact you within the expected callback window."));
node("followup_end", "end", 3000, 4500, { messages: [] });
edge("followup_form", "followup_record_find");
edge("followup_record_find", "followup_slot_booking", { condition: { operator: "equals", value: "success" }, label: "success" });
edge("followup_record_find", "followup_not_found_message", { isDefault: true, label: "not_found/default" });
edge("followup_not_found_message", "followup_not_found_end");
edge("followup_slot_booking", "followup_create");
recordContinue("followup_create", "followup_scheduler");
schedulerToNext("followup_scheduler", "followup_notify");
notifyToNext("followup_notify", "followup_end_message");
edge("followup_end_message", "followup_end");

node("feedback_form", "form", 1320, 4820, formData("Share feedback or complaint details.", [
  { key: "patient_name", label: "Name", type: "text", required: false },
  { key: "patient_mobile", label: "Mobile number", type: "phone", required: true },
  { key: "patient_email", label: "Email", type: "email", required: false },
  { key: "feedback_type", label: "Type", type: "select", required: true, options: ["feedback", "rating", "complaint", "service_issue", "appreciation"] },
  { key: "satisfaction_rating", label: "Experience rating", type: "select", required: false, options: ["5_excellent", "4_good", "3_okay", "2_poor", "1_very_poor"] },
  { key: "feedback_message", label: "Message", type: "textarea", required: true }
], "feedback_form_result"));
node("feedback_sentiment", "ai-sentiment", 1560, 4820, {
  threshold: 0.55,
  emojiFeedbackEnabled: false,
  feedbackPrompt: "How was your experience?",
  outputVar: "feedback_sentiment_result"
});
node("feedback_ticket_record", "record", 1800, 4740, recordData({
  action: "upsert",
  collection: "feedback_cases",
  where: { ticket_id: "FDB-{{system.sessionId}}" },
  data: {
    ticket_id: "FDB-{{system.sessionId}}",
    patient_mobile: "{{patient_mobile}}",
    department: "front_desk",
    priority: "normal",
    issue_type: "{{feedback_type}}",
    status: "open",
    conversation_summary: "Rating: {{satisfaction_rating}} | {{feedback_message}}"
  },
  schema: schemas.tickets,
  uniqueKey: "ticket_id",
  idempotencyKey: "FDB-{{system.sessionId}}",
  outputVar: "feedback_ticket_result",
  encryptPii: true,
  piiFields: "patient_mobile,conversation_summary"
}));
node("complaint_ticket_record", "record", 1800, 4900, recordData({
  action: "upsert",
  collection: "feedback_cases",
  where: { ticket_id: "CMP-{{system.sessionId}}" },
  data: {
    ticket_id: "CMP-{{system.sessionId}}",
    patient_mobile: "{{patient_mobile}}",
    department: "manager_escalation",
    priority: "high",
    issue_type: "{{feedback_type}}",
    status: "open",
    conversation_summary: "Rating: {{satisfaction_rating}} | {{feedback_message}}"
  },
  schema: schemas.tickets,
  uniqueKey: "ticket_id",
  idempotencyKey: "CMP-{{system.sessionId}}",
  outputVar: "complaint_ticket_result",
  encryptPii: true,
  piiFields: "patient_mobile,conversation_summary"
}));
node("feedback_notify", "notification", 2280, 4820, notificationData({
  templateId: "feedback_case_received",
  sms: "Your feedback or complaint has been received. The hospital team will review it.",
  emailSubject: "Feedback received",
  emailBody: "Your feedback or complaint has been received. The hospital team will review it.",
  outputVar: "feedback_notification_result",
  dedupeSuffix: "feedback_case"
}));
node("feedback_end_message", "message", 2520, 4820, msgData("Your feedback has been received. Complaints and urgent service concerns will be reviewed by the appropriate hospital team."));
node("feedback_end", "end", 2760, 4820, { messages: [] });
edge("feedback_form", "feedback_sentiment");
edge("feedback_sentiment", "complaint_ticket_record", { condition: { operator: "equals", value: "negative" }, label: "negative" });
edge("feedback_sentiment", "feedback_ticket_record", { condition: { operator: "equals", value: "positive" }, label: "positive" });
edge("feedback_sentiment", "feedback_ticket_record", { condition: { operator: "equals", value: "neutral" }, label: "neutral" });
edge("feedback_sentiment", "feedback_ticket_record", { isDefault: true, label: "default" });
recordContinue("feedback_ticket_record", "feedback_notify");
recordContinue("complaint_ticket_record", "feedback_notify");
notifyToNext("feedback_notify", "feedback_end_message");
edge("feedback_end_message", "feedback_end");

node("talk_form", "form", 1320, 5000, formData("Tell us who you need to speak with.", [
  { key: "patient_name", label: "Name", type: "text", required: false },
  { key: "patient_mobile", label: "Mobile number", type: "phone", required: false },
  { key: "patient_email", label: "Email", type: "email", required: false },
  { key: "support_department", label: "Team", type: "select", required: true, options: ["front_desk", "appointment_desk", "billing_support", "insurance_support", "admission_support", "lab_support", "pharmacy_support", "doctor_callback", "manager_escalation"] },
  { key: "support_reason", label: "Reason", type: "textarea", required: true }
], "talk_to_hospital_form"));
node("talk_router", "switch", 1560, 5000, { variable: "support_department" });
const talkQueues = [
  ["front_desk", "talk_front_desk_queue", "front_desk", "normal", "front_desk", 30],
  ["appointment_desk", "talk_appointment_queue", "appointment_desk", "normal", "appointments,front_desk", 30],
  ["billing_support", "talk_billing_queue", "billing_support", "high", "billing", 10],
  ["insurance_support", "talk_insurance_queue", "insurance_support", "high", "insurance", 15],
  ["admission_support", "talk_admission_queue", "admission_support", "high", "admission", 15],
  ["lab_support", "talk_lab_queue", "lab_support", "normal", "lab", 30],
  ["pharmacy_support", "talk_pharmacy_queue", "pharmacy_support", "normal", "pharmacy", 30],
  ["doctor_callback", "talk_doctor_queue", "doctor_callback", "normal", "doctor_callback", 30],
  ["manager_escalation", "talk_manager_queue", "manager_escalation", "high", "manager,complaint", 15]
];
for (const [value, queueId, queueName, priority, skills, sla] of talkQueues) {
  node(queueId, "queue", 1800, 4820 + talkQueues.findIndex((item) => item[0] === value) * 80, queueData(queueName, priority, skills, sla, `${queueId}_result`));
  edge("talk_router", queueId, { condition: { operator: "equals", value }, label: value });
  edge(queueId, "talk_handover", { condition: { operator: "equals", value: "assigned" }, label: "assigned" });
  edge(queueId, "talk_handover", { condition: { operator: "equals", value: "queued" }, label: "queued" });
  edge(queueId, "talk_handover", { isDefault: true, label: "failed/default" });
}
node("talk_handover", "handover", 2280, 5000, handoverData("Connecting you to the right hospital team with your request details."));
edge("talk_form", "talk_router");
edge("talk_router", "talk_front_desk_queue", { isDefault: true, label: "default" });

node("unknown_faq", "faq", 1320, 5700, {
  loopCount: 1
});
node("unknown_ai_grounded", "ai-grounded", 1560, 5700, {
  contextTemplate:
    "Hospital support scope: appointments, doctor availability, health packages, lab tests, report status, billing support, insurance help, admission enquiry, locations, follow-up, emergency routing, and hospital staff connection. Do not provide final diagnosis, legal, insurance, or financial decisions. Escalate emergencies and sensitive decisions to hospital staff.",
  inputTemplate: "{{main_user_request}}",
  instructions:
    "Answer only with approved operational guidance. If the user asks for diagnosis, emergency advice, insurance approval, payment dispute decision, or report sharing without verification, use fallback.",
  responseStyle: "concise",
  strictGrounding: true,
  includeCitations: false,
  includeCitationsInResponse: false,
  responseTemplate: "",
  fallbackResponseTemplate: "I should connect you to the hospital team for this.",
  fallbackMessage: "I should connect you to the hospital team for this.",
  outputVar: "unknown_ai_result",
  answerVar: "unknown_answer",
  answerKeyValueVar: "unknown_answer_key",
  emitResponse: true
});
node("unknown_answer_end", "end", 1800, 5700, { messages: [] });
edge("unknown_faq", "unknown_ai_grounded", { condition: { operator: "equals", value: "not_found" }, label: "not_found" });
edge("unknown_faq", "unknown_answer_end", { isDefault: true, label: "answered/default" });
edge("unknown_ai_grounded", "unknown_answer_end", { condition: { operator: "equals", value: "grounded" }, label: "grounded" });
edge("unknown_ai_grounded", "unknown_answer_end", { isDefault: true, label: "fallback/default" });

exportDoc.metadata.nodeCount = nodes.length;

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(exportDoc, null, 2)}\n`, "utf8");

console.log(`Wrote ${outputPath}`);
console.log(`Nodes: ${nodes.length}`);
console.log(`Edges: ${edges.length}`);
