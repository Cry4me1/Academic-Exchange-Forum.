"use client";

import { useState, useEffect } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
    Swords,
    Send,
    BookOpen,
    Eye,
    EyeOff,
    ShieldAlert,
    Coins,
    ArrowLeft,
    ArrowRight,
    Brain,
    Flame,
} from "lucide-react";
import { ReputationBadge } from "@/components/duel/ReputationBadge";
import { DuelScoreCard } from "@/components/duel/DuelScoreCard";
import { SpectatorBadge } from "@/components/duel/SpectatorBadge";
import { DanmakuOverlay, DanmakuMessage } from "@/components/duel/DanmakuOverlay";
import { toast } from "sonner";
import { TutorialTaskChecklist, TaskItem } from "@/components/tutorials/TutorialTaskChecklist";

interface Step3DuelTourProps {
    onPrev: () => void;
    onNext: () => void;
}

const initialTasks: TaskItem[] = [
    {
        id: "task-bet",
        title: "1. 体验观战学术投注 (LP 下注)",
        description: "在下方观战投注面板选择支持‘正方 (测试1)’或‘反方 (测试2)’，输入 LP 积分并确认下注体验赔率联动。",
        isCompleted: false,
    },
    {
        id: "task-danmaku",
        title: "2. 发送一条实时学术观战弹幕",
        description: "在弹幕输入框中输入您的学术见解，点击发送体验 4 轨道实时弹幕飘过与同行互动。",
        isCompleted: false,
    },
    {
        id: "task-inspect-round",
        title: "3. 查阅真实辩论回合与 AI 裁判评分",
        description: "阅读第 1 回合正反双方关于 k=7 最优停止策略与爱情不可逆性的交锋，以及 AI 裁判评分卡。",
        isCompleted: false,
    },
];

// 与真实辩题高度契合的学术观战弹幕池
const mockPresetDanmakus: string[] = [
    "数学推导太严谨了，k=7 确实是 20 个样本下的全局最优！",
    "反方说得好，爱情怎么能被算力对冲？",
    "不可逆性与主体性直击要害，正方怎么回应？",
    "前 7 个人只看不选，如果初恋就是真爱不就悲剧了？",
    "苏格拉底麦田困境在概率论下有唯一解！",
    "支持正方！算力是战胜选择焦虑的唯一武器",
    "反方角度很刁钻，期待第 2 回合正方的反驳！",
];

