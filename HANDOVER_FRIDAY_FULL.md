# AI Bytes Learning — Full Continuity Handover
**Prepared:** 11 March 2026
**Resume date:** Friday 14 March 2026
**Working directory:** `D:\ai-bytes-leaning-22nd-feb-2026 Backup`
**Dev server:** `npm run dev` (not running — start manually)

---

## 1. Objective

Build **AI Bytes Learning** into the world's best micro-learning platform — Awwwards-level design that competitors (Coursera, Udemy, LinkedIn Learning) admire. The platform teaches AI skills in 15-minute "Byte" lessons.

This is a two-track mission running in parallel:

**Track A — Design system coherence**
The lesson experience (defined by `lesson_final.html`) is the design reference. Everything surrounding it — course overview, module intro, navigation sidebar — must feel like the same product. The course page was light/white, the lesson is dark. The colour palette was different. These tracks are being unified.

**Track B — Generation pipeline**
Generated lessons currently come out as flat markdown blobs rendering as `<p>` and `<h2>` tags. The target is structured JSON blocks rendered as the rich visual experience in `lesson_final.html`. This is the biggest remaining engineering task and has not yet started.

---

## 2. Current Status

### ✅ Completed (this session, 11 March)

| Item | File | What changed |
|------|------|-------------|
| `lesson_final.html` — video | Root | Real `<video>` using `public/videos/intro.mp4`; typing demo moved below as secondary section |
| `lesson_final.html` — layout | Root | All max-widths standardised; hero symmetry fixed; `reveal` removed from video section |
| Course overview page | `app/courses/[courseId]/page.tsx` | `bg-white` → `bg-[#080810]`; violet/cyan → iris/pulse; avatar unchanged |
| PremiumCurriculum | `components/course/premium-curriculum.tsx` | Violet/cyan → iris/pulse/amber throughout; title updated to "What you'll learn" |
| Lesson sidebar | `components/course/lesson-sidebar.tsx` | Violet → iris; "Topic Assessment" → "Module Assessment" |
| Module intro page | `app/courses/[courseId]/topics/[topicId]/page.tsx` | Full page built from scratch — was a redirect |

### 🔄 Partially done / not verified

| Item | Notes |
|------|-------|
| Lesson page shell | `app/courses/[courseId]/lessons/[lessonId]/page.tsx` — not read or updated this session. May still have violet/cyan references. |
| PremiumCurriculum → module intro link | Module headers toggle expand/collapse but don't navigate to module intro page yet |
| Browser verification | All changes written but not confirmed working in browser |

### ❌ Not started

- New block types in `lib/types/lesson-blocks.ts`
- AI generator prompt rewrite (`lib/ai/agent-system-v2.ts`)
- React block components (`components/course/blocks/`)
- Lesson content renderer rewrite (`components/course/lesson-content-renderer.tsx`)
- Audio generation (ElevenLabs quota resets Friday 14 March — today)
- Completion card replacement (currently has confetti + trophy — user rejected)

---

## 3. Important Context

### Platform
- **Stack:** Next.js 16 (App Router), React 19, Supabase (PostgreSQL + Auth + Storage), Tailwind CSS, Framer Motion, Radix UI
- **AI generation:** Gemini 2.0 Flash (primary), Anthropic Claude, OpenAI (secondary)
- **Voice assistant:** Sterling — British, witty, slightly condescending AI tutor. NOT "Jarvis" (old name). Component: `components/voice/SterlingVoice.tsx`
- **Payments:** Stripe — Standard £15/mo, Professional £25/mo, Unlimited £35/mo
- **Video:** HeyGen for AI avatar intro videos (one per course)
- **Analytics:** PostHog
- **Testing:** Playwright
- **V2 generator active:** env var `NEXT_PUBLIC_USE_V2_GENERATOR=true`
- **Middleware:** `middleware.ts` (active)

### Database — relevant tables
```sql
courses               (id, title, description, difficulty_level, thumbnail_url, intro_video_url, price, ...)
course_topics         (id, course_id, title, description, order_index, video_url, thumbnail_url, ...)
course_lessons        (id, topic_id, title, content_markdown TEXT, content_blocks JSONB, order_index, ...)
course_quizzes        (id, topic_id, title, ...)
course_quiz_questions (id, quiz_id, question_text, options JSONB, correct_answer, explanation, ...)
user_lesson_progress  (user_id, lesson_id, course_id, status)
user_course_progress  (user_id, course_id, status)
quiz_attempts         (user_id, quiz_id, course_id, passed, ...)
```

