import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const sourcePath = join(
  rootDir,
  "domains",
  "hospital",
  "templates-source",
  "hospital-full-automation.source.flow.json"
);

const doc = JSON.parse(readFileSync(sourcePath, "utf8"));
const flow = doc.flow;
const nodes = flow.nodes;
const edges = flow.edges;

const DOCTORS_SCHEMA = {
  fields: {
    branch_id: { type: "string", required: false },
    doctor_id: { type: "string", required: true },
    image_url: { type: "url", required: false },
    languages: { type: "string", required: false },
    department: { type: "string", required: true },
    display_name: { type: "string", required: true },
    qualification: { type: "string", required: false },
    profile_summary: { type: "string", required: false },
    consultation_fee: { type: "number", required: false },
    consultation_mode: { type: "string", required: false },
    doctor_scope_key: { type: "string", unique: true, required: true },
    branch_name: { type: "string", required: false },
    title: { type: "string", required: false },
    consultation_type_label: { type: "string", required: false },
    schedule_source: { type: "string", required: false },
    is_active: { type: "boolean", required: false }
  },
  collection: "doctors"
};

const RULES_SCHEMA = {
  fields: {
    rule_id: { type: "string", unique: true, required: true },
    doctor_scope_key: { type: "string", required: false },
    doctor_id: { type: "string", required: true },
    display_name: { type: "string", required: false },
    department: { type: "string", required: true },
    branch_id: { type: "string", required: false },
    branch_name: { type: "string", required: false },
    consultation_mode: { type: "string", required: false },
    consultation_type_label: { type: "string", required: false },
    weekdays: { type: "string", required: false },
    start_time: { type: "string", required: true },
    end_time: { type: "string", required: true },
    slot_duration_minutes: { type: "number", required: false },
    buffer_minutes: { type: "number", required: false },
    consultation_fee: { type: "number", required: false },
    capacity: { type: "number", required: false },
    timezone: { type: "string", required: false },
    valid_from: { type: "string", required: false },
    valid_until: { type: "string", required: false },
    is_active: { type: "boolean", required: false }
  },
  collection: "doctor_availability_rules"
};

const EXCEPTIONS_SCHEMA = {
  fields: {
    exception_id: { type: "string", unique: true, required: false },
    doctor_id: { type: "string", required: true },
    branch_id: { type: "string", required: false },
    consultation_mode: { type: "string", required: false },
    exception_date: { type: "string", required: true },
    exception_type: { type: "string", required: true },
    start_time: { type: "string", required: false },
    end_time: { type: "string", required: false },
    slot_duration_minutes: { type: "number", required: false },
    buffer_minutes: { type: "number", required: false },
    capacity: { type: "number", required: false },
    timezone: { type: "string", required: false },
    is_active: { type: "boolean", required: false }
  },
  collection: "doctor_schedule_exceptions"
};

const BOOKING_POLICY_SCHEMA = {
  fields: {
    policy_id: { type: "string", unique: true, required: true },
    minimum_advance_minutes: { type: "number", required: false },
    maximum_advance_booking_days: { type: "number", required: false },
    hold_ttl_minutes: { type: "number", required: false },
    cancellation_cutoff_hours: { type: "number", required: false },
    reschedule_cutoff_hours: { type: "number", required: false },
    timezone: { type: "string", required: false },
    allow_same_day_booking: { type: "boolean", required: false },
    allow_waitlist: { type: "boolean", required: false },
    is_active: { type: "boolean", required: false }
  },
  collection: "appointment_booking_policies"
};

const RESERVATIONS_SCHEMA = {
  fields: {
    reservation_id: { type: "string", unique: true, required: true },
    reservation_key: { type: "string", required: true },
    slot_id: { type: "string", required: true },
    source_rule_id: { type: "string", required: false },
    doctor_id: { type: "string", required: true },
    doctor_name: { type: "string", required: false },
    department: { type: "string", required: true },
    branch_id: { type: "string", required: false },
    branch_name: { type: "string", required: false },
    consultation_mode: { type: "string", required: false },
    consultation_type_label: { type: "string", required: false },
    appointment_date: { type: "string", required: true },
    start_time: { type: "string", required: true },
    end_time: { type: "string", required: true },
    slot_label: { type: "string", required: false },
    consultation_fee: { type: "number", required: false },
    hold_ttl_minutes: { type: "number", required: false },
    hold_expires_at: { type: "string", required: false },
    held_by_session: { type: "string", required: false },
    patient_id: { type: "string", required: false },
    patient_mobile: { type: "phone", required: false },
    patient_name: { type: "string", required: false },
    appointment_id: { type: "string", required: false },
    hold_id: { type: "string", required: false },
    payment_status: { type: "string", required: false },
    status: { type: "string", required: true },
    created_at: { type: "string", required: false }
  },
  collection: "appointment_reservations"
};

const APPOINTMENTS_SCHEMA = {
  fields: {
    status: {
      type: "enum",
      values: ["pending_payment", "confirmed", "manual_verify", "cancelled", "reschedule_requested", "completed"]
    },
    slot_id: { type: "string", required: false },
    branch_id: { type: "string", required: false },
    branch_name: { type: "string", required: false },
    doctor_id: { type: "string", required: false },
    doctor_name: { type: "string", required: false },
    department: { type: "string", required: true },
    patient_id: { type: "string", required: true },
    slot_label: { type: "string", required: false },
    slot_hold_id: { type: "string", required: false },
    appointment_id: { type: "string", unique: true, required: true },
    patient_mobile: { type: "phone", required: true },
    payment_status: {
      type: "enum",
      values: ["paid", "pending", "pay_at_hospital", "failed", "manual_verify"]
    },
    appointment_date: { type: "string", required: false },
    appointment_time: { type: "string", required: false },
    consultation_type: { type: "string", required: false },
    consultation_type_label: { type: "string", required: false },
    reservation_id: { type: "string", required: false },
    reservation_key: { type: "string", required: false }
  },
  collection: "appointments"
};

const BRANCH_BUTTONS = [
  { label: "Jubilee Hills Branch", value: "jubilee_hills_branch" },
  { label: "Miyapur Branch", value: "miyapur_branch" },
  { label: "Kukatpally Branch", value: "kukatpally_branch" },
  { label: "Madeenaguda Branch", value: "madeenaguda_branch" }
];

const DEPARTMENT_BUTTONS = [
  { label: "Gynecology", value: "gynecology" },
  { label: "Cardiology", value: "cardiology" },
  { label: "Dermatology", value: "dermatology" },
  { label: "ENT", value: "ent" },
  { label: "Ophthalmology", value: "ophthalmology" },
  { label: "Gastroenterology", value: "gastroenterology" },
  { label: "Endocrinology", value: "endocrinology" },
  { label: "Pulmonology", value: "pulmonology" },
  { label: "Psychiatry", value: "psychiatry" },
  { label: "Urology", value: "urology" },
  { label: "Nephrology", value: "nephrology" },
  { label: "General Surgery", value: "general_surgery" },
  { label: "Rheumatology", value: "rheumatology" },
  { label: "Oncology", value: "oncology" },
  { label: "Physiotherapy", value: "physiotherapy" },
  { label: "Dentistry", value: "dentistry" },
  { label: "Diabetology", value: "diabetology" },
  { label: "Emergency Medicine", value: "emergency_medicine" },
  { label: "Not sure / describe issue", value: "not_sure" }
];

function pretty(value) {
  return JSON.stringify(value, null, 2);
}

function getNode(id) {
  const node = nodes.find((item) => item.id === id);
  if (!node) throw new Error(`Missing node ${id}`);
  return node;
}

function upsertNode(node) {
  const index = nodes.findIndex((item) => item.id === node.id);
  if (index >= 0) nodes[index] = node;
  else nodes.push(node);
}

function removeEdge(id) {
  const index = edges.findIndex((item) => item.id === id);
  if (index >= 0) edges.splice(index, 1);
}

function upsertEdge(edge) {
  const index = edges.findIndex((item) => item.id === edge.id);
  if (index >= 0) edges[index] = edge;
  else edges.push(edge);
}

function replaceStringValuesDeep(value, replacements) {
  if (typeof value === "string") {
    let next = value;
    for (const [searchValue, replaceValue] of replacements) {
      next = next.split(searchValue).join(replaceValue);
    }
    return next;
  }
  if (Array.isArray(value)) {
    return value.map((entry) => replaceStringValuesDeep(entry, replacements));
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, replaceStringValuesDeep(entry, replacements)])
    );
  }
  return value;
}

function clonePosition(id, dx = 0, dy = 0) {
  const position = getNode(id).position;
  return { x: position.x + dx, y: position.y + dy };
}

function recordListData({ collection, where, outputVar, schema, limit = 200, sortBy = "updatedAt", sortOrder = "desc" }) {
  return {
    data: {},
    limit,
    where,
    action: "list",
    offset: 0,
    sortBy,
    dataJson: "{}",
    outputVar,
    piiFields: "",
    sortOrder,
    uniqueKey: "",
    whereJson: pretty(where),
    collection,
    encryptPii: false,
    softDelete: true,
    idempotencyKey: "",
    collectionSchema: schema,
    collectionSchemaJson: pretty(schema)
  };
}

function updateRecordNode(nodeId, { action, collection, where, data, outputVar, uniqueKey = "", idempotencyKey = "", sortBy = "updatedAt", sortOrder = "desc", schema }) {
  const node = getNode(nodeId);
  node.type = "record";
  node.data = {
    data: data ?? {},
    limit: 20,
    where,
    action,
    offset: 0,
    sortBy,
    dataJson: pretty(data ?? {}),
    outputVar,
    piiFields: "",
    sortOrder,
    uniqueKey,
    whereJson: pretty(where),
    collection,
    encryptPii: false,
    softDelete: true,
    idempotencyKey,
    collectionSchema: schema,
    collectionSchemaJson: pretty(schema)
  };
}

function normalizeScript() {
  return `
function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}
function titleCase(value) {
  return String(value || "")
    .replace(/[_-]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
function departmentLabel(value) {
  const raw = String(value || "").trim();
  if (!raw) return "Department";
  if (raw.toLowerCase() === "ent") return "ENT";
  return titleCase(raw);
}
function consultationLabel(value) {
  const raw = String(value || "").trim().toLowerCase();
  if (raw === "online") return "Online consultation";
  if (raw === "in_person") return "Hospital visit";
  return titleCase(raw);
}
`;
}

