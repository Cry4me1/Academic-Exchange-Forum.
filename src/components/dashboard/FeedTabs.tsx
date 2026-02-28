"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { CheckCircle2, Clock, Flame, Heart, HelpCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export type FeedFilter = "latest" | "trending" | "following" | "solved" | "help";

interface FeedTabsProps {
    activeTab: FeedFilter;
    onTabChange: (tab: FeedFilter) => void;
}

const tabs: { value: FeedFilter; label: string; icon: typeof Clock }[] = [
    { value: "latest", label: "最新", icon: Clock },
    { value: "trending", label: "热门", icon: Flame },
    { value: "following", label: "关注", icon: Heart },
    { value: "solved", label: "精华", icon: CheckCircle2 },
    { value: "help", label: "求助", icon: HelpCircle },
];

export function FeedTabs({ activeTab, onTabChange }: FeedTabsProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

    // 计算滑块位置
    useEffect(() => {
        if (!containerRef.current) return;
        const activeElement = containerRef.current.querySelector(
            `[data-tab="${activeTab}"]`
        ) as HTMLButtonElement | null;

        if (activeElement) {
            const containerRect = containerRef.current.getBoundingClientRect();
            const activeRect = activeElement.getBoundingClientRect();
            setIndicatorStyle({
                left: activeRect.left - containerRect.left + containerRef.current.scrollLeft,
                width: activeRect.width,
            });

            // 移动端：自动滚动到选中项可见
            activeElement.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
        }
    }, [activeTab]);

    return (
        <div
            ref={containerRef}
            className="relative flex items-center gap-1 p-1 bg-muted/40 backdrop-blur-sm rounded-xl border border-border/30 overflow-x-auto scrollbar-hidden"
        >
            {/* 滑块指示器 */}
            <motion.div
                className="absolute top-1 bottom-1 bg-background rounded-lg shadow-sm border border-border/50"
                animate={{
                    left: indicatorStyle.left,
                    width: indicatorStyle.width,
                }}
                transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 30,
                }}
            />

            {/* Tab 按钮 */}
            {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.value;

                return (
                    <button
                        key={tab.value}
                        type="button"
                        data-tab={tab.value}
                        onClick={() => onTabChange(tab.value)}
                        className={cn(
                            "relative z-10 flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 whitespace-nowrap",
                            "flex-1 sm:flex-1 min-w-fit",
                            isActive
                                ? "text-foreground"
                                : "text-muted-foreground hover:text-foreground/80"
                        )}
                    >
                        <Icon className={cn("h-3.5 w-3.5 shrink-0", isActive && "text-primary")} />
                        <span className="hidden sm:inline">{tab.label}</span>
                    </button>
                );
            })}
        </div>
    );
}
