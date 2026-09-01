# Seeding Demo Data

Use [seed-demo-financial-services-records.sql](/C:/Users/prash/Desktop/AI-Projects/IMP/flow-generator/scripts/seed-demo-financial-services-records.sql) to populate the generic FLOW records store with financial-services demo data.

What it seeds:

- `flow_record_schemas` entries for the lending collections used by the flow
- `loan_products`, `loan_product_guidelines`, and `loan_document_rules` so explanations, indicative guidance, and document checklists stay record-backed
- `loan_customers`, `loan_leads`, `loan_lead_profiles`, and `loan_status_history` for returning-customer, active-request, and status-check scenarios
- `loan_advisor_slots` for future advisor availability
- `loan_prequalification_runs`, `loan_appointments`, `loan_followup_jobs`, and `integration_outbox` for booked and follow-up-ready examples

Before running:

1. Replace the `tenant_id` placeholder at the top of the SQL file.
2. Run the inspection query in the SQL comments first so you know what already exists for that tenant.
3. Run it against the same PostgreSQL database used by the records runtime.
4. Keep the seeded mobile numbers, lead numbers, and slot IDs stable if you want repeatable demo behavior.

Suggested smoke checks after seeding:

1. Start with `I need a home loan around 40 lakhs` and use mobile `+919876543210` to hit the returning-customer flow.
2. Use `Existing Request Status` with `+919876543210` to load the seeded active home-loan enquiry timeline.
3. Use `Documents Required`, choose `Home Loan`, then `salaried` to confirm the checklist is coming from `loan_document_rules`.
4. Use `Book an Advisor` for a new personal-loan enquiry to confirm seeded advisor slots render in the appointment selector.
