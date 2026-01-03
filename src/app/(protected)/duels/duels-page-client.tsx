"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Swords,
    Trophy,
    Clock,
    Eye,
    Plus,
    Zap,
    ArrowRight,
    CheckCircle,
    XCircle,
    ArrowLeft,
} from "lucide-react";
import { ReputationBadgeCompact } from "@/components/duel/ReputationBadge";
import { CreateDuelDialog } from "@/components/duel/CreateDuelDialog";
import { formatDistanceToNow } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { acceptDuel, rejectDuel, cancelDuel, deleteDuel } from "./actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface Profile {
    id: string;
    username: string;
    full_name?: string;
    avatar_url?: string;
    reputation_score?: number;
}

interface Duel {
    id: string;
    topic: string;
    description?: string;
    status: string;
    challenger_score: number;
    opponent_score: number;
    current_round?: number;
    max_rounds?: number;
    ko_type?: string;
    created_at?: string;
    ended_at?: string;
    current_turn_user_id?: string;
    challenger_id: string; // Add this
    opponent_id?: string; // Add this
    challenger: Profile;
    opponent?: Profile;
    winner?: { id: string; username: string };
}

interface Invitation {
    id: string;
    created_at: string;
    duel: {
        id: string;
        topic: string;
        description?: string;
        challenger_position: string;
        max_rounds: number;
        challenger: Profile;
    };
}

interface DuelsPageClientProps {
    activeDuels: Duel[];
    recentCompletedDuels: Duel[];
    myDuels: Duel[];
    pendingInvitations: Invitation[];
    currentUser: Profile | null;
}

