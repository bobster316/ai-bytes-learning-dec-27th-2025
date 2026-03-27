'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Download, Sparkles, RefreshCw, Palette } from 'lucide-react';
import { Header } from '@/components/header';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Enhanced Style Definitions
const TEXT_STYLES = [
    {
        id: 'mrbeast-viral',
        name: 'viral / yellow',
        category: 'High Impact',
        font: '900 150px "Inter", sans-serif',
        align: 'center',
        vAlign: 'center',
        color: '#FFFF00', // Bright Yellow
        strokeColor: '#000000',
        strokeWidth: 25,
        shadow: true,
        shadowColor: 'black',
        shadowBlur: 0,
        shadowOffset: 15,
        rotation: -5,
        uppercase: true,
        bgDim: 0.3
    },
    {
        id: 'viral-red',
        name: 'viral / red',
        category: 'High Impact',
        font: '900 160px "Impact", sans-serif', // Impact font for classic meme/viral look
        align: 'center',
        vAlign: 'center',
        color: '#FFFFFF',
        strokeColor: '#FF0000', // Red Stroke
        strokeWidth: 20,
        shadow: true,
        shadowColor: 'black',
        shadowBlur: 5,
        shadowOffset: 20,
        rotation: 3, // Tilt opposite way
        uppercase: true,
        bgDim: 0.4
    },
    {
        id: 'viral-blue',
        name: 'viral / tech blue',
        category: 'High Impact',
        font: '900 140px "Roboto", sans-serif',
        align: 'center',
        vAlign: 'bottom', // Bottom heavy
        yPadding: 100,
        color: '#00FFFF', // Cyan
        strokeColor: '#0000AA', // Dark Blue
        strokeWidth: 15,
        shadow: true,
        shadowColor: 'rgba(0,0,255,0.5)',
        shadowBlur: 50, // Glowing
        shadowOffset: 0,
        rotation: 0, // Straight
        uppercase: true,
        bgDim: 0.6
    },
    {
        id: 'tech-minimalist',
        name: 'tech / mkbhd',
        category: 'Clean',
        font: '800 110px "Inter", sans-serif', // Cleaner bold
        align: 'left',
        vAlign: 'bottom',
        xPadding: 80,
        yPadding: 80,
        color: '#FFFFFF',
        strokeColor: 'rgba(0,0,0,0.5)',
        strokeWidth: 4,
        shadow: true,
        shadowColor: 'rgba(0,0,0,0.8)',
        shadowBlur: 40, // Soft sleek shadow
        uppercase: false, // Normal casing looks more premium/tech
        bgDim: 0.5,
        cornerAccent: true // Add a little color bar?
    },
    {
        id: 'documentary-cinema',
        name: 'cinema / vox',
        category: 'Elegant',
        font: '700 100px "Playfair Display", serif', // Serif for elegance
        align: 'center',
        vAlign: 'center',
        color: '#FFFFFF',
        stroke: false,
        shadow: true,
        shadowColor: 'rgba(0,0,0,0.9)',
        shadowBlur: 20,
        letterSpacing: '5px',
        uppercase: true,
        bgDim: 0.6, // Darker background for cinema feel
        letterbox: true // Cinematic bars
    },
    {
        id: 'dev-terminal',
        name: 'code / terminal',
        category: 'Niche',
        font: 'bold 90px "Courier New", monospace',
        align: 'left',
        vAlign: 'top',
        xPadding: 100,
        yPadding: 120,
        color: '#00FF41', // Matrix Green
        strokeColor: '#003B00',
        strokeWidth: 4,
        shadow: true,
        shadowColor: '#00FF41',
        shadowBlur: 15, // Glowing effect
        uppercase: false,
        prefix: '> ', // Terminal prompt
        bgDim: 0.8 // very dark
    },
    {
        id: 'business-insider',
        name: 'news / bold',
        category: 'Business',
        font: '900 110px "Arial", sans-serif',
        align: 'left',
        vAlign: 'center', // Left-aligned but vertically centered
        xPadding: 100,
        color: '#FFFFFF',
        highlight: true, // Text background highlight
        highlightColor: '#E11D48', // Red background
    }
];

