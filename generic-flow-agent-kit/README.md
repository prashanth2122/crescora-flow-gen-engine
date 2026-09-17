# Generic FLOW Agent Kit

This is a standalone, business-neutral instruction kit for asking a non-coding AI agent to create a new Crescora FLOW export or safely extend an existing one. It produces the same import contract and JSON shape each time; business content, timestamps, and graph size can vary with the completed brief.

The kit contains only these three files:

1. `README.md` — usage and maintenance.
2. `FLOW_GENERATOR_INSTRUCTIONS.md` — the authoritative agent instructions, FLOW schema, validation rules, complete node catalog, and valid example.
3. `FLOW_REQUEST_TEMPLATE.md` — a plain-language requirements form.

No repository access, programming tools, or separate JSON schema files are required by the receiving agent.

## How to use the kit

1. Fill in `FLOW_REQUEST_TEMPLATE.md`. Write `Unknown` wherever a business decision or technical detail is not yet known; do not guess.
2. Give all three Markdown files and the completed request to the agent in one conversation.
3. If the request is incomplete, answer the agent's focused clarification questions. The agent must not generate JSON while a mandatory answer is unresolved.
4. When the requirements are complete, the agent returns one full FLOW export as bare JSON. Save that response as a `.json` file and import it into FLOW.
5. Run the repository validator when it is available. A non-coding agent's self-check improves safety but is not a substitute for platform import validation or runtime testing.

The completed request must include the enabled/default/fallback languages and
the Localized Content catalog. New or changed customer-visible copy is authored
once under stable localized keys and flow nodes reference those keys with
`{{key}}`. This applies to messages, prompts, buttons, forms, carousels,
confirmations, and customer-visible fallback/error text. Global Variables are
reserved for readonly values that do not vary by language.

Do not ask the agent to shorten, summarize, ignore, or override `FLOW_GENERATOR_INSTRUCTIONS.md`. Business requirements may choose supported behavior, but they cannot relax the FLOW schema or safety rules.

## Create mode

Use create mode when no prior export exists. The agent builds the smallest production-safe graph that satisfies the completed brief. It uses semantic IDs, bounded return routes only where a user needs to change an earlier answer, durable data when state must survive the conversation, and explicit success, fallback, error, and terminal outcomes.

## Extend mode

Use extend mode only when the complete original FLOW export JSON is supplied. The original export remains the behavioral baseline. The agent inventories and preserves existing node IDs, edge IDs, route values, variable meanings, integrations, and working fallback/error paths unless the request explicitly changes them.

Never reconstruct an existing flow from screenshots, descriptions, partial node lists, or an inner `nodes`/`edges` fragment.

## Output guarantee and limits

The final generation response must:

- be valid JSON with no Markdown fence, prose, comments, or trailing explanation;
- use top-level keys in this exact order: `version`, `exportedAt`, `bot`, `flow`, `metadata`;
- use export version `1.0` and flow version `1.0.0`;
- contain only supported FLOW nodes, fields, routes, and edge operators;
- satisfy the graph, variable, persistence, integration, security, and production-readiness rules in the instruction file.
- include an English-first `localizedVariables` catalog and use its keys for all stable customer-visible copy created or changed by the generator.

The kit guarantees a consistent contract and organization, not byte-identical output. `exportedAt`, wording, selected nodes, and layout can legitimately differ. Provider configuration, credentials, database provisioning, approved messaging templates, deployment, and live third-party delivery must still be validated in the target environment.

## Contract provenance and refresh

This portable snapshot is derived from the synchronized contract files at the repository root:

- `FLOW_EXTERNAL_LLM_CONTRACT.md`
- `flow-export-schema.snapshot.json`
- `flow-node-catalog.snapshot.json`
- `flow-valid-export.example.json`
- validator behavior in `scripts/validate-flow-export.mjs`

The source snapshot reports `2026-09-17`; the kit was refreshed to document bounded retry returns and variable-backed localized customer content. Run `npm run contract:check` in the repository before using it after future contract changes.

When the root contract changes:

1. Run `npm run contract:generate` from the repository root.
2. Refresh the embedded schema, complete node catalog, example, and validator-derived rules in `FLOW_GENERATOR_INSTRUCTIONS.md` from the newly synchronized sources.
3. Confirm the embedded supported-node list and node-reference headings match exactly.
4. Extract the embedded minimal example to a temporary JSON file and run `node scripts/validate-flow-export.mjs <temporary-file>`.
5. Run `npm run contract:check` before redistributing the three-file kit.

## Acceptance dry runs

Use these scenarios after every refresh:

| Scenario | Required result |
| --- | --- |
| Incomplete brief with an `Unknown` integration contract | The agent asks only the missing questions and does not emit JSON. |
| Complete create brief | The agent emits one bare, parseable export whose embedded/example-equivalent graph passes the repository validator. |
| Extend brief with a complete source export | All unchanged node IDs, edge IDs, routes, variables, integrations, and behavior remain intact; only explicitly requested behavior changes. |
| Multilingual brief with buttons, forms, or carousels | Every stable visible string is stored in the localized catalog, every enabled language is complete, and nodes reference stable `{{key}}` tokens. |

Documentation-only changes do not require browser or visual validation.
