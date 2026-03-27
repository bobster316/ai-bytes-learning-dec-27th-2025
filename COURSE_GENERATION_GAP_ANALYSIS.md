# Course Generation Gap Analysis & Fix Plan

## The Core Problem

Your HTML prototype (`ai_microlesson_v2.html`) defines a **rich, multi-component lesson experience** with 12+ distinct UI elements. But your generation pipeline produces a **single markdown blob** (`topicContent`) that gets rendered through a basic markdown-to-HTML converter. The result is a wall of text with placeholder image boxes — nothing like the prototype.

---

## Side-by-Side: What the Prototype Has vs What Generation Produces

| Prototype Element | Present in Generated Output? | Root Cause |
|---|---|---|
| **Hero video block** with tutor avatar, play controls, captions | ❌ No | Not in lesson schema at all |
| **Lesson header** with tag, title (with italic emphasis), meta chips (duration, questions, XP), difficulty badge | ❌ Partially | Title exists, but no duration/XP/difficulty metadata per-lesson |
| **Learning objective card** with gradient border | ❌ No | `microObjective` exists in plan but not rendered as a card |
| **Section headings** with accent bar (`::before` pseudo-element) | ⚠️ Crude | Markdown `##` headers render but without the design treatment |
| **Body text** in Instrument Serif with styled `<strong>` | ⚠️ Wrong font | Renderer uses Inter, not the 3-font system |
| **Full-width section images** with gradient caption overlay | ❌ No | `[IMAGE: type]` markers render as dashed placeholder boxes |
| **3-column type cards** with images, colour-coded badges, hover effects | ❌ No | Not in the lesson content schema |
| **Image + text side-by-side rows** (with reverse layout variant) | ❌ No | Not in the lesson content schema |
| **Callout boxes** (tip/warning with icon, title, body) | ❌ No | Not in the lesson content schema |
| **Industry tabs** with image + scenario per industry | ❌ No | Not in the lesson content schema |
| **Interactive quiz** with image context, animated options, confidence rating, detailed feedback, XP rewards | ⚠️ Separate | Quizzes exist but rendered on a separate page, not inline |
| **Completion card** with trophy, stats, skills earned, confetti | ⚠️ Separate | Exists but disconnected from lesson flow |
| **Right sidebar**: XP card, streak, instructor, key terms accordion, notes | ❌ No | Not part of generation — these are platform chrome |
| **Left sidebar**: Module list with thumbnails, progress, lock states | ✅ Exists | Already in the platform (course navigation) |

**Verdict: The generation pipeline produces ~20% of what the prototype defines.**

---

## The 3 Gaps That Must Be Closed

### Gap 1: The Lesson Schema Is Too Flat

**Current schema** (`ConceptExplanation`):
```
topicContent: string    ← One big markdown blob
wordCount: number
topicType: string
keyTakeaway: string
imagePrompts: [...]     ← Prompts only, no actual images in content
```

**What it needs to be** (to match the prototype):
```
lessonContent: {
  heroVideo: { tutorName, tutorRole, tutorAvatar, duration, captionSequence }
  header: { tag, title, titleEmphasis, duration, questionCount, xpReward, difficulty }
  objective: { text, strongPhrases[] }
  sections: [
    {
      type: "text" | "image_full" | "image_text_row" | "type_cards" | "callout" | "industry_tabs"
      heading?: string
      body?: string          ← Short paragraph, not essay
      image?: { url, caption, captionHighlight }
      cards?: [{ title, description, badge, badgeColour, imagePrompt }]
      callout?: { type: "tip" | "warning", icon, title, body }
      industryTabs?: [{ id, label, imagePrompt, imageCaption, title, icon, body, highlight }]
      imageTextRow?: { imagePrompt, imageAlt, label, title, text, reverse: boolean }
    }
  ]
  quiz: {
    questions: [{
      questionNumber, totalQuestions,
      imageContext?: { imagePrompt, imageAlt, scenarioLabel, scenarioHighlight },
      questionText, questionEmphasis?,
      options: [{ letter, text, isCorrect }],
      correctFeedback: { explanation },
      incorrectFeedback: { explanation },
      xpReward
    }]
  }
  completion: { title, subtitle, xpTotal, skillsEarned[], nextModuleTitle }
  keyTerms: [{ term, definition }]
}
```

### Gap 2: The Generator Prompt Asks for the Wrong Thing

**Current prompt asks for:**
> "800+ words of markdown with 4 `[IMAGE: type]` markers"

**It should ask for:**
> "A structured JSON lesson object with distinct content blocks matching a component schema — NOT a markdown essay"

The generator should produce a **structured content array**, not prose. Each block maps 1:1 to a React component. The renderer then simply iterates through blocks and renders the matching component.

### Gap 3: The Renderer Is a Markdown Parser, Not a Component Renderer

**Current renderer** (`lesson-renderer-v2.ts`):
- Receives one big markdown string
- Splits by `\n`, detects `##`, `-`, `[IMAGE:]`
- Produces basic HTML paragraphs and headers
- Image markers become dashed placeholder boxes

