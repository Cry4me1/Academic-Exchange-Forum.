"use server";

import { createClient } from "@/lib/supabase/server";
import { logAdminAction, requireAdmin } from "./permissions";
import { invalidateSensitiveWordsCache } from "@/lib/moderation/sensitive-words";
import { generatePostEmbedding } from "@/lib/post-embed";
import { syncPostLinks } from "@/lib/post-links";
import { revalidatePath } from "next/cache";

/**
 * 获取审核统计看板指标
 */
export async function getReviewStats() {
  await requireAdmin("moderator");
  const supabase = await createClient();

  const [
    pendingPostsRes,
    approvedPostsRes,
    rejectedPostsRes,
    pendingCommentsRes,
    approvedCommentsRes,
    rejectedCommentsRes,
    wordsRes,
  ] = await Promise.all([
    supabase.from("posts").select("id", { count: "exact", head: true }).eq("review_status", "pending"),
    supabase.from("posts").select("id", { count: "exact", head: true }).eq("review_status", "approved"),
    supabase.from("posts").select("id", { count: "exact", head: true }).eq("review_status", "rejected"),
    supabase.from("comments").select("id", { count: "exact", head: true }).eq("review_status", "pending"),
    supabase.from("comments").select("id", { count: "exact", head: true }).eq("review_status", "approved"),
    supabase.from("comments").select("id", { count: "exact", head: true }).eq("review_status", "rejected"),
    supabase.from("sensitive_words").select("id", { count: "exact", head: true }).eq("is_active", true),
  ]);

  return {
    pendingCount: (pendingPostsRes.count || 0) + (pendingCommentsRes.count || 0),
    pendingPostsCount: pendingPostsRes.count || 0,
    pendingCommentsCount: pendingCommentsRes.count || 0,
    approvedCount: (approvedPostsRes.count || 0) + (approvedCommentsRes.count || 0),
    approvedPostsCount: approvedPostsRes.count || 0,
    approvedCommentsCount: approvedCommentsRes.count || 0,
    rejectedCount: (rejectedPostsRes.count || 0) + (rejectedCommentsRes.count || 0),
    rejectedPostsCount: rejectedPostsRes.count || 0,
    rejectedCommentsCount: rejectedCommentsRes.count || 0,
    activeWordsCount: wordsRes.count || 0,
  };
}

/**
 * 获取待审帖子列表
 */
export async function getPendingReviewPosts(options: {
  page?: number;
  pageSize?: number;
  search?: string;
  riskLevel?: string;
} = {}) {
  await requireAdmin("moderator");
  const { page = 1, pageSize = 15, search = "", riskLevel = "" } = options;
  const supabase = await createClient();

  let query = supabase
    .from("posts")
    .select(
      `
      id,
      title,
      content,
      tags,
      author_id,
      review_status,
      ai_score,
      ai_risk_level,
      ai_reason,
      ai_suggested_tags,
      matched_sensitive_words,
      created_at,
      profiles!posts_author_id_fkey (
        id,
        username,
        avatar_url,
        email
      )
    `,
      { count: "exact" }
    )
    .eq("review_status", "pending");

  if (search) {
    query = query.ilike("title", `%${search}%`);
  }

  if (riskLevel && riskLevel !== "all") {
    query = query.eq("ai_risk_level", riskLevel);
  }

  const offset = (page - 1) * pageSize;
  const { data, count, error } = await query
    .order("created_at", { ascending: false })
    .range(offset, offset + pageSize - 1);

  if (error) {
    console.error("[getPendingReviewPosts] Error:", error);
    throw new Error(`获取待审帖子失败: ${error.message}`);
  }

  const posts = (data || []).map((item: any) => ({
    ...item,
    profile: Array.isArray(item.profiles) ? item.profiles[0] : item.profiles,
  }));

  return {
    posts,
    totalCount: count || 0,
    currentPage: page,
    pageSize,
  };
}

/**
 * 管理员人工审核：通过
 */
