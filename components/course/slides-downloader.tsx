'use client';

import { useState } from 'react';
import { Loader2, Download, FileText, FileImage, Presentation } from 'lucide-react';

interface Props {
    courseId: string;
    /** Student's current slide status fetched server-side. */
    initialStatus: 'none' | 'ready' | 'failed';
    initialSlidesUrl?: string | null;
    initialPdfUrl?: string | null;
    initialPptxUrl?: string | null;
}

function DownloadButton({ href, label, icon }: { href: string; label: string; icon: React.ReactNode }) {
    return (
        <a
            href={href}
            download
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-[#00C896] text-[#00C896] hover:bg-[#00C896] hover:text-[#0A1628] transition-colors font-semibold text-sm"
        >
            {icon}
            {label}
        </a>
    );
}

export function SlidesDownloader({
    courseId,
    initialStatus,
    initialSlidesUrl,
    initialPdfUrl,
    initialPptxUrl,
}: Props) {
    const [status, setStatus] = useState(initialStatus);
    const [slidesUrl, setSlidesUrl] = useState(initialSlidesUrl ?? null);
    const [pdfUrl, setPdfUrl] = useState(initialPdfUrl ?? null);
    const [pptxUrl, setPptxUrl] = useState(initialPptxUrl ?? null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleRequest = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/student/slides/request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ courseId }),
            });
            const data = await res.json();
            if (!res.ok || !data.success) throw new Error(data.error || 'Failed to generate slides');

            setStatus('ready');
            setSlidesUrl(data.slidesUrl ?? null);
            setPdfUrl(data.slidesPdfUrl ?? null);
            setPptxUrl(data.slidesPptxUrl ?? null);
        } catch (e: any) {
            setError(e.message);
            setStatus('failed');
        } finally {
            setLoading(false);
        }
    };

    // ── Ready state ───────────────────────────────────────────────────────────
    if (status === 'ready' && (slidesUrl || pdfUrl || pptxUrl)) {
        return (
            <div className="flex flex-col items-center gap-4 pb-14 -mt-4">
                <div className="text-center">
                    <p className="text-sm font-semibold text-white/60 uppercase tracking-widest mb-1">Your Course Slides</p>
                    <p className="text-xs text-white/35">Yours to keep — view, present, or share any time.</p>
                </div>
                <div className="flex flex-wrap justify-center gap-3">
                    {slidesUrl && (
                        <DownloadButton href={slidesUrl} label="Markdown (.md)" icon={<FileText className="h-4 w-4" />} />
                    )}
                    {pdfUrl && (
                        <DownloadButton href={pdfUrl} label="PDF" icon={<FileImage className="h-4 w-4" />} />
                    )}
                    {pptxUrl && (
                        <DownloadButton href={pptxUrl} label="PowerPoint (.pptx)" icon={<Presentation className="h-4 w-4" />} />
                    )}
                </div>
            </div>
        );
    }

    // ── Request state ─────────────────────────────────────────────────────────
    return (
        <div className="flex flex-col items-center gap-5 pb-14 -mt-4">
            {/* Feature callout */}
            <div className="max-w-md text-center border border-[#00C896]/20 bg-[#00C896]/5 rounded-2xl px-6 py-5">
                <p className="text-[#00C896] font-bold text-sm uppercase tracking-wider mb-2">Bonus: Course Slide Deck</p>
                <p className="text-white/60 text-sm leading-relaxed">
                    Get a beautifully structured slide deck covering everything you&apos;ve learned —
                    perfect for revision, presentations, or sharing with your team.
                    Available in Markdown, PDF, and PowerPoint.
                </p>
            </div>

            {error && (
                <p className="text-[#FF6B6B] text-sm">{error}</p>
            )}

            <button
                onClick={handleRequest}
                disabled={loading}
                className="inline-flex items-center gap-2.5 px-7 py-3 rounded-xl bg-[#00C896] text-[#0A1628] hover:bg-[#00C896]/90 active:scale-95 transition-all font-black text-sm shadow-lg shadow-[#00C896]/20 disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100"
            >
                {loading ? (
                    <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Generating your slides&hellip; this may take a minute
                    </>
                ) : (
                    <>
                        <Download className="h-4 w-4" />
                        Generate My Slides
                    </>
                )}
            </button>

            {!loading && (
                <p className="text-white/25 text-xs">
                    {status === 'failed' ? 'Generation failed — tap above to retry.' : 'Free for all students who complete this course.'}
                </p>
            )}
        </div>
    );
}
