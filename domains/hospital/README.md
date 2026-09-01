# Hospital Domain Bundle

This is the current healthcare-specific FLOW bundle inside the generic `packages/flow-generator` workspace.

Key files:

- `templates-source/hospital-full-automation.source.flow.json`
- `templates/hospital-full-automation.flow.json`
- `templates/assai-deepa-hospital-appointment-single-branch.flow.json`
- `templates-stable/hospital-full-automation.flow.json`
- `WORKFLOW_QA_MATRIX.md`

Commands from the package root:

```powershell
npm run domain:hospital:build
npm run domain:hospital:validate
npm run domain:hospital:appointment-single-branch:build
npm run domain:hospital:appointment-single-branch:validate
npm run domain:hospital:audit:journeys
npm run domain:hospital:audit:content
```

The single-branch appointment variant is generated from the stable hospital source flow instead of keeping a second large hand-maintained hospital JSON. It narrows the experience to appointment booking only, sends a WhatsApp OTP before patient lookup, defaults to one in-person branch, allows doctor selection by department or direct doctor choice, confirms with `pay_at_hospital`, and schedules reminders 12 hours and 2 hours before the booked visit.

For runtime data, the variant still stays collection-oriented in FLOW, but its appointment and reservation writes are shaped for the `healthcare.flow_records` direction from the architecture reference: it preserves the hospital-compatible `branch_*` fields and also writes generic `location_*` plus `scheduled_*_at` fields for downstream healthcare-domain repositories.

This bundle is only one domain implementation. Future industries should follow the same `domains/<industry>/` structure rather than adding their files at the package root.

If hospital flow-specific logic changes, rerun `npm run domains:check` from the package root so the registered bundle rebuilds and validates alongside any other active industries.
