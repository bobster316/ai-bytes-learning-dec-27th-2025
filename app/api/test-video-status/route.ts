
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
        return NextResponse.json({ error: 'Missing ID' }, { status: 400 });
    }

    const apiKey = process.env.HEYGEN_API_KEY;
    if (!apiKey) {
        return NextResponse.json({ error: 'Server misconfiguration: No API Key' }, { status: 500 });
    }

    try {
        const response = await fetch(`https://api.heygen.com/v1/video_status.get?video_id=${id}`, {
            headers: {
                'X-Api-Key': apiKey,
                'Accept': 'application/json'
            }
        });

        const data = await response.json();

        if (data.code === 100 && data.data) {
            return NextResponse.json({
                status: data.data.status,
                url: data.data.video_url,
                error: data.data.error
            });
        }

        return NextResponse.json(data);

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
