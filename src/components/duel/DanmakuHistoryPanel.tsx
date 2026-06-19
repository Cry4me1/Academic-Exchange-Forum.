"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { MessageSquareText, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export interface DanmakuRecord {
    id: string;
    content: string;
    username: string;
    avatar_url?: string;
    user_id: string;
    created_at: string;
    role: "challenger" | "opponent" | "spectator";
}

interface DanmakuHistoryPanelProps {
    records: DanmakuRecord[];
    challengerName?: string;
    opponentName?: string;
}

function formatTime(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);

    if (diffSec < 10) return "刚刚";
    if (diffSec < 60) return `${diffSec}秒前`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}分钟前`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour}小时前`;
    return date.toLocaleDateString("zh-CN", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function getRoleBadge(role: DanmakuRecord["role"], challengerName?: string, opponentName?: string) {
    switch (role) {
        case "challenger":
            return (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-blue-500/10 text-blue-600 border-blue-500/30">
                    正方
                </Badge>
            );
        case "opponent":
            return (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-rose-500/10 text-rose-600 border-rose-500/30">
                    反方
                </Badge>
            );
        default:
            return (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-muted text-muted-foreground border-border/50">
                    观众
                </Badge>
            );
    }
}

export function DanmakuHistoryPanel({
    records,
    challengerName,
    opponentName,
}: DanmakuHistoryPanelProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-full h-8 px-3 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                >
                    <MessageSquareText className="h-3.5 w-3.5" />
                    弹幕记录
                    {records.length > 0 && (
                        <Badge variant="secondary" className="h-4 min-w-[18px] px-1 text-[10px] font-bold">
                            {records.length}
                        </Badge>
                    )}
                </Button>
            </SheetTrigger>
            <SheetContent className="w-[360px] sm:w-[420px] p-0 flex flex-col">
                <SheetHeader className="px-5 pt-5 pb-3 border-b border-border/50">
                    <SheetTitle className="flex items-center gap-2 text-base">
                        <MessageSquareText className="h-4.5 w-4.5 text-primary" />
                        实时弹幕记录
                    </SheetTitle>
                    <SheetDescription className="text-xs">
                        共 {records.length} 条弹幕消息
                    </SheetDescription>
                </SheetHeader>

                <ScrollArea className="flex-1 px-3">
                    <div className="py-3 space-y-1">
                        {records.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                                <MessageSquareText className="h-10 w-10 mb-3 opacity-30" />
                                <p className="text-sm font-medium">暂无弹幕消息</p>
                                <p className="text-xs mt-1 opacity-70">发送第一条弹幕吧！</p>
                            </div>
                        ) : (
                            <AnimatePresence initial={false}>
                                {records.map((record, index) => (
                                    <motion.div
                                        key={record.id}
                                        initial={{ opacity: 0, y: -8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.15 }}
                                        className="group flex items-start gap-2.5 p-2.5 rounded-lg hover:bg-muted/40 transition-colors"
                                    >
                                        <Avatar className="h-7 w-7 mt-0.5 shrink-0">
                                            <AvatarImage src={record.avatar_url} />
                                            <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-semibold">
                                                {record.username.slice(0, 2).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1.5 mb-0.5">
                                                <span className="text-xs font-semibold text-foreground truncate max-w-[120px]">
                                                    {record.username}
                                                </span>
                                                {getRoleBadge(record.role, challengerName, opponentName)}
                                                <span className="text-[10px] text-muted-foreground/60 ml-auto flex items-center gap-0.5 shrink-0">
                                                    <Clock className="h-2.5 w-2.5" />
                                                    {formatTime(record.created_at)}
                                                </span>
                                            </div>
                                            <p className="text-sm text-foreground/85 leading-relaxed break-words">
                                                {record.content}
                                            </p>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        )}
                    </div>
                </ScrollArea>
            </SheetContent>
        </Sheet>
    );
}
