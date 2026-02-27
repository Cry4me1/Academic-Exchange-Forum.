"use client";

import { getMyCredits, getMyTransactions } from "@/app/(protected)/credits/actions";
import { CreditRechargeDialog } from "@/components/payments/CreditRechargeDialog";
import { VipBadge } from "@/components/payments/VipBadge";
import { VipIconV1, VipIconV2, VipIconV3, VipIconV4, VipIconV5, VipIconV6 } from "@/components/payments/VipIcons";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { VIP_LEVELS, getNextLevelProgress, getVipLevel } from "@/lib/vip-utils";
import { motion, useMotionValue, useTransform } from "framer-motion";
import {
    ArrowLeft,
    ArrowUpRight,
    Coins,
    History,
    Sparkles,
    TrendingUp,
    Zap
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

const transactionTypeLabels: Record<string, { label: string; icon: typeof Coins }> = {
    signup_bonus: { label: "注册奖励", icon: Sparkles },
    monthly_bonus: { label: "每月赠送", icon: Sparkles },
    purchase: { label: "积分购买", icon: Coins },
    ask_ai_usage: { label: "AI 调用", icon: Zap },
    admin_adjustment: { label: "管理员调整", icon: TrendingUp },
};

// ====== 动画参数 ======
const stagger = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.08, delayChildren: 0.15 },
    },
};

const fadeUp = {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
};

interface Transaction {
    id: string;
    amount: number;
    type: string;
    description: string | null;
    created_at: string;
}

