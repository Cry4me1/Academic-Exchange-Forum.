"use client";

import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight, List } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export interface HeadingItem {
    id: string;
    text: string;
    level: number;
}

interface TableOfContentsProps {
    headings: HeadingItem[];
    className?: string;
    /** 模式: sidebar（右侧栏）或 floating（沉浸模式浮动面板） */
    mode?: "sidebar" | "floating";
}

export function TableOfContents({
    headings,
    className,
    mode = "sidebar",
}: TableOfContentsProps) {
    const [activeId, setActiveId] = useState<string>("");
    const [readingProgress, setReadingProgress] = useState(0);
    const [isFloatingExpanded, setIsFloatingExpanded] = useState(false);
    const progressRaf = useRef<number>(0);
    const lastProgress = useRef(0);
    const activeItemRef = useRef<HTMLButtonElement>(null);

    // IntersectionObserver 追踪当前可见的标题
    useEffect(() => {
        if (headings.length === 0) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setActiveId(entry.target.id);
                    }
                });
            },
            {
                rootMargin: "-80px 0px -80% 0px",
                threshold: 0,
            }
        );

        headings.forEach(({ id }) => {
            const element = document.getElementById(id);
            if (element) {
                observer.observe(element);
            }
        });

        return () => observer.disconnect();
    }, [headings]);

    // 阅读进度追踪 (RAF 节流)
    useEffect(() => {
        const updateProgress = () => {
            const scrollHeight =
                document.documentElement.scrollHeight - window.innerHeight;
            const scrollTop = window.scrollY;
            const newProgress = scrollHeight > 0
                ? Math.min(100, (scrollTop / scrollHeight) * 100)
                : 0;

            if (Math.abs(newProgress - lastProgress.current) > 0.5) {
                lastProgress.current = newProgress;
                setReadingProgress(newProgress);
            }
        };

        const handleScroll = () => {
            if (progressRaf.current) cancelAnimationFrame(progressRaf.current);
            progressRaf.current = requestAnimationFrame(updateProgress);
        };

        window.addEventListener("scroll", handleScroll, { passive: true });
        updateProgress();

        return () => {
            window.removeEventListener("scroll", handleScroll);
            if (progressRaf.current) cancelAnimationFrame(progressRaf.current);
        };
    }, []);

    // 自动滚动 TOC 列表使激活项可见
    useEffect(() => {
        activeItemRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "nearest",
        });
    }, [activeId]);

    const scrollToHeading = useCallback((id: string) => {
        const element = document.getElementById(id);
        if (!element) return;

        const yOffset = -100;
        const targetY =
            element.getBoundingClientRect().top + window.pageYOffset + yOffset;
        const startY = window.pageYOffset;
        const diff = targetY - startY;
        const duration = 600;
        let startTime: number | null = null;

        const ease = (t: number) =>
            t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

        const step = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const elapsed = timestamp - startTime;
            const progress = Math.min(elapsed / duration, 1);
            window.scrollTo(0, startY + diff * ease(progress));

            if (progress < 1) {
                requestAnimationFrame(step);
            } else {
                element.classList.remove("toc-heading-flash");
                void element.offsetWidth;
                element.classList.add("toc-heading-flash");
            }
        };

        requestAnimationFrame(step);
    }, []);

    // 双击复制锚链接
    const copyAnchorLink = useCallback((id: string) => {
        const url = `${window.location.origin}${window.location.pathname}#${id}`;
        navigator.clipboard.writeText(url).then(() => {
            toast.success("锚链接已复制到剪贴板");
        });
    }, []);

    // 键盘导航
    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent, id: string, index: number) => {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                scrollToHeading(id);
            }
            if (e.key === "ArrowDown" && index < headings.length - 1) {
                e.preventDefault();
                const nextBtn = document.querySelector(
                    `[data-toc-index="${index + 1}"]`
                ) as HTMLElement;
                nextBtn?.focus();
            }
            if (e.key === "ArrowUp" && index > 0) {
                e.preventDefault();
                const prevBtn = document.querySelector(
                    `[data-toc-index="${index - 1}"]`
                ) as HTMLElement;
                prevBtn?.focus();
            }
        },
        [scrollToHeading, headings.length]
    );

    if (headings.length === 0) {
        return null;
    }

    // 计算当前激活的 heading 索引（用于进度）
    const activeIndex = headings.findIndex((h) => h.id === activeId);
    const headingProgress =
        activeIndex >= 0
            ? ((activeIndex + 1) / headings.length) * 100
            : 0;

    // ============ 浮动模式 ============
    if (mode === "floating") {
        return (
            <div
                className="fixed left-4 top-1/2 -translate-y-1/2 z-40"
                onMouseEnter={() => setIsFloatingExpanded(true)}
                onMouseLeave={() => setIsFloatingExpanded(false)}
                role="navigation"
                aria-label="文章目录"
            >
                <AnimatePresence mode="wait">
                    {isFloatingExpanded ? (
                        <motion.div
                            key="expanded"
                            initial={{ opacity: 0, x: -10, width: 40 }}
                            animate={{ opacity: 1, x: 0, width: 260 }}
                            exit={{ opacity: 0, x: -10, width: 40 }}
                            transition={{
                                duration: 0.3,
                                ease: [0.22, 1, 0.36, 1],
                            }}
                            className="bg-background/80 backdrop-blur-xl border border-border/50 rounded-xl shadow-lg p-4 max-h-[60vh] overflow-y-auto scrollbar-hidden"
                        >
                            {/* 顶部标题 + 进度 */}
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-xs font-semibold text-foreground">
                                    目录
                                </span>
                                <span className="text-[10px] text-muted-foreground tabular-nums font-medium">
                                    {Math.round(readingProgress)}%
                                </span>
                            </div>

                            {/* 进度条 */}
                            <div className="h-[2px] bg-border/30 rounded-full mb-3">
                                <div
                                    className="h-full bg-primary/60 rounded-full transition-all duration-300 will-change-[width]"
                                    style={{
                                        width: `${readingProgress}%`,
                                    }}
                                />
                            </div>

                            {/* 目录项 */}
                            <ul className="space-y-0.5 relative" role="list">
                                {/* 左侧竖线 */}
                                <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-border/30 rounded-full" aria-hidden="true" />

                                {headings.map((heading, index) => {
                                    const isActive = activeId === heading.id;
                                    return (
                                        <li
                                            key={heading.id}
                                            className="relative"
                                        >
                                            {/* 弹簧动画指示器 */}
                                            {isActive && (
                                                <motion.div
                                                    layoutId="toc-floating-indicator"
                                                    className="absolute left-0 top-0 bottom-0 w-[2px] bg-primary rounded-full"
                                                    transition={{
                                                        type: "spring",
                                                        stiffness: 350,
                                                        damping: 30,
                                                    }}
                                                />
                                            )}
                                            <button
                                                ref={isActive ? activeItemRef : undefined}
                                                onClick={() =>
                                                    scrollToHeading(heading.id)
                                                }
                                                onDoubleClick={() =>
                                                    copyAnchorLink(heading.id)
                                                }
                                                onKeyDown={(e) => handleKeyDown(e, heading.id, index)}
                                                data-toc-index={index}
                                                className={cn(
                                                    "text-left text-xs w-full py-1.5 truncate transition-colors duration-200",
                                                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:rounded-sm",
                                                    heading.level === 1
                                                        ? "pl-3 font-medium"
                                                        : heading.level === 2
                                                            ? "pl-5"
                                                            : "pl-7",
                                                    isActive
                                                        ? "text-primary font-semibold"
                                                        : "text-muted-foreground hover:text-foreground"
                                                )}
                                                title="双击复制锚链接"
                                                aria-current={isActive ? "location" : undefined}
                                            >
                                                {heading.text}
                                            </button>
                                        </li>
                                    );
                                })}
                            </ul>
                        </motion.div>
                    ) : (
                        <motion.button
                            key="collapsed"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            transition={{ duration: 0.2 }}
                            className="w-10 h-10 rounded-xl bg-background/80 backdrop-blur-xl border border-border/50 shadow-lg flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                            title="展开目录"
                            aria-label="展开文章目录"
                        >
                            <List className="h-4 w-4" />
                        </motion.button>
                    )}
                </AnimatePresence>
            </div>
        );
    }

    // ============ 侧边栏模式 ============
    return (
        <nav className={cn("relative", className)} aria-label="文章目录">
            {/* 标题 + 阅读进度 */}
            <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sm text-foreground">目录</h3>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground tabular-nums">
                        {Math.round(readingProgress)}%
                    </span>
                </div>
            </div>

            {/* 段落进度条 */}
            <div className="h-[2px] bg-border/30 rounded-full mb-3">
                <div
                    className="h-full bg-primary/50 rounded-full transition-all duration-300 will-change-[width]"
                    style={{ width: `${headingProgress}%` }}
                />
            </div>

            {/* 目录列表 */}
            <ul className="space-y-0.5 relative" role="list">
                {/* 左侧竖线轨道 */}
                <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-border/30 rounded-full" aria-hidden="true" />

                {headings.map((heading, index) => {
                    const isActive = activeId === heading.id;
                    return (
                        <li key={heading.id} className="relative">
                            {/* 弹簧动画指示器 - layoutId 驱动 */}
                            {isActive && (
                                <motion.div
                                    layoutId="toc-sidebar-indicator"
                                    className="absolute left-0 top-0 bottom-0 w-[2px] bg-primary rounded-full"
                                    transition={{
                                        type: "spring",
                                        stiffness: 350,
                                        damping: 30,
                                    }}
                                />
                            )}
                            <button
                                ref={isActive ? activeItemRef : undefined}
                                onClick={() => scrollToHeading(heading.id)}
                                onDoubleClick={() =>
                                    copyAnchorLink(heading.id)
                                }
                                onKeyDown={(e) => handleKeyDown(e, heading.id, index)}
                                data-toc-index={index}
                                className={cn(
                                    "text-left text-sm w-full py-1.5 truncate transition-all duration-200",
                                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:rounded-sm",
                                    heading.level === 1
                                        ? "pl-3 font-medium"
                                        : heading.level === 2
                                            ? "pl-5"
                                            : "pl-7",
                                    isActive
                                        ? "text-primary font-semibold"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                                title="双击复制锚链接"
                                aria-current={isActive ? "location" : undefined}
                            >
                                <span className="flex items-center gap-1.5">
                                    {heading.text}
                                    {isActive && (
                                        <ChevronRight className="h-3 w-3 text-primary/60 flex-shrink-0" />
                                    )}
                                </span>
                            </button>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
}

export default TableOfContents;
