"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth, ProtectedRoute } from "@/lib/auth-context";
import { ConceptCard } from "@/components/ConceptCard";
import { QuizModal, QuizResult } from "@/components/QuizModal";
import { FeedbackModal, FeedbackResult } from "@/components/FeedbackModal";
import { ModuleProgress } from "@/components/ModuleProgress";
import {
    getGradeById,
    getChapterById,
    getModuleById,
    type Chapter,
    type Module,
} from "@/lib/modules";
import {
    Brain,
    BookOpen,
    ArrowLeft,
    User,
    Play,
    CheckCircle,
    ChevronDown,
    ChevronUp,
    RefreshCw
} from "lucide-react";

interface QuizQuestion {
    id: number;
    question: string;
    options: string[];
    explanation?: string;
}

type SkillLevel = 'beginner' | 'normal' | 'advanced';
type LearningState = 'loading' | 'learning' | 'quiz' | 'feedback' | 'result' | 'complete';

export default function LearnPage() {
    return (
        <ProtectedRoute>
            <LearnContent />
        </ProtectedRoute>
    );
}

function LearnContent() {
    const router = useRouter();
    const params = useParams();
    const gradeId = params.gradeId as string;
    const chapterId = params.chapterId as string;
    const moduleId = params.moduleId as string;

    const { user } = useAuth();
    const preference = user?.preference || 'text';

    // Learning state
    const [chapter, setChapter] = useState<Chapter | null>(null);
    const [currentModule, setCurrentModule] = useState<Module | null>(null);
    const [currentModuleIndex, setCurrentModuleIndex] = useState(0);
    const [completedModules, setCompletedModules] = useState<Set<string>>(new Set());

    // Adaptive learning state
    const [skillLevel, setSkillLevel] = useState<SkillLevel>('normal');
    const [learningState, setLearningState] = useState<LearningState>('loading');
    const [lastQuizResult, setLastQuizResult] = useState<QuizResult | null>(null);
    const [lastFeedbackResult, setLastFeedbackResult] = useState<FeedbackResult | null>(null);

    // Content state
    const [content, setContent] = useState('');
    const [contentTitle, setContentTitle] = useState('');
    const [isLoadingContent, setIsLoadingContent] = useState(false);

    // Quiz state
    const [questions, setQuestions] = useState<QuizQuestion[]>([]);
    const [showQuizModal, setShowQuizModal] = useState(false);
    const [showFeedbackModal, setShowFeedbackModal] = useState(false);

    const isLastModule = chapter ? currentModuleIndex === chapter.modules.length - 1 : false;

    // Initialize
    useEffect(() => {
        const foundChapter = getChapterById(gradeId, chapterId);
        const foundModule = getModuleById(gradeId, chapterId, moduleId);

        if (!foundChapter || !foundModule) {
            router.replace('/dashboard');
            return;
        }

        setChapter(foundChapter);
        setCurrentModule(foundModule);
        setCurrentModuleIndex(foundChapter.modules.findIndex(m => m.id === moduleId));

        if (user) {
            loadUserProgress(user.id);
        }

        setLearningState('learning');
    }, [gradeId, chapterId, moduleId, router, user]);

    // Load content when module and skill level are set
    useEffect(() => {
        if (currentModule && learningState !== 'loading') {
            fetchModuleContent(currentModule.id, skillLevel);
            fetchQuizQuestions(currentModule.id);
        }
    }, [currentModule, skillLevel]);

    const loadUserProgress = async (userId: number) => {
        try {
            const response = await fetch(`/api/progress?userId=${userId}`);
            if (response.ok) {
                const data = await response.json();
                const completed = new Set<string>(data.completedModules || []);
                setCompletedModules(completed);
            }
        } catch (error) {
            console.error('Failed to load progress:', error);
        }
    };

    const saveProgress = async (modId: string, completed: boolean, quizScore?: number) => {
        if (!user || !chapter) return;

        try {
            await fetch('/api/progress', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.id,
                    topicId: chapterId,
                    moduleId: modId,
                    completed,
                    quizScore,
                    skillLevel
                })
            });
        } catch (error) {
            console.error('Failed to save progress:', error);
        }
    };

    const fetchModuleContent = useCallback(async (modId: string, level: SkillLevel) => {
        setIsLoadingContent(true);
        setContent('');

        try {
            const response = await fetch('/api/material', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    moduleId: modId,
                    skillLevel: level,
                    preference
                })
            });

            if (!response.ok) {
                throw new Error('Failed to fetch content');
            }

            const text = await response.text();
            setContent(text);
            setContentTitle(currentModule?.name || 'Materi');
        } catch (error) {
            console.error('Failed to fetch content:', error);
            setContent('Gagal memuat materi. Silakan coba lagi.');
        } finally {
            setIsLoadingContent(false);
        }
    }, [preference, currentModule]);

    const fetchQuizQuestions = useCallback(async (modId: string) => {
        try {
            const response = await fetch(`/api/evaluate?moduleId=${modId}&limit=3`);
            if (!response.ok) throw new Error('Failed to fetch questions');

            const data = await response.json();
            setQuestions(data.questions || []);
        } catch (error) {
            console.error('Failed to fetch quiz:', error);
            setQuestions([]);
        }
    }, []);

    const handleStartQuiz = () => {
        if (questions.length > 0) {
            setShowQuizModal(true);
        }
    };

    const handleQuizComplete = (result: QuizResult) => {
        setLastQuizResult(result);
        setShowQuizModal(false);

        // After quiz, always show feedback modal for emotion detection
        setShowFeedbackModal(true);
    };

    const handleFeedbackComplete = (result: FeedbackResult) => {
        setLastFeedbackResult(result);
        setShowFeedbackModal(false);
        setLearningState('result');

        if (currentModule && lastQuizResult) {
            const scorePercent = (lastQuizResult.score / lastQuizResult.totalQuestions) * 100;
            saveProgress(currentModule.id, result.canProgress, scorePercent);
        }
    };

    const handleContinue = () => {
        if (!chapter || !currentModule || !lastFeedbackResult) return;

        if (lastFeedbackResult.canProgress) {
            // SUCCESS: Mark complete and go to next module
            setCompletedModules(prev => new Set([...prev, currentModule.id]));

            if (!isLastModule) {
                const nextIndex = currentModuleIndex + 1;
                const nextModule = chapter.modules[nextIndex];
                // Reset to normal level for new module
                setSkillLevel('normal');
                router.push(`/learn/${gradeId}/${chapterId}/${nextModule.id}`);
            } else {
                setLearningState('complete');
            }
        }
    };

    const handleRetrySimpler = () => {
        // FAIL: Downgrade skill level and retry
        const newLevel: SkillLevel = skillLevel === 'advanced' ? 'normal' : 'beginner';
        setSkillLevel(newLevel);
        setLearningState('learning');
        setLastQuizResult(null);
        setLastFeedbackResult(null);

        if (currentModule) {
            fetchModuleContent(currentModule.id, newLevel);
        }
    };

    const handleRetryNormal = () => {
        // Stay at same level, retry
        setLearningState('learning');
        setLastQuizResult(null);
        setLastFeedbackResult(null);
    };

    const handleIncreaseLevel = () => {
        // Option to challenge with harder content
        const newLevel: SkillLevel = skillLevel === 'beginner' ? 'normal' : 'advanced';
        setSkillLevel(newLevel);
        setLearningState('learning');
        setLastQuizResult(null);
        setLastFeedbackResult(null);

        if (currentModule) {
            fetchModuleContent(currentModule.id, newLevel);
        }
    };

    const handleBackToDashboard = () => {
        router.push('/dashboard');
    };

    if (!chapter || !currentModule || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-pulse text-muted-foreground">Loading...</div>
            </div>
        );
    }

    const grade = getGradeById(gradeId);
    const canProgress = lastFeedbackResult?.canProgress ?? false;

    return (
        <div className="min-h-screen flex flex-col p-4 md:p-8 bg-gradient-to-br from-background via-background to-primary/5">
            {/* Top Bar */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={handleBackToDashboard}>
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5">
                        <Brain className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="font-bold text-xl">{grade?.shortName} - BAB {chapter.number}</h1>
                        <p className="text-sm text-muted-foreground">
                            {chapter.name} • Modul {currentModuleIndex + 1}/{chapter.modules.length}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <Badge variant="outline" className={
                        skillLevel === 'beginner' ? 'bg-emerald-500/10 text-emerald-600' :
                            skillLevel === 'advanced' ? 'bg-purple-500/10 text-purple-600' :
                                'bg-blue-500/10 text-blue-600'
                    }>
                        {skillLevel === 'beginner' ? '🌱 Dasar' : skillLevel === 'advanced' ? '🚀 Lanjut' : '📚 Standar'}
                    </Badge>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <User className="w-4 h-4" />
                        <span>{user.name}</span>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col lg:flex-row gap-6 max-w-7xl mx-auto w-full">
                {/* Left: Learning Content */}
                <div className="flex-1 flex flex-col gap-4">
                    <ConceptCard
                        title={contentTitle}
                        content={content}
                        isLoading={isLoadingContent}
                        preference={preference}
                        skillLevel={skillLevel}
                    />

                    {/* Action Buttons based on state */}
                    {learningState === 'learning' && !isLoadingContent && (
                        <Card className="border-primary/20">
                            <CardContent className="py-4">
                                <div className="flex flex-wrap gap-3">
                                    <Button
                                        onClick={handleStartQuiz}
                                        disabled={questions.length === 0}
                                        className="flex-1"
                                    >
                                        <Play className="w-4 h-4 mr-2" />
                                        Mulai Quiz ({questions.length} soal)
                                    </Button>

                                    {skillLevel !== 'beginner' && (
                                        <Button variant="outline" onClick={handleRetrySimpler}>
                                            <ChevronDown className="w-4 h-4 mr-2" />
                                            Lebih Mudah
                                        </Button>
                                    )}

                                    {skillLevel !== 'advanced' && (
                                        <Button variant="outline" onClick={handleIncreaseLevel}>
                                            <ChevronUp className="w-4 h-4 mr-2" />
                                            Lebih Sulit
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Result Card */}
                    {learningState === 'result' && lastFeedbackResult && lastQuizResult && (
                        <Card className={canProgress
                            ? "border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 to-primary/5"
                            : "border-amber-500/30 bg-gradient-to-r from-amber-500/10 to-orange-500/5"
                        }>
                            <CardContent className="py-6 space-y-4">
                                <div className="text-center">
                                    <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center ${canProgress ? "bg-emerald-500/20" : "bg-amber-500/20"
                                        }`}>
                                        {canProgress
                                            ? <CheckCircle className="w-8 h-8 text-emerald-500" />
                                            : <RefreshCw className="w-8 h-8 text-amber-500" />
                                        }
                                    </div>
                                    <h3 className={`text-xl font-bold mt-3 ${canProgress ? "text-emerald-600" : "text-amber-600"
                                        }`}>
                                        {canProgress ? '🎉 Berhasil!' : 'Belum Berhasil'}
                                    </h3>
                                    <p className="text-muted-foreground mt-1">
                                        Quiz: {lastQuizResult.score}/{lastQuizResult.totalQuestions} •
                                        Emosi: {lastFeedbackResult.emotion}
                                    </p>
                                </div>

                                <p className="text-center text-sm">
                                    {lastFeedbackResult.message}
                                </p>

                                <div className="flex flex-wrap gap-2 justify-center">
                                    {canProgress ? (
                                        <>
                                            <Button onClick={handleContinue}>
                                                {isLastModule ? 'Selesai' : 'Lanjut Modul Berikutnya →'}
                                            </Button>
                                            {skillLevel !== 'advanced' && (
                                                <Button variant="outline" onClick={handleIncreaseLevel}>
                                                    <ChevronUp className="w-4 h-4 mr-2" />
                                                    Coba Level Lebih Tinggi
                                                </Button>
                                            )}
                                        </>
                                    ) : (
                                        <>
                                            <Button onClick={handleRetrySimpler}>
                                                <ChevronDown className="w-4 h-4 mr-2" />
                                                Pelajari dengan Level Lebih Mudah
                                            </Button>
                                            <Button variant="outline" onClick={handleRetryNormal}>
                                                <RefreshCw className="w-4 h-4 mr-2" />
                                                Ulangi
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Module Complete */}
                    {learningState === 'complete' && (
                        <Card className="bg-gradient-to-r from-emerald-500/10 to-primary/10 border-emerald-500/30">
                            <CardContent className="py-6 text-center">
                                <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
                                <h2 className="text-2xl font-bold text-emerald-600 mb-2">
                                    🎉 Selamat! BAB Selesai!
                                </h2>
                                <p className="text-muted-foreground mb-4">
                                    Kamu telah menyelesaikan semua modul di BAB {chapter.number}: {chapter.name}
                                </p>
                                <Button onClick={handleBackToDashboard}>
                                    Kembali ke Dashboard
                                </Button>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Right: Sidebar */}
                <div className="lg:w-72 space-y-4">
                    {/* Module Progress */}
                    <Card className="border-primary/10">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2">
                                <BookOpen className="w-4 h-4 text-primary" />
                                Progres BAB {chapter.number}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ModuleProgress
                                modules={chapter.modules.map(m => ({
                                    id: m.id,
                                    name: m.name,
                                    description: m.isEnrichment ? 'Pengayaan' : m.isDeepDive ? 'Pendalaman' : undefined
                                }))}
                                currentModuleIndex={currentModuleIndex}
                                completedModules={completedModules}
                            />
                        </CardContent>
                    </Card>

                    {/* How It Works */}
                    <Card className="border-primary/10">
                        <CardContent className="py-4">
                            <h4 className="text-sm font-medium mb-3">Cara Kerja Adaptive</h4>
                            <div className="space-y-2 text-xs">
                                <div className="p-2 rounded bg-muted">
                                    📖 <strong>Baca</strong> materi sesuai level
                                </div>
                                <div className="p-2 rounded bg-muted">
                                    ✅ <strong>Quiz</strong> untuk cek pemahaman
                                </div>
                                <div className="p-2 rounded bg-muted">
                                    💭 <strong>Feedback</strong> tulis perasaanmu
                                </div>
                                <div className="p-2 rounded bg-primary/10">
                                    🎯 <strong>Lulus</strong> = Quiz ✓ + Emosi positif
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Quiz Modal */}
            <QuizModal
                isOpen={showQuizModal}
                onClose={() => setShowQuizModal(false)}
                questions={questions}
                moduleName={currentModule?.name || ''}
                onComplete={handleQuizComplete}
            />

            {/* Feedback Modal (emotion detection) */}
            <FeedbackModal
                isOpen={showFeedbackModal}
                onClose={() => setShowFeedbackModal(false)}
                quizPassed={lastQuizResult?.passed ?? false}
                quizScore={lastQuizResult ? Math.round((lastQuizResult.score / lastQuizResult.totalQuestions) * 100) : 0}
                moduleName={currentModule?.id || ''}
                onSubmit={handleFeedbackComplete}
            />
        </div>
    );
}
