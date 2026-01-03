"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import {
    Heart,
    MessageCircle,
    Share2,
    MoreHorizontal,
    Bookmark,
    CheckCircle2,
    HelpCircle
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toggleLikePost, toggleBookmarkPost, createShareRecord } from "@/app/(protected)/posts/[id]/actions";
import { toast } from "sonner";

// 学科标签颜色映射
const tagColors: Record<string, string> = {
    "Mathematics": "bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 border-blue-500/20",
    "Computer Science": "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-500/20",
    "Physics": "bg-purple-500/10 text-purple-600 hover:bg-purple-500/20 border-purple-500/20",
    "Biology": "bg-green-500/10 text-green-600 hover:bg-green-500/20 border-green-500/20",
    "Chemistry": "bg-orange-500/10 text-orange-600 hover:bg-orange-500/20 border-orange-500/20",
    "Economics": "bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 border-amber-500/20",
    "Philosophy": "bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 border-rose-500/20",
    "AI": "bg-cyan-500/10 text-cyan-600 hover:bg-cyan-500/20 border-cyan-500/20",
    "Engineering": "bg-indigo-500/10 text-indigo-600 hover:bg-indigo-500/20 border-indigo-500/20",
    "default": "bg-muted text-muted-foreground hover:bg-muted/80 border-muted",
};

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
}

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
}: PostCardProps) {
    const [isLiked, setIsLiked] = useState(initialIsLiked);
    const [likeCount, setLikeCount] = useState(likes);
    const [isBookmarked, setIsBookmarked] = useState(initialIsBookmarked);
    const [isPending, startTransition] = useTransition();

    const handleLike = () => {
        // 乐观更新
        const newLiked = !isLiked;
        setIsLiked(newLiked);
        setLikeCount(newLiked ? likeCount + 1 : likeCount - 1);

        startTransition(async () => {
            const result = await toggleLikePost(id);
            if (result.error) {
                // 回滚
                setIsLiked(!newLiked);
                setLikeCount(newLiked ? likeCount : likeCount + 1);
                toast.error(result.error);
            }
        });
    };

    const handleBookmark = () => {
        // 乐观更新
        const newBookmarked = !isBookmarked;
        setIsBookmarked(newBookmarked);

        startTransition(async () => {
            const result = await toggleBookmarkPost(id);
            if (result.error) {
                // 回滚
                setIsBookmarked(!newBookmarked);
                toast.error(result.error);
            } else {
                toast.success(newBookmarked ? "已添加到收藏" : "已取消收藏");
            }
        });
    };

    const handleShare = async () => {
        try {
            await navigator.clipboard.writeText(`${window.location.origin}/posts/${id}`);
            toast.success("链接已复制到剪贴板");
            // 记录分享（不阻塞 UI）
            createShareRecord(id, "copy_link");
        } catch {
            toast.error("复制失败");
        }
    };

    return (
        <Card className="group hover:shadow-lg transition-all duration-300 border-border/50 hover:border-border bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                    {/* 作者信息 */}
                    <Link href={`/user/${author.id}`} className="flex items-center gap-3 group/author">
                        <Avatar className="h-10 w-10 border-2 border-background shadow-sm group-hover/author:ring-2 group-hover/author:ring-primary/20 transition-all">
                            <AvatarImage src={author.avatar} alt={author.name} />
                            <AvatarFallback className="bg-gradient-to-br from-primary/30 to-primary/10 text-primary font-semibold">
                                {author.initials}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="text-sm font-semibold text-foreground group-hover/author:text-primary transition-colors">
                                {author.name}
                            </p>
                            <p className="text-xs text-muted-foreground" suppressHydrationWarning>
                                {formatRelativeTime(createdAt)}
                            </p>
                        </div>
                    </Link>

                    {/* 更多操作 */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
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
            </CardHeader>

            <CardContent className="pb-3">
                <div className="flex items-center gap-2 mb-2">
                    {isSolved && (
                        <Badge variant="secondary" className="bg-green-500/10 text-green-600 hover:bg-green-500/20 border-green-500/20 gap-1 pl-2">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            已解决
                        </Badge>
                    )}
                    {isHelpWanted && !isSolved && (
                        <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 border-amber-500/20 gap-1 pl-2">
                            <HelpCircle className="h-3.5 w-3.5" />
                            求助
                        </Badge>
                    )}
                </div>

                {/* 标题 */}
                <Link href={`/posts/${id}`}>
                    <h3 className="text-lg font-bold text-foreground hover:text-primary transition-colors mb-2 line-clamp-2">
                        {title}
                    </h3>
                </Link>

                {/* 内容摘要 */}
                <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                    {content}
                </p>

                {/* 学科标签 */}
                {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                        {tags.map((tag) => (
                            <Badge
                                key={tag}
                                variant="outline"
                                className={`text-xs px-2.5 py-0.5 font-medium cursor-pointer transition-colors ${tagColors[tag] || tagColors.default
                                    }`}
                            >
                                {tag}
                            </Badge>
                        ))}
                    </div>
                )}
            </CardContent>

            <CardFooter className="pt-3 border-t border-border/50">
                <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-1">
                        {/* 点赞 */}
                        <Button
                            variant="ghost"
                            size="sm"
                            className={`gap-1.5 h-9 px-3 ${isLiked ? "text-red-500" : "text-muted-foreground hover:text-red-500"}`}
                            onClick={handleLike}
                            disabled={isPending}
                        >
                            <Heart className={`h-4 w-4 ${isLiked ? "fill-current" : ""}`} />
                            <span className="text-sm font-medium">{likeCount}</span>
                        </Button>

                        {/* 评论 */}
                        <Link href={`/posts/${id}#comments`}>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="gap-1.5 h-9 px-3 text-muted-foreground hover:text-primary"
                            >
                                <MessageCircle className="h-4 w-4" />
                                <span className="text-sm font-medium">{comments}</span>
                            </Button>
                        </Link>

                        {/* 分享 */}
                        <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1.5 h-9 px-3 text-muted-foreground hover:text-primary"
                            onClick={handleShare}
                        >
                            <Share2 className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* 收藏 */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className={`h-9 w-9 ${isBookmarked ? "text-primary" : "text-muted-foreground hover:text-primary"}`}
                        onClick={handleBookmark}
                        disabled={isPending}
                    >
                        <Bookmark className={`h-4 w-4 ${isBookmarked ? "fill-current" : ""}`} />
                    </Button>
                </div>
            </CardFooter>
        </Card>
    );
}
