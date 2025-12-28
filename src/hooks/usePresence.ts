import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RealtimeChannel, RealtimePresenceState } from "@supabase/supabase-js";

interface PresenceUser {
    id: string;
    online_at: string;
}

interface UsePresenceReturn {
    onlineUsers: Set<string>;
    isOnline: (userId: string) => boolean;
    isConnected: boolean;
}

export function usePresence(currentUserId: string | null): UsePresenceReturn {
    const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
    const [isConnected, setIsConnected] = useState(false);
    const channelRef = useRef<RealtimeChannel | null>(null);

    useEffect(() => {
        if (!currentUserId) return;

        const supabase = createClient();

        // 创建 Presence 频道
        const channel = supabase.channel("online-users", {
            config: {
                presence: {
                    key: currentUserId,
                },
            },
        });

        channelRef.current = channel;

        // 同步 Presence 状态
        const handleSync = () => {
            const state: RealtimePresenceState<PresenceUser> = channel.presenceState();
            const users = new Set<string>();

            Object.keys(state).forEach((key) => {
                users.add(key);
            });

            setOnlineUsers(users);
        };

        // 用户加入
        const handleJoin = ({ key }: { key: string }) => {
            setOnlineUsers((prev) => new Set([...prev, key]));
        };

        // 用户离开
        const handleLeave = ({ key }: { key: string }) => {
            setOnlineUsers((prev) => {
                const next = new Set(prev);
                next.delete(key);
                return next;
            });
        };

        channel
            .on("presence", { event: "sync" }, handleSync)
            .on("presence", { event: "join" }, handleJoin)
            .on("presence", { event: "leave" }, handleLeave)
            .subscribe(async (status) => {
                if (status === "SUBSCRIBED") {
                    setIsConnected(true);
                    // 追踪当前用户上线
                    await channel.track({
                        id: currentUserId,
                        online_at: new Date().toISOString(),
                    });
                } else {
                    setIsConnected(false);
                }
            });

        // 页面可见性变化时更新状态
        const handleVisibilityChange = async () => {
            if (document.visibilityState === "visible" && channelRef.current) {
                await channelRef.current.track({
                    id: currentUserId,
                    online_at: new Date().toISOString(),
                });
            }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);

        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            channel.unsubscribe();
        };
    }, [currentUserId]);

    const isOnline = useCallback(
        (userId: string) => onlineUsers.has(userId),
        [onlineUsers]
    );

    return { onlineUsers, isOnline, isConnected };
}