function availabilityScript({ rulesVar, exceptionsVar, reservationsVar, policyVar, slotsVar, routeVar, countVar, excludeSlotVar = "" }) {
  return `
${normalizeScript()}
function rowsFrom(value) {
  return Array.isArray(value?.data) ? value.data : Array.isArray(value) ? value : [];
}
function currentParts(timeZone, date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).formatToParts(date || new Date());
  const get = (type) => parts.find((part) => part.type === type)?.value || "00";
  return {
    date: get("year") + "-" + get("month") + "-" + get("day"),
    minutes: Number(get("hour")) * 60 + Number(get("minute"))
  };
}
function parseWeekdays(value) {
  if (Array.isArray(value)) return value.map((item) => Number(item)).filter((item) => Number.isFinite(item));
  const text = String(value || "").trim();
  if (!text) return [];
  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) return parsed.map((item) => Number(item)).filter((item) => Number.isFinite(item));
  } catch {}
  return text.split(",").map((item) => Number(String(item).trim())).filter((item) => Number.isFinite(item));
}
function toMinutes(value) {
  const raw = String(value || "").trim();
  const match = raw.match(/^([01]?\\d|2[0-3]):([0-5]\\d)$/);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}
function formatTime(minutes) {
  return String(Math.floor(minutes / 60)).padStart(2, "0") + ":" + String(minutes % 60).padStart(2, "0");
}
function addDays(date, days) {
  const [year, month, day] = String(date || "").split("-").map(Number);
  if (!year || !month || !day) return "";
  const value = new Date(Date.UTC(year, month - 1, day + days));
  return value.toISOString().slice(0, 10);
}
function dayOfWeek(date) {
  const [year, month, day] = String(date || "").split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}
function timeLabel(value) {
  const minutes = toMinutes(value);
  if (minutes == null) return String(value || "");
  const hour24 = Math.floor(minutes / 60);
  const minute = minutes % 60;
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return hour12 + ":" + String(minute).padStart(2, "0") + " " + (hour24 >= 12 ? "PM" : "AM");
}
function buildSlotId(item) {
  return String(
    item.slot_id ||
    (String(item.doctor_id || "doctor") + "_" + String(item.branch_id || "branch") + "_" + String(item.consultation_mode || "mode") + "_" + String(item.date || "").replace(/[^0-9-]/g, "") + "_" + String(item.start || "").replace(/[^0-9]/g, ""))
  )
    .replace(/[^a-zA-Z0-9_:-]+/g, "_")
    .replace(/^_+|_+$/g, "");
}
function reservationIsActive(row) {
  const status = String(row.status || "").toLowerCase();
  if (status === "pending_payment" || status === "confirmed" || status === "checked_in") return true;
  if (status !== "held") return false;
  const expiry = String(row.hold_expires_at || "").trim();
  return expiry ? Date.parse(expiry) > Date.now() : false;
}
function overlaps(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && bStart < aEnd;
}
const rules = rowsFrom(vars.${rulesVar});
const exceptions = rowsFrom(vars.${exceptionsVar});
const reservations = rowsFrom(vars.${reservationsVar}).filter(reservationIsActive);
const policy = rowsFrom(vars.${policyVar})[0] || {};
const timeZone = String(policy.timezone || "Asia/Kolkata");
const today = currentParts(timeZone, new Date());
const minimumAdvanceMinutes = Math.max(0, Number(policy.minimum_advance_minutes || 60) || 60);
const maximumAdvanceBookingDays = Math.max(1, Math.min(31, Number(policy.maximum_advance_booking_days || 31) || 31));
const holdTtlMinutes = Math.max(1, Number(policy.hold_ttl_minutes || 10) || 10);
const allowSameDay = String(policy.allow_same_day_booking ?? "true").toLowerCase() !== "false";
const cutoff = currentParts(timeZone, new Date(Date.now() + minimumAdvanceMinutes * 60000));
const candidates = [];
for (const rule of rules) {
  const weekdays = parseWeekdays(rule.weekdays);
  const duration = Math.max(5, Number(rule.slot_duration_minutes || 20) || 20);
  const buffer = Math.max(0, Number(rule.buffer_minutes || 0) || 0);
  const capacity = Math.max(1, Number(rule.capacity || 1) || 1);
  const step = duration + buffer;
  const validFrom = String(rule.valid_from || "").trim();
  const validUntil = String(rule.valid_until || "").trim();
  if (String(rule.is_active ?? "true").toLowerCase() === "false") continue;
  const startMinutes = toMinutes(rule.start_time);
  const endMinutes = toMinutes(rule.end_time);
  if (startMinutes == null || endMinutes == null || endMinutes <= startMinutes) continue;
  for (let offset = 0; offset < maximumAdvanceBookingDays; offset += 1) {
    const date = addDays(today.date, offset);
    if (!date) continue;
    if (!allowSameDay && date === today.date) continue;
    if (validFrom && date < validFrom) continue;
    if (validUntil && date > validUntil) continue;
    if (weekdays.length && !weekdays.includes(dayOfWeek(date))) continue;
    for (let start = startMinutes; start + duration <= endMinutes; start += step) {
      const slot = {
        source_rule_id: rule.rule_id || "",
        doctor_id: rule.doctor_id || vars.doctor_id || vars.reschedule_original_doctor_id || "",
        doctor_name: rule.display_name || rule.doctor_name || vars.appointment_doctor_name || vars.reschedule_original_doctor_name || "",
        department: rule.department || vars.department || vars.reschedule_original_department || "",
        branch_id: rule.branch_id || vars.doctor_scope_branch_id || vars.reschedule_original_branch_id || "",
        branch_name: rule.branch_name || vars.appointment_branch_name || vars.reschedule_original_branch_name || "",
        consultation_mode: rule.consultation_mode || vars.consultation_type || vars.reschedule_original_consultation_type || "",
        consultation_type_label: rule.consultation_type_label || vars.appointment_consultation_type_label || vars.reschedule_original_consultation_type_label || consultationLabel(rule.consultation_mode || vars.consultation_type || vars.reschedule_original_consultation_type || ""),
        date,
        start: formatTime(start),
        end: formatTime(start + duration),
        status: "available",
        consultation_fee: Number(rule.consultation_fee || vars.appointment_selected_doctor_fee || 800) || 800,
        hold_ttl_minutes: holdTtlMinutes,
        capacity
      };
      if (slot.date < cutoff.date || (slot.date === cutoff.date && toMinutes(slot.start) < cutoff.minutes)) continue;
      candidates.push(slot);
    }
  }
}
for (const exception of exceptions) {
  const exceptionType = String(exception.exception_type || "").toLowerCase();
  if (exceptionType !== "add") continue;
  if (String(exception.is_active ?? "true").toLowerCase() === "false") continue;
  const date = String(exception.exception_date || "").trim();
  if (!date) continue;
  if (date < cutoff.date || date > addDays(today.date, maximumAdvanceBookingDays - 1)) continue;
  if (!allowSameDay && date === today.date) continue;
  const duration = Math.max(5, Number(exception.slot_duration_minutes || 20) || 20);
  const buffer = Math.max(0, Number(exception.buffer_minutes || 0) || 0);
  const capacity = Math.max(1, Number(exception.capacity || 1) || 1);
  const step = duration + buffer;
  const startMinutes = toMinutes(exception.start_time);
  const endMinutes = toMinutes(exception.end_time);
  if (startMinutes == null || endMinutes == null || endMinutes <= startMinutes) continue;
  for (let start = startMinutes; start + duration <= endMinutes; start += step) {
    const slot = {
      source_rule_id: exception.rule_id || exception.exception_id || "",
      doctor_id: exception.doctor_id || vars.doctor_id || vars.reschedule_original_doctor_id || "",
      doctor_name: vars.appointment_doctor_name || vars.reschedule_original_doctor_name || "",
      department: vars.department || vars.reschedule_original_department || "",
      branch_id: exception.branch_id || vars.doctor_scope_branch_id || vars.reschedule_original_branch_id || "",
      branch_name: vars.appointment_branch_name || vars.reschedule_original_branch_name || "",
      consultation_mode: exception.consultation_mode || vars.consultation_type || vars.reschedule_original_consultation_type || "",
      consultation_type_label: vars.appointment_consultation_type_label || vars.reschedule_original_consultation_type_label || consultationLabel(exception.consultation_mode || vars.consultation_type || vars.reschedule_original_consultation_type || ""),
      date,
      start: formatTime(start),
      end: formatTime(start + duration),
      status: "available",
      consultation_fee: Number(vars.appointment_selected_doctor_fee || 800) || 800,
      hold_ttl_minutes: holdTtlMinutes,
      capacity
    };
    if (slot.date < cutoff.date || (slot.date === cutoff.date && toMinutes(slot.start) < cutoff.minutes)) continue;
    candidates.push(slot);
  }
}
const blocked = exceptions.filter((exception) => String(exception.exception_type || "").toLowerCase() === "block");
const unique = new Map();
for (const slot of candidates) {
  const slotId = buildSlotId(slot);
  const reservationKey = String(slot.doctor_id || "").toLowerCase() + "|" + slot.date + "|" + slot.start;
  const blockedHere = blocked.some((item) => {
    if (String(item.is_active ?? "true").toLowerCase() === "false") return false;
    if (String(item.doctor_id || "") !== String(slot.doctor_id || "")) return false;
    if (String(item.exception_date || "") !== slot.date) return false;
    if (String(item.branch_id || "").trim() && String(item.branch_id || "") !== String(slot.branch_id || "")) return false;
    if (String(item.consultation_mode || "").trim() && String(item.consultation_mode || "") !== String(slot.consultation_mode || "")) return false;
    const blockStart = toMinutes(item.start_time || "00:00");
    const blockEnd = toMinutes(item.end_time || "23:59");
    return overlaps(toMinutes(slot.start), toMinutes(slot.end), blockStart ?? 0, blockEnd ?? 24 * 60);
  });
  if (blockedHere) continue;
  const activeCount = reservations.filter((reservation) =>
    String(reservation.doctor_id || "") === String(slot.doctor_id || "") &&
    String(reservation.appointment_date || "") === slot.date &&
    overlaps(
      toMinutes(slot.start),
      toMinutes(slot.end),
      toMinutes(reservation.start_time || reservation.start || ""),
      toMinutes(reservation.end_time || reservation.end || "")
    )
  ).length;
  if (activeCount >= slot.capacity) continue;
  if (${excludeSlotVar ? `String(slotId) === String(vars.${excludeSlotVar} || "")` : "false"}) continue;
  unique.set(slotId, {
    ...slot,
    id: slotId,
    slot_id: slotId,
    reservation_key: reservationKey,
    label: timeLabel(slot.start) + " - " + timeLabel(slot.end)
  });
}
const slots = Array.from(unique.values()).sort((a, b) => (a.date + " " + a.start).localeCompare(b.date + " " + b.start));
vars.${slotsVar} = { data: slots };
vars.${routeVar} = slots.length > 0 ? "available" : "none";
vars.${countVar} = slots.length;
return { route: vars.${routeVar}, count: slots.length };
`;
}

function doctorOptionsScript({ routeVar, outputVar, listVarName, optionsVarName }) {
  return `
${normalizeScript()}
function matchesExpectedDoctorContext(row) {
  const expectedDepartment = String(vars.department || "").trim().toLowerCase();
  const expectedBranch = String(vars.doctor_scope_branch_id || vars.branch_id || "").trim().toLowerCase();
  const expectedMode = String(vars.consultation_type || "").trim().toLowerCase();
  if (String(row.is_active ?? "true").toLowerCase() === "false") return false;
  if (expectedDepartment && String(row.department || "").trim().toLowerCase() !== expectedDepartment) return false;
  if (expectedBranch && String(row.branch_id || "").trim().toLowerCase() !== expectedBranch) return false;
  if (expectedMode && String(row.consultation_mode || "").trim().toLowerCase() !== expectedMode) return false;
  return true;
}
const rows = Array.isArray(vars.appointment_doctors_result?.data) ? vars.appointment_doctors_result.data : [];
const unique = [];
const seen = new Set();
for (const row of rows.filter(matchesExpectedDoctorContext)) {
  const key = String(row.doctor_scope_key || row.doctor_id || "").trim();
  if (!key || seen.has(key)) continue;
  seen.add(key);
  unique.push(row);
}
unique.sort((a, b) => String(a.display_name || a.doctor_id || "").localeCompare(String(b.display_name || b.doctor_id || "")));
vars.${listVarName} = unique;
vars.${optionsVarName} = unique.map((row, index) => {
  const department = departmentLabel(row.department);
  const fee = Number(row.consultation_fee || 0) > 0 ? " | Fee INR " + Number(row.consultation_fee) : "";
  const mode = consultationLabel(row.consultation_mode);
  return String(index + 1) + ". " + (row.display_name || row.doctor_id || "Doctor") + " | " + department + " | " + (row.branch_name || titleCase(row.branch_id)) + " | " + mode + fee;
}).join("\\n");
if (unique.length === 0) {
  vars.${routeVar} = "none";
} else if (unique.length === 1) {
  vars.doctor_id = String(unique[0].doctor_id || "").trim();
  vars.${routeVar} = "single";
} else {
  vars.${routeVar} = "multiple";
}
return { route: vars.${routeVar}, count: unique.length };
`;
}

function doctorAlternativeRecoveryScript({ routeVar, promptVar, sourceVar, optionsVar, listVarName }) {
  return `
${normalizeScript()}
const selectedBranch = titleCase(vars.branch_id || vars.doctor_scope_branch_id || "");
const selectedDepartment = departmentLabel(vars.department || "");
const selectedMode = consultationLabel(vars.consultation_type || "");
const rows = Array.isArray(vars.${sourceVar}?.data) ? vars.${sourceVar}.data : [];
const unique = [];
const seen = new Set();
for (const row of rows) {
  if (String(row.is_active ?? "true").toLowerCase() === "false") continue;
  if (String(row.department || "").trim().toLowerCase() !== String(vars.department || "").trim().toLowerCase()) continue;
  if (String(row.consultation_mode || "").trim().toLowerCase() !== String(vars.consultation_type || "").trim().toLowerCase()) continue;
  const key = String(row.doctor_scope_key || row.doctor_id || "").trim();
  if (!key || seen.has(key)) continue;
  seen.add(key);
  unique.push(row);
}
unique.sort((a, b) => String(a.display_name || a.doctor_id || "").localeCompare(String(b.display_name || b.doctor_id || "")));
vars.${listVarName} = unique;
vars.${optionsVar} = unique.map((row, index) => {
  const fee = Number(row.consultation_fee || 0) > 0 ? " | Fee INR " + Number(row.consultation_fee) : "";
  return String(index + 1) + ". " + (row.display_name || row.doctor_id || "Doctor") + " | " + (row.branch_name || titleCase(row.branch_id || "")) + fee;
}).join("\\n");
if (unique.length === 0) {
  vars.${routeVar} = "none";
  vars.${promptVar} = "I could not find an active " + selectedDepartment + " doctor for " + selectedMode + " right now. Please choose another department or consultation type.";
  return { route: vars.${routeVar}, count: 0 };
}
vars.${routeVar} = "available";
vars.${promptVar} = "I could not find a " + selectedDepartment + " doctor at " + selectedBranch + " for " + selectedMode + ". These available options match your request:\\n\\nReply with the number or doctor ID from the list below:\\n\\n" + vars.${optionsVar};
return { route: vars.${routeVar}, count: unique.length };
`;
}

