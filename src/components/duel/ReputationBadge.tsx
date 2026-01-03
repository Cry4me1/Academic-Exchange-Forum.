"use client";

import { motion } from "framer-motion";
import { Trophy, Swords, TrendingUp, Shield, Code2, Sparkles, Infinity } from "lucide-react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface ReputationBadgeProps {
    score: number;
    wins?: number;
    losses?: number;
    size?: "sm" | "md" | "lg";
    showStats?: boolean;
    isDeveloper?: boolean;
    developerTitle?: string;
}

// 开发者等级阈值（用于判断是否为开发者账户）
const DEVELOPER_SCORE_THRESHOLD = 99999;

// 检查是否为开发者
function checkIsDeveloper(score: number, explicitDeveloper?: boolean): boolean {
    return explicitDeveloper === true || score >= DEVELOPER_SCORE_THRESHOLD;
}

// 根据积分返回段位信息
function getRank(score: number, isDeveloper?: boolean): { name: string; color: string; bgColor: string; icon: string; isDev?: boolean } {
    // 开发者特殊段位
    if (checkIsDeveloper(score, isDeveloper)) {
        return {
            name: "系统开发者",
            color: "text-transparent bg-clip-text bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500",
            bgColor: "bg-gradient-to-r from-violet-500/10 via-fuchsia-500/10 to-pink-500/10",
            icon: "⚡",
            isDev: true
        };
    }
    if (score >= 500) {
        return { name: "学术泰斗", color: "text-amber-500", bgColor: "bg-amber-500/10", icon: "👑" };
    } else if (score >= 300) {
        return { name: "资深学者", color: "text-purple-500", bgColor: "bg-purple-500/10", icon: "🎓" };
    } else if (score >= 200) {
        return { name: "知名研究员", color: "text-blue-500", bgColor: "bg-blue-500/10", icon: "📚" };
    } else if (score >= 150) {
        return { name: "助理研究员", color: "text-cyan-500", bgColor: "bg-cyan-500/10", icon: "🔬" };
    } else if (score >= 100) {
        return { name: "学术新秀", color: "text-green-500", bgColor: "bg-green-500/10", icon: "🌱" };
    } else if (score >= 50) {
        return { name: "求知学徒", color: "text-gray-500", bgColor: "bg-gray-500/10", icon: "📖" };
    } else {
        return { name: "论坛新人", color: "text-gray-400", bgColor: "bg-gray-400/10", icon: "👤" };
    }
}

