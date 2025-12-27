import { createClient } from '@supabase/supabase-js';
import { logMediaToRegistry } from '@/lib/utils/registry';
import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';
import { geminiImageService } from './gemini-image-service';
import { diagramGenerator } from '@/lib/diagrams/diagram-generator';

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
    async fetchImages(prompts: string[]): Promise<LessonImage[]> {
        const results: LessonImage[] = [];

        for (const prompt of prompts) {
            // =========================================================
            // PRIMARY: Try Gemini 2.5 Flash Image first (best quality)
            // =========================================================
            if (geminiImageService.isAvailable()) {
                console.log(`[MediaService] 🎨 Trying Gemini for: "${prompt.substring(0, 50)}..."`);

                const geminiImage = await geminiImageService.generateImage(prompt);
                if (geminiImage) {
                    results.push({
                        url: geminiImage.url,
                        alt: geminiImage.alt,
                        caption: geminiImage.caption
                    });
                    await logMediaToRegistry(geminiImage.url, prompt);
                    continue; // Success! Move to next prompt
                }

                console.log('[MediaService] Gemini failed, falling back to alternative providers...');
            }

            // =========================================================
            // FALLBACK: Existing diagram/stock logic
            // =========================================================

            // NUCLEAR FIX: Force diagram detection for any technical keywords
            const technicalKeywords = [
                'neural', 'network', 'diagram', 'architecture', 'algorithm',
                'perceptron', 'layer', 'node', 'technical', 'schematic',
                'illustration', 'infographic', 'visualization', 'model', 'ai', 'data'
            ];

            const isDiagram = technicalKeywords.some(keyword =>
                prompt.toLowerCase().includes(keyword)
            );

            console.log(`[MediaService] Fallback mode. Type: ${isDiagram ? 'DIAGRAM (SVG)' : 'PHOTO (STOCK)'}, Prompt: "${prompt}"`);

            if (isDiagram) {
                // =========================================================
                // PHASE 2: PROGRAMMATIC DIAGRAMS (Mermaid / Custom SVG)
                // =========================================================
                console.log('[MediaService] 🛠️ Generating programmatic diagram for:', prompt);

                let svgContent = '';

                // Detect Diagram Type
                if (prompt.toLowerCase().match(/(neural|network|deep learning|perceptron|layer)/)) {
                    // Generate specific Neural Network Topology
                    const layers = [
                        Math.floor(Math.random() * 3) + 3, // Input
                        Math.floor(Math.random() * 4) + 4, // Hidden
                        Math.floor(Math.random() * 4) + 4, // Hidden
                        Math.floor(Math.random() * 2) + 2  // Output
                    ];

                    try {
                        svgContent = await diagramGenerator.generate('neural-network', {
                            title: prompt.length > 50 ? prompt.substring(0, 50) + '...' : prompt,
                            data: { layers }
                        });
                    } catch (e) {
                        console.error("Diagram generation error:", e);
                    }
                }

                // Fallback to Phase 1 Generic Placeholder if specific generator didn't run or failed
                if (!svgContent) {
                    // Deterministic color based on prompt length
                    const hue = (prompt.length * 13) % 360;

                    svgContent = `
                    <svg width="1280" height="720" viewBox="0 0 1280 720" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="1"/>
                            </pattern>
                            <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" style="stop-color:#0f172a;stop-opacity:1" />
                                <stop offset="100%" style="stop-color:#1e293b;stop-opacity:1" />
                            </linearGradient>
                        </defs>
                        <rect width="1280" height="720" fill="url(#grad)"/>
                        <rect width="1280" height="720" fill="url(#grid)"/>
                        
                        <!-- Center Content -->
                        <g transform="translate(640, 360)" text-anchor="middle">
                            <circle r="60" fill="none" stroke="hsl(${hue}, 70%, 50%)" stroke-width="2" opacity="0.8"/>
                            <circle r="50" fill="none" stroke="hsl(${hue}, 70%, 50%)" stroke-width="1" stroke-dasharray="4 4" opacity="0.6">
                                <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="20s" repeatCount="indefinite"/>
                            </circle>
                            
                            <text y="-80" font-family="system-ui, -apple-system, sans-serif" font-size="14" fill="hsl(${hue}, 70%, 60%)" letter-spacing="4" font-weight="600" text-transform="uppercase">
                                Technical Diagram
                            </text>
                            
                            <text y="140" font-family="system-ui, -apple-system, sans-serif" font-size="24" fill="#e2e8f0" letter-spacing="1" font-weight="500">
                                ${prompt.substring(0, 40)}${prompt.length > 40 ? '...' : ''}
                            </text>

                            <!-- Abstract Nodes -->
                            <circle cx="-120" cy="0" r="4" fill="#94a3b8"/>
                            <circle cx="120" cy="0" r="4" fill="#94a3b8"/>
                            <line x1="-110" y1="0" x2="-70" y2="0" stroke="#334155" stroke-width="2"/>
                            <line x1="70" y1="0" x2="110" y2="0" stroke="#334155" stroke-width="2"/>
                        </g>
                    </svg>
                    `;
                }

                // Convert to Base64 Data URI
                const base64Svg = Buffer.from(svgContent).toString('base64');
                const dataUri = `data:image/svg+xml;base64,${base64Svg}`;

                results.push({
                    url: dataUri,
                    alt: "Professional Diagram: " + prompt,
                    caption: "Technical visualization of " + prompt
                });

                // Skip all AI generation steps for diagrams (Phase 1)

                // =========================================================

            } else {
                // =========================================================
                // PHOTO PIPELINE (Stock Allowed)
                // =========================================================
                try {
                    let image: LessonImage | null = null;
                    let attempts = 0;
                    let currentPage = Math.floor(Math.random() * 20) + 1;

                    while (attempts < 5 && !image) {
                        attempts++;

                        // 1. Try Pexels first for photos (Faster/Cheaper)
                        const pexelsImage = await this.searchPexelsImage(prompt, currentPage);
                        if (pexelsImage) {
                            if (!(await this.isMediaUsed(this.getMediaId(pexelsImage.url), pexelsImage.url))) {
                                this.sessionUsedIds.add(this.getMediaId(pexelsImage.url));
                                await logMediaToRegistry(pexelsImage.url, prompt);
                                image = pexelsImage;
                                break;
                            }
                        }

                        // 2. Try Unsplash
                        if (!image) {
                            const unsplashImage = await this.searchUnsplashImage(prompt, currentPage);
                            if (unsplashImage) {
                                if (!(await this.isMediaUsed(this.getMediaId(unsplashImage.url), unsplashImage.url))) {
                                    this.sessionUsedIds.add(this.getMediaId(unsplashImage.url));
                                    await logMediaToRegistry(unsplashImage.url, prompt);
                                    image = unsplashImage;
                                    break;
                                }
                            }
                        }

                        currentPage++;
                    }

                    if (image) {
                        results.push(image);
                    } else {
                        // Fallback to Pollinations for "Photo" style
                        const seed = Math.floor(Math.random() * 1000000);
                        results.push({
                            url: `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1280&height=720&nologo=true&seed=${seed}`,
                            alt: prompt,
                            caption: prompt
                        });
                    }

                } catch (error) {
                    console.error(`[MediaService] Error fetching photo for '${prompt}':`, error);
                    results.push({
                        url: `https://placehold.co/1280x720/1e293b/94a3b8?text=Image+Unavailable`,
                        alt: "Image loading failed",
                        caption: "Image Unavailable"
                    });
                }
            }
        }

        return results;
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

            // Educational diagram strict prompt engineering
            const enhancedPrompt = `Professional educational diagram, NOT a photograph: ${prompt}. 
            Digital illustration style, clean vector graphics, infographic quality, minimal aesthetic. 
            Technical schematic with labels and annotations. No photographic elements. 
            Dark background with neon/cyan accents preferred for "cyber" look.`;

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

    private async searchPexelsImage(query: string, page: number = 1): Promise<LessonImage | null> {
        if (!PEXELS_API_KEY) return null;

        try {
            const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1&page=${page}&orientation=landscape`;
            const res = await fetch(url, {
                headers: { Authorization: PEXELS_API_KEY }
            });

            if (!res.ok) return null;
            const data = await res.json();

            if (data.photos && data.photos.length > 0) {
                const photo = data.photos[0];
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

    private async searchUnsplashImage(query: string, page: number = 1): Promise<LessonImage | null> {
        if (!UNSPLASH_ACCESS_KEY) return null;

        try {
            const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&page=${page}&orientation=landscape`;
            const res = await fetch(url, {
                headers: { Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}` }
            });

            if (!res.ok) return null;
            const data = await res.json();

            if (data.results && data.results.length > 0) {
                const photo = data.results[0];
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

    async fetchCourseThumbnail(title: string): Promise<string> {
        // High-effort thumbnail search
        // We use a specific suffix to get "wallpaper" style images
        const images = await this.fetchImages([title + " abstract futuristic technology wallpaper"]);
        if (images.length > 0) return images[0].url;

        // Fallback with uniqueness seed
        const seed = Math.floor(Math.random() * 1000000);
        return `https://image.pollinations.ai/prompt/${encodeURIComponent(title)}%20abstract?width=1600&height=900&nologo=true&seed=${seed}`;
    }
}

export const imageService = new MediaService();
