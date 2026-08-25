import fs from "node:fs";
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
const document = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
const flow = document.flow;

function getNode(id) {
  const node = flow.nodes.find((item) => item.id === id);
  if (!node) throw new Error(`Missing node: ${id}`);
  return node;
}

function removeNodes(ids) {
  const idSet = new Set(ids);
  flow.nodes = flow.nodes.filter((node) => !idSet.has(node.id));
}

function removeEdges(match) {
  flow.edges = flow.edges.filter((edge) => !match(edge));
}

function ensureEdge(edge) {
  const index = flow.edges.findIndex(
    (item) =>
      item.id === edge.id ||
      (item.source === edge.source &&
        item.target === edge.target &&
        String(item.label || "") === String(edge.label || ""))
  );
  if (index >= 0) {
    flow.edges[index] = { ...flow.edges[index], ...edge };
    return;
  }
  flow.edges.push(edge);
}

function makeEdge(source, target, opts = {}) {
  const edge = {
    id:
      opts.id ||
      `edge_${source}_${target}${opts.label ? `_${String(opts.label).replace(/[^a-z0-9]+/gi, "_")}` : ""}`,
    type: "smoothstep",
    source,
    target
  };
  if (opts.label) edge.label = opts.label;
  if (opts.isDefault) edge.isDefault = true;
  if (opts.condition) edge.condition = opts.condition;
  return edge;
}

const departmentButtons = [
  { label: "General Medicine", value: "general_medicine" },
  { label: "Orthopedics", value: "orthopedics" },
  { label: "Cardiology", value: "cardiology" },
  { label: "Dermatology", value: "dermatology" },
  { label: "Pediatrics", value: "pediatrics" },
  { label: "Gynecology", value: "gynecology" },
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
  { label: "Emergency Medicine", value: "emergency_medicine" }
];

const appointmentButtons = [
  ...departmentButtons,
  { label: "Not sure / describe issue", value: "not_sure" }
];

getNode("appointment_department_input").data = {
  ...getNode("appointment_department_input").data,
  buttons: appointmentButtons,
  messages: [
    "Choose the department. If you are not sure, select Not sure / describe issue or type your concern in your own words."
  ],
  variable: "department"
};

getNode("appointment_department_prepare").data.script = `
function normalizeText(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
}
const departmentKeys = new Set([
  "general_medicine",
  "orthopedics",
  "cardiology",
  "dermatology",
  "pediatrics",
  "gynecology",
  "ent",
  "ophthalmology",
  "gastroenterology",
  "endocrinology",
  "pulmonology",
  "psychiatry",
  "urology",
  "nephrology",
  "general_surgery",
  "rheumatology",
  "oncology",
  "physiotherapy",
  "dentistry",
  "diabetology",
  "emergency_medicine"
]);
const raw = String(vars.department || "").trim();
const normalized = normalizeText(raw);
vars.department_help_entry_source = "appointment_booking";
if (!raw || normalized === "not_sure") {
  vars.appointment_department_route = "ask_concern";
  return { route: vars.appointment_department_route };
}
if (departmentKeys.has(normalized)) {
  vars.department = normalized;
  vars.availability_department = normalized;
  vars.appointment_department_route = "department";
  return { route: vars.appointment_department_route, department: normalized };
}
vars.department_reason = raw;
vars.department = "";
vars.availability_department = "";
vars.appointment_department_route = "resolve_concern";
return { route: vars.appointment_department_route, concern: raw };
`;

