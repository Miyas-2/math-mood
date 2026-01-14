"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth, ProtectedRoute } from "@/lib/auth-context";
import { Brain, ArrowLeft, Volume2, FileText, Check } from "lucide-react";

export default function SettingsPage() {
    return (
        <ProtectedRoute>
            <SettingsContent />
        </ProtectedRoute>
    );
}

function SettingsContent() {
    const router = useRouter();
    const { user, updatePreference } = useAuth();

    if (!user) return null;

    const handleSavePreference = async (pref: 'audio' | 'text') => {
        await updatePreference(pref);
    };

    return (
        <div className="min-h-screen p-4 bg-gradient-to-br from-background via-background to-primary/5">
            {/* Header */}
            <div className="flex items-center gap-3 mb-8">
                <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard')}>
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5">
                    <Brain className="w-6 h-6 text-primary" />
                </div>
                <span className="font-bold text-xl">Pengaturan</span>
            </div>

            <div className="max-w-md mx-auto space-y-6">
                {/* User Info */}
                <Card>
                    <CardHeader>
                        <CardTitle>Profil</CardTitle>
                        <CardDescription>Informasi akun kamu</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div>
                            <span className="text-sm text-muted-foreground">Nama:</span>
                            <p className="font-medium">{user.name}</p>
                        </div>
                        <div>
                            <span className="text-sm text-muted-foreground">Email:</span>
                            <p className="font-medium">{user.email}</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Preference Selection */}
                <Card>
                    <CardHeader>
                        <CardTitle>Mode Pembelajaran</CardTitle>
                        <CardDescription>Pilih cara belajar yang nyaman untukmu</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-3">
                            <button
                                onClick={() => handleSavePreference('text')}
                                className={`w-full p-4 rounded-lg border-2 transition-all flex items-center gap-3 ${user.preference === 'text'
                                    ? 'border-emerald-500 bg-emerald-500/10'
                                    : 'border-border hover:border-primary/50'
                                    }`}
                            >
                                <div className={`p-2 rounded-lg ${user.preference === 'text' ? 'bg-emerald-500/20' : 'bg-muted'}`}>
                                    <FileText className={`w-5 h-5 ${user.preference === 'text' ? 'text-emerald-500' : 'text-muted-foreground'}`} />
                                </div>
                                <div className="flex-1 text-left">
                                    <p className="font-medium">Mode Teks</p>
                                    <p className="text-sm text-muted-foreground">Penjelasan tertulis dengan markdown dan rumus</p>
                                </div>
                                {user.preference === 'text' && <Check className="w-5 h-5 text-emerald-500" />}
                            </button>

                            <button
                                onClick={() => handleSavePreference('audio')}
                                className={`w-full p-4 rounded-lg border-2 transition-all flex items-center gap-3 ${user.preference === 'audio'
                                    ? 'border-violet-500 bg-violet-500/10'
                                    : 'border-border hover:border-primary/50'
                                    }`}
                            >
                                <div className={`p-2 rounded-lg ${user.preference === 'audio' ? 'bg-violet-500/20' : 'bg-muted'}`}>
                                    <Volume2 className={`w-5 h-5 ${user.preference === 'audio' ? 'text-violet-500' : 'text-muted-foreground'}`} />
                                </div>
                                <div className="flex-1 text-left">
                                    <p className="font-medium">Mode Audio</p>
                                    <p className="text-sm text-muted-foreground">Penjelasan seperti percakapan dengan TTS</p>
                                </div>
                                {user.preference === 'audio' && <Check className="w-5 h-5 text-violet-500" />}
                            </button>
                        </div>

                        <div className="pt-2 border-t text-center">
                            <p className="text-sm text-muted-foreground mb-3">Ingin mencoba ulang test gaya belajar?</p>
                            <Button variant="outline" className="w-full" onClick={() => router.push('/preference')}>
                                <Brain className="w-4 h-4 mr-2" />
                                Test Ulang Gaya Belajar
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Button variant="outline" className="w-full" onClick={() => router.push('/dashboard')}>
                    Kembali ke Dashboard
                </Button>
            </div>
        </div>
    );
}
