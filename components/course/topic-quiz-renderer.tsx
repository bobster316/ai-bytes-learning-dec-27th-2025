"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, ChevronRight, RefreshCw, Trophy, AlertCircle, Lightbulb, Save, Award, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import confetti from "canvas-confetti";
import Link from "next/link";
import { submitQuizAttempt, generateCertificate } from "@/app/actions/progress";
import { useRouter } from "next/navigation";

interface Question {
    id: string;
    question_text: string;
    options: string[];
    correct_answer: string;
    explanation: string;
    question_type: string;
}

interface ParsedMetadata {
    text: string;
    correct?: string;
    incorrect?: string;
    cognitive?: string;
    timer?: number;
    objective?: string;
}

interface TopicQuizRendererProps {
    quizTitle: string;
    questions: Question[];
    courseId: string;
    topicId?: string;
    quizId?: string;
    nextUrl?: string | null;
    nextLabel?: string;
}

export function TopicQuizRenderer({ quizTitle, questions, courseId, topicId, quizId, nextUrl, nextLabel }: TopicQuizRendererProps) {
    const router = useRouter();
    const [activeQuestions, setActiveQuestions] = useState<Question[]>([]);
    const [retryCount, setRetryCount] = useState(0);

    const [currentIndex, setCurrentIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [showResult, setShowResult] = useState(false);
    const [quizCompleted, setQuizCompleted] = useState(false);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [answers, setAnswers] = useState<Record<string, boolean>>({});

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isGeneratingCert, setIsGeneratingCert] = useState(false);

    const [timeLeft, setTimeLeft] = useState(0);
    const [startTime, setStartTime] = useState<number>(Date.now());

    const [attempts, setAttempts] = useState<Record<string, number>>({});
    const [showSecondChance, setShowSecondChance] = useState(false);
    const [eliminatedOptions, setEliminatedOptions] = useState<string[]>([]);

    // UI state for animations
    const [isShaking, setIsShaking] = useState(false);
    const [isSuccessGlow, setIsSuccessGlow] = useState(false);

    useEffect(() => {
        if (questions && questions.length > 0) {
            const shuffled = [...questions].sort(() => 0.5 - Math.random());
            const selected = shuffled.slice(0, 5).map(q => ({
                ...q,
                options: [...q.options].sort(() => 0.5 - Math.random())
            }));
            setActiveQuestions(selected);

            setCurrentIndex(0);
            setScore(0);
            setQuizCompleted(false);
            setShowResult(false);
            setAnswers({});
            setAttempts({});
            setSelectedOption(null);
            setStartTime(Date.now());
            setIsSubmitting(false);
            setIsGeneratingCert(false);
        }
    }, [quizId, retryCount, questions]);

    const parseExplanation = (expl: string): ParsedMetadata => {
        try {
            const parsed = JSON.parse(expl);
            if (typeof parsed === 'object' && parsed !== null) return parsed;
            return { text: expl };
        } catch {
            return { text: expl };
        }
    };

    useEffect(() => {
        if (!activeQuestions[currentIndex] || showResult || quizCompleted) return;

        const currentQ = activeQuestions[currentIndex];
        const meta = parseExplanation(currentQ.explanation);
        const limit = meta.timer || 90;

        setTimeLeft(limit);

        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    handleTimeExpired();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [currentIndex, activeQuestions, showResult, quizCompleted]);

    const handleTimeExpired = () => {
        const currentQ = activeQuestions[currentIndex];
        setAnswers(prev => ({ ...prev, [currentQ.id]: false }));
        setShowResult(true);
    };

    if (!activeQuestions || activeQuestions.length === 0) {
        return (
            <div className="min-h-screen bg-obsidian flex items-center justify-center p-4">
                <div className="w-full max-w-md p-12 text-center space-y-8 glass-premium rounded-[3rem] border border-white/10">
                    <div className="mx-auto w-24 h-24 bg-amber-500/10 rounded-full flex items-center justify-center border border-amber-500/20 shadow-[0_0_50px_rgba(245,158,11,0.2)]">
                        <AlertCircle className="w-12 h-12 text-amber-500" />
                    </div>
                    <div className="space-y-4">
                        <h2 className="text-3xl font-black text-white">Assessment Unavailable</h2>
                        <p className="text-slate-400 text-lg">
                            Neural pathways restricted. Please regenerate the module to access this assessment.
                        </p>
                    </div>
                    <Link href={`/courses/${courseId}`}>
                        <Button className="w-full bg-white/5 hover:bg-white/10text-white border border-white/10 rounded-full h-14 font-black tracking-widest uppercase transition-all">
                            Return to Hub
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    const currentQuestion = activeQuestions[currentIndex];
    const currentAttempts = attempts[currentQuestion.id] || 0;
    const metadata = parseExplanation(currentQuestion.explanation);

    const handleSelect = (option: string) => {
        if (showResult || eliminatedOptions.includes(option)) return;
        setSelectedOption(option);
    };

    const checkAnswer = () => {
        if (!selectedOption) return;

        const isCorrect = selectedOption === currentQuestion.correct_answer;
        const newAttempts = currentAttempts + 1;
        setAttempts(prev => ({ ...prev, [currentQuestion.id]: newAttempts }));

        if (isCorrect) {
            setAnswers(prev => ({ ...prev, [currentQuestion.id]: true }));
            const pointsEarned = newAttempts === 1 ? 1 : 0.5;
            setScore(prev => prev + pointsEarned);

            // Trigger success glow effect
            setIsSuccessGlow(true);
            setTimeout(() => setIsSuccessGlow(false), 2000);

            setShowResult(true);
            confetti({
                particleCount: newAttempts === 1 ? 100 : 50,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#9B8FFF', '#34d399', '#ffffff']
            });
        } else {
            // Trigger failure shake
            setIsShaking(true);
            setTimeout(() => setIsShaking(false), 500);

            if (newAttempts === 1) {
                setShowSecondChance(true);
                setEliminatedOptions([selectedOption]);
                setSelectedOption(null);
            } else {
                setAnswers(prev => ({ ...prev, [currentQuestion.id]: false }));
                setShowResult(true);
            }
        }
    };

    const nextQuestion = async () => {
        if (currentIndex < activeQuestions.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setSelectedOption(null);
            setShowResult(false);
            setShowSecondChance(false);
            setEliminatedOptions([]);
            setIsSuccessGlow(false);
        } else {
            setQuizCompleted(true);

            const finalPercentage = (score / activeQuestions.length) * 100;
            const passed = finalPercentage >= 70;
            const timeTakenSec = Math.floor((Date.now() - startTime) / 1000);

            if (passed) {
                confetti({
                    particleCount: 300,
                    spread: 120,
                    origin: { y: 0.5 },
                    colors: ['#9B8FFF', '#34d399', '#7c3aed', '#ffffff']
                });
            }

            if (topicId && quizId) {
                setIsSubmitting(true);
                try {
                    const tId = parseInt(topicId);
                    const qId = parseInt(quizId);

                    if (!isNaN(tId) && !isNaN(qId)) {
                        await submitQuizAttempt(
                            courseId,
                            tId,
                            qId,
                            finalPercentage,
                            passed,
                            answers,
                            timeTakenSec
                        );
                    }
                } catch (e) {
                    console.error("Failed to submit quiz attempt", e);
                } finally {
                    setIsSubmitting(false);
                }
            }
        }
    };

    const handleClaimCertificate = async () => {
        setIsGeneratingCert(true);
        try {
            const result = await generateCertificate(courseId);
            if (result.success && result.certificateId) {
                router.push(`/certificate/${result.certificateId}`);
            } else {
                console.error("Certificate generation failed:", result.error);
                alert("Failed to generate certificate. Please try again.");
            }
        } catch (error) {
            console.error("Error claiming certificate:", error);
            alert("An unexpected error occurred.");
        } finally {
            setIsGeneratingCert(false);
        }
    };

    // --- RENDER COMPLETED SCREEN ---
    if (quizCompleted) {
        const percentage = Math.round((score / activeQuestions.length) * 100);
        const isPerfect = percentage === 100;
        const passed = percentage >= 70;

        return (
            <div id="assessment" className="min-h-screen bg-obsidian flex items-center justify-center p-4 overflow-hidden relative">
                <div className="absolute inset-0 z-0">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-cyan-500/10 via-purple-500/5 to-transparent blur-[100px] pointer-events-none" />
                </div>

                <motion.div
                    initial={{ scale: 0.9, opacity: 0, filter: 'blur(20px)' }}
                    animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
                    transition={{ type: "spring", duration: 1 }}
                    className="relative z-10 w-full max-w-3xl"
                >
                    <div className="glass-premium p-12 md:p-20 text-center space-y-12 rounded-[4rem] border border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.8)] relative overflow-hidden">

                        {passed && (
                            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_20px_rgba(34,211,238,0.8)]" />
                        )}

                        <motion.div
                            className={`mx-auto w-40 h-40 rounded-[2.5rem] flex items-center justify-center relative ${isPerfect ? 'bg-gradient-to-br from-yellow-400 to-amber-600 shadow-[0_0_80px_rgba(251,191,36,0.5)]' :
                                    passed ? 'bg-gradient-to-br from-cyan-400 to-blue-600 shadow-[0_0_80px_rgba(34,211,238,0.5)]' :
                                        'bg-gradient-to-br from-red-500 to-rose-700 shadow-[0_0_80px_rgba(239,68,68,0.3)]'
                                }`}
                            initial={{ rotate: -20, scale: 0.5 }}
                            animate={{ rotate: 0, scale: 1 }}
                            transition={{ type: "spring", bounce: 0.5 }}
                        >
                            <Trophy className="w-20 h-20 text-white drop-shadow-xl" />
                        </motion.div>

                        <div className="space-y-6 relative z-10">
                            <h2 className="text-5xl md:text-6xl font-black tracking-tighter text-white drop-shadow-lg">
                                {isPerfect ? "Flawless Execution." : passed ? "Neural Link Verified." : "Simulation Failed."}
                            </h2>
                            <div className="text-[8rem] leading-none font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-white/30 drop-shadow-2xl">
                                {percentage}%
                            </div>
                            <p className="text-2xl text-slate-400 font-medium">{quizTitle}</p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-6 justify-center pt-8 relative z-10">
                            {!passed ? (
                                <>
                                    <Link href={`/courses/${courseId}`} className="flex-1 max-w-xs">
                                        <Button className="w-full h-16 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-full font-black tracking-widest text-lg transition-all hover:scale-105">
                                            Return to Hub
                                        </Button>
                                    </Link>
                                    <Button
                                        onClick={() => setRetryCount(prev => prev + 1)}
                                        className="flex-1 max-w-xs h-16 bg-cyan-600 hover:bg-cyan-500 text-white rounded-full font-black tracking-widest text-lg shadow-[0_0_30px_rgba(8,145,178,0.5)] hover:shadow-[0_0_50px_rgba(6,182,212,0.8)] transition-all hover:scale-105"
                                    >
                                        <RefreshCw className="mr-3 w-6 h-6" /> Re-engage
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <Link href={`/courses/${courseId}`} className="flex-1 max-w-xs">
                                        <Button className="w-full h-16 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-full font-black tracking-widest text-lg uppercase transition-all hover:scale-105">
                                            Hub
                                        </Button>
                                    </Link>
                                    <Button
                                        disabled={isGeneratingCert}
                                        className="flex-1 max-w-xs h-16 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-white rounded-full font-black tracking-widest text-lg shadow-[0_0_30px_rgba(245,158,11,0.5)] transition-all hover:scale-105 relative overflow-hidden group"
                                        onClick={handleClaimCertificate}
                                    >
                                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                                        {isGeneratingCert ? (
                                            <span className="relative z-10 flex items-center gap-3">Minting... <RefreshCw className="w-6 h-6 animate-spin" /></span>
                                        ) : (
                                            <span className="relative z-10 flex items-center gap-3"><Award className="w-6 h-6" /> Claim Reward</span>
                                        )}
                                    </Button>
                                </>
                            )}
                        </div>

                        {isSubmitting && (
                            <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
                                <span className="text-xs uppercase tracking-[0.5em] text-cyan-500 animate-pulse font-bold">Syncing to Blockchain...</span>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        );
    }

    // --- RENDER ACTIVE QUIZ ---
    const progressPercent = ((currentIndex) / activeQuestions.length) * 100;

    return (
        <div id="assessment" className="min-h-screen bg-obsidian flex flex-col items-center justify-center p-4 md:p-8 relative overflow-hidden font-sans">
            {/* Cinematic Background */}
            <div className="absolute inset-0 z-0 select-none pointer-events-none">
                <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-cyan-500/10 blur-[150px] rounded-full transition-opacity duration-1000 ${isSuccessGlow ? 'opacity-100 bg-cyan-400/30' : 'opacity-40'}`} />
                <div className={`absolute bottom-0 right-0 w-[600px] h-[600px] bg-purple-600/10 blur-[120px] rounded-full transition-opacity duration-1000 ${isShaking ? 'opacity-100 bg-red-500/20' : 'opacity-30'}`} />
            </div>

            {/* Top Navigation & Status */}
            <div className="absolute top-0 inset-x-0 z-50">
                <div className="h-1 lg:h-1.5 bg-white/5 w-full relative">
                    <motion.div
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-400 to-blue-500 shadow-[0_0_15px_rgba(34,211,238,0.8)]"
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPercent}%` }}
                        transition={{ duration: 0.8, ease: "easeInOut" }}
                    />
                </div>

                <div className="flex justify-between items-center p-6 md:px-12">
                    <span className="text-xs font-black text-slate-500 uppercase tracking-[0.4em]">
                        Node {currentIndex + 1} // {questions.length}
                    </span>

                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${timeLeft < 20 ? 'bg-red-500 animate-ping' : 'bg-cyan-500 animate-pulse'}`} />
                        <span className={`text-sm md:text-base font-mono font-bold tracking-widest ${timeLeft < 20 ? 'text-red-400' : 'text-slate-300'}`}>
                            T-{timeLeft}s
                        </span>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="w-full max-w-5xl z-10 mt-16 md:mt-24">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentQuestion.id}
                        initial={{ opacity: 0, filter: 'blur(20px)', z: -100, rotateX: 10 }}
                        animate={{ opacity: 1, filter: 'blur(0px)', z: 0, rotateX: 0, x: isShaking ? [-10, 10, -10, 10, 0] : 0 }}
                        exit={{ opacity: 0, filter: 'blur(20px)', z: 100, rotateX: -10 }}
                        transition={{ duration: 0.6 }}
                        className="space-y-12 md:space-y-16"
                    >
                        {/* The Question */}
                        <div className="text-center space-y-4">
                            <span className="text-cyan-400 font-bold text-sm uppercase tracking-[0.5em]">Primary Objective</span>
                            <h2 className="text-4xl md:text-6xl font-black text-white leading-[1.1] tracking-tight text-shadow-sm">
                                {currentQuestion.question_text}
                            </h2>
                        </div>

                        {/* Second Chance Hologram */}
                        <AnimatePresence>
                            {showSecondChance && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, height: 'auto', scale: 1 }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="overflow-hidden"
                                >
                                    <div className="flex items-center gap-4 p-6 rounded-[2rem] bg-indigo-500/10 border border-indigo-500/20 backdrop-blur-md relative">
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-indigo-500/10 to-transparent animate-[scan-horizontal_3s_linear_infinite]" />
                                        <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30 shrink-0">
                                            <Lightbulb className="w-6 h-6 text-indigo-400" />
                                        </div>
                                        <div>
                                            <p className="text-indigo-300 font-black uppercase tracking-widest text-sm mb-1">Neural Reroute</p>
                                            <p className="text-white text-lg font-medium">
                                                False pathway detected and eliminated. Re-evaluate remaining nodes.
                                            </p>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Answers Grid (Floating Core Style) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {currentQuestion.options.map((option, idx) => {
                                const isSelected = selectedOption === option;
                                const isCorrect = showResult && option === currentQuestion.correct_answer;
                                const isWrong = showResult && isSelected && !isCorrect;
                                const isEliminated = eliminatedOptions.includes(option);

                                let glassClasses = "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:border-white/20";
                                let letterBg = "bg-white/10 text-white/50";

                                if (isSelected && !showResult) {
                                    glassClasses = "bg-cyan-500/20 border-cyan-400/50 shadow-[0_0_30px_rgba(34,211,238,0.3)] text-white scale-[1.02]";
                                    letterBg = "bg-cyan-500 text-white";
                                }
                                if (isCorrect) {
                                    glassClasses = "bg-emerald-500/20 border-emerald-400 shadow-[0_0_40px_rgba(52,211,153,0.4)] text-white";
                                    letterBg = "bg-emerald-500 text-white";
                                }
                                if (isWrong) {
                                    glassClasses = "bg-red-500/20 border-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.3)] text-white";
                                    letterBg = "bg-red-500 text-white";
                                }
                                if (isEliminated) {
                                    glassClasses = "bg-black/40 border-black/50 text-slate-600 opacity-50 cursor-not-allowed grayscale";
                                    letterBg = "bg-black/50 text-slate-700";
                                }
                                if (showResult && option === currentQuestion.correct_answer && !isSelected) {
                                    glassClasses = "bg-emerald-500/10 border-emerald-500/30 text-emerald-100";
                                    letterBg = "bg-emerald-500/20 text-emerald-400";
                                }

                                return (
                                    <motion.button
                                        key={idx}
                                        disabled={showResult || isEliminated}
                                        onClick={() => handleSelect(option)}
                                        className={`w-full p-6 lg:p-8 rounded-[2rem] border backdrop-blur-xl transition-all duration-300 text-left flex items-start gap-6 font-medium group relative overflow-hidden ${glassClasses}`}
                                        whileHover={!showResult && !isEliminated ? { scale: 1.02, y: -4 } : {}}
                                        whileTap={!showResult && !isEliminated ? { scale: 0.98 } : {}}
                                    >
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 font-bold transition-colors ${letterBg}`}>
                                            {String.fromCharCode(65 + idx)}
                                        </div>
                                        <span className={`text-xl md:text-2xl mt-1 leading-snug transition-colors ${isEliminated ? 'line-through' : ''}`}>
                                            {option}
                                        </span>

                                        {/* Status Icons */}
                                        <div className="ml-auto mt-2">
                                            {isCorrect && <Check className="w-8 h-8 text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.8)]" />}
                                            {isWrong && <X className="w-8 h-8 text-red-400 drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]" />}
                                        </div>

                                        {/* Subtle hover gradient */}
                                        {!showResult && !isEliminated && !isSelected && (
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
                                        )}
                                    </motion.button>
                                );
                            })}
                        </div>

                        {/* Explanation Overlay */}
                        <AnimatePresence>
                            {showResult && (
                                <motion.div
                                    initial={{ opacity: 0, y: 40, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    className={`p-10 rounded-[3rem] backdrop-blur-2xl border ${answers[currentQuestion.id]
                                            ? 'bg-emerald-500/10 border-emerald-500/30 shadow-[0_0_50px_rgba(16,185,129,0.1)]'
                                            : 'bg-red-500/10 border-red-500/30 shadow-[0_0_50px_rgba(239,68,68,0.1)]'
                                        }`}
                                >
                                    <div className="flex items-start gap-6">
                                        <div className={`w-16 h-16 rounded-[2rem] flex items-center justify-center shrink-0 border ${answers[currentQuestion.id]
                                                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                                                : 'bg-red-500/20 border-red-500/50 text-red-500'
                                            }`}>
                                            {answers[currentQuestion.id] ? <Check className="w-8 h-8" /> : <X className="w-8 h-8" />}
                                        </div>
                                        <div className="space-y-4 pt-1">
                                            <h4 className="font-black text-2xl text-white tracking-widest uppercase">
                                                {answers[currentQuestion.id] ? 'Verification Success' : 'Verification Failed'}
                                            </h4>
                                            <p className="text-xl md:text-2xl text-slate-300 leading-relaxed font-medium">
                                                {metadata.text}
                                            </p>

                                            {answers[currentQuestion.id] && metadata.correct && (
                                                <p className="text-lg text-emerald-400 italic font-medium">{metadata.correct}</p>
                                            )}
                                            {!answers[currentQuestion.id] && metadata.incorrect && (
                                                <p className="text-lg text-red-400 italic font-medium">{metadata.incorrect}</p>
                                            )}

                                            {!answers[currentQuestion.id] && (
                                                <div className="mt-6 inline-flex items-center gap-3 bg-white/10 px-6 py-3 rounded-full border border-white/20">
                                                    <span className="text-slate-400 font-bold uppercase text-sm tracking-widest">Correct Node:</span>
                                                    <span className="text-white font-bold text-lg">{currentQuestion.correct_answer}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Action Buttons */}
                        <div className="flex justify-end pt-8">
                            {!showResult ? (
                                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                    <Button
                                        size="lg"
                                        onClick={checkAnswer}
                                        disabled={!selectedOption}
                                        className="bg-white text-black hover:bg-slate-200 rounded-full px-12 h-16 text-xl font-black tracking-widest uppercase disabled:opacity-20 shadow-[0_0_40px_rgba(255,255,255,0.2)]"
                                    >
                                        {showSecondChance ? "Re-submit" : "Verify Path"}
                                    </Button>
                                </motion.div>
                            ) : (
                                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                    <Button
                                        size="lg"
                                        onClick={nextQuestion}
                                        className="bg-cyan-500 hover:bg-cyan-400 text-black rounded-full px-12 h-16 text-xl font-black tracking-widest uppercase shadow-[0_0_40px_rgba(6,182,212,0.5)] group"
                                    >
                                        {currentIndex < activeQuestions.length - 1 ? (
                                            <span className="flex items-center gap-3">Proceed <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" /></span>
                                        ) : (
                                            <span className="flex items-center gap-3">Finalize <Trophy className="w-6 h-6" /></span>
                                        )}
                                    </Button>
                                </motion.div>
                            )}
                        </div>

                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}

export default TopicQuizRenderer;
