
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
     * Generates speech from text or SSML using Google Cloud TTS Neural2 voices.
     * Pass text containing <break> tags — it will be auto-wrapped in <speak> for SSML.
     * Returns MP3 buffer.
     */
    async generateSpeech(text: string, voiceId: string = 'en-GB-Neural2-B'): Promise<Buffer> {
        // If text contains SSML break/prosody tags, send as SSML input
        const hasSsml = /<break|<prosody|<emphasis/.test(text);
        const input = hasSsml
            ? { ssml: `<speak>${text}</speak>` }
            : { text };

        try {
            const client = await this.auth.getClient();
            const token = await client.getAccessToken();

            if (!token.token) {
                throw new Error("Failed to generate Access Token");
            }

            const requestBody = {
                input,
                voice: {
                    languageCode: voiceId.split('-').slice(0, 2).join('-'),
                    name: voiceId
                },
                audioConfig: {
                    audioEncoding: 'MP3',
                    sampleRateHertz: 24000,
                    pitch: 0,
                    speakingRate: 0.95, // Slightly slower than default — clearer for learning content
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
