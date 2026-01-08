/**
 * Gemini Image Service
 * Uses Google's Gemini 2.5 Flash Image model (Nano Banana) for AI image generation.
 * This service provides superior text rendering accuracy for educational content.
 */

import { GoogleGenAI } from "@google/genai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export interface GeminiImage {
    url: string;
    alt: string;
    caption: string;
}

class GeminiImageService {
    private client: GoogleGenAI | null = null;
    // Using the correct Nano Banana image generation model
    private model = "gemini-2.5-flash-image";

    constructor() {
        if (GEMINI_API_KEY) {
            this.client = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
            console.log('[GeminiImageService] Initialized with API key');
        } else {
            console.warn('[GeminiImageService] No GEMINI_API_KEY found, service disabled');
        }
    }

    /**
     * Generate an image using Gemini 2.5 Flash Image model.
     * Returns a base64 data URI or null if generation fails.
     */
    /**
     * Generate an image using Gemini 2.5 Flash Image model.
     * Returns a base64 data URI or null if generation fails.
     * @param prompt The image generation prompt
     * @param index Optional index of the image in the lesson sequence (0-5)
     */
    async generateImage(prompt: string, index: number = 0): Promise<GeminiImage | null> {
        if (!this.client) {
            console.warn('[GeminiImageService] Client not initialized, skipping');
            return null;
        }

        try {
            console.log(`[GeminiImageService] Generating image for: "${prompt.substring(0, 50)}..." (Index: ${index})`);

            // Enhance prompt for educational content
            const enhancedPrompt = this.buildEducationalPrompt(prompt);

            // User-defined temperature variation for uniqueness
            // [0.8, 0.9, 0.85, 0.95, 0.9, 0.85]
            const temps = [0.8, 0.9, 0.85, 0.95, 0.9, 0.85];
            const selectedTemp = temps[index % temps.length];

            // Random seed logic to ensure strict deduplication
            // We use the current time + index to ensure each run is unique
            const randomSeed = Math.floor(Date.now() * Math.random()) + index;

            const response = await this.client.models.generateContent({
                model: this.model,
                contents: enhancedPrompt,
                config: {
                    temperature: selectedTemp,
                    randomSeed: randomSeed
                }
            });

            // Extract image from response
            if (response.candidates && response.candidates.length > 0) {
                const parts = response.candidates[0].content?.parts || [];

                for (const part of parts) {
                    if (part.inlineData) {
                        const mimeType = part.inlineData.mimeType || 'image/png';
                        const base64Data = part.inlineData.data;
                        const dataUri = `data:${mimeType};base64,${base64Data}`;

                        console.log('[GeminiImageService] ✅ Successfully generated image');

                        // Generate a clean, short caption from the prompt
                        const cleanCaption = this.generateCleanCaption(prompt);

                        return {
                            url: dataUri,
                            alt: cleanCaption,
                            caption: cleanCaption
                        };
                    }
                }
            }

            console.warn('[GeminiImageService] No image data in response');
            return null;

        } catch (error: any) {
            console.error(`[GeminiImageService] ❌ Generation failed:`, error.message || error);
            return null;
        }
    }

    /**
     * Detect if the prompt is requesting photorealistic or illustration style.
     */
    private detectImageStyle(prompt: string): 'photorealistic' | 'illustration' {
        const lowerPrompt = prompt.toLowerCase();
        // Check for explicit PHOTOREALISTIC prefix or photo-related keywords
        if (lowerPrompt.startsWith('photorealistic:') ||
            lowerPrompt.startsWith('photography mode only:') ||
            lowerPrompt.includes('photograph') ||
            lowerPrompt.includes('real-world') ||
            lowerPrompt.includes('hd photo') ||
            lowerPrompt.includes('real life') ||
            lowerPrompt.includes('shot with') ||
            lowerPrompt.includes('camera') ||
            lowerPrompt.includes('lens') ||
            lowerPrompt.includes('8k hd')) {
            return 'photorealistic';
        }
        return 'illustration';
    }

    /**
     * Build an enhanced prompt based on the detected image style.
     */
    private buildEducationalPrompt(basePrompt: string): string {
        const style = this.detectImageStyle(basePrompt);

        // Remove style prefix if present
        let cleanPrompt = basePrompt
            .replace(/^PHOTOREALISTIC:\s*/i, '')
            .replace(/^PHOTOGRAPHY MODE ONLY:\s*/i, '')
            .replace(/^ILLUSTRATION:\s*/i, '');

        if (style === 'photorealistic') {
            console.log('[GeminiImageService] 📷 Using PHOTOREALISTIC style');
            return `Generate a RAW, DOCUMENTARY-STYLE PHOTOGRAPH.
            
PROMPT: ${cleanPrompt}

PHOTOGRAPHY SPECIFICATIONS:
- CAMERA: Phase One XF IQ4 150MP, 80mm f/2.8 lens.
- STYLE: Corporate Editorial / Tech Documentary.
- LIGHTING: Natural environmental lighting mixed with subtle rim lighting. NO dramatic, oversaturated "gamer" or "cyberpunk" lighting unless specified.
- TEXTURE: Highly detailed skin texture, fabric weaves, and material imperfections.
- AVOID: "CGI", "3D Render", "Plastic", "Smooth", "Cartoon", "Illustration", "Digital Art", "Unreal Engine".
- COMPOSITION: Professional framing, rule of thirds, depth of field to separate subject.
- COLOR: Natural, balanced color grading (Fujifilm GFX simulation). 

CRITICAL: The image must look like a real photo taken by a human photographer, not a digital artwork.`;
        } else {
            console.log('[GeminiImageService] 🎨 Using ILLUSTRATION style');
            return `Create a premium, corporate Memphis-style flat illustration for a B2B tech platform:

PROMPT: ${cleanPrompt}

DESIGN REQUIREMENTS:
- STYLE: Flat, minimal, vector-art style.
- COLORS: Slate-900 acting as ink, with primary accents of #06b6d4 (Cyan) and #8b5cf6 (Violet). 
- NO SHADING: Use solid colors. No gradients or drop shadows.
- SHAPES: Geometric, clean lines. No "hand-drawn" sketchiness.
- COMPOSITION: Abstract representation of the concept.
- NO TEXT: Do not include text.
- ASPECT RATIO: 16:9.`;
        }
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
}

// Singleton export
export const geminiImageService = new GeminiImageService();
