"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    ArrowLeft,
    Swords,
    Trophy,
    Send,
    Loader2,
    AlertTriangle,
    CheckCircle,
    Star,
    Zap,
    BookOpen,
    Brain,
} from "lucide-react";
import { ReputationBadge } from "@/components/duel/ReputationBadge";
import { DuelScoreCard } from "@/components/duel/DuelScoreCard";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { formatDistanceToNow } from "@/lib/utils";
import NovelEditor from "@/components/editor/NovelEditor";
import NovelViewer from "@/components/editor/NovelViewer";

interface Profile {
    id: string;
    username: string;
    full_name?: string;
    avatar_url?: string;
    reputation_score?: number;
    duel_wins?: number;
    duel_losses?: number;
}

interface DuelRound {
    id: string;
    duel_id: string;
    round_number: number;
    author_id: string;
    content: object;
    content_text?: string;
    evidence_score: number;
    citation_score: number;
    logic_score: number;
    fallacy_penalty: number;
    total_score: number;
    has_fallacy: boolean;
    fallacy_type?: string;
    ai_analysis?: string;
    ai_analyzed_at?: string;
    created_at: string;
    author: Profile;
}

interface Duel {
    id: string;
    topic: string;
    description?: string;
    status: string;
    challenger_id: string;
    opponent_id?: string;
    winner_id?: string;
    challenger_score: number;
    opponent_score: number;
    challenger_position: string;
    opponent_position: string;
    max_rounds: number;
    current_round: number;
    current_turn_user_id?: string;
    ko_type?: string;
    ko_reason?: string;
    created_at: string;
    started_at?: string;
    ended_at?: string;
    challenger: Profile;
    opponent?: Profile;
    winner?: { id: string; username: string };
}

interface DuelDetailClientProps {
    duel: Duel;
    rounds: DuelRound[];
    currentUser: Profile | null;
    isParticipant: boolean;
    isMyTurn: boolean;
}

