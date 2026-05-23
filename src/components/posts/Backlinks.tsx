"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Link2, ChevronDown, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export interface BacklinkItem {
    id: string;
    title: string;
    created_at: string;
    author: {
        username: string;
        avatar_url?: string;
    };
}

interface BacklinksProps {
    backlinks: BacklinkItem[];
    className?: string;
}

export function Backlinks({ backlinks, className }: BacklinksProps) {
    const [isExpanded, setIsExpanded] = useState(true);

    if (backlinks.length === 0) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
                "relative rounded-xl border border-border/50 bg-gradient-to-br from-card via-card to-muted/30 overflow-hidden",
                className
            )}
        >
            {/* 顶部装饰线 */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-blue-500/50 via-purple-500/50 to-pink-500/50" />

            {/* 标题栏 */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center justify-between w-full px-5 py-3.5 text-left hover:bg-muted/30 transition-colors"
            >
                <div className="flex items-center gap-2.5">
                    <div className="flex items-center justify-center h-7 w-7 rounded-lg bg-blue-500/10">
                        <Link2 className="h-4 w-4 text-blue-500" />
                    </div>
                    <span className="font-semibold text-sm text-foreground">
                        反向引用
                    </span>
                    <span className="inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full bg-blue-500/10 text-blue-600 text-xs font-medium">
                        {backlinks.length}
                    </span>
                </div>
                <ChevronDown
                    className={cn(
                        "h-4 w-4 text-muted-foreground transition-transform duration-200",
                        isExpanded && "rotate-180"
                    )}
                />
            </button>

            {/* 引用列表 */}
            <AnimatePresence initial={false}>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                        className="overflow-hidden"
                    >
                        <div className="px-5 pb-4 space-y-1">
                            {backlinks.map((link, index) => (
                                <motion.div
                                    key={link.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{
                                        delay: index * 0.05,
                                        duration: 0.3,
                                        ease: [0.22, 1, 0.36, 1],
                                    }}
                                >
                                    <Link
                                        href={`/posts/${link.id}`}
                                        className="group flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/50 transition-all duration-200"
                                    >
                                        <Avatar className="h-6 w-6 flex-shrink-0">
                                            <AvatarImage
                                                src={link.author.avatar_url}
                                                alt={link.author.username}
                                            />
                                            <AvatarFallback className="text-[10px] bg-muted">
                                                {link.author.username?.slice(0, 2).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                                                {link.title}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                @{link.author.username} · {new Date(link.created_at).toLocaleDateString("zh-CN")}
                                            </p>
                                        </div>
                                        <ExternalLink className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                                    </Link>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
