"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { LabPresenceUser } from "./useLabPresence";

interface UseScrollSyncOptions {
    scrollContainerRef: React.RefObject<HTMLElement | null>;
    currentPostId: string | null;
    onlineMembers: LabPresenceUser[];
    broadcastScrollPosition: (postId: string, scrollTop: number, scrollPercent: number) => void;
    enabled?: boolean;
}

interface UseScrollSyncReturn {
    syncEnabled: boolean;
    toggleSync: () => void;
    followingUserId: string | null;
    followUser: (userId: string | null) => void;
}

export function useScrollSync({
    scrollContainerRef,
    currentPostId,
    onlineMembers,
    broadcastScrollPosition,
    enabled = true,
}: UseScrollSyncOptions): UseScrollSyncReturn {
    const [syncEnabled, setSyncEnabled] = useState(true);
    const [followingUserId, setFollowingUserId] = useState<string | null>(null);
    const isLocalScroll = useRef(true);
    const broadcastThrottle = useRef<number>(0);

    // 广播本地滚动位置
    useEffect(() => {
        if (!enabled || !syncEnabled || !currentPostId) return;
        const container = scrollContainerRef.current;
        if (!container) return;

        const handleScroll = () => {
            if (!isLocalScroll.current) {
                isLocalScroll.current = true;
                return;
            }

            const now = Date.now();
            if (now - broadcastThrottle.current < 200) return; // 200ms 节流
            broadcastThrottle.current = now;

            const scrollTop = container.scrollTop;
            const scrollHeight = container.scrollHeight - container.clientHeight;
            const scrollPercent = scrollHeight > 0 ? scrollTop / scrollHeight : 0;

            broadcastScrollPosition(currentPostId, scrollTop, scrollPercent);
        };

        container.addEventListener("scroll", handleScroll, { passive: true });
        return () => container.removeEventListener("scroll", handleScroll);
    }, [enabled, syncEnabled, currentPostId, scrollContainerRef, broadcastScrollPosition]);

    // 跟随远程用户滚动
    useEffect(() => {
        if (!enabled || !syncEnabled || !followingUserId || !currentPostId) return;
        const container = scrollContainerRef.current;
        if (!container) return;

        const followedUser = onlineMembers.find((m) => m.id === followingUserId);
        if (!followedUser?.scrollPosition) return;
        if (followedUser.scrollPosition.postId !== currentPostId) return;

        isLocalScroll.current = false;
        const scrollHeight = container.scrollHeight - container.clientHeight;
        container.scrollTo({
            top: followedUser.scrollPosition.scrollPercent * scrollHeight,
            behavior: "smooth",
        });
    }, [enabled, syncEnabled, followingUserId, currentPostId, onlineMembers, scrollContainerRef]);

    const toggleSync = useCallback(() => {
        setSyncEnabled((prev) => !prev);
    }, []);

    const followUser = useCallback((userId: string | null) => {
        setFollowingUserId(userId);
    }, []);

    return {
        syncEnabled,
        toggleSync,
        followingUserId,
        followUser,
    };
}
