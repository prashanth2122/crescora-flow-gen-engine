# FLOW External LLM Contract

Generated from the current `bot-code-zero` source of truth on `2026-07-13`.

Use this file outside the repository when you need an external LLM to generate FLOW import-ready JSON safely. This document is standalone, but you should also give the external LLM the generated schema and node catalog snapshots from the same bundle.

## Required Companion Files

Read these before generating:

1. `flow-export-schema.snapshot.json`
2. `flow-node-catalog.snapshot.json`
3. Optionally `flow-valid-export.example.json`

## Mandatory Clarification Questions

Ask all of these before generating when the answer is not already provided:

- What business outcome should the flow achieve?
- Is this a new flow or an extension of an existing exported flow JSON?
- Which user channels must the flow support (web, WhatsApp, Telegram, email, SMS, or mixed)?
- What user data must be captured, stored, or reused later in the journey?
- What external systems, APIs, records, approvals, or notifications must be called?
- What are the required happy path, fallback path, error path, and terminal outcomes?
- Which bot global variables already exist and may be referenced safely?

## Stop And Ask Boundaries

- Stop if any required branch intent, integration contract, or captured data field is missing.
- Stop if the request would require inventing a node type, node field, route key, or metadata key.
- Stop if extending an existing flow without the exact source export JSON.
- Stop if a template variable cannot be proven from an upstream writer, a bot global variable, or an allowed system/context variable.
- Stop if approval, payment, appointment, document, or compliance behavior is underspecified.

## Output Contract

- Return full export JSON only.
- Do not return the inner `{ nodes, edges }` shape by itself.
- Do not add markdown fences, prose, comments, or explanations.
- Preserve the top-level wrapper exactly:
  - `version`
  - `exportedAt`
  - `bot`
  - `flow`
  - `metadata`

## Create Vs Extend

- **Create mode**: use when there is no source export JSON. Build the smallest production-safe flow that solves the brief.
- **Extend mode**: use when a source export JSON already exists. Preserve existing node IDs, edge IDs, route values, variable meanings, and business behavior unless the request explicitly changes them.
- In extend mode, do not rename existing IDs, do not delete working fallback/error branches, and do not change branch values casually.

## Template Variable Policy

Allowed safe system variables:

- `{{system.botId}}`
- `{{system.channel}}`
- `{{system.sessionId}}`

Allowed safe context variables:

- `{{input}}`
- `{{intent}}`
- `{{lastError}}`

Rejected shorthand forms:

- `{{botId}}`
- `{{channel}}`
- `{{sessionId}}`

Variable rules:

- Every other template variable must be written by an upstream node on the same reachable path or declared as a bot global variable.
- Do not copy placeholders from examples unless this specific flow writes them first.
- Do not use a variable for a different business meaning than the one already established upstream.

## Validator-Safe Rules

- Return full export JSON only. No markdown fences, prose, or comments.
- Top-level keys must be exactly `version`, `exportedAt`, `bot`, `flow`, and `metadata`.
- Exactly one `start` node must exist.
- Every edge `source` and `target` must reference a real node ID.
- No duplicate node IDs or edge IDs.
- No orphan or unreachable nodes.
- No `end` node may have outgoing edges.
- No conditional node may have conditional branches without exactly one default edge.
- Allowed edge condition operators are only `equals` and `contains`.
- Do not use bare `{{botId}}`, `{{channel}}`, or `{{sessionId}}`; use `{{system.botId}}`, `{{system.channel}}`, and `{{system.sessionId}}`.
- Every `{{variable}}` read must come from an upstream writer, a declared bot global variable, or an allowed system/context variable.
- Do not copy example-only placeholders such as `{{source}}`, `{{payment_status}}`, `{{customer_phone}}`, `{{consent_text}}`, or `{{ip_address}}` unless the flow writes them first.
- Do not create self-loops or ancestor back-edges unless the loop is explicitly bounded and has a clear exit path.
- Keep `metadata.nodeCount` equal to `flow.nodes.length`.

## External Usage Workflow

1. Read `flow-export-schema.snapshot.json` first.
2. Read `flow-node-catalog.snapshot.json` second.
3. Read the business brief and determine create mode or extend mode.
4. If extend mode, inventory every existing node ID, edge ID, variable, and branch value before editing.
5. Ask the mandatory clarification questions for any missing branch, channel, data, or integration detail.
6. Draft the flow.
7. Run the validator-safe checklist mentally before returning the final JSON.

## Final Pre-Output Checklist

- The output is valid JSON.
- The export wrapper is present and exact.
- `flow.version` exists with `major`, `minor`, and `patch`.
- There is exactly one `start` node.
- All nodes are reachable from start.
- No unsupported node type or unsupported edge operator appears.
- Every conditional branch has one intended default route.
- Every terminal path ends intentionally.
- Every template variable is proven.
- `metadata.nodeCount` matches the node array length.

## Node Catalog

## `start` - Conversation Start

Category: `basic`

**Purpose**
Defines the single entry point to a flow and hands control to the first business step.

**When To Use**
- Launch a welcome journey for every new user.
- Enter a campaign-specific flow with prefills or source tags.
- Create one predictable entry point for testing, debugging, and analytics.

**Limitations**
- Must have exactly one outgoing edge.
- Should not branch or use conditional routing.
- Any missing next step makes the flow unreachable.

**Edge Expectations**
Connect Start directly to one next node. It does not emit route keys and it does not support branching.

- Outgoing edges: exactly 1
- Conditional edges: not supported
- Default edge: not used
- Best next node: message, input, intent-router, or setVariable

**Route Outcomes**
- No named route outcomes documented beyond the graph edges you define.

**Config Fields**
None.

**Runtime Defaults**None.

**Variable Behavior**
- Writes: none documented
- Reads: none documented
- This node mainly controls graph flow rather than introducing new runtime variables.

Docs anchor: `/docs/flow-node-playbook#node-start`

## `message` - Response Message

Category: `basic`

**Purpose**
Sends user-visible messages that explain, confirm, prompt, or guide the next step in the flow.

**When To Use**
- Welcome users and explain the next expected action.
- Send policy, pricing, or status information in clear language.
- Provide post-action confirmations such as ticket created or payment received.
- Set context before input, decision, or handover nodes.

**Limitations**
- Empty message arrays create silent steps that feel broken.
- Very long text reduces readability on mobile-first channels.
- Should be combined with input/decision nodes for interactive paths.

**Edge Expectations**
Message can connect to the next interactive or informational step. It usually has one outgoing edge, but can branch when the message is only setting context before different outcomes.

- Outgoing edges: 1 or more
- Conditional edges: supported downstream, not on the message itself
- Default edge: recommended when the message has multiple paths
- Best next nodes: input, decision, media, handover, end, or fallback

**Route Outcomes**
- No named route outcomes documented beyond the graph edges you define.

**Config Fields**
- `messages` (messages): Bot Messages.
- `buttons` (buttons): Optional Buttons.

**Runtime Defaults**
```json
{
  "messages": [
    ""
  ],
  "buttons": []
}
```

**Variable Behavior**
- Writes: none documented
- Reads: none documented
- This node mainly controls graph flow rather than introducing new runtime variables.

Docs anchor: `/docs/flow-node-playbook#node-message`

## `email` - Email Dispatch

Category: `integration`

**Purpose**
Builds and dispatches an email from runtime templates, variables, and provider settings, then stores the send result for later use.

**When To Use**
- Send transactional updates like order, appointment, or case status.
- Deliver follow-up documents, invoices, or onboarding instructions.
- Trigger internal or external escalation emails with context details.
- Send a confirmation or receipt after a flow action completes.

**Limitations**
- Requires a configured backend email provider and verified sender setup.
- Invalid recipient format or blocked domains can cause delivery failure.
- HTML-heavy templates may render differently across email clients.
- This node does not branch on send outcome by itself; inspect outputVar.status in a later node if needed.

**Edge Expectations**
Email is usually used as a single linear step. Connect it to one next node, and use a later decision node if you need to branch on the stored send result.

- Outgoing edges: 1
- Conditional edges: not on email itself
- Default edge: recommended for linear flow
- Best next nodes: decision, message, handover, fallback, or end

**Route Outcomes**
- No named route outcomes documented beyond the graph edges you define.

**Config Fields**
- `to` (text) required: To (comma separated emails).
- `cc` (text): CC (optional).
- `bcc` (text): BCC (optional).
- `replyTo` (text): Reply-To (optional).
- `subject` (text) required: Subject.
- `body` (textarea) required: Body Template.
- `bodyType` (select): Body Type. Options: text, html.
- `emitConfirmation` (boolean): Emit Confirmation Message.
- `outputVar` (text): Save result as.

**Runtime Defaults**
```json
{
  "to": "",
  "cc": "",
  "bcc": "",
  "replyTo": "",
  "subject": "Update for {{name}}",
  "body": "Hello {{name}},\n\nYour update is ready.\n\n- Team",
  "bodyType": "text",
  "emitConfirmation": false,
  "outputVar": "emailResult"
}
```

**Variable Behavior**
- Writes: `data.outputVar` when configured
- Reads: recipient, subject, and body templates
- Email nodes are linear; branch on the saved result in later nodes if needed.

Docs anchor: `/docs/flow-node-playbook#node-email`

## `sms` - SMS Dispatch

Category: `integration`

**Purpose**
Builds and dispatches SMS content using runtime variables and provider routing, then stores the delivery result for later use.

**When To Use**
- Send reminders, OTP notifications, or short transactional alerts.
- Deliver urgent follow-ups when users are not active in chat.
- Share compact status updates that require high open rates.
- Send a short fallback notice when chat or email is not ideal.

**Limitations**
- Requires an SMS gateway integration in runtime dependencies.
- Carrier and country compliance rules differ by destination.
- Long messages may be split or truncated based on provider behavior.
- This node does not branch on delivery outcome by itself; inspect outputVar.status later if needed.

**Edge Expectations**
SMS is generally a linear step. Connect it to one next node, and branch later if you need to inspect the stored result or follow up differently.

- Outgoing edges: 1
- Conditional edges: not on sms itself
- Default edge: recommended for a linear journey
- Best next nodes: decision, message, handover, fallback, or end

**Route Outcomes**
- No named route outcomes documented beyond the graph edges you define.

**Config Fields**
- `to` (text) required: To (phone number).
- `templateName` (text): Provider Template Name (optional).
- `peid` (text): DLT PEID (optional).
- `ctid` (text): DLT CTID (optional).
- `templateVariablesJson` (textarea): Template Variables JSON (optional).
- `messageTemplate` (textarea) required: SMS Template.
- `senderId` (text): Sender ID (optional).
- `emitConfirmation` (boolean): Emit Confirmation Message.
- `outputVar` (text): Save result as.

**Runtime Defaults**
```json
{
  "to": "",
  "templateName": "",
  "peid": "",
  "ctid": "",
  "templateVariablesJson": "",
  "messageTemplate": "Hi {{name}}, your request is received.",
  "senderId": "",
  "emitConfirmation": false,
  "outputVar": "smsResult"
}
```

**Variable Behavior**
- Writes: `data.outputVar` when configured
- Reads: recipient and message templates
- Use short, channel-safe text and define a later failure branch if required.

Docs anchor: `/docs/flow-node-playbook#node-sms`

## `otp` - OTP Verification

Category: `integration`

**Purpose**
Generates and delivers a backend-only OTP over SMS, WhatsApp, email, or multiple channels, then waits for secure verification.

**When To Use**
- Verify mobile numbers or email addresses before booking, signup, or consent steps.
- Send one OTP across fallback channels while keeping the code out of the chat UI.
- Gate high-risk actions behind bounded resend and verification-attempt limits.

**Limitations**
- Provider delivery still depends on configured SMS, email, and WhatsApp integrations.
- WhatsApp delivery outside the active customer window usually requires an approved template.
- This node should not store or expose OTP values in downstream variables or UI copy.

**Edge Expectations**
OTP Verification is a blocking node. It waits internally for code entry and resend actions, then routes only when verification succeeds, attempts are exhausted, or delivery cannot be completed.

- Outgoing edges: up to 3
- Route outcomes: verified, failed, delivery_failed
- Conditional edges: supported through the node route outcomes
- Best next nodes: form, approval, api, message, or fallback

**Route Outcomes**
- verified
- failed
- delivery_failed

**Config Fields**
- `promptText` (textarea): Prompt Text.
- `channels` (multiSelect): Delivery Channels. Options: sms, whatsapp, email.
- `phone` (text): Shared Phone Variable.
- `smsPhone` (text): SMS Phone Override.
- `whatsappPhone` (text): WhatsApp Phone Override.
- `email` (text): Email Variable.
- `defaultCountryCode` (text): Default Country Code.
- `codeLength` (number): OTP Length.
- `otpTtlSeconds` (number): OTP TTL (seconds).
- `resendCooldownSeconds` (number): Resend Cooldown (seconds).
- `maxResends` (number): Max Resends.
- `maxAttempts` (number): Max Verify Attempts.
- `smsMessageTemplate` (textarea): SMS Message Template.
- `smsTemplateName` (text): SMS Template Name.
- `smsTemplateVariablesJson` (textarea): SMS Template Variables JSON.
- `smsSenderId` (text): SMS Sender ID.
- `smsPeid` (text): SMS PEID.
- `smsCtid` (text): SMS CTID.
- `whatsappMessageTemplate` (textarea): WhatsApp Message Template.
- `whatsappTemplateName` (text): WhatsApp Template Name.
- `whatsappTemplateLanguage` (text): WhatsApp Template Language.
- `whatsappTemplateVariablesJson` (textarea): WhatsApp Template Variables JSON.
- `emailSubject` (text): Email Subject.
- `emailBody` (textarea): Email Body.
- `emailBodyType` (select): Email Body Type. Options: text, html.
- `emailReplyTo` (text): Email Reply-To.
- `outputVar` (text): Save Result As.

