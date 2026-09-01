# Workflow QA Matrix

Use this checklist before importing or releasing a regenerated workflow automation export.

## Primary Journey

| Scenario | Expected result |
| --- | --- |
| Routine happy path | The journey completes self-service whenever possible, with real data persisted and no dummy content. |
| Recoverable exception | The flow offers a forward-only recovery path before any staff escalation. |
| Human escalation | Used only for emergencies, explicit staff requests, sensitive human decisions, unavailable operational data, grounded RAG or web-crawl failure, or true system/integration failure. |
| Routine service completion | Routine journeys save/update records, notify the patient, schedule reminders or audits when relevant, and end without queue or handover nodes. |
| Extend an existing flow | Existing node IDs, edge IDs, route values, and variable meanings stay intact unless the request explicitly changes them. |
| Default branch behavior | Conditional defaults move forward to a distinct recovery node or safe end, never back to the same node or an earlier node. |
| Production content | User-facing copy is real, clear, and friendly; no dummy content, filler text, lorem ipsum, placeholder names, or demo-only messages. |
| Full edge coverage | The flow covers the requested domain edge cases, retries, recovery paths, and safe exits instead of only the happy path. |
| Intent routing | Exactly one main intent router owns concrete journeys directly; there are no nested category intent routers. |
| Appointment patient lookup | Appointment booking starts with a mobile lookup, requires a 6-digit OTP gate before record fetch, allows up to 3 invalid-format retries, reuses an existing patient profile when found, and asks only remaining required details for a new patient. |
| WhatsApp OTP enforcement | The single-branch appointment variant sends the OTP over WhatsApp before patient lookup, validates the exact 6-digit value instead of only checking the format, and stops after 3 failed attempts with hospital call guidance. |
| Active appointment check | Existing patients see any active confirmed appointment before another booking is created, with a clear proceed or stop choice. |
| Consultation patient lookup | Doctor consultation journeys start with a mobile lookup, require a 6-digit OTP gate before record fetch, allow up to 3 invalid-format retries, reuse existing patient details, and save new patient details before booking or ticket creation. |
| Doctor discovery order | Doctor availability and doctor profile journeys ask for branch first, then department, and only then show matching doctors. |
| Single-branch booking variant | The appointment-only single-branch variant must not prompt for branch or consultation-mode choice, must offer department-first or doctor-first selection, and must keep all booking writes scoped to the configured default branch. |
| OTP gate behavior | Every phone-based fetch journey uses an OTP step before lookup, accepts any 6-digit OTP in the current demo mode, loops back to the same OTP input after the first 2 invalid-format attempts, and ends with a start-new-chat message on the 3rd invalid attempt. |
| Appointment reschedule | Reschedule lists only future confirmed appointments, asks which appointment when multiple are found, books a new DB-backed slot, cancels the old appointment, releases the old slot, notifies, audits, and ends. |
| Appointment cancellation | Cancellation has its own mobile-first path, lists only future confirmed appointments, lets the patient select one, asks for confirmation, cancels the selected record, releases the booked slot, notifies with refund guidance, audits, and ends. |
| Appointment payment choice | Booking supports both `pay_now` and `pay_at_hospital` when enabled, and both paths persist `payment_status` before confirmation. |
| Single-branch payment mode | The appointment-only single-branch variant confirms bookings with `pay_at_hospital` only and must not expose the online payment path. |
| Payment prompt UX | When a summary message already asks the patient to choose a payment path, the following button node should render buttons only and should not repeat the same question text. |
| Single-result selection UX | When any selection step returns exactly one valid result, the flow should show that result first and offer a direct proceed action instead of asking the patient to type `1` for a one-item list. |
| Multi-result doctor selection UX | When multiple doctors are shown, the prompt should ask only for the doctor number, such as `1` or `2`, and should not expose or require internal doctor IDs. |
| Post-completion menu uniqueness | Follow-up or next-step button menus should not contain duplicate labels or duplicate reply values in the same rendered menu. |
| Demo consent prompts | For the current hospital demo source, visible consent prompt nodes are not present in the patient-facing journey. |

## Import Safety

| Scenario | Expected result |
| --- | --- |
| Graph cycle check | No retry, fallback, conflict, no-availability, or low-confidence path routes back to the same node or an earlier node. Local validation must pass before import. |
| Variable proof check | Every template variable is written upstream, declared as a bot global, or is one of the allowed safe system/context variables. |
| Output contract check | Generated flow output is full export JSON only, with the exact wrapper and no markdown or partial inner graph. |
| Date field safety | Generated exports do not rely on appointment `dateVar` reads unless the validator bundle explicitly marks them import-safe. |
| Script syntax safety | Every `script` node compiles locally without malformed multiline strings, broken regex literals, or other `Invalid or unexpected token` syntax failures. |
| Database-backed data | Flow state, lookups, and updates use real database records or approved persisted objects instead of dummy runtime-only data. |

## Data And Records

| Scenario | Expected result |
| --- | --- |
| Flow needs persistence | New details added during the flow are written to the correct database record or approved persisted object on the current path. |
| Flow needs lookup data | The journey reads maintained records rather than inventing fake runtime values or placeholder responses. |
| Flow needs confirmation | Confirmation messages reflect the saved state, not a hardcoded demo value. |
| Inventory hold/update | The list query and hold/update query use the same operational filters, and the selected UI ID maps to the persisted unique key. |
| Operational state records | Slot, inventory, hold, lock, queue-state, and scheduler state records use non-PII identifiers and do not store patient mobile/email/name. |
| Patient contact records | Patient mobile and email are stored only in approved patient, appointment, consent, ticket, or domain records, not in operational slot or hold state. |
| Healthcare runtime compatibility | The single-branch appointment variant writes appointment and reservation data with hospital-compatible `branch_*` fields plus generic `location_*` and `scheduled_*_at` fields so the logical FLOW contract can move to `healthcare.flow_records` without dropping timing or location scope. |
| Flow-level PII encryption | Generated record nodes do not depend on `encryptPii: true` unless the deployment preflights `RECORD_PII_ENCRYPTION_KEY`; otherwise record nodes use `encryptPii: false`. |
| Default failure copy | Generic default branches use neutral recovery wording and do not claim a specific cause such as "slot taken" unless that branch is exclusively for that cause. |

## Sensitive And Regulated Data

| Scenario | Expected result |
| --- | --- |
| Consent required | If the deployment requires consent, it is handled through the approved deployment-specific mechanism; the current hospital demo source does not include visible consent prompt nodes. |
| Sensitive data capture | The flow captures only the minimum required data and stores it in the approved record. |
| Audit requirement | Important actions write an audit trail or equivalent trace before the flow ends. |

## Notifications And Follow-Up

| Scenario | Expected result |
| --- | --- |
| Successful action | The flow sends a clear confirmation and follows up only when the workflow requires it. |
| Delivery failure | The flow routes to a safe recovery path or a justified escalation, not a loop. |
| Reminder required | Reminder or follow-up records are scheduled from the saved state, not from a temporary placeholder. |
| Appointment reminder schedule | The single-branch appointment variant must schedule two reminder jobs from the saved appointment datetime: one 12 hours before and one 2 hours before the visit. |

## Feedback

| Scenario | Expected result |
| --- | --- |
| Positive feedback | Feedback case is saved with the user message and a clear satisfaction signal. |
| Complaint or poor rating | Complaint case is saved with high priority and routed for human follow-up. |
