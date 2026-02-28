"use client";

import { UserCount } from "@/components/UserCount";
import { motion } from "framer-motion";
import { BookOpen, Lightbulb, MessageSquare, Sigma } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const features = [
    {
        icon: MessageSquare,
        text: "专注学术讨论",
    },
    {
        icon: Sigma,
        text: "支持 LaTeX 公式",
    },
    {
        icon: BookOpen,
        text: "知识沉淀与分享",
    },
    {
        icon: Lightbulb,
        text: "跨学科交流",
    },
];

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen flex overflow-hidden bg-slate-50 dark:bg-slate-950 transition-colors duration-500">
            {/* 左侧 - 学术氛围背景 */}
            <motion.div
                initial={{ width: "100%", opacity: 0 }}
                animate={{ width: "50vw", opacity: 1 }}
                transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                className="hidden lg:flex relative bg-slate-50 dark:bg-slate-950 overflow-hidden flex-shrink-0 transition-colors duration-500"
            >
                {/* 装饰性多层渐变光效 */}
                <div className="absolute inset-0 transition-opacity duration-500">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-100/80 via-transparent to-transparent dark:opacity-0" />
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-amber-100/50 via-transparent to-transparent dark:opacity-0" />

                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/80 via-slate-950 to-slate-950 opacity-0 dark:opacity-100 transition-opacity duration-500" />
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-purple-900/40 via-transparent to-transparent opacity-0 dark:opacity-100 transition-opacity duration-500" />
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-cyan-900/30 via-transparent to-transparent opacity-0 dark:opacity-100 transition-opacity duration-500" />
                </div>

                <div className="absolute inset-0">
                    <div className="absolute top-20 left-20 w-72 h-72 bg-indigo-300/40 dark:bg-purple-500/20 rounded-full blur-3xl transition-colors duration-500" />
                    <div className="absolute bottom-20 right-20 w-72 h-72 bg-amber-300/30 dark:bg-cyan-500/20 rounded-full blur-3xl transition-colors duration-500" />
                </div>

                {/* 网格背景 */}
                <div
                    className="absolute inset-0 opacity-[0.03] dark:opacity-10 transition-opacity duration-500"
                    style={{
                        backgroundImage: `linear-gradient(currentColor 1px, transparent 1px),
                               linear-gradient(90deg, currentColor 1px, transparent 1px)`,
                        backgroundSize: "40px 40px",
                        color: "currentColor"
                    }}
                />

                {/* 内容 */}
                <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20 w-full max-w-2xl mx-auto">
                    {/* Logo */}
                    <Link href="/" className="inline-flex items-center gap-3 mb-8">
                        <Image src="/logo.png" alt="Scholarly Logo" width={48} height={48} className="rounded-xl shadow-xl dark:shadow-2xl shadow-indigo-500/10 dark:shadow-indigo-500/30 ring-1 ring-slate-900/5 dark:ring-white/10" />
                        <span className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 dark:from-white dark:via-white dark:to-white/80 transition-colors">
                            Scholarly
                        </span>
                    </Link>

                    {/* 标语 */}
                    <h2 className="text-4xl xl:text-5xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight mb-6 transition-colors">
                        让学术交流
                        <br />
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-orange-600 to-amber-600 dark:from-amber-200 dark:via-yellow-200 dark:to-amber-300 transition-colors">
                            更加精彩
                        </span>
                    </h2>

                    <p className="text-lg text-slate-600 dark:text-white/60 max-w-md mb-10 transition-colors">
                        加入 Scholarly，与全球学者共同探讨前沿话题，分享知识与见解。
                    </p>

                    {/* 功能亮点 */}
                    <div className="space-y-4">
                        {features.map((feature) => (
                            <div
                                key={feature.text}
                                className="flex items-center gap-3"
                            >
                                <div className="p-2 rounded-lg bg-orange-100 dark:bg-white/10 backdrop-blur-sm transition-colors border border-amber-200 dark:border-transparent">
                                    <feature.icon className="w-5 h-5 text-orange-600 dark:text-amber-400" />
                                </div>
                                <span className="text-slate-700 dark:text-white/80 font-medium transition-colors">{feature.text}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 装饰性元素 */}
                <div className="absolute bottom-10 left-10 right-10">
                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/60 dark:bg-white/5 backdrop-blur-sm border border-slate-200 dark:border-white/10 transition-colors shadow-sm dark:shadow-none">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 dark:from-purple-400 dark:to-pink-400 flex items-center justify-center text-white font-bold shadow-md">
                            S
                        </div>
                        <div>
                            <p className="text-slate-800 dark:text-white font-medium transition-colors">欢迎加入学术社区</p>
                            <p className="text-slate-500 dark:text-white/50 text-sm transition-colors">已有 <span className="font-semibold text-orange-600 dark:text-amber-400"><UserCount /></span> 学者在此交流</p>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* 右侧 - 表单区域 */}
            <div className="w-full lg:w-[50vw] flex items-center justify-center p-6 lg:p-12 bg-background flex-shrink-0 transition-colors duration-500">
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5, duration: 0.5 }}
                    className="w-full max-w-md"
                >
                    {/* 移动端 Logo */}
                    <div className="lg:hidden text-center mb-8">
                        <Link href="/" className="inline-flex items-center justify-center gap-2">
                            <Image src="/logo.png" alt="Scholarly Logo" width={32} height={32} className="rounded-lg shadow-md ring-1 ring-slate-900/5 dark:ring-white/10" />
                            <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-800 dark:from-white dark:to-white/80 transition-colors">
                                Scholarly
                            </span>
                        </Link>
                    </div>

                    {/* 表单内容 */}
                    <div className="p-8 rounded-2xl bg-card border border-border shadow-sm transition-colors">
                        {children}
                    </div>

                    {/* 返回首页 */}
                    <p className="text-center mt-6 text-sm text-muted-foreground">
                        <Link href="/" className="hover:text-foreground transition-colors">
                            ← 返回首页
                        </Link>
                    </p>
                </motion.div>
            </div>
        </div>
    );
}
