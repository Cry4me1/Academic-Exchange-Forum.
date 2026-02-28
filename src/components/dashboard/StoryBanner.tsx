"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";
import {
    ChevronLeft,
    ChevronRight,
    Crown,
    Eye,
    Flame,
    Heart,
    MessageCircle,
    PenSquare,
    Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

// ============================
// Types
// ============================
interface TrendingPost {
    id: string;
    title: string;
    like_count: number;
    comment_count: number;
    view_count: number;
    author: {
        username: string;
        avatar_url?: string;
    };
}

interface WeeklyTopPoster {
    id: string;
    username: string;
    full_name?: string;
    avatar_url?: string;
    post_count: number;
}

type SlideItem =
    | { type: "trending"; data: TrendingPost }
    | { type: "topPoster"; data: WeeklyTopPoster }
    | { type: "emptyWeekly" };

// ============================
// 主组件
// ============================
export function StoryBanner() {
    const [slides, setSlides] = useState<SlideItem[]>([]);
    const [loading, setLoading] = useState(true);
    const scrollRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);

    // 获取数据
    useEffect(() => {
        async function fetchData() {
            const supabase = createClient();

            // 计算本周一 00:00 (UTC)
            const now = new Date();
            const dayOfWeek = now.getDay(); // 0=Sun
            const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
            const monday = new Date(now);
            monday.setDate(now.getDate() - mondayOffset);
            monday.setHours(0, 0, 0, 0);
            const weekStart = monday.toISOString();

            const [trendingResult, weeklyPostsResult] = await Promise.all([
                supabase
                    .from("posts")
                    .select("id, title, like_count, comment_count, view_count, author:profiles!author_id(username, avatar_url)")
                    .eq("is_published", true)
                    .order("like_count", { ascending: false })
                    .limit(5),
                supabase
                    .from("posts")
                    .select("author_id, author:profiles!author_id(id, username, full_name, avatar_url)")
                    .eq("is_published", true)
                    .gte("created_at", weekStart),
            ]);

            const items: SlideItem[] = [];

            // 热门帖子 slides
            const trending = (trendingResult.data || []) as unknown as TrendingPost[];
            trending.forEach((post) => {
                items.push({ type: "trending", data: post });
            });

            // 本周发帖排行
            const weeklyPosts = weeklyPostsResult.data || [];
            if (weeklyPosts.length > 0) {
                // 按 author_id 聚合
                const authorMap = new Map<string, { author: any; count: number }>();
                weeklyPosts.forEach((p: any) => {
                    const aid = p.author_id;
                    if (!aid) return;
                    const existing = authorMap.get(aid);
                    if (existing) {
                        existing.count++;
                    } else {
                        authorMap.set(aid, { author: p.author, count: 1 });
                    }
                });

                // 排序取前3
                const topPosters = Array.from(authorMap.entries())
                    .sort((a, b) => b[1].count - a[1].count)
                    .slice(0, 3);

                topPosters.forEach(([, val]) => {
                    const a = val.author;
                    items.push({
                        type: "topPoster",
                        data: {
                            id: a?.id || "",
                            username: a?.username || "未知",
                            full_name: a?.full_name,
                            avatar_url: a?.avatar_url,
                            post_count: val.count,
                        },
                    });
                });
            } else {
                // 本周无人发帖 → 空态卡片
                items.push({ type: "emptyWeekly" });
            }

            setSlides(items);
            setLoading(false);
        }

        fetchData();
    }, []);

    // 滚动控制
    const updateScrollState = useCallback(() => {
        const el = scrollRef.current;
        if (!el) return;
        setCanScrollLeft(el.scrollLeft > 10);
        setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
    }, []);

    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;
        el.addEventListener("scroll", updateScrollState, { passive: true });
        updateScrollState();
        return () => el.removeEventListener("scroll", updateScrollState);
    }, [updateScrollState, loading]);

    const scroll = (dir: "left" | "right") => {
        const el = scrollRef.current;
        if (!el) return;
        el.scrollBy({ left: dir === "left" ? -240 : 240, behavior: "smooth" });
    };

    if (loading) {
        return (
            <div className="flex gap-3 overflow-hidden">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="animate-pulse shrink-0 w-56 h-28 rounded-xl bg-muted/40" />
                ))}
            </div>
        );
    }

    if (slides.length === 0) return null;

    return (
        <div className="relative group/banner">
            {/* 左箭头 */}
            {canScrollLeft && (
                <button
                    type="button"
                    onClick={() => scroll("left")}
                    className="absolute -left-3 top-1/2 -translate-y-1/2 z-20 h-8 w-8 rounded-full bg-background/90 border border-border/50 shadow-lg flex items-center justify-center opacity-0 group-hover/banner:opacity-100 transition-opacity hover:scale-110"
                >
                    <ChevronLeft className="h-4 w-4" />
                </button>
            )}

            {/* 右箭头 */}
            {canScrollRight && (
                <button
                    type="button"
                    onClick={() => scroll("right")}
                    className="absolute -right-3 top-1/2 -translate-y-1/2 z-20 h-8 w-8 rounded-full bg-background/90 border border-border/50 shadow-lg flex items-center justify-center opacity-0 group-hover/banner:opacity-100 transition-opacity hover:scale-110"
                >
                    <ChevronRight className="h-4 w-4" />
                </button>
            )}

            {/* 滚动容器 */}
            <div
                ref={scrollRef}
                className="flex gap-3 overflow-x-auto scrollbar-hidden scroll-smooth pb-1"
            >
                {slides.map((slide, i) => (
                    <motion.div
                        key={`${slide.type}-${i}`}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.06, duration: 0.35, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
                        className="shrink-0"
                    >
                        {slide.type === "trending" && <TrendingSlide post={slide.data} />}
                        {slide.type === "topPoster" && <TopPosterSlide user={slide.data} />}
                        {slide.type === "emptyWeekly" && <EmptyWeeklySlide />}
                    </motion.div>
                ))}
            </div>

            {/* 右侧渐变遮罩 */}
            {canScrollRight && (
                <div className="absolute right-0 top-0 bottom-1 w-12 bg-gradient-to-l from-background to-transparent pointer-events-none z-10" />
            )}
        </div>
    );
}

