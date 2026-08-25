# Real Estate Domain Bundle

This is the real-estate FLOW bundle inside the standalone `flow-generator` workspace.

Key files:

- `templates-source/real-estate-lead-to-site-visit.source.flow.json`
- `templates/real-estate-lead-to-site-visit.flow.json`
- `templates-stable/real-estate-lead-to-site-visit.flow.json`
- `WORKFLOW_QA_MATRIX.md`
- `SEEDING.md`

Commands from the package root:

```powershell
npm run domain:real-estate:build
npm run domain:real-estate:validate
```

The current bundle focuses on one production-oriented buyer journey:

1. Natural requirement capture from web or WhatsApp enquiry.
2. Returning-buyer detection by contact record.
3. Missing-detail capture only for required qualification fields.
4. Persisted contact and lead upsert.
5. Live project inventory matching and ranked project cards.
6. A main-menu entry for search, project discovery, brochures, comparison, shortlist, site visits, pricing, and direct sales handoff.
7. Brochure sharing and lead scoring.
8. Demo-safe site-visit confirmation, reminders, CRM sync, and hot-lead alerting.

The build script generates the source, active export, and stable snapshot from one maintained definition so the flow, record schemas, and scoring logic stay aligned.

Project-interest persistence now writes literal boolean values for `brochure_requested` on the yes/no branches and on the final confirmed-visit update. That keeps the generated payloads aligned with the `real_estate_lead_project_interests` schema during brochure sharing and site-visit confirmation.

The brochure-to-site-visit demo path is intentionally resilient: after brochure sharing, the buyer continues through scoring, lead updates, appointment-node slot selection, confirmation, reminders, CRM sync, and sales alerting even if optional project-interest persistence is skipped. That prevents brochure-stage human handover from blocking a demo site-visit booking.

The current demo-safe site-visit step does not depend on operational slot or hold records. When the buyer says `Yes`, the flow queries existing confirmed site visits for the selected project, computes available appointment-node slots for the next 14 days from `10:00` AM to `6:00` PM in 30-minute intervals, removes already booked times, persists the confirmed visit, and proceeds with reminder and sales follow-up behavior.

Binary prompts in this journey use `input` nodes with explicit `Yes` and `No` button routes instead of `decision` nodes. That keeps the prompt behavior aligned with the current builder/runtime recommendation.

The landing experience now opens with a main menu. Buyers can tap a guided option or type their requirement directly in the same step, so the menu does not block the natural chat path.

Project cards now use a shared flat illustration across the demo carousel, format prices with decimal crore values, and show the project name on the CTA instead of a generic `Use code` label.

After the buyer shares a mobile number, the flow now pauses for a direct OTP entry step. Any 6-digit OTP is accepted for the demo flow, while non-6-digit entries are retried up to three times before the verification path ends.

For local/demo record data, use [SEEDING.md](/C:/Users/prash/Desktop/AI-Projects/IMP/flow-generator/domains/real-estate/SEEDING.md).
