/**
 * MARP Slide Generator — AI Bytes Learning
 *
 * Generates a self-contained MARP .md slide deck for a course.
 * The file is uploaded to Supabase Storage and the URL is saved to courses.slides_url.
 *
 * Architecture:
 *   1. Fetch all course data (topics, lessons, quiz questions, key terms)
 *   2. Build the Gemini prompt using getMarpSlidesPrompt()
 *   3. Call Gemini 2.0 Flash — model generates slide content only
 *   4. Prepend locked front matter (CSS + logo) using buildMarpFrontMatter()
 *   5. Upload .md to Supabase Storage (course-images/slides/)
 *   6. Update courses.slides_url and courses.slides_generated_at
 *   7. Return the public URL
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { createClient } from '@supabase/supabase-js';
import { buildMarpFrontMatter, getMarpSlidesPrompt } from './prompts/marp-slides-prompt';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const OPENROUTER_MODEL = 'deepseek/deepseek-v3.2';
const STORAGE_BUCKET = 'course-images';
const STORAGE_PREFIX = 'slides';

// ─── Supabase admin client (service role — bypasses RLS) ─────────────────────
function getSupabaseAdmin() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    return createClient(url, key);
}

// ─── Upload logo to Supabase Storage and return its public HTTPS URL ─────────
// Using a public HTTPS URL means the logo works in ALL contexts:
//   - marp-cli PDF/PPTX rendering (Chromium loads HTTPS fine)
//   - Downloaded .md files opened in any MARP viewer
//   - No path encoding issues with Windows spaces
// The logo is uploaded once (upsert:false skips re-upload if it already exists).
async function getLogoPublicUrl(): Promise<string> {
    const STORAGE_PATH = 'branding/ai-bytes-logo-light.png';
    try {
        const supabase = getSupabaseAdmin();
        const localPath = path.join(process.cwd(), 'public', 'logos', 'ai-bytes-logo-light.png');

        if (fs.existsSync(localPath)) {
            const pngBuffer = fs.readFileSync(localPath);
            // upsert:false — skips upload silently if file already exists
            await supabase.storage
                .from(STORAGE_BUCKET)
                .upload(STORAGE_PATH, pngBuffer, { contentType: 'image/png', upsert: false });
        }

        const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(STORAGE_PATH);
        return data.publicUrl;
    } catch {
        console.warn('[generateSlides] Could not upload/resolve logo — footer will be blank');
        return '';
    }
}

// ─── Fetch all course data needed for slide generation ───────────────────────
async function fetchCourseData(courseId: string) {
    const supabase = getSupabaseAdmin();

    // Course metadata
    const { data: course, error: courseErr } = await supabase
        .from('courses')
        .select('id, title, description, difficulty_level, category')
        .eq('id', courseId)
        .single();

    if (courseErr || !course) {
        throw new Error(`[generateSlides] Course not found: ${courseId}`);
    }

    // Topics with lessons
    const { data: topics, error: topicsErr } = await supabase
        .from('course_topics')
        .select(`
            id,
            title,
            description,
            order_index,
            course_lessons (
                id,
                title,
                content_markdown,
                order_index
            )
        `)
        .eq('course_id', courseId)
        .order('order_index');

    if (topicsErr || !topics) {
        throw new Error(`[generateSlides] Topics fetch failed: ${topicsErr?.message}`);
    }

    // Quiz questions (one per topic, for knowledge check slides)
    const topicIds = topics.map(t => t.id);
    const { data: quizzes } = await supabase
        .from('course_quizzes')
        .select(`
            topic_id,
            quiz_questions (
                question_text,
                options,
                correct_answer,
                explanation
            )
        `)
        .in('topic_id', topicIds);

    // Build a map: topicId → first quiz question
    const quizMap = new Map<string, {
        question: string;
        options: string[];
        correctIndex: number;
        explanation: string;
    }>();

    if (quizzes) {
        for (const quiz of quizzes) {
            const questions = (quiz as any).quiz_questions as any[] | null;
            if (!questions || questions.length === 0) continue;
            const q = questions[0];
            const options: string[] = Array.isArray(q.options) ? q.options : Object.values(q.options || {});
            const correctIndex = options.findIndex(
                (opt: string) => opt === q.correct_answer
            );
            quizMap.set(quiz.topic_id, {
                question: q.question_text,
                options,
                correctIndex: correctIndex >= 0 ? correctIndex : 0,
                explanation: q.explanation || '',
            });
        }
    }

    // Fetch lesson images (first image per lesson — used in slide bg)
    const allLessonIds = topics.flatMap(t =>
        ((t.course_lessons as any[]) || []).map((l: any) => l.id)
    );
    const { data: lessonImages } = allLessonIds.length
        ? await supabase
            .from('lesson_images')
            .select('lesson_id, image_url')
            .in('lesson_id', allLessonIds)
            .order('order_index', { ascending: true })
        : { data: [] };

    const imageMap = new Map<string, string>();
    if (lessonImages) {
        for (const img of lessonImages) {
            if (!imageMap.has(img.lesson_id) && img.image_url) {
                imageMap.set(img.lesson_id, img.image_url);
            }
        }
    }

    // Estimate duration and XP
    const totalLessons = topics.reduce((acc, t) => acc + (t.course_lessons?.length || 0), 0);
    const estimatedMinutes = Math.round(totalLessons * 4); // ~4 min per lesson
    const totalXp = totalLessons * 50;

    // Build structured topic list for the prompt
    const structuredTopics = topics.map(topic => {
        const lessons = ((topic.course_lessons as any[]) || [])
            .sort((a, b) => a.order_index - b.order_index)
            .map(lesson => ({
                title: lesson.title,
                contentSummary: summariseContent(lesson.content_markdown || ''),
                position: lesson.order_index,
                imageUrl: imageMap.get(lesson.id) ?? null,
            }));

        return {
            title: topic.title,
            description: (topic as any).description || '',
            position: topic.order_index,
            lessons,
            quizQuestion: quizMap.get(topic.id),
            keyTerms: undefined, // reserved for future use
        };
    });

    return {
        course,
        structuredTopics,
        totalTopics: topics.length,
        estimatedMinutes,
        totalXp,
    };
}

// ─── Summarise lesson content to a short prompt-friendly string ───────────────
// Strips markdown formatting and truncates to ~300 chars so the prompt stays lean.
function summariseContent(markdown: string): string {
    return markdown
        .replace(/```[\s\S]*?```/g, '')      // strip code blocks
        .replace(/#{1,6}\s/g, '')             // strip headings
        .replace(/\*\*|__|\*|_|`/g, '')       // strip inline formatting
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // strip links
        .replace(/\n+/g, ' ')                 // collapse newlines
        .replace(/\s+/g, ' ')
        .trim()
        .substring(0, 300);
}

// ─── Call OpenRouter (DeepSeek v3.2) to generate slide content ───────────────
// Mirrors the exact pattern used in agent-system-v2.ts — same model, headers,
// retry logic, and timeout so behaviour is consistent with the main pipeline.
async function callModel(prompt: string): Promise<string> {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) throw new Error('[generateSlides] OPENROUTER_API_KEY not set');

    const MAX_RETRIES = 3;
    const TIMEOUT_MS = 120_000;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

        try {
            const response = await fetch(OPENROUTER_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`,
                    'HTTP-Referer': 'http://localhost:3000',
                },
                body: JSON.stringify({
                    model: OPENROUTER_MODEL,
                    temperature: 0.4,
                    max_tokens: 8000,
                    provider: { sort: 'throughput' },
                    messages: [{ role: 'user', content: prompt }],
                }),
                signal: controller.signal,
            });
            clearTimeout(timeoutId);

            if (response.status === 429 || response.status === 503) {
                const delay = attempt * 3000;
                console.warn(`[generateSlides] ${response.status} — retrying in ${delay}ms (attempt ${attempt}/${MAX_RETRIES})`);
                await new Promise(r => setTimeout(r, delay));
                continue;
            }

            if (!response.ok) {
                const err = await response.text();
                throw new Error(`[generateSlides] OpenRouter ${response.status}: ${err}`);
            }

            const data = await response.json();
            const text: string = data.choices?.[0]?.message?.content ?? '';

            if (!text || text.trim().length < 100) {
                throw new Error('[generateSlides] Model returned empty or too-short response');
            }

            return text.trim();

        } catch (err: any) {
            clearTimeout(timeoutId);
            if (err.name === 'AbortError') {
                throw new Error('[generateSlides] Request timed out after 120s');
            }
            if (attempt === MAX_RETRIES) throw err;
            await new Promise(r => setTimeout(r, attempt * 2000));
        }
    }

    throw new Error('[generateSlides] All retries exhausted');
}

// ─── Convert .md to PDF or PPTX using marp-cli ───────────────────────────────
type MarpFormat = 'pdf' | 'pptx';

async function convertWithMarp(markdownContent: string, format: MarpFormat): Promise<Buffer | null> {
    const { marpCli } = await import('@marp-team/marp-cli');
    const tmpId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const tmpDir = os.tmpdir();
    const inputPath = path.join(tmpDir, `marp-${tmpId}.md`);
    const outputPath = path.join(tmpDir, `marp-${tmpId}.${format}`);
    const logoTempPath = path.join(tmpDir, `marp-${tmpId}-logo.png`);
    const imageTmpPaths: string[] = [];

    try {
        let mdContent = markdownContent;

        // ── 1. Localise logo ──────────────────────────────────────────────────
        // Copy logo to temp dir — avoids HTTPS network dependency and Windows
        // path-with-spaces encoding issues during Chromium rendering.
        const localLogoPath = path.join(process.cwd(), 'public', 'logos', 'ai-bytes-logo-light.png');
        if (fs.existsSync(localLogoPath)) {
            fs.copyFileSync(localLogoPath, logoTempPath);
            const logoLocalUrl = `file:///${logoTempPath.replace(/\\/g, '/')}`;
            mdContent = mdContent.replace(
                /url\(['"]https?:\/\/[^'"]*ai-bytes-logo[^'"]*['"]\)/gi,
                `url('${logoLocalUrl}')`,
            );
        }

        // ── 2. Predownload all slide background images ────────────────────────
        // marp-cli's Chromium instance may not fetch remote HTTPS images reliably
        // (sandbox restrictions, CORS, latency). We download every unique image
        // URL to a temp file and substitute file:// paths before conversion.
        const bgImageRegex = /!\[bg[^\]]*\]\((https?:\/\/[^)]+)\)/g;
        const uniqueUrls = [...new Set(
            [...markdownContent.matchAll(bgImageRegex)].map(m => m[1])
        )];

        if (uniqueUrls.length > 0) {
            const urlToLocal = new Map<string, string>();

            await Promise.all(uniqueUrls.map(async (url, i) => {
                try {
                    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
                    if (!res.ok) {
                        console.warn(`[generateSlides] Image fetch ${res.status}: ${url}`);
                        return;
                    }
                    const ext = (url.split('.').pop()?.split('?')[0] ?? 'jpg').slice(0, 5);
                    const imgTmpPath = path.join(tmpDir, `marp-img-${tmpId}-${i}.${ext}`);
                    fs.writeFileSync(imgTmpPath, Buffer.from(await res.arrayBuffer()));
                    imageTmpPaths.push(imgTmpPath);
                    urlToLocal.set(url, `file:///${imgTmpPath.replace(/\\/g, '/')}`);
                    console.log(`[generateSlides] Image localised: ${url.split('/').pop()}`);
                } catch (err) {
                    console.warn(`[generateSlides] Could not predownload image: ${url}`, err);
                }
            }));

            // Replace every occurrence of each downloaded URL in the markdown
            for (const [url, localPath] of urlToLocal) {
                mdContent = mdContent.replaceAll(url, localPath);
            }
        }

        fs.writeFileSync(inputPath, mdContent, 'utf-8');

        const args = [
            inputPath,
            '--output', outputPath,
            '--allow-local-files',
        ];

        if (format === 'pdf') args.push('--pdf');
        if (format === 'pptx') args.push('--pptx');

        const exitCode = await marpCli(args);

        if (exitCode !== 0) {
            console.error(`[generateSlides] marp-cli exited with code ${exitCode} for ${format}`);
            return null;
        }

        if (!fs.existsSync(outputPath)) {
            console.error(`[generateSlides] marp-cli produced no output file for ${format}`);
            return null;
        }

        return fs.readFileSync(outputPath);

    } catch (err) {
        console.error(`[generateSlides] marp-cli conversion failed for ${format}:`, err);
        return null;
    } finally {
        if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
        if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
        if (fs.existsSync(logoTempPath)) fs.unlinkSync(logoTempPath);
        for (const p of imageTmpPaths) {
            if (fs.existsSync(p)) fs.unlinkSync(p);
        }
    }
}

// ─── Upload a file to Supabase Storage ───────────────────────────────────────
async function uploadBuffer(
    courseId: string,
    buffer: Buffer,
    filename: string,
    contentType: string,
): Promise<string | null> {
    const supabase = getSupabaseAdmin();
    const filePath = `${STORAGE_PREFIX}/${filename}`;

    const { error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(filePath, buffer, { contentType, upsert: true });

    if (error) {
        console.error(`[generateSlides] Upload failed for ${filename}:`, error.message);
        return null;
    }

    const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filePath);
    return data.publicUrl;
}

// ─── Update the courses table ─────────────────────────────────────────────────
async function saveSlidesUrls(courseId: string, urls: {
    slides_url?: string;
    slides_pdf_url?: string;
    slides_pptx_url?: string;
}): Promise<void> {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase
        .from('courses')
        .update({ ...urls, slides_generated_at: new Date().toISOString() })
        .eq('id', courseId);

    if (error) {
        console.error('[generateSlides] Failed to save slide URLs to courses table:', error.message);
    }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Generate a MARP slide deck for the given course and store it in Supabase.
 * Produces three formats: Markdown (.md), PDF, and PowerPoint (.pptx).
 *
 * @returns The public URL of the generated .md file, or null on failure.
 */
