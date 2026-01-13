"use client";

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import { PlutchikEmotion, EMOTION_COLORS } from "@/lib/emotion-api";

interface EmotionHistoryEntry {
    timestamp: number;
    emotion: PlutchikEmotion;
    confidence: number;
}

interface EmotionHistoryProps {
    history: EmotionHistoryEntry[];
}

// Convert emotion to numeric value for charting
const emotionToValue: Record<PlutchikEmotion, number> = {
    Joy: 8,
    Trust: 7,
    Anticipation: 6,
    Surprise: 5,
    Sadness: 4,
    Disgust: 3,
    Anger: 2,
    Fear: 1,
};

const valueToEmotion = Object.entries(emotionToValue).reduce(
    (acc, [emotion, value]) => ({ ...acc, [value]: emotion }),
    {} as Record<number, PlutchikEmotion>
);

export function EmotionHistory({ history }: EmotionHistoryProps) {
    if (history.length === 0) {
        return (
            <div className="h-32 flex items-center justify-center text-muted-foreground text-sm">
                Emotion history will appear here after you provide feedback
            </div>
        );
    }

    const data = history.map((entry, index) => ({
        index: index + 1,
        value: emotionToValue[entry.emotion],
        emotion: entry.emotion,
        confidence: entry.confidence,
        color: EMOTION_COLORS[entry.emotion].gradient.split(" ")[0].replace("from-", ""),
    }));

    const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: typeof data[0] }> }) => {
        if (active && payload && payload.length) {
            const entry = payload[0].payload;
            return (
                <div className="bg-popover/95 backdrop-blur-sm border border-border rounded-lg p-3 shadow-lg">
                    <p className="font-medium">{entry.emotion}</p>
                    <p className="text-sm text-muted-foreground">
                        Confidence: {Math.round(entry.confidence)}%
                    </p>
                </div>
            );
        }
        return null;
    };

    const getGradientColor = (emotion: PlutchikEmotion) => {
        const colors: Record<PlutchikEmotion, string> = {
            Joy: "#10b981",
            Trust: "#0ea5e9",
            Fear: "#8b5cf6",
            Surprise: "#f59e0b",
            Sadness: "#64748b",
            Disgust: "#84cc16",
            Anger: "#f43f5e",
            Anticipation: "#f97316",
        };
        return colors[emotion];
    };

    return (
        <div className="h-32 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                        <linearGradient id="emotionGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <XAxis
                        dataKey="index"
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                    />
                    <YAxis
                        domain={[0, 9]}
                        ticks={[1, 2, 3, 4, 5, 6, 7, 8]}
                        tickFormatter={(value) => valueToEmotion[value]?.[0] || ""}
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                        type="monotone"
                        dataKey="value"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        fill="url(#emotionGradient)"
                        dot={(props) => {
                            const emotion = props.payload.emotion as PlutchikEmotion;
                            return (
                                <circle
                                    cx={props.cx}
                                    cy={props.cy}
                                    r={6}
                                    fill={getGradientColor(emotion)}
                                    stroke="hsl(var(--background))"
                                    strokeWidth={2}
                                />
                            );
                        }}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
