# Education Workflow QA Matrix

Use this checklist before importing or releasing the education admissions bundle.

## Core flow safety

- One main intent router only. Do not add nested category routers for routine admissions paths.
- Keep the graph acyclic. Retry, invalid-selection, re-upload, and payment-recovery paths must move forward.
- Preserve automation-first behavior. Human handover is only for true exceptions, sensitive cases, or system failures.

## Record and data grounding

- Academic years, campuses, programme offerings, fee structures, admission rules, document requirements, and slot inventory must come from maintained records or APIs.
- Do not hardcode fees, eligibility thresholds, scholarship approval, seat status, or admission dates in production data sources.
- Persist draft applications before long data capture so the user can resume without repeating work.
- Keep applicant, guardian, and application records separate. Do not model parent mobile as the sole applicant identity.

## Eligibility and fees

- Eligibility outcomes must be deterministic from admission rules; grounded AI may explain the result but must not invent the rule.
- Fee display and application-fee amount must come from the selected fee structure.
- Scholarship messaging must stay preliminary until verification or staff approval.

## Documents and bookings

- Document intake should store metadata and verification outcomes, not raw binaries inside flow records.
- Low-confidence document paths should move to a forward re-upload or manual-review state, not loop backward.
- Campus-visit and counsellor availability must be sourced from DB-backed slot inventory before the appointment node.
- Production slot holds should use atomic backend behavior to avoid double booking.

## Payments, reminders, and status

- Payment failure must preserve the draft and provide self-service retry or pay-later recovery.
- Schedule reminders from persisted application or appointment state, not temporary chat state.
- Status lookup must show the current application stage without asking the user to repeat the entire application.
- Verify `npm run domain:education:build` and `npm run domain:education:validate` pass before import.
