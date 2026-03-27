/**
 * Video Generation Service - AI Avatar Integration
 *
 * Uses ElevenLabs (TTS) + HeyGen (avatar video) for high-quality
 * AI presenter videos with transparent background support.
 */

import { VideoScript } from '../types/course-upgrade';
import { googleTTSClient } from '../google/tts-client';
import { elevenLabsService, ELEVENLABS_VOICES } from './elevenlabs-service';
import { heyGenService, getHeyGenAvatars } from './heygen-service';
import { audioStorageService } from './audio-storage';

export interface VideoGenerationResult {
    jobId: string;
    status: 'queued' | 'processing' | 'completed' | 'failed';
    videoUrl?: string;
    error?: string;
}

export interface VideoGenerationOptions {
    useElevenLabs?: boolean; // Use ElevenLabs instead of Google TTS
    useHeyGen?: boolean;     // Always true — HeyGen is the only video backend now
    transparentBackground?: boolean; // Enable transparent background (HeyGen)
    checkQuota?: boolean;    // Check ElevenLabs quota before generation
    avatar?: 'sarah' | 'gemma'; // Which avatar to use
}


export class VideoGenerationService {
    private useElevenLabsByDefault: boolean;
    private useHeyGenByDefault: boolean;

    constructor(options?: VideoGenerationOptions) {
        // Default to new services if available
        this.useElevenLabsByDefault = options?.useElevenLabs ?? true;
        this.useHeyGenByDefault = options?.useHeyGen ?? true; // Using HeyGen by default
    }

    /**
     * Generate a single video with avatar
     */
    async generateVideo(
        script: VideoScript | string,
        type: 'course_introduction' | 'module_introduction' | 'lesson_introduction',
        options?: VideoGenerationOptions
    ): Promise<VideoGenerationResult> {
        const useElevenLabs = options?.useElevenLabs ?? this.useElevenLabsByDefault;
        const useHeyGen = options?.useHeyGen ?? this.useHeyGenByDefault;
        const selectedAvatar = options?.avatar || 'sarah';

        console.log(`[VideoGen] generateVideo called for type: ${type}`);
        console.log(`[VideoGen] selectedAvatar: ${selectedAvatar}`);
        console.log(`[VideoGen] options.avatar: ${options?.avatar}`);

        // Extract script text
        let scriptText = '';
        if (typeof script === 'string') {
            scriptText = script;
        } else {
            scriptText = [
                script.hook?.script || '',
                script.context?.script || '',
                script.coreContent?.segments?.map(s => s.script).join(' ') || '',
                script.recap?.script || ''
            ].filter(s => s).join(' ');
        }

        if (!scriptText.trim()) {
            throw new Error('Empty script provided for video generation');
        }

        console.log(`🎬 Generating ${type} video with ${selectedAvatar} avatar (ElevenLabs + HeyGen)`);

        // Step 1: Generate Audio
        let audioBuffer: Buffer;
        let audioDuration: number;
        let charactersUsed = 0;

        if (useElevenLabs) {
            // Check quota if requested
            if (options?.checkQuota) {
                const quotaCheck = await elevenLabsService.checkQuotaSufficient(scriptText.length);
                if (!quotaCheck.sufficient) {
                    throw new Error(quotaCheck.warning || 'Insufficient ElevenLabs quota');
                }
                if (quotaCheck.warning) {
                    console.warn(`⚠️  ${quotaCheck.warning}`);
                }
            }

            audioBuffer = await elevenLabsService.generateSpeech(
                scriptText,
                selectedAvatar === 'gemma' ? ELEVENLABS_VOICES.GEMMA.voice_id : ELEVENLABS_VOICES.SARAH.voice_id
            );
            audioDuration = Math.max((scriptText.length / 150) * 60, 5);
            charactersUsed = scriptText.length;
        } else {
            // Fallback to Google TTS
            const voiceId = selectedAvatar === 'gemma' ? 'en-GB-Neural2-F' : 'en-GB-Neural2-A'; // Gemma/Sarah Google TTS voices
            console.log(`🎤 Generating Audio with Google TTS (${scriptText.length} chars)...`);
            audioBuffer = await googleTTSClient.generateSpeech(scriptText, voiceId);

            // Calculate duration for LINEAR16 (24kHz, 16bit, Mono)
            const wavHeaderSize = 44;
            audioDuration = Math.max((audioBuffer.length - wavHeaderSize) / 48000, 0.5);
        }

        console.log(`✅ Audio generated: ${audioDuration.toFixed(2)}s (${charactersUsed || scriptText.length} chars)`);

        // Step 2: Generate Video
        let videoResult: VideoGenerationResult;

        if (useHeyGen) {
            // Upload audio to Supabase Storage to get public URL
            console.log(`📤 Uploading audio to Supabase Storage...`);
            const uploadResult = await audioStorageService.uploadAudio(
                audioBuffer,
                `${type}_${selectedAvatar}_${Date.now()}.mp3`
            );

            console.log(`✅ Audio uploaded: ${uploadResult.publicUrl}`);

            // Get the ElevenLabs voice ID
            const voiceId = selectedAvatar === 'gemma' ? ELEVENLABS_VOICES.GEMMA.voice_id : ELEVENLABS_VOICES.SARAH.voice_id;

            // Get HeyGen Avatar ID
            const avatars = getHeyGenAvatars();
            const avatarId = selectedAvatar === 'gemma' ? avatars.GEMMA.avatarId : avatars.SARAH.avatarId;

            console.log(`[VideoGen] Final HeyGen Avatar Selection:`);
            console.log(`[VideoGen] Name: ${selectedAvatar}`);
            console.log(`[VideoGen] ID: ${avatarId}`);
            console.log(`[VideoGen] Is Gemma? ${selectedAvatar === 'gemma'}`);

            // Use HeyGen for video generation with public audio URL and voice ID
            videoResult = await heyGenService.generateVideo({
                audioUrl: uploadResult.publicUrl,
                duration: audioDuration,
                title: type.replace('_introduction', ''),
                voiceId: useElevenLabs ? voiceId : undefined,
                avatarId: avatarId,
                background: 'office'
            });
        } else {
            // HeyGen is the only supported video backend — throw if explicitly disabled
            throw new Error('[VideoGen] HeyGen is required. useHeyGen must be true.');
        }

        console.log(`✅ Video generation started: ${videoResult.jobId}`);
        return videoResult;
    }

