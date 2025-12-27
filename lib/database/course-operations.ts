
// ========================================
// Database Operations for Course Generator
// ========================================

import { createClient } from '@/lib/supabase/server';
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
 * Course Database Operations
 */
export class CourseDatabase {
  private supabasePromise: Promise<any>;

  constructor(useServiceRole: boolean = false) {
    this.supabasePromise = createClient(useServiceRole);
  }

  private async getSupabase() {
    return this.supabasePromise;
  }

  // ========================================
  // Course Operations
  // ========================================

  /**
   * Update course details
   */
  async updateCourse(courseId: string, updates: {
    title?: string;
    description?: string;
    thumbnail_url?: string;
    published?: boolean;
  }) {
    const supabase = await this.getSupabase();
    const { data, error } = await supabase
      .from('courses')
      .update(updates)
      .eq('id', courseId)
      .select()
      .single();

    if (error) throw new Error(`Failed to update course: ${error.message}`);
    return data;
  }

  /**
   * Get course by ID
   */
  async getCourse(courseId: string) {
    const supabase = await this.getSupabase();
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .single();

    if (error) throw new Error(`Failed to get course: ${error.message}`);
    return data;
  }

  // ========================================
  // AI Generation Tracking
  // ========================================

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
    const updateData: any = {
      generation_status: status,
    };

    if (status === 'completed') {
      updateData.generation_completed_at = new Date().toISOString();
    }

    if (updates) {
      Object.assign(updateData, updates);
    }

    const supabase = await this.getSupabase();
    const { data, error } = await supabase
      .from('ai_generated_courses')
      .update(updateData)
      .eq('id', generationId)
      .select()
      .single();

