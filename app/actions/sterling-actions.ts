"use server";

import { createClient } from "@/lib/supabase/server";

export async function getAvailableCourses() {
    const supabase = await createClient();
    const { data: courses } = await supabase
        .from("courses")
        .select("id, title, description, difficulty_level, estimated_duration_hours")
        .eq("published", true);

    return courses || [];
}

export async function getSterlingUserStats() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    // Fetch quiz attempts to calculate progress
    const { data: attempts } = await supabase
        .from("user_quiz_attempts")
        .select(`
            score_percentage,
            completed_at,
            quiz:course_quizzes (
                title,
                topic:course_topics (
                    title,
                    course:courses (
                        id,
                        title,
                        difficulty_level
                    )
                )
            )
        `)
        .eq("user_id", user.id)
        .order("completed_at", { ascending: false });

    // Transform data to group by course
    const coursesMap = new Map();

    attempts?.forEach((attempt: any) => {
        const course = attempt.quiz?.topic?.course;
        if (!course) return;

        if (!coursesMap.has(course.id)) {
            coursesMap.set(course.id, {
                id: course.id,
                title: course.title,
                difficulty: course.difficulty_level,
                quizzesTaken: 0,
                lastActivity: attempt.completed_at,
                scores: [],
                progress: 0
            });
        }

        const stats = coursesMap.get(course.id);
        stats.quizzesTaken++;
        stats.scores.push(attempt.score_percentage);
    });

    const coursesWithProgress = Array.from(coursesMap.values()).map(c => ({
        ...c,
        averageScore: Math.round(c.scores.reduce((a: number, b: number) => a + b, 0) / c.scores.length),
        progress: Math.min(100, c.quizzesTaken * 25) // Estimate 4 quizzes per course for 100%
    }));

    // Fetch User Profile (Gamification / Momentum)
    const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

    return {
        activeCourses: coursesWithProgress,
        profile: profile || {
            current_level: 1,
            total_xp: 0,
            xp_to_next_level: 100,
            current_streak: 0,
            longest_streak: 0
        }
    };
}
