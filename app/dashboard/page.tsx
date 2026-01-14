"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth, ProtectedRoute } from "@/lib/auth-context";
import {
    GRADE_LEVELS,
    type GradeLevel,
    type Chapter,
} from "@/lib/modules";
import {
    Brain,
    BookOpen,
    ChevronRight,
    Settings,
    Volume2,
    FileText,
    Trophy,
    LogOut,
    User,
    ArrowLeft,
    Lock,
    GraduationCap
} from "lucide-react";

type ViewMode = 'grades' | 'chapters' | 'modules';

export default function DashboardPage() {
    return (
        <ProtectedRoute>
            <DashboardContent />
        </ProtectedRoute>
    );
}

function DashboardContent() {
    const router = useRouter();
    const { user, logout } = useAuth();

    const [viewMode, setViewMode] = useState<ViewMode>('grades');
    const [selectedGrade, setSelectedGrade] = useState<GradeLevel | null>(null);
    const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
    const [completedModules, setCompletedModules] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (user) {
            loadUserProgress(user.id);
        }
    }, [user]);

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

    const handleGradeSelect = (grade: GradeLevel) => {
        if (!grade.isAvailable) return;
        setSelectedGrade(grade);
        setViewMode('chapters');
    };

    const handleChapterSelect = (chapter: Chapter) => {
        setSelectedChapter(chapter);
        setViewMode('modules');
    };

    const handleModuleSelect = (moduleId: string) => {
        if (!selectedGrade || !selectedChapter) return;
        router.push(`/learn/${selectedGrade.id}/${selectedChapter.id}/${moduleId}`);
    };

    const handleBack = () => {
        if (viewMode === 'modules') {
            setSelectedChapter(null);
            setViewMode('chapters');
        } else if (viewMode === 'chapters') {
            setSelectedGrade(null);
            setViewMode('grades');
        }
    };

    if (!user) return null;

    return (
        <div className="min-h-screen flex flex-col p-4 bg-gradient-to-br from-background via-background to-primary/5">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    {viewMode !== 'grades' && (
                        <Button variant="ghost" size="icon" onClick={handleBack}>
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                    )}
                    <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5">
                        <Brain className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <span className="font-bold text-xl">MoodMath</span>
                        {viewMode === 'chapters' && selectedGrade && (
                            <p className="text-sm text-muted-foreground">{selectedGrade.name}</p>
                        )}
                        {viewMode === 'modules' && selectedChapter && (
                            <p className="text-sm text-muted-foreground">BAB {selectedChapter.number}: {selectedChapter.name}</p>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <User className="w-4 h-4" />
                        <span>{user.name}</span>
                    </div>
                    <Badge variant="outline" className={user.preference === 'audio' ? 'bg-violet-500/10 text-violet-500' : 'bg-emerald-500/10 text-emerald-500'}>
                        {user.preference === 'audio' ? <Volume2 className="w-3 h-3 mr-1" /> : <FileText className="w-3 h-3 mr-1" />}
                        {user.preference === 'audio' ? 'Audio' : 'Teks'}
                    </Badge>
                    <Button variant="ghost" size="sm" onClick={() => router.push('/settings')}>
                        <Settings className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={logout}>
                        <LogOut className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* Main content */}
            <div className="flex-1 flex items-start justify-center pt-8">
                <div className="max-w-4xl w-full space-y-8">
                    {/* Title */}
                    <div className="text-center space-y-2">
                        {viewMode === 'grades' && (
                            <>
                                <h1 className="text-3xl font-bold">Halo, {user.name}! 👋</h1>
                                <p className="text-muted-foreground text-lg">
                                    Pilih jenjang pendidikan untuk mulai belajar
                                </p>
                            </>
                        )}
                        {viewMode === 'chapters' && selectedGrade && (
                            <>
                                <h1 className="text-3xl font-bold">{selectedGrade.name}</h1>
                                <p className="text-muted-foreground text-lg">
                                    Pilih bab yang ingin kamu pelajari
                                </p>
                            </>
                        )}
                        {viewMode === 'modules' && selectedChapter && (
                            <>
                                <h1 className="text-2xl font-bold">BAB {selectedChapter.number}: {selectedChapter.name}</h1>
                                <p className="text-muted-foreground">
                                    Pilih sub-materi untuk mulai belajar
                                </p>
                            </>
                        )}
                    </div>

                    {/* Grade Selection */}
                    {viewMode === 'grades' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {GRADE_LEVELS.map((grade) => (
                                <Card
                                    key={grade.id}
                                    className={`group cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${!grade.isAvailable ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-primary/10 hover:border-primary/50'
                                        }`}
                                    onClick={() => handleGradeSelect(grade)}
                                >
                                    <CardHeader className="pb-3">
                                        <CardTitle className="flex items-center gap-2 text-lg">
                                            {grade.isAvailable ? (
                                                <GraduationCap className="w-5 h-5 text-primary" />
                                            ) : (
                                                <Lock className="w-5 h-5 text-muted-foreground" />
                                            )}
                                            {grade.shortName}
                                        </CardTitle>
                                        <p className="text-sm text-muted-foreground">{grade.description}</p>
                                    </CardHeader>
                                    {grade.isAvailable && (
                                        <CardContent>
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-muted-foreground">
                                                    {grade.chapters.length} bab
                                                </span>
                                                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors group-hover:translate-x-1 group-hover:transition-transform" />
                                            </div>
                                        </CardContent>
                                    )}
                                </Card>
                            ))}
                        </div>
                    )}

                    {/* Chapter Selection */}
                    {viewMode === 'chapters' && selectedGrade && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {selectedGrade.chapters.map((chapter) => {
                                const completedCount = chapter.modules.filter(m => completedModules.has(m.id)).length;
                                const totalModules = chapter.modules.length;
                                const isComplete = completedCount === totalModules;

                                return (
                                    <Card
                                        key={chapter.id}
                                        className={`group cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:shadow-primary/10 hover:border-primary/50 ${isComplete ? 'border-emerald-500/50 bg-emerald-500/5' : ''
                                            }`}
                                        onClick={() => handleChapterSelect(chapter)}
                                    >
                                        <CardHeader className="pb-3">
                                            <CardTitle className="flex items-center gap-2 text-lg">
                                                {isComplete ? (
                                                    <Trophy className="w-5 h-5 text-emerald-500" />
                                                ) : (
                                                    <BookOpen className="w-5 h-5 text-primary" />
                                                )}
                                                <span className="text-muted-foreground font-normal">BAB {chapter.number}</span>
                                            </CardTitle>
                                            <p className="font-medium">{chapter.name}</p>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs text-muted-foreground">
                                                        {completedCount}/{totalModules} modul
                                                    </span>
                                                    {completedCount > 0 && (
                                                        <div className="w-16 h-1 bg-muted rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-emerald-500 transition-all"
                                                                style={{ width: `${(completedCount / totalModules) * 100}%` }}
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-all group-hover:translate-x-1" />
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    )}

                    {/* Module Selection */}
                    {viewMode === 'modules' && selectedChapter && (
                        <div className="space-y-3">
                            {selectedChapter.modules.map((module, index) => {
                                const isCompleted = completedModules.has(module.id);
                                const isEnrichment = module.isEnrichment;
                                const isDeepDive = module.isDeepDive;

                                return (
                                    <Card
                                        key={module.id}
                                        className={`group cursor-pointer transition-all duration-300 hover:shadow-md hover:border-primary/50 ${isCompleted ? 'border-emerald-500/50 bg-emerald-500/5' : ''
                                            } ${isEnrichment || isDeepDive ? 'ml-6 border-dashed' : ''}`}
                                        onClick={() => handleModuleSelect(module.id)}
                                    >
                                        <CardContent className="py-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    {isCompleted ? (
                                                        <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                                            <Trophy className="w-4 h-4 text-emerald-500" />
                                                        </div>
                                                    ) : (
                                                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                                                            {isEnrichment ? '★' : isDeepDive ? '◆' : index + 1}
                                                        </div>
                                                    )}
                                                    <div>
                                                        <p className="font-medium">{module.name}</p>
                                                        {(isEnrichment || isDeepDive) && (
                                                            <Badge variant="outline" className="text-xs mt-1">
                                                                {isEnrichment ? 'Pengayaan' : 'Pendalaman'}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-all group-hover:translate-x-1" />
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
