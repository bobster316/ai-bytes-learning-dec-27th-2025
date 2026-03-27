"use client";

import React, { useState } from 'react';

interface AvatarImageProps {
    src: string;
    alt: string;
    className?: string;
    isGenerating?: boolean | string | null;
}

export function AvatarImage({ src, alt, className, isGenerating }: AvatarImageProps) {
    const [hasError, setHasError] = useState(false);

    if (hasError) {
        return (
            <div className="w-full h-full bg-violet-600/20 rounded-full flex items-center justify-center">
                <svg className="w-16 h-16 text-violet-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" />
                    <polygon points="10 8 16 12 10 16 10 8" />
                </svg>
            </div>
        );
    }

    return (
        <div className="relative w-full h-full">
            <img
                src={src}
                alt={alt}
                className={className}
                onError={() => setHasError(true)}
            />
            {/* Pulse overlay if generating */}
            {isGenerating && (
                <div className="absolute inset-0 bg-violet-500/20 animate-pulse rounded-full" />
            )}
        </div>
    );
}
