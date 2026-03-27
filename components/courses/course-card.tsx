"use client";

import React, { useRef, useState } from 'react';
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
  const cardRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setPosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <div
      ref={cardRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseMove={handleMouseMove}
      className="group relative cursor-pointer"
    >
      <Card className="overflow-hidden transition-all duration-500 group-hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.15)] group-hover:-translate-y-2 bg-white relative border-transparent hover:border-blue-100/50">
        {/* Dynamic Glass Glare Effect */}
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-300 mix-blend-overlay z-20"
          style={{
            opacity: isHovered ? 1 : 0,
            background: `radial-gradient(circle 250px at ${position.x}px ${position.y}px, rgba(255,255,255,0.8) 0%, transparent 80%)`,
          }}
        />

        <div className="relative h-40 w-full">
          <Image
            src={imageUrl || "/placeholders/course-placeholder.jpg"}
            alt={title}
            fill
            className="transition-transform duration-700 ease-out group-hover:scale-110"
            style={{ objectFit: 'cover' }}
          />

          {/* Gradient Overlay for Text Readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-0" />

          {/* Overlay Title */}
          <div className="absolute bottom-3 left-4 right-4 z-10 transition-transform duration-500 ease-out group-hover:-translate-y-1">
            <h3 className={`text-white font-bold leading-tight shadow-sm drop-shadow-md line-clamp-2 ${title.length > 40 ? 'text-sm' : title.length > 25 ? 'text-base' : 'text-lg'}`}>
              {title}
            </h3>
          </div>
        </div>
        <div className="p-4 pt-2 relative z-10 bg-white">
          {/* Title moved to image overlay */}
          <p className="mb-4 text-sm text-gray-600 line-clamp-2">{description}</p>
          <div className="flex items-center justify-between text-sm">
            <Badge variant="secondary" className="bg-slate-100/80 backdrop-blur-sm text-slate-600 border-none group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
              Course
            </Badge>
            <div className="flex items-center gap-1 text-gray-500 group-hover:text-blue-500 transition-colors">
              <Clock className="h-4 w-4" />
              <span>{duration} mins</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
