-- Insurance demo seed for the FLOW record store.
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
--          'insurance_customers',
--          'insurance_products',
--          'policies',
--          'claim_types',
--          'claim_document_rules',
--          'claims',
--          'claim_requirements',
--          'claim_documents',
--          'claim_status_history',
--          'claim_settlements',
--          'service_requests',
--          'insurance_grievances',
--          'integration_outbox'
--        )
--      GROUP BY "collection"
--      ORDER BY "collection";
--   3. Run against the same PostgreSQL database used by the records runtime.
--      This script writes to the shared `public` schema.
--      PowerShell example:
--      psql $env:DATABASE_URL -f .\scripts\seed-demo-insurance-records.sql
--
-- Date note:
--   This file is aligned to Tuesday, August 25, 2026.
--   Claims dated August 18 through August 24, 2026 are intentionally in the past.

BEGIN;

SET search_path TO public;

WITH params AS (
  SELECT
    '8285edc4-af68-46c0-9e72-5b2819cb33d9'::text AS tenant_id,
    'seed-demo-insurance-records'::text AS source_tag
),
schemas (collection, schema_json) AS (
  VALUES
    (
      'insurance_customers',
      '{
        "collection": "insurance_customers",
        "fields": {
          "customer_id": { "type": "string", "required": true, "unique": true },
          "external_customer_id": { "type": "string", "required": false, "unique": true },
          "full_name": { "type": "string", "required": true },
          "phone": { "type": "phone", "required": true, "unique": true },
          "email": { "type": "email", "required": false },
          "preferred_language": { "type": "string", "required": false },
          "status": { "type": "string", "required": true }
        }
      }'::jsonb
    ),
    (
      'insurance_products',
      '{
        "collection": "insurance_products",
        "fields": {
          "product_id": { "type": "string", "required": true, "unique": true },
          "product_code": { "type": "string", "required": true, "unique": true },
          "product_name": { "type": "string", "required": true },
          "product_type": { "type": "string", "required": true },
          "version": { "type": "string", "required": false },
          "status": { "type": "string", "required": true }
        }
      }'::jsonb
    ),
    (
      'policies',
      '{
        "collection": "policies",
        "fields": {
          "policy_id": { "type": "string", "required": true, "unique": true },
          "policy_number": { "type": "string", "required": true, "unique": true },
          "external_policy_id": { "type": "string", "required": false, "unique": true },
          "product_id": { "type": "string", "required": true },
          "product_code": { "type": "string", "required": true },
          "product_name": { "type": "string", "required": true },
          "primary_customer_id": { "type": "string", "required": true },
          "primary_customer_phone": { "type": "phone", "required": true },
          "primary_customer_name": { "type": "string", "required": true },
          "status": { "type": "string", "required": true },
          "start_date": { "type": "string", "required": true },
          "end_date": { "type": "string", "required": true },
          "sum_insured": { "type": "number", "required": false },
          "currency": { "type": "string", "required": true },
          "members_summary": { "type": "string", "required": false },
          "coverage_summary": { "type": "string", "required": false },
          "exclusions_summary": { "type": "string", "required": false },
          "policy_download_url": { "type": "url", "required": false },
          "premium_status": { "type": "string", "required": false }
        }
      }'::jsonb
    ),
    (
      'claim_types',
      '{
        "collection": "claim_types",
        "fields": {
          "claim_type_id": { "type": "string", "required": true, "unique": true },
          "product_code": { "type": "string", "required": true },
          "claim_type_code": { "type": "string", "required": true },
          "display_name": { "type": "string", "required": true },
          "status": { "type": "string", "required": true },
          "form_hint": { "type": "string", "required": false }
        }
      }'::jsonb
    ),
    (
      'claim_document_rules',
      '{
        "collection": "claim_document_rules",
        "fields": {
          "rule_id": { "type": "string", "required": true, "unique": true },
          "product_code": { "type": "string", "required": true },
          "claim_type_code": { "type": "string", "required": true },
          "document_type_code": { "type": "string", "required": true },
          "document_name": { "type": "string", "required": true },
          "requirement_type": { "type": "string", "required": true },
          "display_order": { "type": "number", "required": true },
          "status": { "type": "string", "required": true }
        }
      }'::jsonb
    ),
    (
      'claims',
      '{
        "collection": "claims",
        "fields": {
          "claim_id": { "type": "string", "required": true, "unique": true },
          "claim_number": { "type": "string", "required": true, "unique": true },
          "claim_request_id": { "type": "string", "required": false, "unique": true },
          "policy_id": { "type": "string", "required": true },
          "policy_number": { "type": "string", "required": true },
          "customer_id": { "type": "string", "required": true },
          "customer_mobile": { "type": "phone", "required": true },
          "product_code": { "type": "string", "required": true },
          "claim_type_code": { "type": "string", "required": true },
          "claim_type_name": { "type": "string", "required": true },
          "canonical_status": { "type": "string", "required": true },
          "external_status": { "type": "string", "required": false },
          "incident_date": { "type": "string", "required": true },
          "incident_time": { "type": "string", "required": false },
          "incident_location": { "type": "string", "required": false },
          "incident_summary": { "type": "string", "required": false },
          "claimed_amount_minor": { "type": "number", "required": false },
          "currency": { "type": "string", "required": true },
          "required_document_count": { "type": "number", "required": false },
          "received_document_count": { "type": "number", "required": false },
          "outstanding_requirements": { "type": "string", "required": false },
          "requirements_summary": { "type": "string", "required": false },
          "document_completeness_pct": { "type": "number", "required": false },
          "sync_state": { "type": "string", "required": true },
          "dedupe_fingerprint": { "type": "string", "required": false },
          "external_claim_number": { "type": "string", "required": false },
          "created_at": { "type": "string", "required": false },
          "updated_at": { "type": "string", "required": false },
          "last_status_label": { "type": "string", "required": false }
        }
      }'::jsonb
    ),
    (
      'claim_requirements',
      '{
        "collection": "claim_requirements",
        "fields": {
          "requirement_set_id": { "type": "string", "required": true, "unique": true },
          "claim_id": { "type": "string", "required": true },
          "claim_number": { "type": "string", "required": true },
          "requirement_status": { "type": "string", "required": true },
          "outstanding_requirements": { "type": "string", "required": false },
          "received_requirements": { "type": "string", "required": false },
          "required_document_count": { "type": "number", "required": false },
          "received_document_count": { "type": "number", "required": false }
        }
      }'::jsonb
    ),
    (
      'claim_documents',
      '{
        "collection": "claim_documents",
        "fields": {
          "claim_document_id": { "type": "string", "required": true, "unique": true },
          "claim_id": { "type": "string", "required": true },
          "claim_number": { "type": "string", "required": true },
          "document_batch_ref": { "type": "string", "required": true },
          "uploaded_document_count": { "type": "number", "required": true },
          "processing_status": { "type": "string", "required": true },
          "verification_status": { "type": "string", "required": true },
          "notes": { "type": "string", "required": false }
        }
      }'::jsonb
    ),
    (
      'claim_status_history',
      '{
        "collection": "claim_status_history",
        "fields": {
          "status_event_id": { "type": "string", "required": true, "unique": true },
          "claim_id": { "type": "string", "required": true },
          "claim_number": { "type": "string", "required": true },
          "from_status": { "type": "string", "required": false },
          "to_status": { "type": "string", "required": true },
          "external_status": { "type": "string", "required": false },
          "customer_message": { "type": "string", "required": false },
          "source": { "type": "string", "required": true },
          "created_at": { "type": "string", "required": true }
        }
      }'::jsonb
    ),
    (
      'claim_settlements',
      '{
        "collection": "claim_settlements",
        "fields": {
          "settlement_id": { "type": "string", "required": true, "unique": true },
          "claim_id": { "type": "string", "required": true },
          "claim_number": { "type": "string", "required": true },
          "settlement_reference": { "type": "string", "required": true, "unique": true },
          "decision_type": { "type": "string", "required": true },
          "approved_amount_minor": { "type": "number", "required": false },
          "currency": { "type": "string", "required": true },
          "payment_status": { "type": "string", "required": true },
          "payment_reference": { "type": "string", "required": false }
        }
      }'::jsonb
    ),
    (
      'service_requests',
      '{
        "collection": "service_requests",
        "fields": {
          "service_request_id": { "type": "string", "required": true, "unique": true },
          "request_number": { "type": "string", "required": true, "unique": true },
          "policy_id": { "type": "string", "required": true },
          "policy_number": { "type": "string", "required": true },
          "customer_id": { "type": "string", "required": true },
          "request_type": { "type": "string", "required": true },
          "status": { "type": "string", "required": true },
          "request_summary": { "type": "string", "required": false },
          "created_at": { "type": "string", "required": true }
        }
      }'::jsonb
    ),
    (
      'insurance_grievances',
      '{
        "collection": "insurance_grievances",
        "fields": {
          "grievance_id": { "type": "string", "required": true, "unique": true },
          "grievance_number": { "type": "string", "required": true, "unique": true },
          "claim_id": { "type": "string", "required": false },
          "claim_number": { "type": "string", "required": false },
          "customer_id": { "type": "string", "required": true },
          "priority": { "type": "string", "required": true },
          "status": { "type": "string", "required": true },
          "summary": { "type": "string", "required": true },
          "assigned_queue": { "type": "string", "required": true },
          "created_at": { "type": "string", "required": true }
        }
      }'::jsonb
    ),
    (
      'integration_outbox',
      '{
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
      'seed_ins_customer_rahul',
      'insurance_customers',
      'phone',
      'phone:9000088881',
      jsonb_build_object(
        'customer_id', 'CUST-INS-0001',
        'external_customer_id', 'EXT-CUST-0001',
        'full_name', 'Rahul Menon',
        'phone', '+919000088881',
        'email', 'rahul.menon@example.insure',
        'preferred_language', 'en',
        'status', 'active'
      )
    ),
    (
      'seed_ins_customer_anita',
      'insurance_customers',
      'phone',
      'phone:9000088882',
      jsonb_build_object(
        'customer_id', 'CUST-INS-0002',
        'external_customer_id', 'EXT-CUST-0002',
        'full_name', 'Anita Rao',
        'phone', '+919000088882',
        'email', 'anita.rao@example.insure',
        'preferred_language', 'en',
        'status', 'active'
      )
    ),
    (
      'seed_ins_customer_vivek',
      'insurance_customers',
      'phone',
      'phone:9000088883',
      jsonb_build_object(
        'customer_id', 'CUST-INS-0003',
        'external_customer_id', 'EXT-CUST-0003',
        'full_name', 'Vivek Sharma',
        'phone', '+919000088883',
        'email', 'vivek.sharma@example.insure',
        'preferred_language', 'en',
        'status', 'active'
      )
    ),
    (
      'seed_ins_product_health',
      'insurance_products',
      'product_code',
      'health',
      jsonb_build_object(
        'product_id', 'PROD-INS-HEALTH',
        'product_code', 'health',
        'product_name', 'Secure Health Plus',
        'product_type', 'health',
        'version', 'v2026',
        'status', 'active'
      )
    ),
    (
      'seed_ins_product_motor',
      'insurance_products',
      'product_code',
      'motor',
      jsonb_build_object(
        'product_id', 'PROD-INS-MOTOR',
        'product_code', 'motor',
        'product_name', 'DriveSure Comprehensive',
        'product_type', 'motor',
        'version', 'v2026',
        'status', 'active'
      )
    ),
    (
      'seed_ins_product_travel',
      'insurance_products',
      'product_code',
      'travel',
      jsonb_build_object(
        'product_id', 'PROD-INS-TRAVEL',
        'product_code', 'travel',
        'product_name', 'GlobeShield Travel Protect',
        'product_type', 'travel',
        'version', 'v2026',
        'status', 'active'
      )
    ),
    (
      'seed_ins_policy_health_rahul',
      'policies',
      'policy_number',
      'pol-hl-1001',
      jsonb_build_object(
        'policy_id', 'POLICY-INS-0001',
        'policy_number', 'POL-HL-1001',
        'external_policy_id', 'EXT-POL-HL-1001',
        'product_id', 'PROD-INS-HEALTH',
        'product_code', 'health',
        'product_name', 'Secure Health Plus',
        'primary_customer_id', 'CUST-INS-0001',
        'primary_customer_phone', '+919000088881',
        'primary_customer_name', 'Rahul Menon',
        'status', 'active',
        'start_date', '2026-04-01',
        'end_date', '2027-03-31',
        'sum_insured', 50000000,
        'currency', 'INR',
        'members_summary', '3 members',
        'coverage_summary', 'Hospitalization, room rent, cashless network treatment, pre and post hospitalization as per policy wording.',
        'exclusions_summary', 'Waiting period exclusions, non-medical consumables, and non-covered cosmetic treatment apply.',
        'policy_download_url', 'https://insurance.example.com/policy/POL-HL-1001',
        'premium_status', 'paid'
      )
    ),
    (
      'seed_ins_policy_travel_rahul',
      'policies',
      'policy_number',
      'pol-tr-1002',
      jsonb_build_object(
        'policy_id', 'POLICY-INS-0002',
        'policy_number', 'POL-TR-1002',
        'external_policy_id', 'EXT-POL-TR-1002',
        'product_id', 'PROD-INS-TRAVEL',
        'product_code', 'travel',
        'product_name', 'GlobeShield Travel Protect',
        'primary_customer_id', 'CUST-INS-0001',
        'primary_customer_phone', '+919000088881',
        'primary_customer_name', 'Rahul Menon',
        'status', 'active',
        'start_date', '2026-07-15',
        'end_date', '2026-09-15',
        'sum_insured', 10000000,
        'currency', 'INR',
        'members_summary', '1 traveller',
        'coverage_summary', 'Trip cancellation, flight delay, baggage loss, and emergency medical support as per the travel wording.',
        'exclusions_summary', 'Pre-existing exclusions, unattended baggage, and non-covered itinerary changes apply.',
        'policy_download_url', 'https://insurance.example.com/policy/POL-TR-1002',
        'premium_status', 'paid'
      )
    ),
    (
      'seed_ins_policy_motor_anita',
      'policies',
      'policy_number',
      'pol-mt-2001',
      jsonb_build_object(
        'policy_id', 'POLICY-INS-0003',
        'policy_number', 'POL-MT-2001',
        'external_policy_id', 'EXT-POL-MT-2001',
        'product_id', 'PROD-INS-MOTOR',
        'product_code', 'motor',
        'product_name', 'DriveSure Comprehensive',
        'primary_customer_id', 'CUST-INS-0002',
        'primary_customer_phone', '+919000088882',
        'primary_customer_name', 'Anita Rao',
        'status', 'active',
        'start_date', '2026-01-01',
        'end_date', '2026-12-31',
        'sum_insured', 120000000,
        'currency', 'INR',
        'members_summary', 'Vehicle: KA01AB1234',
        'coverage_summary', 'Own damage, third-party liability, roadside support, and consumable add-on per endorsement.',
        'exclusions_summary', 'Driving under intoxication, wear and tear, and non-covered accessories are excluded.',
        'policy_download_url', 'https://insurance.example.com/policy/POL-MT-2001',
        'premium_status', 'paid'
      )
    ),
    (
      'seed_ins_policy_travel_vivek',
      'policies',
      'policy_number',
      'pol-tr-3001',
      jsonb_build_object(
        'policy_id', 'POLICY-INS-0004',
        'policy_number', 'POL-TR-3001',
        'external_policy_id', 'EXT-POL-TR-3001',
        'product_id', 'PROD-INS-TRAVEL',
        'product_code', 'travel',
        'product_name', 'GlobeShield Travel Protect',
        'primary_customer_id', 'CUST-INS-0003',
        'primary_customer_phone', '+919000088883',
        'primary_customer_name', 'Vivek Sharma',
        'status', 'active',
        'start_date', '2026-08-10',
        'end_date', '2026-09-10',
        'sum_insured', 15000000,
        'currency', 'INR',
        'members_summary', '1 traveller',
        'coverage_summary', 'Emergency medical, baggage loss, and trip interruption cover as per policy schedule.',
        'exclusions_summary', 'Adventure activity exclusions and unattended baggage exclusions apply.',
        'policy_download_url', 'https://insurance.example.com/policy/POL-TR-3001',
        'premium_status', 'paid'
      )
    ),
    (
      'seed_ins_claim_type_health_hosp',
      'claim_types',
      'claim_type_id',
      'ct-health-hospitalization',
      jsonb_build_object(
        'claim_type_id', 'CT-HEALTH-HOSPITALIZATION',
        'product_code', 'health',
        'claim_type_code', 'hospitalization',
        'display_name', 'Hospitalization',
        'status', 'active',
        'form_hint', 'Capture patient, hospital, admission, discharge, diagnosis, and billed amount details.'
      )
    ),
    (
      'seed_ins_claim_type_health_reimbursement',
      'claim_types',
      'claim_type_id',
      'ct-health-reimbursement',
      jsonb_build_object(
        'claim_type_id', 'CT-HEALTH-REIMBURSEMENT',
        'product_code', 'health',
        'claim_type_code', 'reimbursement',
        'display_name', 'Reimbursement',
        'status', 'active',
        'form_hint', 'Capture treatment dates, provider details, and reimbursement amount from bills.'
      )
    ),
    (
      'seed_ins_claim_type_motor_damage',
      'claim_types',
      'claim_type_id',
      'ct-motor-damage',
      jsonb_build_object(
        'claim_type_id', 'CT-MOTOR-DAMAGE',
        'product_code', 'motor',
        'claim_type_code', 'accident_damage',
        'display_name', 'Accident Damage',
        'status', 'active',
        'form_hint', 'Capture incident location, vehicle damage description, driver, and garage details.'
      )
    ),
    (
      'seed_ins_claim_type_motor_theft',
      'claim_types',
      'claim_type_id',
      'ct-motor-theft',
      jsonb_build_object(
        'claim_type_id', 'CT-MOTOR-THEFT',
        'product_code', 'motor',
        'claim_type_code', 'theft',
        'display_name', 'Theft',
        'status', 'active',
        'form_hint', 'Capture FIR, last known location, and theft timeline details.'
      )
    ),
    (
      'seed_ins_claim_type_travel_baggage',
      'claim_types',
      'claim_type_id',
      'ct-travel-baggage',
      jsonb_build_object(
        'claim_type_id', 'CT-TRAVEL-BAGGAGE',
        'product_code', 'travel',
        'claim_type_code', 'baggage_loss',
        'display_name', 'Baggage Loss',
        'status', 'active',
        'form_hint', 'Capture flight, airport, PIR, baggage tag, and claimed baggage loss amount.'
      )
    ),
    (
      'seed_ins_claim_type_travel_trip_cancel',
      'claim_types',
      'claim_type_id',
      'ct-travel-trip-cancel',
      jsonb_build_object(
        'claim_type_id', 'CT-TRAVEL-TRIP-CANCEL',
        'product_code', 'travel',
        'claim_type_code', 'trip_cancellation',
        'display_name', 'Trip Cancellation',
        'status', 'active',
        'form_hint', 'Capture booking references, cancellation reason, and supplier charges.'
      )
    ),
    (
      'seed_rule_health_1',
      'claim_document_rules',
      'rule_id',
      'rule-health-hosp-id-proof',
      jsonb_build_object(
        'rule_id', 'RULE-HEALTH-HOSP-ID-PROOF',
        'product_code', 'health',
        'claim_type_code', 'hospitalization',
        'document_type_code', 'id_proof',
        'document_name', 'Identity Proof',
        'requirement_type', 'required',
        'display_order', 1,
        'status', 'active'
      )
    ),
    (
      'seed_rule_health_2',
      'claim_document_rules',
      'rule_id',
      'rule-health-hosp-bill',
      jsonb_build_object(
        'rule_id', 'RULE-HEALTH-HOSP-BILL',
        'product_code', 'health',
        'claim_type_code', 'hospitalization',
        'document_type_code', 'hospital_bill',
        'document_name', 'Hospital Bill',
        'requirement_type', 'required',
        'display_order', 2,
        'status', 'active'
      )
    ),
    (
      'seed_rule_health_3',
      'claim_document_rules',
      'rule_id',
      'rule-health-hosp-discharge',
      jsonb_build_object(
        'rule_id', 'RULE-HEALTH-HOSP-DISCHARGE',
        'product_code', 'health',
        'claim_type_code', 'hospitalization',
        'document_type_code', 'discharge_summary',
        'document_name', 'Discharge Summary',
        'requirement_type', 'required',
        'display_order', 3,
        'status', 'active'
      )
    ),
    (
      'seed_rule_health_4',
      'claim_document_rules',
      'rule_id',
      'rule-health-hosp-bank',
      jsonb_build_object(
        'rule_id', 'RULE-HEALTH-HOSP-BANK',
        'product_code', 'health',
        'claim_type_code', 'hospitalization',
        'document_type_code', 'bank_proof',
        'document_name', 'Bank Proof',
        'requirement_type', 'required',
        'display_order', 4,
        'status', 'active'
      )
    ),
    (
      'seed_rule_health_5',
      'claim_document_rules',
      'rule_id',
      'rule-health-hosp-police',
      jsonb_build_object(
        'rule_id', 'RULE-HEALTH-HOSP-POLICE',
        'product_code', 'health',
        'claim_type_code', 'hospitalization',
        'document_type_code', 'police_report',
        'document_name', 'Police Report',
        'requirement_type', 'conditional',
        'display_order', 5,
        'status', 'active'
      )
    ),
    (
      'seed_rule_motor_1',
      'claim_document_rules',
      'rule_id',
      'rule-motor-damage-rc',
      jsonb_build_object(
        'rule_id', 'RULE-MOTOR-DAMAGE-RC',
        'product_code', 'motor',
        'claim_type_code', 'accident_damage',
        'document_type_code', 'rc_copy',
        'document_name', 'Registration Certificate Copy',
        'requirement_type', 'required',
        'display_order', 1,
        'status', 'active'
      )
    ),
    (
      'seed_rule_motor_2',
      'claim_document_rules',
      'rule_id',
      'rule-motor-damage-license',
      jsonb_build_object(
        'rule_id', 'RULE-MOTOR-DAMAGE-LICENSE',
        'product_code', 'motor',
        'claim_type_code', 'accident_damage',
        'document_type_code', 'driving_license',
        'document_name', 'Driving License',
        'requirement_type', 'required',
        'display_order', 2,
        'status', 'active'
      )
    ),
    (
      'seed_rule_motor_3',
      'claim_document_rules',
      'rule_id',
      'rule-motor-damage-estimate',
      jsonb_build_object(
        'rule_id', 'RULE-MOTOR-DAMAGE-ESTIMATE',
        'product_code', 'motor',
        'claim_type_code', 'accident_damage',
        'document_type_code', 'repair_estimate',
        'document_name', 'Repair Estimate',
        'requirement_type', 'required',
        'display_order', 3,
        'status', 'active'
      )
    ),
    (
      'seed_rule_travel_1',
      'claim_document_rules',
      'rule_id',
      'rule-travel-baggage-boarding',
      jsonb_build_object(
        'rule_id', 'RULE-TRAVEL-BAGGAGE-BOARDING',
        'product_code', 'travel',
        'claim_type_code', 'baggage_loss',
        'document_type_code', 'boarding_pass',
        'document_name', 'Boarding Pass',
        'requirement_type', 'required',
        'display_order', 1,
        'status', 'active'
      )
    ),
    (
      'seed_rule_travel_2',
      'claim_document_rules',
      'rule_id',
      'rule-travel-baggage-pir',
      jsonb_build_object(
        'rule_id', 'RULE-TRAVEL-BAGGAGE-PIR',
        'product_code', 'travel',
        'claim_type_code', 'baggage_loss',
        'document_type_code', 'pir_report',
        'document_name', 'Property Irregularity Report',
        'requirement_type', 'required',
        'display_order', 2,
        'status', 'active'
      )
    ),
    (
      'seed_rule_travel_3',
      'claim_document_rules',
      'rule_id',
      'rule-travel-baggage-tags',
      jsonb_build_object(
        'rule_id', 'RULE-TRAVEL-BAGGAGE-TAGS',
        'product_code', 'travel',
        'claim_type_code', 'baggage_loss',
        'document_type_code', 'baggage_tags',
        'document_name', 'Baggage Tags',
        'requirement_type', 'required',
        'display_order', 3,
        'status', 'active'
      )
    ),
    (
      'seed_claim_826419',
      'claims',
      'claim_number',
      'clm-826419',
      jsonb_build_object(
        'claim_id', 'CLAIM-826419',
        'claim_number', 'CLM-826419',
        'claim_request_id', 'CLMREQ-826419',
        'policy_id', 'POLICY-INS-0001',
        'policy_number', 'POL-HL-1001',
        'customer_id', 'CUST-INS-0001',
        'customer_mobile', '+919000088881',
        'product_code', 'health',
        'claim_type_code', 'hospitalization',
        'claim_type_name', 'Hospitalization',
        'canonical_status', 'information_required',
        'external_status', 'query_raised',
        'incident_date', '2026-08-22',
        'incident_time', '14:30',
        'incident_location', 'Hyderabad',
        'incident_summary', 'Cashless hospitalization converted to reimbursement claim for final settlement.',
        'claimed_amount_minor', 4250000,
        'currency', 'INR',
        'required_document_count', 4,
        'received_document_count', 3,
        'outstanding_requirements', 'Bank Proof',
        'requirements_summary', 'Identity Proof|Hospital Bill|Discharge Summary|Bank Proof',
        'document_completeness_pct', 75,
        'sync_state', 'synced',
        'dedupe_fingerprint', 'POLICY-INS-0001|hospitalization|2026-08-22|self',
        'external_claim_number', 'EXT-826419',
        'created_at', '2026-08-23T10:15:00.000Z',
        'updated_at', '2026-08-25T10:10:00.000Z',
        'last_status_label', 'Additional bank proof requested'
      )
    ),
    (
      'seed_claim_826120',
      'claims',
      'claim_number',
      'clm-826120',
      jsonb_build_object(
        'claim_id', 'CLAIM-826120',
        'claim_number', 'CLM-826120',
        'claim_request_id', 'CLMREQ-826120',
        'policy_id', 'POLICY-INS-0003',
        'policy_number', 'POL-MT-2001',
        'customer_id', 'CUST-INS-0002',
        'customer_mobile', '+919000088882',
        'product_code', 'motor',
        'claim_type_code', 'accident_damage',
        'claim_type_name', 'Accident Damage',
        'canonical_status', 'settlement_pending',
        'external_status', 'approved',
        'incident_date', '2026-08-18',
        'incident_time', '20:10',
        'incident_location', 'Bengaluru Outer Ring Road',
        'incident_summary', 'Rear bumper and tail lamp damage after insured accident.',
        'claimed_amount_minor', 3800000,
        'currency', 'INR',
        'required_document_count', 3,
        'received_document_count', 3,
        'outstanding_requirements', '',
        'requirements_summary', 'Registration Certificate Copy|Driving License|Repair Estimate',
        'document_completeness_pct', 100,
        'sync_state', 'synced',
        'dedupe_fingerprint', 'POLICY-INS-0003|accident_damage|2026-08-18|insured_driver',
        'external_claim_number', 'EXT-826120',
        'created_at', '2026-08-18T21:00:00.000Z',
        'updated_at', '2026-08-24T16:20:00.000Z',
        'last_status_label', 'Approved, payment processing'
      )
    ),
    (
      'seed_claim_826500',
      'claims',
      'claim_number',
      'clm-826500',
      jsonb_build_object(
        'claim_id', 'CLAIM-826500',
        'claim_number', 'CLM-826500',
        'claim_request_id', 'CLMREQ-826500',
        'policy_id', 'POLICY-INS-0004',
        'policy_number', 'POL-TR-3001',
        'customer_id', 'CUST-INS-0003',
        'customer_mobile', '+919000088883',
        'product_code', 'travel',
        'claim_type_code', 'baggage_loss',
        'claim_type_name', 'Baggage Loss',
        'canonical_status', 'sync_pending',
        'external_status', 'pending_submission',
        'incident_date', '2026-08-24',
        'incident_time', '06:20',
        'incident_location', 'Dubai International Airport',
        'incident_summary', 'Checked baggage not delivered on arrival.',
        'claimed_amount_minor', 12000000,
        'currency', 'INR',
        'required_document_count', 3,
        'received_document_count', 3,
        'outstanding_requirements', '',
        'requirements_summary', 'Boarding Pass|Property Irregularity Report|Baggage Tags',
        'document_completeness_pct', 100,
        'sync_state', 'retry_pending',
        'dedupe_fingerprint', 'POLICY-INS-0004|baggage_loss|2026-08-24|self',
        'external_claim_number', '',
        'created_at', '2026-08-24T09:30:00.000Z',
        'updated_at', '2026-08-24T09:45:00.000Z',
        'last_status_label', 'Submission pending'
      )
    ),
    (
      'seed_claim_requirements_826419',
      'claim_requirements',
      'requirement_set_id',
      'claim-826419',
      jsonb_build_object(
        'requirement_set_id', 'CLAIM-826419',
        'claim_id', 'CLAIM-826419',
        'claim_number', 'CLM-826419',
        'requirement_status', 'documents_pending',
        'outstanding_requirements', 'Bank Proof',
        'received_requirements', 'Identity Proof|Hospital Bill|Discharge Summary',
        'required_document_count', 4,
        'received_document_count', 3
      )
    ),
    (
      'seed_claim_requirements_826120',
      'claim_requirements',
      'requirement_set_id',
      'claim-826120',
      jsonb_build_object(
        'requirement_set_id', 'CLAIM-826120',
        'claim_id', 'CLAIM-826120',
        'claim_number', 'CLM-826120',
        'requirement_status', 'documents_complete',
        'outstanding_requirements', '',
        'received_requirements', 'Registration Certificate Copy|Driving License|Repair Estimate',
        'required_document_count', 3,
        'received_document_count', 3
      )
    ),
    (
      'seed_claim_requirements_826500',
      'claim_requirements',
      'requirement_set_id',
      'claim-826500',
      jsonb_build_object(
        'requirement_set_id', 'CLAIM-826500',
        'claim_id', 'CLAIM-826500',
        'claim_number', 'CLM-826500',
        'requirement_status', 'documents_complete',
        'outstanding_requirements', '',
        'received_requirements', 'Boarding Pass|Property Irregularity Report|Baggage Tags',
        'required_document_count', 3,
        'received_document_count', 3
      )
    ),
    (
      'seed_claim_docs_826419',
      'claim_documents',
      'claim_document_id',
      'claim-826419:batch1',
      jsonb_build_object(
        'claim_document_id', 'CLAIM-826419:BATCH1',
        'claim_id', 'CLAIM-826419',
        'claim_number', 'CLM-826419',
        'document_batch_ref', 'batch1',
        'uploaded_document_count', 3,
        'processing_status', 'processed',
        'verification_status', 'documents_pending',
        'notes', 'Identity proof, hospital bill, and discharge summary processed. Bank proof pending.'
      )
    ),
    (
      'seed_claim_docs_826120',
      'claim_documents',
      'claim_document_id',
      'claim-826120:batch1',
      jsonb_build_object(
        'claim_document_id', 'CLAIM-826120:BATCH1',
        'claim_id', 'CLAIM-826120',
        'claim_number', 'CLM-826120',
        'document_batch_ref', 'batch1',
        'uploaded_document_count', 3,
        'processing_status', 'processed',
        'verification_status', 'documents_complete',
        'notes', 'All required motor claim documents verified.'
      )
    ),
    (
      'seed_status_826419_1',
      'claim_status_history',
      'status_event_id',
      'claim-826419:draft',
      jsonb_build_object(
        'status_event_id', 'CLAIM-826419:DRAFT',
        'claim_id', 'CLAIM-826419',
        'claim_number', 'CLM-826419',
        'from_status', '',
        'to_status', 'draft',
        'external_status', '',
        'customer_message', 'Claim draft created',
        'source', 'assistant',
        'created_at', '2026-08-23T10:15:00.000Z'
      )
    ),
    (
      'seed_status_826419_2',
      'claim_status_history',
      'status_event_id',
      'claim-826419:submitted',
      jsonb_build_object(
        'status_event_id', 'CLAIM-826419:SUBMITTED',
        'claim_id', 'CLAIM-826419',
        'claim_number', 'CLM-826419',
        'from_status', 'documents_complete',
        'to_status', 'submitted',
        'external_status', 'received',
        'customer_message', 'Claim submitted successfully',
        'source', 'assistant',
        'created_at', '2026-08-23T10:30:00.000Z'
      )
    ),
    (
      'seed_status_826419_3',
      'claim_status_history',
      'status_event_id',
      'claim-826419:query',
      jsonb_build_object(
        'status_event_id', 'CLAIM-826419:QUERY',
        'claim_id', 'CLAIM-826419',
        'claim_number', 'CLM-826419',
        'from_status', 'under_review',
        'to_status', 'information_required',
        'external_status', 'query_raised',
        'customer_message', 'Additional document requested: Bank Proof',
        'source', 'claims_core',
        'created_at', '2026-08-25T10:10:00.000Z'
      )
    ),
    (
      'seed_status_826120_1',
      'claim_status_history',
      'status_event_id',
      'claim-826120:submitted',
      jsonb_build_object(
        'status_event_id', 'CLAIM-826120:SUBMITTED',
        'claim_id', 'CLAIM-826120',
        'claim_number', 'CLM-826120',
        'from_status', 'documents_complete',
        'to_status', 'submitted',
        'external_status', 'received',
        'customer_message', 'Claim submitted successfully',
        'source', 'assistant',
        'created_at', '2026-08-18T21:00:00.000Z'
      )
    ),
    (
      'seed_status_826120_2',
      'claim_status_history',
      'status_event_id',
      'claim-826120:approved',
      jsonb_build_object(
        'status_event_id', 'CLAIM-826120:APPROVED',
        'claim_id', 'CLAIM-826120',
        'claim_number', 'CLM-826120',
        'from_status', 'under_review',
        'to_status', 'settlement_pending',
        'external_status', 'approved',
        'customer_message', 'Approved amount confirmed. Payment processing has started.',
        'source', 'claims_core',
        'created_at', '2026-08-24T16:20:00.000Z'
      )
    ),
    (
      'seed_status_826500_1',
      'claim_status_history',
      'status_event_id',
      'claim-826500:sync',
      jsonb_build_object(
        'status_event_id', 'CLAIM-826500:SYNC',
        'claim_id', 'CLAIM-826500',
        'claim_number', 'CLM-826500',
        'from_status', 'documents_complete',
        'to_status', 'sync_pending',
        'external_status', 'pending_submission',
        'customer_message', 'Claim saved locally. Submission retry is pending.',
        'source', 'system',
        'created_at', '2026-08-24T09:45:00.000Z'
      )
    ),
    (
      'seed_settlement_826120',
      'claim_settlements',
      'settlement_reference',
      'stl-826120',
      jsonb_build_object(
        'settlement_id', 'SETTLEMENT-826120',
        'claim_id', 'CLAIM-826120',
        'claim_number', 'CLM-826120',
        'settlement_reference', 'STL-826120',
        'decision_type', 'approved',
        'approved_amount_minor', 3800000,
        'currency', 'INR',
        'payment_status', 'processing',
        'payment_reference', 'Available after dispatch'
      )
    ),
    (
      'seed_service_request_1',
      'service_requests',
      'request_number',
      'sr-526100',
      jsonb_build_object(
        'service_request_id', 'SERVICE-REQ-526100',
        'request_number', 'SR-526100',
        'policy_id', 'POLICY-INS-0001',
        'policy_number', 'POL-HL-1001',
        'customer_id', 'CUST-INS-0001',
        'request_type', 'policy_copy',
        'status', 'submitted',
        'request_summary', 'Customer requested the latest soft copy of the health policy schedule.',
        'created_at', '2026-08-24T15:00:00.000Z'
      )
    ),
    (
      'seed_grievance_1',
      'insurance_grievances',
      'grievance_number',
      'gr-826419',
      jsonb_build_object(
        'grievance_id', 'GRV-826419',
        'grievance_number', 'GR-826419',
        'claim_id', 'CLAIM-826419',
        'claim_number', 'CLM-826419',
        'customer_id', 'CUST-INS-0001',
        'priority', 'high',
        'status', 'open',
        'summary', 'Customer disputes the repeated bank-proof request and wants a senior claims review.',
        'assigned_queue', 'claims_grievance',
        'created_at', '2026-08-25T10:30:00.000Z'
      )
    ),
    (
      'seed_outbox_826500',
      'integration_outbox',
      'outbox_event_id',
      'claim-826500:submit',
      jsonb_build_object(
        'outbox_event_id', 'CLAIM-826500:SUBMIT',
        'aggregate_type', 'claim',
        'aggregate_id', 'CLAIM-826500',
        'event_type', 'claim.submit.retry',
        'payload_summary', 'CLM-826500 waiting for insurer core sync',
        'status', 'pending',
        'attempt_count', 1,
        'next_attempt_at', '2026-08-25T11:00:00.000Z'
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
  COUNT(*) FILTER (WHERE seed_records.collection = 'insurance_customers') AS customer_records_seeded,
  COUNT(*) FILTER (WHERE seed_records.collection = 'policies') AS policy_records_seeded,
  COUNT(*) FILTER (WHERE seed_records.collection = 'claim_types') AS claim_type_records_seeded,
  COUNT(*) FILTER (WHERE seed_records.collection = 'claims') AS claim_records_seeded,
  COUNT(*) FILTER (WHERE seed_records.collection = 'claim_status_history') AS claim_status_records_seeded
FROM params
CROSS JOIN seed_records
GROUP BY params.tenant_id;

COMMIT;

-- Suggested verification after the commit:
-- SELECT "collection", COUNT(*)
-- FROM "flow_records"
-- WHERE "tenantId" = '8285edc4-af68-46c0-9e72-5b2819cb33d9'
--   AND "collection" IN (
--     'insurance_customers',
--     'insurance_products',
--     'policies',
--     'claim_types',
--     'claim_document_rules',
--     'claims',
--     'claim_requirements',
--     'claim_documents',
--     'claim_status_history',
--     'claim_settlements',
--     'service_requests',
--     'insurance_grievances',
--     'integration_outbox'
--   )
-- GROUP BY "collection"
-- ORDER BY "collection";
--
-- SELECT
--   "dataJson"->>'claim_number' AS claim_number,
--   "dataJson"->>'canonical_status' AS canonical_status,
--   "dataJson"->>'outstanding_requirements' AS outstanding_requirements,
--   "dataJson"->>'last_status_label' AS last_status_label
-- FROM "flow_records"
-- WHERE "tenantId" = '8285edc4-af68-46c0-9e72-5b2819cb33d9'
--   AND "collection" = 'claims'
-- ORDER BY "dataJson"->>'claim_number';
