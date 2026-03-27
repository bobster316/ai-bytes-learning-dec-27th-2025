
import { AIGeneratedLesson } from '../types/course-generator';

interface LessonImage {
    url: string;
    alt: string;
    caption: string;
}

export function generateLessonHTML(
    courseName: string,
    lesson: AIGeneratedLesson,
    images: LessonImage[]
): string {
    // We are migrating to the JSON Blocks renderer.
    // The legacy markdown/HTML generator is now bypassed to save compute.
    return `
    <div class="master-lesson-container max-w-6xl mx-auto px-6 py-24 font-sans text-slate-900 dark:text-white">
        <div class="p-8 rounded-2xl bg-violet-500/10 border border-violet-500/20 text-center">
            <h2 class="text-2xl font-bold mb-4">Content Upgraded</h2>
            <p>This lesson is using the new immersive structured blocks format and does not use legacy HTML rendering.</p>
        </div>
    </div>
    `;
}
