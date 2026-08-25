-- Hospital doctor and appointment-slot seed aligned to the attached DB data.
-- Run this against the database backing the FLOW record collections `doctors` and `appointment_slots`.
-- If your deployment stores collections in a generic JSON records table, keep the same field names
-- inside the record payload instead of using these direct table names.
--
-- Data contract used by the booking flow:
--   doctors unique key: doctor_scope_key = doctor_id:branch_id:consultation_mode
--   slot lookup key: branch_id + doctor_id + consultation_mode + status = available
--   slot update key: slot_id, with status changing available -> held -> booked
--
-- Important: doctor rows alone are not enough for booking. The appointment node reads
-- appointment_slots. This seed creates appointment_slots from each doctor's next_available_slot.

ALTER TABLE IF EXISTS doctors ADD COLUMN IF NOT EXISTS id TEXT;
ALTER TABLE IF EXISTS doctors ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE IF EXISTS doctors ADD COLUMN IF NOT EXISTS branch_id TEXT;
ALTER TABLE IF EXISTS doctors ADD COLUMN IF NOT EXISTS doctor_id TEXT;
ALTER TABLE IF EXISTS doctors ADD COLUMN IF NOT EXISTS languages TEXT;
ALTER TABLE IF EXISTS doctors ADD COLUMN IF NOT EXISTS department TEXT;
ALTER TABLE IF EXISTS doctors ADD COLUMN IF NOT EXISTS branch_name TEXT;
ALTER TABLE IF EXISTS doctors ADD COLUMN IF NOT EXISTS display_name TEXT;
ALTER TABLE IF EXISTS doctors ADD COLUMN IF NOT EXISTS qualification TEXT;
ALTER TABLE IF EXISTS doctors ADD COLUMN IF NOT EXISTS profile_summary TEXT;
ALTER TABLE IF EXISTS doctors ADD COLUMN IF NOT EXISTS consultation_fee NUMERIC;
ALTER TABLE IF EXISTS doctors ADD COLUMN IF NOT EXISTS doctor_scope_key TEXT;
ALTER TABLE IF EXISTS doctors ADD COLUMN IF NOT EXISTS consultation_mode TEXT;
ALTER TABLE IF EXISTS doctors ADD COLUMN IF NOT EXISTS next_available_slot TEXT;
ALTER TABLE IF EXISTS doctors ADD COLUMN IF NOT EXISTS consultation_type_label TEXT;

ALTER TABLE IF EXISTS appointment_slots ADD COLUMN IF NOT EXISTS id TEXT;
ALTER TABLE IF EXISTS appointment_slots ADD COLUMN IF NOT EXISTS slot_id TEXT;
ALTER TABLE IF EXISTS appointment_slots ADD COLUMN IF NOT EXISTS doctor_scope_key TEXT;
ALTER TABLE IF EXISTS appointment_slots ADD COLUMN IF NOT EXISTS doctor_id TEXT;
ALTER TABLE IF EXISTS appointment_slots ADD COLUMN IF NOT EXISTS department TEXT;
ALTER TABLE IF EXISTS appointment_slots ADD COLUMN IF NOT EXISTS date TEXT;
ALTER TABLE IF EXISTS appointment_slots ADD COLUMN IF NOT EXISTS label TEXT;
ALTER TABLE IF EXISTS appointment_slots ADD COLUMN IF NOT EXISTS start TEXT;
ALTER TABLE IF EXISTS appointment_slots ADD COLUMN IF NOT EXISTS "end" TEXT;
ALTER TABLE IF EXISTS appointment_slots ADD COLUMN IF NOT EXISTS status TEXT;
ALTER TABLE IF EXISTS appointment_slots ADD COLUMN IF NOT EXISTS hold_id TEXT;
ALTER TABLE IF EXISTS appointment_slots ADD COLUMN IF NOT EXISTS held_by_session TEXT;
ALTER TABLE IF EXISTS appointment_slots ADD COLUMN IF NOT EXISTS appointment_id TEXT;
ALTER TABLE IF EXISTS appointment_slots ADD COLUMN IF NOT EXISTS patient_mobile TEXT;
ALTER TABLE IF EXISTS appointment_slots ADD COLUMN IF NOT EXISTS branch_id TEXT;
ALTER TABLE IF EXISTS appointment_slots ADD COLUMN IF NOT EXISTS consultation_mode TEXT;
ALTER TABLE IF EXISTS appointment_slots ADD COLUMN IF NOT EXISTS hold_ttl_minutes NUMERIC;

