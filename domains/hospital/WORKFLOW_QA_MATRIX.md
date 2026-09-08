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
| Appointment patient lookup | Appointment booking starts with a clean Mobile Number field, keeps the Indian-number validation and user-friendly invalid-number handling, requires a 6-digit OTP gate before record fetch, allows up to 3 invalid-format retries, reuses an existing patient profile when found, and asks only remaining required details for a new patient. |
| WhatsApp OTP enforcement | The single-branch appointment variant sends the OTP through the configured WhatsApp transactional/authentication template to the normalized patient mobile before patient lookup, validates the exact 6-digit value instead of only checking the format, and stops after 3 failed attempts with hospital call guidance. |
| WhatsApp OTP production validation | Send through the approved tenant WhatsApp template, verify the exact submitted code against the server-side challenge, and confirm expiry, resend cooldown, and attempt limits on the real WhatsApp provider. A local mock-provider test is not provider-delivery proof. |
| Active appointment check | After WhatsApp OTP, appointments are looked up by `patient_id`; only `booked`/`confirmed` rows with `scheduled_start_at > now` in `Asia/Kolkata` are shown. Patients see the date and time in plain Indian 12-hour format without timezone offsets. Cancelled, completed, expired, and past same-day rows are excluded, followed by proceed/keep-existing choices. |
| Consultation patient lookup | Doctor consultation journeys start with a mobile lookup, require a 6-digit OTP gate before record fetch, allow up to 3 invalid-format retries, reuse existing patient details, and save new patient details before booking or ticket creation. |
| Doctor discovery order | Doctor availability and doctor profile journeys ask for branch first, then department, and only then show matching doctors. |
| Single-branch booking variant | The appointment-only single-branch variant must start with only `📅 Book appointment` and `🚨 Emergency`, must not prompt for branch or consultation-mode choice, must load DB-backed departments before doctors, and must keep all booking reads/writes scoped to `chanda_nagar`. |
| Patient-facing date picker | The appointment date picker keeps its allowed date range and validation, but hides technical minimum/maximum value hints from the patient-facing form. |
| Emergency safety path | Emergency shows one clear urgent-care message with the configured support number, no action buttons, and ends immediately without requesting mobile number, OTP, patient details, or appointment data. `emergency_phone` is a production prerequisite. |
| OTP gate behavior | The appointment path uses the native WhatsApp OTP node before patient lookup with six digits, five-minute expiry, 30-second resend cooldown, three resends, and three attempts; the OTP is not stored in ordinary variables. |
| Appointment reschedule | Reschedule lists only future confirmed appointments, asks which appointment when multiple are found, books a new DB-backed slot, cancels the old appointment, releases the old slot, notifies, audits, and ends. |
| Appointment cancellation | Cancellation has its own mobile-first path, lists only future confirmed appointments, lets the patient select one, asks for confirmation, cancels the selected record, releases the booked slot, notifies with refund guidance, audits, and ends. |
| Appointment payment choice | Booking supports both `pay_now` and `pay_at_hospital` when enabled, and both paths persist `payment_status` before confirmation. |
| Single-branch payment mode | The appointment-only single-branch variant confirms bookings with `pay_at_hospital` only and must not expose the online payment path. |
| Payment prompt UX | When a summary message already asks the patient to choose a payment path, the following button node should render buttons only and should not repeat the same question text. |
| Single-result selection UX | Matching doctors are rendered as carousel cards even when exactly one result is returned; the card includes the DB-backed image URL when present and a button action instead of requiring the patient to type `1`. |
| Department button UX | Active DB-backed departments render as icon-labeled input buttons; the department carousel is not used, and chat input remains enabled for direct department names. There is no separate Not Sure button: typing `Not Sure` or any non-matching text enters the free-text concern path with simple examples. Concern routing is restricted to the 12 supported Sai Deepa departments; unclear or unsupported concerns fall back to General Medicine, and urgent concerns use the emergency-care path. The visible export buttons are regenerated from the verified current Sai Deepa catalog when department records change. |
| Direct concern routing | If a patient types a concern such as `knee joint pain` at the department menu, the existing text is sent directly to the AI department matcher and is not requested again. `Not Sure` remains the explicit path that opens the additional concern prompt. |
| Appointment review UX | Before any reservation hold or appointment write, the confirmation input shows doctor, department, consultation fee, date, time, location, consultation type, and payment mode, followed by the confirmation question and buttons. The legacy summary node is bypassed so the full review appears once in the correct order. |
| Confirmation carousel UX | The final saved appointment is shown in a patient-safe carousel card with appointment ID, doctor, department, fee, date, time, location, and payment. WhatsApp confirmation and reminder delivery statuses stay internal and are not shown to the patient. |
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
| Healthcare runtime compatibility | The canonical source and runtime target are the tenant-scoped `healthcare.flow_records` family selected by `schemaName: "healthcare"`; `collection` remains logical and no mirror to `public.flow_records` is used. The tables must be provisioned before E2E, and rows preserve hospital-compatible `branch_*` fields plus generic `location_*` and `scheduled_*_at` fields. |
| Department catalog source of truth | Departments are fetched from active `healthcare.departments` rows for `chanda_nagar` and prepared as reusable `department_options_text`, `department_map`, and `department_keys`. The export presents the verified catalog as icon-labeled input buttons; runtime DB values remain authoritative for validation, and the export must be regenerated after catalog changes. |
| Booked-slot and leave exclusion | Dynamic slot generation reads schedule rules, `doctor_schedule_exceptions`, policy, active reservations, and active appointments; `pending_payment`, `booked`, `confirmed`, `checked_in`, and `called` appointments consume capacity before slots reach the appointment node. Active full-day `unavailable`, `leave`, `block`, `closed`, `holiday`, `personal_leave`, `sick_leave`, and `vacation` rows remove the exception date, while timed rows remove only overlapping slots. Multiple sessions on the same day remain visible up to the configured 32-slot presentation limit. |
| Multi-session slot rendering | The active imported workflow keeps `maxSlotsPerDay` at `32` on the primary, alternate, and conflict appointment nodes; a doctor with morning and evening sessions must show both sessions, while a doctor with only one session shows only that session. |
| Explicit booking confirmation | Date/slot selection is followed by `Confirm appointment` / `Choose another slot`; no reservation hold or appointment write occurs before confirmation. |
| Payment write authorization | The current confirmation action sets `appointment_confirmation_authorized=confirmed`; only the immediately guarded commit chain can finalize the appointment. `healthcare.payments` is written after the appointment and reservation commit succeeds, so change-slot, cancel, timeout, abandoned, invalid, stale, or failed-commit paths create no payment row. A payment-record failure does not falsely fail an already confirmed booking. Payment IDs are appointment-based for retry-safe upserts. |
| Confirmation payload normalization | Button replies are routed using the canonical configured value even when a channel returns the visible button label; the Sai Deepa confirmation label reaches the booking commit edge reliably. |
| Commit ordering and conflict recovery | Appointment persistence precedes reservation confirmation; failures cancel partial appointment state, release the hold, and state that no confirmed appointment was created. |
| Booking fee payload | The reservation hold preparation computes `appointment_booking_fee_paise` before returning, so payment and appointment record validation receives the selected consultation fee. |
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
| Appointment reminder schedule | After confirmed booking, the single-branch appointment variant schedules two one-shot WhatsApp reminder jobs from `{{appointment_scheduled_at}}`, the normalized appointment start equivalent to `{{appointmentBooking.start}}`: one 12 hours before and one 2 hours before the visit. |
| Exact reminder timing | Reminder jobs use `expiryAt: {{appointment_scheduled_at}}`, `Asia/Kolkata`, `pastTimePolicy: skip`, `00:00–23:59` delivery with no business-hours deferral, and stable appointment/start-based dedupe keys. An already-passed threshold is reported as skipped. |
| Delivery status | WhatsApp uses the approved card names `verify_otp_usecase` for OTP, `appointment_confirmed` for confirmation, and `appointment_reminder` for both reminder windows. The 12-hour and 2-hour triggers still route through separate template-message nodes; template failures use a fallback path. The visible confirmation distinguishes `sent`, `partially_sent`, and `failed` notification status without exposing delivery details. |

## Feedback

| Scenario | Expected result |
| --- | --- |
| Positive feedback | Feedback case is saved with the user message and a clear satisfaction signal. |
| Complaint or poor rating | Complaint case is saved with high priority and routed for human follow-up. |
