-- MoodMath PostgreSQL Schema
-- PostgreSQL 16 with pgvector 0.8.1

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Custom enum for Plutchik emotions
DO $$ BEGIN
    CREATE TYPE plutchik_emotion AS ENUM (
        'Joy', 'Fear', 'Anger', 'Trust', 'Disgust', 'Sadness', 'Surprise', 'Anticipation'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Users table (simplified - no auth)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL DEFAULT 'Student',
    preference VARCHAR(10) DEFAULT 'text' CHECK (preference IN ('audio', 'text')),
    current_module_id VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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

-- Learning logs for tracking progress
CREATE TABLE IF NOT EXISTS learning_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    content_id INTEGER REFERENCES math_content(id),
    module_id VARCHAR(100) NOT NULL,
    emotion plutchik_emotion,
    emotion_confidence DECIMAL(3,2),
    quiz_passed BOOLEAN,
    quiz_score DECIMAL(5,2),
    feedback_text TEXT,
    action_taken VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Quiz questions table
CREATE TABLE IF NOT EXISTS quiz_questions (
    id SERIAL PRIMARY KEY,
    module_id VARCHAR(100) NOT NULL,
    question TEXT NOT NULL,
    options JSONB NOT NULL, -- Array of options
    correct_answer INTEGER NOT NULL, -- Index of correct option
    explanation TEXT,
    difficulty_level INTEGER DEFAULT 1 CHECK (difficulty_level BETWEEN 1 AND 5),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for vector similarity search (IVFFlat for pgvector 0.8.1)
CREATE INDEX IF NOT EXISTS math_content_embedding_idx 
ON math_content USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Index for faster module lookups
CREATE INDEX IF NOT EXISTS math_content_module_idx ON math_content(module_id);
CREATE INDEX IF NOT EXISTS learning_logs_user_idx ON learning_logs(user_id);
CREATE INDEX IF NOT EXISTS quiz_questions_module_idx ON quiz_questions(module_id);

-- Insert default user for local development
INSERT INTO users (name, preference) 
VALUES ('Student', 'text')
ON CONFLICT DO NOTHING;
