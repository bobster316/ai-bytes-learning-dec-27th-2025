-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ENUMS
DO $$ BEGIN
    CREATE TYPE difficulty_level AS ENUM (
      'Beginner',
      'Intermediate',
      'Advanced'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 1. Course Templates (AI Drafts)
CREATE TABLE course_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    difficulty difficulty_level NOT NULL,
    description TEXT NOT NULL,
    estimated_duration_hours NUMERIC NOT NULL,
    learning_objectives TEXT[] NOT NULL,
    thumbnail_prompt TEXT NOT NULL,
    is_locked BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Courses (Published)
CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id UUID NOT NULL REFERENCES course_templates(id),
    title TEXT NOT NULL,
    difficulty difficulty_level NOT NULL,
    description TEXT NOT NULL,
    estimated_duration_hours NUMERIC NOT NULL,
    learning_objectives TEXT[] NOT NULL,
    thumbnail_url TEXT, -- URL after generation/upload
    thumbnail_prompt TEXT NOT NULL,
    published BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Topics (Shared structure, separate tables for draft/published separation logic or linked to parent)
-- Strategy: We need specific tables for templates vs courses to essentially duplicate the tree structure
-- or use a discriminator.
-- The spec says "Copy all data into courses tree". This implies separate tables or a robust versioning system.
-- Given "Templates and courses must not share rows", we will create separate tables for the published content 
-- to ensure immutability and separation.

-- TEMPLATE TREE

CREATE TABLE template_topics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id UUID NOT NULL REFERENCES course_templates(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    introduction TEXT NOT NULL,
    key_outcomes TEXT[] NOT NULL,
    image_prompt TEXT NOT NULL,
    position INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE template_lessons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    topic_id UUID NOT NULL REFERENCES template_topics(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    summary TEXT NOT NULL,
    content TEXT NOT NULL,
    image_prompts TEXT[] NOT NULL,
    position INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE template_quizzes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    topic_id UUID NOT NULL REFERENCES template_topics(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE template_quiz_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quiz_id UUID NOT NULL REFERENCES template_quizzes(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    options JSONB NOT NULL, -- { A: "", B: "", C: "", D: "" }
    correct_answer TEXT NOT NULL, -- "A", "B", "C", "D"
    explanation TEXT NOT NULL,
    position INTEGER NOT NULL
);

-- PUBLISHED COURSE TREE

CREATE TABLE course_topics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    introduction TEXT NOT NULL,
    key_outcomes TEXT[] NOT NULL,
    image_url TEXT,
    image_prompt TEXT NOT NULL,
    position INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE course_lessons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    topic_id UUID NOT NULL REFERENCES course_topics(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    summary TEXT NOT NULL,
    content TEXT NOT NULL,
    position INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE course_lesson_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lesson_id UUID NOT NULL REFERENCES course_lessons(id) ON DELETE CASCADE,
    image_url TEXT,
    image_prompt TEXT NOT NULL,
    position INTEGER NOT NULL
);

CREATE TABLE course_quizzes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    topic_id UUID NOT NULL REFERENCES course_topics(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE course_quiz_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quiz_id UUID NOT NULL REFERENCES course_quizzes(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    options JSONB NOT NULL,
    correct_answer TEXT NOT NULL,
    explanation TEXT NOT NULL,
    position INTEGER NOT NULL
);
