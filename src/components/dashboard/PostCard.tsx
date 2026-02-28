"use client";

import { createShareRecord, toggleBookmarkPost, toggleLikePost } from "@/app/(protected)/posts/[id]/actions";
import { VipBadge } from "@/components/payments/VipBadge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
    Bookmark,
    CheckCircle2,
    Heart,
    HelpCircle,
    MessageCircle,
    MoreHorizontal,
    Share2,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState, useTransition } from "react";
import { toast } from "sonner";

// ============================================================
// 学科标签颜色映射
// ============================================================
const tagColors: Record<string, { bg: string; text: string; accent: string }> = {
    "Mathematics": { bg: "bg-blue-500/10", text: "text-blue-600", accent: "bg-blue-500" },
    "Computer Science": { bg: "bg-emerald-500/10", text: "text-emerald-600", accent: "bg-emerald-500" },
    "Physics": { bg: "bg-purple-500/10", text: "text-purple-600", accent: "bg-purple-500" },
    "Biology": { bg: "bg-green-500/10", text: "text-green-600", accent: "bg-green-500" },
    "Chemistry": { bg: "bg-orange-500/10", text: "text-orange-600", accent: "bg-orange-500" },
    "Economics": { bg: "bg-amber-500/10", text: "text-amber-600", accent: "bg-amber-500" },
    "Philosophy": { bg: "bg-rose-500/10", text: "text-rose-600", accent: "bg-rose-500" },
    "AI": { bg: "bg-cyan-500/10", text: "text-cyan-600", accent: "bg-cyan-500" },
    "Engineering": { bg: "bg-indigo-500/10", text: "text-indigo-600", accent: "bg-indigo-500" },
};

const defaultTagColor = { bg: "bg-muted", text: "text-muted-foreground", accent: "bg-muted-foreground" };

// ============================================================
// Types
// ============================================================
export interface PostCardProps {
    id: string;
    author: {
        id: string;
        name: string;
        avatar?: string;
        initials: string;
    };
    title: string;
    content: string;
    tags: string[];
    createdAt: Date;
    likes: number;
    comments: number;
    isLiked?: boolean;
    isBookmarked?: boolean;
    isSolved?: boolean;
    isHelpWanted?: boolean;
    coverImage?: string;
    authorVipLevel?: number;
}

// ============================================================
// Utils
// ============================================================
function formatRelativeTime(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "刚刚";
    if (diffMins < 60) return `${diffMins} 分钟前`;
    if (diffHours < 24) return `${diffHours} 小时前`;
    if (diffDays < 7) return `${diffDays} 天前`;

    return date.toLocaleDateString("zh-CN", { month: "long", day: "numeric" });
}

