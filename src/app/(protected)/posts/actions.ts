"use server";

// Force dev server Action ID re-mapping & refresh manifest


import { deleteImages, extractImageUrls, findRemovedImages } from "@/lib/storage-cleanup";
import { syncPostLinks } from "@/lib/post-links";
import { generatePostEmbedding } from "@/lib/post-embed";
import { createClient } from "@/lib/supabase/server";
import { moderatePostContent } from "@/lib/moderation/engine";
import { sendPendingReviewEmail } from "@/lib/email";
import { revalidatePath } from "next/cache";

// JSONContent 类型定义
interface JSONContentNode {
    type?: string;
    attrs?: Record<string, unknown>;
    content?: JSONContentNode[];
}

// 创建帖子
export async function createPost(data: {
    title: string;
    content: object;
    tags: string[];
    is_help_wanted?: boolean;
}) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { error: "请先登录" };
    }

    // 检查用户是否被封禁或禁言
    const { data: profile } = await supabase
        .from("profiles")
        .select("id, username, full_name, email, is_banned, is_muted, muted_until")
        .eq("id", user.id)
        .single();

    if (profile?.is_banned) {
        return { error: "您的账号已被封禁，无法发布内容" };
    }

    if (profile?.is_muted) {
        const muteExpiry = profile.muted_until ? new Date(profile.muted_until) : null;
        if (!muteExpiry || muteExpiry > new Date()) {
            return { error: "您已被禁言，暂时无法发布内容" };
        }
    }

    // 执行 AI + 敏感词内容初审
    const moderation = await moderatePostContent({
        authorId: user.id,
        title: data.title,
        content: data.content,
        tags: data.tags,
    });

    // 若触发直接拦截（违规敏感词或高危严重违规）
    if (moderation.reviewStatus === "rejected") {
        return {
            error: moderation.errorMessage || "内容未通过平台安全审核规范，请修改后重试",
            moderation,
        };
    }

    const isApproved = moderation.reviewStatus === "approved";

    const { data: post, error } = await supabase
        .from("posts")
        .insert({
            author_id: user.id,
            title: data.title,
            content: data.content,
            tags: data.tags,
            is_help_wanted: data.is_help_wanted || false,
            is_published: isApproved,
            review_status: moderation.reviewStatus,
            ai_score: moderation.score,
            ai_risk_level: moderation.riskLevel,
            ai_reason: moderation.reason,
            ai_suggested_tags: moderation.suggestedTags,
            matched_sensitive_words: moderation.matchedSensitiveWords,
        })
        .select("id, review_status, ai_score, ai_risk_level")
        .single();

    if (error) {
        console.error("Create post error:", error);
        return { error: "创建帖子失败" };
    }

    // 若进入人工待审队列（pending），发送邮件通知管理员
    if (post?.id && moderation.reviewStatus === "pending") {
        sendPendingReviewEmail({
            postId: post.id,
            title: data.title,
            content: data.content,
            tags: data.tags,
            author: {
                id: user.id,
                username: profile?.username,
                fullName: profile?.full_name,
                email: profile?.email || user.email,
            },
            moderation: {
                score: moderation.score,
                riskLevel: moderation.riskLevel,
                reason: moderation.reason,
                suggestedTags: moderation.suggestedTags,
                matchedSensitiveWords: moderation.matchedSensitiveWords,
                latencyMs: moderation.latencyMs,
            },
        }).catch((mailErr) => {
            console.error("[createPost] 发送待人工审核通知邮件失败:", mailErr);
        });
    }

    // 审核通过时，同步双向链接与同步生成 Embedding
    if (post?.id && isApproved) {
        await syncPostLinks(supabase, post.id, data.content).catch((err) => {
            console.error("[createPost] 同步双向链接失败:", err);
        });
        await generatePostEmbedding(post.id, supabase).catch((err) => {
            console.error("[createPost] 同步生成 Embedding 向量失败:", err);
        });
    }

    revalidatePath("/dashboard");
    return {
        data: post,
        reviewStatus: moderation.reviewStatus,
        message: moderation.errorMessage || (isApproved ? "发布成功" : "已提交审核"),
    };
}