export default function DuelsPageClient({
    activeDuels,
    recentCompletedDuels,
    myDuels,
    pendingInvitations,
    currentUser,
}: DuelsPageClientProps) {

    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    // 实时监听决斗更新
    useEffect(() => {
        const channel = supabase
            .channel('duels-page-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'duels'
                },
                () => {
                    router.refresh();
                }
            )
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'duel_invitations'
                },
                () => {
                    router.refresh();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [router, supabase]);

    const handleAccept = async (duelId: string, invitationId: string) => {
        const result = await acceptDuel(duelId, invitationId);
        if (result.error) toast.error(result.error);
        else {
            toast.success("已接受决斗！");
            router.push(`/duels/${duelId}`);
            router.refresh(); // Refresh as well to ensure data is consistent if push is client-side navigation
        }
    };

    const handleReject = async (duelId: string, invitationId: string) => {
        if (!confirm("确定要拒绝这场决斗吗？")) return;
        const result = await rejectDuel(duelId, invitationId);
        if (result.error) toast.error(result.error);
        else {
            toast.success("已拒绝决斗");
            router.refresh();
        }
    };

    const handleCancel = async (duelId: string) => {
        if (!confirm("确定要取消这场决斗吗？")) return;
        const result = await cancelDuel(duelId);
        if (result.error) toast.error(result.error);
        else {
            toast.success("决斗已取消");
            router.refresh();
        }
    };

    const handleDelete = async (duelId: string) => {
        if (!confirm("确定要删除这条记录吗？")) return;
        const result = await deleteDuel(duelId);
        if (result.error) toast.error(result.error);
        else {
            toast.success("记录已删除");
            router.refresh();
        }
    };

    const renderDuelCard = (duel: Duel, showActions = false) => {
        const isMyTurn = currentUser && duel.current_turn_user_id === currentUser.id;

        return (
            <Card
                key={duel.id}
                className="hover:shadow-lg transition-all duration-300 border-border/50 overflow-hidden"
            >
                <CardContent className="p-0">
                    <Link href={`/duels/${duel.id}`}>
                        <div className="p-4">
                            {/* 状态和回合 */}
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    {duel.status === "active" && (
                                        <Badge variant="default" className="bg-green-500/10 text-green-600 border-green-500/30">
                                            <span className="animate-pulse mr-1">●</span> 进行中
                                        </Badge>
                                    )}
                                    {duel.status === "pending" && (
                                        <Badge variant="secondary">等待对手</Badge>
                                    )}
                                    {duel.status === "completed" && (
                                        <Badge variant="outline">
                                            {duel.ko_type ? "KO 结束" : "已完成"}
                                        </Badge>
                                    )}
                                    {isMyTurn && (
                                        <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/30">
                                            轮到你了！
                                        </Badge>
                                    )}
                                </div>
                                {duel.current_round !== undefined && duel.max_rounds && (
                                    <span className="text-xs text-muted-foreground">
                                        第 {duel.current_round}/{duel.max_rounds} 回合
                                    </span>
                                )}
                            </div>

                            {/* 辩题 */}
                            <h3 className="font-semibold text-lg mb-4 line-clamp-2">{duel.topic}</h3>

                            {/* VS 对战展示 */}
                            <div className="flex items-center justify-between gap-4">
                                {/* 挑战者 */}
                                <div className="flex-1 text-center">
                                    <Avatar className="h-12 w-12 mx-auto mb-2 ring-2 ring-blue-500/20">
                                        <AvatarImage src={duel.challenger?.avatar_url} />
                                        <AvatarFallback className="bg-blue-500/10 text-blue-600">
                                            {duel.challenger?.username?.slice(0, 2).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <p className="text-sm font-medium truncate">
                                        {duel.challenger?.full_name || duel.challenger?.username}
                                    </p>
                                    {duel.challenger?.reputation_score !== undefined && (
                                        <ReputationBadgeCompact score={duel.challenger.reputation_score} />
                                    )}
                                    <p className="text-2xl font-bold text-blue-600 mt-1">
                                        {duel.challenger_score}
                                    </p>
                                    {/* 取消按钮：仅发起者且pending状态可见 */}
                                    {duel.status === "pending" && currentUser?.id === duel.challenger_id && showActions && (
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            className="mt-2 h-7 text-xs"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                handleCancel(duel.id);
                                            }}
                                        >
                                            取消决斗
                                        </Button>
                                    )}
                                </div>

                                {/* VS */}
                                <div className="flex flex-col items-center">
                                    <Swords className="h-8 w-8 text-muted-foreground mb-1" />
                                    <span className="text-xs text-muted-foreground font-medium">VS</span>
                                </div>

                                {/* 对手 */}
                                <div className="flex-1 text-center">
                                    {duel.opponent ? (
                                        <>
                                            <Avatar className="h-12 w-12 mx-auto mb-2 ring-2 ring-red-500/20">
                                                <AvatarImage src={duel.opponent?.avatar_url} />
                                                <AvatarFallback className="bg-red-500/10 text-red-600">
                                                    {duel.opponent?.username?.slice(0, 2).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <p className="text-sm font-medium truncate">
                                                {duel.opponent?.full_name || duel.opponent?.username}
                                            </p>
                                            {duel.opponent?.reputation_score !== undefined && (
                                                <ReputationBadgeCompact score={duel.opponent.reputation_score} />
                                            )}
                                            <p className="text-2xl font-bold text-red-600 mt-1">
                                                {duel.opponent_score}
                                            </p>
                                        </>
                                    ) : (
                                        <div className="opacity-50">
                                            <div className="h-12 w-12 mx-auto mb-2 rounded-full bg-muted border-2 border-dashed flex items-center justify-center">
                                                <span className="text-xl">?</span>
                                            </div>
                                            <p className="text-sm">等待对手</p>
                                        </div>
                                    )}
                                </div>
                                {/* 删除按钮：已取消状态可见 */}
                                {(duel.status === "cancelled" || duel.status === "declined") && (currentUser?.id === duel.challenger_id || currentUser?.id === duel.opponent_id) && showActions && (
                                    <div className="absolute top-2 right-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                handleDelete(duel.id);
                                            }}
                                        >
                                            <XCircle className="h-4 w-4" />
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 底部信息 */}
                        <div className="bg-muted/30 px-4 py-2 flex items-center justify-between text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {duel.created_at && formatDistanceToNow(new Date(duel.created_at))}
                            </div>
                            <div className="flex items-center gap-1">
                                <Eye className="h-3 w-3" />
                                观战
                                <ArrowRight className="h-3 w-3" />
                            </div>
                        </div>
                    </Link>
                </CardContent>
            </Card>
        );
    };

    const renderInvitationCard = (invitation: Invitation) => {
        if (!invitation.duel) return null;

        return (
            <Card key={invitation.id} className="border-amber-500/30 bg-amber-500/5">
                <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                                <AvatarImage src={invitation.duel.challenger?.avatar_url} />
                                <AvatarFallback>
                                    {invitation.duel.challenger?.username?.slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-medium">
                                    {invitation.duel.challenger?.full_name || invitation.duel.challenger?.username}
                                    <span className="text-muted-foreground font-normal"> 向你发起决斗！</span>
                                </p>
                                <p className="text-sm text-muted-foreground mt-1">
                                    辩题: {invitation.duel.topic}
                                </p>
                                <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                                    <Badge variant="outline" className="text-xs">
                                        对方立场: {invitation.duel.challenger_position}
                                    </Badge>
                                    <span>{invitation.duel.max_rounds} 回合</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-2 shrink-0">
                            <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 border-red-500/30"
                                onClick={() => handleReject(invitation.duel.id, invitation.id)}
                            >
                                <XCircle className="h-4 w-4 mr-1" />
                                拒绝
                            </Button>
                            <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => handleAccept(invitation.duel.id, invitation.id)}
                            >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                接受
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
            {/* 顶部导航 */}
            <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <Link href="/dashboard">
                            <Button variant="ghost" size="sm" className="gap-2">
                                <ArrowLeft className="h-4 w-4" />
                                返回
                            </Button>
                        </Link>

                        <div className="flex items-center gap-2">
                            <Swords className="h-6 w-6 text-primary" />
                            <h1 className="text-xl font-bold">学术决斗场</h1>
                        </div>

                        <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
                            <Plus className="h-4 w-4" />
                            发起决斗
                        </Button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* 待处理邀请 */}
                {pendingInvitations.length > 0 && (
                    <motion.section
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-8"
                    >
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Zap className="h-5 w-5 text-amber-500" />
                            待处理的决斗邀请
                            <Badge variant="destructive" className="ml-2">{pendingInvitations.length}</Badge>
                        </h2>
                        <div className="space-y-4">
                            {pendingInvitations.map(renderInvitationCard)}
                        </div>
                    </motion.section>
                )}

                <Tabs defaultValue="active" className="space-y-6">
                    <TabsList>
                        <TabsTrigger value="active" className="gap-2">
                            <span className="animate-pulse text-green-500">●</span>
                            进行中 ({activeDuels.length})
                        </TabsTrigger>
                        <TabsTrigger value="mine" className="gap-2">
                            我的决斗 ({myDuels.length})
                        </TabsTrigger>
                        <TabsTrigger value="completed" className="gap-2">
                            <Trophy className="h-4 w-4" />
                            历史战绩
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="active">
                        {activeDuels.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {activeDuels.map((duel) => renderDuelCard(duel))}
                            </div>
                        ) : (
                            <Card className="text-center py-12">
                                <CardContent>
                                    <Swords className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                                    <p className="text-muted-foreground">暂无进行中的决斗</p>
                                    <p className="text-sm text-muted-foreground/70 mt-1">
                                        成为第一个发起决斗的人！
                                    </p>
                                    <Button className="mt-4" onClick={() => setCreateDialogOpen(true)}>
                                        <Plus className="h-4 w-4 mr-2" />
                                        发起决斗
                                    </Button>
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>

                    <TabsContent value="mine">
                        {myDuels.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {myDuels.map((duel) => renderDuelCard(duel, true))}
                            </div>
                        ) : (
                            <Card className="text-center py-12">
                                <CardContent>
                                    <p className="text-muted-foreground">你还没有参与任何决斗</p>
                                    <Button className="mt-4" onClick={() => setCreateDialogOpen(true)}>
                                        <Plus className="h-4 w-4 mr-2" />
                                        发起你的第一场决斗
                                    </Button>
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>

                    <TabsContent value="completed">
                        {recentCompletedDuels.length > 0 ? (
                            <div className="space-y-4">
                                {recentCompletedDuels.map((duel) => (
                                    <Card key={duel.id} className="overflow-hidden">
                                        <Link href={`/duels/${duel.id}`}>
                                            <CardContent className="p-4">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-4">
                                                        <div className="flex items-center gap-2">
                                                            <Avatar className="h-8 w-8">
                                                                <AvatarImage src={duel.challenger?.avatar_url} />
                                                                <AvatarFallback>
                                                                    {duel.challenger?.username?.slice(0, 2).toUpperCase()}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <span className={duel.winner?.id === duel.challenger?.id ? "font-bold text-green-600" : ""}>
                                                                {duel.challenger?.username}
                                                            </span>
                                                            <span className="text-lg font-bold">{duel.challenger_score}</span>
                                                        </div>
                                                        <span className="text-muted-foreground">vs</span>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-lg font-bold">{duel.opponent_score}</span>
                                                            <span className={duel.winner?.id === duel.opponent?.id ? "font-bold text-green-600" : ""}>
                                                                {duel.opponent?.username}
                                                            </span>
                                                            <Avatar className="h-8 w-8">
                                                                <AvatarImage src={duel.opponent?.avatar_url} />
                                                                <AvatarFallback>
                                                                    {duel.opponent?.username?.slice(0, 2).toUpperCase()}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-medium line-clamp-1">{duel.topic}</p>
                                                        {duel.ko_type && (
                                                            <Badge variant="destructive" className="mt-1">
                                                                KO
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Link>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <Card className="text-center py-12">
                                <CardContent>
                                    <Trophy className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                                    <p className="text-muted-foreground">暂无已完成的决斗</p>
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>
                </Tabs>
            </main>

            {/* 创建决斗对话框 */}
            <CreateDuelDialog
                open={createDialogOpen}
                onOpenChange={setCreateDialogOpen}
                currentUser={currentUser}
            />
        </div>
    );
}
