-- Create learning_analytics table if it doesn't exist
CREATE TABLE IF NOT EXISTS learning_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    course_id BIGINT REFERENCES courses(id) ON DELETE CASCADE,
    lesson_id BIGINT REFERENCES course_lessons(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    event_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE learning_analytics ENABLE ROW LEVEL SECURITY;

-- Allow insert
CREATE POLICY "Users can insert their own analytics"
ON learning_analytics
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Allow select
CREATE POLICY "Users can view their own analytics"
ON learning_analytics
FOR SELECT
USING (auth.uid() = user_id);
