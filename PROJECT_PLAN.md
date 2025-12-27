# AI Bytes Learning Platform - Development Plan
**Date:** 22nd December 2025  
**Session:** Continuation from Previous Development  
**Status:** Analyzing & Planning

---

## 📊 PROJECT UNDERSTANDING

### Platform Overview
**AI Bytes Learning** is a sophisticated e-learning platform designed to democratize AI education through:
- **Core Mission:** Make AI accessible to non-coders via 15-minute "byte-sized" lessons
- **Key Innovation:** AI-powered course generation system (NeuralLoom/Planetary Curriculum Engine)
- **Learning Model:** 60-minute courses broken into digestible topics and lessons
- **Content Quality:** 500+ words per lesson with images, key takeaways, and quizzes

### Technology Stack
- **Frontend:** Next.js 16.0.1, React 19.2.0, TypeScript (strict mode)
- **Styling:** Tailwind CSS 4.x with custom "Dark Pro" theme
- **Database:** Supabase (PostgreSQL)
- **AI Services:** 
  - Groq API (FREE tier) - Content generation
  - Google Gemini - Alternative/backup content generation
  - ElevenLabs - Text-to-speech (optional)
  - Unsplash/Pexels - Image sourcing
  - Pollinations.ai - AI-generated images
- **Auth:** Supabase Auth
- **Payments:** Stripe (hybrid model: £39/course, £49/month, £99/month)
- **Analytics:** PostHog

