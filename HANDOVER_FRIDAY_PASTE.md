# AI Bytes Learning — Friday Restart Context
**Project:** `D:\ai-bytes-leaning-22nd-feb-2026 Backup`
**Stack:** Next.js 16, React 19, Supabase, Tailwind, Gemini 2.0 Flash, ElevenLabs, HeyGen, Stripe

---

## What this project is
A micro-learning platform for AI education. 15-minute "Byte" lessons. Mission: world's best micro-learning experience — Awwwards-level. Competitors (Coursera, Udemy) must look at it in admiration.

---

## Terminology — never get these wrong
- Course units = **modules** (DB table = `course_topics` but ALWAYS say module)
- A lesson = a "Byte" in copy
- Module-level quiz = "Module Assessment" in UI
- Inline lesson questions = "predictions" (not quizzes)
- Voice assistant = **Sterling** (British, witty — NOT "Jarvis")

---

## Design tokens — use everywhere, no exceptions
```
pulse  #00FFB3   green  — success, CTAs, outcomes
iris   #9B8FFF   purple — active state, primary nav
amber  #FFB347   orange — time, warnings
nova   #FF6B6B   red    — live badges, errors
bg     #080810   near-black background
surface #0f0f1a  card background
```

---

## Hard rules — never violate
- UK English throughout (colour, behaviour, organisation)
- NO full-bleed images anywhere
- NO confetti / trophy / XP animation on completion
- AI avatar: 1 per course, course overview page only, NEVER make it bigger than `lg:col-span-5 aspect-video`
- Font sizes: punch quotes max 3rem
- `lesson_final.html` (root) is the design reference — open in browser, no server needed

---

## What was completed (session ending 11 March)

| Done | File |
|------|------|
| `lesson_final.html` — real video playing (`public/videos/intro.mp4`) | Root |
| `lesson_final.html` — layout fixed (max-widths 1140/840/760px, hero symmetry, no full-bleed) | Root |
| Course overview page — dark bg, iris/pulse palette, avatar unchanged | `app/courses/[courseId]/page.tsx` |
| PremiumCurriculum — iris/pulse colours, "What you'll learn", progress bars | `components/course/premium-curriculum.tsx` |
| Lesson sidebar — iris active state, "Module Assessment" | `components/course/lesson-sidebar.tsx` |
| Module intro page — built from scratch (was a pure redirect) | `app/courses/[courseId]/topics/[topicId]/page.tsx` |

---

## What needs doing Friday (priority order)

**1. Browser check** — `npm run dev`, visit `/courses/753`, verify dark bg, iris/pulse colours, avatar unchanged, module intro page renders at `/courses/753/topics/[id]`

**2. Add "View Module →" link in PremiumCurriculum**
File: `components/course/premium-curriculum.tsx` ~line 222 inside `.module-header-right`:
```tsx
<Link
  href={`/courses/${course.id}/topics/${topic.id}`}
  className="hidden lg:flex items-center gap-1 text-xs text-[#9B8FFF] hover:text-white font-medium transition-colors ml-4"
  onClick={e => e.stopPropagation()}
>
  View Module <ArrowRight className="w-3 h-3" />
</Link>
```

**3. Read and fix lesson page shell**
`app/courses/[courseId]/lessons/[lessonId]/page.tsx` — not touched yet. Check for `bg-white`, violet, cyan. Update to `bg-[#080810]` and iris/pulse palette.

**4. ElevenLabs audio** — quota resets today (14 March). Test Sterling voice. Generate for Course 754, Lesson 3430.

**5. Define block types** — `lib/types/lesson-blocks.ts`:
```typescript
export type ContentBlock =
  | { type: 'text_section'; heading?: string; body: string; callout?: { kind: 'tip'|'warning'; text: string } }
  | { type: 'punch_quote'; text: string }
  | { type: 'stat_callout'; stat: string; label: string; context: string }
  | { type: 'anatomy_card'; component: 'role'|'context'|'task'|'format'; title: string; explanation: string; example: string; imagePrompt: string }
  | { type: 'bento_grid'; cells: { title: string; body: string; accent: 'pulse'|'iris'|'amber'|'nova' }[] }
  | { type: 'flow_diagram'; steps: { label: string; description: string }[] }
  | { type: 'prediction'; question: string; options: { label: string; correct: boolean; explanation: string }[] }
  | { type: 'mindmap'; centre: string; nodes: { label: string; description: string; colour: string }[] }
  | { type: 'technique_card'; name: string; description: string; example: string }
  | { type: 'image_block'; prompt: string; caption?: string; url?: string }
  | { type: 'completion_card'; skills: string[]; nextLessonId?: string }
```

---

## After block types: the full implementation pipeline
1. Rewrite `LessonExpanderAgent` in `lib/ai/agent-system-v2.ts` → output JSON blocks not markdown
2. Build React components in `components/course/blocks/` (one per block type)
3. Rewrite `components/course/lesson-content-renderer.tsx` to render blocks
4. Replace completion card (confetti/trophy) with clean 3-skill summary

---

## Key file paths
```
lesson_final.html                                        design reference — open in browser
app/courses/[courseId]/page.tsx                          course overview
app/courses/[courseId]/topics/[topicId]/page.tsx         module intro (newly built)
app/courses/[courseId]/lessons/[lessonId]/page.tsx       lesson shell — needs review
components/course/premium-curriculum.tsx                 module/lesson list
components/course/lesson-sidebar.tsx                     lesson sidebar
components/course/lesson-content-renderer.tsx            lesson content renderer
lib/types/lesson-blocks.ts                               block type definitions
lib/ai/agent-system-v2.ts                                AI generator prompt
components/course/blocks/                                React block components
public/videos/intro.mp4                                  local video (27MB)
HANDOVER_FRIDAY_FULL.md                                  full detailed handover
```

---

## Open questions needing answers
1. Is `lesson_final.html` fully signed off as the design reference, or does it need more changes?
2. Should clicking a module header in PremiumCurriculum navigate to module intro, or only the "View Module" link?
3. Is the 70% quiz pass mark fixed or configurable per module?
4. What is the ElevenLabs voice ID for Sterling? (Check `lib/services/` before generating)

---

## Risks to watch
- `courses!inner` join in new module intro page may throw TS errors → fix with `as any`
- `bg-[#00FFB3]/8` uses non-standard Tailwind opacity — confirm JIT covers all component paths in `tailwind.config.ts`
- `public/videos/intro.mp4` is 27MB — fine for dev, needs CDN for production
- ElevenLabs quota reset may not be instant — if generation fails Friday morning, wait and retry

---

*Full detailed version: `HANDOVER_FRIDAY_FULL.md` at project root*
*Last session: 11 March 2026 · Resume: Friday 14 March 2026*
