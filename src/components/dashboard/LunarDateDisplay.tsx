"use client";

import { cn } from "@/lib/utils";
import { Lunar } from "lunar-javascript";
import { useEffect, useState } from "react";

export function LunarDateDisplay({ className }: { className?: string }) {
    const [lunarDate, setLunarDate] = useState<string>("");
    const [isNewYear, setIsNewYear] = useState(false);

    useEffect(() => {
        const now = new Date();
        const lunar = Lunar.fromDate(now);

        // 获取农历日期字符串，例如 "正月初一"
        const monthStr = lunar.getMonthInChinese();
        const dayStr = lunar.getDayInChinese();
        const dateStr = `${monthStr}月${dayStr}`;

        setLunarDate(dateStr);

        // Check if it's new year (Month 1, Day 1)
        if (lunar.getMonth() === 1 && lunar.getDay() === 1 || true) { // FORCE TESTING
            setIsNewYear(true);
        }
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
