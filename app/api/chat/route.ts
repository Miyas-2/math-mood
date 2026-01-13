import { NextRequest, NextResponse } from "next/server";
import {
    generateMathContent,
    adaptContent,
    streamMathContent,
    streamAdaptedContent,
    streamModuleContent,
    streamAdaptedModuleContent,
    checkUnderstanding,
    UnderstandingCheckResult
} from "@/lib/gemini";
import { classifyEmotion, getAdaptationType } from "@/lib/emotion-api";
import { getTopicById, isLastModule, UNDERSTANDING_CONFIDENCE_THRESHOLD } from "@/lib/modules";

interface ChatRequest {
    action: "generate" | "classify" | "adapt" | "generateModule" | "adaptModule" | "checkUnderstanding";
    topic?: string;
    feedback?: string;
    previousContent?: string;
    emotion?: "anxious" | "confident";
    stream?: boolean;
    // Module-specific fields
    topicId?: string;
    moduleId?: string;
    moduleName?: string;
    moduleDescription?: string;
    moduleOrder?: number;
    totalModules?: number;
    moduleContent?: string;
}

export async function POST(request: NextRequest) {
    try {
        const body: ChatRequest = await request.json();
        const { action, topic, feedback, previousContent, emotion, stream = false } = body;

        // Action: Generate initial math content (legacy)
        if (action === "generate") {
            if (!topic) {
                return NextResponse.json({ error: "Topic is required for generation" }, { status: 400 });
            }

            if (stream) {
                const encoder = new TextEncoder();
                const readable = new ReadableStream({
                    async start(controller) {
                        try {
                            for await (const chunk of streamMathContent(topic)) {
                                controller.enqueue(encoder.encode(chunk));
                            }
                            controller.close();
                        } catch (error) {
                            controller.error(error);
                        }
                    },
                });

                return new Response(readable, {
                    headers: {
                        "Content-Type": "text/plain; charset=utf-8",
                        "Transfer-Encoding": "chunked",
                    },
                });
            }

            const content = await generateMathContent(topic);
            return NextResponse.json({ content });
        }

        // Action: Generate module content
        if (action === "generateModule") {
            const { topicId, moduleName, moduleDescription, moduleOrder, totalModules } = body;

            if (!topicId || !moduleName || !moduleDescription || !moduleOrder || !totalModules) {
                return NextResponse.json({ error: "Module details are required" }, { status: 400 });
            }

            const topicData = getTopicById(topicId);
            if (!topicData) {
                return NextResponse.json({ error: "Topic not found" }, { status: 404 });
            }

            if (stream) {
                const encoder = new TextEncoder();
                const readable = new ReadableStream({
                    async start(controller) {
                        try {
                            for await (const chunk of streamModuleContent(
                                topicData.name,
                                moduleName,
                                moduleDescription,
                                moduleOrder,
                                totalModules
                            )) {
                                controller.enqueue(encoder.encode(chunk));
                            }
                            controller.close();
                        } catch (error) {
                            controller.error(error);
                        }
                    },
                });

                return new Response(readable, {
                    headers: {
                        "Content-Type": "text/plain; charset=utf-8",
                        "Transfer-Encoding": "chunked",
                    },
                });
            }

            return NextResponse.json({ error: "Streaming required for module generation" }, { status: 400 });
        }

        // Action: Adapt module content based on emotion
        if (action === "adaptModule") {
            const { topicId, moduleId, moduleName } = body;

            if (!previousContent || !emotion || !topicId || !moduleId || !moduleName) {
                return NextResponse.json({ error: "Previous content, emotion, and module details are required" }, { status: 400 });
            }

            const isLast = isLastModule(topicId, moduleId);

            if (stream) {
                const encoder = new TextEncoder();
                const readable = new ReadableStream({
                    async start(controller) {
                        try {
                            for await (const chunk of streamAdaptedModuleContent(
                                previousContent,
                                moduleName,
                                emotion,
                                isLast
                            )) {
                                controller.enqueue(encoder.encode(chunk));
                            }
                            controller.close();
                        } catch (error) {
                            controller.error(error);
                        }
                    },
                });

                return new Response(readable, {
                    headers: {
                        "Content-Type": "text/plain; charset=utf-8",
                        "Transfer-Encoding": "chunked",
                    },
                });
            }

            return NextResponse.json({ error: "Streaming required for adaptation" }, { status: 400 });
        }

        // Action: Classify emotion from feedback
        if (action === "classify") {
            if (!feedback) {
                return NextResponse.json({ error: "Feedback text is required for classification" }, { status: 400 });
            }

            const emotionResult = await classifyEmotion(feedback);
            const adaptationType = getAdaptationType(emotionResult.top_prediction.label);

            return NextResponse.json({
                emotion: emotionResult,
                adaptationType,
            });
        }

        // Action: Check understanding using Gemini
        if (action === "checkUnderstanding") {
            const { moduleContent } = body;

            if (!feedback || !moduleContent) {
                return NextResponse.json({ error: "Feedback and module content are required" }, { status: 400 });
            }

            const result = await checkUnderstanding(feedback, moduleContent);

            return NextResponse.json({
                ...result,
                meetsThreshold: result.understood && result.confidence >= UNDERSTANDING_CONFIDENCE_THRESHOLD,
            });
        }

        // Action: Adapt content based on emotion (legacy)
        if (action === "adapt") {
            if (!previousContent) {
                return NextResponse.json({ error: "Previous content is required for adaptation" }, { status: 400 });
            }
            if (!emotion) {
                return NextResponse.json({ error: "Emotion type is required for adaptation" }, { status: 400 });
            }

            if (stream) {
                const encoder = new TextEncoder();
                const readable = new ReadableStream({
                    async start(controller) {
                        try {
                            for await (const chunk of streamAdaptedContent(previousContent, emotion)) {
                                controller.enqueue(encoder.encode(chunk));
                            }
                            controller.close();
                        } catch (error) {
                            controller.error(error);
                        }
                    },
                });

                return new Response(readable, {
                    headers: {
                        "Content-Type": "text/plain; charset=utf-8",
                        "Transfer-Encoding": "chunked",
                    },
                });
            }

            const content = await adaptContent(previousContent, emotion);
            return NextResponse.json({ content });
        }

        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    } catch (error) {
        console.error("Chat API error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Internal server error" },
            { status: 500 }
        );
    }
}

