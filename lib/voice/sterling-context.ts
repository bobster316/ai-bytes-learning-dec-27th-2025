import { createClient } from "@/lib/supabase/client";

/**
 * Fetches real-time platform context for the Sterling AI assistant.
 * Includes available courses, user progress, current lesson context,
 * and the latest auto-generated Pulse news articles.
 *
 * Note: This function runs at session start, so Sterling always has
 * up-to-date knowledge of the site's evolving content — no manual
 * updates to a static knowledge file needed.
 */
export async function getSterlingCourseContext(userId?: string, currentLessonId?: string) {
    const supabase = createClient();

    try {
        const [coursesResult, progressResult, lessonResult, newsResult] = await Promise.all([
            // 1. Get Available Courses (Published)
            supabase
                .from('courses')
                .select('id, title, description, category, difficulty_level, price, estimated_duration_hours, learning_objectives, published')
                .eq('published', true)
                .order('created_at', { ascending: false })
                .limit(1000),

            // 2. Get User Progress (if logged in)
            userId
                ? supabase
                      .from('user_course_progress')
                      .select('*, courses(id, title, difficulty_level, price, category, estimated_duration_hours)')
                      .eq('user_id', userId)
                : Promise.resolve({ data: null }),

            // 3. Get Current Lesson Details (if on a lesson page)
            currentLessonId
                ? supabase
                      .from('course_lessons')
                      .select(
                          `
        id, 
        title, 
        content_markdown,
        topic:course_topics(id, title)
      `
                      )
                      .eq('id', currentLessonId)
                      .single()
                : Promise.resolve({ data: null }),

            // 4. Get Latest Pulse News Articles (always live — never stale)
            supabase
                .from('seo_news_articles')
                .select('title, slug, published_at')
                .order('published_at', { ascending: false })
                .limit(5),
        ]);

        const context = {
            courses: coursesResult.data || [],
            userProgress: progressResult.data || [],
            currentLesson: lessonResult.data || null,
            latestPulseArticles: newsResult.data || [],
            timestamp: new Date().toISOString()
        };

        return context;
    } catch (error) {
        console.error("Error fetching Sterling context:", error);
        return null;
    }
}
