/**
 * Curriculum Structure - SMP Kelas IX (Matematika)
 * Based on official Indonesian curriculum textbook
 */

// Grade levels
export interface GradeLevel {
    id: string;
    name: string;
    shortName: string;
    description: string;
    isAvailable: boolean;
    chapters: Chapter[];
}

// Chapter (BAB)
export interface Chapter {
    id: string;
    number: number;
    name: string;
    startPage: number;
    modules: Module[];
}

// Module (Sub-bab)
export interface Module {
    id: string;
    number: number;
    name: string;
    description?: string;
    startPage?: number;
    isEnrichment?: boolean; // Pengayaan
    isDeepDive?: boolean;   // Pendalaman Materi
}

// Understanding check threshold
export const UNDERSTANDING_CONFIDENCE_THRESHOLD = 0.6;

// Grade 9 - SMP Kelas IX Curriculum
const GRADE_9_CHAPTERS: Chapter[] = [
    {
        id: 'bab-1',
        number: 1,
        name: 'Penjabaran dan Pemfaktoran',
        startPage: 1,
        modules: [
            { id: 'bab1-1', number: 1, name: 'Menguraikan Bentuk Polinom', startPage: 3 },
            { id: 'bab1-1a', number: 1.1, name: 'Pengayaan: Polinom', isEnrichment: true, startPage: 13 },
            { id: 'bab1-2', number: 2, name: 'Memfaktorkan', startPage: 14 },
            { id: 'bab1-2a', number: 2.1, name: 'Pengayaan: Pemfaktoran', isEnrichment: true, startPage: 24 },
            { id: 'bab1-3', number: 3, name: 'Menggunakan Bentuk Aljabar', startPage: 25 },
            { id: 'bab1-deep', number: 0, name: 'Pendalaman: Perkalian Bentuk Vertikal', isDeepDive: true, startPage: 33 },
        ]
    },
    {
        id: 'bab-2',
        number: 2,
        name: 'Akar Kuadrat',
        startPage: 35,
        modules: [
            { id: 'bab2-1', number: 1, name: 'Bentuk Akar Kuadrat', startPage: 37 },
            { id: 'bab2-2', number: 2, name: 'Perhitungan Akar Kuadrat', startPage: 44 },
            { id: 'bab2-2a', number: 2.1, name: 'Pengayaan: Akar Kuadrat', isEnrichment: true, startPage: 56 },
            { id: 'bab2-deep', number: 0, name: 'Pendalaman: Balok dari Kayu Bulat', isDeepDive: true, startPage: 60 },
        ]
    },
    {
        id: 'bab-3',
        number: 3,
        name: 'Persamaan Kuadrat',
        startPage: 61,
        modules: [
            { id: 'bab3-1', number: 1, name: 'Menyelesaikan Persamaan Kuadrat', startPage: 62 },
            { id: 'bab3-1a', number: 1.1, name: 'Pengayaan: Persamaan Kuadrat', isEnrichment: true, startPage: 78 },
            { id: 'bab3-2', number: 2, name: 'Menggunakan Persamaan Kuadrat', startPage: 79 },
            { id: 'bab3-deep', number: 0, name: 'Pendalaman: Pertandingan Round Robin', isDeepDive: true, startPage: 85 },
        ]
    },
    {
        id: 'bab-4',
        number: 4,
        name: 'Fungsi y = ax²',
        startPage: 87,
        modules: [
            { id: 'bab4-1', number: 1, name: 'Fungsi y = ax²', startPage: 89 },
            { id: 'bab4-2', number: 2, name: 'Macam-Macam Fungsi', startPage: 111 },
            { id: 'bab4-deep', number: 0, name: 'Pendalaman: Kecepatan dan Jarak Berhenti', isDeepDive: true, startPage: 118 },
        ]
    },
    {
        id: 'bab-5',
        number: 5,
        name: 'Kesebangunan',
        startPage: 123,
        modules: [
            { id: 'bab5-1', number: 1, name: 'Kesebangunan', startPage: 125 },
            { id: 'bab5-2', number: 2, name: 'Garis-Garis Sejajar dan Kesebangunan', startPage: 138 },
            { id: 'bab5-3', number: 3, name: 'Kesebangunan dan Pengukuran', startPage: 150 },
            { id: 'bab5-deep', number: 0, name: 'Pendalaman: Membuat Pertanyaan', isDeepDive: true, startPage: 160 },
        ]
    },
    {
        id: 'bab-6',
        number: 6,
        name: 'Lingkaran',
        startPage: 161,
        modules: [
            { id: 'bab6-1', number: 1, name: 'Sudut Keliling dan Sudut Pusat', startPage: 163 },
            { id: 'bab6-2', number: 2, name: 'Penggunaan Teorema Sudut Keliling', startPage: 173 },
            { id: 'bab6-deep', number: 0, name: 'Pendalaman: Mencari Letak Kapal', isDeepDive: true, startPage: 181 },
        ]
    },
    {
        id: 'bab-7',
        number: 7,
        name: 'Teorema Pythagoras',
        startPage: 183,
        modules: [
            { id: 'bab7-1', number: 1, name: 'Teorema Pythagoras', startPage: 185 },
            { id: 'bab7-2', number: 2, name: 'Penggunaan Teorema Pythagoras', startPage: 191 },
            { id: 'bab7-deep', number: 0, name: 'Pendalaman: Jangkauan Pandangan dari Gedung', isDeepDive: true, startPage: 206 },
        ]
    },
    {
        id: 'bab-8',
        number: 8,
        name: 'Survei Sampel',
        startPage: 209,
        modules: [
            { id: 'bab8-1', number: 1, name: 'Survei Sampel', startPage: 211 },
            { id: 'bab8-deep', number: 0, name: 'Pendalaman: Prediksi yang Keliru', isDeepDive: true, startPage: 222 },
        ]
    },
];

