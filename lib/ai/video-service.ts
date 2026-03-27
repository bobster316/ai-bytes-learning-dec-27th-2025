import { createClient } from '@supabase/supabase-js';
import { logMediaToRegistry } from '@/lib/utils/registry';
import fs from 'fs';
import path from 'path';
import { CourseState } from './course-state';
import { diagramGenerator } from '@/lib/diagrams/diagram-generator';

const PEXELS_API_KEY = process.env.PEXELS_API_KEY;
const COVERR_API_KEY = process.env.COVERR_API_KEY || 'dummy-key'; // Assuming Coverr usage if available

export interface VideoResolution {
    url: string;
    alt: string;
    tier: number;
    source: string;
}

export class VideoService {
    private sessionUsedIds: Set<string> = new Set();
    private supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    );

    /**
     * Executes the strict 5-tier Video Resolution Waterfall.
     * Tier 1: Pexels High-fidelity intent match
     * Tier 2: Pexels Domain Fallback
     * Tier 3: Coverr Cross-provider search
     * Tier 4: Domain Ambient Video (Local Stub)
     * Tier 5: Ken Burns fallback (Image animation wrapper)
     */
    async fetchVideoWaterfall(query: string, domain: string, courseState: CourseState | null = null): Promise<VideoResolution | null> {
        let avoidedUrls: string[] = courseState ? (courseState.used_video_urls || []).map(v => typeof v === 'string' ? v : v.url) : [];
        
        // Determine the best query: video_search_query > videoPrompt > title > query
        const bestQuery = (courseState as any)?.video_search_query || query;
        
        // Tier 1: High-fidelity intent match (Pexels)
        const tier1 = await this.searchPexelsVideo(bestQuery, avoidedUrls);
        if (tier1) return { ...tier1, tier: 1 };

        // Tier 2: 2-word Domain Fallback (Pexels)
        const domainQuery = domain !== 'Generic' ? `${domain.split(' ').slice(0,2).join(' ')} background` : 'technology background';
        const tier2 = await this.searchPexelsVideo(domainQuery, avoidedUrls);
        if (tier2) return { ...tier2, tier: 2 };

        // Tier 3: Cross-provider search (Coverr)
        const tier3 = await this.searchCoverrVideo(query, avoidedUrls);
        if (tier3) return { ...tier3, tier: 3 };

        // Tier 4: Curated local "Domain Ambient Videos"
        const tier4 = await this.getDomainAmbientVideo(domain);
        if (tier4) return { ...tier4, tier: 4 };

        // Tier 5: If all video sources fail, return null. The frontend will gracefully omit the block.
        return null;
    }

    /**
     * Tier 1 & 2: Main Pexels video search with Composite scoring.
     * HD 1080p preferred > SD; handle 4k gracefully.
     */
    private sanitiseQuery(query: string): string {
        const lower = query.toLowerCase();
        
        // ── STEP 1: Contextual Logic for 'Testing' ──
        // If the query is about testing, we MUST ensure it's not a medical lab unless specified.
        let domainContext = "";
        if (lower.includes('testing') || lower.includes('monitoring') || lower.includes('analysis') || lower.includes('ai')) {
            domainContext = "software dashboard screen technology interface";
        }

        // ── STEP 2: Keyword Extraction (Target 4-8 words) ──
        const BANNED = new Set([
            'showing', 'depicting', 'representing', 'illustrating', 'where', 'which', 'that', 'with', 'using',
            'a', 'an', 'the', 'in', 'on', 'of', 'and', 'for', 'to', 'from', 'at', 'by', 'is', 'are', 'was', 'were',
            'cinematic', 'high-fidelity', '4k', '8k', 'realistic', 'modern', 'advanced', 'professional'
        ]);

        const words = lower
            .replace(/[,./\\?;:!@#$%^&*()_+]/g, ' ')
            .split(/\s+/)
            .filter(w => w.length > 2 && !BANNED.has(w));

        // Combine domain context with top words
        const resultSet = new Set([...domainContext.split(' '), ...words]);
        const finalWords = Array.from(resultSet).filter(w => w !== '').slice(0, 6);

        return finalWords.join(' ') || 'technology innovation';
    }


    private async searchPexelsVideo(query: string, avoidedUrls: string[], page: number = 1): Promise<{url: string, alt: string, source: string} | null> {
        if (!PEXELS_API_KEY) return null;

        try {
            const cleanQuery = this.sanitiseQuery(query);
            const url = `https://api.pexels.com/videos/search?query=${encodeURIComponent(cleanQuery)}&per_page=15&orientation=landscape&size=medium`;
            const res = await fetch(url, { headers: { Authorization: PEXELS_API_KEY } });
            if (!res.ok) return null;
            const data = await res.json();

            if (data.videos && data.videos.length > 0) {
                // Find best matching video not in avoidedUrls
                let bestVideo = null;
                let bestScore = -1;

                for (const video of data.videos) {
                    if (this.sessionUsedIds.has(video.id.toString())) continue;
                    
                    const hdFiles = video.video_files.filter((f: any) => f.quality === 'hd' && f.width >= 1280 && f.width <= 2560);
                    if (hdFiles.length === 0) continue; // Skip if no HD (we don't want 4K lagging or SD looking bad)
                    
                    const file = hdFiles[0]; 
                    if (avoidedUrls.includes(file.link)) continue;

                    // Composite scoring (Duration distance + HD preference)
                    const durationDiff = Math.abs(video.duration - 15); // Ideal duration 15s
                    const score = 100 - durationDiff; // Higher is better

                    if (score > bestScore) {
                        bestScore = score;
                        bestVideo = {
                            url: file.link,
                            alt: query,
                            source: 'pexels',
                            id: video.id.toString()
                        };
                    }
                }

                if (bestVideo) {
                    this.sessionUsedIds.add(bestVideo.id);
                    await logMediaToRegistry(bestVideo.url, query);
                    return { url: bestVideo.url, alt: bestVideo.alt, source: bestVideo.source };
                }
            }
        } catch (e) {
            console.error('[VideoService] Pexels search error:', e);
        }
        return null;
    }

    /**
     * Tier 3: Coverr Search (Stubbed/Mock implementation for spec)
     */
    private async searchCoverrVideo(query: string, avoidedUrls: string[]): Promise<{url: string, alt: string, source: string} | null> {
        // Implementation stub for Coverr API since we deleted the hardcoded ones
        console.log(`[VideoService] Searching Coverr for: ${query}`);
        return null; // Return null to fallback to Tier 4
    }

    /**
     * Tier 4: Domain Ambient Videos Lookup
     */
    private async getDomainAmbientVideo(domain: string): Promise<{url: string, alt: string, source: string} | null> {
        const safeDomainName = domain.toLowerCase().replace(/[^a-z0-9]/g, '-');
        const basePath = path.join(process.cwd(), 'public', 'domain-ambient-videos', safeDomainName);
        
        try {
            if (fs.existsSync(basePath)) {
                const files = fs.readdirSync(basePath).filter(f => f.endsWith('.mp4'));
                if (files.length > 0) {
                    // Pick a random one
                    const randomFile = files[Math.floor(Math.random() * files.length)];
                    return {
                        url: `/domain-ambient-videos/${safeDomainName}/${randomFile}`,
                        alt: `${domain} ambient loop`,
                        source: 'local'
                    };
                }
            }
        } catch (e) {
            console.error('[VideoService] Failed reading domain ambient directory:', e);
        }
        // Even if empty, the scaffold exists. Fall through to Tier 5.
        return null;
    }
}

export const videoService = new VideoService();
