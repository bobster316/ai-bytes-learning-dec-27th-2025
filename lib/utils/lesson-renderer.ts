
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
    const safeSections = lesson.sections || [];
    const safeImages = images || [];
    const safeTakeaways = lesson.keyTakeaways || [];

    return `
    <div class="master-lesson-container max-w-6xl mx-auto px-6 py-24 font-sans selection:bg-violet-500/30 text-slate-900 dark:text-white">
      
      <!-- Mastery Tracker -->
      ${lesson.masteryChecklist ? `
        <div class="mb-24 p-8 rounded-3xl bg-slate-900 text-white flex flex-col md:flex-row items-center justify-between gap-8 border border-white/5">
            <div class="flex items-center gap-4">
                <div class="text-[10px] font-black uppercase tracking-[0.4em] text-violet-400">Mastery Path</div>
                <h4 class="text-xl font-bold italic">Module Competencies</h4>
            </div>
            <div class="flex flex-wrap gap-3">
                ${(lesson.masteryChecklist || []).map((m: string) => `
                    <span class="px-4 py-1.5 rounded-full bg-white/10 text-[10px] font-black uppercase tracking-widest text-white/60">${m}</span>
                `).join('')}
            </div>
        </div>
      ` : ''}

      <!-- Premium Hero Section -->
      <header class="mb-32 space-y-8 text-center">
        <div class="flex items-center justify-center gap-4">
            <span class="h-[1px] w-12 bg-violet-500/30"></span>
            <span class="text-[10px] font-black uppercase tracking-[0.5em] text-violet-500">Professional Specialization</span>
            <span class="h-[1px] w-12 bg-violet-500/30"></span>
        </div>
        <h1 class="text-6xl md:text-8xl font-black tracking-tighter leading-[0.9] text-slate-900 dark:text-white">
            ${lesson.title || 'Untitled Module'}
        </h1>
        <p class="text-xl text-slate-500 dark:text-slate-400 font-light max-w-2xl mx-auto">
            Part of the <span class="text-violet-500 font-bold">${courseName}</span> series.
        </p>
      </header>

      <!-- Executive Briefing -->
      <div class="relative mb-40 p-12 md:p-20 rounded-[3rem] bg-slate-900 text-white overflow-hidden shadow-2xl">
        <div class="absolute top-0 right-0 w-96 h-96 bg-violet-500/10 blur-[120px] rounded-full"></div>
        <div class="relative z-10">
            <h3 class="text-[10px] font-black uppercase tracking-[0.4em] text-violet-400 mb-10">The Insight</h3>
            <div class="text-3xl md:text-4xl font-light leading-relaxed italic text-slate-200">
                ${lesson.introduction || 'Content loading...'}
            </div>
        </div>
      </div>

      <!-- Instructor & Main Content Split -->
      <div class="space-y-48">
        ${safeSections.map((section, idx) => {
        // Cycle through available images if fewer than sections
        const imageIndex = safeImages.length > 0 ? idx % safeImages.length : -1;
        const sectionImage = imageIndex >= 0 ? safeImages[imageIndex] : null;

        return `
          <section class="flex flex-col lg:flex-row gap-20">
            <div class="lg:w-1/3 space-y-12">
                <div class="space-y-6">
                    <div class="flex items-center gap-4">
                        <span class="text-6xl font-black text-slate-100 dark:text-white/5 tracking-tighter tabular-nums">${String(idx + 1).padStart(2, '0')}</span>
                        <h2 class="text-3xl font-black tracking-tight leading-tight">${section.title}</h2>
                    </div>
                    <div class="h-1 w-12 bg-violet-500"></div>
                </div>

                ${idx === 0 && lesson.instructorInsight ? `
                    <div class="bg-violet-500/5 border border-violet-500/20 p-8 rounded-[2rem]">
                        <div class="text-[9px] font-black uppercase tracking-widest text-violet-500 mb-4">Instructor Insight</div>
                        <div class="flex items-center gap-3 mb-4">
                            <div class="h-10 w-10 rounded-full bg-violet-500"></div>
                            <div>
                                <div class="text-xs font-bold">${lesson.instructorInsight.name || 'Instructor'}</div>
                                <div class="text-[9px] text-slate-400 font-bold uppercase tracking-widest">${lesson.instructorInsight.title || 'Expert'}</div>
                            </div>
                        </div>
                        <p class="text-sm font-light italic leading-relaxed">"${lesson.instructorInsight.wisdom || ''}"</p>
                    </div>
                ` : ''}
            </div>
            
            <div class="lg:w-2/3 space-y-12">
                <div class="prose dark:prose-invert prose-xl max-w-none text-slate-600 dark:text-slate-400 leading-[1.8] font-light">
                  ${section.content}
                </div>

                ${sectionImage ? `
                  <div class="relative rounded-[2.5rem] overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800">
                    <img src="${sectionImage.url}" alt="${sectionImage.alt}" class="w-full h-auto object-cover" />
                  </div>
                ` : ''}
            </div>
          </section>
        `}).join('')}
      </div>

      <!-- Hands-on Challenge -->
      ${lesson.handsOnChallenge ? `
        <div class="mt-40 p-12 md:p-24 rounded-[4rem] bg-slate-50 border border-slate-200 dark:bg-white/5 dark:border-white/5 relative overflow-hidden">
            <div class="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 blur-[100px] rounded-full"></div>
            <div class="relative z-10 space-y-12">
                <div class="space-y-4">
                    <div class="text-[10px] font-black uppercase tracking-widest text-amber-500">Skillshare Challenge</div>
                    <h3 class="text-5xl font-black tracking-tighter">${lesson.handsOnChallenge.objective}</h3>
                </div>
                <div class="grid md:grid-cols-2 gap-12">
                    <div class="space-y-6">
                        ${(lesson.handsOnChallenge.steps || []).map((s: string, i: number) => `
                            <div class="flex gap-4">
                                <span class="text-amber-500 font-black">${i + 1}.</span>
                                <p class="text-lg font-light">${s}</p>
                            </div>
                        `).join('')}
                    </div>
                    <div class="p-8 bg-white dark:bg-black/20 rounded-3xl border border-slate-100 dark:border-white/5 h-fit">
                        <div class="text-[9px] font-black uppercase tracking-widest mb-2 opacity-40">Deliverable</div>
                        <p class="text-2xl font-black">${lesson.handsOnChallenge.deliverables}</p>
                    </div>
                </div>
            </div>
        </div>
      ` : ''}

      <!-- Directorial Brief (Video Script) -->
      ${lesson.videoScript ? `
        <div class="mb-40 p-12 md:p-20 rounded-[3rem] bg-indigo-900/10 border border-indigo-500/20 text-slate-800 dark:text-white">
            <h3 class="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-500 mb-8">System Audio Matrix: Directorial Brief</h3>
            <div class="text-2xl font-light italic leading-relaxed opacity-80">
                "${lesson.videoScript}"
            </div>
        </div>
      ` : ''}

      <!-- Interactive Quiz Fallback (Static) -->
      ${(lesson as any).quiz ? `
        <div class="mt-40 space-y-16">
            <div class="text-center">
                <div class="text-[10px] font-black uppercase tracking-widest text-violet-500 mb-4">Competency Assessment</div>
                <h3 class="text-5xl font-black tracking-tighter italic">Strategic Validation</h3>
            </div>
            <div class="space-y-8 max-w-4xl mx-auto">
                ${(lesson as any).quiz.questions.map((q: any, qIdx: number) => `
                    <div class="p-12 rounded-[2.5rem] bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                        <div class="flex justify-between mb-8">
                            <span class="text-[10px] font-black uppercase tracking-widest opacity-40">Segment ${qIdx + 1}</span>
                            <span class="text-[9px] font-black uppercase bg-violet-500/10 text-violet-500 px-3 py-1 rounded-full">${q.difficulty}</span>
                        </div>
                        <h4 class="text-2xl font-black mb-10">${q.question}</h4>
                        <div class="grid gap-4">
                            ${q.options.map((opt: string) => `
                                <div class="p-6 rounded-2xl border border-slate-200 dark:border-white/5 font-bold text-lg">${opt}</div>
                            `).join('')}
                        </div>
                        <div class="mt-10 pt-10 border-t border-slate-200 dark:border-white/5 opacity-60 italic text-lg">
                            <strong>Self-Correction Guide:</strong> ${q.explanation} (Answer: ${q.answer})
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
      ` : ''}

      <!-- Synthesis Footer -->
      <footer class="mt-48 pt-32 border-t border-slate-200 dark:border-slate-800">
        <div class="bg-gradient-to-br from-violet-600 to-indigo-800 rounded-[4rem] p-12 md:p-24 text-white relative overflow-hidden">
            <div class="relative z-10 grid md:grid-cols-2 gap-16">
                <div class="space-y-8">
                    <h3 class="text-4xl font-black tracking-tighter">Summary Checklist</h3>
                    <div class="space-y-6">
                        ${safeTakeaways.map((t: string) => `
                            <div class="flex gap-4">
                                <span class="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold">✓</span>
                                <p class="text-xl font-light leading-snug">${t}</p>
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div class="flex flex-wrap gap-4 items-end justify-end opacity-40">
                    ${safeImages.slice(safeSections.length).map(img => `
                        <div class="h-32 w-32 rounded-3xl overflow-hidden border border-white/20">
                            <img src="${img.url}" class="w-full h-full object-cover grayscale" />
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
      </footer>
    </div>

    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;700;900&display=swap');
      body { font-family: 'Inter', sans-serif; background: transparent; }
      .master-lesson-container { line-height: 1.6; }
      p { margin-bottom: 2rem; }
      strong { color: #8b5cf6; font-weight: 900; }
      blockquote { 
        border-left: 4px solid #8b5cf6; 
        padding-left: 2rem; 
        font-style: italic; 
        margin: 3rem 0;
        color: rgba(139, 92, 246, 0.8);
      }
    </style>
  `;
}
