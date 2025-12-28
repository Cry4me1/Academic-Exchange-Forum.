"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Check, X, Loader2 } from "lucide-react";
import { useFriends, type Friendship } from "@/hooks/useFriends";
import { toast } from "sonner";

interface FriendRequestCardProps {
    request: Friendship;
    currentUserId: string;
}

export function FriendRequestCard({ request, currentUserId }: FriendRequestCardProps) {
    const [processing, setProcessing] = useState<"accept" | "reject" | null>(null);
    const { acceptFriendRequest, rejectFriendRequest } = useFriends(currentUserId);

    const requester = request.requester;
    const initials = (requester?.username || requester?.email || "?").charAt(0).toUpperCase();

    const handleAccept = async () => {
        setProcessing("accept");
        const result = await acceptFriendRequest(request.id);
        setProcessing(null);

        if (result.success) {
            toast.success("已接受好友请求");
        } else {
            toast.error(result.error || "操作失败");
        }
    };

    const handleReject = async () => {
        setProcessing("reject");
        const result = await rejectFriendRequest(request.id);
        setProcessing(null);

        if (result.success) {
            toast.success("已拒绝好友请求");
        } else {
            toast.error(result.error || "操作失败");
        }
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return "刚刚";
        if (diffMins < 60) return `${diffMins} 分钟前`;
        if (diffHours < 24) return `${diffHours} 小时前`;
        if (diffDays < 7) return `${diffDays} 天前`;

        return date.toLocaleDateString("zh-CN");
    };

    return (
        <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12 border-2 border-background shadow-sm">
                            <AvatarImage src={requester?.avatar_url || undefined} />
                            <AvatarFallback className="bg-gradient-to-br from-primary/30 to-primary/10 text-primary font-semibold">
                                {initials}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="font-semibold text-foreground">
                                {requester?.username || requester?.email?.split("@")[0] || "未知用户"}
                            </p>
                            <p className="text-sm text-muted-foreground">
                                {formatTime(request.created_at)}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleReject}
                            disabled={processing !== null}
                            className="gap-1.5 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50"
                        >
                            {processing === "reject" ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <X className="h-4 w-4" />
                            )}
                            拒绝
                        </Button>
                        <Button
                            size="sm"
                            onClick={handleAccept}
                            disabled={processing !== null}
                            className="gap-1.5"
                        >
                            {processing === "accept" ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Check className="h-4 w-4" />
                            )}
                            接受
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
