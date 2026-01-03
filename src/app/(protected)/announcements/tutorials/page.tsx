"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
    ArrowLeft,
    BookOpen,
    GraduationCap,
    PenTool,
    MessageSquareHeart,
    ChevronRight,
    Sparkles
} from "lucide-react";

// 新手教程列表
const tutorials = [
    {
        id: "f145e71e-4f4c-4907-99cc-b086567c543d",
        title: "新手上路：Scholarly 编辑器使用指南",
        description: "学习如何使用 Scholarly 的强大编辑器，包括 Slash 命令、Markdown 语法、LaTeX 公式等核心功能。",
        icon: PenTool,
        color: "from-blue-500 to-cyan-500",
        bgColor: "from-blue-500/10 to-cyan-500/5",
        borderColor: "border-blue-500/20 hover:border-blue-500/40",
    },
    {
        id: "c481e458-1b13-4f52-85ca-3c894e066588",
        title: "Scholarly 平台使用指南",
        description: "全面了解 Scholarly 平台的各项功能，包括个人资料设置、浏览发现、社交互动和实时通知。",
        icon: GraduationCap,
        color: "from-purple-500 to-pink-500",
        bgColor: "from-purple-500/10 to-pink-500/5",
        borderColor: "border-purple-500/20 hover:border-purple-500/40",
    },
    {
        id: "ac254d3c-f45a-4dcc-b4c8-3fc86fc4d2e1",
        title: "致 Scholarly 首批用户的一封信",
        description: "了解 Scholarly 的愿景与初心，以及我们为学术交流社区带来的全新体验。",
        icon: MessageSquareHeart,
        color: "from-amber-500 to-orange-500",
        bgColor: "from-amber-500/10 to-orange-500/5",
        borderColor: "border-amber-500/20 hover:border-amber-500/40",
    },
];

export default function TutorialsPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* 返回按钮 */}
                <Link href="/dashboard">
                    <Button variant="ghost" size="sm" className="mb-6 gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        返回首页
                    </Button>
                </Link>

                {/* 页面内容 */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <Card className="overflow-hidden">
                        {/* 头部横幅 */}
                        <div className="h-32 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 relative overflow-hidden">
                            <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.3, type: "spring" }}
                                    className="text-center text-white"
                                >
                                    <BookOpen className="h-10 w-10 mx-auto mb-2" />
                                    <h1 className="text-2xl font-bold">新手教程指南</h1>
                                </motion.div>
                            </div>
                        </div>

                        <CardContent className="p-6">
                            <p className="text-muted-foreground text-center mb-8">
                                欢迎来到 Scholarly！以下教程将帮助你快速上手平台的各项功能。
                            </p>

                            {/* 教程列表 */}
                            <div className="space-y-4">
                                {tutorials.map((tutorial, index) => (
                                    <motion.div
                                        key={tutorial.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.4 + index * 0.1 }}
                                    >
                                        <Link href={`/posts/${tutorial.id}`}>
                                            <div
                                                className={`group p-5 rounded-xl bg-gradient-to-br ${tutorial.bgColor} border ${tutorial.borderColor} transition-all duration-300 hover:shadow-lg hover:scale-[1.02] cursor-pointer`}
                                            >
                                                <div className="flex items-start gap-4">
                                                    <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${tutorial.color} flex items-center justify-center shrink-0 shadow-lg`}>
                                                        <tutorial.icon className="h-6 w-6 text-white" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center justify-between gap-2">
                                                            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                                                                {tutorial.title}
                                                            </h3>
                                                            <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0" />
                                                        </div>
                                                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                                            {tutorial.description}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </Link>
                                    </motion.div>
                                ))}
                            </div>

                            {/* 底部提示 */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.8 }}
                                className="mt-8 p-4 rounded-lg bg-muted/50 border border-border flex items-center gap-3"
                            >
                                <Sparkles className="h-5 w-5 text-primary shrink-0" />
                                <p className="text-sm text-muted-foreground">
                                    完成教程后，你就可以开始探索 Scholarly 的精彩世界了！有任何问题随时可以通过私信联系管理员。
                                </p>
                            </motion.div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </div>
    );
}
