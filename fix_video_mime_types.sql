-- Fix: Increase file size limit on course-images bucket to allow large video files
-- Veo-generated 1080p 8s videos can be 30-100MB.
-- This sets the limit to 200MB (200 * 1024 * 1024 bytes)
-- Run this in the Supabase SQL editor

UPDATE storage.buckets
SET file_size_limit = 209715200  -- 200 MB in bytes
WHERE id = 'course-images';

-- Also allow video mime types (in case not already set)
UPDATE storage.buckets
SET allowed_mime_types = NULL  -- NULL means accept all types
WHERE id = 'course-images';

-- Verify the change:
SELECT id, name, file_size_limit, allowed_mime_types FROM storage.buckets WHERE id = 'course-images';
