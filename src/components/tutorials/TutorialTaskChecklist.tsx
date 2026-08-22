"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Circle, Sparkles, Lightbulb } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export interface TaskItem {
    id: string;
    title: string;
    description: string;
    isCompleted: boolean;
}

interface TutorialTaskChecklistProps {
    tasks: TaskItem[];
    stepTitle: string;
    stepBadge?: string;
    hintText?: string;
    onTaskClick?: (taskId: string) => void;
}

export function TutorialTaskChecklist({
    tasks,
    stepTitle,
    stepBadge = "实操任务",
    hintText,
    onTaskClick,
}: TutorialTaskChecklistProps) {
    const completedCount = tasks.filter((t) => t.isCompleted).length;
    const progressPercent = Math.round((completedCount / tasks.length) * 100);

    return (
        <div className="rounded-3xl border border-primary/30 bg-card/85 backdrop-blur-2xl shadow-lg p-5 sm:p-6 space-y-4 transition-all duration-300">
            {/* 顶栏：标题与进度条 */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 gap-1.5 text-xs font-semibold py-1 px-3">
                        <Sparkles className="h-3.5 w-3.5 animate-pulse" />
                        {stepBadge}
                    </Badge>
                    <h3 className="text-sm sm:text-base font-extrabold text-foreground">
                        {stepTitle}
                    </h3>
                </div>

                <div className="flex items-center gap-2.5 text-xs text-muted-foreground self-end sm:self-center">
                    <div className="w-32 sm:w-40 h-2 rounded-full bg-muted overflow-hidden border border-border/40">
                        <motion.div
                            className="h-full bg-gradient-to-r from-primary via-violet-500 to-emerald-500"
                            initial={{ width: 0 }}
                            animate={{ width: `${progressPercent}%` }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                        />
                    </div>
                    <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                        {completedCount} / {tasks.length}
                    </span>
                </div>
            </div>

            {/* 任务清单网格 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {tasks.map((task, idx) => (
                    <motion.div
                        key={task.id}
                        initial={false}
                        onClick={() => onTaskClick && onTaskClick(task.id)}
                        animate={{
                            borderColor: task.isCompleted
                                ? "rgba(16, 185, 129, 0.4)"
                                : "hsl(var(--border) / 0.6)",
                            backgroundColor: task.isCompleted
                                ? "rgba(16, 185, 129, 0.06)"
                                : "hsl(var(--muted) / 0.2)",
                        }}
                        className={`p-3.5 rounded-2xl border flex items-start gap-3 transition-all duration-300 shadow-xs select-none ${
                            onTaskClick ? "cursor-pointer hover:border-primary/40" : ""
                        }`}
                    >
                        <div
                            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-all duration-300 mt-0.5 ${
                                task.isCompleted
                                    ? "bg-emerald-500 text-white scale-110 shadow-sm shadow-emerald-500/25"
                                    : "bg-muted text-muted-foreground border border-border"
                            }`}
                        >
                            {task.isCompleted ? (
                                <CheckCircle2 className="h-4 w-4 stroke-[3]" />
                            ) : (
                                <span className="text-[11px] font-bold font-mono">{idx + 1}</span>
                            )}
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                                <h4
                                    className={`text-xs sm:text-sm font-bold transition-colors truncate ${
                                        task.isCompleted ? "text-emerald-700 dark:text-emerald-400" : "text-foreground"
                                    }`}
                                >
                                    {task.title}
                                </h4>
                                {task.isCompleted && (
                                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/15 text-emerald-600 font-medium shrink-0">
                                        ✓ 已掌握
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">
                                {task.description}
                            </p>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* 提示条 Tips */}
            {hintText && (
                <div className="flex items-center gap-2 rounded-2xl bg-muted/40 border border-border/50 px-3.5 py-2 text-xs text-muted-foreground">
                    <Lightbulb className="h-4 w-4 text-amber-500 shrink-0" />
                    <span className="flex-1 leading-relaxed">{hintText}</span>
                </div>
            )}
        </div>
    );
}
