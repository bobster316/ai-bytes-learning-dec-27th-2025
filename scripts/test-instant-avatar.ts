
import { config } from 'dotenv';
import { resolve } from 'path';
import { heyGenService } from '../lib/services/heygen-service';
import { audioStorageService } from '../lib/services/audio-storage';
import { elevenLabsService } from '../lib/services/elevenlabs-service';

config({ path: resolve(process.cwd(), '.env.local') });

async function testInstantAvatar() {
    console.log('================================================================');
    console.log('🧪 TEST: Instant Avatar (Full Body Motion)');
    console.log('================================================================');

    try {
        // Use the Clean Transparent ID
        // If this ID is for a Talking Photo, this request will FAIL.
        // If it is for an Instant Avatar, it will SUCCEED and animate shoulders.
        const avatarId = '3e877145bf614243accb2ca53da629a6';

        console.log(`Using Avatar ID: ${avatarId}`);

        // 2. Generate Audio
        const text = "Hi, I am Sarah. This is a test to see if I can move my shoulders and arms as an Instant Avatar.";
        const audioBuffer = await elevenLabsService.generateSpeech(text, '0sGQQaD2G2X1s87kHM5b');
        const { publicUrl: audioUrl } = await audioStorageService.uploadAudio(audioBuffer, `test-motion-${Date.now()}.mp3`);

        // 3. Call API Manually to bypass service logic
        // We want to force `type: avatar`
        const apiKey = process.env.HEYGEN_API_KEY!;
        const url = 'https://api.heygen.com/v2/video/generate';

        const payload = {
            video_inputs: [
                {
                    character: {
                        type: 'avatar',
                        avatar_id: avatarId,
                        avatar_style: 'normal'
                    },
                    voice: {
                        type: 'audio',
                        audio_url: audioUrl
                    },
                    background: {
                        type: 'color',
                        value: '#00FF00' // Green Screen Test
                    }
                }
            ],
            test: true, // Use test mode for this diagnostic
            aspect_ratio: '16:9'
        };

        console.log('Sending Payload:', JSON.stringify(payload, null, 2));

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Api-Key': apiKey
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        console.log('HTTP Status:', response.status);
        if (data.error) {
            console.log('❌ Error:', JSON.stringify(data.error));
        } else {
            console.log('✅ Success! Video ID:', data.data?.video_id || data.video_id);
        }

    } catch (error: any) {
        console.error(error);
    }
}

testInstantAvatar();
