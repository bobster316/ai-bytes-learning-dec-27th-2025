-- supabase/migrations/20260402_spec_v1_columns.sql
-- Adds pedagogical spec compliance tracking columns to course_lessons

ALTER TABLE course_lessons
  ADD COLUMN IF NOT EXISTS schema_version            TEXT    DEFAULT '2.0',
  ADD COLUMN IF NOT EXISTS pedagogical_spec_version  TEXT    DEFAULT '1.0',
  ADD COLUMN IF NOT EXISTS spec_compliant            BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS spec_migrated             BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS has_spec_placeholders     BOOLEAN DEFAULT FALSE;

-- Back-fill schema_version for existing lessons that get NULL from the ALTER
-- (DEFAULT only applies to new rows; existing rows are NULL until updated)
UPDATE course_lessons
SET schema_version = '1.0',
    pedagogical_spec_version = '0.0'
WHERE schema_version IS NULL;

COMMENT ON COLUMN course_lessons.spec_compliant IS
  'TRUE if validateLessonPedagogy passed at insert time or after backfill';
COMMENT ON COLUMN course_lessons.spec_migrated IS
  'TRUE if lesson was upgraded by inject-spec-blocks.ts backfill script';
COMMENT ON COLUMN course_lessons.has_spec_placeholders IS
  'TRUE if any required spec block was injected as a placeholder (needs editorial review)';
