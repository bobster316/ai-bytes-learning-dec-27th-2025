ALTER TABLE course_lessons ADD COLUMN content_blocks JSONB DEFAULT '[]'::jsonb;
