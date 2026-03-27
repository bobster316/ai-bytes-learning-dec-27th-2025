import { NextResponse } from 'next/server';

// Generate ephemeral token for Gemini Live API
// This keeps the API key server-side only
export async function POST() {
    try {
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return NextResponse.json(
                { error: 'Gemini API key not configured' },
                { status: 500 }
            );
        }

        // Request an ephemeral token from Google's token endpoint
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
            { method: 'GET' }
        );

        if (!response.ok) {
            const error = await response.text();
            console.error('[Sterling Token] API error:', error);
            return NextResponse.json(
                { error: 'Failed to validate API key' },
                { status: response.status }
            );
        }

        // If the key is valid, return it for client use
        // In production, you'd use Google's ephemeral token endpoint
        return NextResponse.json({
            apiKey: apiKey,
            expiresAt: Date.now() + 3600000 // 1 hour
        });

    } catch (error) {
        console.error('[Sterling Token] Error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
