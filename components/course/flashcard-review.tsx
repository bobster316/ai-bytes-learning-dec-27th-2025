
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Trophy,
    RotateCcw,
    ChevronRight,
    Zap,
    ShieldCheck,
    BrainCircuit,
    Lightbulb,
    CheckCircle2,
    XCircle
} from "lucide-react";
import confetti from "canvas-confetti";

interface Flashcard {
    id: string;
    front: string;
    back: string;
    card_type: "concept" | "code" | "application" | "definition";
    hint?: string;
    explanation?: string;
    code_example?: string;
}

export function FlashcardReview({ userId }: { userId: string }) {
    const [cards, setCards] = useState<any[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [showHint, setShowHint] = useState(false);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ correct: 0, total: 0 });
    const [isComplete, setIsComplete] = useState(false);

    useEffect(() => {
        fetchDueCards();
    }, []);

    const fetchDueCards = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/flashcards/due?userId=${userId}`);
            const data = await res.json();
            setCards(data.cards || []);
        } catch (e) {
            console.error("Failed to fetch cards", e);
        } finally {
            setLoading(false);
        }
    };

    const handleReview = async (quality: number) => {
        const card = cards[currentIndex];

        // Optimistic UI
        if (quality >= 3) setStats(s => ({ ...s, correct: s.correct + 1 }));
        setStats(s => ({ ...s, total: s.total + 1 }));

        try {
            await fetch("/api/flashcards/review", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId,
                    flashcardId: card.flashcard_id || card.id,
                    quality
                })
            });
        } catch (e) {
            console.error("Failed to submit review", e);
        }

        if (currentIndex < cards.length - 1) {
            setCurrentIndex(currentIndex + 1);
            setIsFlipped(false);
            setShowHint(false);
        } else {
            setIsComplete(true);
            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#06b6d4', '#3b82f6', '#ffffff']
            });
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <BrainCircuit className="w-12 h-12 text-cyan-500 animate-pulse mb-4" />
                <p className="text-slate-500 font-mono text-xs uppercase tracking-widest">Accessing Knowledge Graph...</p>
            </div>
        );
    }

    if (isComplete) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-20 px-8 bg-white/5 rounded-[3rem] border border-white/5"
            >
                <div className="w-24 h-24 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-cyan-500/20">
                    <Trophy className="w-12 h-12 text-white" />
                </div>
                <h2 className="text-4xl font-black text-white mb-4 tracking-tighter">Daily Review Complete!</h2>
                <p className="text-slate-400 mb-8 max-w-sm mx-auto">You've successfully reinforced {stats.total} concepts today. Your neural patterns are strengthening.</p>
                <div className="flex gap-4 justify-center">
                    <div className="px-6 py-3 rounded-2xl bg-white/5 border border-white/5">
                        <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">Accuracy</div>
                        <div className="text-2xl font-mono font-bold text-cyan-400">{((stats.correct / stats.total) * 100).toFixed(0)}%</div>
                    </div>
                    <div className="px-6 py-3 rounded-2xl bg-white/5 border border-white/5">
                        <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">XP Earned</div>
                        <div className="text-2xl font-mono font-bold text-emerald-400">+{stats.total * 15}</div>
                    </div>
                </div>
            </motion.div>
        );
    }

    if (cards.length === 0) {
        return (
            <div className="text-center py-20 px-8 bg-white/5 rounded-[3rem] border border-white/5 border-dashed">
                <ShieldCheck className="w-16 h-16 text-slate-700 mx-auto mb-6" />
                <h3 className="text-xl font-bold text-slate-300 mb-2">Knowledge Base Synced</h3>
                <p className="text-slate-500 text-sm">No cards due for review. Your long-term memory is currently optimized.</p>
            </div>
        );
    }

    const currentCard = cards[currentIndex].flashcard || cards[currentIndex];

    return (
        <div className="max-w-2xl mx-auto">
            {/* Header Stats */}
            <div className="flex justify-between items-end mb-8 px-4">
                <div>
                    <div className="text-[10px] text-cyan-500 font-mono uppercase tracking-[0.3em] font-black mb-1">Spaced Repetition</div>
                    <h3 className="text-2xl font-black text-white tracking-tight">Active Review</h3>
                </div>
                <div className="text-right">
                    <div className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">{currentIndex + 1} / {cards.length}</div>
                    <div className="w-32 h-1.5 bg-white/10 rounded-full mt-2 overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }}
                            className="h-full bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]"
                        />
                    </div>
                </div>
            </div>

            {/* Card Container */}
            <div className="perspective-1000 h-[450px] relative group">
                <motion.div
                    animate={{ rotateY: isFlipped ? 180 : 0 }}
                    transition={{ type: "spring", stiffness: 260, damping: 20 }}
                    className="w-full h-full relative preserve-3d"
                    onClick={() => setIsFlipped(!isFlipped)}
                >
                    {/* Front */}
                    <div className={`absolute inset-0 backface-hidden bg-slate-900 border border-white/10 rounded-[2.5rem] p-12 flex flex-col justify-center items-center text-center shadow-2xl transition-all ${!isFlipped ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                        <BrainCircuit className="w-10 h-10 text-cyan-500/20 mb-8" />
                        <h2 className="text-2xl md:text-3xl font-bold text-white leading-tight">
                            {currentCard.front}
                        </h2>

                        {showHint && currentCard.hint && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mt-8 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-200 text-xs italic"
                            >
                                <Lightbulb size={14} className="inline mr-2 text-amber-500" />
                                {currentCard.hint}
                            </motion.div>
                        )}

                        <div className="absolute bottom-8 text-[10px] text-slate-500 uppercase tracking-widest font-black animate-pulse">
                            Click to reveal answer
                        </div>
                    </div>

                    {/* Back */}
                    <div className={`absolute inset-0 backface-hidden bg-slate-800 border border-cyan-500/20 rounded-[2.5rem] p-12 flex flex-col shadow-2xl transition-all rotate-y-180 ${isFlipped ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                        <div className="flex-1 overflow-y-auto scrollbar-hide">
                            <div className="text-[10px] text-cyan-500 font-mono uppercase tracking-widest font-black mb-4">Correct Response</div>
                            <p className="text-xl text-slate-200 leading-relaxed font-light mb-8">
                                {currentCard.back}
                            </p>

                            {currentCard.explanation && (
                                <div className="p-6 bg-white/5 rounded-3xl border border-white/5 mb-6">
                                    <div className="text-[9px] uppercase font-black text-slate-500 tracking-widest mb-2">Deep Context</div>
                                    <p className="text-[13px] text-slate-400 font-light">{currentCard.explanation}</p>
                                </div>
                            )}

                            {currentCard.code_example && (
                                <div className="rounded-2xl overflow-hidden bg-black/40 border border-white/5">
                                    <div className="px-4 py-2 bg-white/5 text-[9px] font-mono text-slate-500 uppercase">Code Sample</div>
                                    <pre className="p-4 text-xs font-mono text-cyan-400 overflow-x-auto">
                                        <code>{currentCard.code_example}</code>
                                    </pre>
                                </div>
                            )}
                        </div>

                        {/* Review Buttons */}
                        <div className="grid grid-cols-4 gap-3 pt-8 mt-4 border-t border-white/5">
                            {[
                                { val: 1, label: "Again", color: "rose", desc: "< 1m" },
                                { val: 2, label: "Hard", color: "amber", desc: "2d" },
                                { val: 3, label: "Good", color: "cyan", desc: "4d" },
                                { val: 5, label: "Easy", color: "emerald", desc: "7d" }
                            ].map((btn) => (
                                <button
                                    key={btn.val}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleReview(btn.val);
                                    }}
                                    className={`flex flex-col items-center justify-center py-3 rounded-2xl bg-${btn.color}-500/10 hover:bg-${btn.color}-500/20 border border-${btn.color}-500/20 transition-all active:scale-95 group`}
                                >
                                    <span className={`text-xs font-bold text-${btn.color}-400 mb-1`}>{btn.label}</span>
                                    <span className="text-[8px] text-slate-500 font-mono uppercase opacity-40 group-hover:opacity-100">{btn.desc}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </motion.div>
            </div>

            <style jsx global>{`
        .perspective-1000 { perspective: 1000px; }
        .preserve-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
      `}</style>
        </div>
    );
}
