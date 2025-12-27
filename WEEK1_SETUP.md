# Week 1: Database & API Foundation - Setup Guide

**Status**: ✅ Foundation Complete
**Date**: November 11, 2025
**Phase**: MVP Course Generator - Week 1 of 4

---

## 📋 What Was Built

### 1. Database Schema ✅
- **File**: `supabase/migrations/20251111_ai_course_generator.sql`
- **Tables Created**:
  - `ai_generated_courses` - Tracks AI generation metadata
  - `course_topics` - Course modules/chapters
  - `course_lessons` - Individual lessons within topics
  - `lesson_images` - Images for lessons (Unsplash)
  - `course_quizzes` - Quizzes per topic
  - `quiz_questions` - Multiple choice questions
  - `user_quiz_attempts` - Student progress tracking

### 2. TypeScript Types ✅
- **File**: `lib/types/course-generator.ts`
- Complete type definitions for all database tables
- API request/response types
- AI generation types

### 3. Validation Schemas ✅
- **File**: `lib/validations/course-generator.ts`
- Zod schemas for input validation
- API request validation
- AI response validation

### 4. API Endpoints ✅
- **File**: `app/api/course/generate/route.ts`
  - `POST /api/course/generate` - Start course generation
- **File**: `app/api/course/generate/[generationId]/route.ts`
  - `GET /api/course/generate/:id` - Check generation status

### 5. AI Integration ✅
- **File**: `lib/ai/groq.ts`
- Groq API client with retry logic
- Prompt templates for course outline generation
- Lesson content generation

### 6. Environment Configuration ✅
- **File**: `.env.example`
- Template for all required API keys

---

## 🚀 Setup Instructions

### Step 1: Install Dependencies

Ensure all npm packages are installed:
```bash
npm install
```

### Step 2: Set Up Environment Variables

1. Copy the example environment file:
```bash
cp .env.example .env.local
```

2. Fill in your API keys in `.env.local`:

#### Required for Week 1:
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `GROQ_API_KEY` - Get free at https://console.groq.com

#### Required for Week 3 (Images & Audio):
- `ELEVENLABS_API_KEY` - Get at https://elevenlabs.io ($5/month)
- `UNSPLASH_ACCESS_KEY` - Get at https://unsplash.com/developers (free)

### Step 3: Run Database Migration

Apply the database schema to your Supabase instance:

#### Option A: Using Supabase Dashboard
1. Go to your Supabase dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of `supabase/migrations/20251111_ai_course_generator.sql`
4. Paste and execute

#### Option B: Using Supabase CLI (if installed)
```bash
supabase db push
```

### Step 4: Verify Database Setup

Check that all tables were created:
1. Go to Supabase Dashboard → Table Editor
2. You should see these new tables:
   - `ai_generated_courses`
   - `course_topics`
   - `course_lessons`
   - `lesson_images`
   - `course_quizzes`
   - `quiz_questions`
   - `user_quiz_attempts`

### Step 5: Start Development Server

```bash
npm run dev
```

The app should be running at http://localhost:3000

---

## 🧪 Testing the API

### Test 1: Course Generation Endpoint

Create a test file or use curl:

```bash
curl -X POST http://localhost:3000/api/course/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SUPABASE_JWT_TOKEN" \
  -d '{
    "courseName": "Introduction to Neural Networks",
    "difficultyLevel": "beginner",
    "targetDuration": 60,
    "generateAudio": false,
    "generateImages": false
  }'
```

**Expected Response** (202 Accepted):
```json
{
  "success": true,
  "courseId": "uuid-here",
  "generationId": "uuid-here",
  "message": "Course generation started successfully",
  "estimatedTimeSeconds": 180
}
```

### Test 2: Check Generation Status

```bash
curl http://localhost:3000/api/course/generate/{generationId}
```

**Expected Response** (200 OK):
```json
{
  "generationId": "uuid-here",
  "status": "generating",
  "progress": {
    "currentStep": "Generating course outline",
    "stepsCompleted": 2,
    "totalSteps": 7,
    "percentComplete": 28
  },
  "courseId": "uuid-here"
}
```

---

## 📝 Database Schema Overview

### Table: `ai_generated_courses`
Tracks AI generation metadata and progress.

**Key Fields**:
- `course_id` - Links to main courses table
- `generation_status` - pending, generating, completed, failed
- `groq_tokens_used` - Token usage tracking
- `estimated_cost_usd` - Cost per course

### Table: `course_topics`
Course modules/chapters (4-6 per course).

**Key Fields**:
- `course_id` - Parent course
- `order_index` - Display order
- `learning_objectives` - Array of learning goals

### Table: `course_lessons`
Individual lessons within topics (3-5 per topic).

