"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuTrigger,
} from "@/components/ui/context-menu";
import type { Message } from "@/hooks/useMessages";
import { cn } from "@/lib/utils";
import { ExternalLink, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { ChatContentViewer, ChatTextMathViewer } from "./ChatEditor";
import { FilePreview } from "./FilePreview";

interface ChatBubbleProps {
    message: Message;
    isOwn: boolean;
    showAvatar?: boolean;
    senderName?: string;
    senderAvatar?: string | null;
    canRevoke?: boolean;
    onRevoke?: (messageId: string) => Promise<{ success: boolean; error?: string }>;
}

export function ChatBubble({
    message,
    isOwn,
    showAvatar = true,
    senderName,
    senderAvatar,
    canRevoke = false,
    onRevoke,
}: ChatBubbleProps) {
    const [isRevoking, setIsRevoking] = useState(false);

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString("zh-CN", {
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const initials = (senderName || "?").charAt(0).toUpperCase();

    // 处理撤回
    const handleRevoke = async () => {
        if (!onRevoke || isRevoking) return;

        setIsRevoking(true);
        const result = await onRevoke(message.id);
        setIsRevoking(false);

        if (!result.success) {
            toast.error(result.error || "撤回失败");
        } else {
            toast.success("消息已撤回");
        }
    };

    // 撤回的消息显示
    if (message.is_revoked) {
        return (
            <div
                className={cn(
                    "flex gap-3 max-w-[80%]",
                    isOwn ? "ml-auto flex-row-reverse" : "mr-auto"
                )}
            >
                {showAvatar && (
                    <Avatar className="h-8 w-8 flex-shrink-0 mt-1 opacity-50">
                        <AvatarImage src={senderAvatar || undefined} />
                        <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                            {initials}
                        </AvatarFallback>
                    </Avatar>
                )}

                <div className={cn("flex flex-col gap-1", isOwn ? "items-end" : "items-start")}>
                    <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-muted/50 border border-dashed border-muted-foreground/30">
                        <RotateCcw className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground italic">
                            {isOwn ? "你撤回了一条消息" : "对方撤回了一条消息"}
                        </span>
                    </div>
                    <span className="text-[10px] text-muted-foreground/70 px-1">
                        {formatTime(message.revoked_at || message.created_at)}
                    </span>
                </div>
            </div>
        );
    }

    const bubbleContent = (
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
                    {/* 富文本/普通文本内容 */}
                    {message.content_type === "rich_text" ? (
                        <ChatContentViewer
                            content={message.content}
                            className={isOwn ? "text-primary-foreground prose-invert" : ""}
                        />
                    ) : (
                        <ChatTextMathViewer
                            content={message.content}
                            className={cn(
                                "text-sm",
                                isOwn ? "text-primary-foreground" : ""
                            )}
                        />
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

                {/* 附件列表 */}
                {message.attachments && message.attachments.length > 0 && (
                    <div className="space-y-2 mt-1">
                        {message.attachments.map((attachment) => (
                            <FilePreview
                                key={attachment.id}
                                attachment={{
                                    id: attachment.id,
                                    messageId: attachment.message_id,
                                    fileName: attachment.file_name,
                                    fileType: attachment.file_type,
                                    fileSize: attachment.file_size,
                                    storagePath: attachment.storage_path,
                                    publicUrl: attachment.public_url,
                                    expiresAt: attachment.expires_at,
                                    isExpired: attachment.is_expired,
                                    createdAt: attachment.created_at,
                                }}
                            />
                        ))}
                    </div>
                )}

                {/* 时间戳 + 状态 */}
                <div className="flex items-center gap-1 px-1">
                    <span className="text-[10px] text-muted-foreground">
                        {formatTime(message.created_at)}
                    </span>
                    {isOwn && message.is_read && (
                        <span className="text-[10px] text-primary">已读</span>
                    )}
                    {isOwn && canRevoke && (
                        <span className="text-[10px] text-muted-foreground/50">· 可撤回</span>
                    )}
                </div>
            </div>
        </div>
    );

    // 如果可以撤回，包装在右键菜单中
    if (isOwn && canRevoke && onRevoke) {
        return (
            <ContextMenu>
                <ContextMenuTrigger asChild>{bubbleContent}</ContextMenuTrigger>
                <ContextMenuContent>
                    <ContextMenuItem
                        onClick={handleRevoke}
                        disabled={isRevoking}
                        className="text-destructive focus:text-destructive"
                    >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        {isRevoking ? "撤回中..." : "撤回消息"}
                    </ContextMenuItem>
                </ContextMenuContent>
            </ContextMenu>
        );
    }

    return bubbleContent;
}

interface ChatMessagesProps {
    messages: Message[];
    currentUserId: string;
    partnerName?: string;
    partnerAvatar?: string | null;
    currentUserName?: string;
    currentUserAvatar?: string | null;
    canRevoke?: (message: Message) => boolean;
    onRevoke?: (messageId: string) => Promise<{ success: boolean; error?: string }>;
}

export function ChatMessages({
    messages,
    currentUserId,
    partnerName,
    partnerAvatar,
    currentUserName,
    currentUserAvatar,
    canRevoke,
    onRevoke,
}: ChatMessagesProps) {
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
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
                                canRevoke={canRevoke?.(message) ?? false}
                                onRevoke={onRevoke}
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
