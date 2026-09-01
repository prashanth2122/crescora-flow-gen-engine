-- Hospital doctor and appointment-slot seed for the FLOW record store.
-- This targets the generic records runtime tables:
--   flow_record_schemas
--   flow_records
--   flow_record_indexes
--
-- Data contract used by the booking flow:
--   doctors unique key: doctor_scope_key = doctor_id:branch_id:consultation_mode
--   slot lookup key: branch_id + doctor_id + consultation_mode + status = available
--   slot update key: slot_id, with status changing available -> held -> booked
--
-- How to run safely:
--   1. Replace the tenant_id value in the params CTE below.
--   2. Inspect current rows before mutation:
--      SELECT "collection", COUNT(*)
--      FROM "flow_records"
--      WHERE "tenantId" = '8285edc4-af68-46c0-9e72-5b2819cb33d9'
--        AND "collection" IN ('doctors', 'appointment_slots')
--      GROUP BY "collection"
--      ORDER BY "collection";
--   3. Run against the same PostgreSQL database used by the FLOW records runtime.
--
-- Important:
--   - doctor rows alone are not enough for booking. The appointment node reads
--     `appointment_slots`.
--   - rerunning this script preserves slots that are already marked `booked`.

BEGIN;

SET search_path TO public;

WITH params AS (
  SELECT
    '8285edc4-af68-46c0-9e72-5b2819cb33d9'::text AS tenant_id,
    'seed-demo-appointment-slots'::text AS source_tag
),
schemas (collection, schema_json) AS (
  VALUES
    (
      'doctors',
      $${
        "collection": "doctors",
        "fields": {
          "doctor_id": { "type": "string", "required": true },
          "doctor_scope_key": { "type": "string", "required": true, "unique": true },
          "title": { "type": "string", "required": false },
          "display_name": { "type": "string", "required": true },
          "department": { "type": "string", "required": true },
          "branch_id": { "type": "string", "required": true },
          "branch_name": { "type": "string", "required": false },
          "consultation_mode": { "type": "string", "required": true },
          "consultation_type_label": { "type": "string", "required": false },
          "qualification": { "type": "string", "required": false },
          "languages": { "type": "string", "required": false },
          "consultation_fee": { "type": "number", "required": false },
          "profile_summary": { "type": "string", "required": false },
          "next_available_slot": { "type": "string", "required": false }
        }
      }$$::jsonb
    ),
    (
      'appointment_slots',
      $${
        "collection": "appointment_slots",
        "fields": {
          "id": { "type": "string", "required": true, "unique": true },
          "slot_id": { "type": "string", "required": true, "unique": true },
          "doctor_scope_key": { "type": "string", "required": true },
          "doctor_id": { "type": "string", "required": true },
          "department": { "type": "string", "required": true },
          "date": { "type": "string", "required": true },
          "label": { "type": "string", "required": true },
          "start": { "type": "string", "required": true },
          "end": { "type": "string", "required": false },
          "status": { "type": "string", "required": true },
          "hold_id": { "type": "string", "required": false },
          "held_by_session": { "type": "string", "required": false },
          "appointment_id": { "type": "string", "required": false },
          "patient_mobile": { "type": "phone", "required": false },
          "branch_id": { "type": "string", "required": true },
          "consultation_mode": { "type": "string", "required": true },
          "hold_ttl_minutes": { "type": "number", "required": false }
        }
      }$$::jsonb
    )
),
schema_upserts AS (
  INSERT INTO "flow_record_schemas" (
    "id",
    "tenantId",
    "collection",
    "schemaJson",
    "isActive",
    "createdAt",
    "updatedAt"
  )
  SELECT
    'schema:' || params.tenant_id || ':' || schemas.collection,
    params.tenant_id,
    schemas.collection,
    schemas.schema_json,
    true,
    NOW(),
    NOW()
  FROM params
  CROSS JOIN schemas
  ON CONFLICT ("tenantId", "collection") DO UPDATE
  SET
    "schemaJson" = EXCLUDED."schemaJson",
    "isActive" = true,
    "updatedAt" = NOW()
  RETURNING 1
),
seed_doctors (
  title,
  branch_id,
  doctor_id,
  languages,
  department,
  branch_name,
  display_name,
  qualification,
  profile_summary,
  consultation_fee,
  doctor_scope_key,
  consultation_mode,
  next_available_slot,
  consultation_type_label
) AS (
  VALUES
    ('General Medicine Consultant', 'north_branch', 'doc_general_1', 'English, Hindi, Telugu', 'general_medicine', 'North Branch', 'Dr. Ananya Rao', 'MBBS, MD General Medicine', 'General OPD care for fever, infections, routine illness, preventive care, and follow-up visits.', 800, 'doc_general_1:north_branch:in_person', 'in_person', '2026-08-27 09:00', 'Hospital visit'),
    ('General Medicine Consultant', 'south_branch', 'doc_general_1', 'English, Hindi, Telugu', 'general_medicine', 'South Branch', 'Dr. Ananya Rao', 'MBBS, MD General Medicine', 'General OPD care for fever, infections, routine illness, preventive care, and follow-up visits.', 800, 'doc_general_1:south_branch:in_person', 'in_person', '2026-08-27 09:00', 'Hospital visit'),
    ('General Medicine Consultant', 'main_branch', 'doc_general_1', 'English, Hindi, Telugu', 'general_medicine', 'Main Branch', 'Dr. Ananya Rao', 'MBBS, MD General Medicine', 'General OPD care for fever, infections, routine illness, preventive care, and follow-up visits.', 800, 'doc_general_1:main_branch:in_person', 'in_person', '2026-08-27 09:00', 'Hospital visit'),
    ('General Medicine Consultant', 'main_branch', 'doc_general_1', 'English, Hindi, Telugu', 'general_medicine', 'Main Branch', 'Dr. Ananya Rao', 'MBBS, MD General Medicine', 'General OPD care for fever, infections, routine illness, preventive care, and follow-up visits.', 600, 'doc_general_1:main_branch:online', 'online', '2026-08-27 09:00', 'Online consultation'),
    ('General Medicine Consultant', 'north_branch', 'doc_general_1', 'English, Hindi, Telugu', 'general_medicine', 'North Branch', 'Dr. Ananya Rao', 'MBBS, MD General Medicine', 'General OPD care for fever, infections, routine illness, preventive care, and follow-up visits.', 600, 'doc_general_1:north_branch:online', 'online', '2026-08-27 09:00', 'Online consultation'),
    ('General Medicine Consultant', 'south_branch', 'doc_general_1', 'English, Hindi, Telugu', 'general_medicine', 'South Branch', 'Dr. Ananya Rao', 'MBBS, MD General Medicine', 'General OPD care for fever, infections, routine illness, preventive care, and follow-up visits.', 600, 'doc_general_1:south_branch:online', 'online', '2026-08-27 09:00', 'Online consultation'),
    ('Cardiology Consultant', 'main_branch', 'doc_cardio_1', 'English, Hindi', 'cardiology', 'Main Branch', 'Dr. Vikram Mehta', 'MBBS, MD, DM Cardiology', 'Heart-care consultation for chest discomfort, BP review, cardiac follow-up, and preventive cardiology.', 1200, 'doc_cardio_1:main_branch:in_person', 'in_person', '2026-08-27 09:00', 'Hospital visit'),
    ('Cardiology Consultant', 'north_branch', 'doc_cardio_1', 'English, Hindi', 'cardiology', 'North Branch', 'Dr. Vikram Mehta', 'MBBS, MD, DM Cardiology', 'Heart-care consultation for chest discomfort, BP review, cardiac follow-up, and preventive cardiology.', 1200, 'doc_cardio_1:north_branch:in_person', 'in_person', '2026-08-27 09:00', 'Hospital visit'),
    ('Cardiology Consultant', 'south_branch', 'doc_cardio_1', 'English, Hindi', 'cardiology', 'South Branch', 'Dr. Vikram Mehta', 'MBBS, MD, DM Cardiology', 'Heart-care consultation for chest discomfort, BP review, cardiac follow-up, and preventive cardiology.', 1200, 'doc_cardio_1:south_branch:in_person', 'in_person', '2026-08-27 09:00', 'Hospital visit'),
    ('Cardiology Consultant', 'main_branch', 'doc_cardio_1', 'English, Hindi', 'cardiology', 'Main Branch', 'Dr. Vikram Mehta', 'MBBS, MD, DM Cardiology', 'Heart-care consultation for chest discomfort, BP review, cardiac follow-up, and preventive cardiology.', 1000, 'doc_cardio_1:main_branch:online', 'online', '2026-08-27 09:00', 'Online consultation'),
    ('Cardiology Consultant', 'north_branch', 'doc_cardio_1', 'English, Hindi', 'cardiology', 'North Branch', 'Dr. Vikram Mehta', 'MBBS, MD, DM Cardiology', 'Heart-care consultation for chest discomfort, BP review, cardiac follow-up, and preventive cardiology.', 1000, 'doc_cardio_1:north_branch:online', 'online', '2026-08-27 09:00', 'Online consultation'),
    ('Cardiology Consultant', 'south_branch', 'doc_cardio_1', 'English, Hindi', 'cardiology', 'South Branch', 'Dr. Vikram Mehta', 'MBBS, MD, DM Cardiology', 'Heart-care consultation for chest discomfort, BP review, cardiac follow-up, and preventive cardiology.', 1000, 'doc_cardio_1:south_branch:online', 'online', '2026-08-27 09:00', 'Online consultation'),
    ('Orthopedics Consultant', 'main_branch', 'doc_ortho_1', 'English, Hindi, Telugu', 'orthopedics', 'Main Branch', 'Dr. Kavya Nair', 'MBBS, MS Orthopedics', 'Bone, joint, spine, injury, mobility, and post-operative follow-up consultation.', 1000, 'doc_ortho_1:main_branch:in_person', 'in_person', '2026-08-27 09:00', 'Hospital visit'),
    ('Orthopedics Consultant', 'north_branch', 'doc_ortho_1', 'English, Hindi, Telugu', 'orthopedics', 'North Branch', 'Dr. Kavya Nair', 'MBBS, MS Orthopedics', 'Bone, joint, spine, injury, mobility, and post-operative follow-up consultation.', 1000, 'doc_ortho_1:north_branch:in_person', 'in_person', '2026-08-27 09:00', 'Hospital visit'),
    ('Orthopedics Consultant', 'south_branch', 'doc_ortho_1', 'English, Hindi, Telugu', 'orthopedics', 'South Branch', 'Dr. Kavya Nair', 'MBBS, MS Orthopedics', 'Bone, joint, spine, injury, mobility, and post-operative follow-up consultation.', 1000, 'doc_ortho_1:south_branch:in_person', 'in_person', '2026-08-27 09:00', 'Hospital visit'),
    ('Orthopedics Consultant', 'main_branch', 'doc_ortho_1', 'English, Hindi, Telugu', 'orthopedics', 'Main Branch', 'Dr. Kavya Nair', 'MBBS, MS Orthopedics', 'Bone, joint, spine, injury, mobility, and post-operative follow-up consultation.', 800, 'doc_ortho_1:main_branch:online', 'online', '2026-08-27 09:00', 'Online consultation'),
    ('Orthopedics Consultant', 'north_branch', 'doc_ortho_1', 'English, Hindi, Telugu', 'orthopedics', 'North Branch', 'Dr. Kavya Nair', 'MBBS, MS Orthopedics', 'Bone, joint, spine, injury, mobility, and post-operative follow-up consultation.', 800, 'doc_ortho_1:north_branch:online', 'online', '2026-08-27 09:00', 'Online consultation'),
    ('Orthopedics Consultant', 'south_branch', 'doc_ortho_1', 'English, Hindi, Telugu', 'orthopedics', 'South Branch', 'Dr. Kavya Nair', 'MBBS, MS Orthopedics', 'Bone, joint, spine, injury, mobility, and post-operative follow-up consultation.', 800, 'doc_ortho_1:south_branch:online', 'online', '2026-08-27 09:00', 'Online consultation')
),
doctor_records AS (
  SELECT
    'seed-doctor:' || doctor_scope_key AS record_id,
    'doctors'::text AS collection,
    'doctor_scope_key'::text AS unique_key_field,
    lower(doctor_scope_key) AS unique_key_value_normalized,
    jsonb_build_object(
      'doctor_id', doctor_id,
      'doctor_scope_key', doctor_scope_key,
      'title', title,
      'display_name', display_name,
      'department', department,
      'branch_id', branch_id,
      'branch_name', branch_name,
      'consultation_mode', consultation_mode,
      'consultation_type_label', consultation_type_label,
      'qualification', qualification,
      'languages', languages,
      'consultation_fee', consultation_fee,
      'profile_summary', profile_summary,
      'next_available_slot', next_available_slot
    ) AS data_json
  FROM seed_doctors
),
base_slots AS (
  SELECT
    doctor_scope_key,
    branch_id,
    doctor_id,
    department,
    consultation_mode,
    substring(next_available_slot from 1 for 10)::date AS slot_date,
    substring(next_available_slot from 12 for 5)::time AS first_start
  FROM seed_doctors
  WHERE next_available_slot IS NOT NULL
    AND trim(next_available_slot) <> ''
),
seed_slots AS (
  SELECT
    b.doctor_scope_key,
    b.branch_id,
    b.doctor_id,
    b.department,
    b.consultation_mode,
    b.slot_date,
    (b.first_start + (slot_index * INTERVAL '30 minutes'))::time AS slot_start,
    (b.first_start + (slot_index * INTERVAL '30 minutes') + INTERVAL '20 minutes')::time AS slot_end
  FROM base_slots b
  CROSS JOIN (VALUES (0), (1), (2), (3)) AS slots(slot_index)
),
slot_records_base AS (
  SELECT
    'seed-slot:' || slot_id AS record_id,
    'appointment_slots'::text AS collection,
    'slot_id'::text AS unique_key_field,
    lower(slot_id) AS unique_key_value_normalized,
    jsonb_build_object(
      'id', slot_id,
      'slot_id', slot_id,
      'doctor_scope_key', doctor_scope_key,
      'doctor_id', doctor_id,
      'department', department,
      'date', to_char(slot_date, 'YYYY-MM-DD'),
      'label', to_char(slot_start, 'HH12:MI AM') || ' - ' || to_char(slot_end, 'HH12:MI AM'),
      'start', to_char(slot_start, 'HH24:MI'),
      'end', to_char(slot_end, 'HH24:MI'),
      'status', 'available',
      'hold_id', '',
      'held_by_session', '',
      'appointment_id', '',
      'patient_mobile', '',
      'branch_id', branch_id,
      'consultation_mode', consultation_mode,
      'hold_ttl_minutes', 10
    ) AS data_json
  FROM (
    SELECT
      regexp_replace(doctor_scope_key, '[^a-zA-Z0-9]+', '_', 'g') || '_' || to_char(slot_date, 'YYYY_MM_DD') || '_' || to_char(slot_start, 'HH24MI') AS slot_id,
      doctor_scope_key,
      branch_id,
      doctor_id,
      department,
      consultation_mode,
      slot_date,
      slot_start,
      slot_end
    FROM seed_slots
  ) generated_slots
),
slot_records AS (
  SELECT
    base.record_id,
    base.collection,
    base.unique_key_field,
    base.unique_key_value_normalized,
    CASE
      WHEN existing."dataJson"->>'status' = 'booked'
        THEN
          base.data_json ||
          jsonb_build_object(
            'status', 'booked',
            'hold_id', COALESCE(existing."dataJson"->>'hold_id', ''),
            'held_by_session', COALESCE(existing."dataJson"->>'held_by_session', ''),
            'appointment_id', COALESCE(existing."dataJson"->>'appointment_id', ''),
            'patient_mobile', COALESCE(existing."dataJson"->>'patient_mobile', '')
          )
      ELSE base.data_json
    END AS data_json
  FROM slot_records_base base
  CROSS JOIN params
  LEFT JOIN "flow_records" existing
    ON existing."tenantId" = params.tenant_id
   AND existing."collection" = base.collection
   AND existing."uniqueKeyField" = base.unique_key_field
   AND existing."uniqueKeyValueNormalized" = base.unique_key_value_normalized
),
seed_records AS (
  SELECT * FROM doctor_records
  UNION ALL
  SELECT * FROM slot_records
),
upsert_records AS (
  INSERT INTO "flow_records" (
    "id",
    "tenantId",
    "collection",
    "dataJson",
    "uniqueKeyField",
    "uniqueKeyValueNormalized",
    "version",
    "createdByConversationId",
    "updatedByConversationId",
    "deletedAt",
    "createdAt",
    "updatedAt"
  )
  SELECT
    seed_records.record_id,
    params.tenant_id,
    seed_records.collection,
    seed_records.data_json,
    seed_records.unique_key_field,
    seed_records.unique_key_value_normalized,
    1,
    params.source_tag,
    params.source_tag,
    NULL,
    NOW(),
    NOW()
  FROM seed_records
  CROSS JOIN params
  ON CONFLICT ("tenantId", "collection", "uniqueKeyField", "uniqueKeyValueNormalized") DO UPDATE
  SET
    "dataJson" = EXCLUDED."dataJson",
    "updatedByConversationId" = EXCLUDED."updatedByConversationId",
    "deletedAt" = NULL,
    "updatedAt" = NOW(),
    "version" = "flow_records"."version" + 1
  RETURNING 1
),
matched_records AS (
  SELECT
    fr."id" AS record_id,
    fr."collection" AS collection,
    fr."dataJson" AS data_json
  FROM "flow_records" fr
  JOIN params
    ON params.tenant_id = fr."tenantId"
  JOIN seed_records sr
    ON sr.collection = fr."collection"
   AND sr.unique_key_field = fr."uniqueKeyField"
   AND sr.unique_key_value_normalized = fr."uniqueKeyValueNormalized"
),
deleted_indexes AS (
  DELETE FROM "flow_record_indexes"
  WHERE "recordId" IN (SELECT record_id FROM matched_records)
  RETURNING 1
),
index_rows AS (
  SELECT
    mr.record_id,
    mr.collection,
    kv.key AS field_name,
    CASE
      WHEN jsonb_typeof(kv.value) = 'string' THEN trim(both '"' from kv.value::text)
      ELSE kv.value::text
    END AS value_text,
    CASE
      WHEN kv.key = 'patient_mobile'
        THEN
          CASE
            WHEN right(regexp_replace(
              CASE
                WHEN jsonb_typeof(kv.value) = 'string' THEN trim(both '"' from kv.value::text)
                ELSE kv.value::text
              END,
              '[^0-9]',
              '',
              'g'
            ), 10) = ''
              THEN ''
            ELSE 'phone:' || right(regexp_replace(
              CASE
                WHEN jsonb_typeof(kv.value) = 'string' THEN trim(both '"' from kv.value::text)
                ELSE kv.value::text
              END,
              '[^0-9]',
              '',
              'g'
            ), 10)
          END
      ELSE lower(trim(
        CASE
          WHEN jsonb_typeof(kv.value) = 'string' THEN trim(both '"' from kv.value::text)
          ELSE kv.value::text
        END
      ))
    END AS value_normalized
  FROM matched_records mr
  CROSS JOIN LATERAL jsonb_each(mr.data_json) AS kv(key, value)
  WHERE jsonb_typeof(kv.value) IN ('string', 'number', 'boolean')
),
insert_indexes AS (
  INSERT INTO "flow_record_indexes" (
    "id",
    "recordId",
    "tenantId",
    "collection",
    "field",
    "valueText",
    "valueNormalized",
    "createdAt",
    "updatedAt"
  )
  SELECT
    'idx:' || md5(index_rows.record_id || ':' || index_rows.field_name),
    index_rows.record_id,
    params.tenant_id,
    index_rows.collection,
    index_rows.field_name,
    index_rows.value_text,
    index_rows.value_normalized,
    NOW(),
    NOW()
  FROM index_rows
  CROSS JOIN params
  WHERE index_rows.value_text <> ''
  ON CONFLICT ("id") DO UPDATE
  SET
    "valueText" = EXCLUDED."valueText",
    "valueNormalized" = EXCLUDED."valueNormalized",
    "updatedAt" = NOW()
  RETURNING 1
)
SELECT
  params.tenant_id AS seeded_tenant_id,
  COUNT(*) FILTER (WHERE seed_records.collection = 'doctors') AS doctor_records_seeded,
  COUNT(*) FILTER (WHERE seed_records.collection = 'appointment_slots') AS slot_records_seeded
