
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import os from 'os';

export async function POST(request: NextRequest) {
    try {
        const { imageData, filename } = await request.json();

        if (!imageData || !filename) {
            return NextResponse.json({ error: 'Missing data' }, { status: 400 });
        }

        // 1. Determine Downloads Folder
        const homeDir = os.homedir();
        const downloadsPath = path.join(homeDir, 'Downloads');

        // Ensure filename is safe
        const safeFilename = filename.replace(/[^a-zA-Z0-9_\-\.]/g, '_');
        const fullPath = path.join(downloadsPath, safeFilename);

        // 2. Convert Data URL to Buffer
        const base64Data = imageData.replace(/^data:image\/\w+;base64,/, "");
        const buffer = Buffer.from(base64Data, 'base64');

        // 3. Write File
        await fs.promises.writeFile(fullPath, buffer);

        console.log(`Saved thumbnail to: ${fullPath}`);

        return NextResponse.json({
            success: true,
            path: fullPath
        });

    } catch (error: any) {
        console.error('Server save error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to save file' },
            { status: 500 }
        );
    }
}
