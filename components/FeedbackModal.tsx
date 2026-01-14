"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { MessageSquare, Send, Loader2, Smile, Frown, Meh } from "lucide-react";

interface FeedbackModalProps {
    isOpen: boolean;
    onClose: () => void;
    quizPassed: boolean;
    quizScore: number;
    onSubmit: (result: FeedbackResult) => void;
    moduleName: string;
}

export interface FeedbackResult {
    emotion: string;
    confidence: number;
    isPositive: boolean;
    canProgress: boolean;
    message: string;
}

export function FeedbackModal({
    isOpen,
    onClose,
    quizPassed,
    quizScore,
    onSubmit,
    moduleName
}: FeedbackModalProps) {
    const [feedback, setFeedback] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [result, setResult] = useState<FeedbackResult | null>(null);

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setFeedback('');
            setIsAnalyzing(false);
            setResult(null);
        }
    }, [isOpen]);

    const handleSubmit = async () => {
        if (!feedback.trim()) return;

        setIsAnalyzing(true);

        try {
            const response = await fetch('/api/evaluate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    moduleId: moduleName,
                    feedbackText: feedback,
                    quizAnswers: {} // Empty since we already checked in quiz
                })
            });

            const data = await response.json();

            // Determine if can progress based on quiz + emotion
            const positiveEmotions = ['Joy', 'Trust', 'Anticipation'];
            const isPositive = positiveEmotions.includes(data.emotion);
            const canProgress = quizPassed && isPositive;

            const feedbackResult: FeedbackResult = {
                emotion: data.emotion,
                confidence: data.emotionConfidence,
                isPositive,
                canProgress,
                message: canProgress
                    ? '🎉 Bagus! Kamu paham dan merasa percaya diri. Lanjut ke modul berikutnya!'
                    : quizPassed && !isPositive
                        ? '🤔 Quiz benar tapi sepertinya masih ada kebingungan. Mari pelajari dengan cara lebih sederhana.'
                        : '📚 Tidak apa-apa! Mari coba lagi dengan penjelasan yang lebih mudah.'
            };

            setResult(feedbackResult);
        } catch (error) {
            console.error('Failed to analyze feedback:', error);
            setResult({
                emotion: 'unknown',
                confidence: 0,
                isPositive: false,
                canProgress: false,
                message: 'Gagal menganalisis feedback. Silakan coba lagi.'
            });
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleContinue = () => {
        if (result) {
            onSubmit(result);
        }
        onClose();
    };

    const getEmotionIcon = (emotion: string) => {
        const positive = ['Joy', 'Trust', 'Anticipation'];
        const negative = ['Fear', 'Sadness', 'Anger', 'Disgust'];

        if (positive.includes(emotion)) return <Smile className="w-8 h-8 text-emerald-500" />;
        if (negative.includes(emotion)) return <Frown className="w-8 h-8 text-amber-500" />;
        return <Meh className="w-8 h-8 text-blue-500" />;
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

            <Card className="relative z-10 w-full max-w-md mx-4">
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-primary" />
                        Feedback Pembelajaran
                    </CardTitle>
                </CardHeader>

                <CardContent className="space-y-4">
                    {!result ? (
                        <>
                            <div className={cn(
                                "p-3 rounded-lg text-center",
                                quizPassed ? "bg-emerald-500/10" : "bg-amber-500/10"
                            )}>
                                <p className="font-medium">
                                    Nilai Quiz: <span className={quizPassed ? "text-emerald-600" : "text-amber-600"}>
                                        {quizScore}%
                                    </span>
                                </p>
                            </div>

                            <div>
                                <label className="text-sm font-medium mb-2 block">
                                    Bagaimana perasaanmu setelah mempelajari materi ini?
                                </label>
                                <Textarea
                                    value={feedback}
                                    onChange={(e) => setFeedback(e.target.value)}
                                    placeholder="Contoh: Saya sudah paham tentang konsep ini, tapi masih sedikit bingung dengan bagian rumusnya..."
                                    rows={4}
                                    className="resize-none"
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                    Tulis perasaan jujurmu - ini membantu kami menyesuaikan pembelajaran
                                </p>
                            </div>

                            <Button
                                onClick={handleSubmit}
                                disabled={!feedback.trim() || isAnalyzing}
                                className="w-full"
                            >
                                {isAnalyzing ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Menganalisis...
                                    </>
                                ) : (
                                    <>
                                        <Send className="w-4 h-4 mr-2" />
                                        Kirim Feedback
                                    </>
                                )}
                            </Button>
                        </>
                    ) : (
                        <>
                            <div className="text-center py-4">
                                {getEmotionIcon(result.emotion)}
                                <h3 className="text-lg font-medium mt-3">
                                    Emosi terdeteksi: <span className="text-primary">{result.emotion}</span>
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    Confidence: {(result.confidence * 100).toFixed(0)}%
                                </p>
                            </div>

                            <div className={cn(
                                "p-4 rounded-lg text-center",
                                result.canProgress ? "bg-emerald-500/10" : "bg-amber-500/10"
                            )}>
                                <p className="font-medium">
                                    {result.message}
                                </p>
                            </div>

                            <Button onClick={handleContinue} className="w-full">
                                {result.canProgress ? 'Lanjut ke Modul Berikutnya' : 'Pelajari Ulang'}
                            </Button>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
