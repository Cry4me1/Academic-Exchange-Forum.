"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, Flame, Heart } from "lucide-react";

export type FeedFilter = "latest" | "trending" | "following";

interface FeedTabsProps {
    activeTab: FeedFilter;
    onTabChange: (tab: FeedFilter) => void;
}

export function FeedTabs({ activeTab, onTabChange }: FeedTabsProps) {
    return (
        <Tabs value={activeTab} onValueChange={(v) => onTabChange(v as FeedFilter)}>
            <TabsList className="w-full justify-start h-12 p-1 bg-muted/50 rounded-xl">
                <TabsTrigger
                    value="latest"
                    className="flex-1 gap-2 h-10 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-200"
                >
                    <Clock className="h-4 w-4" />
                    最新发表
                </TabsTrigger>
                <TabsTrigger
                    value="trending"
                    className="flex-1 gap-2 h-10 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-200"
                >
                    <Flame className="h-4 w-4" />
                    热度最高
                </TabsTrigger>
                <TabsTrigger
                    value="following"
                    className="flex-1 gap-2 h-10 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-200"
                >
                    <Heart className="h-4 w-4" />
                    我的关注
                </TabsTrigger>
            </TabsList>
        </Tabs>
    );
}
