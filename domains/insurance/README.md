# Insurance Domain Bundle

This is the insurance FLOW bundle inside the standalone `flow-generator` workspace.

Key files:

- `templates-source/insurance-claim-policy-service.source.flow.json`
- `templates/insurance-claim-policy-service.flow.json`
- `templates-stable/insurance-claim-policy-service.flow.json`
- `WORKFLOW_QA_MATRIX.md`
- `SEEDING.md`

Commands from the package root:

```powershell
npm run domain:insurance:build
npm run domain:insurance:validate
```

The current bundle focuses on one production-oriented insurance operations surface:

1. One main menu and one main intent router for policy help, policy details, claim registration, missing-document upload, claim status, settlement status, policy service requests, disputes, and agent handoff.
2. Verified policy and claim lookups backed by persisted `flow_records` data rather than placeholder copy.
3. Direct 6-digit OTP entry with 3 forward-only invalid-format attempts and no retry cycles.
4. A hero claim journey that saves the draft early, checks potential duplicates, loads checklist rules from maintained records, accepts document uploads, supports forward-only missing-document recovery, and finalizes either `submitted` or `sync_pending`.
5. Claim status, settlement, service-request, dispute, and upload-documents journeys that reuse seeded record collections so the demo can exercise real persisted state.

The build script generates the source, active export, and stable snapshot from one maintained definition so the flow shape, record collections, and dummy data expectations stay aligned.

Use [SEEDING.md](/C:/Users/prash/Desktop/AI-Projects/IMP/flow-generator/domains/insurance/SEEDING.md) for the record-store data expected by this bundle.
