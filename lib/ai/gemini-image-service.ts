/**
 * Gemini Image Service
 * Uses Google's Gemini 3.1 Flash Image Preview model (Nano Banana) for AI image generation.
 * This service provides superior text rendering accuracy and advanced capabilities for educational content.
 */

import { OpenAI } from "openai";
import { createClient } from "@supabase/supabase-js";
import type { ImageGenerationResult } from './media-errors';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

export interface GeminiImage {
    url: string;
    alt: string;
    caption: string;
}

class GeminiImageService {
    private client: any | null = null;
    private textClient: OpenAI | null = null;
    // Disabling Google Imagen 3 generation model as the API is shut down
    private model = "disabled";
    private supabase: any = null;

    constructor() {
        // FLAGGED EXCEPTION RESOLVED:
        // User reported Gemini API is strictly shut down without billing. We must disable GoogleGenAI.
        // The service will safely return an error payload and the parent MediaService will fall back to unsplash.
        console.warn('[GeminiImageService] GoogleGenAI disabled entirely per user shutdown notice.');
        
        if (OPENROUTER_API_KEY) {
            this.textClient = new OpenAI({
                baseURL: "https://openrouter.ai/api/v1",
                apiKey: OPENROUTER_API_KEY,
            });
        }

        // Initialize Supabase for storage uploads
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (supabaseUrl && supabaseKey) {
            this.supabase = createClient(supabaseUrl, supabaseKey);
        } else {
            console.warn('[GeminiImageService] Supabase not configured, image uploads will fail');
        }
    }

    /**
     * Generate an image using Gemini 3.1 Flash Image model.
     * Returns a base64 data URI or null if generation fails.
     * @param prompt The image generation prompt
     * @param index Optional index of the image in the lesson sequence (0-5)
     */
    async generateImage(prompt: string, index: number = 0): Promise<ImageGenerationResult> {
        if (!this.client) {
            console.warn('[GeminiImageService] Client not initialized, skipping');
            return { url: null, alt: null, caption: null, errorCode: 'auth_failed', errorMessage: 'Gemini client not initialised — GEMINI_API_KEY missing' };
        }

        try {
            console.log(`[GeminiImageService] Generating image for: "${prompt.substring(0, 50)}..." (Index: ${index})`);

            // Enhance prompt for educational content
            const enhancedPrompt = this.buildEducationalPrompt(prompt);

            // Detect style to adjust temperature
            const style = this.detectImageStyle(prompt);

            // Lower temperature for photorealism (coherence), higher for art (creativity)
            let selectedTemp = 0.85;
            if (style === 'photorealistic') {
                selectedTemp = 0.65; // Lower temp for sharper, more realistic details
            } else if (style === 'digital-art') {
                selectedTemp = 0.9;
            }

            // Random seed logic to ensure strict deduplication
            // We use the current time + index to ensure each run is unique
            const randomSeed = Math.floor(Date.now() * Math.random()) + index;

            const response = await this.client.models.generateContent({
                model: this.model,
                contents: enhancedPrompt,
                config: {
                    temperature: selectedTemp,
                    randomSeed: randomSeed
                } as any
            });

            // Extract image from response
            if (response.candidates && response.candidates.length > 0) {
                const parts = response.candidates[0].content?.parts || [];

                for (const part of parts) {
                    if (part.inlineData && part.inlineData.data) {
                        const mimeType = part.inlineData.mimeType || 'image/png';
                        const base64Data = part.inlineData.data;

                        console.log('[GeminiImageService] ✅ Successfully generated image, uploading to storage...');

                        // Generate a clean, short caption from the prompt
                        const cleanCaption = this.generateCleanCaption(prompt);

                        // Upload to Supabase Storage
                        const publicUrl = await this.uploadToStorage(base64Data, mimeType, prompt);

                        if (publicUrl) {
                            return { url: publicUrl, alt: cleanCaption, caption: cleanCaption, errorCode: null, errorMessage: null };
                        }
                        return { url: null, alt: null, caption: null, errorCode: 'upload_failed', errorMessage: 'Image generated but Supabase Storage upload failed' };
                    }
                }
            }

            console.warn('[GeminiImageService] No image data in response');
            return { url: null, alt: null, caption: null, errorCode: 'empty_result', errorMessage: 'Gemini returned no image data — possible content filter or model error' };

        } catch (error: any) {
            const raw = error?.message || String(error);
            console.error(`[GeminiImageService] ❌ Generation failed:`, raw);
            return { url: null, alt: null, caption: null, errorCode: 'empty_result', errorMessage: raw };
        }
    }

