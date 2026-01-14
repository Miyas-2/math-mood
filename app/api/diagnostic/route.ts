import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

/**
 * Diagnostic API - Pre-test to determine user skill level for a chapter
 * 
 * GET: Fetch diagnostic questions for a chapter
 * POST: Submit answers and calculate skill level
 */

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const chapterId = searchParams.get('chapterId');
        const limit = parseInt(searchParams.get('limit') || '5');

        if (!chapterId) {
            return NextResponse.json({ error: "chapterId is required" }, { status: 400 });
        }

        // Get diagnostic questions for this chapter
        let questions = await query(
            `SELECT id, question, options, difficulty_level 
             FROM diagnostic_questions 
             WHERE chapter_id = $1 
             ORDER BY difficulty_level, RANDOM() 
             LIMIT $2`,
            [chapterId, limit]
        );

        // If no diagnostic questions, fall back to quiz questions
        if (questions.rows.length === 0) {
            questions = await query(
                `SELECT id, question, options, difficulty_level 
                 FROM quiz_questions 
                 WHERE module_id LIKE $1 
                 ORDER BY difficulty_level, RANDOM() 
                 LIMIT $2`,
                [`${chapterId}%`, limit]
            );
        }

        return NextResponse.json({
            chapterId,
            questions: questions.rows.map(q => ({
                id: q.id,
                question: q.question,
                options: q.options,
                difficulty: q.difficulty_level
            })),
            count: questions.rows.length
        });
    } catch (error) {
        console.error("Diagnostic GET error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Internal server error" },
            { status: 500 }
        );
    }
}

interface DiagnosticSubmission {
    userId: number;
    chapterId: string;
    answers: Array<{
        questionId: number;
        selectedAnswer: number;
    }>;
}

export async function POST(request: NextRequest) {
    try {
        const body: DiagnosticSubmission = await request.json();
        const { userId, chapterId, answers } = body;

        if (!userId || !chapterId || !answers) {
            return NextResponse.json({
                error: "userId, chapterId, and answers are required"
            }, { status: 400 });
        }

        // Get correct answers for submitted questions
        const questionIds = answers.map(a => a.questionId);

        // Try diagnostic_questions first, then quiz_questions
        let correctAnswers = await query(
            `SELECT id, correct_answer, difficulty_level 
             FROM diagnostic_questions 
             WHERE id = ANY($1)`,
            [questionIds]
        );

        if (correctAnswers.rows.length === 0) {
            correctAnswers = await query(
                `SELECT id, correct_answer, difficulty_level 
                 FROM quiz_questions 
                 WHERE id = ANY($1)`,
                [questionIds]
            );
        }

        // Calculate score
        const correctMap = new Map(
            correctAnswers.rows.map(r => [r.id, { correct: r.correct_answer, difficulty: r.difficulty_level }])
        );

        let totalScore = 0;
        let maxScore = 0;
        let correctCount = 0;

        for (const answer of answers) {
            const question = correctMap.get(answer.questionId);
            if (question) {
                const weight = question.difficulty || 1;
                maxScore += weight;
                if (answer.selectedAnswer === question.correct) {
                    totalScore += weight;
                    correctCount++;
                }
            }
        }

        const scorePercent = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;

        // Determine skill level based on score
        let skillLevel: 'beginner' | 'normal' | 'advanced';
        if (scorePercent >= 80) {
            skillLevel = 'advanced';
        } else if (scorePercent >= 50) {
            skillLevel = 'normal';
        } else {
            skillLevel = 'beginner';
        }

        // Save to database
        await query(
            `INSERT INTO user_chapter_skills (user_id, chapter_id, skill_level, diagnostic_score, tested_at)
             VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
             ON CONFLICT (user_id, chapter_id) 
             DO UPDATE SET skill_level = $3, diagnostic_score = $4, tested_at = CURRENT_TIMESTAMP`,
            [userId, chapterId, skillLevel, scorePercent]
        );

        return NextResponse.json({
            chapterId,
            score: Math.round(scorePercent),
            correctCount,
            totalQuestions: answers.length,
            skillLevel,
            message: getSkillMessage(skillLevel)
        });
    } catch (error) {
        console.error("Diagnostic POST error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Internal server error" },
            { status: 500 }
        );
    }
}

function getSkillMessage(level: string): string {
    switch (level) {
        case 'advanced':
            return '🌟 Kamu sudah menguasai dasar-dasar materi ini! Siap untuk tantangan lebih?';
        case 'normal':
            return '👍 Pemahaman kamu sudah cukup baik. Mari kita perkuat lagi!';
        case 'beginner':
            return '📚 Tidak apa-apa, kita akan belajar dari dasar dengan penjelasan yang mudah!';
        default:
            return 'Mari mulai belajar!';
    }
}
