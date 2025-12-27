
import { CourseCard } from './course-card';

type Course = {
  title: string;
  description: string;
  imageUrl: string;
  duration: number;
};

type CourseGridProps = {
  courses: Course[];
};

export function CourseGrid({ courses }: CourseGridProps) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {courses.map((course, index) => (
        <CourseCard key={index} {...course} />
      ))}
    </div>
  );
}
