"use client";

import { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RealtimeChannel, RealtimePresenceState } from "@supabase/supabase-js";

interface PresenceUser {
    id: string;
    online_at: string;
}

interface PresenceContextType {
    onlineUsers: Set<string>;
    isOnline: (userId: string) => boolean;
    isConnected: boolean;
}

const PresenceContext = createContext<PresenceContextType | null>(null);

export function PresenceProvider({
    children,
    currentUserId,
}: {
    children: ReactNode;
    currentUserId: string | null;
}) {
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

    return (
        <PresenceContext.Provider value={{ onlineUsers, isOnline, isConnected }}>
            {children}
        </PresenceContext.Provider>
    );
}

export function usePresenceContext(): PresenceContextType {
    const context = useContext(PresenceContext);
    if (!context) {
        // 返回默认值而不是抛出错误，这样组件可以在 Provider 外部降级使用
        return {
            onlineUsers: new Set(),
            isOnline: () => false,
            isConnected: false,
        };
    }
    return context;
}
