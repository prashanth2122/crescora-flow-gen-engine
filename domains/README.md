# Domain Bundles

Place industry-specific FLOW bundles under `domains/<industry>/`.

Each domain should keep:

- `templates-source/` for canonical editable source flows
- `templates/` for generated import-ready exports
- `templates-stable/` for stable snapshots when needed
- `WORKFLOW_QA_MATRIX.md` for domain-specific QA rules
- optional domain-specific notes or supporting artifacts

The package root remains responsible for shared external-contract files and generic validation logic. Domain bundles should depend on those root-level contracts instead of carrying their own divergent schema snapshots.

Every active domain must also be registered in `domains/registry.json`. Package-level build/check commands operate on that registry, so flow-specific changes should update the registry-backed bundle rather than relying on manual one-off commands.

Current registered examples:

- `hospital` for healthcare operations automation.
- `real-estate` for buyer qualification, project matching, brochure sharing, site-visit booking, CRM sync, reminders, and hot-lead routing.
- `financial-services` for structured loan lead capture, indicative guidance, document intake, advisor booking, status lookup, and follow-up scheduling.
- `education` for school and college admissions automation, including discovery, eligibility, fees, applications, documents, bookings, payments, and status tracking.
- `hotels-travel` for hotel discovery, live room search, quote snapshots, booking holds, payments, booking changes, transfers, guest services, and operational escalation.
- `retail-ecommerce` for product discovery, variant and stock handling, cart and checkout assistance, order tracking, cancellation, returns, exchanges, refunds, delivery issues, policies, and structured support handoff.
- `insurance` for policy help, policy details, claim registration, missing-document recovery, claim and settlement status, service requests, disputes, and contextual escalation.
- `local-professional-services` for generic service discovery, pricing, serviceability, paid appointment booking, technician assignment, tracking, reschedule, cancellation, invoicing, and complaint handling.
- `interior-design` for interior enquiries, estimates, packages, portfolio references, consultation booking, quote and project lookups, payments, and service support.
