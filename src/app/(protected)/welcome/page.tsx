"use client";

import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
    ArrowLeft,
    ArrowRight,
    BookOpen,
    ChevronRight,
    Code2,
    Crown,
    GraduationCap,
    LayoutDashboard,
    MessageSquare,
    MessageSquareHeart,
    Palette,
    PenTool,
    Rocket,
    Sparkles,
    Swords,
    Zap,
} from "lucide-react";
import Link from "next/link";

// ─── 新手教程帖子数据 ───────────────────────────────────────────
const tutorials = [
    {
        id: "f145e71e-4f4c-4907-99cc-b086567c543d",
        title: "新手上路：Scholarly 编辑器使用指南",
        description:
            "学习如何使用 Scholarly 的强大编辑器，包括 Slash 命令、Markdown 语法、LaTeX 公式等核心功能。",
        icon: PenTool,
        gradient: "from-blue-500 to-cyan-500",
        bgGradient: "from-blue-500/8 to-cyan-500/4",
        borderHover: "hover:border-blue-500/30",
    },
    {
        id: "c481e458-1b13-4f52-85ca-3c894e066588",
        title: "Scholarly 平台使用指南",
        description:
            "全面了解 Scholarly 平台的各项功能，包括个人资料设置、浏览发现、社交互动和实时通知。",
        icon: GraduationCap,
        gradient: "from-violet-500 to-pink-500",
        bgGradient: "from-violet-500/8 to-pink-500/4",
        borderHover: "hover:border-violet-500/30",
    },
    {
        id: "ac254d3c-f45a-4dcc-b4c8-3fc86fc4d2e1",
        title: "致 Scholarly 首批用户的一封信",
        description:
            "了解 Scholarly 的愿景与初心，以及我们为学术交流社区带来的全新体验。",
        icon: MessageSquareHeart,
        gradient: "from-amber-500 to-orange-500",
        bgGradient: "from-amber-500/8 to-orange-500/4",
        borderHover: "hover:border-amber-500/30",
    },
];

// ─── v1.0.0 正式版核心特性 ────────────────────────────────────
const v1CoreFeatures = [
    {
        icon: LayoutDashboard,
        title: "帖子卡片全面升级",
        desc: "全新视觉设计，丰富的元信息展示，交互动效升级",
        color: "text-blue-500",
        bg: "bg-blue-500/8",
    },
    {
        icon: BookOpen,
        title: "沉浸式阅读体验",
        desc: "无干扰阅读模式、智能浮动目录、排版优化",
        color: "text-emerald-500",
        bg: "bg-emerald-500/8",
    },
    {
        icon: Crown,
        title: "VIP 会员系统",
        desc: "多等级体系、专属徽章与特权、尊贵身份标识",
        color: "text-amber-500",
        bg: "bg-amber-500/8",
    },
    {
        icon: Palette,
        title: "个人主页颜色自定义",
        desc: "多种精选配色方案，渐变色主题，个性化自定义",
        color: "text-pink-500",
        bg: "bg-pink-500/8",
    },
];

// ─── 平台既有功能 ────────────────────────────────────────────
const platformFeatures = [
    { icon: Code2, label: "LaTeX 公式支持", color: "text-indigo-500" },
    { icon: Zap, label: "Mermaid 图表渲染", color: "text-teal-500" },
    { icon: MessageSquare, label: "实时私信系统", color: "text-purple-500" },
    { icon: Swords, label: "学术对决模式", color: "text-rose-500" },
    { icon: Sparkles, label: "AI 智能助手", color: "text-cyan-500" },
    { icon: Rocket, label: "Cloudflare R2 存储", color: "text-orange-500" },
];

// ─── 动画变体 ─────────────────────────────────────────────────
const stagger = {
    hidden: {},
    visible: {
        transition: { staggerChildren: 0.1, delayChildren: 0.2 },
    },
};

const fadeUp = {
    hidden: { opacity: 0, y: 24 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
    },
};