// ============================================================
// 主组件
// ============================================================
export function PostCard({
    id,
    author,
    title,
    content,
    tags,
    createdAt,
    likes,
    comments,
    isLiked: initialIsLiked = false,
    isBookmarked: initialIsBookmarked = false,
    isSolved = false,
    isHelpWanted = false,
    coverImage,
    authorVipLevel = 1,
}: PostCardProps) {
    const [isLiked, setIsLiked] = useState(initialIsLiked);
    const [likeCount, setLikeCount] = useState(likes);
    const [isBookmarked, setIsBookmarked] = useState(initialIsBookmarked);
    const [isPending, startTransition] = useTransition();
    const [justLiked, setJustLiked] = useState(false);
    const [justBookmarked, setJustBookmarked] = useState(false);

    const hasCover = !!coverImage;
    const primaryTag = tags[0];
    const primaryColor = tagColors[primaryTag] || defaultTagColor;

    // ---- 事件处理 ----
    const handleLike = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const newLiked = !isLiked;
        setIsLiked(newLiked);
        setLikeCount(newLiked ? likeCount + 1 : likeCount - 1);

        if (newLiked) {
            setJustLiked(true);
            setTimeout(() => setJustLiked(false), 600);
        }

        startTransition(async () => {
            const result = await toggleLikePost(id);
            if (result.error) {
                setIsLiked(!newLiked);
                setLikeCount(newLiked ? likeCount : likeCount + 1);
                toast.error(result.error);
            }
        });
    };

    const handleBookmark = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const newBookmarked = !isBookmarked;
        setIsBookmarked(newBookmarked);

        if (newBookmarked) {
            setJustBookmarked(true);
            setTimeout(() => setJustBookmarked(false), 700);
        }

        startTransition(async () => {
            const result = await toggleBookmarkPost(id);
            if (result.error) {
                setIsBookmarked(!newBookmarked);
                toast.error(result.error);
            } else {
                toast.success(newBookmarked ? "已添加到收藏" : "已取消收藏");
            }
        });
    };

    const handleShare = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        try {
            await navigator.clipboard.writeText(`${window.location.origin}/posts/${id}`);
            toast.success("链接已复制到剪贴板");
            createShareRecord(id, "copy_link");
        } catch {
            toast.error("复制失败");
        }
    };

    // ---- 两种卡片模式 ----
    if (hasCover) {
        return <CoverCard />;
    }
    return <CompactCard />;

    // ===============================================
    // 有封面图 → 竖版卡片
    // ===============================================
    function CoverCard() {
        return (
            <motion.div
                whileHover={{ y: -3 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className="group"
            >
                <div className="relative bg-card/80 backdrop-blur-sm border border-border/40 rounded-xl overflow-hidden shadow-sm
                                hover:border-primary/20 hover:shadow-lg hover:shadow-primary/8
                                transition-all duration-300 will-change-transform">

                    {/* 左侧色带 (与 CompactCard 一致) */}
                    <div className={cn("absolute left-0 top-0 bottom-0 w-1 rounded-l-xl", primaryColor.accent)} />

                    <div className="p-6">
                        {/* 头部：作者 + 标签 + 更多 (与 CompactCard 一致) */}
                        <div className="flex items-center justify-between mb-4">
                            <Link href={`/user/${author.id}`} className="flex items-center gap-2.5 group/author min-w-0">
                                <Avatar className="h-9 w-9 border-2 border-background shadow-sm group-hover/author:ring-2 group-hover/author:ring-primary/20 transition-all shrink-0">
                                    <AvatarImage src={author.avatar} alt={author.name} />
                                    <AvatarFallback className="text-xs bg-gradient-to-br from-primary/30 to-primary/10 text-primary font-semibold">
                                        {author.initials}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-1.5">
                                        <p className="text-sm font-semibold text-foreground group-hover/author:text-primary transition-colors truncate">
                                            {author.name}
                                        </p>
                                        <VipBadge vipLevel={authorVipLevel} size="sm" showTitle={true} />
                                    </div>
                                    <p className="text-[11px] text-muted-foreground/60" suppressHydrationWarning>
                                        {formatRelativeTime(createdAt)}
                                    </p>
                                </div>
                            </Link>

                            <div className="flex items-center gap-2 shrink-0">
                                {/* 标签胶囊 */}
                                {tags.slice(0, 2).map((tag) => {
                                    const c = tagColors[tag] || defaultTagColor;
                                    return (
                                        <Badge
                                            key={tag}
                                            variant="outline"
                                            className={cn(
                                                "text-[10px] px-2 py-0 h-5 font-medium border-0 hidden sm:inline-flex",
                                                c.bg, c.text
                                            )}
                                        >
                                            {tag}
                                        </Badge>
                                    );
                                })}

                                {/* 更多操作 */}
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem>举报</DropdownMenuItem>
                                        <DropdownMenuItem>屏蔽作者</DropdownMenuItem>
                                        <DropdownMenuItem onClick={handleShare}>复制链接</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>

                        {/* 封面图 (头部下方, 16:9 圆角) */}
                        <Link href={`/posts/${id}`} className="block">
                            <div className="relative w-full aspect-[3/2] rounded-xl overflow-hidden mb-4">
                                <Image
                                    src={coverImage!}
                                    alt={title}
                                    fill
                                    sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                                    placeholder="blur"
                                    blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQwIiBoZWlnaHQ9IjQyNiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZTVlN2ViIi8+PC9zdmc+"
                                />
                                {/* 状态角标 */}
                                {(isSolved || isHelpWanted) && (
                                    <div className="absolute top-2.5 right-2.5">
                                        {isSolved ? (
                                            <Badge className="bg-emerald-500/90 text-white border-0 gap-1 text-[10px] font-semibold shadow-lg">
                                                <CheckCircle2 className="h-3 w-3" /> 已解决
                                            </Badge>
                                        ) : (
                                            <Badge className="bg-amber-500/90 text-white border-0 gap-1 text-[10px] font-semibold shadow-lg animate-pulse">
                                                <HelpCircle className="h-3 w-3" /> 求助
                                            </Badge>
                                        )}
                                    </div>
                                )}
                            </div>
                        </Link>

                        {/* 状态标签 (无封面图上的角标时在此展示) */}
                        {!isSolved && !isHelpWanted ? null : null}

                        {/* 标题 */}
                        <Link href={`/posts/${id}`}>
                            <h3 className="text-lg font-semibold text-foreground leading-snug line-clamp-2 hover:text-primary transition-colors duration-200">
                                {title}
                            </h3>
                        </Link>

                        {/* 摘要 */}
                        <p className="text-sm text-muted-foreground/80 line-clamp-2 mt-2.5 leading-relaxed break-words">
                            {content}
                        </p>

                        {/* 移动端标签 */}
                        {tags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2.5 sm:hidden">
                                {tags.slice(0, 3).map((tag) => {
                                    const c = tagColors[tag] || defaultTagColor;
                                    return (
                                        <Badge
                                            key={tag}
                                            variant="outline"
                                            className={cn(
                                                "text-[10px] px-2 py-0 h-5 font-medium border-0",
                                                c.bg, c.text
                                            )}
                                        >
                                            {tag}
                                        </Badge>
                                    );
                                })}
                            </div>
                        )}

                        {/* 底栏：互动按钮 (与 CompactCard 一致) */}
                        <div className="flex items-center justify-between mt-4 pt-3.5 border-t border-border/30">
                            <div className="flex items-center gap-1">
                                <ActionButton
                                    icon={<Heart className={cn("h-3.5 w-3.5", isLiked && "fill-current")} strokeWidth={2} />}
                                    count={likeCount}
                                    active={isLiked}
                                    activeColor="text-red-500"
                                    onClick={handleLike}
                                    disabled={isPending}
                                    animate={justLiked}
                                    particleType="heart"
                                />
                                <Link href={`/posts/${id}#comments`}>
                                    <ActionButton
                                        icon={<MessageCircle className="h-3.5 w-3.5" strokeWidth={2} />}
                                        count={comments}
                                        hoverColor="hover:text-primary"
                                    />
                                </Link>
                                <ActionButton
                                    icon={<Share2 className="h-3.5 w-3.5" strokeWidth={2} />}
                                    onClick={handleShare}
                                    hoverColor="hover:text-primary"
                                />
                            </div>

                            <ActionButton
                                icon={<Bookmark className={cn("h-3.5 w-3.5", isBookmarked && "fill-current")} strokeWidth={2} />}
                                active={isBookmarked}
                                activeColor="text-primary"
                                onClick={handleBookmark}
                                disabled={isPending}
                                hoverColor="hover:text-primary"
                                animate={justBookmarked}
                                particleType="star"
                            />
                        </div>
                    </div>
                </div>
            </motion.div>
        );
    }

    // ===============================================
    // 无封面图 → 横版卡片
    // ===============================================
    function CompactCard() {
        return (
            <motion.div
                whileHover={{ y: -3 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className="group"
            >
                <div className="relative bg-card/80 backdrop-blur-sm border border-border/40 rounded-xl overflow-hidden shadow-sm
                                hover:border-primary/20 hover:shadow-lg hover:shadow-primary/8
                                transition-all duration-300 will-change-transform">

                    {/* 左侧色带 */}
                    <div className={cn("absolute left-0 top-0 bottom-0 w-1 rounded-l-xl", primaryColor.accent)} />

                    <div className="p-6">
                        {/* 头部：作者 + 标签 + 更多 */}
                        <div className="flex items-center justify-between mb-4">
                            <Link href={`/user/${author.id}`} className="flex items-center gap-2.5 group/author min-w-0">
                                <Avatar className="h-9 w-9 border-2 border-background shadow-sm group-hover/author:ring-2 group-hover/author:ring-primary/20 transition-all shrink-0">
                                    <AvatarImage src={author.avatar} alt={author.name} />
                                    <AvatarFallback className="text-xs bg-gradient-to-br from-primary/30 to-primary/10 text-primary font-semibold">
                                        {author.initials}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-1.5">
                                        <p className="text-sm font-semibold text-foreground group-hover/author:text-primary transition-colors truncate">
                                            {author.name}
                                        </p>
                                        <VipBadge vipLevel={authorVipLevel} size="sm" showTitle={true} />
                                    </div>
                                    <p className="text-[11px] text-muted-foreground/60" suppressHydrationWarning>
                                        {formatRelativeTime(createdAt)}
                                    </p>
                                </div>
                            </Link>

                            <div className="flex items-center gap-2 shrink-0">
                                {/* 标签胶囊 */}
                                {tags.slice(0, 2).map((tag) => {
                                    const c = tagColors[tag] || defaultTagColor;
                                    return (
                                        <Badge
                                            key={tag}
                                            variant="outline"
                                            className={cn(
                                                "text-[10px] px-2 py-0 h-5 font-medium border-0 hidden sm:inline-flex",
                                                c.bg, c.text
                                            )}
                                        >
                                            {tag}
                                        </Badge>
                                    );
                                })}

                                {/* 更多操作 */}
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem>举报</DropdownMenuItem>
                                        <DropdownMenuItem>屏蔽作者</DropdownMenuItem>
                                        <DropdownMenuItem onClick={handleShare}>复制链接</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>

                        {/* 状态标签 */}
                        {(isSolved || (isHelpWanted && !isSolved)) && (
                            <div className="flex gap-2 mb-2">
                                {isSolved && (
                                    <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 border-0 gap-1 text-[10px] font-semibold">
                                        <CheckCircle2 className="h-3 w-3" /> 已解决
                                    </Badge>
                                )}
                                {isHelpWanted && !isSolved && (
                                    <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 border-0 gap-1 text-[10px] font-semibold">
                                        <HelpCircle className="h-3 w-3" /> 求助中
                                    </Badge>
                                )}
                            </div>
                        )}

                        {/* 标题 */}
                        <Link href={`/posts/${id}`}>
                            <h3 className="text-lg font-semibold text-foreground leading-snug line-clamp-2 hover:text-primary transition-colors duration-200">
                                {title}
                            </h3>
                        </Link>

                        {/* 摘要 */}
                        <p className="text-sm text-muted-foreground/80 line-clamp-2 mt-2.5 leading-relaxed break-words">
                            {content}
                        </p>

                        {/* 移动端标签（桌面端在头部已展示） */}
                        {tags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2.5 sm:hidden">
                                {tags.slice(0, 3).map((tag) => {
                                    const c = tagColors[tag] || defaultTagColor;
                                    return (
                                        <Badge
                                            key={tag}
                                            variant="outline"
                                            className={cn(
                                                "text-[10px] px-2 py-0 h-5 font-medium border-0",
                                                c.bg, c.text
                                            )}
                                        >
                                            {tag}
                                        </Badge>
                                    );
                                })}
                            </div>
                        )}

                        {/* 底栏：互动按钮 */}
                        <div className="flex items-center justify-between mt-4 pt-3.5 border-t border-border/30">
                            <div className="flex items-center gap-1">
                                <ActionButton
                                    icon={<Heart className={cn("h-3.5 w-3.5", isLiked && "fill-current")} strokeWidth={2} />}
                                    count={likeCount}
                                    active={isLiked}
                                    activeColor="text-red-500"
                                    onClick={handleLike}
                                    disabled={isPending}
                                    animate={justLiked}
                                    particleType="heart"
                                />
                                <Link href={`/posts/${id}#comments`}>
                                    <ActionButton
                                        icon={<MessageCircle className="h-3.5 w-3.5" strokeWidth={2} />}
                                        count={comments}
                                        hoverColor="hover:text-primary"
                                    />
                                </Link>
                                <ActionButton
                                    icon={<Share2 className="h-3.5 w-3.5" strokeWidth={2} />}
                                    onClick={handleShare}
                                    hoverColor="hover:text-primary"
                                />
                            </div>

                            <ActionButton
                                icon={<Bookmark className={cn("h-3.5 w-3.5", isBookmarked && "fill-current")} strokeWidth={2} />}
                                active={isBookmarked}
                                activeColor="text-primary"
                                onClick={handleBookmark}
                                disabled={isPending}
                                hoverColor="hover:text-primary"
                                animate={justBookmarked}
                                particleType="star"
                            />
                        </div>
                    </div>
                </div>
            </motion.div>
        );
    }
}

// ============================================================
// 互动按钮子组件
// ============================================================
interface ActionButtonProps {
    icon: React.ReactNode;
    count?: number;
    active?: boolean;
    activeColor?: string;
    hoverColor?: string;
    onClick?: (e: React.MouseEvent) => void;
    disabled?: boolean;
    animate?: boolean;
    particleType?: "heart" | "star";
}

// 生成粒子配置
function generateParticles(type: "heart" | "star") {
    const count = type === "heart" ? 6 : 5;
    const colors =
        type === "heart"
            ? ["#ef4444", "#f87171", "#fca5a5", "#fb923c", "#f472b6", "#e879f9"]
            : ["#f59e0b", "#fbbf24", "#fcd34d", "#fb923c", "#f97316"];

    return Array.from({ length: count }, (_, i) => {
        const angle = (360 / count) * i + (Math.random() * 30 - 15);
        const distance = 16 + Math.random() * 12;
        const rad = (angle * Math.PI) / 180;
        return {
            tx: Math.cos(rad) * distance,
            ty: Math.sin(rad) * distance,
            color: colors[i % colors.length],
            size: type === "heart" ? 4 + Math.random() * 2 : 5 + Math.random() * 3,
            delay: i * 0.03,
        };
    });
}

function ActionButton({
    icon,
    count,
    active = false,
    activeColor = "",
    hoverColor = "",
    onClick,
    disabled = false,
    animate = false,
    particleType,
}: ActionButtonProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={cn(
                "relative inline-flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors duration-200",
                "text-muted-foreground/70",
                active ? activeColor : hoverColor,
                disabled && "opacity-50"
            )}
        >
            {/* 粒子爆散层 */}
            {animate && particleType && (
                <span className="absolute inset-0 flex items-center justify-start pl-2 pointer-events-none overflow-visible">
                    {generateParticles(particleType).map((p, i) => (
                        <span
                            key={i}
                            className={particleType === "heart" ? "particle" : "star-particle"}
                            style={{
                                width: p.size,
                                height: p.size,
                                backgroundColor: particleType === "heart" ? p.color : undefined,
                                animationDelay: `${p.delay}s`,
                                "--tx": `${p.tx}px`,
                                "--ty": `${p.ty}px`,
                            } as React.CSSProperties}
                        >
                            {particleType === "star" && (
                                <svg width={p.size} height={p.size} viewBox="0 0 12 12" fill={p.color}>
                                    <path d="M6 0l1.76 3.57L12 4.18 8.82 7.07l.94 4.14L6 9.27 2.24 11.21l.94-4.14L0 4.18l4.24-.61z" />
                                </svg>
                            )}
                        </span>
                    ))}
                </span>
            )}

            <motion.span
                animate={animate ? { scale: [1, 1.4, 0.9, 1.1, 1] } : {}}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                className="inline-flex"
            >
                {icon}
            </motion.span>
            {count !== undefined && count > 0 && (
                <span className="tabular-nums">{count}</span>
            )}
        </button>
    );
}
