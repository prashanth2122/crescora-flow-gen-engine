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

const targetNodes = [
  "appointment_department_input",
  "appointment_department_manual_input",
  "availability_department_input",
  "department_choice_input",
  "online_symptom_form",
  "doctor_profile_department_input"
];

const missingButtons = [
  { label: "Neurology", value: "neurology" },
  { label: "Obstetrics", value: "obstetrics" },
  { label: "Neurosurgery", value: "neurosurgery" }
];

function getNode(id) {
  const node = flow.nodes.find((item) => item.id === id);
  if (!node) throw new Error(`Missing node: ${id}`);
  return node;
}

function ensureButtons(nodeId) {
  const node = getNode(nodeId);
  const buttons = Array.isArray(node.data?.buttons) ? node.data.buttons.slice() : [];
  const values = new Set(buttons.map((button) => button.value));
  for (const button of missingButtons) {
    if (!values.has(button.value)) buttons.push(button);
  }
  node.data.buttons = buttons;
}

for (const nodeId of targetNodes) ensureButtons(nodeId);

function replaceInScript(nodeId, updater) {
  const node = getNode(nodeId);
  node.data.script = updater(String(node.data?.script || ""));
}

function ensureListMembers(script, anchor, insertText) {
  if (script.includes(insertText.trim())) return script;
  if (!script.includes(anchor)) throw new Error(`Anchor not found: ${anchor}`);
  return script.replace(anchor, `${anchor}${insertText}`);
}

replaceInScript("appointment_department_prepare", (script) =>
  ensureListMembers(
    script,
    '  "orthopedics",\n',
    '  "neurology",\n  "obstetrics",\n  "neurosurgery",\n'
  )
);

function ensureAliases(script) {
  const required = [
    ['  neurology: "neurology",\n', '  orthopedics: "orthopedics",\n'],
    ['  neurosurgery: "neurosurgery",\n', '  neurology: "neurology",\n'],
    ['  obstetrics: "obstetrics",\n', '  neurosurgery: "neurosurgery",\n'],
    ['  neurologist: "neurology",\n', '  cardio: "cardiology",\n'],
    ['  neuro: "neurology",\n', '  neurologist: "neurology",\n'],
    ['  neurosurgeon: "neurosurgery",\n', '  neuro: "neurology",\n'],
    ['  "brain surgery": "neurosurgery",\n', '  neurosurgeon: "neurosurgery",\n'],
    ['  "spine surgery": "neurosurgery",\n', '  "brain surgery": "neurosurgery",\n'],
    ['  pregnancy: "obstetrics",\n', '  "spine surgery": "neurosurgery",\n'],
    ['  antenatal: "obstetrics",\n', '  pregnancy: "obstetrics",\n'],
    ['  obstetric: "obstetrics",\n', '  antenatal: "obstetrics",\n']
  ];

  let output = script;
  for (const [line, after] of required) {
    if (!output.includes(line.trim())) {
      if (!output.includes(after)) throw new Error(`Alias anchor not found: ${after}`);
      output = output.replace(after, `${after}${line}`);
    }
  }
  return output;
}

replaceInScript("appointment_department_match_prepare", ensureAliases);
replaceInScript("department_help_match_prepare", ensureAliases);

function ensureContext(nodeId) {
  const node = getNode(nodeId);
  let text = String(node.data?.contextTemplate || "");
  if (!text.includes("neurology")) {
    text = text.replace(
      "general_medicine, orthopedics, cardiology, dermatology, pediatrics, gynecology, ent, ophthalmology, gastroenterology, endocrinology, pulmonology, psychiatry, urology, nephrology, general_surgery, rheumatology, oncology, physiotherapy, dentistry, diabetology, emergency_medicine.",
      "general_medicine, orthopedics, neurology, obstetrics, neurosurgery, cardiology, dermatology, pediatrics, gynecology, ent, ophthalmology, gastroenterology, endocrinology, pulmonology, psychiatry, urology, nephrology, general_surgery, rheumatology, oncology, physiotherapy, dentistry, diabetology, emergency_medicine."
    );
    text = text.replace(
      "- Orthopedics: bone, fracture, joint, knee, hip, shoulder, back, spine, muscle, ligament, sports injury.\\n- Cardiology:",
      "- Orthopedics: bone, fracture, joint, knee, hip, shoulder, back, spine, muscle, ligament, sports injury.\\n- Neurology: migraine, recurrent headache, seizure follow-up, nerve pain, numbness, tingling, memory concerns, tremor, balance issues, stroke follow-up when not an emergency.\\n- Obstetrics: pregnancy, antenatal care, pregnancy check-up, labour planning, postpartum follow-up, maternity-related concerns.\\n- Neurosurgery: brain surgery review, spine surgery review, disc compression needing surgical opinion, spinal cord compression, hydrocephalus, brain or spine tumor surgical opinion.\\n- Cardiology:"
    );
  }
  node.data.contextTemplate = text;
}

ensureContext("appointment_department_ai_match");
if (getNode("department_help_ai_match").data?.contextTemplate?.includes("Allowed department keys only")) {
  ensureContext("department_help_ai_match");
}

replaceInScript("appointment_prepare_scope", (script) => {
  if (script.includes('  neuro: "neurology",')) return script;
  const anchor = '  eye: "ophthalmology",\n  ent: "ent"\n};';
  if (!script.includes(anchor)) return script;
  return script.replace(
    anchor,
    '  eye: "ophthalmology",\n  ent: "ent",\n  neuro: "neurology",\n  neurologist: "neurology",\n  obstetric: "obstetrics",\n  pregnancy: "obstetrics",\n  neurosurgeon: "neurosurgery",\n  "brain surgery": "neurosurgery"\n};'
  );
});

document.metadata = document.metadata || {};
document.metadata.departmentCoverageUpdatedAt = new Date().toISOString();
document.metadata.departmentCoverageNotes =
  "Added neurology, obstetrics, and neurosurgery to static department pickers and booking/help routing logic.";

fs.writeFileSync(sourcePath, JSON.stringify(document, null, 2) + "\n");
console.log(`Updated ${sourcePath} with neurology, obstetrics, and neurosurgery.`);
