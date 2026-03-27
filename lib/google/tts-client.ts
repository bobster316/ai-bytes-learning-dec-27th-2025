
import { GoogleAuth } from 'google-auth-library';
import path from 'path';

export class GoogleTTSClient {
    private baseUrl = 'https://texttospeech.googleapis.com/v1/text:synthesize';
    private auth: GoogleAuth;

    constructor() {
        // Automatically finds GOOGLE_APPLICATION_CREDENTIALS env var or looks for default paths.
        // We ensure it points to our file if not set globally, or just pass keyFile.
        this.auth = new GoogleAuth({
            keyFile: path.join(process.cwd(), 'google-application-credentials.json'),
            scopes: ['https://www.googleapis.com/auth/cloud-platform'],
        });
    }

    /**
     * Generates speech from text using Google Cloud TTS Neural2 voices.
     */
    async generateSpeech(text: string, voiceId: string = 'en-GB-Neural2-A'): Promise<Buffer> {

        try {
            const client = await this.auth.getClient();
            const token = await client.getAccessToken();

            if (!token.token) {
                throw new Error("Failed to generate Access Token");
            }

            const requestBody = {
                input: { text },
                voice: {
                    languageCode: voiceId.split('-').slice(0, 2).join('-'),
                    name: voiceId
                },
                audioConfig: {
                    audioEncoding: 'LINEAR16', // WAV format for deterministic duration
                    sampleRateHertz: 24000,
                    effectsProfileId: ['small-bluetooth-speaker-class-device'],
                    pitch: 0,
                    speakingRate: 1
                }
            };

            const response = await fetch(this.baseUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Google TTS API Error [${response.status}]: ${errorText}`);
            }

            const data = await response.json();
            if (!data.audioContent) {
                throw new Error('Google TTS response missing audioContent');
            }

            return Buffer.from(data.audioContent, 'base64');
        } catch (error) {
            console.error("GoogleTTSClient Error:", error);
            throw error;
        }
    }
}

export const googleTTSClient = new GoogleTTSClient();