### Terminology — CRITICAL, ENFORCED
- Course structure units = **modules** (NEVER "topics", even though the DB table is `course_topics`)
- A lesson = a "Byte" in marketing copy
- "Quiz" at module level = "Module Assessment" in UI copy
- Inline questions inside a lesson = "predictions" (not quizzes)

### Design tokens — ENFORCED everywhere
```
--pulse:  #00FFB3   Mint green — success, CTA, completion, outcomes
--iris:   #9B8FFF   Purple    — active state, primary nav accent, headings
--amber:  #FFB347   Orange    — time indicators, warnings
--nova:   #FF6B6B   Red       — live badges, errors, alerts
--bg:     #080810   Near-black page background
--surface:#0f0f1a   Card/section background
--border: rgba(255,255,255,0.08)
```

### Typography
- **Plus Jakarta Sans** — display headings (h1, h2)
- **Inter** — body/reading text
- **DM Mono** — labels, badges, code, data
- **Instrument Serif** — decorative italic
- **Fraunces** — pull quotes

### AI avatar rules — ENFORCED
- **1 avatar video per course** — on the course overview page only
- Module intro pages: NO avatar
- Lesson pages: NO avatar
- Avatar size: NEVER increase beyond `lg:col-span-5` `aspect-video`. Only same or smaller.
- Component: `VoiceAvatar` from `components/voice/voice-avatar.tsx`
- Source field: `intro_video_url` on courses table
- Instructors: Sarah (`/sarah_host.png`) or Gemma (`/gemma_host.png`) — determined by `[gemma]` tag in course description

### layout_final.html — layout rules (ENFORCED)
- Main content max-width: **1140px**
- Narrow text/quote max-width: **840px**
- Ending scene max-width: **760px**
- All sections: `margin: 0 auto`, `padding: 8–10vh 8vw`
- NO full-bleed images — user explicitly rejected multiple times
- Video source: `public/videos/intro.mp4` — local file (CDNs block hotlinking from `file://`)

### Current courses in DB
- **Course 753:** "Prompt Engineering Demystified" — fully generated, complete
- **Course 754:** "Introduction to Neural Networks" — partial, 1 lesson (ID 3430) generated with Veo video

### ElevenLabs quota
- Was ~20 credits at start of session
- **Resets Friday 14 March 2026** — audio generation work resumes then

---

## 4. Decisions Made

| Decision | Rationale |
|----------|-----------|
| Dark theme throughout (`bg-[#080810]`) | Course pages were white, lesson was dark — jarring mid-session visual switch. Unified to dark from the first page. |
| Single colour palette (iris/pulse/amber/nova) | Course pages used violet/cyan, lesson used different tokens. Looked like two different products. Single token set ensures visual continuity. |
| No full-bleed images | User explicitly rejected them multiple times. Every image must be in a contained, rounded card. |
| No confetti/trophy/XP on lesson completion | User called it "over the top". Lesson ending = 3 clean skills learned + next button only. |
| Module intro page is a real page, not a redirect | The old `/topics/[id]` just fired a redirect to Lesson 1 with no context. Students had no idea what a module covered before entering it. |
| Quiz placement: module level (graded) + lesson level (prediction, unscored) | Module quiz = gate, 70% pass mark, required to advance. Lesson prediction = engagement, immediate reveal, no score stored. |
| AI avatar: course level only, 1 per course | HeyGen credit cost. Module-level videos are not sustainable. Avatar is exclusive to course intro. |
| Avatar size: frozen at current or smaller | User directive. Explicitly stated "not bigger". |
| Typing animation is secondary to real video | User asked "where is the video" four times when shown only the typing animation. Real `<video>` is now primary. Typing demo is a separate labelled section below it. |
| `lesson_final.html` is the design reference | All React implementation must match this HTML prototype. It defines the target experience. |
| Scroll-driven scenes, no Continue button gating | Inspired by The Pudding, Stripe, Apple — NOT Coursera/Udemy patterns. |
| Punch quotes max 2.5–3rem | User flagged 6rem as "too large and hard to read". |

---

## 5. Completed Outputs

### A. `lesson_final.html` (root of project — open directly in browser)

Standalone ~3000-line HTML/CSS/JS file. No server needed. Demonstrates "Prompt Engineering · Lesson 01: You've Been Talking to AI Wrong."

**Full section structure:**

1. **Hook/Hero** — Full viewport, mesh gradient background, canvas node network animation, text scramble on title. 3-column grid: left (course progress card + practical outcomes), middle (ROLE/CONTEXT/TASK/FORMAT accent pills on vertical line), right (stats + key image)

