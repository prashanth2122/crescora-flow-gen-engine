-- Retail commerce reference schemas for the FLOW record store.
-- This defines a dedicated set of `retail_reference_*` collections inside:
--   flow_record_schemas
--
-- How to run safely:
--   1. Replace the tenant_id value in the params CTE below.
--   2. Run this before `seed-demo-retail-commerce-reference-data.sql`.

BEGIN;

SET search_path TO public;

WITH params AS (
  SELECT
    '8285edc4-af68-46c0-9e72-5b2819cb33d9'::text AS tenant_id
),
schemas (collection, schema_json) AS (
  VALUES
    (
      'retail_reference_tenants',
      $${
        "collection": "retail_reference_tenants",
        "fields": {
          "tenant_id": { "type": "string", "required": true, "unique": true },
          "tenant_name": { "type": "string", "required": true },
          "base_currency": { "type": "string", "required": true },
          "timezone": { "type": "string", "required": true },
          "created_at": { "type": "string", "required": false }
        }
      }$$::jsonb
    ),
    (
      'retail_reference_customers',
      $${
        "collection": "retail_reference_customers",
        "fields": {
          "customer_id": { "type": "string", "required": true, "unique": true },
          "tenant_id": { "type": "string", "required": true },
          "full_name": { "type": "string", "required": false },
          "mobile_e164": { "type": "phone", "required": true },
          "email": { "type": "email", "required": false },
          "loyalty_tier": { "type": "string", "required": false },
          "preferred_language": { "type": "string", "required": false },
          "created_at": { "type": "string", "required": false }
        }
      }$$::jsonb
    ),
    (
      'retail_reference_categories',
      $${
        "collection": "retail_reference_categories",
        "fields": {
          "category_id": { "type": "string", "required": true, "unique": true },
          "tenant_id": { "type": "string", "required": true },
          "parent_category_id": { "type": "string", "required": false },
          "category_name": { "type": "string", "required": true },
          "slug": { "type": "string", "required": true },
          "status": { "type": "string", "required": true }
        }
      }$$::jsonb
    ),
    (
      'retail_reference_brands',
      $${
        "collection": "retail_reference_brands",
        "fields": {
          "brand_id": { "type": "string", "required": true, "unique": true },
          "tenant_id": { "type": "string", "required": true },
          "brand_name": { "type": "string", "required": true },
          "slug": { "type": "string", "required": true },
          "status": { "type": "string", "required": true }
        }
      }$$::jsonb
    ),
    (
      'retail_reference_products',
      $${
        "collection": "retail_reference_products",
        "fields": {
          "product_id": { "type": "string", "required": true, "unique": true },
          "tenant_id": { "type": "string", "required": true },
          "category_id": { "type": "string", "required": true },
          "brand_id": { "type": "string", "required": false },
          "slug": { "type": "string", "required": true },
          "product_name": { "type": "string", "required": true },
          "short_description": { "type": "string", "required": false },
          "product_type": { "type": "string", "required": false },
          "status": { "type": "string", "required": true },
          "rating_avg": { "type": "number", "required": false },
          "rating_count": { "type": "number", "required": false },
          "created_at": { "type": "string", "required": false },
          "updated_at": { "type": "string", "required": false }
        }
      }$$::jsonb
    ),
    (
      'retail_reference_product_variants',
      $${
        "collection": "retail_reference_product_variants",
        "fields": {
          "variant_id": { "type": "string", "required": true, "unique": true },
          "tenant_id": { "type": "string", "required": true },
          "product_id": { "type": "string", "required": true },
          "sku": { "type": "string", "required": true },
          "barcode": { "type": "string", "required": false },
          "variant_name": { "type": "string", "required": false },
          "colour": { "type": "string", "required": false },
          "size_label": { "type": "string", "required": false },
          "material": { "type": "string", "required": false },
          "status": { "type": "string", "required": true },
          "weight_grams": { "type": "number", "required": false },
          "created_at": { "type": "string", "required": false },
          "updated_at": { "type": "string", "required": false }
        }
      }$$::jsonb
    ),
    (
      'retail_reference_warehouses',
      $${
        "collection": "retail_reference_warehouses",
        "fields": {
          "warehouse_id": { "type": "string", "required": true, "unique": true },
          "tenant_id": { "type": "string", "required": true },
          "warehouse_name": { "type": "string", "required": true },
          "location_code": { "type": "string", "required": true },
          "city": { "type": "string", "required": false },
          "state": { "type": "string", "required": false },
          "postal_code": { "type": "string", "required": false },
          "status": { "type": "string", "required": true }
        }
      }$$::jsonb
    ),
    (
      'retail_reference_inventory_balances',
      $${
        "collection": "retail_reference_inventory_balances",
        "fields": {
          "inventory_balance_key": { "type": "string", "required": true, "unique": true },
          "tenant_id": { "type": "string", "required": true },
          "warehouse_id": { "type": "string", "required": true },
          "variant_id": { "type": "string", "required": true },
          "on_hand_qty": { "type": "number", "required": true },
          "reserved_qty": { "type": "number", "required": true },
          "available_qty": { "type": "number", "required": true },
          "safety_stock_qty": { "type": "number", "required": true },
          "version": { "type": "number", "required": true },
          "updated_at": { "type": "string", "required": false }
        }
      }$$::jsonb
    ),
    (
      'retail_reference_carts',
      $${
        "collection": "retail_reference_carts",
        "fields": {
          "cart_id": { "type": "string", "required": true, "unique": true },
          "tenant_id": { "type": "string", "required": true },
          "customer_id": { "type": "string", "required": false },
          "session_id": { "type": "string", "required": false },
          "currency": { "type": "string", "required": true },
          "status": { "type": "string", "required": true },
          "subtotal_minor": { "type": "number", "required": true },
          "discount_total_minor": { "type": "number", "required": true },
          "shipping_total_minor": { "type": "number", "required": true },
          "grand_total_minor": { "type": "number", "required": true },
          "coupon_code": { "type": "string", "required": false },
          "expires_at": { "type": "string", "required": false },
          "converted_order_id": { "type": "string", "required": false },
          "created_at": { "type": "string", "required": false },
          "updated_at": { "type": "string", "required": false }
        }
      }$$::jsonb
    ),
    (
      'retail_reference_cart_items',
      $${
        "collection": "retail_reference_cart_items",
        "fields": {
          "cart_item_id": { "type": "string", "required": true, "unique": true },
          "tenant_id": { "type": "string", "required": true },
          "cart_id": { "type": "string", "required": true },
          "product_id": { "type": "string", "required": true },
          "variant_id": { "type": "string", "required": true },
          "quantity": { "type": "number", "required": true },
          "unit_price_minor": { "type": "number", "required": true },
          "line_total_minor": { "type": "number", "required": true },
          "created_at": { "type": "string", "required": false },
          "updated_at": { "type": "string", "required": false }
        }
      }$$::jsonb
    ),
    (
      'retail_reference_inventory_reservations',
      $${
        "collection": "retail_reference_inventory_reservations",
        "fields": {
          "reservation_id": { "type": "string", "required": true, "unique": true },
          "tenant_id": { "type": "string", "required": true },
          "reservation_key": { "type": "string", "required": true },
          "variant_id": { "type": "string", "required": true },
          "warehouse_id": { "type": "string", "required": true },
          "cart_id": { "type": "string", "required": false },
          "order_id": { "type": "string", "required": false },
          "quantity": { "type": "number", "required": true },
          "status": { "type": "string", "required": true },
          "expires_at": { "type": "string", "required": true },
          "created_at": { "type": "string", "required": false },
          "updated_at": { "type": "string", "required": false }
        }
      }$$::jsonb
    ),
    (
      'retail_reference_orders',
      $${
        "collection": "retail_reference_orders",
        "fields": {
          "order_id": { "type": "string", "required": true, "unique": true },
          "tenant_id": { "type": "string", "required": true },
          "order_number": { "type": "string", "required": true },
          "customer_id": { "type": "string", "required": false },
          "cart_id": { "type": "string", "required": false },
          "status": { "type": "string", "required": true },
          "payment_status": { "type": "string", "required": true },
          "fulfillment_status": { "type": "string", "required": true },
          "currency": { "type": "string", "required": true },
          "subtotal_minor": { "type": "number", "required": true },
          "discount_total_minor": { "type": "number", "required": true },
          "shipping_total_minor": { "type": "number", "required": true },
          "grand_total_minor": { "type": "number", "required": true },
          "refunded_total_minor": { "type": "number", "required": true },
          "placed_at": { "type": "string", "required": true },
          "delivered_at": { "type": "string", "required": false },
          "created_at": { "type": "string", "required": false },
          "updated_at": { "type": "string", "required": false }
        }
      }$$::jsonb
    ),
    (
      'retail_reference_order_items',
      $${
        "collection": "retail_reference_order_items",
        "fields": {
          "order_item_id": { "type": "string", "required": true, "unique": true },
          "tenant_id": { "type": "string", "required": true },
          "order_id": { "type": "string", "required": true },
          "product_id": { "type": "string", "required": true },
          "variant_id": { "type": "string", "required": true },
          "sku_snapshot": { "type": "string", "required": true },
          "product_name_snapshot": { "type": "string", "required": true },
          "variant_name_snapshot": { "type": "string", "required": false },
          "quantity": { "type": "number", "required": true },
          "unit_price_minor": { "type": "number", "required": true },
          "line_total_minor": { "type": "number", "required": true },
          "fulfilled_qty": { "type": "number", "required": true },
          "cancelled_qty": { "type": "number", "required": true },
          "returned_qty": { "type": "number", "required": true },
          "refunded_qty": { "type": "number", "required": true },
          "created_at": { "type": "string", "required": false }
        }
      }$$::jsonb
    ),
    (
      'retail_reference_payments',
      $${
        "collection": "retail_reference_payments",
        "fields": {
          "payment_id": { "type": "string", "required": true, "unique": true },
          "tenant_id": { "type": "string", "required": true },
          "order_id": { "type": "string", "required": true },
          "provider": { "type": "string", "required": true },
          "provider_payment_id": { "type": "string", "required": true },
          "payment_method": { "type": "string", "required": true },
          "amount_minor": { "type": "number", "required": true },
          "currency": { "type": "string", "required": true },
          "status": { "type": "string", "required": true },
          "authorized_at": { "type": "string", "required": false },
          "captured_at": { "type": "string", "required": false },
          "created_at": { "type": "string", "required": false }
        }
      }$$::jsonb
    ),
    (
      'retail_reference_shipments',
      $${
        "collection": "retail_reference_shipments",
        "fields": {
          "shipment_id": { "type": "string", "required": true, "unique": true },
          "tenant_id": { "type": "string", "required": true },
          "order_id": { "type": "string", "required": true },
          "warehouse_id": { "type": "string", "required": false },
          "carrier": { "type": "string", "required": true },
          "tracking_number": { "type": "string", "required": true },
          "status": { "type": "string", "required": true },
          "estimated_delivery_at": { "type": "string", "required": false },
          "shipped_at": { "type": "string", "required": false },
          "delivered_at": { "type": "string", "required": false },
          "created_at": { "type": "string", "required": false },
          "updated_at": { "type": "string", "required": false }
        }
      }$$::jsonb
    ),
    (
      'retail_reference_shipment_events',
      $${
        "collection": "retail_reference_shipment_events",
        "fields": {
          "shipment_event_id": { "type": "string", "required": true, "unique": true },
          "tenant_id": { "type": "string", "required": true },
          "shipment_id": { "type": "string", "required": true },
          "event_code": { "type": "string", "required": true },
          "event_status": { "type": "string", "required": true },
          "location": { "type": "string", "required": false },
          "event_at": { "type": "string", "required": true },
          "created_at": { "type": "string", "required": false }
        }
      }$$::jsonb
    ),
    (
      'retail_reference_returns',
      $${
        "collection": "retail_reference_returns",
        "fields": {
          "return_id": { "type": "string", "required": true, "unique": true },
          "tenant_id": { "type": "string", "required": true },
          "return_number": { "type": "string", "required": true },
          "order_id": { "type": "string", "required": true },
          "customer_id": { "type": "string", "required": false },
          "status": { "type": "string", "required": true },
          "reason_category": { "type": "string", "required": true },
          "resolution_type": { "type": "string", "required": true },
          "requested_at": { "type": "string", "required": true },
          "completed_at": { "type": "string", "required": false },
          "created_at": { "type": "string", "required": false },
          "updated_at": { "type": "string", "required": false }
        }
      }$$::jsonb
    ),
    (
      'retail_reference_return_items',
      $${
        "collection": "retail_reference_return_items",
        "fields": {
          "return_item_id": { "type": "string", "required": true, "unique": true },
          "tenant_id": { "type": "string", "required": true },
          "return_id": { "type": "string", "required": true },
          "order_item_id": { "type": "string", "required": true },
          "quantity": { "type": "number", "required": true },
          "reason_code": { "type": "string", "required": true },
          "resolution": { "type": "string", "required": true },
          "approved_quantity": { "type": "number", "required": true },
          "received_quantity": { "type": "number", "required": true },
          "created_at": { "type": "string", "required": false }
        }
      }$$::jsonb
    ),
    (
      'retail_reference_refunds',
      $${
        "collection": "retail_reference_refunds",
        "fields": {
          "refund_id": { "type": "string", "required": true, "unique": true },
          "tenant_id": { "type": "string", "required": true },
          "refund_number": { "type": "string", "required": true },
          "order_id": { "type": "string", "required": true },
          "return_id": { "type": "string", "required": false },
          "payment_id": { "type": "string", "required": false },
          "provider_refund_id": { "type": "string", "required": true },
          "amount_minor": { "type": "number", "required": true },
          "currency": { "type": "string", "required": true },
          "reason_code": { "type": "string", "required": false },
          "status": { "type": "string", "required": true },
          "requested_at": { "type": "string", "required": true },
          "processed_at": { "type": "string", "required": false },
          "created_at": { "type": "string", "required": false }
        }
      }$$::jsonb
    ),
    (
      'retail_reference_stock_subscriptions',
      $${
        "collection": "retail_reference_stock_subscriptions",
        "fields": {
          "subscription_id": { "type": "string", "required": true, "unique": true },
          "tenant_id": { "type": "string", "required": true },
          "customer_id": { "type": "string", "required": false },
          "variant_id": { "type": "string", "required": true },
          "channel": { "type": "string", "required": true },
          "destination": { "type": "string", "required": true },
          "status": { "type": "string", "required": true },
          "created_at": { "type": "string", "required": false },
          "notified_at": { "type": "string", "required": false }
        }
      }$$::jsonb
    ),
    (
      'retail_reference_support_cases',
      $${
        "collection": "retail_reference_support_cases",
        "fields": {
          "support_case_id": { "type": "string", "required": true, "unique": true },
          "tenant_id": { "type": "string", "required": true },
          "case_number": { "type": "string", "required": true },
          "customer_id": { "type": "string", "required": false },
          "order_id": { "type": "string", "required": false },
          "category": { "type": "string", "required": true },
          "subcategory": { "type": "string", "required": false },
          "priority": { "type": "string", "required": true },
          "status": { "type": "string", "required": true },
          "queue_name": { "type": "string", "required": false },
          "summary": { "type": "string", "required": true },
          "customer_message": { "type": "string", "required": false },
          "created_at": { "type": "string", "required": false },
          "updated_at": { "type": "string", "required": false }
        }
      }$$::jsonb
    ),
    (
      'retail_reference_policy_rules',
      $${
        "collection": "retail_reference_policy_rules",
        "fields": {
          "policy_rule_id": { "type": "string", "required": true, "unique": true },
          "tenant_id": { "type": "string", "required": true },
          "policy_type": { "type": "string", "required": true },
          "policy_name": { "type": "string", "required": true },
          "priority": { "type": "number", "required": true },
          "effective_from": { "type": "string", "required": false },
          "effective_to": { "type": "string", "required": false },
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
)
SELECT
  params.tenant_id AS schema_tenant_id,
  COUNT(*) AS collections_defined
FROM params
CROSS JOIN schemas
GROUP BY params.tenant_id;

COMMIT;

-- Suggested verification after the commit:
-- SELECT "collection"
-- FROM "flow_record_schemas"
-- WHERE "tenantId" = '8285edc4-af68-46c0-9e72-5b2819cb33d9'
--   AND "collection" LIKE 'retail_reference_%'
-- ORDER BY "collection";
