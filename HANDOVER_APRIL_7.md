# Handover — 7 April 2026

## Session Summary

This session was entirely focused on the **Voice Engine** — making AI Bytes lesson prose feel genuinely different across lessons, rather than variations of the same underlying narrator. The session covered two major bodies of work: **Voice Engine v1** (6 conductor-driven personas) and **Voice Engine v2** (flavour matrix, opening pattern system, voice drift, signature moves). A pre-existing TypeScript cleanup across 3 files was also completed.

---

## Part 1 — Voice Engine v1: 6 Conductor Personas

### Problem Statement
Before this session, the conductor selected a `LessonPersonality` value per lesson (`calm` / `electric` / `cinematic` / `technical` / `warm` / `stark`) but the only effect was one vague line in `conductorNotes`:

```
"Lesson personality: electric — let this tone colour your word choices and visual cues"
```

This had no measurable effect on Gemini's output. All lessons read with the same voice regardless of assigned personality. There was a single global `LESSON_VOICE_GUIDE` constant applied to every lesson equally.

### Solution: VOICE_PERSONA_GUIDE
Added a `VOICE_PERSONA_GUIDE: Record<string, string>` constant in `lib/ai/agent-system-v2.ts` with a full prose-rule block for each of the 6 personalities. Each persona shares the **Three Laws of Voice** (universality test, clarity law, opening rule) as a base, then adds:

- Specific sentence rhythm rules
- Structural approach constraints
- Block-opening style examples
- Banned patterns list

| Persona | Character | Core Constraint |
|---------|-----------|-----------------|
| `calm` | Minimalist precision | 20-word sentence cap, no rhetorical questions, declarative chains only |
| `electric` | High-energy explainer | Short/long alternation, deliberate fragments, hard-stop moments |
| `cinematic` | Narrative arc | Build/payoff rhythm, before/after structure, tension → release per block |
| `technical` | Precision engineer | Premise→operation→output chains, numbers first, failure modes required |
| `warm` | Trusted mentor | Confusion anticipation, "here's the thing" moments, conversational rhythm |
| `stark` | Uncompromising clarity | 15-word sentence cap, three sentences per block, zero hedging |

### Wiring
- `expandLesson()` signature extended: added `lessonPersonality: string = 'warm'` parameter
- `processLesson()` signature extended: same parameter, forwarded to `expandLesson()`
- Prompt injection: `${LESSON_VOICE_GUIDE}` replaced with `${getPersonaVoiceGuide(lessonPersonality)}`
- `generate-v2/route.ts`: `conductorOutput.lessonPersonality ?? 'warm'` passed to `processLesson()`
- Console log added: `[LessonExpander] Lesson N — personality: X — "Lesson Title"`

### Files Changed (v1)
- `lib/ai/agent-system-v2.ts` — Added `VOICE_PERSONA_BASE`, `VOICE_PERSONA_GUIDE`, `getPersonaVoiceGuide()`, updated `expandLesson()` and `processLesson()` signatures, replaced static voice guide injection with dynamic call
- `app/api/course/generate-v2/route.ts` — Added `conductorOutput.lessonPersonality ?? 'warm'` to `processLesson()` call

---

## Part 2 — Voice Engine v2: Flavour Matrix + Opening System + Drift + Signatures

### Problem Statement (from user feedback after v1)
Even with 6 personas, the system was:
- **Deterministic → predictable → flattening**: same persona always produced the same feel
- **No intra-persona variation**: `cinematic` always sounded like the same narrator
- **No opening diversity**: lessons could start with the same pattern repeatedly
- **No voice drift**: each lesson was locked to one register from block 1 to block N

### Solution Architecture

#### 2a. Persona Flavour Matrix (24 configurations)
Replaced the flat `VOICE_PERSONA_GUIDE: Record<string, string>` with a structured `PERSONA_FLAVOURS: Record<string, PersonaFlavour[]>` where each personality has **4 sub-flavours**. The active flavour is selected by `microVariationSeed % 4` — a deterministic integer the conductor already computed per lesson from position data.

**Interface:**
```typescript
interface PersonaFlavour {
    name: string;
    rhythm: string;      // Sentence length, pacing, structural bias
    structure: string;   // Block-level organisation approach
    signatureMove: string; // One named structural pattern to use once per lesson
}
```

