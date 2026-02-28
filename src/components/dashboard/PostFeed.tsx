"use client";

import { getPosts } from "@/app/(protected)/posts/actions";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import type { FeedFilter } from "./FeedTabs";
import { PostCard } from "./PostCard";
import { PostCardSkeletonCompact, PostCardSkeletonWithCover, PostFeedSkeleton } from "./PostCardSkeleton";
// @ts-ignore
import Masonry from "react-masonry-css";

// ====================
// 瀑布流断点
// ====================
const breakpointColumnsObj = {
    default: 2,
    1280: 2,
    768: 1
};

// ====================
// Types
// ====================
interface PostData {
    id: string;
    title: string;
    content: object;
    tags: string[];
    view_count: number;
    like_count: number;
    comment_count: number;
    bookmark_count: number;
    share_count: number;
    is_solved: boolean;
    is_help_wanted: boolean;
    created_at: string;
    author: {
        id: string;
        username: string;
        full_name?: string;
        avatar_url?: string;
    };
    isLiked: boolean;
    isBookmarked: boolean;
    authorVipLevel: number;
}

interface PostFeedProps {
    filter: FeedFilter;
}

const PAGE_SIZE = 12;

// ====================
// Utils
// ====================
function extractTextFromContent(content: object): string {
    try {
        const jsonContent = content as { content?: Array<{ content?: Array<{ text?: string }> }> };
        if (jsonContent.content) {
            const texts: string[] = [];
            for (const node of jsonContent.content) {
                if (node.content) {
                    for (const child of node.content) {
                        if (child.text) {
                            texts.push(child.text);
                        }
                    }
                }
            }
            return texts.join(" ").slice(0, 200);
        }
    } catch {
        // ignore
    }
    return "";
}

function extractImageFromContent(content: object): string | undefined {
    try {
        const jsonContent = content as { content?: Array<any> };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const findImage = (nodes: Array<any>): string | undefined => {
            for (const node of nodes) {
                if (node.type === "image" && node.attrs?.src) {
                    return node.attrs.src;
                }
                if (node.content) {
                    const found = findImage(node.content);
                    if (found) return found;
                }
            }
            return undefined;
        };

        if (jsonContent.content) {
            return findImage(jsonContent.content);
        }
    } catch {
        // ignore
    }
    return undefined;
}

// ====================
// 动画变体
// ====================
const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: {
            delay: i * 0.05,
            duration: 0.4,
            ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
        },
    }),
};

// ====================
// 主组件
// ====================
export function PostFeed({ filter }: PostFeedProps) {
    const [posts, setPosts] = useState<PostData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [page, setPage] = useState(1);
    const [isPending, startTransition] = useTransition();
    const loadMoreRef = useRef<HTMLDivElement>(null);

    // 初始加载 & filter 变化时重新加载
    useEffect(() => {
        setIsLoading(true);
        setPage(1);
        setHasMore(true);

        startTransition(async () => {
            const result = await getPosts({ filter, limit: PAGE_SIZE, page: 1 });
            const newPosts = result.posts as PostData[];
            setPosts(newPosts);
            setHasMore(newPosts.length >= PAGE_SIZE);
            setIsLoading(false);
        });
    }, [filter]);

    // 加载更多
    const loadMore = useCallback(async () => {
        if (isLoadingMore || !hasMore) return;
        setIsLoadingMore(true);
        const nextPage = page + 1;

        const result = await getPosts({ filter, limit: PAGE_SIZE, page: nextPage });
        const newPosts = result.posts as PostData[];

        setPosts((prev) => [...prev, ...newPosts]);
        setPage(nextPage);
        setHasMore(newPosts.length >= PAGE_SIZE);
        setIsLoadingMore(false);
    }, [filter, page, isLoadingMore, hasMore]);

    // Intersection Observer 无限滚动
    useEffect(() => {
        if (!loadMoreRef.current) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !isLoadingMore && !isLoading) {
                    loadMore();
                }
            },
            { rootMargin: "200px" }
        );

        observer.observe(loadMoreRef.current);
        return () => observer.disconnect();
    }, [loadMore, hasMore, isLoadingMore, isLoading]);

    // ---- 加载态 ----
    if (isLoading || isPending) {
        return <PostFeedSkeleton count={6} />;
    }

    // ---- 空态 ----
    if (posts.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="h-24 w-24 rounded-full bg-muted/30 flex items-center justify-center mb-5">
                    <svg
                        className="h-12 w-12 text-muted-foreground/40"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                    </svg>
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-1.5">暂无内容</h3>
                <p className="text-sm text-muted-foreground max-w-xs">
                    {filter === "following"
                        ? "关注更多学者来查看他们的动态"
                        : "还没有帖子，快来发布第一条吧！"}
                </p>
            </div>
        );
    }

    // ---- 主列表 ----
    return (
        <div>
            <AnimatePresence mode="wait">
                <motion.div
                    key={filter}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                >
                    {/* 瀑布流网格 */}
                    <Masonry
                        breakpointCols={breakpointColumnsObj}
                        className="flex w-auto -ml-6"
                        columnClassName="pl-6 bg-clip-padding space-y-6"
                    >
                        {posts.map((post, i) => (
                            <motion.div
                                key={post.id}
                                custom={i % PAGE_SIZE}
                                variants={cardVariants}
                                initial="hidden"
                                animate="visible"
                            >
                                <PostCard
                                    id={post.id}
                                    author={{
                                        id: post.author.id,
                                        name: post.author.full_name || post.author.username,
                                        avatar: post.author.avatar_url,
                                        initials: (post.author.username || "?").slice(0, 2).toUpperCase(),
                                    }}
                                    title={post.title}
                                    content={extractTextFromContent(post.content)}
                                    coverImage={extractImageFromContent(post.content)}
                                    tags={post.tags}
                                    createdAt={new Date(post.created_at)}
                                    likes={post.like_count}
                                    comments={post.comment_count}
                                    isLiked={post.isLiked}
                                    isBookmarked={post.isBookmarked}
                                    isSolved={post.is_solved}
                                    isHelpWanted={post.is_help_wanted}
                                    authorVipLevel={post.authorVipLevel}
                                />
                            </motion.div>
                        ))}
                    </Masonry>

                    {/* 加载更多触发区域 */}
                    <div ref={loadMoreRef} className="mt-6 min-h-[1px]">
                        {isLoadingMore && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <PostCardSkeletonCompact />
                                    <PostCardSkeletonWithCover />
                                    <PostCardSkeletonCompact />
                                </div>
                            </motion.div>
                        )}
                        {!hasMore && posts.length >= PAGE_SIZE && (
                            <p className="text-xs text-muted-foreground/50 text-center py-4">
                                — 已加载全部内容 —
                            </p>
                        )}
                    </div>
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
