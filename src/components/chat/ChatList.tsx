"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { usePresenceContext } from "@/contexts/PresenceContext";
import type { Conversation } from "@/hooks/useMessages";
import { cn } from "@/lib/utils";

interface ChatListProps {
    conversations: Conversation[];
    selectedPartnerId?: string;
    onSelectConversation: (partnerId: string) => void;
}

export function ChatList({
    conversations,
    selectedPartnerId,
    onSelectConversation,
}: ChatListProps) {
    const { isOnline } = usePresenceContext();

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return "刚刚";
        if (diffMins < 60) return `${diffMins}分钟前`;
        if (diffHours < 24) return `${diffHours}小时前`;
        if (diffDays < 7) return `${diffDays}天前`;

        return date.toLocaleDateString("zh-CN", { month: "short", day: "numeric" });
    };

    return (
        <ScrollArea className="h-full">
            <div className="p-2 space-y-1">
                {conversations.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                        <p className="text-sm">暂无聊天记录</p>
                        <p className="text-xs mt-1">添加好友开始聊天吧</p>
                    </div>
                ) : (
                    conversations.map((conv) => {
                        const isSelected = selectedPartnerId === conv.partnerId;
                        const isPartnerOnline = isOnline(conv.partnerId);
                        const initials = (conv.partnerUsername || conv.partnerEmail || "?")
                            .charAt(0)
                            .toUpperCase();

                        return (
                            <div
                                key={conv.partnerId}
                                onClick={() => onSelectConversation(conv.partnerId)}
                                className={cn(
                                    "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors",
                                    isSelected
                                        ? "bg-primary/10 text-foreground"
                                        : "hover:bg-muted/50"
                                )}
                            >
                                {/* 头像 */}
                                <div className="relative flex-shrink-0">
                                    <Avatar className="h-12 w-12 border-2 border-background shadow-sm">
                                        <AvatarImage src={conv.partnerAvatarUrl || undefined} />
                                        <AvatarFallback className="bg-gradient-to-br from-primary/30 to-primary/10 text-primary font-semibold">
                                            {initials}
                                        </AvatarFallback>
                                    </Avatar>
                                    {/* 在线状态指示器 */}
                                    <span
                                        className={cn(
                                            "absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background",
                                            isPartnerOnline
                                                ? "bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]"
                                                : "bg-gray-400"
                                        )}
                                    />
                                </div>

                                {/* 内容 */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                        <p className="font-semibold text-sm truncate">
                                            {conv.partnerUsername || conv.partnerEmail.split("@")[0]}
                                        </p>
                                        <span className="text-[10px] text-muted-foreground flex-shrink-0">
                                            {formatTime(conv.lastMessageTime)}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between gap-2 mt-0.5">
                                        <p className="text-xs text-muted-foreground truncate">
                                            {conv.lastMessage}
                                        </p>
                                        {conv.unreadCount > 0 && (
                                            <Badge
                                                variant="default"
                                                className="h-5 min-w-[20px] px-1.5 text-[10px] flex-shrink-0"
                                            >
                                                {conv.unreadCount > 99 ? "99+" : conv.unreadCount}
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </ScrollArea>
    );
}