getNode("appointment_department_ai_match").data = {
  ...getNode("appointment_department_ai_match").data,
  contextTemplate:
    "Hospital department routing reference:\\n- Allowed department keys only: general_medicine, orthopedics, cardiology, dermatology, pediatrics, gynecology, ent, ophthalmology, gastroenterology, endocrinology, pulmonology, psychiatry, urology, nephrology, general_surgery, rheumatology, oncology, physiotherapy, dentistry, diabetology, emergency_medicine.\\n- Orthopedics: bone, fracture, joint, knee, hip, shoulder, back, spine, muscle, ligament, sports injury.\\n- Cardiology: chest pain without obvious trauma, palpitations, blood pressure, heart-related symptoms.\\n- Dermatology: skin rash, allergy, itching, acne, pigmentation, hair or nail concerns.\\n- Pediatrics: infant, child, vaccination, child fever, child cough, growth concerns.\\n- Gynecology: menstrual issues, pregnancy, fertility, women's health symptoms.\\n- ENT: ear pain, hearing issue, sinus, nose block, throat pain, tonsils, voice concerns.\\n- Ophthalmology: eye pain, redness, blurred vision, watering, irritation.\\n- Gastroenterology: stomach pain, acidity, vomiting, digestion, liver, bowel concerns.\\n- Endocrinology: thyroid, hormone, metabolic or endocrine disorders.\\n- Pulmonology: cough, asthma, breathing issues, lung concerns when not emergency.\\n- Psychiatry: anxiety, depression, sleep, stress, behavior, mental health concerns.\\n- Urology: urine problems, bladder, prostate, male urinary concerns.\\n- Nephrology: kidney disease, renal issues, dialysis-related concerns.\\n- General surgery: hernia, piles, gallbladder, appendix, surgical opinion.\\n- Rheumatology: autoimmune joint pain, inflammatory arthritis, connective tissue disorders.\\n- Oncology: cancer diagnosis, tumor, chemotherapy, radiation follow-up.\\n- Physiotherapy: rehab, recovery exercise, mobility support after injury or surgery.\\n- Dentistry: teeth, gums, jaw, mouth pain, dental cleaning or cavities.\\n- Diabetology: diabetes review, sugar control, diabetic follow-up.\\n- General medicine: broad fever, infection, weakness, headache, body pain, unclear adult symptoms.\\n- Emergency medicine: severe chest pain, trouble breathing, stroke-like symptoms, severe bleeding, unconsciousness, seizure, major trauma, collapse, or any immediately life-threatening concern.\\n- If the concern is broad or unclear but not urgent, prefer general_medicine.\\n- Output must be one department key only and nothing else.",
  inputTemplate: "{{department_reason}}",
  instructions:
    "Review the patient concern using only the routing context. Return exactly one allowed department key and no explanation. If the concern is clearly urgent or life-threatening, return emergency_medicine. If the concern is too broad or lacks enough detail for a specialty, return general_medicine.",
  emitResponse: false
};

getNode("appointment_department_match_prepare").data.script = `
function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "")
    .trim();
}
function titleCase(value) {
  return String(value || "")
    .replace(/[_-]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.toLowerCase() === "ent" ? "ENT" : part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
const aliases = {
  general_surgery: "general_surgery",
  emergency_medicine: "emergency_medicine",
  general_medicine: "general_medicine",
  gastroenterology: "gastroenterology",
  endocrinology: "endocrinology",
  physiotherapy: "physiotherapy",
  rheumatology: "rheumatology",
  ophthalmology: "ophthalmology",
  pulmonology: "pulmonology",
  orthopaedics: "orthopedics",
  orthopedics: "orthopedics",
  cardiology: "cardiology",
  dermatology: "dermatology",
  gynecology: "gynecology",
  pediatrics: "pediatrics",
  psychiatry: "psychiatry",
  nephrology: "nephrology",
  diabetology: "diabetology",
  dentistry: "dentistry",
  oncology: "oncology",
  urology: "urology",
  surgery: "general_surgery",
  general: "general_medicine",
  internal_medicine: "general_medicine",
  family_medicine: "general_medicine",
  cardio: "cardiology",
  orthopedic: "orthopedics",
  ortho: "orthopedics",
  skin: "dermatology",
  pediatric: "pediatrics",
  child_health: "pediatrics",
  gynaecology: "gynecology",
  women_health: "gynecology",
  ent: "ent",
  eye: "ophthalmology",
  gastro: "gastroenterology",
  endocrine: "endocrinology",
  pulmonary: "pulmonology",
  mental_health: "psychiatry",
  kidney: "nephrology",
  physio: "physiotherapy",
  dental: "dentistry",
  diabetes: "diabetology",
  emergency: "emergency_medicine"
};
const allowedDepartments = Array.from(new Set(Object.values(aliases)));
const aliasEntries = Object.entries(aliases).sort((a, b) => b[0].length - a[0].length);
function resolveDepartment(value) {
  const raw = String(value || "").trim();
  const normalized = normalizeText(raw);
  if (!normalized) return "";
  if (aliases[normalized]) return aliases[normalized];
  if (allowedDepartments.includes(normalized)) return normalized;
  const spaced = normalized.replace(/_/g, " ");
  for (const [alias, department] of aliasEntries) {
    const aliasSpaced = alias.replace(/_/g, " ");
    if (normalized.includes(alias) || spaced.includes(aliasSpaced) || raw.toLowerCase().includes(aliasSpaced)) {
      return department;
    }
  }
  return "";
}
const raw = String(vars.appointment_department_ai_raw_match || vars.appointment_department_ai_match_result || "").trim();
const matched = resolveDepartment(raw);
vars.appointment_department_ai_route = matched === "emergency_medicine" ? "emergency" : (matched ? "matched" : "manual");
if (matched) {
  vars.department = matched;
  vars.availability_department = matched;
  vars.appointment_department_match_text = matched === "emergency_medicine"
    ? "The concern sounds urgent. Please use the emergency support options below instead of a routine appointment booking."
    : "Based on what you described, " + titleCase(matched) + " looks like the right department for this concern. I will continue with the booking.";
} else {
  vars.appointment_department_match_text = "I could not confidently match the concern to one department. Please choose the closest department so I can continue with the booking.";
}
return { route: vars.appointment_department_ai_route, matched_department: matched, raw };
`;

