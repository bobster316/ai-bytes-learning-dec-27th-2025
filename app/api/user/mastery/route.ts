
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
        return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const supabase = await createClient();

    // 1. Fetch User Profile
    const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

    // 2. Fetch User Course Progress
    const { data: progress } = await supabase
        .from('user_course_progress')
        .select('overall_progress_percentage, course_id, courses(category, categories)')
        .eq('user_id', userId);

    // 3. Fetch All Published Courses to know totals
    const { data: allCourses } = await supabase
        .from('courses')
        .select('id, category, categories')
        .eq('published', true);

    // 4. Map Categories to mastery levels
    const categories = [
        { id: "foundational", label: "AI Foundations", icon: "Brain" },
        { id: "generative", label: "Generative AI", icon: "Zap" },
        { id: "prompt-engineering", label: "Prompt Engineering", icon: "MessageSquare" },
        { id: "applications", label: "AI Development", icon: "Code" }, // Applications & ML
        { id: "machine-learning", label: "Deep Learning", icon: "Cpu" },
        { id: "business", label: "Strategic AI", icon: "TrendingUp" },
        { id: "security", label: "Policy & Ethics", icon: "Shield" },
        { id: "vision", label: "Visual Intel", icon: "Eye" },
    ];

    const categoryMap = categories.map(cat => {
        // Filter courses belonging to this category keyword
        // Matches can be broad
        const coursesInCat = allCourses?.filter(c =>
            c.category?.toLowerCase().includes(cat.id.split('-')[0]) ||
            c.categories?.some((cc: string) => cc.toLowerCase().includes(cat.id.split('-')[0]))
        ) || [];

        const totalCourses = coursesInCat.length;

        // Calculate progress for these specific courses
        const progressInCat = progress?.filter(p =>
            coursesInCat.some(c => c.id === p.course_id)
        ) || [];

        const totalProgress = progressInCat.reduce((acc, p) => acc + (p.overall_progress_percentage || 0), 0);
        const masteryLevel = totalCourses > 0 ? Math.round(totalProgress / totalCourses) : 0;

        return {
            ...cat,
            mastery: masteryLevel,
            totalCourses,
            completedCourses: progressInCat.filter(p => p.overall_progress_percentage === 100).length
        };
    });

    return NextResponse.json({
        profile,
        categories: categoryMap
    });
}