2. **Stat punch** — "80% of people use AI wrong" — bold centred statement, max-width 840px, node network canvas animation, contained insight card below

3. **Video section** — `<video autoplay muted loop>` from `public/videos/intro.mp4`, overlay bar with title/meta, progress bar synced to `timeupdate` event. Below it: animated typing comparison demo with ● LIVE badge (loops vague → structured prompt)

4. **Anatomy of a Perfect Prompt** — SVG mindmap diagram (centre), then 4 alternating cards: odd = image left/content right, even = content left/image right. Each card covers ROLE, CONTEXT, TASK, FORMAT with image and explanation

5. **Bento grid** — 3×2 Apple-style grid showing common mistakes / what changes

6. **Flow diagram** — SVG left-to-right: [Vague words] → [AI Model] → [Generic output] (nova/red) vs [Structured prompt] → [AI Model] → [Precise output] (pulse/green)

7. **Prediction block** — Inline mid-lesson question, 3 options, immediate bottom-slide reveal (no modal). Correct answer marked with explanation.

8. **Mindmap** — SVG concept map showing how ROLE/CONTEXT/TASK/FORMAT connect to YOUR PROMPT. Lines animate in on scroll via IntersectionObserver.

9. **Techniques** — Chain of Thought, Few-Shot, Persona Stacking. Horizontal scroll or tabbed layout.

10. **Punch quote** — "The model never guesses your intent. It guesses a word." (~2.5rem, centred, max-width 840px)

11. **Clean ending** — 3 skills learned (checkmarks), "Next Lesson →" CTA. NO confetti. NO trophy. NO XP animation.

**Key JS systems:**
- Canvas node network (hero background)
- Text scramble entrance on hero title
- Magnetic CTA button (mouse proximity, max 15px warp)
- Fixed right-rail progress dots (8 sections, active = pulse)
- SVG line draw-in on IntersectionObserver (anatomy + mindmap)
- Typing demo IIFE — `PHASES` array, `typeText()`, `runPhase()`, starts 800ms after load, loops forever
- `@keyframes livePulse` for ● LIVE badges
- `@keyframes demoProgress` for progress bar (fallback if video fails)
- Video progress bar: `vid.addEventListener('timeupdate', ...)` syncs bar width to `currentTime / duration`

---

### B. Course overview page (`app/courses/[courseId]/page.tsx`)

Key changes made:
```tsx
// Outer section
<section className="min-h-screen flex flex-col bg-[#080810] font-sans selection:bg-[#9B8FFF]/30 selection:text-[#9B8FFF]">

// Mesh blobs (inside dark card)
<div className="absolute top-[-20%] right-[-10%] w-[700px] h-[700px] bg-[#9B8FFF]/15 rounded-full blur-[120px]" />
<div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-[#00FFB3]/8 rounded-full blur-[100px]" />

// Difficulty badge
bg-[#9B8FFF]/15 border border-[#9B8FFF]/30 text-[#9B8FFF]

// Duration badge
bg-[#00FFB3]/10 border border-[#00FFB3]/25 text-[#00FFB3]

// Outcome card
bg-[#00FFB3]/8 border border-[#00FFB3]/20
Label: "After this course you can"  (was "Target Outcome")
Icon: text-[#00FFB3]

// Primary CTA button (unlock/start)
bg-[#9B8FFF] hover:bg-[#8a7fee] text-[#080810]

// Subscription CTA block
bg-[#0f0f1a] border border-[#9B8FFF]/20
Button: bg-[#9B8FFF] hover:bg-[#8a7fee] text-[#080810]
```

**AI avatar — UNCHANGED:**
```tsx
<div className="relative hidden lg:block lg:col-span-5 h-full">
  <div className="relative w-full h-full rounded-3xl overflow-hidden shadow-2xl border border-white/10 bg-slate-900/50 aspect-video">
    <VoiceAvatar src={course.intro_video_url} poster={instructorPoster} ... />
  </div>
</div>
```

---

### C. PremiumCurriculum (`components/course/premium-curriculum.tsx`)

