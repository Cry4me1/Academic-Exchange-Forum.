"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, Megaphone, ChevronRight, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

// 公告数据 - 只保留最新的一条
const announcement = {
    id: "launch-2026",
    type: "announcement" as const,
    title: "Scholarly 学术论坛上线啦！",
    content: "欢迎来到 Scholarly！这是一个专为学术交流设计的平台，支持 LaTeX 公式、代码高亮、实时协作等功能。立即探索，开启你的学术之旅！",
    date: "2026-01-02",
    isNew: true,
};

export function AnnouncementCard() {
    return (
        <Card className="bg-gradient-to-br from-primary/5 via-primary/10 to-purple-500/10 border-primary/20 overflow-hidden">
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                    <Bell className="h-4 w-4 text-primary" />
                    公告通知
                </CardTitle>
            </CardHeader>
            <CardContent>
                <Link href="/announcements/launch-2026">
                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="p-4 rounded-lg bg-background/60 hover:bg-background/80 transition-all cursor-pointer group border border-primary/10 hover:border-primary/30"
                    >
                        <div className="flex items-start gap-3">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center shrink-0">
                                <Sparkles className="h-5 w-5 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <h4 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                                        {announcement.title}
                                    </h4>
                                    {announcement.isNew && (
                                        <span className="px-1.5 py-0.5 text-[10px] font-medium bg-red-500 text-white rounded animate-pulse">
                                            NEW
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                    {announcement.content}
                                </p>
                                <div className="flex items-center justify-between mt-2">
                                    <p className="text-xs text-muted-foreground/60">
                                        {announcement.date}
                                    </p>
                                    <span className="text-xs text-primary flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        查看详情 <ChevronRight className="h-3 w-3" />
                                    </span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </Link>
            </CardContent>
        </Card>
    );
}
