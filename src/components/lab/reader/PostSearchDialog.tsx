"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { addPostToRoom, searchPostsForRoom } from "@/app/(protected)/lab/actions";
import { Heart, Loader2, MessageCircle, Plus, Search } from "lucide-react";
import { useCallback, useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

interface PostResult {
    id: string;
    title: string;
    tags: string[];
    like_count: number;
    comment_count: number;
    created_at: string;
    author: {
        id: string;
        full_name?: string;
        username?: string;
        avatar_url?: string;
    };
}

interface PostSearchDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    roomId: string;
    onPostAdded?: (postLink: unknown) => void;
}

export function PostSearchDialog({ open, onOpenChange, roomId, onPostAdded }: PostSearchDialogProps) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<PostResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [addingId, setAddingId] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    const doSearch = useCallback(async (searchQuery: string) => {
        setIsSearching(true);
        const result = await searchPostsForRoom(searchQuery, roomId);
        if (result.error) {
            toast.error(result.error);
        } else {
            setResults(result.data as PostResult[]);
        }
        setIsSearching(false);
    }, [roomId]);

    // 打开时立即搜索
    useEffect(() => {
        if (open) {
            doSearch("");
        }
    }, [open, doSearch]);

    // 防抖搜索
    useEffect(() => {
        if (!open) return;
        const timer = setTimeout(() => {
            doSearch(query);
        }, 300);
        return () => clearTimeout(timer);
    }, [query, open, doSearch]);

    const handleAdd = (postId: string) => {
        setAddingId(postId);
        startTransition(async () => {
            const result = await addPostToRoom(roomId, postId);
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success("帖子已添加到共读列表");
                // 从搜索结果中移除
                setResults((prev) => prev.filter((p) => p.id !== postId));
                // 通知父组件更新
                if (onPostAdded && result.data) {
                    onPostAdded(result.data);
                }
            }
            setAddingId(null);
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>添加共读帖子</DialogTitle>
                    <DialogDescription>
                        搜索论坛中的帖子，添加到共读列表
                    </DialogDescription>
                </DialogHeader>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="搜索帖子标题..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="pl-9"
                        autoFocus
                    />
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 min-h-[200px] max-h-[400px]">
                    {isSearching ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        </div>
                    ) : results.length > 0 ? (
                        results.map((post) => (
                            <div
                                key={post.id}
                                className="flex items-start gap-3 p-3 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors"
                            >
                                <Avatar className="h-8 w-8 mt-0.5 flex-shrink-0">
                                    <AvatarImage src={post.author.avatar_url} />
                                    <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                        {(post.author.username || "?").slice(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm text-foreground line-clamp-1">
                                        {post.title}
                                    </p>
                                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                        <span>{post.author.full_name || post.author.username}</span>
                                        <span className="flex items-center gap-0.5">
                                            <Heart className="h-3 w-3" /> {post.like_count}
                                        </span>
                                        <span className="flex items-center gap-0.5">
                                            <MessageCircle className="h-3 w-3" /> {post.comment_count}
                                        </span>
                                    </div>
                                    {post.tags?.length > 0 && (
                                        <div className="flex gap-1 mt-1">
                                            {post.tags.slice(0, 3).map((tag) => (
                                                <span
                                                    key={tag}
                                                    className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground"
                                                >
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex-shrink-0 gap-1 h-8"
                                    onClick={() => handleAdd(post.id)}
                                    disabled={isPending && addingId === post.id}
                                >
                                    {isPending && addingId === post.id ? (
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                    ) : (
                                        <Plus className="h-3 w-3" />
                                    )}
                                    添加
                                </Button>
                            </div>
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                            <Search className="h-8 w-8 mb-2 opacity-30" />
                            <p className="text-sm">
                                {query ? "没有找到匹配的帖子" : "暂无可添加的帖子"}
                            </p>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
