# Workflow QA Matrix

Use this checklist before importing or releasing the local and professional services workflow.

## Primary Journey

| Scenario | Expected result |
| --- | --- |
| Main menu entry | The first interactive step offers the service operations menu and still accepts direct free-text input. |
| Main router | One main intent router directly owns the concrete service journeys; no nested category routers are introduced. |
| Requirement understanding | Free-text service requests map to a maintained category or move forward to a manual category selection step without inventing services. |
| Catalog grounding | Service names, payment policies, booking modes, and price labels come from `service_catalog` records instead of hardcoded guesses. |
| Identity verification | Any 6-digit OTP is accepted for the demo flow; 3 invalid-format attempts end the branch without looping backward. |
| Customer reuse | Returning customers are identified from persisted customer records and can reuse a saved address when present. |
| Serviceability | Onsite services check `service_areas` before booking. Non-serviceable locations move forward to a saved-notify path rather than a fake booking. |
| Media intake | Services configured for optional or required media continue through a document-intake step and persist media metadata against the request. |
| Service intake | The flow shows maintained intake questions and then captures service-specific details in a forward-only form step. |
| Pricing summary | The booking summary uses persisted service pricing rules and policy-derived booking-fee math rather than invented totals. |
| Availability | Slot choices come from `service_availability_slots` records rather than placeholder times. |
| Slot hold | After slot selection, the flow writes a hold record and updates the selected slot before payment or confirmation continues. |
| Payment recovery | Payment failure does not loop back; it uses one retry path and then releases the held slot and hold record safely. |
| Booking confirmation | Successful bookings persist request, booking, slot, hold, payment where applicable, assignment, reminders, and confirmation notification before the journey ends. |
| Technician assignment | Assignment uses persisted worker records and a deterministic eligibility/priority script rather than fixed staff names. |
| Status tracking | The customer can look up a persisted booking and see the latest operational status plus timeline events. |
| Reschedule | Reschedule uses a separate forward-only path that books a new active slot, updates the booking, releases the old slot, and confirms the change. |
| Cancellation | Cancellation updates the booking and releases the slot without re-entering the booking journey. |
| Invoice and balance | Invoice lookups use persisted invoice records, and a balance-due booking can collect a final payment and update invoice/booking state. |
| Feedback and complaints | Ratings persist to feedback records; poor ratings or explicit complaints create complaint records and route to human follow-up. |

## Import Safety

| Scenario | Expected result |
| --- | --- |
| Graph cycle check | No retry, reschedule, cancellation, payment-failure, or complaint path loops back to an earlier node. |
| Variable proof check | Every referenced template variable is initialized by a global, form/input node, record node, payment node, appointment node, scheduler, notification, script assignment, or setVariable step. |
| Output contract check | The build produces full export JSON with the required wrapper and no markdown. |
| Script syntax safety | Every script node compiles locally before validation passes. |
| Conditional edges | Every conditional source has exactly one default edge. |

## Data And Records

| Scenario | Expected result |
| --- | --- |
| Service catalog | `service_catalog` is the source of truth for maintained bookable services. |
| Customer profile | `service_customers` and `service_customer_addresses` hold customer identity and reusable address state. |
| Service request | `service_requests` persists the enquiry draft before scheduling finishes. |
| Capacity records | `service_availability_slots` and `service_slot_holds` back the appointment and hold lifecycle. |
| Booking durability | `service_bookings`, `service_assignments`, `service_payments`, `service_status_events`, and `service_reminder_jobs` hold the operational booking state. |
| Completion state | `service_invoices`, `service_feedback`, and `service_complaints` back balance collection and after-service workflows. |

## Content

| Scenario | Expected result |
| --- | --- |
| Production wording | User-facing copy is concrete, operations-safe, and free of filler text. |
| Governance boundary | The flow does not promise a technician outcome, exact diagnosis, or serviceability result unless the underlying records support it. |
| Confirmation accuracy | Booking, status, and invoice summaries reflect the actual persisted booking variables and record values used in the active branch. |
| Newline rendering | Chat-visible summaries render real line breaks rather than literal `\n` text. |
