"use client";

import { ReputationBadge } from "@/components/duel/ReputationBadge";
import { BannerSelector, bannerGradients } from "@/components/profile/banner-selector";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFriends } from "@/hooks/useFriends";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";
import { ArrowLeft, Bookmark, Calendar, Code2, Globe, Heart, Loader2, MapPin, MessageCircle, Sparkles, Swords, UserPlus } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

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
    reputation_score: number | null;
    duel_wins: number | null;
    duel_losses: number | null;
    is_developer: boolean | null;
    developer_title: string | null;
    banner_style: string | null;
}

interface Post {
    id: string;
    title: string;
    content: string | object;
    created_at: string;
    like_count: number;
    comment_count: number;
}

interface LikedPost extends Post {
    liked_at: string;
}

interface BookmarkedPost extends Post {
    bookmarked_at: string;
}

const genderLabels: Record<string, string> = {
    male: "男",
    female: "女",
    other: "其他",
    private: "未公开",
};

// 从 JSON 内容中提取文本
function extractTextFromContent(content: string | object): string {
    if (typeof content === "string") {
        return content.replace(/<[^>]*>/g, "");
    }
    try {
        const jsonContent = content as { content?: Array<{ content?: Array<{ text?: string }> }> };
        if (jsonContent.content) {
            const texts: string[] = [];
            for (const node of jsonContent.content) {
                if (node.content) {
                    for (const child of node.content) {
                        if (child.text) {
                            texts.push(child.text);
                        }
                    }
                }
            }
            return texts.join(" ").slice(0, 200);
        }
    } catch {
        // ignore
    }
    return "";
}

