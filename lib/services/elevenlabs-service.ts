/**
 * ElevenLabs Text-to-Speech Service
 * Generates high-quality audio for AI avatar videos
 */

export interface ElevenLabsVoice {
    voice_id: string;
    name: string;
    description: string;
}

export interface ElevenLabsUsageQuota {
    character_count: number;
    character_limit: number;
    characters_remaining: number;
    tier: string;
    usage_percent: number;
    videos_remaining: number;
    next_reset_unix?: number;
}

export const ELEVENLABS_VOICES = {
    // British Female - Warm, Clear (for Sarah - Course Host)
    SARAH: {
        voice_id: '0sGQQaD2G2X1s87kHM5b',
        name: 'Isabella',
        description: 'British Female - Warm, clear, calm, and professional'
    },
    GEMMA: {
        voice_id: 'pFZP5JQG7iQjIQuC4Bku', // Lily - UK Female, energetic and professional
        name: 'Lily',
        description: 'British Female - Energetic, professional, and clear'
    }
} as const;

export class ElevenLabsService {
    private apiKey?: string;
    private baseUrl = 'https://api.elevenlabs.io/v1';

    private getApiKey(): string {
        if (!this.apiKey) {
            const apiKey = process.env.ELEVENLABS_API_KEY;
            if (!apiKey) {
                throw new Error('ELEVENLABS_API_KEY is not configured');
            }
            this.apiKey = apiKey;
        }
        return this.apiKey;
    }

    /**
     * Generate speech audio from text
     */
    async generateSpeech(
        text: string,
        voiceId: string,
        options?: {
            stability?: number;
            similarity_boost?: number;
            style?: number;
            use_speaker_boost?: boolean;
        }
    ): Promise<Buffer> {
        const url = `${this.baseUrl}/text-to-speech/${voiceId}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Accept': 'audio/mpeg',
                'Content-Type': 'application/json',
                'xi-api-key': this.getApiKey()
            },
            body: JSON.stringify({
                text,
                model_id: 'eleven_multilingual_v2',
                voice_settings: {
                    stability: options?.stability ?? 0.6,
                    similarity_boost: options?.similarity_boost ?? 0.8,
                    style: options?.style ?? 0.3,
                    use_speaker_boost: options?.use_speaker_boost ?? true
                }
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`ElevenLabs API error (${response.status}): ${errorText}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        return Buffer.from(arrayBuffer);
    }

    /**
     * Check current usage quota
     */
    async checkUsageQuota(): Promise<ElevenLabsUsageQuota> {
        const url = `${this.baseUrl}/user`;

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'xi-api-key': this.getApiKey()
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to check ElevenLabs quota: ${response.status}`);
        }

        const data = await response.json();
        const subscription = data.subscription || {};

        const character_count = subscription.character_count || 0;
        const character_limit = subscription.character_limit || 0;
        const characters_remaining = character_limit - character_count;
        const usage_percent = character_limit > 0 ? (character_count / character_limit) * 100 : 0;
        const videos_remaining = Math.floor(characters_remaining / 150); // Estimate: 150 chars per video

        return {
            character_count,
            character_limit,
            characters_remaining,
            tier: subscription.tier || 'unknown',
            usage_percent,
            videos_remaining,
            next_reset_unix: subscription.next_character_count_reset_unix
        };
    }

    /**
     * Estimate character count for a script
     */
    estimateCharacterCount(script: string | { script?: string; hook?: any; core?: any; recap?: any }): number {
        if (typeof script === 'string') {
            return script.length;
        }

        // Handle VideoScript object
        let totalChars = 0;
        if (script.script) totalChars += script.script.length;
        if (script.hook?.script) totalChars += script.hook.script.length;
        if (script.core?.script) totalChars += script.core.script.length;
        if (script.recap?.script) totalChars += script.recap.script.length;

        return totalChars;
    }

    /**
     * Check if quota is sufficient for generation
     */
    async checkQuotaSufficient(estimatedChars: number, warnThreshold = 0.8, stopThreshold = 0.95): Promise<{
        sufficient: boolean;
        warning?: string;
        quota: ElevenLabsUsageQuota;
    }> {
        const quota = await this.checkUsageQuota();

        if (quota.characters_remaining < estimatedChars) {
            return {
                sufficient: false,
                warning: `Insufficient quota: Need ${estimatedChars} chars, only ${quota.characters_remaining} remaining`,
                quota
            };
        }

        if (quota.usage_percent >= stopThreshold * 100) {
            return {
                sufficient: false,
                warning: `Quota at ${quota.usage_percent.toFixed(1)}% (stop threshold: ${stopThreshold * 100}%)`,
                quota
            };
        }

        if (quota.usage_percent >= warnThreshold * 100) {
            return {
                sufficient: true,
                warning: `Quota at ${quota.usage_percent.toFixed(1)}% (warning threshold: ${warnThreshold * 100}%)`,
                quota
            };
        }

        return {
            sufficient: true,
            quota
        };
    }

    /**
     * Generate audio for course/module/lesson intro
     */
    async generateIntroAudio(
        script: string,
        type: 'course' | 'module' | 'lesson'
    ): Promise<{ audioBuffer: Buffer; duration: number; charactersUsed: number }> {
        // Default to Sarah's voice for all intros
        const voiceId = ELEVENLABS_VOICES.SARAH.voice_id;

        console.log(`🎤 Generating ${type} intro audio with ElevenLabs (${script.length} chars)...`);

        const audioBuffer = await this.generateSpeech(script, voiceId);

        // Estimate duration (rough approximation: ~150 chars per minute of speech)
        const estimatedDuration = Math.max((script.length / 150) * 60, 5);

        return {
            audioBuffer,
            duration: estimatedDuration,
            charactersUsed: script.length
        };
    }

    /**
     * Print usage report to console
     */
    async printUsageReport(): Promise<void> {
        try {
            const quota = await this.checkUsageQuota();

            console.log('\n' + '='.repeat(60));
            console.log('📊 ELEVENLABS USAGE REPORT');
            console.log('='.repeat(60));
            console.log(`\n📋 Subscription: ${quota.tier}`);
            console.log(`   Character limit: ${quota.character_limit.toLocaleString()}`);
            console.log(`   Characters used: ${quota.character_count.toLocaleString()}`);
            console.log(`   Characters remaining: ${quota.characters_remaining.toLocaleString()}`);
            console.log(`   Usage: ${quota.usage_percent.toFixed(1)}%`);

            const barLength = 40;
            const filled = Math.round((quota.usage_percent / 100) * barLength);
            const bar = '█'.repeat(filled) + '░'.repeat(barLength - filled);
            console.log(`   [${bar}] ${quota.usage_percent.toFixed(1)}%`);

            console.log(`\n🎬 Estimated videos remaining: ~${quota.videos_remaining}`);

            if (quota.next_reset_unix) {
                const resetDate = new Date(quota.next_reset_unix * 1000);
                console.log(`🔄 Quota resets: ${resetDate.toLocaleString()}`);
            }

            console.log('='.repeat(60) + '\n');
        } catch (error) {
            console.error('Failed to fetch ElevenLabs usage:', error);
        }
    }
}

// Singleton instance
export const elevenLabsService = new ElevenLabsService();