function displayLabelsScript({ doctorChoiceVar, sourceVar = "appointment_doctors_result", allowCrossBranchSelection = false }) {
  return `
${normalizeScript()}
const rows = Array.isArray(vars.${sourceVar}?.data) ? vars.${sourceVar}.data : [];
function matchesExpectedDoctorContext(row) {
  const expectedDepartment = String(vars.department || "").trim().toLowerCase();
  const expectedBranch = String(vars.doctor_scope_branch_id || vars.branch_id || "").trim().toLowerCase();
  const expectedMode = String(vars.consultation_type || "").trim().toLowerCase();
  if (String(row.is_active ?? "true").toLowerCase() === "false") return false;
  if (expectedDepartment && String(row.department || "").trim().toLowerCase() !== expectedDepartment) return false;
  if (!${allowCrossBranchSelection ? "true" : "false"} && expectedBranch && String(row.branch_id || "").trim().toLowerCase() !== expectedBranch) return false;
  if (expectedMode && String(row.consultation_mode || "").trim().toLowerCase() !== expectedMode) return false;
  return true;
}
const choice = String(vars.${doctorChoiceVar} || vars.doctor_id || "").trim();
const normalizedChoice = normalizeText(choice);
const indexedRows = rows
  .filter(matchesExpectedDoctorContext)
  .filter((row, index, source) => source.findIndex((item) => String(item.doctor_scope_key || item.doctor_id || "") === String(row.doctor_scope_key || row.doctor_id || "")) === index)
  .sort((a, b) => String(a.display_name || a.doctor_id || "").localeCompare(String(b.display_name || b.doctor_id || "")));
let selected = indexedRows[0] || {};
const number = Number(choice);
if (Number.isInteger(number) && number >= 1 && number <= indexedRows.length) {
  selected = indexedRows[number - 1];
} else {
  const match = indexedRows.find((row) => {
    const doctorId = String(row.doctor_id || "").trim();
    const scopeKey = String(row.doctor_scope_key || "").trim();
    const displayName = normalizeText(row.display_name || "");
    const title = normalizeText(row.title || "");
    return doctorId === choice || scopeKey === choice || displayName === normalizedChoice || title === normalizedChoice;
  });
  if (match) selected = match;
}
vars.appointment_selected_doctor_record = selected;
vars.doctor_id = String(selected.doctor_id || vars.doctor_id || "").trim();
vars.doctor_scope_branch_id = String(selected.branch_id || vars.doctor_scope_branch_id || vars.branch_id || "").trim();
vars.appointment_selected_doctor_scope_key = String(selected.doctor_scope_key || "").trim();
vars.appointment_selected_doctor_fee = Number(selected.consultation_fee || vars.appointment_selected_doctor_fee || vars.appointment_fee || 800) || 800;
vars.appointment_doctor_name = selected.display_name || titleCase(vars.doctor_id || "doctor");
vars.appointment_department_name = departmentLabel(selected.department || vars.department || "");
vars.appointment_branch_name = selected.branch_name || titleCase(selected.branch_id || vars.branch_id || "");
vars.appointment_consultation_type_label = selected.consultation_type_label || consultationLabel(selected.consultation_mode || vars.consultation_type || "");
vars.appointment_booking_fee = vars.appointment_selected_doctor_fee;
vars.payment_status_label = String(vars.payment_status || "pending");
vars.appointment_alternative_doctor_prompt = "";
return {
  doctor: vars.appointment_doctor_name,
  department: vars.appointment_department_name,
  branch: vars.appointment_branch_name,
  consultation_type: vars.appointment_consultation_type_label
};
`;
}

function upcomingLikeScript({ sourceVar, optionsTextVar = "", routeVar, prefix }) {
  const setOptions = optionsTextVar
    ? `vars.${optionsTextVar} = future.map((item, index) => String(index + 1) + ". " + appointmentLine(item, false)).join("\\n");`
    : "";
  return `
${normalizeScript()}
const rows = Array.isArray(vars.${sourceVar}?.data) ? vars.${sourceVar}.data : [];
function currentParts() {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).formatToParts(new Date()).reduce((acc, part) => {
    acc[part.type] = part.value;
    return acc;
  }, {});
}
function dateOnly(value) {
  const raw = String(value || "").trim();
  const iso = raw.match(/^(\\d{4})-(\\d{2})-(\\d{2})/);
  if (iso) return iso[1] + "-" + iso[2] + "-" + iso[3];
  const dmy = raw.match(/^(\\d{2})[-/](\\d{2})[-/](\\d{4})/);
  if (dmy) return dmy[3] + "-" + dmy[2] + "-" + dmy[1];
  return raw.slice(0, 10);
}
function toMinutes(value) {
  const raw = String(value || "").trim();
  const hhmm = raw.match(/([01]?\\d|2[0-3]):([0-5]\\d)/);
  if (hhmm) return Number(hhmm[1]) * 60 + Number(hhmm[2]);
  const meridian = raw.match(/(\\d{1,2}):(\\d{2})\\s*(AM|PM)/i);
  if (!meridian) return null;
  let hour = Number(meridian[1]);
  const minute = Number(meridian[2]);
  const suffix = meridian[3].toUpperCase();
  if (suffix === "PM" && hour < 12) hour += 12;
  if (suffix === "AM" && hour === 12) hour = 0;
  return hour * 60 + minute;
}
function paymentLabel(value) {
  const raw = String(value || "").trim();
  const map = { paid: "Paid", pending: "Pending", pay_at_hospital: "Pay at hospital", failed: "Payment failed", manual_verify: "Verification pending" };
  return map[raw] || titleCase(raw);
}
function appointmentLine(item, withStatus) {
  const doctor = item.doctor_name || titleCase(item.doctor_id || "doctor");
  const department = departmentLabel(item.department || "");
  const branch = item.branch_name || titleCase(item.branch_id || "");
  const mode = item.consultation_type_label || consultationLabel(item.consultation_type || item.consultation_mode || "");
  const when = dateOnly(item.appointment_date || item.date) + " at " + (item.slot_label || item.appointment_time || item.start_time || "");
  const base = doctor + " | " + department + " | " + branch + " | " + mode + " | " + when;
  if (!withStatus) return base;
  return base + " | Appointment: " + String(item.status || "Status not available") + " | Payment: " + paymentLabel(item.payment_status || "");
}
const parts = currentParts();
const nowDate = parts.year + "-" + parts.month + "-" + parts.day;
const nowMinutes = Number(parts.hour) * 60 + Number(parts.minute);
const future = rows.filter((item) => {
  const date = dateOnly(item.appointment_date || item.date);
  if (!date) return false;
  if (String(item.status || "").toLowerCase() !== "confirmed") return false;
  if (date > nowDate) return true;
  if (date < nowDate) return false;
  const minutes = toMinutes(item.appointment_time || item.slot_label || item.start_time || "");
  return minutes != null && minutes > nowMinutes;
}).sort((a, b) => (String(a.appointment_date || "").localeCompare(String(b.appointment_date || "")) || String(a.appointment_time || a.slot_label || "").localeCompare(String(b.appointment_time || b.slot_label || ""))));
vars.${routeVar} = future.length === 0 ? "none" : future.length === 1 ? "single" : "multiple";
${setOptions}
const first = future[0] || {};
vars.${prefix}_future_appointments = future;
vars.${prefix}_future_appointment_count = future.length;
vars.${prefix}_original_appointment_id = first.appointment_id || "";
vars.${prefix}_original_patient_id = first.patient_id || ("PAT-" + String(vars.patient_mobile || ""));
vars.${prefix}_original_slot_id = first.slot_id || "";
vars.${prefix}_original_slot_hold_id = first.slot_hold_id || "";
vars.${prefix}_original_slot_label = first.slot_label || "";
vars.${prefix}_original_doctor_id = first.doctor_id || "";
vars.${prefix}_original_doctor_name = first.doctor_name || titleCase(first.doctor_id || "doctor");
vars.${prefix}_original_branch_id = first.branch_id || "";
vars.${prefix}_original_branch_name = first.branch_name || titleCase(first.branch_id || "");
vars.${prefix}_original_department = first.department || "";
vars.${prefix}_original_department_name = departmentLabel(first.department || "");
vars.${prefix}_original_consultation_type = first.consultation_type || "";
vars.${prefix}_original_consultation_type_label = first.consultation_type_label || consultationLabel(first.consultation_type || "");
vars.${prefix}_original_appointment_date = dateOnly(first.appointment_date || first.date) || "";
vars.${prefix}_original_appointment_time = first.appointment_time || "";
vars.${prefix}_original_payment_status = first.payment_status || "manual_verify";
vars.${prefix}_original_reservation_id = first.reservation_id || "";
vars.${prefix}_original_reservation_key = first.reservation_key || ((String(first.doctor_id || "").toLowerCase()) + "|" + (dateOnly(first.appointment_date || first.date) || "") + "|" + String(first.appointment_time || "").slice(0, 5));
return { route: vars.${routeVar}, count: future.length };
`;
}

function appointmentStatusScript() {
  return `
${normalizeScript()}
const rows = Array.isArray(vars.appointment_status_result?.data) ? vars.appointment_status_result.data : [];
function currentParts() {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).formatToParts(new Date()).reduce((acc, part) => {
    acc[part.type] = part.value;
    return acc;
  }, {});
}
function dateOnly(value) {
  const raw = String(value || "").trim();
  const iso = raw.match(/^(\\d{4})-(\\d{2})-(\\d{2})/);
  if (iso) return iso[1] + "-" + iso[2] + "-" + iso[3];
  const dmy = raw.match(/^(\\d{2})[-/](\\d{2})[-/](\\d{4})/);
  if (dmy) return dmy[3] + "-" + dmy[2] + "-" + dmy[1];
  return raw.slice(0, 10);
}
function toMinutes(value) {
  const raw = String(value || "").trim();
  const hhmm = raw.match(/([01]?\\d|2[0-3]):([0-5]\\d)/);
  if (hhmm) return Number(hhmm[1]) * 60 + Number(hhmm[2]);
  const meridian = raw.match(/(\\d{1,2}):(\\d{2})\\s*(AM|PM)/i);
  if (!meridian) return null;
  let hour = Number(meridian[1]);
  const minute = Number(meridian[2]);
  const suffix = meridian[3].toUpperCase();
  if (suffix === "PM" && hour < 12) hour += 12;
  if (suffix === "AM" && hour === 12) hour = 0;
  return hour * 60 + minute;
}
function paymentLabel(value) {
  const raw = String(value || "").trim();
  const map = { paid: "Paid", pending: "Pending", pay_at_hospital: "Pay at hospital", failed: "Payment failed", manual_verify: "Verification pending" };
  return map[raw] || titleCase(raw);
}
const parts = currentParts();
const nowDate = parts.year + "-" + parts.month + "-" + parts.day;
const nowMinutes = Number(parts.hour) * 60 + Number(parts.minute);
const future = rows.filter((item) => {
  const date = dateOnly(item.appointment_date || item.date);
  if (!date) return false;
  if (date > nowDate) return true;
  if (date < nowDate) return false;
  const minutes = toMinutes(item.appointment_time || item.slot_label || item.start_time || "");
  return minutes != null && minutes > nowMinutes;
}).sort((a, b) => (String(a.appointment_date || "").localeCompare(String(b.appointment_date || "")) || String(a.appointment_time || a.slot_label || "").localeCompare(String(b.appointment_time || b.slot_label || ""))));
vars.appointment_status_summary_text = future.length
  ? future.map((item, index) => String(index + 1) + ". " + (item.doctor_name || titleCase(item.doctor_id || "doctor")) + " | " + departmentLabel(item.department || "") + " | " + (item.branch_name || titleCase(item.branch_id || "")) + " | " + dateOnly(item.appointment_date || item.date) + " at " + (item.slot_label || item.appointment_time || item.start_time || "") + " | Appointment: " + String(item.status || "Status not available") + " | Payment: " + paymentLabel(item.payment_status || "")).join("\\n")
  : "No future appointments were found for this mobile number.";
vars.appointment_status_response_text = future.length
  ? "I found future appointments linked to " + String(vars.patient_mobile || "this mobile number") + ":\\n\\n" + vars.appointment_status_summary_text + "\\n\\nYou can now ask to reschedule, cancel, or book another appointment."
  : vars.appointment_status_summary_text + " You can book a new appointment or type another request.";
return { count: future.length };
`;
}

