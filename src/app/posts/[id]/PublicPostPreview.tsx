"use client";

import NovelViewer from "@/components/editor/NovelViewer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { VerifiedBadge } from "@/components/ui/verified-badge";
import { formatDate } from "@/lib/utils";
import { motion } from "framer-motion";
import {
    ArrowLeft,
    Bookmark,
    Calendar,
    Eye,
    Heart,
    Lock,
    LogIn,
    MessageCircle,
} from "lucide-react";
import Link from "next/link";

interface PublicPostPreviewProps {
    post: {
        id: string;
        title: string;
        content: object;
        tags: string[];
        view_count: number;
        like_count: number;
        comment_count: number;
        bookmark_count: number;
        created_at: string;
        updated_at: string;
        author: {
            id: string;
            username: string;
            full_name?: string;
            avatar_url?: string;
            is_verified?: boolean;
            auth_provider?: string;
        } | null;
    };
}

export default function PublicPostPreview({ post }: PublicPostPreviewProps) {
    const authorName = post.author?.full_name || post.author?.username || "匿名用户";
    const authorInitial = authorName.charAt(0).toUpperCase();

    return (
        <div className="min-h-screen bg-background">
            {/* 顶部导航 */}
            <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
                <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
                    <Link
                        href="/"
                        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        <span className="text-sm">返回首页</span>
                    </Link>
                    <div className="flex items-center gap-2">
                        <Link href="/login">
                            <Button
                                variant="outline"
                                size="sm"
                                className="text-sm"
                            >
                                <LogIn className="h-4 w-4 mr-1.5" />
                                登录
                            </Button>
                        </Link>
                        <Link href="/register">
                            <Button
                                size="sm"
                                className="text-sm text-white font-semibold bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 dark:from-amber-500 dark:to-orange-500 dark:text-slate-950"
                            >
                                注册
                            </Button>
                        </Link>
                    </div>
                </div>
            </header>

            {/* 帖子内容 */}
            <main className="max-w-4xl mx-auto px-4 py-8">
                <motion.article
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                >
                    {/* 标签 */}
                    {post.tags && post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                            {post.tags.map((tag) => (
                                <Badge
                                    key={tag}
                                    variant="secondary"
                                    className="text-xs"
                                >
                                    {tag}
                                </Badge>
                            ))}
                        </div>
                    )}

                    {/* 标题 */}
                    <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-6 leading-tight">
                        {post.title}
                    </h1>

                    {/* 作者信息 */}
                    <div className="flex items-center gap-4 mb-8 pb-6 border-b border-border/50">
                        <Avatar className="h-10 w-10">
                            <AvatarImage src={post.author?.avatar_url || ""} />
                            <AvatarFallback className="bg-gradient-to-br from-orange-400 to-amber-400 text-white text-sm font-bold">
                                {authorInitial}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                            <div className="flex items-center gap-1.5">
                                <span className="font-medium text-foreground">
                                    {authorName}
                                </span>
                                {post.author?.is_verified && (
                                    <VerifiedBadge provider={post.author?.auth_provider} />
                                )}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                                <span className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {formatDate(post.created_at)}
                                </span>
                                <span className="flex items-center gap-1">
                                    <Eye className="h-3 w-3" />
                                    {post.view_count} 浏览
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* 文章内容 */}
                    <div className="prose dark:prose-invert max-w-none mb-8">
                        <NovelViewer initialValue={post.content} />
                    </div>

                    {/* 互动统计（只读） */}
                    <div className="flex items-center gap-6 py-4 border-t border-border/50 text-muted-foreground">
                        <span className="flex items-center gap-1.5 text-sm">
                            <Heart className="h-4 w-4" />
                            {post.like_count}
                        </span>
                        <span className="flex items-center gap-1.5 text-sm">
                            <MessageCircle className="h-4 w-4" />
                            {post.comment_count}
                        </span>
                        <span className="flex items-center gap-1.5 text-sm">
                            <Bookmark className="h-4 w-4" />
                            {post.bookmark_count}
                        </span>
                    </div>
                </motion.article>

                {/* 登录提示 */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.2 }}
                    className="mt-8 p-8 rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 border border-orange-200/50 dark:border-orange-800/30 text-center"
                >
                    <div className="inline-flex p-3 rounded-full bg-orange-100 dark:bg-orange-900/30 mb-4">
                        <Lock className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                        登录后解锁完整功能
                    </h3>
                    <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                        登录 Scholarly 后可以点赞、评论、收藏帖子，参与学术讨论，发布自己的见解。
                    </p>
                    <div className="flex items-center justify-center gap-3">
                        <Link href="/login">
                            <Button
                                variant="outline"
                                size="lg"
                                className="font-medium"
                            >
                                登录账号
                            </Button>
                        </Link>
                        <Link href="/register">
                            <Button
                                size="lg"
                                className="font-medium text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 dark:from-amber-500 dark:to-orange-500 dark:text-slate-950"
                            >
                                免费注册
                            </Button>
                        </Link>
                    </div>
                </motion.div>
            </main>
        </div>
    );
}
