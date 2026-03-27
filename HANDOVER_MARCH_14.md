# Handover — 14 March 2026

## Session Goal
Systematically upgrade ALL React block components to match the `lesson_generative_ai_v2.html` demo standard before generating any new courses. User's explicit preference.

## What Was Done This Session

### Bug Fixes (completed in previous session, confirmed)
- Quiz schema: fixed to generate 1 block with `questions: [...]` array — not 3 separate quiz blocks
- Prediction schema: normalization layer added in `block-renderer.tsx` to handle AI mis-formatting
- Veo model: updated to `veo-3.1-generate-preview`

### Component Upgrades — COMPLETED ✅
All these files have been rewritten and saved:

| Component | File | Status |
|-----------|------|--------|
| TextSection | `components/course/blocks/text-section.tsx` | ✅ Done (prev session) |
| Mindmap | `components/course/blocks/mindmap.tsx` | ✅ Done (prev session) |
| FlowDiagram | `components/course/blocks/flow-diagram.tsx` | ✅ Done (prev session) |
| Prediction | `components/course/blocks/prediction.tsx` | ✅ Done (prev session) |
| PunchQuote | `components/course/blocks/punch-quote.tsx` | ✅ Done (prev session) |
| ObjectiveCard | `components/course/blocks/objective-card.tsx` | ✅ Done this session |
| TypeCards | `components/course/blocks/type-cards.tsx` | ✅ Done this session |
| RecapSlide | `components/course/blocks/recap-slide.tsx` | ✅ Done this session |
| CompletionCard | `components/course/blocks/completion-card.tsx` | ✅ Done this session |
| IndustryTabs | `components/course/blocks/industry-tabs.tsx` | ✅ Done this session |
| InteractiveVis | `components/course/blocks/interactive-vis.tsx` | ✅ Done this session |
| AppliedCase | `components/course/blocks/applied-case.tsx` | ✅ Done this session |

### Component Upgrades — REMAINING ❌
These 7 components still need upgrading in the next session:

| Component | File | Priority |
|-----------|------|----------|
| InlineQuiz | `components/course/blocks/inline-quiz.tsx` | HIGH |
| KeyTerms | `components/course/blocks/key-terms.tsx` | HIGH |
| GoDeeper | `components/course/blocks/go-deeper.tsx` | MEDIUM |
| OpenExercise | `components/course/blocks/open-exercise.tsx` | MEDIUM |
| FullImageSection | `components/course/blocks/full-image-section.tsx` | MEDIUM |
| ImageTextRow | `components/course/blocks/image-text-row.tsx` | HIGH |
| CalloutBox | `components/course/blocks/callout-box.tsx` | HIGH |

Also still needed:
| Component | File | Notes |
|-----------|------|-------|
| LessonHeader | `components/course/blocks/lesson-header.tsx` | Not yet read/reviewed |
| VideoSnippet | `components/course/blocks/video-snippet.tsx` | Not yet read/reviewed |
| InlineConceptVideo | `components/course/blocks/inline-concept-video.tsx` | Not yet read/reviewed |
| AudioRecapProminent | `components/course/blocks/audio-recap-prominent.tsx` | Not yet read/reviewed |
| ConceptIllustration | `components/course/blocks/concept-illustration.tsx` | Not yet read/reviewed |

## Exact Upgrade Instructions for Remaining Components

### InlineQuiz (`inline-quiz.tsx`)
Already well-built. Changes needed:
1. Bug: `questions.length` on line 84 of progress bar → change to `safeQuestions.length`
2. `font-syne` → `font-display`; `font-outfit` → `font-body`
3. Feedback labels: "Neural Bridge Active" → "Correct!", "Logic Misalignment" → "Not quite"
4. Correct feedback colour: iris `text-[#9B8FFF]`; wrong: amber `text-[#FFB347]`
5. "Next Signal" → "Next Question"
6. "Validate Hypothesis" → "Check Answer"
7. Remove unused `ImageZoom` import
8. `mb-24` → `mb-16`

### KeyTerms (`key-terms.tsx`)
1. Add motion entrance: `motion.div whileInView opacity 0→1 y 20→0`
2. Heading `font-sans` → `font-display text-[1rem]`; bar colour → `bg-[#00FFB3]` (pulse)
3. Each row: stagger `motion.div opacity 0→1 x -8→0 delay: idx * 0.06`
4. Replace CSS max-h trick with proper `AnimatePresence height: 0 → "auto"`
5. Term text: `font-sans` → `font-display text-[14px]`
6. Add term count badge: `<span className="font-mono text-[10px] text-[#8A8AB0] ml-2">{terms.length} terms</span>`

