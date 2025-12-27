import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || 'dummy-key-if-missing',
});

export const runtime = 'edge';

export async function POST(req: Request) {
    try {
        const { messages } = await req.json();

        if (!process.env.OPENAI_API_KEY) {
            // Fallback for tests or if key is missing
            return NextResponse.json({
                content: "I'm sorry, I cannot connect to my brain right now. Please check my API key configuration."
            });
        }

        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "system",
                    content: "You are Aria, an enthusiastic and helpful AI tutor for 'AI Bytes Learning'. You help users understand AI concepts simply. Keep answers concise (under 2 sentences) for voice interaction."
                },
                ...messages
            ],
        });

        const reply = completion.choices[0].message.content;

        return NextResponse.json({ content: reply });
    } catch (error) {
        console.error('Error in chat-agent:', error);
        return NextResponse.json(
            { error: 'Failed to process request' },
            { status: 500 }
        );
    }
}
