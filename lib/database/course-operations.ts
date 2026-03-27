
import { createClient } from '@/lib/supabase/server';
import { CourseDatabase } from './course-database-impl';

/**
 * Get database instance for SERVER-SIDE use only
 * @param useServiceRole - If true, uses service role to bypass RLS (for admin operations)
 */
export async function getCourseDatabase(useServiceRole: boolean = false): Promise<CourseDatabase> {
  const supabase = await createClient(useServiceRole);
  return new CourseDatabase(supabase);
}

// Re-export the class for type usage
export { CourseDatabase };
