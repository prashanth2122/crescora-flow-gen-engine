# Workflow QA Matrix

Use this checklist before importing or releasing the financial-services loan advisor workflow.

## Primary Journey

| Scenario | Expected result |
| --- | --- |
| Main menu entry | The first interactive step shows the lending menu and still accepts a direct typed loan requirement. |
| Main router | One main menu owns the concrete lending journeys; there are no nested category routers. |
| Free-text enquiry | A message like `I need a home loan around 40 lakhs` can continue without forcing the customer back to the main menu. |
| OTP verification | Any 6-digit OTP is accepted for the demo flow; 3 invalid-format attempts end the branch without a cycle. |
| Returning customer | A saved customer is detected from the generic records store and any active lead is surfaced before creating another enquiry. |
| Draft persistence | The lead draft is saved before prequalification, document upload, and advisor booking. |
| Indicative guidance | The flow gives initial guidance only and never claims final approval or sanction. |
| Document checklist | The document list comes from `loan_document_rules`, not from hardcoded copy. |
| Document recovery | Invalid or low-confidence uploads move forward to a safe continuation path rather than retry loops. |
| Advisor booking | The customer reaches slot selection, confirmation, appointment persistence, notification, and reminder scheduling without human handoff on the happy path. |
| Status lookup | Existing request status is loaded from saved lead and status-history records after OTP verification. |

## Import Safety

| Scenario | Expected result |
| --- | --- |
| Graph cycle check | No OTP, upload, booking, or recovery path loops to an earlier node. |
| Variable proof check | Every referenced variable is initialized or written upstream. |
| Output contract check | The build produces full export JSON with the required wrapper and no markdown. |
| Script syntax safety | Every script node compiles locally before validation passes. |
| Conditional edges | Every conditional source has one default edge. |

## Data And Records

| Scenario | Expected result |
| --- | --- |
| Product grounding | `loan_products` is the source for the product explanation text shown to the customer. |
| Guideline grounding | `loan_product_guidelines` drives indicative guidance instead of hardcoded thresholds in chat copy. |
| Checklist persistence | `loan_document_rules` and `loan_lead_documents` back the document journey. |
| Status durability | `loan_status_history` powers the request-status view rather than transient runtime values. |
| Advisor availability | `loan_advisor_slots` is the source of truth for appointment choices shown to the customer. |
| Reliable integrations | `integration_outbox` receives the CRM upsert event so saved leads are not lost if downstream systems are unavailable. |

## Content

| Scenario | Expected result |
| --- | --- |
| Production wording | User-facing copy is lender-safe, concrete, and free of underwriting promises. |
| Governance boundary | The flow never says the loan is approved or guaranteed. |
| Confirmation accuracy | Lead, advisor, amount, and appointment details in the final confirmation come from the actual saved variables. |
