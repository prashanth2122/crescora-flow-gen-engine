# FLOW Request Template

Complete this form in ordinary business language. You do not need to know node names or write code. Replace every instructional line with your answer, or write `Unknown`. The agent will ask focused questions for mandatory unknowns and must not invent them.

## 1. Generation mode

**Mode:** Create / Extend

- Choose **Create** for a new FLOW.
- Choose **Extend** only when you will supply the complete original export JSON.

**Original export for Extend mode:**

Paste or attach the complete JSON containing `version`, `exportedAt`, `bot`, `flow`, and `metadata`. Do not provide only `nodes` and `edges`.

## 2. Goal and audience

**FLOW name:**

**One-sentence business outcome:**

**Who will use it:**

**What should a successful user accomplish before the conversation ends:**

**What is explicitly out of scope:**

## 3. Channels and language

**Required channels:** Web / WhatsApp / Telegram / Email / SMS / Mixed

**Supported languages:**

**Default customer language:**

**Fallback customer language:**

**Localization mode:** `catalog_only` for new multilingual workflows / `ai_translate` only for an explicitly retained legacy workflow

**How the customer chooses or changes `preferred_language`:**

**Channel-specific restrictions or approved message templates:**

## 4. User intents and journeys

List each supported user intent and its intended result.

| User intent | Successful result | If unavailable or ineligible |
| --- | --- | --- |
|  |  |  |

**Routine work that must remain self-service:**

**Cases that genuinely require a person or specialist agent:**

## 5. Information captured from the user

List only information that the FLOW is allowed and required to collect.

| Field | Why it is needed | Required? | Validation rule | Sensitive or regulated? |
| --- | --- | --- | --- | --- |
|  |  | Yes / No |  | Yes / No |

**Information that must never be requested or displayed:**

**Existing information that may be reused instead of asking again:**

## 6. Variables and existing bot configuration

List existing non-localized bot global variables exactly as configured. Do not invent globals.

| Variable key | Meaning | Example or allowed value |
| --- | --- | --- |
|  |  |  |

**Other upstream variables supplied before this FLOW starts:**

List the existing or required customer-visible Localized Content catalog. Use
stable keys. Every key requires English, and a production multilingual catalog
must include every enabled language. Include messages, prompts, buttons, forms,
carousel copy, confirmations, and customer-visible fallback/error text.

| Localized content key | English (`en`) | Other enabled-language values | Where it is displayed |
| --- | --- | --- | --- |
|  |  |  |  |

**Readonly non-localized values that belong in Global Variables:**

**Machine-facing values that must not be localized (route values, IDs, API fields, provider template names, URLs, and similar configuration):**

## 7. Persistent records and data sources

Complete this section whenever information must survive the current conversation or be looked up later.

| Business object or lookup | Read, create, update, upsert, delete, or list | FLOW schema name | Logical collection | Unique/business key | Required fields and statuses |
| --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |

**Which facts must come from maintained records or APIs rather than chat copy:**

**Tenant, workspace, location, or branch scoping rules:**

**Idempotency, duplicate-prevention, hold, expiry, or concurrency rules:**

**PII encryption, retention, soft-delete, or audit requirements:**

## 8. External systems and integrations

Do not provide secrets. Describe the approved contract or attach safe API/integration documentation.

| System or provider | Action | Request inputs | Success response/output | Failure outcomes | Authentication/configuration already available? |
| --- | --- | --- | --- | --- | --- |
|  |  |  |  |  | Yes / No / Unknown |

**Approved notification recipients, senders, templates, and opt-in rules:**

**Appointment, payment, approval, document, OTP, scheduler, or compliance details:**

## 9. Required paths

**Happy path, step by step:**

1. _Describe the first step._

**Validation or correction path:**

**Can the user change an earlier answer? Which prompt should repeat, how many
times, which later choices become invalid, and where should exhaustion lead?**

**No-result or unavailable path:**

**Duplicate or already-completed path:**

**Integration or persistence failure path:**

**User cancellation or timeout path:**

**Safe terminal outcomes and exact final messages, if wording is mandatory:**

## 10. Business rules and decisions

List eligibility rules, pricing rules, status transitions, calculations, approvals, and other decisions. State where each rule comes from. Do not ask the agent to invent business policy.

| Rule or decision | Authoritative source | Result when true | Result when false or unknown |
| --- | --- | --- | --- |
|  |  |  |  |

## 11. Security, privacy, and governance

**Consent requirements:**

**Identity verification requirements:**

**Regulated or high-risk statements the FLOW must not make:**

**Logging, analytics, and audit events required:**

**Rate limits, retry limits, and abuse controls:**

## 12. Acceptance criteria

State observable outcomes, not implementation guesses.

- [ ] Every supported intent has a successful terminal outcome.
- [ ] Every failure has a safe recovery or justified escalation; every return
      to an earlier prompt has an attempt limit and exhausted exit.
- [ ] Confirmations reflect actual selected or saved values.
- [ ] Persistent state is written before later steps rely on it.
- [ ] No price, availability, policy, eligibility, status, or operational promise is fabricated.
- [ ] All required channels and integrations are represented.
- [ ] All stable customer-visible copy is read from Localized Content variables, including button, form, and carousel text.
- [ ] Every localized key has English and every enabled release language is complete.
- [ ] Existing behavior that must remain unchanged is listed below.

**Additional acceptance criteria:**

**For Extend mode, behavior that must remain unchanged:**

## 13. Supporting material

List or attach any approved API contracts, record schemas, policies, message templates, examples, or existing exports. Mark which source is authoritative if they disagree.

**Attachments and authority order:**
