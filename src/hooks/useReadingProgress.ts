"use client";

import { useEffect, useRef, useState } from "react";

/**
 * 阅读进度追踪 Hook
 * - 返回 0-100 的滚动进度
 * - 使用 RAF 节流避免频繁 setState 导致性能问题
 */
export function useReadingProgress() {
    const [progress, setProgress] = useState(0);
    const rafId = useRef<number>(0);
    const lastProgress = useRef(0);

    useEffect(() => {
        const updateProgress = () => {
            const scrollHeight =
                document.documentElement.scrollHeight - window.innerHeight;
            const scrollTop = window.scrollY;
            const newProgress = scrollHeight > 0
                ? Math.min(100, Math.max(0, (scrollTop / scrollHeight) * 100))
                : 0;

            // 只在进度变化超过 0.5% 时更新状态，减少不必要的渲染
            if (Math.abs(newProgress - lastProgress.current) > 0.5) {
                lastProgress.current = newProgress;
                setProgress(newProgress);
            }
        };

        const handleScroll = () => {
            if (rafId.current) {
                cancelAnimationFrame(rafId.current);
            }
            rafId.current = requestAnimationFrame(updateProgress);
        };

        window.addEventListener("scroll", handleScroll, { passive: true });
        updateProgress(); // 初始化

        return () => {
            window.removeEventListener("scroll", handleScroll);
            if (rafId.current) {
                cancelAnimationFrame(rafId.current);
            }
        };
    }, []);

    return progress;
}