// ============================
// Slide 子组件
// ============================

function TrendingSlide({ post }: { post: TrendingPost }) {
    return (
        <Link href={`/posts/${post.id}`}>
            <div className="w-56 h-28 rounded-xl border border-border/40 bg-card/80 backdrop-blur-sm p-4 flex flex-col justify-between cursor-pointer hover:border-border/80 hover:shadow-lg hover:shadow-orange-500/5 transition-all duration-300 group/slide">
                {/* 顶栏 */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                        <Flame className="h-3.5 w-3.5 text-orange-500" />
                        <span className="text-[10px] font-semibold text-orange-500 uppercase tracking-wider">热门</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Avatar className="h-5 w-5 border border-background">
                            <AvatarImage src={post.author?.avatar_url || ""} />
                            <AvatarFallback className="text-[8px]">
                                {(post.author?.username || "?")[0].toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <span className="text-[10px] text-muted-foreground truncate max-w-[60px]">
                            {post.author?.username}
                        </span>
                    </div>
                </div>

                {/* 标题 */}
                <p className="text-sm font-semibold text-foreground leading-tight line-clamp-2 group-hover/slide:text-primary transition-colors">
                    {post.title}
                </p>

                {/* 统计 */}
                <div className="flex items-center gap-3 text-[10px] text-muted-foreground/70">
                    <span className="flex items-center gap-0.5">
                        <Heart className="h-3 w-3" /> {post.like_count}
                    </span>
                    <span className="flex items-center gap-0.5">
                        <MessageCircle className="h-3 w-3" /> {post.comment_count}
                    </span>
                    <span className="flex items-center gap-0.5">
                        <Eye className="h-3 w-3" /> {post.view_count}
                    </span>
                </div>
            </div>
        </Link>
    );
}

function TopPosterSlide({ user }: { user: WeeklyTopPoster }) {
    const displayName = user.full_name || user.username;
    return (
        <Link href={`/user/${user.id}`}>
            <div className="w-44 h-28 rounded-xl border border-border/40 bg-gradient-to-br from-amber-500/5 to-orange-500/5 p-4 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-amber-500/30 hover:shadow-lg hover:shadow-amber-500/10 transition-all duration-300">
                <div className="flex items-center gap-1 text-[10px] font-semibold text-amber-600 uppercase tracking-wider">
                    <Crown className="h-3 w-3" /> 本周之星
                </div>
                <Avatar className="h-10 w-10 border-2 border-amber-500/30 shadow-sm">
                    <AvatarImage src={user.avatar_url || ""} alt={displayName} />
                    <AvatarFallback className="bg-gradient-to-br from-amber-500/20 to-orange-500/10 text-amber-600 font-bold text-sm">
                        {displayName[0].toUpperCase()}
                    </AvatarFallback>
                </Avatar>
                <div className="text-center">
                    <p className="text-xs font-semibold text-foreground truncate max-w-[120px]">{displayName}</p>
                    <p className="text-[10px] text-muted-foreground/70">本周 {user.post_count} 篇帖子</p>
                </div>
            </div>
        </Link>
    );
}

function EmptyWeeklySlide() {
    return (
        <div className="w-52 h-28 rounded-xl border border-dashed border-border/60 bg-gradient-to-br from-muted/20 to-muted/5 p-4 flex flex-col items-center justify-center gap-2">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-primary/50" />
            </div>
            <div className="text-center">
                <p className="text-[11px] font-semibold text-muted-foreground/70">本周之星虚位以待</p>
                <p className="text-[10px] text-muted-foreground/50 mt-0.5 flex items-center justify-center gap-1">
                    <PenSquare className="h-3 w-3" /> 发帖即有机会上榜
                </p>
            </div>
        </div>
    );
}
