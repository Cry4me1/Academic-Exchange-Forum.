"use client";

import { useEffect, useState, useRef } from "react";
import { cn } from "@/lib/utils";

export interface DanmakuMessage {
    id: string;
    text: string;
    userId: string;
    username: string;
    positionColor?: "challenger" | "opponent" | "spectator";
}

interface DanmakuOverlayProps {
    newDanmaku: DanmakuMessage | null;
    visible: boolean;
}

interface ActiveDanmaku {
    id: string;
    text: string;
    username: string;
    track: number;
    colorClass: string;
}

export function DanmakuOverlay({ newDanmaku, visible }: DanmakuOverlayProps) {
    const [danmakus, setDanmakus] = useState<ActiveDanmaku[]>([]);
    const nextTrackRef = useRef(0);
    const TRACK_COUNT = 4; // 弹幕轨道数量

    useEffect(() => {
        if (!newDanmaku || !visible) return;

        // 根据身份确定弹幕配色
        let colorClass = "bg-background/90 border-border text-foreground";
        if (newDanmaku.positionColor === "challenger") {
            colorClass = "bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400";
        } else if (newDanmaku.positionColor === "opponent") {
            colorClass = "bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400";
        } else {
            colorClass = "bg-muted/90 border-border/50 text-muted-foreground";
        }

        // 分配轨道
        const track = nextTrackRef.current;
        nextTrackRef.current = (nextTrackRef.current + 1) % TRACK_COUNT;

        const id = newDanmaku.id || Math.random().toString(36).substr(2, 9);
        const item: ActiveDanmaku = {
            id,
            text: newDanmaku.text,
            username: newDanmaku.username,
            track,
            colorClass,
        };

        setDanmakus((prev) => {
            if (prev.some(d => d.id === id)) return prev;
            return [...prev, item];
        });

        // 8秒后自动从状态中移除，防止内存泄漏
        const timer = setTimeout(() => {
            setDanmakus((prev) => prev.filter((d) => d.id !== id));
        }, 8000);

        return () => clearTimeout(timer);
    }, [newDanmaku, visible]);

    if (!visible) return null;

    return (
        <div className="absolute inset-x-0 top-0 h-48 pointer-events-none overflow-hidden z-20">
            {/* 注入动画样式 */}
            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes danmakuMove {
                    0% {
                        transform: translateX(100%);
                    }
                    100% {
                        transform: translateX(-100vw);
                    }
                }
                .animate-danmaku-move {
                    animation: danmakuMove var(--danmaku-duration, 8s) linear forwards;
                    will-change: transform;
                }
            `}} />
            
            {danmakus.map((d) => (
                <div
                    key={d.id}
                    className={cn(
                        "absolute right-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border shadow-sm backdrop-blur-[2px] whitespace-nowrap animate-danmaku-move",
                        d.colorClass
                    )}
                    style={{
                        top: `${d.track * 38 + 16}px`,
                        "--danmaku-duration": "7.5s",
                    } as React.CSSProperties}
                >
                    <span className="opacity-70 text-[10px]">@{d.username}:</span>
                    <span>{d.text}</span>
                </div>
            ))}
        </div>
    );
}