Key changes:
```tsx
// Section background
bg-[#0a0a12]  (was #04040B)

// Section label
bg-[#00FFB3]/10 text-[#00FFB3] border-[#00FFB3]/20
Text: "Course Curriculum"  (was "High-Velocity Curriculum")

// Section title
"What you'll learn"  (was "Syllabus Breakdown")

// Stat dots
Modules: bg-[#9B8FFF]
Lessons: bg-[#00FFB3]
Time: bg-[#FFB347]

// Module insights bar
bg-gradient-to-r from-[#00FFB3]/8 to-[#9B8FFF]/8
border-[#9B8FFF]/15
Label: text-[#00FFB3]

// Progress bar
from-[#00FFB3] to-[#9B8FFF]  (was from-cyan-500 to-violet-500)

// Lesson hover state
hover:bg-[#9B8FFF]/5 hover:border-[#9B8FFF]/15

// Lesson title hover
completed: group-hover:text-[#00FFB3]
not started: group-hover:text-[#9B8FFF]

// Objective badge
bg-[#9B8FFF]/10 text-[#9B8FFF] border-[#9B8FFF]/20

// Quiz row
passed: bg-[#00FFB3]/5 hover:bg-[#00FFB3]/8 border-[#00FFB3]/20
not passed: hover:bg-[#9B8FFF]/8 hover:border-[#9B8FFF]/20

// Quiz icon
passed: bg-[#00FFB3]/15 text-[#00FFB3]
not passed: bg-[#9B8FFF]/15 text-[#9B8FFF]

// Quiz button
passed: bg-[#00FFB3]/20 text-[#00FFB3] border-[#00FFB3]/30
not passed: bg-[#9B8FFF] text-[#080810]
```

---

### D. Lesson sidebar (`components/course/lesson-sidebar.tsx`)

Key changes:
```tsx
// Module label
border-[#9B8FFF]/50   (was border-violet-500/60)
text-[#9B8FFF]        (was text-violet-400)

// Active lesson
bg-[#9B8FFF]/15 text-[#9B8FFF] font-semibold border-l-2 border-[#9B8FFF]
Icon: fill-[#9B8FFF] text-[#9B8FFF]

// Inactive lesson hover
hover:bg-white/5 hover:text-white/70

// Module assessment (quiz) — completed
text-[#00FFB3] bg-[#00FFB3]/8 border border-[#00FFB3]/20
Icon: text-[#00FFB3]
Text: "Quiz Completed ✓"

// Module assessment — not started
hover:bg-[#9B8FFF]/8 hover:text-[#9B8FFF] hover:border-[#9B8FFF]/30
Icon: group-hover:text-[#9B8FFF]
Text: "Module Assessment"  (was "Topic Assessment")
```

---

### E. Module intro page — FULL NEW FILE (`app/courses/[courseId]/topics/[topicId]/page.tsx`)

Was: a pure redirect to first lesson.
Now: a complete designed page.

**Full page structure:**
```
Fixed top nav bar (z-50, bg-[#080810]/90 backdrop-blur):
  ← [Course Title]                    Module X of Y

Hero (pt-32 pb-20, relative, bg-[#080810]):
  Mesh blobs: iris top-right, pulse bottom-left
  Badge: "Module 01" (iris, monospace font)
  h1: Module title (4xl–6xl, font-bold, tracking-tight)
  p: Module description (text-white/50)
  Stats row: [N lessons, BookOpen iris] [~Xm, Clock amber] [Module assessment, CheckCircle pulse]
  CTA: "Start Module →" (iris bg, dark text, rounded-full, glow shadow)

Divider (gradient line)

"In this module" / "Lesson by lesson" section:
  Lesson cards (for each lesson):
    - Number circle (font-mono, iris on hover)
    - Lesson number label + title + micro_objective
    - Duration (Clock icon)
    - Arrow (→, iris on hover)
  Quiz row (if exists):
    - Pulse coloured
    - "Module Assessment"
    - "70% pass mark required to complete this module"

Bottom section:
  Divider
  "Ready? Each lesson takes ~15 minutes."
  "Begin Lesson 1 →" (iris CTA)
```

Self-healing preserved: if `topicId` is actually a quiz ID → redirects to `/courses/[courseId]/quizzes/[id]`.

---

## 6. Outstanding Tasks (Priority Order)

### Priority 1 — Browser verification
```bash
cd "d:\ai-bytes-leaning-22nd-feb-2026 Backup"
npm run dev
```
Visit:
- `http://localhost:3000/courses/753` — course overview (dark bg, iris/pulse colours)
- `http://localhost:3000/courses/753/topics/[any-topic-id]` — module intro page
- `http://localhost:3000/courses/753/lessons/[any-lesson-id]` — lesson + sidebar

Fix any TypeScript errors or missing imports before moving on.

### Priority 2 — Add "View Module →" link in PremiumCurriculum
Module headers in `components/course/premium-curriculum.tsx` currently toggle expand/collapse when clicked. Add a separate link to navigate to the module intro page.