function selectedAppointmentScript(prefix) {
  return `
${normalizeScript()}
const future = Array.isArray(vars.${prefix}_future_appointments) ? vars.${prefix}_future_appointments : [];
const selectedRaw = String(vars.${prefix}_selected_appointment_id || "").trim();
const selectedNumber = Number.parseInt(selectedRaw, 10);
let selected = Number.isFinite(selectedNumber) && selectedNumber >= 1 ? future[selectedNumber - 1] : null;
if (!selected && selectedRaw) {
  const normalized = normalizeText(selectedRaw);
  selected = future.find((item) => String(item.appointment_id || "").trim().toLowerCase() === selectedRaw.toLowerCase())
    || future.find((item) => normalizeText(item.doctor_name || item.doctor_id || "") === normalized);
}
vars.${prefix}_selection_route = selected ? "found" : "not_found";
const item = selected || {};
vars.${prefix}_original_appointment_id = item.appointment_id || "";
vars.${prefix}_original_patient_id = item.patient_id || ("PAT-" + String(vars.patient_mobile || ""));
vars.${prefix}_original_slot_id = item.slot_id || "";
vars.${prefix}_original_slot_hold_id = item.slot_hold_id || "";
vars.${prefix}_original_slot_label = item.slot_label || "";
vars.${prefix}_original_doctor_id = item.doctor_id || "";
vars.${prefix}_original_doctor_name = item.doctor_name || titleCase(item.doctor_id || "doctor");
vars.${prefix}_original_branch_id = item.branch_id || "";
vars.${prefix}_original_branch_name = item.branch_name || titleCase(item.branch_id || "");
vars.${prefix}_original_department = item.department || "";
vars.${prefix}_original_department_name = departmentLabel(item.department || "");
vars.${prefix}_original_consultation_type = item.consultation_type || "";
vars.${prefix}_original_consultation_type_label = item.consultation_type_label || consultationLabel(item.consultation_type || item.consultation_mode || "");
vars.${prefix}_original_appointment_date = item.appointment_date || "";
vars.${prefix}_original_appointment_time = item.appointment_time || "";
vars.${prefix}_original_payment_status = item.payment_status || "manual_verify";
vars.${prefix}_original_reservation_id = item.reservation_id || "";
vars.${prefix}_original_reservation_key = item.reservation_key || ((String(item.doctor_id || "").toLowerCase()) + "|" + String(item.appointment_date || "").slice(0, 10) + "|" + String(item.appointment_time || "").slice(0, 5));
return { route: vars.${prefix}_selection_route, selected_number: selectedNumber || "", appointment_id: vars.${prefix}_original_appointment_id };
`;
}

function prepareHoldScript({ selectedSlotVar, reservationIdVar, reservationKeyVar, holdExpiresVar, holdTtlVar, sourceRuleVar, feeVar, doctorNameVar, branchNameVar, typeLabelVar }) {
  return `
const slot = vars.${selectedSlotVar} || {};
const holdTtl = Math.max(1, Number(slot.hold_ttl_minutes || vars.${holdTtlVar} || 10) || 10);
vars.${reservationKeyVar} = String(slot.reservation_key || (String(vars.doctor_id || vars.reschedule_original_doctor_id || "").toLowerCase() + "|" + String(slot.date || vars.appointment_date || vars.reschedule_new_date || "") + "|" + String(slot.start || vars.appointment_time || vars.reschedule_new_start_time || ""))).toLowerCase();
vars.${sourceRuleVar} = String(slot.source_rule_id || "").trim();
vars.${holdTtlVar} = holdTtl;
vars.${holdExpiresVar} = new Date(Date.now() + holdTtl * 60000).toISOString();
vars.${feeVar} = Number(slot.consultation_fee || vars.${feeVar} || vars.appointment_selected_doctor_fee || vars.appointment_fee || 800) || 800;
vars.${doctorNameVar} = String(slot.doctor_name || vars.${doctorNameVar} || "").trim();
vars.${branchNameVar} = String(slot.branch_name || vars.${branchNameVar} || "").trim();
vars.${typeLabelVar} = String(slot.consultation_type_label || vars.${typeLabelVar} || "").trim();
return {
  reservation_id: vars.${reservationIdVar},
  reservation_key: vars.${reservationKeyVar},
  hold_expires_at: vars.${holdExpiresVar},
  hold_ttl_minutes: vars.${holdTtlVar}
};
`;
}

function appointmentOptionMessage(variableName, prefix) {
  return [
    `Select the ${prefix}doctor you want to book.`,
    `Reply with the number or doctor ID from the list below:`,
    `{{${variableName}}}`
  ].join("\\n\\n");
}

function addSequentialRecordNode(nodeId, baseId, dx, dy, data) {
  upsertNode({
    id: nodeId,
    type: "record",
    position: clonePosition(baseId, dx, dy),
    data
  });
}

function addOtpGate({ prefix, formId, nextId, otpVar, prompt, invalidMessage }) {
  upsertNode({
    id: `${prefix}_otp_input`,
    type: "input",
    position: clonePosition(formId, 230, 0),
    data: {
      messages: [prompt],
      variable: otpVar,
      buttons: []
    }
  });
  upsertNode({
    id: `${prefix}_otp_validate`,
    type: "script",
    position: clonePosition(formId, 470, 0),
    data: {
      outputVar: `${prefix}_otp_validate_result`,
      timeoutMs: 100,
      script: `
const otp = String(vars.${otpVar} || "").trim();
vars.${prefix}_otp_route = /^\\d{6}$/.test(otp) ? "valid" : "invalid";
vars.${prefix}_otp_verified = vars.${prefix}_otp_route === "valid";
return { route: vars.${prefix}_otp_route };
`
    }
  });
  upsertNode({
    id: `${prefix}_otp_route`,
    type: "switch",
    position: clonePosition(formId, 700, 0),
    data: { variable: `${prefix}_otp_route` }
  });
  upsertNode({
    id: `${prefix}_otp_invalid_message`,
    type: "message",
    position: clonePosition(formId, 930, -30),
    data: {
      buttons: [],
      messages: [{ type: "text", text: invalidMessage }]
    }
  });
  upsertNode({
    id: `${prefix}_otp_invalid_end`,
    type: "end",
    position: clonePosition(formId, 1160, -30),
    data: {}
  });

  const oldEdgeIds = edges
    .filter((edge) => edge.source === formId && edge.target === nextId)
    .map((edge) => edge.id);
  for (const edgeId of oldEdgeIds) removeEdge(edgeId);

  upsertEdge({
    id: `edge_migrated_${prefix}_otp_input`,
    type: "smoothstep",
    source: formId,
    target: `${prefix}_otp_input`,
    isDefault: false
  });
  upsertEdge({
    id: `edge_migrated_${prefix}_otp_validate`,
    type: "smoothstep",
    source: `${prefix}_otp_input`,
    target: `${prefix}_otp_validate`,
    isDefault: false
  });
  upsertEdge({
    id: `edge_migrated_${prefix}_otp_route`,
    type: "smoothstep",
    source: `${prefix}_otp_validate`,
    target: `${prefix}_otp_route`,
    isDefault: false
  });
  upsertEdge({
    id: `edge_migrated_${prefix}_otp_valid`,
    type: "smoothstep",
    source: `${prefix}_otp_route`,
    target: nextId,
    condition: { value: "valid", operator: "equals" }
  });
  upsertEdge({
    id: `edge_migrated_${prefix}_otp_invalid`,
    type: "smoothstep",
    source: `${prefix}_otp_route`,
    target: `${prefix}_otp_invalid_message`,
    isDefault: true
  });
  upsertEdge({
    id: `edge_migrated_${prefix}_otp_invalid_end`,
    type: "smoothstep",
    source: `${prefix}_otp_invalid_message`,
    target: `${prefix}_otp_invalid_end`,
    isDefault: false
  });
}

getNode("appointment_branch_input").data.buttons = BRANCH_BUTTONS;
getNode("appointment_department_input").data.buttons = DEPARTMENT_BUTTONS;
getNode("availability_department_input").data.buttons = DEPARTMENT_BUTTONS.filter((item) => item.value !== "not_sure");
getNode("doctor_profile_department_input").data.buttons = DEPARTMENT_BUTTONS;

getNode("appointment_slot_booking").data.horizonDays = 31;
getNode("appointment_slot_booking").data.maxSlotsPerDay = 8;
getNode("appointment_slot_booking").data.messages = [
  "Please choose an available appointment slot. You can type a preferred date, or use the doctor availability shown for the next 31 days below."
];
getNode("appointment_alternate_slot_booking").data.horizonDays = 31;
getNode("appointment_alternate_slot_booking").data.maxSlotsPerDay = 8;
getNode("appointment_conflict_slot_booking").data.horizonDays = 31;
getNode("appointment_conflict_slot_booking").data.maxSlotsPerDay = 8;
getNode("reschedule_slot_booking").data.horizonDays = 31;
getNode("reschedule_slot_booking").data.maxSlotsPerDay = 8;

getNode("appointment_doctors_fetch").data.where = {
  branch_id: "{{doctor_scope_branch_id}}",
  department: "{{department}}",
  consultation_mode: "{{consultation_type}}"
};
getNode("appointment_doctors_fetch").data.whereJson = pretty(getNode("appointment_doctors_fetch").data.where);
getNode("appointment_doctors_fetch").data.sortBy = "display_name";
getNode("appointment_doctors_fetch").data.collectionSchema = DOCTORS_SCHEMA;
getNode("appointment_doctors_fetch").data.collectionSchemaJson = pretty(DOCTORS_SCHEMA);

getNode("availability_doctor_list").data.where = { department: "{{availability_department}}" };
getNode("availability_doctor_list").data.whereJson = pretty(getNode("availability_doctor_list").data.where);
getNode("availability_doctor_list").data.sortBy = "display_name";
getNode("availability_doctor_list").data.collectionSchema = DOCTORS_SCHEMA;
getNode("availability_doctor_list").data.collectionSchemaJson = pretty(DOCTORS_SCHEMA);

getNode("doctor_profile_lookup").data.where = {};
getNode("doctor_profile_lookup").data.whereJson = pretty(getNode("doctor_profile_lookup").data.where);
getNode("doctor_profile_lookup").data.sortBy = "display_name";
getNode("doctor_profile_lookup").data.collectionSchema = DOCTORS_SCHEMA;
getNode("doctor_profile_lookup").data.collectionSchemaJson = pretty(DOCTORS_SCHEMA);

getNode("appointment_doctor_input").data.buttons = [];
getNode("appointment_doctor_input").data.messages = [appointmentOptionMessage("appointment_doctor_options_text", "")];
getNode("appointment_alternate_doctor_input").data.buttons = [];
getNode("appointment_alternate_doctor_input").data.messages = [appointmentOptionMessage("appointment_doctor_options_text", "another ")];
getNode("existing_patient_not_found_message").data.messages = [
  {
    type: "text",
    text: "I could not find an existing hospital profile in this hospital workspace for this mobile number. I will collect the remaining details to create the appointment profile."
  }
];
getNode("appointment_no_doctors_message").data.messages = [
  {
    type: "text",
    text: "I could not find an active doctor for this department and consultation type right now. Please choose another department or consultation type."
  }
];
getNode("appointment_no_slots_message").data.messages = [
  {
    type: "text",
    text: "I could not find an open slot for that doctor in the next 31 days. Please choose another care team below, or try a different preferred date if more slots are released."
  }
];

getNode("appointment_display_labels_set").data.script = displayLabelsScript({ doctorChoiceVar: "doctor_id" });
getNode("appointment_alternate_display_labels_set").data.script = displayLabelsScript({ doctorChoiceVar: "doctor_id" });
getNode("reschedule_select_appointment").data.script = selectedAppointmentScript("reschedule");
getNode("cancel_select_appointment").data.script = selectedAppointmentScript("cancel");

getNode("appointment_filter_available_slots").data.script = availabilityScript({
  rulesVar: "appointment_availability_rules_result",
  exceptionsVar: "appointment_schedule_exceptions_result",
  reservationsVar: "appointment_active_reservations_result",
  policyVar: "appointment_booking_policy_result",
  slotsVar: "appointment_future_slots",
  routeVar: "appointment_slot_inventory_route",
  countVar: "appointment_future_slots_count"
});

getNode("appointment_filter_alternate_slots").data.script = availabilityScript({
  rulesVar: "appointment_alternate_availability_rules_result",
  exceptionsVar: "appointment_alternate_schedule_exceptions_result",
  reservationsVar: "appointment_alternate_active_reservations_result",
  policyVar: "appointment_alternate_booking_policy_result",
  slotsVar: "alternate_appointment_future_slots",
  routeVar: "appointment_alternate_slot_inventory_route",
  countVar: "alternate_appointment_future_slots_count"
});

