# Seeding Demo Data

Use [seed-demo-education-records.sql](/C:/Users/prash/Desktop/AI-Projects/IMP/flow-generator/scripts/seed-demo-education-records.sql) to populate the generic FLOW records store with school and college admissions demo data.

What it seeds:

- `flow_record_schemas` entries for the education collections used by the flow
- `academic_years`, `campuses`, `program_offerings`, `admission_rules`, `fee_structures`, `scholarship_rules`, and `document_requirements`
- `guardians`, `applicants`, and `applicant_guardians` with parent-driven and self-applicant samples
- `applications` in multiple states: `payment_pending`, `documents_pending`, `submitted`, and `shortlisted`
- `application_documents`, `application_payments`, `admission_slots`, `admission_appointments`, and `application_status_history`

Before running:

1. Replace the `tenant_id` placeholder at the top of the SQL file.
2. Run the inspection query in the SQL comments first so you know what already exists for that tenant.
3. Run it against the same PostgreSQL database used by the records runtime.
4. Keep the seeded phone numbers, application IDs, programme IDs, and slot IDs stable if you want repeatable demo behavior.

Suggested smoke checks after seeding:

1. `Start Admission` with parent mobile `+919000011111` should find existing school applications.
2. `Continue Application` or `Upload Documents` for `+919000011111` should expose multiple applications and a missing-document scenario.
3. `Application Status` for `+919000033333` should show a submitted college application.
4. `Book Campus Visit` or `Book Counsellor Call` should return future slots for the selected campus.
