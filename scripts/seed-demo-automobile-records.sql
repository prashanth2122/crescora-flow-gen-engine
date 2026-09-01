-- Automobile demo seed for the FLOW record store.
-- This targets the generic records tables used by the `record` node runtime:
--   flow_record_schemas
--   flow_records
--   flow_record_indexes
--
-- How to run:
--   1. Update the tenant_id value in the params CTE below.
--   2. Run against the PostgreSQL database used by the FLOW records runtime.
--      This script writes to the shared `public` schema.
--      PowerShell example:
--      psql $env:DATABASE_URL -f .\scripts\seed-demo-automobile-records.sql
--
-- Date note:
--   This file is aligned to Tuesday, August 25, 2026.
--   The seeded operational test-drive and service dates are on or after Wednesday, August 26, 2026.

BEGIN;

SET search_path TO public;

WITH params AS (
  SELECT
    '8285edc4-af68-46c0-9e72-5b2819cb33d9'::text AS tenant_id,
    'seed-demo-automobile-records'::text AS source_tag
),
schemas (collection, schema_json) AS (
  VALUES
    (
      'automobile_customers',
      $${
        "collection": "automobile_customers",
        "fields": {
          "customer_id": { "type": "string", "required": true, "unique": true },
          "full_name": { "type": "string", "required": true },
          "phone_e164": { "type": "phone", "required": true, "unique": true },
          "email": { "type": "email", "required": false },
          "city": { "type": "string", "required": false },
          "preferred_language": { "type": "string", "required": false },
          "last_sales_lead_id": { "type": "string", "required": false },
          "last_vehicle_id": { "type": "string", "required": false }
        }
      }$$::jsonb
    ),
    (
      'dealership_locations',
      $${
        "collection": "dealership_locations",
        "fields": {
          "location_id": { "type": "string", "required": true, "unique": true },
          "location_name": { "type": "string", "required": true },
          "location_type": { "type": "string", "required": true },
          "city": { "type": "string", "required": true },
          "support_home_test_drive": { "type": "boolean", "required": true },
          "active": { "type": "boolean", "required": true },
          "coverage_pincodes": { "type": "string", "required": false },
          "maps_url": { "type": "url", "required": false }
        }
      }$$::jsonb
    ),
    (
      'vehicle_variants',
      $${
        "collection": "vehicle_variants",
        "fields": {
          "variant_id": { "type": "string", "required": true, "unique": true },
          "model_code": { "type": "string", "required": true },
          "model_name": { "type": "string", "required": true },
          "variant_name": { "type": "string", "required": true },
          "body_type": { "type": "string", "required": true },
          "fuel_type": { "type": "string", "required": true },
          "transmission": { "type": "string", "required": true },
          "ex_showroom_price": { "type": "number", "required": true },
          "seating_capacity": { "type": "number", "required": false },
          "claimed_mileage": { "type": "string", "required": false },
          "adas_level": { "type": "string", "required": false },
          "feature_summary": { "type": "string", "required": false },
          "brochure_url": { "type": "url", "required": false },
          "colors_summary": { "type": "string", "required": false },
          "inventory_status": { "type": "string", "required": true },
          "active": { "type": "boolean", "required": true },
          "campaign_priority": { "type": "number", "required": false },
          "usage_fit_tags": { "type": "string", "required": false }
        }
      }$$::jsonb
    ),
    (
      'vehicle_offers',
      $${
        "collection": "vehicle_offers",
        "fields": {
          "offer_id": { "type": "string", "required": true, "unique": true },
          "variant_id": { "type": "string", "required": true },
          "city": { "type": "string", "required": true },
          "offer_title": { "type": "string", "required": true },
          "discount_amount": { "type": "number", "required": true },
          "exchange_bonus": { "type": "number", "required": true },
          "corporate_benefit": { "type": "number", "required": true },
          "insurance_estimate": { "type": "number", "required": true },
          "rto_estimate": { "type": "number", "required": true },
          "active": { "type": "boolean", "required": true }
        }
      }$$::jsonb
    ),
    (
      'dealership_staff',
      $${
        "collection": "dealership_staff",
        "fields": {
          "staff_id": { "type": "string", "required": true, "unique": true },
          "role": { "type": "string", "required": true },
          "full_name": { "type": "string", "required": true },
          "phone_e164": { "type": "phone", "required": true },
          "email": { "type": "email", "required": false },
          "language": { "type": "string", "required": false },
          "location_id": { "type": "string", "required": true },
          "specialty_tags": { "type": "string", "required": false },
          "active": { "type": "boolean", "required": true },
          "active_leads": { "type": "number", "required": false }
        }
      }$$::jsonb
    ),
    (
      'automobile_leads',
      $${
        "collection": "automobile_leads",
        "fields": {
          "lead_id": { "type": "string", "required": true, "unique": true },
          "customer_id": { "type": "string", "required": false },
          "source_channel": { "type": "string", "required": true },
          "status": { "type": "string", "required": true },
          "stage": { "type": "string", "required": true },
          "requirement_summary": { "type": "string", "required": false },
          "body_type": { "type": "string", "required": false },
          "budget_max": { "type": "number", "required": false },
          "fuel_preference": { "type": "string", "required": false },
          "transmission_preference": { "type": "string", "required": false },
          "usage_type": { "type": "string", "required": false },
          "purchase_timeline": { "type": "string", "required": false },
          "finance_interest": { "type": "string", "required": false },
          "exchange_interest": { "type": "string", "required": false },
          "lead_score": { "type": "number", "required": false },
          "lead_temperature": { "type": "string", "required": false },
          "selected_variant_id": { "type": "string", "required": false },
          "selected_variant_name": { "type": "string", "required": false },
          "assigned_salesperson_id": { "type": "string", "required": false },
          "last_activity_at": { "type": "string", "required": false }
        }
      }$$::jsonb
    ),
    (
      'automobile_lead_assignments',
      $${
        "collection": "automobile_lead_assignments",
        "fields": {
          "assignment_id": { "type": "string", "required": true, "unique": true },
          "lead_id": { "type": "string", "required": true },
          "salesperson_id": { "type": "string", "required": true },
          "assignment_reason": { "type": "string", "required": false },
          "assigned_at": { "type": "string", "required": false }
        }
      }$$::jsonb
    ),
    (
      'automobile_lead_activities',
      $${
        "collection": "automobile_lead_activities",
        "fields": {
          "activity_id": { "type": "string", "required": true, "unique": true },
          "lead_id": { "type": "string", "required": true },
          "customer_id": { "type": "string", "required": false },
          "variant_id": { "type": "string", "required": false },
          "activity_type": { "type": "string", "required": true },
          "summary": { "type": "string", "required": false },
          "occurred_at": { "type": "string", "required": false }
        }
      }$$::jsonb
    ),
    (
      'test_drive_vehicles',
      $${
        "collection": "test_drive_vehicles",
        "fields": {
          "test_drive_vehicle_id": { "type": "string", "required": true, "unique": true },
          "variant_id": { "type": "string", "required": true },
          "location_id": { "type": "string", "required": true },
          "registration_number": { "type": "string", "required": true },
          "status": { "type": "string", "required": true },
          "active": { "type": "boolean", "required": true }
        }
      }$$::jsonb
    ),
    (
      'test_drive_slots',
      $${
        "collection": "test_drive_slots",
        "fields": {
          "slot_id": { "type": "string", "required": true, "unique": true },
          "location_id": { "type": "string", "required": true },
          "variant_id": { "type": "string", "required": true },
          "test_drive_vehicle_id": { "type": "string", "required": true },
          "date": { "type": "string", "required": true },
          "start": { "type": "string", "required": true },
          "end": { "type": "string", "required": true },
          "label": { "type": "string", "required": true },
          "status": { "type": "string", "required": true },
          "hold_id": { "type": "string", "required": false },
          "held_by_session": { "type": "string", "required": false },
          "hold_expires_at": { "type": "string", "required": false },
          "booking_id": { "type": "string", "required": false }
        }
      }$$::jsonb
    ),
    (
      'test_drive_bookings',
      $${
        "collection": "test_drive_bookings",
        "fields": {
          "booking_id": { "type": "string", "required": true, "unique": true },
          "booking_number": { "type": "string", "required": true, "unique": true },
          "customer_id": { "type": "string", "required": true },
          "lead_id": { "type": "string", "required": false },
          "location_id": { "type": "string", "required": true },
          "variant_id": { "type": "string", "required": true },
          "variant_name": { "type": "string", "required": true },
          "slot_id": { "type": "string", "required": true },
          "booking_mode": { "type": "string", "required": true },
          "scheduled_date": { "type": "string", "required": true },
          "scheduled_time": { "type": "string", "required": true },
          "scheduled_at": { "type": "string", "required": true },
          "status": { "type": "string", "required": true },
          "salesperson_id": { "type": "string", "required": false },
          "address_summary": { "type": "string", "required": false }
        }
      }$$::jsonb
    ),
    (
      'finance_requests',
      $${
        "collection": "finance_requests",
        "fields": {
          "finance_id": { "type": "string", "required": true, "unique": true },
          "lead_id": { "type": "string", "required": true },
          "customer_id": { "type": "string", "required": false },
          "variant_id": { "type": "string", "required": true },
          "on_road_price": { "type": "number", "required": true },
          "down_payment": { "type": "number", "required": true },
          "loan_amount": { "type": "number", "required": true },
          "tenure_months": { "type": "number", "required": true },
          "indicative_emi": { "type": "number", "required": true },
          "status": { "type": "string", "required": true }
        }
      }$$::jsonb
    ),
    (
      'exchange_requests',
      $${
        "collection": "exchange_requests",
        "fields": {
          "exchange_id": { "type": "string", "required": true, "unique": true },
          "lead_id": { "type": "string", "required": true },
          "customer_id": { "type": "string", "required": false },
          "make": { "type": "string", "required": true },
          "model": { "type": "string", "required": true },
          "registration_year": { "type": "number", "required": true },
          "fuel": { "type": "string", "required": true },
          "transmission": { "type": "string", "required": true },
          "kilometers": { "type": "number", "required": true },
          "condition_summary": { "type": "string", "required": false },
          "expected_value": { "type": "number", "required": false },
          "status": { "type": "string", "required": true }
        }
      }$$::jsonb
    ),
    (
      'customer_vehicles',
      $${
        "collection": "customer_vehicles",
        "fields": {
          "vehicle_id": { "type": "string", "required": true, "unique": true },
          "customer_id": { "type": "string", "required": true },
          "variant_id": { "type": "string", "required": false },
          "model_name": { "type": "string", "required": true },
          "registration_number": { "type": "string", "required": true, "unique": true },
          "manufacturing_year": { "type": "number", "required": false },
          "status": { "type": "string", "required": true },
          "odometer_km": { "type": "number", "required": false }
        }
      }$$::jsonb
    ),
    (
      'service_slots',
      $${
        "collection": "service_slots",
        "fields": {
          "slot_id": { "type": "string", "required": true, "unique": true },
          "service_center_id": { "type": "string", "required": true },
          "service_category": { "type": "string", "required": true },
          "date": { "type": "string", "required": true },
          "start": { "type": "string", "required": true },
          "end": { "type": "string", "required": true },
          "label": { "type": "string", "required": true },
          "capacity": { "type": "number", "required": true },
          "remaining_capacity": { "type": "number", "required": true },
          "status": { "type": "string", "required": true },
          "hold_id": { "type": "string", "required": false },
          "held_by_session": { "type": "string", "required": false },
          "hold_expires_at": { "type": "string", "required": false },
          "booking_id": { "type": "string", "required": false }
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
          "customer_id": { "type": "string", "required": true },
          "vehicle_id": { "type": "string", "required": true },
          "service_center_id": { "type": "string", "required": true },
          "slot_id": { "type": "string", "required": true },
          "service_type": { "type": "string", "required": true },
          "pickup_type": { "type": "string", "required": true },
          "scheduled_date": { "type": "string", "required": true },
          "scheduled_time": { "type": "string", "required": true },
          "status": { "type": "string", "required": true },
          "advisor_id": { "type": "string", "required": false },
          "pickup_address": { "type": "string", "required": false }
        }
      }$$::jsonb
    ),
    (
      'service_orders',
      $${
        "collection": "service_orders",
        "fields": {
          "service_order_id": { "type": "string", "required": true, "unique": true },
          "service_booking_id": { "type": "string", "required": false },
          "customer_id": { "type": "string", "required": true },
          "vehicle_id": { "type": "string", "required": true },
          "service_center_id": { "type": "string", "required": true },
          "advisor_id": { "type": "string", "required": false },
          "status": { "type": "string", "required": true },
          "current_stage": { "type": "string", "required": true },
          "payment_status": { "type": "string", "required": true },
          "total_amount": { "type": "number", "required": false },
          "timeline_summary": { "type": "string", "required": false },
          "estimated_completion_at": { "type": "string", "required": false }
        }
      }$$::jsonb
    ),
    (
      'service_estimates',
      $${
        "collection": "service_estimates",
        "fields": {
          "estimate_id": { "type": "string", "required": true, "unique": true },
          "service_order_id": { "type": "string", "required": true },
          "version": { "type": "number", "required": true },
          "total_amount": { "type": "number", "required": true },
          "line_items_summary": { "type": "string", "required": false },
          "status": { "type": "string", "required": true }
        }
      }$$::jsonb
    ),
    (
      'service_payments',
      $${
        "collection": "service_payments",
        "fields": {
          "payment_id": { "type": "string", "required": true, "unique": true },
          "service_order_id": { "type": "string", "required": true },
          "customer_id": { "type": "string", "required": true },
          "amount": { "type": "number", "required": true },
          "currency": { "type": "string", "required": true },
          "status": { "type": "string", "required": true },
          "provider_reference": { "type": "string", "required": false }
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
      'seed_auto_location_show_jh',
      'dealership_locations',
      'location_id',
      'loc-show-jh',
      jsonb_build_object(
        'location_id', 'LOC-SHOW-JH',
        'location_name', 'Jubilee Hills Showroom',
        'location_type', 'showroom',
        'city', 'Hyderabad',
        'support_home_test_drive', true,
        'active', true,
        'coverage_pincodes', '500033,500034,500081',
        'maps_url', 'https://maps.example.com/jubilee-hills-showroom'
      )
    ),
    (
      'seed_auto_location_show_gach',
      'dealership_locations',
      'location_id',
      'loc-show-gach',
      jsonb_build_object(
        'location_id', 'LOC-SHOW-GACH',
        'location_name', 'Gachibowli Experience Centre',
        'location_type', 'showroom',
        'city', 'Hyderabad',
        'support_home_test_drive', true,
        'active', true,
        'coverage_pincodes', '500032,500084,500081',
        'maps_url', 'https://maps.example.com/gachibowli-experience-centre'
      )
    ),
    (
      'seed_auto_location_service_jh',
      'dealership_locations',
      'location_id',
      'loc-svc-jh',
      jsonb_build_object(
        'location_id', 'LOC-SVC-JH',
        'location_name', 'Jubilee Hills Service Center',
        'location_type', 'service_center',
        'city', 'Hyderabad',
        'support_home_test_drive', false,
        'active', true,
        'coverage_pincodes', '',
        'maps_url', 'https://maps.example.com/jubilee-hills-service-center'
      )
    ),
    (
      'seed_auto_location_service_kphb',
      'dealership_locations',
      'location_id',
      'loc-svc-kphb',
      jsonb_build_object(
        'location_id', 'LOC-SVC-KPHB',
        'location_name', 'Kukatpally Service Hub',
        'location_type', 'service_center',
        'city', 'Hyderabad',
        'support_home_test_drive', false,
        'active', true,
        'coverage_pincodes', '',
        'maps_url', 'https://maps.example.com/kukatpally-service-hub'
      )
    ),
    (
      'seed_auto_variant_aster_premium',
      'vehicle_variants',
      'variant_id',
      'vx-aster-suv-at',
      jsonb_build_object(
        'variant_id', 'VX-ASTER-SUV-AT',
        'model_code', 'ASTER-X',
        'model_name', 'Aster X',
        'variant_name', 'Premium AT',
        'body_type', 'SUV',
        'fuel_type', 'Petrol',
        'transmission', 'Automatic',
        'ex_showroom_price', 1349000,
        'seating_capacity', 5,
        'claimed_mileage', '17 km/l',
        'adas_level', 'No',
        'feature_summary', '6 airbags, sunroof, 360 camera, wireless CarPlay',
        'brochure_url', 'https://example.com/brochures/aster-x-premium-at.pdf',
        'colors_summary', 'Pearl White, Titan Grey, Deep Blue',
        'inventory_status', 'active',
        'active', true,
        'campaign_priority', 8,
        'usage_fit_tags', 'family,city,mixed'
      )
    ),
    (
      'seed_auto_variant_aster_hybrid',
      'vehicle_variants',
      'variant_id',
      'vx-aster-suv-hyb',
      jsonb_build_object(
        'variant_id', 'VX-ASTER-SUV-HYB',
        'model_code', 'ASTER-X',
        'model_name', 'Aster X',
        'variant_name', 'Smart Hybrid AT',
        'body_type', 'SUV',
        'fuel_type', 'Hybrid',
        'transmission', 'Automatic',
        'ex_showroom_price', 1595000,
        'seating_capacity', 5,
        'claimed_mileage', '20 km/l',
        'adas_level', 'Level 2',
        'feature_summary', 'ADAS, panoramic roof, vent seats, connected car stack',
        'brochure_url', 'https://example.com/brochures/aster-x-smart-hybrid-at.pdf',
        'colors_summary', 'Ivory White, Emerald Green, Cosmic Black',
        'inventory_status', 'active',
        'active', true,
        'campaign_priority', 9,
        'usage_fit_tags', 'family,highway,mixed'
      )
    ),
    (
      'seed_auto_variant_citycruise',
      'vehicle_variants',
      'variant_id',
      'vx-citycruise-sdn-cvt',
      jsonb_build_object(
        'variant_id', 'VX-CITYCRUISE-SDN-CVT',
        'model_code', 'CITYCRUISE',
        'model_name', 'CityCruise',
        'variant_name', 'Signature CVT',
        'body_type', 'Sedan',
        'fuel_type', 'Petrol',
        'transmission', 'Automatic',
        'ex_showroom_price', 1420000,
        'seating_capacity', 5,
        'claimed_mileage', '18 km/l',
        'adas_level', 'Level 2',
        'feature_summary', 'ADAS, leatherette cabin, dual-zone climate, premium audio',
        'brochure_url', 'https://example.com/brochures/citycruise-signature-cvt.pdf',
        'colors_summary', 'Silver Mist, Black Pearl, Ruby Red',
        'inventory_status', 'active',
        'active', true,
        'campaign_priority', 7,
        'usage_fit_tags', 'city,highway'
      )
    ),
    (
      'seed_auto_variant_urban_ev',
      'vehicle_variants',
      'variant_id',
      'vx-urban-e-glide',
      jsonb_build_object(
        'variant_id', 'VX-URBAN-E-GLIDE',
        'model_code', 'URBAN-E',
        'model_name', 'Urban E',
        'variant_name', 'Glide Long Range',
        'body_type', 'SUV',
        'fuel_type', 'EV',
        'transmission', 'Automatic',
        'ex_showroom_price', 1799000,
        'seating_capacity', 5,
        'claimed_mileage', '430 km range',
        'adas_level', 'Level 2',
        'feature_summary', 'Fast charging, 430 km range, ADAS, OTA updates',
        'brochure_url', 'https://example.com/brochures/urban-e-glide-long-range.pdf',
        'colors_summary', 'Matte Grey, Arctic White, Sunset Copper',
        'inventory_status', 'active',
        'active', true,
        'campaign_priority', 6,
        'usage_fit_tags', 'city,commute'
      )
    ),
    (
      'seed_auto_variant_tourer',
      'vehicle_variants',
      'variant_id',
      'vx-tourer-plus-diesel',
      jsonb_build_object(
        'variant_id', 'VX-TOURER-PLUS-DIESEL',
        'model_code', 'TOURER',
        'model_name', 'Tourer Plus',
        'variant_name', 'Diesel MT',
        'body_type', 'MPV',
        'fuel_type', 'Diesel',
        'transmission', 'Manual',
        'ex_showroom_price', 1645000,
        'seating_capacity', 7,
        'claimed_mileage', '19 km/l',
        'adas_level', 'No',
        'feature_summary', '7 seats, captain chairs, cruise control, rear AC vents',
        'brochure_url', 'https://example.com/brochures/tourer-plus-diesel-mt.pdf',
        'colors_summary', 'Pearl White, Mocha Brown',
        'inventory_status', 'active',
        'active', true,
        'campaign_priority', 5,
        'usage_fit_tags', 'family,highway'
      )
    ),
    (
      'seed_auto_offer_aster_hyd',
      'vehicle_offers',
      'offer_id',
      'offer-aster-hyd',
      jsonb_build_object(
        'offer_id', 'OFFER-ASTER-HYD',
        'variant_id', 'VX-ASTER-SUV-AT',
        'city', 'Hyderabad',
        'offer_title', 'Festival exchange and loyalty pack',
        'discount_amount', 35000,
        'exchange_bonus', 25000,
        'corporate_benefit', 10000,
        'insurance_estimate', 49000,
        'rto_estimate', 142000,
        'active', true
      )
    ),
    (
      'seed_auto_offer_aster_hybrid_hyd',
      'vehicle_offers',
      'offer_id',
      'offer-aster-hybrid-hyd',
      jsonb_build_object(
        'offer_id', 'OFFER-ASTER-HYB-HYD',
        'variant_id', 'VX-ASTER-SUV-HYB',
        'city', 'Hyderabad',
        'offer_title', 'Hybrid upgrade month benefits',
        'discount_amount', 40000,
        'exchange_bonus', 30000,
        'corporate_benefit', 15000,
        'insurance_estimate', 56000,
        'rto_estimate', 168000,
        'active', true
      )
    ),
    (
      'seed_auto_offer_city_hyd',
      'vehicle_offers',
      'offer_id',
      'offer-city-hyd',
      jsonb_build_object(
        'offer_id', 'OFFER-CITY-HYD',
        'variant_id', 'VX-CITYCRUISE-SDN-CVT',
        'city', 'Hyderabad',
        'offer_title', 'Corporate sedan program',
        'discount_amount', 25000,
        'exchange_bonus', 20000,
        'corporate_benefit', 15000,
        'insurance_estimate', 47000,
        'rto_estimate', 148000,
        'active', true
      )
    ),
    (
      'seed_auto_staff_priya',
      'dealership_staff',
      'staff_id',
      'staff-sales-priya',
      jsonb_build_object(
        'staff_id', 'STAFF-SALES-PRIYA',
        'role', 'sales',
        'full_name', 'Priya Reddy',
        'phone_e164', '+919900045111',
        'email', 'priya.reddy@crescora-auto.example',
        'language', 'English,Telugu,Hindi',
        'location_id', 'LOC-SHOW-JH',
        'specialty_tags', 'SUV,hybrid,premium',
        'active', true,
        'active_leads', 9
      )
    ),
    (
      'seed_auto_staff_arjun',
      'dealership_staff',
      'staff_id',
      'staff-sales-arjun',
      jsonb_build_object(
        'staff_id', 'STAFF-SALES-ARJUN',
        'role', 'sales',
        'full_name', 'Arjun Mehta',
        'phone_e164', '+919900045222',
        'email', 'arjun.mehta@crescora-auto.example',
        'language', 'English,Hindi',
        'location_id', 'LOC-SHOW-GACH',
        'specialty_tags', 'sedan,city,automatic',
        'active', true,
        'active_leads', 7
      )
    ),
    (
      'seed_auto_staff_kavya',
      'dealership_staff',
      'staff_id',
      'staff-service-kavya',
      jsonb_build_object(
        'staff_id', 'STAFF-SVC-KAVYA',
        'role', 'service_advisor',
        'full_name', 'Kavya Rao',
        'phone_e164', '+919900045333',
        'email', 'kavya.rao@crescora-auto.example',
        'language', 'English,Telugu',
        'location_id', 'LOC-SVC-JH',
        'specialty_tags', 'periodic,repair,premium',
        'active', true,
        'active_leads', 6
      )
    ),
    (
      'seed_auto_staff_mohan',
      'dealership_staff',
      'staff_id',
      'staff-service-mohan',
      jsonb_build_object(
        'staff_id', 'STAFF-SVC-MOHAN',
        'role', 'service_advisor',
        'full_name', 'Mohan Yadav',
        'phone_e164', '+919900045444',
        'email', 'mohan.yadav@crescora-auto.example',
        'language', 'English,Hindi',
        'location_id', 'LOC-SVC-KPHB',
        'specialty_tags', 'repair,pickup_drop',
        'active', true,
        'active_leads', 5
      )
    ),
    (
      'seed_auto_customer_rahul',
      'automobile_customers',
      'phone_e164',
      'phone:9876543210',
      jsonb_build_object(
        'customer_id', 'CUST-9876543210',
        'full_name', 'Rahul Varma',
        'phone_e164', '+919876543210',
        'email', 'rahul.varma@example.com',
        'city', 'Hyderabad',
        'preferred_language', 'en',
        'last_sales_lead_id', 'LD-AUTO-0001',
        'last_vehicle_id', 'VEH-RAHUL-01'
      )
    ),
    (
      'seed_auto_customer_aisha',
      'automobile_customers',
      'phone_e164',
      'phone:9123456780',
      jsonb_build_object(
        'customer_id', 'CUST-9123456780',
        'full_name', 'Aisha Khan',
        'phone_e164', '+919123456780',
        'email', 'aisha.khan@example.com',
        'city', 'Hyderabad',
        'preferred_language', 'en',
        'last_sales_lead_id', 'LD-AUTO-0002',
        'last_vehicle_id', 'VEH-AISHA-01'
      )
    ),
    (
      'seed_auto_lead_rahul',
      'automobile_leads',
      'lead_id',
      'ld-auto-0001',
      jsonb_build_object(
        'lead_id', 'LD-AUTO-0001',
        'customer_id', 'CUST-9876543210',
        'source_channel', 'WHATSAPP',
        'status', 'test_drive_booked',
        'stage', 'test_drive_booked',
        'requirement_summary', 'SUV automatic within ₹15 lakh for family and city use',
        'body_type', 'SUV',
        'budget_max', 1500000,
        'fuel_preference', 'Petrol',
        'transmission_preference', 'Automatic',
        'usage_type', 'Family',
        'purchase_timeline', 'Within 30 Days',
        'finance_interest', 'yes',
        'exchange_interest', 'no',
        'lead_score', 78,
        'lead_temperature', 'warm',
        'selected_variant_id', 'VX-ASTER-SUV-AT',
        'selected_variant_name', 'Aster X - Premium AT',
        'assigned_salesperson_id', 'STAFF-SALES-PRIYA',
        'last_activity_at', '2026-08-25T09:30:00.000Z'
      )
    ),
    (
      'seed_auto_assignment_rahul',
      'automobile_lead_assignments',
      'assignment_id',
      'asg-auto-0001',
      jsonb_build_object(
        'assignment_id', 'ASG-AUTO-0001',
        'lead_id', 'LD-AUTO-0001',
        'salesperson_id', 'STAFF-SALES-PRIYA',
        'assignment_reason', 'location + vehicle fit + least busy',
        'assigned_at', '2026-08-25T09:31:00.000Z'
      )
    ),
    (
      'seed_auto_activity_rahul',
      'automobile_lead_activities',
      'activity_id',
      'lead-auto-0001-test-drive',
      jsonb_build_object(
        'activity_id', 'LD-AUTO-0001-TEST-DRIVE',
        'lead_id', 'LD-AUTO-0001',
        'customer_id', 'CUST-9876543210',
        'variant_id', 'VX-ASTER-SUV-AT',
        'activity_type', 'test_drive_booked',
        'summary', 'Aster X Premium AT | 2026-08-26 16:30 | Jubilee Hills Showroom',
        'occurred_at', '2026-08-25T09:31:00.000Z'
      )
    ),
    (
      'seed_auto_test_drive_vehicle_1',
      'test_drive_vehicles',
      'test_drive_vehicle_id',
      'tdv-1021',
      jsonb_build_object(
        'test_drive_vehicle_id', 'TDV-1021',
        'variant_id', 'VX-ASTER-SUV-AT',
        'location_id', 'LOC-SHOW-JH',
        'registration_number', 'TS09TD1021',
        'status', 'available',
        'active', true
      )
    ),
    (
      'seed_auto_test_drive_vehicle_2',
      'test_drive_vehicles',
      'test_drive_vehicle_id',
      'tdv-2042',
      jsonb_build_object(
        'test_drive_vehicle_id', 'TDV-2042',
        'variant_id', 'VX-CITYCRUISE-SDN-CVT',
        'location_id', 'LOC-SHOW-GACH',
        'registration_number', 'TS07TD2042',
        'status', 'available',
        'active', true
      )
    ),
    (
      'seed_auto_td_slot_1',
      'test_drive_slots',
      'slot_id',
      'tds-102938',
      jsonb_build_object(
        'slot_id', 'TDS-102938',
        'location_id', 'LOC-SHOW-JH',
        'variant_id', 'VX-ASTER-SUV-AT',
        'test_drive_vehicle_id', 'TDV-1021',
        'date', '2026-08-27',
        'start', '11:00',
        'end', '11:30',
        'label', 'Thursday 11:00 AM - 11:30 AM',
        'status', 'available',
        'hold_id', '',
        'held_by_session', '',
        'hold_expires_at', '',
        'booking_id', ''
      )
    ),
    (
      'seed_auto_td_slot_2',
      'test_drive_slots',
      'slot_id',
      'tds-102939',
      jsonb_build_object(
        'slot_id', 'TDS-102939',
        'location_id', 'LOC-SHOW-JH',
        'variant_id', 'VX-ASTER-SUV-AT',
        'test_drive_vehicle_id', 'TDV-1021',
        'date', '2026-08-27',
        'start', '16:30',
        'end', '17:00',
        'label', 'Thursday 4:30 PM - 5:00 PM',
        'status', 'available',
        'hold_id', '',
        'held_by_session', '',
        'hold_expires_at', '',
        'booking_id', ''
      )
    ),
    (
      'seed_auto_td_slot_3',
      'test_drive_slots',
      'slot_id',
      'tds-102940',
      jsonb_build_object(
        'slot_id', 'TDS-102940',
        'location_id', 'LOC-SHOW-JH',
        'variant_id', 'VX-ASTER-SUV-AT',
        'test_drive_vehicle_id', 'TDV-1021',
        'date', '2026-08-28',
        'start', '10:30',
        'end', '11:00',
        'label', 'Friday 10:30 AM - 11:00 AM',
        'status', 'available',
        'hold_id', '',
        'held_by_session', '',
        'hold_expires_at', '',
        'booking_id', ''
      )
    ),
    (
      'seed_auto_td_slot_4',
      'test_drive_slots',
      'slot_id',
      'tds-204201',
      jsonb_build_object(
        'slot_id', 'TDS-204201',
        'location_id', 'LOC-SHOW-GACH',
        'variant_id', 'VX-CITYCRUISE-SDN-CVT',
        'test_drive_vehicle_id', 'TDV-2042',
        'date', '2026-08-27',
        'start', '12:30',
        'end', '13:00',
        'label', 'Thursday 12:30 PM - 1:00 PM',
        'status', 'available',
        'hold_id', '',
        'held_by_session', '',
        'hold_expires_at', '',
        'booking_id', ''
      )
    ),
    (
      'seed_auto_booking_rahul',
      'test_drive_bookings',
      'booking_id',
      'tdb-auto-0001',
      jsonb_build_object(
        'booking_id', 'TDB-AUTO-0001',
        'booking_number', 'TD-20260826-3210',
        'customer_id', 'CUST-9876543210',
        'lead_id', 'LD-AUTO-0001',
        'location_id', 'LOC-SHOW-JH',
        'variant_id', 'VX-ASTER-SUV-AT',
        'variant_name', 'Aster X - Premium AT',
        'slot_id', 'TDS-BOOKED-20260826-1630',
        'booking_mode', 'showroom',
        'scheduled_date', '2026-08-26',
        'scheduled_time', '16:30',
        'scheduled_at', '2026-08-26T16:30:00+05:30',
        'status', 'confirmed',
        'salesperson_id', 'STAFF-SALES-PRIYA',
        'address_summary', 'Jubilee Hills Showroom'
      )
    ),
    (
      'seed_auto_finance_rahul',
      'finance_requests',
      'finance_id',
      'fin-auto-0001',
      jsonb_build_object(
        'finance_id', 'FIN-AUTO-0001',
        'lead_id', 'LD-AUTO-0001',
        'customer_id', 'CUST-9876543210',
        'variant_id', 'VX-ASTER-SUV-AT',
        'on_road_price', 1505000,
        'down_payment', 300000,
        'loan_amount', 1205000,
        'tenure_months', 60,
        'indicative_emi', 25254,
        'status', 'qualified'
      )
    ),
    (
      'seed_auto_exchange_aisha',
      'exchange_requests',
      'exchange_id',
      'ex-auto-0001',
      jsonb_build_object(
        'exchange_id', 'EX-AUTO-0001',
        'lead_id', 'LD-AUTO-0002',
        'customer_id', 'CUST-9123456780',
        'make', 'Hyundai',
        'model', 'i20',
        'registration_year', 2021,
        'fuel', 'Petrol',
        'transmission', 'Automatic',
        'kilometers', 28000,
        'condition_summary', 'Single owner, no major accidental history, regular service',
        'expected_value', 620000,
        'status', 'requested'
      )
    ),
    (
      'seed_auto_vehicle_rahul',
      'customer_vehicles',
      'vehicle_id',
      'veh-rahul-01',
      jsonb_build_object(
        'vehicle_id', 'VEH-RAHUL-01',
        'customer_id', 'CUST-9876543210',
        'variant_id', 'VX-ASTER-SUV-AT',
        'model_name', 'Aster X Premium AT',
        'registration_number', 'TS09AB1234',
        'manufacturing_year', 2024,
        'status', 'active',
        'odometer_km', 18500
      )
    ),
    (
      'seed_auto_vehicle_aisha',
      'customer_vehicles',
      'vehicle_id',
      'veh-aisha-01',
      jsonb_build_object(
        'vehicle_id', 'VEH-AISHA-01',
        'customer_id', 'CUST-9123456780',
        'variant_id', 'VX-CITYCRUISE-SDN-CVT',
        'model_name', 'CityCruise Signature CVT',
        'registration_number', 'TS10CD4567',
        'manufacturing_year', 2023,
        'status', 'active',
        'odometer_km', 22000
      )
    ),
    (
      'seed_auto_service_slot_1',
      'service_slots',
      'slot_id',
      'srv-slot-001',
      jsonb_build_object(
        'slot_id', 'SRV-SLOT-001',
        'service_center_id', 'LOC-SVC-JH',
        'service_category', 'periodic_service',
        'date', '2026-08-28',
        'start', '09:30',
        'end', '11:00',
        'label', 'Friday 9:30 AM - 11:00 AM',
        'capacity', 1,
        'remaining_capacity', 1,
        'status', 'available',
        'hold_id', '',
        'held_by_session', '',
        'hold_expires_at', '',
        'booking_id', ''
      )
    ),
    (
      'seed_auto_service_slot_2',
      'service_slots',
      'slot_id',
      'srv-slot-002',
      jsonb_build_object(
        'slot_id', 'SRV-SLOT-002',
        'service_center_id', 'LOC-SVC-JH',
        'service_category', 'repair',
        'date', '2026-08-28',
        'start', '11:30',
        'end', '13:00',
        'label', 'Friday 11:30 AM - 1:00 PM',
        'capacity', 1,
        'remaining_capacity', 1,
        'status', 'available',
        'hold_id', '',
        'held_by_session', '',
        'hold_expires_at', '',
        'booking_id', ''
      )
    ),
    (
      'seed_auto_service_slot_3',
      'service_slots',
      'slot_id',
      'srv-slot-003',
      jsonb_build_object(
        'slot_id', 'SRV-SLOT-003',
        'service_center_id', 'LOC-SVC-KPHB',
        'service_category', 'repair',
        'date', '2026-08-29',
        'start', '10:00',
        'end', '11:30',
        'label', 'Saturday 10:00 AM - 11:30 AM',
        'capacity', 1,
        'remaining_capacity', 1,
        'status', 'available',
        'hold_id', '',
        'held_by_session', '',
        'hold_expires_at', '',
        'booking_id', ''
      )
    ),
    (
      'seed_auto_service_booking_rahul',
      'service_bookings',
      'booking_id',
      'srv-booking-rahul',
      jsonb_build_object(
        'booking_id', 'SRV-BOOKING-RAHUL',
        'booking_number', 'SRV-20260828-54321',
        'customer_id', 'CUST-9876543210',
        'vehicle_id', 'VEH-RAHUL-01',
        'service_center_id', 'LOC-SVC-JH',
        'slot_id', 'SRV-SLOT-001',
        'service_type', 'periodic_service',
        'pickup_type', 'drive_to_center',
        'scheduled_date', '2026-08-28',
        'scheduled_time', '09:30',
        'status', 'booked',
        'advisor_id', 'STAFF-SVC-KAVYA',
        'pickup_address', ''
      )
    ),
    (
      'seed_auto_service_order_rahul',
      'service_orders',
      'service_order_id',
      'so-rahul-0001',
      jsonb_build_object(
        'service_order_id', 'SO-RAHUL-0001',
        'service_booking_id', 'SRV-BOOKING-RAHUL',
        'customer_id', 'CUST-9876543210',
        'vehicle_id', 'VEH-RAHUL-01',
        'service_center_id', 'LOC-SVC-JH',
        'advisor_id', 'STAFF-SVC-KAVYA',
        'status', 'waiting_customer_approval',
        'current_stage', 'estimate_prepared',
        'payment_status', 'pending',
        'total_amount', 8600,
        'timeline_summary', '✅ Vehicle Received\n✅ Inspection Complete\n🔄 Estimate Prepared\n○ Waiting Customer Approval\n○ Repair In Progress',
        'estimated_completion_at', '2026-08-26T18:00:00.000Z'
      )
    ),
    (
      'seed_auto_service_order_aisha',
      'service_orders',
      'service_order_id',
      'so-aisha-0001',
      jsonb_build_object(
        'service_order_id', 'SO-AISHA-0001',
        'service_booking_id', 'SRV-BOOKING-AISHA',
        'customer_id', 'CUST-9123456780',
        'vehicle_id', 'VEH-AISHA-01',
        'service_center_id', 'LOC-SVC-KPHB',
        'advisor_id', 'STAFF-SVC-MOHAN',
        'status', 'ready_for_delivery',
        'current_stage', 'payment_pending',
        'payment_status', 'pending',
        'total_amount', 9240,
        'timeline_summary', '✅ Vehicle Received\n✅ Inspection Complete\n✅ Repair In Progress\n✅ Quality Check\n✅ Ready for Delivery\n🔄 Payment Pending',
        'estimated_completion_at', '2026-08-26T17:30:00.000Z'
      )
    ),
    (
      'seed_auto_service_estimate_rahul',
      'service_estimates',
      'estimate_id',
      'est-rahul-0001',
      jsonb_build_object(
        'estimate_id', 'EST-RAHUL-0001',
        'service_order_id', 'SO-RAHUL-0001',
        'version', 1,
        'total_amount', 8600,
        'line_items_summary', 'Periodic service - ₹4,500\nBrake pad replacement - ₹3,200\nWheel alignment - ₹900',
        'status', 'sent'
      )
    ),
    (
      'seed_auto_service_estimate_aisha',
      'service_estimates',
      'estimate_id',
      'est-aisha-0001',
      jsonb_build_object(
        'estimate_id', 'EST-AISHA-0001',
        'service_order_id', 'SO-AISHA-0001',
        'version', 2,
        'total_amount', 9240,
        'line_items_summary', 'Periodic service - ₹4,500\nBrake pad replacement - ₹3,200\nWheel alignment - ₹900\nBattery terminal service - ₹640',
        'status', 'approved'
      )
    ),
    (
      'seed_auto_service_payment_aisha',
      'service_payments',
      'payment_id',
      'pay-srv-aisha-0001',
      jsonb_build_object(
        'payment_id', 'PAY-SRV-AISHA-0001',
        'service_order_id', 'SO-AISHA-0001',
        'customer_id', 'CUST-9123456780',
        'amount', 9240,
        'currency', 'INR',
        'status', 'created',
        'provider_reference', 'rzp_srv_aisha_0001'
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
  COUNT(*) FILTER (WHERE seed_records.collection = 'vehicle_variants') AS variant_records_seeded,
  COUNT(*) FILTER (WHERE seed_records.collection = 'test_drive_slots') AS test_drive_slot_records_seeded,
  COUNT(*) FILTER (WHERE seed_records.collection = 'service_slots') AS service_slot_records_seeded,
  COUNT(*) FILTER (WHERE seed_records.collection = 'automobile_customers') AS customer_records_seeded,
  COUNT(*) FILTER (WHERE seed_records.collection = 'service_orders') AS service_order_records_seeded
FROM params
CROSS JOIN seed_records
GROUP BY params.tenant_id;

COMMIT;
