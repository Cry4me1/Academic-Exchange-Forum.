"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Sparkles, Eye, Heart, MessageCircle, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

interface RecommendedPost {
    id: string;
    title: string;
    view_count: number;
    like_count: number;
    comment_count: number;
    similarity: number;
    common_concepts?: string[]; // 新增：共同概念词条
}

interface SemanticRecommendationsProps {
    postId: string;
    className?: string;
}

export function SemanticRecommendations({ postId, className }: SemanticRecommendationsProps) {
    const [recommendations, setRecommendations] = useState<RecommendedPost[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchRecommendations() {
            try {
                const res = await fetch(`/api/posts/${postId}/recommendations?t=${Date.now()}`);
                if (res.ok) {
                    const data = await res.json();
                    setRecommendations(data);
                }
            } catch (err) {
                console.error("Failed to fetch recommendations:", err);
            } finally {
                setLoading(false);
            }
        }
        fetchRecommendations();
    }, [postId]);

    if (loading) {
        return (
            <div className={cn("bg-card border border-border/50 rounded-xl p-4", className)}>
                <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="h-4 w-4 text-amber-500 animate-pulse" />
                    <span className="text-sm font-semibold text-foreground">AI 推荐</span>
                </div>
                <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="animate-pulse space-y-1.5">
                            <div className="h-4 bg-muted rounded w-full" />
                            <div className="h-3 bg-muted rounded w-2/3" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (recommendations.length === 0) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
                "bg-card border border-border/50 rounded-xl p-4 overflow-hidden relative",
                className
            )}
        >
            {/* 顶部渐变装饰 */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-amber-500/50 via-orange-500/50 to-rose-500/50" />

            <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center justify-center h-6 w-6 rounded-md bg-amber-500/10">
                    <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                </div>
                <h3 className="font-semibold text-sm text-foreground">AI 语义推荐</h3>
            </div>

            <ul className="space-y-1">
                {recommendations.map((rec, index) => (
                    <motion.li
                        key={rec.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 + index * 0.05 }}
                    >
                        <Link
                            href={`/posts/${rec.id}`}
                            className="group block px-2.5 py-2 rounded-lg hover:bg-muted/50 transition-all duration-200"
                        >
                            <p className="text-sm text-muted-foreground group-hover:text-foreground transition-colors line-clamp-2 mb-1">
                                {rec.title}
                            </p>
                            
                            {/* 展现具体相似词条与共同探讨概念 (超高颜值微光 Badge) */}
                            {rec.common_concepts && rec.common_concepts.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1 mb-2">
                                    {rec.common_concepts.map((concept, cIdx) => (
                                        <span
                                            key={cIdx}
                                            className="inline-flex items-center text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-medium border border-amber-500/20"
                                        >
                                            # {concept}
                                        </span>
                                    ))}
                                </div>
                            )}

                            <div className="flex items-center gap-3 text-[11px] text-muted-foreground/70">
                                <span className="inline-flex items-center gap-1">
                                    <TrendingUp className="h-3 w-3" />
                                    {Math.round(rec.similarity * 100)}%
                                </span>
                                <span className="inline-flex items-center gap-0.5">
                                    <Eye className="h-3 w-3" />
                                    {rec.view_count}
                                </span>
                                <span className="inline-flex items-center gap-0.5">
                                    <Heart className="h-3 w-3" />
                                    {rec.like_count}
                                </span>
                                <span className="inline-flex items-center gap-0.5">
                                    <MessageCircle className="h-3 w-3" />
                                    {rec.comment_count}
                                </span>
                            </div>
                        </Link>
                    </motion.li>
                ))}
            </ul>
        </motion.div>
    );
}
