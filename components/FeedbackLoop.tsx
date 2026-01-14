"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Send,
    Loader2,
    CheckCircle2,
    XCircle,
    MessageSquare,
    HelpCircle,
    ArrowRight,
    RotateCcw,
    Lightbulb,
    AlertTriangle
} from "lucide-react";
import {
    EMOTION_COLORS,
    EMOTION_EMOJIS,
    type PlutchikEmotion
} from "@/lib/emotion-api";

interface QuizQuestion {
    id: number;
    question: string;
    options: string[];
}

interface EvaluateResult {
    emotion: PlutchikEmotion;
    emotionConfidence: number;
    adaptationType: 'anxious' | 'confident' | 'neutral';
    quizPassed: boolean | null;
    quizScore: number | null;
    canProgress: boolean;
    nextAction: 'UNLOCK_NEXT' | 'TRIGGER_SCAFFOLDING' | 'RETRY_QUIZ';
    message: string;
}

interface FeedbackLoopProps {
    moduleId: string;
    questions: QuizQuestion[];
    isLoadingQuestions: boolean;
    onEvaluate: (result: EvaluateResult) => void;
    onRequestScaffolding: () => void;
    onNextModule: () => void;
    disabled?: boolean;
}

type FeedbackState = 'idle' | 'quiz' | 'feedback' | 'evaluating' | 'result';

