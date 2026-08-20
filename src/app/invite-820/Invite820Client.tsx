"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
    Ticket,
    CheckCircle2,
    Users,
    Sparkles,
    Search,
    Copy,
    Check,
    RefreshCw,
    ExternalLink,
    Flame,
    Lock,
    Clock,
    LayoutGrid,
    Table as TableIcon,
    ArrowRight,
    GraduationCap,
    HelpCircle,
    CheckCircle,
    ChevronRight,
    AlertCircle,
} from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export interface InviteCodePublicItem {
    id: string;
    code: string;
    usage_limit: number;
    used_count: number;
    remaining_uses: number;
    percent_used: number;
    is_active: boolean;
    is_expired: boolean;
    is_available: boolean;
    is_exhausted: boolean;
    expires_at: string | null;
    note: string;
    created_at: string;
}

export interface PublicStatsData {
    totalCapacity: number;
    claimedSeats: number;
    remainingSeats: number;
    activeCodesCount: number;
    exhaustedCodesCount: number;
    totalCodesCount: number;
    claimRate: number;
    lastUpdated: string;
}

interface Props {
    initialCodes?: InviteCodePublicItem[];
    initialStats?: PublicStatsData;
}

export function Invite820Client({ initialCodes = [], initialStats }: Props) {
    const [codes, setCodes] = useState<InviteCodePublicItem[]>(initialCodes);
    const [stats, setStats] = useState<PublicStatsData>(
        initialStats || {
            totalCapacity: 0,
            claimedSeats: 0,
            remainingSeats: 0,
            activeCodesCount: 0,
            exhaustedCodesCount: 0,
            totalCodesCount: 0,
            claimRate: 0,
            lastUpdated: new Date().toISOString(),
        }
    );
    const [isLoading, setIsLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<"all" | "available" | "exhausted" | "inactive">("all");
    const [sortBy, setSortBy] = useState<"remaining" | "latest" | "progress">("remaining");
    const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
    const [copiedCode, setCopiedCode] = useState<string | null>(null);

    // 拉取最新公开数据
    const fetchLatestData = useCallback(async (showToast = false) => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/invite-820", {
                cache: "no-store",
            });
            const data = await res.json();
            if (!res.ok) {
                toast.error(data.error || "刷新数据失败");
                return;
            }
            if (data.codes) {
                setCodes(data.codes);
            }
            if (data.stats) {
                setStats(data.stats);
            }
            if (showToast) {
                toast.success("已同步最新邀请码抢占状态");
            }
        } catch {
            toast.error("网络异常，获取数据失败");
        } finally {
            setIsLoading(false);
        }
    }, []);

    // 复制邀请码
    const handleCopy = (code: string) => {
        navigator.clipboard.writeText(code);
        setCopiedCode(code);
        toast.success(`已复制邀请码: ${code}`, {
            description: "前往注册页面填入即可入驻学术社区",
        });
        setTimeout(() => setCopiedCode(null), 2500);
    };

    // 客户端多维度筛选与排序
    const filteredCodes = useMemo(() => {
        return codes
            .filter((item) => {
                // 1. 搜索过滤
                if (search.trim()) {
                    const q = search.trim().toLowerCase();
                    const matchCode = item.code.toLowerCase().includes(q);
                    const matchNote = item.note.toLowerCase().includes(q);
                    if (!matchCode && !matchNote) return false;
                }

                // 2. 状态过滤
                if (statusFilter === "available") {
                    return item.is_available;
                }
                if (statusFilter === "exhausted") {
                    return item.is_exhausted;
                }
                if (statusFilter === "inactive") {
                    return !item.is_active || item.is_expired;
                }
                return true;
            })
            .sort((a, b) => {
                if (sortBy === "remaining") {
                    // 可用排前，剩余席位多的排前
                    if (a.is_available !== b.is_available) {
                        return a.is_available ? -1 : 1;
                    }
                    return b.remaining_uses - a.remaining_uses;
                }
                if (sortBy === "latest") {
                    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                }
                if (sortBy === "progress") {
                    return b.percent_used - a.percent_used;
                }
                return 0;
            });
    }, [codes, search, statusFilter, sortBy]);

    return (
        <div className="min-h-screen bg-background text-foreground selection:bg-orange-500/20 selection:text-orange-600">
            {/* 顶部极光氛围背景装饰 */}
            <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-orange-500/10 via-amber-500/5 to-transparent pointer-events-none -z-10" />

            {/* 顶栏导航 */}
            <header className="sticky top-0 z-40 w-full border-b border-border/50 bg-background/80 backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2.5 transition-transform hover:scale-[1.02]">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white shadow-md shadow-orange-500/20">
                            <GraduationCap className="w-5 h-5" />
                        </div>
                        <div>
                            <span className="font-bold text-lg tracking-tight text-foreground">Scholarly</span>
                            <span className="text-[10px] ml-1.5 font-mono px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-600 dark:text-amber-400 font-semibold border border-orange-500/20">
                                820 抢兑计划
                            </span>
                        </div>
                    </Link>

                    <div className="flex items-center gap-3">
                        <Link href="/login">
                            <Button variant="ghost" size="sm" className="text-sm">
                                登录
                            </Button>
                        </Link>
                        <Link href="/register">
                            <Button
                                size="sm"
                                className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-medium shadow-sm"
                            >
                                前往注册
                            </Button>
                        </Link>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-10">
                {/* 英雄宣传 Banner */}
                <div className="relative rounded-3xl border border-orange-500/20 bg-gradient-to-br from-card via-card/80 to-orange-500/5 p-6 sm:p-10 shadow-xl shadow-orange-500/5 overflow-hidden">
                    <div className="absolute right-0 top-0 -mt-12 -mr-12 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute left-1/3 bottom-0 -mb-12 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

                    <div className="relative z-10 max-w-3xl space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-orange-500/15 text-orange-600 dark:text-amber-400 border border-orange-500/30">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>820 创世学术通行计划 · 公开先到先得</span>
                        </div>

                        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground">
                            学术邀请码实时抢兑看板
                        </h1>

                        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                            Scholarly 学术论坛正处于前沿内测研讨阶段。初期开放席位完全公开且遵循
                            <strong className="text-foreground font-semibold"> 先到先得 </strong>
                            原则。挑选下方处于活跃状态的邀请码，点击直通注册即可秒速入驻，开启同行评议与学术对决。
                        </p>

                        <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1.5">
                                <Clock className="w-4 h-4 text-orange-500" />
                                <span>实时同步：{new Date(stats.lastUpdated).toLocaleTimeString("zh-CN")}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <CheckCircle className="w-4 h-4 text-green-500" />
                                <span>原子行锁防并发超兑机制</span>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => fetchLatestData(true)}
                                disabled={isLoading}
                                className="h-7 text-xs gap-1.5 border-border/80 hover:border-orange-500/50"
                            >
                                <RefreshCw className={`w-3 h-3 ${isLoading ? "animate-spin text-orange-500" : ""}`} />
                                刷新数据
                            </Button>
                        </div>
                    </div>
                </div>

                {/* 4 项核心数据可视化卡片 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* 卡片 1: 总发放席位 */}
                    <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-card p-5 shadow-sm transition-all hover:border-border">
                        <div className="flex items-center justify-between text-muted-foreground">
                            <span className="text-xs font-medium">总开放席位总量</span>
                            <div className="p-2 rounded-xl bg-orange-500/10 text-orange-500">
                                <Ticket className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="mt-3 text-3xl font-extrabold tracking-tight text-foreground">
                            {stats.totalCapacity.toLocaleString()}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                            共发布 {stats.totalCodesCount} 个学术通行码批次
                        </p>
                    </div>

                    {/* 卡片 2: 已入驻学者 */}
                    <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-card p-5 shadow-sm transition-all hover:border-border">
                        <div className="flex items-center justify-between text-muted-foreground">
                            <span className="text-xs font-medium">已成功入驻学者</span>
                            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
                                <Users className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="mt-3 text-3xl font-extrabold tracking-tight text-foreground">
                            {stats.claimedSeats.toLocaleString()}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                            学者已通过邀请核销激活账号
                        </p>
                    </div>

                    {/* 卡片 3: 剩余可抢名额 (核心高亮卡片) */}
                    <div className="relative overflow-hidden rounded-2xl border-2 border-orange-500/50 bg-gradient-to-br from-orange-500/10 via-card to-amber-500/10 p-5 shadow-md shadow-orange-500/10 transition-all hover:border-orange-500">
                        <div className="flex items-center justify-between text-orange-600 dark:text-amber-400">
                            <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                                <Flame className="w-3.5 h-3.5 text-orange-500 animate-pulse" />
                                剩余可抢占席位
                            </span>
                            <div className="p-2 rounded-xl bg-orange-500 text-white shadow-sm">
                                <Sparkles className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="mt-3 text-3xl font-extrabold tracking-tight text-orange-600 dark:text-amber-400">
                            {stats.remainingSeats.toLocaleString()}
                        </div>
                        <p className="mt-1 text-xs text-orange-700/80 dark:text-amber-300/80 font-medium">
                            {stats.activeCodesCount} 个邀请码尚有有效席位
                        </p>
                    </div>

                    {/* 卡片 4: 全网抢占进度率 */}
                    <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-card p-5 shadow-sm transition-all hover:border-border">
                        <div className="flex items-center justify-between text-muted-foreground">
                            <span className="text-xs font-medium">全网抢占进度率</span>
                            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
                                <CheckCircle2 className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="mt-3 text-3xl font-extrabold tracking-tight text-foreground flex items-baseline gap-2">
                            <span>{stats.claimRate}%</span>
                            <span className="text-xs font-normal text-muted-foreground">已抢兑</span>
                        </div>
                        <div className="mt-2.5">
                            <Progress value={stats.claimRate} className="h-2" />
                        </div>
                    </div>
                </div>

                {/* 搜索、筛选与视图控制栏 */}
                <div className="space-y-4">
                    <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                        {/* 左侧搜索与分类标签 */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
                            <div className="relative flex-1 sm:max-w-xs">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    placeholder="搜索邀请码 / 批次备注..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-9 h-10 bg-card"
                                />
                            </div>

                            {/* 状态分类切换 */}
                            <div className="inline-flex p-1 rounded-xl bg-muted/60 border border-border/50 text-xs">
                                <button
                                    onClick={() => setStatusFilter("all")}
                                    className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                                        statusFilter === "all"
                                            ? "bg-background text-foreground shadow-sm"
                                            : "text-muted-foreground hover:text-foreground"
                                    }`}
                                >
                                    全部 ({codes.length})
                                </button>
                                <button
                                    onClick={() => setStatusFilter("available")}
                                    className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1 ${
                                        statusFilter === "available"
                                            ? "bg-background text-orange-600 dark:text-amber-400 shadow-sm"
                                            : "text-muted-foreground hover:text-foreground"
                                    }`}
                                >
                                    <Flame className="w-3 h-3 text-orange-500" />
                                    尚有余量 ({stats.activeCodesCount})
                                </button>
                                <button
                                    onClick={() => setStatusFilter("exhausted")}
                                    className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                                        statusFilter === "exhausted"
                                            ? "bg-background text-foreground shadow-sm"
                                            : "text-muted-foreground hover:text-foreground"
                                    }`}
                                >
                                    已满额 ({stats.exhaustedCodesCount})
                                </button>
                                <button
                                    onClick={() => setStatusFilter("inactive")}
                                    className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                                        statusFilter === "inactive"
                                            ? "bg-background text-foreground shadow-sm"
                                            : "text-muted-foreground hover:text-foreground"
                                    }`}
                                >
                                    已失效
                                </button>
                            </div>
                        </div>

                        {/* 右侧排序与视图切换 */}
                        <div className="flex items-center justify-between sm:justify-end gap-3">
                            <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
                                <SelectTrigger className="w-36 h-10 bg-card text-xs">
                                    <SelectValue placeholder="排序方式" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="remaining">余量最多优先</SelectItem>
                                    <SelectItem value="latest">最新签发优先</SelectItem>
                                    <SelectItem value="progress">抢兑进度优先</SelectItem>
                                </SelectContent>
                            </Select>

                            <div className="inline-flex p-1 rounded-xl bg-muted/60 border border-border/50">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className={`h-8 w-8 rounded-lg ${
                                        viewMode === "grid" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
                                    }`}
                                    onClick={() => setViewMode("grid")}
                                    title="卡片网格视图"
                                >
                                    <LayoutGrid className="w-4 h-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className={`h-8 w-8 rounded-lg ${
                                        viewMode === "table" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
                                    }`}
                                    onClick={() => setViewMode("table")}
                                    title="紧凑表格视图"
                                >
                                    <TableIcon className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 邀请码展示区域 */}
                {filteredCodes.length === 0 ? (
                    <div className="rounded-3xl border border-dashed border-border/80 bg-card/50 p-12 text-center space-y-3">
                        <div className="inline-flex p-4 rounded-full bg-muted text-muted-foreground">
                            <Search className="w-6 h-6" />
                        </div>
                        <h3 className="text-base font-semibold text-foreground">没有找到匹配的邀请码</h3>
                        <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                            当前筛选条件下暂无邀请码。您可以尝试切换筛选分类或清空搜索关键词。
                        </p>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                setSearch("");
                                setStatusFilter("all");
                            }}
                            className="mt-2"
                        >
                            重置全部筛选
                        </Button>
                    </div>
                ) : viewMode === "grid" ? (
                    /* 模式 1: 通行卡卡片网格 */
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {filteredCodes.map((item) => {
                            const isAvailable = item.is_available;
                            const isExhausted = item.is_exhausted;
                            const isSingleRemaining = isAvailable && item.remaining_uses === 1;

                            return (
                                <div
                                    key={item.id}
                                    className={`group relative flex flex-col justify-between rounded-2xl border transition-all duration-200 overflow-hidden ${
                                        isAvailable
                                            ? "bg-card border-border/80 hover:border-orange-500/60 hover:shadow-lg hover:shadow-orange-500/5"
                                            : "bg-card/40 border-border/40 opacity-75 grayscale-[20%]"
                                    }`}
                                >
                                    {/* 顶部微光高光条 */}
                                    {isAvailable && (
                                        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-orange-500 via-amber-400 to-orange-500" />
                                    )}

                                    <div className="p-5 space-y-4">
                                        {/* 状态徽章与用途 */}
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="text-xs font-medium text-muted-foreground line-clamp-1 max-w-[160px]">
                                                {item.note}
                                            </span>

                                            {isAvailable ? (
                                                isSingleRemaining ? (
                                                    <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 text-[11px] font-semibold gap-1">
                                                        <Flame className="w-3 h-3 text-amber-500 animate-bounce" />
                                                        仅剩 1 席
                                                    </Badge>
                                                ) : (
                                                    <Badge className="bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/30 text-[11px] font-semibold gap-1">
                                                        <CheckCircle2 className="w-3 h-3 text-green-500" />
                                                        剩余 {item.remaining_uses} 席
                                                    </Badge>
                                                )
                                            ) : isExhausted ? (
                                                <Badge variant="secondary" className="text-[11px] text-muted-foreground gap-1">
                                                    <Lock className="w-3 h-3" />
                                                    席位已满
                                                </Badge>
                                            ) : (
                                                <Badge variant="destructive" className="text-[11px] gap-1">
                                                    <AlertCircle className="w-3 h-3" />
                                                    已失效
                                                </Badge>
                                            )}
                                        </div>

                                        {/* 邀请码展示卡 */}
                                        <div className="relative p-3.5 rounded-xl bg-muted/50 border border-border/50 group-hover:border-border transition-colors">
                                            <div className="text-xs text-muted-foreground mb-1 font-sans">
                                                学术通行码
                                            </div>
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="font-mono text-base sm:text-lg font-bold tracking-wider text-foreground select-all">
                                                    {item.code}
                                                </span>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="w-8 h-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-background"
                                                    onClick={() => handleCopy(item.code)}
                                                    title="复制邀请码"
                                                >
                                                    {copiedCode === item.code ? (
                                                        <Check className="w-4 h-4 text-green-500" />
                                                    ) : (
                                                        <Copy className="w-4 h-4" />
                                                    )}
                                                </Button>
                                            </div>
                                        </div>

                                        {/* 进度条与数据 */}
                                        <div className="space-y-1.5">
                                            <div className="flex items-center justify-between text-xs font-mono">
                                                <span className="text-muted-foreground">
                                                    已核销: <strong className="text-foreground">{item.used_count}</strong> / {item.usage_limit}
                                                </span>
                                                <span className="text-muted-foreground">
                                                    {item.percent_used}%
                                                </span>
                                            </div>
                                            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-500 ${
                                                        isExhausted
                                                            ? "bg-muted-foreground"
                                                            : "bg-gradient-to-r from-orange-500 to-amber-500"
                                                    }`}
                                                    style={{ width: `${item.percent_used}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* 底部直达按钮 */}
                                    <div className="p-4 pt-0">
                                        {isAvailable ? (
                                            <Link href={`/register?invite=${encodeURIComponent(item.code)}`}>
                                                <Button
                                                    className="w-full h-10 font-semibold bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl shadow-md shadow-orange-500/20 group/btn transition-all duration-200"
                                                >
                                                    <span>立即抢注通行</span>
                                                    <ArrowRight className="w-4 h-4 ml-1.5 transition-transform group-hover/btn:translate-x-1" />
                                                </Button>
                                            </Link>
                                        ) : (
                                            <Button
                                                variant="outline"
                                                disabled
                                                className="w-full h-10 rounded-xl text-muted-foreground border-border/60"
                                            >
                                                <span>席位已抢空</span>
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    /* 模式 2: 紧凑数据表格 */
                    <div className="rounded-2xl border border-border/60 bg-card overflow-hidden shadow-sm">
                        <Table>
                            <TableHeader className="bg-muted/40">
                                <TableRow>
                                    <TableHead className="font-semibold">邀请码</TableHead>
                                    <TableHead className="font-semibold">状态</TableHead>
                                    <TableHead className="font-semibold">使用进度 (已用/上限)</TableHead>
                                    <TableHead className="font-semibold">剩余席位</TableHead>
                                    <TableHead className="font-semibold">用途批次</TableHead>
                                    <TableHead className="font-semibold">有效期</TableHead>
                                    <TableHead className="font-semibold text-right">快捷操作</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredCodes.map((item) => (
                                    <TableRow key={item.id} className="hover:bg-muted/30 transition-colors">
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono font-bold text-xs px-2.5 py-1 bg-muted rounded border border-border/50 text-foreground">
                                                    {item.code}
                                                </span>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="w-6 h-6 text-muted-foreground hover:text-foreground"
                                                    onClick={() => handleCopy(item.code)}
                                                    title="复制邀请码"
                                                >
                                                    {copiedCode === item.code ? (
                                                        <Check className="w-3.5 h-3.5 text-green-500" />
                                                    ) : (
                                                        <Copy className="w-3.5 h-3.5" />
                                                    )}
                                                </Button>
                                            </div>
                                        </TableCell>

                                        <TableCell>
                                            {item.is_available ? (
                                                <Badge className="bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/30 text-[10px]">
                                                    可抢用
                                                </Badge>
                                            ) : item.is_exhausted ? (
                                                <Badge variant="secondary" className="text-[10px]">
                                                    已满额
                                                </Badge>
                                            ) : (
                                                <Badge variant="destructive" className="text-[10px]">
                                                    已失效
                                                </Badge>
                                            )}
                                        </TableCell>

                                        <TableCell>
                                            <div className="space-y-1 max-w-[120px]">
                                                <div className="flex items-center justify-between text-xs font-mono">
                                                    <span>{item.used_count}</span>
                                                    <span className="text-muted-foreground">/ {item.usage_limit}</span>
                                                </div>
                                                <Progress value={item.percent_used} className="h-1.5" />
                                            </div>
                                        </TableCell>

                                        <TableCell>
                                            <span className={`font-mono font-semibold text-xs ${item.remaining_uses > 0 ? "text-orange-600 dark:text-amber-400" : "text-muted-foreground"}`}>
                                                {item.remaining_uses}
                                            </span>
                                        </TableCell>

                                        <TableCell>
                                            <span className="text-xs text-muted-foreground line-clamp-1 max-w-[180px]">
                                                {item.note}
                                            </span>
                                        </TableCell>

                                        <TableCell>
                                            <span className="text-xs text-muted-foreground">
                                                {item.expires_at ? new Date(item.expires_at).toLocaleDateString("zh-CN") : "永久有效"}
                                            </span>
                                        </TableCell>

                                        <TableCell className="text-right">
                                            {item.is_available ? (
                                                <Link href={`/register?invite=${encodeURIComponent(item.code)}`}>
                                                    <Button
                                                        size="sm"
                                                        className="h-8 text-xs bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-medium"
                                                    >
                                                        抢注
                                                        <ArrowRight className="w-3 h-3 ml-1" />
                                                    </Button>
                                                </Link>
                                            ) : (
                                                <Button size="sm" variant="outline" disabled className="h-8 text-xs">
                                                    已满
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}

                {/* 抢兑指引与先到先得规则板块 */}
                <div className="rounded-3xl border border-border/70 bg-card p-6 sm:p-8 space-y-6">
                    <div className="flex items-center gap-2 text-foreground font-bold text-lg">
                        <HelpCircle className="w-5 h-5 text-orange-500" />
                        <h2>820 创世学术通行抢兑指引</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2 p-4 rounded-2xl bg-muted/40 border border-border/40">
                            <div className="w-7 h-7 rounded-lg bg-orange-500/10 text-orange-600 dark:text-amber-400 font-bold flex items-center justify-center text-sm">
                                1
                            </div>
                            <h3 className="font-semibold text-sm text-foreground">挑选有效邀请码</h3>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                在上方列表中挑选标记为“剩余 X 席”的有效通行码，点击“复制”或直接点击“立即抢注通行”。
                            </p>
                        </div>

                        <div className="space-y-2 p-4 rounded-2xl bg-muted/40 border border-border/40">
                            <div className="w-7 h-7 rounded-lg bg-orange-500/10 text-orange-600 dark:text-amber-400 font-bold flex items-center justify-center text-sm">
                                2
                            </div>
                            <h3 className="font-semibold text-sm text-foreground">自动预填与身份核验</h3>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                系统将自动在注册表单中填入该通行码并完成实时校验。完善学者个人姓名、学术邮箱并完成人机验证。
                            </p>
                        </div>

                        <div className="space-y-2 p-4 rounded-2xl bg-muted/40 border border-border/40">
                            <div className="w-7 h-7 rounded-lg bg-orange-500/10 text-orange-600 dark:text-amber-400 font-bold flex items-center justify-center text-sm">
                                3
                            </div>
                            <h3 className="font-semibold text-sm text-foreground">解锁学者特权</h3>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                注册成功后将获得创世学者特权标识，可无门槛发起学术研讨、发起/参与同行评审与学术决斗！
                            </p>
                        </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-orange-500/5 border border-orange-500/20 text-xs text-muted-foreground flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-orange-500 shrink-0" />
                            <span>
                                席位已被抢光？请关注官方后续释放计划，或联系超级管理员 Hansszh 申请专项学者通行席位。
                            </span>
                        </div>
                        <Link href="/register">
                            <Button variant="outline" size="sm" className="h-8 text-xs shrink-0">
                                自主提交注册
                            </Button>
                        </Link>
                    </div>
                </div>
            </main>

            {/* 页脚 */}
            <footer className="mt-16 border-t border-border/50 py-8 bg-card/30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-muted-foreground space-y-2">
                    <p>© 2026 Scholarly Academic Community. 秉持开放、严谨、深度的学术精神</p>
                    <div className="flex items-center justify-center gap-4 text-[11px]">
                        <Link href="/" className="hover:underline">论坛首页</Link>
                        <Link href="/rules?tab=guidelines" className="hover:underline">社区公约</Link>
                        <Link href="/rules?tab=terms" className="hover:underline">用户协议</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
