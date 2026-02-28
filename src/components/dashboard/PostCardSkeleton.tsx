"use client";

import { cn } from "@/lib/utils";

function Shimmer({ className }: { className?: string }) {
    return (
        <div
            className={cn(
                "animate-pulse rounded-md bg-muted/60",
                className
            )}
        />
    );
}

/** 有封面图的竖版骨架 */
export function PostCardSkeletonWithCover() {
    return (
        <div className="bg-card/80 border border-border/40 rounded-xl overflow-hidden">
            {/* 封面图占位 */}
            <Shimmer className="w-full h-44 rounded-none" />
            <div className="p-6 space-y-3">
                {/* 标签 */}
                <div className="flex gap-2">
                    <Shimmer className="h-5 w-20 rounded-full" />
                    <Shimmer className="h-5 w-16 rounded-full" />
                </div>
                {/* 标题 */}
                <Shimmer className="h-5 w-4/5" />
                {/* 摘要 */}
                <div className="space-y-1.5">
                    <Shimmer className="h-3.5 w-full" />
                    <Shimmer className="h-3.5 w-2/3" />
                </div>
                {/* 底栏 */}
                <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-2">
                        <Shimmer className="h-7 w-7 rounded-full" />
                        <Shimmer className="h-3.5 w-20" />
                    </div>
                    <div className="flex gap-3">
                        <Shimmer className="h-3.5 w-10" />
                        <Shimmer className="h-3.5 w-10" />
                    </div>
                </div>
            </div>
        </div>
    );
}

/** 无封面图的横版骨架 */
export function PostCardSkeletonCompact() {
    return (
        <div className="bg-card/80 border border-border/40 rounded-xl p-6 space-y-3">
            {/* 头部：作者 + 标签 */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <Shimmer className="h-9 w-9 rounded-full" />
                    <div className="space-y-1.5">
                        <Shimmer className="h-3.5 w-24" />
                        <Shimmer className="h-3 w-16" />
                    </div>
                </div>
                <div className="flex gap-2">
                    <Shimmer className="h-5 w-16 rounded-full" />
                </div>
            </div>
            {/* 标题 */}
            <Shimmer className="h-5 w-3/4" />
            {/* 摘要 */}
            <div className="space-y-1.5">
                <Shimmer className="h-3.5 w-full" />
                <Shimmer className="h-3.5 w-5/6" />
            </div>
            {/* 底栏 */}
            <div className="flex gap-4 pt-1">
                <Shimmer className="h-3.5 w-12" />
                <Shimmer className="h-3.5 w-12" />
                <Shimmer className="h-3.5 w-8" />
            </div>
        </div>
    );
}

/** 混合骨架列表（模拟真实加载感） */
export function PostFeedSkeleton({ count = 4 }: { count?: number }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Array.from({ length: count }).map((_, i) =>
                i % 3 === 0 ? (
                    <PostCardSkeletonWithCover key={i} />
                ) : (
                    <PostCardSkeletonCompact key={i} />
                )
            )}
        </div>
    );
}
