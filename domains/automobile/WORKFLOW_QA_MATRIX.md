# Workflow QA Matrix

Use this checklist before importing or releasing the automobile customer lifecycle workflow.

## Primary Journey

| Scenario | Expected result |
| --- | --- |
| Main menu entry | The first interactive step offers the automobile menu and still accepts direct free-text input. |
| Main router | One main intent router directly owns the concrete sales and service journeys; no nested category routers are introduced. |
| Progressive qualification | Discovery captures only the missing sales fields instead of forcing a long up-front form. |
| Variant ranking | Recommendations come from maintained `vehicle_variants` records and match the captured body type, budget, fuel, transmission, and usage data. |
| Variant comparison | The compare journey uses two selected maintained variants and shows a structured side-by-side summary. |
| Price estimate | The on-road estimate uses maintained `vehicle_offers` data rather than hardcoded totals. |
| Finance capture | EMI is presented as indicative and the finance lead is saved in `finance_requests`. |
| Exchange capture | Exchange requests persist make, model, year, fuel, transmission, condition, and expected value. |
| Test-drive happy path | Mobile capture, customer reuse or creation, existing-booking detection, showroom selection, demonstrator check, slot selection, booking write, salesperson assignment, customer confirmation, and reminders complete without handover. |
| Test-drive duplicates | Existing future confirmed bookings are detected before another booking is committed. |
| Test-drive inventory boundary | A test drive cannot proceed when the selected showroom has no maintained demonstrator for the chosen variant. |
| Service booking happy path | Verified customer lookup, vehicle selection, service center, slot choice, pickup mode, advisor assignment, and booking confirmation complete without human handoff. |
| Service status | The status journey shows persisted stage and timeline data from `service_orders`. |
| Service estimate | The estimate journey reads persisted estimate data and supports forward-only approve, decline, or advisor-review outcomes. |
| Service payment | The payment journey reads the payable service order, records the payment, updates the order to paid, and confirms readiness for delivery. |
| OTP verification | Any 6-digit OTP is accepted for the demo flow; 3 invalid-format attempts end the verification branch without backward loops. |
| Warranty / RSA | Roadside assistance collects critical context and escalates immediately instead of pretending it can self-resolve a safety issue. |

## Import Safety

| Scenario | Expected result |
| --- | --- |
| Graph cycle check | No invalid selection, retry, no-slot, or no-record branch loops backward to the same node or an earlier node. |
| Variable proof check | Every referenced template variable is initialized or written upstream. |
| Output contract check | The build produces full export JSON with the required wrapper and no markdown. |
| Script syntax safety | Every script node compiles locally before validation passes. |
| Conditional edges | Every conditional source has exactly one default edge. |

## Data And Records

| Scenario | Expected result |
| --- | --- |
| Vehicle discovery | `vehicle_variants` is the source of truth for model, pricing base, mileage, transmission, and feature summary. |
| Price and offers | `vehicle_offers` drives the offer and fee adjustments shown to the customer. |
| Test-drive durability | `test_drive_vehicles`, `test_drive_slots`, and `test_drive_bookings` hold the maintained operational state for the slot and booking flow. |
| Lead durability | `automobile_leads`, `automobile_lead_assignments`, and `automobile_lead_activities` capture the qualified sales state. |
| Service durability | `customer_vehicles`, `service_slots`, `service_bookings`, `service_orders`, `service_estimates`, and `service_payments` back the service journeys. |
| PII boundary | Customer PII stays in customer and booking/order records, not in slot operational state beyond identifiers required for the booking linkage. |

## Content

| Scenario | Expected result |
| --- | --- |
| Production wording | Customer-visible copy is concrete, dealership-safe, and free of filler. |
| Grounded answers | Vehicle Q&A never invents a missing feature, price, offer, or stock decision. |
| Confirmation accuracy | Test-drive and service confirmations use the selected variant, slot, location, and staff details from the actual flow variables. |
| Newline rendering | Chat-visible summaries render real line breaks rather than literal `\n` text. |
