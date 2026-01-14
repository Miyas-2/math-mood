import { NextRequest, NextResponse } from "next/server";
import { classifyEmotion, getAdaptationType, PlutchikEmotion } from "@/lib/emotion-api";
import { getQuizQuestions, QuizQuestion } from "@/lib/rag";
import { query } from "@/lib/db";

interface EvaluateRequest {
    userId?: number;
    moduleId: string;
    quizAnswers?: Record<string, number>; // questionId -> selected answer index
    feedbackText: string;
}

interface EvaluateResponse {
    emotion: PlutchikEmotion;
    emotionConfidence: number;
    adaptationType: 'anxious' | 'confident' | 'neutral';
    quizPassed: boolean | null;
    quizScore: number | null;
    canProgress: boolean;
    nextAction: 'UNLOCK_NEXT' | 'TRIGGER_SCAFFOLDING' | 'RETRY_QUIZ';
    message: string;
}

// POST: Evaluate student feedback + quiz OR check single answer
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Handle single answer check (for QuizModal)
        if (body.action === 'checkAnswer') {
            const { questionId, selectedAnswer } = body;

            if (questionId === undefined || selectedAnswer === undefined) {
                return NextResponse.json({
                    error: "questionId and selectedAnswer are required"
                }, { status: 400 });
            }

            // Get correct answer from database
            const result = await query(
                `SELECT correct_answer, explanation FROM quiz_questions WHERE id = $1`,
                [questionId]
            );

            if (result.rows.length === 0) {
                return NextResponse.json({
                    error: "Question not found"
                }, { status: 404 });
            }

            const correctAnswer = result.rows[0].correct_answer;
            const isCorrect = selectedAnswer === correctAnswer;

            return NextResponse.json({
                isCorrect,
                correctAnswer,
                explanation: result.rows[0].explanation
            });
        }

        // Original evaluate logic
        const { userId = 1, moduleId, quizAnswers, feedbackText } = body as EvaluateRequest;

        if (!moduleId) {
            return NextResponse.json({ error: "moduleId is required" }, { status: 400 });
        }

        if (!feedbackText) {
            return NextResponse.json({ error: "feedbackText is required" }, { status: 400 });
        }

        // Step 4: Classify emotion via Hugging Face
        const emotionResult = await classifyEmotion(feedbackText);
        const topEmotion = emotionResult.top_prediction.label;
        const confidence = emotionResult.top_prediction.confidence;
        const adaptationType = getAdaptationType(topEmotion);

        // Step 3: Evaluate quiz if answers provided
        let quizPassed: boolean | null = null;
        let quizScore: number | null = null;

        if (quizAnswers && Object.keys(quizAnswers).length > 0) {
            const quizResult = await evaluateQuiz(moduleId, quizAnswers);
            quizPassed = quizResult.passed;
            quizScore = quizResult.score;
        }

        // Step 5: Gatekeeping logic
        const positiveEmotions: PlutchikEmotion[] = ['Joy', 'Trust'];
        const isPositiveEmotion = positiveEmotions.includes(topEmotion);

        // Determine if student can progress
        let canProgress = false;
        let nextAction: 'UNLOCK_NEXT' | 'TRIGGER_SCAFFOLDING' | 'RETRY_QUIZ';
        let message: string;

        if (quizPassed !== null) {
            // Quiz was taken
            if (isPositiveEmotion && quizPassed) {
                canProgress = true;
                nextAction = 'UNLOCK_NEXT';
                message = '🎉 Luar biasa! Kamu sudah memahami materi ini dengan baik. Ayo lanjut ke modul berikutnya!';
            } else if (!quizPassed) {
                canProgress = false;
                nextAction = 'RETRY_QUIZ';
                message = `Nilai quiz: ${(quizScore! * 100).toFixed(0)}%. Coba pelajari lagi materinya dan ulangi quiz ya!`;
            } else {
                // Passed quiz but negative emotion - provide scaffolding
                canProgress = false;
                nextAction = 'TRIGGER_SCAFFOLDING';
                message = 'Kamu lulus quiz! Tapi sepertinya masih ada yang membingungkan. Mari kita pelajari dengan cara yang lebih sederhana.';
            }
        } else {
            // No quiz taken - just emotion-based decision
            if (isPositiveEmotion && confidence >= 0.6) {
                canProgress = true;
                nextAction = 'UNLOCK_NEXT';
                message = 'Bagus! Sepertinya kamu sudah paham. Mau lanjut ke materi berikutnya?';
            } else {
                canProgress = false;
                nextAction = 'TRIGGER_SCAFFOLDING';
                message = 'Tidak apa-apa, mari kita coba pendekatan yang berbeda untuk memahami materi ini.';
            }
        }

        // Log to database
        try {
            await query(
                `INSERT INTO learning_logs 
                 (user_id, module_id, emotion, emotion_confidence, quiz_passed, quiz_score, feedback_text, action_taken)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                [userId, moduleId, topEmotion, confidence, quizPassed, quizScore, feedbackText, nextAction]
            );
        } catch (dbError) {
            console.error('Failed to log to database:', dbError);
            // Continue anyway - logging failure shouldn't block the response
        }

        const response: EvaluateResponse = {
            emotion: topEmotion,
            emotionConfidence: confidence,
            adaptationType,
            quizPassed,
            quizScore,
            canProgress,
            nextAction,
            message
        };

        return NextResponse.json(response);
    } catch (error) {
        console.error("Evaluate API error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Internal server error" },
            { status: 500 }
        );
    }
}

// Helper function to evaluate quiz answers
async function evaluateQuiz(
    moduleId: string,
    answers: Record<string, number>
): Promise<{ passed: boolean; score: number }> {
    // Get correct answers from database
    const questionIds = Object.keys(answers).map(Number);

    if (questionIds.length === 0) {
        return { passed: false, score: 0 };
    }

    const result = await query<QuizQuestion>(
        `SELECT id, correct_answer FROM quiz_questions 
         WHERE id = ANY($1::int[])`,
        [questionIds]
    );

    let correctCount = 0;
    const totalQuestions = result.rows.length;

    for (const question of result.rows) {
        const userAnswer = answers[question.id.toString()];
        if (userAnswer === question.correct_answer) {
            correctCount++;
        }
    }

    const score = totalQuestions > 0 ? correctCount / totalQuestions : 0;
    const passed = score >= 0.6; // 60% threshold

    return { passed, score };
}

// GET: Fetch quiz questions for a module
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const moduleId = searchParams.get('moduleId');
        const limit = parseInt(searchParams.get('limit') || '3');

        if (!moduleId) {
            return NextResponse.json({ error: "moduleId is required" }, { status: 400 });
        }

        const questions = await getQuizQuestions(moduleId, limit);

        // Remove correct_answer from response (client shouldn't know it)
        const sanitizedQuestions = questions.map(q => ({
            id: q.id,
            question: q.question,
            options: q.options,
            // Don't include correct_answer!
        }));

        return NextResponse.json({
            moduleId,
            questions: sanitizedQuestions,
            count: sanitizedQuestions.length
        });
    } catch (error) {
        console.error("Quiz GET error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Internal server error" },
            { status: 500 }
        );
    }
}
