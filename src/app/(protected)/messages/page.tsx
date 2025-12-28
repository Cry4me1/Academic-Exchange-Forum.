"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { ChatList } from "@/components/chat/ChatList";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageSquare, Search, Loader2 } from "lucide-react";
import { useMessages } from "@/hooks/useMessages";
import { useFriends } from "@/hooks/useFriends";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export default function MessagesPage() {
    const searchParams = useSearchParams();
    const initialPartnerId = searchParams.get("user");

    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [currentUser, setCurrentUser] = useState<{
        username: string | null;
        avatar_url: string | null;
    } | null>(null);
    const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(
        initialPartnerId
    );
    const [selectedPartner, setSelectedPartner] = useState<{
        name: string;
        email: string;
        avatar: string | null;
    } | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    const supabase = createClient();

    // 获取当前用户
    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setCurrentUserId(user.id);

                // 获取用户 profile
                const { data: profile } = await supabase
                    .from("profiles")
                    .select("username, avatar_url")
                    .eq("id", user.id)
                    .single();

                setCurrentUser(profile);
            }
        };
        getUser();
    }, [supabase]);

    const { conversations, loading: conversationsLoading } = useMessages(currentUserId);
    const { friends } = useFriends(currentUserId);

    // 选择对话时获取对方信息
    useEffect(() => {
        if (selectedPartnerId && currentUserId) {
            const fetchPartnerInfo = async () => {
                const { data } = await supabase
                    .from("profiles")
                    .select("username, email, avatar_url")
                    .eq("id", selectedPartnerId)
                    .single();

                if (data) {
                    setSelectedPartner({
                        name: data.username || data.email.split("@")[0],
                        email: data.email,
                        avatar: data.avatar_url,
                    });
                }
            };
            fetchPartnerInfo();
        }
    }, [selectedPartnerId, currentUserId, supabase]);

    // 过滤对话
    const filteredConversations = conversations.filter((conv) => {
        if (!searchQuery.trim()) return true;
        const name = conv.partnerUsername || conv.partnerEmail;
        return name.toLowerCase().includes(searchQuery.toLowerCase());
    });

    if (!currentUserId) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-background">
            {/* 左侧对话列表 */}
            <div
                className={cn(
                    "w-full md:w-80 lg:w-96 border-r flex flex-col",
                    selectedPartnerId && "hidden md:flex"
                )}
            >
                {/* 头部 */}
                <div className="p-4 border-b">
                    <h1 className="text-xl font-bold text-foreground mb-3">私信</h1>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="搜索对话..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                </div>

                {/* 好友列表 - 放在顶部 */}
                <div className="p-4 border-b bg-muted/30">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                        好友 ({friends.length})
                    </h3>
                    {friends.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                            {friends.map((f) => (
                                <Button
                                    key={f.friendshipId}
                                    variant={selectedPartnerId === f.friend.id ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setSelectedPartnerId(f.friend.id)}
                                    className="text-xs"
                                >
                                    {f.friend.username || f.friend.email?.split("@")[0] || "未知"}
                                </Button>
                            ))}
                        </div>
                    ) : (
                        <p className="text-xs text-muted-foreground">
                            暂无好友，请先在好友页添加好友
                        </p>
                    )}
                </div>

                {/* 对话列表 */}
                <div className="flex-1 overflow-y-auto">
                    {conversationsLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : filteredConversations.length > 0 ? (
                        <ChatList
                            conversations={filteredConversations}
                            currentUserId={currentUserId}
                            selectedPartnerId={selectedPartnerId || undefined}
                            onSelectConversation={setSelectedPartnerId}
                        />
                    ) : (
                        <div className="flex flex-col items-center justify-center text-muted-foreground p-8">
                            <MessageSquare className="h-10 w-10 mb-3 opacity-50" />
                            <p className="text-sm text-center">暂无对话</p>
                            <p className="text-xs text-center mt-1 text-muted-foreground/70">
                                点击上方好友开始聊天
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* 右侧聊天窗口 */}
            <div
                className={cn(
                    "flex-1",
                    !selectedPartnerId && "hidden md:flex md:items-center md:justify-center"
                )}
            >
                {selectedPartnerId && selectedPartner ? (
                    <ChatWindow
                        currentUserId={currentUserId}
                        partnerId={selectedPartnerId}
                        partnerName={selectedPartner.name}
                        partnerEmail={selectedPartner.email}
                        partnerAvatar={selectedPartner.avatar}
                        currentUserName={currentUser?.username || undefined}
                        currentUserAvatar={currentUser?.avatar_url}
                        onBack={() => setSelectedPartnerId(null)}
                        className="h-full"
                    />
                ) : (
                    <div className="text-center text-muted-foreground">
                        <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-medium">选择一个对话</p>
                        <p className="text-sm mt-1">从左侧列表选择或搜索好友开始聊天</p>
                    </div>
                )}
            </div>
        </div>
    );
}