// 更新帖子
export async function updatePost(
    postId: string,
    data: {
        title?: string;
        content?: object;
        tags?: string[];
        is_published?: boolean;
    }
) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { error: "请先登录" };
    }

    // 如果内容被更新，先获取旧内容用于对比图片与标题
    let oldContent: JSONContentNode | null = null;
    const { data: oldPost } = await supabase
        .from("posts")
        .select("title, content, tags, review_status")
        .eq("id", postId)
        .eq("author_id", user.id)
        .single();

    if (!oldPost) {
        return { error: "帖子不存在或无权修改" };
    }

    oldContent = oldPost.content as JSONContentNode;

    const updatePayload: any = { ...data };
    let moderationResult: any = null;
    let titleToReview = "";
    let contentToReview: any = null;
    let tagsToReview: string[] = [];

    // 若修改了标题或正文，重新走审核
    if (data.title || data.content) {
        titleToReview = data.title || oldPost.title;
        contentToReview = data.content || oldPost.content;
        tagsToReview = data.tags || oldPost.tags || [];

        const moderation = await moderatePostContent({
            postId,
            authorId: user.id,
            title: titleToReview,
            content: contentToReview,
            tags: tagsToReview,
        });

        if (moderation.reviewStatus === "rejected") {
            return {
                error: moderation.errorMessage || "修改后的内容未通过安全审核规范",
                moderation,
            };
        }

        moderationResult = moderation;
        const isApproved = moderation.reviewStatus === "approved";
        updatePayload.review_status = moderation.reviewStatus;
        updatePayload.is_published = isApproved;
        updatePayload.ai_score = moderation.score;
        updatePayload.ai_risk_level = moderation.riskLevel;
        updatePayload.ai_reason = moderation.reason;
        updatePayload.ai_suggested_tags = moderation.suggestedTags;
        updatePayload.matched_sensitive_words = moderation.matchedSensitiveWords;
    }

    const { error } = await supabase
        .from("posts")
        .update(updatePayload)
        .eq("id", postId)
        .eq("author_id", user.id);

    if (error) {
        console.error("Update post error:", error);
        return { error: "更新帖子失败" };
    }

    // 若更新后重新进入人工审核队列（pending），发送邮件通知管理员
    if (updatePayload.review_status === "pending" && moderationResult) {
        const { data: authorProfile } = await supabase
            .from("profiles")
            .select("id, username, full_name, email")
            .eq("id", user.id)
            .single();

        sendPendingReviewEmail({
            postId,
            title: titleToReview,
            content: contentToReview,
            tags: tagsToReview,
            author: {
                id: user.id,
                username: authorProfile?.username,
                fullName: authorProfile?.full_name,
                email: authorProfile?.email || user.email,
            },
            moderation: {
                score: moderationResult.score,
                riskLevel: moderationResult.riskLevel,
                reason: moderationResult.reason,
                suggestedTags: moderationResult.suggestedTags,
                matchedSensitiveWords: moderationResult.matchedSensitiveWords,
                latencyMs: moderationResult.latencyMs,
            },
        }).catch((mailErr) => {
            console.error("[updatePost] 发送待人工审核通知邮件失败:", mailErr);
        });
    }

    // 清理被移除的图片（异步执行，不阻塞响应）
    if (data.content && oldContent) {
        const removedUrls = findRemovedImages(
            oldContent,
            data.content as JSONContentNode
        );
        if (removedUrls.length > 0) {
            console.log(`[updatePost] 检测到 ${removedUrls.length} 个被移除的图片，正在清理...`);
            deleteImages(removedUrls).catch((err) => {
                console.error("[updatePost] 清理图片失败:", err);
            });
        }
    }

    // 同步双向链接与更新 AI Embedding
    if (data.content) {
        await syncPostLinks(supabase, postId, data.content).catch((err) => {
            console.error("[updatePost] 同步双向链接失败:", err);
        });
    }
    
    // 只要有任何更新动作，都重新计算向量
    await generatePostEmbedding(postId, supabase).catch((err) => {
        console.error("[updatePost] 同步生成 Embedding 向量失败:", err);
    });

    revalidatePath(`/posts/${postId}`);
    revalidatePath("/dashboard");
    return {
        success: true,
        reviewStatus: updatePayload.review_status || oldPost.review_status,
    };
}

// 删除帖子
export async function deletePost(postId: string) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { error: "请先登录" };
    }

    // 先获取帖子内容，用于提取图片 URL
    const { data: post } = await supabase
        .from("posts")
        .select("author_id, content")
        .eq("id", postId)
        .single();

    if (!post) {
        return { error: "帖子不存在" };
    }

    if (post.author_id !== user.id) {
        return { error: "无权删除此帖子" };
    }

    // 提取帖子中的所有图片 URL
    const imageUrls = extractImageUrls(post.content as JSONContentNode);

    const { error } = await supabase
        .from("posts")
        .delete()
        .eq("id", postId);

    if (error) {
        console.error("Delete post error:", error);
        return { error: "删除帖子失败" };
    }

    // 清理帖子中的所有图片（异步执行，不阻塞响应）
    if (imageUrls.length > 0) {
        console.log(`[deletePost] 正在清理帖子中的 ${imageUrls.length} 个图片...`);
        deleteImages(imageUrls).catch((err) => {
            console.error("[deletePost] 清理图片失败:", err);
        });
    }

    revalidatePath("/dashboard");
    return { success: true };
}

