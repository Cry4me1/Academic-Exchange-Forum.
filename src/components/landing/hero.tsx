"use client";

import { Button } from "@/components/ui/button";
import { UserCount } from "@/components/UserCount";
import { motion } from "framer-motion";
import { ArrowRight, BookOpen, Code2, FlaskConical, MessageSquare, Zap } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

// 粒子组件
function FloatingParticles() {
    const particles = Array.from({ length: 30 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 3 + 1,
        duration: Math.random() * 20 + 15,
        delay: Math.random() * 5,
    }));

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {particles.map((p) => (
                <motion.div
                    key={p.id}
                    className="absolute rounded-full bg-slate-400/30 dark:bg-white/20"
                    style={{
                        left: `${p.x}%`,
                        top: `${p.y}%`,
                        width: p.size,
                        height: p.size,
                    }}
                    animate={{
                        y: [0, -30, 0],
                        opacity: [0.2, 0.6, 0.2],
                    }}
                    transition={{
                        duration: p.duration,
                        repeat: Infinity,
                        delay: p.delay,
                        ease: "easeInOut",
                    }}
                />
            ))}
        </div>
    );
}

// 浮动特性卡片
function FloatingCard({
    children,
    className = "",
    delay = 0,
    floatRange = 12,
}: {
    children: React.ReactNode;
    className?: string;
    delay?: number;
    floatRange?: number;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, delay: delay + 0.8, ease: [0.22, 1, 0.36, 1] }}
            className={className}
        >
            <motion.div
                animate={{ y: [-floatRange, floatRange, -floatRange] }}
                transition={{
                    duration: 6 + delay * 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
            >
                {children}
            </motion.div>
        </motion.div>
    );
}

// 统计数字
function AnimatedCounter({ target, label, icon: Icon }: { target: string; label: string; icon: React.ElementType }) {
    return (
        <div className="flex items-center gap-3 px-5 py-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-gradient-to-br dark:from-amber-400/20 dark:to-orange-400/20 flex items-center justify-center border border-amber-200 dark:border-amber-400/20">
                <Icon className="w-5 h-5 text-orange-600 dark:text-amber-400" />
            </div>
            <div>
                <div className="text-xl font-bold text-slate-800 dark:text-white">{target}</div>
                <div className="text-xs text-slate-500 dark:text-white/50">{label}</div>
            </div>
        </div>
    );
}

