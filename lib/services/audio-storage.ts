/**
 * Audio Storage Service
 * Uploads audio files to Supabase Storage and returns public URLs
 * Used for HeyGen Template API integration (requires publicly accessible audio URLs)
 */

import { createClient } from '@supabase/supabase-js';

export interface AudioUploadResult {
    publicUrl: string;
    filePath: string;
    bucket: string;
}

export class AudioStorageService {
    private supabase: any;
    private bucketName = 'course-audio';

    private getSupabaseClient() {
        if (!this.supabase) {
            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
            const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

            if (!supabaseUrl || !supabaseKey) {
                throw new Error('Supabase credentials not configured for audio storage');
            }

            this.supabase = createClient(supabaseUrl, supabaseKey);
        }
        return this.supabase;
    }

    /**
     * Upload audio buffer to Supabase Storage
     * Returns public URL for use with HeyGen Template API
     */
    async uploadAudio(
        audioBuffer: Buffer,
        filename: string,
        options?: {
            contentType?: string;
            cacheControl?: string;
        }
    ): Promise<AudioUploadResult> {
        const contentType = options?.contentType || 'audio/mpeg';
        const cacheControl = options?.cacheControl || '3600'; // 1 hour cache

        // Generate unique filename with timestamp
        const timestamp = Date.now();
        const uniqueFilename = `${timestamp}_${filename}`;
        const filePath = `${uniqueFilename}`;

        console.log(`[AudioStorage] Uploading audio to Supabase Storage...`);
        console.log(`   Bucket: ${this.bucketName}`);
        console.log(`   File: ${filePath}`);
        console.log(`   Size: ${(audioBuffer.length / 1024).toFixed(2)} KB`);

        // Upload to Supabase Storage
        const { data, error } = await this.getSupabaseClient().storage
            .from(this.bucketName)
            .upload(filePath, audioBuffer, {
                contentType,
                cacheControl,
                upsert: false // Don't overwrite existing files
            });

        if (error) {
            console.error('[AudioStorage] Upload failed:', error);
            throw new Error(`Failed to upload audio to Supabase Storage: ${error.message}`);
        }

        // Get public URL
        const { data: urlData } = this.getSupabaseClient().storage
            .from(this.bucketName)
            .getPublicUrl(filePath);

        const publicUrl = urlData.publicUrl;

        console.log(`[AudioStorage] ✅ Upload successful`);
        console.log(`   Public URL: ${publicUrl}`);

        return {
            publicUrl,
            filePath,
            bucket: this.bucketName
        };
    }

    /**
     * Delete audio file from storage
     * Use for cleanup after video generation completes
     */
    async deleteAudio(filePath: string): Promise<void> {
        console.log(`[AudioStorage] Deleting audio file: ${filePath}`);

        const { error } = await this.getSupabaseClient().storage
            .from(this.bucketName)
            .remove([filePath]);

        if (error) {
            console.error('[AudioStorage] Delete failed:', error);
            throw new Error(`Failed to delete audio: ${error.message}`);
        }

        console.log(`[AudioStorage] ✅ Audio deleted: ${filePath}`);
    }

    /**
     * Delete old audio files (cleanup job)
     * Deletes files older than specified age
     */
    async cleanupOldFiles(olderThanDays: number = 7): Promise<number> {
        console.log(`[AudioStorage] Cleaning up files older than ${olderThanDays} days...`);

        const { data: files, error: listError } = await this.getSupabaseClient().storage
            .from(this.bucketName)
            .list();

        if (listError) {
            console.error('[AudioStorage] Failed to list files:', listError);
            return 0;
        }

        if (!files || files.length === 0) {
            console.log('[AudioStorage] No files to clean up');
            return 0;
        }

        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

        const filesToDelete = files.filter((file: any) => {
            if (!file.created_at) return false;
            const fileDate = new Date(file.created_at);
            return fileDate < cutoffDate;
        });

        if (filesToDelete.length === 0) {
            console.log('[AudioStorage] No old files to delete');
            return 0;
        }

        const filePaths = filesToDelete.map((f: any) => f.name);
        const { error: deleteError } = await this.getSupabaseClient().storage
            .from(this.bucketName)
            .remove(filePaths);

        if (deleteError) {
            console.error('[AudioStorage] Cleanup failed:', deleteError);
            return 0;
        }

        console.log(`[AudioStorage] ✅ Deleted ${filesToDelete.length} old files`);
        return filesToDelete.length;
    }

    /**
     * Check if storage bucket exists and is accessible
     */
    async checkBucketExists(): Promise<boolean> {
        try {
            const { data, error } = await this.getSupabaseClient().storage
                .from(this.bucketName)
                .list('', { limit: 1 });

            if (error) {
                console.error('[AudioStorage] Bucket check failed:', error);
                return false;
            }

            console.log(`[AudioStorage] ✅ Bucket '${this.bucketName}' is accessible`);
            return true;
        } catch (error) {
            console.error('[AudioStorage] Bucket check error:', error);
            return false;
        }
    }

    /**
     * Get storage usage statistics
     */
    async getStorageStats(): Promise<{
        fileCount: number;
        totalSizeBytes: number;
        totalSizeMB: number;
    }> {
        const { data: files, error } = await this.getSupabaseClient().storage
            .from(this.bucketName)
            .list();

        if (error || !files) {
            console.error('[AudioStorage] Failed to get stats:', error);
            return { fileCount: 0, totalSizeBytes: 0, totalSizeMB: 0 };
        }

        const totalSizeBytes = files.reduce((sum: number, file: any) => sum + (file.metadata?.size || 0), 0);
        const totalSizeMB = totalSizeBytes / (1024 * 1024);

        return {
            fileCount: files.length,
            totalSizeBytes,
            totalSizeMB: parseFloat(totalSizeMB.toFixed(2))
        };
    }
}

// Singleton instance
export const audioStorageService = new AudioStorageService();
