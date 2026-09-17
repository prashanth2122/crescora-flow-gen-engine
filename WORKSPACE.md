# Flow Generator Workspace Package

This package is the portable FLOW generation workspace for industry bundles. It can mirror node types, export schema, validators, and external-contract snapshots from the adjacent application checkout.

## Source of truth

- Shared node and export contract: `bot-code-zero/packages/shared/src/**` (mirrored with `npm run contract:generate`)
- Portable contract files mirrored into this package: `FLOW_EXTERNAL_LLM_CONTRACT.md`, `flow-export-schema.snapshot.json`, `flow-node-catalog.snapshot.json`, `flow-valid-export.example.json`
- OTP generation: use the native `otp` node from the mirrored contract. Do not generate OTPs in scripts or expose generated codes through frontend-visible variables.
- Record targeting: set record node `schemaName` to the industry schema (`automobile`, `education`, `financial_services`, `healthcare`, `hospitality`, `insurance`, `professional_services`, `realestate`, or `retail`) and keep `collection` as the logical collection name.
- Registered domain bundles: `domains/registry.json`
- Industry/domain bundles live under `domains/<industry>/`
- Current domain bundle:
  - Canonical hospital source flow: `domains/hospital/templates-source/hospital-full-automation.source.flow.json`
  - Import-ready generated flow: `domains/hospital/templates/hospital-full-automation.flow.json`
  - Canonical retail source flow: `domains/retail-ecommerce/templates-source/retail-ecommerce-killer-automation.source.flow.json`
  - Import-ready generated retail flow: `domains/retail-ecommerce/templates/retail-ecommerce-killer-automation.flow.json`

## Workflow content standard

- New workflows keep every stable customer-visible string in
  `bot.localizedVariables.languages` and reference it as `{{key}}` from node
  configuration. This includes messages, prompts, buttons, forms, carousels,
  confirmations, and customer-visible fallback/error copy.
- English (`en`) is the required base catalog. New multilingual workflows use
  `customerVisibleLocalizationMode: "catalog_only"`, declare
  `bot.languageSupport`, and ship complete entries for every enabled language.
- Localized keys are readonly. Flow nodes must not overwrite them. Use
  `bot.globalVariables` only for readonly values that do not vary by language;
  mutable values come from writers, records, or integrations.
- Keep route values, IDs, API fields, provider template identifiers, database
  values, URLs, queries, and AI instructions out of Localized Content unless the
  value itself is deliberately customer-visible.
- Catalog values are terminal strings because runtime template expansion is one
  pass. Compose localized tokens and dynamic values in the node field.
- Extend mode preserves existing localized keys. New or changed visible copy
  gets a key; renaming a key requires an explicit migration.

## Commands

Run from this package root:

```powershell
npm run contract:generate
npm run test:localized-content
npm run domains:check
npm run domains:validate
npm run check
npm run check:strict
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
npm run domain:retail-ecommerce:build
npm run domain:retail-ecommerce:validate
npm run domain:hospital:audit:journeys
npm run domain:hospital:audit:content
npm run check
npm run check:strict
```

## Sync rule

When node definitions, flow schema, or external-contract content changes in the app, regenerate the bundle with `contract:generate` so this package stays aligned. Set `BOT_CODE_ZERO_ROOT` if the sibling application checkout is not at the default path.

When a domain source flow changes, update its registered entry in `domains/registry.json` if needed and rerun the domain sync/build path so the generated export here stays current.

`check` is the repo-sync gate: contract drift plus build/validate for every registered domain bundle. `check:strict` additionally runs any registered domain-specific audits.
