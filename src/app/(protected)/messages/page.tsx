"use client";

import { ChatList } from "@/components/chat/ChatList";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useFriends } from "@/hooks/useFriends";
import { useMessages } from "@/hooks/useMessages";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Loader2, MessageSquare, Search } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function MessagesLoading() {
    return (
        <div className="flex items-center justify-center h-[100dvh] bg-background">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
    );
}

function MessagesContent() {
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
    const [partnerLoading, setPartnerLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const supabase = createClient();

    // 获取当前用户
    useEffect(() => {
        let isMounted = true;
        const getUser = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user && isMounted) {
                    setCurrentUserId(user.id);

                    // 获取用户 profile
                    const { data: profile } = await supabase
                        .from("profiles")
                        .select("username, avatar_url")
                        .eq("id", user.id)
                        .single();

                    if (isMounted) {
                        setCurrentUser(profile || null);
                    }
                }
            } catch (err) {
                console.error("获取当前用户信息失败:", err);
            }
        };
        getUser();

        return () => {
            isMounted = false;
        };
    }, [supabase]);

    const { conversations, conversationsLoading } = useMessages(currentUserId);
    const { friends } = useFriends(currentUserId);

    // 选择对话时获取对方信息
    useEffect(() => {
        let isMounted = true;
        if (selectedPartnerId && currentUserId) {
            const fetchPartnerInfo = async () => {
                setPartnerLoading(true);
                try {
                    const { data, error } = await supabase
                        .from("profiles")
                        .select("username, email, avatar_url")
                        .eq("id", selectedPartnerId)
                        .single();

                    if (isMounted) {
                        if (data && !error) {
                            const displayName =
                                data.username ||
                                (data.email ? data.email.split("@")[0] : "") ||
                                "用户";
                            setSelectedPartner({
                                name: displayName,
                                email: data.email || "",
                                avatar: data.avatar_url || null,
                            });
                        } else {
                            // 如果在 profiles 未查到，尝试从好友或已有对话中提取
                            const friendObj = friends.find(f => f.friend.id === selectedPartnerId);
                            const convObj = conversations.find(c => c.partnerId === selectedPartnerId);
                            const fallbackName = friendObj?.friend.username ||
                                (friendObj?.friend.email ? friendObj.friend.email.split("@")[0] : null) ||
                                convObj?.partnerUsername ||
                                (convObj?.partnerEmail ? convObj.partnerEmail.split("@")[0] : null) ||
                                "用户";

                            setSelectedPartner({
                                name: fallbackName,
                                email: friendObj?.friend.email || convObj?.partnerEmail || "",
                                avatar: friendObj?.friend.avatar_url || convObj?.partnerAvatarUrl || null,
                            });
                        }
                    }
                } catch (err) {
                    console.error("获取对话对方信息失败:", err);
                    if (isMounted) {
                        setSelectedPartner({
                            name: "用户",
                            email: "",
                            avatar: null,
                        });
                    }
                } finally {
                    if (isMounted) {
                        setPartnerLoading(false);
                    }
                }
            };
            fetchPartnerInfo();
        } else {
            setSelectedPartner(null);
        }

        return () => {
            isMounted = false;
        };
    }, [selectedPartnerId, currentUserId, supabase, friends, conversations]);

    // 过滤对话
    const filteredConversations = conversations.filter((conv) => {
        if (!searchQuery.trim()) return true;
        const name = conv.partnerUsername || conv.partnerEmail || "";
        return name.toLowerCase().includes(searchQuery.toLowerCase());
    });

    if (!currentUserId) {
        return <MessagesLoading />;
    }

    return (
        <div className="flex h-[100dvh] bg-background">
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
                                    {f.friend.username || (f.friend.email ? f.friend.email.split("@")[0] : "未知好友")}
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
                {selectedPartnerId ? (
                    partnerLoading && !selectedPartner ? (
                        <div className="flex items-center justify-center h-full">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : selectedPartner ? (
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
                            <p className="text-lg font-medium">未能加载该对话</p>
                            <p className="text-sm mt-1">请尝试重新选择对话或好友</p>
                        </div>
                    )
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

export default function MessagesPage() {
    return (
        <Suspense fallback={<MessagesLoading />}>
            <MessagesContent />
        </Suspense>
    );
}
