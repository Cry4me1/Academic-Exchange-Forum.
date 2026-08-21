"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, BookMarked, Compass, HeartOff, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { getFollowedCollections, toggleFollowCollection } from "../actions";
import { CollectionCard } from "@/components/collections";
import { Button } from "@/components/ui/button";

const containerVariants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.08,
        },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

export default function FollowedCollectionsPage() {
    const [collections, setCollections] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadCollections();
    }, []);

    const loadCollections = async () => {
        setIsLoading(true);
        try {
            const { collections } = await getFollowedCollections();
            setCollections(collections || []);
        } catch (error) {
            console.error("Failed to load followed collections:", error);
            toast.error("加载关注专栏失败");
        } finally {
            setIsLoading(false);
        }
    };

    const handleUnfollow = async (collectionId: string, collectionName: string) => {
        // 乐观从列表中移除
        const prev = [...collections];
        setCollections(collections.filter(c => c.id !== collectionId));

        const result = await toggleFollowCollection(collectionId);
        if (result.error) {
            setCollections(prev);
            toast.error(result.error);
        } else {
            toast(`已取消关注专栏「${collectionName}」`);
        }
    };

    return (
        <div className="min-h-screen bg-background pb-16">
            {/* 顶部 Header */}
            <div className="border-b border-border/60 bg-card/40 backdrop-blur-md sticky top-0 z-30">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/dashboard">
                            <Button variant="ghost" size="icon" className="rounded-full">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
                                <BookMarked className="h-5 w-5 text-primary" />
                                关注专栏
                            </h1>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                共关注 {collections.length} 个学术专栏 · 专栏发布新文章时将实时通知你
                            </p>
                        </div>
                    </div>

                    <Link href="/trending">
                        <Button variant="outline" size="sm" className="gap-1.5 rounded-full text-xs">
                            <Compass className="h-3.5 w-3.5" />
                            发现更多专栏
                        </Button>
                    </Link>
                </div>
            </div>

            {/* 专栏列表区域 */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6 mt-8">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-24">
                        <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
                        <p className="text-sm text-muted-foreground">正在加载关注的专栏...</p>
                    </div>
                ) : collections.length > 0 ? (
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="show"
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
                    >
                        {collections.map((col) => (
                            <motion.div
                                key={col.id}
                                variants={itemVariants}
                                className="relative group"
                            >
                                <CollectionCard
                                    id={col.id}
                                    name={col.name}
                                    description={col.description}
                                    coverUrl={col.cover_url}
                                    coverStyle={col.cover_style}
                                    postCount={col.post_count}
                                    isPublic={col.is_public}
                                    updatedAt={col.updated_at}
                                    authorName={col.author?.username || "未知学者"}
                                    showAuthor
                                />

                                {/* 悬浮快捷取关按钮 */}
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleUnfollow(col.id, col.name);
                                    }}
                                    className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-200 h-7 text-xs bg-background/90 hover:bg-destructive hover:text-destructive-foreground backdrop-blur-md shadow-md gap-1 z-10 border border-border/50"
                                >
                                    <HeartOff className="h-3.5 w-3.5" />
                                    <span>取消关注</span>
                                </Button>
                            </motion.div>
                        ))}
                    </motion.div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-24 text-center bg-card/40 rounded-2xl border border-dashed border-border/80 shadow-xs max-w-md mx-auto p-8">
                        <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                            <BookMarked className="h-7 w-7" />
                        </div>
                        <h3 className="text-lg font-bold text-foreground mb-1.5">暂无关注的专栏</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                            在浏览学者专栏时点击「关注专栏」，后续更新的精彩篇目将第一时间推送到你的通知中心。
                        </p>
                        <Link href="/trending">
                            <Button className="gap-2 rounded-xl shadow-md">
                                <Sparkles className="h-4 w-4" />
                                去发现优质专栏
                            </Button>
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