**What it should be:**
- Receives a structured JSON array of content blocks
- Each block has a `type` field
- A React component mapper renders the correct component for each type
- Images are real (generated during the pipeline), not placeholders

---

## The Fix: New Content Block Architecture

### Step 1: Define the Content Block Schema

Create a new file: `lib/types/lesson-blocks.ts`

```typescript
// Every lesson is an ordered array of these blocks
export type ContentBlock =
  | HeroVideoBlock
  | LessonHeaderBlock
  | ObjectiveBlock
  | TextBlock
  | FullImageBlock
  | ImageTextRowBlock
  | TypeCardsBlock
  | CalloutBlock
  | IndustryTabsBlock
  | QuizBlock
  | CompletionBlock
  | KeyTermsBlock;

interface BaseBlock {
  id: string;        // e.g., "blk_001"
  order: number;
}

export interface HeroVideoBlock extends BaseBlock {
  type: "hero_video";
  tutorName: string;
  tutorRole: string;
  tutorAvatarUrl: string;
  backgroundImagePrompt: string;
  backgroundImageUrl?: string;    // Filled after image generation
  duration: string;               // e.g., "45s intro"
  captionSequence: string[];
}

export interface LessonHeaderBlock extends BaseBlock {
  type: "lesson_header";
  moduleTag: string;              // e.g., "Module 3 · Foundations of AI"
  title: string;                  // e.g., "How Machines"
  titleEmphasis: string;          // e.g., "Actually"  (rendered in italic serif)
  titleSuffix: string;            // e.g., "Learn"
  duration: string;
  questionCount: number;
  xpReward: number;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
}

export interface ObjectiveBlock extends BaseBlock {
  type: "objective";
  label: string;                  // e.g., "Learning Objective"
  text: string;                   // Full text with **bold** markers for strong
}

export interface TextBlock extends BaseBlock {
  type: "text";
  heading?: string;
  paragraphs: string[];           // Each paragraph is 2-3 sentences MAX
}

export interface FullImageBlock extends BaseBlock {
  type: "full_image";
  imagePrompt: string;
  imageUrl?: string;              // Filled after generation
  imageAlt: string;
  caption: string;
  captionHighlight?: string;      // Rendered in accent colour
}

export interface ImageTextRowBlock extends BaseBlock {
  type: "image_text_row";
  imagePrompt: string;
  imageUrl?: string;
  imageAlt: string;
  label: string;                  // e.g., "The Human Parallel"
  title: string;
  text: string;
  reverse: boolean;               // Flip image/text sides
}

export interface TypeCardsBlock extends BaseBlock {
  type: "type_cards";
  cards: Array<{
    title: string;
    description: string;
    badge: string;                // e.g., "Supervised"
    badgeColour: "pulse" | "iris" | "amber";
    icon: string;
    imagePrompt: string;
    imageUrl?: string;
  }>;
}

export interface CalloutBlock extends BaseBlock {
  type: "callout";
  variant: "tip" | "warning";
  icon: string;
  title: string;
  body: string;
}

export interface IndustryTabsBlock extends BaseBlock {
  type: "industry_tabs";
  heading: string;
  introText: string;
  tabs: Array<{
    id: string;
    label: string;
    icon: string;
    imagePrompt: string;
    imageUrl?: string;
    imageCaption: string;
    scenarioTitle: string;
    scenarioBody: string;         // Can include <mark> tags for highlights
  }>;
}

export interface QuizBlock extends BaseBlock {
  type: "quiz";
  title: string;
  questions: Array<{
    questionNumber: number;
    totalQuestions: number;
    imageContext?: {
      imagePrompt: string;
      imageUrl?: string;
      scenarioLabel: string;
      scenarioHighlight: string;
    };
    questionText: string;
    questionEmphasis?: string;    // Italic serif word in the question
    options: Array<{
      letter: string;
      text: string;
      isCorrect: boolean;
    }>;
    correctFeedback: string;
    incorrectFeedback: string;
    xpReward: number;
  }>;
}

export interface CompletionBlock extends BaseBlock {
  type: "completion";
  title: string;
  subtitle: string;
  xpTotal: number;
  skillsEarned: Array<{
    label: string;
    colour: "pulse" | "iris" | "amber";
  }>;
  nextModuleTitle: string;
  nextModuleAction: string;
}

export interface KeyTermsBlock extends BaseBlock {
  type: "key_terms";
  terms: Array<{
    term: string;
    definition: string;
  }>;
}
```

### Step 2: Update the Generator Prompt

The lesson expander prompt must ask for this block structure, not markdown. Here is the core of the new prompt:

