"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Bell, BookOpen, ChevronRight, Rocket, Sparkles } from "lucide-react";
import Link from "next/link";

// 公告数据列表
const announcements = [
    {
        id: "update-v1-0-0",
        href: "/updates",
        title: "🚀 v1.0.0: 正式版发布！",
        content: "Dashboard 卡片升级、沉浸式阅读体验、VIP 会员系统、个人主页颜色自定义，四大核心功能全面上线！",
        date: "2026-02-28",
        isNew: true,
        icon: Rocket,
        iconBg: "from-primary to-violet-500",
    },
    {
        id: "launch-2026",
        href: "/announcements/launch-2026",
        title: "Scholarly 学术论坛上线啦！",
        content: "欢迎来到 Scholarly！这是一个专为学术交流设计的平台，支持 LaTeX 公式、代码高亮、实时协作等功能。",
        date: "2026-01-02",
        isNew: false,
        icon: Sparkles,
        iconBg: "from-primary to-purple-500",
    },
    {
        id: "tutorials",
        href: "/announcements/tutorials",
        title: "📚 新手教程指南",
        content: "快速了解 Scholarly 的使用方法，包括编辑器教程、平台功能介绍等，助你快速上手！",
        date: "2026-01-03",
        isNew: false,
        icon: BookOpen,
        iconBg: "from-emerald-500 to-teal-500",
    },
];

export function AnnouncementCard() {
    return (
        <Card className="bg-gradient-to-br from-primary/5 via-primary/10 to-purple-500/10 border-primary/20 overflow-hidden">
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                    <Bell className="h-4 w-4 text-primary" />
                    公告通知
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                {announcements.map((announcement, index) => (
                    <Link key={announcement.id} href={announcement.href}>
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="p-4 rounded-lg bg-background/60 hover:bg-background/80 transition-all cursor-pointer group border border-primary/10 hover:border-primary/30"
                        >
                            <div className="flex items-start gap-3">
                                <div className={`h-10 w-10 rounded-full bg-gradient-to-br ${announcement.iconBg} flex items-center justify-center shrink-0`}>
                                    <announcement.icon className="h-5 w-5 text-white" />
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
                ))}
            </CardContent>
        </Card>
    );
}
