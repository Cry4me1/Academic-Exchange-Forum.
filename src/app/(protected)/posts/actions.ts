"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// 创建帖子
export async function createPost(data: {
    title: string;
    content: object;
    tags: string[];
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

    const { error } = await supabase
        .from("posts")
        .update(data)
        .eq("id", postId)
        .eq("author_id", user.id);

    if (error) {
        console.error("Update post error:", error);
        return { error: "更新帖子失败" };
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

    const { error } = await supabase
        .from("posts")
        .delete()
        .eq("id", postId)
        .eq("author_id", user.id);

    if (error) {
        console.error("Delete post error:", error);
        return { error: "删除帖子失败" };
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
