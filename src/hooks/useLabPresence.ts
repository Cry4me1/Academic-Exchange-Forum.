"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

export interface LabPresenceUser {
    id: string;
    username: string;
    fullName?: string;
    avatarUrl?: string;
    isOnline: boolean;
    scrollPosition?: {
        postId: string;
        scrollTop: number;
        scrollPercent: number;
    };
}

interface UseLabPresenceOptions {
    roomId: string;
    userId: string;
    username: string;
    fullName?: string;
    avatarUrl?: string;
    enabled?: boolean;
}

interface UseLabPresenceReturn {
    onlineMembers: LabPresenceUser[];
    isConnected: boolean;
    broadcastScrollPosition: (postId: string, scrollTop: number, scrollPercent: number) => void;
}

export function useLabPresence({
    roomId,
    userId,
    username,
    fullName,
    avatarUrl,
    enabled = true,
}: UseLabPresenceOptions): UseLabPresenceReturn {
    const [onlineMembers, setOnlineMembers] = useState<LabPresenceUser[]>([]);
    const [isConnected, setIsConnected] = useState(false);
    const channelRef = useRef<RealtimeChannel | null>(null);

    useEffect(() => {
        if (!enabled || !roomId || !userId) return;

        const supabase = createClient();
        const channel = supabase.channel(`lab-room:${roomId}`, {
            config: {
                presence: {
                    key: userId,
                },
            },
        });
        channelRef.current = channel;

        const handleSync = () => {
            const state = channel.presenceState();
            const members: LabPresenceUser[] = [];

            Object.entries(state).forEach(([key, presences]) => {
                const latest = presences[presences.length - 1] as any;
                if (latest) {
                    members.push({
                        id: key,
                        username: latest.username || key,
                        fullName: latest.fullName,
                        avatarUrl: latest.avatarUrl,
                        isOnline: true,
                        scrollPosition: latest.scrollPosition,
                    });
                }
            });

            setOnlineMembers(members);
        };

        channel
            .on("presence", { event: "sync" }, handleSync)
            .subscribe(async (status) => {
                if (status === "SUBSCRIBED") {
                    setIsConnected(true);
                    await channel.track({
                        username,
                        fullName,
                        avatarUrl,
                        online_at: new Date().toISOString(),
                    });
                } else {
                    setIsConnected(false);
                }
            });

        return () => {
            channel.unsubscribe();
            channelRef.current = null;
            setIsConnected(false);
            setOnlineMembers([]);
        };
    }, [roomId, userId, username, fullName, avatarUrl, enabled]);

    const broadcastScrollPosition = useCallback(
        (postId: string, scrollTop: number, scrollPercent: number) => {
            if (!channelRef.current) return;
            channelRef.current.track({
                username,
                fullName,
                avatarUrl,
                online_at: new Date().toISOString(),
                scrollPosition: { postId, scrollTop, scrollPercent },
            });
        },
        [username, fullName, avatarUrl]
    );

    return {
        onlineMembers,
        isConnected,
        broadcastScrollPosition,
    };
}
