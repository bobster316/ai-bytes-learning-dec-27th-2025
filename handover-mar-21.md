# AI Bytes Learning — Session Handover (March 21, 2026)

This document summarises the massive visual pipeline upgrades, AI orchestration refinements, and strategic planning implemented during this session to ensure a powerful continuation in the next session.

---

## 1. Complete Nano Banana Vendor Migration (Static Images)
- **100% Bespoke Generative Flow**: Originally, only "Hero" images were using the new Gemini 3.1 Flash Image pipeline, while smaller components (like `type_cards` and `industry_tabs`) fell back to the Pexels Stock API. This resulted in jarring, irrelevant stock photos.
- **The Fix**: Rewrote the `generate-v2` orchestrator to pipe **EVERY SINGLE STATIC IMAGE PROMPT** directly to Nano Banana. All imagery across the site is now bespoke, hyper-relevant 3D generative art.
- **Schema Repair**: Fixed a critical bug in the AI's JSON output schema (`agent-system-v2.ts`) where `concept_illustration` was missing an `imagePrompt` field. It now successfully overrides the hardcoded SVGs with stunning abstract generative art.

## 2. Unlocking Narrative Framework Diversity
- **The Issue**: Recent lessons still looked structurally identical despite the "Uniqueness Engine" built earlier.
- **The Cause / Fix**: The AI's system prompt previously contained a hardcoded "MASTER 22-BLOCK SEQUENCE" that forced the LLM into "modal collapse," ignoring dynamic Narrative Frameworks. We completely rewrote the structure block. The AI is now given the UI blocks as an unordered list of "INGREDIENTS" and explicitly commanded to shuffle and dynamically assemble the middle blocks to organically serve its assigned narrative structure (e.g. "The Mythbuster" or "The Journey").
- **Dynamic Jitter Length**: Implemented a mathematically randomized target block logic. Instead of lessons always targeting exactly 20 blocks, the engine now randomizes the length between 18 and 32 blocks based on difficulty, ensuring length is never identical.

## 3. Video Pipeline Upgrades
- **2-Column Grid Layout**: Completely refactored `VideoSnippet.tsx` away from the awkward top-heavy layout. Videos now utilize a gorgeous 12-column grid, spanning ~65% width on the left, while perfectly framing the descriptive titles and overlays on the right.
- **Enforcing Reality**: Added aggressive warnings to Rule 7, forcing the AI to acknowledge that Pexels stock video **cannot** render abstract CGI (e.g. neural networks). It is now commanded to use real-world physical analogies (like "busy city traffic") for video B-roll.
- **Dual Video Injection**: Upgraded the `course-state.ts` orchestration engine to issue **two** distinct placement coordinates per lesson. The AI must now strictly provide exactly two Pexels video snippets per lesson.

## 4. Image/Video Resolution Deduplication
- **Dynamic Deduping**: Finalised the deduplication arrays (`used_image_urls` and `video_queries_used`). The backend maintains a stateful vault across generating lessons, guaranteeing that the exact same AI image or Pexels video link is never reused twice in a course.

---

## ⏳ Next Steps for the Following Session

1. **Final Visual Victory Lap**: Generate a fresh test course to witness the `concept_illustration` utilizing Nano Banana custom renders instead of old SVGs, observing the dynamic lengths and dual video snippets.
2. **Hero Copy / Messaging**: We still need to finalize the homepage's core messaging hook (as outlined in `handover-mar-20.md`), deciding between the Persona, Reality, Clarity, or Anti-Excuse angles for the H1 text.
3. **Strategic UX/UI Competitor Analysis**: Use the prompt below to execute deep-dive research into interactive educational mechanics:

> **Elite EdTech Research Prompt for AI (Claude 3.5 Sonnet / GPT-4o):**
> **ROLE:** You are an elite EdTech Product Strategist and UX/UI Lead focusing on "micro-learning" and "interactive bite-sized education."
> **OBJECTIVE:** I am building a next-gen AI micro-learning platform. I need a deep-dive analysis of the absolute "best in the world" lessons existing across ANY discipline. Provide a structured report:
> **1.** Competitor Matrix: Identify the top 4 platforms (e.g., Brilliant, Duolingo, Maven) and explain their core psychological loop and *one* world-class UI component that feels like "magic."
> **2.** Anatomy of a Perfect Micro-Lesson: Block-by-block pacing constraint and interaction frequency rules.
> **3.** Best-in-Class Explanations: 3 specific real-world examples (e.g., Distill.pub, 3Blue1Brown) explaining complex technical concepts purely visually.
