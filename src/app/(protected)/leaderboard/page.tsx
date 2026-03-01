"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AnimatePresence, motion } from "framer-motion";
import {
    ArrowLeft,
    Bookmark,
    Crown,
    FileText,
    Flame,
    Heart,
    Lock,
    Medal,
    Trophy
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
    getContributionLeaderboard,
    getWeeklyBookmarkLeaderboard,
    getWeeklyLikeLeaderboard,
    type LeaderboardEntry,
} from "./actions";

// ============================================================
// 确定性种子随机数（避免 SSR 水合不匹配）
// ============================================================
function seededRandom(seed: number) {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
}

const EMBER_COLORS = ["#ff6b35", "#ff8c42", "#ffa559", "#ffcc80"];

// 预计算粒子数据，确保服务端/客户端一致
const EMBER_PARTICLES = Array.from({ length: 20 }).map((_, i) => {
    const s = (n: number) => seededRandom(i * 7 + n + 42);
    return {
        width: s(0) * 4 + 2,
        height: s(1) * 4 + 2,
        left: s(2) * 100,
        bottom: s(3) * 20,
        color: EMBER_COLORS[Math.floor(s(4) * 4)],
        delay: s(5) * 5,
        duration: 3 + s(6) * 4,
        opacity: s(7) * 0.8 + 0.2,
    };
});

