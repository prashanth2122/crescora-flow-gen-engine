# Seeding Demo Data

Use [seed-demo-insurance-records.sql](/C:/Users/prash/Desktop/AI-Projects/IMP/flow-generator/scripts/seed-demo-insurance-records.sql) to populate the generic FLOW records store with insurance demo data.

What it seeds:

- `flow_record_schemas` entries for the insurance collections used by the flow
- `insurance_customers`, `insurance_products`, and `policies` for health, motor, and travel policy lookup scenarios
- `claim_types` and `claim_document_rules` so checklist generation stays record-backed
- `claims`, `claim_requirements`, `claim_documents`, `claim_status_history`, and `claim_settlements` for submitted, pending-documents, approved, and sync-pending examples
- `service_requests`, `insurance_grievances`, and `integration_outbox` for post-sale service and exception handling

Before running:

1. Replace the `tenant_id` placeholder at the top of the SQL file.
2. Run the inspection query in the SQL comments first so you know what already exists for that tenant.
3. Run it against the same PostgreSQL database used by the records runtime.
4. Keep the seeded policy numbers, claim numbers, and mobile numbers stable if you want repeatable demo behavior.

Suggested smoke checks after seeding:

1. `My Policy Details` with mobile `+919000088881` should return multiple policies and require a direct 6-digit OTP.
2. `Start a New Claim` for `POL-HL-1001` should reach the hospitalization checklist backed by `claim_document_rules`.
3. `Track Claim Status` for `CLM-826419` should show the seeded timeline and the outstanding bank-proof request.
4. `Settlement / Payment Status` for `CLM-826120` should show the seeded approved amount and `processing` payment state.
5. `Upload Missing Documents` for `CLM-826419` should enter the pending-documents recovery path.
