
import { NextRequest, NextResponse } from 'next/server';
import { aiClient } from '@/lib/ai/groq';

export async function POST(req: NextRequest) {
    try {
        const { title, difficulty } = await req.json();
        if (!title || !difficulty) {
            return NextResponse.json({ error: 'Title and difficulty are required' }, { status: 400 });
        }

        const description = await aiClient.generateDescription(title, difficulty);
        return NextResponse.json({ description });
    } catch (error: any) {
        console.error('[API] Description generation failed:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
