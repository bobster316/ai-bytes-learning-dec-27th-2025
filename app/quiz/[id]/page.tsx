"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Award,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";

// Mock quiz data (5 questions per topic as per PRD)
const quizData = {
  id: 1,
  title: "Introduction to Modern Smartphones - Quiz",
  topicTitle: "Introduction to Modern Smartphones",
  passingScore: 70,
  questions: [
    {
      id: 1,
      question: "What is the primary function of an AI chip in a smartphone?",
      options: [
        "To make phone calls",
        "To process AI-related tasks efficiently",
        "To charge the battery",
        "To connect to WiFi",
      ],
      correctAnswer: 1,
      explanation:
        "The AI chip (also called Neural Processing Unit or NPU) is specifically designed to handle AI computations efficiently, enabling features like facial recognition, voice processing, and image enhancement.",
    },
    {
      id: 2,
      question: "Which of the following is NOT an AI-powered smartphone feature?",
      options: [
        "Facial recognition",
        "Predictive text",
        "Physical buttons",
        "Voice assistants",
      ],
      correctAnswer: 2,
      explanation:
        "Physical buttons are hardware components and don't use AI. The other options all rely on artificial intelligence to function.",
    },
    {
      id: 3,
      question: "How do smartphones protect your privacy whilst using AI?",
      options: [
        "By sending all data to the cloud",
        "By turning off AI completely",
        "By processing data locally on-device",
        "By requiring internet connection always",
      ],
      correctAnswer: 2,
      explanation:
        "Modern smartphones increasingly process AI tasks locally on the device itself, reducing the need to send personal data to external servers and improving privacy.",
    },
    {
      id: 4,
      question: "What year did the first smartphone with AI capabilities launch?",
      options: ["2007", "2010", "2017", "2020"],
      correctAnswer: 2,
      explanation:
        "The first smartphones with dedicated AI chips (like Apple's A11 Bionic and Huawei's Kirin 970) were released in 2017, marking a significant milestone in mobile AI.",
    },
    {
      id: 5,
      question:
        "Which AI technology allows your phone to understand spoken commands?",
      options: [
        "Computer Vision",
        "Natural Language Processing",
        "Machine Learning",
        "Deep Learning",
      ],
      correctAnswer: 1,
      explanation:
        "Natural Language Processing (NLP) enables devices to understand, interpret, and respond to human speech, powering voice assistants like Siri and Google Assistant.",
    },
  ],
};

