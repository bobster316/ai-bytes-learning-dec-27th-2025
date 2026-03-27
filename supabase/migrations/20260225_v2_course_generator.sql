-- 20260225_v2_course_generator.sql
-- Migration for V2 Enterprise Course Generator State Machine and RAG Knowledge Base

-- 1. Enable pgvector extension if not already enabled (Required for RAG)
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Create the V2 State Machine Tracking Table
CREATE TABLE IF NOT EXISTS generator_node_state (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    node_id VARCHAR(255) NOT NULL, -- e.g., 'les_001', 'mod_001'
    node_type VARCHAR(50) NOT NULL, -- 'course', 'module', 'lesson', 'assessment'
    status VARCHAR(50) NOT NULL DEFAULT 'planned', -- 'planned', 'generating', 'validating', 'published', 'failed'
    progress_percentage INTEGER DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(course_id, node_id)
);

-- 3. Create the RAG Knowledge Base Table (Content Chunks)
CREATE TABLE IF NOT EXISTS content_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id VARCHAR(255) NOT NULL,
    title VARCHAR(255),
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb, -- License, audience, jurisdiction, etc.
    embedding vector(768), -- Assumes Gemini embeddings (768 dimensions), change to 1536 for OpenAI
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create an index for vector similarity search
-- Adjust the lists parameter depending on dataset size, assuming a modest dataset for now.
CREATE INDEX ON content_chunks USING ivfflat (embedding vector_ip_ops) WITH (lists = 100);

-- 4. Create Citations Table (Linking Lessons to Content Chunks)
CREATE TABLE IF NOT EXISTS lesson_citations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id UUID NOT NULL REFERENCES course_lessons(id) ON DELETE CASCADE,
    chunk_id UUID NOT NULL REFERENCES content_chunks(id) ON DELETE CASCADE,
    block_id VARCHAR(255), -- ID of the specific content block in the lesson
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_generator_node_state_updated_at
    BEFORE UPDATE ON generator_node_state
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