**Runtime Defaults**
```json
{
  "promptText": "Enter the verification code to continue.",
  "channels": [
    "sms"
  ],
  "phone": "{{phone}}",
  "smsPhone": "",
  "whatsappPhone": "",
  "email": "{{email}}",
  "codeLength": 6,
  "otpTtlSeconds": 600,
  "resendCooldownSeconds": 30,
  "maxResends": 3,
  "maxAttempts": 5,
  "defaultCountryCode": "+91",
  "smsMessageTemplate": "Your verification code is {{otp}}. It expires in {{otp_ttl_minutes}} minutes.",
  "smsTemplateName": "",
  "smsTemplateVariablesJson": "{\n  \"1\": \"{{otp}}\"\n}",
  "smsSenderId": "",
  "smsPeid": "",
  "smsCtid": "",
  "whatsappMessageTemplate": "Your verification code is {{otp}}. It expires in {{otp_ttl_minutes}} minutes.",
  "whatsappTemplateName": "",
  "whatsappTemplateLanguage": "en",
  "whatsappTemplateVariablesJson": "{\n  \"1\": \"{{otp}}\"\n}",
  "emailSubject": "Your verification code",
  "emailBody": "Your verification code is {{otp}}. It expires in {{otp_ttl_minutes}} minutes.",
  "emailBodyType": "text",
  "emailReplyTo": "",
  "outputVar": "otp_result"
}
```

**Variable Behavior**
- Writes: `data.outputVar`
- Reads: channel selection, recipient templates, resend limits, and OTP delivery templates
- OTP nodes must never persist or expose the generated code in user-visible variables or transcript rows.

Docs anchor: `/docs/flow-node-playbook#node-otp`

## `notification` - Unified Notification

Category: `integration`

**Purpose**
Sends unified multi-channel notifications (WhatsApp/SMS/Email) with fallback strategy and dedupe handling.

**When To Use**
- Send appointment confirmations and reminders across preferred channels.
- Notify customer and internal team in one node execution.
- Fallback from WhatsApp to SMS/email when session/provider delivery fails.

**Limitations**
- Channel delivery depends on configured provider dependencies.
- Template variables must resolve when strict template validation is enabled.
- Dedupe only works when idempotency keys are stable and meaningful.

**Edge Expectations**
Notification should connect each delivery outcome to a clear next step. It usually exposes three routes so the flow can react to full success, partial success, or total failure.

- Outgoing edges: 3
- Route outcomes: sent, partially_sent, failed
- Conditional edges: supported through the node's route outcomes
- Best next nodes: end, message, handover, fallback, or decision

**Route Outcomes**
- No named route outcomes documented beyond the graph edges you define.

**Config Fields**
- `recipientsJson` (textarea) required: Recipients JSON.
- `channelsJson` (textarea) required: Channels JSON.
- `strategy` (select): Delivery Strategy. Options: first_success, send_all, priority_order.
- `messageCategory` (select): Message Category. Options: transactional, promotional, service.
- `dedupeKey` (text): Idempotency Key (optional).
- `defaultCountryCode` (text): Default Country Code.
- `strictTemplateValidation` (boolean): Fail If Template Variables Missing.
- `outputVar` (text): Save Result As.

**Runtime Defaults**
```json
{
  "recipients": [
    {
      "type": "customer",
      "phone": "{{customer_phone}}",
      "email": "{{customer_email}}"
    }
  ],
  "recipientsJson": "[\n  {\n    \"type\": \"customer\",\n    \"phone\": \"{{customer_phone}}\",\n    \"email\": \"{{customer_email}}\"\n  }\n]",
  "channels": [
    {
      "type": "whatsapp",
      "templateId": "appointment_confirmed",
      "enabled": true
    },
    {
      "type": "sms",
      "message": "Your appointment is confirmed for {{slot_label}}",
      "enabled": true
    },
    {
      "type": "email",
      "subject": "Appointment confirmed",
      "body": "Your appointment is confirmed for {{slot_label}}",
      "enabled": true
    }
  ],
  "channelsJson": "[\n  {\n    \"type\": \"whatsapp\",\n    \"templateId\": \"appointment_confirmed\",\n    \"enabled\": true\n  },\n  {\n    \"type\": \"sms\",\n    \"message\": \"Your appointment is confirmed for {{slot_label}}\",\n    \"enabled\": true\n  },\n  {\n    \"type\": \"email\",\n    \"subject\": \"Appointment confirmed\",\n    \"body\": \"Your appointment is confirmed for {{slot_label}}\",\n    \"enabled\": true\n  }\n]",
  "strategy": "priority_order",
  "messageCategory": "transactional",
  "dedupeKey": "",
  "defaultCountryCode": "+91",
  "strictTemplateValidation": true,
  "outputVar": "notification_result"
}
```

**Variable Behavior**
- Writes: `data.outputVar`
- Reads: recipients, channels, dedupe key, and notification templates
- Channel destination data must already exist for every enabled path.

Docs anchor: `/docs/flow-node-playbook#node-notification`

## `media` - Media Attachment

Category: `basic`

**Purpose**
Sends a file attachment or media URL with optional caption and display filename.

**When To Use**
- Share brochures, invoices, reports, and verification documents.
- Send tutorial images/videos to reduce support back-and-forth.
- Attach policy PDFs or forms required for downstream actions.

**Limitations**
- Requires publicly reachable URLs from end-user channels.
- Large files can fail on weak networks or strict channel limits.
- Some channels may not support all media types uniformly.

**Edge Expectations**
Media is a linear send step. It emits the attachment message and then continues to exactly one next node; use the next node for any branching or confirmation logic.

- Outgoing edges: 1
- Conditional edges: not on media itself
- Default edge: required to continue the flow
- Best next nodes: input, decision, handover, fallback, or end

**Route Outcomes**
- No named route outcomes documented beyond the graph edges you define.

**Config Fields**
- `mediaType` (select) required: Media Type. Options: image, pdf, doc, file, video, audio.
- `url` (text) required: File URL.
- `caption` (textarea): Caption.
- `fileName` (text): File Name.

**Runtime Defaults**
```json
{
  "mediaType": "image",
  "url": "",
  "caption": "",
  "fileName": ""
}
```

**Variable Behavior**
- Writes: none documented
- Reads: none documented
- This node mainly controls graph flow rather than introducing new runtime variables.

Docs anchor: `/docs/flow-node-playbook#node-media`

## `carousel` - Rich Carousel

Category: `basic`

**Purpose**
Displays multiple cards/slides in a structured, scrollable layout for guided selection, with either static slides or slides generated from array data.

**When To Use**
- Compare plans, packages, departments, or recommended options.
- Show featured products, offers, or onboarding steps visually.
- Drive faster user decisions with card-based CTAs.

**Limitations**
- Requires well-formed slide JSON to render correctly.
- Card-heavy content can become cluttered without concise copy.
- Channels without carousel support require text fallback handling.

**Edge Expectations**
Carousel is a linear presentation step. It renders the cards and then continues to exactly one next node; any branching or fallback handling should happen after the carousel step.

- Outgoing edges: 1
- Conditional edges: not on carousel itself
- Default edge: required to continue the flow
- Best next nodes: input, decision, handover, fallback, or end

**Route Outcomes**
- No named route outcomes documented beyond the graph edges you define.

**Config Fields**
- `introText` (textarea): Intro Text.
- `slidesMode` (select): Slide Mode. Options: static, dynamic.
- `designPreset` (select): Design Preset. Options: modern, glass, bold, minimal, custom.
- `cardLayout` (select): Card Layout. Options: stacked, split, spotlight.
- `cardSize` (select): Card Size. Options: compact, comfortable, expanded.
- `showPagination` (boolean): Show Pagination Dots.
- `autoAdvanceMs` (number): Auto Advance (ms, 0 disables).
- `customCss` (textarea): Custom Card Style (JSON).
- `slidesSource` (text): Dynamic Slide Source.
- `slideTemplateJson` (textarea) required: Dynamic Slide Template JSON.
- `slidesJson` (textarea) required: Static Slides JSON.

**Runtime Defaults**
```json
{
  "introText": "Explore the options below.",
  "slidesMode": "static",
  "designPreset": "modern",
  "cardLayout": "stacked",
  "cardSize": "comfortable",
  "showPagination": true,
  "autoAdvanceMs": 0,
  "customCss": "",
  "slidesSource": "",
  "slides": [
    {
      "id": "plan_1",
      "type": "card",
      "eyebrow": "Popular choice",
      "icon": "plus",
      "title": "Starter Plan",
      "heading": "Xpert Health Basic",
      "description": "Best for quick launches and pilot teams.",
      "paragraphs": [
        "Home collection support is included.",
        "Use this plan when speed matters more than customization."
      ],
      "badges": [
        "Home Collection",
        "Fast Launch"
      ],
      "fields": {
        "Price": "Rs 1,899",
        "SLA": "Business hours"
      },
      "bullets": [
        "WhatsApp support",
        "Operator dashboard"
      ],
      "footer": "Best for first deployments.",
      "cta": {
        "label": "Book Demo",
        "value": "book_demo"
      }
    },
    {
      "id": "slide_2",
      "type": "text",
      "title": "Need Enterprise?",
      "description": "Enable SSO, audit logs, and advanced orchestration."
    }
  ],
  "slidesJson": "[\n  {\n    \"id\": \"plan_1\",\n    \"type\": \"card\",\n    \"eyebrow\": \"Popular choice\",\n    \"icon\": \"plus\",\n    \"title\": \"Starter Plan\",\n    \"heading\": \"Xpert Health Basic\",\n    \"description\": \"Best for quick launches and pilot teams.\",\n    \"paragraphs\": [\n      \"Home collection support is included.\",\n      \"Use this plan when speed matters more than customization.\"\n    ],\n    \"badges\": [\n      \"Home Collection\",\n      \"Fast Launch\"\n    ],\n    \"fields\": {\n      \"Price\": \"Rs 1,899\",\n      \"SLA\": \"Business hours\"\n    },\n    \"bullets\": [\n      \"WhatsApp support\",\n      \"Operator dashboard\"\n    ],\n    \"footer\": \"Best for first deployments.\",\n    \"cta\": {\n      \"label\": \"Book Demo\",\n      \"value\": \"book_demo\"\n    }\n  },\n  {\n    \"id\": \"slide_2\",\n    \"type\": \"text\",\n    \"title\": \"Need Enterprise?\",\n    \"description\": \"Enable SSO, audit logs, and advanced orchestration.\"\n  }\n]",
  "slideTemplateJson": "{\n  \"id\": \"slide_template\",\n  \"type\": \"card\",\n  \"eyebrow\": \"{{item.category}}\",\n  \"heading\": \"{{item.title}}\",\n  \"title\": \"{{item.subtitle}}\",\n  \"description\": \"{{item.description}}\",\n  \"paragraphs\": [\n    \"{{item.summary}}\"\n  ],\n  \"badges\": [\n    \"{{item.tag}}\"\n  ],\n  \"imageUrl\": \"{{item.imageUrl}}\",\n  \"fields\": {\n    \"Price\": \"{{item.price}}\"\n  },\n  \"actions\": [\n    {\n      \"label\": \"Select\",\n      \"value\": \"{{item.id}}\"\n    }\n  ]\n}"
}
```

**Variable Behavior**
- Writes: none documented
- Reads: none documented
- This node mainly controls graph flow rather than introducing new runtime variables.

Docs anchor: `/docs/flow-node-playbook#node-carousel`

## `form` - Form Intake

Category: `basic`

**Purpose**
Collects structured multi-field input, stores it as a reusable payload, and maps fields into conversation variables when enabled.

**When To Use**
- Capture lead qualification and profile details in one step.
- Collect registration or admission data with required fields.
- Gather standardized data before API submission or escalation.
- Map each submitted field into reusable variables for later nodes.

**Limitations**
- Large forms reduce completion rates and increase user drop-off.
- Field design quality directly impacts response quality.
- Advanced validation rules should be configured carefully so retry guidance stays understandable.
- The node is linear and should continue to exactly one next step after capture.
- The chat textbox should stay disabled while the form bubble is active so users submit through the form controls instead of free text.
- Structured form replies are stored as readable internal transcript rows instead of raw JSON blobs in the visible chat.

**Edge Expectations**
Form is a linear capture step. It waits for the user payload, validates required fields, stores the structured object, and then continues to exactly one next node.

- Outgoing edges: 1
- Conditional edges: not on form itself
- Default edge: required to continue the flow
- Best next nodes: message, api, decision, handover, or end

**Route Outcomes**
- No named route outcomes documented beyond the graph edges you define.

**Config Fields**
- `messages` (messages): Prompt Messages.
- `fieldsJson` (textarea): Form Fields JSON.
- `outputVar` (text): Save Form As.
- `mapToVariables` (boolean): Map Fields To Vars.

