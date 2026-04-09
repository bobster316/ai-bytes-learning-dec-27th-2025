-- Per-student slide access tracking
-- Students must explicitly request slides; each student's access is independent.
-- Course-level files (slides_url etc.) are shared, but student_slides controls who can see them.

CREATE TABLE IF NOT EXISTS student_slides (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id     UUID        NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  requested_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status        TEXT        NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'generating', 'ready', 'failed')),
  UNIQUE (user_id, course_id)
);

ALTER TABLE student_slides ENABLE ROW LEVEL SECURITY;

-- Students can read, insert, and update their own rows
CREATE POLICY "student_slides_select_own" ON student_slides
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "student_slides_insert_own" ON student_slides
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "student_slides_update_own" ON student_slides
  FOR UPDATE USING (auth.uid() = user_id);

-- Service role bypasses RLS automatically — no extra policy needed for admin operations.

-- slides_enabled flag: admin can revoke per-course access
ALTER TABLE courses
  ADD COLUMN IF NOT EXISTS slides_enabled BOOLEAN NOT NULL DEFAULT TRUE;

COMMENT ON COLUMN courses.slides_enabled IS
  'When false, students cannot request or view slides for this course. Admin-only toggle.';

COMMENT ON TABLE student_slides IS
  'Per-student slide access. A row with status=ready means this student has generated their slide deck. The actual files live on the courses table (shared URLs).';
