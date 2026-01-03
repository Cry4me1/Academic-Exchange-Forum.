"use client";

import { motion } from "framer-motion";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import {
    BookOpen,
    Quote,
    Brain,
    AlertTriangle,
    Star,
    TrendingUp,
    TrendingDown,
} from "lucide-react";

interface DuelScoreCardProps {
    evidenceScore: number;
    citationScore: number;
    logicScore: number;
    fallacyPenalty: number;
    totalScore: number;
    hasFallacy: boolean;
    fallacyType?: string;
    analysis?: string;
}

export function DuelScoreCard({
    evidenceScore,
    citationScore,
    logicScore,
    fallacyPenalty,
    totalScore,
    hasFallacy,
    fallacyType,
    analysis,
}: DuelScoreCardProps) {
    const isPositive = totalScore > 0;
    const isNegative = totalScore < 0;

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full cursor-help
                            ${isPositive ? "bg-green-500/10 text-green-600" : ""}
                            ${isNegative ? "bg-red-500/10 text-red-600" : ""}
                            ${!isPositive && !isNegative ? "bg-gray-500/10 text-gray-600" : ""}
                            border ${hasFallacy ? "border-red-500/50" : "border-current/20"}
                        `}
                    >
                        {isPositive && <TrendingUp className="h-4 w-4" />}
                        {isNegative && <TrendingDown className="h-4 w-4" />}
                        {hasFallacy && <AlertTriangle className="h-4 w-4 text-red-500" />}
                        <span className="font-bold text-lg">
                            {totalScore > 0 ? `+${totalScore}` : totalScore}
                        </span>
                    </motion.div>
                </TooltipTrigger>
                <TooltipContent side="left" className="w-72 p-0">
                    <div className="p-4 space-y-3">
                        {/* 标题 */}
                        <div className="flex items-center justify-between">
                            <h4 className="font-semibold flex items-center gap-1">
                                <Star className="h-4 w-4 text-amber-500" />
                                AI 裁判评分
                            </h4>
                            <Badge
                                variant={isPositive ? "default" : isNegative ? "destructive" : "secondary"}
                            >
                                总分: {totalScore > 0 ? `+${totalScore}` : totalScore}
                            </Badge>
                        </div>

                        {/* 评分明细 */}
                        <div className="space-y-2">
                            <ScoreRow
                                icon={<BookOpen className="h-4 w-4" />}
                                label="证据力度"
                                score={evidenceScore}
                                max={5}
                            />
                            <ScoreRow
                                icon={<Quote className="h-4 w-4" />}
                                label="引用权威性"
                                score={citationScore}
                                max={3}
                            />
                            <ScoreRow
                                icon={<Brain className="h-4 w-4" />}
                                label="逻辑严密"
                                score={logicScore}
                                max={2}
                            />
                        </div>

                        {/* 谬误扣分 */}
                        {hasFallacy && (
                            <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/30">
                                <div className="flex items-center gap-2 text-red-600">
                                    <AlertTriangle className="h-4 w-4" />
                                    <span className="font-medium">逻辑谬误</span>
                                    <Badge variant="destructive" className="ml-auto">
                                        {fallacyPenalty}
                                    </Badge>
                                </div>
                                {fallacyType && (
                                    <p className="text-xs text-red-500/80 mt-1">{fallacyType}</p>
                                )}
                            </div>
                        )}

                        {/* AI 分析 */}
                        {analysis && (
                            <>
                                <div className="h-px bg-border" />
                                <p className="text-xs text-muted-foreground">{analysis}</p>
                            </>
                        )}
                    </div>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}

// 评分行组件
function ScoreRow({
    icon,
    label,
    score,
    max,
}: {
    icon: React.ReactNode;
    label: string;
    score: number;
    max: number;
}) {
    // Use a fixed denominator (5) for width calculation so bar length reflects absolute points
    const percentage = (score / 5) * 100;

    return (
        <div className="flex items-center gap-2">
            <span className="text-muted-foreground">{icon}</span>
            <span className="text-sm flex-1">{label}</span>
            <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    className={`h-full rounded-full ${percentage >= 80
                        ? "bg-green-500"
                        : percentage >= 50
                            ? "bg-amber-500"
                            : "bg-red-500"
                        }`}
                />
            </div>
            <span className="text-sm font-medium w-8 text-right">
                +{score}
            </span>
        </div>
    );
}
