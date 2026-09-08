-- Local/deployment prerequisite for the Sai Deepa appointment flow.
-- Record nodes run with the bot workspace ID as their tenantId. Reconcile the
-- existing healthcare seed to that workspace so schemaName = 'healthcare'
-- reads and writes the healthcare tables directly.
-- No exception rows are inserted: an empty collection means no exceptions.

DO $$
DECLARE
  workspace_id text;
  source_tenant_id text;
  table_name text;
  conflicting_idempotency_key text;
BEGIN
  LOCK TABLE healthcare.flow_record_schemas IN SHARE ROW EXCLUSIVE MODE;

  SELECT b."workspaceId"
    INTO workspace_id
    FROM public."Bot" b
   WHERE b.name = 'Sai Deepa Hospital'
      OR b.name LIKE 'Hospital Appointment Booking - Single Branch%'
   ORDER BY b."updatedAt" DESC NULLS LAST, b."createdAt" DESC
   LIMIT 1;

  IF workspace_id IS NULL THEN
    RAISE EXCEPTION 'No Sai Deepa appointment bot workspace was found';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM core.tenants
     WHERE tenant_id = workspace_id
       AND display_name = 'Sai Deepa Hospitals'
       AND status = 'active'
       AND timezone = 'Asia/Kolkata'
  ) THEN
    RAISE EXCEPTION 'Canonical Sai Deepa core tenant % is missing, inactive, or not workspace-scoped', workspace_id;
  END IF;

  SELECT "tenantId"
    INTO source_tenant_id
    FROM healthcare.flow_record_schemas
   WHERE collection = 'departments'
     AND "isActive" = true
   ORDER BY "updatedAt" DESC
   LIMIT 1;

  IF source_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Cannot resolve the Sai Deepa flow-record tenant from healthcare.departments';
  END IF;

  -- The runtime passes workspaceId as RecordsExecutionContext. Re-key every
  -- healthcare record-table family row from the existing seed tenant to that
  -- workspace. Keep the canonical core.tenants row unchanged; it is the
  -- domain identity, while healthcare.flow_records.tenantId is runtime scope.
  IF source_tenant_id <> workspace_id THEN
    -- A previous mirror may have left an exact copy of a completed
    -- idempotency row under the workspace. It is metadata only, so remove the
    -- duplicate before re-keying the authoritative healthcare row. Refuse any
    -- non-identical collision rather than silently merging it.
    DELETE FROM healthcare.flow_record_idempotency_keys AS target_row
    USING healthcare.flow_record_idempotency_keys AS source_row
    WHERE target_row."tenantId" = workspace_id
      AND source_row."tenantId" = source_tenant_id
      AND target_row.scope = source_row.scope
      AND target_row.action = source_row.action
      AND target_row."idempotencyKey" = source_row."idempotencyKey"
      AND target_row."responseJson" IS NOT DISTINCT FROM source_row."responseJson";

    SELECT source_row."idempotencyKey"
      INTO conflicting_idempotency_key
      FROM healthcare.flow_record_idempotency_keys AS target_row
      JOIN healthcare.flow_record_idempotency_keys AS source_row
        ON target_row.scope = source_row.scope
       AND target_row.action = source_row.action
       AND target_row."idempotencyKey" = source_row."idempotencyKey"
     WHERE target_row."tenantId" = workspace_id
       AND source_row."tenantId" = source_tenant_id
       AND target_row."responseJson" IS DISTINCT FROM source_row."responseJson"
     LIMIT 1;
    IF conflicting_idempotency_key IS NOT NULL THEN
      RAISE EXCEPTION 'Cannot reconcile non-identical healthcare idempotency key % to workspace %', conflicting_idempotency_key, workspace_id;
    END IF;

    FOREACH table_name IN ARRAY ARRAY[
      'flow_record_schemas', 'flow_records', 'flow_record_indexes',
      'flow_record_relationships', 'flow_record_mutation_audits',
      'flow_record_idempotency_keys', 'outbox_events', 'import_batches',
      'import_rows', 'export_jobs'
    ] LOOP
      EXECUTE format('UPDATE healthcare.%I SET "tenantId" = $1 WHERE "tenantId" = $2', table_name)
        USING workspace_id, source_tenant_id;
    END LOOP;
    source_tenant_id := workspace_id;
  END IF;

  IF NOT EXISTS (
    SELECT 1
      FROM healthcare.flow_record_schemas
     WHERE "tenantId" = workspace_id
       AND collection = 'doctor_schedule_exceptions'
       AND "isActive" = true
  ) THEN
    INSERT INTO healthcare.flow_record_schemas (
      id,
      "tenantId",
      collection,
      "schemaVersion",
      "uniqueKeyField",
      "jsonSchema",
      "indexConfigJson",
      "relationshipConfigJson",
      "piiConfigJson",
      "retentionConfigJson",
      "isActive"
    )
    VALUES (
      (SELECT COALESCE(MAX(id), 0) + 1 FROM healthcare.flow_record_schemas),
      workspace_id,
      'doctor_schedule_exceptions',
      1,
      'exception_id',
      jsonb_build_object(
        'type', 'object',
        'fields', jsonb_build_array(
          'exception_id', 'branch_id', 'doctor_id', 'rule_id',
          'exception_date', 'exception_type', 'start_time', 'end_time',
          'slot_duration_minutes', 'buffer_minutes', 'capacity',
          'consultation_mode', 'is_active'
        )
      ),
      '[]'::jsonb,
      '[]'::jsonb,
      '{}'::jsonb,
      '{}'::jsonb,
      true
    );
  END IF;
END $$;
