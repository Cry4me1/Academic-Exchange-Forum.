import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

export interface Profile {
    id: string;
    username: string | null;
    email: string;
    avatar_url: string | null;
}

export interface Friendship {
    id: string;
    requester_id: string;
    addressee_id: string;
    status: "pending" | "accepted" | "rejected" | "blocked";
    created_at: string;
    updated_at: string;
    // 关联的用户信息
    requester?: Profile;
    addressee?: Profile;
}

export interface FriendWithProfile {
    friendshipId: string;
    friend: Profile;
    createdAt: string;
}

interface UseFriendsReturn {
    friends: FriendWithProfile[];
    pendingRequests: Friendship[];
    sentRequests: Friendship[];
    loading: boolean;
    error: string | null;
    searchUsers: (query: string) => Promise<Profile[]>;
    sendFriendRequest: (addresseeId: string) => Promise<{ success: boolean; error?: string }>;
    acceptFriendRequest: (friendshipId: string) => Promise<{ success: boolean; error?: string }>;
    rejectFriendRequest: (friendshipId: string) => Promise<{ success: boolean; error?: string }>;
    removeFriend: (friendshipId: string) => Promise<{ success: boolean; error?: string }>;
    cancelRequest: (friendshipId: string) => Promise<{ success: boolean; error?: string }>;
    refresh: () => Promise<void>;
}

