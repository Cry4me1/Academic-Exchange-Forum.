"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useFriends, type FriendWithProfile } from "@/hooks/useFriends";
import { usePresence } from "@/hooks/usePresence";
import { Loader2 } from "lucide-react";
import Link from "next/link";

interface FriendItemProps {
    friend: FriendWithProfile["friend"];
    friendshipId: string;
    isOnline: boolean;
}

function FriendItem({ friend, friendshipId, isOnline }: FriendItemProps) {
    const initials = (friend.username || friend.email || "?").charAt(0).toUpperCase();
    const displayName = friend.username || friend.email?.split("@")[0] || "未知用户";

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors duration-200 group">
                        {/* 头像点击跳转到用户主页 */}
                        <Link href={`/user/${friend.id}`} className="relative">
                            <Avatar className="h-9 w-9 border-2 border-background shadow-sm group-hover:ring-2 group-hover:ring-primary/20 transition-all">
                                <AvatarImage src={friend.avatar_url || undefined} alt={displayName} />
                                <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-medium text-sm">
                                    {initials}
                                </AvatarFallback>
                            </Avatar>
                            {/* 在线状态指示器 */}
                            <span
                                className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background ${isOnline
                                    ? "bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]"
                                    : "bg-gray-400"
                                    }`}
                            />
                        </Link>
                        {/* 名字点击跳转到消息页 */}
                        <Link href={`/messages?user=${friend.id}`} className="flex-1 truncate">
                            <span className="text-sm font-medium text-foreground/80 group-hover:text-foreground truncate">
                                {displayName}
                            </span>
                        </Link>
                    </div>
                </TooltipTrigger>
                <TooltipContent side="right">
                    <p>{displayName} - {isOnline ? "在线" : "离线"}</p>
                    <p className="text-xs text-muted-foreground">点击头像查看主页，点击名字发消息</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}

interface FriendsListProps {
    currentUserId: string | null;
}

export function FriendsList({ currentUserId }: FriendsListProps) {
    const { friends, loading } = useFriends(currentUserId);
    const { isOnline } = usePresence(currentUserId);

    // 根据在线状态分组好友
    const onlineFriends = friends.filter((f) => isOnline(f.friend.id));
    const offlineFriends = friends.filter((f) => !isOnline(f.friend.id));

    if (loading) {
        return (
            <div className="mt-6 flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (friends.length === 0) {
        return (
            <div className="mt-6 text-center py-4">
                <p className="text-sm text-muted-foreground">暂无好友</p>
                <Link href="/friends" className="text-xs text-primary hover:underline mt-1 block">
                    添加好友
                </Link>
            </div>
        );
    }

    return (
        <div className="mt-6">
            <ScrollArea className="h-[calc(100vh-400px)]">
                {/* 在线好友 */}
                {onlineFriends.length > 0 && (
                    <div className="mb-4">
                        <div className="flex items-center gap-2 px-2 mb-2">
                            <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                在线好友 ({onlineFriends.length})
                            </h3>
                        </div>
                        <div className="space-y-0.5">
                            {onlineFriends.map((f) => (
                                <FriendItem
                                    key={f.friendshipId}
                                    friend={f.friend}
                                    friendshipId={f.friendshipId}
                                    isOnline={true}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* 离线好友 */}
                {offlineFriends.length > 0 && (
                    <div>
                        <div className="flex items-center gap-2 px-2 mb-2">
                            <span className="h-2 w-2 rounded-full bg-gray-400" />
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                离线好友 ({offlineFriends.length})
                            </h3>
                        </div>
                        <div className="space-y-0.5">
                            {offlineFriends.map((f) => (
                                <FriendItem
                                    key={f.friendshipId}
                                    friend={f.friend}
                                    friendshipId={f.friendshipId}
                                    isOnline={false}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </ScrollArea>
        </div>
    );
}
