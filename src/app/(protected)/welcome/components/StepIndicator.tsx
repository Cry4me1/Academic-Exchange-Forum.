"use client";

import { Check, ShieldCheck, UserCheck, Palette } from "lucide-react";
import { cn } from "@/lib/utils";

interface StepIndicatorProps {
    currentStep: number;
    totalSteps?: number;
}

const steps = [
    {
        number: 1,
        title: "社区公约",
        subtitle: "合规与自律协议",
        icon: ShieldCheck,
    },
    {
        number: 2,
        title: "学者档案",
        subtitle: "基本信息快速设定",
        icon: UserCheck,
    },
    {
        number: 3,
        title: "主页主题",
        subtitle: "沉浸式空间定制",
        icon: Palette,
    },
];

export function StepIndicator({ currentStep }: StepIndicatorProps) {
    return (
        <div className="w-full max-w-2xl mx-auto px-4 py-4">
            <div className="relative flex items-center justify-between">
                {/* 背景连接线 */}
                <div className="absolute top-1/2 left-0 right-0 h-0.5 -translate-y-1/2 bg-border/60 -z-0" />
                
                {/* 进度激活线 */}
                <div 
                    className="absolute top-1/2 left-0 h-0.5 -translate-y-1/2 bg-gradient-to-r from-primary to-violet-500 transition-all duration-500 ease-out -z-0"
                    style={{
                        width: currentStep === 1 ? "0%" : currentStep === 2 ? "50%" : "100%",
                    }}
                />

                {steps.map((step) => {
                    const isCompleted = currentStep > step.number;
                    const isCurrent = currentStep === step.number;
                    const Icon = step.icon;

                    return (
                        <div key={step.number} className="relative z-10 flex flex-col items-center group">
                            {/* 步骤圆圈 */}
                            <div
                                className={cn(
                                    "flex h-11 w-11 items-center justify-center rounded-full border-2 transition-all duration-300 shadow-sm",
                                    isCompleted
                                        ? "bg-primary border-primary text-primary-foreground scale-100 shadow-primary/25"
                                        : isCurrent
                                        ? "bg-background border-primary text-primary ring-4 ring-primary/20 scale-110 shadow-md shadow-primary/15"
                                        : "bg-muted/80 border-border text-muted-foreground"
                                )}
                            >
                                {isCompleted ? (
                                    <Check className="h-5 w-5 stroke-[2.5]" />
                                ) : (
                                    <Icon className={cn("h-5 w-5", isCurrent ? "text-primary animate-pulse" : "text-muted-foreground")} />
                                )}
                            </div>

                            {/* 步骤文本 */}
                            <div className="mt-2 text-center select-none">
                                <p
                                    className={cn(
                                        "text-xs font-semibold tracking-tight transition-colors duration-200",
                                        isCurrent
                                            ? "text-primary font-bold"
                                            : isCompleted
                                            ? "text-foreground"
                                            : "text-muted-foreground"
                                    )}
                                >
                                    {step.title}
                                </p>
                                <p className="text-[10px] text-muted-foreground hidden sm:block">
                                    {step.subtitle}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
