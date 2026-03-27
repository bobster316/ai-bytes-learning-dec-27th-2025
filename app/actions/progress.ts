'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface LessonProgress {
    lesson_id: string
    status: 'not_started' | 'in_progress' | 'completed'
    progress_percentage: number
    completed_at: string | null
}

export interface QuizAttemptResult {
    attempt_id: string
    score: number
    passed: boolean
    attempt_number: number
}

// Mark a lesson as started or update progress
export async function updateLessonProgress(
    courseId: string,
    lessonId: string | number,
    percentage: number
) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Unauthorized' }

    const status = percentage >= 90 ? 'completed' : 'in_progress'
    const completedAt = percentage >= 90 ? new Date().toISOString() : null

    // Check for existing progress to update Momentum and XP
    const { data: existing } = await supabase
        .from('user_lesson_progress')
        .select('status')
        .eq('user_id', user.id)
        .eq('lesson_id', lessonId)
        .single()

    const updates: any = {
        user_id: user.id,
        course_id: courseId, // Denormalized
        lesson_id: lessonId,
        progress_percentage: percentage,
        status: existing?.status === 'completed' ? 'completed' : status,
        updated_at: new Date().toISOString()
    }

    if (status === 'completed' && existing?.status !== 'completed') {
        updates.completed_at = completedAt
    }

    const { error } = await supabase
        .from('user_lesson_progress')
        .upsert(updates, { onConflict: 'user_id,lesson_id' })

    if (error) {
        console.error('Error updating lesson progress:', error)
        return { error: error.message }
    }

    // --- NEW: Update Overall Course Progress ---
    try {
        // 1. Get total lessons count
        // We join course_topics to filter by course_id
        const { count: totalLessons } = await supabase
            .from('course_lessons')
            .select('id, course_topics!inner(course_id)', { count: 'exact', head: true })
            .eq('course_topics.course_id', courseId)

        // 2. Get completed lessons count
        const { count: completedLessons } = await supabase
            .from('user_lesson_progress')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('course_id', courseId)
            .eq('status', 'completed')

        if (totalLessons && totalLessons > 0) {
            const overallPercent = Math.round(((completedLessons || 0) / totalLessons) * 100)

            // 3. Upsert course progress
            await supabase
                .from('user_course_progress')
                .upsert({
                    user_id: user.id,
                    course_id: courseId,
                    overall_progress_percentage: overallPercent,
                    current_lesson_id: lessonId,
                    last_accessed_at: new Date().toISOString(),
                    // If 100%, mark completed? Maybe prefer checkCourseCompletion for that to include quizzes
                    // But we can set status 'in_progress' if not complete
                    status: overallPercent === 100 ? 'completed' : 'in_progress'
                }, { onConflict: 'user_id, course_id' })
        }
    } catch (progError) {
        console.error("Failed to update overall progress:", progError)
        // Don't fail the request, just log
    }
    // -------------------------------------------

    revalidatePath(`/courses/${courseId}`)
    return { success: true }
}

// Get progress for a specific lesson
export async function getLessonProgress(lessonId: number): Promise<LessonProgress | null> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    const { data } = await supabase
        .from('user_lesson_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('lesson_id', lessonId)
        .single()

    return data
}

// Record a quiz attempt
export async function submitQuizAttempt(
    courseId: string,
    topicId: number,
    quizId: number,
    score: number,
    passed: boolean,
    answers: any,
    timeTaken: number
) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Unauthorized' }

    // Get current attempt number
    const { count } = await supabase
        .from('quiz_attempts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('quiz_id', quizId)

    const attemptNumber = (count || 0) + 1

    const { data, error } = await supabase
        .from('quiz_attempts')
        .insert({
            user_id: user.id,
            course_id: courseId,
            topic_id: topicId,
            quiz_id: quizId,
            score,
            passed,
            answers,
            time_taken: timeTaken,
            attempt_number: attemptNumber,
            submitted_at: new Date().toISOString()
        })
        .select()
        .single()

    if (error) {
        console.error('Error submitting quiz:', error)
        return { error: error.message }
    }

    revalidatePath(`/courses/${courseId}`)
    return { success: true, attempt: data }
}

// Check if course is complete (all modules & quizzes passed)
export async function checkCourseCompletion(courseId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Unauthorized' }

    // 1. Get all topics and their quizzes
    const { data: course } = await supabase
        .from('courses')
        .select(`
      id,
      course_topics (
        id,
        course_quizzes (id)
      )
    `)
        .eq('id', courseId)
        .single()

    if (!course) return { error: 'Course not found' }

    // 2. Check quiz attempts
    // We need to see if there is at least one PASSED attempt for EVERY quiz
    const allQuizIds = course.course_topics
        .flatMap((t: any) => t.course_quizzes)
        .map((q: any) => q.id)

    if (allQuizIds.length === 0) {
        // If no quizzes, check lessons? For now, let's assume quizzes are the gate.
        return { completed: true }
    }

    const { data: attempts } = await supabase
        .from('quiz_attempts')
        .select('quiz_id, passed')
        .eq('user_id', user.id)
        .eq('course_id', courseId)
        .eq('passed', true)

    const passedQuizIds = new Set(attempts?.map((a: any) => a.quiz_id))

    const allPassed = allQuizIds.every((id: any) => passedQuizIds.has(id))

    if (allPassed) {
        // Update user_course_progress
        await supabase
            .from('user_course_progress')
            .upsert({
                user_id: user.id,
                course_id: courseId,
                status: 'completed',
                overall_progress_percentage: 100,
                completed_at: new Date().toISOString()
            }, { onConflict: 'user_id, course_id' })

        return { completed: true }
    }

    return { completed: false }
}

export async function generateCertificate(courseId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Unauthorized' }

    // 1. Verify Completion
    // For now, we allow generation if called (e.g. from completion screen), 
    // assuming frontend gates it. Stricter checks can be added later.

    // 2. Get Course Details
    const { data: course } = await supabase.from('courses').select('title').eq('id', courseId).single()

    // 3. Create Certificate
    const { data: existing } = await supabase
        .from('certificates')
        .select('id')
        .eq('user_id', user.id)
        .eq('course_id', courseId)
        .single()

    if (existing) {
        return { success: true, certificateId: existing.id }
    }

    // Generate new
    const certNumber = `CERT-${Math.floor(Math.random() * 1000000)}`
    const { data: newCert, error } = await supabase
        .from('certificates')
        .insert({
            user_id: user.id,
            course_id: courseId,
            certificate_number: certNumber,
            issue_date: new Date().toISOString(),
            completion_date: new Date().toISOString(),
            final_score: 100, // Placeholder
            metadata: {
                studentName: user.user_metadata?.full_name || user.email?.split('@')[0] || "Student",
                courseTitle: course?.title || "Course",
                score: 100
            }
        })
        .select()
        .single()

    if (error) {
        console.error("Cert gen error:", error)
        return { error: error.message }
    }

    return { success: true, certificateId: newCert.id }
}

export async function ensureUserProfile() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Unauthorized' }

    const { data: profile } = await supabase
        .from('user_profiles')
        .select('user_id')
        .eq('user_id', user.id)
        .maybeSingle()

    if (!profile) {
        // Create initial profile if missing
        const { error } = await supabase
            .from('user_profiles')
            .insert({
                user_id: user.id,
                total_xp: 0,
                current_level: 1,
                xp_to_next_level: 100,
                current_streak: 0, // Momentum start
                longest_streak: 0  // Peak momentum
            })

        if (error) {
            console.error("Error creating profile:", error)
            return { error: error.message }
        }
    }

    return { success: true }
}
