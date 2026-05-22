"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Flame, TrendingUp, Clock, Heart, MessageCircle, Eye } from "lucide-react";
import { motion } from "framer-motion";

export interface TrendingPost {
    id: string;
    title: string;
    content: string | object;
    tags: string[];
    created_at: string;
    view_count: number;
    like_count: number;
    comment_count: number;
    hotScore?: number;
    author: {
        id: string;
        username: string;
        avatar_url?: string;
    };
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

interface TrendingClientProps {
    initialPosts: TrendingPost[];
}

export default function TrendingClient({ initialPosts }: TrendingClientProps) {
    const [posts, setPosts] = useState<TrendingPost[]>(initialPosts);
    const [sortBy, setSortBy] = useState<"hot" | "views" | "likes">("hot");

    // 切换排序时重新排序已有数据（客户端排序，无需再次查询）
    const handleSortChange = (newSort: string) => {
        const sort = newSort as "hot" | "views" | "likes";
        setSortBy(sort);

        const sorted = [...initialPosts];
        if (sort === "hot") {
            sorted.sort((a, b) => {
                const scoreA = (a.view_count || 0) * 1 + (a.like_count || 0) * 5 + (a.comment_count || 0) * 3;
                const scoreB = (b.view_count || 0) * 1 + (b.like_count || 0) * 5 + (b.comment_count || 0) * 3;
                return scoreB - scoreA;
            });
        } else if (sort === "views") {
            sorted.sort((a, b) => (b.view_count || 0) - (a.view_count || 0));
        } else if (sort === "likes") {
            sorted.sort((a, b) => (b.like_count || 0) - (a.like_count || 0));
        }
        setPosts(sorted);
    };

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
                            <Flame className="h-6 w-6 text-orange-500" />
                            热门学术
                        </h1>
                        <p className="text-muted-foreground text-sm mt-1">
                            发现最受欢迎的学术讨论
                        </p>
                    </div>
                </div>

                {/* 排序选项 */}
                <Tabs value={sortBy} onValueChange={handleSortChange} className="mb-6">
                    <TabsList>
                        <TabsTrigger value="hot" className="gap-1.5">
                            <TrendingUp className="h-4 w-4" />
                            热度
                        </TabsTrigger>
                        <TabsTrigger value="views" className="gap-1.5">
                            <Eye className="h-4 w-4" />
                            浏览量
                        </TabsTrigger>
                        <TabsTrigger value="likes" className="gap-1.5">
                            <Heart className="h-4 w-4" />
                            点赞数
                        </TabsTrigger>
                    </TabsList>
                </Tabs>

                {/* 帖子列表 — 数据已由服务端预获取，无加载状态 */}
                {posts.length > 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="space-y-4"
                    >
                        {posts.map((post, index) => (
                            <motion.div
                                key={post.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.03 }}
                            >
                                <Card className="hover:shadow-md transition-shadow">
                                    <CardContent className="pt-4">
                                        <div className="flex items-start gap-4">
                                            {/* 排名 */}
                                            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${index < 3 ? "bg-gradient-to-br from-orange-400 to-red-500 text-white" : "bg-muted text-muted-foreground"
                                                }`}>
                                                {index + 1}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                {/* 标签 */}
                                                {post.tags && post.tags.length > 0 && (
                                                    <div className="flex flex-wrap gap-1.5 mb-2">
                                                        {post.tags.slice(0, 2).map((tag) => (
                                                            <Badge
                                                                key={tag}
                                                                variant="outline"
                                                                className={`text-xs ${tagColors[tag] || tagColors.default}`}
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
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </motion.div>
                ) : (
                    <div className="text-center py-16">
                        <Flame className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                        <h3 className="text-lg font-medium text-muted-foreground mb-2">暂无热门帖子</h3>
                        <p className="text-sm text-muted-foreground/70">
                            快来发布第一篇帖子吧！
                        </p>
                        <Link href="/posts/new">
                            <Button className="mt-4">发布帖子</Button>
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
