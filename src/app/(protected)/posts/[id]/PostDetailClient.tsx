"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RichTextRenderer, TableOfContents, HeadingItem } from "@/components/posts";
import { CommentItem, CommentInput, CommentData } from "@/components/comments";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import {
    ArrowLeft,
    Heart,
    MessageCircle,
    Bookmark,
    Share2,
    MoreHorizontal,
    Calendar,
    Eye,
} from "lucide-react";

interface PostDetailClientProps {
    post: {
        id: string;
        title: string;
        content: object;
        tags: string[];
        view_count: number;
        like_count: number;
        comment_count: number;
        created_at: string;
        author: {
            id: string;
            username: string;
            full_name?: string;
            avatar_url?: string;
            bio?: string;
        };
    };
    comments: CommentData[];
    authorOtherPosts: {
        id: string;
        title: string;
        created_at: string;
    }[];
    currentUser: {
        id: string;
        username: string;
        avatar_url?: string;
    } | null;
}

// 标签颜色映射
const tagColors: Record<string, string> = {
    "Computer Science": "bg-blue-500/10 text-blue-600 border-blue-500/20",
    Mathematics: "bg-purple-500/10 text-purple-600 border-purple-500/20",
    AI: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    Physics: "bg-orange-500/10 text-orange-600 border-orange-500/20",
    Biology: "bg-green-500/10 text-green-600 border-green-500/20",
    Chemistry: "bg-cyan-500/10 text-cyan-600 border-cyan-500/20",
    Economics: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
    Philosophy: "bg-pink-500/10 text-pink-600 border-pink-500/20",
    Engineering: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20",
    default: "bg-muted text-muted-foreground border-muted",
};

// 动画变体
const pageVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.1,
        },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.5,
            ease: [0.22, 1, 0.36, 1] as const,
        },
    },
};

const contentVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.6,
            ease: [0.22, 1, 0.36, 1] as const,
            delay: 0.2,
        },
    },
};