    /**
     * Triggers generation for multiple videos in a course batch
     */
    async triggerCourseVideoBatch(
        courseId: string,
        courseTitle: string,
        videos: Array<{
            type: 'course_introduction' | 'module_introduction' | 'lesson_introduction';
            entityId: string; // Course ID or Topic ID (UUID)
            script: VideoScript | string;
            topicName?: string;
            avatar?: 'sarah' | 'gemma'; // Optional override
        }>,
        options?: VideoGenerationOptions
    ): Promise<Record<string, string>> {
        console.log(`🎬 Triggering Video Generation for Course ${courseId} (${videos.length} videos)...`);

        const useElevenLabs = options?.useElevenLabs ?? this.useElevenLabsByDefault;
        const useHeyGen = options?.useHeyGen ?? this.useHeyGenByDefault;

        // Check quota before starting if using ElevenLabs
        if (useElevenLabs && options?.checkQuota) {
            const totalChars = videos.reduce((sum, v) => {
                return sum + elevenLabsService.estimateCharacterCount(v.script);
            }, 0);

            const quotaCheck = await elevenLabsService.checkQuotaSufficient(totalChars);
            if (!quotaCheck.sufficient) {
                throw new Error(`Insufficient quota for batch: ${quotaCheck.warning}`);
            }
        }

        const results: Record<string, string> = {};

        // Process videos sequentially to avoid rate limits
        for (const v of videos) {
            try {
                console.log(`[VideoGen] Batch: Processing ${v.type} for ${v.entityId} with avatar: ${v.avatar || 'none'}`);
                const result = await this.generateVideo(v.script, v.type, {
                    ...options,
                    avatar: v.avatar || options?.avatar,
                    checkQuota: false
                });

                results[v.entityId] = result.jobId;
            } catch (error: any) {
                console.error(`❌ Video generation failed for ${v.entityId}:`, error.message);
            }
        }

        return results;
    }

    /**
     * Check video generation status
     */
    async checkVideoStatus(jobId: string, useHeyGen = false): Promise<VideoGenerationResult> {
        if (useHeyGen) {
            return await heyGenService.checkVideoStatus(jobId);
        } else {
            return {
                jobId,
                status: 'processing'
            };
        }
    }

    /**
     * Print usage reports for all services
     */
    async printUsageReports(): Promise<void> {
        console.log('\n' + '═'.repeat(70));
        console.log('🎯 VIDEO GENERATION USAGE DASHBOARD');
        console.log('═'.repeat(70));

        await elevenLabsService.printUsageReport();
        await heyGenService.printCreditsReport();

        console.log('═'.repeat(70) + '\n');
    }
}

// Singleton instance with default settings
export const videoGenerationService = new VideoGenerationService({
    useElevenLabs: true,
    useHeyGen: true,
    transparentBackground: true,
    checkQuota: true
});
