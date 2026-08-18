"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Edit, Settings, Clock, FileText, User } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";
import { getCollectionWithPosts } from "../actions";
import { CollectionPostList, CreateCollectionDialog, COLLECTION_COVER_PRESETS } from "@/components/collections";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export default function CollectionDetailPage() {
    const params = useParams();
    const collectionId = params.id as string;
    const router = useRouter();

    const [collection, setCollection] = useState<any>(null);
    const [posts, setPosts] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isManageMode, setIsManageMode] = useState(false);

    useEffect(() => {
        if (!collectionId) return;
        
        const fetchUserAndData = async () => {
            try {
                const supabase = createClient();
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    setCurrentUserId(user.id);
                }

                const result = await getCollectionWithPosts(collectionId);
                if (result.error || !result.collection) {
                    setError(result.error || "专栏不存在");
                } else {
                    setCollection(result.collection);
                    setPosts(result.posts);
                }
            } catch (err) {
                console.error(err);
                setError("加载失败");
            } finally {
                setIsLoading(false);
            }
        };

        fetchUserAndData();
    }, [collectionId]);

    const isAuthor = currentUserId === collection?.author_id;

    const coverStyle = collection?.cover_style || "preset-academic";
    const preset = COLLECTION_COVER_PRESETS.find(p => p.id === coverStyle) || COLLECTION_COVER_PRESETS[0];

    const getBackgroundStyle = () => {
        if (collection?.cover_url) {
            return {
                backgroundImage: `url(${collection.cover_url})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
            };
        }
        return {};
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background pb-12">
                <Skeleton className="w-full h-[400px] sm:h-[450px]" />
                <div className="max-w-5xl mx-auto px-4 sm:px-6 mt-8 space-y-4">
                    <Skeleton className="w-full h-24 rounded-xl" />
                    <Skeleton className="w-full h-24 rounded-xl" />
                    <Skeleton className="w-full h-24 rounded-xl" />
                </div>
            </div>
        );
    }

    if (error || !collection) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8">
                <p className="text-xl text-muted-foreground mb-4">{error}</p>
                <Button onClick={() => router.back()}>返回</Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background pb-16">
            {/* Hero Section */}
            <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className={`relative w-full min-h-[380px] sm:min-h-[420px] flex flex-col justify-between overflow-hidden shadow-lg ${!collection.cover_url ? preset.class : ''}`}
                style={getBackgroundStyle()}
            >
                {/* 复合深色防眩遮罩：保证任何模式和背景下文字都极致清晰 */}
                <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px]" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/55 to-black/25" />

                {/* 顶部导航 */}
                <div className="relative z-20 max-w-5xl w-full mx-auto px-4 sm:px-6 pt-6 flex items-center justify-between">
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => router.back()} 
                        className="bg-black/30 hover:bg-black/50 text-white/90 hover:text-white backdrop-blur-md border border-white/15 shadow-sm rounded-full px-3.5 transition-all"
                    >
                        <ArrowLeft className="mr-1.5 h-4 w-4" />
                        返回
                    </Button>

                    <div className="flex items-center gap-2">
                        <Badge 
                            variant="secondary" 
                            className="bg-black/40 text-white/90 hover:bg-black/50 backdrop-blur-md border border-white/20 px-3 py-1 text-xs font-medium shadow-sm"
                        >
                            {preset.icon} {preset.name}
                        </Badge>
                        {!collection.is_public && (
                            <Badge 
                                variant="outline" 
                                className="bg-amber-500/20 text-amber-200 border-amber-400/40 backdrop-blur-md px-2.5 py-1 text-xs"
                            >
                                私密专栏
                            </Badge>
                        )}
                    </div>
                </div>

                {/* 底部专栏元数据与操作 */}
                <div className="relative z-20 w-full px-4 sm:px-6 pb-8 pt-12">
                    <div className="max-w-5xl mx-auto">
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                            {/* 左侧：标题、描述与元信息 */}
                            <div className="space-y-4 flex-1 min-w-0">
                                <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)] leading-tight">
                                    {collection.name}
                                </h1>

                                {collection.description && (
                                    <p className="text-sm sm:text-base md:text-lg text-white/90 max-w-3xl leading-relaxed drop-shadow-[0_1px_4px_rgba(0,0,0,0.5)] line-clamp-3">
                                        {collection.description}
                                    </p>
                                )}

                                {/* 元信息胶囊栏 */}
                                <div className="flex items-center flex-wrap gap-2.5 pt-1">
                                    <div className="inline-flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/15 text-xs sm:text-sm text-white/95 shadow-sm">
                                        <Avatar className="h-5 w-5 border border-white/30">
                                            <AvatarImage src={collection.author?.avatar_url || ""} />
                                            <AvatarFallback className="bg-white/20 text-white text-[10px]">
                                                <User className="h-3 w-3" />
                                            </AvatarFallback>
                                        </Avatar>
                                        <span className="font-medium">{collection.author?.full_name || collection.author?.username || '未知作者'}</span>
                                    </div>

                                    <div className="inline-flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/15 text-xs sm:text-sm text-white/90 shadow-sm">
                                        <FileText className="h-3.5 w-3.5 text-white/70" />
                                        <span>{collection.post_count ?? posts.length} 篇内容</span>
                                    </div>

                                    <div className="inline-flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/15 text-xs sm:text-sm text-white/90 shadow-sm">
                                        <Clock className="h-3.5 w-3.5 text-white/70" />
                                        <span>{format(new Date(collection.created_at), 'yyyy-MM-dd')} 创建</span>
                                    </div>
                                </div>
                            </div>

                            {/* 右侧：作者管理操作栏 */}
                            {isAuthor && (
                                <div className="flex items-center gap-2.5 shrink-0 bg-black/45 backdrop-blur-md p-1.5 rounded-xl border border-white/20 shadow-xl">
                                    <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="bg-white/15 hover:bg-white/25 text-white border border-white/20 shadow-sm font-medium transition-all"
                                        onClick={() => setIsEditOpen(true)}
                                    >
                                        <Edit className="mr-1.5 h-4 w-4" />
                                        编辑专栏
                                    </Button>
                                    <Button 
                                        variant={isManageMode ? "default" : "ghost"} 
                                        size="sm" 
                                        className={
                                            isManageMode 
                                                ? "bg-primary text-primary-foreground hover:bg-primary/90 font-semibold shadow-md" 
                                                : "bg-white/15 hover:bg-white/25 text-white border border-white/20 shadow-sm font-medium transition-all"
                                        }
                                        onClick={() => setIsManageMode(!isManageMode)}
                                    >
                                        <Settings className="mr-1.5 h-4 w-4" />
                                        {isManageMode ? "完成管理" : "管理帖子"}
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Post List Section */}
            <div className="max-w-5xl mx-auto px-4 sm:px-6 mt-8">
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-border/60">
                    <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary" />
                        专栏目录
                        <span className="text-xs text-muted-foreground font-normal">
                            (共 {posts.length} 篇)
                        </span>
                    </h2>
                    {isAuthor && isManageMode && (
                        <p className="text-xs text-primary font-medium animate-pulse">
                            管理模式已开启：可使用上下箭头调整文章次序或移出专栏
                        </p>
                    )}
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15, duration: 0.3 }}
                >
                    {posts.length > 0 ? (
                        <CollectionPostList 
                            collectionId={collectionId}
                            posts={posts}
                            isAuthor={isAuthor}
                        />
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-center bg-card rounded-xl border border-dashed border-border/60 shadow-sm">
                            <FileText className="h-12 w-12 text-muted-foreground/40 mb-3" />
                            <h3 className="text-lg font-semibold text-foreground mb-1.5">暂无内容</h3>
                            <p className="text-sm text-muted-foreground max-w-sm">
                                这个专栏还没有添加任何帖子，你可以在发布新帖或编辑已有帖子时将其归入本专栏。
                            </p>
                        </div>
                    )}
                </motion.div>
            </div>

            {/* Edit Dialog */}
            {isEditOpen && (
                <CreateCollectionDialog 
                    open={isEditOpen} 
                    onOpenChange={setIsEditOpen} 
                    editingCollection={collection}
                    onSuccess={() => {
                        window.location.reload();
                    }}
                />
            )}
        </div>
    );
}