export default function WelcomePage() {
    return (
        <div className="min-h-screen bg-background">
            {/* ╔══════════════════════════════════════════════╗ */}
            {/* ║  Section 1 — 欢迎 Hero                      ║ */}
            {/* ╚══════════════════════════════════════════════╝ */}
            <section className="relative overflow-hidden">
                {/* Soft gradient backdrop */}
                <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-violet-500/3 to-transparent" />
                <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary/8 blur-[100px]" />
                <div className="absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-violet-500/8 blur-[80px]" />

                <div className="relative max-w-3xl mx-auto px-6 pt-16 pb-20 text-center">
                    {/* Back button */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className="mb-12"
                    >
                        <Link href="/dashboard">
                            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
                                <ArrowLeft className="h-4 w-4" />
                                返回首页
                            </Button>
                        </Link>
                    </motion.div>

                    {/* Brand icon */}
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: "spring", damping: 14 }}
                        className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-[22px] bg-gradient-to-br from-primary to-violet-500 shadow-xl shadow-primary/20"
                    >
                        <Sparkles className="h-10 w-10 text-white" />
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.35, duration: 0.6 }}
                        className="text-4xl sm:text-5xl font-extrabold tracking-tight"
                    >
                        欢迎来到{" "}
                        <span className="bg-gradient-to-r from-primary to-violet-500 bg-clip-text text-transparent">
                            Scholarly
                        </span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5, duration: 0.6 }}
                        className="mt-4 text-lg text-muted-foreground leading-relaxed max-w-md mx-auto"
                    >
                        一个为学术交流而生的社区平台。
                        <br />
                        在这里，知识因分享而永恒，思想因碰撞而闪光。
                    </motion.p>
                </div>
            </section>

            {/* ╔══════════════════════════════════════════════╗ */}
            {/* ║  Section 2 — v1.0.0 特性介绍                 ║ */}
            {/* ╚══════════════════════════════════════════════╝ */}
            <section className="max-w-3xl mx-auto px-6 py-16">
                <motion.div
                    variants={stagger}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-60px" }}
                >
                    {/* Section heading */}
                    <motion.div variants={fadeUp} className="text-center mb-10">
                        <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary mb-4">
                            <Rocket className="h-3.5 w-3.5" />
                            v1.0.0 正式版
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                            全新功能，为你而来
                        </h2>
                        <p className="mt-2 text-sm text-muted-foreground">
                            本次正式版带来的四大核心升级
                        </p>
                    </motion.div>

                    {/* Core features grid */}
                    <div className="grid sm:grid-cols-2 gap-4 mb-12">
                        {v1CoreFeatures.map((feature) => (
                            <motion.div
                                key={feature.title}
                                variants={fadeUp}
                                className="group relative rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm p-6 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
                            >
                                <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl ${feature.bg}`}>
                                    <feature.icon className={`h-5 w-5 ${feature.color}`} />
                                </div>
                                <h3 className="font-semibold text-foreground mb-1.5">{feature.title}</h3>
                                <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
                            </motion.div>
                        ))}
                    </div>

                    {/* Existing platform features */}
                    <motion.div variants={fadeUp} className="text-center mb-6">
                        <h3 className="text-lg font-semibold text-foreground">更多平台能力</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                            这些强大功能已为你准备就绪
                        </p>
                    </motion.div>

                    <motion.div variants={fadeUp} className="flex flex-wrap justify-center gap-2.5">
                        {platformFeatures.map((item) => (
                            <div
                                key={item.label}
                                className="inline-flex items-center gap-2 rounded-full bg-muted/50 border border-border/40 px-4 py-2 text-sm"
                            >
                                <item.icon className={`h-3.5 w-3.5 ${item.color}`} />
                                <span className="text-foreground/80 font-medium">{item.label}</span>
                            </div>
                        ))}
                    </motion.div>
                </motion.div>
            </section>

            {/* ╔══════════════════════════════════════════════╗ */}
            {/* ║  Section 3 — 新手教程专栏                     ║ */}
            {/* ╚══════════════════════════════════════════════╝ */}
            <section className="max-w-3xl mx-auto px-6 pt-8 pb-20">
                <motion.div
                    variants={stagger}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-60px" }}
                >
                    <motion.div variants={fadeUp} className="text-center mb-10">
                        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-4 py-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400 mb-4">
                            <BookOpen className="h-3.5 w-3.5" />
                            快速上手
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                            新手教程
                        </h2>
                        <p className="mt-2 text-sm text-muted-foreground">
                            阅读以下指南，快速了解平台的各项功能
                        </p>
                    </motion.div>

                    {/* Tutorial cards */}
                    <div className="space-y-4">
                        {tutorials.map((tutorial) => (
                            <motion.div key={tutorial.id} variants={fadeUp}>
                                <Link href={`/posts/${tutorial.id}`}>
                                    <div
                                        className={`group relative rounded-2xl bg-gradient-to-br ${tutorial.bgGradient} border border-border/50 ${tutorial.borderHover} p-6 transition-all duration-300 hover:shadow-lg hover:scale-[1.01] cursor-pointer`}
                                    >
                                        <div className="flex items-center gap-5">
                                            {/* Icon */}
                                            <div
                                                className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${tutorial.gradient} shadow-lg shrink-0`}
                                            >
                                                <tutorial.icon className="h-7 w-7 text-white" />
                                            </div>

                                            {/* Text */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-3">
                                                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                                                        {tutorial.title}
                                                    </h3>
                                                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0" />
                                                </div>
                                                <p className="text-sm text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                                                    {tutorial.description}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </div>

                    {/* Bottom CTA */}
                    <motion.div variants={fadeUp} className="mt-14 text-center">
                        <Link href="/dashboard">
                            <Button
                                size="lg"
                                className="h-12 px-8 bg-gradient-to-r from-primary to-violet-600 hover:from-primary/90 hover:to-violet-600/90 text-white shadow-lg shadow-primary/20 rounded-xl font-medium group"
                            >
                                开始探索 Scholarly
                                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </Link>
                        <div className="mt-8 space-y-2 text-center pb-8">
                            <p className="text-xs text-muted-foreground/60">
                                有任何问题？随时可以通过私信联系管理员
                            </p>
                            <p className="text-sm font-medium text-muted-foreground/80 mt-6">
                                Made with ❤️ by 邵卓翰
                            </p>
                            <p className="text-xs text-muted-foreground/60">
                                <a href="mailto:ddanthumytrang@gmail.com" className="hover:text-primary transition-colors">ddanthumytrang@gmail.com</a>
                            </p>
                        </div>
                    </motion.div>
                </motion.div>
            </section>
        </div>
    );
}
