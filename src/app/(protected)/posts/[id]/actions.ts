"use server";

import { deleteImages, extractImageUrls } from "@/lib/storage-cleanup";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// JSONContent 类型定义
interface JSONContentNode {
    type?: string;
    attrs?: Record<string, unknown>;
    content?: JSONContentNode[];
}

// 切换帖子点赞状态
export async function toggleLikePost(postId: string) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { error: "请先登录" };
    }

    // 检查是否已点赞
    const { data: existingLike } = await supabase
        .from("likes")
        .select("id")
        .eq("user_id", user.id)
        .eq("post_id", postId)
        .single();

    if (existingLike) {
        // 取消点赞
        const { error } = await supabase
            .from("likes")
            .delete()
            .eq("id", existingLike.id);

        if (error) {
            console.error("Unlike error:", error);
            return { error: "取消点赞失败" };
        }

        revalidatePath(`/posts/${postId}`);
        return { liked: false };
    } else {
        // 点赞
        const { error } = await supabase
            .from("likes")
            .insert({
                user_id: user.id,
                post_id: postId,
            });

        if (error) {
            console.error("Like error:", error);
            return { error: "点赞失败" };
        }

        revalidatePath(`/posts/${postId}`);
        return { liked: true };
    }
}

// 切换评论点赞状态
export async function toggleLikeComment(commentId: string) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { error: "请先登录" };
    }

    // 检查是否已点赞
    const { data: existingLike } = await supabase
        .from("likes")
        .select("id")
        .eq("user_id", user.id)
        .eq("comment_id", commentId)
        .single();

    if (existingLike) {
        // 取消点赞
        const { error } = await supabase
            .from("likes")
            .delete()
            .eq("id", existingLike.id);

        if (error) {
            console.error("Unlike comment error:", error);
            return { error: "取消点赞失败" };
        }

        return { liked: false };
    } else {
        // 点赞
        const { error } = await supabase
            .from("likes")
            .insert({
                user_id: user.id,
                comment_id: commentId,
            });

        if (error) {
            console.error("Like comment error:", error);
            return { error: "点赞失败" };
        }

        return { liked: true };
    }
}

// 切换收藏状态
export async function toggleBookmarkPost(postId: string) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { error: "请先登录" };
    }

    // 检查是否已收藏
    const { data: existingBookmark } = await supabase
        .from("bookmarks")
        .select("id")
        .eq("user_id", user.id)
        .eq("post_id", postId)
        .single();

    if (existingBookmark) {
        // 取消收藏
        const { error } = await supabase
            .from("bookmarks")
            .delete()
            .eq("id", existingBookmark.id);

        if (error) {
            console.error("Unbookmark error:", error);
            return { error: "取消收藏失败" };
        }

        revalidatePath(`/posts/${postId}`);
        return { bookmarked: false };
    } else {
        // 收藏
        const { error } = await supabase
            .from("bookmarks")
            .insert({
                user_id: user.id,
                post_id: postId,
            });

        if (error) {
            console.error("Bookmark error:", error);
            return { error: "收藏失败" };
        }

        revalidatePath(`/posts/${postId}`);
        return { bookmarked: true };
    }
}

// 记录转发
export async function createShareRecord(postId: string, shareType: "copy_link" | "repost" = "copy_link") {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        // 未登录也可以复制链接，只是不记录
        return { success: true };
    }

    const { error } = await supabase
        .from("shares")
        .insert({
            user_id: user.id,
            post_id: postId,
            share_type: shareType,
        });

    if (error) {
        console.error("Share record error:", error);
        // 转发记录失败不影响用户体验
    }

    return { success: true };
}

// 创建评论
export async function createComment(data: {
    postId: string;
    parentId?: string | null;
    content: object;
}) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { error: "请先登录" };
    }

    const { data: comment, error } = await supabase
        .from("comments")
        .insert({
            post_id: data.postId,
            author_id: user.id,
            parent_id: data.parentId || null,
            content: data.content,
        })
        .select(`
            *,
            author:profiles!author_id (
                id,
                username,
                full_name,
                avatar_url
            )
        `)
        .single();

    if (error) {
        console.error("Create comment error:", error);
        return { error: "发表评论失败" };
    }

    revalidatePath(`/posts/${data.postId}`);
    return { data: comment };
}

// 删除评论
export async function deleteComment(commentId: string, postId: string) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { error: "请先登录" };
    }

    // 先获取评论内容，用于提取图片 URL
    const { data: comment } = await supabase
        .from("comments")
        .select("author_id, content")
        .eq("id", commentId)
        .single();

    if (!comment) {
        return { error: "评论不存在" };
    }

    if (comment.author_id !== user.id) {
        return { error: "无权删除此评论" };
    }

    // 提取评论中的所有图片 URL
    const imageUrls = extractImageUrls(comment.content as JSONContentNode);

    const { error } = await supabase
        .from("comments")
        .delete()
        .eq("id", commentId);

    if (error) {
        console.error("Delete comment error:", error);
        return { error: "删除评论失败" };
    }

    // 清理评论中的所有图片（异步执行，不阻塞响应）
    if (imageUrls.length > 0) {
        console.log(`[deleteComment] 正在清理评论中的 ${imageUrls.length} 个图片...`);
        deleteImages(imageUrls).catch((err) => {
            console.error("[deleteComment] 清理图片失败:", err);
        });
    }

    revalidatePath(`/posts/${postId}`);
    return { success: true };
}

// 获取当前用户对帖子的互动状态
export async function getPostInteractionStatus(postId: string) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { isLiked: false, isBookmarked: false };
    }

    const [likeResult, bookmarkResult] = await Promise.all([
        supabase
            .from("likes")
            .select("id")
            .eq("user_id", user.id)
            .eq("post_id", postId)
            .single(),
        supabase
            .from("bookmarks")
            .select("id")
            .eq("user_id", user.id)
            .eq("post_id", postId)
            .single(),
    ]);

    return {
        isLiked: !!likeResult.data,
        isBookmarked: !!bookmarkResult.data,
    };
}

// 获取当前用户对评论的点赞状态
export async function getCommentLikeStatus(commentIds: string[]) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user || commentIds.length === 0) {
        return {};
    }

    const { data: likes } = await supabase
        .from("likes")
        .select("comment_id")
        .eq("user_id", user.id)
        .in("comment_id", commentIds);

    const likedComments: Record<string, boolean> = {};
    (likes || []).forEach((like) => {
        if (like.comment_id) {
            likedComments[like.comment_id] = true;
        }
    });

    return likedComments;
}

// 删除帖子（仅作者可删除）
export async function deletePost(postId: string) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { error: "请先登录" };
    }

    // 验证是否为帖子作者并获取内容
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

    // 删除帖子（相关的评论、点赞等会通过 CASCADE 自动删除）
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
