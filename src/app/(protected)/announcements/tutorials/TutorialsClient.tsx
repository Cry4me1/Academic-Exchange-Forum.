"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowLeft, GraduationCap, Sparkles } from "lucide-react";
import Link from "next/link";
import { TutorialStepIndicator } from "@/components/tutorials/TutorialStepIndicator";
import { Step1EditorTour } from "./steps/Step1EditorTour";
import { Step2PublicationTour } from "./steps/Step2PublicationTour";
import { Step3DuelTour } from "./steps/Step3DuelTour";
import { Step4MessagesTour } from "./steps/Step4MessagesTour";
import { Step5CreditsTour } from "./steps/Step5CreditsTour";
import { Step6AiReviewTour } from "./steps/Step6AiReviewTour";

export function TutorialsClient() {
    const [currentStep, setCurrentStep] = useState<number>(1);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <div className="min-h-screen bg-background relative overflow-x-hidden flex flex-col justify-between py-8 px-4 sm:px-6 lg:px-8">
                <div className="max-w-5xl w-full mx-auto space-y-7 animate-pulse">
                    <div className="h-10 w-32 bg-muted/40 rounded-full" />
                    <div className="h-48 bg-muted/30 rounded-3xl" />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background relative overflow-x-hidden flex flex-col justify-between py-8 px-4 sm:px-6 lg:px-8">
            {/* 柔和科技感背景光晕 */}
            <div className="absolute inset-0 pointer-events-none -z-0">
                <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[700px] h-[380px] bg-gradient-to-b from-primary/15 via-violet-500/10 to-transparent rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-5%] w-[450px] h-[450px] bg-primary/10 rounded-full blur-[110px]" />
                <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-blue-500/8 rounded-full blur-[110px]" />
            </div>

            <div className="relative z-10 max-w-5xl w-full mx-auto space-y-7">
                {/* 顶部 Header 与标题区域 */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-4">
                    <div className="flex items-center gap-3">
                        <Link href="/dashboard">
                            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground rounded-full px-3.5 bg-muted/30">
                                <ArrowLeft className="h-4 w-4" />
                                返回仪表盘
                            </Button>
                        </Link>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground bg-white/40 dark:bg-card/40 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-border/40">
                        <Sparkles className="h-3.5 w-3.5 text-primary" />
                        <span>研学者互动实训营 · 沉浸式宽幅向导</span>
                    </div>
                </div>

                {/* 顶部欢迎大标题 */}
                <div className="text-center space-y-2">
                    <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-gradient-to-br from-primary to-violet-600 shadow-lg shadow-primary/25 text-white mb-1">
                        <GraduationCap className="h-6 w-6" />
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                        Scholarly 学术社区{" "}
                        <span className="bg-gradient-to-r from-primary via-violet-600 to-indigo-600 bg-clip-text text-transparent">
                            全真实操训练营
                        </span>
                    </h1>
                    <p className="text-xs sm:text-sm text-muted-foreground max-w-lg mx-auto">
                        采用 1:1 真实业务组件打造的交互沙盒，带您轻松掌握学术写作、出版排版、竞技决斗、私聊时效与 AI 审校
                    </p>
                </div>

                {/* 6 步进度指示器 */}
                <div className="pt-1">
                    <TutorialStepIndicator
                        currentStep={currentStep}
                        onStepClick={(step) => setCurrentStep(step)}
                    />
                </div>

                {/* 中央主步进容器 (Framer Motion 平滑过渡) */}
                <div className="pt-2">
                    <AnimatePresence mode="wait">
                        {currentStep === 1 && (
                            <motion.div
                                key="step-1"
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -15 }}
                                transition={{ duration: 0.35, ease: "easeInOut" }}
                            >
                                <Step1EditorTour onNext={() => setCurrentStep(2)} />
                            </motion.div>
                        )}

                        {currentStep === 2 && (
                            <motion.div
                                key="step-2"
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -15 }}
                                transition={{ duration: 0.35, ease: "easeInOut" }}
                            >
                                <Step2PublicationTour
                                    onPrev={() => setCurrentStep(1)}
                                    onNext={() => setCurrentStep(3)}
                                />
                            </motion.div>
                        )}

                        {currentStep === 3 && (
                            <motion.div
                                key="step-3"
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -15 }}
                                transition={{ duration: 0.35, ease: "easeInOut" }}
                            >
                                <Step3DuelTour
                                    onPrev={() => setCurrentStep(2)}
                                    onNext={() => setCurrentStep(4)}
                                />
                            </motion.div>
                        )}

                        {currentStep === 4 && (
                            <motion.div
                                key="step-4"
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -15 }}
                                transition={{ duration: 0.35, ease: "easeInOut" }}
                            >
                                <Step4MessagesTour
                                    onPrev={() => setCurrentStep(3)}
                                    onNext={() => setCurrentStep(5)}
                                />
                            </motion.div>
                        )}

                        {currentStep === 5 && (
                            <motion.div
                                key="step-5"
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -15 }}
                                transition={{ duration: 0.35, ease: "easeInOut" }}
                            >
                                <Step5CreditsTour
                                    onPrev={() => setCurrentStep(4)}
                                    onNext={() => setCurrentStep(6)}
                                />
                            </motion.div>
                        )}

                        {currentStep === 6 && (
                            <motion.div
                                key="step-6"
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -15 }}
                                transition={{ duration: 0.35, ease: "easeInOut" }}
                            >
                                <Step6AiReviewTour onPrev={() => setCurrentStep(5)} />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* 底部版权与公约快捷入口 */}
            <footer className="relative z-10 text-center py-6 text-xs text-muted-foreground/70">
                <div className="flex items-center justify-center gap-3">
                    <Link href="/rules?tab=terms" className="hover:text-primary transition-colors">
                        用户服务协议
                    </Link>
                    <span>•</span>
                    <Link href="/rules?tab=guidelines" className="hover:text-primary transition-colors">
                        社区行为公约
                    </Link>
                    <span>•</span>
                    <span>Scholarly Academic Community</span>
                </div>
            </footer>
        </div>
    );
}
