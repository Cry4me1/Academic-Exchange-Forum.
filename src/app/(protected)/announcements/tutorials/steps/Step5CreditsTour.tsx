"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
    Coins,
    Crown,
    Code2,
    Sparkles,
    ArrowLeft,
    ArrowRight,
    Zap,
    Trophy,
} from "lucide-react";
import { TutorialTaskChecklist, TaskItem } from "@/components/tutorials/TutorialTaskChecklist";

interface Step5CreditsTourProps {
    onPrev: () => void;
    onNext: () => void;
}

const initialTasks: TaskItem[] = [
    {
        id: "gain-credits",
        title: "1. 体验学术积分 (Credits) 收益流转",
        description: "点击‘+ 模拟获取积分’按钮，体验发布高质量论文、被同行点赞带来的积分收益。",
        isCompleted: false,
    },
    {
        id: "vip-badges",
        title: "2. 查看 VIP 会员特权与开发者金标",
        description: "点击‘切换学者特权与勋章’，直观查看名片上佩戴 VIP 皇冠与系统开发者高光徽章效果。",
        isCompleted: false,
    },
];

export function Step5CreditsTour({ onPrev, onNext }: Step5CreditsTourProps) {
    const [tasks, setTasks] = useState<TaskItem[]>(initialTasks);
    const [balance, setBalance] = useState(240);
    const [recentLog, setRecentLog] = useState<string | null>(null);
    const [showDevBadge, setShowDevBadge] = useState(true);
    const [vipLevel, setVipLevel] = useState(2);

    const markTaskDone = (id: string) => {
        setTasks((prev) =>
            prev.map((t) => (t.id === id ? { ...t, isCompleted: true } : t))
        );
    };

    const handleSimulateGain = () => {
        setBalance((prev) => prev + 100);
        setRecentLog("+100 Credits (发布高质量学术论文获同行点赞与收藏)");
        markTaskDone("gain-credits");
    };

    const handleToggleBadges = () => {
        setShowDevBadge(!showDevBadge);
        setVipLevel(vipLevel === 1 ? 2 : 1);
        markTaskDone("vip-badges");
    };

    return (
        <div className="space-y-6">
            {/* 顶栏实操任务清单卡片 */}
            <TutorialTaskChecklist
                tasks={tasks}
                stepTitle="Step 5 · 掌握积分生态与学者荣誉特权"
                stepBadge="2 大实操子任务"
                hintText="学术积分可用于决斗质押（LP）、Token 换算与解锁高级学术空间特权。"
            />

            {/* 宽幅卡片 */}
            <div className="rounded-3xl border border-border/80 bg-card/85 backdrop-blur-2xl shadow-xl p-5 sm:p-7 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/50 pb-3">
                    <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
                            <Coins className="h-4 w-4" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-foreground">
                                学术积分与特权体系 (Credits & Perks)
                            </h3>
                            <p className="text-xs text-muted-foreground">
                                积分获取/流转生态、VIP 会员特权与学者声望勋章
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 px-3.5 py-1.5 rounded-full text-xs font-mono font-bold text-amber-600">
                        <Coins className="h-4 w-4" />
                        <span>当前模拟余额：{balance} Credits</span>
                    </div>
                </div>

                {/* 积分流转卡片 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-5 rounded-2xl border border-border/60 bg-muted/20 space-y-3">
                        <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                                <Zap className="h-4 w-4 text-amber-500" />
                                积分获取与消耗规则
                            </h4>
                            <Button
                                size="sm"
                                onClick={handleSimulateGain}
                                className="h-7 text-xs bg-amber-600 hover:bg-amber-700 text-white rounded-lg gap-1"
                            >
                                + 模拟获取积分
                            </Button>
                        </div>
                        <ul className="text-xs text-muted-foreground space-y-1.5 list-disc list-inside">
                            <li>发布原创学术长文：获得系统初始积分激励</li>
                            <li>获得同行学者点赞与收藏：获得持续学术分润</li>
                            <li>学术决斗获胜：瓜分对手质押积分池与声望分</li>
                        </ul>
                        {recentLog && (
                            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs font-semibold text-emerald-600 animate-in fade-in">
                                ✓ {recentLog}
                            </div>
                        )}
                    </div>

                    {/* 学者勋章与特权名片 */}
                    <div className="p-5 rounded-2xl border border-border/60 bg-muted/20 space-y-3">
                        <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                                <Crown className="h-4 w-4 text-amber-500" />
                                学者荣誉勋章展示
                            </h4>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={handleToggleBadges}
                                className="h-7 text-xs bg-background rounded-lg gap-1"
                            >
                                <Sparkles className="h-3 w-3 text-amber-500" />
                                切换勋章与 VIP
                            </Button>
                        </div>

                        {/* 名片微缩展示 */}
                        <div className="p-3.5 rounded-xl bg-background border border-border/60 flex items-center gap-3">
                            <Avatar className="h-12 w-12 border-2 border-primary/40 shadow-sm shrink-0">
                                <AvatarFallback className="text-lg font-bold bg-primary/20 text-primary">S</AvatarFallback>
                            </Avatar>
                            <div className="space-y-1 min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-xs font-bold text-foreground">Scholarly 研学者</span>
                                    {showDevBadge && (
                                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 text-white text-[9px] font-bold shadow-xs">
                                            <Code2 className="h-2.5 w-2.5" />
                                            系统开发者
                                        </div>
                                    )}
                                    <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 text-[9px] gap-1">
                                        <Crown className="h-2.5 w-2.5 text-amber-500" />
                                        VIP {vipLevel} 学术会员
                                    </Badge>
                                </div>
                                <p className="text-[11px] text-muted-foreground truncate">
                                    分布式一致性与量子拓扑 · 欢迎同行私信交流
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 底部导航操作条 */}
            <div className="flex items-center justify-between pt-2">
                <Button
                    variant="ghost"
                    size="lg"
                    onClick={onPrev}
                    className="h-11 px-5 rounded-2xl text-muted-foreground hover:text-foreground gap-2 cursor-pointer"
                >
                    <ArrowLeft className="h-4 w-4" />
                    上一步：私信与数据时效
                </Button>

                <Button
                    size="lg"
                    onClick={onNext}
                    className="h-11 px-6 rounded-2xl bg-gradient-to-r from-primary to-violet-600 text-white font-bold shadow-lg shadow-primary/25 gap-2 hover:opacity-95 cursor-pointer"
                >
                    下一步：AI 同行评审审稿
                    <ArrowRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
