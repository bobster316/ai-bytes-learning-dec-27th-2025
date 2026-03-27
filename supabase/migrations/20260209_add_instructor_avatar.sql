
-- Add instructor_avatar to courses and course_topics
ALTER TABLE courses ADD COLUMN IF NOT EXISTS instructor_avatar TEXT DEFAULT 'sarah';
ALTER TABLE course_topics ADD COLUMN IF NOT EXISTS instructor_avatar TEXT DEFAULT 'sarah';
ALTER TABLE course_lessons ADD COLUMN IF NOT EXISTS instructor_avatar TEXT DEFAULT 'sarah';
