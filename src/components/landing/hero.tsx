"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import {
    ArrowRight,
    BookOpen,
    FlaskConical,
    Sparkles,
    Zap,
    MessageSquare,
    ThumbsUp,
    Eye,
    Compass,
    Tag,
    UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserCount } from "@/components/UserCount";
import { MathText } from "@/components/ui/math-text";
import { NeuralBackground } from "./neural-background";
import { FloatingGlyphs } from "./floating-glyphs";

export interface HeroPostItem {
    id: string;
    title: string;
    content?: string;
    tags?: string[];
    created_at?: string;
    view_count?: number;
    comment_count: number;
    like_count: number;
    author?: {
        id?: string;
        username?: string;
        full_name?: string;
        avatar_url?: string | null;
        special_title?: string;
    };
}

// 辅助函数：从富文本 JSON 或纯文本中安全提取摘要
function extractSnippet(contentStr?: string): string {
    if (!contentStr) return "探讨前沿学术命题，分享独到研究洞见。";
    try {
        if (contentStr.startsWith("{") || contentStr.startsWith("[")) {
            const parsed = JSON.parse(contentStr);
            const text = getPlainTextFromNode(parsed);
            return text.slice(0, 140) || "探讨前沿学术命题，分享独到研究洞见。";
        }
    } catch {
        // 普通字符串
    }
    return contentStr.replace(/<[^>]*>?/gm, "").slice(0, 140) || "探讨前沿学术命题，分享独到研究洞见。";
}

function getPlainTextFromNode(node: any): string {
    if (!node) return "";
    let text = "";
    if (node.text) text += node.text;
    if (Array.isArray(node.content)) {
        text += node.content.map(getPlainTextFromNode).join(" ");
    } else if (node.content && typeof node.content === "object") {
        text += getPlainTextFromNode(node.content);
    }
    return text;
}

// 3D 悬浮交互视差卡片
function Interactive3DCard({ children }: { children: React.ReactNode }) {
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const mouseXSpring = useSpring(x, { stiffness: 180, damping: 20 });
    const mouseYSpring = useSpring(y, { stiffness: 180, damping: 20 });

    const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["8deg", "-8deg"]);
    const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-8deg", "8deg"]);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        x.set(mouseX / width - 0.5);
        y.set(mouseY / height - 0.5);
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
    };

    return (
        <motion.div
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
                rotateX,
                rotateY,
                transformStyle: "preserve-3d",
            }}
            className="relative perspective-1000 transition-all duration-200 ease-out will-change-transform"
        >
            {children}
        </motion.div>
    );
}

// 统计指标项
function StatBadge({ value, label, icon: Icon }: { value: string; label: string; icon: React.ElementType }) {
    return (
        <div className="flex items-center gap-3.5 px-5 lg:px-6 py-3.5">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 dark:bg-amber-400/10 flex items-center justify-center border border-orange-500/20 dark:border-amber-400/20 text-orange-600 dark:text-amber-400 shadow-xs">
                <Icon className="w-5 h-5" />
            </div>
            <div>
                <div className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">{value}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">{label}</div>
            </div>
        </div>
    );
}

interface HeroProps {
    postsCount?: number;
    tagsCount?: number;
    hotTopics?: HeroPostItem[];
}

