"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Check, Sparkles, ArrowRight, ArrowLeft, Lightbulb, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export interface TaskItem {
    id: string;
    title: string;
    description: string;
    hint: string;
    isCompleted: boolean;
}

interface InteractiveTaskGuideProps {
    tasks: TaskItem[];
    currentTaskIndex: number;
    onPrevTask: () => void;
    onNextTask: () => void;
    onResetTask?: () => void;
    moduleTitle: string;
}

export function InteractiveTaskGuide({
    tasks,
    currentTaskIndex,
    onPrevTask,
    onNextTask,
    onResetTask,
    moduleTitle,
}: InteractiveTaskGuideProps) {
    const currentTask = tasks[currentTaskIndex];
    if (!currentTask) return null;

    const completedCount = tasks.filter((t) => t.isCompleted).length;
    const progressPercent = Math.round((completedCount / tasks.length) * 100);

    return (
        <div className="rounded-2xl border border-primary/30 bg-card/90 backdrop-blur-xl shadow-lg p-4 sm:p-5 space-y-3 transition-all duration-300">
            {/* 顶栏：模块标题与步骤指示 */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 gap-1 text-xs">
                        <Sparkles className="h-3 w-3 animate-pulse" />
                        实操任务 {currentTaskIndex + 1} / {tasks.length}
                    </Badge>
                    <span className="text-xs font-semibold text-foreground">
                        {moduleTitle}
                    </span>
                </div>

                {/* 进度条与数字 */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <div className="w-24 sm:w-32 h-2 rounded-full bg-muted overflow-hidden border border-border/40">
                        <div
                            className="h-full bg-gradient-to-r from-primary to-violet-500 transition-all duration-500"
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>
                    <span className="font-mono text-[11px] font-bold text-primary">
                        {progressPercent}%
                    </span>
                </div>
            </div>

            {/* 当前任务主体 */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentTask.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-2 pt-1"
                >
                    <div className="flex items-start gap-3">
                        {/* 状态徽章图标 */}
                        <div
                            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border transition-all duration-300 ${
                                currentTask.isCompleted
                                    ? "bg-emerald-500 text-white border-emerald-600 shadow-md shadow-emerald-500/20 scale-105"
                                    : "bg-primary/10 text-primary border-primary/30"
                            }`}
                        >
                            {currentTask.isCompleted ? (
                                <Check className="h-4 w-4 stroke-[3]" />
                            ) : (
                                <span className="text-xs font-bold font-mono">{currentTaskIndex + 1}</span>
                            )}
                        </div>

                        <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                                {currentTask.title}
                                {currentTask.isCompleted && (
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 font-medium border border-emerald-500/30 animate-in fade-in">
                                        ✓ 已亲手掌握
                                    </span>
                                )}
                            </h4>
                            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                                {currentTask.description}
                            </p>
                        </div>
                    </div>

                    {/* 提示条 Tips */}
                    <div className="flex items-center gap-2 rounded-xl bg-muted/50 border border-border/50 px-3 py-2 text-xs text-muted-foreground">
                        <Lightbulb className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                        <span className="flex-1 font-medium">{currentTask.hint}</span>
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* 底部控制按键 */}
            <div className="flex items-center justify-between pt-1 border-t border-border/40">
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={currentTaskIndex === 0}
                    onClick={onPrevTask}
                    className="h-8 text-xs gap-1 text-muted-foreground hover:text-foreground"
                >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    上个任务
                </Button>

                <div className="flex items-center gap-2">
                    {onResetTask && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={onResetTask}
                            className="h-8 text-xs text-muted-foreground hover:text-foreground gap-1"
                            title="重新实操此步骤"
                        >
                            <RotateCcw className="h-3 w-3" />
                            重置输入
                        </Button>
                    )}

                    <Button
                        type="button"
                        size="sm"
                        onClick={onNextTask}
                        className={`h-8 text-xs px-4 rounded-lg font-semibold gap-1 transition-all ${
                            currentTask.isCompleted
                                ? "bg-gradient-to-r from-primary to-violet-600 text-white shadow-md shadow-primary/20"
                                : "bg-muted hover:bg-muted/80 text-foreground"
                        }`}
                    >
                        {currentTaskIndex === tasks.length - 1 ? "完成此模块" : "下一个任务"}
                        <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
