import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

interface ProgressUpdate {
    userId: number;
    topicId: string;
    moduleId: string;
    completed?: boolean;
    quizScore?: number;
}

// POST /api/progress - Update or create progress entry
export async function POST(request: NextRequest) {
    try {
        const body: ProgressUpdate = await request.json();
        const { userId, topicId, moduleId, completed, quizScore } = body;

        if (!userId || !topicId || !moduleId) {
            return NextResponse.json({ error: "userId, topicId, and moduleId are required" }, { status: 400 });
        }

        // Upsert progress - insert or update if exists
        await query(
            `INSERT INTO user_progress (user_id, topic_id, module_id, completed, quiz_score, attempts, completed_at)
             VALUES ($1, $2, $3, $4, $5, 1, CASE WHEN $4 = true THEN CURRENT_TIMESTAMP ELSE NULL END)
             ON CONFLICT (user_id, module_id)
             DO UPDATE SET 
                completed = COALESCE($4, user_progress.completed),
                quiz_score = COALESCE($5, user_progress.quiz_score),
                attempts = user_progress.attempts + 1,
                completed_at = CASE WHEN $4 = true THEN CURRENT_TIMESTAMP ELSE user_progress.completed_at END`,
            [userId, topicId, moduleId, completed ?? false, quizScore ?? null]
        );

        // Also update user's current position
        await query(
            `UPDATE users SET current_topic_id = $1, current_module_id = $2, updated_at = CURRENT_TIMESTAMP
             WHERE id = $3`,
            [topicId, moduleId, userId]
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Progress POST error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Internal server error" },
            { status: 500 }
        );
    }
}

// GET /api/progress?userId=X&topicId=Y - Get progress for user
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');
        const topicId = searchParams.get('topicId');

        if (!userId) {
            return NextResponse.json({ error: "userId is required" }, { status: 400 });
        }

        let sql = `
            SELECT topic_id, module_id, completed, quiz_score, attempts, completed_at
            FROM user_progress
            WHERE user_id = $1
        `;
        const params: (string | number)[] = [parseInt(userId)];

        if (topicId) {
            sql += ` AND topic_id = $2`;
            params.push(topicId);
        }

        sql += ` ORDER BY created_at ASC`;

        const result = await query<{
            topic_id: string;
            module_id: string;
            completed: boolean;
            quiz_score: number | null;
            attempts: number;
            completed_at: Date | null;
        }>(sql, params);

        // Build completed modules set
        const completedModules = result.rows
            .filter(r => r.completed)
            .map(r => r.module_id);

        return NextResponse.json({
            progress: result.rows.map(p => ({
                topicId: p.topic_id,
                moduleId: p.module_id,
                completed: p.completed,
                quizScore: p.quiz_score,
                attempts: p.attempts,
                completedAt: p.completed_at
            })),
            completedModules
        });
    } catch (error) {
        console.error("Progress GET error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Internal server error" },
            { status: 500 }
        );
    }
}
