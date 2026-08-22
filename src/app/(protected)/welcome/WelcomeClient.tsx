"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { StepIndicator } from "./components/StepIndicator";
import { Step1Guidelines } from "./steps/Step1Guidelines";
import { Step2ProfileQuickStart, ProfileFormData } from "./steps/Step2ProfileQuickStart";
import { Step3ThemeStudio } from "./steps/Step3ThemeStudio";
import { GraduationCap } from "lucide-react";

interface WelcomeClientProps {
    userId: string;
    email: string;
    initialData: {
        username: string;
        avatar_url: string;
        gender: string;
        country: string;
        language: string;
        timezone: string;
        bio: string;
        banner_style: string;
        onboarding_completed: boolean;
        terms_accepted_at: string | null;
        onboarding_step: number;
    };
}

export function WelcomeClient({ userId, email, initialData }: WelcomeClientProps) {
    // 初始步骤决策：若已签公约且未完成全部，进入 Step 2，否则进入 Step 1
    const initialStepNumber = initialData.terms_accepted_at ? Math.min(Math.max(initialData.onboarding_step, 2), 3) : 1;
    const [step, setStep] = useState<number>(initialStepNumber);

    // 暂存用户设置的档案数据
    const [profileData, setProfileData] = useState<ProfileFormData>({
        username: initialData.username || (email ? email.split("@")[0] : ""),
        avatar_url: initialData.avatar_url || "",
        gender: initialData.gender || "",
        country: initialData.country || "中国",
        language: initialData.language || "zh",
        timezone: initialData.timezone || "Asia/Shanghai",
        bio: initialData.bio || "",
    });

    const [bannerStyle, setBannerStyle] = useState<string>(
        initialData.banner_style || "default"
    );

    // 步骤1完成 -> 步骤2
    const handleStep1Complete = () => {
        setStep(2);
    };

    // 步骤2完成 -> 步骤3
    const handleStep2Complete = (data: ProfileFormData) => {
        setProfileData(data);
        setStep(3);
    };

    // 回退到步骤1
    const handleBackToStep1 = () => {
        setStep(1);
    };

    // 回退到步骤2
    const handleBackToStep2 = () => {
        setStep(2);
    };

    // 如果处于步骤 3：直接渲染全屏沉浸式干净主页与悬浮窗
    if (step === 3) {
        return (
            <Step3ThemeStudio
                userId={userId}
                profileData={profileData}
                initialTheme={bannerStyle}
                onPrev={handleBackToStep2}
            />
        );
    }

    return (
        <div className="min-h-screen bg-background relative overflow-hidden flex flex-col justify-between py-8 px-4 sm:px-6">
            {/* 柔和科技感背景光晕 */}
            <div className="absolute inset-0 pointer-events-none -z-0">
                <div className="absolute top-[-15%] left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-gradient-to-b from-primary/15 via-violet-500/10 to-transparent rounded-full blur-[110px]" />
                <div className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] bg-primary/10 rounded-full blur-[100px]" />
            </div>

            <div className="relative z-10 max-w-4xl w-full mx-auto space-y-6">
                {/* 顶部 Brand 徽标与 Welcome 标题 */}
                <div className="text-center space-y-2 pt-2">
                    <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-gradient-to-br from-primary to-violet-600 shadow-lg shadow-primary/25 text-white mb-2">
                        <GraduationCap className="h-6 w-6" />
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                        欢迎入驻{" "}
                        <span className="bg-gradient-to-r from-primary via-violet-600 to-indigo-600 bg-clip-text text-transparent">
                            Scholarly
                        </span>
                    </h1>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                        面向全球学者的专业研讨、同行评议与学术共识社区
                    </p>
                </div>

                {/* 步骤指示条 */}
                <StepIndicator currentStep={step} />

                {/* 步骤内容切换区域 */}
                <div className="pt-2">
                    <AnimatePresence mode="wait">
                        {step === 1 && (
                            <motion.div
                                key="step-1"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                            >
                                <Step1Guidelines onNext={handleStep1Complete} />
                            </motion.div>
                        )}

                        {step === 2 && (
                            <motion.div
                                key="step-2"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                            >
                                <Step2ProfileQuickStart
                                    userId={userId}
                                    initialData={profileData}
                                    onPrev={handleBackToStep1}
                                    onNext={handleStep2Complete}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* 页面极简底栏 */}
            <div className="relative z-10 text-center py-4 text-xs text-muted-foreground/70">
                Scholarly Academic Community · 学术自由 · 理性质疑 · 互信共进
            </div>
        </div>
    );
}
