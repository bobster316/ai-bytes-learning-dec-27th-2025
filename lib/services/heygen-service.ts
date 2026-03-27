/**
 * HeyGen Video Generation Service
 * Supports both Standard Avatar API and Avatar IV (Instant Avatar) API
 * 
 * Standard Avatar: Pre-made avatars using Template API
 * Avatar IV: Custom instant avatars from photos
 * 
 * Documentation: 
 * - Standard: https://docs.heygen.com/reference/generate-from-template-v2
 * - Avatar IV: https://docs.heygen.com/docs/create-avatar-iv-videos
 */

import { audioStorageService } from './audio-storage';

export interface HeyGenVideoRequest {
    audioUrl: string; // Public URL to audio file
    duration: number;
    title?: string; // Optional title to display in video
    voiceId?: string; // Optional ElevenLabs voice ID for lip-sync
    useAvatarIV?: boolean; // Use Avatar IV (instant avatar) instead of standard avatar
    avatarId?: string; // Optional avatar ID override
    aspectRatio?: '16:9' | '1:1'; // Desired aspect ratio
    background?: 'transparent' | 'office' | string; // Background type or custom URL
}

export interface AvatarIVRequest {
    imageKey: string; // Asset ID from photo upload
    script: string; // Text to speak
    voiceId: string; // Voice identifier
    title?: string; // Video title
    customMotionPrompt?: string; // Gesture/expression guidance
    enhanceMotionPrompt?: boolean; // AI-enhance motion prompt
}

export interface HeyGenVideoResult {
    jobId: string; // HeyGen video_id
    status: 'queued' | 'processing' | 'completed' | 'failed';
    videoUrl?: string;
    error?: string;
}

export interface HeyGenCreditsInfo {
    total_seconds: number;
    used_seconds: number;
    remaining_seconds: number;
    usage_percent: number;
    estimated_gbp_remaining: number;
    cost_per_minute_gbp: number;
}

/**
 * Avatar configuration for HeyGen Templates
 * Returns avatar config with template IDs from environment
 */
export function getHeyGenAvatars() {
    return {
        SARAH: {
            id: 'sarah_avatar',
            name: 'Sarah',
            description: 'Exclusive AI Bytes Host - Professional, warm, welcoming',
            avatarId: process.env.HEYGEN_AVATAR_SARAH_ID || 'dca5f0bcd8524f079791fbb46f808c01'
        },
        GEMMA: {
            id: 'gemma_avatar',
            name: 'Gemma',
            description: 'AI Bytes Specialist - UK English, mid-20s, energetic',
            avatarId: process.env.HEYGEN_AVATAR_GEMMA_ID || 'bac885ddd8394adfb430c49228da760c'
        }
    } as const;
}

export class HeyGenService {
    private apiKey?: string;
    private baseUrl = 'https://api.heygen.com';

    private getApiKey(): string {
        if (this.apiKey === undefined) {
            const apiKey = process.env.HEYGEN_API_KEY;
            if (!apiKey) {
                console.warn('⚠️  HEYGEN_API_KEY not configured - video generation will be skipped');
                this.apiKey = '';
            } else {
                this.apiKey = apiKey;
            }
        }
        return this.apiKey;
    }

    /**
     * Check if HeyGen is properly configured
     */
    isConfigured(): boolean {
        return !!this.getApiKey() &&
            !!process.env.HEYGEN_TEMPLATE_COURSE_INTRO &&
            !!process.env.HEYGEN_TEMPLATE_MODULE_INTRO;
    }