export default function QuizPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);

  const handleSelectAnswer = (answerIndex: number) => {
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestion] = answerIndex;
    setSelectedAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQuestion < quizData.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setShowResults(true);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const calculateScore = () => {
    let correct = 0;
    quizData.questions.forEach((question, index) => {
      if (selectedAnswers[index] === question.correctAnswer) {
        correct++;
      }
    });
    return (correct / quizData.questions.length) * 100;
  };

  const score = calculateScore();
  const passed = score >= quizData.passingScore;

  if (showResults) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0A1628] via-[#1E3A5F] to-[#0F172A]">
        <Header />

        <section className="py-20">
          <div className="container mx-auto px-4 max-w-3xl">
            <Card>
              <CardContent className="p-12 text-center space-y-6">
                {passed ? (
                  <>
                    <div className="w-20 h-20 rounded-full bg-[#10B981]/20 mx-auto flex items-center justify-center">
                      <Award className="w-10 h-10 text-[#10B981]" />
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold mb-2">
                        Congratulations! 🎉
                      </h1>
                      <p className="text-white/60">You passed the quiz!</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-20 h-20 rounded-full bg-[#F59E0B]/20 mx-auto flex items-center justify-center">
                      <XCircle className="w-10 h-10 text-[#F59E0B]" />
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold mb-2">
                        Not Quite There
                      </h1>
                      <p className="text-white/60">Keep practising!</p>
                    </div>
                  </>
                )}

                <div className="grid grid-cols-2 gap-6 py-6">
                  <div className="space-y-2">
                    <p className="text-sm text-white/60">Your Score</p>
                    <p className="text-4xl font-bold text-[#00BFA5]">
                      {score.toFixed(0)}%
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-white/60">Passing Score</p>
                    <p className="text-4xl font-bold text-white/40">
                      {quizData.passingScore}%
                    </p>
                  </div>
                </div>

                <div className="space-y-3 border-t border-white/10 pt-6">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/60">Correct Answers</span>
                    <span className="font-semibold">
                      {selectedAnswers.filter(
                        (answer, index) =>
                          answer === quizData.questions[index].correctAnswer
                      ).length}{" "}
                      / {quizData.questions.length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/60">Time Taken</span>
                    <span className="font-semibold">{timeElapsed} minutes</span>
                  </div>
                </div>

                {/* Review Answers */}
                <div className="space-y-4 pt-6">
                  <h3 className="font-semibold text-lg">Review Answers</h3>
                  {quizData.questions.map((question, index) => {
                    const isCorrect =
                      selectedAnswers[index] === question.correctAnswer;
                    return (
                      <Card key={question.id} className="text-left">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3 mb-3">
                            {isCorrect ? (
                              <CheckCircle2 className="w-5 h-5 text-[#10B981] flex-shrink-0 mt-0.5" />
                            ) : (
                              <XCircle className="w-5 h-5 text-[#EF4444] flex-shrink-0 mt-0.5" />
                            )}
                            <div className="flex-1">
                              <p className="font-medium mb-2">
                                {index + 1}. {question.question}
                              </p>
                              <p className="text-sm text-white/60">
                                Your answer: {question.options[selectedAnswers[index]]}
                              </p>
                              {!isCorrect && (
                                <p className="text-sm text-[#10B981] mt-1">
                                  Correct: {question.options[question.correctAnswer]}
                                </p>
                              )}
                              <p className="text-sm text-white/70 mt-2 italic">
                                {question.explanation}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                <div className="flex gap-4 pt-6">
                  {!passed && (
                    <Button
                      className="flex-1"
                      onClick={() => {
                        setShowResults(false);
                        setCurrentQuestion(0);
                        setSelectedAnswers([]);
                      }}
                    >
                      Retake Quiz
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => router.push("/courses")}
                  >
                    {passed ? "Continue Learning" : "Back to Courses"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    );
  }

  const question = quizData.questions[currentQuestion];
  const progress = ((currentQuestion + 1) / quizData.questions.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0A1628] via-[#1E3A5F] to-[#0F172A]">
      <Header />

      <section className="py-12">
        <div className="container mx-auto px-4 max-w-3xl">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <Badge variant="secondary">Quiz</Badge>
                <h1 className="text-2xl font-bold mt-2">{quizData.topicTitle}</h1>
              </div>
              <div className="flex items-center gap-2 text-sm text-white/60">
                <Clock className="w-5 h-5" />
                <span>{timeElapsed} min</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/60">Progress</span>
                <span className="font-semibold">
                  {currentQuestion + 1} / {quizData.questions.length}
                </span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#00BFA5] to-[#2563EB] transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>

          {/* Question Card */}
          <Card>
            <CardContent className="p-8 space-y-6">
              <div>
                <p className="text-sm text-white/60 mb-4">
                  Question {currentQuestion + 1} of {quizData.questions.length}
                </p>
                <h2 className="text-2xl font-semibold leading-relaxed">
                  {question.question}
                </h2>
              </div>

              <div className="space-y-3">
                {question.options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleSelectAnswer(index)}
                    className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                      selectedAnswers[currentQuestion] === index
                        ? "border-[#00BFA5] bg-[#00BFA5]/10"
                        : "border-white/10 hover:border-white/20 hover:bg-white/5"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          selectedAnswers[currentQuestion] === index
                            ? "border-[#00BFA5] bg-[#00BFA5]"
                            : "border-white/30"
                        }`}
                      >
                        {selectedAnswers[currentQuestion] === index && (
                          <CheckCircle2 className="w-4 h-4 text-white" />
                        )}
                      </div>
                      <span>{option}</span>
                    </div>
                  </button>
                ))}
              </div>

              <div className="flex gap-4 pt-6 border-t border-white/10">
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={currentQuestion === 0}
                  className="flex-1"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Previous
                </Button>
                <Button
                  onClick={handleNext}
                  disabled={selectedAnswers[currentQuestion] === undefined}
                  className="flex-1"
                >
                  {currentQuestion === quizData.questions.length - 1
                    ? "Submit Quiz"
                    : "Next"}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