**Runtime Defaults**
```json
{
  "messages": [
    "Please submit the form details as JSON."
  ],
  "fields": [
    {
      "key": "name",
      "label": "Full Name",
      "type": "text",
      "required": true
    },
    {
      "key": "email",
      "label": "Email",
      "type": "email",
      "required": true
    }
  ],
  "fieldsJson": "[\n  {\n    \"key\": \"name\",\n    \"label\": \"Full Name\",\n    \"type\": \"text\",\n    \"required\": true\n  },\n  {\n    \"key\": \"email\",\n    \"label\": \"Email\",\n    \"type\": \"email\",\n    \"required\": true\n  }\n]",
  "outputVar": "formData",
  "mapToVariables": true,
  "submitLabel": "Submit",
  "selectPlaceholder": "Select",
  "formErrorMessage": "Please fix the highlighted fields."
}
```

**Variable Behavior**
- Writes: `data.outputVar`, field keys when `mapToVariables` is enabled
- Reads: none documented
- Form writes a full payload and can optionally fan out field-level variables.

Docs anchor: `/docs/flow-node-playbook#node-form`

## `appointment` - Appointment Booking

Category: `basic`

**Purpose**
Captures a user-selected date and time slot, stores appointment metadata, and continues to exactly one next step.

**When To Use**
- Book clinic consultations, site visits, or service appointments.
- Collect preferred schedule details before agent confirmation.
- Store booking details for confirmation, CRM sync, or agent review.
- Guide users through date selection first and slot selection second.

**Limitations**
- Slot logic depends on valid slot configuration and IDs.
- Timezone handling must be explicit and drives the generated date chips for multi-region users.
- Dynamic and static slot records can mark a slot as booked with booked/isBooked/is_booked, metadata availability flags, available=false, or a booked/reserved/unavailable status.
- Booked slot display can hide, show with strikethrough, or show as disabled; booked slots are nonselectable in both visible modes, including via typed input.
- Needs clear retry guidance when no suitable slot is available.
- The node is linear and should continue to one downstream step after a booking is chosen.

**Edge Expectations**
Appointment is a linear booking step. It validates the date and slot inside the node, stores the booking payload, and then continues to exactly one next node.

- Outgoing edges: 1
- Conditional edges: not on appointment itself
- Default edge: required to continue the flow
- Best next nodes: message, api, handover, decision, or end

**Route Outcomes**
- No named route outcomes documented beyond the graph edges you define.

**Config Fields**
- `messages` (messages): Prompt Messages.
- `slotMode` (select): Slot Source Mode. Options: dynamic, static.
- `timezone` (text): Timezone (IANA).
- `slotIntervalMins` (number): Slot Gap (mins).
- `slotDurationMins` (number): Slot Duration (mins).
- `horizonDays` (number): Bookable Days Ahead.
- `maxSlotsPerDay` (number): Max Slots Per Day.
- `workingHoursStart` (text): Working Hours Start (HH:mm).
- `workingHoursEnd` (text): Working Hours End (HH:mm).
- `availableWeekdays` (text): Available Weekdays (0-6 csv).
- `dynamicSlotsVar` (text): Dynamic Slots Variable.
- `dynamicSlotsPath` (text): Dynamic Slots Path.
- `bookedSlotBehavior` (select): Booked Slot Display. Options: hide, strikethrough, disable.
- `slotsJson` (textarea): Static Slots JSON.
- `dateVar` (text): Save Date As.
- `outputVar` (text): Save Booking As.

**Runtime Defaults**
```json
{
  "messages": [
    "Please choose your appointment date and preferred time slot."
  ],
  "slotMode": "dynamic",
  "timezone": "Asia/Kolkata",
  "slotIntervalMins": 15,
  "slotDurationMins": 15,
  "horizonDays": 30,
  "maxSlotsPerDay": 16,
  "workingHoursStart": "09:00",
  "workingHoursEnd": "18:00",
  "availableWeekdays": "1,2,3,4,5,6",
  "dynamicSlotsVar": "",
  "dynamicSlotsPath": "",
  "bookedSlotBehavior": "hide",
  "slots": [
    {
      "id": "slot_1",
      "label": "10:00 AM",
      "start": "10:00",
      "end": "10:15"
    },
    {
      "id": "slot_2",
      "label": "03:00 PM",
      "start": "15:00",
      "end": "15:15"
    }
  ],
  "slotsJson": "[\n  {\n    \"id\": \"slot_1\",\n    \"label\": \"10:00 AM\",\n    \"start\": \"10:00\",\n    \"end\": \"10:15\"\n  },\n  {\n    \"id\": \"slot_2\",\n    \"label\": \"03:00 PM\",\n    \"start\": \"15:00\",\n    \"end\": \"15:15\"\n  }\n]",
  "outputVar": "appointmentBooking",
  "dateVar": "appointmentDate"
}
```

**Variable Behavior**
- Writes: `data.dateVar`, `data.outputVar`
- Reads: slot source variables and templated messages
- Appointment flows should define date and booking result variables explicitly.

Docs anchor: `/docs/flow-node-playbook#node-appointment`

## `payment` - Payment Collection

Category: `integration`

**Purpose**
Collects payment acknowledgment, stores the result, and routes the flow after the payment is marked paid or failed.

**When To Use**
- Collect admission, booking, or subscription payments.
- Share payment links and branch on paid or failed outcomes.
- Store payment status for downstream fulfillment or escalation.
- Verify payment links with Razorpay or manual user confirmation.

**Limitations**
- Manual mode relies on user confirmation instead of gateway validation.
- Provider auto-verify needs valid gateway credentials and API access.
- Incorrect amount/currency config can block payment completion.
- Pending Razorpay checks stay in the node until the payment is verified or marked failed.

**Edge Expectations**
Payment is an acknowledgment step with two routed outcomes after completion: paid or failed. Pending verification is handled inside the node as awaiting input, not as a separate outgoing branch.

- Outgoing edges: 2
- Route outcomes: paid, failed
- Conditional edges: route paid/failed after the payment result is confirmed
- Best next nodes: message, api, handover, decision, or end

**Route Outcomes**
- paid
- failed

**Config Fields**
- `messages` (messages): Prompt Messages.
- `amount` (text): Amount.
- `currency` (text): Currency.
- `provider` (select): Provider. Options: manual, razorpay.
- `autoVerify` (boolean): Auto Verify (Gateway Status).
- `paymentLink` (text): Payment Link.
- `description` (text): Payment Description.
- `customerName` (text): Customer Name (optional).
- `customerEmail` (text): Customer Email (optional).
- `customerContact` (text): Customer Phone (optional).
- `notifySms` (boolean): Notify by SMS.
- `notifyEmail` (boolean): Notify by Email.
- `expireMinutes` (number): Link Expiry (minutes).
- `callbackUrl` (text): Callback URL (optional).
- `notesJson` (textarea): Provider Notes JSON (optional).
- `outputVar` (text): Save Payment As.

**Runtime Defaults**
```json
{
  "messages": [
    "Complete payment and reply: PAID <reference>."
  ],
  "amount": "0",
  "currency": "INR",
  "paymentLink": "",
  "outputVar": "paymentStatus",
  "provider": "manual",
  "autoVerify": true,
  "description": "",
  "customerName": "",
  "customerEmail": "",
  "customerContact": "",
  "notifySms": false,
  "notifyEmail": false,
  "expireMinutes": 30,
  "callbackUrl": "",
  "notesJson": ""
}
```

**Variable Behavior**
- Writes: `data.outputVar`
- Reads: templated amount, customer, and callback fields
- Do not assume payment metadata exists unless it is written earlier in the same path.

Docs anchor: `/docs/flow-node-playbook#node-payment`

## `document-intake` - Document Collection

Category: `basic`

**Purpose**
Collects and validates user-submitted documents, stores the accepted files, and continues to exactly one next step.

**When To Use**
- Run KYC or compliance document intake flows.
- Collect admission, onboarding, or claims paperwork.
- Enforce minimum document count before escalation.
- Normalize document uploads into a reusable variable for verification or review.

**Limitations**
- Web chat renders the upload picker as a message-level capture card and disables the global text input while documents are required.
- Programmatic callers can still send JSON arrays, but web chat expects real uploaded files.
- Type checks are extension-based and not deep file inspection.
- Should include retry/help messaging for upload errors.
- The node is linear and should continue to one downstream step after valid documents are captured.

**Edge Expectations**
Document Intake is a linear capture step. It validates uploaded files, stores accepted documents, and then continues to exactly one next node.

- Outgoing edges: 1
- Conditional edges: not on document-intake itself
- Default edge: required to continue the flow
- Best next nodes: message, api, handover, decision, or end

**Route Outcomes**
- No named route outcomes documented beyond the graph edges you define.

**Config Fields**
- `messages` (messages): Prompt Messages.
- `acceptedTypesText` (text): Accepted Types (csv).
- `minDocuments` (number): Minimum Documents.
- `outputVar` (text): Save Documents As.

**Runtime Defaults**
```json
{
  "messages": [
    "Upload the required documents using the file picker."
  ],
  "acceptedTypes": [
    "pdf",
    "jpg",
    "png",
    "webp",
    "bmp",
    "tiff",
    "gif"
  ],
  "acceptedTypesText": "pdf,jpg,jpeg,png,webp,bmp,tiff,gif",
  "minDocuments": 1,
  "outputVar": "documents"
}
```

**Variable Behavior**
- Writes: `data.outputVar`
- Reads: none documented
- Use the saved document payload downstream for OCR, records, or approvals.

Docs anchor: `/docs/flow-node-playbook#node-document-intake`

## `file-processor` - File Processing / OCR

Category: `integration`

**Purpose**
Reads uploaded files for OCR/classification/field extraction and routes by success, partial, low confidence, invalid file, manual review, or failure.

**When To Use**
- Extract KYC fields from ID proofs and invoices.
- Validate uploaded document type before downstream processing.
- Compare extracted document values against form-provided values.

**Limitations**
- Low quality scans require retry/manual review routing.
- Sensitive docs need masking and retention controls.
- Extraction confidence must be tuned for production data quality.

**Edge Expectations**
File Processor is a fan-out document step. Connect success-like outcomes to the next business action and send review or failure outcomes to explicit recovery branches.

- Outgoing edges: 6
- Route outcomes: success, partial, low_confidence, invalid_file, manual_review_required, failed
- Conditional edges: not on file-processor itself
- Default edge: not used
- Best next nodes: record, approval, message, decision, fallback, or end

**Route Outcomes**
- success
- partial
- low_confidence
- invalid_file
- manual_review_required
- failed

**Config Fields**
- `inputFiles` (text): Input Files Variable/Template.
- `processingMode` (select): Processing Mode. Options: ocr, classify, extract_fields, validate, summarize.
- `acceptedTypesText` (text): Accepted Types (csv).
- `maxFileSizeMb` (number): Max File Size (MB).
- `schemaJson` (textarea): Field Schema JSON.
- `expectedDocumentType` (text): Expected Document Type.
- `confidenceThreshold` (number): Confidence Threshold.
- `strictExtraction` (boolean): Strict Extraction.
- `pageMode` (select): Page Mode. Options: process_first_page, process_all_pages, extract_selected_pages.
- `selectedPagesText` (text): Selected Pages (csv).
- `outputVar` (text): Save Result As.

**Runtime Defaults**
```json
{
  "inputFiles": "{{documents.documents}}",
  "processingMode": "extract_fields",
  "acceptedTypes": [
    "pdf",
    "jpg",
    "png",
    "webp",
    "bmp",
    "tiff",
    "gif"
  ],
  "acceptedTypesText": "pdf,jpg,jpeg,png,webp,bmp,tiff,gif",
  "maxFileSizeMb": 10,
  "schema": {},
  "schemaJson": "{\n  \"name\": \"string\",\n  \"document_number\": \"string\",\n  \"date_of_birth\": \"date\",\n  \"address\": \"string\"\n}",
  "expectedDocumentType": "",
  "confidenceThreshold": 0.8,
  "strictExtraction": true,
  "pageMode": "process_all_pages",
  "selectedPagesText": "",
  "outputVar": "doc_result"
}
```

**Variable Behavior**
- Writes: `data.outputVar`
- Reads: `data.inputFiles` and extraction templates
- Upstream document variables must exist before file processing begins.

Docs anchor: `/docs/flow-node-playbook#node-file-processor`

## `script` - Custom Script

Category: `advanced`

**Purpose**
Runs custom JavaScript for transformations, generated IDs, and route-control signals, then routes by success or failure.

**When To Use**
- Generate appointment IDs, reference numbers, or other business identifiers.
- Normalize and reshape payloads before record, API, or AI nodes.
- Compute scoring, flags, or composite objects for downstream routing.
- Persist shared runtime variables with vars.some_key for later nodes.

**Limitations**
- Keep logic deterministic and testable where possible.
- Avoid long-running or heavy network work inside the script body.
- Scripts run inside a sandbox and should return JSON-safe values.
- Failure writes a lastScriptError entry and routes to the failure branch.

**Edge Expectations**
Script is a branching logic step with two outcomes: success and failure. Use success for the computed result path and failure for errors or invalid script output.

- Outgoing edges: 2
- Route outcomes: success, failure
- Conditional edges: based on the script execution result
- Best next nodes: condition, setVariable, api, message, fallback, or end

**Route Outcomes**
- success
- failure

**Config Fields**
- `script` (textarea): Script Code.
- `outputVar` (text): Save Script Output As.
- `timeoutMs` (number): Timeout (ms).

**Runtime Defaults**
```json
{
  "script": "const amount = Number(vars.amount ?? 0);\\nconst appointmentId = `APT-${helpers.nowIso().slice(0, 10).replace(/-/g, '')}-${helpers.randomInt(1000, 9999)}`;\\nreturn { eligible: amount >= 1000, score: amount, appointmentId };",
  "outputVar": "scriptResult",
  "timeoutMs": 50
}
```

