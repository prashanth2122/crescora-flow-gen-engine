import assert from "node:assert/strict";
import test from "node:test";
import vm from "node:vm";

import { buildHospitalAppointmentSingleBranchFlow } from "./hospital-appointment-single-branch-flow.mjs";

const doc = buildHospitalAppointmentSingleBranchFlow();
const filterIds = ["appointment_filter_available_slots", "appointment_filter_alternate_slots", "appointment_filter_conflict_slots"];
const clock = Date.parse("2026-10-03T08:00:00+05:30");
class FixedDate extends Date {
  constructor(...args) { super(...(args.length ? args : [clock])); }
  static now() { return clock; }
}

function fixture(node) {
  const names = node.data.script.matchAll(/rowsFrom\(vars\.(\w+)\)/g);
  const vars = Object.fromEntries(Array.from(names, ([, name]) => [name, { data: [] }]));
  const findVar = (pattern) => Object.keys(vars).find(key => pattern.test(key));
  vars[findVar(/availability_rules_result/)].data = [{
    doctor_id: "doctor-1", doctor_scope_key: "doctor-1:branch:in_person", rule_id: "rule-1",
    branch_id: "branch", consultation_mode: "in_person", consultation_type_label: "Hospital visit",
    weekdays: "[0,1,2,3,4,5,6]", start_time: "09:00", end_time: "13:00",
    slot_duration_minutes: 10, capacity: 1,
  }];
  vars[findVar(/booking_policy_result/)].data = [{ timezone: "Asia/Kolkata", booking_horizon_days: 30, minimum_advance_minutes: 30 }];
  return { vars, findVar };
}

function execute(node, vars) {
  const sandbox = vm.createContext({ vars, Date: FixedDate });
  return new vm.Script(`(function(){${node.data.script}\n})()`).runInContext(sandbox, { timeout: node.data.timeoutMs });
}

for (const id of filterIds) {
  const node = doc.flow.nodes.find(node => node.id === id);
  const inventoryVar = node.data.script.match(/vars\.(\w+) = \{ data: slots \}/)[1];
  test(`${id} indexes 500 appointments once and preserves booked slots`, () => {
    const { vars, findVar } = fixture(node);
    let timestampReads = 0;
    vars[findVar(/active_appointments_result/)].data = Array.from({ length: 500 }, (_, i) => ({
      doctor_id: "doctor-1", status: "confirmed",
      get scheduled_start_at() { timestampReads++; return i === 0 ? "2026-10-04T09:00:00+05:30" : "2026-09-01T09:00:00+05:30"; },
    }));
    assert.equal(execute(node, vars).route, "available");
    assert.ok(timestampReads <= 1000, "timestamp fields must be read only once per appointment, not per slot");
    const slots = vars[inventoryVar].data;
    assert.equal(slots.length, 720);
    const occupied = slots.find(slot => slot.date === "2026-10-04" && slot.start === "09:00");
    assert.equal(occupied.booked, true);
    assert.equal(occupied.status, "booked");
    assert.equal(occupied.slot_id, "doctor-1_branch_in_person_2026-10-04_0900");
    assert.equal(slots.find(slot => slot.date === "2026-10-04" && slot.start === "09:10").booked, false);
  });

  test(`${id} retains capacity, overlap, expiry, leave and cancellation rules`, () => {
    const { vars, findVar } = fixture(node);
    vars[findVar(/availability_rules_result/)].data[0].capacity = 2;
    vars[findVar(/active_reservations_result/)].data = [
      { doctor_id: "doctor-1", appointment_date: "2026-10-04", start_time: "09:05", end_time: "09:15", status: "held", hold_expires_at: "2026-10-04T10:00:00+05:30" },
      { doctor_id: "doctor-1", appointment_date: "2026-10-04", start_time: "09:20", end_time: "09:30", status: "held", hold_expires_at: "2026-10-02T10:00:00+05:30" },
    ];
    vars[findVar(/active_appointments_result/)].data = [
      { doctor_id: "doctor-1", appointment_date: "2026-10-04", appointment_time: "09:00", status: "confirmed" },
      { doctor_id: "doctor-1", appointment_date: "2026-10-04", appointment_time: "09:20", status: "cancelled" },
      { doctor_id: "another-doctor", scheduled_start_at: "2026-10-04T09:10:00+05:30", status: "booked" },
      { doctor_id: "doctor-1", scheduled_start_at: "invalid", status: "booked" },
    ];
    vars[findVar(/schedule_exceptions_result/)].data = [
      { exception_type: "leave", exception_date: "2026-10-05", all_day: true, doctor_scope_key: "doctor-1:branch:in_person" },
      { exception_type: "block", exception_date: "2026-10-04", start_time: "09:30", end_time: "09:40", doctor_id: "doctor-1" },
      { exception_type: "block", exception_date: "2026-10-04", all_day: true, doctor_id: "another-doctor" },
    ];
    execute(node, vars);
    const slots = vars[inventoryVar].data;
    const onDate = time => slots.find(slot => slot.date === "2026-10-04" && slot.start === time);
    assert.equal(onDate("09:00").booked, true);
    assert.equal(onDate("09:10").booked, false);
    assert.equal(onDate("09:20").booked, false);
    assert.equal(onDate("09:30"), undefined);
    assert.equal(slots.some(slot => slot.date === "2026-10-05"), false);
  });

  test(`${id} clears previous inventory on calculation failure and separates empty inventory`, () => {
    const { vars, findVar } = fixture(node);
    vars[inventoryVar] = { data: [{ id: "stale" }] };
    vars[findVar(/booking_policy_result/)].data[0].timezone = "Invalid/Timezone";
    assert.throws(() => execute(node, vars), /time zone/i);
    assert.equal(vars[inventoryVar].data.length, 0);
    vars[findVar(/booking_policy_result/)].data[0].timezone = "Asia/Kolkata";
    vars[findVar(/availability_rules_result/)].data = [];
    assert.equal(execute(node, vars).route, "none");
    const failure = doc.flow.edges.find(edge => edge.source === id && edge.isDefault);
    assert.equal(failure.condition.value, "failure");
    assert.equal(failure.target, "appointment_availability_failed_end");
  });
}

test("availability recovery configuration is idempotent", () => {
  const rebuilt = buildHospitalAppointmentSingleBranchFlow(doc);
  for (const id of filterIds) {
    assert.equal(rebuilt.flow.nodes.find(node => node.id === id).data.script, doc.flow.nodes.find(node => node.id === id).data.script);
  }
  assert.equal(rebuilt.flow.nodes.filter(node => node.id === "appointment_availability_failed_end").length, 1);
  assert.ok(doc.bot.localizedVariables.languages.en.appointment_availability_failed_copy);
});