    async generateText(prompt: string, temperature: number = 0.7): Promise<string | null> {
        const client = this.textClient;
        if (!client) return null;
        try {
            const result = await client.chat.completions.create({
                model: "deepseek/deepseek-v3.2",
                messages: [{ role: "user", content: prompt }],
                temperature: temperature
            });
            return result.choices[0].message.content;
        } catch (error) {
            console.error('[GeminiImageService] Text generation failed on OpenRouter:', error);
            return null;
        }
    }


    /**
     * Uploads the base64 image data to Supabase Storage and returns the public URL.
     */
    private async uploadToStorage(base64Data: string, mimeType: string, prompt: string): Promise<string | null> {
        if (!this.supabase) return null;

        try {
            const buffer = Buffer.from(base64Data, 'base64');
            const ext = mimeType.split('/')[1] || 'png';
            const timestamp = Date.now();
            const randomId = Math.random().toString(36).substring(7);
            const slug = prompt.substring(0, 20).replace(/[^a-z0-9]/yi, '-').toLowerCase();
            const filename = `gemini-${timestamp}-${randomId}-${slug}.${ext}`;
            const filePath = `generated/${filename}`;

            const { error: uploadError } = await this.supabase.storage
                .from('course-images')
                .upload(filePath, buffer, {
                    contentType: mimeType,
                    upsert: false
                });

            if (uploadError) {
                console.error('[GeminiImageService] Upload failed:', uploadError);
                return null;
            }

            const { data } = this.supabase.storage
                .from('course-images')
                .getPublicUrl(filePath);

            return data.publicUrl;

        } catch (e) {
            console.error('[GeminiImageService] Error in uploadToStorage:', e);
            return null;
        }
    }

    /**
     * Detect specific visual style from the prompt.
     */
    private detectImageStyle(prompt: string): 'photorealistic' | '3d-model' | 'futuristic-ui' | 'diagram' | 'digital-art' | 'infographic' {
        const lower = prompt.toLowerCase();
        if (lower.startsWith('photorealistic') || lower.includes('documentary photo') || lower.includes('raw photograph') || lower.includes('real-world photo')) return 'photorealistic';
        if (lower.includes('3d isometric') || lower.includes('3d render') || lower.includes('clay render') || lower.includes('isometric view')) return '3d-model';
        if (lower.includes('futuristic ui') || lower.includes('hud') || lower.includes('dashboard') || lower.includes('data visualization') || lower.includes('data visualiz')) return 'futuristic-ui';
        if (lower.includes('diagram') || lower.includes('schematic') || lower.includes('blueprint') || lower.includes('flowchart') || lower.includes('architecture diagram')) return 'diagram';
        if (lower.includes('infographic') || lower.includes('illustration') || lower.includes('chart') || lower.includes('graph')) return 'infographic';
        return 'digital-art';
    }

    /**
     * Extract the core visual subject from any prompt — strips style instructions and extracts the key concept.
     */
    private extractCoreSubject(prompt: string): string {
        return prompt
            .replace(/^(PHOTOREALISTIC|3D ISOMETRIC|FUTURISTIC UI|DIAGRAM|ILLUSTRATION|INFOGRAPHIC|Generate a|A photorealistic|A 3D|A high-end|A cinematic)[\s:]+/i, '')
            .replace(/\.\s*(SPECS|STYLE|COLORS|ELEMENTS|CONTEXT|NEGATIVE PROMPT|AVOID|BACKGROUND|COMPOSITION)[\s\S]*/i, '')
            .replace(/(No text|no logos|no faces|no cartoons|8K|4K|ray-traced|global illumination|studio lighting|f\/[0-9.]+|ISO [0-9]+)[^.]*\.?/gi, '')
            .replace(/\s+/g, ' ')
            .substring(0, 200)
            .trim();
    }

    /**
     * Build a highly detailed, publication-quality image prompt.
     * The goal is that every image feels like it was shot by a world-class photographer
     * or rendered by an award-winning 3D artist — bespoke, contextually precise, never generic.
     */
    private buildEducationalPrompt(basePrompt: string): string {
        const subject = this.extractCoreSubject(basePrompt);

        // Core Directive: Enterprise Technical context
        const context = `An authentic, high-stakes industrial enterprise environment, zero human figures, no classroom or office tropes.`;
        
        // Aesthetic: High-fidelity raw photography
        const aesthetic = `TECHNICAL STYLE: Raw handheld industrial photography, 35mm lens, cool ambient data center lighting, razor-sharp technical focus on hardware/software interfaces.`;
        
        // Mandatory Constraints (Assertions of Absence)
        const constraints = `MANDATORY CONSTRAINTS: POSITIVE ASSERTIONS OF ABSENCE - An empty, clean, professional technology interface. No teacher, no student, no smiling faces. 15% whitespace safety margin for UI overlay.`;
        
        // Negative Injection
        const negative = `EXCLUDE: teacher, student, classroom, blackboard, generic office, person closing laptop, handshakes, cartoon, 3D characters, clip-art, low-resolution, stock photo look.`;

        return `CORE SUBJECT: ${subject}.
${context}
${aesthetic}
${constraints}
${negative}
STYLE: Photorealistic, high-contrast, professional, 8k resolution, cinematic technical lighting.`;
    }


