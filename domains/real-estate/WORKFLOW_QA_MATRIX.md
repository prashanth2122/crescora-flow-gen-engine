# Workflow QA Matrix

Use this checklist before importing or releasing the real-estate buyer-to-site-visit workflow.

## Primary Journey

| Scenario | Expected result |
| --- | --- |
| Natural enquiry | The journey begins with a free-text property requirement rather than a long form. |
| Main menu entry | The first interactive step offers the eight buyer menu options and still accepts direct free-text requirement entry. |
| Main menu prompt copy | The main menu prompt stays concise and does not duplicate the visible button labels as a long text list. |
| Returning buyer | The flow looks up the contact by mobile number and offers reuse of the last saved requirement summary. |
| Mobile verification | After mobile capture, the buyer must enter a 6-digit OTP before contact lookup continues; any 6 digits are accepted in the demo flow, and 3 invalid attempts end the verification branch. |
| Missing-field capture | The bot asks only for fields not already known from the initial enquiry or saved contact snapshot. |
| Routine happy path | The lead progresses from requirement capture to project match, brochure, qualification, site visit, and confirmation without human handover. |
| Zero exact match | The flow offers close alternatives or schedules a forward-only inventory follow-up instead of ending with a dead stop. |
| Project selection UX | The journey shows ranked cards first and then captures one explicit project selection for downstream persistence. |
| Brochure conversion | Brochure sharing continues into qualification or site-visit intent rather than ending the journey, even when optional project-interest persistence is bypassed for demo safety. |
| Site-visit confirmation | After the buyer says `Yes`, the flow uses the appointment node to show available 30-minute site-visit slots from `10:00` AM to `6:00` PM, blocks already booked visits for the same project, writes the confirmed visit to records, and reflects it in the customer confirmation without slot/hold dependencies. |
| Binary prompt nodes | Reuse, brochure, site-visit intent, and confirmation prompts use `input` nodes with explicit `Yes` and `No` button routes instead of `decision` nodes. |
| Brochure boolean persistence | `brochure_requested` is persisted as a real boolean on both brochure yes/no branches and remains valid when the confirmed site visit updates the same interest record. |
| Lead temperature | The flow classifies `hot`, `warm`, or `nurture` using explicit score logic rather than an opaque branch. |
| Sales alerting | Hot leads or confirmed site visits notify the assigned salesperson with full buyer context, not only a phone number. |
| Human escalation | Handover is reserved for true lead, slot, hold, or visit persistence failures, not brochure-stage optional project-interest writes. |
| Direct sales request | Choosing `Talk to Sales` triggers an explicit sales handoff path, not a system-failure message. |

## Import Safety

| Scenario | Expected result |
| --- | --- |
| Graph cycle check | No retry, conflict, or fallback path loops back to the same node or an earlier node. |
| Variable proof check | Every template variable is written upstream, declared as a global, or is an allowed safe system variable. |
| Output contract check | The build produces full export JSON with the required wrapper and no markdown. |
| Script syntax safety | Every script node compiles locally before import validation passes. |
| Demo visit safety | Downstream confirmation uses a script-generated visit datetime derived from the appointment-node slot selection, with blocked times removed from confirmed site visits, instead of relying on import-fragile operational slot payloads. |

## Data And Records

| Scenario | Expected result |
| --- | --- |
| Contact identity | Phone identifies the `real_estate_contacts` record, not the lead itself. |
| Lead persistence | Lead stage, score, shortlist, and site-visit state are stored in approved persisted records. |
| Project inventory lookup | Matching uses maintained `property_inventory` records rather than hardcoded demo projects inside message text. |
| Demo visit slot state | The persisted visit uses the selected appointment-node slot identifier for traceability and does not require separate operational slot or hold records. |
| CRM decoupling | CRM creation is modeled as a durable sync job so the buyer flow does not fail when an external CRM is unavailable. |
| Reminder durability | Visit reminders are scheduled from the persisted visit datetime, not from placeholder copy. |

## Content

| Scenario | Expected result |
| --- | --- |
| Production wording | User-facing copy is concrete, builder-safe, and free of lorem ipsum or generic filler. |
| Requirement clarity | The requirement summary shown to the buyer matches captured variables and does not invent missing fields. |
| Confirmation accuracy | Final booking, brochure, and hot-lead messages reflect the selected project and persisted site-visit details. |
| Newline rendering | Chat-visible confirmation prompts and final confirmation copy render real line breaks, not literal `\n` text. |
