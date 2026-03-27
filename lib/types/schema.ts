export type DifficultyLevel = 'Beginner' | 'Intermediate' | 'Advanced';

// Database Objects

export interface CourseTemplate {
    id: string;
    title: string;
    difficulty: DifficultyLevel;
    description: string;
    estimated_duration_hours: number;
    learning_objectives: string[];
    thumbnail_prompt: string;
    is_locked: boolean;
    created_at: string;
    updated_at: string;
}

export interface TemplateTopic {
    id: string;
    template_id: string;
    title: string;
    introduction: string;
    key_outcomes: string[];
    image_prompt: string;
    position: number;
    created_at: string;
}

export interface TemplateLesson {
    id: string;
    topic_id: string;
    title: string;
    summary: string;
    content: string;
    image_prompts: string[];
    position: number;
    created_at: string;
}

export interface TemplateQuiz {
    id: string;
    topic_id: string;
    created_at: string;
}

export interface TemplateQuizQuestion {
    id: string;
    quiz_id: string;
    question: string;
    options: { A: string; B: string; C: string; D: string };
    correct_answer: 'A' | 'B' | 'C' | 'D';
    explanation: string;
    position: number;
}

// Published Objects (immutable view)

export interface Course {
    id: string;
    template_id: string;
    title: string;
    // difficulty: DifficultyLevel; // Legacy
    difficulty_level?: DifficultyLevel; // mapped from DB
    description: string;
    estimated_duration_hours: number;
    price: number;
    learning_objectives: string[];
    thumbnail_url?: string;
    category?: string;
    categories?: string[];
    thumbnail_prompt: string;
    published: boolean;
    created_at: string;
    updated_at: string;
}

export interface CourseTopic {
    id: string;
    course_id: string;
    title: string;
    introduction: string;
    key_outcomes: string[];
    image_url?: string;
    image_prompt: string;
    position: number;
    created_at: string;
}

// ... other published interfaces mirror templates but with _url fields where applicable