    /**
     * Check if the service is available and ready.
     */
    isAvailable(): boolean {
        return this.client !== null;
    }

    /**
     * Generate a clean, short caption from the AI prompt.
     * Extracts the key concept and creates a readable title.
     */
    private generateCleanCaption(prompt: string): string {
        // Remove style prefixes
        let cleanText = prompt
            .replace(/^PHOTOREALISTIC:\s*/i, '')
            .replace(/^ILLUSTRATION:\s*/i, '')
            .trim();

        // Remove common prompt modifiers and technical instructions
        cleanText = cleanText
            .replace(/professional photograph of /gi, '')
            .replace(/educational (technical )?diagram (showing |of )?/gi, '')
            .replace(/isometric infographic of /gi, '')
            .replace(/technical illustration of /gi, '')
            .replace(/minimalist style[^,.]*/gi, '')
            .replace(/clean geometric shapes[^,.]*/gi, '')
            .replace(/dark background[^,.]*/gi, '')
            .replace(/professional illustration[^,.]*/gi, '')
            .replace(/8K HD[^,.]*/gi, '')
            .replace(/, (modern|professional|high)[^,.]*/gi, '')
            .replace(/with labeled[^,.]*/gi, '')
            .replace(/suitable for[^,.]*/gi, '')
            .trim();

        // Take just the first meaningful sentence/phrase
        const firstSentence = cleanText.split(/[.,;]/)[0].trim();

        // Capitalize first letter and limit length
        let caption = firstSentence.charAt(0).toUpperCase() + firstSentence.slice(1);

        // Limit to 60 characters max
        if (caption.length > 60) {
            caption = caption.substring(0, 57) + '...';
        }

        return caption || 'Visual Concept';
    }

    /**
     * Generate a thumbnail image using the prompt as-is (no educational wrapper).
     * Used for course thumbnails where the template prompt is already fully specified.
     */
    async generateThumbnailImage(prompt: string): Promise<string | null> {
        if (!this.client) {
            console.warn('[GeminiImageService] Client not initialized, skipping thumbnail generation');
            return null;
        }

        try {
            console.log(`[GeminiImageService] Generating thumbnail: "${prompt.substring(0, 60)}..."`);

            const randomSeed = Math.floor(Date.now() * Math.random());

            const response = await this.client.models.generateContent({
                model: this.model,
                contents: prompt,
                config: {
                    temperature: 0.9,
                    randomSeed
                } as any
            });

            if (response.candidates && response.candidates.length > 0) {
                const parts = response.candidates[0].content?.parts || [];
                for (const part of parts) {
                    if (part.inlineData && part.inlineData.data) {
                        const mimeType = part.inlineData.mimeType || 'image/png';
                        const publicUrl = await this.uploadToStorage(part.inlineData.data, mimeType, prompt);
                        if (publicUrl) return publicUrl;
                    }
                }
            }

            console.warn('[GeminiImageService] No image data in thumbnail response');
            return null;
        } catch (error: any) {
            console.error('[GeminiImageService] Thumbnail generation failed:', error?.message || error);
            return null;
        }
    }

    /**
     * Uploads a raw buffer to Supabase and returns the public URL.
     */
    async generateImageFromBuffer(buffer: Buffer, mimeType: string, slugSeed: string): Promise<string | null> {
        if (!this.supabase) return null;
        try {
            const ext = mimeType.split('/')[1] || 'png';
            const timestamp = Date.now();
            const filePath = `generated/thumb-${timestamp}-${slugSeed.substring(0, 20)}.${ext}`;

            const { error: uploadError } = await this.supabase.storage
                .from('course-images')
                .upload(filePath, buffer, {
                    contentType: mimeType,
                    upsert: false
                });

            if (uploadError) {
                console.error('[GeminiImageService] Buffer upload failed:', uploadError);
                return null;
            }

            const { data } = this.supabase.storage
                .from('course-images')
                .getPublicUrl(filePath);

            return data.publicUrl;
        } catch (e) {
            console.error('[GeminiImageService] Error in generateImageFromBuffer:', e);
            return null;
        }
    }
}

// Singleton export
export const geminiImageService = new GeminiImageService();
