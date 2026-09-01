-- Retail commerce reference data for the FLOW record store.
-- Run this after create-demo-retail-commerce-reference-schema.sql.
--
-- Date note:
--   This file is aligned to Tuesday, August 25, 2026.
--   Order dates on August 18-24, 2026 are intentionally in the past.
--   Estimated deliveries on August 28, 2026 are intentionally in the future.

BEGIN;

SET search_path TO public;

WITH params AS (
  SELECT
    '8285edc4-af68-46c0-9e72-5b2819cb33d9'::text AS tenant_id,
    'seed-demo-retail-commerce-reference-data'::text AS source_tag
),
seed_records (
  record_id,
  collection,
  unique_key_field,
  unique_key_value_normalized,
  base_data_json
) AS (
  VALUES
    (
      'seed-reference-tenant',
      'retail_reference_tenants',
      'tenant_id',
      '8285edc4-af68-46c0-9e72-5b2819cb33d9',
      jsonb_build_object(
        'tenant_name', 'Demo Retail Tenant',
        'base_currency', 'INR',
        'timezone', 'Asia/Kolkata',
        'created_at', '2026-08-25T09:00:00.000Z'
      )
    ),
    (
      'seed-reference-customer-rahul',
      'retail_reference_customers',
      'customer_id',
      'cust-9000011111',
      jsonb_build_object(
        'customer_id', 'CUST-9000011111',
        'full_name', 'Rahul Nair',
        'mobile_e164', '+919000011111',
        'email', 'rahul.nair@example.store',
        'loyalty_tier', 'gold',
        'preferred_language', 'en',
        'created_at', '2026-08-25T09:00:00.000Z'
      )
    ),
    (
      'seed-reference-customer-ananya',
      'retail_reference_customers',
      'customer_id',
      'cust-9000022222',
      jsonb_build_object(
        'customer_id', 'CUST-9000022222',
        'full_name', 'Ananya Shah',
        'mobile_e164', '+919000022222',
        'email', 'ananya.shah@example.store',
        'loyalty_tier', 'standard',
        'preferred_language', 'en',
        'created_at', '2026-08-25T09:00:00.000Z'
      )
    ),
    (
      'seed-reference-category-shoes',
      'retail_reference_categories',
      'category_id',
      'cat-shoes',
      jsonb_build_object('category_id', 'CAT-SHOES', 'parent_category_id', NULL, 'category_name', 'Shoes', 'slug', 'shoes', 'status', 'active')
    ),
    (
      'seed-reference-category-audio',
      'retail_reference_categories',
      'category_id',
      'cat-audio',
      jsonb_build_object('category_id', 'CAT-AUDIO', 'parent_category_id', NULL, 'category_name', 'Audio', 'slug', 'audio', 'status', 'active')
    ),
    (
      'seed-reference-category-apparel',
      'retail_reference_categories',
      'category_id',
      'cat-apparel',
      jsonb_build_object('category_id', 'CAT-APPAREL', 'parent_category_id', NULL, 'category_name', 'Apparel', 'slug', 'apparel', 'status', 'active')
    ),
    (
      'seed-reference-category-running',
      'retail_reference_categories',
      'category_id',
      'cat-running',
      jsonb_build_object('category_id', 'CAT-RUNNING', 'parent_category_id', 'CAT-SHOES', 'category_name', 'Running', 'slug', 'running', 'status', 'active')
    ),
    (
      'seed-reference-category-headphones',
      'retail_reference_categories',
      'category_id',
      'cat-headphones',
      jsonb_build_object('category_id', 'CAT-HEADPHONES', 'parent_category_id', 'CAT-AUDIO', 'category_name', 'Headphones', 'slug', 'headphones', 'status', 'active')
    ),
    (
      'seed-reference-category-shirts',
      'retail_reference_categories',
      'category_id',
      'cat-shirts',
      jsonb_build_object('category_id', 'CAT-SHIRTS', 'parent_category_id', 'CAT-APPAREL', 'category_name', 'Shirts', 'slug', 'shirts', 'status', 'active')
    ),
    (
      'seed-reference-brand-northstar',
      'retail_reference_brands',
      'brand_id',
      'br-northstar',
      jsonb_build_object('brand_id', 'BR-NORTHSTAR', 'brand_name', 'Northstar Active', 'slug', 'northstar-active', 'status', 'active')
    ),
    (
      'seed-reference-brand-soundpro',
      'retail_reference_brands',
      'brand_id',
      'br-soundpro',
      jsonb_build_object('brand_id', 'BR-SOUNDPRO', 'brand_name', 'SoundPro', 'slug', 'soundpro', 'status', 'active')
    ),
    (
      'seed-reference-brand-airbeat',
      'retail_reference_brands',
      'brand_id',
      'br-airbeat',
      jsonb_build_object('brand_id', 'BR-AIRBEAT', 'brand_name', 'AirBeat', 'slug', 'airbeat', 'status', 'active')
    ),
    (
      'seed-reference-brand-tailorgrid',
      'retail_reference_brands',
      'brand_id',
      'br-tailorgrid',
      jsonb_build_object('brand_id', 'BR-TAILORGRID', 'brand_name', 'TailorGrid', 'slug', 'tailorgrid', 'status', 'active')
    ),
    (
      'seed-reference-product-runpro',
      'retail_reference_products',
      'product_id',
      'prd-runpro',
      jsonb_build_object('product_id', 'PRD-RUNPRO', 'category_id', 'CAT-RUNNING', 'brand_id', 'BR-NORTHSTAR', 'slug', 'velocity-run-pro', 'product_name', 'Velocity Run Pro', 'short_description', 'Everyday running shoe with cushioned support.', 'product_type', 'running_shoes', 'status', 'active', 'rating_avg', 4.60, 'rating_count', 842, 'attributes', jsonb_build_object('use_case', 'daily_running', 'return_window_days', 7), 'created_at', '2026-08-25T09:00:00.000Z', 'updated_at', '2026-08-25T09:00:00.000Z')
    ),
    (
      'seed-reference-product-trailgrip',
      'retail_reference_products',
      'product_id',
      'prd-trailgrip',
      jsonb_build_object('product_id', 'PRD-TRAILGRIP', 'category_id', 'CAT-RUNNING', 'brand_id', 'BR-NORTHSTAR', 'slug', 'trailgrip-max', 'product_name', 'TrailGrip Max', 'short_description', 'Trail shoe with waterproof upper and reinforced grip.', 'product_type', 'trail_shoes', 'status', 'active', 'rating_avg', 4.50, 'rating_count', 511, 'attributes', jsonb_build_object('use_case', 'trail', 'return_window_days', 7), 'created_at', '2026-08-25T09:00:00.000Z', 'updated_at', '2026-08-25T09:00:00.000Z')
    ),
    (
      'seed-reference-product-soundpro',
      'retail_reference_products',
      'product_id',
      'prd-soundpro-anc45',
      jsonb_build_object('product_id', 'PRD-SOUNDPRO-ANC45', 'category_id', 'CAT-HEADPHONES', 'brand_id', 'BR-SOUNDPRO', 'slug', 'soundpro-anc-45', 'product_name', 'SoundPro ANC 45', 'short_description', 'Wireless ANC headphones for travel and office calls.', 'product_type', 'headphones', 'status', 'active', 'rating_avg', 4.70, 'rating_count', 1291, 'attributes', jsonb_build_object('use_case', 'travel', 'warranty_months', 12), 'created_at', '2026-08-25T09:00:00.000Z', 'updated_at', '2026-08-25T09:00:00.000Z')
    ),
    (
      'seed-reference-product-airbeat',
      'retail_reference_products',
      'product_id',
      'prd-airbeat-work',
      jsonb_build_object('product_id', 'PRD-AIRBEAT-WORK', 'category_id', 'CAT-HEADPHONES', 'brand_id', 'BR-AIRBEAT', 'slug', 'airbeat-work-plus', 'product_name', 'AirBeat Work+', 'short_description', 'Office-call focused wireless headset with ENC microphones.', 'product_type', 'headphones', 'status', 'active', 'rating_avg', 4.40, 'rating_count', 754, 'attributes', jsonb_build_object('use_case', 'office_calls', 'warranty_months', 12), 'created_at', '2026-08-25T09:00:00.000Z', 'updated_at', '2026-08-25T09:00:00.000Z')
    ),
    (
      'seed-reference-product-shirt',
      'retail_reference_products',
      'product_id',
      'prd-office-shirt',
      jsonb_build_object('product_id', 'PRD-OFFICE-SHIRT', 'category_id', 'CAT-SHIRTS', 'brand_id', 'BR-TAILORGRID', 'slug', 'executive-formal-shirt', 'product_name', 'Executive Formal Shirt', 'short_description', 'Wrinkle-resistant office shirt.', 'product_type', 'shirt', 'status', 'active', 'rating_avg', 4.30, 'rating_count', 405, 'attributes', jsonb_build_object('use_case', 'office', 'return_window_days', 7), 'created_at', '2026-08-25T09:00:00.000Z', 'updated_at', '2026-08-25T09:00:00.000Z')
    ),
    (
      'seed-reference-product-pulsebuds',
      'retail_reference_products',
      'product_id',
      'prd-pulsebuds-lite',
      jsonb_build_object('product_id', 'PRD-PULSEBUDS-LITE', 'category_id', 'CAT-HEADPHONES', 'brand_id', 'BR-SOUNDPRO', 'slug', 'pulsebuds-lite', 'product_name', 'PulseBuds Lite', 'short_description', 'Compact wireless earbuds.', 'product_type', 'earbuds', 'status', 'active', 'rating_avg', 4.10, 'rating_count', 322, 'attributes', jsonb_build_object('use_case', 'general', 'warranty_months', 12), 'created_at', '2026-08-25T09:00:00.000Z', 'updated_at', '2026-08-25T09:00:00.000Z')
    ),
    (
      'seed-reference-variant-runpro-black',
      'retail_reference_product_variants',
      'variant_id',
      'var-runpro-blk-uk9',
      jsonb_build_object('variant_id', 'VAR-RUNPRO-BLK-UK9', 'product_id', 'PRD-RUNPRO', 'sku', 'RUNPRO-BLK-UK9', 'variant_name', 'Black / UK 9', 'colour', 'black', 'size_label', 'UK 9', 'material', 'mesh', 'status', 'active', 'weight_grams', 240, 'attributes', jsonb_build_object('compare_price_minor', 449900), 'created_at', '2026-08-25T09:00:00.000Z', 'updated_at', '2026-08-25T09:00:00.000Z')
    ),
    (
      'seed-reference-variant-runpro-navy',
      'retail_reference_product_variants',
      'variant_id',
      'var-runpro-nvy-uk9',
      jsonb_build_object('variant_id', 'VAR-RUNPRO-NVY-UK9', 'product_id', 'PRD-RUNPRO', 'sku', 'RUNPRO-NVY-UK9', 'variant_name', 'Navy / UK 9', 'colour', 'navy', 'size_label', 'UK 9', 'material', 'mesh', 'status', 'active', 'weight_grams', 240, 'attributes', jsonb_build_object('compare_price_minor', 449900), 'created_at', '2026-08-25T09:00:00.000Z', 'updated_at', '2026-08-25T09:00:00.000Z')
    ),
    (
      'seed-reference-variant-trail',
      'retail_reference_product_variants',
      'variant_id',
      'var-trail-blk-uk9',
      jsonb_build_object('variant_id', 'VAR-TRAIL-BLK-UK9', 'product_id', 'PRD-TRAILGRIP', 'sku', 'TRAIL-BLK-UK9', 'variant_name', 'Black / UK 9', 'colour', 'black', 'size_label', 'UK 9', 'material', 'ripstop', 'status', 'active', 'weight_grams', 265, 'attributes', jsonb_build_object('compare_price_minor', 499900), 'created_at', '2026-08-25T09:00:00.000Z', 'updated_at', '2026-08-25T09:00:00.000Z')
    ),
    (
      'seed-reference-variant-soundpro',
      'retail_reference_product_variants',
      'variant_id',
      'var-soundpro-blk',
      jsonb_build_object('variant_id', 'VAR-SOUNDPRO-BLK', 'product_id', 'PRD-SOUNDPRO-ANC45', 'sku', 'SOUNDPRO-ANC45-BLK', 'variant_name', 'Black', 'colour', 'black', 'size_label', '', 'material', 'polycarbonate', 'status', 'active', 'weight_grams', 210, 'attributes', jsonb_build_object('compare_price_minor', 749900), 'created_at', '2026-08-25T09:00:00.000Z', 'updated_at', '2026-08-25T09:00:00.000Z')
    ),
    (
      'seed-reference-variant-airbeat',
      'retail_reference_product_variants',
      'variant_id',
      'var-airbeat-blu',
      jsonb_build_object('variant_id', 'VAR-AIRBEAT-BLU', 'product_id', 'PRD-AIRBEAT-WORK', 'sku', 'AIRBEAT-WORK-BLU', 'variant_name', 'Blue', 'colour', 'blue', 'size_label', '', 'material', 'polycarbonate', 'status', 'active', 'weight_grams', 198, 'attributes', jsonb_build_object('compare_price_minor', 699900), 'created_at', '2026-08-25T09:00:00.000Z', 'updated_at', '2026-08-25T09:00:00.000Z')
    ),
    (
      'seed-reference-variant-shirt',
      'retail_reference_product_variants',
      'variant_id',
      'var-shirt-blk-m',
      jsonb_build_object('variant_id', 'VAR-SHIRT-BLK-M', 'product_id', 'PRD-OFFICE-SHIRT', 'sku', 'OFFICE-SHIRT-BLK-M', 'variant_name', 'Black / M', 'colour', 'black', 'size_label', 'M', 'material', 'cotton blend', 'status', 'active', 'weight_grams', 0, 'attributes', jsonb_build_object('compare_price_minor', 229900), 'created_at', '2026-08-25T09:00:00.000Z', 'updated_at', '2026-08-25T09:00:00.000Z')
    ),
    (
      'seed-reference-variant-pulsebuds',
      'retail_reference_product_variants',
      'variant_id',
      'var-pulsebuds-wht',
      jsonb_build_object('variant_id', 'VAR-PULSEBUDS-WHT', 'product_id', 'PRD-PULSEBUDS-LITE', 'sku', 'PULSEBUDS-WHT', 'variant_name', 'White', 'colour', 'white', 'size_label', '', 'material', 'polycarbonate', 'status', 'active', 'weight_grams', 64, 'attributes', jsonb_build_object('compare_price_minor', 299900), 'created_at', '2026-08-25T09:00:00.000Z', 'updated_at', '2026-08-25T09:00:00.000Z')
    ),
    (
      'seed-reference-warehouse-main',
      'retail_reference_warehouses',
      'warehouse_id',
      'wh-hyd-01',
      jsonb_build_object('warehouse_id', 'WH-HYD-01', 'warehouse_name', 'Hyderabad Main Warehouse', 'location_code', 'hyd-main', 'city', 'Hyderabad', 'state', 'Telangana', 'postal_code', '500081', 'status', 'active')
    ),
    (
      'seed-reference-warehouse-overflow',
      'retail_reference_warehouses',
      'warehouse_id',
      'wh-hyd-02',
      jsonb_build_object('warehouse_id', 'WH-HYD-02', 'warehouse_name', 'Hyderabad Overflow Warehouse', 'location_code', 'hyd-overflow', 'city', 'Hyderabad', 'state', 'Telangana', 'postal_code', '500049', 'status', 'active')
    ),
    (
      'seed-reference-inventory-runpro-black',
      'retail_reference_inventory_balances',
      'inventory_balance_key',
      'wh-hyd-01:var-runpro-blk-uk9',
      jsonb_build_object('inventory_balance_key', 'WH-HYD-01:VAR-RUNPRO-BLK-UK9', 'warehouse_id', 'WH-HYD-01', 'variant_id', 'VAR-RUNPRO-BLK-UK9', 'on_hand_qty', 20, 'reserved_qty', 8, 'available_qty', 12, 'safety_stock_qty', 2, 'version', 1, 'updated_at', '2026-08-25T09:00:00.000Z')
    ),
    (
      'seed-reference-inventory-runpro-navy',
      'retail_reference_inventory_balances',
      'inventory_balance_key',
      'wh-hyd-01:var-runpro-nvy-uk9',
      jsonb_build_object('inventory_balance_key', 'WH-HYD-01:VAR-RUNPRO-NVY-UK9', 'warehouse_id', 'WH-HYD-01', 'variant_id', 'VAR-RUNPRO-NVY-UK9', 'on_hand_qty', 0, 'reserved_qty', 0, 'available_qty', 0, 'safety_stock_qty', 0, 'version', 1, 'updated_at', '2026-08-25T09:00:00.000Z')
    ),
    (
      'seed-reference-inventory-trail',
      'retail_reference_inventory_balances',
      'inventory_balance_key',
      'wh-hyd-01:var-trail-blk-uk9',
      jsonb_build_object('inventory_balance_key', 'WH-HYD-01:VAR-TRAIL-BLK-UK9', 'warehouse_id', 'WH-HYD-01', 'variant_id', 'VAR-TRAIL-BLK-UK9', 'on_hand_qty', 6, 'reserved_qty', 2, 'available_qty', 4, 'safety_stock_qty', 1, 'version', 1, 'updated_at', '2026-08-25T09:00:00.000Z')
    ),
    (
      'seed-reference-inventory-soundpro',
      'retail_reference_inventory_balances',
      'inventory_balance_key',
      'wh-hyd-01:var-soundpro-blk',
      jsonb_build_object('inventory_balance_key', 'WH-HYD-01:VAR-SOUNDPRO-BLK', 'warehouse_id', 'WH-HYD-01', 'variant_id', 'VAR-SOUNDPRO-BLK', 'on_hand_qty', 24, 'reserved_qty', 6, 'available_qty', 18, 'safety_stock_qty', 2, 'version', 1, 'updated_at', '2026-08-25T09:00:00.000Z')
    ),
    (
      'seed-reference-inventory-airbeat',
      'retail_reference_inventory_balances',
      'inventory_balance_key',
      'wh-hyd-01:var-airbeat-blu',
      jsonb_build_object('inventory_balance_key', 'WH-HYD-01:VAR-AIRBEAT-BLU', 'warehouse_id', 'WH-HYD-01', 'variant_id', 'VAR-AIRBEAT-BLU', 'on_hand_qty', 14, 'reserved_qty', 3, 'available_qty', 11, 'safety_stock_qty', 1, 'version', 1, 'updated_at', '2026-08-25T09:00:00.000Z')
    ),
    (
      'seed-reference-inventory-shirt',
      'retail_reference_inventory_balances',
      'inventory_balance_key',
      'wh-hyd-02:var-shirt-blk-m',
      jsonb_build_object('inventory_balance_key', 'WH-HYD-02:VAR-SHIRT-BLK-M', 'warehouse_id', 'WH-HYD-02', 'variant_id', 'VAR-SHIRT-BLK-M', 'on_hand_qty', 28, 'reserved_qty', 7, 'available_qty', 21, 'safety_stock_qty', 2, 'version', 1, 'updated_at', '2026-08-25T09:00:00.000Z')
    ),
    (
      'seed-reference-inventory-pulsebuds',
      'retail_reference_inventory_balances',
      'inventory_balance_key',
      'wh-hyd-01:var-pulsebuds-wht',
      jsonb_build_object('inventory_balance_key', 'WH-HYD-01:VAR-PULSEBUDS-WHT', 'warehouse_id', 'WH-HYD-01', 'variant_id', 'VAR-PULSEBUDS-WHT', 'on_hand_qty', 8, 'reserved_qty', 0, 'available_qty', 8, 'safety_stock_qty', 1, 'version', 1, 'updated_at', '2026-08-25T09:00:00.000Z')
    ),
    (
      'seed-reference-cart-rahul',
      'retail_reference_carts',
      'cart_id',
      'cart-9000011111',
      jsonb_build_object('cart_id', 'CART-9000011111', 'customer_id', 'CUST-9000011111', 'session_id', 'session-rahul-cart', 'currency', 'INR', 'status', 'active', 'subtotal_minor', 649900, 'discount_total_minor', 0, 'shipping_total_minor', 0, 'grand_total_minor', 649900, 'coupon_code', '', 'expires_at', '2026-08-25T12:15:00.000Z', 'converted_order_id', '', 'created_at', '2026-08-25T09:00:00.000Z', 'updated_at', '2026-08-25T09:00:00.000Z')
    ),
    (
      'seed-reference-cart-item-rahul',
      'retail_reference_cart_items',
      'cart_item_id',
      'cart-9000011111:var-soundpro-blk',
      jsonb_build_object('cart_item_id', 'CART-9000011111:VAR-SOUNDPRO-BLK', 'cart_id', 'CART-9000011111', 'product_id', 'PRD-SOUNDPRO-ANC45', 'variant_id', 'VAR-SOUNDPRO-BLK', 'quantity', 1, 'unit_price_minor', 649900, 'line_total_minor', 649900, 'created_at', '2026-08-25T09:00:00.000Z', 'updated_at', '2026-08-25T09:00:00.000Z')
    ),
    (
      'seed-reference-reservation-rahul',
      'retail_reference_inventory_reservations',
      'reservation_id',
      'rsv-cart-9000011111',
      jsonb_build_object('reservation_id', 'RSV-CART-9000011111', 'reservation_key', 'RSV-CART-9000011111', 'variant_id', 'VAR-SOUNDPRO-BLK', 'warehouse_id', 'WH-HYD-01', 'cart_id', 'CART-9000011111', 'order_id', '', 'quantity', 1, 'status', 'active', 'expires_at', '2026-08-25T12:15:00.000Z', 'created_at', '2026-08-25T09:00:00.000Z', 'updated_at', '2026-08-25T09:00:00.000Z')
    ),
    (
      'seed-reference-order-49280',
      'retail_reference_orders',
      'order_id',
      'ord-49280',
      jsonb_build_object('order_id', 'ORD-49280', 'order_number', 'CR-49280', 'customer_id', 'CUST-9000011111', 'cart_id', '', 'status', 'confirmed', 'payment_status', 'paid', 'fulfillment_status', 'out_for_delivery', 'currency', 'INR', 'subtotal_minor', 649900, 'discount_total_minor', 0, 'shipping_total_minor', 0, 'grand_total_minor', 649900, 'refunded_total_minor', 0, 'shipping_address_snapshot', jsonb_build_object('city', 'Hyderabad', 'area', 'Gachibowli'), 'billing_address_snapshot', jsonb_build_object('city', 'Hyderabad', 'area', 'Gachibowli'), 'placed_at', '2026-08-22T10:30:00.000Z', 'delivered_at', NULL, 'created_at', '2026-08-22T10:30:00.000Z', 'updated_at', '2026-08-25T09:00:00.000Z')
    ),
    (
      'seed-reference-order-48910',
      'retail_reference_orders',
      'order_id',
      'ord-48910',
      jsonb_build_object('order_id', 'ORD-48910', 'order_number', 'CR-48910', 'customer_id', 'CUST-9000011111', 'cart_id', '', 'status', 'delivered', 'payment_status', 'paid', 'fulfillment_status', 'delivered', 'currency', 'INR', 'subtotal_minor', 379900, 'discount_total_minor', 0, 'shipping_total_minor', 0, 'grand_total_minor', 379900, 'refunded_total_minor', 0, 'shipping_address_snapshot', jsonb_build_object('city', 'Hyderabad', 'area', 'Gachibowli'), 'billing_address_snapshot', jsonb_build_object('city', 'Hyderabad', 'area', 'Gachibowli'), 'placed_at', '2026-08-21T13:10:00.000Z', 'delivered_at', '2026-08-23T14:30:00.000Z', 'created_at', '2026-08-21T13:10:00.000Z', 'updated_at', '2026-08-25T09:00:00.000Z')
    ),
    (
      'seed-reference-order-48850',
      'retail_reference_orders',
      'order_id',
      'ord-48850',
      jsonb_build_object('order_id', 'ORD-48850', 'order_number', 'CR-48850', 'customer_id', 'CUST-9000022222', 'cart_id', '', 'status', 'confirmed', 'payment_status', 'paid', 'fulfillment_status', 'processing', 'currency', 'INR', 'subtotal_minor', 189900, 'discount_total_minor', 0, 'shipping_total_minor', 0, 'grand_total_minor', 189900, 'refunded_total_minor', 0, 'shipping_address_snapshot', jsonb_build_object('city', 'Hyderabad', 'area', 'Madhapur'), 'billing_address_snapshot', jsonb_build_object('city', 'Hyderabad', 'area', 'Madhapur'), 'placed_at', '2026-08-24T09:45:00.000Z', 'delivered_at', NULL, 'created_at', '2026-08-24T09:45:00.000Z', 'updated_at', '2026-08-25T09:00:00.000Z')
    ),
    (
      'seed-reference-order-48770',
      'retail_reference_orders',
      'order_id',
      'ord-48770',
      jsonb_build_object('order_id', 'ORD-48770', 'order_number', 'CR-48770', 'customer_id', 'CUST-9000011111', 'cart_id', '', 'status', 'returned', 'payment_status', 'refunded', 'fulfillment_status', 'delivered', 'currency', 'INR', 'subtotal_minor', 249900, 'discount_total_minor', 0, 'shipping_total_minor', 0, 'grand_total_minor', 249900, 'refunded_total_minor', 249900, 'shipping_address_snapshot', jsonb_build_object('city', 'Hyderabad', 'area', 'Gachibowli'), 'billing_address_snapshot', jsonb_build_object('city', 'Hyderabad', 'area', 'Gachibowli'), 'placed_at', '2026-08-18T12:00:00.000Z', 'delivered_at', '2026-08-20T16:00:00.000Z', 'created_at', '2026-08-18T12:00:00.000Z', 'updated_at', '2026-08-25T09:00:00.000Z')
    ),
    (
      'seed-reference-order-item-49280',
      'retail_reference_order_items',
      'order_item_id',
      'ord-49280:1',
      jsonb_build_object('order_item_id', 'ORD-49280:1', 'order_id', 'ORD-49280', 'product_id', 'PRD-SOUNDPRO-ANC45', 'variant_id', 'VAR-SOUNDPRO-BLK', 'sku_snapshot', 'SOUNDPRO-ANC45-BLK', 'product_name_snapshot', 'SoundPro ANC 45', 'variant_name_snapshot', 'Black', 'quantity', 1, 'unit_price_minor', 649900, 'line_total_minor', 649900, 'fulfilled_qty', 1, 'cancelled_qty', 0, 'returned_qty', 0, 'refunded_qty', 0, 'created_at', '2026-08-22T10:30:00.000Z')
    ),
    (
      'seed-reference-order-item-48910',
      'retail_reference_order_items',
      'order_item_id',
      'ord-48910:1',
      jsonb_build_object('order_item_id', 'ORD-48910:1', 'order_id', 'ORD-48910', 'product_id', 'PRD-RUNPRO', 'variant_id', 'VAR-RUNPRO-BLK-UK9', 'sku_snapshot', 'RUNPRO-BLK-UK9', 'product_name_snapshot', 'Velocity Run Pro', 'variant_name_snapshot', 'Black / UK 9', 'quantity', 1, 'unit_price_minor', 379900, 'line_total_minor', 379900, 'fulfilled_qty', 1, 'cancelled_qty', 0, 'returned_qty', 0, 'refunded_qty', 0, 'created_at', '2026-08-21T13:10:00.000Z')
    ),
    (
      'seed-reference-order-item-48850',
      'retail_reference_order_items',
      'order_item_id',
      'ord-48850:1',
      jsonb_build_object('order_item_id', 'ORD-48850:1', 'order_id', 'ORD-48850', 'product_id', 'PRD-OFFICE-SHIRT', 'variant_id', 'VAR-SHIRT-BLK-M', 'sku_snapshot', 'OFFICE-SHIRT-BLK-M', 'product_name_snapshot', 'Executive Formal Shirt', 'variant_name_snapshot', 'Black / M', 'quantity', 1, 'unit_price_minor', 189900, 'line_total_minor', 189900, 'fulfilled_qty', 0, 'cancelled_qty', 0, 'returned_qty', 0, 'refunded_qty', 0, 'created_at', '2026-08-24T09:45:00.000Z')
    ),
    (
      'seed-reference-order-item-48770',
      'retail_reference_order_items',
      'order_item_id',
      'ord-48770:1',
      jsonb_build_object('order_item_id', 'ORD-48770:1', 'order_id', 'ORD-48770', 'product_id', 'PRD-PULSEBUDS-LITE', 'variant_id', 'VAR-PULSEBUDS-WHT', 'sku_snapshot', 'PULSEBUDS-WHT', 'product_name_snapshot', 'PulseBuds Lite', 'variant_name_snapshot', 'White', 'quantity', 1, 'unit_price_minor', 249900, 'line_total_minor', 249900, 'fulfilled_qty', 1, 'cancelled_qty', 0, 'returned_qty', 1, 'refunded_qty', 1, 'created_at', '2026-08-18T12:00:00.000Z')
    ),
    (
      'seed-reference-payment-49280',
      'retail_reference_payments',
      'payment_id',
      'pay-49280',
      jsonb_build_object('payment_id', 'PAY-49280', 'order_id', 'ORD-49280', 'provider', 'razorpay', 'provider_payment_id', 'rzp_49280', 'payment_method', 'upi', 'amount_minor', 649900, 'currency', 'INR', 'status', 'captured', 'authorized_at', NULL, 'captured_at', '2026-08-22T10:31:00.000Z', 'created_at', '2026-08-22T10:31:00.000Z')
    ),
    (
      'seed-reference-payment-48910',
      'retail_reference_payments',
      'payment_id',
      'pay-48910',
      jsonb_build_object('payment_id', 'PAY-48910', 'order_id', 'ORD-48910', 'provider', 'razorpay', 'provider_payment_id', 'rzp_48910', 'payment_method', 'upi', 'amount_minor', 379900, 'currency', 'INR', 'status', 'captured', 'authorized_at', NULL, 'captured_at', '2026-08-21T13:11:00.000Z', 'created_at', '2026-08-21T13:11:00.000Z')
    ),
    (
      'seed-reference-payment-48850',
      'retail_reference_payments',
      'payment_id',
      'pay-48850',
      jsonb_build_object('payment_id', 'PAY-48850', 'order_id', 'ORD-48850', 'provider', 'razorpay', 'provider_payment_id', 'rzp_48850', 'payment_method', 'card', 'amount_minor', 189900, 'currency', 'INR', 'status', 'captured', 'authorized_at', NULL, 'captured_at', '2026-08-24T09:46:00.000Z', 'created_at', '2026-08-24T09:46:00.000Z')
    ),
    (
      'seed-reference-payment-48770',
      'retail_reference_payments',
      'payment_id',
      'pay-48770',
      jsonb_build_object('payment_id', 'PAY-48770', 'order_id', 'ORD-48770', 'provider', 'razorpay', 'provider_payment_id', 'rzp_48770', 'payment_method', 'upi', 'amount_minor', 249900, 'currency', 'INR', 'status', 'captured', 'authorized_at', NULL, 'captured_at', '2026-08-18T12:01:00.000Z', 'created_at', '2026-08-18T12:01:00.000Z')
    ),
    (
      'seed-reference-shipment-49280',
      'retail_reference_shipments',
      'shipment_id',
      'shp-49280',
      jsonb_build_object('shipment_id', 'SHP-49280', 'order_id', 'ORD-49280', 'warehouse_id', 'WH-HYD-01', 'carrier', 'Delhivery', 'tracking_number', 'DLV-CR-49280', 'status', 'out_for_delivery', 'estimated_delivery_at', '2026-08-25T20:00:00.000Z', 'shipped_at', '2026-08-24T06:30:00.000Z', 'delivered_at', NULL, 'created_at', '2026-08-24T06:30:00.000Z', 'updated_at', '2026-08-25T09:00:00.000Z')
    ),
    (
      'seed-reference-shipment-48910',
      'retail_reference_shipments',
      'shipment_id',
      'shp-48910',
      jsonb_build_object('shipment_id', 'SHP-48910', 'order_id', 'ORD-48910', 'warehouse_id', 'WH-HYD-01', 'carrier', 'Blue Dart', 'tracking_number', 'BD-CR-48910', 'status', 'delivered', 'estimated_delivery_at', '2026-08-23T14:30:00.000Z', 'shipped_at', '2026-08-22T07:20:00.000Z', 'delivered_at', '2026-08-23T14:30:00.000Z', 'created_at', '2026-08-22T07:20:00.000Z', 'updated_at', '2026-08-25T09:00:00.000Z')
    ),
    (
      'seed-reference-shipment-48850',
      'retail_reference_shipments',
      'shipment_id',
      'shp-48850',
      jsonb_build_object('shipment_id', 'SHP-48850', 'order_id', 'ORD-48850', 'warehouse_id', 'WH-HYD-02', 'carrier', 'Ecom Express', 'tracking_number', 'ECOM-CR-48850', 'status', 'processing', 'estimated_delivery_at', '2026-08-28T20:00:00.000Z', 'shipped_at', NULL, 'delivered_at', NULL, 'created_at', '2026-08-24T19:20:00.000Z', 'updated_at', '2026-08-25T09:00:00.000Z')
    ),
    (
      'seed-reference-shipment-event-49280-1',
      'retail_reference_shipment_events',
      'shipment_event_id',
      'se-49280-1',
      jsonb_build_object('shipment_event_id', 'SE-49280-1', 'shipment_id', 'SHP-49280', 'event_code', 'arrived_delivery_centre', 'event_status', 'in_transit', 'location', 'Hyderabad delivery centre', 'event_at', '2026-08-25T06:40:00.000Z', 'raw_payload', jsonb_build_object('provider', 'Delhivery'), 'created_at', '2026-08-25T06:40:00.000Z')
    ),
    (
      'seed-reference-shipment-event-49280-2',
      'retail_reference_shipment_events',
      'shipment_event_id',
      'se-49280-2',
      jsonb_build_object('shipment_event_id', 'SE-49280-2', 'shipment_id', 'SHP-49280', 'event_code', 'out_for_delivery', 'event_status', 'out_for_delivery', 'location', 'Gachibowli route', 'event_at', '2026-08-25T08:10:00.000Z', 'raw_payload', jsonb_build_object('provider', 'Delhivery'), 'created_at', '2026-08-25T08:10:00.000Z')
    ),
    (
      'seed-reference-shipment-event-48910-1',
      'retail_reference_shipment_events',
      'shipment_event_id',
      'se-48910-1',
      jsonb_build_object('shipment_event_id', 'SE-48910-1', 'shipment_id', 'SHP-48910', 'event_code', 'delivered', 'event_status', 'delivered', 'location', 'Customer address', 'event_at', '2026-08-23T14:30:00.000Z', 'raw_payload', jsonb_build_object('provider', 'Blue Dart'), 'created_at', '2026-08-23T14:30:00.000Z')
    ),
    (
      'seed-reference-return-48770',
      'retail_reference_returns',
      'return_id',
      'ret-48770',
      jsonb_build_object('return_id', 'RET-48770', 'return_number', 'RT-48770', 'order_id', 'ORD-48770', 'customer_id', 'CUST-9000011111', 'status', 'completed', 'reason_category', 'damaged', 'resolution_type', 'refund', 'requested_at', '2026-08-22T10:15:00.000Z', 'completed_at', '2026-08-24T11:10:00.000Z', 'created_at', '2026-08-22T10:15:00.000Z', 'updated_at', '2026-08-24T11:10:00.000Z')
    ),
    (
      'seed-reference-return-item-48770-1',
      'retail_reference_return_items',
      'return_item_id',
      'retitem-48770-1',
      jsonb_build_object('return_item_id', 'RETITEM-48770-1', 'return_id', 'RET-48770', 'order_item_id', 'ORD-48770:1', 'quantity', 1, 'reason_code', 'damaged', 'resolution', 'refund', 'approved_quantity', 1, 'received_quantity', 1, 'created_at', '2026-08-22T10:15:00.000Z')
    ),
    (
      'seed-reference-refund-938271',
      'retail_reference_refunds',
      'refund_id',
      'ref-938271',
      jsonb_build_object('refund_id', 'REF-938271', 'refund_number', 'RF-938271', 'order_id', 'ORD-48770', 'return_id', 'RET-48770', 'payment_id', 'PAY-48770', 'provider_refund_id', 'RF938271', 'amount_minor', 249900, 'currency', 'INR', 'reason_code', 'damaged', 'status', 'processed', 'requested_at', '2026-08-22T11:00:00.000Z', 'processed_at', '2026-08-24T11:10:00.000Z', 'created_at', '2026-08-22T11:00:00.000Z')
    ),
    (
      'seed-reference-stock-subscription',
      'retail_reference_stock_subscriptions',
      'subscription_id',
      'sub-runpro-nvy-uk9',
      jsonb_build_object('subscription_id', 'SUB-RUNPRO-NVY-UK9', 'customer_id', 'CUST-9000011111', 'variant_id', 'VAR-RUNPRO-NVY-UK9', 'channel', 'whatsapp', 'destination', '+919000011111', 'status', 'active', 'created_at', '2026-08-25T09:15:00.000Z', 'notified_at', NULL)
    ),
    (
      'seed-reference-support-case-49280',
      'retail_reference_support_cases',
      'support_case_id',
      'case-49280',
      jsonb_build_object('support_case_id', 'CASE-49280', 'case_number', 'SC-49280', 'customer_id', 'CUST-9000011111', 'order_id', 'ORD-49280', 'category', 'delivery_issue', 'subcategory', 'delivered_not_received', 'priority', 'high', 'status', 'open', 'queue_name', 'retail_exceptions', 'summary', 'Customer asked for investigation after shipment marked delivered.', 'customer_message', 'Delivered but not received.', 'created_at', '2026-08-25T09:20:00.000Z', 'updated_at', '2026-08-25T09:20:00.000Z')
    ),
    (
      'seed-reference-support-case-48910',
      'retail_reference_support_cases',
      'support_case_id',
      'case-48910',
      jsonb_build_object('support_case_id', 'CASE-48910', 'case_number', 'SC-48910', 'customer_id', 'CUST-9000011111', 'order_id', 'ORD-48910', 'category', 'warranty', 'subcategory', 'audio_or_footwear_issue', 'priority', 'high', 'status', 'open', 'queue_name', 'retail_exceptions', 'summary', 'Customer reported the item is not working and needs troubleshooting or replacement.', 'customer_message', 'Left side stopped working.', 'created_at', '2026-08-25T09:25:00.000Z', 'updated_at', '2026-08-25T09:25:00.000Z')
    ),
    (
      'seed-reference-policy-return',
      'retail_reference_policy_rules',
      'policy_rule_id',
      'policy-return',
      jsonb_build_object('policy_rule_id', 'POLICY-RETURN', 'policy_type', 'return', 'policy_name', '7-day return policy', 'priority', 10, 'conditions', jsonb_build_object('return_window_days', 7), 'actions', jsonb_build_object('summary', 'Return within 7 days when unused and complete.'), 'effective_from', '2026-01-01T00:00:00.000Z', 'effective_to', NULL, 'status', 'active')
    ),
    (
      'seed-reference-policy-exchange',
      'retail_reference_policy_rules',
      'policy_rule_id',
      'policy-exchange',
      jsonb_build_object('policy_rule_id', 'POLICY-EXCHANGE', 'policy_type', 'exchange', 'policy_name', 'Exchange policy', 'priority', 10, 'conditions', jsonb_build_object('requires_inventory', true), 'actions', jsonb_build_object('summary', 'Offer size or colour exchange when stock is available.'), 'effective_from', '2026-01-01T00:00:00.000Z', 'effective_to', NULL, 'status', 'active')
    ),
    (
      'seed-reference-policy-shipping',
      'retail_reference_policy_rules',
      'policy_rule_id',
      'policy-shipping',
      jsonb_build_object('policy_rule_id', 'POLICY-SHIPPING', 'policy_type', 'shipping', 'policy_name', 'Shipping charges', 'priority', 10, 'conditions', jsonb_build_object('free_shipping_threshold_minor', 500000), 'actions', jsonb_build_object('summary', 'Orders above INR 5,000 ship free.'), 'effective_from', '2026-01-01T00:00:00.000Z', 'effective_to', NULL, 'status', 'active')
    ),
    (
      'seed-reference-policy-refund',
      'retail_reference_policy_rules',
      'policy_rule_id',
      'policy-refund',
      jsonb_build_object('policy_rule_id', 'POLICY-REFUND', 'policy_type', 'refund', 'policy_name', 'Refund timelines', 'priority', 10, 'conditions', '{}'::jsonb, 'actions', jsonb_build_object('summary', 'Processed refunds usually reach the bank in 3-7 business days.'), 'effective_from', '2026-01-01T00:00:00.000Z', 'effective_to', NULL, 'status', 'active')
    ),
    (
      'seed-reference-policy-warranty',
      'retail_reference_policy_rules',
      'policy_rule_id',
      'policy-warranty',
      jsonb_build_object('policy_rule_id', 'POLICY-WARRANTY', 'policy_type', 'warranty', 'policy_name', 'Electronics warranty', 'priority', 10, 'conditions', jsonb_build_object('warranty_months', 12), 'actions', jsonb_build_object('summary', 'Selected electronics carry a 12-month manufacturing-defect warranty.'), 'effective_from', '2026-01-01T00:00:00.000Z', 'effective_to', NULL, 'status', 'active')
    )
),
prepared_records AS (
  SELECT
    seed_records.record_id,
    seed_records.collection,
    seed_records.unique_key_field,
    CASE
      WHEN seed_records.collection = 'retail_reference_tenants'
        THEN params.tenant_id
      ELSE seed_records.unique_key_value_normalized
    END AS unique_key_value_normalized,
    jsonb_build_object('tenant_id', params.tenant_id) || seed_records.base_data_json AS data_json
  FROM seed_records
  CROSS JOIN params
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
    prepared_records.record_id,
    params.tenant_id,
    prepared_records.collection,
    prepared_records.data_json,
    prepared_records.unique_key_field,
    prepared_records.unique_key_value_normalized,
    1,
    params.source_tag,
    params.source_tag,
    NULL,
    NOW(),
    NOW()
  FROM prepared_records
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
  JOIN prepared_records sr
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
      WHEN kv.key IN ('mobile_e164', 'destination')
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
  COUNT(*) AS reference_records_seeded
FROM params
CROSS JOIN prepared_records
GROUP BY params.tenant_id;

COMMIT;

-- Suggested verification after the commit:
-- SELECT "collection", COUNT(*)
-- FROM "flow_records"
-- WHERE "tenantId" = '8285edc4-af68-46c0-9e72-5b2819cb33d9'
--   AND "collection" LIKE 'retail_reference_%'
-- GROUP BY "collection"
-- ORDER BY "collection";
--
-- SELECT
--   "dataJson"->>'order_number' AS order_number,
--   "dataJson"->>'status' AS status,
--   "dataJson"->>'payment_status' AS payment_status,
--   "dataJson"->>'fulfillment_status' AS fulfillment_status
-- FROM "flow_records"
-- WHERE "tenantId" = '8285edc4-af68-46c0-9e72-5b2819cb33d9'
--   AND "collection" = 'retail_reference_orders'
-- ORDER BY "dataJson"->>'order_number';
