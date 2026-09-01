# Education Domain Bundle

This is the education-specific FLOW bundle inside the standalone `flow-generator` workspace.

Key files:

- `templates-source/education-admission-operating-system.source.flow.json`
- `templates/education-admission-operating-system.flow.json`
- `templates-stable/education-admission-operating-system.flow.json`
- `WORKFLOW_QA_MATRIX.md`
- `SEEDING.md`

Commands from the package root:

```powershell
npm run domain:education:build
npm run domain:education:validate
```

For demo data in the generic FLOW records store, use [SEEDING.md](/C:/Users/prash/Desktop/AI-Projects/IMP/flow-generator/domains/education/SEEDING.md).

The current bundle focuses on one production-oriented admissions operating system for schools and colleges:

1. Main-menu driven enquiry routing with one primary intent router.
2. Academic-year, campus, and class or programme discovery from maintained records.
3. Deterministic eligibility checks grounded in admission rules rather than model invention.
4. Draft application creation with persisted applicant, guardian, and application state.
5. Dynamic document requirement lookup, document intake, OCR processing, and forward-only re-upload handling.
6. Campus visit or counsellor-call booking from maintained slot inventory.
7. Application-fee payment capture, submission confirmation, reminders, and application-status lookup.

The build script generates the source, active export, and stable snapshot from one maintained definition so the admissions journey, record contracts, and operational reminders stay aligned.

If education flow-specific logic changes, rerun `npm run domains:check` from the package root so the registered bundle rebuilds and validates alongside any other active industries.
