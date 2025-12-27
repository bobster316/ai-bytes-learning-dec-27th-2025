import React from 'react';
import Image from 'next/image';

export const MathBackground = () => {
    return (
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none bg-black">
            {/* Main Background Image - The specific chalkboard math diagrams */}
            <div className="absolute inset-0 opacity-100">
                <Image
                    src="/home page background/blackboard_background.jpg"
                    alt="Math Background"
                    fill
                    priority
                    className="object-cover object-center opacity-50"
                />
            </div>
            {/* Vignette/Shading Gradients - Restored to match original design depth */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-black/80 z-10" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/50 z-10" />
        </div>
    );
};
