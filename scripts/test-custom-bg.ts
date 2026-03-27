
import { config } from 'dotenv';
import { resolve } from 'path';
import { heyGenService } from '../lib/services/heygen-service';
import { audioStorageService } from '../lib/services/audio-storage';
import { fs } from 'fs';
// Note: audioStorageService is designed for audio, but let's see if we can reuse it or need a raw upload.
// audioStorageService.uploadAudio takes a Buffer and filename, and uploads to 'course-audio' bucket.
// This is actually fine for images too, as long as we get a public URL.

// Wait, audioStorageService might set Content-Type to audio/mpeg. let's check or just rewrite a simple upload function here.
import { createClient } from '@supabase/supabase-js';
import { readFile } from 'fs/promises';

config({ path: resolve(process.cwd(), '.env.local') });

async function createCustomBgVideo() {
    console.log('================================================================');
    console.log('🖼️  TEST: Custom Background Video (Server Room)');
    console.log('================================================================');

    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // 1. Upload Background Image
        console.log('📤 Uploading custom background...');
        const bgBuffer = await readFile('bg_image.png');
        const bgFilename = `backgrounds/custom-bg-${Date.now()}.png`;

        const { data: uploadData, error: uploadError } = await supabase
            .storage
            .from('course-audio') // reusing existing bucket
            .upload(bgFilename, bgBuffer, {
                contentType: 'image/png',
                upsert: true
            });

        if (uploadError) throw uploadError;

        const { data: { publicUrl: bgUrl } } = supabase
            .storage
            .from('course-audio')
            .getPublicUrl(bgFilename);

        console.log(`   🔗 Background URL: ${bgUrl}`);

        // 2. Generate Video
        console.log('\n🎥 Requesting Video Generation...');
        // We can reuse the previous audio or generate new one. Let's use a simple new one.
        // Actually, let's just reuse the "Welcome" audio URL if available or generate short one.
        // For speed, let's just use a hardcoded audio URL if we have one or generate new.
        // I'll make a quick new one to be safe.

        const { elevenLabsService } = await import('../lib/services/elevenlabs-service');
        const text = "This is a test with the custom server room background you provided. It looks great!";
        const audioBuffer = await elevenLabsService.generateSpeech(text, '0sGQQaD2G2X1s87kHM5b');
        const { publicUrl: audioUrl } = await audioStorageService.uploadAudio(audioBuffer, `custom-bg-audio-${Date.now()}.mp3`);

        const result = await heyGenService.generateVideo({
            audioUrl: audioUrl,
            avatarType: 'sarah',
            duration: 5,
            title: 'Custom BG Test - Server Room',
            aspectRatio: '16:9',
            background: bgUrl // Passing the URL directly!
        });

        console.log(`   ✅ Job ID: ${result.jobId}`);

        // 3. Monitor
        console.log('\n================================================================');
        console.log('🚀 MONITORING STATUS...');
        console.log('================================================================');

        const id = result.jobId;
        for (let i = 0; i < 15; i++) {
            console.log(`\n--- Check ${i + 1} ---`);
            const status = await heyGenService.checkVideoStatus(id);
            console.log(`Job ${id}: ${status.status}`);

            if (status.status === 'completed') {
                console.log(`\n🎉 SUCCESS! Video Ready:`);
                console.log(`🔗 URL: ${status.videoUrl}`);
                break;
            } else if (status.status === 'failed') {
                console.log(`\n❌ FAILED. Check dashboard.`);
                break;
            }
            await new Promise(r => setTimeout(r, 10000));
        }

    } catch (error: any) {
        console.error('\n❌ TEST FAILED:', error.message);
    }
}

createCustomBgVideo();