**Variable Behavior**
- Writes: `data.outputVar`, any `vars.*` assignment inside the script, `lastScriptError`
- Reads: script body templates and runtime context
- Prefer explicit, stable variable names when a script writes to `vars`.

Docs anchor: `/docs/flow-node-playbook#node-script`

## `track-event` - Analytics / Track Event

Category: `integration`

**Purpose**
Emits business analytics events from flow execution with non-blocking failure handling and safe property masking.

**When To Use**
- Track lead capture, appointment booking, and payment outcomes.
- Record AI fallback/handover/drop-off events for funnel diagnostics.
- Feed tenant-level analytics dashboards with consistent event schema.

**Limitations**
- Event quality depends on stable event naming taxonomy.
- Sensitive fields must be masked or omitted before ingestion.
- Over-tracking without dedupe/throttle can create noisy dashboards.

**Edge Expectations**
Track Event is usually a non-blocking telemetry step. Connect success to the next business node, and use a failure branch only when analytics must be enforced.

- Outgoing edges: 2
- Route outcomes: tracked, failed
- Conditional edges: only when failurePolicy is route_failed
- Best next nodes: end, message, decision, or fallback

**Route Outcomes**
- No named route outcomes documented beyond the graph edges you define.

**Config Fields**
- `eventName` (text): Event Name.
- `propertiesJson` (textarea): Event Properties JSON.
- `failurePolicy` (select): Failure Policy. Options: fire_and_continue, route_failed.
- `dedupeKey` (text): Dedupe Key.
- `throttleSeconds` (number): Throttle Seconds.
- `piiMasking` (boolean): Mask Sensitive Properties.
- `outputVar` (text): Save Result As.

**Runtime Defaults**
```json
{
  "eventName": "lead_created",
  "properties": {},
  "propertiesJson": "{\n  \"department\": \"{{department}}\",\n  \"source\": \"{{source}}\",\n  \"payment_status\": \"{{payment_status}}\"\n}",
  "outputVar": "track_result",
  "failurePolicy": "fire_and_continue",
  "dedupeKey": "",
  "throttleSeconds": 60,
  "piiMasking": true
}
```

**Variable Behavior**
- Writes: `data.outputVar` when configured
- Reads: event name, properties, dedupe key
- Event properties must not rely on undefined placeholders or unstored business metadata.

Docs anchor: `/docs/flow-node-playbook#node-track-event`

## `audit-log` - Audit Log

Category: `integration`

**Purpose**
Writes append-only audit events for regulated actions with configurable failure policy and metadata masking.

**When To Use**
- Capture consent acceptance with actor and channel details.
- Record payment, approval, and profile update state transitions.
- Log high-risk AI/handover actions for compliance and investigations.

**Limitations**
- Meaningful entity/action taxonomy is required for usable reporting.
- Misconfigured failure policy can block customer-facing flows unexpectedly.
- Sensitive metadata should be masked or minimized before persistence.

**Edge Expectations**
Audit Log should usually continue the journey after a successful write, but it can block and branch on failure for regulated actions. Wire the logged path to the next business step and reserve the failed path for strict-policy flows.

- Outgoing edges: 2
- Route outcomes: logged, failed
- Conditional edges: failed only when failurePolicy is block
- Best next nodes: end, message, decision, or fallback

**Route Outcomes**
- No named route outcomes documented beyond the graph edges you define.

**Config Fields**
- `action` (text): Action.
- `entityType` (text): Entity Type.
- `entityId` (text): Entity ID.
- `metadataJson` (textarea): Metadata JSON.
- `sensitivity` (select): Sensitivity. Options: normal, pii, financial, medical.
- `failurePolicy` (select): Failure Policy. Options: continue, block.
- `piiMasking` (boolean): Mask Sensitive Metadata.
- `outputVar` (text): Save Result As.

**Runtime Defaults**
```json
{
  "action": "consent_captured",
  "entityType": "customer",
  "entityId": "{{customer_id}}",
  "metadata": {},
  "metadataJson": "{\n  \"consent_text\": \"{{consent_text}}\",\n  \"ip\": \"{{ip_address}}\",\n  \"channel\": \"{{system.channel}}\"\n}",
  "sensitivity": "normal",
  "failurePolicy": "continue",
  "piiMasking": true,
  "outputVar": "audit_result"
}
```

**Variable Behavior**
- Writes: `data.outputVar` when configured
- Reads: action, entity, metadata, sensitivity templates
- Never invent consent, IP, tenant, or actor metadata without an upstream writer.

Docs anchor: `/docs/flow-node-playbook#node-audit-log`

## `record` - Database / Record

Category: `integration`

**Purpose**
Performs native database-style CRUD actions over tenant-isolated flow collections with schema validation and routeable outcomes.

**When To Use**
- Capture and upsert lead records from web/WhatsApp/Telegram journeys.
- Store and update appointment, payment, and ticket lifecycle states.
- Persist repeatable business objects with booking-specific unique keys instead of forcing every person to be one row.
- Fetch profile/history records for personalized response routing.

**Limitations**
- Collection schema quality determines validation reliability.
- Complex relational joins should still use API/connector integrations.
- PII encryption requires runtime key management and indexing strategy.
- A phone number is not always the right unique key; repeat bookings need appointment/booking IDs or another stable business key.

**Edge Expectations**
Record routes by CRUD result. Keep the success path direct, send duplicate and not_found into explicit correction or reuse branches, and reserve validation_failed/failed for recovery handling.

- Outgoing edges: 5
- Route outcomes: success, not_found, duplicate, validation_failed, failed
- Conditional edges: based on action type, schema checks, uniqueness checks, and query results
- Best next nodes: message, decision, setVariable, fallback, or end

**Route Outcomes**
- success
- not_found
- duplicate
- validation_failed
- failed

**Config Fields**
- `action` (select): Action. Options: create, find, update, upsert, delete, list.
- `schemaName` (select): Target Schema. Options: public, automobile, education, financial_services, healthcare, hospitality, insurance, professional_services, realestate, retail.
- `collection` (text): Collection.
- `whereJson` (textarea): Where JSON.
- `dataJson` (textarea): Data JSON.
- `collectionSchema` (textarea): Collection Schema JSON.
- `uniqueKey` (text): Unique Key.
- `idempotencyKey` (text): Idempotency Key (create/upsert).
- `outputVar` (text): Save Result As.
- `limit` (number): List Limit.
- `offset` (number): List Offset.
- `sortBy` (text): Sort By.
- `sortOrder` (select): Sort Order. Options: asc, desc.
- `softDelete` (boolean): Soft Delete.
- `encryptPii` (boolean): Encrypt PII.
- `piiFields` (text): PII Fields (comma-separated).

**Runtime Defaults**
```json
{
  "action": "upsert",
  "schemaName": "public",
  "collection": "leads",
  "where": {},
  "whereJson": "{\n  \"phone\": \"{{customer_phone}}\"\n}",
  "data": {},
  "dataJson": "{\n  \"name\": \"{{customer_name}}\",\n  \"phone\": \"{{customer_phone}}\",\n  \"source\": \"whatsapp\",\n  \"status\": \"new\"\n}",
  "collectionSchema": "{\n  \"collection\": \"leads\",\n  \"fields\": {\n    \"name\": { \"type\": \"string\", \"required\": true },\n    \"phone\": { \"type\": \"phone\", \"required\": true, \"unique\": true },\n    \"email\": { \"type\": \"email\", \"required\": false },\n    \"status\": { \"type\": \"enum\", \"values\": [\"new\", \"contacted\", \"converted\", \"lost\"] }\n  }\n}",
  "uniqueKey": "phone",
  "outputVar": "record_result",
  "limit": 20,
  "offset": 0,
  "sortBy": "updatedAt",
  "sortOrder": "desc",
  "softDelete": true,
  "encryptPii": false,
  "piiFields": "phone,email",
  "idempotencyKey": ""
}
```

**Variable Behavior**
- Writes: `data.outputVar`
- Reads: `whereJson`, `dataJson`, schema JSON, and idempotency templates
- Record nodes are a frequent source of undefined variables; validate every template path.

Docs anchor: `/docs/record-node-database-configuration`

## `connector` - Integration Action

Category: `integration`

**Purpose**
Executes standardized integration actions for external systems with mapped responses.

**When To Use**
- Push/update records in CRM, ERP, ticketing, or backend systems.
- Trigger downstream automations with normalized payloads.
- Centralize integration actions with reusable endpoint patterns.

**Limitations**
- Requires stable API contracts and secure auth management.
- Invalid response mappings can corrupt downstream variables.
- External service latency or outages directly affect flow speed.

**Edge Expectations**
Use this node only with routes documented in the flow graph and keep one explicit fallback path when branching.

**Route Outcomes**
- No named route outcomes documented beyond the graph edges you define.

**Config Fields**
- `connectorName` (text): Connector Name.
- `action` (text): Action Name.
- `endpoint` (text): Endpoint URL.
- `method` (select): HTTP Method. Options: GET, POST, PUT, PATCH, DELETE.
- `headers` (kv): Headers.
- `body` (textarea): Body (JSON).
- `responseMap` (responseMap): Response Mapping.
- `saveAs` (text): Save result as.
- `timeoutMs` (number): Timeout (ms).

**Runtime Defaults**
```json
{
  "connectorName": "custom",
  "action": "invoke",
  "endpoint": "",
  "method": "POST",
  "headers": [],
  "body": "",
  "responseMap": [],
  "saveAs": "connectorResult",
  "timeoutMs": 10000
}
```

**Variable Behavior**
- Writes: `data.saveAs`
- Reads: endpoint, headers, body, and response map templates
- Connector actions follow the same variable discipline as API nodes.

Docs anchor: `/docs/flow-node-playbook#node-connector`

## `event-trigger` - Event Matcher

Category: `integration`

**Purpose**
Matches incoming events and routes execution based on event identity and strictness.

**When To Use**
- Drive webhook-first automations from external systems.
- Route differently for matched vs unmatched operational events.
- Build event-driven processing for asynchronous workflows.

**Limitations**
- Strict match depends on stable event naming conventions.
- Needs clear fallback behavior when event does not match.
- Not ideal as primary entrypoint for direct user chat flows.

**Edge Expectations**
Use this node only with routes documented in the flow graph and keep one explicit fallback path when branching.

**Route Outcomes**
- No named route outcomes documented beyond the graph edges you define.

**Config Fields**
- `eventName` (text): Event Name.
- `strictMatch` (boolean): Strict Match.
- `mismatchMessage` (textarea): Mismatch Message.

**Runtime Defaults**
```json
{
  "eventName": "lead_created",
  "strictMatch": false,
  "mismatchMessage": ""
}
```

**Variable Behavior**
- Writes: event match result in runtime context
- Reads: event name and mismatch message
- Use this only when the flow starts from a matched inbound event contract.

Docs anchor: `/docs/flow-node-playbook#node-event-trigger`

## `webhook-trigger` - Webhook Trigger

Category: `integration`

**Purpose**
Receives provider callbacks with auth, signature, idempotency, and payload mapping controls, then routes by received, duplicate, unauthorized, invalid_payload, or failed.

**When To Use**
- Trigger flows from payment, CRM, commerce, and lab system webhook events.
- Continue conversation state after asynchronous external updates.
- Normalize external payloads into mapped variables for downstream routing.

**Limitations**
- Requires reliable signature/auth configuration per provider.
- Payload/schema drift must be monitored and updated.
- Idempotency strategy depends on stable event IDs from source systems.

**Edge Expectations**
Webhook Trigger is an ingress node with five explicit outcomes. Connect received to the main business path and reserve duplicate, unauthorized, invalid_payload, and failed for dedicated handling branches.

- Outgoing edges: 5
- Route outcomes: received, duplicate, unauthorized, invalid_payload, failed
- Conditional edges: not on webhook-trigger itself
- Default edge: not used
- Best next nodes: record, decision, message, audit-log, fallback, or end

**Route Outcomes**
- received
- duplicate
- unauthorized
- invalid_payload
- failed

**Config Fields**
- `method` (select): Method. Options: POST, PUT, PATCH.
- `path` (text): Path.
- `authType` (select): Auth Type. Options: none, secret, hmac, basic, bearer.
- `secret` (text): Secret / Token.
- `verifySignature` (boolean): Verify Signature.
- `signatureHeader` (text): Signature Header.
- `timestampHeader` (text): Timestamp Header.
- `timestampPath` (text): Timestamp JSONPath.
- `maxAgeSeconds` (number): Max Age (seconds).
- `idempotencyKeyPath` (text): Idempotency Key Path.
- `provider` (text): Provider.
- `requiredFieldsJson` (textarea): Required Fields JSON.
- `payloadMappingJson` (textarea): Payload Mapping JSON.
- `ipAllowlist` (text): IP Allowlist.
- `allowSecretQueryParam` (boolean): Allow Secret Query Param.
- `secretQueryKey` (text): Secret Query Key.
- `basicUsername` (text): Basic Username.
- `basicPassword` (text): Basic Password.
- `bearerToken` (text): Bearer Token.
- `outputVar` (text): Save Result As.

