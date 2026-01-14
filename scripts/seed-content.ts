/**
 * Seed script WITHOUT embeddings - for testing LMS flow
 * Run with: npx tsx scripts/seed-content.ts
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { query } from '../lib/db';
import pool from '../lib/db';

// Module definitions with content from the textbook
const MATH_MODULES = [
    // BAB 1: Penjabaran dan Pemfaktoran
    {
        topicId: 'polynomial',
        moduleId: 'poly-1',
        chapter: 'Bab 1: Penjabaran dan Pemfaktoran',
        contents: [
            {
                section: '1.1 Menguraikan Bentuk Polinom',
                title: 'Perkalian Bentuk Aljabar',
                content: `Perkalian bentuk aljabar menggunakan hukum distributif.

Untuk mengalikan (a + b)(c + d), kita gunakan:
(a + b)(c + d) = ac + ad + bc + bd

Contoh:
(x + 2)(x + 3) = x² + 5x + 6

Rumus-rumus penting:
1. (a + b)² = a² + 2ab + b²
2. (a - b)² = a² - 2ab + b²
3. (a + b)(a - b) = a² - b²`,
                difficulty: 1,
                isScaffolding: false
            },
            {
                section: '1.1 Menguraikan Bentuk Polinom',
                title: 'Pengertian Dasar Perkalian',
                content: `Perkalian adalah penjumlahan berulang. Misalnya:
3 × 4 = 4 + 4 + 4 = 12

Dalam aljabar:
- x mewakili suatu bilangan
- 2x berarti 2 kali x
- x² berarti x kali x`,
                difficulty: 1,
                isScaffolding: true
            }
        ],
        quizzes: [
            {
                question: 'Hasil dari (x + 3)(x + 2) adalah...',
                options: ['x² + 5x + 6', 'x² + 6x + 5', 'x² + 5x + 5', 'x² + 6x + 6'],
                correctAnswer: 0,
                explanation: 'x·x + x·2 + 3·x + 3·2 = x² + 5x + 6'
            }
        ]
    },
    // BAB 3: Persamaan Kuadrat
    {
        topicId: 'quadratic-equations',
        moduleId: 'qe-1',
        chapter: 'Bab 3: Persamaan Kuadrat',
        contents: [
            {
                section: '3.1 Pengenalan Persamaan Kuadrat',
                title: 'Bentuk Umum Persamaan Kuadrat',
                content: `Persamaan kuadrat adalah persamaan dengan pangkat tertinggi 2.

Bentuk umum: ax² + bx + c = 0

Dimana a ≠ 0, dan a, b, c adalah konstanta.

Contoh:
1. x² + 5x + 6 = 0
2. 2x² - 3x + 1 = 0`,
                difficulty: 1,
                isScaffolding: false
            },
            {
                section: '3.1 Pengenalan',
                title: 'Apa itu Pangkat dan Variabel?',
                content: `VARIABEL adalah huruf yang mewakili bilangan. Contoh: x, y, z

PANGKAT menunjukkan perkalian berulang:
- x² = x × x
- x³ = x × x × x`,
                difficulty: 1,
                isScaffolding: true
            }
        ],
        quizzes: [
            {
                question: 'Manakah yang merupakan persamaan kuadrat?',
                options: ['2x + 3 = 0', 'x² + 2x + 1 = 0', 'x³ + x = 5', '√x = 4'],
                correctAnswer: 1,
                explanation: 'Persamaan kuadrat memiliki pangkat tertinggi = 2'
            }
        ]
    },
    {
        topicId: 'quadratic-equations',
        moduleId: 'qe-2',
        chapter: 'Bab 3: Persamaan Kuadrat',
        contents: [
            {
                section: '3.2 Memfaktorkan',
                title: 'Menyelesaikan dengan Pemfaktoran',
                content: `Langkah pemfaktoran:
1. Cari dua bilangan yang perkalian = c dan jumlah = b
2. Faktorkan menjadi (x + p)(x + q) = 0
3. x = -p atau x = -q

Contoh: x² + 5x + 6 = 0
- Perkalian = 6, jumlah = 5 → 2 dan 3
- (x + 2)(x + 3) = 0
- x = -2 atau x = -3`,
                difficulty: 2,
                isScaffolding: false
            }
        ],
        quizzes: [
            {
                question: 'Faktor dari x² + 7x + 12 adalah...',
                options: ['(x + 3)(x + 4)', '(x + 2)(x + 6)', '(x + 1)(x + 12)', '(x + 6)(x + 1)'],
                correctAnswer: 0,
                explanation: 'Perkalian = 12, jumlah = 7. Yaitu 3 dan 4.'
            }
        ]
    },
    {
        topicId: 'quadratic-equations',
        moduleId: 'qe-3',
        chapter: 'Bab 3: Persamaan Kuadrat',
        contents: [
            {
                section: '3.3 Rumus ABC',
                title: 'Rumus Kuadratik',
                content: `Rumus ABC untuk ax² + bx + c = 0:

x = (-b ± √(b² - 4ac)) / 2a

Langkah:
1. Identifikasi a, b, c
2. Hitung D = b² - 4ac
3. Substitusi ke rumus`,
                difficulty: 3,
                isScaffolding: false
            }
        ],
        quizzes: [
            {
                question: 'Akar dari x² - 5x + 6 = 0 adalah...',
                options: ['x = 2 dan x = 3', 'x = -2 dan x = -3', 'x = 1 dan x = 6', 'x = -1 dan x = -6'],
                correctAnswer: 0,
                explanation: 'Faktorkan: (x-2)(x-3) = 0'
            }
        ]
    },
    {
        topicId: 'quadratic-equations',
        moduleId: 'qe-4',
        chapter: 'Bab 3: Persamaan Kuadrat',
        contents: [
            {
                section: '3.4 Diskriminan',
                title: 'Memahami Diskriminan',
                content: `D = b² - 4ac menentukan jenis akar:

- D > 0 → Dua akar berbeda
- D = 0 → Satu akar kembar  
- D < 0 → Tidak ada akar real`,
                difficulty: 3,
                isScaffolding: false
            }
        ],
        quizzes: [
            {
                question: 'Jika D = 0, persamaan kuadrat memiliki...',
                options: ['Dua akar berbeda', 'Satu akar kembar', 'Tidak ada akar real', 'Tiga akar'],
                correctAnswer: 1,
                explanation: 'D = 0 berarti akar kembar'
            }
        ]
    },
    {
        topicId: 'quadratic-equations',
        moduleId: 'qe-5',
        chapter: 'Bab 3: Persamaan Kuadrat',
        contents: [
            {
                section: '3.5 Soal Cerita',
                title: 'Menerapkan Persamaan Kuadrat',
                content: `Langkah soal cerita:
1. Tentukan variabel
2. Susun persamaan
3. Selesaikan
4. Periksa jawaban

Contoh: Keliling persegi panjang 26 cm, luas 42 cm².
- x + y = 13, xy = 42
- x² - 13x + 42 = 0
- x = 6 atau 7`,
                difficulty: 4,
                isScaffolding: false
            }
        ],
        quizzes: [
            {
                question: 'Luas persegi 64 m². Panjang sisinya...',
                options: ['6 m', '7 m', '8 m', '9 m'],
                correctAnswer: 2,
                explanation: 'sisi = √64 = 8 m'
            }
        ]
    },
    // Akar Kuadrat
    {
        topicId: 'square-roots',
        moduleId: 'sqrt-1',
        chapter: 'Bab 2: Akar Kuadrat',
        contents: [
            {
                section: '2.1 Bentuk Akar Kuadrat',
                title: 'Pengertian Akar Kuadrat',
                content: `Akar kuadrat adalah kebalikan dari kuadrat.
Jika a² = b, maka √b = a

Contoh: √9 = 3, √25 = 5, √49 = 7

Bilangan kuadrat sempurna: 1, 4, 9, 16, 25, 36...`,
                difficulty: 1,
                isScaffolding: false
            }
        ],
        quizzes: [
            {
                question: 'Nilai √144 adalah...',
                options: ['11', '12', '13', '14'],
                correctAnswer: 1,
                explanation: '12² = 144'
            }
        ]
    },
    // Pythagoras
    {
        topicId: 'pythagoras',
        moduleId: 'pyth-1',
        chapter: 'Bab 7: Teorema Pythagoras',
        contents: [
            {
                section: '7.1 Teorema Pythagoras',
                title: 'Memahami Teorema Pythagoras',
                content: `Untuk segitiga siku-siku: a² + b² = c²

c = sisi miring (hipotenusa)
a, b = sisi siku-siku

Triple Pythagoras: (3,4,5), (5,12,13), (8,15,17)`,
                difficulty: 2,
                isScaffolding: false
            }
        ],
        quizzes: [
            {
                question: 'Sisi siku-siku 6 cm dan 8 cm. Sisi miringnya...',
                options: ['9 cm', '10 cm', '11 cm', '12 cm'],
                correctAnswer: 1,
                explanation: 'c² = 36 + 64 = 100, c = 10'
            }
        ]
    }
];

async function insertMathContent(
    topicId: string,
    moduleId: string,
    chapter: string,
    section: string | null,
    title: string,
    content: string,
    difficultyLevel: number = 1,
    isScaffolding: boolean = false
): Promise<number> {
    // Insert WITHOUT embedding - will use fallback query in RAG
    const sql = `
        INSERT INTO math_content 
        (topic_id, module_id, chapter, section, title, content, difficulty_level, is_scaffolding)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id
    `;

    const result = await query<{ id: number }>(sql, [
        topicId, moduleId, chapter, section, title, content, difficultyLevel, isScaffolding
    ]);

    return result.rows[0].id;
}

async function insertQuizQuestion(
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

async function seedDatabase() {
    console.log('🌱 Starting database seed (without embeddings)...\n');

    try {
        // Clear existing data
        await query('DELETE FROM quiz_questions');
        await query('DELETE FROM math_content');
        console.log('🧹 Cleared existing content\n');

        for (const module of MATH_MODULES) {
            console.log(`📚 Seeding module: ${module.moduleId}`);

            for (const content of module.contents) {
                console.log(`  ✅ Adding: ${content.title}`);
                await insertMathContent(
                    module.topicId,
                    module.moduleId,
                    module.chapter,
                    content.section,
                    content.title,
                    content.content,
                    content.difficulty,
                    content.isScaffolding
                );
            }

            for (const quiz of module.quizzes) {
                console.log(`  📝 Quiz: ${quiz.question.slice(0, 30)}...`);
                await insertQuizQuestion(
                    module.moduleId,
                    quiz.question,
                    quiz.options,
                    quiz.correctAnswer,
                    quiz.explanation
                );
            }
        }

        const contentCount = await query('SELECT COUNT(*) FROM math_content');
        const quizCount = await query('SELECT COUNT(*) FROM quiz_questions');

        console.log(`\n✅ Seeding completed!`);
        console.log(`   📖 ${contentCount.rows[0].count} content items`);
        console.log(`   📝 ${quizCount.rows[0].count} quiz questions`);

    } catch (error) {
        console.error('❌ Error:', error);
        throw error;
    } finally {
        await pool.end();
    }
}

seedDatabase();
