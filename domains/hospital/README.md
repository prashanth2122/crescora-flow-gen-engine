# Hospital Domain Bundle

This is the current healthcare-specific FLOW bundle inside the generic `packages/flow-generator` workspace.

Key files:

- `templates-source/hospital-full-automation.source.flow.json`
- `templates/hospital-full-automation.flow.json`
- `templates-stable/hospital-full-automation.flow.json`
- `WORKFLOW_QA_MATRIX.md`

Commands from the package root:

```powershell
npm run domain:hospital:build
npm run domain:hospital:validate
npm run domain:hospital:audit:journeys
npm run domain:hospital:audit:content
```

This bundle is only one domain implementation. Future industries should follow the same `domains/<industry>/` structure rather than adding their files at the package root.

If hospital flow-specific logic changes, rerun `npm run domains:check` from the package root so the registered bundle rebuilds and validates alongside any other active industries.