export async function generateSlides(courseId: string): Promise<string | null> {
    console.log(`[generateSlides] Starting for course: ${courseId}`);

    try {
        // 1. Fetch course data
        const { course, structuredTopics, totalTopics, estimatedMinutes, totalXp } =
            await fetchCourseData(courseId);

        // 2. Build prompt
        const prompt = getMarpSlidesPrompt({
            courseTitle: course.title,
            courseDescription: course.description || '',
            category: course.category || 'AI & Machine Learning',
            difficulty: course.difficulty_level || 'Beginner',
            topics: structuredTopics,
            totalTopics,
            estimatedMinutes,
            totalXp,
        });

        // 3. Call model — generates slide content only (no front matter)
        console.log('[generateSlides] Calling model...');
        const slideContent = await callModel(prompt);

        // 4. Build locked front matter with logo (public HTTPS URL — works everywhere)
        const logoUrl = await getLogoPublicUrl();
        const frontMatter = buildMarpFrontMatter(logoUrl);

        // 5. Assemble the final self-contained .md file
        const fullDeck = `${frontMatter}\n\n${slideContent}`;

        // 6. Upload Markdown (.md)
        console.log('[generateSlides] Uploading Markdown...');
        const slug = course.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '')
            .substring(0, 60);
        const mdFilename = `${courseId}-${slug}.md`;
        const mdBuffer = Buffer.from(fullDeck, 'utf-8');
        const slidesUrl = await uploadBuffer(courseId, mdBuffer, mdFilename, 'text/markdown');

        // 7. Convert and upload PDF
        console.log('[generateSlides] Converting to PDF...');
        const pdfBuffer = await convertWithMarp(fullDeck, 'pdf');
        let slidesPdfUrl: string | null = null;
        if (pdfBuffer) {
            slidesPdfUrl = await uploadBuffer(courseId, pdfBuffer, `${courseId}-${slug}.pdf`, 'application/pdf');
        } else {
            console.warn('[generateSlides] PDF conversion returned null — skipping PDF upload');
        }

        // 8. Convert and upload PowerPoint
        console.log('[generateSlides] Converting to PPTX...');
        const pptxBuffer = await convertWithMarp(fullDeck, 'pptx');
        let slidesPptxUrl: string | null = null;
        if (pptxBuffer) {
            slidesPptxUrl = await uploadBuffer(
                courseId,
                pptxBuffer,
                `${courseId}-${slug}.pptx`,
                'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            );
        } else {
            console.warn('[generateSlides] PPTX conversion returned null — skipping PPTX upload');
        }

        // 9. Save all URLs to courses table
        await saveSlidesUrls(courseId, {
            ...(slidesUrl ? { slides_url: slidesUrl } : {}),
            ...(slidesPdfUrl ? { slides_pdf_url: slidesPdfUrl } : {}),
            ...(slidesPptxUrl ? { slides_pptx_url: slidesPptxUrl } : {}),
        });

        console.log(`[generateSlides] Done. MD: ${slidesUrl} | PDF: ${slidesPdfUrl} | PPTX: ${slidesPptxUrl}`);
        return slidesUrl;

    } catch (err) {
        console.error('[generateSlides] Failed:', err);
        return null;
    }
}
