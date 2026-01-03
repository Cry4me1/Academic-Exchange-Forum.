"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { Notification } from "@/hooks/useNotifications";
import {
    Heart,
    MessageCircle,
    UserPlus,
    UserCheck,
    Mail,
    AtSign,
    Bell,
    Trash2,
    Swords,
    Trophy,
    XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface NotificationItemProps {
    notification: Notification;
    onMarkAsRead?: () => void;
    onDelete?: () => void;
    onClick?: () => void;
}

const notificationIcons: Record<Notification["type"], React.ComponentType<{ className?: string }>> = {
    like: Heart,
    comment: MessageCircle,
    friend_request: UserPlus,
    friend_accepted: UserCheck,
    message: Mail,
    mention: AtSign,
    duel_invite: Swords,
    duel_accepted: Trophy,
    duel_rejected: XCircle,
};

const notificationColors: Record<Notification["type"], string> = {
    like: "text-red-500 bg-red-500/10",
    comment: "text-blue-500 bg-blue-500/10",
    friend_request: "text-purple-500 bg-purple-500/10",
    friend_accepted: "text-green-500 bg-green-500/10",
    message: "text-amber-500 bg-amber-500/10",
    mention: "text-cyan-500 bg-cyan-500/10",
    duel_invite: "text-orange-500 bg-orange-500/10",
    duel_accepted: "text-green-500 bg-green-500/10",
    duel_rejected: "text-red-500 bg-red-500/10",
};

export function NotificationItem({
    notification,
    onMarkAsRead,
    onDelete,
    onClick,
}: NotificationItemProps) {
    const Icon = notificationIcons[notification.type] || Bell;
    const colorClass = notificationColors[notification.type] || "text-gray-500 bg-gray-500/10";

    const initials = (
        notification.from_user?.username ||
        notification.from_user?.email ||
        "?"
    )
        .charAt(0)
        .toUpperCase();

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

    const handleClick = () => {
        if (!notification.is_read && onMarkAsRead) {
            onMarkAsRead();
        }
        if (onClick) {
            onClick();
        }
    };

    return (
        <div
            onClick={handleClick}
            className={cn(
                "flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors group",
                notification.is_read
                    ? "hover:bg-muted/50"
                    : "bg-primary/5 hover:bg-primary/10"
            )}
        >
            {/* 头像或图标 */}
            {notification.from_user ? (
                <Avatar className="h-10 w-10 flex-shrink-0">
                    <AvatarImage src={notification.from_user.avatar_url || undefined} />
                    <AvatarFallback className="bg-gradient-to-br from-primary/30 to-primary/10 text-primary">
                        {initials}
                    </AvatarFallback>
                </Avatar>
            ) : (
                <div
                    className={cn(
                        "h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0",
                        colorClass
                    )}
                >
                    <Icon className="h-5 w-5" />
                </div>
            )}

            {/* 内容 */}
            <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-foreground">
                            {notification.title}
                        </p>
                        {notification.content && (
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                                {notification.content}
                            </p>
                        )}
                    </div>

                    {/* 类型图标 */}
                    <div className={cn("p-1.5 rounded-full flex-shrink-0", colorClass)}>
                        <Icon className="h-3.5 w-3.5" />
                    </div>
                </div>

                <div className="flex items-center justify-between mt-1.5">
                    <span className="text-[10px] text-muted-foreground">
                        {formatTime(notification.created_at)}
                    </span>

                    {/* 未读指示器 */}
                    {!notification.is_read && (
                        <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                    )}
                </div>
            </div>

            {/* 删除按钮 */}
            {onDelete && (
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete();
                    }}
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                >
                    <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                </Button>
            )}
        </div>
    );
}
