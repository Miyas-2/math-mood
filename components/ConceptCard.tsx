"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { BookOpen, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";

// Simple markdown to HTML conversion
function renderMarkdown(text: string): string {
    return text
        // Headers
        .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>')
        .replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold mt-6 mb-3">$1</h2>')
        // Bold
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        // Italic
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        // Lists
        .replace(/^\d+\. (.*$)/gim, '<li class="ml-4">$1</li>')
        .replace(/^- (.*$)/gim, '<li class="ml-4 list-disc">$1</li>')
        // LaTeX blocks
        .replace(/\$\$([\s\S]*?)\$\$/g, '<div class="my-2 p-2 bg-muted rounded text-center font-mono">$1</div>')
        // Inline code
        .replace(/`(.*?)`/g, '<code class="px-1 py-0.5 bg-muted rounded text-sm">$1</code>')
        // Paragraphs
        .replace(/\n\n/g, '</p><p class="my-2">')
        // Line breaks
        .replace(/\n/g, '<br/>');
}

interface ConceptCardProps {
    title: string;
    content: string;
    isLoading?: boolean;
    preference?: 'audio' | 'text';
    skillLevel?: 'beginner' | 'normal' | 'advanced';
    onReady?: () => void;
}

export function ConceptCard({
    title,
    content,
    isLoading = false,
    preference = 'text',
    skillLevel = 'normal',
    onReady
}: ConceptCardProps) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [hasReadContent, setHasReadContent] = useState(false);
    const speechRef = useRef<SpeechSynthesisUtterance | null>(null);
    const contentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isLoading && content && onReady) {
            // Delay a bit to ensure content is rendered
            const timer = setTimeout(() => {
                onReady();
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [isLoading, content, onReady]);

    // Auto-scroll as content loads
    useEffect(() => {
        if (contentRef.current) {
            contentRef.current.scrollTop = contentRef.current.scrollHeight;
        }
    }, [content]);

    // Handle scroll to track reading progress
    const handleScroll = () => {
        if (contentRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
            if (scrollTop + clientHeight >= scrollHeight - 50) {
                setHasReadContent(true);
            }
        }
    };

    // Text-to-speech for audio mode
    const handlePlayAudio = () => {
        if (isPlaying) {
            window.speechSynthesis.cancel();
            setIsPlaying(false);
            return;
        }

        // Clean content for speech
        const textContent = content
            .replace(/[#*`$]/g, '')
            .replace(/\n+/g, '. ')
            .substring(0, 5000); // Limit length

        const utterance = new SpeechSynthesisUtterance(textContent);
        utterance.lang = 'id-ID';
        utterance.rate = 0.9;
        utterance.onend = () => {
            setIsPlaying(false);
            setHasReadContent(true);
        };

        speechRef.current = utterance;
        window.speechSynthesis.speak(utterance);
        setIsPlaying(true);
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            window.speechSynthesis.cancel();
        };
    }, []);

    const skillBadge = {
        beginner: { label: 'Dasar', color: 'bg-emerald-500/10 text-emerald-600' },
        normal: { label: 'Standar', color: 'bg-blue-500/10 text-blue-600' },
        advanced: { label: 'Lanjut', color: 'bg-purple-500/10 text-purple-600' }
    }[skillLevel];

    return (
        <Card className="flex-1 flex flex-col overflow-hidden">
            <CardHeader className="pb-3 shrink-0">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-primary" />
                        {title || 'Materi Pembelajaran'}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                        <span className={cn("text-xs px-2 py-1 rounded-full", skillBadge.color)}>
                            {skillBadge.label}
                        </span>
                        {preference === 'audio' && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handlePlayAudio}
                                className="gap-1"
                            >
                                {isPlaying ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                                {isPlaying ? 'Stop' : 'Dengar'}
                            </Button>
                        )}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden">
                <div
                    ref={contentRef}
                    onScroll={handleScroll}
                    className={cn(
                        "h-full overflow-y-auto pr-2",
                        isLoading && "animate-pulse"
                    )}
                >
                    {isLoading ? (
                        <div className="space-y-3">
                            <div className="h-6 bg-muted rounded w-3/4"></div>
                            <div className="h-4 bg-muted rounded w-full"></div>
                            <div className="h-4 bg-muted rounded w-5/6"></div>
                            <div className="h-4 bg-muted rounded w-4/5"></div>
                        </div>
                    ) : (
                        <div
                            className="prose prose-sm max-w-none dark:prose-invert"
                            dangerouslySetInnerHTML={{ __html: `<p>${renderMarkdown(content)}</p>` }}
                        />
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
