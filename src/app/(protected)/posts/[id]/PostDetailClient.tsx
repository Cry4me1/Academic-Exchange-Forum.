"use client";

import { useState, useCallback, useTransition, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TableOfContents, type HeadingItem, PostHistoryDialog, ShareCardDialog } from "@/components/posts";
import NovelViewer from "@/components/editor/NovelViewer";
import { CommentItem, CommentInput, CommentData } from "@/components/comments";
import { ReportDialog } from "@/components/ReportDialog";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import {
    toggleLikePost,
    toggleBookmarkPost,
    createShareRecord,
    createComment,
    deletePost,
} from "./actions";
import {
    ArrowLeft,
    Heart,
    MessageCircle,
    Bookmark,
    Share2,
    MoreHorizontal,
    Calendar,
    Eye,
    Flag,
    Trash2,
    CheckCircle2,
    HelpCircle,
    History,
    Pencil,
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
        is_solved?: boolean;
        is_help_wanted?: boolean;
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
    initialIsLiked?: boolean;
    initialIsBookmarked?: boolean;
    commentLikeStatus?: Record<string, boolean>;
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
    initialIsLiked = false,
    initialIsBookmarked = false,
    commentLikeStatus = {},
}: PostDetailClientProps) {
    const [headings, setHeadings] = useState<HeadingItem[]>([]);
    const [comments, setComments] = useState<CommentData[]>(initialComments);
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [isLiked, setIsLiked] = useState(initialIsLiked);
    const [likeCount, setLikeCount] = useState(post.like_count);
    const [isBookmarked, setIsBookmarked] = useState(initialIsBookmarked);
    const [isPending, startTransition] = useTransition();
    const [reportDialogOpen, setReportDialogOpen] = useState(false);
    const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
    const [shareDialogOpen, setShareDialogOpen] = useState(false);

    const authorInitials = post.author.username?.slice(0, 2).toUpperCase() || "?";
    const authorDisplayName = post.author.full_name || post.author.username;

    // Extract headings from content directly
    useEffect(() => {
        if (post.content && typeof post.content === 'object' && 'content' in post.content) {
            const extractedHeadings: HeadingItem[] = [];
            // @ts-ignore
            post.content.content?.forEach((node: any) => {
                if (node.type === "heading") {
                    extractedHeadings.push({
                        level: node.attrs?.level || 1,
                        text: node.content?.[0]?.text || "Untitled",
                        id: node.content?.[0]?.text?.toLowerCase().replace(/\s+/g, "-") || `heading-${Math.random()}`
                    });
                }
            });
            setHeadings(extractedHeadings);
        }
    }, [post.content]);

    const handleLike = () => {
        if (!currentUser) {
            toast.error("请先登录");
            return;
        }

        // 乐观更新
        const newLiked = !isLiked;
        setIsLiked(newLiked);
        setLikeCount(newLiked ? likeCount + 1 : likeCount - 1);

        startTransition(async () => {
            const result = await toggleLikePost(post.id);
            if (result.error) {
                // 回滚
                setIsLiked(!newLiked);
                setLikeCount(newLiked ? likeCount : likeCount + 1);
                toast.error(result.error);
            }
        });
    };

    const handleBookmark = () => {
        if (!currentUser) {
            toast.error("请先登录");
            return;
        }

        // 乐观更新
        const newBookmarked = !isBookmarked;
        setIsBookmarked(newBookmarked);

        startTransition(async () => {
            const result = await toggleBookmarkPost(post.id);
            if (result.error) {
                // 回滚
                setIsBookmarked(!newBookmarked);
                toast.error(result.error);
            } else {
                toast.success(newBookmarked ? "已添加到收藏" : "已取消收藏");
            }
        });
    };

    const handleShare = () => {
        setShareDialogOpen(true);
        // 记录分享
        createShareRecord(post.id, "copy_link");
    };

    const handleReply = (parentId: string) => {
        setReplyingTo(parentId);
    };

    const handleAccept = useCallback((commentId: string) => {
        setComments(currentComments =>
            currentComments.map(c => {
                // 如果是目标评论，切换状态
                if (c.id === commentId) {
                    return { ...c, is_accepted: !c.is_accepted };
                }
                // 如果是其他评论且当前是采纳操作（假设之前只有一个采纳），取消其他的
                // 但这里我们简单点，让数据库保证互斥，前端乐观更新只关心被点击的
                // 为了更好的体验，如果我们采纳了新的，应该把旧的取消
                if (c.is_accepted) {
                    return { ...c, is_accepted: false };
                }
                return c;
            })
        );
    }, []);

    const handleSubmitComment = async (content: object, parentId?: string | null) => {
        if (!currentUser) {
            toast.error("请先登录");
            return;
        }

        const result = await createComment({
            postId: post.id,
            parentId: parentId || undefined,
            content,
        });

        if (result.error) {
            toast.error(result.error);
            return;
        }

        const newComment = result.data;
        if (!newComment) return;

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
        <>
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
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon">
                                            <MoreHorizontal className="h-5 w-5" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        {currentUser?.id === post.author.id && (
                                            <>
                                                <DropdownMenuItem
                                                    onClick={() => {
                                                        window.location.href = `/posts/${post.id}/edit`;
                                                    }}
                                                >
                                                    <Pencil className="mr-2 h-4 w-4" />
                                                    编辑帖子
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={async () => {
                                                        if (confirm("确定要删除这篇帖子吗？此操作不可撤销。")) {
                                                            const result = await deletePost(post.id);
                                                            if (result.error) {
                                                                toast.error(result.error);
                                                            } else {
                                                                toast.success("帖子已删除");
                                                                window.location.href = "/dashboard";
                                                            }
                                                        }
                                                    }}
                                                    className="text-destructive focus:text-destructive"
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    删除帖子
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                            </>
                                        )}
                                        <DropdownMenuItem
                                            onClick={() => setHistoryDialogOpen(true)}
                                        >
                                            <History className="mr-2 h-4 w-4" />
                                            查看历史
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={() => setReportDialogOpen(true)}
                                            className="text-orange-600 focus:text-orange-600"
                                        >
                                            <Flag className="mr-2 h-4 w-4" />
                                            举报
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
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

                                <div className="flex items-center gap-2 mb-6">
                                    {post.is_solved && (
                                        <Badge variant="secondary" className="bg-green-500/10 text-green-600 border-green-500/20 gap-1 pl-2">
                                            <CheckCircle2 className="h-4 w-4" />
                                            已解决
                                        </Badge>
                                    )}
                                    {post.is_help_wanted && !post.is_solved && (
                                        <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 border-amber-500/20 gap-1 pl-2">
                                            <HelpCircle className="h-4 w-4" />
                                            求助
                                        </Badge>
                                    )}
                                </div>

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
                                <NovelViewer
                                    initialValue={post.content}
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
                                        disabled={isPending}
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
                                    disabled={isPending}
                                >
                                    <Bookmark className={`h-5 w-5 ${isBookmarked ? "fill-current" : ""}`} />
                                    收藏
                                </Button>
                            </motion.div>

                            {/* 评论区 */}
                            <motion.section variants={itemVariants} className="mt-12" id="comments">
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
                                                    postId={post.id}
                                                    currentUserId={currentUser?.id}
                                                    maxDepth={2}
                                                    onReply={handleReply}
                                                    onDelete={(commentId) => {
                                                        setComments((prev) => prev.filter((c) => c.id !== commentId));
                                                    }}
                                                    isLiked={commentLikeStatus[comment.id]}
                                                    isPostAuthor={currentUser?.id === post.author.id}
                                                    onAccept={handleAccept}
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

            {/* 举报对话框 */}
            <ReportDialog
                open={reportDialogOpen}
                onOpenChange={setReportDialogOpen}
                type="post"
                targetId={post.id}
                targetTitle={post.title}
            />

            {/* 历史版本对话框 */}
            <PostHistoryDialog
                open={historyDialogOpen}
                onOpenChange={setHistoryDialogOpen}
                postId={post.id}
                currentTitle={post.title}
            />

            {/* 分享卡片对话框 */}
            <ShareCardDialog
                open={shareDialogOpen}
                onOpenChange={setShareDialogOpen}
                postId={post.id}
                postTitle={post.title}
            />
        </>
    );
}
