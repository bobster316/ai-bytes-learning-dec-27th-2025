'use client';

import { useEffect } from 'react';

/**
 * AutoVideoSync Component
 * Automatically checks for completed videos every 1 minute
 * and refreshes the page when new videos are available
 */
export function AutoVideoSync({ courseId }: { courseId: string }) {
    useEffect(() => {
        let intervalId: NodeJS.Timeout;

        const syncVideos = async () => {
            try {
                // Silenced per Feb 20th handover - redundant logging
                // console.log('🔄 Checking for completed videos...');
                const response = await fetch('/api/sync-videos');
                const data = await response.json();

                if (data.success && data.updatedCount > 0) {
                    console.log(`✅ ${data.updatedCount} new videos available! Refreshing page...`);
                    // Refresh the page to show new videos
                    window.location.reload();
                }
            } catch (error) {
                console.error('Auto-sync error:', error);
            }
        };

        // Run immediately on mount
        syncVideos();

        // Then run every 1 minute (60000ms)
        intervalId = setInterval(syncVideos, 60000);

        return () => {
            if (intervalId) {
                clearInterval(intervalId);
            }
        };
    }, [courseId]);

    return null; // This component doesn't render anything
}
