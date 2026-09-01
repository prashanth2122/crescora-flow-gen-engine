# Retail / E-commerce Domain Bundle

This is the retail and D2C FLOW bundle inside the standalone `flow-generator` workspace.

Key files:

- `templates-source/retail-ecommerce-killer-automation.source.flow.json`
- `templates/retail-ecommerce-killer-automation.flow.json`
- `templates-stable/retail-ecommerce-killer-automation.flow.json`
- `WORKFLOW_QA_MATRIX.md`
- `SEEDING.md`

Commands from the package root:

```powershell
npm run domain:retail-ecommerce:build
npm run domain:retail-ecommerce:validate
```

The current bundle focuses on one production-oriented retail automation story:

1. One main intent router for discovery, recommendations, comparison, stock checks, cart, checkout, order service, policies, and support.
2. Natural-language product extraction followed by DB-backed catalog ranking instead of hallucinated products.
3. Stable product, variant, and SKU persistence before any cart, checkout, return, exchange, or refund action.
4. Self-service order support for tracking, change-policy checks, cancellation, returns, exchanges, refund lookup, invoice delivery, warranty handling, and structured escalation.

For demo data in the generic FLOW records store and the reference relational commerce model, use [SEEDING.md](/C:/Users/prash/Desktop/AI-Projects/IMP/flow-generator/domains/retail-ecommerce/SEEDING.md).

If retail flow-specific logic changes, rerun `npm run domains:check` from the package root so the registered bundle rebuilds and validates alongside the other active industries.
