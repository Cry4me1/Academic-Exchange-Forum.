import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

export interface Message {
    id: string;
    sender_id: string;
    receiver_id: string;
    content: string;
    content_type: "text" | "rich_text" | "post_reference";
    referenced_post_id: string | null;
    is_read: boolean;
    created_at: string;
    // 关联的帖子信息（如果是引用帖子类型）
    referenced_post?: {
        id: string;
        title: string;
        author_id: string;
    } | null;
}

export interface Conversation {
    partnerId: string;
    partnerUsername: string | null;
    partnerEmail: string;
    partnerAvatarUrl: string | null;
    lastMessage: string;
    lastMessageTime: string;
    unreadCount: number;
}

interface UseMessagesReturn {
    messages: Message[];
    conversations: Conversation[];
    loading: boolean;
    error: string | null;
    sendMessage: (
        receiverId: string,
        content: string,
        contentType?: "text" | "rich_text" | "post_reference",
        referencedPostId?: string
    ) => Promise<{ success: boolean; error?: string }>;
    markAsRead: (messageIds: string[]) => Promise<void>;
    loadMoreMessages: () => Promise<void>;
    hasMore: boolean;
}

const PAGE_SIZE = 50;

export function useMessages(
    currentUserId: string | null,
    conversationPartnerId?: string
): UseMessagesReturn {
    const [messages, setMessages] = useState<Message[]>([]);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(true);
    const [offset, setOffset] = useState(0);
    const channelRef = useRef<RealtimeChannel | null>(null);

    const supabase = createClient();

    // 获取会话列表
    const fetchConversations = useCallback(async () => {
        if (!currentUserId) return;

        try {
            // 获取所有消息，按对话伙伴分组
            const { data: allMessages, error: messagesError } = await supabase
                .from("messages")
                .select("*")
                .or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`)
                .order("created_at", { ascending: false });

            if (messagesError) throw messagesError;

            // 按对话伙伴分组
            const conversationMap = new Map<string, {
                lastMessage: Message;
                unreadCount: number;
            }>();

            allMessages?.forEach((msg) => {
                const partnerId = msg.sender_id === currentUserId ? msg.receiver_id : msg.sender_id;

                if (!conversationMap.has(partnerId)) {
                    conversationMap.set(partnerId, {
                        lastMessage: msg,
                        unreadCount: 0,
                    });
                }

                // 统计未读消息
                if (msg.receiver_id === currentUserId && !msg.is_read) {
                    const conv = conversationMap.get(partnerId)!;
                    conv.unreadCount += 1;
                }
            });

            // 获取对话伙伴的用户信息
            const partnerIds = Array.from(conversationMap.keys());
            if (partnerIds.length > 0) {
                const { data: profiles } = await supabase
                    .from("profiles")
                    .select("id, username, email, avatar_url")
                    .in("id", partnerIds);

                const convList: Conversation[] = partnerIds.map((partnerId) => {
                    const conv = conversationMap.get(partnerId)!;
                    const profile = profiles?.find((p) => p.id === partnerId);

                    return {
                        partnerId,
                        partnerUsername: profile?.username || null,
                        partnerEmail: profile?.email || "",
                        partnerAvatarUrl: profile?.avatar_url || null,
                        lastMessage: conv.lastMessage.content.substring(0, 50) +
                            (conv.lastMessage.content.length > 50 ? "..." : ""),
                        lastMessageTime: conv.lastMessage.created_at,
                        unreadCount: conv.unreadCount,
                    };
                });

                // 按最后消息时间排序
                convList.sort((a, b) =>
                    new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
                );

                setConversations(convList);
            } else {
                setConversations([]);
            }
        } catch (err) {
            console.error("获取会话列表失败:", err);
        }
    }, [currentUserId, supabase]);

    // 获取与特定用户的消息
    const fetchMessages = useCallback(async (reset = false) => {
        if (!currentUserId || !conversationPartnerId) return;

        setLoading(true);
        setError(null);

        try {
            const currentOffset = reset ? 0 : offset;

            const { data, error: fetchError } = await supabase
                .from("messages")
                .select(`
          *,
          referenced_post:posts(id, title, author_id)
        `)
                .or(
                    `and(sender_id.eq.${currentUserId},receiver_id.eq.${conversationPartnerId}),and(sender_id.eq.${conversationPartnerId},receiver_id.eq.${currentUserId})`
                )
                .order("created_at", { ascending: false })
                .range(currentOffset, currentOffset + PAGE_SIZE - 1);

            if (fetchError) throw fetchError;

            const newMessages = data?.reverse() || [];

            if (reset) {
                setMessages(newMessages);
                setOffset(PAGE_SIZE);
            } else {
                setMessages((prev) => [...newMessages, ...prev]);
                setOffset((prev) => prev + PAGE_SIZE);
            }

            setHasMore((data?.length || 0) === PAGE_SIZE);
        } catch (err) {
            setError(err instanceof Error ? err.message : "获取消息失败");
        } finally {
            setLoading(false);
        }
    }, [currentUserId, conversationPartnerId, offset, supabase]);

    // 发送消息
    const sendMessage = useCallback(
        async (
            receiverId: string,
            content: string,
            contentType: "text" | "rich_text" | "post_reference" = "text",
            referencedPostId?: string
        ) => {
            if (!currentUserId) return { success: false, error: "未登录" };

            const messageData: {
                sender_id: string;
                receiver_id: string;
                content: string;
                content_type: string;
                referenced_post_id?: string;
            } = {
                sender_id: currentUserId,
                receiver_id: receiverId,
                content,
                content_type: contentType,
            };

            if (referencedPostId) {
                messageData.referenced_post_id = referencedPostId;
            }

            const { error } = await supabase.from("messages").insert(messageData);

            if (error) {
                return { success: false, error: error.message };
            }

            return { success: true };
        },
        [currentUserId, supabase]
    );

    // 标记消息为已读
    const markAsRead = useCallback(
        async (messageIds: string[]) => {
            if (!currentUserId || messageIds.length === 0) return;

            await supabase
                .from("messages")
                .update({ is_read: true })
                .in("id", messageIds)
                .eq("receiver_id", currentUserId);

            // 更新本地状态
            setMessages((prev) =>
                prev.map((msg) =>
                    messageIds.includes(msg.id) ? { ...msg, is_read: true } : msg
                )
            );
        },
        [currentUserId, supabase]
    );

    // 加载更多消息
    const loadMoreMessages = useCallback(async () => {
        if (!hasMore || loading) return;
        await fetchMessages(false);
    }, [hasMore, loading, fetchMessages]);

    // 初始加载
    useEffect(() => {
        if (conversationPartnerId) {
            fetchMessages(true);
        } else {
            fetchConversations();
        }
    }, [conversationPartnerId, fetchMessages, fetchConversations]);

    // 实时订阅新消息
    useEffect(() => {
        if (!currentUserId) return;

        const channel = supabase
            .channel("messages-realtime")
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "messages",
                    filter: `receiver_id=eq.${currentUserId}`,
                },
                async (payload) => {
                    const newMessage = payload.new as Message;

                    // 如果在对话页面，添加新消息
                    if (conversationPartnerId && newMessage.sender_id === conversationPartnerId) {
                        // 获取关联帖子信息（如果有）
                        let referencedPost = null;
                        if (newMessage.referenced_post_id) {
                            const { data } = await supabase
                                .from("posts")
                                .select("id, title, author_id")
                                .eq("id", newMessage.referenced_post_id)
                                .single();
                            referencedPost = data;
                        }

                        setMessages((prev) => [...prev, { ...newMessage, referenced_post: referencedPost }]);
                    }

                    // 更新会话列表
                    fetchConversations();
                }
            )
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "messages",
                    filter: `sender_id=eq.${currentUserId}`,
                },
                (payload) => {
                    const newMessage = payload.new as Message;

                    // 自己发送的消息也添加到列表
                    if (conversationPartnerId && newMessage.receiver_id === conversationPartnerId) {
                        setMessages((prev) => {
                            // 避免重复添加
                            if (prev.some((m) => m.id === newMessage.id)) {
                                return prev;
                            }
                            return [...prev, newMessage];
                        });
                    }

                    fetchConversations();
                }
            )
            .subscribe();

        channelRef.current = channel;

        return () => {
            channel.unsubscribe();
        };
    }, [currentUserId, conversationPartnerId, supabase, fetchConversations]);

    return {
        messages,
        conversations,
        loading,
        error,
        sendMessage,
        markAsRead,
        loadMoreMessages,
        hasMore,
    };
}
