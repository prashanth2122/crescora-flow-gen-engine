-- Retail and D2C demo seed for the FLOW record store.
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
--          'retail_customers',
--          'retail_catalog_items',
--          'retail_carts',
--          'retail_cart_items',
--          'retail_inventory_reservations',
--          'retail_orders',
--          'retail_order_items',
--          'retail_shipments',
--          'retail_returns',
--          'retail_refunds',
--          'retail_support_cases',
--          'retail_stock_subscriptions',
--          'retail_policy_rules'
--        )
--      GROUP BY "collection"
--      ORDER BY "collection";
--   3. Run against the same PostgreSQL database used by the records runtime.
--      This script writes to the shared `public` schema.
--      PowerShell example:
--      psql $env:DATABASE_URL -f .\scripts\seed-demo-retail-records.sql
--
-- Date note:
--   This file is aligned to Tuesday, August 25, 2026.
--   Orders dated 2026-08-22 through 2026-08-24 are intentionally in the past.
--   Estimated deliveries on 2026-08-28 and later are intentionally in the future.

BEGIN;

SET search_path TO public;

WITH params AS (
  SELECT
    '8285edc4-af68-46c0-9e72-5b2819cb33d9'::text AS tenant_id,
    'seed-demo-retail-records'::text AS source_tag
),
schemas (collection, schema_json) AS (
  VALUES
    (
      'retail_customers',
      '{
        "collection": "retail_customers",
        "fields": {
          "customer_id": { "type": "string", "required": true, "unique": true },
          "customer_name": { "type": "string", "required": false },
          "customer_mobile": { "type": "phone", "required": true, "unique": true },
          "customer_email": { "type": "email", "required": false },
          "loyalty_tier": { "type": "string", "required": false },
          "preferred_language": { "type": "string", "required": false },
          "city": { "type": "string", "required": false },
          "state": { "type": "string", "required": false }
        }
      }'::jsonb
    ),
    (
      'retail_catalog_items',
      '{
        "collection": "retail_catalog_items",
        "fields": {
          "catalog_item_id": { "type": "string", "required": true, "unique": true },
          "product_id": { "type": "string", "required": true },
          "variant_id": { "type": "string", "required": true, "unique": true },
          "sku": { "type": "string", "required": true, "unique": true },
          "product_name": { "type": "string", "required": true },
          "variant_name": { "type": "string", "required": false },
          "category": { "type": "string", "required": true },
          "subcategory": { "type": "string", "required": false },
          "product_type": { "type": "string", "required": false },
          "use_case": { "type": "string", "required": false },
          "brand": { "type": "string", "required": false },
          "colour": { "type": "string", "required": false },
          "size": { "type": "string", "required": false },
          "gender": { "type": "string", "required": false },
          "material": { "type": "string", "required": false },
          "feature_summary": { "type": "string", "required": false },
          "price_minor": { "type": "number", "required": true },
          "compare_price_minor": { "type": "number", "required": false },
          "rating_avg": { "type": "number", "required": false },
          "rating_count": { "type": "number", "required": false },
          "available_qty": { "type": "number", "required": true },
          "available_for_sale": { "type": "boolean", "required": true },
          "estimated_delivery_date": { "type": "string", "required": false },
          "return_window_days": { "type": "number", "required": false },
          "warranty_months": { "type": "number", "required": false },
          "active": { "type": "boolean", "required": true }
        }
      }'::jsonb
    ),
    (
      'retail_carts',
      '{
        "collection": "retail_carts",
        "fields": {
          "cart_id": { "type": "string", "required": true, "unique": true },
          "customer_id": { "type": "string", "required": false },
          "customer_mobile": { "type": "phone", "required": false },
          "status": { "type": "string", "required": true },
          "subtotal_minor": { "type": "number", "required": true },
          "discount_total_minor": { "type": "number", "required": false },
          "shipping_total_minor": { "type": "number", "required": false },
          "grand_total_minor": { "type": "number", "required": true },
          "item_count": { "type": "number", "required": true },
          "converted_order_id": { "type": "string", "required": false },
          "updated_at": { "type": "string", "required": false }
        }
      }'::jsonb
    ),
    (
      'retail_cart_items',
      '{
        "collection": "retail_cart_items",
        "fields": {
          "cart_item_id": { "type": "string", "required": true, "unique": true },
          "cart_id": { "type": "string", "required": true },
          "product_id": { "type": "string", "required": true },
          "variant_id": { "type": "string", "required": true },
          "sku": { "type": "string", "required": true },
          "product_name": { "type": "string", "required": true },
          "variant_name": { "type": "string", "required": false },
          "quantity": { "type": "number", "required": true },
          "unit_price_minor": { "type": "number", "required": true },
          "line_total_minor": { "type": "number", "required": true }
        }
      }'::jsonb
    ),
    (
      'retail_inventory_reservations',
      '{
        "collection": "retail_inventory_reservations",
        "fields": {
          "reservation_id": { "type": "string", "required": true, "unique": true },
          "reservation_key": { "type": "string", "required": true, "unique": true },
          "cart_id": { "type": "string", "required": true },
          "variant_id": { "type": "string", "required": true },
          "sku": { "type": "string", "required": true },
          "quantity": { "type": "number", "required": true },
          "status": { "type": "string", "required": true },
          "expires_at": { "type": "string", "required": true }
        }
      }'::jsonb
    ),
    (
      'retail_orders',
      '{
        "collection": "retail_orders",
        "fields": {
          "order_id": { "type": "string", "required": true, "unique": true },
          "order_number": { "type": "string", "required": true, "unique": true },
          "customer_id": { "type": "string", "required": false },
          "customer_mobile": { "type": "phone", "required": true },
          "customer_name": { "type": "string", "required": false },
          "status": { "type": "string", "required": true },
          "payment_status": { "type": "string", "required": true },
          "fulfillment_status": { "type": "string", "required": true },
          "grand_total_minor": { "type": "number", "required": true },
          "primary_item_name": { "type": "string", "required": false },
          "invoice_url": { "type": "url", "required": false },
          "delivery_address_summary": { "type": "string", "required": false },
          "order_date": { "type": "string", "required": true },
          "delivered_at": { "type": "string", "required": false }
        }
      }'::jsonb
    ),
    (
      'retail_order_items',
      '{
        "collection": "retail_order_items",
        "fields": {
          "order_item_id": { "type": "string", "required": true, "unique": true },
          "order_id": { "type": "string", "required": true },
          "order_number": { "type": "string", "required": true },
          "product_id": { "type": "string", "required": true },
          "variant_id": { "type": "string", "required": true },
          "sku": { "type": "string", "required": true },
          "product_name": { "type": "string", "required": true },
          "variant_name": { "type": "string", "required": false },
          "quantity": { "type": "number", "required": true },
          "unit_price_minor": { "type": "number", "required": true },
          "return_window_end": { "type": "string", "required": false },
          "warranty_end": { "type": "string", "required": false }
        }
      }'::jsonb
    ),
    (
      'retail_shipments',
      '{
        "collection": "retail_shipments",
        "fields": {
          "shipment_id": { "type": "string", "required": true, "unique": true },
          "order_id": { "type": "string", "required": true },
          "order_number": { "type": "string", "required": true },
          "carrier": { "type": "string", "required": true },
          "tracking_number": { "type": "string", "required": true },
          "status": { "type": "string", "required": true },
          "latest_event": { "type": "string", "required": false },
          "latest_event_at": { "type": "string", "required": false },
          "estimated_delivery_at": { "type": "string", "required": false }
        }
      }'::jsonb
    ),
    (
      'retail_returns',
      '{
        "collection": "retail_returns",
        "fields": {
          "return_id": { "type": "string", "required": true, "unique": true },
          "return_number": { "type": "string", "required": true, "unique": true },
          "order_id": { "type": "string", "required": true },
          "order_number": { "type": "string", "required": true },
          "order_item_id": { "type": "string", "required": true },
          "reason_code": { "type": "string", "required": true },
          "resolution_type": { "type": "string", "required": true },
          "status": { "type": "string", "required": true },
          "requested_at": { "type": "string", "required": true }
        }
      }'::jsonb
    ),
    (
      'retail_refunds',
      '{
        "collection": "retail_refunds",
        "fields": {
          "refund_id": { "type": "string", "required": true, "unique": true },
          "refund_number": { "type": "string", "required": true, "unique": true },
          "order_id": { "type": "string", "required": true },
          "order_number": { "type": "string", "required": true },
          "provider_reference": { "type": "string", "required": false },
          "amount_minor": { "type": "number", "required": true },
          "status": { "type": "string", "required": true },
          "processed_at": { "type": "string", "required": false },
          "expected_credit_window": { "type": "string", "required": false }
        }
      }'::jsonb
    ),
    (
      'retail_support_cases',
      '{
        "collection": "retail_support_cases",
        "fields": {
          "support_case_id": { "type": "string", "required": true, "unique": true },
          "case_number": { "type": "string", "required": true, "unique": true },
          "customer_mobile": { "type": "phone", "required": false },
          "order_number": { "type": "string", "required": false },
          "issue_type": { "type": "string", "required": true },
          "priority": { "type": "string", "required": true },
          "status": { "type": "string", "required": true },
          "summary": { "type": "string", "required": true },
          "queue_name": { "type": "string", "required": false }
        }
      }'::jsonb
    ),
    (
      'retail_stock_subscriptions',
      '{
        "collection": "retail_stock_subscriptions",
        "fields": {
          "subscription_id": { "type": "string", "required": true, "unique": true },
          "customer_mobile": { "type": "phone", "required": false },
          "product_id": { "type": "string", "required": true },
          "variant_id": { "type": "string", "required": true },
          "sku": { "type": "string", "required": true },
          "channel": { "type": "string", "required": true },
          "status": { "type": "string", "required": true }
        }
      }'::jsonb
    ),
    (
      'retail_policy_rules',
      '{
        "collection": "retail_policy_rules",
        "fields": {
          "policy_rule_id": { "type": "string", "required": true, "unique": true },
          "policy_type": { "type": "string", "required": true },
          "title": { "type": "string", "required": true },
          "summary": { "type": "string", "required": true },
          "status": { "type": "string", "required": true }
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
      'seed_retail_customer_rahul',
      'retail_customers',
      'customer_mobile',
      'phone:9000011111',
      jsonb_build_object(
        'customer_id', 'CUST-9000011111',
        'customer_name', 'Rahul Nair',
        'customer_mobile', '+919000011111',
        'customer_email', 'rahul.nair@example.store',
        'loyalty_tier', 'gold',
        'preferred_language', 'en',
        'city', 'Hyderabad',
        'state', 'Telangana'
      )
    ),
    (
      'seed_retail_customer_ananya',
      'retail_customers',
      'customer_mobile',
      'phone:9000022222',
      jsonb_build_object(
        'customer_id', 'CUST-9000022222',
        'customer_name', 'Ananya Shah',
        'customer_mobile', '+919000022222',
        'customer_email', 'ananya.shah@example.store',
        'loyalty_tier', 'standard',
        'preferred_language', 'en',
        'city', 'Hyderabad',
        'state', 'Telangana'
      )
    ),
    (
      'seed_retail_runpro_blk_uk9',
      'retail_catalog_items',
      'variant_id',
      'var-runpro-blk-uk9',
      jsonb_build_object(
        'catalog_item_id', 'CAT-RUNPRO-BLK-UK9',
        'product_id', 'PRD-RUNPRO',
        'variant_id', 'VAR-RUNPRO-BLK-UK9',
        'sku', 'RUNPRO-BLK-UK9',
        'product_name', 'Velocity Run Pro',
        'variant_name', 'Black / UK 9',
        'category', 'shoes',
        'subcategory', 'running',
        'product_type', 'running_shoes',
        'use_case', 'daily_running',
        'brand', 'Northstar Active',
        'colour', 'black',
        'size', 'UK 9',
        'gender', 'unisex',
        'material', 'mesh',
        'feature_summary', 'Lightweight mesh, cushioned sole, water resistant',
        'price_minor', 379900,
        'compare_price_minor', 449900,
        'rating_avg', 4.6,
        'rating_count', 842,
        'available_qty', 12,
        'available_for_sale', true,
        'estimated_delivery_date', '2026-08-28',
        'return_window_days', 7,
        'warranty_months', 0,
        'active', true
      )
    ),
    (
      'seed_retail_runpro_navy_uk9',
      'retail_catalog_items',
      'variant_id',
      'var-runpro-nvy-uk9',
      jsonb_build_object(
        'catalog_item_id', 'CAT-RUNPRO-NVY-UK9',
        'product_id', 'PRD-RUNPRO',
        'variant_id', 'VAR-RUNPRO-NVY-UK9',
        'sku', 'RUNPRO-NVY-UK9',
        'product_name', 'Velocity Run Pro',
        'variant_name', 'Navy / UK 9',
        'category', 'shoes',
        'subcategory', 'running',
        'product_type', 'running_shoes',
        'use_case', 'daily_running',
        'brand', 'Northstar Active',
        'colour', 'navy',
        'size', 'UK 9',
        'gender', 'unisex',
        'material', 'mesh',
        'feature_summary', 'Lightweight mesh, cushioned sole, water resistant',
        'price_minor', 379900,
        'compare_price_minor', 449900,
        'rating_avg', 4.6,
        'rating_count', 842,
        'available_qty', 0,
        'available_for_sale', true,
        'estimated_delivery_date', '2026-09-02',
        'return_window_days', 7,
        'warranty_months', 0,
        'active', true
      )
    ),
    (
      'seed_retail_trailgrip_blk_uk9',
      'retail_catalog_items',
      'variant_id',
      'var-trailgrip-blk-uk9',
      jsonb_build_object(
        'catalog_item_id', 'CAT-TRAIL-BLK-UK9',
        'product_id', 'PRD-TRAILGRIP',
        'variant_id', 'VAR-TRAIL-BLK-UK9',
        'sku', 'TRAIL-BLK-UK9',
        'product_name', 'TrailGrip Max',
        'variant_name', 'Black / UK 9',
        'category', 'shoes',
        'subcategory', 'running',
        'product_type', 'trail_shoes',
        'use_case', 'trail',
        'brand', 'Northstar Active',
        'colour', 'black',
        'size', 'UK 9',
        'gender', 'unisex',
        'material', 'ripstop',
        'feature_summary', 'Trail grip outsole, reinforced toe, waterproof upper',
        'price_minor', 419900,
        'compare_price_minor', 499900,
        'rating_avg', 4.5,
        'rating_count', 511,
        'available_qty', 4,
        'available_for_sale', true,
        'estimated_delivery_date', '2026-08-29',
        'return_window_days', 7,
        'warranty_months', 0,
        'active', true
      )
    ),
    (
      'seed_retail_soundpro_blk',
      'retail_catalog_items',
      'variant_id',
      'var-soundpro-blk',
      jsonb_build_object(
        'catalog_item_id', 'CAT-SOUNDPRO-BLK',
        'product_id', 'PRD-SOUNDPRO-ANC45',
        'variant_id', 'VAR-SOUNDPRO-BLK',
        'sku', 'SOUNDPRO-ANC45-BLK',
        'product_name', 'SoundPro ANC 45',
        'variant_name', 'Black',
        'category', 'audio',
        'subcategory', 'headphones',
        'product_type', 'headphones',
        'use_case', 'travel',
        'brand', 'SoundPro',
        'colour', 'black',
        'size', '',
        'gender', 'unisex',
        'material', 'polycarbonate',
        'feature_summary', 'ANC, clear call microphone, lightweight travel fit',
        'price_minor', 649900,
        'compare_price_minor', 749900,
        'rating_avg', 4.7,
        'rating_count', 1291,
        'available_qty', 18,
        'available_for_sale', true,
        'estimated_delivery_date', '2026-08-27',
        'return_window_days', 7,
        'warranty_months', 12,
        'active', true
      )
    ),
    (
      'seed_retail_airbeat_blue',
      'retail_catalog_items',
      'variant_id',
      'var-airbeat-blue',
      jsonb_build_object(
        'catalog_item_id', 'CAT-AIRBEAT-BLU',
        'product_id', 'PRD-AIRBEAT-WORK',
        'variant_id', 'VAR-AIRBEAT-BLU',
        'sku', 'AIRBEAT-WORK-BLU',
        'product_name', 'AirBeat Work+',
        'variant_name', 'Blue',
        'category', 'audio',
        'subcategory', 'headphones',
        'product_type', 'headphones',
        'use_case', 'office_calls',
        'brand', 'AirBeat',
        'colour', 'blue',
        'size', '',
        'gender', 'unisex',
        'material', 'polycarbonate',
        'feature_summary', 'Dual mic ENC, light clamp force, all-day comfort',
        'price_minor', 599900,
        'compare_price_minor', 699900,
        'rating_avg', 4.4,
        'rating_count', 754,
        'available_qty', 11,
        'available_for_sale', true,
        'estimated_delivery_date', '2026-08-27',
        'return_window_days', 7,
        'warranty_months', 12,
        'active', true
      )
    ),
    (
      'seed_retail_shirt_black_m',
      'retail_catalog_items',
      'variant_id',
      'var-shirt-black-m',
      jsonb_build_object(
        'catalog_item_id', 'CAT-SHIRT-BLK-M',
        'product_id', 'PRD-OFFICE-SHIRT',
        'variant_id', 'VAR-SHIRT-BLK-M',
        'sku', 'OFFICE-SHIRT-BLK-M',
        'product_name', 'Executive Formal Shirt',
        'variant_name', 'Black / M',
        'category', 'apparel',
        'subcategory', 'shirts',
        'product_type', 'shirt',
        'use_case', 'office',
        'brand', 'TailorGrid',
        'colour', 'black',
        'size', 'M',
        'gender', 'men',
        'material', 'cotton blend',
        'feature_summary', 'Wrinkle-resistant, slim fit, office-ready finish',
        'price_minor', 189900,
        'compare_price_minor', 229900,
        'rating_avg', 4.3,
        'rating_count', 405,
        'available_qty', 21,
        'available_for_sale', true,
        'estimated_delivery_date', '2026-08-28',
        'return_window_days', 7,
        'warranty_months', 0,
        'active', true
      )
    ),
    (
      'seed_retail_cart_rahul',
      'retail_carts',
      'cart_id',
      'cart-9000011111',
      jsonb_build_object(
        'cart_id', 'CART-9000011111',
        'customer_id', 'CUST-9000011111',
        'customer_mobile', '+919000011111',
        'status', 'active',
        'subtotal_minor', 649900,
        'discount_total_minor', 0,
        'shipping_total_minor', 0,
        'grand_total_minor', 649900,
        'item_count', 1,
        'converted_order_id', '',
        'updated_at', '2026-08-25T09:00:00.000Z'
      )
    ),
    (
      'seed_retail_cart_item_rahul',
      'retail_cart_items',
      'cart_item_id',
      'cart-9000011111:var-soundpro-blk',
      jsonb_build_object(
        'cart_item_id', 'CART-9000011111:VAR-SOUNDPRO-BLK',
        'cart_id', 'CART-9000011111',
        'product_id', 'PRD-SOUNDPRO-ANC45',
        'variant_id', 'VAR-SOUNDPRO-BLK',
        'sku', 'SOUNDPRO-ANC45-BLK',
        'product_name', 'SoundPro ANC 45',
        'variant_name', 'Black',
        'quantity', 1,
        'unit_price_minor', 649900,
        'line_total_minor', 649900
      )
    ),
    (
      'seed_retail_reservation_rahul',
      'retail_inventory_reservations',
      'reservation_id',
      'rsv-cart-9000011111',
      jsonb_build_object(
        'reservation_id', 'RSV-CART-9000011111',
        'reservation_key', 'RSV-CART-9000011111',
        'cart_id', 'CART-9000011111',
        'variant_id', 'VAR-SOUNDPRO-BLK',
        'sku', 'SOUNDPRO-ANC45-BLK',
        'quantity', 1,
        'status', 'active',
        'expires_at', '2026-08-25T12:15:00.000Z'
      )
    ),
    (
      'seed_retail_order_49280',
      'retail_orders',
      'order_number',
      'cr-49280',
      jsonb_build_object(
        'order_id', 'ORD-49280',
        'order_number', 'CR-49280',
        'customer_id', 'CUST-9000011111',
        'customer_mobile', '+919000011111',
        'customer_name', 'Rahul Nair',
        'status', 'confirmed',
        'payment_status', 'paid',
        'fulfillment_status', 'out_for_delivery',
        'grand_total_minor', 649900,
        'primary_item_name', 'SoundPro ANC 45',
        'invoice_url', 'https://shop.example.com/invoice/CR-49280',
        'delivery_address_summary', 'Gachibowli, Hyderabad, Telangana',
        'order_date', '2026-08-22',
        'delivered_at', ''
      )
    ),
    (
      'seed_retail_order_48910',
      'retail_orders',
      'order_number',
      'cr-48910',
      jsonb_build_object(
        'order_id', 'ORD-48910',
        'order_number', 'CR-48910',
        'customer_id', 'CUST-9000011111',
        'customer_mobile', '+919000011111',
        'customer_name', 'Rahul Nair',
        'status', 'delivered',
        'payment_status', 'paid',
        'fulfillment_status', 'delivered',
        'grand_total_minor', 379900,
        'primary_item_name', 'Velocity Run Pro',
        'invoice_url', 'https://shop.example.com/invoice/CR-48910',
        'delivery_address_summary', 'Gachibowli, Hyderabad, Telangana',
        'order_date', '2026-08-21',
        'delivered_at', '2026-08-23T14:30:00.000Z'
      )
    ),
    (
      'seed_retail_order_48850',
      'retail_orders',
      'order_number',
      'cr-48850',
      jsonb_build_object(
        'order_id', 'ORD-48850',
        'order_number', 'CR-48850',
        'customer_id', 'CUST-9000022222',
        'customer_mobile', '+919000022222',
        'customer_name', 'Ananya Shah',
        'status', 'confirmed',
        'payment_status', 'paid',
        'fulfillment_status', 'processing',
        'grand_total_minor', 189900,
        'primary_item_name', 'Executive Formal Shirt',
        'invoice_url', 'https://shop.example.com/invoice/CR-48850',
        'delivery_address_summary', 'Madhapur, Hyderabad, Telangana',
        'order_date', '2026-08-24',
        'delivered_at', ''
      )
    ),
    (
      'seed_retail_order_48770',
      'retail_orders',
      'order_number',
      'cr-48770',
      jsonb_build_object(
        'order_id', 'ORD-48770',
        'order_number', 'CR-48770',
        'customer_id', 'CUST-9000011111',
        'customer_mobile', '+919000011111',
        'customer_name', 'Rahul Nair',
        'status', 'returned',
        'payment_status', 'refunded',
        'fulfillment_status', 'delivered',
        'grand_total_minor', 249900,
        'primary_item_name', 'PulseBuds Lite',
        'invoice_url', 'https://shop.example.com/invoice/CR-48770',
        'delivery_address_summary', 'Gachibowli, Hyderabad, Telangana',
        'order_date', '2026-08-18',
        'delivered_at', '2026-08-20T16:00:00.000Z'
      )
    ),
    (
      'seed_retail_order_item_49280',
      'retail_order_items',
      'order_item_id',
      'ord-49280:1',
      jsonb_build_object(
        'order_item_id', 'ORD-49280:1',
        'order_id', 'ORD-49280',
        'order_number', 'CR-49280',
        'product_id', 'PRD-SOUNDPRO-ANC45',
        'variant_id', 'VAR-SOUNDPRO-BLK',
        'sku', 'SOUNDPRO-ANC45-BLK',
        'product_name', 'SoundPro ANC 45',
        'variant_name', 'Black',
        'quantity', 1,
        'unit_price_minor', 649900,
        'return_window_end', '2026-09-01',
        'warranty_end', '2027-08-22'
      )
    ),
    (
      'seed_retail_order_item_48910',
      'retail_order_items',
      'order_item_id',
      'ord-48910:1',
      jsonb_build_object(
        'order_item_id', 'ORD-48910:1',
        'order_id', 'ORD-48910',
        'order_number', 'CR-48910',
        'product_id', 'PRD-RUNPRO',
        'variant_id', 'VAR-RUNPRO-BLK-UK9',
        'sku', 'RUNPRO-BLK-UK9',
        'product_name', 'Velocity Run Pro',
        'variant_name', 'Black / UK 9',
        'quantity', 1,
        'unit_price_minor', 379900,
        'return_window_end', '2026-08-30',
        'warranty_end', ''
      )
    ),
    (
      'seed_retail_order_item_48850',
      'retail_order_items',
      'order_item_id',
      'ord-48850:1',
      jsonb_build_object(
        'order_item_id', 'ORD-48850:1',
        'order_id', 'ORD-48850',
        'order_number', 'CR-48850',
        'product_id', 'PRD-OFFICE-SHIRT',
        'variant_id', 'VAR-SHIRT-BLK-M',
        'sku', 'OFFICE-SHIRT-BLK-M',
        'product_name', 'Executive Formal Shirt',
        'variant_name', 'Black / M',
        'quantity', 1,
        'unit_price_minor', 189900,
        'return_window_end', '2026-09-03',
        'warranty_end', ''
      )
    ),
    (
      'seed_retail_order_item_48770',
      'retail_order_items',
      'order_item_id',
      'ord-48770:1',
      jsonb_build_object(
        'order_item_id', 'ORD-48770:1',
        'order_id', 'ORD-48770',
        'order_number', 'CR-48770',
        'product_id', 'PRD-PULSEBUDS-LITE',
        'variant_id', 'VAR-PULSEBUDS-WHT',
        'sku', 'PULSEBUDS-WHT',
        'product_name', 'PulseBuds Lite',
        'variant_name', 'White',
        'quantity', 1,
        'unit_price_minor', 249900,
        'return_window_end', '2026-08-27',
        'warranty_end', '2027-08-18'
      )
    ),
    (
      'seed_retail_shipment_49280',
      'retail_shipments',
      'shipment_id',
      'shp-49280',
      jsonb_build_object(
        'shipment_id', 'SHP-49280',
        'order_id', 'ORD-49280',
        'order_number', 'CR-49280',
        'carrier', 'Delhivery',
        'tracking_number', 'DLV-CR-49280',
        'status', 'out_for_delivery',
        'latest_event', 'Arrived at Hyderabad delivery centre and moved out for delivery',
        'latest_event_at', '2026-08-25T08:10:00.000Z',
        'estimated_delivery_at', '2026-08-25T20:00:00.000Z'
      )
    ),
    (
      'seed_retail_shipment_48910',
      'retail_shipments',
      'shipment_id',
      'shp-48910',
      jsonb_build_object(
        'shipment_id', 'SHP-48910',
        'order_id', 'ORD-48910',
        'order_number', 'CR-48910',
        'carrier', 'Blue Dart',
        'tracking_number', 'BD-CR-48910',
        'status', 'delivered',
        'latest_event', 'Delivered to customer',
        'latest_event_at', '2026-08-23T14:30:00.000Z',
        'estimated_delivery_at', '2026-08-23T14:30:00.000Z'
      )
    ),
    (
      'seed_retail_shipment_48850',
      'retail_shipments',
      'shipment_id',
      'shp-48850',
      jsonb_build_object(
        'shipment_id', 'SHP-48850',
        'order_id', 'ORD-48850',
        'order_number', 'CR-48850',
        'carrier', 'Ecom Express',
        'tracking_number', 'ECOM-CR-48850',
        'status', 'processing',
        'latest_event', 'Order allocated to warehouse',
        'latest_event_at', '2026-08-24T19:20:00.000Z',
        'estimated_delivery_at', '2026-08-28T20:00:00.000Z'
      )
    ),
    (
      'seed_retail_return_48770',
      'retail_returns',
      'return_number',
      'rt-48770',
      jsonb_build_object(
        'return_id', 'RET-48770',
        'return_number', 'RT-48770',
        'order_id', 'ORD-48770',
        'order_number', 'CR-48770',
        'order_item_id', 'ORD-48770:1',
        'reason_code', 'damaged',
        'resolution_type', 'refund',
        'status', 'completed',
        'requested_at', '2026-08-22T10:15:00.000Z'
      )
    ),
    (
      'seed_retail_refund_48770',
      'retail_refunds',
      'refund_number',
      'rf-938271',
      jsonb_build_object(
        'refund_id', 'REF-938271',
        'refund_number', 'RF-938271',
        'order_id', 'ORD-48770',
        'order_number', 'CR-48770',
        'provider_reference', 'RF938271',
        'amount_minor', 249900,
        'status', 'processed',
        'processed_at', '2026-08-24T11:10:00.000Z',
        'expected_credit_window', '3-7 business days'
      )
    ),
    (
      'seed_retail_support_case_delivery',
      'retail_support_cases',
      'case_number',
      'sc-49280',
      jsonb_build_object(
        'support_case_id', 'CASE-49280',
        'case_number', 'SC-49280',
        'customer_mobile', '+919000011111',
        'order_number', 'CR-49280',
        'issue_type', 'delivery_issue',
        'priority', 'high',
        'status', 'open',
        'summary', 'Customer reported delivered-but-not-received investigation request.',
        'queue_name', 'retail_exceptions'
      )
    ),
    (
      'seed_retail_stock_subscription',
      'retail_stock_subscriptions',
      'subscription_id',
      'var-runpro-nvy-uk9:+919000011111',
      jsonb_build_object(
        'subscription_id', 'VAR-RUNPRO-NVY-UK9:+919000011111',
        'customer_mobile', '+919000011111',
        'product_id', 'PRD-RUNPRO',
        'variant_id', 'VAR-RUNPRO-NVY-UK9',
        'sku', 'RUNPRO-NVY-UK9',
        'channel', 'whatsapp',
        'status', 'active'
      )
    ),
    (
      'seed_retail_policy_return',
      'retail_policy_rules',
      'policy_rule_id',
      'policy-return',
      jsonb_build_object(
        'policy_rule_id', 'POLICY-RETURN',
        'policy_type', 'return',
        'title', '7-day return policy',
        'summary', 'Most apparel, footwear, and electronics items are returnable within 7 days of delivery when unused and complete with original packaging.',
        'status', 'active'
      )
    ),
    (
      'seed_retail_policy_exchange',
      'retail_policy_rules',
      'policy_rule_id',
      'policy-exchange',
      jsonb_build_object(
        'policy_rule_id', 'POLICY-EXCHANGE',
        'policy_type', 'exchange',
        'title', 'Exchange policy',
        'summary', 'Eligible items can be exchanged for another size or colour when replacement inventory is available. If not, refund or back-in-stock follow-up is offered.',
        'status', 'active'
      )
    ),
    (
      'seed_retail_policy_shipping',
      'retail_policy_rules',
      'policy_rule_id',
      'policy-shipping',
      jsonb_build_object(
        'policy_rule_id', 'POLICY-SHIPPING',
        'policy_type', 'shipping',
        'title', 'Shipping charges',
        'summary', 'Orders above INR 5,000 ship free. Lower-value prepaid orders currently carry a flat INR 499 shipping fee in this demo dataset.',
        'status', 'active'
      )
    ),
    (
      'seed_retail_policy_refund',
      'retail_policy_rules',
      'policy_rule_id',
      'policy-refund',
      jsonb_build_object(
        'policy_rule_id', 'POLICY-REFUND',
        'policy_type', 'refund',
        'title', 'Refund timelines',
        'summary', 'Once a refund is processed, banks typically reflect the credit in 3 to 7 business days depending on the original payment method and provider.',
        'status', 'active'
      )
    ),
    (
      'seed_retail_policy_warranty',
      'retail_policy_rules',
      'policy_rule_id',
      'policy-warranty',
      jsonb_build_object(
        'policy_rule_id', 'POLICY-WARRANTY',
        'policy_type', 'warranty',
        'title', 'Electronics warranty',
        'summary', 'Eligible audio devices carry a 12-month warranty from delivery date against manufacturing defects. Physical damage and water ingress are excluded.',
        'status', 'active'
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
      WHEN kv.key = 'customer_mobile'
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
  COUNT(*) FILTER (WHERE seed_records.collection = 'retail_catalog_items') AS catalog_records_seeded,
  COUNT(*) FILTER (WHERE seed_records.collection = 'retail_orders') AS order_records_seeded,
  COUNT(*) FILTER (WHERE seed_records.collection = 'retail_shipments') AS shipment_records_seeded,
  COUNT(*) FILTER (WHERE seed_records.collection = 'retail_customers') AS customer_records_seeded
FROM params
CROSS JOIN seed_records
GROUP BY params.tenant_id;

COMMIT;

-- Suggested verification after the commit:
-- SELECT "collection", COUNT(*)
-- FROM "flow_records"
-- WHERE "tenantId" = '8285edc4-af68-46c0-9e72-5b2819cb33d9'
--   AND "collection" IN (
--     'retail_customers',
--     'retail_catalog_items',
--     'retail_carts',
--     'retail_cart_items',
--     'retail_inventory_reservations',
--     'retail_orders',
--     'retail_order_items',
--     'retail_shipments',
--     'retail_returns',
--     'retail_refunds',
--     'retail_support_cases',
--     'retail_stock_subscriptions',
--     'retail_policy_rules'
--   )
-- GROUP BY "collection"
-- ORDER BY "collection";
--
-- SELECT
--   "dataJson"->>'order_number' AS order_number,
--   "dataJson"->>'primary_item_name' AS primary_item_name,
--   "dataJson"->>'status' AS status,
--   "dataJson"->>'payment_status' AS payment_status,
--   "dataJson"->>'fulfillment_status' AS fulfillment_status
-- FROM "flow_records"
-- WHERE "tenantId" = '8285edc4-af68-46c0-9e72-5b2819cb33d9'
--   AND "collection" = 'retail_orders'
-- ORDER BY "dataJson"->>'order_number';