FROM params
CROSS JOIN seed_records
GROUP BY params.tenant_id;

COMMIT;

-- Suggested verification after the commit:
-- SELECT "collection", COUNT(*)
-- FROM "flow_records"
-- WHERE "tenantId" = '8285edc4-af68-46c0-9e72-5b2819cb33d9'
--   AND "collection" IN ('doctors', 'appointment_slots')
-- GROUP BY "collection"
-- ORDER BY "collection";
--
-- SELECT
--   "dataJson"->>'doctor_scope_key' AS doctor_scope_key,
--   "dataJson"->>'display_name' AS display_name,
--   "dataJson"->>'consultation_mode' AS consultation_mode
-- FROM "flow_records"
-- WHERE "tenantId" = '8285edc4-af68-46c0-9e72-5b2819cb33d9'
--   AND "collection" = 'doctors'
-- ORDER BY "dataJson"->>'doctor_scope_key';
--
-- SELECT
--   "dataJson"->>'slot_id' AS slot_id,
--   "dataJson"->>'status' AS status,
--   "dataJson"->>'appointment_id' AS appointment_id
-- FROM "flow_records"
-- WHERE "tenantId" = '8285edc4-af68-46c0-9e72-5b2819cb33d9'
--   AND "collection" = 'appointment_slots'
-- ORDER BY "dataJson"->>'slot_id';
