# Automobile Domain Bundle

This is the automobile FLOW bundle inside the standalone `flow-generator` workspace.

Key files:

- `templates-source/automobile-customer-lifecycle-assistant.source.flow.json`
- `templates/automobile-customer-lifecycle-assistant.flow.json`
- `templates-stable/automobile-customer-lifecycle-assistant.flow.json`
- `WORKFLOW_QA_MATRIX.md`
- `SEEDING.md`

Commands from the package root:

```powershell
npm run domain:automobile:build
npm run domain:automobile:validate
```

The current bundle focuses on one production-oriented automobile lifecycle story:

1. One main intent router for discovery, comparison, pricing, brochures, test drives, finance, exchange, service booking, service status, estimate handling, payments, warranty, and advisor escalation.
2. Natural-language vehicle requirement capture followed by DB-backed variant ranking rather than hardcoded recommendations.
3. A real test-drive journey that checks maintained demonstrator inventory, surfaces future slots, writes booking state, assigns the right salesperson, and schedules reminders.
4. A service journey that books real slots, persists bookings, surfaces current service-order status, handles digital estimate approval, and records payment completion without routing routine work through humans.

For demo data in the generic FLOW records store, use [SEEDING.md](/C:/Users/prash/Desktop/AI-Projects/IMP/flow-generator/domains/automobile/SEEDING.md).
