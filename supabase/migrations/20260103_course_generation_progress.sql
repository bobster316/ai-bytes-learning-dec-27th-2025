-- ========================================
-- Course Generation Progress Tracking Table
-- Migration: 20260103_course_generation_progress
-- ========================================

-- Create table to track real-time course generation progress
CREATE TABLE IF NOT EXISTS course_generation_progress (
  id BIGSERIAL PRIMARY KEY,
  course_id BIGINT REFERENCES courses(id) ON DELETE CASCADE,
  
  -- Progress tracking
  status TEXT CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')) DEFAULT 'in_progress',
  current_step TEXT,
  progress_percentage INT DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  
  -- Error handling
  error_message TEXT,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_generation_progress_course ON course_generation_progress(course_id);
CREATE INDEX IF NOT EXISTS idx_generation_progress_status ON course_generation_progress(status);

-- Enable RLS
ALTER TABLE course_generation_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Admins can manage, users can view
CREATE POLICY "Admins can manage generation progress" ON course_generation_progress
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "Anyone can view generation progress" ON course_generation_progress
  FOR SELECT USING (TRUE);

-- Trigger for updated_at
CREATE TRIGGER update_course_generation_progress_updated_at
  BEFORE UPDATE ON course_generation_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
