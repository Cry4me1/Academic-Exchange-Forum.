"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { toggleFollowCollection } from "@/app/(protected)/collections/actions";
import { cn } from "@/lib/utils";
import { Heart, HeartOff, Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner";

interface FollowCollectionButtonProps {
    collectionId: string;
    initialFollowed: boolean;
    followerCount: number;
    /** 在 Hero 暗色背景上使用的样式变体 */
    variant?: "default" | "hero";
    className?: string;
    onToggle?: (followed: boolean) => void;
}

export function FollowCollectionButton({
    collectionId,
    initialFollowed,
    followerCount,
    variant = "default",
    className,
    onToggle,
}: FollowCollectionButtonProps) {
    const [isFollowed, setIsFollowed] = useState(initialFollowed);
    const [count, setCount] = useState(followerCount);
    const [isHovering, setIsHovering] = useState(false);
    const [isPending, startTransition] = useTransition();

    const handleToggle = () => {
        // 乐观更新
        const newFollowed = !isFollowed;
        setIsFollowed(newFollowed);
        setCount((prev) => (newFollowed ? prev + 1 : Math.max(prev - 1, 0)));

        startTransition(async () => {
            const result = await toggleFollowCollection(collectionId);
            if (result.error) {
                // 回滚
                setIsFollowed(!newFollowed);
                setCount((prev) => (newFollowed ? Math.max(prev - 1, 0) : prev + 1));
                toast.error(result.error);
            } else {
                if (newFollowed) {
                    toast.success("已关注专栏，新文章发布时将收到通知");
                } else {
                    toast("已取消关注");
                }
                onToggle?.(newFollowed);
            }
        });
    };

    if (variant === "hero") {
        return (
            <Button
                onClick={handleToggle}
                disabled={isPending}
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}
                className={cn(
                    "transition-all duration-200 font-medium shadow-lg backdrop-blur-md border",
                    isFollowed
                        ? isHovering
                            ? "bg-red-500/80 hover:bg-red-500/90 text-white border-red-400/40"
                            : "bg-white/20 hover:bg-white/25 text-white border-white/25"
                        : "bg-primary hover:bg-primary/90 text-primary-foreground border-primary/50",
                    className
                )}
            >
                {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                ) : isFollowed ? (
                    isHovering ? (
                        <HeartOff className="h-4 w-4 mr-1.5" />
                    ) : (
                        <Heart className="h-4 w-4 mr-1.5 fill-current" />
                    )
                ) : (
                    <UserPlus className="h-4 w-4 mr-1.5" />
                )}
                {isPending
                    ? "处理中..."
                    : isFollowed
                        ? isHovering
                            ? "取消关注"
                            : `已关注 · ${count}`
                        : `关注专栏 · ${count}`}
            </Button>
        );
    }

    // default variant
    return (
        <Button
            onClick={handleToggle}
            disabled={isPending}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
            variant={isFollowed ? "outline" : "default"}
            size="sm"
            className={cn(
                "transition-all duration-200 font-medium gap-1.5",
                isFollowed && isHovering && "border-red-300 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-600",
                isFollowed && !isHovering && "border-primary/30 text-primary",
                className
            )}
        >
            {isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : isFollowed ? (
                isHovering ? (
                    <HeartOff className="h-3.5 w-3.5" />
                ) : (
                    <Heart className="h-3.5 w-3.5 fill-current" />
                )
            ) : (
                <UserPlus className="h-3.5 w-3.5" />
            )}
            {isPending
                ? "处理中..."
                : isFollowed
                    ? isHovering
                        ? "取消关注"
                        : `已关注 · ${count}`
                    : `关注 · ${count}`}
        </Button>
    );
}
