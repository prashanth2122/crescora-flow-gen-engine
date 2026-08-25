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
const nodes = new Map(flowExport.flow.nodes.map((node) => [node.id, node]));
const outgoing = new Map();
const sourceDrivenTemplate = typeof flowExport.metadata?.sourceOfTruth === "string";

for (const edge of flowExport.flow.edges) {
  if (!outgoing.has(edge.source)) outgoing.set(edge.source, []);
  outgoing.get(edge.source).push(edge);
}

const errors = [];

function fail(message) {
  errors.push(message);
}

function nodeType(id) {
  return nodes.get(id)?.type;
}

function hasEdge(source, target, conditionValue = undefined) {
  return (outgoing.get(source) ?? []).some((edge) => {
    if (edge.target !== target) return false;
    if (conditionValue === undefined) return true;
    return edge.condition?.value === conditionValue;
  });
}

function requireNode(id, type) {
  const actual = nodeType(id);
  if (actual !== type) fail(`Expected ${id} to be ${type}; got ${actual ?? "missing"}`);
}

function requireEdge(source, target, conditionValue = undefined) {
  if (!hasEdge(source, target, conditionValue)) {
    fail(`Expected edge ${source} -> ${target}${conditionValue ? ` for ${conditionValue}` : ""}`);
  }
}

function forbidEdge(source, target) {
  if (hasEdge(source, target)) {
    fail(`Did not expect edge ${source} -> ${target}`);
  }
}

function forbidNode(id) {
  if (nodes.has(id)) {
    fail(`Did not expect node ${id}`);
  }
}

function requireFormField(nodeId, fieldKey) {
  const fields = nodes.get(nodeId)?.data?.fields ?? [];
  if (!fields.some((field) => field.key === fieldKey)) {
    fail(`Expected form ${nodeId} to include field ${fieldKey}`);
  }
}

function forbidFormField(nodeId, fieldKey) {
  const fields = nodes.get(nodeId)?.data?.fields ?? [];
  if (fields.some((field) => field.key === fieldKey)) {
    fail(`Did not expect form ${nodeId} to include field ${fieldKey}`);
  }
}

function requireRecordValue(nodeId, key, expectedValue) {
  const actual = nodes.get(nodeId)?.data?.data?.[key];
  if (actual !== expectedValue) {
    fail(`Expected record ${nodeId} data.${key} to be ${expectedValue}; got ${actual ?? "missing"}`);
  }
}

function forbidRecordValue(nodeId, key) {
  const data = nodes.get(nodeId)?.data?.data ?? {};
  if (Object.prototype.hasOwnProperty.call(data, key)) {
    fail(`Did not expect record ${nodeId} data.${key}`);
  }
}

function requireRecordWhereValue(nodeId, key, expectedValue) {
  const actual = nodes.get(nodeId)?.data?.where?.[key];
  if (actual !== expectedValue) {
    fail(`Expected record ${nodeId} where.${key} to be ${expectedValue}; got ${actual ?? "missing"}`);
  }
}

function requireSetVariableValue(nodeId, key, expectedValue) {
  const assignments = nodes.get(nodeId)?.data?.assignments ?? [];
  const actual = assignments.find((assignment) => assignment.key === key)?.value;
  if (actual !== expectedValue) {
    fail(`Expected setVariable ${nodeId} assignment ${key} to be ${expectedValue}; got ${actual ?? "missing"}`);
  }
}

function requireScriptIncludes(nodeId, expectedText) {
  const script = nodes.get(nodeId)?.data?.script ?? "";
  if (!script.includes(expectedText)) {
    fail(`Expected script ${nodeId} to include ${expectedText}`);
  }
}

function requireNodeMessageIncludes(nodeId, expectedText) {
  const messages = nodes.get(nodeId)?.data?.messages ?? [];
  const text = messages
    .map((message) => (typeof message === "string" ? message : message?.text ?? ""))
    .join("\n");
  if (!text.includes(expectedText)) {
    fail(`Expected ${nodeId} message to include ${expectedText}`);
  }
}

function forbidNodeMessageIncludes(nodeId, forbiddenText) {
  const messages = nodes.get(nodeId)?.data?.messages ?? [];
  const text = messages
    .map((message) => (typeof message === "string" ? message : message?.text ?? ""))
    .join("\n");
  if (text.includes(forbiddenText)) {
    fail(`Did not expect ${nodeId} message to include ${forbiddenText}`);
  }
}

function requireNodeDataValue(nodeId, key, expectedValue) {
  const actual = nodes.get(nodeId)?.data?.[key];
  if (actual !== expectedValue) {
    fail(`Expected node ${nodeId} data.${key} to be ${expectedValue}; got ${actual ?? "missing"}`);
  }
}

function requireMetadataValue(key, expectedValue) {
  const actual = flowExport.metadata?.[key];
  if (actual !== expectedValue) {
    fail(`Expected metadata.${key} to be ${expectedValue}; got ${actual ?? "missing"}`);
  }
}

function requireSchemaField(nodeId, fieldKey) {
  const rawSchema = nodes.get(nodeId)?.data?.collectionSchema;
  let schema;
  try {
    schema = typeof rawSchema === "string" ? JSON.parse(rawSchema) : rawSchema;
  } catch {
    fail(`Expected ${nodeId} collectionSchema to be valid JSON`);
    return;
  }
  if (!schema?.fields?.[fieldKey]) {
    fail(`Expected ${nodeId} collectionSchema to include field ${fieldKey}`);
  }
}

function schemaFor(nodeId) {
  const rawSchema = nodes.get(nodeId)?.data?.collectionSchema;
  try {
    return typeof rawSchema === "string" ? JSON.parse(rawSchema) : rawSchema;
  } catch {
    fail(`Expected ${nodeId} collectionSchema to be valid JSON`);
    return undefined;
  }
}

function requireButtonValues(nodeId, expectedValues) {
  const buttons = nodes.get(nodeId)?.data?.buttons ?? [];
  const values = new Set(buttons.map((button) => button.value));
  for (const value of expectedValues) {
    if (!values.has(value)) fail(`Expected ${nodeId} to include button value ${value}`);
  }
}

function forbidButtonValues(nodeId, forbiddenValues) {
  const buttons = nodes.get(nodeId)?.data?.buttons ?? [];
  const values = new Set(buttons.map((button) => button.value));
  for (const value of forbiddenValues) {
    if (values.has(value)) fail(`Did not expect ${nodeId} to include stale button value ${value}`);
  }
}

function requireOtpGate({ prefix, formId, nextId, otpVar }) {
  const inputId = `${prefix}_otp_input`;
  const validateId = `${prefix}_otp_validate`;
  const routeId = `${prefix}_otp_route`;
  const invalidMessageId = `${prefix}_otp_invalid_message`;
  const invalidEndId = `${prefix}_otp_invalid_end`;

  requireNode(inputId, "input");
  requireNode(validateId, "script");
  requireNode(routeId, "switch");
  requireNode(invalidMessageId, "message");
  requireNode(invalidEndId, "end");

  requireNodeDataValue(inputId, "variable", otpVar);
  requireNodeDataValue(routeId, "variable", routeId);
  requireScriptIncludes(validateId, "/^\\d{6}$/.test(otp)");
  requireScriptIncludes(validateId, `vars.${routeId} =`);
  requireNodeMessageIncludes(invalidMessageId, "The OTP must be a 6-digit number.");

  requireEdge(formId, inputId);
  requireEdge(inputId, validateId);
  requireEdge(validateId, routeId);
  requireEdge(routeId, nextId, "valid");
  requireEdge(routeId, invalidMessageId);
  requireEdge(invalidMessageId, invalidEndId);
  forbidEdge(formId, nextId);
}

