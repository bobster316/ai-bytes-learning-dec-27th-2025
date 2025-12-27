
import { NextResponse } from 'next/server';
import { ttsService } from '@/lib/ai/text-to-speech';

export async function POST(req: Request) {
    try {
        const { text } = await req.json();

        if (!text) {
            return NextResponse.json({ error: 'Text is required' }, { status: 400 });
        }

        const audioUrl = await ttsService.generateSpeech(text);

        if (!audioUrl) {
            return NextResponse.json({ error: 'Failed to generate speech' }, { status: 500 });
        }

        return NextResponse.json({ audio: audioUrl });
    } catch (error) {
        console.error('TTS API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