export default function PostDetailClient({
    post,
    comments: initialComments,
    authorOtherPosts,
    currentUser,
}: PostDetailClientProps) {
    const [headings, setHeadings] = useState<HeadingItem[]>([]);
    const [comments, setComments] = useState<CommentData[]>(initialComments);
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [isLiked, setIsLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(post.like_count);
    const [isBookmarked, setIsBookmarked] = useState(false);

    const authorInitials = post.author.username?.slice(0, 2).toUpperCase() || "?";
    const authorDisplayName = post.author.full_name || post.author.username;

    const handleHeadingsExtracted = useCallback((extractedHeadings: HeadingItem[]) => {
        setHeadings(extractedHeadings);
    }, []);

    const handleLike = async () => {
        setIsLiked(!isLiked);
        setLikeCount(isLiked ? likeCount - 1 : likeCount + 1);
        // TODO: 调用 API 更新点赞状态
    };

    const handleBookmark = async () => {
        setIsBookmarked(!isBookmarked);
        toast.success(isBookmarked ? "已取消收藏" : "已添加到收藏");
        // TODO: 调用 API 更新收藏状态
    };

    const handleShare = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            toast.success("链接已复制到剪贴板");
        } catch {
            toast.error("复制失败");
        }
    };

    const handleReply = (parentId: string) => {
        setReplyingTo(parentId);
    };

    const handleSubmitComment = async (content: object, parentId?: string | null) => {
        if (!currentUser) {
            toast.error("请先登录");
            return;
        }

        const supabase = createClient();

        const { data: newComment, error } = await supabase
            .from("comments")
            .insert({
                post_id: post.id,
                author_id: currentUser.id,
                parent_id: parentId || null,
                content,
            })
            .select(`
                *,
                author:profiles!author_id (
                    id,
                    username,
                    full_name,
                    avatar_url
                )
            `)
            .single();

        if (error) {
            toast.error("评论发送失败");
            console.error("Failed to submit comment:", error);
            return;
        }

        // 更新评论列表
        if (parentId) {
            // 添加到父评论的回复中
            setComments((prev) =>
                prev.map((comment) => {
                    if (comment.id === parentId) {
                        return {
                            ...comment,
                            replies: [...(comment.replies || []), {
                                ...newComment,
                                replies: [],
                            }],
                        };
                    }
                    return comment;
                })
            );
            setReplyingTo(null);
        } else {
            // 添加为顶级评论
            setComments((prev) => [{
                ...newComment,
                replies: [],
            }, ...prev]);
        }

        toast.success("评论发送成功");
    };

    return (
        <motion.div
            variants={pageVariants}
            initial="hidden"
            animate="visible"
            className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20"
        >
            {/* 顶部导航 */}
            <motion.header
                variants={itemVariants}
                className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50"
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <Link href="/dashboard">
                            <Button variant="ghost" size="sm" className="gap-2">
                                <ArrowLeft className="h-4 w-4" />
                                返回
                            </Button>
                        </Link>

                        <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon" onClick={handleShare}>
                                <Share2 className="h-5 w-5" />
                            </Button>
                            <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-5 w-5" />
                            </Button>
                        </div>
                    </div>
                </div>
            </motion.header>

            {/* 主内容区域 */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex gap-8">
                    {/* 左侧主内容 */}
                    <main className="flex-1 min-w-0">
                        {/* 文章头部 */}
                        <motion.article variants={itemVariants} className="mb-8">
                            {/* 标签 */}
                            <div className="flex flex-wrap gap-2 mb-4">
                                {post.tags.map((tag) => (
                                    <Badge
                                        key={tag}
                                        variant="outline"
                                        className={`${tagColors[tag] || tagColors.default} font-medium`}
                                    >
                                        {tag}
                                    </Badge>
                                ))}
                            </div>

                            {/* 标题 */}
                            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-6 leading-tight">
                                {post.title}
                            </h1>

                            {/* 作者信息 */}
                            <div className="flex items-center justify-between flex-wrap gap-4 pb-6 border-b border-border/50">
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-12 w-12 ring-2 ring-primary/10">
                                        <AvatarImage src={post.author.avatar_url} alt={authorDisplayName} />
                                        <AvatarFallback className="bg-gradient-to-br from-primary/30 to-primary/10 text-primary font-semibold">
                                            {authorInitials}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-semibold text-foreground">{authorDisplayName}</p>
                                        {post.author.bio && (
                                            <p className="text-sm text-muted-foreground line-clamp-1">{post.author.bio}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                    <div className="flex items-center gap-1">
                                        <Calendar className="h-4 w-4" />
                                        <span>{formatDate(post.created_at)}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Eye className="h-4 w-4" />
                                        <span>{post.view_count} 浏览</span>
                                    </div>
                                </div>
                            </div>
                        </motion.article>

                        {/* 文章内容 */}
                        <motion.div variants={contentVariants} className="mb-12">
                            <RichTextRenderer
                                content={post.content}
                                className="leading-relaxed"
                                onHeadingsExtracted={handleHeadingsExtracted}
                            />
                        </motion.div>

                        {/* 互动区域 */}
                        <motion.div
                            variants={itemVariants}
                            className="flex items-center justify-between py-6 border-t border-b border-border/50"
                        >
                            <div className="flex items-center gap-4">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className={`gap-2 ${isLiked ? "text-red-500" : ""}`}
                                    onClick={handleLike}
                                >
                                    <Heart className={`h-5 w-5 ${isLiked ? "fill-current" : ""}`} />
                                    <span>{likeCount}</span>
                                </Button>
                                <Button variant="ghost" size="sm" className="gap-2">
                                    <MessageCircle className="h-5 w-5" />
                                    <span>{comments.length}</span>
                                </Button>
                            </div>

                            <Button
                                variant="ghost"
                                size="sm"
                                className={`gap-2 ${isBookmarked ? "text-primary" : ""}`}
                                onClick={handleBookmark}
                            >
                                <Bookmark className={`h-5 w-5 ${isBookmarked ? "fill-current" : ""}`} />
                                收藏
                            </Button>
                        </motion.div>

                        {/* 评论区 */}
                        <motion.section variants={itemVariants} className="mt-12">
                            <h2 className="text-xl font-semibold text-foreground mb-6">
                                评论 ({comments.length})
                            </h2>

                            {/* 评论输入框 */}
                            <div className="mb-8">
                                <CommentInput
                                    currentUser={currentUser}
                                    onSubmit={handleSubmitComment}
                                    placeholder="写下你的评论..."
                                />
                            </div>

                            {/* 评论列表 */}
                            {comments.length > 0 ? (
                                <div className="divide-y divide-border/50">
                                    {comments.map((comment) => (
                                        <div key={comment.id}>
                                            <CommentItem
                                                comment={comment}
                                                maxDepth={2}
                                                onReply={handleReply}
                                            />

                                            {/* 回复输入框 */}
                                            {replyingTo === comment.id && (
                                                <div className="ml-12 mb-4">
                                                    <CommentInput
                                                        currentUser={currentUser}
                                                        parentId={comment.id}
                                                        onSubmit={handleSubmitComment}
                                                        onCancel={() => setReplyingTo(null)}
                                                        placeholder={`回复 ${comment.author.username}...`}
                                                        autoFocus
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-muted/30 rounded-xl p-8 text-center">
                                    <p className="text-muted-foreground">暂无评论，快来发表第一条评论吧！</p>
                                </div>
                            )}
                        </motion.section>
                    </main>

                    {/* 右侧侧边栏（桌面端显示） */}
                    <aside className="hidden lg:block w-72 flex-shrink-0">
                        <div className="sticky top-24 space-y-6">
                            {/* 目录 */}
                            {headings.length > 0 && (
                                <motion.div
                                    variants={itemVariants}
                                    className="bg-card border border-border/50 rounded-xl p-4"
                                >
                                    <TableOfContents headings={headings} />
                                </motion.div>
                            )}

                            {/* 作者其他文章 */}
                            {authorOtherPosts.length > 0 && (
                                <motion.div
                                    variants={itemVariants}
                                    className="bg-card border border-border/50 rounded-xl p-4"
                                >
                                    <h3 className="font-semibold text-sm text-foreground mb-3">
                                        作者的其他文章
                                    </h3>
                                    <ul className="space-y-2">
                                        {authorOtherPosts.map((otherPost) => (
                                            <li key={otherPost.id}>
                                                <Link
                                                    href={`/posts/${otherPost.id}`}
                                                    className="block text-sm text-muted-foreground hover:text-foreground transition-colors line-clamp-2"
                                                >
                                                    {otherPost.title}
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                </motion.div>
                            )}
                        </div>
                    </aside>
                </div>
            </div>
        </motion.div>
    );
}
