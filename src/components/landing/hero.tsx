"use client";

import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export function Hero() {
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.2
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.8,
                ease: [0.22, 1, 0.36, 1] as const
            }
        }
    };

    return (
        <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
            {/* 渐变背景 */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900" />

            {/* 动态光效 */}
            <div className="absolute inset-0 overflow-hidden">
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 0.5, 0.3]
                    }}
                    transition={{
                        duration: 8,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                    className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/30 rounded-full blur-3xl"
                />
                <motion.div
                    animate={{
                        scale: [1, 1.5, 1],
                        opacity: [0.2, 0.4, 0.2]
                    }}
                    transition={{
                        duration: 10,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: 1
                    }}
                    className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500/20 rounded-full blur-3xl"
                />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
            </div>

            {/* 网格背景 */}
            <div
                className="absolute inset-0 opacity-20"
                style={{
                    backgroundImage: `linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)`,
                    backgroundSize: '60px 60px'
                }}
            />

            {/* 内容 */}
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="relative z-10 max-w-5xl mx-auto px-6 text-center"
            >
                {/* 标签 */}
                <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 mb-8">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    <span className="text-sm text-white/80">开启学术交流新方式</span>
                </motion.div>

                {/* 主标题 */}
                <motion.h1 variants={itemVariants} className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight flex flex-col items-center justify-center gap-6">
                    <Image src="/logo.png" alt="Scholarly Logo" width={80} height={80} className="rounded-2xl shadow-2xl shadow-purple-500/20" />
                    <div>
                        <span className="bg-gradient-to-r from-white via-purple-200 to-cyan-200 bg-clip-text text-transparent">
                            Scholarly
                        </span>
                        <br />
                        <span className="text-3xl md:text-5xl font-medium text-white/90">
                            学术论坛
                        </span>
                    </div>
                </motion.h1>

                {/* 副标题 */}
                <motion.p variants={itemVariants} className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto mb-10 leading-relaxed">
                    一个专注于学术讨论的现代化社区。支持 LaTeX 公式、代码高亮，
                    让思想碰撞更加精彩。
                </motion.p>

                {/* CTA 按钮 */}
                <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Button
                        asChild
                        size="lg"
                        className="h-12 px-8 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white border-0 rounded-xl shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-300 hover:scale-105"
                    >
                        <Link href="/register">
                            立即注册
                            <ArrowRight className="ml-2 w-4 h-4" />
                        </Link>
                    </Button>
                    <Button
                        asChild
                        variant="outline"
                        size="lg"
                        className="h-12 px-8 bg-white/5 backdrop-blur-sm border-white/20 text-white hover:bg-white/10 hover:border-white/30 rounded-xl transition-all duration-300"
                    >
                        <Link href="/login">
                            登录账号
                        </Link>
                    </Button>
                </motion.div>

                {/* 装饰性卡片预览 */}
                <motion.div variants={itemVariants} className="mt-16 relative">
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent z-10 pointer-events-none" />
                    <div className="relative mx-auto max-w-4xl rounded-2xl overflow-hidden border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl">
                        <div className="h-8 bg-white/5 border-b border-white/10 flex items-center px-4 gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-400/60" />
                            <div className="w-3 h-3 rounded-full bg-yellow-400/60" />
                            <div className="w-3 h-3 rounded-full bg-green-400/60" />
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 shrink-0" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 w-32 bg-white/20 rounded" />
                                    <div className="h-3 w-full bg-white/10 rounded" />
                                    <div className="h-3 w-3/4 bg-white/10 rounded" />
                                </div>
                            </div>
                            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                                <div className="font-mono text-sm text-cyan-300/80">
                                    {"$$E = mc^2$$"}
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </section>
    );
}