### Design Philosophy
- **Theme:** "Dark Pro" / "Cosmic" / "Futuristic"
- **Visual:** Deep black (#000000), indigo/purple/cyan accents, glassmorphism
- **UX:** Professional, premium, state-of-the-art (NOT basic MVP)
- **Locale:** British English (en-GB), British Pound (£)

---

## 🔍 CURRENT STATE ANALYSIS

### ✅ What's Working
1. **Homepage** - Functional with Dark Pro theme, trending AI news section
2. **Course Generation System** - `/admin/courses/new` fully functional
   - Planetary Curriculum Engine UI implemented
   - Generates complete course structures with topics, lessons, quizzes
   - Integrates images from multiple sources
   - Saves to Supabase successfully
3. **Public Course View** - `/courses/[id]` displays generated content correctly
4. **Admin Course List** - `/admin/courses` shows all courses with management features
5. **Authentication Pages** - Sign in, sign up, password reset ready
6. **Database Schema** - Complete with all tables (courses, course_topics, course_lessons, lesson_images, etc.)
7. **Content Quality Standards** - 500+ word lessons, 200+ word topics, multiple images per lesson

### 🚧 Known Issues (Critical Priority)

#### **ISSUE #1: Admin Edit Route 404 (BLOCKING)**
- **File Exists:** `app/admin/courses/[id]/page.tsx` ✅
- **Problem:** Returns 404 when accessed via `/admin/courses/123`
- **Status:** CRITICAL BLOCKER
- **Hypotheses:**
  1. Middleware interference (no middleware.ts found - may not exist)
  2. Next.js config redirects/rewrites
  3. Async params type mismatch (uses `Promise<{ id: string }>` - correct for Next.js 15+)
  4. Route caching issue
  5. Windows filesystem edge case

**Evidence from Handover:**
- Static route `/admin/courses/test/page.tsx` WORKS
- Dynamic route `[id]` does NOT work
- Multiple server restarts and `.next` deletions attempted
- File content verified as clean TSX

#### **ISSUE #2: Potential Browser Caching Issues**
- Multiple handover documents mention hard refresh requirements
- Users experiencing cached JavaScript (old app.js vs app-v2.js vs app-v3.js)
- Suggests frontend build/deployment process needs review

### 📁 Project Structure
```
L:\ai-bytes-learning 22nd dec 25\
├── app/
│   ├── admin/
│   │   ├── courses/
│   │   │   ├── [id]/page.tsx        ← 404 ISSUE
│   │   │   ├── new/page.tsx         ← Working
│   │   │   └── page.tsx             ← Working
│   │   └── page.tsx
│   ├── courses/[id]/
│   │   ├── page.tsx                 ← Working (Public view)
│   │   ├── course-detail-client.tsx
│   │   └── lessons/[lessonId]/page.tsx
│   ├── auth/ (signin, signup, reset-password)
│   ├── pricing/, dashboard/, quiz/, certificate/, etc.
│   └── page.tsx (Homepage)
├── components/
│   ├── header.tsx
│   └── ui/ (button, card, badge, input, etc.)
├── lib/
│   ├── ai/
│   │   ├── groq.ts                  ← Content generation
│   │   ├── course-generator.ts      ← Main pipeline
│   │   └── image-service.ts         ← Image fetching
│   ├── database/course-operations.ts
│   └── supabase/
├── Documentation (multiple handover files)
└── next.config.ts
```

---

## 🎯 DEVELOPMENT PLAN

### Phase 1: Critical Bug Resolution (Priority: URGENT)
**Objective:** Unblock admin course editing

#### Task 1.1: Investigate Admin Route 404
**Steps:**
1. ✅ Review handover documentation (COMPLETED)
2. Check if `middleware.ts` exists and review its rules
3. Review `next.config.ts` for rewrites/redirects
4. Verify Next.js version in package.json (16.0.1 confirmed - async params correct)
5. Test the route directly in browser: `http://localhost:3000/admin/courses/[actual-course-id]`
6. Check browser DevTools Network tab for actual response
7. Review `.next/server/pages-manifest.json` (if exists) to verify route registration

**Potential Fixes:**
- Add middleware exception for `/admin/courses/[id]` if middleware exists
- Remove conflicting redirects in next.config.ts
- Try renaming `[id]` folder to `[courseId]` or `edit-[id]`
- Clear `.next` and `node_modules/.cache`
- Restart dev server with `npm run dev -- --turbo`

**Success Criteria:** Course editor page loads when clicking "Edit" from course list

#### Task 1.2: Verify and Test Admin Editor Functionality
**Once Route Works:**
1. Test all CRUD operations (Read, Update, Delete)
2. Verify save functionality (currently placeholder)
3. Test preview link to public course page
4. Ensure all input fields properly update course data

---

### Phase 2: Quality Assurance & User Experience (Priority: HIGH)

#### Task 2.1: Audit Course Generation Pipeline
**Objectives:**
- Ensure consistent 500+ word lesson content
- Verify 2+ images per lesson
- Check quiz generation quality
- Test end-to-end generation flow

**Actions:**
1. Generate 2-3 test courses with different difficulty levels
2. Verify content quality meets standards
3. Check database entries for completeness
4. Validate image URLs and attributions
5. Test quiz questions and answers

#### Task 2.2: Frontend Performance & Caching
**Objectives:**
- Eliminate browser caching issues
- Ensure consistent asset delivery

**Actions:**
1. Review build configuration for cache busting
2. Add proper cache headers to next.config.ts
3. Implement versioned asset URLs if needed
4. Test in incognito/private browsing mode
5. Document hard refresh requirement for development

#### Task 2.3: UI/UX Polish
**Objectives:**
- Ensure consistent "Dark Pro" theme across all pages
- Verify responsive design on mobile/tablet
- Test all interactive elements

**Focus Areas:**
- Admin course editor form styling
- Course generation progress indicators
- Error handling and user feedback
- Loading states and transitions

---

### Phase 3: Feature Completion & Enhancement (Priority: MEDIUM)

#### Task 3.1: Complete Admin Course Editor
**Required Features:**
1. **Save Functionality:**
   - Implement update API endpoint
   - Handle course metadata updates (title, description, price, difficulty)
   - Update topics and lessons (order, titles, content)

2. **Content Editing:**
   - Rich text editor for lesson content (Markdown or WYSIWYG)
   - Inline editing for topic/lesson titles
   - Drag-and-drop reordering (mentioned in handover)

3. **Media Management:**
   - Upload/replace course thumbnail
   - Manage lesson images
   - Preview media before saving

4. **Publishing Controls:**
   - Publish/unpublish toggle
   - Schedule publishing (future enhancement)
   - Duplicate course functionality

#### Task 3.2: Course Content Regeneration
**Objectives:**
- Allow admins to regenerate specific lessons
- Improve/refine AI-generated content

**Features:**
1. "Regenerate Lesson" button on each lesson
2. "Regenerate All Lessons" for entire course
3. Option to regenerate images only
4. Version history (future enhancement)

#### Task 3.3: Enhanced Analytics Dashboard
**Objectives:**
- Track course generation costs
- Monitor content quality
- User engagement metrics

**Features:**
1. Generation statistics (time, tokens used, cost)
2. Content quality scores
3. User enrollment and completion rates
4. Popular courses dashboard

---

### Phase 4: Production Preparation (Priority: MEDIUM-LOW)

#### Task 4.1: Environment Configuration
**Actions:**
1. Audit all environment variables
2. Create comprehensive `.env.example`
3. Document API key setup process
4. Verify Supabase RLS policies
5. Test authentication flows end-to-end

#### Task 4.2: Performance Optimization
**Actions:**
1. Implement Next.js image optimization
2. Add lazy loading for heavy components
3. Optimize database queries (add indexes if needed)
4. Enable Edge runtime where appropriate
5. Set up CDN for static assets

#### Task 4.3: Testing & Validation
**Actions:**
1. Create test suite for critical paths
2. Test all API endpoints
3. Validate course generation with different inputs
4. Test payment flow (Stripe sandbox)
5. Cross-browser testing

#### Task 4.4: Documentation
**Actions:**
1. Update README with current state
2. Create admin user guide
3. Document API endpoints
4. Create troubleshooting guide
5. Update handover documents

---

### Phase 5: Future Enhancements (Priority: LOW)

#### Advanced Features (Per Documentation)
1. **Voice AI Tutor Integration** - RAG-enabled voice assistant
2. **Video Avatar Generation** - RunPod + SadTalker integration
3. **Course Condensation** - Import from external platforms
4. **Progress Tracking** - Detailed student analytics
5. **Certificate Generation** - Automated upon completion
6. **Social Features** - Discussion forums, comments
7. **Offline Mode** - PWA with offline course access
8. **Multi-language Support** - i18n implementation
9. **Mobile Apps** - React Native or similar

---

## 📋 IMMEDIATE ACTION ITEMS

### Today's Session Priorities:
1. **CRITICAL:** Debug and fix admin edit route 404
   - [ ] Verify route file exists and is correct
   - [ ] Check for middleware/config conflicts
   - [ ] Test route in browser with actual course ID
   - [ ] Implement fix and verify

2. **HIGH:** Test end-to-end course generation
   - [ ] Generate 1 complete course
   - [ ] Verify content quality (500+ words, images, quizzes)
   - [ ] Check database entries
   - [ ] Test public course view

3. **MEDIUM:** Implement course editor save functionality
   - [ ] Create update API endpoint
   - [ ] Wire up form submission
   - [ ] Add success/error notifications
   - [ ] Test updates persist correctly

4. **DOCUMENTATION:** Update project status
   - [ ] Create/update CURRENT_STATUS.md
   - [ ] Document any new issues found
   - [ ] Update this plan based on findings

---

## 🔧 TECHNICAL NOTES

### Key File Locations
- **Course Generation:** `lib/ai/course-generator.ts`
- **Content Generation:** `lib/ai/groq.ts`
- **Image Service:** `lib/ai/image-service.ts`
- **Database Ops:** `lib/database/course-operations.ts`
- **Admin Editor:** `app/admin/courses/[id]/page.tsx`
- **Course Generator UI:** `app/admin/courses/new/page.tsx`

### Database Tables (Supabase)
- `courses` - Main course metadata
- `course_topics` - Course modules/chapters
- `course_lessons` - Individual lessons with content
- `lesson_images` - Images for lessons with attribution
- `course_quizzes` - Quiz metadata
- `quiz_questions` - Individual questions with answers
- `ai_generated_courses` - AI generation tracking

### API Endpoints
- `POST /api/course/generate` - Generate new course
- `GET /api/course/generate/:id` - Check generation status
- `DELETE /api/course/delete` - Delete course (cascading)
- `GET /api/course/:id` - Fetch complete course data
- *Missing:* `PATCH /api/course/:id` - Update course (TO BE IMPLEMENTED)

### Environment Variables Required
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# AI Services
GROQ_API_KEY=
GOOGLE_GENERATIVE_AI_API_KEY=
ELEVENLABS_API_KEY= (optional)

# Image Services
UNSPLASH_ACCESS_KEY=
PEXELS_API_KEY=

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# PostHog
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 📈 SUCCESS METRICS

### Phase 1 Success:
- [ ] Admin edit route accessible and functional
- [ ] Course metadata can be updated and saved
- [ ] Zero 404 errors in admin panel

### Phase 2 Success:
- [ ] 100% of generated courses meet content quality standards
- [ ] All images load correctly
- [ ] Quiz generation works consistently
- [ ] No browser caching issues

### Phase 3 Success:
- [ ] Full CRUD operations on courses
- [ ] Content regeneration works
- [ ] Admin can manage all course aspects

### Phase 4 Success:
- [ ] Ready for deployment
- [ ] All documentation complete
- [ ] Performance benchmarks met
- [ ] Security audit passed

---

## 🚀 NEXT STEPS

**Right Now:**
1. Review `next.config.ts` for route conflicts
2. Test admin edit route with actual course ID
3. Implement fix based on findings
4. Generate test course to verify system health
5. Document findings and update this plan

**This Week:**
1. Complete Phase 1 (Critical Bugs)
2. Start Phase 2 (QA & UX)
3. Begin Phase 3 (Feature Completion)

**This Month:**
1. Complete Phases 1-4
2. Prepare for production deployment
3. Plan Phase 5 (Future Enhancements)

---

**Status:** Ready to begin execution  
**Last Updated:** 2025-12-22  
**Next Review:** After Phase 1 completion
