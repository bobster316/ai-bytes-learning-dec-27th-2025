"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Home, Share2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface CertificateRendererProps {
    studentName: string;
    courseTitle: string;
    completionDate: string;
    certificateId: string;
}

export function CertificateRenderer({
    studentName,
    courseTitle,
    completionDate,
    certificateId
}: CertificateRendererProps) {
    const [isPrinting, setIsPrinting] = useState(false);

    const handlePrint = () => {
        setIsPrinting(true);
        setTimeout(() => {
            window.print();
            setIsPrinting(false);
        }, 100);
    };

    return (
        <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center p-4 pt-32 print:p-0 print:bg-[#0a0a0f]">

            {/* Action Bar - Hidden on Print */}
            <div className="w-full max-w-4xl flex justify-between items-center mb-8 print:hidden">
                <Link href="/dashboard">
                    <Button variant="ghost" className="text-white/60 hover:text-white hover:bg-white/5">
                        <Home className="w-4 h-4 mr-2" /> Back to Dashboard
                    </Button>
                </Link>
                <div className="flex gap-4">
                    <Button variant="outline" onClick={handlePrint} className="border-white/15 bg-transparent text-white/70 hover:bg-white/5 hover:text-white">
                        <Download className="w-4 h-4 mr-2" /> Print / Save as PDF
                    </Button>
                    <Link href="/courses">
                        <Button className="bg-[#00FFB3] text-black font-bold hover:bg-[#00e6a0]">
                            <Share2 className="w-4 h-4 mr-2" /> Browse More Courses
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Certificate Card */}
            <div
                id="certificate"
                className="w-full max-w-4xl aspect-[1.414/1] relative overflow-hidden shadow-[0_0_80px_rgba(0,255,179,0.08)] print:shadow-none print:w-full print:h-full print:absolute print:top-0 print:left-0"
                style={{ background: "#16162a" }}
            >
                {/* Outer teal border */}
                <div className="absolute inset-0 border border-[#00FFB3]/20 pointer-events-none" style={{ borderRadius: 2 }} />
                {/* Inner accent border */}
                <div className="absolute inset-3 border border-[#00FFB3]/10 pointer-events-none" style={{ borderRadius: 2 }} />

                {/* Corner accents */}
                {[
                    "top-0 left-0",
                    "top-0 right-0 rotate-90",
                    "bottom-0 right-0 rotate-180",
                    "bottom-0 left-0 -rotate-90",
                ].map((pos, i) => (
                    <div key={i} className={`absolute ${pos} w-10 h-10 pointer-events-none`}>
                        <div className="absolute top-2 left-2 w-6 h-[1.5px]" style={{ background: "#00FFB3", opacity: 0.6 }} />
                        <div className="absolute top-2 left-2 w-[1.5px] h-6" style={{ background: "#00FFB3", opacity: 0.6 }} />
                    </div>
                ))}

                {/* Ambient glow blobs */}
                <div className="absolute top-[-20%] left-[-10%] w-[400px] h-[400px] rounded-full pointer-events-none" style={{ background: "#00FFB3", filter: "blur(120px)", opacity: 0.04 }} />
                <div className="absolute bottom-[-20%] right-[-10%] w-[300px] h-[300px] rounded-full pointer-events-none" style={{ background: "#9B8FFF", filter: "blur(100px)", opacity: 0.05 }} />

                {/* Watermark */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ opacity: 0.04 }}>
                    <Image src="/logos/ai-bytes-logo-transparency-1.png" alt="" width={500} height={500} className="object-contain" />
                </div>

                {/* Content */}
                <div className="relative h-full flex flex-col items-center py-10 px-12 text-center z-10">

                    {/* Logo + Title */}
                    <div className="flex flex-col items-center mb-5">
                        <div className="relative h-12 w-48 mb-4">
                            <Image
                                src="/logos/ai-bytes-logo-transparency-1.png"
                                alt="AI Bytes Learning"
                                fill
                                className="object-contain"
                                priority
                            />
                        </div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="h-px w-16" style={{ background: "linear-gradient(90deg, transparent, #00FFB3)" }} />
                            <p className="font-mono text-[0.6rem] uppercase tracking-[0.3em] text-[#00FFB3]/70">Certificate of Completion</p>
                            <div className="h-px w-16" style={{ background: "linear-gradient(90deg, #00FFB3, transparent)" }} />
                        </div>
                        <p className="font-body text-white/30 text-xs italic">This certifies that</p>
                    </div>

                    {/* Student Name */}
                    <div className="mb-5">
                        <h2 className="font-display font-black text-white tracking-tight italic"
                            style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", letterSpacing: "-0.02em", textShadow: "0 0 40px rgba(0,255,179,0.15)" }}>
                            {studentName}
                        </h2>
                        <div className="h-px w-56 mx-auto mt-3" style={{ background: "linear-gradient(90deg, transparent, #00FFB3, transparent)" }} />
                    </div>

                    {/* Course */}
                    <div className="mb-6 max-w-xl mx-auto">
                        <p className="font-body text-white/40 text-sm mb-2">
                            Has successfully completed the curriculum and requirements for:
                        </p>
                        <h3 className="font-display font-black text-white leading-tight"
                            style={{ fontSize: "clamp(1.1rem, 2.2vw, 1.6rem)", letterSpacing: "-0.02em" }}>
                            {courseTitle}
                        </h3>
                    </div>

                    {/* Footer row */}
                    <div className="w-full flex justify-between items-end mt-auto">

                        {/* Date */}
                        <div className="text-center">
                            <p className="font-mono text-white/80 text-sm mb-1">{completionDate}</p>
                            <div className="h-px w-28 mx-auto mb-1.5" style={{ background: "#00FFB3", opacity: 0.3 }} />
                            <p className="font-mono text-[0.55rem] uppercase tracking-[0.2em] text-white/30">Date Issued</p>
                        </div>

                        {/* Centre badge */}
                        <div className="flex flex-col items-center">
                            <div className="w-20 h-20 relative">
                                <div className="absolute inset-0 rounded-full animate-pulse" style={{ background: "#00FFB3", opacity: 0.08 }} />
                                <div className="absolute inset-[3px] rounded-full flex items-center justify-center" style={{ border: "1px solid rgba(0,255,179,0.35)" }}>
                                    <div className="absolute inset-[4px] rounded-full" style={{ border: "1px solid rgba(0,255,179,0.15)" }} />
                                    <span className="font-mono text-[8px] font-bold uppercase text-center leading-tight z-10" style={{ color: "#00FFB3" }}>
                                        Verified<br />Complete
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Issuer */}
                        <div className="text-center">
                            <p className="font-display font-black text-white/80 text-sm mb-1">AI Bytes Learning</p>
                            <div className="h-px w-28 mx-auto mb-1.5" style={{ background: "#00FFB3", opacity: 0.3 }} />
                            <p className="font-mono text-[0.55rem] uppercase tracking-[0.2em] text-white/30">Course Director</p>
                        </div>
                    </div>

                    {/* Certificate ID */}
                    <div className="absolute bottom-4 right-6 font-mono text-[8px] uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.18)" }}>
                        Verify: ai-bytes.org/verify &nbsp;•&nbsp; {certificateId}
                    </div>
                </div>
            </div>

            <style jsx global>{`
                @media print {
                    @page { size: landscape; margin: 0; }
                    body { background: #16162a !important; }
                }
            `}</style>
        </div>
    );
}
