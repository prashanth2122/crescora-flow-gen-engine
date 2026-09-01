import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import assert from "node:assert/strict";

import { buildHospitalAppointmentSingleBranchFlow } from "./hospital-appointment-single-branch-flow.mjs";

test("single-branch appointment variant keeps the requested booking constraints", () => {
  const doc = buildHospitalAppointmentSingleBranchFlow();
  const nodeMap = new Map(doc.flow.nodes.map((node) => [node.id, node]));

  assert.equal(doc.bot.name, "Hospital Appointment Booking - Single Branch");
  assert.equal(nodeMap.has("appointment_branch_input"), false);
  assert.equal(nodeMap.has("appointment_consultation_type_input"), false);
  assert.equal(nodeMap.has("main_intent_router"), false);
  assert.equal(nodeMap.has("appointment_reminder_12h_scheduler"), true);
  assert.equal(nodeMap.has("appointment_reminder_2h_scheduler"), true);

  const otpNode = nodeMap.get("existing_patient_lookup_otp");
  assert.ok(otpNode);
  assert.equal(otpNode.type, "otp");
  assert.deepEqual(otpNode.data.channels, ["whatsapp"]);
  assert.equal(otpNode.data.resendCooldownSeconds, 30);
  assert.equal(otpNode.data.maxResends, 3);
  assert.equal(otpNode.data.outputVar, "existing_patient_lookup_otp_result");
  assert.equal(JSON.stringify(doc).includes("existing_patient_lookup_otp_expected"), false);

  const confirmationNode = nodeMap.get("appointment_confirmation");
  assert.ok(
    confirmationNode.data.messages[0].text.includes("Reminder notifications are scheduled for 12 hours and 2 hours before the appointment.")
  );
});

test("single-branch appointment variant remains validator-safe", () => {
  const tempDir = mkdtempSync(join(tmpdir(), "hospital-appointment-variant-"));
  const tempFile = join(tempDir, "assai-deepa-hospital-appointment-single-branch.flow.json");
  try {
    const doc = buildHospitalAppointmentSingleBranchFlow();
    writeFileSync(tempFile, `${JSON.stringify(doc, null, 2)}\n`, "utf8");
    execFileSync(process.execPath, ["scripts/validate-flow-export.mjs", tempFile], {
      cwd: process.cwd(),
      stdio: "pipe"
    });
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
});
