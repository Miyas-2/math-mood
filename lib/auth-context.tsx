"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";

interface AuthUser {
    id: number;
    name: string;
    email: string;
    preference: 'audio' | 'text';
    // Add missing property relative to API response using camelCase
    isPreferenceSet?: boolean;
    currentTopicId: string | null;
    currentModuleId: string | null;
}

interface AuthContextType {
    user: AuthUser | null;
    isLoading: boolean;
    login: (user: AuthUser) => void;
    logout: () => void;
    updatePreference: (preference: 'audio' | 'text') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Routes that don't require authentication
const PUBLIC_ROUTES = ['/', '/login'];

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        // Check for saved session
        const savedUser = localStorage.getItem('mathtutor_user');
        if (savedUser) {
            try {
                setUser(JSON.parse(savedUser));
            } catch (e) {
                localStorage.removeItem('mathtutor_user');
            }
        }
        setIsLoading(false);
    }, []);

    useEffect(() => {
        // Redirect logic after loading
        if (!isLoading) {
            const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

            if (!user && !isPublicRoute) {
                // Not logged in and trying to access protected route
                router.replace('/login');
            } else if (user) {
                if (pathname === '/login') {
                    // Logged in but on login page
                    router.replace('/dashboard');
                } else if (!user.isPreferenceSet && pathname !== '/preference') {
                    // Preference not set, force redirect to preference page
                    router.replace('/preference');
                }
            }
        }
    }, [user, isLoading, pathname, router]);

    const login = (loggedInUser: AuthUser) => {
        setUser(loggedInUser);
        localStorage.setItem('mathtutor_user', JSON.stringify(loggedInUser));
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('mathtutor_user');
        router.push('/');
    };

    const updatePreference = async (preference: 'audio' | 'text') => {
        if (!user) return;

        try {
            await fetch('/api/auth', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.id,
                    preference,
                    isPreferenceSet: true // Mark as set
                })
            });

            const updatedUser = { ...user, preference, isPreferenceSet: true };
            setUser(updatedUser);
            localStorage.setItem('mathtutor_user', JSON.stringify(updatedUser));
        } catch (error) {
            console.error('Failed to update preference:', error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, login, logout, updatePreference }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

// Protected route wrapper component
export function ProtectedRoute({ children }: { children: ReactNode }) {
    const { user, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-pulse text-muted-foreground">Loading...</div>
            </div>
        );
    }

    if (!user) {
        return null; // Will redirect via useEffect
    }

    return <>{children}</>;
}
