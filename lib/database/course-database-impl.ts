
// ========================================
// Pure Implementation of Course Database
// ========================================

import type {
    AIGeneratedCourse,
    CourseTopic,
    CourseLesson,
    LessonImage,
    CourseQuiz,
    QuizQuestion,
    DatabaseInsert,
    GenerationStatus,
} from '@/lib/types/course-generator';

/**
 * Course Database Operations - Pure Implementation
 * This class handles the logic but takes the Supabase client as a dependency.
 * This makes it safe for both client and server environments.
 */
export class CourseDatabase {
    constructor(private supabase: any) { }

    /**
     * Update course details
     */
    async updateCourse(courseId: string, updates: {
        title?: string;
        description?: string;
        thumbnail_url?: string;
        published?: boolean;
    }) {
        const { data, error } = await this.supabase
            .from('courses')
            .update(updates)
            .eq('id', courseId)
            .select();

        if (error) throw error;
        return data;
    }

    /**
     * Get course by ID
     */
    async getCourse(courseId: string) {
        const { data, error } = await this.supabase
            .from('courses')
            .select('*')
            .eq('id', courseId)
            .single();

        if (error) throw error;
        return data;
    }

    /**
     * List all courses
     */
    async listCourses() {
        const { data, error } = await this.supabase
            .from('courses')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    }

    /**
     * Update generation status
     */
    async updateGenerationStatus(
        generationId: string,
        status: GenerationStatus,
        updates?: {
            error_message?: string;
            groq_tokens_used?: number;
            elevenlabs_characters_used?: number;
            estimated_cost_usd?: number;
            content_quality_score?: number;
        }
    ) {
        const payload: any = { status, updated_at: new Date().toISOString() };
        if (updates) {
            if (updates.error_message) payload.error_message = updates.error_message;
            if (updates.groq_tokens_used) payload.groq_tokens_used = updates.groq_tokens_used;
            if (updates.elevenlabs_characters_used) payload.elevenlabs_characters_used = updates.elevenlabs_characters_used;
            if (updates.estimated_cost_usd) payload.estimated_cost_usd = updates.estimated_cost_usd;
            if (updates.content_quality_score) payload.content_quality_score = updates.content_quality_score;
        }

        const { data, error } = await this.supabase
            .from('course_generations')
            .update(payload)
            .eq('id', generationId)
            .select();

        if (error) throw error;
        return data;
    }

    /**
     * Get generation record
     */
    async getGeneration(generationId: string) {
        const { data, error } = await this.supabase
            .from('course_generations')
            .select('*')
            .eq('id', generationId)
            .single();

        if (error) throw error;
        return data;
    }

    /**
     * Update generation progress
     */
    async updateGenerationProgress(
        generationId: string,
        currentStep: string,
        percentComplete: number
    ) {
        const { data, error } = await this.supabase
            .from('course_generations')
            .update({
                current_step: currentStep,
                percent_complete: percentComplete,
                updated_at: new Date().toISOString()
            })
            .eq('id', generationId)
            .select();

        if (error) throw error;
        return data;
    }

    /**
     * Create course topics in batch
     */
    async createTopics(topics: DatabaseInsert<CourseTopic>[]) {
        const { data, error } = await this.supabase
            .from('course_topics')
            .insert(topics)
            .select();

        if (error) throw error;
        return data;
    }

    /**
     * Get topics for a course
     */
    async getTopicsByCourse(courseId: string) {
        const { data, error } = await this.supabase
            .from('course_topics')
            .select('*')
            .eq('course_id', courseId)
            .order('order_index', { ascending: true });

        if (error) throw error;
        return data;
    }

    /**
     * Create course lessons in batch
     */
    async createLessons(lessons: DatabaseInsert<CourseLesson>[]) {
        const { data, error } = await this.supabase
            .from('course_lessons')
            .insert(lessons)
            .select();

        if (error) throw error;
        return data;
    }

    /**
     * Update lesson details (generic)
     */
    async updateLesson(lessonId: string, updates: any) {
        const { data, error } = await this.supabase
            .from('course_lessons')
            .update(updates)
            .eq('id', lessonId)
            .select();

        if (error) throw error;
        return data;
    }

    /**
     * Get lesson by ID
     */
    async getLessonById(lessonId: string) {
        const { data, error } = await this.supabase
            .from('course_lessons')
            .select('*')
            .eq('id', lessonId)
            .single();

        if (error) throw error;
        return data;
    }

    /**
     * Get lessons for a topic
     */
    async getLessonsByTopic(topicId: string) {
        const { data, error } = await this.supabase
            .from('course_lessons')
            .select('*')
            .eq('topic_id', topicId)
            .order('order_index', { ascending: true });

        if (error) throw error;
        return data;
    }

    /**
     * Create lesson images in batch
     */
    async createImages(images: DatabaseInsert<LessonImage>[]) {
        const { data, error } = await this.supabase
            .from('lesson_images')
            .insert(images)
            .select();

        if (error) throw error;
        return data;
    }

