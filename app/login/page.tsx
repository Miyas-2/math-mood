"use client";

import { useRouter } from "next/navigation";
import { useAuth, ProtectedRoute } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Brain, ArrowLeft } from "lucide-react";

export default function LoginPage() {
    return <LoginContent />;
}

function LoginContent() {
    const router = useRouter();
    const { user, login } = useAuth();

    // Use the existing AuthScreen component logic inline
    const [mode, setMode] = React.useState<'login' | 'register'>('login');
    const [isLoading, setIsLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [name, setName] = React.useState('');
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');

    // Redirect if already logged in
    React.useEffect(() => {
        if (user) {
            router.replace('/dashboard');
        }
    }, [user, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            const response = await fetch('/api/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: mode,
                    name: mode === 'register' ? name : undefined,
                    email,
                    password
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Authentication failed');
            }

            login(data.user);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Something went wrong');
        } finally {
            setIsLoading(false);
        }
    };

    if (user) return null;

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-primary/5">
            <div className="w-full max-w-md">
                {/* Back button */}
                <Button
                    variant="ghost"
                    size="sm"
                    className="mb-4"
                    onClick={() => router.push('/')}
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Kembali
                </Button>

                <div className="p-6 rounded-2xl border border-border bg-card">
                    {/* Header */}
                    <div className="text-center mb-6">
                        <div className="flex items-center justify-center gap-3 mb-4">
                            <div className="p-3 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5">
                                <Brain className="w-10 h-10 text-primary" />
                            </div>
                            <h1 className="text-3xl font-bold">MoodMath</h1>
                        </div>
                        <h2 className="text-xl font-semibold">
                            {mode === 'login' ? 'Selamat Datang Kembali!' : 'Buat Akun Baru'}
                        </h2>
                        <p className="text-sm text-muted-foreground mt-1">
                            {mode === 'login'
                                ? 'Masuk untuk melanjutkan belajar matematika'
                                : 'Daftar untuk mulai belajar matematika dengan AI'}
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {mode === 'register' && (
                            <div className="space-y-2">
                                <label htmlFor="name" className="text-sm font-medium">Nama</label>
                                <input
                                    id="name"
                                    type="text"
                                    placeholder="Nama lengkap"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    disabled={isLoading}
                                    className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                            </div>
                        )}

                        <div className="space-y-2">
                            <label htmlFor="email" className="text-sm font-medium">Email</label>
                            <input
                                id="email"
                                type="email"
                                placeholder="email@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                disabled={isLoading}
                                className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="password" className="text-sm font-medium">Password</label>
                            <input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
                                disabled={isLoading}
                                className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>

                        {error && (
                            <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-2.5 px-4 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
                        >
                            {isLoading ? 'Loading...' : mode === 'login' ? 'Masuk' : 'Daftar'}
                        </button>

                        <div className="text-center text-sm text-muted-foreground">
                            {mode === 'login' ? (
                                <>
                                    Belum punya akun?{' '}
                                    <button
                                        type="button"
                                        onClick={() => { setMode('register'); setError(null); }}
                                        className="text-primary hover:underline"
                                    >
                                        Daftar
                                    </button>
                                </>
                            ) : (
                                <>
                                    Sudah punya akun?{' '}
                                    <button
                                        type="button"
                                        onClick={() => { setMode('login'); setError(null); }}
                                        className="text-primary hover:underline"
                                    >
                                        Masuk
                                    </button>
                                </>
                            )}
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

import React from "react";
