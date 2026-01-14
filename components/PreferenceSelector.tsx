"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Volume2, FileText, Headphones, BookOpen } from "lucide-react";

interface PreferenceSelectorProps {
    onSelect: (preference: 'audio' | 'text') => void;
}

export function PreferenceSelector({ onSelect }: PreferenceSelectorProps) {
    const [hoveredPreference, setHoveredPreference] = useState<'audio' | 'text' | null>(null);

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-primary/5">
            <div className="max-w-2xl w-full space-y-8">
                {/* Header */}
                <div className="text-center space-y-4">
                    <div className="flex items-center justify-center gap-3">
                        <div className="p-3 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 backdrop-blur-sm">
                            <BookOpen className="w-10 h-10 text-primary" />
                        </div>
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                            MoodMath
                        </h1>
                    </div>
                    <p className="text-muted-foreground text-lg max-w-xl mx-auto">
                        Selamat datang! Pilih cara belajar yang paling nyaman untukmu.
                    </p>
                </div>

                {/* Preference Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Audio Preference */}
                    <Card
                        className={`group cursor-pointer transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-2 border-2 ${hoveredPreference === 'audio'
                                ? 'border-primary bg-primary/5'
                                : 'border-transparent hover:border-primary/50'
                            }`}
                        onMouseEnter={() => setHoveredPreference('audio')}
                        onMouseLeave={() => setHoveredPreference(null)}
                        onClick={() => onSelect('audio')}
                    >
                        <CardHeader className="text-center pb-2">
                            <div className="mx-auto p-4 rounded-full bg-gradient-to-br from-violet-500/20 to-purple-500/20 mb-4 group-hover:scale-110 transition-transform">
                                <Headphones className="w-12 h-12 text-violet-500" />
                            </div>
                            <CardTitle className="text-2xl flex items-center justify-center gap-2">
                                <Volume2 className="w-5 h-5" />
                                Mode Audio
                            </CardTitle>
                            <CardDescription className="text-base">
                                Dengarkan penjelasan dengan suara
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="text-center">
                            <ul className="text-sm text-muted-foreground space-y-2">
                                <li>✓ Penjelasan dibacakan dengan TTS</li>
                                <li>✓ Kalimat pendek dan jelas</li>
                                <li>✓ Cocok untuk belajar sambil istirahat</li>
                            </ul>
                            <Button
                                className="mt-4 w-full gap-2 bg-violet-500 hover:bg-violet-600"
                                variant="default"
                            >
                                <Volume2 className="w-4 h-4" />
                                Pilih Audio
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Text Preference */}
                    <Card
                        className={`group cursor-pointer transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-2 border-2 ${hoveredPreference === 'text'
                                ? 'border-primary bg-primary/5'
                                : 'border-transparent hover:border-primary/50'
                            }`}
                        onMouseEnter={() => setHoveredPreference('text')}
                        onMouseLeave={() => setHoveredPreference(null)}
                        onClick={() => onSelect('text')}
                    >
                        <CardHeader className="text-center pb-2">
                            <div className="mx-auto p-4 rounded-full bg-gradient-to-br from-emerald-500/20 to-green-500/20 mb-4 group-hover:scale-110 transition-transform">
                                <FileText className="w-12 h-12 text-emerald-500" />
                            </div>
                            <CardTitle className="text-2xl flex items-center justify-center gap-2">
                                <BookOpen className="w-5 h-5" />
                                Mode Teks
                            </CardTitle>
                            <CardDescription className="text-base">
                                Baca penjelasan dengan visual
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="text-center">
                            <ul className="text-sm text-muted-foreground space-y-2">
                                <li>✓ Format terstruktur dengan bullet points</li>
                                <li>✓ Rumus matematika yang jelas</li>
                                <li>✓ Cocok untuk belajar fokus</li>
                            </ul>
                            <Button
                                className="mt-4 w-full gap-2 bg-emerald-500 hover:bg-emerald-600"
                                variant="default"
                            >
                                <FileText className="w-4 h-4" />
                                Pilih Teks
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Note */}
                <p className="text-center text-sm text-muted-foreground">
                    Kamu bisa mengubah preferensi ini kapan saja selama belajar.
                </p>
            </div>
        </div>
    );
}