export function Hero() {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.15,
                delayChildren: 0.1,
            },
        },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.8,
                ease: [0.22, 1, 0.36, 1] as const,
            },
        },
    };

    return (
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-slate-50 dark:bg-slate-950 transition-colors duration-500">
            {/* === 多层渐变背景 === */}
            <div className="absolute inset-0 transition-opacity duration-500">
                {/* 浅色模式光晕 */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-100/80 via-transparent to-transparent dark:opacity-0" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-amber-100/50 via-transparent to-transparent dark:opacity-0" />

                {/* 深色模式光晕 */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/80 via-slate-950 to-slate-950 opacity-0 dark:opacity-100 transition-opacity duration-500" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-purple-900/40 via-transparent to-transparent opacity-0 dark:opacity-100 transition-opacity duration-500" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-cyan-900/30 via-transparent to-transparent opacity-0 dark:opacity-100 transition-opacity duration-500" />
            </div>

            {/* === 动态光晕 === */}
            <div className="absolute inset-0 overflow-hidden">
                <motion.div
                    animate={{ scale: [1, 1.3, 1], opacity: [0.15, 0.35, 0.15], x: [0, 30, 0] }}
                    transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute -top-20 right-[10%] w-[500px] h-[500px] rounded-full blur-[100px] bg-indigo-300/40 dark:bg-gradient-to-br dark:from-purple-500/30 dark:to-fuchsia-500/20"
                />
                <motion.div
                    animate={{ scale: [1, 1.4, 1], opacity: [0.1, 0.25, 0.1], x: [0, -20, 0] }}
                    transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                    className="absolute bottom-[10%] -left-20 w-[400px] h-[400px] rounded-full blur-[100px] bg-cyan-300/30 dark:bg-gradient-to-tr dark:from-cyan-500/25 dark:to-blue-500/15"
                />
                <motion.div
                    animate={{ scale: [1, 1.2, 1], opacity: [0.08, 0.2, 0.08] }}
                    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 4 }}
                    className="absolute top-[40%] left-[40%] w-[300px] h-[300px] rounded-full blur-[80px] bg-amber-300/30 dark:bg-gradient-to-r dark:from-amber-500/15 dark:to-orange-500/10"
                />
            </div>

            {/* === 网格点阵背景 === */}
            <div
                className="absolute inset-0 opacity-[0.03] dark:opacity-[0.04] transition-opacity duration-500"
                style={{
                    backgroundImage: `radial-gradient(circle, currentColor 1px, transparent 1px)`,
                    backgroundSize: "40px 40px",
                    color: "currentColor"
                }}
            />

            {/* === 粒子 === */}
            {mounted && <FloatingParticles />}

            {/* === 主内容 === */}
            <div className="relative z-10 w-full max-w-7xl mx-auto px-6 py-20">
                <div className="grid lg:grid-cols-[1fr_auto] gap-12 items-center">
                    {/* 左侧内容 */}
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="text-center lg:text-left"
                    >
                        {/* 标签 */}
                        <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 bg-white/60 dark:bg-white/[0.06] backdrop-blur-md border border-slate-200 dark:border-white/[0.08] shadow-sm dark:shadow-none transition-colors">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 dark:bg-emerald-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 dark:bg-emerald-400" />
                            </span>
                            <span className="text-sm text-slate-600 dark:text-white/70 font-medium">
                                已有 <span className="text-orange-600 dark:text-amber-400 font-bold"><UserCount /></span> 位学者在此交流
                            </span>
                        </motion.div>

                        {/* 主标题 */}
                        <motion.div variants={itemVariants} className="flex items-center gap-5 mb-6 justify-center lg:justify-start">
                            <Image
                                src="/logo.png"
                                alt="Scholarly Logo"
                                width={72}
                                height={72}
                                className="rounded-2xl shadow-xl dark:shadow-2xl shadow-indigo-500/10 dark:shadow-indigo-500/30 ring-1 ring-slate-900/5 dark:ring-white/10"
                            />
                            <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
                                <span className="bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 dark:from-white dark:via-white dark:to-white/80 transition-colors">
                                    Scholarly
                                </span>
                            </h1>
                        </motion.div>

                        {/* 副标题 */}
                        <motion.h2 variants={itemVariants} className="text-2xl md:text-4xl font-semibold mb-6 tracking-tight">
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-orange-600 to-amber-600 dark:from-amber-200 dark:via-yellow-200 dark:to-amber-300 transition-colors">
                                思想碰撞的学术殿堂
                            </span>
                        </motion.h2>

                        {/* 描述语 */}
                        <motion.p variants={itemVariants} className="text-base md:text-lg max-w-xl mb-10 leading-relaxed mx-auto lg:mx-0 text-slate-600 dark:text-white/50 transition-colors">
                            一个面向研究者的下一代学术社区。原生支持 <span className="font-semibold text-slate-800 dark:text-white/80">LaTeX</span> 公式渲染、
                            <span className="font-semibold text-slate-800 dark:text-white/80">代码语法高亮</span>、Mermaid 图表，
                            让专业表达如呼吸般自然。
                        </motion.p>

                        {/* CTA 按钮 */}
                        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
                            <Button
                                asChild
                                size="lg"
                                className="h-13 px-8 text-white font-semibold border-0 rounded-xl transition-all duration-300 hover:scale-105 group bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-lg shadow-orange-500/25 dark:from-amber-500 dark:to-orange-500 dark:hover:from-amber-400 dark:hover:to-orange-400 dark:text-slate-950 dark:shadow-amber-500/25"
                            >
                                <Link href="/register">
                                    立即加入
                                    <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                                </Link>
                            </Button>
                            <Button
                                asChild
                                variant="outline"
                                size="lg"
                                className="h-13 px-8 rounded-xl transition-all duration-300 bg-white/50 hover:bg-white text-slate-800 border-slate-200 shadow-sm dark:bg-white/[0.04] dark:backdrop-blur-sm dark:border-white/[0.12] dark:text-white dark:hover:bg-white/[0.08] dark:hover:border-white/[0.2] dark:shadow-none"
                            >
                                <Link href="/login">
                                    登录账号
                                </Link>
                            </Button>
                        </motion.div>

                        {/* 统计条 */}
                        <motion.div
                            variants={itemVariants}
                            className="mt-12 inline-flex items-center rounded-2xl transition-colors bg-white/60 dark:bg-white/[0.04] backdrop-blur-md border border-slate-200 dark:border-white/[0.06] divide-x divide-slate-200 dark:divide-white/[0.06] shadow-sm dark:shadow-none"
                        >
                            <AnimatedCounter target="10K+" label="学术帖子" icon={BookOpen} />
                            <AnimatedCounter target="50+" label="学科领域" icon={FlaskConical} />
                            <AnimatedCounter target="99.9%" label="正常运行" icon={Zap} />
                        </motion.div>
                    </motion.div>

                    {/* 右侧浮动卡片区域 */}
                    <div className="hidden lg:block relative w-[400px] h-[500px]">
                        {/* LaTeX 公式卡片 */}
                        <FloatingCard className="absolute top-0 left-0" delay={0} floatRange={10}>
                            <div className="w-[340px] rounded-2xl overflow-hidden transition-colors bg-white/80 dark:bg-white/[0.07] backdrop-blur-xl border border-slate-200 dark:border-white/[0.1] shadow-xl dark:shadow-2xl shadow-slate-200/50 dark:shadow-black/20">
                                <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 dark:border-white/[0.06] bg-slate-50/50 dark:bg-transparent">
                                    <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                                    <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                                    <span className="ml-2 text-xs font-mono text-slate-500 dark:text-white/30">公式编辑器</span>
                                </div>
                                <div className="p-5">
                                    <div className="text-xs mb-3 font-mono text-slate-400 dark:text-white/40">// 薛定谔方程</div>
                                    <div className="text-center py-4 px-3 rounded-xl border bg-indigo-50/50 border-indigo-100 dark:bg-gradient-to-br dark:from-indigo-500/10 dark:to-purple-500/10 dark:border-indigo-400/10">
                                        <span className="text-lg font-serif italic tracking-wide text-indigo-700 dark:text-indigo-200">
                                            iℏ ∂Ψ/∂t = ĤΨ
                                        </span>
                                    </div>
                                    <div className="mt-3 text-center py-3 px-3 rounded-xl border bg-cyan-50/50 border-cyan-100 dark:bg-gradient-to-br dark:from-cyan-500/10 dark:to-blue-500/10 dark:border-cyan-400/10">
                                        <span className="text-base font-serif italic text-cyan-700 dark:text-cyan-200">
                                            ∇ × <strong>E</strong> = −∂<strong>B</strong>/∂t
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </FloatingCard>

                        {/* 代码卡片 */}
                        <FloatingCard className="absolute top-[180px] -left-[40px]" delay={0.3} floatRange={8}>
                            <div className="w-[300px] rounded-2xl overflow-hidden transition-colors bg-white/80 dark:bg-white/[0.07] backdrop-blur-xl border border-slate-200 dark:border-white/[0.1] shadow-xl dark:shadow-2xl shadow-slate-200/50 dark:shadow-black/20">
                                <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 dark:border-white/[0.06] bg-slate-50/50 dark:bg-transparent">
                                    <Code2 className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400/70" />
                                    <span className="text-xs font-mono text-slate-500 dark:text-white/30">algorithm.py</span>
                                </div>
                                <div className="p-4 font-mono text-xs leading-relaxed">
                                    <div><span className="text-purple-600 dark:text-purple-400">def</span> <span className="text-amber-600 dark:text-amber-300">fibonacci</span><span className="text-slate-600 dark:text-white/60">(n):</span></div>
                                    <div className="pl-4"><span className="text-purple-600 dark:text-purple-400">if</span> <span className="text-slate-700 dark:text-white/70">n &lt;= </span><span className="text-cyan-600 dark:text-cyan-300">1</span><span className="text-slate-600 dark:text-white/60">:</span></div>
                                    <div className="pl-8"><span className="text-purple-600 dark:text-purple-400">return</span> <span className="text-slate-700 dark:text-white/70">n</span></div>
                                    <div className="pl-4"><span className="text-purple-600 dark:text-purple-400">return</span> <span className="text-amber-600 dark:text-amber-300">fibonacci</span><span className="text-slate-600 dark:text-white/60">(</span><span className="text-slate-700 dark:text-white/70">n-</span><span className="text-cyan-600 dark:text-cyan-300">1</span><span className="text-slate-600 dark:text-white/60">)</span> <span className="text-slate-400 dark:text-white/40">+</span> <span className="text-amber-600 dark:text-amber-300">fibonacci</span><span className="text-slate-600 dark:text-white/60">(</span><span className="text-slate-700 dark:text-white/70">n-</span><span className="text-cyan-600 dark:text-cyan-300">2</span><span className="text-slate-600 dark:text-white/60">)</span></div>
                                </div>
                            </div>
                        </FloatingCard>

                        {/* 讨论卡片 */}
                        <FloatingCard className="absolute top-[340px] left-[30px]" delay={0.6} floatRange={14}>
                            <div className="w-[320px] rounded-2xl overflow-hidden transition-colors bg-white/80 dark:bg-white/[0.07] backdrop-blur-xl border border-slate-200 dark:border-white/[0.1] shadow-xl dark:shadow-2xl shadow-slate-200/50 dark:shadow-black/20">
                                <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 dark:border-white/[0.06] bg-slate-50/50 dark:bg-transparent">
                                    <MessageSquare className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400/70" />
                                    <span className="text-xs text-slate-500 dark:text-white/30">热门讨论</span>
                                </div>
                                <div className="p-4 space-y-3">
                                    <div className="flex items-start gap-3">
                                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 dark:from-violet-400 dark:to-indigo-500 shrink-0 ring-1 ring-slate-900/5 dark:ring-white/10" />
                                        <div className="flex-1">
                                            <div className="text-sm font-medium text-slate-800 dark:text-white/80">关于量子纠缠的新理解</div>
                                            <div className="text-xs mt-1 text-slate-500 dark:text-white/40">12 条回复 · 42 人赞同</div>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 shrink-0 ring-1 ring-slate-900/5 dark:ring-white/10" />
                                        <div className="flex-1">
                                            <div className="text-sm font-medium text-slate-800 dark:text-white/80">深度学习在 NLP 中的演进</div>
                                            <div className="text-xs mt-1 text-slate-500 dark:text-white/40">8 条回复 · 36 人赞同</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </FloatingCard>
                    </div>
                </div>
            </div>

            {/* === 底部渐变过渡 === */}
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-50 dark:from-slate-950 to-transparent pointer-events-none transition-colors duration-500" />
        </section>
    );
}
