"use client";

import { useState } from "react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Bell, Check, Loader2 } from "lucide-react";
import { NotificationItem } from "./NotificationItem";
import { useNotifications } from "@/hooks/useNotifications";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface NotificationCenterProps {
    currentUserId: string;
}

export function NotificationCenter({ currentUserId }: NotificationCenterProps) {
    const [open, setOpen] = useState(false);
    const {
        notifications,
        unreadCount,
        loading,
        markAsRead,
        markAllAsRead,
        deleteNotification,
    } = useNotifications(currentUserId);

    const handleMarkAsRead = async (notificationId: string) => {
        await markAsRead([notificationId]);
    };

    const handleMarkAllAsRead = async () => {
        await markAllAsRead();
    };

    const handleDelete = async (notificationId: string) => {
        await deleteNotification(notificationId);
    };

    // 根据通知类型跳转到相应页面
    const getNotificationLink = (notification: (typeof notifications)[0]) => {
        switch (notification.type) {
            case "like":
            case "comment":
                return notification.related_id ? `/posts/${notification.related_id}` : null;
            case "friend_request":
                return "/friends";
            case "friend_accepted":
                return "/friends";
            case "message":
                return notification.from_user_id
                    ? `/messages?user=${notification.from_user_id}`
                    : "/messages";
            case "mention":
                return notification.related_id ? `/posts/${notification.related_id}` : null;
            case "duel_invite":
            case "duel_accepted":
            case "duel_rejected":
                // 暂时跳转到 duels 列表页，或者具体的 duel 详情页
                // 如果 related_id 是 duel_id，则跳转到 /duels/id (如果是 invite，可能需要跳转到 duels 列表看邀请卡片)
                // 这里的 related_id 在 trigger 里存的是 duel_id
                return notification.related_id ? `/duels` : "/duels";
            // 或者可以直接进入详情页 /duels/${notification.related_id} 如果详情页支持 pending 状态显示
            // 根据需求，邀请卡片在列表页，所以跳转到 /duels 比较合适
            // 已接受的跳转到详情页 /duels/${notification.related_id}
            default:
                return null;
        }
    };

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative"
                    aria-label="通知"
                >
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <Badge
                            variant="destructive"
                            className="absolute -top-1 -right-1 h-5 min-w-[20px] px-1 text-[10px] font-bold"
                        >
                            {unreadCount > 99 ? "99+" : unreadCount}
                        </Badge>
                    )}
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
                align="end"
                className="w-[380px] p-0"
                sideOffset={8}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b">
                    <h3 className="font-semibold text-foreground">通知</h3>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleMarkAllAsRead}
                            className="h-8 text-xs gap-1.5"
                        >
                            <Check className="h-3.5 w-3.5" />
                            全部已读
                        </Button>
                    )}
                </div>

                {/* Notifications List */}
                <ScrollArea className="max-h-[400px]">
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                            <Bell className="h-10 w-10 mb-2 opacity-50" />
                            <p className="text-sm">暂无通知</p>
                        </div>
                    ) : (
                        <div className="p-2 space-y-1">
                            {notifications.slice(0, 10).map((notification) => {
                                const link = getNotificationLink(notification);

                                return link ? (
                                    <Link
                                        key={notification.id}
                                        href={link}
                                        onClick={() => setOpen(false)}
                                    >
                                        <NotificationItem
                                            notification={notification}
                                            onMarkAsRead={() => handleMarkAsRead(notification.id)}
                                            onDelete={() => handleDelete(notification.id)}
                                        />
                                    </Link>
                                ) : (
                                    <NotificationItem
                                        key={notification.id}
                                        notification={notification}
                                        onMarkAsRead={() => handleMarkAsRead(notification.id)}
                                        onDelete={() => handleDelete(notification.id)}
                                    />
                                );
                            })}
                        </div>
                    )}
                </ScrollArea>

                {/* Footer */}
                {notifications.length > 0 && (
                    <>
                        <DropdownMenuSeparator className="my-0" />
                        <div className="p-2">
                            <Link href="/notifications" onClick={() => setOpen(false)}>
                                <Button
                                    variant="ghost"
                                    className="w-full justify-center text-sm"
                                >
                                    查看全部通知
                                </Button>
                            </Link>
                        </div>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
