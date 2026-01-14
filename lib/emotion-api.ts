// Hugging Face Emotion API wrapper for Plutchik-based emotion classification

const HF_EMOTION_URL = "https://miyas-2-plutchik-emotion-indobert-lite.hf.space/predict";

export type PlutchikEmotion =
    | "Joy"
    | "Fear"
    | "Anger"
    | "Trust"
    | "Disgust"
    | "Sadness"
    | "Surprise"
    | "Anticipation";

export interface EmotionPrediction {
    label: PlutchikEmotion;
    confidence: number;
}

export interface EmotionResponse {
    top_prediction: EmotionPrediction;
    all_predictions: Record<PlutchikEmotion, number>;
}

// Emotion categories for adaptive logic
export const ANXIETY_EMOTIONS: PlutchikEmotion[] = ["Fear", "Anger", "Sadness", "Disgust"];
export const CONFIDENCE_EMOTIONS: PlutchikEmotion[] = ["Joy", "Trust"];
export const NEUTRAL_EMOTIONS: PlutchikEmotion[] = ["Surprise", "Anticipation"];

// Emotion color mapping for UI
export const EMOTION_COLORS: Record<PlutchikEmotion, { bg: string; text: string; gradient: string }> = {
    Joy: { bg: "bg-emerald-500/20", text: "text-emerald-400", gradient: "from-emerald-500 to-green-400" },
    Trust: { bg: "bg-sky-500/20", text: "text-sky-400", gradient: "from-sky-500 to-blue-400" },
    Fear: { bg: "bg-violet-500/20", text: "text-violet-400", gradient: "from-violet-500 to-purple-400" },
    Surprise: { bg: "bg-amber-500/20", text: "text-amber-400", gradient: "from-amber-500 to-yellow-400" },
    Sadness: { bg: "bg-slate-500/20", text: "text-slate-400", gradient: "from-slate-500 to-gray-400" },
    Disgust: { bg: "bg-lime-500/20", text: "text-lime-400", gradient: "from-lime-500 to-green-600" },
    Anger: { bg: "bg-rose-500/20", text: "text-rose-400", gradient: "from-rose-500 to-red-400" },
    Anticipation: { bg: "bg-orange-500/20", text: "text-orange-400", gradient: "from-orange-500 to-amber-400" },
};

// Emotion emoji mapping
export const EMOTION_EMOJIS: Record<PlutchikEmotion, string> = {
    Joy: "😊",
    Trust: "🤝",
    Fear: "😰",
    Surprise: "😮",
    Sadness: "😢",
    Disgust: "😖",
    Anger: "😤",
    Anticipation: "🤔",
};

// Normalize emotion label to match our expected format (Title Case)
function normalizeEmotionLabel(label: string): PlutchikEmotion {
    const normalized = label.charAt(0).toUpperCase() + label.slice(1).toLowerCase();
    const validEmotions: PlutchikEmotion[] = ["Joy", "Fear", "Anger", "Trust", "Disgust", "Sadness", "Surprise", "Anticipation"];

    if (validEmotions.includes(normalized as PlutchikEmotion)) {
        return normalized as PlutchikEmotion;
    }

    // Fallback mappings for potential alternate labels
    const labelMap: Record<string, PlutchikEmotion> = {
        "happy": "Joy",
        "happiness": "Joy",
        "confident": "Trust",
        "confidence": "Trust",
        "scared": "Fear",
        "afraid": "Fear",
        "mad": "Anger",
        "angry": "Anger",
        "sad": "Sadness",
        "disgusted": "Disgust",
        "surprised": "Surprise",
        "neutral": "Anticipation", // Default neutral to Anticipation
    };

    const lowerLabel = label.toLowerCase();
    return labelMap[lowerLabel] || "Anticipation"; // Safe fallback
}

export async function classifyEmotion(text: string): Promise<EmotionResponse> {
    const url = `${HF_EMOTION_URL}?text=${encodeURIComponent(text)}`;

    try {
        const response = await fetch(url, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${process.env.HF_TOKEN}`,
            },
            // Add timeout signal to prevent long hanging
            signal: AbortSignal.timeout(5000) // 5 second timeout
        });

        if (!response.ok) {
            throw new Error(`Emotion API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        // Normalize the label from the API response
        const normalizedLabel = normalizeEmotionLabel(data.top_prediction?.label || "Anticipation");

        return {
            top_prediction: {
                label: normalizedLabel,
                confidence: data.top_prediction?.confidence || 0,
            },
            all_predictions: data.all_predictions || {},
        };
    } catch (error) {
        console.warn("⚠️ Emotion API failed, using fallback:", error);

        // Fallback to "Trust" (Positive) so technical issues don't block progress
        // if the user passes the quiz.
        return {
            top_prediction: {
                label: "Trust",
                confidence: 0.8, // Fake high confidence
            },
            all_predictions: {
                "Trust": 0.8,
                "Joy": 0.1,
                "Anticipation": 0.1,
                "Surprise": 0,
                "Fear": 0,
                "Anger": 0,
                "Sadness": 0,
                "Disgust": 0
            } as Record<PlutchikEmotion, number>
        };
    }
}

export function getAdaptationType(emotion: PlutchikEmotion): "anxious" | "confident" | "neutral" {
    if (ANXIETY_EMOTIONS.includes(emotion)) return "anxious";
    if (CONFIDENCE_EMOTIONS.includes(emotion)) return "confident";
    return "neutral";
}
