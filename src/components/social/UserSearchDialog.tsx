"use client";

import { useState, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, UserPlus, Loader2, Check, Clock } from "lucide-react";
import { useFriends, type Profile } from "@/hooks/useFriends";
import { toast } from "sonner";

interface UserSearchDialogProps {
    currentUserId: string;
    trigger?: React.ReactNode;
}

export function UserSearchDialog({ currentUserId, trigger }: UserSearchDialogProps) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<Profile[]>([]);
    const [searching, setSearching] = useState(false);
    const [sendingTo, setSendingTo] = useState<string | null>(null);

    const { searchUsers, sendFriendRequest, sentRequests, friends } = useFriends(currentUserId);

    const handleSearch = useCallback(async () => {
        if (!query.trim()) {
            setResults([]);
            return;
        }

        setSearching(true);
        const users = await searchUsers(query);
        setResults(users);
        setSearching(false);
    }, [query, searchUsers]);

    const handleSendRequest = async (userId: string) => {
        setSendingTo(userId);
        const result = await sendFriendRequest(userId);
        setSendingTo(null);

        if (result.success) {
            toast.success("好友请求已发送");
        } else {
            toast.error(result.error || "发送失败");
        }
    };

    const getRelationshipStatus = (userId: string) => {
        // 检查是否已是好友
        if (friends.some((f) => f.friend.id === userId)) {
            return "friend";
        }
        // 检查是否已发送请求
        if (sentRequests.some((r) => r.addressee_id === userId)) {
            return "pending";
        }
        return "none";
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="outline" size="sm" className="gap-2">
                        <Search className="h-4 w-4" />
                        搜索用户
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>搜索用户</DialogTitle>
                </DialogHeader>

                <div className="flex gap-2">
                    <Input
                        placeholder="输入用户名或邮箱搜索..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    />
                    <Button onClick={handleSearch} disabled={searching}>
                        {searching ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Search className="h-4 w-4" />
                        )}
                    </Button>
                </div>

                <ScrollArea className="max-h-[300px]">
                    {results.length === 0 && query && !searching ? (
                        <div className="text-center text-muted-foreground py-8">
                            未找到匹配的用户
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {results.map((user) => {
                                const relationship = getRelationshipStatus(user.id);
                                const initials = (user.username || user.email || "?").charAt(0).toUpperCase();

                                return (
                                    <div
                                        key={user.id}
                                        className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-10 w-10">
                                                <AvatarImage src={user.avatar_url || undefined} />
                                                <AvatarFallback className="bg-gradient-to-br from-primary/30 to-primary/10 text-primary">
                                                    {initials}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-medium text-sm">
                                                    {user.username || user.email.split("@")[0]}
                                                </p>
                                                <p className="text-xs text-muted-foreground">{user.email}</p>
                                            </div>
                                        </div>

                                        {relationship === "friend" ? (
                                            <Button variant="ghost" size="sm" disabled className="gap-1.5">
                                                <Check className="h-4 w-4 text-green-500" />
                                                已是好友
                                            </Button>
                                        ) : relationship === "pending" ? (
                                            <Button variant="ghost" size="sm" disabled className="gap-1.5">
                                                <Clock className="h-4 w-4 text-amber-500" />
                                                等待确认
                                            </Button>
                                        ) : (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleSendRequest(user.id)}
                                                disabled={sendingTo === user.id}
                                                className="gap-1.5"
                                            >
                                                {sendingTo === user.id ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <UserPlus className="h-4 w-4" />
                                                )}
                                                添加好友
                                            </Button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
