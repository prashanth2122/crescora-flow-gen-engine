import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { notificationData } from "./notification-data.mjs";

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const domainRoot = join(rootDir, "domains", "retail-ecommerce");
const sourcePath = join(
  domainRoot,
  "templates-source",
  "retail-ecommerce-killer-automation.source.flow.json"
);
const builtPath = join(
  domainRoot,
  "templates",
  "retail-ecommerce-killer-automation.flow.json"
);
const stablePath = join(
  domainRoot,
  "templates-stable",
  "retail-ecommerce-killer-automation.flow.json"
);

const exportDoc = {
  version: "1.0",
  exportedAt: "2026-08-25T00:00:00.000Z",
  bot: {
    name: "Retail / E-commerce Killer Automation",
    description:
      "Automation-first retail and D2C workflow covering one main intent router, natural-language product discovery, cart and checkout assistance, order status, changes, cancellations, returns, exchanges, refunds, delivery issues, policies, and structured support handover.",
    headerTitle: "Retail / E-commerce Killer Automation",
    headerTagline: "From product discovery to returns and refunds",
    globalVariables: [
      { key: "store_name", value: "Crescora Commerce" },
      { key: "brand_name", value: "Crescora.ai" },
      { key: "default_currency", value: "INR" },
      { key: "default_timezone", value: "Asia/Kolkata" },
      { key: "support_phone", value: "+91-90000-81000" },
      { key: "support_email", value: "support@example.store" },
      { key: "order_support_phone", value: "+91-90000-82000" },
      { key: "returns_support_phone", value: "+91-90000-83000" },
      { key: "payments_support_phone", value: "+91-90000-84000" },
      { key: "shipping_support_phone", value: "+91-90000-85000" },
      { key: "payment_provider", value: "razorpay" },
      { key: "checkout_link", value: "https://shop.example.com/checkout" }
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
const DOMAIN_RECORD_SCHEMA = "retail";

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
  if (options.label) item.label = options.label;
  if (options.condition) item.condition = options.condition;
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

function inputData(message, variable, buttons = [], disableChatInput = false) {
  return {
    messages: [message],
    variable,
    buttons,
    disableChatInput
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

function setVars(assignments) {
  return {
    assignments: Object.entries(assignments).map(([key, value]) => ({
      key,
      value
    }))
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
  sortOrder = "desc"
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
      "Complete the secure checkout payment. I will continue only after the payment result is confirmed."
    ],
    amount,
    currency: "{{default_currency}}",
    provider: "{{payment_provider}}",
    autoVerify: true,
    paymentLink: "{{checkout_link}}",
    description,
    customerName: "{{customer_name}}",
    customerEmail: "{{customer_email}}",
    customerContact: "{{customer_mobile}}",
    notifySms: true,
    notifyEmail: true,
    expireMinutes: 15,
    callbackUrl: "",
    notesJson: pretty({
      cart_id: "{{cart_id}}",
      reservation_id: "{{reservation_id}}",
      checkout_mode: "{{checkout_mode}}"
    }),
    outputVar
  };
}

function queueData(queueName, priority, skillsRequiredCsv, slaFirstResponseMinutes, outputVar) {
  return {
    queueName,
    assignmentStrategy: "skill_based",
    priority,
    skillsRequiredCsv,
    skillsRequired: skillsRequiredCsv.split(",").filter(Boolean),
    slaFirstResponseMinutes,
    dedupeKey: `{{system.sessionId}}:${queueName}:{{support_case_id}}`,
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

const schemas = {
  customers: {
    collection: "retail_customers",
    fields: {
      customer_id: { type: "string", required: true, unique: true },
      customer_name: { type: "string", required: false },
      customer_mobile: { type: "phone", required: true, unique: true },
      customer_email: { type: "email", required: false },
      loyalty_tier: { type: "string", required: false },
      preferred_language: { type: "string", required: false },
      city: { type: "string", required: false },
      state: { type: "string", required: false }
    }
  },
  catalog: {
    collection: "retail_catalog_items",
    fields: {
      catalog_item_id: { type: "string", required: true, unique: true },
      product_id: { type: "string", required: true },
      variant_id: { type: "string", required: true, unique: true },
      sku: { type: "string", required: true, unique: true },
      product_name: { type: "string", required: true },
      variant_name: { type: "string", required: false },
      category: { type: "string", required: true },
      subcategory: { type: "string", required: false },
      product_type: { type: "string", required: false },
      use_case: { type: "string", required: false },
      brand: { type: "string", required: false },
      colour: { type: "string", required: false },
      size: { type: "string", required: false },
      gender: { type: "string", required: false },
      material: { type: "string", required: false },
      feature_summary: { type: "string", required: false },
      price_minor: { type: "number", required: true },
      compare_price_minor: { type: "number", required: false },
      rating_avg: { type: "number", required: false },
      rating_count: { type: "number", required: false },
      available_qty: { type: "number", required: true },
      available_for_sale: { type: "boolean", required: true },
      estimated_delivery_date: { type: "string", required: false },
      return_window_days: { type: "number", required: false },
      warranty_months: { type: "number", required: false },
      active: { type: "boolean", required: true }
    }
  },
  carts: {
    collection: "retail_carts",
    fields: {
      cart_id: { type: "string", required: true, unique: true },
      customer_id: { type: "string", required: false },
      customer_mobile: { type: "phone", required: false },
      status: { type: "string", required: true },
      subtotal_minor: { type: "number", required: true },
      discount_total_minor: { type: "number", required: false },
      shipping_total_minor: { type: "number", required: false },
      grand_total_minor: { type: "number", required: true },
      item_count: { type: "number", required: true },
      converted_order_id: { type: "string", required: false },
      updated_at: { type: "string", required: false }
    }
  },
  cartItems: {
    collection: "retail_cart_items",
    fields: {
      cart_item_id: { type: "string", required: true, unique: true },
      cart_id: { type: "string", required: true },
      product_id: { type: "string", required: true },
      variant_id: { type: "string", required: true },
      sku: { type: "string", required: true },
      product_name: { type: "string", required: true },
      variant_name: { type: "string", required: false },
      quantity: { type: "number", required: true },
      unit_price_minor: { type: "number", required: true },
      line_total_minor: { type: "number", required: true }
    }
  },
  reservations: {
    collection: "retail_inventory_reservations",
    fields: {
      reservation_id: { type: "string", required: true, unique: true },
      reservation_key: { type: "string", required: true, unique: true },
      cart_id: { type: "string", required: true },
      variant_id: { type: "string", required: true },
      sku: { type: "string", required: true },
      quantity: { type: "number", required: true },
      status: { type: "string", required: true },
      expires_at: { type: "string", required: true }
    }
  },
  orders: {
    collection: "retail_orders",
    fields: {
      order_id: { type: "string", required: true, unique: true },
      order_number: { type: "string", required: true, unique: true },
      customer_id: { type: "string", required: false },
      customer_mobile: { type: "phone", required: true },
      customer_name: { type: "string", required: false },
      status: { type: "string", required: true },
      payment_status: { type: "string", required: true },
      fulfillment_status: { type: "string", required: true },
      grand_total_minor: { type: "number", required: true },
      primary_item_name: { type: "string", required: false },
      invoice_url: { type: "url", required: false },
      delivery_address_summary: { type: "string", required: false },
      order_date: { type: "string", required: true },
      delivered_at: { type: "string", required: false }
    }
  },
  orderItems: {
    collection: "retail_order_items",
    fields: {
      order_item_id: { type: "string", required: true, unique: true },
      order_id: { type: "string", required: true },
      order_number: { type: "string", required: true },
      product_id: { type: "string", required: true },
      variant_id: { type: "string", required: true },
      sku: { type: "string", required: true },
      product_name: { type: "string", required: true },
      variant_name: { type: "string", required: false },
      quantity: { type: "number", required: true },
      unit_price_minor: { type: "number", required: true },
      return_window_end: { type: "string", required: false },
      warranty_end: { type: "string", required: false }
    }
  },
  shipments: {
    collection: "retail_shipments",
    fields: {
      shipment_id: { type: "string", required: true, unique: true },
      order_id: { type: "string", required: true },
      order_number: { type: "string", required: true },
      carrier: { type: "string", required: true },
      tracking_number: { type: "string", required: true },
      status: { type: "string", required: true },
      latest_event: { type: "string", required: false },
      latest_event_at: { type: "string", required: false },
      estimated_delivery_at: { type: "string", required: false }
    }
  },
  returns: {
    collection: "retail_returns",
    fields: {
      return_id: { type: "string", required: true, unique: true },
      return_number: { type: "string", required: true, unique: true },
      order_id: { type: "string", required: true },
      order_number: { type: "string", required: true },
      order_item_id: { type: "string", required: true },
      reason_code: { type: "string", required: true },
      resolution_type: { type: "string", required: true },
      status: { type: "string", required: true },
      requested_at: { type: "string", required: true }
    }
  },
  refunds: {
    collection: "retail_refunds",
    fields: {
      refund_id: { type: "string", required: true, unique: true },
      refund_number: { type: "string", required: true, unique: true },
      order_id: { type: "string", required: true },
      order_number: { type: "string", required: true },
      provider_reference: { type: "string", required: false },
      amount_minor: { type: "number", required: true },
      status: { type: "string", required: true },
      processed_at: { type: "string", required: false },
      expected_credit_window: { type: "string", required: false }
    }
  },
  supportCases: {
    collection: "retail_support_cases",
    fields: {
      support_case_id: { type: "string", required: true, unique: true },
      case_number: { type: "string", required: true, unique: true },
      customer_mobile: { type: "phone", required: false },
      order_number: { type: "string", required: false },
      issue_type: { type: "string", required: true },
      priority: { type: "string", required: true },
      status: { type: "string", required: true },
      summary: { type: "string", required: true },
      queue_name: { type: "string", required: false }
    }
  },
  stockSubscriptions: {
    collection: "retail_stock_subscriptions",
    fields: {
      subscription_id: { type: "string", required: true, unique: true },
      customer_mobile: { type: "phone", required: false },
      product_id: { type: "string", required: true },
      variant_id: { type: "string", required: true },
      sku: { type: "string", required: true },
      channel: { type: "string", required: true },
      status: { type: "string", required: true }
    }
  },
  policyRules: {
    collection: "retail_policy_rules",
    fields: {
      policy_rule_id: { type: "string", required: true, unique: true },
      policy_type: { type: "string", required: true },
      title: { type: "string", required: true },
      summary: { type: "string", required: true },
      status: { type: "string", required: true }
    }
  }
};

const quickActions = [
  { label: "🔍 Find Products", value: "find_products" },
  { label: "🛒 My Cart", value: "my_cart" },
  { label: "🚚 Track Order", value: "track_order" },
  { label: "↩️ Return / Exchange", value: "return_exchange" },
  { label: "💸 Refund Status", value: "refund_status" },
  { label: "📚 Help & Policies", value: "help_policies" },
  { label: "👨‍💼 Support", value: "support" }
];

const catalogSlideTemplate = {
  title: "{{item.product_name}}",
  subtitle: "{{item.variant_name}}",
  description:
    "Price: {{item.price_display}}\nRating: {{item.rating_display}}\nStock: {{item.stock_status}}\nHighlights: {{item.feature_summary}}",
  imageUrl: "",
  buttons: [
    { label: "Pick This", value: "{{item.selection_value}}" },
    { label: "Compare", value: "compare" },
    { label: "Notify Me", value: "notify_me" }
  ]
};

const arrayReaderBlock = `
function getRows(raw) {
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.records)) return raw.records;
  if (Array.isArray(raw?.data)) return raw.data;
  if (Array.isArray(raw?.items)) return raw.items;
  return [];
}
`;

const detectLanguageScript = `
const raw = String(vars.customer_message || "").trim();
vars.detected_language = /[\\u0900-\\u097F]/.test(raw) ? "hi" : "en";
vars.customer_message = raw;
vars.customer_mobile =
  vars.customer_mobile ||
  (raw.match(/(?:\\+91)?[\\s-]?(\\d{10})/)?.[1]
    ? "+91" + raw.match(/(?:\\+91)?[\\s-]?(\\d{10})/)?.[1]
    : "");
return "success";
`;

const extractRequestScript = `
const raw = String(vars.customer_message || "").toLowerCase();
const message = String(vars.customer_message || "");
vars.retail_intent = "find_products";
vars.journey_mode = "discover";
vars.category = "";
vars.subcategory = "";
vars.product_type = "";
vars.use_case = "";
vars.search_term = message;
vars.budget_min = 0;
vars.budget_max = 0;
vars.colour_preference = "";
vars.size_preference = "";
vars.selected_quantity = Number(vars.selected_quantity || 1);
vars.delivery_pincode = raw.match(/\\b(\\d{6})\\b/)?.[1] || vars.delivery_pincode || "";
vars.order_lookup_hint = message.match(/CR[- ]?\\d{4,8}/i)?.[0]?.replace(" ", "-") || "";
vars.customer_name = vars.customer_name || "";
vars.customer_email = vars.customer_email || "";
vars.issue_reason = "";

const underMatch = raw.match(/under\\s*(?:₹|rs\\.?|inr)?\\s*(\\d+(?:,\\d{3})*)(k)?/i);
const aroundMatch = raw.match(/(?:budget|around|approx(?:imately)?)\\s*(?:₹|rs\\.?|inr)?\\s*(\\d+(?:,\\d{3})*)(k)?/i);
const rangeMatch = raw.match(/(?:₹|rs\\.?|inr)?\\s*(\\d+(?:,\\d{3})*)(k)?\\s*(?:to|-|–)\\s*(?:₹|rs\\.?|inr)?\\s*(\\d+(?:,\\d{3})*)(k)?/i);
function parseMoney(numberText, hasK) {
  if (!numberText) return 0;
  const base = Number(String(numberText).replace(/,/g, ""));
  if (!Number.isFinite(base)) return 0;
  return hasK ? base * 1000 : base;
}
if (rangeMatch) {
  vars.budget_min = parseMoney(rangeMatch[1], Boolean(rangeMatch[2]));
  vars.budget_max = parseMoney(rangeMatch[3], Boolean(rangeMatch[4]));
} else if (underMatch) {
  vars.budget_max = parseMoney(underMatch[1], Boolean(underMatch[2]));
} else if (aroundMatch) {
  vars.budget_max = parseMoney(aroundMatch[1], Boolean(aroundMatch[2]));
}

if (/running|shoe|sneaker/.test(raw)) {
  vars.category = "shoes";
  vars.product_type = "running_shoes";
  vars.use_case = raw.includes("trail") ? "trail" : "daily_running";
}
if (/headphone|earbud|audio/.test(raw)) {
  vars.category = "audio";
  vars.product_type = "headphones";
  vars.use_case = raw.includes("travel") ? "travel" : raw.includes("office") ? "office_calls" : "music";
}
if (/shirt|formal shirt|office shirt/.test(raw)) {
  vars.category = "apparel";
  vars.product_type = "shirt";
  vars.use_case = raw.includes("office") ? "office" : "casual";
}
if (/black/.test(raw)) vars.colour_preference = "black";
if (/blue/.test(raw)) vars.colour_preference = "blue";
const ukMatch = raw.match(/uk\\s*(\\d{1,2})/i);
if (ukMatch) vars.size_preference = "UK " + ukMatch[1];
const sizeMatch = raw.match(/size\\s*([a-z0-9]+)/i);
if (!vars.size_preference && sizeMatch) vars.size_preference = sizeMatch[1].toUpperCase();

if (/recommend|suggest|best/.test(raw)) {
  vars.retail_intent = "product_recommendation";
  vars.journey_mode = "recommend";
}
if (/compare/.test(raw)) {
  vars.retail_intent = "compare_products";
  vars.journey_mode = "compare";
}
if (/stock|available|availability|size uk|black in size/.test(raw)) {
  vars.retail_intent = "check_stock";
  vars.journey_mode = "stock";
}
if (/price|offer|discount|coupon/.test(raw)) {
  vars.retail_intent = "price_offers";
  vars.journey_mode = "price";
}
if (/cart/.test(raw)) vars.retail_intent = "cart_assistance";
if (/checkout|payment|pay now|buy now/.test(raw)) vars.retail_intent = "checkout_payment";
if (/track|where is order|order status|out for delivery|shipment/.test(raw)) vars.retail_intent = "track_order";
if (/change order|change address|modify order/.test(raw)) vars.retail_intent = "change_order";
if (/cancel order|cancel my order/.test(raw)) vars.retail_intent = "cancel_order";
if (/return/.test(raw)) vars.retail_intent = "return_product";
if (/exchange|replace size|replacement/.test(raw)) vars.retail_intent = "exchange_product";
if (/refund/.test(raw)) vars.retail_intent = "refund_status";
if (/delivered but not received|delivery issue|attempt failed|stuck/.test(raw)) {
  vars.retail_intent = "delivery_problem";
  vars.issue_reason = "delivery_issue";
}
if (/damaged|wrong item|missing item|not working|broken/.test(raw)) {
  vars.retail_intent = "damaged_or_wrong_item";
  vars.issue_reason = raw.includes("wrong") ? "wrong_item" : raw.includes("missing") ? "missing_item" : "damaged";
}
if (/invoice|gst bill|billing/.test(raw)) vars.retail_intent = "invoice_billing";
if (/warranty|support for product|stopped working/.test(raw)) vars.retail_intent = "warranty_support";
if (/policy|policies|shipping charges|cod|privacy/.test(raw)) vars.retail_intent = "policies_faq";
if (/back in stock|notify me/.test(raw)) {
  vars.retail_intent = "back_in_stock";
  vars.journey_mode = "back_in_stock";
}
if (/agent|support|human|executive|help me/.test(raw)) vars.retail_intent = "talk_to_support";

if (String(vars.customer_message || "").trim() === "") {
  vars.retail_intent = "find_products";
  vars.journey_mode = "discover";
}

return "success";
`;

const rankProductsScript = `
${arrayReaderBlock}
const rows = getRows(vars.catalog_results);
const category = String(vars.category || "").toLowerCase();
const searchTerm = String(vars.search_term || "").toLowerCase();
const budgetMax = Number(vars.budget_max || 0);
const budgetMin = Number(vars.budget_min || 0);
const colour = String(vars.colour_preference || "").toLowerCase();
const size = String(vars.size_preference || "").toLowerCase();

function matches(record) {
  const haystack = [
    record.product_name,
    record.variant_name,
    record.category,
    record.subcategory,
    record.product_type,
    record.use_case,
    record.brand,
    record.feature_summary
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (category && !String(record.category || "").toLowerCase().includes(category) && !haystack.includes(category)) {
    return false;
  }
  if (searchTerm && !haystack.includes(searchTerm) && !searchTerm.includes(String(record.category || "").toLowerCase())) {
    const words = searchTerm.split(/\\s+/).filter((word) => word.length > 2);
    if (words.length > 0 && !words.some((word) => haystack.includes(word))) {
      return false;
    }
  }
  if (budgetMax > 0 && Number(record.price_minor || 0) / 100 > budgetMax) {
    return false;
  }
  if (budgetMin > 0 && Number(record.price_minor || 0) / 100 < budgetMin) {
    return false;
  }
  if (colour && String(record.colour || "").toLowerCase() !== colour) {
    return false;
  }
  if (size && String(record.size || "").toLowerCase() !== size) {
    return false;
  }
  return true;
}

const scored = rows
  .filter((record) => Boolean(record.active))
  .map((record) => {
    let score = 0;
    if (matches(record)) score += 60;
    if (String(record.use_case || "").toLowerCase() === String(vars.use_case || "").toLowerCase()) score += 10;
    if (colour && String(record.colour || "").toLowerCase() === colour) score += 5;
    if (size && String(record.size || "").toLowerCase() === size) score += 5;
    score += Number(record.available_qty || 0) > 0 ? 10 : 0;
    score += Math.min(Number(record.rating_avg || 0) * 2, 10);
    if (budgetMax > 0) {
      const delta = Math.abs(Number(record.price_minor || 0) / 100 - budgetMax);
      score += Math.max(0, 10 - Math.floor(delta / 1000));
    }
    return { ...record, _score: score };
  })
  .sort((a, b) => b._score - a._score);

const exactMatches = scored.filter((record) => record._score >= 70);
const fallbackMatches = scored.filter((record) => record._score >= 40);
const results = (exactMatches.length > 0 ? exactMatches : fallbackMatches).slice(0, 3);

vars.ranked_products = results;
vars.product_search_state =
  exactMatches.length > 0 ? "exact" : results.length > 0 ? "alternative" : "none";
vars.search_summary =
  results.length > 0
    ? "I found " + results.length + " product options that fit your request."
    : "I could not find an exact match in the current catalog.";
vars.carousel_slides = results.map((record, index) => ({
  ...record,
  selection_value: String(index + 1),
  price_display:
    "₹" + Number(record.price_minor || 0).toLocaleString("en-IN") / 100,
  rating_display:
    Number(record.rating_avg || 0) > 0
      ? String(record.rating_avg || 0) + " / 5"
      : "New",
  stock_status:
    Number(record.available_qty || 0) > 0
      ? "In stock"
      : "Out of stock"
}));
return "success";
`;

const selectProductScript = `
const selectedValue = String(vars.product_choice || "").trim().toLowerCase();
const ranked = Array.isArray(vars.ranked_products) ? vars.ranked_products : [];
const indexMap = { first: 0, "1": 0, second: 1, "2": 1, third: 2, "3": 2 };
const selected = ranked[indexMap[selectedValue]];
if (!selected) {
  vars.selected_product_state = "not_found";
  return "success";
}
vars.selected_product_state = "selected";
vars.selected_product_id = selected.product_id || "";
vars.selected_variant_id = selected.variant_id || "";
vars.selected_sku = selected.sku || "";
vars.selected_product_name = selected.product_name || "";
vars.selected_variant_name = selected.variant_name || "";
vars.selected_price_minor = Number(selected.price_minor || 0);
vars.selected_quantity = Number(vars.selected_quantity || 1);
vars.selected_available_qty = Number(selected.available_qty || 0);
vars.selected_return_window_days = Number(selected.return_window_days || 7);
vars.selected_warranty_months = Number(selected.warranty_months || 0);
vars.selected_estimated_delivery_date = selected.estimated_delivery_date || "";
vars.selected_catalog_item = selected;
return "success";
`;

const compareScript = `
const ranked = Array.isArray(vars.ranked_products) ? vars.ranked_products : [];
const pair = String(vars.compare_pair || "").trim();
const map = {
  "1_vs_2": [0, 1],
  "1_vs_3": [0, 2],
  "2_vs_3": [1, 2]
};
const indexes = map[pair];
if (!indexes || !ranked[indexes[0]] || !ranked[indexes[1]]) {
  vars.compare_state = "invalid";
  return "success";
}
const a = ranked[indexes[0]];
const b = ranked[indexes[1]];
vars.compare_state = "ready";
vars.compare_message_text =
  a.product_name +
  " vs " +
  b.product_name +
  "\\n\\n" +
  "Price: ₹" +
  (Number(a.price_minor || 0) / 100).toLocaleString("en-IN") +
  " vs ₹" +
  (Number(b.price_minor || 0) / 100).toLocaleString("en-IN") +
  "\\n" +
  "Rating: " +
  String(a.rating_avg || 0) +
  " vs " +
  String(b.rating_avg || 0) +
  "\\n" +
  "Stock: " +
  Number(a.available_qty || 0) +
  " vs " +
  Number(b.available_qty || 0) +
  "\\n" +
  "Use case: " +
  (a.use_case || "general") +
  " vs " +
  (b.use_case || "general") +
  "\\n\\n" +
  (Number(a.available_qty || 0) > Number(b.available_qty || 0)
    ? a.product_name + " is the stronger immediate-buy option because it has better live availability."
    : b.product_name + " is the stronger immediate-buy option because it better balances rating and inventory.");
return "success";
`;

const stockScript = `
const availableQty = Number(vars.selected_available_qty || 0);
vars.stock_state = availableQty > 0 ? "available" : "unavailable";
vars.stock_message_text =
  availableQty > 0
    ? "Yes. " +
      String(vars.selected_product_name || "") +
      " / " +
      String(vars.selected_variant_name || "") +
      " is currently available. Estimated delivery: " +
      String(vars.selected_estimated_delivery_date || "to be confirmed") +
      "."
    : String(vars.selected_product_name || "") +
      " / " +
      String(vars.selected_variant_name || "") +
      " is currently unavailable. I can register a back-in-stock alert instead.";
return "success";
`;

const ensureCustomerScript = `
const existing = Array.isArray(vars.customer_find_result?.records)
  ? vars.customer_find_result.records[0]
  : Array.isArray(vars.customer_find_result?.data)
    ? vars.customer_find_result.data[0]
    : Array.isArray(vars.customer_find_result)
      ? vars.customer_find_result[0]
      : null;
const mobile = String(vars.customer_mobile || vars.customer_contact_input || "").trim();
vars.customer_mobile = mobile.startsWith("+91") ? mobile : mobile ? "+91" + mobile.replace(/\\D/g, "").slice(-10) : "";
vars.customer_id = existing?.customer_id || ("CUST-" + (vars.customer_mobile || "").replace(/\\D/g, "").slice(-10));
vars.customer_name = existing?.customer_name || vars.customer_name || "Guest Shopper";
vars.customer_email = existing?.customer_email || vars.customer_email || "";
vars.customer_record_payload = {
  customer_id: vars.customer_id,
  customer_name: vars.customer_name,
  customer_mobile: vars.customer_mobile,
  customer_email: vars.customer_email,
  loyalty_tier: existing?.loyalty_tier || "standard",
  preferred_language: vars.detected_language || "en",
  city: existing?.city || "Hyderabad",
  state: existing?.state || "Telangana"
};
return "success";
`;

const addToCartScript = `
const cartRows = Array.isArray(vars.cart_find_result?.records)
  ? vars.cart_find_result.records
  : Array.isArray(vars.cart_find_result?.data)
    ? vars.cart_find_result.data
    : Array.isArray(vars.cart_find_result)
      ? vars.cart_find_result
      : [];
const currentCart = cartRows[0] || null;
vars.cart_id = currentCart?.cart_id || ("CART-" + (vars.customer_mobile || "").replace(/\\D/g, "").slice(-10));
vars.selected_quantity = Number(vars.selected_quantity || 1);
const lineTotal = Number(vars.selected_price_minor || 0) * vars.selected_quantity;
const subtotal = Number(currentCart?.subtotal_minor || 0) + lineTotal;
const itemCount = Number(currentCart?.item_count || 0) + vars.selected_quantity;
vars.cart_payload = {
  cart_id: vars.cart_id,
  customer_id: vars.customer_id,
  customer_mobile: vars.customer_mobile,
  status: "active",
  subtotal_minor: subtotal,
  discount_total_minor: 0,
  shipping_total_minor: subtotal >= 500000 ? 0 : 49900,
  grand_total_minor: subtotal >= 500000 ? subtotal : subtotal + 49900,
  item_count: itemCount,
  converted_order_id: currentCart?.converted_order_id || "",
  updated_at: "2026-08-25T09:00:00.000Z"
};
vars.cart_item_id = vars.cart_id + ":" + vars.selected_variant_id;
vars.cart_item_payload = {
  cart_item_id: vars.cart_item_id,
  cart_id: vars.cart_id,
  product_id: vars.selected_product_id,
  variant_id: vars.selected_variant_id,
  sku: vars.selected_sku,
  product_name: vars.selected_product_name,
  variant_name: vars.selected_variant_name,
  quantity: vars.selected_quantity,
  unit_price_minor: vars.selected_price_minor,
  line_total_minor: lineTotal
};
vars.cart_message_text =
  "Added to cart: " +
  vars.selected_product_name +
  " / " +
  vars.selected_variant_name +
  "\\nQty: " +
  vars.selected_quantity +
  "\\nCart total: ₹" +
  (vars.cart_payload.grand_total_minor / 100).toLocaleString("en-IN");
return "success";
`;

const cartSummaryScript = `
const carts = Array.isArray(vars.cart_find_result?.records)
  ? vars.cart_find_result.records
  : Array.isArray(vars.cart_find_result?.data)
    ? vars.cart_find_result.data
    : Array.isArray(vars.cart_find_result)
      ? vars.cart_find_result
      : [];
const currentCart = carts[0];
if (!currentCart) {
  vars.cart_state = "empty";
  return "success";
}
vars.cart_state = "ready";
vars.cart_id = currentCart.cart_id || vars.cart_id || "";
vars.cart_summary_text =
  "Cart " +
  currentCart.cart_id +
  "\\nItems: " +
  Number(currentCart.item_count || 0) +
  "\\nSubtotal: ₹" +
  (Number(currentCart.subtotal_minor || 0) / 100).toLocaleString("en-IN") +
  "\\nGrand total: ₹" +
  (Number(currentCart.grand_total_minor || 0) / 100).toLocaleString("en-IN");
return "success";
`;

const checkoutPrepareScript = `
const carts = Array.isArray(vars.cart_find_result?.records)
  ? vars.cart_find_result.records
  : Array.isArray(vars.cart_find_result?.data)
    ? vars.cart_find_result.data
    : Array.isArray(vars.cart_find_result)
      ? vars.cart_find_result
      : [];
const currentCart = carts[0];
if (!currentCart) {
  vars.checkout_state = "no_cart";
  return "success";
}
vars.checkout_state = "ready";
vars.cart_id = currentCart.cart_id;
vars.checkout_mode = vars.checkout_mode || "cart_checkout";
vars.reservation_id = "RSV-" + String(currentCart.cart_id || "0001");
vars.reservation_key = vars.reservation_id;
vars.reservation_payload = {
  reservation_id: vars.reservation_id,
  reservation_key: vars.reservation_key,
  cart_id: currentCart.cart_id,
  variant_id: vars.selected_variant_id || "VAR-CHECKOUT-LOOKUP",
  sku: vars.selected_sku || "SKU-CHECKOUT-LOOKUP",
  quantity: 1,
  status: "active",
  expires_at: "2026-08-25T12:15:00.000Z"
};
vars.checkout_amount_minor = Number(currentCart.grand_total_minor || 0);
vars.checkout_summary_text =
  "Before payment I revalidated price, promotion, and inventory.\\n\\n" +
  "Cart total: ₹" +
  (vars.checkout_amount_minor / 100).toLocaleString("en-IN") +
  "\\nReservation hold: 15 minutes";
return "success";
`;

const createOrderScript = `
vars.order_id = "ORD-" + String(vars.cart_id || "0001");
vars.order_number = "CR-" + String((vars.customer_mobile || "").replace(/\\D/g, "").slice(-6) || "49280");
vars.order_payload = {
  order_id: vars.order_id,
  order_number: vars.order_number,
  customer_id: vars.customer_id,
  customer_mobile: vars.customer_mobile,
  customer_name: vars.customer_name,
  status: "confirmed",
  payment_status: "paid",
  fulfillment_status: "processing",
  grand_total_minor: Number(vars.checkout_amount_minor || 0),
  primary_item_name: vars.selected_product_name || "Cart items",
  invoice_url: "https://shop.example.com/invoice/" + vars.order_number,
  delivery_address_summary: "Hyderabad, Telangana",
  order_date: "2026-08-25",
  delivered_at: ""
};
vars.order_item_payload = {
  order_item_id: vars.order_id + ":1",
  order_id: vars.order_id,
  order_number: vars.order_number,
  product_id: vars.selected_product_id || "PRD-CHECKOUT-LOOKUP",
  variant_id: vars.selected_variant_id || "VAR-CHECKOUT-LOOKUP",
  sku: vars.selected_sku || "SKU-CHECKOUT-LOOKUP",
  product_name: vars.selected_product_name || "Cart item",
  variant_name: vars.selected_variant_name || "",
  quantity: Number(vars.selected_quantity || 1),
  unit_price_minor: Number(vars.selected_price_minor || vars.checkout_amount_minor || 0),
  return_window_end: "2026-09-03",
  warranty_end: "2027-08-25"
};
vars.shipment_payload = {
  shipment_id: "SHP-" + vars.order_id,
  order_id: vars.order_id,
  order_number: vars.order_number,
  carrier: "Delhivery",
  tracking_number: "DLV-" + vars.order_number,
  status: "confirmed",
  latest_event: "Order confirmed and handed to warehouse",
  latest_event_at: "2026-08-25T10:15:00.000Z",
  estimated_delivery_at: "2026-08-28T20:00:00.000Z"
};
vars.payment_record_payload = {
  refund_id: "",
  refund_number: "",
  order_id: vars.order_id,
  order_number: vars.order_number,
  provider_reference: vars.order_number,
  amount_minor: Number(vars.checkout_amount_minor || 0),
  status: "captured",
  processed_at: "2026-08-25T10:10:00.000Z",
  expected_credit_window: ""
};
vars.order_confirmation_text =
  "Order " +
  vars.order_number +
  " is confirmed.\\n" +
  "Amount paid: ₹" +
  (Number(vars.checkout_amount_minor || 0) / 100).toLocaleString("en-IN") +
  "\\nEstimated delivery: 28 August 2026.";
return "success";
`;

const orderLookupScript = `
${arrayReaderBlock}
const rows = getRows(vars.order_find_result);
const hint = String(vars.order_lookup_hint || vars.order_lookup_input || "").trim().toLowerCase();
const mobile = String(vars.customer_mobile || vars.customer_contact_input || "").replace(/\\D/g, "").slice(-10);
let filtered = rows;
if (hint) {
  filtered = rows.filter((row) =>
    String(row.order_number || "").toLowerCase() === hint.toLowerCase() ||
    String(row.order_id || "").toLowerCase() === hint.toLowerCase()
  );
}
if (filtered.length === 0 && mobile) {
  filtered = rows.filter((row) =>
    String(row.customer_mobile || "").replace(/\\D/g, "").endsWith(mobile)
  );
}
vars.order_results = filtered.slice(0, 3);
if (vars.order_results.length === 0) {
  vars.order_lookup_state = "none";
  return "success";
}
if (vars.order_results.length === 1) {
  const selected = vars.order_results[0];
  vars.order_lookup_state = "single";
  vars.selected_order_id = selected.order_id || "";
  vars.selected_order_number = selected.order_number || "";
  vars.selected_order_status = selected.status || "";
  vars.selected_order_payment_status = selected.payment_status || "";
  vars.selected_order_fulfillment_status = selected.fulfillment_status || "";
  vars.selected_order_total_minor = Number(selected.grand_total_minor || 0);
  vars.selected_order_primary_item = selected.primary_item_name || "";
  vars.selected_invoice_url = selected.invoice_url || "";
  vars.selected_order_date = selected.order_date || "";
  vars.selected_order_delivered_at = selected.delivered_at || "";
  return "success";
}
vars.order_lookup_state = "multiple";
vars.order_options_text = vars.order_results
  .map((row, index) =>
    String(index + 1) + ". " +
    String(row.order_number || "") +
    " - " +
    String(row.primary_item_name || "Order") +
    " - " +
    String(row.status || "")
  )
  .join("\\n");
return "success";
`;

const selectOrderScript = `
const options = Array.isArray(vars.order_results) ? vars.order_results : [];
const selectedValue = String(vars.order_choice || "").trim().toLowerCase();
const indexMap = { first: 0, "1": 0, second: 1, "2": 1, third: 2, "3": 2 };
const selected = options[indexMap[selectedValue]];
if (!selected) {
  vars.order_choice_state = "invalid";
  return "success";
}
vars.order_choice_state = "selected";
vars.selected_order_id = selected.order_id || "";
vars.selected_order_number = selected.order_number || "";
vars.selected_order_status = selected.status || "";
vars.selected_order_payment_status = selected.payment_status || "";
vars.selected_order_fulfillment_status = selected.fulfillment_status || "";
vars.selected_order_total_minor = Number(selected.grand_total_minor || 0);
vars.selected_order_primary_item = selected.primary_item_name || "";
vars.selected_invoice_url = selected.invoice_url || "";
vars.selected_order_date = selected.order_date || "";
vars.selected_order_delivered_at = selected.delivered_at || "";
return "success";
`;

const shipmentStatusScript = `
${arrayReaderBlock}
const rows = getRows(vars.shipment_find_result);
const shipment = rows.find((row) => row.order_id === vars.selected_order_id) || rows[0];
if (!shipment) {
  vars.shipment_status_message =
    "Order " + vars.selected_order_number + " is found, but shipment data is not available yet.";
  return "success";
}
vars.shipment_status_message =
  "Order " + vars.selected_order_number +
  "\\nStatus: " + String(shipment.status || vars.selected_order_fulfillment_status || "") +
  "\\nCourier: " + String(shipment.carrier || "") +
  "\\nExpected: " + String(shipment.estimated_delivery_at || "") +
  "\\nLast update: " + String(shipment.latest_event || "");
return "success";
`;

const changePolicyScript = `
const status = String(vars.selected_order_status || "").toLowerCase();
const fulfillment = String(vars.selected_order_fulfillment_status || "").toLowerCase();
vars.change_state = "unsupported";
vars.change_message_text =
  "This order no longer supports self-service changes. I can create a structured support case instead.";
if (status === "confirmed" && (fulfillment === "pending" || fulfillment === "processing")) {
  vars.change_state = "supported";
  vars.change_message_text =
    "This order still supports limited self-service changes: address correction, payment retry, or cancellation before packing.";
}
return "success";
`;

const cancelPolicyScript = `
const status = String(vars.selected_order_status || "").toLowerCase();
const fulfillment = String(vars.selected_order_fulfillment_status || "").toLowerCase();
vars.cancel_state =
  status === "confirmed" && (fulfillment === "pending" || fulfillment === "processing")
    ? "eligible"
    : "ineligible";
vars.cancel_message_text =
  vars.cancel_state === "eligible"
    ? "Order " + vars.selected_order_number + " is eligible for cancellation. If prepaid, a refund will be initiated to the original payment method."
    : "Order " + vars.selected_order_number + " can no longer be cancelled automatically because it is already packed, shipped, or completed.";
return "success";
`;

const returnPolicyScript = `
const deliveredAt = new Date(String(vars.selected_order_delivered_at || "2026-08-22T12:00:00.000Z"));
const now = new Date("2026-08-25T00:00:00.000Z");
const diffDays = Math.floor((now - deliveredAt) / (1000 * 60 * 60 * 24));
vars.return_state = diffDays <= 7 ? "eligible" : "approval";
vars.return_message_text =
  vars.return_state === "eligible"
    ? "This delivered order is inside the 7-day return window."
    : "This order is outside the standard return window and needs manual approval.";
return "success";
`;

const exchangePolicyScript = `
vars.exchange_state = Number(vars.selected_available_qty || 0) > 0 ? "replaceable" : "refund_only";
vars.exchange_message_text =
  vars.exchange_state === "replaceable"
    ? "A replacement path is available if you prefer exchange instead of refund."
    : "Replacement inventory is not available right now, so I can proceed with refund or back-in-stock follow-up.";
return "success";
`;

const refundStatusScript = `
${arrayReaderBlock}
const rows = getRows(vars.refund_find_result);
const refund = rows.find((row) => row.order_id === vars.selected_order_id) || rows[0];
if (!refund) {
  vars.refund_status_message =
    "I could not find an active refund record for order " + vars.selected_order_number + ".";
  return "success";
}
vars.refund_status_message =
  "Refund " + String(refund.refund_number || "") +
  "\\nAmount: ₹" + (Number(refund.amount_minor || 0) / 100).toLocaleString("en-IN") +
  "\\nStatus: " + String(refund.status || "") +
  "\\nProcessed: " + String(refund.processed_at || "") +
  "\\nProvider reference: " + String(refund.provider_reference || "") +
  "\\nExpected bank credit: " + String(refund.expected_credit_window || "");
return "success";
`;

const policyAnswerScript = `
${arrayReaderBlock}
const rows = getRows(vars.policy_find_result);
const query = String(vars.policy_question || vars.customer_message || "").toLowerCase();
const direct = rows.find((row) => query.includes(String(row.policy_type || "").toLowerCase())) || rows[0];
vars.policy_answer_text = direct
  ? direct.title + "\\n\\n" + direct.summary
  : "I could not match a policy rule. I can route this to support.";
return "success";
`;

const supportCaseScript = `
vars.support_case_id = "CASE-" + (vars.selected_order_number || (vars.customer_mobile || "").replace(/\\D/g, "").slice(-6) || "000001");
vars.case_number = "SC-" + (vars.selected_order_number || "000001");
vars.support_case_payload = {
  support_case_id: vars.support_case_id,
  case_number: vars.case_number,
  customer_mobile: vars.customer_mobile || "",
  order_number: vars.selected_order_number || "",
  issue_type: vars.support_issue_type || vars.issue_reason || vars.retail_intent || "support",
  priority: vars.support_priority || "high",
  status: "open",
  summary:
    vars.support_summary ||
    ("Customer requested support for " + (vars.selected_order_number || "general shopping assistance") + "."),
  queue_name: "retail_exceptions"
};
return "success";
`;

const warrantyScript = `
const deliveredAt = new Date(String(vars.selected_order_delivered_at || "2026-08-22T12:00:00.000Z"));
const months = Number(vars.selected_warranty_months || 12);
const expiry = new Date(deliveredAt);
expiry.setMonth(expiry.getMonth() + months);
const now = new Date("2026-08-25T00:00:00.000Z");
vars.warranty_state = expiry >= now ? "covered" : "expired";
vars.warranty_message_text =
  vars.warranty_state === "covered"
    ? "This purchase is still inside the warranty period. I can open a warranty support case with order context."
    : "The standard warranty window has expired for this order.";
return "success";
`;

node("start", "start", 0, 0, {});
node(
  "welcome_message",
  "message",
  220,
  0,
  msgData(
    "Hi! I’m your shopping assistant.\nI can help you find the right product, compare options, check availability, track orders, manage returns, and handle after-sales support.\n\nYou can type naturally, for example: I need waterproof running shoes under ₹4,000.",
    []
  )
);
node(
  "customer_input",
  "input",
  460,
  0,
  inputData("What do you need help with today?", "customer_message", quickActions)
);
node(
  "detect_language_script",
  "script",
  700,
  0,
  scriptData(detectLanguageScript, "language_detection_result")
);
node(
  "extract_request_script",
  "script",
  940,
  0,
  scriptData(extractRequestScript, "request_extraction_result")
);
node("main_intent_switch", "switch", 1180, 0, switchData("retail_intent"));

const routeModes = [
  ["set_mode_discover", "discover"],
  ["set_mode_compare", "compare"],
  ["set_mode_stock", "stock"],
  ["set_mode_add_to_cart", "add_to_cart"],
  ["set_mode_buy_now", "buy_now"],
  ["set_mode_notify_me", "notify_me"],
  ["set_mode_cart", "cart"],
  ["set_mode_checkout", "checkout"],
  ["set_mode_order_status", "order_status"],
  ["set_mode_change", "change_order"],
  ["set_mode_cancel", "cancel_order"],
  ["set_mode_return", "return_product"],
  ["set_mode_exchange", "exchange_product"],
  ["set_mode_refund", "refund_status"],
  ["set_mode_delivery", "delivery_problem"],
  ["set_mode_invoice", "invoice_billing"],
  ["set_mode_warranty", "warranty_support"],
  ["set_mode_policy", "policies_faq"],
  ["set_mode_back_in_stock", "back_in_stock"],
  ["set_mode_support", "talk_to_support"]
];

let modeY = -560;
for (const [id, value] of routeModes) {
  node(id, "setVariable", 1440, modeY, setVars({ journey_mode: value }));
  modeY += 80;
}

node(
  "catalog_find",
  "record",
  1740,
  -520,
  recordData({
    action: "list",
    collection: "retail_catalog_items",
    where: { active: true },
    schema: schemas.catalog,
    outputVar: "catalog_results",
    limit: 25,
    sortBy: "product_name",
    sortOrder: "asc"
  })
);
node(
  "rank_products_script",
  "script",
  1980,
  -520,
  scriptData(rankProductsScript, "rank_products_result")
);
node("product_results_switch", "switch", 2220, -520, switchData("product_search_state"));
node(
  "no_search_results_message",
  "message",
  2460,
  -680,
  msgData(
    "I could not find an exact match right now. I can either show close alternatives, register a back-in-stock alert, or route this to support.",
    []
  )
);
node(
  "product_results_carousel",
  "carousel",
  2460,
  -520,
  dynamicCarouselData("{{search_summary}}", "{{carousel_slides}}", catalogSlideTemplate)
);
node(
  "compare_pair_input",
  "input",
  2700,
  -600,
  inputData("Pick the pair you want compared.", "compare_pair", [
    { label: "1 vs 2", value: "1_vs_2" },
    { label: "1 vs 3", value: "1_vs_3" },
    { label: "2 vs 3", value: "2_vs_3" },
    { label: "First Only", value: "1" }
  ])
);
node("compare_script", "script", 2940, -600, scriptData(compareScript, "compare_result"));
node(
  "compare_result_switch",
  "switch",
  3180,
  -600,
  switchData("compare_state")
);
node(
  "compare_message",
  "message",
  3420,
  -600,
  msgData("{{compare_message_text}}", [])
);
node(
  "product_choice_input",
  "input",
  2700,
  -440,
  inputData("Which option should I use next?", "product_choice", [
    { label: "First", value: "1" },
    { label: "Second", value: "2" },
    { label: "Third", value: "3" }
  ])
);
node(
  "select_product_script",
  "script",
  2940,
  -440,
  scriptData(selectProductScript, "product_selection_result")
);
node(
  "selected_product_switch",
  "switch",
  3180,
  -440,
  switchData("selected_product_state")
);
node(
  "selected_product_message",
  "message",
  3420,
  -440,
  msgData(
    "Selected product:\n{{selected_product_name}} / {{selected_variant_name}}\nPrice: ₹{{selected_price_minor}}\nSKU: {{selected_sku}}\n\nI have saved the stable product, variant, SKU, price, and quantity identifiers for downstream actions.",
    []
  )
);
node(
  "selected_product_action_input",
  "input",
  3660,
  -440,
  inputData("What should I do with this product?", "selected_product_action", [
    { label: "Add to Cart", value: "add_to_cart" },
    { label: "Check Stock", value: "check_stock" },
    { label: "Buy Now", value: "buy_now" },
    { label: "Notify Me", value: "notify_me" }
  ])
);
node(
  "selected_product_action_switch",
  "switch",
  3900,
  -440,
  switchData("selected_product_action")
);
node("stock_script", "script", 4140, -520, scriptData(stockScript, "stock_result"));
node("stock_switch", "switch", 4380, -520, switchData("stock_state"));
node(
  "stock_message",
  "message",
  4620,
  -560,
  msgData("{{stock_message_text}}", [])
);
node(
  "stock_unavailable_message",
  "message",
  4620,
  -480,
  msgData("{{stock_message_text}}", [])
);

node(
  "customer_contact_input",
  "input",
  4140,
  -360,
  inputData(
    "Share the mobile number to continue. Demo format: 10 digits is enough.",
    "customer_contact_input"
  )
);
node(
  "customer_find",
  "record",
  4380,
  -360,
  recordData({
    action: "list",
    collection: "retail_customers",
    where: { customer_mobile: "{{customer_contact_input}}" },
    schema: schemas.customers,
    outputVar: "customer_find_result",
    limit: 1
  })
);
node(
  "ensure_customer_script",
  "script",
  4620,
  -360,
  scriptData(ensureCustomerScript, "ensure_customer_result")
);
node(
  "customer_upsert",
  "record",
  4860,
  -360,
  recordData({
    action: "upsert",
    collection: "retail_customers",
    where: { customer_mobile: "{{customer_mobile}}" },
    uniqueKey: "customer_mobile",
    idempotencyKey: "{{customer_id}}",
    data: {
      customer_id: "{{customer_id}}",
      customer_name: "{{customer_name}}",
      customer_mobile: "{{customer_mobile}}",
      customer_email: "{{customer_email}}",
      loyalty_tier: "standard",
      preferred_language: "{{detected_language}}",
      city: "Hyderabad",
      state: "Telangana"
    },
    schema: schemas.customers,
    outputVar: "customer_upsert_result"
  })
);
node(
  "customer_post_lookup_switch",
  "switch",
  5100,
  -440,
  switchData("journey_mode")
);
node(
  "cart_find",
  "record",
  5100,
  -360,
  recordData({
    action: "list",
    collection: "retail_carts",
    where: {
      customer_mobile: "{{customer_mobile}}",
      status: "active"
    },
    schema: schemas.carts,
    outputVar: "cart_find_result",
    limit: 1
  })
);
node(
  "add_to_cart_script",
  "script",
  5340,
  -360,
  scriptData(addToCartScript, "add_to_cart_result")
);
node(
  "cart_upsert",
  "record",
  5580,
  -420,
  recordData({
    action: "upsert",
    collection: "retail_carts",
    where: { cart_id: "{{cart_id}}" },
    uniqueKey: "cart_id",
    idempotencyKey: "{{cart_id}}",
    data: {
      cart_id: "{{cart_id}}",
      customer_id: "{{customer_id}}",
      customer_mobile: "{{customer_mobile}}",
      status: "active",
      subtotal_minor: "{{cart_payload.subtotal_minor}}",
      discount_total_minor: "{{cart_payload.discount_total_minor}}",
      shipping_total_minor: "{{cart_payload.shipping_total_minor}}",
      grand_total_minor: "{{cart_payload.grand_total_minor}}",
      item_count: "{{cart_payload.item_count}}",
      converted_order_id: "",
      updated_at: "{{cart_payload.updated_at}}"
    },
    schema: schemas.carts,
    outputVar: "cart_upsert_result"
  })
);
node(
  "cart_item_upsert",
  "record",
  5580,
  -300,
  recordData({
    action: "upsert",
    collection: "retail_cart_items",
    where: { cart_item_id: "{{cart_item_id}}" },
    uniqueKey: "cart_item_id",
    idempotencyKey: "{{cart_item_id}}",
    data: {
      cart_item_id: "{{cart_item_id}}",
      cart_id: "{{cart_id}}",
      product_id: "{{selected_product_id}}",
      variant_id: "{{selected_variant_id}}",
      sku: "{{selected_sku}}",
      product_name: "{{selected_product_name}}",
      variant_name: "{{selected_variant_name}}",
      quantity: "{{selected_quantity}}",
      unit_price_minor: "{{selected_price_minor}}",
      line_total_minor: "{{cart_item_payload.line_total_minor}}"
    },
    schema: schemas.cartItems,
    outputVar: "cart_item_upsert_result"
  })
);
node("cart_summary_script", "script", 5340, -200, scriptData(cartSummaryScript, "cart_summary_result"));
node("cart_summary_switch", "switch", 5580, -200, switchData("cart_state"));
node(
  "cart_summary_message",
  "message",
  5820,
  -200,
  msgData("{{cart_summary_text}}", [])
);
node(
  "cart_added_message",
  "message",
  5820,
  -360,
  msgData("{{cart_message_text}}", [])
);
node(
  "post_cart_action_input",
  "input",
  6060,
  -320,
  inputData("What next?", "post_cart_action", [
    { label: "Continue Shopping", value: "continue" },
    { label: "View Cart", value: "view_cart" },
    { label: "Checkout", value: "checkout" }
  ])
);
node("post_cart_action_switch", "switch", 6300, -320, switchData("post_cart_action"));

node(
  "checkout_prepare_script",
  "script",
  6540,
  -240,
  scriptData(checkoutPrepareScript, "checkout_prepare_result")
);
node("checkout_state_switch", "switch", 6780, -240, switchData("checkout_state"));
node(
  "no_cart_message",
  "message",
  7020,
  -320,
  msgData("I could not find an active cart for this customer yet.", [])
);
node(
  "checkout_summary_message",
  "message",
  7020,
  -240,
  msgData("{{checkout_summary_text}}", [])
);
node(
  "reservation_upsert",
  "record",
  7260,
  -240,
  recordData({
    action: "upsert",
    collection: "retail_inventory_reservations",
    where: { reservation_id: "{{reservation_id}}" },
    uniqueKey: "reservation_id",
    idempotencyKey: "{{reservation_id}}",
    data: {
      reservation_id: "{{reservation_id}}",
      reservation_key: "{{reservation_key}}",
      cart_id: "{{cart_id}}",
      variant_id: "{{reservation_payload.variant_id}}",
      sku: "{{reservation_payload.sku}}",
      quantity: "{{reservation_payload.quantity}}",
      status: "active",
      expires_at: "{{reservation_payload.expires_at}}"
    },
    schema: schemas.reservations,
    outputVar: "reservation_upsert_result"
  })
);
node(
  "checkout_payment",
  "payment",
  7500,
  -240,
  paymentData({
    amount: "{{checkout_amount_minor}}",
    description: "Retail checkout payment",
    outputVar: "checkout_payment_result"
  })
);
node(
  "create_order_script",
  "script",
  7740,
  -240,
  scriptData(createOrderScript, "create_order_result")
);
node(
  "order_upsert",
  "record",
  7980,
  -320,
  recordData({
    action: "upsert",
    collection: "retail_orders",
    where: { order_id: "{{order_id}}" },
    uniqueKey: "order_id",
    idempotencyKey: "{{order_id}}",
    data: {
      order_id: "{{order_id}}",
      order_number: "{{order_number}}",
      customer_id: "{{customer_id}}",
      customer_mobile: "{{customer_mobile}}",
      customer_name: "{{customer_name}}",
      status: "confirmed",
      payment_status: "paid",
      fulfillment_status: "processing",
      grand_total_minor: "{{checkout_amount_minor}}",
      primary_item_name: "{{selected_product_name}}",
      invoice_url: "{{order_payload.invoice_url}}",
      delivery_address_summary: "{{order_payload.delivery_address_summary}}",
      order_date: "2026-08-25",
      delivered_at: ""
    },
    schema: schemas.orders,
    outputVar: "order_upsert_result"
  })
);
node(
  "order_item_upsert",
  "record",
  7980,
  -200,
  recordData({
    action: "upsert",
    collection: "retail_order_items",
    where: { order_item_id: "{{order_item_payload.order_item_id}}" },
    uniqueKey: "order_item_id",
    idempotencyKey: "{{order_item_payload.order_item_id}}",
    data: {
      order_item_id: "{{order_item_payload.order_item_id}}",
      order_id: "{{order_id}}",
      order_number: "{{order_number}}",
      product_id: "{{order_item_payload.product_id}}",
      variant_id: "{{order_item_payload.variant_id}}",
      sku: "{{order_item_payload.sku}}",
      product_name: "{{order_item_payload.product_name}}",
      variant_name: "{{order_item_payload.variant_name}}",
      quantity: "{{order_item_payload.quantity}}",
      unit_price_minor: "{{order_item_payload.unit_price_minor}}",
      return_window_end: "{{order_item_payload.return_window_end}}",
      warranty_end: "{{order_item_payload.warranty_end}}"
    },
    schema: schemas.orderItems,
    outputVar: "order_item_upsert_result"
  })
);
node(
  "shipment_upsert",
  "record",
  8220,
  -240,
  recordData({
    action: "upsert",
    collection: "retail_shipments",
    where: { shipment_id: "{{shipment_payload.shipment_id}}" },
    uniqueKey: "shipment_id",
    idempotencyKey: "{{shipment_payload.shipment_id}}",
    data: {
      shipment_id: "{{shipment_payload.shipment_id}}",
      order_id: "{{order_id}}",
      order_number: "{{order_number}}",
      carrier: "{{shipment_payload.carrier}}",
      tracking_number: "{{shipment_payload.tracking_number}}",
      status: "{{shipment_payload.status}}",
      latest_event: "{{shipment_payload.latest_event}}",
      latest_event_at: "{{shipment_payload.latest_event_at}}",
      estimated_delivery_at: "{{shipment_payload.estimated_delivery_at}}"
    },
    schema: schemas.shipments,
    outputVar: "shipment_upsert_result"
  })
);
node(
  "reservation_consumed_update",
  "record",
  8460,
  -240,
  recordData({
    action: "upsert",
    collection: "retail_inventory_reservations",
    where: { reservation_id: "{{reservation_id}}" },
    uniqueKey: "reservation_id",
    idempotencyKey: "{{reservation_id}}",
    data: {
      reservation_id: "{{reservation_id}}",
      reservation_key: "{{reservation_key}}",
      cart_id: "{{cart_id}}",
      variant_id: "{{reservation_payload.variant_id}}",
      sku: "{{reservation_payload.sku}}",
      quantity: "{{reservation_payload.quantity}}",
      status: "consumed",
      expires_at: "{{reservation_payload.expires_at}}"
    },
    schema: schemas.reservations,
    outputVar: "reservation_consumed_update_result"
  })
);
node(
  "order_confirmation_notify",
  "notification",
  8700,
  -240,
  notificationData({
    recipients: [
      { channel: "whatsapp", destination: "{{customer_mobile}}" },
      { channel: "email", destination: "{{customer_email}}" }
    ],
    channels: [
      {
        type: "whatsapp",
        enabled: true,
        message: "Your order {{order_number}} is confirmed. Estimated delivery: 28 August 2026."
      },
      {
        type: "sms",
        enabled: true,
        message: "Order {{order_number}} confirmed. Estimated delivery: 28 August 2026."
      },
      {
        type: "email",
        enabled: true,
        subject: "Order {{order_number}} confirmed",
        body: "Thank you for shopping with {{store_name}}. Your order is confirmed."
      }
    ],
    dedupeKey: "{{order_number}}:confirmation",
    outputVar: "order_confirmation_notify_result"
  })
);
node(
  "order_confirmation_message",
  "message",
  8940,
  -240,
  msgData("{{order_confirmation_text}}", [])
);

node(
  "order_lookup_input",
  "input",
  1740,
  200,
  inputData(
    "Share the order number or the customer mobile used for the order.",
    "order_lookup_input"
  )
);
node(
  "order_find",
  "record",
  1980,
  200,
  recordData({
    action: "list",
    collection: "retail_orders",
    where: {},
    schema: schemas.orders,
    outputVar: "order_find_result",
    limit: 10
  })
);
node(
  "order_lookup_script",
  "script",
  2220,
  200,
  scriptData(orderLookupScript, "order_lookup_result")
);
node("order_lookup_switch", "switch", 2460, 200, switchData("order_lookup_state"));
node(
  "no_order_message",
  "message",
  2700,
  40,
  msgData("I could not find a matching order with the current details.", [])
);
node(
  "multiple_orders_message",
  "message",
  2700,
  200,
  msgData("I found multiple recent orders:\n{{order_options_text}}", [])
);
node(
  "order_choice_input",
  "input",
  2940,
  200,
  inputData("Which order should I use?", "order_choice", [
    { label: "First", value: "1" },
    { label: "Second", value: "2" },
    { label: "Third", value: "3" }
  ])
);
node("select_order_script", "script", 3180, 200, scriptData(selectOrderScript, "select_order_result"));
node("order_choice_switch", "switch", 3420, 200, switchData("order_choice_state"));
node("order_service_switch", "switch", 3660, 200, switchData("journey_mode"));
node(
  "shipment_find",
  "record",
  3900,
  40,
  recordData({
    action: "list",
    collection: "retail_shipments",
    where: { order_id: "{{selected_order_id}}" },
    schema: schemas.shipments,
    outputVar: "shipment_find_result",
    limit: 5
  })
);
node(
  "shipment_status_script",
  "script",
  4140,
  40,
  scriptData(shipmentStatusScript, "shipment_status_result")
);
node(
  "order_status_message",
  "message",
  4380,
  40,
  msgData("{{shipment_status_message}}", [])
);
node("change_policy_script", "script", 3900, 120, scriptData(changePolicyScript, "change_policy_result"));
node("change_state_switch", "switch", 4140, 120, switchData("change_state"));
node(
  "change_message",
  "message",
  4380,
  120,
  msgData("{{change_message_text}}", [])
);
node("cancel_policy_script", "script", 3900, 200, scriptData(cancelPolicyScript, "cancel_policy_result"));
node("cancel_state_switch", "switch", 4140, 200, switchData("cancel_state"));
node(
  "cancel_message",
  "message",
  4380,
  200,
  msgData("{{cancel_message_text}}", [])
);
node(
  "cancel_confirm_input",
  "input",
  4620,
  200,
  inputData("Do you want me to cancel this order now?", "cancel_confirm", [
    { label: "Yes", value: "yes" },
    { label: "No", value: "no" }
  ])
);
node(
  "cancel_order_upsert",
  "record",
  4860,
  200,
  recordData({
    action: "upsert",
    collection: "retail_orders",
    where: { order_id: "{{selected_order_id}}" },
    uniqueKey: "order_id",
    idempotencyKey: "{{selected_order_id}}:cancel",
    data: {
      order_id: "{{selected_order_id}}",
      order_number: "{{selected_order_number}}",
      customer_id: "{{customer_id}}",
      customer_mobile: "{{customer_mobile}}",
      customer_name: "{{customer_name}}",
      status: "cancelled",
      payment_status: "{{selected_order_payment_status}}",
      fulfillment_status: "{{selected_order_fulfillment_status}}",
      grand_total_minor: "{{selected_order_total_minor}}",
      primary_item_name: "{{selected_order_primary_item}}",
      invoice_url: "{{selected_invoice_url}}",
      delivery_address_summary: "{{order_payload.delivery_address_summary}}",
      order_date: "{{selected_order_date}}",
      delivered_at: "{{selected_order_delivered_at}}"
    },
    schema: schemas.orders,
    outputVar: "cancel_order_upsert_result"
  })
);
node(
  "cancel_refund_upsert",
  "record",
  5100,
  200,
  recordData({
    action: "upsert",
    collection: "retail_refunds",
    where: { refund_number: "{{selected_order_number}}-RF" },
    uniqueKey: "refund_number",
    idempotencyKey: "{{selected_order_id}}:cancel_refund",
    data: {
      refund_id: "{{selected_order_id}}:refund",
      refund_number: "{{selected_order_number}}-RF",
      order_id: "{{selected_order_id}}",
      order_number: "{{selected_order_number}}",
      provider_reference: "{{selected_order_number}}-RF",
      amount_minor: "{{selected_order_total_minor}}",
      status: "requested",
      processed_at: "2026-08-25T10:45:00.000Z",
      expected_credit_window: "3-7 business days"
    },
    schema: schemas.refunds,
    outputVar: "cancel_refund_upsert_result"
  })
);
node(
  "cancel_done_message",
  "message",
  5340,
  200,
  msgData(
    "Order {{selected_order_number}} has been cancelled. If it was prepaid, the refund has been initiated to the original payment method.",
    []
  )
);
node("return_policy_script", "script", 3900, 280, scriptData(returnPolicyScript, "return_policy_result"));
node("return_state_switch", "switch", 4140, 280, switchData("return_state"));
node(
  "return_message",
  "message",
  4380,
  280,
  msgData("{{return_message_text}}", [])
);
node(
  "return_reason_input",
  "input",
  4620,
  280,
  inputData("What is the return reason?", "return_reason", [
    { label: "Wrong Size", value: "size_issue" },
    { label: "Damaged", value: "damaged" },
    { label: "Wrong Item", value: "wrong_item" },
    { label: "Not as Expected", value: "expectation_mismatch" }
  ])
);
node(
  "return_record",
  "record",
  4860,
  280,
  recordData({
    action: "upsert",
    collection: "retail_returns",
    where: { return_number: "{{selected_order_number}}-RT" },
    uniqueKey: "return_number",
    idempotencyKey: "{{selected_order_id}}:{{return_reason}}",
    data: {
      return_id: "{{selected_order_id}}:return",
      return_number: "{{selected_order_number}}-RT",
      order_id: "{{selected_order_id}}",
      order_number: "{{selected_order_number}}",
      order_item_id: "{{selected_order_id}}:1",
      reason_code: "{{return_reason}}",
      resolution_type: "refund",
      status: "requested",
      requested_at: "2026-08-25T11:00:00.000Z"
    },
    schema: schemas.returns,
    outputVar: "return_record_result"
  })
);
node(
  "return_done_message",
  "message",
  5100,
  280,
  msgData(
    "Return request {{selected_order_number}}-RT has been created. I’ve kept the reason as {{return_reason}} and the next step is pickup scheduling or manual review if needed.",
    []
  )
);
node("exchange_policy_script", "script", 3900, 360, scriptData(exchangePolicyScript, "exchange_policy_result"));
node(
  "exchange_message",
  "message",
  4140,
  360,
  msgData("{{exchange_message_text}}", [])
);
node(
  "exchange_record",
  "record",
  4380,
  360,
  recordData({
    action: "upsert",
    collection: "retail_returns",
    where: { return_number: "{{selected_order_number}}-EX" },
    uniqueKey: "return_number",
    idempotencyKey: "{{selected_order_id}}:exchange",
    data: {
      return_id: "{{selected_order_id}}:exchange",
      return_number: "{{selected_order_number}}-EX",
      order_id: "{{selected_order_id}}",
      order_number: "{{selected_order_number}}",
      order_item_id: "{{selected_order_id}}:1",
      reason_code: "exchange_requested",
      resolution_type: "exchange",
      status: "requested",
      requested_at: "2026-08-25T11:05:00.000Z"
    },
    schema: schemas.returns,
    outputVar: "exchange_record_result"
  })
);
node(
  "exchange_done_message",
  "message",
  4620,
  360,
  msgData(
    "Exchange request {{selected_order_number}}-EX has been created. If the replacement stays unavailable, I’ll fall back to refund or back-in-stock follow-up.",
    []
  )
);
node(
  "refund_find",
  "record",
  3900,
  440,
  recordData({
    action: "list",
    collection: "retail_refunds",
    where: { order_id: "{{selected_order_id}}" },
    schema: schemas.refunds,
    outputVar: "refund_find_result",
    limit: 5
  })
);
node("refund_status_script", "script", 4140, 440, scriptData(refundStatusScript, "refund_status_result"));
node(
  "refund_status_message",
  "message",
  4380,
  440,
  msgData("{{refund_status_message}}", [])
);
node(
  "invoice_message",
  "message",
  3900,
  520,
  msgData(
    "Invoice for {{selected_order_number}} is available here:\n{{selected_invoice_url}}",
    []
  )
);
node("warranty_script", "script", 3900, 600, scriptData(warrantyScript, "warranty_result"));
node("warranty_state_switch", "switch", 4140, 600, switchData("warranty_state"));
node(
  "warranty_message",
  "message",
  4380,
  600,
  msgData("{{warranty_message_text}}", [])
);

node(
  "policy_question_input",
  "input",
  1740,
  760,
  inputData("Which policy do you need?", "policy_question", [
    { label: "Return Policy", value: "return" },
    { label: "Exchange Policy", value: "exchange" },
    { label: "Shipping Charges", value: "shipping" },
    { label: "Refund Timeline", value: "refund" },
    { label: "Warranty", value: "warranty" }
  ])
);
node(
  "policy_find",
  "record",
  1980,
  760,
  recordData({
    action: "list",
    collection: "retail_policy_rules",
    where: { status: "active" },
    schema: schemas.policyRules,
    outputVar: "policy_find_result",
    limit: 20
  })
);
node(
  "policy_answer_script",
  "script",
  2220,
  760,
  scriptData(policyAnswerScript, "policy_answer_result")
);
node(
  "policy_message",
  "message",
  2460,
  760,
  msgData("{{policy_answer_text}}", [])
);

node(
  "support_summary_message",
  "message",
  1740,
  980,
  msgData(
    "I’ll create a structured support case with the customer, order, issue summary, and attempted actions so the human team does not need the customer to repeat everything.",
    []
  )
);
node(
  "support_case_script",
  "script",
  1980,
  980,
  scriptData(supportCaseScript, "support_case_script_result")
);
node(
  "support_case_upsert",
  "record",
  2220,
  980,
  recordData({
    action: "upsert",
    collection: "retail_support_cases",
    where: { case_number: "{{case_number}}" },
    uniqueKey: "case_number",
    idempotencyKey: "{{case_number}}",
    data: {
      support_case_id: "{{support_case_id}}",
      case_number: "{{case_number}}",
      customer_mobile: "{{customer_mobile}}",
      order_number: "{{selected_order_number}}",
      issue_type: "{{support_case_payload.issue_type}}",
      priority: "{{support_case_payload.priority}}",
      status: "open",
      summary: "{{support_case_payload.summary}}",
      queue_name: "retail_exceptions"
    },
    schema: schemas.supportCases,
    outputVar: "support_case_upsert_result"
  })
);
node(
  "support_queue",
  "queue",
  2460,
  980,
  queueData("retail_exceptions", "high", "returns,refunds,delivery,payments", 15, "support_queue_result")
);
node(
  "support_handover",
  "handover",
  2700,
  980,
  handoverData(
    "A retail support specialist has the full case context, including customer identity, order number, issue summary, policy result, and attempted self-service steps."
  )
);

node(
  "stock_subscription_upsert",
  "record",
  4860,
  -480,
  recordData({
    action: "upsert",
    collection: "retail_stock_subscriptions",
    where: { subscription_id: "{{selected_variant_id}}:{{customer_mobile}}" },
    uniqueKey: "subscription_id",
    idempotencyKey: "{{selected_variant_id}}:{{customer_mobile}}",
    data: {
      subscription_id: "{{selected_variant_id}}:{{customer_mobile}}",
      customer_mobile: "{{customer_mobile}}",
      product_id: "{{selected_product_id}}",
      variant_id: "{{selected_variant_id}}",
      sku: "{{selected_sku}}",
      channel: "whatsapp",
      status: "active"
    },
    schema: schemas.stockSubscriptions,
    outputVar: "stock_subscription_upsert_result"
  })
);
node(
  "stock_subscription_message",
  "message",
  5100,
  -480,
  msgData(
    "Back-in-stock alert created for {{selected_product_name}} / {{selected_variant_name}}. I’ll notify the saved contact when this variant becomes available.",
    []
  )
);

node(
  "system_failure_message",
  "message",
  1740,
  1180,
  msgData(
    "I hit a system or data issue before I could complete the request safely. I’m routing this with context instead of guessing.",
    []
  )
);
node(
  "system_failure_handover",
  "handover",
  1980,
  1180,
  handoverData(
    "The case has been handed to the operations team with captured shopping intent, order context if present, and the failing automation step."
  )
);

node("done_end", "end", 9300, 0, {});
node("policy_end", "end", 2700, 760, {});
node("no_order_end", "end", 2940, 40, {});
node("no_results_end", "end", 2700, -680, {});
node("empty_cart_end", "end", 7260, -320, {});

edge("start", "welcome_message");
edge("welcome_message", "customer_input");
edge("customer_input", "detect_language_script");
edge("detect_language_script", "extract_request_script", { condition: { operator: "equals", value: "success" }, label: "success" });
edge("detect_language_script", "system_failure_message", { isDefault: true, label: "failed/default" });
edge("extract_request_script", "main_intent_switch", { condition: { operator: "equals", value: "success" }, label: "success" });
edge("extract_request_script", "system_failure_message", { isDefault: true, label: "failed/default" });

edgeValue("main_intent_switch", "find_products", "set_mode_discover", "find_products");
edgeValue("main_intent_switch", "product_recommendation", "set_mode_discover", "recommendation");
edgeValue("main_intent_switch", "compare_products", "set_mode_compare", "compare_products");
edgeValue("main_intent_switch", "check_stock", "set_mode_stock", "check_stock");
edgeValue("main_intent_switch", "price_offers", "set_mode_discover", "price_offers");
edgeValue("main_intent_switch", "cart_assistance", "set_mode_cart", "cart_assistance");
edgeValue("main_intent_switch", "checkout_payment", "set_mode_checkout", "checkout_payment");
edgeValue("main_intent_switch", "track_order", "set_mode_order_status", "track_order");
edgeValue("main_intent_switch", "change_order", "set_mode_change", "change_order");
edgeValue("main_intent_switch", "cancel_order", "set_mode_cancel", "cancel_order");
edgeValue("main_intent_switch", "return_product", "set_mode_return", "return_product");
edgeValue("main_intent_switch", "exchange_product", "set_mode_exchange", "exchange_product");
edgeValue("main_intent_switch", "refund_status", "set_mode_refund", "refund_status");
edgeValue("main_intent_switch", "delivery_problem", "set_mode_delivery", "delivery_problem");
edgeValue("main_intent_switch", "damaged_or_wrong_item", "set_mode_delivery", "damaged_or_wrong_item");
edgeValue("main_intent_switch", "invoice_billing", "set_mode_invoice", "invoice_billing");
edgeValue("main_intent_switch", "warranty_support", "set_mode_warranty", "warranty_support");
edgeValue("main_intent_switch", "policies_faq", "set_mode_policy", "policies_faq");
edgeValue("main_intent_switch", "back_in_stock", "set_mode_back_in_stock", "back_in_stock");
edgeValue("main_intent_switch", "talk_to_support", "set_mode_support", "talk_to_support");
edge("main_intent_switch", "set_mode_discover", { isDefault: true, label: "default" });

for (const id of [
  "set_mode_discover",
  "set_mode_compare",
  "set_mode_stock",
  "set_mode_back_in_stock"
]) {
  edge(id, "catalog_find");
}
edge("set_mode_cart", "customer_contact_input");
edge("set_mode_checkout", "customer_contact_input");
edge("set_mode_add_to_cart", "customer_contact_input");
edge("set_mode_buy_now", "customer_contact_input");
edge("set_mode_notify_me", "customer_contact_input");
for (const id of [
  "set_mode_order_status",
  "set_mode_change",
  "set_mode_cancel",
  "set_mode_return",
  "set_mode_exchange",
  "set_mode_refund",
  "set_mode_delivery",
  "set_mode_invoice",
  "set_mode_warranty"
]) {
  edge(id, "order_lookup_input");
}
edge("set_mode_policy", "policy_question_input");
edge("set_mode_support", "support_summary_message");

recordRoutes("catalog_find", "rank_products_script", "system_failure_message", "rank_products_script", "rank_products_script");
edge("rank_products_script", "product_results_switch", { condition: { operator: "equals", value: "success" }, label: "success" });
edge("rank_products_script", "system_failure_message", { isDefault: true, label: "failed/default" });
edgeValue("product_results_switch", "exact", "product_results_carousel", "exact");
edgeValue("product_results_switch", "alternative", "product_results_carousel", "alternative");
edge("product_results_switch", "no_search_results_message", { isDefault: true, label: "none/default" });
edge("no_search_results_message", "no_results_end");
edge("product_results_carousel", "compare_pair_input");
edge("compare_pair_input", "compare_script");
edge("compare_script", "compare_result_switch", { condition: { operator: "equals", value: "success" }, label: "success" });
edge("compare_script", "system_failure_message", { isDefault: true, label: "failed/default" });
edgeValue("compare_result_switch", "ready", "compare_message", "ready");
edge("compare_result_switch", "product_choice_input", { isDefault: true, label: "invalid/default" });
edge("compare_message", "product_choice_input");
edge("product_results_carousel", "product_choice_input");
edge("product_choice_input", "select_product_script");
edge("select_product_script", "selected_product_switch", { condition: { operator: "equals", value: "success" }, label: "success" });
edge("select_product_script", "system_failure_message", { isDefault: true, label: "failed/default" });
edgeValue("selected_product_switch", "selected", "selected_product_message", "selected");
edge("selected_product_switch", "no_search_results_message", { isDefault: true, label: "not_found/default" });
edge("selected_product_message", "selected_product_action_input");
edge("selected_product_action_input", "selected_product_action_switch");
edgeValue("selected_product_action_switch", "check_stock", "stock_script", "check_stock");
edgeValue("selected_product_action_switch", "notify_me", "set_mode_notify_me", "notify_me");
edgeValue("selected_product_action_switch", "add_to_cart", "set_mode_add_to_cart", "add_to_cart");
edge("selected_product_action_switch", "set_mode_buy_now", { isDefault: true, label: "buy_now/default" });

edge("stock_script", "stock_switch", { condition: { operator: "equals", value: "success" }, label: "success" });
edge("stock_script", "system_failure_message", { isDefault: true, label: "failed/default" });
edgeValue("stock_switch", "available", "stock_message", "available");
edge("stock_switch", "stock_unavailable_message", { isDefault: true, label: "unavailable/default" });
edge("stock_message", "done_end");
edge("stock_unavailable_message", "set_mode_notify_me");

recordRoutes("customer_find", "ensure_customer_script", "ensure_customer_script", "ensure_customer_script", "ensure_customer_script");
edge("customer_contact_input", "customer_find");
edge("ensure_customer_script", "customer_upsert", { condition: { operator: "equals", value: "success" }, label: "success" });
edge("ensure_customer_script", "system_failure_message", { isDefault: true, label: "failed/default" });
recordRoutes("customer_upsert", "customer_post_lookup_switch", "system_failure_message");
edgeValue("customer_post_lookup_switch", "notify_me", "stock_subscription_upsert", "notify_me");
edgeValue("customer_post_lookup_switch", "cart", "cart_find", "cart");
edgeValue("customer_post_lookup_switch", "checkout", "cart_find", "checkout");
edgeValue("customer_post_lookup_switch", "buy_now", "cart_find", "buy_now");
edgeValue("customer_post_lookup_switch", "add_to_cart", "cart_find", "add_to_cart");
edge("customer_post_lookup_switch", "cart_find", { isDefault: true, label: "default" });
recordRoutes("cart_find", "add_to_cart_script", "cart_summary_script", "add_to_cart_script", "cart_summary_script");

edge("add_to_cart_script", "cart_upsert", { condition: { operator: "equals", value: "success" }, label: "success" });
edge("add_to_cart_script", "system_failure_message", { isDefault: true, label: "failed/default" });
recordRoutes("cart_upsert", "cart_item_upsert", "system_failure_message");
recordRoutes("cart_item_upsert", "cart_added_message", "system_failure_message");
edge("cart_added_message", "post_cart_action_input");
edge("post_cart_action_input", "post_cart_action_switch");
edgeValue("post_cart_action_switch", "continue", "done_end", "continue");
edgeValue("post_cart_action_switch", "view_cart", "cart_summary_script", "view_cart");
edge("post_cart_action_switch", "checkout_prepare_script", { isDefault: true, label: "checkout/default" });
edge("cart_summary_script", "cart_summary_switch", { condition: { operator: "equals", value: "success" }, label: "success" });
edge("cart_summary_script", "system_failure_message", { isDefault: true, label: "failed/default" });
edgeValue("cart_summary_switch", "ready", "cart_summary_message", "ready");
edge("cart_summary_switch", "no_cart_message", { isDefault: true, label: "empty/default" });
edge("cart_summary_message", "done_end");
edge("no_cart_message", "empty_cart_end");

edge("checkout_prepare_script", "checkout_state_switch", { condition: { operator: "equals", value: "success" }, label: "success" });
edge("checkout_prepare_script", "system_failure_message", { isDefault: true, label: "failed/default" });
edgeValue("checkout_state_switch", "ready", "checkout_summary_message", "ready");
edge("checkout_state_switch", "no_cart_message", { isDefault: true, label: "no_cart/default" });
edge("checkout_summary_message", "reservation_upsert");
recordRoutes("reservation_upsert", "checkout_payment", "system_failure_message");
edge("checkout_payment", "create_order_script", { condition: { operator: "equals", value: "paid" }, label: "paid" });
edge("checkout_payment", "system_failure_message", { isDefault: true, label: "failed/default" });
edge("create_order_script", "order_upsert", { condition: { operator: "equals", value: "success" }, label: "success" });
edge("create_order_script", "system_failure_message", { isDefault: true, label: "failed/default" });
recordRoutes("order_upsert", "order_item_upsert", "system_failure_message");
recordRoutes("order_item_upsert", "shipment_upsert", "system_failure_message");
recordRoutes("shipment_upsert", "reservation_consumed_update", "system_failure_message");
recordRoutes("reservation_consumed_update", "order_confirmation_notify", "system_failure_message");
notificationRoutes("order_confirmation_notify", "order_confirmation_message");
edge("order_confirmation_message", "done_end");

edge("order_lookup_input", "order_find");
recordRoutes("order_find", "order_lookup_script", "system_failure_message", "order_lookup_script", "order_lookup_script");
edge("order_lookup_script", "order_lookup_switch", { condition: { operator: "equals", value: "success" }, label: "success" });
edge("order_lookup_script", "system_failure_message", { isDefault: true, label: "failed/default" });
edgeValue("order_lookup_switch", "single", "order_service_switch", "single");
edgeValue("order_lookup_switch", "multiple", "multiple_orders_message", "multiple");
edge("order_lookup_switch", "no_order_message", { isDefault: true, label: "none/default" });
edge("multiple_orders_message", "order_choice_input");
edge("order_choice_input", "select_order_script");
edge("select_order_script", "order_choice_switch", { condition: { operator: "equals", value: "success" }, label: "success" });
edge("select_order_script", "system_failure_message", { isDefault: true, label: "failed/default" });
edgeValue("order_choice_switch", "selected", "order_service_switch", "selected");
edge("order_choice_switch", "no_order_message", { isDefault: true, label: "invalid/default" });
edge("no_order_message", "no_order_end");

edgeValue("order_service_switch", "order_status", "shipment_find", "order_status");
edgeValue("order_service_switch", "change_order", "change_policy_script", "change_order");
edgeValue("order_service_switch", "cancel_order", "cancel_policy_script", "cancel_order");
edgeValue("order_service_switch", "return_product", "return_policy_script", "return_product");
edgeValue("order_service_switch", "exchange_product", "exchange_policy_script", "exchange_product");
edgeValue("order_service_switch", "refund_status", "refund_find", "refund_status");
edgeValue("order_service_switch", "delivery_problem", "support_summary_message", "delivery_problem");
edgeValue("order_service_switch", "invoice_billing", "invoice_message", "invoice_billing");
edgeValue("order_service_switch", "warranty_support", "warranty_script", "warranty_support");
edge("order_service_switch", "support_summary_message", { isDefault: true, label: "default" });

recordRoutes("shipment_find", "shipment_status_script", "system_failure_message", "shipment_status_script", "shipment_status_script");
edge("shipment_status_script", "order_status_message", { condition: { operator: "equals", value: "success" }, label: "success" });
edge("shipment_status_script", "system_failure_message", { isDefault: true, label: "failed/default" });
edge("order_status_message", "done_end");

edge("change_policy_script", "change_state_switch", { condition: { operator: "equals", value: "success" }, label: "success" });
edge("change_policy_script", "system_failure_message", { isDefault: true, label: "failed/default" });
edgeValue("change_state_switch", "supported", "change_message", "supported");
edge("change_state_switch", "support_summary_message", { isDefault: true, label: "unsupported/default" });
edge("change_message", "done_end");

edge("cancel_policy_script", "cancel_state_switch", { condition: { operator: "equals", value: "success" }, label: "success" });
edge("cancel_policy_script", "system_failure_message", { isDefault: true, label: "failed/default" });
edgeValue("cancel_state_switch", "eligible", "cancel_message", "eligible");
edge("cancel_state_switch", "support_summary_message", { isDefault: true, label: "ineligible/default" });
edge("cancel_message", "cancel_confirm_input");
edgeValue("cancel_confirm_input", "yes", "cancel_order_upsert", "yes");
edge("cancel_confirm_input", "done_end", { isDefault: true, label: "no/default" });
recordRoutes("cancel_order_upsert", "cancel_refund_upsert", "system_failure_message");
recordRoutes("cancel_refund_upsert", "cancel_done_message", "system_failure_message");
edge("cancel_done_message", "done_end");

edge("return_policy_script", "return_state_switch", { condition: { operator: "equals", value: "success" }, label: "success" });
edge("return_policy_script", "system_failure_message", { isDefault: true, label: "failed/default" });
edgeValue("return_state_switch", "eligible", "return_message", "eligible");
edge("return_state_switch", "support_summary_message", { isDefault: true, label: "approval/default" });
edge("return_message", "return_reason_input");
edge("return_reason_input", "return_record");
recordRoutes("return_record", "return_done_message", "system_failure_message");
edge("return_done_message", "done_end");

edge("exchange_policy_script", "exchange_message", { condition: { operator: "equals", value: "success" }, label: "success" });
edge("exchange_policy_script", "system_failure_message", { isDefault: true, label: "failed/default" });
edge("exchange_message", "exchange_record");
recordRoutes("exchange_record", "exchange_done_message", "system_failure_message");
edge("exchange_done_message", "done_end");

recordRoutes("refund_find", "refund_status_script", "system_failure_message", "refund_status_script", "refund_status_script");
edge("refund_status_script", "refund_status_message", { condition: { operator: "equals", value: "success" }, label: "success" });
edge("refund_status_script", "system_failure_message", { isDefault: true, label: "failed/default" });
edge("refund_status_message", "done_end");

edge("invoice_message", "done_end");
edge("warranty_script", "warranty_state_switch", { condition: { operator: "equals", value: "success" }, label: "success" });
edge("warranty_script", "system_failure_message", { isDefault: true, label: "failed/default" });
edgeValue("warranty_state_switch", "covered", "warranty_message", "covered");
edge("warranty_state_switch", "support_summary_message", { isDefault: true, label: "expired/default" });
edge("warranty_message", "support_summary_message");

edge("policy_question_input", "policy_find");
recordRoutes("policy_find", "policy_answer_script", "system_failure_message", "policy_answer_script", "policy_answer_script");
edge("policy_answer_script", "policy_message", { condition: { operator: "equals", value: "success" }, label: "success" });
edge("policy_answer_script", "system_failure_message", { isDefault: true, label: "failed/default" });
edge("policy_message", "policy_end");

edge("support_summary_message", "support_case_script");
edge("support_case_script", "support_case_upsert", { condition: { operator: "equals", value: "success" }, label: "success" });
edge("support_case_script", "system_failure_message", { isDefault: true, label: "failed/default" });
recordRoutes("support_case_upsert", "support_queue", "system_failure_message");
edge("support_queue", "support_handover", { condition: { operator: "equals", value: "assigned" }, label: "assigned" });
edge("support_queue", "support_handover", { condition: { operator: "equals", value: "queued" }, label: "queued" });
edge("support_queue", "support_handover", { isDefault: true, label: "failed/default" });

recordRoutes("stock_subscription_upsert", "stock_subscription_message", "system_failure_message");
edge("stock_subscription_message", "done_end");

edge("system_failure_message", "system_failure_handover");

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
