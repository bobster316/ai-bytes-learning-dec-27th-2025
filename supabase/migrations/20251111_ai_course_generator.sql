-- ========================================
-- AI Course Generator Database Schema
-- Migration: 20251111_ai_course_generator
-- ========================================
--
-- ⚠️  DO NOT USE THIS FILE - IT HAS INCORRECT UUID TYPES
-- ⚠️  USE: 20251111_ai_course_generator_fixed.sql INSTEAD
--
-- This file uses UUID but your database uses BIGINT for IDs.
-- Use the _fixed version instead.
-- ========================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================
-- AI Generated Courses Extension
-- ========================================

-- Tracks AI generation metadata
CREATE TABLE IF NOT EXISTS ai_generated_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,

  -- Input parameters
  original_prompt TEXT NOT NULL,
  difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  target_duration_minutes INT DEFAULT 60,
  target_audience TEXT,

  -- AI generation metadata
  groq_model TEXT DEFAULT 'llama-3.1-70b-versatile',
  generation_started_at TIMESTAMP,
  generation_completed_at TIMESTAMP,
  generation_status TEXT CHECK (generation_status IN ('pending', 'generating', 'completed', 'failed')) DEFAULT 'pending',
  error_message TEXT,

  -- Cost tracking
  groq_tokens_used INT,
  elevenlabs_characters_used INT,
  estimated_cost_usd DECIMAL(10,4),

  -- Quality metrics
  content_quality_score DECIMAL(3,2), -- 0.00 to 1.00
  human_reviewed BOOLEAN DEFAULT FALSE,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Course topics (modules/chapters)
CREATE TABLE IF NOT EXISTS course_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,

  title TEXT NOT NULL,
  description TEXT,
  order_index INT NOT NULL,
  estimated_duration_minutes INT DEFAULT 10,

  -- AI generated content
  learning_objectives TEXT[], -- Array of learning objectives
  prerequisites TEXT[],

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(course_id, order_index)
);

-- Individual lessons within topics
CREATE TABLE IF NOT EXISTS course_lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID REFERENCES course_topics(id) ON DELETE CASCADE,

  title TEXT NOT NULL,
  order_index INT NOT NULL,
  estimated_duration_minutes INT DEFAULT 5,

  -- Content
  content_markdown TEXT NOT NULL, -- Main lesson content in Markdown
  content_html TEXT, -- Rendered HTML (cached)
  key_takeaways TEXT[], -- Array of key points

  -- Media
  thumbnail_url TEXT,
  audio_url TEXT, -- ElevenLabs generated audio
  video_url TEXT, -- For Phase 2: AI avatar video

  -- AI metadata
  generated_with_ai BOOLEAN DEFAULT TRUE,
  ai_confidence_score DECIMAL(3,2), -- 0.00 to 1.00

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(topic_id, order_index)
);

-- Lesson images
CREATE TABLE IF NOT EXISTS lesson_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID REFERENCES course_lessons(id) ON DELETE CASCADE,

  image_url TEXT NOT NULL,
  alt_text TEXT,
  caption TEXT,
  order_index INT,
  source TEXT DEFAULT 'unsplash', -- 'unsplash', 'pexels', 'dalle', etc.
  source_attribution TEXT,

  created_at TIMESTAMP DEFAULT NOW()
);

-- Quizzes per topic
CREATE TABLE IF NOT EXISTS course_quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID REFERENCES course_topics(id) ON DELETE CASCADE,

  title TEXT NOT NULL,
  description TEXT,
  passing_score_percentage INT DEFAULT 70,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Quiz questions
CREATE TABLE IF NOT EXISTS quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID REFERENCES course_quizzes(id) ON DELETE CASCADE,

  question_text TEXT NOT NULL,
  question_type TEXT CHECK (question_type IN ('multiple_choice', 'true_false', 'fill_blank')) DEFAULT 'multiple_choice',
  order_index INT NOT NULL,
  points INT DEFAULT 1,

  -- For multiple choice
  options JSONB, -- [{text: "Option A", is_correct: true}, ...]
  correct_answer TEXT, -- For non-multiple choice
  explanation TEXT, -- Why this is the correct answer

  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(quiz_id, order_index)
);

