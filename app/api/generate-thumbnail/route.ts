import { NextRequest, NextResponse } from 'next/server';
import { imageService } from '@/lib/ai/image-service';

export async function POST(request: NextRequest) {
    try {
        const { title, description } = await request.json();

        console.log(`[ThumbnailGenerator] Generating "WOW" thumbnail for: "${title}"`);

        // Use the new integrated image service which handles prompt generation, 
        // AI image creation, and server-side title overlay with sharp.
        const thumbnailUrl = await imageService.fetchCourseThumbnail(title, description);

        if (thumbnailUrl) {
            return NextResponse.json({
                imageUrl: thumbnailUrl,
                thumbnail_url: thumbnailUrl,
                title
            });
        }

        return NextResponse.json({ error: 'Failed to generate thumbnail' }, { status: 500 });

    } catch (error) {
        console.error('Thumbnail generation error:', error);
        return NextResponse.json(
            { error: 'Failed to generate thumbnail' },
            { status: 500 }
        );
    }
}
