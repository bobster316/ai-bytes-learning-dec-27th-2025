"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, CheckCircle2, XCircle, ArrowRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export type QuizState = "IDLE" | "SELECTING" | "REVEALED";

export function InlineQuiz({ title, questions, onAnswerCorrect }: any) {
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
        console.log(`[InlineQuiz] Validating Q${currentIdx + 1}/${safeQuestions.length}. Correct: ${isCorrect}`);
        setQuizState("REVEALED");
        if (isCorrect && onAnswerCorrect) {
            console.log(`[InlineQuiz] Triggering onAnswerCorrect callback`);
            onAnswerCorrect();
        }
    };

    const handleNext = () => {
        if (currentIdx < safeQuestions.length - 1) {
            console.log(`[InlineQuiz] Moving to Q${currentIdx + 2}`);
            setCurrentIdx(prev => prev + 1);
            setSelectedLetter(null);
            setQuizState("IDLE");
        }
    };

    return (
        <div className="mb-16 p-[1px] rounded-[2.5rem] bg-gradient-to-b from-white/10 via-transparent to-transparent shadow-2xl">
            <div className="bg-[#141422] rounded-[2.4rem] p-8 md:p-12 backdrop-blur-3xl border border-white/5 relative overflow-hidden">
                {/* Background Accent */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#4b98ad]/5 rounded-full blur-3xl pointer-events-none" />

                <div className="flex items-center justify-between mb-12">
                    <div className="flex items-center gap-5">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#4b98ad] to-[#6B7FFF] flex items-center justify-center shadow-[0_0_30px_rgba(155,143,255,0.3)]">
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
                                        animate={{ width: `${((currentIdx + 1) / safeQuestions.length) * 100}%` }}
                                        className="h-full bg-[#00FFB3]"
                                    />
                                </div>
                                <span className="font-mono text-[12px] text-[#8A8AB0] uppercase tracking-widest font-bold">
                                    {currentIdx + 1} of {safeQuestions.length}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="font-body text-2xl md:text-3xl font-bold text-white mb-10 leading-tight tracking-tight">
                    {questionText}
                </div>

                <div className="flex flex-col gap-4 mb-12">
                    {options.map((opt: any, idx: number) => {
                        const isSelected = selectedLetter === opt.letter;
                        const isRevealed = quizState === "REVEALED";
                        const showSuccess = isRevealed && opt.isCorrect;
                        const showError = isRevealed && isSelected && !opt.isCorrect;

                        return (
                            <motion.button
                                key={opt.letter || idx}
                                disabled={isRevealed}
                                onClick={() => handleSelect(opt.letter)}
                                whileHover={!isRevealed ? { x: 8, backgroundColor: "rgba(255,255,255,0.05)" } : {}}
                                whileTap={!isRevealed ? { scale: 0.98 } : {}}
                                className={cn(
                                    "flex items-center gap-5 p-6 rounded-[1.5rem] border text-left transition-all duration-300",
                                    !isRevealed && isSelected && "bg-[#4b98ad]/10 border-[#4b98ad] ring-2 ring-[#4b98ad]/20",
                                    !isRevealed && !isSelected && "bg-white/[0.03] border-white/5 hover:border-white/10",
                                    showSuccess && "bg-[#00FFB3]/10 border-[#00FFB3] shadow-[0_0_30px_rgba(0,255,179,0.1)]",
                                    showError && "bg-[#FF6B6B]/10 border-[#FF6B6B]",
                                    isRevealed && !showSuccess && !showError && "opacity-30 grayscale-[0.8] border-white/5"
                                )}
                            >
                                <div className={cn(
                                    "w-12 h-12 rounded-xl flex items-center justify-center font-mono text-[16px] font-black shrink-0 transition-all",
                                    isSelected ? "bg-[#4b98ad] text-white shadow-[0_0_20px_rgba(155,143,255,0.4)]" : "bg-white/5 text-[#8A8AB0]"
                                )}>
                                    {opt.letter}
                                </div>
                                <span className="font-body text-[18px] text-white/90 font-medium leading-snug">
                                    {opt.text}
                                </span>

                                <AnimatePresence>
                                    {showSuccess && (
                                        <motion.div
                                            initial={{ scale: 0, rotate: -45 }}
                                            animate={{ scale: 1, rotate: 0 }}
                                            className="ml-auto"
                                        >
                                            <div className="w-8 h-8 rounded-full bg-[#00FFB3] flex items-center justify-center">
                                                <CheckCircle2 className="w-5 h-5 text-[#141422]" />
                                            </div>
                                        </motion.div>
                                    )}
                                    {showError && (
                                        <motion.div
                                            initial={{ scale: 0, rotate: 45 }}
                                            animate={{ scale: 1, rotate: 0 }}
                                            className="ml-auto"
                                        >
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
                        {quizState !== "REVEALED" ? (
                            <motion.button
                                key="validate"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                disabled={quizState === "IDLE"}
                                onClick={handleValidate}
                                className="w-full py-6 rounded-2xl bg-gradient-to-r from-[#4b98ad] to-[#6B7FFF] text-white font-black text-xs uppercase tracking-[0.25em] shadow-[0_10px_40px_rgba(155,143,255,0.3)] hover:-translate-y-1 hover:shadow-[0_20px_60px_rgba(155,143,255,0.4)] transition-all disabled:opacity-20 disabled:pointer-events-none active:scale-[0.98]"
                            >
                                Check Answer
                            </motion.button>
                        ) : (
                            <motion.div
                                key="feedback"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={cn(
                                    "p-8 rounded-[1.5rem] border flex flex-col items-center text-center",
                                    isCorrect ? "bg-[#00FFB3]/5 border-[#00FFB3]/20" : "bg-[#FFB347]/5 border-[#FFB347]/20"
                                )}
                            >
                                <div className="flex items-center gap-3 mb-4">
                                    {isCorrect ? (
                                        <>
                                            <Sparkles className="w-6 h-6 text-[#00FFB3]" />
                                            <span className="font-display font-black text-[#4b98ad] uppercase tracking-[0.3em] text-[13px]">Correct!</span>
                                        </>
                                    ) : (
                                        <>
                                            <XCircle className="w-6 h-6 text-[#FFB347]" />
                                            <span className="font-display font-black text-[#FFB347] uppercase tracking-[0.3em] text-[13px]">Not quite</span>
                                        </>
                                    )}
                                </div>
                                <p className="font-body text-[#E2E8F0] text-lg leading-relaxed mb-10 max-w-xl">
                                    {isCorrect ? (rawQuestion.correctFeedback || "Your logic is impeccable. You've successfully decoded this architectural pattern.") : (rawQuestion.incorrectFeedback || "A subtle misalignment in the signal. Let's recalibrate the concept and try once more.")}
                                </p>

                                {currentIdx < safeQuestions.length - 1 && (
                                    <button
                                        onClick={handleNext}
                                        className="group inline-flex items-center gap-3 px-10 py-4 rounded-full bg-white/5 hover:bg-white/10 text-white font-mono text-[13px] font-black uppercase tracking-[0.2em] transition-all border border-white/10 hover:border-white/20"
                                    >
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
