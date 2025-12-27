-- Add thumbnail_url to course_topics table
ALTER TABLE course_topics
ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN course_topics.thumbnail_url IS 'URL for topic thumbnail image';
