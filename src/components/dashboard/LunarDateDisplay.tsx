"use client";

import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

// 使用浏览器内置 Intl API 获取农历日期（无需外部依赖）
function getLunarDate(date: Date): string {
    try {
        const fmt = new Intl.DateTimeFormat("zh-CN-u-ca-chinese", {
            month: "long",
            day: "numeric",
        });
        const parts = fmt.formatToParts(date);
        const month = parts.find((p) => p.type === "month")?.value ?? "";
        const day = parts.find((p) => p.type === "day")?.value ?? "";
        return month && day ? `${month}${day}` : "";
    } catch {
        return "";
    }
}

export function LunarDateDisplay({ className }: { className?: string }) {
    const [lunarDate, setLunarDate] = useState<string>("");
    const [isNewYear, setIsNewYear] = useState(false);

    useEffect(() => {
        const now = new Date();
        setLunarDate(getLunarDate(now));

        // 春节期间（公历2月17日-3月31日）显示高亮
        const year = now.getFullYear();
        setIsNewYear(
            now >= new Date(year, 1, 17) && now <= new Date(year, 2, 31, 23, 59, 59)
        );
    }, []);

    if (!lunarDate) return null;

    return (
        <div className={cn("flex items-center gap-2", className)}>
            <div className="relative group cursor-default">
                <div className="absolute -inset-1 bg-gradient-to-r from-red-600 to-orange-600 rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-200"></div>
                <div className="relative px-3 py-1 bg-card/80 backdrop-blur-sm border border-red-500/30 rounded-lg flex items-center gap-2">
                    <span className="text-red-600 dark:text-red-400 font-serif font-bold text-lg tracking-widest">
                        {lunarDate}
                    </span>
                    {isNewYear && (
                        <span className="flex h-3 w-3 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}
