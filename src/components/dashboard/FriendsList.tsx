"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// 模拟数据 - 后续可通过 Supabase Realtime/Presence 获取真实数据
const mockFriends = {
    online: [
        { id: "1", name: "李明", avatar: "", initials: "李" },
        { id: "2", name: "王晓华", avatar: "", initials: "王" },
        { id: "3", name: "张教授", avatar: "", initials: "张" },
    ],
    offline: [
        { id: "4", name: "陈博士", avatar: "", initials: "陈" },
        { id: "5", name: "刘研究员", avatar: "", initials: "刘" },
        { id: "6", name: "赵同学", avatar: "", initials: "赵" },
        { id: "7", name: "孙博后", avatar: "", initials: "孙" },
    ],
};

interface FriendItemProps {
    friend: { id: string; name: string; avatar: string; initials: string };
    isOnline: boolean;
}

function FriendItem({ friend, isOnline }: FriendItemProps) {
    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors duration-200 group">
                        <div className="relative">
                            <Avatar className="h-9 w-9 border-2 border-background shadow-sm">
                                <AvatarImage src={friend.avatar} alt={friend.name} />
                                <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-medium text-sm">
                                    {friend.initials}
                                </AvatarFallback>
                            </Avatar>
                            {/* 在线状态指示器 */}
                            <span
                                className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background ${isOnline
                                        ? "bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]"
                                        : "bg-gray-400"
                                    }`}
                            />
                        </div>
                        <span className="text-sm font-medium text-foreground/80 group-hover:text-foreground truncate">
                            {friend.name}
                        </span>
                    </div>
                </TooltipTrigger>
                <TooltipContent side="right">
                    <p>{friend.name} - {isOnline ? "在线" : "离线"}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}

interface FriendsListProps {
    // 预留 Supabase Realtime Presence 数据接口
    onlineFriends?: typeof mockFriends.online;
    offlineFriends?: typeof mockFriends.offline;
}

export function FriendsList({
    onlineFriends = mockFriends.online,
    offlineFriends = mockFriends.offline
}: FriendsListProps) {
    return (
        <div className="mt-6">
            <ScrollArea className="h-[calc(100vh-400px)]">
                {/* 在线好友 */}
                <div className="mb-4">
                    <div className="flex items-center gap-2 px-2 mb-2">
                        <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            在线好友 ({onlineFriends.length})
                        </h3>
                    </div>
                    <div className="space-y-0.5">
                        {onlineFriends.map((friend) => (
                            <FriendItem key={friend.id} friend={friend} isOnline={true} />
                        ))}
                    </div>
                </div>

                {/* 离线好友 */}
                <div>
                    <div className="flex items-center gap-2 px-2 mb-2">
                        <span className="h-2 w-2 rounded-full bg-gray-400" />
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            离线好友 ({offlineFriends.length})
                        </h3>
                    </div>
                    <div className="space-y-0.5">
                        {offlineFriends.map((friend) => (
                            <FriendItem key={friend.id} friend={friend} isOnline={false} />
                        ))}
                    </div>
                </div>
            </ScrollArea>
        </div>
    );
}
