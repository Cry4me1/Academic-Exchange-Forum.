"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, ArrowRight, GraduationCap, X, CheckCircle2 } from "lucide-react";
import Link from "next/link";

const DISMISSED_KEY = "scholarly_dashboard_tutorial_banner_dismissed_v1";
const STORAGE_KEY = "scholarly_tutorials_completed_modules_v1";

export function DashboardTutorialBanner() {
    const [isVisible, setIsVisible] = useState(false);
    const [completedCount, setCompletedCount] = useState(0);

    useEffect(() => {
        try {
            const dismissed = localStorage.getItem(DISMISSED_KEY);
            if (dismissed === "true") return;

            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed)) {
                    setCompletedCount(parsed.length);
                    // 如果已经全部通关5个模块，则默认不显示横幅
                    if (parsed.length >= 5) return;
                }
            }
            setIsVisible(true);
        } catch {
            setIsVisible(true);
        }
    }, []);

    const handleDismiss = () => {
        setIsVisible(false);
        try {
            localStorage.setItem(DISMISSED_KEY, "true");
        } catch {
            // ignore
        }
    };

    if (!isVisible) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.98 }}
                className="relative rounded-2xl border border-primary/30 bg-gradient-to-r from-primary/10 via-violet-500/10 to-transparent p-4 sm:p-4.5 shadow-md backdrop-blur-md overflow-hidden mb-6"
            >
                {/* 装饰光晕 */}
                <div className="absolute top-0 right-0 h-32 w-32 bg-primary/10 rounded-full blur-2xl pointer-events-none" />

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
                    <div className="flex items-start sm:items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-violet-600 text-white shadow-md shadow-primary/20">
                            <GraduationCap className="h-5 w-5" />
                        </div>

                        <div className="space-y-0.5">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="text-sm font-bold text-foreground">
                                    Scholarly 研学者实操训练营
                                </h4>
                                <Badge variant="outline" className="text-[10px] py-0 px-2 border-primary/30 text-primary bg-primary/5">
                                    1:1 全真沙盒
                                </Badge>
                                {completedCount > 0 && (
                                    <span className="text-[11px] text-muted-foreground">
                                        (已掌握 {completedCount}/5 技能)
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                3 分钟亲手实操掌握学术编辑器、Slash 命令、LaTeX 矢量公式、Nature 双栏排版与学术决斗。
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        <Link href="/tutorials">
                            <Button size="sm" className="h-8 text-xs px-3.5 bg-gradient-to-r from-primary to-violet-600 text-white rounded-lg font-semibold shadow-sm gap-1 group">
                                开启实操训练
                                <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                            </Button>
                        </Link>

                        <button
                            type="button"
                            onClick={handleDismiss}
                            className="h-8 w-8 rounded-lg hover:bg-muted/80 text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors"
                            title="稍后再说"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
