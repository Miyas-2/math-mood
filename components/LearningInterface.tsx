"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Play,
    Pause,
    Square,
    Volume2,
    VolumeX,
    RotateCcw,
    Loader2,
    Sparkles,
    Heart,
    AlertCircle,
    ChevronDown,
    ChevronUp
} from "lucide-react";
import katex from "katex";
import "katex/dist/katex.min.css";

interface LearningInterfaceProps {
    content: string;
    isLoading: boolean;
    preference: 'audio' | 'text';
    moduleName: string;
    moduleDescription?: string;
    adaptationCount: number;
    onContentEnd?: () => void;
    isScaffolding?: boolean;
}

// Function to render text with LaTeX math equations
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

    // Replace *italic* with <em> tags
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

// Strip HTML/LaTeX for TTS
function stripForTTS(text: string): string {
    return text
        .replace(/\$\$[^$]+\$\$/g, '') // Remove display math
        .replace(/\$[^$]+\$/g, '') // Remove inline math
        .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold markers
        .replace(/\*([^*]+)\*/g, '$1') // Remove italic markers
        .replace(/#{1,6}\s/g, '') // Remove headers
        .replace(/[-*]\s/g, '') // Remove list markers
        .replace(/---/g, '') // Remove horizontal rules
        .replace(/\n+/g, '. ') // Replace newlines with pauses
        .trim();
}

export function LearningInterface({
    content,
    isLoading,
    preference,
    moduleName,
    moduleDescription,
    adaptationCount,
    onContentEnd,
    isScaffolding = false
}: LearningInterfaceProps) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [speechRate, setSpeechRate] = useState(0.9);
    const [showControls, setShowControls] = useState(true);
    const [currentSentence, setCurrentSentence] = useState(0);
    const [totalSentences, setTotalSentences] = useState(0);

    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
    const contentRef = useRef<HTMLDivElement>(null);

    // Initialize TTS
    useEffect(() => {
        if (preference === 'audio' && content && !isLoading) {
            const sentences = stripForTTS(content).split(/[.!?]+/).filter(s => s.trim());
            setTotalSentences(sentences.length);
        }
    }, [content, isLoading, preference]);

    // Cleanup TTS on unmount
    useEffect(() => {
        return () => {
            if (window.speechSynthesis) {
                window.speechSynthesis.cancel();
            }
        };
    }, []);

    const speak = useCallback(() => {
        if (!content || !window.speechSynthesis) return;

        // Cancel any ongoing speech
        window.speechSynthesis.cancel();

        const textToSpeak = stripForTTS(content);
        const utterance = new SpeechSynthesisUtterance(textToSpeak);

        // Get Indonesian voice if available
        const voices = window.speechSynthesis.getVoices();
        const indonesianVoice = voices.find(v => v.lang.includes('id')) || voices[0];
        if (indonesianVoice) {
            utterance.voice = indonesianVoice;
        }

        utterance.rate = speechRate;
        utterance.pitch = 1;
        utterance.volume = isMuted ? 0 : 1;

        utterance.onstart = () => {
            setIsPlaying(true);
            setIsPaused(false);
        };

        utterance.onend = () => {
            setIsPlaying(false);
            setIsPaused(false);
            onContentEnd?.();
        };

        utterance.onboundary = (event) => {
            if (event.name === 'sentence') {
                setCurrentSentence(prev => prev + 1);
            }
        };

        utteranceRef.current = utterance;
        window.speechSynthesis.speak(utterance);
    }, [content, speechRate, isMuted, onContentEnd]);

    const pauseSpeech = () => {
        if (window.speechSynthesis) {
            window.speechSynthesis.pause();
            setIsPaused(true);
        }
    };

    const resumeSpeech = () => {
        if (window.speechSynthesis) {
            window.speechSynthesis.resume();
            setIsPaused(false);
        }
    };

    const stopSpeech = () => {
        if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
            setIsPlaying(false);
            setIsPaused(false);
            setCurrentSentence(0);
        }
    };

    const toggleMute = () => {
        setIsMuted(!isMuted);
        if (utteranceRef.current) {
            utteranceRef.current.volume = isMuted ? 1 : 0;
        }
    };

    // Auto-play for audio mode when content loads
    useEffect(() => {
        if (preference === 'audio' && content && !isLoading && !isPlaying) {
            // Small delay to ensure content is ready
            const timer = setTimeout(() => {
                speak();
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [content, isLoading, preference, speak, isPlaying]);

    return (
        <Card className="flex-1 flex flex-col overflow-hidden border-primary/10 shadow-xl shadow-primary/5">
            <CardHeader className="border-b border-border/50 bg-gradient-to-r from-primary/5 to-transparent">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-primary" />
                            {moduleName}
                            {isScaffolding && (
                                <Badge variant="secondary" className="ml-2 bg-amber-500/20 text-amber-500">
                                    <AlertCircle className="w-3 h-3 mr-1" />
                                    Penjelasan Lebih Sederhana
                                </Badge>
                            )}
                        </CardTitle>
                        {moduleDescription && (
                            <CardDescription className="mt-1">
                                {moduleDescription}
                            </CardDescription>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        {adaptationCount > 0 && (
                            <Badge variant="secondary" className="gap-1">
                                <Heart className="w-3 h-3" />
                                Disesuaikan {adaptationCount}x
                            </Badge>
                        )}
                        <Badge variant="outline" className={preference === 'audio' ? 'bg-violet-500/10 text-violet-500' : 'bg-emerald-500/10 text-emerald-500'}>
                            {preference === 'audio' ? <Volume2 className="w-3 h-3 mr-1" /> : null}
                            {preference === 'audio' ? 'Audio' : 'Teks'}
                        </Badge>
                    </div>
                </div>
            </CardHeader>

            {/* Audio Controls (only for audio mode) */}
            {preference === 'audio' && (
                <div className="border-b border-border/50 bg-gradient-to-r from-violet-500/5 to-transparent p-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            {!isPlaying ? (
                                <Button
                                    size="sm"
                                    onClick={speak}
                                    disabled={isLoading || !content}
                                    className="gap-2 bg-violet-500 hover:bg-violet-600"
                                >
                                    <Play className="w-4 h-4" />
                                    Putar
                                </Button>
                            ) : isPaused ? (
                                <Button
                                    size="sm"
                                    onClick={resumeSpeech}
                                    className="gap-2 bg-violet-500 hover:bg-violet-600"
                                >
                                    <Play className="w-4 h-4" />
                                    Lanjut
                                </Button>
                            ) : (
                                <Button
                                    size="sm"
                                    onClick={pauseSpeech}
                                    variant="secondary"
                                    className="gap-2"
                                >
                                    <Pause className="w-4 h-4" />
                                    Jeda
                                </Button>
                            )}

                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={stopSpeech}
                                disabled={!isPlaying && !isPaused}
                            >
                                <Square className="w-4 h-4" />
                            </Button>

                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                    stopSpeech();
                                    speak();
                                }}
                            >
                                <RotateCcw className="w-4 h-4" />
                            </Button>

                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={toggleMute}
                            >
                                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                            </Button>
                        </div>

                        {/* Speed Control */}
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">Kecepatan:</span>
                            <select
                                value={speechRate}
                                onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
                                className="text-xs bg-background border rounded px-2 py-1"
                            >
                                <option value="0.7">Lambat</option>
                                <option value="0.9">Normal</option>
                                <option value="1.1">Cepat</option>
                            </select>
                        </div>
                    </div>

                    {/* Progress bar */}
                    {isPlaying && totalSentences > 0 && (
                        <div className="mt-2">
                            <div className="h-1 bg-muted rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-violet-500 transition-all duration-300"
                                    style={{ width: `${(currentSentence / totalSentences) * 100}%` }}
                                />
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Content Area */}
            <CardContent ref={contentRef} className="flex-1 overflow-auto p-6">
                {isLoading && !content && (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center space-y-3">
                            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
                            <p className="text-sm text-muted-foreground">
                                Menyiapkan materi untukmu...
                            </p>
                        </div>
                    </div>
                )}

                {content && (
                    <div className={`prose prose-neutral dark:prose-invert max-w-none ${isPlaying ? 'animate-pulse-subtle' : ''}`}>
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
                            if (line.match(/^\d+\.\s/)) {
                                return <li key={i} className="ml-4 list-decimal"><MathLine content={line.replace(/^\d+\.\s/, '')} /></li>;
                            }
                            if (line.trim() === "" || line.trim() === "---") {
                                return <br key={i} />;
                            }
                            return <p key={i} className="mb-2"><MathLine content={line} /></p>;
                        })}
                    </div>
                )}
            </CardContent>

            {/* Toggle controls visibility */}
            {preference === 'audio' && (
                <div className="border-t border-border/50 p-2 flex justify-center">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowControls(!showControls)}
                        className="text-xs text-muted-foreground"
                    >
                        {showControls ? (
                            <>Sembunyikan Kontrol <ChevronUp className="w-3 h-3 ml-1" /></>
                        ) : (
                            <>Tampilkan Kontrol <ChevronDown className="w-3 h-3 ml-1" /></>
                        )}
                    </Button>
                </div>
            )}
        </Card>
    );
}