**Full flavour matrix (6 × 4 = 24 configurations):**

| Persona | Flavour 0 | Flavour 1 | Flavour 2 | Flavour 3 |
|---------|-----------|-----------|-----------|-----------|
| calm | Minimal | Analytical | Sequential | Interrogative |
| electric | Contrast | Stakes | Momentum | Surprise |
| cinematic | Epic | Intimate | Documentary | Dramatic |
| technical | Code-First | Systems | Debugging | Quantitative |
| warm | Empathetic | Practical | Discovery | Affirming |
| stark | Assertion | Correction | Deconstruction | Compressed |

Each flavour has a distinct:
- Sentence rhythm rule (e.g., Momentum: "Build like a wave. Short. Slightly longer. Then the insight. Then stop.")
- Structural approach (e.g., Debugging: "Assume something is going wrong. What breaks? How detected? Error conditions teach more than success paths.")
- Signature move (e.g., Documentary: "Once per lesson, open a block with a specific documented event, date, or statistic that directly demonstrates this concept.")

#### 2b. Opening Pattern System — Anti-Repeat Enforced
Added a system that mandates what structural pattern the **first sentence of the hook block** must use, tracked across lessons to prevent consecutive repetition.

**5 opening types:**
| Type | Mandate |
|------|---------|
| `question` | Single direct question unanswerable without this lesson's knowledge. Second sentence answers immediately. |
| `contradiction` | State something the learner believes. Second sentence directly contradicts it. |
| `scenario` | Place learner in a specific, concrete real operational situation. |
| `stat` | Lead with a specific verifiable number that illustrates this concept's scale or importance. |
| `bold_claim` | Blunt confident assertion specific enough a knowledgeable person would debate it. |

**Anti-repeat mechanism:**
- `ConductorMemory` extended: added `recentOpeningTypes: OpeningType[]`
- `computeOpeningType(ctx, memory)` selects from the pool of types not used in the last 2 lessons
- `updateConductorMemory()` extended to accept and track `usedOpeningType`
- `ConductorOutput` extended: added `openingType: OpeningType` field

**Injection:** `OPENING_TYPE_INSTRUCTIONS: Record<string, string>` — detailed mandate with examples per opening type, injected into the voice guide via `getPersonaVoiceGuide(personality, seed, openingType)`

#### 2c. Voice Drift — 3-Phase Register Shift
Instead of one persona locked across all blocks, each lesson now gets a **3-phase register shift** directive:
- **Opening phase** (hook, prediction): one register
- **Core phase** (explanation, process, contrast): a different register
- **Closing phase** (mental_checkpoint, recap, completion): a closing register

This is computed in `buildConductorNotes()` via `buildDriftInstruction(personality, arcType)` and injected into `conductorNotes` as an explicit block-position instruction that Gemini can follow.

**Drift companion map (per primary persona):**
```typescript
const DRIFT_COMPANIONS: Record<LessonPersonality, [string, string, string]> = {
    calm:      ['stark',     'calm',      'warm'],
    electric:  ['electric',  'technical', 'warm'],
    cinematic: ['cinematic', 'technical', 'cinematic'],
    technical: ['stark',     'technical', 'warm'],
    warm:      ['warm',      'calm',      'warm'],
    stark:     ['stark',     'technical', 'calm'],
};
```

**Arc type overrides** (applied to opening phase):
- `tension_first` → overrides opening to `electric`
- `exploratory` → overrides opening to `cinematic`

If the drift would produce no meaningful shift (all phases identical), the instruction is suppressed.

#### 2d. Signature Moves
Each of the 24 flavour variants has a named structural pattern (`signatureMove`) that the generator is instructed to use **exactly once per lesson**. These are identity fingerprints — recognisable patterns that make a persona distinct and memorable:

