import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const domainRoot = join(rootDir, "domains", "real-estate");
const sourcePath = join(
  domainRoot,
  "templates-source",
  "real-estate-lead-to-site-visit.source.flow.json"
);
const builtPath = join(
  domainRoot,
  "templates",
  "real-estate-lead-to-site-visit.flow.json"
);
const stablePath = join(
  domainRoot,
  "templates-stable",
  "real-estate-lead-to-site-visit.flow.json"
);

const exportDoc = {
  version: "1.0",
  exportedAt: "2026-08-20T00:00:00.000Z",
  bot: {
    name: "Real Estate Lead to Site Visit",
    description:
      "Automation-first real-estate buyer journey that captures requirements, matches live inventory, shares brochures, qualifies intent, books site visits, queues CRM sync, schedules reminders, and alerts sales on hot leads.",
    headerTitle: "Real Estate Lead to Site Visit",
    headerTagline: "AI buyer qualification and site-visit conversion",
    globalVariables: [
      { key: "brand_name", value: "Crescora.ai" },
      { key: "default_currency", value: "INR" },
      { key: "default_timezone", value: "Asia/Kolkata" },
      { key: "crm_provider", value: "generic_crm" },
      { key: "sales_alert_phone", value: "+91-90000-45000" },
      { key: "sales_alert_email", value: "sales@builder.example.com" },
      { key: "site_visit_support_phone", value: "+91-90000-46000" },
      { key: "brochure_email", value: "brochures@builder.example.com" }
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

function yesNoButtons() {
  return [
    { label: "Yes", value: "yes" },
    { label: "No", value: "no" }
  ];
}

function mainMenuButtons() {
  return [
    { label: "🏠 Find a Property", value: "find_property" },
    { label: "🏢 Explore Projects", value: "explore_projects" },
    { label: "📄 Brochure & Floor Plans", value: "get_brochure" },
    { label: "⚖️ Compare Properties", value: "compare_properties" },
    { label: "❤️ My Shortlist", value: "my_shortlist" },
    { label: "📅 Book / Manage Site Visit", value: "book_site_visit" },
    { label: "💰 Pricing & Offers", value: "pricing_offers" },
    { label: "👤 Talk to Sales", value: "talk_to_sales" }
  ];
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

function notificationData({
  recipients,
  channels,
  outputVar,
  dedupeKey,
  messageCategory = "transactional"
}) {
  return {
    recipients,
    recipientsJson: pretty(recipients),
    channels,
    channelsJson: pretty(channels),
    strategy: "priority_order",
    messageCategory,
    dedupeKey,
    defaultCountryCode: "+91",
    strictTemplateValidation: true,
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

function mediaData(mediaType, url, caption, fileName) {
  return {
    mediaType,
    url,
    caption,
    fileName
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
    dateVar: "site_visit_date",
    horizonDays: 14,
    maxSlotsPerDay: 6,
    dynamicSlotsVar,
    dynamicSlotsPath: "data",
    slotDurationMins: 60,
    slotIntervalMins: 30,
    availableWeekdays: "1,2,3,4,5,6,0",
    workingHoursStart: "09:00",
    workingHoursEnd: "19:00",
    ...overrides
  };
}

function switchData(variable) {
  return { variable };
}

function recordRoutes(recordId, successId, defaultId, duplicateId = successId, notFoundId = defaultId) {
  edgeValue(recordId, "success", successId, "success");
  if (duplicateId === successId) {
    edgeValue(recordId, "duplicate", successId, "duplicate");
  } else {
    edgeValue(recordId, "duplicate", duplicateId, "duplicate");
  }
  if (notFoundId === defaultId) {
    edgeValue(recordId, "not_found", defaultId, "not_found");
  } else {
    edgeValue(recordId, "not_found", notFoundId, "not_found");
  }
  edge(recordId, defaultId, { isDefault: true, label: "validation_failed/failed/default" });
}

function schedulerRoutes(schedulerId, nextId) {
  edgeValue(schedulerId, "scheduled", nextId, "scheduled");
  edgeValue(schedulerId, "skipped", nextId, "skipped");
  edge(schedulerId, nextId, { isDefault: true, label: "failed/expired/default" });
}

function notificationRoutes(notificationId, nextId) {
  edgeValue(notificationId, "sent", nextId, "sent");
  edgeValue(notificationId, "partially_sent", nextId, "partially_sent");
  edge(notificationId, nextId, { isDefault: true, label: "failed/default" });
}

function scriptRoutes(scriptId, successId, failureId) {
  edgeValue(scriptId, "success", successId, "success");
  edge(scriptId, failureId, { isDefault: true, label: "failure/default" });
}

const schemas = {
  contacts: pretty({
    collection: "real_estate_contacts",
    fields: {
      contact_id: { type: "string", required: true, unique: true },
      full_name: { type: "string", required: false },
      phone_e164: { type: "phone", required: true, unique: true },
      email: { type: "email", required: false },
      first_source: { type: "string", required: true },
      last_source: { type: "string", required: true },
      first_seen_at: { type: "string", required: false },
      last_seen_at: { type: "string", required: false },
      last_requirement_summary: { type: "string", required: false },
      last_preferred_location: { type: "string", required: false },
      last_budget_min_minor: { type: "number", required: false },
      last_budget_max_minor: { type: "number", required: false },
      last_property_type: { type: "string", required: false },
      last_bhk: { type: "string", required: false },
      last_purchase_timeline: { type: "string", required: false },
      last_purchase_purpose: { type: "string", required: false },
      last_financing_status: { type: "string", required: false },
      last_active_lead_id: { type: "string", required: false }
    }
  }),
  leads: pretty({
    collection: "real_estate_leads",
    fields: {
      lead_id: { type: "string", required: true, unique: true },
      contact_id: { type: "string", required: true },
      buyer_mobile: { type: "phone", required: true },
      buyer_name: { type: "string", required: false },
      buyer_email: { type: "email", required: false },
      source_channel: { type: "string", required: true },
      status: {
        type: "enum",
        values: ["open", "nurture", "site_visit_booked", "closed"]
      },
      stage: {
        type: "enum",
        values: [
          "requirements_captured",
          "projects_shared",
          "brochure_shared",
          "site_visit_pending_confirmation",
          "site_visit_booked",
          "nurture"
        ]
      },
      preferred_location: { type: "string", required: false },
      budget_min_minor: { type: "number", required: false },
      budget_max_minor: { type: "number", required: false },
      budget_range_label: { type: "string", required: false },
      property_type: { type: "string", required: false },
      bhk: { type: "string", required: false },
      purchase_purpose: { type: "string", required: false },
      purchase_timeline: { type: "string", required: false },
      possession_preference: { type: "string", required: false },
      financing_status: { type: "string", required: false },
      requirement_summary: { type: "string", required: false },
      lead_score: { type: "number", required: false },
      lead_temperature: {
        type: "enum",
        values: ["hot", "warm", "nurture"]
      },
      selected_project_id: { type: "string", required: false },
      selected_project_name: { type: "string", required: false },
      site_visit_id: { type: "string", required: false },
      site_visit_status: { type: "string", required: false },
      last_activity_at: { type: "string", required: false }
    }
  }),
  inventory: pretty({
    collection: "property_inventory",
    fields: {
      project_id: { type: "string", required: true, unique: true },
      project_code: { type: "string", required: true, unique: true },
      project_name: { type: "string", required: true },
      developer_name: { type: "string", required: false },
      location: { type: "string", required: true },
      micro_market: { type: "string", required: false },
      property_type: { type: "string", required: true },
      bhk_options: { type: "string", required: false },
      min_price_minor: { type: "number", required: false },
      max_price_minor: { type: "number", required: false },
      min_area_sqft: { type: "number", required: false },
      max_area_sqft: { type: "number", required: false },
      possession_label: { type: "string", required: false },
      project_status: { type: "string", required: false },
      rera_number: { type: "string", required: false },
      highlights: { type: "string", required: false },
      brochure_url: { type: "url", required: false },
      image_url: { type: "url", required: false },
      location_url: { type: "url", required: false },
      sales_owner_name: { type: "string", required: false },
      sales_owner_phone: { type: "phone", required: false },
      sales_owner_email: { type: "email", required: false },
      active: { type: "boolean", required: true }
    }
  }),
  leadProjectInterests: pretty({
    collection: "real_estate_lead_project_interests",
    fields: {
      interest_id: { type: "string", required: true, unique: true },
      lead_id: { type: "string", required: true },
      project_id: { type: "string", required: true },
      project_name: { type: "string", required: true },
      match_score: { type: "number", required: false },
      brochure_requested: { type: "boolean", required: true },
      shortlisted: { type: "boolean", required: true },
      site_visit_requested: { type: "boolean", required: true },
      site_visit_id: { type: "string", required: false },
      last_viewed_at: { type: "string", required: false }
    }
  }),
  leadActivities: pretty({
    collection: "real_estate_lead_activities",
    fields: {
      activity_id: { type: "string", required: true, unique: true },
      lead_id: { type: "string", required: true },
      contact_id: { type: "string", required: true },
      project_id: { type: "string", required: false },
      activity_type: { type: "string", required: true },
      channel: { type: "string", required: true },
      summary: { type: "string", required: false },
      occurred_at: { type: "string", required: false }
    }
  }),
  siteVisitSlots: pretty({
    collection: "real_estate_site_visit_slots",
    fields: {
      slot_id: { type: "string", required: true, unique: true },
      project_id: { type: "string", required: true },
      date: { type: "string", required: true },
      start: { type: "string", required: true },
      end: { type: "string", required: false },
      label: { type: "string", required: true },
      status: {
        type: "enum",
        values: ["available", "held", "confirmed", "blocked"]
      },
      hold_id: { type: "string", required: false },
      held_by_session: { type: "string", required: false },
      hold_expires_at: { type: "string", required: false }
    }
  }),
  siteVisitHolds: pretty({
    collection: "real_estate_site_visit_holds",
    fields: {
      hold_id: { type: "string", required: true, unique: true },
      lead_id: { type: "string", required: true },
      slot_id: { type: "string", required: true },
      project_id: { type: "string", required: true },
      session_id: { type: "string", required: true },
      status: {
        type: "enum",
        values: ["active", "released", "converted", "expired"]
      },
      expires_at: { type: "string", required: false }
    }
  }),
  siteVisits: pretty({
    collection: "real_estate_site_visits",
    fields: {
      site_visit_id: { type: "string", required: true, unique: true },
      lead_id: { type: "string", required: true },
      contact_id: { type: "string", required: true },
      project_id: { type: "string", required: true },
      project_name: { type: "string", required: true },
      slot_id: { type: "string", required: true },
      visit_date: { type: "string", required: true },
      visit_time: { type: "string", required: true },
      visit_datetime: { type: "string", required: true },
      source_channel: { type: "string", required: true },
      status: {
        type: "enum",
        values: ["confirmed", "cancelled", "completed", "no_show"]
      },
      assigned_salesperson_name: { type: "string", required: false },
      assigned_salesperson_phone: { type: "phone", required: false }
    }
  }),
  followupJobs: pretty({
    collection: "real_estate_followup_jobs",
    fields: {
      followup_id: { type: "string", required: true, unique: true },
      lead_id: { type: "string", required: true },
      project_id: { type: "string", required: false },
      followup_type: { type: "string", required: true },
      scheduled_for: { type: "string", required: false },
      channel: { type: "string", required: true },
      status: {
        type: "enum",
        values: ["scheduled", "sent", "failed", "cancelled"]
      },
      notes: { type: "string", required: false }
    }
  }),
  crmSyncJobs: pretty({
    collection: "real_estate_crm_sync_jobs",
    fields: {
      sync_job_id: { type: "string", required: true, unique: true },
      lead_id: { type: "string", required: true },
      entity_type: { type: "string", required: true },
      operation: { type: "string", required: true },
      crm_provider: { type: "string", required: true },
      status: {
        type: "enum",
        values: ["pending", "processing", "success", "retry", "failed"]
      },
      payload_summary: { type: "string", required: false },
      created_at: { type: "string", required: false }
    }
  })
};

const requirementFields = [
  {
    key: "buyer_mobile",
    label: "Mobile number",
    type: "phone",
    required: true
  }
];

const newContactFields = [
  {
    key: "buyer_name",
    label: "Full name",
    type: "text",
    required: true
  },
  {
    key: "buyer_email",
    label: "Email",
    type: "email",
    required: false
  }
];

const parseRequirementScript = `
const rawText = String(vars.buyer_requirement_text || "").trim();
const lowered = rawText.toLowerCase();
const knownLocations = [
  "kokapet",
  "financial district",
  "tellapur",
  "narsingi",
  "gachibowli",
  "kondapur",
  "hitech city"
];
const crorePattern = /(\\d+(?:\\.\\d+)?)\\s*(?:cr|crore|crores)/i;
const lakhPattern = /(\\d+(?:\\.\\d+)?)\\s*(?:l|lac|lakh|lakhs)/i;
function toMinorFromCrore(value) {
  return Math.round(Number(value) * 10000000 * 100);
}
function toMinorFromLakh(value) {
  return Math.round(Number(value) * 100000 * 100);
}
function formatBudgetLabel(min, max) {
  if (min && max) {
    return "₹" + Math.round(min / 10000000) / 100 + " Cr - ₹" + Math.round(max / 10000000) / 100 + " Cr";
  }
  if (max) {
    return "Up to ₹" + Math.round(max / 10000000) / 100 + " Cr";
  }
  return "";
}
let preferredLocation = "";
for (const location of knownLocations) {
  if (lowered.includes(location)) {
    preferredLocation = location
      .split(" ")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
    break;
  }
}
let propertyType = "";
if (/(villa|villas)/i.test(rawText)) propertyType = "Villa";
else if (/(plot|plots|land)/i.test(rawText)) propertyType = "Plot";
else if (/(independent house|house)/i.test(rawText)) propertyType = "Independent House";
else if (/(apartment|flat|bhk)/i.test(rawText)) propertyType = "Apartment";
let bhk = "";
const bhkMatch = rawText.match(/(2|3|4|5)\\s*(?:\\+\\s*)?bhk/i);
if (bhkMatch) {
  bhk = bhkMatch[1] === "5" ? "4+ BHK" : bhkMatch[1] + " BHK";
}
let budgetMinMinor = vars.budget_min_minor ? Number(vars.budget_min_minor) : 0;
let budgetMaxMinor = vars.budget_max_minor ? Number(vars.budget_max_minor) : 0;
const rangeMatch = rawText.match(/(\\d+(?:\\.\\d+)?)\\s*(?:cr|crore|crores|lakh|lakhs|lac|l)\\s*(?:to|-|–)\\s*(\\d+(?:\\.\\d+)?)\\s*(?:cr|crore|crores|lakh|lakhs|lac|l)/i);
if (rangeMatch) {
  const first = Number(rangeMatch[1]);
  const second = Number(rangeMatch[2]);
  if (/crore|cr/i.test(rangeMatch[0])) {
    budgetMinMinor = toMinorFromCrore(first);
    budgetMaxMinor = toMinorFromCrore(second);
  } else {
    budgetMinMinor = toMinorFromLakh(first);
    budgetMaxMinor = toMinorFromLakh(second);
  }
} else {
  const croreMatch = rawText.match(crorePattern);
  const lakhMatch = rawText.match(lakhPattern);
  if (croreMatch) {
    budgetMaxMinor = toMinorFromCrore(croreMatch[1]);
    budgetMinMinor = Math.round(budgetMaxMinor * 0.85);
  } else if (lakhMatch) {
    budgetMaxMinor = toMinorFromLakh(lakhMatch[1]);
    budgetMinMinor = Math.round(budgetMaxMinor * 0.85);
  }
}
let purchaseTimeline = "";
if (/immediate|immediately|this month/i.test(rawText)) purchaseTimeline = "Immediately";
else if (/1\\s*-\\s*3\\s*month/i.test(rawText) || /within 3 months/i.test(rawText)) purchaseTimeline = "1-3 Months";
else if (/3\\s*-\\s*6\\s*month/i.test(rawText) || /within 6 months/i.test(rawText)) purchaseTimeline = "3-6 Months";
else if (/exploring|just looking/i.test(rawText)) purchaseTimeline = "Just Exploring";
let purchasePurpose = "";
if (/investment|investor/i.test(rawText)) purchasePurpose = "Investment";
else if (/family|self use|own use|live in/i.test(rawText)) purchasePurpose = "Self Use";
let possessionPreference = "";
if (/ready to move|ready/i.test(rawText)) possessionPreference = "Ready to Move";
else if (/under construction/i.test(rawText)) possessionPreference = "Under Construction is Fine";
vars.preferred_location = preferredLocation || vars.preferred_location || "";
vars.property_type = propertyType || vars.property_type || "";
vars.bhk = bhk || vars.bhk || "";
vars.budget_min_minor = budgetMinMinor || Number(vars.budget_min_minor || 0) || 0;
vars.budget_max_minor = budgetMaxMinor || Number(vars.budget_max_minor || 0) || 0;
vars.budget_range_label = formatBudgetLabel(vars.budget_min_minor, vars.budget_max_minor) || vars.budget_range_label || "";
vars.purchase_timeline = purchaseTimeline || vars.purchase_timeline || "";
vars.purchase_purpose = purchasePurpose || vars.purchase_purpose || "";
vars.possession_preference = possessionPreference || vars.possession_preference || "";
return {
  preferred_location: vars.preferred_location,
  property_type: vars.property_type,
  bhk: vars.bhk,
  budget_range_label: vars.budget_range_label,
  purchase_timeline: vars.purchase_timeline,
  purchase_purpose: vars.purchase_purpose,
  possession_preference: vars.possession_preference
};
`;

const refreshRequirementFlagsScript = `
function present(value) {
  return String(value || "").trim().length > 0;
}
const propertyType = String(vars.property_type || "").trim().toLowerCase();
const needsBhk = propertyType && propertyType !== "plot" ? "yes" : propertyType === "plot" ? "no" : "unknown";
const budgetKnown = Number(vars.budget_max_minor || 0) > 0;
vars.has_preferred_location = present(vars.preferred_location) ? "yes" : "no";
vars.has_property_type = present(vars.property_type) ? "yes" : "no";
vars.needs_bhk = needsBhk;
vars.has_bhk_or_na = needsBhk === "no" || present(vars.bhk) ? "yes" : "no";
vars.has_budget_range = budgetKnown ? "yes" : "no";
vars.has_purchase_purpose = present(vars.purchase_purpose) ? "yes" : "no";
vars.has_purchase_timeline = present(vars.purchase_timeline) ? "yes" : "no";
vars.has_possession_preference = present(vars.possession_preference) ? "yes" : "no";
vars.has_financing_status = present(vars.financing_status) ? "yes" : "no";
vars.requirement_summary =
  (present(vars.bhk) ? vars.bhk + " " : "") +
  (present(vars.property_type) ? vars.property_type : "Property") +
  (present(vars.preferred_location) ? " in " + vars.preferred_location : "") +
  (present(vars.budget_range_label) ? " within " + vars.budget_range_label : "");
return {
  requirement_summary: vars.requirement_summary,
  flags: {
    has_preferred_location: vars.has_preferred_location,
    has_property_type: vars.has_property_type,
    has_bhk_or_na: vars.has_bhk_or_na,
    has_budget_range: vars.has_budget_range,
    has_purchase_purpose: vars.has_purchase_purpose,
    has_purchase_timeline: vars.has_purchase_timeline,
    has_possession_preference: vars.has_possession_preference,
    has_financing_status: vars.has_financing_status
  }
};
`;

const budgetNormalizationScript = `
const raw = String(vars.budget_range_choice || "").trim();
const ranges = {
  "under_75_lakh": [0, 7500000 * 100, "Under ₹75L"],
  "75_lakh_to_1_cr": [7500000 * 100, 10000000 * 100, "₹75L - ₹1 Cr"],
  "1_cr_to_1_5_cr": [10000000 * 100, 15000000 * 100, "₹1 Cr - ₹1.5 Cr"],
  "1_5_cr_to_2_cr": [15000000 * 100, 20000000 * 100, "₹1.5 Cr - ₹2 Cr"],
  "2_cr_plus": [20000000 * 100, 35000000 * 100, "₹2 Cr+"]
};
const selected = ranges[raw] || [0, 0, ""];
vars.budget_min_minor = selected[0];
vars.budget_max_minor = selected[1];
vars.budget_range_label = selected[2];
vars.has_budget_range = selected[1] > 0 ? "yes" : "no";
return {
  budget_min_minor: vars.budget_min_minor,
  budget_max_minor: vars.budget_max_minor,
  budget_range_label: vars.budget_range_label
};
`;

const identityPreparationScript = `
function digits(value) {
  return String(value || "").replace(/\\D+/g, "");
}
const nowIso = new Date().toISOString();
const runtimeSeed = String(Date.now()).slice(-8);
const phoneDigits = digits(vars.buyer_mobile).slice(-10) || "0000000000";
const existingContactId = String(vars.existing_contact_result?.data?.contact_id || "").trim();
const existingName = String(vars.existing_contact_result?.data?.full_name || "").trim();
const existingEmail = String(vars.existing_contact_result?.data?.email || "").trim();
const existingFirstSeenAt = String(vars.existing_contact_result?.data?.first_seen_at || "").trim();
vars.contact_id = existingContactId || "CNT-" + phoneDigits;
vars.lead_id = String(vars.lead_id || "").trim() || "LD-" + phoneDigits.slice(-4) + runtimeSeed;
vars.buyer_name = String(vars.buyer_name || "").trim() || existingName;
vars.buyer_email = String(vars.buyer_email || "").trim() || existingEmail;
vars.contact_first_seen_at = existingFirstSeenAt || nowIso;
vars.interaction_time_iso = nowIso;
vars.lead_status = "open";
vars.lead_stage = "requirements_captured";
vars.brochure_requested = String(vars.brochure_requested || "no");
vars.site_visit_requested = String(vars.site_visit_requested || "no");
return {
  contact_id: vars.contact_id,
  lead_id: vars.lead_id,
  buyer_name: vars.buyer_name,
  buyer_email: vars.buyer_email,
  contact_first_seen_at: vars.contact_first_seen_at,
  interaction_time_iso: vars.interaction_time_iso
};
`;

const matchProjectsScript = `
function normalize(value) {
  return String(value || "").trim().toLowerCase();
}
function titleCase(value) {
  return String(value || "")
    .split(/\\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
function formatCrorePrice(amountMinor) {
  const crores = Number(amountMinor || 0) / 1000000000;
  if (!Number.isFinite(crores) || crores <= 0) {
    return "Price on request";
  }
  const formatted = (crores >= 10 ? crores.toFixed(1) : crores.toFixed(2))
    .replace(/\\.0$/, "")
    .replace(/(\\.\\d*[1-9])0$/, "$1");
  return "₹" + formatted + " Cr";
}
const defaultPropertyImageUrl = "https://ik.imagekit.io/uzhmjh0td/RealEstate/Flat.png?updatedAt=1787290187232";
const nearbyMap = {
  kokapet: ["financial district", "narsingi", "gachibowli"],
  "financial district": ["kokapet", "gachibowli", "narsingi"],
  tellapur: ["kondapur", "gachibowli"],
  narsingi: ["kokapet", "financial district"],
  gachibowli: ["financial district", "kondapur", "tellapur"]
};
const requestedLocation = normalize(vars.preferred_location);
const requestedType = normalize(vars.property_type);
const requestedBhk = normalize(vars.bhk);
const budgetMin = Number(vars.budget_min_minor || 0);
const budgetMax = Number(vars.budget_max_minor || 0);
const requestedPurpose = normalize(vars.purchase_purpose);
const requestedPossession = normalize(vars.possession_preference);
const rows = Array.isArray(vars.property_inventory_result?.data) ? vars.property_inventory_result.data : [];
const exact = [];
const alternative = [];
for (const row of rows) {
  if (String(row.active ?? "true").toLowerCase() === "false") continue;
  const projectLocation = normalize(row.location || row.micro_market);
  const projectType = normalize(row.property_type);
  const bhkOptions = normalize(row.bhk_options);
  const minPrice = Number(row.min_price_minor || 0);
  const maxPrice = Number(row.max_price_minor || row.min_price_minor || 0);
  const possessionLabel = normalize(row.possession_label || row.project_status);
  let score = 0;
  let exactLocation = false;
  let exactBudget = false;
  const reasons = [];
  if (requestedLocation && projectLocation === requestedLocation) {
    score += 35;
    exactLocation = true;
    reasons.push("Exact preferred location");
  } else if (requestedLocation && (nearbyMap[requestedLocation] || []).includes(projectLocation)) {
    score += 20;
    reasons.push("Nearby micro-market");
  }
  if (requestedType && projectType === requestedType) {
    score += 15;
    reasons.push("Requested property type");
  }
  if (requestedBhk && bhkOptions.includes(normalize(vars.bhk).replace(/\\s+/g, "")) || bhkOptions.includes(requestedBhk.replace(/\\s+/g, "")) || bhkOptions.includes(requestedBhk)) {
    score += 15;
    reasons.push("Requested configuration");
  } else if (!requestedBhk && requestedType === "plot") {
    score += 10;
  }
  if (budgetMax > 0 && minPrice > 0) {
    if (minPrice <= budgetMax && (maxPrice === 0 || maxPrice >= budgetMin)) {
      score += 25;
      exactBudget = true;
      reasons.push("Within stated budget");
    } else if (minPrice <= Math.round(budgetMax * 1.15)) {
      score += 12;
      reasons.push("Slight stretch above budget");
    }
  }
  if (requestedPurpose === "investment" && /growth|rental|invest/i.test(String(row.highlights || ""))) {
    score += 5;
    reasons.push("Investment-friendly positioning");
  }
  if (requestedPossession === "ready to move" && /ready/i.test(possessionLabel)) {
    score += 5;
    reasons.push("Ready possession");
  } else if (requestedPossession === "within 1 year" && /(2026|2027|12 month)/i.test(String(row.possession_label || ""))) {
    score += 5;
    reasons.push("Near-term possession");
  } else if (requestedPossession === "under construction is fine" && requestedPossession) {
    score += 2;
  }
  const item = {
    id: String(row.project_id || row.project_code || ""),
    projectId: String(row.project_id || row.project_code || ""),
    projectCode: String(row.project_code || row.project_id || ""),
    title: String(row.project_name || "Project"),
    subtitle: titleCase(row.location || row.micro_market || ""),
    description: String(row.highlights || row.project_status || "Recommended project option."),
    summary: "Why it matches: " + (reasons[0] || "Good fit for the captured requirement."),
    category: String(row.property_type || ""),
    tag: String(score) + "% match",
    price: formatCrorePrice(minPrice),
    imageUrl: defaultPropertyImageUrl,
    brochureUrl: String(row.brochure_url || ""),
    locationUrl: String(row.location_url || ""),
    score,
    location: titleCase(row.location || row.micro_market || ""),
    propertyType: String(row.property_type || ""),
    bhk: String(row.bhk_options || ""),
    possession: String(row.possession_label || row.project_status || ""),
    rera: String(row.rera_number || ""),
    reason: reasons.join(", "),
    salesOwnerName: String(row.sales_owner_name || ""),
    salesOwnerPhone: String(row.sales_owner_phone || ""),
    salesOwnerEmail: String(row.sales_owner_email || "")
  };
  if (exactLocation && exactBudget && score >= 70) {
    exact.push(item);
  } else if (score >= 45) {
    alternative.push(item);
  }
}
const shortlist = (exact.length > 0 ? exact : alternative)
  .sort((a, b) => b.score - a.score)
  .slice(0, 5);
vars.project_carousel_items = shortlist;
vars.matched_projects = shortlist;
vars.selected_project_default_id = shortlist[0]?.projectCode || shortlist[0]?.projectId || "";
vars.project_selection_prompt = shortlist
  .map((item, index) => (index + 1) + ". " + item.projectCode + " - " + item.title + " (" + item.tag + ")")
  .join("\\n");
vars.project_match_status = exact.length > 0 ? "exact" : shortlist.length > 0 ? "alternative" : "none";
return {
  match_status: vars.project_match_status,
  project_count: shortlist.length,
  prompt: vars.project_selection_prompt
};
`;

const selectProjectScript = `
function normalize(value) {
  return String(value || "").trim().toLowerCase();
}
const choice = normalize(vars.selected_project_choice);
const projects = Array.isArray(vars.matched_projects) ? vars.matched_projects : [];
let selected = projects[0] || {};
const numericChoice = Number(choice);
if (Number.isInteger(numericChoice) && numericChoice >= 1 && numericChoice <= projects.length) {
  selected = projects[numericChoice - 1];
} else {
  const exact = projects.find((item) => {
    return normalize(item.projectCode) === choice
      || normalize(item.projectId) === choice
      || normalize(item.title) === choice;
  });
  if (exact) selected = exact;
}
vars.selected_project_id = String(selected.projectId || selected.id || "");
vars.selected_project_code = String(selected.projectCode || selected.projectId || "");
vars.selected_project_name = String(selected.title || "");
vars.selected_project_location = String(selected.location || selected.subtitle || "");
vars.selected_project_match_score = Number(selected.score || 0);
vars.selected_project_reason = String(selected.reason || selected.summary || "");
vars.selected_project_price = String(selected.price || "");
vars.selected_project_property_type = String(selected.propertyType || "");
vars.selected_project_bhk = String(selected.bhk || "");
vars.selected_project_possession = String(selected.possession || "");
vars.selected_project_rera = String(selected.rera || "");
vars.selected_project_brochure_url = String(selected.brochureUrl || "");
vars.selected_project_location_url = String(selected.locationUrl || "");
vars.selected_project_sales_name = String(selected.salesOwnerName || "");
vars.selected_project_sales_phone = String(selected.salesOwnerPhone || vars.sales_alert_phone || "");
vars.selected_project_sales_email = String(selected.salesOwnerEmail || vars.sales_alert_email || "");
vars.interest_id = "INT-" + String(vars.lead_id || "") + "-" + String(vars.selected_project_code || vars.selected_project_id || "");
return {
  selected_project_name: vars.selected_project_name,
  selected_project_code: vars.selected_project_code,
  selected_project_match_score: vars.selected_project_match_score
};
`;

const preVisitScoreScript = `
let score = 0;
if (Number(vars.budget_max_minor || 0) > 0) score += 10;
if (String(vars.preferred_location || "").trim()) score += 5;
if (String(vars.property_type || "").trim()) score += 5;
if (String(vars.bhk || "").trim() || String(vars.property_type || "").trim().toLowerCase() === "plot") score += 5;
const timeline = String(vars.purchase_timeline || "").trim().toLowerCase();
if (timeline === "immediately") score += 30;
else if (timeline === "within 1 month") score += 25;
else if (timeline === "1-3 months") score += 20;
else if (timeline === "3-6 months") score += 10;
if (/pre-approved|self-funded/i.test(String(vars.financing_status || ""))) score += 10;
if (String(vars.brochure_requested || "no") === "yes") score += 10;
if (Number(vars.selected_project_match_score || 0) >= 80) score += 5;
vars.lead_score = score;
vars.lead_temperature = score >= 70 ? "hot" : score >= 40 ? "warm" : "nurture";
vars.lead_stage = String(vars.brochure_requested || "no") === "yes" ? "brochure_shared" : "projects_shared";
return {
  lead_score: vars.lead_score,
  lead_temperature: vars.lead_temperature,
  lead_stage: vars.lead_stage
};
`;

const validateMobileOtpScript = `
const otp = String(vars.mobile_otp_input || "").trim();
vars.mobile_otp_status = /^\\d{6}$/.test(otp) ? "valid" : "invalid";
return {
  mobile_otp_status: vars.mobile_otp_status
};
`;

const buildSiteVisitSlotsScript = `
function pad2(value) {
  return String(value).padStart(2, "0");
}
function formatDateKey(date) {
  return [
    date.getUTCFullYear(),
    pad2(date.getUTCMonth() + 1),
    pad2(date.getUTCDate())
  ].join("-");
}
function addDays(dateKey, offsetDays) {
  const match = String(dateKey || "").match(/^(\\d{4})-(\\d{2})-(\\d{2})$/);
  if (!match) return dateKey;
  const utc = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]) + offsetDays));
  return formatDateKey(utc);
}
function formatTime(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return pad2(hours) + ":" + pad2(minutes);
}
function formatTimeLabel(timeValue) {
  const match = String(timeValue || "").match(/^(\\d{2}):(\\d{2})$/);
  if (!match) return String(timeValue || "");
  const hour24 = Number(match[1]);
  const minutes = match[2];
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  const suffix = hour24 >= 12 ? "PM" : "AM";
  return String(hour12) + ":" + minutes + " " + suffix;
}
function normalizeTime(value) {
  const match = String(value || "").trim().match(/^(\\d{1,2}):(\\d{2})/);
  if (!match) return "";
  return pad2(match[1]) + ":" + match[2];
}
const timezoneOffsetMinutes = 330;
const horizonDays = 14;
const slotStartMinutes = 10 * 60;
const slotEndMinutes = 18 * 60;
const slotDurationMinutes = 30;
const slotIntervalMinutes = 30;
const now = new Date();
const nowLocal = new Date(now.getTime() + timezoneOffsetMinutes * 60 * 1000);
const todayKey = formatDateKey(new Date(Date.UTC(
  nowLocal.getUTCFullYear(),
  nowLocal.getUTCMonth(),
  nowLocal.getUTCDate()
)));
const currentMinutes = (nowLocal.getUTCHours() * 60) + nowLocal.getUTCMinutes();
const existingVisits = Array.isArray(vars.existing_site_visits_result?.data) ? vars.existing_site_visits_result.data : [];
const bookedKeys = new Set(
  existingVisits
    .filter((row) => String(row?.status || "").trim().toLowerCase() === "confirmed")
    .map((row) => String(row?.visit_date || "").slice(0, 10) + "|" + normalizeTime(row?.visit_time || ""))
    .filter((value) => value.indexOf("|") > 0 && !value.endsWith("|"))
);
const projectSlug = String(vars.selected_project_id || "site-visit")
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-+|-+$/g, "") || "site-visit";
const slots = [];
for (let dayOffset = 0; dayOffset < horizonDays; dayOffset += 1) {
  const dateKey = addDays(todayKey, dayOffset);
  for (
    let startMinutes = slotStartMinutes;
    startMinutes + slotDurationMinutes <= slotEndMinutes;
    startMinutes += slotIntervalMinutes
  ) {
    if (dayOffset === 0 && startMinutes <= currentMinutes) continue;
    const start = formatTime(startMinutes);
    const end = formatTime(startMinutes + slotDurationMinutes);
    if (bookedKeys.has(dateKey + "|" + start)) continue;
    slots.push({
      slot_id: "SVS-" + projectSlug + "-" + dateKey.replace(/-/g, "") + "-" + start.replace(":", ""),
      date: dateKey,
      start_time: start,
      end_time: end,
      label: formatTimeLabel(start) + " - " + formatTimeLabel(end)
    });
  }
}
vars.site_visit_future_slots = { data: slots };
vars.site_visit_slot_generation_status = slots.length > 0 ? "available" : "unavailable";
return {
  slot_generation_status: vars.site_visit_slot_generation_status,
  slot_count: slots.length
};
`;

const visitPreparationScript = `
function pad2(value) {
  return String(value).padStart(2, "0");
}
function addMinutes(timeValue, minutesToAdd) {
  const parts = String(timeValue || "").split(":");
  const hours = Number(parts[0] || 0);
  const minutes = Number(parts[1] || 0);
  const totalMinutes = (hours * 60) + minutes + minutesToAdd;
  const wrapped = ((totalMinutes % (24 * 60)) + (24 * 60)) % (24 * 60);
  return pad2(Math.floor(wrapped / 60)) + ":" + pad2(wrapped % 60);
}
function formatTimeLabel(timeValue) {
  const match = String(timeValue || "").match(/^(\\d{2}):(\\d{2})$/);
  if (!match) return String(timeValue || "");
  const hour24 = Number(match[1]);
  const minutes = match[2];
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  const suffix = hour24 >= 12 ? "PM" : "AM";
  return String(hour12) + ":" + minutes + " " + suffix;
}
function formatDisplayDate(dateValue) {
  const match = String(dateValue || "").match(/^(\\d{4})-(\\d{2})-(\\d{2})$/);
  if (!match) return String(dateValue || "");
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  return date.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC"
  });
}
const now = new Date();
const booking = vars.site_visit_booking && typeof vars.site_visit_booking === "object" && !Array.isArray(vars.site_visit_booking)
  ? vars.site_visit_booking
  : {};
const selectedDate = String(booking.date || vars.site_visit_date || "").trim();
const selectedTime = String(booking.startTime || booking.start_time || vars.site_visit_time || "").trim();
if (!selectedDate || !selectedTime) {
  throw new Error("missing site visit appointment selection");
}
const slotId = String(booking.slotId || booking.slot_id || "").trim();
const slotLabel = String(booking.slotLabel || booking.slot_label || "").trim();
vars.site_visit_id = "SV-" + String(vars.lead_id || "").replace(/[^A-Za-z0-9]/g, "").slice(-8).toUpperCase() + "-" + selectedDate.replace(/-/g, "") + "-" + selectedTime.replace(":", "");
vars.site_visit_requested = "yes";
vars.site_visit_date = selectedDate;
vars.site_visit_time = selectedTime;
vars.site_visit_end_time = String(booking.endTime || booking.end_time || "").trim() || addMinutes(vars.site_visit_time, 30);
vars.site_visit_slot_id = slotId || ("SVS-" + String(vars.selected_project_id || vars.lead_id || "site-visit"));
vars.site_visit_label = slotLabel || (vars.site_visit_time + " - " + vars.site_visit_end_time);
vars.site_visit_date_label = formatDisplayDate(vars.site_visit_date);
vars.site_visit_time_label = formatTimeLabel(vars.site_visit_time);
vars.site_visit_end_time_label = formatTimeLabel(vars.site_visit_end_time);
vars.site_visit_time_range_label = vars.site_visit_time_label && vars.site_visit_end_time_label
  ? vars.site_visit_time_label + " - " + vars.site_visit_end_time_label
  : vars.site_visit_label;
vars.site_visit_datetime = vars.site_visit_date && vars.site_visit_time
  ? vars.site_visit_date + "T" + vars.site_visit_time + ":00+05:30"
  : "";
vars.site_visit_booked_at = now.toISOString();
return {
  site_visit_id: vars.site_visit_id,
  site_visit_date: vars.site_visit_date,
  site_visit_time: vars.site_visit_time,
  site_visit_datetime: vars.site_visit_datetime
};
`;

const finalLeadScoreScript = `
const current = Number(vars.lead_score || 0);
const boosted = Math.max(current, 70) + 20;
vars.lead_score = boosted;
vars.lead_temperature = boosted >= 70 ? "hot" : boosted >= 40 ? "warm" : "nurture";
vars.lead_stage = "site_visit_booked";
vars.lead_status = "site_visit_booked";
return {
  lead_score: vars.lead_score,
  lead_temperature: vars.lead_temperature,
  lead_stage: vars.lead_stage
};
`;

node("start_1", "start", 120, 220, { messages: [] });
node(
  "set_template_defaults",
  "setVariable",
  360,
  220,
  setVars({
    service_context: "real_estate_lead_to_site_visit",
    escalation_policy: "human_only_for_true_system_failure_or_explicit_sales_request",
    brochure_requested: "no",
    site_visit_requested: "no",
    mobile_otp_status: ""
  })
);
node(
  "welcome_message",
  "message",
  600,
  220,
  msgData(
    "Hi! 👋 I can help you find the right property based on your budget, preferred location, configuration, and timeline.\n\nI can also help you compare projects, view brochures and floor plans, check pricing, shortlist properties, and schedule a site visit."
  )
);
node(
  "main_menu_input",
  "input",
  840,
  220,
  inputData(
    "What would you like to do?\n\nYou can also type your requirement directly. For example: \"3 BHK in Kokapet around ₹1.2 Cr.\"",
    "main_menu_choice",
    mainMenuButtons(),
    false
  )
);
node(
  "capture_requirement_from_menu",
  "setVariable",
  1080,
  220,
  setVars({ buyer_requirement_text: "{{main_menu_choice}}" })
);
node(
  "requirement_input",
  "input",
  1320,
  220,
  inputData(
    "Great. Tell me what you're looking for.\n\nYou can type something like:\n\"3 BHK apartment in Kokapet around ₹1.2 Cr.\"",
    "buyer_requirement_text",
    [],
    false
  )
);
node(
  "brochure_menu_message",
  "message",
  1320,
  420,
  msgData(
    "I can share brochures and floor plans once I know the project or requirement. Tell me the location, budget, configuration, or project name you want."
  )
);
node(
  "compare_menu_message",
  "message",
  1320,
  620,
  msgData(
    "I can compare shortlisted properties once I know what to evaluate. Tell me the location, budget, configuration, or project names you want compared."
  )
);
node(
  "shortlist_menu_message",
  "message",
  1320,
  820,
  msgData(
    "I can pull your saved shortlist and continue from there. Share your mobile number to load your buyer profile."
  )
);
node(
  "site_visit_menu_message",
  "message",
  1320,
  1020,
  msgData(
    "I can help you book or manage a site visit. Share your mobile number first so I can load your saved lead, shortlist, and visit history."
  )
);
node(
  "pricing_menu_message",
  "message",
  1320,
  1220,
  msgData(
    "I can help with pricing, payment plans, and active offers once I know the project or requirement. Tell me the location, budget, configuration, or project name you want priced."
  )
);
node(
  "sales_request_message",
  "message",
  1320,
  1420,
  msgData(
    "Connecting you to the sales team now. I am forwarding your enquiry for direct follow-up."
  )
);
node(
  "sales_request_handover",
  "handover",
  1560,
  1420,
  {
    channel: "human",
    messages: ["Connecting this enquiry to the sales team."]
  }
);
node(
  "parse_requirement",
  "script",
  1560,
  220,
  scriptData(parseRequirementScript, "parsed_requirement")
);
node(
  "mobile_form",
  "form",
  1800,
  220,
  formData(
    "Please share your mobile number.\n\nWe'll use it to securely save your property preferences, shortlist, brochure requests, and site-visit details.",
    requirementFields,
    "buyer_mobile_form"
  )
);
node(
  "mobile_otp_input",
  "input",
  2040,
  220,
  inputData(
    "We've sent a 6-digit verification code to your mobile number.\n\nPlease enter the OTP to continue.",
    "mobile_otp_input",
    [],
    false
  )
);
node(
  "validate_mobile_otp",
  "script",
  2280,
  220,
  scriptData(validateMobileOtpScript, "mobile_otp_validation_result")
);
node(
  "mobile_otp_status_switch",
  "switch",
  2520,
  220,
  switchData("mobile_otp_status")
);
node(
  "mobile_otp_invalid_message_1",
  "message",
  2760,
  360,
  msgData(
    "That OTP doesn't look valid. Please enter a 6-digit OTP to continue."
  )
);
node(
  "mobile_otp_input_2",
  "input",
  3000,
  360,
  inputData(
    "We've sent a 6-digit verification code to your mobile number.\n\nPlease enter the OTP to continue.",
    "mobile_otp_input",
    [],
    false
  )
);
node(
  "validate_mobile_otp_2",
  "script",
  3240,
  360,
  scriptData(validateMobileOtpScript, "mobile_otp_validation_result")
);
node(
  "mobile_otp_status_switch_2",
  "switch",
  3480,
  360,
  switchData("mobile_otp_status")
);
node(
  "mobile_otp_invalid_message_2",
  "message",
  3720,
  500,
  msgData(
    "That OTP doesn't look valid. Please enter a 6-digit OTP to continue."
  )
);
node(
  "mobile_otp_input_3",
  "input",
  3960,
  500,
  inputData(
    "We've sent a 6-digit verification code to your mobile number.\n\nPlease enter the OTP to continue.",
    "mobile_otp_input",
    [],
    false
  )
);
node(
  "validate_mobile_otp_3",
  "script",
  4200,
  500,
  scriptData(validateMobileOtpScript, "mobile_otp_validation_result")
);
node(
  "mobile_otp_status_switch_3",
  "switch",
  4440,
  500,
  switchData("mobile_otp_status")
);
node(
  "mobile_otp_max_attempts_message",
  "message",
  4680,
  640,
  msgData(
    "You entered an invalid OTP 3 times. The verification flow is now closed."
  )
);
node("mobile_otp_max_attempts_end", "end", 4920, 640, { messages: [] });
node(
  "contact_find",
  "record",
  4680,
  220,
  recordData({
    action: "find",
    collection: "real_estate_contacts",
    where: { phone_e164: "{{buyer_mobile}}" },
    schema: schemas.contacts,
    outputVar: "existing_contact_result",
    piiFields: "phone_e164,email,full_name"
  })
);
node(
  "returning_contact_message",
  "message",
  1800,
  60,
  msgData(
    "Welcome back, {{existing_contact_result.data.full_name}} 👋\n\nYour previous property preference was:\n\n📍 Location: {{existing_contact_result.data.last_preferred_location}}\n🏠 Configuration: {{existing_contact_result.data.last_bhk}}\n🏢 Property Type: {{existing_contact_result.data.last_property_type}}\n📝 Summary: {{existing_contact_result.data.last_requirement_summary}}\n\nWould you like to continue with these preferences?"
  )
);
node(
  "reuse_saved_preferences_input",
  "input",
  2040,
  60,
  inputData(
    "Choose how you'd like to continue.",
    "reuse_saved_preferences",
    [
      { label: "Use Saved Preferences", value: "yes" },
      { label: "Start a New Search", value: "no" }
    ]
  )
);
node(
  "hydrate_saved_preferences",
  "setVariable",
  2280,
  60,
  setVars({
    buyer_name: "{{existing_contact_result.data.full_name}}",
    buyer_email: "{{existing_contact_result.data.email}}",
    preferred_location: "{{existing_contact_result.data.last_preferred_location}}",
    budget_min_minor: "{{existing_contact_result.data.last_budget_min_minor}}",
    budget_max_minor: "{{existing_contact_result.data.last_budget_max_minor}}",
    property_type: "{{existing_contact_result.data.last_property_type}}",
    bhk: "{{existing_contact_result.data.last_bhk}}",
    purchase_timeline: "{{existing_contact_result.data.last_purchase_timeline}}",
    purchase_purpose: "{{existing_contact_result.data.last_purchase_purpose}}",
    financing_status: "{{existing_contact_result.data.last_financing_status}}",
    lead_id: "{{existing_contact_result.data.last_active_lead_id}}"
  })
);
node(
  "new_contact_form",
  "form",
  1800,
  340,
  formData(
    "I couldn't find a saved buyer profile for this number. Please share your name and email so I can send brochures, pricing updates, and visit confirmations.",
    newContactFields,
    "new_contact_form_result"
  )
);
node(
  "refresh_requirement_flags",
  "script",
  2520,
  220,
  scriptData(refreshRequirementFlagsScript, "requirement_flags")
);
node("location_switch", "switch", 2760, 220, switchData("has_preferred_location"));
node(
  "location_input",
  "input",
  3000,
  340,
  inputData(
    "Which location or micro-market are you considering?",
    "preferred_location",
    [],
    false
  )
);
node("property_type_switch", "switch", 3240, 220, switchData("has_property_type"));
node(
  "property_type_input",
  "input",
  3480,
  340,
  inputData("What type of property are you looking for?", "property_type", [
    { label: "Apartment", value: "Apartment" },
    { label: "Villa", value: "Villa" },
    { label: "Independent House", value: "Independent House" },
    { label: "Plot", value: "Plot" }
  ])
);
node(
  "refresh_after_property_type",
  "script",
  3720,
  340,
  scriptData(refreshRequirementFlagsScript, "requirement_flags_after_property")
);
node("bhk_switch", "switch", 3960, 220, switchData("has_bhk_or_na"));
node(
  "bhk_input",
  "input",
  4200,
  340,
  inputData("What configuration would you prefer?", "bhk", [
    { label: "2 BHK", value: "2 BHK" },
    { label: "3 BHK", value: "3 BHK" },
    { label: "4 BHK", value: "4 BHK" },
    { label: "4+ BHK", value: "4+ BHK" }
  ])
);
node("budget_switch", "switch", 4440, 220, switchData("has_budget_range"));
node(
  "budget_input",
  "input",
  4680,
  340,
  inputData("What budget range should I stay within?", "budget_range_choice", [
    { label: "Under ₹75L", value: "under_75_lakh" },
    { label: "₹75L to ₹1 Cr", value: "75_lakh_to_1_cr" },
    { label: "₹1 Cr to ₹1.5 Cr", value: "1_cr_to_1_5_cr" },
    { label: "₹1.5 Cr to ₹2 Cr", value: "1_5_cr_to_2_cr" },
    { label: "₹2 Cr+", value: "2_cr_plus" }
  ])
);
node(
  "normalize_budget",
  "script",
  4920,
  340,
  scriptData(budgetNormalizationScript, "budget_normalized")
);
node("purpose_switch", "switch", 5160, 220, switchData("has_purchase_purpose"));
node(
  "purpose_input",
  "input",
  5400,
  340,
  inputData(
    "Is this property mainly for your own use or investment?",
    "purchase_purpose",
    [
      { label: "Self Use", value: "Self Use" },
      { label: "Investment", value: "Investment" }
    ]
  )
);
node("timeline_switch", "switch", 5640, 220, switchData("has_purchase_timeline"));
node(
  "timeline_input",
  "input",
  5880,
  340,
  inputData("When are you planning to make a purchase?", "purchase_timeline", [
    { label: "Immediately", value: "Immediately" },
    { label: "Within 1 Month", value: "Within 1 Month" },
    { label: "1-3 Months", value: "1-3 Months" },
    { label: "3-6 Months", value: "3-6 Months" },
    { label: "Just Exploring", value: "Just Exploring" }
  ])
);
node(
  "possession_switch",
  "switch",
  6120,
  220,
  switchData("has_possession_preference")
);
node(
  "possession_input",
  "input",
  6360,
  340,
  inputData("When would you ideally like the property to be ready?", "possession_preference", [
    { label: "Ready to Move", value: "Ready to Move" },
    { label: "Within 1 Year", value: "Within 1 Year" },
    { label: "1-2 Years", value: "1-2 Years" },
    { label: "Under Construction is Fine", value: "Under Construction is Fine" },
    { label: "No Preference", value: "No Preference" }
  ])
);
node("financing_switch", "switch", 6600, 220, switchData("has_financing_status"));
node(
  "financing_input",
  "input",
  6840,
  340,
  inputData("How are you planning the purchase?", "financing_status", [
    { label: "Self-Funded", value: "Self-Funded" },
    { label: "Home Loan", value: "Home Loan" },
    { label: "Loan Pre-Approved", value: "Loan Pre-Approved" },
    { label: "Need Loan Assistance", value: "Need Loan Assistance" },
    { label: "Not Decided", value: "Not Decided" }
  ])
);
node(
  "prepare_identity",
  "script",
  7080,
  220,
  scriptData(identityPreparationScript, "identity_result")
);
node(
  "contact_upsert",
  "record",
  7320,
  220,
  recordData({
    action: "upsert",
    collection: "real_estate_contacts",
    where: { phone_e164: "{{buyer_mobile}}" },
    data: {
      contact_id: "{{contact_id}}",
      full_name: "{{buyer_name}}",
      phone_e164: "{{buyer_mobile}}",
      email: "{{buyer_email}}",
      first_source: "{{system.channel}}",
      last_source: "{{system.channel}}",
      first_seen_at: "{{contact_first_seen_at}}",
      last_seen_at: "{{interaction_time_iso}}",
      last_requirement_summary: "{{requirement_summary}}",
      last_preferred_location: "{{preferred_location}}",
      last_budget_min_minor: "{{budget_min_minor}}",
      last_budget_max_minor: "{{budget_max_minor}}",
      last_property_type: "{{property_type}}",
      last_bhk: "{{bhk}}",
      last_purchase_timeline: "{{purchase_timeline}}",
      last_purchase_purpose: "{{purchase_purpose}}",
      last_financing_status: "{{financing_status}}",
      last_active_lead_id: "{{lead_id}}"
    },
    schema: schemas.contacts,
    uniqueKey: "phone_e164",
    idempotencyKey: "{{contact_id}}",
    outputVar: "contact_upsert_result",
    piiFields: "phone_e164,email,full_name"
  })
);
node(
  "lead_upsert_initial",
  "record",
  7560,
  220,
  recordData({
    action: "upsert",
    collection: "real_estate_leads",
    where: { lead_id: "{{lead_id}}" },
    data: {
      lead_id: "{{lead_id}}",
      contact_id: "{{contact_id}}",
      buyer_mobile: "{{buyer_mobile}}",
      buyer_name: "{{buyer_name}}",
      buyer_email: "{{buyer_email}}",
      source_channel: "{{system.channel}}",
      status: "open",
      stage: "requirements_captured",
      preferred_location: "{{preferred_location}}",
      budget_min_minor: "{{budget_min_minor}}",
      budget_max_minor: "{{budget_max_minor}}",
      budget_range_label: "{{budget_range_label}}",
      property_type: "{{property_type}}",
      bhk: "{{bhk}}",
      purchase_purpose: "{{purchase_purpose}}",
      purchase_timeline: "{{purchase_timeline}}",
      possession_preference: "{{possession_preference}}",
      financing_status: "{{financing_status}}",
      requirement_summary: "{{requirement_summary}}",
      lead_score: 0,
      lead_temperature: "nurture",
      last_activity_at: "{{interaction_time_iso}}"
    },
    schema: schemas.leads,
    uniqueKey: "lead_id",
    idempotencyKey: "{{lead_id}}:initial",
    outputVar: "lead_upsert_initial_result",
    piiFields: "buyer_mobile,buyer_email,buyer_name"
  })
);
node(
  "lead_activity_requirements",
  "record",
  7800,
  220,
  recordData({
    action: "upsert",
    collection: "real_estate_lead_activities",
    where: { activity_id: "{{lead_id}}-requirements" },
    data: {
      activity_id: "{{lead_id}}-requirements",
      lead_id: "{{lead_id}}",
      contact_id: "{{contact_id}}",
      activity_type: "requirements_captured",
      channel: "{{system.channel}}",
      summary: "{{requirement_summary}}",
      occurred_at: "{{interaction_time_iso}}"
    },
    schema: schemas.leadActivities,
    uniqueKey: "activity_id",
    idempotencyKey: "{{lead_id}}:requirements",
    outputVar: "lead_activity_requirements_result",
    piiFields: ""
  })
);
node(
  "inventory_list",
  "record",
  8040,
  220,
  recordData({
    action: "list",
    collection: "property_inventory",
    where: { active: true },
    schema: schemas.inventory,
    outputVar: "property_inventory_result",
    limit: 100,
    sortBy: "project_name",
    sortOrder: "asc"
  })
);
node(
  "match_projects",
  "script",
  8280,
  220,
  scriptData(matchProjectsScript, "project_match_result", 160)
);
node("match_status_switch", "switch", 8520, 220, switchData("project_match_status"));
node(
  "close_match_message",
  "message",
  8760,
  120,
  msgData(
    "I found close alternatives because there was no exact inventory match for every requirement. These are the best nearby or budget-adjacent projects to keep your search moving forward."
  )
);
node(
  "no_inventory_followup_record",
  "record",
  8760,
  420,
  recordData({
    action: "upsert",
    collection: "real_estate_followup_jobs",
    where: { followup_id: "{{lead_id}}-inventory-refresh" },
    data: {
      followup_id: "{{lead_id}}-inventory-refresh",
      lead_id: "{{lead_id}}",
      followup_type: "inventory_refresh",
      scheduled_for: "{{interaction_time_iso}}",
      channel: "{{system.channel}}",
      status: "scheduled",
      notes: "No exact project match. Refresh alternatives or widen search."
    },
    schema: schemas.followupJobs,
    uniqueKey: "followup_id",
    idempotencyKey: "{{lead_id}}:inventory-refresh",
    outputVar: "no_inventory_followup_result"
  })
);
node(
  "no_inventory_message",
  "message",
  9000,
  420,
  msgData(
    "I could not find a live project match for that combination right now. I have saved your requirement and queued an automated follow-up so newer inventory or nearby options can be shared without restarting the conversation."
  )
);
node("no_inventory_end", "end", 9240, 420, { messages: [] });
node(
  "project_carousel",
  "carousel",
  9000,
  220,
  dynamicCarouselData(
    "I found these projects based on your requirement.",
    "project_carousel_items",
    {
      id: "{{item.projectCode}}",
      type: "card",
      eyebrow: "{{item.tag}}",
      heading: "{{item.title}}",
      title: "{{item.subtitle}}",
      description: "{{item.description}}",
      paragraphs: ["{{item.summary}}"],
      badges: ["{{item.category}}", "{{item.propertyType}}"],
      imageUrl: "{{item.imageUrl}}",
      fields: {
        Price: "{{item.price}}",
        BHK: "{{item.bhk}}",
        Possession: "{{item.possession}}"
      },
      actions: [
        { label: "{{item.title}}", value: "{{item.projectCode}}" }
      ]
    }
  )
);
node(
  "project_select_input",
  "input",
  9240,
  220,
  inputData(
    "Reply with the project name, project code, or the list number you want to explore next.\n{{project_selection_prompt}}",
    "selected_project_choice",
    [],
    false
  )
);
node(
  "select_project",
  "script",
  9480,
  220,
  scriptData(selectProjectScript, "selected_project_result")
);
node(
  "project_details_message",
  "message",
  9720,
  220,
  msgData(
    "{{selected_project_name}}\n\n📍 Location: {{selected_project_location}}\n🏢 Property Type: {{selected_project_property_type}}\n🏠 Configurations: {{selected_project_bhk}}\n💰 Starting Price: {{selected_project_price}}\n📅 Possession: {{selected_project_possession}}\n📋 RERA: {{selected_project_rera}}\n\nWhy this project matches your requirement\n✓ {{selected_project_reason}}"
  )
);
node(
  "brochure_input",
  "input",
  9960,
  220,
  inputData(
    "Would you like to view the brochure for {{selected_project_name}}?",
    "brochure_interest",
    yesNoButtons()
  )
);
node(
  "set_brochure_yes",
  "setVariable",
  10200,
  120,
  setVars({ brochure_requested: "yes" })
);
node(
  "project_brochure_media",
  "media",
  10440,
  120,
  mediaData(
    "pdf",
    "{{selected_project_brochure_url}}",
    "Here's the brochure for {{selected_project_name}}. 📄\n\nYou can review the project details, amenities, configurations, and specifications.",
    "{{selected_project_code}}-brochure.pdf"
  )
);
node(
  "set_brochure_no",
  "setVariable",
  10200,
  320,
  setVars({ brochure_requested: "no" })
);
node(
  "score_lead_previsit",
  "script",
  10920,
  220,
  scriptData(preVisitScoreScript, "previsit_score_result")
);
node(
  "lead_upsert_previsit",
  "record",
  11160,
  220,
  recordData({
    action: "upsert",
    collection: "real_estate_leads",
    where: { lead_id: "{{lead_id}}" },
    data: {
      lead_id: "{{lead_id}}",
      contact_id: "{{contact_id}}",
      buyer_mobile: "{{buyer_mobile}}",
      buyer_name: "{{buyer_name}}",
      buyer_email: "{{buyer_email}}",
      source_channel: "{{system.channel}}",
      status: "open",
      stage: "{{lead_stage}}",
      preferred_location: "{{preferred_location}}",
      budget_min_minor: "{{budget_min_minor}}",
      budget_max_minor: "{{budget_max_minor}}",
      budget_range_label: "{{budget_range_label}}",
      property_type: "{{property_type}}",
      bhk: "{{bhk}}",
      purchase_purpose: "{{purchase_purpose}}",
      purchase_timeline: "{{purchase_timeline}}",
      possession_preference: "{{possession_preference}}",
      financing_status: "{{financing_status}}",
      requirement_summary: "{{requirement_summary}}",
      lead_score: "{{lead_score}}",
      lead_temperature: "{{lead_temperature}}",
      selected_project_id: "{{selected_project_id}}",
      selected_project_name: "{{selected_project_name}}",
      last_activity_at: "{{interaction_time_iso}}"
    },
    schema: schemas.leads,
    uniqueKey: "lead_id",
    idempotencyKey: "{{lead_id}}:previsit",
    outputVar: "lead_upsert_previsit_result",
    piiFields: "buyer_mobile,buyer_email,buyer_name"
  })
);
node(
  "site_visit_input",
  "input",
  11400,
  220,
  inputData(
    "Would you like to schedule a site visit for {{selected_project_name}} now?",
    "site_visit_interest",
    yesNoButtons()
  )
);
node(
  "previsit_hot_switch",
  "switch",
  11640,
  420,
  switchData("lead_temperature")
);
node(
  "nurture_followup_record",
  "record",
  11880,
  420,
  recordData({
    action: "upsert",
    collection: "real_estate_followup_jobs",
    where: { followup_id: "{{lead_id}}-nurture" },
    data: {
      followup_id: "{{lead_id}}-nurture",
      lead_id: "{{lead_id}}",
      project_id: "{{selected_project_id}}",
      followup_type: "nurture_sequence",
      scheduled_for: "{{interaction_time_iso}}",
      channel: "{{system.channel}}",
      status: "scheduled",
      notes: "Send project comparison and weekend visit nudges."
    },
    schema: schemas.followupJobs,
    uniqueKey: "followup_id",
    idempotencyKey: "{{lead_id}}:nurture",
    outputVar: "nurture_followup_result"
  })
);
node(
  "salesperson_alert_previsit",
  "notification",
  11880,
  540,
  notificationData({
    recipients: [
      {
        type: "sales_owner",
        phone: "{{selected_project_sales_phone}}",
        email: "{{selected_project_sales_email}}"
      }
    ],
    channels: [
      {
        type: "sms",
        enabled: true,
        message:
          "Hot property lead: {{buyer_name}} wants {{bhk}} {{property_type}} in {{preferred_location}}, budget {{budget_range_label}}, project {{selected_project_name}}, score {{lead_score}}."
      },
      {
        type: "email",
        enabled: true,
        subject: "Hot property lead requires follow-up",
        body:
          "Buyer: {{buyer_name}}\\nPhone: {{buyer_mobile}}\\nLocation: {{preferred_location}}\\nBudget: {{budget_range_label}}\\nProject: {{selected_project_name}}\\nTimeline: {{purchase_timeline}}\\nLead score: {{lead_score}}"
      }
    ],
    outputVar: "sales_alert_previsit_result",
    dedupeKey: "{{lead_id}}:hot-previsit"
  })
);
node(
  "nurture_end_message",
  "message",
  12120,
  420,
  msgData(
    "Your requirement and shortlisted project are saved. I will keep the conversation warm with follow-up nudges, updated options, and a faster site-visit path when you are ready."
  )
);
node("nurture_end", "end", 12360, 420, { messages: [] });
node(
  "site_visit_existing_visits_list",
  "record",
  11640,
  120,
  recordData({
    action: "list",
    collection: "real_estate_site_visits",
    where: {
      project_id: "{{selected_project_id}}",
      status: "confirmed"
    },
    schema: schemas.siteVisits,
    outputVar: "existing_site_visits_result",
    limit: 500,
    sortBy: "visit_datetime",
    sortOrder: "asc"
  })
);
node(
  "build_site_visit_slots",
  "script",
  11880,
  120,
  scriptData(buildSiteVisitSlotsScript, "site_visit_slot_inventory")
);
node(
  "site_visit_scheduler",
  "appointment",
  12120,
  120,
  appointmentData(
    "Let's schedule your visit to {{selected_project_name}}.\n\nWhich date works best for you?",
    "site_visit_future_slots",
    "site_visit_booking",
    {
      dateVar: "site_visit_date",
      horizonDays: 14,
      maxSlotsPerDay: 16,
      slotDurationMins: 30,
      slotIntervalMins: 30,
      availableWeekdays: "0,1,2,3,4,5,6",
      workingHoursStart: "10:00",
      workingHoursEnd: "18:00",
      disableGeneratedFallback: true
    }
  )
);
node(
  "prepare_site_visit_ids",
  "script",
  12360,
  120,
  scriptData(visitPreparationScript, "site_visit_preparation")
);
node(
  "confirm_site_visit_input",
  "input",
  12600,
  120,
  inputData(
    "Confirm Your Site Visit\n\nPlease review the details before confirming:\n\n🏢 Project: {{selected_project_name}}\n📍 Location: {{selected_project_location}}\n📅 Date: {{site_visit_date_label}}\n🕑 Time: {{site_visit_time_range_label}}",
    "confirm_site_visit",
    yesNoButtons()
  )
);
node(
  "cancelled_visit_message",
  "message",
  12840,
  220,
  msgData(
    "No problem. Your lead is still active, and you can choose another date or time whenever you're ready."
  )
);
node("cancelled_visit_end", "end", 13080, 220, { messages: [] });
node(
  "site_visit_record_create",
  "record",
  12840,
  120,
  recordData({
    action: "upsert",
    collection: "real_estate_site_visits",
    where: { site_visit_id: "{{site_visit_id}}" },
    data: {
      site_visit_id: "{{site_visit_id}}",
      lead_id: "{{lead_id}}",
      contact_id: "{{contact_id}}",
      project_id: "{{selected_project_id}}",
      project_name: "{{selected_project_name}}",
      slot_id: "{{site_visit_slot_id}}",
      visit_date: "{{site_visit_date}}",
      visit_time: "{{site_visit_time}}",
      visit_datetime: "{{site_visit_datetime}}",
      source_channel: "{{system.channel}}",
      status: "confirmed",
      assigned_salesperson_name: "{{selected_project_sales_name}}",
      assigned_salesperson_phone: "{{selected_project_sales_phone}}"
    },
    schema: schemas.siteVisits,
    uniqueKey: "site_visit_id",
    idempotencyKey: "{{site_visit_id}}",
    outputVar: "site_visit_record_result"
  })
);
node(
  "final_score_script",
  "script",
  12360,
  120,
  scriptData(finalLeadScoreScript, "final_score_result")
);
node(
  "lead_upsert_final",
  "record",
  15000,
  120,
  recordData({
    action: "upsert",
    collection: "real_estate_leads",
    where: { lead_id: "{{lead_id}}" },
    data: {
      lead_id: "{{lead_id}}",
      contact_id: "{{contact_id}}",
      buyer_mobile: "{{buyer_mobile}}",
      buyer_name: "{{buyer_name}}",
      buyer_email: "{{buyer_email}}",
      source_channel: "{{system.channel}}",
      status: "{{lead_status}}",
      stage: "{{lead_stage}}",
      preferred_location: "{{preferred_location}}",
      budget_min_minor: "{{budget_min_minor}}",
      budget_max_minor: "{{budget_max_minor}}",
      budget_range_label: "{{budget_range_label}}",
      property_type: "{{property_type}}",
      bhk: "{{bhk}}",
      purchase_purpose: "{{purchase_purpose}}",
      purchase_timeline: "{{purchase_timeline}}",
      possession_preference: "{{possession_preference}}",
      financing_status: "{{financing_status}}",
      requirement_summary: "{{requirement_summary}}",
      lead_score: "{{lead_score}}",
      lead_temperature: "{{lead_temperature}}",
      selected_project_id: "{{selected_project_id}}",
      selected_project_name: "{{selected_project_name}}",
      site_visit_id: "{{site_visit_id}}",
      site_visit_status: "confirmed",
      last_activity_at: "{{site_visit_booked_at}}"
    },
    schema: schemas.leads,
    uniqueKey: "lead_id",
    idempotencyKey: "{{lead_id}}:final",
    outputVar: "lead_upsert_final_result",
    piiFields: "buyer_mobile,buyer_email,buyer_name"
  })
);
node(
  "lead_activity_visit_confirmed",
  "record",
  15480,
  120,
  recordData({
    action: "upsert",
    collection: "real_estate_lead_activities",
    where: { activity_id: "{{lead_id}}-visit-confirmed" },
    data: {
      activity_id: "{{lead_id}}-visit-confirmed",
      lead_id: "{{lead_id}}",
      contact_id: "{{contact_id}}",
      project_id: "{{selected_project_id}}",
      activity_type: "site_visit_confirmed",
      channel: "{{system.channel}}",
      summary: "{{selected_project_name}} on {{site_visit_date}} at {{site_visit_time}}",
      occurred_at: "{{site_visit_booked_at}}"
    },
    schema: schemas.leadActivities,
    uniqueKey: "activity_id",
    idempotencyKey: "{{lead_id}}:visit-confirmed",
    outputVar: "lead_activity_visit_result"
  })
);
node(
  "crm_sync_job_record",
  "record",
  15720,
  120,
  recordData({
    action: "upsert",
    collection: "real_estate_crm_sync_jobs",
    where: { sync_job_id: "{{lead_id}}-crm" },
    data: {
      sync_job_id: "{{lead_id}}-crm",
      lead_id: "{{lead_id}}",
      entity_type: "lead",
      operation: "upsert",
      crm_provider: "{{crm_provider}}",
      status: "pending",
      payload_summary:
        "Lead " +
        "{{lead_id}}" +
        " | Buyer " +
        "{{buyer_name}}" +
        " | Project " +
        "{{selected_project_name}}" +
        " | Visit " +
        "{{site_visit_date}}" +
        " " +
        "{{site_visit_time}}" +
        " | Score " +
        "{{lead_score}}",
      created_at: "{{site_visit_booked_at}}"
    },
    schema: schemas.crmSyncJobs,
    uniqueKey: "sync_job_id",
    idempotencyKey: "{{lead_id}}:crm-sync",
    outputVar: "crm_sync_job_result"
  })
);
node(
  "buyer_confirmation_notification",
  "notification",
  15960,
  120,
  notificationData({
    recipients: [
      {
        type: "customer",
        phone: "{{buyer_mobile}}",
        email: "{{buyer_email}}"
      }
    ],
    channels: [
      {
        type: "whatsapp",
        enabled: true,
        templateId: "site_visit_confirmed"
      },
      {
        type: "sms",
        enabled: true,
        message:
          "Site visit confirmed: {{selected_project_name}} on {{site_visit_date_label}} at {{site_visit_time_range_label}}. Reference {{site_visit_id}}."
      },
      {
        type: "email",
        enabled: true,
        subject: "Your site visit is confirmed",
        body:
          "Your site visit has been scheduled successfully.\\n\\nProject: {{selected_project_name}}\\nLocation: {{selected_project_location}}\\nDate: {{site_visit_date_label}}\\nTime: {{site_visit_time_range_label}}\\nReference: {{site_visit_id}}\\nMap: {{selected_project_location_url}}"
      }
    ],
    outputVar: "buyer_confirmation_result",
    dedupeKey: "{{site_visit_id}}:buyer-confirmation"
  })
);
node(
  "reminder_scheduler_24h",
  "scheduler",
  16200,
  120,
  schedulerData({
    runAt: "{{site_visit_datetime}}",
    offsetValue: 24,
    offsetUnit: "hours",
    offsetDirection: "before",
    payload: {
      type: "site_visit_reminder_24h",
      site_visit_id: "{{site_visit_id}}",
      lead_id: "{{lead_id}}"
    },
    outputVar: "reminder_24h_result",
    dedupeKey: "{{site_visit_id}}:reminder-24h"
  })
);
node(
  "reminder_scheduler_2h",
  "scheduler",
  16440,
  120,
  schedulerData({
    runAt: "{{site_visit_datetime}}",
    offsetValue: 2,
    offsetUnit: "hours",
    offsetDirection: "before",
    payload: {
      type: "site_visit_reminder_2h",
      site_visit_id: "{{site_visit_id}}",
      lead_id: "{{lead_id}}"
    },
    outputVar: "reminder_2h_result",
    dedupeKey: "{{site_visit_id}}:reminder-2h"
  })
);
node("final_hot_switch", "switch", 16680, 120, switchData("lead_temperature"));
node(
  "salesperson_alert_final",
  "notification",
  16920,
  120,
  notificationData({
    recipients: [
      {
        type: "sales_owner",
        phone: "{{selected_project_sales_phone}}",
        email: "{{selected_project_sales_email}}"
      }
    ],
    channels: [
      {
        type: "sms",
        enabled: true,
        message:
          "HOT PROPERTY LEAD: {{buyer_name}}, {{buyer_mobile}}, {{bhk}} {{property_type}}, {{preferred_location}}, budget {{budget_range_label}}, project {{selected_project_name}}, visit {{site_visit_date}} {{site_visit_time}}, score {{lead_score}}."
      },
      {
        type: "email",
        enabled: true,
        subject: "Hot property lead with confirmed site visit",
        body:
          "Buyer: {{buyer_name}}\\nMobile: {{buyer_mobile}}\\nBudget: {{budget_range_label}}\\nRequirement: {{bhk}} {{property_type}} in {{preferred_location}}\\nTimeline: {{purchase_timeline}}\\nProject: {{selected_project_name}}\\nSite visit: {{site_visit_date}} {{site_visit_time}}\\nLead score: {{lead_score}}\\nRecommended action: call before the visit."
      }
    ],
    outputVar: "sales_alert_final_result",
    dedupeKey: "{{site_visit_id}}:sales-alert"
  })
);
node(
  "site_visit_confirmed_message",
  "message",
  17160,
  120,
  msgData(
    "✅ Your Site Visit Is Confirmed\n\nYour visit to {{selected_project_name}} has been scheduled successfully.\n\n🏢 Project: {{selected_project_name}}\n📍 Location: {{selected_project_location}}\n📅 Date: {{site_visit_date_label}}\n🕑 Time: {{site_visit_time_range_label}}\n🔖 Reference: {{site_visit_id}}\n\nWe'll send you a reminder before your visit, and the sales team will have your property requirements ready so you won't need to explain everything again."
  )
);
node("site_visit_end", "end", 17400, 120, { messages: [] });
node(
  "system_failure_message",
  "message",
  8760,
  640,
  msgData(
    "I could not complete that step because the operational data or persistence layer did not respond cleanly. I am forwarding the context to the sales operations team so your enquiry does not stall."
  )
);
node(
  "system_failure_handover",
  "handover",
  9000,
  640,
  {
    channel: "human",
    messages: ["Connecting this enquiry to the sales operations team."]
  }
);

edge("start_1", "set_template_defaults", { label: "next" });
edge("set_template_defaults", "welcome_message", { label: "next" });
edge("welcome_message", "main_menu_input", { label: "next" });
edgeValue("main_menu_input", "find_property", "requirement_input", "find_property");
edgeValue("main_menu_input", "explore_projects", "requirement_input", "explore_projects");
edgeValue("main_menu_input", "get_brochure", "brochure_menu_message", "get_brochure");
edgeValue("main_menu_input", "compare_properties", "compare_menu_message", "compare_properties");
edgeValue("main_menu_input", "my_shortlist", "shortlist_menu_message", "my_shortlist");
edgeValue("main_menu_input", "book_site_visit", "site_visit_menu_message", "book_site_visit");
edgeValue("main_menu_input", "pricing_offers", "pricing_menu_message", "pricing_offers");
edgeValue("main_menu_input", "talk_to_sales", "sales_request_message", "talk_to_sales");
edge("main_menu_input", "capture_requirement_from_menu", { isDefault: true, label: "free_text/default" });
edge("capture_requirement_from_menu", "parse_requirement", { label: "next" });
edge("brochure_menu_message", "requirement_input", { label: "next" });
edge("compare_menu_message", "requirement_input", { label: "next" });
edge("shortlist_menu_message", "mobile_form", { label: "next" });
edge("site_visit_menu_message", "mobile_form", { label: "next" });
edge("pricing_menu_message", "requirement_input", { label: "next" });
edge("sales_request_message", "sales_request_handover", { label: "next" });
edge("requirement_input", "parse_requirement", { label: "next" });
scriptRoutes("parse_requirement", "mobile_form", "system_failure_message");
edge("mobile_form", "mobile_otp_input", { label: "next" });
edge("mobile_otp_input", "validate_mobile_otp", { label: "next" });
scriptRoutes("validate_mobile_otp", "mobile_otp_status_switch", "system_failure_message");
edgeValue("mobile_otp_status_switch", "valid", "contact_find", "valid");
edgeValue("mobile_otp_status_switch", "invalid", "mobile_otp_invalid_message_1", "invalid");
edge("mobile_otp_status_switch", "mobile_otp_invalid_message_1", { isDefault: true, label: "invalid/default" });
edge("mobile_otp_invalid_message_1", "mobile_otp_input_2", { label: "retry" });
edge("mobile_otp_input_2", "validate_mobile_otp_2", { label: "next" });
scriptRoutes("validate_mobile_otp_2", "mobile_otp_status_switch_2", "system_failure_message");
edgeValue("mobile_otp_status_switch_2", "valid", "contact_find", "valid");
edgeValue("mobile_otp_status_switch_2", "invalid", "mobile_otp_invalid_message_2", "invalid");
edge("mobile_otp_status_switch_2", "mobile_otp_invalid_message_2", { isDefault: true, label: "invalid/default" });
edge("mobile_otp_invalid_message_2", "mobile_otp_input_3", { label: "retry" });
edge("mobile_otp_input_3", "validate_mobile_otp_3", { label: "next" });
scriptRoutes("validate_mobile_otp_3", "mobile_otp_status_switch_3", "system_failure_message");
edgeValue("mobile_otp_status_switch_3", "valid", "contact_find", "valid");
edge("mobile_otp_status_switch_3", "mobile_otp_max_attempts_message", { isDefault: true, label: "invalid/default" });
edge("mobile_otp_max_attempts_message", "mobile_otp_max_attempts_end", { label: "next" });
edgeValue("contact_find", "success", "returning_contact_message", "success");
edgeValue("contact_find", "duplicate", "returning_contact_message", "duplicate");
edgeValue("contact_find", "not_found", "new_contact_form", "not_found");
edge("contact_find", "system_failure_message", { isDefault: true, label: "validation_failed/failed/default" });
edge("returning_contact_message", "reuse_saved_preferences_input", { label: "next" });
edgeValue("reuse_saved_preferences_input", "yes", "hydrate_saved_preferences", "yes");
edge("reuse_saved_preferences_input", "refresh_requirement_flags", { isDefault: true, label: "no/default" });
edge("hydrate_saved_preferences", "refresh_requirement_flags", { label: "next" });
edge("new_contact_form", "refresh_requirement_flags", { label: "next" });
scriptRoutes("refresh_requirement_flags", "location_switch", "system_failure_message");
edgeValue("location_switch", "yes", "property_type_switch", "yes");
edge("location_switch", "location_input", { isDefault: true, label: "no/default" });
edge("location_input", "property_type_switch", { label: "next" });
edgeValue("property_type_switch", "yes", "bhk_switch", "yes");
edge("property_type_switch", "property_type_input", { isDefault: true, label: "no/default" });
edge("property_type_input", "refresh_after_property_type", { label: "next" });
scriptRoutes("refresh_after_property_type", "bhk_switch", "system_failure_message");
edgeValue("bhk_switch", "yes", "budget_switch", "yes");
edge("bhk_switch", "bhk_input", { isDefault: true, label: "no/default" });
edge("bhk_input", "budget_switch", { label: "next" });
edgeValue("budget_switch", "yes", "purpose_switch", "yes");
edge("budget_switch", "budget_input", { isDefault: true, label: "no/default" });
edge("budget_input", "normalize_budget", { label: "next" });
scriptRoutes("normalize_budget", "purpose_switch", "system_failure_message");
edgeValue("purpose_switch", "yes", "timeline_switch", "yes");
edge("purpose_switch", "purpose_input", { isDefault: true, label: "no/default" });
edge("purpose_input", "timeline_switch", { label: "next" });
edgeValue("timeline_switch", "yes", "possession_switch", "yes");
edge("timeline_switch", "timeline_input", { isDefault: true, label: "no/default" });
edge("timeline_input", "possession_switch", { label: "next" });
edgeValue("possession_switch", "yes", "financing_switch", "yes");
edge("possession_switch", "possession_input", { isDefault: true, label: "no/default" });
edge("possession_input", "financing_switch", { label: "next" });
edgeValue("financing_switch", "yes", "prepare_identity", "yes");
edge("financing_switch", "financing_input", { isDefault: true, label: "no/default" });
edge("financing_input", "prepare_identity", { label: "next" });
scriptRoutes("prepare_identity", "contact_upsert", "system_failure_message");
recordRoutes("contact_upsert", "lead_upsert_initial", "system_failure_message");
recordRoutes("lead_upsert_initial", "lead_activity_requirements", "system_failure_message");
recordRoutes("lead_activity_requirements", "inventory_list", "system_failure_message");
recordRoutes("inventory_list", "match_projects", "system_failure_message");
scriptRoutes("match_projects", "match_status_switch", "system_failure_message");
edgeValue("match_status_switch", "exact", "project_carousel", "exact");
edgeValue("match_status_switch", "alternative", "close_match_message", "alternative");
edge("match_status_switch", "no_inventory_followup_record", { isDefault: true, label: "none/default" });
edge("close_match_message", "project_carousel", { label: "next" });
recordRoutes("no_inventory_followup_record", "no_inventory_message", "system_failure_message");
edge("no_inventory_message", "no_inventory_end", { label: "next" });
edge("project_carousel", "project_select_input", { label: "next" });
edge("project_select_input", "select_project", { label: "next" });
scriptRoutes("select_project", "project_details_message", "system_failure_message");
edge("project_details_message", "brochure_input", { label: "next" });
edgeValue("brochure_input", "yes", "set_brochure_yes", "yes");
edge("brochure_input", "set_brochure_no", { isDefault: true, label: "no/default" });
edge("set_brochure_yes", "project_brochure_media", { label: "next" });
// Demo-safe brochure path: continue into qualification even if optional
// project-interest persistence is unavailable.
edge("project_brochure_media", "score_lead_previsit", { label: "next" });
edge("set_brochure_no", "score_lead_previsit", { label: "next" });
scriptRoutes("score_lead_previsit", "lead_upsert_previsit", "system_failure_message");
recordRoutes("lead_upsert_previsit", "site_visit_input", "system_failure_message");
edgeValue("site_visit_input", "yes", "site_visit_existing_visits_list", "yes");
edge("site_visit_input", "previsit_hot_switch", { isDefault: true, label: "no/default" });
edgeValue("previsit_hot_switch", "hot", "salesperson_alert_previsit", "hot");
edge("previsit_hot_switch", "nurture_followup_record", { isDefault: true, label: "warm_or_nurture/default" });
notificationRoutes("salesperson_alert_previsit", "nurture_followup_record");
recordRoutes("nurture_followup_record", "nurture_end_message", "system_failure_message");
edge("nurture_end_message", "nurture_end", { label: "next" });
recordRoutes("site_visit_existing_visits_list", "build_site_visit_slots", "system_failure_message");
scriptRoutes("build_site_visit_slots", "site_visit_scheduler", "system_failure_message");
edge("site_visit_scheduler", "prepare_site_visit_ids", { label: "selected" });
scriptRoutes("prepare_site_visit_ids", "confirm_site_visit_input", "system_failure_message");
edgeValue("confirm_site_visit_input", "yes", "site_visit_record_create", "yes");
edge("confirm_site_visit_input", "cancelled_visit_message", { isDefault: true, label: "no/default" });
edge("cancelled_visit_message", "cancelled_visit_end", { label: "next" });
recordRoutes("site_visit_record_create", "final_score_script", "system_failure_message");
scriptRoutes("final_score_script", "lead_upsert_final", "system_failure_message");
// Keep the confirmed site-visit journey independent from optional
// project-interest persistence in demo environments.
recordRoutes("lead_upsert_final", "lead_activity_visit_confirmed", "system_failure_message");
recordRoutes("lead_activity_visit_confirmed", "crm_sync_job_record", "system_failure_message");
recordRoutes("crm_sync_job_record", "buyer_confirmation_notification", "system_failure_message");
notificationRoutes("buyer_confirmation_notification", "reminder_scheduler_24h");
schedulerRoutes("reminder_scheduler_24h", "reminder_scheduler_2h");
schedulerRoutes("reminder_scheduler_2h", "final_hot_switch");
edgeValue("final_hot_switch", "hot", "salesperson_alert_final", "hot");
edge("final_hot_switch", "site_visit_confirmed_message", { isDefault: true, label: "warm_or_nurture/default" });
notificationRoutes("salesperson_alert_final", "site_visit_confirmed_message");
edge("site_visit_confirmed_message", "site_visit_end", { label: "next" });
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
