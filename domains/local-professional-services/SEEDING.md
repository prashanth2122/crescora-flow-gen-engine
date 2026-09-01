# Seeding Demo Data

Use [seed-demo-local-professional-services-records.sql](/C:/Users/prash/Desktop/AI-Projects/IMP/flow-generator/scripts/seed-demo-local-professional-services-records.sql) to populate the generic FLOW records store with local and professional services demo data.

What it seeds:

- `flow_record_schemas` entries for the service-operations collections used by the flow
- `service_catalog` with maintained multi-industry service definitions
- `service_areas`, `service_customers`, and `service_customer_addresses` for customer and serviceability lookups
- `service_questions`, `service_availability_slots`, `service_workers`, and `service_slot_holds` for intake and scheduling
- `service_requests`, `service_bookings`, `service_assignments`, `service_payments`, `service_status_events`, `service_reminder_jobs`, `service_invoices`, `service_feedback`, and `service_complaints` for the lifecycle journeys

Before running:

1. Replace the `tenant_id` placeholder at the top of the SQL file.
2. Run it against the same PostgreSQL database used by the records runtime.
3. Keep the seeded phone numbers, booking IDs, slot IDs, and invoice IDs stable if you want repeatable demo behavior.

Date note:

- This demo seed is aligned to Tuesday, August 25, 2026.
- It includes both past completed jobs and future upcoming jobs so tracking, invoicing, balance collection, feedback, and reschedule/cancellation can all be exercised in the same environment.
