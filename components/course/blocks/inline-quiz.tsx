"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, CheckCircle2, XCircle, ArrowRight, Sparkles, Terminal, Zap, CircleDot } from "lucide-react";
import { cn } from "@/lib/utils";

export type QuizState = "IDLE" | "SELECTING" | "REVEALED";

// ─── Shared data-normalisation hook ──────────────────────────────────────────

function useQuizLogic(questions: any[], onAnswerCorrect?: () => void) {
    const [currentIdx, setCurrentIdx] = useState(0);
    const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
    const [quizState, setQuizState] = useState<QuizState>("IDLE");

    const safeQuestions = questions || [];
    const rawQuestion = safeQuestions.length > 0 ? safeQuestions[currentIdx] : {};
    const questionText = rawQuestion?.questionText || rawQuestion?.question || rawQuestion?.text || "Knowledge Check";

    let options = rawQuestion?.options || rawQuestion?.answers || [];
    if (options.length > 0) {
        if (typeof options[0] === 'object' && 'id' in options[0]) {
            options = options.map((opt: any) => ({
                letter: opt.id,
                text: opt.text,
                isCorrect: opt.id === rawQuestion?.correctOptionId
            }));
        } else if (typeof options[0] === 'string') {
            const correctText = rawQuestion?.answer || rawQuestion?.correctAnswer;
            options = options.map((ans: string, i: number) => ({
                letter: String.fromCharCode(65 + i),
                text: ans,
                isCorrect: correctText ? ans === correctText : i === (rawQuestion?.correctIndex || 0)
            }));
        }
    } else {
        options = [
            { letter: 'A', text: 'True', isCorrect: rawQuestion?.correctIndex === 0 },
            { letter: 'B', text: 'False', isCorrect: rawQuestion?.correctIndex === 1 }
        ];
    }

    const isCorrect = selectedLetter ? options.find((o: any) => o.letter === selectedLetter)?.isCorrect : false;

    const handleSelect = (letter: string) => {
        if (quizState === "REVEALED") return;
        setSelectedLetter(letter);
        setQuizState("SELECTING");
    };

    const handleValidate = () => {
        setQuizState("REVEALED");
        if (isCorrect && onAnswerCorrect) onAnswerCorrect();
    };

    const handleNext = () => {
        if (currentIdx < safeQuestions.length - 1) {
            setCurrentIdx(prev => prev + 1);
            setSelectedLetter(null);
            setQuizState("IDLE");
        }
    };

    return {
        currentIdx, selectedLetter, quizState,
        questionText, options, rawQuestion, isCorrect,
        totalQuestions: safeQuestions.length,
        handleSelect, handleValidate, handleNext
    };
}

// ─── Mode 0 — Gradient Card (polished dark card) ─────────────────────────────

