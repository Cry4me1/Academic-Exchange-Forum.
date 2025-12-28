"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";

const hotTags = [
    { name: "Machine Learning", count: 1234, heat: "hot" },
    { name: "Quantum Computing", count: 892, heat: "hot" },
    { name: "Mathematics", count: 756, heat: "warm" },
    { name: "Deep Learning", count: 654, heat: "warm" },
    { name: "Graph Theory", count: 543, heat: "normal" },
    { name: "Algorithms", count: 432, heat: "normal" },
    { name: "Statistics", count: 321, heat: "normal" },
    { name: "Cryptography", count: 287, heat: "normal" },
];

const heatStyles = {
    hot: "bg-gradient-to-r from-red-500/20 to-orange-500/20 text-red-600 border-red-500/30 hover:from-red-500/30 hover:to-orange-500/30",
    warm: "bg-gradient-to-r from-amber-500/15 to-yellow-500/15 text-amber-600 border-amber-500/25 hover:from-amber-500/25 hover:to-yellow-500/25",
    normal: "bg-muted/50 text-muted-foreground border-muted hover:bg-muted",
};

export function TagCloud() {
    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    热门话题
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex flex-wrap gap-2">
                    {hotTags.map((tag) => (
                        <Link key={tag.name} href={`/tags/${encodeURIComponent(tag.name)}`}>
                            <Badge
                                variant="outline"
                                className={`cursor-pointer transition-all duration-200 text-xs px-2.5 py-1 ${heatStyles[tag.heat as keyof typeof heatStyles]
                                    }`}
                            >
                                {tag.name}
                                <span className="ml-1.5 opacity-60 text-[10px]">
                                    {tag.count >= 1000 ? `${(tag.count / 1000).toFixed(1)}k` : tag.count}
                                </span>
                            </Badge>
                        </Link>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
