"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Flame, Home, MessageCircle, MessageSquarePlus, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface MobileTabBarProps {
    currentUserId: string | null;
}

export function MobileTabBar({ currentUserId }: MobileTabBarProps) {
    const pathname = usePathname();

    const tabs = [
        {
            name: "首页",
            href: "/dashboard",
            icon: Home,
        },
        {
            name: "热门",
            href: "/trending",
            icon: Flame,
        },
        {
            name: "",
            href: "/posts/new",
            icon: MessageSquarePlus,
            isCenter: true,
        },
        {
            name: "私信",
            href: "/messages",
            icon: MessageCircle,
        },
        {
            name: "我的",
            href: currentUserId ? `/user/${currentUserId}` : "/dashboard",
            icon: User,
        },
    ];

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-t border-border/50 pb-safe">
            <div className="flex items-center justify-around h-[60px] px-2 relative">
                {tabs.map((tab) => {
                    const isActive = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
                    const Icon = tab.icon;

                    if (tab.isCenter) {
                        return (
                            <div key="center-btn" className="relative -top-5 flex flex-col items-center">
                                <Link href={tab.href}>
                                    <div className="h-12 w-12 bg-primary rounded-full shadow-lg shadow-primary/30 flex items-center justify-center text-primary-foreground transform active:scale-95 transition-transform">
                                        <Icon className="h-6 w-6" />
                                    </div>
                                </Link>
                            </div>
                        );
                    }

                    return (
                        <Link
                            key={tab.name}
                            href={tab.href}
                            className="flex flex-col items-center justify-center w-16 h-full gap-1 active:opacity-70 transition-opacity relative"
                        >
                            <div className="relative">
                                <Icon
                                    className={cn(
                                        "h-5 w-5 transition-colors",
                                        isActive ? "text-primary" : "text-muted-foreground"
                                    )}
                                />
                            </div>
                            <span
                                className={cn(
                                    "text-[10px] font-medium transition-colors",
                                    isActive ? "text-primary font-semibold" : "text-muted-foreground"
                                )}
                            >
                                {tab.name}
                            </span>
                            {isActive && (
                                <motion.div
                                    layoutId="mobile-tab-indicator"
                                    className="absolute -top-3 w-8 h-1 rounded-full bg-primary"
                                />
                            )}
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
