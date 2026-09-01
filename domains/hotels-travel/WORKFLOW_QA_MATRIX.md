# Workflow QA Matrix

Use this checklist before importing or releasing the hotel and travel digital front desk workflow.

## Primary Journey

| Scenario | Expected result |
| --- | --- |
| Main menu entry | The first interactive step offers direct hotel intents and still accepts free-text guest requests. |
| One main router | The workflow uses one main intent router with direct intent branches instead of nested booking-category routers. |
| New booking discovery | The guest moves from property, dates, guest counts, preferences, live options, guest identity, quote, hold, payment, and confirmation without routine human handover. |
| Live availability separation | Room choice, pricing, taxes, fees, deposit, and cancellation summary come from maintained record-backed options and quote snapshots, not model invention. |
| No-availability recovery | When exact dates are unavailable, the flow creates a structured availability follow-up instead of ending with a dead stop. |
| Quote snapshot | The booking spine persists `quote_id`, pricing snapshot, policy snapshot, and expiry before payment. |
| Hold before payment | The room-selection path creates a booking hold before payment and marks it released on payment failure. |
| Payment verification | Booking and balance-payment steps route only on paid or failed outcomes; pending verification stays inside the payment node. |
| Booking confirmation | Confirmation is sent only after the booking record and hold-consumed update succeed. |
| Packages reuse | Package discovery routes into the same room-search and booking spine rather than duplicating a separate booking implementation. |
| Modification path | Booking modification searches replacement options, captures settlement differences, and updates the existing booking only after the new replacement path succeeds. |
| Cancellation path | Cancellation shows the financial consequence before updating the booking and customer notification state. |
| Transfer path | Airport or station transfer requests are saved with booking context and payment handling when a charge applies. |
| Service request path | Routine in-stay requests create structured service-request records and confirmation without automatic human transfer. |
| Critical issue escalation | Critical safety incidents create a support case, queue to the urgent response team, and end in handover. |
| Group sales capture | Group or corporate requests persist a structured lead and route into the group-sales queue. |

## Import Safety

| Scenario | Expected result |
| --- | --- |
| Graph cycle check | No retry, no-availability, or failure path loops back to the same node or earlier nodes. |
| Variable proof check | Every template variable is declared upstream, produced by a supported node output, or defined as a global. |
| Output contract check | The build produces full export JSON with the required wrapper and no markdown. |
| Script syntax safety | Every script node compiles locally before import validation passes. |
| Handover terminality | Handover nodes do not continue into downstream automated runtime branches. |

## Data And Records

| Scenario | Expected result |
| --- | --- |
| Guest identity | Guest profiles are keyed by phone and reused without making the phone a one-booking-only identity. |
| Quote persistence | Booking quotes persist the sellable-option snapshot rather than recalculating an older booking from current rates. |
| Hold persistence | Booking holds have explicit IDs, status, and expiry data. |
| Booking persistence | Booking totals, paid amount, balance amount, payment status, and cancellation policy snapshot are stored on the booking record. |
| Transfer persistence | Transfer requests are linked to a booking and keep charge information. |
| Service persistence | Guest service and issue requests create dedicated persisted records with priority and department data. |
| Queue durability | Group-sales and human-support escalations use queue nodes instead of ad hoc message-only escalation. |
| Reminder durability | Pre-arrival reminders use scheduler jobs rather than a conversational delay. |

## Content

| Scenario | Expected result |
| --- | --- |
| Production wording | User-facing copy is concrete, hotel-specific, and free of filler text. |
| Summary accuracy | Booking, modification, cancellation, and service confirmations reflect the selected stay or service context rather than invented values. |
| Knowledge guardrails | Hotel-information answers stay grounded and do not invent live inventory, prices, or policy exceptions. |
| Escalation clarity | Human-handover copy clearly states why the issue is being escalated and which team is receiving it. |
