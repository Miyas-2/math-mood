import { query } from './db';
import { HfInference } from "@huggingface/inference";

// Initialize the Hugging Face client
const hf = new HfInference(process.env.HF_TOKEN);

export interface MathContent {
    id: number;
    topic_id: string;
    module_id: string;
    chapter: string;
    section: string | null;
    title: string;
    content: string;
    difficulty_level: number;
    is_scaffolding: boolean;
}

export interface QuizQuestion {
    id: number;
    module_id: string;
    question: string;
    options: string[];
    correct_answer: number;
    explanation: string | null;
}

/**
 * Generate embedding using HuggingFace sentence-transformers/all-mpnet-base-v2
 * Returns 768-dimensional vector
 */
export async function generateEmbedding(text: string): Promise<number[]> {
    const cleanText = text.trim().replace(/\s+/g, ' ');

    if (!cleanText) {
        throw new Error("Empty text provided for embedding");
    }

    const result = await hf.featureExtraction({
        model: "sentence-transformers/all-mpnet-base-v2",
        inputs: cleanText,
    });

    // Handle the response format
    if (Array.isArray(result)) {
        // For sentence transformers, result is usually a 2D array
        if (result.length > 0) {
            // If it's a nested array, take the first row
            if (Array.isArray(result[0])) {
                return result[0] as number[];
            }
            // If it's already a 1D array of numbers
            if (typeof result[0] === 'number') {
                return result as number[];
            }
        }
    }

    throw new Error("Unexpected embedding response format");
}

/**
 * Similarity search for RAG - retrieves relevant math content
 */
export async function searchMathContent(
    queryText: string,
    moduleId: string,
    limit: number = 3,
    includeScaffolding: boolean = false
): Promise<MathContent[]> {
    const embedding = await generateEmbedding(queryText);
    const embeddingStr = `[${embedding.join(',')}]`;

    const sql = `
        SELECT id, topic_id, module_id, chapter, section, title, content, 
               difficulty_level, is_scaffolding
        FROM math_content
        WHERE module_id = $1
          AND ($2::boolean OR is_scaffolding = false)
        ORDER BY embedding <=> $3::vector
        LIMIT $4
    `;

    const result = await query<MathContent>(sql, [moduleId, includeScaffolding, embeddingStr, limit]);
    return result.rows;
}

/**
 * Get all content for a module (fallback when no embeddings)
 */
export async function getModuleContent(moduleId: string): Promise<MathContent[]> {
    const sql = `
        SELECT id, topic_id, module_id, chapter, section, title, content, 
               difficulty_level, is_scaffolding
        FROM math_content
        WHERE module_id = $1
        ORDER BY difficulty_level ASC, id ASC
    `;

    const result = await query<MathContent>(sql, [moduleId]);
    return result.rows;
}

/**
 * Get scaffolding content (simpler sub-concepts) for a module
 */
export async function getScaffoldingContent(moduleId: string): Promise<MathContent[]> {
    const sql = `
        SELECT id, topic_id, module_id, chapter, section, title, content, 
               difficulty_level, is_scaffolding
        FROM math_content
        WHERE module_id = $1 AND is_scaffolding = true
        ORDER BY difficulty_level ASC
    `;

    const result = await query<MathContent>(sql, [moduleId]);
    return result.rows;
}

/**
 * Get quiz questions for a module
 */
export async function getQuizQuestions(moduleId: string, limit: number = 3): Promise<QuizQuestion[]> {
    const sql = `
        SELECT id, module_id, question, options, correct_answer, explanation
        FROM quiz_questions
        WHERE module_id = $1
        ORDER BY RANDOM()
        LIMIT $2
    `;

    const result = await query<QuizQuestion>(sql, [moduleId, limit]);
    return result.rows;
}

/**
 * Insert new math content with embedding
 */
export async function insertMathContent(
    topicId: string,
    moduleId: string,
    chapter: string,
    section: string | null,
    title: string,
    content: string,
    difficultyLevel: number = 1,
    isScaffolding: boolean = false,
    parentContentId: number | null = null
): Promise<number> {
    const embedding = await generateEmbedding(`${title} ${content}`);
    const embeddingStr = `[${embedding.join(',')}]`;

    const sql = `
        INSERT INTO math_content 
        (topic_id, module_id, chapter, section, title, content, difficulty_level, 
         is_scaffolding, parent_content_id, embedding)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::vector)
        RETURNING id
    `;

    const result = await query<{ id: number }>(sql, [
        topicId, moduleId, chapter, section, title, content,
        difficultyLevel, isScaffolding, parentContentId, embeddingStr
    ]);

    return result.rows[0].id;
}

/**
 * Insert quiz question
 */
export async function insertQuizQuestion(
    moduleId: string,
    question: string,
    options: string[],
    correctAnswer: number,
    explanation: string | null = null,
    difficultyLevel: number = 1
): Promise<number> {
    const sql = `
        INSERT INTO quiz_questions 
        (module_id, question, options, correct_answer, explanation, difficulty_level)
        VALUES ($1, $2, $3::jsonb, $4, $5, $6)
        RETURNING id
    `;

    const result = await query<{ id: number }>(sql, [
        moduleId, question, JSON.stringify(options), correctAnswer, explanation, difficultyLevel
    ]);

    return result.rows[0].id;
}