**Where:** Inside the `.module-header-right` div, around line 222.
**What to add:**
```tsx
import { ArrowRight } from "lucide-react";

// Inside .module-header-right, alongside the progress pill:
<Link
  href={`/courses/${course.id}/topics/${topic.id}`}
  className="hidden lg:flex items-center gap-1 text-xs text-[#9B8FFF] hover:text-white font-medium transition-colors"
  onClick={e => e.stopPropagation()}
>
  View Module <ArrowRight className="w-3 h-3" />
</Link>
```
The `e.stopPropagation()` prevents the link from also triggering the expand/collapse toggle.

### Priority 3 — Read and update lesson page shell
File: `app/courses/[courseId]/lessons/[lessonId]/page.tsx`

This file was not touched this session. Read it fully and:
- Check for any `bg-white` or violet/cyan colour references
- Update the sidebar container background if needed
- Ensure the lesson shell (outer wrapper, top bar, navigation) uses `bg-[#080810]` and iris/pulse

### Priority 4 — ElevenLabs audio (quota resets today, Friday 14 March)
Generate audio narration for at least one lesson using ElevenLabs TTS with Sterling's voice.

Relevant files:
- `lib/services/` — contains ElevenLabs service
- Start with Course 754, Lesson 3430 ("Neural Networks: The Basics")

### Priority 5 — Begin lesson block type implementation
This is the most impactful long-term task. Start with the TypeScript types — no UI or AI changes yet.

**File:** `lib/types/lesson-blocks.ts`

Add a union type like:
```typescript
export type ContentBlock =
  | { type: 'text_section'; heading?: string; body: string; callout?: { kind: 'tip' | 'warning'; text: string } }
  | { type: 'punch_quote'; text: string; attribution?: string }
  | { type: 'stat_callout'; stat: string; label: string; context: string }
  | { type: 'anatomy_card'; component: 'role' | 'context' | 'task' | 'format'; title: string; explanation: string; example: string; imagePrompt: string }
  | { type: 'bento_grid'; cells: { title: string; body: string; accent: 'pulse' | 'iris' | 'amber' | 'nova' }[] }
  | { type: 'flow_diagram'; steps: { label: string; description: string }[]; contrast?: { bad: string; good: string } }
  | { type: 'prediction'; question: string; options: { label: string; correct: boolean; explanation: string }[] }
  | { type: 'mindmap'; centre: string; nodes: { label: string; description: string; colour: string }[] }
  | { type: 'technique_card'; name: string; description: string; example: string }
  | { type: 'image_block'; prompt: string; caption?: string; url?: string }
  | { type: 'completion_card'; skills: string[]; nextLessonId?: string }
```

After types are defined, the next steps are:
1. Rewrite `LessonExpanderAgent` in `lib/ai/agent-system-v2.ts` to output this JSON structure
2. Build React components in `components/course/blocks/` (one file per block type)
3. Update `components/course/lesson-content-renderer.tsx` to map block types to components

---

## 7. Open Questions

1. **Module intro design approval** — The module intro React page was built without showing the user a mockup first. Does the user want to see it visually before it goes live, or is the functional implementation sufficient?

2. **PremiumCurriculum module header click behaviour** — Should the entire module header row navigate to the module intro page? Or should expand/collapse stay on the chevron only, with a separate "View Module" link? (Current plan: separate link, chevron toggles expand.)

3. **Lesson page shell** — Is `app/courses/[courseId]/lessons/[lessonId]/page.tsx` already dark, or does it need the same white-to-dark treatment as the course overview page? Not checked yet.

4. **Sterling voice ID for ElevenLabs** — The quota resets Friday. What is the confirmed ElevenLabs voice ID for Sterling? Check `lib/services/` for the hardcoded or env-based value before generating.

5. **Inline prediction storage** — When the block renderer is built, should `prediction` blocks be stored in `content_blocks JSONB` on `course_lessons`, or is there a separate table planned?

6. **Module assessment pass mark** — Currently hardcoded as "70%" in the module intro page. Is this always 70%, or should it be configurable per module/course?

7. **Completion card location** — Where exactly is the current completion card with confetti rendered? `components/course/completion-card.tsx`? Or is it inside `lesson-content-renderer.tsx`? Needs to be found before replacing it.

8. **`lesson_final.html` — is this signed off?** — The video section is now showing (confirmed by user "yes I can see it"). But no explicit approval of the full design was given. Clarify before beginning React implementation.

---

## 8. Risks and Likely Issues

