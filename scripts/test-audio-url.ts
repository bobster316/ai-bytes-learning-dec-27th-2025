/**
 * Test Supabase Audio URL Accessibility
 * 
 * Tests if the audio URLs are actually publicly accessible
 * 
 * Run: npx tsx scripts/test-audio-url.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

async function testAudioURL() {
    const testUrl = 'https://aysqedgkpdbcbubadrrr.supabase.co/storage/v1/object/public/course-audio/1769605220205_heygen-test-video.mp3';

    console.log('Testing audio URL accessibility...');
    console.log('URL:', testUrl);
    console.log('');

    try {
        const response = await fetch(testUrl, {
            method: 'HEAD' // Just check headers, don't download
        });

        console.log('Status:', response.status);
        console.log('Status Text:', response.statusText);
        console.log('Content-Type:', response.headers.get('content-type'));
        console.log('Content-Length:', response.headers.get('content-length'));
        console.log('');

        if (response.ok) {
            console.log('✅ URL is publicly accessible!');
        } else {
            console.log('❌ URL is NOT accessible');
            console.log('This is why HeyGen cannot download the audio file.');
            console.log('');
            console.log('Fix: Make the course-audio bucket public in Supabase dashboard');
        }

    } catch (error: any) {
        console.error('❌ Failed to access URL');
        console.error('Error:', error.message);
    }
}

testAudioURL();
