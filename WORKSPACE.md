# Flow Generator Workspace Package

This package is the monorepo home for portable FLOW generation bundles across industries. It stays next to the application code that defines node types, export schema, validators, and external-contract snapshots.

## Source of truth

- Shared node and export contract: `packages/shared/src/**`
- Portable contract files mirrored into this package: `FLOW_EXTERNAL_LLM_CONTRACT.md`, `flow-export-schema.snapshot.json`, `flow-node-catalog.snapshot.json`, `flow-valid-export.example.json`
- Registered domain bundles: `domains/registry.json`
- Industry/domain bundles live under `domains/<industry>/`
- Current domain bundle:
  - Canonical hospital source flow: `domains/hospital/templates-source/hospital-full-automation.source.flow.json`
  - Import-ready generated flow: `domains/hospital/templates/hospital-full-automation.flow.json`

## Commands

Run from the repo root:

```powershell
npm run flow:contract:generate
npm run flow:generator:sync
npm run flow:generator:validate
npm run flow:generator:check
npm run flow:generator:hospital:build
npm run flow:generator:hospital:validate
npm --workspace packages/flow-generator run domains:check
npm --workspace packages/flow-generator run check:strict
```

Run from this package directly:

```powershell
npm run contract:generate
npm run domains:build
npm run domains:validate
npm run domains:check
npm run domains:check:strict
npm run domain:hospital:build
npm run domain:hospital:validate
npm run domain:hospital:audit:journeys
npm run domain:hospital:audit:content
npm run check
npm run check:strict
```

## Sync rule

When node definitions, flow schema, or external-contract content changes in the app, regenerate the bundle with `contract:generate` so this package and `docs/external-flow-contract/` stay aligned.

When a domain source flow changes, update its registered entry in `domains/registry.json` if needed and rerun the domain sync/build path so the generated export here stays current.

`check` is the repo-sync gate: contract drift plus build/validate for every registered domain bundle. `check:strict` additionally runs any registered domain-specific audits.
