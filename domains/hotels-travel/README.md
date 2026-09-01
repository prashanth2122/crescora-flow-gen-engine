# Hotels / Travel Domain Bundle

This is the hotel and travel FLOW bundle inside the standalone `flow-generator` workspace.

Key files:

- `templates-source/hotel-digital-front-desk.source.flow.json`
- `templates/hotel-digital-front-desk.flow.json`
- `templates-stable/hotel-digital-front-desk.flow.json`
- `WORKFLOW_QA_MATRIX.md`

Commands from the package root:

```powershell
npm run domain:hotels-travel:build
npm run domain:hotels-travel:validate
```

The current bundle focuses on one production-oriented hotel digital front desk:

1. One main intent router for booking, room/rate checks, packages, booking management, knowledge, transfers, service requests, issue handling, group sales, and explicit team handoff.
2. A shared booking spine for room discovery, live sellable-option filtering, quote snapshots, booking holds, payment collection, confirmation, and pre-arrival scheduling.
3. Self-service booking management for lookup, modification, cancellation, balance payment, and receipt or refund-status guidance.
4. Operational guest journeys for transfers, early check-in or late checkout, service requests, issue prioritization, and group or corporate enquiries.

The build script generates the source, active export, and stable snapshot from one maintained definition so the hotel journey, record contracts, and operational reminder behavior stay aligned.

If hotel flow-specific logic changes, rerun `npm run domains:check` from the package root so the registered bundle rebuilds and validates alongside the other active industries.