export function Step3DuelTour({ onPrev, onNext }: Step3DuelTourProps) {
    const [tasks, setTasks] = useState<TaskItem[]>(initialTasks);
    const [danmakuVisible, setDanmakuVisible] = useState(true);
    const [danmakuInput, setDanmakuInput] = useState("");
    const [latestDanmaku, setLatestDanmaku] = useState<DanmakuMessage | null>(null);

    // 下注状态
    const [betSide, setBetSide] = useState<"challenger" | "opponent" | null>(null);
    const [betAmount, setBetAmount] = useState("50");
    const [hasBet, setHasBet] = useState(false);
    const [userReputation, setUserReputation] = useState(1500);

    // 真实数据库比分 (未结束第 1 轮得分)
    const challengerScore = 10;
    const opponentScore = 6;
    const challengerLp = 100;
    const opponentLp = 100;

    const markTaskDone = (id: string) => {
        setTasks((prev) =>
            prev.map((t) => (t.id === id ? { ...t, isCompleted: true } : t))
        );
    };

    // 弹幕自动随机定时飘过 (模拟真实观战热度)
    useEffect(() => {
        const interval = setInterval(() => {
            if (!danmakuVisible) return;
            const randomText = mockPresetDanmakus[Math.floor(Math.random() * mockPresetDanmakus.length)];
            const randomRole = Math.random() > 0.5 ? "challenger" : Math.random() > 0.3 ? "opponent" : "spectator";

            setLatestDanmaku({
                id: `danmaku-${Date.now()}-${Math.random()}`,
                text: randomText,
                userId: "spectator-bot",
                username: randomRole === "challenger" ? "概率论研究员" : randomRole === "opponent" ? "哲学系学者" : "围观学者",
                positionColor: randomRole as any,
            });
        }, 3200);

        return () => clearInterval(interval);
    }, [danmakuVisible]);

    // 发送弹幕
    const handleSendDanmaku = () => {
        if (!danmakuInput.trim()) return;

        const myDanmaku: DanmakuMessage = {
            id: `danmaku-me-${Date.now()}`,
            text: danmakuInput.trim(),
            userId: "me",
            username: "我 (研学者)",
            positionColor: betSide === "challenger" ? "challenger" : betSide === "opponent" ? "opponent" : "spectator",
        };

        setLatestDanmaku(myDanmaku);
        setDanmakuInput("");
        markTaskDone("task-danmaku");
        toast.success("弹幕已实时发送至决斗竞技场");
    };

    // 观战下注
    const handleConfirmBet = () => {
        if (!betSide) {
            toast.error("请选择要支持的辩论选手");
            return;
        }
        const amt = parseInt(betAmount, 10);
        if (isNaN(amt) || amt <= 0) {
            toast.error("请输入有效的下注金额");
            return;
        }

        setHasBet(true);
        setUserReputation((prev) => prev - amt);
        markTaskDone("task-bet");
        toast.success(`下注成功！已质押 ${amt} LP 支持${betSide === "challenger" ? "正方 (测试1 · 算力派)" : "反方 (测试2 · 浪漫派)"}！`);
    };

    const mockSpectators = [
        { username: "李院士", avatar_url: "" },
        { username: "张教授", avatar_url: "" },
        { username: "王研究员", avatar_url: "" },
        { username: "概率探索者", avatar_url: "" },
    ];

    const handleTaskClick = (taskId: string) => {
        markTaskDone(taskId);
        if (taskId === "task-bet") {
            toast.success("✓ 已掌握观战下注功能！");
        } else if (taskId === "task-danmaku") {
            toast.success("✓ 已掌握学术弹幕互动！");
        } else if (taskId === "task-inspect-round") {
            toast.success("✓ 已查阅真实辩论与 AI 裁判评分！");
        }
    };

    return (
        <div className="space-y-6">
            {/* 顶栏实操任务清单卡片 */}
            <TutorialTaskChecklist
                tasks={tasks}
                onTaskClick={handleTaskClick}
                stepTitle="Step 3 · 真实学术决斗场竞技全景 (Duel Arena)"
                stepBadge="3 大实操子任务"
                hintText="本页面直接整合真实决斗 #d0552765 数据，保留第 1 回合实录，第 2 回合进行中未结束。"
            />

            {/* 决斗竞技场 1:1 全景容器 */}
            <div className="rounded-3xl border border-border/80 bg-card/90 backdrop-blur-2xl shadow-xl overflow-hidden relative">
                {/* 顶栏：辩题与观战状态栏 */}
                <div className="px-5 sm:px-7 py-4 border-b border-border/50 bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <Badge className="bg-green-500/10 text-green-600 border-green-500/30 gap-1.5 text-xs py-1">
                            <span className="animate-pulse">●</span>
                            <span>进行中 · 第 2/3 回合 (激战中)</span>
                        </Badge>
                        <SpectatorBadge spectators={mockSpectators} />
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDanmakuVisible(!danmakuVisible)}
                            className="h-8 text-xs gap-1.5 rounded-xl bg-background"
                        >
                            {danmakuVisible ? <Eye className="h-3.5 w-3.5 text-primary" /> : <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />}
                            <span>{danmakuVisible ? "弹幕已开启" : "弹幕已屏蔽"}</span>
                        </Button>
                    </div>
                </div>

                {/* 核心对战区域 (挂载弹幕覆盖层) */}
                <div className="p-5 sm:p-7 space-y-6 relative overflow-hidden">
                    {/* 实时弹幕层 */}
                    <div className="relative min-h-[140px] pointer-events-none">
                        <DanmakuOverlay newDanmaku={latestDanmaku} visible={danmakuVisible} />

                        {/* 真实辩题大标题 */}
                        <div className="text-center space-y-1.5 max-w-2xl mx-auto pt-2">
                            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                                论题 #d0552765-f363-4cb7-aa9f-93e0f58ab534
                            </span>
                            <h2 className="text-xl sm:text-2xl font-extrabold text-foreground leading-snug">
                                北山的风吹不到南山尾
                            </h2>
                            <p className="text-xs text-muted-foreground">
                                核心争议：幸福需要算力（最优停止策略 k=7） vs 亲密关系的不可逆性与主体性
                            </p>
                        </div>
                    </div>

                    {/* VS 对决比分大卡片 (与 /duels/[id] 真实数据 100% 一致) */}
                    <Card className="rounded-2xl border border-border/70 bg-muted/15 shadow-sm overflow-hidden">
                        <CardContent className="p-5 sm:p-6">
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6">
                                {/* 正方：测试1 */}
                                <div className="flex-1 text-center space-y-2">
                                    <div className="relative inline-block">
                                        <Avatar className="h-16 w-16 sm:h-18 sm:w-18 mx-auto ring-4 ring-blue-500/30">
                                            <AvatarFallback className="bg-blue-500/10 text-blue-600 text-base font-bold">
                                                测1
                                            </AvatarFallback>
                                        </Avatar>
                                    </div>
                                    <p className="font-bold text-sm sm:text-base text-foreground">
                                        测试1
                                    </p>
                                    <Badge variant="outline" className="bg-blue-500/5 border-blue-500/30 text-blue-600 text-xs">
                                        正方：爱情需要算力
                                    </Badge>

                                    <div className="flex justify-center pt-1">
                                        <ReputationBadge score={110} wins={1} losses={0} size="sm" showStats />
                                    </div>

                                    {/* LP 进度条 */}
                                    <div className="px-4 pt-1 space-y-1">
                                        <div className="flex justify-between text-[11px] font-semibold text-muted-foreground">
                                            <span className="flex items-center gap-1"><ShieldAlert className="h-3 w-3 text-blue-500" /> 逻辑值 LP</span>
                                            <span className="text-emerald-600 font-bold">{challengerLp} / 100</span>
                                        </div>
                                        <Progress value={challengerLp} max={100} className="h-2" />
                                    </div>

                                    <p className="text-2xl sm:text-3xl font-extrabold text-blue-600 font-mono pt-1">
                                        {challengerScore} 分
                                    </p>
                                </div>

                                {/* VS 交叉双剑 */}
                                <div className="flex flex-col items-center px-4 py-2">
                                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground shadow-inner">
                                        <Swords className="h-5 w-5" />
                                    </div>
                                    <span className="text-xs font-extrabold text-muted-foreground mt-1">VS</span>
                                </div>

                                {/* 反方：测试2 */}
                                <div className="flex-1 text-center space-y-2">
                                    <div className="relative inline-block">
                                        <Avatar className="h-16 w-16 sm:h-18 sm:w-18 mx-auto ring-4 ring-red-500/30">
                                            <AvatarFallback className="bg-red-500/10 text-red-600 text-base font-bold">
                                                测2
                                            </AvatarFallback>
                                        </Avatar>
                                    </div>
                                    <p className="font-bold text-sm sm:text-base text-foreground">
                                        测试2
                                    </p>
                                    <Badge variant="outline" className="bg-red-500/5 border-red-500/30 text-red-600 text-xs">
                                        反方：反对爱情算法化
                                    </Badge>

                                    <div className="flex justify-center pt-1">
                                        <ReputationBadge score={95} wins={0} losses={1} size="sm" showStats />
                                    </div>

                                    {/* LP 进度条 */}
                                    <div className="px-4 pt-1 space-y-1">
                                        <div className="flex justify-between text-[11px] font-semibold text-muted-foreground">
                                            <span className="flex items-center gap-1"><ShieldAlert className="h-3 w-3 text-red-500" /> 逻辑值 LP</span>
                                            <span className="text-emerald-600 font-bold">{opponentLp} / 100</span>
                                        </div>
                                        <Progress value={opponentLp} max={100} className="h-2" />
                                    </div>

                                    <p className="text-2xl sm:text-3xl font-extrabold text-red-600 font-mono pt-1">
                                        {opponentScore} 分
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* 观战下注面板 (SpectatorBetPanel) */}
                    <div className="p-4 sm:p-5 rounded-2xl border border-amber-500/30 bg-amber-500/5 space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Coins className="h-4 w-4 text-amber-500" />
                                <h4 className="text-xs sm:text-sm font-bold text-foreground">
                                    观战学者下注竞猜 (LP 质押)
                                </h4>
                            </div>
                            <span className="text-xs text-muted-foreground font-mono">
                                钱包余额：<strong className="text-amber-600 font-bold">{userReputation} LP</strong>
                            </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                            {/* 选择支持方 */}
                            <div className="sm:col-span-6 grid grid-cols-2 gap-2">
                                <Button
                                    type="button"
                                    size="sm"
                                    variant={betSide === "challenger" ? "default" : "outline"}
                                    onClick={() => setBetSide("challenger")}
                                    className={`h-9 text-xs font-bold rounded-xl ${
                                        betSide === "challenger" ? "bg-blue-600 text-white" : "border-blue-500/40 text-blue-600 hover:bg-blue-500/10"
                                    }`}
                                >
                                    支持正方 (测试1 · 赔率 1.85)
                                </Button>

                                <Button
                                    type="button"
                                    size="sm"
                                    variant={betSide === "opponent" ? "default" : "outline"}
                                    onClick={() => setBetSide("opponent")}
                                    className={`h-9 text-xs font-bold rounded-xl ${
                                        betSide === "opponent" ? "bg-red-600 text-white" : "border-red-500/40 text-red-600 hover:bg-red-500/10"
                                    }`}
                                >
                                    支持反方 (测试2 · 赔率 2.10)
                                </Button>
                            </div>

                            {/* 下注金额与确认 */}
                            <div className="sm:col-span-6 flex items-center gap-2">
                                <Input
                                    type="number"
                                    value={betAmount}
                                    onChange={(e) => setBetAmount(e.target.value)}
                                    placeholder="下注 LP"
                                    className="h-9 text-xs bg-background rounded-xl w-28"
                                />
                                <Button
                                    size="sm"
                                    onClick={handleConfirmBet}
                                    className="flex-1 h-9 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs rounded-xl shadow-sm"
                                >
                                    {hasBet ? "追加下注" : "确认下注"}
                                </Button>
                            </div>
                        </div>

                        {hasBet && (
                            <p className="text-xs text-emerald-600 font-medium text-center animate-in fade-in">
                                ✓ 已成功下注！决斗结束后若您支持的一方获胜，奖池将按赔率自动派发至您的账户。
                            </p>
                        )}
                    </div>

                    {/* 实时弹幕发送控制条 */}
                    <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/60 flex items-center gap-2">
                        <Input
                            value={danmakuInput}
                            onChange={(e) => setDanmakuInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") handleSendDanmaku();
                            }}
                            placeholder="发条学术弹幕参与实时研讨互动 (如：k=7 最优停止策略分析)..."
                            className="h-9 text-xs bg-background/90 rounded-xl"
                        />
                        <Button
                            size="sm"
                            onClick={handleSendDanmaku}
                            className="h-9 px-4 rounded-xl bg-gradient-to-r from-primary to-violet-600 text-white font-bold text-xs gap-1.5 shadow-sm shrink-0"
                        >
                            <Send className="h-3.5 w-3.5" />
                            发送弹幕
                        </Button>
                    </div>

                    {/* 真实辩论记录：保留第 1 回合 (删除后续已结束回合，呈现第 2 回合进行中) */}
                    <div className="space-y-4 pt-2">
                        <div className="flex items-center justify-between border-b border-border/40 pb-2">
                            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                                <BookOpen className="h-4 w-4 text-primary" />
                                辩论记录 (第 1 回合实录 · 第 2 回合激战中)
                            </h3>
                            <Badge variant="outline" className="text-[10px] text-muted-foreground">
                                1 回合已完成 / 共 3 回合
                            </Badge>
                        </div>

                        {/* 第 1 回合：正方 测试1 真实发言 */}
                        <div
                            onClick={() => markTaskDone("task-inspect-round")}
                            className="rounded-2xl border-l-4 border-l-blue-500 border border-border/60 bg-background/70 p-4 sm:p-5 space-y-3 cursor-pointer hover:border-primary/40 transition-colors"
                        >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div className="flex items-center gap-2.5">
                                    <Avatar className="h-8 w-8 border">
                                        <AvatarFallback className="bg-blue-500/20 text-blue-600 text-xs font-bold">测1</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-foreground">测试1</span>
                                            <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/30 text-[10px]">正方 · 第 1 回合立论</Badge>
                                        </div>
                                        <span className="text-[10px] text-muted-foreground">2026-06-19 · 论据充分</span>
                                    </div>
                                </div>

                                {/* 真实 DuelScoreCard 评分卡 */}
                                <DuelScoreCard
                                    evidenceScore={5}
                                    citationScore={3}
                                    logicScore={2}
                                    fallacyPenalty={0}
                                    totalScore={10}
                                    hasFallacy={false}
                                />
                            </div>

                            <div className="text-xs text-foreground/90 leading-relaxed space-y-2">
                                <p className="font-semibold text-primary">
                                    “爱情需要心动，但幸福需要算力。我方坚决支持晓冬使用 <span className="font-mono font-bold">$k=7$</span> 的最优停止策略。”
                                </p>
                                <p>
                                    晓冬要从 <span className="font-mono">$n=20$</span> 个人中选最优伴侣。策略是在前 <span className="font-mono">$k$</span> 个观察，从 <span className="font-mono">$k+1$</span> 开始选择。选到最优伴侣的概率公式为：
                                    <span className="font-mono block my-1 p-2 rounded bg-muted/60 text-center font-bold">
                                        P(k) = (k/n) ∑ (1/i) ≈ (k/20) ln(20/k)
                                    </span>
                                    对 f(x) = (x/20) ln(20/x) 求导令其为 0，可得 x = 20/e ≈ 7.36。最优解取整数即为 <strong>k=7</strong>。苏格拉底的麦田困境本质是信息不对称下的选择焦虑，算法是把人从“盲目试错”和“终身错过”中解救出来的唯一武器！
                                </p>
                            </div>

                            <div className="p-2.5 rounded-xl bg-blue-500/5 border border-blue-500/20 text-[11px] text-blue-700 dark:text-blue-300 flex items-center gap-2">
                                <Brain className="h-3.5 w-3.5 shrink-0" />
                                <span>AI 裁判评语：数学推导严谨，结合概率论与生活比喻，紧扣原题求解，表现出色（得分：10分）。</span>
                            </div>
                        </div>

                        {/* 第 1 回合：反方 测试2 真实发言 */}
                        <div
                            onClick={() => markTaskDone("task-inspect-round")}
                            className="rounded-2xl border-r-4 border-r-red-500 border border-border/60 bg-background/70 p-4 sm:p-5 space-y-3 cursor-pointer hover:border-primary/40 transition-colors"
                        >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div className="flex items-center gap-2.5">
                                    <Avatar className="h-8 w-8 border">
                                        <AvatarFallback className="bg-red-500/20 text-red-600 text-xs font-bold">测2</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-foreground">测试2</span>
                                            <Badge className="bg-red-500/10 text-red-600 border-red-500/30 text-[10px]">反方 · 第 1 回合驳论</Badge>
                                        </div>
                                        <span className="text-[10px] text-muted-foreground">2026-06-19 · 理论反击</span>
                                    </div>
                                </div>

                                <DuelScoreCard
                                    evidenceScore={3}
                                    citationScore={1}
                                    logicScore={2}
                                    fallacyPenalty={0}
                                    totalScore={6}
                                    hasFallacy={false}
                                />
                            </div>

                            <div className="text-xs text-foreground/90 leading-relaxed space-y-2">
                                <p className="font-semibold text-red-600">
                                    “把爱情量化为麦穗，是数学家最浪漫的误解；而把爱人视为淘汰的样本，是亲密关系中最残忍的冷血。”
                                </p>
                                <p>
                                    我方坚决反对将爱情“算法化”。正方看似用 <span className="font-mono">$k=7$</span> 找到了最优解，但你忽略了爱情最核心的特质：<strong>不可逆性与主体性</strong>。请问被晓冬列入前 7 次“只看不用”的女孩是冷冰冰的数字吗？如果前 7 次遇到了真正灵魂共振的完美伴侣，却因为“算法规定现在只能观察”而强行克制离开，难道不是人为制造悲剧？心动若可以用公式延迟满足，那叫“风险对冲型资产配置”，绝非真正的爱情。
                                </p>
                            </div>

                            <div className="p-2.5 rounded-xl bg-red-500/5 border border-red-500/20 text-[11px] text-red-700 dark:text-red-300 flex items-center gap-2">
                                <Brain className="h-3.5 w-3.5 shrink-0" />
                                <span>AI 裁判评语：有效回应了正方的算法策略，提出了‘不可逆性与主体性’的批判，但缺乏具体论据支撑（得分：6分）。</span>
                            </div>
                        </div>

                        {/* 第 2 回合激战进行中 (删除后续结束回合，呈现进行中) */}
                        <div className="p-4 rounded-2xl border border-dashed border-primary/40 bg-primary/5 text-center space-y-1.5">
                            <div className="flex items-center justify-center gap-2 text-xs font-bold text-primary">
                                <Swords className="h-4 w-4 animate-bounce" />
                                <span>第 2 回合攻守交锋正在进行中...</span>
                            </div>
                            <p className="text-[11px] text-muted-foreground">
                                正方测试1 正在撰写第 2 回合反驳论点，观战学者可继续下注竞猜或发送实时弹幕。
                            </p>
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
                    上一步：论文排版
                </Button>

                <Button
                    size="lg"
                    onClick={onNext}
                    className="h-11 px-6 rounded-2xl bg-gradient-to-r from-primary to-violet-600 text-white font-bold shadow-lg shadow-primary/25 gap-2 hover:opacity-95 cursor-pointer"
                >
                    下一步：私信与数据时效
                    <ArrowRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
