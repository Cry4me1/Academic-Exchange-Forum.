"use client";

import { useEffect, useState } from "react";

export function CNYDecorations() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Only show decorations if the theme is active
        const checkTheme = () => {
            const theme = document.documentElement.getAttribute("data-theme");
            setIsVisible(theme === "cny");
        };

        // Initial check
        checkTheme();

        // Observe attribute changes on html element
        const observer = new MutationObserver(checkTheme);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

        return () => observer.disconnect();
    }, []);

    if (!isVisible) return null;

    return (
        <div className="pointer-events-none fixed inset-0 z-[100] overflow-hidden" suppressHydrationWarning>
            {/* 左上角祥云 - 调整位置通过负边距隐藏尾部 */}
            <div className="absolute -top-8 -left-20 w-60 h-40 opacity-20 text-primary rotate-[-10deg]">
                <svg viewBox="0 0 1024 1024" className="w-full h-full fill-current">
                    <path d="M866.86 389.72c-15.68-23.08-36.94-42.54-61.66-57.14 3.96-12.82 5.92-26.16 5.92-39.72 0-77.96-63.42-141.38-141.38-141.38-51.54 0-96.6 27.56-121.78 68.64-28.7-27.42-67.92-44.22-111.02-44.22-82.68 0-150.36 63.84-157.72 144.78-8.56-1.52-17.34-2.28-26.24-2.28-76.3 0-140.06 52.88-155.02 123.94-6.42-0.88-12.92-1.3-19.5-1.3-77.96 0-141.38 63.42-141.38 141.38s63.42 141.38 141.38 141.38h42.5c41.3 0 75 33.7 75 75S162.66 874 121.36 874h-42.5c-30.9 0-56-25.1-56-56s25.1-56 56-56h9.62c4.34 0 7.86-3.52 7.86-7.86 0-4.34-3.52-7.86-7.86-7.86h-9.62c-39.54 0-71.72 32.18-71.72 71.72s32.18 71.72 71.72 71.72h42.5c49.96 0 90.72-40.76 90.72-90.72 0-38.36-24.1-71.1-58.08-84.6 15.08-2.6 30.6-4.18 46.5-4.18 84.72 0 159.6-42.3 205.8-107.56 31.84 27.14 73.18 43.5 118.3 43.5 101.96 0 184.6-82.64 184.6-184.6 0-20.12-3.3-39.52-9.36-57.88z m-261.2 249.4c-35.84 0-68.52-12.92-93.52-34.34-6 9.6-12.82 18.7-20.36 27.24 28.52 35.26 71.9 57.64 120.62 57.64 86.4 0 156.44-70.04 156.44-156.44s-70.04-156.44-156.44-156.44c-28.76 0-55.82 7.78-79.36 21.36 5.8 45.36 28.16 85.5 60.84 114.7 10.36-9.66 19.8-20.14 28.28-31.32-26.46-24.22-44.18-57.48-48.24-94.88 12.06-4.04 25.04-6.3 38.48-6.3 70.68 0 128.02 57.34 128.02 128.02 0 70.66-57.34 128.02-128.02 128.02-5.18-0.02-10.28-0.56-15.28-1.58z" />
                </svg>
            </div>

            {/* 右上角灯笼 - 缩小尺寸并靠右，避免遮挡按钮 */}
            <div className="absolute -top-2 right-4 w-16 h-32 animate-float delay-100">
                <svg viewBox="0 0 100 200" className="w-full h-full drop-shadow-lg">
                    {/* 灯笼绳 */}
                    <line x1="50" y1="0" x2="50" y2="40" stroke="var(--primary)" strokeWidth="2" />
                    {/* 灯笼主体 */}
                    <ellipse cx="50" cy="70" rx="35" ry="30" fill="var(--primary)" />
                    {/* 金色边缘 */}
                    <ellipse cx="50" cy="70" rx="35" ry="30" fill="none" stroke="var(--secondary)" strokeWidth="2" />
                    {/* 灯笼穗 */}
                    <line x1="50" y1="100" x2="50" y2="150" stroke="var(--primary)" strokeWidth="3" />
                    <line x1="45" y1="100" x2="40" y2="140" stroke="var(--primary)" strokeWidth="2" />
                    <line x1="55" y1="100" x2="60" y2="140" stroke="var(--primary)" strokeWidth="2" />
                    {/* 福字 (简化为金色方块) */}
                    <rect x="35" y="55" width="30" height="30" rx="5" fill="var(--secondary)" className="opacity-80" />
                </svg>
            </div>

            {/* 底部纹理条 */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-30"></div>
        </div>
    );
}