// ============================================================
// 火焰背景组件
// ============================================================
function FlameBackground() {
    return (
        <div className="fixed inset-0 z-0 overflow-hidden bg-[#0a0a0f]">
            {/* 基础暗色渐变 */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0f] via-[#10080a] to-[#1a0c06]" />

            {/* 火焰渐变层1 - 底部橙色光晕 */}
            <div className="absolute bottom-0 left-0 right-0 h-[60%] bg-gradient-to-t from-orange-900/30 via-orange-950/10 to-transparent animate-flame-pulse" />

            {/* 火焰渐变层2 - 侧面光效 */}
            <div className="absolute bottom-0 left-1/4 w-1/2 h-[70%] bg-gradient-to-t from-amber-800/20 via-red-900/5 to-transparent animate-flame-sway blur-3xl" />

            {/* 粒子火星（确定性预计算） */}
            {EMBER_PARTICLES.map((p, i) => (
                <div
                    key={i}
                    className="absolute rounded-full animate-ember-rise"
                    style={{
                        width: `${p.width}px`,
                        height: `${p.height}px`,
                        left: `${p.left}%`,
                        bottom: `${p.bottom}%`,
                        background: `radial-gradient(circle, ${p.color}, transparent)`,
                        animationDelay: `${p.delay}s`,
                        animationDuration: `${p.duration}s`,
                        opacity: p.opacity,
                    }}
                />
            ))}

            {/* 顶部暗化遮罩 */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0f] via-transparent to-transparent opacity-60" />

            {/* 网格线效果 */}
            <div
                className="absolute inset-0 opacity-[0.03]"
                style={{
                    backgroundImage: `linear-gradient(rgba(255,165,0,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,165,0,0.3) 1px, transparent 1px)`,
                    backgroundSize: "60px 60px",
                }}
            />
        </div>
    );
}

// ============================================================
// 榜一 · 王者卡片
// ============================================================
function TopChampionCard({
    entry,
    label,
    icon: Icon,
}: {
    entry: LeaderboardEntry;
    label: string;
    icon: React.ElementType;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: -40, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="relative mb-8"
        >
            {/* 外层光环 */}
            <div className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-amber-500/20 via-orange-500/30 to-amber-500/20 blur-xl animate-champion-glow" />

            <div className="relative rounded-2xl border border-amber-500/30 bg-gradient-to-br from-[#1a1206]/90 via-[#1c1008]/90 to-[#1a0c06]/90 backdrop-blur-xl overflow-hidden p-6 sm:p-8">
                {/* 顶部金色光带 */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent animate-shimmer-bar" />

                <div className="flex flex-col items-center pt-6">
                    {/* 皇冠动画 */}
                    <motion.div
                        className="mb-2"
                        animate={{ y: [0, -6, 0], rotate: [0, 3, -3, 0] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    >
                        <Crown className="h-10 w-10 text-amber-400 drop-shadow-[0_0_16px_rgba(251,191,36,0.6)]" />
                    </motion.div>
                    {/* 头像 */}
                    <div className="relative mb-4">
                        <motion.div
                            className="absolute -inset-3 rounded-full bg-gradient-to-r from-amber-400 via-orange-500 to-amber-400"
                            animate={{ rotate: 360 }}
                            transition={{
                                duration: 8,
                                repeat: Infinity,
                                ease: "linear",
                            }}
                            style={{ padding: "3px" }}
                        />
                        <Avatar className="relative h-24 w-24 ring-2 ring-amber-400/50 z-10">
                            <AvatarImage src={entry.avatarUrl} />
                            <AvatarFallback className="text-2xl bg-gradient-to-br from-amber-700 to-orange-800 text-amber-100 font-bold">
                                {entry.username?.charAt(0).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>

                        {/* 锁定特效 */}
                        {entry.isLocked && (
                            <motion.div
                                className="absolute -top-1 -right-1 z-20 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full p-1.5 shadow-lg shadow-amber-500/40"
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    ease: "easeInOut",
                                }}
                            >
                                <Lock className="h-4 w-4 text-white" />
                            </motion.div>
                        )}
                    </div>

                    {/* 用户名 */}
                    <Link href={`/user/${entry.userId}`}>
                        <h3 className="text-2xl font-black bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-300 bg-clip-text text-transparent hover:from-amber-200 hover:to-yellow-100 transition-all">
                            {entry.username}
                        </h3>
                    </Link>

                    {/* 锁定标签 */}
                    {entry.isLocked && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.5 }}
                            className="mt-2 flex items-center gap-1.5 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-full px-3 py-1"
                        >
                            <Lock className="h-3 w-3 text-amber-400" />
                            <span className="text-xs font-bold text-amber-300 tracking-wider uppercase">
                                项目开发者
                            </span>
                        </motion.div>
                    )}

                    {/* 分数 */}
                    <div className="mt-4 flex items-center gap-2">
                        <Icon className="h-5 w-5 text-amber-400" />
                        <span className="text-3xl font-black text-white tabular-nums">
                            {entry.score.toLocaleString()}
                        </span>
                        <span className="text-amber-400/70 text-sm">{label}</span>
                    </div>

                    {/* 排名标识 */}
                    <div className="mt-3 flex items-center gap-1.5 text-amber-500/60 text-xs font-semibold">
                        <Trophy className="h-4 w-4" />
                        <span>👑 至高无上 · 第一名</span>
                    </div>
                </div>

                {/* 底部装饰线 */}
                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />
            </div>
        </motion.div>
    );
}

