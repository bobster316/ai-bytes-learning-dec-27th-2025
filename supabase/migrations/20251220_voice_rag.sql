-- Create extension for vector search if it doesn't exist
create extension if not exists vector;

-- Table 1: Store voice conversations
create table if not exists voice_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  course_id uuid references courses(id), -- Assuming courses table exists and uses uuid
  lesson_id uuid references lessons(id), -- Assuming lessons table exists and uses uuid
  started_at timestamptz default now() not null,
  ended_at timestamptz,
  messages jsonb default '[]'::jsonb not null, -- Array of conversation messages
  topics_discussed text[],
  summary text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now() not null
);

-- RLS for voice_conversations
alter table voice_conversations enable row level security;

create policy "Users can view own conversations"
on voice_conversations for select
using (auth.uid() = user_id);

create policy "Users can insert own conversations"
on voice_conversations for insert
with check (auth.uid() = user_id);

create policy "Users can update own conversations"
on voice_conversations for update
using (auth.uid() = user_id);

-- Table 2: Store course content embeddings for RAG
-- Note: User mentioned 'bigint' for course_id/lesson_id in previous transcript fixes, 
-- but 'references' implies we should match the foreign key type. 
-- I will assume existing tables might use int8 (bigint) if they were imported, 
-- or uuid if they were created standard.
-- To be safe based on the "Fix Database Schema" part of the transcript 
-- where it explicitly changed to bigint:

create table if not exists course_content_vectors (
  id uuid primary key default gen_random_uuid(),
  course_id bigint, -- Changed to bigint as per transcript fix
  lesson_id bigint, -- Changed to bigint as per transcript fix
  content_chunk text not null,
  embedding vector(768), -- Dimension for text-embedding-004
  created_at timestamptz default now() not null,
  metadata jsonb default '{}'::jsonb
);

-- Index for fast vector search
create index if not exists course_content_vectors_embedding_idx 
on course_content_vectors using hnsw (embedding vector_cosine_ops);

-- RLS for course_content_vectors
alter table course_content_vectors enable row level security;

create policy "Public read access to vectors"
on course_content_vectors for select
using (true);

-- Search function
create or replace function match_course_content (
  query_embedding vector(768),
  match_threshold float,
  match_count int,
  filter_course_id bigint default null
)
returns table (
  id uuid,
  course_id bigint,
  lesson_id bigint,
  content_chunk text,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    course_content_vectors.id,
    course_content_vectors.course_id,
    course_content_vectors.lesson_id,
    course_content_vectors.content_chunk,
    1 - (course_content_vectors.embedding <=> query_embedding) as similarity
  from course_content_vectors
  where 1 - (course_content_vectors.embedding <=> query_embedding) > match_threshold
    and (filter_course_id is null or course_content_vectors.course_id = filter_course_id)
  order by course_content_vectors.embedding <=> query_embedding
  limit match_count;
end;
$$;
