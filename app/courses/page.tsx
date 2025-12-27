import { createClient } from "@/lib/supabase/server";
import { CourseCatalog } from "@/components/course-catalog";

export const revalidate = 60; // Revalidate every minute

export default async function CoursesPage() {
  const supabase = await createClient(); // Anon key (Public)

  const { data: courses } = await supabase
    .from('courses')
    .select('*')
    .eq('published', true)
    .order('created_at', { ascending: false });

  return <CourseCatalog courses={courses || []} />;
}
