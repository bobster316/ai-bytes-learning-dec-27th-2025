-- 20260224_micro_learning_redesign.sql
-- Migration to support micro-learning redesign

ALTER TABLE courses
ADD COLUMN IF NOT EXISTS course_outcome TEXT;

ALTER TABLE courses
ADD COLUMN IF NOT EXISTS is_micro BOOLEAN DEFAULT true;

ALTER TABLE course_lessons
ADD COLUMN IF NOT EXISTS micro_objective TEXT;

ALTER TABLE course_lessons
ADD COLUMN IF NOT EXISTS lesson_action TEXT;

ALTER TABLE course_lessons
ADD COLUMN IF NOT EXISTS estimated_minutes INTEGER DEFAULT 7;
