-- supabase/migrations/20260326_course_dna.sql
ALTER TABLE courses
    ADD COLUMN IF NOT EXISTS course_dna       JSONB NOT NULL DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS dna_fingerprint  TEXT;

COMMENT ON COLUMN courses.course_dna      IS 'CourseDNA JSON — visual identity and content personality. Generated once on first creation.';
COMMENT ON COLUMN courses.dna_fingerprint IS 'SHA-256 of courseId:title:difficulty. Re-derivable — stored for fast lookup only.';
