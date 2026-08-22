"use client";

import { motion } from "framer-motion";
import {
    PenTool,
    BookOpen,
    Swords,
    Coins,
    ShieldAlert,
    CheckCircle2,
    Sparkles,
    GraduationCap,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface TutorialModuleMeta {
    id: string;
    title: string;
    subtitle: string;
    icon: React.ElementType;
    badge: string;
    color: string;
    bgHover: string;
}

export const tutorialModules: TutorialModuleMeta[] = [
    {
        id: "editor",
        title: "1. 学术编辑器实战",
        subtitle: "Slash命令 · LaTeX公式 · 定理块",
        icon: PenTool,
        badge: "核心写作",
        color: "text-blue-500",
        bgHover: "hover:bg-blue-500/10",
    },
    {
        id: "publication",
        title: "2. 论文排版与导出",
        subtitle: "Nature双栏 · TOC脉冲 · PDF导出",
        icon: BookOpen,
        badge: "出版级",
        color: "text-indigo-500",
        bgHover: "hover:bg-indigo-500/10",
    },
    {
        id: "duels",
        title: "3. 学术决斗竞技场",
        subtitle: "1v1切磋 · LP下注 · 同行评议",
        icon: Swords,
        badge: "竞技模式",
        color: "text-rose-500",
        bgHover: "hover:bg-rose-500/10",
    },
    {
        id: "credits",
        title: "4. 积分与数据时效",
        subtitle: "Credits流转 · 7天附件清理",
        icon: Coins,
        badge: "社区生态",
        color: "text-amber-500",
        bgHover: "hover:bg-amber-500/10",
    },
    {
        id: "moderation",
        title: "5. 多模态 AI 审校",
        subtitle: "AI语义评分 · 敏感词拦截 · 申诉",
        icon: ShieldAlert,
        badge: "安全合规",
        color: "text-emerald-500",
        bgHover: "hover:bg-emerald-500/10",
    },
];

interface TutorialProgressSidebarProps {
    currentModuleId: string;
    onSelectModule: (id: string) => void;
    completedModuleIds: string[];
}

export function TutorialProgressSidebar({
    currentModuleId,
    onSelectModule,
    completedModuleIds,
}: TutorialProgressSidebarProps) {
    const totalCount = tutorialModules.length;
    const completedCount = completedModuleIds.length;
    const isAllCompleted = completedCount === totalCount;

    return (
        <div className="w-full space-y-4">
            {/* 顶栏进度概览卡片 */}
            <div className="rounded-2xl border border-border/60 bg-card/75 backdrop-blur-md p-4 shadow-sm space-y-2.5">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-violet-600 text-white shadow-sm">
                            <GraduationCap className="h-4 w-4" />
                        </div>
                        <div>
                            <h3 className="text-xs font-bold text-foreground">研学者实训进度</h3>
                            <p className="text-[10px] text-muted-foreground">完成实操点亮专属勋章</p>
                        </div>
                    </div>
                    <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
                        {completedCount} / {totalCount}
                    </span>
                </div>

                {/* 进度条 */}
                <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-primary via-violet-500 to-emerald-500 transition-all duration-500"
                        style={{ width: `${(completedCount / totalCount) * 100}%` }}
                    />
                </div>

                {isAllCompleted && (
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
                        <Sparkles className="h-3 w-3 animate-spin" />
                        恭喜！已通关全部 5 大实操实训
                    </div>
                )}
            </div>

            {/* 模块列表按钮组 */}
            <div className="space-y-1.5">
                {tutorialModules.map((mod) => {
                    const isSelected = currentModuleId === mod.id;
                    const isCompleted = completedModuleIds.includes(mod.id);
                    const Icon = mod.icon;

                    return (
                        <button
                            key={mod.id}
                            type="button"
                            onClick={() => onSelectModule(mod.id)}
                            className={cn(
                                "w-full flex items-center justify-between gap-3 p-3 rounded-xl border text-left transition-all duration-200 group cursor-pointer",
                                isSelected
                                    ? "bg-primary/10 border-primary text-primary shadow-sm font-bold ring-1 ring-primary/30"
                                    : "bg-card/40 hover:bg-card border-border/40 text-foreground/80 hover:text-foreground"
                            )}
                        >
                            <div className="flex items-center gap-2.5 min-w-0">
                                <div
                                    className={cn(
                                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-colors",
                                        isSelected
                                            ? "bg-primary text-white border-primary"
                                            : "bg-muted/60 text-muted-foreground border-border/50 group-hover:text-primary group-hover:border-primary/30"
                                    )}
                                >
                                    <Icon className="h-4 w-4" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs font-semibold truncate leading-tight">
                                        {mod.title}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                                        {mod.subtitle}
                                    </p>
                                </div>
                            </div>

                            {/* 状态指示 */}
                            {isCompleted ? (
                                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                            ) : (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground shrink-0 border border-border/50">
                                    {mod.badge}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