### Risk 1 — TypeScript errors in module intro page
The new `app/courses/[courseId]/topics/[topicId]/page.tsx` uses `courses!inner` in the Supabase select query. If the Supabase client type generation hasn't been run recently, TypeScript may complain about the joined relation. Fix with `as any` casting on the `courses` field, or run `npx supabase gen types typescript`.

### Risk 2 — Module intro page routing conflict
The old `page.tsx` was a pure redirect. If any part of the app relied on the redirect behaviour (e.g. links in emails, saved bookmarks, the quiz self-heal redirect), verify those paths still work. The self-heal (topicId = quiz ID → redirect to quiz) was preserved in the new page.

### Risk 3 — `bg-[#00FFB3]/8` and non-standard Tailwind opacity values
Tailwind JIT supports arbitrary values like `/8` (8% opacity), but if the project uses a custom Tailwind config that doesn't enable JIT for all files, these may not render. Check `tailwind.config.ts` includes all component paths in `content`.

### Risk 4 — Video file size
`public/videos/intro.mp4` is 27MB. This is fine for local development and the HTML mockup, but if `lesson_final.html` is ever deployed or shared via a server, loading a 27MB video inline will be slow on mobile. A compressed version or a proper CDN-hosted file should be used for production.

### Risk 5 — PremiumCurriculum CSS class overrides
The file uses custom CSS class names like `.module-container`, `.module-header-bar`, `.module-badge` etc. These are likely defined in `app/globals.css` or a component-level stylesheet. If those classes still reference violet colours, the Tailwind class overrides in JSX won't take effect. Search globals.css for `.module-` rules.

### Risk 6 — ElevenLabs quota timing
Quota "resets 14 March" — this may mean at a specific time (e.g. midnight UTC vs midnight BST). If generation fails on Friday morning, it may not have reset yet. Wait an hour and retry.

### Risk 7 — lesson_final.html → React fidelity gap
The HTML mockup uses inline CSS, vanilla JS, CDN fonts, GSAP CDN. When porting to React/Tailwind/Framer Motion, many effects will need reimplementing. The text scramble, magnetic button, and canvas node network are vanilla JS and will need wrapping in `useEffect`. GSAP CDN will need replacing with `npm install gsap`. Plan for this taking significantly longer than expected.

---

## 9. Recommended Next 5 Actions (Friday)

**Action 1 — Start the dev server and verify everything**
```bash
cd "d:\ai-bytes-leaning-22nd-feb-2026 Backup"
npm run dev
```
Open `http://localhost:3000/courses/753`. Check:
- Dark background from first paint
- Iris/pulse colour badges and buttons
- Avatar unchanged (same size, same column)
- Click a module row → should now show module intro page
- Click into a lesson → sidebar shows iris active state and "Module Assessment" label

Fix any TypeScript errors before anything else. If the module intro page throws a type error on the `courses!inner` join, add `as any` to the courses field reference.

**Action 2 — Add "View Module" link to PremiumCurriculum**
Open `components/course/premium-curriculum.tsx`, find the `.module-header-right` div (around line 222), add:
```tsx
<Link
  href={`/courses/${course.id}/topics/${topic.id}`}
  className="hidden lg:flex items-center gap-1 text-xs text-[#9B8FFF] hover:text-white font-medium transition-colors ml-4"
  onClick={e => e.stopPropagation()}
>
  View Module <ArrowRight className="w-3 h-3" />
</Link>
```
Import `ArrowRight` from `lucide-react` if not already imported.

**Action 3 — Read and fix lesson page shell**
Read the full `app/courses/[courseId]/lessons/[lessonId]/page.tsx`. Look for `bg-white`, `violet`, `cyan` — update to match the dark palette. This file wraps the sidebar and lesson content, so its background colour affects the whole lesson experience.

**Action 4 — ElevenLabs audio test**
The quota reset today. Run a test generation for Sterling's voice on one short piece of text to confirm the API is live again. Then generate narration audio for Course 754, Lesson 3430. Check `lib/services/` for the ElevenLabs service file and confirm the voice ID is correct for Sterling before submitting a full generation job.

**Action 5 — Define lesson block types**
Open `lib/types/lesson-blocks.ts`. Add the `ContentBlock` union type (full definition in Section 6, Priority 5 above). This doesn't change any UI or AI behaviour — it's purely a type definition. Once it exists, you can start the AI prompt rewrite and component builds in subsequent steps.

---

## 10. Restart Prompt for Friday

Paste this exactly into a new Claude Code chat:

---