// ============================================================
// 二三名 · 卡片
// ============================================================
function RunnerUpCard({
    entry,
    position,
    label,
    icon: Icon,
}: {
    entry: LeaderboardEntry;
    position: 2 | 3;
    label: string;
    icon: React.ElementType;
}) {
    const isSecond = position === 2;
    const borderColor = isSecond
        ? "border-slate-300/30"
        : "border-amber-700/30";
    const gradientFrom = isSecond ? "from-slate-400" : "from-amber-600";
    const gradientTo = isSecond ? "to-slate-200" : "to-amber-400";
    const bgGradient = isSecond
        ? "from-[#12141a]/90 via-[#161920]/90 to-[#12141a]/90"
        : "from-[#1a1510]/90 via-[#1c1610]/90 to-[#1a1510]/90";
    const ringColor = isSecond ? "ring-slate-400/40" : "ring-amber-600/40";
    const medalColor = isSecond ? "text-slate-300" : "text-amber-600";

    return (
        <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
                duration: 0.6,
                delay: position === 2 ? 0.2 : 0.35,
                ease: [0.16, 1, 0.3, 1],
            }}
            className="relative group"
        >
            {/* 外层微光 */}
            <div
                className={`absolute -inset-2 rounded-2xl bg-gradient-to-r ${isSecond
                    ? "from-slate-400/10 to-slate-300/10"
                    : "from-amber-700/10 to-amber-600/10"
                    } blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
            />

            <div
                className={`relative rounded-xl border ${borderColor} bg-gradient-to-br ${bgGradient} backdrop-blur-xl overflow-hidden p-5`}
            >
                {/* 排名角标 */}
                <div className="absolute top-3 right-3">
                    <Medal className={`h-6 w-6 ${medalColor}`} />
                </div>

                <div className="flex flex-col items-center">
                    {/* 头像 */}
                    <div className="relative mb-3">
                        <Avatar className={`h-16 w-16 ring-2 ${ringColor}`}>
                            <AvatarImage src={entry.avatarUrl} />
                            <AvatarFallback
                                className={`text-lg bg-gradient-to-br ${isSecond
                                    ? "from-slate-600 to-slate-700"
                                    : "from-amber-800 to-amber-900"
                                    } text-white font-bold`}
                            >
                                {entry.username?.charAt(0).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                    </div>

                    {/* 排名 */}
                    <div
                        className={`text-xs font-bold mb-1 bg-gradient-to-r ${gradientFrom} ${gradientTo} bg-clip-text text-transparent`}
                    >
                        第{position}名
                    </div>

                    {/* 用户名 */}
                    <Link href={`/user/${entry.userId}`}>
                        <h4
                            className={`font-bold text-lg bg-gradient-to-r ${gradientFrom} ${gradientTo} bg-clip-text text-transparent hover:opacity-80 transition-opacity`}
                        >
                            {entry.username}
                        </h4>
                    </Link>

                    {/* 分数 */}
                    <div className="mt-2 flex items-center gap-1.5">
                        <Icon
                            className={`h-4 w-4 ${isSecond ? "text-slate-400" : "text-amber-600"
                                }`}
                        />
                        <span className="text-xl font-bold text-white tabular-nums">
                            {entry.score.toLocaleString()}
                        </span>
                        <span className="text-white/40 text-xs">{label}</span>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

// ============================================================
// 列表排名项
// ============================================================
function LeaderboardRow({
    entry,
    label,
    icon: Icon,
    delay,
}: {
    entry: LeaderboardEntry;
    label: string;
    icon: React.ElementType;
    delay: number;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay, ease: "easeOut" }}
            className="group relative"
        >
            <div className="relative flex items-center gap-4 rounded-xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-sm px-4 py-3 hover:bg-white/[0.06] hover:border-orange-500/20 transition-all duration-300">
                {/* 排名数字 */}
                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center">
                    <span className="text-sm font-bold text-white/60 tabular-nums">
                        {entry.rank}
                    </span>
                </div>

                {/* 头像 */}
                <Avatar className="h-10 w-10 ring-1 ring-white/10">
                    <AvatarImage src={entry.avatarUrl} />
                    <AvatarFallback className="text-sm bg-white/10 text-white/70 font-semibold">
                        {entry.username?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                </Avatar>

                {/* 用户名 */}
                <Link
                    href={`/user/${entry.userId}`}
                    className="flex-1 min-w-0"
                >
                    <span className="font-medium text-white/80 group-hover:text-white transition-colors truncate block">
                        {entry.username}
                    </span>
                </Link>

                {/* 分数 */}
                <div className="flex items-center gap-1.5 text-white/50">
                    <Icon className="h-3.5 w-3.5" />
                    <span className="font-semibold tabular-nums text-white/70">
                        {entry.score.toLocaleString()}
                    </span>
                    <span className="text-xs hidden sm:inline">{label}</span>
                </div>
            </div>
        </motion.div>
    );
}

// ============================================================
// 加载骨架屏
// ============================================================
function LoadingSkeleton() {
    return (
        <div className="flex flex-col items-center justify-center py-20">
            <motion.div
                animate={{
                    y: [0, -8, 0],
                    scale: [1, 1.15, 1],
                    opacity: [0.6, 1, 0.6],
                }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
                <Flame className="h-12 w-12 text-orange-500/60 drop-shadow-[0_0_20px_rgba(249,115,22,0.3)]" />
            </motion.div>
            <motion.p
                className="mt-4 text-white/40 text-sm"
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 2, repeat: Infinity }}
            >
                正在加载排行榜...
            </motion.p>
        </div>
    );
}

// ============================================================
// 空状态
// ============================================================
function EmptyState() {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
        >
            <Trophy className="h-16 w-16 mx-auto text-white/20 mb-4" />
            <h3 className="text-lg font-medium text-white/40 mb-2">
                暂无排名数据
            </h3>
            <p className="text-sm text-white/25">
                快来发布帖子，成为第一个上榜的学者吧！
            </p>
            <Link href="/posts/new">
                <Button className="mt-6 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white border-0">
                    发布帖子
                </Button>
            </Link>
        </motion.div>
    );
}

// ============================================================
// 排行榜展示区
// ============================================================
function LeaderboardDisplay({
    entries,
    label,
    icon,
}: {
    entries: LeaderboardEntry[];
    label: string;
    icon: React.ElementType;
}) {
    if (entries.length === 0) return <EmptyState />;

    const champion = entries[0];
    const second = entries[1];
    const third = entries[2];
    const rest = entries.slice(3);

    return (
        <motion.div
            key={label}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
        >
            {/* 榜一 · 王者 */}
            {champion && (
                <TopChampionCard entry={champion} label={label} icon={icon} />
            )}

            {/* 二三名 */}
            {(second || third) && (
                <div className="grid grid-cols-2 gap-4 mb-6">
                    {second ? (
                        <RunnerUpCard
                            entry={second}
                            position={2}
                            label={label}
                            icon={icon}
                        />
                    ) : (
                        <div />
                    )}
                    {third ? (
                        <RunnerUpCard
                            entry={third}
                            position={3}
                            label={label}
                            icon={icon}
                        />
                    ) : (
                        <div />
                    )}
                </div>
            )}

            {/* 其余排名 */}
            {rest.length > 0 && (
                <div className="space-y-2">
                    <div className="flex items-center gap-2 mb-3 px-1">
                        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                        <span className="text-xs text-white/30 font-medium">
                            — 一人之下，万人之上 —
                        </span>
                        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                    </div>
                    {rest.map((entry, index) => (
                        <LeaderboardRow
                            key={entry.userId}
                            entry={entry}
                            label={label}
                            icon={icon}
                            delay={0.4 + index * 0.06}
                        />
                    ))}
                </div>
            )}
        </motion.div>
    );
}

// ============================================================
// 主页面
// ============================================================
type TabKey = "likes" | "bookmarks" | "contribution";

export default function LeaderboardPage() {
    const [activeTab, setActiveTab] = useState<TabKey>("likes");
    const [data, setData] = useState<Record<TabKey, LeaderboardEntry[]>>({
        likes: [],
        bookmarks: [],
        contribution: [],
    });
    const [loaded, setLoaded] = useState<Record<TabKey, boolean>>({
        likes: false,
        bookmarks: false,
        contribution: false,
    });
    const [loading, setLoading] = useState(true);
    const [showContent, setShowContent] = useState(false);

    const fetchTab = useCallback(
        async (tab: TabKey) => {
            if (loaded[tab]) return;
            setLoading(true);
            try {
                let entries: LeaderboardEntry[];
                switch (tab) {
                    case "likes":
                        entries = await getWeeklyLikeLeaderboard();
                        break;
                    case "bookmarks":
                        entries = await getWeeklyBookmarkLeaderboard();
                        break;
                    case "contribution":
                        entries = await getContributionLeaderboard();
                        break;
                }
                setData((prev) => ({ ...prev, [tab]: entries }));
                setLoaded((prev) => ({ ...prev, [tab]: true }));
            } catch (err) {
                console.error(`Failed to fetch ${tab} leaderboard:`, err);
            } finally {
                setLoading(false);
            }
        },
        [loaded]
    );

    // 初始加载
    useEffect(() => {
        const timer = setTimeout(() => setShowContent(true), 600);
        fetchTab("likes");
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Tab切换时加载
    useEffect(() => {
        fetchTab(activeTab);
    }, [activeTab, fetchTab]);

    const tabConfig: {
        key: TabKey;
        label: string;
        icon: React.ElementType;
        scoreLabel: string;
    }[] = [
            { key: "likes", label: "🔥 周点赞榜", icon: Heart, scoreLabel: "获赞" },
            {
                key: "bookmarks",
                label: "⭐ 周收藏榜",
                icon: Bookmark,
                scoreLabel: "收藏",
            },
            {
                key: "contribution",
                label: "🏆 社区贡献值",
                icon: FileText,
                scoreLabel: "发帖",
            },
        ];

    const currentTabConfig = tabConfig.find((t) => t.key === activeTab)!;

    return (
        <div className="relative min-h-screen">
            {/* 火焰背景 */}
            <FlameBackground />

            {/* 入场过渡 */}
            <AnimatePresence>
                {!showContent && (
                    <motion.div
                        className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a0a0f]"
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <motion.div
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 1.5, opacity: 0 }}
                            transition={{ duration: 0.6 }}
                            className="flex flex-col items-center"
                        >
                            <motion.div
                                animate={{
                                    y: [0, -12, 0],
                                    scale: [1, 1.1, 1],
                                    filter: [
                                        "drop-shadow(0 0 20px rgba(249,115,22,0.3))",
                                        "drop-shadow(0 0 40px rgba(249,115,22,0.6))",
                                        "drop-shadow(0 0 20px rgba(249,115,22,0.3))",
                                    ],
                                }}
                                transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    ease: "easeInOut",
                                }}
                            >
                                <Flame className="h-20 w-20 text-orange-500" />
                            </motion.div>
                            <motion.h1
                                className="mt-4 text-3xl font-black bg-gradient-to-r from-orange-400 to-amber-300 bg-clip-text text-transparent"
                                animate={{ opacity: [0.5, 1, 0.5] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                            >
                                排行榜
                            </motion.h1>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 主内容 */}
            <div className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 py-8">
                {/* 头部 */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: showContent ? 1 : 0, y: showContent ? 0 : -20 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="flex items-center gap-4 mb-8"
                >
                    <Link href="/dashboard">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-white/60 hover:text-white hover:bg-white/10"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-black text-white flex items-center gap-2">
                            <Flame className="h-6 w-6 text-orange-500 animate-pulse" />
                            排行榜
                        </h1>
                        <p className="text-white/40 text-sm mt-0.5">
                            荣耀属于最杰出的学者
                        </p>
                    </div>
                </motion.div>

                {/* Tab切换 */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: showContent ? 1 : 0, y: showContent ? 0 : 10 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="mb-8"
                >
                    <Tabs
                        value={activeTab}
                        onValueChange={(v) => setActiveTab(v as TabKey)}
                    >
                        <TabsList className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl p-1 h-auto">
                            {tabConfig.map((tab) => (
                                <TabsTrigger
                                    key={tab.key}
                                    value={tab.key}
                                    className="flex-1 text-xs sm:text-sm text-white/50 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-600/80 data-[state=active]:to-amber-600/80 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-orange-500/20 rounded-lg py-2.5 transition-all duration-300"
                                >
                                    {tab.label}
                                </TabsTrigger>
                            ))}
                        </TabsList>
                    </Tabs>
                </motion.div>

                {/* 排行榜内容 */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: showContent ? 1 : 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                >
                    <AnimatePresence mode="wait">
                        {loading && !loaded[activeTab] ? (
                            <LoadingSkeleton />
                        ) : (
                            <LeaderboardDisplay
                                entries={data[activeTab]}
                                label={currentTabConfig.scoreLabel}
                                icon={currentTabConfig.icon}
                            />
                        )}
                    </AnimatePresence>
                </motion.div>
            </div>
        </div>
    );
}
