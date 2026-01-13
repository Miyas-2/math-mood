// Module System - Structured learning progression for each topic

export interface Module {
    id: string;
    name: string;
    description: string;
    order: number;
}

export interface TopicWithModules {
    id: string;
    name: string;
    description: string;
    modules: Module[];
}

// Module status for tracking progress
export type ModuleStatus = "locked" | "current" | "completed";

export interface ModuleProgress {
    moduleId: string;
    status: ModuleStatus;
    attempts: number;
    understoodAt?: number; // timestamp when understood
}

// Topics with their modules
// Currently focused on Persamaan Kuadrat (5 modules)
export const TOPICS_WITH_MODULES: TopicWithModules[] = [
    {
        id: "quadratic-equations",
        name: "Persamaan Kuadrat",
        description: "Menyelesaikan ax² + bx + c = 0",
        modules: [
            {
                id: "qe-1",
                name: "Pengenalan Persamaan Kuadrat",
                description: "Memahami bentuk umum dan komponen persamaan kuadrat",
                order: 1,
            },
            {
                id: "qe-2",
                name: "Memfaktorkan Persamaan Kuadrat",
                description: "Teknik memfaktorkan untuk mencari akar-akar",
                order: 2,
            },
            {
                id: "qe-3",
                name: "Rumus ABC (Kuadratik)",
                description: "Menggunakan rumus x = (-b ± √(b²-4ac)) / 2a",
                order: 3,
            },
            {
                id: "qe-4",
                name: "Diskriminan",
                description: "Memahami D = b²-4ac dan jenis akar-akar",
                order: 4,
            },
            {
                id: "qe-5",
                name: "Soal Cerita Persamaan Kuadrat",
                description: "Menerapkan persamaan kuadrat dalam masalah nyata",
                order: 5,
            },
        ],
    },
    // Other topics without modules yet - will use single module fallback
    {
        id: "fractions",
        name: "Pecahan",
        description: "Menjumlah, mengurang, mengalikan pecahan",
        modules: [
            {
                id: "frac-1",
                name: "Dasar Pecahan",
                description: "Pengenalan konsep pecahan",
                order: 1,
            },
        ],
    },
    {
        id: "algebra-basics",
        name: "Dasar Aljabar",
        description: "Variabel, ekspresi, dan persamaan sederhana",
        modules: [
            {
                id: "alg-1",
                name: "Dasar Aljabar",
                description: "Pengenalan variabel dan ekspresi",
                order: 1,
            },
        ],
    },
    {
        id: "percentages",
        name: "Persentase",
        description: "Menghitung persentase dan penerapannya",
        modules: [
            {
                id: "pct-1",
                name: "Dasar Persentase",
                description: "Pengenalan konsep persentase",
                order: 1,
            },
        ],
    },
    {
        id: "geometry-basics",
        name: "Dasar Geometri",
        description: "Bentuk, luas, dan keliling",
        modules: [
            {
                id: "geo-1",
                name: "Dasar Geometri",
                description: "Pengenalan bangun datar",
                order: 1,
            },
        ],
    },
    {
        id: "linear-equations",
        name: "Persamaan Linear",
        description: "Menyelesaikan y = mx + b",
        modules: [
            {
                id: "lin-1",
                name: "Dasar Persamaan Linear",
                description: "Pengenalan persamaan linear",
                order: 1,
            },
        ],
    },
];

// Helper functions
export function getTopicById(topicId: string): TopicWithModules | undefined {
    return TOPICS_WITH_MODULES.find((t) => t.id === topicId);
}

export function getModuleById(topicId: string, moduleId: string): Module | undefined {
    const topic = getTopicById(topicId);
    return topic?.modules.find((m) => m.id === moduleId);
}

export function getNextModule(topicId: string, currentModuleId: string): Module | null {
    const topic = getTopicById(topicId);
    if (!topic) return null;

    const currentIndex = topic.modules.findIndex((m) => m.id === currentModuleId);
    if (currentIndex === -1 || currentIndex >= topic.modules.length - 1) return null;

    return topic.modules[currentIndex + 1];
}

export function isLastModule(topicId: string, moduleId: string): boolean {
    const topic = getTopicById(topicId);
    if (!topic) return true;

    const moduleIndex = topic.modules.findIndex((m) => m.id === moduleId);
    return moduleIndex === topic.modules.length - 1;
}

// Understanding threshold
export const UNDERSTANDING_CONFIDENCE_THRESHOLD = 0.6; // 60%