export default function VipPage() {
    const [isRechargeOpen, setIsRechargeOpen] = useState(false);
    const [balance, setBalance] = useState(0);
    const [totalSpent, setTotalSpent] = useState(0);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const PAGE_SIZE = 20;

    // 加载真实数据
    useEffect(() => {
        const loadData = async () => {
            const [credits, txResult] = await Promise.all([
                getMyCredits(),
                getMyTransactions(PAGE_SIZE, 0),
            ]);
            setBalance(credits.balance);
            setTotalSpent(credits.totalSpent);
            const txs = txResult.transactions as Transaction[];
            setTransactions(txs);
            setHasMore(txs.length >= PAGE_SIZE);
            setIsLoading(false);
        };
        loadData();
    }, []);

    const loadMore = async () => {
        setIsLoadingMore(true);
        const txResult = await getMyTransactions(PAGE_SIZE, transactions.length);
        const newTxs = txResult.transactions as Transaction[];
        setTransactions(prev => [...prev, ...newTxs]);
        setHasMore(newTxs.length >= PAGE_SIZE);
        setIsLoadingMore(false);
    };

    // 充值关闭后刷新
    const handleRechargeClose = async (open: boolean) => {
        setIsRechargeOpen(open);
        if (!open) {
            const [credits, txResult] = await Promise.all([
                getMyCredits(),
                getMyTransactions(PAGE_SIZE, 0),
            ]);
            setBalance(credits.balance);
            setTotalSpent(credits.totalSpent);
            const txs = txResult.transactions as Transaction[];
            setTransactions(txs);
            setHasMore(txs.length >= PAGE_SIZE);
        }
    };

    const level = getVipLevel(totalSpent);
    const { current, next, progress, remaining } = getNextLevelProgress(totalSpent);

    // 3D 视差特效所需 variables
    const mouseX = useMotionValue(0.5);
    const mouseY = useMotionValue(0.5);
    const rotateX = useTransform(mouseY, [0, 1], [10, -10]);
    const rotateY = useTransform(mouseX, [0, 1], [-10, 10]);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;
        mouseX.set(x);
        mouseY.set(y);
    };

    const handleMouseLeave = () => {
        mouseX.set(0.5);
        mouseY.set(0.5);
    };

    const getIconComp = (lvlNum: number) => {
        return {
            1: VipIconV1,
            2: VipIconV2,
            3: VipIconV3,
            4: VipIconV4,
            5: VipIconV5,
            6: VipIconV6,
        }[lvlNum] || VipIconV1;
    };

    // 主角图标组件
    const HeroIcon = getIconComp(level.level);

    return (
        <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 text-white relative overflow-hidden">
            {/* 顶部动态呼吸全屏光晕装饰 */}
            <motion.div
                className="fixed inset-0 pointer-events-none overflow-hidden z-0 opacity-40 mix-blend-screen"
                animate={{ scale: [1, 1.05, 1], opacity: [0.3, 0.5, 0.3] }}
                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            >
                <div className={`absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-gradient-to-br ${level.gradient} rounded-full blur-[150px] opacity-20`} />
                <div className={`absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-gradient-to-tl ${level.gradient} rounded-full blur-[120px] opacity-10`} />
            </motion.div>

            <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 py-8">
                {/* 返回按钮 */}
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                    <Link
                        href="/dashboard"
                        className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors mb-8"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        返回首页
                    </Link>
                </motion.div>

                <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-8">
                    {/* ===== 等级英雄区 ===== */}
                    <motion.div variants={fadeUp}>
                        <Card className="border-none bg-gradient-to-br from-zinc-900/80 to-zinc-800/50 backdrop-blur-xl shadow-2xl overflow-hidden relative">
                            {/* 等级颜色的顶部光条 */}
                            <div className={`absolute top-0 inset-x-0 h-1 bg-gradient-to-r ${level.gradient}`} />

                            {/* 背景装饰光 */}
                            <div className={`absolute top-[-50%] right-[-20%] w-[60%] h-[200%] bg-gradient-to-bl ${level.gradient} opacity-[0.05] rounded-full blur-[80px]`} />

                            <CardContent className="p-8 relative">
                                <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
                                    {/* 等级徽章 - 3D 视差展示 */}
                                    <div
                                        className="relative shrink-0 perspective-[1000px] w-32 h-32"
                                        onMouseMove={handleMouseMove}
                                        onMouseLeave={handleMouseLeave}
                                    >
                                        <motion.div
                                            className="w-full h-full rounded-3xl relative preserve-3d"
                                            style={{ rotateX, rotateY }}
                                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                        >
                                            <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${level.gradient} flex items-center justify-center shadow-2xl ${level.glowColor} overflow-hidden border border-white/20`}>
                                                {/* 极光流转底色 */}
                                                <motion.div
                                                    className="absolute -inset-[100%] bg-[conic-gradient(from_0deg,transparent_0_340deg,rgba(255,255,255,0.6)_360deg)]"
                                                    animate={{ rotate: 360 }}
                                                    transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                                                />
                                                <div className="absolute inset-[2px] rounded-[22px] bg-zinc-900/80 backdrop-blur-xl flex flex-col items-center justify-center relative z-10">
                                                    <HeroIcon size={48} />
                                                    <span className="text-2xl font-black mt-2 bg-gradient-to-br from-white to-white/60 bg-clip-text text-transparent transform-gpu translate-z-[20px]">
                                                        {level.name}
                                                    </span>
                                                </div>
                                            </div>
                                            {/* 外围光环 */}
                                            <div className={`absolute -inset-4 rounded-[40px] bg-gradient-to-br ${level.gradient} opacity-30 blur-xl -z-10`} />
                                        </motion.div>
                                    </div>

                                    {/* 等级信息 */}
                                    <div className="flex-1 text-center md:text-left">
                                        <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                                            <h1 className="text-3xl font-bold text-white">{level.title}</h1>
                                            <VipBadge totalSpent={totalSpent} size="md" />
                                        </div>
                                        <p className="text-zinc-400 mb-6">
                                            累计消费 <span className="text-white font-semibold">{totalSpent.toLocaleString()}</span> 积分
                                        </p>

                                        {/* 进度条 */}
                                        {next ? (
                                            <div className="space-y-2">
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-zinc-400">
                                                        距离 <span className={`font-semibold bg-gradient-to-r ${next.textGradient} bg-clip-text text-transparent`}>{next.name} {next.title}</span>
                                                    </span>
                                                    <span className="text-zinc-500">还需 {remaining.toLocaleString()} 积分</span>
                                                </div>
                                                <div className="h-4 bg-zinc-950/50 rounded-full overflow-hidden relative shadow-inner border border-zinc-800">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${progress}%` }}
                                                        transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
                                                        className={`h-full rounded-full bg-gradient-to-r ${level.gradient} relative overflow-hidden`}
                                                    >
                                                        {/* 液体注入波纹 */}
                                                        <motion.div
                                                            className="absolute inset-0 opacity-30"
                                                            style={{
                                                                backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.2) 10px, rgba(255,255,255,0.2) 20px)`
                                                            }}
                                                            animate={{ backgroundPosition: ["0px 0px", "40px 0px"] }}
                                                            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                                                        />
                                                        {/* 光子流扫过波纹 */}
                                                        <motion.div
                                                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/80 to-transparent w-[50px] mix-blend-overlay"
                                                            animate={{ x: ["-100%", "500%"] }}
                                                            transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut", delay: 1 }}
                                                        />
                                                    </motion.div>
                                                </div>
                                                <p className="text-xs text-zinc-500 text-right">{progress}%</p>
                                            </div>
                                        ) : (
                                            <p className="text-amber-400 font-medium flex items-center gap-2">
                                                <Sparkles className="h-4 w-4" /> 已达最高等级！
                                            </p>
                                        )}
                                    </div>

                                    {/* 快速充值按钮 */}
                                    <div className="shrink-0 flex flex-col items-center gap-3">
                                        <Button
                                            onClick={() => setIsRechargeOpen(true)}
                                            className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-none shadow-lg shadow-amber-500/20 h-12 px-6 text-base font-semibold rounded-xl"
                                        >
                                            <Coins className="h-5 w-5 mr-2" />
                                            充值积分
                                        </Button>
                                        <div className="text-center">
                                            <p className="text-2xl font-bold text-white">{balance.toLocaleString()}</p>
                                            <p className="text-xs text-zinc-500">当前余额</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* ===== 等级总览 ===== */}
                    <motion.div variants={fadeUp}>
                        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-amber-400" />
                            成长等级
                        </h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                            {VIP_LEVELS.map((lvl) => {
                                const isCurrentOrPast = totalSpent >= lvl.minSpent;
                                const isCurrent = lvl.level === level.level;
                                const GridIcon = getIconComp(lvl.level);

                                return (
                                    <motion.div
                                        key={lvl.level}
                                        whileHover={{ y: -4, scale: 1.03 }}
                                        className={`relative rounded-xl p-4 text-center transition-all overflow-hidden border group
                                            ${isCurrent
                                                ? `bg-gradient-to-br ${lvl.gradient} border-white/20 shadow-lg ${lvl.glowColor}`
                                                : isCurrentOrPast
                                                    ? "bg-zinc-800/80 border-zinc-700/50 hover:bg-zinc-800"
                                                    : "bg-zinc-950/60 border-zinc-800/80 backdrop-blur-md opacity-80 backdrop-grayscale"
                                            }`}
                                    >
                                        {!isCurrentOrPast && (
                                            <div className="absolute inset-0 bg-black/40 z-10 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[2px]">
                                                <span className="text-xs font-bold text-white tracking-widest uppercase">Locked</span>
                                            </div>
                                        )}
                                        {isCurrent && (
                                            <motion.div
                                                className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/20 to-white/0"
                                                animate={{ x: ['-100%', '200%'] }}
                                                transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                                            />
                                        )}
                                        <div className={`text-2xl mb-2 flex justify-center ${isCurrent ? "text-white" : ""}`}>
                                            <GridIcon size={32} className={!isCurrent && !isCurrentOrPast ? 'opacity-30 grayscale' : ''} />
                                        </div>
                                        <div className={`font-bold text-lg relative z-10 ${isCurrent ? "text-white drop-shadow-md" : isCurrentOrPast ? "text-zinc-200" : "text-zinc-600"}`}>
                                            {lvl.name}
                                        </div>
                                        <div className={`text-xs mt-0.5 ${isCurrent ? "text-white/80" : "text-zinc-500"}`}>
                                            {lvl.title}
                                        </div>
                                        <div className={`text-[10px] mt-1 ${isCurrent ? "text-white/60" : "text-zinc-600"}`}>
                                            {lvl.minSpent === 0 ? "起始" : `${lvl.minSpent.toLocaleString()}+`}
                                        </div>
                                        {isCurrent && (
                                            <motion.div
                                                className="absolute -top-1 -right-1 bg-white text-zinc-900 text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-md"
                                                animate={{ scale: [1, 1.1, 1] }}
                                                transition={{ repeat: Infinity, duration: 2 }}
                                            >
                                                当前
                                            </motion.div>
                                        )}
                                    </motion.div>
                                );
                            })}
                        </div>
                    </motion.div>

                    {/* ===== 消费记录 ===== */}
                    <motion.div variants={fadeUp}>
                        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <History className="h-5 w-5 text-zinc-400" />
                            消费记录
                        </h2>
                        <Card className="border-none bg-zinc-900/60 backdrop-blur-sm overflow-hidden">
                            <CardContent className="p-0">
                                <div className="divide-y divide-zinc-800/60">
                                    {transactions.map((tx: Transaction, i: number) => {
                                        const meta = transactionTypeLabels[tx.type] || { label: tx.type, icon: Coins };
                                        const IconComp = meta.icon;
                                        const isPositive = tx.amount > 0;
                                        return (
                                            <motion.div
                                                key={tx.id}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: 0.6 + i * 0.05 }}
                                                className="flex items-center gap-4 px-5 py-4 hover:bg-zinc-800/30 transition-colors"
                                            >
                                                <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${isPositive ? "bg-emerald-500/15 text-emerald-400" : "bg-zinc-700/50 text-zinc-400"}`}>
                                                    <IconComp className="h-4 w-4" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-zinc-200 truncate">{tx.description}</p>
                                                    <p className="text-xs text-zinc-500 mt-0.5">
                                                        {meta.label} · {new Date(tx.created_at).toLocaleDateString("zh-CN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                                                    </p>
                                                </div>
                                                <div className={`text-sm font-bold tabular-nums ${isPositive ? "text-emerald-400" : "text-zinc-400"}`}>
                                                    {isPositive ? "+" : ""}{tx.amount}
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                        {hasMore && (
                            <div className="mt-4 text-center">
                                <Button
                                    variant="ghost"
                                    className="text-zinc-500 hover:text-zinc-300 gap-1 text-sm"
                                    onClick={loadMore}
                                    disabled={isLoadingMore}
                                >
                                    {isLoadingMore ? (
                                        <span className="flex items-center gap-2">
                                            <motion.div
                                                animate={{ rotate: 360 }}
                                                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                                                className="w-3.5 h-3.5 border-2 border-zinc-600 border-t-zinc-300 rounded-full"
                                            />
                                            加载中...
                                        </span>
                                    ) : (
                                        <>查看更多 <ArrowUpRight className="h-3.5 w-3.5" /></>
                                    )}
                                </Button>
                            </div>
                        )}
                    </motion.div>
                </motion.div>
            </div>

            {/* 充值弹窗 */}
            <CreditRechargeDialog isOpen={isRechargeOpen} onOpenChange={handleRechargeClose} />
        </div>
    );
}
