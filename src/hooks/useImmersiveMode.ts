"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * 沉浸式阅读模式 Hook
 * - 管理沉浸模式开关状态
 * - 监听快捷键: Esc 退出, Ctrl/Cmd+Shift+F 切换
 */
export function useImmersiveMode() {
    const [isImmersive, setIsImmersive] = useState(false);

    const toggle = useCallback(() => {
        setIsImmersive((prev) => !prev);
    }, []);

    const exit = useCallback(() => {
        setIsImmersive(false);
    }, []);

    const enter = useCallback(() => {
        setIsImmersive(true);
    }, []);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Esc 退出沉浸模式
            if (e.key === "Escape" && isImmersive) {
                exit();
            }
            // Ctrl/Cmd + Shift + F 切换沉浸模式
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "f") {
                e.preventDefault();
                toggle();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isImmersive, exit, toggle]);

    return { isImmersive, toggle, exit, enter };
}