const BACKGROUND_STYLES = [
    { id: 'antigravity-3d', name: 'Antigravity Floating 3D', description: 'Surreal, high-end 3D objects weightless in space.' },
    { id: 'frosted-glass', name: 'Frosted Glassmorphism', description: 'Premium tech feel with blurred glass and soft glows.' },
    { id: 'cinematic-studio', name: 'Cinematic Studio', description: 'Photorealistic, documentary-style expert lighting.' },
    { id: 'neural-flow', name: 'Abstract Neural Flow', description: 'Dynamic liquid lines and glowing nodes.' },
];

export default function ThumbnailGeneratorPage() {
    const [title, setTitle] = useState('AI Revolution');
    const [styleId, setStyleId] = useState('mrbeast-viral');
    const [bgStyleId, setBgStyleId] = useState('antigravity-3d');
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [generating, setGenerating] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Initial Load
    useEffect(() => {
        // Preload fonts or init if needed
    }, []);

    const generateThumbnail = async () => {
        setGenerating(true);
        try {
            // 1. Get Background
            const response = await fetch('/api/generate-thumbnail', {
                method: 'POST',
                body: JSON.stringify({ title, bgStyle: bgStyleId })
            });
            const data = await response.json();

            // 2. Draw
            const style = TEXT_STYLES.find(s => s.id === styleId) || TEXT_STYLES[0];
            await drawThumbnail(data.imageUrl, title, style);

        } catch (e) {
            console.error(e);
        } finally {
            setGenerating(false);
        }
    };

    const drawThumbnail = (bgUrl: string, text: string, style: any) => {
        return new Promise<void>((resolve) => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            const img = new Image();
            img.crossOrigin = "anonymous";
            img.src = bgUrl;
            img.onload = () => {
                canvas.width = 1920;
                canvas.height = 1080;

                // 1. Draw Background (Cover)
                // 1. Draw Background (Cover) with Filters
                ctx.save();

                // Style-Specific Filters
                if (style.id === 'mrbeast-viral') {
                    ctx.filter = 'saturate(1.5) contrast(1.2) brightness(1.1)'; // POP effect
                } else if (style.id === 'tech-minimalist') {
                    ctx.filter = 'grayscale(20%) contrast(1.1) brightness(0.9)'; // Sleek tech
                } else if (style.id === 'dev-terminal') {
                    ctx.filter = 'hue-rotate(90deg) contrast(1.4) brightness(0.7)'; // Green tint base
                } else if (style.id === 'documentary-cinema') {
                    ctx.filter = 'sepia(30%) contrast(1.1) brightness(0.8)'; // Cinematic mode
                }

                const scale = Math.max(canvas.width / img.width, canvas.height / img.height);
                const x = (canvas.width / 2) - (img.width / 2) * scale;
                const y = (canvas.height / 2) - (img.height / 2) * scale;
                ctx.drawImage(img, x, y, img.width * scale, img.height * scale);

                ctx.restore(); // Clear filters for next operations (text shouldn't be filtered)

                // 1.5 Color Tint Overlay (Composite)
                if (style.id === 'dev-terminal') {
                    ctx.fillStyle = 'rgba(0, 50, 0, 0.5)'; // Matrix Green Tint
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                } else if (style.id === 'mrbeast-viral') {
                    // Vignette
                    const grad = ctx.createRadialGradient(canvas.width / 2, canvas.height / 2, 100, canvas.width / 2, canvas.height / 2, 1200);
                    grad.addColorStop(0, 'rgba(0,0,0,0)');
                    grad.addColorStop(1, 'rgba(0,0,0,0.6)');
                    ctx.fillStyle = grad;
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                }

                // 2. Dimming Overlay
                ctx.fillStyle = `rgba(0,0,0,${style.bgDim || 0.4})`;
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                // 3. Cinematic Bars (Documentary Style)
                if (style.letterbox) {
                    ctx.fillStyle = 'black';
                    const barHeight = 140; // Approx 2.35:1 aspect ratio feel
                    ctx.fillRect(0, 0, canvas.width, barHeight);
                    ctx.fillRect(0, canvas.height - barHeight, canvas.width, barHeight);
                }

                // 4. Text Configuration
                ctx.save(); // Save state before rotation/translation

                // Font Setup
                ctx.font = style.font;
                ctx.textAlign = style.highlight ? 'left' : (style.align as CanvasTextAlign); // Highlight needs explicit manual calculation usually
                ctx.textBaseline = 'middle';
                const finalColor = style.color;

                // ROTATION Logic (Pivot around center generally looks best for "Viral" style)
                if (style.rotation) {
                    ctx.translate(canvas.width / 2, canvas.height / 2);
                    ctx.rotate((style.rotation * Math.PI) / 180);
                    ctx.translate(-canvas.width / 2, -canvas.height / 2);
                }

                // Word Wrapping
                const processedText = style.uppercase ? text.toUpperCase() : text;
                const finalLinePrefix = style.prefix || '';
                const words = processedText.split(' ');
                let lines = [];
                let currentLine = words[0];
                const maxWidth = canvas.width - (style.xPadding ? style.xPadding * 2 : 200);

                for (let i = 1; i < words.length; i++) {
                    const testLine = currentLine + " " + words[i];
                    if (ctx.measureText(testLine).width > maxWidth) {
                        lines.push(finalLinePrefix + currentLine);
                        currentLine = words[i];
                    } else {
                        currentLine = testLine;
                    }
                }
                lines.push(finalLinePrefix + currentLine);

                // Calculate Block Positioning
                const lineHeight = 160; // Approximate based on huge fonts
                const totalTextHeight = lines.length * lineHeight;

                let startX = canvas.width / 2;
                if (style.align === 'left') startX = style.xPadding || 100;
                if (style.align === 'right') startX = canvas.width - (style.xPadding || 100);

                let startY = (canvas.height / 2) - (totalTextHeight / 2) + (lineHeight / 2);
                if (style.vAlign === 'top') startY = (style.yPadding || 120) + (lineHeight / 2);
                if (style.vAlign === 'bottom') startY = canvas.height - (style.yPadding || 150) - totalTextHeight + lineHeight;

                // DRAW LOOP
                lines.forEach((line, i) => {
                    const lineY = startY + (i * lineHeight);

                    // A. Highlight Box (Business Style)
                    if (style.highlight) {
                        const metrics = ctx.measureText(line);
                        const boxPadding = 20;
                        ctx.fillStyle = style.highlightColor;
                        // Draw box slightly offset
                        ctx.fillRect(startX - boxPadding, lineY - lineHeight / 2, metrics.width + (boxPadding * 2), lineHeight);
                    }

                    // B. Hard Shadow (MrBeast Style)
                    if (style.shadow && style.shadowOffset) {
                        ctx.fillStyle = 'black';
                        ctx.fillText(line, startX + style.shadowOffset, lineY + style.shadowOffset);
                    }

                    // C. Heavy Stroke
                    if (style.strokeWidth) {
                        ctx.strokeStyle = style.strokeColor;
                        ctx.lineWidth = style.strokeWidth;
                        ctx.lineJoin = 'round';
                        ctx.strokeText(line, startX, lineY);
                    }

                    // D. Soft Glow/Shadow
                    if (style.shadowBlur > 0) {
                        ctx.shadowColor = style.shadowColor;
                        ctx.shadowBlur = style.shadowBlur;
                        ctx.shadowOffsetX = 0;
                        ctx.shadowOffsetY = 0;
                    } else {
                        ctx.shadowColor = 'transparent';
                    }

                    // E. Main Text
                    ctx.fillStyle = finalColor;
                    ctx.fillText(line, startX, lineY);

                    // Reset Shadow for next pass
                    ctx.shadowBlur = 0;
                });

                ctx.restore(); // Undo rotation

                // Watermark / Sub-labels (Subtle)
                if (!style.letterbox) {
                    ctx.font = 'bold 24px "Inter", sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillStyle = 'rgba(255,255,255,0.6)';
                    ctx.fillText("AI BYTES LEARNING", canvas.width / 2, canvas.height - 40);
                }

                setPreviewUrl(canvas.toDataURL('image/png'));
                resolve();
            };
        });
    };

    const downloadImage = async () => {
        if (!previewUrl) return;

        try {
            // Strict sanitization for Windows filenames
            const cleanTitle = title
                .replace(/[^a-z0-9]/gi, '_')
                .replace(/_+/g, '_')
                .replace(/^_+|_+$/g, '')
                .substring(0, 60);

            const filename = `AI_BYTES_THUMBNAIL_${cleanTitle || 'thumbnail'}_HD.png`;

            // New: Save Directly to User's Disk (Server-Side)
            const response = await fetch('/api/save-to-disk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    filename: filename,
                    imageData: previewUrl
                })
            });

            const data = await response.json();

            if (data.success) {
                alert(`✅ FILE SAVED SUCCESSFULLY!\n\nLocation: ${data.path}\n\n(Saved directly to your Downloads folder via Server)`);
            } else {
                throw new Error("Server failed to save file: " + (data.error || "Unknown Error"));
            }

        } catch (err: any) {
            console.error("Save failed", err);
            alert(`⚠️ Initial save failed ("${err.message}").\nAttempting browser fallback...`);

            // FALLBACK TO BROWSER DOWNLOAD IF SERVER FAILS
            const a = document.createElement('a');
            a.href = previewUrl;
            a.download = `FALLBACK_${title.replace(/[^a-z0-9]/gi, '_')}_HD.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        }
    };

    return (
        <div className="min-h-screen bg-[#0A0A0B] text-white font-sans selection:bg-indigo-500/30">
            <Header />

            <div className="max-w-7xl mx-auto px-6 py-12">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                    <div>
                        <h1 className="text-5xl font-extrabold tracking-tight mb-3 bg-gradient-to-r from-white via-white to-white/50 bg-clip-text text-transparent">
                            Thumbnail <span className="text-indigo-500">Forge</span>
                        </h1>
                        <p className="text-lg text-white/40 max-w-2xl">
                            Generate viral, click-optimized course thumbnails in distinct YouTuber styles.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

                    {/* LEFT PANEL: CONTROLS (4 Cols) */}
                    <div className="lg:col-span-4 space-y-8">

                        {/* Title Input */}
                        <div className="bg-white/5 p-6 rounded-2xl border border-white/10 shadow-xl backdrop-blur-sm">
                            <label className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-4 block">
                                1. Course Headline
                            </label>
                            <Textarea
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="bg-black/40 border-white/10 text-2xl font-bold text-white min-h-[120px] resize-none focus:ring-indigo-500/50"
                                placeholder="E.g. I Trained an AI in 5 Minutes..."
                            />
                            <p className="text-xs text-white/30 mt-3 text-right">
                                Tip: Keep it under 6 words for max impact.
                            </p>
                        </div>

                        {/* Style Selector */}
                        <div className="bg-white/5 p-6 rounded-2xl border border-white/10 shadow-xl backdrop-blur-sm">
                            <label className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-4 block">
                                2. Visual Archetype
                            </label>
                            <div className="space-y-3">
                                {TEXT_STYLES.map((style) => (
                                    <div
                                        key={style.id}
                                        onClick={() => setStyleId(style.id)}
                                        className={`
                                            cursor-pointer p-4 rounded-xl border transition-all duration-200 flex items-center justify-between
                                            ${styleId === style.id
                                                ? 'bg-indigo-600 border-indigo-500 shadow-lg shadow-indigo-900/50 scale-[1.02]'
                                                : 'bg-black/20 border-white/5 hover:bg-white/10 hover:border-white/20'
                                            }
                                        `}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${styleId === style.id ? 'bg-white text-indigo-600' : 'bg-white/10 text-white/50'}`}>
                                                {style.name[0].toUpperCase()}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-sm capitalize">{style.name}</h3>
                                                <p className="text-xs text-white/40">{style.category}</p>
                                            </div>
                                        </div>
                                        {styleId === style.id && <Sparkles className="w-4 h-4 text-white" />}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Background Style Selector */}
                        <div className="bg-white/5 p-6 rounded-2xl border border-white/10 shadow-xl backdrop-blur-sm">
                            <label className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-4 block">
                                3. Background Art Style
                            </label>
                            <div className="space-y-3">
                                {BACKGROUND_STYLES.map((style) => (
                                    <div
                                        key={style.id}
                                        onClick={() => setBgStyleId(style.id)}
                                        className={`
                                            cursor-pointer p-4 rounded-xl border transition-all duration-200
                                            ${bgStyleId === style.id
                                                ? 'bg-indigo-600/40 border-indigo-500 shadow-lg shadow-indigo-900/20 scale-[1.01]'
                                                : 'bg-black/20 border-white/5 hover:bg-white/10 hover:border-white/20'
                                            }
                                        `}
                                    >
                                        <div className="flex flex-col">
                                            <h3 className="font-bold text-sm">{style.name}</h3>
                                            <p className="text-[10px] text-white/40">{style.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <Button
                            onClick={generateThumbnail}
                            disabled={generating}
                            className="w-full h-16 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-xl font-bold rounded-2xl shadow-xl shadow-indigo-900/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                        >
                            {generating ? (
                                <Loader2 className="w-6 h-6 animate-spin" />
                            ) : (
                                "GENERATE THUMBNAIL"
                            )}
                        </Button>
                    </div>

                    {/* RIGHT PANEL: PREVIEW (8 Cols) */}
                    <div className="lg:col-span-8 space-y-6">
                        <div className="relative aspect-video rounded-3xl overflow-hidden bg-[#151515] border border-white/10 shadow-2xl group">
                            {previewUrl ? (
                                <img src={previewUrl} className="w-full h-full object-cover" alt="Generated Thumbnail" />
                            ) : (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-white/20">
                                    <Palette className="w-20 h-20 mb-6 opacity-20" />
                                    <p className="text-xl font-medium tracking-wide">DESIGN CANVAS READY</p>
                                </div>
                            )}

                            {previewUrl && (
                                <div className="absolute bottom-6 right-6 flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-2 group-hover:translate-y-0">
                                    <Button
                                        onClick={generateThumbnail}
                                        className="bg-black/80 hover:bg-black text-white border border-white/20 backdrop-blur-md"
                                    >
                                        <RefreshCw className="w-4 h-4 mr-2" />
                                        Regenerate
                                    </Button>
                                    <Button
                                        onClick={downloadImage}
                                        className="bg-white text-black hover:bg-gray-200 font-bold shadow-lg"
                                    >
                                        <Download className="w-4 h-4 mr-2" />
                                        Download HD PNG
                                    </Button>
                                </div>
                            )}
                        </div>

                        {/* Quick Tips / Footer */}
                        <div className="grid grid-cols-3 gap-6 text-center text-white/30 text-xs font-medium uppercase tracking-widest">
                            <div className="bg-white/5 py-4 rounded-xl border border-white/5">
                                1920 x 1080 HD
                            </div>
                            <div className="bg-white/5 py-4 rounded-xl border border-white/5">
                                Optimized for CTR
                            </div>
                            <div className="bg-white/5 py-4 rounded-xl border border-white/5">
                                AI Generated Art
                            </div>
                        </div>
                    </div>

                </div>

                <canvas ref={canvasRef} className="hidden" />
            </div>
        </div>
    );
}
