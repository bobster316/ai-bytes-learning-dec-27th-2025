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
    | KeyTermsBlock
    | InteractiveVisBlock
    | AppliedCaseBlock
    | RecapBlock
    | ExpandableBlock
    | VideoSnippetBlock
    | AudioRecapProminentBlock
    | PunchQuoteBlock
    | PredictionBlock
    | MindmapBlock
    | FlowDiagramBlock
    | ConceptIllustrationBlock
    | OpenExerciseBlock
    | InstructorInsightBlock;

interface BaseBlock {
    id: string;        // e.g., "blk_001"
    order: number;
    conceptVideos?: any[]; // Phase 3: Targeted micro-videos for this specific block
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
    layout?: "bento" | "grid" | "horizontal" | "numbered"; // default: "bento"
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
        questionType?: "multiple_choice" | "true_false" | "fill_in_blank";
        imageContext?: {
            imagePrompt: string;
            imageUrl?: string;
            scenarioLabel: string;
            scenarioHighlight: string;
        };
        questionText: string;
        blankContext?: string;        // Used for fill_in_blank questions
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

export interface InteractiveVisBlock extends BaseBlock {
    type: "interactive_vis";
    title: string;
    intro?: string;        // Optional context/instructions at the top
    description: string;   // Revealed "Analysis Result"
    codeSnippet?: string;  // Optional code/JSON representation
    vizType: "chart" | "flowchart" | "architecture";
}

export interface AppliedCaseBlock extends BaseBlock {
    type: "applied_case";
    scenario: string;
    challenge: string;
    resolution: string;
    imagePrompt?: string; // Optional visual context
    imageUrl?: string;
}

export interface RecapBlock extends BaseBlock {
    type: "recap";
    style?: "card" | "minimal" | "striped"; // default: "card"
    title: string;          // Usually "If you remember only three things..."
    points: string[];       // Exactly 3 bullet points
}

export interface ExpandableBlock extends BaseBlock {
    type: "go_deeper";
    triggerText: string;    // e.g. "Go deeper: The math behind it"
    content: string;        // The expandable detailed text
}

export interface VideoSnippetBlock extends BaseBlock {
    type: "video_snippet";
    title: string;             // e.g. "Visual Insight: Neural Network Training"
    videoPrompt: string;       // Veo 3.1 prompt for video generation
    videoUrl?: string;         // Filled after Veo generation (uploaded to Supabase Storage)
    caption: string;           // Short description
    duration?: number;         // 8 (seconds) — default 8s
}

export interface AudioRecapProminentBlock extends BaseBlock {
    type: "audio_recap_prominent";
    audioUrl: string;
}

export interface PunchQuoteBlock extends BaseBlock {
    type: "punch_quote";
    quote: string;               // Bold statement, 1-2 sentences, max ~20 words
    attribution?: string;        // Optional source or context label
    accent: "pulse" | "iris" | "amber" | "nova";
}

export interface PredictionBlock extends BaseBlock {
    type: "prediction";
    question: string;            // The "what do you think?" question
    options: [string, string, string]; // Exactly 3 options
    correctIndex: 0 | 1 | 2;
    reveal: string;              // Full explanation shown after answering
    accentColour?: "pulse" | "iris" | "amber";
}

export interface MindmapBlock extends BaseBlock {
    type: "mindmap";
    centralNode: string;         // Label for the centre node (max ~12 chars)
    branches: Array<{
        label: string;           // Branch node label (max ~14 chars)
        description: string;     // Short descriptor shown inside node (max ~20 chars)
        colour: "pulse" | "iris" | "amber" | "nova";
    }>;                          // 3–6 branches
}

export interface FlowDiagramBlock extends BaseBlock {
    type: "flow_diagram";
    title?: string;
    // Simple linear flow
    steps?: Array<{
        label: string;
        description?: string;
        colour?: "pulse" | "iris" | "amber" | "nova" | "default";
    }>;
    // Optional: contrast two paths through same middle node
    contrast?: {
        labelA: string;          // e.g. "Vague Prompt"
        labelB: string;          // e.g. "Structured Prompt"
        stepsA: Array<{ label: string; colour?: "nova" | "amber" }>;
        stepsB: Array<{ label: string; colour?: "pulse" | "iris" }>;
        middleNode: string;      // e.g. "AI Model"
        outcomeA: string;
        outcomeB: string;
    };
}

export interface ConceptIllustrationBlock extends BaseBlock {
    type: "concept_illustration";
    concept: string;             // Main concept name
    description: string;         // 1-sentence explanation
    style: "network" | "layers" | "cycle" | "hierarchy";
}

export interface OpenExerciseBlock extends BaseBlock {
    type: "open_exercise";
    instruction: string;          // e.g. "Rewrite this weak prompt using the 4-part framework"
    weakPrompt: string;           // The bad example they need to improve
    scaffoldLabels: [string, string, string, string]; // e.g. ["Role", "Context", "Task", "Format"]
    modelAnswer: string;          // Full model answer revealed after submission
    accentColour?: "pulse" | "iris" | "amber";
}

export interface InstructorInsightBlock extends BaseBlock {
    type: "instructor_insight";
    heading?: string;             // e.g. "Instructor Insight"
    videoUrl?: string;            // Veo-generated contextual clip (optional, generated async)
    insights: Array<{
        emoji: string;            // e.g. "🧠"
        title: string;            // Bold heading for the insight card
        body: string;             // 1-2 sentence explanation
    }>;
}
