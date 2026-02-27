"use client";

import { GlobalSearch } from "@/components/dashboard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";
import { ArrowLeft, Clock, Eye, Heart, Loader2, MessageCircle, Search } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

interface SearchResultPost {
    id: string;
    title: string;
    content: string | object;
    tags: string[];
    created_at: string;
    view_count: number;
    like_count: number;
    comment_count: number;
    author: {
        id: string;
        username: string;
        avatar_url?: string;
    };
}

interface SearchResultUser {
    id: string;
    username: string;
    avatar_url?: string;
    bio?: string;
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

function SearchResultsContent() {
    const searchParams = useSearchParams();
    const query = searchParams.get("q") || "";

    const [posts, setPosts] = useState<SearchResultPost[]>([]);
    const [users, setUsers] = useState<SearchResultUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"all" | "posts" | "users">("all");
    const supabase = createClient();

    useEffect(() => {
        async function performSearch() {
            if (!query.trim()) {
                setPosts([]);
                setUsers([]);
                setLoading(false);
                return;
            }

            setLoading(true);

            // Fetch posts matching the query
            const { data: postsData, error: postsError } = await supabase
                .from("posts")
                .select(`
                    id, title, content, tags, created_at, view_count, like_count, comment_count,
                    author:profiles!author_id (id, username, avatar_url)
                `)
                .eq("is_published", true)
                .or(`title.ilike.%${query}%,tags.cs.{${query}}`)
                .order("created_at", { ascending: false })
                .limit(20);

            if (postsError) {
                console.error("Failed to search posts:", postsError);
            } else if (postsData) {
                setPosts(postsData as unknown as SearchResultPost[]);
            }

            // Fetch users matching the query
            const { data: usersData, error: usersError } = await supabase
                .from("profiles")
                .select(`id, username, avatar_url, bio`)
                .ilike("username", `%${query}%`)
                .limit(10);

            if (usersError) {
                console.error("Failed to search users:", usersError);
            } else if (usersData) {
                setUsers(usersData as SearchResultUser[]);
            }

            setLoading(false);
        }

        performSearch();
    }, [supabase, query]);

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* 头部 */}
            <div className="flex items-center gap-4 mb-6">
                <Link href="/dashboard">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div className="flex-1">
                    <GlobalSearch className="max-w-md w-full" />
                </div>
            </div>

            <div className="mb-8">
                <h1 className="text-2xl font-bold text-foreground">
                    {query ? `"${query}" 的搜索结果` : "搜索"}
                </h1>
                <p className="text-muted-foreground text-sm mt-1">
                    找到 {posts.length} 篇帖子，{users.length} 个用户
                </p>
            </div>

            {/* 标签页 */}
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="mb-6">
                <TabsList>
                    <TabsTrigger value="all">综合</TabsTrigger>
                    <TabsTrigger value="posts">帖子 ({posts.length})</TabsTrigger>
                    <TabsTrigger value="users">用户 ({users.length})</TabsTrigger>
                </TabsList>
            </Tabs>

            {loading ? (
                <div className="flex items-center justify-center py-16">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : (!query.trim()) ? (
                <div className="text-center py-16">
                    <Search className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                    <h3 className="text-lg font-medium text-muted-foreground mb-2">输入关键词进行搜索</h3>
                    <p className="text-sm text-muted-foreground/70">
                        你可以搜索帖子标题、内容、标签或用户名
                    </p>
                </div>
            ) : (posts.length === 0 && users.length === 0) ? (
                <div className="text-center py-16">
                    <Search className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                    <h3 className="text-lg font-medium text-muted-foreground mb-2">未找到相关结果</h3>
                    <p className="text-sm text-muted-foreground/70">
                        尝试使用不同的关键词重新搜索
                    </p>
                </div>
            ) : (
                <div className="space-y-8">
                    {/* 用户部分 */}
                    {(activeTab === "all" || activeTab === "users") && users.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="space-y-4"
                        >
                            {activeTab === "all" && <h2 className="text-lg font-semibold border-b pb-2">用户</h2>}
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                {users.map((user) => (
                                    <Link key={user.id} href={`/user/${user.id}`}>
                                        <Card className="hover:shadow-md transition-shadow cursor-pointer">
                                            <CardContent className="p-4 flex items-center gap-4">
                                                <Avatar className="h-12 w-12">
                                                    <AvatarImage src={user.avatar_url} />
                                                    <AvatarFallback>{user.username?.charAt(0).toUpperCase()}</AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-semibold truncate">{user.username}</h3>
                                                    {user.bio && (
                                                        <p className="text-xs text-muted-foreground truncate">{user.bio}</p>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </Link>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* 帖子部分 */}
                    {(activeTab === "all" || activeTab === "posts") && posts.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="space-y-4"
                        >
                            {activeTab === "all" && <h2 className="text-lg font-semibold border-b pb-2">帖子</h2>}
                            {posts.map((post, index) => (
                                <motion.div
                                    key={post.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                >
                                    <Card className="hover:shadow-md transition-shadow">
                                        <CardContent className="pt-4">
                                            <div className="flex-1 min-w-0">
                                                {/* 标签 */}
                                                {post.tags && post.tags.length > 0 && (
                                                    <div className="flex flex-wrap gap-1.5 mb-2">
                                                        {post.tags.slice(0, 3).map((tag) => (
                                                            <Badge
                                                                key={tag}
                                                                variant="outline"
                                                                className="text-xs bg-muted text-muted-foreground"
                                                            >
                                                                {tag}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                )}

                                                <Link href={`/posts/${post.id}`}>
                                                    <h3 className="font-semibold hover:text-primary transition-colors line-clamp-1">
                                                        {post.title}
                                                    </h3>
                                                </Link>
                                                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                                    {extractTextFromContent(post.content).substring(0, 150)}...
                                                </p>

                                                <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                                                    <Link
                                                        href={`/user/${post.author?.id}`}
                                                        className="flex items-center gap-1.5 hover:text-foreground"
                                                    >
                                                        <Avatar className="h-5 w-5">
                                                            <AvatarImage src={post.author?.avatar_url} />
                                                            <AvatarFallback className="text-[10px]">
                                                                {post.author?.username?.charAt(0).toUpperCase()}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        {post.author?.username}
                                                    </Link>
                                                    <span className="flex items-center gap-1">
                                                        <Eye className="h-3 w-3" /> {post.view_count || 0}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Heart className="h-3 w-3" /> {post.like_count || 0}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <MessageCircle className="h-3 w-3" /> {post.comment_count || 0}
                                                    </span>
                                                    <span className="ml-auto flex items-center gap-1">
                                                        <Clock className="h-3 w-3" />
                                                        {new Date(post.created_at).toLocaleDateString("zh-CN")}
                                                    </span>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ))}
                        </motion.div>
                    )}
                </div>
            )}
        </div>
    );
}

export default function SearchPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
            <Suspense fallback={
                <div className="flex items-center justify-center min-h-screen">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            }>
                <SearchResultsContent />
            </Suspense>
        </div>
    );
}