-- User quiz attempts (for tracking student progress)
CREATE TABLE IF NOT EXISTS user_quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  quiz_id UUID REFERENCES course_quizzes(id) ON DELETE CASCADE,

  score_percentage DECIMAL(5,2),
  passed BOOLEAN,
  answers_json JSONB, -- Student's answers

  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ========================================
-- Indexes for Performance
-- ========================================

CREATE INDEX IF NOT EXISTS idx_ai_courses_status ON ai_generated_courses(generation_status);
CREATE INDEX IF NOT EXISTS idx_ai_courses_course_id ON ai_generated_courses(course_id);
CREATE INDEX IF NOT EXISTS idx_topics_course ON course_topics(course_id, order_index);
CREATE INDEX IF NOT EXISTS idx_lessons_topic ON course_lessons(topic_id, order_index);
CREATE INDEX IF NOT EXISTS idx_lesson_images_lesson ON lesson_images(lesson_id, order_index);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_quiz ON quiz_questions(quiz_id, order_index);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user ON user_quiz_attempts(user_id, created_at DESC);

-- ========================================
-- Row Level Security (RLS) Policies
-- ========================================

-- Enable RLS on all tables
ALTER TABLE ai_generated_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_quiz_attempts ENABLE ROW LEVEL SECURITY;

-- AI Generated Courses: Only admins can insert/update
CREATE POLICY "Admins can manage AI courses" ON ai_generated_courses
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Course Topics: Anyone can view, admins can modify
CREATE POLICY "Anyone can view course topics" ON course_topics
  FOR SELECT USING (TRUE);

CREATE POLICY "Admins can manage course topics" ON course_topics
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Course Lessons: Anyone can view, admins can modify
CREATE POLICY "Anyone can view course lessons" ON course_lessons
  FOR SELECT USING (TRUE);

CREATE POLICY "Admins can manage course lessons" ON course_lessons
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Lesson Images: Anyone can view, admins can modify
CREATE POLICY "Anyone can view lesson images" ON lesson_images
  FOR SELECT USING (TRUE);

CREATE POLICY "Admins can manage lesson images" ON lesson_images
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Course Quizzes: Anyone can view, admins can modify
CREATE POLICY "Anyone can view course quizzes" ON course_quizzes
  FOR SELECT USING (TRUE);

CREATE POLICY "Admins can manage course quizzes" ON course_quizzes
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Quiz Questions: Anyone can view, admins can modify
CREATE POLICY "Anyone can view quiz questions" ON quiz_questions
  FOR SELECT USING (TRUE);

CREATE POLICY "Admins can manage quiz questions" ON quiz_questions
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

-- User Quiz Attempts: Users can view own attempts, admins can view all
CREATE POLICY "Users can view own quiz attempts" ON user_quiz_attempts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own quiz attempts" ON user_quiz_attempts
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all quiz attempts" ON user_quiz_attempts
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

-- ========================================
-- Functions for Updated Timestamps
-- ========================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_ai_generated_courses_updated_at
  BEFORE UPDATE ON ai_generated_courses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_course_topics_updated_at
  BEFORE UPDATE ON course_topics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_course_lessons_updated_at
  BEFORE UPDATE ON course_lessons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_course_quizzes_updated_at
  BEFORE UPDATE ON course_quizzes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- Sample Data (Optional - for testing)
-- ========================================

-- Note: Run this manually after verifying the schema works
-- INSERT INTO courses (id, title, description, price, published)
-- VALUES (
--   gen_random_uuid(),
--   'Test AI Course',
--   'A test course generated by AI',
--   0,
--   false
-- );
