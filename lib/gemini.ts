import { GoogleGenerativeAI } from "@google/generative-ai";
import { Module, TopicWithModules } from "./modules";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export const MATH_TOPICS = [
    { id: "quadratic-equations", name: "Persamaan Kuadrat", description: "Menyelesaikan ax² + bx + c = 0" },
    { id: "fractions", name: "Pecahan", description: "Menjumlah, mengurang, mengalikan pecahan" },
    { id: "algebra-basics", name: "Dasar Aljabar", description: "Variabel, ekspresi, dan persamaan sederhana" },
    { id: "percentages", name: "Persentase", description: "Menghitung persentase dan penerapannya" },
    { id: "geometry-basics", name: "Dasar Geometri", description: "Bentuk, luas, dan keliling" },
    { id: "linear-equations", name: "Persamaan Linear", description: "Menyelesaikan y = mx + b" },
] as const;

export type MathTopic = typeof MATH_TOPICS[number];

// Prompt templates - Indonesian for Indonesian students
const INITIAL_PROMPT = (topic: string) => `Kamu adalah tutor matematika yang sabar dan menyemangati. Jelaskan topik berikut kepada siswa:
Topik: ${topic}

Gunakan bahasa yang jelas dan mudah dipahami, pecah konsep yang rumit menjadi bagian-bagian kecil, dan berikan 1-2 contoh sederhana.
Format responmu dengan header markdown dan bullet points agar mudah dibaca.
Untuk rumus matematika, gunakan format LaTeX dengan tanda dollar (contoh: $x^2 + 2x + 1$).
Buat penjelasan sekitar 200-300 kata dalam Bahasa Indonesia.`;

const ANXIETY_PROMPT = (previousContent: string) => `Siswa merasa cemas atau bingung dengan penjelasan sebelumnya.

Konten sebelumnya:
${previousContent}

Tulis ulang penjelasan ini dengan cara:
1. PENYEDERHANAAN EKSTREM - gunakan kata-kata yang lebih sederhana dan kalimat yang lebih pendek
2. Analogi yang mudah dipahami - hubungkan dengan pengalaman sehari-hari (masak, game, belanja, sepak bola)
3. Nada yang menyemangati dan penuh empati - akui kesulitannya, rayakan langkah kecil
4. Pecah menjadi langkah-langkah yang lebih kecil lagi
5. Tambahkan pesan yang menenangkan di akhir

Untuk rumus matematika, gunakan format LaTeX dengan tanda dollar (contoh: $\\frac{a}{b}$).
Buat siswa merasa aman dan didukung. Tulis dalam Bahasa Indonesia sekitar 250 kata.`;

const CONFIDENCE_PROMPT = (previousContent: string) => `Siswa merasa percaya diri dan memahami materi dengan baik!

Konten sebelumnya:
${previousContent}

Sekarang:
1. Akui kemajuan mereka dengan semangat (1-2 kalimat)
2. Perkenalkan sub-topik terkait berikutnya atau tingkatkan kompleksitas sedikit
3. Berikan tantangan dengan contoh yang sedikit lebih sulit
4. Jaga momentum positif

Untuk rumus matematika, gunakan format LaTeX dengan tanda dollar (contoh: $x^2$).
Tulis dalam Bahasa Indonesia sekitar 250 kata.`;

export async function generateMathContent(topic: string): Promise<string> {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const result = await model.generateContent(INITIAL_PROMPT(topic));
    const response = await result.response;
    return response.text();
}

export async function adaptContent(
    previousContent: string,
    emotion: "anxious" | "confident"
): Promise<string> {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = emotion === "anxious"
        ? ANXIETY_PROMPT(previousContent)
        : CONFIDENCE_PROMPT(previousContent);

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
}

// Streaming version for real-time content delivery
export async function* streamMathContent(topic: string): AsyncGenerator<string> {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const result = await model.generateContentStream(INITIAL_PROMPT(topic));

    for await (const chunk of result.stream) {
        yield chunk.text();
    }
}

export async function* streamAdaptedContent(
    previousContent: string,
    emotion: "anxious" | "confident"
): AsyncGenerator<string> {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = emotion === "anxious"
        ? ANXIETY_PROMPT(previousContent)
        : CONFIDENCE_PROMPT(previousContent);

    const result = await model.generateContentStream(prompt);

    for await (const chunk of result.stream) {
        yield chunk.text();
    }
}

// Module-specific prompts
const MODULE_PROMPT = (topicName: string, moduleName: string, moduleDescription: string, moduleOrder: number, totalModules: number) =>
    `Kamu adalah tutor matematika yang sabar dan menyemangati. Jelaskan modul berikut kepada siswa:

Topik: ${topicName}
Modul ${moduleOrder} dari ${totalModules}: ${moduleName}
Deskripsi: ${moduleDescription}

INSTRUKSI:
1. Fokus HANYA pada materi modul ini, jangan membahas materi modul lain
2. Gunakan bahasa yang jelas dan mudah dipahami
3. Berikan 2-3 contoh yang relevan dengan modul ini
4. Format dengan header markdown dan bullet points
5. Untuk rumus matematika, gunakan format LaTeX dengan tanda dollar (contoh: $x^2 + 2x + 1$)

Buat penjelasan sekitar 250-350 kata dalam Bahasa Indonesia.`;

