# Local & Professional Services Domain Bundle

This is the generic local and professional services FLOW bundle inside the standalone `flow-generator` workspace.

Key files:

- `templates-source/local-professional-services-killer-automation.source.flow.json`
- `templates/local-professional-services-killer-automation.flow.json`
- `templates-stable/local-professional-services-killer-automation.flow.json`
- `WORKFLOW_QA_MATRIX.md`
- `SEEDING.md`

Commands from the package root:

```powershell
npm run domain:local-professional-services:build
npm run domain:local-professional-services:validate
```

The current bundle focuses on one production-oriented service operations engine:

1. One main menu and one main intent router for service discovery, pricing, availability, booking, tracking, reschedule, cancellation, invoice, feedback, complaint, and explicit team handoff.
2. Natural-language requirement capture that maps the request into a maintained service category before the catalog is queried.
3. Maintained service catalog records as the source of truth for service names, price models, booking modes, payment policies, assignment modes, and intake hints.
4. Direct 6-digit OTP entry with 3 forward-only invalid-format attempts for both booking identity lookup and post-booking self-service journeys.
5. A full enquiry-to-paid-booking path that persists the service request, checks serviceability, optionally accepts media, fetches live slots from records, holds a slot, collects payment where required, confirms the booking, assigns a professional, notifies the customer, and schedules reminders.
6. Post-booking journeys for status tracking, reschedule, cancellation, invoice and balance collection, rating, and complaint capture against persisted booking data.

The build script generates the source, active export, and stable snapshot from one maintained definition so the flow shape, record collections, and demo data expectations stay aligned.

Use [SEEDING.md](/C:/Users/prash/Desktop/AI-Projects/IMP/flow-generator/domains/local-professional-services/SEEDING.md) for the record-store data expected by this bundle.
