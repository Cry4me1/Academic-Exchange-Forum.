"use client";

import { useCallback, useEffect, useState } from "react";

// 当前最新版本号 - 每次发布新版本时更新这个值
export const CURRENT_VERSION = "0.8.0";

const STORAGE_KEY = "scholarly_last_seen_version";

export function useUpdateNotification() {
    const [hasNewUpdate, setHasNewUpdate] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        // 在客户端检查 localStorage
        const lastSeenVersion = localStorage.getItem(STORAGE_KEY);

        // 如果没有记录或者版本不匹配，说明有新更新
        if (!lastSeenVersion || lastSeenVersion !== CURRENT_VERSION) {
            setHasNewUpdate(true);
        }

        setIsLoaded(true);
    }, []);

    const markAsRead = useCallback(() => {
        localStorage.setItem(STORAGE_KEY, CURRENT_VERSION);
        setHasNewUpdate(false);
    }, []);

    return {
        hasNewUpdate,
        isLoaded,
        markAsRead,
        currentVersion: CURRENT_VERSION,
    };
}