**Key Fields**:
- `topic_id` - Parent topic
- `content_markdown` - Main lesson content
- `audio_url` - ElevenLabs generated audio (Week 3)
- `key_takeaways` - Array of key points

### Table: `course_quizzes`
One quiz per topic.

**Key Fields**:
- `topic_id` - Parent topic
- `passing_score_percentage` - Default 70%

### Table: `quiz_questions`
5 multiple-choice questions per quiz.

**Key Fields**:
- `question_text` - The question
- `options` - JSON array of choices
- `explanation` - Why the answer is correct

---

## 🔑 API Key Setup Guide

### 1. Groq API (FREE) ⭐ Required for Week 1

**Purpose**: AI content generation (course outlines, lessons, quizzes)

**Setup Steps**:
1. Go to https://console.groq.com
2. Sign up for free account
3. Navigate to **API Keys**
4. Click **Create API Key**
5. Copy key to `.env.local`:
   ```
   GROQ_API_KEY=gsk_...
   ```

**Free Tier Limits**:
- 30 requests per minute
- 14,400 requests per day
- More than enough for testing!

### 2. ElevenLabs (Paid - $5/month) ⏸️ Week 3

**Purpose**: Text-to-speech audio narration

**Setup Steps**:
1. Go to https://elevenlabs.io
2. Sign up and subscribe to Starter plan ($5/month)
3. Navigate to **Profile** → **API Keys**
4. Copy key to `.env.local`:
   ```
   ELEVENLABS_API_KEY=...
   ```

**Note**: Not needed until Week 3 (audio generation)

### 3. Unsplash API (FREE) ⏸️ Week 3

**Purpose**: Stock images for lessons

**Setup Steps**:
1. Go to https://unsplash.com/developers
2. Register as a developer (free)
3. Create a new application
4. Copy **Access Key** to `.env.local`:
   ```
   UNSPLASH_ACCESS_KEY=...
   ```

**Note**: Not needed until Week 3 (image integration)

---

## 🎯 What's Next: Week 2

### Week 2 Focus: Content Generation Pipeline

**Goals**:
1. Implement full course outline generation with Groq
2. Generate lesson content (markdown) for each lesson
3. Generate quiz questions for each topic
4. Store all data in database
5. Test end-to-end generation

**Files to Create**:
- `lib/ai/course-generator.ts` - Main orchestration logic
- `lib/database/course-operations.ts` - Database CRUD operations
- `app/admin/courses/generate/page.tsx` - Admin UI for generation

**Estimated Time**: 5-7 days

---

## 🐛 Troubleshooting

### Issue: "GROQ_API_KEY is not set"

**Solution**:
1. Make sure you created `.env.local` (not `.env.example`)
2. Restart your Next.js dev server after adding env vars
3. Verify key format: `GROQ_API_KEY=gsk_...`

### Issue: "courses table does not exist"

**Solution**:
The migration assumes a `courses` table already exists. If not, create it:
```sql
CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  price DECIMAL DEFAULT 0,
  published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Issue: "Admin access required"

**Solution**:
The API checks for `role='admin'` in user metadata. Add this to your user:
```sql
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}'::jsonb
WHERE email = 'your@email.com';
```

### Issue: API returns 500 error

**Solution**:
1. Check Next.js console for detailed error
2. Verify all environment variables are set
3. Check Supabase logs for database errors
4. Ensure Groq API key is valid

---

## 📊 Progress Checklist

Week 1 Foundation:
- [x] Database schema created
- [x] TypeScript types defined
- [x] Zod validation schemas
- [x] API endpoints structured
- [x] Groq client implemented
- [x] Environment config setup
- [ ] Database migration applied (manual step)
- [ ] API tested with real requests
- [ ] Groq integration tested

---

## 💡 Tips for Week 2

1. **Test Groq API First**:
   - Use `lib/ai/groq.ts` in isolation
   - Test prompt templates before integrating

2. **Start Small**:
   - Generate 1 topic with 2 lessons first
   - Scale up once working

3. **Monitor Costs**:
   - Track `groq_tokens_used` in database
   - Groq free tier is generous but monitor usage

4. **Prompt Engineering**:
   - Iterate on prompts in `groq.ts`
   - Test with various course names and difficulty levels

---

## 📚 Resources

- **Groq Documentation**: https://console.groq.com/docs
- **Supabase Docs**: https://supabase.com/docs
- **Zod Documentation**: https://zod.dev
- **Next.js API Routes**: https://nextjs.org/docs/app/building-your-application/routing/route-handlers

---

**Status**: Week 1 foundation is complete! Ready to move to Week 2 (Content Generation Pipeline).

**Questions?** Review the technical spec: `TECHNICAL_SPEC_AI_COURSE_GENERATOR.md`
