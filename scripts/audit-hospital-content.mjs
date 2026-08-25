import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const exportPath = resolve(
  process.argv[2] ??
    join(
      rootDir,
      "domains",
      "hospital",
      "templates",
      "hospital-full-automation.flow.json"
    )
);
const flowExport = JSON.parse(readFileSync(exportPath, "utf8"));
const errors = [];

const blockedPatterns = [
  /\bdemo\b/i,
  /\bdummy\b/i,
  /\bproduction clients?\b/i,
  /\breplace\b/i,
  /\bHMS\b/i,
  /\.local\b/i,
  /\bcurrent hospital record\b/i,
  /\bconfigured SLA\b/i,
  /\bmanager escalation queue\b/i,
  /\bmanual verification\b/i,
  /\bmanually\b/i,
  /\bqueued\b/i,
  /\brecorded\b/i,
  /Please enter a value/i,
  /We found your appointment details/i,
  /Appointment ID you want to (?:reschedule|cancel)/i,
  /could not match that Appointment ID/i,
  /\{\{appointment_status_result\.data\}\}/i,
  /\{\{doctor_id\}\}/i,
  /\{\{branch_id\}\}/i,
  /\{\{consultation_type\}\}/i,
  /\{\{(?:reschedule|cancel)_original_doctor_id\}\}/i,
  /\{\{(?:reschedule|cancel)_original_department\}\}/i,
  /\bdoc_(?:general|cardio|ortho|pedia|gyn|derma)_1\b/i,
  /\bmain_branch\b/i,
  /\bin_person\b/i,
  /General hospital question"/i
];

function addText(source, value, items) {
  if (typeof value === "string" && value.trim()) items.push({ source, value });
}

const patientTexts = [];

for (const item of flowExport.bot?.globalVariables ?? []) {
  if (["hospital_name", "report_portal_url", "payment_link"].includes(item.key)) {
    addText(`bot.globalVariables.${item.key}`, item.value, patientTexts);
  }
}

for (const node of flowExport.flow.nodes) {
  const data = node.data ?? {};
  const sourcePrefix = `${node.id}.${node.type}`;

  if (Array.isArray(data.messages)) {
    for (const [index, message] of data.messages.entries()) {
      addText(`${sourcePrefix}.messages[${index}]`, typeof message === "string" ? message : message?.text, patientTexts);
    }
  }

  addText(`${sourcePrefix}.introText`, data.introText, patientTexts);
  addText(`${sourcePrefix}.consentText`, data.consentText, patientTexts);
  addText(`${sourcePrefix}.waitingMessage`, data.waitingMessage, patientTexts);
  addText(`${sourcePrefix}.fallbackMessage`, data.fallbackMessage, patientTexts);
  addText(`${sourcePrefix}.fallbackResponseTemplate`, data.fallbackResponseTemplate, patientTexts);

  for (const [index, field] of (data.fields ?? []).entries()) {
    addText(`${sourcePrefix}.fields[${index}].label`, field.label, patientTexts);
  }

  for (const [index, button] of (data.buttons ?? []).entries()) {
    addText(`${sourcePrefix}.buttons[${index}].label`, button.label, patientTexts);
  }

  for (const [index, slide] of (data.slides ?? []).entries()) {
    addText(`${sourcePrefix}.slides[${index}].title`, slide.title, patientTexts);
    addText(`${sourcePrefix}.slides[${index}].heading`, slide.heading, patientTexts);
    addText(`${sourcePrefix}.slides[${index}].body`, slide.body, patientTexts);
  }

  for (const [index, channel] of (data.channels ?? []).entries()) {
    addText(`${sourcePrefix}.channels[${index}].message`, channel.message, patientTexts);
    addText(`${sourcePrefix}.channels[${index}].subject`, channel.subject, patientTexts);
    addText(`${sourcePrefix}.channels[${index}].body`, channel.body, patientTexts);
  }
}

for (const item of patientTexts) {
  for (const pattern of blockedPatterns) {
    if (pattern.test(item.value)) {
      errors.push(`${item.source}: blocked wording matched ${pattern}: ${item.value}`);
    }
  }
}

if (errors.length > 0) {
  console.error(`Hospital content audit failed for ${exportPath}`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Hospital content audit passed: ${exportPath}`);
console.log(`Checked patient-facing strings: ${patientTexts.length}`);
