"use client";

import { Button } from "@/components/ui/button";
import {
    Bookmark,
    Flame,
    Home,
    MessageSquare,
    Settings,
    Swords,
    User,
    Users,
    Zap
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
    { href: "/dashboard", label: "首页", icon: Home },
    { href: "/trending", label: "热门学术", icon: Flame },
    { href: "/duels", label: "决斗场", icon: Swords },
    { href: "/messages", label: "私信", icon: MessageSquare },
    { href: "/friends", label: "好友", icon: Users },
    { href: "/favorites", label: "我的收藏", icon: Bookmark },
    { href: "/updates", label: "更新日志", icon: Zap },
    { href: "/profile", label: "个人中心", icon: User },
];

export function MainNav() {
    const pathname = usePathname();

    return (
        <nav className="space-y-1">
            {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                    <Button
                        key={item.href}
                        variant="ghost"
                        asChild
                        className={`w-full justify-start gap-3 h-11 text-base font-medium transition-all duration-200 ${isActive
                            ? "bg-primary/10 text-primary hover:bg-primary/15"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted"
                            }`}
                    >
                        <Link href={item.href}>
                            <Icon className={`h-5 w-5 ${isActive ? "text-primary" : ""}`} />
                            {item.label}
                        </Link>
                    </Button>
                );
            })}

            <div className="pt-4 mt-4 border-t border-border">
                <Button
                    variant="ghost"
                    asChild
                    className="w-full justify-start gap-3 h-11 text-base font-medium text-muted-foreground hover:text-foreground hover:bg-muted"
                >
                    <Link href="/settings">
                        <Settings className="h-5 w-5" />
                        设置
                    </Link>
                </Button>
            </div>
        </nav>
    );
}
