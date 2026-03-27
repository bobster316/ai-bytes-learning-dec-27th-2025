-- Migration to add JSON structured content blocks for AI Bytes Learning
-- Run this in the Supabase Dashboard SQL Editor

BEGIN;

-- 1. Add the new JSONB column to course_lessons
ALTER TABLE course_lessons
ADD COLUMN IF NOT EXISTS content_blocks JSONB DEFAULT '[]'::jsonb;

-- 2. Add an index to query lessons by block type efficiently later if needed
-- This is a GIN index that helps search within the JSONB structure quickly
CREATE INDEX IF NOT EXISTS idx_course_lessons_blocks 
ON course_lessons USING GIN (content_blocks);

COMMIT;
