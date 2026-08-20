"use client";

import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Search, Loader2, RefreshCw, UserCheck } from "lucide-react";
import { toast } from "sonner";

interface RecordItem {
    id: string;
    code: string;
    code_id: string;
    invitee_username: string | null;
    invitee_email: string | null;
    ip_address: string | null;
    used_at: string;
    inviter: {
        id: string;
        username: string | null;
        full_name: string | null;
        avatar_url: string | null;
    } | null;
    invitee: {
        id: string;
        username: string | null;
        full_name: string | null;
        avatar_url: string | null;
    } | null;
}

export function InviteRecordsTab() {
    const [records, setRecords] = useState<RecordItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const pageSize = 15;

    const fetchRecords = useCallback(async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                pageSize: pageSize.toString(),
                search: search.trim(),
            });
            const res = await fetch(`/api/admin/invites/records?${params.toString()}`);
            const data = await res.json();
            if (!res.ok) {
                toast.error(data.error || "获取核销记录失败");
                return;
            }
            setRecords(data.records || []);
            setTotal(data.total || 0);
        } catch {
            toast.error("网络异常，获取核销记录失败");
        } finally {
            setIsLoading(false);
        }
    }, [page, search]);

    useEffect(() => {
        fetchRecords();
    }, [fetchRecords]);

    const totalPages = Math.ceil(total / pageSize);

    return (
        <div className="space-y-4">
            {/* 搜索与刷新 */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative w-full sm:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="搜索邀请码 / 学者名 / 邮箱..."
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setPage(1);
                        }}
                        className="pl-9 h-9"
                    />
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchRecords}
                    disabled={isLoading}
                    className="self-end sm:self-auto"
                >
                    <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? "animate-spin" : ""}`} />
                    刷新记录
                </Button>
            </div>

            {/* 数据表格 */}
            <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
                <Table>
                    <TableHeader className="bg-muted/40">
                        <TableRow>
                            <TableHead className="font-semibold">使用邀请码</TableHead>
                            <TableHead className="font-semibold">入驻新学者</TableHead>
                            <TableHead className="font-semibold">引荐人 (Inviter)</TableHead>
                            <TableHead className="font-semibold">注册来源 IP</TableHead>
                            <TableHead className="font-semibold text-right">核销入驻时间</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-36 text-center">
                                    <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                                        <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
                                        <span className="text-xs">加载核销记录中...</span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : records.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-36 text-center text-muted-foreground">
                                    <div className="flex flex-col items-center justify-center gap-2">
                                        <UserCheck className="w-8 h-8 text-muted-foreground/50" />
                                        <span>暂无任何学者通过邀请码核销入驻</span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            records.map((r) => (
                                <TableRow key={r.id} className="hover:bg-muted/30 transition-colors">
                                    <TableCell>
                                        <span className="font-mono font-semibold tracking-wider text-xs px-2 py-1 bg-muted rounded border border-border/50 text-foreground">
                                            {r.code}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2.5">
                                            <Avatar className="w-7 h-7">
                                                <AvatarImage src={r.invitee?.avatar_url || ""} />
                                                <AvatarFallback className="text-[10px] bg-orange-500/10 text-orange-600 font-semibold">
                                                    {(r.invitee_username || "U").slice(0, 2).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <div className="text-xs font-semibold text-foreground">
                                                    {r.invitee?.full_name || r.invitee_username || "未命论学者"}
                                                </div>
                                                <div className="text-[11px] text-muted-foreground">
                                                    {r.invitee_email || `@${r.invitee_username}`}
                                                </div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {r.inviter ? (
                                            <div className="flex items-center gap-2">
                                                <Avatar className="w-6 h-6">
                                                    <AvatarImage src={r.inviter.avatar_url || ""} />
                                                    <AvatarFallback className="text-[9px] bg-purple-500/10 text-purple-600">
                                                        {(r.inviter.username || "I").slice(0, 2).toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <span className="text-xs font-medium text-foreground">
                                                    {r.inviter.full_name || r.inviter.username}
                                                </span>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-muted-foreground italic">
                                                系统官方邀请
                                            </span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-xs font-mono text-muted-foreground">
                                        {r.ip_address || "—"}
                                    </TableCell>
                                    <TableCell className="text-right text-xs text-muted-foreground">
                                        {new Date(r.used_at).toLocaleString("zh-CN", {
                                            year: "numeric",
                                            month: "2-digit",
                                            day: "2-digit",
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* 分页 */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-2">
                    <div>共 {total} 条学术引荐记录</div>
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
        </div>
    );
}