export function useFriends(currentUserId: string | null): UseFriendsReturn {
    const [friends, setFriends] = useState<FriendWithProfile[]>([]);
    const [pendingRequests, setPendingRequests] = useState<Friendship[]>([]);
    const [sentRequests, setSentRequests] = useState<Friendship[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const supabase = createClient();

    // 获取好友列表和请求
    const fetchFriends = useCallback(async () => {
        if (!currentUserId) return;

        setLoading(true);
        setError(null);

        try {
            // 获取已接受的好友关系
            const { data: acceptedFriendships, error: friendsError } = await supabase
                .from("friendships")
                .select(`
          id,
          requester_id,
          addressee_id,
          status,
          created_at,
          updated_at
        `)
                .eq("status", "accepted")
                .or(`requester_id.eq.${currentUserId},addressee_id.eq.${currentUserId}`);

            if (friendsError) throw friendsError;

            // 获取好友的用户信息
            const friendIds = acceptedFriendships?.map((f) =>
                f.requester_id === currentUserId ? f.addressee_id : f.requester_id
            ) || [];

            if (friendIds.length > 0) {
                const { data: profiles, error: profilesError } = await supabase
                    .from("profiles")
                    .select("id, username, email, avatar_url")
                    .in("id", friendIds);

                if (profilesError) throw profilesError;

                const friendsWithProfile: FriendWithProfile[] = acceptedFriendships?.map((f) => {
                    const friendId = f.requester_id === currentUserId ? f.addressee_id : f.requester_id;
                    const profile = profiles?.find((p) => p.id === friendId);
                    return {
                        friendshipId: f.id,
                        friend: profile || { id: friendId, username: null, email: "", avatar_url: null },
                        createdAt: f.created_at,
                    };
                }) || [];

                setFriends(friendsWithProfile);
            } else {
                setFriends([]);
            }

            // 获取待处理的好友请求（收到的）
            const { data: pending, error: pendingError } = await supabase
                .from("friendships")
                .select(`
          id,
          requester_id,
          addressee_id,
          status,
          created_at,
          updated_at
        `)
                .eq("addressee_id", currentUserId)
                .eq("status", "pending");

            if (pendingError) throw pendingError;

            // 获取请求者信息
            if (pending && pending.length > 0) {
                const requesterIds = pending.map((p) => p.requester_id);
                const { data: requesterProfiles } = await supabase
                    .from("profiles")
                    .select("id, username, email, avatar_url")
                    .in("id", requesterIds);

                const pendingWithProfiles = pending.map((p) => ({
                    ...p,
                    requester: requesterProfiles?.find((profile) => profile.id === p.requester_id),
                }));
                setPendingRequests(pendingWithProfiles as Friendship[]);
            } else {
                setPendingRequests([]);
            }

            // 获取已发送的请求
            const { data: sent, error: sentError } = await supabase
                .from("friendships")
                .select(`
          id,
          requester_id,
          addressee_id,
          status,
          created_at,
          updated_at
        `)
                .eq("requester_id", currentUserId)
                .eq("status", "pending");

            if (sentError) throw sentError;

            if (sent && sent.length > 0) {
                const addresseeIds = sent.map((s) => s.addressee_id);
                const { data: addresseeProfiles } = await supabase
                    .from("profiles")
                    .select("id, username, email, avatar_url")
                    .in("id", addresseeIds);

                const sentWithProfiles = sent.map((s) => ({
                    ...s,
                    addressee: addresseeProfiles?.find((profile) => profile.id === s.addressee_id),
                }));
                setSentRequests(sentWithProfiles as Friendship[]);
            } else {
                setSentRequests([]);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "获取好友列表失败");
        } finally {
            setLoading(false);
        }
    }, [currentUserId, supabase]);

    // 搜索用户
    const searchUsers = useCallback(
        async (query: string): Promise<Profile[]> => {
            if (!query.trim() || !currentUserId) return [];

            const { data, error } = await supabase
                .from("profiles")
                .select("id, username, email, avatar_url")
                .neq("id", currentUserId)
                .or(`username.ilike.%${query}%,email.ilike.%${query}%`)
                .limit(10);

            if (error) {
                console.error("搜索用户失败:", error);
                return [];
            }

            return data || [];
        },
        [currentUserId, supabase]
    );

    // 发送好友请求
    const sendFriendRequest = useCallback(
        async (addresseeId: string) => {
            if (!currentUserId) return { success: false, error: "未登录" };

            // 检查是否已经是好友或已发送请求
            const { data: existing } = await supabase
                .from("friendships")
                .select("id, status")
                .or(
                    `and(requester_id.eq.${currentUserId},addressee_id.eq.${addresseeId}),and(requester_id.eq.${addresseeId},addressee_id.eq.${currentUserId})`
                )
                .single();

            if (existing) {
                if (existing.status === "accepted") {
                    return { success: false, error: "已经是好友了" };
                }
                if (existing.status === "pending") {
                    return { success: false, error: "好友请求已发送，等待对方确认" };
                }
            }

            const { error } = await supabase.from("friendships").insert({
                requester_id: currentUserId,
                addressee_id: addresseeId,
                status: "pending",
            });

            if (error) {
                return { success: false, error: error.message };
            }

            await fetchFriends();
            return { success: true };
        },
        [currentUserId, supabase, fetchFriends]
    );

    // 接受好友请求
    const acceptFriendRequest = useCallback(
        async (friendshipId: string) => {
            const { error } = await supabase
                .from("friendships")
                .update({ status: "accepted" })
                .eq("id", friendshipId)
                .eq("addressee_id", currentUserId);

            if (error) {
                return { success: false, error: error.message };
            }

            await fetchFriends();
            return { success: true };
        },
        [currentUserId, supabase, fetchFriends]
    );

    // 拒绝好友请求
    const rejectFriendRequest = useCallback(
        async (friendshipId: string) => {
            const { error } = await supabase
                .from("friendships")
                .update({ status: "rejected" })
                .eq("id", friendshipId)
                .eq("addressee_id", currentUserId);

            if (error) {
                return { success: false, error: error.message };
            }

            await fetchFriends();
            return { success: true };
        },
        [currentUserId, supabase, fetchFriends]
    );

    // 删除好友
    const removeFriend = useCallback(
        async (friendshipId: string) => {
            const { error } = await supabase
                .from("friendships")
                .delete()
                .eq("id", friendshipId);

            if (error) {
                return { success: false, error: error.message };
            }

            await fetchFriends();
            return { success: true };
        },
        [supabase, fetchFriends]
    );

    // 取消已发送的请求
    const cancelRequest = useCallback(
        async (friendshipId: string) => {
            const { error } = await supabase
                .from("friendships")
                .delete()
                .eq("id", friendshipId)
                .eq("requester_id", currentUserId);

            if (error) {
                return { success: false, error: error.message };
            }

            await fetchFriends();
            return { success: true };
        },
        [currentUserId, supabase, fetchFriends]
    );

    // 初始加载
    useEffect(() => {
        fetchFriends();
    }, [fetchFriends]);

    // 实时订阅好友关系变化
    useEffect(() => {
        if (!currentUserId) return;

        const channel = supabase
            .channel("friendships-changes")
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "friendships",
                    filter: `requester_id=eq.${currentUserId}`,
                },
                () => fetchFriends()
            )
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "friendships",
                    filter: `addressee_id=eq.${currentUserId}`,
                },
                () => fetchFriends()
            )
            .subscribe();

        return () => {
            channel.unsubscribe();
        };
    }, [currentUserId, supabase, fetchFriends]);

    return {
        friends,
        pendingRequests,
        sentRequests,
        loading,
        error,
        searchUsers,
        sendFriendRequest,
        acceptFriendRequest,
        rejectFriendRequest,
        removeFriend,
        cancelRequest,
        refresh: fetchFriends,
    };
}
