# Financial Services Domain Bundle

This is the financial-services FLOW bundle inside the standalone `flow-generator` workspace.

Key files:

- `templates-source/financial-services-loan-advisor-automation.source.flow.json`
- `templates/financial-services-loan-advisor-automation.flow.json`
- `templates-stable/financial-services-loan-advisor-automation.flow.json`
- `WORKFLOW_QA_MATRIX.md`
- `SEEDING.md`

Commands from the package root:

```powershell
npm run domain:financial-services:build
npm run domain:financial-services:validate
```

The current bundle focuses on one production-oriented lending operations surface:

1. One main menu that still accepts direct free-text loan enquiries.
2. Loan-type-aware capture for home, personal, and business lending.
3. Returning-customer lookup with direct 6-digit OTP verification and active-request detection.
4. Early draft persistence to the generic records layer before advisor booking.
5. Record-backed indicative guidance, document checklist generation, document intake, advisor slot selection, appointment confirmation, follow-up scheduling, and CRM outbox persistence.
6. A separate status-check journey that reads the saved lead and status-history records instead of relying on runtime-only state.

The build script generates the source, active export, and stable snapshot from one maintained definition so the flow graph, record collections, and demo seed expectations stay aligned.

Use [SEEDING.md](/C:/Users/prash/Desktop/AI-Projects/IMP/flow-generator/domains/financial-services/SEEDING.md) for the record-store data expected by this bundle.
