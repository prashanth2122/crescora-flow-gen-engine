# Hospital Appointment Sync Standard

This document is the canonical scheduling instruction for every hospital FLOW
generated from this repository. It defines how a workflow stays synchronized
with the hospital CRM. The CRM owns operational scheduling data; a FLOW must
never hardcode departments, doctors, recurring availability, leave, holds, or
booked slots.

## Source of truth

All reads and writes use the tenant-scoped `healthcare.flow_records` family
with the same authenticated tenant, `branch_id`, and `doctor_scope_key` used
by CRM.

| Scheduling decision | CRM logical collection |
| --- | --- |
| Is a department selectable? | `departments` |
| Is a doctor bookable? | `doctors` |
| What recurring sessions exist? | `doctor_availability_rules` |
| Is the doctor on leave, blocked, or assigned an extra session? | `doctor_schedule_exceptions` |
| What booking horizon, cutoffs, timezone, and hold TTL apply? | `appointment_booking_policies` |
| Is a slot held or booked? | `appointment_reservations`, `appointments` |

The logical collection name remains in the record node while
`schemaName` is `healthcare`. Do not mirror these records to
`public.flow_records` or replace them with runtime-only fixtures.

## Required booking sequence

## Appointment journey source mapping

Persist the channel used to start the booking journey on the appointment
record using this mapping:

| Layer | Location |
| --- | --- |
| Table | "healthcare"."flow_records" |
| Record filter | collection = 'appointments' |
| JSON column | "dataJson" |
| Booking source key | "dataJson"->>'booking_source' |

Generated hospital FLOWs must populate booking_source from the runtime channel
value {{system.channel}}. This records the journey source (web or whatsapp)
independently from notification delivery channel fields.

Every appointment, alternate-doctor, conflict-retry, reschedule, and
change-slot path must follow the same data-backed sequence:

```text
Select branch
  -> Load active departments for branch
  -> Select active department
  -> Load active, booking-enabled doctors for branch, department, and consultation type
  -> Select doctor
  -> Load rules, exceptions, policy, active holds, and booked appointments
  -> Calculate current slot inventory
  -> Select slot
  -> Create a short-lived reservation hold
  -> Confirm booking atomically
```

When a branch, department, doctor, or consultation type changes, clear the
old doctor, slot, hold, and schedule variables before continuing.

## Required record filters

Department lists must be branch-scoped and active:

```json
{
  "collection": "departments",
  "where": {
    "branch_id": "{{doctor_scope_branch_id}}",
    "is_active": true
  }
}
```

Doctor lists must use the selected scope and require both bookability flags:

```json
{
  "collection": "doctors",
  "where": {
    "branch_id": "{{doctor_scope_branch_id}}",
    "department": "{{department}}",
    "consultation_mode": "{{consultation_type}}",
    "is_active": true,
    "booking_enabled": true
  }
}
```

Never show an inactive department, a doctor from another branch, an inactive
doctor, or a doctor whose booking is disabled. Alternative and change-doctor
queries must apply the same filters.

## Availability and inventory

Availability must be calculated from live CRM records for the selected branch
and doctor:

- Read active `doctor_availability_rules` and respect `weekdays`,
  `start_time`, `end_time`, `slot_duration_minutes`, capacity, `valid_from`,
  and `valid_until`.
- Read the active booking policy for timezone, advance-booking range,
  same-day booking, cutoffs, and hold TTL.
- Apply active `doctor_schedule_exceptions` after recurring rules. A leave or
  block removes availability; an extra session adds availability.
- Exclude expired and past times using the policy timezone.
- Exclude capacity consumed by active reservations and confirmed/pending
  appointment states before displaying inventory.
- Render only the computed dynamic inventory. Do not generate synthetic slots
  from static working hours when CRM inventory is empty or unavailable.

`dynamicSlotsVar` and its `dynamicSlotsPath` are the source of truth for date
and slot rendering. The current runtime parses `availableWeekdays` as
zero-based values `0` through `6`; therefore generated hospital FLOWs may use
`"0,1,2,3,4,5,6"` only as a permissive renderer compatibility value. It must
never restrict CRM inventory. Do not use `"1"` as a permanent Monday-only
filter, and do not use a one-based `1` through `7` value with the current
runtime contract.

## Holds and atomic booking

Slot conflicts must be checked twice:

1. Before display, exclude or mark slots consumed by active holds and
   confirmed/pending appointments.
2. On submit, create a short-lived reservation hold using a stable
   `reservation_key`.

Final confirmation must use an idempotency key and one atomic booking commit
that combines duplicate protection, reservation confirmation, appointment
creation, payment creation where applicable, the required audit mutation, and
the outbox enqueue. A client retry or two patients selecting the same slot
must not create two appointments.

Do not write a reservation, appointment, or payment record before the patient
explicitly confirms the reviewed appointment. For `pay_at_hospital`, payment
creation still occurs only after the appointment and reservation commit
succeeds. A payment-write failure must not falsely report that the confirmed
appointment failed.

## Appointment identity

The saved appointment must retain, directly or through the approved linked
records, the complete operational identity:

```text
appointment_id
patient_id
doctor_id
doctor_scope_key
branch_id / location_id
department
slot_id
reservation_id
reservation_key
appointment_date + appointment_time
scheduled_start_at + scheduled_end_at
status
payment_status
```

## Required failure behavior

- No active department: show `This department is currently unavailable.`
- No eligible doctor: show `No bookable doctor is available for this department at this branch.`
- No rule or upcoming slot: offer another doctor, branch, or date; never show
  made-up slots.
- Slot becomes unavailable: refresh live inventory and return to date
  selection.
- CRM read failure: stop safely; never fall back to a hardcoded schedule.
- Branch, department, doctor, or consultation-mode change: clear stale
  selection, hold, and schedule state before continuing.

## Release gate

Before importing or releasing any generated hospital FLOW, verify all of the
following against CRM-backed fixtures and runtime behavior:

- Inactive departments are absent.
- Doctors with `is_active: false` or `booking_enabled: false` are absent.
- Monday-only, Wednesday-only, Monday–Saturday, and Sunday schedules show
  exactly their intended dates.
- A leave blocks only its date or time range.
- An extra session appears.
- An active hold makes its slot unavailable until expiry.
- A confirmed appointment cannot be double-booked.
- A CRM schedule edit is visible in a new FLOW session without regenerating
  the FLOW.
- Appointment, alternate-doctor, conflict-retry, reschedule, and change-slot
  paths use the same rules and filters.
- The generated export passes the hospital appointment-sync validator and the
  normal contract, localization, return-flow, domain, and export checks.

## Generator maintenance rule

This file is the shared instruction source for hospital appointment
generators. When the CRM schema, runtime contract, or booking guarantees
change, update this document, the generator, the sync validator, the QA
matrix, and the generated exports together. Do not patch an imported JSON
export as the permanent fix.
