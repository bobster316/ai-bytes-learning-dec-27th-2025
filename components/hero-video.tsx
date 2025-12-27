"use client";

import { useState, useRef, useEffect } from "react";
import NextImage from "next/image";
import { useTheme } from "next-themes";
import { Play, Pause } from "lucide-react";

export function HeroVideo() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { theme, resolvedTheme } = useTheme();

  const currentTheme = resolvedTheme || theme;
  const isDark = currentTheme === 'dark';

  const videoSrc = isDark
    ? '/videos/AI Bytes Learning Home Page Darker Background.mp4'
    : '/videos/AI Bytes Learning Home Page White  Background.mp4';

  const fallbackImage = isDark
    ? '/Main Image Dark Mode.png'
    : '/Main Image Light Mode.png';

  useEffect(() => {
    setMounted(true);

    fetch(videoSrc, { method: 'HEAD' })
      .then(response => {
        if (response.ok) {
          setShowVideo(true);
        } else {
          setVideoError(true);
        }
      })
      .catch(() => setVideoError(true));
  }, [videoSrc]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className="relative group">
      <div className="aspect-video overflow-hidden relative bg-white dark:bg-gray-900">
        {!mounted ? (
          <div className="w-full h-full bg-gray-200 dark:bg-gray-800 animate-pulse" />
        ) : showVideo ? (
          <>
            <video
              ref={videoRef}
              loop
              playsInline
              className="w-full h-full object-contain"
              onError={() => setVideoError(true)}
              key={videoSrc}
            >
              <source src={videoSrc} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
            <button
              onClick={togglePlay}
              className="absolute bottom-4 left-4 bg-[#00BFA5] hover:bg-[#00A896] text-white p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-110 z-10"
              aria-label={isPlaying ? "Pause video" : "Play video"}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5 ml-0.5" />
              )}
            </button>
          </>
        ) : (
          <NextImage
            src={fallbackImage}
            alt="AI Tutor - Learn AI in 60 Minutes"
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 600px"
            className="object-contain"
            priority
          />
        )}
      </div>
    </div>
  );
}
