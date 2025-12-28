"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, ArrowLeft, UserPlus, MessageCircle, Calendar, MapPin, Globe } from "lucide-react";
import { useFriends } from "@/hooks/useFriends";
import { motion } from "framer-motion";

interface UserProfile {
    id: string;
    email: string | null;
    username: string | null;
    full_name: string | null;
    avatar_url: string | null;
    gender: string | null;
    bio: string | null;
    country: string | null;
    language: string | null;
    created_at: string | null;
}

interface Post {
    id: string;
    title: string;
    content: string;
    created_at: string;
    likes_count: number;
    comments_count: number;
}

const genderLabels: Record<string, string> = {
    male: "男",
    female: "女",
    other: "其他",
    private: "未公开",
};

export default function UserProfilePage() {
    const params = useParams();
    const userId = params.id as string;

    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [isFriend, setIsFriend] = useState(false);
    const [friendRequestSent, setFriendRequestSent] = useState(false);

    const supabase = createClient();
    const { sendFriendRequest } = useFriends(currentUserId);

    useEffect(() => {
        async function loadData() {
            // 获取当前用户
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setCurrentUserId(user.id);
            }

            // 获取目标用户的profile
            const { data: profileData, error: profileError } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", userId)
                .single();

            if (profileError) {
                console.error("Failed to load profile:", profileError);
            } else {
                setProfile(profileData);
            }

            // 获取该用户的帖子
            const { data: postsData, error: postsError } = await supabase
                .from("posts")
                .select("id, title, content, created_at, likes_count, comments_count")
                .eq("author_id", userId)
                .order("created_at", { ascending: false })
                .limit(10);

            if (!postsError && postsData) {
                setPosts(postsData);
            }

            // 检查好友状态
            if (user) {
                const { data: friendshipData } = await supabase
                    .from("friendships")
                    .select("status")
                    .or(`and(requester_id.eq.${user.id},addressee_id.eq.${userId}),and(requester_id.eq.${userId},addressee_id.eq.${user.id})`)
                    .single();

                if (friendshipData) {
                    if (friendshipData.status === "accepted") {
                        setIsFriend(true);
                    } else if (friendshipData.status === "pending") {
                        setFriendRequestSent(true);
                    }
                }
            }

            setLoading(false);
        }

        if (userId) {
            loadData();
        }
    }, [userId, supabase]);

    const handleAddFriend = async () => {
        if (!currentUserId || !userId) return;

        const success = await sendFriendRequest(userId);
        if (success) {
            setFriendRequestSent(true);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center">
                <h1 className="text-2xl font-bold text-muted-foreground mb-4">用户不存在</h1>
                <Link href="/dashboard">
                    <Button variant="outline">返回首页</Button>
                </Link>
            </div>
        );
    }

    const displayName = profile.full_name || profile.username || profile.email?.split("@")[0] || "未知用户";
    const initials = displayName.charAt(0).toUpperCase();
    const isOwnProfile = currentUserId === userId;

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
            {/* 顶部浅色渐变横幅 */}
            <div className="h-40 bg-gradient-to-r from-blue-100 via-indigo-100 to-purple-100 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent" />
                <div className="absolute inset-0 opacity-30">
                    <div className="absolute top-4 left-1/4 w-32 h-32 bg-blue-200 rounded-full blur-3xl" />
                    <div className="absolute top-8 right-1/3 w-24 h-24 bg-purple-200 rounded-full blur-3xl" />
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* 返回按钮 */}
                <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mt-4 mb-6 transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" />
                    返回
                </Link>

                {/* 用户信息卡片 */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <Card className="shadow-lg border-border/30 bg-white/80 backdrop-blur-sm">
                        <CardHeader className="pb-4">
                            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                                {/* 头像 - 完整显示 */}
                                <Avatar className="h-28 w-28 border-4 border-white shadow-xl ring-4 ring-primary/10 shrink-0">
                                    <AvatarImage src={profile.avatar_url || ""} alt={displayName} />
                                    <AvatarFallback className="text-4xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary font-bold">
                                        {initials}
                                    </AvatarFallback>
                                </Avatar>

                                {/* 用户名和操作按钮 */}
                                <div className="flex-1 text-center sm:text-left">
                                    <h1 className="text-2xl font-bold text-foreground">{displayName}</h1>
                                    {profile.username && profile.full_name && (
                                        <p className="text-muted-foreground mt-1">@{profile.username}</p>
                                    )}

                                    {/* 个人简介 */}
                                    {profile.bio && (
                                        <p className="text-muted-foreground mt-3 text-sm leading-relaxed">{profile.bio}</p>
                                    )}

                                    {/* 用户信息标签 */}
                                    <div className="flex flex-wrap justify-center sm:justify-start gap-3 mt-4 text-sm text-muted-foreground">
                                        {profile.gender && profile.gender !== "private" && (
                                            <Badge variant="secondary" className="gap-1 bg-primary/5 text-primary/80">
                                                {genderLabels[profile.gender] || profile.gender}
                                            </Badge>
                                        )}
                                        {profile.country && (
                                            <div className="flex items-center gap-1">
                                                <MapPin className="h-3.5 w-3.5" />
                                                {profile.country}
                                            </div>
                                        )}
                                        {profile.language && (
                                            <div className="flex items-center gap-1">
                                                <Globe className="h-3.5 w-3.5" />
                                                {profile.language === "zh" ? "中文" : profile.language === "en" ? "English" : profile.language}
                                            </div>
                                        )}
                                        {profile.created_at && (
                                            <div className="flex items-center gap-1">
                                                <Calendar className="h-3.5 w-3.5" />
                                                {new Date(profile.created_at).toLocaleDateString("zh-CN", { year: "numeric", month: "long" })} 加入
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* 操作按钮 - 放在右侧 */}
                                <div className="shrink-0">
                                    {!isOwnProfile && currentUserId && (
                                        <div className="flex gap-2">
                                            {isFriend ? (
                                                <Link href={`/messages?user=${userId}`}>
                                                    <Button size="sm">
                                                        <MessageCircle className="h-4 w-4 mr-2" />
                                                        发送消息
                                                    </Button>
                                                </Link>
                                            ) : friendRequestSent ? (
                                                <Button disabled variant="outline" size="sm">
                                                    已发送请求
                                                </Button>
                                            ) : (
                                                <Button onClick={handleAddFriend} size="sm">
                                                    <UserPlus className="h-4 w-4 mr-2" />
                                                    添加好友
                                                </Button>
                                            )}
                                        </div>
                                    )}

                                    {isOwnProfile && (
                                        <Link href="/settings/profile">
                                            <Button variant="outline" size="sm">编辑资料</Button>
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </CardHeader>
                    </Card>
                </motion.div>

                {/* 帖子列表 */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="mt-6"
                >
                    <Tabs defaultValue="posts" className="w-full">
                        <TabsList className="mb-4">
                            <TabsTrigger value="posts">帖子 ({posts.length})</TabsTrigger>
                            <TabsTrigger value="likes" disabled>点赞</TabsTrigger>
                            <TabsTrigger value="comments" disabled>评论</TabsTrigger>
                        </TabsList>

                        <TabsContent value="posts">
                            {posts.length > 0 ? (
                                <div className="space-y-4">
                                    {posts.map((post) => (
                                        <Card key={post.id} className="hover:shadow-md transition-shadow">
                                            <CardContent className="pt-4">
                                                <Link href={`/posts/${post.id}`}>
                                                    <h3 className="font-semibold hover:text-primary transition-colors line-clamp-1">
                                                        {post.title}
                                                    </h3>
                                                </Link>
                                                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                                    {post.content.replace(/<[^>]*>/g, "").substring(0, 150)}...
                                                </p>
                                                <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                                                    <span>{new Date(post.created_at).toLocaleDateString("zh-CN")}</span>
                                                    <span>❤️ {post.likes_count || 0}</span>
                                                    <span>💬 {post.comments_count || 0}</span>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <p className="text-muted-foreground">该用户还没有发布任何帖子</p>
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                </motion.div>
            </div>
        </div>
    );
}