export async function approvePostReview(postId: string, note: string = "") {
  const admin = await requireAdmin("moderator");
  const supabase = await createClient();

  const { data: post } = await supabase
    .from("posts")
    .select("id, title, author_id, content")
    .eq("id", postId)
    .single();

  if (!post) throw new Error("帖子不存在");

  const { error } = await supabase
    .from("posts")
    .update({
      review_status: "approved",
      is_published: true,
      reviewer_id: admin.id,
      reviewer_note: note || "人工审核通过",
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", postId);

  if (error) throw new Error(`审核操作失败: ${error.message}`);

  // 记录审计日志
  await logAdminAction({
    actionType: "post_review_approved",
    targetType: "post",
    targetId: postId,
    details: { note, author_id: post.author_id },
  });

  // 同步双向链接与向量嵌入
  await syncPostLinks(supabase, post.id, post.content).catch((e) =>
    console.error("Link sync failed:", e)
  );
  await generatePostEmbedding(post.id, supabase).catch((e) =>
    console.error("Embedding generation failed:", e)
  );

  // 向作者推送系统通知
  if (post.author_id) {
    await supabase.from("notifications").insert({
      user_id: post.author_id,
      type: "system",
      title: "帖子审核已通过",
      content: `您的文章《${post.title}》已通过审核并在全站公开展出！${note ? `审核备注：${note}` : ""}`,
    });
  }

  revalidatePath("/admin/review");
  revalidatePath("/admin/posts");
  revalidatePath(`/posts/${postId}`);
  revalidatePath("/dashboard");
  return { success: true };
}

/**
 * 管理员人工审核：驳回/拒绝
 */
export async function rejectPostReview(postId: string, rejectionReason: string) {
  const admin = await requireAdmin("moderator");
  const supabase = await createClient();

  if (!rejectionReason.trim()) {
    throw new Error("请填写驳回原因");
  }

  const { data: post } = await supabase
    .from("posts")
    .select("id, title, author_id")
    .eq("id", postId)
    .single();

  if (!post) throw new Error("帖子不存在");

  const { error } = await supabase
    .from("posts")
    .update({
      review_status: "rejected",
      is_published: false,
      reviewer_id: admin.id,
      reviewer_note: rejectionReason,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", postId);

  if (error) throw new Error(`驳回失败: ${error.message}`);

  // 记录操作日志
  await logAdminAction({
    actionType: "post_review_rejected",
    targetType: "post",
    targetId: postId,
    details: { reason: rejectionReason, author_id: post.author_id },
  });

  // 向作者推送驳回通知
  if (post.author_id) {
    await supabase.from("notifications").insert({
      user_id: post.author_id,
      type: "system",
      title: "帖子审核未通过",
      content: `很抱歉，您的文章《${post.title}》未通过平台安全审核。驳回原因：${rejectionReason}。您可以在个人中心进行修改后重新提交。`,
    });
  }

  revalidatePath("/admin/review");
  revalidatePath("/admin/posts");
  revalidatePath(`/posts/${postId}`);
  return { success: true };
}

/**
 * 获取待审评论列表
 */
export async function getPendingReviewComments(options: {
  page?: number;
  pageSize?: number;
  search?: string;
  riskLevel?: string;
} = {}) {
  await requireAdmin("moderator");
  const { page = 1, pageSize = 15, search = "", riskLevel = "" } = options;
  const supabase = await createClient();

  let query = supabase
    .from("comments")
    .select(
      `
      id,
      post_id,
      parent_id,
      content,
      author_id,
      review_status,
      ai_score,
      ai_risk_level,
      ai_reason,
      matched_sensitive_words,
      created_at,
      post:posts!post_id (
        id,
        title
      ),
      profile:profiles!author_id (
        id,
        username,
        avatar_url,
        email
      )
    `,
      { count: "exact" }
    )
    .eq("review_status", "pending");

  if (riskLevel && riskLevel !== "all") {
    query = query.eq("ai_risk_level", riskLevel);
  }

  const offset = (page - 1) * pageSize;
  const { data, count, error } = await query
    .order("created_at", { ascending: false })
    .range(offset, offset + pageSize - 1);

  if (error) {
    console.error("[getPendingReviewComments] Error:", error);
    throw new Error(`获取待审评论失败: ${error.message}`);
  }

  const comments = (data || []).map((item: any) => ({
    ...item,
    post: Array.isArray(item.post) ? item.post[0] || null : item.post,
    profile: Array.isArray(item.profile) ? item.profile[0] || null : item.profile,
  }));

  // 如果有搜索关键词，在内存中简单根据评论纯文本或帖子标题过滤
  let filteredComments = comments;
  if (search.trim()) {
    const s = search.trim().toLowerCase();
    filteredComments = comments.filter((c: any) => {
      const postTitle = (c.post?.title || "").toLowerCase();
      const contentStr = JSON.stringify(c.content || "").toLowerCase();
      return postTitle.includes(s) || contentStr.includes(s);
    });
  }

  return {
    comments: filteredComments,
    totalCount: count || 0,
    currentPage: page,
    pageSize,
  };
}

/**
 * 管理员人工审核评论：通过
 */
export async function approveCommentReview(commentId: string, note: string = "") {
  const admin = await requireAdmin("moderator");
  const supabase = await createClient();

  const { data: comment } = await supabase
    .from("comments")
    .select("id, post_id, author_id, post:posts!post_id(id, title)")
    .eq("id", commentId)
    .single();

  if (!comment) throw new Error("评论不存在");

  const { error } = await supabase
    .from("comments")
    .update({
      review_status: "approved",
      reviewer_id: admin.id,
      reviewer_note: note || "人工审核通过",
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", commentId);

  if (error) throw new Error(`审核操作失败: ${error.message}`);

  // 记录审计日志
  await logAdminAction({
    actionType: "comment_review_approved",
    targetType: "comment",
    targetId: commentId,
    details: { note, author_id: comment.author_id, post_id: comment.post_id },
  });

  // 向评论作者推送系统通知
  if (comment.author_id) {
    const postTitle = (comment.post as any)?.title || "学术文章";
    await supabase.from("notifications").insert({
      user_id: comment.author_id,
      type: "system",
      title: "评论审核已通过",
      content: `您在文章《${postTitle}》下的评论已通过审核并公开展出！${note ? `审核备注：${note}` : ""}`,
    });
  }

  revalidatePath("/admin/review");
  revalidatePath(`/admin/posts/${comment.post_id}/comments`);
  revalidatePath(`/posts/${comment.post_id}`);
  return { success: true };
}

/**
 * 管理员人工审核评论：驳回/拒绝
 */
export async function rejectCommentReview(commentId: string, rejectionReason: string) {
  const admin = await requireAdmin("moderator");
  const supabase = await createClient();

  if (!rejectionReason.trim()) {
    throw new Error("请填写驳回原因");
  }

  const { data: comment } = await supabase
    .from("comments")
    .select("id, post_id, author_id, post:posts!post_id(id, title)")
    .eq("id", commentId)
    .single();

  if (!comment) throw new Error("评论不存在");

  const { error } = await supabase
    .from("comments")
    .update({
      review_status: "rejected",
      reviewer_id: admin.id,
      reviewer_note: rejectionReason,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", commentId);

  if (error) throw new Error(`驳回失败: ${error.message}`);

  // 记录操作日志
  await logAdminAction({
    actionType: "comment_review_rejected",
    targetType: "comment",
    targetId: commentId,
    details: { reason: rejectionReason, author_id: comment.author_id, post_id: comment.post_id },
  });

  // 向评论作者推送驳回通知
  if (comment.author_id) {
    const postTitle = (comment.post as any)?.title || "学术文章";
    await supabase.from("notifications").insert({
      user_id: comment.author_id,
      type: "system",
      title: "评论审核未通过",
      content: `很抱歉，您在文章《${postTitle}》下的评论未通过安全审核。驳回原因：${rejectionReason}。`,
    });
  }

  revalidatePath("/admin/review");
  revalidatePath(`/admin/posts/${comment.post_id}/comments`);
  revalidatePath(`/posts/${comment.post_id}`);
  return { success: true };
}

/**
 * 获取审核审计日志列表
 */
export async function getModerationLogsList(options: {
  page?: number;
  pageSize?: number;
  riskLevel?: string;
  action?: string;
} = {}) {
  await requireAdmin("moderator");
  const { page = 1, pageSize = 20, riskLevel = "", action = "" } = options;
  const supabase = await createClient();

  let query = supabase
    .from("content_moderation_logs")
    .select(
      `
      id,
      post_id,
      author_id,
      content_hash,
      model_name,
      score,
      risk_level,
      reason,
      detected_tags,
      matched_sensitive_words,
      final_action,
      cost_tokens,
      latency_ms,
      is_cached,
      created_at,
      post:posts!content_moderation_logs_post_id_fkey(title),
      profile:profiles!content_moderation_logs_author_id_fkey(username, avatar_url)
    `,
      { count: "exact" }
    );

  if (riskLevel && riskLevel !== "all") {
    query = query.eq("risk_level", riskLevel);
  }

  if (action && action !== "all") {
    query = query.eq("final_action", action);
  }

  const offset = (page - 1) * pageSize;
  const { data, count, error } = await query
    .order("created_at", { ascending: false })
    .range(offset, offset + pageSize - 1);

  if (error) {
    console.error("[getModerationLogsList] Error:", error);
    throw new Error(`获取审核日志失败: ${error.message}`);
  }

  const formattedLogs = (data || []).map((item: any) => ({
    ...item,
    post: Array.isArray(item.post) ? item.post[0] || null : item.post,
    profile: Array.isArray(item.profile) ? item.profile[0] || null : item.profile,
  }));

  return {
    logs: formattedLogs,
    totalCount: count || 0,
    currentPage: page,
    pageSize,
  };
}

/**
 * 敏感词管理：获取列表
 */
export async function getSensitiveWordsList(options: {
  search?: string;
  category?: string;
  matchLevel?: string;
} = {}) {
  await requireAdmin("moderator");
  const { search = "", category = "", matchLevel = "" } = options;
  const supabase = await createClient();

  let query = supabase
    .from("sensitive_words")
    .select("*")
    .order("created_at", { ascending: false });

  if (search) {
    query = query.ilike("word", `%${search}%`);
  }

  if (category && category !== "all") {
    query = query.eq("category", category);
  }

  if (matchLevel && matchLevel !== "all") {
    query = query.eq("match_level", matchLevel);
  }

  const { data, error } = await query;
  if (error) throw new Error(`获取敏感词库失败: ${error.message}`);

  return data || [];
}

/**
 * 敏感词管理：添加单个
 */
export async function addSensitiveWord(
  word: string,
  category: string = "general",
  match_level: "pending" | "block" = "pending"
) {
  const admin = await requireAdmin("admin");
  const supabase = await createClient();

  const trimmed = word.trim();
  if (!trimmed) throw new Error("敏感词不能为空");

  const { error } = await supabase.from("sensitive_words").insert({
    word: trimmed,
    category,
    match_level,
    created_by: admin.id,
  });

  if (error) {
    if (error.code === "23505") {
      throw new Error("该敏感词已存在于词库中");
    }
    throw new Error(`添加失败: ${error.message}`);
  }

  invalidateSensitiveWordsCache();
  await logAdminAction({
    actionType: "sensitive_word_added",
    targetType: "sensitive_words",
    details: { word: trimmed, category, match_level },
  });

  revalidatePath("/admin/sensitive-words");
  return { success: true };
}

/**
 * 敏感词管理：批量添加
 */
export async function batchAddSensitiveWords(
  rawText: string,
  category: string = "general",
  match_level: "pending" | "block" = "pending"
) {
  const admin = await requireAdmin("admin");
  const supabase = await createClient();

  const words = rawText
    .split(/[\n,，]+/)
    .map((w) => w.trim())
    .filter((w) => w.length > 0);

  if (words.length === 0) throw new Error("请输入有效的敏感词列表");

  const records = words.map((w) => ({
    word: w,
    category,
    match_level,
    created_by: admin.id,
  }));

  const { error } = await supabase
    .from("sensitive_words")
    .upsert(records, { onConflict: "word" });

  if (error) throw new Error(`批量添加失败: ${error.message}`);

  invalidateSensitiveWordsCache();
  await logAdminAction({
    actionType: "sensitive_words_batch_added",
    targetType: "sensitive_words",
    details: { count: words.length, category, match_level },
  });

  revalidatePath("/admin/sensitive-words");
  return { success: true, count: words.length };
}

/**
 * 敏感词管理：切换启用状态
 */
export async function toggleSensitiveWordActive(id: string, isActive: boolean) {
  await requireAdmin("admin");
  const supabase = await createClient();

  const { error } = await supabase
    .from("sensitive_words")
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw new Error(`操作失败: ${error.message}`);

  invalidateSensitiveWordsCache();
  revalidatePath("/admin/sensitive-words");
  return { success: true };
}

/**
 * 敏感词管理：删除
 */
export async function deleteSensitiveWord(id: string) {
  await requireAdmin("admin");
  const supabase = await createClient();

  const { error } = await supabase
    .from("sensitive_words")
    .delete()
    .eq("id", id);

  if (error) throw new Error(`删除失败: ${error.message}`);

  invalidateSensitiveWordsCache();
  revalidatePath("/admin/sensitive-words");
  return { success: true };
}