Examples:
- `calm/Sequential` → **CHAIN MOVE**: Trace a complete cause-and-effect chain from first input to final output, one step per sentence
- `electric/Contrast` → **FLIP MOVE**: "Not this. [Short sentence]. That. [Longer explanation]."
- `cinematic/Dramatic` → **BEFORE/AFTER MOVE**: "[Before this existed]: X. [After it existed]: Y. [The difference]: Z."
- `technical/Systems` → **SYSTEM MAP MOVE**: "Input: X. Process: Y. Output: Z. Fails when: W."
- `warm/Empathetic` → **"HERE'S THE THING" MOVE**: Exactly that phrase, followed by the real understanding
- `stark/Compressed` → **COMPRESSION MOVE**: The single most important idea of this lesson in 10 words or fewer

### Updated Function Signatures

**`expandLesson()`** (lib/ai/agent-system-v2.ts):
```typescript
async expandLesson(
    lesson, moduleContext, courseContext,
    retrievedChunks = [], lessonNumber = 1,
    courseState = null, dnaContent = null,
    rhythmDirective = '',
    lessonPersonality = 'warm',
    microVariationSeed = 0,        // NEW
    openingType = 'bold_claim'     // NEW
): Promise<ConceptExplanation>
```

**`processLesson()`** (same file, orchestrator wrapper):
```typescript
async processLesson(
    lessonPlan, moduleContext, courseContext,
    lessonNumber = 1, courseState = null,
    dnaContent = null, rhythmDirective = '',
    lessonPersonality = 'warm',
    microVariationSeed = 0,        // NEW
    openingType = 'bold_claim'     // NEW
): Promise<ConceptExplanation>
```

**`updateConductorMemory()`** (lib/ai/conductor/index.ts):
```typescript
function updateConductorMemory(
    memory: ConductorMemory,
    generatedBlockTypes: string[],
    firedSignatureMomentType: SignatureMomentType | null,
    usedOpeningType?: OpeningType  // NEW
): void
```

### Files Changed (v2)

#### `lib/ai/conductor/types.ts`
- Added `OpeningType = 'question' | 'contradiction' | 'scenario' | 'stat' | 'bold_claim'`
- Added `recentOpeningTypes: OpeningType[]` to `ConductorMemory`
- Added `openingType: OpeningType` to `ConductorOutput`

#### `lib/ai/conductor/index.ts`
- Added import for `LessonPersonality`, `OpeningType`
- Added `ALL_OPENING_TYPES` constant
- Added `computeOpeningType(ctx, memory): OpeningType` — picks from pool excluding last 2 used
- Added `DRIFT_COMPANIONS: Record<LessonPersonality, [string, string, string]>` — 3-phase drift map
- Added `ARC_OPENING_OVERRIDES: Partial<Record<ArcType, string>>` — arc type can override opening phase
- Added `buildDriftInstruction(personality, arcType): string` — generates the 3-phase directive
- Updated `buildConductorNotes()` — injects drift instruction + opening type mandate
- Updated conductor notes line to reference voice persona section, not be the sole personality note
- Updated `conduct()` — computes `openingType`, includes in `partial` and output
- Updated `updateConductorMemory()` — accepts and tracks `usedOpeningType`

#### `lib/ai/agent-system-v2.ts`
- Replaced `VOICE_PERSONA_GUIDE: Record<string, string>` with:
  - `interface PersonaFlavour` — typed flavour shape
  - `PERSONA_FLAVOURS: Record<string, PersonaFlavour[]>` — 24 entries (6 × 4)
  - `OPENING_TYPE_INSTRUCTIONS: Record<string, string>` — 5 mandate strings with examples
- Rewrote `getPersonaVoiceGuide(personality, seed, openingType)` — now takes 3 params, selects flavour by `seed % 4`, assembles full voice block
- Updated `expandLesson()` signature — added `microVariationSeed`, `openingType`
- Updated `processLesson()` signature — forwarded both to `expandLesson()`
- Updated console log: now shows `[LessonExpander] Lesson N — personality/FlavourName — opening: type — seed: N — "Title"`

#### `app/api/course/generate-v2/route.ts`
- `ConductorMemory` initialisation: added `recentOpeningTypes: []`
- Per-lesson `conductorCtx.memory` snapshot: added `recentOpeningTypes: [...(conductorMemory.recentOpeningTypes ?? [])]`
- `processLesson()` call: added `conductorOutput.microVariationSeed ?? 0` and `conductorOutput.openingType ?? 'bold_claim'`
- `updateConductorMemory()` call: added `conductorOutput.openingType`

---