export default function UserProfilePage() {
    const params = useParams();
    const userId = params.id as string;

    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [posts, setPosts] = useState<Post[]>([]);
    const [likedPosts, setLikedPosts] = useState<LikedPost[]>([]);
    const [bookmarkedPosts, setBookmarkedPosts] = useState<BookmarkedPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [isFriend, setIsFriend] = useState(false);
    const [friendRequestSent, setFriendRequestSent] = useState(false);
    const [activeTab, setActiveTab] = useState("posts");
    const [bannerStyle, setBannerStyle] = useState("default");

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
                if (profileData.banner_style) {
                    setBannerStyle(profileData.banner_style);
                }
            }

            // 获取该用户的帖子
            const { data: postsData, error: postsError } = await supabase
                .from("posts")
                .select("id, title, content, created_at, like_count, comment_count")
                .eq("author_id", userId)
                .eq("is_published", true)
                .order("created_at", { ascending: false })
                .limit(20);

            if (!postsError && postsData) {
                setPosts(postsData);
            }

            // 获取该用户点赞的帖子
            const { data: likesData } = await supabase
                .from("likes")
                .select(`
                    created_at,
                    post:posts!inner (
                        id, title, content, created_at, like_count, comment_count
                    )
                `)
                .eq("user_id", userId)
                .not("post_id", "is", null)
                .order("created_at", { ascending: false })
                .limit(20);

            if (likesData) {
                const likedPostsList = likesData
                    .filter((item) => item.post)
                    .map((item) => {
                        const postData = item.post as unknown as Post;
                        return {
                            ...postData,
                            liked_at: item.created_at,
                        };
                    });
                setLikedPosts(likedPostsList);
            }

            // 获取该用户收藏的帖子（仅自己可见）
            if (user && user.id === userId) {
                const { data: bookmarksData } = await supabase
                    .from("bookmarks")
                    .select(`
                        created_at,
                        post:posts!inner (
                            id, title, content, created_at, like_count, comment_count
                        )
                    `)
                    .eq("user_id", userId)
                    .order("created_at", { ascending: false })
                    .limit(20);

                if (bookmarksData) {
                    const bookmarkedPostsList = bookmarksData
                        .filter((item) => item.post)
                        .map((item) => {
                            const postData = item.post as unknown as Post;
                            return {
                                ...postData,
                                bookmarked_at: item.created_at,
                            };
                        });
                    setBookmarkedPosts(bookmarkedPostsList);
                }
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

    // 渲染帖子卡片
    const renderPostCard = (post: Post, extraInfo?: { label: string; time: string }) => (
        <Card key={post.id} className="hover:shadow-md transition-shadow">
            <CardContent className="pt-4">
                <Link href={`/posts/${post.id}`}>
                    <h3 className="font-semibold hover:text-primary transition-colors line-clamp-1">
                        {post.title}
                    </h3>
                </Link>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {extractTextFromContent(post.content).substring(0, 150)}...
                </p>
                <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                    <span>{new Date(post.created_at).toLocaleDateString("zh-CN")}</span>
                    <span className="flex items-center gap-1">
                        <Heart className="h-3 w-3" /> {post.like_count || 0}
                    </span>
                    <span className="flex items-center gap-1">
                        <MessageCircle className="h-3 w-3" /> {post.comment_count || 0}
                    </span>
                    {extraInfo && (
                        <span className="ml-auto text-muted-foreground/60">
                            {extraInfo.label}于 {new Date(extraInfo.time).toLocaleDateString("zh-CN")}
                        </span>
                    )}
                </div>
            </CardContent>
        </Card>
    );

    const currentGradient = bannerGradients.find(g => g.id === bannerStyle)?.class || bannerGradients[0].class;

    return (
        <div className={`min-h-screen ${currentGradient} transition-colors duration-500 relative`}>
            {/* 全局背景装饰 */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-white/20 rounded-full blur-[100px]" />
                <div className="absolute top-[20%] right-[-5%] w-[30%] h-[30%] bg-primary/10 rounded-full blur-[80px]" />
                <div className="absolute bottom-[-10%] left-[20%] w-[30%] h-[30%] bg-white/10 rounded-full blur-[80px]" />
            </div>

            {/* 顶部导航区 */}
            <div className="relative z-20 px-6 py-6 flex justify-between items-center max-w-7xl mx-auto">
                {/* 返回按钮 */}
                <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-2 text-sm font-medium text-foreground/70 hover:text-foreground bg-white/30 hover:bg-white/50 backdrop-blur-md px-4 py-2 rounded-full transition-all shadow-sm hover:shadow-md"
                >
                    <ArrowLeft className="h-4 w-4" />
                    返回
                </Link>

                {isOwnProfile && (
                    <BannerSelector currentStyle={bannerStyle} onStyleChange={setBannerStyle} />
                )}
            </div>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 relative z-10 pt-4">
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
                                    <div className="flex items-center justify-center sm:justify-start gap-3 flex-wrap">
                                        <h1 className="text-2xl font-bold text-foreground">{displayName}</h1>
                                        {/* 开发者特殊标签 */}
                                        {profile.is_developer && (
                                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 shadow-lg shadow-amber-500/30">
                                                <Code2 className="h-4 w-4 text-white" />
                                                <span className="font-bold text-white text-sm">
                                                    {profile.developer_title || '系统开发者'}
                                                </span>
                                                <Sparkles className="h-4 w-4 text-yellow-200 animate-pulse" />
                                            </div>
                                        )}
                                        {profile.reputation_score !== null && (
                                            <ReputationBadge
                                                score={profile.reputation_score}
                                                wins={profile.duel_wins || 0}
                                                losses={profile.duel_losses || 0}
                                                size="md"
                                                showStats
                                                isDeveloper={profile.is_developer || undefined}
                                                developerTitle={profile.developer_title || undefined}
                                            />
                                        )}
                                    </div>
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
                                        {(profile.duel_wins || 0) + (profile.duel_losses || 0) > 0 && (
                                            <div className="flex items-center gap-1">
                                                <Swords className="h-3.5 w-3.5" />
                                                {profile.duel_wins || 0} 胜 / {profile.duel_losses || 0} 负
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
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="mb-4">
                            <TabsTrigger value="posts">
                                帖子 ({posts.length})
                            </TabsTrigger>
                            <TabsTrigger value="likes">
                                <Heart className="h-3.5 w-3.5 mr-1" />
                                点赞 ({likedPosts.length})
                            </TabsTrigger>
                            {isOwnProfile && (
                                <TabsTrigger value="bookmarks">
                                    <Bookmark className="h-3.5 w-3.5 mr-1" />
                                    收藏 ({bookmarkedPosts.length})
                                </TabsTrigger>
                            )}
                        </TabsList>

                        <TabsContent value="posts">
                            {posts.length > 0 ? (
                                <div className="space-y-4">
                                    {posts.map((post) => renderPostCard(post))}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <p className="text-muted-foreground">该用户还没有发布任何帖子</p>
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="likes">
                            {likedPosts.length > 0 ? (
                                <div className="space-y-4">
                                    {likedPosts.map((post) =>
                                        renderPostCard(post, { label: "点赞", time: post.liked_at })
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <p className="text-muted-foreground">暂无点赞的帖子</p>
                                </div>
                            )}
                        </TabsContent>

                        {isOwnProfile && (
                            <TabsContent value="bookmarks">
                                {bookmarkedPosts.length > 0 ? (
                                    <div className="space-y-4">
                                        {bookmarkedPosts.map((post) =>
                                            renderPostCard(post, { label: "收藏", time: post.bookmarked_at })
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <p className="text-muted-foreground">暂无收藏的帖子</p>
                                    </div>
                                )}
                            </TabsContent>
                        )}
                    </Tabs>
                </motion.div>
            </div>
        </div>
    );
}
