"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Coins, Loader2, Search, Swords, UserPlus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

// 发起决斗的一次性费用（积分），覆盖整场裁判 AI 开销（方案 C）
const DUEL_CREATION_FEE = 100;

interface Profile {
    id: string;
    username: string;
    avatar_url?: string;
    reputation_score?: number;
}

interface CreateDuelDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    currentUser: Profile | null;
    defaultTopic?: string;
    postId?: string;
}

export function CreateDuelDialog({
    open,
    onOpenChange,
    currentUser,
    defaultTopic = "",
    postId,
}: CreateDuelDialogProps) {
    const router = useRouter();
    const [topic, setTopic] = useState(defaultTopic);
    const [description, setDescription] = useState("");
    const [position, setPosition] = useState("正方");
    const [maxRounds, setMaxRounds] = useState("5");
    const [searchTerm, setSearchTerm] = useState("");
    const [searchResults, setSearchResults] = useState<Profile[]>([]);
    const [selectedOpponent, setSelectedOpponent] = useState<Profile | null>(null);
    const [isSearching, setIsSearching] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [creditBalance, setCreditBalance] = useState<number | null>(null);

    const supabase = createClient();

    // 打开对话框时获取当前用户积分余额（用于展示费用提示）
    useEffect(() => {
        if (!open || !currentUser?.id) {
            setCreditBalance(null);
            return;
        }

        let cancelled = false;
        (async () => {
            const { data, error } = await supabase
                .from("user_credits")
                .select("balance")
                .eq("user_id", currentUser.id)
                .single();

            if (!cancelled) {
                setCreditBalance(error || !data ? 0 : data.balance);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [open, currentUser?.id]);

    const insufficientCredits = creditBalance !== null && creditBalance < DUEL_CREATION_FEE;

    // 搜索用户
    const handleSearch = async () => {
        if (!searchTerm.trim()) return;

        setIsSearching(true);
        try {
            const { data } = await supabase.rpc("search_users", {
                search_term: searchTerm,
            });

            // 过滤掉自己
            const filtered = (data || []).filter(
                (user: Profile) => user.id !== currentUser?.id
            );
            setSearchResults(filtered);
        } catch (error) {
            console.error("Search error:", error);
            toast.error("搜索失败");
        } finally {
            setIsSearching(false);
        }
    };

    // 创建决斗
    const handleCreate = async () => {
        if (!currentUser) {
            toast.error("请先登录");
            return;
        }

        if (!topic.trim()) {
            toast.error("请输入辩题");
            return;
        }

        if (!selectedOpponent) {
            toast.error("请选择对手");
            return;
        }

        setIsCreating(true);
        try {
            // 原子创建决斗 + 邀请 + 扣发起费（SECURITY DEFINER RPC）
            const { data, error: rpcError } = await supabase.rpc(
                "create_duel_with_fee",
                {
                    p_topic: topic.trim(),
                    p_description: description.trim() || null,
                    p_position: position,
                    p_max_rounds: parseInt(maxRounds),
                    p_opponent_id: selectedOpponent.id,
                    p_post_id: postId || null,
                    p_fee: DUEL_CREATION_FEE,
                }
            );

            if (rpcError) throw rpcError;

            const result = data as {
                success: boolean;
                duel_id?: string;
                fee?: number;
                error?: string;
            };

            if (!result.success) {
                const errorMessages: Record<string, string> = {
                    INVALID_TOPIC: "请输入辩题",
                    INVALID_OPPONENT: "请选择对手",
                    INVALID_MAX_ROUNDS: "回合数无效",
                    INVALID_POSITION: "立场无效",
                    OPPONENT_NOT_FOUND: "对手不存在",
                    INSUFFICIENT_CREDITS: "积分不足，无法发起决斗",
                };
                throw new Error(errorMessages[result.error ?? ""] ?? "发起决斗失败");
            }

            toast.success("决斗邀请已发送！");
            onOpenChange(false);
            router.refresh();

            // 重置表单
            setTopic(defaultTopic);
            setDescription("");
            setPosition("正方");
            setMaxRounds("5");
            setSearchTerm("");
            setSearchResults([]);
            setSelectedOpponent(null);
        } catch (error: any) {
            console.error("Create duel error:", error);
            const msg = error?.message || "创建决斗失败";
            const details = error?.details || "";
            const hint = error?.hint || "";
            toast.error(`${msg} ${details} ${hint}`);
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Swords className="h-5 w-5 text-primary" />
                        发起学术决斗
                    </DialogTitle>
                    <DialogDescription>
                        选择一个争议性学术话题，邀请对手进行一场公开的学术辩论！
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* 辩题 */}
                    <div className="space-y-2">
                        <Label htmlFor="topic">辩题 *</Label>
                        <Input
                            id="topic"
                            placeholder="例如：Transformer 架构是否已达瓶颈？"
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                        />
                    </div>

                    {/* 辩题描述 */}
                    <div className="space-y-2">
                        <Label htmlFor="description">补充说明（可选）</Label>
                        <Textarea
                            id="description"
                            placeholder="对辩题的进一步解释或限定条件..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={2}
                        />
                    </div>

                    {/* 立场和回合数 */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>你的立场</Label>
                            <Select value={position} onValueChange={setPosition}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="正方">正方（支持）</SelectItem>
                                    <SelectItem value="反方">反方（反对）</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>回合数</Label>
                            <Select value={maxRounds} onValueChange={setMaxRounds}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="3">3 回合（快速）</SelectItem>
                                    <SelectItem value="5">5 回合（标准）</SelectItem>
                                    <SelectItem value="7">7 回合（深度）</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* 选择对手 */}
                    <div className="space-y-2">
                        <Label>邀请对手 *</Label>

                        {selectedOpponent ? (
                            <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-10 w-10">
                                        <AvatarImage src={selectedOpponent.avatar_url} />
                                        <AvatarFallback>
                                            {selectedOpponent.username?.slice(0, 2).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-medium">
                                            {selectedOpponent.username}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            学术学者
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setSelectedOpponent(null)}
                                >
                                    更换
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="搜索用户名..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                                    />
                                    <Button
                                        variant="outline"
                                        onClick={handleSearch}
                                        disabled={isSearching}
                                    >
                                        {isSearching ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Search className="h-4 w-4" />
                                        )}
                                    </Button>
                                </div>

                                {searchResults.length > 0 && (
                                    <div className="border rounded-lg max-h-40 overflow-y-auto">
                                        {searchResults.map((user) => (
                                            <button
                                                key={user.id}
                                                className="w-full flex items-center gap-3 p-2 hover:bg-muted transition-colors"
                                                onClick={() => {
                                                    setSelectedOpponent(user);
                                                    setSearchResults([]);
                                                    setSearchTerm("");
                                                }}
                                            >
                                                <Avatar className="h-8 w-8">
                                                    <AvatarImage src={user.avatar_url} />
                                                    <AvatarFallback>
                                                        {user.username?.slice(0, 2).toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="text-left">
                                                    <p className="text-sm font-medium">
                                                        {user.username}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        信誉分: {user.reputation_score ?? 100}
                                                    </p>
                                                </div>
                                                <UserPlus className="h-4 w-4 ml-auto text-muted-foreground" />
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        取消
                    </Button>
                    <Button
                        onClick={handleCreate}
                        disabled={isCreating || !topic.trim() || !selectedOpponent}
                    >
                        {isCreating ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                            <Swords className="h-4 w-4 mr-2" />
                        )}
                        发起决斗
                    </Button>
                </DialogFooter>

                {/* 费用提示 */}
                <div className="flex items-center justify-between px-6 pb-4 -mt-2">
                    <div className="flex items-center gap-2 text-sm">
                        <Coins className="h-4 w-4 text-yellow-500" />
                        <span className="text-muted-foreground">
                            发起决斗消耗
                            <span className="font-semibold text-foreground mx-1">
                                {DUEL_CREATION_FEE}
                            </span>
                            积分（覆盖裁判 AI 成本）
                        </span>
                    </div>
                    {creditBalance !== null && (
                        <span className={`text-xs ${insufficientCredits ? "text-destructive font-medium" : "text-muted-foreground"}`}>
                            {insufficientCredits ? "积分不足" : `余额 ${creditBalance}`}
                        </span>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