## Part 3 — TypeScript Cleanup (Pre-Existing Errors)

Three pre-existing type errors in non-voice files were fixed to achieve a fully clean typecheck.

### `app/api/admin/generate/full/route.ts` (2 errors fixed)
`imageService.fetchImages()` signature is `(prompts: { prompt: string, domain?: string }[])` — the old v1 route was passing plain `string[]`.

**Line 71** — single topic thumbnail:
```typescript
// Before (broken):
const topicImages = await imageService.fetchImages([topic.title + " abstract technology"]);
// After:
const topicImages = await imageService.fetchImages([{ prompt: topic.title + " abstract technology" }]);
```

**Line 103** — lesson image prompts:
```typescript
// Before (broken):
const imagePromptsToFetch = lessonContent.metadata?.imagePrompts || [];
const images = await imageService.fetchImages(imagePromptsToFetch);
// After:
const rawImagePrompts: string[] = lessonContent.metadata?.imagePrompts || [];
const imagePromptsToFetch = rawImagePrompts.map((p: string) => ({ prompt: p }));
const images = await imageService.fetchImages(imagePromptsToFetch);
```

### `app/api/admin/lessons/regenerate/route.ts` (2 errors fixed)
`kieVideoService.generateVideo()` only accepts `(prompt: string)` — 1 argument. The route was passing a second string as a label (never part of the Kie service API).

**Line 102** — video type regen:
```typescript
// Before: await kieVideoService.generateVideo(videoPrompt, `Regen: ${lesson.title}`);
// After:
const kieResult = await kieVideoService.generateVideo(videoPrompt);
```

**Line 122** — video_block type regen:
```typescript
// Before: await kieVideoService.generateVideo(block.videoPrompt, block.caption || lesson.title);
// After:
const kieResult = await kieVideoService.generateVideo(block.videoPrompt);
```

### TypeCheck Result
```
npx tsc --noEmit --skipLibCheck
```
Zero errors in all actively maintained files. The only remaining excluded files are pre-existing dead code: `test-veo/route.ts` (deleted route), `diagnostics/video-apis/route.ts` (missing module), `heal_3568_standalone.ts` (one-off script), `veo-video-service.ts` (missing import), `progress-tracker.ts` (legacy util).

---

## What the Voice Engine Now Produces Per Lesson

When a lesson generates, the console logs:
```
[LessonExpander] Lesson 4 — cinematic/Documentary — opening: stat — seed: 47 — "How Attention Works"
```

The Gemini prompt now contains, in order:
1. **Conductor notes** — arc type, beat sequence, drift directive, opening type mandate
2. **Universal Lesson Spec v1.0** — 9-step pedagogical sequence
3. **SYSTEM block** — lesson metadata, DNA personality, tone register, blueprint
4. **Voice persona block** — e.g., "LESSON VOICE — PERSONA: CINEMATIC / DOCUMENTARY" with specific rhythm, structure, signature move, and opening type instruction
5. All existing quality rules (SECTION_PURPOSE_RULES, LESSON_QUALITY_RULES, BANNED_WORDS_INSTRUCTION)

This gives a lesson four simultaneous layers of voice differentiation:
- **Macro**: which of 6 personalities (set by conductor from archetype + position)
- **Micro**: which of 4 flavours within that personality (set by microVariationSeed % 4)
- **Opener**: which of 5 opening pattern types (tracked in memory, anti-repeat enforced)
- **Drift**: 3 distinct registers across opening/core/close phases

Total distinct configurations before arc type and CourseDNA variation: **6 × 4 × 5 = 120**.

---

## Pending Items (Not Started This Session)

### Amazon Polly (Bulk Audio TTS)
- The bulk module recap audio currently uses **OpenAI TTS (fable voice, model: tts-1, speed: 0.95)** as a temporary measure
- When AWS account access is restored (user opened support request for forgotten password), switch to Amazon Polly `en-GB` Neural voice
- One function to change: `generateOpenAISpeech()` in `app/api/admin/courses/generate-audio/route.ts`
- The ElevenLabs TTS routing is correct and MUST NOT change: ElevenLabs → Sterling live voice + HeyGen avatar audio only