    /**
     * Generate video with HeyGen Create Avatar Video API v2
     * This is the correct endpoint for avatar lip-sync with external audio URLs
     * 
     * @param request Video generation request with audio URL
     * @returns Video job ID and status
     */
    async generateVideo(request: HeyGenVideoRequest): Promise<HeyGenVideoResult> {
        if (!this.getApiKey()) {
            console.warn('⚠️  HeyGen not configured - skipping video generation');
            return {
                jobId: `mock_${Date.now()}`,
                status: 'failed',
                error: 'HeyGen API key not configured'
            };
        }

        console.log(`🎬 HeyGen: Generating video with ${request.avatarId || 'default'} avatar`);
        console.log(`   Duration: ${request.duration}s`);
        console.log(`   Audio URL: ${request.audioUrl}`);
        console.log(`   Talking Photo ID: ${request.avatarId || 'dca5f0bcd8524f079791fbb46f808c01'} (Fallback to Sarah)`);

        // Pose Randomization for Motion Variety
        // Different avatar_style values create varied physical positioning and gestures
        const avatarStyles = [
            'normal',      // Standard professional pose
            'casual',      // More relaxed, natural movements
            'formal'       // Upright, minimal movement
        ];

        // Randomly select a style to prevent repetitive motion
        const selectedStyle = avatarStyles[Math.floor(Math.random() * avatarStyles.length)];
        console.log(`   Avatar Style: ${selectedStyle} (randomized for variety)`);

        // Guard against missing avatarId
        const activeAvatarId = request.avatarId;
        if (!activeAvatarId) {
            console.error('❌ HeyGen: No Avatar ID provided in request');
            throw new Error('Avatar ID is required for HeyGen generation');
        }

        try {
            // Call HeyGen Create Avatar Video API v2 (Scene API)
            const url = `${this.baseUrl}/v2/video/generate`;
            console.log(`[DEBUG] Calling HeyGen URL: ${url}`);

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'X-Api-Key': this.getApiKey()
                },
                body: JSON.stringify({
                    test: false, // Force production mode
                    title: request.title || 'AI Bytes Video',
                    video_inputs: [
                        {
                            character: {
                                type: 'talking_photo',
                                talking_photo_id: activeAvatarId,
                                fit: 'cover',
                                avatar_style: selectedStyle
                            },
                            voice: {
                                type: 'audio',
                                audio_url: request.audioUrl,
                            },
                            background: (request.background?.startsWith('http'))
                                ? {
                                    type: 'image',
                                    url: request.background,
                                    fit: 'cover'
                                }
                                : (request.background === 'office')
                                    ? {
                                        type: 'image',
                                        url: 'https://aysqedgkpdbcbubadrrr.supabase.co/storage/v1/object/public/course-audio/backgrounds/office-blur-1769806597220.png',
                                        fit: 'cover'
                                    }
                                    : (request.background?.startsWith('#'))
                                        ? {
                                            type: 'color',
                                            value: request.background
                                        }
                                        : {
                                            type: 'color',
                                            value: '#00FF00' // Default to Green Screen
                                        }
                        }
                    ],
                    dimension: request.aspectRatio === '1:1'
                        ? { width: 720, height: 720 }
                        : { width: 1280, height: 720 },
                    aspect_ratio: request.aspectRatio || '16:9'
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HeyGen API error (${response.status}): ${errorText}`);
            }

            const data = await response.json();

            console.log(`✅ HeyGen: Video generation started`);
            console.log(`   Video ID: ${data.data?.video_id || data.video_id}`);

            return {
                jobId: data.data?.video_id || data.video_id,
                status: 'queued'
            };

        } catch (error: any) {
            console.error('❌ HeyGen: Video generation failed:', error.message);
            throw error;
        }
    }

    /**
     * Pre-flight check to ensure sufficient credits and permissions
     * @param durationSeconds Estimated duration of the video
     * @throws Error if credits are insufficient
     */
    async preFlightCheck(durationSeconds: number): Promise<HeyGenCreditsInfo> {
        console.log(`🔍 HeyGen: Performing pre-flight check for ${durationSeconds}s video...`);

        const credits = await this.checkCredits();
        const requiredSeconds = durationSeconds; // Now working directly in seconds

        console.log(`   Required: ${requiredSeconds}s`);
        console.log(`   Available: ${credits.remaining_seconds}s`);
        console.log(`   Estimated Cost: £${((requiredSeconds / 60) * credits.cost_per_minute_gbp).toFixed(2)}`);

        if (credits.remaining_seconds < requiredSeconds) {
            throw new Error(`Insufficient HeyGen quota. Required: ${requiredSeconds}s, Available: ${credits.remaining_seconds}s. Estimated cost: £${(((requiredSeconds - credits.remaining_seconds) / 60) * credits.cost_per_minute_gbp).toFixed(2)}`);
        }

        console.log('✅ Pre-flight check passed');
        return credits;
    }

    /**
     * Check video generation status
     * 
     * @param videoId HeyGen video ID
     * @returns Video status and URL if completed
     */
    async checkVideoStatus(videoId: string): Promise<HeyGenVideoResult> {
        if (!this.isConfigured()) {
            return {
                jobId: videoId,
                status: 'failed',
                error: 'HeyGen not configured'
            };
        }

        console.log(`🔍 HeyGen: Checking status for video ${videoId}`);

        try {
            const response = await fetch(`${this.baseUrl}/v1/video_status.get?video_id=${videoId}`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'X-Api-Key': this.getApiKey()
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HeyGen API error(${response.status}): ${errorText} `);
            }

            const data = await response.json();
            console.log('🔍 HeyGen Raw Status Data:', JSON.stringify(data, null, 2));
            const videoData = data.data || data;

            // Map HeyGen status to our status
            let status: 'queued' | 'processing' | 'completed' | 'failed' = 'processing';
            if (videoData.status === 'completed') {
                status = 'completed';
            } else if (videoData.status === 'failed') {
                status = 'failed';
            } else if (videoData.status === 'pending') {
                status = 'queued';
            }

            console.log(`   Status: ${status} `);
            if (videoData.video_url) {
                console.log(`   Video URL: ${videoData.video_url} `);
            }

            return {
                jobId: videoId,
                status,
                videoUrl: videoData.video_url,
                error: videoData.error
            };

        } catch (error: any) {
            console.error('❌ HeyGen: Status check failed:', error.message);
            return {
                jobId: videoId,
                status: 'failed',
                error: error.message
            };
        }
    }

    /**
     * Estimate GenCredits required for video
     * HeyGen pricing: 3 seconds = 1 GenCredit
     */
    estimateCredits(durationSeconds: number): number {
        return Math.ceil(durationSeconds / 3);
    }

    /**
     * Check available GenCredits
     * 
     * NOTE: This requires the User API endpoint
     */
    async checkCredits(): Promise<HeyGenCreditsInfo> {
        if (!this.isConfigured()) {
            return {
                total_seconds: 0,
                used_seconds: 0,
                remaining_seconds: 0,
                usage_percent: 0,
                estimated_gbp_remaining: 0,
                cost_per_minute_gbp: 0.80
            };
        }

        console.log('💳 Checking HeyGen GenCredits...');

        try {
            const response = await fetch(`${this.baseUrl}/v2/user/remaining_quota`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'X-Api-Key': this.getApiKey()
                }
            });

            if (!response.ok) {
                console.warn('   ⚠️  Could not fetch credits from API');
                console.log('   Please check manually at: https://app.heygen.com/settings/subscription');
                return {
                    total_seconds: 0,
                    used_seconds: 0,
                    remaining_seconds: 0,
                    usage_percent: 0,
                    estimated_gbp_remaining: 0,
                    cost_per_minute_gbp: 0.80
                };
            }

            const data = await response.json();
            const userData = data.data || data;

            const total = userData.total_quota || 0; // This is in seconds
            const remaining = userData.remaining_quota || 0; // This is in seconds
            const used = total - remaining;
            const usage_percent = total > 0 ? (used / total) * 100 : 0;

            // Corrected Estimate based on HeyGen API Pro Plan ($0.99/credit where 1 credit = 1 minute)
            // £0.80 per minute is a safe estimate for 2026 Pro Tier
            const cost_per_minute_gbp = 0.80;
            const estimated_gbp_remaining = (remaining / 60) * cost_per_minute_gbp;

            return {
                total_seconds: total,
                used_seconds: used,
                remaining_seconds: remaining,
                usage_percent,
                estimated_gbp_remaining,
                cost_per_minute_gbp
            };

        } catch (error) {
            console.error('Failed to fetch HeyGen credits:', error);
            return {
                total_seconds: 0,
                used_seconds: 0,
                remaining_seconds: 0,
                usage_percent: 0,
                estimated_gbp_remaining: 0,
                cost_per_minute_gbp: 1.50
            };
        }
    }

    /**
     * Print credits report
     */
    async printCreditsReport(): Promise<void> {
        try {
            const credits = await this.checkCredits();

            console.log('\n' + '='.repeat(60));
            console.log('💳 HEYGEN GENCREDITS REPORT');
            console.log('='.repeat(60));
            console.log(`\n✅ Quota Balance (Seconds): `);
            console.log(`   Remaining:      ${credits.remaining_seconds}s (${(credits.remaining_seconds / 60).toFixed(1)} mins)`);
            console.log(`   Estimated Value: £${credits.estimated_gbp_remaining.toFixed(2)} `);
            console.log(`   Rate:           £${credits.cost_per_minute_gbp.toFixed(2)} per minute `);
            console.log(`   Usage:          ${credits.usage_percent.toFixed(1)}% `);

            const barLength = 40;
            const filled = Math.round((credits.usage_percent / 100) * barLength);
            const bar = '█'.repeat(filled) + '░'.repeat(barLength - filled);
            console.log(`   [${bar}] ${credits.usage_percent.toFixed(1)}% `);

            console.log(`\n🎬 Estimated videos remaining: `);
            console.log(`   20 - second videos: ~${Math.floor(credits.remaining_seconds / 20)} `);
            console.log(`   30 - second videos: ~${Math.floor(credits.remaining_seconds / 30)} `);
            console.log(`   60 - second videos: ~${Math.floor(credits.remaining_seconds / 60)} `);

            console.log('\n📸 Manual check: https://app.heygen.com/settings/subscription');
            console.log('='.repeat(60) + '\n');
        } catch (error) {
            console.error('Failed to fetch HeyGen credits:', error);
        }
    }

    /**
     * Generate video batch for course
     */
    async generateCourseBatch(videos: Array<{
        type: 'course_intro' | 'module_intro' | 'lesson_intro';
        audioUrl: string;
        duration: number;
        avatarType: 'sarah' | 'lana';
        title?: string;
    }>): Promise<Record<string, string>> {
        console.log(`🎬 Generating ${videos.length} videos with HeyGen...`);

        const results: Record<string, string> = {};

        for (const video of videos) {
            try {
                const result = await this.generateVideo({
                    audioUrl: video.audioUrl,
                    duration: video.duration,
                    title: video.title
                });

                results[video.type] = result.jobId;
                console.log(`   ✅ ${video.type}: ${result.jobId} `);
            } catch (error) {
                console.error(`   ❌ ${video.type} failed: `, error);
            }
        }

        return results;
    }

    /**
     * Upload photo for Avatar IV (Instant Avatar)
     * @param imagePath Path to the avatar photo
     * @returns image_key (asset_id) for use in Avatar IV generation
     */
    async uploadAvatarPhoto(imagePath: string): Promise<string> {
        const uploadUrl = 'https://upload.heygen.com';

        console.log(`📤 Uploading avatar photo: ${imagePath} `);

        try {
            const fs = await import('fs');

            // Use native Node.js Web APIs (available in Node 18+)
            // This avoids issues with external form-data libraries
            const fileBuffer = await fs.promises.readFile(imagePath);
            const fileBlob = new Blob([fileBuffer], { type: 'image/png' });

            const form = new FormData();
            form.append('file', fileBlob, 'avatar.png');

            const response = await fetch(`${uploadUrl}/v1/asset`, {
                method: 'POST',
                headers: {
                    'X-Api-Key': this.getApiKey(),
                    // Native fetch with FormData automatically sets Content-Type with boundary
                },
                body: form
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Photo upload failed(${response.status}): ${errorText} `);
            }

            const data = await response.json();

            if (data.code === 100) {
                const imageKey = data.data.asset_id;
                console.log(`✅ Photo uploaded successfully`);
                console.log(`   Image Key: ${imageKey} `);
                return imageKey;
            } else {
                throw new Error(`Upload failed: ${data.message} `);
            }
        } catch (error: any) {
            console.error(`❌ HeyGen: Photo upload failed: `, error.message);
            throw error;
        }
    }

    /**
     * Generate Avatar IV video from photo
     * @param request Avatar IV generation request
     * @returns Video job ID and status
     */
    async generateAvatarIVVideo(request: AvatarIVRequest): Promise<HeyGenVideoResult> {
        if (!this.getApiKey()) {
            console.warn('⚠️  HeyGen not configured - skipping Avatar IV generation');
            return {
                jobId: `mock_${Date.now()} `,
                status: 'failed',
                error: 'HeyGen API key not configured'
            };
        }

        console.log(`🎬 HeyGen Avatar IV: Generating video`);
        console.log(`   Image Key: ${request.imageKey} `);
        console.log(`   Script length: ${request.script.length} chars`);

        try {
            const payload: any = {
                image_key: request.imageKey,
                video_title: request.title || 'Avatar IV Video',
                script: request.script,
                voice_id: request.voiceId
            };

            if (request.customMotionPrompt) {
                payload.custom_motion_prompt = request.customMotionPrompt;
                payload.enhance_custom_motion_prompt = request.enhanceMotionPrompt ?? true;
            }

            const response = await fetch(`${this.baseUrl}/v2/video/av4/generate`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'X-Api-Key': this.getApiKey()
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Avatar IV API error(${response.status}): ${errorText} `);
            }

            const data = await response.json();

            if (data.code === 100) {
                const videoId = data.data.video_id;
                console.log(`✅ HeyGen Avatar IV: Video generation started`);
                console.log(`   Video ID: ${videoId} `);

                return {
                    jobId: videoId,
                    status: 'queued'
                };
            } else {
                throw new Error(`Avatar IV generation failed: ${data.message} `);
            }
        } catch (error: any) {
            console.error(`❌ HeyGen: Avatar IV generation failed: `, error.message);
            return {
                jobId: `failed_${Date.now()} `,
                status: 'failed',
                error: error.message
            };
        }
    }

    /**
     * Generate video using Template API v2
     * This is the recommended workflow for custom avatars on Creator plans
     * 
     * @param templateId The HeyGen template ID (must have audio_url variable)
     * @param audioUrl URL to the audio file
     * @param title Optional video title
     * @returns Video job ID and status
     */
    async generateVideoFromTemplate(
        templateId: string,
        audioUrl: string,
        title?: string
    ): Promise<HeyGenVideoResult> {
        console.log(`🎬 HeyGen Template: Generating video from template ${templateId} `);
        console.log(`   Audio URL: ${audioUrl} `);

        try {
            const payload = {
                test: false,
                caption: false,
                title: title || 'Template Video',
                variables: {
                    audio_url: {
                        name: 'audio_url',
                        type: 'voice',
                        properties: {
                            audio_url: audioUrl,
                            voice_id: '915ecf673764496a9589d3de49098540'
                        }
                    }
                }
            };

            const response = await fetch(`${this.baseUrl}/v2/template/${templateId}/generate`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'X-Api-Key': this.getApiKey()
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Template API error (${response.status}): ${errorText}`);
            }

            const data = await response.json();

            if (data.code === 100) {
                const videoId = data.data.video_id;
                console.log(`✅ HeyGen Template: Video generation started`);
                console.log(`   Video ID: ${videoId}`);

                return {
                    jobId: videoId,
                    status: 'queued'
                };
            } else {
                throw new Error(`Template generation failed: ${data.message}`);
            }
        } catch (error: any) {
            console.error(`❌ HeyGen Template: Video generation failed:`, error.message);
            return {
                jobId: `failed_${Date.now()}`,
                status: 'failed',
                error: error.message
            };
        }
    }
}

// Singleton instance
export const heyGenService = new HeyGenService();

