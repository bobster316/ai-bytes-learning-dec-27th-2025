import { NextResponse } from 'next/server';
import { voiceService } from '@/lib/ai/voice-ai-service';

export async function POST(req: Request) {
    try {
        const { text, context } = await req.json();

        if (!text) {
            return NextResponse.json({ error: 'Message text is required' }, { status: 400 });
        }

        const response = await voiceService.processMessage(text, context || {});

        return NextResponse.json(response);
    } catch (error) {
        console.error('Voice API Error:', error);
        return NextResponse.json(
            { error: 'Failed to process voice request', text: "I'm sorry, I encountered an error." },
            { status: 500 }
        );
    }
}
