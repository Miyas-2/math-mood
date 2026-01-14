"use client";

import { cn } from "@/lib/utils";
import { Check, Lock, Play, ChevronRight } from "lucide-react";

type ModuleStatus = "completed" | "current" | "locked";

interface SimpleModule {
    id: string;
    name: string;
    description?: string;
}

interface ModuleProgressProps {
    modules: SimpleModule[];
    currentModuleIndex: number;
    completedModules: Set<string>;
    onModuleClick?: (module: SimpleModule, index: number) => void;
}

export function ModuleProgress({
    modules,
    currentModuleIndex,
    completedModules,
    onModuleClick,
}: ModuleProgressProps) {
    const getModuleStatus = (index: number): ModuleStatus => {
        const module = modules[index];
        if (completedModules.has(module.id)) return "completed";
        if (index === currentModuleIndex) return "current";
        return "locked";
    };

    const getStatusIcon = (status: ModuleStatus) => {
        switch (status) {
            case "completed":
                return <Check className="w-4 h-4" />;
            case "current":
                return <Play className="w-4 h-4" />;
            case "locked":
                return <Lock className="w-3 h-3" />;
        }
    };

    const getStatusColor = (status: ModuleStatus) => {
        switch (status) {
            case "completed":
                return "bg-emerald-500 text-white border-emerald-500";
            case "current":
                return "bg-primary text-primary-foreground border-primary animate-pulse";
            case "locked":
                return "bg-muted text-muted-foreground border-muted-foreground/30";
        }
    };

    const progressPercent = (completedModules.size / modules.length) * 100;

    return (
        <div className="space-y-4">
            {/* Progress Bar */}
            <div className="space-y-2">
                <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Progres Modul</span>
                    <span className="font-medium">{completedModules.size}/{modules.length}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-primary to-emerald-500 transition-all duration-500"
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>
            </div>

            {/* Module List */}
            <div className="space-y-2">
                {modules.map((module, index) => {
                    const status = getModuleStatus(index);
                    const isClickable = status !== "locked" && onModuleClick;

                    return (
                        <div
                            key={module.id}
                            className={cn(
                                "flex items-center gap-3 p-3 rounded-lg border transition-all duration-200",
                                status === "current" && "bg-primary/5 border-primary/30",
                                status === "completed" && "bg-emerald-500/5 border-emerald-500/30",
                                status === "locked" && "bg-muted/30 border-muted opacity-60",
                                isClickable && "cursor-pointer hover:shadow-md"
                            )}
                            onClick={() => isClickable && onModuleClick(module, index)}
                        >
                            {/* Status Icon */}
                            <div className={cn(
                                "w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0",
                                getStatusColor(status)
                            )}>
                                {getStatusIcon(status)}
                            </div>

                            {/* Module Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className={cn(
                                        "text-xs font-medium px-2 py-0.5 rounded",
                                        status === "current" && "bg-primary/20 text-primary",
                                        status === "completed" && "bg-emerald-500/20 text-emerald-500",
                                        status === "locked" && "bg-muted text-muted-foreground"
                                    )}>
                                        {index + 1}
                                    </span>
                                    {status === "current" && (
                                        <span className="text-xs text-primary font-medium">Sedang dipelajari</span>
                                    )}
                                </div>
                                <h4 className={cn(
                                    "font-medium text-sm mt-1 truncate",
                                    status === "locked" && "text-muted-foreground"
                                )}>
                                    {module.name}
                                </h4>
                                {module.description && (
                                    <p className="text-xs text-muted-foreground">{module.description}</p>
                                )}
                            </div>

                            {/* Arrow for current/completed */}
                            {status !== "locked" && (
                                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Completion Message */}
            {completedModules.size === modules.length && (
                <div className="p-4 rounded-lg bg-gradient-to-r from-emerald-500/10 to-primary/10 border border-emerald-500/30">
                    <p className="text-sm font-medium text-emerald-500 text-center">
                        🎉 Selamat! Kamu telah menyelesaikan semua modul!
                    </p>
                </div>
            )}
        </div>
    );
}
