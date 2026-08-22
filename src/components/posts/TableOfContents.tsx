"use client";

import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight, List, Sparkles } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { AcademicElementMeta, PostAcademicMeta } from "@/lib/academic-meta";

export interface HeadingItem {
    id: string;
    text: string;
    level: number;
}

interface TableOfContentsProps {
    headings: HeadingItem[];
    academicMeta?: PostAcademicMeta | null;
    className?: string;
    /** 模式: sidebar（右侧栏）或 floating（沉浸模式浮动面板） */
    mode?: "sidebar" | "floating";
}

export function TableOfContents({
    headings,
    academicMeta,
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

    // 仅在浮动面板内部滚动容器中保证激活项可见（绝不触发全局 window scrollIntoView）
    useEffect(() => {
        if (!activeId) return;
        const activeBtn = activeItemRef.current;
        if (!activeBtn) return;

        // 仅寻找内部局部可滚动容器进行局域滚动
        const scrollContainer = activeBtn.closest(".toc-scroll-container") as HTMLElement;
        if (scrollContainer) {
            const itemTop = activeBtn.offsetTop;
            const containerTop = scrollContainer.scrollTop;
            const containerHeight = scrollContainer.clientHeight;

            if (itemTop < containerTop || itemTop > containerTop + containerHeight - 40) {
                scrollContainer.scrollTo({
                    top: Math.max(0, itemTop - 20),
                    behavior: "smooth",
                });
            }
        }
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

    // 滚动至学术块并触发脉冲高亮 (支持 ID、data 属性、类型与索引多级回退定位)
    const scrollToAcademicElement = useCallback((itemOrId: AcademicElementMeta | string) => {
        const academicId = typeof itemOrId === "string" ? itemOrId : itemOrId.id;
        const itemType = typeof itemOrId === "object" ? itemOrId.type : undefined;
        const itemIndex = typeof itemOrId === "object" ? itemOrId.index : undefined;

        // 1. 精确 ID 匹配 或 data-academic-id 匹配
        let element: HTMLElement | null =
            document.getElementById(academicId) ||
            document.querySelector<HTMLElement>(`[data-academic-id="${academicId}"]`);

        // 2. 如果未通过 ID 找到，按学术类型进行语义回退匹配
        if (!element) {
            const allBlocks = Array.from(document.querySelectorAll<HTMLElement>(".academic-block-wrapper"));
            if (itemType) {
                const matchedBlocks = allBlocks.filter(
                    (el) => el.getAttribute("data-academic-type") === itemType
                );
                if (matchedBlocks.length > 0) {
                    const targetIdx = (itemIndex ?? 1) - 1;
                    element = matchedBlocks[targetIdx] || matchedBlocks[0];
                }
            }
            if (!element && allBlocks.length > 0) {
                element = allBlocks[0];
            }
        }

        if (!element) {
            toast.error("未在文章中找到对应的学术环境块");
            return;
        }

        const yOffset = -90;
        const targetY = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
        const startY = window.pageYOffset;
        const diff = targetY - startY;
        const duration = 550;
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
                // 到达目标位置后触发学术环境块的高亮脉冲
                element.classList.remove("academic-pulse-highlight");
                void element.offsetWidth;
                element.classList.add("academic-pulse-highlight");
                setTimeout(() => {
                    element?.classList.remove("academic-pulse-highlight");
                }, 2200);
            }
        };

        requestAnimationFrame(step);
    }, []);

    const allAcademicItems = [
        ...(academicMeta?.theorems || []),
        ...(academicMeta?.definitions || []),
        ...(academicMeta?.proofs || []),
        ...(academicMeta?.others || []),
    ];

    if (headings.length === 0 && allAcademicItems.length === 0) {
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
                className={cn("fixed left-4 top-1/2 -translate-y-1/2 z-40", className)}
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
                            className="bg-background/80 backdrop-blur-xl border border-border/50 rounded-xl shadow-lg p-4 max-h-[60vh] overflow-y-auto scrollbar-hidden toc-scroll-container"
                        >
                            {/* 顶部标题 + 进度 */}
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-xs font-semibold text-foreground">
                                    目录与学术速览
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
                            {headings.length > 0 && (
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
                            )}

                            {/* 浮动模式下的学术要素 */}
                            {allAcademicItems.length > 0 && (
                                <div className="mt-3 pt-2 border-t border-border/40 space-y-1">
                                    <div className="text-[10px] font-semibold text-muted-foreground uppercase mb-1">
                                        学术要素 ({allAcademicItems.length})
                                    </div>
                                    {allAcademicItems.map((item) => (
                                        <button
                                            key={item.id}
                                            type="button"
                                            onClick={() => scrollToAcademicElement(item)}
                                            className="w-full text-left px-1.5 py-1 rounded text-xs hover:bg-muted/40 transition-colors flex items-center justify-between text-muted-foreground hover:text-foreground"
                                        >
                                            <span className="truncate">
                                                {item.type === "theorem" ? "定理" : item.type === "lemma" ? "引理" : item.type === "definition" ? "定义" : "证明"}{item.number ? ` ${item.number}` : ""} {item.title ? `(${item.title})` : ""}
                                            </span>
                                            <ChevronRight className="w-3 h-3 opacity-50 shrink-0" />
                                        </button>
                                    ))}
                                </div>
                            )}
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
        <nav className={cn("relative space-y-5", className)} aria-label="文章目录与学术大纲">
            {/* 目录部分 */}
            <div>
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
            </div>

            {/* 学术要素速览 (Academic Index Navigator) */}
            {allAcademicItems.length > 0 && (
                <div className="pt-3 border-t border-border/40">
                    <div className="flex items-center justify-between mb-2.5">
                        <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                            学术要素速览
                        </span>
                        <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.2 rounded-full font-semibold">
                            {allAcademicItems.length}
                        </span>
                    </div>

                    <div className="space-y-1 max-h-48 overflow-y-auto pr-1 text-xs">
                        {allAcademicItems.map((item) => (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => scrollToAcademicElement(item)}
                                className="w-full text-left px-2 py-1.5 rounded-md hover:bg-muted/50 transition-colors flex items-center justify-between group"
                            >
                                <div className="truncate flex items-center gap-1.5">
                                    <span className="font-semibold text-primary shrink-0">
                                        {item.type === "theorem"
                                            ? "定理"
                                            : item.type === "lemma"
                                            ? "引理"
                                            : item.type === "definition"
                                            ? "定义"
                                            : item.type === "proof"
                                            ? "证明"
                                            : item.type === "proposition"
                                            ? "命题"
                                            : item.type === "corollary"
                                            ? "推论"
                                            : "学术块"}
                                        {item.number ? ` ${item.number}` : ""}
                                    </span>
                                    {item.title && (
                                        <span className="text-muted-foreground truncate group-hover:text-foreground">
                                            ({item.title})
                                        </span>
                                    )}
                                </div>
                                <ChevronRight className="w-3 h-3 text-muted-foreground/40 group-hover:text-foreground shrink-0" />
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </nav>
    );
}

export default TableOfContents;
