"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, ArrowRight, RotateCcw, HelpCircle, ChevronRight, Trophy, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import confetti from "canvas-confetti";
import { ContextUpdater } from "@/components/voice/ContextUpdater";
import { useRouter } from "next/navigation";

interface Question {
    id: string;
    question_text: string;
    options: {
        id: string;
        text: string;
        is_correct: boolean;
        explanation?: string;
    }[];
}

interface QuizRendererProps {
    courseId: string;
    courseTitle: string;
    quizId: string;
    quizTitle: string;
    questions: Question[];
    passingScore?: number;
    onComplete?: (score: number, passed: boolean) => void;
}

export function QuizRenderer({
    courseId,
    courseTitle,
    quizId,
    quizTitle,
    questions,
    passingScore = 70,
    onComplete
}: QuizRendererProps) {
    const router = useRouter();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [isAnswered, setIsAnswered] = useState(false);
    const [score, setScore] = useState(0);
    const [showResults, setShowResults] = useState(false);

    // New state for second chace logic
    const [attempts, setAttempts] = useState(0);
    const [feedbackMessage, setFeedbackMessage] = useState("");
    const [showFeedback, setShowFeedback] = useState(false);

    if (!questions || questions.length === 0) {
        return (
            <div className="text-center py-20">
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">No questions found for this quiz.</h3>
                <Button className="mt-4" onClick={() => router.back()}>Go Back</Button>
            </div>
        );
    }

    const currentQuestion = questions[currentIndex];
    const progress = ((currentIndex + (showResults ? 1 : 0)) / questions.length) * 100;

    // Confetti on pass
    useEffect(() => {
        if (showResults) {
            const finalScore = (score / questions.length) * 100;
            if (finalScore >= passingScore) {
                confetti({
                    particleCount: 150,
                    spread: 70,
                    origin: { y: 0.6 },
                    colors: ['#0bf', '#0f0', '#f0f']
                });
            }
        }
    }, [showResults, score, questions.length, passingScore]);

    // Handle Option Selection
    const handleSelect = (optionId: string) => {
        if (isAnswered) return;
        setSelectedOption(optionId);
        // Hide feedback when user changes selection to try again
        if (attempts > 0 && !isAnswered) {
            setShowFeedback(false);
        }
    };

    // Submit Answer
    const handleSubmit = () => {
        if (!selectedOption || isAnswered) return;

        const isCorrect = currentQuestion.options.find(o => o.id === selectedOption)?.is_correct || false;

        if (isCorrect) {
            // Correct on any attempt
            setIsAnswered(true);
            setScore(prev => prev + 1); // Full point for now, could adjust for 2nd try
            setFeedbackMessage("Correct!");
            setShowFeedback(true);
        } else {
            // Wrong answer
            if (attempts === 0) {
                // First attempt failed - give second chance
                setAttempts(1);
                setFeedbackMessage("Good try! Not quite. Give it one more shot.");
                setShowFeedback(true);
                // Do NOT mark as answered yet, allow re-selection
            } else {
                // Second attempt failed - finalize
                setIsAnswered(true);
                setFeedbackMessage("Incorrect.");
                setShowFeedback(true);
            }
        }
    };

    // Next Question
    const handleNext = () => {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setSelectedOption(null);
            setIsAnswered(false);
            setAttempts(0);
            setShowFeedback(false);
            setFeedbackMessage("");
        } else {
            setShowResults(true);
            const finalScore = (score / questions.length) * 100;
            if (onComplete) onComplete(finalScore, finalScore >= passingScore);
        }
    };

    // AI Context
    const aiContext = !showResults ? {
        courseId,
        courseTitle,
        quizId,
        currentQuizQuestion: {
            questionNumber: currentIndex + 1,
            questionText: currentQuestion.question_text,
            options: currentQuestion.options.map(o => o.text)
        }
    } : {
        courseId,
        courseTitle,
        quizId,
        currentQuizQuestion: undefined
    };

    if (showResults) {
        const finalScore = Math.round((score / questions.length) * 100);
        const passed = finalScore >= passingScore;

        return (
            <div className="max-w-2xl mx-auto py-12 px-4">
                <ContextUpdater context={aiContext} />
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center space-y-8"
                >
                    <div className="relative inline-block">
                        <div className={`w-32 h-32 rounded-full flex items-center justify-center mx-auto text-4xl border-4 ${passed ? 'border-green-500 bg-green-50 text-green-600' : 'border-red-500 bg-red-50 text-red-600'}`}>
                            {passed ? <Trophy className="w-12 h-12" /> : <XCircle className="w-12 h-12" />}
                        </div>
                        <Badge className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-4 py-1 text-sm font-bold shadow-lg">
                            {passed ? 'PASSED' : 'TRY AGAIN'}
                        </Badge>
                    </div>

                    <div className="space-y-2">
                        <h2 className="text-3xl font-bold tracking-tight">
                            {passed ? "Quiz Completed!" : "Keep Learning!"}
                        </h2>
                        <p className="text-muted-foreground text-lg">
                            You scored <span className={`font-bold ${passed ? 'text-green-600' : 'text-red-600'}`}>{finalScore}%</span>
                        </p>
                        <p className="text-sm text-gray-500">
                            Passing Score: {passingScore}%
                        </p>
                    </div>

                    <div className="flex gap-4 justify-center pt-8">
                        <Button variant="outline" size="lg" onClick={() => window.location.reload()}>
                            <RotateCcw className="w-4 h-4 mr-2" />
                            Retry Quiz
                        </Button>
                        <Button size="lg" onClick={() => router.push(`/courses/${courseId}`)}>
                            Continue Course
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto py-8 px-4">
            <ContextUpdater context={aiContext} />

            {/* Header */}
            <div className="mb-8 space-y-4">
                <div className="flex justify-between items-end">
                    <div>
                        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">
                            {quizTitle}
                        </h2>
                        <div className="flex items-center gap-2">
                            <span className="text-2xl font-bold">Question {currentIndex + 1}</span>
                            <span className="text-gray-400 text-lg">/ {questions.length}</span>
                        </div>
                    </div>
                    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">
                        <HelpCircle className="w-4 h-4 mr-2" />
                        Ask AI for a Hint
                    </Button>
                </div>
                {/* Progress Bar */}
                <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <motion.div
                        className="h-full bg-primary"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.5 }}
                    />
                </div>
            </div>

            {/* Question Card */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentIndex}
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -20, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <Card className="p-6 md:p-8 shadow-lg border-t-4 border-t-primary">
                        <h1 className="text-xl md:text-2xl font-semibold leading-relaxed mb-8">
                            {currentQuestion.question_text}
                        </h1>

                        <div className="space-y-3">
                            {currentQuestion.options.map((option) => {
                                const isSelected = selectedOption === option.id;
                                const isCorrect = option.is_correct;
                                const showCorrectness = isAnswered;

                                let borderClass = "border-gray-200 hover:border-primary/50";
                                let bgClass = "bg-white hover:bg-slate-50";
                                let icon = null;

                                if (showCorrectness) {
                                    if (isCorrect) {
                                        borderClass = "border-green-500 bg-green-50/50";
                                        icon = <CheckCircle2 className="w-5 h-5 text-green-600" />;
                                    } else if (isSelected && !isCorrect) {
                                        borderClass = "border-red-500 bg-red-50/50";
                                        icon = <XCircle className="w-5 h-5 text-red-600" />;
                                    } else {
                                        borderClass = "opacity-50";
                                    }
                                } else if (isSelected) {
                                    borderClass = "border-primary bg-primary/5 shadow-md ring-1 ring-primary";
                                }

                                return (
                                    <motion.button
                                        key={option.id}
                                        onClick={() => handleSelect(option.id)}
                                        whileHover={!isAnswered ? { scale: 1.01 } : {}}
                                        whileTap={!isAnswered ? { scale: 0.99 } : {}}
                                        disabled={isAnswered}
                                        className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center justify-between group ${borderClass} ${bgClass}`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-bold transition-colors
                                                ${isSelected && !showCorrectness ? 'border-primary text-primary' : 'border-gray-300 text-gray-400'}
                                                ${showCorrectness && isCorrect ? 'border-green-500 bg-green-500 text-white' : ''}
                                                ${showCorrectness && isSelected && !isCorrect ? 'border-red-500 bg-red-500 text-white' : ''}
                                            `}>
                                                {String.fromCharCode(65 + currentQuestion.options.indexOf(option))}
                                            </div>
                                            <span className={`font-medium ${showCorrectness && isSelected && !isCorrect ? 'text-red-700' : 'text-gray-700'}`}>
                                                {option.text}
                                            </span>
                                        </div>
                                        {icon}
                                    </motion.button>
                                );
                            })}
                        </div>
                    </Card>

                    {/* Explanation / Footer */}
                    <div className="mt-8 flex justify-between items-center min-h-[4rem]">
                        <div className="flex-1 mr-4">
                            <AnimatePresence>
                                {showFeedback && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className={`p-4 rounded-lg text-sm border flex items-start gap-3 ${isAnswered
                                            ? (currentQuestion.options.find(o => o.id === selectedOption)?.is_correct
                                                ? 'bg-green-50 border-green-200 text-green-800'
                                                : 'bg-red-50 border-red-200 text-red-800')
                                            : 'bg-blue-50 border-blue-200 text-blue-800'
                                            }`}
                                    >
                                        {isAnswered ? (
                                            currentQuestion.options.find(o => o.id === selectedOption)?.is_correct ?
                                                <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" /> :
                                                <XCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                        ) : (
                                            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                        )}

                                        <div>
                                            <span className="font-bold block mb-1">
                                                {feedbackMessage}
                                            </span>
                                            {isAnswered && (
                                                <p className="opacity-90 mt-1 not-italic">
                                                    {(() => {
                                                        const rawExp = currentQuestion.options.find(o => o.is_correct)?.explanation || "No explanation available.";
                                                        try {
                                                            const parsed = JSON.parse(rawExp);
                                                            return parsed.correct || parsed.text || parsed.explanation || rawExp;
                                                        } catch (e) {
                                                            return rawExp;
                                                        }
                                                    })()}
                                                </p>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <div>
                            {!isAnswered ? (
                                <Button
                                    size="lg"
                                    onClick={handleSubmit}
                                    disabled={!selectedOption}
                                    className="font-bold px-8 rounded-full shadow-lg shadow-primary/20"
                                >
                                    {attempts === 0 ? "Check Answer" : "Try Again"}
                                </Button>
                            ) : (
                                <Button size="lg" onClick={handleNext} className="font-bold rounded-full px-8">
                                    {currentIndex === questions.length - 1 ? 'Finish Quiz' : 'Next Question'}
                                    <ChevronRight className="w-5 h-5 ml-2" />
                                </Button>
                            )}
                        </div>
                    </div>
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
