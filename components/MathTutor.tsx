"use client";

import { useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { EmotionalPulse } from "@/components/EmotionalPulse";
import { EmotionHistory } from "@/components/EmotionHistory";
import { ModuleProgress } from "@/components/ModuleProgress";
import {
    TOPICS_WITH_MODULES,
    type TopicWithModules,
    type Module,
    UNDERSTANDING_CONFIDENCE_THRESHOLD
} from "@/lib/modules";
import {
    type PlutchikEmotion,
    type EmotionResponse,
    CONFIDENCE_EMOTIONS,
} from "@/lib/emotion-api";
import {
    Brain,
    Sparkles,
    Send,
    RefreshCw,
    BookOpen,
    Heart,
    Loader2,
    ChevronRight,
    Lightbulb,
    CheckCircle2,
    ArrowRight
} from "lucide-react";
import katex from "katex";
import "katex/dist/katex.min.css";

// Function to render text with LaTeX math equations and markdown formatting
function renderWithMath(text: string): string {
    // Replace display math $$...$$ first
    let result = text.replace(/\$\$([^$]+)\$\$/g, (_, math) => {
        try {
            return katex.renderToString(math.trim(), { displayMode: true, throwOnError: false });
        } catch {
            return `$$${math}$$`;
        }
    });

    // Then replace inline math $...$
    result = result.replace(/\$([^$]+)\$/g, (_, math) => {
        try {
            return katex.renderToString(math.trim(), { displayMode: false, throwOnError: false });
        } catch {
            return `$${math}$`;
        }
    });

    // Replace **bold** with <strong> tags
    result = result.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

    // Replace *italic* with <em> tags (but not ** which is bold)
    result = result.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>');

    return result;
}

// Render a line with math support
function MathLine({ content, className }: { content: string; className?: string }) {
    return (
        <span
            className={className}
            dangerouslySetInnerHTML={{ __html: renderWithMath(content) }}
        />
    );
}

type TutorState = "idle" | "generating" | "presenting" | "awaiting_feedback" | "analyzing" | "adapting" | "module_complete";

interface EmotionHistoryEntry {
    timestamp: number;
    emotion: PlutchikEmotion;
    confidence: number;
}

export function MathTutor() {
    const [state, setState] = useState<TutorState>("idle");
    const [selectedTopic, setSelectedTopic] = useState<TopicWithModules | null>(null);
    const [currentModuleIndex, setCurrentModuleIndex] = useState(0);
    const [completedModules, setCompletedModules] = useState<Set<string>>(new Set());
    const [content, setContent] = useState<string>("");
    const [feedback, setFeedback] = useState<string>("");
    const [currentEmotion, setCurrentEmotion] = useState<PlutchikEmotion | null>(null);
    const [emotionConfidence, setEmotionConfidence] = useState<number>(0);
    const [emotionHistory, setEmotionHistory] = useState<EmotionHistoryEntry[]>([]);
    const [adaptationCount, setAdaptationCount] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [understandingSuggestion, setUnderstandingSuggestion] = useState<string>("");

    const currentModule = selectedTopic?.modules[currentModuleIndex] || null;
    const isLastModule = selectedTopic ? currentModuleIndex === selectedTopic.modules.length - 1 : false;
    const allModulesComplete = selectedTopic ? completedModules.size === selectedTopic.modules.length : false;

    const generateModuleContent = useCallback(async (topic: TopicWithModules, module: Module) => {
        setState("generating");
        setError(null);
        setContent("");
        setUnderstandingSuggestion("");

        try {
            const response = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "generateModule",
                    topicId: topic.id,
                    moduleName: module.name,
                    moduleDescription: module.description,
                    moduleOrder: module.order,
                    totalModules: topic.modules.length,
                    stream: true
                }),
            });

            if (!response.ok) throw new Error("Failed to generate module content");

            const reader = response.body?.getReader();
            if (!reader) throw new Error("No reader available");

            const decoder = new TextDecoder();
            let fullContent = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value, { stream: true });
                fullContent += chunk;
                setContent(fullContent);
            }

            setState("awaiting_feedback");
        } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred");
            setState("idle");
        }
    }, []);

    const classifyAndAdapt = useCallback(async () => {
        if (!feedback.trim() || !selectedTopic || !currentModule) return;

        setState("analyzing");
        setError(null);

        try {
            // Step 1: Classify emotion
            const classifyResponse = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "classify", feedback }),
            });

            if (!classifyResponse.ok) throw new Error("Failed to classify emotion");

            const { emotion, adaptationType } = await classifyResponse.json() as {
                emotion: EmotionResponse;
                adaptationType: "anxious" | "confident" | "neutral";
            };

            const detectedEmotion = emotion.top_prediction.label;
            const confidence = emotion.top_prediction.confidence;

            setCurrentEmotion(detectedEmotion);
            setEmotionConfidence(confidence);
            setEmotionHistory(prev => [...prev, {
                timestamp: Date.now(),
                emotion: detectedEmotion,
                confidence
            }]);

            // Step 2: Check if confident emotion with high confidence
            if (adaptationType === "confident" && confidence >= UNDERSTANDING_CONFIDENCE_THRESHOLD) {
                // Check understanding with Gemini
                const understandingResponse = await fetch("/api/chat", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        action: "checkUnderstanding",
                        feedback,
                        moduleContent: content
                    }),
                });

                if (understandingResponse.ok) {
                    const understandingResult = await understandingResponse.json();

                    if (understandingResult.meetsThreshold) {
                        // Student understands! Complete this module
                        setCompletedModules(prev => new Set([...prev, currentModule.id]));
                        setUnderstandingSuggestion(understandingResult.suggestion || "Bagus sekali! 🎉");
                        setState("module_complete");
                        setFeedback("");
                        setAdaptationCount(0);
                        return;
                    } else {
                        setUnderstandingSuggestion(understandingResult.suggestion || "");
                    }
                }
            }

            // Step 3: If neutral, ask for more feedback
            if (adaptationType === "neutral") {
                setState("awaiting_feedback");
                setFeedback("");
                return;
            }

            // Step 4: Adapt content
            setState("adapting");

            const adaptResponse = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "adaptModule",
                    previousContent: content,
                    emotion: adaptationType,
                    topicId: selectedTopic.id,
                    moduleId: currentModule.id,
                    moduleName: currentModule.name,
                    stream: true
                }),
            });

            if (!adaptResponse.ok) throw new Error("Failed to adapt content");

            const reader = adaptResponse.body?.getReader();
            if (!reader) throw new Error("No reader available");

            const decoder = new TextDecoder();
            let fullContent = "";
            setContent("");

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value, { stream: true });
                fullContent += chunk;
                setContent(fullContent);
            }

            setAdaptationCount(prev => prev + 1);
            setState("awaiting_feedback");
            setFeedback("");
        } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred");
            setState("awaiting_feedback");
        }
    }, [feedback, content, selectedTopic, currentModule]);

    const handleNextModule = useCallback(() => {
        if (!selectedTopic || isLastModule) return;

        const nextIndex = currentModuleIndex + 1;
        const nextModule = selectedTopic.modules[nextIndex];

        setCurrentModuleIndex(nextIndex);
        setAdaptationCount(0);
        setUnderstandingSuggestion("");
        generateModuleContent(selectedTopic, nextModule);
    }, [selectedTopic, currentModuleIndex, isLastModule, generateModuleContent]);

    const handleTopicSelect = (topic: TopicWithModules) => {
        setSelectedTopic(topic);
        setCurrentModuleIndex(0);
        setCompletedModules(new Set());
        setEmotionHistory([]);
        setCurrentEmotion(null);
        setAdaptationCount(0);
        generateModuleContent(topic, topic.modules[0]);
    };

    const handleReset = () => {
        setState("idle");
        setSelectedTopic(null);
        setCurrentModuleIndex(0);
        setCompletedModules(new Set());
        setContent("");
        setFeedback("");
        setCurrentEmotion(null);
        setEmotionHistory([]);
        setAdaptationCount(0);
        setError(null);
        setUnderstandingSuggestion("");
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey && state === "awaiting_feedback") {
            e.preventDefault();
            classifyAndAdapt();
        }
    };

    // Idle state - Topic selection
    if (state === "idle" && !selectedTopic) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-primary/5">
                <div className="max-w-4xl w-full space-y-8">
                    {/* Header */}
                    <div className="text-center space-y-4">
                        <div className="flex items-center justify-center gap-3">
                            <div className="p-3 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 backdrop-blur-sm">
                                <Brain className="w-10 h-10 text-primary" />
                            </div>
                            <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                                MoodMath
                            </h1>
                        </div>
                        <p className="text-muted-foreground text-lg max-w-xl mx-auto">
                            Pengalaman belajar yang adaptif sesuai perasaanmu.
                            <br />
                            <span className="text-sm">Pilih topik untuk memulai perjalanan belajarmu.</span>
                        </p>
                    </div>

                    {/* Topic Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {TOPICS_WITH_MODULES.map((topic) => (
                            <Card
                                key={topic.id}
                                className="group cursor-pointer transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 hover:border-primary/50 hover:-translate-y-1"
                                onClick={() => handleTopicSelect(topic)}
                            >
                                <CardHeader className="pb-3">
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <BookOpen className="w-5 h-5 text-primary" />
                                        {topic.name}
                                    </CardTitle>
                                    <CardDescription>{topic.description}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-muted-foreground">
                                            {topic.modules.length} modul
                                        </span>
                                        <div className="flex items-center text-sm text-muted-foreground group-hover:text-primary transition-colors">
                                            Mulai belajar
                                            <ChevronRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // Main learning interface
    return (
        <div className="min-h-screen flex flex-col p-4 md:p-8 bg-gradient-to-br from-background via-background to-primary/5">
            {/* Top Bar */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5">
                        <Brain className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="font-bold text-xl">MoodMath</h1>
                        <p className="text-sm text-muted-foreground">
                            {selectedTopic?.name} • Modul {currentModuleIndex + 1}/{selectedTopic?.modules.length}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <EmotionalPulse
                        emotion={currentEmotion}
                        confidence={emotionConfidence}
                        isAnalyzing={state === "analyzing"}
                    />
                    <Button variant="ghost" size="icon" onClick={handleReset}>
                        <RefreshCw className="w-5 h-5" />
                    </Button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col lg:flex-row gap-6 max-w-7xl mx-auto w-full">
                {/* Content Card */}
                <Card className="flex-1 flex flex-col overflow-hidden border-primary/10 shadow-xl shadow-primary/5">
                    <CardHeader className="border-b border-border/50 bg-gradient-to-r from-primary/5 to-transparent">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-primary" />
                                    {currentModule?.name || "Loading..."}
                                </CardTitle>
                                <CardDescription className="mt-1">
                                    {currentModule?.description}
                                </CardDescription>
                            </div>
                            {adaptationCount > 0 && (
                                <Badge variant="secondary" className="gap-1">
                                    <Heart className="w-3 h-3" />
                                    Disesuaikan {adaptationCount}x
                                </Badge>
                            )}
                        </div>
                    </CardHeader>

                    <CardContent className="flex-1 overflow-auto p-6">
                        {(state === "generating" || state === "adapting") && !content && (
                            <div className="flex items-center justify-center h-full">
                                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                            </div>
                        )}

                        {content && (
                            <div className="prose prose-neutral dark:prose-invert max-w-none">
                                {/* Render markdown-like content with math */}
                                {content.split("\n").map((line, i) => {
                                    if (line.startsWith("# ")) {
                                        return <h1 key={i} className="text-2xl font-bold mt-4 mb-2"><MathLine content={line.slice(2)} /></h1>;
                                    }
                                    if (line.startsWith("## ")) {
                                        return <h2 key={i} className="text-xl font-semibold mt-3 mb-2"><MathLine content={line.slice(3)} /></h2>;
                                    }
                                    if (line.startsWith("### ")) {
                                        return <h3 key={i} className="text-lg font-medium mt-2 mb-1"><MathLine content={line.slice(4)} /></h3>;
                                    }
                                    if (line.startsWith("- ") || line.startsWith("* ")) {
                                        return <li key={i} className="ml-4 list-disc"><MathLine content={line.slice(2)} /></li>;
                                    }
                                    if (line.trim() === "") {
                                        return <br key={i} />;
                                    }
                                    return <p key={i} className="mb-2"><MathLine content={line} /></p>;
                                })}
                            </div>
                        )}

                        {error && (
                            <div className="text-destructive text-center p-4">
                                {error}
                            </div>
                        )}
                    </CardContent>

                    {/* Module Complete State */}
                    {state === "module_complete" && (
                        <div className="border-t border-border/50 p-4 bg-gradient-to-r from-emerald-500/10 to-primary/5">
                            <div className="flex items-center gap-3 mb-4">
                                <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                                <div>
                                    <p className="font-medium text-emerald-500">
                                        Modul Selesai! 🎉
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        {understandingSuggestion || "Kamu sudah memahami materi ini dengan baik!"}
                                    </p>
                                </div>
                            </div>
                            {!isLastModule ? (
                                <Button onClick={handleNextModule} className="w-full gap-2">
                                    Lanjut ke Modul Berikutnya
                                    <ArrowRight className="w-4 h-4" />
                                </Button>
                            ) : allModulesComplete ? (
                                <div className="text-center p-4 rounded-lg bg-gradient-to-r from-emerald-500/20 to-primary/20">
                                    <p className="font-bold text-lg text-emerald-500 mb-2">
                                        🏆 Selamat!
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        Kamu telah menyelesaikan semua modul dalam topik {selectedTopic?.name}!
                                    </p>
                                    <Button onClick={handleReset} variant="outline" className="mt-4">
                                        Pilih Topik Lain
                                    </Button>
                                </div>
                            ) : null}
                        </div>
                    )}

                    {/* Feedback Input */}
                    {state === "awaiting_feedback" && (
                        <div className="border-t border-border/50 p-4 bg-gradient-to-r from-transparent to-primary/5">
                            <div className="flex items-center gap-2 mb-3">
                                <Lightbulb className="w-4 h-4 text-primary" />
                                <span className="text-sm text-muted-foreground">
                                    {understandingSuggestion || "Bagaimana perasaanmu tentang penjelasan ini? Apakah sudah jelas?"}
                                </span>
                            </div>
                            <div className="flex gap-2">
                                <Input
                                    value={feedback}
                                    onChange={(e) => setFeedback(e.target.value)}
                                    onKeyDown={handleKeyPress}
                                    placeholder="Bagikan pikiranmu... (contoh: 'Ini membingungkan' atau 'Aku paham!')"
                                    className="flex-1"
                                />
                                <Button
                                    onClick={classifyAndAdapt}
                                    disabled={!feedback.trim()}
                                    className="gap-2"
                                >
                                    <Send className="w-4 h-4" />
                                    Kirim
                                </Button>
                            </div>
                        </div>
                    )}

                    {(state === "analyzing" || state === "adapting") && (
                        <div className="border-t border-border/50 p-4 bg-gradient-to-r from-transparent to-primary/5">
                            <div className="flex items-center gap-3 text-muted-foreground">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span className="text-sm">
                                    {state === "analyzing" ? "Memahami perasaanmu..." : "Membuat penjelasan yang lebih baik untukmu..."}
                                </span>
                            </div>
                        </div>
                    )}
                </Card>

                {/* Sidebar */}
                <div className="lg:w-80 space-y-4">
                    {/* Module Progress */}
                    <Card className="border-primary/10">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2">
                                <BookOpen className="w-4 h-4 text-primary" />
                                Progres Modul
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {selectedTopic && (
                                <ModuleProgress
                                    modules={selectedTopic.modules}
                                    currentModuleIndex={currentModuleIndex}
                                    completedModules={completedModules}
                                />
                            )}
                        </CardContent>
                    </Card>

                    {/* Emotion History */}
                    <Card className="border-primary/10">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2">
                                <Heart className="w-4 h-4 text-primary" />
                                Perjalanan Emosi
                            </CardTitle>
                            <CardDescription>
                                Emosi belajarmu dari waktu ke waktu
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <EmotionHistory history={emotionHistory} />

                            {emotionHistory.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-border/50 space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Total Feedback</span>
                                        <span className="font-medium">{emotionHistory.length}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Penyesuaian</span>
                                        <span className="font-medium">{adaptationCount}</span>
                                    </div>
                                    {currentEmotion && CONFIDENCE_EMOTIONS.includes(currentEmotion) && (
                                        <div className="mt-3 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                                            <p className="text-sm text-emerald-400 font-medium">
                                                🎉 Kemajuan yang bagus! Kamu sudah percaya diri!
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
