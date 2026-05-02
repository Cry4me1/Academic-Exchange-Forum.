"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
import { Separator } from "@/components/ui/separator";
import { deleteLabRoom } from "@/app/(protected)/lab/actions";
import {
    AlertTriangle,
    Copy,
    Check,
    Crown,
    Link2,
    Loader2,
    Shield,
    Trash2,
    Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

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

interface LabSettingsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    room: {
        id: string;
        name: string;
        description?: string;
        room_type: string;
        max_members: number;
        created_by: string;
    };
    members: Member[];
    currentUserId: string;
}

const roleLabels: Record<string, string> = {
    owner: "创建者",
    admin: "管理员",
    editor: "编辑者",
    viewer: "观察者",
};

const roleIcons: Record<string, React.ReactNode> = {
    owner: <Crown className="h-3 w-3 text-amber-500" />,
    admin: <Shield className="h-3 w-3 text-blue-500" />,
};

export function LabSettingsDialog({
    open,
    onOpenChange,
    room,
    members,
    currentUserId,
}: LabSettingsDialogProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [copied, setCopied] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const isOwner = room.created_by === currentUserId;
    const joinLink = typeof window !== "undefined"
        ? `${window.location.origin}/lab/join/${room.id}`
        : `/lab/join/${room.id}`;

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(joinLink);
            setCopied(true);
            toast.success("邀请链接已复制到剪贴板");
            setTimeout(() => setCopied(false), 2000);
        } catch {
            toast.error("复制失败，请手动复制");
        }
    };

    const handleDelete = () => {
        startTransition(async () => {
            const result = await deleteLabRoom(room.id);
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success("研究室已删除");
                onOpenChange(false);
                router.push("/lab");
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>研究室设置</DialogTitle>
                    <DialogDescription>{room.name}</DialogDescription>
                </DialogHeader>

                <div className="space-y-5">
                    {/* 邀请链接 */}
                    <div className="space-y-2">
                        <Label className="flex items-center gap-1.5">
                            <Link2 className="h-4 w-4" />
                            邀请链接
                        </Label>
                        <p className="text-xs text-muted-foreground">
                            分享此链接邀请其他用户加入研究室
                        </p>
                        <div className="flex gap-2">
                            <Input
                                value={joinLink}
                                readOnly
                                className="text-xs font-mono bg-muted/50"
                            />
                            <Button
                                variant="outline"
                                size="icon"
                                className="flex-shrink-0"
                                onClick={handleCopyLink}
                            >
                                {copied ? (
                                    <Check className="h-4 w-4 text-emerald-500" />
                                ) : (
                                    <Copy className="h-4 w-4" />
                                )}
                            </Button>
                        </div>
                    </div>

                    <Separator />

                    {/* 房间信息 */}
                    <div className="space-y-2">
                        <Label>房间信息</Label>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="p-2 rounded-lg bg-muted/30">
                                <p className="text-xs text-muted-foreground">类型</p>
                                <p className="font-medium">
                                    {room.room_type === "reading" ? "帖子共读" : room.room_type === "whiteboard" ? "白板推导" : "混合模式"}
                                </p>
                            </div>
                            <div className="p-2 rounded-lg bg-muted/30">
                                <p className="text-xs text-muted-foreground">容量</p>
                                <p className="font-medium">{members.length} / {room.max_members}</p>
                            </div>
                        </div>
                    </div>

                    <Separator />

                    {/* 成员列表 */}
                    <div className="space-y-2">
                        <Label className="flex items-center gap-1.5">
                            <Users className="h-4 w-4" />
                            成员 ({members.length})
                        </Label>
                        <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
                            {members.map((member) => (
                                <div
                                    key={member.id}
                                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/30 transition-colors"
                                >
                                    <Avatar className="h-7 w-7">
                                        <AvatarImage src={member.user.avatar_url} />
                                        <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                                            {(member.user.username || "?").slice(0, 2).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">
                                            {member.user.full_name || member.user.username}
                                        </p>
                                    </div>
                                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 gap-1">
                                        {roleIcons[member.role]}
                                        {roleLabels[member.role] || member.role}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 危险操作 */}
                    {isOwner && (
                        <>
                            <Separator />
                            <div className="space-y-2">
                                <Label className="text-destructive flex items-center gap-1.5">
                                    <AlertTriangle className="h-4 w-4" />
                                    危险操作
                                </Label>
                                {!showDeleteConfirm ? (
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        className="w-full gap-2"
                                        onClick={() => setShowDeleteConfirm(true)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                        删除研究室
                                    </Button>
                                ) : (
                                    <div className="p-3 rounded-lg border border-destructive/30 bg-destructive/5 space-y-2">
                                        <p className="text-sm text-destructive font-medium">
                                            确定要删除此研究室？此操作不可撤销。
                                        </p>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="flex-1"
                                                onClick={() => setShowDeleteConfirm(false)}
                                            >
                                                取消
                                            </Button>
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                className="flex-1 gap-1.5"
                                                onClick={handleDelete}
                                                disabled={isPending}
                                            >
                                                {isPending ? (
                                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                ) : (
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                )}
                                                确认删除
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
