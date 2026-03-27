
import { createClient } from '@/lib/supabase/client';
import { CourseDatabase } from './course-database-impl';

/**
 * Get database instance for CLIENT-SIDE use only
 */
export function getCourseDatabase(): CourseDatabase {
    const supabase = createClient();
    return new CourseDatabase(supabase);
}

// Re-export the class for type usage
export { CourseDatabase };
