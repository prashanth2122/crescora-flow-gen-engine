# Interior Design / Services Domain Bundle

This is the interior design and services FLOW bundle inside the standalone `flow-generator` workspace.

Key files:

- `templates-source/interior-design-sales-consultant.source.flow.json`
- `templates/interior-design-sales-consultant.flow.json`
- `templates-stable/interior-design-sales-consultant.flow.json`
- `WORKFLOW_QA_MATRIX.md`
- `SEEDING.md`

Commands from the package root:

```powershell
npm run domain:interior-design:build
npm run domain:interior-design:validate
```

The current bundle focuses on one production-oriented automation story:

1. Natural requirement capture for residential or commercial interior enquiries.
2. Progressive missing-detail capture for property type, stage, configuration, area, location, scope, style, budget, and timeline.
3. Optional floor-plan and reference upload using the built-in document-intake and file-processor nodes.
4. Indicative estimate generation from maintained `interior_price_catalog` records rather than invented pricing.
5. Package recommendation from persisted package records, followed by consultation booking with persisted designer and slot data.
6. Self-service quote, project, payment, and service/warranty lookups backed by persisted `flow_records` data.

For local/demo record data, use [SEEDING.md](/C:/Users/prash/Desktop/AI-Projects/IMP/flow-generator/domains/interior-design/SEEDING.md).

If interior flow-specific logic changes, rerun `npm run domains:check` from the package root so the registered bundle rebuilds and validates alongside the other active industries.