getNode("appointment_filter_conflict_slots").data.script = availabilityScript({
  rulesVar: "appointment_conflict_availability_rules_result",
  exceptionsVar: "appointment_conflict_schedule_exceptions_result",
  reservationsVar: "appointment_conflict_active_reservations_result",
  policyVar: "appointment_conflict_booking_policy_result",
  slotsVar: "conflict_appointment_future_slots",
  routeVar: "appointment_conflict_slot_inventory_route",
  countVar: "conflict_appointment_future_slots_count"
});

getNode("reschedule_filter_available_slots").data.script = availabilityScript({
  rulesVar: "reschedule_availability_rules_result",
  exceptionsVar: "reschedule_schedule_exceptions_result",
  reservationsVar: "reschedule_active_reservations_result",
  policyVar: "reschedule_booking_policy_result",
  slotsVar: "reschedule_open_slots_result",
  routeVar: "reschedule_slot_route",
  countVar: "reschedule_open_slots_result_count",
  excludeSlotVar: "reschedule_original_slot_id"
});

getNode("appointment_status_format").data.script = appointmentStatusScript();
getNode("reschedule_filter_future_appointments").data.script = upcomingLikeScript({
  sourceVar: "reschedule_future_appointments_result",
  optionsTextVar: "reschedule_future_appointment_options_text",
  routeVar: "reschedule_future_appointment_route",
  prefix: "reschedule"
});
getNode("cancel_filter_future_appointments").data.script = upcomingLikeScript({
  sourceVar: "cancel_future_appointments_result",
  optionsTextVar: "cancel_future_appointment_options_text",
  routeVar: "cancel_future_appointment_route",
  prefix: "cancel"
});
getNode("appointment_upcoming_format").data.script = `
${upcomingLikeScript({
  sourceVar: "appointment_upcoming_result",
  routeVar: "appointment_upcoming_route",
  prefix: "appointment_upcoming"
})}
const item = (vars.appointment_upcoming_future_appointments || [])[0] || {};
vars.appointment_upcoming_id = item.appointment_id || "";
vars.appointment_upcoming_date = vars.appointment_upcoming_original_appointment_date || "";
vars.appointment_upcoming_time = item.slot_label || item.appointment_time || item.start_time || "";
vars.appointment_upcoming_doctor_name = item.doctor_name || titleCase(item.doctor_id || "doctor");
vars.appointment_upcoming_department_name = departmentLabel(item.department || "");
const paymentMap = { paid: "Paid", pending: "Pending", pay_at_hospital: "Pay at hospital", failed: "Payment failed", manual_verify: "Verification pending" };
vars.appointment_upcoming_payment_label = paymentMap[String(item.payment_status || "")] || titleCase(item.payment_status || "");
return { route: vars.appointment_upcoming_route, count: (vars.appointment_upcoming_future_appointments || []).length, appointment_id: vars.appointment_upcoming_id };
`;

getNode("appointment_set_ids").data.assignments = [
  { key: "appointment_id", value: "APT-{{system.sessionId}}" },
  { key: "slot_hold_id", value: "HOLD-{{system.sessionId}}" },
  { key: "appointment_reservation_id", value: "RSV-{{system.sessionId}}" },
  { key: "appointment_date", value: "{{appointment_selected_slot.date}}" },
  { key: "appointment_slot_id", value: "{{appointment_selected_slot.slot_id}}" },
  { key: "appointment_slot_label", value: "{{appointment_selected_slot.label}}" },
  { key: "appointment_time", value: "{{appointment_selected_slot.start}}" },
  { key: "appointment_end_time", value: "{{appointment_selected_slot.end}}" },
  { key: "payment_status", value: "pending" }
];

getNode("appointment_conflict_set_ids").data.assignments = [
  { key: "appointment_date", value: "{{appointment_conflict_selected_slot.date}}" },
  { key: "appointment_slot_id", value: "{{appointment_conflict_selected_slot.slot_id}}" },
  { key: "appointment_slot_label", value: "{{appointment_conflict_selected_slot.label}}" },
  { key: "appointment_time", value: "{{appointment_conflict_selected_slot.start}}" },
  { key: "appointment_end_time", value: "{{appointment_conflict_selected_slot.end}}" }
];

getNode("reschedule_set_new_slot_vars").data.assignments = [
  { key: "reschedule_new_appointment_id", value: "APT-RESCH-{{system.sessionId}}" },
  { key: "reschedule_new_slot_hold_id", value: "HOLD-RESCH-{{system.sessionId}}" },
  { key: "reschedule_new_reservation_id", value: "RSV-RESCH-{{system.sessionId}}" },
  { key: "reschedule_new_date", value: "{{reschedule_selected_slot.date}}" },
  { key: "reschedule_new_slot_id", value: "{{reschedule_selected_slot.slot_id}}" },
  { key: "reschedule_new_slot_label", value: "{{reschedule_selected_slot.label}}" },
  { key: "reschedule_new_start_time", value: "{{reschedule_selected_slot.start}}" },
  { key: "reschedule_new_end_time", value: "{{reschedule_selected_slot.end}}" }
];

updateRecordNode("appointment_slot_hold_update", {
  action: "upsert",
  collection: "appointment_reservations",
  where: { reservation_id: "{{appointment_reservation_id}}" },
  data: {
    reservation_id: "{{appointment_reservation_id}}",
    reservation_key: "{{appointment_reservation_key}}",
    slot_id: "{{appointment_slot_id}}",
    source_rule_id: "{{appointment_source_rule_id}}",
    doctor_id: "{{doctor_id}}",
    doctor_name: "{{appointment_doctor_name}}",
    department: "{{department}}",
    branch_id: "{{doctor_scope_branch_id}}",
    branch_name: "{{appointment_branch_name}}",
    consultation_mode: "{{consultation_type}}",
    consultation_type_label: "{{appointment_consultation_type_label}}",
    appointment_date: "{{appointment_date}}",
    start_time: "{{appointment_time}}",
    end_time: "{{appointment_end_time}}",
    slot_label: "{{appointment_slot_label}}",
    consultation_fee: "{{appointment_booking_fee}}",
    hold_ttl_minutes: "{{appointment_hold_ttl_minutes}}",
    hold_expires_at: "{{appointment_hold_expires_at}}",
    held_by_session: "{{system.sessionId}}",
    patient_id: "PAT-{{patient_mobile}}",
    patient_mobile: "{{patient_mobile}}",
    patient_name: "{{patient_name}}",
    appointment_id: "{{appointment_id}}",
    hold_id: "{{slot_hold_id}}",
    payment_status: "{{payment_status}}",
    status: "held",
    created_at: "{{system.sessionId}}"
  },
  outputVar: "appointment_slot_hold_result",
  uniqueKey: "reservation_id",
  idempotencyKey: "{{appointment_reservation_id}}",
  schema: RESERVATIONS_SCHEMA
});

updateRecordNode("appointment_conflict_slot_hold_update", {
  action: "upsert",
  collection: "appointment_reservations",
  where: { reservation_id: "{{appointment_reservation_id}}" },
  data: {
    reservation_id: "{{appointment_reservation_id}}",
    reservation_key: "{{appointment_reservation_key}}",
    slot_id: "{{appointment_slot_id}}",
    source_rule_id: "{{appointment_source_rule_id}}",
    doctor_id: "{{doctor_id}}",
    doctor_name: "{{appointment_doctor_name}}",
    department: "{{department}}",
    branch_id: "{{doctor_scope_branch_id}}",
    branch_name: "{{appointment_branch_name}}",
    consultation_mode: "{{consultation_type}}",
    consultation_type_label: "{{appointment_consultation_type_label}}",
    appointment_date: "{{appointment_date}}",
    start_time: "{{appointment_time}}",
    end_time: "{{appointment_end_time}}",
    slot_label: "{{appointment_slot_label}}",
    consultation_fee: "{{appointment_booking_fee}}",
    hold_ttl_minutes: "{{appointment_hold_ttl_minutes}}",
    hold_expires_at: "{{appointment_hold_expires_at}}",
    held_by_session: "{{system.sessionId}}",
    patient_id: "PAT-{{patient_mobile}}",
    patient_mobile: "{{patient_mobile}}",
    patient_name: "{{patient_name}}",
    appointment_id: "{{appointment_id}}",
    hold_id: "{{slot_hold_id}}",
    payment_status: "{{payment_status}}",
    status: "held",
    created_at: "{{system.sessionId}}"
  },
  outputVar: "appointment_conflict_slot_hold_result",
  uniqueKey: "reservation_id",
  idempotencyKey: "{{appointment_reservation_id}}",
  schema: RESERVATIONS_SCHEMA
});

updateRecordNode("appointment_slot_release_update", {
  action: "update",
  collection: "appointment_reservations",
  where: { reservation_id: "{{appointment_reservation_id}}", status: "held" },
  data: { status: "cancelled", payment_status: "{{payment_status}}" },
  outputVar: "appointment_slot_release_result",
  uniqueKey: "reservation_id",
  idempotencyKey: "{{appointment_reservation_id}}:cancelled",
  schema: RESERVATIONS_SCHEMA
});

updateRecordNode("appointment_slot_booked_update", {
  action: "update",
  collection: "appointment_reservations",
  where: { reservation_id: "{{appointment_reservation_id}}", status: "held" },
  data: {
    status: "confirmed",
    appointment_id: "{{appointment_id}}",
    payment_status: "{{payment_status}}",
    hold_id: "{{slot_hold_id}}"
  },
  outputVar: "appointment_slot_booked_result",
  uniqueKey: "reservation_id",
  idempotencyKey: "{{appointment_reservation_id}}:confirmed",
  schema: RESERVATIONS_SCHEMA
});

updateRecordNode("reschedule_new_slot_hold_update", {
  action: "upsert",
  collection: "appointment_reservations",
  where: { reservation_id: "{{reschedule_new_reservation_id}}" },
  data: {
    reservation_id: "{{reschedule_new_reservation_id}}",
    reservation_key: "{{reschedule_new_reservation_key}}",
    slot_id: "{{reschedule_new_slot_id}}",
    source_rule_id: "{{reschedule_new_source_rule_id}}",
    doctor_id: "{{reschedule_original_doctor_id}}",
    doctor_name: "{{reschedule_original_doctor_name}}",
    department: "{{reschedule_original_department}}",
    branch_id: "{{reschedule_original_branch_id}}",
    branch_name: "{{reschedule_original_branch_name}}",
    consultation_mode: "{{reschedule_original_consultation_type}}",
    consultation_type_label: "{{reschedule_original_consultation_type_label}}",
    appointment_date: "{{reschedule_new_date}}",
    start_time: "{{reschedule_new_start_time}}",
    end_time: "{{reschedule_new_end_time}}",
    slot_label: "{{reschedule_new_slot_label}}",
    consultation_fee: "{{appointment_booking_fee}}",
    hold_ttl_minutes: "{{reschedule_new_hold_ttl_minutes}}",
    hold_expires_at: "{{reschedule_new_hold_expires_at}}",
    held_by_session: "{{system.sessionId}}",
    patient_id: "{{reschedule_original_patient_id}}",
    patient_mobile: "{{patient_mobile}}",
    patient_name: "{{patient_name}}",
    appointment_id: "{{reschedule_new_appointment_id}}",
    hold_id: "{{reschedule_new_slot_hold_id}}",
    payment_status: "{{reschedule_original_payment_status}}",
    status: "held",
    created_at: "{{system.sessionId}}"
  },
  outputVar: "reschedule_new_slot_hold_result",
  uniqueKey: "reservation_id",
  idempotencyKey: "{{reschedule_new_reservation_id}}",
  schema: RESERVATIONS_SCHEMA
});

updateRecordNode("reschedule_new_slot_release_update", {
  action: "update",
  collection: "appointment_reservations",
  where: { reservation_id: "{{reschedule_new_reservation_id}}", status: "held" },
  data: { status: "cancelled", payment_status: "{{reschedule_original_payment_status}}" },
  outputVar: "reschedule_new_slot_release_result",
  uniqueKey: "reservation_id",
  idempotencyKey: "{{reschedule_new_reservation_id}}:cancelled",
  schema: RESERVATIONS_SCHEMA
});

updateRecordNode("reschedule_new_slot_booked_update", {
  action: "update",
  collection: "appointment_reservations",
  where: { reservation_id: "{{reschedule_new_reservation_id}}", status: "held" },
  data: {
    status: "confirmed",
    appointment_id: "{{reschedule_new_appointment_id}}",
    payment_status: "{{reschedule_original_payment_status}}"
  },
  outputVar: "reschedule_new_slot_booked_result",
  uniqueKey: "reservation_id",
  idempotencyKey: "{{reschedule_new_reservation_id}}:confirmed",
  schema: RESERVATIONS_SCHEMA
});

