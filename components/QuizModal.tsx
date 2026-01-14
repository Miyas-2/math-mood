"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { X, CheckCircle, XCircle, ArrowRight, Trophy, RotateCcw } from "lucide-react";

interface Question {
    id: number;
    question: string;
    options: string[];
    explanation?: string;
}

interface QuizModalProps {
    isOpen: boolean;
    onClose: () => void;
    questions: Question[];
    moduleName: string;
    onComplete: (result: QuizResult) => void;
}

export interface QuizResult {
    score: number;
    totalQuestions: number;
    passed: boolean;
    wrongQuestionIds: number[];
}

export function QuizModal({ isOpen, onClose, questions, moduleName, onComplete }: QuizModalProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [showResult, setShowResult] = useState(false);
    const [answers, setAnswers] = useState<Map<number, { selected: number; correct: boolean }>>(new Map());
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [quizCompleted, setQuizCompleted] = useState(false);

    const currentQuestion = questions[currentIndex];
    const totalQuestions = questions.length;
    const isLastQuestion = currentIndex === totalQuestions - 1;

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setCurrentIndex(0);
            setSelectedAnswer(null);
            setShowResult(false);
            setAnswers(new Map());
            setQuizCompleted(false);
        }
    }, [isOpen]);

    const handleSubmitAnswer = async () => {
        if (selectedAnswer === null || !currentQuestion) return;

        setIsSubmitting(true);

        try {
            // Check answer via API
            const response = await fetch('/api/evaluate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'checkAnswer',
                    questionId: currentQuestion.id,
                    selectedAnswer
                })
            });

            const data = await response.json();
            const isCorrect = data.isCorrect ?? false;

            setAnswers(prev => new Map(prev).set(currentQuestion.id, {
                selected: selectedAnswer,
                correct: isCorrect
            }));
            setShowResult(true);
        } catch {
            // Fallback - mark as incorrect
            setAnswers(prev => new Map(prev).set(currentQuestion.id, {
                selected: selectedAnswer,
                correct: false
            }));
            setShowResult(true);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleNext = () => {
        if (isLastQuestion) {
            // Calculate final result
            const correctCount = Array.from(answers.values()).filter(a => a.correct).length;
            const wrongIds = Array.from(answers.entries())
                .filter(([_, a]) => !a.correct)
                .map(([id]) => id);

            const result: QuizResult = {
                score: correctCount,
                totalQuestions,
                passed: correctCount >= Math.ceil(totalQuestions * 0.6), // 60% to pass
                wrongQuestionIds: wrongIds
            };

            setQuizCompleted(true);
            onComplete(result);
        } else {
            setCurrentIndex(prev => prev + 1);
            setSelectedAnswer(null);
            setShowResult(false);
        }
    };

    const currentAnswer = currentQuestion ? answers.get(currentQuestion.id) : undefined;

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <Card className="relative z-10 w-full max-w-lg mx-4 max-h-[90vh] overflow-hidden">
                <CardHeader className="pb-3 border-b">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">
                            {quizCompleted ? 'Hasil Quiz' : `Quiz: ${moduleName}`}
                        </CardTitle>
                        <Button variant="ghost" size="icon" onClick={onClose}>
                            <X className="w-5 h-5" />
                        </Button>
                    </div>
                    {!quizCompleted && (
                        <div className="flex items-center gap-2 mt-2">
                            {Array.from({ length: totalQuestions }).map((_, i) => (
                                <div
                                    key={i}
                                    className={cn(
                                        "h-2 flex-1 rounded-full transition-all",
                                        i < currentIndex && "bg-primary",
                                        i === currentIndex && "bg-primary/50",
                                        i > currentIndex && "bg-muted"
                                    )}
                                />
                            ))}
                        </div>
                    )}
                </CardHeader>

                <CardContent className="py-6">
                    {quizCompleted ? (
                        <QuizResultView answers={answers} questions={questions} />
                    ) : currentQuestion ? (
                        <div className="space-y-6">
                            <div>
                                <span className="text-sm text-muted-foreground">
                                    Soal {currentIndex + 1} dari {totalQuestions}
                                </span>
                                <p className="text-base font-medium mt-2">{currentQuestion.question}</p>
                            </div>

                            <div className="space-y-2">
                                {currentQuestion.options.map((option, index) => (
                                    <button
                                        key={index}
                                        onClick={() => !showResult && setSelectedAnswer(index)}
                                        disabled={showResult}
                                        className={cn(
                                            "w-full p-3 text-left rounded-lg border transition-all text-sm",
                                            selectedAnswer === index && !showResult && "border-primary bg-primary/10",
                                            showResult && currentAnswer?.selected === index && currentAnswer?.correct && "border-emerald-500 bg-emerald-500/20",
                                            showResult && currentAnswer?.selected === index && !currentAnswer?.correct && "border-red-500 bg-red-500/20",
                                            !showResult && selectedAnswer !== index && "hover:border-primary/50 hover:bg-muted/50",
                                            showResult && "cursor-not-allowed"
                                        )}
                                    >
                                        <span className="font-medium mr-2">{String.fromCharCode(65 + index)}.</span>
                                        {option}
                                    </button>
                                ))}
                            </div>

                            {showResult && currentAnswer && (
                                <div className={cn(
                                    "p-3 rounded-lg",
                                    currentAnswer.correct ? "bg-emerald-500/10" : "bg-amber-500/10"
                                )}>
                                    <div className="flex items-center gap-2 font-medium">
                                        {currentAnswer.correct ? (
                                            <>
                                                <CheckCircle className="w-5 h-5 text-emerald-500" />
                                                <span className="text-emerald-700">Benar! 🎉</span>
                                            </>
                                        ) : (
                                            <>
                                                <XCircle className="w-5 h-5 text-amber-600" />
                                                <span className="text-amber-700">Belum tepat</span>
                                            </>
                                        )}
                                    </div>
                                    {currentQuestion.explanation && (
                                        <p className="text-sm mt-1 opacity-80">{currentQuestion.explanation}</p>
                                    )}
                                </div>
                            )}

                            <div className="flex justify-end gap-2">
                                {!showResult ? (
                                    <Button
                                        onClick={handleSubmitAnswer}
                                        disabled={selectedAnswer === null || isSubmitting}
                                    >
                                        {isSubmitting ? 'Mengecek...' : 'Cek Jawaban'}
                                    </Button>
                                ) : (
                                    <Button onClick={handleNext}>
                                        {isLastQuestion ? 'Lihat Hasil' : 'Lanjut'}
                                        <ArrowRight className="w-4 h-4 ml-2" />
                                    </Button>
                                )}
                            </div>
                        </div>
                    ) : (
                        <p className="text-center text-muted-foreground">Tidak ada soal.</p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

function QuizResultView({ answers, questions }: { answers: Map<number, { selected: number; correct: boolean }>; questions: Question[] }) {
    const correctCount = Array.from(answers.values()).filter(a => a.correct).length;
    const scorePercent = Math.round((correctCount / questions.length) * 100);
    const passed = scorePercent >= 60;

    return (
        <div className="text-center space-y-6">
            <div className={cn(
                "w-24 h-24 mx-auto rounded-full flex items-center justify-center",
                passed ? "bg-emerald-500/20" : "bg-amber-500/20"
            )}>
                {passed ? (
                    <Trophy className="w-12 h-12 text-emerald-500" />
                ) : (
                    <RotateCcw className="w-12 h-12 text-amber-500" />
                )}
            </div>

            <div>
                <h3 className={cn(
                    "text-2xl font-bold",
                    passed ? "text-emerald-600" : "text-amber-600"
                )}>
                    {passed ? 'Bagus! 🎉' : 'Perlu Latihan Lagi'}
                </h3>
                <p className="text-4xl font-bold mt-2">{scorePercent}%</p>
                <p className="text-muted-foreground">
                    {correctCount} dari {questions.length} soal benar
                </p>
            </div>

            <p className="text-sm text-muted-foreground">
                {passed
                    ? 'Kamu sudah memahami konsep ini. Siap lanjut ke modul berikutnya!'
                    : 'Tidak apa-apa! Kamu bisa pelajari ulang dengan penjelasan yang lebih sederhana.'
                }
            </p>
        </div>
    );
}