requireNode("main_request_input", "input");
requireNode("main_intent_router", "intent-router");
if (!sourceDrivenTemplate) {
  requireNode("language_detection", "language");
  requireNode("language_selection_input", "input");
}
requireNode("unknown_faq", "faq");
requireNode("emergency_form", "form");
requireNode("emergency_ticket_record", "record");
requireNode("existing_patient_lookup_form", "form");
requireNode("existing_appointment_form", "form");
requireNode("existing_patient_find", "record");
requireNode("appointment_existing_patient_set", "setVariable");
requireNode("appointment_upcoming_find", "record");
requireNode("appointment_upcoming_message", "message");
requireNode("appointment_upcoming_proceed_decision", "decision");
requireNode("appointment_upcoming_check_unavailable_message", "message");
requireNode("appointment_upcoming_check_unavailable_end", "end");
requireNode("appointment_new_patient_prepare", "setVariable");
requireNode("appointment_patient_lookup_unavailable_message", "message");
requireNode("appointment_patient_lookup_unavailable_end", "end");
if (!sourceDrivenTemplate) {
  requireNode("appointment_consent", "auth-consent");
  requireNode("appointment_consent_accept_record", "record");
  requireNode("appointment_consent_decline_record", "record");
  requireNode("appointment_consent_declined_message", "message");
  requireNode("appointment_consent_declined_end", "end");
}
requireNode("appointment_patient_flow_router", "switch");
requireNode("appointment_branch_input", "input");
requireNode("appointment_consultation_type_input", "input");
requireNode("appointment_doctors_fetch", "record");
requireNode("appointment_available_slots_list", "record");
requireNode("appointment_filter_available_slots", "script");
requireNode("appointment_slot_inventory_route", "switch");
if (sourceDrivenTemplate) requireNode("appointment_display_labels_set", "script");
if (sourceDrivenTemplate) requireNode("appointment_doctors_alternatives_fetch", "record");
if (sourceDrivenTemplate) requireNode("appointment_doctors_alternatives_prepare", "script");
if (sourceDrivenTemplate) requireNode("appointment_doctors_alternatives_route", "switch");
if (sourceDrivenTemplate) requireNode("appointment_doctor_alternative_input", "input");
if (sourceDrivenTemplate) requireNode("appointment_alternative_display_labels_set", "script");
requireNode("appointment_alternate_doctor_input", "input");
requireNode("appointment_alternate_available_slots_list", "record");
requireNode("appointment_filter_alternate_slots", "script");
requireNode("appointment_alternate_slot_inventory_route", "switch");
if (sourceDrivenTemplate) requireNode("appointment_alternate_display_labels_set", "script");
requireNode("appointment_alternate_slot_booking", "appointment");
requireNode("appointment_duplicate_check", "record");
requireNode("appointment_summary", "message");
requireNode("appointment_payment_choice_input", "input");
requireNode("appointment_slot_hold_update", "record");
requireNode("appointment_conflict_available_slots_list", "record");
requireNode("appointment_filter_conflict_slots", "script");
requireNode("appointment_conflict_slot_inventory_route", "switch");
requireNode("appointment_conflict_slot_booking", "appointment");
requireNode("appointment_conflict_slot_hold_update", "record");
requireNode("appointment_hold_expiry_scheduler", "scheduler");
requireNode("appointment_slot_booked_update", "record");
requireNode("appointment_slot_release_update", "record");
requireNode("appointment_confirm_record_update", "record");
requireNode("reschedule_mobile_form", "form");
requireNode("reschedule_future_appointments_list", "record");
requireNode("reschedule_filter_future_appointments", "script");
requireNode("reschedule_future_route", "switch");
requireNode("reschedule_select_appointment_form", "form");
requireNode("reschedule_select_appointment", "script");
requireNode("reschedule_confirm_decision", sourceDrivenTemplate ? "input" : "decision");
requireNode("reschedule_available_slots_list", "record");
requireNode("reschedule_filter_available_slots", "script");
requireNode("reschedule_slot_booking", "appointment");
requireNode("reschedule_set_new_slot_vars", "setVariable");
requireNode("reschedule_duplicate_check", "record");
requireNode("reschedule_new_slot_hold_update", "record");
requireNode("reschedule_new_slot_booked_update", "record");
requireNode("reschedule_new_appointment_record", "record");
requireNode("reschedule_old_cancel_update", "record");
requireNode("reschedule_old_slot_release_update", "record");
requireNode("reschedule_notify", "notification");
requireNode("reschedule_audit", "audit-log");
requireNode("cancel_mobile_form", "form");
requireNode("cancel_future_appointments_list", "record");
requireNode("cancel_filter_future_appointments", "script");
requireNode("cancel_future_route", "switch");
requireNode("cancel_select_appointment_form", "form");
requireNode("cancel_select_appointment", "script");
requireNode("cancel_confirm_decision", sourceDrivenTemplate ? "input" : "decision");
requireNode("cancel_record_update", "record");
requireNode("cancel_slot_release_update", "record");
requireNode("cancel_notify", "notification");
requireNode("cancel_audit", "audit-log");
if (sourceDrivenTemplate) requireNode("appointment_upcoming_route", "switch");
requireNode("online_patient_lookup_form", "form");
requireNode("online_patient_find", "record");
requireNode("online_existing_patient_set", "setVariable");
requireNode("online_new_patient_prepare", "setVariable");
requireNode("online_patient_not_found_message", "message");
requireNode("online_patient_lookup_unavailable_message", "message");
requireNode("online_patient_lookup_unavailable_end", "end");
requireNode("online_patient_flow_router", "switch");
requireNode("online_symptom_form", "form");
requireNode("online_patient_record", "record");
if (!sourceDrivenTemplate) {
  requireNode("online_consent_accept_record", "record");
  requireNode("report_consent_accept_record", "record");
  requireNode("insurance_document_consent_record", "record");
  requireNode("prescription_upload_consent_record", "record");
}
requireNode("online_paid_record_update", "record");
requireNode("package_paid_record_update", "record");
requireNode("lab_paid_record_update", "record");
requireNode("doctor_profile_input", "input");
requireNode("doctor_profile_carousel", sourceDrivenTemplate ? "message" : "carousel");
requireNode("department_choice_input", "input");
requireNode("followup_form", "form");
requireNode("followup_slot_booking", "appointment");
requireNode("insurance_record", "record");
requireNode("pharmacy_ticket_record", "record");
requireNode("locations_book_decision", "decision");
if (!sourceDrivenTemplate) {
  requireNode("vaccination_services_form", "form");
  requireNode("second_opinion_form", "form");
  requireNode("surgery_procedure_form", "form");
}
requireNode("discharge_support_form", "form");
requireNode("medical_records_form", "form");
if (!sourceDrivenTemplate) {
  requireNode("home_care_form", "form");
  requireNode("patient_transport_form", "form");
}
requireNode("blood_bank_form", "form");
requireNode("general_hospital_question_input", "input");

const entryButtons = nodes.get("main_request_input")?.data?.buttons ?? [];
if (!sourceDrivenTemplate && entryButtons.length > 0) fail("Main request input must remain free-text without entry buttons");