updateRecordNode("reschedule_old_slot_release_update", {
  action: "update",
  collection: "appointment_reservations",
  where: {
    reservation_key: "{{reschedule_original_reservation_key}}",
    status: "confirmed"
  },
  data: { status: "cancelled", payment_status: "{{reschedule_original_payment_status}}" },
  outputVar: "reschedule_old_slot_release_result",
  uniqueKey: "reservation_id",
  idempotencyKey: "{{reschedule_original_appointment_id}}:release-old-reservation",
  schema: RESERVATIONS_SCHEMA
});

updateRecordNode("cancel_slot_release_update", {
  action: "update",
  collection: "appointment_reservations",
  where: {
    reservation_key: "{{cancel_original_reservation_key}}",
    status: "confirmed"
  },
  data: { status: "cancelled", payment_status: "{{cancel_original_payment_status}}" },
  outputVar: "cancel_slot_release_result",
  uniqueKey: "reservation_id",
  idempotencyKey: "{{cancel_original_appointment_id}}:release-reservation",
  schema: RESERVATIONS_SCHEMA
});

updateRecordNode("appointment_confirm_record_update", {
  action: "upsert",
  collection: "appointments",
  where: { appointment_id: "{{appointment_id}}" },
  data: {
    appointment_id: "{{appointment_id}}",
    patient_id: "PAT-{{patient_mobile}}",
    patient_mobile: "{{patient_mobile}}",
    branch_id: "{{doctor_scope_branch_id}}",
    branch_name: "{{appointment_branch_name}}",
    consultation_type: "{{consultation_type}}",
    consultation_type_label: "{{appointment_consultation_type_label}}",
    department: "{{department}}",
    doctor_id: "{{doctor_id}}",
    doctor_name: "{{appointment_doctor_name}}",
    slot_id: "{{appointment_slot_id}}",
    slot_label: "{{appointment_slot_label}}",
    slot_hold_id: "{{slot_hold_id}}",
    appointment_date: "{{appointment_date}}",
    appointment_time: "{{appointment_time}}",
    status: "confirmed",
    payment_status: "{{payment_status}}",
    reservation_id: "{{appointment_reservation_id}}",
    reservation_key: "{{appointment_reservation_key}}"
  },
  outputVar: "appointment_confirm_record_result",
  uniqueKey: "appointment_id",
  idempotencyKey: "{{appointment_id}}:confirmed",
  schema: APPOINTMENTS_SCHEMA
});

updateRecordNode("reschedule_new_appointment_record", {
  action: "upsert",
  collection: "appointments",
  where: { appointment_id: "{{reschedule_new_appointment_id}}" },
  data: {
    appointment_id: "{{reschedule_new_appointment_id}}",
    patient_id: "{{reschedule_original_patient_id}}",
    patient_mobile: "{{patient_mobile}}",
    branch_id: "{{reschedule_original_branch_id}}",
    branch_name: "{{reschedule_original_branch_name}}",
    consultation_type: "{{reschedule_original_consultation_type}}",
    consultation_type_label: "{{reschedule_original_consultation_type_label}}",
    department: "{{reschedule_original_department}}",
    doctor_id: "{{reschedule_original_doctor_id}}",
    doctor_name: "{{reschedule_original_doctor_name}}",
    slot_id: "{{reschedule_new_slot_id}}",
    slot_label: "{{reschedule_new_slot_label}}",
    slot_hold_id: "{{reschedule_new_slot_hold_id}}",
    appointment_date: "{{reschedule_new_date}}",
    appointment_time: "{{reschedule_new_start_time}}",
    status: "confirmed",
    payment_status: "{{reschedule_original_payment_status}}",
    reservation_id: "{{reschedule_new_reservation_id}}",
    reservation_key: "{{reschedule_new_reservation_key}}"
  },
  outputVar: "reschedule_new_appointment_record_result",
  uniqueKey: "appointment_id",
  idempotencyKey: "{{reschedule_new_appointment_id}}:confirmed",
  schema: APPOINTMENTS_SCHEMA
});

updateRecordNode("cancel_record_update", {
  action: "update",
  collection: "appointments",
  where: { status: "confirmed", appointment_id: "{{cancel_original_appointment_id}}", patient_mobile: "{{patient_mobile}}" },
  data: { status: "cancelled", payment_status: "{{cancel_original_payment_status}}" },
  outputVar: "cancel_record_result",
  uniqueKey: "appointment_id",
  idempotencyKey: "{{cancel_original_appointment_id}}:cancelled",
  schema: APPOINTMENTS_SCHEMA
});

updateRecordNode("reschedule_old_cancel_update", {
  action: "update",
  collection: "appointments",
  where: { status: "confirmed", appointment_id: "{{reschedule_original_appointment_id}}", patient_mobile: "{{patient_mobile}}" },
  data: { status: "cancelled", payment_status: "{{reschedule_original_payment_status}}" },
  outputVar: "reschedule_old_cancel_result",
  uniqueKey: "appointment_id",
  idempotencyKey: "{{reschedule_original_appointment_id}}:cancelled-for-reschedule",
  schema: APPOINTMENTS_SCHEMA
});

getNode("appointment_hold_expiry_scheduler").data.payload = {
  type: "release_expired_reservation_hold",
  reservation_id: "{{appointment_reservation_id}}",
  hold_id: "{{slot_hold_id}}",
  appointment_id: "{{appointment_id}}"
};
getNode("appointment_hold_expiry_scheduler").data.payloadJson = pretty(getNode("appointment_hold_expiry_scheduler").data.payload);

upsertNode({
  id: "appointment_prepare_scope",
  type: "script",
  position: clonePosition("appointment_department_input", 260, 0),
  data: {
    outputVar: "appointment_prepare_scope_result",
    timeoutMs: 100,
    script: `
${normalizeScript()}
const branchAliases = {
  jubilee: "jubilee_hills_branch",
  "jubilee hills": "jubilee_hills_branch",
  miyapur: "miyapur_branch",
  kukatpally: "kukatpally_branch",
  madeenaguda: "madeenaguda_branch"
};
const departmentAliases = {
  "general medicine": "general_medicine",
  derm: "dermatology",
  eye: "ophthalmology",
  ent: "ent"
};
const rawBranch = normalizeText(vars.branch_id || "");
const rawDepartment = normalizeText(vars.department || "");
const normalizedBranch = branchAliases[rawBranch] || String(vars.branch_id || "").trim();
const normalizedDepartment = departmentAliases[rawDepartment] || String(vars.department || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
vars.branch_id = normalizedBranch;
if (normalizedDepartment) vars.department = normalizedDepartment;
vars.doctor_scope_branch_id = String(vars.consultation_type || "").trim() === "online" ? "online" : normalizedBranch;
return {
  branch_id: vars.branch_id,
  doctor_scope_branch_id: vars.doctor_scope_branch_id,
  department: vars.department
};
`
  }
});

upsertNode({
  id: "appointment_doctor_selection_prepare",
  type: "script",
  position: clonePosition("appointment_doctors_fetch", 240, 0),
  data: {
    outputVar: "appointment_doctor_selection_prepare_result",
    timeoutMs: 100,
    script: doctorOptionsScript({
      routeVar: "appointment_doctor_route",
      outputVar: "appointment_doctor_selection_prepare_result",
      listVarName: "appointment_doctor_rows",
      optionsVarName: "appointment_doctor_options_text"
    })
  }
});

upsertNode({
  id: "appointment_doctor_route",
  type: "switch",
  position: clonePosition("appointment_doctor_selection_prepare", 250, 0),
  data: { variable: "appointment_doctor_route" }
});

addSequentialRecordNode(
  "appointment_doctors_alternatives_fetch",
  "appointment_doctor_route",
  260,
  -80,
  recordListData({
    collection: "doctors",
    where: {
      department: "{{department}}",
      consultation_mode: "{{consultation_type}}"
    },
    outputVar: "appointment_doctors_alternatives_result",
    schema: DOCTORS_SCHEMA,
    limit: 50,
    sortBy: "display_name",
    sortOrder: "asc"
  })
);

upsertNode({
  id: "appointment_doctors_alternatives_prepare",
  type: "script",
  position: clonePosition("appointment_doctors_alternatives_fetch", 250, 0),
  data: {
    outputVar: "appointment_doctors_alternatives_prepare_result",
    timeoutMs: 100,
    script: doctorAlternativeRecoveryScript({
      routeVar: "appointment_doctors_alternatives_route",
      promptVar: "appointment_alternative_doctor_prompt",
      sourceVar: "appointment_doctors_alternatives_result",
      optionsVar: "appointment_doctor_alternative_options_text",
      listVarName: "appointment_doctor_alternative_rows"
    })
  }
});

upsertNode({
  id: "appointment_doctors_alternatives_route",
  type: "switch",
  position: clonePosition("appointment_doctors_alternatives_prepare", 240, 0),
  data: { variable: "appointment_doctors_alternatives_route" }
});

upsertNode({
  id: "appointment_doctor_alternative_input",
  type: "input",
  position: clonePosition("appointment_doctors_alternatives_route", 240, -40),
  data: {
    messages: ["{{appointment_alternative_doctor_prompt}}"],
    variable: "doctor_id",
    buttons: []
  }
});

upsertNode({
  id: "appointment_alternative_display_labels_set",
  type: "script",
  position: clonePosition("appointment_doctor_alternative_input", 240, 0),
  data: {
    outputVar: "appointment_alternative_display_labels_set_result",
    timeoutMs: 100,
    script: displayLabelsScript({
      doctorChoiceVar: "doctor_id",
      sourceVar: "appointment_doctors_alternatives_result",
      allowCrossBranchSelection: true
    })
  }
});

upsertNode({
  id: "appointment_prepare_reservation_hold",
  type: "script",
  position: clonePosition("appointment_set_ids", 220, 0),
  data: {
    outputVar: "appointment_prepare_reservation_hold_result",
    timeoutMs: 100,
    script: prepareHoldScript({
      selectedSlotVar: "appointment_selected_slot",
      reservationIdVar: "appointment_reservation_id",
      reservationKeyVar: "appointment_reservation_key",
      holdExpiresVar: "appointment_hold_expires_at",
      holdTtlVar: "appointment_hold_ttl_minutes",
      sourceRuleVar: "appointment_source_rule_id",
      feeVar: "appointment_booking_fee",
      doctorNameVar: "appointment_doctor_name",
      branchNameVar: "appointment_branch_name",
      typeLabelVar: "appointment_consultation_type_label"
    })
  }
});

upsertNode({
  id: "appointment_conflict_prepare_reservation_hold",
  type: "script",
  position: clonePosition("appointment_conflict_set_ids", 220, 0),
  data: {
    outputVar: "appointment_conflict_prepare_reservation_hold_result",
    timeoutMs: 100,
    script: prepareHoldScript({
      selectedSlotVar: "appointment_conflict_selected_slot",
      reservationIdVar: "appointment_reservation_id",
      reservationKeyVar: "appointment_reservation_key",
      holdExpiresVar: "appointment_hold_expires_at",
      holdTtlVar: "appointment_hold_ttl_minutes",
      sourceRuleVar: "appointment_source_rule_id",
      feeVar: "appointment_booking_fee",
      doctorNameVar: "appointment_doctor_name",
      branchNameVar: "appointment_branch_name",
      typeLabelVar: "appointment_consultation_type_label"
    })
  }
});

upsertNode({
  id: "reschedule_prepare_reservation_hold",
  type: "script",
  position: clonePosition("reschedule_set_new_slot_vars", 220, 0),
  data: {
    outputVar: "reschedule_prepare_reservation_hold_result",
    timeoutMs: 100,
    script: prepareHoldScript({
      selectedSlotVar: "reschedule_selected_slot",
      reservationIdVar: "reschedule_new_reservation_id",
      reservationKeyVar: "reschedule_new_reservation_key",
      holdExpiresVar: "reschedule_new_hold_expires_at",
      holdTtlVar: "reschedule_new_hold_ttl_minutes",
      sourceRuleVar: "reschedule_new_source_rule_id",
      feeVar: "appointment_booking_fee",
      doctorNameVar: "reschedule_original_doctor_name",
      branchNameVar: "reschedule_original_branch_name",
      typeLabelVar: "reschedule_original_consultation_type_label"
    })
  }
});

