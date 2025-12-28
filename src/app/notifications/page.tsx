"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useNotifications, type Notification } from "@/hooks/useNotifications";
import { NotificationItem } from "@/components/notifications/NotificationItem";
import { Button } from "@/components/ui/button";
import { Loader2, Bell, Check, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export default function NotificationsPage() {
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setCurrentUserId(user.id);
            } else {
                router.push("/auth/login");
            }
        };
        getUser();
    }, [supabase, router]);

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

    const handleDelete = async (notificationId: string) => {
        await deleteNotification(notificationId);
    };

    // 根据通知类型跳转到相应页面
    const getNotificationLink = (notification: Notification) => {
        switch (notification.type) {
            case "like":
            case "comment":
                return notification.related_id ? `/posts/${notification.related_id}` : null;
            case "friend_request":
            case "friend_accepted":
                return "/friends";
            case "message":
                return notification.from_user_id
                    ? `/messages?user=${notification.from_user_id}`
                    : "/messages";
            case "mention":
                return notification.related_id ? `/posts/${notification.related_id}` : null;
            default:
                return null;
        }
    };

    if (!currentUserId) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="container max-w-3xl mx-auto py-8 px-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.back()}
                        className="h-9 w-9"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">通知中心</h1>
                        <p className="text-sm text-muted-foreground">
                            {unreadCount > 0
                                ? `${unreadCount} 条未读通知`
                                : "暂无未读通知"}
                        </p>
                    </div>
                </div>

                {unreadCount > 0 && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={markAllAsRead}
                        className="gap-1.5"
                    >
                        <Check className="h-4 w-4" />
                        全部已读
                    </Button>
                )}
            </div>

            {/* Notifications List */}
            <div className="bg-card rounded-xl border shadow-sm">
                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                        <Bell className="h-16 w-16 mb-4 opacity-30" />
                        <p className="text-lg font-medium">暂无通知</p>
                        <p className="text-sm">当有新动态时，会在这里显示</p>
                    </div>
                ) : (
                    <div className="divide-y">
                        {notifications.map((notification) => {
                            const link = getNotificationLink(notification);

                            return link ? (
                                <Link key={notification.id} href={link}>
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
            </div>
        </div>
    );
}
