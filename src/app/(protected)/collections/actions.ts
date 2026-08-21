"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// ============================================
// 创建专栏
// ============================================
export async function createCollection(data: {
    name: string;
    description?: string;
    cover_url?: string | null;
    cover_style?: string;
    is_public?: boolean;
}) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { error: "请先登录" };
    }

    // 检查用户是否被封禁
    const { data: profile } = await supabase
        .from("profiles")
        .select("is_banned")
        .eq("id", user.id)
        .single();

    if (profile?.is_banned) {
        return { error: "您的账号已被封禁，无法创建专栏" };
    }

    const { data: collection, error } = await supabase
        .from("collections")
        .insert({
            author_id: user.id,
            name: data.name.trim(),
            description: data.description?.trim() || null,
            cover_url: data.cover_url || null,
            cover_style: data.cover_style || "preset-academic",
            is_public: data.is_public ?? true,
        })
        .select("*")
        .single();

    if (error) {
        console.error("Create collection error:", error);
        return { error: "创建专栏失败" };
    }

    revalidatePath("/collections/manage");
    revalidatePath(`/user/${user.id}`);
    revalidatePath("/dashboard");
    return { data: collection };
}

// ============================================
// 更新专栏
// ============================================
export async function updateCollection(
    collectionId: string,
    data: {
        name?: string;
        description?: string;
        cover_url?: string | null;
        cover_style?: string;
        is_public?: boolean;
    }
) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { error: "请先登录" };
    }

    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name.trim();
    if (data.description !== undefined) updateData.description = data.description?.trim() || null;
    if (data.cover_url !== undefined) updateData.cover_url = data.cover_url;
    if (data.cover_style !== undefined) updateData.cover_style = data.cover_style;
    if (data.is_public !== undefined) updateData.is_public = data.is_public;

    const { error } = await supabase
        .from("collections")
        .update(updateData)
        .eq("id", collectionId)
        .eq("author_id", user.id);

    if (error) {
        console.error("Update collection error:", error);
        return { error: "更新专栏失败" };
    }

    revalidatePath(`/collections/${collectionId}`);
    revalidatePath("/collections/manage");
    return { success: true };
}

// ============================================
// 删除专栏
// ============================================
export async function deleteCollection(collectionId: string) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { error: "请先登录" };
    }

    const { error } = await supabase
        .from("collections")
        .delete()
        .eq("id", collectionId)
        .eq("author_id", user.id);

    if (error) {
        console.error("Delete collection error:", error);
        return { error: "删除专栏失败" };
    }

    revalidatePath("/collections/manage");
    return { success: true };
}

// ============================================
// 将帖子加入专栏
// ============================================
export async function addPostToCollection(collectionId: string, postId: string) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { error: "请先登录" };
    }

    // 获取当前专栏中最大的 position
    const { data: maxPosResult } = await supabase
        .from("collection_posts")
        .select("position")
        .eq("collection_id", collectionId)
        .order("position", { ascending: false })
        .limit(1)
        .single();

    const nextPosition = (maxPosResult?.position ?? -1) + 1;

    const { error } = await supabase
        .from("collection_posts")
        .insert({
            collection_id: collectionId,
            post_id: postId,
            position: nextPosition,
        });

    if (error) {
        if (error.code === "23505") {
            return { error: "该帖子已在此专栏中" };
        }
        console.error("Add post to collection error:", error);
        return { error: "添加帖子到专栏失败" };
    }

    revalidatePath(`/collections/${collectionId}`);
    return { success: true };
}

// ============================================
// 批量将帖子加入专栏（发帖/编辑帖子时使用）
// ============================================
export async function syncPostCollections(postId: string, collectionIds: string[]) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { error: "请先登录" };
    }

    // 获取当前帖子已属于的专栏
    const { data: existingEntries } = await supabase
        .from("collection_posts")
        .select("collection_id")
        .eq("post_id", postId);

    const existingCollectionIds = (existingEntries || []).map(e => e.collection_id);

    // 需要新增的
    const toAdd = collectionIds.filter(id => !existingCollectionIds.includes(id));
    // 需要移除的
    const toRemove = existingCollectionIds.filter(id => !collectionIds.includes(id));

    // 批量新增
    if (toAdd.length > 0) {
        const inserts = toAdd.map(cid => ({
            collection_id: cid,
            post_id: postId,
            position: 9999, // 追加到末尾
        }));
        const { error } = await supabase
            .from("collection_posts")
            .insert(inserts);
        if (error) {
            console.error("Sync add error:", error);
        }
    }

    // 批量移除
    if (toRemove.length > 0) {
        const { error } = await supabase
            .from("collection_posts")
            .delete()
            .eq("post_id", postId)
            .in("collection_id", toRemove);
        if (error) {
            console.error("Sync remove error:", error);
        }
    }

    // Revalidate affected collections
    for (const cid of [...toAdd, ...toRemove]) {
        revalidatePath(`/collections/${cid}`);
    }

    return { success: true };
}

