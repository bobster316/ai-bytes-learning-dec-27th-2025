
import Image from 'next/image';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock } from 'lucide-react';

type CourseCardProps = {
  title: string;
  description: string;
  imageUrl: string;
  duration: number;
};

export function CourseCard({ title, description, imageUrl, duration }: CourseCardProps) {
  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-lg">
      <div className="relative h-40 w-full">
        <Image
          src={imageUrl}
          alt={title}
          fill
          style={{ objectFit: 'cover' }}
        />
      </div>
      <div className="p-4">
        <h3 className="mb-2 text-lg font-bold leading-tight">{title}</h3>
        <p className="mb-4 text-sm text-gray-600 line-clamp-2">{description}</p>
        <div className="flex items-center justify-between text-sm">
          <Badge variant="secondary">AI Course</Badge>
          <div className="flex items-center gap-1 text-gray-500">
            <Clock className="h-4 w-4" />
            <span>{duration} mins</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
