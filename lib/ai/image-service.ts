import { createClient } from '@supabase/supabase-js';
import { logMediaToRegistry } from '@/lib/utils/registry';
import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';
import sharp from 'sharp';
import { geminiImageService } from './gemini-image-service';
import { diagramGenerator } from '@/lib/diagrams/diagram-generator';
import { CourseState } from './course-state';

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

    async fetchCourseThumbnail(title: string, description?: string, customPrompt?: string): Promise<string> {
        let prompt = "";

        if (customPrompt && customPrompt.length > 20) {
            prompt = `${customPrompt}. MANDATORY STYLE: Deep dark navy background (#0D1117). Teal/cyan (#00BCD4) and purple (#6B3FA0) dominant accent colours. Cinematic atmospheric lighting with subtle glow effects. Clean minimal geometric composition. Ultra high resolution. Absolutely NO text, letters, or words anywhere in the image. Premium sophisticated professional aesthetic for senior business executives.`;
        } else {
            const context = description ? description.substring(0, 150) : title;
            prompt = `Premium cinematic digital illustration for an AI microlearning course titled "${title}". Abstract conceptual visual metaphor representing: ${context}. MANDATORY: Deep dark navy background (#0D1117). Teal/cyan and purple dominant accent colours with cinematic glow lighting. Clean minimal geometric composition. Absolutely NO text or words in the image. Sophisticated premium aesthetic for senior business professionals. Ultra high resolution. 16:9 aspect ratio.`;
        }

        const images = await this.fetchImages([{ prompt }]);
        const baseUrl = images.length > 0 ? images[0].url : `https://images.pexels.com/photos/373543/pexels-photo-373543.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2`;

        // NEW: Add Title Overlay for "WOW" Factor
        try {
            return await this.generateCourseThumbnailWithTitle(title, baseUrl);
        } catch (e) {
            console.error("[MediaService] Title overlay failed, returning base image:", e);
            return baseUrl;
        }
    }

    /**
     * Composites the course title onto the background image using sharp + SVG.
     */
    async generateCourseThumbnailWithTitle(title: string, backgroundUrl: string): Promise<string> {
        console.log(`[MediaService] 🎨 Compositing title overlay for: "${title}"`);

        // 1. Fetch background image
        const response = await fetch(backgroundUrl);
        const arrayBuffer = await response.arrayBuffer();
        const backgroundBuffer = Buffer.from(arrayBuffer);

        // 2. Adaptive font size — scale down for long titles or long individual words
        const svgWidth = 1200;
        const svgHeight = 675; // 16:9
        const usableWidth = svgWidth * 0.82; // 82% of canvas width for safe margins

        const upperTitle = title.toUpperCase();
        const longestWord = upperTitle.split(' ').reduce((a, b) => a.length > b.length ? a : b, '');
        const totalChars = upperTitle.length;

        // Approximate px per character for bold uppercase sans-serif: ~0.58 * fontSize
        let fontSize: number;
        if (totalChars > 55 || longestWord.length > 15) {
            fontSize = 52;
        } else if (totalChars > 38 || longestWord.length > 12) {
            fontSize = 66;
        } else {
            fontSize = 84;
        }

        // Chars that fit per line at the chosen font size
        const charWidth = fontSize * 0.58;
        const maxCharsPerLine = Math.floor(usableWidth / charWidth);

        // Wrap text into lines
        const words = upperTitle.split(' ');
        const lines: string[] = [];
        let currentLine = "";

        words.forEach(word => {
            const candidate = currentLine ? currentLine + word : word;
            if (candidate.length > maxCharsPerLine && currentLine) {
                lines.push(currentLine.trim());
                currentLine = word + " ";
            } else {
                currentLine += word + " ";
            }
        });
        if (currentLine.trim()) lines.push(currentLine.trim());

        // If still too many lines, reduce font size further
        if (lines.length > 4) fontSize = Math.max(38, Math.floor(fontSize * 0.8));

        const lineHeight = fontSize * 1.15;
        const startY = (svgHeight / 2) - ((lines.length - 1) * lineHeight / 2) + (fontSize / 3);

        const textElements = lines.map((line, i) => `
            <text x="50%" y="${startY + (i * lineHeight)}" 
                  text-anchor="middle" 
                  fill="white" 
                  font-family="sans-serif" 
                  font-weight="900" 
                  font-size="${fontSize}px">
                ${line}
            </text>
        `).join('');

        const svgOverlay = `
            <svg width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="vignette" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style="stop-color:black;stop-opacity:0.4" />
                        <stop offset="20%" style="stop-color:black;stop-opacity:0" />
                        <stop offset="80%" style="stop-color:black;stop-opacity:0" />
                        <stop offset="100%" style="stop-color:black;stop-opacity:0.7" />
                    </linearGradient>
                    <linearGradient id="textBackdrop" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" style="stop-color:black;stop-opacity:0" />
                        <stop offset="20%" style="stop-color:black;stop-opacity:0.6" />
                        <stop offset="80%" style="stop-color:black;stop-opacity:0.6" />
                        <stop offset="100%" style="stop-color:black;stop-opacity:0" />
                    </linearGradient>
                </defs>
                
                <!-- Dark strip for text legibility -->
                <rect x="0" y="${startY - fontSize * 1.2}" width="100%" height="${lines.length * lineHeight + fontSize}" fill="url(#textBackdrop)" />
                
                <rect width="100%" height="100%" fill="url(#vignette)" />
                
                ${textElements}
                
                <!-- Bottom Branding -->
                <text x="50%" y="${svgHeight - 40}" text-anchor="middle" fill="white" fill-opacity="0.4" font-family="sans-serif" font-weight="bold" font-size="22px" letter-spacing="Track">
                    AI BYTES LEARNING
                </text>
            </svg>
        `;

        // 4. Composite with Sharp
        const finalImageBuffer = await sharp(backgroundBuffer)
            .resize(svgWidth, svgHeight)
            .composite([{
                input: Buffer.from(svgOverlay),
                top: 0,
                left: 0
            }])
            .png()
            .toBuffer();

        // 5. Upload to Supabase
        const publicUrl = await geminiImageService.generateImageFromBuffer(finalImageBuffer, 'image/png', `thumbnail-${title.toLowerCase().replace(/[^a-z0-9]/g, '-')}`);
        return publicUrl || backgroundUrl;
    }
}

export const imageService = new MediaService();
