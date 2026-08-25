-- Real-estate demo seed for the FLOW record store.
-- This targets the generic records tables used by the `record` node runtime:
--   flow_record_schemas
--   flow_records
--   flow_record_indexes
--
-- How to run:
--   1. Update the tenant_id value in the params CTE below.
--   2. Run against the bot-code-zero PostgreSQL database.
--      PowerShell example:
--      psql $env:DATABASE_URL -f .\scripts\seed-demo-real-estate-records.sql
--
-- The inserted dates are all in the future relative to August 20, 2026.

BEGIN;

WITH params AS (
  SELECT
    'replace-with-tenant-id'::text AS tenant_id,
    'seed-demo-real-estate-records'::text AS source_tag
),
schemas (collection, schema_json) AS (
  VALUES
    (
      'real_estate_contacts',
      '{
        "collection": "real_estate_contacts",
        "fields": {
          "contact_id": { "type": "string", "required": true, "unique": true },
          "full_name": { "type": "string", "required": false },
          "phone_e164": { "type": "phone", "required": true, "unique": true },
          "email": { "type": "email", "required": false },
          "first_source": { "type": "string", "required": true },
          "last_source": { "type": "string", "required": true },
          "first_seen_at": { "type": "string", "required": false },
          "last_seen_at": { "type": "string", "required": false },
          "last_requirement_summary": { "type": "string", "required": false },
          "last_preferred_location": { "type": "string", "required": false },
          "last_budget_min_minor": { "type": "number", "required": false },
          "last_budget_max_minor": { "type": "number", "required": false },
          "last_property_type": { "type": "string", "required": false },
          "last_bhk": { "type": "string", "required": false },
          "last_purchase_timeline": { "type": "string", "required": false },
          "last_purchase_purpose": { "type": "string", "required": false },
          "last_financing_status": { "type": "string", "required": false },
          "last_active_lead_id": { "type": "string", "required": false }
        }
      }'::jsonb
    ),
    (
      'real_estate_leads',
      '{
        "collection": "real_estate_leads",
        "fields": {
          "lead_id": { "type": "string", "required": true, "unique": true },
          "contact_id": { "type": "string", "required": true },
          "buyer_mobile": { "type": "phone", "required": true },
          "buyer_name": { "type": "string", "required": false },
          "buyer_email": { "type": "email", "required": false },
          "source_channel": { "type": "string", "required": true },
          "status": { "type": "enum", "values": ["open", "nurture", "site_visit_booked", "closed"] },
          "stage": { "type": "enum", "values": ["requirements_captured", "projects_shared", "brochure_shared", "site_visit_pending_confirmation", "site_visit_booked", "nurture"] },
          "preferred_location": { "type": "string", "required": false },
          "budget_min_minor": { "type": "number", "required": false },
          "budget_max_minor": { "type": "number", "required": false },
          "budget_range_label": { "type": "string", "required": false },
          "property_type": { "type": "string", "required": false },
          "bhk": { "type": "string", "required": false },
          "purchase_purpose": { "type": "string", "required": false },
          "purchase_timeline": { "type": "string", "required": false },
          "possession_preference": { "type": "string", "required": false },
          "financing_status": { "type": "string", "required": false },
          "requirement_summary": { "type": "string", "required": false },
          "lead_score": { "type": "number", "required": false },
          "lead_temperature": { "type": "enum", "values": ["hot", "warm", "nurture"] },
          "selected_project_id": { "type": "string", "required": false },
          "selected_project_name": { "type": "string", "required": false },
          "site_visit_id": { "type": "string", "required": false },
          "site_visit_status": { "type": "string", "required": false },
          "last_activity_at": { "type": "string", "required": false }
        }
      }'::jsonb
    ),
    (
      'property_inventory',
      '{
        "collection": "property_inventory",
        "fields": {
          "project_id": { "type": "string", "required": true, "unique": true },
          "project_code": { "type": "string", "required": true, "unique": true },
          "project_name": { "type": "string", "required": true },
          "developer_name": { "type": "string", "required": false },
          "location": { "type": "string", "required": true },
          "micro_market": { "type": "string", "required": false },
          "property_type": { "type": "string", "required": true },
          "bhk_options": { "type": "string", "required": false },
          "min_price_minor": { "type": "number", "required": false },
          "max_price_minor": { "type": "number", "required": false },
          "min_area_sqft": { "type": "number", "required": false },
          "max_area_sqft": { "type": "number", "required": false },
          "possession_label": { "type": "string", "required": false },
          "project_status": { "type": "string", "required": false },
          "rera_number": { "type": "string", "required": false },
          "highlights": { "type": "string", "required": false },
          "brochure_url": { "type": "url", "required": false },
          "image_url": { "type": "url", "required": false },
          "location_url": { "type": "url", "required": false },
          "sales_owner_name": { "type": "string", "required": false },
          "sales_owner_phone": { "type": "phone", "required": false },
          "sales_owner_email": { "type": "email", "required": false },
          "active": { "type": "boolean", "required": true }
        }
      }'::jsonb
    ),
    (
      'real_estate_site_visit_slots',
      '{
        "collection": "real_estate_site_visit_slots",
        "fields": {
          "slot_id": { "type": "string", "required": true, "unique": true },
          "project_id": { "type": "string", "required": true },
          "date": { "type": "string", "required": true },
          "start": { "type": "string", "required": true },
          "end": { "type": "string", "required": false },
          "label": { "type": "string", "required": true },
          "status": { "type": "enum", "values": ["available", "held", "confirmed", "blocked"] },
          "hold_id": { "type": "string", "required": false },
          "held_by_session": { "type": "string", "required": false },
          "hold_expires_at": { "type": "string", "required": false }
        }
      }'::jsonb
    ),
    (
      'real_estate_lead_project_interests',
      '{
        "collection": "real_estate_lead_project_interests",
        "fields": {
          "interest_id": { "type": "string", "required": true, "unique": true },
          "lead_id": { "type": "string", "required": true },
          "project_id": { "type": "string", "required": true },
          "project_name": { "type": "string", "required": true },
          "match_score": { "type": "number", "required": false },
          "brochure_requested": { "type": "boolean", "required": true },
          "shortlisted": { "type": "boolean", "required": true },
          "site_visit_requested": { "type": "boolean", "required": true },
          "site_visit_id": { "type": "string", "required": false },
          "last_viewed_at": { "type": "string", "required": false }
        }
      }'::jsonb
    ),
    (
      'real_estate_lead_activities',
      '{
        "collection": "real_estate_lead_activities",
        "fields": {
          "activity_id": { "type": "string", "required": true, "unique": true },
          "lead_id": { "type": "string", "required": true },
          "contact_id": { "type": "string", "required": true },
          "project_id": { "type": "string", "required": false },
          "activity_type": { "type": "string", "required": true },
          "channel": { "type": "string", "required": true },
          "summary": { "type": "string", "required": false },
          "occurred_at": { "type": "string", "required": false }
        }
      }'::jsonb
    ),
    (
      'real_estate_site_visit_holds',
      '{
        "collection": "real_estate_site_visit_holds",
        "fields": {
          "hold_id": { "type": "string", "required": true, "unique": true },
          "lead_id": { "type": "string", "required": true },
          "slot_id": { "type": "string", "required": true },
          "project_id": { "type": "string", "required": true },
          "session_id": { "type": "string", "required": true },
          "status": { "type": "enum", "values": ["active", "released", "converted", "expired"] },
          "expires_at": { "type": "string", "required": false }
        }
      }'::jsonb
    ),
    (
      'real_estate_site_visits',
      '{
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
          "status": { "type": "enum", "values": ["confirmed", "cancelled", "completed", "no_show"] },
          "assigned_salesperson_name": { "type": "string", "required": false },
          "assigned_salesperson_phone": { "type": "phone", "required": false }
        }
      }'::jsonb
    ),
    (
      'real_estate_followup_jobs',
      '{
        "collection": "real_estate_followup_jobs",
        "fields": {
          "followup_id": { "type": "string", "required": true, "unique": true },
          "lead_id": { "type": "string", "required": true },
          "project_id": { "type": "string", "required": false },
          "followup_type": { "type": "string", "required": true },
          "scheduled_for": { "type": "string", "required": false },
          "channel": { "type": "string", "required": true },
          "status": { "type": "enum", "values": ["scheduled", "sent", "failed", "cancelled"] },
          "notes": { "type": "string", "required": false }
        }
      }'::jsonb
    ),
    (
      'real_estate_crm_sync_jobs',
      '{
        "collection": "real_estate_crm_sync_jobs",
        "fields": {
          "sync_job_id": { "type": "string", "required": true, "unique": true },
          "lead_id": { "type": "string", "required": true },
          "entity_type": { "type": "string", "required": true },
          "operation": { "type": "string", "required": true },
          "crm_provider": { "type": "string", "required": true },
          "status": { "type": "enum", "values": ["pending", "processing", "success", "retry", "failed"] },
          "payload_summary": { "type": "string", "required": false },
          "created_at": { "type": "string", "required": false }
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
      'seed_re_contact_rahul',
      'real_estate_contacts',
      'phone_e164',
      'phone:9876543210',
      jsonb_build_object(
        'contact_id', 'CNT-9876543210',
        'full_name', 'Rahul Verma',
        'phone_e164', '+919876543210',
        'email', 'rahul.verma@example.com',
        'first_source', 'WHATSAPP',
        'last_source', 'WHATSAPP',
        'first_seen_at', '2026-08-18T10:00:00.000Z',
        'last_seen_at', '2026-08-20T09:30:00.000Z',
        'last_requirement_summary', '3 BHK Apartment in Kokapet within Rs 1 Cr - Rs 1.5 Cr',
        'last_preferred_location', 'Kokapet',
        'last_budget_min_minor', 1000000000,
        'last_budget_max_minor', 1500000000,
        'last_property_type', 'Apartment',
        'last_bhk', '3 BHK',
        'last_purchase_timeline', '1-3 Months',
        'last_purchase_purpose', 'Self Use',
        'last_financing_status', 'Loan Pre-Approved',
        'last_active_lead_id', 'LD-RE-0001'
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
        'first_source', 'WEB',
        'last_source', 'WEB',
        'first_seen_at', '2026-08-19T06:45:00.000Z',
        'last_seen_at', '2026-08-20T08:15:00.000Z',
        'last_requirement_summary', 'Villa in Tellapur within Rs 1.5 Cr - Rs 2 Cr',
        'last_preferred_location', 'Tellapur',
        'last_budget_min_minor', 1500000000,
        'last_budget_max_minor', 2000000000,
        'last_property_type', 'Villa',
        'last_bhk', '4 BHK',
        'last_purchase_timeline', '3-6 Months',
        'last_purchase_purpose', 'Investment',
        'last_financing_status', 'Self-Funded',
        'last_active_lead_id', 'LD-RE-0002'
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
        'stage', 'projects_shared',
        'preferred_location', 'Kokapet',
        'budget_min_minor', 1000000000,
        'budget_max_minor', 1500000000,
        'budget_range_label', 'Rs 1 Cr - Rs 1.5 Cr',
        'property_type', 'Apartment',
        'bhk', '3 BHK',
        'purchase_purpose', 'Self Use',
        'purchase_timeline', '1-3 Months',
        'possession_preference', 'Within 1 Year',
        'financing_status', 'Loan Pre-Approved',
        'requirement_summary', '3 BHK Apartment in Kokapet within Rs 1 Cr - Rs 1.5 Cr',
        'lead_score', 52,
        'lead_temperature', 'warm',
        'selected_project_id', 'PRJ-KOK-001',
        'selected_project_name', 'Skyline One Kokapet',
        'site_visit_id', null,
        'site_visit_status', null,
        'last_activity_at', '2026-08-20T09:30:00.000Z'
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
        'budget_range_label', 'Rs 1.5 Cr - Rs 2 Cr',
        'property_type', 'Villa',
        'bhk', '4 BHK',
        'purchase_purpose', 'Investment',
        'purchase_timeline', '3-6 Months',
        'possession_preference', 'Under Construction is Fine',
        'financing_status', 'Self-Funded',
        'requirement_summary', '4 BHK Villa in Tellapur within Rs 1.5 Cr - Rs 2 Cr',
        'lead_score', 44,
        'lead_temperature', 'warm',
        'selected_project_id', 'PRJ-TEL-001',
        'selected_project_name', 'Tellapur Garden Villas',
        'site_visit_id', null,
        'site_visit_status', null,
        'last_activity_at', '2026-08-20T08:15:00.000Z'
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
        'developer_name', 'Vertex Habitat',
        'location', 'Kokapet',
        'micro_market', 'West Hyderabad',
        'property_type', 'Apartment',
        'bhk_options', '2 BHK,3 BHK,4 BHK',
        'min_price_minor', 1080000000,
        'max_price_minor', 1480000000,
        'min_area_sqft', 1325,
        'max_area_sqft', 2240,
        'possession_label', 'Within 1 Year',
        'project_status', 'Near Completion',
        'rera_number', 'RERA-P02400005601',
        'highlights', 'Exact Kokapet fit with premium clubhouse, fast ORR access, and strong end-use demand.',
        'brochure_url', 'https://example.com/brochures/skyline-one-kokapet.pdf',
        'image_url', 'https://example.com/images/skyline-one-kokapet.jpg',
        'location_url', 'https://maps.example.com/skyline-one-kokapet',
        'sales_owner_name', 'Priya Reddy',
        'sales_owner_phone', '+919900045111',
        'sales_owner_email', 'priya.reddy@vertexhabitat.example.com',
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
        'developer_name', 'Alta Urban',
        'location', 'Kokapet',
        'micro_market', 'West Hyderabad',
        'property_type', 'Apartment',
        'bhk_options', '3 BHK,4 BHK',
        'min_price_minor', 1180000000,
        'max_price_minor', 1720000000,
        'min_area_sqft', 1580,
        'max_area_sqft', 2550,
        'possession_label', 'Dec 2027',
        'project_status', 'Under Construction',
        'rera_number', 'RERA-P02400005842',
        'highlights', 'Strong investment positioning, skyline views, and rental appeal near Financial District.',
        'brochure_url', 'https://example.com/brochures/alta-vista-residences.pdf',
        'image_url', 'https://example.com/images/alta-vista-residences.jpg',
        'location_url', 'https://maps.example.com/alta-vista-residences',
        'sales_owner_name', 'Priya Reddy',
        'sales_owner_phone', '+919900045111',
        'sales_owner_email', 'priya.reddy@vertexhabitat.example.com',
        'active', true
      )
    ),
    (
      'seed_re_project_fdh',
      'property_inventory',
      'project_id',
      'prj-fd-001',
      jsonb_build_object(
        'project_id', 'PRJ-FD-001',
        'project_code', 'RE-FD-01',
        'project_name', 'Finance District Heights',
        'developer_name', 'Northstar Realty',
        'location', 'Financial District',
        'micro_market', 'West Hyderabad',
        'property_type', 'Apartment',
        'bhk_options', '2 BHK,3 BHK',
        'min_price_minor', 980000000,
        'max_price_minor', 1240000000,
        'min_area_sqft', 1240,
        'max_area_sqft', 1810,
        'possession_label', 'Ready to Move',
        'project_status', 'Ready',
        'rera_number', 'RERA-P02400005217',
        'highlights', 'Ready inventory near IT offices with rental yield potential and immediate move-in.',
        'brochure_url', 'https://example.com/brochures/finance-district-heights.pdf',
        'image_url', 'https://example.com/images/finance-district-heights.jpg',
        'location_url', 'https://maps.example.com/finance-district-heights',
        'sales_owner_name', 'Sandeep Rao',
        'sales_owner_phone', '+919900045222',
        'sales_owner_email', 'sandeep.rao@northstarrealty.example.com',
        'active', true
      )
    ),
    (
      'seed_re_project_tellapur_villa',
      'property_inventory',
      'project_id',
      'prj-tel-001',
      jsonb_build_object(
        'project_id', 'PRJ-TEL-001',
        'project_code', 'RE-TEL-01',
        'project_name', 'Tellapur Garden Villas',
        'developer_name', 'GreenArc Developers',
        'location', 'Tellapur',
        'micro_market', 'West Hyderabad',
        'property_type', 'Villa',
        'bhk_options', '3 BHK,4 BHK',
        'min_price_minor', 1820000000,
        'max_price_minor', 2450000000,
        'min_area_sqft', 2240,
        'max_area_sqft', 3360,
        'possession_label', 'Dec 2027',
        'project_status', 'Under Construction',
        'rera_number', 'RERA-P01100004711',
        'highlights', 'Low-density villa community in a growth corridor with long-term appreciation potential.',
        'brochure_url', 'https://example.com/brochures/tellapur-garden-villas.pdf',
        'image_url', 'https://example.com/images/tellapur-garden-villas.jpg',
        'location_url', 'https://maps.example.com/tellapur-garden-villas',
        'sales_owner_name', 'Nikhil Arora',
        'sales_owner_phone', '+919900045333',
        'sales_owner_email', 'nikhil.arora@greenarc.example.com',
        'active', true
      )
    ),
    (
      'seed_re_project_narsingi',
      'property_inventory',
      'project_id',
      'prj-nar-001',
      jsonb_build_object(
        'project_id', 'PRJ-NAR-001',
        'project_code', 'RE-NAR-01',
        'project_name', 'Narsingi Urban Nest',
        'developer_name', 'Skyroute Infra',
        'location', 'Narsingi',
        'micro_market', 'West Hyderabad',
        'property_type', 'Apartment',
        'bhk_options', '2 BHK,3 BHK',
        'min_price_minor', 820000000,
        'max_price_minor', 1090000000,
        'min_area_sqft', 1180,
        'max_area_sqft', 1690,
        'possession_label', 'Within 1 Year',
        'project_status', 'Near Completion',
        'rera_number', 'RERA-P02400005309',
        'highlights', 'Budget-friendly nearby alternative to Kokapet with ORR connectivity and family positioning.',
        'brochure_url', 'https://example.com/brochures/narsingi-urban-nest.pdf',
        'image_url', 'https://example.com/images/narsingi-urban-nest.jpg',
        'location_url', 'https://maps.example.com/narsingi-urban-nest',
        'sales_owner_name', 'Sandeep Rao',
        'sales_owner_phone', '+919900045222',
        'sales_owner_email', 'sandeep.rao@northstarrealty.example.com',
        'active', true
      )
    ),
    (
      'seed_re_project_plot',
      'property_inventory',
      'project_id',
      'prj-tel-plot-001',
      jsonb_build_object(
        'project_id', 'PRJ-TEL-PLOT-001',
        'project_code', 'RE-TEL-PLOT-01',
        'project_name', 'Tellapur Growth Plots',
        'developer_name', 'Terrabuild Estates',
        'location', 'Tellapur',
        'micro_market', 'West Hyderabad',
        'property_type', 'Plot',
        'bhk_options', '',
        'min_price_minor', 760000000,
        'max_price_minor', 1120000000,
        'min_area_sqft', 1800,
        'max_area_sqft', 3200,
        'possession_label', 'Ready to Register',
        'project_status', 'Ready',
        'rera_number', 'RERA-P01100004402',
        'highlights', 'Plotted development with growth-corridor upside for investment-led enquiries.',
        'brochure_url', 'https://example.com/brochures/tellapur-growth-plots.pdf',
        'image_url', 'https://example.com/images/tellapur-growth-plots.jpg',
        'location_url', 'https://maps.example.com/tellapur-growth-plots',
        'sales_owner_name', 'Nikhil Arora',
        'sales_owner_phone', '+919900045333',
        'sales_owner_email', 'nikhil.arora@greenarc.example.com',
        'active', true
      )
    ),
    (
      'seed_re_slot_kok_001_a',
      'real_estate_site_visit_slots',
      'slot_id',
      'slot-prj-kok-001-2026-08-22-1030',
      jsonb_build_object(
        'slot_id', 'SLOT-PRJ-KOK-001-2026-08-22-1030',
        'project_id', 'PRJ-KOK-001',
        'date', '2026-08-22',
        'start', '10:30',
        'end', '11:30',
        'label', 'Saturday 10:30 AM',
        'status', 'available',
        'hold_id', '',
        'held_by_session', '',
        'hold_expires_at', ''
      )
    ),
    (
      'seed_re_slot_kok_001_b',
      'real_estate_site_visit_slots',
      'slot_id',
      'slot-prj-kok-001-2026-08-22-1530',
      jsonb_build_object(
        'slot_id', 'SLOT-PRJ-KOK-001-2026-08-22-1530',
        'project_id', 'PRJ-KOK-001',
        'date', '2026-08-22',
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
      'seed_re_slot_kok_001_c',
      'real_estate_site_visit_slots',
      'slot_id',
      'slot-prj-kok-001-2026-08-23-1130',
      jsonb_build_object(
        'slot_id', 'SLOT-PRJ-KOK-001-2026-08-23-1130',
        'project_id', 'PRJ-KOK-001',
        'date', '2026-08-23',
        'start', '11:30',
        'end', '12:30',
        'label', 'Sunday 11:30 AM',
        'status', 'available',
        'hold_id', '',
        'held_by_session', '',
        'hold_expires_at', ''
      )
    ),
    (
      'seed_re_slot_kok_002_a',
      'real_estate_site_visit_slots',
      'slot_id',
      'slot-prj-kok-002-2026-08-23-1000',
      jsonb_build_object(
        'slot_id', 'SLOT-PRJ-KOK-002-2026-08-23-1000',
        'project_id', 'PRJ-KOK-002',
        'date', '2026-08-23',
        'start', '10:00',
        'end', '11:00',
        'label', 'Sunday 10:00 AM',
        'status', 'available',
        'hold_id', '',
        'held_by_session', '',
        'hold_expires_at', ''
      )
    ),
    (
      'seed_re_slot_kok_002_b',
      'real_estate_site_visit_slots',
      'slot_id',
      'slot-prj-kok-002-2026-08-24-1700',
      jsonb_build_object(
        'slot_id', 'SLOT-PRJ-KOK-002-2026-08-24-1700',
        'project_id', 'PRJ-KOK-002',
        'date', '2026-08-24',
        'start', '17:00',
        'end', '18:00',
        'label', 'Monday 5:00 PM',
        'status', 'available',
        'hold_id', '',
        'held_by_session', '',
        'hold_expires_at', ''
      )
    ),
    (
      'seed_re_slot_fd_001_a',
      'real_estate_site_visit_slots',
      'slot_id',
      'slot-prj-fd-001-2026-08-22-1100',
      jsonb_build_object(
        'slot_id', 'SLOT-PRJ-FD-001-2026-08-22-1100',
        'project_id', 'PRJ-FD-001',
        'date', '2026-08-22',
        'start', '11:00',
        'end', '12:00',
        'label', 'Saturday 11:00 AM',
        'status', 'available',
        'hold_id', '',
        'held_by_session', '',
        'hold_expires_at', ''
      )
    ),
    (
      'seed_re_slot_fd_001_b',
      'real_estate_site_visit_slots',
      'slot_id',
      'slot-prj-fd-001-2026-08-25-1600',
      jsonb_build_object(
        'slot_id', 'SLOT-PRJ-FD-001-2026-08-25-1600',
        'project_id', 'PRJ-FD-001',
        'date', '2026-08-25',
        'start', '16:00',
        'end', '17:00',
        'label', 'Tuesday 4:00 PM',
        'status', 'available',
        'hold_id', '',
        'held_by_session', '',
        'hold_expires_at', ''
      )
    ),
    (
      'seed_re_slot_tel_001_a',
      'real_estate_site_visit_slots',
      'slot_id',
      'slot-prj-tel-001-2026-08-23-1200',
      jsonb_build_object(
        'slot_id', 'SLOT-PRJ-TEL-001-2026-08-23-1200',
        'project_id', 'PRJ-TEL-001',
        'date', '2026-08-23',
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
      'seed_re_slot_tel_001_b',
      'real_estate_site_visit_slots',
      'slot_id',
      'slot-prj-tel-001-2026-08-24-1030',
      jsonb_build_object(
        'slot_id', 'SLOT-PRJ-TEL-001-2026-08-24-1030',
        'project_id', 'PRJ-TEL-001',
        'date', '2026-08-24',
        'start', '10:30',
        'end', '11:30',
        'label', 'Monday 10:30 AM',
        'status', 'available',
        'hold_id', '',
        'held_by_session', '',
        'hold_expires_at', ''
      )
    ),
    (
      'seed_re_slot_nar_001_a',
      'real_estate_site_visit_slots',
      'slot_id',
      'slot-prj-nar-001-2026-08-26-1500',
      jsonb_build_object(
        'slot_id', 'SLOT-PRJ-NAR-001-2026-08-26-1500',
        'project_id', 'PRJ-NAR-001',
        'date', '2026-08-26',
        'start', '15:00',
        'end', '16:00',
        'label', 'Wednesday 3:00 PM',
        'status', 'available',
        'hold_id', '',
        'held_by_session', '',
        'hold_expires_at', ''
      )
    ),
    (
      'seed_re_slot_plot_001_a',
      'real_estate_site_visit_slots',
      'slot_id',
      'slot-prj-tel-plot-001-2026-08-27-1030',
      jsonb_build_object(
        'slot_id', 'SLOT-PRJ-TEL-PLOT-001-2026-08-27-1030',
        'project_id', 'PRJ-TEL-PLOT-001',
        'date', '2026-08-27',
        'start', '10:30',
        'end', '11:30',
        'label', 'Thursday 10:30 AM',
        'status', 'available',
        'hold_id', '',
        'held_by_session', '',
        'hold_expires_at', ''
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
      WHEN kv.key IN ('phone_e164', 'buyer_mobile', 'sales_owner_phone', 'assigned_salesperson_phone')
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
  COUNT(*) FILTER (WHERE seed_records.collection = 'property_inventory') AS inventory_records_seeded,
  COUNT(*) FILTER (WHERE seed_records.collection = 'real_estate_site_visit_slots') AS slot_records_seeded,
  COUNT(*) FILTER (WHERE seed_records.collection = 'real_estate_contacts') AS contact_records_seeded,
  COUNT(*) FILTER (WHERE seed_records.collection = 'real_estate_leads') AS lead_records_seeded
FROM params
CROSS JOIN seed_records
GROUP BY params.tenant_id;

COMMIT;
