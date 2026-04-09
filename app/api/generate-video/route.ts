import { NextResponse } from 'next/server';
import { kieVideoService } from '@/lib/ai/kie-video-service';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { prompt } = body;

        if (!prompt) {
            return NextResponse.json(
                { error: 'Prompt is required' },
                { status: 400 }
            );
        }

        const result = await kieVideoService.generateVideo(prompt);

        if (!result.url) {
            return NextResponse.json(
                { error: result.errorMessage || 'Failed to generate video' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            url: result.url,
            source: result.source
        });
    } catch (e: any) {
        return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
    }
}
