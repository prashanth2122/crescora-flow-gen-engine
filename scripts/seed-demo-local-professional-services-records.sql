-- Local and professional services demo seed for the FLOW records store.
-- This targets the generic records tables used by the `record` node runtime:
--   flow_record_schemas
--   flow_records
--   flow_record_indexes
--
-- How to run:
--   1. Update the tenant_id value in the params CTE below.
--   2. Run against the bot-code-zero PostgreSQL database.
--      This script writes to the shared `public` schema.
--      PowerShell example:
--      psql $env:DATABASE_URL -f .\scripts\seed-demo-local-professional-services-records.sql
--
-- Date note:
--   This file is aligned to Tuesday, August 25, 2026.
--   Dates after 2026-08-25 are intentionally in the future.

BEGIN;

SET search_path TO public;

WITH params AS (
  SELECT
    '8285edc4-af68-46c0-9e72-5b2819cb33d9'::text AS tenant_id,
    'seed-demo-local-professional-services-records'::text AS source_tag
),
schemas (collection, schema_json) AS (
  VALUES
    (
      'service_catalog',
      $${
        "collection": "service_catalog",
        "fields": {
          "service_id": { "type": "string", "required": true, "unique": true },
          "service_code": { "type": "string", "required": true, "unique": true },
          "category": { "type": "string", "required": true },
          "service_name": { "type": "string", "required": true },
          "description": { "type": "string", "required": false },
          "pricing_model": { "type": "string", "required": true },
          "base_price_minor": { "type": "number", "required": false },
          "currency": { "type": "string", "required": true },
          "duration_minutes": { "type": "number", "required": false },
          "location_required": { "type": "boolean", "required": true },
          "media_required": { "type": "string", "required": true },
          "inspection_required": { "type": "boolean", "required": true },
          "payment_policy": { "type": "string", "required": true },
          "booking_mode": { "type": "string", "required": true },
          "assignment_mode": { "type": "string", "required": true },
          "required_skill": { "type": "string", "required": false },
          "service_radius_km": { "type": "number", "required": false },
          "price_label": { "type": "string", "required": false },
          "booking_fee_minor": { "type": "number", "required": false },
          "intake_hint": { "type": "string", "required": false },
          "active": { "type": "boolean", "required": true }
        }
      }$$::jsonb
    ),
    (
      'service_areas',
      $${
        "collection": "service_areas",
        "fields": {
          "service_area_id": { "type": "string", "required": true, "unique": true },
          "service_id": { "type": "string", "required": true },
          "category": { "type": "string", "required": true },
          "branch_name": { "type": "string", "required": false },
          "locality": { "type": "string", "required": false },
          "city": { "type": "string", "required": true },
          "postal_code": { "type": "string", "required": true },
          "active": { "type": "boolean", "required": true }
        }
      }$$::jsonb
    ),
    (
      'service_customers',
      $${
        "collection": "service_customers",
        "fields": {
          "customer_id": { "type": "string", "required": true, "unique": true },
          "full_name": { "type": "string", "required": true },
          "phone_e164": { "type": "phone", "required": true, "unique": true },
          "email": { "type": "email", "required": false },
          "preferred_language": { "type": "string", "required": false },
          "saved_address_id": { "type": "string", "required": false },
          "last_service_category": { "type": "string", "required": false },
          "last_booking_id": { "type": "string", "required": false }
        }
      }$$::jsonb
    ),
    (
      'service_customer_addresses',
      $${
        "collection": "service_customer_addresses",
        "fields": {
          "address_id": { "type": "string", "required": true, "unique": true },
          "customer_id": { "type": "string", "required": true },
          "label": { "type": "string", "required": false },
          "address_line_1": { "type": "string", "required": true },
          "address_line_2": { "type": "string", "required": false },
          "locality": { "type": "string", "required": false },
          "city": { "type": "string", "required": true },
          "state": { "type": "string", "required": false },
          "postal_code": { "type": "string", "required": true },
          "latitude": { "type": "string", "required": false },
          "longitude": { "type": "string", "required": false },
          "is_default": { "type": "boolean", "required": true }
        }
      }$$::jsonb
    ),
    (
      'service_questions',
      $${
        "collection": "service_questions",
        "fields": {
          "question_id": { "type": "string", "required": true, "unique": true },
          "service_id": { "type": "string", "required": true },
          "field_key": { "type": "string", "required": true },
          "label": { "type": "string", "required": true },
          "field_type": { "type": "string", "required": true },
          "required": { "type": "boolean", "required": true },
          "options_csv": { "type": "string", "required": false },
          "display_order": { "type": "number", "required": true },
          "active": { "type": "boolean", "required": true }
        }
      }$$::jsonb
    ),
    (
      'service_requests',
      $${
        "collection": "service_requests",
        "fields": {
          "request_id": { "type": "string", "required": true, "unique": true },
          "customer_id": { "type": "string", "required": false },
          "service_id": { "type": "string", "required": true },
          "category": { "type": "string", "required": true },
          "request_summary": { "type": "string", "required": false },
          "urgency": { "type": "string", "required": false },
          "service_address_id": { "type": "string", "required": false },
          "pricing_model": { "type": "string", "required": false },
          "estimated_amount_minor": { "type": "number", "required": false },
          "status": { "type": "string", "required": true },
          "preferred_date_note": { "type": "string", "required": false },
          "source_channel": { "type": "string", "required": true },
          "created_at": { "type": "string", "required": false }
        }
      }$$::jsonb
    ),
    (
      'service_request_media',
      $${
        "collection": "service_request_media",
        "fields": {
          "media_id": { "type": "string", "required": true, "unique": true },
          "request_id": { "type": "string", "required": true },
          "media_type": { "type": "string", "required": true },
          "storage_key": { "type": "string", "required": false },
          "mime_type": { "type": "string", "required": false },
          "size_bytes": { "type": "number", "required": false },
          "checksum": { "type": "string", "required": false },
          "analysis_summary": { "type": "string", "required": false },
          "status": { "type": "string", "required": true }
        }
      }$$::jsonb
    ),
    (
      'service_availability_slots',
      $${
        "collection": "service_availability_slots",
        "fields": {
          "id": { "type": "string", "required": true, "unique": true },
          "slot_id": { "type": "string", "required": true, "unique": true },
          "service_id": { "type": "string", "required": true },
          "service_area_id": { "type": "string", "required": false },
          "worker_id": { "type": "string", "required": false },
          "worker_name": { "type": "string", "required": false },
          "date": { "type": "string", "required": true },
          "start": { "type": "string", "required": true },
          "end": { "type": "string", "required": true },
          "label": { "type": "string", "required": true },
          "status": { "type": "string", "required": true },
          "hold_id": { "type": "string", "required": false },
          "held_by_session": { "type": "string", "required": false },
          "request_id": { "type": "string", "required": false }
        }
      }$$::jsonb
    ),
    (
      'service_slot_holds',
      $${
        "collection": "service_slot_holds",
        "fields": {
          "hold_id": { "type": "string", "required": true, "unique": true },
          "request_id": { "type": "string", "required": true },
          "slot_id": { "type": "string", "required": true },
          "session_id": { "type": "string", "required": true },
          "status": { "type": "string", "required": true },
          "expires_at": { "type": "string", "required": false }
        }
      }$$::jsonb
    ),
    (
      'service_bookings',
      $${
        "collection": "service_bookings",
        "fields": {
          "booking_id": { "type": "string", "required": true, "unique": true },
          "booking_number": { "type": "string", "required": true, "unique": true },
          "request_id": { "type": "string", "required": true },
          "customer_id": { "type": "string", "required": true },
          "service_id": { "type": "string", "required": true },
          "service_name": { "type": "string", "required": true },
          "slot_id": { "type": "string", "required": true },
          "service_address_id": { "type": "string", "required": false },
          "scheduled_date": { "type": "string", "required": true },
          "scheduled_time": { "type": "string", "required": true },
          "scheduled_end_time": { "type": "string", "required": false },
          "status": { "type": "string", "required": true },
          "payment_status": { "type": "string", "required": true },
          "assignment_status": { "type": "string", "required": true },
          "amount_due_minor": { "type": "number", "required": false },
          "amount_paid_minor": { "type": "number", "required": false },
          "balance_due_minor": { "type": "number", "required": false },
          "final_amount_minor": { "type": "number", "required": false },
          "worker_id": { "type": "string", "required": false },
          "worker_name": { "type": "string", "required": false },
          "updated_at": { "type": "string", "required": false }
        }
      }$$::jsonb
    ),
    (
      'service_workers',
      $${
        "collection": "service_workers",
        "fields": {
          "worker_id": { "type": "string", "required": true, "unique": true },
          "worker_name": { "type": "string", "required": true },
          "primary_skill": { "type": "string", "required": true },
          "service_area_id": { "type": "string", "required": false },
          "status": { "type": "string", "required": true },
          "rating": { "type": "number", "required": false },
          "current_load": { "type": "number", "required": false },
          "phone": { "type": "phone", "required": false }
        }
      }$$::jsonb
    ),
    (
      'service_assignments',
      $${
        "collection": "service_assignments",
        "fields": {
          "assignment_id": { "type": "string", "required": true, "unique": true },
          "booking_id": { "type": "string", "required": true },
          "worker_id": { "type": "string", "required": true },
          "worker_name": { "type": "string", "required": true },
          "assignment_type": { "type": "string", "required": true },
          "status": { "type": "string", "required": true },
          "service_area_id": { "type": "string", "required": false },
          "score": { "type": "number", "required": false }
        }
      }$$::jsonb
    ),
    (
      'service_payments',
      $${
        "collection": "service_payments",
        "fields": {
          "payment_id": { "type": "string", "required": true, "unique": true },
          "booking_id": { "type": "string", "required": true },
          "amount_minor": { "type": "number", "required": true },
          "currency": { "type": "string", "required": true },
          "payment_type": { "type": "string", "required": true },
          "provider": { "type": "string", "required": true },
          "provider_reference": { "type": "string", "required": false },
          "status": { "type": "string", "required": true },
          "idempotency_key": { "type": "string", "required": true, "unique": true }
        }
      }$$::jsonb
    ),
    (
      'service_status_events',
      $${
        "collection": "service_status_events",
        "fields": {
          "status_event_id": { "type": "string", "required": true, "unique": true },
          "booking_id": { "type": "string", "required": true },
          "worker_id": { "type": "string", "required": false },
          "event_type": { "type": "string", "required": true },
          "event_label": { "type": "string", "required": true },
          "eta_text": { "type": "string", "required": false },
          "created_at": { "type": "string", "required": false }
        }
      }$$::jsonb
    ),
    (
      'service_reminder_jobs',
      $${
        "collection": "service_reminder_jobs",
        "fields": {
          "reminder_id": { "type": "string", "required": true, "unique": true },
          "booking_id": { "type": "string", "required": true },
          "reminder_type": { "type": "string", "required": true },
          "scheduled_for": { "type": "string", "required": false },
          "channel": { "type": "string", "required": true },
          "status": { "type": "string", "required": true }
        }
      }$$::jsonb
    ),
    (
      'service_invoices',
      $${
        "collection": "service_invoices",
        "fields": {
          "invoice_id": { "type": "string", "required": true, "unique": true },
          "booking_id": { "type": "string", "required": true },
          "invoice_number": { "type": "string", "required": true, "unique": true },
          "subtotal_minor": { "type": "number", "required": true },
          "tax_minor": { "type": "number", "required": true },
          "total_minor": { "type": "number", "required": true },
          "amount_paid_minor": { "type": "number", "required": true },
          "amount_due_minor": { "type": "number", "required": true },
          "status": { "type": "string", "required": true },
          "issued_at": { "type": "string", "required": false },
          "download_url": { "type": "url", "required": false }
        }
      }$$::jsonb
    ),
    (
      'service_feedback',
      $${
        "collection": "service_feedback",
        "fields": {
          "feedback_id": { "type": "string", "required": true, "unique": true },
          "booking_id": { "type": "string", "required": true },
          "customer_id": { "type": "string", "required": true },
          "rating": { "type": "number", "required": true },
          "comment": { "type": "string", "required": false },
          "sentiment": { "type": "string", "required": false },
          "created_at": { "type": "string", "required": false }
        }
      }$$::jsonb
    ),
    (
      'service_complaints',
      $${
        "collection": "service_complaints",
        "fields": {
          "complaint_id": { "type": "string", "required": true, "unique": true },
          "booking_id": { "type": "string", "required": false },
          "customer_id": { "type": "string", "required": false },
          "category": { "type": "string", "required": true },
          "priority": { "type": "string", "required": true },
          "description": { "type": "string", "required": true },
          "status": { "type": "string", "required": true },
          "created_at": { "type": "string", "required": false }
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
      'seed_srv_ac_diagnosis',
      'service_catalog',
      'service_id',
      'svc-ac-001',
      jsonb_build_object(
        'service_id', 'SVC-AC-001',
        'service_code', 'AC-DIAG',
        'category', 'ac_service',
        'service_name', 'AC Inspection & Diagnosis',
        'description', 'Technician inspects the AC, confirms the likely issue, and recommends the next action.',
        'pricing_model', 'inspection',
        'base_price_minor', 39900,
        'currency', 'INR',
        'duration_minutes', 45,
        'location_required', true,
        'media_required', 'optional',
        'inspection_required', true,
        'payment_policy', 'booking_fee',
        'booking_mode', 'service',
        'assignment_mode', 'skill_based',
        'required_skill', 'ac_service',
        'service_radius_km', 15,
        'price_label', 'Starting Rs 399',
        'booking_fee_minor', 19900,
        'intake_hint', 'Share the AC type, unit count, and what symptom you are seeing.',
        'active', true
      )
    ),
    (
      'seed_srv_plumbing_leak',
      'service_catalog',
      'service_id',
      'svc-pl-001',
      jsonb_build_object(
        'service_id', 'SVC-PL-001',
        'service_code', 'PL-LEAK',
        'category', 'plumbing',
        'service_name', 'Leak Repair Visit',
        'description', 'Onsite plumber visit for sink, pipe, or tap leakage issues.',
        'pricing_model', 'fixed',
        'base_price_minor', 69900,
        'currency', 'INR',
        'duration_minutes', 60,
        'location_required', true,
        'media_required', 'optional',
        'inspection_required', false,
        'payment_policy', 'booking_fee',
        'booking_mode', 'service',
        'assignment_mode', 'skill_based',
        'required_skill', 'plumbing',
        'service_radius_km', 12,
        'price_label', 'Rs 699',
        'booking_fee_minor', 19900,
        'intake_hint', 'Tell us which fixture is leaking and whether the flow is severe.',
        'active', true
      )
    ),
    (
      'seed_srv_pest_2bhk',
      'service_catalog',
      'service_id',
      'svc-pc-001',
      jsonb_build_object(
        'service_id', 'SVC-PC-001',
        'service_code', 'PEST-2BHK',
        'category', 'pest_control',
        'service_name', 'Kitchen & 2 BHK Pest Treatment',
        'description', 'Cockroach and crawling-insect treatment for apartments up to 2 BHK.',
        'pricing_model', 'parameter_based',
        'base_price_minor', 149900,
        'currency', 'INR',
        'duration_minutes', 90,
        'location_required', true,
        'media_required', 'optional',
        'inspection_required', false,
        'payment_policy', 'deposit',
        'booking_mode', 'service',
        'assignment_mode', 'round_robin',
        'required_skill', 'pest_control',
        'service_radius_km', 18,
        'price_label', 'From Rs 1,499',
        'booking_fee_minor', 49900,
        'intake_hint', 'Share the property size, pest type, and any severe infestation areas.',
        'active', true
      )
    ),
    (
      'seed_srv_salon_grooming',
      'service_catalog',
      'service_id',
      'svc-sl-001',
      jsonb_build_object(
        'service_id', 'SVC-SL-001',
        'service_code', 'SALON-GRM',
        'category', 'salon',
        'service_name', 'Haircut & Beard Grooming',
        'description', 'In-branch grooming appointment with a stylist.',
        'pricing_model', 'fixed',
        'base_price_minor', 79900,
        'currency', 'INR',
        'duration_minutes', 50,
        'location_required', false,
        'media_required', 'skip',
        'inspection_required', false,
        'payment_policy', 'full_prepayment',
        'booking_mode', 'appointment',
        'assignment_mode', 'specific_staff',
        'required_skill', 'grooming',
        'service_radius_km', 0,
        'price_label', 'Rs 799',
        'booking_fee_minor', 79900,
        'intake_hint', 'Mention branch preference or stylist preference if relevant.',
        'active', true
      )
    ),
    (
      'seed_srv_interior_consult',
      'service_catalog',
      'service_id',
      'svc-int-001',
      jsonb_build_object(
        'service_id', 'SVC-INT-001',
        'service_code', 'INT-CONSULT',
        'category', 'interiors',
        'service_name', 'Interior Design Consultation',
        'description', 'Initial discovery consultation for home interiors and renovation planning.',
        'pricing_model', 'custom_quote',
        'base_price_minor', 99900,
        'currency', 'INR',
        'duration_minutes', 60,
        'location_required', true,
        'media_required', 'required',
        'inspection_required', true,
        'payment_policy', 'consultation_fee',
        'booking_mode', 'consultation',
        'assignment_mode', 'skill_based',
        'required_skill', 'interior_design',
        'service_radius_km', 20,
        'price_label', 'Consultation fee Rs 999',
        'booking_fee_minor', 99900,
        'intake_hint', 'Share property type, BHK, room goals, and budget expectations.',
        'active', true
      )
    ),

    (
      'seed_area_ac_miyapur',
      'service_areas',
      'service_area_id',
      'area-ac-miyapur',
      jsonb_build_object(
        'service_area_id', 'AREA-AC-MIY',
        'service_id', 'SVC-AC-001',
        'category', 'ac_service',
        'branch_name', 'Miyapur Operations',
        'locality', 'Miyapur',
        'city', 'Hyderabad',
        'postal_code', '500049',
        'active', true
      )
    ),
    (
      'seed_area_plumb_miyapur',
      'service_areas',
      'service_area_id',
      'area-pl-miyapur',
      jsonb_build_object(
        'service_area_id', 'AREA-PL-MIY',
        'service_id', 'SVC-PL-001',
        'category', 'plumbing',
        'branch_name', 'Miyapur Operations',
        'locality', 'Miyapur',
        'city', 'Hyderabad',
        'postal_code', '500049',
        'active', true
      )
    ),
    (
      'seed_area_pest_miyapur',
      'service_areas',
      'service_area_id',
      'area-pc-miyapur',
      jsonb_build_object(
        'service_area_id', 'AREA-PC-MIY',
        'service_id', 'SVC-PC-001',
        'category', 'pest_control',
        'branch_name', 'Miyapur Operations',
        'locality', 'Miyapur',
        'city', 'Hyderabad',
        'postal_code', '500049',
        'active', true
      )
    ),
    (
      'seed_area_interior_kphb',
      'service_areas',
      'service_area_id',
      'area-int-kphb',
      jsonb_build_object(
        'service_area_id', 'AREA-INT-KPHB',
        'service_id', 'SVC-INT-001',
        'category', 'interiors',
        'branch_name', 'KPHB Design Desk',
        'locality', 'KPHB',
        'city', 'Hyderabad',
        'postal_code', '500072',
        'active', true
      )
    ),
    (
      'seed_area_ac_kondapur',
      'service_areas',
      'service_area_id',
      'area-ac-kondapur',
      jsonb_build_object(
        'service_area_id', 'AREA-AC-KON',
        'service_id', 'SVC-AC-001',
        'category', 'ac_service',
        'branch_name', 'Kondapur Operations',
        'locality', 'Kondapur',
        'city', 'Hyderabad',
        'postal_code', '500084',
        'active', true
      )
    ),

    (
      'seed_customer_rahul',
      'service_customers',
      'phone_e164',
      'phone:9876543210',
      jsonb_build_object(
        'customer_id', 'CUS-SVC-0001',
        'full_name', 'Rahul Verma',
        'phone_e164', '+919876543210',
        'email', 'rahul.verma@example.com',
        'preferred_language', 'en',
        'saved_address_id', 'ADDR-SVC-0001',
        'last_service_category', 'ac_service',
        'last_booking_id', 'BKG-SVC-0001'
      )
    ),
    (
      'seed_customer_sneha',
      'service_customers',
      'phone_e164',
      'phone:9123456780',
      jsonb_build_object(
        'customer_id', 'CUS-SVC-0002',
        'full_name', 'Sneha Rao',
        'phone_e164', '+919123456780',
        'email', 'sneha.rao@example.com',
        'preferred_language', 'en',
        'saved_address_id', 'ADDR-SVC-0002',
        'last_service_category', 'plumbing',
        'last_booking_id', 'BKG-SVC-0002'
      )
    ),

    (
      'seed_address_rahul',
      'service_customer_addresses',
      'address_id',
      'addr-svc-0001',
      jsonb_build_object(
        'address_id', 'ADDR-SVC-0001',
        'customer_id', 'CUS-SVC-0001',
        'label', 'Home',
        'address_line_1', 'Flat 504, Green Heights',
        'address_line_2', 'Near Miyapur Metro',
        'locality', 'Miyapur',
        'city', 'Hyderabad',
        'state', 'Telangana',
        'postal_code', '500049',
        'latitude', '',
        'longitude', '',
        'is_default', true
      )
    ),
    (
      'seed_address_sneha',
      'service_customer_addresses',
      'address_id',
      'addr-svc-0002',
      jsonb_build_object(
        'address_id', 'ADDR-SVC-0002',
        'customer_id', 'CUS-SVC-0002',
        'label', 'Apartment',
        'address_line_1', 'A-903, Oak Residency',
        'address_line_2', '',
        'locality', 'Miyapur',
        'city', 'Hyderabad',
        'state', 'Telangana',
        'postal_code', '500049',
        'latitude', '',
        'longitude', '',
        'is_default', true
      )
    ),

    (
      'seed_question_ac_type',
      'service_questions',
      'question_id',
      'q-ac-type',
      jsonb_build_object(
        'question_id', 'Q-AC-TYPE',
        'service_id', 'SVC-AC-001',
        'field_key', 'ac_type',
        'label', 'AC type',
        'field_type', 'select',
        'required', true,
        'options_csv', 'split,window,cassette',
        'display_order', 1,
        'active', true
      )
    ),
    (
      'seed_question_ac_units',
      'service_questions',
      'question_id',
      'q-ac-units',
      jsonb_build_object(
        'question_id', 'Q-AC-UNITS',
        'service_id', 'SVC-AC-001',
        'field_key', 'unit_count',
        'label', 'How many AC units need attention?',
        'field_type', 'number',
        'required', true,
        'options_csv', '',
        'display_order', 2,
        'active', true
      )
    ),
    (
      'seed_question_pest_size',
      'service_questions',
      'question_id',
      'q-pest-size',
      jsonb_build_object(
        'question_id', 'Q-PC-SIZE',
        'service_id', 'SVC-PC-001',
        'field_key', 'property_size',
        'label', 'Property size',
        'field_type', 'select',
        'required', true,
        'options_csv', '1bhk,2bhk,3bhk,4bhk',
        'display_order', 1,
        'active', true
      )
    ),
    (
      'seed_question_pest_type',
      'service_questions',
      'question_id',
      'q-pest-type',
      jsonb_build_object(
        'question_id', 'Q-PC-TYPE',
        'service_id', 'SVC-PC-001',
        'field_key', 'pest_type',
        'label', 'Which pest are you seeing?',
        'field_type', 'select',
        'required', true,
        'options_csv', 'cockroach,termite,rodent,other',
        'display_order', 2,
        'active', true
      )
    ),
    (
      'seed_question_plumbing_fixture',
      'service_questions',
      'question_id',
      'q-pl-fixture',
      jsonb_build_object(
        'question_id', 'Q-PL-FIXTURE',
        'service_id', 'SVC-PL-001',
        'field_key', 'fixture_type',
        'label', 'Which fixture is leaking?',
        'field_type', 'select',
        'required', true,
        'options_csv', 'sink,tap,pipe,wash_basin,other',
        'display_order', 1,
        'active', true
      )
    ),
    (
      'seed_question_plumbing_severity',
      'service_questions',
      'question_id',
      'q-pl-severity',
      jsonb_build_object(
        'question_id', 'Q-PL-SEVERITY',
        'service_id', 'SVC-PL-001',
        'field_key', 'severity',
        'label', 'How severe is the leak?',
        'field_type', 'select',
        'required', true,
        'options_csv', 'slow,medium,severe',
        'display_order', 2,
        'active', true
      )
    ),
    (
      'seed_question_interior_bhk',
      'service_questions',
      'question_id',
      'q-int-bhk',
      jsonb_build_object(
        'question_id', 'Q-INT-BHK',
        'service_id', 'SVC-INT-001',
        'field_key', 'bhk',
        'label', 'BHK or project size',
        'field_type', 'text',
        'required', true,
        'options_csv', '',
        'display_order', 1,
        'active', true
      )
    ),
    (
      'seed_question_interior_budget',
      'service_questions',
      'question_id',
      'q-int-budget',
      jsonb_build_object(
        'question_id', 'Q-INT-BUDGET',
        'service_id', 'SVC-INT-001',
        'field_key', 'budget_range',
        'label', 'Target budget range',
        'field_type', 'text',
        'required', false,
        'options_csv', '',
        'display_order', 2,
        'active', true
      )
    ),

    (
      'seed_request_upcoming',
      'service_requests',
      'request_id',
      'req-svc-0001',
      jsonb_build_object(
        'request_id', 'REQ-SVC-0001',
        'customer_id', 'CUS-SVC-0001',
        'service_id', 'SVC-AC-001',
        'category', 'ac_service',
        'request_summary', 'AC not cooling properly in the living room.',
        'urgency', 'normal',
        'service_address_id', 'ADDR-SVC-0001',
        'pricing_model', 'inspection',
        'estimated_amount_minor', 39900,
        'status', 'booked',
        'preferred_date_note', 'Tomorrow morning works best',
        'source_channel', 'WHATSAPP',
        'created_at', '2026-08-25T09:15:00.000Z'
      )
    ),
    (
      'seed_request_completed',
      'service_requests',
      'request_id',
      'req-svc-0002',
      jsonb_build_object(
        'request_id', 'REQ-SVC-0002',
        'customer_id', 'CUS-SVC-0002',
        'service_id', 'SVC-PL-001',
        'category', 'plumbing',
        'request_summary', 'Kitchen sink leaking badly.',
        'urgency', 'high',
        'service_address_id', 'ADDR-SVC-0002',
        'pricing_model', 'fixed',
        'estimated_amount_minor', 179900,
        'status', 'completed',
        'preferred_date_note', 'Completed last week',
        'source_channel', 'WEB',
        'created_at', '2026-08-18T08:10:00.000Z'
      )
    ),

    (
      'seed_media_completed',
      'service_request_media',
      'media_id',
      'req-svc-0002-media',
      jsonb_build_object(
        'media_id', 'REQ-SVC-0002:MEDIA',
        'request_id', 'REQ-SVC-0002',
        'media_type', 'service_photo_batch',
        'storage_key', 'req-svc-0002/media',
        'mime_type', 'image/jpeg',
        'size_bytes', 152340,
        'checksum', 'demo-checksum-req-svc-0002',
        'analysis_summary', 'Visible water leakage near the kitchen sink piping.',
        'status', 'received'
      )
    ),

    (
      'seed_slot_ac_booked',
      'service_availability_slots',
      'slot_id',
      'slot-ac-2026-08-27-1130',
      jsonb_build_object(
        'id', 'SLOT-AC-2026-08-27-1130',
        'slot_id', 'SLOT-AC-2026-08-27-1130',
        'service_id', 'SVC-AC-001',
        'service_area_id', 'AREA-AC-MIY',
        'worker_id', 'WRK-SVC-0001',
        'worker_name', 'Rajesh Kumar',
        'date', '2026-08-27',
        'start', '11:30',
        'end', '12:30',
        'label', 'Thursday 11:30 AM',
        'status', 'booked',
        'hold_id', 'HOLD-SVC-0001',
        'held_by_session', 'seed',
        'request_id', 'REQ-SVC-0001'
      )
    ),
    (
      'seed_slot_ac_available_1',
      'service_availability_slots',
      'slot_id',
      'slot-ac-2026-08-27-0900',
      jsonb_build_object(
        'id', 'SLOT-AC-2026-08-27-0900',
        'slot_id', 'SLOT-AC-2026-08-27-0900',
        'service_id', 'SVC-AC-001',
        'service_area_id', 'AREA-AC-MIY',
        'worker_id', 'WRK-SVC-0001',
        'worker_name', 'Rajesh Kumar',
        'date', '2026-08-27',
        'start', '09:00',
        'end', '10:00',
        'label', 'Thursday 9:00 AM',
        'status', 'available',
        'hold_id', '',
        'held_by_session', '',
        'request_id', ''
      )
    ),
    (
      'seed_slot_ac_available_2',
      'service_availability_slots',
      'slot_id',
      'slot-ac-2026-08-28-1600',
      jsonb_build_object(
        'id', 'SLOT-AC-2026-08-28-1600',
        'slot_id', 'SLOT-AC-2026-08-28-1600',
        'service_id', 'SVC-AC-001',
        'service_area_id', 'AREA-AC-KON',
        'worker_id', 'WRK-SVC-0002',
        'worker_name', 'Imran Shaikh',
        'date', '2026-08-28',
        'start', '16:00',
        'end', '17:00',
        'label', 'Friday 4:00 PM',
        'status', 'available',
        'hold_id', '',
        'held_by_session', '',
        'request_id', ''
      )
    ),
    (
      'seed_slot_pl_completed',
      'service_availability_slots',
      'slot_id',
      'slot-pl-2026-08-20-1000',
      jsonb_build_object(
        'id', 'SLOT-PL-2026-08-20-1000',
        'slot_id', 'SLOT-PL-2026-08-20-1000',
        'service_id', 'SVC-PL-001',
        'service_area_id', 'AREA-PL-MIY',
        'worker_id', 'WRK-SVC-0003',
        'worker_name', 'Mahesh Reddy',
        'date', '2026-08-20',
        'start', '10:00',
        'end', '11:00',
        'label', 'Thursday 10:00 AM',
        'status', 'booked',
        'hold_id', 'HOLD-SVC-0002',
        'held_by_session', 'seed',
        'request_id', 'REQ-SVC-0002'
      )
    ),
    (
      'seed_slot_pl_available_1',
      'service_availability_slots',
      'slot_id',
      'slot-pl-2026-08-27-1500',
      jsonb_build_object(
        'id', 'SLOT-PL-2026-08-27-1500',
        'slot_id', 'SLOT-PL-2026-08-27-1500',
        'service_id', 'SVC-PL-001',
        'service_area_id', 'AREA-PL-MIY',
        'worker_id', 'WRK-SVC-0003',
        'worker_name', 'Mahesh Reddy',
        'date', '2026-08-27',
        'start', '15:00',
        'end', '16:00',
        'label', 'Thursday 3:00 PM',
        'status', 'available',
        'hold_id', '',
        'held_by_session', '',
        'request_id', ''
      )
    ),
    (
      'seed_slot_pl_available_2',
      'service_availability_slots',
      'slot_id',
      'slot-pl-2026-08-28-1030',
      jsonb_build_object(
        'id', 'SLOT-PL-2026-08-28-1030',
        'slot_id', 'SLOT-PL-2026-08-28-1030',
        'service_id', 'SVC-PL-001',
        'service_area_id', 'AREA-PL-MIY',
        'worker_id', 'WRK-SVC-0004',
        'worker_name', 'Sunil Pawar',
        'date', '2026-08-28',
        'start', '10:30',
        'end', '11:30',
        'label', 'Friday 10:30 AM',
        'status', 'available',
        'hold_id', '',
        'held_by_session', '',
        'request_id', ''
      )
    ),
    (
      'seed_slot_pest_available',
      'service_availability_slots',
      'slot_id',
      'slot-pc-2026-08-29-1000',
      jsonb_build_object(
        'id', 'SLOT-PC-2026-08-29-1000',
        'slot_id', 'SLOT-PC-2026-08-29-1000',
        'service_id', 'SVC-PC-001',
        'service_area_id', 'AREA-PC-MIY',
        'worker_id', 'WRK-SVC-0004',
        'worker_name', 'Sunil Pawar',
        'date', '2026-08-29',
        'start', '10:00',
        'end', '11:30',
        'label', 'Saturday 10:00 AM',
        'status', 'available',
        'hold_id', '',
        'held_by_session', '',
        'request_id', ''
      )
    ),
    (
      'seed_slot_interior_available',
      'service_availability_slots',
      'slot_id',
      'slot-int-2026-09-01-1700',
      jsonb_build_object(
        'id', 'SLOT-INT-2026-09-01-1700',
        'slot_id', 'SLOT-INT-2026-09-01-1700',
        'service_id', 'SVC-INT-001',
        'service_area_id', 'AREA-INT-KPHB',
        'worker_id', 'WRK-SVC-0005',
        'worker_name', 'Aparna Design Team',
        'date', '2026-09-01',
        'start', '17:00',
        'end', '18:00',
        'label', 'Tuesday 5:00 PM',
        'status', 'available',
        'hold_id', '',
        'held_by_session', '',
        'request_id', ''
      )
    ),

    (
      'seed_hold_upcoming',
      'service_slot_holds',
      'hold_id',
      'hold-svc-0001',
      jsonb_build_object(
        'hold_id', 'HOLD-SVC-0001',
        'request_id', 'REQ-SVC-0001',
        'slot_id', 'SLOT-AC-2026-08-27-1130',
        'session_id', 'seed',
        'status', 'converted',
        'expires_at', '2026-08-25T10:00:00.000Z'
      )
    ),
    (
      'seed_hold_completed',
      'service_slot_holds',
      'hold_id',
      'hold-svc-0002',
      jsonb_build_object(
        'hold_id', 'HOLD-SVC-0002',
        'request_id', 'REQ-SVC-0002',
        'slot_id', 'SLOT-PL-2026-08-20-1000',
        'session_id', 'seed',
        'status', 'converted',
        'expires_at', '2026-08-19T17:00:00.000Z'
      )
    ),

    (
      'seed_booking_upcoming',
      'service_bookings',
      'booking_id',
      'bkg-svc-0001',
      jsonb_build_object(
        'booking_id', 'BKG-SVC-0001',
        'booking_number', 'SRV-20260827-A8K52',
        'request_id', 'REQ-SVC-0001',
        'customer_id', 'CUS-SVC-0001',
        'service_id', 'SVC-AC-001',
        'service_name', 'AC Inspection & Diagnosis',
        'slot_id', 'SLOT-AC-2026-08-27-1130',
        'service_address_id', 'ADDR-SVC-0001',
        'scheduled_date', '2026-08-27',
        'scheduled_time', '11:30',
        'scheduled_end_time', '12:30',
        'status', 'assigned',
        'payment_status', 'paid',
        'assignment_status', 'assigned',
        'amount_due_minor', 39900,
        'amount_paid_minor', 19900,
        'balance_due_minor', 20000,
        'final_amount_minor', 39900,
        'worker_id', 'WRK-SVC-0001',
        'worker_name', 'Rajesh Kumar',
        'updated_at', '2026-08-25T09:25:00.000Z'
      )
    ),
    (
      'seed_booking_completed',
      'service_bookings',
      'booking_id',
      'bkg-svc-0002',
      jsonb_build_object(
        'booking_id', 'BKG-SVC-0002',
        'booking_number', 'SRV-20260820-P7L11',
        'request_id', 'REQ-SVC-0002',
        'customer_id', 'CUS-SVC-0002',
        'service_id', 'SVC-PL-001',
        'service_name', 'Leak Repair Visit',
        'slot_id', 'SLOT-PL-2026-08-20-1000',
        'service_address_id', 'ADDR-SVC-0002',
        'scheduled_date', '2026-08-20',
        'scheduled_time', '10:00',
        'scheduled_end_time', '11:00',
        'status', 'completed',
        'payment_status', 'partially_paid',
        'assignment_status', 'completed',
        'amount_due_minor', 179900,
        'amount_paid_minor', 99900,
        'balance_due_minor', 80000,
        'final_amount_minor', 179900,
        'worker_id', 'WRK-SVC-0003',
        'worker_name', 'Mahesh Reddy',
        'updated_at', '2026-08-20T12:00:00.000Z'
      )
    ),

    (
      'seed_worker_rajesh',
      'service_workers',
      'worker_id',
      'wrk-svc-0001',
      jsonb_build_object(
        'worker_id', 'WRK-SVC-0001',
        'worker_name', 'Rajesh Kumar',
        'primary_skill', 'ac_service',
        'service_area_id', 'AREA-AC-MIY',
        'status', 'active',
        'rating', 4.8,
        'current_load', 2,
        'phone', '+919900061001'
      )
    ),
    (
      'seed_worker_imran',
      'service_workers',
      'worker_id',
      'wrk-svc-0002',
      jsonb_build_object(
        'worker_id', 'WRK-SVC-0002',
        'worker_name', 'Imran Shaikh',
        'primary_skill', 'ac_service',
        'service_area_id', 'AREA-AC-KON',
        'status', 'active',
        'rating', 4.5,
        'current_load', 3,
        'phone', '+919900061002'
      )
    ),
    (
      'seed_worker_mahesh',
      'service_workers',
      'worker_id',
      'wrk-svc-0003',
      jsonb_build_object(
        'worker_id', 'WRK-SVC-0003',
        'worker_name', 'Mahesh Reddy',
        'primary_skill', 'plumbing',
        'service_area_id', 'AREA-PL-MIY',
        'status', 'active',
        'rating', 4.7,
        'current_load', 1,
        'phone', '+919900061003'
      )
    ),
    (
      'seed_worker_sunil',
      'service_workers',
      'worker_id',
      'wrk-svc-0004',
      jsonb_build_object(
        'worker_id', 'WRK-SVC-0004',
        'worker_name', 'Sunil Pawar',
        'primary_skill', 'pest_control',
        'service_area_id', 'AREA-PC-MIY',
        'status', 'active',
        'rating', 4.6,
        'current_load', 2,
        'phone', '+919900061004'
      )
    ),
    (
      'seed_worker_aparna',
      'service_workers',
      'worker_id',
      'wrk-svc-0005',
      jsonb_build_object(
        'worker_id', 'WRK-SVC-0005',
        'worker_name', 'Aparna Design Team',
        'primary_skill', 'interior_design',
        'service_area_id', 'AREA-INT-KPHB',
        'status', 'active',
        'rating', 4.9,
        'current_load', 1,
        'phone', '+919900061005'
      )
    ),

    (
      'seed_assignment_upcoming',
      'service_assignments',
      'assignment_id',
      'bkg-svc-0001',
      jsonb_build_object(
        'assignment_id', 'BKG-SVC-0001',
        'booking_id', 'BKG-SVC-0001',
        'worker_id', 'WRK-SVC-0001',
        'worker_name', 'Rajesh Kumar',
        'assignment_type', 'skill_based',
        'status', 'assigned',
        'service_area_id', 'AREA-AC-MIY',
        'score', 94.5
      )
    ),
    (
      'seed_assignment_completed',
      'service_assignments',
      'assignment_id',
      'bkg-svc-0002',
      jsonb_build_object(
        'assignment_id', 'BKG-SVC-0002',
        'booking_id', 'BKG-SVC-0002',
        'worker_id', 'WRK-SVC-0003',
        'worker_name', 'Mahesh Reddy',
        'assignment_type', 'skill_based',
        'status', 'completed',
        'service_area_id', 'AREA-PL-MIY',
        'score', 96.2
      )
    ),

    (
      'seed_payment_upcoming_fee',
      'service_payments',
      'payment_id',
      'pay-svc-0001',
      jsonb_build_object(
        'payment_id', 'PAY-SVC-0001',
        'booking_id', 'BKG-SVC-0001',
        'amount_minor', 19900,
        'currency', 'INR',
        'payment_type', 'booking_fee',
        'provider', 'razorpay',
        'provider_reference', 'rzp_svc_0001',
        'status', 'paid',
        'idempotency_key', 'PAY-SVC-0001'
      )
    ),
    (
      'seed_payment_completed_advance',
      'service_payments',
      'payment_id',
      'pay-svc-0002',
      jsonb_build_object(
        'payment_id', 'PAY-SVC-0002',
        'booking_id', 'BKG-SVC-0002',
        'amount_minor', 99900,
        'currency', 'INR',
        'payment_type', 'advance',
        'provider', 'razorpay',
        'provider_reference', 'rzp_svc_0002',
        'status', 'paid',
        'idempotency_key', 'PAY-SVC-0002'
      )
    ),

    (
      'seed_status_upcoming_confirmed',
      'service_status_events',
      'status_event_id',
      'bkg-svc-0001-confirmed',
      jsonb_build_object(
        'status_event_id', 'BKG-SVC-0001:confirmed',
        'booking_id', 'BKG-SVC-0001',
        'worker_id', '',
        'event_type', 'confirmed',
        'event_label', 'Booking confirmed',
        'eta_text', 'We will assign the professional before the visit.',
        'created_at', '2026-08-25T09:20:00.000Z'
      )
    ),
    (
      'seed_status_upcoming_assigned',
      'service_status_events',
      'status_event_id',
      'bkg-svc-0001-assigned',
      jsonb_build_object(
        'status_event_id', 'BKG-SVC-0001:assigned',
        'booking_id', 'BKG-SVC-0001',
        'worker_id', 'WRK-SVC-0001',
        'event_type', 'assigned',
        'event_label', 'Professional assignment confirmed',
        'eta_text', 'Rajesh Kumar will arrive between 11:30 AM and 12:30 PM.',
        'created_at', '2026-08-25T09:30:00.000Z'
      )
    ),
    (
      'seed_status_completed_assigned',
      'service_status_events',
      'status_event_id',
      'bkg-svc-0002-assigned',
      jsonb_build_object(
        'status_event_id', 'BKG-SVC-0002:assigned',
        'booking_id', 'BKG-SVC-0002',
        'worker_id', 'WRK-SVC-0003',
        'event_type', 'assigned',
        'event_label', 'Plumber assigned',
        'eta_text', '',
        'created_at', '2026-08-20T09:00:00.000Z'
      )
    ),
    (
      'seed_status_completed_progress',
      'service_status_events',
      'status_event_id',
      'bkg-svc-0002-progress',
      jsonb_build_object(
        'status_event_id', 'BKG-SVC-0002:inprogress',
        'booking_id', 'BKG-SVC-0002',
        'worker_id', 'WRK-SVC-0003',
        'event_type', 'in_progress',
        'event_label', 'Leak repair in progress',
        'eta_text', '',
        'created_at', '2026-08-20T10:15:00.000Z'
      )
    ),
    (
      'seed_status_completed_done',
      'service_status_events',
      'status_event_id',
      'bkg-svc-0002-completed',
      jsonb_build_object(
        'status_event_id', 'BKG-SVC-0002:completed',
        'booking_id', 'BKG-SVC-0002',
        'worker_id', 'WRK-SVC-0003',
        'event_type', 'completed',
        'event_label', 'Service completed',
        'eta_text', 'Final amount includes replacement connector and service charge.',
        'created_at', '2026-08-20T11:25:00.000Z'
      )
    ),

    (
      'seed_reminder_24h',
      'service_reminder_jobs',
      'reminder_id',
      'bkg-svc-0001-24h',
      jsonb_build_object(
        'reminder_id', 'BKG-SVC-0001:24h',
        'booking_id', 'BKG-SVC-0001',
        'reminder_type', '24h_before',
        'scheduled_for', '2026-08-26T11:30:00.000Z',
        'channel', 'whatsapp',
        'status', 'scheduled'
      )
    ),
    (
      'seed_reminder_2h',
      'service_reminder_jobs',
      'reminder_id',
      'bkg-svc-0001-2h',
      jsonb_build_object(
        'reminder_id', 'BKG-SVC-0001:2h',
        'booking_id', 'BKG-SVC-0001',
        'reminder_type', '2h_before',
        'scheduled_for', '2026-08-27T09:30:00.000Z',
        'channel', 'sms',
        'status', 'scheduled'
      )
    ),

    (
      'seed_invoice_completed',
      'service_invoices',
      'invoice_id',
      'inv-svc-0002',
      jsonb_build_object(
        'invoice_id', 'INV-SVC-0002',
        'booking_id', 'BKG-SVC-0002',
        'invoice_number', 'INV-PL-20260820-001',
        'subtotal_minor', 169900,
        'tax_minor', 10000,
        'total_minor', 179900,
        'amount_paid_minor', 99900,
        'amount_due_minor', 80000,
        'status', 'partially_paid',
        'issued_at', '2026-08-20T11:40:00.000Z',
        'download_url', 'https://example.com/invoices/INV-PL-20260820-001.pdf'
      )
    ),

    (
      'seed_feedback_completed',
      'service_feedback',
      'feedback_id',
      'bkg-svc-0002',
      jsonb_build_object(
        'feedback_id', 'BKG-SVC-0002',
        'booking_id', 'BKG-SVC-0002',
        'customer_id', 'CUS-SVC-0002',
        'rating', 4,
        'comment', 'Leak was fixed quickly, but balance payment is still pending.',
        'sentiment', 'positive',
        'created_at', '2026-08-21T08:00:00.000Z'
      )
    ),
    (
      'seed_complaint_completed',
      'service_complaints',
      'complaint_id',
      'cmp-svc-0002',
      jsonb_build_object(
        'complaint_id', 'CMP-SVC-0002',
        'booking_id', 'BKG-SVC-0002',
        'customer_id', 'CUS-SVC-0002',
        'category', 'pricing',
        'priority', 'normal',
        'description', 'Customer asked for clarification on the additional line-item charge.',
        'status', 'resolved',
        'created_at', '2026-08-21T08:10:00.000Z'
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
  COUNT(*) FILTER (WHERE seed_records.collection = 'service_catalog') AS catalog_records_seeded,
  COUNT(*) FILTER (WHERE seed_records.collection = 'service_availability_slots') AS slot_records_seeded,
  COUNT(*) FILTER (WHERE seed_records.collection = 'service_bookings') AS booking_records_seeded,
  COUNT(*) FILTER (WHERE seed_records.collection = 'service_invoices') AS invoice_records_seeded
FROM params
CROSS JOIN seed_records
GROUP BY params.tenant_id;

COMMIT;
