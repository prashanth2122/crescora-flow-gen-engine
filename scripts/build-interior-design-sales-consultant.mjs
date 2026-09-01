import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { notificationData } from "./notification-data.mjs";

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const domainRoot = join(rootDir, "domains", "interior-design");
const sourcePath = join(
  domainRoot,
  "templates-source",
  "interior-design-sales-consultant.source.flow.json"
);
const builtPath = join(
  domainRoot,
  "templates",
  "interior-design-sales-consultant.flow.json"
);
const stablePath = join(
  domainRoot,
  "templates-stable",
  "interior-design-sales-consultant.flow.json"
);

const exportDoc = {
  version: "1.0",
  exportedAt: "2026-08-25T00:00:00.000Z",
  bot: {
    name: "Interior Design Sales Consultant",
    description:
      "Automation-first interior design and services assistant that captures requirements, estimates budget ranges from maintained pricing records, collects floor plans and references, recommends packages, books consultations, and supports quote, project, payment, and service lookups from persisted records.",
    headerTitle: "Interior Design Sales Consultant",
    headerTagline: "Design enquiry, estimate, consultation, and project support",
    globalVariables: [
      { key: "brand_name", value: "Crescora.ai" },
      { key: "studio_name", value: "Northstar Interiors" },
      { key: "default_currency", value: "INR" },
      { key: "default_timezone", value: "Asia/Kolkata" },
      { key: "support_phone", value: "+91-90000-55000" },
      { key: "sales_email", value: "sales@northstar-interiors.example.com" },
      { key: "operations_email", value: "ops@northstar-interiors.example.com" },
      { key: "design_fee_label", value: "Consultation Fee As Applicable" }
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
    dateVar: "consultation_date",
    horizonDays: 21,
    maxSlotsPerDay: 6,
    dynamicSlotsVar,
    dynamicSlotsPath: "data",
    slotDurationMins: 60,
    slotIntervalMins: 30,
    availableWeekdays: "1,2,3,4,5,6",
    workingHoursStart: "10:00",
    workingHoursEnd: "19:00"
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

function mainMenuButtons() {
  return [
    { label: "Design My Home", value: "design_home" },
    { label: "Get Cost Estimate", value: "get_estimate" },
    { label: "Explore Packages", value: "explore_packages" },
    { label: "View Portfolio", value: "view_portfolio" },
    { label: "Materials & Brands", value: "materials" },
    { label: "Book Consultation", value: "book_consultation" },
    { label: "My Quote / Proposal", value: "quote_status" },
    { label: "My Project Status", value: "project_status" },
    { label: "Payments / Service", value: "payments_service" },
    { label: "Talk to a Designer", value: "talk_designer" }
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
function titleCase(value) {
  return String(value || "")
    .replace(/[_-]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
function formatMoneyMinor(value) {
  const amountMinor = Number(value || 0);
  const rupees = amountMinor / 100;
  if (!Number.isFinite(rupees) || rupees <= 0) return "";
  if (rupees >= 10000000) {
    return "Rs " + (rupees / 10000000).toFixed(1).replace(/\\.0$/, "") + " Cr";
  }
  if (rupees >= 100000) {
    return "Rs " + (rupees / 100000).toFixed(1).replace(/\\.0$/, "") + " L";
  }
  return "Rs " + Math.round(rupees).toLocaleString("en-IN");
}
function mapBudgetBandToTier(band) {
  const value = String(band || "").toLowerCase();
  if (value.includes("20") || value.includes("30") || value.includes("30+")) return "signature";
  if (value.includes("12") || value.includes("8")) return "premium";
  return "essential";
}
function knownLocationParts() {
  return [
    "kokapet",
    "narsingi",
    "kondapur",
    "gachibowli",
    "hitech city",
    "financial district",
    "kompally",
    "tellapur",
    "jubilee hills"
  ];
}
function inferLocation(text) {
  const lowered = String(text || "").toLowerCase();
  for (const part of knownLocationParts()) {
    if (lowered.includes(part)) {
      return {
        city: "Hyderabad",
        locality: titleCase(part)
      };
    }
  }
  return { city: "", locality: "" };
}
function parseScopeItems(text) {
  const lowered = String(text || "").toLowerCase();
  const items = [];
  if (/full home|entire home|complete interiors/.test(lowered)) items.push("full_home");
  if (/kitchen/.test(lowered)) items.push("modular_kitchen");
  if (/wardrobe/.test(lowered)) items.push("wardrobes");
  if (/tv unit|entertainment/.test(lowered)) items.push("tv_unit");
  if (/bedroom/.test(lowered)) items.push("bedrooms");
  if (/living/.test(lowered)) items.push("living_room");
  if (/kids/.test(lowered)) items.push("kids_room");
  if (/home office|study/.test(lowered)) items.push("home_office");
  if (/pooja/.test(lowered)) items.push("pooja_unit");
  if (/utility/.test(lowered)) items.push("utility");
  if (/balcony/.test(lowered)) items.push("balcony");
  if (/lighting/.test(lowered)) items.push("lighting");
  if (/false ceiling|ceiling/.test(lowered)) items.push("false_ceiling");
  if (/renovat/.test(lowered)) items.push("renovation");
  return Array.from(new Set(items));
}
`;

const schemas = {
  customers: pretty({
    collection: "interior_customers",
    fields: {
      customer_id: { type: "string", required: true, unique: true },
      full_name: { type: "string", required: true },
      phone_e164: { type: "phone", required: true, unique: true },
      email: { type: "email", required: false },
      preferred_channel: { type: "string", required: false },
      preferred_language: { type: "string", required: false },
      latest_lead_id: { type: "string", required: false }
    }
  }),
  properties: pretty({
    collection: "interior_properties",
    fields: {
      property_id: { type: "string", required: true, unique: true },
      customer_id: { type: "string", required: true },
      property_type: { type: "string", required: true },
      property_status: { type: "string", required: true },
      configuration: { type: "string", required: false },
      area_sqft: { type: "number", required: false },
      city: { type: "string", required: false },
      locality: { type: "string", required: false },
      pincode: { type: "string", required: false },
      address: { type: "string", required: false },
      possession_timeline: { type: "string", required: false }
    }
  }),
  leads: pretty({
    collection: "interior_leads",
    fields: {
      lead_id: { type: "string", required: true, unique: true },
      lead_number: { type: "string", required: true, unique: true },
      customer_id: { type: "string", required: true },
      property_id: { type: "string", required: true },
      customer_mobile: { type: "phone", required: true },
      customer_name: { type: "string", required: true },
      customer_email: { type: "email", required: false },
      source_channel: { type: "string", required: true },
      entry_mode: { type: "string", required: true },
      stage: { type: "string", required: true },
      status: { type: "string", required: true },
      qualification: { type: "string", required: false },
      lead_score: { type: "number", required: false },
      property_type: { type: "string", required: false },
      configuration: { type: "string", required: false },
      city: { type: "string", required: false },
      locality: { type: "string", required: false },
      design_style: { type: "string", required: false },
      budget_band: { type: "string", required: false },
      target_timeline: { type: "string", required: false },
      scope_summary: { type: "string", required: false },
      recommended_package_id: { type: "string", required: false },
      recommended_package_name: { type: "string", required: false },
      consultation_id: { type: "string", required: false },
      consultation_status: { type: "string", required: false },
      assigned_designer_id: { type: "string", required: false },
      assigned_designer_name: { type: "string", required: false },
      estimate_low_minor: { type: "number", required: false },
      estimate_high_minor: { type: "number", required: false },
      last_activity_at: { type: "string", required: false }
    }
  }),
  requirements: pretty({
    collection: "interior_lead_requirements",
    fields: {
      requirement_id: { type: "string", required: true, unique: true },
      lead_id: { type: "string", required: true },
      scope_items_csv: { type: "string", required: false },
      scope_summary: { type: "string", required: false },
      design_style: { type: "string", required: false },
      budget_band: { type: "string", required: false },
      target_timeline: { type: "string", required: false },
      requirement_summary: { type: "string", required: false },
      reference_asset_status: { type: "string", required: false },
      estimate_low_minor: { type: "number", required: false },
      estimate_high_minor: { type: "number", required: false }
    }
  }),
  assets: pretty({
    collection: "interior_lead_assets",
    fields: {
      asset_id: { type: "string", required: true, unique: true },
      lead_id: { type: "string", required: true },
      property_id: { type: "string", required: true },
      asset_type: { type: "string", required: true },
      asset_count: { type: "number", required: true },
      processing_status: { type: "string", required: true },
      extraction_summary: { type: "string", required: false }
    }
  }),
  packages: pretty({
    collection: "interior_packages",
    fields: {
      package_id: { type: "string", required: true, unique: true },
      package_name: { type: "string", required: true },
      tier: { type: "string", required: true },
      property_types: { type: "string", required: false },
      budget_bands: { type: "string", required: false },
      description: { type: "string", required: true },
      min_price_minor: { type: "number", required: false },
      max_price_minor: { type: "number", required: false },
      included_services: { type: "string", required: false },
      active: { type: "boolean", required: true }
    }
  }),
  priceCatalog: pretty({
    collection: "interior_price_catalog",
    fields: {
      price_rule_id: { type: "string", required: true, unique: true },
      scope_code: { type: "string", required: true },
      tier: { type: "string", required: true },
      configuration: { type: "string", required: false },
      min_minor: { type: "number", required: false },
      max_minor: { type: "number", required: false },
      active: { type: "boolean", required: true }
    }
  }),
  portfolio: pretty({
    collection: "interior_portfolio_items",
    fields: {
      portfolio_id: { type: "string", required: true, unique: true },
      title: { type: "string", required: true },
      style_code: { type: "string", required: true },
      property_type: { type: "string", required: false },
      configuration: { type: "string", required: false },
      room_scope: { type: "string", required: false },
      locality: { type: "string", required: false },
      highlight: { type: "string", required: false },
      budget_band: { type: "string", required: false },
      image_url: { type: "url", required: false },
      active: { type: "boolean", required: true }
    }
  }),
  materials: pretty({
    collection: "interior_material_catalog",
    fields: {
      material_id: { type: "string", required: true, unique: true },
      category: { type: "string", required: true },
      brand: { type: "string", required: false },
      product_name: { type: "string", required: true },
      finish: { type: "string", required: false },
      warranty_months: { type: "number", required: false },
      approved_use: { type: "string", required: false },
      faq_summary: { type: "string", required: false },
      active: { type: "boolean", required: true }
    }
  }),
  designers: pretty({
    collection: "interior_designers",
    fields: {
      designer_id: { type: "string", required: true, unique: true },
      full_name: { type: "string", required: true },
      team_name: { type: "string", required: false },
      location_zone: { type: "string", required: false },
      specialization: { type: "string", required: false },
      budget_tier_focus: { type: "string", required: false },
      languages: { type: "string", required: false },
      capacity_state: { type: "string", required: false },
      active: { type: "boolean", required: true }
    }
  }),
  consultationSlots: pretty({
    collection: "interior_consultation_slots",
    fields: {
      slot_id: { type: "string", required: true, unique: true },
      consultation_type: { type: "string", required: true },
      location_zone: { type: "string", required: false },
      designer_id: { type: "string", required: true },
      designer_name: { type: "string", required: true },
      slot_date: { type: "string", required: true },
      start_at: { type: "string", required: true },
      end_at: { type: "string", required: false },
      slot_label: { type: "string", required: true },
      status: { type: "string", required: true },
      lead_id: { type: "string", required: false },
      consultation_id: { type: "string", required: false }
    }
  }),
  consultations: pretty({
    collection: "interior_consultations",
    fields: {
      consultation_id: { type: "string", required: true, unique: true },
      consultation_number: { type: "string", required: true, unique: true },
      lead_id: { type: "string", required: true },
      customer_id: { type: "string", required: true },
      property_id: { type: "string", required: true },
      consultation_type: { type: "string", required: true },
      slot_id: { type: "string", required: true },
      designer_id: { type: "string", required: true },
      designer_name: { type: "string", required: true },
      scheduled_at: { type: "string", required: true },
      status: { type: "string", required: true }
    }
  }),
  quotes: pretty({
    collection: "interior_quotes",
    fields: {
      quote_id: { type: "string", required: true, unique: true },
      quote_number: { type: "string", required: true, unique: true },
      customer_mobile: { type: "phone", required: true },
      lead_id: { type: "string", required: false },
      property_id: { type: "string", required: false },
      version: { type: "number", required: true },
      status: { type: "string", required: true },
      total_minor: { type: "number", required: false },
      valid_until: { type: "string", required: false },
      scope_summary: { type: "string", required: false },
      next_action: { type: "string", required: false }
    }
  }),
  projects: pretty({
    collection: "interior_projects",
    fields: {
      project_id: { type: "string", required: true, unique: true },
      project_code: { type: "string", required: true, unique: true },
      customer_mobile: { type: "phone", required: true },
      lead_id: { type: "string", required: false },
      property_id: { type: "string", required: false },
      project_name: { type: "string", required: true },
      stage: { type: "string", required: true },
      status: { type: "string", required: true },
      completion_pct: { type: "number", required: false },
      expected_installation_start: { type: "string", required: false },
      expected_handover_date: { type: "string", required: false },
      assigned_designer_name: { type: "string", required: false }
    }
  }),
  projectMilestones: pretty({
    collection: "interior_project_milestones",
    fields: {
      milestone_id: { type: "string", required: true, unique: true },
      project_id: { type: "string", required: true },
      customer_mobile: { type: "phone", required: true },
      sequence_no: { type: "number", required: true },
      milestone_name: { type: "string", required: true },
      status: { type: "string", required: true },
      expected_date: { type: "string", required: false }
    }
  }),
  payments: pretty({
    collection: "interior_payments",
    fields: {
      payment_id: { type: "string", required: true, unique: true },
      customer_mobile: { type: "phone", required: true },
      lead_id: { type: "string", required: false },
      project_id: { type: "string", required: false },
      quote_id: { type: "string", required: false },
      purpose: { type: "string", required: true },
      amount_minor: { type: "number", required: true },
      currency: { type: "string", required: true },
      status: { type: "string", required: true },
      due_date: { type: "string", required: false }
    }
  }),
  serviceTickets: pretty({
    collection: "interior_service_tickets",
    fields: {
      ticket_id: { type: "string", required: true, unique: true },
      customer_mobile: { type: "phone", required: true },
      project_id: { type: "string", required: false },
      issue_type: { type: "string", required: true },
      room_area: { type: "string", required: false },
      priority: { type: "string", required: true },
      description: { type: "string", required: true },
      status: { type: "string", required: true },
      preferred_visit_window: { type: "string", required: false }
    }
  }),
  followupJobs: pretty({
    collection: "interior_followup_jobs",
    fields: {
      followup_id: { type: "string", required: true, unique: true },
      lead_id: { type: "string", required: false },
      consultation_id: { type: "string", required: false },
      job_type: { type: "string", required: true },
      run_at: { type: "string", required: false },
      channel: { type: "string", required: true },
      status: { type: "string", required: true }
    }
  })
};

const identityFields = [
  { key: "customer_name", label: "Full name", type: "text", required: true },
  { key: "customer_mobile", label: "Mobile number", type: "phone", required: true },
  { key: "customer_email", label: "Email", type: "email", required: false },
  {
    key: "preferred_contact_channel",
    label: "Preferred contact channel",
    type: "select",
    required: true,
    options: ["WhatsApp", "Phone", "Email"]
  }
];

const locationFields = [
  { key: "city", label: "City", type: "text", required: true },
  { key: "locality", label: "Locality", type: "text", required: true },
  { key: "pincode", label: "Pincode", type: "text", required: false },
  { key: "address", label: "Address", type: "text", required: false }
];

const serviceIssueFields = [
  {
    key: "service_issue_type",
    label: "Issue type",
    type: "select",
    required: true,
    options: ["warranty", "repair", "installation", "adjustment", "complaint"]
  },
  {
    key: "service_room_area",
    label: "Room / area",
    type: "text",
    required: false
  },
  {
    key: "service_priority",
    label: "Priority",
    type: "select",
    required: true,
    options: ["normal", "high", "urgent"]
  },
  {
    key: "service_description",
    label: "Describe the issue",
    type: "textarea",
    required: true
  },
  {
    key: "preferred_visit_window",
    label: "Preferred visit window",
    type: "text",
    required: false
  }
];

const mainIntentScript = `
const query = String(vars.main_menu_choice || "").trim();
const lowered = query.toLowerCase();
vars.interior_requirement_text = query;
vars.materials_question = "";
if (/quote|proposal/.test(lowered)) {
  vars.main_route = "quote_status";
} else if (/project status|project update|installation|handover|progress/.test(lowered)) {
  vars.main_route = "project_status";
} else if (/payment|milestone|due amount|paid amount/.test(lowered)) {
  vars.main_route = "payments";
} else if (/warranty|service|repair|issue|complaint/.test(lowered)) {
  vars.main_route = "service_warranty";
} else if (/material|brand|plywood|mdf|laminate|acrylic|hettich|hafele|ebco/.test(lowered)) {
  vars.main_route = "materials";
  vars.materials_question = query;
} else if (/portfolio|design|show me|modern 3bhk|scandinavian/.test(lowered)) {
  vars.main_route = "portfolio";
} else if (/package/.test(lowered)) {
  vars.main_route = "packages";
} else if (/consultation|site visit|book visit|book consultation|designer visit/.test(lowered)) {
  vars.main_route = "hero_direct";
  vars.entry_mode = "consultation";
} else if (/estimate|cost|price|budget/.test(lowered)) {
  vars.main_route = "hero_direct";
  vars.entry_mode = "estimate";
} else if (/designer|person|human|team/.test(lowered)) {
  vars.main_route = "talk_designer";
} else {
  vars.main_route = "hero_direct";
  vars.entry_mode = "design";
}
return "success";
`;

const parseRequirementScript = `
${arrayReaderBlock}
const rawText = String(vars.interior_requirement_text || "").trim();
const lowered = rawText.toLowerCase();
if (!vars.property_type) {
  if (/apartment|flat/.test(lowered)) vars.property_type = "Apartment";
  else if (/villa/.test(lowered)) vars.property_type = "Villa";
  else if (/independent house|house/.test(lowered)) vars.property_type = "Independent House";
  else if (/office|workspace/.test(lowered)) vars.property_type = "Office";
  else if (/retail|showroom|store/.test(lowered)) vars.property_type = "Retail / Commercial";
}
if (!vars.property_status) {
  if (/under construction/.test(lowered)) vars.property_status = "Under Construction";
  else if (/possession/.test(lowered)) vars.property_status = "Possession Soon";
  else if (/occupied/.test(lowered)) vars.property_status = "Already Occupied";
  else if (/renovat/.test(lowered)) vars.property_status = "Renovation Required";
  else if (/ready/.test(lowered)) vars.property_status = "Ready For Interiors";
}
if (!vars.configuration) {
  const bhkMatch = rawText.match(/(1|2|3|4|5)\\s*(?:\\+\\s*)?bhk/i);
  if (bhkMatch) {
    vars.configuration = bhkMatch[1] === "5" ? "4+ BHK" : bhkMatch[1] + " BHK";
  } else if (/villa/.test(lowered)) {
    vars.configuration = "Villa";
  } else if (/office/.test(lowered)) {
    vars.configuration = "Office";
  }
}
if (!vars.area_sqft) {
  const areaMatch = rawText.match(/(\\d{3,4})\\s*(?:sq\\.?\\s*ft|sqft|sft)/i);
  if (areaMatch) vars.area_sqft = Number(areaMatch[1]);
}
if (!vars.city || !vars.locality) {
  const location = inferLocation(rawText);
  if (!vars.city && location.city) vars.city = location.city;
  if (!vars.locality && location.locality) vars.locality = location.locality;
}
if (!vars.design_style) {
  if (/modern/.test(lowered) && /luxury/.test(lowered)) vars.design_style = "modern_luxury";
  else if (/scandinavian/.test(lowered)) vars.design_style = "scandinavian";
  else if (/minimal/.test(lowered)) vars.design_style = "minimal";
  else if (/traditional/.test(lowered)) vars.design_style = "traditional";
  else if (/contemporary/.test(lowered)) vars.design_style = "contemporary";
  else if (/luxury|premium/.test(lowered)) vars.design_style = "luxury";
  else if (/modern/.test(lowered)) vars.design_style = "modern";
}
if (!vars.scope_items_csv) {
  const scopes = parseScopeItems(rawText);
  if (scopes.length) vars.scope_items_csv = scopes.join(", ");
}
if (!vars.budget_band) {
  if (/under\\s*₹?\\s*5\\s*l|under\\s*5\\s*l|under\\s*5\\s*lakh/.test(lowered)) vars.budget_band = "Under Rs 5L";
  else if (/5\\s*(?:-|to|–)\\s*8\\s*l|5\\s*(?:-|to|–)\\s*8\\s*lakh/.test(lowered)) vars.budget_band = "Rs 5L-Rs 8L";
  else if (/8\\s*(?:-|to|–)\\s*12\\s*l|8\\s*(?:-|to|–)\\s*12\\s*lakh/.test(lowered)) vars.budget_band = "Rs 8L-Rs 12L";
  else if (/12\\s*(?:-|to|–)\\s*20\\s*l|12\\s*(?:-|to|–)\\s*20\\s*lakh/.test(lowered)) vars.budget_band = "Rs 12L-Rs 20L";
  else if (/20\\s*(?:-|to|–)\\s*30\\s*l|20\\s*(?:-|to|–)\\s*30\\s*lakh/.test(lowered)) vars.budget_band = "Rs 20L-Rs 30L";
  else if (/30\\s*l\\+|30\\s*lakh\\+|30\\s*lakh plus/.test(lowered)) vars.budget_band = "Rs 30L+";
  else if (/12\\s*lakh|12\\s*l/.test(lowered)) vars.budget_band = "Rs 12L-Rs 20L";
  else if (/15\\s*lakh|15\\s*l/.test(lowered)) vars.budget_band = "Rs 12L-Rs 20L";
}
if (!vars.target_timeline) {
  if (/immediate|asap/.test(lowered)) vars.target_timeline = "Immediately";
  else if (/45 day|1 month|within a month/.test(lowered)) vars.target_timeline = "Within 1 Month";
  else if (/1-3 month|1 to 3 month|2 month|3 month/.test(lowered)) vars.target_timeline = "1-3 Months";
  else if (/3-6 month|3 to 6 month|4 month|5 month|6 month/.test(lowered)) vars.target_timeline = "3-6 Months";
  else if (/just exploring|exploring/.test(lowered)) vars.target_timeline = "Just Exploring";
}
return "success";
`;

const refreshRequirementScript = `
${arrayReaderBlock}
if (vars.scope_text && !vars.scope_items_csv) {
  const scopes = parseScopeItems(vars.scope_text);
  if (scopes.length) vars.scope_items_csv = scopes.join(", ");
}
if (vars.scope_items_csv) {
  const items = String(vars.scope_items_csv)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  vars.scope_items_csv = Array.from(new Set(items)).join(", ");
  vars.scope_summary = items.map(titleCase).join(", ");
}
if (vars.design_style) {
  vars.design_style = String(vars.design_style || "").trim().toLowerCase().replace(/\\s+/g, "_");
}
if (vars.city && !vars.locality && vars.address) {
  const location = inferLocation(vars.address);
  if (location.locality) vars.locality = location.locality;
}
vars.has_property_type = vars.property_type ? "yes" : "no";
vars.has_property_status = vars.property_status ? "yes" : "no";
vars.has_configuration = vars.configuration ? "yes" : "no";
vars.has_area = vars.area_sqft ? "yes" : "no";
vars.has_location = vars.city && vars.locality ? "yes" : "no";
vars.has_scope = vars.scope_items_csv ? "yes" : "no";
vars.has_style = vars.design_style ? "yes" : "no";
vars.has_budget = vars.budget_band ? "yes" : "no";
vars.has_timeline = vars.target_timeline ? "yes" : "no";
if (!vars.scope_summary) vars.scope_summary = vars.scope_items_csv ? String(vars.scope_items_csv) : "";
return "success";
`;

const prepareIdentityScript = `
${arrayReaderBlock}
const nowIso = helpers.nowIso ? helpers.nowIso() : "2026-08-25T09:00:00.000Z";
const stamp = nowIso.slice(2, 10).replace(/-/g, "");
const suffix = helpers.randomInt ? helpers.randomInt(1000, 9999) : 4821;
const phone = normalizePhone(vars.customer_mobile);
if (!phone) {
  throw new Error("missing customer mobile");
}
vars.customer_mobile = phone;
vars.customer_id = vars.customer_id || "INT-CUST-" + phone.slice(-10);
vars.property_id = vars.property_id || "INT-PROP-" + stamp + "-" + suffix;
vars.lead_id = vars.lead_id || "INT-LEAD-" + stamp + "-" + suffix;
vars.lead_number = vars.lead_number || "INT-" + stamp + "-" + suffix;
vars.requirement_id = vars.requirement_id || "INT-REQ-" + stamp + "-" + suffix;
vars.asset_id = vars.asset_id || "INT-AST-" + stamp + "-" + suffix;
vars.consultation_id = vars.consultation_id || "INT-CONS-" + stamp + "-" + suffix;
vars.customer_email = String(vars.customer_email || "").trim();
vars.preferred_contact_channel = vars.preferred_contact_channel || "WhatsApp";
vars.scope_summary = vars.scope_summary || vars.scope_items_csv || "";
vars.requirement_summary = vars.requirement_summary || vars.interior_requirement_text || vars.scope_summary || "Interior requirement captured";
vars.reference_asset_status = vars.reference_asset_status || "not_uploaded";
vars.reference_asset_count = Number(vars.reference_asset_count || 0);
vars.lead_stage = "requirement_captured";
vars.lead_status = "open";
vars.last_activity_at = nowIso;
return "success";
`;

const estimateScript = `
${arrayReaderBlock}
const rows = getRows(vars.price_catalog_list_result);
const tier = mapBudgetBandToTier(vars.budget_band);
const requestedConfig = String(vars.configuration || "").trim().toLowerCase();
const scopeItems = String(vars.scope_items_csv || "")
  .split(",")
  .map((item) => item.trim().toLowerCase())
  .filter(Boolean);
const normalizedScopeItems = scopeItems.includes("full_home")
  ? ["modular_kitchen", "wardrobes", "tv_unit", "bedrooms", "living_room", "false_ceiling", "lighting"]
  : scopeItems;
let totalMin = 0;
let totalMax = 0;
const lines = [];
for (const rule of rows) {
  const scopeCode = String(rule.scope_code || "").toLowerCase();
  const matchesTier = String(rule.tier || "").toLowerCase() === tier;
  const matchesScope = normalizedScopeItems.includes(scopeCode);
  const ruleConfig = String(rule.configuration || "").toLowerCase();
  const matchesConfig = !ruleConfig || !requestedConfig || ruleConfig === requestedConfig || ruleConfig === "any";
  if (!matchesTier || !matchesScope || !matchesConfig) continue;
  const minValue = Number(rule.min_minor || 0);
  const maxValue = Number(rule.max_minor || 0);
  totalMin += minValue;
  totalMax += maxValue;
  lines.push(titleCase(scopeCode) + ": " + formatMoneyMinor(minValue) + " to " + formatMoneyMinor(maxValue));
}
if (!lines.length) {
  if (tier === "signature") {
    totalMin = 220000000;
    totalMax = 340000000;
  } else if (tier === "premium") {
    totalMin = 120000000;
    totalMax = 200000000;
  } else {
    totalMin = 65000000;
    totalMax = 110000000;
  }
  lines.push("Indicative package pricing used because no exact component set was matched.");
}
vars.estimate_low_minor = totalMin;
vars.estimate_high_minor = totalMax;
vars.estimate_range_display = formatMoneyMinor(totalMin) + " to " + formatMoneyMinor(totalMax);
vars.estimate_breakdown_text = lines.join("\\n");
let score = 35;
if (String(vars.property_status || "").toLowerCase().includes("ready")) score += 20;
if (String(vars.property_status || "").toLowerCase().includes("possession")) score += 15;
if (String(vars.scope_items_csv || "").toLowerCase().includes("full_home")) score += 15;
if (String(vars.target_timeline || "").toLowerCase().includes("1 month")) score += 15;
if (String(vars.target_timeline || "").toLowerCase().includes("1-3")) score += 10;
if (String(vars.reference_asset_status || "").toLowerCase().includes("uploaded")) score += 5;
if (tier === "premium" || tier === "signature") score += 10;
score = Math.min(score, 100);
vars.lead_score = score;
vars.qualification = score >= 80 ? "hot" : (score >= 55 ? "warm" : "nurture");
return "success";
`;

const packageRecommendationScript = `
${arrayReaderBlock}
const rows = getRows(vars.package_catalog_list_live_result);
const tier = mapBudgetBandToTier(vars.budget_band);
const propertyType = String(vars.property_type || "").toLowerCase();
const chosen = rows.find((item) => {
  const itemTier = String(item.tier || "").toLowerCase();
  const propertyTypes = String(item.property_types || "").toLowerCase();
  return itemTier === tier && (!propertyTypes || propertyTypes.includes(propertyType) || propertyTypes.includes("all"));
}) || rows[0];
if (!chosen) {
  throw new Error("missing package catalog");
}
vars.recommended_package_id = chosen.package_id || "";
vars.recommended_package_name = chosen.package_name || "";
vars.recommended_package_tier = chosen.tier || tier;
vars.recommended_package_description = chosen.description || "";
vars.recommended_package_range = formatMoneyMinor(chosen.min_price_minor) + " to " + formatMoneyMinor(chosen.max_price_minor);
vars.lead_summary_text =
  "Requirement Summary\\n\\n" +
  "Property: " + (vars.configuration || vars.property_type || "Requirement captured") + "\\n" +
  "Location: " + [vars.locality, vars.city].filter(Boolean).join(", ") + "\\n" +
  "Scope: " + (vars.scope_summary || "To be refined with the designer") + "\\n" +
  "Style: " + titleCase(vars.design_style || "modern") + "\\n" +
  "Budget: " + (vars.budget_band || "Not decided") + "\\n" +
  "Timeline: " + (vars.target_timeline || "Not decided") + "\\n\\n" +
  "Indicative Estimate: " + (vars.estimate_range_display || "Will be shared after consultation") + "\\n" +
  "Recommended Package: " + vars.recommended_package_name + " (" + vars.recommended_package_tier + ")\\n" +
  vars.recommended_package_description;
return "success";
`;

const portfolioMatchScript = `
${arrayReaderBlock}
const rows = getRows(vars.portfolio_list_result);
const query = String(vars.interior_requirement_text || vars.portfolio_query || "").toLowerCase();
const style = String(vars.design_style || "").toLowerCase();
const propertyType = String(vars.property_type || "").toLowerCase();
const configuration = String(vars.configuration || "").toLowerCase();
const matched = rows.filter((item) => {
  const styleCode = String(item.style_code || "").toLowerCase();
  const itemPropertyType = String(item.property_type || "").toLowerCase();
  const itemConfiguration = String(item.configuration || "").toLowerCase();
  const itemRoom = String(item.room_scope || "").toLowerCase();
  const byStyle = !style || styleCode.includes(style) || query.includes(styleCode);
  const byProperty = !propertyType || !itemPropertyType || itemPropertyType.includes(propertyType);
  const byConfig = !configuration || !itemConfiguration || itemConfiguration.includes(configuration);
  const byRoom = !query || !itemRoom || query.includes(itemRoom) || query.includes(styleCode);
  return byStyle && byProperty && byConfig && byRoom;
}).slice(0, 5);
if (!matched.length) {
  vars.portfolio_route = "not_found";
  return "success";
}
vars.portfolio_slides = matched.map((item) => ({
  title: item.title,
  subtitle: [item.configuration, titleCase(item.style_code || ""), item.locality].filter(Boolean).join(" | "),
  description: item.highlight || item.room_scope || "Interior portfolio reference",
  tag: item.budget_band || "",
  imageUrl: item.image_url || "",
  primaryLabel: "Book Consultation",
  primaryValue: "book_consultation",
  secondaryLabel: "Get Estimate",
  secondaryValue: "get_estimate"
}));
vars.portfolio_route = "matched";
return "success";
`;

const materialAnswerScript = `
${arrayReaderBlock}
const rows = getRows(vars.material_list_result);
const question = String(vars.materials_question || vars.main_menu_choice || "").trim();
const lowered = question.toLowerCase();
let filtered = rows.filter((item) => String(item.active || "").toLowerCase() !== "false");
if (/plywood|mdf|particle/.test(lowered)) {
  filtered = filtered.filter((item) => /plywood|mdf/.test(String(item.category || "").toLowerCase()) || /plywood|mdf/.test(String(item.product_name || "").toLowerCase()));
} else if (/acrylic|laminate/.test(lowered)) {
  filtered = filtered.filter((item) => /acrylic|laminate/.test(String(item.category || "").toLowerCase()) || /acrylic|laminate/.test(String(item.product_name || "").toLowerCase()));
} else if (/hettich|hafele|ebco/.test(lowered)) {
  filtered = filtered.filter((item) => lowered.includes(String(item.brand || "").toLowerCase()));
} else if (/warranty/.test(lowered)) {
  filtered = filtered.filter((item) => Number(item.warranty_months || 0) > 0);
}
filtered = filtered.slice(0, 3);
if (!filtered.length) {
  vars.material_answer_text =
    "I can answer approved materials and brand questions once the design team knows the exact scope. " +
    "For this query, the safest next step is a designer consultation so the team can match the right board, finish, and hardware to your project.";
  return "success";
}
const lines = filtered.map((item) => {
  const pieces = [
    (item.brand ? item.brand + " " : "") + (item.product_name || item.category || "Approved material"),
    item.approved_use ? "Use: " + item.approved_use : "",
    item.faq_summary ? item.faq_summary : "",
    item.warranty_months ? "Warranty: " + item.warranty_months + " months" : ""
  ].filter(Boolean);
  return "- " + pieces.join(". ");
});
vars.material_answer_text =
  "Approved Materials Guidance\\n\\n" +
  lines.join("\\n") +
  "\\n\\nFinal material selection should still follow the approved package, measurements, and signed proposal.";
return "success";
`;

const consultationPreparationScript = `
${arrayReaderBlock}
const designers = getRows(vars.designer_list_result).filter((item) => item.active !== false);
const slots = getRows(vars.consultation_slot_list_result).filter((item) => String(item.status || "").toLowerCase() === "available");
const consultationType = String(vars.consultation_type || "").toLowerCase();
const locality = String(vars.locality || "").toLowerCase();
const city = String(vars.city || "").toLowerCase();
const style = String(vars.design_style || "").toLowerCase();
const budgetTier = mapBudgetBandToTier(vars.budget_band);
let locationZone = "West Hyderabad";
if (/kompally/.test(locality)) locationZone = "North Hyderabad";
if (/jubilee hills/.test(locality)) locationZone = "Central Hyderabad";
let selectedDesigner = designers.find((item) => {
  const zone = String(item.location_zone || "").toLowerCase();
  const specialization = String(item.specialization || "").toLowerCase();
  const tierFocus = String(item.budget_tier_focus || "").toLowerCase();
  const zoneMatch = !zone || zone.includes(locationZone.toLowerCase()) || (!locality && city.includes("hyderabad"));
  const styleMatch = !specialization || specialization.includes(style) || specialization.includes("residential");
  const tierMatch = !tierFocus || tierFocus.includes(budgetTier);
  return zoneMatch && styleMatch && tierMatch;
});
if (!selectedDesigner) selectedDesigner = designers[0];
if (!selectedDesigner) {
  vars.consultation_slot_state = "unavailable";
  return "success";
}
vars.assigned_designer_id = selectedDesigner.designer_id || "";
vars.assigned_designer_name = selectedDesigner.full_name || "";
vars.assigned_designer_team = selectedDesigner.team_name || "";
vars.assigned_designer_language = selectedDesigner.languages || "";
const matchedSlots = slots
  .filter((item) => {
    const designerMatch = String(item.designer_id || "") === vars.assigned_designer_id;
    const typeValue = String(item.consultation_type || "").toLowerCase();
    const typeMatch = !consultationType || typeValue === consultationType || typeValue === "all";
    return designerMatch && typeMatch;
  })
  .slice(0, 8);
if (!matchedSlots.length) {
  vars.consultation_slot_state = "unavailable";
  return "success";
}
vars.consultation_slot_options = {
  data: matchedSlots.map((item) => ({
    id: item.slot_id,
    slot_id: item.slot_id,
    date: item.slot_date,
    start: item.start_at,
    end: item.end_at,
    label: item.slot_label
  }))
};
vars.consultation_slot_state = "available";
return "success";
`;

const consultationSelectionScript = `
${arrayReaderBlock}
const booking = vars.consultation_booking || {};
const slotId = String(booking.slotId || booking.slot_id || "").trim();
const rows = getRows(vars.consultation_slot_list_result);
const row = rows.find((item) => String(item.slot_id || "") === slotId);
if (!slotId || !row) {
  throw new Error("missing consultation slot selection");
}
const nowIso = helpers.nowIso ? helpers.nowIso() : "2026-08-25T09:00:00.000Z";
const suffix = helpers.randomInt ? helpers.randomInt(1000, 9999) : 4821;
vars.selected_slot_id = row.slot_id || slotId;
vars.selected_slot_date = row.slot_date || booking.date || "";
vars.selected_slot_start = row.start_at || booking.startTime || booking.start_time || "";
vars.selected_slot_end = row.end_at || booking.endTime || booking.end_time || "";
vars.selected_slot_label = row.slot_label || booking.slotLabel || booking.slot_label || "";
vars.scheduled_at = vars.selected_slot_date + "T" + vars.selected_slot_start + ":00+05:30";
vars.consultation_number = vars.consultation_number || ("INT-CNS-" + nowIso.slice(2, 10).replace(/-/g, "") + "-" + suffix);
vars.lead_stage = "consultation_booked";
vars.lead_status = "confirmed_lead";
vars.consultation_status = "booked";
return "success";
`;

const normalizeStatusMobileScript = `
${arrayReaderBlock}
const normalized = normalizePhone(vars.status_lookup_mobile);
if (!normalized) {
  throw new Error("missing status lookup mobile");
}
vars.status_lookup_mobile_normalized = normalized;
return "success";
`;

const quoteSummaryScript = `
${arrayReaderBlock}
const rows = getRows(vars.quote_list_result);
if (!rows.length) {
  vars.lookup_route = "not_found";
  return "success";
}
const quote = rows[0];
vars.lookup_route = "found";
vars.quote_summary_text =
  "Quote / Proposal Status\\n\\n" +
  "Quote: " + (quote.quote_number || quote.quote_id || "Available") + "\\n" +
  "Version: " + (quote.version || 1) + "\\n" +
  "Status: " + titleCase(quote.status || "pending") + "\\n" +
  "Scope: " + (quote.scope_summary || "Interior proposal") + "\\n" +
  "Value: " + formatMoneyMinor(quote.total_minor) + "\\n" +
  "Valid Until: " + (quote.valid_until || "See latest proposal") + "\\n" +
  "Next Action: " + (quote.next_action || "Talk to the design team");
return "success";
`;

const projectSummaryScript = `
${arrayReaderBlock}
const projects = getRows(vars.project_list_result);
const milestones = getRows(vars.project_milestone_list_result);
if (!projects.length) {
  vars.lookup_route = "not_found";
  return "success";
}
const project = projects[0];
const projectMilestones = milestones
  .filter((item) => String(item.project_id || "") === String(project.project_id || ""))
  .sort((a, b) => Number(a.sequence_no || 0) - Number(b.sequence_no || 0))
  .slice(0, 5);
vars.lookup_route = "found";
vars.project_summary_text =
  "Project Status\\n\\n" +
  "Project: " + (project.project_name || project.project_code || "Interior Project") + "\\n" +
  "Stage: " + titleCase(project.stage || "in_progress") + "\\n" +
  "Status: " + titleCase(project.status || "active") + "\\n" +
  "Completion: " + String(project.completion_pct || 0) + "%\\n" +
  "Expected Installation: " + (project.expected_installation_start || "TBD") + "\\n" +
  "Expected Handover: " + (project.expected_handover_date || "TBD") + "\\n" +
  "Assigned Designer: " + (project.assigned_designer_name || "Northstar Interiors Team") + "\\n\\n" +
  "Milestones\\n" +
  projectMilestones.map((item) => "- " + item.milestone_name + ": " + titleCase(item.status || "pending")).join("\\n");
return "success";
`;

const paymentSummaryScript = `
${arrayReaderBlock}
const rows = getRows(vars.payment_list_result);
if (!rows.length) {
  vars.lookup_route = "not_found";
  return "success";
}
let paid = 0;
let pending = 0;
const lines = [];
for (const item of rows.slice(0, 6)) {
  const amount = Number(item.amount_minor || 0);
  if (String(item.status || "").toLowerCase() === "paid") paid += amount;
  else pending += amount;
  lines.push("- " + titleCase(item.purpose || "payment") + ": " + formatMoneyMinor(amount) + " (" + titleCase(item.status || "pending") + ")");
}
vars.lookup_route = "found";
vars.payment_summary_text =
  "Payment Status\\n\\n" +
  "Paid So Far: " + formatMoneyMinor(paid) + "\\n" +
  "Pending / Upcoming: " + formatMoneyMinor(pending) + "\\n\\n" +
  lines.join("\\n");
return "success";
`;

const serviceSummaryScript = `
${arrayReaderBlock}
const rows = getRows(vars.service_ticket_list_result);
if (!rows.length) {
  vars.lookup_route = "not_found";
  return "success";
}
vars.lookup_route = "found";
vars.service_summary_text =
  "Open Service / Warranty Requests\\n\\n" +
  rows.slice(0, 5).map((item) =>
    "- " +
    (item.ticket_id || "Request") +
    ": " +
    titleCase(item.issue_type || "service") +
    " in " +
    (item.room_area || "project area") +
    " (" +
    titleCase(item.status || "open") +
    ")"
  ).join("\\n");
return "success";
`;

const serviceTicketScript = `
${arrayReaderBlock}
const nowIso = helpers.nowIso ? helpers.nowIso() : "2026-08-25T09:00:00.000Z";
const suffix = helpers.randomInt ? helpers.randomInt(1000, 9999) : 4821;
vars.service_ticket_id = "INT-SVC-" + nowIso.slice(2, 10).replace(/-/g, "") + "-" + suffix;
vars.status_lookup_mobile_normalized = normalizePhone(vars.status_lookup_mobile);
if (!vars.status_lookup_mobile_normalized) {
  throw new Error("missing service lookup mobile");
}
vars.service_issue_type = String(vars.service_issue_type || "").toLowerCase();
vars.service_priority = String(vars.service_priority || "").toLowerCase();
return "success";
`;

const otpScript1 = 'const otp = String(vars.status_lookup_otp || "").trim(); vars.status_lookup_otp_route = /^\\\\d{6}$/.test(otp) ? "valid" : "retry"; return "success";';
const otpScript2 = 'const otp = String(vars.status_lookup_otp || "").trim(); vars.status_lookup_otp_route = /^\\\\d{6}$/.test(otp) ? "valid" : "retry"; return "success";';
const otpScript3 = 'const otp = String(vars.status_lookup_otp || "").trim(); vars.status_lookup_otp_route = /^\\\\d{6}$/.test(otp) ? "valid" : "max_exceeded"; return "success";';

node("start_1", "start", 0, 0, { messages: [] });
node("set_defaults", "setVariable", 240, 0, setVars({
  entry_mode: "design",
  post_auth_route: "",
  reference_asset_status: "not_uploaded",
  reference_asset_count: 0,
  portfolio_query: "",
  materials_question: ""
}));
node("welcome_message", "message", 480, 0, msgData(
  "Welcome! I can help with interior requirements, cost estimates, packages, portfolio references, consultation booking, and post-sales support."
));
node("main_menu_input", "input", 720, 0, inputData(
  "Choose a service or type your requirement directly.",
  "main_menu_choice",
  mainMenuButtons()
));
node("set_mode_design", "setVariable", 960, -320, setVars({ entry_mode: "design" }));
node("set_mode_estimate", "setVariable", 960, -240, setVars({ entry_mode: "estimate" }));
node("set_mode_consultation", "setVariable", 960, -160, setVars({ entry_mode: "consultation" }));
node("set_post_auth_quote", "setVariable", 960, 120, setVars({ post_auth_route: "quote_status" }));
node("set_post_auth_project", "setVariable", 960, 220, setVars({ post_auth_route: "project_status" }));
node("set_post_auth_payment", "setVariable", 960, 320, setVars({ post_auth_route: "payments" }));
node("set_post_auth_service", "setVariable", 960, 420, setVars({ post_auth_route: "service_warranty" }));
node("parse_main_intent", "script", 960, 0, scriptData(mainIntentScript, "parse_main_intent_result"));
node("main_intent_switch", "switch", 1200, 0, switchData("main_route"));

node("package_catalog_list_menu", "record", 1440, -520, recordData({
  action: "list",
  collection: "interior_packages",
  where: { active: true },
  schema: schemas.packages,
  outputVar: "package_catalog_list_menu_result",
  limit: 10,
  sortBy: "package_name",
  sortOrder: "asc"
}));
node("package_catalog_script_menu", "script", 1680, -520, scriptData(`
${arrayReaderBlock}
const rows = getRows(vars.package_catalog_list_menu_result);
vars.package_catalog_text =
  "Interior Packages\\n\\n" +
  rows.map((item) =>
    "- " +
    item.package_name +
    " (" +
    titleCase(item.tier || "") +
    "): " +
    item.description +
    " | " +
    formatMoneyMinor(item.min_price_minor) +
    " to " +
    formatMoneyMinor(item.max_price_minor)
  ).join("\\n");
return "success";
`, "package_catalog_script_menu_result"));
node("package_catalog_message", "message", 1920, -520, msgData("{{package_catalog_text}}"));
node("package_catalog_next_input", "input", 2160, -520, inputData(
  "Would you like an estimate or a consultation next?",
  "package_next_action",
  [
    { label: "Get Estimate", value: "get_estimate" },
    { label: "Book Consultation", value: "book_consultation" }
  ],
  true
));

node("portfolio_query_input", "input", 1440, -240, inputData(
  "Tell me the style, property type, or room you want to explore. Example: modern 3 BHK living room.",
  "portfolio_query"
));
node("portfolio_query_to_requirement", "setVariable", 1680, -240, setVars({
  interior_requirement_text: "{{portfolio_query}}"
}));
node("portfolio_parse_requirement", "script", 1920, -240, scriptData(parseRequirementScript, "portfolio_parse_requirement_result"));
node("portfolio_list", "record", 2160, -240, recordData({
  action: "list",
  collection: "interior_portfolio_items",
  where: { active: true },
  schema: schemas.portfolio,
  outputVar: "portfolio_list_result",
  limit: 20,
  sortBy: "title",
  sortOrder: "asc"
}));
node("portfolio_match_script", "script", 2400, -240, scriptData(portfolioMatchScript, "portfolio_match_script_result"));
node("portfolio_route_switch", "switch", 2640, -240, switchData("portfolio_route"));
node("portfolio_carousel", "carousel", 2880, -240, dynamicCarouselData(
  "Here are some relevant interior references.",
  "{{portfolio_slides}}",
  {
    title: "{{item.title}}",
    subtitle: "{{item.subtitle}}",
    body: "{{item.description}}",
    tag: "{{item.tag}}",
    imageUrl: "{{item.imageUrl}}",
    buttons: [
      { label: "{{item.primaryLabel}}", value: "{{item.primaryValue}}" },
      { label: "{{item.secondaryLabel}}", value: "{{item.secondaryValue}}" }
    ]
  }
));
node("portfolio_no_match_message", "message", 2880, -120, msgData(
  "I could not find a close portfolio match from the current catalog, but I can still prepare an estimate or book a consultation using your requirement."
));
node("portfolio_next_input", "input", 3120, -240, inputData(
  "What would you like to do next?",
  "portfolio_next_action",
  [
    { label: "Get Estimate", value: "get_estimate" },
    { label: "Book Consultation", value: "book_consultation" }
  ],
  true
));
node("set_mode_estimate_from_portfolio", "setVariable", 3360, -320, setVars({ entry_mode: "estimate" }));
node("set_mode_consultation_from_portfolio", "setVariable", 3360, -200, setVars({ entry_mode: "consultation" }));

node("materials_question_input", "input", 1440, -20, inputData(
  "Ask about materials, brands, finishes, or warranty. Example: Do you use Hettich? or Plywood vs MDF?",
  "materials_question"
));
node("material_list", "record", 1680, -20, recordData({
  action: "list",
  collection: "interior_material_catalog",
  where: { active: true },
  schema: schemas.materials,
  outputVar: "material_list_result",
  limit: 20,
  sortBy: "category",
  sortOrder: "asc"
}));
node("material_answer_script", "script", 1920, -20, scriptData(materialAnswerScript, "material_answer_script_result"));
node("material_answer_message", "message", 2160, -20, msgData("{{material_answer_text}}"));
node("material_answer_end", "end", 2400, -20, { messages: [] });

node("advisor_handover_form", "form", 1440, 620, formData(
  "Share your name and mobile number so a designer can call you back.",
  [
    { key: "designer_handover_name", label: "Full name", type: "text", required: true },
    { key: "designer_handover_mobile", label: "Mobile number", type: "phone", required: true },
    { key: "designer_handover_note", label: "What do you need help with?", type: "textarea", required: false }
  ],
  "advisor_handover_form_result"
));
node("advisor_handover", "handover", 1680, 620, {
  channel: "human",
  messages: ["Connecting this enquiry to a designer."]
});

node("status_mobile_form", "form", 1440, 160, formData(
  "Enter the registered mobile number.",
  [{ key: "status_lookup_mobile", label: "Mobile number", type: "phone", required: true }],
  "status_mobile_form_result"
));
node("status_otp_input", "input", 1680, 160, inputData(
  "Enter the 6-digit OTP sent to that mobile number.",
  "status_lookup_otp"
));
node("status_otp_validate", "script", 1920, 160, scriptData(otpScript1, "status_otp_validate_result"));
node("status_otp_route", "switch", 2160, 160, switchData("status_lookup_otp_route"));
node("status_otp_invalid_message_1", "message", 2400, 80, msgData("That OTP format is invalid. Please enter a 6-digit OTP."));
node("status_otp_input_2", "input", 2640, 80, inputData("Enter the 6-digit OTP again.", "status_lookup_otp"));
node("status_otp_validate_2", "script", 2880, 80, scriptData(otpScript2, "status_otp_validate_2_result"));
node("status_otp_route_2", "switch", 3120, 80, switchData("status_lookup_otp_route"));
node("status_otp_invalid_message_2", "message", 3360, 0, msgData("That OTP format is still invalid. Please try one final time."));
node("status_otp_input_3", "input", 3600, 0, inputData("Enter the 6-digit OTP one final time.", "status_lookup_otp"));
node("status_otp_validate_3", "script", 3840, 0, scriptData(otpScript3, "status_otp_validate_3_result"));
node("status_otp_route_3", "switch", 4080, 0, switchData("status_lookup_otp_route"));
node("status_otp_failed_message", "message", 4320, -80, msgData("Maximum OTP attempts exceeded. Please start a new chat to try again."));
node("status_otp_failed_end", "end", 4560, -80, { messages: [] });
node("normalize_status_mobile", "script", 2400, 240, scriptData(normalizeStatusMobileScript, "normalize_status_mobile_result"));
node("post_auth_route_switch", "switch", 2640, 240, switchData("post_auth_route"));

node("quote_list", "record", 2880, 140, recordData({
  action: "list",
  collection: "interior_quotes",
  where: { customer_mobile: "{{status_lookup_mobile_normalized}}" },
  schema: schemas.quotes,
  outputVar: "quote_list_result",
  limit: 5
}));
node("quote_summary_script", "script", 3120, 140, scriptData(quoteSummaryScript, "quote_summary_script_result"));
node("quote_route_switch", "switch", 3360, 140, switchData("lookup_route"));
node("quote_message", "message", 3600, 140, msgData("{{quote_summary_text}}"));
node("quote_not_found_message", "message", 3600, 220, msgData("I could not find an active quote or proposal using that mobile number."));
node("quote_end", "end", 3840, 140, { messages: [] });
node("quote_not_found_end", "end", 3840, 220, { messages: [] });

node("project_list", "record", 2880, 340, recordData({
  action: "list",
  collection: "interior_projects",
  where: { customer_mobile: "{{status_lookup_mobile_normalized}}" },
  schema: schemas.projects,
  outputVar: "project_list_result",
  limit: 5
}));
node("project_milestone_list", "record", 3120, 340, recordData({
  action: "list",
  collection: "interior_project_milestones",
  where: { customer_mobile: "{{status_lookup_mobile_normalized}}" },
  schema: schemas.projectMilestones,
  outputVar: "project_milestone_list_result",
  limit: 20,
  sortBy: "sequence_no",
  sortOrder: "asc"
}));
node("project_summary_script", "script", 3360, 340, scriptData(projectSummaryScript, "project_summary_script_result"));
node("project_route_switch", "switch", 3600, 340, switchData("lookup_route"));
node("project_message", "message", 3840, 340, msgData("{{project_summary_text}}"));
node("project_not_found_message", "message", 3840, 420, msgData("I could not find an active interior project using that mobile number."));
node("project_end", "end", 4080, 340, { messages: [] });
node("project_not_found_end", "end", 4080, 420, { messages: [] });

node("payment_list", "record", 2880, 540, recordData({
  action: "list",
  collection: "interior_payments",
  where: { customer_mobile: "{{status_lookup_mobile_normalized}}" },
  schema: schemas.payments,
  outputVar: "payment_list_result",
  limit: 20
}));
node("payment_summary_script", "script", 3120, 540, scriptData(paymentSummaryScript, "payment_summary_script_result"));
node("payment_route_switch", "switch", 3360, 540, switchData("lookup_route"));
node("payment_message", "message", 3600, 540, msgData("{{payment_summary_text}}"));
node("payment_not_found_message", "message", 3600, 620, msgData("I could not find saved interior payment records using that mobile number."));
node("payment_end", "end", 3840, 540, { messages: [] });
node("payment_not_found_end", "end", 3840, 620, { messages: [] });

node("service_choice_input", "input", 2880, 760, inputData(
  "Do you want to view open service requests or raise a new issue?",
  "service_next_action",
  [
    { label: "View Open Requests", value: "view_open_requests" },
    { label: "Raise New Issue", value: "raise_new_issue" }
  ],
  true
));
node("service_ticket_list", "record", 3120, 700, recordData({
  action: "list",
  collection: "interior_service_tickets",
  where: { customer_mobile: "{{status_lookup_mobile_normalized}}" },
  schema: schemas.serviceTickets,
  outputVar: "service_ticket_list_result",
  limit: 10
}));
node("service_summary_script", "script", 3360, 700, scriptData(serviceSummaryScript, "service_summary_script_result"));
node("service_route_switch", "switch", 3600, 700, switchData("lookup_route"));
node("service_message", "message", 3840, 700, msgData("{{service_summary_text}}"));
node("service_not_found_message", "message", 3840, 780, msgData("There are no open service or warranty requests on this mobile number right now."));
node("service_end", "end", 4080, 700, { messages: [] });
node("service_not_found_end", "end", 4080, 780, { messages: [] });
node("service_issue_form", "form", 3120, 860, formData(
  "Tell me about the issue so I can create a service request.",
  serviceIssueFields,
  "service_issue_form_result"
));
node("service_ticket_script", "script", 3360, 860, scriptData(serviceTicketScript, "service_ticket_script_result"));
node("service_ticket_record", "record", 3600, 860, recordData({
  action: "upsert",
  collection: "interior_service_tickets",
  where: { ticket_id: "{{service_ticket_id}}" },
  data: {
    ticket_id: "{{service_ticket_id}}",
    customer_mobile: "{{status_lookup_mobile_normalized}}",
    project_id: "",
    issue_type: "{{service_issue_type}}",
    room_area: "{{service_room_area}}",
    priority: "{{service_priority}}",
    description: "{{service_description}}",
    status: "open",
    preferred_visit_window: "{{preferred_visit_window}}"
  },
  schema: schemas.serviceTickets,
  uniqueKey: "ticket_id",
  idempotencyKey: "{{service_ticket_id}}",
  outputVar: "service_ticket_record_result"
}));
node("service_ticket_message", "message", 3840, 860, msgData(
  "Your service request has been created.\\n\\nReference: {{service_ticket_id}}\\nIssue: {{service_issue_type}}\\nPriority: {{service_priority}}\\nPreferred Visit Window: {{preferred_visit_window}}"
));
node("service_ticket_end", "end", 4080, 860, { messages: [] });

node("requirement_input", "input", 1440, -860, inputData(
  "Describe the property and what you need. Example: Need 3 BHK interiors around Rs 12 lakh in Narsingi.",
  "interior_requirement_text"
));
node("parse_requirement", "script", 1680, -860, scriptData(parseRequirementScript, "parse_requirement_result"));
node("refresh_requirement_state", "script", 1920, -860, scriptData(refreshRequirementScript, "refresh_requirement_state_result"));
node("refresh_after_property_type", "script", 2520, -940, scriptData(refreshRequirementScript, "refresh_after_property_type_result"));
node("refresh_after_property_status", "script", 3000, -940, scriptData(refreshRequirementScript, "refresh_after_property_status_result"));
node("refresh_after_configuration", "script", 3480, -940, scriptData(refreshRequirementScript, "refresh_after_configuration_result"));
node("refresh_after_area", "script", 3960, -940, scriptData(refreshRequirementScript, "refresh_after_area_result"));
node("refresh_after_location", "script", 4440, -940, scriptData(refreshRequirementScript, "refresh_after_location_result"));
node("refresh_after_scope", "script", 4920, -940, scriptData(refreshRequirementScript, "refresh_after_scope_result"));
node("refresh_after_style", "script", 5400, -940, scriptData(refreshRequirementScript, "refresh_after_style_result"));
node("refresh_after_budget", "script", 5880, -940, scriptData(refreshRequirementScript, "refresh_after_budget_result"));
node("refresh_after_timeline", "script", 6360, -940, scriptData(refreshRequirementScript, "refresh_after_timeline_result"));
node("property_type_switch", "switch", 2160, -860, switchData("has_property_type"));
node("property_type_input", "input", 2400, -940, inputData(
  "What are you planning interiors for?",
  "property_type",
  [
    { label: "Apartment", value: "Apartment" },
    { label: "Villa", value: "Villa" },
    { label: "Independent House", value: "Independent House" },
    { label: "Office", value: "Office" },
    { label: "Retail / Commercial", value: "Retail / Commercial" }
  ],
  true
));
node("property_status_switch", "switch", 2640, -860, switchData("has_property_status"));
node("property_status_input", "input", 2880, -940, inputData(
  "What is the current property status?",
  "property_status",
  [
    { label: "Under Construction", value: "Under Construction" },
    { label: "Possession Soon", value: "Possession Soon" },
    { label: "Ready For Interiors", value: "Ready For Interiors" },
    { label: "Already Occupied", value: "Already Occupied" },
    { label: "Renovation Required", value: "Renovation Required" }
  ],
  true
));
node("configuration_switch", "switch", 3120, -860, switchData("has_configuration"));
node("configuration_input", "input", 3360, -940, inputData(
  "What is the configuration?",
  "configuration",
  [
    { label: "1 BHK", value: "1 BHK" },
    { label: "2 BHK", value: "2 BHK" },
    { label: "3 BHK", value: "3 BHK" },
    { label: "4 BHK", value: "4 BHK" },
    { label: "Villa", value: "Villa" },
    { label: "Office", value: "Office" }
  ],
  true
));
node("area_switch", "switch", 3600, -860, switchData("has_area"));
node("area_form", "form", 3840, -940, formData(
  "Approximately how large is the property?",
  [{ key: "area_sqft", label: "Area in sq ft", type: "number", required: true }],
  "area_form_result"
));
node("location_switch", "switch", 4080, -860, switchData("has_location"));
node("location_form", "form", 4320, -940, formData(
  "Share the property location.",
  locationFields,
  "location_form_result"
));
node("scope_switch", "switch", 4560, -860, switchData("has_scope"));
node("scope_form", "form", 4800, -940, formData(
  "Which areas do you want us to work on? Use a short comma-separated answer such as full home, kitchen, wardrobes, TV unit.",
  [{ key: "scope_text", label: "Scope", type: "text", required: true }],
  "scope_form_result"
));
node("style_switch", "switch", 5040, -860, switchData("has_style"));
node("style_input", "input", 5280, -940, inputData(
  "Which design style is closest to what you want?",
  "design_style",
  [
    { label: "Modern", value: "modern" },
    { label: "Luxury", value: "luxury" },
    { label: "Minimal", value: "minimal" },
    { label: "Contemporary", value: "contemporary" },
    { label: "Traditional", value: "traditional" },
    { label: "Scandinavian", value: "scandinavian" }
  ],
  true
));
node("budget_switch", "switch", 5520, -860, switchData("has_budget"));
node("budget_input", "input", 5760, -940, inputData(
  "What investment range are you considering?",
  "budget_band",
  [
    { label: "Under Rs 5L", value: "Under Rs 5L" },
    { label: "Rs 5L-Rs 8L", value: "Rs 5L-Rs 8L" },
    { label: "Rs 8L-Rs 12L", value: "Rs 8L-Rs 12L" },
    { label: "Rs 12L-Rs 20L", value: "Rs 12L-Rs 20L" },
    { label: "Rs 20L-Rs 30L", value: "Rs 20L-Rs 30L" },
    { label: "Rs 30L+", value: "Rs 30L+" },
    { label: "Not Decided", value: "Not Decided" }
  ],
  true
));
node("timeline_switch", "switch", 6000, -860, switchData("has_timeline"));
node("timeline_input", "input", 6240, -940, inputData(
  "When would you ideally like the interiors completed?",
  "target_timeline",
  [
    { label: "Immediately", value: "Immediately" },
    { label: "Within 1 Month", value: "Within 1 Month" },
    { label: "1-3 Months", value: "1-3 Months" },
    { label: "3-6 Months", value: "3-6 Months" },
    { label: "6+ Months", value: "6+ Months" },
    { label: "Just Exploring", value: "Just Exploring" }
  ],
  true
));
node("reference_upload_choice", "input", 6480, -860, inputData(
  "Do you want to upload a floor plan or reference images now?",
  "upload_reference_assets",
  yesNoButtons(),
  true
));
node("reference_assets_none", "setVariable", 6720, -960, setVars({
  reference_asset_status: "not_uploaded",
  reference_asset_count: 0
}));
node("reference_asset_intake", "document-intake", 6720, -780, {
  messages: ["Upload floor plans, inspiration images, layout PDFs, or current-site photos."],
  acceptedTypesCsv: "pdf,jpg,jpeg,png",
  maxFiles: 8,
  minFiles: 1,
  outputVar: "reference_asset_files"
});
node("reference_asset_processor", "file-processor", 6960, -780, {
  inputFiles: "{{reference_asset_files}}",
  processingMode: "extract_fields",
  acceptedTypesText: "pdf,jpg,jpeg,png",
  maxFileSizeMb: 15,
  expectedDocumentType: "interior_reference_document",
  confidenceThreshold: 0.7,
  strictExtraction: false,
  pageMode: "process_all_pages",
  outputVar: "reference_asset_result"
});
node("reference_asset_success", "script", 7200, -860, scriptData(`
vars.reference_asset_status = "uploaded";
vars.reference_asset_count = Array.isArray(vars.reference_asset_files) ? vars.reference_asset_files.length : 1;
return "success";
`, "reference_asset_success_result"));
node("reference_asset_low_conf_set", "setVariable", 7200, -700, setVars({
  reference_asset_status: "manual_review_required",
  reference_asset_count: 1
}));
node("reference_asset_low_conf_message", "message", 7440, -700, msgData(
  "I received the reference file, but some details may need manual verification during the consultation."
));
node("reference_asset_manual_set", "setVariable", 7200, -620, setVars({
  reference_asset_status: "manual_review_required",
  reference_asset_count: 1
}));
node("reference_asset_manual_message", "message", 7440, -620, msgData(
  "The uploaded file has been saved for manual review by the design team."
));
node("reference_asset_invalid_set", "setVariable", 7200, -540, setVars({
  reference_asset_status: "invalid_file",
  reference_asset_count: 0
}));
node("reference_asset_invalid_message", "message", 7440, -540, msgData(
  "That file format or quality was not suitable, so I will continue without a processed reference file."
));
node("identity_form", "form", 7680, -860, formData(
  "Please share your contact details so I can save the requirement and continue.",
  identityFields,
  "identity_form_result"
));
node("prepare_identity", "script", 7920, -860, scriptData(prepareIdentityScript, "prepare_identity_result"));
node("customer_upsert", "record", 8160, -860, recordData({
  action: "upsert",
  collection: "interior_customers",
  where: { phone_e164: "{{customer_mobile}}" },
  data: {
    customer_id: "{{customer_id}}",
    full_name: "{{customer_name}}",
    phone_e164: "{{customer_mobile}}",
    email: "{{customer_email}}",
    preferred_channel: "{{preferred_contact_channel}}",
    preferred_language: "English",
    latest_lead_id: "{{lead_id}}"
  },
  schema: schemas.customers,
  uniqueKey: "phone_e164",
  idempotencyKey: "{{customer_mobile}}",
  outputVar: "customer_upsert_result",
  piiFields: "phone_e164,email,full_name"
}));
node("property_upsert", "record", 8400, -860, recordData({
  action: "upsert",
  collection: "interior_properties",
  where: { property_id: "{{property_id}}" },
  data: {
    property_id: "{{property_id}}",
    customer_id: "{{customer_id}}",
    property_type: "{{property_type}}",
    property_status: "{{property_status}}",
    configuration: "{{configuration}}",
    area_sqft: "{{area_sqft}}",
    city: "{{city}}",
    locality: "{{locality}}",
    pincode: "{{pincode}}",
    address: "{{address}}",
    possession_timeline: "{{target_timeline}}"
  },
  schema: schemas.properties,
  uniqueKey: "property_id",
  idempotencyKey: "{{property_id}}",
  outputVar: "property_upsert_result"
}));
node("lead_draft_upsert", "record", 8640, -860, recordData({
  action: "upsert",
  collection: "interior_leads",
  where: { lead_id: "{{lead_id}}" },
  data: {
    lead_id: "{{lead_id}}",
    lead_number: "{{lead_number}}",
    customer_id: "{{customer_id}}",
    property_id: "{{property_id}}",
    customer_mobile: "{{customer_mobile}}",
    customer_name: "{{customer_name}}",
    customer_email: "{{customer_email}}",
    source_channel: "{{system.channel}}",
    entry_mode: "{{entry_mode}}",
    stage: "{{lead_stage}}",
    status: "{{lead_status}}",
    qualification: "",
    lead_score: 0,
    property_type: "{{property_type}}",
    configuration: "{{configuration}}",
    city: "{{city}}",
    locality: "{{locality}}",
    design_style: "{{design_style}}",
    budget_band: "{{budget_band}}",
    target_timeline: "{{target_timeline}}",
    scope_summary: "{{scope_summary}}",
    recommended_package_id: "",
    recommended_package_name: "",
    consultation_id: "",
    consultation_status: "",
    assigned_designer_id: "",
    assigned_designer_name: "",
    estimate_low_minor: 0,
    estimate_high_minor: 0,
    last_activity_at: "{{last_activity_at}}"
  },
  schema: schemas.leads,
  uniqueKey: "lead_id",
  idempotencyKey: "{{lead_id}}:draft",
  outputVar: "lead_draft_upsert_result",
  piiFields: "customer_mobile,customer_email,customer_name"
}));
node("price_catalog_list", "record", 8880, -860, recordData({
  action: "list",
  collection: "interior_price_catalog",
  where: { active: true },
  schema: schemas.priceCatalog,
  outputVar: "price_catalog_list_result",
  limit: 50,
  sortBy: "scope_code",
  sortOrder: "asc"
}));
node("estimate_script", "script", 9120, -860, scriptData(estimateScript, "estimate_script_result"));
node("estimate_message", "message", 9360, -860, msgData(
  "Indicative Estimate\\n\\nA realistic preliminary range for the captured scope is {{estimate_range_display}}.\\n\\nComponent View\\n{{estimate_breakdown_text}}\\n\\nThis is indicative only. Final pricing depends on measurements, materials, finishes, and the signed proposal."
));
node("package_catalog_list_live", "record", 9600, -860, recordData({
  action: "list",
  collection: "interior_packages",
  where: { active: true },
  schema: schemas.packages,
  outputVar: "package_catalog_list_live_result",
  limit: 10,
  sortBy: "package_name",
  sortOrder: "asc"
}));
node("package_recommendation_script", "script", 9840, -860, scriptData(packageRecommendationScript, "package_recommendation_script_result"));
node("package_recommendation_message", "message", 10080, -860, msgData("{{lead_summary_text}}"));
node("requirement_record", "record", 10320, -860, recordData({
  action: "upsert",
  collection: "interior_lead_requirements",
  where: { requirement_id: "{{requirement_id}}" },
  data: {
    requirement_id: "{{requirement_id}}",
    lead_id: "{{lead_id}}",
    scope_items_csv: "{{scope_items_csv}}",
    scope_summary: "{{scope_summary}}",
    design_style: "{{design_style}}",
    budget_band: "{{budget_band}}",
    target_timeline: "{{target_timeline}}",
    requirement_summary: "{{requirement_summary}}",
    reference_asset_status: "{{reference_asset_status}}",
    estimate_low_minor: "{{estimate_low_minor}}",
    estimate_high_minor: "{{estimate_high_minor}}"
  },
  schema: schemas.requirements,
  uniqueKey: "requirement_id",
  idempotencyKey: "{{requirement_id}}",
  outputVar: "requirement_record_result"
}));
node("asset_record", "record", 10560, -860, recordData({
  action: "upsert",
  collection: "interior_lead_assets",
  where: { asset_id: "{{asset_id}}" },
  data: {
    asset_id: "{{asset_id}}",
    lead_id: "{{lead_id}}",
    property_id: "{{property_id}}",
    asset_type: "reference_bundle",
    asset_count: "{{reference_asset_count}}",
    processing_status: "{{reference_asset_status}}",
    extraction_summary: "{{reference_asset_status}}"
  },
  schema: schemas.assets,
  uniqueKey: "asset_id",
  idempotencyKey: "{{asset_id}}",
  outputVar: "asset_record_result"
}));
node("consultation_type_input", "input", 10800, -860, inputData(
  "Choose the best next step.",
  "consultation_type",
  [
    { label: "Video Consultation", value: "video_consultation" },
    { label: "Studio Consultation", value: "studio_consultation" },
    { label: "Site Visit", value: "site_visit" },
    { label: "Phone Consultation", value: "phone_consultation" }
  ],
  true
));
node("designer_list", "record", 11040, -860, recordData({
  action: "list",
  collection: "interior_designers",
  where: { active: true },
  schema: schemas.designers,
  outputVar: "designer_list_result",
  limit: 20,
  sortBy: "full_name",
  sortOrder: "asc"
}));
node("consultation_slot_list", "record", 11280, -860, recordData({
  action: "list",
  collection: "interior_consultation_slots",
  where: { status: "available" },
  schema: schemas.consultationSlots,
  outputVar: "consultation_slot_list_result",
  limit: 40,
  sortBy: "slot_date",
  sortOrder: "asc"
}));
node("consultation_prepare_script", "script", 11520, -860, scriptData(consultationPreparationScript, "consultation_prepare_script_result"));
node("consultation_slot_switch", "switch", 11760, -860, switchData("consultation_slot_state"));
node("consultation_unavailable_followup_record", "record", 12000, -940, recordData({
  action: "upsert",
  collection: "interior_followup_jobs",
  where: { followup_id: "{{lead_id}}:slot_callback" },
  data: {
    followup_id: "{{lead_id}}:slot_callback",
    lead_id: "{{lead_id}}",
    consultation_id: "",
    job_type: "slot_callback",
    run_at: "{{last_activity_at}}",
    channel: "whatsapp",
    status: "scheduled"
  },
  schema: schemas.followupJobs,
  uniqueKey: "followup_id",
  idempotencyKey: "{{lead_id}}:slot_callback",
  outputVar: "consultation_unavailable_followup_record_result"
}));
node("consultation_unavailable_message", "message", 12240, -940, msgData(
  "I saved the requirement, but there are no matching consultation slots ready right now. The interiors team will share the next available options using your preferred contact channel."
));
node("consultation_unavailable_end", "end", 12480, -940, { messages: [] });
node("consultation_appointment", "appointment", 12000, -860, appointmentData(
  "Choose a convenient consultation slot.",
  "consultation_slot_options",
  "consultation_booking"
));
node("consultation_selection_script", "script", 12240, -860, scriptData(consultationSelectionScript, "consultation_selection_script_result"));
node("consultation_confirm_input", "input", 12480, -860, inputData(
  "Confirm your consultation.\\n\\nReference: {{lead_number}}\\nPackage: {{recommended_package_name}}\\nConsultation: {{consultation_type}}\\nDesigner: {{assigned_designer_name}}\\nDate: {{selected_slot_date}}\\nTime: {{selected_slot_label}}",
  "confirm_consultation",
  yesNoButtons(),
  true
));
node("consultation_cancelled_message", "message", 12720, -760, msgData(
  "No problem. Your requirement is saved, and the interiors team can still follow up with the latest availability."
));
node("consultation_cancelled_end", "end", 12960, -760, { messages: [] });
node("consultation_record", "record", 12720, -860, recordData({
  action: "upsert",
  collection: "interior_consultations",
  where: { consultation_id: "{{consultation_id}}" },
  data: {
    consultation_id: "{{consultation_id}}",
    consultation_number: "{{consultation_number}}",
    lead_id: "{{lead_id}}",
    customer_id: "{{customer_id}}",
    property_id: "{{property_id}}",
    consultation_type: "{{consultation_type}}",
    slot_id: "{{selected_slot_id}}",
    designer_id: "{{assigned_designer_id}}",
    designer_name: "{{assigned_designer_name}}",
    scheduled_at: "{{scheduled_at}}",
    status: "booked"
  },
  schema: schemas.consultations,
  uniqueKey: "consultation_id",
  idempotencyKey: "{{consultation_id}}",
  outputVar: "consultation_record_result"
}));
node("consultation_slot_booked_record", "record", 12960, -860, recordData({
  action: "upsert",
  collection: "interior_consultation_slots",
  where: { slot_id: "{{selected_slot_id}}" },
  data: {
    slot_id: "{{selected_slot_id}}",
    consultation_type: "{{consultation_type}}",
    location_zone: "",
    designer_id: "{{assigned_designer_id}}",
    designer_name: "{{assigned_designer_name}}",
    slot_date: "{{selected_slot_date}}",
    start_at: "{{selected_slot_start}}",
    end_at: "{{selected_slot_end}}",
    slot_label: "{{selected_slot_label}}",
    status: "booked",
    lead_id: "{{lead_id}}",
    consultation_id: "{{consultation_id}}"
  },
  schema: schemas.consultationSlots,
  uniqueKey: "slot_id",
  idempotencyKey: "{{selected_slot_id}}:booked",
  outputVar: "consultation_slot_booked_record_result"
}));
node("lead_final_update", "record", 13200, -860, recordData({
  action: "upsert",
  collection: "interior_leads",
  where: { lead_id: "{{lead_id}}" },
  data: {
    lead_id: "{{lead_id}}",
    lead_number: "{{lead_number}}",
    customer_id: "{{customer_id}}",
    property_id: "{{property_id}}",
    customer_mobile: "{{customer_mobile}}",
    customer_name: "{{customer_name}}",
    customer_email: "{{customer_email}}",
    source_channel: "{{system.channel}}",
    entry_mode: "{{entry_mode}}",
    stage: "{{lead_stage}}",
    status: "{{lead_status}}",
    qualification: "{{qualification}}",
    lead_score: "{{lead_score}}",
    property_type: "{{property_type}}",
    configuration: "{{configuration}}",
    city: "{{city}}",
    locality: "{{locality}}",
    design_style: "{{design_style}}",
    budget_band: "{{budget_band}}",
    target_timeline: "{{target_timeline}}",
    scope_summary: "{{scope_summary}}",
    recommended_package_id: "{{recommended_package_id}}",
    recommended_package_name: "{{recommended_package_name}}",
    consultation_id: "{{consultation_id}}",
    consultation_status: "booked",
    assigned_designer_id: "{{assigned_designer_id}}",
    assigned_designer_name: "{{assigned_designer_name}}",
    estimate_low_minor: "{{estimate_low_minor}}",
    estimate_high_minor: "{{estimate_high_minor}}",
    last_activity_at: "{{scheduled_at}}"
  },
  schema: schemas.leads,
  uniqueKey: "lead_id",
  idempotencyKey: "{{lead_id}}:final",
  outputVar: "lead_final_update_result",
  piiFields: "customer_mobile,customer_email,customer_name"
}));
node("followup_record_24h", "record", 13440, -860, recordData({
  action: "upsert",
  collection: "interior_followup_jobs",
  where: { followup_id: "{{consultation_id}}:24h" },
  data: {
    followup_id: "{{consultation_id}}:24h",
    lead_id: "{{lead_id}}",
    consultation_id: "{{consultation_id}}",
    job_type: "consultation_reminder_24h",
    run_at: "{{scheduled_at}}",
    channel: "whatsapp",
    status: "scheduled"
  },
  schema: schemas.followupJobs,
  uniqueKey: "followup_id",
  idempotencyKey: "{{consultation_id}}:24h",
  outputVar: "followup_record_24h_result"
}));
node("followup_record_2h", "record", 13680, -860, recordData({
  action: "upsert",
  collection: "interior_followup_jobs",
  where: { followup_id: "{{consultation_id}}:2h" },
  data: {
    followup_id: "{{consultation_id}}:2h",
    lead_id: "{{lead_id}}",
    consultation_id: "{{consultation_id}}",
    job_type: "consultation_reminder_2h",
    run_at: "{{scheduled_at}}",
    channel: "whatsapp",
    status: "scheduled"
  },
  schema: schemas.followupJobs,
  uniqueKey: "followup_id",
  idempotencyKey: "{{consultation_id}}:2h",
  outputVar: "followup_record_2h_result"
}));
node("customer_confirmation_notification", "notification", 13920, -860, notificationData({
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
      templateId: "interior_consultation_confirmed"
    },
    {
      type: "sms",
      enabled: true,
      message:
        "Interior consultation confirmed. Ref {{lead_number}} with {{assigned_designer_name}} on {{selected_slot_date}} at {{selected_slot_label}}."
    },
    {
      type: "email",
      enabled: true,
      subject: "Your interior consultation is confirmed",
      body:
        "Reference: {{lead_number}}\\nProperty: {{configuration}} {{property_type}}\\nLocation: {{locality}}, {{city}}\\nPackage: {{recommended_package_name}}\\nDesigner: {{assigned_designer_name}}\\nDate: {{selected_slot_date}}\\nTime: {{selected_slot_label}}\\nEstimate: {{estimate_range_display}}"
    }
  ],
  outputVar: "customer_confirmation_notification_result",
  dedupeKey: "{{consultation_id}}:customer-confirmation"
}));
node("designer_notification", "notification", 14160, -860, notificationData({
  recipients: [
    {
      type: "designer",
      phone: "{{support_phone}}",
      email: "{{operations_email}}"
    }
  ],
  channels: [
    {
      type: "sms",
      enabled: true,
      message:
        "New qualified interior lead: {{customer_name}}, {{customer_mobile}}, {{configuration}} {{property_type}}, {{locality}}, budget {{budget_band}}, package {{recommended_package_name}}, consultation {{selected_slot_date}} {{selected_slot_label}}, score {{lead_score}}."
    },
    {
      type: "email",
      enabled: true,
      subject: "Qualified interior lead with booked consultation",
      body:
        "Lead {{lead_number}}\\nCustomer: {{customer_name}}\\nMobile: {{customer_mobile}}\\nProperty: {{configuration}} {{property_type}}\\nLocation: {{locality}}, {{city}}\\nScope: {{scope_summary}}\\nStyle: {{design_style}}\\nBudget: {{budget_band}}\\nEstimate: {{estimate_range_display}}\\nPackage: {{recommended_package_name}}\\nConsultation: {{selected_slot_date}} {{selected_slot_label}}\\nAssigned Designer: {{assigned_designer_name}}\\nLead Score: {{lead_score}}"
    }
  ],
  outputVar: "designer_notification_result",
  dedupeKey: "{{consultation_id}}:designer-notification"
}));
node("reminder_scheduler_24h", "scheduler", 14400, -860, schedulerData({
  runAt: "{{scheduled_at}}",
  offsetValue: 24,
  offsetUnit: "hours",
  offsetDirection: "before",
  payload: {
    type: "interior_consultation_reminder_24h",
    lead_id: "{{lead_id}}",
    consultation_id: "{{consultation_id}}"
  },
  outputVar: "reminder_scheduler_24h_result",
  dedupeKey: "{{consultation_id}}:scheduler:24h"
}));
node("reminder_scheduler_2h", "scheduler", 14640, -860, schedulerData({
  runAt: "{{scheduled_at}}",
  offsetValue: 2,
  offsetUnit: "hours",
  offsetDirection: "before",
  payload: {
    type: "interior_consultation_reminder_2h",
    lead_id: "{{lead_id}}",
    consultation_id: "{{consultation_id}}"
  },
  outputVar: "reminder_scheduler_2h_result",
  dedupeKey: "{{consultation_id}}:scheduler:2h"
}));
node("final_confirmation_message", "message", 14880, -860, msgData(
  "Your interior consultation is confirmed.\\n\\nReference: {{lead_number}}\\nProperty: {{configuration}} {{property_type}}\\nLocation: {{locality}}, {{city}}\\nPackage: {{recommended_package_name}}\\nDesigner: {{assigned_designer_name}}\\nDate: {{selected_slot_date}}\\nTime: {{selected_slot_label}}\\nIndicative Estimate: {{estimate_range_display}}\\n\\nThe design team now has your captured requirement, style, budget, and reference-file status."
));
node("final_end", "end", 15120, -860, { messages: [] });

node("system_failure_message", "message", 11880, 1100, msgData(
  "I could not complete that step because the operational data or persistence layer did not respond cleanly. I am forwarding the context so the enquiry does not stall."
));
node("system_failure_handover", "handover", 12120, 1100, {
  channel: "human",
  messages: ["Connecting this enquiry to interior operations."]
});

edge("start_1", "set_defaults", { label: "next" });
edge("set_defaults", "welcome_message", { label: "next" });
edge("welcome_message", "main_menu_input", { label: "next" });
edgeValue("main_menu_input", "design_home", "set_mode_design", "design_home");
edgeValue("main_menu_input", "get_estimate", "set_mode_estimate", "get_estimate");
edgeValue("main_menu_input", "explore_packages", "package_catalog_list_menu", "explore_packages");
edgeValue("main_menu_input", "view_portfolio", "portfolio_query_input", "view_portfolio");
edgeValue("main_menu_input", "materials", "materials_question_input", "materials");
edgeValue("main_menu_input", "book_consultation", "set_mode_consultation", "book_consultation");
edgeValue("main_menu_input", "quote_status", "set_post_auth_quote", "quote_status");
edgeValue("main_menu_input", "project_status", "set_post_auth_project", "project_status");
edgeValue("main_menu_input", "payments_service", "set_post_auth_payment", "payments_service");
edgeValue("main_menu_input", "talk_designer", "advisor_handover_form", "talk_designer");
edge("main_menu_input", "parse_main_intent", { isDefault: true, label: "free_text/default" });

edge("set_mode_design", "requirement_input", { label: "next" });
edge("set_mode_estimate", "requirement_input", { label: "next" });
edge("set_mode_consultation", "requirement_input", { label: "next" });
edge("set_post_auth_quote", "status_mobile_form", { label: "next" });
edge("set_post_auth_project", "status_mobile_form", { label: "next" });
edge("set_post_auth_payment", "status_mobile_form", { label: "next" });
edge("set_post_auth_service", "status_mobile_form", { label: "next" });

scriptRoutes("parse_main_intent", "main_intent_switch", "system_failure_message");
edgeValue("main_intent_switch", "hero_direct", "parse_requirement", "hero_direct");
edgeValue("main_intent_switch", "packages", "package_catalog_list_menu", "packages");
edgeValue("main_intent_switch", "portfolio", "portfolio_parse_requirement", "portfolio");
edgeValue("main_intent_switch", "materials", "material_list", "materials");
edgeValue("main_intent_switch", "quote_status", "set_post_auth_quote", "quote_status");
edgeValue("main_intent_switch", "project_status", "set_post_auth_project", "project_status");
edgeValue("main_intent_switch", "payments", "set_post_auth_payment", "payments");
edgeValue("main_intent_switch", "service_warranty", "set_post_auth_service", "service_warranty");
edgeValue("main_intent_switch", "talk_designer", "advisor_handover_form", "talk_designer");
edge("main_intent_switch", "parse_requirement", { isDefault: true, label: "hero_direct/default" });

recordRoutes("package_catalog_list_menu", "package_catalog_script_menu", "system_failure_message");
scriptRoutes("package_catalog_script_menu", "package_catalog_message", "system_failure_message");
edge("package_catalog_message", "package_catalog_next_input", { label: "next" });
edgeValue("package_catalog_next_input", "get_estimate", "set_mode_estimate", "get_estimate");
edge("package_catalog_next_input", "set_mode_consultation", { isDefault: true, label: "book_consultation/default" });

edge("portfolio_query_input", "portfolio_query_to_requirement", { label: "next" });
edge("portfolio_query_to_requirement", "portfolio_parse_requirement", { label: "next" });
scriptRoutes("portfolio_parse_requirement", "portfolio_list", "system_failure_message");
recordRoutes("portfolio_list", "portfolio_match_script", "system_failure_message");
scriptRoutes("portfolio_match_script", "portfolio_route_switch", "system_failure_message");
edgeValue("portfolio_route_switch", "matched", "portfolio_carousel", "matched");
edge("portfolio_route_switch", "portfolio_no_match_message", { isDefault: true, label: "not_found/default" });
edge("portfolio_carousel", "portfolio_next_input", { label: "next" });
edge("portfolio_no_match_message", "portfolio_next_input", { label: "next" });
edgeValue("portfolio_next_input", "get_estimate", "set_mode_estimate_from_portfolio", "get_estimate");
edge("portfolio_next_input", "set_mode_consultation_from_portfolio", { isDefault: true, label: "book_consultation/default" });
edge("set_mode_estimate_from_portfolio", "parse_requirement", { label: "next" });
edge("set_mode_consultation_from_portfolio", "parse_requirement", { label: "next" });

edge("materials_question_input", "material_list", { label: "next" });
recordRoutes("material_list", "material_answer_script", "system_failure_message");
scriptRoutes("material_answer_script", "material_answer_message", "system_failure_message");
edge("material_answer_message", "material_answer_end", { label: "next" });

edge("advisor_handover_form", "advisor_handover", { label: "next" });

edge("status_mobile_form", "status_otp_input", { label: "next" });
edge("status_otp_input", "status_otp_validate", { label: "next" });
scriptRoutes("status_otp_validate", "status_otp_route", "system_failure_message");
edgeValue("status_otp_route", "valid", "normalize_status_mobile", "valid");
edge("status_otp_route", "status_otp_invalid_message_1", { isDefault: true, label: "retry/default" });
edge("status_otp_invalid_message_1", "status_otp_input_2", { label: "next" });
edge("status_otp_input_2", "status_otp_validate_2", { label: "next" });
scriptRoutes("status_otp_validate_2", "status_otp_route_2", "system_failure_message");
edgeValue("status_otp_route_2", "valid", "normalize_status_mobile", "valid");
edge("status_otp_route_2", "status_otp_invalid_message_2", { isDefault: true, label: "retry/default" });
edge("status_otp_invalid_message_2", "status_otp_input_3", { label: "next" });
edge("status_otp_input_3", "status_otp_validate_3", { label: "next" });
scriptRoutes("status_otp_validate_3", "status_otp_route_3", "system_failure_message");
edgeValue("status_otp_route_3", "valid", "normalize_status_mobile", "valid");
edge("status_otp_route_3", "status_otp_failed_message", { isDefault: true, label: "max_exceeded/default" });
edge("status_otp_failed_message", "status_otp_failed_end", { label: "next" });
scriptRoutes("normalize_status_mobile", "post_auth_route_switch", "system_failure_message");
edgeValue("post_auth_route_switch", "quote_status", "quote_list", "quote_status");
edgeValue("post_auth_route_switch", "project_status", "project_list", "project_status");
edgeValue("post_auth_route_switch", "payments", "payment_list", "payments");
edgeValue("post_auth_route_switch", "service_warranty", "service_choice_input", "service_warranty");
edge("post_auth_route_switch", "payment_list", { isDefault: true, label: "payments/default" });

recordRoutes("quote_list", "quote_summary_script", "system_failure_message");
scriptRoutes("quote_summary_script", "quote_route_switch", "system_failure_message");
edgeValue("quote_route_switch", "found", "quote_message", "found");
edge("quote_route_switch", "quote_not_found_message", { isDefault: true, label: "not_found/default" });
edge("quote_message", "quote_end", { label: "next" });
edge("quote_not_found_message", "quote_not_found_end", { label: "next" });

recordRoutes("project_list", "project_milestone_list", "system_failure_message");
recordRoutes("project_milestone_list", "project_summary_script", "system_failure_message");
scriptRoutes("project_summary_script", "project_route_switch", "system_failure_message");
edgeValue("project_route_switch", "found", "project_message", "found");
edge("project_route_switch", "project_not_found_message", { isDefault: true, label: "not_found/default" });
edge("project_message", "project_end", { label: "next" });
edge("project_not_found_message", "project_not_found_end", { label: "next" });

recordRoutes("payment_list", "payment_summary_script", "system_failure_message");
scriptRoutes("payment_summary_script", "payment_route_switch", "system_failure_message");
edgeValue("payment_route_switch", "found", "payment_message", "found");
edge("payment_route_switch", "payment_not_found_message", { isDefault: true, label: "not_found/default" });
edge("payment_message", "payment_end", { label: "next" });
edge("payment_not_found_message", "payment_not_found_end", { label: "next" });

edgeValue("service_choice_input", "view_open_requests", "service_ticket_list", "view_open_requests");
edge("service_choice_input", "service_issue_form", { isDefault: true, label: "raise_new_issue/default" });
recordRoutes("service_ticket_list", "service_summary_script", "system_failure_message");
scriptRoutes("service_summary_script", "service_route_switch", "system_failure_message");
edgeValue("service_route_switch", "found", "service_message", "found");
edge("service_route_switch", "service_not_found_message", { isDefault: true, label: "not_found/default" });
edge("service_message", "service_end", { label: "next" });
edge("service_not_found_message", "service_not_found_end", { label: "next" });
edge("service_issue_form", "service_ticket_script", { label: "next" });
scriptRoutes("service_ticket_script", "service_ticket_record", "system_failure_message");
recordRoutes("service_ticket_record", "service_ticket_message", "system_failure_message");
edge("service_ticket_message", "service_ticket_end", { label: "next" });

edge("requirement_input", "parse_requirement", { label: "next" });
scriptRoutes("parse_requirement", "refresh_requirement_state", "system_failure_message");
scriptRoutes("refresh_requirement_state", "property_type_switch", "system_failure_message");
edgeValue("property_type_switch", "yes", "property_status_switch", "yes");
edge("property_type_switch", "property_type_input", { isDefault: true, label: "no/default" });
edge("property_type_input", "refresh_after_property_type", { label: "next" });
scriptRoutes("refresh_after_property_type", "property_status_switch", "system_failure_message");
edgeValue("property_status_switch", "yes", "configuration_switch", "yes");
edge("property_status_switch", "property_status_input", { isDefault: true, label: "no/default" });
edge("property_status_input", "refresh_after_property_status", { label: "next" });
scriptRoutes("refresh_after_property_status", "configuration_switch", "system_failure_message");
edgeValue("configuration_switch", "yes", "area_switch", "yes");
edge("configuration_switch", "configuration_input", { isDefault: true, label: "no/default" });
edge("configuration_input", "refresh_after_configuration", { label: "next" });
scriptRoutes("refresh_after_configuration", "area_switch", "system_failure_message");
edgeValue("area_switch", "yes", "location_switch", "yes");
edge("area_switch", "area_form", { isDefault: true, label: "no/default" });
edge("area_form", "refresh_after_area", { label: "next" });
scriptRoutes("refresh_after_area", "location_switch", "system_failure_message");
edgeValue("location_switch", "yes", "scope_switch", "yes");
edge("location_switch", "location_form", { isDefault: true, label: "no/default" });
edge("location_form", "refresh_after_location", { label: "next" });
scriptRoutes("refresh_after_location", "scope_switch", "system_failure_message");
edgeValue("scope_switch", "yes", "style_switch", "yes");
edge("scope_switch", "scope_form", { isDefault: true, label: "no/default" });
edge("scope_form", "refresh_after_scope", { label: "next" });
scriptRoutes("refresh_after_scope", "style_switch", "system_failure_message");
edgeValue("style_switch", "yes", "budget_switch", "yes");
edge("style_switch", "style_input", { isDefault: true, label: "no/default" });
edge("style_input", "refresh_after_style", { label: "next" });
scriptRoutes("refresh_after_style", "budget_switch", "system_failure_message");
edgeValue("budget_switch", "yes", "timeline_switch", "yes");
edge("budget_switch", "budget_input", { isDefault: true, label: "no/default" });
edge("budget_input", "refresh_after_budget", { label: "next" });
scriptRoutes("refresh_after_budget", "timeline_switch", "system_failure_message");
edgeValue("timeline_switch", "yes", "reference_upload_choice", "yes");
edge("timeline_switch", "timeline_input", { isDefault: true, label: "no/default" });
edge("timeline_input", "refresh_after_timeline", { label: "next" });
scriptRoutes("refresh_after_timeline", "reference_upload_choice", "system_failure_message");
edgeValue("reference_upload_choice", "yes", "reference_asset_intake", "yes");
edge("reference_upload_choice", "reference_assets_none", { isDefault: true, label: "no/default" });
edge("reference_assets_none", "identity_form", { label: "next" });
edge("reference_asset_intake", "reference_asset_processor", { label: "next" });
edgeValue("reference_asset_processor", "success", "reference_asset_success", "success");
edgeValue("reference_asset_processor", "partial", "reference_asset_success", "partial");
edgeValue("reference_asset_processor", "low_confidence", "reference_asset_low_conf_set", "low_confidence");
edgeValue("reference_asset_processor", "manual_review_required", "reference_asset_manual_set", "manual_review_required");
edgeValue("reference_asset_processor", "invalid_file", "reference_asset_invalid_set", "invalid_file");
edgeValue("reference_asset_processor", "failed", "system_failure_message", "failed");
edge("reference_asset_processor", "reference_asset_invalid_set", { isDefault: true, label: "default" });
scriptRoutes("reference_asset_success", "identity_form", "system_failure_message");
edge("reference_asset_low_conf_set", "reference_asset_low_conf_message", { label: "next" });
edge("reference_asset_low_conf_message", "identity_form", { label: "next" });
edge("reference_asset_manual_set", "reference_asset_manual_message", { label: "next" });
edge("reference_asset_manual_message", "identity_form", { label: "next" });
edge("reference_asset_invalid_set", "reference_asset_invalid_message", { label: "next" });
edge("reference_asset_invalid_message", "identity_form", { label: "next" });
edge("identity_form", "prepare_identity", { label: "next" });
scriptRoutes("prepare_identity", "customer_upsert", "system_failure_message");
recordRoutes("customer_upsert", "property_upsert", "system_failure_message");
recordRoutes("property_upsert", "lead_draft_upsert", "system_failure_message");
recordRoutes("lead_draft_upsert", "price_catalog_list", "system_failure_message");
recordRoutes("price_catalog_list", "estimate_script", "system_failure_message");
scriptRoutes("estimate_script", "estimate_message", "system_failure_message");
edge("estimate_message", "package_catalog_list_live", { label: "next" });
recordRoutes("package_catalog_list_live", "package_recommendation_script", "system_failure_message");
scriptRoutes("package_recommendation_script", "package_recommendation_message", "system_failure_message");
edge("package_recommendation_message", "requirement_record", { label: "next" });
recordRoutes("requirement_record", "asset_record", "system_failure_message");
recordRoutes("asset_record", "consultation_type_input", "system_failure_message");
edge("consultation_type_input", "designer_list", { label: "next" });
recordRoutes("designer_list", "consultation_slot_list", "system_failure_message");
recordRoutes("consultation_slot_list", "consultation_prepare_script", "system_failure_message");
scriptRoutes("consultation_prepare_script", "consultation_slot_switch", "system_failure_message");
edgeValue("consultation_slot_switch", "available", "consultation_appointment", "available");
edge("consultation_slot_switch", "consultation_unavailable_followup_record", { isDefault: true, label: "unavailable/default" });
recordRoutes("consultation_unavailable_followup_record", "consultation_unavailable_message", "system_failure_message");
edge("consultation_unavailable_message", "consultation_unavailable_end", { label: "next" });
edge("consultation_appointment", "consultation_selection_script", { label: "selected" });
scriptRoutes("consultation_selection_script", "consultation_confirm_input", "system_failure_message");
edgeValue("consultation_confirm_input", "yes", "consultation_record", "yes");
edge("consultation_confirm_input", "consultation_cancelled_message", { isDefault: true, label: "no/default" });
edge("consultation_cancelled_message", "consultation_cancelled_end", { label: "next" });
recordRoutes("consultation_record", "consultation_slot_booked_record", "system_failure_message");
recordRoutes("consultation_slot_booked_record", "lead_final_update", "system_failure_message");
recordRoutes("lead_final_update", "followup_record_24h", "system_failure_message");
recordRoutes("followup_record_24h", "followup_record_2h", "system_failure_message");
recordRoutes("followup_record_2h", "customer_confirmation_notification", "system_failure_message");
notificationRoutes("customer_confirmation_notification", "designer_notification");
notificationRoutes("designer_notification", "reminder_scheduler_24h");
schedulerRoutes("reminder_scheduler_24h", "reminder_scheduler_2h");
schedulerRoutes("reminder_scheduler_2h", "final_confirmation_message");
edge("final_confirmation_message", "final_end", { label: "next" });

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
