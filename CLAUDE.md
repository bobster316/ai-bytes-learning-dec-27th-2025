# AI Bytes Learning — Project Context for Claude Code

## What This Project Is

AI Bytes Learning is a micro-learning platform for AI education. It's a Next.js 16 + React 19 application with Supabase backend, AI-powered course generation, a voice assistant called Sterling, and Stripe payments.

## Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19, Tailwind CSS, Framer Motion, Radix UI primitives
- **State**: Zustand + React Query
- **Styling**: Tailwind + CSS custom properties (dark/light via `next-themes`)
- **Backend**: Supabase (PostgreSQL + Auth + Storage), API routes in `app/api/`
- **AI Models**: Gemini 2.0 Flash (primary generator), Anthropic Claude, OpenAI (available but secondary)
- **Voice**: ElevenLabs TTS + Gemini Live Audio for Sterling assistant
- **Vector DB**: Pinecone (index: `ai-bytes-courses`, 1024 dimensions via VoyageAI `voyage-2`)
- **Payments**: Stripe (3 tiers: Standard £15/mo, Professional £25/mo, Unlimited £35/mo)
- **Video**: HeyGen avatar videos for course intros
- **Images**: Gemini image generation, Unsplash, Pexels, Replicate
- **Analytics**: PostHog
- **Testing**: Playwright

## Project Structure

```
app/                    # Next.js App Router pages
  api/                  # API routes (course generation, sterling, stripe, etc.)
  courses/              # Course browsing and lesson viewing
  admin/                # Admin dashboard, course editor, quality reports
  auth/                 # Supabase auth (signin, signup, callback)
  dashboard/            # User dashboard
  pricing/              # Stripe checkout
components/
  course/               # Lesson renderer, quiz, navigation, sidebar, certificates
  voice/                # SterlingVoice.tsx, ParticleGlobe, SterlingHUD
  ui/                   # Shadcn-style primitives (button, card, dialog, etc.)
  generation/           # Course generation loaders (neural-loom, futuristic-loader)
  admin/                # Course editor, quality dashboard
  subscription/         # Access control, upgrade modals
lib/
  ai/                   # Agent systems (v1 + v2), prompts, content validator, RAG, image service
  voice/                # Sterling personality, knowledge base, context fetcher
  services/             # Adaptive learning, spaced repetition, gamification, flashcards, ElevenLabs, HeyGen, QA
  database/             # Course CRUD operations
  types/                # TypeScript types (course-generator, course-upgrade, schema)
  supabase/             # Client, server, admin Supabase instances
  stripe/               # Stripe client, config, constants
  subscriptions/        # Access checking, subscription service
  utils/                # Lesson renderers (v1, v2), progress tracker
supabase/migrations/    # SQL schema migrations
scripts/                # Utility scripts (Sterling config, course verification, seeding)
```

## The Current Problem (CRITICAL)

### Course generation output does NOT match the intended lesson design.

There is an HTML prototype file that defines what lessons SHOULD look like: a rich, magazine-style experience with 12+ distinct visual components. But the generation pipeline produces a single markdown blob that gets rendered as basic paragraphs and headers.

### What the prototype has (the target):
- Hero video block with tutor avatar
- Lesson header with tag, title (with italic emphasis), duration/XP/difficulty chips
- Learning objective card with gradient border
- Section headings with accent bar decoration
- Short body paragraphs (2-3 sentences max) in serif font
- Full-width section images with gradient caption overlays
- 3-column comparison cards with colour-coded badges and images
- Image + text side-by-side rows (alternating left/right)
- Callout boxes (tip/warning with icon)
- Industry tabs showing real-world examples across 4-5 sectors
- Interactive inline quiz with image context, animated feedback, confidence rating
- Completion card with trophy, XP, skills earned, confetti
- Key terms accordion
- Three-font typography: Syne (headings), Instrument Serif (body), DM Mono (data)
- Colour system: pulse (#00FFB3), iris (#9B8FFF), amber (#FFB347), nova (#FF6B6B)

### What generation currently produces:
- A single `topicContent` markdown string (800+ words)
- 4 `[IMAGE: type]` text markers that render as dashed placeholder boxes
- Basic `<p>`, `<h2>`, `<h3>` HTML output via a line-by-line markdown parser
- No structured blocks, no visual variety, no interactivity

### Root cause:
The lesson schema (`ConceptExplanation` in `lib/types/course-upgrade.ts`) is too flat. It stores content as one markdown string. The generator prompt asks for prose, not structured blocks. The renderer (`lib/utils/lesson-renderer-v2.ts`) is a basic markdown-to-HTML converter.

## Key Files for the Fix

| File | Purpose | Action Needed |
|------|---------|---------------|
| `lib/types/course-upgrade.ts` | Type definitions for generated content | Add new `ContentBlock` union type |
| `lib/ai/agent-system-v2.ts` | V2 generation agents (Planner, Expander, Evaluator) | Rewrite `LessonExpanderAgent` prompt to produce blocks |
| `lib/ai/prompts/enhanced-planning-prompt.ts` | Planning prompt template | Update to reference block structure |
| `lib/utils/lesson-renderer-v2.ts` | HTML renderer for lessons | Replace with React block renderer |
| `components/course/lesson-content-renderer.tsx` | React component that displays lesson content | Rewrite to use block renderer |
| `supabase/migrations/` | Database schema | Add `content_blocks JSONB` column to `course_lessons` |

## Database Schema (Relevant Tables)

```sql
courses (id UUID, title, description, difficulty_level, thumbnail_url, published, ...)
course_topics (id UUID, course_id, title, introduction, position, ...)
course_lessons (id UUID, topic_id, title, content_markdown TEXT, position, ...)
course_lesson_images (id UUID, lesson_id, image_url, image_prompt, position)
course_quizzes (id UUID, topic_id, ...)
course_quiz_questions (id UUID, quiz_id, question_text, options JSONB, correct_answer, explanation, ...)
user_course_progress (user_id, course_id, ...)
user_quiz_attempts (user_id, quiz_id, score, ...)
```

## Sterling AI Assistant

Sterling is a British-accented, witty, slightly condescending AI tutor. He uses ElevenLabs for voice and Gemini Live Audio for real-time conversation. His personality is defined in `lib/voice/sterling-constants.ts` and `lib/voice/sterling-knowledge.ts`. The component is `components/voice/SterlingVoice.tsx`.

Note: The code still has references to "Jarvis" (the old name) in some files. Sterling is the correct name.

## Coding Standards

- TypeScript strict mode
- UK English spelling (colour, behaviour, organisation, etc.)
- Tailwind CSS for styling (no inline styles)
- Radix UI for accessible primitives
- All colours via CSS custom properties or Tailwind classes — never hardcoded hex in components
- Currency in GBP (£)
- Date format: DD/MM/YYYY
- Font imports from Google Fonts
- Components use `cn()` utility from `lib/utils.ts` for class merging
