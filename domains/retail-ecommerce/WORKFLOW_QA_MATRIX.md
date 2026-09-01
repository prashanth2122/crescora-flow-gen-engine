# Retail Workflow QA Matrix

Use this checklist before importing or releasing the retail and D2C bundle.

## Core flow safety

- Keep one main intent router only. Do not reintroduce nested sales/support category routers for routine commerce paths.
- Keep the graph acyclic. Invalid selection, no-result, stock-miss, and policy-exception paths must move forward to alternatives, support, or end states.
- Preserve automation-first behavior. Human escalation is for explicit support requests, policy exceptions, delivery investigations, payment mismatches, or system failures.

## Catalog and selection

- Product discovery must read from maintained catalog records or APIs, not invented LLM product lists.
- Product ranking may use heuristic or model assistance, but hard rules such as inactive items, zero availability, and variant mismatch must come from commerce data.
- After product selection, persist stable `product_id`, `variant_id`, `sku`, `price`, and quantity before any downstream action.
- Stock responses should prefer exact availability, estimated delivery, alternatives, or back-in-stock alerts over a dead-end out-of-stock message.

## Cart, checkout, and order safety

- Add-to-cart and checkout paths must revalidate live price and inventory before payment or order creation.
- Inventory reservation records should be created before payment and marked consumed only after order creation succeeds.
- Payment failure paths must stop safely and avoid silent order creation or silent price changes.
- Order journeys should resolve from maintained order and shipment data, including multiple-order disambiguation when the user has more than one recent order.

## Returns, refunds, and support

- Return and exchange eligibility must be deterministic from maintained policy and order facts, not an unconstrained model judgment.
- Refund status responses should reflect the real persisted refund status and provider reference when available.
- Delivery-issue, damaged-item, and warranty escalations should create structured support records with full order context.
- Verify `npm run domain:retail-ecommerce:build` and `npm run domain:retail-ecommerce:validate` pass before import.
