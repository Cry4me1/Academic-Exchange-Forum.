"use server";

import { deleteImages, extractImageUrls, findRemovedImages } from "@/lib/storage-cleanup";
import { createClient } from "@/lib/supabase/server";
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

    const { data: post, error } = await supabase
        .from("posts")
        .insert({
            author_id: user.id,
            title: data.title,
            content: data.content,
            tags: data.tags,
            is_help_wanted: data.is_help_wanted || false,
            is_published: true,
        })
        .select("id")
        .single();

    if (error) {
        console.error("Create post error:", error);
        return { error: "创建帖子失败" };
    }

    revalidatePath("/dashboard");
    return { data: post };
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

    // 如果内容被更新，先获取旧内容用于对比图片
    let oldContent: JSONContentNode | null = null;
    if (data.content) {
        const { data: oldPost } = await supabase
            .from("posts")
            .select("content")
            .eq("id", postId)
            .eq("author_id", user.id)
            .single();

        if (oldPost) {
            oldContent = oldPost.content as JSONContentNode;
        }
    }

    const { error } = await supabase
        .from("posts")
        .update(data)
        .eq("id", postId)
        .eq("author_id", user.id);

    if (error) {
        console.error("Update post error:", error);
        return { error: "更新帖子失败" };
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

    revalidatePath(`/posts/${postId}`);
    revalidatePath("/dashboard");
    return { success: true };
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
    filter?: "latest" | "trending" | "following";
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
            comment_count,
            bookmark_count,
            share_count,
            is_solved,
            is_help_wanted,
            created_at,
            author:profiles!author_id (
                id,
                username,
                full_name,
                avatar_url
            )
        `)
        .eq("is_published", true)
        .range(offset, offset + limit - 1);

    // 根据筛选条件排序
    if (filter === "trending") {
        query = query.order("like_count", { ascending: false });
    } else {
        query = query.order("created_at", { ascending: false });
    }

    const { data: posts, error } = await query;

    if (error) {
        console.error("Get posts error:", error);
        return { error: "获取帖子列表失败", posts: [] };
    }

    // 如果用户已登录，获取用户的点赞和收藏状态
    let userLikes: string[] = [];
    let userBookmarks: string[] = [];

    if (user && posts && posts.length > 0) {
        const postIds = posts.map((p) => p.id);

        const [likesResult, bookmarksResult] = await Promise.all([
            supabase
                .from("likes")
                .select("post_id")
                .eq("user_id", user.id)
                .in("post_id", postIds),
            supabase
                .from("bookmarks")
                .select("post_id")
                .eq("user_id", user.id)
                .in("post_id", postIds),
        ]);

        userLikes = (likesResult.data || []).map((l) => l.post_id!);
        userBookmarks = (bookmarksResult.data || []).map((b) => b.post_id);
    }

    // 为每个帖子添加用户互动状态
    const postsWithStatus = (posts || []).map((post) => ({
        ...post,
        isLiked: userLikes.includes(post.id),
        isBookmarked: userBookmarks.includes(post.id),
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
