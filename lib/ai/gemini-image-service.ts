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
    async generateImage(prompt: string): Promise<GeminiImage | null> {
        if (!this.client) {
            console.warn('[GeminiImageService] Client not initialized, skipping');
            return null;
        }

        try {
            console.log(`[GeminiImageService] Generating image for: "${prompt.substring(0, 50)}..."`);

            // Enhance prompt for educational content
            const enhancedPrompt = this.buildEducationalPrompt(prompt);

            const response = await this.client.models.generateContent({
                model: this.model,
                contents: enhancedPrompt,
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
            lowerPrompt.includes('photograph') ||
            lowerPrompt.includes('real-world') ||
            lowerPrompt.includes('hd photo') ||
            lowerPrompt.includes('real life') ||
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
            .replace(/^ILLUSTRATION:\s*/i, '');

        if (style === 'photorealistic') {
            console.log('[GeminiImageService] 📷 Using PHOTOREALISTIC style');
            return `Create a stunning, photorealistic HD photograph for an AI learning platform:

${cleanPrompt}

Photography requirements:
- Ultra-realistic, high-definition photograph (8K quality)
- Natural lighting with professional composition
- Real-world scene with authentic details
- Sharp focus, proper depth of field
- Professional stock photography quality
- Diverse representation of people when applicable
- Modern, technological environment where relevant
- No artificial or cartoonish elements
- No watermarks or signatures`;
        } else {
            console.log('[GeminiImageService] 🎨 Using ILLUSTRATION style');
            return `Create a professional educational illustration for an AI learning platform:

${cleanPrompt}

Style requirements:
- Clean, modern digital illustration
- Dark background with vibrant accent colors (cyan, purple, magenta)
- Professional infographic quality
- Clear labels and annotations where appropriate
- Suitable for educational presentation
- High contrast and readable at various sizes
- No watermarks or signatures`;
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