**Runtime Defaults**
```json
{
  "method": "POST",
  "path": "/webhooks/{{tenant_id}}/event",
  "authType": "hmac",
  "secret": "{{WEBHOOK_SECRET}}",
  "verifySignature": true,
  "signatureHeader": "x-signature",
  "timestampHeader": "x-timestamp",
  "timestampPath": "$.timestamp",
  "maxAgeSeconds": 300,
  "idempotencyKeyPath": "$.event_id",
  "provider": "generic",
  "requiredFieldsJson": "[\"event_id\", \"event_type\", \"payload.payment.id\"]",
  "payloadMappingJson": "{\n  \"payment_id\": \"$.payload.payment.id\",\n  \"payment_status\": \"$.payload.payment.status\",\n  \"customer_phone\": \"$.payload.customer.phone\"\n}",
  "outputVar": "webhook_event",
  "ipAllowlist": "",
  "allowSecretQueryParam": false,
  "secretQueryKey": "secret",
  "basicUsername": "",
  "basicPassword": "",
  "bearerToken": ""
}
```

**Variable Behavior**
- Writes: `data.outputVar`
- Reads: path, auth, payload mapping, required field, and idempotency templates
- Webhook trigger contracts must be precise; do not invent provider payload shapes.

Docs anchor: `/docs/flow-node-playbook#node-webhook-trigger`

## `approval` - Human Approval

Category: `logic`

**Purpose**
Pauses automation for authorized human decision, then resumes with approved, rejected, more-info, timeout, or failed outcomes.

**When To Use**
- Refund, discount, and claim approval gates before irreversible actions.
- Manager approval for custom pricing or high-value exceptions.
- Manual compliance/legal response checks in regulated workflows.

**Limitations**
- Requires approver identity/role to be present in runtime context.
- Timeout and escalation policy must be configured explicitly.
- Late approval handling depends on expiry policy configuration.

**Edge Expectations**
Approval is a blocking human-decision step. Connect each route to an explicit next branch so timeout, escalation, and failed paths are handled safely.

- Outgoing edges: 5
- Route outcomes: approved, rejected, more_info_required, timeout, failed
- Conditional edges: not on approval itself
- Default edge: not used
- Best next nodes: message, record, handover, decision, fallback, or end

**Route Outcomes**
- approved
- rejected
- more_info_required
- timeout
- failed

**Config Fields**
- `approvalTitle` (text): Approval Title.
- `approvalMessage` (textarea): Approval Message.
- `approversJson` (textarea): Approvers JSON.
- `approvalMode` (select): Approval Mode. Options: any_one, all, majority, specific_role_required.
- `timeoutValue` (number): Timeout Value.
- `timeoutUnit` (select): Timeout Unit. Options: minutes, hours, days.
- `onTimeout` (select): On Timeout. Options: auto_reject, auto_approve, escalate.
- `buttonsCsv` (text): Buttons (comma-separated).
- `approvalExpiryPolicy` (select): Late Approval Policy. Options: reject_late_action, accept_late_action.
- `waitingMessage` (textarea): Waiting Message.
- `outputVar` (text): Save Result As.

**Runtime Defaults**
```json
{
  "approvalTitle": "Approve request",
  "approvalMessage": "Please review and approve this request.",
  "approversJson": "[\n  {\n    \"type\": \"user\",\n    \"id\": \"admin_123\"\n  },\n  {\n    \"type\": \"role\",\n    \"id\": \"manager\"\n  }\n]",
  "approvers": [],
  "approvalMode": "any_one",
  "timeoutValue": 4,
  "timeoutUnit": "hours",
  "onTimeout": "auto_reject",
  "buttonsCsv": "approve,reject,request_more_info",
  "buttons": [
    "approve",
    "reject",
    "request_more_info"
  ],
  "outputVar": "approval_result",
  "approvalExpiryPolicy": "reject_late_action",
  "waitingMessage": "Your request is under review. We will continue once approved."
}
```

**Variable Behavior**
- Writes: `data.outputVar`
- Reads: approval title, message, approver config, waiting message
- Approval branches must include explicit timeout and terminal behavior.

Docs anchor: `/docs/flow-node-playbook#node-approval`

## `auth-consent` - Consent Verification

Category: `integration`

**Purpose**
Collects explicit consent and optional OTP confirmation before sensitive actions, then routes by accepted or denied.

**When To Use**
- Capture policy/privacy acceptance with auditable result.
- Protect high-risk actions with one-time verification.
- Branch approved vs denied users into compliant paths.

**Limitations**
- The runtime shows Yes and No buttons, but typed consent replies are still accepted.
- OTP checks depend on correctly pre-populated OTP variables.
- Invalid OTP or ambiguous input re-prompts instead of routing to failure.
- Prompt wording should clearly explain why consent is required.

**Edge Expectations**
Auth Consent is a binary human-response step. Connect accepted to the protected action and denied to a safe fallback or handoff path.

- Outgoing edges: 2
- Route outcomes: accepted, denied
- Conditional edges: not on auth-consent itself
- Default edge: not used
- Best next nodes: api, message, handover, fallback, or end

**Route Outcomes**
- accepted
- denied

**Config Fields**
- `consentText` (textarea): Consent Prompt.
- `requireOtp` (boolean): Require OTP.
- `otpVar` (text): OTP Variable.
- `outputVar` (text): Save Consent As.

**Runtime Defaults**
```json
{
  "consentText": "Please review and confirm to continue.",
  "requireOtp": false,
  "otpVar": "otp",
  "outputVar": "consentStatus"
}
```

**Variable Behavior**
- Writes: `data.outputVar`
- Reads: consent text and OTP-related configuration
- Do not reference consent-related placeholders elsewhere unless this node writes them.

Docs anchor: `/docs/flow-node-playbook#node-auth-consent`

## `input` - User Prompt

Category: `basic`

**Purpose**
Collects a user response and stores it as a named variable for later steps.

**When To Use**
- Capture complaint, account number, or free-text requirement.
- Ask a focused question before routing or classification.
- Collect data needed for API calls, AI nodes, or escalation.

**Limitations**
- Variable key must be valid and consistently reused.
- Ambiguous prompts produce low-quality user responses.
- Should include retries/help if response format is important.
- Buttons default to click-only mode; turn off Disable Chat Input Box if the step should also accept typed replies.

**Edge Expectations**
Input captures one user response and then continues to the next step. When buttons are configured, the default behavior locks the chat box to button choices, but you can allow typed input by disabling that lock in the node settings.

- Outgoing edges: 1
- Conditional edges: not on input itself
- Default edge: required to continue the flow
- Best next nodes: condition, switch, ai-extract, setVariable, api, or decision

**Route Outcomes**
- No named route outcomes documented beyond the graph edges you define.

**Config Fields**
- `messages` (messages): Prompt Messages.
- `variable` (text): Save input as.
- `buttons` (buttons): Optional Buttons.
- `disableChatInput` (boolean): Disable Chat Input Box.

**Runtime Defaults**
```json
{
  "messages": [
    "Please enter a value"
  ],
  "variable": "input",
  "buttons": [],
  "disableChatInput": true
}
```

**Variable Behavior**
- Writes: `data.variable`
- Reads: none documented
- The input node captures user text and stores it under the configured variable name.

Docs anchor: `/docs/flow-node-playbook#node-input`

## `decision` - Decision

Category: `logic`

**Purpose**
Presents a binary choice and routes the conversation to one of two branches.

**When To Use**
- Yes/No qualification before collecting deeper details.
- Simple triage pathing such as urgent vs non-urgent.
- Quick confirmation steps before irreversible actions.

**Limitations**
- Best used for clear binary outcomes only.
- Unclear option text can cause misrouting.
- Needs explicit default/fallback behavior for unexpected replies.

**Edge Expectations**
Decision is a strict two-branch node. Keep the routing values fixed as yes and no, and customize the visible button labels per branch from the node properties or edge routing panel when you need user-friendly wording.

- Outgoing edges: 2
- Route outcomes: yes, no
- Conditional edges: use yes/no values only; button labels can be customized without changing the branch values
- Best next nodes: message, api, handover, setVariable, or end

**Route Outcomes**
- yes
- no

**Config Fields**
- `messages` (messages): Decision Question.
- `outputVar` (text): Save Selection As.

**Runtime Defaults**
```json
{
  "messages": [
    "Yes or No?"
  ],
  "outputVar": "decision_result"
}
```

**Variable Behavior**
- Writes: implicit branch result only
- Reads: fresh user input
- Decision does not persist a variable by itself unless downstream nodes write one.

Docs anchor: `/docs/flow-node-playbook#node-decision`

## `faq` - Knowledge Base Search

Category: `integration`

**Purpose**
Searches curated knowledge content to answer common informational questions.

**When To Use**
- Handle repetitive policy and process questions automatically.
- Deflect common support load before human escalation.
- Provide immediate self-serve answers from approved KB content.

**Limitations**
- Answer quality depends on KB coverage and freshness.
- Account-specific cases may still require API or agent support.
- Should include fallback when confidence is low.

**Edge Expectations**
FAQ answers from curated knowledge and can optionally stay active for multiple user turns before continuing to its next node. Add a not_found route when unanswered questions should leave the loop early.

- Outgoing edges: 1 normal route, plus optional not_found route
- Conditional edges: use equals not_found for unanswered or failed RAG lookups
- Loop count: total FAQ answers this node should handle before moving on
- Default edge: required for answered questions after the final loop
- Best next nodes: fallback, handover, ai-sentiment, message, or end

**Route Outcomes**
- No named route outcomes documented beyond the graph edges you define.

**Config Fields**
- `loopCount` (number): FAQ Loop Count.

**Runtime Defaults**
```json
{
  "loopCount": 1
}
```

**Variable Behavior**
- Writes: none documented
- Reads: none documented
- This node mainly controls graph flow rather than introducing new runtime variables.

Docs anchor: `/docs/flow-node-playbook#node-faq`

## `api` - API Call

Category: `integration`

**Purpose**
Calls an external API endpoint and maps selected response fields into runtime variables.

**When To Use**
- Fetch real-time status such as order, claim, or ticket state.
- Create/update records in backend systems during conversation.
- Enrich context before routing to message or AI nodes.

**Limitations**
- External downtime or latency can delay user responses.
- Incorrect request/response mapping breaks downstream logic.
- Needs strong error handling and fallback routing.

**Edge Expectations**
API should usually route success to the next business step, failure to a safe fallback, and default to a catch-all path when the response cannot be matched cleanly.

- Outgoing edges: 3
- Route outcomes: success, failure, default
- Conditional edges: based on the API result and any downstream checks
- Best next nodes: condition, message, setVariable, error, fallback, or end

**Route Outcomes**
- success
- failure

**Config Fields**
- `url` (text): API URL.
- `method` (select): HTTP Method. Options: GET, POST, PUT, PATCH, DELETE.
- `headers` (kv): Headers.
- `body` (textarea): Body (JSON).
- `responseMap` (responseMap): Response Mapping.
- `saveAs` (text): Save result as.

**Runtime Defaults**
```json
{
  "method": "GET",
  "headers": {},
  "body": "",
  "responseMap": [],
  "saveAs": "apiResult",
  "timeoutMs": 5000
}
```

**Variable Behavior**
- Writes: `data.saveAs`, `data.responseMap[].variable`
- Reads: URL, headers, body, and response map templates
- API payload templates must only use variables already available on that branch.

Docs anchor: `/docs/flow-node-playbook#node-api`

## `condition` - Condition Check

Category: `logic`

**Purpose**
Evaluates a single rule and routes flow based on true/false outcome.

**When To Use**
- Apply eligibility checks before pricing or booking steps.
- Protect restricted paths with business policy conditions.
- Gate premium features by role, plan, or account state.

**Limitations**
- Invalid variable/operator setup can break routing.
- Needs safe fallback/default behavior for non-matching values.
- Complex multi-rule logic is better split into smaller checks.

**Edge Expectations**
Use this node only with routes documented in the flow graph and keep one explicit fallback path when branching.

**Route Outcomes**
- No named route outcomes documented beyond the graph edges you define.

**Config Fields**
- `variable` (text): Variable.
- `operator` (select): Operator. Options: equals, contains, regex.
- `value` (text): Compare value.

**Runtime Defaults**
```json
{
  "variable": "",
  "operator": "equals",
  "value": ""
}
```

**Variable Behavior**
- Writes: none documented
- Reads: `data.variable`
- Condition checks an existing variable and requires a default edge.

Docs anchor: `/docs/flow-node-playbook#node-condition`

## `end` - Conversation End

Category: `basic`

**Purpose**
Closes the active journey path after the final user-visible step and ends execution for that branch.

**When To Use**
- Confirm successful completion of a booking, payment, or support request.
- Gracefully close a conversation after fulfillment or handoff.
- Mark terminal branches for analytics, audits, and clean exits.

**Limitations**
- Terminal node and cannot have outgoing edges.
- Critical branches should always be able to reach an end state.
- If used before the final confirmation, it can end the journey too early.

**Edge Expectations**
End should be the last node in a branch. It accepts incoming paths but must not connect to any next node.

- Outgoing edges: 0
- Incoming edges: 1 or more
- Conditional edges: not supported
- Use after the final confirmation, handover acknowledgement, or timeout close message

**Route Outcomes**
- No named route outcomes documented beyond the graph edges you define.

**Config Fields**
- `messages` (messages): Final Messages.

**Runtime Defaults**
```json
{
  "messages": [
    "Thanks for chatting!"
  ]
}
```

**Variable Behavior**
- Writes: none documented
- Reads: none documented
- This node mainly controls graph flow rather than introducing new runtime variables.

Docs anchor: `/docs/flow-node-playbook#node-end`

## `delay` - Delay

Category: `logic`

**Purpose**
Pauses execution for a configured duration before continuing to the next step.