// All grade levels
export const GRADE_LEVELS: GradeLevel[] = [
    {
        id: 'smp-9',
        name: 'SMP Kelas IX',
        shortName: 'Kelas 9',
        description: 'Matematika SMP Kelas 9 - 8 Bab',
        isAvailable: true,
        chapters: GRADE_9_CHAPTERS,
    },
    {
        id: 'sma-10',
        name: 'SMA Kelas X',
        shortName: 'Kelas 10',
        description: 'Segera Hadir',
        isAvailable: false,
        chapters: [],
    },
    {
        id: 'sma-11',
        name: 'SMA Kelas XI',
        shortName: 'Kelas 11',
        description: 'Segera Hadir',
        isAvailable: false,
        chapters: [],
    },
    {
        id: 'sma-12',
        name: 'SMA Kelas XII',
        shortName: 'Kelas 12',
        description: 'Segera Hadir',
        isAvailable: false,
        chapters: [],
    },
];

// Helper functions
export function getGradeById(gradeId: string): GradeLevel | undefined {
    return GRADE_LEVELS.find(g => g.id === gradeId);
}

export function getChapterById(gradeId: string, chapterId: string): Chapter | undefined {
    const grade = getGradeById(gradeId);
    return grade?.chapters.find(c => c.id === chapterId);
}

export function getModuleById(gradeId: string, chapterId: string, moduleId: string): Module | undefined {
    const chapter = getChapterById(gradeId, chapterId);
    return chapter?.modules.find(m => m.id === moduleId);
}

export function getAllModulesForGrade(gradeId: string): Module[] {
    const grade = getGradeById(gradeId);
    if (!grade) return [];
    return grade.chapters.flatMap(c => c.modules);
}

export function getMainModules(modules: Module[]): Module[] {
    return modules.filter(m => !m.isEnrichment && !m.isDeepDive);
}

// Legacy support - map old format to new
export const TOPICS_WITH_MODULES = GRADE_9_CHAPTERS.map(chapter => ({
    id: chapter.id,
    name: chapter.name,
    description: `BAB ${chapter.number} - Halaman ${chapter.startPage}`,
    modules: chapter.modules.map(m => ({
        id: m.id,
        name: m.name,
        description: m.isEnrichment ? 'Pengayaan' : m.isDeepDive ? 'Pendalaman' : undefined,
    })),
}));

export type TopicWithModules = typeof TOPICS_WITH_MODULES[number];
