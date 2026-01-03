import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { toast } from "sonner";

export interface Notification {
    id: string;
    user_id: string;
    type: "like" | "comment" | "friend_request" | "friend_accepted" | "message" | "mention" | "duel_invite" | "duel_accepted" | "duel_rejected";
    title: string;
    content: string | null;
    is_read: boolean;
    related_id: string | null;
    from_user_id: string | null;
    created_at: string;
    // 关联的用户信息
    from_user?: {
        id: string;
        username: string | null;
        email: string;
        avatar_url: string | null;
    } | null;
}

interface UseNotificationsReturn {
    notifications: Notification[];
    unreadCount: number;
    loading: boolean;
    error: string | null;
    markAsRead: (notificationIds: string[]) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    deleteNotification: (notificationId: string) => Promise<void>;
    refresh: () => Promise<void>;
}

export function useNotifications(currentUserId: string | null): UseNotificationsReturn {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const channelRef = useRef<RealtimeChannel | null>(null);

    const supabase = createClient();

    // 获取通知列表
    const fetchNotifications = useCallback(async () => {
        if (!currentUserId) return;

        setLoading(true);
        setError(null);

        try {
            const { data, error: fetchError } = await supabase
                .from("notifications")
                .select("*")
                .eq("user_id", currentUserId)
                .order("created_at", { ascending: false })
                .limit(50);

            if (fetchError) throw fetchError;

            // 获取发送者信息
            const fromUserIds = [...new Set(data?.map((n) => n.from_user_id).filter(Boolean) || [])];

            if (fromUserIds.length > 0) {
                const { data: profiles } = await supabase
                    .from("profiles")
                    .select("id, username, email, avatar_url")
                    .in("id", fromUserIds);

                const notificationsWithUsers = data?.map((n) => ({
                    ...n,
                    from_user: profiles?.find((p) => p.id === n.from_user_id) || null,
                })) || [];

                setNotifications(notificationsWithUsers);
            } else {
                setNotifications(data || []);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "获取通知失败");
        } finally {
            setLoading(false);
        }
    }, [currentUserId, supabase]);

    // 标记通知为已读
    const markAsRead = useCallback(
        async (notificationIds: string[]) => {
            if (notificationIds.length === 0) return;

            await supabase
                .from("notifications")
                .update({ is_read: true })
                .in("id", notificationIds);

            setNotifications((prev) =>
                prev.map((n) =>
                    notificationIds.includes(n.id) ? { ...n, is_read: true } : n
                )
            );
        },
        [supabase]
    );

    // 标记所有通知为已读
    const markAllAsRead = useCallback(async () => {
        if (!currentUserId) return;

        await supabase
            .from("notifications")
            .update({ is_read: true })
            .eq("user_id", currentUserId)
            .eq("is_read", false);

        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    }, [currentUserId, supabase]);

    // 删除通知
    const deleteNotification = useCallback(
        async (notificationId: string) => {
            await supabase.from("notifications").delete().eq("id", notificationId);
            setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
        },
        [supabase]
    );

    // 计算未读数量
    const unreadCount = notifications.filter((n) => !n.is_read).length;

    // 初始加载
    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    // 实时订阅新通知
    useEffect(() => {
        if (!currentUserId) return;

        const channel = supabase
            .channel("notifications-realtime")
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "notifications",
                    filter: `user_id=eq.${currentUserId}`,
                },
                async (payload) => {
                    const newNotification = payload.new as Notification;

                    // 获取发送者信息
                    if (newNotification.from_user_id) {
                        const { data: profile } = await supabase
                            .from("profiles")
                            .select("id, username, email, avatar_url")
                            .eq("id", newNotification.from_user_id)
                            .single();

                        newNotification.from_user = profile;
                    }

                    // 添加到列表
                    setNotifications((prev) => [newNotification, ...prev]);

                    // 显示 Toast 通知
                    const toastIcon = getNotificationIcon(newNotification.type);
                    toast(newNotification.title, {
                        description: newNotification.content || undefined,
                        icon: toastIcon,
                        duration: 5000,
                    });
                }
            )
            .subscribe();

        channelRef.current = channel;

        return () => {
            channel.unsubscribe();
        };
    }, [currentUserId, supabase]);

    return {
        notifications,
        unreadCount,
        loading,
        error,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        refresh: fetchNotifications,
    };
}

// 根据通知类型返回图标
function getNotificationIcon(type: Notification["type"]): string {
    switch (type) {
        case "like":
            return "❤️";
        case "comment":
            return "💬";
        case "friend_request":
            return "👋";
        case "friend_accepted":
            return "🤝";
        case "message":
            return "✉️";
        case "mention":
            return "📢";
        case "duel_invite":
            return "⚔️";
        case "duel_accepted":
            return "🏆";
        case "duel_rejected":
            return "❌";
        default:
            return "🔔";
    }
}
