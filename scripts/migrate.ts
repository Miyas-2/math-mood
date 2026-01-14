/**
 * Database migration script - Direct execution
 * Run with: npx tsx scripts/migrate.ts
 */

import pool from '../lib/db';

const schema = `
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Users table with simple auth
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    preference VARCHAR(10) DEFAULT 'text' CHECK (preference IN ('audio', 'text')),
    current_topic_id VARCHAR(50),
    current_module_id VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User progress tracking with skill level
CREATE TABLE IF NOT EXISTS user_progress (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    topic_id VARCHAR(100) NOT NULL,
    module_id VARCHAR(100) NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP,
    quiz_score DECIMAL(5,2),
    attempts INTEGER DEFAULT 0,
    skill_level VARCHAR(20) DEFAULT 'normal' CHECK (skill_level IN ('beginner', 'normal', 'advanced')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, module_id)
);

-- User chapter skill levels (from diagnostic test)
CREATE TABLE IF NOT EXISTS user_chapter_skills (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    chapter_id VARCHAR(100) NOT NULL,
    skill_level VARCHAR(20) DEFAULT 'normal' CHECK (skill_level IN ('beginner', 'normal', 'advanced')),
    diagnostic_score DECIMAL(5,2),
    tested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, chapter_id)
);

-- Math content with vector embeddings for RAG
CREATE TABLE IF NOT EXISTS math_content (
    id SERIAL PRIMARY KEY,
    topic_id VARCHAR(100) NOT NULL,
    module_id VARCHAR(100) NOT NULL,
    chapter VARCHAR(255) NOT NULL,
    section VARCHAR(255),
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    difficulty_level INTEGER DEFAULT 1 CHECK (difficulty_level BETWEEN 1 AND 5),
    is_scaffolding BOOLEAN DEFAULT FALSE,
    parent_content_id INTEGER REFERENCES math_content(id),
    embedding vector(768),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Pre-generated content variants (simple/normal/advanced)
CREATE TABLE IF NOT EXISTS content_variants (
    id SERIAL PRIMARY KEY,
    module_id VARCHAR(100) NOT NULL,
    variant_type VARCHAR(20) NOT NULL CHECK (variant_type IN ('simple', 'normal', 'advanced')),
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(module_id, variant_type)
);

-- Diagnostic questions for pre-test
CREATE TABLE IF NOT EXISTS diagnostic_questions (
    id SERIAL PRIMARY KEY,
    chapter_id VARCHAR(100) NOT NULL,
    question TEXT NOT NULL,
    options JSONB NOT NULL,
    correct_answer INTEGER NOT NULL,
    difficulty_level INTEGER DEFAULT 2 CHECK (difficulty_level BETWEEN 1 AND 5),
    tests_prerequisite VARCHAR(100),
    explanation TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Learning logs for tracking progress
CREATE TABLE IF NOT EXISTS learning_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    content_id INTEGER REFERENCES math_content(id),
    module_id VARCHAR(100) NOT NULL,
    emotion VARCHAR(50),
    emotion_confidence DECIMAL(3,2),
    quiz_passed BOOLEAN,
    quiz_score DECIMAL(5,2),
    feedback_text TEXT,
    action_taken VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Quiz questions table (micro-quiz)
CREATE TABLE IF NOT EXISTS quiz_questions (
    id SERIAL PRIMARY KEY,
    module_id VARCHAR(100) NOT NULL,
    question TEXT NOT NULL,
    options JSONB NOT NULL,
    correct_answer INTEGER NOT NULL,
    explanation TEXT,
    difficulty_level INTEGER DEFAULT 1 CHECK (difficulty_level BETWEEN 1 AND 5),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS math_content_module_idx ON math_content(module_id);
CREATE INDEX IF NOT EXISTS content_variants_module_idx ON content_variants(module_id);
CREATE INDEX IF NOT EXISTS diagnostic_questions_chapter_idx ON diagnostic_questions(chapter_id);
CREATE INDEX IF NOT EXISTS learning_logs_user_idx ON learning_logs(user_id);
CREATE INDEX IF NOT EXISTS quiz_questions_module_idx ON quiz_questions(module_id);
CREATE INDEX IF NOT EXISTS user_progress_user_idx ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS user_chapter_skills_idx ON user_chapter_skills(user_id, chapter_id);

-- Alter existing tables if needed
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_progress' AND column_name = 'skill_level') THEN
        ALTER TABLE user_progress ADD COLUMN skill_level VARCHAR(20) DEFAULT 'normal';
    END IF;
END $$;

-- Create email index if it doesn't exist
CREATE INDEX IF NOT EXISTS users_email_idx ON users(email);
`;

async function migrate() {
    console.log('🚀 Starting database migration...\n');

    try {
        // Execute the full schema at once
        await pool.query(schema);
        console.log('✅ All tables created successfully!');

        // Verify tables exist
        const result = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
        `);

        console.log('\n📋 Tables in database:');
        result.rows.forEach(row => {
            console.log(`   - ${row.table_name}`);
        });

    } catch (error: any) {
        console.error('❌ Migration error:', error.message);
        throw error;
    } finally {
        await pool.end();
    }
}

migrate();
