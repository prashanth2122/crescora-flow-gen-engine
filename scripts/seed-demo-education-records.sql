-- Education admissions demo seed for the FLOW record store.
-- This targets the generic records tables used by the `record` node runtime:
--   flow_record_schemas
--   flow_records
--   flow_record_indexes
--
-- How to run safely:
--   1. Replace the tenant_id value in the params CTE below.
--   2. Inspect current rows for that tenant before mutation:
--      SELECT "collection", COUNT(*)
--      FROM "flow_records"
--      WHERE "tenantId" = '8285edc4-af68-46c0-9e72-5b2819cb33d9'
--        AND "collection" IN (
--          'academic_years',
--          'campuses',
--          'program_offerings',
--          'admission_rules',
--          'fee_structures',
--          'scholarship_rules',
--          'document_requirements',
--          'guardians',
--          'applicants',
--          'applicant_guardians',
--          'applications',
--          'application_documents',
--          'application_payments',
--          'admission_slots',
--          'admission_appointments',
--          'application_status_history'
--        )
--      GROUP BY "collection"
--      ORDER BY "collection";
--   3. Run against the bot-code-zero PostgreSQL database.
--      This script writes to the shared `public` schema.
--      PowerShell example:
--      psql $env:DATABASE_URL -f .\scripts\seed-demo-education-records.sql
--
-- What this seed covers end to end:
--   - school and college programme discovery
--   - academic year and campus selection
--   - eligibility and fee lookup
--   - parent-driven and self-applicant lookup
--   - returning applications with multiple states
--   - document upload follow-up states
--   - campus visit and counsellor slot inventory
--   - submitted and payment-pending applications

BEGIN;

SET search_path TO public;

