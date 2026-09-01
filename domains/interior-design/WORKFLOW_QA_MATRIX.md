# Workflow QA Matrix

Use this checklist before importing or releasing the interior design sales-consultant workflow.

## Primary Journey

| Scenario | Expected result |
| --- | --- |
| Natural enquiry | The journey accepts a free-text interior requirement without forcing the user into a long opening form. |
| Main menu entry | The first interactive step offers the interior menu options and still accepts direct free-text requirement entry. |
| Missing-field capture | The flow asks only for requirement fields that were not inferred or already provided. |
| Floor-plan intake | Reference upload uses `document-intake` plus `file-processor`, then continues forward even when manual review is required. |
| Estimate logic | Indicative pricing is generated from `interior_price_catalog` records rather than hardcoded text or AI-invented values. |
| Package recommendation | The flow recommends a package from persisted `interior_packages` records and does not present a fabricated tier. |
| Consultation booking | The flow selects a real persisted designer and future slot, then writes the confirmed consultation and updates the slot status. |
| Routine happy path | Requirement capture, estimate, package recommendation, consultation booking, notifications, and reminders complete without human handover. |
| Quote lookup | Quote status is returned from `interior_quotes` using the authenticated mobile number. |
| Project status lookup | Project stage and milestone progress are returned from persisted project records and milestone records. |
| Payments / service | The mobile-authenticated support path can show payment status, open service requests, or create a new service ticket. |
| Human escalation | Handover is reserved for explicit talk-to-designer requests or true system/persistence failures. |

## Import Safety

| Scenario | Expected result |
| --- | --- |
| Graph cycle check | No retry, fallback, or service branch loops back to the same node or an earlier node. |
| Variable proof check | Every template variable is written upstream, declared as a global, or is an allowed system variable. |
| Script syntax safety | Every `script` node compiles locally during validation. |
| File-processor routing | `success`, `partial`, `low_confidence`, `invalid_file`, `manual_review_required`, and `failed` outcomes route explicitly. |
| Appointment safety | Downstream confirmation uses the appointment node `outputVar`, not `dateVar`, for slot selection details. |

## Data And Records

| Scenario | Expected result |
| --- | --- |
| Customer identity | `interior_customers` uses the mobile number as the customer identity, not as the lead primary key. |
| Property persistence | Property details are saved in `interior_properties` rather than only inside chat text. |
| Requirement persistence | Captured scope, style, budget, timeline, reference-file state, and estimate range are saved in `interior_lead_requirements`. |
| Operational slot state | Consultation slot status is updated in `interior_consultation_slots` after booking. |
| Follow-up durability | Reminder jobs are persisted in `interior_followup_jobs` in addition to scheduler nodes. |

## Content

| Scenario | Expected result |
| --- | --- |
| Production wording | The flow avoids placeholder copy, lorem ipsum, and invented operational promises. |
| Estimate disclaimer | The estimate copy states that final pricing depends on measurements, materials, finishes, and the signed proposal. |
| Confirmation accuracy | Final confirmation reflects the selected package, designer, date, and time from persisted variables. |
| Support safety | Materials answers remain grounded to approved catalog data and avoid unsupported blanket claims. |
