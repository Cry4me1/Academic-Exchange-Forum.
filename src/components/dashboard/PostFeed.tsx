"use client";

import { useEffect, useState, useTransition } from "react";
import { PostCard } from "./PostCard";
import type { FeedFilter } from "./FeedTabs";
import { getPosts } from "@/app/(protected)/posts/actions";

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
    created_at: string;
    author: {
        id: string;
        username: string;
        full_name?: string;
        avatar_url?: string;
    };
    isLiked: boolean;
    isBookmarked: boolean;
}

interface PostFeedProps {
    filter: FeedFilter;
}

// 从富文本内容中提取纯文本摘要
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

export function PostFeed({ filter }: PostFeedProps) {
    const [posts, setPosts] = useState<PostData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isPending, startTransition] = useTransition();

    useEffect(() => {
        setIsLoading(true);
        startTransition(async () => {
            const result = await getPosts({ filter, limit: 20 });
            setPosts(result.posts as PostData[]);
            setIsLoading(false);
        });
    }, [filter]);

    if (isLoading || isPending) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                    <div
                        key={i}
                        className="bg-card border border-border/50 rounded-xl p-6 animate-pulse"
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <div className="h-10 w-10 rounded-full bg-muted" />
                            <div className="space-y-2">
                                <div className="h-4 w-24 bg-muted rounded" />
                                <div className="h-3 w-16 bg-muted rounded" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="h-5 w-3/4 bg-muted rounded" />
                            <div className="h-4 w-full bg-muted rounded" />
                            <div className="h-4 w-2/3 bg-muted rounded" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (posts.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="h-24 w-24 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                    <svg
                        className="h-12 w-12 text-muted-foreground/50"
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
                <h3 className="text-lg font-semibold text-foreground mb-1">暂无内容</h3>
                <p className="text-sm text-muted-foreground">
                    {filter === "following" ? "关注更多学者来查看他们的动态" : "还没有帖子，快来发布第一条吧！"}
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {posts.map((post) => (
                <PostCard
                    key={post.id}
                    id={post.id}
                    author={{
                        id: post.author.id,
                        name: post.author.full_name || post.author.username,
                        avatar: post.author.avatar_url,
                        initials: (post.author.username || "?").slice(0, 2).toUpperCase(),
                    }}
                    title={post.title}
                    content={extractTextFromContent(post.content)}
                    tags={post.tags}
                    createdAt={new Date(post.created_at)}
                    likes={post.like_count}
                    comments={post.comment_count}
                    isLiked={post.isLiked}
                    isBookmarked={post.isBookmarked}
                />
            ))}
        </div>
    );
}