export function FeedbackLoop({
    moduleId,
    questions,
    isLoadingQuestions,
    onEvaluate,
    onRequestScaffolding,
    onNextModule,
    disabled = false
}: FeedbackLoopProps) {
    const [state, setState] = useState<FeedbackState>('idle');
    const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
    const [feedbackText, setFeedbackText] = useState('');
    const [result, setResult] = useState<EvaluateResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleStartQuiz = () => {
        setState('quiz');
        setQuizAnswers({});
        setError(null);
    };

    const handleSkipQuiz = () => {
        setState('feedback');
        setQuizAnswers({});
    };

    const handleAnswerSelect = (questionId: number, optionIndex: number) => {
        setQuizAnswers(prev => ({
            ...prev,
            [questionId.toString()]: optionIndex
        }));
    };

    const handleSubmitQuiz = () => {
        if (Object.keys(quizAnswers).length < questions.length) {
            setError('Jawab semua pertanyaan terlebih dahulu');
            return;
        }
        setState('feedback');
        setError(null);
    };

    const handleSubmitFeedback = async () => {
        if (!feedbackText.trim()) {
            setError('Tuliskan perasaanmu tentang materi ini');
            return;
        }

        setState('evaluating');
        setError(null);

        try {
            const response = await fetch('/api/evaluate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    moduleId,
                    quizAnswers: Object.keys(quizAnswers).length > 0 ? quizAnswers : undefined,
                    feedbackText
                })
            });

            if (!response.ok) {
                throw new Error('Gagal mengevaluasi');
            }

            const evalResult: EvaluateResult = await response.json();
            setResult(evalResult);
            setState('result');
            onEvaluate(evalResult);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
            setState('feedback');
        }
    };

    const handleReset = () => {
        setState('idle');
        setQuizAnswers({});
        setFeedbackText('');
        setResult(null);
        setError(null);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey && state === 'feedback') {
            e.preventDefault();
            handleSubmitFeedback();
        }
    };

    // Idle state - Show options
    if (state === 'idle') {
        return (
            <Card className="border-primary/10">
                <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                        <HelpCircle className="w-4 h-4 text-primary" />
                        Sudah Selesai Membaca?
                    </CardTitle>
                    <CardDescription>
                        Ayo uji pemahamanmu dengan quiz singkat!
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    <Button
                        onClick={handleStartQuiz}
                        disabled={disabled || isLoadingQuestions || questions.length === 0}
                        className="w-full gap-2"
                    >
                        {isLoadingQuestions ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <CheckCircle2 className="w-4 h-4" />
                        )}
                        Mulai Quiz
                    </Button>
                    <Button
                        onClick={handleSkipQuiz}
                        disabled={disabled}
                        variant="outline"
                        className="w-full gap-2"
                    >
                        <MessageSquare className="w-4 h-4" />
                        Lewati Quiz, Beri Feedback
                    </Button>
                </CardContent>
            </Card>
        );
    }

    // Quiz state
    if (state === 'quiz') {
        return (
            <Card className="border-primary/10">
                <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                        <HelpCircle className="w-4 h-4 text-primary" />
                        Quiz ({Object.keys(quizAnswers).length}/{questions.length})
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {questions.map((q, qIndex) => (
                        <div key={q.id} className="space-y-2">
                            <p className="text-sm font-medium">
                                {qIndex + 1}. {q.question}
                            </p>
                            <div className="grid grid-cols-1 gap-2">
                                {q.options.map((option, optIndex) => (
                                    <Button
                                        key={optIndex}
                                        variant={quizAnswers[q.id.toString()] === optIndex ? "default" : "outline"}
                                        size="sm"
                                        className="justify-start text-left h-auto py-2 px-3"
                                        onClick={() => handleAnswerSelect(q.id, optIndex)}
                                    >
                                        <span className="mr-2 font-bold text-xs">
                                            {String.fromCharCode(65 + optIndex)}.
                                        </span>
                                        {option}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    ))}

                    {error && (
                        <p className="text-sm text-destructive flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            {error}
                        </p>
                    )}

                    <div className="flex gap-2 pt-2">
                        <Button
                            onClick={handleSubmitQuiz}
                            disabled={Object.keys(quizAnswers).length < questions.length}
                            className="flex-1 gap-2"
                        >
                            <ArrowRight className="w-4 h-4" />
                            Lanjut
                        </Button>
                        <Button
                            onClick={handleReset}
                            variant="ghost"
                            size="icon"
                        >
                            <RotateCcw className="w-4 h-4" />
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Feedback state
    if (state === 'feedback') {
        return (
            <Card className="border-primary/10">
                <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-primary" />
                        Bagaimana Perasaanmu?
                    </CardTitle>
                    <CardDescription>
                        Ceritakan pengalamanmu belajar materi ini
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <Lightbulb className="w-4 h-4" />
                        <span>Contoh: &quot;Sudah cukup jelas&quot; atau &quot;Masih bingung bagian X&quot;</span>
                    </div>
                    <Input
                        value={feedbackText}
                        onChange={(e) => setFeedbackText(e.target.value)}
                        onKeyDown={handleKeyPress}
                        placeholder="Tuliskan perasaanmu..."
                        disabled={disabled}
                    />

                    {error && (
                        <p className="text-sm text-destructive flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            {error}
                        </p>
                    )}

                    <div className="flex gap-2">
                        <Button
                            onClick={handleSubmitFeedback}
                            disabled={!feedbackText.trim() || disabled}
                            className="flex-1 gap-2"
                        >
                            <Send className="w-4 h-4" />
                            Kirim
                        </Button>
                        <Button
                            onClick={handleReset}
                            variant="ghost"
                            size="icon"
                        >
                            <RotateCcw className="w-4 h-4" />
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Evaluating state
    if (state === 'evaluating') {
        return (
            <Card className="border-primary/10">
                <CardContent className="py-8">
                    <div className="flex flex-col items-center gap-3">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        <p className="text-sm text-muted-foreground">
                            Menganalisis perasaanmu...
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Result state
    if (state === 'result' && result) {
        const emotionColor = EMOTION_COLORS[result.emotion];
        const emotionEmoji = EMOTION_EMOJIS[result.emotion];

        return (
            <Card className="border-primary/10">
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-base">Hasil Evaluasi</CardTitle>
                        <Badge className={`${emotionColor.bg} ${emotionColor.text}`}>
                            {emotionEmoji} {result.emotion}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Quiz Result */}
                    {result.quizPassed !== null && (
                        <div className={`p-3 rounded-lg ${result.quizPassed ? 'bg-emerald-500/10' : 'bg-rose-500/10'}`}>
                            <div className="flex items-center gap-2">
                                {result.quizPassed ? (
                                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                ) : (
                                    <XCircle className="w-5 h-5 text-rose-500" />
                                )}
                                <span className={`font-medium ${result.quizPassed ? 'text-emerald-500' : 'text-rose-500'}`}>
                                    Quiz: {result.quizPassed ? 'Lulus' : 'Belum Lulus'}
                                </span>
                            </div>
                            {result.quizScore !== null && (
                                <p className="text-sm text-muted-foreground mt-1">
                                    Skor: {(result.quizScore * 100).toFixed(0)}%
                                </p>
                            )}
                        </div>
                    )}

                    {/* Message */}
                    <div className={`p-4 rounded-lg ${result.canProgress
                            ? 'bg-gradient-to-r from-emerald-500/10 to-primary/5'
                            : 'bg-gradient-to-r from-amber-500/10 to-primary/5'
                        }`}>
                        <p className="text-sm">{result.message}</p>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-2">
                        {result.nextAction === 'UNLOCK_NEXT' && (
                            <Button onClick={onNextModule} className="w-full gap-2">
                                <ArrowRight className="w-4 h-4" />
                                Lanjut ke Modul Berikutnya
                            </Button>
                        )}

                        {result.nextAction === 'TRIGGER_SCAFFOLDING' && (
                            <Button onClick={onRequestScaffolding} className="w-full gap-2" variant="secondary">
                                <Lightbulb className="w-4 h-4" />
                                Pelajari dengan Penjelasan Lebih Sederhana
                            </Button>
                        )}

                        {result.nextAction === 'RETRY_QUIZ' && (
                            <Button onClick={handleReset} className="w-full gap-2" variant="secondary">
                                <RotateCcw className="w-4 h-4" />
                                Pelajari Lagi & Coba Quiz
                            </Button>
                        )}

                        <Button onClick={handleReset} variant="ghost" className="w-full">
                            Beri Feedback Lagi
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return null;
}
