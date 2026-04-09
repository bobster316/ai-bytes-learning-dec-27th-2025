import { createClient } from "@/lib/supabase/server";
import { CourseCatalog } from "@/components/course-catalog";
import { buildMetadata } from "@/lib/seo";
import { Metadata } from "next";

export function generateMetadata(): Metadata {
  return buildMetadata({
    title: "AI Course Catalog - AI Bytes Learning",
    description: "Explore our collection of 15-minute high-velocity AI bytes and transform into a confident AI practitioner.",
    path: "/courses",
    image: "/logos/ai-bytes-og.png"
  });
}

export const dynamic = 'force-dynamic';

export default async function CoursesPage(
  props: { searchParams: Promise<{ category?: string }> }
) {
  const supabase = await createClient(); // Anon key (Public)
  const searchParams = await props.searchParams;

  const { data: courses } = await supabase
    .from('courses')
    .select('*')
    .eq('published', true)
    .order('created_at', { ascending: false });

  return <CourseCatalog courses={courses || []} initialCategory={searchParams.category} />;
}

