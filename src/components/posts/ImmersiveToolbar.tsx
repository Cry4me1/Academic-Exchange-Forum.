"use client";

import { Button } from "@/components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { motion } from "framer-motion";
import { ArrowLeft, Keyboard, Minimize2 } from "lucide-react";
import Link from "next/link";

interface ImmersiveToolbarProps {
    /** 阅读进度 0-100 */
    progress: number;
    /** 退出沉浸模式 */
    onExit: () => void;
}

export function ImmersiveToolbar({ progress, onExit }: ImmersiveToolbarProps) {
    return (
        <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="fixed top-0 left-0 right-0 z-50"
            role="toolbar"
            aria-label="沉浸阅读工具栏"
        >
            <div className="h-[2px] bg-border/10" role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100} aria-label="阅读进度">
                <motion.div
                    className="h-full bg-gradient-to-r from-primary/50 via-primary to-primary/50 rounded-full will-change-[width]"
                    style={{ width: `${progress}%` }}
                    transition={{ ease: "easeOut", duration: 0.15 }}
                />
            </div>

            {/* 浮动工具条 */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-2 bg-background/80 backdrop-blur-xl border-b border-border/40">
                <Link href="/dashboard">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="gap-2 text-muted-foreground hover:text-foreground"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        <span className="hidden sm:inline">返回</span>
                    </Button>
                </Link>

                {/* 中央进度百分比 */}
                <span className="text-xs text-muted-foreground tabular-nums font-semibold">
                    {Math.round(progress)}%
                </span>

                <div className="flex items-center gap-1">
                    {/* 快捷键提示 */}
                    <TooltipProvider delayDuration={300}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                >
                                    <Keyboard className="h-3.5 w-3.5" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="text-xs p-3">
                                <div className="space-y-1.5 text-popover-foreground">
                                    <p className="flex items-center gap-2">
                                        <kbd className="inline-block px-1.5 py-0.5 bg-muted border border-border rounded text-[10px] font-mono font-semibold">Esc</kbd>
                                        <span>退出专注模式</span>
                                    </p>
                                    <p className="flex items-center gap-2">
                                        <kbd className="inline-block px-1.5 py-0.5 bg-muted border border-border rounded text-[10px] font-mono font-semibold">Ctrl+Shift+F</kbd>
                                        <span>切换专注模式</span>
                                    </p>
                                </div>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>

                    {/* 退出按钮 */}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onExit}
                        className="gap-2 text-muted-foreground hover:text-foreground"
                    >
                        <Minimize2 className="h-4 w-4" />
                        <span className="hidden sm:inline">退出专注</span>
                    </Button>
                </div>
            </div>
        </motion.div>
    );
}

export default ImmersiveToolbar;