CREATE UNIQUE INDEX IF NOT EXISTS doctors_doctor_scope_key_uidx ON doctors (doctor_scope_key);
CREATE UNIQUE INDEX IF NOT EXISTS appointment_slots_slot_id_uidx ON appointment_slots (slot_id);

WITH seed_doctors (
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
  ('General Medicine Consultant', 'north_branch', 'doc_general_1', 'English, Hindi, Telugu', 'general_medicine', 'North Branch', 'Dr. Ananya Rao', 'MBBS, MD General Medicine', 'General OPD care for fever, infections, routine illness, preventive care, and follow-up visits.', 800, 'doc_general_1:north_branch:in_person', 'in_person', '2026-07-27 09:00', 'Hospital visit'),
  ('General Medicine Consultant', 'south_branch', 'doc_general_1', 'English, Hindi, Telugu', 'general_medicine', 'South Branch', 'Dr. Ananya Rao', 'MBBS, MD General Medicine', 'General OPD care for fever, infections, routine illness, preventive care, and follow-up visits.', 800, 'doc_general_1:south_branch:in_person', 'in_person', '2026-07-27 09:00', 'Hospital visit'),
  ('General Medicine Consultant', 'main_branch', 'doc_general_1', 'English, Hindi, Telugu', 'general_medicine', 'Main Branch', 'Dr. Ananya Rao', 'MBBS, MD General Medicine', 'General OPD care for fever, infections, routine illness, preventive care, and follow-up visits.', 800, 'doc_general_1:main_branch:in_person', 'in_person', '2026-07-27 09:00', 'Hospital visit'),
  ('General Medicine Consultant', 'main_branch', 'doc_general_1', 'English, Hindi, Telugu', 'general_medicine', 'Main Branch', 'Dr. Ananya Rao', 'MBBS, MD General Medicine', 'General OPD care for fever, infections, routine illness, preventive care, and follow-up visits.', 600, 'doc_general_1:main_branch:online', 'online', '2026-07-27 09:00', 'Online consultation'),
  ('General Medicine Consultant', 'north_branch', 'doc_general_1', 'English, Hindi, Telugu', 'general_medicine', 'North Branch', 'Dr. Ananya Rao', 'MBBS, MD General Medicine', 'General OPD care for fever, infections, routine illness, preventive care, and follow-up visits.', 600, 'doc_general_1:north_branch:online', 'online', '2026-07-27 09:00', 'Online consultation'),
  ('General Medicine Consultant', 'south_branch', 'doc_general_1', 'English, Hindi, Telugu', 'general_medicine', 'South Branch', 'Dr. Ananya Rao', 'MBBS, MD General Medicine', 'General OPD care for fever, infections, routine illness, preventive care, and follow-up visits.', 600, 'doc_general_1:south_branch:online', 'online', '2026-07-27 09:00', 'Online consultation'),
  ('Cardiology Consultant', 'main_branch', 'doc_cardio_1', 'English, Hindi', 'cardiology', 'Main Branch', 'Dr. Vikram Mehta', 'MBBS, MD, DM Cardiology', 'Heart-care consultation for chest discomfort, BP review, cardiac follow-up, and preventive cardiology.', 1200, 'doc_cardio_1:main_branch:in_person', 'in_person', '2026-07-27 09:00', 'Hospital visit'),
  ('Cardiology Consultant', 'north_branch', 'doc_cardio_1', 'English, Hindi', 'cardiology', 'North Branch', 'Dr. Vikram Mehta', 'MBBS, MD, DM Cardiology', 'Heart-care consultation for chest discomfort, BP review, cardiac follow-up, and preventive cardiology.', 1200, 'doc_cardio_1:north_branch:in_person', 'in_person', '2026-07-27 09:00', 'Hospital visit'),
  ('Cardiology Consultant', 'south_branch', 'doc_cardio_1', 'English, Hindi', 'cardiology', 'South Branch', 'Dr. Vikram Mehta', 'MBBS, MD, DM Cardiology', 'Heart-care consultation for chest discomfort, BP review, cardiac follow-up, and preventive cardiology.', 1200, 'doc_cardio_1:south_branch:in_person', 'in_person', '2026-07-27 09:00', 'Hospital visit'),
  ('Cardiology Consultant', 'main_branch', 'doc_cardio_1', 'English, Hindi', 'cardiology', 'Main Branch', 'Dr. Vikram Mehta', 'MBBS, MD, DM Cardiology', 'Heart-care consultation for chest discomfort, BP review, cardiac follow-up, and preventive cardiology.', 1000, 'doc_cardio_1:main_branch:online', 'online', '2026-07-27 09:00', 'Online consultation'),
  ('Cardiology Consultant', 'north_branch', 'doc_cardio_1', 'English, Hindi', 'cardiology', 'North Branch', 'Dr. Vikram Mehta', 'MBBS, MD, DM Cardiology', 'Heart-care consultation for chest discomfort, BP review, cardiac follow-up, and preventive cardiology.', 1000, 'doc_cardio_1:north_branch:online', 'online', '2026-07-27 09:00', 'Online consultation'),
  ('Cardiology Consultant', 'south_branch', 'doc_cardio_1', 'English, Hindi', 'cardiology', 'South Branch', 'Dr. Vikram Mehta', 'MBBS, MD, DM Cardiology', 'Heart-care consultation for chest discomfort, BP review, cardiac follow-up, and preventive cardiology.', 1000, 'doc_cardio_1:south_branch:online', 'online', '2026-07-27 09:00', 'Online consultation'),
  ('Orthopedics Consultant', 'main_branch', 'doc_ortho_1', 'English, Hindi, Telugu', 'orthopedics', 'Main Branch', 'Dr. Kavya Nair', 'MBBS, MS Orthopedics', 'Bone, joint, spine, injury, mobility, and post-operative follow-up consultation.', 1000, 'doc_ortho_1:main_branch:in_person', 'in_person', '2026-07-27 09:00', 'Hospital visit'),
  ('Orthopedics Consultant', 'north_branch', 'doc_ortho_1', 'English, Hindi, Telugu', 'orthopedics', 'North Branch', 'Dr. Kavya Nair', 'MBBS, MS Orthopedics', 'Bone, joint, spine, injury, mobility, and post-operative follow-up consultation.', 1000, 'doc_ortho_1:north_branch:in_person', 'in_person', '2026-07-27 09:00', 'Hospital visit'),
  ('Orthopedics Consultant', 'south_branch', 'doc_ortho_1', 'English, Hindi, Telugu', 'orthopedics', 'South Branch', 'Dr. Kavya Nair', 'MBBS, MS Orthopedics', 'Bone, joint, spine, injury, mobility, and post-operative follow-up consultation.', 1000, 'doc_ortho_1:south_branch:in_person', 'in_person', '2026-07-27 09:00', 'Hospital visit'),
  ('Orthopedics Consultant', 'main_branch', 'doc_ortho_1', 'English, Hindi, Telugu', 'orthopedics', 'Main Branch', 'Dr. Kavya Nair', 'MBBS, MS Orthopedics', 'Bone, joint, spine, injury, mobility, and post-operative follow-up consultation.', 800, 'doc_ortho_1:main_branch:online', 'online', '2026-07-27 09:00', 'Online consultation'),
  ('Orthopedics Consultant', 'north_branch', 'doc_ortho_1', 'English, Hindi, Telugu', 'orthopedics', 'North Branch', 'Dr. Kavya Nair', 'MBBS, MS Orthopedics', 'Bone, joint, spine, injury, mobility, and post-operative follow-up consultation.', 800, 'doc_ortho_1:north_branch:online', 'online', '2026-07-27 09:00', 'Online consultation'),
  ('Orthopedics Consultant', 'south_branch', 'doc_ortho_1', 'English, Hindi, Telugu', 'orthopedics', 'South Branch', 'Dr. Kavya Nair', 'MBBS, MS Orthopedics', 'Bone, joint, spine, injury, mobility, and post-operative follow-up consultation.', 800, 'doc_ortho_1:south_branch:online', 'online', '2026-07-27 09:00', 'Online consultation')
),
upserted_doctors AS (
  INSERT INTO doctors (
    id,
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
  )
  SELECT
    doctor_scope_key,
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
  FROM seed_doctors
  ON CONFLICT (doctor_scope_key) DO UPDATE SET
    title = EXCLUDED.title,
    branch_id = EXCLUDED.branch_id,
    doctor_id = EXCLUDED.doctor_id,
    languages = EXCLUDED.languages,
    department = EXCLUDED.department,
    branch_name = EXCLUDED.branch_name,
    display_name = EXCLUDED.display_name,
    qualification = EXCLUDED.qualification,
    profile_summary = EXCLUDED.profile_summary,
    consultation_fee = EXCLUDED.consultation_fee,
    consultation_mode = EXCLUDED.consultation_mode,
    next_available_slot = EXCLUDED.next_available_slot,
    consultation_type_label = EXCLUDED.consultation_type_label
  RETURNING doctor_scope_key
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
  WHERE next_available_slot IS NOT NULL AND trim(next_available_slot) <> ''
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
slot_rows AS (
  SELECT
    regexp_replace(doctor_scope_key, '[^a-zA-Z0-9]+', '_', 'g') || '_' || to_char(slot_date, 'YYYY_MM_DD') || '_' || to_char(slot_start, 'HH24MI') AS slot_id,
    doctor_scope_key,
    branch_id,
    doctor_id,
    department,
    consultation_mode,
    to_char(slot_date, 'YYYY-MM-DD') AS slot_date,
    to_char(slot_start, 'HH24:MI') AS start_time,
    to_char(slot_end, 'HH24:MI') AS end_time,
    to_char(slot_start, 'HH12:MI AM') || ' - ' || to_char(slot_end, 'HH12:MI AM') AS slot_label
  FROM seed_slots
)
INSERT INTO appointment_slots (
  id,
  slot_id,
  doctor_scope_key,
  doctor_id,
  department,
  date,
  label,
  start,
  "end",
  status,
  hold_id,
  held_by_session,
  appointment_id,
  patient_mobile,
  branch_id,
  consultation_mode,
  hold_ttl_minutes
)
SELECT
  slot_id,
  slot_id,
  doctor_scope_key,
  doctor_id,
  department,
  slot_date,
  slot_label,
  start_time,
  end_time,
  'available',
  '',
  '',
  '',
  '',
  branch_id,
  consultation_mode,
  10
FROM slot_rows
ON CONFLICT (slot_id) DO UPDATE SET
  doctor_scope_key = EXCLUDED.doctor_scope_key,
  doctor_id = EXCLUDED.doctor_id,
  department = EXCLUDED.department,
  date = EXCLUDED.date,
  label = EXCLUDED.label,
  start = EXCLUDED.start,
  "end" = EXCLUDED."end",
  status = CASE
    WHEN appointment_slots.status = 'booked' THEN appointment_slots.status
    ELSE EXCLUDED.status
  END,
  hold_id = CASE
    WHEN appointment_slots.status = 'booked' THEN appointment_slots.hold_id
    ELSE ''
  END,
  held_by_session = CASE
    WHEN appointment_slots.status = 'booked' THEN appointment_slots.held_by_session
    ELSE ''
  END,
  appointment_id = CASE
    WHEN appointment_slots.status = 'booked' THEN appointment_slots.appointment_id
    ELSE ''
  END,
  patient_mobile = CASE
    WHEN appointment_slots.status = 'booked' THEN appointment_slots.patient_mobile
    ELSE ''
  END,
  branch_id = EXCLUDED.branch_id,
  consultation_mode = EXCLUDED.consultation_mode,
  hold_ttl_minutes = EXCLUDED.hold_ttl_minutes;
