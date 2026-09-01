import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { notificationData } from "./notification-data.mjs";

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const domainRoot = join(rootDir, "domains", "automobile");
const sourcePath = join(
  domainRoot,
  "templates-source",
  "automobile-customer-lifecycle-assistant.source.flow.json"
);
const builtPath = join(
  domainRoot,
  "templates",
  "automobile-customer-lifecycle-assistant.flow.json"
);
const stablePath = join(
  domainRoot,
  "templates-stable",
  "automobile-customer-lifecycle-assistant.flow.json"
);

const exportDoc = {
  version: "1.0",
  exportedAt: "2026-08-25T00:00:00.000Z",
  bot: {
    name: "Automobile Customer Lifecycle Assistant",
    description:
      "Automation-first automobile assistant covering vehicle discovery, comparison, pricing, brochures, qualified lead capture, test-drive booking, finance and exchange capture, service booking, service status, estimates, payments, and exception-only escalation.",
    headerTitle: "Automobile Customer Lifecycle Assistant",
    headerTagline: "Vehicle discovery, test-drive conversion, and service automation",
    globalVariables: [
      { key: "dealership_name", value: "Crescora Auto" },
      { key: "brand_name", value: "Crescora.ai" },
      { key: "default_currency", value: "INR" },
      { key: "default_timezone", value: "Asia/Kolkata" },
      { key: "payment_provider", value: "razorpay" },
      { key: "payment_link", value: "https://auto.example.com/pay" },
      { key: "sales_support_phone", value: "+91-90000-51000" },
      { key: "service_support_phone", value: "+91-90000-52000" },
      { key: "roadside_support_phone", value: "+91-90000-53000" },
      { key: "brochure_desk_email", value: "brochures@crescora-auto.example" }
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
const DOMAIN_RECORD_SCHEMA = "automobile";

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
    collectionSchema: pretty(schema),
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

function paymentData({ amount, description, outputVar }) {
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
    customerName: "{{customer_name}}",
    customerEmail: "{{customer_email}}",
    customerContact: "{{customer_phone_e164}}",
    notifySms: true,
    notifyEmail: true,
    expireMinutes: 10,
    callbackUrl: "",
    notesJson: pretty({
      session_id: "{{system.sessionId}}",
      journey_mode: "{{service_journey_mode}}",
      entity_id: "{{selected_service_order_id}}"
    }),
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

function dynamicCarouselData(introText, slidesSource, slideTemplate) {
  return {
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
    slideTemplateJson: pretty(slideTemplate)
  };
}

function appointmentData(message, dynamicSlotsVar, outputVar, overrides = {}) {
  return {
    slots: [],
    slotsJson: "[]",
    messages: [message],
    slotMode: "dynamic",
    timezone: "{{default_timezone}}",
    outputVar,
    dateVar: "selected_date",
    horizonDays: 14,
    maxSlotsPerDay: 8,
    dynamicSlotsVar,
    dynamicSlotsPath: "",
    slotDurationMins: 30,
    slotIntervalMins: 30,
    availableWeekdays: "0,1,2,3,4,5,6",
    workingHoursStart: "09:00",
    workingHoursEnd: "19:00",
    ...overrides
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

function yesNoButtons() {
  return [
    { label: "Yes", value: "yes" },
    { label: "No", value: "no" }
  ];
}

const schemas = {
  customers: {
    collection: "automobile_customers",
    fields: {
      customer_id: { type: "string", required: true, unique: true },
      full_name: { type: "string", required: true },
      phone_e164: { type: "phone", required: true, unique: true },
      email: { type: "email", required: false },
      city: { type: "string", required: false },
      preferred_language: { type: "string", required: false },
      last_sales_lead_id: { type: "string", required: false },
      last_vehicle_id: { type: "string", required: false }
    }
  },
  locations: {
    collection: "dealership_locations",
    fields: {
      location_id: { type: "string", required: true, unique: true },
      location_name: { type: "string", required: true },
      location_type: { type: "string", required: true },
      city: { type: "string", required: true },
      support_home_test_drive: { type: "boolean", required: true },
      active: { type: "boolean", required: true },
      coverage_pincodes: { type: "string", required: false },
      maps_url: { type: "url", required: false }
    }
  },
  vehicleVariants: {
    collection: "vehicle_variants",
    fields: {
      variant_id: { type: "string", required: true, unique: true },
      model_code: { type: "string", required: true },
      model_name: { type: "string", required: true },
      variant_name: { type: "string", required: true },
      body_type: { type: "string", required: true },
      fuel_type: { type: "string", required: true },
      transmission: { type: "string", required: true },
      ex_showroom_price: { type: "number", required: true },
      seating_capacity: { type: "number", required: false },
      claimed_mileage: { type: "string", required: false },
      adas_level: { type: "string", required: false },
      feature_summary: { type: "string", required: false },
      brochure_url: { type: "url", required: false },
      colors_summary: { type: "string", required: false },
      inventory_status: { type: "string", required: true },
      active: { type: "boolean", required: true },
      campaign_priority: { type: "number", required: false },
      usage_fit_tags: { type: "string", required: false }
    }
  },
  vehicleOffers: {
    collection: "vehicle_offers",
    fields: {
      offer_id: { type: "string", required: true, unique: true },
      variant_id: { type: "string", required: true },
      city: { type: "string", required: true },
      offer_title: { type: "string", required: true },
      discount_amount: { type: "number", required: true },
      exchange_bonus: { type: "number", required: true },
      corporate_benefit: { type: "number", required: true },
      insurance_estimate: { type: "number", required: true },
      rto_estimate: { type: "number", required: true },
      active: { type: "boolean", required: true }
    }
  },
  staff: {
    collection: "dealership_staff",
    fields: {
      staff_id: { type: "string", required: true, unique: true },
      role: { type: "string", required: true },
      full_name: { type: "string", required: true },
      phone_e164: { type: "phone", required: true },
      email: { type: "email", required: false },
      language: { type: "string", required: false },
      location_id: { type: "string", required: true },
      specialty_tags: { type: "string", required: false },
      active: { type: "boolean", required: true },
      active_leads: { type: "number", required: false }
    }
  },
  leads: {
    collection: "automobile_leads",
    fields: {
      lead_id: { type: "string", required: true, unique: true },
      customer_id: { type: "string", required: false },
      source_channel: { type: "string", required: true },
      status: { type: "string", required: true },
      stage: { type: "string", required: true },
      requirement_summary: { type: "string", required: false },
      body_type: { type: "string", required: false },
      budget_max: { type: "number", required: false },
      fuel_preference: { type: "string", required: false },
      transmission_preference: { type: "string", required: false },
      usage_type: { type: "string", required: false },
      purchase_timeline: { type: "string", required: false },
      finance_interest: { type: "string", required: false },
      exchange_interest: { type: "string", required: false },
      lead_score: { type: "number", required: false },
      lead_temperature: { type: "string", required: false },
      selected_variant_id: { type: "string", required: false },
      selected_variant_name: { type: "string", required: false },
      assigned_salesperson_id: { type: "string", required: false },
      last_activity_at: { type: "string", required: false }
    }
  },
  leadAssignments: {
    collection: "automobile_lead_assignments",
    fields: {
      assignment_id: { type: "string", required: true, unique: true },
      lead_id: { type: "string", required: true },
      salesperson_id: { type: "string", required: true },
      assignment_reason: { type: "string", required: false },
      assigned_at: { type: "string", required: false }
    }
  },
  leadActivities: {
    collection: "automobile_lead_activities",
    fields: {
      activity_id: { type: "string", required: true, unique: true },
      lead_id: { type: "string", required: true },
      customer_id: { type: "string", required: false },
      variant_id: { type: "string", required: false },
      activity_type: { type: "string", required: true },
      summary: { type: "string", required: false },
      occurred_at: { type: "string", required: false }
    }
  },
  testDriveVehicles: {
    collection: "test_drive_vehicles",
    fields: {
      test_drive_vehicle_id: { type: "string", required: true, unique: true },
      variant_id: { type: "string", required: true },
      location_id: { type: "string", required: true },
      registration_number: { type: "string", required: true },
      status: { type: "string", required: true },
      active: { type: "boolean", required: true }
    }
  },
  testDriveSlots: {
    collection: "test_drive_slots",
    fields: {
      slot_id: { type: "string", required: true, unique: true },
      location_id: { type: "string", required: true },
      variant_id: { type: "string", required: true },
      test_drive_vehicle_id: { type: "string", required: true },
      date: { type: "string", required: true },
      start: { type: "string", required: true },
      end: { type: "string", required: true },
      label: { type: "string", required: true },
      status: { type: "string", required: true },
      hold_id: { type: "string", required: false },
      held_by_session: { type: "string", required: false },
      hold_expires_at: { type: "string", required: false },
      booking_id: { type: "string", required: false }
    }
  },
  testDriveBookings: {
    collection: "test_drive_bookings",
    fields: {
      booking_id: { type: "string", required: true, unique: true },
      booking_number: { type: "string", required: true, unique: true },
      customer_id: { type: "string", required: true },
      lead_id: { type: "string", required: false },
      location_id: { type: "string", required: true },
      variant_id: { type: "string", required: true },
      variant_name: { type: "string", required: true },
      slot_id: { type: "string", required: true },
      booking_mode: { type: "string", required: true },
      scheduled_date: { type: "string", required: true },
      scheduled_time: { type: "string", required: true },
      scheduled_at: { type: "string", required: true },
      status: { type: "string", required: true },
      salesperson_id: { type: "string", required: false },
      address_summary: { type: "string", required: false }
    }
  },
  financeRequests: {
    collection: "finance_requests",
    fields: {
      finance_id: { type: "string", required: true, unique: true },
      lead_id: { type: "string", required: true },
      customer_id: { type: "string", required: false },
      variant_id: { type: "string", required: true },
      on_road_price: { type: "number", required: true },
      down_payment: { type: "number", required: true },
      loan_amount: { type: "number", required: true },
      tenure_months: { type: "number", required: true },
      indicative_emi: { type: "number", required: true },
      status: { type: "string", required: true }
    }
  },
  exchangeRequests: {
    collection: "exchange_requests",
    fields: {
      exchange_id: { type: "string", required: true, unique: true },
      lead_id: { type: "string", required: true },
      customer_id: { type: "string", required: false },
      make: { type: "string", required: true },
      model: { type: "string", required: true },
      registration_year: { type: "number", required: true },
      fuel: { type: "string", required: true },
      transmission: { type: "string", required: true },
      kilometers: { type: "number", required: true },
      condition_summary: { type: "string", required: false },
      expected_value: { type: "number", required: false },
      status: { type: "string", required: true }
    }
  },
  customerVehicles: {
    collection: "customer_vehicles",
    fields: {
      vehicle_id: { type: "string", required: true, unique: true },
      customer_id: { type: "string", required: true },
      variant_id: { type: "string", required: false },
      model_name: { type: "string", required: true },
      registration_number: { type: "string", required: true, unique: true },
      manufacturing_year: { type: "number", required: false },
      status: { type: "string", required: true },
      odometer_km: { type: "number", required: false }
    }
  },
  serviceSlots: {
    collection: "service_slots",
    fields: {
      slot_id: { type: "string", required: true, unique: true },
      service_center_id: { type: "string", required: true },
      service_category: { type: "string", required: true },
      date: { type: "string", required: true },
      start: { type: "string", required: true },
      end: { type: "string", required: true },
      label: { type: "string", required: true },
      capacity: { type: "number", required: true },
      remaining_capacity: { type: "number", required: true },
      status: { type: "string", required: true },
      hold_id: { type: "string", required: false },
      held_by_session: { type: "string", required: false },
      hold_expires_at: { type: "string", required: false },
      booking_id: { type: "string", required: false }
    }
  },
  serviceBookings: {
    collection: "service_bookings",
    fields: {
      booking_id: { type: "string", required: true, unique: true },
      booking_number: { type: "string", required: true, unique: true },
      customer_id: { type: "string", required: true },
      vehicle_id: { type: "string", required: true },
      service_center_id: { type: "string", required: true },
      slot_id: { type: "string", required: true },
      service_type: { type: "string", required: true },
      pickup_type: { type: "string", required: true },
      scheduled_date: { type: "string", required: true },
      scheduled_time: { type: "string", required: true },
      status: { type: "string", required: true },
      advisor_id: { type: "string", required: false },
      pickup_address: { type: "string", required: false }
    }
  },
  serviceOrders: {
    collection: "service_orders",
    fields: {
      service_order_id: { type: "string", required: true, unique: true },
      service_booking_id: { type: "string", required: false },
      customer_id: { type: "string", required: true },
      vehicle_id: { type: "string", required: true },
      service_center_id: { type: "string", required: true },
      advisor_id: { type: "string", required: false },
      status: { type: "string", required: true },
      current_stage: { type: "string", required: true },
      payment_status: { type: "string", required: true },
      total_amount: { type: "number", required: false },
      timeline_summary: { type: "string", required: false },
      estimated_completion_at: { type: "string", required: false }
    }
  },
  serviceEstimates: {
    collection: "service_estimates",
    fields: {
      estimate_id: { type: "string", required: true, unique: true },
      service_order_id: { type: "string", required: true },
      version: { type: "number", required: true },
      total_amount: { type: "number", required: true },
      line_items_summary: { type: "string", required: false },
      status: { type: "string", required: true }
    }
  },
  servicePayments: {
    collection: "service_payments",
    fields: {
      payment_id: { type: "string", required: true, unique: true },
      service_order_id: { type: "string", required: true },
      customer_id: { type: "string", required: true },
      amount: { type: "number", required: true },
      currency: { type: "string", required: true },
      status: { type: "string", required: true },
      provider_reference: { type: "string", required: false }
    }
  }
};

const customerFields = [
  { key: "customer_name", label: "Full name", type: "text", required: true },
  { key: "customer_email", label: "Email", type: "email", required: false },
  { key: "customer_city", label: "City", type: "text", required: true }
];

const financeFields = [
  { key: "down_payment", label: "Down payment", type: "number", required: true },
  {
    key: "loan_tenure_months",
    label: "Loan tenure in months",
    type: "number",
    required: true
  }
];

const exchangeFields = [
  { key: "exchange_make", label: "Current vehicle make", type: "text", required: true },
  { key: "exchange_model", label: "Current vehicle model", type: "text", required: true },
  {
    key: "exchange_registration_year",
    label: "Registration year",
    type: "number",
    required: true
  },
  { key: "exchange_fuel", label: "Fuel type", type: "text", required: true },
  { key: "exchange_transmission", label: "Transmission", type: "text", required: true },
  {
    key: "exchange_kilometers",
    label: "Kilometers driven",
    type: "number",
    required: true
  },
  {
    key: "exchange_condition_summary",
    label: "Condition summary",
    type: "text",
    required: true
  },
  {
    key: "exchange_expected_value",
    label: "Expected value",
    type: "number",
    required: false
  }
];

const serviceGuestFields = [
  { key: "customer_name", label: "Owner name", type: "text", required: true },
  { key: "customer_email", label: "Email", type: "email", required: false },
  { key: "customer_city", label: "City", type: "text", required: true },
  {
    key: "service_vehicle_registration_number",
    label: "Registration number",
    type: "text",
    required: true
  },
  {
    key: "service_vehicle_model_name",
    label: "Vehicle model",
    type: "text",
    required: true
  }
];

const homeTestDriveFields = [
  { key: "home_test_drive_address", label: "Address", type: "text", required: true },
  { key: "home_test_drive_pincode", label: "Pincode", type: "text", required: true },
  { key: "home_test_drive_landmark", label: "Landmark", type: "text", required: false }
];

const roadsideFields = [
  { key: "rsa_customer_name", label: "Your name", type: "text", required: true },
  { key: "rsa_phone_e164", label: "Mobile number", type: "phone", required: true },
  {
    key: "rsa_registration_number",
    label: "Vehicle registration number",
    type: "text",
    required: true
  },
  { key: "rsa_location", label: "Current location", type: "text", required: true },
  { key: "rsa_issue_type", label: "Breakdown type", type: "text", required: true }
];

const talkAdvisorFields = [
  { key: "advisor_request_name", label: "Your name", type: "text", required: true },
  { key: "advisor_request_phone", label: "Mobile number", type: "phone", required: true },
  { key: "advisor_request_topic", label: "What do you need help with?", type: "text", required: true }
];

const parseVehicleRequirementScript = `
function normalize(value) {
  return String(value || "").trim().toLowerCase();
}
const rawText = String(vars.vehicle_requirement_text || "").trim();
const lowered = rawText.toLowerCase();
function parseRupees(text) {
  const lakhRange = text.match(/(\\d+(?:\\.\\d+)?)\\s*(?:l|lac|lakh|lakhs)\\b/i);
  if (lakhRange) {
    return Math.round(Number(lakhRange[1]) * 100000);
  }
  const croreRange = text.match(/(\\d+(?:\\.\\d+)?)\\s*(?:cr|crore|crores)\\b/i);
  if (croreRange) {
    return Math.round(Number(croreRange[1]) * 10000000);
  }
  const rupeeRange = text.match(/(?:₹|rs\\.?|inr)\\s*(\\d{1,2}(?:,\\d{2,3})+|\\d{5,8})/i);
  if (rupeeRange) {
    return Number(String(rupeeRange[1]).replace(/,/g, ""));
  }
  return 0;
}
let bodyType = String(vars.body_type || "");
if (!bodyType) {
  if (/\\bsuv\\b/i.test(rawText)) bodyType = "SUV";
  else if (/\\bsedan\\b/i.test(rawText)) bodyType = "Sedan";
  else if (/\\bhatchback\\b/i.test(rawText)) bodyType = "Hatchback";
  else if (/\\bmpv\\b|\\bmuv\\b/i.test(rawText)) bodyType = "MPV";
  else if (/\\bev\\b|electric/i.test(rawText)) bodyType = "EV";
}
let fuel = String(vars.fuel_preference || "");
if (!fuel) {
  if (/hybrid/i.test(rawText)) fuel = "Hybrid";
  else if (/electric|\\bev\\b/i.test(rawText)) fuel = "EV";
  else if (/diesel/i.test(rawText)) fuel = "Diesel";
  else if (/cng/i.test(rawText)) fuel = "CNG";
  else if (/petrol/i.test(rawText)) fuel = "Petrol";
}
let transmission = String(vars.transmission_preference || "");
if (!transmission) {
  if (/automatic|cvt|dct|at\\b/i.test(rawText)) transmission = "Automatic";
  else if (/manual|mt\\b/i.test(rawText)) transmission = "Manual";
}
let usage = String(vars.usage_type || "");
if (!usage) {
  if (/highway/i.test(rawText)) usage = "Highway";
  else if (/family/i.test(rawText)) usage = "Family";
  else if (/city/i.test(rawText)) usage = "City";
  else if (/mix|mixed|daily/i.test(rawText)) usage = "Mixed";
}
let timeline = String(vars.purchase_timeline || "");
if (!timeline) {
  if (/this week|7 days/i.test(rawText)) timeline = "Within 7 Days";
  else if (/this month|30 days/i.test(rawText)) timeline = "Within 30 Days";
  else if (/3 month|quarter/i.test(rawText)) timeline = "1-3 Months";
}
const budgetMax = Number(vars.budget_max || 0) || parseRupees(rawText);
vars.body_type = bodyType;
vars.fuel_preference = fuel;
vars.transmission_preference = transmission;
vars.usage_type = usage;
vars.purchase_timeline = timeline;
vars.budget_max = budgetMax;
vars.requirement_summary =
  (bodyType ? bodyType + " " : "") +
  (fuel ? fuel + " " : "") +
  (transmission ? transmission + " " : "") +
  "vehicle" +
  (budgetMax ? " within ₹" + budgetMax.toLocaleString("en-IN") : "") +
  (usage ? " for " + usage.toLowerCase() + " use" : "");
vars.need_usage = usage ? "no" : "yes";
vars.need_fuel = fuel ? "no" : "yes";
vars.need_transmission = transmission ? "no" : "yes";
vars.need_budget = budgetMax > 0 ? "no" : "yes";
vars.need_timeline = timeline ? "no" : "yes";
return {
  parsed: "success",
  budget_max: vars.budget_max,
  requirement_summary: vars.requirement_summary
};
`;

const normalizeBudgetScript = `
const rawText = String(vars.vehicle_budget_text || "").trim();
let budget = 0;
const lakhMatch = rawText.match(/(\\d+(?:\\.\\d+)?)\\s*(?:l|lac|lakh|lakhs)/i);
const croreMatch = rawText.match(/(\\d+(?:\\.\\d+)?)\\s*(?:cr|crore|crores)/i);
if (lakhMatch) {
  budget = Math.round(Number(lakhMatch[1]) * 100000);
} else if (croreMatch) {
  budget = Math.round(Number(croreMatch[1]) * 10000000);
} else {
  budget = Number(rawText.replace(/[^0-9]/g, ""));
}
if (!budget || !Number.isFinite(budget)) {
  throw new Error("invalid vehicle budget input");
}
vars.budget_max = budget;
vars.need_budget = "no";
return { budget_max: vars.budget_max };
`;

const prepareLeadScript = `
function slug(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 16);
}
vars.lead_id = vars.lead_id || ("LD-AUTO-" + String(vars.system?.sessionId || "SESSION").replace(/[^A-Za-z0-9]/g, "").slice(-10).toUpperCase());
vars.finance_interest = vars.sales_goal === "finance_emi" ? "yes" : String(vars.finance_interest || "no");
vars.exchange_interest = vars.sales_goal === "exchange_my_car" ? "yes" : String(vars.exchange_interest || "no");
let score = 20;
if (Number(vars.budget_max || 0) > 0) score += 10;
if (String(vars.usage_type || "")) score += 5;
if (String(vars.fuel_preference || "")) score += 5;
if (String(vars.transmission_preference || "")) score += 5;
if (String(vars.purchase_timeline || "") === "Within 7 Days") score += 30;
else if (String(vars.purchase_timeline || "") === "Within 30 Days") score += 20;
else if (String(vars.purchase_timeline || "")) score += 10;
if (vars.finance_interest === "yes") score += 10;
if (vars.exchange_interest === "yes") score += 10;
vars.lead_score = score;
vars.lead_temperature = score >= 80 ? "hot" : score >= 50 ? "warm" : "nurture";
vars.lead_stage = "requirements_captured";
vars.lead_status = "open";
vars.lead_last_activity_at = new Date().toISOString();
vars.requirement_slug = slug(vars.requirement_summary || vars.vehicle_requirement_text || "lead");
return {
  lead_id: vars.lead_id,
  lead_score: vars.lead_score,
  lead_temperature: vars.lead_temperature
};
`;

const matchVehicleScript = `
function normalize(value) {
  return String(value || "").trim().toLowerCase();
}
function formatPrice(value) {
  const amount = Number(value || 0);
  return amount > 0 ? "₹" + amount.toLocaleString("en-IN") : "Price on request";
}
const requestedBody = normalize(vars.body_type);
const requestedFuel = normalize(vars.fuel_preference);
const requestedTransmission = normalize(vars.transmission_preference);
const requestedUsage = normalize(vars.usage_type);
const budgetMax = Number(vars.budget_max || 0);
const rows = Array.isArray(vars.variant_inventory_result?.data) ? vars.variant_inventory_result.data : [];
const exact = [];
const close = [];
for (const row of rows) {
  if (String(row.active ?? "true").toLowerCase() === "false") continue;
  const body = normalize(row.body_type);
  const fuel = normalize(row.fuel_type);
  const transmission = normalize(row.transmission);
  const usageTags = normalize(row.usage_fit_tags);
  const price = Number(row.ex_showroom_price || 0);
  let score = 0;
  const reasons = [];
  if (requestedBody && body === requestedBody) {
    score += 30;
    reasons.push("Requested body type");
  }
  if (requestedFuel && fuel === requestedFuel) {
    score += 15;
    reasons.push("Fuel preference");
  }
  if (requestedTransmission && transmission === requestedTransmission) {
    score += 15;
    reasons.push("Transmission preference");
  }
  if (requestedUsage && usageTags.includes(requestedUsage)) {
    score += 15;
    reasons.push("Good for " + requestedUsage + " driving");
  }
  if (budgetMax > 0 && price > 0) {
    if (price <= budgetMax) {
      score += 20;
      reasons.push("Within your budget");
    } else if (price <= Math.round(budgetMax * 1.12)) {
      score += 10;
      reasons.push("Slightly above budget");
    }
  }
  score += Number(row.campaign_priority || 0);
  const item = {
    id: String(row.variant_id || ""),
    variantId: String(row.variant_id || ""),
    variantCode: String(row.variant_id || ""),
    title: String(row.model_name || "Vehicle") + " - " + String(row.variant_name || ""),
    subtitle: formatPrice(row.ex_showroom_price) + " ex-showroom",
    body: String(row.body_type || ""),
    fuel: String(row.fuel_type || ""),
    transmission: String(row.transmission || ""),
    mileage: String(row.claimed_mileage || ""),
    adas: String(row.adas_level || "Not configured"),
    featureSummary: String(row.feature_summary || ""),
    brochureUrl: String(row.brochure_url || ""),
    price: Number(row.ex_showroom_price || 0),
    summary:
      "Why it fits: " +
      (reasons.length > 0 ? reasons.join(", ") : "A balanced match for the captured requirement."),
    tag: String(Math.min(score, 99)) + "% match",
    description:
      String(row.fuel_type || "") +
      " | " +
      String(row.transmission || "") +
      " | " +
      String(row.claimed_mileage || "") +
      "\\n" +
      String(row.feature_summary || ""),
    inventoryStatus: String(row.inventory_status || "")
  };
  if (score >= 65) exact.push(item);
  else if (score >= 40) close.push(item);
}
const shortlist = (exact.length > 0 ? exact : close).sort((a, b) => b.price - a.price).slice(0, 5);
vars.matched_vehicle_items = shortlist;
vars.vehicle_match_status = exact.length > 0 ? "exact" : shortlist.length > 0 ? "alternative" : "none";
vars.vehicle_selection_prompt = shortlist
  .map((item, index) => (index + 1) + ". " + item.title + " (" + item.tag + ")")
  .join("\\n");
return {
  match_status: vars.vehicle_match_status,
  match_count: shortlist.length
};
`;

const selectVariantScript = `
const choice = String(vars.selected_variant_choice || "").trim().toLowerCase();
const rows = Array.isArray(vars.matched_vehicle_items) ? vars.matched_vehicle_items : [];
let selected = null;
const index = Number(choice);
if (Number.isInteger(index) && index >= 1 && index <= rows.length) {
  selected = rows[index - 1];
} else {
  selected = rows.find((item) =>
    String(item.variantId || "").toLowerCase() === choice ||
    String(item.variantCode || "").toLowerCase() === choice ||
    String(item.title || "").toLowerCase().includes(choice)
  );
}
if (!selected) {
  vars.selected_variant_status = "invalid";
  return { selection_status: "invalid" };
}
vars.selected_variant_status = "selected";
vars.selected_variant_id = selected.variantId;
vars.selected_variant_name = selected.title;
vars.selected_variant_price = selected.price;
vars.selected_variant_brochure_url = selected.brochureUrl;
vars.selected_variant_fuel = selected.fuel;
vars.selected_variant_transmission = selected.transmission;
vars.selected_variant_mileage = selected.mileage;
vars.selected_variant_adas = selected.adas;
vars.selected_variant_features = selected.featureSummary;
vars.selected_variant_card =
  selected.title +
  "\\n\\n" +
  "Price: ₹" + Number(selected.price || 0).toLocaleString("en-IN") +
  " ex-showroom\\n" +
  "Fuel: " + selected.fuel + "\\n" +
  "Transmission: " + selected.transmission + "\\n" +
  "Mileage: " + selected.mileage + "\\n" +
  "ADAS: " + selected.adas + "\\n" +
  selected.featureSummary;
vars.compare_variant_prompt = rows
  .filter((item) => item.variantId !== selected.variantId)
  .map((item, index) => (index + 1) + ". " + item.title + " | ₹" + Number(item.price || 0).toLocaleString("en-IN"))
  .join("\\n");
return {
  selection_status: "selected",
  selected_variant_id: vars.selected_variant_id
};
`;

const selectCompareVariantScript = `
const choice = String(vars.compare_variant_choice || "").trim().toLowerCase();
const rows = Array.isArray(vars.matched_vehicle_items) ? vars.matched_vehicle_items.filter((item) => item.variantId !== vars.selected_variant_id) : [];
let selected = null;
const index = Number(choice);
if (Number.isInteger(index) && index >= 1 && index <= rows.length) {
  selected = rows[index - 1];
} else {
  selected = rows.find((item) =>
    String(item.variantId || "").toLowerCase() === choice ||
    String(item.title || "").toLowerCase().includes(choice)
  );
}
if (!selected) {
  vars.compare_variant_status = "invalid";
  return { compare_status: "invalid" };
}
vars.compare_variant_status = "selected";
vars.compare_variant_id = selected.variantId;
vars.compare_variant_name = selected.title;
vars.compare_variant_price = selected.price;
vars.compare_variant_fuel = selected.fuel;
vars.compare_variant_transmission = selected.transmission;
vars.compare_variant_mileage = selected.mileage;
vars.compare_variant_adas = selected.adas;
vars.compare_variant_features = selected.featureSummary;
vars.compare_summary =
  "Feature | " + vars.selected_variant_name + " | " + vars.compare_variant_name + "\\n" +
  "Price | ₹" + Number(vars.selected_variant_price || 0).toLocaleString("en-IN") + " | ₹" + Number(vars.compare_variant_price || 0).toLocaleString("en-IN") + "\\n" +
  "Fuel | " + vars.selected_variant_fuel + " | " + vars.compare_variant_fuel + "\\n" +
  "Transmission | " + vars.selected_variant_transmission + " | " + vars.compare_variant_transmission + "\\n" +
  "Mileage | " + vars.selected_variant_mileage + " | " + vars.compare_variant_mileage + "\\n" +
  "ADAS | " + vars.selected_variant_adas + " | " + vars.compare_variant_adas;
return { compare_status: "selected" };
`;

const priceCalculationScript = `
const city = String(vars.pricing_city || vars.customer_city || "Hyderabad").trim();
const rows = Array.isArray(vars.vehicle_offer_list_result?.data) ? vars.vehicle_offer_list_result.data : [];
const selected = rows.find((row) => String(row.variant_id || "") === String(vars.selected_variant_id || "") && String(row.city || "").toLowerCase() === city.toLowerCase()) ||
  rows.find((row) => String(row.variant_id || "") === String(vars.selected_variant_id || ""));
const exShowroom = Number(vars.selected_variant_price || 0);
const rto = Number(selected?.rto_estimate || Math.round(exShowroom * 0.1));
const insurance = Number(selected?.insurance_estimate || Math.round(exShowroom * 0.035));
const discount = Number(selected?.discount_amount || 0);
const exchangeBonus = Number(selected?.exchange_bonus || 0);
const corporateBenefit = Number(selected?.corporate_benefit || 0);
const currentBenefits = discount + exchangeBonus + corporateBenefit;
const total = exShowroom + rto + insurance - discount;
vars.price_city = city;
vars.on_road_price_snapshot = total;
vars.current_offer_title = String(selected?.offer_title || "Current dealership benefits");
vars.price_summary =
  "Estimated On-Road Price\\n\\n" +
  vars.selected_variant_name + "\\n\\n" +
  "City: " + city + "\\n" +
  "Ex-showroom: ₹" + exShowroom.toLocaleString("en-IN") + "\\n" +
  "RTO: ₹" + rto.toLocaleString("en-IN") + "\\n" +
  "Insurance: ₹" + insurance.toLocaleString("en-IN") + "\\n" +
  "Current benefits: -₹" + currentBenefits.toLocaleString("en-IN") + "\\n\\n" +
  "Estimated total: ₹" + total.toLocaleString("en-IN");
return {
  on_road_price: vars.on_road_price_snapshot,
  benefits: currentBenefits
};
`;

const emiScript = `
const onRoad = Number(vars.on_road_price_snapshot || vars.selected_variant_price || 0);
const downPayment = Number(vars.down_payment || 0);
const tenureMonths = Number(vars.loan_tenure_months || 0);
if (!onRoad || !tenureMonths || tenureMonths <= 0) {
  throw new Error("missing finance inputs");
}
const loanAmount = Math.max(onRoad - downPayment, 0);
const monthlyRate = 0.095 / 12;
const emi =
  monthlyRate === 0
    ? loanAmount / tenureMonths
    : (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) /
      (Math.pow(1 + monthlyRate, tenureMonths) - 1);
vars.finance_id = vars.finance_id || ("FIN-" + String(vars.lead_id || "AUTO").replace(/[^A-Za-z0-9]/g, "").slice(-8).toUpperCase());
vars.loan_amount = Math.round(loanAmount);
vars.indicative_emi = Math.round(emi);
vars.finance_summary =
  "Indicative EMI\\n\\n" +
  "Vehicle: ₹" + onRoad.toLocaleString("en-IN") + "\\n" +
  "Down payment: ₹" + downPayment.toLocaleString("en-IN") + "\\n" +
  "Finance requirement: ₹" + vars.loan_amount.toLocaleString("en-IN") + "\\n" +
  "Tenure: " + tenureMonths + " months\\n" +
  "Indicative EMI: ₹" + vars.indicative_emi.toLocaleString("en-IN") + "/month\\n\\n" +
  "This is indicative and subject to lender approval and live rates.";
return {
  indicative_emi: vars.indicative_emi,
  loan_amount: vars.loan_amount
};
`;

const normalizePhoneScript = (inputVar) => `
const raw = String(vars.${inputVar} || "").trim();
const digits = raw.replace(/\\D/g, "");
const last10 = digits.slice(-10);
if (last10.length !== 10) {
  throw new Error("invalid mobile number");
}
vars.customer_phone_last10 = last10;
vars.customer_phone_e164 = "+91" + last10;
vars.customer_id = vars.customer_id || ("CUST-" + last10);
return {
  phone_e164: vars.customer_phone_e164
};
`;

function otpValidationScript(inputVar) {
  return `
const otp = String(vars.${inputVar} || "").trim();
vars.verification_status = /^\\d{6}$/.test(otp) ? "valid" : "invalid";
return {
  verification_status: vars.verification_status
};
`;
}

const hydrateCustomerScript = `
const rows = Array.isArray(vars.customer_lookup_result?.data) ? vars.customer_lookup_result.data : [];
const customer = rows[0];
if (!customer) {
  vars.customer_lookup_status = "not_found";
  return { customer_lookup_status: "not_found" };
}
vars.customer_lookup_status = "found";
vars.customer_id = String(customer.customer_id || "");
vars.customer_name = String(customer.full_name || "");
vars.customer_email = String(customer.email || "");
vars.customer_city = String(customer.city || "");
vars.customer_last_vehicle_id = String(customer.last_vehicle_id || "");
return {
  customer_lookup_status: "found",
  customer_id: vars.customer_id
};
`;

const existingTestDriveScript = `
const rows = Array.isArray(vars.test_drive_booking_lookup_result?.data) ? vars.test_drive_booking_lookup_result.data : [];
const now = new Date();
const future = rows
  .filter((row) => String(row.status || "").toLowerCase() === "confirmed")
  .filter((row) => {
    const value = String(row.scheduled_at || "");
    const date = new Date(value);
    return value && !Number.isNaN(date.valueOf()) && date > now;
  })
  .sort((a, b) => new Date(a.scheduled_at).valueOf() - new Date(b.scheduled_at).valueOf());
if (future.length === 0) {
  vars.existing_test_drive_status = "clear";
  return { existing_test_drive_status: "clear" };
}
const booking = future[0];
vars.existing_test_drive_status = "existing";
vars.existing_test_drive_summary =
  String(booking.variant_name || "") + "\\n" +
  String(booking.scheduled_date || "") + " • " + String(booking.scheduled_time || "") + "\\n" +
  String(booking.location_id || "");
vars.existing_test_drive_booking_id = String(booking.booking_id || "");
return { existing_test_drive_status: "existing" };
`;

const locationOptionsScript = `
const rows = Array.isArray(vars.location_list_result?.data) ? vars.location_list_result.data : [];
const mode = String(vars.test_drive_mode || "showroom");
const filtered = rows.filter((row) => String(row.active ?? "true").toLowerCase() !== "false")
  .filter((row) => String(row.location_type || "") === "showroom")
  .filter((row) => mode !== "home" || String(row.support_home_test_drive || "false").toLowerCase() === "true");
vars.available_showroom_rows = filtered;
vars.showroom_options_text = filtered
  .map((row, index) => (index + 1) + ". " + row.location_name + " (" + row.city + ")")
  .join("\\n");
vars.showroom_option_status = filtered.length > 0 ? "available" : "none";
return { showroom_option_status: vars.showroom_option_status };
`;

const selectLocationScript = `
const rows = Array.isArray(vars.available_showroom_rows) ? vars.available_showroom_rows : [];
const choice = String(vars.showroom_choice || "").trim().toLowerCase();
let selected = null;
const index = Number(choice);
if (Number.isInteger(index) && index >= 1 && index <= rows.length) {
  selected = rows[index - 1];
} else {
  selected = rows.find((row) =>
    String(row.location_id || "").toLowerCase() === choice ||
    String(row.location_name || "").toLowerCase().includes(choice)
  );
}
if (!selected) {
  vars.showroom_selection_status = "invalid";
  return { showroom_selection_status: "invalid" };
}
vars.showroom_selection_status = "selected";
vars.selected_location_id = String(selected.location_id || "");
vars.selected_location_name = String(selected.location_name || "");
vars.selected_location_city = String(selected.city || "");
vars.selected_location_maps_url = String(selected.maps_url || "");
return { showroom_selection_status: "selected" };
`;

const selectTestDriveVehicleScript = `
const rows = Array.isArray(vars.test_drive_vehicle_list_result?.data) ? vars.test_drive_vehicle_list_result.data : [];
const match = rows.find((row) =>
  String(row.location_id || "") === String(vars.selected_location_id || "") &&
  String(row.variant_id || "") === String(vars.selected_variant_id || "") &&
  String(row.status || "").toLowerCase() === "available" &&
  String(row.active ?? "true").toLowerCase() === "true"
);
if (!match) {
  vars.test_drive_vehicle_status = "unavailable";
  return { test_drive_vehicle_status: "unavailable" };
}
vars.test_drive_vehicle_status = "available";
vars.selected_test_drive_vehicle_id = String(match.test_drive_vehicle_id || "");
return { test_drive_vehicle_status: "available" };
`;

const buildTestDriveSlotsScript = `
function parseSlotDate(dateValue, timeValue) {
  return new Date(String(dateValue || "") + "T" + String(timeValue || "00:00") + ":00+05:30");
}
const rows = Array.isArray(vars.test_drive_slot_list_result?.data) ? vars.test_drive_slot_list_result.data : [];
const now = new Date();
const slots = rows
  .filter((row) =>
    String(row.location_id || "") === String(vars.selected_location_id || "") &&
    String(row.variant_id || "") === String(vars.selected_variant_id || "") &&
    String(row.test_drive_vehicle_id || "") === String(vars.selected_test_drive_vehicle_id || "") &&
    String(row.status || "").toLowerCase() === "available"
  )
  .filter((row) => parseSlotDate(row.date, row.start) > now)
  .map((row) => ({
    id: String(row.slot_id || ""),
    slot_id: String(row.slot_id || ""),
    date: String(row.date || ""),
    start: String(row.start || ""),
    end: String(row.end || ""),
    label: String(row.label || "")
  }))
  .sort((a, b) => parseSlotDate(a.date, a.start).valueOf() - parseSlotDate(b.date, b.start).valueOf());
vars.test_drive_future_slots = slots;
vars.test_drive_slot_status = slots.length > 0 ? "available" : "unavailable";
return {
  slot_status: vars.test_drive_slot_status,
  slot_count: slots.length
};
`;

const prepareTestDriveBookingScript = `
function addMinutes(timeValue, minutesToAdd) {
  const [hours, minutes] = String(timeValue || "00:00").split(":").map((value) => Number(value || 0));
  const total = hours * 60 + minutes + minutesToAdd;
  return String(Math.floor(total / 60)).padStart(2, "0") + ":" + String(total % 60).padStart(2, "0");
}
const booking = vars.test_drive_slot_pick && typeof vars.test_drive_slot_pick === "object" ? vars.test_drive_slot_pick : {};
const date = String(booking.date || "").trim();
const start = String(booking.startTime || booking.start || "").trim();
if (!date || !start) {
  throw new Error("missing test drive slot selection");
}
vars.selected_test_drive_slot_id = String(booking.slotId || booking.slot_id || "").trim();
vars.selected_test_drive_date = date;
vars.selected_test_drive_time = start;
vars.selected_test_drive_end = String(booking.endTime || booking.end || "").trim() || addMinutes(start, 30);
vars.test_drive_hold_id = "TDH-" + String(vars.lead_id || "AUTO").replace(/[^A-Za-z0-9]/g, "").slice(-8).toUpperCase();
vars.test_drive_booking_id = "TDB-" + String(vars.lead_id || "AUTO").replace(/[^A-Za-z0-9]/g, "").slice(-8).toUpperCase() + "-" + date.replace(/-/g, "");
vars.test_drive_booking_number = "TD-" + date.replace(/-/g, "") + "-" + String(vars.customer_phone_last10 || "").slice(-4);
vars.test_drive_scheduled_at = date + "T" + start + ":00+05:30";
vars.test_drive_hold_expires_at = date + "T" + vars.selected_test_drive_end + ":00+05:30";
vars.test_drive_address_summary = vars.test_drive_mode === "home"
  ? [vars.home_test_drive_address, vars.home_test_drive_landmark, vars.home_test_drive_pincode].filter(Boolean).join(", ")
  : vars.selected_location_name;
return {
  booking_id: vars.test_drive_booking_id,
  slot_id: vars.selected_test_drive_slot_id
};
`;

const assignSalespersonScript = `
const rows = Array.isArray(vars.sales_staff_list_result?.data) ? vars.sales_staff_list_result.data : [];
const matches = rows
  .filter((row) => String(row.role || "") === "sales")
  .filter((row) => String(row.active ?? "true").toLowerCase() === "true")
  .filter((row) => String(row.location_id || "") === String(vars.selected_location_id || ""))
  .sort((a, b) => Number(a.active_leads || 999) - Number(b.active_leads || 999));
const selected = matches[0];
if (!selected) {
  throw new Error("missing active salesperson");
}
vars.salesperson_id = String(selected.staff_id || "");
vars.salesperson_name = String(selected.full_name || "");
vars.salesperson_phone = String(selected.phone_e164 || "");
vars.salesperson_email = String(selected.email || "");
vars.lead_assignment_id = "ASG-" + String(vars.lead_id || "AUTO").replace(/[^A-Za-z0-9]/g, "").slice(-8).toUpperCase();
vars.assignment_reason = "location + vehicle fit + least busy";
return {
  salesperson_id: vars.salesperson_id,
  assignment_id: vars.lead_assignment_id
};
`;

const finalTestDriveScoreScript = `
let score = Number(vars.lead_score || 0);
score += 25;
if (String(vars.finance_interest || "") === "yes") score += 10;
if (String(vars.exchange_interest || "") === "yes") score += 10;
vars.lead_score = score;
vars.lead_temperature = score >= 80 ? "hot" : score >= 50 ? "warm" : "nurture";
vars.lead_stage = "test_drive_booked";
vars.lead_status = "test_drive_booked";
return {
  lead_score: vars.lead_score,
  lead_temperature: vars.lead_temperature
};
`;

const customerVehicleOptionsScript = `
const rows = Array.isArray(vars.customer_vehicle_list_result?.data) ? vars.customer_vehicle_list_result.data : [];
const active = rows.filter((row) => String(row.status || "").toLowerCase() !== "inactive");
if (active.length === 0) {
  vars.service_vehicle_selection_status = "none";
  return { service_vehicle_selection_status: "none" };
}
if (active.length === 1) {
  const row = active[0];
  vars.selected_service_vehicle_id = String(row.vehicle_id || "");
  vars.selected_service_vehicle_display = String(row.model_name || "") + " - " + String(row.registration_number || "");
  vars.selected_service_vehicle_registration = String(row.registration_number || "");
  vars.selected_service_vehicle_model_name = String(row.model_name || "");
  vars.service_vehicle_selection_status = "selected";
  return { service_vehicle_selection_status: "selected" };
}
vars.service_vehicle_options = active;
vars.service_vehicle_options_text = active
  .map((row, index) => (index + 1) + ". " + row.model_name + " - " + row.registration_number)
  .join("\\n");
vars.service_vehicle_selection_status = "multiple";
return { service_vehicle_selection_status: "multiple" };
`;

const selectServiceVehicleScript = `
const rows = Array.isArray(vars.service_vehicle_options) ? vars.service_vehicle_options : [];
const choice = String(vars.service_vehicle_choice || "").trim().toLowerCase();
let selected = null;
const index = Number(choice);
if (Number.isInteger(index) && index >= 1 && index <= rows.length) {
  selected = rows[index - 1];
} else {
  selected = rows.find((row) =>
    String(row.vehicle_id || "").toLowerCase() === choice ||
    String(row.registration_number || "").toLowerCase() === choice
  );
}
if (!selected) {
  vars.service_vehicle_choice_status = "invalid";
  return { service_vehicle_choice_status: "invalid" };
}
vars.service_vehicle_choice_status = "selected";
vars.selected_service_vehicle_id = String(selected.vehicle_id || "");
vars.selected_service_vehicle_display = String(selected.model_name || "") + " - " + String(selected.registration_number || "");
vars.selected_service_vehicle_registration = String(selected.registration_number || "");
vars.selected_service_vehicle_model_name = String(selected.model_name || "");
return { service_vehicle_choice_status: "selected" };
`;

const serviceCenterOptionsScript = `
const rows = Array.isArray(vars.location_list_result?.data) ? vars.location_list_result.data : [];
const filtered = rows
  .filter((row) => String(row.location_type || "") === "service_center")
  .filter((row) => String(row.active ?? "true").toLowerCase() === "true");
vars.available_service_centers = filtered;
vars.service_center_options_text = filtered
  .map((row, index) => (index + 1) + ". " + row.location_name + " (" + row.city + ")")
  .join("\\n");
vars.service_center_option_status = filtered.length > 0 ? "available" : "none";
return { service_center_option_status: vars.service_center_option_status };
`;

const selectServiceCenterScript = `
const rows = Array.isArray(vars.available_service_centers) ? vars.available_service_centers : [];
const choice = String(vars.service_center_choice || "").trim().toLowerCase();
let selected = null;
const index = Number(choice);
if (Number.isInteger(index) && index >= 1 && index <= rows.length) {
  selected = rows[index - 1];
} else {
  selected = rows.find((row) =>
    String(row.location_id || "").toLowerCase() === choice ||
    String(row.location_name || "").toLowerCase().includes(choice)
  );
}
if (!selected) {
  vars.service_center_selection_status = "invalid";
  return { service_center_selection_status: "invalid" };
}
vars.service_center_selection_status = "selected";
vars.selected_service_center_id = String(selected.location_id || "");
vars.selected_service_center_name = String(selected.location_name || "");
return { service_center_selection_status: "selected" };
`;

const buildServiceSlotsScript = `
function parseSlotDate(dateValue, timeValue) {
  return new Date(String(dateValue || "") + "T" + String(timeValue || "00:00") + ":00+05:30");
}
const rows = Array.isArray(vars.service_slot_list_result?.data) ? vars.service_slot_list_result.data : [];
const now = new Date();
const requestedType = String(vars.service_type || "").toLowerCase();
const slots = rows
  .filter((row) =>
    String(row.service_center_id || "") === String(vars.selected_service_center_id || "") &&
    String(row.status || "").toLowerCase() === "available" &&
    Number(row.remaining_capacity || 0) > 0
  )
  .filter((row) =>
    !requestedType ||
    String(row.service_category || "").toLowerCase() === requestedType ||
    (requestedType === "repair / problem" && String(row.service_category || "").toLowerCase() === "repair")
  )
  .filter((row) => parseSlotDate(row.date, row.start) > now)
  .map((row) => ({
    id: String(row.slot_id || ""),
    slot_id: String(row.slot_id || ""),
    date: String(row.date || ""),
    start: String(row.start || ""),
    end: String(row.end || ""),
    label: String(row.label || "")
  }))
  .sort((a, b) => parseSlotDate(a.date, a.start).valueOf() - parseSlotDate(b.date, b.start).valueOf());
vars.service_future_slots = slots;
vars.service_slot_status = slots.length > 0 ? "available" : "unavailable";
return {
  slot_status: vars.service_slot_status,
  slot_count: slots.length
};
`;

const prepareServiceBookingScript = `
function addMinutes(timeValue, minutesToAdd) {
  const [hours, minutes] = String(timeValue || "00:00").split(":").map((value) => Number(value || 0));
  const total = hours * 60 + minutes + minutesToAdd;
  return String(Math.floor(total / 60)).padStart(2, "0") + ":" + String(total % 60).padStart(2, "0");
}
const booking = vars.service_slot_pick && typeof vars.service_slot_pick === "object" ? vars.service_slot_pick : {};
const date = String(booking.date || "").trim();
const start = String(booking.startTime || booking.start || "").trim();
if (!date || !start) {
  throw new Error("missing service slot selection");
}
vars.selected_service_slot_id = String(booking.slotId || booking.slot_id || "").trim();
vars.selected_service_date = date;
vars.selected_service_time = start;
vars.selected_service_end = String(booking.endTime || booking.end || "").trim() || addMinutes(start, 90);
vars.service_booking_id = "SRVB-" + String(vars.customer_phone_last10 || "").slice(-6) + "-" + date.replace(/-/g, "");
vars.service_booking_number = "SRV-" + date.replace(/-/g, "") + "-" + String(vars.customer_phone_last10 || "").slice(-5);
vars.service_slot_hold_id = "SRVH-" + String(vars.customer_phone_last10 || "").slice(-6) + "-" + date.replace(/-/g, "");
vars.service_slot_hold_expires_at = date + "T" + vars.selected_service_end + ":00+05:30";
return {
  booking_id: vars.service_booking_id,
  slot_id: vars.selected_service_slot_id
};
`;

const assignServiceAdvisorScript = `
const rows = Array.isArray(vars.service_staff_list_result?.data) ? vars.service_staff_list_result.data : [];
const matches = rows
  .filter((row) => String(row.role || "") === "service_advisor")
  .filter((row) => String(row.active ?? "true").toLowerCase() === "true")
  .filter((row) => String(row.location_id || "") === String(vars.selected_service_center_id || ""))
  .sort((a, b) => Number(a.active_leads || 999) - Number(b.active_leads || 999));
const selected = matches[0];
if (!selected) {
  throw new Error("missing active service advisor");
}
vars.service_advisor_id = String(selected.staff_id || "");
vars.service_advisor_name = String(selected.full_name || "");
vars.service_advisor_phone = String(selected.phone_e164 || "");
return {
  advisor_id: vars.service_advisor_id
};
`;

const serviceOrderRouteScript = `
const rows = Array.isArray(vars.service_order_list_result?.data) ? vars.service_order_list_result.data : [];
const journey = String(vars.service_journey_mode || "");
const eligible = rows.filter((row) => String(row.customer_id || "") === String(vars.customer_id || ""));
let selected = null;
let routeStatus = "none";
if (journey === "track_service_status") {
  selected = eligible.find((row) => !["delivered", "cancelled"].includes(String(row.status || "").toLowerCase())) || eligible[0];
  if (selected) routeStatus = "track_service_status";
} else if (journey === "service_estimate") {
  selected = eligible.find((row) => ["estimate_prepared", "waiting_customer_approval"].includes(String(row.current_stage || "").toLowerCase()));
  if (selected) routeStatus = "service_estimate";
} else if (journey === "pay_service_bill") {
  selected = eligible.find((row) => ["payment_pending", "pending"].includes(String(row.payment_status || "").toLowerCase()));
  if (selected) routeStatus = "pay_service_bill";
}
if (!selected) {
  vars.service_order_route_status = "none";
  return { service_order_route_status: "none" };
}
vars.service_order_route_status = routeStatus;
vars.selected_service_order_id = String(selected.service_order_id || "");
vars.selected_service_order_status = String(selected.status || "");
vars.selected_service_order_stage = String(selected.current_stage || "");
vars.selected_service_order_payment_status = String(selected.payment_status || "");
vars.selected_service_order_total_amount = Number(selected.total_amount || 0);
vars.selected_service_center_id = String(selected.service_center_id || vars.selected_service_center_id || "");
vars.selected_service_vehicle_id = String(selected.vehicle_id || vars.selected_service_vehicle_id || "");
vars.service_advisor_id = String(selected.advisor_id || vars.service_advisor_id || "");
vars.selected_service_order_summary =
  "Service Order: " + vars.selected_service_order_id + "\\n" +
  "Stage: " + vars.selected_service_order_stage + "\\n" +
  "Status: " + vars.selected_service_order_status + "\\n" +
  "Payment: " + vars.selected_service_order_payment_status + "\\n\\n" +
  String(selected.timeline_summary || "");
return { service_order_route_status: vars.service_order_route_status };
`;

const verifiedCustomerRouteScript = `
vars.verified_customer_route =
  String(vars.sales_goal || "") === "my_test_drive_booking" ? "my_test_drive_booking" : "service";
return {
  verified_customer_route: vars.verified_customer_route
};
`;

const serviceEstimateScript = `
const rows = Array.isArray(vars.service_estimate_list_result?.data) ? vars.service_estimate_list_result.data : [];
const match = rows.find((row) => String(row.service_order_id || "") === String(vars.selected_service_order_id || ""));
if (!match) {
  vars.service_estimate_status = "none";
  return { service_estimate_status: "none" };
}
vars.service_estimate_status = "selected";
vars.selected_estimate_id = String(match.estimate_id || "");
vars.selected_estimate_total = Number(match.total_amount || 0);
vars.selected_estimate_summary =
  "Service Estimate\\n\\n" +
  String(match.line_items_summary || "") + "\\n\\n" +
  "Total: ₹" + vars.selected_estimate_total.toLocaleString("en-IN");
return { service_estimate_status: "selected" };
`;

const paymentContextScript = `
const amount = Number(vars.selected_service_order_total_amount || 0);
if (!amount || amount <= 0) {
  throw new Error("missing payable amount");
}
vars.service_payment_id = "PAY-SRV-" + String(vars.selected_service_order_id || "").replace(/[^A-Za-z0-9]/g, "").slice(-8).toUpperCase();
vars.service_payment_amount = amount;
vars.service_payment_description = "Service payment for " + String(vars.selected_service_order_id || "");
return {
  payment_id: vars.service_payment_id,
  amount: vars.service_payment_amount
};
`;

node("start_1", "start", 120, 120, { messages: [] });
node(
  "set_template_defaults",
  "setVariable",
  360,
  120,
  setVars({
    sales_goal: "",
    service_journey_mode: "",
    lead_id: "",
    customer_id: "",
    customer_name: "",
    customer_email: "",
    customer_city: "",
    customer_phone_e164: "",
    customer_phone_last10: "",
    body_type: "",
    fuel_preference: "",
    transmission_preference: "",
    usage_type: "",
    budget_max: "0",
    purchase_timeline: "",
    requirement_summary: "",
    lead_score: "0",
    lead_temperature: "",
    lead_stage: "",
    lead_status: "",
    finance_interest: "no",
    exchange_interest: "no",
    verification_status: "",
    selected_variant_id: "",
    selected_variant_name: "",
    selected_variant_price: "0",
    selected_location_id: "",
    selected_location_name: "",
    selected_service_center_id: "",
    selected_service_center_name: "",
    test_drive_mode: "showroom",
    pickup_type: "drive_to_center"
  })
);
node(
  "welcome_message",
  "message",
  600,
  120,
  msgData(
    "Hi 👋 Welcome to {{dealership_name}}. I can help you find the right vehicle, compare variants, check prices and offers, book a real test drive, schedule service, track service progress, review estimates, and pay the final bill when your vehicle is ready."
  )
);
node(
  "main_menu_input",
  "input",
  840,
  120,
  inputData(
    "What would you like to do?",
    "main_user_request",
    [
      { label: "🚗 Explore Vehicles", value: "explore_vehicles" },
      { label: "🔍 Find My Car", value: "find_my_car" },
      { label: "⚖️ Compare Models", value: "compare_models" },
      { label: "💰 Price & Offers", value: "price_offers" },
      { label: "📄 Download Brochure", value: "download_brochure" },
      { label: "🛞 Book Test Drive", value: "book_test_drive" },
      { label: "🏢 Showroom Visit", value: "showroom_visit" },
      { label: "🔄 Exchange My Car", value: "exchange_my_car" },
      { label: "💳 Finance / EMI", value: "finance_emi" },
      { label: "📦 Check Vehicle Availability", value: "check_vehicle_availability" },
      { label: "📅 My Test Drive / Booking", value: "my_test_drive_booking" },
      { label: "🔧 Book Vehicle Service", value: "book_vehicle_service" },
      { label: "🧾 Service Estimate", value: "service_estimate" },
      { label: "📍 Track Service Status", value: "track_service_status" },
      { label: "💳 Pay Service Bill", value: "pay_service_bill" },
      { label: "🛡️ Warranty / RSA", value: "warranty_rsa" },
      { label: "❓ Vehicle Questions", value: "vehicle_questions" },
      { label: "👨‍💼 Talk to Advisor", value: "talk_to_advisor" }
    ],
    false
  )
);
node("main_intent_router", "intent-router", 1080, 120, {
  intents: [
    { key: "explore_vehicles", label: "Explore Vehicles" },
    { key: "find_my_car", label: "Find My Car" },
    { key: "compare_models", label: "Compare Models" },
    { key: "price_offers", label: "Price and Offers" },
    { key: "download_brochure", label: "Download Brochure" },
    { key: "book_test_drive", label: "Book Test Drive" },
    { key: "showroom_visit", label: "Showroom Visit" },
    { key: "exchange_my_car", label: "Exchange My Car" },
    { key: "finance_emi", label: "Finance EMI" },
    { key: "check_vehicle_availability", label: "Check Vehicle Availability" },
    { key: "my_test_drive_booking", label: "My Test Drive Booking" },
    { key: "book_vehicle_service", label: "Book Vehicle Service" },
    { key: "service_estimate", label: "Service Estimate" },
    { key: "track_service_status", label: "Track Service Status" },
    { key: "pay_service_bill", label: "Pay Service Bill" },
    { key: "warranty_rsa", label: "Warranty RSA" },
    { key: "vehicle_questions", label: "Vehicle Questions" },
    { key: "talk_to_advisor", label: "Talk to Advisor" }
  ],
  fallbackIntent: "unknown",
  threshold: 0.6
});

node("set_goal_explore", "setVariable", 1320, -560, setVars({ sales_goal: "explore_vehicles" }));
node("set_goal_find", "setVariable", 1320, -500, setVars({ sales_goal: "find_my_car" }));
node("set_goal_compare", "setVariable", 1320, -440, setVars({ sales_goal: "compare_models" }));
node("set_goal_price", "setVariable", 1320, -380, setVars({ sales_goal: "price_offers" }));
node("set_goal_brochure", "setVariable", 1320, -320, setVars({ sales_goal: "download_brochure" }));
node("set_goal_test_drive", "setVariable", 1320, -260, setVars({ sales_goal: "book_test_drive" }));
node("set_goal_showroom_visit", "setVariable", 1320, -200, setVars({ sales_goal: "showroom_visit", test_drive_mode: "showroom" }));
node("set_goal_exchange", "setVariable", 1320, -140, setVars({ sales_goal: "exchange_my_car", exchange_interest: "yes" }));
node("set_goal_finance", "setVariable", 1320, -80, setVars({ sales_goal: "finance_emi", finance_interest: "yes" }));
node("set_goal_availability", "setVariable", 1320, -20, setVars({ sales_goal: "check_vehicle_availability" }));

node("set_goal_my_test_drive", "setVariable", 1320, 160, setVars({ sales_goal: "my_test_drive_booking" }));
node("set_service_booking_mode", "setVariable", 1320, 260, setVars({ service_journey_mode: "book_vehicle_service" }));
node("set_service_estimate_mode", "setVariable", 1320, 320, setVars({ service_journey_mode: "service_estimate" }));
node("set_service_track_mode", "setVariable", 1320, 380, setVars({ service_journey_mode: "track_service_status" }));
node("set_service_payment_mode", "setVariable", 1320, 440, setVars({ service_journey_mode: "pay_service_bill" }));

node(
  "sales_intro_message",
  "message",
  1560,
  -280,
  msgData(
    "Tell me what you need. For example: \"I need an automatic SUV below ₹18 lakh for family trips.\" I will capture only the missing details instead of asking a long form upfront."
  )
);
node(
  "vehicle_requirement_input",
  "input",
  1800,
  -280,
  inputData("Share your requirement.", "vehicle_requirement_text", [], false)
);
node("parse_vehicle_requirement", "script", 2040, -280, scriptData(parseVehicleRequirementScript, "vehicle_requirement_parse_result"));
node("usage_switch", "switch", 2280, -280, switchData("need_usage"));
node(
  "usage_input",
  "input",
  2520,
  -220,
  inputData(
    "Great. Is the vehicle mainly for city use, highway travel, family trips, or a mix?",
    "usage_type",
    [
      { label: "City Use", value: "City" },
      { label: "Highway Travel", value: "Highway" },
      { label: "Family Trips", value: "Family" },
      { label: "A Mix", value: "Mixed" }
    ],
    true
  )
);
node("fuel_switch", "switch", 2760, -280, switchData("need_fuel"));
node(
  "fuel_input",
  "input",
  3000,
  -220,
  inputData(
    "Any preference for Petrol, Diesel, CNG, Hybrid, or EV?",
    "fuel_preference",
    [
      { label: "Petrol", value: "Petrol" },
      { label: "Diesel", value: "Diesel" },
      { label: "CNG", value: "CNG" },
      { label: "Hybrid", value: "Hybrid" },
      { label: "EV", value: "EV" }
    ],
    true
  )
);
node("transmission_switch", "switch", 3240, -280, switchData("need_transmission"));
node(
  "transmission_input",
  "input",
  3480,
  -220,
  inputData(
    "Automatic or Manual?",
    "transmission_preference",
    [
      { label: "Automatic", value: "Automatic" },
      { label: "Manual", value: "Manual" }
    ],
    true
  )
);
node("budget_switch", "switch", 3720, -280, switchData("need_budget"));
node(
  "budget_input",
  "input",
  3960,
  -220,
  inputData(
    "What is the approximate budget ceiling?",
    "vehicle_budget_text",
    [],
    false
  )
);
node("normalize_budget", "script", 4200, -220, scriptData(normalizeBudgetScript, "vehicle_budget_result"));
node("timeline_switch", "switch", 4440, -280, switchData("need_timeline"));
node(
  "timeline_input",
  "input",
  4680,
  -220,
  inputData(
    "When are you planning to buy?",
    "purchase_timeline",
    [
      { label: "Within 7 Days", value: "Within 7 Days" },
      { label: "Within 30 Days", value: "Within 30 Days" },
      { label: "1-3 Months", value: "1-3 Months" },
      { label: "Just Exploring", value: "Exploring" }
    ],
    true
  )
);
node("prepare_lead_script", "script", 4920, -280, scriptData(prepareLeadScript, "lead_prepare_result"));
node(
  "lead_upsert_discovery",
  "record",
  5160,
  -280,
  recordData({
    action: "upsert",
    collection: "automobile_leads",
    where: { lead_id: "{{lead_id}}" },
    data: {
      lead_id: "{{lead_id}}",
      customer_id: "{{customer_id}}",
      source_channel: "{{system.channel}}",
      status: "{{lead_status}}",
      stage: "{{lead_stage}}",
      requirement_summary: "{{requirement_summary}}",
      body_type: "{{body_type}}",
      budget_max: "{{budget_max}}",
      fuel_preference: "{{fuel_preference}}",
      transmission_preference: "{{transmission_preference}}",
      usage_type: "{{usage_type}}",
      purchase_timeline: "{{purchase_timeline}}",
      finance_interest: "{{finance_interest}}",
      exchange_interest: "{{exchange_interest}}",
      lead_score: "{{lead_score}}",
      lead_temperature: "{{lead_temperature}}",
      selected_variant_id: "{{selected_variant_id}}",
      selected_variant_name: "{{selected_variant_name}}",
      assigned_salesperson_id: "{{salesperson_id}}",
      last_activity_at: "{{lead_last_activity_at}}"
    },
    schema: schemas.leads,
    uniqueKey: "lead_id",
    idempotencyKey: "{{lead_id}}:discovery",
    outputVar: "lead_upsert_discovery_result"
  })
);
node(
  "variant_inventory_list",
  "record",
  5400,
  -280,
  recordData({
    action: "list",
    collection: "vehicle_variants",
    where: { active: true },
    schema: schemas.vehicleVariants,
    outputVar: "variant_inventory_result",
    limit: 50,
    sortBy: "ex_showroom_price",
    sortOrder: "asc"
  })
);
node("match_vehicle_script", "script", 5640, -280, scriptData(matchVehicleScript, "vehicle_match_result", 160));
node("vehicle_match_switch", "switch", 5880, -280, switchData("vehicle_match_status"));
node(
  "vehicle_close_match_message",
  "message",
  6120,
  -340,
  msgData("I found close alternatives so you still have strong options even though there was no perfect exact match on every field.")
);
node(
  "vehicle_no_match_message",
  "message",
  6120,
  -220,
  msgData("I could not find a maintained live match for that requirement right now. A product advisor can still help with nearby alternatives or incoming stock.")
);
node("vehicle_no_match_end", "end", 6360, -220, { messages: [] });
node(
  "vehicle_carousel",
  "carousel",
  6360,
  -340,
  dynamicCarouselData("Recommended for you", "matched_vehicle_items", {
    title: "{{item.title}}",
    subtitle: "{{item.subtitle}}",
    body: "{{item.description}}\\n\\n{{item.summary}}",
    tag: "{{item.tag}}",
    buttons: ["View Details"]
  })
);
node(
  "variant_select_input",
  "input",
  6600,
  -340,
  inputData(
    "Choose a vehicle by option number or variant ID.\\n\\n{{vehicle_selection_prompt}}",
    "selected_variant_choice",
    [],
    false
  )
);
node("select_variant_script", "script", 6840, -340, scriptData(selectVariantScript, "vehicle_select_result"));
node("selected_variant_switch", "switch", 7080, -340, switchData("selected_variant_status"));
node(
  "selected_variant_message",
  "message",
  7320,
  -420,
  msgData("{{selected_variant_card}}")
);
node("post_variant_goal_switch", "switch", 7560, -420, switchData("sales_goal"));
node(
  "generic_action_input",
  "input",
  7800,
  -540,
  inputData(
    "What would you like next?",
    "selected_variant_next_step",
    [
      { label: "💰 Price & Offers", value: "price_offers" },
      { label: "📄 Brochure", value: "download_brochure" },
      { label: "⚖️ Compare", value: "compare_models" },
      { label: "🛞 Book Test Drive", value: "book_test_drive" },
      { label: "💳 EMI", value: "finance_emi" },
      { label: "🔄 Exchange", value: "exchange_my_car" }
    ],
    true
  )
);
node("generic_action_switch", "switch", 8040, -540, switchData("selected_variant_next_step"));

node(
  "pricing_city_input",
  "input",
  7800,
  -420,
  inputData(
    "For which city should I estimate the on-road price?",
    "pricing_city",
    [
      { label: "Hyderabad", value: "Hyderabad" },
      { label: "Bengaluru", value: "Bengaluru" },
      { label: "Chennai", value: "Chennai" }
    ],
    true
  )
);
node(
  "vehicle_offer_list",
  "record",
  8040,
  -420,
  recordData({
    action: "list",
    collection: "vehicle_offers",
    where: { active: true },
    schema: schemas.vehicleOffers,
    outputVar: "vehicle_offer_list_result",
    limit: 20,
    sortBy: "city",
    sortOrder: "asc"
  })
);
node("price_calc_script", "script", 8280, -420, scriptData(priceCalculationScript, "price_calc_result"));
node("price_summary_message", "message", 8520, -420, msgData("{{price_summary}}"));
node(
  "price_next_input",
  "input",
  8760,
  -420,
  inputData(
    "What would you like to do next?",
    "price_next_step",
    [
      { label: "💳 Calculate EMI", value: "finance_emi" },
      { label: "🔄 Get Exchange Value", value: "exchange_my_car" },
      { label: "🛞 Book Test Drive", value: "book_test_drive" }
    ],
    true
  )
);
node("price_next_switch", "switch", 9000, -420, switchData("price_next_step"));

node(
  "brochure_message",
  "message",
  7800,
  -300,
  msgData("You can download the brochure for {{selected_variant_name}} here:\\n{{selected_variant_brochure_url}}\\n\\nIf you want, I can also continue directly to pricing or test-drive booking.")
);
node("brochure_end", "end", 8040, -300, { messages: [] });

node(
  "availability_message",
  "message",
  7800,
  -180,
  msgData("{{selected_variant_name}} is currently configured as {{selected_variant_fuel}} / {{selected_variant_transmission}} and is available for enquiry and maintained demo inventory checks. I can continue directly to test-drive booking.")
);
node("availability_end", "end", 8040, -180, { messages: [] });

node(
  "compare_variant_input",
  "input",
  7800,
  -60,
  inputData(
    "Choose the second variant to compare.\\n\\n{{compare_variant_prompt}}",
    "compare_variant_choice",
    [],
    false
  )
);
node("select_compare_variant_script", "script", 8040, -60, scriptData(selectCompareVariantScript, "compare_variant_result"));
node("compare_variant_switch", "switch", 8280, -60, switchData("compare_variant_status"));
node(
  "compare_summary_message",
  "message",
  8520,
  -60,
  msgData("{{compare_summary}}\\n\\n{{compare_variant_name}} is stronger if ADAS and comfort matter. {{selected_variant_name}} is the better value pick if staying tight to budget is the priority.")
);
node(
  "compare_next_input",
  "input",
  8760,
  -60,
  inputData(
    "What next?",
    "compare_next_step",
    [
      { label: "💰 View Price", value: "price_offers" },
      { label: "🛞 Book Test Drive", value: "book_test_drive" }
    ],
    true
  )
);
node("compare_next_switch", "switch", 9000, -60, switchData("compare_next_step"));

node("finance_form", "form", 7800, 80, formData("Share the finance basics.", financeFields, "finance_form_result"));
node("emi_script", "script", 8040, 80, scriptData(emiScript, "emi_result"));
node(
  "finance_record",
  "record",
  8280,
  80,
  recordData({
    action: "upsert",
    collection: "finance_requests",
    where: { finance_id: "{{finance_id}}" },
    data: {
      finance_id: "{{finance_id}}",
      lead_id: "{{lead_id}}",
      customer_id: "{{customer_id}}",
      variant_id: "{{selected_variant_id}}",
      on_road_price: "{{on_road_price_snapshot}}",
      down_payment: "{{down_payment}}",
      loan_amount: "{{loan_amount}}",
      tenure_months: "{{loan_tenure_months}}",
      indicative_emi: "{{indicative_emi}}",
      status: "qualified"
    },
    schema: schemas.financeRequests,
    uniqueKey: "finance_id",
    idempotencyKey: "{{finance_id}}",
    outputVar: "finance_record_result"
  })
);
node("finance_message", "message", 8520, 80, msgData("{{finance_summary}}"));
node("finance_end", "end", 8760, 80, { messages: [] });

node("exchange_form", "form", 7800, 220, formData("Share the current vehicle details for exchange.", exchangeFields, "exchange_form_result"));
node(
  "exchange_record",
  "record",
  8040,
  220,
  recordData({
    action: "upsert",
    collection: "exchange_requests",
    where: { exchange_id: "{{lead_id}}-exchange" },
    data: {
      exchange_id: "{{lead_id}}-exchange",
      lead_id: "{{lead_id}}",
      customer_id: "{{customer_id}}",
      make: "{{exchange_make}}",
      model: "{{exchange_model}}",
      registration_year: "{{exchange_registration_year}}",
      fuel: "{{exchange_fuel}}",
      transmission: "{{exchange_transmission}}",
      kilometers: "{{exchange_kilometers}}",
      condition_summary: "{{exchange_condition_summary}}",
      expected_value: "{{exchange_expected_value}}",
      status: "requested"
    },
    schema: schemas.exchangeRequests,
    uniqueKey: "exchange_id",
    idempotencyKey: "{{lead_id}}:exchange",
    outputVar: "exchange_record_result"
  })
);
node(
  "exchange_message",
  "message",
  8280,
  220,
  msgData("Your exchange appraisal request has been captured. A valuation specialist can now work with the same lead context without re-asking these details.")
);
node("exchange_end", "end", 8520, 220, { messages: [] });

node(
  "test_drive_mobile_input",
  "input",
  7800,
  360,
  inputData("Please enter your mobile number so I can continue with a real test-drive booking.", "customer_phone_input", [], false)
);
node("normalize_test_drive_phone", "script", 8040, 360, scriptData(normalizePhoneScript("customer_phone_input"), "normalize_test_drive_phone_result"));
node(
  "sales_customer_lookup",
  "record",
  8280,
  360,
  recordData({
    action: "list",
    collection: "automobile_customers",
    where: { phone_e164: "{{customer_phone_e164}}" },
    schema: schemas.customers,
    outputVar: "customer_lookup_result",
    limit: 5,
    sortBy: "full_name",
    sortOrder: "asc"
  })
);
node("hydrate_sales_customer", "script", 8520, 360, scriptData(hydrateCustomerScript, "hydrate_sales_customer_result"));
node("sales_customer_switch", "switch", 8760, 360, switchData("customer_lookup_status"));
node(
  "returning_customer_message",
  "message",
  9000,
  300,
  msgData("Welcome back {{customer_name}}. I found your saved profile, so I can reuse your details for the booking.")
);
node("new_customer_form", "form", 9000, 420, formData("I could not find an existing profile. Please share your details.", customerFields, "new_customer_form_result"));
node(
  "customer_upsert",
  "record",
  9240,
  420,
  recordData({
    action: "upsert",
    collection: "automobile_customers",
    where: { phone_e164: "{{customer_phone_e164}}" },
    data: {
      customer_id: "{{customer_id}}",
      full_name: "{{customer_name}}",
      phone_e164: "{{customer_phone_e164}}",
      email: "{{customer_email}}",
      city: "{{customer_city}}",
      preferred_language: "en",
      last_sales_lead_id: "{{lead_id}}",
      last_vehicle_id: "{{selected_service_vehicle_id}}"
    },
    schema: schemas.customers,
    uniqueKey: "customer_id",
    idempotencyKey: "{{customer_phone_last10}}:customer",
    outputVar: "customer_upsert_result",
    piiFields: "full_name,phone_e164,email"
  })
);
node(
  "test_drive_booking_lookup",
  "record",
  9480,
  360,
  recordData({
    action: "list",
    collection: "test_drive_bookings",
    where: { customer_id: "{{customer_id}}" },
    schema: schemas.testDriveBookings,
    outputVar: "test_drive_booking_lookup_result",
    limit: 20,
    sortBy: "scheduled_at",
    sortOrder: "asc"
  })
);
node("existing_test_drive_script", "script", 9720, 360, scriptData(existingTestDriveScript, "existing_test_drive_result"));
node("existing_test_drive_switch", "switch", 9960, 360, switchData("existing_test_drive_status"));
node(
  "existing_test_drive_message",
  "message",
  10200,
  300,
  msgData("You already have a future test drive scheduled:\\n\\n{{existing_test_drive_summary}}")
);
node(
  "existing_test_drive_choice",
  "input",
  10440,
  300,
  inputData(
    "Would you like to keep that booking or continue with another one?",
    "existing_test_drive_next_step",
    [
      { label: "Keep Existing Booking", value: "keep" },
      { label: "Book Another Vehicle", value: "book_another" }
    ],
    true
  )
);
node("existing_test_drive_choice_switch", "switch", 10680, 300, switchData("existing_test_drive_next_step"));
node("existing_test_drive_end", "end", 10920, 240, { messages: [] });
node(
  "test_drive_mode_input",
  "input",
  10200,
  420,
  inputData(
    "How would you like to take the test drive?",
    "test_drive_mode",
    [
      { label: "🏢 Showroom Test Drive", value: "showroom" },
      { label: "🏠 Home Test Drive", value: "home" }
    ],
    true
  )
);
node("home_test_drive_form", "form", 10440, 420, formData("Share the address for the home test drive.", homeTestDriveFields, "home_test_drive_form_result"));
node(
  "location_list",
  "record",
  10920,
  420,
  recordData({
    action: "list",
    collection: "dealership_locations",
    where: { active: true },
    schema: schemas.locations,
    outputVar: "location_list_result",
    limit: 20,
    sortBy: "location_name",
    sortOrder: "asc"
  })
);
node("location_options_script", "script", 11160, 420, scriptData(locationOptionsScript, "location_options_result"));
node("location_options_switch", "switch", 11400, 420, switchData("showroom_option_status"));
node(
  "showroom_choice_input",
  "input",
  11640,
  420,
  inputData(
    "Choose the showroom.\\n\\n{{showroom_options_text}}",
    "showroom_choice",
    [],
    false
  )
);
node("select_showroom_script", "script", 11880, 420, scriptData(selectLocationScript, "select_showroom_result"));
node("showroom_select_switch", "switch", 12120, 420, switchData("showroom_selection_status"));
node("showroom_invalid_message", "message", 12360, 360, msgData("That showroom selection was invalid. Please restart from the main menu and choose one of the listed showrooms."));
node("showroom_invalid_end", "end", 12600, 360, { messages: [] });
node(
  "test_drive_vehicle_list",
  "record",
  12360,
  420,
  recordData({
    action: "list",
    collection: "test_drive_vehicles",
    where: { active: true },
    schema: schemas.testDriveVehicles,
    outputVar: "test_drive_vehicle_list_result",
    limit: 20,
    sortBy: "test_drive_vehicle_id",
    sortOrder: "asc"
  })
);
node("select_test_drive_vehicle", "script", 12600, 420, scriptData(selectTestDriveVehicleScript, "select_test_drive_vehicle_result"));
node("test_drive_vehicle_switch", "switch", 12840, 420, switchData("test_drive_vehicle_status"));
node(
  "no_demo_vehicle_message",
  "message",
  13080,
  360,
  msgData("That variant is not available as a maintained demonstrator at the selected showroom right now. A product advisor can suggest the closest alternative immediately.")
);
node("no_demo_vehicle_end", "end", 13320, 360, { messages: [] });
node(
  "test_drive_slot_list",
  "record",
  13080,
  480,
  recordData({
    action: "list",
    collection: "test_drive_slots",
    where: { status: "available" },
    schema: schemas.testDriveSlots,
    outputVar: "test_drive_slot_list_result",
    limit: 40,
    sortBy: "date",
    sortOrder: "asc"
  })
);
node("build_test_drive_slots", "script", 13320, 480, scriptData(buildTestDriveSlotsScript, "build_test_drive_slots_result"));
node("test_drive_slot_status_switch", "switch", 13560, 480, switchData("test_drive_slot_status"));
node(
  "test_drive_no_slots_message",
  "message",
  13800,
  420,
  msgData("I do not have a future slot for that showroom and demonstrator right now. Please try another showroom or talk to an advisor for manual recovery.")
);
node("test_drive_no_slots_end", "end", 14040, 420, { messages: [] });
node(
  "test_drive_slot_picker",
  "appointment",
  13800,
  540,
  appointmentData(
    "Choose the test-drive time that works for you.",
    "test_drive_future_slots",
    "test_drive_slot_pick",
    {
      dateVar: "selected_test_drive_date",
      horizonDays: 14,
      maxSlotsPerDay: 16,
      slotDurationMins: 30,
      slotIntervalMins: 30,
      disableGeneratedFallback: true
    }
  )
);
node("prepare_test_drive_booking", "script", 14040, 540, scriptData(prepareTestDriveBookingScript, "prepare_test_drive_booking_result"));
node(
  "test_drive_slot_hold_record",
  "record",
  14280,
  540,
  recordData({
    action: "update",
    collection: "test_drive_slots",
    where: { slot_id: "{{selected_test_drive_slot_id}}" },
    data: {
      slot_id: "{{selected_test_drive_slot_id}}",
      location_id: "{{selected_location_id}}",
      variant_id: "{{selected_variant_id}}",
      test_drive_vehicle_id: "{{selected_test_drive_vehicle_id}}",
      date: "{{selected_test_drive_date}}",
      start: "{{selected_test_drive_time}}",
      end: "{{selected_test_drive_end}}",
      label: "{{selected_test_drive_time}} - {{selected_test_drive_end}}",
      status: "held",
      hold_id: "{{test_drive_hold_id}}",
      held_by_session: "{{system.sessionId}}",
      hold_expires_at: "{{test_drive_hold_expires_at}}",
      booking_id: ""
    },
    schema: schemas.testDriveSlots,
    uniqueKey: "slot_id",
    idempotencyKey: "{{selected_test_drive_slot_id}}:hold",
    outputVar: "test_drive_slot_hold_result"
  })
);
node(
  "test_drive_confirm_input",
  "input",
  14520,
  540,
  inputData(
    "Confirm Your Test Drive\\n\\nVehicle: {{selected_variant_name}}\\nShowroom: {{selected_location_name}}\\nDate: {{selected_test_drive_date}}\\nTime: {{selected_test_drive_time}}\\nMode: {{test_drive_mode}}",
    "confirm_test_drive",
    yesNoButtons(),
    true
  )
);
node(
  "test_drive_slot_release_record",
  "record",
  14760,
  620,
  recordData({
    action: "update",
    collection: "test_drive_slots",
    where: { slot_id: "{{selected_test_drive_slot_id}}" },
    data: {
      slot_id: "{{selected_test_drive_slot_id}}",
      location_id: "{{selected_location_id}}",
      variant_id: "{{selected_variant_id}}",
      test_drive_vehicle_id: "{{selected_test_drive_vehicle_id}}",
      date: "{{selected_test_drive_date}}",
      start: "{{selected_test_drive_time}}",
      end: "{{selected_test_drive_end}}",
      label: "{{selected_test_drive_time}} - {{selected_test_drive_end}}",
      status: "available",
      hold_id: "",
      held_by_session: "",
      hold_expires_at: "",
      booking_id: ""
    },
    schema: schemas.testDriveSlots,
    uniqueKey: "slot_id",
    idempotencyKey: "{{selected_test_drive_slot_id}}:release",
    outputVar: "test_drive_slot_release_result"
  })
);
node("test_drive_cancel_message", "message", 15000, 620, msgData("No problem. The test-drive slot has been released."));
node("test_drive_cancel_end", "end", 15240, 620, { messages: [] });
node(
  "sales_staff_list",
  "record",
  14760,
  540,
  recordData({
    action: "list",
    collection: "dealership_staff",
    where: { active: true },
    schema: schemas.staff,
    outputVar: "sales_staff_list_result",
    limit: 20,
    sortBy: "active_leads",
    sortOrder: "asc"
  })
);
node("assign_salesperson_script", "script", 15000, 540, scriptData(assignSalespersonScript, "assign_salesperson_result"));
node("final_test_drive_score_script", "script", 15240, 540, scriptData(finalTestDriveScoreScript, "final_test_drive_score_result"));
node(
  "test_drive_booking_record",
  "record",
  15480,
  540,
  recordData({
    action: "upsert",
    collection: "test_drive_bookings",
    where: { booking_id: "{{test_drive_booking_id}}" },
    data: {
      booking_id: "{{test_drive_booking_id}}",
      booking_number: "{{test_drive_booking_number}}",
      customer_id: "{{customer_id}}",
      lead_id: "{{lead_id}}",
      location_id: "{{selected_location_id}}",
      variant_id: "{{selected_variant_id}}",
      variant_name: "{{selected_variant_name}}",
      slot_id: "{{selected_test_drive_slot_id}}",
      booking_mode: "{{test_drive_mode}}",
      scheduled_date: "{{selected_test_drive_date}}",
      scheduled_time: "{{selected_test_drive_time}}",
      scheduled_at: "{{test_drive_scheduled_at}}",
      status: "confirmed",
      salesperson_id: "{{salesperson_id}}",
      address_summary: "{{test_drive_address_summary}}"
    },
    schema: schemas.testDriveBookings,
    uniqueKey: "booking_id",
    idempotencyKey: "{{test_drive_booking_id}}",
    outputVar: "test_drive_booking_record_result"
  })
);
node(
  "test_drive_slot_book_record",
  "record",
  15720,
  540,
  recordData({
    action: "update",
    collection: "test_drive_slots",
    where: { slot_id: "{{selected_test_drive_slot_id}}" },
    data: {
      slot_id: "{{selected_test_drive_slot_id}}",
      location_id: "{{selected_location_id}}",
      variant_id: "{{selected_variant_id}}",
      test_drive_vehicle_id: "{{selected_test_drive_vehicle_id}}",
      date: "{{selected_test_drive_date}}",
      start: "{{selected_test_drive_time}}",
      end: "{{selected_test_drive_end}}",
      label: "{{selected_test_drive_time}} - {{selected_test_drive_end}}",
      status: "booked",
      hold_id: "{{test_drive_hold_id}}",
      held_by_session: "{{system.sessionId}}",
      hold_expires_at: "{{test_drive_hold_expires_at}}",
      booking_id: "{{test_drive_booking_id}}"
    },
    schema: schemas.testDriveSlots,
    uniqueKey: "slot_id",
    idempotencyKey: "{{selected_test_drive_slot_id}}:booked",
    outputVar: "test_drive_slot_book_result"
  })
);
node(
  "lead_upsert_final",
  "record",
  15960,
  540,
  recordData({
    action: "upsert",
    collection: "automobile_leads",
    where: { lead_id: "{{lead_id}}" },
    data: {
      lead_id: "{{lead_id}}",
      customer_id: "{{customer_id}}",
      source_channel: "{{system.channel}}",
      status: "{{lead_status}}",
      stage: "{{lead_stage}}",
      requirement_summary: "{{requirement_summary}}",
      body_type: "{{body_type}}",
      budget_max: "{{budget_max}}",
      fuel_preference: "{{fuel_preference}}",
      transmission_preference: "{{transmission_preference}}",
      usage_type: "{{usage_type}}",
      purchase_timeline: "{{purchase_timeline}}",
      finance_interest: "{{finance_interest}}",
      exchange_interest: "{{exchange_interest}}",
      lead_score: "{{lead_score}}",
      lead_temperature: "{{lead_temperature}}",
      selected_variant_id: "{{selected_variant_id}}",
      selected_variant_name: "{{selected_variant_name}}",
      assigned_salesperson_id: "{{salesperson_id}}",
      last_activity_at: "{{test_drive_scheduled_at}}"
    },
    schema: schemas.leads,
    uniqueKey: "lead_id",
    idempotencyKey: "{{lead_id}}:final",
    outputVar: "lead_upsert_final_result"
  })
);
node(
  "lead_assignment_record",
  "record",
  16200,
  540,
  recordData({
    action: "upsert",
    collection: "automobile_lead_assignments",
    where: { assignment_id: "{{lead_assignment_id}}" },
    data: {
      assignment_id: "{{lead_assignment_id}}",
      lead_id: "{{lead_id}}",
      salesperson_id: "{{salesperson_id}}",
      assignment_reason: "{{assignment_reason}}",
      assigned_at: "{{test_drive_scheduled_at}}"
    },
    schema: schemas.leadAssignments,
    uniqueKey: "assignment_id",
    idempotencyKey: "{{lead_assignment_id}}",
    outputVar: "lead_assignment_record_result"
  })
);
node(
  "lead_activity_record",
  "record",
  16440,
  540,
  recordData({
    action: "upsert",
    collection: "automobile_lead_activities",
    where: { activity_id: "{{lead_id}}-test-drive-booked" },
    data: {
      activity_id: "{{lead_id}}-test-drive-booked",
      lead_id: "{{lead_id}}",
      customer_id: "{{customer_id}}",
      variant_id: "{{selected_variant_id}}",
      activity_type: "test_drive_booked",
      summary: "{{selected_variant_name}} | {{selected_test_drive_date}} {{selected_test_drive_time}} | {{selected_location_name}}",
      occurred_at: "{{test_drive_scheduled_at}}"
    },
    schema: schemas.leadActivities,
    uniqueKey: "activity_id",
    idempotencyKey: "{{lead_id}}:activity:test-drive",
    outputVar: "lead_activity_record_result"
  })
);
node(
  "test_drive_customer_notification",
  "notification",
  16680,
  540,
  notificationData({
    recipients: [
      { type: "customer", phone: "{{customer_phone_e164}}", email: "{{customer_email}}" }
    ],
    channels: [
      {
        type: "sms",
        enabled: true,
        message:
          "Your test drive is confirmed. Booking {{test_drive_booking_number}} | {{selected_variant_name}} | {{selected_test_drive_date}} {{selected_test_drive_time}} | {{selected_location_name}}."
      },
      {
        type: "email",
        enabled: true,
        subject: "Your test drive is confirmed",
        body:
          "Booking: {{test_drive_booking_number}}\\nVehicle: {{selected_variant_name}}\\nDate: {{selected_test_drive_date}}\\nTime: {{selected_test_drive_time}}\\nLocation: {{selected_location_name}}\\nAdvisor: {{salesperson_name}}"
      }
    ],
    outputVar: "test_drive_customer_notification_result",
    dedupeKey: "{{test_drive_booking_id}}:customer-confirmation"
  })
);
node(
  "test_drive_reminder_24h",
  "scheduler",
  16920,
  540,
  schedulerData({
    runAt: "{{test_drive_scheduled_at}}",
    offsetValue: 24,
    offsetUnit: "hours",
    offsetDirection: "before",
    payload: {
      type: "test_drive_reminder_24h",
      booking_id: "{{test_drive_booking_id}}",
      lead_id: "{{lead_id}}"
    },
    outputVar: "test_drive_reminder_24h_result",
    dedupeKey: "{{test_drive_booking_id}}:24h"
  })
);
node(
  "test_drive_reminder_2h",
  "scheduler",
  17160,
  540,
  schedulerData({
    runAt: "{{test_drive_scheduled_at}}",
    offsetValue: 2,
    offsetUnit: "hours",
    offsetDirection: "before",
    payload: {
      type: "test_drive_reminder_2h",
      booking_id: "{{test_drive_booking_id}}",
      lead_id: "{{lead_id}}"
    },
    outputVar: "test_drive_reminder_2h_result",
    dedupeKey: "{{test_drive_booking_id}}:2h"
  })
);
node(
  "test_drive_sales_notification",
  "notification",
  17400,
  540,
  notificationData({
    recipients: [
      { type: "salesperson", phone: "{{salesperson_phone}}", email: "{{salesperson_email}}" }
    ],
    channels: [
      {
        type: "sms",
        enabled: true,
        message:
          "New test drive: {{customer_name}} | {{customer_phone_e164}} | {{selected_variant_name}} | {{selected_test_drive_date}} {{selected_test_drive_time}} | timeline {{purchase_timeline}} | score {{lead_score}}."
      }
    ],
    outputVar: "test_drive_sales_notification_result",
    dedupeKey: "{{test_drive_booking_id}}:sales-notification"
  })
);
node(
  "test_drive_final_message",
  "message",
  17640,
  540,
  msgData(
    "Your test drive is confirmed 🎉\\n\\nBooking: {{test_drive_booking_number}}\\nVehicle: {{selected_variant_name}}\\nShowroom: {{selected_location_name}}\\nDate: {{selected_test_drive_date}}\\nTime: {{selected_test_drive_time}}\\nAdvisor: {{salesperson_name}}\\n\\nYou and the assigned salesperson will both receive reminders automatically."
  )
);
node("test_drive_end", "end", 17880, 540, { messages: [] });

node(
  "test_drive_identity_intro",
  "message",
  1560,
  160,
  msgData("Please verify the registered mobile number for your existing test-drive booking.")
);
node(
  "service_identity_intro",
  "message",
  1560,
  300,
  msgData("Please verify the registered mobile number so I can work with your service booking, estimate, or payment details.")
);
node(
  "verified_mobile_input",
  "input",
  1800,
  220,
  inputData("Enter the registered mobile number.", "customer_phone_input", [], false)
);
node("normalize_verified_phone", "script", 2040, 220, scriptData(normalizePhoneScript("customer_phone_input"), "normalize_verified_phone_result"));
node("send_otp_message", "message", 2280, 220, msgData("For security, please enter the 6-digit OTP sent to your registered mobile number."));
node("otp_input_1", "input", 2520, 220, inputData("Enter the 6-digit OTP.", "otp_input", [], false));
node("otp_validate_1", "script", 2760, 220, scriptData(otpValidationScript("otp_input"), "otp_validate_1_result"));
node("otp_switch_1", "switch", 3000, 220, switchData("verification_status"));
node("otp_invalid_message_1", "message", 3240, 160, msgData("That OTP format was invalid. Please enter exactly 6 digits."));
node("otp_input_2", "input", 3480, 160, inputData("Enter the 6-digit OTP again.", "otp_input_2", [], false));
node("otp_validate_2", "script", 3720, 160, scriptData(otpValidationScript("otp_input_2"), "otp_validate_2_result"));
node("otp_switch_2", "switch", 3960, 160, switchData("verification_status"));
node("otp_invalid_message_2", "message", 4200, 100, msgData("That OTP format was still invalid. Please enter exactly 6 digits."));
node("otp_input_3", "input", 4440, 100, inputData("Enter the 6-digit OTP one last time.", "otp_input_3", [], false));
node("otp_validate_3", "script", 4680, 100, scriptData(otpValidationScript("otp_input_3"), "otp_validate_3_result"));
node("otp_switch_3", "switch", 4920, 100, switchData("verification_status"));
node("otp_max_attempts_message", "message", 5160, 40, msgData("I could not verify the OTP format after 3 attempts. Please restart when you are ready."));
node("otp_max_attempts_end", "end", 5400, 40, { messages: [] });
node(
  "verified_customer_lookup",
  "record",
  5160,
  220,
  recordData({
    action: "list",
    collection: "automobile_customers",
    where: { phone_e164: "{{customer_phone_e164}}" },
    schema: schemas.customers,
    outputVar: "customer_lookup_result",
    limit: 5,
    sortBy: "full_name",
    sortOrder: "asc"
  })
);
node("hydrate_verified_customer", "script", 5400, 220, scriptData(hydrateCustomerScript, "hydrate_verified_customer_result"));
node("verified_customer_switch", "switch", 5640, 220, switchData("customer_lookup_status"));
node("verified_customer_route_script", "script", 5880, 220, scriptData(verifiedCustomerRouteScript, "verified_customer_route_result"));
node("verified_customer_route_switch", "switch", 6120, 220, switchData("verified_customer_route"));
node(
  "verified_customer_not_found_message",
  "message",
  5880,
  160,
  msgData("I could not find a customer profile for that verified mobile number.")
);
node("verified_customer_not_found_route_switch", "switch", 6120, 160, switchData("service_journey_mode"));
node("verified_customer_not_found_end", "end", 6120, 160, { messages: [] });

node(
  "service_new_customer_form",
  "form",
  5880,
  280,
  formData("I could not find a profile. Share the owner and vehicle details to create a service booking.", serviceGuestFields, "service_new_customer_form_result")
);
node(
  "service_new_customer_record",
  "record",
  6120,
  280,
  recordData({
    action: "upsert",
    collection: "automobile_customers",
    where: { phone_e164: "{{customer_phone_e164}}" },
    data: {
      customer_id: "{{customer_id}}",
      full_name: "{{customer_name}}",
      phone_e164: "{{customer_phone_e164}}",
      email: "{{customer_email}}",
      city: "{{customer_city}}",
      preferred_language: "en",
      last_sales_lead_id: "{{lead_id}}",
      last_vehicle_id: "{{service_vehicle_registration_number}}"
    },
    schema: schemas.customers,
    uniqueKey: "customer_id",
    idempotencyKey: "{{customer_phone_last10}}:service-customer",
    outputVar: "service_new_customer_record_result"
  })
);
node(
  "service_new_vehicle_record",
  "record",
  6360,
  280,
  recordData({
    action: "upsert",
    collection: "customer_vehicles",
    where: { registration_number: "{{service_vehicle_registration_number}}" },
    data: {
      vehicle_id: "{{customer_phone_last10}}-vehicle",
      customer_id: "{{customer_id}}",
      variant_id: "",
      model_name: "{{service_vehicle_model_name}}",
      registration_number: "{{service_vehicle_registration_number}}",
      manufacturing_year: "2024",
      status: "active",
      odometer_km: "0"
    },
    schema: schemas.customerVehicles,
    uniqueKey: "vehicle_id",
    idempotencyKey: "{{customer_phone_last10}}:service-vehicle",
    outputVar: "service_new_vehicle_record_result"
  })
);
node(
  "customer_vehicle_list",
  "record",
  6600,
  220,
  recordData({
    action: "list",
    collection: "customer_vehicles",
    where: { customer_id: "{{customer_id}}" },
    schema: schemas.customerVehicles,
    outputVar: "customer_vehicle_list_result",
    limit: 10,
    sortBy: "registration_number",
    sortOrder: "asc"
  })
);
node("customer_vehicle_options_script", "script", 6840, 220, scriptData(customerVehicleOptionsScript, "customer_vehicle_options_result"));
node("customer_vehicle_switch", "switch", 7080, 220, switchData("service_vehicle_selection_status"));
node(
  "customer_vehicle_choice_input",
  "input",
  7320,
  160,
  inputData(
    "Choose the vehicle.\\n\\n{{service_vehicle_options_text}}",
    "service_vehicle_choice",
    [],
    false
  )
);
node("select_service_vehicle_script", "script", 7560, 160, scriptData(selectServiceVehicleScript, "select_service_vehicle_result"));
node("select_service_vehicle_switch", "switch", 7800, 160, switchData("service_vehicle_choice_status"));
node("service_no_vehicle_message", "message", 7320, 280, msgData("I could not find an active vehicle for this customer profile."));
node("service_no_vehicle_end", "end", 7560, 280, { messages: [] });
node("service_route_switch", "switch", 8040, 220, switchData("service_journey_mode"));

node(
  "service_type_input",
  "input",
  8280,
  380,
  inputData(
    "What kind of service do you need for {{selected_service_vehicle_display}}?",
    "service_type",
    [
      { label: "🛠️ Periodic Service", value: "periodic_service" },
      { label: "⚠️ Repair / Problem", value: "repair" },
      { label: "🛞 Tyre / Alignment", value: "tyre_alignment" },
      { label: "❄️ AC", value: "ac" }
    ],
    true
  )
);
node(
  "service_location_list",
  "record",
  8520,
  380,
  recordData({
    action: "list",
    collection: "dealership_locations",
    where: { active: true },
    schema: schemas.locations,
    outputVar: "location_list_result",
    limit: 20,
    sortBy: "location_name",
    sortOrder: "asc"
  })
);
node("service_center_options_script", "script", 8760, 380, scriptData(serviceCenterOptionsScript, "service_center_options_result"));
node("service_center_option_switch", "switch", 9000, 380, switchData("service_center_option_status"));
node(
  "service_center_choice_input",
  "input",
  9240,
  380,
  inputData(
    "Choose the service center.\\n\\n{{service_center_options_text}}",
    "service_center_choice",
    [],
    false
  )
);
node("select_service_center_script", "script", 9480, 380, scriptData(selectServiceCenterScript, "select_service_center_result"));
node("select_service_center_switch", "switch", 9720, 380, switchData("service_center_selection_status"));
node("service_center_invalid_message", "message", 9960, 320, msgData("That service-center selection was invalid. Please restart and choose one of the listed centers."));
node("service_center_invalid_end", "end", 10200, 320, { messages: [] });
node(
  "service_slot_list",
  "record",
  9960,
  380,
  recordData({
    action: "list",
    collection: "service_slots",
    where: { status: "available" },
    schema: schemas.serviceSlots,
    outputVar: "service_slot_list_result",
    limit: 40,
    sortBy: "date",
    sortOrder: "asc"
  })
);
node("build_service_slots", "script", 10200, 380, scriptData(buildServiceSlotsScript, "build_service_slots_result"));
node("service_slot_status_switch", "switch", 10440, 380, switchData("service_slot_status"));
node(
  "service_no_slots_message",
  "message",
  10680,
  320,
  msgData("I do not have a live service slot for that center and service type right now.")
);
node("service_no_slots_end", "end", 10920, 320, { messages: [] });
node(
  "service_slot_picker",
  "appointment",
  10680,
  440,
  appointmentData(
    "Choose the service slot.",
    "service_future_slots",
    "service_slot_pick",
    {
      dateVar: "selected_service_date",
      horizonDays: 14,
      maxSlotsPerDay: 16,
      slotDurationMins: 90,
      slotIntervalMins: 30,
      disableGeneratedFallback: true
    }
  )
);
node("prepare_service_booking", "script", 10920, 440, scriptData(prepareServiceBookingScript, "prepare_service_booking_result"));
node(
  "service_slot_hold_record",
  "record",
  11160,
  440,
  recordData({
    action: "update",
    collection: "service_slots",
    where: { slot_id: "{{selected_service_slot_id}}" },
    data: {
      slot_id: "{{selected_service_slot_id}}",
      service_center_id: "{{selected_service_center_id}}",
      service_category: "{{service_type}}",
      date: "{{selected_service_date}}",
      start: "{{selected_service_time}}",
      end: "{{selected_service_end}}",
      label: "{{selected_service_time}} - {{selected_service_end}}",
      capacity: "1",
      remaining_capacity: "0",
      status: "held",
      hold_id: "{{service_slot_hold_id}}",
      held_by_session: "{{system.sessionId}}",
      hold_expires_at: "{{service_slot_hold_expires_at}}",
      booking_id: ""
    },
    schema: schemas.serviceSlots,
    uniqueKey: "slot_id",
    idempotencyKey: "{{selected_service_slot_id}}:hold",
    outputVar: "service_slot_hold_result"
  })
);
node(
  "pickup_type_input",
  "input",
  11400,
  440,
  inputData(
    "How will the vehicle reach the service center?",
    "pickup_type",
    [
      { label: "Drive to Service Center", value: "drive_to_center" },
      { label: "Pickup & Drop", value: "pickup_drop" }
    ],
    true
  )
);
node(
  "pickup_address_form",
  "form",
  11640,
  500,
  formData(
    "Share the pickup address.",
    [
      { key: "pickup_address", label: "Address", type: "text", required: true },
      { key: "pickup_landmark", label: "Landmark", type: "text", required: false }
    ],
    "pickup_address_form_result"
  )
);
node(
  "service_confirm_input",
  "input",
  11880,
  440,
  inputData(
    "Confirm the service booking\\n\\nVehicle: {{selected_service_vehicle_display}}\\nCenter: {{selected_service_center_name}}\\nDate: {{selected_service_date}}\\nTime: {{selected_service_time}}\\nType: {{service_type}}\\nPickup: {{pickup_type}}",
    "confirm_service_booking",
    yesNoButtons(),
    true
  )
);
node(
  "service_slot_release_record",
  "record",
  12120,
  520,
  recordData({
    action: "update",
    collection: "service_slots",
    where: { slot_id: "{{selected_service_slot_id}}" },
    data: {
      slot_id: "{{selected_service_slot_id}}",
      service_center_id: "{{selected_service_center_id}}",
      service_category: "{{service_type}}",
      date: "{{selected_service_date}}",
      start: "{{selected_service_time}}",
      end: "{{selected_service_end}}",
      label: "{{selected_service_time}} - {{selected_service_end}}",
      capacity: "1",
      remaining_capacity: "1",
      status: "available",
      hold_id: "",
      held_by_session: "",
      hold_expires_at: "",
      booking_id: ""
    },
    schema: schemas.serviceSlots,
    uniqueKey: "slot_id",
    idempotencyKey: "{{selected_service_slot_id}}:release",
    outputVar: "service_slot_release_result"
  })
);
node("service_cancel_message", "message", 12360, 520, msgData("No problem. The held service slot has been released."));
node("service_cancel_end", "end", 12600, 520, { messages: [] });
node(
  "service_staff_list",
  "record",
  12120,
  440,
  recordData({
    action: "list",
    collection: "dealership_staff",
    where: { active: true },
    schema: schemas.staff,
    outputVar: "service_staff_list_result",
    limit: 20,
    sortBy: "active_leads",
    sortOrder: "asc"
  })
);
node("assign_service_advisor_script", "script", 12360, 440, scriptData(assignServiceAdvisorScript, "assign_service_advisor_result"));
node(
  "service_booking_record",
  "record",
  12600,
  440,
  recordData({
    action: "upsert",
    collection: "service_bookings",
    where: { booking_id: "{{service_booking_id}}" },
    data: {
      booking_id: "{{service_booking_id}}",
      booking_number: "{{service_booking_number}}",
      customer_id: "{{customer_id}}",
      vehicle_id: "{{selected_service_vehicle_id}}",
      service_center_id: "{{selected_service_center_id}}",
      slot_id: "{{selected_service_slot_id}}",
      service_type: "{{service_type}}",
      pickup_type: "{{pickup_type}}",
      scheduled_date: "{{selected_service_date}}",
      scheduled_time: "{{selected_service_time}}",
      status: "booked",
      advisor_id: "{{service_advisor_id}}",
      pickup_address: "{{pickup_address}}"
    },
    schema: schemas.serviceBookings,
    uniqueKey: "booking_id",
    idempotencyKey: "{{service_booking_id}}",
    outputVar: "service_booking_record_result"
  })
);
node(
  "service_slot_book_record",
  "record",
  12840,
  440,
  recordData({
    action: "update",
    collection: "service_slots",
    where: { slot_id: "{{selected_service_slot_id}}" },
    data: {
      slot_id: "{{selected_service_slot_id}}",
      service_center_id: "{{selected_service_center_id}}",
      service_category: "{{service_type}}",
      date: "{{selected_service_date}}",
      start: "{{selected_service_time}}",
      end: "{{selected_service_end}}",
      label: "{{selected_service_time}} - {{selected_service_end}}",
      capacity: "1",
      remaining_capacity: "0",
      status: "booked",
      hold_id: "{{service_slot_hold_id}}",
      held_by_session: "{{system.sessionId}}",
      hold_expires_at: "{{service_slot_hold_expires_at}}",
      booking_id: "{{service_booking_id}}"
    },
    schema: schemas.serviceSlots,
    uniqueKey: "slot_id",
    idempotencyKey: "{{selected_service_slot_id}}:booked",
    outputVar: "service_slot_book_result"
  })
);
node(
  "service_booking_notification",
  "notification",
  13080,
  440,
  notificationData({
    recipients: [
      { type: "customer", phone: "{{customer_phone_e164}}", email: "{{customer_email}}" }
    ],
    channels: [
      {
        type: "sms",
        enabled: true,
        message:
          "Service booking confirmed: {{service_booking_number}} | {{selected_service_vehicle_display}} | {{selected_service_date}} {{selected_service_time}} | {{selected_service_center_name}}."
      }
    ],
    outputVar: "service_booking_notification_result",
    dedupeKey: "{{service_booking_id}}:service-booking"
  })
);
node(
  "service_booking_final_message",
  "message",
  13320,
  440,
  msgData(
    "Service appointment confirmed\\n\\nBooking: {{service_booking_number}}\\nVehicle: {{selected_service_vehicle_display}}\\nService Center: {{selected_service_center_name}}\\nDate: {{selected_service_date}}\\nTime: {{selected_service_time}}\\nAdvisor: {{service_advisor_name}}"
  )
);
node("service_booking_end", "end", 13560, 440, { messages: [] });

node(
  "service_order_list",
  "record",
  8280,
  120,
  recordData({
    action: "list",
    collection: "service_orders",
    where: { customer_id: "{{customer_id}}" },
    schema: schemas.serviceOrders,
    outputVar: "service_order_list_result",
    limit: 20,
    sortBy: "estimated_completion_at",
    sortOrder: "desc"
  })
);
node("service_order_route_script", "script", 8520, 120, scriptData(serviceOrderRouteScript, "service_order_route_result"));
node("service_order_route_switch", "switch", 8760, 120, switchData("service_order_route_status"));
node("service_order_none_message", "message", 9000, -20, msgData("I could not find a matching active service order for that request right now."));
node("service_order_none_end", "end", 9240, -20, { messages: [] });
node(
  "service_track_message",
  "message",
  9000,
  40,
  msgData("{{selected_service_order_summary}}")
);
node("service_track_end", "end", 9240, 40, { messages: [] });
node(
  "service_estimate_list",
  "record",
  9000,
  120,
  recordData({
    action: "list",
    collection: "service_estimates",
    where: { status: "sent" },
    schema: schemas.serviceEstimates,
    outputVar: "service_estimate_list_result",
    limit: 20,
    sortBy: "version",
    sortOrder: "desc"
  })
);
node("service_estimate_script", "script", 9240, 120, scriptData(serviceEstimateScript, "service_estimate_result"));
node("service_estimate_switch", "switch", 9480, 120, switchData("service_estimate_status"));
node("service_estimate_none_message", "message", 9720, 180, msgData("I could not find a pending customer estimate for that service order."));
node("service_estimate_none_end", "end", 9960, 180, { messages: [] });
node("service_estimate_message", "message", 9720, 120, msgData("{{selected_estimate_summary}}"));
node(
  "service_estimate_action_input",
  "input",
  9960,
  120,
  inputData(
    "How would you like to respond?",
    "service_estimate_action",
    [
      { label: "Approve Estimate", value: "approve" },
      { label: "Decline Estimate", value: "decline" },
      { label: "Talk to Advisor", value: "talk" }
    ],
    true
  )
);
node("service_estimate_action_switch", "switch", 10200, 120, switchData("service_estimate_action"));
node(
  "service_estimate_approve_record",
  "record",
  10440,
  60,
  recordData({
    action: "update",
    collection: "service_estimates",
    where: { estimate_id: "{{selected_estimate_id}}" },
    data: {
      estimate_id: "{{selected_estimate_id}}",
      service_order_id: "{{selected_service_order_id}}",
      version: "1",
      total_amount: "{{selected_estimate_total}}",
      line_items_summary: "{{selected_estimate_summary}}",
      status: "approved"
    },
    schema: schemas.serviceEstimates,
    uniqueKey: "estimate_id",
    idempotencyKey: "{{selected_estimate_id}}:approve",
    outputVar: "service_estimate_approve_result"
  })
);
node("service_estimate_approved_message", "message", 10680, 60, msgData("The estimate has been marked approved. The workshop can continue without waiting for a callback."));
node("service_estimate_approved_end", "end", 10920, 60, { messages: [] });
node(
  "service_estimate_decline_record",
  "record",
  10440,
  120,
  recordData({
    action: "update",
    collection: "service_estimates",
    where: { estimate_id: "{{selected_estimate_id}}" },
    data: {
      estimate_id: "{{selected_estimate_id}}",
      service_order_id: "{{selected_service_order_id}}",
      version: "1",
      total_amount: "{{selected_estimate_total}}",
      line_items_summary: "{{selected_estimate_summary}}",
      status: "customer_review_required"
    },
    schema: schemas.serviceEstimates,
    uniqueKey: "estimate_id",
    idempotencyKey: "{{selected_estimate_id}}:decline",
    outputVar: "service_estimate_decline_result"
  })
);
node("service_estimate_declined_message", "message", 10680, 120, msgData("The estimate has been marked for advisor review. A service advisor should follow up with context."));
node("service_estimate_declined_end", "end", 10920, 120, { messages: [] });
node("service_estimate_talk_queue", "queue", 10440, 180, queueData("service_estimate_review", "high", "service,advisor", 15, "service_estimate_talk_queue_result"));
node("service_estimate_talk_handover", "handover", 10680, 180, handoverData("Connecting you to a service advisor with the estimate context."));

node("payment_context_script", "script", 9000, 260, scriptData(paymentContextScript, "payment_context_result"));
node(
  "service_payment",
  "payment",
  9240,
  260,
  paymentData({
    amount: "{{service_payment_amount}}",
    description: "{{service_payment_description}}",
    outputVar: "service_payment_result"
  })
);
node(
  "service_payment_record",
  "record",
  9480,
  260,
  recordData({
    action: "upsert",
    collection: "service_payments",
    where: { payment_id: "{{service_payment_id}}" },
    data: {
      payment_id: "{{service_payment_id}}",
      service_order_id: "{{selected_service_order_id}}",
      customer_id: "{{customer_id}}",
      amount: "{{service_payment_amount}}",
      currency: "{{default_currency}}",
      status: "paid",
      provider_reference: "{{service_payment_id}}"
    },
    schema: schemas.servicePayments,
    uniqueKey: "payment_id",
    idempotencyKey: "{{service_payment_id}}",
    outputVar: "service_payment_record_result"
  })
);
node(
  "service_order_paid_update",
  "record",
  9720,
  260,
  recordData({
    action: "update",
    collection: "service_orders",
    where: { service_order_id: "{{selected_service_order_id}}" },
    data: {
      service_order_id: "{{selected_service_order_id}}",
      service_booking_id: "",
      customer_id: "{{customer_id}}",
      vehicle_id: "{{selected_service_vehicle_id}}",
      service_center_id: "{{selected_service_center_id}}",
      advisor_id: "{{service_advisor_id}}",
      status: "ready_for_delivery",
      current_stage: "payment_completed",
      payment_status: "paid",
      total_amount: "{{selected_service_order_total_amount}}",
      timeline_summary: "{{selected_service_order_summary}}",
      estimated_completion_at: ""
    },
    schema: schemas.serviceOrders,
    uniqueKey: "service_order_id",
    idempotencyKey: "{{selected_service_order_id}}:paid",
    outputVar: "service_order_paid_update_result"
  })
);
node(
  "service_payment_notification",
  "notification",
  9960,
  260,
  notificationData({
    recipients: [
      { type: "customer", phone: "{{customer_phone_e164}}", email: "{{customer_email}}" }
    ],
    channels: [
      {
        type: "sms",
        enabled: true,
        message:
          "Payment received for service order {{selected_service_order_id}}. Your vehicle is ready for delivery."
      }
    ],
    outputVar: "service_payment_notification_result",
    dedupeKey: "{{service_payment_id}}:paid"
  })
);
node(
  "service_payment_message",
  "message",
  10200,
  260,
  msgData("Payment received. Your vehicle is ready for delivery or pickup.")
);
node("service_payment_end", "end", 10440, 260, { messages: [] });

node(
  "vehicle_questions_input",
  "input",
  1560,
  580,
  inputData("Ask your vehicle question.", "vehicle_question", [], false)
);
node("vehicle_faq_ai", "ai-grounded", 1800, 580, {
  contextTemplate:
    "Use only grounded dealership knowledge for vehicle variants, features, mileage, colors, warranty coverage, offers, finance policies, exchange policy, and service packages. Never invent a feature or confirm stock that is not in maintained records.",
  inputTemplate: "{{vehicle_question}}",
  instructions:
    "Answer conservatively. If the question requires a customer-specific booking, service, or live operational lookup, use the fallback response.",
  responseStyle: "concise",
  strictGrounding: true,
  includeCitations: false,
  includeCitationsInResponse: false,
  responseTemplate: "",
  fallbackResponseTemplate:
    "I do not have enough verified dealership data to answer that safely without the maintained records.",
  fallbackMessage:
    "I do not have enough verified dealership data to answer that safely without the maintained records.",
  outputVar: "vehicle_faq_ai_result",
  answerVar: "vehicle_faq_answer",
  answerKeyValueVar: "vehicle_faq_answer_key",
  emitResponse: false
});
node("vehicle_faq_answer_message", "message", 2040, 580, msgData("{{vehicle_faq_answer}}"));
node("vehicle_faq_end", "end", 2280, 580, { messages: [] });

node("roadside_form", "form", 1560, 720, formData("Share the roadside assistance details.", roadsideFields, "roadside_form_result"));
node("roadside_queue", "queue", 1800, 720, queueData("roadside_assistance", "critical", "roadside,safety,towing", 5, "roadside_queue_result"));
node("roadside_handover", "handover", 2040, 720, handoverData("Connecting you to roadside assistance now with the breakdown context captured."));

node("talk_advisor_form", "form", 1560, 860, formData("Share the context for the advisor handoff.", talkAdvisorFields, "talk_advisor_form_result"));
node("talk_advisor_queue", "queue", 1800, 860, queueData("automobile_advisor_support", "normal", "sales,service", 15, "talk_advisor_queue_result"));
node("talk_advisor_handover", "handover", 2040, 860, handoverData("Connecting you to an advisor with the captured context."));

node("unknown_ai", "ai-grounded", 1560, 1000, {
  contextTemplate:
    "Automobile support scope: discovery, comparison, offers, brochures, test drives, finance, exchange, service booking, service status, estimates, payments, warranty, and roadside assistance. Never invent prices, stock, service status, or payment confirmation.",
  inputTemplate: "{{main_user_request}}",
  instructions:
    "Answer only when the request is safely covered by dealership support knowledge. If it needs a verified booking, payment, or operational lookup, use the fallback response.",
  responseStyle: "concise",
  strictGrounding: true,
  includeCitations: false,
  includeCitationsInResponse: false,
  responseTemplate: "",
  fallbackResponseTemplate:
    "I need a more specific sales or service request to continue safely.",
  fallbackMessage:
    "I need a more specific sales or service request to continue safely.",
  outputVar: "unknown_ai_result",
  answerVar: "unknown_answer",
  answerKeyValueVar: "unknown_answer_key",
  emitResponse: false
});
node("unknown_answer_message", "message", 1800, 1000, msgData("{{unknown_answer}}"));
node("unknown_end", "end", 2040, 1000, { messages: [] });

node("system_failure_message", "message", 1560, 1140, msgData("I could not complete that step because the operational data or persistence layer did not respond cleanly. I am forwarding the context so your request does not stall."));
node("system_failure_handover", "handover", 1800, 1140, handoverData("Connecting this conversation to the dealership operations team now."));

edge("start_1", "set_template_defaults", { label: "next" });
edge("set_template_defaults", "welcome_message", { label: "next" });
edge("welcome_message", "main_menu_input", { label: "next" });
edge("main_menu_input", "main_intent_router", { label: "next" });

edgeValue("main_intent_router", "explore_vehicles", "set_goal_explore", "explore_vehicles");
edgeValue("main_intent_router", "find_my_car", "set_goal_find", "find_my_car");
edgeValue("main_intent_router", "compare_models", "set_goal_compare", "compare_models");
edgeValue("main_intent_router", "price_offers", "set_goal_price", "price_offers");
edgeValue("main_intent_router", "download_brochure", "set_goal_brochure", "download_brochure");
edgeValue("main_intent_router", "book_test_drive", "set_goal_test_drive", "book_test_drive");
edgeValue("main_intent_router", "showroom_visit", "set_goal_showroom_visit", "showroom_visit");
edgeValue("main_intent_router", "exchange_my_car", "set_goal_exchange", "exchange_my_car");
edgeValue("main_intent_router", "finance_emi", "set_goal_finance", "finance_emi");
edgeValue("main_intent_router", "check_vehicle_availability", "set_goal_availability", "check_vehicle_availability");
edgeValue("main_intent_router", "my_test_drive_booking", "set_goal_my_test_drive", "my_test_drive_booking");
edgeValue("main_intent_router", "book_vehicle_service", "set_service_booking_mode", "book_vehicle_service");
edgeValue("main_intent_router", "service_estimate", "set_service_estimate_mode", "service_estimate");
edgeValue("main_intent_router", "track_service_status", "set_service_track_mode", "track_service_status");
edgeValue("main_intent_router", "pay_service_bill", "set_service_payment_mode", "pay_service_bill");
edgeValue("main_intent_router", "vehicle_questions", "vehicle_questions_input", "vehicle_questions");
edgeValue("main_intent_router", "warranty_rsa", "roadside_form", "warranty_rsa");
edgeValue("main_intent_router", "talk_to_advisor", "talk_advisor_form", "talk_to_advisor");
edge("main_intent_router", "unknown_ai", { isDefault: true, label: "unknown/default" });

edge("set_goal_explore", "sales_intro_message", { label: "next" });
edge("set_goal_find", "sales_intro_message", { label: "next" });
edge("set_goal_compare", "sales_intro_message", { label: "next" });
edge("set_goal_price", "sales_intro_message", { label: "next" });
edge("set_goal_brochure", "sales_intro_message", { label: "next" });
edge("set_goal_test_drive", "sales_intro_message", { label: "next" });
edge("set_goal_showroom_visit", "sales_intro_message", { label: "next" });
edge("set_goal_exchange", "sales_intro_message", { label: "next" });
edge("set_goal_finance", "sales_intro_message", { label: "next" });
edge("set_goal_availability", "sales_intro_message", { label: "next" });
edge("sales_intro_message", "vehicle_requirement_input", { label: "next" });
edge("vehicle_requirement_input", "parse_vehicle_requirement", { label: "next" });
scriptRoutes("parse_vehicle_requirement", "usage_switch", "system_failure_message");
edgeValue("usage_switch", "no", "fuel_switch", "no");
edge("usage_switch", "usage_input", { isDefault: true, label: "yes/default" });
edge("usage_input", "fuel_switch", { label: "next" });
edgeValue("fuel_switch", "no", "transmission_switch", "no");
edge("fuel_switch", "fuel_input", { isDefault: true, label: "yes/default" });
edge("fuel_input", "transmission_switch", { label: "next" });
edgeValue("transmission_switch", "no", "budget_switch", "no");
edge("transmission_switch", "transmission_input", { isDefault: true, label: "yes/default" });
edge("transmission_input", "budget_switch", { label: "next" });
edgeValue("budget_switch", "no", "timeline_switch", "no");
edge("budget_switch", "budget_input", { isDefault: true, label: "yes/default" });
edge("budget_input", "normalize_budget", { label: "next" });
scriptRoutes("normalize_budget", "timeline_switch", "system_failure_message");
edgeValue("timeline_switch", "no", "prepare_lead_script", "no");
edge("timeline_switch", "timeline_input", { isDefault: true, label: "yes/default" });
edge("timeline_input", "prepare_lead_script", { label: "next" });
scriptRoutes("prepare_lead_script", "lead_upsert_discovery", "system_failure_message");
recordRoutes("lead_upsert_discovery", "variant_inventory_list", "system_failure_message");
recordRoutes("variant_inventory_list", "match_vehicle_script", "system_failure_message");
scriptRoutes("match_vehicle_script", "vehicle_match_switch", "system_failure_message");
edgeValue("vehicle_match_switch", "exact", "vehicle_carousel", "exact");
edgeValue("vehicle_match_switch", "alternative", "vehicle_close_match_message", "alternative");
edge("vehicle_match_switch", "vehicle_no_match_message", { isDefault: true, label: "none/default" });
edge("vehicle_close_match_message", "vehicle_carousel", { label: "next" });
edge("vehicle_no_match_message", "vehicle_no_match_end", { label: "next" });
edge("vehicle_carousel", "variant_select_input", { label: "next" });
edge("variant_select_input", "select_variant_script", { label: "next" });
scriptRoutes("select_variant_script", "selected_variant_switch", "system_failure_message");
edgeValue("selected_variant_switch", "selected", "selected_variant_message", "selected");
edge("selected_variant_switch", "vehicle_no_match_message", { isDefault: true, label: "invalid/default" });
edge("selected_variant_message", "post_variant_goal_switch", { label: "next" });

edgeValue("post_variant_goal_switch", "price_offers", "pricing_city_input", "price_offers");
edgeValue("post_variant_goal_switch", "download_brochure", "brochure_message", "download_brochure");
edgeValue("post_variant_goal_switch", "compare_models", "compare_variant_input", "compare_models");
edgeValue("post_variant_goal_switch", "book_test_drive", "test_drive_mobile_input", "book_test_drive");
edgeValue("post_variant_goal_switch", "showroom_visit", "test_drive_mobile_input", "showroom_visit");
edgeValue("post_variant_goal_switch", "finance_emi", "finance_form", "finance_emi");
edgeValue("post_variant_goal_switch", "exchange_my_car", "exchange_form", "exchange_my_car");
edgeValue("post_variant_goal_switch", "check_vehicle_availability", "availability_message", "check_vehicle_availability");
edge("post_variant_goal_switch", "generic_action_input", { isDefault: true, label: "explore/default" });
edge("generic_action_input", "generic_action_switch", { label: "next" });
edgeValue("generic_action_switch", "price_offers", "pricing_city_input", "price_offers");
edgeValue("generic_action_switch", "download_brochure", "brochure_message", "download_brochure");
edgeValue("generic_action_switch", "compare_models", "compare_variant_input", "compare_models");
edgeValue("generic_action_switch", "book_test_drive", "test_drive_mobile_input", "book_test_drive");
edgeValue("generic_action_switch", "finance_emi", "finance_form", "finance_emi");
edge("generic_action_switch", "exchange_form", { isDefault: true, label: "exchange/default" });

edge("pricing_city_input", "vehicle_offer_list", { label: "next" });
recordRoutes("vehicle_offer_list", "price_calc_script", "system_failure_message");
scriptRoutes("price_calc_script", "price_summary_message", "system_failure_message");
edge("price_summary_message", "price_next_input", { label: "next" });
edge("price_next_input", "price_next_switch", { label: "next" });
edgeValue("price_next_switch", "finance_emi", "finance_form", "finance_emi");
edgeValue("price_next_switch", "exchange_my_car", "exchange_form", "exchange_my_car");
edge("price_next_switch", "test_drive_mobile_input", { isDefault: true, label: "book_test_drive/default" });

edge("brochure_message", "brochure_end", { label: "next" });
edge("availability_message", "availability_end", { label: "next" });

edge("compare_variant_input", "select_compare_variant_script", { label: "next" });
scriptRoutes("select_compare_variant_script", "compare_variant_switch", "system_failure_message");
edgeValue("compare_variant_switch", "selected", "compare_summary_message", "selected");
edge("compare_variant_switch", "vehicle_no_match_message", { isDefault: true, label: "invalid/default" });
edge("compare_summary_message", "compare_next_input", { label: "next" });
edge("compare_next_input", "compare_next_switch", { label: "next" });
edgeValue("compare_next_switch", "price_offers", "pricing_city_input", "price_offers");
edge("compare_next_switch", "test_drive_mobile_input", { isDefault: true, label: "book_test_drive/default" });

edge("finance_form", "emi_script", { label: "next" });
scriptRoutes("emi_script", "finance_record", "system_failure_message");
recordRoutes("finance_record", "finance_message", "system_failure_message");
edge("finance_message", "finance_end", { label: "next" });

edge("exchange_form", "exchange_record", { label: "next" });
recordRoutes("exchange_record", "exchange_message", "system_failure_message");
edge("exchange_message", "exchange_end", { label: "next" });

edge("test_drive_mobile_input", "normalize_test_drive_phone", { label: "next" });
scriptRoutes("normalize_test_drive_phone", "sales_customer_lookup", "system_failure_message");
recordRoutes("sales_customer_lookup", "hydrate_sales_customer", "system_failure_message", "hydrate_sales_customer", "hydrate_sales_customer");
scriptRoutes("hydrate_sales_customer", "sales_customer_switch", "system_failure_message");
edgeValue("sales_customer_switch", "found", "returning_customer_message", "found");
edge("sales_customer_switch", "new_customer_form", { isDefault: true, label: "not_found/default" });
edge("returning_customer_message", "test_drive_booking_lookup", { label: "next" });
edge("new_customer_form", "customer_upsert", { label: "next" });
recordRoutes("customer_upsert", "test_drive_booking_lookup", "system_failure_message");
recordRoutes("test_drive_booking_lookup", "existing_test_drive_script", "system_failure_message");
scriptRoutes("existing_test_drive_script", "existing_test_drive_switch", "system_failure_message");
edgeValue("existing_test_drive_switch", "existing", "existing_test_drive_message", "existing");
edge("existing_test_drive_switch", "test_drive_mode_input", { isDefault: true, label: "clear/default" });
edge("existing_test_drive_message", "existing_test_drive_choice", { label: "next" });
edge("existing_test_drive_choice", "existing_test_drive_choice_switch", { label: "next" });
edgeValue("existing_test_drive_choice_switch", "keep", "existing_test_drive_end", "keep");
edge("existing_test_drive_choice_switch", "test_drive_mode_input", { isDefault: true, label: "book_another/default" });
edge("test_drive_mode_input", "location_list", { label: "showroom", condition: { operator: "equals", value: "showroom" } });
edge("test_drive_mode_input", "home_test_drive_form", { isDefault: true, label: "home/default" });
edge("home_test_drive_form", "location_list", { label: "next" });
recordRoutes("location_list", "location_options_script", "system_failure_message");
scriptRoutes("location_options_script", "location_options_switch", "system_failure_message");
edgeValue("location_options_switch", "available", "showroom_choice_input", "available");
edge("location_options_switch", "no_demo_vehicle_message", { isDefault: true, label: "none/default" });
edge("showroom_choice_input", "select_showroom_script", { label: "next" });
scriptRoutes("select_showroom_script", "showroom_select_switch", "system_failure_message");
edgeValue("showroom_select_switch", "selected", "test_drive_vehicle_list", "selected");
edge("showroom_select_switch", "showroom_invalid_message", { isDefault: true, label: "invalid/default" });
edge("showroom_invalid_message", "showroom_invalid_end", { label: "next" });
recordRoutes("test_drive_vehicle_list", "select_test_drive_vehicle", "system_failure_message");
scriptRoutes("select_test_drive_vehicle", "test_drive_vehicle_switch", "system_failure_message");
edgeValue("test_drive_vehicle_switch", "available", "test_drive_slot_list", "available");
edge("test_drive_vehicle_switch", "no_demo_vehicle_message", { isDefault: true, label: "unavailable/default" });
edge("no_demo_vehicle_message", "no_demo_vehicle_end", { label: "next" });
recordRoutes("test_drive_slot_list", "build_test_drive_slots", "system_failure_message");
scriptRoutes("build_test_drive_slots", "test_drive_slot_status_switch", "system_failure_message");
edgeValue("test_drive_slot_status_switch", "available", "test_drive_slot_picker", "available");
edge("test_drive_slot_status_switch", "test_drive_no_slots_message", { isDefault: true, label: "unavailable/default" });
edge("test_drive_no_slots_message", "test_drive_no_slots_end", { label: "next" });
edge("test_drive_slot_picker", "prepare_test_drive_booking", { label: "selected" });
scriptRoutes("prepare_test_drive_booking", "test_drive_slot_hold_record", "system_failure_message");
recordRoutes("test_drive_slot_hold_record", "test_drive_confirm_input", "system_failure_message");
edgeValue("test_drive_confirm_input", "yes", "sales_staff_list", "yes");
edge("test_drive_confirm_input", "test_drive_slot_release_record", { isDefault: true, label: "no/default" });
recordRoutes("test_drive_slot_release_record", "test_drive_cancel_message", "system_failure_message");
edge("test_drive_cancel_message", "test_drive_cancel_end", { label: "next" });
recordRoutes("sales_staff_list", "assign_salesperson_script", "system_failure_message");
scriptRoutes("assign_salesperson_script", "final_test_drive_score_script", "system_failure_message");
scriptRoutes("final_test_drive_score_script", "test_drive_booking_record", "system_failure_message");
recordRoutes("test_drive_booking_record", "test_drive_slot_book_record", "system_failure_message");
recordRoutes("test_drive_slot_book_record", "lead_upsert_final", "system_failure_message");
recordRoutes("lead_upsert_final", "lead_assignment_record", "system_failure_message");
recordRoutes("lead_assignment_record", "lead_activity_record", "system_failure_message");
recordRoutes("lead_activity_record", "test_drive_customer_notification", "system_failure_message");
notificationRoutes("test_drive_customer_notification", "test_drive_reminder_24h");
schedulerRoutes("test_drive_reminder_24h", "test_drive_reminder_2h");
schedulerRoutes("test_drive_reminder_2h", "test_drive_sales_notification");
notificationRoutes("test_drive_sales_notification", "test_drive_final_message");
edge("test_drive_final_message", "test_drive_end", { label: "next" });

edge("set_goal_my_test_drive", "test_drive_identity_intro", { label: "next" });
edge("set_service_booking_mode", "service_identity_intro", { label: "next" });
edge("set_service_estimate_mode", "service_identity_intro", { label: "next" });
edge("set_service_track_mode", "service_identity_intro", { label: "next" });
edge("set_service_payment_mode", "service_identity_intro", { label: "next" });
edge("test_drive_identity_intro", "verified_mobile_input", { label: "next" });
edge("service_identity_intro", "verified_mobile_input", { label: "next" });
edge("verified_mobile_input", "normalize_verified_phone", { label: "next" });
scriptRoutes("normalize_verified_phone", "send_otp_message", "system_failure_message");
edge("send_otp_message", "otp_input_1", { label: "next" });
edge("otp_input_1", "otp_validate_1", { label: "next" });
scriptRoutes("otp_validate_1", "otp_switch_1", "system_failure_message");
edgeValue("otp_switch_1", "valid", "verified_customer_lookup", "valid");
edge("otp_switch_1", "otp_invalid_message_1", { isDefault: true, label: "invalid/default" });
edge("otp_invalid_message_1", "otp_input_2", { label: "retry" });
edge("otp_input_2", "otp_validate_2", { label: "next" });
scriptRoutes("otp_validate_2", "otp_switch_2", "system_failure_message");
edgeValue("otp_switch_2", "valid", "verified_customer_lookup", "valid");
edge("otp_switch_2", "otp_invalid_message_2", { isDefault: true, label: "invalid/default" });
edge("otp_invalid_message_2", "otp_input_3", { label: "retry" });
edge("otp_input_3", "otp_validate_3", { label: "next" });
scriptRoutes("otp_validate_3", "otp_switch_3", "system_failure_message");
edgeValue("otp_switch_3", "valid", "verified_customer_lookup", "valid");
edge("otp_switch_3", "otp_max_attempts_message", { isDefault: true, label: "invalid/default" });
edge("otp_max_attempts_message", "otp_max_attempts_end", { label: "next" });
recordRoutes("verified_customer_lookup", "hydrate_verified_customer", "system_failure_message", "hydrate_verified_customer", "hydrate_verified_customer");
scriptRoutes("hydrate_verified_customer", "verified_customer_switch", "system_failure_message");
edgeValue("verified_customer_switch", "found", "verified_customer_route_script", "found");
edge("verified_customer_switch", "verified_customer_not_found_message", { isDefault: true, label: "not_found/default" });
scriptRoutes("verified_customer_route_script", "verified_customer_route_switch", "system_failure_message");
edgeValue("verified_customer_route_switch", "my_test_drive_booking", "test_drive_booking_lookup", "my_test_drive_booking");
edge("verified_customer_route_switch", "customer_vehicle_list", { isDefault: true, label: "service/default" });
edge("verified_customer_not_found_message", "verified_customer_not_found_route_switch", { label: "next" });
edgeValue("verified_customer_not_found_route_switch", "book_vehicle_service", "service_new_customer_form", "book_vehicle_service");
edge("verified_customer_not_found_route_switch", "verified_customer_not_found_end", { isDefault: true, label: "no_profile/default" });
edge("service_new_customer_form", "service_new_customer_record", { label: "next" });
recordRoutes("service_new_customer_record", "service_new_vehicle_record", "system_failure_message");
recordRoutes("service_new_vehicle_record", "customer_vehicle_list", "system_failure_message");
recordRoutes("customer_vehicle_list", "customer_vehicle_options_script", "system_failure_message");
scriptRoutes("customer_vehicle_options_script", "customer_vehicle_switch", "system_failure_message");
edgeValue("customer_vehicle_switch", "selected", "service_route_switch", "selected");
edgeValue("customer_vehicle_switch", "multiple", "customer_vehicle_choice_input", "multiple");
edge("customer_vehicle_switch", "service_no_vehicle_message", { isDefault: true, label: "none/default" });
edge("customer_vehicle_choice_input", "select_service_vehicle_script", { label: "next" });
scriptRoutes("select_service_vehicle_script", "select_service_vehicle_switch", "system_failure_message");
edgeValue("select_service_vehicle_switch", "selected", "service_route_switch", "selected");
edge("select_service_vehicle_switch", "service_no_vehicle_message", { isDefault: true, label: "invalid/default" });
edge("service_no_vehicle_message", "service_no_vehicle_end", { label: "next" });
edgeValue("service_route_switch", "book_vehicle_service", "service_type_input", "book_vehicle_service");
edgeValue("service_route_switch", "service_estimate", "service_order_list", "service_estimate");
edgeValue("service_route_switch", "track_service_status", "service_order_list", "track_service_status");
edge("service_route_switch", "service_order_list", { isDefault: true, label: "pay_service_bill/default" });

edge("service_type_input", "service_location_list", { label: "next" });
recordRoutes("service_location_list", "service_center_options_script", "system_failure_message");
scriptRoutes("service_center_options_script", "service_center_option_switch", "system_failure_message");
edgeValue("service_center_option_switch", "available", "service_center_choice_input", "available");
edge("service_center_option_switch", "service_no_slots_message", { isDefault: true, label: "none/default" });
edge("service_center_choice_input", "select_service_center_script", { label: "next" });
scriptRoutes("select_service_center_script", "select_service_center_switch", "system_failure_message");
edgeValue("select_service_center_switch", "selected", "service_slot_list", "selected");
edge("select_service_center_switch", "service_center_invalid_message", { isDefault: true, label: "invalid/default" });
edge("service_center_invalid_message", "service_center_invalid_end", { label: "next" });
recordRoutes("service_slot_list", "build_service_slots", "system_failure_message");
scriptRoutes("build_service_slots", "service_slot_status_switch", "system_failure_message");
edgeValue("service_slot_status_switch", "available", "service_slot_picker", "available");
edge("service_slot_status_switch", "service_no_slots_message", { isDefault: true, label: "unavailable/default" });
edge("service_no_slots_message", "service_no_slots_end", { label: "next" });
edge("service_slot_picker", "prepare_service_booking", { label: "selected" });
scriptRoutes("prepare_service_booking", "service_slot_hold_record", "system_failure_message");
recordRoutes("service_slot_hold_record", "pickup_type_input", "system_failure_message");
edge("pickup_type_input", "pickup_address_form", { condition: { operator: "equals", value: "pickup_drop" }, label: "pickup_drop" });
edge("pickup_type_input", "service_confirm_input", { isDefault: true, label: "drive_to_center/default" });
edge("pickup_address_form", "service_confirm_input", { label: "next" });
edgeValue("service_confirm_input", "yes", "service_staff_list", "yes");
edge("service_confirm_input", "service_slot_release_record", { isDefault: true, label: "no/default" });
recordRoutes("service_slot_release_record", "service_cancel_message", "system_failure_message");
edge("service_cancel_message", "service_cancel_end", { label: "next" });
recordRoutes("service_staff_list", "assign_service_advisor_script", "system_failure_message");
scriptRoutes("assign_service_advisor_script", "service_booking_record", "system_failure_message");
recordRoutes("service_booking_record", "service_slot_book_record", "system_failure_message");
recordRoutes("service_slot_book_record", "service_booking_notification", "system_failure_message");
notificationRoutes("service_booking_notification", "service_booking_final_message");
edge("service_booking_final_message", "service_booking_end", { label: "next" });

recordRoutes("service_order_list", "service_order_route_script", "system_failure_message");
scriptRoutes("service_order_route_script", "service_order_route_switch", "system_failure_message");
edgeValue("service_order_route_switch", "track_service_status", "service_track_message", "track_service_status");
edgeValue("service_order_route_switch", "service_estimate", "service_estimate_list", "service_estimate");
edgeValue("service_order_route_switch", "pay_service_bill", "payment_context_script", "pay_service_bill");
edge("service_order_route_switch", "service_order_none_message", { isDefault: true, label: "none/default" });
edge("service_order_none_message", "service_order_none_end", { label: "next" });
edge("service_track_message", "service_track_end", { label: "next" });
recordRoutes("service_estimate_list", "service_estimate_script", "system_failure_message");
scriptRoutes("service_estimate_script", "service_estimate_switch", "system_failure_message");
edgeValue("service_estimate_switch", "selected", "service_estimate_message", "selected");
edge("service_estimate_switch", "service_estimate_none_message", { isDefault: true, label: "none/default" });
edge("service_estimate_none_message", "service_estimate_none_end", { label: "next" });
edge("service_estimate_message", "service_estimate_action_input", { label: "next" });
edge("service_estimate_action_input", "service_estimate_action_switch", { label: "next" });
edgeValue("service_estimate_action_switch", "approve", "service_estimate_approve_record", "approve");
edgeValue("service_estimate_action_switch", "decline", "service_estimate_decline_record", "decline");
edge("service_estimate_action_switch", "service_estimate_talk_queue", { isDefault: true, label: "talk/default" });
recordRoutes("service_estimate_approve_record", "service_estimate_approved_message", "system_failure_message");
edge("service_estimate_approved_message", "service_estimate_approved_end", { label: "next" });
recordRoutes("service_estimate_decline_record", "service_estimate_declined_message", "system_failure_message");
edge("service_estimate_declined_message", "service_estimate_declined_end", { label: "next" });
edge("service_estimate_talk_queue", "service_estimate_talk_handover", { label: "next" });

scriptRoutes("payment_context_script", "service_payment", "system_failure_message");
edge("service_payment", "service_payment_record", { condition: { operator: "equals", value: "paid" }, label: "paid" });
edge("service_payment", "system_failure_message", { isDefault: true, label: "failed/default" });
recordRoutes("service_payment_record", "service_order_paid_update", "system_failure_message");
recordRoutes("service_order_paid_update", "service_payment_notification", "system_failure_message");
notificationRoutes("service_payment_notification", "service_payment_message");
edge("service_payment_message", "service_payment_end", { label: "next" });

edge("vehicle_questions_input", "vehicle_faq_ai", { label: "next" });
edge("vehicle_faq_ai", "vehicle_faq_answer_message", { label: "next" });
edge("vehicle_faq_answer_message", "vehicle_faq_end", { label: "next" });

edge("roadside_form", "roadside_queue", { label: "next" });
edge("roadside_queue", "roadside_handover", { label: "next" });
edge("talk_advisor_form", "talk_advisor_queue", { label: "next" });
edge("talk_advisor_queue", "talk_advisor_handover", { label: "next" });

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
