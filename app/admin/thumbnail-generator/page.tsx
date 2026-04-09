'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Download, Sparkles, RefreshCw, Zap } from 'lucide-react';
import { Header } from '@/components/header';

// Category definitions matching the brief
const CATEGORIES = [
    { slug: 'ai-foundations', label: 'AI Foundations', dark: '#3C3489', vivid: '#7F77DD', accent: '#9B8FFF', description: 'How AI works, model internals, mathematics of AI' },
    { slug: 'prompting',      label: 'Prompting',      dark: '#085041', vivid: '#1D9E75', accent: '#1D9E75', description: 'Prompt engineering, few-shot, chain-of-thought' },
    { slug: 'agents',         label: 'Agents & Tools', dark: '#042C53', vivid: '#378ADD', accent: '#378ADD', description: 'Agentic AI, tool use, MCP, automation workflows' },
    { slug: 'safety',         label: 'Safety & Ethics', dark: '#4A1B0C', vivid: '#D85A30', accent: '#D85A30', description: 'AI safety, hallucinations, bias, governance' },
    { slug: 'business',       label: 'Business AI',    dark: '#412402', vivid: '#EF9F27', accent: '#EF9F27', description: 'ROI, enterprise adoption, AI strategy' },
    { slug: 'research',       label: 'Research',       dark: '#26215C', vivid: '#AFA9EC', accent: '#AFA9EC', description: 'Papers, cutting-edge models, academic AI' },
] as const;

type CategorySlug = typeof CATEGORIES[number]['slug'];

