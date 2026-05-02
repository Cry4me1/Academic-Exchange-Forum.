"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { publishCoPost } from "@/app/(protected)/lab/actions";
import { FileText, Loader2, Send, Users } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface CoAuthorEntry {
    userId: string;
    username: string;
    fullName?: string;
    avatarUrl?: string;
    role: "co_author" | "contributor" | "annotator";
    contribution: string;
}

interface PublishCoPostDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    roomId: string;
    roomName: string;
    currentUserId: string;
    /** 从 Yjs awareness 获取的参与过编辑的用户列表 */
    collaborators: {
        id: string;
        name: string;
        avatarUrl?: string;
    }[];
    /** 从 Yjs doc 获取的笔记内容 JSON */
    noteContent: object | null;
}

const roleOptions = [
    { value: "co_author", label: "共创作者" },
    { value: "contributor", label: "贡献者" },
    { value: "annotator", label: "批注者" },
] as const;

export function PublishCoPostDialog({
    open,
    onOpenChange,
    roomId,
    roomName,
    currentUserId,
    collaborators,
    noteContent,
}: PublishCoPostDialogProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [title, setTitle] = useState("");
    const [tags, setTags] = useState("");
    const [coAuthors, setCoAuthors] = useState<CoAuthorEntry[]>(() =>
        collaborators
            .filter((c) => c.id !== currentUserId)
            .map((c) => ({
                userId: c.id,
                username: c.name,
                fullName: c.name,
                avatarUrl: c.avatarUrl,
                role: "co_author" as const,
                contribution: "",
            }))
    );

    const updateCoAuthorRole = (userId: string, role: CoAuthorEntry["role"]) => {
        setCoAuthors((prev) =>
            prev.map((ca) => (ca.userId === userId ? { ...ca, role } : ca))
        );
    };

    const updateCoAuthorContribution = (userId: string, contribution: string) => {
        setCoAuthors((prev) =>
            prev.map((ca) => (ca.userId === userId ? { ...ca, contribution } : ca))
        );
    };

    const handlePublish = () => {
        if (!title.trim()) {
            toast.error("请输入帖子标题");
            return;
        }
        if (!noteContent) {
            toast.error("笔记内容为空，请先编写内容");
            return;
        }

        startTransition(async () => {
            const tagList = tags
                .split(/[,，\s]+/)
                .map((t) => t.trim())
                .filter(Boolean);

            const result = await publishCoPost({
                roomId,
                title: title.trim(),
                tags: tagList,
                content: noteContent,
                coAuthors: coAuthors.map((ca) => ({
                    userId: ca.userId,
                    role: ca.role,
                    contributionSummary: ca.contribution || undefined,
                })),
            });

            if (result.error) {
                toast.error(result.error);
            } else if (result.data) {
                toast.success("共创帖子发布成功！");
                onOpenChange(false);
                router.push(`/posts/${result.data.id}`);
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Send className="h-5 w-5 text-violet-500" />
                        发布共创帖子
                    </DialogTitle>
                    <DialogDescription>
                        将协作笔记发布为论坛帖子，自动标注所有共创者
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* 标题 */}
                    <div className="space-y-2">
                        <Label htmlFor="post-title">帖子标题 *</Label>
                        <Input
                            id="post-title"
                            placeholder="输入帖子标题..."
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            maxLength={100}
                        />
                    </div>

                    {/* 标签 */}
                    <div className="space-y-2">
                        <Label htmlFor="post-tags">标签（逗号分隔）</Label>
                        <Input
                            id="post-tags"
                            placeholder="量子计算, 机器学习, 论文精读"
                            value={tags}
                            onChange={(e) => setTags(e.target.value)}
                        />
                    </div>

                    {/* 来源研究室 */}
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-violet-500/5 border border-violet-500/15">
                        <FileText className="h-4 w-4 text-violet-500 flex-shrink-0" />
                        <span className="text-sm text-muted-foreground">来源研究室：</span>
                        <Badge variant="secondary" className="text-xs">{roomName}</Badge>
                    </div>

                    {/* 共创者确认 */}
                    {coAuthors.length > 0 && (
                        <div className="space-y-2">
                            <Label className="flex items-center gap-1.5">
                                <Users className="h-4 w-4" />
                                共创者 ({coAuthors.length})
                            </Label>
                            <div className="space-y-2 max-h-[200px] overflow-y-auto">
                                {coAuthors.map((ca) => (
                                    <div
                                        key={ca.userId}
                                        className="flex items-center gap-2 p-2 rounded-lg border border-border/50 bg-muted/20"
                                    >
                                        <Avatar className="h-7 w-7 flex-shrink-0">
                                            <AvatarImage src={ca.avatarUrl} />
                                            <AvatarFallback className="text-[10px] bg-violet-500/10 text-violet-600">
                                                {ca.username.slice(0, 2).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <span className="text-sm font-medium truncate min-w-0">
                                            {ca.fullName || ca.username}
                                        </span>
                                        <Select
                                            value={ca.role}
                                            onValueChange={(v) =>
                                                updateCoAuthorRole(ca.userId, v as CoAuthorEntry["role"])
                                            }
                                        >
                                            <SelectTrigger className="h-7 w-[100px] text-xs ml-auto flex-shrink-0">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {roleOptions.map((opt) => (
                                                    <SelectItem key={opt.value} value={opt.value} className="text-xs">
                                                        {opt.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        取消
                    </Button>
                    <Button
                        onClick={handlePublish}
                        disabled={isPending || !title.trim() || !noteContent}
                        className="gap-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white"
                    >
                        {isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Send className="h-4 w-4" />
                        )}
                        发布帖子
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