**When To Use**
- Throttle responses to avoid flooding users with messages.
- Create timed wait windows before reminders or retries.
- Sequence multi-step responses in readable intervals.

**Limitations**
- Long delays can make the bot feel unresponsive.
- Excessive delay chaining creates poor user experience.
- Should be used with clear business intent and messaging.

**Edge Expectations**
Delay is a linear pause node. It should connect to exactly one next step after the wait, without any branching inside the node itself.

- Outgoing edges: 1
- Conditional edges: not on delay itself
- Default edge: required to continue the flow
- Best next nodes: message, api, timeout, retry, handover, or end

**Route Outcomes**
- No named route outcomes documented beyond the graph edges you define.

**Config Fields**
- `delayMs` (text): Delay (ms).

**Runtime Defaults**
```json
{
  "delayMs": 1000
}
```

**Variable Behavior**
- Writes: none documented
- Reads: none documented
- This node mainly controls graph flow rather than introducing new runtime variables.

Docs anchor: `/docs/flow-node-playbook#node-delay`

## `language` - Language Detect / Translate

Category: `logic`

**Purpose**
Detects user language or translates text for multilingual routing and localized replies.

**When To Use**
- Route Telugu/Hindi/English users to localized branches.
- Translate inbound text to English before extraction/classification.
- Translate outbound responses back to preferred user language.

**Limitations**
- Mixed-language text can produce low-confidence detection.
- Translation quality for medical/legal terms should be reviewed in high-risk flows.
- Unsupported language codes must be handled via fallback routes.

**Edge Expectations**
Language detection and translation usually fan out into four outcomes. Route the successful path forward, and use fallback branches for low confidence or unsupported input.

- Outgoing edges: 4
- Route outcomes: detected, low_confidence, unsupported, failed
- Conditional edges: based on confidence and supported language checks
- Best next nodes: message, switch, condition, fallback, or end

**Route Outcomes**
- No named route outcomes documented beyond the graph edges you define.

**Config Fields**
- `action` (select): Action. Options: detect, translate.
- `inputText` (text): Input Text.
- `targetLanguage` (text): Target Language (for translate).
- `supportedLanguagesCsv` (text): Supported Languages (csv).
- `lowConfidenceThreshold` (number): Low Confidence Threshold (0-1).
- `preferredLanguageVar` (text): Preferred Language Var.
- `outputVar` (text): Save Result As.

**Runtime Defaults**
```json
{
  "action": "detect",
  "inputText": "{{input}}",
  "targetLanguage": "en",
  "supportedLanguagesCsv": "en,hi,te,ta,kn,ml,mr,bn,gu,pa,ur",
  "lowConfidenceThreshold": 0.7,
  "outputVar": "language_result",
  "preferredLanguageVar": "preferred_language"
}
```

**Variable Behavior**
- Writes: `data.outputVar`
- Reads: input text and supported language templates
- Language nodes often feed downstream switch/condition logic through a saved result.

Docs anchor: `/docs/flow-node-playbook#node-language`

## `queue` - Queue / Assignment

Category: `integration`

**Purpose**
Assigns conversations/tickets to support queues using strategy-based agent selection and SLA metadata.

**When To Use**
- Assign billing issues to billing queue with round-robin distribution.
- Route emergency/high-priority users to urgent team queues.
- Match language/department skills before human handover.

**Limitations**
- Assignment quality depends on accurate agent availability and skill data.
- Skill gaps or offline teams may leave tickets queued.
- Duplicate checks require stable dedupe keys.

**Edge Expectations**
Queue usually routes to assignment success, overflow queueing, or failure. Wire the assigned path to the next human-support step and reserve queued for escalation or retry handling.

- Outgoing edges: 3
- Route outcomes: assigned, queued, failed
- Conditional edges: based on staffing, skills, or queueing policy
- Best next nodes: message, handover, notification, decision, or end

**Route Outcomes**
- assigned
- queued
- failed

**Config Fields**
- `queueName` (text): Queue Name.
- `assignmentStrategy` (select): Assignment Strategy. Options: round_robin, least_busy, skill_based, priority.
- `priority` (text): Priority.
- `skillsRequiredCsv` (text): Skills Required (csv).
- `slaFirstResponseMinutes` (number): SLA First Response (mins).
- `dedupeKey` (text): Dedupe Key.
- `outputVar` (text): Save Result As.

**Runtime Defaults**
```json
{
  "queueName": "billing_support",
  "assignmentStrategy": "round_robin",
  "priority": "{{priority}}",
  "skillsRequired": [
    "telugu",
    "billing"
  ],
  "skillsRequiredCsv": "telugu,billing",
  "slaFirstResponseMinutes": 15,
  "dedupeKey": "{{system.sessionId}}:billing_support",
  "outputVar": "queue_result"
}
```

**Variable Behavior**
- Writes: `data.outputVar`
- Reads: queue name, priority, skills, dedupe key
- Queue assignment usually writes a result object consumed by later escalation nodes.

Docs anchor: `/docs/flow-node-playbook#node-queue`

## `dedupe` - Dedupe

Category: `logic`

**Purpose**
Prevents duplicate business actions within a configured time window using an idempotent key.

**When To Use**
- Block duplicate lead submissions from repeated clicks.
- Ignore duplicate payment/ticket webhooks and retries.
- Avoid duplicate appointment or complaint creation.

**Limitations**
- Dedupe quality depends on correct business-key design.
- Over-broad keys can suppress legitimate new requests.
- Window settings must match business expectations.

**Edge Expectations**
Dedupe usually sends new requests forward, duplicate requests to a reuse/correction path, and failures to a safe fallback. Connect each outcome explicitly so retries do not create duplicate side effects.

- Outgoing edges: 3
- Route outcomes: new, duplicate, failed
- Conditional edges: based on key validation and duplicate policy
- Best next nodes: message, update, decision, fallback, or end

**Route Outcomes**
- new
- duplicate
- failed

**Config Fields**
- `dedupeKey` (text): Dedupe Key.
- `windowValue` (number): Window Value.
- `windowUnit` (select): Window Unit. Options: minutes, hours, days.
- `onDuplicate` (select): On Duplicate. Options: route_duplicate, reuse_existing, update_existing.
- `outputVar` (text): Save Result As.

**Runtime Defaults**
```json
{
  "dedupeKey": "{{customer_phone}}:{{flow_id}}:{{intent}}",
  "windowValue": 24,
  "windowUnit": "hours",
  "onDuplicate": "route_duplicate",
  "outputVar": "dedupe_result"
}
```

**Variable Behavior**
- Writes: `data.outputVar`
- Reads: dedupe key
- Dedupe keys must be business-stable and fully defined upstream.

Docs anchor: `/docs/flow-node-playbook#node-dedupe`

## `rate-limit` - Rate Limit / Abuse Protection

Category: `logic`

**Purpose**
Applies per-key request limits to prevent spam, loops, OTP abuse, and cost spikes.

**When To Use**
- Limit AI-heavy paths per user in a rolling time window.
- Throttle repeated OTP/payment actions to reduce abuse.
- Protect webhook or user-triggered flows from replay floods.

**Limitations**
- Shared keys (e.g., family phone numbers) may block legitimate traffic.
- Limits should be tuned for emergency or compliance-critical journeys.
- Requires thoughtful bypass policy for trusted internal roles.

**Edge Expectations**
Rate Limit usually lets traffic continue, blocks abusive traffic, and falls back on configuration errors. Wire each outcome explicitly so blocked users get a safe path instead of a dead end.

- Outgoing edges: 3
- Route outcomes: allowed, blocked, failed
- Conditional edges: based on count threshold, bypass policy, and key validity
- Best next nodes: message, fallback, decision, handover, or end

**Route Outcomes**
- allowed
- blocked
- failed

**Config Fields**
- `key` (text): Limit Key.
- `limit` (number): Limit Count.
- `windowValue` (number): Window Value.
- `windowUnit` (select): Window Unit. Options: minute, hour, day.
- `bypassForRolesCsv` (text): Bypass Roles (csv).
- `emergencyBypass` (boolean): Emergency Bypass.
- `outputVar` (text): Save Result As.

**Runtime Defaults**
```json
{
  "key": "{{customer_phone}}",
  "limit": 10,
  "windowValue": 1,
  "windowUnit": "hour",
  "bypassForRolesCsv": "admin,agent",
  "emergencyBypass": true,
  "outputVar": "rate_limit_result"
}
```

**Variable Behavior**
- Writes: `data.outputVar`
- Reads: limit key and bypass role configuration
- Limit keys often use user/session context and must not rely on undefined placeholders.

Docs anchor: `/docs/flow-node-playbook#node-rate-limit`

## `template-message` - Template Message

Category: `integration`

**Purpose**
Sends approved channel templates (especially WhatsApp) with variable binding and compliance checks.

**When To Use**
- Send appointment/payment/order reminders outside session windows.
- Run approved promotional re-engagement templates.
- Deliver transactional updates with language-specific variants.

**Limitations**
- Templates must be approved and available for selected language.
- Missing variables or header media can block delivery.
- Opt-out and regulatory rules must be respected before send.

**Edge Expectations**
Template Message should branch by send status, not by the template body itself. Connect each delivery outcome to the next business step so approval and fallback paths stay explicit.

- Outgoing edges: 4
- Route outcomes: sent, template_not_approved, variable_missing, failed
- Conditional edges: supported through route outcomes
- Best next nodes: end, message, sms, notification, fallback, or decision

**Route Outcomes**
- No named route outcomes documented beyond the graph edges you define.

**Config Fields**
- `channel` (select): Channel. Options: whatsapp, telegram, sms, email.
- `templateName` (text): Template Name.
- `language` (text): Template Language.
- `variablesJson` (textarea): Variables JSON.
- `to` (text): Recipient.
- `category` (select): Category. Options: transactional, promotional, service.
- `approvedTemplatesCsv` (text): Approved Templates (csv).
- `requiresMediaHeader` (boolean): Requires Media Header.
- `mediaHeader` (text): Media Header URL.
- `outputVar` (text): Save Result As.

**Runtime Defaults**
```json
{
  "channel": "whatsapp",
  "templateName": "appointment_reminder",
  "language": "{{preferred_language}}",
  "variables": {
    "1": "{{customer_name}}",
    "2": "{{slot_label}}",
    "3": "{{hospital_name}}"
  },
  "variablesJson": "{\n  \"1\": \"{{customer_name}}\",\n  \"2\": \"{{slot_label}}\",\n  \"3\": \"{{hospital_name}}\"\n}",
  "to": "{{customer_phone}}",
  "category": "transactional",
  "approvedTemplatesCsv": "",
  "requiresMediaHeader": false,
  "mediaHeader": "",
  "outputVar": "template_result"
}
```

**Variable Behavior**
- Writes: `data.outputVar`
- Reads: channel, template, variables, recipient, and media header templates
- Approved template names and variables must be supplied explicitly.

Docs anchor: `/docs/flow-node-playbook#node-template-message`

## `wait-until` - Wait Until

Category: `logic`

**Purpose**
Pauses flow progression until a computed date-time window with timezone and business-hour controls.

**When To Use**
- Wait until a pre-appointment reminder threshold before continuing.
- Route after-hours leads into next business-day handling.
- Delay payment or renewal follow-ups until valid send windows.

**Limitations**
- Long waits require durable runtime/session persistence strategy.
- Timezone/date parsing errors will route failures if not validated.
- User early-reply policy behavior depends on runtime orchestration hooks.

**Edge Expectations**
Wait Until routes by computed wait outcome, so each result should lead to a clear downstream path instead of a second wait inside the same branch.

- Outgoing edges: 3
- Route outcomes: resumed, skipped, failed
- Conditional edges: driven by the computed wait result and past-time policy
- Best next nodes: message, scheduler, notification, fallback, handover, or end

**Route Outcomes**
- resumed
- skipped
- failed

**Config Fields**
- `targetTime` (text): Target Time Template/Value.
- `offsetValue` (number): Offset Value.
- `offsetUnit` (select): Offset Unit. Options: minutes, hours, days.
- `offsetDirection` (select): Offset Direction. Options: before, after.
- `timezone` (text): Timezone (IANA).
- `businessHoursEnabled` (boolean): Restrict to Business Hours.
- `businessDaysCsv` (text): Business Days (csv).
- `businessStart` (text): Business Start (HH:mm).
- `businessEnd` (text): Business End (HH:mm).
- `pastTimePolicy` (select): Past Time Policy. Options: continue_now, skip, fail.
- `userEarlyReplyPolicy` (select): User Early Reply Policy. Options: resume_early, ignore, cancel_wait, branch_to_new_intent.
- `outputVar` (text): Save Result As.

**Runtime Defaults**
```json
{
  "targetTime": "",
  "offsetValue": 1,
  "offsetUnit": "days",
  "offsetDirection": "before",
  "timezone": "Asia/Kolkata",
  "businessHoursEnabled": true,
  "businessDaysCsv": "mon,tue,wed,thu,fri,sat",
  "businessStart": "09:00",
  "businessEnd": "18:00",
  "pastTimePolicy": "continue_now",
  "userEarlyReplyPolicy": "resume_early",
  "outputVar": "wait_result"
}
```

**Variable Behavior**
- Writes: `data.outputVar` when configured
- Reads: target time and business-hours templates
- Wait Until is time-based; ensure all referenced date/time variables are already known.

Docs anchor: `/docs/flow-node-playbook#node-wait-until`

## `scheduler` - Scheduler / Reminder

Category: `logic`

**Purpose**
Schedules future reminders/follow-ups with timezone control, dedupe protection, and status-based routing.

