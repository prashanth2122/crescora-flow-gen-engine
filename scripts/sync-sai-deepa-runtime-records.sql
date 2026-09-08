-- Legacy compatibility check for the Sai Deepa healthcare records.
--
-- The healthcare service stores domain records in healthcare.flow_records.
-- The FLOW runtime now routes schemaName = 'healthcare' directly to the
-- tenant-scoped healthcare.flow_records family. This script must not copy
-- healthcare rows into public.flow_records. It remains as a safe, read-only
-- validation command for callers that still reference its old filename.
--
-- Use scripts/ensure-sai-deepa-healthcare-schema.sql to provision/reconcile
-- the healthcare record tables before runtime E2E.

DO $$
DECLARE
  runtime_tenant_id text;
  department_count integer;
BEGIN
  SELECT h."tenantId"
    INTO runtime_tenant_id
    FROM healthcare.flow_record_schemas h
   WHERE h.collection = 'departments'
     AND h."isActive" = true
   ORDER BY h."updatedAt" DESC NULLS LAST
   LIMIT 1;

  IF runtime_tenant_id IS NULL THEN
    RAISE EXCEPTION 'No active healthcare.departments record schema was found';
  END IF;

  SELECT count(*)::integer
    INTO department_count
    FROM healthcare.flow_records
   WHERE "tenantId" = runtime_tenant_id
     AND collection = 'departments'
     AND "deletedAt" IS NULL
     AND COALESCE("dataJson" ->> 'is_active', 'true') <> 'false';

  IF department_count = 0 THEN
    RAISE EXCEPTION 'Healthcare runtime contains no active Sai Deepa departments';
  END IF;

  RAISE NOTICE 'Direct healthcare runtime validation passed for tenant %; active departments %', runtime_tenant_id, department_count;
END $$;