getNode("appointment_department_manual_input").data = {
  ...getNode("appointment_department_manual_input").data,
  buttons: departmentButtons,
  messages: [
    "I could not confidently map the concern to one department. Please choose the closest department so I can continue with the booking."
  ],
  variable: "availability_department"
};

getNode("availability_department_input").data = {
  ...getNode("availability_department_input").data,
  buttons: departmentButtons,
  messages: ["Choose a department to see available doctors in this branch."],
  variable: "availability_department"
};

getNode("doctor_profile_department_input").data = {
  ...getNode("doctor_profile_department_input").data,
  buttons: departmentButtons,
  messages: ["Choose a department to see available doctors in this branch."],
  variable: "doctor_profile_department"
};

getNode("online_symptom_form").data = {
  ...getNode("online_symptom_form").data,
  buttons: departmentButtons,
  messages: ["Choose the department for the online consultation."],
  variable: "availability_department"
};

getNode("department_choice_input").data = {
  ...getNode("department_choice_input").data,
  buttons: departmentButtons,
  messages: [
    "I could not confidently map the concern to one department. Please choose the closest department so I can show the available doctors."
  ],
  variable: "availability_department"
};

getNode("department_help_ai_match").data = {
  ...getNode("department_help_ai_match").data,
  contextTemplate:
    "Hospital department routing reference for appointment booking:\\n- Allowed department keys only: general_medicine, orthopedics, cardiology, dermatology, pediatrics, gynecology, ent, ophthalmology, gastroenterology, endocrinology, pulmonology, psychiatry, urology, nephrology, general_surgery, rheumatology, oncology, physiotherapy, dentistry, diabetology, emergency_medicine.\\n- Orthopedics: bone, fracture, joint, knee, hip, shoulder, back, spine, muscle, ligament, sports injury.\\n- Cardiology: chest pain without obvious trauma, palpitations, blood pressure, heart-related symptoms.\\n- Dermatology: skin rash, allergy, itching, acne, pigmentation, hair or nail concerns.\\n- Pediatrics: infant, child, vaccination, child fever, child cough, growth concerns.\\n- Gynecology: menstrual issues, pregnancy, fertility, women's health symptoms.\\n- ENT: ear pain, hearing issue, sinus, nose block, throat pain, tonsils, voice concerns.\\n- Ophthalmology: eye pain, redness, blurred vision, watering, irritation.\\n- Gastroenterology: stomach pain, acidity, vomiting, digestion, liver, bowel concerns.\\n- Endocrinology: thyroid, hormone, metabolic or endocrine disorders.\\n- Pulmonology: cough, asthma, breathing issues, lung concerns when not emergency.\\n- Psychiatry: anxiety, depression, sleep, stress, behavior, mental health concerns.\\n- Urology: urine problems, bladder, prostate, male urinary concerns.\\n- Nephrology: kidney disease, renal issues, dialysis-related concerns.\\n- General surgery: hernia, piles, gallbladder, appendix, surgical opinion.\\n- Rheumatology: autoimmune joint pain, inflammatory arthritis, connective tissue disorders.\\n- Oncology: cancer diagnosis, tumor, chemotherapy, radiation follow-up.\\n- Physiotherapy: rehab, recovery exercise, mobility support after injury or surgery.\\n- Dentistry: teeth, gums, jaw, mouth pain, dental cleaning or cavities.\\n- Diabetology: diabetes review, sugar control, diabetic follow-up.\\n- General medicine: broad fever, infection, weakness, headache, body pain, unclear adult symptoms.\\n- Emergency medicine: severe chest pain, trouble breathing, stroke-like symptoms, severe bleeding, unconsciousness, seizure, major trauma, collapse, or any immediately life-threatening concern.\\n- If the concern is broad or unclear but not urgent, prefer general_medicine.\\n- Output must be one department key only and nothing else.",
  inputTemplate: "{{department_reason}}",
  instructions:
    "Review the patient concern using only the routing context. Return exactly one allowed department key and no explanation. If the concern is clearly urgent or life-threatening, return emergency_medicine. If the concern is too broad or lacks enough detail for a specialty, return general_medicine.",
  emitResponse: false
};

