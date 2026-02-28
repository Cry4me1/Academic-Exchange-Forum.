"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { ArrowUpDown, Clock, Flame } from "lucide-react";

export type CommentSortType = "hot" | "newest" | "oldest";

interface CommentSortTabsProps {
    activeSort: CommentSortType;
    onSortChange: (sort: CommentSortType) => void;
    commentCount: number;
}

const sortOptions = [
    { value: "hot" as const, label: "最热", icon: Flame },
    { value: "newest" as const, label: "最新", icon: Clock },
    { value: "oldest" as const, label: "最早", icon: ArrowUpDown },
];

export function CommentSortTabs({ activeSort, onSortChange, commentCount }: CommentSortTabsProps) {
    return (
        <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                讨论
                <span className="inline-flex items-center justify-center h-6 min-w-6 px-1.5 rounded-full bg-primary/10 text-primary text-sm font-bold tabular-nums">
                    {commentCount}
                </span>
            </h2>
            <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1 relative" role="tablist" aria-label="评论排序">
                {sortOptions.map(({ value, label, icon: Icon }) => (
                    <button
                        key={value}
                        onClick={() => onSortChange(value)}
                        role="tab"
                        aria-selected={activeSort === value}
                        className={cn(
                            "relative flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors z-10",
                            activeSort === value
                                ? "text-foreground"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        {activeSort === value && (
                            <motion.div
                                layoutId="comment-sort-indicator"
                                className="absolute inset-0 bg-background shadow-sm rounded-md"
                                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                            />
                        )}
                        <span className="relative z-10 flex items-center gap-1.5">
                            <Icon className="h-3.5 w-3.5" />
                            {label}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
}
