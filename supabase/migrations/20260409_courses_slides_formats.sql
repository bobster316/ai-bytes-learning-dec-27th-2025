-- Add PDF and PowerPoint download URL columns to courses table
ALTER TABLE courses
  ADD COLUMN IF NOT EXISTS slides_pdf_url TEXT,
  ADD COLUMN IF NOT EXISTS slides_pptx_url TEXT;

COMMENT ON COLUMN courses.slides_pdf_url IS
  'Public URL of the generated PDF slide deck in Supabase Storage.';

COMMENT ON COLUMN courses.slides_pptx_url IS
  'Public URL of the generated PowerPoint slide deck in Supabase Storage.';
