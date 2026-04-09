import { NextResponse } from 'next/server';
import { falImageService } from '@/lib/ai/fal-image-service';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { prompt, concept } = body;

        if (!prompt || !concept) {
            return NextResponse.json(
                { error: 'Both prompt and concept are required' },
                { status: 400 }
            );
        }

        const result = await falImageService.generateImage(prompt, concept);

        if (!result.url) {
            return NextResponse.json(
                { error: result.errorMessage || 'Failed to generate image' },
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
