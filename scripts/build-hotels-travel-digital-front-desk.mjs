import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { notificationData } from "./notification-data.mjs";

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const domainRoot = join(rootDir, "domains", "hotels-travel");
const sourcePath = join(
  domainRoot,
  "templates-source",
  "hotel-digital-front-desk.source.flow.json"
);
const builtPath = join(
  domainRoot,
  "templates",
  "hotel-digital-front-desk.flow.json"
);
const stablePath = join(
  domainRoot,
  "templates-stable",
  "hotel-digital-front-desk.flow.json"
);

const exportDoc = {
  version: "1.0",
  exportedAt: "2026-08-25T00:00:00.000Z",
  bot: {
    name: "Hotel Digital Front Desk",
    description:
      "Automation-first hotel and travel workflow covering discovery, live room search, quote snapshots, booking holds, payments, booking changes, cancellation, transfers, guest services, and operational escalations.",
    headerTitle: "Hotel Digital Front Desk",
    headerTagline: "Discovery, booking, and guest service automation",
    globalVariables: [
      { key: "property_name", value: "Crescora Grand Hotel" },
      { key: "brand_name", value: "Crescora.ai" },
      { key: "default_currency", value: "INR" },
      { key: "default_timezone", value: "Asia/Kolkata" },
      { key: "payment_provider", value: "razorpay" },
      { key: "payment_link", value: "https://hotel.example.com/pay" },
      { key: "hotel_support_phone", value: "+91-90000-11000" },
      { key: "reservations_phone", value: "+91-90000-12000" },
      { key: "concierge_phone", value: "+91-90000-13000" },
      { key: "duty_manager_phone", value: "+91-90000-14000" },
      { key: "maps_link", value: "https://maps.example.com/crescora-grand-hotel" },
      { key: "default_check_in_time", value: "14:00" },
      { key: "default_check_out_time", value: "11:00" }
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
const DOMAIN_RECORD_SCHEMA = "hospitality";

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
    type: "smoothstep"
  };
  if (options.condition) item.condition = options.condition;
  if (options.label) item.label = options.label;
  if (options.isDefault) item.isDefault = true;
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

function inputData(message, variable, buttons = []) {
  return {
    messages: [message],
    variable,
    buttons
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
    piiFields: ""
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
    customerName: "{{guest_name}}",
    customerEmail: "{{guest_email}}",
    customerContact: "{{guest_mobile}}",
    notifySms: true,
    notifyEmail: true,
    expireMinutes: 10,
    callbackUrl: "",
    notesJson: pretty({
      session_id: "{{system.sessionId}}",
      booking_context: "{{journey_mode}}"
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
  dedupeKey,
  outputVar
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

function recordRoutes(recordId, successId, defaultId, duplicateId = successId, notFoundId = defaultId) {
  edgeValue(recordId, "success", successId, "success");
  edgeValue(recordId, "duplicate", duplicateId, "duplicate");
  edgeValue(recordId, "not_found", notFoundId, "not_found");
  edge(recordId, defaultId, { isDefault: true, label: "failed/default" });
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
  guestProfiles: {
    collection: "hotel_guest_profiles",
    fields: {
      guest_id: { type: "string", required: true, unique: true },
      guest_code: { type: "string", required: true, unique: true },
      full_name: { type: "string", required: true },
      normalized_phone: { type: "phone", required: true },
      email: { type: "email", required: false },
      country_code: { type: "string", required: false },
      preferred_language: { type: "string", required: false },
      loyalty_id: { type: "string", required: false },
      saved_preferences: { type: "string", required: false },
      special_request_notes: { type: "string", required: false },
      last_stay_at: { type: "string", required: false }
    }
  },
  roomOptions: {
    collection: "hotel_room_sellable_options",
    fields: {
      option_id: { type: "string", required: true, unique: true },
      property_id: { type: "string", required: true },
      property_name: { type: "string", required: true },
      property_city: { type: "string", required: true },
      room_type_id: { type: "string", required: true },
      room_code: { type: "string", required: true },
      room_name: { type: "string", required: true },
      room_description: { type: "string", required: false },
      max_adults: { type: "number", required: true },
      max_children: { type: "number", required: true },
      max_occupancy: { type: "number", required: true },
      rooms_available: { type: "number", required: true },
      nightly_rate_minor: { type: "number", required: true },
      taxes_minor: { type: "number", required: true },
      fees_minor: { type: "number", required: true },
      deposit_required_minor: { type: "number", required: false },
      meal_plan: { type: "string", required: false },
      rate_plan: { type: "string", required: false },
      cancellation_policy: { type: "string", required: false },
      package_code: { type: "string", required: false },
      package_tags: { type: "string", required: false },
      amenity_summary: { type: "string", required: false },
      active: { type: "boolean", required: true }
    }
  },
  packages: {
    collection: "hotel_packages",
    fields: {
      package_id: { type: "string", required: true, unique: true },
      package_code: { type: "string", required: true, unique: true },
      property_id: { type: "string", required: true },
      property_name: { type: "string", required: true },
      package_name: { type: "string", required: true },
      package_type: { type: "string", required: false },
      package_description: { type: "string", required: false },
      from_amount_minor: { type: "number", required: true },
      inclusions_summary: { type: "string", required: false },
      active: { type: "boolean", required: true }
    }
  },
  quotes: {
    collection: "hotel_booking_quotes",
    fields: {
      quote_id: { type: "string", required: true, unique: true },
      guest_id: { type: "string", required: false },
      property_name: { type: "string", required: true },
      room_type_id: { type: "string", required: true },
      room_name: { type: "string", required: true },
      check_in: { type: "string", required: true },
      check_out: { type: "string", required: true },
      nights: { type: "number", required: true },
      adults: { type: "number", required: true },
      children: { type: "number", required: true },
      rooms_requested: { type: "number", required: true },
      currency: { type: "string", required: true },
      subtotal: { type: "number", required: true },
      taxes: { type: "number", required: true },
      fees: { type: "number", required: true },
      total: { type: "number", required: true },
      deposit_required: { type: "number", required: false },
      balance_due: { type: "number", required: false },
      policy_snapshot: { type: "string", required: false },
      pricing_snapshot: { type: "string", required: false },
      status: { type: "string", required: true },
      expires_at: { type: "string", required: true }
    }
  },
  holds: {
    collection: "hotel_booking_holds",
    fields: {
      hold_id: { type: "string", required: true, unique: true },
      hold_code: { type: "string", required: true, unique: true },
      quote_id: { type: "string", required: true },
      guest_id: { type: "string", required: false },
      property_name: { type: "string", required: true },
      room_type_id: { type: "string", required: true },
      room_name: { type: "string", required: true },
      check_in: { type: "string", required: true },
      check_out: { type: "string", required: true },
      rooms_requested: { type: "number", required: true },
      status: { type: "string", required: true },
      expires_at: { type: "string", required: true },
      released_at: { type: "string", required: false },
      consumed_at: { type: "string", required: false }
    }
  },
  bookings: {
    collection: "hotel_bookings",
    fields: {
      booking_id: { type: "string", required: true, unique: true },
      booking_code: { type: "string", required: true, unique: true },
      guest_id: { type: "string", required: false },
      guest_name: { type: "string", required: true },
      guest_phone: { type: "phone", required: true },
      guest_email: { type: "email", required: false },
      property_name: { type: "string", required: true },
      room_type_id: { type: "string", required: true },
      room_name: { type: "string", required: true },
      check_in: { type: "string", required: true },
      check_out: { type: "string", required: true },
      nights: { type: "number", required: true },
      adults: { type: "number", required: true },
      children: { type: "number", required: true },
      rooms_requested: { type: "number", required: true },
      currency: { type: "string", required: true },
      subtotal: { type: "number", required: true },
      tax_amount: { type: "number", required: true },
      fee_amount: { type: "number", required: true },
      total_amount: { type: "number", required: true },
      paid_amount: { type: "number", required: true },
      balance_amount: { type: "number", required: true },
      payment_status: { type: "string", required: true },
      status: { type: "string", required: true },
      quote_id: { type: "string", required: false },
      hold_id: { type: "string", required: false },
      package_name: { type: "string", required: false },
      cancellation_policy_snapshot: { type: "string", required: false },
      special_requests: { type: "string", required: false },
      booking_snapshot: { type: "string", required: false },
      updated_at: { type: "string", required: false }
    }
  },
  payments: {
    collection: "hotel_payments",
    fields: {
      payment_id: { type: "string", required: true, unique: true },
      booking_id: { type: "string", required: false },
      hold_id: { type: "string", required: false },
      amount: { type: "number", required: true },
      currency: { type: "string", required: true },
      payment_type: { type: "string", required: true },
      provider: { type: "string", required: true },
      status: { type: "string", required: true },
      provider_reference: { type: "string", required: false },
      idempotency_key: { type: "string", required: true }
    }
  },
  bookingChanges: {
    collection: "hotel_booking_changes",
    fields: {
      change_id: { type: "string", required: true, unique: true },
      booking_id: { type: "string", required: true },
      change_type: { type: "string", required: true },
      before_snapshot: { type: "string", required: true },
      after_snapshot: { type: "string", required: true },
      price_difference: { type: "number", required: false },
      reason: { type: "string", required: false }
    }
  },
  availabilityFollowups: {
    collection: "hotel_availability_followups",
    fields: {
      followup_id: { type: "string", required: true, unique: true },
      property_name: { type: "string", required: false },
      check_in: { type: "string", required: true },
      check_out: { type: "string", required: true },
      adults: { type: "number", required: true },
      children: { type: "number", required: true },
      rooms_requested: { type: "number", required: true },
      request_type: { type: "string", required: true },
      status: { type: "string", required: true }
    }
  },
  transferRequests: {
    collection: "hotel_transfer_requests",
    fields: {
      transfer_id: { type: "string", required: true, unique: true },
      booking_id: { type: "string", required: true },
      booking_code: { type: "string", required: true },
      pickup_type: { type: "string", required: true },
      pickup_location: { type: "string", required: true },
      arrival_reference: { type: "string", required: false },
      arrival_datetime: { type: "string", required: true },
      passenger_count: { type: "number", required: true },
      vehicle_preference: { type: "string", required: false },
      charge_amount: { type: "number", required: true },
      status: { type: "string", required: true }
    }
  },
  serviceRequests: {
    collection: "hotel_service_requests",
    fields: {
      service_request_id: { type: "string", required: true, unique: true },
      booking_id: { type: "string", required: false },
      booking_code: { type: "string", required: false },
      guest_phone: { type: "phone", required: false },
      category: { type: "string", required: true },
      request_type: { type: "string", required: true },
      description: { type: "string", required: false },
      priority: { type: "string", required: true },
      status: { type: "string", required: true },
      room_number: { type: "string", required: false },
      assigned_department: { type: "string", required: false }
    }
  },
  supportCases: {
    collection: "hotel_support_cases",
    fields: {
      support_case_id: { type: "string", required: true, unique: true },
      booking_id: { type: "string", required: false },
      guest_phone: { type: "phone", required: false },
      department: { type: "string", required: true },
      priority: { type: "string", required: true },
      issue_type: { type: "string", required: true },
      summary: { type: "string", required: true },
      status: { type: "string", required: true }
    }
  },
  groupLeads: {
    collection: "hotel_group_booking_leads",
    fields: {
      group_lead_id: { type: "string", required: true, unique: true },
      company_name: { type: "string", required: false },
      contact_name: { type: "string", required: true },
      phone: { type: "phone", required: true },
      email: { type: "email", required: false },
      property_name: { type: "string", required: false },
      check_in: { type: "string", required: false },
      check_out: { type: "string", required: false },
      rooms_required: { type: "number", required: true },
      guest_count: { type: "number", required: true },
      room_mix: { type: "string", required: false },
      meal_plan: { type: "string", required: false },
      event_requirement: { type: "string", required: false },
      budget: { type: "string", required: false },
      status: { type: "string", required: true }
    }
  }
};

const stayGuestFields = [
  { key: "adults_count", label: "Adults", type: "number", required: true },
  { key: "children_count", label: "Children", type: "number", required: true },
  { key: "rooms_requested", label: "Rooms required", type: "number", required: true }
];

const newGuestFields = [
  { key: "guest_name", label: "Full name", type: "text", required: true },
  { key: "guest_email", label: "Email", type: "email", required: false },
  { key: "guest_country", label: "Country", type: "text", required: false },
  {
    key: "guest_special_request",
    label: "Special request",
    type: "textarea",
    required: false
  }
];

const stayValidationScript = `
const checkInRaw = String(vars.check_in_date || "").trim();
const checkOutRaw = String(vars.check_out_date || "").trim();
const adults = Number(vars.adults_count || 0);
const children = Number(vars.children_count || 0);
const rooms = Number(vars.rooms_requested || 0);
const today = new Date("2026-08-25T00:00:00Z");
function parseDate(value) {
  const parsed = new Date(value + "T00:00:00Z");
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}
const checkIn = parseDate(checkInRaw);
const checkOut = parseDate(checkOutRaw);
if (!checkIn || !checkOut) {
  return { status: "invalid", message: "I need valid check-in and check-out dates." };
}
if (checkIn < today) {
  return { status: "invalid", message: "Check-in cannot be in the past." };
}
if (checkOut <= checkIn) {
  return { status: "invalid", message: "Check-out must be after check-in." };
}
if (rooms < 1) {
  return { status: "invalid", message: "At least one room is required." };
}
if (adults < 1) {
  return { status: "invalid", message: "At least one adult guest is required." };
}
const nights = Math.round((checkOut.getTime() - checkIn.getTime()) / 86400000);
if (nights < 1) {
  return { status: "invalid", message: "The stay must include at least one night." };
}
if (nights > 30) {
  return { status: "invalid", message: "This template supports stays up to 30 nights before a group or negotiated review." };
}
if (adults + children > rooms * 6) {
  return { status: "invalid", message: "The guest count exceeds the supported occupancy for the requested room count." };
}
return {
  status: "valid",
  message: "Stay request validated.",
  nights,
  stayLabel: checkInRaw + " to " + checkOutRaw
};
`;

const selectPackageScript = `
const rawChoice = String(vars.selected_package_choice || "").trim().toLowerCase();
const source = Array.isArray(vars.package_list_result?.data) ? vars.package_list_result.data : [];
const match = source.find((item) => {
  const code = String(item.package_code || "").trim().toLowerCase();
  const name = String(item.package_name || "").trim().toLowerCase();
  return rawChoice && (rawChoice === code || rawChoice === name);
});
if (!match) {
  return { status: "not_found" };
}
return {
  status: "selected",
  selectedPackage: match
};
`;

const roomSearchScript = `
const options = Array.isArray(vars.room_inventory_result?.data) ? vars.room_inventory_result.data : [];
const propertyNeedle = String(vars.property_search_key || vars.property_name || "").trim().toLowerCase();
const adults = Number(vars.adults_count || 0);
const children = Number(vars.children_count || 0);
const rooms = Number(vars.rooms_requested || 0);
const nights = Number(vars.stay_nights || 0);
const preference = String(vars.stay_preference_choice || "").trim().toLowerCase();
const packageCode = String(vars.selected_package_code || "").trim().toLowerCase();
const filtered = options.filter((item) => {
  if (!item || item.active !== true) return false;
  if (propertyNeedle) {
    const propertyText = (String(item.property_name || "") + " " + String(item.property_city || "")).toLowerCase();
    if (!propertyText.includes(propertyNeedle)) return false;
  }
  if (Number(item.max_adults || 0) < adults) return false;
  if (Number(item.max_children || 0) < children) return false;
  if (Number(item.max_occupancy || 0) < adults + children) return false;
  if (Number(item.rooms_available || 0) < rooms) return false;
  if (packageCode && String(item.package_code || "").trim().toLowerCase() !== packageCode) return false;
  return true;
});
function includesPreference(item) {
  if (!preference || preference === "no_preference") return true;
  const combined = [
    item.room_name,
    item.room_description,
    item.amenity_summary,
    item.meal_plan,
    item.package_tags
  ].join(" ").toLowerCase();
  return combined.includes(preference.replaceAll("_", " "));
}
const scored = filtered
  .map((item) => {
    const subtotal = Number(item.nightly_rate_minor || 0) * nights * rooms;
    const taxes = Number(item.taxes_minor || 0) * nights * rooms;
    const fees = Number(item.fees_minor || 0) * rooms;
    const total = subtotal + taxes + fees;
    const deposit = Number(item.deposit_required_minor || 0) > 0
      ? Number(item.deposit_required_minor || 0)
      : Math.round(total * 0.25);
    const priorityBoost = includesPreference(item) ? 25 : 0;
    return {
      optionCode: String(item.room_code || item.option_id || "").trim(),
      propertyName: String(item.property_name || ""),
      propertyCity: String(item.property_city || ""),
      roomTypeId: String(item.room_type_id || ""),
      roomName: String(item.room_name || ""),
      roomDescription: String(item.room_description || ""),
      maxAdults: Number(item.max_adults || 0),
      maxChildren: Number(item.max_children || 0),
      roomsAvailable: Number(item.rooms_available || 0),
      nightlyRateMinor: Number(item.nightly_rate_minor || 0),
      taxAmountMinor: taxes,
      feeAmountMinor: fees,
      totalAmountMinor: total,
      depositRequiredMinor: deposit,
      mealPlan: String(item.meal_plan || ""),
      ratePlan: String(item.rate_plan || ""),
      cancellationPolicy: String(item.cancellation_policy || ""),
      amenitySummary: String(item.amenity_summary || ""),
      packageName: String(item.package_code ? (vars.selected_package_name || item.package_code) : ""),
      recommendationScore: Math.max(1, 100000000 - total) + priorityBoost
    };
  })
  .sort((a, b) => b.recommendationScore - a.recommendationScore)
  .slice(0, 4);
if (scored.length === 0) {
  return {
    matchStatus: "none",
    summary: "No sellable options matched the validated request."
  };
}
const exact = scored.filter((item) => includesPreference(item));
return {
  matchStatus: exact.length > 0 ? "exact" : "alternative",
  summary: exact.length > 0
    ? "Matched live room options."
    : "Matched alternative live room options.",
  options: scored,
  recommendedCode: scored[0].optionCode
};
`;

const selectRoomScript = `
const selected = String(vars.selected_room_choice || "").trim().toLowerCase();
const options = Array.isArray(vars.room_search_result?.options) ? vars.room_search_result.options : [];
const match = options.find((item) => {
  const code = String(item.optionCode || "").trim().toLowerCase();
  const name = String(item.roomName || "").trim().toLowerCase();
  return selected && (selected === code || selected === name);
});
if (!match) {
  return { status: "not_found" };
}
return {
  status: "selected",
  selectedOption: match
};
`;

const prepareQuoteHoldScript = `
const nights = Number(vars.stay_nights || 0);
const subtotal = Number(vars.selected_room_nightly_rate_minor || 0) * nights * Number(vars.rooms_requested || 1);
const taxes = Number(vars.selected_room_tax_amount_minor || 0);
const fees = Number(vars.selected_room_fee_amount_minor || 0);
const total = Number(vars.selected_room_total_amount_minor || subtotal + taxes + fees);
const deposit = Number(vars.selected_room_deposit_required_minor || Math.round(total * 0.25));
const dueNow = vars.journey_mode === "modify_booking" ? 0 : deposit;
const balance = Math.max(total - dueNow, 0);
const quoteId = "QT-" + String(vars.system?.sessionId || vars.system?.session_id || "SESSION");
const holdId = "HLD-" + String(vars.system?.sessionId || vars.system?.session_id || "SESSION");
const guestId = String(vars.guest_id || ("GST-" + String(vars.guest_mobile || "").replace(/\\D/g, "").slice(-10))).trim();
const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
return {
  quoteId,
  holdId,
  guestId,
  total,
  subtotal,
  taxes,
  fees,
  deposit,
  balance,
  dueNow,
  expiresAt,
  policySnapshot: String(vars.selected_room_cancellation_policy || ""),
  pricingSnapshot: JSON.stringify({
    room_name: vars.selected_room_name,
    nightly_rate_minor: vars.selected_room_nightly_rate_minor,
    tax_amount_minor: vars.selected_room_tax_amount_minor,
    fee_amount_minor: vars.selected_room_fee_amount_minor,
    total_amount_minor: vars.selected_room_total_amount_minor,
    package_name: vars.selected_package_name || "",
    stay_preference_choice: vars.stay_preference_choice || ""
  })
};
`;

const bookingCommitScript = `
const bookingId = "BKG-" + String(vars.system?.sessionId || vars.system?.session_id || "SESSION");
const suffix = String(vars.system?.sessionId || vars.system?.session_id || "0000").slice(-4).toUpperCase();
const checkIn = String(vars.check_in_date || "").replaceAll("-", "");
const bookingCode = "CGH-" + checkIn.slice(2) + "-" + suffix;
const paidAmount = Number(vars.paid_amount_snapshot || 0);
const balanceAmount = Number(vars.balance_after_payment || 0);
return {
  bookingId,
  bookingCode,
  confirmedAt: new Date().toISOString(),
  paidAmount,
  balanceAmount,
  bookingStatus: "confirmed"
};
`;

const selectBookingScript = `
const list = Array.isArray(vars.booking_lookup_list_result?.data) ? vars.booking_lookup_list_result.data : [];
const bookingCode = String(vars.lookup_booking_code || "").trim().toLowerCase();
if (list.length === 0) {
  return { status: "not_found" };
}
let match = null;
if (bookingCode) {
  match = list.find((item) => String(item.booking_code || "").trim().toLowerCase() === bookingCode);
}
if (!match) {
  match = list[0];
}
return {
  status: "found",
  booking: match
};
`;

const setModifyContextScript = `
const currentCheckIn = String(vars.current_booking_check_in || "").trim();
const currentCheckOut = String(vars.current_booking_check_out || "").trim();
const nextCheckIn = String(vars.modify_check_in || "").trim() || currentCheckIn;
const nextCheckOut = String(vars.modify_check_out || "").trim() || currentCheckOut;
const adults = String(vars.modify_adults_count || "").trim() || String(vars.current_booking_adults || "1");
const children = String(vars.modify_children_count || "").trim() || String(vars.current_booking_children || "0");
const rooms = String(vars.modify_rooms_requested || "").trim() || String(vars.current_booking_rooms_requested || "1");
return {
  propertySearchKey: String(vars.current_booking_property_name || ""),
  checkInDate: nextCheckIn,
  checkOutDate: nextCheckOut,
  adultsCount: adults,
  childrenCount: children,
  roomsRequested: rooms,
  preferenceChoice: String(vars.modify_preference_choice || "no_preference")
};
`;

const modifySettlementScript = `
const previousTotal = Number(vars.current_booking_total_amount || 0);
const newTotal = Number(vars.quote_total_amount || 0);
const previousPaid = Number(vars.current_booking_paid_amount || 0);
const difference = newTotal - previousTotal;
if (difference > 0) {
  return {
    settlementStatus: "charge_due",
    priceDifference: difference,
    updatedPaidAmount: previousPaid + difference,
    updatedBalanceAmount: 0,
    updatedPaymentStatus: "paid",
    settlementSummary: "Additional payment is required to confirm the modification."
  };
}
if (difference < 0) {
  return {
    settlementStatus: "refund_due",
    priceDifference: difference,
    updatedPaidAmount: previousPaid,
    updatedBalanceAmount: 0,
    updatedPaymentStatus: "refund_pending",
    settlementSummary: "The updated stay is cheaper. The booking can be modified now and the refund stays pending."
  };
}
return {
  settlementStatus: "no_change",
  priceDifference: 0,
  updatedPaidAmount: previousPaid,
  updatedBalanceAmount: Number(vars.current_booking_balance_amount || 0),
  updatedPaymentStatus: String(vars.current_booking_payment_status || "paid"),
  settlementSummary: "The modified stay keeps the same payable amount."
};
`;

const transferPricingScript = `
const pickupType = String(vars.transfer_pickup_type || "").trim().toLowerCase();
const passengers = Number(vars.transfer_passenger_count || 1);
const base = pickupType.includes("airport") ? 120000 : 90000;
const surcharge = passengers > 3 ? 40000 : 0;
return {
  transferChargeAmount: base + surcharge,
  transferChargeStatus: "payable",
  transferCode: "TRF-" + String(vars.system?.sessionId || "SESSION"),
  vehicleLabel: passengers > 3 ? "SUV" : "Sedan"
};
`;

const earlyLatePolicyScript = `
const requestType = String(vars.early_late_request_type || "").trim().toLowerCase();
const checkIn = String(vars.current_booking_check_in || "").trim();
const outcome = requestType === "early_check_in" ? "guaranteed" : "request_only";
const charge = requestType === "early_check_in" ? 75000 : 0;
return {
  outcome,
  chargeAmount: charge,
  requestSummary: requestType + " for booking " + String(vars.current_booking_code || ""),
  serviceType: requestType,
  targetDate: checkIn
};
`;

const servicePriorityScript = `
const category = String(vars.service_category || "").trim().toLowerCase();
const description = String(vars.service_description || "").trim().toLowerCase();
let priority = "normal";
if (category.includes("complaint") || description.includes("urgent")) priority = "high";
if (description.includes("smoke") || description.includes("fire")) priority = "critical";
return {
  priority,
  serviceRequestId: "SR-" + String(vars.system?.sessionId || "SESSION")
};
`;

const issuePriorityScript = `
const summary = [
  vars.issue_type || "",
  vars.issue_description || ""
].join(" ").toLowerCase();
let priority = "normal";
if (summary.includes("dirty") || summary.includes("leak") || summary.includes("noise")) priority = "high";
if (summary.includes("locked out") || summary.includes("electrical") || summary.includes("injury")) priority = "urgent";
if (summary.includes("smoke") || summary.includes("fire") || summary.includes("gas") || summary.includes("shock")) priority = "critical";
return {
  priority,
  supportCaseId: "ISS-" + String(vars.system?.sessionId || "SESSION")
};
`;

node("start_1", "start", 0, 0, { messages: [] });
node(
  "set_template_defaults",
  "setVariable",
  240,
  0,
  setVars({
    journey_mode: "",
    management_route: "",
    knowledge_scope: "general",
    hotel_question: "",
    property_search_key: "",
    check_in_date: "",
    check_out_date: "",
    stay_nights: "0",
    adults_count: "0",
    children_count: "0",
    rooms_requested: "1",
    stay_preference_choice: "no_preference",
    selected_package_id: "",
    selected_package_code: "",
    selected_package_name: "",
    selected_room_code: "",
    selected_room_name: "",
    selected_room_type_id: "",
    selected_room_nightly_rate_minor: "0",
    selected_room_tax_amount_minor: "0",
    selected_room_fee_amount_minor: "0",
    selected_room_total_amount_minor: "0",
    selected_room_deposit_required_minor: "0",
    selected_room_cancellation_policy: "",
    guest_id: "",
    guest_name: "",
    guest_mobile: "",
    guest_email: "",
    guest_country: "",
    preferred_language: "",
    guest_special_request: "",
    quote_id: "",
    hold_id: "",
    quote_total_amount: "0",
    quote_subtotal_amount: "0",
    quote_tax_amount: "0",
    quote_fee_amount: "0",
    quote_deposit_required: "0",
    quote_balance_due: "0",
    quote_expires_at: "",
    payment_id: "",
    payment_amount_due_now: "0",
    paid_amount_snapshot: "0",
    balance_after_payment: "0",
    payment_status: "",
    payment_capture_mode: "",
    operation_timestamp: "",
    booking_id: "",
    booking_code: "",
    current_booking_id: "",
    current_booking_code: "",
    current_booking_status: "",
    current_booking_property_name: "",
    current_booking_room_name: "",
    current_booking_check_in: "",
    current_booking_check_out: "",
    current_booking_adults: "1",
    current_booking_children: "0",
    current_booking_rooms_requested: "1",
    current_booking_total_amount: "0",
    current_booking_paid_amount: "0",
    current_booking_balance_amount: "0",
    current_booking_payment_status: "",
    current_booking_guest_name: "",
    current_booking_guest_phone: "",
    current_booking_guest_email: "",
    transfer_charge_amount: "0",
    transfer_charge_status: "",
    transfer_id: "",
    service_priority: "normal",
    service_request_id: "",
    issue_priority: "normal",
    support_case_id: "",
    group_lead_id: "",
    modification_price_difference: "0",
    modification_settlement_status: ""
  })
);
node(
  "welcome_message",
  "message",
  480,
  0,
  msgData(
    "Welcome to {{property_name}}. I can help you discover rooms, check live rates and availability, complete a booking, manage an existing reservation, arrange pre-arrival services, and handle stay-related requests."
  )
);
node(
  "main_request_input",
  "input",
  720,
  0,
  inputData(
    "How can I help you today?",
    "main_guest_request",
    [
      { label: "🛏️ Book a Room", value: "book_room" },
      { label: "🔍 Check Rooms & Rates", value: "check_rooms_rates" },
      { label: "🎁 Packages & Offers", value: "packages_offers" },
      { label: "📋 My Booking", value: "my_booking" },
      { label: "🔄 Modify Booking", value: "modify_booking" },
      { label: "❌ Cancel Booking", value: "cancel_booking" },
      { label: "💳 Payment / Receipt", value: "payment_receipt" },
      { label: "🏨 Hotel Information", value: "hotel_information" },
      { label: "✨ Amenities & Facilities", value: "amenities_facilities" },
      { label: "🚕 Airport / Station Transfer", value: "transfer_support" },
      { label: "🍽️ Dining / Spa / Experiences", value: "experiences" },
      { label: "🕐 Early Check-in / Late Checkout", value: "early_late" },
      { label: "🛎️ Guest Service Request", value: "guest_service_request" },
      { label: "⚠️ Report an Issue", value: "report_issue" },
      { label: "👥 Group / Corporate Booking", value: "group_booking" },
      { label: "💬 Talk to Hotel Team", value: "talk_to_team" }
    ]
  )
);
node("main_intent_router", "intent-router", 960, 0, {
  intents: [
    { key: "book_room", label: "Book a room" },
    { key: "check_rooms_rates", label: "Check rooms and rates" },
    { key: "packages_offers", label: "Packages and offers" },
    { key: "my_booking", label: "My booking" },
    { key: "modify_booking", label: "Modify booking" },
    { key: "cancel_booking", label: "Cancel booking" },
    { key: "payment_receipt", label: "Payment receipt or balance" },
    { key: "hotel_information", label: "Hotel information" },
    { key: "amenities_facilities", label: "Amenities and facilities" },
    { key: "transfer_support", label: "Airport or station transfer" },
    { key: "experiences", label: "Dining spa experiences" },
    { key: "early_late", label: "Early check-in or late checkout" },
    { key: "guest_service_request", label: "Guest service request" },
    { key: "report_issue", label: "Report an issue" },
    { key: "group_booking", label: "Group or corporate booking" },
    { key: "talk_to_team", label: "Talk to hotel team" }
  ],
  fallbackIntent: "unknown",
  threshold: 0.6
});

node("set_route_book_room", "setVariable", 1200, -360, setVars({ journey_mode: "book_room", selected_package_id: "", selected_package_code: "", selected_package_name: "" }));
node("set_route_check_rates", "setVariable", 1200, -280, setVars({ journey_mode: "check_rates", selected_package_id: "", selected_package_code: "", selected_package_name: "" }));
node("packages_intro_message", "message", 1200, -200, msgData("I can show maintained hotel packages first, then continue into the same live availability and booking spine."));
node("package_list", "record", 1440, -200, recordData({
  action: "list",
  collection: "hotel_packages",
  where: { active: true },
  data: {},
  schema: schemas.packages,
  outputVar: "package_list_result",
  limit: 10,
  sortBy: "package_name",
  sortOrder: "asc"
}));
node("package_carousel", "carousel", 1680, -200, dynamicCarouselData("Available packages", "package_list_result.data", {
  title: "{{item.package_name}}",
  subtitle: "From {{default_currency}} {{item.from_amount_minor}}",
  body: "{{item.package_description}}\\n\\nIncludes: {{item.inclusions_summary}}\\nCode: {{item.package_code}}",
  buttons: [
    { label: "Use Code", value: "{{item.package_code}}" }
  ]
}));
node("package_select_input", "input", 1920, -200, inputData("Reply with the package code you want to use.", "selected_package_choice", []));
node("select_package_script", "script", 2160, -200, scriptData(selectPackageScript, "selected_package_result"));
node("hydrate_selected_package", "setVariable", 2400, -200, setVars({
  selected_package_status: "{{selected_package_result.status}}",
  selected_package_id: "{{selected_package_result.selectedPackage.package_id}}",
  selected_package_code: "{{selected_package_result.selectedPackage.package_code}}",
  selected_package_name: "{{selected_package_result.selectedPackage.package_name}}",
  property_search_key: "{{selected_package_result.selectedPackage.property_name}}",
  journey_mode: "package_booking"
}));
node("selected_package_switch", "switch", 2640, -200, switchData("selected_package_status"));
node("package_not_found_message", "message", 2880, -280, msgData("I could not match that package code from the maintained package catalog."));
node("package_not_found_end", "end", 3120, -280, { messages: [] });

node("property_input", "input", 1440, -360, inputData("Which property or destination should I search?", "property_search_key", []));
node("check_in_input", "input", 1680, -360, inputData("What is your check-in date?", "check_in_date", []));
node("check_out_input", "input", 1920, -360, inputData("And your check-out date?", "check_out_date", []));
node("stay_guest_form", "form", 2160, -360, formData("Share the guest count for this stay.", stayGuestFields, "stay_guest_form_result"));
node("preference_input", "input", 2400, -360, inputData("Any preference? You can pick one or skip with No Preference.", "stay_preference_choice", [
  { label: "King Bed", value: "king_bed" },
  { label: "Twin Beds", value: "twin_beds" },
  { label: "View Room", value: "view_room" },
  { label: "Non-Smoking", value: "non_smoking" },
  { label: "Breakfast Included", value: "breakfast_included" },
  { label: "Accessible", value: "accessible" },
  { label: "No Preference", value: "no_preference" }
]));
node("stay_validation_script", "script", 2640, -360, scriptData(stayValidationScript, "stay_validation_result"));
node("hydrate_stay_validation", "setVariable", 2880, -360, setVars({
  stay_validation_status: "{{stay_validation_result.status}}",
  stay_validation_message: "{{stay_validation_result.message}}",
  stay_nights: "{{stay_validation_result.nights}}"
}));
node("stay_validation_switch", "switch", 3120, -360, switchData("stay_validation_status"));
node("stay_invalid_message", "message", 3360, -440, msgData("{{stay_validation_message}}"));
node("stay_invalid_end", "end", 3600, -440, { messages: [] });
node("room_inventory_list", "record", 3360, -360, recordData({
  action: "list",
  collection: "hotel_room_sellable_options",
  where: { active: true },
  data: {},
  schema: schemas.roomOptions,
  outputVar: "room_inventory_result",
  limit: 50,
  sortBy: "room_name",
  sortOrder: "asc"
}));
node("room_search_script", "script", 3600, -360, scriptData(roomSearchScript, "room_search_result"));
node("hydrate_room_search", "setVariable", 3840, -360, setVars({
  room_match_status: "{{room_search_result.matchStatus}}",
  room_search_summary: "{{room_search_result.summary}}",
  recommended_room_code: "{{room_search_result.recommendedCode}}"
}));
node("room_match_switch", "switch", 4080, -360, switchData("room_match_status"));
node("availability_followup_record", "record", 4320, -440, recordData({
  action: "upsert",
  collection: "hotel_availability_followups",
  where: { followup_id: "AVL-{{system.sessionId}}" },
  data: {
    followup_id: "AVL-{{system.sessionId}}",
    property_name: "{{property_search_key}}",
    check_in: "{{check_in_date}}",
    check_out: "{{check_out_date}}",
    adults: "{{adults_count}}",
    children: "{{children_count}}",
    rooms_requested: "{{rooms_requested}}",
    request_type: "{{journey_mode}}",
    status: "open"
  },
  schema: schemas.availabilityFollowups,
  uniqueKey: "followup_id",
  idempotencyKey: "AVL-{{system.sessionId}}",
  outputVar: "availability_followup_result"
}));
node("no_availability_message", "message", 4560, -440, msgData("I could not find a sellable option for those exact dates. I have saved a structured availability follow-up so the team can review alternatives without losing your stay request."));
node("no_availability_end", "end", 4800, -440, { messages: [] });
node("room_carousel", "carousel", 4320, -360, dynamicCarouselData("Live room options", "room_search_result.options", {
  title: "{{item.roomName}}",
  subtitle: "{{default_currency}} {{item.nightlyRateMinor}} / night",
  body: "Up to {{item.maxAdults}} adults, {{item.maxChildren}} children\\n{{item.amenitySummary}}\\nMeal plan: {{item.mealPlan}}\\nStay total: {{default_currency}} {{item.totalAmountMinor}}\\nCode: {{item.optionCode}}",
  buttons: [
    { label: "Select", value: "{{item.optionCode}}" }
  ]
}));
node("room_select_input", "input", 4560, -360, inputData("Reply with the room code you want to continue with. Recommended: {{recommended_room_code}}", "selected_room_choice", []));
node("select_room_script", "script", 4800, -360, scriptData(selectRoomScript, "selected_room_result"));
node("hydrate_selected_room", "setVariable", 5040, -360, setVars({
  selected_room_status: "{{selected_room_result.status}}",
  selected_room_code: "{{selected_room_result.selectedOption.optionCode}}",
  selected_room_name: "{{selected_room_result.selectedOption.roomName}}",
  selected_room_type_id: "{{selected_room_result.selectedOption.roomTypeId}}",
  property_search_key: "{{selected_room_result.selectedOption.propertyName}}",
  selected_room_nightly_rate_minor: "{{selected_room_result.selectedOption.nightlyRateMinor}}",
  selected_room_tax_amount_minor: "{{selected_room_result.selectedOption.taxAmountMinor}}",
  selected_room_fee_amount_minor: "{{selected_room_result.selectedOption.feeAmountMinor}}",
  selected_room_total_amount_minor: "{{selected_room_result.selectedOption.totalAmountMinor}}",
  selected_room_deposit_required_minor: "{{selected_room_result.selectedOption.depositRequiredMinor}}",
  selected_room_cancellation_policy: "{{selected_room_result.selectedOption.cancellationPolicy}}"
}));
node("selected_room_switch", "switch", 5280, -360, switchData("selected_room_status"));
node("selected_room_not_found_message", "message", 5520, -440, msgData("I could not match that room code from the live options I just showed."));
node("selected_room_not_found_end", "end", 5760, -440, { messages: [] });
node("selected_room_message", "message", 5520, -360, msgData("Selected room: {{selected_room_name}} at {{property_search_key}}. Stay total: {{default_currency}} {{selected_room_total_amount_minor}}."));
node("room_selection_route_switch", "switch", 5760, -360, switchData("journey_mode"));
node("rates_followup_input", "input", 6000, -360, inputData("Would you like to continue to booking with this option?", "rates_followup_choice", [
  { label: "Proceed to Booking", value: "proceed" },
  { label: "Stop Here", value: "end" }
]));
node("rates_end_message", "message", 6240, -440, msgData("Your live rate search is complete. You can come back to book when you're ready."));
node("rates_end", "end", 6480, -440, { messages: [] });
node("guest_mobile_input", "input", 6240, -360, inputData("Before I reserve the room, please share the guest mobile number.", "guest_mobile", []));
node("guest_profile_find", "record", 6480, -360, recordData({
  action: "find",
  collection: "hotel_guest_profiles",
  where: { normalized_phone: "{{guest_mobile}}" },
  data: {},
  schema: schemas.guestProfiles,
  outputVar: "guest_profile_result"
}));
node("returning_guest_message", "message", 6720, -440, msgData("I found your guest profile for {{guest_profile_result.data.full_name}}. Would you like to continue with those details?"));
node("reuse_guest_input", "input", 6960, -440, inputData("Reuse your saved guest details?", "guest_profile_reuse_choice", [
  { label: "Yes", value: "yes" },
  { label: "No", value: "no" }
]));
node("hydrate_returning_guest", "setVariable", 7200, -520, setVars({
  guest_id: "{{guest_profile_result.data.guest_id}}",
  guest_name: "{{guest_profile_result.data.full_name}}",
  guest_email: "{{guest_profile_result.data.email}}",
  guest_country: "{{guest_profile_result.data.country_code}}",
  guest_special_request: "{{guest_profile_result.data.special_request_notes}}"
}));
node("new_guest_form", "form", 6720, -280, formData("Share the remaining guest details.", newGuestFields, "new_guest_form_result"));
node("prepare_guest_identity", "setVariable", 7440, -360, setVars({
  guest_id: "{{guest_id}}",
  guest_name: "{{guest_name}}",
  guest_email: "{{guest_email}}",
  guest_country: "{{guest_country}}",
  guest_special_request: "{{guest_special_request}}"
}));
node("guest_profile_upsert", "record", 7680, -360, recordData({
  action: "upsert",
  collection: "hotel_guest_profiles",
  where: { normalized_phone: "{{guest_mobile}}" },
  data: {
    guest_id: "{{guest_id}}",
    guest_code: "GST-{{system.sessionId}}",
    full_name: "{{guest_name}}",
    normalized_phone: "{{guest_mobile}}",
    email: "{{guest_email}}",
    country_code: "{{guest_country}}",
    saved_preferences: "{{stay_preference_choice}}",
    special_request_notes: "{{guest_special_request}}",
    last_stay_at: "{{check_out_date}}"
  },
  schema: schemas.guestProfiles,
  uniqueKey: "normalized_phone",
  idempotencyKey: "{{guest_mobile}}",
  outputVar: "guest_profile_upsert_result"
}));
node("hydrate_guest_for_modify", "setVariable", 6240, -200, setVars({
  guest_id: "{{current_booking_id}}",
  guest_mobile: "{{current_booking_guest_phone}}",
  guest_name: "{{current_booking_guest_name}}",
  guest_email: "{{current_booking_guest_email}}"
}));
node("prepare_quote_hold_script", "script", 7920, -360, scriptData(prepareQuoteHoldScript, "quote_hold_result"));
node("hydrate_quote_hold", "setVariable", 8160, -360, setVars({
  quote_id: "{{quote_hold_result.quoteId}}",
  hold_id: "{{quote_hold_result.holdId}}",
  guest_id: "{{quote_hold_result.guestId}}",
  quote_total_amount: "{{quote_hold_result.total}}",
  quote_subtotal_amount: "{{quote_hold_result.subtotal}}",
  quote_tax_amount: "{{quote_hold_result.taxes}}",
  quote_fee_amount: "{{quote_hold_result.fees}}",
  quote_deposit_required: "{{quote_hold_result.deposit}}",
  quote_balance_due: "{{quote_hold_result.balance}}",
  quote_expires_at: "{{quote_hold_result.expiresAt}}",
  quote_policy_snapshot: "{{quote_hold_result.policySnapshot}}",
  quote_pricing_snapshot: "{{quote_hold_result.pricingSnapshot}}"
}));
node("quote_record_upsert", "record", 8400, -360, recordData({
  action: "upsert",
  collection: "hotel_booking_quotes",
  where: { quote_id: "{{quote_id}}" },
  data: {
    quote_id: "{{quote_id}}",
    guest_id: "{{guest_id}}",
    property_name: "{{property_search_key}}",
    room_type_id: "{{selected_room_type_id}}",
    room_name: "{{selected_room_name}}",
    check_in: "{{check_in_date}}",
    check_out: "{{check_out_date}}",
    nights: "{{stay_nights}}",
    adults: "{{adults_count}}",
    children: "{{children_count}}",
    rooms_requested: "{{rooms_requested}}",
    currency: "{{default_currency}}",
    subtotal: "{{quote_subtotal_amount}}",
    taxes: "{{quote_tax_amount}}",
    fees: "{{quote_fee_amount}}",
    total: "{{quote_total_amount}}",
    deposit_required: "{{quote_deposit_required}}",
    balance_due: "{{quote_balance_due}}",
    policy_snapshot: "{{quote_policy_snapshot}}",
    pricing_snapshot: "{{quote_pricing_snapshot}}",
    status: "active",
    expires_at: "{{quote_expires_at}}"
  },
  schema: schemas.quotes,
  uniqueKey: "quote_id",
  idempotencyKey: "{{quote_id}}",
  outputVar: "quote_record_result"
}));
node("hold_record_upsert", "record", 8640, -360, recordData({
  action: "upsert",
  collection: "hotel_booking_holds",
  where: { hold_id: "{{hold_id}}" },
  data: {
    hold_id: "{{hold_id}}",
    hold_code: "{{hold_id}}",
    quote_id: "{{quote_id}}",
    guest_id: "{{guest_id}}",
    property_name: "{{property_search_key}}",
    room_type_id: "{{selected_room_type_id}}",
    room_name: "{{selected_room_name}}",
    check_in: "{{check_in_date}}",
    check_out: "{{check_out_date}}",
    rooms_requested: "{{rooms_requested}}",
    status: "active",
    expires_at: "{{quote_expires_at}}"
  },
  schema: schemas.holds,
  uniqueKey: "hold_id",
  idempotencyKey: "{{hold_id}}",
  outputVar: "hold_record_result"
}));
node("hold_expiry_scheduler", "scheduler", 8880, -360, schedulerData({
  runAt: "",
  offsetValue: 10,
  offsetUnit: "minutes",
  offsetDirection: "after",
  payload: {
    type: "release_expired_booking_hold",
    hold_id: "{{hold_id}}",
    quote_id: "{{quote_id}}"
  },
  dedupeKey: "{{hold_id}}:expiry",
  outputVar: "hold_expiry_scheduler_result"
}));
node("post_hold_route_switch", "switch", 9120, -360, switchData("journey_mode"));
node("booking_summary_message", "message", 9360, -360, msgData("Your stay summary\\n\\n🏨 {{property_search_key}}\\n🛏 {{selected_room_name}}\\n📅 {{check_in_date}} to {{check_out_date}}\\n🌙 {{stay_nights}} nights\\n👥 {{adults_count}} adults and {{children_count}} children\\n💰 Subtotal: {{default_currency}} {{quote_subtotal_amount}}\\n🧾 Taxes and fees: {{default_currency}} {{quote_tax_amount}} + {{quote_fee_amount}}\\n✅ Total: {{default_currency}} {{quote_total_amount}}\\n🔐 Hold expires at: {{quote_expires_at}}\\nCancellation: {{selected_room_cancellation_policy}}"));
node("payment_choice_input", "input", 9600, -360, inputData("How would you like to pay?", "booking_payment_choice", [
  { label: "Pay Full Amount", value: "pay_full" },
  { label: "Pay Deposit", value: "pay_deposit" },
  { label: "Pay at Hotel", value: "pay_at_hotel" }
]));
node("set_payment_full", "setVariable", 9840, -520, setVars({
  payment_id: "PAY-{{system.sessionId}}",
  payment_amount_due_now: "{{quote_total_amount}}",
  paid_amount_snapshot: "{{quote_total_amount}}",
  balance_after_payment: "0",
  payment_status: "paid",
  payment_capture_mode: "full"
}));
node("set_payment_deposit", "setVariable", 9840, -440, setVars({
  payment_id: "PAY-{{system.sessionId}}",
  payment_amount_due_now: "{{quote_deposit_required}}",
  paid_amount_snapshot: "{{quote_deposit_required}}",
  balance_after_payment: "{{quote_balance_due}}",
  payment_status: "partially_paid",
  payment_capture_mode: "deposit"
}));
node("set_payment_hotel", "setVariable", 9840, -280, setVars({
  payment_id: "PAY-HOTEL-{{system.sessionId}}",
  payment_amount_due_now: "0",
  paid_amount_snapshot: "0",
  balance_after_payment: "{{quote_total_amount}}",
  payment_status: "pay_at_hotel",
  payment_capture_mode: "pay_at_hotel"
}));
node("booking_payment", "payment", 10080, -480, paymentData({
  amount: "{{payment_amount_due_now}}",
  description: "Hotel booking payment",
  outputVar: "booking_payment_result"
}));
node("payment_failed_release_hold", "record", 10320, -620, recordData({
  action: "update",
  collection: "hotel_booking_holds",
  where: { hold_id: "{{hold_id}}", status: "active" },
  data: {
    hold_id: "{{hold_id}}",
    hold_code: "{{hold_id}}",
    quote_id: "{{quote_id}}",
    guest_id: "{{guest_id}}",
    property_name: "{{property_search_key}}",
    room_type_id: "{{selected_room_type_id}}",
    room_name: "{{selected_room_name}}",
    check_in: "{{check_in_date}}",
    check_out: "{{check_out_date}}",
    rooms_requested: "{{rooms_requested}}",
    status: "released",
    expires_at: "{{quote_expires_at}}"
  },
  schema: schemas.holds,
  uniqueKey: "hold_id",
  idempotencyKey: "{{hold_id}}:release",
  outputVar: "hold_release_result"
}));
node("payment_failed_message", "message", 10560, -620, msgData("The payment was not verified, so the room hold has been released. You can start again whenever you are ready."));
node("payment_failed_end", "end", 10800, -620, { messages: [] });
node("payment_record_upsert", "record", 10320, -360, recordData({
  action: "upsert",
  collection: "hotel_payments",
  where: { payment_id: "{{payment_id}}" },
  data: {
    payment_id: "{{payment_id}}",
    booking_id: "{{booking_id}}",
    hold_id: "{{hold_id}}",
    amount: "{{payment_amount_due_now}}",
    currency: "{{default_currency}}",
    payment_type: "{{payment_capture_mode}}",
    provider: "{{payment_provider}}",
    status: "{{payment_status}}",
    provider_reference: "{{booking_payment_result}}",
    idempotency_key: "{{payment_id}}"
  },
  schema: schemas.payments,
  uniqueKey: "payment_id",
  idempotencyKey: "{{payment_id}}",
  outputVar: "payment_record_result"
}));
node("booking_commit_script", "script", 10560, -360, scriptData(bookingCommitScript, "booking_commit_result"));
node("hydrate_booking_commit", "setVariable", 10800, -360, setVars({
  booking_id: "{{booking_commit_result.bookingId}}",
  booking_code: "{{booking_commit_result.bookingCode}}",
  booking_confirmed_at: "{{booking_commit_result.confirmedAt}}"
}));
node("booking_record_upsert", "record", 11040, -360, recordData({
  action: "upsert",
  collection: "hotel_bookings",
  where: { booking_id: "{{booking_id}}" },
  data: {
    booking_id: "{{booking_id}}",
    booking_code: "{{booking_code}}",
    guest_id: "{{guest_id}}",
    guest_name: "{{guest_name}}",
    guest_phone: "{{guest_mobile}}",
    guest_email: "{{guest_email}}",
    property_name: "{{property_search_key}}",
    room_type_id: "{{selected_room_type_id}}",
    room_name: "{{selected_room_name}}",
    check_in: "{{check_in_date}}",
    check_out: "{{check_out_date}}",
    nights: "{{stay_nights}}",
    adults: "{{adults_count}}",
    children: "{{children_count}}",
    rooms_requested: "{{rooms_requested}}",
    currency: "{{default_currency}}",
    subtotal: "{{quote_subtotal_amount}}",
    tax_amount: "{{quote_tax_amount}}",
    fee_amount: "{{quote_fee_amount}}",
    total_amount: "{{quote_total_amount}}",
    paid_amount: "{{paid_amount_snapshot}}",
    balance_amount: "{{balance_after_payment}}",
    payment_status: "{{payment_status}}",
    status: "confirmed",
    quote_id: "{{quote_id}}",
    hold_id: "{{hold_id}}",
    package_name: "{{selected_package_name}}",
    cancellation_policy_snapshot: "{{selected_room_cancellation_policy}}",
    special_requests: "{{guest_special_request}}",
    booking_snapshot: "{{quote_pricing_snapshot}}",
    updated_at: "{{booking_confirmed_at}}"
  },
  schema: schemas.bookings,
  uniqueKey: "booking_id",
  idempotencyKey: "{{booking_id}}",
  outputVar: "booking_record_result"
}));
node("hold_consumed_update", "record", 11280, -360, recordData({
  action: "update",
  collection: "hotel_booking_holds",
  where: { hold_id: "{{hold_id}}" },
  data: {
    hold_id: "{{hold_id}}",
    hold_code: "{{hold_id}}",
    quote_id: "{{quote_id}}",
    guest_id: "{{guest_id}}",
    property_name: "{{property_search_key}}",
    room_type_id: "{{selected_room_type_id}}",
    room_name: "{{selected_room_name}}",
    check_in: "{{check_in_date}}",
    check_out: "{{check_out_date}}",
    rooms_requested: "{{rooms_requested}}",
    status: "consumed",
    expires_at: "{{quote_expires_at}}",
    consumed_at: "{{booking_confirmed_at}}"
  },
  schema: schemas.holds,
  uniqueKey: "hold_id",
  idempotencyKey: "{{hold_id}}:consumed",
  outputVar: "hold_consumed_result"
}));
node("booking_confirmation_notify", "notification", 11520, -360, notificationData({
  recipients: [
    { type: "customer", phone: "{{guest_mobile}}", email: "{{guest_email}}" }
  ],
  channels: [
    { type: "whatsapp", enabled: true, templateId: "hotel_booking_confirmed" },
    { type: "sms", enabled: true, message: "Booking {{booking_code}} confirmed for {{property_search_key}}. Check-in {{check_in_date}}, room {{selected_room_name}}." },
    { type: "email", enabled: true, subject: "Your hotel booking is confirmed", body: "Booking ID: {{booking_code}}\\nHotel: {{property_search_key}}\\nRoom: {{selected_room_name}}\\nCheck-in: {{check_in_date}}\\nCheck-out: {{check_out_date}}\\nPaid: {{default_currency}} {{paid_amount_snapshot}}\\nBalance: {{default_currency}} {{balance_after_payment}}\\nMap: {{maps_link}}" }
  ],
  dedupeKey: "{{booking_id}}:booking_confirmation",
  outputVar: "booking_confirmation_result"
}));
node("prearrival_scheduler", "scheduler", 11760, -360, schedulerData({
  runAt: "{{check_in_date}}T{{default_check_in_time}}:00",
  offsetValue: 48,
  offsetUnit: "hours",
  offsetDirection: "before",
  payload: {
    type: "prearrival_prompt",
    booking_id: "{{booking_id}}",
    booking_code: "{{booking_code}}"
  },
  dedupeKey: "{{booking_id}}:prearrival_48h",
  outputVar: "prearrival_scheduler_result"
}));
node("booking_confirmed_message", "message", 12000, -360, msgData("🎉 Your booking is confirmed.\\n\\nBooking ID: {{booking_code}}\\n🏨 {{property_search_key}}\\n🛏 {{selected_room_name}}\\n📅 {{check_in_date}} to {{check_out_date}}\\n💳 Payment status: {{payment_status}}\\n💰 Total: {{default_currency}} {{quote_total_amount}}\\n\\nA confirmation has been queued for WhatsApp, email, and SMS fallback. I can also help with airport pickup, early check-in, and special requests."));
node("booking_confirmed_end", "end", 12240, -360, { messages: [] });

node("booking_lookup_intro", "message", 1200, 260, msgData("I can look up the reservation by registered mobile number and optional booking code."));
node("booking_lookup_form", "form", 1440, 260, formData("Share the booking lookup details.", [
  { key: "lookup_mobile", label: "Registered mobile number", type: "phone", required: true },
  { key: "lookup_booking_code", label: "Booking code", type: "text", required: false }
], "booking_lookup_form_result"));
node("booking_lookup_list", "record", 1680, 260, recordData({
  action: "list",
  collection: "hotel_bookings",
  where: { guest_phone: "{{lookup_mobile}}" },
  data: {},
  schema: schemas.bookings,
  outputVar: "booking_lookup_list_result",
  limit: 10,
  sortBy: "updated_at",
  sortOrder: "desc"
}));
node("select_booking_script", "script", 1920, 260, scriptData(selectBookingScript, "selected_booking_result"));
node("hydrate_selected_booking", "setVariable", 2160, 260, setVars({
  selected_booking_status: "{{selected_booking_result.status}}",
  current_booking_id: "{{selected_booking_result.booking.booking_id}}",
  current_booking_code: "{{selected_booking_result.booking.booking_code}}",
  current_booking_status: "{{selected_booking_result.booking.status}}",
  current_booking_property_name: "{{selected_booking_result.booking.property_name}}",
  current_booking_room_name: "{{selected_booking_result.booking.room_name}}",
  current_booking_check_in: "{{selected_booking_result.booking.check_in}}",
  current_booking_check_out: "{{selected_booking_result.booking.check_out}}",
  current_booking_adults: "{{selected_booking_result.booking.adults}}",
  current_booking_children: "{{selected_booking_result.booking.children}}",
  current_booking_rooms_requested: "{{selected_booking_result.booking.rooms_requested}}",
  current_booking_total_amount: "{{selected_booking_result.booking.total_amount}}",
  current_booking_paid_amount: "{{selected_booking_result.booking.paid_amount}}",
  current_booking_balance_amount: "{{selected_booking_result.booking.balance_amount}}",
  current_booking_payment_status: "{{selected_booking_result.booking.payment_status}}",
  current_booking_guest_name: "{{selected_booking_result.booking.guest_name}}",
  current_booking_guest_phone: "{{selected_booking_result.booking.guest_phone}}",
  current_booking_guest_email: "{{selected_booking_result.booking.guest_email}}"
}));
node("selected_booking_switch", "switch", 2400, 260, switchData("selected_booking_status"));
node("booking_not_found_message", "message", 2640, 180, msgData("I could not find a matching booking from the registered mobile number and optional code you provided."));
node("booking_not_found_end", "end", 2880, 180, { messages: [] });
node("management_route_switch", "switch", 2640, 260, switchData("management_route"));
node("my_booking_summary", "message", 2880, 260, msgData("Upcoming booking\\n\\nBooking: {{current_booking_code}}\\n🏨 {{current_booking_property_name}}\\n🛏 {{current_booking_room_name}}\\n📅 {{current_booking_check_in}} to {{current_booking_check_out}}\\n💳 {{current_booking_payment_status}}\\nBalance: {{default_currency}} {{current_booking_balance_amount}}\\nStatus: {{current_booking_status}}"));
node("my_booking_end", "end", 3120, 260, { messages: [] });

node("modify_request_form", "form", 2880, 340, formData("Tell me what should change on this booking.", [
  { key: "modify_check_in", label: "New check-in date", type: "date", required: false },
  { key: "modify_check_out", label: "New check-out date", type: "date", required: false },
  { key: "modify_adults_count", label: "Adults", type: "number", required: false },
  { key: "modify_children_count", label: "Children", type: "number", required: false },
  { key: "modify_rooms_requested", label: "Rooms", type: "number", required: false },
  { key: "modify_preference_choice", label: "Preference", type: "text", required: false }
], "modify_request_form_result"));
node("set_modify_context_script", "script", 3120, 340, scriptData(setModifyContextScript, "modify_context_result"));
node("hydrate_modify_context", "setVariable", 3360, 340, setVars({
  journey_mode: "modify_booking",
  property_search_key: "{{modify_context_result.propertySearchKey}}",
  check_in_date: "{{modify_context_result.checkInDate}}",
  check_out_date: "{{modify_context_result.checkOutDate}}",
  adults_count: "{{modify_context_result.adultsCount}}",
  children_count: "{{modify_context_result.childrenCount}}",
  rooms_requested: "{{modify_context_result.roomsRequested}}",
  stay_preference_choice: "{{modify_context_result.preferenceChoice}}"
}));

node("payment_action_input", "input", 2880, 500, inputData("What do you need for this booking?", "payment_action_choice", [
  { label: "Pay Balance", value: "pay_balance" },
  { label: "Receipt", value: "receipt" },
  { label: "Refund Status", value: "refund_status" }
]));
node("payment_action_switch", "switch", 3120, 500, switchData("payment_action_choice"));
node("balance_due_switch", "switch", 3360, 500, switchData("current_booking_balance_amount"));
node("balance_due_message", "message", 3360, 420, msgData("Outstanding balance: {{default_currency}} {{current_booking_balance_amount}}."));
node("no_balance_message", "message", 3360, 580, msgData("There is no remaining payable balance on this booking."));
node("payment_receipt_message", "message", 3360, 660, msgData("Receipt summary\\n\\nBooking: {{current_booking_code}}\\nPaid: {{default_currency}} {{current_booking_paid_amount}}\\nBalance: {{default_currency}} {{current_booking_balance_amount}}\\nPayment status: {{current_booking_payment_status}}"));
node("refund_status_message", "message", 3360, 740, msgData("Refund status for {{current_booking_code}} is tied to the booking payment state: {{current_booking_payment_status}}. If the booking was cancelled with a refund due, this stays pending until the finance workflow processes it."));
node("payment_action_end", "end", 3600, 660, { messages: [] });
node("set_balance_payment", "setVariable", 3600, 420, setVars({
  journey_mode: "booking_balance_payment",
  payment_id: "PAY-BAL-{{system.sessionId}}",
  payment_amount_due_now: "{{current_booking_balance_amount}}",
  payment_status: "paid",
  payment_capture_mode: "balance_payment",
  paid_amount_snapshot: "{{current_booking_total_amount}}",
  balance_after_payment: "0",
  guest_mobile: "{{current_booking_guest_phone}}",
  guest_name: "{{current_booking_guest_name}}",
  guest_email: "{{current_booking_guest_email}}"
}));
node("balance_payment", "payment", 3840, 420, paymentData({
  amount: "{{payment_amount_due_now}}",
  description: "Outstanding hotel booking balance",
  outputVar: "balance_payment_result"
}));
node("balance_payment_record", "record", 4080, 420, recordData({
  action: "upsert",
  collection: "hotel_payments",
  where: { payment_id: "{{payment_id}}" },
  data: {
    payment_id: "{{payment_id}}",
    booking_id: "{{current_booking_id}}",
    hold_id: "",
    amount: "{{payment_amount_due_now}}",
    currency: "{{default_currency}}",
    payment_type: "{{payment_capture_mode}}",
    provider: "{{payment_provider}}",
    status: "paid",
    provider_reference: "{{balance_payment_result}}",
    idempotency_key: "{{payment_id}}"
  },
  schema: schemas.payments,
  uniqueKey: "payment_id",
  idempotencyKey: "{{payment_id}}",
  outputVar: "balance_payment_record_result"
}));
node("balance_booking_update", "record", 4320, 420, recordData({
  action: "update",
  collection: "hotel_bookings",
  where: { booking_id: "{{current_booking_id}}" },
  data: {
    booking_id: "{{current_booking_id}}",
    booking_code: "{{current_booking_code}}",
    guest_id: "{{current_booking_id}}",
    guest_name: "{{current_booking_guest_name}}",
    guest_phone: "{{current_booking_guest_phone}}",
    guest_email: "{{current_booking_guest_email}}",
    property_name: "{{current_booking_property_name}}",
    room_type_id: "{{selected_booking_result.booking.room_type_id}}",
    room_name: "{{current_booking_room_name}}",
    check_in: "{{current_booking_check_in}}",
    check_out: "{{current_booking_check_out}}",
    nights: "{{selected_booking_result.booking.nights}}",
    adults: "{{current_booking_adults}}",
    children: "{{current_booking_children}}",
    rooms_requested: "{{current_booking_rooms_requested}}",
    currency: "{{default_currency}}",
    subtotal: "{{selected_booking_result.booking.subtotal}}",
    tax_amount: "{{selected_booking_result.booking.tax_amount}}",
    fee_amount: "{{selected_booking_result.booking.fee_amount}}",
    total_amount: "{{current_booking_total_amount}}",
    paid_amount: "{{current_booking_total_amount}}",
    balance_amount: "0",
    payment_status: "paid",
    status: "{{current_booking_status}}",
    quote_id: "{{selected_booking_result.booking.quote_id}}",
    hold_id: "{{selected_booking_result.booking.hold_id}}",
    package_name: "{{selected_booking_result.booking.package_name}}",
    cancellation_policy_snapshot: "{{selected_booking_result.booking.cancellation_policy_snapshot}}",
    special_requests: "{{selected_booking_result.booking.special_requests}}",
    booking_snapshot: "{{selected_booking_result.booking.booking_snapshot}}"
  },
  schema: schemas.bookings,
  uniqueKey: "booking_id",
  idempotencyKey: "{{current_booking_id}}:balance",
  outputVar: "balance_booking_update_result"
}));
node("balance_payment_done_message", "message", 4560, 420, msgData("The outstanding balance has been marked paid for booking {{current_booking_code}}."));
node("balance_payment_done_end", "end", 4800, 420, { messages: [] });

node("cancel_policy_script", "script", 2880, 840, scriptData(`
const paid = Number(vars.current_booking_paid_amount || 0);
return {
  cancellationFee: 0,
  refundAmount: paid,
  refundStatus: paid > 0 ? "refund_pending" : "not_applicable"
};
`, "cancel_policy_result"));
node("cancel_summary_message", "message", 3120, 840, msgData("Cancelling booking {{current_booking_code}} will result in:\\n\\nPaid: {{default_currency}} {{current_booking_paid_amount}}\\nCancellation fee: {{default_currency}} {{cancel_policy_result.cancellationFee}}\\nRefund: {{default_currency}} {{cancel_policy_result.refundAmount}}"));
node("cancel_confirm_input", "input", 3360, 840, inputData("Would you like to continue?", "cancel_confirm_choice", [
  { label: "Yes, Cancel", value: "yes" },
  { label: "Keep Booking", value: "no" }
]));
node("cancel_change_record", "record", 3600, 760, recordData({
  action: "upsert",
  collection: "hotel_booking_changes",
  where: { change_id: "CAN-{{current_booking_id}}" },
  data: {
    change_id: "CAN-{{current_booking_id}}",
    booking_id: "{{current_booking_id}}",
    change_type: "cancellation",
    before_snapshot: "{{selected_booking_result.booking.booking_snapshot}}",
    after_snapshot: "cancelled",
    price_difference: "{{cancel_policy_result.refundAmount}}",
    reason: "Guest self-service cancellation"
  },
  schema: schemas.bookingChanges,
  uniqueKey: "change_id",
  idempotencyKey: "CAN-{{current_booking_id}}",
  outputVar: "cancel_change_record_result"
}));
node("cancel_booking_update", "record", 3840, 760, recordData({
  action: "update",
  collection: "hotel_bookings",
  where: { booking_id: "{{current_booking_id}}" },
  data: {
    booking_id: "{{current_booking_id}}",
    booking_code: "{{current_booking_code}}",
    guest_id: "{{current_booking_id}}",
    guest_name: "{{current_booking_guest_name}}",
    guest_phone: "{{current_booking_guest_phone}}",
    guest_email: "{{current_booking_guest_email}}",
    property_name: "{{current_booking_property_name}}",
    room_type_id: "{{selected_booking_result.booking.room_type_id}}",
    room_name: "{{current_booking_room_name}}",
    check_in: "{{current_booking_check_in}}",
    check_out: "{{current_booking_check_out}}",
    nights: "{{selected_booking_result.booking.nights}}",
    adults: "{{current_booking_adults}}",
    children: "{{current_booking_children}}",
    rooms_requested: "{{current_booking_rooms_requested}}",
    currency: "{{default_currency}}",
    subtotal: "{{selected_booking_result.booking.subtotal}}",
    tax_amount: "{{selected_booking_result.booking.tax_amount}}",
    fee_amount: "{{selected_booking_result.booking.fee_amount}}",
    total_amount: "{{current_booking_total_amount}}",
    paid_amount: "{{current_booking_paid_amount}}",
    balance_amount: "0",
    payment_status: "{{cancel_policy_result.refundStatus}}",
    status: "cancelled",
    quote_id: "{{selected_booking_result.booking.quote_id}}",
    hold_id: "{{selected_booking_result.booking.hold_id}}",
    package_name: "{{selected_booking_result.booking.package_name}}",
    cancellation_policy_snapshot: "{{selected_booking_result.booking.cancellation_policy_snapshot}}",
    special_requests: "{{selected_booking_result.booking.special_requests}}",
    booking_snapshot: "{{selected_booking_result.booking.booking_snapshot}}"
  },
  schema: schemas.bookings,
  uniqueKey: "booking_id",
  idempotencyKey: "{{current_booking_id}}:cancel",
  outputVar: "cancel_booking_update_result"
}));
node("cancel_notify", "notification", 4080, 760, notificationData({
  recipients: [
    { type: "customer", phone: "{{current_booking_guest_phone}}", email: "{{current_booking_guest_email}}" }
  ],
  channels: [
    { type: "sms", enabled: true, message: "Booking {{current_booking_code}} has been cancelled. Refund status: {{cancel_policy_result.refundStatus}}." },
    { type: "email", enabled: true, subject: "Booking cancelled", body: "Booking {{current_booking_code}} has been cancelled. Refund amount: {{default_currency}} {{cancel_policy_result.refundAmount}}." }
  ],
  dedupeKey: "{{current_booking_id}}:cancel_notify",
  outputVar: "cancel_notify_result"
}));
node("cancel_done_message", "message", 4320, 760, msgData("The booking has been cancelled. Refund status: {{cancel_policy_result.refundStatus}}."));
node("cancel_done_end", "end", 4560, 760, { messages: [] });

node("transfer_form", "form", 2880, 1100, formData("Share the transfer details.", [
  { key: "transfer_pickup_type", label: "Pickup type", type: "select", required: true, options: ["airport_pickup", "station_pickup"] },
  { key: "transfer_pickup_location", label: "Airport or station", type: "text", required: true },
  { key: "transfer_reference", label: "Flight or train number", type: "text", required: false },
  { key: "transfer_arrival_datetime", label: "Arrival date and time", type: "datetime", required: true },
  { key: "transfer_passenger_count", label: "Passenger count", type: "number", required: true },
  { key: "transfer_vehicle_preference", label: "Vehicle preference", type: "text", required: false }
], "transfer_form_result"));
node("transfer_pricing_script", "script", 3120, 1100, scriptData(transferPricingScript, "transfer_pricing_result"));
node("hydrate_transfer_pricing", "setVariable", 3360, 1100, setVars({
  transfer_charge_amount: "{{transfer_pricing_result.transferChargeAmount}}",
  transfer_charge_status: "{{transfer_pricing_result.transferChargeStatus}}",
  transfer_id: "{{transfer_pricing_result.transferCode}}",
  transfer_vehicle_label: "{{transfer_pricing_result.vehicleLabel}}"
}));
node("transfer_summary_message", "message", 3600, 1100, msgData("Transfer summary\\n\\nBooking: {{current_booking_code}}\\nType: {{transfer_pickup_type}}\\nPickup: {{transfer_pickup_location}}\\nVehicle: {{transfer_vehicle_label}}\\nCharge: {{default_currency}} {{transfer_charge_amount}}"));
node("transfer_confirm_input", "input", 3840, 1100, inputData("Would you like to add this transfer?", "transfer_confirm_choice", [
  { label: "Confirm", value: "yes" },
  { label: "Cancel", value: "no" }
]));
node("transfer_charge_switch", "switch", 4080, 1100, switchData("transfer_charge_status"));
node("set_transfer_payment", "setVariable", 4320, 1020, setVars({
  payment_id: "PAY-TRF-{{system.sessionId}}",
  payment_amount_due_now: "{{transfer_charge_amount}}",
  payment_status: "paid",
  payment_capture_mode: "transfer_payment",
  guest_mobile: "{{current_booking_guest_phone}}",
  guest_name: "{{current_booking_guest_name}}",
  guest_email: "{{current_booking_guest_email}}"
}));
node("transfer_payment", "payment", 4560, 1020, paymentData({
  amount: "{{payment_amount_due_now}}",
  description: "Airport or station transfer",
  outputVar: "transfer_payment_result"
}));
node("transfer_record", "record", 4800, 1100, recordData({
  action: "upsert",
  collection: "hotel_transfer_requests",
  where: { transfer_id: "{{transfer_id}}" },
  data: {
    transfer_id: "{{transfer_id}}",
    booking_id: "{{current_booking_id}}",
    booking_code: "{{current_booking_code}}",
    pickup_type: "{{transfer_pickup_type}}",
    pickup_location: "{{transfer_pickup_location}}",
    arrival_reference: "{{transfer_reference}}",
    arrival_datetime: "{{transfer_arrival_datetime}}",
    passenger_count: "{{transfer_passenger_count}}",
    vehicle_preference: "{{transfer_vehicle_preference}}",
    charge_amount: "{{transfer_charge_amount}}",
    status: "confirmed"
  },
  schema: schemas.transferRequests,
  uniqueKey: "transfer_id",
  idempotencyKey: "{{transfer_id}}",
  outputVar: "transfer_record_result"
}));
node("transfer_notify", "notification", 5040, 1100, notificationData({
  recipients: [
    { type: "customer", phone: "{{current_booking_guest_phone}}", email: "{{current_booking_guest_email}}" }
  ],
  channels: [
    { type: "sms", enabled: true, message: "Transfer {{transfer_id}} added to booking {{current_booking_code}}." }
  ],
  dedupeKey: "{{transfer_id}}:notify",
  outputVar: "transfer_notify_result"
}));
node("transfer_done_message", "message", 5280, 1100, msgData("The transfer request is confirmed and linked to booking {{current_booking_code}}."));
node("transfer_done_end", "end", 5520, 1100, { messages: [] });

node("early_late_form", "form", 2880, 1380, formData("Tell me what you need for this stay.", [
  { key: "early_late_request_type", label: "Request type", type: "select", required: true, options: ["early_check_in", "late_checkout"] },
  { key: "early_late_requested_time", label: "Preferred time", type: "text", required: false }
], "early_late_form_result"));
node("early_late_policy_script", "script", 3120, 1380, scriptData(earlyLatePolicyScript, "early_late_policy_result"));
node("hydrate_early_late_policy", "setVariable", 3360, 1380, setVars({
  early_late_outcome: "{{early_late_policy_result.outcome}}",
  early_late_charge_amount: "{{early_late_policy_result.chargeAmount}}",
  early_late_service_type: "{{early_late_policy_result.serviceType}}"
}));
node("early_late_switch", "switch", 3600, 1380, switchData("early_late_outcome"));
node("set_early_late_payment", "setVariable", 3840, 1300, setVars({
  payment_id: "PAY-EL-{{system.sessionId}}",
  payment_amount_due_now: "{{early_late_charge_amount}}",
  payment_status: "paid",
  payment_capture_mode: "early_late_charge",
  guest_mobile: "{{current_booking_guest_phone}}",
  guest_name: "{{current_booking_guest_name}}",
  guest_email: "{{current_booking_guest_email}}"
}));
node("early_late_payment", "payment", 4080, 1300, paymentData({
  amount: "{{payment_amount_due_now}}",
  description: "Early check-in or late checkout charge",
  outputVar: "early_late_payment_result"
}));
node("early_late_request_record", "record", 4320, 1380, recordData({
  action: "upsert",
  collection: "hotel_service_requests",
  where: { service_request_id: "EL-{{system.sessionId}}" },
  data: {
    service_request_id: "EL-{{system.sessionId}}",
    booking_id: "{{current_booking_id}}",
    booking_code: "{{current_booking_code}}",
    guest_phone: "{{current_booking_guest_phone}}",
    category: "front_desk",
    request_type: "{{early_late_service_type}}",
    description: "{{early_late_requested_time}}",
    priority: "normal",
    status: "open",
    room_number: "",
    assigned_department: "front_desk"
  },
  schema: schemas.serviceRequests,
  uniqueKey: "service_request_id",
  idempotencyKey: "EL-{{system.sessionId}}",
  outputVar: "early_late_request_result"
}));
node("early_late_message", "message", 4560, 1380, msgData("Your {{early_late_service_type}} request has been recorded against booking {{current_booking_code}}."));
node("early_late_end", "end", 4800, 1380, { messages: [] });
node("early_late_subject_to_availability", "message", 3840, 1460, msgData("I have recorded the preference against the booking. It remains subject to room readiness and operating policy."));
node("early_late_unavailable_message", "message", 3840, 1540, msgData("That request cannot be guaranteed from the maintained policy data. The booking remains unchanged."));
node("early_late_unavailable_end", "end", 4080, 1540, { messages: [] });

node("service_form", "form", 2880, 1660, formData("Share the guest service request.", [
  { key: "service_category", label: "Category", type: "select", required: true, options: ["housekeeping", "maintenance", "dining", "transport", "room", "laundry", "connectivity", "front_desk", "complaint"] },
  { key: "service_request_type", label: "Request type", type: "text", required: true },
  { key: "service_description", label: "Details", type: "textarea", required: false },
  { key: "service_room_number", label: "Room number", type: "text", required: false }
], "service_form_result"));
node("service_priority_script", "script", 3120, 1660, scriptData(servicePriorityScript, "service_priority_result"));
node("hydrate_service_priority", "setVariable", 3360, 1660, setVars({
  service_priority: "{{service_priority_result.priority}}",
  service_request_id: "{{service_priority_result.serviceRequestId}}"
}));
node("service_request_record", "record", 3600, 1660, recordData({
  action: "upsert",
  collection: "hotel_service_requests",
  where: { service_request_id: "{{service_request_id}}" },
  data: {
    service_request_id: "{{service_request_id}}",
    booking_id: "{{current_booking_id}}",
    booking_code: "{{current_booking_code}}",
    guest_phone: "{{current_booking_guest_phone}}",
    category: "{{service_category}}",
    request_type: "{{service_request_type}}",
    description: "{{service_description}}",
    priority: "{{service_priority}}",
    status: "open",
    room_number: "{{service_room_number}}",
    assigned_department: "{{service_category}}"
  },
  schema: schemas.serviceRequests,
  uniqueKey: "service_request_id",
  idempotencyKey: "{{service_request_id}}",
  outputVar: "service_request_record_result"
}));
node("service_notify", "notification", 3840, 1660, notificationData({
  recipients: [
    { type: "customer", phone: "{{current_booking_guest_phone}}", email: "{{current_booking_guest_email}}" }
  ],
  channels: [
    { type: "sms", enabled: true, message: "Service request {{service_request_id}} has been recorded." }
  ],
  dedupeKey: "{{service_request_id}}:notify",
  outputVar: "service_notify_result"
}));
node("service_done_message", "message", 4080, 1660, msgData("✅ Your request has been recorded. Reference: {{service_request_id}}."));
node("service_done_end", "end", 4320, 1660, { messages: [] });

node("issue_form", "form", 1200, 2060, formData("Describe the issue so I can prioritize it correctly.", [
  { key: "issue_booking_code", label: "Booking code", type: "text", required: false },
  { key: "issue_guest_phone", label: "Guest phone", type: "phone", required: false },
  { key: "issue_type", label: "Issue type", type: "text", required: true },
  { key: "issue_description", label: "Description", type: "textarea", required: true },
  { key: "issue_room_number", label: "Room number", type: "text", required: false }
], "issue_form_result"));
node("issue_priority_script", "script", 1440, 2060, scriptData(issuePriorityScript, "issue_priority_result"));
node("hydrate_issue_priority", "setVariable", 1680, 2060, setVars({
  issue_priority: "{{issue_priority_result.priority}}",
  support_case_id: "{{issue_priority_result.supportCaseId}}"
}));
node("issue_record", "record", 1920, 2060, recordData({
  action: "upsert",
  collection: "hotel_support_cases",
  where: { support_case_id: "{{support_case_id}}" },
  data: {
    support_case_id: "{{support_case_id}}",
    booking_id: "",
    guest_phone: "{{issue_guest_phone}}",
    department: "duty_manager",
    priority: "{{issue_priority}}",
    issue_type: "{{issue_type}}",
    summary: "{{issue_description}}",
    status: "open"
  },
  schema: schemas.supportCases,
  uniqueKey: "support_case_id",
  idempotencyKey: "{{support_case_id}}",
  outputVar: "issue_record_result"
}));
node("issue_priority_switch", "switch", 2160, 2060, switchData("issue_priority"));
node("issue_critical_queue", "queue", 2400, 1980, queueData("hotel_incident_response", "critical", "security,duty_manager,engineering", 1, "issue_critical_queue_result"));
node("issue_critical_handover", "handover", 2640, 1980, handoverData("A critical issue has been escalated to the duty manager and security team. Please call {{duty_manager_phone}} if immediate voice coordination is needed."));
node("issue_urgent_queue", "queue", 2400, 2060, queueData("hotel_urgent_issue", "high", "duty_manager,housekeeping,engineering", 10, "issue_urgent_queue_result"));
node("issue_ack_message", "message", 2640, 2060, msgData("The issue has been recorded with priority {{issue_priority}} under reference {{support_case_id}}. The hotel operations team has been notified."));
node("issue_ack_end", "end", 2880, 2060, { messages: [] });

node("group_form", "form", 1200, 2360, formData("Share the group or corporate booking requirement.", [
  { key: "group_company_name", label: "Company or group name", type: "text", required: false },
  { key: "group_contact_name", label: "Contact person", type: "text", required: true },
  { key: "group_phone", label: "Phone", type: "phone", required: true },
  { key: "group_email", label: "Email", type: "email", required: false },
  { key: "group_property_name", label: "Property", type: "text", required: false },
  { key: "group_check_in", label: "Check-in", type: "date", required: false },
  { key: "group_check_out", label: "Check-out", type: "date", required: false },
  { key: "group_rooms_required", label: "Rooms required", type: "number", required: true },
  { key: "group_guest_count", label: "Guest count", type: "number", required: true },
  { key: "group_room_mix", label: "Room mix", type: "text", required: false },
  { key: "group_meal_plan", label: "Meal plan", type: "text", required: false },
  { key: "group_event_requirement", label: "Event or conference requirement", type: "textarea", required: false },
  { key: "group_budget", label: "Budget", type: "text", required: false }
], "group_form_result"));
node("group_record", "record", 1440, 2360, recordData({
  action: "upsert",
  collection: "hotel_group_booking_leads",
  where: { group_lead_id: "GRP-{{system.sessionId}}" },
  data: {
    group_lead_id: "GRP-{{system.sessionId}}",
    company_name: "{{group_company_name}}",
    contact_name: "{{group_contact_name}}",
    phone: "{{group_phone}}",
    email: "{{group_email}}",
    property_name: "{{group_property_name}}",
    check_in: "{{group_check_in}}",
    check_out: "{{group_check_out}}",
    rooms_required: "{{group_rooms_required}}",
    guest_count: "{{group_guest_count}}",
    room_mix: "{{group_room_mix}}",
    meal_plan: "{{group_meal_plan}}",
    event_requirement: "{{group_event_requirement}}",
    budget: "{{group_budget}}",
    status: "open"
  },
  schema: schemas.groupLeads,
  uniqueKey: "group_lead_id",
  idempotencyKey: "GRP-{{system.sessionId}}",
  outputVar: "group_record_result"
}));
node("group_sales_queue", "queue", 1680, 2360, queueData("group_sales", "high", "sales,corporate,reservations", 30, "group_sales_queue_result"));
node("group_confirmation_message", "message", 1920, 2360, msgData("The group or corporate enquiry has been captured and assigned to the group sales workflow for negotiated follow-up."));
node("group_end", "end", 2160, 2360, { messages: [] });

node("set_talk_route", "setVariable", 1200, 2660, setVars({ management_route: "talk_to_team" }));
node("talk_form", "form", 1440, 2660, formData("Tell me who you need to speak with.", [
  { key: "talk_guest_name", label: "Name", type: "text", required: false },
  { key: "talk_guest_phone", label: "Phone", type: "phone", required: false },
  { key: "talk_department", label: "Department", type: "select", required: true, options: ["reservations", "front_desk", "housekeeping", "maintenance", "billing", "duty_manager", "group_sales", "concierge"] },
  { key: "talk_reason", label: "Reason", type: "textarea", required: true }
], "talk_form_result"));
node("talk_router", "switch", 1680, 2660, switchData("talk_department"));
node("talk_reservations_queue", "queue", 1920, 2500, queueData("reservations_support", "normal", "reservations", 30, "talk_reservations_result"));
node("talk_front_desk_queue", "queue", 1920, 2580, queueData("front_desk_support", "normal", "front_desk", 30, "talk_front_desk_result"));
node("talk_housekeeping_queue", "queue", 1920, 2660, queueData("housekeeping_support", "normal", "housekeeping", 30, "talk_housekeeping_result"));
node("talk_maintenance_queue", "queue", 1920, 2740, queueData("maintenance_support", "high", "maintenance", 15, "talk_maintenance_result"));
node("talk_billing_queue", "queue", 1920, 2820, queueData("billing_support", "high", "billing", 15, "talk_billing_result"));
node("talk_manager_queue", "queue", 1920, 2900, queueData("duty_manager_support", "high", "duty_manager", 10, "talk_manager_result"));
node("talk_group_sales_queue", "queue", 1920, 2980, queueData("group_sales_support", "high", "sales,group_sales", 30, "talk_group_sales_result"));
node("talk_concierge_queue", "queue", 1920, 3060, queueData("concierge_support", "normal", "concierge", 30, "talk_concierge_result"));
node("talk_handover", "handover", 2160, 2660, handoverData("Connecting you to the requested hotel team with your conversation context."));

node("set_scope_information", "setVariable", 1200, 3280, setVars({ knowledge_scope: "hotel_information", hotel_question: "" }));
node("set_scope_amenities", "setVariable", 1200, 3360, setVars({ knowledge_scope: "amenities", hotel_question: "" }));
node("set_scope_experiences", "setVariable", 1200, 3440, setVars({ knowledge_scope: "experiences", hotel_question: "" }));
node("set_scope_unknown", "setVariable", 1200, 3520, setVars({ knowledge_scope: "general", hotel_question: "{{main_guest_request}}" }));
node("hotel_knowledge_input", "input", 1440, 3360, inputData("What would you like to know about the hotel?", "hotel_question", []));
node("hotel_knowledge_faq", "faq", 1680, 3360, {
  loopCount: 1
});
node("hotel_knowledge_grounded", "ai-grounded", 1920, 3360, {
  contextTemplate:
    "Hotel support scope: rooms, rates, packages, amenities, dining, spa, experiences, airport transfer, check-in and check-out policies, payment and booking support, guest service workflows, and property-approved policy answers. Never invent availability, prices, taxes, deposits, refund decisions, or safety outcomes. Use fallback when the question requires unsupported operational data or a human decision.",
  inputTemplate: "{{hotel_question}}",
  instructions:
    "Answer only from approved hotel knowledge. Keep the response concise. If the question needs unsupported live data or a human decision, use the fallback response.",
  responseStyle: "concise",
  strictGrounding: true,
  includeCitations: false,
  includeCitationsInResponse: false,
  responseTemplate: "",
  fallbackResponseTemplate: "I should connect you to the hotel team for that exact answer.",
  fallbackMessage: "I should connect you to the hotel team for that exact answer.",
  outputVar: "hotel_knowledge_result",
  answerVar: "hotel_knowledge_answer",
  answerKeyValueVar: "hotel_knowledge_answer_key",
  emitResponse: true
});
node("hotel_knowledge_end", "end", 2160, 3360, { messages: [] });

node("system_failure_message", "message", 1200, 3740, msgData("I could not complete that step because the operational data or persistence layer did not respond cleanly. I am forwarding the context to the hotel team so the request does not stall."));
node("system_failure_handover", "handover", 1440, 3740, handoverData("Connecting this request to the hotel team now."));

node("modify_summary_message", "message", 9360, -120, msgData("Modified stay summary\\n\\nCurrent booking: {{current_booking_code}}\\nNew room: {{selected_room_name}}\\nNew stay: {{check_in_date}} to {{check_out_date}}\\nNew total: {{default_currency}} {{quote_total_amount}}\\nCurrent total: {{default_currency}} {{current_booking_total_amount}}"));
node("modify_settlement_script", "script", 9600, -120, scriptData(modifySettlementScript, "modify_settlement_result"));
node("hydrate_modify_settlement", "setVariable", 9840, -120, setVars({
  modification_settlement_status: "{{modify_settlement_result.settlementStatus}}",
  modification_price_difference: "{{modify_settlement_result.priceDifference}}",
  modified_booking_paid_amount: "{{modify_settlement_result.updatedPaidAmount}}",
  modified_booking_balance_amount: "{{modify_settlement_result.updatedBalanceAmount}}",
  modified_booking_payment_status: "{{modify_settlement_result.updatedPaymentStatus}}",
  modification_summary: "{{modify_settlement_result.settlementSummary}}"
}));
node("modify_settlement_switch", "switch", 10080, -120, switchData("modification_settlement_status"));
node("modify_charge_message", "message", 10320, -200, msgData("{{modification_summary}} Additional amount: {{default_currency}} {{modification_price_difference}}"));
node("set_modify_payment", "setVariable", 10560, -200, setVars({
  payment_id: "PAY-MOD-{{system.sessionId}}",
  payment_amount_due_now: "{{modification_price_difference}}",
  payment_status: "paid",
  payment_capture_mode: "modification_payment",
  guest_mobile: "{{current_booking_guest_phone}}",
  guest_name: "{{current_booking_guest_name}}",
  guest_email: "{{current_booking_guest_email}}"
}));
node("modify_payment", "payment", 10800, -200, paymentData({
  amount: "{{payment_amount_due_now}}",
  description: "Hotel booking modification payment",
  outputVar: "modify_payment_result"
}));
node("modify_payment_record", "record", 11040, -200, recordData({
  action: "upsert",
  collection: "hotel_payments",
  where: { payment_id: "{{payment_id}}" },
  data: {
    payment_id: "{{payment_id}}",
    booking_id: "{{current_booking_id}}",
    hold_id: "{{hold_id}}",
    amount: "{{payment_amount_due_now}}",
    currency: "{{default_currency}}",
    payment_type: "{{payment_capture_mode}}",
    provider: "{{payment_provider}}",
    status: "{{payment_status}}",
    provider_reference: "{{modify_payment_result}}",
    idempotency_key: "{{payment_id}}"
  },
  schema: schemas.payments,
  uniqueKey: "payment_id",
  idempotencyKey: "{{payment_id}}",
  outputVar: "modify_payment_record_result"
}));
node("modify_refund_message", "message", 10320, -120, msgData("{{modification_summary}} Refund difference: {{default_currency}} {{modification_price_difference}}"));
node("modify_no_change_message", "message", 10320, -40, msgData("{{modification_summary}}"));
node("modify_change_record", "record", 11280, -120, recordData({
  action: "upsert",
  collection: "hotel_booking_changes",
  where: { change_id: "MOD-{{current_booking_id}}" },
  data: {
    change_id: "MOD-{{current_booking_id}}",
    booking_id: "{{current_booking_id}}",
    change_type: "modification",
    before_snapshot: "{{selected_booking_result.booking.booking_snapshot}}",
    after_snapshot: "{{quote_pricing_snapshot}}",
    price_difference: "{{modification_price_difference}}",
    reason: "{{modification_summary}}"
  },
  schema: schemas.bookingChanges,
  uniqueKey: "change_id",
  idempotencyKey: "MOD-{{current_booking_id}}",
  outputVar: "modify_change_record_result"
}));
node("modify_booking_update", "record", 11520, -120, recordData({
  action: "update",
  collection: "hotel_bookings",
  where: { booking_id: "{{current_booking_id}}" },
  data: {
    booking_id: "{{current_booking_id}}",
    booking_code: "{{current_booking_code}}",
    guest_id: "{{guest_id}}",
    guest_name: "{{current_booking_guest_name}}",
    guest_phone: "{{current_booking_guest_phone}}",
    guest_email: "{{current_booking_guest_email}}",
    property_name: "{{property_search_key}}",
    room_type_id: "{{selected_room_type_id}}",
    room_name: "{{selected_room_name}}",
    check_in: "{{check_in_date}}",
    check_out: "{{check_out_date}}",
    nights: "{{stay_nights}}",
    adults: "{{adults_count}}",
    children: "{{children_count}}",
    rooms_requested: "{{rooms_requested}}",
    currency: "{{default_currency}}",
    subtotal: "{{quote_subtotal_amount}}",
    tax_amount: "{{quote_tax_amount}}",
    fee_amount: "{{quote_fee_amount}}",
    total_amount: "{{quote_total_amount}}",
    paid_amount: "{{modified_booking_paid_amount}}",
    balance_amount: "{{modified_booking_balance_amount}}",
    payment_status: "{{modified_booking_payment_status}}",
    status: "confirmed",
    quote_id: "{{quote_id}}",
    hold_id: "{{hold_id}}",
    package_name: "{{selected_package_name}}",
    cancellation_policy_snapshot: "{{selected_room_cancellation_policy}}",
    special_requests: "{{guest_special_request}}",
    booking_snapshot: "{{quote_pricing_snapshot}}"
  },
  schema: schemas.bookings,
  uniqueKey: "booking_id",
  idempotencyKey: "{{current_booking_id}}:modify",
  outputVar: "modify_booking_update_result"
}));
node("hold_consumed_update_modify", "record", 11760, -200, recordData({
  action: "update",
  collection: "hotel_booking_holds",
  where: { hold_id: "{{hold_id}}" },
  data: {
    hold_id: "{{hold_id}}",
    hold_code: "{{hold_id}}",
    quote_id: "{{quote_id}}",
    guest_id: "{{guest_id}}",
    property_name: "{{property_search_key}}",
    room_type_id: "{{selected_room_type_id}}",
    room_name: "{{selected_room_name}}",
    check_in: "{{check_in_date}}",
    check_out: "{{check_out_date}}",
    rooms_requested: "{{rooms_requested}}",
    status: "consumed",
    expires_at: "{{quote_expires_at}}"
  },
  schema: schemas.holds,
  uniqueKey: "hold_id",
  idempotencyKey: "{{hold_id}}:consumed:modify",
  outputVar: "hold_consumed_modify_result"
}));
node("modify_notify", "notification", 11760, -120, notificationData({
  recipients: [
    { type: "customer", phone: "{{current_booking_guest_phone}}", email: "{{current_booking_guest_email}}" }
  ],
  channels: [
    { type: "sms", enabled: true, message: "Booking {{current_booking_code}} has been modified. New stay: {{check_in_date}} to {{check_out_date}}." }
  ],
  dedupeKey: "{{current_booking_id}}:modify_notify",
  outputVar: "modify_notify_result"
}));
node("modify_done_message", "message", 12000, -120, msgData("The booking has been updated. Booking code remains {{current_booking_code}}. Payment status: {{modified_booking_payment_status}}."));
node("modify_done_end", "end", 12240, -120, { messages: [] });

edge("start_1", "set_template_defaults");
edge("set_template_defaults", "welcome_message");
edge("welcome_message", "main_request_input");
edge("main_request_input", "main_intent_router");

edgeValue("main_intent_router", "book_room", "set_route_book_room", "book_room");
edgeValue("main_intent_router", "check_rooms_rates", "set_route_check_rates", "check_rooms_rates");
edgeValue("main_intent_router", "packages_offers", "packages_intro_message", "packages_offers");
edgeValue("main_intent_router", "my_booking", "booking_lookup_intro", "my_booking");
edgeValue("main_intent_router", "modify_booking", "booking_lookup_intro", "modify_booking");
edgeValue("main_intent_router", "cancel_booking", "booking_lookup_intro", "cancel_booking");
edgeValue("main_intent_router", "payment_receipt", "booking_lookup_intro", "payment_receipt");
edgeValue("main_intent_router", "transfer_support", "booking_lookup_intro", "transfer_support");
edgeValue("main_intent_router", "early_late", "booking_lookup_intro", "early_late");
edgeValue("main_intent_router", "guest_service_request", "booking_lookup_intro", "guest_service_request");
edgeValue("main_intent_router", "report_issue", "issue_form", "report_issue");
edgeValue("main_intent_router", "group_booking", "group_form", "group_booking");
edgeValue("main_intent_router", "talk_to_team", "set_talk_route", "talk_to_team");
edgeValue("main_intent_router", "hotel_information", "set_scope_information", "hotel_information");
edgeValue("main_intent_router", "amenities_facilities", "set_scope_amenities", "amenities_facilities");
edgeValue("main_intent_router", "experiences", "set_scope_experiences", "experiences");
edge("main_intent_router", "set_scope_unknown", { isDefault: true, label: "unknown/default" });

edge("set_route_book_room", "property_input");
edge("set_route_check_rates", "property_input");
edge("packages_intro_message", "package_list");
recordRoutes("package_list", "package_carousel", "system_failure_message");
edge("package_carousel", "package_select_input");
edge("package_select_input", "select_package_script");
edge("select_package_script", "hydrate_selected_package", { condition: { operator: "equals", value: "success" }, label: "success" });
edge("select_package_script", "system_failure_message", { isDefault: true, label: "failed/default" });
edge("hydrate_selected_package", "selected_package_switch");
edgeValue("selected_package_switch", "selected", "check_in_input", "selected");
edge("selected_package_switch", "package_not_found_message", { isDefault: true, label: "not_found/default" });
edge("package_not_found_message", "package_not_found_end");

edge("property_input", "check_in_input");
edge("check_in_input", "check_out_input");
edge("check_out_input", "stay_guest_form");
edge("stay_guest_form", "preference_input");
edge("preference_input", "stay_validation_script");
edge("stay_validation_script", "hydrate_stay_validation", { condition: { operator: "equals", value: "success" }, label: "success" });
edge("stay_validation_script", "system_failure_message", { isDefault: true, label: "failed/default" });
edge("hydrate_stay_validation", "stay_validation_switch");
edgeValue("stay_validation_switch", "valid", "room_inventory_list", "valid");
edge("stay_validation_switch", "stay_invalid_message", { isDefault: true, label: "invalid/default" });
edge("stay_invalid_message", "stay_invalid_end");
recordRoutes("room_inventory_list", "room_search_script", "system_failure_message");
edge("room_search_script", "hydrate_room_search", { condition: { operator: "equals", value: "success" }, label: "success" });
edge("room_search_script", "system_failure_message", { isDefault: true, label: "failed/default" });
edge("hydrate_room_search", "room_match_switch");
edgeValue("room_match_switch", "exact", "room_carousel", "exact");
edgeValue("room_match_switch", "alternative", "room_carousel", "alternative");
edge("room_match_switch", "availability_followup_record", { isDefault: true, label: "none/default" });
recordRoutes("availability_followup_record", "no_availability_message", "system_failure_message");
edge("no_availability_message", "no_availability_end");
edge("room_carousel", "room_select_input");
edge("room_select_input", "select_room_script");
edge("select_room_script", "hydrate_selected_room", { condition: { operator: "equals", value: "success" }, label: "success" });
edge("select_room_script", "system_failure_message", { isDefault: true, label: "failed/default" });
edge("hydrate_selected_room", "selected_room_switch");
edgeValue("selected_room_switch", "selected", "selected_room_message", "selected");
edge("selected_room_switch", "selected_room_not_found_message", { isDefault: true, label: "not_found/default" });
edge("selected_room_not_found_message", "selected_room_not_found_end");
edge("selected_room_message", "room_selection_route_switch");
edgeValue("room_selection_route_switch", "check_rates", "rates_followup_input", "check_rates");
edgeValue("room_selection_route_switch", "modify_booking", "hydrate_guest_for_modify", "modify_booking");
edge("room_selection_route_switch", "guest_mobile_input", { isDefault: true, label: "booking/default" });
edge("rates_followup_input", "guest_mobile_input", { condition: { operator: "equals", value: "proceed" }, label: "proceed" });
edge("rates_followup_input", "rates_end_message", { isDefault: true, label: "end/default" });
edge("rates_end_message", "rates_end");
edge("guest_mobile_input", "guest_profile_find");
edgeValue("guest_profile_find", "success", "returning_guest_message", "success");
edgeValue("guest_profile_find", "duplicate", "returning_guest_message", "duplicate");
edgeValue("guest_profile_find", "not_found", "new_guest_form", "not_found");
edge("guest_profile_find", "system_failure_message", { isDefault: true, label: "failed/default" });
edge("returning_guest_message", "reuse_guest_input");
edgeValue("reuse_guest_input", "yes", "hydrate_returning_guest", "yes");
edge("reuse_guest_input", "new_guest_form", { isDefault: true, label: "no/default" });
edge("hydrate_returning_guest", "prepare_guest_identity");
edge("new_guest_form", "prepare_guest_identity");
edge("prepare_guest_identity", "guest_profile_upsert");
recordRoutes("guest_profile_upsert", "prepare_quote_hold_script", "system_failure_message");
edge("hydrate_guest_for_modify", "prepare_quote_hold_script");
edge("prepare_quote_hold_script", "hydrate_quote_hold", { condition: { operator: "equals", value: "success" }, label: "success" });
edge("prepare_quote_hold_script", "system_failure_message", { isDefault: true, label: "failed/default" });
edge("hydrate_quote_hold", "quote_record_upsert");
recordRoutes("quote_record_upsert", "hold_record_upsert", "system_failure_message");
recordRoutes("hold_record_upsert", "hold_expiry_scheduler", "system_failure_message");
schedulerRoutes("hold_expiry_scheduler", "post_hold_route_switch");
edgeValue("post_hold_route_switch", "modify_booking", "modify_summary_message", "modify_booking");
edge("post_hold_route_switch", "booking_summary_message", { isDefault: true, label: "booking/default" });

edge("booking_summary_message", "payment_choice_input");
edgeValue("payment_choice_input", "pay_full", "set_payment_full", "pay_full");
edgeValue("payment_choice_input", "pay_deposit", "set_payment_deposit", "pay_deposit");
edgeValue("payment_choice_input", "pay_at_hotel", "set_payment_hotel", "pay_at_hotel");
edge("payment_choice_input", "payment_failed_release_hold", { isDefault: true, label: "failed/default" });
edge("set_payment_full", "booking_payment");
edge("set_payment_deposit", "booking_payment");
edge("set_payment_hotel", "payment_record_upsert");
edge("booking_payment", "payment_record_upsert", { condition: { operator: "equals", value: "paid" }, label: "paid" });
edge("booking_payment", "payment_failed_release_hold", { isDefault: true, label: "failed/default" });
recordRoutes("payment_failed_release_hold", "payment_failed_message", "payment_failed_message");
edge("payment_failed_message", "payment_failed_end");
recordRoutes("payment_record_upsert", "booking_commit_script", "system_failure_message");
edge("booking_commit_script", "hydrate_booking_commit", { condition: { operator: "equals", value: "success" }, label: "success" });
edge("booking_commit_script", "system_failure_message", { isDefault: true, label: "failed/default" });
edge("hydrate_booking_commit", "booking_record_upsert");
recordRoutes("booking_record_upsert", "hold_consumed_update", "system_failure_message");
recordRoutes("hold_consumed_update", "booking_confirmation_notify", "system_failure_message");
notificationRoutes("booking_confirmation_notify", "prearrival_scheduler");
schedulerRoutes("prearrival_scheduler", "booking_confirmed_message");
edge("booking_confirmed_message", "booking_confirmed_end");

edge("booking_lookup_intro", "booking_lookup_form");
edge("booking_lookup_form", "booking_lookup_list");
recordRoutes("booking_lookup_list", "select_booking_script", "system_failure_message");
edge("select_booking_script", "hydrate_selected_booking", { condition: { operator: "equals", value: "success" }, label: "success" });
edge("select_booking_script", "system_failure_message", { isDefault: true, label: "failed/default" });
edge("hydrate_selected_booking", "selected_booking_switch");
edgeValue("selected_booking_switch", "found", "management_route_switch", "found");
edge("selected_booking_switch", "booking_not_found_message", { isDefault: true, label: "not_found/default" });
edge("booking_not_found_message", "booking_not_found_end");
edgeValue("management_route_switch", "my_booking", "my_booking_summary", "my_booking");
edgeValue("management_route_switch", "modify_booking", "modify_request_form", "modify_booking");
edgeValue("management_route_switch", "cancel_booking", "cancel_policy_script", "cancel_booking");
edgeValue("management_route_switch", "payment_receipt", "payment_action_input", "payment_receipt");
edgeValue("management_route_switch", "transfer_support", "transfer_form", "transfer_support");
edgeValue("management_route_switch", "early_late", "early_late_form", "early_late");
edgeValue("management_route_switch", "guest_service_request", "service_form", "guest_service_request");
edge("management_route_switch", "my_booking_summary", { isDefault: true, label: "default" });
edge("my_booking_summary", "my_booking_end");

edge("modify_request_form", "set_modify_context_script");
edge("set_modify_context_script", "hydrate_modify_context", { condition: { operator: "equals", value: "success" }, label: "success" });
edge("set_modify_context_script", "system_failure_message", { isDefault: true, label: "failed/default" });
edge("hydrate_modify_context", "stay_validation_script");

edge("payment_action_input", "payment_action_switch");
edgeValue("payment_action_switch", "pay_balance", "balance_due_message", "pay_balance");
edgeValue("payment_action_switch", "receipt", "payment_receipt_message", "receipt");
edgeValue("payment_action_switch", "refund_status", "refund_status_message", "refund_status");
edge("payment_action_switch", "payment_receipt_message", { isDefault: true, label: "default" });
edge("balance_due_message", "balance_due_switch");
edgeValue("balance_due_switch", "0", "no_balance_message", "zero");
edge("balance_due_switch", "set_balance_payment", { isDefault: true, label: "positive/default" });
edge("set_balance_payment", "balance_payment");
edge("balance_payment", "balance_payment_record", { condition: { operator: "equals", value: "paid" }, label: "paid" });
edge("balance_payment", "system_failure_message", { isDefault: true, label: "failed/default" });
recordRoutes("balance_payment_record", "balance_booking_update", "system_failure_message");
recordRoutes("balance_booking_update", "balance_payment_done_message", "system_failure_message");
edge("balance_payment_done_message", "balance_payment_done_end");
edge("no_balance_message", "payment_action_end");
edge("payment_receipt_message", "payment_action_end");
edge("refund_status_message", "payment_action_end");

edge("cancel_policy_script", "cancel_summary_message", { condition: { operator: "equals", value: "success" }, label: "success" });
edge("cancel_policy_script", "system_failure_message", { isDefault: true, label: "failed/default" });
edge("cancel_summary_message", "cancel_confirm_input");
edgeValue("cancel_confirm_input", "yes", "cancel_change_record", "yes");
edge("cancel_confirm_input", "payment_action_end", { isDefault: true, label: "no/default" });
recordRoutes("cancel_change_record", "cancel_booking_update", "system_failure_message");
recordRoutes("cancel_booking_update", "cancel_notify", "system_failure_message");
notificationRoutes("cancel_notify", "cancel_done_message");
edge("cancel_done_message", "cancel_done_end");

edge("transfer_form", "transfer_pricing_script");
edge("transfer_pricing_script", "hydrate_transfer_pricing", { condition: { operator: "equals", value: "success" }, label: "success" });
edge("transfer_pricing_script", "system_failure_message", { isDefault: true, label: "failed/default" });
edge("hydrate_transfer_pricing", "transfer_summary_message");
edge("transfer_summary_message", "transfer_confirm_input");
edgeValue("transfer_confirm_input", "yes", "transfer_charge_switch", "yes");
edge("transfer_confirm_input", "payment_action_end", { isDefault: true, label: "no/default" });
edgeValue("transfer_charge_switch", "payable", "set_transfer_payment", "payable");
edge("transfer_charge_switch", "transfer_record", { isDefault: true, label: "no_charge/default" });
edge("set_transfer_payment", "transfer_payment");
edge("transfer_payment", "transfer_record", { condition: { operator: "equals", value: "paid" }, label: "paid" });
edge("transfer_payment", "system_failure_message", { isDefault: true, label: "failed/default" });
recordRoutes("transfer_record", "transfer_notify", "system_failure_message");
notificationRoutes("transfer_notify", "transfer_done_message");
edge("transfer_done_message", "transfer_done_end");

edge("early_late_form", "early_late_policy_script");
edge("early_late_policy_script", "hydrate_early_late_policy", { condition: { operator: "equals", value: "success" }, label: "success" });
edge("early_late_policy_script", "system_failure_message", { isDefault: true, label: "failed/default" });
edge("hydrate_early_late_policy", "early_late_switch");
edgeValue("early_late_switch", "guaranteed", "set_early_late_payment", "guaranteed");
edgeValue("early_late_switch", "request_only", "early_late_subject_to_availability", "request_only");
edge("early_late_switch", "early_late_unavailable_message", { isDefault: true, label: "unavailable/default" });
edge("set_early_late_payment", "early_late_payment");
edge("early_late_payment", "early_late_request_record", { condition: { operator: "equals", value: "paid" }, label: "paid" });
edge("early_late_payment", "system_failure_message", { isDefault: true, label: "failed/default" });
recordRoutes("early_late_request_record", "early_late_message", "system_failure_message");
edge("early_late_message", "early_late_end");
edge("early_late_subject_to_availability", "early_late_request_record");
edge("early_late_unavailable_message", "early_late_unavailable_end");

edge("service_form", "service_priority_script");
edge("service_priority_script", "hydrate_service_priority", { condition: { operator: "equals", value: "success" }, label: "success" });
edge("service_priority_script", "system_failure_message", { isDefault: true, label: "failed/default" });
edge("hydrate_service_priority", "service_request_record");
recordRoutes("service_request_record", "service_notify", "system_failure_message");
notificationRoutes("service_notify", "service_done_message");
edge("service_done_message", "service_done_end");

edge("issue_form", "issue_priority_script");
edge("issue_priority_script", "hydrate_issue_priority", { condition: { operator: "equals", value: "success" }, label: "success" });
edge("issue_priority_script", "system_failure_message", { isDefault: true, label: "failed/default" });
edge("hydrate_issue_priority", "issue_record");
recordRoutes("issue_record", "issue_priority_switch", "system_failure_message");
edgeValue("issue_priority_switch", "critical", "issue_critical_queue", "critical");
edgeValue("issue_priority_switch", "urgent", "issue_urgent_queue", "urgent");
edge("issue_priority_switch", "issue_ack_message", { isDefault: true, label: "normal_or_high/default" });
edge("issue_critical_queue", "issue_critical_handover", { condition: { operator: "equals", value: "assigned" }, label: "assigned" });
edge("issue_critical_queue", "issue_critical_handover", { condition: { operator: "equals", value: "queued" }, label: "queued" });
edge("issue_critical_queue", "issue_critical_handover", { isDefault: true, label: "failed/default" });
edge("issue_urgent_queue", "issue_ack_message", { condition: { operator: "equals", value: "assigned" }, label: "assigned" });
edge("issue_urgent_queue", "issue_ack_message", { condition: { operator: "equals", value: "queued" }, label: "queued" });
edge("issue_urgent_queue", "issue_ack_message", { isDefault: true, label: "failed/default" });
edge("issue_ack_message", "issue_ack_end");

edge("group_form", "group_record");
recordRoutes("group_record", "group_sales_queue", "system_failure_message");
edge("group_sales_queue", "group_confirmation_message", { condition: { operator: "equals", value: "assigned" }, label: "assigned" });
edge("group_sales_queue", "group_confirmation_message", { condition: { operator: "equals", value: "queued" }, label: "queued" });
edge("group_sales_queue", "group_confirmation_message", { isDefault: true, label: "failed/default" });
edge("group_confirmation_message", "group_end");

edge("set_talk_route", "talk_form");
edge("talk_form", "talk_router");
edgeValue("talk_router", "reservations", "talk_reservations_queue", "reservations");
edgeValue("talk_router", "front_desk", "talk_front_desk_queue", "front_desk");
edgeValue("talk_router", "housekeeping", "talk_housekeeping_queue", "housekeeping");
edgeValue("talk_router", "maintenance", "talk_maintenance_queue", "maintenance");
edgeValue("talk_router", "billing", "talk_billing_queue", "billing");
edgeValue("talk_router", "duty_manager", "talk_manager_queue", "duty_manager");
edgeValue("talk_router", "group_sales", "talk_group_sales_queue", "group_sales");
edgeValue("talk_router", "concierge", "talk_concierge_queue", "concierge");
edge("talk_router", "talk_front_desk_queue", { isDefault: true, label: "default" });
for (const queueId of [
  "talk_reservations_queue",
  "talk_front_desk_queue",
  "talk_housekeeping_queue",
  "talk_maintenance_queue",
  "talk_billing_queue",
  "talk_manager_queue",
  "talk_group_sales_queue",
  "talk_concierge_queue"
]) {
  edge(queueId, "talk_handover", { condition: { operator: "equals", value: "assigned" }, label: "assigned" });
  edge(queueId, "talk_handover", { condition: { operator: "equals", value: "queued" }, label: "queued" });
  edge(queueId, "talk_handover", { isDefault: true, label: "failed/default" });
}

edge("set_scope_information", "hotel_knowledge_input");
edge("set_scope_amenities", "hotel_knowledge_input");
edge("set_scope_experiences", "hotel_knowledge_input");
edge("set_scope_unknown", "hotel_knowledge_faq");
edge("hotel_knowledge_input", "hotel_knowledge_faq");
edge("hotel_knowledge_faq", "hotel_knowledge_grounded", { condition: { operator: "equals", value: "not_found" }, label: "not_found" });
edge("hotel_knowledge_faq", "hotel_knowledge_end", { isDefault: true, label: "answered/default" });
edge("hotel_knowledge_grounded", "hotel_knowledge_end", { condition: { operator: "equals", value: "grounded" }, label: "grounded" });
edge("hotel_knowledge_grounded", "system_failure_message", { isDefault: true, label: "fallback/default" });

edge("system_failure_message", "system_failure_handover");

edge("modify_summary_message", "modify_settlement_script");
edge("modify_settlement_script", "hydrate_modify_settlement", { condition: { operator: "equals", value: "success" }, label: "success" });
edge("modify_settlement_script", "system_failure_message", { isDefault: true, label: "failed/default" });
edge("hydrate_modify_settlement", "modify_settlement_switch");
edgeValue("modify_settlement_switch", "charge_due", "modify_charge_message", "charge_due");
edgeValue("modify_settlement_switch", "refund_due", "modify_refund_message", "refund_due");
edge("modify_settlement_switch", "modify_no_change_message", { isDefault: true, label: "no_change/default" });
edge("modify_charge_message", "set_modify_payment");
edge("set_modify_payment", "modify_payment");
edge("modify_payment", "modify_payment_record", { condition: { operator: "equals", value: "paid" }, label: "paid" });
edge("modify_payment", "payment_failed_release_hold", { isDefault: true, label: "failed/default" });
recordRoutes("modify_payment_record", "modify_change_record", "system_failure_message");
edge("modify_refund_message", "modify_change_record");
edge("modify_no_change_message", "modify_change_record");
recordRoutes("modify_change_record", "modify_booking_update", "system_failure_message");
recordRoutes("modify_booking_update", "hold_consumed_update_modify", "system_failure_message");
recordRoutes("hold_consumed_update_modify", "modify_notify", "system_failure_message");
notificationRoutes("modify_notify", "modify_done_message");
edge("modify_done_message", "modify_done_end");

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
