-- Add MARP slide deck columns to courses table
-- slides_url: public Supabase Storage URL for the generated .md file
-- slides_generated_at: timestamp used to detect stale slides after course edits

ALTER TABLE courses
  ADD COLUMN IF NOT EXISTS slides_url TEXT,
  ADD COLUMN IF NOT EXISTS slides_generated_at TIMESTAMPTZ;

COMMENT ON COLUMN courses.slides_url IS
  'Public URL of the MARP .md slide deck in Supabase Storage (course-images/slides/).';

COMMENT ON COLUMN courses.slides_generated_at IS
  'Timestamp of last slide generation. Used to detect stale decks after course content edits.';
