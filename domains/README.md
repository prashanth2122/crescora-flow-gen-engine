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