// 获取帖子列表
export async function getPosts(options: {
    filter?: "latest" | "trending" | "following" | "solved" | "help";
    page?: number;
    limit?: number;
} = {}) {
    const { filter = "latest", page = 1, limit = 10 } = options;
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    const offset = (page - 1) * limit;

    let query = supabase
        .from("posts")
        .select(`
            id,
            title,
            content,
            tags,
            view_count,
            like_count,
            comment_count,
            bookmark_count,
            share_count,
            is_solved,
            is_help_wanted,
            is_pinned,
            review_status,
            created_at,
            author:profiles!author_id (
                id,
                username,
                full_name,
                avatar_url,
                vip_level,
                special_title,
                badges
            )
        `)
        .eq("is_published", true)
        .eq("is_hidden", false)
        .eq("review_status", "approved")
        .range(offset, offset + limit - 1);

    // 默认情况：所有查询优先考虑 is_pinned，然后才是业务排序
    query = query.order("is_pinned", { ascending: false });

    // 根据筛选条件过滤 & 排序
    if (filter === "trending") {
        query = query.order("like_count", { ascending: false });
    } else if (filter === "solved") {
        query = query.eq("is_solved", true).order("created_at", { ascending: false });
    } else if (filter === "help") {
        query = query.eq("is_help_wanted", true).eq("is_solved", false).order("created_at", { ascending: false });
    } else {
        query = query.order("created_at", { ascending: false });
    }

    const { data: posts, error } = await query;

    if (error) {
        console.error("Get posts error:", error);
        return { error: "获取帖子列表失败", posts: [] };
    }

    // 获取用户的点赞、收藏状态及帖子的所属专栏
    let userLikes: string[] = [];
    let userBookmarks: string[] = [];
    const postCollectionsMap: Record<string, Array<{ id: string; name: string }>> = {};

    if (posts && posts.length > 0) {
        const postIds = posts.map((p) => p.id);

        const [likesResult, bookmarksResult, collectionsResult] = await Promise.all([
            user
                ? supabase
                    .from("likes")
                    .select("post_id")
                    .eq("user_id", user.id)
                    .in("post_id", postIds)
                : Promise.resolve({ data: [] }),
            user
                ? supabase
                    .from("bookmarks")
                    .select("post_id")
                    .eq("user_id", user.id)
                    .in("post_id", postIds)
                : Promise.resolve({ data: [] }),
            supabase
                .from("collection_posts")
                .select(`
                    post_id,
                    collection:collections!collection_id (
                        id,
                        name,
                        is_public
                    )
                `)
                .in("post_id", postIds),
        ]);

        userLikes = ((likesResult as any).data || []).map((l: any) => l.post_id!);
        userBookmarks = ((bookmarksResult as any).data || []).map((b: any) => b.post_id);

        if ((collectionsResult as any).data) {
            for (const item of (collectionsResult as any).data) {
                if (item.collection && item.collection.is_public) {
                    if (!postCollectionsMap[item.post_id]) {
                        postCollectionsMap[item.post_id] = [];
                    }
                    postCollectionsMap[item.post_id].push({
                        id: item.collection.id,
                        name: item.collection.name,
                    });
                }
            }
        }
    }

    // 为每个帖子添加用户互动状态 + 作者VIP等级 + 所属专栏
    const postsWithStatus = (posts || []).map((post) => ({
        ...post,
        isLiked: userLikes.includes(post.id),
        isBookmarked: userBookmarks.includes(post.id),
        authorVipLevel: (post as any).author?.vip_level || 1,
        collections: postCollectionsMap[post.id] || [],
    }));

    return { posts: postsWithStatus };
}

// 切换评论的“采纳”状态
export async function toggleAcceptAnswer(commentId: string) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { error: "请先登录" };
    }

    const { data, error } = await supabase
        .rpc("toggle_comment_acceptance", {
            target_comment_id: commentId
        });

    if (error) {
        console.error("Toggle acceptance error:", error);
        return { error: "操作失败" };
    }

    // @ts-ignore
    if (data?.error) {
        // @ts-ignore
        return { error: data.error };
    }

    revalidatePath("/posts/[id]", "page");
    revalidatePath("/dashboard");

    // @ts-ignore
    return { success: true, status: data?.status };
}

// 保存同行评审
export async function savePeerReview(postId: string, reasoning: string, review: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { error: "请先登录" };
    }

    try {
        const { error } = await supabase
            .from("peer_reviews")
            .upsert({
                post_id: postId,
                user_id: user.id,
                reasoning_content: reasoning,
                review_content: review,
                updated_at: new Date().toISOString()
            }, {
                onConflict: "post_id"
            });

        if (error) throw error;

        revalidatePath(`/posts/${postId}`);
        return { success: true };
    } catch (error) {
        console.error("Save peer review error:", error);
        return { error: "保存同行评审失败" };
    }
}

// 切换同行评审的公开展示状态
export async function togglePeerReviewVisibility(postId: string, isPublic: boolean) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { error: "请先登录" };
    }

    try {
        const { error } = await supabase
            .from("peer_reviews")
            .update({ is_public: isPublic })
            .eq("post_id", postId)
            .eq("user_id", user.id);

        if (error) throw error;

        revalidatePath(`/posts/${postId}`);
        return { success: true };
    } catch (error) {
        console.error("Toggle peer review visibility error:", error);
        return { error: "修改可见性失败" };
    }
}

// 获取帖子的同行评审
export async function getPeerReview(postId: string) {
    const supabase = await createClient();
    
    try {
        const { data, error } = await supabase
            .from("peer_reviews")
            .select("*")
            .eq("post_id", postId)
            .maybeSingle();

        if (error) throw error;
        return { data };
    } catch (error) {
        console.error("Get peer review error:", error);
        return { error: "获取同行评审失败" };
    }
}