requireFormField("existing_patient_lookup_form", "patient_mobile");
requireFormField("existing_appointment_form", "patient_mobile");
forbidFormField("existing_appointment_form", "appointment_id");
forbidFormField("existing_appointment_form", "patient_name");
forbidFormField("existing_appointment_form", "patient_email");
forbidFormField("existing_appointment_form", "appointment_action");
requireFormField("reschedule_mobile_form", "patient_mobile");
requireFormField("reschedule_select_appointment_form", "reschedule_selected_appointment_id");
requireFormField("cancel_mobile_form", "patient_mobile");
requireFormField("cancel_select_appointment_form", "cancel_selected_appointment_id");
requireFormField("online_patient_lookup_form", "patient_mobile");
requireFormField("online_symptom_form", "symptom_summary");
forbidFormField("appointment_patient_form", "patient_mobile");
forbidFormField("appointment_patient_form", "preferred_language");
forbidFormField("online_form", "patient_mobile");
requireFormField("feedback_form", "satisfaction_rating");
requireFormField("package_form", "package_preferred_date");
requireFormField("lab_form", "lab_preferred_date");
requireMetadataValue("mobileOtpVerificationMode", "accept_any_6_digit_code");
requireOtpGate({
  prefix: "existing_patient_lookup",
  formId: "existing_patient_lookup_form",
  nextId: "existing_patient_find",
  otpVar: "existing_patient_lookup_otp"
});
requireOtpGate({
  prefix: "appointment_status_mobile",
  formId: "existing_appointment_form",
  nextId: "existing_appointment_find",
  otpVar: "appointment_status_otp"
});
requireOtpGate({
  prefix: "reschedule_mobile",
  formId: "reschedule_mobile_form",
  nextId: "reschedule_future_appointments_list",
  otpVar: "reschedule_mobile_otp"
});
requireOtpGate({
  prefix: "cancel_mobile",
  formId: "cancel_mobile_form",
  nextId: "cancel_future_appointments_list",
  otpVar: "cancel_mobile_otp"
});
requireOtpGate({
  prefix: "online_patient_lookup",
  formId: "online_patient_lookup_form",
  nextId: "online_patient_find",
  otpVar: "online_patient_lookup_otp"
});
requireOtpGate({
  prefix: "followup_lookup",
  formId: "followup_form",
  nextId: "followup_record_find",
  otpVar: "followup_lookup_otp"
});
requireNodeDataValue("appointment_slot_booking", "slotMode", "dynamic");
requireNodeDataValue("appointment_slot_booking", "dynamicSlotsVar", "appointment_future_slots");
requireNodeDataValue("appointment_slot_booking", "dynamicSlotsPath", "data");
requireNodeDataValue("appointment_slot_booking", "workingHoursStart", "00:00");
requireNodeDataValue("appointment_slot_booking", "workingHoursEnd", "00:00");
requireNodeDataValue("reschedule_slot_booking", "slotMode", "dynamic");
requireNodeDataValue("reschedule_slot_booking", "dynamicSlotsVar", "reschedule_open_slots_result");
requireNodeDataValue("reschedule_slot_booking", "dynamicSlotsPath", "data");
requireNodeDataValue("reschedule_slot_booking", "workingHoursStart", "00:00");
requireNodeDataValue("reschedule_slot_booking", "workingHoursEnd", "00:00");
requireNodeDataValue("appointment_alternate_slot_booking", "slotMode", "dynamic");
requireNodeDataValue("appointment_alternate_slot_booking", "dynamicSlotsVar", "alternate_appointment_future_slots");
requireNodeDataValue("appointment_alternate_slot_booking", "dynamicSlotsPath", "data");
requireNodeDataValue("appointment_alternate_slot_booking", "workingHoursStart", "00:00");
requireNodeDataValue("appointment_alternate_slot_booking", "workingHoursEnd", "00:00");
requireNodeDataValue("appointment_conflict_slot_booking", "slotMode", "dynamic");
requireNodeDataValue("appointment_conflict_slot_booking", "dynamicSlotsVar", "conflict_appointment_future_slots");
requireNodeDataValue("appointment_conflict_slot_booking", "dynamicSlotsPath", "data");
requireNodeDataValue("appointment_conflict_slot_booking", "workingHoursStart", "00:00");
requireNodeDataValue("appointment_conflict_slot_booking", "workingHoursEnd", "00:00");
requireNodeDataValue("appointment_available_slots_list", "action", "list");
requireNodeDataValue("appointment_available_slots_list", "collection", "doctor_availability_rules");
requireNodeDataValue("appointment_doctors_fetch", "action", "list");
requireNodeDataValue("appointment_doctors_fetch", "collection", "doctors");
if (sourceDrivenTemplate) requireNodeDataValue("appointment_doctors_alternatives_fetch", "action", "list");
if (sourceDrivenTemplate) requireNodeDataValue("appointment_doctors_alternatives_fetch", "collection", "doctors");
requireNodeDataValue("appointment_alternate_available_slots_list", "action", "list");
requireNodeDataValue("appointment_alternate_available_slots_list", "collection", "doctor_availability_rules");
requireNodeDataValue("appointment_duplicate_check", "action", "find");
requireNodeDataValue("appointment_duplicate_check", "collection", "appointments");
requireNodeDataValue("appointment_upcoming_find", "action", "list");
requireNodeDataValue("appointment_upcoming_find", "collection", "appointments");
requireNodeDataValue("existing_appointment_find", "action", "list");
requireNodeDataValue("existing_appointment_find", "collection", "appointments");
if (sourceDrivenTemplate) requireNodeDataValue("cancel_confirm_decision", "variable", "cancel_confirmed");
requireNodeDataValue("reschedule_future_appointments_list", "action", "list");
requireNodeDataValue("reschedule_future_appointments_list", "collection", "appointments");
if (sourceDrivenTemplate) {
  requireNodeDataValue("reschedule_confirm_decision", "variable", "reschedule_confirmed");
  requireNodeDataValue("reschedule_final_confirm_decision", "variable", "reschedule_final_confirmed");
}
requireNodeDataValue("reschedule_available_slots_list", "action", "list");
requireNodeDataValue("reschedule_available_slots_list", "collection", "doctor_availability_rules");
requireNodeDataValue("reschedule_duplicate_check", "action", "find");
requireNodeDataValue("reschedule_duplicate_check", "collection", "appointments");
requireNodeDataValue("reschedule_new_slot_hold_update", "action", "upsert");
requireNodeDataValue("reschedule_new_slot_booked_update", "action", "update");
requireNodeDataValue("reschedule_new_appointment_record", "action", "upsert");
requireNodeDataValue("reschedule_old_cancel_update", "action", "update");
requireNodeDataValue("reschedule_old_slot_release_update", "action", "update");
requireNodeDataValue("cancel_future_appointments_list", "action", "list");
requireNodeDataValue("cancel_future_appointments_list", "collection", "appointments");
requireNodeDataValue("cancel_record_update", "action", "update");
requireNodeDataValue("cancel_record_update", "collection", "appointments");
requireNodeDataValue("cancel_slot_release_update", "action", "update");
requireNodeDataValue("cancel_slot_release_update", "collection", "appointment_reservations");
requireNodeDataValue("online_patient_find", "action", "find");
requireNodeDataValue("online_patient_find", "collection", "patients");
requireNodeDataValue("appointment_slot_hold_update", "action", "upsert");
requireNodeDataValue("appointment_slot_booked_update", "action", "update");
requireNodeDataValue("appointment_payment", "provider", "razorpay");
requireNodeDataValue("appointment_payment", "autoVerify", true);
forbidNodeMessageIncludes("appointment_slot_conflict_message", "just taken");
requireSetVariableValue("appointment_set_pay_at_hospital", "payment_status", "pay_at_hospital");
requireSetVariableValue("appointment_set_pay_at_hospital", "payment_id", "PAY-HOSPITAL-{{system.sessionId}}");
requireSetVariableValue("appointment_existing_patient_set", "appointment_patient_flow_type", "existing");
requireSetVariableValue("appointment_existing_patient_set", "patient_name", "{{existing_patient_result.data.name}}");
requireSetVariableValue("appointment_existing_patient_set", "patient_email", "{{existing_patient_result.data.email}}");
requireSetVariableValue("appointment_new_patient_prepare", "appointment_patient_flow_type", "new");
requireSetVariableValue("online_existing_patient_set", "online_patient_flow_type", "existing");
requireSetVariableValue("online_existing_patient_set", "patient_name", "{{online_patient_result.data.name}}");
requireSetVariableValue("online_existing_patient_set", "patient_email", "{{online_patient_result.data.email}}");
requireSetVariableValue("online_new_patient_prepare", "online_patient_flow_type", "new");
requireNode("appointment_resolve_selected_slot", "script");
requireScriptIncludes("appointment_resolve_selected_slot", "typeof booking === \"string\" ? booking : \"\"");
requireScriptIncludes("appointment_resolve_selected_slot", "vars.appointment_selected_slot = resolved;");
requireSetVariableValue("appointment_set_ids", "appointment_date", "{{appointment_selected_slot.date}}");
requireSetVariableValue("appointment_set_ids", "appointment_slot_id", "{{appointment_selected_slot.slot_id}}");
requireSetVariableValue("appointment_set_ids", "appointment_slot_label", "{{appointment_selected_slot.label}}");
requireSetVariableValue("appointment_set_ids", "appointment_time", "{{appointment_selected_slot.start}}");
requireSetVariableValue("appointment_set_ids", "appointment_end_time", "{{appointment_selected_slot.end}}");
requireNode("appointment_conflict_resolve_selected_slot", "script");
requireScriptIncludes("appointment_conflict_resolve_selected_slot", "vars.appointment_conflict_selected_slot = resolved;");
requireSetVariableValue("reschedule_set_new_slot_vars", "reschedule_new_appointment_id", "APT-RESCH-{{system.sessionId}}");
requireSetVariableValue("reschedule_set_new_slot_vars", "reschedule_new_slot_hold_id", "HOLD-RESCH-{{system.sessionId}}");
requireNode("reschedule_resolve_selected_slot", "script");
requireScriptIncludes("reschedule_resolve_selected_slot", "vars.reschedule_selected_slot = resolved;");
requireSetVariableValue("reschedule_set_new_slot_vars", "reschedule_new_slot_id", "{{reschedule_selected_slot.slot_id}}");
requireSetVariableValue("reschedule_set_new_slot_vars", "reschedule_new_slot_label", "{{reschedule_selected_slot.label}}");
requireRecordValue("appointment_confirm_record_update", "status", "confirmed");
requireRecordWhereValue("appointment_alternate_available_slots_list", "branch_id", "{{doctor_scope_branch_id}}");
requireRecordWhereValue("appointment_alternate_available_slots_list", "consultation_mode", "{{consultation_type}}");
if (sourceDrivenTemplate) requireRecordWhereValue("appointment_doctors_alternatives_fetch", "department", "{{department}}");
if (sourceDrivenTemplate) requireRecordWhereValue("appointment_doctors_alternatives_fetch", "consultation_mode", "{{consultation_type}}");
requireRecordWhereValue("appointment_upcoming_find", "patient_mobile", "{{patient_mobile}}");
requireRecordWhereValue("appointment_upcoming_find", "status", "confirmed");
requireRecordWhereValue("existing_appointment_find", "patient_mobile", "{{patient_mobile}}");
requireRecordWhereValue("reschedule_future_appointments_list", "patient_mobile", "{{patient_mobile}}");
requireRecordWhereValue("reschedule_future_appointments_list", "status", "confirmed");
requireRecordWhereValue("reschedule_available_slots_list", "doctor_id", "{{reschedule_original_doctor_id}}");
requireRecordWhereValue("reschedule_available_slots_list", "branch_id", "{{reschedule_original_branch_id}}");
requireRecordWhereValue("reschedule_available_slots_list", "consultation_mode", "{{reschedule_original_consultation_type}}");
requireRecordWhereValue("reschedule_duplicate_check", "status", "confirmed");
requireRecordWhereValue("cancel_future_appointments_list", "patient_mobile", "{{patient_mobile}}");
requireRecordWhereValue("cancel_future_appointments_list", "status", "confirmed");
requireRecordWhereValue("cancel_record_update", "appointment_id", "{{cancel_original_appointment_id}}");
requireRecordWhereValue("cancel_record_update", "patient_mobile", "{{patient_mobile}}");
requireRecordWhereValue("cancel_record_update", "status", "confirmed");
requireRecordWhereValue("cancel_slot_release_update", "reservation_key", "{{cancel_original_reservation_key}}");
requireRecordWhereValue("cancel_slot_release_update", "status", "confirmed");
requireRecordWhereValue("online_patient_find", "mobile", "{{patient_mobile}}");
requireRecordValue("appointment_slot_hold_update", "status", "held");
requireRecordValue("appointment_slot_hold_update", "slot_id", "{{appointment_slot_id}}");
requireRecordValue("appointment_slot_hold_update", "appointment_date", "{{appointment_date}}");
requireRecordValue("appointment_slot_hold_update", "start_time", "{{appointment_time}}");
requireNodeDataValue("appointment_slot_hold_update", "encryptPii", false);
requireRecordValue("appointment_slot_hold_update", "patient_mobile", "{{patient_mobile}}");
requireRecordValue("appointment_conflict_slot_hold_update", "status", "held");
requireRecordValue("appointment_conflict_slot_hold_update", "slot_id", "{{appointment_slot_id}}");
requireNodeDataValue("appointment_conflict_slot_hold_update", "encryptPii", false);
requireRecordValue("appointment_conflict_slot_hold_update", "patient_mobile", "{{patient_mobile}}");
requireRecordValue("appointment_slot_booked_update", "status", "confirmed");
requireRecordValue("appointment_slot_booked_update", "appointment_id", "{{appointment_id}}");
requireNodeDataValue("appointment_slot_booked_update", "encryptPii", false);
requireRecordValue("appointment_slot_booked_update", "payment_status", "{{payment_status}}");
requireRecordValue("appointment_slot_release_update", "status", "cancelled");
requireNodeDataValue("appointment_slot_release_update", "encryptPii", false);
requireRecordValue("appointment_slot_release_update", "payment_status", "{{payment_status}}");
requireRecordValue("appointment_confirm_record_update", "slot_id", "{{appointment_slot_id}}");
requireRecordValue("appointment_confirm_record_update", "slot_label", "{{appointment_slot_label}}");
requireRecordValue("appointment_confirm_record_update", "appointment_date", "{{appointment_date}}");
requireRecordValue("reschedule_new_slot_hold_update", "status", "held");
requireRecordValue("reschedule_new_slot_hold_update", "slot_id", "{{reschedule_new_slot_id}}");
requireRecordValue("reschedule_new_slot_booked_update", "status", "confirmed");
requireRecordValue("reschedule_new_slot_booked_update", "appointment_id", "{{reschedule_new_appointment_id}}");
requireRecordValue("reschedule_new_appointment_record", "status", "confirmed");
requireRecordValue("reschedule_new_appointment_record", "slot_id", "{{reschedule_new_slot_id}}");
requireRecordValue("reschedule_old_cancel_update", "status", "cancelled");
requireRecordValue("reschedule_old_slot_release_update", "status", "cancelled");
requireRecordValue("cancel_record_update", "status", "cancelled");
requireRecordValue("cancel_slot_release_update", "status", "cancelled");
requireNodeDataValue("reschedule_new_slot_hold_update", "encryptPii", false);
requireNodeDataValue("reschedule_new_slot_booked_update", "encryptPii", false);
requireNodeDataValue("reschedule_old_slot_release_update", "encryptPii", false);
requireNodeDataValue("cancel_slot_release_update", "encryptPii", false);
if (!sourceDrivenTemplate) {
  requireRecordValue("appointment_consent_accept_record", "consent_status", "accepted");
  requireRecordValue("appointment_consent_decline_record", "consent_status", "declined");
  requireRecordValue("online_consent_accept_record", "consent_status", "accepted");
  requireRecordValue("report_consent_accept_record", "consent_status", "accepted");
  requireRecordValue("insurance_document_consent_record", "consent_status", "accepted");
  requireRecordValue("prescription_upload_consent_record", "consent_status", "accepted");
}
requireRecordValue("online_paid_record_update", "status", "paid_pending_callback");
requireRecordValue("package_paid_record_update", "status", "paid_pending_confirmation");
requireRecordValue("lab_paid_record_update", "status", "paid_pending_confirmation");
requireSchemaField("availability_doctor_list", "qualification");
requireSchemaField("availability_doctor_list", "consultation_fee");
requireSchemaField("availability_doctor_list", "doctor_scope_key");
requireSchemaField("appointment_available_slots_list", "rule_id");
requireSchemaField("appointment_available_slots_list", "start_time");
requireNodeMessageIncludes("appointment_confirmation", "Appointment ID: {{appointment_id}}");
requireNodeMessageIncludes(
  "appointment_confirmation",
  sourceDrivenTemplate ? "Your appointment booking is successful." : "Date and time: {{appointment_date}} at {{appointment_slot_label}}"
);
if (sourceDrivenTemplate) {
  requireNodeMessageIncludes("appointment_confirmation", "Doctor / care team: {{appointment_doctor_name}}");
  requireNodeMessageIncludes("appointment_status_message", "{{appointment_status_response_text}}");
}
requireNodeMessageIncludes("reschedule_end_message", "Old appointment cancelled: {{reschedule_original_appointment_id}}");
requireNodeMessageIncludes("reschedule_end_message", "The previous slot has been released for other patients.");
requireNodeMessageIncludes("cancel_end_message", "Your appointment has been cancelled.");
requireNodeMessageIncludes("cancel_end_message", "finance team will contact you");

