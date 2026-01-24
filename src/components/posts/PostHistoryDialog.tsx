"use client";

import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import {
    getPostRevisions,
    getRevisionDiff,
    PostRevisionListItem,
} from "@/app/(protected)/posts/[id]/history-actions";
import { DiffViewer } from "./DiffViewer";
import { History, Loader2, FileText } from "lucide-react";

interface PostHistoryDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    postId: string;
    currentTitle: string;
}

interface DiffData {
    old: {
        title: string;
        content: object;
        revision_number: number;
        created_at: string;
    };
    new: {
        title: string;
        content: object;
        revision_number: number;
        is_current?: boolean;
        created_at: string;
    };
}

export function PostHistoryDialog({
    open,
    onOpenChange,
    postId,
    currentTitle,
}: PostHistoryDialogProps) {
    const [revisions, setRevisions] = useState<PostRevisionListItem[]>([]);
    const [selectedRevision, setSelectedRevision] = useState<number | null>(null);
    const [diffData, setDiffData] = useState<DiffData | null>(null);
    const [loading, setLoading] = useState(false);
    const [loadingDiff, setLoadingDiff] = useState(false);

    const loadRevisions = async () => {
        setLoading(true);
        const result = await getPostRevisions(postId);
        if (result.data) {
            setRevisions(result.data);
        }
        setLoading(false);
    };

    useEffect(() => {
        if (open) {
            loadRevisions();
        } else {
            // 重置状态
            setSelectedRevision(null);
            setDiffData(null);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, postId]);

    const loadDiff = async (revisionNumber: number) => {
        setLoadingDiff(true);
        setSelectedRevision(revisionNumber);
        const result = await getRevisionDiff(postId, revisionNumber);
        if (result.data) {
            setDiffData(result.data as DiffData);
        }
        setLoadingDiff(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[95vw] max-w-[95vw] max-h-[85vh] p-0 gap-0 overflow-hidden">
                <DialogHeader className="px-6 py-4 border-b">
                    <DialogTitle className="flex items-center gap-2">
                        <History className="h-5 w-5 text-primary" />
                        修订历史
                        {revisions.length > 0 && (
                            <Badge variant="secondary" className="ml-2">
                                {revisions.length} 个版本
                            </Badge>
                        )}
                    </DialogTitle>
                </DialogHeader>

                <div className="flex flex-col md:flex-row h-[calc(85vh-80px)] overflow-hidden">
                    {/* 左侧版本列表 */}
                    <div className="w-full md:w-64 lg:w-80 border-b md:border-b-0 md:border-r bg-muted/20 flex flex-col shrink-0 max-h-[40vh] md:max-h-full overflow-auto">
                        <div className="p-3 border-b bg-background/50">
                            <p className="text-xs text-muted-foreground">
                                点击版本查看与下一版本的对比
                            </p>
                        </div>
                        <div className="flex-1 overflow-auto">
                            <div className="p-2 space-y-1">
                                {loading ? (
                                    <div className="flex items-center justify-center py-8">
                                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                    </div>
                                ) : revisions.length === 0 ? (
                                    <div className="text-center py-8 px-4">
                                        <FileText className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
                                        <p className="text-muted-foreground text-sm">
                                            暂无修订历史
                                        </p>
                                        <p className="text-muted-foreground/60 text-xs mt-1">
                                            编辑帖子后将自动保存版本
                                        </p>
                                    </div>
                                ) : (
                                    revisions.map((rev, index) => (
                                        <button
                                            key={rev.id}
                                            onClick={() => loadDiff(rev.revision_number)}
                                            className={`w-full p-3 text-left rounded-lg transition-all ${selectedRevision === rev.revision_number
                                                ? "bg-primary/10 border border-primary/30"
                                                : "hover:bg-muted/50 border border-transparent"
                                                }`}
                                        >
                                            <div className="flex items-center gap-2 mb-2">
                                                <Avatar className="h-6 w-6">
                                                    <AvatarImage src={rev.editor?.avatar_url || ""} />
                                                    <AvatarFallback className="text-xs">
                                                        {rev.editor?.username?.[0]?.toUpperCase() || "?"}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium text-sm">
                                                            版本 {rev.revision_number}
                                                        </span>
                                                        {index === 0 && (
                                                            <Badge variant="outline" className="text-[10px] h-4">
                                                                最新
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <p className="text-xs text-muted-foreground truncate">
                                                {rev.title}
                                            </p>
                                            <p className="text-[10px] text-muted-foreground/60 mt-1">
                                                {formatDate(rev.created_at)}
                                            </p>
                                        </button>
                                    ))
                                )}
                            </div>

                        </div>
                    </div>


                    {/* 右侧 Diff 视图 */}
                    <div className="flex-1 flex flex-col bg-background min-h-0 min-w-0 overflow-hidden">
                        {loadingDiff ? (
                            <div className="flex items-center justify-center h-full">
                                <div className="text-center">
                                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-3" />
                                    <p className="text-sm text-muted-foreground">加载中...</p>
                                </div>
                            </div>
                        ) : diffData ? (
                            <>
                                <div className="px-4 py-3 border-b bg-muted/20 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/30">
                                            版本 {diffData.old.revision_number}
                                        </Badge>
                                        <span className="text-muted-foreground">→</span>
                                        <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
                                            {diffData.new.is_current
                                                ? "当前版本"
                                                : `版本 ${diffData.new.revision_number}`}
                                        </Badge>
                                    </div>
                                </div>
                                <div className="flex-1 p-4 overflow-auto">
                                    <DiffViewer
                                        oldContent={diffData.old.content}
                                        newContent={diffData.new.content}
                                        oldTitle={diffData.old.title}
                                        newTitle={diffData.new.title}
                                    />
                                </div>
                            </>
                        ) : (
                            <div className="flex items-center justify-center h-full text-muted-foreground">
                                <div className="text-center">
                                    <History className="h-12 w-12 mx-auto mb-3 opacity-30" />
                                    <p className="text-sm">选择一个版本查看变化</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog >
    );
}
