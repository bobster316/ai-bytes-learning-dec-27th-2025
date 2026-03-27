-- Migration: Add Video Job Tracking for AI Avatar Integration
-- Created: 2026-01-21
-- Description: Adds columns to track video generation jobs for course/module/lesson introductions

-- Add video tracking columns to course_lessons
ALTER TABLE course_lessons 
ADD COLUMN IF NOT EXISTS video_job_id TEXT,
ADD COLUMN IF NOT EXISTS video_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS video_generated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS video_error TEXT;

-- Add video tracking columns to courses (for course intro videos)
ALTER TABLE courses 
ADD COLUMN IF NOT EXISTS intro_video_job_id TEXT,
ADD COLUMN IF NOT EXISTS intro_video_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS intro_video_url TEXT,
ADD COLUMN IF NOT EXISTS intro_video_generated_at TIMESTAMPTZ;

-- Add video tracking columns to course_topics (for module intro videos)
ALTER TABLE course_topics 
ADD COLUMN IF NOT EXISTS intro_video_job_id TEXT,
ADD COLUMN IF NOT EXISTS intro_video_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS intro_video_url TEXT,
ADD COLUMN IF NOT EXISTS intro_video_generated_at TIMESTAMPTZ;

-- Create index for efficient video job queries
CREATE INDEX IF NOT EXISTS idx_lessons_video_status ON course_lessons(video_status);
CREATE INDEX IF NOT EXISTS idx_courses_intro_video_status ON courses(intro_video_status);
CREATE INDEX IF NOT EXISTS idx_topics_intro_video_status ON course_topics(intro_video_status);

-- Add comments for documentation
COMMENT ON COLUMN course_lessons.video_job_id IS 'Job ID from video generation service (ElevenLabs + HeyGen or Magic Hour)';
COMMENT ON COLUMN course_lessons.video_status IS 'Status: pending, queued, processing, completed, failed';
COMMENT ON COLUMN course_lessons.video_generated_at IS 'Timestamp when video generation completed';
COMMENT ON COLUMN course_lessons.video_error IS 'Error message if video generation failed';

COMMENT ON COLUMN courses.intro_video_job_id IS 'Job ID for course introduction video';
COMMENT ON COLUMN courses.intro_video_status IS 'Status: pending, queued, processing, completed, failed';
COMMENT ON COLUMN courses.intro_video_url IS 'URL to completed course intro video';

COMMENT ON COLUMN course_topics.intro_video_job_id IS 'Job ID for module introduction video';
COMMENT ON COLUMN course_topics.intro_video_status IS 'Status: pending, queued, processing, completed, failed';
COMMENT ON COLUMN course_topics.intro_video_url IS 'URL to completed module intro video';
