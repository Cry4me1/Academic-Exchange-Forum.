"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Sparkles, PartyPopper, Rocket, CheckCircle } from "lucide-react";

export default function LaunchAnnouncementPage() {
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

                {/* 公告内容 */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <Card className="overflow-hidden">
                        {/* 头部横幅 */}
                        <div className="h-40 bg-gradient-to-br from-primary via-purple-500 to-pink-500 relative overflow-hidden">
                            <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.3, type: "spring" }}
                                    className="text-center text-white"
                                >
                                    <PartyPopper className="h-12 w-12 mx-auto mb-2" />
                                    <h1 className="text-3xl font-bold">Scholarly 上线啦！</h1>
                                </motion.div>
                            </div>
                        </div>

                        <CardContent className="p-8">
                            <div className="prose prose-sm dark:prose-invert max-w-none">
                                <p className="text-lg text-muted-foreground leading-relaxed">
                                    欢迎来到 <strong className="text-foreground">Scholarly</strong> —— 一个专为学术交流设计的现代化论坛平台！
                                </p>

                                <div className="my-8 grid gap-4 sm:grid-cols-2">
                                    <motion.div
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.4 }}
                                        className="p-4 rounded-lg bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20"
                                    >
                                        <Rocket className="h-6 w-6 text-blue-500 mb-2" />
                                        <h3 className="font-semibold text-foreground">强大的编辑器</h3>
                                        <p className="text-sm text-muted-foreground">
                                            支持 LaTeX 公式、代码高亮、图片上传等丰富功能
                                        </p>
                                    </motion.div>

                                    <motion.div
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.5 }}
                                        className="p-4 rounded-lg bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/20"
                                    >
                                        <Sparkles className="h-6 w-6 text-purple-500 mb-2" />
                                        <h3 className="font-semibold text-foreground">实时互动</h3>
                                        <p className="text-sm text-muted-foreground">
                                            实时消息、在线状态显示、即时通知
                                        </p>
                                    </motion.div>
                                </div>

                                <h2 className="text-xl font-bold text-foreground mt-8 mb-4">平台特色</h2>

                                <ul className="space-y-3">
                                    {[
                                        "支持 LaTeX 数学公式渲染",
                                        "多语言代码高亮显示",
                                        "实时私信和在线状态",
                                        "好友系统和社交互动",
                                        "帖子点赞、收藏、评论",
                                        "热门学术话题发现",
                                    ].map((feature, index) => (
                                        <motion.li
                                            key={feature}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.6 + index * 0.1 }}
                                            className="flex items-center gap-2 text-muted-foreground"
                                        >
                                            <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                                            {feature}
                                        </motion.li>
                                    ))}
                                </ul>

                                <div className="mt-8 p-4 rounded-lg bg-muted/50 border border-border">
                                    <p className="text-sm text-muted-foreground">
                                        <strong className="text-foreground">发布日期：</strong>2026年1月2日
                                    </p>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        如有问题或建议，欢迎通过举报功能联系我们！
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </div>
    );
}
