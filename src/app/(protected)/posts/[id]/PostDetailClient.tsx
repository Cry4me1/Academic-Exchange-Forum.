"use client";

import { CollapsibleReplies, CommentData, CommentInput, CommentItem, CommentSortTabs, type CommentSortType } from "@/components/comments";
import { CreateDuelDialog } from "@/components/duel/CreateDuelDialog";
import { ReputationBadgeCompact } from "@/components/duel/ReputationBadge";
import NovelViewer from "@/components/editor/NovelViewer";
import { ImmersiveToolbar, ShareCardDialog, TableOfContents, type HeadingItem } from "@/components/posts";
import { ReportDialog } from "@/components/ReportDialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useImmersiveMode } from "@/hooks/useImmersiveMode";
import { useReadingProgress } from "@/hooks/useReadingProgress";
import { cn, formatDate } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import {
    ArrowLeft,
    Bookmark,
    Calendar,
    CheckCircle2,
    Code2,
    Eye,
    Flag,
    Heart,
    HelpCircle,
    History,
    Loader2,
    Maximize2,
    MessageCircle,
    MoreHorizontal,
    Pencil,
    Share2,
    Swords,
    Trash2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import {
    createComment,
    createShareRecord,
    deletePost,
    getCommentsSorted,
    toggleBookmarkPost,
    toggleLikePost,
} from "./actions";

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
            reputation_score?: number;
            is_developer?: boolean;
            developer_title?: string;
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
    const router = useRouter();
    const [headings, setHeadings] = useState<HeadingItem[]>([]);
    const [comments, setComments] = useState<CommentData[]>(initialComments);
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [isLiked, setIsLiked] = useState(initialIsLiked);
    const [likeCount, setLikeCount] = useState(post.like_count);
    const [isBookmarked, setIsBookmarked] = useState(initialIsBookmarked);
    const [isPending, startTransition] = useTransition();
    const [reportDialogOpen, setReportDialogOpen] = useState(false);
    const [shareDialogOpen, setShareDialogOpen] = useState(false);
    const [duelDialogOpen, setDuelDialogOpen] = useState(false);

    // 评论排序状态
    const [commentSort, setCommentSort] = useState<CommentSortType>("newest");
    const [isSortLoading, setIsSortLoading] = useState(false);

    // 沉浸式阅读模式
    const { isImmersive, toggle: toggleImmersive, exit: exitImmersive } = useImmersiveMode();
    const readingProgress = useReadingProgress();

    const authorInitials = post.author.username?.slice(0, 2).toUpperCase() || "?";
    const authorDisplayName = post.author.full_name || post.author.username;

    // 从 DOM 中提取 heading 并注入 id 属性
    useEffect(() => {
        const extractHeadingsFromDOM = () => {
            const articleEl = document.querySelector('.novel-viewer-container');
            if (!articleEl) return;

            const hElements = articleEl.querySelectorAll('h1, h2, h3, h4');
            if (hElements.length === 0) return;

            const extractedHeadings: HeadingItem[] = [];
            const usedIds = new Set<string>();

            hElements.forEach((el, index) => {
                const text = el.textContent?.trim() || `heading-${index}`;
                const level = parseInt(el.tagName.charAt(1), 10);
                // 生成唯一 id
                const baseId = text
                    .toLowerCase()
                    .replace(/[^\w\u4e00-\u9fff]+/g, "-")
                    .replace(/^-+|-+$/g, "");
                let id = baseId || `heading-${index}`;
                let counter = 1;
                while (usedIds.has(id)) {
                    id = `${baseId}-${counter++}`;
                }
                usedIds.add(id);

                // 注入 id 到 DOM 元素
                el.setAttribute("id", id);

                extractedHeadings.push({ level, text, id });
            });

            setHeadings(extractedHeadings);
        };

        // 等待 Novel 编辑器渲染完成（延迟 + MutationObserver）
        const timer = setTimeout(extractHeadingsFromDOM, 500);

        const container = document.querySelector('.novel-viewer-container');
        let observer: MutationObserver | null = null;
        if (container) {
            observer = new MutationObserver(() => {
                extractHeadingsFromDOM();
            });
            observer.observe(container, { childList: true, subtree: true });
        }

        return () => {
            clearTimeout(timer);
            observer?.disconnect();
        };
    }, [post.content]);

    // 评论锚点跳转: URL 中 hash 指向 #comment-xxx 时自动滚动
    useEffect(() => {
        const hash = window.location.hash;
        if (hash && hash.startsWith("#comment-")) {
            const timer = setTimeout(() => {
                const el = document.querySelector(hash);
                if (el) {
                    el.scrollIntoView({ behavior: "smooth", block: "center" });
                }
            }, 800); // 等待评论渲染完成
            return () => clearTimeout(timer);
        }
    }, []);

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
                if (c.id === commentId) {
                    return { ...c, is_accepted: !c.is_accepted };
                }
                if (c.is_accepted) {
                    return { ...c, is_accepted: false };
                }
                return c;
            })
        );
    }, []);

    // 评论排序切换
    const handleSortChange = async (sort: CommentSortType) => {
        if (sort === commentSort) return;
        setCommentSort(sort);
        setIsSortLoading(true);

        try {
            const sorted = await getCommentsSorted(post.id, sort);
            setComments(sorted);
        } catch (error) {
            console.error("排序加载失败:", error);
            toast.error("加载评论失败");
        } finally {
            setIsSortLoading(false);
        }
    };

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
                className={cn(
                    "min-h-screen bg-gradient-to-br from-background via-background to-muted/20 relative",
                    isImmersive && "immersive-content"
                )}
            >
                {/* 沉浸模式: 背景光晕 */}
                <AnimatePresence>
                    {isImmersive && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.6 }}
                            className="immersive-glow"
                        />
                    )}
                </AnimatePresence>

                {/* 沉浸模式: 极简浮动工具条 */}
                <AnimatePresence>
                    {isImmersive && (
                        <ImmersiveToolbar
                            progress={readingProgress}
                            onExit={exitImmersive}
                        />
                    )}
                </AnimatePresence>

                {/* 顶部导航 - 始终在 DOM，沉浸模式下 CSS 隐藏 */}
                <header
                    className={cn(
                        "sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50",
                        "transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-[opacity,transform]",
                        isImmersive && "opacity-0 -translate-y-full pointer-events-none"
                    )}
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
                                {/* 沉浸式阅读模式按钮 */}
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={toggleImmersive}
                                    title="专注阅读 (Ctrl+Shift+F)"
                                    aria-label="切换专注阅读模式"
                                    className="text-muted-foreground hover:text-foreground"
                                >
                                    <Maximize2 className="h-5 w-5" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={handleShare}>
                                    <Share2 className="h-5 w-5" />
                                </Button>
                                {(!currentUser || currentUser.id !== post.author.id) && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="gap-2 border-primary/20 text-primary hover:bg-primary/5 hidden sm:flex"
                                        onClick={() => {
                                            if (!currentUser) {
                                                toast.error("请先登录后发起挑战");
                                                router.push("/login");
                                                return;
                                            }
                                            setDuelDialogOpen(true);
                                        }}
                                    >
                                        <Swords className="h-4 w-4" />
                                        发起挑战
                                    </Button>
                                )}
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
                                        {(!currentUser || currentUser.id !== post.author.id) && (
                                            <>
                                                <DropdownMenuItem
                                                    onClick={() => {
                                                        if (!currentUser) {
                                                            toast.error("请先登录后发起挑战");
                                                            router.push("/login");
                                                            return;
                                                        }
                                                        setDuelDialogOpen(true);
                                                    }}
                                                    className="sm:hidden text-primary focus:text-primary"
                                                >
                                                    <Swords className="mr-2 h-4 w-4" />
                                                    发起挑战
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator className="sm:hidden" />
                                            </>
                                        )}
                                        <DropdownMenuItem asChild>
                                            <Link href={`/posts/${post.id}/history`}>
                                                <History className="mr-2 h-4 w-4" />
                                                查看历史
                                            </Link>
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
                </header>

                {/* 沉浸模式: 浮动目录 (桌面端) */}
                {isImmersive && headings.length > 0 && (
                    <div className="hidden lg:block">
                        <TableOfContents headings={headings} mode="floating" />
                    </div>
                )}

                <div
                    className="mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10"
                    style={{
                        maxWidth: isImmersive ? "56rem" : "80rem",
                        paddingTop: isImmersive ? "4.5rem" : undefined,
                        transition: "max-width 0.5s cubic-bezier(0.22, 1, 0.36, 1), padding-top 0.5s cubic-bezier(0.22, 1, 0.36, 1)",
                    }}
                >
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
                                            <div className="flex items-center gap-2">
                                                <p className="font-semibold text-foreground">{authorDisplayName}</p>
                                                {post.author.is_developer && (
                                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-gradient-to-r from-violet-500/10 via-fuchsia-500/10 to-pink-500/10 text-xs">
                                                        <Code2 className="h-3 w-3 text-violet-500" />
                                                        <span className="font-bold bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 bg-clip-text text-transparent">开发者</span>
                                                    </span>
                                                )}
                                                {post.author.reputation_score !== undefined && (
                                                    <ReputationBadgeCompact
                                                        score={post.author.reputation_score}
                                                        isDeveloper={post.author.is_developer}
                                                    />
                                                )}
                                            </div>
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
                            <motion.section variants={itemVariants} className="mt-12" id="comments" aria-label="评论区">
                                {/* 排序切换 Tab */}
                                <CommentSortTabs
                                    activeSort={commentSort}
                                    onSortChange={handleSortChange}
                                    commentCount={comments.length}
                                />

                                {/* 评论输入框 */}
                                <div className="mb-8">
                                    <CommentInput
                                        currentUser={currentUser}
                                        onSubmit={handleSubmitComment}
                                        placeholder="写下你的评论..."
                                    />
                                </div>

                                {/* 排序加载指示器 */}
                                {isSortLoading && (
                                    <div className="flex items-center justify-center py-8">
                                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                        <span className="ml-2 text-sm text-muted-foreground">加载中...</span>
                                    </div>
                                )}

                                {/* 评论列表 */}
                                {!isSortLoading && comments.length > 0 ? (
                                    <div className="divide-y divide-border/30">
                                        {comments.map((comment) => (
                                            <div key={comment.id} className="py-1">
                                                <CommentItem
                                                    comment={comment}
                                                    postId={post.id}
                                                    postAuthorId={post.author.id}
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

                                                {/* 可折叠回复 */}
                                                {comment.replies && comment.replies.length > 0 && (
                                                    <CollapsibleReplies
                                                        replies={comment.replies}
                                                        postId={post.id}
                                                        postAuthorId={post.author.id}
                                                        currentUserId={currentUser?.id}
                                                        isPostAuthor={currentUser?.id === post.author.id}
                                                        onReply={handleReply}
                                                        onDelete={(commentId) => {
                                                            setComments(prev => prev.map(c => ({
                                                                ...c,
                                                                replies: c.replies?.filter(r => r.id !== commentId) || []
                                                            })));
                                                        }}
                                                        onAccept={handleAccept}
                                                        commentLikeStatus={commentLikeStatus}
                                                        collapseThreshold={3}
                                                    />
                                                )}

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
                                ) : !isSortLoading ? (
                                    <div className="bg-muted/30 rounded-xl p-8 text-center" role="status">
                                        <MessageCircle className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" aria-hidden="true" />
                                        <p className="text-muted-foreground">暂无评论，快来发表第一条评论吧！</p>
                                    </div>
                                ) : null}
                            </motion.section>
                        </main>

                        {/* 右侧侧边栏（桌面端显示，沉浸模式收起） */}
                        <aside
                            className={cn(
                                "hidden lg:block flex-shrink-0 overflow-hidden",
                                "transition-[width,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
                                isImmersive
                                    ? "w-0 opacity-0 pointer-events-none"
                                    : "w-72 opacity-100"
                            )}
                        >
                            <div className="sticky top-24 space-y-6 w-72">
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

            {/* 分享卡片对话框 */}
            <ShareCardDialog
                open={shareDialogOpen}
                onOpenChange={setShareDialogOpen}
                postId={post.id}
                postTitle={post.title}
            />

            {/* 发起决斗对话框 */}
            <CreateDuelDialog
                open={duelDialogOpen}
                onOpenChange={setDuelDialogOpen}
                currentUser={currentUser}
                defaultTopic={post.title}
            />
        </>
    );
}
