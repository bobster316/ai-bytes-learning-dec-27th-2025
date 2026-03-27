"use client";

export function Logo({ className = "" }: { className?: string }) {
    return (
        <div
            className={`relative ${className}`}
            role="img"
            aria-label="AI Bytes Learning"
            style={{
                backgroundImage: "url('/logos/ai-bytes-logo-dark.png')",
                backgroundSize: "128%",
                backgroundPosition: "center 50%",
                backgroundRepeat: "no-repeat",
                /* Inset shadow masks any white PNG edge in the header colour */
                boxShadow: "inset 0 0 0 6px #080810",
            }}
        />
    );
}