function QuizGradientCard({ title, questions, onAnswerCorrect }: any) {
    const q = useQuizLogic(questions, onAnswerCorrect);

    return (
        <div className="mb-16 p-[1px] rounded-[2.5rem] bg-gradient-to-b from-white/10 via-transparent to-transparent shadow-2xl">
            <div className="bg-[#141422] rounded-[2.4rem] p-8 md:p-12 backdrop-blur-3xl border border-white/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#00FFB3]/5 rounded-full blur-3xl pointer-events-none" />

                {/* Header */}
                <div className="flex items-center gap-5 mb-10">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#00FFB3] to-[#9B8FFF] flex items-center justify-center shadow-[0_0_30px_rgba(155,143,255,0.3)]">
                        <Brain className="w-7 h-7 text-white" />
                    </div>
                    <div>
                        <h3 className="font-display text-[1.4rem] font-black text-white leading-none mb-2 tracking-tight">
                            {title || "Knowledge Check"}
                        </h3>
                        <div className="flex items-center gap-2">
                            <div className="h-1 w-24 bg-white/5 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${((q.currentIdx + 1) / q.totalQuestions) * 100}%` }}
                                    className="h-full bg-[#00FFB3]"
                                />
                            </div>
                            <span className="font-mono text-[12px] text-[#8A8AB0] uppercase tracking-widest font-bold">
                                {q.currentIdx + 1} of {q.totalQuestions}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="font-body text-2xl md:text-3xl font-bold text-white mb-10 leading-tight tracking-tight">
                    {q.questionText}
                </div>

                <div className="flex flex-col gap-4 mb-12">
                    {q.options.map((opt: any, idx: number) => {
                        const isSelected = q.selectedLetter === opt.letter;
                        const isRevealed = q.quizState === "REVEALED";
                        const showSuccess = isRevealed && opt.isCorrect;
                        const showError = isRevealed && isSelected && !opt.isCorrect;
                        return (
                            <motion.button
                                key={opt.letter || idx}
                                disabled={isRevealed}
                                onClick={() => q.handleSelect(opt.letter)}
                                whileHover={!isRevealed ? { x: 8, backgroundColor: "rgba(255,255,255,0.05)" } : {}}
                                whileTap={!isRevealed ? { scale: 0.98 } : {}}
                                className={cn(
                                    "flex items-center gap-5 p-6 rounded-[1.5rem] border text-left transition-all duration-300",
                                    !isRevealed && isSelected && "bg-[#00FFB3]/10 border-[#00FFB3] ring-2 ring-[#00FFB3]/20",
                                    !isRevealed && !isSelected && "bg-white/[0.03] border-white/5 hover:border-white/10",
                                    showSuccess && "bg-[#00FFB3]/10 border-[#00FFB3] shadow-[0_0_30px_rgba(0,255,179,0.1)]",
                                    showError && "bg-[#FF6B6B]/10 border-[#FF6B6B]",
                                    isRevealed && !showSuccess && !showError && "opacity-30 grayscale-[0.8] border-white/5"
                                )}
                            >
                                <div className={cn(
                                    "w-12 h-12 rounded-xl flex items-center justify-center font-mono text-[16px] font-black shrink-0 transition-all",
                                    isSelected ? "bg-[#00FFB3] text-[#0a0a0f]" : "bg-white/5 text-[#8A8AB0]"
                                )}>
                                    {opt.letter}
                                </div>
                                <span className="font-body text-[18px] text-white/90 font-medium leading-snug flex-1">
                                    {opt.text}
                                </span>
                                <AnimatePresence>
                                    {showSuccess && (
                                        <motion.div initial={{ scale: 0, rotate: -45 }} animate={{ scale: 1, rotate: 0 }} className="shrink-0">
                                            <div className="w-8 h-8 rounded-full bg-[#00FFB3] flex items-center justify-center">
                                                <CheckCircle2 className="w-5 h-5 text-[#141422]" />
                                            </div>
                                        </motion.div>
                                    )}
                                    {showError && (
                                        <motion.div initial={{ scale: 0, rotate: 45 }} animate={{ scale: 1, rotate: 0 }} className="shrink-0">
                                            <div className="w-8 h-8 rounded-full bg-[#FF6B6B] flex items-center justify-center">
                                                <XCircle className="w-5 h-5 text-white" />
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.button>
                        );
                    })}
                </div>

                <div className="relative min-h-[80px]">
                    <AnimatePresence mode="wait">
                        {q.quizState !== "REVEALED" ? (
                            <motion.button
                                key="validate"
                                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                                disabled={q.quizState === "IDLE"}
                                onClick={q.handleValidate}
                                className="w-full py-6 rounded-2xl bg-gradient-to-r from-[#00FFB3] to-[#9B8FFF] text-white font-black text-xs uppercase tracking-[0.25em] shadow-[0_10px_40px_rgba(155,143,255,0.3)] hover:-translate-y-1 transition-all disabled:opacity-20 disabled:pointer-events-none active:scale-[0.98]"
                            >
                                Check Answer
                            </motion.button>
                        ) : (
                            <motion.div
                                key="feedback"
                                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                                className={cn(
                                    "p-8 rounded-[1.5rem] border flex flex-col items-center text-center",
                                    q.isCorrect ? "bg-[#00FFB3]/5 border-[#00FFB3]/20" : "bg-[#FFB347]/5 border-[#FFB347]/20"
                                )}
                            >
                                <div className="flex items-center gap-3 mb-4">
                                    {q.isCorrect ? (
                                        <><Sparkles className="w-6 h-6 text-[#00FFB3]" /><span className="font-display font-black text-[#00FFB3] uppercase tracking-[0.3em] text-[13px]">Correct!</span></>
                                    ) : (
                                        <><XCircle className="w-6 h-6 text-[#FFB347]" /><span className="font-display font-black text-[#FFB347] uppercase tracking-[0.3em] text-[13px]">Not quite</span></>
                                    )}
                                </div>
                                <p className="font-body text-[#E2E8F0] text-lg leading-relaxed mb-8 max-w-xl">
                                    {q.isCorrect ? (q.rawQuestion.correctFeedback || "Your logic is impeccable.") : (q.rawQuestion.incorrectFeedback || "A subtle misalignment in the signal. Let's recalibrate.")}
                                </p>
                                {q.currentIdx < q.totalQuestions - 1 && (
                                    <button onClick={q.handleNext} className="group inline-flex items-center gap-3 px-10 py-4 rounded-full bg-white/5 hover:bg-white/10 text-white font-mono text-[13px] font-black uppercase tracking-[0.2em] transition-all border border-white/10 hover:border-white/20">
                                        Next Question <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                    </button>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}

// ─── Mode 1 — Terminal HUD ────────────────────────────────────────────────────

function QuizTerminalHUD({ title, questions, onAnswerCorrect }: any) {
    const q = useQuizLogic(questions, onAnswerCorrect);
    const promptColour = q.isCorrect && q.quizState === "REVEALED" ? "#00FFB3" : "#9B8FFF";

    return (
        <div className="mb-16 rounded-2xl border border-white/10 bg-[#0d0d18] overflow-hidden font-mono shadow-[0_0_60px_rgba(155,143,255,0.08)]">
            {/* Terminal title bar */}
            <div className="flex items-center justify-between px-6 py-3 bg-white/[0.03] border-b border-white/5">
                <div className="flex items-center gap-3">
                    <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-[#FF6B6B]/60" />
                        <div className="w-3 h-3 rounded-full bg-[#FFB347]/60" />
                        <div className="w-3 h-3 rounded-full bg-[#00FFB3]/60" />
                    </div>
                    <Terminal className="w-4 h-4 text-[#9B8FFF]/60" />
                    <span className="text-[11px] text-[#8A8AB0] uppercase tracking-[0.2em]">{title || "query_node"}</span>
                </div>
                <span className="text-[11px] text-[#8A8AB0]">[{q.currentIdx + 1}/{q.totalQuestions}]</span>
            </div>

            <div className="p-6 md:p-10">
                {/* Prompt line */}
                <div className="flex items-start gap-3 mb-8">
                    <span className="text-[#9B8FFF] text-[15px] shrink-0 mt-0.5">&#62;</span>
                    <p className="text-[18px] md:text-[20px] text-white/90 leading-snug tracking-tight">
                        {q.questionText}
                    </p>
                </div>

                {/* Options */}
                <div className="flex flex-col gap-2 mb-8 pl-6 border-l-2 border-white/5">
                    {q.options.map((opt: any, idx: number) => {
                        const isSelected = q.selectedLetter === opt.letter;
                        const isRevealed = q.quizState === "REVEALED";
                        const showSuccess = isRevealed && opt.isCorrect;
                        const showError = isRevealed && isSelected && !opt.isCorrect;
                        return (
                            <motion.button
                                key={opt.letter || idx}
                                disabled={isRevealed}
                                onClick={() => q.handleSelect(opt.letter)}
                                whileTap={!isRevealed ? { scale: 0.99 } : {}}
                                className={cn(
                                    "flex items-center gap-4 px-5 py-4 rounded-lg text-left transition-all duration-200",
                                    !isRevealed && isSelected && "bg-[#9B8FFF]/10 border border-[#9B8FFF]/40",
                                    !isRevealed && !isSelected && "bg-transparent border border-transparent hover:border-white/10 hover:bg-white/[0.03]",
                                    showSuccess && "bg-[#00FFB3]/8 border border-[#00FFB3]/40",
                                    showError && "bg-[#FF6B6B]/8 border border-[#FF6B6B]/30",
                                    isRevealed && !showSuccess && !showError && "opacity-25"
                                )}
                            >
                                <span className={cn(
                                    "text-[14px] font-black shrink-0 w-6",
                                    isSelected && !isRevealed && "text-[#9B8FFF]",
                                    showSuccess && "text-[#00FFB3]",
                                    showError && "text-[#FF6B6B]",
                                    !isSelected && !showSuccess && !showError && "text-[#8A8AB0]"
                                )}>
                                    [{opt.letter}]
                                </span>
                                <span className={cn(
                                    "text-[16px] tracking-tight flex-1",
                                    showSuccess ? "text-[#00FFB3]" : showError ? "text-[#FF6B6B]" : isSelected ? "text-white" : "text-white/60"
                                )}>
                                    {opt.text}
                                </span>
                                {showSuccess && <CheckCircle2 className="w-4 h-4 text-[#00FFB3] shrink-0" />}
                                {showError && <XCircle className="w-4 h-4 text-[#FF6B6B] shrink-0" />}
                            </motion.button>
                        );
                    })}
                </div>

                {/* Action / Feedback */}
                <AnimatePresence mode="wait">
                    {q.quizState !== "REVEALED" ? (
                        <motion.button
                            key="validate"
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            disabled={q.quizState === "IDLE"}
                            onClick={q.handleValidate}
                            className="flex items-center gap-2 px-6 py-3 rounded-lg border border-[#9B8FFF]/30 bg-[#9B8FFF]/5 text-[#9B8FFF] text-[13px] uppercase tracking-[0.2em] font-black hover:bg-[#9B8FFF]/10 transition-all disabled:opacity-20 disabled:pointer-events-none"
                        >
                            <span className="text-[#9B8FFF]/50">$</span> run check_answer
                        </motion.button>
                    ) : (
                        <motion.div
                            key="feedback"
                            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                            className="space-y-3"
                        >
                            <div className="flex items-center gap-2">
                                <span style={{ color: promptColour }} className="text-[13px] font-black">
                                    {q.isCorrect ? "// ASSERTION PASSED ✓" : "// ASSERTION FAILED ✗"}
                                </span>
                            </div>
                            <p className="text-[15px] text-white/60 leading-relaxed pl-4 border-l-2 border-white/10">
                                {q.isCorrect ? (q.rawQuestion.correctFeedback || "Logic confirmed. Pattern recognised.") : (q.rawQuestion.incorrectFeedback || "Signal mismatch detected. Re-evaluate the model.")}
                            </p>
                            {q.currentIdx < q.totalQuestions - 1 && (
                                <button onClick={q.handleNext} className="group inline-flex items-center gap-2 text-[#9B8FFF] text-[13px] font-black uppercase tracking-[0.15em] hover:text-white transition-colors mt-2">
                                    <span className="text-[#9B8FFF]/40">$</span> next_query <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </button>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

// ─── Mode 2 — Diagnostic Panel ────────────────────────────────────────────────

function QuizDiagnosticPanel({ title, questions, onAnswerCorrect }: any) {
    const q = useQuizLogic(questions, onAnswerCorrect);

    return (
        <div className="mb-16 rounded-3xl border border-white/8 bg-[#10101e] overflow-hidden">
            {/* Header strip */}
            <div className="px-8 py-5 flex items-center justify-between border-b border-white/5 bg-gradient-to-r from-[#9B8FFF]/5 to-transparent">
                <div className="flex items-center gap-3">
                    <CircleDot className="w-5 h-5 text-[#9B8FFF]" />
                    <span className="font-display font-black text-white text-[15px] uppercase tracking-[0.15em]">
                        {title || "Diagnostic"}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    {Array.from({ length: q.totalQuestions }).map((_, i) => (
                        <div key={i} className={cn(
                            "w-2 h-2 rounded-full transition-all",
                            i < q.currentIdx ? "bg-[#00FFB3]" : i === q.currentIdx ? "bg-[#9B8FFF]" : "bg-white/10"
                        )} />
                    ))}
                </div>
            </div>

            <div className="p-8 md:p-10">
                {/* Question */}
                <div className="mb-8">
                    <div className="inline-flex items-center gap-2 mb-4">
                        <span className="w-7 h-7 rounded-lg bg-[#9B8FFF]/15 text-[#9B8FFF] font-mono text-[13px] font-black flex items-center justify-center">
                            {String(q.currentIdx + 1).padStart(2, '0')}
                        </span>
                        <span className="text-[#9B8FFF]/60 font-mono text-[11px] uppercase tracking-[0.2em]">Question</span>
                    </div>
                    <p className="font-body text-[20px] md:text-[22px] text-white font-bold leading-snug">
                        {q.questionText}
                    </p>
                </div>

                {/* Options — 2-column grid on wide, stacked on narrow */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
                    {q.options.map((opt: any, idx: number) => {
                        const isSelected = q.selectedLetter === opt.letter;
                        const isRevealed = q.quizState === "REVEALED";
                        const showSuccess = isRevealed && opt.isCorrect;
                        const showError = isRevealed && isSelected && !opt.isCorrect;
                        return (
                            <motion.button
                                key={opt.letter || idx}
                                disabled={isRevealed}
                                onClick={() => q.handleSelect(opt.letter)}
                                whileHover={!isRevealed ? { scale: 1.01 } : {}}
                                whileTap={!isRevealed ? { scale: 0.98 } : {}}
                                className={cn(
                                    "relative flex items-start gap-4 p-5 rounded-2xl border text-left transition-all duration-200",
                                    !isRevealed && isSelected && "bg-[#9B8FFF]/10 border-[#9B8FFF]/50",
                                    !isRevealed && !isSelected && "bg-white/[0.02] border-white/6 hover:bg-white/[0.05] hover:border-white/15",
                                    showSuccess && "bg-[#00FFB3]/8 border-[#00FFB3]/40",
                                    showError && "bg-[#FF6B6B]/8 border-[#FF6B6B]/30 opacity-70",
                                    isRevealed && !showSuccess && !showError && "opacity-20"
                                )}
                            >
                                <span className={cn(
                                    "w-8 h-8 rounded-lg flex items-center justify-center font-mono text-[13px] font-black shrink-0",
                                    isSelected && !isRevealed && "bg-[#9B8FFF] text-white",
                                    showSuccess && "bg-[#00FFB3] text-[#0a0a0f]",
                                    showError && "bg-[#FF6B6B] text-white",
                                    !isSelected && !showSuccess && !showError && "bg-white/6 text-[#8A8AB0]"
                                )}>
                                    {opt.letter}
                                </span>
                                <span className="font-body text-[15px] text-white/85 leading-snug flex-1 pt-0.5">
                                    {opt.text}
                                </span>
                                {showSuccess && <CheckCircle2 className="w-5 h-5 text-[#00FFB3] shrink-0 mt-0.5" />}
                                {showError && <XCircle className="w-5 h-5 text-[#FF6B6B] shrink-0 mt-0.5" />}
                            </motion.button>
                        );
                    })}
                </div>

                {/* Footer action / feedback */}
                <AnimatePresence mode="wait">
                    {q.quizState !== "REVEALED" ? (
                        <motion.div key="validate" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <button
                                disabled={q.quizState === "IDLE"}
                                onClick={q.handleValidate}
                                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-[#9B8FFF] text-white font-display font-black text-[13px] uppercase tracking-[0.2em] hover:bg-[#b8aeff] transition-colors disabled:opacity-20 disabled:pointer-events-none shadow-[0_4px_20px_rgba(155,143,255,0.3)]"
                            >
                                <Zap className="w-4 h-4" /> Verify Answer
                            </button>
                        </motion.div>
                    ) : (
                        <motion.div key="feedback" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                            className={cn(
                                "rounded-2xl p-6 border",
                                q.isCorrect ? "bg-[#00FFB3]/5 border-[#00FFB3]/20" : "bg-[#FFB347]/5 border-[#FFB347]/20"
                            )}
                        >
                            <div className="flex items-center gap-2 mb-3">
                                {q.isCorrect
                                    ? <><Sparkles className="w-5 h-5 text-[#00FFB3]" /><span className="font-display font-black text-[#00FFB3] text-[13px] uppercase tracking-[0.2em]">Confirmed</span></>
                                    : <><XCircle className="w-5 h-5 text-[#FFB347]" /><span className="font-display font-black text-[#FFB347] text-[13px] uppercase tracking-[0.2em]">Incorrect</span></>
                                }
                            </div>
                            <p className="font-body text-white/70 text-[15px] leading-relaxed mb-5">
                                {q.isCorrect ? (q.rawQuestion.correctFeedback || "Correct. Pattern confirmed.") : (q.rawQuestion.incorrectFeedback || "Not quite. Review the concept and try again.")}
                            </p>
                            {q.currentIdx < q.totalQuestions - 1 && (
                                <button onClick={q.handleNext} className="group inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-white/10 bg-white/3 hover:bg-white/8 text-white font-display font-black text-[13px] uppercase tracking-[0.15em] transition-all">
                                    Next <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </button>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

// ─── Public export — routes by lessonIndex ────────────────────────────────────

export function InlineQuiz({ title, questions, onAnswerCorrect, lessonIndex }: any) {
    const mode = (lessonIndex ?? 0) % 3;
    if (mode === 1) return <QuizTerminalHUD title={title} questions={questions} onAnswerCorrect={onAnswerCorrect} />;
    if (mode === 2) return <QuizDiagnosticPanel title={title} questions={questions} onAnswerCorrect={onAnswerCorrect} />;
    return <QuizGradientCard title={title} questions={questions} onAnswerCorrect={onAnswerCorrect} />;
}
