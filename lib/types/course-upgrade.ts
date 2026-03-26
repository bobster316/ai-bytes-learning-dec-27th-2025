import { ContentBlock } from './lesson-blocks';
import { z } from 'zod';

export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export interface CourseGenerationInput {
    courseName: string;
    courseDescription?: string;
    difficultyLevel: DifficultyLevel;
    targetDuration: number;
    userContext?: {
        priorKnowledge?: string[];
        learningGoals?: string[];
        preferredLearningStyle?: string;
    };
    // Testing & Structure Overrides
    testMode?: boolean;
    topicCount?: number;
    lessonsPerTopic?: number;
}

export interface CourseStructure {
    refinedCourseTitle?: string;
    isMicro?: boolean;
    courseOutcome?: string;
    courseMetadata: {
        category?: string;
        description?: string;
        estimatedComplexity: number;
        recommendedPrerequisites: string[];
        learningObjectives: string[];
        practicalOutcomes: string[];
        seo?: {
            title: string;
            description: string;
            keywords: string[];
            slug: string;
        };
        thumbnailPrompt?: string;
    };
    introVideoScript?: VideoScript;
    topics: TopicPlan[];
}

export interface TopicPlan {
    topicName: string;
    topicOrder: number;
    description: string;
    learningOutcomes: string[];
    estimatedDuration: number;
    topicType: 'foundational' | 'core' | 'advanced' | 'specialized';
    lessons: LessonPlan[];
    introVideoScript?: VideoScript;
    introVideoUrl?: string;
    moduleImagePrompt?: string;
    moduleSynthesis?: string;
    visualAids?: string[];
}

export interface LessonPlan {
    lessonTitle: string;
    lessonOrder: number;
    microObjective?: string;
    lessonAction?: string;
    learningObjectives: string[];
    keyConceptsToCover: string[];
    prerequisites: string[];
    estimatedDifficulty: number;
    estimatedDuration: number;
    practicalApplications: string[];
    imagePrompts?: string[];
    visualAids?: string[];
}

export interface ConceptExplanation {
    blocks: ContentBlock[];
    metadata: {
        blockCount: number;
        estimatedDuration: number;
    };
    topicType: 'foundation' | 'application';
    keyTakeaway: string;
    humanVoiceSignature: string;
    discussionPrompt: string;
    nextTopicTeaser: string;
}

export interface CodeImplementation {
    introductionExample: {
        title: string;
        description: string;
        code: string;
        expectedOutput: string;
        keyTakeaways: string[];
    };
    guidedImplementation: {
        title: string;
        description: string;
        steps: Array<{
            stepNumber: number;
            explanation: string;
            code: string;
            output: string;
        }>;
    };
    practicalChallenge: {
        title: string;
        scenario: string;
        starterCode: string;
        testCases: any[];
        hints: string[];
        solution: string;
        learningObjective: string;
    };
    dependencies: {
        packages: string[];
        systemRequirements: string[];
    };
}

export interface VisualizationSpec {
    title: string;
    purpose: string;
    type: 'architecture' | 'flowchart' | 'network' | 'comparison' | 'timeline' | 'dataflow' | 'custom';
    interactive: boolean;
    mermaidCode?: string;
    customSpec?: any;
    placementSuggestion: string;
}

export interface AssessmentSuite {
    moduleNumber: number;
    moduleTitle: string;
    totalQuestions: number;
    passingScore: number;
    questions: Array<{
        questionNumber: number;
        questionType: 'multiple_choice' | 'true_false' | 'scenario';
        questionText: string;
        options: Array<{ letter: string; text: string }>;
        correctAnswer: string;
        correctFeedback: string;
        incorrectFeedback: string;
        topicReference: string;
        difficultyRationale: string;
        cognitiveLevel?: 'Recall' | 'Comprehension' | 'Application' | 'Analysis' | 'Evaluation';
        timeLimit?: number;
        learningObjective?: string;
    }>;
    moduleActionItem: {
        instruction: string;
        estimatedTime: string;
        deliverable: string;
        sharePrompt: string;
    };
}

export interface VideoScript {
    hook: { duration: number; script: string; visualCues: string[] };
    context: { duration: number; script: string; visualCues: string[] };
    coreContent: {
        duration: number;
        segments: Array<{
            title: string;
            duration: number;
            script: string;
            visualCues: string[];
            codeSegments: string[];
        }>;
    };
    demonstration: { duration: number; script: string; codeToShow: string; visualCues: string[] };
    recap: { duration: number; script: string; keyPoints: string[] };
    transition: { duration: number; script: string };
    totalDuration: number;
    pronunciationGuide: Record<string, string>;
}

export interface CompletedLesson {
    lessonTitle: string;
    contentBlocks: ContentBlock[];
    videoScript: VideoScript;
    metadata: {
        estimatedDuration: number;
        wordCount: number;
        technicalDepthScore: number;
        readabilityScore: number;
        keyTakeaways?: string[];
    };
    qualityScore?: {
        repairCount: number;
        repairedFields: string[];
        generationTimeMs: number;
    };
    pipelineVersion?: string;
    content: ConceptExplanation;
    imagePrompts?: string[];
}


export interface CompleteCourse {
    courseStructure: CourseStructure;
    lessons: CompletedLesson[];
    assessments: any[];
    pipelineVersion?: string;
}

// ─── CourseDNA ────────────────────────────────────────────────────────────────

export interface CourseDNA {
    dna_version: 1;
    content: {
        archetype_id:  string;
        writing_style: string;
        example_bias:  "real_world_first" | "theory_first" | "analogy_first";
        question_tone: "socratic" | "direct_challenge" | "reflective";
    };
    render: {
        palette_id:       string;
        primary_colour:   string;
        secondary_colour: string;
        surface_colour:   string;
        image_aesthetic:  "photorealistic" | "abstract_gradient" | "flat_illustration" | "technical_diagram";
        bg_treatment:     "dark_mesh" | "grain_texture" | "subtle_grid" | "clean_flat";
        typography:       "classic_serif" | "modern_sans" | "editorial_contrast";
        layout_density:   "tight" | "balanced" | "spacious";
        section_divider:  "thin_rule" | "bold_number" | "dot_row";
    };
}

/** Named alias — makes it explicit that DB column reads are `unknown` until validated */
export type RawCourseDNA = unknown;

/** Zod schema — mirrors CourseDNA exactly; z.literal(1) for future discriminated-union migration */
export const CourseDNASchema = z.object({
    dna_version: z.literal(1),
    content: z.object({
        archetype_id:  z.string(),
        writing_style: z.string(),
        example_bias:  z.enum(["real_world_first", "theory_first", "analogy_first"]),
        question_tone: z.enum(["socratic", "direct_challenge", "reflective"]),
    }),
    render: z.object({
        palette_id:       z.string(),
        primary_colour:   z.string(),
        secondary_colour: z.string(),
        surface_colour:   z.string(),
        image_aesthetic:  z.enum(["photorealistic", "abstract_gradient", "flat_illustration", "technical_diagram"]),
        bg_treatment:     z.enum(["dark_mesh", "grain_texture", "subtle_grid", "clean_flat"]),
        typography:       z.enum(["classic_serif", "modern_sans", "editorial_contrast"]),
        layout_density:   z.enum(["tight", "balanced", "spacious"]),
        section_divider:  z.enum(["thin_rule", "bold_number", "dot_row"]),
    }),
});