```
I'm returning to an ongoing project — AI Bytes Learning, a Next.js 16 + React 19 micro-learning platform.

Project directory: D:\ai-bytes-leaning-22nd-feb-2026 Backup

Please read these files before doing anything else:
1. HANDOVER_FRIDAY_FULL.md (root of project — this is the full continuity document)
2. CLAUDE.md (project rules and architecture)
3. C:\Users\ravkh\.claude\projects\D--ai-bytes-leaning-22nd-feb-2026-Backup\memory\MEMORY.md

After reading, confirm what was completed in the last session and what the immediate next steps are.

Critical rules — do not violate these:
- Course structure units are called MODULES (never "topics" even though DB table = course_topics)
- Design tokens: pulse=#00FFB3, iris=#9B8FFF, amber=#FFB347, nova=#FF6B6B, bg=#080810
- AI avatar: 1 per course only, on course overview page only, NEVER increase size beyond lg:col-span-5 aspect-video
- No full-bleed images anywhere in the app
- No confetti/trophy/XP animation on completion
- UK English throughout (colour, behaviour, organisation)
- All wording: "Module Assessment" not "Topic Assessment", "What you'll learn" not "Syllabus Breakdown"
- Lesson design reference: lesson_final.html at root — open in browser, no server needed

The ElevenLabs quota reset today (Friday 14 March). Sterling audio generation can now resume.

Current priority order:
1. Run npm run dev and verify all colour changes from last session work in browser
2. Add "View Module →" link in PremiumCurriculum module headers (components/course/premium-curriculum.tsx, ~line 222)
3. Read and update lesson page shell (app/courses/[courseId]/lessons/[lessonId]/page.tsx)
4. ElevenLabs audio test and generation for Course 754, Lesson 3430
5. Define ContentBlock union type in lib/types/lesson-blocks.ts

Do not write any code until you have confirmed you've read the handover and understood the current state.
```

---

## 11. Copy-and-Paste Essentials

### Design token reference (use in every file)
```
pulse  = #00FFB3
iris   = #9B8FFF
amber  = #FFB347
nova   = #FF6B6B
bg     = #080810
surface= #0f0f1a
border = rgba(255,255,255,0.08)
```

### Standard Tailwind class patterns
```tsx
// Primary CTA button (iris)
className="bg-[#9B8FFF] hover:bg-[#8a7fee] text-[#080810] font-bold rounded-full px-8 py-4"

// Secondary/ghost button
className="border border-white/10 hover:bg-white/5 text-white/60 hover:text-white rounded-full px-8 py-4"

// Iris badge/pill
className="bg-[#9B8FFF]/15 border border-[#9B8FFF]/30 text-[#9B8FFF] text-[10px] font-bold uppercase tracking-widest rounded-full px-3 py-1"

// Pulse badge/pill
className="bg-[#00FFB3]/10 border border-[#00FFB3]/25 text-[#00FFB3] text-[10px] font-bold uppercase tracking-widest rounded-full px-3 py-1"

// Outcome/success card
className="bg-[#00FFB3]/8 border border-[#00FFB3]/20 rounded-2xl p-6"

// Section background (dark card)
className="bg-[#0a0a12] rounded-[2rem] border border-white/5"

// Mesh blob (iris)
className="absolute w-[700px] h-[700px] bg-[#9B8FFF]/15 rounded-full blur-[120px] pointer-events-none"

// Mesh blob (pulse)
className="absolute w-[500px] h-[500px] bg-[#00FFB3]/8 rounded-full blur-[100px] pointer-events-none"

// Progress bar
className="h-full bg-gradient-to-r from-[#00FFB3] to-[#9B8FFF] transition-all duration-500"

// Active sidebar lesson
className="bg-[#9B8FFF]/15 text-[#9B8FFF] font-semibold border-l-2 border-[#9B8FFF]"

// Module label in sidebar
className="pl-3 border-l-2 border-[#9B8FFF]/50 py-1"
// Label text: className="text-[9px] font-mono font-bold text-[#9B8FFF] uppercase tracking-widest"
```

### PremiumCurriculum — "View Module" link snippet
```tsx
// Add inside .module-header-right, needs onClick stopPropagation
<Link
  href={`/courses/${course.id}/topics/${topic.id}`}
  className="hidden lg:flex items-center gap-1 text-xs text-[#9B8FFF] hover:text-white font-medium transition-colors ml-4"
  onClick={e => e.stopPropagation()}
>
  View Module <ArrowRight className="w-3 h-3" />
</Link>
```