### DB Migrations (Still Not Applied)
Two migrations are written but not applied. Run `supabase db push` before generating new courses:
- `supabase/migrations/20260329_conductor_fields.sql` — conductor DB columns
- `supabase/migrations/20260402_spec_v1_columns.sql` — Universal Lesson Spec v1.0 columns

### Duplicate "Introduction to Generative AI" Course
User's advisor flagged this as a UX credibility issue. Needs merging or renaming. Not actioned this session.

### Avatar Videos Missing on Courses 898–901
A new admin endpoint `POST /api/admin/courses/generate-avatar` was created (previous session) to re-trigger HeyGen for existing courses, and a "Generate Avatar" button was added to the admin courses dropdown. These courses still need the button clicked to actually generate their avatar videos.

### Conductor Phase 2 Gaps (Deferred)
1. 15 new block components (neural_map, cinematic_moment, signal_interrupt, time_capsule + 11 more) — signature moments fire in conductor output but blocks silently skip during render until React components are built
2. `lessonAccentIndex` (0–11 from conductor) not yet wired to block-renderer's 4-colour accent cycle
3. Full Module DNA layer (per-module hue shift)
4. `validateBlockSequence` not yet called post-generation (anti-chaos is directive only, not enforced)

---

## Key File Reference (Changed This Session)

| File | What Changed |
|------|-------------|
| `lib/ai/conductor/types.ts` | Added `OpeningType`, `recentOpeningTypes` to `ConductorMemory`, `openingType` to `ConductorOutput` |
| `lib/ai/conductor/index.ts` | Added opening type selection, voice drift map, updated `buildConductorNotes`, `conduct()`, `updateConductorMemory()` |
| `lib/ai/agent-system-v2.ts` | Replaced flat VOICE_PERSONA_GUIDE with 24-variant PERSONA_FLAVOURS + 5-type OPENING_TYPE_INSTRUCTIONS, rewrote `getPersonaVoiceGuide()`, updated `expandLesson()` and `processLesson()` signatures |
| `app/api/course/generate-v2/route.ts` | Added `recentOpeningTypes` to memory init + snapshot, passed `microVariationSeed` + `openingType` to `processLesson()`, tracked opening type in `updateConductorMemory()` |
| `app/api/admin/generate/full/route.ts` | Fixed `fetchImages()` call — wrapped string prompts as `{ prompt }` objects |
| `app/api/admin/lessons/regenerate/route.ts` | Fixed `kieVideoService.generateVideo()` — removed stale second argument from 2 call sites |

---

## Architecture Diagram (Voice Engine v2)

```
conduct(ctx)
    ├── selectPersonality(ctx)          → lessonPersonality (calm/electric/cinematic/technical/warm/stark)
    ├── computeMicroSeed(ctx)           → microVariationSeed (deterministic int)
    ├── computeOpeningType(ctx, memory) → openingType (from 5-type pool, last-2 excluded)
    └── buildConductorNotes(...)
            ├── Arc + beat sequence
            ├── buildDriftInstruction() → "Opening: electric, Core: technical, Close: warm"
            └── Opening type mandate   → "OPENING TYPE: stat — first sentence must be..."
            
expandLesson(lesson, ..., personality, seed, openingType)
    └── getPersonaVoiceGuide(personality, seed, openingType)
            ├── PERSONA_FLAVOURS[personality][seed % 4]  → specific rhythm + structure + signatureMove
            └── OPENING_TYPE_INSTRUCTIONS[openingType]   → first-sentence mandate with examples
            
updateConductorMemory(memory, blockTypes, signatureFired, openingType)
    └── memory.recentOpeningTypes.push(openingType)  → sliding window of 2
```

---

## ElevenLabs Billing State (as of this session)

- **Plan**: Creator — 100,020 chars/month
- **Renewal**: 14 April 2026
- **Overage cap**: 50,000 credits (~$15 extra maximum → ~$37/month worst case)
- **Routing (ENFORCED — do not change)**:
  - ElevenLabs → Sterling live voice responses + HeyGen avatar lip-sync audio ONLY
  - OpenAI TTS (fable, tts-1) → all bulk module recap audio (`generate-audio/route.ts`)
  - Amazon Polly (en-GB Neural) → planned replacement for OpenAI TTS when AWS access restored