// ============================================
// 从专栏移除帖子
// ============================================
export async function removePostFromCollection(collectionId: string, postId: string) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { error: "请先登录" };
    }

    const { error } = await supabase
        .from("collection_posts")
        .delete()
        .eq("collection_id", collectionId)
        .eq("post_id", postId);

    if (error) {
        console.error("Remove post from collection error:", error);
        return { error: "从专栏移除帖子失败" };
    }

    revalidatePath(`/collections/${collectionId}`);
    return { success: true };
}

// ============================================
// 批量重排序专栏帖子
// ============================================
export async function reorderCollectionPosts(collectionId: string, orderedPostIds: string[]) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { error: "请先登录" };
    }

    const { error } = await supabase.rpc("reorder_collection_posts", {
        target_collection_id: collectionId,
        ordered_post_ids: orderedPostIds,
    });

    if (error) {
        console.error("Reorder collection posts error:", error);
        return { error: "重排序失败" };
    }

    revalidatePath(`/collections/${collectionId}`);
    return { success: true };
}

// ============================================
// 获取用户的专栏列表
// ============================================
export async function getCollectionsByUser(userId: string) {
    const supabase = await createClient();

    const { data: collections, error } = await supabase
        .from("collections")
        .select(`
            id,
            name,
            description,
            cover_url,
            cover_style,
            is_public,
            post_count,
            created_at,
            updated_at,
            author:profiles!author_id (
                id,
                username,
                avatar_url
            )
        `)
        .eq("author_id", userId)
        .order("updated_at", { ascending: false });

    if (error) {
        console.error("Get collections error:", error);
        return { error: "获取专栏列表失败", collections: [] };
    }

    return { collections: collections || [] };
}

// ============================================
// 获取当前用户的专栏列表（简略，用于选择器）
// ============================================
export async function getMyCollections() {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { collections: [] };
    }

    const { data: collections, error } = await supabase
        .from("collections")
        .select("id, name, description, post_count, cover_style, cover_url, is_public, created_at, updated_at")
        .eq("author_id", user.id)
        .order("updated_at", { ascending: false });

    if (error) {
        console.error("Get my collections error:", error);
        return { collections: [] };
    }

    return { collections: collections || [] };
}

// ============================================
// 获取帖子所属的专栏列表
// ============================================
export async function getPostCollections(postId: string) {
    const supabase = await createClient();

    // 1. 获取关联记录
    const { data: colPosts, error: colError } = await supabase
        .from("collection_posts")
        .select("collection_id")
        .eq("post_id", postId);

    if (colError || !colPosts || colPosts.length === 0) {
        return { collections: [] };
    }

    const collectionIds = Array.from(new Set(colPosts.map((cp) => cp.collection_id)));

    // 2. 获取专栏主体信息
    const { data: collections, error } = await supabase
        .from("collections")
        .select("id, name, description, cover_style, cover_url, is_public, post_count, follower_count, view_count")
        .in("id", collectionIds);

    if (error || !collections) {
        console.error("Get post collections error:", error);
        return { collections: [] };
    }

    return { collections };
}

