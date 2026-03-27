"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Home, Share2 } from "lucide-react";
import confetti from "canvas-confetti";
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

    useEffect(() => {
        // Trigger celebration on load
        const end = Date.now() + 3 * 1000;
        const colors = ['#FFD700', '#FFA500', '#ffffff'];

        (function frame() {
            confetti({
                particleCount: 3,
                angle: 60,
                spread: 55,
                origin: { x: 0 },
                colors: colors
            });
            confetti({
                particleCount: 3,
                angle: 120,
                spread: 55,
                origin: { x: 1 },
                colors: colors
            });

            if (Date.now() < end) {
                requestAnimationFrame(frame);
            }
        }());
    }, []);

    const handlePrint = () => {
        setIsPrinting(true);
        setTimeout(() => {
            window.print();
            setIsPrinting(false);
        }, 100);
    };

    return (
        <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4 pt-32 print:bg-white print:p-0">
            {/* Action Bar - Hidden on Print */}
            <div className="w-full max-w-4xl flex justify-between items-center mb-8 print:hidden">
                <Link href="/dashboard">
                    <Button variant="ghost" className="text-slate-600 hover:text-slate-900">
                        <Home className="w-4 h-4 mr-2" /> Back to Dashboard
                    </Button>
                </Link>
                <div className="flex gap-4">
                    <Button variant="outline" onClick={handlePrint} className="border-slate-300 hover:bg-slate-50">
                        <Download className="w-4 h-4 mr-2" /> Print / Save as PDF
                    </Button>
                    <Link href={`/courses`}>
                        <Button className="bg-emerald-600 hover:bg-emerald-700">
                            <Share2 className="w-4 h-4 mr-2" /> Browse More Courses
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Certificate Card */}
            <div className="w-full max-w-4xl aspect-[1.414/1] bg-white text-slate-900 shadow-2xl relative overflow-hidden print:shadow-none print:w-full print:h-full print:absolute print:top-0 print:left-0" id="certificate">
                {/* Border Pattern */}
                <div className="absolute inset-4 border-[12px] border-double border-slate-900/10 pointer-events-none" />
                <div className="absolute inset-8 border-2 border-slate-900/50 pointer-events-none flex items-center justify-center">
                    {/* Watermark Logo */}
                    <div className="absolute opacity-[0.03] grayscale">
                        <Image
                            src="/logos/Cyan and black AI logo design.png"
                            alt="Watermark"
                            width={600}
                            height={600}
                        />
                    </div>
                </div>

                {/* Content */}
                <div className="relative h-full flex flex-col items-center py-14 px-12 text-center z-10">

                    {/* Header with Main Logo */}
                    <div className="mt-0 mb-6 flex flex-col items-center justify-center">
                        <div className="relative h-16 w-64 mb-6">
                            <Image
                                src="/logos/ai bytes learning logo new.png"
                                alt="AI Bytes Learning"
                                fill
                                className="object-contain"
                                priority
                            />
                        </div>
                        <h1 className="text-xl uppercase tracking-[0.3em] font-medium text-slate-500">Certificate of Completion</h1>
                        <p className="text-sm text-slate-400 font-serif italic mt-1">This certifies that</p>
                    </div>

                    {/* Name */}
                    <div className="space-y-4 mb-6">
                        <h2 className="text-5xl md:text-7xl font-serif font-bold text-slate-900 tracking-tight italic">
                            {studentName}
                        </h2>
                        <div className="w-64 h-px bg-slate-300 mx-auto" />
                    </div>

                    {/* Description */}
                    <div className="space-y-2 max-w-2xl mx-auto mb-8">
                        <p className="text-lg text-slate-600">
                            Has successfully accomplished the curriculum and requirements for:
                        </p>
                        <h3 className="text-3xl font-bold text-slate-800 py-2 leading-tight">
                            {courseTitle}
                        </h3>
                    </div>

                    {/* Footer / Signatures - Pushed to bottom */}
                    <div className="w-full flex justify-between items-end mt-auto pb-4">
                        <div className="text-center">
                            <div className="text-lg font-serif italic text-slate-800 border-b border-slate-300 pb-1 mb-2 px-8">
                                {completionDate}
                            </div>
                            <p className="text-xs uppercase tracking-widest text-slate-400">Date Issued</p>
                        </div>

                        <div className="flex flex-col items-center">
                            {/* Gold Badge */}
                            <div className="w-28 h-28 mb-1 relative">
                                <div className="absolute inset-0 bg-yellow-400 rounded-full opacity-20 animate-pulse" />
                                <div className="absolute inset-2 border-2 border-yellow-500 rounded-full flex items-center justify-center bg-white/50 backdrop-blur-sm">
                                    <span className="text-[10px] font-bold text-yellow-600 uppercase text-center leading-tight">
                                        Verified<br />Completion
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="text-center">
                            <div className="h-8 mb-2 flex items-end justify-center border-b border-slate-300 px-8 pb-1">
                                <span className="font-bold text-slate-900 text-lg">AI Bytes Learning</span>
                            </div>
                            <p className="text-xs uppercase tracking-widest text-slate-400">Course Director</p>
                        </div>
                    </div>

                    {/* ID */}
                    <div className="absolute bottom-6 right-8 text-[9px] font-mono text-slate-400 uppercase tracking-tighter opacity-50">
                        Verify at: ai-bytes.org/verify • NO: {certificateId}
                    </div>
                </div>
            </div>

            <style jsx global>{`
                @media print {
                    @page {
                        size: landscape;
                        margin: 0;
                    }
                    body {
                        background: white;
                    }
                }
            `}</style>
        </div>
    );
}
