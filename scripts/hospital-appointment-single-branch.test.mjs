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
  const outgoing = (id) => doc.flow.edges.filter((edge) => edge.source === id);

  assert.equal(doc.bot.name, "Sai Deepa Hospital Assistant");
  assert.equal(doc.bot.description, "Appointment and patient-support assistant for Sai Deepa Hospitals, Chanda Nagar, Hyderabad. Helps patients find the right department and doctor, verify their mobile number, check available appointment dates and slots, view upcoming appointments, book appointments, and receive confirmation and reminder updates through WhatsApp. For medical emergencies, patients are directed to the hospital’s emergency services.");
  assert.equal(doc.bot.headerLogoUrl, "https://ik.imagekit.io/uzhmjh0td/Helthcare/Sai_Deepa_Hospitals/sai_deepa_logo%20.png?updatedAt=1788013389008");
  assert.equal(doc.bot.headerTitle, "Sai Deepa Hospital Appointments");
  assert.equal(doc.bot.headerTagline, "Find doctors, check availability and book your appointment easily.");
  assert.equal(doc.metadata.runtimeDomainSchema, "healthcare");
  assert.match(doc.metadata.runtimeStorageContract, /healthcare\.flow_records/);
  assert.doesNotMatch(doc.metadata.runtimeStorageContract, /public\.flow_records/);
  assert.match(doc.metadata.runtimeDataPrerequisite, /ensure-sai-deepa-healthcare-schema\.sql/);
  assert.doesNotMatch(doc.metadata.runtimeDataPrerequisite, /sync-sai-deepa-runtime-records\.sql/);
  const globalValue = (key) => doc.bot.globalVariables.find((item) => item.key === key)?.value;
  assert.equal(globalValue("whatsapp_otp_template_name"), "verify_otp_usecase");
  assert.equal(globalValue("whatsapp_confirmation_template_name"), "appointment_confirmed");
  assert.equal(globalValue("whatsapp_reminder_template_name"), "appointment_reminder");
  assert.equal(globalValue("whatsapp_reminder_12h_template_name"), "appointment_reminder");
  assert.equal(globalValue("whatsapp_reminder_2h_template_name"), "appointment_reminder");
  assert.equal(nodeMap.has("appointment_branch_input"), false);
  assert.equal(nodeMap.has("appointment_consultation_type_input"), false);
  assert.equal(nodeMap.has("appointment_online_summary"), false);
  assert.equal(nodeMap.has("main_intent_router"), false);
  assert.equal(nodeMap.get("appointment_intro").data.messages[0].text, "Welcome to Sai Deepa Hospital, Chanda Nagar.");
  assert.deepEqual(
    nodeMap.get("main_menu").data.buttons.map((button) => [button.label, button.value]),
    [["📅 Book Appointment", "book_appointment"], ["🚨 Emergency Help", "emergency"]]
  );
  assert.deepEqual(
    outgoing("main_menu").map((edge) => edge.target).sort(),
    ["emergency_safety_message", "existing_patient_lookup_form"].sort()
  );
  assert.equal(outgoing("emergency_safety_message")[0].target, "emergency_end");
  assert.equal(nodeMap.has("emergency_actions"), false);
  assert.deepEqual(nodeMap.get("emergency_safety_message").data.buttons, []);
  assert.equal(
    nodeMap.get("emergency_safety_message").data.messages[0].text,
    "🚨 **Medical Emergency**\n\nIf you are experiencing a medical emergency, please **visit the nearest hospital immediately** or contact our emergency support team at **📞 +91 7093762716**.\n\n⚠️ This chat is not a substitute for emergency medical care."
  );

  const mobileField = nodeMap.get("existing_patient_lookup_form").data.fields[0];
  assert.equal(mobileField.key, "patient_mobile");
  assert.equal(mobileField.label, "Mobile Number");
  assert.equal(mobileField.placeholder, "Enter 10-digit mobile number");
  assert.equal(mobileField.pattern, "^(?:\\+91[\\s-]?)?[6-9]\\d{9}$");
  assert.equal(mobileField.showPatternHint, false);
  assert.equal(outgoing("existing_patient_lookup_form")[0].target, "appointment_mobile_normalize");

  assert.equal(nodeMap.has("appointment_reminder_12h_scheduler"), true);
  assert.equal(nodeMap.has("appointment_reminder_2h_scheduler"), true);
  assert.equal(nodeMap.get("appointment_reminder_trigger_router").type, "switch");
  assert.equal(nodeMap.get("appointment_reminder_trigger_router").data.variable, "input");
  assert.equal(outgoing("appointment_reminder_trigger_router").find((edge) => edge.condition?.value === "appointment_reminder_12h").target, "appointment_reminder_12h_template");
  assert.equal(outgoing("appointment_reminder_trigger_router").find((edge) => edge.condition?.value === "appointment_reminder_2h").target, "appointment_reminder_2h_template");
  for (const [id, templateName, outputVar] of [
    ["appointment_reminder_12h_template", "appointment_reminder", "appointment_reminder_12h_delivery_result"],
    ["appointment_reminder_2h_template", "appointment_reminder", "appointment_reminder_2h_delivery_result"]
  ]) {
    const template = nodeMap.get(id);
    assert.equal(template.type, "template-message");
    assert.equal(template.data.channel, "whatsapp");
    assert.equal(template.data.templateName, templateName);
    assert.equal(template.data.to, "{{patient_mobile}}");
    assert.equal(template.data.language, "{{whatsapp_template_language}}");
    assert.equal(template.data.category, "transactional");
    assert.equal(template.data.requiresMediaHeader, false);
    assert.equal(template.data.approvedTemplatesCsv, templateName);
    assert.equal(template.data.outputVar, outputVar);
    assert.match(template.data.variablesJson, /appointment_scheduled_at/);
  }

  const otpNode = nodeMap.get("existing_patient_lookup_otp");
  assert.ok(otpNode);
  assert.equal(otpNode.type, "otp");
  assert.deepEqual(otpNode.data.channels, ["whatsapp"]);
  assert.equal(otpNode.data.resendCooldownSeconds, 30);
  assert.equal(otpNode.data.maxResends, 3);
  assert.equal(otpNode.data.maxAttempts, 3);
  assert.equal(otpNode.data.otpTtlSeconds, 300);
  assert.equal(otpNode.data.defaultCountryCode, "+91");
  assert.equal(otpNode.data.phone, "{{patient_mobile}}");
  assert.equal(otpNode.data.whatsappPhone, "{{patient_mobile}}");
  assert.equal(otpNode.data.email, "");
  assert.equal(otpNode.data.whatsappTemplateName, "verify_otp_usecase");
  assert.equal(otpNode.data.whatsappTemplateLanguage, "{{whatsapp_template_language}}");
  assert.equal(otpNode.data.emailSubject, "");
  assert.match(otpNode.data.whatsappMessageTemplate, /Your OTP for appointment booking/);
  assert.equal(otpNode.data.emailBody, "");
  assert.equal(otpNode.data.outputVar, "existing_patient_lookup_otp_result");
  assert.equal(JSON.stringify(doc).includes("existing_patient_lookup_otp_expected"), false);

  const upcoming = nodeMap.get("appointment_upcoming_find");
  assert.deepEqual(upcoming.data.where, { patient_id: "{{patient_id}}" });
  assert.match(nodeMap.get("appointment_upcoming_format").data.script, /activeStatuses = new Set\(\["confirmed", "booked"\]\)/);
  assert.match(nodeMap.get("appointment_upcoming_format").data.script, /scheduled_start_at/);
  assert.match(nodeMap.get("appointment_upcoming_format").data.script, /Date\.now\(\)/);
  assert.match(nodeMap.get("appointment_upcoming_format").data.script, /timeZone: "Asia\/Kolkata"/);
  assert.match(nodeMap.get("appointment_upcoming_format").data.script, /formatDateTime/);
  assert.match(nodeMap.get("appointment_upcoming_format").data.script, /You currently have/);
  assert.match(nodeMap.get("appointment_upcoming_format").data.script, /✅ Confirmed/);
  assert.doesNotMatch(nodeMap.get("appointment_upcoming_format").data.script, /dateTime = item\.scheduled_start_at/);
  assert.equal(nodeMap.get("appointment_upcoming_proceed_decision").data.messages[0], "Would you like to book another appointment?");
  assert.deepEqual(
    nodeMap.get("appointment_upcoming_proceed_decision").data.buttons.map((button) => [button.label, button.value]),
    [["Yes, Book Another", "yes"], ["No, Thanks", "no"]]
  );
  assert.match(nodeMap.get("appointment_upcoming_decline_message").data.messages[0].text, /existing appointments remain confirmed/);

  const departmentCatalog = nodeMap.get("appointment_department_catalog_fetch");
  assert.equal(departmentCatalog.data.collection, "departments");
  assert.equal(departmentCatalog.data.schemaName, "healthcare");
  assert.deepEqual(departmentCatalog.data.where, { branch_id: "{{doctor_scope_branch_id}}", is_active: true });
  for (const id of [
    "appointment_schedule_exceptions_list",
    "appointment_alternate_schedule_exceptions_list",
    "appointment_conflict_schedule_exceptions_list"
  ]) {
    const exceptionNode = nodeMap.get(id);
    assert.equal(exceptionNode.data.collection, "doctor_schedule_exceptions");
    assert.equal(exceptionNode.data.schemaName, "healthcare");
    assert.deepEqual(exceptionNode.data.where, {
      branch_id: "{{doctor_scope_branch_id}}",
      doctor_scope_key: "{{appointment_selected_doctor_scope_key}}"
    });
    assert.equal(exceptionNode.data.collectionSchema.fields.doctor_scope_key.required, true);
    assert.equal(exceptionNode.data.collectionSchema.fields.all_day.type, "boolean");
    assert.equal(exceptionNode.data.collectionSchema.fields.reason_code.type, "string");
  }
  for (const node of doc.flow.nodes.filter((item) => item.type === "record")) {
    assert.equal(node.data.schemaName, "healthcare", `record node ${node.id} must use the healthcare FLOW schema`);
    assert.equal(String(node.data.collection).includes("."), false, `record node ${node.id} must keep collection unqualified`);
  }
  assert.match(nodeMap.get("appointment_department_catalog_prepare").data.script, /department_options_text/);
  assert.match(nodeMap.get("appointment_department_catalog_prepare").data.script, /department_map/);
  assert.match(nodeMap.get("appointment_department_catalog_prepare").data.script, /supported = new Set/);
  assert.doesNotMatch(nodeMap.get("appointment_department_catalog_prepare").data.script, /department_carousel_slides/);
  assert.deepEqual(
    nodeMap.get("appointment_department_input").data.buttons.map(({ label, value }) => [label, value]),
    [
      ["❤️ Cardiology", "cardiology"],
      ["👂 ENT", "ent"],
      ["🩺 General Medicine", "general_medicine"],
      ["🏥 General Surgery", "general_surgery"],
      ["🧠 Neurology", "neurology"],
      ["🦴 Orthopedics", "orthopedics"],
      ["🫁 Pulmonology", "pulmonology"],
      ["👩‍⚕️ Obstetrics & Gynecology", "obstetrics_gynecology"],
      ["🧠 Psychiatry", "psychiatry"],
      ["🩻 Neuro Physiotherapy", "neuro_physiotherapy"],
      ["🚹 Urology", "urology"],
      ["🩸 Vascular Surgery", "vascular_surgery"]
    ]
  );
  assert.match(nodeMap.get("appointment_department_input").data.messages[0], /Please choose the department/);
  assert.equal(
    nodeMap.get("appointment_department_input").data.messages[0],
    "Please choose the department you would like to visit.\n\nNot sure which department to choose? Describe your health concern, and we'll help you choose."
  );
  assert.equal(nodeMap.get("appointment_department_input").data.disableChatInput, false);
  assert.equal(nodeMap.get("appointment_department_carousel"), undefined);
  assert.equal(outgoing("appointment_department_catalog_route").find((edge) => edge.condition?.value === "available").target, "appointment_department_input");
  assert.equal(nodeMap.get("appointment_selection_mode_input"), undefined);

  const departmentPrepare = nodeMap.get("appointment_department_prepare");
  const runDepartmentPrepare = (vars) => new Function("vars", departmentPrepare.data.script)(vars);
  const departmentInputVars = {
    department_keys: ["cardiology", "ent", "general_medicine"],
    department_map: {
      cardiology: "Cardiology",
      ent: "ENT",
      general_medicine: "General Medicine"
    },
    department: "Cardiology"
  };
  assert.equal(runDepartmentPrepare(departmentInputVars).route, "department");
  assert.equal(departmentInputVars.department, "cardiology");
  const typedConcernVars = {
    department_keys: ["cardiology", "ent", "general_medicine"],
    department_map: {
      cardiology: "Cardiology",
      ent: "ENT",
      general_medicine: "General Medicine"
    },
    department: "I am not sure where to go for a persistent cough"
  };
  assert.equal(runDepartmentPrepare(typedConcernVars).route, "ai_match");
  assert.equal(typedConcernVars.department_reason, "I am not sure where to go for a persistent cough");
  const typedNotSureVars = {
    department_keys: ["cardiology", "ent", "general_medicine"],
    department_map: {
      cardiology: "Cardiology",
      ent: "ENT",
      general_medicine: "General Medicine"
    },
    department: "Not Sure"
  };
  assert.equal(runDepartmentPrepare(typedNotSureVars).route, "ask_concern");

  const departmentReasonInput = nodeMap.get("appointment_department_reason_input");
  assert.equal(departmentReasonInput.type, "input");
  assert.equal(departmentReasonInput.data.variable, "department_reason");
  assert.equal(departmentReasonInput.data.disableChatInput, false);
  assert.match(departmentReasonInput.data.messages[0], /health concern/);
  const departmentAiMatch = nodeMap.get("appointment_department_ai_match");
  assert.equal(departmentAiMatch.type, "ai-grounded");
  assert.equal(departmentAiMatch.data.emitResponse, false);
  assert.equal(departmentAiMatch.data.responseContract, "single-key-text");
  assert.equal(departmentAiMatch.data.responseTemplate, "{{answer}}");
  assert.match(departmentAiMatch.data.contextTemplate, /vascular_surgery/);
  assert.match(departmentAiMatch.data.contextTemplate, /emergency_medicine/);
  assert.doesNotMatch(departmentAiMatch.data.contextTemplate, /dermatology|pediatrics|ophthalmology/);
  const departmentAiPrepare = nodeMap.get("appointment_department_match_prepare");
  assert.match(departmentAiPrepare.data.script, /supportedDepartments/);
  assert.match(departmentAiPrepare.data.script, /general_medicine/);
  assert.match(departmentAiPrepare.data.script, /appointment_department_ai_route = "emergency"/);
  assert.deepEqual(
    outgoing("appointment_department_route").map((edge) => [edge.label, edge.target]).sort(),
    [
      ["ask_concern", "appointment_department_reason_input"],
      ["department", "appointment_prepare_scope"],
      ["direct_concern", "appointment_department_ai_match"]
    ].sort()
  );
  assert.equal(outgoing("appointment_department_reason_input")[0].target, "appointment_department_ai_match");
  assert.equal(outgoing("appointment_department_route").find((edge) => edge.condition?.value === "ai_match").target, "appointment_department_ai_match");
  assert.equal(outgoing("appointment_department_ai_match")[0].target, "appointment_department_match_prepare");
  assert.equal(outgoing("appointment_department_match_prepare")[0].target, "appointment_department_ai_route");
  assert.equal(outgoing("appointment_department_ai_route").find((edge) => edge.condition?.value === "matched").target, "appointment_department_safe_message");
  assert.equal(outgoing("appointment_department_ai_route").find((edge) => edge.condition?.value === "general_medicine").target, "appointment_department_safe_message");
  assert.equal(outgoing("appointment_department_ai_route").find((edge) => edge.condition?.value === "emergency").target, "emergency_safety_message");
  assert.equal(outgoing("appointment_department_safe_message")[0].target, "appointment_prepare_scope");

  const runDepartmentScript = (script, vars) => new Function("vars", script)(vars);
  const catalogKeys = [
    "cardiology", "ent", "general_medicine", "general_surgery", "neuro_physiotherapy", "neurology",
    "obstetrics_gynecology", "orthopedics", "psychiatry", "pulmonology", "urology", "vascular_surgery"
  ];
  const matchedVars = { appointment_department_ai_raw_match: "vascular_surgery", department_keys: catalogKeys };
  assert.equal(runDepartmentScript(departmentAiPrepare.data.script, matchedVars).route, "matched");
  assert.equal(matchedVars.department, "vascular_surgery");
  const fallbackVars = { appointment_department_ai_raw_match: "dermatology", department_keys: catalogKeys };
  assert.equal(runDepartmentScript(departmentAiPrepare.data.script, fallbackVars).route, "general_medicine");
  assert.equal(fallbackVars.department, "general_medicine");
  const emergencyVars = { appointment_department_ai_raw_match: "emergency_medicine", department_keys: catalogKeys };
  assert.equal(runDepartmentScript(departmentAiPrepare.data.script, emergencyVars).route, "emergency");
  assert.equal(emergencyVars.department, "");

  assert.equal(nodeMap.get("appointment_doctors_fetch").data.where.booking_enabled, true);
  assert.equal(nodeMap.get("appointment_doctor_carousel").type, "carousel");
  assert.equal(nodeMap.get("appointment_doctor_carousel").data.slidesMode, "dynamic");
  assert.equal(nodeMap.get("appointment_doctor_carousel").data.slidesSource, "{{appointment_doctor_carousel_slides}}");
  assert.equal(nodeMap.get("appointment_doctor_carousel").data.introText, "Please choose a doctor to continue.");
  assert.match(nodeMap.get("appointment_doctor_carousel").data.slideTemplateJson, /image_url/);
  assert.match(nodeMap.get("appointment_doctor_carousel").data.slideTemplateJson, /imageUrl/);
  assert.match(nodeMap.get("appointment_doctor_carousel").data.slideTemplateJson, /Consultation Fee/);
  assert.equal(nodeMap.get("appointment_doctor_input").data.disableChatInput, false);
  assert.deepEqual(nodeMap.get("appointment_doctor_input").data.messages, []);
  const doctorPrepareVars = {
    appointment_doctors_result: {
      data: [{
        branch_id: "chanda_nagar",
        doctor_id: "doc_sdh_007",
        is_active: true,
        languages: ["Telugu", "Hindi", "English"],
        department: "cardiology",
        designation: "Consultant Cardiologist & Interventional Cardiologist",
        display_name: "Dr. Akash Pravin",
        booking_enabled: true,
        doctor_scope_key: "doc_sdh_007:chanda_nagar:in_person",
        experience_label: "8+ Years of Experience",
        consultation_mode: "in_person",
        profile_photo_url: "https://www.statnews.com/wp-content/uploads/2024/08/AdobeStock_641399935-645x645.jpeg",
        consultation_fee_paise: 70000,
        department_display_name: "Cardiology",
        consultation_fee_display: "₹700"
      }]
    },
    department: "cardiology",
    branch_id: "chanda_nagar",
    doctor_scope_branch_id: "chanda_nagar",
    consultation_type: "in_person"
  };
  new Function("vars", nodeMap.get("appointment_doctor_selection_prepare").data.script)(doctorPrepareVars);
  assert.equal(
    doctorPrepareVars.appointment_doctor_carousel_slides[0].image_url,
    "https://www.statnews.com/wp-content/uploads/2024/08/AdobeStock_641399935-645x645.jpeg"
  );
  for (const id of ["appointment_slot_booking", "appointment_alternate_slot_booking", "appointment_conflict_slot_booking"]) {
    const slot = nodeMap.get(id);
    assert.equal(slot.data.slotMode, "dynamic");
    assert.equal(slot.data.dynamicSlotsVar, id === "appointment_slot_booking" ? "appointment_future_slots" : id === "appointment_alternate_slot_booking" ? "alternate_appointment_future_slots" : "conflict_appointment_future_slots");
    assert.equal(slot.data.dynamicSlotsPath, "data");
    assert.equal(slot.data.maxSlotsPerDay, 32);
    assert.equal(slot.data.timezone, "Asia/Kolkata");
    assert.equal(slot.data.horizonDays, 30);
    assert.equal(slot.data.bookedSlotBehavior, "strikethrough");
  }
  for (const id of [
    "appointment_filter_available_slots",
    "appointment_filter_alternate_slots",
    "appointment_filter_conflict_slots",
  ]) {
    assert.match(nodeMap.get(id).data.script, /isBlockingException/);
    assert.match(nodeMap.get(id).data.script, /doctor_scope_key/);
    assert.match(nodeMap.get(id).data.script, /allDay/);
    assert.match(
      nodeMap.get(id).data.script,
      /status: isBooked \? "booked" : "available"/,
      `${id} must retain occupied candidates as booked slots`,
    );
  }
  const indiaDate = (daysFromToday) => {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).formatToParts(new Date(Date.now() + daysFromToday * 24 * 60 * 60 * 1000));
    const get = (type) => parts.find((part) => part.type === type)?.value || "00";
    return `${get("year")}-${get("month")}-${get("day")}`;
  };
  const leaveDate = indiaDate(1);
  const exceptionFilterVars = {
    appointment_availability_rules_result: {
      data: [{
        rule_id: "RULE-001",
        doctor_id: "doc_sdh_001",
        doctor_scope_key: "doc_sdh_001:chanda_nagar:in_person",
        branch_id: "chanda_nagar",
        start_time: "09:00",
        end_time: "11:00",
        slot_duration_minutes: 30,
        buffer_minutes: 0,
        capacity: 1,
        is_active: true
      }]
    },
    appointment_schedule_exceptions_result: {
      data: [{
        exception_id: "DEX-001",
        doctor_scope_key: "doc_sdh_001:chanda_nagar:in_person",
        branch_id: "chanda_nagar",
        exception_date: leaveDate,
        exception_type: "unavailable",
        all_day: true,
        reason_code: "personal_leave"
      }]
    },
    appointment_active_reservations_result: { data: [] },
    appointment_active_appointments_result: { data: [] },
    appointment_booking_policy_result: {
      data: [{ timezone: "Asia/Kolkata", minimum_advance_minutes: 0, booking_horizon_days: 30, allow_same_day_booking: true }]
    },
    doctor_id: "doc_sdh_001",
    doctor_scope_branch_id: "chanda_nagar",
    appointment_selected_doctor_scope_key: "doc_sdh_001:chanda_nagar:in_person",
    consultation_type: "in_person"
  };
  const exceptionFilterResult = new Function("vars", nodeMap.get("appointment_filter_available_slots").data.script)(exceptionFilterVars);
  assert.equal(exceptionFilterResult.route, "available");
  assert.ok(exceptionFilterVars.appointment_future_slots.data.length > 0);
  assert.equal(exceptionFilterVars.appointment_future_slots.data.some((slot) => slot.date === leaveDate), false);

  exceptionFilterVars.appointment_schedule_exceptions_result.data[0] = {
    ...exceptionFilterVars.appointment_schedule_exceptions_result.data[0],
    all_day: false,
    start_time: "09:30",
    end_time: "10:00"
  };
  new Function("vars", nodeMap.get("appointment_filter_available_slots").data.script)(exceptionFilterVars);
  const leaveDaySlots = exceptionFilterVars.appointment_future_slots.data.filter((slot) => slot.date === leaveDate);
  assert.deepEqual(leaveDaySlots.map((slot) => slot.start), ["09:00", "10:00", "10:30"]);

  assert.equal(outgoing("appointment_set_ids")[0].target, "appointment_booking_confirmation");
  assert.equal(outgoing("appointment_summary_route")[0].target, "appointment_set_pay_at_hospital");
  assert.equal(nodeMap.has("appointment_summary"), false);
  assert.equal(
    outgoing("appointment_booking_confirmation").find((edge) => edge.condition?.value === "confirm").target,
    "appointment_payment_confirmation_authorize"
  );
  assert.equal(
    outgoing("appointment_reselect_confirmation").find((edge) => edge.condition?.value === "confirm").target,
    "appointment_payment_confirmation_authorize"
  );
  assert.equal(
    outgoing("appointment_payment_confirmation_authorize")[0].target,
    "appointment_prepare_reservation_hold"
  );
  assert.equal(
    nodeMap.get("appointment_payment_confirmation_gate").data.variable,
    "appointment_confirmation_authorized"
  );
  assert.equal(
    outgoing("appointment_set_pay_at_hospital")[0].target,
    "appointment_payment_confirmation_gate"
  );
  assert.equal(
    outgoing("appointment_payment_confirmation_gate").find((edge) => edge.condition?.value === "confirmed").target,
    "appointment_confirm_record_update"
  );
  assert.equal(
    outgoing("appointment_payment_confirmation_gate").find((edge) => edge.isDefault).target,
    "appointment_no_booking_message"
  );
  assert.equal(
    nodeMap.get("appointment_set_ids").data.assignments.find((item) => item.key === "appointment_confirmation_authorized").value,
    "pending"
  );
  assert.equal(
    nodeMap.get("appointment_set_pay_at_hospital").data.assignments.find((item) => item.key === "payment_id").value,
    "PAY-HOSPITAL-{{appointment_id}}"
  );
  assert.equal(nodeMap.get("appointment_payment_record").data.data.transaction_ref, "{{appointment_reservation_id}}");
  assert.deepEqual(
    doc.flow.edges.filter((edge) => edge.target === "appointment_payment_record").map((edge) => edge.source),
    ["appointment_slot_booked_update"]
  );
  assert.equal(
    outgoing("appointment_confirm_record_update").find((edge) => edge.condition?.value === "success").target,
    "appointment_slot_booked_update"
  );
  assert.equal(
    outgoing("appointment_slot_booked_update").find((edge) => edge.condition?.value === "success").target,
    "appointment_payment_record"
  );
  assert.equal(
    outgoing("appointment_payment_record").find((edge) => edge.condition?.value === "success").target,
    "appointment_notify"
  );
  assert.equal(
    outgoing("appointment_payment_record").find((edge) => edge.isDefault).target,
    "appointment_notify"
  );
  const prepareHoldScript = nodeMap.get("appointment_prepare_reservation_hold").data.script;
  const feeAssignment = "vars.appointment_booking_fee_paise = Math.round(Number(vars.appointment_booking_fee || 0) * 100);";
  assert.ok(prepareHoldScript.indexOf(feeAssignment) < prepareHoldScript.indexOf("return {"));
  const prepareHoldVars = {
    appointment_selected_slot: {
      date: "2026-09-10",
      start: "10:00",
      end: "10:15",
      consultation_fee: 700
    },
    appointment_reservation_id: "RSV-test",
    appointment_hold_ttl_minutes: 10
  };
  new Function("vars", prepareHoldScript)(prepareHoldVars);
  assert.equal(prepareHoldVars.appointment_booking_fee_paise, 70000);
  const confirmationPrompt = nodeMap.get("appointment_booking_confirmation").data.messages[0];
  assert.match(confirmationPrompt, /Please review your appointment details/);
  assert.match(confirmationPrompt, /👨‍⚕️ Doctor: \{\{appointment_doctor_name\}\}/);
  assert.match(confirmationPrompt, /🏥 Department: \{\{appointment_department_name\}\}/);
  assert.match(confirmationPrompt, /📍 Hospital: Sai Deepa Hospital, Chanda Nagar/);
  assert.match(confirmationPrompt, /📅 Date: \{\{appointment_date\}\}/);
  assert.match(confirmationPrompt, /🕐 Appointment: \{\{appointment_slot_label\}\}/);
  assert.match(confirmationPrompt, /🩺 Visit Type: In-person consultation/);
  assert.match(confirmationPrompt, /💰 Consultation Fee: \{\{currency\}\} \{\{appointment_booking_fee\}\}/);
  assert.match(confirmationPrompt, /Payment: Pay at hospital/);
  assert.match(confirmationPrompt, /Would you like to confirm this appointment\?/);
  assert.deepEqual(
    nodeMap.get("appointment_booking_confirmation").data.buttons.map((button) => [button.label, button.value]),
    [["✅ Confirm Appointment", "confirm"], ["← Change Appointment", "change_slot"]]
  );
  assert.equal(nodeMap.has("appointment_summary"), false);
  assert.equal(nodeMap.get("appointment_confirmation").type, "carousel");
  for (const node of nodeMap.values()) {
    if (node.type === "message") {
      assert.ok(Array.isArray(node.data.messages) && node.data.messages.length > 0, `${node.id} must contain a message`);
    }
  }
  assert.match(nodeMap.get("appointment_confirmation").data.slidesJson, /Appointment ID/);
  assert.match(nodeMap.get("appointment_confirmation").data.introText, /Your appointment has been confirmed/);
  assert.match(nodeMap.get("appointment_confirmation").data.slidesJson, /In-person consultation/);
  const appointmentNotification = nodeMap.get("appointment_notify");
  assert.deepEqual(appointmentNotification.data.channels.map((channel) => channel.type), ["whatsapp"]);
  assert.equal(appointmentNotification.data.recipients[0].whatsappPhone, "{{patient_mobile}}");
  assert.equal(appointmentNotification.data.channels[0].templateName, "appointment_confirmed");
  assert.equal(appointmentNotification.data.channels[0].language, "{{whatsapp_template_language}}");
  assert.equal(appointmentNotification.data.channels[0].requiresMediaHeader, false);
  assert.equal(appointmentNotification.data.channels[0].variables["2"], "{{appointment_id}}");
  assert.equal(appointmentNotification.data.channels[0].variables[6], "{{appointment_slot_label}}");
  assert.equal(appointmentNotification.data.recipients[0].email, undefined);
  assert.doesNotMatch(JSON.stringify(doc), /temporary_appointment_email|prashanth\.chinala@gmail\.com/);
  assert.doesNotMatch(nodeMap.get("appointment_confirmation").data.slidesJson, /Email confirmation|12-hour reminder|2-hour reminder/);
  assert.equal(nodeMap.get("appointment_confirm_record_update").data.data.status, "booked");
  assert.equal(nodeMap.get("appointment_confirm_record_update").data.schemaName, "healthcare");

  for (const [id, hours, triggerText, templateName, dedupe] of [["appointment_reminder_12h_scheduler", 12, "appointment_reminder_12h", "appointment_reminder", "{{appointment_id}}:{{appointment_scheduled_at}}:appointment_reminder_12h"], ["appointment_reminder_2h_scheduler", 2, "appointment_reminder_2h", "appointment_reminder", "{{appointment_id}}:{{appointment_scheduled_at}}:appointment_reminder_2h"]]) {
    const reminder = nodeMap.get(id);
    assert.equal(reminder.data.offset.direction, "before");
    assert.equal(reminder.data.offset.value, hours);
    assert.equal(reminder.data.dedupeKey, dedupe);
    assert.equal(reminder.data.runAt, "{{appointment_scheduled_at}}");
    assert.equal(reminder.data.expiryAt, "{{appointment_scheduled_at}}");
    assert.equal(reminder.data.timezone, "Asia/Kolkata");
    assert.equal(reminder.data.maxExecutions, 1);
    assert.equal(reminder.data.pastTimePolicy, "skip");
    assert.equal(reminder.data.sendWindow.start, "00:00");
    assert.equal(reminder.data.sendWindow.end, "23:59");
    assert.equal(reminder.data.sendWindow.outsideWindowPolicy, "skip");
    assert.equal(reminder.data.payload.channel, "whatsapp");
    assert.equal(reminder.data.payload.triggerText, triggerText);
    assert.equal(reminder.data.payload.templateName, templateName);
  }
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
