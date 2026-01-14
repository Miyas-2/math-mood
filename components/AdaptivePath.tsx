"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
    ArrowRight,
    BookOpen,
    HelpCircle,
    Lightbulb,
    ChevronDown
} from "lucide-react";

interface AdaptivePathProps {
    isCorrect: boolean;
    onContinue: () => void;
    onRequestSimpler: () => void;
    onRequestHelp: () => void;
    disabled?: boolean;
}

export function AdaptivePath({
    isCorrect,
    onContinue,
    onRequestSimpler,
    onRequestHelp,
    disabled = false
}: AdaptivePathProps) {
    if (isCorrect) {
        return (
            <Card className="border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 to-primary/5">
                <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-full bg-emerald-500/20">
                                <Lightbulb className="w-5 h-5 text-emerald-500" />
                            </div>
                            <div>
                                <p className="font-medium text-emerald-700">Bagus! Kamu paham konsep ini.</p>
                                <p className="text-sm text-muted-foreground">Siap lanjut ke konsep berikutnya?</p>
                            </div>
                        </div>
                        <Button onClick={onContinue} disabled={disabled} className="gap-2">
                            Lanjut <ArrowRight className="w-4 h-4" />
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-amber-500/30 bg-gradient-to-r from-amber-500/10 to-orange-500/5">
            <CardContent className="py-4 space-y-4">
                <div className="flex items-start gap-3">
                    <div className="p-2 rounded-full bg-amber-500/20 mt-0.5">
                        <HelpCircle className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                        <p className="font-medium text-amber-700">Tidak apa-apa! Mari coba lagi.</p>
                        <p className="text-sm text-muted-foreground">
                            Pilih cara yang paling nyaman untukmu:
                        </p>
                    </div>
                </div>

                <div className="grid gap-2">
                    <Button
                        variant="outline"
                        onClick={onRequestHelp}
                        disabled={disabled}
                        className={cn(
                            "justify-start h-auto py-3 px-4",
                            "hover:border-primary hover:bg-primary/5"
                        )}
                    >
                        <BookOpen className="w-5 h-5 mr-3 text-primary" />
                        <div className="text-left">
                            <p className="font-medium">Lihat Penjelasan Ulang</p>
                            <p className="text-xs text-muted-foreground">Baca kembali konsep dengan contoh tambahan</p>
                        </div>
                    </Button>

                    <Button
                        variant="outline"
                        onClick={onRequestSimpler}
                        disabled={disabled}
                        className={cn(
                            "justify-start h-auto py-3 px-4",
                            "hover:border-emerald-500 hover:bg-emerald-500/5"
                        )}
                    >
                        <ChevronDown className="w-5 h-5 mr-3 text-emerald-500" />
                        <div className="text-left">
                            <p className="font-medium">Butuh Contoh Lebih Sederhana</p>
                            <p className="text-xs text-muted-foreground">Penjelasan dengan bahasa yang lebih mudah</p>
                        </div>
                    </Button>
                </div>

                <div className="flex justify-end">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onContinue}
                        disabled={disabled}
                        className="text-muted-foreground"
                    >
                        Lewati dan lanjut →
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
