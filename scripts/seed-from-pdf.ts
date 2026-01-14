/**
 * Script to extract content from PDF textbook and seed database
 * Uses pdf-parse library
 * Run with: npx tsx scripts/seed-from-pdf.ts
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import * as fs from 'fs';
import * as path from 'path';
import { query } from '../lib/db';
import pool from '../lib/db';

// Chapter structure based on table of contents
const CHAPTERS = [
    {
        id: 'bab-1', num: 1, name: 'Penjabaran dan Pemfaktoran',
        modules: [
            { id: 'bab1-1', name: 'Menguraikan Bentuk Polinom', pageStart: 3, pageEnd: 13 },
            { id: 'bab1-2', name: 'Memfaktorkan', pageStart: 14, pageEnd: 24 },
            { id: 'bab1-3', name: 'Menggunakan Bentuk Aljabar', pageStart: 25, pageEnd: 33 },
        ]
    },
    {
        id: 'bab-2', num: 2, name: 'Akar Kuadrat',
        modules: [
            { id: 'bab2-1', name: 'Bentuk Akar Kuadrat', pageStart: 37, pageEnd: 44 },
            { id: 'bab2-2', name: 'Perhitungan Akar Kuadrat', pageStart: 44, pageEnd: 56 },
        ]
    },
    {
        id: 'bab-3', num: 3, name: 'Persamaan Kuadrat',
        modules: [
            { id: 'bab3-1', name: 'Menyelesaikan Persamaan Kuadrat', pageStart: 62, pageEnd: 78 },
            { id: 'bab3-2', name: 'Menggunakan Persamaan Kuadrat', pageStart: 79, pageEnd: 85 },
        ]
    },
    {
        id: 'bab-4', num: 4, name: 'Fungsi y = ax²',
        modules: [
            { id: 'bab4-1', name: 'Fungsi y = ax²', pageStart: 89, pageEnd: 111 },
            { id: 'bab4-2', name: 'Macam-Macam Fungsi', pageStart: 111, pageEnd: 118 },
        ]
    },
    {
        id: 'bab-5', num: 5, name: 'Kesebangunan',
        modules: [
            { id: 'bab5-1', name: 'Kesebangunan', pageStart: 125, pageEnd: 138 },
            { id: 'bab5-2', name: 'Garis-Garis Sejajar dan Kesebangunan', pageStart: 138, pageEnd: 150 },
            { id: 'bab5-3', name: 'Kesebangunan dan Pengukuran', pageStart: 150, pageEnd: 160 },
        ]
    },
    {
        id: 'bab-6', num: 6, name: 'Lingkaran',
        modules: [
            { id: 'bab6-1', name: 'Sudut Keliling dan Sudut Pusat', pageStart: 163, pageEnd: 173 },
            { id: 'bab6-2', name: 'Penggunaan Teorema Sudut Keliling', pageStart: 173, pageEnd: 181 },
        ]
    },
    {
        id: 'bab-7', num: 7, name: 'Teorema Pythagoras',
        modules: [
            { id: 'bab7-1', name: 'Teorema Pythagoras', pageStart: 185, pageEnd: 191 },
            { id: 'bab7-2', name: 'Penggunaan Teorema Pythagoras', pageStart: 191, pageEnd: 206 },
        ]
    },
    {
        id: 'bab-8', num: 8, name: 'Survei Sampel',
        modules: [
            { id: 'bab8-1', name: 'Survei Sampel', pageStart: 211, pageEnd: 222 },
        ]
    },
];

async function extractAndSeed() {
    const pdfPath = path.join(process.cwd(), 'rag_content', '2024_Matematika_KLS_IX.pdf');

    if (!fs.existsSync(pdfPath)) {
        console.error(`❌ PDF not found: ${pdfPath}`);
        process.exit(1);
    }

    console.log(`📖 Reading PDF: ${pdfPath}`);

    // Use dynamic import for pdf-parse (CommonJS module)
    const pdfParse = (await import('pdf-parse')).default;

    const dataBuffer = fs.readFileSync(pdfPath);
    const data = await pdfParse(dataBuffer);

    console.log(`📄 Total pages: ${data.numpages}`);
    console.log(`📝 Total characters: ${data.text.length}`);

    // Estimate characters per page
    const charsPerPage = Math.floor(data.text.length / data.numpages);
    console.log(`📊 Average chars per page: ${charsPerPage}`);

    // Clear existing data
    console.log('\n🧹 Clearing existing content...');
    await query('DELETE FROM quiz_questions');
    await query('DELETE FROM math_content');

    let contentCount = 0;

    for (const chapter of CHAPTERS) {
        console.log(`\n📚 BAB ${chapter.num}: ${chapter.name}`);

        for (const module of chapter.modules) {
            // Approximate content extraction based on page positions
            const startPos = (module.pageStart - 1) * charsPerPage;
            const endPos = module.pageEnd * charsPerPage;

            let content = data.text.substring(startPos, endPos);

            // Clean up content
            content = content
                .replace(/\s+/g, ' ')
                .replace(/\n+/g, '\n')
                .trim();

            // Limit to reasonable size
            if (content.length > 4000) {
                content = content.substring(0, 4000) + '...';
            }

            // Fallback if extraction failed
            if (content.length < 100) {
                content = `Materi ${module.name} dari BAB ${chapter.num}: ${chapter.name}. Materi ini mencakup konsep-konsep penting yang akan membantu kamu memahami topik ini.`;
            }

            await query(
                `INSERT INTO math_content 
                 (topic_id, module_id, chapter, section, title, content, difficulty_level, is_scaffolding)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                [
                    chapter.id,
                    module.id,
                    `BAB ${chapter.num}: ${chapter.name}`,
                    module.name,
                    module.name,
                    content,
                    1,
                    false
                ]
            );

            contentCount++;
            console.log(`  ✅ ${module.name} (${content.length} chars)`);
        }
    }

    // Add quiz questions
    console.log('\n📝 Adding quiz questions...');

    const quizzes = [
        { moduleId: 'bab1-1', question: 'Hasil dari (x + 2)(x + 3) adalah...', options: ['x² + 5x + 6', 'x² + 6x + 5', 'x² + 5x + 5', 'x² + 6x + 6'], correct: 0, explanation: '(x+2)(x+3) = x² + 3x + 2x + 6 = x² + 5x + 6' },
        { moduleId: 'bab1-1', question: 'Hasil dari (a + b)² adalah...', options: ['a² + 2ab + b²', 'a² + ab + b²', 'a² - 2ab + b²', 'a² + b²'], correct: 0, explanation: 'Rumus kuadrat: (a+b)² = a² + 2ab + b²' },
        { moduleId: 'bab1-2', question: 'Faktor dari x² + 7x + 12 adalah...', options: ['(x+3)(x+4)', '(x+2)(x+6)', '(x+1)(x+12)', '(x+6)(x+2)'], correct: 0, explanation: '3×4=12 dan 3+4=7, jadi faktornya (x+3)(x+4)' },
        { moduleId: 'bab1-2', question: 'Faktor dari x² - 9 adalah...', options: ['(x+3)(x-3)', '(x+9)(x-1)', '(x+3)(x+3)', '(x-3)(x-3)'], correct: 0, explanation: 'Selisih kuadrat: a²-b² = (a+b)(a-b)' },
        { moduleId: 'bab2-1', question: 'Nilai √144 adalah...', options: ['11', '12', '13', '14'], correct: 1, explanation: '12 × 12 = 144' },
        { moduleId: 'bab2-1', question: 'Bilangan kuadrat sempurna antara 50 dan 70 adalah...', options: ['64', '56', '68', '72'], correct: 0, explanation: '64 = 8², satu-satunya kuadrat sempurna antara 50-70' },
        { moduleId: 'bab2-2', question: 'Bentuk sederhana dari √50 adalah...', options: ['5√2', '2√5', '10√5', '25√2'], correct: 0, explanation: '√50 = √(25×2) = 5√2' },
        { moduleId: 'bab3-1', question: 'Akar dari x² - 5x + 6 = 0 adalah...', options: ['x=2 dan x=3', 'x=-2 dan x=-3', 'x=1 dan x=6', 'x=-1 dan x=-6'], correct: 0, explanation: '(x-2)(x-3)=0, jadi x=2 atau x=3' },
        { moduleId: 'bab3-1', question: 'Bentuk umum persamaan kuadrat adalah...', options: ['ax² + bx + c = 0', 'ax + b = 0', 'ax³ + bx = 0', 'a + bx = c'], correct: 0, explanation: 'Persamaan kuadrat memiliki pangkat tertinggi 2' },
        { moduleId: 'bab3-2', question: 'Jika x² = 49, maka x adalah...', options: ['7', '-7', '±7', '49'], correct: 2, explanation: 'x bisa 7 atau -7' },
        { moduleId: 'bab4-1', question: 'Grafik y = x² membuka ke...', options: ['Atas', 'Bawah', 'Kiri', 'Kanan'], correct: 0, explanation: 'Koefisien a positif, parabola membuka ke atas' },
        { moduleId: 'bab4-1', question: 'Titik puncak y = x² terletak di...', options: ['(0,0)', '(1,1)', '(0,1)', '(1,0)'], correct: 0, explanation: 'Parabola y=x² memiliki puncak di titik asal' },
        { moduleId: 'bab5-1', question: 'Dua segitiga sebangun jika...', options: ['Sudut-sudutnya sama besar', 'Sisi-sisinya sama panjang', 'Luasnya sama', 'Kelilingnya sama'], correct: 0, explanation: 'Kesebangunan ditentukan oleh kesamaan sudut' },
        { moduleId: 'bab6-1', question: 'Sudut keliling yang menghadap busur yang sama adalah...', options: ['Sama besar', 'Berbeda', 'Dua kali lipat', 'Setengahnya'], correct: 0, explanation: 'Sudut keliling menghadap busur sama selalu sama besar' },
        { moduleId: 'bab6-2', question: 'Sudut pusat adalah...sudut keliling yang menghadap busur sama', options: ['Dua kali', 'Setengah', 'Sama dengan', 'Tiga kali'], correct: 0, explanation: 'Sudut pusat = 2 × sudut keliling' },
        { moduleId: 'bab7-1', question: 'Jika a=3, b=4, maka c dalam teorema Pythagoras adalah...', options: ['5', '6', '7', '12'], correct: 0, explanation: 'c² = 3² + 4² = 9 + 16 = 25, c = 5' },
        { moduleId: 'bab7-1', question: 'Teorema Pythagoras berlaku untuk segitiga...', options: ['Siku-siku', 'Sama sisi', 'Sama kaki', 'Sembarang'], correct: 0, explanation: 'a² + b² = c² hanya berlaku untuk segitiga siku-siku' },
        { moduleId: 'bab7-2', question: 'Segitiga dengan sisi 5, 12, 13 adalah segitiga...', options: ['Siku-siku', 'Sama sisi', 'Sama kaki', 'Sembarang'], correct: 0, explanation: '5² + 12² = 25 + 144 = 169 = 13²' },
        { moduleId: 'bab8-1', question: 'Survei sampel digunakan untuk...', options: ['Memprediksi populasi dari sampel', 'Menghitung semua data', 'Membuat grafik', 'Mengurutkan data'], correct: 0, explanation: 'Survei sampel memprediksi karakteristik populasi dari sampel' },
    ];

    for (const q of quizzes) {
        await query(
            `INSERT INTO quiz_questions (module_id, question, options, correct_answer, explanation, difficulty_level)
             VALUES ($1, $2, $3::jsonb, $4, $5, $6)`,
            [q.moduleId, q.question, JSON.stringify(q.options), q.correct, q.explanation, 1]
        );
    }

    console.log(`\n✅ Seeded:`);
    console.log(`   📖 ${contentCount} content items from PDF`);
    console.log(`   📝 ${quizzes.length} quiz questions`);
    console.log('\n🎉 Done!');
}

extractAndSeed()
    .catch(console.error)
    .finally(() => pool.end());
