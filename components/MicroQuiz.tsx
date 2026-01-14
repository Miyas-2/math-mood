"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CheckCircle, XCircle, ArrowRight, HelpCircle, RotateCcw } from "lucide-react";

interface MicroQuizProps {
    question: {
        id: number;
        question: string;
        options: string[];
        explanation?: string;
    };
    onAnswer: (isCorrect: boolean, selectedIndex: number) => void;
    disabled?: boolean;
}

export function MicroQuiz({ question, onAnswer, disabled = false }: MicroQuizProps) {
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [showResult, setShowResult] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);

    const handleSelect = (index: number) => {
        if (showResult || disabled) return;
        setSelectedAnswer(index);
    };

    const handleSubmit = async () => {
        if (selectedAnswer === null) return;

        // Check answer via API
        try {
            const response = await fetch('/api/evaluate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'checkAnswer',
                    questionId: question.id,
                    selectedAnswer
                })
            });

            const data = await response.json();
            setIsCorrect(data.isCorrect);
            setShowResult(true);
            onAnswer(data.isCorrect, selectedAnswer);
        } catch {
            // Fallback - assume incorrect to be safe
            setIsCorrect(false);
            setShowResult(true);
            onAnswer(false, selectedAnswer);
        }
    };

    const handleReset = () => {
        setSelectedAnswer(null);
        setShowResult(false);
        setIsCorrect(false);
    };

    return (
        <Card className={cn(
            "border-2 transition-all",
            showResult && isCorrect && "border-emerald-500 bg-emerald-500/5",
            showResult && !isCorrect && "border-amber-500 bg-amber-500/5"
        )}>
            <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                    <HelpCircle className="w-5 h-5 text-primary" />
                    Cek Pemahaman
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <p className="text-sm font-medium">{question.question}</p>

                <div className="space-y-2">
                    {question.options.map((option, index) => (
                        <button
                            key={index}
                            onClick={() => handleSelect(index)}
                            disabled={showResult || disabled}
                            className={cn(
                                "w-full p-3 text-left rounded-lg border transition-all text-sm",
                                selectedAnswer === index && !showResult && "border-primary bg-primary/10",
                                showResult && selectedAnswer === index && isCorrect && "border-emerald-500 bg-emerald-500/20",
                                showResult && selectedAnswer === index && !isCorrect && "border-red-500 bg-red-500/20",
                                !showResult && selectedAnswer !== index && "hover:border-primary/50 hover:bg-muted/50",
                                (showResult || disabled) && "cursor-not-allowed opacity-75"
                            )}
                        >
                            <span className="font-medium mr-2">{String.fromCharCode(65 + index)}.</span>
                            {option}
                        </button>
                    ))}
                </div>

                {showResult && (
                    <div className={cn(
                        "p-3 rounded-lg",
                        isCorrect ? "bg-emerald-500/10 text-emerald-700" : "bg-amber-500/10 text-amber-700"
                    )}>
                        <div className="flex items-center gap-2 font-medium mb-1">
                            {isCorrect ? (
                                <>
                                    <CheckCircle className="w-5 h-5" />
                                    Benar! 🎉
                                </>
                            ) : (
                                <>
                                    <XCircle className="w-5 h-5" />
                                    Belum tepat
                                </>
                            )}
                        </div>
                        {question.explanation && (
                            <p className="text-sm opacity-90">{question.explanation}</p>
                        )}
                    </div>
                )}

                {!showResult ? (
                    <Button
                        onClick={handleSubmit}
                        disabled={selectedAnswer === null || disabled}
                        className="w-full"
                    >
                        Cek Jawaban
                    </Button>
                ) : (
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={handleReset} className="flex-1">
                            <RotateCcw className="w-4 h-4 mr-2" />
                            Coba Lagi
                        </Button>
                        <Button className="flex-1">
                            Lanjut <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
