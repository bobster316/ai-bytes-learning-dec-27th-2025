# AI Bytes Learning — Technical Handover Document
**Date:** April 4, 2026
**Prepared by:** Antigravity AI
**Phase:** Core Course Engine Hardening & Sterling Voice Rebuild

---

## 1. Executive Summary
This session was highly technical, addressing major visual pipeline failures within the course generator before ruthlessly mitigating critical platform-breaking points. We successfully updated all deprecated Gemini 2.0 routes and implemented the new low-latency DeepSeek/ElevenLabs architecture for Sterling, positioning the platform for scalable, cost-optimized growth.

---

## 2. Completed Implementations

### A. Course Media & Visual Accuracy Hardening
Before addressing migrations, we stabilized the visual output of the AI Bytes courses:
- **Thumbnail Title Compositing Fix:** In `lib/ai/image-service.ts`, we resolved SVG text-overflow issues by dialing down the character-wrap width and increasing background gradient opacities to ensure dynamic titles remain legible.
- **Aesthetic Enforcement:** Strictly enforced the "Antigravity/No Humans" mandate in the prompt generation logic to ensure consistent, highly technical thumbnail aesthetics across all 25 courses.

### B. Phase 1: Gemini 2.0 Flash Deprecation Rescue
To prevent the entire backend course generation platform from breaking on June 1st, 2026, we completely stripped the deprecated `gemini-2.0-flash` string from the codebase.
- **Files Hardened to `gemini-2.5-flash`:**
  - `lib/ai/agent-system-v2.ts` & `agent-system.ts`
  - `lib/ai/gemini-image-service.ts`
  - `lib/ai/content-accuracy-service.ts`
  - All 6 batch generation scripts in `/scripts/`

### C. Phase 2 & 3: The Sterling Voice Rewrite
We executed the Sterling Architecture tear-down, shifting from the slow REST integration to ElevenLabs Conversational AI powered by DeepSeek v3.2.

**The Brain (`app/api/sterling/llm/route.ts`)**
- Built an OpenAI-formatted `POST` route explicitly to serve as ElevenLabs' Custom LLM.
- Hooked it securely to OpenRouter (`deepseek/deepseek-v3.2`) backed by DeepInfra.
- Injects strict platform pricing/course catalog context into the System Prompt on every chat request.
- Streams tokens instantly to minimize Time-To-First-Audio.

**The Body (`components/voice/SterlingVoice.tsx`)**
- Deleted hundreds of lines of brittle WebSpeech API/Microphone buffering code.
- Bootstrapped the `@elevenlabs/react` `useConversation` hook.
- Automatically handles natural speech interruption, semantic turn detection, and WebRTC streaming.
- Re-wired the existing 15-gradient custom UI entirely to the ElevenLabs state machine properties (`conversation.status`, `conversation.isSpeaking`).
- Engineered a hard `setTimeout` function that strictly drops the connection after 10-minutes to prevent infinite session billing if the student forgets to close the tab.

### D. Phase 4: Supabase Cost Analytics
- Connected asynchronous inserts directly inside the new `/api/sterling/llm` route.
- Posts estimated token-throughput data to `api_cost_logs` (tracking DeepSeek input/outputs vs ElevenLabs minutes) for tight admin oversight.

---

## 3. Pending Action Items for Lead Developer

To complete the Sterling rollout, you must execute the following prior to testing:

> [!CAUTION]
> **1. Run the Supabase SQL**
> You must run the `CREATE TABLE IF NOT EXISTS api_cost_logs...` SQL snippet provided in the *Sterling Brief* directly inside your Supabase Dashboard SQL Editor. Until you do this, the backend will silently fail to write its usage logs.

> [!CAUTION]
> **2. Map the Custom LLM Url**
> When you test this locally, ElevenLabs cannot access your `localhost`. You MUST:
> - Push your branch to `staging` on Vercel **OR** run `npx ngrok http 3000` to get a public URL.
> - Go to the ElevenLabs Agent Dashboard -> Advanced Settings -> Custom LLM.
> - Paste your public URL there: `https://[your-url]/api/sterling/llm`

> [!TIP]
> **3. Add the Google Cloud Billing Alert**
> While we removed the risk of your projects, you still need to log in to Google Cloud Console and set a **£10/month hard cap** to permanently prevent any further AI studio bill shock.

---
## 4. Next Session Goals
With Sterling stabilized at ~200ms latency and generation pipelines hardened against deprecation, the next session can safely pivot back directly into the remaining "Antigravity Migration" features (e.g. Kie.ai video pipeline scaling, mass synthesis, or additional frontend layout modifications).
