"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/lib/auth-context";
import { BookOpen, Volume2, ArrowRight, Brain } from "lucide-react";

export default function PreferencePage() {
    const { user, updatePreference } = useAuth();
    const router = useRouter();
    const [step, setStep] = useState<'intro' | 'test' | 'confirm'>('intro');
    const [selected, setSelected] = useState<'text' | 'audio' | null>(null);

    const handleSelect = (pref: 'text' | 'audio') => {
        setSelected(pref);
        setStep('confirm');
    };

    const handleConfirm = async () => {
        if (!selected) return;
        await updatePreference(selected);
        router.push('/dashboard');
    };

    if (!user) {
        // Fallback if accessed directly without login (though protected route should handle)
        return null;
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-primary/5">
            <div className="w-full max-w-2xl px-4">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 mb-4">
                        <Brain className="w-8 h-8 text-primary" />
                    </div>
                    <h1 className="text-3xl font-bold mb-2">Gaya Belajar Kamu</h1>
                    <p className="text-muted-foreground">
                        Bantu AI menyesuaikan cara mengajar agar lebih cocok untukmu
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    {/* Option A: Text Based */}
                    <Card
                        className={`cursor-pointer transition-all hover:scale-105 border-2 ${selected === 'text' ? 'border-primary ring-2 ring-primary/20 bg-primary/5' : 'border-transparent hover:border-primary/50'
                            }`}
                        onClick={() => handleSelect('text')}
                    >
                        <CardContent className="p-6 text-center space-y-4">
                            <div className="w-16 h-16 mx-auto rounded-full bg-blue-500/10 flex items-center justify-center">
                                <BookOpen className="w-8 h-8 text-blue-600" />
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold mb-2">Saya Suka Membaca</h3>
                                <p className="text-sm text-muted-foreground">
                                    Saya lebih cepat paham kalau membaca teks sendiri dan melihat tulisan langsung.
                                </p>
                            </div>
                            <div className="p-3 bg-background rounded-lg text-sm text-left border shadow-sm">
                                <span className="font-medium text-primary">Contoh:</span>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    "Persamaan kuadrat adalah persamaan polinomial orde dua dengan bentuk umum ax² + bx + c = 0."
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Option B: Audio Based */}
                    <Card
                        className={`cursor-pointer transition-all hover:scale-105 border-2 ${selected === 'audio' ? 'border-primary ring-2 ring-primary/20 bg-primary/5' : 'border-transparent hover:border-primary/50'
                            }`}
                        onClick={() => handleSelect('audio')}
                    >
                        <CardContent className="p-6 text-center space-y-4">
                            <div className="w-16 h-16 mx-auto rounded-full bg-purple-500/10 flex items-center justify-center">
                                <Volume2 className="w-8 h-8 text-purple-600" />
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold mb-2">Saya Suka Mendengar</h3>
                                <p className="text-sm text-muted-foreground">
                                    Saya lebih nyaman jika dibacakan atau dijelaskan dengan suara (Text-to-Speech).
                                </p>
                            </div>
                            <div className="p-3 bg-background rounded-lg text-sm text-center border shadow-sm flex items-center justify-center gap-2">
                                <Volume2 className="w-4 h-4 animate-pulse text-purple-600" />
                                <span className="text-xs">
                                    *Suara penjelasan akan otomatis diputar untuk setiap materi*
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Footer Action */}
                <div className="mt-10 text-center">
                    {selected && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                            <p className="mb-4 text-sm font-medium">
                                Kamu memilih: <span className="text-primary font-bold">
                                    {selected === 'text' ? 'Membaca Teks' : 'Mendengarkan Audio'}
                                </span>
                            </p>
                            <Button size="lg" onClick={handleConfirm} className="w-full md:w-auto min-w-[200px]">
                                Konfirmasi & Lanjut <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </div>
                    )}

                    {!selected && (
                        <p className="text-sm text-muted-foreground">
                            Pilih salah satu kartu di atas
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
