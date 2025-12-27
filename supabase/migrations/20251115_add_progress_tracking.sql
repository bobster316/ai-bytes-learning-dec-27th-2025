-- ========================================
-- Add Progress Tracking Fields
-- Migration: 20251115_add_progress_tracking
-- ========================================

-- Add progress tracking fields to ai_generated_courses table
ALTER TABLE ai_generated_courses
ADD COLUMN IF NOT EXISTS current_step TEXT,
ADD COLUMN IF NOT EXISTS percent_complete INT DEFAULT 0 CHECK (percent_complete >= 0 AND percent_complete <= 100),
ADD COLUMN IF NOT EXISTS last_progress_update TIMESTAMP;

-- Index for faster progress queries
CREATE INDEX IF NOT EXISTS idx_ai_courses_progress ON ai_generated_courses(id, generation_status, percent_complete);

-- Comment the new columns
COMMENT ON COLUMN ai_generated_courses.current_step IS 'Current step in the generation process (e.g., "Generating course outline...")';
COMMENT ON COLUMN ai_generated_courses.percent_complete IS 'Progress percentage (0-100)';
COMMENT ON COLUMN ai_generated_courses.last_progress_update IS 'Timestamp of last progress update';
