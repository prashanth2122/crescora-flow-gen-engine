-- Interior design demo seed for the FLOW record store.
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
--      psql $env:DATABASE_URL -f .\scripts\seed-demo-interior-design-records.sql
--
-- Date note:
--   This file is aligned to Tuesday, August 25, 2026.
--   September 2026 consultation, quote, project, and payment dates are intentionally in the future.

BEGIN;

SET search_path TO public;

WITH params AS (
  SELECT
    '8285edc4-af68-46c0-9e72-5b2819cb33d9'::text AS tenant_id,
    'seed-demo-interior-design-records'::text AS source_tag
),
schemas (collection, schema_json) AS (
  VALUES
    (
      'interior_customers',
      $${
        "collection": "interior_customers",
        "fields": {
          "customer_id": { "type": "string", "required": true, "unique": true },
          "full_name": { "type": "string", "required": true },
          "phone_e164": { "type": "phone", "required": true, "unique": true },
          "email": { "type": "email", "required": false },
          "preferred_channel": { "type": "string", "required": false },
          "preferred_language": { "type": "string", "required": false },
          "latest_lead_id": { "type": "string", "required": false }
        }
      }$$::jsonb
    ),
    (
      'interior_properties',
      $${
        "collection": "interior_properties",
        "fields": {
          "property_id": { "type": "string", "required": true, "unique": true },
          "customer_id": { "type": "string", "required": true },
          "property_type": { "type": "string", "required": true },
          "property_status": { "type": "string", "required": true },
          "configuration": { "type": "string", "required": false },
          "area_sqft": { "type": "number", "required": false },
          "city": { "type": "string", "required": false },
          "locality": { "type": "string", "required": false },
          "pincode": { "type": "string", "required": false },
          "address": { "type": "string", "required": false },
          "possession_timeline": { "type": "string", "required": false }
        }
      }$$::jsonb
    ),
    (
      'interior_leads',
      $${
        "collection": "interior_leads",
        "fields": {
          "lead_id": { "type": "string", "required": true, "unique": true },
          "lead_number": { "type": "string", "required": true, "unique": true },
          "customer_id": { "type": "string", "required": true },
          "property_id": { "type": "string", "required": true },
          "customer_mobile": { "type": "phone", "required": true },
          "customer_name": { "type": "string", "required": true },
          "customer_email": { "type": "email", "required": false },
          "source_channel": { "type": "string", "required": true },
          "entry_mode": { "type": "string", "required": true },
          "stage": { "type": "string", "required": true },
          "status": { "type": "string", "required": true },
          "qualification": { "type": "string", "required": false },
          "lead_score": { "type": "number", "required": false },
          "property_type": { "type": "string", "required": false },
          "configuration": { "type": "string", "required": false },
          "city": { "type": "string", "required": false },
          "locality": { "type": "string", "required": false },
          "design_style": { "type": "string", "required": false },
          "budget_band": { "type": "string", "required": false },
          "target_timeline": { "type": "string", "required": false },
          "scope_summary": { "type": "string", "required": false },
          "recommended_package_id": { "type": "string", "required": false },
          "recommended_package_name": { "type": "string", "required": false },
          "consultation_id": { "type": "string", "required": false },
          "consultation_status": { "type": "string", "required": false },
          "assigned_designer_id": { "type": "string", "required": false },
          "assigned_designer_name": { "type": "string", "required": false },
          "estimate_low_minor": { "type": "number", "required": false },
          "estimate_high_minor": { "type": "number", "required": false },
          "last_activity_at": { "type": "string", "required": false }
        }
      }$$::jsonb
    ),
    (
      'interior_lead_requirements',
      $${
        "collection": "interior_lead_requirements",
        "fields": {
          "requirement_id": { "type": "string", "required": true, "unique": true },
          "lead_id": { "type": "string", "required": true },
          "scope_items_csv": { "type": "string", "required": false },
          "scope_summary": { "type": "string", "required": false },
          "design_style": { "type": "string", "required": false },
          "budget_band": { "type": "string", "required": false },
          "target_timeline": { "type": "string", "required": false },
          "requirement_summary": { "type": "string", "required": false },
          "reference_asset_status": { "type": "string", "required": false },
          "estimate_low_minor": { "type": "number", "required": false },
          "estimate_high_minor": { "type": "number", "required": false }
        }
      }$$::jsonb
    ),
    (
      'interior_lead_assets',
      $${
        "collection": "interior_lead_assets",
        "fields": {
          "asset_id": { "type": "string", "required": true, "unique": true },
          "lead_id": { "type": "string", "required": true },
          "property_id": { "type": "string", "required": true },
          "asset_type": { "type": "string", "required": true },
          "asset_count": { "type": "number", "required": true },
          "processing_status": { "type": "string", "required": true },
          "extraction_summary": { "type": "string", "required": false }
        }
      }$$::jsonb
    ),
    (
      'interior_packages',
      $${
        "collection": "interior_packages",
        "fields": {
          "package_id": { "type": "string", "required": true, "unique": true },
          "package_name": { "type": "string", "required": true },
          "tier": { "type": "string", "required": true },
          "property_types": { "type": "string", "required": false },
          "budget_bands": { "type": "string", "required": false },
          "description": { "type": "string", "required": true },
          "min_price_minor": { "type": "number", "required": false },
          "max_price_minor": { "type": "number", "required": false },
          "included_services": { "type": "string", "required": false },
          "active": { "type": "boolean", "required": true }
        }
      }$$::jsonb
    ),
    (
      'interior_price_catalog',
      $${
        "collection": "interior_price_catalog",
        "fields": {
          "price_rule_id": { "type": "string", "required": true, "unique": true },
          "scope_code": { "type": "string", "required": true },
          "tier": { "type": "string", "required": true },
          "configuration": { "type": "string", "required": false },
          "min_minor": { "type": "number", "required": false },
          "max_minor": { "type": "number", "required": false },
          "active": { "type": "boolean", "required": true }
        }
      }$$::jsonb
    ),
    (
      'interior_portfolio_items',
      $${
        "collection": "interior_portfolio_items",
        "fields": {
          "portfolio_id": { "type": "string", "required": true, "unique": true },
          "title": { "type": "string", "required": true },
          "style_code": { "type": "string", "required": true },
          "property_type": { "type": "string", "required": false },
          "configuration": { "type": "string", "required": false },
          "room_scope": { "type": "string", "required": false },
          "locality": { "type": "string", "required": false },
          "highlight": { "type": "string", "required": false },
          "budget_band": { "type": "string", "required": false },
          "image_url": { "type": "url", "required": false },
          "active": { "type": "boolean", "required": true }
        }
      }$$::jsonb
    ),
    (
      'interior_material_catalog',
      $${
        "collection": "interior_material_catalog",
        "fields": {
          "material_id": { "type": "string", "required": true, "unique": true },
          "category": { "type": "string", "required": true },
          "brand": { "type": "string", "required": false },
          "product_name": { "type": "string", "required": true },
          "finish": { "type": "string", "required": false },
          "warranty_months": { "type": "number", "required": false },
          "approved_use": { "type": "string", "required": false },
          "faq_summary": { "type": "string", "required": false },
          "active": { "type": "boolean", "required": true }
        }
      }$$::jsonb
    ),
    (
      'interior_designers',
      $${
        "collection": "interior_designers",
        "fields": {
          "designer_id": { "type": "string", "required": true, "unique": true },
          "full_name": { "type": "string", "required": true },
          "team_name": { "type": "string", "required": false },
          "location_zone": { "type": "string", "required": false },
          "specialization": { "type": "string", "required": false },
          "budget_tier_focus": { "type": "string", "required": false },
          "languages": { "type": "string", "required": false },
          "capacity_state": { "type": "string", "required": false },
          "active": { "type": "boolean", "required": true }
        }
      }$$::jsonb
    ),
    (
      'interior_consultation_slots',
      $${
        "collection": "interior_consultation_slots",
        "fields": {
          "slot_id": { "type": "string", "required": true, "unique": true },
          "consultation_type": { "type": "string", "required": true },
          "location_zone": { "type": "string", "required": false },
          "designer_id": { "type": "string", "required": true },
          "designer_name": { "type": "string", "required": true },
          "slot_date": { "type": "string", "required": true },
          "start_at": { "type": "string", "required": true },
          "end_at": { "type": "string", "required": false },
          "slot_label": { "type": "string", "required": true },
          "status": { "type": "string", "required": true },
          "lead_id": { "type": "string", "required": false },
          "consultation_id": { "type": "string", "required": false }
        }
      }$$::jsonb
    ),
    (
      'interior_consultations',
      $${
        "collection": "interior_consultations",
        "fields": {
          "consultation_id": { "type": "string", "required": true, "unique": true },
          "consultation_number": { "type": "string", "required": true, "unique": true },
          "lead_id": { "type": "string", "required": true },
          "customer_id": { "type": "string", "required": true },
          "property_id": { "type": "string", "required": true },
          "consultation_type": { "type": "string", "required": true },
          "slot_id": { "type": "string", "required": true },
          "designer_id": { "type": "string", "required": true },
          "designer_name": { "type": "string", "required": true },
          "scheduled_at": { "type": "string", "required": true },
          "status": { "type": "string", "required": true }
        }
      }$$::jsonb
    ),
    (
      'interior_quotes',
      $${
        "collection": "interior_quotes",
        "fields": {
          "quote_id": { "type": "string", "required": true, "unique": true },
          "quote_number": { "type": "string", "required": true, "unique": true },
          "customer_mobile": { "type": "phone", "required": true },
          "lead_id": { "type": "string", "required": false },
          "property_id": { "type": "string", "required": false },
          "version": { "type": "number", "required": true },
          "status": { "type": "string", "required": true },
          "total_minor": { "type": "number", "required": false },
          "valid_until": { "type": "string", "required": false },
          "scope_summary": { "type": "string", "required": false },
          "next_action": { "type": "string", "required": false }
        }
      }$$::jsonb
    ),
    (
      'interior_projects',
      $${
        "collection": "interior_projects",
        "fields": {
          "project_id": { "type": "string", "required": true, "unique": true },
          "project_code": { "type": "string", "required": true, "unique": true },
          "customer_mobile": { "type": "phone", "required": true },
          "lead_id": { "type": "string", "required": false },
          "property_id": { "type": "string", "required": false },
          "project_name": { "type": "string", "required": true },
          "stage": { "type": "string", "required": true },
          "status": { "type": "string", "required": true },
          "completion_pct": { "type": "number", "required": false },
          "expected_installation_start": { "type": "string", "required": false },
          "expected_handover_date": { "type": "string", "required": false },
          "assigned_designer_name": { "type": "string", "required": false }
        }
      }$$::jsonb
    ),
    (
      'interior_project_milestones',
      $${
        "collection": "interior_project_milestones",
        "fields": {
          "milestone_id": { "type": "string", "required": true, "unique": true },
          "project_id": { "type": "string", "required": true },
          "customer_mobile": { "type": "phone", "required": true },
          "sequence_no": { "type": "number", "required": true },
          "milestone_name": { "type": "string", "required": true },
          "status": { "type": "string", "required": true },
          "expected_date": { "type": "string", "required": false }
        }
      }$$::jsonb
    ),
    (
      'interior_payments',
      $${
        "collection": "interior_payments",
        "fields": {
          "payment_id": { "type": "string", "required": true, "unique": true },
          "customer_mobile": { "type": "phone", "required": true },
          "lead_id": { "type": "string", "required": false },
          "project_id": { "type": "string", "required": false },
          "quote_id": { "type": "string", "required": false },
          "purpose": { "type": "string", "required": true },
          "amount_minor": { "type": "number", "required": true },
          "currency": { "type": "string", "required": true },
          "status": { "type": "string", "required": true },
          "due_date": { "type": "string", "required": false }
        }
      }$$::jsonb
    ),
    (
      'interior_service_tickets',
      $${
        "collection": "interior_service_tickets",
        "fields": {
          "ticket_id": { "type": "string", "required": true, "unique": true },
          "customer_mobile": { "type": "phone", "required": true },
          "project_id": { "type": "string", "required": false },
          "issue_type": { "type": "string", "required": true },
          "room_area": { "type": "string", "required": false },
          "priority": { "type": "string", "required": true },
          "description": { "type": "string", "required": true },
          "status": { "type": "string", "required": true },
          "preferred_visit_window": { "type": "string", "required": false }
        }
      }$$::jsonb
    ),
    (
      'interior_followup_jobs',
      $${
        "collection": "interior_followup_jobs",
        "fields": {
          "followup_id": { "type": "string", "required": true, "unique": true },
          "lead_id": { "type": "string", "required": false },
          "consultation_id": { "type": "string", "required": false },
          "job_type": { "type": "string", "required": true },
          "run_at": { "type": "string", "required": false },
          "channel": { "type": "string", "required": true },
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
      'seed_int_customer_rahul',
      'interior_customers',
      'phone_e164',
      'phone:9876543210',
      jsonb_build_object(
        'customer_id', 'INT-CUST-9876543210',
        'full_name', 'Rahul Verma',
        'phone_e164', '+919876543210',
        'email', 'rahul.verma@example.com',
        'preferred_channel', 'WhatsApp',
        'preferred_language', 'English',
        'latest_lead_id', 'INT-LEAD-0001'
      )
    ),
    (
      'seed_int_customer_sneha',
      'interior_customers',
      'phone_e164',
      'phone:9988776655',
      jsonb_build_object(
        'customer_id', 'INT-CUST-9988776655',
        'full_name', 'Sneha Reddy',
        'phone_e164', '+919988776655',
        'email', 'sneha.reddy@example.com',
        'preferred_channel', 'Phone',
        'preferred_language', 'English',
        'latest_lead_id', 'INT-LEAD-0002'
      )
    ),
    (
      'seed_int_property_rahul',
      'interior_properties',
      'property_id',
      'int-prop-0001',
      jsonb_build_object(
        'property_id', 'INT-PROP-0001',
        'customer_id', 'INT-CUST-9876543210',
        'property_type', 'Apartment',
        'property_status', 'Ready For Interiors',
        'configuration', '3 BHK',
        'area_sqft', 1650,
        'city', 'Hyderabad',
        'locality', 'Narsingi',
        'pincode', '500089',
        'address', 'My Home Avatar, Narsingi',
        'possession_timeline', 'Within 1 Month'
      )
    ),
    (
      'seed_int_property_sneha',
      'interior_properties',
      'property_id',
      'int-prop-0002',
      jsonb_build_object(
        'property_id', 'INT-PROP-0002',
        'customer_id', 'INT-CUST-9988776655',
        'property_type', 'Villa',
        'property_status', 'Under Construction',
        'configuration', 'Villa',
        'area_sqft', 3200,
        'city', 'Hyderabad',
        'locality', 'Kokapet',
        'pincode', '500075',
        'address', 'Kokapet Luxury Meadows',
        'possession_timeline', '3-6 Months'
      )
    ),
    (
      'seed_int_lead_rahul',
      'interior_leads',
      'lead_id',
      'int-lead-0001',
      jsonb_build_object(
        'lead_id', 'INT-LEAD-0001',
        'lead_number', 'INT-260825-4821',
        'customer_id', 'INT-CUST-9876543210',
        'property_id', 'INT-PROP-0001',
        'customer_mobile', '+919876543210',
        'customer_name', 'Rahul Verma',
        'customer_email', 'rahul.verma@example.com',
        'source_channel', 'WHATSAPP',
        'entry_mode', 'estimate',
        'stage', 'proposal_sent',
        'status', 'open',
        'qualification', 'hot',
        'lead_score', 92,
        'property_type', 'Apartment',
        'configuration', '3 BHK',
        'city', 'Hyderabad',
        'locality', 'Narsingi',
        'design_style', 'modern_luxury',
        'budget_band', 'Rs 12L-Rs 20L',
        'target_timeline', '1-3 Months',
        'scope_summary', 'Full Home, Modular Kitchen, Wardrobes, TV Unit, Pooja Unit',
        'recommended_package_id', 'PKG-INT-PRM',
        'recommended_package_name', 'Premium Interiors',
        'consultation_id', 'INT-CONS-0001',
        'consultation_status', 'booked',
        'assigned_designer_id', 'INT-DSN-0001',
        'assigned_designer_name', 'Aditi Sharma',
        'estimate_low_minor', 124000000,
        'estimate_high_minor', 186000000,
        'last_activity_at', '2026-08-25T08:30:00.000Z'
      )
    ),
    (
      'seed_int_lead_sneha',
      'interior_leads',
      'lead_id',
      'int-lead-0002',
      jsonb_build_object(
        'lead_id', 'INT-LEAD-0002',
        'lead_number', 'INT-260825-5822',
        'customer_id', 'INT-CUST-9988776655',
        'property_id', 'INT-PROP-0002',
        'customer_mobile', '+919988776655',
        'customer_name', 'Sneha Reddy',
        'customer_email', 'sneha.reddy@example.com',
        'source_channel', 'WEB',
        'entry_mode', 'consultation',
        'stage', 'consultation_booked',
        'status', 'confirmed_lead',
        'qualification', 'warm',
        'lead_score', 71,
        'property_type', 'Villa',
        'configuration', 'Villa',
        'city', 'Hyderabad',
        'locality', 'Kokapet',
        'design_style', 'luxury',
        'budget_band', 'Rs 30L+',
        'target_timeline', '3-6 Months',
        'scope_summary', 'Full Home, Lighting, False Ceiling',
        'recommended_package_id', 'PKG-INT-SIG',
        'recommended_package_name', 'Signature Interiors',
        'consultation_id', 'INT-CONS-0002',
        'consultation_status', 'booked',
        'assigned_designer_id', 'INT-DSN-0002',
        'assigned_designer_name', 'Nikhil Rao',
        'estimate_low_minor', 280000000,
        'estimate_high_minor', 420000000,
        'last_activity_at', '2026-08-25T08:45:00.000Z'
      )
    ),
    (
      'seed_int_requirement_rahul',
      'interior_lead_requirements',
      'requirement_id',
      'int-req-0001',
      jsonb_build_object(
        'requirement_id', 'INT-REQ-0001',
        'lead_id', 'INT-LEAD-0001',
        'scope_items_csv', 'full_home, modular_kitchen, wardrobes, tv_unit, pooja_unit',
        'scope_summary', 'Full Home, Modular Kitchen, Wardrobes, TV Unit, Pooja Unit',
        'design_style', 'modern_luxury',
        'budget_band', 'Rs 12L-Rs 20L',
        'target_timeline', '1-3 Months',
        'requirement_summary', 'Need full interiors for a 3 BHK with premium kitchen, wardrobes in all bedrooms, TV unit, pooja unit, and a clean modern-luxury look.',
        'reference_asset_status', 'uploaded',
        'estimate_low_minor', 124000000,
        'estimate_high_minor', 186000000
      )
    ),
    (
      'seed_int_asset_rahul',
      'interior_lead_assets',
      'asset_id',
      'int-ast-0001',
      jsonb_build_object(
        'asset_id', 'INT-AST-0001',
        'lead_id', 'INT-LEAD-0001',
        'property_id', 'INT-PROP-0001',
        'asset_type', 'reference_bundle',
        'asset_count', 3,
        'processing_status', 'uploaded',
        'extraction_summary', 'Floor plan plus two inspiration images saved for consultation review.'
      )
    ),
    (
      'seed_int_package_essential',
      'interior_packages',
      'package_id',
      'pkg-int-est',
      jsonb_build_object(
        'package_id', 'PKG-INT-EST',
        'package_name', 'Essential Interiors',
        'tier', 'essential',
        'property_types', 'Apartment,Independent House',
        'budget_bands', 'Under Rs 5L,Rs 5L-Rs 8L,Rs 8L-Rs 12L',
        'description', 'Functional planning, standard laminates, practical hardware, and streamlined execution.',
        'min_price_minor', 65000000,
        'max_price_minor', 120000000,
        'included_services', 'kitchen,wardrobes,tv_unit',
        'active', true
      )
    ),
    (
      'seed_int_package_premium',
      'interior_packages',
      'package_id',
      'pkg-int-prm',
      jsonb_build_object(
        'package_id', 'PKG-INT-PRM',
        'package_name', 'Premium Interiors',
        'tier', 'premium',
        'property_types', 'Apartment,Villa,Independent House',
        'budget_bands', 'Rs 8L-Rs 12L,Rs 12L-Rs 20L,Rs 20L-Rs 30L',
        'description', 'Upgraded hardware, custom detailing, richer finishes, and better storage planning.',
        'min_price_minor', 120000000,
        'max_price_minor', 220000000,
        'included_services', 'kitchen,wardrobes,tv_unit,bedrooms,living_room,false_ceiling,lighting',
        'active', true
      )
    ),
    (
      'seed_int_package_signature',
      'interior_packages',
      'package_id',
      'pkg-int-sig',
      jsonb_build_object(
        'package_id', 'PKG-INT-SIG',
        'package_name', 'Signature Interiors',
        'tier', 'signature',
        'property_types', 'Villa,Apartment,Independent House',
        'budget_bands', 'Rs 20L-Rs 30L,Rs 30L+',
        'description', 'High-end finishes, statement spaces, deeper customization, and premium execution support.',
        'min_price_minor', 220000000,
        'max_price_minor', 420000000,
        'included_services', 'full_home,lighting,false_ceiling,custom_furniture',
        'active', true
      )
    ),
    (
      'seed_int_portfolio_modern_narsingi',
      'interior_portfolio_items',
      'portfolio_id',
      'pfl-int-0001',
      jsonb_build_object(
        'portfolio_id', 'PFL-INT-0001',
        'title', 'Modern 3 BHK Family Home',
        'style_code', 'modern',
        'property_type', 'Apartment',
        'configuration', '3 BHK',
        'room_scope', 'living_room',
        'locality', 'Narsingi',
        'highlight', 'Warm oak textures, clean lines, and a concealed TV wall with integrated lighting.',
        'budget_band', 'Rs 12L-Rs 20L',
        'image_url', 'https://example.com/interiors/modern-3bhk-narsingi.jpg',
        'active', true
      )
    ),
    (
      'seed_int_portfolio_modern_luxury',
      'interior_portfolio_items',
      'portfolio_id',
      'pfl-int-0002',
      jsonb_build_object(
        'portfolio_id', 'PFL-INT-0002',
        'title', 'Modern Luxury Full Home',
        'style_code', 'modern_luxury',
        'property_type', 'Apartment',
        'configuration', '3 BHK',
        'room_scope', 'full_home',
        'locality', 'Kokapet',
        'highlight', 'Premium kitchen, fluted panels, and layered lighting across the full residence.',
        'budget_band', 'Rs 12L-Rs 20L',
        'image_url', 'https://example.com/interiors/modern-luxury-kokapet.jpg',
        'active', true
      )
    ),
    (
      'seed_int_portfolio_scandinavian',
      'interior_portfolio_items',
      'portfolio_id',
      'pfl-int-0003',
      jsonb_build_object(
        'portfolio_id', 'PFL-INT-0003',
        'title', 'Scandinavian Compact Apartment',
        'style_code', 'scandinavian',
        'property_type', 'Apartment',
        'configuration', '2 BHK',
        'room_scope', 'kitchen',
        'locality', 'Gachibowli',
        'highlight', 'Light palette, open storage, and space-saving kitchen details.',
        'budget_band', 'Rs 8L-Rs 12L',
        'image_url', 'https://example.com/interiors/scandinavian-gachibowli.jpg',
        'active', true
      )
    ),
    (
      'seed_int_portfolio_villa',
      'interior_portfolio_items',
      'portfolio_id',
      'pfl-int-0004',
      jsonb_build_object(
        'portfolio_id', 'PFL-INT-0004',
        'title', 'Signature Villa Experience',
        'style_code', 'luxury',
        'property_type', 'Villa',
        'configuration', 'Villa',
        'room_scope', 'full_home',
        'locality', 'Kokapet',
        'highlight', 'Stone textures, statement lighting, and layered public-private zoning.',
        'budget_band', 'Rs 30L+',
        'image_url', 'https://example.com/interiors/signature-villa-kokapet.jpg',
        'active', true
      )
    ),
    (
      'seed_int_material_plywood',
      'interior_material_catalog',
      'material_id',
      'mat-int-0001',
      jsonb_build_object(
        'material_id', 'MAT-INT-0001',
        'category', 'plywood',
        'brand', 'Greenply',
        'product_name', 'BWP Plywood',
        'finish', 'core_board',
        'warranty_months', 120,
        'approved_use', 'Kitchen and wet-area base structures',
        'faq_summary', 'BWP plywood is preferred in high-moisture areas because it resists water better than standard interior-grade boards.',
        'active', true
      )
    ),
    (
      'seed_int_material_mdf',
      'interior_material_catalog',
      'material_id',
      'mat-int-0002',
      jsonb_build_object(
        'material_id', 'MAT-INT-0002',
        'category', 'mdf',
        'brand', 'Century',
        'product_name', 'HDHMR Board',
        'finish', 'laminate_ready',
        'warranty_months', 72,
        'approved_use', 'Selected shutters, decorative panels, and dry-area applications',
        'faq_summary', 'HDHMR boards are used in selected dry-area designs where a smooth painted or laminated finish is needed.',
        'active', true
      )
    ),
    (
      'seed_int_material_acrylic',
      'interior_material_catalog',
      'material_id',
      'mat-int-0003',
      jsonb_build_object(
        'material_id', 'MAT-INT-0003',
        'category', 'acrylic',
        'brand', 'Aica',
        'product_name', 'High Gloss Acrylic Panels',
        'finish', 'high_gloss',
        'warranty_months', 60,
        'approved_use', 'Premium kitchen shutters',
        'faq_summary', 'Acrylic fronts deliver a richer glossy finish and are typically recommended for premium kitchen looks.',
        'active', true
      )
    ),
    (
      'seed_int_material_laminate',
      'interior_material_catalog',
      'material_id',
      'mat-int-0004',
      jsonb_build_object(
        'material_id', 'MAT-INT-0004',
        'category', 'laminate',
        'brand', 'Merino',
        'product_name', 'Textured Laminate',
        'finish', 'matte',
        'warranty_months', 48,
        'approved_use', 'Wardrobes, TV units, and dry-area shutters',
        'faq_summary', 'Laminates give strong finish options and easier maintenance across wardrobes and storage units.',
        'active', true
      )
    ),
    (
      'seed_int_material_hettich',
      'interior_material_catalog',
      'material_id',
      'mat-int-0005',
      jsonb_build_object(
        'material_id', 'MAT-INT-0005',
        'category', 'hardware',
        'brand', 'Hettich',
        'product_name', 'Soft Close Hardware',
        'finish', 'soft_close',
        'warranty_months', 120,
        'approved_use', 'Premium shutters and drawer systems',
        'faq_summary', 'Hettich soft-close systems are offered in premium packages for smoother daily-use experience and long-term reliability.',
        'active', true
      )
    ),
    (
      'seed_int_material_hafele',
      'interior_material_catalog',
      'material_id',
      'mat-int-0006',
      jsonb_build_object(
        'material_id', 'MAT-INT-0006',
        'category', 'hardware',
        'brand', 'Hafele',
        'product_name', 'Lift-up and Drawer Hardware',
        'finish', 'premium_hardware',
        'warranty_months', 120,
        'approved_use', 'Premium kitchen and wardrobe accessory systems',
        'faq_summary', 'Hafele is used where the design needs advanced organizer systems or lift-up mechanisms.',
        'active', true
      )
    ),
    (
      'seed_int_designer_aditi',
      'interior_designers',
      'designer_id',
      'int-dsn-0001',
      jsonb_build_object(
        'designer_id', 'INT-DSN-0001',
        'full_name', 'Aditi Sharma',
        'team_name', 'Premium Residential Team',
        'location_zone', 'West Hyderabad',
        'specialization', 'modern,residential',
        'budget_tier_focus', 'premium',
        'languages', 'English,Hindi,Telugu',
        'capacity_state', 'available',
        'active', true
      )
    ),
    (
      'seed_int_designer_nikhil',
      'interior_designers',
      'designer_id',
      'int-dsn-0002',
      jsonb_build_object(
        'designer_id', 'INT-DSN-0002',
        'full_name', 'Nikhil Rao',
        'team_name', 'Signature Residential Team',
        'location_zone', 'West Hyderabad',
        'specialization', 'luxury,residential',
        'budget_tier_focus', 'signature',
        'languages', 'English,Hindi',
        'capacity_state', 'available',
        'active', true
      )
    ),
    (
      'seed_int_designer_megha',
      'interior_designers',
      'designer_id',
      'int-dsn-0003',
      jsonb_build_object(
        'designer_id', 'INT-DSN-0003',
        'full_name', 'Megha Suri',
        'team_name', 'Essential Interiors Team',
        'location_zone', 'West Hyderabad',
        'specialization', 'residential,minimal',
        'budget_tier_focus', 'essential',
        'languages', 'English,Telugu',
        'capacity_state', 'available',
        'active', true
      )
    ),
    (
      'seed_int_slot_001',
      'interior_consultation_slots',
      'slot_id',
      'slot-int-0001',
      jsonb_build_object(
        'slot_id', 'SLOT-INT-0001',
        'consultation_type', 'site_visit',
        'location_zone', 'West Hyderabad',
        'designer_id', 'INT-DSN-0001',
        'designer_name', 'Aditi Sharma',
        'slot_date', '2026-09-02',
        'start_at', '11:30',
        'end_at', '12:30',
        'slot_label', 'Wednesday 11:30 AM',
        'status', 'available',
        'lead_id', '',
        'consultation_id', ''
      )
    ),
    (
      'seed_int_slot_002',
      'interior_consultation_slots',
      'slot_id',
      'slot-int-0002',
      jsonb_build_object(
        'slot_id', 'SLOT-INT-0002',
        'consultation_type', 'video_consultation',
        'location_zone', 'West Hyderabad',
        'designer_id', 'INT-DSN-0001',
        'designer_name', 'Aditi Sharma',
        'slot_date', '2026-09-03',
        'start_at', '18:00',
        'end_at', '19:00',
        'slot_label', 'Thursday 6:00 PM',
        'status', 'available',
        'lead_id', '',
        'consultation_id', ''
      )
    ),
    (
      'seed_int_slot_003',
      'interior_consultation_slots',
      'slot_id',
      'slot-int-0003',
      jsonb_build_object(
        'slot_id', 'SLOT-INT-0003',
        'consultation_type', 'studio_consultation',
        'location_zone', 'West Hyderabad',
        'designer_id', 'INT-DSN-0001',
        'designer_name', 'Aditi Sharma',
        'slot_date', '2026-09-04',
        'start_at', '15:00',
        'end_at', '16:00',
        'slot_label', 'Friday 3:00 PM',
        'status', 'available',
        'lead_id', '',
        'consultation_id', ''
      )
    ),
    (
      'seed_int_slot_004',
      'interior_consultation_slots',
      'slot_id',
      'slot-int-0004',
      jsonb_build_object(
        'slot_id', 'SLOT-INT-0004',
        'consultation_type', 'site_visit',
        'location_zone', 'West Hyderabad',
        'designer_id', 'INT-DSN-0002',
        'designer_name', 'Nikhil Rao',
        'slot_date', '2026-09-05',
        'start_at', '10:30',
        'end_at', '11:30',
        'slot_label', 'Saturday 10:30 AM',
        'status', 'available',
        'lead_id', '',
        'consultation_id', ''
      )
    ),
    (
      'seed_int_slot_005',
      'interior_consultation_slots',
      'slot_id',
      'slot-int-0005',
      jsonb_build_object(
        'slot_id', 'SLOT-INT-0005',
        'consultation_type', 'video_consultation',
        'location_zone', 'West Hyderabad',
        'designer_id', 'INT-DSN-0002',
        'designer_name', 'Nikhil Rao',
        'slot_date', '2026-09-05',
        'start_at', '17:30',
        'end_at', '18:30',
        'slot_label', 'Saturday 5:30 PM',
        'status', 'available',
        'lead_id', '',
        'consultation_id', ''
      )
    ),
    (
      'seed_int_slot_006',
      'interior_consultation_slots',
      'slot_id',
      'slot-int-0006',
      jsonb_build_object(
        'slot_id', 'SLOT-INT-0006',
        'consultation_type', 'phone_consultation',
        'location_zone', 'West Hyderabad',
        'designer_id', 'INT-DSN-0003',
        'designer_name', 'Megha Suri',
        'slot_date', '2026-09-03',
        'start_at', '12:00',
        'end_at', '13:00',
        'slot_label', 'Thursday 12:00 PM',
        'status', 'available',
        'lead_id', '',
        'consultation_id', ''
      )
    ),
    (
      'seed_int_consultation_rahul',
      'interior_consultations',
      'consultation_id',
      'int-cons-0001',
      jsonb_build_object(
        'consultation_id', 'INT-CONS-0001',
        'consultation_number', 'INT-CNS-260901-001',
        'lead_id', 'INT-LEAD-0001',
        'customer_id', 'INT-CUST-9876543210',
        'property_id', 'INT-PROP-0001',
        'consultation_type', 'site_visit',
        'slot_id', 'SLOT-INT-0001',
        'designer_id', 'INT-DSN-0001',
        'designer_name', 'Aditi Sharma',
        'scheduled_at', '2026-09-02T11:30:00+05:30',
        'status', 'booked'
      )
    ),
    (
      'seed_int_quote_rahul',
      'interior_quotes',
      'quote_id',
      'qt-int-0001',
      jsonb_build_object(
        'quote_id', 'QT-INT-0001',
        'quote_number', 'Q-INT-260901-01',
        'customer_mobile', '+919876543210',
        'lead_id', 'INT-LEAD-0001',
        'property_id', 'INT-PROP-0001',
        'version', 2,
        'status', 'sent',
        'total_minor', 168500000,
        'valid_until', '2026-09-10',
        'scope_summary', '3 BHK full-home interiors including kitchen, wardrobes, TV unit, pooja, and lighting',
        'next_action', 'Review proposal and confirm design booking amount'
      )
    ),
    (
      'seed_int_quote_sneha',
      'interior_quotes',
      'quote_id',
      'qt-int-0002',
      jsonb_build_object(
        'quote_id', 'QT-INT-0002',
        'quote_number', 'Q-INT-260903-02',
        'customer_mobile', '+919988776655',
        'lead_id', 'INT-LEAD-0002',
        'property_id', 'INT-PROP-0002',
        'version', 1,
        'status', 'draft',
        'total_minor', 345000000,
        'valid_until', '2026-09-15',
        'scope_summary', 'Villa concept proposal with premium lighting and signature finishes',
        'next_action', 'Design discussion scheduled before final commercial release'
      )
    ),
    (
      'seed_int_project_rahul',
      'interior_projects',
      'project_id',
      'prj-int-0001',
      jsonb_build_object(
        'project_id', 'PRJ-INT-0001',
        'project_code', 'INT-P-1288',
        'customer_mobile', '+919876543210',
        'lead_id', 'INT-LEAD-0001',
        'property_id', 'INT-PROP-0001',
        'project_name', 'Rahul Verma Narsingi Residence',
        'stage', 'factory_production',
        'status', 'active',
        'completion_pct', 65,
        'expected_installation_start', '2026-09-12',
        'expected_handover_date', '2026-09-28',
        'assigned_designer_name', 'Aditi Sharma'
      )
    ),
    (
      'seed_int_milestone_1',
      'interior_project_milestones',
      'milestone_id',
      'milestone-int-0001',
      jsonb_build_object(
        'milestone_id', 'MILESTONE-INT-0001',
        'project_id', 'PRJ-INT-0001',
        'customer_mobile', '+919876543210',
        'sequence_no', 1,
        'milestone_name', 'Design Approved',
        'status', 'completed',
        'expected_date', '2026-08-28'
      )
    ),
    (
      'seed_int_milestone_2',
      'interior_project_milestones',
      'milestone_id',
      'milestone-int-0002',
      jsonb_build_object(
        'milestone_id', 'MILESTONE-INT-0002',
        'project_id', 'PRJ-INT-0001',
        'customer_mobile', '+919876543210',
        'sequence_no', 2,
        'milestone_name', 'Material Finalized',
        'status', 'completed',
        'expected_date', '2026-09-02'
      )
    ),
    (
      'seed_int_milestone_3',
      'interior_project_milestones',
      'milestone_id',
      'milestone-int-0003',
      jsonb_build_object(
        'milestone_id', 'MILESTONE-INT-0003',
        'project_id', 'PRJ-INT-0001',
        'customer_mobile', '+919876543210',
        'sequence_no', 3,
        'milestone_name', 'Factory Production',
        'status', 'in_progress',
        'expected_date', '2026-09-10'
      )
    ),
    (
      'seed_int_milestone_4',
      'interior_project_milestones',
      'milestone_id',
      'milestone-int-0004',
      jsonb_build_object(
        'milestone_id', 'MILESTONE-INT-0004',
        'project_id', 'PRJ-INT-0001',
        'customer_mobile', '+919876543210',
        'sequence_no', 4,
        'milestone_name', 'Installation',
        'status', 'pending',
        'expected_date', '2026-09-12'
      )
    ),
    (
      'seed_int_payment_1',
      'interior_payments',
      'payment_id',
      'pay-int-0001',
      jsonb_build_object(
        'payment_id', 'PAY-INT-0001',
        'customer_mobile', '+919876543210',
        'lead_id', 'INT-LEAD-0001',
        'project_id', 'PRJ-INT-0001',
        'quote_id', 'QT-INT-0001',
        'purpose', 'design_booking',
        'amount_minor', 25000000,
        'currency', 'INR',
        'status', 'paid',
        'due_date', '2026-08-30'
      )
    ),
    (
      'seed_int_payment_2',
      'interior_payments',
      'payment_id',
      'pay-int-0002',
      jsonb_build_object(
        'payment_id', 'PAY-INT-0002',
        'customer_mobile', '+919876543210',
        'lead_id', 'INT-LEAD-0001',
        'project_id', 'PRJ-INT-0001',
        'quote_id', 'QT-INT-0001',
        'purpose', 'production_milestone',
        'amount_minor', 67500000,
        'currency', 'INR',
        'status', 'pending',
        'due_date', '2026-09-11'
      )
    ),
    (
      'seed_int_payment_3',
      'interior_payments',
      'payment_id',
      'pay-int-0003',
      jsonb_build_object(
        'payment_id', 'PAY-INT-0003',
        'customer_mobile', '+919876543210',
        'lead_id', 'INT-LEAD-0001',
        'project_id', 'PRJ-INT-0001',
        'quote_id', 'QT-INT-0001',
        'purpose', 'handover_balance',
        'amount_minor', 42000000,
        'currency', 'INR',
        'status', 'scheduled',
        'due_date', '2026-09-27'
      )
    ),
    (
      'seed_int_service_1',
      'interior_service_tickets',
      'ticket_id',
      'svc-int-0001',
      jsonb_build_object(
        'ticket_id', 'SVC-INT-0001',
        'customer_mobile', '+919876543210',
        'project_id', 'PRJ-INT-0001',
        'issue_type', 'warranty',
        'room_area', 'Wardrobe',
        'priority', 'normal',
        'description', 'Wardrobe shutter alignment needs adjustment.',
        'status', 'open',
        'preferred_visit_window', '2026-09-18 Morning'
      )
    ),
    (
      'seed_int_service_2',
      'interior_service_tickets',
      'ticket_id',
      'svc-int-0002',
      jsonb_build_object(
        'ticket_id', 'SVC-INT-0002',
        'customer_mobile', '+919876543210',
        'project_id', 'PRJ-INT-0001',
        'issue_type', 'installation',
        'room_area', 'Kitchen',
        'priority', 'high',
        'description', 'Need clarification on the kitchen accessory cutout before final installation.',
        'status', 'in_progress',
        'preferred_visit_window', '2026-09-12 Afternoon'
      )
    ),
    (
      'seed_int_followup_1',
      'interior_followup_jobs',
      'followup_id',
      'follow-int-0001',
      jsonb_build_object(
        'followup_id', 'FOLLOW-INT-0001',
        'lead_id', 'INT-LEAD-0001',
        'consultation_id', 'INT-CONS-0001',
        'job_type', 'consultation_reminder_24h',
        'run_at', '2026-09-01T11:30:00.000Z',
        'channel', 'whatsapp',
        'status', 'scheduled'
      )
    ),

    (
      'seed_price_premium_kitchen',
      'interior_price_catalog',
      'price_rule_id',
      'price-premium-kitchen',
      jsonb_build_object('price_rule_id', 'PRICE-PREMIUM-KITCHEN', 'scope_code', 'modular_kitchen', 'tier', 'premium', 'configuration', 'any', 'min_minor', 26000000, 'max_minor', 34000000, 'active', true)
    ),
    (
      'seed_price_premium_wardrobes',
      'interior_price_catalog',
      'price_rule_id',
      'price-premium-wardrobes',
      jsonb_build_object('price_rule_id', 'PRICE-PREMIUM-WARDROBES', 'scope_code', 'wardrobes', 'tier', 'premium', 'configuration', 'any', 'min_minor', 30000000, 'max_minor', 42000000, 'active', true)
    ),
    (
      'seed_price_premium_tv',
      'interior_price_catalog',
      'price_rule_id',
      'price-premium-tv',
      jsonb_build_object('price_rule_id', 'PRICE-PREMIUM-TV', 'scope_code', 'tv_unit', 'tier', 'premium', 'configuration', 'any', 'min_minor', 9000000, 'max_minor', 15000000, 'active', true)
    ),
    (
      'seed_price_premium_bedrooms',
      'interior_price_catalog',
      'price_rule_id',
      'price-premium-bedrooms',
      jsonb_build_object('price_rule_id', 'PRICE-PREMIUM-BEDROOMS', 'scope_code', 'bedrooms', 'tier', 'premium', 'configuration', 'any', 'min_minor', 18000000, 'max_minor', 25000000, 'active', true)
    ),
    (
      'seed_price_premium_living',
      'interior_price_catalog',
      'price_rule_id',
      'price-premium-living',
      jsonb_build_object('price_rule_id', 'PRICE-PREMIUM-LIVING', 'scope_code', 'living_room', 'tier', 'premium', 'configuration', 'any', 'min_minor', 12000000, 'max_minor', 18000000, 'active', true)
    ),
    (
      'seed_price_premium_ceiling',
      'interior_price_catalog',
      'price_rule_id',
      'price-premium-ceiling',
      jsonb_build_object('price_rule_id', 'PRICE-PREMIUM-CEILING', 'scope_code', 'false_ceiling', 'tier', 'premium', 'configuration', 'any', 'min_minor', 8000000, 'max_minor', 12000000, 'active', true)
    ),
    (
      'seed_price_premium_lighting',
      'interior_price_catalog',
      'price_rule_id',
      'price-premium-lighting',
      jsonb_build_object('price_rule_id', 'PRICE-PREMIUM-LIGHTING', 'scope_code', 'lighting', 'tier', 'premium', 'configuration', 'any', 'min_minor', 6000000, 'max_minor', 10000000, 'active', true)
    ),
    (
      'seed_price_essential_kitchen',
      'interior_price_catalog',
      'price_rule_id',
      'price-essential-kitchen',
      jsonb_build_object('price_rule_id', 'PRICE-ESSENTIAL-KITCHEN', 'scope_code', 'modular_kitchen', 'tier', 'essential', 'configuration', 'any', 'min_minor', 18000000, 'max_minor', 24000000, 'active', true)
    ),
    (
      'seed_price_essential_wardrobes',
      'interior_price_catalog',
      'price_rule_id',
      'price-essential-wardrobes',
      jsonb_build_object('price_rule_id', 'PRICE-ESSENTIAL-WARDROBES', 'scope_code', 'wardrobes', 'tier', 'essential', 'configuration', 'any', 'min_minor', 22000000, 'max_minor', 30000000, 'active', true)
    ),
    (
      'seed_price_essential_tv',
      'interior_price_catalog',
      'price_rule_id',
      'price-essential-tv',
      jsonb_build_object('price_rule_id', 'PRICE-ESSENTIAL-TV', 'scope_code', 'tv_unit', 'tier', 'essential', 'configuration', 'any', 'min_minor', 6000000, 'max_minor', 9000000, 'active', true)
    ),
    (
      'seed_price_essential_bedrooms',
      'interior_price_catalog',
      'price_rule_id',
      'price-essential-bedrooms',
      jsonb_build_object('price_rule_id', 'PRICE-ESSENTIAL-BEDROOMS', 'scope_code', 'bedrooms', 'tier', 'essential', 'configuration', 'any', 'min_minor', 12000000, 'max_minor', 18000000, 'active', true)
    ),
    (
      'seed_price_essential_living',
      'interior_price_catalog',
      'price_rule_id',
      'price-essential-living',
      jsonb_build_object('price_rule_id', 'PRICE-ESSENTIAL-LIVING', 'scope_code', 'living_room', 'tier', 'essential', 'configuration', 'any', 'min_minor', 8000000, 'max_minor', 12000000, 'active', true)
    ),
    (
      'seed_price_essential_ceiling',
      'interior_price_catalog',
      'price_rule_id',
      'price-essential-ceiling',
      jsonb_build_object('price_rule_id', 'PRICE-ESSENTIAL-CEILING', 'scope_code', 'false_ceiling', 'tier', 'essential', 'configuration', 'any', 'min_minor', 5000000, 'max_minor', 8000000, 'active', true)
    ),
    (
      'seed_price_essential_lighting',
      'interior_price_catalog',
      'price_rule_id',
      'price-essential-lighting',
      jsonb_build_object('price_rule_id', 'PRICE-ESSENTIAL-LIGHTING', 'scope_code', 'lighting', 'tier', 'essential', 'configuration', 'any', 'min_minor', 3500000, 'max_minor', 6000000, 'active', true)
    ),
    (
      'seed_price_signature_kitchen',
      'interior_price_catalog',
      'price_rule_id',
      'price-signature-kitchen',
      jsonb_build_object('price_rule_id', 'PRICE-SIGNATURE-KITCHEN', 'scope_code', 'modular_kitchen', 'tier', 'signature', 'configuration', 'any', 'min_minor', 42000000, 'max_minor', 60000000, 'active', true)
    ),
    (
      'seed_price_signature_wardrobes',
      'interior_price_catalog',
      'price_rule_id',
      'price-signature-wardrobes',
      jsonb_build_object('price_rule_id', 'PRICE-SIGNATURE-WARDROBES', 'scope_code', 'wardrobes', 'tier', 'signature', 'configuration', 'any', 'min_minor', 48000000, 'max_minor', 72000000, 'active', true)
    ),
    (
      'seed_price_signature_tv',
      'interior_price_catalog',
      'price_rule_id',
      'price-signature-tv',
      jsonb_build_object('price_rule_id', 'PRICE-SIGNATURE-TV', 'scope_code', 'tv_unit', 'tier', 'signature', 'configuration', 'any', 'min_minor', 15000000, 'max_minor', 25000000, 'active', true)
    ),
    (
      'seed_price_signature_bedrooms',
      'interior_price_catalog',
      'price_rule_id',
      'price-signature-bedrooms',
      jsonb_build_object('price_rule_id', 'PRICE-SIGNATURE-BEDROOMS', 'scope_code', 'bedrooms', 'tier', 'signature', 'configuration', 'any', 'min_minor', 26000000, 'max_minor', 42000000, 'active', true)
    ),
    (
      'seed_price_signature_living',
      'interior_price_catalog',
      'price_rule_id',
      'price-signature-living',
      jsonb_build_object('price_rule_id', 'PRICE-SIGNATURE-LIVING', 'scope_code', 'living_room', 'tier', 'signature', 'configuration', 'any', 'min_minor', 18000000, 'max_minor', 28000000, 'active', true)
    ),
    (
      'seed_price_signature_ceiling',
      'interior_price_catalog',
      'price_rule_id',
      'price-signature-ceiling',
      jsonb_build_object('price_rule_id', 'PRICE-SIGNATURE-CEILING', 'scope_code', 'false_ceiling', 'tier', 'signature', 'configuration', 'any', 'min_minor', 12000000, 'max_minor', 18000000, 'active', true)
    ),
    (
      'seed_price_signature_lighting',
      'interior_price_catalog',
      'price_rule_id',
      'price-signature-lighting',
      jsonb_build_object('price_rule_id', 'PRICE-SIGNATURE-LIGHTING', 'scope_code', 'lighting', 'tier', 'signature', 'configuration', 'any', 'min_minor', 10000000, 'max_minor', 16000000, 'active', true)
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
  COUNT(*) FILTER (WHERE seed_records.collection = 'interior_packages') AS package_records_seeded,
  COUNT(*) FILTER (WHERE seed_records.collection = 'interior_price_catalog') AS pricing_records_seeded,
  COUNT(*) FILTER (WHERE seed_records.collection = 'interior_portfolio_items') AS portfolio_records_seeded,
  COUNT(*) FILTER (WHERE seed_records.collection = 'interior_consultation_slots') AS slot_records_seeded,
  COUNT(*) FILTER (WHERE seed_records.collection = 'interior_quotes') AS quote_records_seeded,
  COUNT(*) FILTER (WHERE seed_records.collection = 'interior_projects') AS project_records_seeded,
  COUNT(*) FILTER (WHERE seed_records.collection = 'interior_payments') AS payment_records_seeded,
  COUNT(*) FILTER (WHERE seed_records.collection = 'interior_service_tickets') AS service_records_seeded
FROM params
CROSS JOIN seed_records
GROUP BY params.tenant_id;

COMMIT;