export function Hero({ postsCount = 0, tagsCount = 0, hotTopics = [] }: HeroProps) {
    // 选中的精选帖子索引
    const [selectedPostIndex, setSelectedPostIndex] = useState(0);

    // 默认兜底帖子数据（防止数据库为空时崩溃）
    const fallbackTopics: HeroPostItem[] = [
        {
            id: "physics-1",
            title: "关于拓扑绝缘体在超低温下的量子反常霍尔效应研究",
            content: "实验证实了在无外加强磁场条件下，磁性掺杂拓扑绝缘体薄膜表现出精确量子化的霍尔电阻平台 \\(\\sigma_{xy} = e^2/h\\)。",
            tags: ["量子物理", "凝聚态", "拓扑"],
            comment_count: 18,
            like_count: 64,
            view_count: 520,
            author: {
                username: "quantum_physicist",
                full_name: "沈知远 教授",
                special_title: "国家杰青 · 高能物理所",
            },
        },
        {
            id: "ai-2",
            title: "大模型长上下文推理阶段的动态注意力机制优化分析",
            content: "提出动态注意力剪枝算法，在保持超长文本问答准确率的同时，将注意力矩阵显存开销降低 65%。",
            tags: ["深度学习", "注意力机制", "LLM"],
            comment_count: 26,
            like_count: 98,
            view_count: 890,
            author: {
                username: "elena_ai",
                full_name: "Elena Rostova",
                special_title: "AI 首席科学家",
            },
        },
        {
            id: "math-3",
            title: "高维紧致辛流形上的弗洛尔同调与全曲率积分",
            content: "结合高斯-博内定理 \\(\\chi(M) = \\frac{1}{2\\pi}\\int_M K\\,dA\\)，给出了非退化辛流形相交数的上同调精确刻画。",
            tags: ["微分几何", "流形", "拓扑"],
            comment_count: 14,
            like_count: 47,
            view_count: 360,
            author: {
                username: "topologist",
                full_name: "林承宇 博士",
                special_title: "应用数学研究员",
            },
        },
    ];

    const displayPosts = hotTopics && hotTopics.length > 0 ? hotTopics : fallbackTopics;
    const currentPost = displayPosts[selectedPostIndex] || displayPosts[0];

    const formatCount = (count: number, label: string) => {
        if (count <= 0) return label === "posts" ? "10K+" : "50+";
        if (count >= 1000) return `${(count / 1000).toFixed(1)}K+`;
        return `${count}`;
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.12,
                delayChildren: 0.05,
            },
        },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 24 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.75,
                ease: [0.22, 1, 0.36, 1] as const,
            },
        },
    };

    return (
        <section className="relative min-h-[92vh] flex items-center justify-center overflow-hidden bg-slate-50/70 dark:bg-[#07090e] transition-colors duration-700">
            {/* === 1. 柔和极光光晕背景 === */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-18%] left-1/2 -translate-x-1/2 w-[850px] h-[480px] bg-gradient-to-b from-amber-500/15 via-orange-500/10 to-transparent blur-[130px] rounded-full dark:from-amber-400/15 dark:via-purple-600/10 dark:to-transparent" />
                <div className="absolute top-1/4 -left-[8%] w-[550px] h-[550px] bg-indigo-500/10 dark:bg-indigo-600/12 blur-[140px] rounded-full" />
                <div className="absolute bottom-10 -right-[8%] w-[550px] h-[550px] bg-amber-500/10 dark:bg-orange-600/10 blur-[140px] rounded-full" />
            </div>

            {/* === 2. 神经知识网络 Canvas 动画（鼠标引力互动） === */}
            <NeuralBackground />

            {/* === 3. 浮动 LaTeX 景深学术公式 === */}
            <FloatingGlyphs />

            {/* === 4. 精细网格背景 === */}
            <div
                className="absolute inset-0 opacity-[0.025] dark:opacity-[0.035] pointer-events-none"
                style={{
                    backgroundImage: `linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)`,
                    backgroundSize: "48px 48px",
                }}
            />

            {/* === 5. 主内容区 === */}
            <div className="relative z-10 w-full max-w-7xl mx-auto px-6 py-16 lg:py-24">
                <div className="grid lg:grid-cols-12 gap-12 lg:gap-10 items-center">
                    {/* 左侧主要文字与操作区 (7 列) */}
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="lg:col-span-7 text-center lg:text-left"
                    >
                        {/* 学术社群活跃徽章与 820 通行码活动入口 */}
                        <motion.div
                            variants={itemVariants}
                            className="flex flex-wrap items-center justify-center lg:justify-start gap-2.5 mb-8"
                        >
                            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/80 dark:bg-white/[0.05] backdrop-blur-xl border border-slate-200/80 dark:border-white/10 shadow-xs hover:border-amber-500/40 transition-all duration-300 group cursor-default">
                                <span className="flex h-2 w-2 relative">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                                </span>
                                <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                                    汇聚前沿思想 · 已有{" "}
                                    <span className="text-orange-600 dark:text-amber-400 font-bold">
                                        <UserCount />
                                    </span>{" "}
                                    位学者在此研讨
                                </span>
                                <Sparkles className="w-3.5 h-3.5 text-amber-500 group-hover:rotate-12 transition-transform" />
                            </div>

                            <Link
                                href="/invite-820"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-500/10 hover:bg-orange-500/20 text-orange-600 dark:text-amber-400 border border-orange-500/30 text-xs font-semibold shadow-xs transition-all hover:scale-105"
                            >
                                <span className="text-sm">🎟️</span>
                                <span>820 邀请码先到先得看板</span>
                                <ArrowRight className="w-3 h-3 ml-0.5" />
                            </Link>
                        </motion.div>

                        {/* 主品牌与标题 */}
                        <motion.div
                            variants={itemVariants}
                            className="flex items-center gap-4 mb-6 justify-center lg:justify-start"
                        >
                            <div className="relative p-1 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-orange-500/20">
                                <Image
                                    src="/logo.png"
                                    alt="Scholarly Logo"
                                    width={64}
                                    height={64}
                                    priority
                                    className="rounded-xl bg-white dark:bg-slate-950 p-1"
                                />
                            </div>
                            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight">
                                <span className="bg-clip-text text-transparent bg-gradient-to-r from-slate-950 via-slate-800 to-slate-900 dark:from-white dark:via-slate-100 dark:to-slate-300">
                                    Scholarly
                                </span>
                            </h1>
                        </motion.div>

                        {/* 副标语 */}
                        <motion.h2
                            variants={itemVariants}
                            className="text-2xl md:text-4xl font-bold mb-6 tracking-tight"
                        >
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-orange-600 via-amber-500 to-amber-600 dark:from-amber-300 dark:via-orange-300 dark:to-amber-400">
                                纯粹、严谨、灵动的学术殿堂
                            </span>
                        </motion.h2>

                        {/* 描述语 */}
                        <motion.p
                            variants={itemVariants}
                            className="text-base md:text-lg max-w-2xl mb-10 leading-relaxed mx-auto lg:mx-0 text-slate-600 dark:text-slate-400"
                        >
                            专为研究者与学者打造的下一代学术交流平台。原生支持{" "}
                            <span className="font-semibold text-slate-900 dark:text-slate-100">LaTeX</span>{" "}
                            深度数学排版、
                            <span className="font-semibold text-slate-900 dark:text-slate-100">多语言算法高亮</span>与
                            Mermaid 拓扑图谱，让思想的深邃自由绽放。
                        </motion.p>

                        {/* 核心 CTA 操作按钮 */}
                        <motion.div
                            variants={itemVariants}
                            className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start"
                        >
                            <Button
                                asChild
                                size="lg"
                                className="h-12 px-8 text-white font-medium rounded-xl transition-all duration-300 hover:scale-[1.03] shadow-lg shadow-orange-500/25 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 dark:from-amber-400 dark:to-orange-500 dark:text-slate-950 font-semibold group border-0"
                            >
                                <Link href="/register">
                                    开启学术探索
                                    <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </Link>
                            </Button>
                            <Button
                                asChild
                                variant="outline"
                                size="lg"
                                className="h-12 px-8 rounded-xl transition-all duration-300 bg-white/70 hover:bg-white text-slate-800 border-slate-200/80 shadow-xs dark:bg-white/[0.04] dark:backdrop-blur-xl dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/[0.08]"
                            >
                                <Link
                                    href={currentPost?.id ? `/posts/${currentPost.id}` : "/dashboard"}
                                    className="flex items-center gap-2"
                                >
                                    <Compass className="w-4 h-4" />
                                    浏览前沿讨论
                                </Link>
                            </Button>
                        </motion.div>

                        {/* 实时数据指标栏 */}
                        <motion.div
                            variants={itemVariants}
                            className="mt-12 inline-flex flex-wrap items-center justify-center lg:justify-start rounded-2xl bg-white/80 dark:bg-white/[0.03] backdrop-blur-xl border border-slate-200/80 dark:border-white/10 divide-x divide-slate-200/80 dark:divide-white/10 shadow-xs"
                        >
                            <StatBadge value={formatCount(postsCount, "posts")} label="学术成果/讨论" icon={BookOpen} />
                            <StatBadge value={formatCount(tagsCount, "tags")} label="学科领域" icon={FlaskConical} />
                            <StatBadge value="99.9%" label="高可用服务" icon={Zap} />
                        </motion.div>
                    </motion.div>

                    {/* 右侧：3D 真实前沿学术动态卡片 (5 列) */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 30 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                        className="lg:col-span-5 relative"
                    >
                        <Interactive3DCard>
                            <div className="relative rounded-3xl overflow-hidden bg-white/95 dark:bg-[#0c121c]/95 backdrop-blur-2xl border-2 border-slate-200/80 dark:border-white/[0.12] shadow-2xl shadow-slate-300/40 dark:shadow-black/60">
                                
                                {/* 顶部真实帖子快速切换栏 */}
                                <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200/80 dark:border-white/[0.08] bg-slate-100/60 dark:bg-white/[0.02]">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                                        <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                                        <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                                    </div>

                                    {/* 真实帖子 Tab 切换器 */}
                                    <div className="flex items-center p-1 rounded-xl bg-slate-200/70 dark:bg-white/[0.06] text-xs">
                                        {displayPosts.slice(0, 3).map((item, idx) => (
                                            <button
                                                key={item.id || idx}
                                                type="button"
                                                onClick={() => setSelectedPostIndex(idx)}
                                                className={`px-2.5 py-1 rounded-lg transition-all text-xs font-semibold ${
                                                    selectedPostIndex === idx
                                                        ? "bg-white dark:bg-white/20 text-orange-600 dark:text-amber-300 shadow-xs"
                                                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                                                }`}
                                            >
                                                精选 {idx + 1}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* 真实帖子详细展示内容（高对比度，消除黑块） */}
                                <div className="p-6 space-y-4">
                                    {/* 作者信息栏 */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-bold text-sm shadow-md ring-2 ring-orange-500/20">
                                                {(currentPost.author?.full_name || currentPost.author?.username || "学").slice(0, 1)}
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                                                    {currentPost.author?.full_name || currentPost.author?.username || "认证学者"}
                                                    <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
                                                </div>
                                                <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                                                    {currentPost.author?.special_title || "同行评议学者"}
                                                </div>
                                            </div>
                                        </div>

                                        <span className="text-[11px] font-mono text-orange-600 dark:text-amber-300 font-semibold px-2.5 py-1 rounded-full bg-orange-50 dark:bg-amber-400/10 border border-orange-200 dark:border-amber-400/20">
                                            热门帖子
                                        </span>
                                    </div>

                                    {/* 真实帖子标题 */}
                                    <Link
                                        href={`/posts/${currentPost.id}`}
                                        className="block text-lg font-black text-slate-900 dark:text-white hover:text-orange-600 dark:hover:text-amber-300 transition-colors leading-snug"
                                    >
                                        {currentPost.title}
                                    </Link>

                                    {/* 真实内容提炼与公式渲染窗（浅色纯净，深色高亮） */}
                                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/10 text-xs md:text-sm text-slate-700 dark:text-slate-200 leading-relaxed shadow-inner overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                                        <MathText text={extractSnippet(currentPost.content)} />
                                    </div>

                                    {/* 真实标签 */}
                                    {currentPost.tags && currentPost.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5">
                                            {currentPost.tags.slice(0, 3).map((tag, i) => (
                                                <span
                                                    key={i}
                                                    className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 dark:text-slate-300 px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-white/[0.06] border border-slate-200 dark:border-white/[0.08]"
                                                >
                                                    <Tag className="w-2.5 h-2.5 text-orange-500 dark:text-amber-400" />
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    {/* 底部真实互动数据与直达按钮 */}
                                    <div className="pt-3 border-t border-slate-200/80 dark:border-white/[0.08] flex items-center justify-between">
                                        <div className="flex items-center gap-4 text-xs font-semibold text-slate-500 dark:text-slate-400">
                                            <span className="flex items-center gap-1">
                                                <ThumbsUp className="w-3.5 h-3.5 text-orange-500" /> {currentPost.like_count || 0}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <MessageSquare className="w-3.5 h-3.5 text-blue-500" /> {currentPost.comment_count || 0}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Eye className="w-3.5 h-3.5 text-emerald-500" /> {currentPost.view_count || 0}
                                            </span>
                                        </div>

                                        <Link
                                            href={`/posts/${currentPost.id}`}
                                            className="text-xs font-bold text-orange-600 dark:text-amber-300 hover:underline inline-flex items-center gap-1"
                                        >
                                            研读全文
                                            <ArrowRight className="w-3.5 h-3.5" />
                                        </Link>
                                    </div>

                                </div>
                            </div>
                        </Interactive3DCard>
                    </motion.div>
                </div>
            </div>

            {/* === 6. 底部柔和过渡渐变 === */}
            <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-slate-50 dark:from-[#07090e] to-transparent pointer-events-none" />
        </section>
    );
}
