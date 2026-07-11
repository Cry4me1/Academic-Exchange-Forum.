"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Bell, ChevronRight, Rocket, Sparkles, Wrench, Megaphone, Activity } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

// Map categories to icons and gradient backgrounds
const categoryStyles: Record<string, { icon: any, bg: string }> = {
    update: { icon: Rocket, bg: "from-primary to-violet-500" },
    activity: { icon: Sparkles, bg: "from-primary to-purple-500" },
    system: { icon: Megaphone, bg: "from-blue-500 to-indigo-500" },
    maintenance: { icon: Wrench, bg: "from-amber-500 to-orange-500" },
};

export function AnnouncementCard() {
    const [announcements, setAnnouncements] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        const fetchAnnouncements = async () => {
            const now = new Date().toISOString();
            
            // Note: RLS might handle the start_time and is_active check, 
            // but we add it here just to be safe.
            const { data, error } = await supabase
                .from("system_announcements")
                .select("*")
                .eq("is_active", true)
                .lte("start_time", now)
                .order("start_time", { ascending: false })
                .limit(3);

            if (!error && data) {
                // Filter out ended announcements if RLS doesn't do it automatically
                const validData = data.filter((a: any) => !a.end_time || a.end_time > now);
                setAnnouncements(validData);
            }
            setLoading(false);
        };

        fetchAnnouncements();
    }, [supabase]);

    if (loading) {
        return (
            <Card className="bg-gradient-to-br from-primary/5 via-primary/10 to-purple-500/10 border-primary/20 overflow-hidden animate-pulse">
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base text-transparent bg-muted rounded w-24">
                        Loading...
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="h-20 bg-muted/50 rounded-lg"></div>
                    <div className="h-20 bg-muted/50 rounded-lg"></div>
                </CardContent>
            </Card>
        );
    }

    if (announcements.length === 0) {
        return null; // Do not show the card if there are no announcements
    }

    return (
        <Card className="bg-gradient-to-br from-primary/5 via-primary/10 to-purple-500/10 border-primary/20 overflow-hidden">
            <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="flex items-center gap-2 text-base">
                    <Bell className="h-4 w-4 text-primary" />
                    公告通知
                </CardTitle>
                <Link href="/announcements" className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center">
                    全部 <ChevronRight className="h-3 w-3 ml-0.5" />
                </Link>
            </CardHeader>
            <CardContent className="space-y-3">
                {announcements.map((announcement, index) => {
                    const style = categoryStyles[announcement.category] || categoryStyles.system;
                    const Icon = style.icon;
                    // Format date simply
                    const dateStr = new Date(announcement.start_time).toLocaleDateString();
                    // Consider new if within last 3 days
                    const isNew = (new Date().getTime() - new Date(announcement.start_time).getTime()) < 3 * 24 * 60 * 60 * 1000;

                    let href = `/announcements/${announcement.id}`;
                    if (announcement.title.includes("v1.0.0")) href = "/updates";
                    else if (announcement.title.includes("上线啦")) href = "/announcements/launch-2026";
                    else if (announcement.title.includes("新手教程指南")) href = "/announcements/tutorials";

                    return (
                        <Link key={announcement.id} href={href}>
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="p-4 rounded-lg bg-background/60 hover:bg-background/80 transition-all cursor-pointer group border border-primary/10 hover:border-primary/30"
                            >
                                <div className="flex items-start gap-3">
                                    <div className={`h-10 w-10 rounded-full bg-gradient-to-br ${style.bg} flex items-center justify-center shrink-0`}>
                                        <Icon className="h-5 w-5 text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h4 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                                                {announcement.title}
                                            </h4>
                                            {isNew && (
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
                                                {dateStr}
                                            </p>
                                            <span className="text-xs text-primary flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                查看详情 <ChevronRight className="h-3 w-3" />
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </Link>
                    );
                })}
            </CardContent>
        </Card>
    );
}
