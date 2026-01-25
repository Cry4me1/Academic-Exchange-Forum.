"use client";

import {
    getPostRevisions,
    getRevisionDiff,
    PostRevisionListItem,
} from "@/app/(protected)/posts/[id]/history-actions";
import { DiffViewer } from "@/components/posts/DiffViewer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { ArrowLeft, FileText, History, Loader2 } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

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

export default function PostHistoryPage() {
    const params = useParams();
    const postId = params.id as string;

    const [revisions, setRevisions] = useState<PostRevisionListItem[]>([]);
    const [selectedRevision, setSelectedRevision] = useState<number | null>(null);
    const [diffData, setDiffData] = useState<DiffData | null>(null);
    const [loading, setLoading] = useState(true);
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
        loadRevisions();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [postId]);

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
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
            {/* 顶部导航 */}
            <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-4">
                            <Link href={`/posts/${postId}`}>
                                <Button variant="ghost" size="sm" className="gap-2">
                                    <ArrowLeft className="h-4 w-4" />
                                    返回帖子
                                </Button>
                            </Link>
                            <div className="flex items-center gap-2">
                                <History className="h-5 w-5 text-primary" />
                                <h1 className="text-lg font-semibold">修订历史</h1>
                                {revisions.length > 0 && (
                                    <Badge variant="secondary" className="ml-2">
                                        {revisions.length} 个版本
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* 主内容区域 */}
            <div className="flex flex-col lg:flex-row h-[calc(100vh-4rem)]">
                {/* 左侧版本列表 */}
                <div className="w-full lg:w-72 xl:w-80 border-b lg:border-b-0 lg:border-r bg-muted/20 flex flex-col shrink-0 max-h-[30vh] lg:max-h-full overflow-hidden">
                    <div className="p-4 border-b bg-background/50 shrink-0">
                        <p className="text-sm text-muted-foreground">
                            点击版本查看与下一版本的对比
                        </p>
                    </div>
                    <div className="flex-1 overflow-auto">
                        <div className="p-3 space-y-2">
                            {loading ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                </div>
                            ) : revisions.length === 0 ? (
                                <div className="text-center py-12 px-4">
                                    <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                                    <p className="text-muted-foreground">
                                        暂无修订历史
                                    </p>
                                    <p className="text-muted-foreground/60 text-sm mt-2">
                                        编辑帖子后将自动保存版本
                                    </p>
                                </div>
                            ) : (
                                revisions.map((rev, index) => (
                                    <button
                                        key={rev.id}
                                        onClick={() => loadDiff(rev.revision_number)}
                                        className={`w-full p-4 text-left rounded-xl transition-all ${selectedRevision === rev.revision_number
                                            ? "bg-primary/10 border-2 border-primary/30 shadow-sm"
                                            : "hover:bg-muted/50 border-2 border-transparent"
                                            }`}
                                    >
                                        <div className="flex items-center gap-3 mb-2">
                                            <Avatar className="h-8 w-8 ring-2 ring-background">
                                                <AvatarImage src={rev.editor?.avatar_url || ""} />
                                                <AvatarFallback className="text-xs bg-gradient-to-br from-primary/30 to-primary/10">
                                                    {rev.editor?.username?.[0]?.toUpperCase() || "?"}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold text-sm">
                                                        版本 {rev.revision_number}
                                                    </span>
                                                    {index === 0 && (
                                                        <Badge variant="outline" className="text-[10px] h-5 bg-primary/10 text-primary border-primary/20">
                                                            最新
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <p className="text-sm text-muted-foreground truncate pl-11">
                                            {rev.title}
                                        </p>
                                        <p className="text-xs text-muted-foreground/60 mt-1 pl-11">
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
                                <Loader2 className="h-10 w-10 animate-spin text-muted-foreground mx-auto mb-4" />
                                <p className="text-muted-foreground">加载版本差异...</p>
                            </div>
                        </div>
                    ) : diffData ? (
                        <>
                            <div className="px-6 py-4 border-b bg-muted/20 flex items-center justify-between shrink-0">
                                <div className="flex items-center gap-4">
                                    <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/30 px-3 py-1">
                                        版本 {diffData.old.revision_number}
                                    </Badge>
                                    <span className="text-muted-foreground text-lg">→</span>
                                    <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30 px-3 py-1">
                                        {diffData.new.is_current
                                            ? "当前版本"
                                            : `版本 ${diffData.new.revision_number}`}
                                    </Badge>
                                </div>
                            </div>
                            <div className="flex-1 p-6 overflow-hidden">
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
                                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted/50 flex items-center justify-center">
                                    <History className="h-10 w-10 opacity-30" />
                                </div>
                                <p className="text-lg mb-2">选择一个版本</p>
                                <p className="text-sm text-muted-foreground/60">
                                    从左侧列表中选择一个历史版本查看变化
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
