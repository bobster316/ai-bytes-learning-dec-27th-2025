"use client";

import { useEffect, useRef, useState } from "react";

interface BunnyVideoPlayerProps {
  videoId: string; // Bunny Stream video GUID
  libraryId: string; // Bunny Stream library ID
  title?: string;
  autoPlay?: boolean;
  onProgress?: (currentTime: number, duration: number) => void;
  onComplete?: () => void;
  className?: string;
}

export default function BunnyVideoPlayer({
  videoId,
  libraryId,
  title,
  autoPlay = false,
  onProgress,
  onComplete,
  className = "",
}: BunnyVideoPlayerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Construct Bunny Stream embed URL
  const embedUrl = `https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}?autoplay=${autoPlay ? 'true' : 'false'}`;

  useEffect(() => {
    if (!videoId || !libraryId) {
      setError("Missing video ID or library ID");
      setIsLoading(false);
      return;
    }

    // Listen for messages from iframe (if Bunny Stream supports postMessage API)
    const handleMessage = (event: MessageEvent) => {
      // Verify origin
      if (!event.origin.includes('mediadelivery.net')) return;

      const data = event.data;

      // Handle different events from Bunny Stream player
      if (data.event === 'timeupdate' && onProgress) {
        onProgress(data.currentTime || 0, data.duration || 0);
      }

      if (data.event === 'ended' && onComplete) {
        onComplete();
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [videoId, libraryId, onProgress, onComplete]);

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setError("Failed to load video");
    setIsLoading(false);
  };

  if (error) {
    return (
      <div className={`relative w-full aspect-video bg-gray-900 rounded-lg flex items-center justify-center ${className}`}>
        <div className="text-center p-6">
          <svg
            className="w-16 h-16 mx-auto text-red-500 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="text-white text-lg font-medium">Video Error</p>
          <p className="text-gray-400 text-sm mt-2">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative w-full aspect-video bg-gray-900 rounded-lg overflow-hidden ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00BFA5]"></div>
            <p className="text-white mt-4">Loading video...</p>
          </div>
        </div>
      )}

      <iframe
        ref={iframeRef}
        src={embedUrl}
        title={title || "Video player"}
        loading="lazy"
        className="absolute inset-0 w-full h-full border-0"
        allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
        allowFullScreen
        onLoad={handleLoad}
        onError={handleError}
      />
    </div>
  );
}
