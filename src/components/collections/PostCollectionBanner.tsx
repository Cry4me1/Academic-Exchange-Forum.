"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChevronRight, FolderPlus, Layers } from "lucide-react";
import Link from "next/link";
import { COLLECTION_COVER_PRESETS } from "./CollectionCard";

export interface CollectionSummary {
    id: string;
    name: string;
    description?: string | null;
    cover_url?: string | null;
    cover_style?: string;
    post_count: number;
    position?: number;
    posts?: Array<{
        id: string;
        title: string;
        position: number;
        created_at: string;
    }>;
}

interface PostCollectionBannerProps {
    collections: CollectionSummary[];
    currentPostId: string;
    isAuthor?: boolean;
    onManageCollections?: () => void;
    className?: string;
}

export function PostCollectionBanner({
    collections,
    currentPostId,
    isAuthor = false,
    onManageCollections,
    className,
}: PostCollectionBannerProps) {
    if (!collections || collections.length === 0) {
        if (!isAuthor) return null;
        return (
            <div className={cn("mb-4", className)}>
                <button
                    type="button"
                    onClick={onManageCollections}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-muted/40 hover:bg-primary/10 text-muted-foreground hover:text-primary border border-dashed border-border/70 hover:border-primary/40 transition-all duration-200 group cursor-pointer"
                >
                    <FolderPlus className="h-3.5 w-3.5 text-primary/70 group-hover:text-primary transition-colors" />
                    <span>本文尚未加入专栏 · 点击归入你的学术专栏开启连载目录</span>
                </button>
            </div>
        );
    }

    const primaryCol = collections[0];
    const preset = COLLECTION_COVER_PRESETS.find(p => p.id === primaryCol.cover_style) || COLLECTION_COVER_PRESETS[0];

    // 计算当前文章在专栏中的序号
    let currentIdx = -1;
    let totalCount = primaryCol.post_count || 0;
    if (primaryCol.posts && primaryCol.posts.length > 0) {
        currentIdx = primaryCol.posts.findIndex(p => p.id === currentPostId);
        totalCount = primaryCol.posts.length;
    }

    return (
        <div className={cn("flex flex-wrap items-center gap-2.5 mb-4", className)}>
            <Link
                href={`/collections/${primaryCol.id}`}
                className="group/col inline-flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-medium bg-primary/[0.06] hover:bg-primary/[0.12] text-primary border border-primary/20 hover:border-primary/40 transition-all shadow-sm"
            >
                <span className="flex items-center gap-1.5 font-semibold text-foreground/90 group-hover/col:text-primary transition-colors">
                    <span className="text-sm leading-none">{primaryCol.cover_url ? "📚" : preset.icon}</span>
                    <span>收录于专栏</span>
                    <span className="text-primary font-bold truncate max-w-[220px]">
                        「{primaryCol.name}」
                    </span>
                </span>

                {currentIdx !== -1 && (
                    <Badge variant="secondary" className="h-4 px-1.5 text-[10px] bg-primary/15 text-primary border-0 font-normal">
                        第 {currentIdx + 1}/{totalCount} 篇
                    </Badge>
                )}

                <ChevronRight className="h-3.5 w-3.5 text-primary/60 group-hover/col:translate-x-0.5 group-hover/col:text-primary transition-transform" />
            </Link>

            {/* 如果收录于更多专栏 */}
            {collections.length > 1 && (
                <div className="flex items-center gap-1.5">
                    {collections.slice(1).map((col) => (
                        <Link key={col.id} href={`/collections/${col.id}`}>
                            <Badge
                                variant="outline"
                                className="text-[11px] h-6 px-2 text-muted-foreground hover:text-primary hover:border-primary/30 transition-colors gap-1"
                            >
                                <Layers className="h-3 w-3" />
                                {col.name}
                            </Badge>
                        </Link>
                    ))}
                </div>
            )}

            {/* 作者快速管理按钮 */}
            {isAuthor && onManageCollections && (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onManageCollections}
                    className="h-6 text-[11px] px-2 text-muted-foreground/80 hover:text-primary gap-1 rounded-md"
                    title="管理所属专栏"
                >
                    <FolderPlus className="h-3 w-3" />
                    <span>调整</span>
                </Button>
            )}
        </div>
    );
}