export function ReputationBadge({
    score,
    wins = 0,
    losses = 0,
    size = "md",
    showStats = false,
    isDeveloper,
    developerTitle,
}: ReputationBadgeProps) {
    const rank = getRank(score, isDeveloper);
    const winRate = wins + losses > 0 ? Math.round((wins / (wins + losses)) * 100) : 0;
    const isDevMode = rank.isDev;

    const sizeClasses = {
        sm: "text-xs px-2 py-0.5",
        md: "text-sm px-3 py-1",
        lg: "text-base px-4 py-1.5",
    };

    const iconSizes = {
        sm: "h-3 w-3",
        md: "h-4 w-4",
        lg: "h-5 w-5",
    };

    // 开发者专属样式
    const devBgClass = isDevMode
        ? "bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 shadow-lg shadow-amber-500/30"
        : rank.bgColor;

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        whileHover={{ scale: 1.05 }}
                        className={`inline-flex items-center gap-1.5 rounded-full font-medium cursor-help
                            ${devBgClass} ${isDevMode ? 'text-white' : rank.color} ${sizeClasses[size]}
                            ${isDevMode ? '' : 'border border-current/20'}`}
                    >
                        {isDevMode ? (
                            <>
                                <Code2 className={`${iconSizes[size]} text-white`} />
                                <span className="font-black text-white drop-shadow-sm">∞</span>
                                <Sparkles className={`${iconSizes[size]} text-yellow-200 animate-pulse`} />
                            </>
                        ) : (
                            <>
                                <span>{rank.icon}</span>
                                <Shield className={iconSizes[size]} />
                                <span>{score}</span>
                            </>
                        )}
                    </motion.div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className={`w-64 p-0 ${isDevMode ? 'border-violet-500/30' : ''}`}>
                    <div className="p-4 space-y-3">
                        {/* 段位标题 */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                {isDevMode ? (
                                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 flex items-center justify-center">
                                        <Code2 className="h-5 w-5 text-white" />
                                    </div>
                                ) : (
                                    <span className="text-2xl">{rank.icon}</span>
                                )}
                                <div>
                                    {isDevMode ? (
                                        <p className="font-bold bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 bg-clip-text text-transparent">
                                            {developerTitle || rank.name}
                                        </p>
                                    ) : (
                                        <p className={`font-bold ${rank.color}`}>{rank.name}</p>
                                    )}
                                    <p className="text-xs text-muted-foreground">
                                        {isDevMode ? '开发者特权' : '信誉积分'}
                                    </p>
                                </div>
                            </div>
                            {isDevMode ? (
                                <div className="flex items-center gap-1">
                                    <Infinity className="h-6 w-6 text-fuchsia-500" />
                                </div>
                            ) : (
                                <div className={`text-2xl font-bold ${rank.color}`}>{score}</div>
                            )}
                        </div>

                        {/* 开发者特殊标识 */}
                        {isDevMode && (
                            <>
                                <div className="h-px bg-gradient-to-r from-violet-500/50 via-fuchsia-500/50 to-pink-500/50" />
                                <div className="flex items-center gap-2 text-sm">
                                    <Sparkles className="h-4 w-4 text-amber-500" />
                                    <span className="text-muted-foreground">信誉分永久保护</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <Shield className="h-4 w-4 text-emerald-500" />
                                    <span className="text-muted-foreground">免疫决斗惩罚</span>
                                </div>
                            </>
                        )}

                        {/* 决斗统计 */}
                        {showStats && (wins > 0 || losses > 0) && (
                            <>
                                <div className="h-px bg-border" />
                                <div className="grid grid-cols-3 gap-2 text-center">
                                    <div className="space-y-1">
                                        <div className="flex items-center justify-center gap-1 text-green-500">
                                            <Trophy className="h-4 w-4" />
                                            <span className="font-bold">{wins}</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground">胜场</p>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex items-center justify-center gap-1 text-red-500">
                                            <Swords className="h-4 w-4" />
                                            <span className="font-bold">{losses}</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground">败场</p>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex items-center justify-center gap-1 text-blue-500">
                                            <TrendingUp className="h-4 w-4" />
                                            <span className="font-bold">{winRate}%</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground">胜率</p>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* 积分说明 */}
                        <div className="h-px bg-border" />
                        <p className="text-xs text-muted-foreground">
                            {isDevMode
                                ? '感谢开发者为社区所做的贡献！'
                                : '通过学术决斗赢取积分，提升你的学术段位！'
                            }
                        </p>
                    </div>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}

// 紧凑版信誉展示（用于列表项）
export function ReputationBadgeCompact({ score, isDeveloper }: { score: number; isDeveloper?: boolean }) {
    const rank = getRank(score, isDeveloper);
    const isDevMode = rank.isDev;

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    {isDevMode ? (
                        <span
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-medium cursor-help bg-gradient-to-r from-amber-500 via-orange-500 to-red-500"
                        >
                            <Code2 className="h-3 w-3 text-white" />
                            <span className="font-black text-white">∞</span>
                        </span>
                    ) : (
                        <span
                            className={`inline-flex items-center gap-1 text-xs font-medium cursor-help
                                ${rank.color}`}
                        >
                            <Shield className="h-3 w-3" />
                            <span>{score}</span>
                        </span>
                    )}
                </TooltipTrigger>
                <TooltipContent>
                    {isDevMode ? (
                        <p className="flex items-center gap-1">
                            <Code2 className="h-3 w-3 text-amber-500" />
                            <span className="font-bold text-amber-500">系统开发者</span>
                            <span>- 信誉分 ∞</span>
                        </p>
                    ) : (
                        <p>{rank.icon} {rank.name} - 信誉积分 {score}</p>
                    )}
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
