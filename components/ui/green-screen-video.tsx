import React from 'react';

interface GreenScreenVideoProps extends React.VideoHTMLAttributes<HTMLVideoElement> {
    threshold?: number;
    smoothing?: number;
}

export const GreenScreenVideo = ({ className, src, ...props }: GreenScreenVideoProps) => {
    // Placeholder implementation - simple video
    return <video className={className} src={src} muted playsInline {...props} />;
};