WITH params AS (
  SELECT
    '8285edc4-af68-46c0-9e72-5b2819cb33d9'::text AS tenant_id,
    'seed-demo-education-records'::text AS source_tag
),
schemas (collection, schema_json) AS (
  VALUES
    (
      'academic_years',
      '{
        "collection": "academic_years",
        "fields": {
          "academic_year_id": { "type": "string", "required": true, "unique": true },
          "label": { "type": "string", "required": true },
          "admission_open_from": { "type": "string", "required": false },
          "admission_close_on": { "type": "string", "required": false },
          "status": { "type": "string", "required": true }
        }
      }'::jsonb
    ),
    (
      'campuses',
      '{
        "collection": "campuses",
        "fields": {
          "campus_id": { "type": "string", "required": true, "unique": true },
          "campus_name": { "type": "string", "required": true },
          "city": { "type": "string", "required": false },
          "summary": { "type": "string", "required": false },
          "active": { "type": "boolean", "required": true }
        }
      }'::jsonb
    ),
    (
      'program_offerings',
      '{
        "collection": "program_offerings",
        "fields": {
          "program_offering_id": { "type": "string", "required": true, "unique": true },
          "academic_year_id": { "type": "string", "required": true },
          "campus_id": { "type": "string", "required": true },
          "program_name": { "type": "string", "required": true },
          "duration_label": { "type": "string", "required": false },
          "level": { "type": "string", "required": false },
          "eligibility_summary": { "type": "string", "required": false },
          "application_fee_amount_minor": { "type": "number", "required": false },
          "admission_status": { "type": "string", "required": true }
        }
      }'::jsonb
    ),
    (
      'admission_rules',
      '{
        "collection": "admission_rules",
        "fields": {
          "rule_id": { "type": "string", "required": true, "unique": true },
          "program_offering_id": { "type": "string", "required": true },
          "applicant_type": { "type": "string", "required": false },
          "admission_open": { "type": "boolean", "required": true },
          "age_min_years": { "type": "number", "required": false },
          "age_max_years": { "type": "number", "required": false },
          "minimum_percentage": { "type": "number", "required": false },
          "required_qualification": { "type": "string", "required": false },
          "required_subjects": { "type": "string", "required": false },
          "notes": { "type": "string", "required": false }
        }
      }'::jsonb
    ),
    (
      'fee_structures',
      '{
        "collection": "fee_structures",
        "fields": {
          "fee_structure_id": { "type": "string", "required": true, "unique": true },
          "program_offering_id": { "type": "string", "required": true },
          "academic_year_id": { "type": "string", "required": true },
          "tuition_fee_minor": { "type": "number", "required": false },
          "admission_fee_minor": { "type": "number", "required": false },
          "academic_fee_minor": { "type": "number", "required": false },
          "application_fee_amount_minor": { "type": "number", "required": false },
          "currency": { "type": "string", "required": true }
        }
      }'::jsonb
    ),
    (
      'scholarship_rules',
      '{
        "collection": "scholarship_rules",
        "fields": {
          "scholarship_rule_id": { "type": "string", "required": true, "unique": true },
          "program_offering_id": { "type": "string", "required": true },
          "scholarship_name": { "type": "string", "required": true },
          "minimum_percentage": { "type": "number", "required": false },
          "benefit_summary": { "type": "string", "required": false },
          "status": { "type": "string", "required": true }
        }
      }'::jsonb
    ),
    (
      'document_requirements',
      '{
        "collection": "document_requirements",
        "fields": {
          "requirement_id": { "type": "string", "required": true, "unique": true },
          "program_offering_id": { "type": "string", "required": true },
          "document_name": { "type": "string", "required": true },
          "required": { "type": "boolean", "required": true },
          "verification_method": { "type": "string", "required": false }
        }
      }'::jsonb
    ),
    (
      'guardians',
      '{
        "collection": "guardians",
        "fields": {
          "guardian_id": { "type": "string", "required": true, "unique": true },
          "guardian_name": { "type": "string", "required": true },
          "guardian_mobile": { "type": "phone", "required": true, "unique": true },
          "guardian_email": { "type": "email", "required": false },
          "relationship": { "type": "string", "required": false },
          "occupation": { "type": "string", "required": false },
          "alternate_mobile": { "type": "phone", "required": false }
        }
      }'::jsonb
    ),
    (
      'applicants',
      '{
        "collection": "applicants",
        "fields": {
          "applicant_id": { "type": "string", "required": true, "unique": true },
          "applicant_name": { "type": "string", "required": true },
          "applicant_mobile": { "type": "phone", "required": false },
          "applicant_email": { "type": "email", "required": false },
          "applicant_user_type": { "type": "string", "required": true },
          "date_of_birth": { "type": "string", "required": false },
          "gender": { "type": "string", "required": false },
          "address_line": { "type": "string", "required": false },
          "city": { "type": "string", "required": false },
          "state": { "type": "string", "required": false },
          "pin_code": { "type": "string", "required": false },
          "current_class": { "type": "string", "required": false },
          "desired_class": { "type": "string", "required": false },
          "current_school": { "type": "string", "required": false },
          "board_or_curriculum": { "type": "string", "required": false },
          "highest_qualification": { "type": "string", "required": false },
          "completion_year": { "type": "string", "required": false },
          "percentage_or_cgpa": { "type": "string", "required": false },
          "entrance_exam": { "type": "string", "required": false },
          "entrance_score": { "type": "string", "required": false }
        }
      }'::jsonb
    ),
    (
      'applicant_guardians',
      '{
        "collection": "applicant_guardians",
        "fields": {
          "relation_id": { "type": "string", "required": true, "unique": true },
          "applicant_id": { "type": "string", "required": true },
          "guardian_id": { "type": "string", "required": true },
          "relationship": { "type": "string", "required": false },
          "is_primary": { "type": "boolean", "required": true }
        }
      }'::jsonb
    ),
    (
      'applications',
      '{
        "collection": "applications",
        "fields": {
          "application_id": { "type": "string", "required": true, "unique": true },
          "application_number": { "type": "string", "required": true, "unique": true },
          "applicant_id": { "type": "string", "required": false },
          "guardian_id": { "type": "string", "required": false },
          "applicant_user_type": { "type": "string", "required": true },
          "contact_mobile": { "type": "phone", "required": true },
          "contact_email": { "type": "email", "required": false },
          "student_name": { "type": "string", "required": false },
          "guardian_name": { "type": "string", "required": false },
          "academic_year_id": { "type": "string", "required": true },
          "academic_year_label": { "type": "string", "required": false },
          "campus_id": { "type": "string", "required": true },
          "campus_name": { "type": "string", "required": false },
          "program_offering_id": { "type": "string", "required": true },
          "program_name": { "type": "string", "required": false },
          "status": { "type": "string", "required": true },
          "stage": { "type": "string", "required": true },
          "eligibility_status": { "type": "string", "required": false },
          "document_status": { "type": "string", "required": false },
          "payment_status": { "type": "string", "required": false },
          "application_fee_amount_minor": { "type": "number", "required": false },
          "application_fee_display": { "type": "string", "required": false }
        }
      }'::jsonb
    ),
    (
      'application_documents',
      '{
        "collection": "application_documents",
        "fields": {
          "application_document_id": { "type": "string", "required": true, "unique": true },
          "application_id": { "type": "string", "required": true },
          "requirement_id": { "type": "string", "required": false },
          "document_type": { "type": "string", "required": false },
          "upload_status": { "type": "string", "required": true },
          "processing_status": { "type": "string", "required": true },
          "verification_status": { "type": "string", "required": true },
          "extraction_status": { "type": "string", "required": false }
        }
      }'::jsonb
    ),
    (
      'application_payments',
      '{
        "collection": "application_payments",
        "fields": {
          "payment_id": { "type": "string", "required": true, "unique": true },
          "application_id": { "type": "string", "required": true },
          "amount": { "type": "number", "required": true },
          "currency": { "type": "string", "required": true },
          "provider": { "type": "string", "required": true },
          "provider_reference": { "type": "string", "required": false },
          "purpose": { "type": "string", "required": true },
          "status": { "type": "string", "required": true }
        }
      }'::jsonb
    ),
    (
      'admission_slots',
      '{
        "collection": "admission_slots",
        "fields": {
          "slot_id": { "type": "string", "required": true, "unique": true },
          "campus_id": { "type": "string", "required": true },
          "slot_type": { "type": "string", "required": true },
          "date": { "type": "string", "required": true },
          "start": { "type": "string", "required": true },
          "end": { "type": "string", "required": false },
          "label": { "type": "string", "required": true },
          "status": { "type": "string", "required": true }
        }
      }'::jsonb
    ),
    (
      'admission_appointments',
      '{
        "collection": "admission_appointments",
        "fields": {
          "appointment_id": { "type": "string", "required": true, "unique": true },
          "application_id": { "type": "string", "required": true },
          "slot_id": { "type": "string", "required": true },
          "appointment_type": { "type": "string", "required": true },
          "status": { "type": "string", "required": true },
          "scheduled_start_at": { "type": "string", "required": false },
          "scheduled_end_at": { "type": "string", "required": false }
        }
      }'::jsonb
    ),
    (
      'application_status_history',
      '{
        "collection": "application_status_history",
        "fields": {
          "history_id": { "type": "string", "required": true, "unique": true },
          "application_id": { "type": "string", "required": true },
          "from_status": { "type": "string", "required": false },
          "to_status": { "type": "string", "required": true },
          "reason_code": { "type": "string", "required": false }
        }
      }'::jsonb
    )
),
schema_upserts AS (
  INSERT INTO "flow_record_schemas" (
    "id",
    "tenantId",
    "collection",
    "schemaJson",
    "isActive",
    "createdAt",
    "updatedAt"
  )
  SELECT
    'schema:' || params.tenant_id || ':' || schemas.collection,
    params.tenant_id,
    schemas.collection,
    schemas.schema_json,
    true,
    NOW(),
    NOW()
  FROM params
  CROSS JOIN schemas
  ON CONFLICT ("tenantId", "collection") DO UPDATE
  SET
    "schemaJson" = EXCLUDED."schemaJson",
    "isActive" = true,
    "updatedAt" = NOW()
  RETURNING 1
),
seed_records (
  record_id,
  collection,
  unique_key_field,
  unique_key_value_normalized,
  data_json
) AS (
  VALUES
    (
      'seed_edu_ay_2026_27',
      'academic_years',
      'academic_year_id',
      'ay-2026-27',
      jsonb_build_object(
        'academic_year_id', 'AY-2026-27',
        'label', '2026-27',
        'admission_open_from', '2026-08-01',
        'admission_close_on', '2027-03-31',
        'status', 'active'
      )
    ),
    (
      'seed_edu_ay_2027_28',
      'academic_years',
      'academic_year_id',
      'ay-2027-28',
      jsonb_build_object(
        'academic_year_id', 'AY-2027-28',
        'label', '2027-28',
        'admission_open_from', '2027-07-15',
        'admission_close_on', '2028-03-31',
        'status', 'active'
      )
    ),
    (
      'seed_edu_campus_main',
      'campuses',
      'campus_id',
      'cmp-hyd-main',
      jsonb_build_object(
        'campus_id', 'CMP-HYD-MAIN',
        'campus_name', 'Main Campus',
        'city', 'Hyderabad',
        'summary', 'CBSE school and engineering programmes',
        'active', true
      )
    ),
    (
      'seed_edu_campus_north',
      'campuses',
      'campus_id',
      'cmp-hyd-north',
      jsonb_build_object(
        'campus_id', 'CMP-HYD-NORTH',
        'campus_name', 'North Campus',
        'city', 'Hyderabad',
        'summary', 'School admissions from primary to secondary levels',
        'active', true
      )
    ),
    (
      'seed_edu_campus_business',
      'campuses',
      'campus_id',
      'cmp-hyd-business',
      jsonb_build_object(
        'campus_id', 'CMP-HYD-BUSINESS',
        'campus_name', 'Business School Campus',
        'city', 'Hyderabad',
        'summary', 'Undergraduate and postgraduate commerce programmes',
        'active', true
      )
    ),
    (
      'seed_edu_prog_grade5',
      'program_offerings',
      'program_offering_id',
      'po-sch-g5-main-2627',
      jsonb_build_object(
        'program_offering_id', 'PO-SCH-G5-MAIN-2627',
        'academic_year_id', 'AY-2026-27',
        'campus_id', 'CMP-HYD-MAIN',
        'program_name', 'Grade 5',
        'duration_label', '1 Academic Year',
        'level', 'School',
        'eligibility_summary', 'Age-appropriate intake and previous class completion',
        'application_fee_amount_minor', 100000,
        'admission_status', 'open'
      )
    ),
    (
      'seed_edu_prog_grade8',
      'program_offerings',
      'program_offering_id',
      'po-sch-g8-north-2627',
      jsonb_build_object(
        'program_offering_id', 'PO-SCH-G8-NORTH-2627',
        'academic_year_id', 'AY-2026-27',
        'campus_id', 'CMP-HYD-NORTH',
        'program_name', 'Grade 8',
        'duration_label', '1 Academic Year',
        'level', 'School',
        'eligibility_summary', 'Age-appropriate intake and previous class progression',
        'application_fee_amount_minor', 100000,
        'admission_status', 'open'
      )
    ),
    (
      'seed_edu_prog_btech',
      'program_offerings',
      'program_offering_id',
      'po-col-btech-cse-main-2627',
      jsonb_build_object(
        'program_offering_id', 'PO-COL-BTECH-CSE-MAIN-2627',
        'academic_year_id', 'AY-2026-27',
        'campus_id', 'CMP-HYD-MAIN',
        'program_name', 'B.Tech - Computer Science',
        'duration_label', '4 Years',
        'level', 'Undergraduate',
        'eligibility_summary', '10+2 with mathematics, physics, and qualifying academic score',
        'application_fee_amount_minor', 150000,
        'admission_status', 'open'
      )
    ),
    (
      'seed_edu_prog_bba',
      'program_offerings',
      'program_offering_id',
      'po-col-bba-business-2627',
      jsonb_build_object(
        'program_offering_id', 'PO-COL-BBA-BUSINESS-2627',
        'academic_year_id', 'AY-2026-27',
        'campus_id', 'CMP-HYD-BUSINESS',
        'program_name', 'BBA',
        'duration_label', '3 Years',
        'level', 'Undergraduate',
        'eligibility_summary', '10+2 with minimum academic threshold',
        'application_fee_amount_minor', 125000,
        'admission_status', 'open'
      )
    ),
    (
      'seed_edu_prog_mba',
      'program_offerings',
      'program_offering_id',
      'po-col-mba-business-2728',
      jsonb_build_object(
        'program_offering_id', 'PO-COL-MBA-BUSINESS-2728',
        'academic_year_id', 'AY-2027-28',
        'campus_id', 'CMP-HYD-BUSINESS',
        'program_name', 'MBA',
        'duration_label', '2 Years',
        'level', 'Postgraduate',
        'eligibility_summary', 'Bachelor degree and qualifying academic profile',
        'application_fee_amount_minor', 200000,
        'admission_status', 'open'
      )
    ),
    (
      'seed_edu_rule_grade5',
      'admission_rules',
      'rule_id',
      'rule-grade5-main-2627',
      jsonb_build_object(
        'rule_id', 'RULE-GRADE5-MAIN-2627',
        'program_offering_id', 'PO-SCH-G5-MAIN-2627',
        'applicant_type', 'parent',
        'admission_open', true,
        'age_min_years', 9,
        'age_max_years', 11,
        'minimum_percentage', 0,
        'required_qualification', 'Completed previous class',
        'required_subjects', '',
        'notes', 'Age and prior class progression must satisfy the maintained school admission policy.'
      )
    ),
    (
      'seed_edu_rule_grade8',
      'admission_rules',
      'rule_id',
      'rule-grade8-north-2627',
      jsonb_build_object(
        'rule_id', 'RULE-GRADE8-NORTH-2627',
        'program_offering_id', 'PO-SCH-G8-NORTH-2627',
        'applicant_type', 'parent',
        'admission_open', true,
        'age_min_years', 12,
        'age_max_years', 14,
        'minimum_percentage', 0,
        'required_qualification', 'Completed previous class',
        'required_subjects', '',
        'notes', 'Grade 8 requires an age-appropriate school transfer and prior class completion.'
      )
    ),
    (
      'seed_edu_rule_btech',
      'admission_rules',
      'rule_id',
      'rule-btech-main-2627',
      jsonb_build_object(
        'rule_id', 'RULE-BTECH-MAIN-2627',
        'program_offering_id', 'PO-COL-BTECH-CSE-MAIN-2627',
        'applicant_type', 'student',
        'admission_open', true,
        'age_min_years', 0,
        'age_max_years', 0,
        'minimum_percentage', 65,
        'required_qualification', '10+2',
        'required_subjects', 'Mathematics, Physics',
        'notes', 'B.Tech CSE requires 10+2 with Mathematics and Physics plus the maintained minimum score.'
      )
    ),
    (
      'seed_edu_rule_bba',
      'admission_rules',
      'rule_id',
      'rule-bba-business-2627',
      jsonb_build_object(
        'rule_id', 'RULE-BBA-BUSINESS-2627',
        'program_offering_id', 'PO-COL-BBA-BUSINESS-2627',
        'applicant_type', 'student',
        'admission_open', true,
        'age_min_years', 0,
        'age_max_years', 0,
        'minimum_percentage', 50,
        'required_qualification', '10+2',
        'required_subjects', '',
        'notes', 'BBA requires 10+2 completion and the maintained minimum academic percentage.'
      )
    ),
    (
      'seed_edu_fee_grade5',
      'fee_structures',
      'fee_structure_id',
      'fee-grade5-main-2627',
      jsonb_build_object(
        'fee_structure_id', 'FEE-GRADE5-MAIN-2627',
        'program_offering_id', 'PO-SCH-G5-MAIN-2627',
        'academic_year_id', 'AY-2026-27',
        'tuition_fee_minor', 3250000,
        'admission_fee_minor', 350000,
        'academic_fee_minor', 125000,
        'application_fee_amount_minor', 100000,
        'currency', 'INR'
      )
    ),
    (
      'seed_edu_fee_grade8',
      'fee_structures',
      'fee_structure_id',
      'fee-grade8-north-2627',
      jsonb_build_object(
        'fee_structure_id', 'FEE-GRADE8-NORTH-2627',
        'program_offering_id', 'PO-SCH-G8-NORTH-2627',
        'academic_year_id', 'AY-2026-27',
        'tuition_fee_minor', 3650000,
        'admission_fee_minor', 400000,
        'academic_fee_minor', 150000,
        'application_fee_amount_minor', 100000,
        'currency', 'INR'
      )
    ),
    (
      'seed_edu_fee_btech',
      'fee_structures',
      'fee_structure_id',
      'fee-btech-main-2627',
      jsonb_build_object(
        'fee_structure_id', 'FEE-BTECH-MAIN-2627',
        'program_offering_id', 'PO-COL-BTECH-CSE-MAIN-2627',
        'academic_year_id', 'AY-2026-27',
        'tuition_fee_minor', 12000000,
        'admission_fee_minor', 1500000,
        'academic_fee_minor', 1000000,
        'application_fee_amount_minor', 150000,
        'currency', 'INR'
      )
    ),
    (
      'seed_edu_fee_bba',
      'fee_structures',
      'fee_structure_id',
      'fee-bba-business-2627',
      jsonb_build_object(
        'fee_structure_id', 'FEE-BBA-BUSINESS-2627',
        'program_offering_id', 'PO-COL-BBA-BUSINESS-2627',
        'academic_year_id', 'AY-2026-27',
        'tuition_fee_minor', 7800000,
        'admission_fee_minor', 1000000,
        'academic_fee_minor', 600000,
        'application_fee_amount_minor', 125000,
        'currency', 'INR'
      )
    ),
    (
      'seed_edu_scholar_btech_merit',
      'scholarship_rules',
      'scholarship_rule_id',
      'sch-btech-merit-90',
      jsonb_build_object(
        'scholarship_rule_id', 'SCH-BTECH-MERIT-90',
        'program_offering_id', 'PO-COL-BTECH-CSE-MAIN-2627',
        'scholarship_name', 'Merit Scholarship 90+',
        'minimum_percentage', 90,
        'benefit_summary', 'Up to 20 percent tuition support after verification',
        'status', 'active'
      )
    ),
    (
      'seed_edu_scholar_bba_merit',
      'scholarship_rules',
      'scholarship_rule_id',
      'sch-bba-merit-85',
      jsonb_build_object(
        'scholarship_rule_id', 'SCH-BBA-MERIT-85',
        'program_offering_id', 'PO-COL-BBA-BUSINESS-2627',
        'scholarship_name', 'Academic Excellence Scholarship',
        'minimum_percentage', 85,
        'benefit_summary', 'Fee concession subject to admissions committee approval',
        'status', 'active'
      )
    ),
    (
      'seed_edu_doc_grade5_birth',
      'document_requirements',
      'requirement_id',
      'req-grade5-birth',
      jsonb_build_object(
        'requirement_id', 'REQ-GRADE5-BIRTH',
        'program_offering_id', 'PO-SCH-G5-MAIN-2627',
        'document_name', 'Birth Certificate',
        'required', true,
        'verification_method', 'ocr_and_manual_review'
      )
    ),
    (
      'seed_edu_doc_grade5_report',
      'document_requirements',
      'requirement_id',
      'req-grade5-report',
      jsonb_build_object(
        'requirement_id', 'REQ-GRADE5-REPORT',
        'program_offering_id', 'PO-SCH-G5-MAIN-2627',
        'document_name', 'Previous School Report Card',
        'required', true,
        'verification_method', 'ocr_and_manual_review'
      )
    ),
    (
      'seed_edu_doc_grade5_address',
      'document_requirements',
      'requirement_id',
      'req-grade5-address',
      jsonb_build_object(
        'requirement_id', 'REQ-GRADE5-ADDRESS',
        'program_offering_id', 'PO-SCH-G5-MAIN-2627',
        'document_name', 'Address Proof',
        'required', true,
        'verification_method', 'manual_review'
      )
    ),
    (
      'seed_edu_doc_grade8_tc',
      'document_requirements',
      'requirement_id',
      'req-grade8-tc',
      jsonb_build_object(
        'requirement_id', 'REQ-GRADE8-TC',
        'program_offering_id', 'PO-SCH-G8-NORTH-2627',
        'document_name', 'Transfer Certificate',
        'required', true,
        'verification_method', 'manual_review'
      )
    ),
    (
      'seed_edu_doc_grade8_marks',
      'document_requirements',
      'requirement_id',
      'req-grade8-marks',
      jsonb_build_object(
        'requirement_id', 'REQ-GRADE8-MARKS',
        'program_offering_id', 'PO-SCH-G8-NORTH-2627',
        'document_name', 'Previous Marks Memo',
        'required', true,
        'verification_method', 'ocr_and_manual_review'
      )
    ),
    (
      'seed_edu_doc_btech_10th',
      'document_requirements',
      'requirement_id',
      'req-btech-10th',
      jsonb_build_object(
        'requirement_id', 'REQ-BTECH-10TH',
        'program_offering_id', 'PO-COL-BTECH-CSE-MAIN-2627',
        'document_name', '10th Marks Memo',
        'required', true,
        'verification_method', 'ocr_and_manual_review'
      )
    ),
    (
      'seed_edu_doc_btech_12th',
      'document_requirements',
      'requirement_id',
      'req-btech-12th',
      jsonb_build_object(
        'requirement_id', 'REQ-BTECH-12TH',
        'program_offering_id', 'PO-COL-BTECH-CSE-MAIN-2627',
        'document_name', '12th Marks Memo',
        'required', true,
        'verification_method', 'ocr_and_manual_review'
      )
    ),
    (
      'seed_edu_doc_btech_score',
      'document_requirements',
      'requirement_id',
      'req-btech-scorecard',
      jsonb_build_object(
        'requirement_id', 'REQ-BTECH-SCORECARD',
        'program_offering_id', 'PO-COL-BTECH-CSE-MAIN-2627',
        'document_name', 'Entrance Exam Scorecard',
        'required', true,
        'verification_method', 'ocr_and_manual_review'
      )
    ),
    (
      'seed_edu_doc_bba_12th',
      'document_requirements',
      'requirement_id',
      'req-bba-12th',
      jsonb_build_object(
        'requirement_id', 'REQ-BBA-12TH',
        'program_offering_id', 'PO-COL-BBA-BUSINESS-2627',
        'document_name', '12th Marks Memo',
        'required', true,
        'verification_method', 'ocr_and_manual_review'
      )
    ),
    (
      'seed_edu_doc_bba_id',
      'document_requirements',
      'requirement_id',
      'req-bba-idproof',
      jsonb_build_object(
        'requirement_id', 'REQ-BBA-IDPROOF',
        'program_offering_id', 'PO-COL-BBA-BUSINESS-2627',
        'document_name', 'Government ID Proof',
        'required', true,
        'verification_method', 'manual_review'
      )
    ),
    (
      'seed_edu_guardian_rajesh',
      'guardians',
      'guardian_id',
      'grd-0001',
      jsonb_build_object(
        'guardian_id', 'GRD-0001',
        'guardian_name', 'Rajesh Sharma',
        'guardian_mobile', '+919000011111',
        'guardian_email', 'rajesh.sharma@example.edu',
        'relationship', 'Father',
        'occupation', 'Operations Manager',
        'alternate_mobile', '+919000011112'
      )
    ),
    (
      'seed_edu_guardian_sneha',
      'guardians',
      'guardian_id',
      'grd-0002',
      jsonb_build_object(
        'guardian_id', 'GRD-0002',
        'guardian_name', 'Sneha Patel',
        'guardian_mobile', '+919000022222',
        'guardian_email', 'sneha.patel@example.edu',
        'relationship', 'Mother',
        'occupation', 'Chartered Accountant',
        'alternate_mobile', '+919000022223'
      )
    ),
    (
      'seed_edu_applicant_aarav',
      'applicants',
      'applicant_id',
      'app-adm-2026-000101',
      jsonb_build_object(
        'applicant_id', 'APP-ADM-2026-000101',
        'applicant_name', 'Aarav Sharma',
        'applicant_mobile', '',
        'applicant_email', 'rajesh.sharma@example.edu',
        'applicant_user_type', 'parent',
        'date_of_birth', '2016-05-12',
        'gender', 'male',
        'address_line', 'Miyapur, Hyderabad',
        'city', 'Hyderabad',
        'state', 'Telangana',
        'pin_code', '500049',
        'current_class', 'Grade 4',
        'desired_class', 'Grade 5',
        'current_school', 'Little Scholars School',
        'board_or_curriculum', 'CBSE',
        'highest_qualification', '',
        'completion_year', '',
        'percentage_or_cgpa', '',
        'entrance_exam', '',
        'entrance_score', ''
      )
    ),
    (
      'seed_edu_applicant_diya',
      'applicants',
      'applicant_id',
      'app-adm-2026-000102',
      jsonb_build_object(
        'applicant_id', 'APP-ADM-2026-000102',
        'applicant_name', 'Diya Sharma',
        'applicant_mobile', '',
        'applicant_email', 'rajesh.sharma@example.edu',
        'applicant_user_type', 'parent',
        'date_of_birth', '2013-09-22',
        'gender', 'female',
        'address_line', 'Miyapur, Hyderabad',
        'city', 'Hyderabad',
        'state', 'Telangana',
        'pin_code', '500049',
        'current_class', 'Grade 7',
        'desired_class', 'Grade 8',
        'current_school', 'Little Scholars School',
        'board_or_curriculum', 'CBSE',
        'highest_qualification', '',
        'completion_year', '',
        'percentage_or_cgpa', '',
        'entrance_exam', '',
        'entrance_score', ''
      )
    ),
    (
      'seed_edu_applicant_nikhil',
      'applicants',
      'applicant_id',
      'app-adm-2026-000201',
      jsonb_build_object(
        'applicant_id', 'APP-ADM-2026-000201',
        'applicant_name', 'Nikhil Rao',
        'applicant_mobile', '+919000033333',
        'applicant_email', 'nikhil.rao@example.edu',
        'applicant_user_type', 'student',
        'date_of_birth', '2008-01-15',
        'gender', 'male',
        'address_line', 'Kondapur, Hyderabad',
        'city', 'Hyderabad',
        'state', 'Telangana',
        'pin_code', '500084',
        'current_class', '',
        'desired_class', '',
        'current_school', 'Sri Chaitanya Junior College',
        'board_or_curriculum', 'State Board',
        'highest_qualification', '10+2',
        'completion_year', '2026',
        'percentage_or_cgpa', '92',
        'entrance_exam', 'EAMCET',
        'entrance_score', '1180'
      )
    ),
    (
      'seed_edu_applicant_sana',
      'applicants',
      'applicant_id',
      'app-adm-2026-000202',
      jsonb_build_object(
        'applicant_id', 'APP-ADM-2026-000202',
        'applicant_name', 'Sana Iqbal',
        'applicant_mobile', '+919000044444',
        'applicant_email', 'sana.iqbal@example.edu',
        'applicant_user_type', 'student',
        'date_of_birth', '2007-11-04',
        'gender', 'female',
        'address_line', 'Gachibowli, Hyderabad',
        'city', 'Hyderabad',
        'state', 'Telangana',
        'pin_code', '500032',
        'current_class', '',
        'desired_class', '',
        'current_school', 'Meridian Junior College',
        'board_or_curriculum', 'CBSE',
        'highest_qualification', '10+2',
        'completion_year', '2026',
        'percentage_or_cgpa', '87',
        'entrance_exam', '',
        'entrance_score', ''
      )
    ),
    (
      'seed_edu_link_aarav_rajesh',
      'applicant_guardians',
      'relation_id',
      'rel-adm-2026-000101',
      jsonb_build_object(
        'relation_id', 'REL-ADM-2026-000101',
        'applicant_id', 'APP-ADM-2026-000101',
        'guardian_id', 'GRD-0001',
        'relationship', 'Father',
        'is_primary', true
      )
    ),
    (
      'seed_edu_link_diya_rajesh',
      'applicant_guardians',
      'relation_id',
      'rel-adm-2026-000102',
      jsonb_build_object(
        'relation_id', 'REL-ADM-2026-000102',
        'applicant_id', 'APP-ADM-2026-000102',
        'guardian_id', 'GRD-0001',
        'relationship', 'Father',
        'is_primary', true
      )
    ),
    (
      'seed_edu_app_aarav',
      'applications',
      'application_id',
      'adm-2026-000101',
      jsonb_build_object(
        'application_id', 'ADM-2026-000101',
        'application_number', 'ADM-2026-000101',
        'applicant_id', 'APP-ADM-2026-000101',
        'guardian_id', 'GRD-0001',
        'applicant_user_type', 'parent',
        'contact_mobile', '+919000011111',
        'contact_email', 'rajesh.sharma@example.edu',
        'student_name', 'Aarav Sharma',
        'guardian_name', 'Rajesh Sharma',
        'academic_year_id', 'AY-2026-27',
        'academic_year_label', '2026-27',
        'campus_id', 'CMP-HYD-MAIN',
        'campus_name', 'Main Campus',
        'program_offering_id', 'PO-SCH-G5-MAIN-2627',
        'program_name', 'Grade 5',
        'status', 'payment_pending',
        'stage', 'payment_pending',
        'eligibility_status', 'eligible',
        'document_status', 'documents_received',
        'payment_status', 'pending',
        'application_fee_amount_minor', 100000,
        'application_fee_display', 'INR 1,000'
      )
    ),
    (
      'seed_edu_app_diya',
      'applications',
      'application_id',
      'adm-2026-000102',
      jsonb_build_object(
        'application_id', 'ADM-2026-000102',
        'application_number', 'ADM-2026-000102',
        'applicant_id', 'APP-ADM-2026-000102',
        'guardian_id', 'GRD-0001',
        'applicant_user_type', 'parent',
        'contact_mobile', '+919000011111',
        'contact_email', 'rajesh.sharma@example.edu',
        'student_name', 'Diya Sharma',
        'guardian_name', 'Rajesh Sharma',
        'academic_year_id', 'AY-2026-27',
        'academic_year_label', '2026-27',
        'campus_id', 'CMP-HYD-NORTH',
        'campus_name', 'North Campus',
        'program_offering_id', 'PO-SCH-G8-NORTH-2627',
        'program_name', 'Grade 8',
        'status', 'documents_pending',
        'stage', 'documents_pending',
        'eligibility_status', 'eligible',
        'document_status', 'needs_reupload',
        'payment_status', 'pending',
        'application_fee_amount_minor', 100000,
        'application_fee_display', 'INR 1,000'
      )
    ),
    (
      'seed_edu_app_nikhil',
      'applications',
      'application_id',
      'adm-2026-000201',
      jsonb_build_object(
        'application_id', 'ADM-2026-000201',
        'application_number', 'ADM-2026-000201',
        'applicant_id', 'APP-ADM-2026-000201',
        'guardian_id', '',
        'applicant_user_type', 'student',
        'contact_mobile', '+919000033333',
        'contact_email', 'nikhil.rao@example.edu',
        'student_name', 'Nikhil Rao',
        'guardian_name', '',
        'academic_year_id', 'AY-2026-27',
        'academic_year_label', '2026-27',
        'campus_id', 'CMP-HYD-MAIN',
        'campus_name', 'Main Campus',
        'program_offering_id', 'PO-COL-BTECH-CSE-MAIN-2627',
        'program_name', 'B.Tech - Computer Science',
        'status', 'submitted',
        'stage', 'submitted',
        'eligibility_status', 'eligible',
        'document_status', 'documents_received',
        'payment_status', 'paid',
        'application_fee_amount_minor', 150000,
        'application_fee_display', 'INR 1,500'
      )
    ),
    (
      'seed_edu_app_sana',
      'applications',
      'application_id',
      'adm-2026-000202',
      jsonb_build_object(
        'application_id', 'ADM-2026-000202',
        'application_number', 'ADM-2026-000202',
        'applicant_id', 'APP-ADM-2026-000202',
        'guardian_id', '',
        'applicant_user_type', 'student',
        'contact_mobile', '+919000044444',
        'contact_email', 'sana.iqbal@example.edu',
        'student_name', 'Sana Iqbal',
        'guardian_name', '',
        'academic_year_id', 'AY-2026-27',
        'academic_year_label', '2026-27',
        'campus_id', 'CMP-HYD-BUSINESS',
        'campus_name', 'Business School Campus',
        'program_offering_id', 'PO-COL-BBA-BUSINESS-2627',
        'program_name', 'BBA',
        'status', 'shortlisted',
        'stage', 'shortlisted',
        'eligibility_status', 'eligible',
        'document_status', 'documents_received',
        'payment_status', 'paid',
        'application_fee_amount_minor', 125000,
        'application_fee_display', 'INR 1,250'
      )
    ),
    (
      'seed_edu_docrec_aarav',
      'application_documents',
      'application_document_id',
      'doc-adm-2026-000101',
      jsonb_build_object(
        'application_document_id', 'DOC-ADM-2026-000101',
        'application_id', 'ADM-2026-000101',
        'requirement_id', 'REQ-GRADE5-REPORT',
        'document_type', 'school_document_bundle',
        'upload_status', 'uploaded',
        'processing_status', 'processed',
        'verification_status', 'verified',
        'extraction_status', 'completed'
      )
    ),
    (
      'seed_edu_docrec_diya',
      'application_documents',
      'application_document_id',
      'doc-adm-2026-000102',
      jsonb_build_object(
        'application_document_id', 'DOC-ADM-2026-000102',
        'application_id', 'ADM-2026-000102',
        'requirement_id', 'REQ-GRADE8-TC',
        'document_type', 'school_document_bundle',
        'upload_status', 'uploaded',
        'processing_status', 'processed',
        'verification_status', 'needs_reupload',
        'extraction_status', 'retry_required'
      )
    ),
    (
      'seed_edu_docrec_nikhil',
      'application_documents',
      'application_document_id',
      'doc-adm-2026-000201',
      jsonb_build_object(
        'application_document_id', 'DOC-ADM-2026-000201',
        'application_id', 'ADM-2026-000201',
        'requirement_id', 'REQ-BTECH-12TH',
        'document_type', 'college_document_bundle',
        'upload_status', 'uploaded',
        'processing_status', 'processed',
        'verification_status', 'verified',
        'extraction_status', 'completed'
      )
    ),
    (
      'seed_edu_payment_aarav',
      'application_payments',
      'payment_id',
      'pay-adm-2026-000101',
      jsonb_build_object(
        'payment_id', 'PAY-ADM-2026-000101',
        'application_id', 'ADM-2026-000101',
        'amount', 100000,
        'currency', 'INR',
        'provider', 'razorpay',
        'provider_reference', '',
        'purpose', 'application_fee',
        'status', 'pending'
      )
    ),
    (
      'seed_edu_payment_nikhil',
      'application_payments',
      'payment_id',
      'pay-adm-2026-000201',
      jsonb_build_object(
        'payment_id', 'PAY-ADM-2026-000201',
        'application_id', 'ADM-2026-000201',
        'amount', 150000,
        'currency', 'INR',
        'provider', 'razorpay',
        'provider_reference', 'pay_NIKHIL_001',
        'purpose', 'application_fee',
        'status', 'paid'
      )
    ),
    (
      'seed_edu_payment_sana',
      'application_payments',
      'payment_id',
      'pay-adm-2026-000202',
      jsonb_build_object(
        'payment_id', 'PAY-ADM-2026-000202',
        'application_id', 'ADM-2026-000202',
        'amount', 125000,
        'currency', 'INR',
        'provider', 'razorpay',
        'provider_reference', 'pay_SANA_001',
        'purpose', 'application_fee',
        'status', 'paid'
      )
    ),
    (
      'seed_edu_slot_main_visit_1',
      'admission_slots',
      'slot_id',
      'slot-main-visit-2026-08-27-1000',
      jsonb_build_object(
        'slot_id', 'SLOT-MAIN-VISIT-2026-08-27-1000',
        'campus_id', 'CMP-HYD-MAIN',
        'slot_type', 'campus_visit',
        'date', '2026-08-27',
        'start', '10:00',
        'end', '10:45',
        'label', '27 Aug 2026 10:00 AM',
        'status', 'available'
      )
    ),
    (
      'seed_edu_slot_main_visit_2',
      'admission_slots',
      'slot_id',
      'slot-main-visit-2026-08-27-1130',
      jsonb_build_object(
        'slot_id', 'SLOT-MAIN-VISIT-2026-08-27-1130',
        'campus_id', 'CMP-HYD-MAIN',
        'slot_type', 'campus_visit',
        'date', '2026-08-27',
        'start', '11:30',
        'end', '12:15',
        'label', '27 Aug 2026 11:30 AM',
        'status', 'available'
      )
    ),
    (
      'seed_edu_slot_main_visit_booked',
      'admission_slots',
      'slot_id',
      'slot-main-visit-2026-08-28-1100',
      jsonb_build_object(
        'slot_id', 'SLOT-MAIN-VISIT-2026-08-28-1100',
        'campus_id', 'CMP-HYD-MAIN',
        'slot_type', 'campus_visit',
        'date', '2026-08-28',
        'start', '11:00',
        'end', '11:45',
        'label', '28 Aug 2026 11:00 AM',
        'status', 'booked'
      )
    ),
    (
      'seed_edu_slot_main_call_1',
      'admission_slots',
      'slot_id',
      'slot-main-call-2026-08-27-1700',
      jsonb_build_object(
        'slot_id', 'SLOT-MAIN-CALL-2026-08-27-1700',
        'campus_id', 'CMP-HYD-MAIN',
        'slot_type', 'counsellor_call',
        'date', '2026-08-27',
        'start', '17:00',
        'end', '17:45',
        'label', '27 Aug 2026 5:00 PM',
        'status', 'available'
      )
    ),
    (
      'seed_edu_slot_north_visit_1',
      'admission_slots',
      'slot_id',
      'slot-north-visit-2026-08-28-1400',
      jsonb_build_object(
        'slot_id', 'SLOT-NORTH-VISIT-2026-08-28-1400',
        'campus_id', 'CMP-HYD-NORTH',
        'slot_type', 'campus_visit',
        'date', '2026-08-28',
        'start', '14:00',
        'end', '14:45',
        'label', '28 Aug 2026 2:00 PM',
        'status', 'available'
      )
    ),
    (
      'seed_edu_slot_north_call_1',
      'admission_slots',
      'slot_id',
      'slot-north-call-2026-08-29-1030',
      jsonb_build_object(
        'slot_id', 'SLOT-NORTH-CALL-2026-08-29-1030',
        'campus_id', 'CMP-HYD-NORTH',
        'slot_type', 'counsellor_call',
        'date', '2026-08-29',
        'start', '10:30',
        'end', '11:15',
        'label', '29 Aug 2026 10:30 AM',
        'status', 'available'
      )
    ),
    (
      'seed_edu_slot_business_call_1',
      'admission_slots',
      'slot_id',
      'slot-business-call-2026-08-30-1600',
      jsonb_build_object(
        'slot_id', 'SLOT-BUSINESS-CALL-2026-08-30-1600',
        'campus_id', 'CMP-HYD-BUSINESS',
        'slot_type', 'counsellor_call',
        'date', '2026-08-30',
        'start', '16:00',
        'end', '16:45',
        'label', '30 Aug 2026 4:00 PM',
        'status', 'available'
      )
    ),
    (
      'seed_edu_appt_nikhil',
      'admission_appointments',
      'appointment_id',
      'apt-adm-2026-000201',
      jsonb_build_object(
        'appointment_id', 'APT-ADM-2026-000201',
        'application_id', 'ADM-2026-000201',
        'slot_id', 'SLOT-MAIN-VISIT-2026-08-28-1100',
        'appointment_type', 'campus_visit',
        'status', 'confirmed',
        'scheduled_start_at', '2026-08-28 11:00',
        'scheduled_end_at', '2026-08-28 11:45'
      )
    ),
    (
      'seed_edu_appt_sana',
      'admission_appointments',
      'appointment_id',
      'apt-adm-2026-000202',
      jsonb_build_object(
        'appointment_id', 'APT-ADM-2026-000202',
        'application_id', 'ADM-2026-000202',
        'slot_id', 'SLOT-BUSINESS-CALL-2026-08-30-1600',
        'appointment_type', 'counsellor_call',
        'status', 'confirmed',
        'scheduled_start_at', '2026-08-30 16:00',
        'scheduled_end_at', '2026-08-30 16:45'
      )
    ),
    (
      'seed_edu_hist_aarav_draft',
      'application_status_history',
      'history_id',
      'hist-adm-2026-000101-draft',
      jsonb_build_object(
        'history_id', 'HIST-ADM-2026-000101-DRAFT',
        'application_id', 'ADM-2026-000101',
        'from_status', '',
        'to_status', 'draft',
        'reason_code', 'draft_created'
      )
    ),
    (
      'seed_edu_hist_aarav_profile',
      'application_status_history',
      'history_id',
      'hist-adm-2026-000101-profile',
      jsonb_build_object(
        'history_id', 'HIST-ADM-2026-000101-PROFILE',
        'application_id', 'ADM-2026-000101',
        'from_status', 'draft',
        'to_status', 'profile_completed',
        'reason_code', 'details_saved'
      )
    ),
    (
      'seed_edu_hist_aarav_payment_pending',
      'application_status_history',
      'history_id',
      'hist-adm-2026-000101-payment-pending',
      jsonb_build_object(
        'history_id', 'HIST-ADM-2026-000101-PAYMENT-PENDING',
        'application_id', 'ADM-2026-000101',
        'from_status', 'documents_received',
        'to_status', 'payment_pending',
        'reason_code', 'payment_not_completed'
      )
    ),
    (
      'seed_edu_hist_diya_draft',
      'application_status_history',
      'history_id',
      'hist-adm-2026-000102-draft',
      jsonb_build_object(
        'history_id', 'HIST-ADM-2026-000102-DRAFT',
        'application_id', 'ADM-2026-000102',
        'from_status', '',
        'to_status', 'draft',
        'reason_code', 'draft_created'
      )
    ),
    (
      'seed_edu_hist_diya_docs_pending',
      'application_status_history',
      'history_id',
      'hist-adm-2026-000102-docs',
      jsonb_build_object(
        'history_id', 'HIST-ADM-2026-000102-DOCS',
        'application_id', 'ADM-2026-000102',
        'from_status', 'profile_completed',
        'to_status', 'documents_pending',
        'reason_code', 'documents_missing'
      )
    ),
    (
      'seed_edu_hist_nikhil_submitted',
      'application_status_history',
      'history_id',
      'hist-adm-2026-000201-submitted',
      jsonb_build_object(
        'history_id', 'HIST-ADM-2026-000201-SUBMITTED',
        'application_id', 'ADM-2026-000201',
        'from_status', 'payment_pending',
        'to_status', 'submitted',
        'reason_code', 'application_fee_paid'
      )
    ),
    (
      'seed_edu_hist_sana_shortlisted',
      'application_status_history',
      'history_id',
      'hist-adm-2026-000202-shortlisted',
      jsonb_build_object(
        'history_id', 'HIST-ADM-2026-000202-SHORTLISTED',
        'application_id', 'ADM-2026-000202',
        'from_status', 'submitted',
        'to_status', 'shortlisted',
        'reason_code', 'review_completed'
      )
    )
),
upsert_records AS (
  INSERT INTO "flow_records" (
    "id",
    "tenantId",
    "collection",
    "dataJson",
    "uniqueKeyField",
    "uniqueKeyValueNormalized",
    "version",
    "createdByConversationId",
    "updatedByConversationId",
    "deletedAt",
    "createdAt",
    "updatedAt"
  )
  SELECT
    seed_records.record_id,
    params.tenant_id,
    seed_records.collection,
    seed_records.data_json,
    seed_records.unique_key_field,
    seed_records.unique_key_value_normalized,
    1,
    params.source_tag,
    params.source_tag,
    NULL,
    NOW(),
    NOW()
  FROM seed_records
  CROSS JOIN params
  ON CONFLICT ("tenantId", "collection", "uniqueKeyField", "uniqueKeyValueNormalized") DO UPDATE
  SET
    "dataJson" = EXCLUDED."dataJson",
    "updatedByConversationId" = EXCLUDED."updatedByConversationId",
    "deletedAt" = NULL,
    "updatedAt" = NOW(),
    "version" = "flow_records"."version" + 1
  RETURNING 1
),
matched_records AS (
  SELECT
    fr."id" AS record_id,
    fr."collection" AS collection,
    fr."dataJson" AS data_json
  FROM "flow_records" fr
  JOIN params
    ON params.tenant_id = fr."tenantId"
  JOIN seed_records sr
    ON sr.collection = fr."collection"
   AND sr.unique_key_field = fr."uniqueKeyField"
   AND sr.unique_key_value_normalized = fr."uniqueKeyValueNormalized"
),
deleted_indexes AS (
  DELETE FROM "flow_record_indexes"
  WHERE "recordId" IN (SELECT record_id FROM matched_records)
  RETURNING 1
),
index_rows AS (
  SELECT
    mr.record_id,
    mr.collection,
    kv.key AS field_name,
    CASE
      WHEN jsonb_typeof(kv.value) = 'string' THEN trim(both '"' from kv.value::text)
      ELSE kv.value::text
    END AS value_text,
    CASE
      WHEN kv.key IN (
        'guardian_mobile',
        'alternate_mobile',
        'applicant_mobile',
        'contact_mobile'
      )
        THEN
          CASE
            WHEN right(regexp_replace(
              CASE
                WHEN jsonb_typeof(kv.value) = 'string' THEN trim(both '"' from kv.value::text)
                ELSE kv.value::text
              END,
              '[^0-9]',
              '',
              'g'
            ), 10) = ''
              THEN ''
            ELSE 'phone:' || right(regexp_replace(
              CASE
                WHEN jsonb_typeof(kv.value) = 'string' THEN trim(both '"' from kv.value::text)
                ELSE kv.value::text
              END,
              '[^0-9]',
              '',
              'g'
            ), 10)
          END
      ELSE lower(trim(
        CASE
          WHEN jsonb_typeof(kv.value) = 'string' THEN trim(both '"' from kv.value::text)
          ELSE kv.value::text
        END
      ))
    END AS value_normalized
  FROM matched_records mr
  CROSS JOIN LATERAL jsonb_each(mr.data_json) AS kv(key, value)
  WHERE jsonb_typeof(kv.value) IN ('string', 'number', 'boolean')
),
insert_indexes AS (
  INSERT INTO "flow_record_indexes" (
    "id",
    "recordId",
    "tenantId",
    "collection",
    "field",
    "valueText",
    "valueNormalized",
    "createdAt",
    "updatedAt"
  )
  SELECT
    'idx:' || md5(index_rows.record_id || ':' || index_rows.field_name),
    index_rows.record_id,
    params.tenant_id,
    index_rows.collection,
    index_rows.field_name,
    index_rows.value_text,
    index_rows.value_normalized,
    NOW(),
    NOW()
  FROM index_rows
  CROSS JOIN params
  WHERE index_rows.value_text <> ''
  ON CONFLICT ("id") DO UPDATE
  SET
    "valueText" = EXCLUDED."valueText",
    "valueNormalized" = EXCLUDED."valueNormalized",
    "updatedAt" = NOW()
  RETURNING 1
)
SELECT
  params.tenant_id AS seeded_tenant_id,
  COUNT(*) FILTER (WHERE seed_records.collection = 'applications') AS application_records_seeded,
  COUNT(*) FILTER (WHERE seed_records.collection = 'admission_slots') AS slot_records_seeded,
  COUNT(*) FILTER (WHERE seed_records.collection = 'applicants') AS applicant_records_seeded,
  COUNT(*) FILTER (WHERE seed_records.collection = 'guardians') AS guardian_records_seeded