getNode("department_help_match_prepare").data.script = `
function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "")
    .trim();
}
function titleCase(value) {
  return String(value || "")
    .replace(/[_-]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.toLowerCase() === "ent" ? "ENT" : part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
const aliases = {
  general_surgery: "general_surgery",
  emergency_medicine: "emergency_medicine",
  general_medicine: "general_medicine",
  gastroenterology: "gastroenterology",
  endocrinology: "endocrinology",
  physiotherapy: "physiotherapy",
  rheumatology: "rheumatology",
  ophthalmology: "ophthalmology",
  pulmonology: "pulmonology",
  orthopaedics: "orthopedics",
  orthopedics: "orthopedics",
  cardiology: "cardiology",
  dermatology: "dermatology",
  gynecology: "gynecology",
  pediatrics: "pediatrics",
  psychiatry: "psychiatry",
  nephrology: "nephrology",
  diabetology: "diabetology",
  dentistry: "dentistry",
  oncology: "oncology",
  urology: "urology",
  surgery: "general_surgery",
  general: "general_medicine",
  internal_medicine: "general_medicine",
  family_medicine: "general_medicine",
  cardio: "cardiology",
  orthopedic: "orthopedics",
  ortho: "orthopedics",
  skin: "dermatology",
  pediatric: "pediatrics",
  child_health: "pediatrics",
  gynaecology: "gynecology",
  women_health: "gynecology",
  ent: "ent",
  eye: "ophthalmology",
  gastro: "gastroenterology",
  endocrine: "endocrinology",
  pulmonary: "pulmonology",
  mental_health: "psychiatry",
  kidney: "nephrology",
  physio: "physiotherapy",
  dental: "dentistry",
  diabetes: "diabetology",
  emergency: "emergency_medicine"
};
const allowedDepartments = Array.from(new Set(Object.values(aliases)));
const aliasEntries = Object.entries(aliases).sort((a, b) => b[0].length - a[0].length);
function resolveDepartment(value) {
  const raw = String(value || "").trim();
  const normalized = normalizeText(raw);
  if (!normalized) return "";
  if (aliases[normalized]) return aliases[normalized];
  if (allowedDepartments.includes(normalized)) return normalized;
  const spaced = normalized.replace(/_/g, " ");
  for (const [alias, department] of aliasEntries) {
    const aliasSpaced = alias.replace(/_/g, " ");
    if (normalized.includes(alias) || spaced.includes(aliasSpaced) || raw.toLowerCase().includes(aliasSpaced)) {
      return department;
    }
  }
  return "";
}
const raw = String(vars.department_help_ai_raw_match || vars.department_help_ai_match_result || "").trim();
const matched = resolveDepartment(raw);
vars.department_help_matched_department = matched;
vars.department_help_route = matched === "emergency_medicine" ? "emergency" : (matched ? "matched" : "manual");
if (matched) {
  vars.department = matched;
  vars.availability_department = matched;
  vars.department_help_match_text = matched === "emergency_medicine"
    ? "The concern sounds urgent. Please use the emergency support options below instead of a routine appointment booking."
    : "Based on what you described, " + titleCase(matched) + " looks like the right department for this concern. I will now show the available doctors across branches.";
} else {
  vars.department_help_match_text = "I could not confidently match the concern to one department. Please choose the closest department so I can continue.";
}
return { route: vars.department_help_route, matched_department: matched, raw };
`;

getNode("department_help_manual_prepare").data.script = `
function titleCase(value) {
  return String(value || "")
    .replace(/[_-]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.toLowerCase() === "ent" ? "ENT" : part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
const selected = String(vars.availability_department || "").trim();
vars.department = selected;
vars.department_help_match_text = selected
  ? "I will now show the available doctors in " + titleCase(selected) + " across branches."
  : "I will show the available doctors for the selected department.";
return { department: selected };
`;

for (const edge of flow.edges) {
  if (edge.target === "shared_departments_fetch") {
    edge.target = "main_intent_router";
  }
}

