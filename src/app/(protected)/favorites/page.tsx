"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Bookmark, Heart, MessageCircle, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

interface BookmarkedPost {
    id: string;
    title: string;
    content: string | object;
    created_at: string;
    like_count: number;
    comment_count: number;
    author: {
        id: string;
        username: string;
        avatar_url?: string;
    };
    bookmarked_at: string;
}

// 从 JSON 内容中提取文本
function extractTextFromContent(content: string | object): string {
    if (typeof content === "string") {
        return content.replace(/<[^>]*>/g, "");
    }
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

export default function FavoritesPage() {
    const [bookmarks, setBookmarks] = useState<BookmarkedPost[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        async function loadBookmarks() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setLoading(false);
                return;
            }

            const { data, error } = await supabase
                .from("bookmarks")
                .select(`
                    created_at,
                    post:posts!inner (
                        id, title, content, created_at, like_count, comment_count,
                        author:profiles!author_id (id, username, avatar_url)
                    )
                `)
                .eq("user_id", user.id)
                .order("created_at", { ascending: false });

            if (error) {
                console.error("Failed to load bookmarks:", error);
            } else if (data) {
                const bookmarksList = data
                    .filter((item) => item.post)
                    .map((item) => ({
                        ...(item.post as unknown as Omit<BookmarkedPost, "bookmarked_at">),
                        bookmarked_at: item.created_at,
                    }));
                setBookmarks(bookmarksList as BookmarkedPost[]);
            }

            setLoading(false);
        }

        loadBookmarks();
    }, [supabase]);

    const handleRemoveBookmark = async (postId: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { error } = await supabase
            .from("bookmarks")
            .delete()
            .eq("user_id", user.id)
            .eq("post_id", postId);

        if (error) {
            toast.error("取消收藏失败");
        } else {
            setBookmarks((prev) => prev.filter((b) => b.id !== postId));
            toast.success("已取消收藏");
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* 头部 */}
                <div className="flex items-center gap-4 mb-8">
                    <Link href="/dashboard">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                            <Bookmark className="h-6 w-6 text-primary" />
                            我的收藏
                        </h1>
                        <p className="text-muted-foreground text-sm mt-1">
                            共 {bookmarks.length} 篇收藏
                        </p>
                    </div>
                </div>

                {/* 收藏列表 */}
                {bookmarks.length > 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="space-y-4"
                    >
                        {bookmarks.map((post, index) => (
                            <motion.div
                                key={post.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <Card className="hover:shadow-md transition-shadow">
                                    <CardContent className="pt-4">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1 min-w-0">
                                                <Link href={`/posts/${post.id}`}>
                                                    <h3 className="font-semibold hover:text-primary transition-colors line-clamp-1">
                                                        {post.title}
                                                    </h3>
                                                </Link>
                                                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                                    {extractTextFromContent(post.content).substring(0, 150)}...
                                                </p>
                                                <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                                                    <Link href={`/user/${post.author?.id}`} className="hover:text-foreground">
                                                        @{post.author?.username || "未知"}
                                                    </Link>
                                                    <span>{new Date(post.created_at).toLocaleDateString("zh-CN")}</span>
                                                    <span className="flex items-center gap-1">
                                                        <Heart className="h-3 w-3" /> {post.like_count || 0}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <MessageCircle className="h-3 w-3" /> {post.comment_count || 0}
                                                    </span>
                                                    <span className="ml-auto text-muted-foreground/60">
                                                        收藏于 {new Date(post.bookmarked_at).toLocaleDateString("zh-CN")}
                                                    </span>
                                                </div>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="flex-shrink-0 text-muted-foreground hover:text-destructive"
                                                onClick={() => handleRemoveBookmark(post.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </motion.div>
                ) : (
                    <div className="text-center py-16">
                        <Bookmark className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                        <h3 className="text-lg font-medium text-muted-foreground mb-2">暂无收藏</h3>
                        <p className="text-sm text-muted-foreground/70">
                            浏览帖子时点击收藏按钮，即可在这里查看
                        </p>
                        <Link href="/dashboard">
                            <Button className="mt-4">浏览帖子</Button>
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
