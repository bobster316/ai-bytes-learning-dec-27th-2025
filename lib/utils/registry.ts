import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

export const logMediaToRegistry = async (url: string, context: string) => {
    try {
        const registryPath = path.join(process.cwd(), 'media-registry.json');
        let registry = [];
        if (fs.existsSync(registryPath)) {
            const raw = fs.readFileSync(registryPath, 'utf-8');
            registry = JSON.parse(raw);
        }

        const entry = {
            id: generateId(url),
            url,
            context,
            timestamp: new Date().toISOString()
        };

        registry.push(entry);
        fs.writeFileSync(registryPath, JSON.stringify(registry, null, 2));
    } catch (e) {
        // Silent fail in production or if fs not available
        console.error('Registry log skipped');
    }
};

function generateId(url: string) {
    if (url.includes('pexels')) return url.match(/\/photos\/(\d+)\//)?.[1] || url;
    if (url.includes('unsplash')) return url.match(/photo-([a-zA-Z0-9-]+)/)?.[1] || url;
    return url;
}