const MODULE_ANXIETY_PROMPT = (previousContent: string, moduleName: string) =>
    `Siswa merasa cemas atau bingung dengan penjelasan modul "${moduleName}".

Konten sebelumnya:
${previousContent}

Tulis ulang penjelasan ini dengan cara:
1. PENYEDERHANAAN EKSTREM - gunakan kata-kata yang lebih sederhana
2. Analogi yang mudah dipahami dari kehidupan sehari-hari
3. Nada yang menyemangati dan penuh empati
4. Pecah menjadi langkah-langkah yang lebih kecil
5. Tambahkan pesan yang menenangkan

Untuk rumus matematika, gunakan format LaTeX dengan tanda dollar.
Buat siswa merasa aman dan didukung. Tulis dalam Bahasa Indonesia sekitar 300 kata.`;

const MODULE_CONFIDENCE_PROMPT = (previousContent: string, moduleName: string, isLastModule: boolean) =>
    `Siswa merasa percaya diri dengan modul "${moduleName}"!

Konten sebelumnya:
${previousContent}

${isLastModule ?
        `Ini adalah modul terakhir! Sekarang:
1. Akui kemajuan mereka dengan semangat
2. Berikan rangkuman singkat dari semua modul yang sudah dipelajari
3. Berikan tantangan akhir atau soal latihan
4. Ucapkan selamat atas penyelesaian topik ini!` :
        `Sekarang:
1. Akui kemajuan mereka dengan semangat (1-2 kalimat)
2. Beri tahu bahwa mereka siap untuk modul berikutnya
3. Berikan preview singkat tentang apa yang akan dipelajari selanjutnya
4. Jaga momentum positif`}

Untuk rumus matematika, gunakan format LaTeX dengan tanda dollar.
Tulis dalam Bahasa Indonesia sekitar 200 kata.`;

// Stream module content
export async function* streamModuleContent(
    topicName: string,
    moduleName: string,
    moduleDescription: string,
    moduleOrder: number,
    totalModules: number
): AsyncGenerator<string> {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const result = await model.generateContentStream(
        MODULE_PROMPT(topicName, moduleName, moduleDescription, moduleOrder, totalModules)
    );

    for await (const chunk of result.stream) {
        yield chunk.text();
    }
}

// Stream adapted module content
export async function* streamAdaptedModuleContent(
    previousContent: string,
    moduleName: string,
    emotion: "anxious" | "confident",
    isLastModule: boolean
): AsyncGenerator<string> {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = emotion === "anxious"
        ? MODULE_ANXIETY_PROMPT(previousContent, moduleName)
        : MODULE_CONFIDENCE_PROMPT(previousContent, moduleName, isLastModule);

    const result = await model.generateContentStream(prompt);

    for await (const chunk of result.stream) {
        yield chunk.text();
    }
}

// Check if student understands the content based on their feedback
export interface UnderstandingCheckResult {
    understood: boolean;
    confidence: number;
    suggestion: string;
}

const UNDERSTANDING_CHECK_PROMPT = (feedback: string, moduleContent: string) =>
    `Analisis apakah siswa memahami materi berdasarkan feedback mereka.

Feedback siswa: "${feedback}"

Materi yang sedang dipelajari (ringkasan):
${moduleContent.slice(0, 500)}...

Berikan response dalam format JSON SAJA tanpa markdown atau teks lain:
{
  "understood": true/false,
  "confidence": 0.0-1.0,
  "suggestion": "saran singkat jika belum paham, atau pujian singkat jika sudah paham"
}

Kriteria "understood = true":
- Feedback menunjukkan pemahaman konsep (contoh: "oh jadi begitu", "aku paham sekarang", "masuk akal")
- Feedback menunjukkan kepercayaan diri positif
- Tidak ada kebingungan atau pertanyaan

Kriteria "understood = false":
- Ada pertanyaan atau kebingungan
- Feedback menunjukkan kesulitan
- Ekspresi negatif atau cemas`;

export async function checkUnderstanding(
    feedback: string,
    moduleContent: string
): Promise<UnderstandingCheckResult> {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    try {
        const result = await model.generateContent(UNDERSTANDING_CHECK_PROMPT(feedback, moduleContent));
        const response = await result.response;
        const text = response.text().trim();

        // Try to parse JSON from response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            return {
                understood: Boolean(parsed.understood),
                confidence: Number(parsed.confidence) || 0.5,
                suggestion: String(parsed.suggestion) || "",
            };
        }
    } catch (error) {
        console.error("Understanding check error:", error);
    }

    // Default fallback
    return {
        understood: false,
        confidence: 0.5,
        suggestion: "Coba jelaskan dengan kata-katamu sendiri apa yang sudah kamu pahami.",
    };
}