forbidNode("reschedule_record_update");
if (sourceDrivenTemplate) forbidNode("existing_appointment_router");

for (const forbiddenQueue of [
  "appointment_payment_manual_queue",
  "appointment_booking_manual_queue",
  "appointment_management_queue",
  "online_queue",
  "package_manual_queue",
  "lab_queue",
  "report_lab_queue",
  "billing_queue",
  "insurance_queue",
  "admission_queue",
  "pharmacy_queue",
  "followup_frontdesk_queue",
  "feedback_queue",
  "complaint_queue",
  "unknown_queue"
]) {
  if (nodes.has(forbiddenQueue)) fail(`Routine queue ${forbiddenQueue} must not be present`);
}

if (!sourceDrivenTemplate) {
  requireEdge("welcome_message", "language_detection");
  requireEdge("language_detection", "main_request_input", "detected");
  requireEdge("language_detection", "language_selection_input", "low_confidence");
  requireEdge("language_detection", "default_language_message", "unsupported");
  requireEdge("language_selection_input", "main_request_input");
  requireEdge("default_language_message", "main_request_input");
}
requireEdge("main_request_input", "main_intent_router");
requireEdge("main_intent_router", "appointment_intro", "book_appointment");
requireEdge("main_intent_router", "existing_patient_lookup_form", "existing_patient_booking");
requireEdge("main_intent_router", "existing_appointment_form", "appointment_status");
requireEdge("main_intent_router", "reschedule_mobile_form", "reschedule_appointment");
requireEdge("main_intent_router", "cancel_mobile_form", "cancel_appointment");
requireEdge("main_intent_router", "availability_intro", "doctor_availability");
requireEdge("main_intent_router", "doctor_profile_input", "doctor_profile");
requireEdge("main_intent_router", "department_reason_input", "department_help");
requireEdge("main_intent_router", "online_patient_lookup_form", "online_consultation");
requireEdge("main_intent_router", "followup_form", "follow_up");
if (!sourceDrivenTemplate) requireEdge("main_intent_router", "second_opinion_intro", "second_opinion");
requireEdge("main_intent_router", "packages_carousel", "health_packages");
if (!sourceDrivenTemplate) requireEdge("main_intent_router", "vaccination_services_intro", "vaccination_services");
requireEdge("main_intent_router", "lab_form", "lab_tests");
requireEdge("main_intent_router", "report_form", "report_status");
requireEdge("main_intent_router", "billing_form", "billing_support");
requireEdge("main_intent_router", "insurance_form", "insurance_help");
requireEdge("main_intent_router", "admission_form", "admission_enquiry");
if (!sourceDrivenTemplate) requireEdge("main_intent_router", "surgery_procedure_intro", "surgery_procedure_help");
requireEdge("main_intent_router", "discharge_support_form", "discharge_support");
requireEdge("main_intent_router", "pharmacy_form", "pharmacy_help");
requireEdge("main_intent_router", "medical_records_form", "medical_records");
if (!sourceDrivenTemplate) {
  requireEdge("main_intent_router", "home_care_form", "home_care_services");
  requireEdge("main_intent_router", "patient_transport_form", "patient_transport");
}
requireEdge("main_intent_router", "blood_bank_form", "blood_bank_help");
requireEdge("main_intent_router", "locations_carousel", "hospital_locations");
requireEdge("main_intent_router", "general_hospital_question_input", "general_hospital_question");
requireEdge("main_intent_router", "feedback_form", "feedback_complaint");
requireEdge("main_intent_router", "emergency_safety_message", "emergency_help");
requireEdge("main_intent_router", "ambulance_safety_message", "ambulance_request");
requireEdge("main_intent_router", "locations_carousel", "emergency_contact");
requireEdge("main_intent_router", "talk_form", "talk_to_hospital");
requireEdge("main_intent_router", "unknown_faq");
requireEdge("appointment_intro", "existing_patient_lookup_form");
if (!sourceDrivenTemplate) {
  requireEdge("appointment_consent", "appointment_consent_accept_record", "accepted");
  requireEdge("appointment_consent", "appointment_consent_decline_record");
  requireEdge("appointment_consent_accept_record", "appointment_patient_flow_router");
}
requireEdge("appointment_patient_flow_router", "appointment_branch_input", "existing");
requireEdge("appointment_patient_flow_router", "appointment_patient_form");
if (!sourceDrivenTemplate) {
  requireEdge("appointment_consent_decline_record", "appointment_consent_declined_message");
  requireEdge("appointment_consent_declined_message", "appointment_consent_declined_end");
}
if (!sourceDrivenTemplate) {
  requireEdge("vaccination_services_intro", "vaccination_services_form");
  requireEdge("vaccination_services_form", "vaccination_services_record");
  requireEdge("vaccination_services_record", "vaccination_services_confirmation");
  requireEdge("vaccination_services_confirmation", "vaccination_services_end");
  requireEdge("second_opinion_intro", "second_opinion_form");
  requireEdge("second_opinion_form", "second_opinion_record");
  requireEdge("second_opinion_record", "second_opinion_confirmation");
  requireEdge("second_opinion_confirmation", "second_opinion_end");
  requireEdge("surgery_procedure_intro", "surgery_procedure_form");
  requireEdge("surgery_procedure_form", "surgery_procedure_record");
  requireEdge("surgery_procedure_record", "surgery_procedure_confirmation");
  requireEdge("surgery_procedure_confirmation", "surgery_procedure_end");
}
requireEdge("discharge_support_form", "discharge_support_record");
requireEdge("discharge_support_record", "discharge_support_confirmation");
requireEdge("discharge_support_confirmation", "discharge_support_end");
if (sourceDrivenTemplate) {
  requireEdge("medical_records_form", "medical_records_record");
} else {
  requireEdge("medical_records_form", "medical_records_consent");
  requireEdge("medical_records_consent", "medical_records_record", "accepted");
}
requireEdge("medical_records_record", "medical_records_confirmation");
requireEdge("medical_records_confirmation", "medical_records_end");
if (!sourceDrivenTemplate) {
  requireEdge("home_care_form", "home_care_record");
  requireEdge("home_care_record", "home_care_confirmation");
  requireEdge("home_care_confirmation", "home_care_end");
  requireEdge("patient_transport_form", "patient_transport_record");
  requireEdge("patient_transport_record", "patient_transport_confirmation");
  requireEdge("patient_transport_confirmation", "patient_transport_end");
}
requireEdge("blood_bank_form", "blood_bank_record");
requireEdge("blood_bank_record", "blood_bank_confirmation");
requireEdge("blood_bank_confirmation", "blood_bank_end");
requireEdge("general_hospital_question_input", "general_hospital_question_answer");
requireEdge("general_hospital_question_answer", "general_hospital_question_message", "grounded");
requireEdge("general_hospital_question_message", "general_hospital_question_end");
requireEdge("unknown_faq", "unknown_ai_grounded", "not_found");
requireEdge("emergency_safety_message", "emergency_form");
requireEdge("emergency_form", "emergency_ticket_record");
requireEdge("emergency_ticket_record", "emergency_audit");
requireEdge("existing_patient_find", "appointment_existing_patient_set", "success");
requireEdge("existing_patient_find", "appointment_new_patient_prepare", "not_found");
requireEdge("existing_patient_find", "appointment_patient_lookup_unavailable_message");
requireEdge("appointment_patient_lookup_unavailable_message", "appointment_patient_lookup_unavailable_end");
requireEdge("appointment_existing_patient_set", "appointment_upcoming_find");
if (sourceDrivenTemplate) {
  requireEdge("appointment_upcoming_find", "appointment_upcoming_format", "success");
  requireEdge("appointment_upcoming_format", "appointment_upcoming_route", "success");
  requireEdge("appointment_upcoming_route", "appointment_upcoming_message", "future");
  requireEdge("appointment_upcoming_route", "appointment_patient_flow_router");
} else {
  requireEdge("appointment_upcoming_find", "appointment_upcoming_message", "success");
}
requireEdge("appointment_upcoming_find", sourceDrivenTemplate ? "appointment_patient_flow_router" : "appointment_consent", "not_found");
requireEdge("appointment_upcoming_find", "appointment_upcoming_check_unavailable_message");
requireEdge("appointment_upcoming_check_unavailable_message", "appointment_upcoming_check_unavailable_end");
requireEdge("appointment_upcoming_message", "appointment_upcoming_proceed_decision");
requireEdge("appointment_upcoming_proceed_decision", sourceDrivenTemplate ? "appointment_patient_flow_router" : "appointment_consent", "yes");
requireEdge("appointment_new_patient_prepare", "existing_patient_not_found_message");
requireEdge("existing_patient_not_found_message", sourceDrivenTemplate ? "appointment_patient_flow_router" : "appointment_consent");
requireEdge("appointment_patient_record", "appointment_branch_input");
forbidEdge("appointment_patient_record", "appointment_booking_manual_queue");
requireEdge("appointment_branch_input", "appointment_consultation_type_input");
requireEdge("appointment_consultation_type_input", "appointment_department_input");
if (sourceDrivenTemplate) {
  requireEdge("appointment_department_input", "appointment_prepare_scope");
  requireEdge("appointment_prepare_scope", "appointment_doctors_fetch");
  requireEdge("appointment_doctors_fetch", "appointment_doctor_selection_prepare");
  requireEdge("appointment_doctor_selection_prepare", "appointment_doctor_route");
  requireEdge("appointment_doctor_route", "appointment_doctors_alternatives_fetch", "none");
  requireEdge("appointment_doctors_alternatives_fetch", "appointment_doctors_alternatives_prepare");
  requireEdge("appointment_doctors_alternatives_prepare", "appointment_doctors_alternatives_route");
  requireEdge("appointment_doctors_alternatives_route", "appointment_doctor_alternative_input", "available");
  requireEdge("appointment_doctors_alternatives_route", "appointment_no_doctors_message");
  requireEdge("appointment_doctor_alternative_input", "appointment_alternative_display_labels_set");
  requireEdge("appointment_alternative_display_labels_set", "appointment_booking_policy_list");
  requireEdge("appointment_doctor_route", "appointment_display_labels_set", "single");
  requireEdge("appointment_doctor_route", "appointment_doctor_input");
  requireEdge("appointment_doctor_input", "appointment_display_labels_set");
  requireEdge("appointment_display_labels_set", "appointment_booking_policy_list");
  requireEdge("appointment_booking_policy_list", "appointment_available_slots_list");
  requireEdge("appointment_available_slots_list", "appointment_schedule_exceptions_list");
  requireEdge("appointment_schedule_exceptions_list", "appointment_active_reservations_list");
  requireEdge("appointment_active_reservations_list", "appointment_filter_available_slots");
  requireEdge("appointment_filter_available_slots", "appointment_slot_inventory_route", "success");
  requireEdge("appointment_slot_inventory_route", "appointment_slot_booking", "available");
  requireEdge("appointment_slot_inventory_route", "appointment_no_slots_message");
} else {
  requireEdge("appointment_department_input", "appointment_doctors_fetch");
  requireEdge("appointment_doctors_fetch", "appointment_doctor_carousel", "success");
  requireEdge("appointment_doctor_carousel", "appointment_doctor_input");
  requireEdge("appointment_doctor_input", "appointment_available_slots_list");
  requireEdge("appointment_available_slots_list", "appointment_slot_booking", "success");
}
requireEdge("appointment_slot_booking", "appointment_resolve_selected_slot");
requireEdge("appointment_resolve_selected_slot", "appointment_set_ids");
requireEdge("appointment_no_slots_message", "appointment_alternate_doctor_input");
forbidEdge("appointment_no_slots_message", "appointment_booking_manual_queue");
if (sourceDrivenTemplate) {
  requireEdge("appointment_alternate_doctor_input", "appointment_alternate_display_labels_set");
  requireEdge("appointment_alternate_display_labels_set", "appointment_alternate_booking_policy_list");
  requireEdge("appointment_alternate_booking_policy_list", "appointment_alternate_available_slots_list");
  requireEdge("appointment_alternate_available_slots_list", "appointment_alternate_schedule_exceptions_list");
  requireEdge("appointment_alternate_schedule_exceptions_list", "appointment_alternate_active_reservations_list");
  requireEdge("appointment_alternate_active_reservations_list", "appointment_filter_alternate_slots");
  requireEdge("appointment_filter_alternate_slots", "appointment_alternate_slot_inventory_route", "success");
  requireEdge("appointment_alternate_slot_inventory_route", "appointment_alternate_slot_booking", "available");
  requireEdge("appointment_alternate_slot_inventory_route", "appointment_no_slots_end_message");
} else {
  requireEdge("appointment_alternate_doctor_input", "appointment_alternate_available_slots_list");
  requireEdge("appointment_alternate_available_slots_list", "appointment_alternate_slot_booking", "success");
}
requireEdge("appointment_alternate_slot_booking", "appointment_resolve_selected_slot");
requireEdge("appointment_no_slots_end_message", "appointment_no_slots_end");
if (sourceDrivenTemplate) {
  requireEdge("appointment_set_ids", "appointment_prepare_reservation_hold");
  requireEdge("appointment_prepare_reservation_hold", "appointment_duplicate_check");
} else {
  requireEdge("appointment_set_ids", "appointment_duplicate_check");
}
requireEdge("appointment_duplicate_check", "appointment_duplicate_message", "success");
requireEdge("appointment_duplicate_check", "appointment_slot_hold_update", "not_found");
requireEdge("appointment_duplicate_message", "appointment_duplicate_end");
requireEdge("appointment_duplicate_check_unavailable_message", "appointment_duplicate_check_unavailable_end");
requireEdge("appointment_slot_hold_update", "appointment_hold_expiry_scheduler", "success");
requireEdge("appointment_hold_expiry_scheduler", "appointment_summary");
requireEdge("appointment_summary", "appointment_payment_choice_input");
requireEdge("appointment_payment_choice_input", "appointment_payment", "pay_now");
requireEdge("appointment_payment_choice_input", "appointment_set_pay_at_hospital", "pay_at_hospital");
requireEdge("appointment_payment_choice_input", "appointment_payment_cancel_message");
requireEdge("appointment_payment_cancel_message", "appointment_slot_release_update");
if (sourceDrivenTemplate) {
  requireEdge("appointment_slot_conflict_message", "appointment_conflict_booking_policy_list");
  requireEdge("appointment_conflict_booking_policy_list", "appointment_conflict_available_slots_list");
  requireEdge("appointment_conflict_available_slots_list", "appointment_conflict_schedule_exceptions_list");
  requireEdge("appointment_conflict_schedule_exceptions_list", "appointment_conflict_active_reservations_list");
  requireEdge("appointment_conflict_active_reservations_list", "appointment_filter_conflict_slots");
  requireEdge("appointment_filter_conflict_slots", "appointment_conflict_slot_inventory_route", "success");
  requireEdge("appointment_conflict_slot_inventory_route", "appointment_conflict_slot_booking", "available");
  requireEdge("appointment_conflict_slot_inventory_route", "appointment_conflict_no_slots_message");
} else {
  requireEdge("appointment_slot_conflict_message", "appointment_conflict_available_slots_list");
  requireEdge("appointment_conflict_available_slots_list", "appointment_conflict_slot_booking", "success");
}
requireEdge("appointment_conflict_slot_booking", "appointment_conflict_resolve_selected_slot");
requireEdge("appointment_conflict_resolve_selected_slot", "appointment_conflict_set_ids");
if (sourceDrivenTemplate) {
  requireEdge("appointment_conflict_set_ids", "appointment_conflict_prepare_reservation_hold");
  requireEdge("appointment_conflict_prepare_reservation_hold", "appointment_conflict_duplicate_check");
} else {
  requireEdge("appointment_conflict_set_ids", "appointment_conflict_duplicate_check");
}
requireEdge("appointment_conflict_duplicate_check", "appointment_conflict_slot_hold_update", "not_found");
requireEdge("appointment_conflict_slot_hold_update", "appointment_hold_expiry_scheduler", "success");
forbidEdge("appointment_slot_conflict_message", "appointment_booking_manual_queue");
requireEdge("appointment_slot_release_update", "appointment_payment_failed_message", "success");
forbidEdge("appointment_slot_release_update", "appointment_payment_manual_queue");
requireEdge("appointment_payment_failed_message", "appointment_payment_failed_end");
requireEdge("appointment_set_paid", "appointment_payment_record");
requireEdge("appointment_set_pay_at_hospital", "appointment_payment_record");
requireEdge("appointment_payment_record", "appointment_slot_booked_update");
forbidEdge("existing_appointment_router", "cancel_confirm_decision");
if (sourceDrivenTemplate) {
  requireEdge("existing_appointment_find", "appointment_status_format", "success");
  requireEdge("appointment_status_format", "appointment_status_message");
} else {
  requireEdge("existing_appointment_find", "appointment_status_message", "success");
}
requireEdge("appointment_slot_booked_update", "appointment_confirm_record_update", "success");
requireEdge("appointment_confirm_record_update", "appointment_notify");
requireEdge("reschedule_future_appointments_list", "reschedule_filter_future_appointments");
requireEdge("reschedule_filter_future_appointments", "reschedule_future_route", "success");
requireEdge("reschedule_future_route", "reschedule_no_future_message", "none");
requireEdge("reschedule_future_route", "reschedule_single_details_message", "single");
requireEdge("reschedule_future_route", "reschedule_multiple_details_message", "multiple");
requireEdge("reschedule_single_details_message", "reschedule_confirm_decision");
requireEdge("reschedule_multiple_details_message", "reschedule_select_appointment_form");
requireEdge("reschedule_select_appointment_form", "reschedule_select_appointment");
requireEdge("reschedule_select_appointment", "reschedule_selection_route", "success");
requireEdge("reschedule_selection_route", "reschedule_selected_details_message", "found");
requireEdge("reschedule_selected_details_message", "reschedule_confirm_decision");
if (sourceDrivenTemplate) {
  requireEdge("reschedule_confirm_decision", "reschedule_booking_policy_list", "yes");
  requireEdge("reschedule_booking_policy_list", "reschedule_available_slots_list");
  requireEdge("reschedule_available_slots_list", "reschedule_schedule_exceptions_list");
  requireEdge("reschedule_schedule_exceptions_list", "reschedule_active_reservations_list");
  requireEdge("reschedule_active_reservations_list", "reschedule_filter_available_slots");
} else {
  requireEdge("reschedule_confirm_decision", "reschedule_available_slots_list", "yes");
  requireEdge("reschedule_available_slots_list", "reschedule_filter_available_slots");
}
requireEdge("reschedule_filter_available_slots", "reschedule_slot_route", "success");
requireEdge("reschedule_slot_route", "reschedule_slot_booking", "available");
requireEdge("reschedule_slot_booking", "reschedule_resolve_selected_slot");
requireEdge("reschedule_resolve_selected_slot", "reschedule_set_new_slot_vars");
if (sourceDrivenTemplate) {
  requireEdge("reschedule_set_new_slot_vars", "reschedule_prepare_reservation_hold");
  requireEdge("reschedule_prepare_reservation_hold", "reschedule_duplicate_check");
} else {
  requireEdge("reschedule_set_new_slot_vars", "reschedule_duplicate_check");
}
requireEdge("reschedule_duplicate_check", "reschedule_new_slot_hold_update", "not_found");
requireEdge("reschedule_new_slot_hold_update", "reschedule_summary", "success");
requireEdge("reschedule_summary", "reschedule_final_confirm_decision");
requireEdge("reschedule_final_confirm_decision", "reschedule_new_slot_booked_update", "yes");
requireEdge("reschedule_final_confirm_decision", "reschedule_new_slot_release_update");
requireEdge("reschedule_new_slot_booked_update", "reschedule_new_appointment_record", "success");
requireEdge("reschedule_new_appointment_record", "reschedule_old_cancel_update", "success");
requireEdge("reschedule_old_cancel_update", "reschedule_old_slot_release_update", "success");
requireEdge("reschedule_old_slot_release_update", "reschedule_notify", "success");
requireEdge("reschedule_notify", "reschedule_audit");
requireEdge("reschedule_audit", "reschedule_end_message");
requireEdge("cancel_future_appointments_list", "cancel_filter_future_appointments");
requireEdge("cancel_filter_future_appointments", "cancel_future_route", "success");
requireEdge("cancel_future_route", "cancel_no_future_message", "none");
requireEdge("cancel_future_route", "cancel_single_details_message", "single");
requireEdge("cancel_future_route", "cancel_multiple_details_message", "multiple");
requireEdge("cancel_single_details_message", "cancel_confirm_decision");
requireEdge("cancel_multiple_details_message", "cancel_select_appointment_form");
requireEdge("cancel_select_appointment_form", "cancel_select_appointment");
requireEdge("cancel_select_appointment", "cancel_selection_route", "success");
requireEdge("cancel_selection_route", "cancel_selected_details_message", "found");
requireEdge("cancel_selected_details_message", "cancel_confirm_decision");
requireEdge("cancel_confirm_decision", "cancel_record_update", "yes");
requireEdge("cancel_confirm_decision", "cancel_abort_message");
requireEdge("cancel_record_update", "cancel_slot_release_update", "success");
requireEdge("cancel_slot_release_update", "cancel_notify", "success");
requireEdge("cancel_notify", "cancel_audit");
requireEdge("cancel_audit", "cancel_end_message");
requireEdge("online_patient_find", "online_existing_patient_set", "success");
requireEdge("online_patient_find", "online_new_patient_prepare", "not_found");
requireEdge("online_patient_find", "online_patient_lookup_unavailable_message");
requireEdge("online_patient_lookup_unavailable_message", "online_patient_lookup_unavailable_end");
requireEdge("online_existing_patient_set", sourceDrivenTemplate ? "online_patient_flow_router" : "online_consent");
requireEdge("online_new_patient_prepare", "online_patient_not_found_message");
requireEdge("online_patient_not_found_message", sourceDrivenTemplate ? "online_patient_flow_router" : "online_consent");
if (!sourceDrivenTemplate) {
  requireEdge("online_consent", "online_consent_accept_record", "accepted");
  requireEdge("online_consent_accept_record", "online_patient_flow_router");
}
requireEdge("online_patient_flow_router", "online_symptom_form", "existing");
requireEdge("online_patient_flow_router", "online_form");
requireEdge("online_symptom_form", "online_record");
requireEdge("online_form", "online_patient_record");
requireEdge("online_patient_record", "online_record");
if (sourceDrivenTemplate) {
  requireEdge("report_form", "report_record_find");
} else {
  requireEdge("report_consent", "report_consent_accept_record", "accepted");
  requireEdge("report_consent_accept_record", "report_record_find");
}
requireEdge("online_payment", "online_paid_record_update", "paid");
requireEdge("online_paid_record_update", "online_notify");
requireEdge("package_payment", "package_paid_record_update", "paid");
requireEdge("package_paid_record_update", "package_notify");
requireEdge("lab_payment", "lab_paid_record_update", "paid");
requireEdge("lab_paid_record_update", "lab_notify");
requireEdge("department_reason_input", "department_choice_input");
requireEdge("department_choice_input", "emergency_safety_message", "emergency_symptom");
requireEdge("department_safe_message", "existing_patient_lookup_form");
requireEdge("availability_book_decision", "availability_set_department", "yes");
requireEdge("availability_set_department", "existing_patient_lookup_form");
requireEdge("doctor_profile_input", "doctor_profile_lookup");
if (sourceDrivenTemplate) {
  requireEdge("doctor_profile_lookup", "doctor_profile_format_results");
  requireEdge("doctor_profile_format_results", "doctor_profile_carousel");
} else {
  requireEdge("doctor_profile_lookup", "doctor_profile_carousel", "success");
}
requireEdge("doctor_profile_book_decision", "doctor_profile_department_input", "yes");
requireEdge("doctor_profile_department_input", "existing_patient_lookup_form");
requireEdge("followup_record_find", "followup_slot_booking", "success");
requireEdge("followup_record_find", "followup_not_found_message");
requireEdge("followup_slot_booking", "followup_create");
requireEdge("followup_create", "followup_scheduler");
requireEdge("insurance_form", "insurance_record");
if (sourceDrivenTemplate) {
  requireEdge("insurance_record", "insurance_document_intake");
} else {
  requireEdge("insurance_record", "insurance_document_consent");
  requireEdge("insurance_document_consent", "insurance_document_consent_record", "accepted");
  requireEdge("insurance_document_consent_record", "insurance_document_intake");
}
requireEdge("insurance_file_processor", "insurance_approval", "success");
requireEdge("insurance_approval", "insurance_notify", "approved");
requireEdge("pharmacy_form", "pharmacy_ticket_record");
requireEdge("pharmacy_ticket_record", "pharmacy_router");
requireEdge("pharmacy_router", sourceDrivenTemplate ? "prescription_document_intake" : "prescription_upload_consent", "prescription_upload");
requireEdge("pharmacy_router", "pharmacy_notify", "medicine_enquiry");
if (!sourceDrivenTemplate) {
  requireEdge("prescription_upload_consent", "prescription_upload_consent_record", "accepted");
  requireEdge("prescription_upload_consent_record", "prescription_document_intake");
}
requireEdge("prescription_file_processor", "pharmacy_notify", "success");
requireEdge("locations_carousel", "locations_book_decision");
requireEdge("locations_book_decision", "existing_patient_lookup_form", "yes");

