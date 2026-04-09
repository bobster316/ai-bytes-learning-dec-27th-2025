import { createClient } from '@supabase/supabase-js';
import { logMediaToRegistry } from '@/lib/utils/registry';
import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';
import sharp from 'sharp';
import { geminiImageService } from './gemini-image-service';
import { falImageService } from './fal-image-service';
import { diagramGenerator } from '@/lib/diagrams/diagram-generator';
import { CourseState } from './course-state';
import {
    classifyCategory,
    buildBackgroundPrompt,
    splitTitleLines,
    rewriteTitleForThumbnail,
    THUMBNAIL_CATEGORIES,
    type ThumbnailCategory,
} from './thumbnail-system';

const PEXELS_API_KEY = process.env.PEXELS_API_KEY;
const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;
const MIDJOURNEY_API_KEY = process.env.MIDJOURNEY_API_KEY;
const HUGGINGFACE_API_TOKEN = process.env.HUGGINGFACE_API_TOKEN;
const RUNWAY_API_SECRET = process.env.RUNWAY_API_SECRET;
const RUNWAY_API_URL = process.env.RUNWAY_API_URL;

const openai = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null;

export interface LessonImage {
    url: string;
    alt: string;
    caption: string;
}

export class MediaService {
    // In-memory cache for the current session to reduce DB hits
    private sessionUsedIds: Set<string> = new Set();
    // Initialize Supabase client with Service Role Key for Admin access (bypass RLS for global uniqueness check)
    // Fallback to Anon key if Service Role is missing (though uniqueness check might be limited by RLS)
    private supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    );

    /**
     * Checks if a media ID or URL has explicitly been used in the DB or File Registry.
     */
    private async isMediaUsed(id: string, url: string): Promise<boolean> {
        if (this.sessionUsedIds.has(id)) return true;

        // 1. Check File Registry (Compliance)
        if (this.checkRegistryFile(id)) {
            this.sessionUsedIds.add(id);
            return true;
        }

        // 2. Check Course Thumbnails (DB)
        const { count: courseCount } = await this.supabase
            .from('courses')
            .select('id', { count: 'exact', head: true })
            .ilike('image_url', `%${id}%`); // loose match on ID

        if (courseCount && courseCount > 0) {
            this.sessionUsedIds.add(id);
            return true;
        }

        // 3. Check Lesson Images (DB)
        const { count: lessonCount } = await this.supabase
            .from('lesson_images')
            .select('id', { count: 'exact', head: true })
            .ilike('image_url', `%${id}%`);

        if (lessonCount && lessonCount > 0) {
            this.sessionUsedIds.add(id);
            return true;
        }

        return false;
    }

    private checkRegistryFile(id: string): boolean {
        try {
            const registryPath = path.join(process.cwd(), 'media-registry.json');
            if (fs.existsSync(registryPath)) {
                const raw = fs.readFileSync(registryPath, 'utf-8');
                // Simple string include for speed, strictly we should parse JSON
                return raw.includes(`"id": "${id}"`);
            }
        } catch (e) {
            // Ignore checks if fs fails
        }
        return false;
    }

    private getMediaId(url: string, providerId?: string): string {
        if (providerId) return providerId;
        // Try to extract from URL
        if (url.includes('pexels.com')) {
            const match = url.match(/\/photos\/(\d+)\//);
            if (match) return match[1];
        }
        if (url.includes('unsplash.com')) {
            const match = url.match(/photo-([a-zA-Z0-9-]+)/);
            if (match) return match[1];
        }
        return url; // Fallback to full URL
    }

    /**
     * Search Pexels for images to ensure relevance and quality.
     * Falls back to Unsplash if Pexels fails or yields no results.
     */
    async fetchImages(prompts: { prompt: string, domain?: string }[], courseState: CourseState | null = null): Promise<LessonImage[]> {
        const results: LessonImage[] = [];

        let index = 0;
        for (const input of prompts) {
            const rawPrompt = input.prompt;
            const domain = input.domain || 'Generic';
            
            // Check if it's a diagram
            const tier1Keywords = [
                'flowchart', 'timeline', 'comparison chart', 'pie chart', 
                'bar graph', 'org chart', 'mind map', 'cycle diagram', 
                'venn diagram', 'funnel', 'comparison'
            ];
            
            const isDiagram = tier1Keywords.some(keyword => rawPrompt.toLowerCase().includes(keyword));

            if (isDiagram) {
                // Determine layout type based on keywords
                let layout: any = 'concept-map';
                if (rawPrompt.toLowerCase().includes('neural')) layout = 'neural-network';
                else if (rawPrompt.toLowerCase().includes('flowchart') || rawPrompt.toLowerCase().includes('process')) layout = 'flowchart';
                else if (rawPrompt.toLowerCase().includes('timeline')) layout = 'timeline';
                else if (rawPrompt.toLowerCase().includes('cycle')) layout = 'cycle';
                else if (rawPrompt.toLowerCase().includes('comparison')) layout = 'comparison';
                else if (rawPrompt.toLowerCase().includes('funnel')) layout = 'funnel';
                else if (rawPrompt.toLowerCase().includes('mind map')) layout = 'mindmap';
                else if (rawPrompt.toLowerCase().includes('venn')) layout = 'venn';
                
                let svgContent = await diagramGenerator.generate(layout, {
                    title: rawPrompt.length > 50 ? rawPrompt.substring(0, 50) + '...' : rawPrompt,
                    domain: domain
                });

                const base64Svg = Buffer.from(svgContent).toString('base64');
                results.push({
                    url: `data:image/svg+xml;base64,${base64Svg}`,
                    alt: "Professional Diagram: " + rawPrompt,
                    caption: "Technical visualization of " + rawPrompt
                });
                
            } else {
                // Strict Image Waterfall: Primary -> Fallback Noun -> Domain Object -> Unsplash -> SVG
                const image = await this.executeStrictImageWaterfall(rawPrompt, domain, courseState);
                results.push(image);
            }
        }
        return results;
    }
    
    private async executeStrictImageWaterfall(prompt: string, domain: string, courseState: CourseState | null): Promise<LessonImage> {
        let avoidedUrls = courseState ? courseState.used_image_urls : [];
        const originalQuery = this.extractSearchQuery(prompt);
        
        // 0. Primary AI Generation (Fal.ai FLUX 2 Pro + Asset Library Caching)
        try {
            const falResult = await falImageService.generateImage(prompt, originalQuery);
            if (falResult.url) {
                return {
                    url: falResult.url,
                    alt: originalQuery,
                    caption: originalQuery
                };
            }
        } catch (e) {
            console.error('[MediaService] falImageService failed, falling back to stock:', e);
        }

        // 1. Primary Query
        const primary = await this.searchPexelsImage(originalQuery, 1, avoidedUrls);
        if (primary) return primary;
        
        // 2. Fallback Query (Noun extraction / highly simplified)
        const fallbackQuery = originalQuery.split(' ').slice(-2).join(' '); // last 2 words hoping for nouns
        if (fallbackQuery && fallbackQuery !== originalQuery) {
            const fallback = await this.searchPexelsImage(fallbackQuery, 1, avoidedUrls);
            if (fallback) return fallback;
        }

        // 3. Domain Object Query
        const domainQuery = domain !== 'Generic' ? domain : 'Technology abstract';
        const domainImg = await this.searchPexelsImage(domainQuery, 1, avoidedUrls);
        if (domainImg) return domainImg;
        
        // 4. Cross Provider (Unsplash)
        const unsplashPrimary = await this.searchUnsplashImage(originalQuery, 1, avoidedUrls);
        if (unsplashPrimary) return unsplashPrimary;
        
        const unsplashDomain = await this.searchUnsplashImage(domainQuery, 1, avoidedUrls);
        if (unsplashDomain) return unsplashDomain;
        
        // 5. SVG Fallback (Total failure)
        let svgContent = await diagramGenerator.generate('concept-map', {
            title: originalQuery.substring(0, 30),
            domain: domain
        });
        const base64Svg = Buffer.from(svgContent).toString('base64');
        return {
            url: `data:image/svg+xml;base64,${base64Svg}`,
            alt: "Fallback Visual",
            caption: originalQuery
        };
    }

    /**
     * Sanitises search queries by stripping banned terms and extracting concrete nouns.
     */
    private sanitiseQuery(query: string): string {
        const bannedTerms = [
            'technology', 'ai', 'artificial intelligence', 'digital', 'tech', 
            'machine learning', 'computer', 'software', 'data', 'algorithm', 
            'neural', 'cyber', 'virtual', 'cloud computing',
            'abstract', 'concept of', 'illustration of', 'representation of', 
            'visualisation of', 'metaphor for', 'symbol of',
            'showing', 'depicting', 'representing', 'symbolising', 'illustrating', 
            'demonstrating', 'conveying'
        ];

        let sanitized = query;
        for (const term of bannedTerms) {
            const regex = new RegExp(`\\b${term}\\b`, 'gi');
            sanitized = sanitized.replace(regex, '');
        }

        // Clean up extra spaces
        sanitized = sanitized.replace(/\s+/g, ' ').trim();
        
        // Truncate to first 4 words for better search matches if still long
        const words = sanitized.split(' ');
        if (words.length > 5) {
            sanitized = words.slice(0, 4).join(' ');
        }
        
        return sanitized || query.substring(0, 40);
    }

    /**
     * Extracts a concise search term from a verbose AI imagePrompt.
     * e.g. "A photorealistic 8k render of neural networks glowing..." → "neural networks"
     */
    private extractSearchQuery(prompt: string): string {
        let q = prompt
            // Strip common generative prefixes
            .replace(/^(a|an)\s+(photorealistic|cinematic|8k|digital|professional|high-quality|stunning|beautiful|dramatic|futuristic)\s+(render|image|photo|illustration|visualization|depiction)?\s*(of\s*)?/gi, '')
            .replace(/^(photo|image|illustration|render|visualization|depiction)\s+of\s+/gi, '')
            // Strip quality suffixes
            .replace(/\s+(8k|hdr|cinematic|photorealistic|dramatic lighting|ultra-realistic|high resolution|studio lighting)[^,.;]*/gi, '');

        // Take up to first comma or 55 chars
        q = q.split(/[,;.]/)[0].trim().substring(0, 75);
        return this.sanitiseQuery(q);
    }

    /**
     * Fast parallel image fetch using Pexels/Unsplash only. Falls back to waterfall.
     */
    async fetchImagesParallel(prompts: { prompt: string, domain?: string }[], courseState: CourseState | null = null): Promise<LessonImage[]> {
        return Promise.all(prompts.map(p => this.executeStrictImageWaterfall(p.prompt, p.domain || 'Generic', courseState)));
    }

    /**
     * Search Pexels for a relevant video.
     */
    async fetchVideo(query: string): Promise<string | null> {
        if (!PEXELS_API_KEY) {
            console.warn('[MediaService] PEXELS_API_KEY missing, skipping video fetch.');
            return null;
        }

        try {
            // Fetch more results to increase chance of uniqueness
            const url = `https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&per_page=15&orientation=landscape&size=medium`;
            const res = await fetch(url, {
                headers: { Authorization: PEXELS_API_KEY }
            });

            if (!res.ok) throw new Error(`Pexels API error: ${res.status}`);

            const data = await res.json();

            // Check uniqueness against DB
            if (data.videos) {
                for (const video of data.videos) {
                    const videoId = video.id.toString();

                    // Check if used in DB
                    // Table: course_lessons, column: video_url
                    // We need to check if video_url contains this ID
                    const { count } = await this.supabase
                        .from('course_lessons')
                        .select('id', { count: 'exact', head: true })
                        .ilike('video_url', `%${videoId}%`);

                    if (count === 0 && !this.sessionUsedIds.has(videoId)) {
                        this.sessionUsedIds.add(videoId);
                        const file = video.video_files.find((f: any) => f.height >= 720) || video.video_files[0];
                        return file.link;
                    }
                }
            }

            return null;

        } catch (error) {
            console.error('[MediaService] Video fetch failed:', error);
            return null;
        }
    }

    private async generateOpenAIImage(prompt: string): Promise<LessonImage | null> {
        if (!openai) return null;

        try {
            console.log('[MediaService] Generating image with DALL-E 3:', prompt);

            let stylePrompt = "";

            if (prompt.includes("3D ISOMETRIC")) {
                stylePrompt = "High-end 3D isometric render, depth-rich, octane render style, clean background, highly detailed technical illustration.";
            } else if (prompt.includes("SPLIT-SCREEN")) {
                stylePrompt = "Split-screen comparison, distinct side-by-side elements, clear contrast, photorealistic composite.";
            } else if (prompt.includes("FUTURISTIC UI")) {
                stylePrompt = "Futuristic UI dashboard, glowing holograms, cyan and purple neon data visualization, high-tech HUD interface, black background.";
            } else {
                stylePrompt = "Digital illustration style, clean vector graphics, infographic quality, minimal aesthetic. Technical schematic with labels.";
            }

            const enhancedPrompt = `Professional educational visual: ${prompt}. ${stylePrompt} No text overlays unless specified.`;

            const response = await openai.images.generate({
                model: "dall-e-3",
                prompt: enhancedPrompt,
                n: 1,
                size: "1024x1024",
                response_format: "url",
                quality: "standard" // Standard is faster/cheaper for diagrams
            });

            if (response.data && response.data.length > 0 && response.data[0].url) {
                return {
                    url: response.data[0].url,
                    alt: prompt,
                    caption: prompt
                };
            }
        } catch (error) {
            console.error('[MediaService] DALL-E 3 generation failed:', error);
        }
        return null;
    }

    private async generateReplicateImage(prompt: string): Promise<LessonImage | null> {
        if (!REPLICATE_API_TOKEN) return null;

        try {
            // Educational diagram prompt for Replicate (Stable Diffusion XL)
            const educationalPrompt = `Educational technical diagram: ${prompt}, minimalist style, clean geometric shapes, textbook illustration, clear labels, professional, high contrast, simple design, suitable for learning materials, NOT artistic or abstract`;

            const response = await fetch('https://api.replicate.com/v1/predictions', {
                method: 'POST',
                headers: {
                    'Authorization': `Token ${REPLICATE_API_TOKEN}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    version: '39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b', // SDXL
                    input: {
                        prompt: educationalPrompt,
                        negative_prompt: 'portrait, person, face, artistic style, abstract art, photography, realistic photo, complex artistic details, painterly, impressionist, blurry, low quality',
                        width: 1024,
                        height: 1024,
                        num_outputs: 1,
                        scheduler: 'K_EULER',
                        guidance_scale: 7.5,
                        num_inference_steps: 50
                    }
                })
            });

            if (!response.ok) {
                console.error('[MediaService] Replicate API error:', response.status);
                return null;
            }

            const prediction = await response.json();

            // Poll for completion (Replicate is async)
            let result = prediction;
            let attempts = 0;
            while (result.status !== 'succeeded' && result.status !== 'failed' && attempts < 30) {
                await new Promise(resolve => setTimeout(resolve, 1000));
                const pollResponse = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
                    headers: { 'Authorization': `Token ${REPLICATE_API_TOKEN}` }
                });
                result = await pollResponse.json();
                attempts++;
            }

            if (result.status === 'succeeded' && result.output && result.output.length > 0) {
                return {
                    url: result.output[0],
                    alt: prompt,
                    caption: prompt
                };
            }
        } catch (error) {
            console.error('[MediaService] Replicate generation failed:', error);
        }
        return null;
    }

    private async generateMidjourneyImage(prompt: string): Promise<LessonImage | null> {
        if (!MIDJOURNEY_API_KEY) return null;

        try {
            // Educational diagram prompt for Midjourney
            const educationalPrompt = `${prompt} --style educational diagram, technical illustration, minimalist, clean, geometric, textbook style, professional --no portrait, person, face, artistic, abstract, photo, complex details --ar 16:9 --v 6`;

            const response = await fetch('https://api.midjourneyapi.xyz/mj/v2/imagine', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-KEY': MIDJOURNEY_API_KEY
                },
                body: JSON.stringify({
                    prompt: educationalPrompt,
                    process_mode: 'fast'
                })
            });

            if (!response.ok) {
                console.error('[MediaService] Midjourney API error:', response.status);
                return null;
            }

            const result = await response.json();

            if (result.success && result.task_id) {
                // Poll for result
                let imageUrl = null;
                let attempts = 0;
                while (!imageUrl && attempts < 60) {
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    const statusResponse = await fetch(`https://api.midjourneyapi.xyz/mj/v2/fetch?task_id=${result.task_id}`, {
                        headers: { 'X-API-KEY': MIDJOURNEY_API_KEY }
                    });
                    const status = await statusResponse.json();

                    if (status.status === 'finished' && status.task_result?.image_url) {
                        imageUrl = status.task_result.image_url;
                    } else if (status.status === 'failed') {
                        break;
                    }
                    attempts++;
                }

                if (imageUrl) {
                    return {
                        url: imageUrl,
                        alt: prompt,
                        caption: prompt
                    };
                }
            }
        } catch (error) {
            console.error('[MediaService] Midjourney generation failed:', error);
        }
        return null;
    }

    private async searchPexelsImage(query: string, page: number = 1, avoidedUrls: string[] = []): Promise<LessonImage | null> {
        if (!PEXELS_API_KEY) return null;

        try {
            const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=10&page=${page}&orientation=landscape`;
            const res = await fetch(url, {
                headers: { Authorization: PEXELS_API_KEY }
            });

            if (!res.ok) return null;
            const data = await res.json();

            if (data.photos && data.photos.length > 0) {
                // Find first photo not in avoidedUrls AND not in the current session set
                const validPhoto = data.photos.find((p: any) => 
                    !avoidedUrls.includes(p.src.large) && 
                    !avoidedUrls.includes(p.src.large2x) &&
                    !this.sessionUsedIds.has(p.id.toString())
                );
                const photo = validPhoto || data.photos[0]; // fallback to first if all used (graceful degradation)
                
                this.sessionUsedIds.add(photo.id.toString());
                await logMediaToRegistry(photo.src.large2x || photo.src.large, query); // log to file registry
                
                return {
                    url: photo.src.large2x || photo.src.large,
                    alt: photo.alt || query,
                    caption: query
                };
            }
        } catch (e) {
            console.error('[MediaService] Pexels search error:', e);
        }
        return null;
    }

    private async searchUnsplashImage(query: string, page: number = 1, avoidedUrls: string[] = []): Promise<LessonImage | null> {
        if (!UNSPLASH_ACCESS_KEY) return null;

        try {
            const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=10&page=${page}&orientation=landscape`;
            const res = await fetch(url, {
                headers: { Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}` }
            });

            if (!res.ok) return null;
            const data = await res.json();

            if (data.results && data.results.length > 0) {
                const validPhoto = data.results.find((p: any) => 
                    !avoidedUrls.includes(p.urls.regular) &&
                    !this.sessionUsedIds.has(p.id.toString())
                );
                const photo = validPhoto || data.results[0];
                
                this.sessionUsedIds.add(photo.id.toString());
                await logMediaToRegistry(photo.urls.regular, query);
                
                return {
                    url: photo.urls.regular,
                    alt: photo.alt_description || query,
                    caption: photo.description || query
                };
            }
        } catch (e) {
            console.error('[MediaService] Unsplash search error:', e);
        }
        return null;
    }

    // ─── NEW: Brief-compliant thumbnail generation ───────────────────────────────

    /**
     * Generates a course thumbnail following AI_Bytes_Thumbnail_Brief_for_Antigravity v1.0.
     *
     * Flow:
     *   1. Classify course into one of 6 topic categories
     *   2. Generate gradient + abstract art background via DALL-E 3
     *      (fallback: pure SVG gradient if DALL-E unavailable)
     *   3. Composite all 7 brand zones onto the background with sharp/SVG:
     *      Zone 1 — category pill (top-left)
     *      Zone 2 — AI Bytes badge (top-right)
     *      Zone 5 — micro-course label + 2-line title (bottom-left)
     *      Zone 6 — play button ring (bottom-right)
     */
    async fetchCourseThumbnail(
        title: string,
        description?: string,
        _customPrompt?: string,
        categoryHint?: string,
        difficulty?: string,
    ): Promise<string> {
        const category = classifyCategory(title, description || '', categoryHint);
        const cfg = THUMBNAIL_CATEGORIES[category];
        console.log(`[Thumbnail] Category: "${cfg.label}" for "${title}"`);

        // Step 1: Generate background art via DALL-E 3
        let backgroundBuffer: Buffer | null = null;

        if (openai) {
            try {
                const prompt = buildBackgroundPrompt(category);
                console.log(`[Thumbnail] Requesting DALL-E 3 background...`);
                const response = await openai.images.generate({
                    model: 'dall-e-3',
                    prompt,
                    n: 1,
                    size: '1792x1024', // closest 16:9 DALL-E 3 supports
                    quality: 'standard',
                    response_format: 'url',
                });
                const imageUrl = response.data?.[0]?.url;
                if (imageUrl) {
                    const imgRes = await fetch(imageUrl);
                    backgroundBuffer = Buffer.from(await imgRes.arrayBuffer());
                    console.log(`[Thumbnail] DALL-E 3 background received (${backgroundBuffer.length} bytes)`);
                }
            } catch (e) {
                console.warn(`[Thumbnail] DALL-E 3 failed, falling back to SVG gradient:`, e);
            }
        }

        // Step 2: Fallback — pure SVG gradient background (no external API needed)
        if (!backgroundBuffer) {
            backgroundBuffer = await this.generateGradientBackground(category);
            console.log(`[Thumbnail] Using SVG gradient fallback`);
        }

        // Step 3: Composite all brand zones using the actual course title
        try {
            return await this.compositeBrandLayer(title, backgroundBuffer, category, difficulty);
        } catch (e) {
            console.error('[Thumbnail] Brand layer composite failed:', e);
            // Last resort: upload the bare background
            const slug = title.toLowerCase().replace(/[^a-z0-9]/g, '-').substring(0, 40);
            const url = await geminiImageService.generateImageFromBuffer(backgroundBuffer, 'image/png', `thumb-${slug}`);
            return url || '';
        }
    }

    /**
     * Generates a pure SVG gradient background matching the brief's category palette.
     * Used as fallback when DALL-E 3 is unavailable.
     */
    private async generateGradientBackground(category: ThumbnailCategory): Promise<Buffer> {
        const cfg = THUMBNAIL_CATEGORIES[category];
        const W = 1280;
        const H = 720;

        // Minimal abstract art pattern in SVG (neural lattice nodes for all categories)
        const nodes: string[] = [];
        const seed = cfg.gradient.vivid.charCodeAt(1); // deterministic per category
        for (let i = 0; i < 28; i++) {
            const x = ((seed * (i * 137 + 31)) % W);
            const y = ((seed * (i * 89 + 53)) % H);
            const r = 2 + (i % 3);
            nodes.push(`<circle cx="${x}" cy="${y}" r="${r}" fill="white" opacity="0.15"/>`);
            if (i > 0) {
                const px = ((seed * ((i - 1) * 137 + 31)) % W);
                const py = ((seed * ((i - 1) * 89 + 53)) % H);
                nodes.push(`<line x1="${px}" y1="${py}" x2="${x}" y2="${y}" stroke="white" stroke-width="0.5" opacity="0.1"/>`);
            }
        }

        const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
<defs>
  <linearGradient id="bg" x1="0%" y1="100%" x2="100%" y2="0%">
    <stop offset="0%" stop-color="${cfg.gradient.dark}"/>
    <stop offset="60%" stop-color="${cfg.gradient.vivid}"/>
  </linearGradient>
  <radialGradient id="glow" cx="85%" cy="15%" r="45%">
    <stop offset="0%" stop-color="${cfg.radialGlow}" stop-opacity="0.35"/>
    <stop offset="100%" stop-color="${cfg.radialGlow}" stop-opacity="0"/>
  </radialGradient>
</defs>
<rect width="${W}" height="${H}" fill="url(#bg)"/>
<rect width="${W}" height="${H}" fill="url(#glow)"/>
${nodes.join('\n')}
</svg>`;

        return await sharp(Buffer.from(svg)).resize(W, H).png().toBuffer();
    }

    /**
     * Composites all 7 brand zones onto the background buffer per the brief.
     *
     * Fixes applied:
     * - SAFE = 80px (was 60px) — prevents border-radius clipping on card display
     * - Title capped at max 4 words per line via splitTitleLines
     * - Adaptive font size with hard ceiling of 76px to prevent overflow
     * - AI Bytes badge: larger, more opaque, clearly visible
     * - Play ring: 52px radius, brighter fill, fully visible
     * - MICRO-COURSE label: larger (24px) with stronger accent colour
     * - Title text area: explicit textLength attribute to prevent SVG overflow
     */
    private async compositeBrandLayer(
        title: string,
        backgroundBuffer: Buffer,
        category: ThumbnailCategory,
        difficulty?: string,
    ): Promise<string> {
        const cfg = THUMBNAIL_CATEGORIES[category];
        const W = 1280;
        const H = 720;

        // Two safe-zone constants per the brief + our card corner constraints:
        // PILL_SAFE: pill/badge/play ring — 140px clears rounded-t-3xl (24px) corner clip in
        //   catalog cards (397px wide). Math: √2×(140×397/1280 − 24) = 27.6 > 24 ✓
        // TEXT_SAFE: title text & MICRO-COURSE label — 60px per the brief's safe zone spec.
        //   Title is bottom-left; rounded-t-3xl only affects TOP corners so no clip risk.
        const PILL_SAFE = 140;
        const TEXT_SAFE = 60;

        // Load Montserrat font
        const fontsDir = path.join(process.cwd(), 'public', 'fonts');
        const montserratBase64 = (await fs.promises.readFile(path.join(fontsDir, 'montserrat-extrabold.ttf'))).toString('base64');

        const xmlEscape = (s: string) =>
            s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
             .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

        // ── Title: split to max 3 words per line ─────────────────────────────
        const { line1, line2 } = splitTitleLines(title);
        const titleL1 = xmlEscape(line1);
        const titleL2 = xmlEscape(line2);

        // ── Zone 2: AI Bytes badge (top-right) ───────────────────────────────
        const badgeW = 148;
        const badgeX = W - PILL_SAFE - badgeW;

        // Title zone width: full inner width from TEXT_SAFE to right TEXT_SAFE margin.
        // Badge is top-right, title is bottom-left — no vertical overlap, full width usable.
        const titleZoneWidth = W - 2 * TEXT_SAFE; // 1160px

        // Adaptive font size — brief spec: 26-30px at 480px display = ~70-80px at 1280px source.
        // CHAR_RATIO 0.55 matches Inter/DM Sans weight-500 average glyph width.
        // Ceiling 80px per brief; floor 48px.
        const CHAR_RATIO = 0.55;
        const longestLine = Math.max(line1.length, line2?.length || 0);
        const rawSize = longestLine > 0 ? Math.floor(titleZoneWidth / (longestLine * CHAR_RATIO)) : 80;
        const titleSize = Math.max(48, Math.min(80, rawSize));
        const lineH = Math.round(titleSize * 1.25);

        // ── Layout Y positions (brief: title in lower 40% of canvas) ─────────
        const microLabelSize = 22;
        const microLabelGap = 14;
        const titleBlockH = (line2 ? lineH * 2 : lineH) + microLabelSize + microLabelGap;
        const titleBlockY = H - TEXT_SAFE - titleBlockH;

        const microLabelY = titleBlockY + microLabelSize;
        const title1Y = microLabelY + microLabelGap + titleSize;
        const title2Y = title1Y + lineH;

        // ── Zone 1: Category pill (top-left) ─────────────────────────────────
        const pillLabel = xmlEscape(cfg.label);
        const pillW = Math.max(140, pillLabel.length * 9 + 56);

        // ── Zone 6: Play ring (bottom-right) ─────────────────────────────────
        const playR = 44;
        const playCx = W - PILL_SAFE - playR;
        const playCy = H - PILL_SAFE - playR;

        // Bottom legibility gradient starts at 45% height for stronger text readability
        const fadeY = Math.round(H * 0.45);

        const svgOverlay = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
<defs>
  <style>
    @font-face { font-family: 'Mont'; src: url('data:font/truetype;base64,${montserratBase64}') format('truetype'); font-weight: 800; }
  </style>
  <linearGradient id="bottomFade" x1="0%" y1="0%" x2="0%" y2="100%">
    <stop offset="0%" stop-color="#000000" stop-opacity="0"/>
    <stop offset="100%" stop-color="#000000" stop-opacity="0.82"/>
  </linearGradient>
</defs>

<!-- Bottom legibility gradient -->
<rect x="0" y="${fadeY}" width="${W}" height="${H - fadeY}" fill="url(#bottomFade)"/>

<!-- Zone 1: Category pill — top-left (PILL_SAFE to clear card corner radius) -->
<rect x="${PILL_SAFE}" y="${PILL_SAFE}" width="${pillW}" height="40" rx="20" fill="rgba(0,0,0,0.65)"/>
<circle cx="${PILL_SAFE + 20}" cy="${PILL_SAFE + 20}" r="6" fill="${cfg.accentColour}"/>
<text x="${PILL_SAFE + 34}" y="${PILL_SAFE + 26}" font-family="Mont,sans-serif" font-size="14" font-weight="800" fill="white" letter-spacing="1.8">${pillLabel}</text>

<!-- Zone 2: AI Bytes badge — top-right -->
<rect x="${badgeX}" y="${PILL_SAFE}" width="${badgeW}" height="40" rx="20" fill="rgba(0,0,0,0.72)"/>
<text x="${badgeX + badgeW / 2}" y="${PILL_SAFE + 26}" font-family="Mont,sans-serif" font-size="14" font-weight="800" fill="rgba(255,255,255,0.9)" text-anchor="middle" letter-spacing="1">AI BYTES</text>

<!-- Zone 5: MICRO-COURSE label (brief: 10px at 480px = 22px at 1280px, 500 weight, accent colour, letter-spaced) -->
<text x="${TEXT_SAFE}" y="${microLabelY}" font-family="Mont,sans-serif" font-size="${microLabelSize}" font-weight="500" fill="${cfg.accentColour}" letter-spacing="3">MICRO-COURSE</text>

<!-- Zone 5: Title line 1 (brief: weight 500, white) -->
<text x="${TEXT_SAFE}" y="${title1Y}" font-family="Mont,sans-serif" font-size="${titleSize}" font-weight="800" fill="#FFFFFF">${titleL1}</text>

${titleL2 ? `<!-- Zone 5: Title line 2 (brief: weight 400, 60% white — same size as line 1) -->
<text x="${TEXT_SAFE}" y="${title2Y}" font-family="Mont,sans-serif" font-size="${titleSize}" font-weight="400" fill="rgba(255,255,255,0.60)">${titleL2}</text>` : ''}

<!-- Zone 6: Play ring — bottom-right -->
<circle cx="${playCx}" cy="${playCy}" r="${playR}" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.55)" stroke-width="2"/>
<polygon points="${playCx - 11},${playCy - 14} ${playCx + 16},${playCy} ${playCx - 11},${playCy + 14}" fill="rgba(255,255,255,0.9)"/>
</svg>`;

        console.log(`[Thumbnail] Compositing brand layer — title: "${title}", category: ${category}, titleSize: ${titleSize}px`);

        const finalBuffer = await sharp(backgroundBuffer)
            .resize(W, H, { fit: 'cover' })
            .composite([{ input: Buffer.from(svgOverlay), top: 0, left: 0 }])
            .png()
            .toBuffer();

        console.log(`[Thumbnail] Composite done — ${finalBuffer.length} bytes`);

        const slug = `${category}-${title.toLowerCase().replace(/[^a-z0-9]/g, '-').substring(0, 40)}`;
        const publicUrl = await geminiImageService.generateImageFromBuffer(finalBuffer, 'image/png', `thumb-${slug}`);
        console.log(`[Thumbnail] Uploaded → ${publicUrl}`);

        return publicUrl || '';
    }
}

export const imageService = new MediaService();