// ============================================
// 获取专栏详情及帖子列表
// ============================================
export async function getCollectionWithPosts(collectionId: string) {
    const supabase = await createClient();

    // 获取专栏信息
    const { data: collection, error: collectionError } = await supabase
        .from("collections")
        .select(`
            id,
            name,
            description,
            cover_url,
            cover_style,
            is_public,
            post_count,
            follower_count,
            view_count,
            created_at,
            updated_at,
            author_id,
            author:profiles!author_id (
                id,
                username,
                avatar_url,
                vip_level
            )
        `)
        .eq("id", collectionId)
        .single();

    if (collectionError || !collection) {
        console.error("Get collection error:", collectionError);
        return { error: "专栏不存在", collection: null, posts: [] };
    }

    // 获取专栏中的帖子
    const { data: collectionPosts, error: postsError } = await supabase
        .from("collection_posts")
        .select(`
            position,
            added_at,
            post:posts!post_id (
                id,
                title,
                content,
                tags,
                view_count,
                like_count,
                comment_count,
                is_solved,
                is_help_wanted,
                is_published,
                created_at,
                author:profiles!author_id (
                    id,
                    username,
                    avatar_url,
                    vip_level
                )
            )
        `)
        .eq("collection_id", collectionId)
        .order("position", { ascending: true });

    if (postsError) {
        console.error("Get collection posts error:", postsError);
        return { collection, posts: [], error: null };
    }

    const posts = (collectionPosts || [])
        .filter((item: any) => item.post && item.post.is_published)
        .map((item: any) => ({
            ...item.post,
            position: item.position,
            added_at: item.added_at,
        }));

    return { collection, posts, error: null };
}

// ============================================
// 关注/取消关注专栏（切换模式）
// ============================================
export async function toggleFollowCollection(collectionId: string) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { error: "请先登录" };
    }

    // 检查是否已关注
    const { data: existing } = await supabase
        .from("collection_follows")
        .select("id")
        .eq("user_id", user.id)
        .eq("collection_id", collectionId)
        .single();

    if (existing) {
        // 取消关注
        const { error } = await supabase
            .from("collection_follows")
            .delete()
            .eq("user_id", user.id)
            .eq("collection_id", collectionId);

        if (error) {
            console.error("Unfollow collection error:", error);
            return { error: "取消关注失败" };
        }
        revalidatePath(`/collections/${collectionId}`);
        return { followed: false };
    } else {
        // 关注
        const { error } = await supabase
            .from("collection_follows")
            .insert({
                user_id: user.id,
                collection_id: collectionId,
            });

        if (error) {
            if (error.code === "23505") {
                return { followed: true }; // 已经关注了
            }
            console.error("Follow collection error:", error);
            return { error: "关注失败" };
        }
        revalidatePath(`/collections/${collectionId}`);
        return { followed: true };
    }
}

// ============================================
// 获取当前用户是否已关注指定专栏
// ============================================
export async function getCollectionFollowStatus(collectionId: string) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { isFollowing: false };
    }

    const { data } = await supabase
        .from("collection_follows")
        .select("id")
        .eq("user_id", user.id)
        .eq("collection_id", collectionId)
        .single();

    return { isFollowing: !!data };
}

// ============================================
// 获取当前用户关注的所有专栏
// ============================================
export async function getFollowedCollections() {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { collections: [] };
    }

    // 先获取关注记录
    const { data: follows, error: followError } = await supabase
        .from("collection_follows")
        .select("collection_id, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

    if (followError || !follows || follows.length === 0) {
        return { collections: [] };
    }

    const collectionIds = follows.map(f => f.collection_id);

    // 获取专栏详情
    const { data: collections, error: colError } = await supabase
        .from("collections")
        .select(`
            id, name, description, cover_url, cover_style,
            is_public, post_count, follower_count, view_count,
            created_at, updated_at,
            author:profiles!author_id (
                id, username, avatar_url
            )
        `)
        .in("id", collectionIds);

    if (colError || !collections) {
        return { collections: [] };
    }

    // 按关注时间排序
    const followTimeMap = new Map(follows.map(f => [f.collection_id, f.created_at]));
    const sorted = collections.sort((a: any, b: any) => {
        const tA = followTimeMap.get(a.id) || "";
        const tB = followTimeMap.get(b.id) || "";
        return tB.localeCompare(tA);
    });

    return { collections: sorted };
}

// ============================================
// 记录浏览量（去重：每用户仅首次计数）
// ============================================
export async function incrementCollectionViewCount(collectionId: string) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
        await supabase.rpc("increment_collection_view_count", {
            target_collection_id: collectionId,
            viewer_user_id: user.id,
        });
    } catch (error) {
        console.error("Increment view count error:", error);
    }
}