addSequentialRecordNode(
  "appointment_booking_policy_list",
  "appointment_display_labels_set",
  240,
  0,
  recordListData({
    collection: "appointment_booking_policies",
    where: { policy_id: "default" },
    outputVar: "appointment_booking_policy_result",
    schema: BOOKING_POLICY_SCHEMA,
    limit: 5
  })
);
addSequentialRecordNode(
  "appointment_schedule_exceptions_list",
  "appointment_available_slots_list",
  250,
  0,
  recordListData({
    collection: "doctor_schedule_exceptions",
    where: {
      doctor_id: "{{doctor_id}}",
      branch_id: "{{doctor_scope_branch_id}}",
      consultation_mode: "{{consultation_type}}"
    },
    outputVar: "appointment_schedule_exceptions_result",
    schema: EXCEPTIONS_SCHEMA
  })
);
addSequentialRecordNode(
  "appointment_active_reservations_list",
  "appointment_schedule_exceptions_list",
  250,
  0,
  recordListData({
    collection: "appointment_reservations",
    where: {
      doctor_id: "{{doctor_id}}",
      branch_id: "{{doctor_scope_branch_id}}",
      consultation_mode: "{{consultation_type}}"
    },
    outputVar: "appointment_active_reservations_result",
    schema: RESERVATIONS_SCHEMA
  })
);

getNode("appointment_available_slots_list").data = recordListData({
  collection: "doctor_availability_rules",
  where: {
    doctor_id: "{{doctor_id}}",
    branch_id: "{{doctor_scope_branch_id}}",
    consultation_mode: "{{consultation_type}}",
    is_active: true
  },
  outputVar: "appointment_availability_rules_result",
  schema: RULES_SCHEMA,
  sortBy: "start_time",
  sortOrder: "asc"
});

addSequentialRecordNode(
  "appointment_alternate_booking_policy_list",
  "appointment_alternate_display_labels_set",
  240,
  0,
  recordListData({
    collection: "appointment_booking_policies",
    where: { policy_id: "default" },
    outputVar: "appointment_alternate_booking_policy_result",
    schema: BOOKING_POLICY_SCHEMA,
    limit: 5
  })
);
addSequentialRecordNode(
  "appointment_alternate_schedule_exceptions_list",
  "appointment_alternate_available_slots_list",
  250,
  0,
  recordListData({
    collection: "doctor_schedule_exceptions",
    where: {
      doctor_id: "{{doctor_id}}",
      branch_id: "{{doctor_scope_branch_id}}",
      consultation_mode: "{{consultation_type}}"
    },
    outputVar: "appointment_alternate_schedule_exceptions_result",
    schema: EXCEPTIONS_SCHEMA
  })
);
addSequentialRecordNode(
  "appointment_alternate_active_reservations_list",
  "appointment_alternate_schedule_exceptions_list",
  250,
  0,
  recordListData({
    collection: "appointment_reservations",
    where: {
      doctor_id: "{{doctor_id}}",
      branch_id: "{{doctor_scope_branch_id}}",
      consultation_mode: "{{consultation_type}}"
    },
    outputVar: "appointment_alternate_active_reservations_result",
    schema: RESERVATIONS_SCHEMA
  })
);

getNode("appointment_alternate_available_slots_list").data = recordListData({
  collection: "doctor_availability_rules",
  where: {
    doctor_id: "{{doctor_id}}",
    branch_id: "{{doctor_scope_branch_id}}",
    consultation_mode: "{{consultation_type}}",
    is_active: true
  },
  outputVar: "appointment_alternate_availability_rules_result",
  schema: RULES_SCHEMA,
  sortBy: "start_time",
  sortOrder: "asc"
});

addSequentialRecordNode(
  "appointment_conflict_booking_policy_list",
  "appointment_slot_conflict_message",
  240,
  120,
  recordListData({
    collection: "appointment_booking_policies",
    where: { policy_id: "default" },
    outputVar: "appointment_conflict_booking_policy_result",
    schema: BOOKING_POLICY_SCHEMA,
    limit: 5
  })
);
addSequentialRecordNode(
  "appointment_conflict_schedule_exceptions_list",
  "appointment_conflict_available_slots_list",
  250,
  0,
  recordListData({
    collection: "doctor_schedule_exceptions",
    where: {
      doctor_id: "{{doctor_id}}",
      branch_id: "{{doctor_scope_branch_id}}",
      consultation_mode: "{{consultation_type}}"
    },
    outputVar: "appointment_conflict_schedule_exceptions_result",
    schema: EXCEPTIONS_SCHEMA
  })
);
addSequentialRecordNode(
  "appointment_conflict_active_reservations_list",
  "appointment_conflict_schedule_exceptions_list",
  250,
  0,
  recordListData({
    collection: "appointment_reservations",
    where: {
      doctor_id: "{{doctor_id}}",
      branch_id: "{{doctor_scope_branch_id}}",
      consultation_mode: "{{consultation_type}}"
    },
    outputVar: "appointment_conflict_active_reservations_result",
    schema: RESERVATIONS_SCHEMA
  })
);

getNode("appointment_conflict_available_slots_list").data = recordListData({
  collection: "doctor_availability_rules",
  where: {
    doctor_id: "{{doctor_id}}",
    branch_id: "{{doctor_scope_branch_id}}",
    consultation_mode: "{{consultation_type}}",
    is_active: true
  },
  outputVar: "appointment_conflict_availability_rules_result",
  schema: RULES_SCHEMA,
  sortBy: "start_time",
  sortOrder: "asc"
});

addSequentialRecordNode(
  "reschedule_booking_policy_list",
  "reschedule_confirm_decision",
  240,
  120,
  recordListData({
    collection: "appointment_booking_policies",
    where: { policy_id: "default" },
    outputVar: "reschedule_booking_policy_result",
    schema: BOOKING_POLICY_SCHEMA,
    limit: 5
  })
);
addSequentialRecordNode(
  "reschedule_schedule_exceptions_list",
  "reschedule_available_slots_list",
  250,
  0,
  recordListData({
    collection: "doctor_schedule_exceptions",
    where: {
      doctor_id: "{{reschedule_original_doctor_id}}",
      branch_id: "{{reschedule_original_branch_id}}",
      consultation_mode: "{{reschedule_original_consultation_type}}"
    },
    outputVar: "reschedule_schedule_exceptions_result",
    schema: EXCEPTIONS_SCHEMA
  })
);
addSequentialRecordNode(
  "reschedule_active_reservations_list",
  "reschedule_schedule_exceptions_list",
  250,
  0,
  recordListData({
    collection: "appointment_reservations",
    where: {
      doctor_id: "{{reschedule_original_doctor_id}}",
      branch_id: "{{reschedule_original_branch_id}}",
      consultation_mode: "{{reschedule_original_consultation_type}}"
    },
    outputVar: "reschedule_active_reservations_result",
    schema: RESERVATIONS_SCHEMA
  })
);

getNode("reschedule_available_slots_list").data = recordListData({
  collection: "doctor_availability_rules",
  where: {
    doctor_id: "{{reschedule_original_doctor_id}}",
    branch_id: "{{reschedule_original_branch_id}}",
    consultation_mode: "{{reschedule_original_consultation_type}}",
    is_active: true
  },
  outputVar: "reschedule_availability_rules_result",
  schema: RULES_SCHEMA,
  sortBy: "start_time",
  sortOrder: "asc"
});

upsertNode({
  id: "availability_format_results",
  type: "script",
  position: clonePosition("availability_doctor_list", 240, 0),
  data: {
    outputVar: "availability_format_results",
    timeoutMs: 100,
    script: `
${normalizeScript()}
const rows = Array.isArray(vars.availability_doctors_result?.data) ? vars.availability_doctors_result.data : [];
const expectedDepartment = String(vars.availability_department || "").trim().toLowerCase();
const unique = rows
  .filter((row) => String(row.is_active ?? "true").toLowerCase() !== "false")
  .filter((row) => !expectedDepartment || String(row.department || "").trim().toLowerCase() === expectedDepartment)
  .filter((row, index, source) => source.findIndex((item) => String(item.doctor_scope_key || item.doctor_id || "") === String(row.doctor_scope_key || row.doctor_id || "")) === index);
vars.availability_results_text = unique.length
  ? "Available doctors and consultation options:\\n\\n" + unique.slice(0, 8).map((row, index) => {
      const fee = Number(row.consultation_fee || 0) > 0 ? " | Fee INR " + Number(row.consultation_fee) : "";
      return String(index + 1) + ". " + (row.display_name || row.doctor_id || "Doctor") + " | " + departmentLabel(row.department || "") + " | " + (row.branch_name || titleCase(row.branch_id || "")) + " | " + consultationLabel(row.consultation_mode || "") + fee;
    }).join("\\n")
  : "I could not find an active doctor schedule for that department right now.";
return { count: unique.length };
`
  }
});

upsertNode({
  id: "doctor_profile_format_results",
  type: "script",
  position: clonePosition("doctor_profile_lookup", 240, 0),
  data: {
    outputVar: "doctor_profile_format_results",
    timeoutMs: 100,
    script: `
${normalizeScript()}
const query = normalizeText(vars.doctor_profile_query || "");
const rows = Array.isArray(vars.doctor_profile_result?.data) ? vars.doctor_profile_result.data : [];
const filtered = rows.filter((row) => {
  if (String(row.is_active ?? "true").toLowerCase() === "false") return false;
  const haystack = [
    row.display_name,
    row.title,
    row.department,
    row.branch_name,
    row.consultation_type_label,
    row.consultation_mode
  ].map(normalizeText).join(" ");
  return !query || haystack.includes(query);
}).filter((row, index, source) => source.findIndex((item) => String(item.doctor_scope_key || item.doctor_id || "") === String(row.doctor_scope_key || row.doctor_id || "")) === index);
vars.doctor_profile_results_text = filtered.length
  ? "Doctor profiles and timings:\\n\\n" + filtered.slice(0, 8).map((row, index) => {
      const fee = Number(row.consultation_fee || 0) > 0 ? " | Fee INR " + Number(row.consultation_fee) : "";
      const summary = String(row.profile_summary || "").trim();
      return String(index + 1) + ". " + (row.display_name || row.doctor_id || "Doctor") + " | " + (row.title || departmentLabel(row.department || "")) + " | " + (row.branch_name || titleCase(row.branch_id || "")) + " | " + consultationLabel(row.consultation_mode || "") + fee + (summary ? "\\n   " + summary : "");
    }).join("\\n\\n")
  : "I could not find an active doctor profile for that search. You can try a doctor name, department, or branch.";
return { count: filtered.length };
`
  }
});

addOtpGate({
  prefix: "existing_patient_lookup",
  formId: "existing_patient_lookup_form",
  nextId: "existing_patient_find",
  otpVar: "existing_patient_lookup_otp",
  prompt: "Please enter the 6-digit OTP sent to this mobile number.",
  invalidMessage: "The OTP must be a 6-digit number. Please start again to continue."
});
addOtpGate({
  prefix: "appointment_status_mobile",
  formId: "existing_appointment_form",
  nextId: "existing_appointment_find",
  otpVar: "appointment_status_otp",
  prompt: "Please enter the 6-digit OTP sent to this mobile number.",
  invalidMessage: "The OTP must be a 6-digit number. Please start again to check appointment status."
});
addOtpGate({
  prefix: "reschedule_mobile",
  formId: "reschedule_mobile_form",
  nextId: "reschedule_future_appointments_list",
  otpVar: "reschedule_mobile_otp",
  prompt: "Please enter the 6-digit OTP sent to this mobile number.",
  invalidMessage: "The OTP must be a 6-digit number. Please start again to continue with rescheduling."
});
addOtpGate({
  prefix: "cancel_mobile",
  formId: "cancel_mobile_form",
  nextId: "cancel_future_appointments_list",
  otpVar: "cancel_mobile_otp",
  prompt: "Please enter the 6-digit OTP sent to this mobile number.",
  invalidMessage: "The OTP must be a 6-digit number. Please start again to continue with cancellation."
});
addOtpGate({
  prefix: "online_patient_lookup",
  formId: "online_patient_lookup_form",
  nextId: "online_patient_find",
  otpVar: "online_patient_lookup_otp",
  prompt: "Please enter the 6-digit OTP sent to this mobile number.",
  invalidMessage: "The OTP must be a 6-digit number. Please start again to continue with online consultation booking."
});
addOtpGate({
  prefix: "followup_lookup",
  formId: "followup_form",
  nextId: "followup_record_find",
  otpVar: "followup_lookup_otp",
  prompt: "Please enter the 6-digit OTP sent to this mobile number.",
  invalidMessage: "The OTP must be a 6-digit number. Please start again to continue with follow-up lookup."
});

const availabilityCarousel = getNode("availability_carousel");
availabilityCarousel.type = "message";
availabilityCarousel.data = {
  buttons: [],
  messages: [{ type: "text", text: "{{availability_results_text}}" }]
};

