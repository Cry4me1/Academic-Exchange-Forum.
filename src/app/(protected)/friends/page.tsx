"use client";

import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
    Users,
    UserPlus,
    Clock,
    Search,
    MessageCircle,
    Trash2,
    Loader2,
} from "lucide-react";
import { UserSearchDialog, FriendRequestCard } from "@/components/social";
import { useFriends } from "@/hooks/useFriends";
import { usePresence } from "@/hooks/usePresence";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function FriendsPage() {
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const supabase = createClient();

    // 获取当前用户
    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setCurrentUserId(user.id);
            }
        };
        getUser();
    }, [supabase]);

    const {
        friends,
        pendingRequests,
        sentRequests,
        loading,
        removeFriend,
        cancelRequest,
    } = useFriends(currentUserId);
    const { isOnline } = usePresence(currentUserId);

    const handleRemoveFriend = async (friendshipId: string, friendName: string) => {
        const result = await removeFriend(friendshipId);
        if (result.success) {
            toast.success(`已删除好友 ${friendName}`);
        } else {
            toast.error(result.error || "操作失败");
        }
    };

    const handleCancelRequest = async (friendshipId: string) => {
        const result = await cancelRequest(friendshipId);
        if (result.success) {
            toast.success("已取消好友请求");
        } else {
            toast.error(result.error || "操作失败");
        }
    };

    if (!currentUserId) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="container max-w-4xl mx-auto py-8 px-4">
            {/* 头部 */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">好友管理</h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        管理您的好友和好友请求
                    </p>
                </div>
                <UserSearchDialog
                    currentUserId={currentUserId}
                    trigger={
                        <Button className="gap-2">
                            <UserPlus className="h-4 w-4" />
                            添加好友
                        </Button>
                    }
                />
            </div>

            <Tabs defaultValue="friends" className="space-y-6">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="friends" className="gap-2">
                        <Users className="h-4 w-4" />
                        好友 ({friends.length})
                    </TabsTrigger>
                    <TabsTrigger value="requests" className="gap-2">
                        <UserPlus className="h-4 w-4" />
                        收到的请求
                        {pendingRequests.length > 0 && (
                            <Badge variant="destructive" className="ml-1">
                                {pendingRequests.length}
                            </Badge>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="sent" className="gap-2">
                        <Clock className="h-4 w-4" />
                        已发送 ({sentRequests.length})
                    </TabsTrigger>
                </TabsList>

                {/* 好友列表 */}
                <TabsContent value="friends">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">好友列表</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                </div>
                            ) : friends.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                    <p className="text-sm">暂无好友</p>
                                    <p className="text-xs mt-1">点击"添加好友"搜索并添加好友</p>
                                </div>
                            ) : (
                                <ScrollArea className="max-h-[500px]">
                                    <div className="space-y-2">
                                        {friends.map((f) => {
                                            const isPartnerOnline = isOnline(f.friend.id);
                                            const initials = (
                                                f.friend.username ||
                                                f.friend.email ||
                                                "?"
                                            )
                                                .charAt(0)
                                                .toUpperCase();

                                            return (
                                                <div
                                                    key={f.friendshipId}
                                                    className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors group"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="relative">
                                                            <Avatar className="h-12 w-12 border-2 border-background shadow-sm">
                                                                <AvatarImage
                                                                    src={f.friend.avatar_url || undefined}
                                                                />
                                                                <AvatarFallback className="bg-gradient-to-br from-primary/30 to-primary/10 text-primary font-semibold">
                                                                    {initials}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <span
                                                                className={cn(
                                                                    "absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background",
                                                                    isPartnerOnline
                                                                        ? "bg-green-500 animate-pulse"
                                                                        : "bg-gray-400"
                                                                )}
                                                            />
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-foreground">
                                                                {f.friend.username ||
                                                                    f.friend.email.split("@")[0]}
                                                            </p>
                                                            <p className="text-xs text-muted-foreground">
                                                                {isPartnerOnline ? "在线" : "离线"}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        <Link href={`/messages?user=${f.friend.id}`}>
                                                            <Button variant="outline" size="sm" className="gap-1.5">
                                                                <MessageCircle className="h-4 w-4" />
                                                                私信
                                                            </Button>
                                                        </Link>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                                                            onClick={() =>
                                                                handleRemoveFriend(
                                                                    f.friendshipId,
                                                                    f.friend.username ||
                                                                    f.friend.email.split("@")[0]
                                                                )
                                                            }
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </ScrollArea>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* 收到的请求 */}
                <TabsContent value="requests">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">待处理的好友请求</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                </div>
                            ) : pendingRequests.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <UserPlus className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                    <p className="text-sm">暂无待处理的好友请求</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {pendingRequests.map((request) => (
                                        <FriendRequestCard
                                            key={request.id}
                                            request={request}
                                            currentUserId={currentUserId}
                                        />
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* 已发送的请求 */}
                <TabsContent value="sent">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">已发送的好友请求</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                </div>
                            ) : sentRequests.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                    <p className="text-sm">暂无已发送的请求</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {sentRequests.map((request) => {
                                        const addressee = request.addressee;
                                        const initials = (
                                            addressee?.username ||
                                            addressee?.email ||
                                            "?"
                                        )
                                            .charAt(0)
                                            .toUpperCase();

                                        return (
                                            <div
                                                key={request.id}
                                                className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-10 w-10">
                                                        <AvatarImage
                                                            src={addressee?.avatar_url || undefined}
                                                        />
                                                        <AvatarFallback className="bg-gradient-to-br from-primary/30 to-primary/10 text-primary">
                                                            {initials}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="font-medium text-sm">
                                                            {addressee?.username ||
                                                                addressee?.email?.split("@")[0] ||
                                                                "未知用户"}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            等待对方确认
                                                        </p>
                                                    </div>
                                                </div>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleCancelRequest(request.id)}
                                                >
                                                    取消请求
                                                </Button>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