    if (error) throw new Error(`Failed to update generation status: ${error.message}`);
    return data;
  }

  /**
   * Get generation record
   */
  async getGeneration(generationId: string) {
    const supabase = await this.getSupabase();
    const { data, error } = await supabase
      .from('ai_generated_courses')
      .select('*')
      .eq('id', generationId)
      .single();

    if (error) throw new Error(`Failed to get generation: ${error.message}`);
    return data;
  }

  /**
   * Update generation progress (for real-time tracking)
   */
  async updateGenerationProgress(
    generationId: string,
    currentStep: string,
    percentComplete: number
  ) {
    const supabase = await this.getSupabase();
    const { data, error } = await supabase
      .from('ai_generated_courses')
      .update({
        current_step: currentStep,
        percent_complete: percentComplete,
        last_progress_update: new Date().toISOString(),
      })
      .eq('id', generationId)
      .select()
      .single();

    if (error) throw new Error(`Failed to update generation progress: ${error.message}`);
    return data;
  }

  // ========================================
  // Topic Operations
  // ========================================

  /**
   * Create course topics in batch
   */
  async createTopics(topics: DatabaseInsert<CourseTopic>[]) {
    const supabase = await this.getSupabase();
    const { data, error } = await supabase
      .from('course_topics')
      .insert(topics)
      .select();

    if (error) throw new Error(`Failed to create topics: ${error.message}`);
    return data;
  }

  /**
   * Get topics for a course
   */
  async getTopicsByCourse(courseId: string) {
    const supabase = await this.getSupabase();
    const { data, error } = await supabase
      .from('course_topics')
      .select('*')
      .eq('course_id', courseId)
      .order('order_index', { ascending: true });

    if (error) throw new Error(`Failed to get topics: ${error.message}`);
    return data;
  }

  // ========================================
  // Lesson Operations
  // ========================================

  /**
   * Create course lessons in batch
   */
  async createLessons(lessons: DatabaseInsert<CourseLesson>[]) {
    const supabase = await this.getSupabase();
    const { data, error } = await supabase
      .from('course_lessons')
      .insert(lessons)
      .select();

    if (error) throw new Error(`Failed to create lessons: ${error.message}`);
    return data;
  }

  /**
   * Update lesson with audio/video URLs
   */
  async updateLesson(lessonId: string, updates: {
    audio_url?: string;
    video_url?: string;
    content_html?: string;
  }) {
    const supabase = await this.getSupabase();
    const { data, error } = await supabase
      .from('course_lessons')
      .update(updates)
      .eq('id', lessonId)
      .select()
      .single();

    if (error) throw new Error(`Failed to update lesson: ${error.message}`);
    return data;
  }

  /**
   * Get lessons for a topic
   */
  async getLessonsByTopic(topicId: string) {
    const supabase = await this.getSupabase();
    const { data, error } = await supabase
      .from('course_lessons')
      .select('*')
      .eq('topic_id', topicId)
      .order('order_index', { ascending: true });

    if (error) throw new Error(`Failed to get lessons: ${error.message}`);
    return data;
  }

  // ========================================
  // Image Operations
  // ========================================

  /**
   * Create lesson images in batch
   */
  async createImages(images: DatabaseInsert<LessonImage>[]) {
    if (images.length === 0) return [];

    const supabase = await this.getSupabase();
    const { data, error } = await supabase
      .from('lesson_images')
      .insert(images)
      .select();

    if (error) throw new Error(`Failed to create images: ${error.message}`);
    return data;
  }

  // ========================================
  // Quiz Operations
  // ========================================

  /**
   * Create quiz for a topic
   */
  async createQuiz(quiz: DatabaseInsert<CourseQuiz>) {
    const supabase = await this.getSupabase();
    const { data, error } = await supabase
      .from('course_quizzes')
      .insert(quiz)
      .select()
      .single();

    if (error) throw new Error(`Failed to create quiz: ${error.message}`);
    return data;
  }

  /**
   * Create quiz questions in batch
   */
  async createQuizQuestions(questions: DatabaseInsert<QuizQuestion>[]) {
    const supabase = await this.getSupabase();
    const { data, error } = await supabase
      .from('quiz_questions')
      .insert(questions)
      .select();

    if (error) throw new Error(`Failed to create quiz questions: ${error.message}`);
    return data;
  }

  // ========================================
  // Complete Course Data
  // ========================================

  /**
   * Get complete course data with all relations
   */
  async getCompleteCourse(courseId: string) {
    const supabase = await this.getSupabase();
    // Get course
    const course = await this.getCourse(courseId);

    // Get AI metadata
    const { data: aiMetadata } = await supabase
      .from('ai_generated_courses')
      .select('*')
      .eq('course_id', courseId)
      .single();

    // Get topics
    const topics = await this.getTopicsByCourse(courseId);

    // Get lessons and quizzes for each topic
    const topicsWithDetails = await Promise.all(
      topics.map(async (topic: any) => {
        const lessons = await this.getLessonsByTopic(topic.id);

        // Get images for each lesson
        const lessonsWithImages = await Promise.all(
          lessons.map(async (lesson: any) => {
            const { data: images } = await supabase
              .from('lesson_images')
              .select('*')
              .eq('lesson_id', lesson.id)
              .order('order_index', { ascending: true });

            return {
              ...lesson,
              images: images || [],
            };
          })
        );

        // Get quiz
        const { data: quiz } = await supabase
          .from('course_quizzes')
          .select('*')
          .eq('topic_id', topic.id)
          .single();

        // Get quiz questions
        const { data: questions } = await supabase
          .from('quiz_questions')
          .select('*')
          .eq('quiz_id', quiz?.id || '')
          .order('order_index', { ascending: true });

        return {
          ...topic,
          lessons: lessonsWithImages,
          quiz: quiz ? {
            ...quiz,
            questions: questions || [],
          } : null,
        };
      })
    );

    return {
      course,
      aiMetadata,
      topics: topicsWithDetails,
    };
  }

  // ========================================
  // Batch Operations
  // ========================================

  /**
   * Save complete course structure in a transaction-like manner
   */
  async saveCourseStructure(
    courseId: string,
    structure: {
      topics: {
        title: string;
        description: string;
        order_index: number;
        estimated_duration_minutes: number;
        learning_objectives: string[];
        thumbnail_url?: string;
        lessons: {
          title: string;
          order_index: number;
          estimated_duration_minutes: number;
          content_markdown: string;
          content_html?: string;
          key_takeaways: string[];
          ai_confidence_score?: number;
          generated_with_ai?: boolean;
          images?: Array<{
            image_url: string;
            alt_text: string;
            caption: string;
            order_index: number;
            source: string;
            source_attribution: string;
          }>;
        }[];
        quiz: {
          title: string;
          questions: {
            question_text: string;
            order_index: number;
            options: any[];
            explanation: string;
          }[];
        };
      }[];
    }
  ) {
    try {
      // 1. Create topics
      const topicsData = structure.topics.map(topic => ({
        course_id: courseId,
        title: topic.title,
        description: topic.description,
        order_index: topic.order_index,
        estimated_duration_minutes: topic.estimated_duration_minutes,
        learning_objectives: topic.learning_objectives,
        thumbnail_url: topic.thumbnail_url,
      }));

      const createdTopics = await this.createTopics(topicsData);

      // 2. Create lessons for each topic
      for (let i = 0; i < structure.topics.length; i++) {
        const topic = structure.topics[i];
        const createdTopic = createdTopics[i];

        const lessonsData = topic.lessons.map(lesson => ({
          topic_id: createdTopic.id,
          title: lesson.title,
          order_index: lesson.order_index,
          estimated_duration_minutes: lesson.estimated_duration_minutes,
          content_markdown: lesson.content_markdown,
          content_html: lesson.content_html,
          key_takeaways: lesson.key_takeaways,
          ai_confidence_score: lesson.ai_confidence_score,
          generated_with_ai: true,
        }));

        const createdLessons = await this.createLessons(lessonsData);

        // 2.5. Create images for each lesson
        for (let j = 0; j < topic.lessons.length; j++) {
          const lesson = topic.lessons[j];
          const createdLesson = createdLessons[j];

          if (lesson.images && lesson.images.length > 0) {
            const imagesData = lesson.images.map(img => ({
              lesson_id: createdLesson.id,
              image_url: img.image_url,
              alt_text: img.alt_text,
              caption: img.caption,
              order_index: img.order_index,
              source: img.source,
              source_attribution: img.source_attribution,
            }));

            await this.createImages(imagesData);
            console.log(`✅ Saved ${imagesData.length} images for lesson: ${createdLesson.title}`);
          }
        }

        // 3. Create quiz for topic
        const quiz = await this.createQuiz({
          topic_id: createdTopic.id,
          title: topic.quiz.title,
          passing_score_percentage: 70,
        });

        // 4. Create quiz questions
        const questionsData = topic.quiz.questions.map(q => ({
          quiz_id: quiz.id,
          question_text: q.question_text,
          question_type: 'multiple_choice' as const,
          order_index: q.order_index,
          points: 1,
          options: q.options,
          explanation: q.explanation,
        }));

        await this.createQuizQuestions(questionsData);
      }

      console.log(`✅ Saved complete course structure for course ${courseId}`);
      return { success: true };

    } catch (error) {
      console.error('Error saving course structure:', error);
      throw error;
    }
  }
}

/**
 * Get database instance
 * @param useServiceRole - If true, uses service role to bypass RLS (for admin operations)
 */
export function getCourseDatabase(useServiceRole: boolean = false): CourseDatabase {
  return new CourseDatabase(useServiceRole);
}
