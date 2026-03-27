
-- 1. Create the bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'course-images', 
  'course-images', 
  true, 
  52428800, -- 50MB
  ARRAY['image/png', 'image/jpeg', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET 
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/gif', 'image/webp'];

-- 2. Enable RLS on objects (good practice)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. DROP existing policies to avoid conflicts
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Uploads" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Updates" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Deletes" ON storage.objects;
DROP POLICY IF EXISTS "Give me access" ON storage.objects; -- Common default name

-- 4. Create NEW permissive policies for "course-images"

-- ALLOW EVERYONE to VIEW images (Public)
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'course-images' );

-- ALLOW AUTHENTICATED USERS (Admins) to UPLOAD
CREATE POLICY "Authenticated Uploads" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK ( bucket_id = 'course-images' );

-- ALLOW AUTHENTICATED USERS to UPDATE their uploads
CREATE POLICY "Authenticated Updates" 
ON storage.objects FOR UPDATE 
TO authenticated 
USING ( bucket_id = 'course-images' );

-- ALLOW AUTHENTICATED USERS to DELETE their uploads
CREATE POLICY "Authenticated Deletes" 
ON storage.objects FOR DELETE 
TO authenticated 
USING ( bucket_id = 'course-images' );