const doctorProfileCarousel = getNode("doctor_profile_carousel");
doctorProfileCarousel.type = "message";
doctorProfileCarousel.data = {
  buttons: [],
  messages: [{ type: "text", text: "{{doctor_profile_results_text}}" }]
};

removeEdge("edge_108_appointment_department_input_appointment_doctors_fetch");
upsertEdge({ id: "edge_migrated_appointment_department_prepare_scope", type: "smoothstep", source: "appointment_department_input", target: "appointment_prepare_scope", isDefault: false });
upsertEdge({ id: "edge_migrated_appointment_prepare_scope_doctors_fetch", type: "smoothstep", source: "appointment_prepare_scope", target: "appointment_doctors_fetch", isDefault: false });

removeEdge("edge_custom_appointment_doctors_fetch_appointment_doctor_input");
removeEdge("edge_custom_appointment_doctors_fetch_appointment_no_doctors_message");
upsertEdge({ id: "edge_migrated_appointment_doctors_fetch_prepare", type: "smoothstep", source: "appointment_doctors_fetch", target: "appointment_doctor_selection_prepare", isDefault: false });
upsertEdge({ id: "edge_migrated_appointment_doctor_prepare_route", type: "smoothstep", source: "appointment_doctor_selection_prepare", target: "appointment_doctor_route", isDefault: false });
upsertEdge({ id: "edge_migrated_appointment_doctor_route_none", type: "smoothstep", source: "appointment_doctor_route", target: "appointment_doctors_alternatives_fetch", condition: { value: "none", operator: "equals" } });
upsertEdge({ id: "edge_migrated_appointment_doctor_route_single", type: "smoothstep", source: "appointment_doctor_route", target: "appointment_display_labels_set", condition: { value: "single", operator: "equals" } });
upsertEdge({ id: "edge_migrated_appointment_doctor_route_multiple", type: "smoothstep", source: "appointment_doctor_route", target: "appointment_doctor_input", isDefault: true });
upsertEdge({ id: "edge_migrated_appointment_doctor_alternatives_prepare", type: "smoothstep", source: "appointment_doctors_alternatives_fetch", target: "appointment_doctors_alternatives_prepare", isDefault: false });
upsertEdge({ id: "edge_migrated_appointment_doctor_alternatives_route", type: "smoothstep", source: "appointment_doctors_alternatives_prepare", target: "appointment_doctors_alternatives_route", isDefault: false });
upsertEdge({ id: "edge_migrated_appointment_doctor_alternatives_available", type: "smoothstep", source: "appointment_doctors_alternatives_route", target: "appointment_doctor_alternative_input", condition: { value: "available", operator: "equals" } });
upsertEdge({ id: "edge_migrated_appointment_doctor_alternatives_none", type: "smoothstep", source: "appointment_doctors_alternatives_route", target: "appointment_no_doctors_message", isDefault: true });
upsertEdge({ id: "edge_migrated_appointment_doctor_alternative_selected", type: "smoothstep", source: "appointment_doctor_alternative_input", target: "appointment_alternative_display_labels_set", isDefault: false });

removeEdge("edge_custom_appointment_display_labels_slots");
removeEdge("edge_custom_appointment_display_labels_default");
upsertEdge({ id: "edge_migrated_appointment_display_policy", type: "smoothstep", source: "appointment_display_labels_set", target: "appointment_booking_policy_list", isDefault: false });
upsertEdge({ id: "edge_migrated_appointment_alternative_display_policy", type: "smoothstep", source: "appointment_alternative_display_labels_set", target: "appointment_booking_policy_list", isDefault: false });
upsertEdge({ id: "edge_migrated_appointment_policy_rules", type: "smoothstep", source: "appointment_booking_policy_list", target: "appointment_available_slots_list", isDefault: false });
upsertEdge({ id: "edge_migrated_appointment_rules_exceptions", type: "smoothstep", source: "appointment_available_slots_list", target: "appointment_schedule_exceptions_list", isDefault: false });
upsertEdge({ id: "edge_migrated_appointment_exceptions_reservations", type: "smoothstep", source: "appointment_schedule_exceptions_list", target: "appointment_active_reservations_list", isDefault: false });
removeEdge("edge_custom_appointment_slots_list_filter");
removeEdge("edge_115_appointment_available_slots_list_appointment_no_slots_message");
upsertEdge({ id: "edge_migrated_appointment_reservations_filter", type: "smoothstep", source: "appointment_active_reservations_list", target: "appointment_filter_available_slots", isDefault: false });

removeEdge("edge_custom_appointment_alt_display_labels_slots");
removeEdge("edge_custom_appointment_alt_display_labels_default");
upsertEdge({ id: "edge_migrated_appointment_alt_display_policy", type: "smoothstep", source: "appointment_alternate_display_labels_set", target: "appointment_alternate_booking_policy_list", isDefault: false });
upsertEdge({ id: "edge_migrated_appointment_alt_policy_rules", type: "smoothstep", source: "appointment_alternate_booking_policy_list", target: "appointment_alternate_available_slots_list", isDefault: false });
upsertEdge({ id: "edge_migrated_appointment_alt_rules_exceptions", type: "smoothstep", source: "appointment_alternate_available_slots_list", target: "appointment_alternate_schedule_exceptions_list", isDefault: false });
upsertEdge({ id: "edge_migrated_appointment_alt_exceptions_reservations", type: "smoothstep", source: "appointment_alternate_schedule_exceptions_list", target: "appointment_alternate_active_reservations_list", isDefault: false });
removeEdge("edge_custom_appointment_alt_slots_list_filter");
removeEdge("edge_119_appointment_alternate_available_slots_list_appointment_no_slots_end_message");
upsertEdge({ id: "edge_migrated_appointment_alt_reservations_filter", type: "smoothstep", source: "appointment_alternate_active_reservations_list", target: "appointment_filter_alternate_slots", isDefault: false });

removeEdge("edge_134_appointment_slot_conflict_message_appointment_conflict_available_slots_list");
upsertEdge({ id: "edge_migrated_appointment_conflict_message_policy", type: "smoothstep", source: "appointment_slot_conflict_message", target: "appointment_conflict_booking_policy_list", isDefault: false });
upsertEdge({ id: "edge_migrated_appointment_conflict_policy_rules", type: "smoothstep", source: "appointment_conflict_booking_policy_list", target: "appointment_conflict_available_slots_list", isDefault: false });
upsertEdge({ id: "edge_migrated_appointment_conflict_rules_exceptions", type: "smoothstep", source: "appointment_conflict_available_slots_list", target: "appointment_conflict_schedule_exceptions_list", isDefault: false });
upsertEdge({ id: "edge_migrated_appointment_conflict_exceptions_reservations", type: "smoothstep", source: "appointment_conflict_schedule_exceptions_list", target: "appointment_conflict_active_reservations_list", isDefault: false });
removeEdge("edge_custom_appointment_conflict_slots_list_filter");
removeEdge("edge_136_appointment_conflict_available_slots_list_appointment_conflict_no_slots_message");
upsertEdge({ id: "edge_migrated_appointment_conflict_reservations_filter", type: "smoothstep", source: "appointment_conflict_active_reservations_list", target: "appointment_filter_conflict_slots", isDefault: false });

removeEdge("edge_123_appointment_set_ids_appointment_duplicate_check");
upsertEdge({ id: "edge_migrated_appointment_set_ids_prepare_hold", type: "smoothstep", source: "appointment_set_ids", target: "appointment_prepare_reservation_hold", isDefault: false });
upsertEdge({ id: "edge_migrated_appointment_prepare_hold_duplicate", type: "smoothstep", source: "appointment_prepare_reservation_hold", target: "appointment_duplicate_check", isDefault: false });

removeEdge("edge_138b_appointment_conflict_resolve_selected_slot_appointment_conflict_set_ids");
upsertEdge({ id: "edge_138b_appointment_conflict_resolve_selected_slot_appointment_conflict_set_ids", type: "smoothstep", source: "appointment_conflict_resolve_selected_slot", target: "appointment_conflict_set_ids", isDefault: false });
removeEdge("edge_141_appointment_conflict_duplicate_check_appointment_conflict_slot_hold_update");
upsertEdge({ id: "edge_migrated_appointment_conflict_set_ids_prepare_hold", type: "smoothstep", source: "appointment_conflict_set_ids", target: "appointment_conflict_prepare_reservation_hold", isDefault: false });
upsertEdge({ id: "edge_migrated_appointment_conflict_prepare_hold_duplicate", type: "smoothstep", source: "appointment_conflict_prepare_reservation_hold", target: "appointment_conflict_duplicate_check", isDefault: false });
upsertEdge({ id: "edge_141_appointment_conflict_duplicate_check_appointment_conflict_slot_hold_update", type: "smoothstep", source: "appointment_conflict_duplicate_check", target: "appointment_conflict_slot_hold_update", label: "no_duplicate", condition: { value: "not_found", operator: "equals" } });

removeEdge("edge_215_reschedule_confirm_decision_reschedule_available_slots_list");
upsertEdge({ id: "edge_migrated_reschedule_confirm_policy", type: "smoothstep", source: "reschedule_confirm_decision", target: "reschedule_booking_policy_list", label: "yes", condition: { value: "yes", operator: "equals" }, sourceHandle: "yes" });
upsertEdge({ id: "edge_migrated_reschedule_policy_rules", type: "smoothstep", source: "reschedule_booking_policy_list", target: "reschedule_available_slots_list", isDefault: false });
upsertEdge({ id: "edge_migrated_reschedule_rules_exceptions", type: "smoothstep", source: "reschedule_available_slots_list", target: "reschedule_schedule_exceptions_list", isDefault: false });
removeEdge("edge_218_reschedule_available_slots_list_reschedule_filter_available_slots");
upsertEdge({ id: "edge_migrated_reschedule_exceptions_reservations", type: "smoothstep", source: "reschedule_schedule_exceptions_list", target: "reschedule_active_reservations_list", isDefault: false });
upsertEdge({ id: "edge_migrated_reschedule_reservations_filter", type: "smoothstep", source: "reschedule_active_reservations_list", target: "reschedule_filter_available_slots", isDefault: false });

removeEdge("edge_225_reschedule_set_new_slot_vars_reschedule_duplicate_check");
upsertEdge({ id: "edge_migrated_reschedule_set_ids_prepare_hold", type: "smoothstep", source: "reschedule_set_new_slot_vars", target: "reschedule_prepare_reservation_hold", isDefault: false });
upsertEdge({ id: "edge_migrated_reschedule_prepare_hold_duplicate", type: "smoothstep", source: "reschedule_prepare_reservation_hold", target: "reschedule_duplicate_check", isDefault: false });

removeEdge("edge_292_availability_doctor_list_availability_carousel");
removeEdge("edge_293_availability_doctor_list_availability_carousel");
upsertEdge({ id: "edge_migrated_availability_list_format", type: "smoothstep", source: "availability_doctor_list", target: "availability_format_results", isDefault: false });
upsertEdge({ id: "edge_migrated_availability_format_message", type: "smoothstep", source: "availability_format_results", target: "availability_carousel", isDefault: false });

removeEdge("edge_300_doctor_profile_lookup_doctor_profile_carousel");
removeEdge("edge_301_doctor_profile_lookup_doctor_profile_carousel");
upsertEdge({ id: "edge_migrated_profile_list_format", type: "smoothstep", source: "doctor_profile_lookup", target: "doctor_profile_format_results", isDefault: false });
upsertEdge({ id: "edge_migrated_profile_format_message", type: "smoothstep", source: "doctor_profile_format_results", target: "doctor_profile_carousel", isDefault: false });

for (const node of flow.nodes) {
  node.data = replaceStringValuesDeep(node.data, [
    ["{{appointment_fee}}", "{{appointment_booking_fee}}"]
  ]);
}

doc.metadata.nodeCount = flow.nodes.length;
doc.metadata.edgeCount = flow.edges.length;
doc.metadata.updatedForRecurringScheduleAt = new Date().toISOString();
doc.metadata.scheduleModel = "doctor_availability_rules + doctor_schedule_exceptions + appointment_reservations";
doc.metadata.slotGenerationWindowDays = 31;
doc.metadata.mobileOtpVerificationMode = "accept_any_6_digit_code";
doc.metadata.dbDataAlignmentNotes = "Updated for recurring doctor schedule data. Booking and reschedule now derive available slots from rules, exceptions, booking policy, and active reservations.";
doc.metadata.doctorInventorySlotFallbackNotes = "Removed next_available_slot fallback. Booking requires recurring schedule rules and dynamically generated availability.";

writeFileSync(sourcePath, JSON.stringify(doc, null, 2) + "\n");
console.log(`Updated ${sourcePath}`);
console.log(`Nodes: ${flow.nodes.length}`);
console.log(`Edges: ${flow.edges.length}`);
