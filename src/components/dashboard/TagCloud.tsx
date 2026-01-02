"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface TagData {
    name: string;
    count: number;
    heat: "hot" | "warm" | "normal";
}

const heatStyles = {
    hot: "bg-gradient-to-r from-red-500/20 to-orange-500/20 text-red-600 border-red-500/30 hover:from-red-500/30 hover:to-orange-500/30",
    warm: "bg-gradient-to-r from-amber-500/15 to-yellow-500/15 text-amber-600 border-amber-500/25 hover:from-amber-500/25 hover:to-yellow-500/25",
    normal: "bg-muted/50 text-muted-foreground border-muted hover:bg-muted",
};

export function TagCloud() {
    const [tags, setTags] = useState<TagData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchTags() {
            const supabase = createClient();

            // 获取所有帖子的标签
            const { data: posts } = await supabase
                .from("posts")
                .select("tags")
                .eq("is_published", true);

            if (posts) {
                // 统计标签出现次数
                const tagCounts: Record<string, number> = {};
                posts.forEach((post) => {
                    if (post.tags && Array.isArray(post.tags)) {
                        post.tags.forEach((tag: string) => {
                            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
                        });
                    }
                });

                // 转换为数组并排序
                const sortedTags = Object.entries(tagCounts)
                    .map(([name, count]) => ({
                        name,
                        count,
                        heat: (count >= 10 ? "hot" : count >= 5 ? "warm" : "normal") as TagData["heat"],
                    }))
                    .sort((a, b) => b.count - a.count)
                    .slice(0, 10);

                setTags(sortedTags);
            }

            setLoading(false);
        }

        fetchTags();
    }, []);

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    热门话题
                </CardTitle>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="flex items-center justify-center py-4">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                ) : tags.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                        {tags.map((tag) => (
                            <Link key={tag.name} href={`/trending?tag=${encodeURIComponent(tag.name)}`}>
                                <Badge
                                    variant="outline"
                                    className={`cursor-pointer transition-all duration-200 text-xs px-2.5 py-1 ${heatStyles[tag.heat]}`}
                                >
                                    {tag.name}
                                    <span className="ml-1.5 opacity-60 text-[10px]">
                                        {tag.count >= 1000 ? `${(tag.count / 1000).toFixed(1)}k` : tag.count}
                                    </span>
                                </Badge>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                        暂无热门话题
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
