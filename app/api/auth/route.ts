import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import bcrypt from "bcryptjs";

interface RegisterRequest {
    name: string;
    email: string;
    password: string;
}

interface LoginRequest {
    email: string;
    password: string;
}

interface User {
    id: number;
    name: string;
    email: string;
    password_hash: string;
    preference: 'audio' | 'text';
    is_preference_set: boolean;
    current_topic_id: string | null;
    current_module_id: string | null;
}

// POST /api/auth - Register or Login
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { action } = body;

        if (action === 'register') {
            return await handleRegister(body);
        } else if (action === 'login') {
            return await handleLogin(body);
        } else {
            return NextResponse.json({ error: "Invalid action. Use 'register' or 'login'" }, { status: 400 });
        }
    } catch (error) {
        console.error("Auth API error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Internal server error" },
            { status: 500 }
        );
    }
}

async function handleRegister(body: RegisterRequest & { action: string }) {
    const { name, email, password } = body;

    if (!name || !email || !password) {
        return NextResponse.json({ error: "Name, email, and password are required" }, { status: 400 });
    }

    if (password.length < 6) {
        return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    // Check if email already exists
    const existing = await query<User>(
        'SELECT id FROM users WHERE email = $1',
        [email.toLowerCase()]
    );

    if (existing.rows.length > 0) {
        return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const result = await query<User>(
        `INSERT INTO users (name, email, password_hash, preference, is_preference_set)
         VALUES ($1, $2, $3, 'text', FALSE)
         RETURNING id, name, email, preference, is_preference_set, current_topic_id, current_module_id`,
        [name, email.toLowerCase(), passwordHash]
    );

    const user = result.rows[0];

    return NextResponse.json({
        success: true,
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            preference: user.preference,
            isPreferenceSet: user.is_preference_set, // Map snake_case to camelCase
            currentTopicId: user.current_topic_id,
            currentModuleId: user.current_module_id
        }
    });
}

async function handleLogin(body: LoginRequest & { action: string }) {
    const { email, password } = body;

    if (!email || !password) {
        return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    // Find user
    const result = await query<User>(
        `SELECT id, name, email, password_hash, preference, is_preference_set, current_topic_id, current_module_id
         FROM users WHERE email = $1`,
        [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
        return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const user = result.rows[0];

    // Verify password
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
        return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    return NextResponse.json({
        success: true,
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            preference: user.preference,
            isPreferenceSet: user.is_preference_set,
            currentTopicId: user.current_topic_id,
            currentModuleId: user.current_module_id
        }
    });
}

// GET /api/auth?userId=X - Get user profile and progress
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({ error: "userId is required" }, { status: 400 });
        }

        // Get user info
        const userResult = await query<User>(
            `SELECT id, name, email, preference, is_preference_set, current_topic_id, current_module_id
             FROM users WHERE id = $1`,
            [parseInt(userId)]
        );

        if (userResult.rows.length === 0) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const user = userResult.rows[0];

        // Get progress
        const progressResult = await query<{
            topic_id: string;
            module_id: string;
            completed: boolean;
            quiz_score: number | null;
        }>(
            `SELECT topic_id, module_id, completed, quiz_score
             FROM user_progress
             WHERE user_id = $1
             ORDER BY created_at ASC`,
            [parseInt(userId)]
        );

        return NextResponse.json({
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                preference: user.preference,
                isPreferenceSet: user.is_preference_set,
                currentTopicId: user.current_topic_id,
                currentModuleId: user.current_module_id
            },
            progress: progressResult.rows.map(p => ({
                topicId: p.topic_id,
                moduleId: p.module_id,
                completed: p.completed,
                quizScore: p.quiz_score
            }))
        });
    } catch (error) {
        console.error("Auth GET error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Internal server error" },
            { status: 500 }
        );
    }
}

// PUT /api/auth - Update user preference or current module
export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { userId, preference, isPreferenceSet, currentTopicId, currentModuleId } = body;

        if (!userId) {
            return NextResponse.json({ error: "userId is required" }, { status: 400 });
        }

        const updates: string[] = [];
        const values: (string | number | boolean)[] = [];
        let paramCount = 1;

        if (preference) {
            updates.push(`preference = $${paramCount++}`);
            values.push(preference);
        }
        if (isPreferenceSet !== undefined) {
            updates.push(`is_preference_set = $${paramCount++}`);
            values.push(isPreferenceSet);
        }
        if (currentTopicId !== undefined) {
            updates.push(`current_topic_id = $${paramCount++}`);
            values.push(currentTopicId);
        }
        if (currentModuleId !== undefined) {
            updates.push(`current_module_id = $${paramCount++}`);
            values.push(currentModuleId);
        }

        updates.push(`updated_at = CURRENT_TIMESTAMP`);
        values.push(userId);

        await query(
            `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramCount}`,
            values
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Auth PUT error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Internal server error" },
            { status: 500 }
        );
    }
}
