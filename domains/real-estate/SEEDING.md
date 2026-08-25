# Seeding Demo Data

Use [seed-demo-real-estate-records.sql](/C:/Users/prash/Desktop/AI-Projects/IMP/bot-code-zero/packages/flow-generator/scripts/seed-demo-real-estate-records.sql) to populate the generic FLOW records store with real-estate demo data.

What it seeds:

- `flow_record_schemas` entries for the real-estate collections used by the flow
- `real_estate_contacts` with returning-buyer sample data
- `real_estate_leads` with saved requirement snapshots
- `property_inventory` with live-matchable sample projects
- `real_estate_site_visit_slots` with future available visit slots

Before running:

1. Replace the `tenant_id` placeholder at the top of the SQL file.
2. Run it against the same PostgreSQL database used by the records runtime.
3. Keep the seeded phone numbers, project IDs, and slot IDs stable if you want repeatable demo behavior.
