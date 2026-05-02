"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// ============================================
// 研究室 CRUD
// ============================================

export async function createLabRoom(formData: {
    name: string;
    description?: string;
    room_type: "reading" | "whiteboard" | "hybrid";
    max_members: number;
    access_code?: string;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "请先登录" };

    const insertData: Record<string, unknown> = {
        name: formData.name,
        description: formData.description || null,
        room_type: formData.room_type,
        max_members: formData.max_members,
        created_by: user.id,
    };

    // 如有访问码，简单 hash 存储（生产环境应使用 bcrypt）
    if (formData.access_code) {
        insertData.access_code_hash = formData.access_code;
    }

    const { data, error } = await supabase
        .from("lab_rooms")
        .insert(insertData)
        .select("id")
        .single();

    if (error) {
        console.error("创建研究室失败:", error);
        return { error: "创建研究室失败，请重试" };
    }

    revalidatePath("/lab");
    return { data };
}

export async function getMyLabRooms() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "请先登录", data: [] };

    const { data, error } = await supabase
        .from("lab_rooms")
        .select(`
            *,
            lab_members(count),
            lab_post_links(count)
        `)
        .order("updated_at", { ascending: false });

    if (error) {
        console.error("获取研究室列表失败:", error);
        return { error: "获取列表失败", data: [] };
    }

    return { data: data || [] };
}

export async function getLabRoom(roomId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "请先登录" };

    const { data, error } = await supabase
        .from("lab_rooms")
        .select(`
            *,
            lab_members(
                id,
                role,
                joined_at,
                last_seen_at,
                user:profiles(id, full_name, username, avatar_url)
            ),
            lab_post_links(
                id,
                sort_order,
                created_at,
                post:posts(id, title, content, tags, author_id, like_count, comment_count, created_at,
                    author:profiles(id, full_name, username, avatar_url)
                )
            )
        `)
        .eq("id", roomId)
        .single();

    if (error) {
        console.error("获取研究室详情失败:", error);
        return { error: "研究室不存在或没有权限" };
    }

    return { data };
}

export async function deleteLabRoom(roomId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "请先登录" };

    const { error } = await supabase
        .from("lab_rooms")
        .delete()
        .eq("id", roomId);

    if (error) {
        console.error("删除研究室失败:", error);
        return { error: "删除失败，仅创建者可删除" };
    }

    revalidatePath("/lab");
    return { success: true };
}

export async function joinLabRoom(roomId: string, accessCode?: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "请先登录" };

    // 检查房间是否存在并获取访问码
    const { data: room, error: roomError } = await supabase
        .from("lab_rooms")
        .select("id, access_code_hash, max_members")
        .eq("id", roomId)
        .single();

    if (roomError || !room) {
        return { error: "研究室不存在" };
    }

    // 验证访问码
    if (room.access_code_hash && room.access_code_hash !== accessCode) {
        return { error: "访问码不正确" };
    }

    // 检查人数上限
    const { count } = await supabase
        .from("lab_members")
        .select("*", { count: "exact", head: true })
        .eq("room_id", roomId);

    if (count && count >= room.max_members) {
        return { error: "研究室已满" };
    }

    // 加入
    const { error } = await supabase
        .from("lab_members")
        .insert({
            room_id: roomId,
            user_id: user.id,
            role: "editor",
        });

    if (error) {
        if (error.code === "23505") {
            return { error: "你已经是该研究室成员" };
        }
        console.error("加入研究室失败:", error);
        return { error: "加入失败，请重试" };
    }

    revalidatePath("/lab");
    revalidatePath(`/lab/${roomId}`);
    return { success: true };
}

// ============================================
// 帖子关联
// ============================================

export async function searchPostsForRoom(query: string, roomId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "请先登录", data: [] };

    // 获取已关联的帖子 IDs
    const { data: linked } = await supabase
        .from("lab_post_links")
        .select("post_id")
        .eq("room_id", roomId);

    const linkedIds = linked?.map((l) => l.post_id) || [];

    // 搜索帖子
    let queryBuilder = supabase
        .from("posts")
        .select("id, title, tags, like_count, comment_count, created_at, author:profiles(id, full_name, username, avatar_url)")
        .eq("is_published", true)
        .order("created_at", { ascending: false })
        .limit(20);

    if (query.trim()) {
        queryBuilder = queryBuilder.ilike("title", `%${query}%`);
    }

    const { data, error } = await queryBuilder;

    if (error) {
        console.error("搜索帖子失败:", error);
        return { error: "搜索失败", data: [] };
    }

    // 过滤掉已关联的
    const filtered = (data || []).filter((p) => !linkedIds.includes(p.id));
    return { data: filtered };
}

export async function addPostToRoom(roomId: string, postId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "请先登录" };

    // 获取当前排序最大值
    const { data: existing } = await supabase
        .from("lab_post_links")
        .select("sort_order")
        .eq("room_id", roomId)
        .order("sort_order", { ascending: false })
        .limit(1);

    const nextOrder = existing && existing.length > 0 ? existing[0].sort_order + 1 : 0;

    const { data: insertedLink, error } = await supabase
        .from("lab_post_links")
        .insert({
            room_id: roomId,
            post_id: postId,
            added_by: user.id,
            sort_order: nextOrder,
        })
        .select(`
            id,
            sort_order,
            created_at,
            post:posts(id, title, content, tags, author_id, like_count, comment_count, created_at,
                author:profiles(id, full_name, username, avatar_url)
            )
        `)
        .single();

    if (error) {
        if (error.code === "23505") {
            return { error: "该帖子已添加" };
        }
        console.error("添加帖子失败:", error);
        return { error: "添加失败" };
    }

    revalidatePath(`/lab/${roomId}`);
    return { success: true, data: insertedLink };
}

export async function removePostFromRoom(roomId: string, postId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "请先登录" };

    const { error } = await supabase
        .from("lab_post_links")
        .delete()
        .eq("room_id", roomId)
        .eq("post_id", postId);

    if (error) {
        console.error("移除帖子失败:", error);
        return { error: "移除失败" };
    }

    revalidatePath(`/lab/${roomId}`);
    return { success: true };
}

// ============================================
// 共创发帖
// ============================================

export async function publishCoPost(data: {
    roomId: string;
    title: string;
    tags: string[];
    content: object;
    coAuthors: {
        userId: string;
        role: "co_author" | "contributor" | "annotator";
        contributionSummary?: string;
    }[];
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "请先登录" };

    // 1. 创建帖子
    const { data: post, error: postError } = await supabase
        .from("posts")
        .insert({
            title: data.title,
            content: data.content,
            tags: data.tags,
            author_id: user.id,
            is_published: true,
        })
        .select("id")
        .single();

    if (postError || !post) {
        console.error("创建帖子失败:", postError);
        return { error: "发布失败，请重试" };
    }

    // 2. 插入共创者
    if (data.coAuthors.length > 0) {
        const coAuthorRows = data.coAuthors.map((ca) => ({
            post_id: post.id,
            user_id: ca.userId,
            role: ca.role,
            contribution_summary: ca.contributionSummary || null,
            lab_room_id: data.roomId,
        }));

        const { error: caError } = await supabase
            .from("post_co_authors")
            .insert(coAuthorRows);

        if (caError) {
            console.error("插入共创者失败:", caError);
            // 帖子已创建，不回滚，仅提示
        }
    }

    revalidatePath("/dashboard");
    revalidatePath(`/lab/${data.roomId}`);
    return { data: { id: post.id } };
}
