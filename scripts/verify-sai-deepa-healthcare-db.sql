-- Read-only contract check for the local Sai Deepa healthcare dataset.
-- Run with DATABASE_URL=postgresql://postgres:postgres@localhost:5431/code_zero_bot
-- (or through docker exec when host psql is unavailable).
--
-- Record-node runtime scope is the bot workspace ID. The data itself stays
-- in the healthcare schema; public.flow_records is not part of this path.

DO $$
DECLARE
  workspace_id text;
  row_count integer;
  department_count integer;
  doctor_count integer;
  scheduled_appointment_count integer;
  required_collection text;
BEGIN
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
    RAISE EXCEPTION 'Sai Deepa canonical core tenant % is missing, inactive, or not workspace-scoped', workspace_id;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM core.locations
     WHERE tenant_id = workspace_id
       AND location_code = 'chanda_nagar'
       AND status = 'active'
  ) THEN
    RAISE EXCEPTION 'Sai Deepa Chanda Nagar location is missing or inactive for workspace %', workspace_id;
  END IF;

  FOREACH required_collection IN ARRAY ARRAY[
    'patients',
    'departments',
    'doctors',
    'doctor_availability_rules',
    'doctor_schedule_exceptions',
    'appointment_booking_policies',
    'appointment_reservations',
    'appointments',
    'payments'
  ] LOOP
    IF NOT EXISTS (
      SELECT 1
        FROM healthcare.flow_record_schemas
       WHERE "tenantId" = workspace_id
         AND collection = required_collection
         AND "isActive" = true
    ) THEN
      RAISE EXCEPTION 'Required healthcare collection schema % is missing for workspace %', required_collection, workspace_id;
    END IF;
  END LOOP;

  SELECT count(*)::integer INTO department_count
    FROM healthcare.flow_records
   WHERE "tenantId" = workspace_id
     AND collection = 'departments'
     AND "deletedAt" IS NULL
     AND ("dataJson" ->> 'branch_id') = 'chanda_nagar'
     AND COALESCE(("dataJson" ->> 'is_active'), 'true') <> 'false';
  IF department_count = 0 THEN
    RAISE EXCEPTION 'No active Chanda Nagar departments found in healthcare.flow_records for workspace %', workspace_id;
  END IF;

  SELECT count(*)::integer INTO doctor_count
    FROM healthcare.flow_records
   WHERE "tenantId" = workspace_id
     AND collection = 'doctors'
     AND "deletedAt" IS NULL
     AND ("dataJson" ->> 'branch_id') = 'chanda_nagar'
     AND COALESCE(("dataJson" ->> 'is_active'), 'true') <> 'false'
     AND COALESCE(("dataJson" ->> 'booking_enabled'), 'true') <> 'false';
  IF doctor_count = 0 THEN
    RAISE EXCEPTION 'No active booking-enabled Chanda Nagar doctors found in healthcare.flow_records for workspace %', workspace_id;
  END IF;

  SELECT count(*)::integer INTO scheduled_appointment_count
    FROM healthcare.flow_records
   WHERE "tenantId" = workspace_id
     AND collection = 'appointments'
     AND "deletedAt" IS NULL
     AND ("dataJson"::jsonb) ? 'scheduled_start_at'
     AND ("dataJson"::jsonb) ? 'scheduled_end_at';
  IF scheduled_appointment_count = 0 THEN
    RAISE EXCEPTION 'Appointments do not contain scheduled start/end fields for workspace %', workspace_id;
  END IF;

  SELECT count(*)::integer INTO row_count
    FROM healthcare.flow_records
   WHERE "tenantId" = workspace_id
     AND collection = 'appointment_reservations'
     AND "deletedAt" IS NULL;
  IF row_count = 0 THEN
    RAISE EXCEPTION 'No appointment reservation records found in healthcare.flow_records for workspace %', workspace_id;
  END IF;

  RAISE NOTICE 'Sai Deepa direct healthcare DB contract passed; workspace tenant %, active departments %, booking-enabled doctors %, scheduled appointments %, reservations %',
    workspace_id,
    department_count,
    doctor_count,
    scheduled_appointment_count,
    row_count;
END $$;