```
SYSTEM: You are an elite instructional designer. Produce a SINGLE LESSON 
as a structured JSON array of content blocks.

CRITICAL: Do NOT produce a markdown essay. Produce an array of typed blocks 
that map directly to UI components. The lesson should feel like an interactive 
magazine, NOT a textbook.

BLOCK TYPES AVAILABLE (use a mix — variety is key):
- "text": Short prose section (2-3 sentence paragraphs, heading optional)
- "full_image": Full-width image with caption
- "image_text_row": Side-by-side image + text (use reverse:true to alternate)
- "type_cards": 2-3 cards for comparing concepts (e.g., types of ML)
- "callout": Tip or warning box with icon
- "industry_tabs": Tabbed real-world examples across industries
- "quiz": Inline knowledge check (2-3 questions with image context)
- "key_terms": Glossary of 4-6 terms introduced in the lesson
- "objective": Learning objective statement
- "completion": End-of-lesson celebration with XP and skills

STRUCTURE RULES:
1. Start with objective block
2. Open with a "text" block that hooks the reader (analogy, question, scenario)
3. Use a "full_image" after the hook
4. Alternate between text, image_text_row, and type_cards for the core teaching
5. Include at least 1 "callout" (tip or warning) 
6. Include 1 "industry_tabs" block showing real-world applications
7. End with "quiz" (3 questions), then "key_terms", then "completion"
8. Total: 12-18 blocks per lesson
9. NO block should have more than 3 sentences of body text
10. Every image prompt must be specific and cinematic (no generic stock photos)

OUTPUT: Return ONLY a JSON object:
{
  "blocks": [ ...array of ContentBlock objects... ],
  "metadata": { "blockCount": number, "estimatedDuration": number }
}
```

### Step 3: Build a Block Renderer (React)

Instead of the current `lesson-renderer-v2.ts` (markdown parser), build a React component that maps block types to components:

```typescript
// components/course/block-renderer.tsx
import { ContentBlock } from "@/lib/types/lesson-blocks";

const BLOCK_COMPONENTS = {
  hero_video: HeroVideoBlock,
  lesson_header: LessonHeaderBlock,
  objective: ObjectiveBlock,
  text: TextSection,
  full_image: FullImageSection,
  image_text_row: ImageTextRow,
  type_cards: TypeCards,
  callout: CalloutBox,
  industry_tabs: IndustryTabs,
  quiz: InlineQuiz,
  completion: CompletionCard,
  key_terms: KeyTermsAccordion,
};

export function LessonBlockRenderer({ blocks }: { blocks: ContentBlock[] }) {
  return (
    <div className="lesson-content">
      {blocks
        .sort((a, b) => a.order - b.order)
        .map((block) => {
          const Component = BLOCK_COMPONENTS[block.type];
          if (!Component) return null;
          return <Component key={block.id} {...block} />;
        })}
    </div>
  );
}
```

Each component (TextSection, TypeCards, CalloutBox, etc.) is a direct port of the corresponding HTML/CSS from the prototype.

### Step 4: Image Generation in the Pipeline

Currently images are just prompts stored as strings. The pipeline should:

1. **Generator** produces blocks with `imagePrompt` fields
2. **Orchestrator** extracts all imagePrompt fields from all blocks
3. **Image service** generates images in parallel (using Gemini/Replicate/Unsplash)
4. **Orchestrator** writes `imageUrl` back into each block
5. **Result** stored in database has blocks with real image URLs

### Step 5: Update the Database Schema

Add a `content_blocks` JSONB column to `course_lessons`:

```sql
ALTER TABLE course_lessons
ADD COLUMN content_blocks JSONB DEFAULT '[]'::jsonb;

-- Optionally keep content_markdown for backwards compatibility
-- New lessons use content_blocks; old lessons fall back to content_markdown
```

---

## Implementation Priority

| Priority | Task | Effort | Impact |
|---|---|---|---|
| 🔴 P0 | Define ContentBlock types (`lib/types/lesson-blocks.ts`) | 2 hours | Foundation for everything |
| 🔴 P0 | Rewrite lesson expander prompt to produce blocks, not markdown | 4 hours | Fixes the generation gap |
| 🔴 P0 | Build `LessonBlockRenderer` component with 5 core block types (text, full_image, callout, type_cards, quiz) | 8 hours | Visual transformation |
| 🟠 P1 | Port prototype CSS into block components (preserve the SYNAPSE aesthetic) | 6 hours | Premium look and feel |
| 🟠 P1 | Image generation pipeline (prompt → URL in blocks) | 4 hours | Real images, not placeholders |
| 🟠 P1 | Add `content_blocks` JSONB column + migration | 1 hour | Data persistence |
| 🟡 P2 | Build remaining block components (industry_tabs, image_text_row, key_terms, completion) | 6 hours | Full prototype parity |
| 🟡 P2 | Evaluator agent updated to check block structure, not markdown | 3 hours | Quality gates |
| 🟢 P3 | Backwards compatibility: render old markdown lessons with fallback | 2 hours | Don't break existing courses |

**Total estimated effort: ~36 hours of focused work to reach prototype parity.**

---

## What NOT to Change

- ✅ Keep the manifest-first architecture (V2 orchestrator)
- ✅ Keep the 3-agent pattern (Planner → Expander → Evaluator)
- ✅ Keep the Gemini API integration
- ✅ Keep Pinecone/VoyageAI RAG pipeline
- ✅ Keep the retry/repair logic
- ✅ Keep the existing database structure (just add the JSONB column)

The fix is surgical: change what the generator **asks for** (blocks not markdown), change what the renderer **expects** (blocks not markdown), and port the prototype's visual components into React.
