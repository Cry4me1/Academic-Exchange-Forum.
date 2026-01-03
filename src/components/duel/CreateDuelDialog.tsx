"use client";

import { useState } from "react";
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
import { Loader2, Search, Swords, UserPlus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Profile {
    id: string;
    username: string;
    full_name?: string;
    avatar_url?: string;
    reputation_score?: number;
}

interface CreateDuelDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    currentUser: Profile | null;
    defaultTopic?: string;
}

export function CreateDuelDialog({
    open,
    onOpenChange,
    currentUser,
    defaultTopic = "",
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

    const supabase = createClient();

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
            // 创建决斗
            const { data: duel, error: duelError } = await supabase
                .from("duels")
                .insert({
                    topic: topic.trim(),
                    description: description.trim() || null,
                    challenger_id: currentUser.id,
                    challenger_position: position,
                    opponent_id: selectedOpponent.id, // Add this to ensure RLS visibility
                    opponent_position: position === "正方" ? "反方" : "正方",
                    max_rounds: parseInt(maxRounds),
                    current_turn_user_id: currentUser.id, // 挑战者先手
                })
                .select("id")
                .single();

            if (duelError) throw duelError;

            // 创建邀请
            const { error: inviteError } = await supabase
                .from("duel_invitations")
                .insert({
                    duel_id: duel.id,
                    invitee_id: selectedOpponent.id,
                });

            if (inviteError) throw inviteError;

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
                                            {selectedOpponent.full_name || selectedOpponent.username}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            @{selectedOpponent.username}
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
                                                        {user.full_name || user.username}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        @{user.username}
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
            </DialogContent>
        </Dialog>
    );
}
