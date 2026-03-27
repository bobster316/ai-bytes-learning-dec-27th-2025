-- Migration: 20260118_magic_hour_integration
-- Description: Adds tables and columns for Magic Hour AI Avatar integration

-- 1. Create video_render_jobs table
CREATE TABLE IF NOT EXISTS video_render_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id TEXT NOT NULL, -- Magic Hour Request ID / Video ID
  status TEXT CHECK (status IN ('pending', 'processing', 'completed', 'failed')) DEFAULT 'pending',
  entity_type TEXT CHECK (entity_type IN ('course_intro', 'module_intro')),
  entity_id BIGINT NOT NULL,
  video_url TEXT, -- Final permalink (S3/Supabase Storage)
  download_url TEXT, -- Temporary URL from Magic Hour
  metadata JSONB DEFAULT '{}'::jsonb, -- Store prompts, avatar configs
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Add video columns to existing tables
ALTER TABLE ai_generated_courses
ADD COLUMN IF NOT EXISTS intro_video_url TEXT;

ALTER TABLE course_topics
ADD COLUMN IF NOT EXISTS intro_video_url TEXT;

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_video_jobs_status ON video_render_jobs(status);
CREATE INDEX IF NOT EXISTS idx_video_jobs_entity ON video_render_jobs(entity_type, entity_id);

-- 4. Row Level Security
ALTER TABLE video_render_jobs ENABLE ROW LEVEL SECURITY;

-- Only admins can manage video jobs
CREATE POLICY "Admins can manage video jobs" ON video_render_jobs
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

-- 5. Triggers (Assumes update_updated_at_column function exists from previous migrations)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
        CREATE TRIGGER update_video_jobs_updated_at
        BEFORE UPDATE ON video_render_jobs
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;
