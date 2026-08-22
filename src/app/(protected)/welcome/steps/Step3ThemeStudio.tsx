"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { bannerGradients } from "@/components/profile/banner-selector";
import { completeOnboarding } from "@/actions/onboarding";
import { ProfileFormData } from "./Step2ProfileQuickStart";
import confetti from "canvas-confetti";
import {
    ArrowLeft,
    Check,
    Loader2,
    Palette,
    Rocket,
    Sparkles,
    Globe,
    Layers,
    PartyPopper,
    GraduationCap,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface Step3ThemeStudioProps {
    userId: string;
    profileData: ProfileFormData;
    initialTheme?: string;
    onPrev: () => void;
}

export function Step3ThemeStudio({
    userId,
    profileData,
    initialTheme = "default",
    onPrev,
}: Step3ThemeStudioProps) {
    const [selectedTheme, setSelectedTheme] = useState(initialTheme);
    const [submitting, setSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const router = useRouter();

    const currentGradientObj =
        bannerGradients.find((g) => g.id === selectedTheme) || bannerGradients[0];

    // 触发盛大多重烟花秀 (Fireworks Fireworks Cascade)
    const triggerGrandFireworks = () => {
        // 1. 中央超大礼炮星爆
        const count = 250;
        const defaults = {
            origin: { y: 0.65 },
            zIndex: 9999,
        };

        function fire(particleRatio: number, opts: confetti.Options) {
            confetti({
                ...defaults,
                ...opts,
                particleCount: Math.floor(count * particleRatio),
            });
        }

        fire(0.25, { spread: 35, startVelocity: 65 });
        fire(0.2, { spread: 70 });
        fire(0.35, { spread: 120, decay: 0.92, scalar: 1.1 });
        fire(0.1, { spread: 140, startVelocity: 30, decay: 0.94, scalar: 1.3 });
        fire(0.1, { spread: 160, startVelocity: 55 });

        // 2. 双侧礼炮连续对冲喷射 (持续 2.2 秒)
        const duration = 2200;
        const animationEnd = Date.now() + duration;

        const interval: any = setInterval(function () {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = 45 * (timeLeft / duration);

            // 左下角对角抛射
            confetti({
                particleCount,
                angle: 60,
                spread: 55,
                origin: { x: 0, y: 0.8 },
                colors: ["#6366f1", "#a855f7", "#ec4899", "#3b82f6", "#eab308"],
                zIndex: 9999,
            });
            // 右下角对角抛射
            confetti({
                particleCount,
                angle: 120,
                spread: 55,
                origin: { x: 1, y: 0.8 },
                colors: ["#6366f1", "#a855f7", "#ec4899", "#3b82f6", "#eab308"],
                zIndex: 9999,
            });
        }, 180);
    };

    // 提交完成全部入驻设置
    const handleFinish = async () => {
        setSubmitting(true);
        try {
            const res = await completeOnboarding({
                username: profileData.username,
                avatar_url: profileData.avatar_url,
                gender: profileData.gender,
                country: profileData.country,
                language: profileData.language,
                timezone: profileData.timezone,
                bio: profileData.bio,
                banner_style: selectedTheme,
            });

            if (!res.success) {
                toast.error(res.error || "保存失败，请重试");
                setSubmitting(false);
                return;
            }

            // 标记成功态并触发盛大烟花
            setIsSuccess(true);
            triggerGrandFireworks();
            toast.success("欢迎加入 Scholarly！入驻配置全部完成 🎉");

            // 预留 1.8 秒让用户沉浸式享受烟花盛宴与祝贺卡片，随后平滑重定向
            setTimeout(() => {
                router.push("/dashboard");
                router.refresh();
            }, 1800);
        } catch (error: any) {
            console.error("完成入驻出错:", error);
            toast.error("网络异常，请稍后重试");
            setSubmitting(false);
        }
    };

    const initials = (profileData.username || "U").charAt(0).toUpperCase();

    return (
        <div
            className={`fixed inset-0 w-full h-full ${currentGradientObj.class} transition-colors duration-700 ease-in-out overflow-y-auto overflow-x-hidden`}
        >
            {/* 全局背景氛围高斯光斑 (高保真还原主页) */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden -z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[45%] h-[45%] bg-white/30 dark:bg-white/10 rounded-full blur-[120px] transition-all duration-700" />
                <div className="absolute top-[25%] right-[-10%] w-[35%] h-[35%] bg-primary/15 rounded-full blur-[100px] transition-all duration-700" />
                <div className="absolute bottom-[-10%] left-[25%] w-[40%] h-[40%] bg-white/20 dark:bg-white/5 rounded-full blur-[100px] transition-all duration-700" />
            </div>

            {/* 顶栏：类似干净个人主页的最顶端一栏 */}
            <div className="relative z-30 max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
                {/* 返回按钮 */}
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={submitting || isSuccess}
                    onClick={onPrev}
                    className="inline-flex items-center gap-2 text-sm font-medium text-foreground/80 hover:text-foreground bg-white/40 hover:bg-white/60 dark:bg-black/20 dark:hover:bg-black/40 backdrop-blur-md px-4 py-2 rounded-full transition-all shadow-sm hover:shadow"
                >
                    <ArrowLeft className="h-4 w-4" />
                    返回学者资料
                </Button>

                {/* 顶部中央或右侧提示 */}
                <div className="inline-flex items-center gap-2 bg-white/40 dark:bg-black/20 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/30 text-xs font-semibold text-foreground/80 shadow-sm">
                    <Sparkles className="h-3.5 w-3.5 text-primary animate-pulse" />
                    步骤 3/3 · 沉浸式主页主题配置
                </div>
            </div>

            {/* 中间核心悬浮窗口：悬浮选择舱 */}
            <div className="relative z-20 flex items-center justify-center min-h-[calc(100vh-100px)] p-4 sm:p-6 pb-12">
                <AnimatePresence mode="wait">
                    {isSuccess ? (
                        /* 成功完成态卡片 */
                        <motion.div
                            key="success-card"
                            initial={{ opacity: 0, scale: 0.85, y: 30 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                            className="w-full max-w-lg bg-white/90 dark:bg-card/95 backdrop-blur-2xl border border-primary/30 shadow-2xl shadow-primary/20 rounded-3xl p-8 text-center space-y-6"
                        >
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.2, type: "spring", damping: 12 }}
                                className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-primary via-violet-600 to-indigo-600 shadow-xl shadow-primary/30 text-white"
                            >
                                <PartyPopper className="h-10 w-10 animate-bounce" />
                            </motion.div>

                            <div className="space-y-2">
                                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-primary via-violet-600 to-pink-600 bg-clip-text text-transparent">
                                    欢迎加入 Scholarly！
                                </h2>
                                <p className="text-sm text-muted-foreground">
                                    学者档案与空间主题已全部配置完成，正在前往学术仪表盘...
                                </p>
                            </div>

                            <div className="p-4 rounded-2xl bg-muted/40 border border-border/50 flex items-center gap-4 text-left">
                                <Avatar className="h-12 w-12 border-2 border-primary/40 shadow-sm shrink-0">
                                    <AvatarImage src={profileData.avatar_url} alt="头像" />
                                    <AvatarFallback className="font-bold bg-primary/20 text-primary">
                                        {initials}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0 flex-1">
                                    <h4 className="text-sm font-bold text-foreground truncate">
                                        {profileData.username || "认证学者"}
                                    </h4>
                                    <p className="text-xs text-muted-foreground">
                                        主题空间：{currentGradientObj.name}
                                    </p>
                                </div>
                                <Sparkles className="h-5 w-5 text-amber-500 animate-spin" />
                            </div>
                        </motion.div>
                    ) : (
                        /* 主题选择与设置舱 */
                        <motion.div
                            key="theme-studio-card"
                            initial={{ opacity: 0, scale: 0.94, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                            className="w-full max-w-2xl bg-white/85 dark:bg-card/90 backdrop-blur-2xl border border-white/50 dark:border-border/60 shadow-2xl rounded-3xl p-6 sm:p-8 space-y-6"
                        >
                            {/* 悬浮舱标题 */}
                            <div className="text-center space-y-2">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                                    <Palette className="h-3.5 w-3.5" />
                                    空间氛围色系
                                </div>
                                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                                    选择您的个人主页背景主题
                                </h2>
                                <p className="text-xs sm:text-sm text-muted-foreground">
                                    点击不同色卡，整个空间背景将随之渐渐变幻，为您呈现专属的学者殿堂
                                </p>
                            </div>

                            {/* 6 大主题色卡选择网格 */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {bannerGradients.map((gradient) => {
                                    const isSelected = selectedTheme === gradient.id;

                                    return (
                                        <motion.button
                                            key={gradient.id}
                                            type="button"
                                            whileHover={{ scale: 1.03 }}
                                            whileTap={{ scale: 0.97 }}
                                            onClick={() => setSelectedTheme(gradient.id)}
                                            className={`relative h-24 rounded-2xl p-3 flex flex-col justify-between overflow-hidden border-2 text-left transition-all duration-300 shadow-sm ${
                                                isSelected
                                                    ? "border-primary ring-4 ring-primary/25 shadow-lg shadow-primary/20 scale-[1.02]"
                                                    : "border-border/50 hover:border-primary/40 opacity-80 hover:opacity-100"
                                            } ${gradient.preview}`}
                                        >
                                            {/* 选中 Checkmark 动效 */}
                                            <div className="flex items-center justify-between w-full">
                                                <span className="text-xs font-bold text-foreground/90 bg-white/70 dark:bg-black/40 backdrop-blur-md px-2 py-0.5 rounded-md shadow-xs">
                                                    {gradient.name}
                                                </span>

                                                <AnimatePresence>
                                                    {isSelected && (
                                                        <motion.div
                                                            initial={{ scale: 0, opacity: 0 }}
                                                            animate={{ scale: 1, opacity: 1 }}
                                                            exit={{ scale: 0, opacity: 0 }}
                                                            className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md"
                                                        >
                                                            <Check className="h-3.5 w-3.5 stroke-[3]" />
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>

                                            {/* 色彩说明 */}
                                            <div className="text-[10px] text-muted-foreground/80 font-medium bg-white/40 dark:bg-black/20 backdrop-blur-[2px] px-1.5 py-0.5 rounded w-fit">
                                                {isSelected ? "当前所选" : "点击预览"}
                                            </div>
                                        </motion.button>
                                    );
                                })}
                            </div>

                            {/* 实时学者主页卡片微缩预览 (Live Profile Preview Card) */}
                            <div className="pt-2">
                                <div className="flex items-center justify-between text-xs text-muted-foreground mb-2 px-1">
                                    <span className="flex items-center gap-1.5 font-medium">
                                        <Layers className="h-3.5 w-3.5 text-primary" />
                                        主题效果实时预览卡片
                                    </span>
                                    <span className="text-[11px] text-primary font-semibold">
                                        当前主题：{currentGradientObj.name}
                                    </span>
                                </div>

                                <div className="rounded-2xl border border-border/50 bg-background/80 dark:bg-background/60 p-4 shadow-sm backdrop-blur-sm transition-all duration-300">
                                    <div className="flex items-start gap-4">
                                        <Avatar className="h-14 w-14 border-2 border-background shadow-md shrink-0">
                                            <AvatarImage src={profileData.avatar_url} alt="头像" />
                                            <AvatarFallback className="text-xl font-bold bg-primary/20 text-primary">
                                                {initials}
                                            </AvatarFallback>
                                        </Avatar>

                                        <div className="space-y-1 flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h4 className="text-base font-bold text-foreground truncate">
                                                    {profileData.username || "学者用户"}
                                                </h4>
                                                {profileData.country && (
                                                    <Badge variant="outline" className="text-[10px] py-0 px-2 gap-1 border-border/60">
                                                        <Globe className="h-2.5 w-2.5" />
                                                        {profileData.country}
                                                    </Badge>
                                                )}
                                            </div>
                                            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                                                {profileData.bio || "该学者尚未填写个人学术简介..."}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 最终提交启动按钮 */}
                            <div className="pt-2">
                                <Button
                                    size="lg"
                                    disabled={submitting}
                                    onClick={handleFinish}
                                    className="w-full h-13 text-base font-bold rounded-2xl bg-gradient-to-r from-primary via-violet-600 to-primary bg-[length:200%_auto] hover:bg-right transition-all duration-500 text-white shadow-xl shadow-primary/30 group cursor-pointer"
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                                            正在配置您的专属空间...
                                        </>
                                    ) : (
                                        <>
                                            <Rocket className="h-5 w-5 mr-2 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" />
                                            完成设置，开启 Scholarly 之旅
                                        </>
                                    )}
                                </Button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
