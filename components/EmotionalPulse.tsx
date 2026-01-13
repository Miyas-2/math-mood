"use client";

import { PlutchikEmotion, EMOTION_COLORS, EMOTION_EMOJIS } from "@/lib/emotion-api";
import { cn } from "@/lib/utils";

interface EmotionalPulseProps {
    emotion: PlutchikEmotion | null;
    confidence?: number;
    isAnalyzing?: boolean;
}

export function EmotionalPulse({ emotion, confidence, isAnalyzing }: EmotionalPulseProps) {
    if (!emotion && !isAnalyzing) {
        return (
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 backdrop-blur-sm border border-border/50">
                <div className="w-3 h-3 rounded-full bg-muted-foreground/30" />
                <span className="text-sm text-muted-foreground">Awaiting feedback...</span>
            </div>
        );
    }

    if (isAnalyzing) {
        return (
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 backdrop-blur-sm border border-primary/30 animate-pulse">
                <div className="w-3 h-3 rounded-full bg-primary animate-ping" />
                <span className="text-sm text-primary">Analyzing emotion...</span>
            </div>
        );
    }

    const colors = EMOTION_COLORS[emotion!];
    const emoji = EMOTION_EMOJIS[emotion!];

    return (
        <div
            className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-sm border transition-all duration-500",
                colors.bg,
                "border-opacity-50"
            )}
        >
            {/* Animated pulse indicator */}
            <div className="relative">
                <div className={cn(
                    "w-3 h-3 rounded-full bg-gradient-to-r",
                    colors.gradient
                )} />
                <div className={cn(
                    "absolute inset-0 w-3 h-3 rounded-full bg-gradient-to-r animate-ping opacity-75",
                    colors.gradient
                )} />
            </div>

            {/* Emotion label */}
            <span className="text-lg">{emoji}</span>
            <span className={cn("text-sm font-medium", colors.text)}>
                {emotion}
            </span>

            {/* Confidence indicator */}
            {confidence !== undefined && (
                <span className="text-xs text-muted-foreground ml-1">
                    ({Math.round(confidence)}%)
                </span>
            )}
        </div>
    );
}
