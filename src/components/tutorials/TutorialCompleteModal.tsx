"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import confetti from "canvas-confetti";
import {
    Award,
    PartyPopper,
    Sparkles,
    CheckCircle2,
    ArrowRight,
    PenTool,
    LayoutDashboard,
} from "lucide-react";
import Link from "next/link";

interface TutorialCompleteModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function TutorialCompleteModal({ isOpen, onClose }: TutorialCompleteModalProps) {
    useEffect(() => {
        if (!isOpen) return;

        // 触发全屏多层级毕业礼花
        const end = Date.now() + 2000;
        const colors = ["#6366f1", "#a855f7", "#ec4899", "#3b82f6", "#eab308", "#10b981"];

        (function frame() {
            confetti({
                particleCount: 4,
                angle: 60,
                spread: 60,
                origin: { x: 0, y: 0.7 },
                colors: colors,
                zIndex: 9999,
            });
            confetti({
                particleCount: 4,
                angle: 120,
                spread: 60,
                origin: { x: 1, y: 0.7 },
                colors: colors,
                zIndex: 9999,
            });

            if (Date.now() < end) {
                requestAnimationFrame(frame);
            }
        })();
    }, [isOpen]);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent
                showCloseButton={false}
                className="sm:max-w-md p-0 overflow-hidden bg-transparent border-none shadow-none outline-none"
            >
                <AnimatePresence>
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        transition={{ type: "spring", damping: 20 }}
                        className="rounded-3xl bg-background/95 backdrop-blur-2xl border border-primary/40 shadow-2xl p-6 sm:p-8 text-center space-y-5"
                    >
                        {/* 勋章图标 */}
                        <div className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-amber-400 via-orange-500 to-primary text-white shadow-xl shadow-amber-500/25">
                            <Award className="h-10 w-10 animate-pulse" />
                            <div className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-emerald-500 text-white flex items-center justify-center border-2 border-background">
                                <CheckCircle2 className="h-4 w-4" />
                            </div>
                        </div>

                        {/* 标题 */}
                        <div className="space-y-1.5">
                            <Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs px-3 py-0.5">
                                🎓 Scholarly 实操训练营 · 结业认证
                            </Badge>
                            <h3 className="text-2xl font-extrabold tracking-tight text-foreground">
                                恭喜成为全能研学者！
                            </h3>
                            <p className="text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">
                                您已亲手实操完成本站全部 6 大板块与学术编辑器的所有核心功能。
                            </p>
                        </div>

                        {/* 实操成就清单卡片 */}
                        <div className="rounded-2xl border border-border/60 bg-muted/30 p-3.5 text-left text-xs space-y-2">
                            <div className="flex items-center gap-2 text-foreground font-semibold">
                                <Sparkles className="h-3.5 w-3.5 text-primary" />
                                <span>已点亮学术技能徽章：</span>
                            </div>
                            <div className="grid grid-cols-2 gap-1.5 text-muted-foreground text-[11px]">
                                <span className="flex items-center gap-1">✓ Slash与LaTeX公式</span>
                                <span className="flex items-center gap-1">✓ Nature出版级双栏排版</span>
                                <span className="flex items-center gap-1">✓ 学术决斗与同行评议</span>
                                <span className="flex items-center gap-1">✓ 60FPS主题空间定制</span>
                                <span className="flex items-center gap-1">✓ 积分与7天数据时效</span>
                                <span className="flex items-center gap-1">✓ 多模态AI审稿风控</span>
                            </div>
                        </div>

                        {/* 控制按键 */}
                        <div className="space-y-2 pt-2">
                            <Link href="/dashboard" onClick={onClose} className="block w-full">
                                <Button className="w-full h-11 bg-gradient-to-r from-primary to-violet-600 text-white shadow-lg shadow-primary/25 rounded-xl font-bold gap-2">
                                    <LayoutDashboard className="h-4 w-4" />
                                    前往学术仪表盘探索
                                    <ArrowRight className="h-4 w-4" />
                                </Button>
                            </Link>

                            <Button
                                variant="ghost"
                                onClick={onClose}
                                className="w-full text-xs text-muted-foreground hover:text-foreground"
                            >
                                继续留在训练营重温
                            </Button>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </DialogContent>
        </Dialog>
    );
}
