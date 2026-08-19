"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowLeft, ArrowRight, BookOpen, Layers } from "lucide-react";
import Link from "next/link";
import { COLLECTION_COVER_PRESETS } from "./CollectionCard";
import type { CollectionSummary } from "./PostCollectionBanner";

interface PostCollectionFooterNavProps {
    collection: CollectionSummary;
    currentPostId: string;
    className?: string;
}

export function PostCollectionFooterNav({
    collection,
    currentPostId,
    className,
}: PostCollectionFooterNavProps) {
    const posts = collection.posts || [];
    if (posts.length <= 1) return null;

    const preset = COLLECTION_COVER_PRESETS.find(p => p.id === collection.cover_style) || COLLECTION_COVER_PRESETS[0];

    const currentIdx = posts.findIndex(p => p.id === currentPostId);
    const prevPost = currentIdx > 0 ? posts[currentIdx - 1] : null;
    const nextPost = currentIdx >= 0 && currentIdx < posts.length - 1 ? posts[currentIdx + 1] : null;

    if (!prevPost && !nextPost) return null;

    return (
        <section className={cn("mt-10 mb-8 pt-6 border-t border-border/50", className)} aria-label="专栏连载导航">
            {/* 专栏连载导读头 */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <span className="text-base">{collection.cover_url ? "📚" : preset.icon}</span>
                    <div>
                        <span className="text-xs text-muted-foreground font-medium">本文收录于专栏</span>
                        <Link
                            href={`/collections/${collection.id}`}
                            className="text-sm font-semibold text-foreground hover:text-primary transition-colors ml-1.5 inline-flex items-center gap-1"
                        >
                            {collection.name}
                        </Link>
                    </div>
                </div>

                <Button asChild variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground hover:text-primary gap-1">
                    <Link href={`/collections/${collection.id}`}>
                        <Layers className="h-3.5 w-3.5" />
                        查看专栏全部 ({posts.length} 篇)
                    </Link>
                </Button>
            </div>

            {/* 前后篇双向导读卡 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {prevPost ? (
                    <Link
                        href={`/posts/${prevPost.id}`}
                        className="group flex flex-col justify-between p-4 rounded-xl border border-border/60 bg-card/60 hover:bg-card hover:border-primary/30 hover:shadow-md transition-all text-left"
                    >
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground group-hover:text-primary transition-colors font-medium mb-1.5">
                            <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" />
                            <span>上一篇</span>
                            <Badge variant="secondary" className="h-4 px-1 text-[10px] ml-auto">
                                第 {currentIdx} 篇
                            </Badge>
                        </div>
                        <h5 className="text-sm font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                            {prevPost.title}
                        </h5>
                    </Link>
                ) : (
                    <div className="hidden sm:flex flex-col justify-center p-4 rounded-xl border border-dashed border-border/40 bg-muted/10 text-muted-foreground/50 text-xs">
                        已是专栏的第一篇
                    </div>
                )}

                {nextPost ? (
                    <Link
                        href={`/posts/${nextPost.id}`}
                        className="group flex flex-col justify-between p-4 rounded-xl border border-border/60 bg-card/60 hover:bg-card hover:border-primary/30 hover:shadow-md transition-all text-right sm:text-right"
                    >
                        <div className="flex items-center justify-end gap-1.5 text-xs text-muted-foreground group-hover:text-primary transition-colors font-medium mb-1.5">
                            <Badge variant="secondary" className="h-4 px-1 text-[10px] mr-auto">
                                第 {currentIdx + 2} 篇
                            </Badge>
                            <span>下一篇</span>
                            <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                        <h5 className="text-sm font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                            {nextPost.title}
                        </h5>
                    </Link>
                ) : (
                    <div className="hidden sm:flex flex-col justify-center p-4 rounded-xl border border-dashed border-border/40 bg-muted/10 text-muted-foreground/50 text-xs text-right">
                        已是专栏的最新篇章
                    </div>
                )}
            </div>
        </section>
    );
}
