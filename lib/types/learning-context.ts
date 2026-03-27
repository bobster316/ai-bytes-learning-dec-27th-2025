
export interface LearningContext {
    courseId?: string;
    courseTitle?: string;
    moduleId?: string;
    moduleName?: string;
    lessonId?: string;
    lessonTitle?: string;
    lessonContent?: string;
    quizId?: string;
    currentQuizQuestion?: {
        questionNumber: number;
        questionText: string;
        options: string[];
    };
    studentProgress?: {
        completedLessons: number;
        totalLessons: number;
        currentPosition: string;
    };
}
