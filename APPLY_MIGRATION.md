# Apply Progress Tracking Migration

## ⚠️ CRITICAL: You MUST apply this migration for progress tracking to work!

Without this migration, you'll see "initialization → completed" instead of detailed progress updates.

## Option 1: Via Supabase Dashboard (Recommended)

1. Go to your **Supabase Dashboard**: https://app.supabase.com
2. Select your project
3. Navigate to **SQL Editor** (left sidebar)
4. Click **New Query**
5. Copy and paste this SQL:

```sql
-- Add progress tracking fields to ai_generated_courses table
ALTER TABLE ai_generated_courses
ADD COLUMN IF NOT EXISTS current_step TEXT,
ADD COLUMN IF NOT EXISTS percent_complete INT DEFAULT 0 CHECK (percent_complete >= 0 AND percent_complete <= 100),
ADD COLUMN IF NOT EXISTS last_progress_update TIMESTAMP;

-- Index for faster progress queries
CREATE INDEX IF NOT EXISTS idx_ai_courses_progress ON ai_generated_courses(id, generation_status, percent_complete);

-- Add comments for documentation
COMMENT ON COLUMN ai_generated_courses.current_step IS 'Current step in the generation process (e.g., "Generating course outline...")';
COMMENT ON COLUMN ai_generated_courses.percent_complete IS 'Progress percentage (0-100)';
COMMENT ON COLUMN ai_generated_courses.last_progress_update IS 'Timestamp of last progress update';
```

6. Click **Run** or press `Ctrl+Enter`
7. You should see "Success. No rows returned"

## Option 2: Via Supabase CLI

If you have Supabase CLI set up locally:

```bash
npx supabase db push
```

## Verify Migration Applied

Run this query in SQL Editor to verify:

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'ai_generated_courses'
AND column_name IN ('current_step', 'percent_complete', 'last_progress_update');
```

You should see 3 rows returned.

## After Migration

1. Restart your development server: `npm run dev`
2. Generate a NEW test course at `/admin/courses/generate`
3. Watch the progress indicator - you should now see:
   - "Generating course outline... 20%"
   - "Updating course details and fetching course thumbnail... 25%"
   - "Generating lesson content... 30-70%"
   - "Fetching images and integrating into lessons... 75%"
   - "Saving to database... 85%"
   - "Finalizing... 95%"
   - "Complete! 100%"

## What's New

### UI Improvements ✨
- **Reduced font sizes** - Course title (3xl instead of 5xl) and description
- **Improved "What You'll Learn"** - 2-column grid layout with hover effects
- **Better hover states** - Coursera-style smooth transitions on all interactive elements
- **Course thumbnails** - Auto-generated during course creation
- **Professional spacing** - Better visual hierarchy throughout

### Content Generation 📝
- **Minimum 500 words** per lesson with rich formatting
- **4-5 strategically placed images** per lesson
- **IMAGE_MARKER system** for proper image placement
- **Comprehensive structure**: Introduction, Main Content, Examples, Summary, Key Takeaways

### Progress Tracking 📊
- **Real-time updates** - Progress now persists to database
- **Detailed steps** - See exactly what's happening during generation
- **No more "initialization → completed"** - Professional progress display

## Troubleshooting

**Progress still shows "initialization → completed"?**
- Verify migration was applied (see "Verify Migration Applied" above)
- Check browser console for errors
- Check server logs for database errors

**Images not showing in lessons?**
- Generate a NEW course (old courses were generated with old code)
- Click into an actual LESSON (not just course overview)
- Images are embedded in lesson.content_html

**Course has no thumbnail?**
- This only applies to NEW courses generated after this update
- Old courses won't have thumbnails unless manually added
