-- Migration to enable advanced multi-modal content management for AI Bytes
-- Support for NotebookLM Cinematic Videos, Audio Durations, and Regional Voices
-- Run this in the Supabase Dashboard SQL Editor

BEGIN;

-- 1. Add Audio/Video specific fields
ALTER TABLE course_lessons 
ADD COLUMN IF NOT EXISTS audio_duration INTEGER,
ADD COLUMN IF NOT EXISTS video_overview_url TEXT,
ADD COLUMN IF NOT EXISTS video_overview_thumbnail TEXT;

-- 2. Add support for concept-specific micro-videos (JSONB for extensibility)
ALTER TABLE course_lessons 
ADD COLUMN IF NOT EXISTS concept_videos JSONB DEFAULT '[]'::jsonb;

-- 3. Add voice_locale for regional AI coach support (e.g. en-GB, en-US)
ALTER TABLE course_lessons 
ADD COLUMN IF NOT EXISTS voice_locale TEXT DEFAULT 'en-GB';

-- 4. Quality Gate Support (Drafting & Review)
ALTER TABLE course_lessons 
ADD COLUMN IF NOT EXISTS draft_audio_url TEXT,
ADD COLUMN IF NOT EXISTS draft_video_url TEXT,
ADD COLUMN IF NOT EXISTS media_status TEXT DEFAULT 'idle';

-- 5. Add comment for clarity
COMMENT ON COLUMN course_lessons.voice_locale IS 'The locale for the AI narration voice (e.g., en-GB for British Sterling)';

COMMIT;
