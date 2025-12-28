"use client";

import { useRef, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { Message } from "@/hooks/useMessages";
import Link from "next/link";
import { ExternalLink } from "lucide-react";

interface ChatBubbleProps {
    message: Message;
    isOwn: boolean;
    showAvatar?: boolean;
    senderName?: string;
    senderAvatar?: string | null;
}

export function ChatBubble({
    message,
    isOwn,
    showAvatar = true,
    senderName,
    senderAvatar,
}: ChatBubbleProps) {
    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString("zh-CN", {
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const initials = (senderName || "?").charAt(0).toUpperCase();

    return (
        <div
            className={cn(
                "flex gap-3 max-w-[80%]",
                isOwn ? "ml-auto flex-row-reverse" : "mr-auto"
            )}
        >
            {showAvatar && (
                <Avatar className="h-8 w-8 flex-shrink-0 mt-1">
                    <AvatarImage src={senderAvatar || undefined} />
                    <AvatarFallback className="bg-gradient-to-br from-primary/30 to-primary/10 text-primary text-xs">
                        {initials}
                    </AvatarFallback>
                </Avatar>
            )}

            <div className={cn("flex flex-col gap-1", isOwn ? "items-end" : "items-start")}>
                {/* 消息气泡 */}
                <div
                    className={cn(
                        "rounded-2xl px-4 py-2 max-w-full break-words",
                        isOwn
                            ? "bg-primary text-primary-foreground rounded-tr-sm"
                            : "bg-muted rounded-tl-sm"
                    )}
                >
                    {/* 富文本内容 */}
                    {message.content_type === "rich_text" ? (
                        <div
                            className="prose prose-sm dark:prose-invert max-w-none"
                            dangerouslySetInnerHTML={{ __html: message.content }}
                        />
                    ) : (
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    )}

                    {/* 引用帖子 */}
                    {message.content_type === "post_reference" && message.referenced_post && (
                        <Link
                            href={`/posts/${message.referenced_post.id}`}
                            className={cn(
                                "flex items-center gap-2 mt-2 p-2 rounded-lg transition-colors",
                                isOwn
                                    ? "bg-primary-foreground/10 hover:bg-primary-foreground/20"
                                    : "bg-background hover:bg-background/80"
                            )}
                        >
                            <ExternalLink className="h-4 w-4 flex-shrink-0" />
                            <span className="text-xs font-medium truncate">
                                {message.referenced_post.title}
                            </span>
                        </Link>
                    )}
                </div>

                {/* 时间戳 */}
                <span className="text-[10px] text-muted-foreground px-1">
                    {formatTime(message.created_at)}
                    {isOwn && message.is_read && (
                        <span className="ml-1 text-primary">已读</span>
                    )}
                </span>
            </div>
        </div>
    );
}

interface ChatMessagesProps {
    messages: Message[];
    currentUserId: string;
    partnerName?: string;
    partnerAvatar?: string | null;
    currentUserName?: string;
    currentUserAvatar?: string | null;
}

export function ChatMessages({
    messages,
    currentUserId,
    partnerName,
    partnerAvatar,
    currentUserName,
    currentUserAvatar,
}: ChatMessagesProps) {
    const containerRef = useRef<HTMLDivElement>(null);

    // 滚动到底部
    useEffect(() => {
        if (containerRef.current) {
            containerRef.current.scrollTop = containerRef.current.scrollHeight;
        }
    }, [messages]);

    // 按日期分组消息
    const groupedMessages = messages.reduce<
        { date: string; messages: Message[] }[]
    >((groups, message) => {
        const date = new Date(message.created_at).toLocaleDateString("zh-CN", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });

        const lastGroup = groups[groups.length - 1];
        if (lastGroup && lastGroup.date === date) {
            lastGroup.messages.push(message);
        } else {
            groups.push({ date, messages: [message] });
        }

        return groups;
    }, []);

    return (
        <div
            ref={containerRef}
            className="flex-1 overflow-y-auto p-4 space-y-4"
        >
            {groupedMessages.map((group) => (
                <div key={group.date} className="space-y-4">
                    {/* 日期分隔符 */}
                    <div className="flex items-center gap-4">
                        <div className="flex-1 h-px bg-border" />
                        <span className="text-xs text-muted-foreground bg-background px-2">
                            {group.date}
                        </span>
                        <div className="flex-1 h-px bg-border" />
                    </div>

                    {/* 消息列表 */}
                    {group.messages.map((message, index) => {
                        const isOwn = message.sender_id === currentUserId;
                        const prevMessage = group.messages[index - 1];
                        const showAvatar =
                            !prevMessage || prevMessage.sender_id !== message.sender_id;

                        return (
                            <ChatBubble
                                key={message.id}
                                message={message}
                                isOwn={isOwn}
                                showAvatar={showAvatar}
                                senderName={isOwn ? currentUserName : partnerName}
                                senderAvatar={isOwn ? currentUserAvatar : partnerAvatar}
                            />
                        );
                    })}
                </div>
            ))}

            {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <p className="text-sm">还没有消息</p>
                    <p className="text-xs mt-1">发送第一条消息开始聊天吧</p>
                </div>
            )}
        </div>
    );
}
