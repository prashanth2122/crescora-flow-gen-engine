-- Financial-services demo seed for the FLOW record store.
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
--          'loan_customers',
--          'loan_products',
--          'loan_product_guidelines',
--          'loan_document_rules',
--          'loan_leads',
--          'loan_lead_profiles',
--          'loan_prequalification_runs',
--          'loan_lead_documents',
--          'loan_advisor_slots',
--          'loan_slot_holds',
--          'loan_appointments',
--          'loan_followup_jobs',
--          'loan_status_history',
--          'integration_outbox'
--        )
--      GROUP BY "collection"
--      ORDER BY "collection";
--   3. Run against the same PostgreSQL database used by the records runtime.
--      This script writes to the shared `public` schema.
--      PowerShell example:
--      psql $env:DATABASE_URL -f .\scripts\seed-demo-financial-services-records.sql
--
-- Date note:
--   This file is aligned to Tuesday, August 25, 2026.
--   Advisor slots on August 26, August 27, and August 28, 2026 are intentionally in the future.

BEGIN;

SET search_path TO public;

WITH params AS (
  SELECT
    '8285edc4-af68-46c0-9e72-5b2819cb33d9'::text AS tenant_id,
    'seed-demo-financial-services-records'::text AS source_tag
),
schemas (collection, schema_json) AS (
  VALUES
    (
      'loan_customers',
      $${
        "collection": "loan_customers",
        "fields": {
          "customer_id": { "type": "string", "required": true, "unique": true },
          "full_name": { "type": "string", "required": true },
          "phone_e164": { "type": "phone", "required": true, "unique": true },
          "email": { "type": "email", "required": false },
          "city": { "type": "string", "required": false },
          "preferred_language": { "type": "string", "required": false },
          "latest_active_lead_id": { "type": "string", "required": false },
          "latest_product_code": { "type": "string", "required": false },
          "latest_status": { "type": "string", "required": false }
        }
      }$$::jsonb
    ),
    (
      'loan_products',
      $${
        "collection": "loan_products",
        "fields": {
          "product_id": { "type": "string", "required": true, "unique": true },
          "product_code": { "type": "string", "required": true, "unique": true },
          "product_name": { "type": "string", "required": true },
          "description": { "type": "string", "required": true },
          "min_amount_minor": { "type": "number", "required": false },
          "max_amount_minor": { "type": "number", "required": false },
          "min_tenure_years": { "type": "number", "required": false },
          "max_tenure_years": { "type": "number", "required": false },
          "active": { "type": "boolean", "required": true }
        }
      }$$::jsonb
    ),
    (
      'loan_product_guidelines',
      $${
        "collection": "loan_product_guidelines",
        "fields": {
          "rule_id": { "type": "string", "required": true, "unique": true },
          "product_code": { "type": "string", "required": true },
          "employment_type": { "type": "string", "required": true },
          "min_income_minor": { "type": "number", "required": false },
          "max_emi_to_income_ratio_pct": { "type": "number", "required": false },
          "min_amount_minor": { "type": "number", "required": false },
          "max_amount_minor": { "type": "number", "required": false },
          "max_ltv_pct": { "type": "number", "required": false },
          "supported_cities": { "type": "string", "required": false },
          "active": { "type": "boolean", "required": true }
        }
      }$$::jsonb
    ),
    (
      'loan_document_rules',
      $${
        "collection": "loan_document_rules",
        "fields": {
          "rule_id": { "type": "string", "required": true, "unique": true },
          "product_code": { "type": "string", "required": true },
          "employment_type": { "type": "string", "required": true },
          "document_code": { "type": "string", "required": true },
          "document_name": { "type": "string", "required": true },
          "requirement_type": { "type": "string", "required": true },
          "display_order": { "type": "number", "required": true },
          "active": { "type": "boolean", "required": true }
        }
      }$$::jsonb
    ),
    (
      'loan_leads',
      $${
        "collection": "loan_leads",
        "fields": {
          "lead_id": { "type": "string", "required": true, "unique": true },
          "lead_number": { "type": "string", "required": true, "unique": true },
          "customer_id": { "type": "string", "required": true },
          "customer_mobile": { "type": "phone", "required": true },
          "customer_name": { "type": "string", "required": true },
          "customer_email": { "type": "email", "required": false },
          "city": { "type": "string", "required": false },
          "preferred_language": { "type": "string", "required": false },
          "product_code": { "type": "string", "required": true },
          "product_name": { "type": "string", "required": true },
          "requested_amount_minor": { "type": "number", "required": false },
          "requested_amount_display": { "type": "string", "required": false },
          "employment_type": { "type": "string", "required": false },
          "monthly_income_minor": { "type": "number", "required": false },
          "existing_monthly_emi_minor": { "type": "number", "required": false },
          "preferred_tenure_years": { "type": "number", "required": false },
          "loan_purpose": { "type": "string", "required": false },
          "preferred_contact_time": { "type": "string", "required": false },
          "qualification_status": { "type": "string", "required": true },
          "lead_status": { "type": "string", "required": true },
          "lead_priority": { "type": "string", "required": true },
          "lead_score": { "type": "number", "required": false },
          "reason_codes": { "type": "string", "required": false },
          "assigned_advisor_id": { "type": "string", "required": false },
          "assigned_advisor_name": { "type": "string", "required": false },
          "latest_appointment_id": { "type": "string", "required": false },
          "source_channel": { "type": "string", "required": true },
          "source_campaign": { "type": "string", "required": false },
          "conversation_summary": { "type": "string", "required": false },
          "created_at": { "type": "string", "required": false },
          "updated_at": { "type": "string", "required": false }
        }
      }$$::jsonb
    ),
    (
      'loan_lead_profiles',
      $${
        "collection": "loan_lead_profiles",
        "fields": {
          "profile_id": { "type": "string", "required": true, "unique": true },
          "lead_id": { "type": "string", "required": true },
          "product_code": { "type": "string", "required": true },
          "property_value_minor": { "type": "number", "required": false },
          "property_stage": { "type": "string", "required": false },
          "property_type": { "type": "string", "required": false },
          "property_city": { "type": "string", "required": false },
          "co_applicant_available": { "type": "string", "required": false },
          "employer_category": { "type": "string", "required": false },
          "work_experience_years": { "type": "number", "required": false },
          "current_employer_tenure_years": { "type": "number", "required": false },
          "business_type": { "type": "string", "required": false },
          "industry": { "type": "string", "required": false },
          "business_vintage_years": { "type": "number", "required": false },
          "annual_turnover_minor": { "type": "number", "required": false },
          "profitability_range": { "type": "string", "required": false },
          "existing_business_loans": { "type": "string", "required": false }
        }
      }$$::jsonb
    ),
    (
      'loan_prequalification_runs',
      $${
        "collection": "loan_prequalification_runs",
        "fields": {
          "run_id": { "type": "string", "required": true, "unique": true },
          "lead_id": { "type": "string", "required": true },
          "product_code": { "type": "string", "required": true },
          "result": { "type": "string", "required": true },
          "reason_codes": { "type": "string", "required": false },
          "summary_text": { "type": "string", "required": false },
          "created_at": { "type": "string", "required": false }
        }
      }$$::jsonb
    ),
    (
      'loan_lead_documents',
      $${
        "collection": "loan_lead_documents",
        "fields": {
          "lead_document_id": { "type": "string", "required": true, "unique": true },
          "lead_id": { "type": "string", "required": true },
          "customer_id": { "type": "string", "required": true },
          "uploaded_document_count": { "type": "number", "required": true },
          "processing_status": { "type": "string", "required": true },
          "verification_status": { "type": "string", "required": true },
          "extraction_summary": { "type": "string", "required": false }
        }
      }$$::jsonb
    ),
    (
      'loan_advisor_slots',
      $${
        "collection": "loan_advisor_slots",
        "fields": {
          "slot_id": { "type": "string", "required": true, "unique": true },
          "advisor_id": { "type": "string", "required": true },
          "advisor_name": { "type": "string", "required": true },
          "advisor_language": { "type": "string", "required": false },
          "city": { "type": "string", "required": false },
          "product_code": { "type": "string", "required": true },
          "date": { "type": "string", "required": true },
          "start": { "type": "string", "required": true },
          "end": { "type": "string", "required": false },
          "label": { "type": "string", "required": true },
          "status": { "type": "string", "required": true },
          "hold_id": { "type": "string", "required": false },
          "held_by_session": { "type": "string", "required": false },
          "hold_expires_at": { "type": "string", "required": false },
          "appointment_id": { "type": "string", "required": false }
        }
      }$$::jsonb
    ),
    (
      'loan_slot_holds',
      $${
        "collection": "loan_slot_holds",
        "fields": {
          "hold_id": { "type": "string", "required": true, "unique": true },
          "slot_id": { "type": "string", "required": true },
          "lead_id": { "type": "string", "required": true },
          "session_id": { "type": "string", "required": true },
          "status": { "type": "string", "required": true },
          "expires_at": { "type": "string", "required": false }
        }
      }$$::jsonb
    ),
    (
      'loan_appointments',
      $${
        "collection": "loan_appointments",
        "fields": {
          "appointment_id": { "type": "string", "required": true, "unique": true },
          "appointment_number": { "type": "string", "required": true, "unique": true },
          "lead_id": { "type": "string", "required": true },
          "customer_id": { "type": "string", "required": true },
          "advisor_id": { "type": "string", "required": true },
          "advisor_name": { "type": "string", "required": true },
          "slot_id": { "type": "string", "required": true },
          "product_code": { "type": "string", "required": true },
          "appointment_date": { "type": "string", "required": true },
          "appointment_time": { "type": "string", "required": true },
          "appointment_datetime": { "type": "string", "required": true },
          "status": { "type": "string", "required": true }
        }
      }$$::jsonb
    ),
    (
      'loan_followup_jobs',
      $${
        "collection": "loan_followup_jobs",
        "fields": {
          "followup_id": { "type": "string", "required": true, "unique": true },
          "lead_id": { "type": "string", "required": true },
          "appointment_id": { "type": "string", "required": false },
          "job_type": { "type": "string", "required": true },
          "run_at": { "type": "string", "required": false },
          "channel": { "type": "string", "required": true },
          "status": { "type": "string", "required": true }
        }
      }$$::jsonb
    ),
    (
      'loan_status_history',
      $${
        "collection": "loan_status_history",
        "fields": {
          "status_event_id": { "type": "string", "required": true, "unique": true },
          "lead_id": { "type": "string", "required": true },
          "lead_number": { "type": "string", "required": true },
          "from_status": { "type": "string", "required": false },
          "to_status": { "type": "string", "required": true },
          "customer_message": { "type": "string", "required": false },
          "source": { "type": "string", "required": true },
          "created_at": { "type": "string", "required": true }
        }
      }$$::jsonb
    ),
    (
      'integration_outbox',
      $${
        "collection": "integration_outbox",
        "fields": {
          "outbox_event_id": { "type": "string", "required": true, "unique": true },
          "aggregate_type": { "type": "string", "required": true },
          "aggregate_id": { "type": "string", "required": true },
          "event_type": { "type": "string", "required": true },
          "payload_summary": { "type": "string", "required": false },
          "status": { "type": "string", "required": true },
          "attempt_count": { "type": "number", "required": false },
          "next_attempt_at": { "type": "string", "required": false }
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
      'seed_fs_customer_rahul',
      'loan_customers',
      'phone_e164',
      'phone:9876543210',
      jsonb_build_object(
        'customer_id', 'CUST-FS-0001',
        'full_name', 'Rahul Sharma',
        'phone_e164', '+919876543210',
        'email', 'rahul.sharma@example.finance',
        'city', 'Hyderabad',
        'preferred_language', 'Telugu',
        'latest_active_lead_id', 'LEAD-FS-0001',
        'latest_product_code', 'home_loan',
        'latest_status', 'advisor_booked'
      )
    ),
    (
      'seed_fs_customer_neha',
      'loan_customers',
      'phone_e164',
      'phone:9988776655',
      jsonb_build_object(
        'customer_id', 'CUST-FS-0002',
        'full_name', 'Neha Verma',
        'phone_e164', '+919988776655',
        'email', 'neha.verma@example.finance',
        'city', 'Hyderabad',
        'preferred_language', 'English',
        'latest_active_lead_id', 'LEAD-FS-0002',
        'latest_product_code', 'personal_loan',
        'latest_status', 'profile_captured'
      )
    ),
    (
      'seed_fs_product_home',
      'loan_products',
      'product_code',
      'home_loan',
      jsonb_build_object(
        'product_id', 'PROD-FS-HOME',
        'product_code', 'home_loan',
        'product_name', 'Home Loan',
        'description', 'Home loans can generally be used for purchasing a ready property, under-construction property, resale property, or eligible construction purposes.',
        'min_amount_minor', 5000000,
        'max_amount_minor', 1500000000,
        'min_tenure_years', 5,
        'max_tenure_years', 30,
        'active', true
      )
    ),
    (
      'seed_fs_product_personal',
      'loan_products',
      'product_code',
      'personal_loan',
      jsonb_build_object(
        'product_id', 'PROD-FS-PERSONAL',
        'product_code', 'personal_loan',
        'product_name', 'Personal Loan',
        'description', 'Personal loans are usually considered for general personal expenses, subject to lender verification, policy checks, and affordability assessment.',
        'min_amount_minor', 1000000,
        'max_amount_minor', 250000000,
        'min_tenure_years', 1,
        'max_tenure_years', 7,
        'active', true
      )
    ),
    (
      'seed_fs_product_business',
      'loan_products',
      'product_code',
      'business_loan',
      jsonb_build_object(
        'product_id', 'PROD-FS-BUSINESS',
        'product_code', 'business_loan',
        'product_name', 'Business Loan',
        'description', 'Business loans can be considered for working capital, expansion, equipment, or other eligible business purposes after policy and document review.',
        'min_amount_minor', 5000000,
        'max_amount_minor', 500000000,
        'min_tenure_years', 1,
        'max_tenure_years', 10,
        'active', true
      )
    ),
    (
      'seed_fs_guideline_home_salaried',
      'loan_product_guidelines',
      'rule_id',
      'rule-home-salaried',
      jsonb_build_object(
        'rule_id', 'RULE-HOME-SALARIED',
        'product_code', 'home_loan',
        'employment_type', 'salaried',
        'min_income_minor', 3000000,
        'max_emi_to_income_ratio_pct', 45,
        'min_amount_minor', 5000000,
        'max_amount_minor', 1000000000,
        'max_ltv_pct', 85,
        'supported_cities', 'hyderabad|bengaluru|pune',
        'active', true
      )
    ),
    (
      'seed_fs_guideline_personal_salaried',
      'loan_product_guidelines',
      'rule_id',
      'rule-personal-salaried',
      jsonb_build_object(
        'rule_id', 'RULE-PERSONAL-SALARIED',
        'product_code', 'personal_loan',
        'employment_type', 'salaried',
        'min_income_minor', 2500000,
        'max_emi_to_income_ratio_pct', 50,
        'min_amount_minor', 1000000,
        'max_amount_minor', 150000000,
        'max_ltv_pct', 0,
        'supported_cities', 'hyderabad|bengaluru|pune',
        'active', true
      )
    ),
    (
      'seed_fs_guideline_business_business',
      'loan_product_guidelines',
      'rule_id',
      'rule-business-business',
      jsonb_build_object(
        'rule_id', 'RULE-BUSINESS-BUSINESS',
        'product_code', 'business_loan',
        'employment_type', 'business',
        'min_income_minor', 5000000,
        'max_emi_to_income_ratio_pct', 45,
        'min_amount_minor', 5000000,
        'max_amount_minor', 500000000,
        'max_ltv_pct', 0,
        'supported_cities', 'hyderabad|bengaluru|pune',
        'active', true
      )
    ),
    (
      'seed_fs_doc_home_pan',
      'loan_document_rules',
      'rule_id',
      'rule-home-pan',
      jsonb_build_object(
        'rule_id', 'RULE-HOME-PAN',
        'product_code', 'home_loan',
        'employment_type', 'salaried',
        'document_code', 'pan',
        'document_name', 'PAN or equivalent identity document',
        'requirement_type', 'required',
        'display_order', 1,
        'active', true
      )
    ),
    (
      'seed_fs_doc_home_address',
      'loan_document_rules',
      'rule_id',
      'rule-home-address',
      jsonb_build_object(
        'rule_id', 'RULE-HOME-ADDRESS',
        'product_code', 'home_loan',
        'employment_type', 'salaried',
        'document_code', 'address_proof',
        'document_name', 'Address proof',
        'requirement_type', 'required',
        'display_order', 2,
        'active', true
      )
    ),
    (
      'seed_fs_doc_home_salary',
      'loan_document_rules',
      'rule_id',
      'rule-home-salary',
      jsonb_build_object(
        'rule_id', 'RULE-HOME-SALARY',
        'product_code', 'home_loan',
        'employment_type', 'salaried',
        'document_code', 'salary_slips',
        'document_name', 'Recent salary slips',
        'requirement_type', 'required',
        'display_order', 3,
        'active', true
      )
    ),
    (
      'seed_fs_doc_home_bank',
      'loan_document_rules',
      'rule_id',
      'rule-home-bank',
      jsonb_build_object(
        'rule_id', 'RULE-HOME-BANK',
        'product_code', 'home_loan',
        'employment_type', 'salaried',
        'document_code', 'bank_statements',
        'document_name', 'Salary-credit bank statements',
        'requirement_type', 'required',
        'display_order', 4,
        'active', true
      )
    ),
    (
      'seed_fs_doc_home_form16',
      'loan_document_rules',
      'rule_id',
      'rule-home-form16',
      jsonb_build_object(
        'rule_id', 'RULE-HOME-FORM16',
        'product_code', 'home_loan',
        'employment_type', 'salaried',
        'document_code', 'form16',
        'document_name', 'Income-tax or Form 16 documents where applicable',
        'requirement_type', 'required',
        'display_order', 5,
        'active', true
      )
    ),
    (
      'seed_fs_doc_home_property',
      'loan_document_rules',
      'rule_id',
      'rule-home-property',
      jsonb_build_object(
        'rule_id', 'RULE-HOME-PROPERTY',
        'product_code', 'home_loan',
        'employment_type', 'salaried',
        'document_code', 'property_documents',
        'document_name', 'Property-related documents depending on the transaction stage',
        'requirement_type', 'required',
        'display_order', 6,
        'active', true
      )
    ),
    (
      'seed_fs_doc_personal_pan',
      'loan_document_rules',
      'rule_id',
      'rule-personal-pan',
      jsonb_build_object(
        'rule_id', 'RULE-PERSONAL-PAN',
        'product_code', 'personal_loan',
        'employment_type', 'salaried',
        'document_code', 'pan',
        'document_name', 'PAN or equivalent identity document',
        'requirement_type', 'required',
        'display_order', 1,
        'active', true
      )
    ),
    (
      'seed_fs_doc_personal_salary',
      'loan_document_rules',
      'rule_id',
      'rule-personal-salary',
      jsonb_build_object(
        'rule_id', 'RULE-PERSONAL-SALARY',
        'product_code', 'personal_loan',
        'employment_type', 'salaried',
        'document_code', 'salary_slips',
        'document_name', 'Recent salary slips',
        'requirement_type', 'required',
        'display_order', 2,
        'active', true
      )
    ),
    (
      'seed_fs_doc_personal_bank',
      'loan_document_rules',
      'rule_id',
      'rule-personal-bank',
      jsonb_build_object(
        'rule_id', 'RULE-PERSONAL-BANK',
        'product_code', 'personal_loan',
        'employment_type', 'salaried',
        'document_code', 'bank_statements',
        'document_name', 'Recent bank statements',
        'requirement_type', 'required',
        'display_order', 3,
        'active', true
      )
    ),
    (
      'seed_fs_doc_business_pan',
      'loan_document_rules',
      'rule_id',
      'rule-business-pan',
      jsonb_build_object(
        'rule_id', 'RULE-BUSINESS-PAN',
        'product_code', 'business_loan',
        'employment_type', 'business',
        'document_code', 'pan',
        'document_name', 'PAN and business identity proof',
        'requirement_type', 'required',
        'display_order', 1,
        'active', true
      )
    ),
    (
      'seed_fs_doc_business_itr',
      'loan_document_rules',
      'rule_id',
      'rule-business-itr',
      jsonb_build_object(
        'rule_id', 'RULE-BUSINESS-ITR',
        'product_code', 'business_loan',
        'employment_type', 'business',
        'document_code', 'itr',
        'document_name', 'Latest ITR and financial statements',
        'requirement_type', 'required',
        'display_order', 2,
        'active', true
      )
    ),
    (
      'seed_fs_doc_business_bank',
      'loan_document_rules',
      'rule_id',
      'rule-business-bank',
      jsonb_build_object(
        'rule_id', 'RULE-BUSINESS-BANK',
        'product_code', 'business_loan',
        'employment_type', 'business',
        'document_code', 'bank_statements',
        'document_name', 'Business bank statements',
        'requirement_type', 'required',
        'display_order', 3,
        'active', true
      )
    ),
    (
      'seed_fs_lead_rahul',
      'loan_leads',
      'lead_id',
      'lead-fs-0001',
      jsonb_build_object(
        'lead_id', 'LEAD-FS-0001',
        'lead_number', 'LD-20260825-4821',
        'customer_id', 'CUST-FS-0001',
        'customer_mobile', '+919876543210',
        'customer_name', 'Rahul Sharma',
        'customer_email', 'rahul.sharma@example.finance',
        'city', 'Hyderabad',
        'preferred_language', 'Telugu',
        'product_code', 'home_loan',
        'product_name', 'Home Loan',
        'requested_amount_minor', 400000000,
        'requested_amount_display', '₹40,00,000',
        'employment_type', 'salaried',
        'monthly_income_minor', 12000000,
        'existing_monthly_emi_minor', 1800000,
        'preferred_tenure_years', 20,
        'loan_purpose', 'Property purchase',
        'preferred_contact_time', 'Evening',
        'qualification_status', 'likely_match',
        'lead_status', 'advisor_booked',
        'lead_priority', 'hot',
        'lead_score', 88,
        'reason_codes', '',
        'assigned_advisor_id', 'ADV-HL-001',
        'assigned_advisor_name', 'Arjun',
        'latest_appointment_id', 'APPT-FS-0001',
        'source_channel', 'WEB',
        'source_campaign', 'website_home_loan',
        'conversation_summary', 'Customer: Rahul Sharma\nProduct: Home Loan\nRequested amount: ₹40,00,000\nEmployment: salaried\nMonthly income: ₹1,20,000\nExisting EMI: ₹18,000\nIndicative result: likely_match\nDocuments received: 2\nPreferred contact time: Evening',
        'created_at', '2026-08-25T09:00:00.000Z',
        'updated_at', '2026-08-25T09:20:00.000Z'
      )
    ),
    (
      'seed_fs_lead_neha',
      'loan_leads',
      'lead_id',
      'lead-fs-0002',
      jsonb_build_object(
        'lead_id', 'LEAD-FS-0002',
        'lead_number', 'LD-20260825-5632',
        'customer_id', 'CUST-FS-0002',
        'customer_mobile', '+919988776655',
        'customer_name', 'Neha Verma',
        'customer_email', 'neha.verma@example.finance',
        'city', 'Hyderabad',
        'preferred_language', 'English',
        'product_code', 'personal_loan',
        'product_name', 'Personal Loan',
        'requested_amount_minor', 80000000,
        'requested_amount_display', '₹8,00,000',
        'employment_type', 'salaried',
        'monthly_income_minor', 8500000,
        'existing_monthly_emi_minor', 1500000,
        'preferred_tenure_years', 5,
        'loan_purpose', 'Personal expense',
        'preferred_contact_time', 'Afternoon',
        'qualification_status', 'possible_match',
        'lead_status', 'profile_captured',
        'lead_priority', 'warm',
        'lead_score', 61,
        'reason_codes', 'documents_pending',
        'assigned_advisor_id', '',
        'assigned_advisor_name', '',
        'latest_appointment_id', '',
        'source_channel', 'WHATSAPP',
        'source_campaign', 'personal_loan_campaign',
        'conversation_summary', 'Customer: Neha Verma\nProduct: Personal Loan\nRequested amount: ₹8,00,000\nEmployment: salaried\nMonthly income: ₹85,000\nExisting EMI: ₹15,000\nIndicative result: possible_match\nDocuments received: 0\nPreferred contact time: Afternoon',
        'created_at', '2026-08-25T10:00:00.000Z',
        'updated_at', '2026-08-25T10:10:00.000Z'
      )
    ),
    (
      'seed_fs_profile_rahul',
      'loan_lead_profiles',
      'profile_id',
      'profile-fs-0001',
      jsonb_build_object(
        'profile_id', 'PROFILE-FS-0001',
        'lead_id', 'LEAD-FS-0001',
        'product_code', 'home_loan',
        'property_value_minor', 550000000,
        'property_stage', 'identified',
        'property_type', 'Apartment',
        'property_city', 'Hyderabad',
        'co_applicant_available', 'yes',
        'employer_category', '',
        'work_experience_years', 0,
        'current_employer_tenure_years', 0,
        'business_type', '',
        'industry', '',
        'business_vintage_years', 0,
        'annual_turnover_minor', 0,
        'profitability_range', '',
        'existing_business_loans', ''
      )
    ),
    (
      'seed_fs_profile_neha',
      'loan_lead_profiles',
      'profile_id',
      'profile-fs-0002',
      jsonb_build_object(
        'profile_id', 'PROFILE-FS-0002',
        'lead_id', 'LEAD-FS-0002',
        'product_code', 'personal_loan',
        'property_value_minor', 0,
        'property_stage', '',
        'property_type', '',
        'property_city', '',
        'co_applicant_available', '',
        'employer_category', 'private',
        'work_experience_years', 5,
        'current_employer_tenure_years', 2,
        'business_type', '',
        'industry', '',
        'business_vintage_years', 0,
        'annual_turnover_minor', 0,
        'profitability_range', '',
        'existing_business_loans', ''
      )
    ),
    (
      'seed_fs_prequal_rahul',
      'loan_prequalification_runs',
      'run_id',
      'prequal-fs-0001',
      jsonb_build_object(
        'run_id', 'PREQUAL-FS-0001',
        'lead_id', 'LEAD-FS-0001',
        'product_code', 'home_loan',
        'result', 'likely_match',
        'reason_codes', '',
        'summary_text', 'Your information appears broadly aligned with the initial requirements for this Home Loan product. Final eligibility, pricing, verification, and approval are determined by the authorised lending team.',
        'created_at', '2026-08-25T09:05:00.000Z'
      )
    ),
    (
      'seed_fs_documents_rahul',
      'loan_lead_documents',
      'lead_document_id',
      'doc-fs-0001',
      jsonb_build_object(
        'lead_document_id', 'DOC-FS-0001',
        'lead_id', 'LEAD-FS-0001',
        'customer_id', 'CUST-FS-0001',
        'uploaded_document_count', 2,
        'processing_status', 'processed',
        'verification_status', 'received',
        'extraction_summary', '{"document_type":"salary_slip","employee_name_match":true,"salary_period":"2026-07","confidence":0.93}'
      )
    ),
    (
      'seed_fs_slot_booked_rahul',
      'loan_advisor_slots',
      'slot_id',
      'slot-hl-20260827-1100',
      jsonb_build_object(
        'slot_id', 'SLOT-HL-20260827-1100',
        'advisor_id', 'ADV-HL-001',
        'advisor_name', 'Arjun',
        'advisor_language', 'Telugu',
        'city', 'Hyderabad',
        'product_code', 'home_loan',
        'date', '2026-08-27',
        'start', '11:00',
        'end', '11:30',
        'label', '27 Aug • 11:00 AM',
        'status', 'booked',
        'hold_id', 'HOLD-FS-0001',
        'held_by_session', 'seed',
        'hold_expires_at', '2026-08-25T09:05:00.000Z',
        'appointment_id', 'APPT-FS-0001'
      )
    ),
    (
      'seed_fs_slot_home_1030',
      'loan_advisor_slots',
      'slot_id',
      'slot-hl-20260827-1030',
      jsonb_build_object(
        'slot_id', 'SLOT-HL-20260827-1030',
        'advisor_id', 'ADV-HL-001',
        'advisor_name', 'Arjun',
        'advisor_language', 'Telugu',
        'city', 'Hyderabad',
        'product_code', 'home_loan',
        'date', '2026-08-27',
        'start', '10:30',
        'end', '11:00',
        'label', '27 Aug • 10:30 AM',
        'status', 'available',
        'hold_id', '',
        'held_by_session', '',
        'hold_expires_at', '',
        'appointment_id', ''
      )
    ),
    (
      'seed_fs_slot_home_1400',
      'loan_advisor_slots',
      'slot_id',
      'slot-hl-20260827-1400',
      jsonb_build_object(
        'slot_id', 'SLOT-HL-20260827-1400',
        'advisor_id', 'ADV-HL-001',
        'advisor_name', 'Arjun',
        'advisor_language', 'Telugu',
        'city', 'Hyderabad',
        'product_code', 'home_loan',
        'date', '2026-08-27',
        'start', '14:00',
        'end', '14:30',
        'label', '27 Aug • 2:00 PM',
        'status', 'available',
        'hold_id', '',
        'held_by_session', '',
        'hold_expires_at', '',
        'appointment_id', ''
      )
    ),
    (
      'seed_fs_slot_home_1100_next',
      'loan_advisor_slots',
      'slot_id',
      'slot-hl-20260828-1100',
      jsonb_build_object(
        'slot_id', 'SLOT-HL-20260828-1100',
        'advisor_id', 'ADV-HL-001',
        'advisor_name', 'Arjun',
        'advisor_language', 'Telugu',
        'city', 'Hyderabad',
        'product_code', 'home_loan',
        'date', '2026-08-28',
        'start', '11:00',
        'end', '11:30',
        'label', '28 Aug • 11:00 AM',
        'status', 'available',
        'hold_id', '',
        'held_by_session', '',
        'hold_expires_at', '',
        'appointment_id', ''
      )
    ),
    (
      'seed_fs_slot_personal_1600',
      'loan_advisor_slots',
      'slot_id',
      'slot-pl-20260826-1600',
      jsonb_build_object(
        'slot_id', 'SLOT-PL-20260826-1600',
        'advisor_id', 'ADV-PL-002',
        'advisor_name', 'Sneha',
        'advisor_language', 'English',
        'city', 'Hyderabad',
        'product_code', 'personal_loan',
        'date', '2026-08-26',
        'start', '16:00',
        'end', '16:30',
        'label', '26 Aug • 4:00 PM',
        'status', 'available',
        'hold_id', '',
        'held_by_session', '',
        'hold_expires_at', '',
        'appointment_id', ''
      )
    ),
    (
      'seed_fs_slot_business_1200',
      'loan_advisor_slots',
      'slot_id',
      'slot-bl-20260828-1200',
      jsonb_build_object(
        'slot_id', 'SLOT-BL-20260828-1200',
        'advisor_id', 'ADV-BL-003',
        'advisor_name', 'Karan',
        'advisor_language', 'Hindi',
        'city', 'Hyderabad',
        'product_code', 'business_loan',
        'date', '2026-08-28',
        'start', '12:00',
        'end', '12:30',
        'label', '28 Aug • 12:00 PM',
        'status', 'available',
        'hold_id', '',
        'held_by_session', '',
        'hold_expires_at', '',
        'appointment_id', ''
      )
    ),
    (
      'seed_fs_hold_rahul',
      'loan_slot_holds',
      'hold_id',
      'hold-fs-0001',
      jsonb_build_object(
        'hold_id', 'HOLD-FS-0001',
        'slot_id', 'SLOT-HL-20260827-1100',
        'lead_id', 'LEAD-FS-0001',
        'session_id', 'seed',
        'status', 'converted',
        'expires_at', '2026-08-25T09:05:00.000Z'
      )
    ),
    (
      'seed_fs_appointment_rahul',
      'loan_appointments',
      'appointment_id',
      'appt-fs-0001',
      jsonb_build_object(
        'appointment_id', 'APPT-FS-0001',
        'appointment_number', 'APT-20260825-4821',
        'lead_id', 'LEAD-FS-0001',
        'customer_id', 'CUST-FS-0001',
        'advisor_id', 'ADV-HL-001',
        'advisor_name', 'Arjun',
        'slot_id', 'SLOT-HL-20260827-1100',
        'product_code', 'home_loan',
        'appointment_date', '2026-08-27',
        'appointment_time', '11:00',
        'appointment_datetime', '2026-08-27T11:00:00+05:30',
        'status', 'confirmed'
      )
    ),
    (
      'seed_fs_followup_24h',
      'loan_followup_jobs',
      'followup_id',
      'appt-fs-0001:24h',
      jsonb_build_object(
        'followup_id', 'APPT-FS-0001:24H',
        'lead_id', 'LEAD-FS-0001',
        'appointment_id', 'APPT-FS-0001',
        'job_type', 'appointment_reminder_24h',
        'run_at', '2026-08-26T11:00:00+05:30',
        'channel', 'whatsapp',
        'status', 'scheduled'
      )
    ),
    (
      'seed_fs_followup_1h',
      'loan_followup_jobs',
      'followup_id',
      'appt-fs-0001:1h',
      jsonb_build_object(
        'followup_id', 'APPT-FS-0001:1H',
        'lead_id', 'LEAD-FS-0001',
        'appointment_id', 'APPT-FS-0001',
        'job_type', 'appointment_reminder_1h',
        'run_at', '2026-08-27T10:00:00+05:30',
        'channel', 'whatsapp',
        'status', 'scheduled'
      )
    ),
    (
      'seed_fs_status_profile',
      'loan_status_history',
      'status_event_id',
      'lead-fs-0001:profile',
      jsonb_build_object(
        'status_event_id', 'LEAD-FS-0001:PROFILE',
        'lead_id', 'LEAD-FS-0001',
        'lead_number', 'LD-20260825-4821',
        'from_status', '',
        'to_status', 'profile_in_progress',
        'customer_message', 'Profile capture started',
        'source', 'assistant',
        'created_at', '2026-08-25T09:00:00.000Z'
      )
    ),
    (
      'seed_fs_status_ready',
      'loan_status_history',
      'status_event_id',
      'lead-fs-0001:ready',
      jsonb_build_object(
        'status_event_id', 'LEAD-FS-0001:READY',
        'lead_id', 'LEAD-FS-0001',
        'lead_number', 'LD-20260825-4821',
        'from_status', 'profile_in_progress',
        'to_status', 'ready_for_advisor',
        'customer_message', 'Indicative guidance completed',
        'source', 'assistant',
        'created_at', '2026-08-25T09:10:00.000Z'
      )
    ),
    (
      'seed_fs_status_booked',
      'loan_status_history',
      'status_event_id',
      'lead-fs-0001:booked',
      jsonb_build_object(
        'status_event_id', 'LEAD-FS-0001:BOOKED',
        'lead_id', 'LEAD-FS-0001',
        'lead_number', 'LD-20260825-4821',
        'from_status', 'ready_for_advisor',
        'to_status', 'advisor_booked',
        'customer_message', 'Advisor consultation confirmed for 27 August 2026 at 11:00 AM',
        'source', 'assistant',
        'created_at', '2026-08-25T09:20:00.000Z'
      )
    ),
    (
      'seed_fs_outbox_rahul',
      'integration_outbox',
      'outbox_event_id',
      'lead-fs-0001:crm',
      jsonb_build_object(
        'outbox_event_id', 'LEAD-FS-0001:CRM',
        'aggregate_type', 'loan_lead',
        'aggregate_id', 'LEAD-FS-0001',
        'event_type', 'loan_lead.upsert',
        'payload_summary', 'LD-20260825-4821 | Home Loan | ₹40,00,000 | Arjun',
        'status', 'pending',
        'attempt_count', 0,
        'next_attempt_at', '2026-08-25T09:21:00.000Z'
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
  COUNT(*) FILTER (WHERE seed_records.collection = 'loan_customers') AS customer_records_seeded,
  COUNT(*) FILTER (WHERE seed_records.collection = 'loan_products') AS product_records_seeded,
  COUNT(*) FILTER (WHERE seed_records.collection = 'loan_document_rules') AS document_rule_records_seeded,
  COUNT(*) FILTER (WHERE seed_records.collection = 'loan_leads') AS lead_records_seeded,
  COUNT(*) FILTER (WHERE seed_records.collection = 'loan_advisor_slots') AS advisor_slot_records_seeded,
  COUNT(*) FILTER (WHERE seed_records.collection = 'loan_status_history') AS status_history_records_seeded
FROM params
CROSS JOIN seed_records
GROUP BY params.tenant_id;

COMMIT;

-- Suggested verification after the commit:
-- SELECT "collection", COUNT(*)
-- FROM "flow_records"
-- WHERE "tenantId" = '8285edc4-af68-46c0-9e72-5b2819cb33d9'
--   AND "collection" IN (
--     'loan_customers',
--     'loan_products',
--     'loan_product_guidelines',
--     'loan_document_rules',
--     'loan_leads',
--     'loan_lead_profiles',
--     'loan_prequalification_runs',
--     'loan_lead_documents',
--     'loan_advisor_slots',
--     'loan_slot_holds',
--     'loan_appointments',
--     'loan_followup_jobs',
--     'loan_status_history',
--     'integration_outbox'
--   )
-- GROUP BY "collection"
-- ORDER BY "collection";
--
-- SELECT
--   "dataJson"->>'lead_number' AS lead_number,
--   "dataJson"->>'product_name' AS product_name,
--   "dataJson"->>'lead_status' AS lead_status,
--   "dataJson"->>'assigned_advisor_name' AS assigned_advisor_name
-- FROM "flow_records"
-- WHERE "tenantId" = '8285edc4-af68-46c0-9e72-5b2819cb33d9'
--   AND "collection" = 'loan_leads'
-- ORDER BY "dataJson"->>'lead_number';
