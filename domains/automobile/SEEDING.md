# Seeding Demo Data

Use [seed-demo-automobile-records.sql](/C:/Users/prash/Desktop/AI-Projects/IMP/flow-generator/scripts/seed-demo-automobile-records.sql) to populate the generic FLOW records store with automobile demo data.

What it seeds:

- `flow_record_schemas` entries for the automobile collections used by the flow
- maintained `vehicle_variants`, `vehicle_offers`, `dealership_locations`, and `dealership_staff`
- returning customers, qualified leads, test-drive inventory and slots
- customer vehicles, service slots, service bookings, service orders, estimates, and a pending service payment

Before running:

1. Replace the `tenant_id` placeholder at the top of the SQL file.
2. Run it against the same PostgreSQL database used by the records runtime.
3. Keep the seeded phone numbers, booking IDs, slot IDs, and service-order IDs stable if you want repeatable demo behavior.

Date note:

- This script is aligned to Tuesday, August 25, 2026.
- All seeded test-drive and service operational dates are on or after Wednesday, August 26, 2026.