export default function ThumbnailGeneratorPage() {
    const [title, setTitle] = useState('How LLMs actually think');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState<CategorySlug>('ai-foundations');
    const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [generating, setGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [bulkRunning, setBulkRunning] = useState(false);
    const [bulkResult, setBulkResult] = useState<{ total: number; ok: number; failed: number } | null>(null);

    const selectedCat = CATEGORIES.find(c => c.slug === category)!;

    const generateThumbnail = async () => {
        setGenerating(true);
        setError(null);
        try {
            const res = await fetch('/api/generate-thumbnail', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, description, category, difficulty }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Generation failed');
            setPreviewUrl(data.imageUrl || data.thumbnail_url);
        } catch (e: any) {
            setError(e.message);
            console.error(e);
        } finally {
            setGenerating(false);
        }
    };

    const regenerateAll = async () => {
        setBulkRunning(true);
        setBulkResult(null);
        try {
            const res = await fetch('/api/admin/courses/regenerate-thumbnails', { method: 'POST' });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Bulk regeneration failed');
            setBulkResult({ total: data.total, ok: data.ok, failed: data.failed });
        } catch (e: any) {
            setError(e.message);
        } finally {
            setBulkRunning(false);
        }
    };

    const downloadImage = async () => {
        if (!previewUrl) return;
        const a = document.createElement('a');
        a.href = previewUrl;
        a.download = `${category}_${title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}_thumb_v1.webp`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    return (
        <div className="min-h-screen bg-[var(--page-bg)] text-[var(--page-fg)]">
            <Header />

            <div className="max-w-7xl mx-auto px-6 py-12">

                <div className="mb-10">
                    <h1 className="text-4xl font-black tracking-tight mb-2">
                        Thumbnail <span style={{ color: selectedCat.accent }}>Generator</span>
                    </h1>
                    <p className="text-white/40 text-sm">
                        AI Bytes Brief v1.0 — 6 category gradients, DALL-E 3 backgrounds, programmatic brand layer
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* LEFT: Controls */}
                    <div className="lg:col-span-4 space-y-6">

                        {/* Title */}
                        <div className="bg-white/5 p-5 rounded-2xl border border-white/10">
                            <label className="block text-xs font-bold uppercase tracking-widest mb-3" style={{ color: selectedCat.accent }}>
                                Course Title
                            </label>
                            <Textarea
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                className="bg-black/40 border-white/10 text-white text-lg font-semibold min-h-[80px] resize-none"
                                placeholder="How LLMs actually think"
                            />
                            <p className="text-xs text-white/30 mt-2">Use curiosity-gap language — "How X really works", "Why X is harder than it looks"</p>
                        </div>

                        {/* Description (optional) */}
                        <div className="bg-white/5 p-5 rounded-2xl border border-white/10">
                            <label className="block text-xs font-bold uppercase tracking-widest mb-3 text-white/50">
                                Description <span className="text-white/30 normal-case font-normal">(helps category detection)</span>
                            </label>
                            <Textarea
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                className="bg-black/40 border-white/10 text-white/70 text-sm min-h-[60px] resize-none"
                                placeholder="Optional — improves auto-classification"
                            />
                        </div>

                        {/* Category */}
                        <div className="bg-white/5 p-5 rounded-2xl border border-white/10">
                            <label className="block text-xs font-bold uppercase tracking-widest mb-3" style={{ color: selectedCat.accent }}>
                                Topic Category
                            </label>
                            <div className="space-y-2">
                                {CATEGORIES.map(cat => (
                                    <button
                                        key={cat.slug}
                                        onClick={() => setCategory(cat.slug)}
                                        className={`w-full text-left p-3 rounded-xl border transition-all flex items-center gap-3 ${
                                            category === cat.slug
                                                ? 'border-white/30 bg-white/10'
                                                : 'border-white/5 bg-black/20 hover:bg-white/5'
                                        }`}
                                    >
                                        {/* Gradient swatch */}
                                        <div
                                            className="w-8 h-8 rounded-lg flex-shrink-0"
                                            style={{ background: `linear-gradient(135deg, ${cat.dark}, ${cat.vivid})` }}
                                        />
                                        <div>
                                            <div className="text-sm font-bold text-white">{cat.label}</div>
                                            <div className="text-xs text-white/40">{cat.description}</div>
                                        </div>
                                        {category === cat.slug && (
                                            <Sparkles className="w-4 h-4 ml-auto flex-shrink-0" style={{ color: cat.accent }} />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Difficulty */}
                        <div className="bg-white/5 p-5 rounded-2xl border border-white/10">
                            <label className="block text-xs font-bold uppercase tracking-widest mb-3 text-white/50">
                                Difficulty
                            </label>
                            <div className="flex gap-2">
                                {(['beginner', 'intermediate', 'advanced'] as const).map(d => (
                                    <button
                                        key={d}
                                        onClick={() => setDifficulty(d)}
                                        className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                                            difficulty === d
                                                ? 'text-white'
                                                : 'bg-black/20 border border-white/5 text-white/40 hover:text-white/70'
                                        }`}
                                        style={difficulty === d ? { background: selectedCat.accent, color: '#000' } : {}}
                                    >
                                        {d}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <Button
                            onClick={generateThumbnail}
                            disabled={generating || !title.trim()}
                            className="w-full h-14 text-base font-bold rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98] text-black"
                            style={{ background: `linear-gradient(135deg, ${selectedCat.dark}, ${selectedCat.vivid})`, color: 'white' }}
                        >
                            {generating ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                            {generating ? 'Generating...' : 'Generate Thumbnail'}
                        </Button>

                        {error && (
                            <div className="bg-red-950/40 border border-red-700/40 rounded-xl p-4 text-red-300 text-sm">
                                {error}
                            </div>
                        )}
                    </div>

                    {/* RIGHT: Preview */}
                    <div className="lg:col-span-8 space-y-4">

                        {/* Preview area */}
                        <div
                            className="relative aspect-video rounded-2xl overflow-hidden border border-white/10 group"
                            style={{
                                background: previewUrl
                                    ? undefined
                                    : `linear-gradient(135deg, ${selectedCat.dark}, ${selectedCat.vivid})`,
                            }}
                        >
                            {previewUrl ? (
                                <img src={previewUrl} className="w-full h-full object-cover" alt="Generated thumbnail" />
                            ) : (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-white/30">
                                    <div className="w-16 h-16 rounded-2xl mb-4 opacity-40" style={{ background: selectedCat.accent }} />
                                    <p className="text-sm font-medium tracking-wide uppercase">Preview</p>
                                    <p className="text-xs mt-1 opacity-60">{selectedCat.label}</p>
                                </div>
                            )}

                            {previewUrl && (
                                <div className="absolute bottom-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button
                                        onClick={generateThumbnail}
                                        size="sm"
                                        className="bg-black/80 hover:bg-black text-white border border-white/20 backdrop-blur-md"
                                    >
                                        <RefreshCw className="w-4 h-4 mr-1" />
                                        Regenerate
                                    </Button>
                                    <Button
                                        onClick={downloadImage}
                                        size="sm"
                                        className="bg-white text-black hover:bg-gray-200 font-bold"
                                    >
                                        <Download className="w-4 h-4 mr-1" />
                                        Download
                                    </Button>
                                </div>
                            )}
                        </div>

                        {/* Bulk Regenerate */}
                        <div className="bg-white/5 rounded-2xl border border-white/10 p-5 flex items-center justify-between gap-4">
                            <div>
                                <p className="text-sm font-bold text-white">Regenerate All Course Thumbnails</p>
                                <p className="text-xs text-white/40 mt-0.5">Applies new SAFE=140 fix to every course in the database</p>
                                {bulkResult && (
                                    <p className="text-xs mt-1.5">
                                        <span className="text-[#00FFB3]">✓ {bulkResult.ok} updated</span>
                                        {bulkResult.failed > 0 && <span className="text-[#FF6B6B] ml-3">✗ {bulkResult.failed} failed</span>}
                                        <span className="text-white/30 ml-3">of {bulkResult.total} total</span>
                                    </p>
                                )}
                            </div>
                            <Button
                                onClick={regenerateAll}
                                disabled={bulkRunning}
                                className="shrink-0 bg-[#9B8FFF]/20 hover:bg-[#9B8FFF]/30 text-[#9B8FFF] border border-[#9B8FFF]/30 font-bold"
                            >
                                {bulkRunning ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Zap className="w-4 h-4 mr-2" />}
                                {bulkRunning ? 'Running...' : 'Regenerate All'}
                            </Button>
                        </div>

                        {/* Specs */}
                        <div className="grid grid-cols-4 gap-3 text-center text-white/30 text-xs font-medium uppercase tracking-widest">
                            <div className="bg-white/5 py-3 rounded-xl border border-white/5">1280 × 720px</div>
                            <div className="bg-white/5 py-3 rounded-xl border border-white/5">16:9 ratio</div>
                            <div className="bg-white/5 py-3 rounded-xl border border-white/5">PNG master</div>
                            <div className="bg-white/5 py-3 rounded-xl border border-white/5 text-white/20">
                                <span style={{ color: selectedCat.accent }}>{selectedCat.label}</span>
                            </div>
                        </div>

                        {/* Brief colour reference */}
                        <div className="bg-white/5 rounded-2xl border border-white/10 p-5">
                            <p className="text-xs font-bold uppercase tracking-widest text-white/30 mb-4">Category Palette Reference</p>
                            <div className="grid grid-cols-6 gap-2">
                                {CATEGORIES.map(cat => (
                                    <div key={cat.slug} className="flex flex-col items-center gap-2">
                                        <div
                                            className="w-full h-12 rounded-lg cursor-pointer transition-transform hover:scale-105"
                                            style={{ background: `linear-gradient(135deg, ${cat.dark}, ${cat.vivid})` }}
                                            onClick={() => setCategory(cat.slug)}
                                            title={cat.label}
                                        />
                                        <span className="text-[9px] text-white/40 text-center leading-tight">{cat.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
