"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
    Clock,
    Download,
    History,
    Loader2,
    RotateCcw,
    Save,
    Tag,
    Trash2,
    User,
} from "lucide-react";
import { toast } from "sonner";

interface Snapshot {
    id: string;
    snapshot_type: string;
    label: string | null;
    created_by: string | null;
    created_at: string;
    createdByUser: {
        full_name?: string;
        username?: string;
        avatar_url?: string;
    } | null;
}

interface NoteHistoryDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    roomId: string;
    onRollback: (snapshotId: string) => Promise<boolean>;
    onManualSave: (label?: string) => Promise<boolean>;
    isSaving: boolean;
    isRestoring: boolean;
    isOwnerOrAdmin: boolean;
}

const snapshotTypeLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    auto: { label: "自动", variant: "secondary" },
    manual: { label: "手动", variant: "default" },
    pre_rollback: { label: "回滚前备份", variant: "outline" },
};

function formatTimeAgo(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffMin < 1) return "刚刚";
    if (diffMin < 60) return `${diffMin}分钟前`;
    if (diffHour < 24) return `${diffHour}小时前`;
    if (diffDay < 7) return `${diffDay}天前`;
    return date.toLocaleDateString("zh-CN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function NoteHistoryDialog({
    open,
    onOpenChange,
    roomId,
    onRollback,
    onManualSave,
    isSaving,
    isRestoring,
    isOwnerOrAdmin,
}: NoteHistoryDialogProps) {
    const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
    const [loading, setLoading] = useState(false);
    const [saveLabel, setSaveLabel] = useState("");
    const [showSaveInput, setShowSaveInput] = useState(false);
    const [rollbackTarget, setRollbackTarget] = useState<Snapshot | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Snapshot | null>(null);


    const fetchSnapshots = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/lab-notes/snapshots?roomId=${roomId}`);
            if (res.ok) {
                const data = await res.json();
                setSnapshots(data.snapshots || []);
            }
        } catch (e) {
            console.error("获取快照列表失败:", e);
        } finally {
            setLoading(false);
        }
    }, [roomId]);

    useEffect(() => {
        if (open) {
            fetchSnapshots();
        }
    }, [open, fetchSnapshots]);

    const handleManualSave = async () => {
        const label = saveLabel.trim() || undefined;
        const ok = await onManualSave(label);
        if (ok) {
            toast.success("保存成功，已创建版本快照");
            setSaveLabel("");
            setShowSaveInput(false);
            fetchSnapshots();
        } else {
            toast.error("保存失败，请重试");
        }
    };

    const handleRollback = async () => {
        if (!rollbackTarget) return;
        const ok = await onRollback(rollbackTarget.id);
        if (ok) {
            toast.success(`回滚成功，已恢复到 ${formatTimeAgo(rollbackTarget.created_at)} 的版本`);
            setRollbackTarget(null);
            fetchSnapshots();
        } else {
            toast.error("回滚失败，请重试");
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            const res = await fetch(
                `/api/lab-notes/snapshots?snapshotId=${deleteTarget.id}&roomId=${roomId}`,
                { method: "DELETE" }
            );
            if (res.ok) {
                toast.success("已删除快照");
                setDeleteTarget(null);
                fetchSnapshots();
            } else {
                toast.error("删除失败");
            }
        } catch {
            toast.error("删除失败");
        }
    };

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-[520px] max-h-[85vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <History className="h-5 w-5 text-violet-500" />
                            版本历史
                        </DialogTitle>
                        <DialogDescription>
                            查看协作笔记的历史版本，可回滚到任意时间点
                        </DialogDescription>
                    </DialogHeader>

                    {/* 手动保存区域 */}
                    <div className="border border-border/50 rounded-lg p-3 bg-muted/20">
                        {showSaveInput ? (
                            <div className="space-y-2">
                                <Input
                                    placeholder='输入版本标签（可选），如「公式推导完成」'
                                    value={saveLabel}
                                    onChange={(e) => setSaveLabel(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleManualSave()}
                                    autoFocus
                                />
                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        onClick={handleManualSave}
                                        disabled={isSaving}
                                        className="gap-1.5"
                                    >
                                        {isSaving ? (
                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        ) : (
                                            <Save className="h-3.5 w-3.5" />
                                        )}
                                        保存当前版本
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => { setShowSaveInput(false); setSaveLabel(""); }}
                                    >
                                        取消
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <Button
                                variant="outline"
                                size="sm"
                                className="gap-1.5 w-full"
                                onClick={() => setShowSaveInput(true)}
                            >
                                <Save className="h-3.5 w-3.5" />
                                创建手动保存点
                            </Button>
                        )}
                    </div>

                    {/* 快照列表 */}
                    <ScrollArea className="flex-1 min-h-0 max-h-[50vh]">
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : snapshots.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                <History className="h-10 w-10 mx-auto mb-3 opacity-30" />
                                <p className="text-sm">暂无历史版本</p>
                                <p className="text-xs mt-1">系统会自动保存，你也可以手动创建保存点</p>
                            </div>
                        ) : (
                            <div className="space-y-1 pr-3">
                                {snapshots.map((snapshot, index) => {
                                    const typeInfo = snapshotTypeLabels[snapshot.snapshot_type] || { label: snapshot.snapshot_type, variant: "secondary" as const };
                                    const isFirst = index === 0;

                                    return (
                                        <div
                                            key={snapshot.id}
                                            className={cn(
                                                "group relative flex items-start gap-3 p-3 rounded-lg transition-colors",
                                                "hover:bg-muted/50",
                                                isFirst && "bg-violet-500/5 border border-violet-500/20"
                                            )}
                                        >
                                            {/* 时间线圆点 */}
                                            <div className="flex-shrink-0 mt-1">
                                                <div className={cn(
                                                    "h-2.5 w-2.5 rounded-full ring-2 ring-background",
                                                    isFirst ? "bg-violet-500" :
                                                    snapshot.snapshot_type === "manual" ? "bg-blue-500" :
                                                    snapshot.snapshot_type === "pre_rollback" ? "bg-amber-500" :
                                                    "bg-muted-foreground/30"
                                                )} />
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <Badge variant={typeInfo.variant} className="text-[10px] px-1.5 py-0">
                                                        {typeInfo.label}
                                                    </Badge>
                                                    {isFirst && (
                                                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-violet-500/10 text-violet-600">
                                                            最新
                                                        </Badge>
                                                    )}
                                                    {snapshot.label && (
                                                        <span className="flex items-center gap-0.5 text-xs text-foreground font-medium truncate">
                                                            <Tag className="h-3 w-3 text-muted-foreground" />
                                                            {snapshot.label}
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="h-3 w-3" />
                                                        {formatTimeAgo(snapshot.created_at)}
                                                    </span>
                                                    {snapshot.createdByUser && (
                                                        <span className="flex items-center gap-1">
                                                            <Avatar className="h-3.5 w-3.5">
                                                                <AvatarImage src={snapshot.createdByUser.avatar_url} />
                                                                <AvatarFallback className="text-[8px]">
                                                                    {(snapshot.createdByUser.username || "?").slice(0, 1).toUpperCase()}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            {snapshot.createdByUser.full_name || snapshot.createdByUser.username}
                                                        </span>
                                                    )}
                                                    <span className="text-[10px] opacity-50">
                                                        {new Date(snapshot.created_at).toLocaleString("zh-CN", {
                                                            month: "2-digit",
                                                            day: "2-digit",
                                                            hour: "2-digit",
                                                            minute: "2-digit",
                                                            second: "2-digit",
                                                        })}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* 操作按钮 */}
                                            <div className="flex-shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-7 w-7"
                                                            onClick={() => setRollbackTarget(snapshot)}
                                                            disabled={isRestoring}
                                                        >
                                                            <RotateCcw className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>回滚到此版本</TooltipContent>
                                                </Tooltip>

                                                {isOwnerOrAdmin && (
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-7 w-7 text-destructive/60 hover:text-destructive"
                                                                onClick={() => setDeleteTarget(snapshot)}
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>删除此快照</TooltipContent>
                                                    </Tooltip>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </ScrollArea>
                </DialogContent>
            </Dialog>

            {/* 回滚确认对话框 */}
            <AlertDialog open={!!rollbackTarget} onOpenChange={(o: boolean) => !o && setRollbackTarget(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>确认回滚</AlertDialogTitle>
                        <AlertDialogDescription>
                            {rollbackTarget && (
                                <>
                                    将笔记恢复到 <strong>{formatTimeAgo(rollbackTarget.created_at)}</strong> 的版本
                                    {rollbackTarget.label && <>（{rollbackTarget.label}）</>}。
                                    <br /><br />
                                    回滚前，当前内容会自动备份为「回滚前备份」快照，你可以随时恢复。
                                    <br /><br />
                                    <strong className="text-amber-600">⚠️ 此操作会影响所有在线协作者的编辑器内容。</strong>
                                </>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>取消</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleRollback}
                            disabled={isRestoring}
                            className="bg-amber-600 hover:bg-amber-700"
                        >
                            {isRestoring ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-1" />
                            ) : (
                                <RotateCcw className="h-4 w-4 mr-1" />
                            )}
                            确认回滚
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* 删除确认对话框 */}
            <AlertDialog open={!!deleteTarget} onOpenChange={(o: boolean) => !o && setDeleteTarget(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>确认删除快照</AlertDialogTitle>
                        <AlertDialogDescription>
                            此操作不可撤销，确定要删除这个版本快照吗？
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>取消</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-destructive hover:bg-destructive/90"
                        >
                            <Trash2 className="h-4 w-4 mr-1" />
                            删除
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