FROM params
CROSS JOIN seed_records
GROUP BY params.tenant_id;

COMMIT;

-- Suggested verification after the commit:
-- SELECT "collection", COUNT(*)
-- FROM "flow_records"
-- WHERE "tenantId" = '8285edc4-af68-46c0-9e72-5b2819cb33d9'
--   AND "collection" IN (
--     'academic_years',
--     'campuses',
--     'program_offerings',
--     'admission_rules',
--     'fee_structures',
--     'scholarship_rules',
--     'document_requirements',
--     'guardians',
--     'applicants',
--     'applicant_guardians',
--     'applications',
--     'application_documents',
--     'application_payments',
--     'admission_slots',
--     'admission_appointments',
--     'application_status_history'
--   )
-- GROUP BY "collection"
-- ORDER BY "collection";
--
-- SELECT
--   "dataJson"->>'application_id' AS application_id,
--   "dataJson"->>'student_name' AS student_name,
--   "dataJson"->>'program_name' AS program_name,
--   "dataJson"->>'status' AS status,
--   "dataJson"->>'document_status' AS document_status,
--   "dataJson"->>'payment_status' AS payment_status
-- FROM "flow_records"
-- WHERE "tenantId" = '8285edc4-af68-46c0-9e72-5b2819cb33d9'
--   AND "collection" = 'applications'
-- ORDER BY "dataJson"->>'application_id';