**When To Use**
- Schedule appointment reminders before visit time.
- Trigger payment pending nudges after configurable offsets.
- Run lead and post-visit follow-up automations after defined intervals.

**Limitations**
- Production reliability depends on durable background job storage.
- Invalid timestamps, cron strings, or timezone values will fail scheduling.
- Channel windows and session policies must be handled in downstream execution.

**Edge Expectations**
Scheduler creates a durable job and then routes by scheduling outcome. Keep the success path simple and send failures to a safe retry, fallback, or manual-review branch.

- Outgoing edges: 4
- Route outcomes: scheduled, skipped, failed, expired
- Conditional edges: based on dedupe, past-time, expiry, and provider/job-store checks
- Best next nodes: notification, message, handover, retry, fallback, or end

**Route Outcomes**
- scheduled
- skipped
- failed
- expired

**Config Fields**
- `scheduleType` (select): Schedule Mode. Options: relative, absolute, cron, business_time.
- `runAt` (text): When to Run.
- `offsetValue` (number): Reminder Offset.
- `offsetUnit` (select): Offset Unit. Options: minutes, hours, days.
- `offsetDirection` (select): Offset Direction. Options: before, after.
- `timezone` (text): Timezone.
- `dedupeKey` (text): Duplicate Prevention Key.
- `payload` (textarea): Payload.
- `maxExecutions` (number): Runs Per Job.
- `expiryAt` (text): Expire After.
- `pastTimePolicy` (select): If Time Already Passed. Options: skip, send_immediately, fail.
- `sendWindowStart` (text): Send Window Start.
- `sendWindowEnd` (text): Send Window End.
- `sendWindowTimezone` (text): Send Window Timezone.
- `outsideWindowPolicy` (select): Outside Window Policy. Options: send_next_window, skip, fail.
- `outputVar` (text): Store Result As.

**Runtime Defaults**
```json
{
  "scheduleType": "relative",
  "runAt": "",
  "offset": {
    "value": 24,
    "unit": "hours",
    "direction": "before"
  },
  "timezone": "Asia/Kolkata",
  "dedupeKey": "{{flow_id}}:{{customer_phone}}:appointment_reminder",
  "payload": {},
  "maxExecutions": 1,
  "expiryAt": "",
  "pastTimePolicy": "skip",
  "sendWindow": {
    "start": "09:00",
    "end": "20:00",
    "timezone": "Asia/Kolkata",
    "outsideWindowPolicy": "send_next_window"
  },
  "outputVar": "scheduler_result"
}
```

**Variable Behavior**
- Writes: `data.outputVar`
- Reads: run time, payload, dedupe key, expiry, and send-window templates
- Scheduler inputs should be deterministic and timezone-aware.

Docs anchor: `/docs/flow-node-playbook#node-scheduler`

## `timeout` - Response Timeout

Category: `logic`

**Purpose**
Waits for user input until a time limit, then routes to timeout handling.

**When To Use**
- Recover abandoned conversations with reminder or fallback paths.
- Set response windows for time-sensitive actions.
- Escalate idle sessions to alternate channels or human support.

**Limitations**
- Aggressive timeout values can frustrate genuine users.
- Needs explicit timeout messaging and next-step handling.
- Should align with channel expectations and business SLAs.

**Edge Expectations**
Use this node only with routes documented in the flow graph and keep one explicit fallback path when branching.

**Route Outcomes**
- No named route outcomes documented beyond the graph edges you define.

**Config Fields**
- `messages` (messages): Prompt Messages.
- `timeoutMs` (text): Timeout (ms).

**Runtime Defaults**
```json
{
  "timeoutMs": 5000,
  "messages": [
    "Please respond"
  ]
}
```

**Variable Behavior**
- Writes: implicit timeout outcome only
- Reads: prompt messages
- Timeout behavior is defined by graph routing rather than stored variables.

Docs anchor: `/docs/flow-node-playbook#node-timeout`

## `retry` - Retry Policy

Category: `logic`

**Purpose**
Tracks repeated attempts and routes based on max-retry policy.

**When To Use**
- Retry validation prompts when user input is invalid.
- Retry integration-dependent steps before fallback.
- Prevent infinite loops by enforcing controlled attempt limits.

**Limitations**
- Missing retry target configuration causes runtime errors.
- Too many retries degrade completion and user trust.
- Counter variable naming must be consistent across flows.

**Edge Expectations**
Use this node only with routes documented in the flow graph and keep one explicit fallback path when branching.

**Route Outcomes**
- No named route outcomes documented beyond the graph edges you define.

**Config Fields**
- `maxRetries` (text): Max retries.
- `counterVar` (text): Counter variable.

**Runtime Defaults**
```json
{
  "maxRetries": 3,
  "counterVar": "retryCount"
}
```

**Variable Behavior**
- Writes: `data.counterVar`
- Reads: retry counter variable
- Retry loops must stay bounded and use an explicit counter variable.

Docs anchor: `/docs/flow-node-playbook#node-retry`

## `setVariable` - Variable Assignment

Category: `logic`

**Purpose**
Creates or updates variables used by downstream routing, templates, and integrations.

**When To Use**
- Store normalized values such as plan type, city, or account tier.
- Set internal flags for branch control and eligibility checks.
- Prepare payload fragments for API, email, or AI nodes.

**Limitations**
- Inconsistent naming causes mapping and reporting confusion.
- Unintended overwrites can break branch logic later in flow.
- Complex derivations should be done via script/AI, not manual constants.

**Edge Expectations**
Use this node only with routes documented in the flow graph and keep one explicit fallback path when branching.

**Route Outcomes**
- No named route outcomes documented beyond the graph edges you define.

**Config Fields**
- `assignments` (kv): Variables.

**Runtime Defaults**
```json
{
  "assignments": [
    {
      "key": "",
      "value": ""
    }
  ]
}
```

**Variable Behavior**
- Writes: `data.assignments[].key`
- Reads: templated assignment values
- Use this node to create deterministic internal variables before routing or integration nodes.

Docs anchor: `/docs/flow-node-playbook#node-setVariable`

## `handover` - Human Escalation

Category: `integration`

**Purpose**
Transfers the conversation from automation to a human or external support channel.

**When To Use**
- Escalate sensitive, high-risk, or unresolved cases.
- Hand off long-running or account-specific issues to agents.
- Move VIP or urgent conversations to priority support teams.

**Limitations**
- Terminal handoff step and should not continue automated branching.
- Requires real support coverage to meet escalation SLAs.
- Handover context quality determines agent resolution speed.

**Edge Expectations**
Handover ends the bot turn after the transfer payload is emitted. Do not branch out of this node in the runtime path; use End only as a visual close-out pattern if your flow design requires one.

- Outgoing edges: 0
- Conditional edges: not supported
- Default edge: not used
- Best next step: none in runtime; close the branch after transfer logging

**Route Outcomes**
- No named route outcomes documented beyond the graph edges you define.

**Config Fields**
- `channel` (select): Handover Channel. Options: human, email, whatsapp, crm.
- `messages` (messages): Bot Messages.

**Runtime Defaults**
```json
{
  "channel": "human",
  "messages": [
    "Connecting you to an agent…"
  ]
}
```

**Variable Behavior**
- Writes: none documented
- Reads: none documented
- This node mainly controls graph flow rather than introducing new runtime variables.

Docs anchor: `/docs/flow-node-playbook#node-handover`

## `agent-handoff` - Specialist AI Delegation

Category: `AI`

**Purpose**
Delegates execution to another bot/agent and returns handoff metadata plus any selected context variables.

**When To Use**
- Route specialized tasks to domain-specific AI agents.
- Split complex journeys into orchestrated multi-agent subflows.
- Reuse expert bots across multiple parent workflows.

**Limitations**
- Target bot must be valid and accessible in the same workspace.
- Deep handoff chains are restricted by max-depth guardrails.
- Poor context-sharing design can produce inconsistent outcomes.
- This node is a transfer step, not a branching router.

**Edge Expectations**
Agent Handoff is a linear transfer step. It delegates to the target bot, emits any returned messages, and then continues to exactly one next node.

- Outgoing edges: 1
- Conditional edges: not on agent-handoff itself
- Default edge: required to continue the flow
- Best next nodes: message, decision, handover, fallback, or end

**Route Outcomes**
- No named route outcomes documented beyond the graph edges you define.

**Config Fields**
- `targetBotId` (text) required: Target Bot ID.
- `inputTemplate` (text): Input Template (optional).
- `outputKey` (text): Output Variable.
- `sessionVar` (text): Child Session Variable.
- `shareContextKeys` (text): Share Context Keys (comma-separated).
- `returnContextKeys` (text): Return Context Keys (comma-separated).
- `emitTargetMessages` (select): Emit Target Messages. Options: true, false.
- `maxDepth` (number): Max Handoff Depth.

**Runtime Defaults**
```json
{
  "targetBotId": "",
  "outputKey": "agentHandoff",
  "sessionVar": "",
  "inputTemplate": "",
  "shareContextKeys": [],
  "returnContextKeys": [],
  "emitTargetMessages": true,
  "maxDepth": 3
}
```

**Variable Behavior**
- Writes: `data.outputVar`, `data.childSessionVar` when configured
- Reads: target bot, input template, shared/returned context keys
- Agent handoff requires an exact target bot contract and bounded depth.

Docs anchor: `/docs/flow-node-playbook#node-agent-handoff`

## `fallback` - Fallback Response

Category: `logic`

**Purpose**
Provides a controlled safe response when no confident route is available.

**When To Use**
- Handle unmatched user inputs without exposing internal errors.
- Provide generic recovery guidance and next best action.
- Route uncertain AI/integration outcomes to stable handling.

**Limitations**
- Overuse can hide real design gaps in primary branches.
- Often terminal, so keep copy clear and actionable.
- Should include escalation options for repeated fallback loops.

**Edge Expectations**
Use this node only with routes documented in the flow graph and keep one explicit fallback path when branching.

**Route Outcomes**
- No named route outcomes documented beyond the graph edges you define.

**Config Fields**
- `messages` (messages): Fallback Messages.

**Runtime Defaults**
```json
{
  "messages": [
    "Sorry, I didn’t understand that."
  ]
}
```

**Variable Behavior**
- Writes: none documented
- Reads: none documented
- This node mainly controls graph flow rather than introducing new runtime variables.

Docs anchor: `/docs/flow-node-playbook#node-fallback`

## `switch` - Rule Router

Category: `logic`

**Purpose**
Routes execution to branch edges by matching the value of a chosen variable.

**When To Use**
- Route by department, plan, intent, or payment status.
- Build multi-outcome pathing from one normalized variable.
- Create deterministic business routing for operations teams.

**Limitations**
- Requires clean and predictable variable values.
- Missing default branch can create dead ends.
- Value mismatches due to casing/format can cause wrong routing.

**Edge Expectations**
Use this node only with routes documented in the flow graph and keep one explicit fallback path when branching.

**Route Outcomes**
- No named route outcomes documented beyond the graph edges you define.

**Config Fields**
- `variable` (text): Variable to evaluate.

**Runtime Defaults**
```json
{
  "variable": "input"
}
```

**Variable Behavior**
- Writes: none documented
- Reads: `data.variable`
- Switch routes on an existing variable and must preserve a deterministic fallback path.

Docs anchor: `/docs/flow-node-playbook#node-switch`

## `intent-router` - User Intent Routing

Category: `AI`

**Purpose**
Uses intent classification to route user messages into specialized business branches and stores the chosen intent for downstream steps.

**When To Use**
- Drive multi-intent support bots from one shared entrypoint.
- Reduce manual rule complexity in large routing trees.
- Separate billing, technical, and onboarding requests early.

**Limitations**
- Needs one conditional edge per supported intent plus exactly one default fallback edge.
- Low-confidence predictions need explicit recovery logic and a safe fallback intent.
- Intent quality depends on prompt, examples, labels, and user phrasing.
- Use specific intent keys and labels because shared words alone are treated as ambiguous.
- Ambiguous shared-token matches pause with matching intent buttons before falling back.
- Conditional edge values must exactly match configured intent keys.

**Edge Expectations**
Intent Router is a classifier node. Wire one conditional edge for each supported intent and one default edge for unknown or low-confidence cases. The runtime stores the chosen intent in session context so downstream nodes can branch on it.

- Outgoing edges: one conditional edge per supported intent, plus exactly 1 default edge
- Conditional edges: required for each intent branch
- Default edge: required for unknown or low-confidence cases
- Best next nodes: faq, api, message, input, handover, fallback, or end depending on the matched intent

**Route Outcomes**
- No named route outcomes documented beyond the graph edges you define.

**Config Fields**
- `intents` (kv): Supported Intents.

**Runtime Defaults**
```json
{
  "intents": [
    {
      "key": "order_status",
      "label": "Order Status"
    },
    {
      "key": "pricing",
      "label": "Pricing"
    }
  ],
  "fallbackIntent": "unknown",
  "threshold": 0.6
}
```

**Variable Behavior**
- Writes: `intent`
- Reads: latest user input
- Intent Router stores the matched intent in the readonly `intent` variable.

Docs anchor: `/docs/flow-node-playbook#node-intent-router`

## `loop` - Loop Controller

Category: `logic`

**Purpose**
Repeats part of the flow with iteration guardrails until exit condition is met.

**When To Use**
- Run reminder loops until user provides required input.
- Repeat collection/verification steps with bounded attempts.
- Build controlled re-engagement sequences for incomplete tasks.

