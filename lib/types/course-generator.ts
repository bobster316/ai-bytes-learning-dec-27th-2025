
export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

// DB Types
export type GenerationStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type DatabaseInsert<T> = T;

export interface GenerationStatusResponse {
    success?: boolean;
    message?: string;
    generationId: string;
    status: GenerationStatus;
    progress: {
        currentStep: string;
        stepsCompleted: number;
        totalSteps: number;
        percentComplete: number;
    };
    courseId?: string;
    error?: string;
}


export interface CourseTopic {
    id?: string;
    course_id: string;
    title: string;
    description: string;
    order_index: number;
    estimated_duration_minutes: number;
    learning_objectives: string[];
    thumbnail_url?: string;
    created_at?: string;
}

export interface CourseLesson {
    id?: string;
    topic_id: string;
    title: string;
    order_index: number;
    estimated_duration_minutes: number;
    content_markdown: string;
    content_html?: string;
    content_blocks?: any[];
    key_takeaways: string[];
    ai_confidence_score?: number;
    generated_with_ai?: boolean;
    audio_url?: string;
    audio_duration?: number;          // Phase 3: Duration in seconds
    video_url?: string;               // Legacy / Generic video
    video_overview_url?: string;      // Phase 3: NotebookLM Cinematic Overview
    video_overview_thumbnail?: string; // Phase 3: High-fidelity thumbnail
    concept_videos?: any[];           // Phase 3: Array of concept snippets
    voice_locale?: string;            // Phase 3: Regional voice (en-GB, en-US)
    created_at?: string;
    images?: LessonImage[];
}

export interface LessonImage {
    id?: string;
    lesson_id?: string;
    image_url: string;
    alt_text: string;
    caption: string;
    order_index: number;
    source: string;
    source_attribution: string;
}

export interface CourseQuiz {
    id?: string;
    topic_id: string;
    title: string;
    passing_score_percentage: number;
    created_at?: string;
    questions?: QuizQuestion[];
}

export interface QuizQuestion {
    id?: string;
    quiz_id: string;
    question_text: string;
    question_type: 'multiple_choice' | 'true_false';
    order_index: number;
    points: number;
    options: string[]; // JSON array
    explanation: string;
    created_at?: string;
}

export interface AIGeneratedCourse {
    id: string;
    course_id: string;
    generation_status: GenerationStatus;
    current_step?: string;
    percent_complete?: number;
    error_message?: string;
    groq_tokens_used?: number;
    elevenlabs_characters_used?: number;
    estimated_cost_usd?: number;
    content_quality_score?: number;
    generation_started_at?: string;
    generation_completed_at?: string;
    last_progress_update?: string;
}

export interface CourseGenerationRequest {
    courseName: string;
    difficultyLevel: DifficultyLevel;
    courseDescription?: string;
    targetDuration: number;
    targetAudience?: string;
    videoSettings?: {
        courseHost: 'sarah' | 'gemma';
        moduleHost: 'sarah' | 'gemma';
    };
}

export interface AIGeneratedOutline {
    courseOverview: string;
    learningObjectives: string[];
    topics: {
        title: string;
        description: string;
        lessons: {
            title: string;
            description: string;
            keywords: string[]; // For image fetching
        }[];
    }[];
}

export interface AIGeneratedLesson {
    blocks: any[]; // Matches ContentBlock[]
    metadata: {
        estimatedDuration?: number;
        imagePrompts: string[];
    };
}

// Full Course Structure
export interface CourseGenerated {
    courseTitle: string;
    difficultyLevel: DifficultyLevel;
    description: string;
    estimatedDurationHours: number;
    learningObjectives: string[];
    courseThumbnailPrompt: string;
    topics: CourseGeneratedTopic[];
}

export interface CourseGeneratedTopic {
    topicTitle: string;
    introduction: string;
    keyOutcomes: string[];
    topicImagePrompt: string;
    lessons: CourseGeneratedLesson[];
    quiz: CourseGeneratedQuizData;
}

// Renamed from CourseGeneratedLesson to avoid conflict if any, but kept simple
export interface CourseGeneratedLesson {
    lessonTitle: string;
    lessonSummary: string;
    content: string;
    imagePrompts: string[];
}

export interface CourseGeneratedQuizData {
    questions: Array<{
        question: string;
        options: string[];
        correctAnswer: string;
        explanation: string;
    }>;
}
