-- Consolidated demo seed for the multi-domain FLOW demo bundles.
-- This script targets the generic records runtime tables:
--   flow_record_schemas
--   flow_records
--   flow_record_indexes
--
-- What it covers:
--   - hospital
--   - education
--   - real-estate
--   - hotels-travel
--   - retail-ecommerce
--
-- Insurance note:
--   Use `scripts/seed-demo-insurance-records.sql` for the dedicated insurance bundle.
--
-- How to run:
--   1. Replace the tenant_id value in the params CTE below.
--   2. Run against the PostgreSQL database used by the FLOW records runtime.
--      This script writes to the shared `public` schema.
--      PowerShell example:
--      psql $env:DATABASE_URL -f .\scripts\seed-demo-all-flows-records.sql
--
-- Date note:
--   This file is aligned to Tuesday, August 25, 2026.
--   Dates in September, October, and November 2026 are intentionally in the future.

BEGIN;

SET search_path TO public;

WITH params AS (
  SELECT
    '8285edc4-af68-46c0-9e72-5b2819cb33d9'::text AS tenant_id,
    'seed-demo-all-flows-records'::text AS source_tag
),
schemas (collection, schema_json) AS (
  VALUES
    (
      'patients',
      $${
        "collection": "patients",
        "fields": {
          "patient_id": { "type": "string", "required": true, "unique": true },
          "name": { "type": "string", "required": true },
          "mobile": { "type": "phone", "required": true, "unique": true },
          "email": { "type": "email", "required": false },
          "age": { "type": "number", "required": false },
          "gender": { "type": "string", "required": false },
          "location": { "type": "string", "required": false },
          "preferred_language": { "type": "string", "required": false }
        }
      }$$::jsonb
    ),
    (
      'appointments',
      $${
        "collection": "appointments",
        "fields": {
          "appointment_id": { "type": "string", "required": true, "unique": true },
          "patient_id": { "type": "string", "required": true },
          "patient_mobile": { "type": "phone", "required": true },
          "branch_id": { "type": "string", "required": false },
          "consultation_type": { "type": "string", "required": false },
          "department": { "type": "string", "required": true },
          "doctor_id": { "type": "string", "required": false },
          "slot_id": { "type": "string", "required": false },
          "slot_label": { "type": "string", "required": false },
          "slot_hold_id": { "type": "string", "required": false },
          "appointment_date": { "type": "string", "required": false },
          "appointment_time": { "type": "string", "required": false },
          "status": { "type": "string", "required": true },
          "payment_status": { "type": "string", "required": true }
        }
      }$$::jsonb
    ),
    (
      'appointment_slots',
      $${
        "collection": "appointment_slots",
        "fields": {
          "id": { "type": "string", "required": true, "unique": true },
          "slot_id": { "type": "string", "required": true, "unique": true },
          "doctor_id": { "type": "string", "required": true },
          "department": { "type": "string", "required": true },
          "date": { "type": "string", "required": true },
          "label": { "type": "string", "required": true },
          "start": { "type": "string", "required": true },
          "end": { "type": "string", "required": false },
          "status": { "type": "string", "required": true },
          "hold_id": { "type": "string", "required": false },
          "held_by_session": { "type": "string", "required": false },
          "patient_mobile": { "type": "phone", "required": false },
          "appointment_id": { "type": "string", "required": false },
          "branch_id": { "type": "string", "required": false },
          "consultation_mode": { "type": "string", "required": false },
          "hold_ttl_minutes": { "type": "number", "required": false }
        }
      }$$::jsonb
    ),
    (
      'consent_records',
      $${
        "collection": "consent_records",
        "fields": {
          "consent_id": { "type": "string", "required": true, "unique": true },
          "consent_type": { "type": "string", "required": true },
          "consent_status": { "type": "string", "required": true },
          "patient_mobile": { "type": "phone", "required": false },
          "related_entity_id": { "type": "string", "required": false },
          "purpose": { "type": "string", "required": true },
          "channel": { "type": "string", "required": true },
          "session_id": { "type": "string", "required": true },
          "sensitivity": { "type": "string", "required": true }
        }
      }$$::jsonb
    ),
    (
      'payments',
      $${
        "collection": "payments",
        "fields": {
          "payment_id": { "type": "string", "required": true, "unique": true },
          "appointment_id": { "type": "string", "required": false },
          "amount": { "type": "number", "required": true },
          "currency": { "type": "string", "required": true },
          "status": { "type": "string", "required": true },
          "transaction_ref": { "type": "string", "required": false }
        }
      }$$::jsonb
    ),
    (
      'lab_reports',
      $${
        "collection": "lab_reports",
        "fields": {
          "report_id": { "type": "string", "required": true, "unique": true },
          "patient_mobile": { "type": "phone", "required": true },
          "status": { "type": "string", "required": true },
          "report_link": { "type": "url", "required": false },
          "share_allowed": { "type": "boolean", "required": true }
        }
      }$$::jsonb
    ),
    (
      'lab_requests',
      $${
        "collection": "lab_requests",
        "fields": {
          "lab_request_id": { "type": "string", "required": true, "unique": true },
          "test_id": { "type": "string", "required": true },
          "patient_mobile": { "type": "phone", "required": true },
          "sample_collection_type": { "type": "string", "required": true },
          "location": { "type": "string", "required": false },
          "preferred_date": { "type": "string", "required": false },
          "preferred_time": { "type": "string", "required": false },
          "status": { "type": "string", "required": true }
        }
      }$$::jsonb
    ),
    (
      'support_tickets',
      $${
        "collection": "support_tickets",
        "fields": {
          "ticket_id": { "type": "string", "required": true, "unique": true },
          "patient_mobile": { "type": "phone", "required": false },
          "department": { "type": "string", "required": true },
          "priority": { "type": "string", "required": true },
          "issue_type": { "type": "string", "required": true },
          "status": { "type": "string", "required": true },
          "conversation_summary": { "type": "string", "required": false }
        }
      }$$::jsonb
    ),
    (
      'feedback_cases',
      $${
        "collection": "feedback_cases",
        "fields": {
          "ticket_id": { "type": "string", "required": true, "unique": true },
          "patient_mobile": { "type": "phone", "required": false },
          "department": { "type": "string", "required": true },
          "priority": { "type": "string", "required": true },
          "issue_type": { "type": "string", "required": true },
          "status": { "type": "string", "required": true },
          "conversation_summary": { "type": "string", "required": false }
        }
      }$$::jsonb
    ),
    (
      'insurance_cases',
      $${
        "collection": "insurance_cases",
        "fields": {
          "insurance_id": { "type": "string", "required": true, "unique": true },
          "patient_mobile": { "type": "phone", "required": true },
          "insurer_name": { "type": "string", "required": true },
          "policy_number": { "type": "string", "required": true },
          "case_status": { "type": "string", "required": true }
        }
      }$$::jsonb
    ),
    (
      'admissions',
      $${
        "collection": "admissions",
        "fields": {
          "admission_id": { "type": "string", "required": true, "unique": true },
          "patient_mobile": { "type": "phone", "required": true },
          "department": { "type": "string", "required": true },
          "room_type": { "type": "string", "required": false },
          "status": { "type": "string", "required": true }
        }
      }$$::jsonb
    ),
    (
      'follow_ups',
      $${
        "collection": "follow_ups",
        "fields": {
          "followup_id": { "type": "string", "required": true, "unique": true },
          "appointment_id": { "type": "string", "required": true },
          "patient_mobile": { "type": "phone", "required": true },
          "followup_time": { "type": "string", "required": false },
          "status": { "type": "string", "required": true }
        }
      }$$::jsonb
    ),
    (
      'doctors',
      $${
        "collection": "doctors",
        "fields": {
          "doctor_id": { "type": "string", "required": true },
          "doctor_scope_key": { "type": "string", "required": true, "unique": true },
          "display_name": { "type": "string", "required": true },
          "department": { "type": "string", "required": true },
          "qualification": { "type": "string", "required": false },
          "languages": { "type": "string", "required": false },
          "branch_id": { "type": "string", "required": false },
          "consultation_mode": { "type": "string", "required": false },
          "consultation_fee": { "type": "number", "required": false },
          "profile_summary": { "type": "string", "required": false },
          "image_url": { "type": "url", "required": false },
          "next_available_slot": { "type": "string", "required": false }
        }
      }$$::jsonb
    ),
    (
      'guardians',
      $${
        "collection": "guardians",
        "fields": {
          "guardian_id": { "type": "string", "required": true, "unique": true },
          "guardian_name": { "type": "string", "required": true },
          "guardian_mobile": { "type": "phone", "required": true, "unique": true },
          "guardian_email": { "type": "email", "required": false },
          "relationship": { "type": "string", "required": false },
          "occupation": { "type": "string", "required": false }
        }
      }$$::jsonb
    ),
    (
      'applicants',
      $${
        "collection": "applicants",
        "fields": {
          "applicant_id": { "type": "string", "required": true, "unique": true },
          "applicant_name": { "type": "string", "required": true },
          "applicant_mobile": { "type": "phone", "required": false },
          "applicant_email": { "type": "email", "required": false },
          "applicant_user_type": { "type": "string", "required": true },
          "date_of_birth": { "type": "string", "required": false },
          "gender": { "type": "string", "required": false },
          "current_class": { "type": "string", "required": false },
          "desired_class": { "type": "string", "required": false },
          "board_or_curriculum": { "type": "string", "required": false },
          "highest_qualification": { "type": "string", "required": false },
          "percentage_or_cgpa": { "type": "string", "required": false }
        }
      }$$::jsonb
    ),
    (
      'applicant_guardians',
      $${
        "collection": "applicant_guardians",
        "fields": {
          "relation_id": { "type": "string", "required": true, "unique": true },
          "applicant_id": { "type": "string", "required": true },
          "guardian_id": { "type": "string", "required": true },
          "relationship": { "type": "string", "required": false },
          "is_primary": { "type": "boolean", "required": true }
        }
      }$$::jsonb
    ),
    (
      'academic_years',
      $${
        "collection": "academic_years",
        "fields": {
          "academic_year_id": { "type": "string", "required": true, "unique": true },
          "label": { "type": "string", "required": true },
          "admission_open_from": { "type": "string", "required": false },
          "admission_close_on": { "type": "string", "required": false },
          "status": { "type": "string", "required": true }
        }
      }$$::jsonb
    ),
    (
      'campuses',
      $${
        "collection": "campuses",
        "fields": {
          "campus_id": { "type": "string", "required": true, "unique": true },
          "campus_name": { "type": "string", "required": true },
          "city": { "type": "string", "required": false },
          "summary": { "type": "string", "required": false },
          "active": { "type": "boolean", "required": true }
        }
      }$$::jsonb
    ),
    (
      'program_offerings',
      $${
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
      }$$::jsonb
    ),
    (
      'admission_rules',
      $${
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
          "notes": { "type": "string", "required": false }
        }
      }$$::jsonb
    ),
    (
      'fee_structures',
      $${
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
      }$$::jsonb
    ),
    (
      'scholarship_rules',
      $${
        "collection": "scholarship_rules",
        "fields": {
          "scholarship_rule_id": { "type": "string", "required": true, "unique": true },
          "program_offering_id": { "type": "string", "required": true },
          "scholarship_name": { "type": "string", "required": true },
          "minimum_percentage": { "type": "number", "required": false },
          "benefit_summary": { "type": "string", "required": false },
          "status": { "type": "string", "required": true }
        }
      }$$::jsonb
    ),
    (
      'scholarship_assessments',
      $${
        "collection": "scholarship_assessments",
        "fields": {
          "assessment_id": { "type": "string", "required": true, "unique": true },
          "application_id": { "type": "string", "required": true },
          "eligibility_status": { "type": "string", "required": true },
          "assessment_summary": { "type": "string", "required": false }
        }
      }$$::jsonb
    ),
    (
      'document_requirements',
      $${
        "collection": "document_requirements",
        "fields": {
          "requirement_id": { "type": "string", "required": true, "unique": true },
          "program_offering_id": { "type": "string", "required": true },
          "document_name": { "type": "string", "required": true },
          "required": { "type": "boolean", "required": true },
          "verification_method": { "type": "string", "required": false }
        }
      }$$::jsonb
    ),
    (
      'applications',
      $${
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
      }$$::jsonb
    ),
    (
      'application_documents',
      $${
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
      }$$::jsonb
    ),
    (
      'application_payments',
      $${
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
      }$$::jsonb
    ),
    (
      'admission_slots',
      $${
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
      }$$::jsonb
    ),
    (
      'admission_appointments',
      $${
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
      }$$::jsonb
    ),
    (
      'application_status_history',
      $${
        "collection": "application_status_history",
        "fields": {
          "history_id": { "type": "string", "required": true, "unique": true },
          "application_id": { "type": "string", "required": true },
          "from_status": { "type": "string", "required": false },
          "to_status": { "type": "string", "required": true },
          "reason_code": { "type": "string", "required": false }
        }
      }$$::jsonb
    ),
    (
      'real_estate_contacts',
      $${
        "collection": "real_estate_contacts",
        "fields": {
          "contact_id": { "type": "string", "required": true, "unique": true },
          "full_name": { "type": "string", "required": false },
          "phone_e164": { "type": "phone", "required": true, "unique": true },
          "email": { "type": "email", "required": false },
          "last_requirement_summary": { "type": "string", "required": false },
          "last_preferred_location": { "type": "string", "required": false }
        }
      }$$::jsonb
    ),
    (
      'real_estate_leads',
      $${
        "collection": "real_estate_leads",
        "fields": {
          "lead_id": { "type": "string", "required": true, "unique": true },
          "contact_id": { "type": "string", "required": true },
          "buyer_mobile": { "type": "phone", "required": true },
          "buyer_name": { "type": "string", "required": false },
          "buyer_email": { "type": "email", "required": false },
          "source_channel": { "type": "string", "required": true },
          "status": { "type": "string", "required": true },
          "stage": { "type": "string", "required": true },
          "preferred_location": { "type": "string", "required": false },
          "budget_min_minor": { "type": "number", "required": false },
          "budget_max_minor": { "type": "number", "required": false },
          "budget_range_label": { "type": "string", "required": false },
          "property_type": { "type": "string", "required": false },
          "bhk": { "type": "string", "required": false },
          "purchase_purpose": { "type": "string", "required": false },
          "purchase_timeline": { "type": "string", "required": false },
          "selected_project_id": { "type": "string", "required": false },
          "selected_project_name": { "type": "string", "required": false },
          "site_visit_id": { "type": "string", "required": false },
          "site_visit_status": { "type": "string", "required": false }
        }
      }$$::jsonb
    ),
    (
      'property_inventory',
      $${
        "collection": "property_inventory",
        "fields": {
          "project_id": { "type": "string", "required": true, "unique": true },
          "project_code": { "type": "string", "required": true, "unique": true },
          "project_name": { "type": "string", "required": true },
          "location": { "type": "string", "required": true },
          "property_type": { "type": "string", "required": true },
          "bhk_options": { "type": "string", "required": false },
          "min_price_minor": { "type": "number", "required": false },
          "max_price_minor": { "type": "number", "required": false },
          "brochure_url": { "type": "url", "required": false },
          "image_url": { "type": "url", "required": false },
          "location_url": { "type": "url", "required": false },
          "sales_owner_name": { "type": "string", "required": false },
          "sales_owner_phone": { "type": "phone", "required": false },
          "sales_owner_email": { "type": "email", "required": false },
          "active": { "type": "boolean", "required": true }
        }
      }$$::jsonb
    ),
    (
      'real_estate_lead_project_interests',
      $${
        "collection": "real_estate_lead_project_interests",
        "fields": {
          "interest_id": { "type": "string", "required": true, "unique": true },
          "lead_id": { "type": "string", "required": true },
          "project_id": { "type": "string", "required": true },
          "project_name": { "type": "string", "required": true },
          "brochure_requested": { "type": "boolean", "required": true },
          "shortlisted": { "type": "boolean", "required": true },
          "site_visit_requested": { "type": "boolean", "required": true },
          "site_visit_id": { "type": "string", "required": false }
        }
      }$$::jsonb
    ),
    (
      'real_estate_lead_activities',
      $${
        "collection": "real_estate_lead_activities",
        "fields": {
          "activity_id": { "type": "string", "required": true, "unique": true },
          "lead_id": { "type": "string", "required": true },
          "contact_id": { "type": "string", "required": true },
          "project_id": { "type": "string", "required": false },
          "activity_type": { "type": "string", "required": true },
          "channel": { "type": "string", "required": true },
          "summary": { "type": "string", "required": false }
        }
      }$$::jsonb
    ),
    (
      'real_estate_site_visit_slots',
      $${
        "collection": "real_estate_site_visit_slots",
        "fields": {
          "slot_id": { "type": "string", "required": true, "unique": true },
          "project_id": { "type": "string", "required": true },
          "date": { "type": "string", "required": true },
          "start": { "type": "string", "required": true },
          "end": { "type": "string", "required": false },
          "label": { "type": "string", "required": true },
          "status": { "type": "string", "required": true },
          "hold_id": { "type": "string", "required": false },
          "held_by_session": { "type": "string", "required": false },
          "hold_expires_at": { "type": "string", "required": false }
        }
      }$$::jsonb
    ),
    (
      'real_estate_site_visit_holds',
      $${
        "collection": "real_estate_site_visit_holds",
        "fields": {
          "hold_id": { "type": "string", "required": true, "unique": true },
          "lead_id": { "type": "string", "required": true },
          "slot_id": { "type": "string", "required": true },
          "project_id": { "type": "string", "required": true },
          "session_id": { "type": "string", "required": true },
          "status": { "type": "string", "required": true },
          "expires_at": { "type": "string", "required": false }
        }
      }$$::jsonb
    ),
    (
      'real_estate_site_visits',
      $${
        "collection": "real_estate_site_visits",
        "fields": {
          "site_visit_id": { "type": "string", "required": true, "unique": true },
          "lead_id": { "type": "string", "required": true },
          "contact_id": { "type": "string", "required": true },
          "project_id": { "type": "string", "required": true },
          "project_name": { "type": "string", "required": true },
          "slot_id": { "type": "string", "required": true },
          "visit_date": { "type": "string", "required": true },
          "visit_time": { "type": "string", "required": true },
          "visit_datetime": { "type": "string", "required": true },
          "source_channel": { "type": "string", "required": true },
          "status": { "type": "string", "required": true },
          "assigned_salesperson_name": { "type": "string", "required": false },
          "assigned_salesperson_phone": { "type": "phone", "required": false }
        }
      }$$::jsonb
    ),
    (
      'real_estate_followup_jobs',
      $${
        "collection": "real_estate_followup_jobs",
        "fields": {
          "followup_id": { "type": "string", "required": true, "unique": true },
          "lead_id": { "type": "string", "required": true },
          "project_id": { "type": "string", "required": false },
          "followup_type": { "type": "string", "required": true },
          "scheduled_for": { "type": "string", "required": false },
          "channel": { "type": "string", "required": true },
          "status": { "type": "string", "required": true }
        }
      }$$::jsonb
    ),
    (
      'real_estate_crm_sync_jobs',
      $${
        "collection": "real_estate_crm_sync_jobs",
        "fields": {
          "sync_job_id": { "type": "string", "required": true, "unique": true },
          "lead_id": { "type": "string", "required": true },
          "entity_type": { "type": "string", "required": true },
          "operation": { "type": "string", "required": true },
          "crm_provider": { "type": "string", "required": true },
          "status": { "type": "string", "required": true },
          "payload_summary": { "type": "string", "required": false }
        }
      }$$::jsonb
    ),
    (
      'hotel_guest_profiles',
      $${
        "collection": "hotel_guest_profiles",
        "fields": {
          "guest_id": { "type": "string", "required": true, "unique": true },
          "guest_code": { "type": "string", "required": true, "unique": true },
          "full_name": { "type": "string", "required": true },
          "normalized_phone": { "type": "phone", "required": true },
          "email": { "type": "email", "required": false },
          "country_code": { "type": "string", "required": false },
          "preferred_language": { "type": "string", "required": false },
          "saved_preferences": { "type": "string", "required": false },
          "special_request_notes": { "type": "string", "required": false },
          "last_stay_at": { "type": "string", "required": false }
        }
      }$$::jsonb
    ),
    (
      'hotel_room_sellable_options',
      $${
        "collection": "hotel_room_sellable_options",
        "fields": {
          "option_id": { "type": "string", "required": true, "unique": true },
          "property_id": { "type": "string", "required": true },
          "property_name": { "type": "string", "required": true },
          "property_city": { "type": "string", "required": true },
          "room_type_id": { "type": "string", "required": true },
          "room_code": { "type": "string", "required": true },
          "room_name": { "type": "string", "required": true },
          "max_adults": { "type": "number", "required": true },
          "max_children": { "type": "number", "required": true },
          "max_occupancy": { "type": "number", "required": true },
          "rooms_available": { "type": "number", "required": true },
          "nightly_rate_minor": { "type": "number", "required": true },
          "taxes_minor": { "type": "number", "required": true },
          "fees_minor": { "type": "number", "required": true },
          "deposit_required_minor": { "type": "number", "required": false },
          "meal_plan": { "type": "string", "required": false },
          "rate_plan": { "type": "string", "required": false },
          "cancellation_policy": { "type": "string", "required": false },
          "package_code": { "type": "string", "required": false },
          "package_tags": { "type": "string", "required": false },
          "amenity_summary": { "type": "string", "required": false },
          "active": { "type": "boolean", "required": true }
        }
      }$$::jsonb
    ),
    (
      'hotel_packages',
      $${
        "collection": "hotel_packages",
        "fields": {
          "package_id": { "type": "string", "required": true, "unique": true },
          "package_code": { "type": "string", "required": true, "unique": true },
          "property_id": { "type": "string", "required": true },
          "property_name": { "type": "string", "required": true },
          "package_name": { "type": "string", "required": true },
          "package_description": { "type": "string", "required": false },
          "from_amount_minor": { "type": "number", "required": true },
          "inclusions_summary": { "type": "string", "required": false },
          "active": { "type": "boolean", "required": true }
        }
      }$$::jsonb
    ),
    (
      'hotel_booking_quotes',
      $${
        "collection": "hotel_booking_quotes",
        "fields": {
          "quote_id": { "type": "string", "required": true, "unique": true },
          "guest_id": { "type": "string", "required": false },
          "property_name": { "type": "string", "required": true },
          "room_type_id": { "type": "string", "required": true },
          "room_name": { "type": "string", "required": true },
          "check_in": { "type": "string", "required": true },
          "check_out": { "type": "string", "required": true },
          "nights": { "type": "number", "required": true },
          "adults": { "type": "number", "required": true },
          "children": { "type": "number", "required": true },
          "rooms_requested": { "type": "number", "required": true },
          "currency": { "type": "string", "required": true },
          "subtotal": { "type": "number", "required": true },
          "taxes": { "type": "number", "required": true },
          "fees": { "type": "number", "required": true },
          "total": { "type": "number", "required": true },
          "deposit_required": { "type": "number", "required": false },
          "balance_due": { "type": "number", "required": false },
          "policy_snapshot": { "type": "string", "required": false },
          "pricing_snapshot": { "type": "string", "required": false },
          "status": { "type": "string", "required": true },
          "expires_at": { "type": "string", "required": true }
        }
      }$$::jsonb
    ),
    (
      'hotel_booking_holds',
      $${
        "collection": "hotel_booking_holds",
        "fields": {
          "hold_id": { "type": "string", "required": true, "unique": true },
          "hold_code": { "type": "string", "required": true, "unique": true },
          "quote_id": { "type": "string", "required": true },
          "guest_id": { "type": "string", "required": false },
          "property_name": { "type": "string", "required": true },
          "room_type_id": { "type": "string", "required": true },
          "room_name": { "type": "string", "required": true },
          "check_in": { "type": "string", "required": true },
          "check_out": { "type": "string", "required": true },
          "rooms_requested": { "type": "number", "required": true },
          "status": { "type": "string", "required": true },
          "expires_at": { "type": "string", "required": true }
        }
      }$$::jsonb
    ),
    (
      'hotel_bookings',
      $${
        "collection": "hotel_bookings",
        "fields": {
          "booking_id": { "type": "string", "required": true, "unique": true },
          "booking_code": { "type": "string", "required": true, "unique": true },
          "guest_id": { "type": "string", "required": false },
          "guest_name": { "type": "string", "required": true },
          "guest_phone": { "type": "phone", "required": true },
          "guest_email": { "type": "email", "required": false },
          "property_name": { "type": "string", "required": true },
          "room_type_id": { "type": "string", "required": true },
          "room_name": { "type": "string", "required": true },
          "check_in": { "type": "string", "required": true },
          "check_out": { "type": "string", "required": true },
          "nights": { "type": "number", "required": true },
          "adults": { "type": "number", "required": true },
          "children": { "type": "number", "required": true },
          "rooms_requested": { "type": "number", "required": true },
          "currency": { "type": "string", "required": true },
          "subtotal": { "type": "number", "required": true },
          "tax_amount": { "type": "number", "required": true },
          "fee_amount": { "type": "number", "required": true },
          "total_amount": { "type": "number", "required": true },
          "paid_amount": { "type": "number", "required": true },
          "balance_amount": { "type": "number", "required": true },
          "payment_status": { "type": "string", "required": true },
          "status": { "type": "string", "required": true },
          "quote_id": { "type": "string", "required": false },
          "hold_id": { "type": "string", "required": false },
          "package_name": { "type": "string", "required": false },
          "cancellation_policy_snapshot": { "type": "string", "required": false },
          "special_requests": { "type": "string", "required": false },
          "booking_snapshot": { "type": "string", "required": false }
        }
      }$$::jsonb
    ),
    (
      'hotel_payments',
      $${
        "collection": "hotel_payments",
        "fields": {
          "payment_id": { "type": "string", "required": true, "unique": true },
          "booking_id": { "type": "string", "required": false },
          "hold_id": { "type": "string", "required": false },
          "amount": { "type": "number", "required": true },
          "currency": { "type": "string", "required": true },
          "payment_type": { "type": "string", "required": true },
          "provider": { "type": "string", "required": true },
          "status": { "type": "string", "required": true },
          "provider_reference": { "type": "string", "required": false },
          "idempotency_key": { "type": "string", "required": true }
        }
      }$$::jsonb
    ),
    (
      'hotel_booking_changes',
      $${
        "collection": "hotel_booking_changes",
        "fields": {
          "change_id": { "type": "string", "required": true, "unique": true },
          "booking_id": { "type": "string", "required": true },
          "change_type": { "type": "string", "required": true },
          "before_snapshot": { "type": "string", "required": true },
          "after_snapshot": { "type": "string", "required": true },
          "price_difference": { "type": "number", "required": false },
          "reason": { "type": "string", "required": false }
        }
      }$$::jsonb
    ),
    (
      'hotel_availability_followups',
      $${
        "collection": "hotel_availability_followups",
        "fields": {
          "followup_id": { "type": "string", "required": true, "unique": true },
          "property_name": { "type": "string", "required": false },
          "check_in": { "type": "string", "required": true },
          "check_out": { "type": "string", "required": true },
          "adults": { "type": "number", "required": true },
          "children": { "type": "number", "required": true },
          "rooms_requested": { "type": "number", "required": true },
          "request_type": { "type": "string", "required": true },
          "status": { "type": "string", "required": true }
        }
      }$$::jsonb
    ),
    (
      'hotel_transfer_requests',
      $${
        "collection": "hotel_transfer_requests",
        "fields": {
          "transfer_id": { "type": "string", "required": true, "unique": true },
          "booking_id": { "type": "string", "required": true },
          "booking_code": { "type": "string", "required": true },
          "pickup_type": { "type": "string", "required": true },
          "pickup_location": { "type": "string", "required": true },
          "arrival_reference": { "type": "string", "required": false },
          "arrival_datetime": { "type": "string", "required": true },
          "passenger_count": { "type": "number", "required": true },
          "vehicle_preference": { "type": "string", "required": false },
          "charge_amount": { "type": "number", "required": true },
          "status": { "type": "string", "required": true }
        }
      }$$::jsonb
    ),
    (
      'hotel_service_requests',
      $${
        "collection": "hotel_service_requests",
        "fields": {
          "service_request_id": { "type": "string", "required": true, "unique": true },
          "booking_id": { "type": "string", "required": false },
          "booking_code": { "type": "string", "required": false },
          "guest_phone": { "type": "phone", "required": false },
          "category": { "type": "string", "required": true },
          "request_type": { "type": "string", "required": true },
          "description": { "type": "string", "required": false },
          "priority": { "type": "string", "required": true },
          "status": { "type": "string", "required": true },
          "room_number": { "type": "string", "required": false },
          "assigned_department": { "type": "string", "required": false }
        }
      }$$::jsonb
    ),
    (
      'hotel_support_cases',
      $${
        "collection": "hotel_support_cases",
        "fields": {
          "support_case_id": { "type": "string", "required": true, "unique": true },
          "booking_id": { "type": "string", "required": false },
          "guest_phone": { "type": "phone", "required": false },
          "department": { "type": "string", "required": true },
          "priority": { "type": "string", "required": true },
          "issue_type": { "type": "string", "required": true },
          "summary": { "type": "string", "required": true },
          "status": { "type": "string", "required": true }
        }
      }$$::jsonb
    ),
    (
      'hotel_group_booking_leads',
      $${
        "collection": "hotel_group_booking_leads",
        "fields": {
          "group_lead_id": { "type": "string", "required": true, "unique": true },
          "company_name": { "type": "string", "required": false },
          "contact_name": { "type": "string", "required": true },
          "phone": { "type": "phone", "required": true },
          "email": { "type": "email", "required": false },
          "property_name": { "type": "string", "required": false },
          "check_in": { "type": "string", "required": false },
          "check_out": { "type": "string", "required": false },
          "rooms_required": { "type": "number", "required": true },
          "guest_count": { "type": "number", "required": true },
          "room_mix": { "type": "string", "required": false },
          "meal_plan": { "type": "string", "required": false },
          "event_requirement": { "type": "string", "required": false },
          "budget": { "type": "string", "required": false },
          "status": { "type": "string", "required": true }
        }
      }$$::jsonb
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
      'seed_hospital_patient_meera',
      'patients',
      'mobile',
      'phone:9000011111',
      jsonb_build_object(
        'patient_id', 'PAT-9000011111',
        'name', 'Meera Sharma',
        'mobile', '+919000011111',
        'email', 'meera.sharma@example.com',
        'age', 34,
        'gender', 'female',
        'location', 'Hyderabad',
        'preferred_language', 'english'
      )
    ),
    (
      'seed_hospital_patient_arjun',
      'patients',
      'mobile',
      'phone:9000012222',
      jsonb_build_object(
        'patient_id', 'PAT-9000012222',
        'name', 'Arjun Rao',
        'mobile', '+919000012222',
        'email', 'arjun.rao@example.com',
        'age', 41,
        'gender', 'male',
        'location', 'Hyderabad',
        'preferred_language', 'telugu'
      )
    ),
    (
      'seed_hospital_doctor_general_main_inperson',
      'doctors',
      'doctor_scope_key',
      'doc_general_1:main_branch:in_person',
      jsonb_build_object(
        'doctor_id', 'doc_general_1',
        'doctor_scope_key', 'doc_general_1:main_branch:in_person',
        'display_name', 'Dr. Ananya Rao',
        'department', 'general_medicine',
        'qualification', 'MBBS, MD General Medicine',
        'languages', 'English, Hindi, Telugu',
        'branch_id', 'main_branch',
        'consultation_mode', 'in_person',
        'consultation_fee', 800,
        'profile_summary', 'General OPD care for fever, infections, routine illness, and follow-up visits.',
        'image_url', 'https://ik.imagekit.io/uzhmjh0td/Helthcare/doctor_female_1.png?updatedAt=1787290215553',
        'next_available_slot', '2026-09-02 09:00'
      )
    ),
    (
      'seed_hospital_doctor_general_main_online',
      'doctors',
      'doctor_scope_key',
      'doc_general_1:main_branch:online',
      jsonb_build_object(
        'doctor_id', 'doc_general_1',
        'doctor_scope_key', 'doc_general_1:main_branch:online',
        'display_name', 'Dr. Ananya Rao',
        'department', 'general_medicine',
        'qualification', 'MBBS, MD General Medicine',
        'languages', 'English, Hindi, Telugu',
        'branch_id', 'main_branch',
        'consultation_mode', 'online',
        'consultation_fee', 600,
        'profile_summary', 'Online consultation for routine illness, follow-up, and medication review.',
        'image_url', 'https://ik.imagekit.io/uzhmjh0td/Helthcare/doctor_female_1.png?updatedAt=1787290215553',
        'next_available_slot', '2026-09-02 11:00'
      )
    ),
    (
      'seed_hospital_doctor_cardio_main_inperson',
      'doctors',
      'doctor_scope_key',
      'doc_cardio_1:main_branch:in_person',
      jsonb_build_object(
        'doctor_id', 'doc_cardio_1',
        'doctor_scope_key', 'doc_cardio_1:main_branch:in_person',
        'display_name', 'Dr. Vikram Mehta',
        'department', 'cardiology',
        'qualification', 'MBBS, MD, DM Cardiology',
        'languages', 'English, Hindi',
        'branch_id', 'main_branch',
        'consultation_mode', 'in_person',
        'consultation_fee', 1200,
        'profile_summary', 'Heart-care consultation for chest discomfort, BP review, and cardiac follow-up.',
        'image_url', 'https://example.com/hospital/doctors/vikram-mehta.jpg',
        'next_available_slot', '2026-09-03 10:00'
      )
    ),
    (
      'seed_hospital_doctor_cardio_main_online',
      'doctors',
      'doctor_scope_key',
      'doc_cardio_1:main_branch:online',
      jsonb_build_object(
        'doctor_id', 'doc_cardio_1',
        'doctor_scope_key', 'doc_cardio_1:main_branch:online',
        'display_name', 'Dr. Vikram Mehta',
        'department', 'cardiology',
        'qualification', 'MBBS, MD, DM Cardiology',
        'languages', 'English, Hindi',
        'branch_id', 'main_branch',
        'consultation_mode', 'online',
        'consultation_fee', 1000,
        'profile_summary', 'Online cardiac review for reports, medication, and preventive guidance.',
        'image_url', 'https://example.com/hospital/doctors/vikram-mehta.jpg',
        'next_available_slot', '2026-09-03 12:00'
      )
    ),
    (
      'seed_hospital_doctor_ortho_main_inperson',
      'doctors',
      'doctor_scope_key',
      'doc_ortho_1:main_branch:in_person',
      jsonb_build_object(
        'doctor_id', 'doc_ortho_1',
        'doctor_scope_key', 'doc_ortho_1:main_branch:in_person',
        'display_name', 'Dr. Kavya Nair',
        'department', 'orthopedics',
        'qualification', 'MBBS, MS Orthopedics',
        'languages', 'English, Hindi, Telugu',
        'branch_id', 'main_branch',
        'consultation_mode', 'in_person',
        'consultation_fee', 1000,
        'profile_summary', 'Bone, joint, injury, and mobility consultation with follow-up support.',
        'image_url', 'https://ik.imagekit.io/uzhmjh0td/Helthcare/doctor_female_1.png?updatedAt=1787290215553',
        'next_available_slot', '2026-09-04 09:30'
      )
    ),
    (
      'seed_hospital_doctor_ortho_main_online',
      'doctors',
      'doctor_scope_key',
      'doc_ortho_1:main_branch:online',
      jsonb_build_object(
        'doctor_id', 'doc_ortho_1',
        'doctor_scope_key', 'doc_ortho_1:main_branch:online',
        'display_name', 'Dr. Kavya Nair',
        'department', 'orthopedics',
        'qualification', 'MBBS, MS Orthopedics',
        'languages', 'English, Hindi, Telugu',
        'branch_id', 'main_branch',
        'consultation_mode', 'online',
        'consultation_fee', 800,
        'profile_summary', 'Online orthopedics follow-up for reports, recovery checks, and mobility guidance.',
        'image_url', 'https://ik.imagekit.io/uzhmjh0td/Helthcare/doctor_female_1.png?updatedAt=1787290215553',
        'next_available_slot', '2026-09-04 11:30'
      )
    ),
    (
      'seed_hospital_slot_general_0900',
      'appointment_slots',
      'slot_id',
      'slot:main:general:2026-09-02:0900',
      jsonb_build_object(
        'id', 'slot:main:general:2026-09-02:0900',
        'slot_id', 'slot:main:general:2026-09-02:0900',
        'doctor_id', 'doc_general_1',
        'department', 'general_medicine',
        'date', '2026-09-02',
        'label', 'Tuesday 09:00 AM - 09:20 AM',
        'start', '09:00',
        'end', '09:20',
        'status', 'available',
        'hold_id', '',
        'held_by_session', '',
        'patient_mobile', '',
        'appointment_id', '',
        'branch_id', 'main_branch',
        'consultation_mode', 'in_person',
        'hold_ttl_minutes', 10
      )
    ),
    (
      'seed_hospital_slot_general_0930',
      'appointment_slots',
      'slot_id',
      'slot:main:general:2026-09-02:0930',
      jsonb_build_object(
        'id', 'slot:main:general:2026-09-02:0930',
        'slot_id', 'slot:main:general:2026-09-02:0930',
        'doctor_id', 'doc_general_1',
        'department', 'general_medicine',
        'date', '2026-09-02',
        'label', 'Tuesday 09:30 AM - 09:50 AM',
        'start', '09:30',
        'end', '09:50',
        'status', 'available',
        'hold_id', '',
        'held_by_session', '',
        'patient_mobile', '',
        'appointment_id', '',
        'branch_id', 'main_branch',
        'consultation_mode', 'in_person',
        'hold_ttl_minutes', 10
      )
    ),
    (
      'seed_hospital_slot_cardio_1000_booked',
      'appointment_slots',
      'slot_id',
      'slot:main:cardio:2026-09-03:1000',
      jsonb_build_object(
        'id', 'slot:main:cardio:2026-09-03:1000',
        'slot_id', 'slot:main:cardio:2026-09-03:1000',
        'doctor_id', 'doc_cardio_1',
        'department', 'cardiology',
        'date', '2026-09-03',
        'label', 'Thursday 10:00 AM - 10:20 AM',
        'start', '10:00',
        'end', '10:20',
        'status', 'booked',
        'hold_id', 'HOLD-HOSP-0001',
        'held_by_session', 'seed',
        'patient_mobile', '+919000011111',
        'appointment_id', 'APT-HOSP-0001',
        'branch_id', 'main_branch',
        'consultation_mode', 'in_person',
        'hold_ttl_minutes', 10
      )
    ),
    (
      'seed_hospital_slot_cardio_1030',
      'appointment_slots',
      'slot_id',
      'slot:main:cardio:2026-09-03:1030',
      jsonb_build_object(
        'id', 'slot:main:cardio:2026-09-03:1030',
        'slot_id', 'slot:main:cardio:2026-09-03:1030',
        'doctor_id', 'doc_cardio_1',
        'department', 'cardiology',
        'date', '2026-09-03',
        'label', 'Thursday 10:30 AM - 10:50 AM',
        'start', '10:30',
        'end', '10:50',
        'status', 'available',
        'hold_id', '',
        'held_by_session', '',
        'patient_mobile', '',
        'appointment_id', '',
        'branch_id', 'main_branch',
        'consultation_mode', 'in_person',
        'hold_ttl_minutes', 10
      )
    ),
    (
      'seed_hospital_slot_ortho_0930',
      'appointment_slots',
      'slot_id',
      'slot:main:ortho:2026-09-04:0930',
      jsonb_build_object(
        'id', 'slot:main:ortho:2026-09-04:0930',
        'slot_id', 'slot:main:ortho:2026-09-04:0930',
        'doctor_id', 'doc_ortho_1',
        'department', 'orthopedics',
        'date', '2026-09-04',
        'label', 'Friday 09:30 AM - 09:50 AM',
        'start', '09:30',
        'end', '09:50',
        'status', 'available',
        'hold_id', '',
        'held_by_session', '',
        'patient_mobile', '',
        'appointment_id', '',
        'branch_id', 'main_branch',
        'consultation_mode', 'in_person',
        'hold_ttl_minutes', 10
      )
    ),
    (
      'seed_hospital_appointment_future',
      'appointments',
      'appointment_id',
      'apt-hosp-0001',
      jsonb_build_object(
        'appointment_id', 'APT-HOSP-0001',
        'patient_id', 'PAT-9000011111',
        'patient_mobile', '+919000011111',
        'branch_id', 'main_branch',
        'consultation_type', 'in_person',
        'department', 'cardiology',
        'doctor_id', 'doc_cardio_1',
        'slot_id', 'slot:main:cardio:2026-09-03:1000',
        'slot_label', 'Thursday 10:00 AM - 10:20 AM',
        'slot_hold_id', 'HOLD-HOSP-0001',
        'appointment_date', '2026-09-03',
        'appointment_time', '10:00',
        'status', 'confirmed',
        'payment_status', 'paid'
      )
    ),
    (
      'seed_hospital_appointment_past',
      'appointments',
      'appointment_id',
      'apt-hosp-0002',
      jsonb_build_object(
        'appointment_id', 'APT-HOSP-0002',
        'patient_id', 'PAT-9000011111',
        'patient_mobile', '+919000011111',
        'branch_id', 'main_branch',
        'consultation_type', 'in_person',
        'department', 'general_medicine',
        'doctor_id', 'doc_general_1',
        'slot_id', 'slot:main:general:2026-07-20:0900',
        'slot_label', 'Monday 09:00 AM - 09:20 AM',
        'slot_hold_id', '',
        'appointment_date', '2026-07-20',
        'appointment_time', '09:00',
        'status', 'completed',
        'payment_status', 'paid'
      )
    ),
    (
      'seed_hospital_payment_apt1',
      'payments',
      'payment_id',
      'pay-hosp-0001',
      jsonb_build_object(
        'payment_id', 'PAY-HOSP-0001',
        'appointment_id', 'APT-HOSP-0001',
        'amount', 1200,
        'currency', 'INR',
        'status', 'paid',
        'transaction_ref', 'txn_hosp_0001'
      )
    ),
    (
      'seed_hospital_consent_apt1',
      'consent_records',
      'consent_id',
      'consent-hosp-0001',
      jsonb_build_object(
        'consent_id', 'CONSENT-HOSP-0001',
        'consent_type', 'medical_booking_data',
        'consent_status', 'accepted',
        'patient_mobile', '+919000011111',
        'related_entity_id', 'APT-HOSP-0001',
        'purpose', 'Appointment booking and notification consent.',
        'channel', 'whatsapp',
        'session_id', 'seed',
        'sensitivity', 'medical'
      )
    ),
    (
      'seed_hospital_lab_report_meera',
      'lab_reports',
      'report_id',
      'rpt-hosp-0001',
      jsonb_build_object(
        'report_id', 'RPT-HOSP-0001',
        'patient_mobile', '+919000011111',
        'status', 'ready',
        'report_link', 'https://hospital.example.com/reports/RPT-HOSP-0001',
        'share_allowed', true
      )
    ),
    (
      'seed_hospital_lab_request_home',
      'lab_requests',
      'lab_request_id',
      'labreq-hosp-0001',
      jsonb_build_object(
        'lab_request_id', 'LABREQ-HOSP-0001',
        'test_id', 'cbc_panel',
        'patient_mobile', '+919000011111',
        'sample_collection_type', 'home_collection',
        'location', 'Madhapur, Hyderabad',
        'preferred_date', '2026-09-05',
        'preferred_time', '08:00-10:00',
        'status', 'open'
      )
    ),
    (
      'seed_hospital_support_billing',
      'support_tickets',
      'ticket_id',
      'tkt-hosp-0001',
      jsonb_build_object(
        'ticket_id', 'TKT-HOSP-0001',
        'patient_mobile', '+919000011111',
        'department', 'billing_support',
        'priority', 'high',
        'issue_type', 'billing_query',
        'status', 'open',
        'conversation_summary', 'Clarification requested for cardiology consultation invoice.'
      )
    ),
    (
      'seed_hospital_support_pharmacy',
      'support_tickets',
      'ticket_id',
      'tkt-hosp-0002',
      jsonb_build_object(
        'ticket_id', 'TKT-HOSP-0002',
        'patient_mobile', '+919000012222',
        'department', 'pharmacy_support',
        'priority', 'normal',
        'issue_type', 'medicine_availability',
        'status', 'open',
        'conversation_summary', 'Availability check for post-visit prescription refill.'
      )
    ),
    (
      'seed_hospital_feedback_case',
      'feedback_cases',
      'ticket_id',
      'fdb-hosp-0001',
      jsonb_build_object(
        'ticket_id', 'FDB-HOSP-0001',
        'patient_mobile', '+919000011111',
        'department', 'front_desk',
        'priority', 'normal',
        'issue_type', 'feedback',
        'status', 'open',
        'conversation_summary', 'Rating 5. Helpful staff and fast check-in process.'
      )
    ),
    (
      'seed_hospital_insurance_case',
      'insurance_cases',
      'insurance_id',
      'ins-hosp-0001',
      jsonb_build_object(
        'insurance_id', 'INS-HOSP-0001',
        'patient_mobile', '+919000011111',
        'insurer_name', 'Star Health',
        'policy_number', 'STAR-2026-00991',
        'case_status', 'under_review'
      )
    ),
    (
      'seed_hospital_admission_case',
      'admissions',
      'admission_id',
      'adm-hosp-0001',
      jsonb_build_object(
        'admission_id', 'ADM-HOSP-0001',
        'patient_mobile', '+919000012222',
        'department', 'orthopedics',
        'room_type', 'single_private',
        'status', 'pre_admission'
      )
    ),
    (
      'seed_hospital_followup_case',
      'follow_ups',
      'followup_id',
      'fup-hosp-0001',
      jsonb_build_object(
        'followup_id', 'FUP-HOSP-0001',
        'appointment_id', 'APT-HOSP-0002',
        'patient_mobile', '+919000011111',
        'followup_time', '2026-09-10T11:00:00.000Z',
        'status', 'scheduled'
      )
    ),

    (
      'seed_edu_guardian_kavitha',
      'guardians',
      'guardian_id',
      'gdn-edu-0001',
      jsonb_build_object(
        'guardian_id', 'GDN-EDU-0001',
        'guardian_name', 'Kavitha Menon',
        'guardian_mobile', '+919100011111',
        'guardian_email', 'kavitha.menon@example.edu',
        'relationship', 'mother',
        'occupation', 'Architect'
      )
    ),
    (
      'seed_edu_applicant_ishaan',
      'applicants',
      'applicant_id',
      'app-edu-0001',
      jsonb_build_object(
        'applicant_id', 'APP-EDU-0001',
        'applicant_name', 'Ishaan Menon',
        'applicant_mobile', '+919100022222',
        'applicant_email', 'ishaan.menon@example.edu',
        'applicant_user_type', 'guardian_for_student',
        'date_of_birth', '2014-05-18',
        'gender', 'male',
        'current_class', 'Class 5',
        'desired_class', 'Class 6',
        'board_or_curriculum', 'CBSE'
      )
    ),
    (
      'seed_edu_guardian_relation',
      'applicant_guardians',
      'relation_id',
      'rel-edu-0001',
      jsonb_build_object(
        'relation_id', 'REL-EDU-0001',
        'applicant_id', 'APP-EDU-0001',
        'guardian_id', 'GDN-EDU-0001',
        'relationship', 'mother',
        'is_primary', true
      )
    ),
    (
      'seed_edu_academic_year_2027',
      'academic_years',
      'academic_year_id',
      'ay-2027',
      jsonb_build_object(
        'academic_year_id', 'AY-2027',
        'label', '2027-2028',
        'admission_open_from', '2026-09-01',
        'admission_close_on', '2027-03-31',
        'status', 'open'
      )
    ),
    (
      'seed_edu_campus_hyderabad',
      'campuses',
      'campus_id',
      'campus-hyd-main',
      jsonb_build_object(
        'campus_id', 'CAMPUS-HYD-MAIN',
        'campus_name', 'Northstar Main Campus',
        'city', 'Hyderabad',
        'summary', 'Primary city campus with labs, sports, transport, and counselling support.',
        'active', true
      )
    ),
    (
      'seed_edu_campus_secunderabad',
      'campuses',
      'campus_id',
      'campus-sec-west',
      jsonb_build_object(
        'campus_id', 'CAMPUS-SEC-WEST',
        'campus_name', 'Northstar West Campus',
        'city', 'Secunderabad',
        'summary', 'Secondary campus for primary and middle school intake.',
        'active', true
      )
    ),
    (
      'seed_edu_program_class6',
      'program_offerings',
      'program_offering_id',
      'prog-edu-0001',
      jsonb_build_object(
        'program_offering_id', 'PROG-EDU-0001',
        'academic_year_id', 'AY-2027',
        'campus_id', 'CAMPUS-HYD-MAIN',
        'program_name', 'Class 6 Admission',
        'duration_label', 'Academic year',
        'level', 'school',
        'eligibility_summary', 'Student must have completed Class 5 from a recognized board.',
        'application_fee_amount_minor', 150000,
        'admission_status', 'open'
      )
    ),
    (
      'seed_edu_program_bba',
      'program_offerings',
      'program_offering_id',
      'prog-edu-0002',
      jsonb_build_object(
        'program_offering_id', 'PROG-EDU-0002',
        'academic_year_id', 'AY-2027',
        'campus_id', 'CAMPUS-HYD-MAIN',
        'program_name', 'BBA',
        'duration_label', '3 years',
        'level', 'college',
        'eligibility_summary', 'Minimum 60 percent in Class 12.',
        'application_fee_amount_minor', 250000,
        'admission_status', 'open'
      )
    ),
    (
      'seed_edu_rule_class6',
      'admission_rules',
      'rule_id',
      'rule-edu-0001',
      jsonb_build_object(
        'rule_id', 'RULE-EDU-0001',
        'program_offering_id', 'PROG-EDU-0001',
        'applicant_type', 'guardian_for_student',
        'admission_open', true,
        'age_min_years', 10,
        'age_max_years', 12,
        'minimum_percentage', 50,
        'required_qualification', 'Class 5 completed',
        'notes', 'Internal assessment after shortlisting.'
      )
    ),
    (
      'seed_edu_rule_bba',
      'admission_rules',
      'rule_id',
      'rule-edu-0002',
      jsonb_build_object(
        'rule_id', 'RULE-EDU-0002',
        'program_offering_id', 'PROG-EDU-0002',
        'applicant_type', 'student_self',
        'admission_open', true,
        'minimum_percentage', 60,
        'required_qualification', 'Class 12 completed',
        'notes', 'Merit plus counsellor interaction.'
      )
    ),
    (
      'seed_edu_fee_class6',
      'fee_structures',
      'fee_structure_id',
      'fee-edu-0001',
      jsonb_build_object(
        'fee_structure_id', 'FEE-EDU-0001',
        'program_offering_id', 'PROG-EDU-0001',
        'academic_year_id', 'AY-2027',
        'tuition_fee_minor', 4800000,
        'admission_fee_minor', 800000,
        'academic_fee_minor', 1200000,
        'application_fee_amount_minor', 150000,
        'currency', 'INR'
      )
    ),
    (
      'seed_edu_fee_bba',
      'fee_structures',
      'fee_structure_id',
      'fee-edu-0002',
      jsonb_build_object(
        'fee_structure_id', 'FEE-EDU-0002',
        'program_offering_id', 'PROG-EDU-0002',
        'academic_year_id', 'AY-2027',
        'tuition_fee_minor', 12000000,
        'admission_fee_minor', 1500000,
        'academic_fee_minor', 2500000,
        'application_fee_amount_minor', 250000,
        'currency', 'INR'
      )
    ),
    (
      'seed_edu_scholarship_class6',
      'scholarship_rules',
      'scholarship_rule_id',
      'sch-edu-0001',
      jsonb_build_object(
        'scholarship_rule_id', 'SCH-EDU-0001',
        'program_offering_id', 'PROG-EDU-0001',
        'scholarship_name', 'Merit Scholarship',
        'minimum_percentage', 85,
        'benefit_summary', 'Up to 15 percent tuition support.',
        'status', 'active'
      )
    ),
    (
      'seed_edu_document_birth_certificate',
      'document_requirements',
      'requirement_id',
      'docreq-edu-0001',
      jsonb_build_object(
        'requirement_id', 'DOCREQ-EDU-0001',
        'program_offering_id', 'PROG-EDU-0001',
        'document_name', 'Birth Certificate',
        'required', true,
        'verification_method', 'manual_review'
      )
    ),
    (
      'seed_edu_document_transfer_certificate',
      'document_requirements',
      'requirement_id',
      'docreq-edu-0002',
      jsonb_build_object(
        'requirement_id', 'DOCREQ-EDU-0002',
        'program_offering_id', 'PROG-EDU-0001',
        'document_name', 'Transfer Certificate',
        'required', true,
        'verification_method', 'ocr_plus_manual'
      )
    ),
    (
      'seed_edu_application_draft',
      'applications',
      'application_id',
      'admapp-edu-0001',
      jsonb_build_object(
        'application_id', 'ADMAPP-EDU-0001',
        'application_number', 'NSA-2027-0001',
        'applicant_id', 'APP-EDU-0001',
        'guardian_id', 'GDN-EDU-0001',
        'applicant_user_type', 'guardian_for_student',
        'contact_mobile', '+919100011111',
        'contact_email', 'kavitha.menon@example.edu',
        'student_name', 'Ishaan Menon',
        'guardian_name', 'Kavitha Menon',
        'academic_year_id', 'AY-2027',
        'academic_year_label', '2027-2028',
        'campus_id', 'CAMPUS-HYD-MAIN',
        'campus_name', 'Northstar Main Campus',
        'program_offering_id', 'PROG-EDU-0001',
        'program_name', 'Class 6 Admission',
        'status', 'draft',
        'stage', 'documents_pending',
        'eligibility_status', 'eligible',
        'document_status', 'pending',
        'payment_status', 'pending',
        'application_fee_amount_minor', 150000,
        'application_fee_display', 'INR 1500'
      )
    ),
    (
      'seed_edu_application_submitted',
      'applications',
      'application_id',
      'admapp-edu-0002',
      jsonb_build_object(
        'application_id', 'ADMAPP-EDU-0002',
        'application_number', 'NSA-2027-0002',
        'applicant_id', 'APP-EDU-0001',
        'guardian_id', 'GDN-EDU-0001',
        'applicant_user_type', 'guardian_for_student',
        'contact_mobile', '+919100011111',
        'contact_email', 'kavitha.menon@example.edu',
        'student_name', 'Ishaan Menon',
        'guardian_name', 'Kavitha Menon',
        'academic_year_id', 'AY-2027',
        'academic_year_label', '2027-2028',
        'campus_id', 'CAMPUS-HYD-MAIN',
        'campus_name', 'Northstar Main Campus',
        'program_offering_id', 'PROG-EDU-0001',
        'program_name', 'Class 6 Admission',
        'status', 'submitted',
        'stage', 'visit_scheduled',
        'eligibility_status', 'eligible',
        'document_status', 'verified',
        'payment_status', 'paid',
        'application_fee_amount_minor', 150000,
        'application_fee_display', 'INR 1500'
      )
    ),
    (
      'seed_edu_document_birth_uploaded',
      'application_documents',
      'application_document_id',
      'appdoc-edu-0001',
      jsonb_build_object(
        'application_document_id', 'APPDOC-EDU-0001',
        'application_id', 'ADMAPP-EDU-0001',
        'requirement_id', 'DOCREQ-EDU-0001',
        'document_type', 'birth_certificate',
        'upload_status', 'uploaded',
        'processing_status', 'processed',
        'verification_status', 'verified',
        'extraction_status', 'success'
      )
    ),
    (
      'seed_edu_document_tc_pending',
      'application_documents',
      'application_document_id',
      'appdoc-edu-0002',
      jsonb_build_object(
        'application_document_id', 'APPDOC-EDU-0002',
        'application_id', 'ADMAPP-EDU-0001',
        'requirement_id', 'DOCREQ-EDU-0002',
        'document_type', 'transfer_certificate',
        'upload_status', 'uploaded',
        'processing_status', 'processed',
        'verification_status', 'manual_review',
        'extraction_status', 'partial'
      )
    ),
    (
      'seed_edu_payment_submitted',
      'application_payments',
      'payment_id',
      'pay-edu-0001',
      jsonb_build_object(
        'payment_id', 'PAY-EDU-0001',
        'application_id', 'ADMAPP-EDU-0002',
        'amount', 150000,
        'currency', 'INR',
        'provider', 'razorpay',
        'provider_reference', 'rzp_demo_edu_0001',
        'purpose', 'application_fee',
        'status', 'paid'
      )
    ),
    (
      'seed_edu_slot_visit_1',
      'admission_slots',
      'slot_id',
      'slot-edu-visit-0001',
      jsonb_build_object(
        'slot_id', 'SLOT-EDU-VISIT-0001',
        'campus_id', 'CAMPUS-HYD-MAIN',
        'slot_type', 'campus_visit',
        'date', '2026-09-08',
        'start', '10:00',
        'end', '10:45',
        'label', 'Tuesday 10:00 AM',
        'status', 'available'
      )
    ),
    (
      'seed_edu_slot_call_1',
      'admission_slots',
      'slot_id',
      'slot-edu-call-0001',
      jsonb_build_object(
        'slot_id', 'SLOT-EDU-CALL-0001',
        'campus_id', 'CAMPUS-HYD-MAIN',
        'slot_type', 'counsellor_call',
        'date', '2026-09-09',
        'start', '15:00',
        'end', '15:45',
        'label', 'Wednesday 3:00 PM',
        'status', 'available'
      )
    ),
    (
      'seed_edu_visit_appointment',
      'admission_appointments',
      'appointment_id',
      'appt-edu-0001',
      jsonb_build_object(
        'appointment_id', 'APPT-EDU-0001',
        'application_id', 'ADMAPP-EDU-0002',
        'slot_id', 'SLOT-EDU-VISIT-0001',
        'appointment_type', 'campus_visit',
        'status', 'scheduled',
        'scheduled_start_at', '2026-09-08T10:00:00.000Z',
        'scheduled_end_at', '2026-09-08T10:45:00.000Z'
      )
    ),
    (
      'seed_edu_status_created',
      'application_status_history',
      'history_id',
      'hist-edu-0001',
      jsonb_build_object(
        'history_id', 'HIST-EDU-0001',
        'application_id', 'ADMAPP-EDU-0002',
        'from_status', '',
        'to_status', 'draft',
        'reason_code', 'application_created'
      )
    ),
    (
      'seed_edu_status_submitted',
      'application_status_history',
      'history_id',
      'hist-edu-0002',
      jsonb_build_object(
        'history_id', 'HIST-EDU-0002',
        'application_id', 'ADMAPP-EDU-0002',
        'from_status', 'draft',
        'to_status', 'submitted',
        'reason_code', 'application_fee_paid'
      )
    ),
    (
      'seed_edu_scholarship_assessment',
      'scholarship_assessments',
      'assessment_id',
      'assess-edu-0001',
      jsonb_build_object(
        'assessment_id', 'ASSESS-EDU-0001',
        'application_id', 'ADMAPP-EDU-0002',
        'eligibility_status', 'preliminarily_eligible',
        'assessment_summary', 'Strong academic record, pending staff verification.'
      )
    ),

    (
      'seed_re_contact_rahul',
      'real_estate_contacts',
      'phone_e164',
      'phone:9876543210',
      jsonb_build_object(
        'contact_id', 'CNT-9876543210',
        'full_name', 'Rahul Verma',
        'phone_e164', '+919876543210',
        'email', 'rahul.verma@example.com',
        'last_requirement_summary', '3 BHK Apartment in Kokapet within INR 1 Cr to INR 1.5 Cr',
        'last_preferred_location', 'Kokapet'
      )
    ),
    (
      'seed_re_contact_aisha',
      'real_estate_contacts',
      'phone_e164',
      'phone:9123456780',
      jsonb_build_object(
        'contact_id', 'CNT-9123456780',
        'full_name', 'Aisha Khan',
        'phone_e164', '+919123456780',
        'email', 'aisha.khan@example.com',
        'last_requirement_summary', '4 BHK Villa in Tellapur within INR 1.5 Cr to INR 2 Cr',
        'last_preferred_location', 'Tellapur'
      )
    ),
    (
      'seed_re_lead_rahul',
      'real_estate_leads',
      'lead_id',
      'ld-re-0001',
      jsonb_build_object(
        'lead_id', 'LD-RE-0001',
        'contact_id', 'CNT-9876543210',
        'buyer_mobile', '+919876543210',
        'buyer_name', 'Rahul Verma',
        'buyer_email', 'rahul.verma@example.com',
        'source_channel', 'WHATSAPP',
        'status', 'open',
        'stage', 'site_visit_booked',
        'preferred_location', 'Kokapet',
        'budget_min_minor', 1000000000,
        'budget_max_minor', 1500000000,
        'budget_range_label', 'INR 1 Cr - INR 1.5 Cr',
        'property_type', 'Apartment',
        'bhk', '3 BHK',
        'purchase_purpose', 'Self Use',
        'purchase_timeline', '1-3 Months',
        'selected_project_id', 'PRJ-KOK-001',
        'selected_project_name', 'Skyline One Kokapet',
        'site_visit_id', 'SV-RE-0001',
        'site_visit_status', 'confirmed'
      )
    ),
    (
      'seed_re_lead_aisha',
      'real_estate_leads',
      'lead_id',
      'ld-re-0002',
      jsonb_build_object(
        'lead_id', 'LD-RE-0002',
        'contact_id', 'CNT-9123456780',
        'buyer_mobile', '+919123456780',
        'buyer_name', 'Aisha Khan',
        'buyer_email', 'aisha.khan@example.com',
        'source_channel', 'WEB',
        'status', 'nurture',
        'stage', 'brochure_shared',
        'preferred_location', 'Tellapur',
        'budget_min_minor', 1500000000,
        'budget_max_minor', 2000000000,
        'budget_range_label', 'INR 1.5 Cr - INR 2 Cr',
        'property_type', 'Villa',
        'bhk', '4 BHK',
        'purchase_purpose', 'Investment',
        'purchase_timeline', '3-6 Months',
        'selected_project_id', 'PRJ-TEL-001',
        'selected_project_name', 'Tellapur Garden Villas',
        'site_visit_id', '',
        'site_visit_status', ''
      )
    ),
    (
      'seed_re_project_skyline',
      'property_inventory',
      'project_id',
      'prj-kok-001',
      jsonb_build_object(
        'project_id', 'PRJ-KOK-001',
        'project_code', 'RE-KOK-01',
        'project_name', 'Skyline One Kokapet',
        'location', 'Kokapet',
        'property_type', 'Apartment',
        'bhk_options', '2 BHK,3 BHK,4 BHK',
        'min_price_minor', 1080000000,
        'max_price_minor', 1480000000,
        'brochure_url', 'https://example.com/brochures/skyline-one-kokapet.pdf',
        'image_url', 'https://example.com/images/skyline-one-kokapet.jpg',
        'location_url', 'https://maps.example.com/skyline-one-kokapet',
        'sales_owner_name', 'Priya Reddy',
        'sales_owner_phone', '+919900045111',
        'sales_owner_email', 'priya.reddy@example.com',
        'active', true
      )
    ),
    (
      'seed_re_project_altavista',
      'property_inventory',
      'project_id',
      'prj-kok-002',
      jsonb_build_object(
        'project_id', 'PRJ-KOK-002',
        'project_code', 'RE-KOK-02',
        'project_name', 'Alta Vista Residences',
        'location', 'Kokapet',
        'property_type', 'Apartment',
        'bhk_options', '3 BHK,4 BHK',
        'min_price_minor', 1180000000,
        'max_price_minor', 1720000000,
        'brochure_url', 'https://example.com/brochures/alta-vista-residences.pdf',
        'image_url', 'https://example.com/images/alta-vista-residences.jpg',
        'location_url', 'https://maps.example.com/alta-vista-residences',
        'sales_owner_name', 'Priya Reddy',
        'sales_owner_phone', '+919900045111',
        'sales_owner_email', 'priya.reddy@example.com',
        'active', true
      )
    ),
    (
      'seed_re_project_tellapur_villas',
      'property_inventory',
      'project_id',
      'prj-tel-001',
      jsonb_build_object(
        'project_id', 'PRJ-TEL-001',
        'project_code', 'RE-TEL-01',
        'project_name', 'Tellapur Garden Villas',
        'location', 'Tellapur',
        'property_type', 'Villa',
        'bhk_options', '3 BHK,4 BHK',
        'min_price_minor', 1820000000,
        'max_price_minor', 2450000000,
        'brochure_url', 'https://example.com/brochures/tellapur-garden-villas.pdf',
        'image_url', 'https://example.com/images/tellapur-garden-villas.jpg',
        'location_url', 'https://maps.example.com/tellapur-garden-villas',
        'sales_owner_name', 'Nikhil Arora',
        'sales_owner_phone', '+919900045333',
        'sales_owner_email', 'nikhil.arora@example.com',
        'active', true
      )
    ),
    (
      'seed_re_interest_rahul',
      'real_estate_lead_project_interests',
      'interest_id',
      'int-re-0001',
      jsonb_build_object(
        'interest_id', 'INT-RE-0001',
        'lead_id', 'LD-RE-0001',
        'project_id', 'PRJ-KOK-001',
        'project_name', 'Skyline One Kokapet',
        'brochure_requested', true,
        'shortlisted', true,
        'site_visit_requested', true,
        'site_visit_id', 'SV-RE-0001'
      )
    ),
    (
      'seed_re_activity_rahul',
      'real_estate_lead_activities',
      'activity_id',
      'act-re-0001',
      jsonb_build_object(
        'activity_id', 'ACT-RE-0001',
        'lead_id', 'LD-RE-0001',
        'contact_id', 'CNT-9876543210',
        'project_id', 'PRJ-KOK-001',
        'activity_type', 'site_visit_confirmed',
        'channel', 'WHATSAPP',
        'summary', 'Skyline One Kokapet site visit confirmed for 2026-09-12 10:30'
      )
    ),
    (
      'seed_re_slot_skyline_1030',
      'real_estate_site_visit_slots',
      'slot_id',
      'slot-prj-kok-001-2026-09-12-1030',
      jsonb_build_object(
        'slot_id', 'SLOT-PRJ-KOK-001-2026-09-12-1030',
        'project_id', 'PRJ-KOK-001',
        'date', '2026-09-12',
        'start', '10:30',
        'end', '11:30',
        'label', 'Saturday 10:30 AM',
        'status', 'confirmed',
        'hold_id', 'HOLD-RE-0001',
        'held_by_session', 'seed',
        'hold_expires_at', '2026-09-12T10:20:00.000Z'
      )
    ),
    (
      'seed_re_slot_skyline_1530',
      'real_estate_site_visit_slots',
      'slot_id',
      'slot-prj-kok-001-2026-09-12-1530',
      jsonb_build_object(
        'slot_id', 'SLOT-PRJ-KOK-001-2026-09-12-1530',
        'project_id', 'PRJ-KOK-001',
        'date', '2026-09-12',
        'start', '15:30',
        'end', '16:30',
        'label', 'Saturday 3:30 PM',
        'status', 'available',
        'hold_id', '',
        'held_by_session', '',
        'hold_expires_at', ''
      )
    ),
    (
      'seed_re_slot_tellapur_1200',
      'real_estate_site_visit_slots',
      'slot_id',
      'slot-prj-tel-001-2026-09-13-1200',
      jsonb_build_object(
        'slot_id', 'SLOT-PRJ-TEL-001-2026-09-13-1200',
        'project_id', 'PRJ-TEL-001',
        'date', '2026-09-13',
        'start', '12:00',
        'end', '13:00',
        'label', 'Sunday 12:00 PM',
        'status', 'available',
        'hold_id', '',
        'held_by_session', '',
        'hold_expires_at', ''
      )
    ),
    (
      'seed_re_visit_hold_rahul',
      'real_estate_site_visit_holds',
      'hold_id',
      'hold-re-0001',
      jsonb_build_object(
        'hold_id', 'HOLD-RE-0001',
        'lead_id', 'LD-RE-0001',
        'slot_id', 'SLOT-PRJ-KOK-001-2026-09-12-1030',
        'project_id', 'PRJ-KOK-001',
        'session_id', 'seed',
        'status', 'converted',
        'expires_at', '2026-09-12T10:20:00.000Z'
      )
    ),
    (
      'seed_re_site_visit_rahul',
      'real_estate_site_visits',
      'site_visit_id',
      'sv-re-0001',
      jsonb_build_object(
        'site_visit_id', 'SV-RE-0001',
        'lead_id', 'LD-RE-0001',
        'contact_id', 'CNT-9876543210',
        'project_id', 'PRJ-KOK-001',
        'project_name', 'Skyline One Kokapet',
        'slot_id', 'SLOT-PRJ-KOK-001-2026-09-12-1030',
        'visit_date', '2026-09-12',
        'visit_time', '10:30',
        'visit_datetime', '2026-09-12T10:30:00.000Z',
        'source_channel', 'WHATSAPP',
        'status', 'confirmed',
        'assigned_salesperson_name', 'Priya Reddy',
        'assigned_salesperson_phone', '+919900045111'
      )
    ),
    (
      'seed_re_followup_rahul',
      'real_estate_followup_jobs',
      'followup_id',
      'follow-re-0001',
      jsonb_build_object(
        'followup_id', 'FOLLOW-RE-0001',
        'lead_id', 'LD-RE-0001',
        'project_id', 'PRJ-KOK-001',
        'followup_type', 'site_visit_reminder_24h',
        'scheduled_for', '2026-09-11T10:30:00.000Z',
        'channel', 'whatsapp',
        'status', 'scheduled'
      )
    ),
    (
      'seed_re_crm_sync_rahul',
      'real_estate_crm_sync_jobs',
      'sync_job_id',
      'crm-re-0001',
      jsonb_build_object(
        'sync_job_id', 'CRM-RE-0001',
        'lead_id', 'LD-RE-0001',
        'entity_type', 'lead',
        'operation', 'upsert',
        'crm_provider', 'generic_crm',
        'status', 'pending',
        'payload_summary', 'Rahul Verma | Skyline One Kokapet | Visit 2026-09-12 10:30'
      )
    ),

    (
      'seed_hotel_guest_nisha',
      'hotel_guest_profiles',
      'normalized_phone',
      'phone:9555511111',
      jsonb_build_object(
        'guest_id', 'GST-HOTEL-0001',
        'guest_code', 'GST-9555511111',
        'full_name', 'Nisha Kapoor',
        'normalized_phone', '+919555511111',
        'email', 'nisha.kapoor@example.com',
        'country_code', 'IN',
        'preferred_language', 'en',
        'saved_preferences', 'breakfast_included',
        'special_request_notes', 'Late evening arrival.',
        'last_stay_at', '2026-09-16'
      )
    ),
    (
      'seed_hotel_room_deluxe_king',
      'hotel_room_sellable_options',
      'option_id',
      'opt-hotel-0001',
      jsonb_build_object(
        'option_id', 'OPT-HOTEL-0001',
        'property_id', 'PROP-HOTEL-001',
        'property_name', 'Crescora Grand Hotel',
        'property_city', 'Hyderabad',
        'room_type_id', 'ROOMTYPE-DELUXE-KING',
        'room_code', 'deluxe_king',
        'room_name', 'Deluxe King Room',
        'room_description', 'King bed, city view, rain shower, and work desk.',
        'max_adults', 2,
        'max_children', 1,
        'max_occupancy', 3,
        'rooms_available', 5,
        'nightly_rate_minor', 649900,
        'taxes_minor', 82500,
        'fees_minor', 15000,
        'deposit_required_minor', 300000,
        'meal_plan', 'Breakfast Included',
        'rate_plan', 'Flexible',
        'cancellation_policy', 'Free cancellation until 48 hours before check-in.',
        'package_code', '',
        'package_tags', 'family,breakfast',
        'amenity_summary', 'Free Wi-Fi, breakfast, air conditioning, rain shower',
        'active', true
      )
    ),
    (
      'seed_hotel_room_premium_suite',
      'hotel_room_sellable_options',
      'option_id',
      'opt-hotel-0002',
      jsonb_build_object(
        'option_id', 'OPT-HOTEL-0002',
        'property_id', 'PROP-HOTEL-001',
        'property_name', 'Crescora Grand Hotel',
        'property_city', 'Hyderabad',
        'room_type_id', 'ROOMTYPE-PREMIUM-SUITE',
        'room_code', 'premium_suite',
        'room_name', 'Premium Suite',
        'room_description', 'King bed, living area, bathtub, and skyline view.',
        'max_adults', 2,
        'max_children', 2,
        'max_occupancy', 4,
        'rooms_available', 2,
        'nightly_rate_minor', 999900,
        'taxes_minor', 125000,
        'fees_minor', 20000,
        'deposit_required_minor', 500000,
        'meal_plan', 'Breakfast Included',
        'rate_plan', 'Flexible',
        'cancellation_policy', 'Free cancellation until 72 hours before check-in.',
        'package_code', 'ROMANTIC_ESCAPE',
        'package_tags', 'romance,spa,dinner',
        'amenity_summary', 'Breakfast, bathtub, living room, premium view',
        'active', true
      )
    ),
    (
      'seed_hotel_room_family_room',
      'hotel_room_sellable_options',
      'option_id',
      'opt-hotel-0003',
      jsonb_build_object(
        'option_id', 'OPT-HOTEL-0003',
        'property_id', 'PROP-HOTEL-001',
        'property_name', 'Crescora Grand Hotel',
        'property_city', 'Hyderabad',
        'room_type_id', 'ROOMTYPE-FAMILY',
        'room_code', 'family_room',
        'room_name', 'Premium Family Room',
        'room_description', 'Family room with one king bed and one sofa bed.',
        'max_adults', 2,
        'max_children', 2,
        'max_occupancy', 4,
        'rooms_available', 3,
        'nightly_rate_minor', 829900,
        'taxes_minor', 104000,
        'fees_minor', 18000,
        'deposit_required_minor', 350000,
        'meal_plan', 'Breakfast Included',
        'rate_plan', 'Flexible',
        'cancellation_policy', 'Free cancellation until 48 hours before check-in.',
        'package_code', '',
        'package_tags', 'family,child friendly',
        'amenity_summary', 'Breakfast, sofa bed, free Wi-Fi, child-friendly setup',
        'active', true
      )
    ),
    (
      'seed_hotel_package_romantic',
      'hotel_packages',
      'package_id',
      'pkg-hotel-0001',
      jsonb_build_object(
        'package_id', 'PKG-HOTEL-0001',
        'package_code', 'ROMANTIC_ESCAPE',
        'property_id', 'PROP-HOTEL-001',
        'property_name', 'Crescora Grand Hotel',
        'package_name', 'Romantic Escape',
        'package_description', 'Two nights with breakfast, candlelight dinner, and room decoration.',
        'from_amount_minor', 2499900,
        'inclusions_summary', 'Premium room, breakfast, dinner, room decor, late checkout',
        'active', true
      )
    ),
    (
      'seed_hotel_package_family',
      'hotel_packages',
      'package_id',
      'pkg-hotel-0002',
      jsonb_build_object(
        'package_id', 'PKG-HOTEL-0002',
        'package_code', 'FAMILY_FUN',
        'property_id', 'PROP-HOTEL-001',
        'property_name', 'Crescora Grand Hotel',
        'package_name', 'Family Fun Stay',
        'package_description', 'Two nights with breakfast, kids activity access, and airport pickup credit.',
        'from_amount_minor', 2199900,
        'inclusions_summary', 'Family room, breakfast, kids activities, transfer credit',
        'active', true
      )
    ),
    (
      'seed_hotel_quote_active',
      'hotel_booking_quotes',
      'quote_id',
      'qt-hotel-0001',
      jsonb_build_object(
        'quote_id', 'QT-HOTEL-0001',
        'guest_id', 'GST-HOTEL-0001',
        'property_name', 'Crescora Grand Hotel',
        'room_type_id', 'ROOMTYPE-DELUXE-KING',
        'room_name', 'Deluxe King Room',
        'check_in', '2026-10-10',
        'check_out', '2026-10-12',
        'nights', 2,
        'adults', 2,
        'children', 1,
        'rooms_requested', 1,
        'currency', 'INR',
        'subtotal', 1299800,
        'taxes', 165000,
        'fees', 15000,
        'total', 1474800,
        'deposit_required', 300000,
        'balance_due', 1174800,
        'policy_snapshot', 'Free cancellation until 48 hours before check-in.',
        'pricing_snapshot', 'Deluxe King Room for 2 nights with breakfast.',
        'status', 'active',
        'expires_at', '2026-09-15T12:00:00.000Z'
      )
    ),
    (
      'seed_hotel_hold_active',
      'hotel_booking_holds',
      'hold_id',
      'hld-hotel-0001',
      jsonb_build_object(
        'hold_id', 'HLD-HOTEL-0001',
        'hold_code', 'HLD-HOTEL-0001',
        'quote_id', 'QT-HOTEL-0001',
        'guest_id', 'GST-HOTEL-0001',
        'property_name', 'Crescora Grand Hotel',
        'room_type_id', 'ROOMTYPE-DELUXE-KING',
        'room_name', 'Deluxe King Room',
        'check_in', '2026-10-10',
        'check_out', '2026-10-12',
        'rooms_requested', 1,
        'status', 'active',
        'expires_at', '2026-09-15T12:00:00.000Z'
      )
    ),
    (
      'seed_hotel_booking_upcoming',
      'hotel_bookings',
      'booking_id',
      'bkg-hotel-0001',
      jsonb_build_object(
        'booking_id', 'BKG-HOTEL-0001',
        'booking_code', 'CGH-261010-A7K4',
        'guest_id', 'GST-HOTEL-0001',
        'guest_name', 'Nisha Kapoor',
        'guest_phone', '+919555511111',
        'guest_email', 'nisha.kapoor@example.com',
        'property_name', 'Crescora Grand Hotel',
        'room_type_id', 'ROOMTYPE-DELUXE-KING',
        'room_name', 'Deluxe King Room',
        'check_in', '2026-10-10',
        'check_out', '2026-10-12',
        'nights', 2,
        'adults', 2,
        'children', 1,
        'rooms_requested', 1,
        'currency', 'INR',
        'subtotal', 1299800,
        'tax_amount', 165000,
        'fee_amount', 15000,
        'total_amount', 1474800,
        'paid_amount', 300000,
        'balance_amount', 1174800,
        'payment_status', 'partially_paid',
        'status', 'confirmed',
        'quote_id', 'QT-HOTEL-0001',
        'hold_id', 'HLD-HOTEL-0001',
        'package_name', '',
        'cancellation_policy_snapshot', 'Free cancellation until 48 hours before check-in.',
        'special_requests', 'Late evening arrival.',
        'booking_snapshot', 'Deposit paid, balance due at hotel or before arrival.'
      )
    ),
    (
      'seed_hotel_payment_deposit',
      'hotel_payments',
      'payment_id',
      'pay-hotel-0001',
      jsonb_build_object(
        'payment_id', 'PAY-HOTEL-0001',
        'booking_id', 'BKG-HOTEL-0001',
        'hold_id', 'HLD-HOTEL-0001',
        'amount', 300000,
        'currency', 'INR',
        'payment_type', 'deposit',
        'provider', 'razorpay',
        'status', 'paid',
        'provider_reference', 'rzp_hotel_0001',
        'idempotency_key', 'PAY-HOTEL-0001'
      )
    ),
    (
      'seed_hotel_booking_change',
      'hotel_booking_changes',
      'change_id',
      'chg-hotel-0001',
      jsonb_build_object(
        'change_id', 'CHG-HOTEL-0001',
        'booking_id', 'BKG-HOTEL-0001',
        'change_type', 'dates',
        'before_snapshot', '2026-10-09 to 2026-10-11',
        'after_snapshot', '2026-10-10 to 2026-10-12',
        'price_difference', 150000,
        'reason', 'Guest changed check-in by one day.'
      )
    ),
    (
      'seed_hotel_followup_availability',
      'hotel_availability_followups',
      'followup_id',
      'avl-hotel-0001',
      jsonb_build_object(
        'followup_id', 'AVL-HOTEL-0001',
        'property_name', 'Crescora Grand Hotel',
        'check_in', '2026-11-20',
        'check_out', '2026-11-23',
        'adults', 2,
        'children', 2,
        'rooms_requested', 2,
        'request_type', 'book_room',
        'status', 'open'
      )
    ),
    (
      'seed_hotel_transfer_request',
      'hotel_transfer_requests',
      'transfer_id',
      'trf-hotel-0001',
      jsonb_build_object(
        'transfer_id', 'TRF-HOTEL-0001',
        'booking_id', 'BKG-HOTEL-0001',
        'booking_code', 'CGH-261010-A7K4',
        'pickup_type', 'airport_pickup',
        'pickup_location', 'Rajiv Gandhi International Airport',
        'arrival_reference', '6E-411',
        'arrival_datetime', '2026-10-10T18:30:00.000Z',
        'passenger_count', 3,
        'vehicle_preference', 'Sedan',
        'charge_amount', 120000,
        'status', 'confirmed'
      )
    ),
    (
      'seed_hotel_service_request',
      'hotel_service_requests',
      'service_request_id',
      'sr-hotel-0001',
      jsonb_build_object(
        'service_request_id', 'SR-HOTEL-0001',
        'booking_id', 'BKG-HOTEL-0001',
        'booking_code', 'CGH-261010-A7K4',
        'guest_phone', '+919555511111',
        'category', 'housekeeping',
        'request_type', 'additional_towels',
        'description', 'Two extra bath towels requested.',
        'priority', 'normal',
        'status', 'open',
        'room_number', '502',
        'assigned_department', 'housekeeping'
      )
    ),
    (
      'seed_hotel_support_case',
      'hotel_support_cases',
      'support_case_id',
      'iss-hotel-0001',
      jsonb_build_object(
        'support_case_id', 'ISS-HOTEL-0001',
        'booking_id', 'BKG-HOTEL-0001',
        'guest_phone', '+919555511111',
        'department', 'duty_manager',
        'priority', 'high',
        'issue_type', 'room_cleanliness',
        'summary', 'Guest reported that the room was not fully cleaned on arrival.',
        'status', 'open'
      )
    ),
    (
      'seed_hotel_group_lead',
      'hotel_group_booking_leads',
      'group_lead_id',
      'grp-hotel-0001',
      jsonb_build_object(
        'group_lead_id', 'GRP-HOTEL-0001',
        'company_name', 'Vertex Systems',
        'contact_name', 'Rakesh Babu',
        'phone', '+919444411111',
        'email', 'rakesh.babu@vertexsystems.example.com',
        'property_name', 'Crescora Grand Hotel',
        'check_in', '2026-11-05',
        'check_out', '2026-11-07',
        'rooms_required', 12,
        'guest_count', 24,
        'room_mix', '8 deluxe, 4 suite',
        'meal_plan', 'breakfast_and_dinner',
        'event_requirement', 'Conference room plus airport transfers',
        'budget', 'INR 8 lakh total',
        'status', 'open'
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
      WHEN kv.key ILIKE '%phone%' OR kv.key ILIKE '%mobile%'
        THEN
          CASE
            WHEN right(
              regexp_replace(
                CASE
                  WHEN jsonb_typeof(kv.value) = 'string' THEN trim(both '"' from kv.value::text)
                  ELSE kv.value::text
                END,
                '[^0-9]',
                '',
                'g'
              ),
              10
            ) = ''
              THEN ''
            ELSE 'phone:' || right(
              regexp_replace(
                CASE
                  WHEN jsonb_typeof(kv.value) = 'string' THEN trim(both '"' from kv.value::text)
                  ELSE kv.value::text
                END,
                '[^0-9]',
                '',
                'g'
              ),
              10
            )
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
  COUNT(*) FILTER (WHERE seed_records.collection IN (
    'patients', 'appointments', 'appointment_slots', 'consent_records', 'payments',
    'lab_reports', 'lab_requests', 'support_tickets', 'feedback_cases',
    'insurance_cases', 'admissions', 'follow_ups', 'doctors'
  )) AS hospital_records_seeded,
  COUNT(*) FILTER (WHERE seed_records.collection IN (
    'guardians', 'applicants', 'applicant_guardians', 'academic_years', 'campuses',
    'program_offerings', 'admission_rules', 'fee_structures', 'scholarship_rules',
    'scholarship_assessments', 'document_requirements', 'applications',
    'application_documents', 'application_payments', 'admission_slots',
    'admission_appointments', 'application_status_history'
  )) AS education_records_seeded,
  COUNT(*) FILTER (WHERE seed_records.collection IN (
    'real_estate_contacts', 'real_estate_leads', 'property_inventory',
    'real_estate_lead_project_interests', 'real_estate_lead_activities',
    'real_estate_site_visit_slots', 'real_estate_site_visit_holds',
    'real_estate_site_visits', 'real_estate_followup_jobs', 'real_estate_crm_sync_jobs'
  )) AS real_estate_records_seeded,
  COUNT(*) FILTER (WHERE seed_records.collection IN (
    'hotel_guest_profiles', 'hotel_room_sellable_options', 'hotel_packages',
    'hotel_booking_quotes', 'hotel_booking_holds', 'hotel_bookings',
    'hotel_payments', 'hotel_booking_changes', 'hotel_availability_followups',
    'hotel_transfer_requests', 'hotel_service_requests', 'hotel_support_cases',
    'hotel_group_booking_leads'
  )) AS hotel_records_seeded
FROM params
CROSS JOIN seed_records
GROUP BY params.tenant_id;

COMMIT;