**Limitations**
- Weak exit criteria can cause loop exhaustion errors.
- Must have explicit max-iteration safety controls.
- Overuse can make conversation feel repetitive.

**Edge Expectations**
Use this node only with routes documented in the flow graph and keep one explicit fallback path when branching.

**Route Outcomes**
- No named route outcomes documented beyond the graph edges you define.

**Config Fields**
- `count` (text): Times.

**Runtime Defaults**
```json
{
  "count": 1
}
```

**Variable Behavior**
- Writes: none documented
- Reads: none documented
- This node mainly controls graph flow rather than introducing new runtime variables.

Docs anchor: `/docs/flow-node-playbook#node-loop`

## `error` - Error Handler

Category: `error`

**Purpose**
Displays a controlled error response when a critical runtime or integration step fails.

**When To Use**
- Handle API/provider failures with user-safe messaging.
- Prevent raw technical errors from reaching end users.
- Standardize incident messaging across many branches.

**Limitations**
- Usually terminal and should not continue normal flow.
- Overly generic error copy can reduce user trust.
- Must be paired with logging/observability for debugging.

**Edge Expectations**
Use this node only with routes documented in the flow graph and keep one explicit fallback path when branching.

**Route Outcomes**
- No named route outcomes documented beyond the graph edges you define.

**Config Fields**
- `messages` (messages): Error Messages.

**Runtime Defaults**
```json
{
  "messages": [
    "Something went wrong. Please try again later."
  ]
}
```

**Variable Behavior**
- Writes: none documented
- Reads: none documented
- This node mainly controls graph flow rather than introducing new runtime variables.

Docs anchor: `/docs/flow-node-playbook#node-error`

## `ai-extract` - Structured Data Capture

Category: `AI`

**Purpose**
Extracts structured fields from unstructured user text using AI schema guidance, then writes the extracted keys into session variables.

**When To Use**
- Extract names, dates, IDs, symptoms, or location fields.
- Convert free-text complaints into machine-usable variables.
- Reduce manual form friction in conversational intake.

**Limitations**
- Extraction quality depends on schema clarity and user input.
- Missing/invalid schema config blocks useful extraction.
- Ambiguous inputs may require retries or human confirmation.
- Branching should happen after extraction using the stored variables, not inside this node.

**Edge Expectations**
AI Extract is usually a straight-through enrichment step. It does not emit special route outcomes; it writes extracted keys to session scope and then continues to one next node.

- Outgoing edges: 1 recommended
- Conditional edges: not on ai-extract itself
- Default edge: recommended for a linear flow
- Best next nodes: setVariable, condition, switch, api, decision, or end

**Route Outcomes**
- No named route outcomes documented beyond the graph edges you define.

**Config Fields**
- `schema` (kv): Extraction Schema.

**Runtime Defaults**
```json
{
  "schema": {
    "field": "string"
  }
}
```

**Variable Behavior**
- Writes: `data.outputVar`
- Reads: input text and extraction schema
- AI Extract should be followed by validation or fallback when extracted structure matters.

Docs anchor: `/docs/flow-node-playbook#node-ai-extract`

## `ai-generate` - Smart Response Composer

Category: `AI`

**Purpose**
Generates dynamic LLM responses from prompt templates and runtime variables, then stores the result and optionally sends it to the user.

**When To Use**
- Create personalized replies based on user and session context.
- Generate dynamic campaign, outreach, or follow-up text.
- Produce context-aware responses when static copy is insufficient.

**Limitations**
- Prompt quality directly determines output quality and consistency.
- Needs fallback/guardrails for low-confidence generations.
- Should not be used without business policy constraints.

**Edge Expectations**
AI Generate is a linear response-composition step. It writes the generated text to outputKey, may emit it to the user when respond=true, and then continues to one next node.

- Outgoing edges: 1 recommended
- Conditional edges: not on ai-generate itself
- Default edge: recommended for a simple response flow
- Best next nodes: message, condition, ai-memory, api, setVariable, or end

**Route Outcomes**
- No named route outcomes documented beyond the graph edges you define.

**Config Fields**
- `template` (textarea): Prompt Template.
- `outputKey` (text): Store Output As.
- `respond` (select): Send As Message. Options: true, false.

**Runtime Defaults**
```json
{
  "template": "Hello {{name}}",
  "outputKey": "generatedText",
  "respond": true
}
```

**Variable Behavior**
- Writes: `data.outputVar`
- Reads: prompt template
- Do not ask AI Generate to invent business facts that are absent from the flow context.

Docs anchor: `/docs/flow-node-playbook#node-ai-generate`

## `ai-grounded` - Concern Resolution AI

Category: `AI`

**Purpose**
Generates an LLM answer constrained to provided context and user input, then routes by grounded or fallback.

**When To Use**
- Run grounded Q&A for policy, SOP, pricing, or clinical routing context.
- Return deterministic answers using known text/JSON documents only.
- Reduce hallucinations in high-stakes support and operations flows.

**Limitations**
- Insufficient context often triggers fallback or low-confidence output.
- Large unstructured context can increase latency and reduce precision.
- Output format should align with executor expectations for routing.
- For branch routing, use edge conditions with values "grounded" and "fallback".

**Edge Expectations**
AI Grounded is a grounded-answer step with two explicit outcomes. Wire grounded to the success path and fallback to a safe recovery or handover path.

- Outgoing edges: 1 or 2
- Route outcomes: grounded, fallback
- Conditional edges: supported via grounded/fallback route handles
- Default edge: optional when only one edge is used; recommended as a safe fallback path when branching
- Best next nodes: message, handover, api, setVariable, condition, or end

**Route Outcomes**
- grounded
- fallback

**Config Fields**
- `contextTemplate` (textarea): Context Template.
- `inputTemplate` (textarea): Input Template.
- `instructions` (textarea): Instructions.
- `responseContract` (select): Response Contract. Options: grounded-envelope, single-key-json, single-key-text.
- `responseStyle` (select): Response Style. Options: concise, detailed, bullet, json.
- `strictGrounding` (boolean): Strict Grounding.
- `includeCitations` (boolean): Include Citations.
- `includeCitationsInResponse` (boolean): Show Citations In Response.
- `responseTemplate` (text): Response Template.
- `fallbackResponseTemplate` (text): Fallback Response Template.
- `fallbackMessage` (text): Fallback Message.
- `outputVar` (text): Store Result As.
- `answerVar` (text): Store Answer As.
- `answerKeyValueVar` (text): Store Answer KeyValue As (for buttons).
- `emitResponse` (boolean): Send As Message.

**Runtime Defaults**
```json
{
  "contextTemplate": "Paste grounded context here (text, JSON, or templated data).",
  "inputTemplate": "{{input}}",
  "instructions": "Answer only using provided context. If context is insufficient, clearly say so.",
  "responseContract": "grounded-envelope",
  "responseStyle": "concise",
  "strictGrounding": true,
  "includeCitations": true,
  "includeCitationsInResponse": false,
  "responseTemplate": "You can consult {{answer}}",
  "fallbackResponseTemplate": "",
  "fallbackMessage": "I don't have enough grounded context to answer that confidently.",
  "outputVar": "groundedResult",
  "answerVar": "groundedAnswer",
  "answerKeyValueVar": "deptOption",
  "emitResponse": true
}
```

**Variable Behavior**
- Writes: `data.outputVar`, `data.answerVar` when configured, `data.answerKeyValueVar` when configured
- Reads: context, input, instruction, fallback, and response templates
- Grounded AI nodes must still obey the same upstream variable proof rules.

Docs anchor: `/docs/flow-node-playbook#node-ai-grounded`

## `web-crawl` - Website Answer Search

Category: `AI`

**Purpose**
Crawls a configured website, asks an LLM to answer the current question from the crawled content, and routes by answered, not_found, or failed.

**When To Use**
- Answer user questions from a public website without manually copying page text into the flow.
- Search a configured help center, product site, or policy page during a chat.
- Escalate to an agent when the website does not contain enough information.

**Limitations**
- Only public HTTP/HTTPS pages from the configured website origin are crawled.
- Crawl size is intentionally bounded by maxPages, maxDepth, and maxCharsPerPage.
- Dynamic pages that require browser rendering, login, or blocked network access may return little usable text.
- A not_found or failed route should be wired for safe fallback and handover.

**Edge Expectations**
Web Crawl has three explicit outcomes. Wire answered to the normal response path, not_found to fallback or agent handover, and failed to a technical recovery path.

- Outgoing edges: 1 to 3
- Route outcomes: answered, not_found, failed
- Conditional edges: supported via answered/not_found/failed route values
- Default edge: allowed when using a simple linear path
- Best next nodes: message, handover, fallback, condition, setVariable, or end

**Route Outcomes**
- answered
- not_found
- failed

**Config Fields**
- `websiteUrl` (text) required: Website URL.
- `inputTemplate` (textarea): Question Template.
- `instructions` (textarea): Answer Instructions.
- `provider` (select): LLM Provider. Options: workspace, openrouter, groq, openai, gemini, ollama.
- `model` (text): LLM Model Override.
- `maxPages` (number): Max Pages.
- `maxDepth` (number): Max Link Depth.
- `maxCharsPerPage` (number): Max Characters Per Page.
- `outputVar` (text): Store Result As.
- `answerVar` (text): Store Answer As.
- `emitResponse` (boolean): Send As Message.
- `includeSourcesInResponse` (boolean): Show Sources In Response.
- `notFoundMessage` (text): Not Found Message.
- `failureMessage` (text): Failure Message.

**Runtime Defaults**
```json
{
  "websiteUrl": "https://example.com",
  "inputTemplate": "{{input}}",
  "instructions": "Answer the user's question using only the crawled website content.",
  "provider": "workspace",
  "model": "",
  "maxPages": 5,
  "maxDepth": 1,
  "maxCharsPerPage": 4000,
  "outputVar": "webCrawlResult",
  "answerVar": "webCrawlAnswer",
  "emitResponse": true,
  "includeSourcesInResponse": false,
  "notFoundMessage": "I could not find enough information on the configured website to answer that.",
  "failureMessage": "I could not search the configured website right now. Please try again later."
}
```

**Variable Behavior**
- Writes: `data.outputVar`, `data.answerVar` when configured
- Reads: website URL, question, instructions, and response templates
- Web Crawl requires an explicit target website contract and fallback messaging.

Docs anchor: `/docs/flow-node-playbook#node-web-crawl`

## `ai-sentiment` - Emotion-Based Escalation

Category: `AI`

**Purpose**
Classifies user sentiment into positive, negative, or neutral and enables priority routing based on emotional tone.

**When To Use**
- Detect frustration and escalate urgent conversations earlier.
- Tune response tone for negative vs neutral interactions.
- Prioritize service queues by emotional urgency signals.
- Collect one-tap satisfaction feedback with clickable emoji choices before routing.

**Limitations**
- Short or ambiguous text can reduce classification accuracy.
- Threshold tuning is required for production stability.
- Low-confidence results collapse to neutral, so the neutral path must be safe.
- Emoji feedback is coarse-grained and should not replace structured CSAT or issue-category capture.

**Edge Expectations**
AI Sentiment is a label-based classifier. Route positive, negative, and neutral outcomes explicitly, and keep a default edge as a safety net for unexpected values or future changes.

- Outgoing edges: 4 recommended
- Route outcomes: positive, negative, neutral, default
- Conditional edges: one each for positive, negative, and neutral labels
- Default edge: required when conditional edges are used; route it to a safe fallback or recovery path
- Best next nodes: handover, message, setVariable, decision, fallback, or end

**Route Outcomes**
- positive
- negative
- neutral

**Config Fields**
- `threshold` (number): Confidence Threshold.
- `emojiFeedbackEnabled` (boolean): Show Clickable Emoji Feedback.
- `feedbackPrompt` (text): Feedback Prompt.

**Runtime Defaults**
```json
{
  "threshold": 0.5,
  "emojiFeedbackEnabled": false,
  "feedbackPrompt": "How was your experience?"
}
```

**Variable Behavior**
- Writes: `data.outputVar` when configured
- Reads: feedback prompt and thresholds
- Sentiment results should be consumed downstream rather than assumed implicitly.

Docs anchor: `/docs/flow-node-playbook#node-ai-sentiment`

## `ai-memory` - Customer Context Memory

Category: `AI`

**Purpose**
Persists selected session variables into durable memory so they can be restored on later turns and reused for personalization.

**When To Use**
- Remember profile preferences and recurring user details.
- Carry forward prior context to reduce repetitive questioning.
- Store durable state for cross-session conversational continuity and handover prep.

**Limitations**
- Only keys listed in assignments are persisted.
- Blank or stale session vars can overwrite good memory values.
- Sensitive memory fields require compliance-aware handling and retention rules.

**Edge Expectations**
AI Memory is a linear persistence step. It upserts the selected keys into durable memory and then continues to one next node; it is not a branching node.

- Outgoing edges: 1
- Conditional edges: not on ai-memory itself
- Default edge: required to continue the flow
- Best next nodes: ai-generate, handover, switch, message, setVariable, or end

**Route Outcomes**
- No named route outcomes documented beyond the graph edges you define.

**Config Fields**
- `assignments` (kv): Variables to persist.

**Runtime Defaults**
```json
{
  "assignments": [
    {
      "key": "name",
      "value": ""
    }
  ]
}
```

**Variable Behavior**
- Writes: assignment keys in `data.assignments`
- Reads: stored context and assignment defaults
- AI Memory persists deliberate context; do not use vague or overloaded keys.

Docs anchor: `/docs/flow-node-playbook#node-ai-memory`
