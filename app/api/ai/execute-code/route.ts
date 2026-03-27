
import { NextRequest, NextResponse } from 'next/server';
import { CodePlaygroundService } from '@/lib/services/code-playground';

export const maxDuration = 300; // Allow 5 minutes for execution


export async function POST(req: NextRequest) {
    try {
        const { code } = await req.json();
        if (!code) {
            return NextResponse.json({ error: 'No code provided' }, { status: 400 });
        }

        const playgroundService = new CodePlaygroundService();
        const result = await playgroundService.executeCode(code);

        return NextResponse.json(result);
    } catch (error: any) {
        console.error('[API] Code execution failed:', error);
        return NextResponse.json({
            stdout: [],
            stderr: [error.message || 'Internal server error during execution']
        }, { status: 500 });
    }
}
