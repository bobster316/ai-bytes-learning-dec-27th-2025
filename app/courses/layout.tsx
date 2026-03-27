"use client";

import { Header } from "@/components/header";
import { usePathname } from "next/navigation";

export default function CoursesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  // Lesson pages get their own minimal nav — suppress global header there
  const isLessonPage = /\/courses\/[^/]+\/lessons\/[^/]+/.test(pathname);

  return (
    <div className="flex flex-col min-h-screen">
      {!isLessonPage && <Header />}
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
}