### ContentBlock union type (for lib/types/lesson-blocks.ts)
```typescript
export type ContentBlock =
  | { type: 'text_section'; heading?: string; body: string; callout?: { kind: 'tip' | 'warning'; text: string } }
  | { type: 'punch_quote'; text: string; attribution?: string }
  | { type: 'stat_callout'; stat: string; label: string; context: string }
  | { type: 'anatomy_card'; component: 'role' | 'context' | 'task' | 'format'; title: string; explanation: string; example: string; imagePrompt: string }
  | { type: 'bento_grid'; cells: { title: string; body: string; accent: 'pulse' | 'iris' | 'amber' | 'nova' }[] }
  | { type: 'flow_diagram'; steps: { label: string; description: string }[]; contrast?: { bad: string; good: string } }
  | { type: 'prediction'; question: string; options: { label: string; correct: boolean; explanation: string }[] }
  | { type: 'mindmap'; centre: string; nodes: { label: string; description: string; colour: string }[] }
  | { type: 'technique_card'; name: string; description: string; example: string }
  | { type: 'image_block'; prompt: string; caption?: string; url?: string }
  | { type: 'completion_card'; skills: string[]; nextLessonId?: string }

export interface LessonContent {
  version: 2;
  blocks: ContentBlock[];
}
```

### Module intro page — key section wording
```
Section label:  "In this module"
Section title:  "Lesson by lesson"
Quiz row label: "After all lessons"
Quiz row title: "Module Assessment"
Quiz note:      "70% pass mark required to complete this module"
Bottom note:    "Ready? Each lesson takes ~15 minutes."
CTA:            "Begin Lesson 1 →"
```

### Lesson sidebar — key wording
```
Module label:         "MODULE {n}" (monospace, iris)
Quiz not started:     "Module Assessment"
Quiz completed:       "Quiz Completed ✓"
```

### Course page — key wording changes from this session
```
Outcome card label:   "After this course you can"   (was "Target Outcome")
Curriculum label:     "Course Curriculum"            (was "High-Velocity Curriculum")
Curriculum title:     "What you'll learn"            (was "Syllabus Breakdown")
```

### Video section in lesson_final.html — working setup
```html
<!-- Local video — works from file:// -->
<video id="lessonVideo" autoplay muted loop playsinline
  style="width:100%;height:auto;display:block;max-height:500px;object-fit:cover;background:#060610;"
  onerror="this.style.display='none';document.getElementById('videoFallback').style.display='flex';">
  <source src="public/videos/intro.mp4" type="video/mp4">
</video>
```
```javascript
// Progress bar synced to real video
const vid = document.getElementById('lessonVideo');
const bar = document.getElementById('videoProgressFill');
vid.addEventListener('timeupdate', () => {
  if (vid.duration) bar.style.width = (vid.currentTime / vid.duration * 100) + '%';
});
```

### ● LIVE badge pattern (used in typing demo)
```html
<span style="display:inline-flex;align-items:center;gap:0.35rem;
  background:rgba(255,107,107,0.12);color:#FF6B6B;
  border:1px solid rgba(255,107,107,0.3);border-radius:100px;
  padding:0.25rem 0.7rem;font-size:0.58rem;letter-spacing:0.14em;
  text-transform:uppercase;font-family:'DM Mono',monospace;">
  <span style="width:6px;height:6px;border-radius:50%;background:#FF6B6B;
    animation:livePulse 1.2s ease-in-out infinite;flex-shrink:0;"></span>
  LIVE
</span>
```
```css
@keyframes livePulse {
  0%,100% { opacity:1; transform:scale(1); }
  50%      { opacity:0.4; transform:scale(0.75); }
}
```

### File paths quick reference
```
lesson_final.html                                              — design reference (open in browser)
app/courses/[courseId]/page.tsx                                — course overview
app/courses/[courseId]/topics/[topicId]/page.tsx               — module intro (newly built)
app/courses/[courseId]/lessons/[lessonId]/page.tsx             — lesson shell (needs review)
components/course/premium-curriculum.tsx                       — module/lesson list on course page
components/course/lesson-sidebar.tsx                           — lesson sidebar nav
components/course/lesson-content-renderer.tsx                  — renders lesson content
lib/types/lesson-blocks.ts                                     — block type definitions
lib/ai/agent-system-v2.ts                                      — LessonExpanderAgent prompt
components/course/blocks/                                      — individual block React components
public/videos/intro.mp4                                        — local video file (27MB)
HANDOVER_FRIDAY_FULL.md                                        — this document
CLAUDE.md                                                      — project rules
```

---

*Document prepared: 11 March 2026. Resume: Friday 14 March 2026.*
