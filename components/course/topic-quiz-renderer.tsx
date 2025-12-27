"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, ChevronRight, RefreshCw, Trophy, AlertCircle, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import confetti from "canvas-confetti";
import Link from "next/link";

interface Question {
    id: string;
    question_text: string;
    options: string[];
    correct_answer: string;
    explanation: string;
    question_type: string;
}

interface TopicQuizRendererProps {
    quizTitle: string;
    questions: Question[];
    courseId: string;
}

export function TopicQuizRenderer({ quizTitle, questions, courseId }: TopicQuizRendererProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [showResult, setShowResult] = useState(false);
    const [quizCompleted, setQuizCompleted] = useState(false);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [answers, setAnswers] = useState<Record<string, boolean>>({});

    // Track attempts per question for second-chance feature
    const [attempts, setAttempts] = useState<Record<string, number>>({});
    const [showSecondChance, setShowSecondChance] = useState(false);
    const [eliminatedOptions, setEliminatedOptions] = useState<string[]>([]);

    if (!questions || questions.length === 0) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <Card className="w-full max-w-md p-8 text-center space-y-6 shadow-lg">
                    <div className="mx-auto w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center">
                        <AlertCircle className="w-10 h-10 text-amber-500" />
                    </div>
                    <div className="space-y-3">
                        <h2 className="text-2xl font-bold text-slate-900">Assessment Unavailable</h2>
                        <p className="text-slate-500">
                            No questions were generated for this assessment. Please try regenerating the course.
                        </p>
                    </div>
                    <Link href={`/courses/${courseId}`}>
                        <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold">
                            Return to Course
                        </Button>
                    </Link>
                </Card>
            </div>
        );
    }

    const currentQuestion = questions[currentIndex];
    const currentAttempts = attempts[currentQuestion.id] || 0;

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
            // First attempt correct = full point, second attempt = half point
            const pointsEarned = newAttempts === 1 ? 1 : 0.5;
            setScore(prev => prev + pointsEarned);
            setShowResult(true);
            confetti({
                particleCount: newAttempts === 1 ? 50 : 25,
                spread: 60,
                origin: { y: 0.7 },
                colors: ['#22c55e', '#10b981', '#ffffff']
            });
        } else {
            // First attempt wrong - offer second chance
            if (newAttempts === 1) {
                setShowSecondChance(true);
                setEliminatedOptions([selectedOption]);
                setSelectedOption(null);
            } else {
                // Second attempt also wrong - show correct answer
                setAnswers(prev => ({ ...prev, [currentQuestion.id]: false }));
                setShowResult(true);
            }
        }
    };

    const nextQuestion = () => {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setSelectedOption(null);
            setShowResult(false);
            setShowSecondChance(false);
            setEliminatedOptions([]);
        } else {
            setQuizCompleted(true);
            const finalPercentage = (score / questions.length) * 100;
            if (finalPercentage >= 70) {
                confetti({
                    particleCount: 200,
                    spread: 90,
                    origin: { y: 0.5 }
                });
            }
        }
    };

    // Quiz Completed Screen
    if (quizCompleted) {
        const percentage = Math.round((score / questions.length) * 100);
        const isPerfect = percentage === 100;
        const passed = percentage >= 70;

        return (
            <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center p-4">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", duration: 0.6 }}
                >
                    <Card className="w-full max-w-2xl p-12 text-center space-y-8 shadow-2xl border-0">
                        <motion.div
                            className={`mx-auto w-32 h-32 rounded-full flex items-center justify-center ${isPerfect ? 'bg-gradient-to-br from-yellow-300 to-amber-400' :
                                passed ? 'bg-gradient-to-br from-green-300 to-emerald-400' :
                                    'bg-gradient-to-br from-orange-300 to-red-400'
                                }`}
                            initial={{ rotate: -10 }}
                            animate={{ rotate: 0 }}
                        >
                            <Trophy className="w-16 h-16 text-white drop-shadow-md" />
                        </motion.div>

                        <div className="space-y-4">
                            <h2 className="text-4xl font-black tracking-tight text-slate-900">
                                {isPerfect ? "🎉 Perfect Score!" : passed ? "Well Done!" : "Keep Learning!"}
                            </h2>
                            <div className="text-7xl font-black text-blue-600">
                                {percentage}%
                            </div>
                            <p className="text-xl text-slate-500">{quizTitle}</p>
                            {!passed && (
                                <p className="text-slate-400 max-w-md mx-auto">
                                    Review the lessons and try again. You need 70% to pass.
                                </p>
                            )}
                        </div>

                        <div className="flex gap-4 justify-center pt-4">
                            <Link href={`/courses/${courseId}`}>
                                <Button size="lg" variant="outline" className="h-14 px-8 text-lg rounded-full">
                                    Back to Course
                                </Button>
                            </Link>
                            {!isPerfect && (
                                <Button
                                    onClick={() => window.location.reload()}
                                    size="lg"
                                    className="bg-blue-600 hover:bg-blue-700 text-white h-14 px-8 text-lg rounded-full shadow-lg"
                                >
                                    <RefreshCw className="mr-2 w-5 h-5" /> Retry Quiz
                                </Button>
                            )}
                        </div>
                    </Card>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {/* Progress Bar */}
            <div className="h-2 bg-slate-200 w-full fixed top-0 left-0 z-50">
                <motion.div
                    className="h-full bg-blue-600"
                    initial={{ width: 0 }}
                    animate={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                />
            </div>

            <div className="flex-1 flex items-center justify-center p-4 md:p-8 pt-16">
                <div className="w-full max-w-3xl space-y-8">
                    {/* Header */}
                    <div className="flex justify-between items-center">
                        <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                            Question {currentIndex + 1} of {questions.length}
                        </span>
                        <span className="text-sm font-bold text-blue-600 uppercase tracking-widest">
                            {quizTitle}
                        </span>
                    </div>

                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentQuestion.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                            className="space-y-8"
                        >
                            {/* Question */}
                            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 leading-tight">
                                {currentQuestion.question_text}
                            </h2>

                            {/* Second Chance Hint */}
                            {showSecondChance && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200"
                                >
                                    <Lightbulb className="w-6 h-6 text-amber-500 flex-shrink-0" />
                                    <div>
                                        <p className="text-amber-800 font-semibold">Second Chance!</p>
                                        <p className="text-amber-600 text-sm">
                                            That wasn't quite right. The wrong answer has been eliminated. Try again!
                                        </p>
                                    </div>
                                </motion.div>
                            )}

                            {/* Options */}
                            <div className="grid gap-4">
                                {currentQuestion.options.map((option, idx) => {
                                    const isSelected = selectedOption === option;
                                    const isCorrect = showResult && option === currentQuestion.correct_answer;
                                    const isWrong = showResult && isSelected && !isCorrect;
                                    const isEliminated = eliminatedOptions.includes(option);

                                    let buttonClass = "bg-white border-2 border-slate-200 hover:border-blue-400 hover:bg-blue-50 text-slate-800";
                                    if (isSelected && !showResult) buttonClass = "bg-blue-100 border-4 border-blue-600 text-blue-900 ring-4 ring-blue-200 shadow-lg font-semibold";
                                    if (isCorrect) buttonClass = "bg-green-100 border-4 border-green-600 text-green-900 ring-4 ring-green-200";
                                    if (isWrong) buttonClass = "bg-red-100 border-4 border-red-500 text-red-900 ring-4 ring-red-200";
                                    if (isEliminated) buttonClass = "bg-red-50 border-red-200 text-slate-400 line-through opacity-60 cursor-not-allowed";
                                    if (showResult && option === currentQuestion.correct_answer && !isSelected) {
                                        buttonClass = "bg-green-100 border-4 border-green-600 text-green-900 ring-4 ring-green-200";
                                    }

                                    return (
                                        <motion.button
                                            key={idx}
                                            disabled={showResult || isEliminated}
                                            onClick={() => handleSelect(option)}
                                            className={`w-full p-6 text-left rounded-xl transition-all duration-200 text-lg font-medium flex justify-between items-center shadow-sm ${buttonClass}`}
                                            whileHover={!showResult && !isEliminated ? { scale: 1.01 } : {}}
                                            whileTap={!showResult && !isEliminated ? { scale: 0.99 } : {}}
                                        >
                                            <span className="flex items-center gap-4">
                                                <span className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-600">
                                                    {String.fromCharCode(65 + idx)}
                                                </span>
                                                {option}
                                            </span>
                                            {isCorrect && <Check className="w-7 h-7 text-green-600" />}
                                            {isWrong && <X className="w-7 h-7 text-red-600" />}
                                            {isEliminated && <X className="w-6 h-6 text-red-400" />}
                                        </motion.button>
                                    );
                                })}
                            </div>
                        </motion.div>
                    </AnimatePresence>

                    {/* Explanation Card */}
                    <AnimatePresence>
                        {showResult && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className={`p-6 rounded-xl ${answers[currentQuestion.id]
                                    ? 'bg-green-50 border border-green-200 text-green-900'
                                    : 'bg-red-50 border border-red-200 text-red-900'
                                    }`}
                            >
                                <h4 className="font-bold mb-2 flex items-center gap-2 text-lg">
                                    {answers[currentQuestion.id] ? (
                                        <><Check className="w-6 h-6 text-green-600" /> Correct!</>
                                    ) : (
                                        <><X className="w-6 h-6 text-red-600" /> Incorrect</>
                                    )}
                                </h4>
                                <p className="text-lg opacity-90">{currentQuestion.explanation}</p>
                                {!answers[currentQuestion.id] && (
                                    <p className="mt-3 text-green-700 font-medium bg-green-100 p-3 rounded-lg">
                                        ✓ Correct answer: {currentQuestion.correct_answer}
                                    </p>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Action Buttons */}
                    <div className="flex justify-end pt-4">
                        {!showResult ? (
                            <Button
                                size="lg"
                                onClick={checkAnswer}
                                disabled={!selectedOption}
                                className="bg-slate-900 hover:bg-slate-800 text-white rounded-full px-10 h-14 text-lg font-bold disabled:opacity-40"
                            >
                                {showSecondChance ? "Try Again" : "Check Answer"}
                            </Button>
                        ) : (
                            <Button
                                size="lg"
                                onClick={nextQuestion}
                                className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-10 h-14 text-lg font-bold shadow-lg"
                            >
                                {currentIndex < questions.length - 1 ? (
                                    <>Continue <ChevronRight className="ml-2 w-6 h-6" /></>
                                ) : (
                                    <>Finish Quiz <Trophy className="ml-2 w-6 h-6" /></>
                                )}
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
