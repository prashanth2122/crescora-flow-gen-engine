import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { notificationData } from "./notification-data.mjs";

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const domainRoot = join(rootDir, "domains", "local-professional-services");
const sourcePath = join(
  domainRoot,
  "templates-source",
  "local-professional-services-killer-automation.source.flow.json"
);
const builtPath = join(
  domainRoot,
  "templates",
  "local-professional-services-killer-automation.flow.json"
);
const stablePath = join(
  domainRoot,
  "templates-stable",
  "local-professional-services-killer-automation.flow.json"
);

const exportDoc = {
  version: "1.0",
  exportedAt: "2026-08-25T00:00:00.000Z",
  bot: {
    name: "Local & Professional Services Operations Engine",
    description:
      "Automation-first service operations workflow covering enquiry intake, service matching, customer reuse, serviceability, photo intake, live availability, paid booking, technician assignment, reminders, tracking, reschedule, cancellation, invoicing, balance collection, feedback, and complaint routing.",
    headerTitle: "Service Operations Engine",
    headerTagline: "Enquiry to paid appointment to completion",
    globalVariables: [
      { key: "brand_name", value: "Crescora.ai" },
      { key: "business_name", value: "ABC Home Services" },
      { key: "default_currency", value: "INR" },
      { key: "default_timezone", value: "Asia/Kolkata" },
      { key: "payment_provider", value: "razorpay" },
      { key: "payment_link", value: "https://services.example.com/pay" },
      { key: "support_phone", value: "+91-90000-61000" },
      { key: "service_support_email", value: "support@abc-home-services.example.com" },
      { key: "default_city", value: "Hyderabad" },
      { key: "demo_today", value: "2026-08-25" }
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
const DOMAIN_RECORD_SCHEMA = "professional_services";

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

function paymentData({ amount, description, customerNameVar, customerEmailVar, customerPhoneVar, outputVar }) {
  return {
    messages: [
      "Please complete the secure payment. I will continue after the gateway verifies the payment status."
    ],
    amount,
    currency: "{{default_currency}}",
    provider: "{{payment_provider}}",
    autoVerify: true,
    paymentLink: "{{payment_link}}",
    description,
    customerName: customerNameVar,
    customerEmail: customerEmailVar,
    customerContact: customerPhoneVar,
    notifySms: true,
    notifyEmail: true,
    expireMinutes: 10,
    callbackUrl: "",
    notesJson: pretty({
      session_id: "{{system.sessionId}}",
      service_request_id: "{{request_id}}"
    }),
    outputVar
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
    dateVar: "selected_service_date",
    horizonDays: 14,
    maxSlotsPerDay: 6,
    dynamicSlotsVar,
    dynamicSlotsPath: "data",
    slotDurationMins: 60,
    slotIntervalMins: 30,
    availableWeekdays: "1,2,3,4,5,6,0",
    workingHoursStart: "09:00",
    workingHoursEnd: "20:00"
  };
}

function handoverData(message) {
  return {
    channel: "human",
    messages: [message]
  };
}

function yesNoButtons() {
  return [
    { label: "Yes", value: "yes" },
    { label: "No", value: "no" }
  ];
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

const mainMenuButtons = [
  { label: "Book Service", value: "book_service" },
  { label: "Find Right Service", value: "find_right_service" },
  { label: "Services & Pricing", value: "pricing" },
  { label: "Check Availability", value: "check_availability" },
  { label: "Get Estimate", value: "estimate" },
  { label: "Service Areas", value: "service_areas" },
  { label: "My Bookings", value: "my_bookings" },
  { label: "Reschedule Booking", value: "reschedule_booking" },
  { label: "Cancel Booking", value: "cancel_booking" },
  { label: "Payment / Invoice", value: "payment_invoice" },
  { label: "Track Service", value: "track_service" },
  { label: "Rate Service", value: "rate_service" },
  { label: "Report a Problem", value: "report_problem" },
  { label: "Talk to the Team", value: "talk_to_team" }
];

const addressFields = [
  { key: "address_label", label: "Address label", type: "text", required: false },
  { key: "address_line_1", label: "Address line 1", type: "text", required: true },
  { key: "address_line_2", label: "Address line 2", type: "text", required: false },
  { key: "locality", label: "Locality", type: "text", required: true },
  { key: "city", label: "City", type: "text", required: true },
  { key: "state", label: "State", type: "text", required: true },
  { key: "postal_code", label: "Postal code", type: "text", required: true }
];

const customerFields = [
  { key: "customer_name", label: "Full name", type: "text", required: true },
  { key: "customer_email", label: "Email", type: "email", required: false }
];

const serviceDetailFields = [
  { key: "asset_or_space", label: "Asset, room, or space", type: "text", required: false },
  { key: "quantity_or_area", label: "Units, BHK, or area", type: "text", required: false },
  { key: "problem_or_goal", label: "Problem or goal", type: "textarea", required: true },
  { key: "preferred_schedule_note", label: "Preferred day or timing", type: "text", required: false },
  { key: "budget_or_quote_note", label: "Budget or quote note", type: "text", required: false }
];

const complaintFields = [
  { key: "complaint_category", label: "Problem category", type: "select", required: true, options: ["service_quality", "delay", "pricing", "technician_behavior", "payment", "damage", "other"] },
  { key: "complaint_description", label: "Describe the problem", type: "textarea", required: true }
];

const feedbackCommentFields = [
  { key: "feedback_comment", label: "Comments", type: "textarea", required: false }
];

const notifyFields = [
  { key: "notify_channel", label: "Preferred channel", type: "select", required: true, options: ["whatsapp", "sms", "email"] },
  { key: "notify_note", label: "Anything else to note", type: "textarea", required: false }
];

const schemas = {
  serviceCatalog: pretty({
    collection: "service_catalog",
    fields: {
      service_id: { type: "string", required: true, unique: true },
      service_code: { type: "string", required: true, unique: true },
      category: { type: "string", required: true },
      service_name: { type: "string", required: true },
      description: { type: "string", required: false },
      pricing_model: { type: "string", required: true },
      base_price_minor: { type: "number", required: false },
      currency: { type: "string", required: true },
      duration_minutes: { type: "number", required: false },
      location_required: { type: "boolean", required: true },
      media_required: { type: "string", required: true },
      inspection_required: { type: "boolean", required: true },
      payment_policy: { type: "string", required: true },
      booking_mode: { type: "string", required: true },
      assignment_mode: { type: "string", required: true },
      required_skill: { type: "string", required: false },
      service_radius_km: { type: "number", required: false },
      price_label: { type: "string", required: false },
      booking_fee_minor: { type: "number", required: false },
      intake_hint: { type: "string", required: false },
      active: { type: "boolean", required: true }
    }
  }),
  serviceAreas: pretty({
    collection: "service_areas",
    fields: {
      service_area_id: { type: "string", required: true, unique: true },
      service_id: { type: "string", required: true },
      category: { type: "string", required: true },
      branch_name: { type: "string", required: false },
      locality: { type: "string", required: false },
      city: { type: "string", required: true },
      postal_code: { type: "string", required: true },
      active: { type: "boolean", required: true }
    }
  }),
  customers: pretty({
    collection: "service_customers",
    fields: {
      customer_id: { type: "string", required: true, unique: true },
      full_name: { type: "string", required: true },
      phone_e164: { type: "phone", required: true, unique: true },
      email: { type: "email", required: false },
      preferred_language: { type: "string", required: false },
      saved_address_id: { type: "string", required: false },
      last_service_category: { type: "string", required: false },
      last_booking_id: { type: "string", required: false }
    }
  }),
  addresses: pretty({
    collection: "service_customer_addresses",
    fields: {
      address_id: { type: "string", required: true, unique: true },
      customer_id: { type: "string", required: true },
      label: { type: "string", required: false },
      address_line_1: { type: "string", required: true },
      address_line_2: { type: "string", required: false },
      locality: { type: "string", required: false },
      city: { type: "string", required: true },
      state: { type: "string", required: false },
      postal_code: { type: "string", required: true },
      latitude: { type: "string", required: false },
      longitude: { type: "string", required: false },
      is_default: { type: "boolean", required: true }
    }
  }),
  serviceQuestions: pretty({
    collection: "service_questions",
    fields: {
      question_id: { type: "string", required: true, unique: true },
      service_id: { type: "string", required: true },
      field_key: { type: "string", required: true },
      label: { type: "string", required: true },
      field_type: { type: "string", required: true },
      required: { type: "boolean", required: true },
      options_csv: { type: "string", required: false },
      display_order: { type: "number", required: true },
      active: { type: "boolean", required: true }
    }
  }),
  serviceRequests: pretty({
    collection: "service_requests",
    fields: {
      request_id: { type: "string", required: true, unique: true },
      customer_id: { type: "string", required: false },
      service_id: { type: "string", required: true },
      category: { type: "string", required: true },
      request_summary: { type: "string", required: false },
      urgency: { type: "string", required: false },
      service_address_id: { type: "string", required: false },
      pricing_model: { type: "string", required: false },
      estimated_amount_minor: { type: "number", required: false },
      status: { type: "string", required: true },
      preferred_date_note: { type: "string", required: false },
      source_channel: { type: "string", required: true },
      created_at: { type: "string", required: false }
    }
  }),
  requestMedia: pretty({
    collection: "service_request_media",
    fields: {
      media_id: { type: "string", required: true, unique: true },
      request_id: { type: "string", required: true },
      media_type: { type: "string", required: true },
      storage_key: { type: "string", required: false },
      mime_type: { type: "string", required: false },
      size_bytes: { type: "number", required: false },
      checksum: { type: "string", required: false },
      analysis_summary: { type: "string", required: false },
      status: { type: "string", required: true }
    }
  }),
  slots: pretty({
    collection: "service_availability_slots",
    fields: {
      id: { type: "string", required: true, unique: true },
      slot_id: { type: "string", required: true, unique: true },
      service_id: { type: "string", required: true },
      service_area_id: { type: "string", required: false },
      worker_id: { type: "string", required: false },
      worker_name: { type: "string", required: false },
      date: { type: "string", required: true },
      start: { type: "string", required: true },
      end: { type: "string", required: true },
      label: { type: "string", required: true },
      status: { type: "string", required: true },
      hold_id: { type: "string", required: false },
      held_by_session: { type: "string", required: false },
      request_id: { type: "string", required: false }
    }
  }),
  holds: pretty({
    collection: "service_slot_holds",
    fields: {
      hold_id: { type: "string", required: true, unique: true },
      request_id: { type: "string", required: true },
      slot_id: { type: "string", required: true },
      session_id: { type: "string", required: true },
      status: { type: "string", required: true },
      expires_at: { type: "string", required: false }
    }
  }),
  bookings: pretty({
    collection: "service_bookings",
    fields: {
      booking_id: { type: "string", required: true, unique: true },
      booking_number: { type: "string", required: true, unique: true },
      request_id: { type: "string", required: true },
      customer_id: { type: "string", required: true },
      service_id: { type: "string", required: true },
      service_name: { type: "string", required: true },
      slot_id: { type: "string", required: true },
      service_address_id: { type: "string", required: false },
      scheduled_date: { type: "string", required: true },
      scheduled_time: { type: "string", required: true },
      scheduled_end_time: { type: "string", required: false },
      status: { type: "string", required: true },
      payment_status: { type: "string", required: true },
      assignment_status: { type: "string", required: true },
      amount_due_minor: { type: "number", required: false },
      amount_paid_minor: { type: "number", required: false },
      balance_due_minor: { type: "number", required: false },
      final_amount_minor: { type: "number", required: false },
      worker_id: { type: "string", required: false },
      worker_name: { type: "string", required: false },
      updated_at: { type: "string", required: false }
    }
  }),
  workers: pretty({
    collection: "service_workers",
    fields: {
      worker_id: { type: "string", required: true, unique: true },
      worker_name: { type: "string", required: true },
      primary_skill: { type: "string", required: true },
      service_area_id: { type: "string", required: false },
      status: { type: "string", required: true },
      rating: { type: "number", required: false },
      current_load: { type: "number", required: false },
      phone: { type: "phone", required: false }
    }
  }),
  assignments: pretty({
    collection: "service_assignments",
    fields: {
      assignment_id: { type: "string", required: true, unique: true },
      booking_id: { type: "string", required: true },
      worker_id: { type: "string", required: true },
      worker_name: { type: "string", required: true },
      assignment_type: { type: "string", required: true },
      status: { type: "string", required: true },
      service_area_id: { type: "string", required: false },
      score: { type: "number", required: false }
    }
  }),
  payments: pretty({
    collection: "service_payments",
    fields: {
      payment_id: { type: "string", required: true, unique: true },
      booking_id: { type: "string", required: true },
      amount_minor: { type: "number", required: true },
      currency: { type: "string", required: true },
      payment_type: { type: "string", required: true },
      provider: { type: "string", required: true },
      provider_reference: { type: "string", required: false },
      status: { type: "string", required: true },
      idempotency_key: { type: "string", required: true, unique: true }
    }
  }),
  statusEvents: pretty({
    collection: "service_status_events",
    fields: {
      status_event_id: { type: "string", required: true, unique: true },
      booking_id: { type: "string", required: true },
      worker_id: { type: "string", required: false },
      event_type: { type: "string", required: true },
      event_label: { type: "string", required: true },
      eta_text: { type: "string", required: false },
      created_at: { type: "string", required: false }
    }
  }),
  reminders: pretty({
    collection: "service_reminder_jobs",
    fields: {
      reminder_id: { type: "string", required: true, unique: true },
      booking_id: { type: "string", required: true },
      reminder_type: { type: "string", required: true },
      scheduled_for: { type: "string", required: false },
      channel: { type: "string", required: true },
      status: { type: "string", required: true }
    }
  }),
  invoices: pretty({
    collection: "service_invoices",
    fields: {
      invoice_id: { type: "string", required: true, unique: true },
      booking_id: { type: "string", required: true },
      invoice_number: { type: "string", required: true, unique: true },
      subtotal_minor: { type: "number", required: true },
      tax_minor: { type: "number", required: true },
      total_minor: { type: "number", required: true },
      amount_paid_minor: { type: "number", required: true },
      amount_due_minor: { type: "number", required: true },
      status: { type: "string", required: true },
      issued_at: { type: "string", required: false },
      download_url: { type: "url", required: false }
    }
  }),
  feedback: pretty({
    collection: "service_feedback",
    fields: {
      feedback_id: { type: "string", required: true, unique: true },
      booking_id: { type: "string", required: true },
      customer_id: { type: "string", required: true },
      rating: { type: "number", required: true },
      comment: { type: "string", required: false },
      sentiment: { type: "string", required: false },
      created_at: { type: "string", required: false }
    }
  }),
  complaints: pretty({
    collection: "service_complaints",
    fields: {
      complaint_id: { type: "string", required: true, unique: true },
      booking_id: { type: "string", required: false },
      customer_id: { type: "string", required: false },
      category: { type: "string", required: true },
      priority: { type: "string", required: true },
      description: { type: "string", required: true },
      status: { type: "string", required: true },
      created_at: { type: "string", required: false }
    }
  })
};

const parseRequirementScript = `
const raw = String(vars.service_requirement_text || "").trim();
const lowered = raw.toLowerCase();
const categories = [
  { key: "plumbing", keywords: ["sink", "leak", "plumb", "pipe", "tap"] },
  { key: "ac_service", keywords: ["ac", "cooling", "air conditioner", "split ac"] },
  { key: "pest_control", keywords: ["pest", "cockroach", "termite", "infestation"] },
  { key: "electrician", keywords: ["electrical", "electrician", "switch", "wiring", "short"] },
  { key: "cleaning", keywords: ["cleaning", "deep clean", "sofa clean", "home cleaning"] },
  { key: "salon", keywords: ["haircut", "beard", "salon", "stylist"] },
  { key: "interiors", keywords: ["interior", "design", "renovation", "3bhk"] },
  { key: "consulting", keywords: ["consult", "consultation", "advisor", "strategy"] }
];
let category = "";
for (const item of categories) {
  if (item.keywords.some((keyword) => lowered.includes(keyword))) {
    category = item.key;
    break;
  }
}
let urgency = "normal";
if (/(urgent|asap|immediately|badly|emergency)/i.test(raw)) urgency = "high";
if (/(tomorrow|today|evening|morning|weekend)/i.test(raw)) vars.preferred_schedule_note = raw;
let serviceIntent = raw || "General service enquiry";
if (category === "plumbing") serviceIntent = "Leak repair or plumbing diagnosis";
if (category === "ac_service") serviceIntent = "AC inspection or service";
if (category === "pest_control") serviceIntent = "Pest treatment";
if (category === "salon") serviceIntent = "Salon service booking";
if (category === "interiors") serviceIntent = "Interior consultation";
if (category === "consulting") serviceIntent = "Professional consultation";
vars.service_category = category;
vars.service_intent = serviceIntent;
vars.service_urgency = urgency;
vars.photos_recommended = /(photo|picture|image|damage|error code|cockroach|leak|ac)/i.test(raw) ? "yes" : "no";
vars.requirement_parse_route = category ? "matched" : "manual";
return { route: vars.requirement_parse_route, category, urgency };
`;

const serviceCatalogScript = `
const rows = Array.isArray(vars.service_catalog_result?.data) ? vars.service_catalog_result.data : [];
vars.service_catalog_count = rows.length;
if (!rows.length) {
  vars.service_catalog_route = "none";
  vars.service_catalog_text = "";
  return { route: "none" };
}
function money(minor) {
  const amount = Number(minor || 0) / 100;
  return "Rs " + amount.toFixed(amount % 1 === 0 ? 0 : 2);
}
vars.service_catalog_text = rows.map((row, index) => {
  const code = row.service_code || row.service_id || String(index + 1);
  const price = row.price_label || money(row.base_price_minor);
  const duration = row.duration_minutes ? String(row.duration_minutes) + " min" : "Variable duration";
  return String(index + 1) + ". " + (row.service_name || code) + " [" + code + "] - " + price + " - " + duration;
}).join("\\n");
vars.service_catalog_route = rows.length === 1 ? "single" : "multiple";
if (rows.length === 1) {
  const row = rows[0];
  vars.selected_service_id = row.service_id || "";
  vars.selected_service_code = row.service_code || "";
  vars.selected_service_name = row.service_name || "";
  vars.selected_service_description = row.description || "";
  vars.selected_service_category = row.category || vars.service_category || "";
  vars.selected_service_pricing_model = row.pricing_model || "";
  vars.selected_service_base_price_minor = Number(row.base_price_minor || 0);
  vars.selected_service_duration_minutes = Number(row.duration_minutes || 0);
  vars.selected_service_location_required = row.location_required ? "yes" : "no";
  vars.selected_service_media_required = String(row.media_required || "skip");
  vars.selected_service_inspection_required = row.inspection_required ? "yes" : "no";
  vars.selected_service_payment_policy = row.payment_policy || "pay_after_service";
  vars.selected_service_booking_mode = row.booking_mode || "service";
  vars.selected_service_assignment_mode = row.assignment_mode || "skill_based";
  vars.selected_service_required_skill = row.required_skill || "";
  vars.selected_service_price_label = row.price_label || money(row.base_price_minor);
  vars.selected_service_booking_fee_minor = Number(row.booking_fee_minor || 0);
  vars.selected_service_intake_hint = row.intake_hint || "";
}
return { route: vars.service_catalog_route, count: rows.length };
`;

const serviceSelectionScript = `
const rows = Array.isArray(vars.service_catalog_result?.data) ? vars.service_catalog_result.data : [];
const rawChoice = String(vars.selected_service_choice || "").trim().toLowerCase();
let selected = null;
if (/^\\d+$/.test(rawChoice)) {
  const index = Number(rawChoice) - 1;
  selected = rows[index] || null;
}
if (!selected) {
  selected = rows.find((row) => {
    const code = String(row.service_code || "").trim().toLowerCase();
    const id = String(row.service_id || "").trim().toLowerCase();
    const name = String(row.service_name || "").trim().toLowerCase();
    return rawChoice === code || rawChoice === id || rawChoice === name;
  }) || null;
}
if (!selected) {
  vars.service_selection_route = "not_found";
  return { route: "not_found" };
}
function money(minor) {
  const amount = Number(minor || 0) / 100;
  return "Rs " + amount.toFixed(amount % 1 === 0 ? 0 : 2);
}
vars.selected_service_id = selected.service_id || "";
vars.selected_service_code = selected.service_code || "";
vars.selected_service_name = selected.service_name || "";
vars.selected_service_description = selected.description || "";
vars.selected_service_category = selected.category || vars.service_category || "";
vars.selected_service_pricing_model = selected.pricing_model || "";
vars.selected_service_base_price_minor = Number(selected.base_price_minor || 0);
vars.selected_service_duration_minutes = Number(selected.duration_minutes || 0);
vars.selected_service_location_required = selected.location_required ? "yes" : "no";
vars.selected_service_media_required = String(selected.media_required || "skip");
vars.selected_service_inspection_required = selected.inspection_required ? "yes" : "no";
vars.selected_service_payment_policy = selected.payment_policy || "pay_after_service";
vars.selected_service_booking_mode = selected.booking_mode || "service";
vars.selected_service_assignment_mode = selected.assignment_mode || "skill_based";
vars.selected_service_required_skill = selected.required_skill || "";
vars.selected_service_price_label = selected.price_label || money(selected.base_price_minor);
vars.selected_service_booking_fee_minor = Number(selected.booking_fee_minor || 0);
vars.selected_service_intake_hint = selected.intake_hint || "";
vars.service_selection_route = "success";
return { route: "success", service_id: vars.selected_service_id };
`;

const normalizePhoneScript = `
const digits = String(vars.customer_mobile || "").replace(/\\D/g, "");
const last10 = digits.slice(-10);
vars.customer_mobile_digits = last10;
vars.customer_mobile_e164 = last10 ? "+91" + last10 : "";
return { route: last10.length === 10 ? "success" : "failed" };
`;

function otpValidationScript(inputVar) {
  return `
const code = String(vars.${inputVar} || "").trim();
vars.otp_validation_route = /^\\d{6}$/.test(code) ? "valid" : "invalid";
return { route: vars.otp_validation_route };
`;
}

const hydrateCustomerScript = `
const rows = Array.isArray(vars.customer_lookup_result?.data) ? vars.customer_lookup_result.data : [];
const row = rows[0] || {};
vars.customer_id = row.customer_id || "";
vars.customer_name = row.full_name || "";
vars.customer_email = row.email || "";
vars.customer_saved_address_id = row.saved_address_id || "";
vars.customer_last_booking_id = row.last_booking_id || "";
return { route: vars.customer_id ? "success" : "failed" };
`;

const customerNotFoundRouteScript = `
vars.customer_not_found_route = vars.identity_flow_mode === "lookup" ? "lookup" : "booking";
return { route: vars.customer_not_found_route };
`;

const savedAddressScript = `
const rows = Array.isArray(vars.saved_address_lookup_result?.data) ? vars.saved_address_lookup_result.data : [];
const row = rows.find((item) => item.address_id === vars.customer_saved_address_id) || rows[0] || null;
if (!row) {
  vars.saved_address_route = "none";
  return { route: "none" };
}
vars.selected_address_id = row.address_id || "";
vars.address_label = row.label || "";
vars.address_line_1 = row.address_line_1 || "";
vars.address_line_2 = row.address_line_2 || "";
vars.locality = row.locality || "";
vars.city = row.city || "";
vars.state = row.state || "";
vars.postal_code = row.postal_code || "";
vars.saved_address_text = [row.address_line_1, row.locality, row.city, row.postal_code].filter(Boolean).join(", ");
vars.saved_address_route = "saved";
return { route: "saved" };
`;

const serviceAreaScript = `
const rows = Array.isArray(vars.serviceability_lookup_result?.data) ? vars.serviceability_lookup_result.data : [];
const row = rows[0] || {};
vars.selected_service_area_id = row.service_area_id || "";
vars.selected_service_area_branch = row.branch_name || "";
return { route: vars.selected_service_area_id ? "success" : "failed" };
`;

const mediaRouteScript = `
const mode = String(vars.selected_service_media_required || "skip").toLowerCase();
if (mode === "required") vars.media_route = "required";
else if (mode === "optional" || vars.photos_recommended === "yes") vars.media_route = "optional";
else vars.media_route = "skip";
return { route: vars.media_route };
`;

const questionChecklistScript = `
const rows = Array.isArray(vars.service_question_list_result?.data) ? vars.service_question_list_result.data : [];
vars.service_question_text = rows.length
  ? rows
      .sort((a, b) => Number(a.display_order || 0) - Number(b.display_order || 0))
      .map((row) => "- " + row.label + (row.required ? " (required)" : ""))
      .join("\\n")
  : "- Share the main issue or goal\\n- Mention unit count, BHK, or area if relevant\\n- Mention any timing preference";
return { route: "success", count: rows.length };
`;

const mediaSummaryScript = `
const result = vars.service_media_processor_result || {};
vars.service_media_analysis_summary = String(result.status || result.summary || "processed");
return { route: "success", summary: vars.service_media_analysis_summary };
`;

const pricingScript = `
function money(minor) {
  const amount = Number(minor || 0) / 100;
  return "Rs " + amount.toFixed(amount % 1 === 0 ? 0 : 2);
}
const pricingModel = String(vars.selected_service_pricing_model || "fixed").toLowerCase();
const paymentPolicy = String(vars.selected_service_payment_policy || "pay_after_service").toLowerCase();
const base = Number(vars.selected_service_base_price_minor || 0);
let estimated = base;
if (pricingModel === "starting_from") estimated = base;
if (pricingModel === "inspection" || pricingModel === "custom_quote") estimated = base;
let bookingFee = Number(vars.selected_service_booking_fee_minor || 0);
if (paymentPolicy === "full_prepayment") bookingFee = estimated;
if (paymentPolicy === "deposit" && bookingFee === 0) bookingFee = Math.min(estimated, 29900);
if (paymentPolicy === "booking_fee" && bookingFee === 0) bookingFee = Math.min(estimated, 19900);
if (paymentPolicy === "consultation_fee" && bookingFee === 0) bookingFee = estimated;
if (paymentPolicy === "free_appointment" || paymentPolicy === "pay_after_service") bookingFee = 0;
const balance = Math.max(estimated - bookingFee, 0);
vars.estimated_amount_minor = estimated;
vars.booking_fee_minor = bookingFee;
vars.balance_due_minor = balance;
vars.estimated_amount_label = money(estimated);
vars.booking_fee_label = money(bookingFee);
vars.balance_due_label = money(balance);
vars.payment_collection_route = bookingFee > 0 ? "payment_required" : "skip_payment";
vars.service_summary_text = [
  "Service: " + (vars.selected_service_name || ""),
  "Category: " + (vars.selected_service_category || ""),
  "Intent: " + (vars.service_intent || ""),
  "Price: " + (vars.selected_service_price_label || vars.estimated_amount_label),
  "Booking fee now: " + vars.booking_fee_label,
  "Balance after service: " + vars.balance_due_label
].join("\\n");
return { route: "success", estimated, booking_fee: bookingFee };
`;

const holdExpiryScript = `
const expiry = new Date(Date.now() + 10 * 60 * 1000).toISOString();
vars.slot_hold_expires_at = expiry;
return { route: "success", expires_at: expiry };
`;

const assignmentScript = `
const rows = Array.isArray(vars.assignment_candidates_result?.data) ? vars.assignment_candidates_result.data : [];
const areaId = String(vars.selected_service_area_id || "");
const skill = String(vars.selected_service_required_skill || "");
const eligible = rows
  .filter((row) => String(row.status || "").toLowerCase() === "active")
  .filter((row) => !skill || String(row.primary_skill || "").toLowerCase() === skill.toLowerCase())
  .sort((a, b) => {
    const areaScoreA = String(a.service_area_id || "") === areaId ? 1 : 0;
    const areaScoreB = String(b.service_area_id || "") === areaId ? 1 : 0;
    if (areaScoreA !== areaScoreB) return areaScoreB - areaScoreA;
    const ratingA = Number(a.rating || 0);
    const ratingB = Number(b.rating || 0);
    if (ratingA !== ratingB) return ratingB - ratingA;
    return Number(a.current_load || 0) - Number(b.current_load || 0);
  });
const winner = eligible[0] || null;
if (!winner) {
  vars.assignment_route = "unavailable";
  return { route: "unavailable" };
}
vars.assigned_worker_id = winner.worker_id || "";
vars.assigned_worker_name = winner.worker_name || "";
vars.assignment_score = Math.round(((Number(winner.rating || 4) * 20) + 20 - Number(winner.current_load || 0)) * 10) / 10;
vars.assignment_route = "assigned";
return { route: "assigned", worker_id: vars.assigned_worker_id };
`;

const bookingFilterScript = `
const rows = Array.isArray(vars.customer_booking_list_result?.data) ? vars.customer_booking_list_result.data : [];
const today = String(vars.demo_today || "2026-08-25");
const mode = String(vars.post_booking_route || "");
function compareDate(dateText) {
  return String(dateText || "").slice(0, 10).localeCompare(today);
}
function keep(row) {
  const status = String(row.status || "").toLowerCase();
  if (mode === "my_bookings") return compareDate(row.scheduled_date) >= 0 && status !== "cancelled";
  if (mode === "track_service") return ["confirmed", "assigned", "accepted", "en_route", "arrived", "in_progress"].includes(status);
  if (mode === "reschedule_booking") return compareDate(row.scheduled_date) >= 0 && ["confirmed", "assigned"].includes(status);
  if (mode === "cancel_booking") return compareDate(row.scheduled_date) >= 0 && ["confirmed", "assigned"].includes(status);
  if (mode === "payment_invoice") return ["completed", "confirmed", "assigned", "in_progress"].includes(status);
  if (mode === "rate_service" || mode === "report_problem") return status === "completed";
  return true;
}
const filtered = rows.filter(keep).sort((a, b) => String(b.scheduled_date || "").localeCompare(String(a.scheduled_date || "")));
vars.filtered_customer_bookings = filtered;
vars.booking_selection_route = filtered.length === 0 ? "none" : filtered.length === 1 ? "single" : "multiple";
vars.booking_options_text = filtered.map((row, index) => {
  return String(index + 1) + ". " + (row.booking_number || row.booking_id || "") + " | " + (row.service_name || "") + " | " + (row.scheduled_date || "") + " " + (row.scheduled_time || "") + " | " + (row.status || "");
}).join("\\n");
if (filtered.length === 1) {
  const row = filtered[0];
  vars.selected_booking_id = row.booking_id || "";
  vars.selected_booking_number = row.booking_number || "";
  vars.selected_booking_request_id = row.request_id || "";
  vars.selected_booking_service_id = row.service_id || "";
  vars.selected_booking_service_name = row.service_name || "";
  vars.selected_booking_slot_id = row.slot_id || "";
  vars.selected_booking_address_id = row.service_address_id || "";
  vars.selected_booking_status = row.status || "";
  vars.selected_booking_payment_status = row.payment_status || "";
  vars.selected_booking_assignment_status = row.assignment_status || "";
  vars.selected_booking_scheduled_date = row.scheduled_date || "";
  vars.selected_booking_scheduled_time = row.scheduled_time || "";
  vars.selected_booking_scheduled_end_time = row.scheduled_end_time || "";
  vars.selected_booking_amount_paid_minor = Number(row.amount_paid_minor || 0);
  vars.selected_booking_amount_due_minor = Number(row.amount_due_minor || 0);
  vars.selected_booking_balance_due_minor = Number(row.balance_due_minor || 0);
  vars.selected_booking_final_amount_minor = Number(row.final_amount_minor || 0);
  vars.selected_booking_worker_id = row.worker_id || "";
  vars.selected_booking_worker_name = row.worker_name || "";
}
return { route: vars.booking_selection_route, count: filtered.length };
`;

const selectBookingScript = `
const rows = Array.isArray(vars.filtered_customer_bookings) ? vars.filtered_customer_bookings : [];
const rawChoice = String(vars.selected_booking_choice || "").trim().toLowerCase();
let selected = null;
if (/^\\d+$/.test(rawChoice)) {
  selected = rows[Number(rawChoice) - 1] || null;
}
if (!selected) {
  selected = rows.find((row) => {
    const bookingNumber = String(row.booking_number || "").trim().toLowerCase();
    const bookingId = String(row.booking_id || "").trim().toLowerCase();
    return rawChoice === bookingNumber || rawChoice === bookingId;
  }) || null;
}
if (!selected) {
  vars.select_booking_route = "not_found";
  return { route: "not_found" };
}
vars.selected_booking_id = selected.booking_id || "";
vars.selected_booking_number = selected.booking_number || "";
vars.selected_booking_request_id = selected.request_id || "";
vars.selected_booking_service_id = selected.service_id || "";
vars.selected_booking_service_name = selected.service_name || "";
vars.selected_booking_slot_id = selected.slot_id || "";
vars.selected_booking_address_id = selected.service_address_id || "";
vars.selected_booking_status = selected.status || "";
vars.selected_booking_payment_status = selected.payment_status || "";
vars.selected_booking_assignment_status = selected.assignment_status || "";
vars.selected_booking_scheduled_date = selected.scheduled_date || "";
vars.selected_booking_scheduled_time = selected.scheduled_time || "";
vars.selected_booking_scheduled_end_time = selected.scheduled_end_time || "";
vars.selected_booking_amount_paid_minor = Number(selected.amount_paid_minor || 0);
vars.selected_booking_amount_due_minor = Number(selected.amount_due_minor || 0);
vars.selected_booking_balance_due_minor = Number(selected.balance_due_minor || 0);
vars.selected_booking_final_amount_minor = Number(selected.final_amount_minor || 0);
vars.selected_booking_worker_id = selected.worker_id || "";
vars.selected_booking_worker_name = selected.worker_name || "";
vars.select_booking_route = "success";
return { route: "success" };
`;

const statusSummaryScript = `
const rows = Array.isArray(vars.selected_booking_status_events_result?.data) ? vars.selected_booking_status_events_result.data : [];
const sorted = rows.sort((a, b) => String(a.created_at || "").localeCompare(String(b.created_at || "")));
const latest = sorted[sorted.length - 1] || {};
vars.status_timeline_text = sorted.map((row) => "- " + (row.event_label || row.event_type || "") + (row.created_at ? " at " + row.created_at : "")).join("\\n");
vars.latest_status_label = latest.event_label || vars.selected_booking_status || "Confirmed";
vars.latest_status_eta = latest.eta_text || "";
return { route: "success", latest: vars.latest_status_label };
`;

const balanceDecisionScript = `
const rows = Array.isArray(vars.selected_booking_invoice_result?.data) ? vars.selected_booking_invoice_result.data : [];
const invoice = rows[0] || {};
function money(minor) {
  const amount = Number(minor || 0) / 100;
  return "Rs " + amount.toFixed(amount % 1 === 0 ? 0 : 2);
}
vars.selected_invoice_id = invoice.invoice_id || "";
vars.selected_invoice_number = invoice.invoice_number || "";
vars.selected_invoice_total_minor = Number(invoice.total_minor || 0);
vars.selected_invoice_due_minor = Number(invoice.amount_due_minor || 0);
vars.selected_invoice_paid_minor = Number(invoice.amount_paid_minor || 0);
vars.selected_invoice_download_url = invoice.download_url || "";
vars.selected_invoice_status = invoice.status || "";
vars.selected_invoice_summary = [
  "Invoice: " + (vars.selected_invoice_number || "Not available"),
  "Total: " + money(vars.selected_invoice_total_minor),
  "Paid: " + money(vars.selected_invoice_paid_minor),
  "Due: " + money(vars.selected_invoice_due_minor),
  "Status: " + (vars.selected_invoice_status || "unknown"),
  "Download: " + (vars.selected_invoice_download_url || "Will be shared by support")
].join("\\n");
vars.invoice_balance_route = vars.selected_invoice_due_minor > 0 ? "collect_balance" : "no_balance";
return { route: vars.invoice_balance_route };
`;

const feedbackRouteScript = `
const rating = Number(vars.feedback_rating || 0);
vars.feedback_sentiment = rating >= 4 ? "positive" : rating === 3 ? "neutral" : "negative";
vars.feedback_route = rating >= 4 ? "positive" : "complaint";
return { route: vars.feedback_route, sentiment: vars.feedback_sentiment };
`;

const complaintPriorityScript = `
const rating = Number(vars.feedback_rating || 0);
vars.complaint_priority = rating <= 2 ? "high" : "normal";
return { route: "success", priority: vars.complaint_priority };
`;

const prepareBookingCommitScript = `
const fee = Number(vars.booking_fee_minor || 0);
const estimated = Number(vars.estimated_amount_minor || 0);
const balance = Number(vars.balance_due_minor || 0);
const paidNow = String(vars.payment_collection_route || "") === "skip_payment" ? 0 : fee;
vars.booking_status = "confirmed";
vars.booking_payment_status = paidNow > 0 ? "paid" : "pending";
vars.booking_assignment_status = "pending_assignment";
vars.booking_amount_paid_minor = paidNow;
vars.booking_amount_due_minor = estimated;
vars.booking_balance_due_minor = balance;
vars.booking_final_amount_minor = estimated;
vars.payment_record_route = paidNow > 0 ? "create_payment" : "skip_payment";
return { route: "success", paid_now: paidNow };
`;

const mainMenuLookupModeScript = `
vars.identity_flow_mode = "lookup";
vars.post_booking_route = String(vars.main_menu_choice || "");
return { route: "success", post_booking_route: vars.post_booking_route };
`;

node("start_1", "start", 0, 0, {});
node("welcome_message", "message", 240, 0, msgData("Welcome to {{business_name}}. I can help you find the right service, check pricing and availability, book a professional, collect payment, track the job, and close the service cleanly."));
node("main_menu_input", "input", 480, 0, inputData("What would you like help with? You can tap a menu option or describe the problem naturally.", "main_menu_choice", mainMenuButtons));

node("discover_requirement_input", "input", 720, -260, inputData("Please describe what you need help with. For example: kitchen sink leaking, AC not cooling, need pest treatment, haircut tomorrow evening, or interior design consultation.", "service_requirement_text"));
node("parse_requirement", "script", 960, -260, scriptData(parseRequirementScript, "requirement_parse_result"));
node("requirement_route_switch", "switch", 1200, -260, switchData("requirement_parse_route"));
node("manual_category_input", "input", 1440, -360, inputData("I could not map that to a maintained category yet. Choose the closest one so I can match the correct catalog and pricing.", "service_category", [
  { label: "Plumbing", value: "plumbing" },
  { label: "AC Service", value: "ac_service" },
  { label: "Pest Control", value: "pest_control" },
  { label: "Electrician", value: "electrician" },
  { label: "Cleaning", value: "cleaning" },
  { label: "Salon", value: "salon" },
  { label: "Interiors", value: "interiors" },
  { label: "Consulting", value: "consulting" }
], true));
node("manual_category_set", "setVariable", 1680, -360, setVars({
  service_intent: "{{service_category}} enquiry",
  requirement_parse_route: "matched"
}));
node("service_catalog_list", "record", 1920, -260, recordData({
  action: "list",
  collection: "service_catalog",
  where: { category: "{{service_category}}", active: true },
  schema: schemas.serviceCatalog,
  outputVar: "service_catalog_result",
  sortBy: "service_name",
  sortOrder: "asc"
}));
node("service_catalog_prepare", "script", 2160, -260, scriptData(serviceCatalogScript, "service_catalog_prepare_result"));
node("service_catalog_route_switch", "switch", 2400, -260, switchData("service_catalog_route"));
node("no_service_match_message", "message", 2640, -420, msgData("I could not find a maintained service for that category right now, so I will not invent pricing or availability. Please choose Talk to the Team if you want manual help."));
node("no_service_match_end", "end", 2880, -420, { messages: [] });
node("service_catalog_message", "message", 2640, -260, msgData("Here are the active services I found:\\n\\n{{service_catalog_text}}"));
node("service_selection_form", "form", 2880, -260, formData("Enter the service number or service code you want to book.", [
  { key: "selected_service_choice", label: "Service number or code", type: "text", required: true }
], "service_selection_form_result"));
node("select_service", "script", 3120, -260, scriptData(serviceSelectionScript, "service_selection_result"));
node("service_selection_not_found_message", "message", 3360, -420, msgData("I could not match that service selection. Start again from the service list and enter the number or service code shown."));
node("service_selection_not_found_end", "end", 3600, -420, { messages: [] });
node("selected_service_message", "message", 3360, -260, msgData("Selected service\\n\\n{{selected_service_name}}\\n{{selected_service_description}}\\nPrice model: {{selected_service_pricing_model}}\\nCatalog price: {{selected_service_price_label}}\\nDuration: {{selected_service_duration_minutes}} minutes\\nBooking mode: {{selected_service_booking_mode}}\\nPayment policy: {{selected_service_payment_policy}}"));

node("prepare_request_ids", "setVariable", 3600, -260, setVars({
  request_id: "REQ-SVC-{{system.sessionId}}",
  booking_id: "BKG-SVC-{{system.sessionId}}",
  booking_number: "SRV-{{system.sessionId}}",
  slot_hold_id: "HOLD-SVC-{{system.sessionId}}",
  payment_id: "PAY-SVC-{{system.sessionId}}"
}));
node("booking_identity_mode_set", "setVariable", 3840, -260, setVars({
  identity_flow_mode: "booking",
  address_mode: "new"
}));
node("customer_mobile_form", "form", 4080, -260, formData("Please enter the mobile number for this service request.", [
  { key: "customer_mobile", label: "Mobile number", type: "phone", required: true }
], "customer_mobile_form_result"));
node("normalize_customer_mobile", "script", 4320, -260, scriptData(normalizePhoneScript, "normalize_customer_mobile_result"));
node("customer_otp_input_1", "input", 4560, -260, inputData("Enter the 6-digit OTP sent to your mobile number. For this demo flow, any 6-digit number is accepted.", "customer_otp_1"));
node("validate_customer_otp_1", "script", 4800, -260, scriptData(otpValidationScript("customer_otp_1"), "customer_otp_validate_1_result"));
node("customer_otp_route_1", "switch", 5040, -260, switchData("otp_validation_route"));
node("customer_otp_invalid_1", "message", 5280, -360, msgData("That OTP format is invalid. Please enter exactly 6 digits."));
node("customer_otp_input_2", "input", 5520, -360, inputData("Try again. Enter any 6-digit OTP value for the demo flow.", "customer_otp_2"));
node("validate_customer_otp_2", "script", 5760, -360, scriptData(otpValidationScript("customer_otp_2"), "customer_otp_validate_2_result"));
node("customer_otp_route_2", "switch", 6000, -360, switchData("otp_validation_route"));
node("customer_otp_invalid_2", "message", 6240, -460, msgData("That still is not a valid 6-digit OTP format."));
node("customer_otp_input_3", "input", 6480, -460, inputData("Final attempt. Enter a 6-digit OTP value.", "customer_otp_3"));
node("validate_customer_otp_3", "script", 6720, -460, scriptData(otpValidationScript("customer_otp_3"), "customer_otp_validate_3_result"));
node("customer_otp_route_3", "switch", 6960, -460, switchData("otp_validation_route"));
node("customer_otp_failed_message", "message", 7200, -560, msgData("I could not verify the mobile number after 3 invalid-format attempts. Start the service request again when you are ready."));
node("customer_otp_failed_end", "end", 7440, -560, { messages: [] });
node("customer_lookup", "record", 7200, -260, recordData({
  action: "list",
  collection: "service_customers",
  where: { phone_e164: "{{customer_mobile_e164}}" },
  schema: schemas.customers,
  outputVar: "customer_lookup_result",
  limit: 5
}));
node("hydrate_customer", "script", 7440, -260, scriptData(hydrateCustomerScript, "hydrate_customer_result"));
node("identity_route_switch", "switch", 7680, -260, switchData("identity_flow_mode"));
node("customer_not_found_route", "script", 7440, -80, scriptData(customerNotFoundRouteScript, "customer_not_found_route_result"));
node("customer_not_found_switch", "switch", 7680, -80, switchData("customer_not_found_route"));
node("new_customer_form", "form", 7920, -360, formData("I did not find an existing customer profile. Please share the remaining details.", customerFields, "new_customer_form_result"));
node("prepare_new_customer", "setVariable", 8160, -360, setVars({
  customer_id: "CUS-{{system.sessionId}}"
}));
node("customer_upsert", "record", 8400, -360, recordData({
  action: "upsert",
  collection: "service_customers",
  where: { customer_id: "{{customer_id}}" },
  data: {
    customer_id: "{{customer_id}}",
    full_name: "{{customer_name}}",
    phone_e164: "{{customer_mobile_e164}}",
    email: "{{customer_email}}",
    preferred_language: "en",
    saved_address_id: "",
    last_service_category: "{{selected_service_category}}",
    last_booking_id: ""
  },
  schema: schemas.customers,
  uniqueKey: "customer_id",
  idempotencyKey: "{{customer_id}}",
  outputVar: "customer_upsert_result",
  piiFields: "full_name,phone_e164,email"
}));
node("returning_customer_message", "message", 7920, -260, msgData("Welcome back, {{customer_name}}. I found your customer profile and can reuse the saved address if that is still correct."));
node("saved_address_lookup", "record", 8160, -260, recordData({
  action: "list",
  collection: "service_customer_addresses",
  where: { customer_id: "{{customer_id}}" },
  schema: schemas.addresses,
  outputVar: "saved_address_lookup_result",
  limit: 5
}));
node("saved_address_prepare", "script", 8400, -260, scriptData(savedAddressScript, "saved_address_prepare_result"));
node("saved_address_switch", "switch", 8640, -260, switchData("saved_address_route"));
node("saved_address_message", "message", 8880, -360, msgData("Saved address found\\n\\n{{saved_address_text}}"));
node("saved_address_use_input", "input", 9120, -360, inputData("Would you like to use this address for the service?", "use_saved_address", yesNoButtons(), true));
node("set_saved_address_mode", "setVariable", 9360, -420, setVars({ address_mode: "saved" }));
node("set_new_address_mode", "setVariable", 9360, -300, setVars({ address_mode: "new" }));
node("no_saved_address_message", "message", 8880, -180, msgData("I found your profile but there is no reusable address on file for this service request."));
node("location_required_switch", "switch", 9600, -260, switchData("selected_service_location_required"));
node("address_mode_switch", "switch", 9840, -260, switchData("address_mode"));
node("address_form", "form", 10080, -180, formData("Where do you need the service?", addressFields, "address_form_result"));
node("serviceability_lookup", "record", 10320, -260, recordData({
  action: "list",
  collection: "service_areas",
  where: {
    service_id: "{{selected_service_id}}",
    postal_code: "{{postal_code}}",
    active: true
  },
  schema: schemas.serviceAreas,
  outputVar: "serviceability_lookup_result",
  limit: 5
}));
node("serviceability_prepare", "script", 10560, -260, scriptData(serviceAreaScript, "serviceability_prepare_result"));
node("serviceability_success_switch", "switch", 10800, -260, switchData("address_mode"));
node("address_upsert", "record", 10800, -180, recordData({
  action: "upsert",
  collection: "service_customer_addresses",
  where: { address_id: "ADDR-{{system.sessionId}}" },
  data: {
    address_id: "ADDR-{{system.sessionId}}",
    customer_id: "{{customer_id}}",
    label: "{{address_label}}",
    address_line_1: "{{address_line_1}}",
    address_line_2: "{{address_line_2}}",
    locality: "{{locality}}",
    city: "{{city}}",
    state: "{{state}}",
    postal_code: "{{postal_code}}",
    latitude: "",
    longitude: "",
    is_default: false
  },
  schema: schemas.addresses,
  uniqueKey: "address_id",
  idempotencyKey: "ADDR-{{system.sessionId}}",
  outputVar: "address_upsert_result",
  piiFields: "address_line_1,address_line_2,locality,city,state,postal_code"
}));
node("set_new_address_id", "setVariable", 11040, -180, setVars({
  selected_address_id: "ADDR-{{system.sessionId}}"
}));
node("not_serviceable_message", "message", 10560, -520, msgData("This location is currently outside the active service area for {{selected_service_name}}. I will not book it against unavailable capacity."));
node("notify_interest_form", "form", 10800, -520, formData("If you want, I can save this request and note your preferred follow-up channel.", notifyFields, "notify_interest_form_result"));
node("notify_interest_record", "record", 11040, -520, recordData({
  action: "upsert",
  collection: "service_requests",
  where: { request_id: "{{request_id}}" },
  data: {
    request_id: "{{request_id}}",
    customer_id: "{{customer_id}}",
    service_id: "{{selected_service_id}}",
    category: "{{selected_service_category}}",
    request_summary: "{{service_requirement_text}}",
    urgency: "{{service_urgency}}",
    service_address_id: "{{selected_address_id}}",
    pricing_model: "{{selected_service_pricing_model}}",
    estimated_amount_minor: "{{selected_service_base_price_minor}}",
    status: "not_serviceable",
    preferred_date_note: "{{notify_note}}",
    source_channel: "{{system.channel}}",
    created_at: "{{demo_today}}"
  },
  schema: schemas.serviceRequests,
  uniqueKey: "request_id",
  idempotencyKey: "{{request_id}}:not-serviceable",
  outputVar: "notify_interest_record_result"
}));
node("not_serviceable_end", "end", 11280, -520, { messages: [] });
node("service_request_draft", "record", 11280, -260, recordData({
  action: "upsert",
  collection: "service_requests",
  where: { request_id: "{{request_id}}" },
  data: {
    request_id: "{{request_id}}",
    customer_id: "{{customer_id}}",
    service_id: "{{selected_service_id}}",
    category: "{{selected_service_category}}",
    request_summary: "{{service_requirement_text}}",
    urgency: "{{service_urgency}}",
    service_address_id: "{{selected_address_id}}",
    pricing_model: "{{selected_service_pricing_model}}",
    estimated_amount_minor: "{{selected_service_base_price_minor}}",
    status: "draft",
    preferred_date_note: "{{preferred_schedule_note}}",
    source_channel: "{{system.channel}}",
    created_at: "{{demo_today}}"
  },
  schema: schemas.serviceRequests,
  uniqueKey: "request_id",
  idempotencyKey: "{{request_id}}",
  outputVar: "service_request_draft_result"
}));
node("media_route_prepare", "script", 11520, -260, scriptData(mediaRouteScript, "media_route_prepare_result"));
node("media_route_switch", "switch", 11760, -260, switchData("media_route"));
node("optional_media_input", "input", 12000, -360, inputData("Photos are optional but helpful for this service. Would you like to upload them now?", "optional_media_choice", yesNoButtons(), true));
node("service_media_intake", "document-intake", 12240, -260, {
  messages: ["Upload service photos or files as PDF, JPG, JPEG, or PNG. I will save the intake metadata for downstream preparation."],
  acceptedTypesCsv: "pdf,jpg,jpeg,png",
  maxFiles: 5,
  minFiles: 1,
  outputVar: "service_media_files"
});
node("service_media_processor", "file-processor", 12480, -260, {
  inputFiles: "{{service_media_files}}",
  processingMode: "validate",
  acceptedTypesText: "pdf,jpg,jpeg,png",
  maxFileSizeMb: 15,
  expectedDocumentType: "service_issue_photo",
  confidenceThreshold: 0.7,
  strictExtraction: false,
  pageMode: "process_all_pages",
  schemaJson: pretty({
    fields: {
      visible_issue: "string",
      apparent_asset: "string",
      risk_level: "string"
    }
  }),
  outputVar: "service_media_processor_result"
});
node("service_media_analysis_prepare", "script", 12720, -260, scriptData(mediaSummaryScript, "service_media_analysis_prepare_result"));
node("service_media_record", "record", 12960, -260, recordData({
  action: "upsert",
  collection: "service_request_media",
  where: { media_id: "{{request_id}}:media" },
  data: {
    media_id: "{{request_id}}:media",
    request_id: "{{request_id}}",
    media_type: "service_photo_batch",
    storage_key: "{{request_id}}/media",
    mime_type: "mixed",
    size_bytes: 0,
    checksum: "",
    analysis_summary: "{{service_media_analysis_summary}}",
    status: "received"
  },
  schema: schemas.requestMedia,
  uniqueKey: "media_id",
  idempotencyKey: "{{request_id}}:media",
  outputVar: "service_media_record_result"
}));
node("service_question_list", "record", 13200, -260, recordData({
  action: "list",
  collection: "service_questions",
  where: { service_id: "{{selected_service_id}}", active: true },
  schema: schemas.serviceQuestions,
  outputVar: "service_question_list_result",
  sortBy: "display_order",
  sortOrder: "asc"
}));
node("service_question_prepare", "script", 13440, -260, scriptData(questionChecklistScript, "service_question_prepare_result"));
node("service_question_message", "message", 13680, -260, msgData("Before I check price and availability, please confirm these service details:\\n\\n{{service_question_text}}\\n\\nCatalog hint: {{selected_service_intake_hint}}"));
node("service_details_form", "form", 13920, -260, formData("Share the service-specific details.", serviceDetailFields, "service_details_form_result"));
node("pricing_prepare", "script", 14160, -260, scriptData(pricingScript, "pricing_prepare_result"));
node("service_summary_message", "message", 14400, -260, msgData("Service summary before scheduling\\n\\n{{service_summary_text}}\\n\\nService details captured: {{problem_or_goal}}"));
node("availability_slots_list", "record", 14640, -260, recordData({
  action: "list",
  collection: "service_availability_slots",
  where: {
    service_id: "{{selected_service_id}}",
    status: "available"
  },
  schema: schemas.slots,
  outputVar: "availability_slots_result",
  sortBy: "date",
  sortOrder: "asc",
  limit: 20
}));
node("slot_inventory_switch", "switch", 14640, -260, switchData("availability_slots_result.status"));
node("no_slots_message", "message", 14880, -420, msgData("I could not find an active slot for this service right now. Please try again later when new technician capacity is released."));
node("no_slots_end", "end", 15120, -420, { messages: [] });
node("slot_booking", "appointment", 14880, -260, appointmentData("Choose one of the real available service slots.", "availability_slots_result", "service_slot_booking"));
node("prepare_slot_hold", "setVariable", 15120, -260, setVars({
  selected_slot_id: "{{service_slot_booking.slotId}}",
  selected_slot_label: "{{service_slot_booking.slotLabel}}",
  selected_slot_date: "{{service_slot_booking.date}}",
  selected_slot_time: "{{service_slot_booking.startTime}}",
  selected_slot_end_time: "{{service_slot_booking.endTime}}"
}));
node("slot_hold_expiry_prepare", "script", 15360, -260, scriptData(holdExpiryScript, "slot_hold_expiry_prepare_result"));
node("slot_hold_update", "record", 15600, -260, recordData({
  action: "upsert",
  collection: "service_availability_slots",
  where: { slot_id: "{{selected_slot_id}}", status: "available" },
  data: {
    id: "{{selected_slot_id}}",
    slot_id: "{{selected_slot_id}}",
    service_id: "{{selected_service_id}}",
    service_area_id: "{{selected_service_area_id}}",
    worker_id: "",
    worker_name: "",
    date: "{{selected_slot_date}}",
    start: "{{selected_slot_time}}",
    end: "{{selected_slot_end_time}}",
    label: "{{selected_slot_label}}",
    status: "held",
    hold_id: "{{slot_hold_id}}",
    held_by_session: "{{system.sessionId}}",
    request_id: "{{request_id}}"
  },
  schema: schemas.slots,
  uniqueKey: "slot_id",
  idempotencyKey: "{{slot_hold_id}}:slot-hold",
  outputVar: "slot_hold_update_result"
}));
node("slot_conflict_message", "message", 15840, -420, msgData("I could not reserve that slot from the latest availability snapshot. Start again from the available slots list and choose another time."));
node("slot_conflict_end", "end", 16080, -420, { messages: [] });
node("slot_hold_record", "record", 15840, -260, recordData({
  action: "upsert",
  collection: "service_slot_holds",
  where: { hold_id: "{{slot_hold_id}}" },
  data: {
    hold_id: "{{slot_hold_id}}",
    request_id: "{{request_id}}",
    slot_id: "{{selected_slot_id}}",
    session_id: "{{system.sessionId}}",
    status: "active",
    expires_at: "{{slot_hold_expires_at}}"
  },
  schema: schemas.holds,
  uniqueKey: "hold_id",
  idempotencyKey: "{{slot_hold_id}}",
  outputVar: "slot_hold_record_result"
}));
node("booking_review_message", "message", 16080, -260, msgData("Review your booking\\n\\nService: {{selected_service_name}}\\nDate: {{selected_slot_date}}\\nTime: {{selected_slot_label}}\\nPrice: {{estimated_amount_label}}\\nBooking fee now: {{booking_fee_label}}\\nBalance after service: {{balance_due_label}}"));
node("payment_route_switch", "switch", 16320, -260, switchData("payment_collection_route"));
node("booking_payment", "payment", 16560, -260, paymentData({
  amount: "{{booking_fee_minor}}",
  description: "Service booking fee",
  customerNameVar: "{{customer_name}}",
  customerEmailVar: "{{customer_email}}",
  customerPhoneVar: "{{customer_mobile_e164}}",
  outputVar: "booking_payment_result"
}));
node("payment_retry_message", "message", 16560, -440, msgData("The payment was not confirmed. You can try one new payment link or release the held slot safely."));
node("booking_payment_retry", "payment", 16800, -440, paymentData({
  amount: "{{booking_fee_minor}}",
  description: "Service booking fee retry",
  customerNameVar: "{{customer_name}}",
  customerEmailVar: "{{customer_email}}",
  customerPhoneVar: "{{customer_mobile_e164}}",
  outputVar: "booking_payment_retry_result"
}));
node("release_payment_failure_message", "message", 17040, -620, msgData("I could not confirm payment, so I am releasing the held slot. You can start a fresh booking whenever you are ready."));
node("release_slot_after_payment_failure", "record", 17280, -620, recordData({
  action: "upsert",
  collection: "service_availability_slots",
  where: { slot_id: "{{selected_slot_id}}" },
  data: {
    id: "{{selected_slot_id}}",
    slot_id: "{{selected_slot_id}}",
    service_id: "{{selected_service_id}}",
    service_area_id: "{{selected_service_area_id}}",
    worker_id: "",
    worker_name: "",
    date: "{{selected_slot_date}}",
    start: "{{selected_slot_time}}",
    end: "{{selected_slot_end_time}}",
    label: "{{selected_slot_label}}",
    status: "available",
    hold_id: "",
    held_by_session: "",
    request_id: ""
  },
  schema: schemas.slots,
  uniqueKey: "slot_id",
  idempotencyKey: "{{slot_hold_id}}:release-slot",
  outputVar: "release_slot_after_payment_failure_result"
}));
node("release_hold_after_payment_failure", "record", 17520, -620, recordData({
  action: "upsert",
  collection: "service_slot_holds",
  where: { hold_id: "{{slot_hold_id}}" },
  data: {
    hold_id: "{{slot_hold_id}}",
    request_id: "{{request_id}}",
    slot_id: "{{selected_slot_id}}",
    session_id: "{{system.sessionId}}",
    status: "released",
    expires_at: "{{slot_hold_expires_at}}"
  },
  schema: schemas.holds,
  uniqueKey: "hold_id",
  idempotencyKey: "{{slot_hold_id}}:released",
  outputVar: "release_hold_after_payment_failure_result"
}));
node("payment_failed_end", "end", 17760, -620, { messages: [] });
node("prepare_booking_commit", "script", 16560, -120, scriptData(prepareBookingCommitScript, "prepare_booking_commit_result"));
node("booking_record", "record", 16800, -120, recordData({
  action: "upsert",
  collection: "service_bookings",
  where: { booking_id: "{{booking_id}}" },
  data: {
    booking_id: "{{booking_id}}",
    booking_number: "{{booking_number}}",
    request_id: "{{request_id}}",
    customer_id: "{{customer_id}}",
    service_id: "{{selected_service_id}}",
    service_name: "{{selected_service_name}}",
    slot_id: "{{selected_slot_id}}",
    service_address_id: "{{selected_address_id}}",
    scheduled_date: "{{selected_slot_date}}",
    scheduled_time: "{{selected_slot_time}}",
    scheduled_end_time: "{{selected_slot_end_time}}",
    status: "{{booking_status}}",
    payment_status: "{{booking_payment_status}}",
    assignment_status: "{{booking_assignment_status}}",
    amount_due_minor: "{{booking_amount_due_minor}}",
    amount_paid_minor: "{{booking_amount_paid_minor}}",
    balance_due_minor: "{{booking_balance_due_minor}}",
    final_amount_minor: "{{booking_final_amount_minor}}",
    worker_id: "",
    worker_name: "",
    updated_at: "{{demo_today}}"
  },
  schema: schemas.bookings,
  uniqueKey: "booking_id",
  idempotencyKey: "{{booking_id}}",
  outputVar: "booking_record_result"
}));
node("service_request_confirmed", "record", 17040, -120, recordData({
  action: "upsert",
  collection: "service_requests",
  where: { request_id: "{{request_id}}" },
  data: {
    request_id: "{{request_id}}",
    customer_id: "{{customer_id}}",
    service_id: "{{selected_service_id}}",
    category: "{{selected_service_category}}",
    request_summary: "{{problem_or_goal}}",
    urgency: "{{service_urgency}}",
    service_address_id: "{{selected_address_id}}",
    pricing_model: "{{selected_service_pricing_model}}",
    estimated_amount_minor: "{{estimated_amount_minor}}",
    status: "booked",
    preferred_date_note: "{{preferred_schedule_note}}",
    source_channel: "{{system.channel}}",
    created_at: "{{demo_today}}"
  },
  schema: schemas.serviceRequests,
  uniqueKey: "request_id",
  idempotencyKey: "{{request_id}}:booked",
  outputVar: "service_request_confirmed_result"
}));
node("slot_book_update", "record", 17280, -120, recordData({
  action: "upsert",
  collection: "service_availability_slots",
  where: { slot_id: "{{selected_slot_id}}" },
  data: {
    id: "{{selected_slot_id}}",
    slot_id: "{{selected_slot_id}}",
    service_id: "{{selected_service_id}}",
    service_area_id: "{{selected_service_area_id}}",
    worker_id: "",
    worker_name: "",
    date: "{{selected_slot_date}}",
    start: "{{selected_slot_time}}",
    end: "{{selected_slot_end_time}}",
    label: "{{selected_slot_label}}",
    status: "booked",
    hold_id: "{{slot_hold_id}}",
    held_by_session: "{{system.sessionId}}",
    request_id: "{{request_id}}"
  },
  schema: schemas.slots,
  uniqueKey: "slot_id",
  idempotencyKey: "{{booking_id}}:slot-book",
  outputVar: "slot_book_update_result"
}));
node("hold_convert_record", "record", 17520, -120, recordData({
  action: "upsert",
  collection: "service_slot_holds",
  where: { hold_id: "{{slot_hold_id}}" },
  data: {
    hold_id: "{{slot_hold_id}}",
    request_id: "{{request_id}}",
    slot_id: "{{selected_slot_id}}",
    session_id: "{{system.sessionId}}",
    status: "converted",
    expires_at: "{{slot_hold_expires_at}}"
  },
  schema: schemas.holds,
  uniqueKey: "hold_id",
  idempotencyKey: "{{slot_hold_id}}:converted",
  outputVar: "hold_convert_record_result"
}));
node("payment_record_switch", "switch", 17760, -120, switchData("payment_record_route"));
node("payment_record", "record", 18000, -200, recordData({
  action: "upsert",
  collection: "service_payments",
  where: { payment_id: "{{payment_id}}" },
  data: {
    payment_id: "{{payment_id}}",
    booking_id: "{{booking_id}}",
    amount_minor: "{{booking_fee_minor}}",
    currency: "{{default_currency}}",
    payment_type: "booking_fee",
    provider: "{{payment_provider}}",
    provider_reference: "{{booking_payment_result.reference}}",
    status: "paid",
    idempotency_key: "{{payment_id}}"
  },
  schema: schemas.payments,
  uniqueKey: "payment_id",
  idempotencyKey: "{{payment_id}}",
  outputVar: "payment_record_result"
}));
node("assignment_candidates", "record", 18240, -120, recordData({
  action: "list",
  collection: "service_workers",
  where: { status: "active" },
  schema: schemas.workers,
  outputVar: "assignment_candidates_result",
  limit: 20
}));
node("assignment_prepare", "script", 18480, -120, scriptData(assignmentScript, "assignment_prepare_result"));
node("assignment_route_switch", "switch", 18720, -120, switchData("assignment_route"));
node("assignment_unavailable_message", "message", 18960, -260, msgData("The booking is confirmed, but I could not auto-assign a technician from the current eligible roster. I am forwarding it to the operations team for manual assignment."));
node("assignment_unavailable_handover", "handover", 19200, -260, handoverData("Booking confirmed but assignment requires manual intervention."));
node("assignment_record", "record", 18960, -120, recordData({
  action: "upsert",
  collection: "service_assignments",
  where: { assignment_id: "{{booking_id}}" },
  data: {
    assignment_id: "{{booking_id}}",
    booking_id: "{{booking_id}}",
    worker_id: "{{assigned_worker_id}}",
    worker_name: "{{assigned_worker_name}}",
    assignment_type: "{{selected_service_assignment_mode}}",
    status: "assigned",
    service_area_id: "{{selected_service_area_id}}",
    score: "{{assignment_score}}"
  },
  schema: schemas.assignments,
  uniqueKey: "assignment_id",
  idempotencyKey: "{{booking_id}}:assignment",
  outputVar: "assignment_record_result"
}));
node("booking_assignment_update", "record", 19200, -120, recordData({
  action: "upsert",
  collection: "service_bookings",
  where: { booking_id: "{{booking_id}}" },
  data: {
    booking_id: "{{booking_id}}",
    booking_number: "{{booking_number}}",
    request_id: "{{request_id}}",
    customer_id: "{{customer_id}}",
    service_id: "{{selected_service_id}}",
    service_name: "{{selected_service_name}}",
    slot_id: "{{selected_slot_id}}",
    service_address_id: "{{selected_address_id}}",
    scheduled_date: "{{selected_slot_date}}",
    scheduled_time: "{{selected_slot_time}}",
    scheduled_end_time: "{{selected_slot_end_time}}",
    status: "assigned",
    payment_status: "{{booking_payment_status}}",
    assignment_status: "assigned",
    amount_due_minor: "{{booking_amount_due_minor}}",
    amount_paid_minor: "{{booking_amount_paid_minor}}",
    balance_due_minor: "{{booking_balance_due_minor}}",
    final_amount_minor: "{{booking_final_amount_minor}}",
    worker_id: "{{assigned_worker_id}}",
    worker_name: "{{assigned_worker_name}}",
    updated_at: "{{demo_today}}"
  },
  schema: schemas.bookings,
  uniqueKey: "booking_id",
  idempotencyKey: "{{booking_id}}:assignment-update",
  outputVar: "booking_assignment_update_result"
}));
node("assignment_status_event", "record", 19440, -120, recordData({
  action: "upsert",
  collection: "service_status_events",
  where: { status_event_id: "{{booking_id}}:assigned" },
  data: {
    status_event_id: "{{booking_id}}:assigned",
    booking_id: "{{booking_id}}",
    worker_id: "{{assigned_worker_id}}",
    event_type: "assigned",
    event_label: "Professional assignment confirmed",
    eta_text: "Technician details will be shared before arrival.",
    created_at: "{{demo_today}}"
  },
  schema: schemas.statusEvents,
  uniqueKey: "status_event_id",
  idempotencyKey: "{{booking_id}}:assigned-event",
  outputVar: "assignment_status_event_result"
}));
node("buyer_confirmation_notification", "notification", 19680, -120, notificationData({
  recipients: [
    { type: "customer", phone: "{{customer_mobile_e164}}", email: "{{customer_email}}" }
  ],
  channels: [
    { type: "whatsapp", enabled: true, templateId: "service_booking_confirmed" },
    { type: "sms", enabled: true, message: "Booking {{booking_number}} confirmed for {{selected_service_name}} on {{selected_slot_date}} at {{selected_slot_label}}. Paid now {{booking_fee_label}}. Balance {{balance_due_label}}." },
    { type: "email", enabled: true, subject: "Your service booking is confirmed", body: "Booking ID: {{booking_number}}\\nService: {{selected_service_name}}\\nDate: {{selected_slot_date}}\\nTime: {{selected_slot_label}}\\nPaid now: {{booking_fee_label}}\\nBalance: {{balance_due_label}}" }
  ],
  outputVar: "buyer_confirmation_notification_result",
  dedupeKey: "{{booking_id}}:confirmation"
}));
node("reminder_24h", "scheduler", 19920, -120, schedulerData({
  runAt: "{{selected_slot_date}}T{{selected_slot_time}}:00+05:30",
  offsetValue: 24,
  offsetUnit: "hours",
  offsetDirection: "before",
  payload: { type: "service_reminder_24h", booking_id: "{{booking_id}}" },
  outputVar: "reminder_24h_result",
  dedupeKey: "{{booking_id}}:reminder-24h"
}));
node("reminder_2h", "scheduler", 20160, -120, schedulerData({
  runAt: "{{selected_slot_date}}T{{selected_slot_time}}:00+05:30",
  offsetValue: 2,
  offsetUnit: "hours",
  offsetDirection: "before",
  payload: { type: "service_reminder_2h", booking_id: "{{booking_id}}" },
  outputVar: "reminder_2h_result",
  dedupeKey: "{{booking_id}}:reminder-2h"
}));
node("reminder_record_24h", "record", 20400, -200, recordData({
  action: "upsert",
  collection: "service_reminder_jobs",
  where: { reminder_id: "{{booking_id}}:24h" },
  data: {
    reminder_id: "{{booking_id}}:24h",
    booking_id: "{{booking_id}}",
    reminder_type: "24h_before",
    scheduled_for: "{{selected_slot_date}}T{{selected_slot_time}}:00+05:30",
    channel: "whatsapp",
    status: "scheduled"
  },
  schema: schemas.reminders,
  uniqueKey: "reminder_id",
  idempotencyKey: "{{booking_id}}:reminder-record-24h",
  outputVar: "reminder_record_24h_result"
}));
node("reminder_record_2h", "record", 20640, -200, recordData({
  action: "upsert",
  collection: "service_reminder_jobs",
  where: { reminder_id: "{{booking_id}}:2h" },
  data: {
    reminder_id: "{{booking_id}}:2h",
    booking_id: "{{booking_id}}",
    reminder_type: "2h_before",
    scheduled_for: "{{selected_slot_date}}T{{selected_slot_time}}:00+05:30",
    channel: "sms",
    status: "scheduled"
  },
  schema: schemas.reminders,
  uniqueKey: "reminder_id",
  idempotencyKey: "{{booking_id}}:reminder-record-2h",
  outputVar: "reminder_record_2h_result"
}));
node("booking_confirmed_message", "message", 20880, -120, msgData("Your appointment is confirmed.\\n\\nBooking ID: {{booking_number}}\\nService: {{selected_service_name}}\\nDate: {{selected_slot_date}}\\nTime: {{selected_slot_label}}\\nPaid now: {{booking_fee_label}}\\nBalance after service: {{balance_due_label}}\\nAssigned professional: {{assigned_worker_name}}"));
node("booking_end", "end", 21120, -120, { messages: [] });

node("lookup_mode_prepare", "script", 720, 300, scriptData(mainMenuLookupModeScript, "lookup_mode_prepare_result"));
node("lookup_mobile_form", "form", 960, 300, formData("Enter the registered mobile number so I can find your service bookings.", [
  { key: "customer_mobile", label: "Mobile number", type: "phone", required: true }
], "lookup_mobile_form_result"));
node("lookup_normalize_mobile", "script", 1200, 300, scriptData(normalizePhoneScript, "lookup_normalize_mobile_result"));
node("lookup_otp_input_1", "input", 1440, 300, inputData("Enter the 6-digit OTP sent to your mobile number. For this demo, any 6-digit OTP is accepted.", "customer_otp_1"));

node("customer_booking_list", "record", 7920, 300, recordData({
  action: "list",
  collection: "service_bookings",
  where: { customer_id: "{{customer_id}}" },
  schema: schemas.bookings,
  outputVar: "customer_booking_list_result",
  limit: 20,
  sortBy: "scheduled_date",
  sortOrder: "desc"
}));
node("booking_filter_prepare", "script", 8160, 300, scriptData(bookingFilterScript, "booking_filter_prepare_result"));
node("booking_selection_switch", "switch", 8400, 300, switchData("booking_selection_route"));
node("lookup_no_booking_message", "message", 8640, 120, msgData("I could not find a booking for that mobile number and requested journey type."));
node("lookup_no_booking_end", "end", 8880, 120, { messages: [] });
node("booking_selection_message", "message", 8640, 300, msgData("I found multiple matching bookings. Choose the booking number you want to continue with:\\n\\n{{booking_options_text}}"));
node("booking_selection_form", "form", 8880, 300, formData("Enter the booking number or list number.", [
  { key: "selected_booking_choice", label: "Booking selection", type: "text", required: true }
], "booking_selection_form_result"));
node("select_booking", "script", 9120, 300, scriptData(selectBookingScript, "select_booking_result"));
node("select_booking_route_switch", "switch", 9360, 300, switchData("select_booking_route"));
node("select_booking_not_found_message", "message", 9600, 120, msgData("I could not match that booking selection. Start again from the booking list and enter the booking number shown."));
node("select_booking_not_found_end", "end", 9840, 120, { messages: [] });
node("selected_booking_message", "message", 9600, 300, msgData("Selected booking\\n\\nBooking: {{selected_booking_number}}\\nService: {{selected_booking_service_name}}\\nDate: {{selected_booking_scheduled_date}}\\nTime: {{selected_booking_scheduled_time}}\\nStatus: {{selected_booking_status}}\\nPayment: {{selected_booking_payment_status}}"));
node("post_booking_route_switch", "switch", 9840, 300, switchData("post_booking_route"));
node("my_booking_overview_message", "message", 10080, 40, msgData("Upcoming booking\\n\\nBooking: {{selected_booking_number}}\\nService: {{selected_booking_service_name}}\\nDate: {{selected_booking_scheduled_date}}\\nTime: {{selected_booking_scheduled_time}}\\nStatus: {{selected_booking_status}}\\nAssigned professional: {{selected_booking_worker_name}}"));
node("my_booking_overview_end", "end", 10320, 40, { messages: [] });
node("selected_booking_status_events", "record", 10080, 300, recordData({
  action: "list",
  collection: "service_status_events",
  where: { booking_id: "{{selected_booking_id}}" },
  schema: schemas.statusEvents,
  outputVar: "selected_booking_status_events_result",
  limit: 20,
  sortBy: "created_at",
  sortOrder: "asc"
}));
node("status_summary_prepare", "script", 10320, 300, scriptData(statusSummaryScript, "status_summary_prepare_result"));
node("status_message", "message", 10560, 300, msgData("Current service status\\n\\nLatest: {{latest_status_label}}\\nETA / Note: {{latest_status_eta}}\\n\\nTimeline\\n{{status_timeline_text}}"));
node("status_end", "end", 10800, 300, { messages: [] });

node("reschedule_slots_list", "record", 10080, 620, recordData({
  action: "list",
  collection: "service_availability_slots",
  where: {
    service_id: "{{selected_booking_service_id}}",
    status: "available"
  },
  schema: schemas.slots,
  outputVar: "reschedule_slots_result",
  sortBy: "date",
  sortOrder: "asc",
  limit: 20
}));
node("reschedule_slot_switch", "switch", 10320, 620, switchData("reschedule_slots_result.status"));
node("reschedule_no_slots_message", "message", 10560, 520, msgData("I could not find a new slot for this booking right now."));
node("reschedule_no_slots_end", "end", 10800, 520, { messages: [] });
node("reschedule_slot_booking", "appointment", 10560, 620, appointmentData("Choose the new slot for this booking.", "reschedule_slots_result", "reschedule_slot_booking_result"));
node("reschedule_prepare_hold", "setVariable", 10800, 620, setVars({
  reschedule_hold_id: "HOLD-RS-{{system.sessionId}}",
  reschedule_slot_id: "{{reschedule_slot_booking_result.slotId}}",
  reschedule_slot_label: "{{reschedule_slot_booking_result.slotLabel}}",
  reschedule_slot_date: "{{reschedule_slot_booking_result.date}}",
  reschedule_slot_time: "{{reschedule_slot_booking_result.startTime}}",
  reschedule_slot_end_time: "{{reschedule_slot_booking_result.endTime}}"
}));
node("reschedule_hold_expiry_prepare", "script", 11040, 620, scriptData(holdExpiryScript, "reschedule_hold_expiry_prepare_result"));
node("reschedule_slot_hold_update", "record", 11280, 620, recordData({
  action: "upsert",
  collection: "service_availability_slots",
  where: { slot_id: "{{reschedule_slot_id}}", status: "available" },
  data: {
    id: "{{reschedule_slot_id}}",
    slot_id: "{{reschedule_slot_id}}",
    service_id: "{{selected_booking_service_id}}",
    service_area_id: "{{selected_service_area_id}}",
    worker_id: "",
    worker_name: "",
    date: "{{reschedule_slot_date}}",
    start: "{{reschedule_slot_time}}",
    end: "{{reschedule_slot_end_time}}",
    label: "{{reschedule_slot_label}}",
    status: "held",
    hold_id: "{{reschedule_hold_id}}",
    held_by_session: "{{system.sessionId}}",
    request_id: "{{selected_booking_request_id}}"
  },
  schema: schemas.slots,
  uniqueKey: "slot_id",
  idempotencyKey: "{{reschedule_hold_id}}:hold",
  outputVar: "reschedule_slot_hold_update_result"
}));
node("reschedule_review_input", "input", 11520, 620, inputData("Confirm the reschedule?\\n\\nOld slot: {{selected_booking_scheduled_date}} {{selected_booking_scheduled_time}}\\nNew slot: {{reschedule_slot_date}} {{reschedule_slot_label}}", "reschedule_confirm", yesNoButtons(), true));
node("reschedule_release_new_slot", "record", 11760, 760, recordData({
  action: "upsert",
  collection: "service_availability_slots",
  where: { slot_id: "{{reschedule_slot_id}}" },
  data: {
    id: "{{reschedule_slot_id}}",
    slot_id: "{{reschedule_slot_id}}",
    service_id: "{{selected_booking_service_id}}",
    service_area_id: "{{selected_service_area_id}}",
    worker_id: "",
    worker_name: "",
    date: "{{reschedule_slot_date}}",
    start: "{{reschedule_slot_time}}",
    end: "{{reschedule_slot_end_time}}",
    label: "{{reschedule_slot_label}}",
    status: "available",
    hold_id: "",
    held_by_session: "",
    request_id: ""
  },
  schema: schemas.slots,
  uniqueKey: "slot_id",
  idempotencyKey: "{{reschedule_hold_id}}:release-slot",
  outputVar: "reschedule_release_new_slot_result"
}));
node("reschedule_release_hold", "record", 12000, 760, recordData({
  action: "upsert",
  collection: "service_slot_holds",
  where: { hold_id: "{{reschedule_hold_id}}" },
  data: {
    hold_id: "{{reschedule_hold_id}}",
    request_id: "{{selected_booking_request_id}}",
    slot_id: "{{reschedule_slot_id}}",
    session_id: "{{system.sessionId}}",
    status: "released",
    expires_at: "{{slot_hold_expires_at}}"
  },
  schema: schemas.holds,
  uniqueKey: "hold_id",
  idempotencyKey: "{{reschedule_hold_id}}:released",
  outputVar: "reschedule_release_hold_result"
}));
node("reschedule_cancelled_end", "end", 12240, 760, { messages: [] });
node("reschedule_booking_update", "record", 11760, 620, recordData({
  action: "upsert",
  collection: "service_bookings",
  where: { booking_id: "{{selected_booking_id}}" },
  data: {
    booking_id: "{{selected_booking_id}}",
    booking_number: "{{selected_booking_number}}",
    request_id: "{{selected_booking_request_id}}",
    customer_id: "{{customer_id}}",
    service_id: "{{selected_booking_service_id}}",
    service_name: "{{selected_booking_service_name}}",
    slot_id: "{{reschedule_slot_id}}",
    service_address_id: "{{selected_booking_address_id}}",
    scheduled_date: "{{reschedule_slot_date}}",
    scheduled_time: "{{reschedule_slot_time}}",
    scheduled_end_time: "{{reschedule_slot_end_time}}",
    status: "confirmed",
    payment_status: "{{selected_booking_payment_status}}",
    assignment_status: "pending_assignment",
    amount_due_minor: "{{selected_booking_amount_due_minor}}",
    amount_paid_minor: "{{selected_booking_amount_paid_minor}}",
    balance_due_minor: "{{selected_booking_balance_due_minor}}",
    final_amount_minor: "{{selected_booking_final_amount_minor}}",
    worker_id: "",
    worker_name: "",
    updated_at: "{{demo_today}}"
  },
  schema: schemas.bookings,
  uniqueKey: "booking_id",
  idempotencyKey: "{{selected_booking_id}}:rescheduled",
  outputVar: "reschedule_booking_update_result"
}));
node("reschedule_new_slot_book", "record", 12000, 620, recordData({
  action: "upsert",
  collection: "service_availability_slots",
  where: { slot_id: "{{reschedule_slot_id}}" },
  data: {
    id: "{{reschedule_slot_id}}",
    slot_id: "{{reschedule_slot_id}}",
    service_id: "{{selected_booking_service_id}}",
    service_area_id: "{{selected_service_area_id}}",
    worker_id: "",
    worker_name: "",
    date: "{{reschedule_slot_date}}",
    start: "{{reschedule_slot_time}}",
    end: "{{reschedule_slot_end_time}}",
    label: "{{reschedule_slot_label}}",
    status: "booked",
    hold_id: "{{reschedule_hold_id}}",
    held_by_session: "{{system.sessionId}}",
    request_id: "{{selected_booking_request_id}}"
  },
  schema: schemas.slots,
  uniqueKey: "slot_id",
  idempotencyKey: "{{selected_booking_id}}:new-slot-book",
  outputVar: "reschedule_new_slot_book_result"
}));
node("reschedule_old_slot_release", "record", 12240, 620, recordData({
  action: "upsert",
  collection: "service_availability_slots",
  where: { slot_id: "{{selected_booking_slot_id}}" },
  data: {
    id: "{{selected_booking_slot_id}}",
    slot_id: "{{selected_booking_slot_id}}",
    service_id: "{{selected_booking_service_id}}",
    service_area_id: "{{selected_service_area_id}}",
    worker_id: "",
    worker_name: "",
    date: "{{selected_booking_scheduled_date}}",
    start: "{{selected_booking_scheduled_time}}",
    end: "{{selected_booking_scheduled_end_time}}",
    label: "{{selected_booking_scheduled_time}}",
    status: "available",
    hold_id: "",
    held_by_session: "",
    request_id: ""
  },
  schema: schemas.slots,
  uniqueKey: "slot_id",
  idempotencyKey: "{{selected_booking_id}}:old-slot-release",
  outputVar: "reschedule_old_slot_release_result"
}));
node("reschedule_hold_convert", "record", 12480, 620, recordData({
  action: "upsert",
  collection: "service_slot_holds",
  where: { hold_id: "{{reschedule_hold_id}}" },
  data: {
    hold_id: "{{reschedule_hold_id}}",
    request_id: "{{selected_booking_request_id}}",
    slot_id: "{{reschedule_slot_id}}",
    session_id: "{{system.sessionId}}",
    status: "converted",
    expires_at: "{{slot_hold_expires_at}}"
  },
  schema: schemas.holds,
  uniqueKey: "hold_id",
  idempotencyKey: "{{reschedule_hold_id}}:converted",
  outputVar: "reschedule_hold_convert_result"
}));
node("reschedule_notification", "notification", 12720, 620, notificationData({
  recipients: [{ type: "customer", phone: "{{customer_mobile_e164}}", email: "{{customer_email}}" }],
  channels: [
    { type: "sms", enabled: true, message: "Booking {{selected_booking_number}} moved to {{reschedule_slot_date}} at {{reschedule_slot_label}}." },
    { type: "email", enabled: true, subject: "Your service booking was rescheduled", body: "Booking {{selected_booking_number}} is now scheduled for {{reschedule_slot_date}} at {{reschedule_slot_label}}." }
  ],
  outputVar: "reschedule_notification_result",
  dedupeKey: "{{selected_booking_id}}:reschedule"
}));
node("reschedule_complete_message", "message", 12960, 620, msgData("Your booking has been rescheduled.\\n\\nBooking: {{selected_booking_number}}\\nNew slot: {{reschedule_slot_date}} {{reschedule_slot_label}}"));
node("reschedule_end", "end", 13200, 620, { messages: [] });

node("cancel_confirm_input", "input", 10080, 980, inputData("Do you want to cancel booking {{selected_booking_number}} for {{selected_booking_service_name}} on {{selected_booking_scheduled_date}} at {{selected_booking_scheduled_time}}?", "cancel_confirm", yesNoButtons(), true));
node("cancel_abort_message", "message", 10320, 1120, msgData("No changes were made to the booking."));
node("cancel_abort_end", "end", 10560, 1120, { messages: [] });
node("cancel_booking_update", "record", 10320, 980, recordData({
  action: "upsert",
  collection: "service_bookings",
  where: { booking_id: "{{selected_booking_id}}" },
  data: {
    booking_id: "{{selected_booking_id}}",
    booking_number: "{{selected_booking_number}}",
    request_id: "{{selected_booking_request_id}}",
    customer_id: "{{customer_id}}",
    service_id: "{{selected_booking_service_id}}",
    service_name: "{{selected_booking_service_name}}",
    slot_id: "{{selected_booking_slot_id}}",
    service_address_id: "{{selected_booking_address_id}}",
    scheduled_date: "{{selected_booking_scheduled_date}}",
    scheduled_time: "{{selected_booking_scheduled_time}}",
    scheduled_end_time: "{{selected_booking_scheduled_end_time}}",
    status: "cancelled",
    payment_status: "{{selected_booking_payment_status}}",
    assignment_status: "{{selected_booking_assignment_status}}",
    amount_due_minor: "{{selected_booking_amount_due_minor}}",
    amount_paid_minor: "{{selected_booking_amount_paid_minor}}",
    balance_due_minor: "{{selected_booking_balance_due_minor}}",
    final_amount_minor: "{{selected_booking_final_amount_minor}}",
    worker_id: "{{selected_booking_worker_id}}",
    worker_name: "{{selected_booking_worker_name}}",
    updated_at: "{{demo_today}}"
  },
  schema: schemas.bookings,
  uniqueKey: "booking_id",
  idempotencyKey: "{{selected_booking_id}}:cancel",
  outputVar: "cancel_booking_update_result"
}));
node("cancel_slot_release", "record", 10560, 980, recordData({
  action: "upsert",
  collection: "service_availability_slots",
  where: { slot_id: "{{selected_booking_slot_id}}" },
  data: {
    id: "{{selected_booking_slot_id}}",
    slot_id: "{{selected_booking_slot_id}}",
    service_id: "{{selected_booking_service_id}}",
    service_area_id: "{{selected_service_area_id}}",
    worker_id: "",
    worker_name: "",
    date: "{{selected_booking_scheduled_date}}",
    start: "{{selected_booking_scheduled_time}}",
    end: "{{selected_booking_scheduled_end_time}}",
    label: "{{selected_booking_scheduled_time}}",
    status: "available",
    hold_id: "",
    held_by_session: "",
    request_id: ""
  },
  schema: schemas.slots,
  uniqueKey: "slot_id",
  idempotencyKey: "{{selected_booking_id}}:cancel-slot-release",
  outputVar: "cancel_slot_release_result"
}));
node("cancel_notification", "notification", 10800, 980, notificationData({
  recipients: [{ type: "customer", phone: "{{customer_mobile_e164}}", email: "{{customer_email}}" }],
  channels: [
    { type: "sms", enabled: true, message: "Booking {{selected_booking_number}} was cancelled. If a refund is applicable, the team will process it according to policy." },
    { type: "email", enabled: true, subject: "Your service booking was cancelled", body: "Booking {{selected_booking_number}} has been cancelled. The slot was released back to active availability." }
  ],
  outputVar: "cancel_notification_result",
  dedupeKey: "{{selected_booking_id}}:cancel-notify"
}));
node("cancel_complete_message", "message", 11040, 980, msgData("The booking is cancelled and the slot has been released. If a refund is applicable, the team will process it according to policy."));
node("cancel_end", "end", 11280, 980, { messages: [] });

node("selected_booking_invoice", "record", 10080, 1340, recordData({
  action: "list",
  collection: "service_invoices",
  where: { booking_id: "{{selected_booking_id}}" },
  schema: schemas.invoices,
  outputVar: "selected_booking_invoice_result",
  limit: 5
}));
node("invoice_balance_prepare", "script", 10320, 1340, scriptData(balanceDecisionScript, "invoice_balance_prepare_result"));
node("invoice_summary_message", "message", 10560, 1340, msgData("Invoice summary\\n\\n{{selected_invoice_summary}}"));
node("invoice_balance_switch", "switch", 10800, 1340, switchData("invoice_balance_route"));
node("invoice_no_balance_end", "end", 11040, 1240, { messages: [] });
node("balance_payment_input", "input", 11040, 1440, inputData("A balance is still due on this booking. Would you like to pay it now?", "pay_balance_now", yesNoButtons(), true));
node("balance_payment", "payment", 11280, 1440, paymentData({
  amount: "{{selected_invoice_due_minor}}",
  description: "Outstanding service balance",
  customerNameVar: "{{customer_name}}",
  customerEmailVar: "{{customer_email}}",
  customerPhoneVar: "{{customer_mobile_e164}}",
  outputVar: "balance_payment_result"
}));
node("balance_payment_record", "record", 11520, 1440, recordData({
  action: "upsert",
  collection: "service_payments",
  where: { payment_id: "{{selected_booking_id}}:balance" },
  data: {
    payment_id: "{{selected_booking_id}}:balance",
    booking_id: "{{selected_booking_id}}",
    amount_minor: "{{selected_invoice_due_minor}}",
    currency: "{{default_currency}}",
    payment_type: "balance",
    provider: "{{payment_provider}}",
    provider_reference: "{{balance_payment_result.reference}}",
    status: "paid",
    idempotency_key: "{{selected_booking_id}}:balance"
  },
  schema: schemas.payments,
  uniqueKey: "payment_id",
  idempotencyKey: "{{selected_booking_id}}:balance",
  outputVar: "balance_payment_record_result"
}));
node("invoice_paid_update", "record", 11760, 1440, recordData({
  action: "upsert",
  collection: "service_invoices",
  where: { invoice_id: "{{selected_invoice_id}}" },
  data: {
    invoice_id: "{{selected_invoice_id}}",
    booking_id: "{{selected_booking_id}}",
    invoice_number: "{{selected_invoice_number}}",
    subtotal_minor: "{{selected_invoice_total_minor}}",
    tax_minor: 0,
    total_minor: "{{selected_invoice_total_minor}}",
    amount_paid_minor: "{{selected_invoice_total_minor}}",
    amount_due_minor: 0,
    status: "paid",
    issued_at: "{{demo_today}}",
    download_url: "{{selected_invoice_download_url}}"
  },
  schema: schemas.invoices,
  uniqueKey: "invoice_id",
  idempotencyKey: "{{selected_invoice_id}}:paid",
  outputVar: "invoice_paid_update_result"
}));
node("booking_paid_update", "record", 12000, 1440, recordData({
  action: "upsert",
  collection: "service_bookings",
  where: { booking_id: "{{selected_booking_id}}" },
  data: {
    booking_id: "{{selected_booking_id}}",
    booking_number: "{{selected_booking_number}}",
    request_id: "{{selected_booking_request_id}}",
    customer_id: "{{customer_id}}",
    service_id: "{{selected_booking_service_id}}",
    service_name: "{{selected_booking_service_name}}",
    slot_id: "{{selected_booking_slot_id}}",
    service_address_id: "{{selected_booking_address_id}}",
    scheduled_date: "{{selected_booking_scheduled_date}}",
    scheduled_time: "{{selected_booking_scheduled_time}}",
    scheduled_end_time: "{{selected_booking_scheduled_end_time}}",
    status: "completed",
    payment_status: "paid",
    assignment_status: "{{selected_booking_assignment_status}}",
    amount_due_minor: "{{selected_booking_amount_due_minor}}",
    amount_paid_minor: "{{selected_invoice_total_minor}}",
    balance_due_minor: 0,
    final_amount_minor: "{{selected_booking_final_amount_minor}}",
    worker_id: "{{selected_booking_worker_id}}",
    worker_name: "{{selected_booking_worker_name}}",
    updated_at: "{{demo_today}}"
  },
  schema: schemas.bookings,
  uniqueKey: "booking_id",
  idempotencyKey: "{{selected_booking_id}}:paid-update",
  outputVar: "booking_paid_update_result"
}));
node("balance_paid_message", "message", 12240, 1440, msgData("The outstanding balance was paid successfully. Updated invoice status: paid."));
node("balance_paid_end", "end", 12480, 1440, { messages: [] });
node("balance_declined_end", "end", 11280, 1560, { messages: [] });

node("feedback_rating_input", "input", 10080, 1700, inputData("How was your experience?", "feedback_rating", [
  { label: "1", value: "1" },
  { label: "2", value: "2" },
  { label: "3", value: "3" },
  { label: "4", value: "4" },
  { label: "5", value: "5" }
], true));
node("feedback_comment_form", "form", 10320, 1700, formData("Add a comment if you want.", feedbackCommentFields, "feedback_comment_form_result"));
node("feedback_route_prepare", "script", 10560, 1700, scriptData(feedbackRouteScript, "feedback_route_prepare_result"));
node("feedback_record", "record", 10800, 1700, recordData({
  action: "upsert",
  collection: "service_feedback",
  where: { feedback_id: "{{selected_booking_id}}" },
  data: {
    feedback_id: "{{selected_booking_id}}",
    booking_id: "{{selected_booking_id}}",
    customer_id: "{{customer_id}}",
    rating: "{{feedback_rating}}",
    comment: "{{feedback_comment}}",
    sentiment: "{{feedback_sentiment}}",
    created_at: "{{demo_today}}"
  },
  schema: schemas.feedback,
  uniqueKey: "feedback_id",
  idempotencyKey: "{{selected_booking_id}}:feedback",
  outputVar: "feedback_record_result"
}));
node("feedback_route_switch", "switch", 11040, 1700, switchData("feedback_route"));
node("positive_feedback_message", "message", 11280, 1600, msgData("Thanks for the feedback. I have saved your rating and comment."));
node("positive_feedback_end", "end", 11520, 1600, { messages: [] });
node("feedback_complaint_priority", "script", 11280, 1800, scriptData(complaintPriorityScript, "feedback_complaint_priority_result"));
node("feedback_complaint_record", "record", 11520, 1800, recordData({
  action: "upsert",
  collection: "service_complaints",
  where: { complaint_id: "{{selected_booking_id}}:feedback" },
  data: {
    complaint_id: "{{selected_booking_id}}:feedback",
    booking_id: "{{selected_booking_id}}",
    customer_id: "{{customer_id}}",
    category: "poor_feedback",
    priority: "{{complaint_priority}}",
    description: "{{feedback_comment}}",
    status: "open",
    created_at: "{{demo_today}}"
  },
  schema: schemas.complaints,
  uniqueKey: "complaint_id",
  idempotencyKey: "{{selected_booking_id}}:feedback-complaint",
  outputVar: "feedback_complaint_record_result"
}));
node("feedback_complaint_handover", "handover", 11760, 1800, handoverData("Low-rated completed booking requires customer care follow-up."));

node("complaint_form", "form", 10080, 2060, formData("Tell me what went wrong so I can create the complaint case.", complaintFields, "complaint_form_result"));
node("complaint_record", "record", 10320, 2060, recordData({
  action: "upsert",
  collection: "service_complaints",
  where: { complaint_id: "{{selected_booking_id}}:manual" },
  data: {
    complaint_id: "{{selected_booking_id}}:manual",
    booking_id: "{{selected_booking_id}}",
    customer_id: "{{customer_id}}",
    category: "{{complaint_category}}",
    priority: "high",
    description: "{{complaint_description}}",
    status: "open",
    created_at: "{{demo_today}}"
  },
  schema: schemas.complaints,
  uniqueKey: "complaint_id",
  idempotencyKey: "{{selected_booking_id}}:manual-complaint",
  outputVar: "complaint_record_result"
}));
node("complaint_handover", "handover", 10560, 2060, handoverData("Customer reported a service problem that requires a support follow-up."));
node("talk_team_handover", "handover", 720, 620, handoverData("Connecting the customer to the service operations team."));
node("lookup_customer_not_found_message", "message", 7920, 20, msgData("I could not find a customer profile for that mobile number, so I cannot show booking data."));
node("lookup_customer_not_found_end", "end", 8160, 20, { messages: [] });
node("system_failure_message", "message", 2160, 620, msgData("I could not complete that step because the operational record layer did not respond cleanly. I am forwarding the context to the service operations team so the request does not stall."));
node("system_failure_handover", "handover", 2400, 620, handoverData("Operational flow failure requires human review."));

edge("start_1", "welcome_message", { label: "next" });
edge("welcome_message", "main_menu_input", { label: "next" });
edgeValue("main_menu_input", "book_service", "discover_requirement_input", "book_service");
edgeValue("main_menu_input", "find_right_service", "discover_requirement_input", "find_right_service");
edgeValue("main_menu_input", "pricing", "discover_requirement_input", "pricing");
edgeValue("main_menu_input", "check_availability", "discover_requirement_input", "check_availability");
edgeValue("main_menu_input", "estimate", "discover_requirement_input", "estimate");
edgeValue("main_menu_input", "service_areas", "discover_requirement_input", "service_areas");
edgeValue("main_menu_input", "talk_to_team", "talk_team_handover", "talk_to_team");
edgeValue("main_menu_input", "my_bookings", "lookup_mode_prepare", "my_bookings");
edgeValue("main_menu_input", "reschedule_booking", "lookup_mode_prepare", "reschedule_booking");
edgeValue("main_menu_input", "cancel_booking", "lookup_mode_prepare", "cancel_booking");
edgeValue("main_menu_input", "payment_invoice", "lookup_mode_prepare", "payment_invoice");
edgeValue("main_menu_input", "track_service", "lookup_mode_prepare", "track_service");
edgeValue("main_menu_input", "rate_service", "lookup_mode_prepare", "rate_service");
edgeValue("main_menu_input", "report_problem", "lookup_mode_prepare", "report_problem");
edge("main_menu_input", "discover_requirement_input", { isDefault: true, label: "free_text/default" });

edge("discover_requirement_input", "parse_requirement", { label: "next" });
scriptRoutes("parse_requirement", "requirement_route_switch", "system_failure_message");
edgeValue("requirement_route_switch", "matched", "service_catalog_list", "matched");
edge("requirement_route_switch", "manual_category_input", { isDefault: true, label: "manual/default" });
edge("manual_category_input", "manual_category_set", { label: "next" });
edge("manual_category_set", "service_catalog_list", { label: "next" });
recordRoutes("service_catalog_list", "service_catalog_prepare", "system_failure_message", "service_catalog_prepare", "service_catalog_prepare");
scriptRoutes("service_catalog_prepare", "service_catalog_route_switch", "system_failure_message");
edgeValue("service_catalog_route_switch", "none", "no_service_match_message", "none");
edgeValue("service_catalog_route_switch", "single", "selected_service_message", "single");
edge("service_catalog_route_switch", "service_catalog_message", { isDefault: true, label: "multiple/default" });
edge("no_service_match_message", "no_service_match_end", { label: "next" });
edge("service_catalog_message", "service_selection_form", { label: "next" });
edge("service_selection_form", "select_service", { label: "next" });
scriptRoutes("select_service", "selected_service_message", "system_failure_message");
edgeValue("select_service", "not_found", "service_selection_not_found_message", "not_found");
edge("service_selection_not_found_message", "service_selection_not_found_end", { label: "next" });

edge("selected_service_message", "prepare_request_ids", { label: "next" });
edge("prepare_request_ids", "booking_identity_mode_set", { label: "next" });
edge("booking_identity_mode_set", "customer_mobile_form", { label: "next" });
edge("customer_mobile_form", "normalize_customer_mobile", { label: "next" });
scriptRoutes("normalize_customer_mobile", "customer_otp_input_1", "system_failure_message");
edge("customer_otp_input_1", "validate_customer_otp_1", { label: "next" });
scriptRoutes("validate_customer_otp_1", "customer_otp_route_1", "system_failure_message");
edgeValue("customer_otp_route_1", "valid", "customer_lookup", "valid");
edge("customer_otp_route_1", "customer_otp_invalid_1", { isDefault: true, label: "invalid/default" });
edge("customer_otp_invalid_1", "customer_otp_input_2", { label: "retry" });
edge("customer_otp_input_2", "validate_customer_otp_2", { label: "next" });
scriptRoutes("validate_customer_otp_2", "customer_otp_route_2", "system_failure_message");
edgeValue("customer_otp_route_2", "valid", "customer_lookup", "valid");
edge("customer_otp_route_2", "customer_otp_invalid_2", { isDefault: true, label: "invalid/default" });
edge("customer_otp_invalid_2", "customer_otp_input_3", { label: "retry" });
edge("customer_otp_input_3", "validate_customer_otp_3", { label: "next" });
scriptRoutes("validate_customer_otp_3", "customer_otp_route_3", "system_failure_message");
edgeValue("customer_otp_route_3", "valid", "customer_lookup", "valid");
edge("customer_otp_route_3", "customer_otp_failed_message", { isDefault: true, label: "invalid/default" });
edge("customer_otp_failed_message", "customer_otp_failed_end", { label: "next" });

edge("lookup_mode_prepare", "lookup_mobile_form", { label: "next" });
edge("lookup_mobile_form", "lookup_normalize_mobile", { label: "next" });
scriptRoutes("lookup_normalize_mobile", "lookup_otp_input_1", "system_failure_message");
edge("lookup_otp_input_1", "validate_customer_otp_1", { label: "next" });

edgeValue("customer_lookup", "success", "hydrate_customer", "success");
edgeValue("customer_lookup", "duplicate", "hydrate_customer", "duplicate");
edgeValue("customer_lookup", "not_found", "customer_not_found_route", "not_found");
edge("customer_lookup", "system_failure_message", { isDefault: true, label: "validation_failed/failed/default" });
scriptRoutes("hydrate_customer", "identity_route_switch", "system_failure_message");
scriptRoutes("customer_not_found_route", "customer_not_found_switch", "system_failure_message");
edgeValue("customer_not_found_switch", "booking", "new_customer_form", "booking");
edge("customer_not_found_switch", "lookup_customer_not_found_message", { isDefault: true, label: "lookup/default" });
edge("lookup_customer_not_found_message", "lookup_customer_not_found_end", { label: "next" });

edgeValue("identity_route_switch", "booking", "returning_customer_message", "booking");
edge("identity_route_switch", "customer_booking_list", { isDefault: true, label: "lookup/default" });

edge("new_customer_form", "prepare_new_customer", { label: "next" });
edge("prepare_new_customer", "customer_upsert", { label: "next" });
recordRoutes("customer_upsert", "location_required_switch", "system_failure_message");

edge("returning_customer_message", "saved_address_lookup", { label: "next" });
recordRoutes("saved_address_lookup", "saved_address_prepare", "system_failure_message", "saved_address_prepare", "saved_address_prepare");
scriptRoutes("saved_address_prepare", "saved_address_switch", "system_failure_message");
edgeValue("saved_address_switch", "saved", "saved_address_message", "saved");
edge("saved_address_switch", "no_saved_address_message", { isDefault: true, label: "none/default" });
edge("saved_address_message", "saved_address_use_input", { label: "next" });
edgeValue("saved_address_use_input", "yes", "set_saved_address_mode", "yes");
edge("saved_address_use_input", "set_new_address_mode", { isDefault: true, label: "no/default" });
edge("set_saved_address_mode", "location_required_switch", { label: "next" });
edge("set_new_address_mode", "location_required_switch", { label: "next" });
edge("no_saved_address_message", "location_required_switch", { label: "next" });

edgeValue("location_required_switch", "no", "service_request_draft", "no");
edge("location_required_switch", "address_mode_switch", { isDefault: true, label: "yes/default" });
edgeValue("address_mode_switch", "saved", "serviceability_lookup", "saved");
edge("address_mode_switch", "address_form", { isDefault: true, label: "new/default" });
edge("address_form", "serviceability_lookup", { label: "next" });
edgeValue("serviceability_lookup", "success", "serviceability_prepare", "success");
edgeValue("serviceability_lookup", "duplicate", "serviceability_prepare", "duplicate");
edgeValue("serviceability_lookup", "not_found", "not_serviceable_message", "not_found");
edge("serviceability_lookup", "system_failure_message", { isDefault: true, label: "validation_failed/failed/default" });
scriptRoutes("serviceability_prepare", "serviceability_success_switch", "system_failure_message");
edgeValue("serviceability_success_switch", "saved", "service_request_draft", "saved");
edge("serviceability_success_switch", "address_upsert", { isDefault: true, label: "new/default" });
edge("address_upsert", "set_new_address_id", { label: "next" });
edge("set_new_address_id", "service_request_draft", { label: "next" });
edge("not_serviceable_message", "notify_interest_form", { label: "next" });
edge("notify_interest_form", "notify_interest_record", { label: "next" });
recordRoutes("notify_interest_record", "not_serviceable_end", "system_failure_message");

recordRoutes("service_request_draft", "media_route_prepare", "system_failure_message");
scriptRoutes("media_route_prepare", "media_route_switch", "system_failure_message");
edgeValue("media_route_switch", "required", "service_media_intake", "required");
edgeValue("media_route_switch", "optional", "optional_media_input", "optional");
edge("media_route_switch", "service_question_list", { isDefault: true, label: "skip/default" });
edgeValue("optional_media_input", "yes", "service_media_intake", "yes");
edge("optional_media_input", "service_question_list", { isDefault: true, label: "no/default" });
edge("service_media_intake", "service_media_processor", { label: "next" });
edge("service_media_processor", "service_media_analysis_prepare", { label: "success/default" });
scriptRoutes("service_media_analysis_prepare", "service_media_record", "system_failure_message");
recordRoutes("service_media_record", "service_question_list", "system_failure_message");
recordRoutes("service_question_list", "service_question_prepare", "system_failure_message", "service_question_prepare", "service_question_prepare");
scriptRoutes("service_question_prepare", "service_question_message", "system_failure_message");
edge("service_question_message", "service_details_form", { label: "next" });
edge("service_details_form", "pricing_prepare", { label: "next" });
scriptRoutes("pricing_prepare", "service_summary_message", "system_failure_message");
edge("service_summary_message", "availability_slots_list", { label: "next" });
recordRoutes("availability_slots_list", "slot_inventory_switch", "system_failure_message", "slot_inventory_switch", "slot_inventory_switch");
edgeValue("slot_inventory_switch", "not_found", "no_slots_message", "not_found");
edge("slot_inventory_switch", "slot_booking", { isDefault: true, label: "success/default" });
edge("no_slots_message", "no_slots_end", { label: "next" });
edge("slot_booking", "prepare_slot_hold", { label: "selected" });
edge("prepare_slot_hold", "slot_hold_expiry_prepare", { label: "next" });
scriptRoutes("slot_hold_expiry_prepare", "slot_hold_update", "system_failure_message");
edgeValue("slot_hold_update", "success", "slot_hold_record", "success");
edgeValue("slot_hold_update", "duplicate", "slot_conflict_message", "duplicate");
edgeValue("slot_hold_update", "not_found", "slot_conflict_message", "not_found");
edge("slot_hold_update", "slot_conflict_message", { isDefault: true, label: "validation_failed/failed/default" });
edge("slot_conflict_message", "slot_conflict_end", { label: "next" });
recordRoutes("slot_hold_record", "booking_review_message", "system_failure_message");
edge("booking_review_message", "payment_route_switch", { label: "next" });
edgeValue("payment_route_switch", "payment_required", "booking_payment", "payment_required");
edge("payment_route_switch", "prepare_booking_commit", { isDefault: true, label: "skip/default" });
edgeValue("booking_payment", "paid", "prepare_booking_commit", "paid");
edge("booking_payment", "payment_retry_message", { isDefault: true, label: "failed/default" });
edge("payment_retry_message", "booking_payment_retry", { label: "retry" });
edgeValue("booking_payment_retry", "paid", "prepare_booking_commit", "paid");
edge("booking_payment_retry", "release_payment_failure_message", { isDefault: true, label: "failed/default" });
edge("release_payment_failure_message", "release_slot_after_payment_failure", { label: "next" });
recordRoutes("release_slot_after_payment_failure", "release_hold_after_payment_failure", "system_failure_message");
recordRoutes("release_hold_after_payment_failure", "payment_failed_end", "system_failure_message");
scriptRoutes("prepare_booking_commit", "booking_record", "system_failure_message");
recordRoutes("booking_record", "service_request_confirmed", "system_failure_message");
recordRoutes("service_request_confirmed", "slot_book_update", "system_failure_message");
recordRoutes("slot_book_update", "hold_convert_record", "system_failure_message");
recordRoutes("hold_convert_record", "payment_record_switch", "system_failure_message");
edgeValue("payment_record_switch", "create_payment", "payment_record", "create_payment");
edge("payment_record_switch", "assignment_candidates", { isDefault: true, label: "skip/default" });
recordRoutes("payment_record", "assignment_candidates", "system_failure_message");
recordRoutes("assignment_candidates", "assignment_prepare", "system_failure_message", "assignment_prepare", "assignment_prepare");
scriptRoutes("assignment_prepare", "assignment_route_switch", "system_failure_message");
edgeValue("assignment_route_switch", "assigned", "assignment_record", "assigned");
edge("assignment_route_switch", "assignment_unavailable_message", { isDefault: true, label: "unavailable/default" });
edge("assignment_unavailable_message", "assignment_unavailable_handover", { label: "next" });
recordRoutes("assignment_record", "booking_assignment_update", "system_failure_message");
recordRoutes("booking_assignment_update", "assignment_status_event", "system_failure_message");
recordRoutes("assignment_status_event", "buyer_confirmation_notification", "system_failure_message");
notificationRoutes("buyer_confirmation_notification", "reminder_24h");
schedulerRoutes("reminder_24h", "reminder_record_24h");
recordRoutes("reminder_record_24h", "reminder_2h", "system_failure_message");
schedulerRoutes("reminder_2h", "reminder_record_2h");
recordRoutes("reminder_record_2h", "booking_confirmed_message", "system_failure_message");
edge("booking_confirmed_message", "booking_end", { label: "next" });

recordRoutes("customer_booking_list", "booking_filter_prepare", "system_failure_message", "booking_filter_prepare", "booking_filter_prepare");
scriptRoutes("booking_filter_prepare", "booking_selection_switch", "system_failure_message");
edgeValue("booking_selection_switch", "none", "lookup_no_booking_message", "none");
edgeValue("booking_selection_switch", "single", "selected_booking_message", "single");
edge("booking_selection_switch", "booking_selection_message", { isDefault: true, label: "multiple/default" });
edge("lookup_no_booking_message", "lookup_no_booking_end", { label: "next" });
edge("booking_selection_message", "booking_selection_form", { label: "next" });
edge("booking_selection_form", "select_booking", { label: "next" });
scriptRoutes("select_booking", "select_booking_route_switch", "system_failure_message");
edgeValue("select_booking_route_switch", "success", "selected_booking_message", "success");
edge("select_booking_route_switch", "select_booking_not_found_message", { isDefault: true, label: "not_found/default" });
edge("select_booking_not_found_message", "select_booking_not_found_end", { label: "next" });
edge("selected_booking_message", "post_booking_route_switch", { label: "next" });
edgeValue("post_booking_route_switch", "my_bookings", "my_booking_overview_message", "my_bookings");
edgeValue("post_booking_route_switch", "track_service", "selected_booking_status_events", "track_service");
edgeValue("post_booking_route_switch", "reschedule_booking", "reschedule_slots_list", "reschedule_booking");
edgeValue("post_booking_route_switch", "cancel_booking", "cancel_confirm_input", "cancel_booking");
edgeValue("post_booking_route_switch", "payment_invoice", "selected_booking_invoice", "payment_invoice");
edgeValue("post_booking_route_switch", "rate_service", "feedback_rating_input", "rate_service");
edgeValue("post_booking_route_switch", "report_problem", "complaint_form", "report_problem");
edge("post_booking_route_switch", "my_booking_overview_message", { isDefault: true, label: "default" });
edge("my_booking_overview_message", "my_booking_overview_end", { label: "next" });
recordRoutes("selected_booking_status_events", "status_summary_prepare", "system_failure_message", "status_summary_prepare", "status_summary_prepare");
scriptRoutes("status_summary_prepare", "status_message", "system_failure_message");
edge("status_message", "status_end", { label: "next" });

recordRoutes("reschedule_slots_list", "reschedule_slot_switch", "system_failure_message", "reschedule_slot_switch", "reschedule_slot_switch");
edgeValue("reschedule_slot_switch", "not_found", "reschedule_no_slots_message", "not_found");
edge("reschedule_slot_switch", "reschedule_slot_booking", { isDefault: true, label: "success/default" });
edge("reschedule_no_slots_message", "reschedule_no_slots_end", { label: "next" });
edge("reschedule_slot_booking", "reschedule_prepare_hold", { label: "selected" });
edge("reschedule_prepare_hold", "reschedule_hold_expiry_prepare", { label: "next" });
scriptRoutes("reschedule_hold_expiry_prepare", "reschedule_slot_hold_update", "system_failure_message");
recordRoutes("reschedule_slot_hold_update", "reschedule_review_input", "system_failure_message");
edgeValue("reschedule_review_input", "yes", "reschedule_booking_update", "yes");
edge("reschedule_review_input", "reschedule_release_new_slot", { isDefault: true, label: "no/default" });
recordRoutes("reschedule_release_new_slot", "reschedule_release_hold", "system_failure_message");
recordRoutes("reschedule_release_hold", "reschedule_cancelled_end", "system_failure_message");
recordRoutes("reschedule_booking_update", "reschedule_new_slot_book", "system_failure_message");
recordRoutes("reschedule_new_slot_book", "reschedule_old_slot_release", "system_failure_message");
recordRoutes("reschedule_old_slot_release", "reschedule_hold_convert", "system_failure_message");
recordRoutes("reschedule_hold_convert", "reschedule_notification", "system_failure_message");
notificationRoutes("reschedule_notification", "reschedule_complete_message");
edge("reschedule_complete_message", "reschedule_end", { label: "next" });

edgeValue("cancel_confirm_input", "yes", "cancel_booking_update", "yes");
edge("cancel_confirm_input", "cancel_abort_message", { isDefault: true, label: "no/default" });
edge("cancel_abort_message", "cancel_abort_end", { label: "next" });
recordRoutes("cancel_booking_update", "cancel_slot_release", "system_failure_message");
recordRoutes("cancel_slot_release", "cancel_notification", "system_failure_message");
notificationRoutes("cancel_notification", "cancel_complete_message");
edge("cancel_complete_message", "cancel_end", { label: "next" });

recordRoutes("selected_booking_invoice", "invoice_balance_prepare", "system_failure_message", "invoice_balance_prepare", "invoice_balance_prepare");
scriptRoutes("invoice_balance_prepare", "invoice_summary_message", "system_failure_message");
edge("invoice_summary_message", "invoice_balance_switch", { label: "next" });
edgeValue("invoice_balance_switch", "no_balance", "invoice_no_balance_end", "no_balance");
edge("invoice_balance_switch", "balance_payment_input", { isDefault: true, label: "collect_balance/default" });
edgeValue("balance_payment_input", "yes", "balance_payment", "yes");
edge("balance_payment_input", "balance_declined_end", { isDefault: true, label: "no/default" });
edgeValue("balance_payment", "paid", "balance_payment_record", "paid");
edge("balance_payment", "balance_declined_end", { isDefault: true, label: "failed/default" });
recordRoutes("balance_payment_record", "invoice_paid_update", "system_failure_message");
recordRoutes("invoice_paid_update", "booking_paid_update", "system_failure_message");
recordRoutes("booking_paid_update", "balance_paid_message", "system_failure_message");
edge("balance_paid_message", "balance_paid_end", { label: "next" });

edge("feedback_rating_input", "feedback_comment_form", { label: "next" });
edge("feedback_comment_form", "feedback_route_prepare", { label: "next" });
scriptRoutes("feedback_route_prepare", "feedback_record", "system_failure_message");
recordRoutes("feedback_record", "feedback_route_switch", "system_failure_message");
edgeValue("feedback_route_switch", "positive", "positive_feedback_message", "positive");
edge("feedback_route_switch", "feedback_complaint_priority", { isDefault: true, label: "complaint/default" });
edge("positive_feedback_message", "positive_feedback_end", { label: "next" });
scriptRoutes("feedback_complaint_priority", "feedback_complaint_record", "system_failure_message");
recordRoutes("feedback_complaint_record", "feedback_complaint_handover", "system_failure_message");

edge("complaint_form", "complaint_record", { label: "next" });
recordRoutes("complaint_record", "complaint_handover", "system_failure_message");

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