export default function DuelDetailClient({
    duel: initialDuel,
    rounds: initialRounds,
    currentUser,
    isParticipant,
    isMyTurn: initialIsMyTurn,
}: DuelDetailClientProps) {
    const [currentDuel, setCurrentDuel] = useState<Duel>(initialDuel);
    const [rounds, setRounds] = useState<DuelRound[]>(initialRounds);
    const [isMyTurn, setIsMyTurn] = useState(initialIsMyTurn);
    const [editorContent, setEditorContent] = useState<object | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const [supabase] = useState(() => createClient());
    const processedIds = useRef(new Set(initialRounds.map(r => r.id)));

    // 实时监听
    useEffect(() => {
        const channel = supabase
            .channel(`duel-game-${currentDuel.id}`)
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "duel_rounds",
                    filter: `duel_id=eq.${currentDuel.id}`,
                },
                async (payload) => {
                    if (payload.eventType === "INSERT") {
                        // Check duplicate immediately
                        if (processedIds.current.has(payload.new.id)) return;
                        processedIds.current.add(payload.new.id);

                        // 获取完整的回合数据
                        const { data: newRound } = await supabase
                            .from("duel_rounds")
                            .select(`
                                *,
                                author:profiles!author_id (
                                    id, username, full_name, avatar_url
                                )
                            `)
                            .eq("id", payload.new.id)
                            .single();

                        if (newRound) {
                            setRounds((prev) => {
                                // Double safety check
                                if (prev.some(r => r.id === newRound.id)) return prev;
                                return [...prev, newRound];
                            });
                        }
                    } else if (payload.eventType === "UPDATE") {
                        setRounds((prev) =>
                            prev.map((r) =>
                                r.id === payload.new.id ? { ...r, ...payload.new } : r
                            )
                        );
                    }
                }
            )
            .on(
                "postgres_changes",
                {
                    event: "UPDATE",
                    schema: "public",
                    table: "duels",
                    filter: `id=eq.${currentDuel.id}`,
                },
                async (payload) => {
                    // 当收到更新通知时，重新获取完整的决斗数据，以确保关联数据（如 winner, opponent）正确加载
                    const { data: updatedDuel } = await supabase
                        .from("duels")
                        .select(`
                            *,
                            challenger:profiles!challenger_id(
                                id, username, full_name, avatar_url, reputation_score, duel_wins, duel_losses
                            ),
                            opponent:profiles!opponent_id(
                                id, username, full_name, avatar_url, reputation_score, duel_wins, duel_losses
                            ),
                            winner:profiles!winner_id(
                                id, username
                            )
                        `)
                        .eq("id", currentDuel.id)
                        .single();

                    if (updatedDuel) {
                        setCurrentDuel(updatedDuel as unknown as Duel);

                        // Update turn state
                        if (currentUser && updatedDuel.current_turn_user_id) {
                            setIsMyTurn(updatedDuel.current_turn_user_id === currentUser.id);
                        }
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [currentDuel.id, supabase, currentUser]);

    // 提取纯文本
    const extractTextFromContent = (content: object): string => {
        let text = "";
        const traverse = (node: Record<string, unknown>) => {
            if (node.type === "text" && typeof node.text === "string") {
                text += node.text + " ";
            }
            if (node.content && Array.isArray(node.content)) {
                node.content.forEach(traverse);
            }
        };

        const contentObj = content as Record<string, unknown>;
        if (contentObj.content && Array.isArray(contentObj.content)) {
            contentObj.content.forEach(traverse);
        }

        return text.trim();
    };

    // 提交论点
    const handleSubmit = async () => {
        if (!currentUser || !editorContent) {
            toast.error("请先输入你的论点");
            return;
        }

        if (!isMyTurn) {
            toast.error("还没轮到你");
            return;
        }

        setIsSubmitting(true);

        try {
            const contentText = extractTextFromContent(editorContent);
            const currentRoundNumber = Math.floor(rounds.length / 2) + 1;

            // 1. 创建回合记录
            const { data: round, error } = await supabase
                .from("duel_rounds")
                .insert({
                    duel_id: currentDuel.id,
                    round_number: currentRoundNumber,
                    author_id: currentUser.id,
                    content: editorContent,
                    content_text: contentText,
                })
                .select("id")
                .single();

            if (error) throw error;

            // 2. 调用 AI 分析
            setIsAnalyzing(true);
            toast.info("AI 裁判正在分析你的论点...");

            let roundTotalScore = 0;

            const response = await fetch("/api/duel/analyze", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    content: contentText,
                    topic: currentDuel.topic,
                    position: currentUser.id === currentDuel.challenger_id
                        ? currentDuel.challenger_position
                        : currentDuel.opponent_position,
                }),
            });

            if (response.ok) {
                const reader = response.body?.getReader();
                const decoder = new TextDecoder();
                let result = "";

                while (reader) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    result += decoder.decode(value);
                }

                try {
                    // 解析流式 JSON 结果
                    const scoreData = JSON.parse(result);
                    roundTotalScore = scoreData.totalScore || 0;

                    // 更新回合评分
                    await supabase
                        .from("duel_rounds")
                        .update({
                            evidence_score: scoreData.evidenceScore || 0,
                            citation_score: scoreData.citationScore || 0,
                            logic_score: scoreData.logicScore || 0,
                            fallacy_penalty: scoreData.fallacyPenalty || 0,
                            total_score: roundTotalScore,
                            has_fallacy: scoreData.hasFallacy || false,
                            fallacy_type: scoreData.fallacyType || null,
                            ai_analysis: scoreData.analysis || null,
                            ai_analyzed_at: new Date().toISOString(),
                        })
                        .eq("id", round.id);

                    toast.success(`论点提交成功！得分: ${roundTotalScore}`);
                } catch {
                    console.error("Failed to parse AI response");
                }
            }

            // 3. 更新决斗状态 (分数, 回合, 结束判定)
            const isChallenger = currentUser.id === currentDuel.challenger_id;
            const newChallengerScore = isChallenger
                ? currentDuel.challenger_score + roundTotalScore
                : currentDuel.challenger_score;
            const newOpponentScore = !isChallenger
                ? currentDuel.opponent_score + roundTotalScore
                : currentDuel.opponent_score;

            // Check if game is over (Max rounds reached for both sides)
            // rounds.length was the count BEFORE this insert. Now it is rounds.length + 1 effectively.
            // Actually `rounds` state might not have updated yet here, so let's use rounds.length + 1.
            const totalTurnsPlayed = rounds.length + 1;
            const maxTurns = currentDuel.max_rounds * 2;
            const isGameOver = totalTurnsPlayed >= maxTurns;

            const updatePayload: any = {
                challenger_score: newChallengerScore,
                opponent_score: newOpponentScore,
            };

            if (isGameOver) {
                updatePayload.status = "completed";
                updatePayload.ended_at = new Date().toISOString();

                // Determine winner
                if (newChallengerScore > newOpponentScore) {
                    updatePayload.winner_id = currentDuel.challenger_id;
                } else if (newOpponentScore > newChallengerScore && currentDuel.opponent_id) {
                    updatePayload.winner_id = currentDuel.opponent_id;
                } else {
                    // Tie - logic can be defined. For now maybe no winner set or custom handle?
                    // Let's assume draw is possible or just leave winner_id null.
                }

                toast.success("决斗结束！正在生成总结...");
            } else {
                updatePayload.current_round = currentRoundNumber;
                updatePayload.current_turn_user_id = isChallenger
                    ? currentDuel.opponent_id
                    : currentDuel.challenger_id;
            }

            await supabase
                .from("duels")
                .update(updatePayload)
                .eq("id", currentDuel.id);

            setIsMyTurn(false);
            setEditorContent(null);
        } catch (error) {
            console.error("Submit error:", error);
            toast.error("提交失败");
        } finally {
            setIsSubmitting(false);
            setIsAnalyzing(false);
        }
    };

    // 获取用户角色
    const getUserRole = (userId: string) => {
        if (userId === currentDuel.challenger_id) return "challenger";
        if (userId === currentDuel.opponent_id) return "opponent";
        return "spectator";
    };

    const myRole = currentUser ? getUserRole(currentUser.id) : "spectator";
    const myPosition = myRole === "challenger" ? currentDuel.challenger_position : currentDuel.opponent_position;

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
            {/* 顶部导航 */}
            <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <Link href="/duels">
                            <Button variant="ghost" size="sm" className="gap-2">
                                <ArrowLeft className="h-4 w-4" />
                                返回决斗场
                            </Button>
                        </Link>

                        <div className="flex items-center gap-2">
                            {currentDuel.status === "active" && (
                                <Badge variant="default" className="bg-green-500/10 text-green-600 border-green-500/30">
                                    <span className="animate-pulse mr-1">●</span> 进行中
                                </Badge>
                            )}
                            {currentDuel.status === "completed" && (
                                <Badge variant="outline">
                                    {currentDuel.ko_type ? "KO 结束" : "已完成"}
                                </Badge>
                            )}
                            <span className="text-sm text-muted-foreground">
                                第 {currentDuel.current_round}/{currentDuel.max_rounds} 回合
                            </span>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* 辩题 */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-8"
                >
                    <h1 className="text-2xl sm:text-3xl font-bold mb-2">{currentDuel.topic}</h1>
                    {currentDuel.description && (
                        <p className="text-muted-foreground">{currentDuel.description}</p>
                    )}
                </motion.div>

                {/* VS 对战展示 */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="mb-8"
                >
                    <Card className="overflow-hidden">
                        <CardContent className="p-4 sm:p-6">
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6">
                                <div className="flex-1 text-center">
                                    <div className="relative inline-block">
                                        <Avatar className="h-16 w-16 sm:h-20 sm:w-20 mx-auto mb-2 sm:mb-3 ring-4 ring-blue-500/30">
                                            <AvatarImage src={currentDuel.challenger?.avatar_url} />
                                            <AvatarFallback className="bg-blue-500/10 text-blue-600 text-lg sm:text-xl">
                                                {currentDuel.challenger?.username?.slice(0, 2).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        {currentDuel.winner_id === currentDuel.challenger_id && (
                                            <Trophy className="absolute -top-2 -right-2 h-6 w-6 text-yellow-500" />
                                        )}
                                    </div>
                                    <p className="font-semibold text-base sm:text-lg">
                                        {currentDuel.challenger?.full_name || currentDuel.challenger?.username}
                                    </p>
                                    <Badge variant="outline" className="mt-1 bg-blue-500/5 border-blue-500/30 text-blue-600 text-xs sm:text-sm">
                                        {currentDuel.challenger_position}
                                    </Badge>
                                    {currentDuel.challenger?.reputation_score !== undefined && (
                                        <div className="mt-2 hidden sm:block">
                                            <ReputationBadge
                                                score={currentDuel.challenger.reputation_score}
                                                wins={currentDuel.challenger.duel_wins}
                                                losses={currentDuel.challenger.duel_losses}
                                                size="sm"
                                                showStats
                                            />
                                        </div>
                                    )}
                                    <p className="text-3xl sm:text-4xl font-bold text-blue-600 mt-2 sm:mt-3">
                                        {currentDuel.challenger_score}
                                    </p>
                                </div>

                                {/* VS */}
                                <div className="flex flex-col items-center px-2 sm:px-4 py-2 sm:py-0">
                                    <Swords className="h-8 w-8 sm:h-12 sm:w-12 text-muted-foreground mb-1 sm:mb-2" />
                                    <span className="text-base sm:text-lg font-bold text-muted-foreground">VS</span>
                                </div>

                                <div className="flex-1 text-center">
                                    {currentDuel.opponent ? (
                                        <>
                                            <div className="relative inline-block">
                                                <Avatar className="h-16 w-16 sm:h-20 sm:w-20 mx-auto mb-2 sm:mb-3 ring-4 ring-red-500/30">
                                                    <AvatarImage src={currentDuel.opponent?.avatar_url} />
                                                    <AvatarFallback className="bg-red-500/10 text-red-600 text-lg sm:text-xl">
                                                        {currentDuel.opponent?.username?.slice(0, 2).toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                                {currentDuel.winner_id === currentDuel.opponent_id && (
                                                    <Trophy className="absolute -top-2 -right-2 h-6 w-6 text-yellow-500" />
                                                )}
                                            </div>
                                            <p className="font-semibold text-base sm:text-lg">
                                                {currentDuel.opponent?.full_name || currentDuel.opponent?.username}
                                            </p>
                                            <Badge variant="outline" className="mt-1 bg-red-500/5 border-red-500/30 text-red-600 text-xs sm:text-sm">
                                                {currentDuel.opponent_position}
                                            </Badge>
                                            {currentDuel.opponent?.reputation_score !== undefined && (
                                                <div className="mt-2 hidden sm:block">
                                                    <ReputationBadge
                                                        score={currentDuel.opponent.reputation_score}
                                                        wins={currentDuel.opponent.duel_wins}
                                                        losses={currentDuel.opponent.duel_losses}
                                                        size="sm"
                                                        showStats
                                                    />
                                                </div>
                                            )}
                                            <p className="text-3xl sm:text-4xl font-bold text-red-600 mt-2 sm:mt-3">
                                                {currentDuel.opponent_score}
                                            </p>
                                        </>
                                    ) : (
                                        <div className="opacity-50">
                                            <div className="h-20 w-20 mx-auto mb-3 rounded-full bg-muted border-4 border-dashed flex items-center justify-center">
                                                <span className="text-2xl">?</span>
                                            </div>
                                            <p className="text-lg">等待对手加入</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* 回合列表 */}
                <div className="space-y-6 mb-8">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                        <BookOpen className="h-5 w-5" />
                        辩论记录
                    </h2>

                    <AnimatePresence>
                        {rounds.length === 0 ? (
                            <Card className="text-center py-12">
                                <CardContent>
                                    <Swords className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                                    <p className="text-muted-foreground">还没有任何论点提交</p>
                                    {isMyTurn && (
                                        <p className="text-sm text-primary mt-2">轮到你了，发起第一轮攻势吧！</p>
                                    )}
                                </CardContent>
                            </Card>
                        ) : (
                            rounds.map((round, index) => {
                                const isChallenger = round.author_id === currentDuel.challenger_id;
                                const position = isChallenger
                                    ? currentDuel.challenger_position
                                    : currentDuel.opponent_position;

                                return (
                                    <motion.div
                                        key={round.id}
                                        initial={{ opacity: 0, x: isChallenger ? -20 : 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                    >
                                        <Card
                                            className={`overflow-hidden ${isChallenger
                                                ? "border-l-4 border-l-blue-500"
                                                : "border-r-4 border-r-red-500"
                                                }`}
                                        >
                                            <CardHeader className="pb-2">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="h-10 w-10">
                                                            <AvatarImage src={round.author?.avatar_url} />
                                                            <AvatarFallback>
                                                                {round.author?.username?.slice(0, 2).toUpperCase()}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <p className="font-medium">
                                                                {round.author?.full_name || round.author?.username}
                                                            </p>
                                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                                <Badge
                                                                    variant="outline"
                                                                    className={isChallenger
                                                                        ? "bg-blue-500/5 border-blue-500/30 text-blue-600"
                                                                        : "bg-red-500/5 border-red-500/30 text-red-600"
                                                                    }
                                                                >
                                                                    {position}
                                                                </Badge>
                                                                <span>第 {round.round_number} 回合</span>
                                                                <span>·</span>
                                                                <span suppressHydrationWarning>{formatDistanceToNow(new Date(round.created_at))}</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* 评分卡片 */}
                                                    {round.ai_analyzed_at && (
                                                        <DuelScoreCard
                                                            evidenceScore={round.evidence_score}
                                                            citationScore={round.citation_score}
                                                            logicScore={round.logic_score}
                                                            fallacyPenalty={round.fallacy_penalty}
                                                            totalScore={round.total_score}
                                                            hasFallacy={round.has_fallacy}
                                                            fallacyType={round.fallacy_type}
                                                            analysis={round.ai_analysis}
                                                        />
                                                    )}
                                                </div>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="prose prose-sm max-w-none dark:prose-invert">
                                                    <NovelViewer initialValue={round.content as any} />
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                );
                            })
                        )}
                    </AnimatePresence>
                </div>

                {/* 提交论点区域 */}
                {currentDuel.status === "active" && isParticipant && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    {isMyTurn ? (
                                        <>
                                            <Zap className="h-5 w-5 text-amber-500" />
                                            轮到你了！提交你的论点
                                            <Badge className="ml-2">{myPosition}</Badge>
                                        </>
                                    ) : (
                                        <>
                                            <Brain className="h-5 w-5 text-muted-foreground" />
                                            等待对手回应...
                                        </>
                                    )}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {isMyTurn ? (
                                    <div className="space-y-4">
                                        <div className="min-h-[200px] border rounded-lg">
                                            <NovelEditor
                                                initialValue={undefined}
                                                onChange={(content) => setEditorContent(content as object)}
                                            />
                                        </div>
                                        <div className="flex justify-end">
                                            <Button
                                                onClick={handleSubmit}
                                                disabled={isSubmitting || !editorContent}
                                                size="lg"
                                            >
                                                {isSubmitting ? (
                                                    <>
                                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                                        {isAnalyzing ? "AI 裁判分析中..." : "提交中..."}
                                                    </>
                                                ) : (
                                                    <>
                                                        <Send className="h-4 w-4 mr-2" />
                                                        提交论点
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                                        <p>对手正在思考...</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>
                )}

                {/* 决斗结束 */}
                {currentDuel.status === "completed" && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                    >
                        <Card className="border-2 border-primary/30 bg-primary/5">
                            <CardContent className="text-center py-8">
                                <Trophy className="h-16 w-16 mx-auto text-yellow-500 mb-4" />
                                <h2 className="text-2xl font-bold mb-2">决斗结束！</h2>
                                {currentDuel.winner ? (
                                    <p className="text-lg">
                                        🎉 <span className="font-semibold text-primary">{currentDuel.winner.username}</span> 获胜！
                                    </p>
                                ) : (
                                    <p className="text-lg text-muted-foreground">平局！</p>
                                )}
                                {currentDuel.ko_type && (
                                    <Badge variant="destructive" className="mt-2">
                                        <AlertTriangle className="h-3 w-3 mr-1" />
                                        {currentDuel.ko_type === "fallacy_limit" ? "逻辑谬误 KO" : "负分连败 KO"}
                                    </Badge>
                                )}
                                {currentDuel.ko_reason && (
                                    <p className="text-sm text-muted-foreground mt-2">{currentDuel.ko_reason}</p>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>
                )}
            </main>
        </div>
    );
}
