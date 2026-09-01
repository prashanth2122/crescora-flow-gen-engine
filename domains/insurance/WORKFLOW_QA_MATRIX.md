# Workflow QA Matrix

Use this checklist before importing or releasing the insurance claim and policy workflow.

## Primary Journey

| Scenario | Expected result |
| --- | --- |
| Main menu entry | The first interactive step offers the insurance service menu and still accepts direct free-text input. |
| Main router | One main intent router directly owns the concrete insurance journeys; no nested category routers are introduced. |
| Policy help | General policy questions use grounded insurer knowledge and never invent coverage or approval outcomes. |
| Policy-specific question | Customer-specific coverage guidance requires policy lookup plus OTP verification before the answer is shown. |
| Policy details lookup | Policy number and registered-mobile lookup both work, and multiple policy matches are resolved through one forward selection step. |
| OTP verification | Any 6-digit OTP is accepted for the demo flow; 3 invalid-format attempts end the verification branch without looping backward. |
| Claim start happy path | The customer progresses from policy lookup to verified claim type selection, incident intake, draft save, checklist, documents, summary, and submitted confirmation without human handoff. |
| Draft persistence | The claim draft is written before duplicate review and before final submission so the journey can recover from drop-off. |
| Duplicate detection | Matching draft or active claims show the existing reference and ask the customer whether this is a different incident. |
| Checklist rules | Required documents are derived from the `claim_document_rules` collection, not from hardcoded text. |
| Missing document recovery | When documents remain outstanding, the flow moves forward to a second upload step or a clean `documents_pending` stop; it does not loop to the original intake node. |
| Sync pending protection | High-value claims can land in `sync_pending` with an outbox record and customer confirmation instead of forcing a restart. |
| Upload missing documents | The upload-documents journey updates the persisted claim record and distinguishes complete versus still-pending requirements. |
| Claim status | The status journey shows the persisted timeline and surfaces any outstanding document request. |
| Settlement status | The settlement journey only shows amounts or payment state that come from maintained claim-settlement records. |
| Policy service request | Routine requests stay self-service, while approval-required requests can branch into approval without blocking the rest of the domain. |
| Complaint / dispute | Dispute journeys create a grievance record, route to the claims grievance queue, and end in handoff with context. |
| Talk to agent | Agent handoff collects at least one policy, claim, or problem summary before queueing. |

## Import Safety

| Scenario | Expected result |
| --- | --- |
| Graph cycle check | No retry, fallback, upload, or dispute path loops to the same node or an earlier node. |
| Variable proof check | Every referenced template variable is initialized or written upstream. |
| Output contract check | The build produces full export JSON with the required wrapper and no markdown. |
| Script syntax safety | Every script node compiles locally before validation passes. |
| Conditional edges | Every conditional source has exactly one default edge. |

## Data And Records

| Scenario | Expected result |
| --- | --- |
| Policy lookup | `policies` records are the source of truth for product, coverage, dates, and registered customer contact. |
| Claim types | `claim_types` records drive the claim-type options shown after verification. |
| Checklist persistence | Checklist rules come from `claim_document_rules`, and claim document state is persisted to `claims`, `claim_requirements`, and `claim_documents`. |
| Status durability | `claim_status_history` is used for the timeline rather than relying only on the current claim status field. |
| Settlement lookup | `claim_settlements` is the only source for approved amount and payment state shown to the customer. |
| Reliable retries | `integration_outbox` receives the `sync_pending` submission payload so the flow does not lose a locally saved claim. |

## Content

| Scenario | Expected result |
| --- | --- |
| Production wording | User-facing copy is concrete, insurer-safe, and free of filler text. |
| Governance boundary | The flow never tells the customer that a claim is definitely approved or promises a settlement amount not present in records. |
| Confirmation accuracy | The claim summary and final confirmation use the selected policy, claim type, amount, and document counts from the actual persisted flow variables. |
| Newline rendering | Chat-visible summaries render real line breaks rather than literal `\n` text. |
