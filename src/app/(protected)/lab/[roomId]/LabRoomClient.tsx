"use client";

import { createClient } from "@/lib/supabase/client";

import NovelViewer from "@/components/editor/NovelViewer";
import NovelCollabEditor from "@/components/editor/NovelCollabEditor";
import { PostSearchDialog } from "@/components/lab/reader/PostSearchDialog";
import { PublishCoPostDialog } from "@/components/lab/co-author/PublishCoPostDialog";
import { NoteHistoryDialog } from "@/components/lab/NoteHistoryDialog";
import { LabSettingsDialog } from "@/components/lab/LabSettingsDialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useYjsCollaboration } from "@/hooks/useYjsCollaboration";
import { useLabPresence } from "@/hooks/useLabPresence";
import { useScrollSync } from "@/hooks/useScrollSync";
import type { JSONContent } from "novel";
import {
    ArrowLeft,
    BookOpen,
    Check,
    ChevronRight,
    Clock,
    FileText,
    FlaskConical,
    History,
    Link2,
    Loader2,
    Plus,
    Save,
    Send,
    Settings,
    Users,
    Wifi,
    WifiOff,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

// Types
interface PostLink {
    id: string;
    sort_order: number;
    post: {
        id: string;
        title: string;
        content: object;
        tags: string[];
        author_id: string;
        like_count: number;
        comment_count: number;
        created_at: string;
        author: {
            id: string;
            full_name?: string;
            username?: string;
            avatar_url?: string;
        };
    };
}

interface Member {
    id: string;
    role: string;
    user: {
        id: string;
        full_name?: string;
        username?: string;
        avatar_url?: string;
    };
}

interface LabRoomClientProps {
    room: {
        id: string;
        name: string;
        description?: string;
        room_type: string;
        is_encrypted: boolean;
        created_by: string;
        lab_members: Member[];
        lab_post_links: PostLink[];
    };
    currentUserId: string;
    currentUsername: string;
    currentFullName?: string;
    currentAvatarUrl?: string;
}

const roleLabels: Record<string, string> = {
    owner: "创建者",
    admin: "管理员",
    editor: "编辑者",
    viewer: "观察者",
};

export default function LabRoomClient({
    room,
    currentUserId,
    currentUsername,
    currentFullName,
    currentAvatarUrl,
}: LabRoomClientProps) {
    const [selectedPostIndex, setSelectedPostIndex] = useState(0);
    const [showPostSearch, setShowPostSearch] = useState(false);
    const [showPublishDialog, setShowPublishDialog] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const postLinks = room.lab_post_links || [];
    const selectedPost = postLinks[selectedPostIndex]?.post;
    const members = room.lab_members || [];
    const currentMember = members.find((m) => m.user.id === currentUserId);
    const isOwnerOrAdmin = currentMember?.role === "owner" || currentMember?.role === "admin";
    const router = useRouter();

    // 实时监听成员 + 帖子列表变化
    useEffect(() => {
        const supabase = createClient();
        const channel = supabase
            .channel(`lab-data:${room.id}`)
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "lab_members",
                    filter: `room_id=eq.${room.id}`,
                },
                () => { router.refresh(); }
            )
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "lab_post_links",
                    filter: `room_id=eq.${room.id}`,
                },
                () => { router.refresh(); }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [room.id, router]);

    // Yjs 协作（基于 Supabase Realtime broadcast + Awareness）
    // 解析显示名称：如果 username 像 UUID，则用 full_name 或友好缩写
    const displayName = (() => {
        if (currentFullName) return currentFullName;
        const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}/i;
        if (currentUsername && !uuidPattern.test(currentUsername)) return currentUsername;
        return `用户${currentUserId.slice(-4)}`;
    })();

    const {
        ydoc, awarenessProvider, isConnected: yjsConnected, connectedPeers,
        isSaving, lastSavedAt, isRestoring, manualSave, rollbackToSnapshot,
    } = useYjsCollaboration({
        roomId: room.id,
        user: {
            id: currentUserId,
            name: displayName,
            color: "",
            avatarUrl: currentAvatarUrl,
        },
    });

    // Lab Presence
    const { onlineMembers, isConnected: presenceConnected, broadcastScrollPosition } = useLabPresence({
        roomId: room.id,
        userId: currentUserId,
        username: currentUsername,
        fullName: currentFullName,
        avatarUrl: currentAvatarUrl,
    });

    // 滚动同步
    useScrollSync({
        scrollContainerRef,
        currentPostId: selectedPost?.id || null,
        onlineMembers,
        broadcastScrollPosition,
    });

    // 协作编辑器 - 用户颜色
    const userColor = useMemo(() => {
        const CURSOR_COLORS = [
            "#7c3aed", "#2563eb", "#059669", "#d97706",
            "#dc2626", "#7c2d12", "#4f46e5", "#0891b2",
            "#65a30d", "#c026d3", "#e11d48", "#0d9488",
        ];
        let hash = 0;
        for (let i = 0; i < currentUserId.length; i++) {
            hash = currentUserId.charCodeAt(i) + ((hash << 5) - hash);
        }
        return CURSOR_COLORS[Math.abs(hash) % CURSOR_COLORS.length];
    }, [currentUserId]);

    // 协作编辑器笔记内容（通过 onUpdate 回调持续更新）
    const noteContentRef = useRef<JSONContent | null>(null);
    const handleEditorUpdate = useCallback((json: JSONContent) => {
        noteContentRef.current = json;
    }, []);

    // 使用房间成员作为共创者候选人（排除自己）
    const collaborators = useMemo(() => {
        return members
            .filter((m) => m.user.id !== currentUserId)
            .map((m) => ({
                id: m.user.id,
                name: m.user.full_name || m.user.username || "unknown",
                avatarUrl: m.user.avatar_url,
            }));
    }, [members, currentUserId]);

    // 获取笔记内容 JSON
    const getNoteContent = () => {
        return noteContentRef.current;
    };

    return (
        <TooltipProvider>
            <div className="h-screen flex flex-col bg-background">
                {/* 顶部工具栏 */}
                <header className="flex-shrink-0 border-b border-border/50 bg-background/80 backdrop-blur-md">
                    <div className="flex items-center justify-between h-14 px-4">
                        <div className="flex items-center gap-3">
                            <Link href="/lab">
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <ArrowLeft className="h-4 w-4" />
                                </Button>
                            </Link>
                            <div className="flex items-center gap-2">
                                <FlaskConical className="h-4 w-4 text-violet-500" />
                                <h1 className="font-semibold text-foreground truncate max-w-[200px] sm:max-w-none">
                                    {room.name}
                                </h1>
                            </div>
                            <Badge variant="secondary" className="text-xs hidden sm:flex">
                                {room.room_type === "reading" ? "帖子共读" : room.room_type === "whiteboard" ? "白板推导" : "混合模式"}
                            </Badge>

                            {/* 连接状态 */}
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className={cn(
                                        "flex items-center gap-1 px-2 py-1 rounded-full text-xs",
                                        yjsConnected
                                            ? "bg-emerald-500/10 text-emerald-600"
                                            : "bg-red-500/10 text-red-500"
                                    )}>
                                        {yjsConnected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                                        {yjsConnected ? `${connectedPeers + 1}人在线` : "断线"}
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                    {yjsConnected
                                        ? `WebRTC P2P 已连接，${connectedPeers} 位协作者`
                                        : "正在重连..."}
                                </TooltipContent>
                            </Tooltip>
                        </div>

                        <div className="flex items-center gap-2">
                            {/* 保存状态指示器 */}
                            <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground mr-1">
                                {isSaving ? (
                                    <>
                                        <Loader2 className="h-3 w-3 animate-spin text-amber-500" />
                                        <span className="text-amber-600">保存中...</span>
                                    </>
                                ) : lastSavedAt ? (
                                    <>
                                        <Check className="h-3 w-3 text-emerald-500" />
                                        <span>已保存</span>
                                    </>
                                ) : null}
                            </div>
                            {/* 在线成员头像（实时） */}
                            <div className="flex -space-x-2 mr-2">
                                {onlineMembers.slice(0, 5).map((om) => (
                                    <Tooltip key={om.id}>
                                        <TooltipTrigger asChild>
                                            <div className="relative">
                                                <Avatar className="h-7 w-7 ring-2 ring-background">
                                                    <AvatarImage src={om.avatarUrl} />
                                                    <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                                        {(om.username).slice(0, 2).toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-500 ring-1 ring-background" />
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent>{om.fullName || om.username} (在线)</TooltipContent>
                                    </Tooltip>
                                ))}
                                {onlineMembers.length > 5 && (
                                    <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center ring-2 ring-background">
                                        <span className="text-xs text-muted-foreground">+{onlineMembers.length - 5}</span>
                                    </div>
                                )}
                            </div>

                            {/* 手动保存 */}
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => manualSave()}
                                        disabled={isSaving}
                                    >
                                        <Save className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>手动保存（创建版本快照）</TooltipContent>
                            </Tooltip>

                            {/* 版本历史 */}
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => setShowHistory(true)}
                                    >
                                        <History className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>版本历史</TooltipContent>
                            </Tooltip>

                            {/* 发布共创帖子 */}
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="gap-1.5 text-violet-600 border-violet-500/30 hover:bg-violet-500/10"
                                        onClick={() => setShowPublishDialog(true)}
                                    >
                                        <Send className="h-3.5 w-3.5" />
                                        <span className="hidden sm:inline">发布共创帖子</span>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>将协作笔记发布为论坛帖子</TooltipContent>
                            </Tooltip>

                            {isOwnerOrAdmin && (
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowSettings(true)}>
                                    <Settings className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    </div>
                </header>

                {/* 主体内容区 */}
                <div className="flex-1 flex overflow-hidden">
                    {/* 左栏 - 帖子阅读区 */}
                    <div className="w-1/2 flex flex-col min-w-0 border-r border-border/30">
                        {selectedPost ? (
                            <>
                                {/* 帖子标题 */}
                                <div className="flex-shrink-0 px-6 py-3 border-b border-border/30 bg-muted/20">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h2 className="font-semibold text-foreground">{selectedPost.title}</h2>
                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                作者: {selectedPost.author.full_name || selectedPost.author.username}
                                                {selectedPost.tags?.length > 0 && ` · ${selectedPost.tags.join(", ")}`}
                                            </p>
                                        </div>
                                        <Link href={`/posts/${selectedPost.id}`} target="_blank">
                                            <Button variant="ghost" size="sm" className="text-xs gap-1">
                                                查看原帖
                                                <ChevronRight className="h-3 w-3" />
                                            </Button>
                                        </Link>
                                    </div>
                                </div>

                                {/* 帖子内容（带滚动同步） key 确保切换帖子时重新渲染 */}
                                <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-6 py-4">
                                    <NovelViewer key={selectedPost.id} initialValue={selectedPost.content as import("novel").JSONContent} />
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex items-center justify-center">
                                <div className="text-center">
                                    <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
                                    <p className="text-muted-foreground mb-4">还没有添加共读帖子</p>
                                    <Button
                                        variant="outline"
                                        className="gap-2"
                                        onClick={() => setShowPostSearch(true)}
                                    >
                                        <Plus className="h-4 w-4" />
                                        添加第一篇帖子
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* 底部帖子列表 */}
                        {postLinks.length > 0 && (
                            <div className="flex-shrink-0 border-t border-border/30 bg-muted/10 p-3">
                                <div className="flex items-center gap-2 overflow-x-auto">
                                    <span className="text-xs text-muted-foreground flex-shrink-0">
                                        <FileText className="h-3.5 w-3.5 inline mr-1" />
                                        共读列表:
                                    </span>
                                    {postLinks.map((link, idx) => (
                                        <button
                                            key={link.id}
                                            onClick={() => setSelectedPostIndex(idx)}
                                            className={cn(
                                                "text-xs px-3 py-1.5 rounded-full whitespace-nowrap transition-colors",
                                                idx === selectedPostIndex
                                                    ? "bg-primary text-primary-foreground"
                                                    : "bg-muted hover:bg-muted/80 text-muted-foreground"
                                            )}
                                        >
                                            {link.post.title}
                                        </button>
                                    ))}
                                    <button
                                        onClick={() => setShowPostSearch(true)}
                                        className="text-xs px-2 py-1.5 rounded-full bg-muted/50 hover:bg-muted text-muted-foreground transition-colors flex-shrink-0"
                                    >
                                        <Plus className="h-3 w-3" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 右栏 - 协作笔记区 */}
                    <div className="hidden md:flex flex-col w-1/2 bg-background">
                        <div className="flex-shrink-0 px-4 py-3 border-b border-border/30 flex items-center justify-between">
                            <div>
                                <h3 className="font-semibold text-sm text-foreground">📝 协作笔记</h3>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    {yjsConnected
                                        ? `实时同步中 · ${connectedPeers + 1}人协作`
                                        : "正在连接协作服务..."}
                                </p>
                            </div>
                            {yjsConnected && (
                                <div className="flex items-center gap-1">
                                    <Link2 className="h-3 w-3 text-emerald-500" />
                                    <span className="text-[10px] text-emerald-600">P2P</span>
                                </div>
                            )}
                        </div>

                        {/* Novel 协作编辑器 */}
                        <div className="flex-1 overflow-y-auto">
                            {ydoc && awarenessProvider ? (
                                <NovelCollabEditor
                                    ydoc={ydoc}
                                    awarenessProvider={awarenessProvider}
                                    currentUser={{ name: displayName, color: userColor }}
                                    onUpdate={handleEditorUpdate}
                                />
                            ) : (
                                <div className="flex items-center justify-center h-full">
                                    <div className="text-center">
                                        <Loader2 className="h-6 w-6 mx-auto mb-2 animate-spin text-muted-foreground/40" />
                                        <p className="text-xs text-muted-foreground">正在初始化协作编辑器...</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 右栏底部 - 在线成员列表 */}
                        <div className="flex-shrink-0 border-t border-border/30 p-3">
                            <p className="text-xs font-medium text-muted-foreground mb-2">
                                <Users className="h-3.5 w-3.5 inline mr-1" />
                                在线 ({onlineMembers.length}) / 全部 ({members.length})
                            </p>
                            <div className="space-y-1.5 max-h-32 overflow-y-auto">
                                {members.map((member) => {
                                    const isOnlineNow = onlineMembers.some((om) => om.id === member.user.id);
                                    return (
                                        <div key={member.id} className="flex items-center gap-2">
                                            <div className="relative">
                                                <Avatar className="h-6 w-6">
                                                    <AvatarImage src={member.user.avatar_url} />
                                                    <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                                                        {(member.user.username || "?").slice(0, 2).toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                                {isOnlineNow && (
                                                    <span className="absolute bottom-0 right-0 h-1.5 w-1.5 rounded-full bg-emerald-500 ring-1 ring-background" />
                                                )}
                                            </div>
                                            <span className={cn(
                                                "text-xs truncate",
                                                isOnlineNow ? "text-foreground" : "text-muted-foreground"
                                            )}>
                                                {member.user.full_name || member.user.username}
                                            </span>
                                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 ml-auto">
                                                {roleLabels[member.role] || member.role}
                                            </Badge>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 搜索添加帖子对话框 */}
                <PostSearchDialog
                    open={showPostSearch}
                    onOpenChange={setShowPostSearch}
                    roomId={room.id}
                />

                {/* 共创发帖对话框 */}
                <PublishCoPostDialog
                    open={showPublishDialog}
                    onOpenChange={setShowPublishDialog}
                    roomId={room.id}
                    roomName={room.name}
                    currentUserId={currentUserId}
                    collaborators={collaborators}
                    noteContent={getNoteContent()}
                />

                {/* 设置对话框 */}
                <LabSettingsDialog
                    open={showSettings}
                    onOpenChange={setShowSettings}
                    room={{
                        id: room.id,
                        name: room.name,
                        description: room.description,
                        room_type: room.room_type,
                        max_members: (room as any).max_members ?? 10,
                        created_by: room.created_by,
                    }}
                    members={members}
                    currentUserId={currentUserId}
                />

                {/* 版本历史对话框 */}
                <NoteHistoryDialog
                    open={showHistory}
                    onOpenChange={setShowHistory}
                    roomId={room.id}
                    onRollback={rollbackToSnapshot}
                    onManualSave={manualSave}
                    isSaving={isSaving}
                    isRestoring={isRestoring}
                    isOwnerOrAdmin={isOwnerOrAdmin}
                />
            </div>
        </TooltipProvider>
    );
}
