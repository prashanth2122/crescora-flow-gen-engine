# Seeding Demo Data

Use [seed-demo-interior-design-records.sql](/C:/Users/prash/Desktop/AI-Projects/IMP/flow-generator/scripts/seed-demo-interior-design-records.sql) to populate the generic FLOW records store with interior design demo data.

What it seeds:

- `flow_record_schemas` entries for the interior collections used by the flow
- `interior_packages`, `interior_price_catalog`, `interior_portfolio_items`, and `interior_material_catalog`
- `interior_designers` and future `interior_consultation_slots`
- returning-customer data for `interior_customers`, `interior_properties`, `interior_leads`, and `interior_lead_requirements`
- active `interior_quotes`, `interior_projects`, `interior_project_milestones`, `interior_payments`, and `interior_service_tickets`

Before running:

1. Replace the `tenant_id` placeholder at the top of the SQL file.
2. Run it against the same PostgreSQL database used by the records runtime.
3. Keep the seeded phone numbers, lead IDs, quote IDs, slot IDs, and project codes stable if you want repeatable demo behavior.

Suggested smoke checks after seeding:

1. `My Quote / Proposal` for `+91 98765 43210` should return the seeded `Q-INT-260901-01` proposal.
2. `My Project Status` for the same mobile should return `INT-P-1288` with milestone progress.
3. `Payments / Service` should show both the outstanding milestone and the open service ticket for the seeded customer.
