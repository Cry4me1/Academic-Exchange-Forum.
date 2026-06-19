"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Loader2, Coins } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface Player {
    id: string;
    username: string;
    avatar_url?: string;
    position: string;
}

interface SpectatorBetPanelProps {
    duelId: string;
    challenger: Player;
    opponent: Player;
    userReputation: number;
    onBetSuccess?: () => void;
}

export function SpectatorBetPanel({ duelId, challenger, opponent, userReputation, onBetSuccess }: SpectatorBetPanelProps) {
    const [targetId, setTargetId] = useState<string | null>(null);
    const [amount, setAmount] = useState<string>("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [hasBet, setHasBet] = useState(false);

    const handleBet = async () => {
        if (!targetId) {
            toast.error("请选择要押注的选手");
            return;
        }

        const betAmount = parseInt(amount, 10);
        if (isNaN(betAmount) || betAmount <= 0) {
            toast.error("请输入有效的下注金额");
            return;
        }

        if (betAmount > userReputation) {
            toast.error("信誉分余额不足");
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch("/api/duel/bet", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    duelId,
                    targetId,
                    amount: betAmount,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                toast.error(data.error || "下注失败");
                if (data.error === "您已对本场决斗进行过下注") {
                    setHasBet(true);
                }
                return;
            }

            toast.success(`成功下注 ${betAmount} 信誉分！`);
            setHasBet(true);
            if (onBetSuccess) {
                onBetSuccess();
            }
        } catch (error) {
            console.error(error);
            toast.error("网络错误，下注失败");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (hasBet) {
        return (
            <Card className="bg-primary/5 border-primary/20">
                <CardContent className="py-6 text-center">
                    <Coins className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                    <h3 className="font-semibold text-lg">您已下注</h3>
                    <p className="text-sm text-muted-foreground">静待对决结果揭晓，获胜可赢取双倍奖励！</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                    <Coins className="h-5 w-5 text-yellow-500" />
                    学术竞猜
                </CardTitle>
                <CardDescription>
                    当前信誉分: <strong className="text-primary">{userReputation}</strong>
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        {/* 挑战者 */}
                        <div 
                            className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                                targetId === challenger.id 
                                ? "border-blue-500 bg-blue-500/10" 
                                : "border-border/40 hover:border-blue-500/50"
                            }`}
                            onClick={() => setTargetId(challenger.id)}
                        >
                            <div className="flex flex-col items-center text-center gap-2">
                                <Avatar className="h-10 w-10">
                                    <AvatarImage src={challenger.avatar_url} />
                                    <AvatarFallback>{challenger.username?.substring(0, 2).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-medium text-sm line-clamp-1">{challenger.username}</p>
                                    <Badge variant="outline" className="text-[10px] bg-blue-500/5 text-blue-600 mt-1 border-none">
                                        {challenger.position}
                                    </Badge>
                                </div>
                            </div>
                        </div>

                        {/* 对手 */}
                        <div 
                            className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                                targetId === opponent.id 
                                ? "border-red-500 bg-red-500/10" 
                                : "border-border/40 hover:border-red-500/50"
                            }`}
                            onClick={() => setTargetId(opponent.id)}
                        >
                            <div className="flex flex-col items-center text-center gap-2">
                                <Avatar className="h-10 w-10">
                                    <AvatarImage src={opponent.avatar_url} />
                                    <AvatarFallback>{opponent.username?.substring(0, 2).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-medium text-sm line-clamp-1">{opponent.username}</p>
                                    <Badge variant="outline" className="text-[10px] bg-red-500/5 text-red-600 mt-1 border-none">
                                        {opponent.position}
                                    </Badge>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2 pt-2">
                        <div className="flex items-center gap-2">
                            <Input 
                                type="number" 
                                placeholder="输入下注金额" 
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                min="1"
                                max={userReputation}
                            />
                            <Button 
                                variant="secondary" 
                                onClick={() => setAmount(Math.min(userReputation, 50).toString())}
                            >
                                All In
                            </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            下注立即扣除信誉分，押中将返还本金并赢取一倍奖励。
                        </p>
                    </div>

                    <Button 
                        className="w-full" 
                        onClick={handleBet} 
                        disabled={isSubmitting || !targetId || !amount}
                    >
                        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        {isSubmitting ? "正在下注..." : "确认下注"}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
