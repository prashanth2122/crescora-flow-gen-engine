# Seeding Demo Data

Use [seed-demo-retail-records.sql](/C:/Users/prash/Desktop/AI-Projects/IMP/flow-generator/scripts/seed-demo-retail-records.sql) to populate the generic FLOW records store with retail and D2C demo data.

Use the relational reference scripts when you want the fuller enterprise-style commerce model from the brief:

- [create-demo-retail-commerce-reference-schema.sql](/C:/Users/prash/Desktop/AI-Projects/IMP/flow-generator/scripts/create-demo-retail-commerce-reference-schema.sql)
- [seed-demo-retail-commerce-reference-data.sql](/C:/Users/prash/Desktop/AI-Projects/IMP/flow-generator/scripts/seed-demo-retail-commerce-reference-data.sql)

What the FLOW-record seed covers:

- `flow_record_schemas` entries for retail catalog, customer, cart, order, shipment, return, refund, support, stock-subscription, and policy collections
- catalog items for running shoes, headphones, and formal shirts with variant-level stock and pricing
- returning customers, an active cart, orders in `confirmed`, `delivered`, and `out_for_delivery` scenarios
- return, refund, delivery-issue, and back-in-stock cases that map to the main retail support journeys

Before running the FLOW-record seed:

1. Replace the `tenant_id` placeholder at the top of the SQL file.
2. Run the inspection query in the SQL comments first so you know what already exists for that tenant.
3. Run it against the same PostgreSQL database used by the records runtime.
4. Keep the seeded order numbers, SKUs, and phone numbers stable if you want repeatable demo behavior.

Suggested FLOW-record smoke checks after seeding:

1. `Need good wireless headphones for office calls and travelling. Under 7k.` should return the seeded headphone catalog options.
2. `Where is order CR-49280?` should resolve the out-for-delivery order and shipment event.
3. `I want to return my shoes` with the seeded delivered order context should create a deterministic return path.
4. `Black / UK 9 is unavailable` style stock checks should offer the back-in-stock subscription path.
