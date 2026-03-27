-- Migration: 20260112_course_completion_flow
-- Description: Adds tables for course completion, lesson progress, quiz attempts, and certificates.
-- FIX: Uses BIGINT for course_id, topic_id, lesson_id, quiz_id to match existing schema.

-- 1. Enable UUID extension (just in case)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Update Courses and Topics tables
-- Note: Provide IF NOT EXISTS to avoid errors if run multiple times
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='courses' AND column_name='passing_score') THEN
        ALTER TABLE courses ADD COLUMN passing_score DECIMAL(5,2) DEFAULT 70.00;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='courses' AND column_name='certificate_enabled') THEN
        ALTER TABLE courses ADD COLUMN certificate_enabled BOOLEAN DEFAULT TRUE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='courses' AND column_name='certificate_template_id') THEN
        ALTER TABLE courses ADD COLUMN certificate_template_id UUID;
    END IF;
END $$;

DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='course_topics' AND column_name='quiz_passing_score') THEN
        ALTER TABLE course_topics ADD COLUMN quiz_passing_score DECIMAL(5,2) DEFAULT 70.00;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='course_topics' AND column_name='quiz_attempts_allowed') THEN
        ALTER TABLE course_topics ADD COLUMN quiz_attempts_allowed INTEGER;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='course_topics' AND column_name='quiz_retry_delay_hours') THEN
        ALTER TABLE course_topics ADD COLUMN quiz_retry_delay_hours INTEGER;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='course_topics' AND column_name='show_correct_answers') THEN
        ALTER TABLE course_topics ADD COLUMN show_correct_answers BOOLEAN DEFAULT TRUE;
    END IF;
END $$;

-- 3. User Course Progress
CREATE TABLE IF NOT EXISTS user_course_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    course_id BIGINT REFERENCES courses(id) ON DELETE CASCADE, -- CHANGED TO BIGINT
    current_module_id BIGINT, -- CHANGED TO BIGINT (referencing course_topics.id implicitly)
    current_lesson_id BIGINT, -- CHANGED TO BIGINT (referencing course_lessons.id implicitly)
    overall_progress_percentage DECIMAL(5,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'started' CHECK (status IN ('started', 'in_progress', 'completed')),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    total_time_spent INTEGER DEFAULT 0, -- seconds
    last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, course_id)
);

-- 4. Lesson Progress
CREATE TABLE IF NOT EXISTS user_lesson_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    lesson_id BIGINT REFERENCES course_lessons(id) ON DELETE CASCADE, -- CHANGED TO BIGINT
    course_id BIGINT REFERENCES courses(id) ON DELETE CASCADE, -- CHANGED TO BIGINT
    status VARCHAR(20) DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
    progress_percentage DECIMAL(5,2) DEFAULT 0,
    time_spent INTEGER DEFAULT 0,
    last_position JSONB, -- video/scroll position
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, lesson_id)
);

-- 5. Quiz Attempts
CREATE TABLE IF NOT EXISTS quiz_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    quiz_id BIGINT REFERENCES course_quizzes(id) ON DELETE CASCADE, -- CHANGED TO BIGINT
    course_id BIGINT REFERENCES courses(id) ON DELETE CASCADE, -- CHANGED TO BIGINT
    topic_id BIGINT REFERENCES course_topics(id) ON DELETE CASCADE, -- CHANGED TO BIGINT
    attempt_number INTEGER NOT NULL,
    score DECIMAL(5,2) NOT NULL,
    passed BOOLEAN NOT NULL DEFAULT FALSE,
    answers JSONB, -- Store user answers
    time_taken INTEGER, -- seconds
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Certificates
CREATE TABLE IF NOT EXISTS certificates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    certificate_number VARCHAR(50) UNIQUE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    course_id BIGINT REFERENCES courses(id) ON DELETE CASCADE, -- CHANGED TO BIGINT
    final_score DECIMAL(5,2),
    issue_date DATE DEFAULT CURRENT_DATE,
    completion_date DATE DEFAULT CURRENT_DATE,
    metadata JSONB,
    pdf_url VARCHAR(500),
    verification_hash VARCHAR(128),
    revoked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, course_id) -- One active certificate per course per user
);

-- 7. Indexes
CREATE INDEX IF NOT EXISTS idx_user_course_progress_user ON user_course_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_lesson_progress_user_course ON user_lesson_progress(user_id, course_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_quiz ON quiz_attempts(user_id, quiz_id);
CREATE INDEX IF NOT EXISTS idx_certificates_user ON certificates(user_id);
CREATE INDEX IF NOT EXISTS idx_certificates_number ON certificates(certificate_number);

-- 8. RLS Policies
-- Enable RLS
ALTER TABLE user_course_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to be safe if re-running
DROP POLICY IF EXISTS "Users can view own course progress" ON user_course_progress;
DROP POLICY IF EXISTS "Users can update own course progress" ON user_course_progress;
DROP POLICY IF EXISTS "Users can view own lesson progress" ON user_lesson_progress;
DROP POLICY IF EXISTS "Users can update own lesson progress" ON user_lesson_progress;
DROP POLICY IF EXISTS "Users can view own quiz attempts" ON quiz_attempts;
DROP POLICY IF EXISTS "Users can insert own quiz attempts" ON quiz_attempts;
DROP POLICY IF EXISTS "Users can view own certificates" ON certificates;
DROP POLICY IF EXISTS "Public can verify certificates by number" ON certificates;


-- Re-create Policies
CREATE POLICY "Users can view own course progress" ON user_course_progress
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own course progress" ON user_course_progress
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own lesson progress" ON user_lesson_progress
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own lesson progress" ON user_lesson_progress
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own quiz attempts" ON quiz_attempts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own quiz attempts" ON quiz_attempts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own certificates" ON certificates
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Public can verify certificates by number" ON certificates
    FOR SELECT USING (true);