removeEdges(
  (edge) =>
    edge.source === "shared_departments_fetch" ||
    edge.source === "shared_departments_catalog_prepare" ||
    (edge.source === "appointment_department_manual_input" && edge.target === "appointment_department_manual_prepare") ||
    edge.source === "appointment_department_manual_prepare" ||
    edge.source === "appointment_department_manual_route" ||
    (edge.source === "availability_department_input" && edge.target === "availability_department_prepare") ||
    edge.source === "availability_department_prepare" ||
    edge.source === "availability_department_route" ||
    (edge.source === "doctor_profile_department_input" && edge.target === "doctor_profile_department_prepare") ||
    edge.source === "doctor_profile_department_prepare" ||
    edge.source === "doctor_profile_department_route" ||
    (edge.source === "online_symptom_form" && edge.target === "online_department_prepare") ||
    edge.source === "online_department_prepare" ||
    edge.source === "online_department_route" ||
    (edge.source === "department_choice_input" && edge.target === "department_help_manual_prepare") ||
    edge.source === "department_help_manual_prepare" ||
    edge.source === "department_help_manual_route" ||
    (edge.source === "appointment_consultation_type_input" && edge.target === "appointment_department_input") ||
    (edge.source === "department_reason_input" && edge.target === "department_help_ai_match") ||
    (edge.source === "availability_entry_branch_input" && edge.target === "availability_department_input") ||
    (edge.source === "doctor_profile_input" && edge.target === "doctor_profile_department_input") ||
    (edge.source === "online_booking_defaults" && edge.target === "online_symptom_form") ||
    edge.id === "edge_appointment_department_manual_invalid_message_appointment_department_manual_invalid_end" ||
    edge.id === "edge_department_help_manual_invalid_message_department_help_manual_invalid_end" ||
    edge.id === "edge_availability_department_invalid_message_availability_department_invalid_end" ||
    edge.id === "edge_doctor_profile_department_invalid_message_doctor_profile_department_invalid_end" ||
    edge.id === "edge_online_department_invalid_message_online_department_invalid_end"
);

[
  makeEdge("appointment_consultation_type_input", "appointment_department_input"),
  makeEdge("appointment_department_ai_route", "appointment_department_manual_input", { isDefault: true }),
  makeEdge("appointment_department_manual_input", "emergency_safety_message", {
    label: "emergency_medicine",
    condition: { value: "emergency_medicine", operator: "equals" }
  }),
  makeEdge("appointment_department_manual_input", "appointment_prepare_scope", { isDefault: true }),
  makeEdge("department_reason_input", "department_help_ai_match"),
  makeEdge("department_help_route", "department_choice_input", { isDefault: true }),
  makeEdge("department_choice_input", "emergency_safety_message", {
    label: "emergency_medicine",
    condition: { value: "emergency_medicine", operator: "equals" }
  }),
  makeEdge("department_choice_input", "department_help_manual_prepare", { isDefault: true }),
  makeEdge("department_help_manual_prepare", "department_safe_message"),
  makeEdge("availability_entry_branch_input", "availability_department_input"),
  makeEdge("availability_department_input", "availability_branch_doctor_list"),
  makeEdge("doctor_profile_input", "doctor_profile_department_input"),
  makeEdge("doctor_profile_department_input", "doctor_profile_lookup"),
  makeEdge("online_booking_defaults", "online_symptom_form"),
  makeEdge("online_symptom_form", "online_record")
].forEach(ensureEdge);

removeNodes([
  "shared_departments_fetch",
  "shared_departments_catalog_prepare",
  "appointment_department_manual_prepare",
  "appointment_department_manual_route",
  "appointment_department_manual_invalid_message",
  "appointment_department_manual_invalid_end",
  "department_help_manual_route",
  "department_help_manual_invalid_message",
  "department_help_manual_invalid_end",
  "availability_department_prepare",
  "availability_department_route",
  "availability_department_invalid_message",
  "availability_department_invalid_end",
  "doctor_profile_department_prepare",
  "doctor_profile_department_route",
  "doctor_profile_department_invalid_message",
  "doctor_profile_department_invalid_end",
  "online_department_prepare",
  "online_department_route",
  "online_department_invalid_message",
  "online_department_invalid_end"
]);

delete document.metadata.departmentCatalogSource;
delete document.metadata.departmentCatalogNotes;
delete document.metadata.departmentCatalogFetchMode;
document.metadata.nodeCount = flow.nodes.length;
document.metadata.edgeCount = flow.edges.length;

const tempPath = `${sourcePath}.tmp`;
fs.writeFileSync(tempPath, JSON.stringify(document, null, 2) + "\n");
console.log(`Wrote ${tempPath} with ${flow.nodes.length} nodes and ${flow.edges.length} edges.`);
