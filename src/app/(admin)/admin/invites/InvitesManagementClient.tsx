"use client";

import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Ticket,
    CheckCircle2,
    Users,
    Sparkles,
    Search,
    Copy,
    Trash2,
    Loader2,
    RefreshCw,
    Download,
    Check,
    AlertTriangle,
    X,
} from "lucide-react";
import { BatchGenerateDialog } from "./BatchGenerateDialog";
import { InviteRecordsTab } from "./InviteRecordsTab";
import { toast } from "sonner";

interface InviteCodeItem {
    id: string;
    code: string;
    usage_limit: number;
    used_count: number;
    expires_at: string | null;
    is_active: boolean;
    note: string | null;
    created_at: string;
    creator: {
        id: string;
        username: string | null;
        full_name: string | null;
        avatar_url: string | null;
    } | null;
}

interface StatsData {
    totalCount: number;
    totalUsed: number;
    totalRemaining: number;
    activeCount: number;
}

export function InvitesManagementClient() {
    const [activeTab, setActiveTab] = useState("codes");
    const [items, setItems] = useState<InviteCodeItem[]>([]);
    const [stats, setStats] = useState<StatsData>({
        totalCount: 0,
        totalUsed: 0,
        totalRemaining: 0,
        activeCount: 0,
    });
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    // 批量选中管理
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isBatchDeleting, setIsBatchDeleting] = useState(false);
    const [showBatchDeleteDialog, setShowBatchDeleteDialog] = useState(false);

    const pageSize = 15;

    const fetchCodes = useCallback(async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                pageSize: pageSize.toString(),
                search: search.trim(),
                status: statusFilter,
            });
            const res = await fetch(`/api/admin/invites?${params.toString()}`);
            const data = await res.json();
            if (!res.ok) {
                toast.error(data.error || "获取邀请码列表失败");
                return;
            }
            setItems(data.items || []);
            setTotal(data.total || 0);
            if (data.stats) {
                setStats(data.stats);
            }
        } catch {
            toast.error("网络异常，获取数据失败");
        } finally {
            setIsLoading(false);
        }
    }, [page, search, statusFilter]);

    useEffect(() => {
        fetchCodes();
    }, [fetchCodes]);

    // 切换单个选择
    const handleToggleSelectOne = (id: string) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    // 全选/取消当前页
    const isAllCurrentPageSelected = items.length > 0 && items.every((item) => selectedIds.has(item.id));
    const isSomeCurrentPageSelected = items.some((item) => selectedIds.has(item.id)) && !isAllCurrentPageSelected;

    const handleToggleSelectAllCurrentPage = () => {
        if (isAllCurrentPageSelected) {
            // 取消当前页全部选中
            setSelectedIds((prev) => {
                const next = new Set(prev);
                items.forEach((item) => next.delete(item.id));
                return next;
            });
        } else {
            // 选中当前页全部
            setSelectedIds((prev) => {
                const next = new Set(prev);
                items.forEach((item) => next.add(item.id));
                return next;
            });
        }
    };

    // 清空全部选中
    const handleClearSelection = () => {
        setSelectedIds(new Set());
    };

    // 批量删除处理
    const handleExecuteBatchDelete = async () => {
        if (selectedIds.size === 0) return;

        setIsBatchDeleting(true);
        try {
            const res = await fetch("/api/admin/invites", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ids: Array.from(selectedIds) }),
            });

            const data = await res.json();
            if (!res.ok) {
                toast.error(data.error || "批量删除失败");
                return;
            }

            toast.success(`成功批量删除 ${data.deletedCount || selectedIds.size} 个邀请码`);
            setSelectedIds(new Set());
            setShowBatchDeleteDialog(false);
            fetchCodes();
        } catch {
            toast.error("网络异常，批量删除失败");
        } finally {
            setIsBatchDeleting(false);
        }
    };

    // 切换启用状态
    const handleToggleActive = async (id: string, currentActive: boolean) => {
        try {
            const res = await fetch(`/api/admin/invites/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ is_active: !currentActive }),
            });
            const data = await res.json();
            if (!res.ok) {
                toast.error(data.error || "操作失败");
                return;
            }
            toast.success(!currentActive ? "邀请码已启用" : "邀请码已停用");
            fetchCodes();
        } catch {
            toast.error("网络异常");
        }
    };

    // 删除单条邀请码
    const handleDelete = async (id: string, code: string) => {
        if (!confirm(`确定要彻底删除邀请码 [${code}] 吗？`)) return;

        try {
            const res = await fetch(`/api/admin/invites/${id}`, {
                method: "DELETE",
            });
            const data = await res.json();
            if (!res.ok) {
                toast.error(data.error || "删除失败");
                return;
            }
            toast.success("邀请码已删除");
            // 若选集中包含该项，同步移除
            setSelectedIds((prev) => {
                const next = new Set(prev);
                next.delete(id);
                return next;
            });
            fetchCodes();
        } catch {
            toast.error("网络异常");
        }
    };

    // 单个复制
    const handleCopy = (id: string, code: string) => {
        navigator.clipboard.writeText(code);
        setCopiedId(id);
        toast.success(`已复制邀请码: ${code}`);
        setTimeout(() => setCopiedId(null), 2000);
    };

    // 导出 CSV
    const handleExport = () => {
        if (items.length === 0) {
            toast.error("当前无可用数据导出");
            return;
        }
        const header = "邀请码,已用/上限,有效状态,过期时间,用途备注,签发时间\n";
        const rows = items
            .map(
                (item) =>
                    `"${item.code}","${item.used_count}/${item.usage_limit}","${
                        item.is_active ? "启用" : "禁用"
                    }","${item.expires_at || "永久有效"}","${item.note || ""}","${item.created_at}"`
            )
            .join("\n");
        const blob = new Blob([`\uFEFF${header}${rows}`], {
            type: "text/csv;charset=utf-8;",
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `scholarly_invites_page${page}_${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    };

    const totalPages = Math.ceil(total / pageSize);

    return (
        <div className="space-y-6 pb-12">
            {/* 顶部标题与操作栏 */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
                        <Ticket className="w-7 h-7 text-orange-500" />
                        学术邀请码管理中心 (Hansszh 专属)
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        签发与管理学术通行邀请码、监控学者入驻流转与审计核销记录
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <BatchGenerateDialog onSuccess={fetchCodes} />
                </div>
            </div>

            {/* 4 项核心数据指标 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
                    <div className="flex items-center justify-between text-muted-foreground">
                        <span className="text-xs font-medium">签发邀请码总量</span>
                        <Ticket className="w-4 h-4 text-orange-500" />
                    </div>
                    <div className="mt-2 text-2xl font-bold text-foreground">
                        {stats.totalCount.toLocaleString()}
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-1">已签发的学术通行码总数</div>
                </div>

                <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
                    <div className="flex items-center justify-between text-muted-foreground">
                        <span className="text-xs font-medium">当前活跃可用码</span>
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                    </div>
                    <div className="mt-2 text-2xl font-bold text-green-600 dark:text-green-400">
                        {stats.activeCount.toLocaleString()}
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-1">未过期且尚有余量的有效码</div>
                </div>

                <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
                    <div className="flex items-center justify-between text-muted-foreground">
                        <span className="text-xs font-medium">已受邀入驻学者</span>
                        <Users className="w-4 h-4 text-blue-500" />
                    </div>
                    <div className="mt-2 text-2xl font-bold text-foreground">
                        {stats.totalUsed.toLocaleString()}
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-1">成功凭邀请码入驻的学者数</div>
                </div>

                <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
                    <div className="flex items-center justify-between text-muted-foreground">
                        <span className="text-xs font-medium">剩余可入驻席位</span>
                        <Sparkles className="w-4 h-4 text-amber-500" />
                    </div>
                    <div className="mt-2 text-2xl font-bold text-amber-600 dark:text-amber-400">
                        {stats.totalRemaining.toLocaleString()}
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-1">已签发未核销的总席位</div>
                </div>
            </div>

            {/* 选项卡 */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full sm:w-80 grid-cols-2 mb-4">
                    <TabsTrigger value="codes">邀请码库</TabsTrigger>
                    <TabsTrigger value="records">核销与学者审计</TabsTrigger>
                </TabsList>

                {/* Tab 1: 邀请码库 */}
                <TabsContent value="codes" className="space-y-4 mt-0">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <div className="relative flex-1 sm:w-72">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    placeholder="搜索邀请码 / 备注用途..."
                                    value={search}
                                    onChange={(e) => {
                                        setSearch(e.target.value);
                                        setPage(1);
                                    }}
                                    className="pl-9 h-9"
                                />
                            </div>
                            <Select
                                value={statusFilter}
                                onValueChange={(v) => {
                                    setStatusFilter(v);
                                    setPage(1);
                                }}
                            >
                                <SelectTrigger className="w-32 h-9">
                                    <SelectValue placeholder="状态筛选" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">全部状态</SelectItem>
                                    <SelectItem value="active">仅看启用</SelectItem>
                                    <SelectItem value="disabled">仅看禁用</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-auto">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleExport}
                                disabled={items.length === 0}
                            >
                                <Download className="w-3.5 h-3.5 mr-1.5" />
                                导出本页 CSV
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={fetchCodes}
                                disabled={isLoading}
                            >
                                <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? "animate-spin" : ""}`} />
                                刷新
                            </Button>
                        </div>
                    </div>

                    {/* 批量操作控制条（当有选中项时出现） */}
                    {selectedIds.size > 0 && (
                        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 rounded-lg bg-orange-500/10 border border-orange-500/30 text-xs animate-in fade-in slide-in-from-top-2 duration-200">
                            <div className="flex items-center gap-2">
                                <span className="font-semibold text-orange-600 dark:text-amber-400">
                                    已勾选 {selectedIds.size} 个邀请码
                                </span>
                                <span className="text-muted-foreground">|</span>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                                    onClick={handleToggleSelectAllCurrentPage}
                                >
                                    {isAllCurrentPageSelected ? "取消全选本页" : "全选本页"}
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                                    onClick={handleClearSelection}
                                >
                                    清空选择
                                </Button>
                            </div>

                            <div className="flex items-center gap-2">
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    className="h-8 gap-1.5 shadow-sm"
                                    onClick={() => setShowBatchDeleteDialog(true)}
                                    disabled={isBatchDeleting}
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    批量彻底删除 ({selectedIds.size})
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* 表格 */}
                    <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
                        <Table>
                            <TableHeader className="bg-muted/40">
                                <TableRow>
                                    <TableHead className="w-12 text-center">
                                        <Checkbox
                                            checked={isAllCurrentPageSelected ? true : isSomeCurrentPageSelected ? "indeterminate" : false}
                                            onCheckedChange={handleToggleSelectAllCurrentPage}
                                            aria-label="全选当前页"
                                            disabled={items.length === 0 || isLoading}
                                        />
                                    </TableHead>
                                    <TableHead className="font-semibold">邀请码</TableHead>
                                    <TableHead className="font-semibold">签发人</TableHead>
                                    <TableHead className="font-semibold">使用进度 (已用/上限)</TableHead>
                                    <TableHead className="font-semibold">有效期</TableHead>
                                    <TableHead className="font-semibold">用途备注</TableHead>
                                    <TableHead className="font-semibold text-center">启用</TableHead>
                                    <TableHead className="font-semibold text-right">操作</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="h-40 text-center">
                                            <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                                                <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
                                                <span className="text-xs">加载邀请码库中...</span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : items.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="h-40 text-center text-muted-foreground">
                                            <div className="flex flex-col items-center justify-center gap-2">
                                                <Ticket className="w-8 h-8 text-muted-foreground/50" />
                                                <span>暂无匹配的邀请码</span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    items.map((item) => {
                                        const isExpired = item.expires_at ? new Date(item.expires_at) < new Date() : false;
                                        const isExhausted = item.used_count >= item.usage_limit;
                                        const isSelected = selectedIds.has(item.id);

                                        return (
                                            <TableRow
                                                key={item.id}
                                                className={`transition-colors ${
                                                    isSelected
                                                        ? "bg-orange-500/10 dark:bg-orange-950/20 hover:bg-orange-500/15"
                                                        : "hover:bg-muted/30"
                                                }`}
                                            >
                                                <TableCell className="text-center">
                                                    <Checkbox
                                                        checked={isSelected}
                                                        onCheckedChange={() => handleToggleSelectOne(item.id)}
                                                        aria-label={`选择 ${item.code}`}
                                                    />
                                                </TableCell>

                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-mono font-bold tracking-wider text-xs px-2 py-1 bg-muted rounded border border-border/50 text-foreground">
                                                            {item.code}
                                                        </span>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="w-6 h-6 text-muted-foreground hover:text-foreground"
                                                            onClick={() => handleCopy(item.id, item.code)}
                                                            title="复制邀请码"
                                                        >
                                                            {copiedId === item.id ? (
                                                                <Check className="w-3.5 h-3.5 text-green-500" />
                                                            ) : (
                                                                <Copy className="w-3.5 h-3.5" />
                                                            )}
                                                        </Button>
                                                    </div>
                                                </TableCell>

                                                <TableCell>
                                                    <div className="text-xs font-medium text-foreground">
                                                        {item.creator?.full_name || item.creator?.username || "Hansszh"}
                                                    </div>
                                                </TableCell>

                                                <TableCell>
                                                    <div className="space-y-1 max-w-[130px]">
                                                        <div className="flex items-center justify-between text-xs font-mono">
                                                            <span className="text-foreground font-semibold">{item.used_count}</span>
                                                            <span className="text-muted-foreground">/ {item.usage_limit}</span>
                                                        </div>
                                                        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                                            <div
                                                                className={`h-full rounded-full transition-all ${
                                                                    isExhausted
                                                                        ? "bg-muted-foreground"
                                                                        : "bg-gradient-to-r from-orange-500 to-amber-500"
                                                                }`}
                                                                style={{
                                                                    width: `${Math.min(100, (item.used_count / item.usage_limit) * 100)}%`,
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                </TableCell>

                                                <TableCell>
                                                    {isExpired ? (
                                                        <Badge variant="destructive" className="text-[10px]">已过期</Badge>
                                                    ) : item.expires_at ? (
                                                        <span className="text-xs text-muted-foreground">
                                                            {new Date(item.expires_at).toLocaleDateString("zh-CN")}
                                                        </span>
                                                    ) : (
                                                        <Badge variant="secondary" className="text-[10px]">永久有效</Badge>
                                                    )}
                                                </TableCell>

                                                <TableCell>
                                                    <span className="text-xs text-muted-foreground line-clamp-1 max-w-[180px]" title={item.note || ""}>
                                                        {item.note || "—"}
                                                    </span>
                                                </TableCell>

                                                <TableCell className="text-center">
                                                    <Switch
                                                        checked={item.is_active}
                                                        onCheckedChange={() => handleToggleActive(item.id, item.is_active)}
                                                        disabled={isExpired}
                                                    />
                                                </TableCell>

                                                <TableCell className="text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="w-7 h-7 text-destructive/80 hover:text-destructive hover:bg-destructive/10"
                                                        onClick={() => handleDelete(item.id, item.code)}
                                                        title="删除邀请码"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* 批量删除确认弹窗 */}
                    <Dialog open={showBatchDeleteDialog} onOpenChange={setShowBatchDeleteDialog}>
                        <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                                <div className="flex items-center gap-2 text-destructive font-semibold">
                                    <AlertTriangle className="w-5 h-5" />
                                    <DialogTitle>确认批量删除邀请码？</DialogTitle>
                                </div>
                                <DialogDescription asChild>
                                    <div className="space-y-2 pt-2 text-sm text-muted-foreground">
                                        <div>
                                            您即将彻底删除已勾选的 <strong className="font-bold text-foreground">{selectedIds.size}</strong> 个学术通行邀请码。
                                        </div>
                                        <div className="text-destructive text-xs bg-destructive/10 p-2.5 rounded-lg border border-destructive/20 mt-2">
                                            ⚠️ 警告：该操作将同步级联删除这批邀请码在历史中关联的所有核销记录，且操作不可逆，请谨慎确认！
                                        </div>
                                    </div>
                                </DialogDescription>
                            </DialogHeader>
                            <DialogFooter className="mt-4 flex flex-row items-center justify-end gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => setShowBatchDeleteDialog(false)}
                                    disabled={isBatchDeleting}
                                >
                                    取消
                                </Button>
                                <Button
                                    variant="destructive"
                                    onClick={handleExecuteBatchDelete}
                                    disabled={isBatchDeleting}
                                >
                                    {isBatchDeleting ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            正在删除...
                                        </>
                                    ) : (
                                        `确认删除 (${selectedIds.size} 项)`
                                    )}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    {/* 分页 */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2">
                            <div>共 {total} 个邀请码</div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={page <= 1 || isLoading}
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                >
                                    上一页
                                </Button>
                                <span>
                                    第 {page} / {totalPages} 页
                                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={page >= totalPages || isLoading}
                                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                >
                                    下一页
                                </Button>
                            </div>
                        </div>
                    )}
                </TabsContent>

                {/* Tab 2: 核销与学者审计 */}
                <TabsContent value="records" className="mt-0">
                    <InviteRecordsTab />
                </TabsContent>
            </Tabs>
        </div>
    );
}