    /**
     * Create quiz for a topic
     */
    async createQuiz(quiz: DatabaseInsert<CourseQuiz>) {
        const { data, error } = await this.supabase
            .from('course_quizzes')
            .insert(quiz)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    /**
     * Create quiz questions in batch
     */
    async createQuizQuestions(questions: DatabaseInsert<QuizQuestion>[]) {
        const { data, error } = await this.supabase
            .from('quiz_questions')
            .insert(questions)
            .select();

        if (error) throw error;
        return data;
    }

    /**
     * Get complete course data with all relations
     */
    async getCompleteCourse(courseId: string) {
        // 1. Get base course
        const course = await this.getCourse(courseId);

        // 2. Get topics
        const topics = await this.getTopicsByCourse(courseId);

        // 3. For each topic, get lessons and quiz
        const completeTopics = await Promise.all(topics.map(async (topic: any) => {
            const lessons = await this.getLessonsByTopic(topic.id);

            // Get images for each lesson
            const lessonsWithImages = await Promise.all(lessons.map(async (lesson: any) => {
                const { data: images } = await this.supabase
                    .from('lesson_images')
                    .select('*')
                    .eq('lesson_id', lesson.id);
                return { ...lesson, images };
            }));

            const { data: quiz } = await this.supabase
                .from('course_quizzes')
                .select('*')
                .eq('topic_id', topic.id)
                .single();

            let quizWithQuestions = null;
            if (quiz) {
                const questions = await this.supabase
                    .from('quiz_questions')
                    .select('*')
                    .eq('quiz_id', quiz.id)
                    .order('order_index', { ascending: true });
                quizWithQuestions = { ...quiz, questions: questions.data };
            }

            return {
                ...topic,
                lessons: lessonsWithImages,
                quiz: quizWithQuestions
            };
        }));

        return {
            ...course,
            topics: completeTopics
        };
    }

    /**
     * Save complete course structure
     */
    async saveCourseStructure(
        courseId: string,
        structure: any
    ) {
        try {
            // 1. Save Topics
            const topicsToInsert = structure.topics.map((t: any) => ({
                course_id: courseId,
                title: t.title,
                description: t.description,
                order_index: t.order_index,
                estimated_duration_minutes: t.estimated_duration_minutes,
                learning_objectives: t.learning_objectives,
                thumbnail_url: t.thumbnail_url
            }));

            const createdTopics = await this.createTopics(topicsToInsert);

            // 2. Save Lessons and Quizzes for each Topic
            for (let i = 0; i < createdTopics.length; i++) {
                const topicId = createdTopics[i].id;
                const topicSource = structure.topics[i];

                // Save Lessons
                if (topicSource.lessons && topicSource.lessons.length > 0) {
                    const lessonsToInsert = topicSource.lessons.map((l: any) => ({
                        topic_id: topicId,
                        course_id: courseId,
                        title: l.title,
                        order_index: l.order_index,
                        estimated_duration_minutes: l.estimated_duration_minutes,
                        content_markdown: l.content_markdown,
                        content_html: l.content_html,
                        content_blocks: l.content_blocks,
                        key_takeaways: l.key_takeaways,
                        ai_confidence_score: l.ai_confidence_score,
                        generated_with_ai: l.generated_with_ai
                    }));

                    const createdLessons = await this.createLessons(lessonsToInsert);

                    // Save Images for each Lesson
                    for (let j = 0; j < createdLessons.length; j++) {
                        const lessonId = createdLessons[j].id;
                        const lessonSource = topicSource.lessons[j];

                        if (lessonSource.images && lessonSource.images.length > 0) {
                            const imagesToInsert = lessonSource.images.map((img: any) => ({
                                lesson_id: lessonId,
                                url: img.url,
                                caption: img.caption,
                                alt_text: img.alt_text,
                                order_index: img.order_index
                            }));
                            await this.createImages(imagesToInsert);
                        }
                    }
                }

                // Save Quiz
                if (topicSource.quiz) {
                    const quizToInsert = {
                        topic_id: topicId,
                        course_id: courseId,
                        title: topicSource.quiz.title,
                        passing_score_percentage: 80
                    };
                    const createdQuiz = await this.createQuiz(quizToInsert);

                    if (topicSource.quiz.questions && topicSource.quiz.questions.length > 0) {
                        const questionsToInsert = topicSource.quiz.questions.map((q: any) => ({
                            quiz_id: createdQuiz.id,
                            question_text: q.question_text,
                            order_index: q.order_index,
                            options: q.options,
                            explanation: q.explanation
                        }));
                        await this.createQuizQuestions(questionsToInsert);
                    }
                }
            }

            return { success: true };
        } catch (error) {
            console.error('Error saving course structure:', error);
            throw error;
        }
    }
}
