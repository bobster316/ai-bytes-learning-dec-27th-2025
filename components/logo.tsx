"use client";

import Image from "next/image";

export function Logo({ className = "" }: { className?: string }) {
    return (
        <div className={`relative flex items-center overflow-hidden ${className}`}>
            <Image
                src="/logos/Cyan and black AI logo design.png"
                alt="AI Bytes Learning"
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-contain object-left"
                priority
            />
        </div>
    );
}