### GoDeeper (`go-deeper.tsx`)
1. Add `motion, AnimatePresence` imports
2. Wrap in `motion.div whileInView opacity 0→1`
3. Replace `style={{ maxHeight, opacity }}` with `AnimatePresence height 0 → "auto"`
4. Trigger span: `font-sans font-bold text-lg` → `font-display font-bold text-[17px]`
5. Outer card bg: `bg-[#1C2242]` → `bg-[#0f0f1c]`

### OpenExercise (`open-exercise.tsx`)
1. Add `motion` import; wrap in `motion.div whileInView opacity 0→1 y 20→0`
2. Fix `bg-white/8` → `bg-white/[0.08]`
3. Add `font-display` to submit button
4. Replace "Your turn" label with "Active Practice" (pulse colour)
5. Add `nova` to ACCENT map: `{ border:"border-[#FF6B6B]", text:"text-[#FF6B6B]", bg:"bg-[#FF6B6B]/10", glow:"shadow-[0_0_0_1px_rgba(255,107,107,0.3)]" }`
6. Safe accent lookup: `ACCENT[accentColour as keyof typeof ACCENT] || ACCENT.pulse`

### FullImageSection (`full-image-section.tsx`)
1. `font-syne` → `font-display`, `font-outfit` → `font-body`
2. Add shimmer keyframe `<style>` tag
3. "Neural Visualization" → "Visual Loading..."
4. "Field Insight" caption badge → "Insight"
5. **REMOVE** `isFullBleed` support entirely (no full-bleed per project rules) — always use rounded card style

### ImageTextRow (`image-text-row.tsx`)
1. Add `"use client"`
2. Add `motion` import; wrap in `motion.div whileInView opacity 0→1 y 24→0`
3. Text column: `motion.div opacity 0→1 x: reverse ? 16 : -16 → 0 delay:0.15`
4. Remove `style jsx global`, replace with `[&_strong]:text-[#00FFB3] [&_strong]:font-semibold` className
5. `var(--accent)` → `text-[#9B8FFF]`
6. `font-outfit` → `font-body`
7. Add shimmer `<style>` tag

### CalloutBox (`callout-box.tsx`)
1. Add `"use client"`
2. Add `motion` import; wrap in `motion.div whileInView opacity 0→1 x -12→0`
3. Replace broken `<img src="/assets/thumbnails/...">` with Lucide icons (Lightbulb for tip, AlertTriangle for warning)
4. Add `"info"` variant → iris colours + Brain icon
5. Import: `{ Lightbulb, AlertTriangle, Brain }` from lucide-react
6. `mb-4 rounded-xl` on outer container
7. Title: `font-sans` → `font-display text-[13px]`

## Design System Reference
```
Colors:   --pulse #00FFB3 | --iris #9B8FFF | --amber #FFB347 | --nova #FF6B6B
BG:       #080810 (page) | #0d0d1c (cards) | #0f0f1a (surface)
Fonts:    font-display (Syne, headings) | font-body (Outfit, prose) | font-mono (DM Mono, labels)
Widths:   1140px visuals | 840px narrow text | 760px ending
Animate:  whileInView, once:true, ease [0.16,1,0.3,1], stagger 0.1-0.15s
```

## Current Courses in DB
- Course 755 was generated (post-deletion of old courses)
- Courses use V2 generator (`NEXT_PUBLIC_USE_V2_GENERATOR=true`)
- ElevenLabs audio quota reset on 14 March 2026

## After All Components Are Done
1. Generate a fresh test course (e.g. "Introduction to Machine Learning")
2. Check lesson page at `http://localhost:3000/courses/[id]/lessons/[lessonId]`
3. Verify: all block types render correctly, animations work, no broken images
4. Test Veo 3.1 video generation (model: `veo-3.1-generate-preview`)
5. Fix generation progress going backwards (cosmetic race condition — low priority)

## Key File Map
```
components/course/blocks/          ← all block components
components/course/block-renderer.tsx  ← orchestrates all blocks
lib/ai/agent-system-v2.ts          ← LessonExpanderAgent (generation prompt)
lib/ai/veo-video-service.ts        ← Veo 3.1 video generation
lib/types/lesson-blocks.ts         ← TypeScript block types
lesson_generative_ai_v2.html       ← HTML demo (reference standard)
```

## Dev Server
`npm run dev` from `D:\ai-bytes-leaning-22nd-feb-2026 Backup`
Course lesson URL pattern: `http://localhost:3000/courses/[courseId]/lessons/[lessonId]`