for (const node of flowExport.flow.nodes) {
  if (node.type !== "record") continue;
  if (node.data?.encryptPii === true) {
    fail(`Record node ${node.id} must not depend on flow-level PII encryption`);
  }
}

const intentRouters = flowExport.flow.nodes.filter((node) => node.type === "intent-router");
if (intentRouters.length !== 1 || intentRouters[0]?.id !== "main_intent_router") {
  fail(`Expected exactly one intent-router node named main_intent_router; got ${intentRouters.map((node) => node.id).join(", ") || "none"}`);
}

if (sourceDrivenTemplate) {
  for (const node of flowExport.flow.nodes) {
    if (node.type === "auth-consent") fail(`Visible consent node ${node.id} must not be present in the demo source flow`);
  }
  forbidNode("appointment_doctor_carousel");

  requireButtonValues("appointment_branch_input", ["jubilee_hills_branch", "miyapur_branch", "kukatpally_branch", "madeenaguda_branch"]);
  forbidButtonValues("appointment_branch_input", ["main_branch", "north_branch", "south_branch"]);
  requireButtonValues("appointment_department_input", ["gynecology", "cardiology", "dermatology", "not_sure"]);
  forbidButtonValues("appointment_department_input", ["general_medicine", "orthopedics"]);
  if ((nodes.get("appointment_doctor_input")?.data?.buttons ?? []).length !== 0) {
    fail("appointment_doctor_input should use free-text doctor selection, not static buttons");
  }
  if ((nodes.get("appointment_alternate_doctor_input")?.data?.buttons ?? []).length !== 0) {
    fail("appointment_alternate_doctor_input should use free-text doctor selection, not static buttons");
  }

  for (const node of flowExport.flow.nodes) {
    if (node.type !== "record" || node.data?.collection !== "doctors") continue;
    const fields = schemaFor(node.id)?.fields ?? {};
    if (!fields.doctor_scope_key?.unique) fail(`Doctors record node ${node.id} must use doctor_scope_key as the unique doctor inventory key`);
    if (fields.doctor_id?.unique) fail(`Doctors record node ${node.id} must not mark doctor_id unique because it is reused across branch and consultation mode`);
  }

  for (const node of flowExport.flow.nodes) {
    if (node.type !== "record" || node.data?.collection !== "appointment_reservations") continue;
    const fields = schemaFor(node.id)?.fields ?? {};
    if (!fields.reservation_id?.unique) fail(`Reservation record node ${node.id} must use reservation_id as the unique key`);
    if (!fields.reservation_key) fail(`Reservation record node ${node.id} must include reservation_key for timeslot locking`);
  }
}

if (errors.length > 0) {
  console.error(`Hospital journey audit failed for ${exportPath}`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Hospital journey audit passed: ${exportPath}`);
console.log(`Nodes: ${flowExport.flow.nodes.length}`);
console.log(`Edges: ${flowExport.flow.edges.length}`);
