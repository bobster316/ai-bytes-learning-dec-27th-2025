# Technical Specification: AI Course Generator
## AI Bytes Learning Platform

**Version**: 1.0
**Date**: 2025-11-11
**Status**: Draft - Pending Approval

---

## 📋 Table of Contents

1. [Executive Summary](#executive-summary)
2. [System Architecture](#system-architecture)
3. [Database Schema](#database-schema)
4. [API Design](#api-design)
5. [AI Integration](#ai-integration)
6. [Course Generation Pipeline](#course-generation-pipeline)
7. [Tech Stack](#tech-stack)
8. [Cost Analysis](#cost-analysis)
9. [Implementation Timeline](#implementation-timeline)
10. [Security & Privacy](#security--privacy)
11. [Testing Strategy](#testing-strategy)
12. [Future Enhancements](#future-enhancements)

---

## 1. Executive Summary

### Vision
Build an AI-powered course generation system that automatically creates complete 1-hour AI courses with minimal human input. The system will generate course outlines, lesson content, quizzes, images, audio narration, and (future) video avatars.

### Key Objectives
- **Automation**: 95%+ hands-off course generation
- **Quality**: Professional-grade educational content
- **Speed**: Generate complete course in under 10 minutes
- **Cost**: Under $1 per course generated (excluding fixed monthly costs)
- **Scalability**: Support generating 100+ courses/month

### MVP Scope (Phase 1)
- ✅ Automated course outline generation
- ✅ Lesson content creation with AI
- ✅ Quiz generation with explanations
- ✅ Image integration (stock photos)
- ✅ Audio narration (ElevenLabs)
- ✅ Key takeaways extraction
- ❌ Video avatars (Phase 2)
- ❌ Course condensation from existing platforms (Phase 3)

---

## 2. System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Admin Dashboard                         │
│              (Next.js Admin Panel - /admin)                  │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│                  Course Generator API                        │
│              (Next.js API Routes - /api/course)              │
└──────────────────┬──────────────────────────────────────────┘
                   │
        ┌──────────┴──────────┬──────────────┬────────────────┐
        │                     │              │                │
        ▼                     ▼              ▼                ▼
┌───────────────┐    ┌──────────────┐  ┌─────────┐   ┌──────────────┐
│   Groq API    │    │  ElevenLabs  │  │Unsplash │   │   Supabase   │
│ (Content Gen) │    │    (Audio)   │  │ (Images)│   │  (Database)  │
└───────────────┘    └──────────────┘  └─────────┘   └──────────────┘
```

### Component Breakdown

#### 2.1 Admin Dashboard (`/app/admin/courses/generate`)
- **Purpose**: UI for admins to trigger course generation
- **Features**:
  - Course name input
  - Level selection (Beginner/Intermediate/Advanced)
  - Duration selector (30min, 45min, 60min)
  - Target audience input
  - Topic selection (ML, NLP, Computer Vision, etc.)
  - Real-time generation progress tracking
  - Course preview before publishing

#### 2.2 Course Generator API (`/app/api/course/generate`)
- **Purpose**: Backend service orchestrating AI course generation
- **Responsibilities**:
  - Input validation
  - AI prompt engineering
  - API calls to Groq, ElevenLabs, Unsplash
  - Database operations
  - Error handling and retry logic
  - Generation progress updates

#### 2.3 AI Services Integration Layer
- **Groq**: Course structure + content generation
- **ElevenLabs**: Text-to-speech audio narration
- **Unsplash**: Royalty-free educational images
- **Supabase Storage**: Asset storage (audio files, images)

---

## 3. Database Schema

### 3.1 Existing Tables (Assumed)
```sql
-- Users table (already exists from Supabase Auth)
users (
  id UUID PRIMARY KEY,
  email TEXT,
  created_at TIMESTAMP,
  ...
)

-- Courses table (existing)
courses (
  id UUID PRIMARY KEY,
  title TEXT,
  description TEXT,
  thumbnail_url TEXT,
  price DECIMAL,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  ...
)
```

### 3.2 New Tables for AI Course Generator

```sql
-- ========================================
-- AI Generated Courses Extension
-- ========================================

-- Tracks AI generation metadata
CREATE TABLE ai_generated_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,

  -- Input parameters
  original_prompt TEXT NOT NULL,
  difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  target_duration_minutes INT DEFAULT 60,
  target_audience TEXT,

  -- AI generation metadata
  groq_model TEXT DEFAULT 'llama-3.1-70b-versatile',
  generation_started_at TIMESTAMP,
  generation_completed_at TIMESTAMP,
  generation_status TEXT CHECK (generation_status IN ('pending', 'generating', 'completed', 'failed')) DEFAULT 'pending',
  error_message TEXT,

  -- Cost tracking
  groq_tokens_used INT,
  elevenlabs_characters_used INT,
  estimated_cost_usd DECIMAL(10,4),

  -- Quality metrics
  content_quality_score DECIMAL(3,2), -- 0.00 to 1.00
  human_reviewed BOOLEAN DEFAULT FALSE,
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Course topics (modules/chapters)
CREATE TABLE course_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,

  title TEXT NOT NULL,
  description TEXT,
  order_index INT NOT NULL,
  estimated_duration_minutes INT DEFAULT 10,

  -- AI generated content
  learning_objectives TEXT[], -- Array of learning objectives
  prerequisites TEXT[],

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(course_id, order_index)
);

-- Individual lessons within topics
CREATE TABLE course_lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID REFERENCES course_topics(id) ON DELETE CASCADE,

  title TEXT NOT NULL,
  order_index INT NOT NULL,
  estimated_duration_minutes INT DEFAULT 5,

  -- Content
  content_markdown TEXT NOT NULL, -- Main lesson content in Markdown
  content_html TEXT, -- Rendered HTML (cached)
  key_takeaways TEXT[], -- Array of key points

  -- Media
  thumbnail_url TEXT,
  audio_url TEXT, -- ElevenLabs generated audio
  video_url TEXT, -- For Phase 2: AI avatar video

  -- AI metadata
  generated_with_ai BOOLEAN DEFAULT TRUE,
  ai_confidence_score DECIMAL(3,2), -- 0.00 to 1.00

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(topic_id, order_index)
);

-- Lesson images
CREATE TABLE lesson_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID REFERENCES course_lessons(id) ON DELETE CASCADE,

  image_url TEXT NOT NULL,
  alt_text TEXT,
  caption TEXT,
  order_index INT,
  source TEXT DEFAULT 'unsplash', -- 'unsplash', 'pexels', 'dalle', etc.
  source_attribution TEXT,

  created_at TIMESTAMP DEFAULT NOW()
);

-- Quizzes per topic
CREATE TABLE course_quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID REFERENCES course_topics(id) ON DELETE CASCADE,

  title TEXT NOT NULL,
  description TEXT,
  passing_score_percentage INT DEFAULT 70,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Quiz questions
CREATE TABLE quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID REFERENCES course_quizzes(id) ON DELETE CASCADE,

  question_text TEXT NOT NULL,
  question_type TEXT CHECK (question_type IN ('multiple_choice', 'true_false', 'fill_blank')) DEFAULT 'multiple_choice',
  order_index INT NOT NULL,
  points INT DEFAULT 1,

  -- For multiple choice
  options JSONB, -- [{text: "Option A", is_correct: true}, ...]
  correct_answer TEXT, -- For non-multiple choice
  explanation TEXT, -- Why this is the correct answer

  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(quiz_id, order_index)
);

-- User quiz attempts (optional - for tracking student progress)
CREATE TABLE user_quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  quiz_id UUID REFERENCES course_quizzes(id) ON DELETE CASCADE,

  score_percentage DECIMAL(5,2),
  passed BOOLEAN,
  answers_json JSONB, -- Student's answers

  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_ai_courses_status ON ai_generated_courses(generation_status);
CREATE INDEX idx_topics_course ON course_topics(course_id, order_index);
CREATE INDEX idx_lessons_topic ON course_lessons(topic_id, order_index);
CREATE INDEX idx_quiz_attempts_user ON user_quiz_attempts(user_id, created_at DESC);
```

### 3.3 Row Level Security (RLS) Policies

```sql
-- Only admins can generate courses
ALTER TABLE ai_generated_courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can insert AI courses" ON ai_generated_courses
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  ));

-- Everyone can view published courses
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view published courses" ON courses
  FOR SELECT USING (published = TRUE);

-- Students can view their quiz attempts
ALTER TABLE user_quiz_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own quiz attempts" ON user_quiz_attempts
  FOR SELECT USING (auth.uid() = user_id);
```

---

## 4. API Design

### 4.1 Course Generation API

#### **POST /api/course/generate**
Initiate AI course generation.

**Request Body:**
```typescript
{
  courseName: string;           // "Introduction to Machine Learning"
  difficultyLevel: "beginner" | "intermediate" | "advanced";
  targetDuration: 30 | 45 | 60; // minutes
  targetAudience?: string;      // "Software engineers", "Students", etc.
  topics?: string[];            // Optional: specific topics to cover
  generateAudio: boolean;       // Whether to generate ElevenLabs audio
  generateImages: boolean;      // Whether to fetch Unsplash images
}
```

**Response:**
```typescript
{
  success: boolean;
  courseId: string;
  generationId: string;
  message: string;
  estimatedTimeSeconds: number;
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/course/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin_token>" \
  -d '{
    "courseName": "Introduction to Neural Networks",
    "difficultyLevel": "beginner",
    "targetDuration": 60,
    "generateAudio": true,
    "generateImages": true
  }'
```

#### **GET /api/course/generate/:generationId**
Check generation status and progress.

**Response:**
```typescript
{
  generationId: string;
  status: "pending" | "generating" | "completed" | "failed";
  progress: {
    currentStep: string;       // "Generating course outline"
    stepsCompleted: number;    // 3
    totalSteps: number;        // 10
    percentComplete: number;   // 30
  };
  courseId?: string;           // Available when completed
  error?: string;              // Error message if failed
}
```

### 4.2 Supporting APIs

#### **GET /api/course/:courseId**
Fetch complete course data with topics, lessons, quizzes.

#### **POST /api/course/:courseId/publish**
Publish AI-generated course for students.

#### **GET /api/admin/analytics/generation**
Analytics on course generation (costs, success rate, avg time).

---

## 5. AI Integration

### 5.1 Groq API (Content Generation)

**API Endpoint**: `https://api.groq.com/openai/v1/chat/completions`

**Model**: `llama-3.1-70b-versatile` (FREE tier: 30 requests/min, 14,400/day)

**Use Cases**:
1. Course outline generation
2. Lesson content writing
3. Quiz question generation
4. Key takeaways extraction

**Example Prompt Template (Course Outline):**
```
You are an expert AI educator creating a comprehensive {duration}-minute course on "{courseName}" for {difficultyLevel} learners.

Target Audience: {targetAudience}

Generate a complete course outline with:
1. Course Overview (2-3 sentences)
2. Learning Objectives (4-6 bullet points)
3. 4-6 Topics, each with:
   - Topic title
   - Topic description
   - 3-5 Lessons per topic (with titles and brief descriptions)
   - Estimated duration per lesson
4. For EACH topic, create:
   - 5 multiple-choice quiz questions
   - Key takeaways (3-5 bullet points)

Format your response as JSON:
{
  "courseOverview": "...",
  "learningObjectives": ["...", "..."],
  "topics": [
    {
      "title": "...",
      "description": "...",
      "lessons": [...],
      "quiz": [...],
      "keyTakeaways": [...]
    }
  ]
}

Ensure content is:
- Jargon-free and accessible
- Practical with real-world examples
- Engaging and concise
- Structured for exactly {duration} minutes of learning time
```

### 5.2 ElevenLabs API (Audio Narration)

**API Endpoint**: `https://api.elevenlabs.io/v1/text-to-speech/{voice_id}`

**Pricing**:
- Starter: $5/month (30,000 characters)
- Creator: $11/month (100,000 characters)

**Voice Selection**:
- Default: "Josh" (Professional male voice)
- Alternative: "Rachel" (Professional female voice)

**Usage**:
- Generate audio for each lesson (narrating the markdown content)
- Store in Supabase Storage at `/audio/lessons/{lesson_id}.mp3`

**Cost Estimate**:
- Average lesson: ~2000 characters
- 5 lessons/course × 2000 chars = 10,000 chars/course
- $5/month ÷ 30,000 chars = $0.00017/char
- **Cost per course: ~$1.70** (if using all audio features)

### 5.3 Unsplash API (Images)

**API Endpoint**: `https://api.unsplash.com/search/photos`

**Pricing**: FREE (50 requests/hour)

**Usage**:
- Search for relevant educational images based on lesson keywords
- 2-3 images per lesson
- Store URLs in database (no need to download, Unsplash CDN is free)

**Attribution**: Required by Unsplash ToS (automatically added to `lesson_images.source_attribution`)

---

## 6. Course Generation Pipeline

### 6.1 Generation Flow Diagram

```
User Input (Admin)
    ↓
┌─────────────────────────────────────────┐
│  Step 1: Validate Input & Create Record │  (5 sec)
└──────────────────┬──────────────────────┘
                   ↓
┌─────────────────────────────────────────┐
│  Step 2: Generate Course Outline (Groq) │  (15-30 sec)
│  - Course overview                       │
│  - Topics structure                      │
│  - Lesson titles                         │
└──────────────────┬──────────────────────┘
                   ↓
┌─────────────────────────────────────────┐
│  Step 3: Generate Lesson Content (Groq) │  (60-120 sec)
│  - For each lesson:                      │
│    - Detailed markdown content           │
│    - Code examples (if applicable)       │
│    - Key takeaways                       │
└──────────────────┬──────────────────────┘
                   ↓
┌─────────────────────────────────────────┐
│  Step 4: Generate Quizzes (Groq)        │  (20-30 sec)
│  - 5 questions per topic                 │
│  - Multiple choice options               │
│  - Correct answers + explanations        │
└──────────────────┬──────────────────────┘
                   ↓
┌─────────────────────────────────────────┐
│  Step 5: Fetch Images (Unsplash)        │  (10-20 sec)
│  - Search for relevant images            │
│  - 2-3 images per lesson                 │
│  - Store URLs + attribution              │
└──────────────────┬──────────────────────┘
                   ↓
┌─────────────────────────────────────────┐
│  Step 6: Generate Audio (ElevenLabs)    │  (60-120 sec)
│  - Convert lesson markdown to speech     │
│  - Upload to Supabase Storage            │
│  - Link audio URLs to lessons            │
└──────────────────┬──────────────────────┘
                   ↓
┌─────────────────────────────────────────┐
│  Step 7: Finalize & Store in Database   │  (5-10 sec)
│  - Save all data to Supabase             │
│  - Mark generation as complete           │
│  - Calculate costs                       │
└──────────────────┬──────────────────────┘
                   ↓
       Course Ready for Review!
```

**Total Estimated Time**: 3-5 minutes per course

### 6.2 Implementation Pseudo-code

```typescript
// /app/api/course/generate/route.ts

export async function POST(request: Request) {
  // 1. Parse and validate input
  const input = await request.json();
  const { courseName, difficultyLevel, targetDuration } = input;

  // 2. Create generation record
  const generation = await createGenerationRecord(input);

  // 3. Background job: Start generation (use Vercel's queue or simple async)
  generateCourseAsync(generation.id, input).catch(handleError);

  // 4. Return immediately with generation ID
  return Response.json({
    success: true,
    generationId: generation.id,
    message: "Course generation started"
  });
}

async function generateCourseAsync(generationId, input) {
  try {
    updateProgress(generationId, "Generating course outline...", 10);

    // Step 1: Generate course outline
    const outline = await groqAPI.generateOutline(input);

    updateProgress(generationId, "Creating course structure...", 20);
    const course = await createCourseInDB(outline);

    updateProgress(generationId, "Generating lesson content...", 30);

    // Step 2: Generate lesson content (parallel for speed)
    const lessons = await Promise.all(
      outline.topics.flatMap(topic =>
        topic.lessons.map(lesson =>
          groqAPI.generateLessonContent(lesson, input.difficultyLevel)
        )
      )
    );

    updateProgress(generationId, "Generating quizzes...", 60);

    // Step 3: Generate quizzes
    const quizzes = await Promise.all(
      outline.topics.map(topic =>
        groqAPI.generateQuiz(topic, input.difficultyLevel)
      )
    );

    updateProgress(generationId, "Fetching images...", 70);

    // Step 4: Fetch images from Unsplash
    const images = await Promise.all(
      lessons.map(lesson =>
        unsplashAPI.searchImages(lesson.keywords, 2)
      )
    );

    updateProgress(generationId, "Generating audio narration...", 80);

    // Step 5: Generate audio (ElevenLabs)
    if (input.generateAudio) {
      const audioFiles = await Promise.all(
        lessons.map(lesson =>
          elevenLabsAPI.textToSpeech(lesson.content)
        )
      );

      // Upload to Supabase Storage
      await uploadAudioFiles(audioFiles);
    }

    updateProgress(generationId, "Finalizing course...", 95);

    // Step 6: Save everything to database
    await saveCourseToDatabase({
      course,
      topics: outline.topics,
      lessons,
      quizzes,
      images
    });

    updateProgress(generationId, "Complete!", 100);

    // Mark generation as complete
    await markGenerationComplete(generationId, course.id);

  } catch (error) {
    await markGenerationFailed(generationId, error.message);
    throw error;
  }
}
```

---

## 7. Tech Stack

### 7.1 Frontend
| Technology | Purpose | Version |
|------------|---------|---------|
| Next.js | Framework | 16.0.1 |
| React | UI Library | 19.2.0 |
| TypeScript | Language | 5.x |
| Tailwind CSS | Styling | 4.x |
| Shadcn/UI | Component Library | Latest |
| Zustand | State Management | 5.0.8 |
| React Hook Form | Form Handling | 7.66.0 |

### 7.2 Backend
| Technology | Purpose | Cost |
|------------|---------|------|
| Next.js API Routes | API Layer | FREE (Vercel) |
| Supabase | Database + Auth + Storage | FREE tier (up to 500MB DB) |
| Groq API | AI Content Generation | FREE tier |
| ElevenLabs | Text-to-Speech | $5-11/month |
| Unsplash API | Stock Images | FREE |

### 7.3 DevOps & Deployment
| Technology | Purpose |
|------------|---------|
| Vercel | Hosting (Next.js) |
| GitHub Actions | CI/CD |
| Supabase CLI | Database Migrations |
| ESLint | Code Quality |

---

## 8. Cost Analysis

### 8.1 Monthly Fixed Costs

| Service | Plan | Cost | Usage |
|---------|------|------|-------|
| **Groq API** | Free Tier | $0/month | Up to 14,400 requests/day |
| **ElevenLabs** | Starter | $5/month | 30,000 characters |
| **Unsplash** | Free | $0/month | 50 requests/hour |
| **Supabase** | Free Tier | $0/month | 500MB database, 1GB storage |
| **Vercel** | Hobby | $0/month | Unlimited bandwidth |
| **TOTAL** | | **$5/month** | |

### 8.2 Variable Costs (Per Course Generated)

| Item | Usage | Cost | Notes |
|------|-------|------|-------|
| Groq API Calls | ~5-10 calls | $0 | FREE tier |
| ElevenLabs Audio | ~10,000 chars | ~$1.70 | Based on $5/30k chars |
| Unsplash Images | ~10-15 images | $0 | FREE |
| Storage (Audio) | ~5MB | $0 | Within free tier |
| **TOTAL per course** | | **~$1.70** | |

### 8.3 Cost at Scale

| Courses/Month | Groq Cost | ElevenLabs | Storage | **Total** |
|---------------|-----------|------------|---------|-----------|
| 1 course | $0 | $5 | $0 | **$5** |
| 10 courses | $0 | $5 | $0 | **$5** |
| 20 courses | $0 | $11 | $0 | **$11** |
| 50 courses | $0 | $22 | $0 | **$22** |
| 100 courses | $0 | $44 | $5 | **$49** |

**Key Insight**: Under FREE tier limits (14,400 Groq requests/day), you can generate ~100 courses/month for under $50!

---

## 9. Implementation Timeline

### Phase 1: MVP Course Generator (3-4 Weeks)

#### Week 1: Database & API Foundation
**Days 1-2: Database Setup**
- [ ] Create new Supabase tables (schema above)
- [ ] Set up RLS policies
- [ ] Create TypeScript types from database schema
- [ ] Test database with sample data

**Days 3-4: API Structure**
- [ ] Build `/api/course/generate` endpoint
- [ ] Implement input validation (Zod schemas)
- [ ] Create generation status tracking
- [ ] Set up error handling middleware

**Day 5: Groq Integration**
- [ ] Set up Groq API client
- [ ] Create prompt templates
- [ ] Test course outline generation
- [ ] Implement retry logic

#### Week 2: Content Generation Pipeline
**Days 6-7: Course Outline Generator**
- [ ] Implement course outline generation with Groq
- [ ] Parse and validate AI responses
- [ ] Store outline in database (courses, topics tables)
- [ ] Build progress tracking system

**Days 8-9: Lesson Content Generator**
- [ ] Generate lesson markdown content
- [ ] Implement parallel lesson generation (speed optimization)
- [ ] Convert markdown to HTML (remark/remark-html)
- [ ] Extract key takeaways

**Day 10: Quiz Generator**
- [ ] Generate quiz questions with Groq
- [ ] Validate multiple-choice format
- [ ] Store quizzes in database

#### Week 3: Media Integration
**Days 11-12: Image Integration (Unsplash)**
- [ ] Set up Unsplash API client
- [ ] Implement keyword-based image search
- [ ] Store image URLs + attribution
- [ ] Add images to lessons (2-3 per lesson)

**Days 13-15: Audio Narration (ElevenLabs)**
- [ ] Set up ElevenLabs API client
- [ ] Convert lesson markdown to plain text for TTS
- [ ] Generate audio files
- [ ] Upload to Supabase Storage
- [ ] Link audio URLs to lessons

#### Week 4: Admin UI & Testing
**Days 16-17: Admin Dashboard**
- [ ] Build course generation form (`/app/admin/courses/generate`)
- [ ] Add real-time progress indicator
- [ ] Create course preview page
- [ ] Add publish/unpublish functionality

**Days 18-19: Testing & Refinement**
- [ ] Generate 3-5 test courses
- [ ] Refine AI prompts for better output
- [ ] Fix bugs and edge cases
- [ ] Optimize generation speed

**Day 20: Documentation & Launch**
- [ ] Write admin user guide
- [ ] Document API endpoints
- [ ] Create demo video
- [ ] **Launch MVP!**

### Phase 2: AI Avatar Videos (2-3 Weeks)
*Pending Phase 1 completion*
- Week 5: RunPod + SadTalker setup
- Week 6: Video generation pipeline
- Week 7: Testing and optimization

### Phase 3: Advanced Features (Ongoing)
- Course recommendation engine
- Analytics dashboard
- A/B testing for AI prompts
- Multi-language support
- Custom branding per course

---

## 10. Security & Privacy

### 10.1 Authentication & Authorization
- **Admin Access**: Only users with `role='admin'` can generate courses
- **API Security**: All `/api/course/generate` endpoints require valid JWT
- **Rate Limiting**: Max 10 course generations per hour per admin

### 10.2 Data Security
- **API Keys**: Store in environment variables (`.env.local`)
- **Supabase RLS**: Row-level security on all tables
- **Audit Logs**: Track all course generation attempts in `ai_generated_courses` table

### 10.3 Content Safety
- **AI Output Validation**: Check for inappropriate content before saving
- **Human Review**: Flag for review if AI confidence score < 0.75
- **Fallback Mechanism**: Manual content editing if AI generation fails

---

## 11. Testing Strategy

### 11.1 Unit Tests
- API route handlers (`/api/course/generate`)
- AI prompt generation functions
- Database operations (CRUD)
- Utility functions (markdown parsing, etc.)

### 11.2 Integration Tests
- End-to-end course generation flow
- Groq API integration (with mocks)
- ElevenLabs API integration (with mocks)
- Supabase database operations

### 11.3 Manual QA Checklist
- [ ] Generate beginner-level course - validate quality
- [ ] Generate intermediate-level course - validate quality
- [ ] Generate advanced-level course - validate quality
- [ ] Test with various course names (ML, NLP, CV)
- [ ] Verify audio playback works
- [ ] Check image attribution displayed correctly
- [ ] Test quiz functionality
- [ ] Verify progress tracking UI updates

---

## 12. Future Enhancements

### Phase 2 Features
- ✅ **AI Avatar Videos** (SadTalker + RunPod)
- ✅ **Video Narration** for each lesson (2-5 min videos)
- ✅ **Custom Avatar** (branded to AI Bytes Learning)

### Phase 3 Features
- ✅ **Course Condensation** (Analyze top courses, create condensed versions)
- ✅ **Multi-Language Support** (Translate courses with AI)
- ✅ **Interactive Code Playgrounds** (Embed CodeSandbox/Replit)
- ✅ **Student Progress Tracking** (Advanced analytics)

### Advanced AI Features
- ✅ **Personalized Learning Paths** (AI recommends next courses)
- ✅ **Adaptive Quizzes** (Difficulty adjusts based on student performance)
- ✅ **AI Tutor Chatbot** (Answer student questions in real-time)
- ✅ **Automatic Course Updates** (AI refreshes outdated content)

---

## 13. Success Metrics

### MVP Launch Criteria
- [ ] Generate complete 1-hour course in under 5 minutes
- [ ] 90%+ success rate (no errors/failures)
- [ ] AI content quality score ≥ 0.80 (human review)
- [ ] Audio narration ≥ 95% accurate pronunciation
- [ ] Total cost per course ≤ $2.00

### Business Metrics (Post-Launch)
- **Target**: Generate 50 courses in first month
- **Cost Goal**: Under $100/month operational costs
- **Quality Goal**: 85%+ student satisfaction rating
- **Efficiency Goal**: 2 hours admin time per week (not per course!)

---

## 14. Risks & Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| **Groq API rate limits** | High | Medium | Cache responses, implement queuing |
| **AI generates poor quality content** | High | Medium | Human review process, refine prompts |
| **ElevenLabs audio sounds robotic** | Medium | Low | Test multiple voices, adjust settings |
| **Unsplash images not relevant** | Low | Medium | Manual image selection fallback |
| **Generation takes too long (>10 min)** | Medium | Medium | Parallel processing, optimize prompts |
| **Database storage costs exceed budget** | Low | Low | Use Supabase free tier, optimize storage |

---

## 15. Questions for Approval

Before proceeding with implementation, please confirm:

### Technical Decisions
1. **Groq Model**: Use `llama-3.1-70b-versatile` (free)? Or upgrade to paid if needed?
2. **Audio Generation**: Generate audio for ALL lessons, or only intro/summary?
3. **Image Strategy**: Use Unsplash exclusively, or mix with Pexels/Pixabay?
4. **Video Avatars**: Skip for MVP (Phase 1), add in Phase 2? ✅ Recommended

### Business Decisions
5. **Course Pricing**: Will AI-generated courses be priced lower than human-created ones?
6. **Quality Control**: Should ALL AI courses require human review before publishing?
7. **Branding**: Should AI-generated courses be labeled as "AI-Generated"?

### Scope Clarifications
8. **Course Duration**: Firm 60 minutes, or flexible (30/45/60 min options)?
9. **Course Topics**: Focus on AI-related courses only, or expand to other tech topics?
10. **Target Audience**: Professionals only, or include students/hobbyists?

---

## 16. Next Steps

### Upon Approval:
1. ✅ **Approve this spec** (or request changes)
2. 🚀 **Begin Week 1 implementation** (Database + API setup)
3. 🔑 **Provide API keys**:
   - Groq API key
   - ElevenLabs API key
   - Unsplash API key (if not already set up)
4. 📝 **Clarify open questions** (Section 15 above)

### Estimated Timeline:
- **Spec Approval**: Today (Nov 11)
- **Development Start**: Nov 12
- **MVP Launch**: Dec 6-10 (4 weeks)

---

**Document Status**: ✅ Ready for Review
**Prepared By**: Claude (AI Assistant)
**Reviewed By**: [Your Name]
**Approved**: ⏳ Pending

---

## Appendix A: Example Course Structure

```json
{
  "courseName": "Introduction to Neural Networks",
  "difficultyLevel": "beginner",
  "duration": 60,
  "topics": [
    {
      "title": "What are Neural Networks?",
      "duration": 10,
      "lessons": [
        {
          "title": "Brain-Inspired Computing",
          "duration": 3,
          "content": "Markdown content here...",
          "keyTakeaways": [
            "Neural networks are inspired by the human brain",
            "They consist of interconnected nodes (neurons)",
            "Used for pattern recognition and prediction"
          ],
          "images": [
            {
              "url": "https://images.unsplash.com/...",
              "alt": "Neural network visualization",
              "attribution": "Photo by John Doe on Unsplash"
            }
          ],
          "audioUrl": "/audio/lessons/uuid.mp3"
        }
      ],
      "quiz": {
        "questions": [
          {
            "question": "What are neural networks inspired by?",
            "options": [
              { "text": "The human brain", "isCorrect": true },
              { "text": "Computer processors", "isCorrect": false },
              { "text": "The internet", "isCorrect": false },
              { "text": "Quantum physics", "isCorrect": false }
            ],
            "explanation": "Neural networks are modeled after the structure and function of biological neural networks in the brain."
          }
        ]
      }
    }
  ]
}
```

---

**End of Technical Specification**
