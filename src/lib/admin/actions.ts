"use server";

import { createClient } from "@/lib/supabase/server";
import { logAdminAction } from "./permissions";
import { revalidatePath } from "next/cache";

/**
 * 封禁用户
 */
export async function banUser(userId: string, reason: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("profiles")
    .update({
      is_banned: true,
      banned_at: new Date().toISOString(),
      banned_reason: reason,
    })
    .eq("id", userId);

  if (error) throw new Error(`封禁失败: ${error.message}`);

  await logAdminAction({
    actionType: "user_banned",
    targetType: "user",
    targetId: userId,
    details: { reason },
  });

  await supabase.from("notifications").insert({
    user_id: userId,
    type: "system",
    title: "账号已被封禁",
    content: `您的账号因严重违反社区规范已被永久封禁。封禁期间无法使用任何社区功能。原因：${reason}`,
  });

  revalidatePath("/admin/users");
  return { success: true };
}

/**
 * 解封用户
 */
export async function unbanUser(userId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("profiles")
    .update({
      is_banned: false,
      banned_at: null,
      banned_reason: null,
    })
    .eq("id", userId);

  if (error) throw new Error(`解封失败: ${error.message}`);

  await logAdminAction({
    actionType: "user_unbanned",
    targetType: "user",
    targetId: userId,
  });

  await supabase.from("notifications").insert({
    user_id: userId,
    type: "system",
    title: "账号已解封",
    content: `您的账号封禁已解除，欢迎回到社区。`,
  });

  revalidatePath("/admin/users");
  return { success: true };
}

/**
 * 禁言用户
 */
export async function muteUser(
  userId: string,
  durationHours: number,
  reason: string
) {
  const supabase = await createClient();
  const muteUntil = new Date();
  muteUntil.setHours(muteUntil.getHours() + durationHours);

  const { error } = await supabase
    .from("profiles")
    .update({
      is_muted: true,
      muted_until: muteUntil.toISOString(),
      muted_reason: reason,
    })
    .eq("id", userId);

  if (error) throw new Error(`禁言失败: ${error.message}`);

  await logAdminAction({
    actionType: "user_muted",
    targetType: "user",
    targetId: userId,
    details: { reason, duration_hours: durationHours },
  });

  await supabase.from("notifications").insert({
    user_id: userId,
    type: "system",
    title: "账号已被禁言",
    content: `您的账号因违反社区规范已被禁言 ${durationHours} 小时（至 ${muteUntil.toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" })}）。禁言期间无法发帖和评论。原因：${reason}`,
  });

  revalidatePath("/admin/users");
  return { success: true };
}

/**
 * 解除禁言
 */
export async function unmuteUser(userId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("profiles")
    .update({
      is_muted: false,
      muted_until: null,
      muted_reason: null,
    })
    .eq("id", userId);

  if (error) throw new Error(`解除禁言失败: ${error.message}`);

  await logAdminAction({
    actionType: "user_unmuted",
    targetType: "user",
    targetId: userId,
  });

  await supabase.from("notifications").insert({
    user_id: userId,
    type: "system",
    title: "账号禁言已解除",
    content: `您的账号禁言已解除，现在可以正常发帖和评论了。`,
  });

  revalidatePath("/admin/users");
  return { success: true };
}

/**
 * 隐藏帖子
 */
export async function hidePost(postId: string, reason: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 先获取作者信息和标题
  const { data: post } = await supabase
    .from("posts")
    .select("author_id, title")
    .eq("id", postId)
    .single();

  const { error } = await supabase
    .from("posts")
    .update({
      is_hidden: true,
      hidden_reason: reason,
      hidden_by: user?.id,
    })
    .eq("id", postId);

  if (error) throw new Error(`隐藏帖子失败: ${error.message}`);

  await logAdminAction({
    actionType: "post_hidden",
    targetType: "post",
    targetId: postId,
    details: { reason },
  });

  // 发送通知
  if (post?.author_id) {
    await supabase.from("notifications").insert({
      user_id: post.author_id,
      type: "system",
      title: "帖子被隐藏",
      content: `您的帖子 "${post.title}" 已被管理员隐藏。原因: ${reason}`,
      is_read: false,
    });
  }

  revalidatePath("/admin/posts");
  return { success: true };
}

/**
 * 恢复帖子
 */
export async function unhidePost(postId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("posts")
    .update({
      is_hidden: false,
      hidden_reason: null,
      hidden_by: null,
    })
    .eq("id", postId);

  if (error) throw new Error(`恢复帖子失败: ${error.message}`);

  await logAdminAction({
    actionType: "post_unhidden",
    targetType: "post",
    targetId: postId,
  });

  revalidatePath("/admin/posts");
  return { success: true };
}

/**
 * 置顶/取消置顶帖子
 */
export async function togglePinPost(postId: string, isPinned: boolean) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("posts")
    .update({ is_pinned: isPinned })
    .eq("id", postId);

  if (error) throw new Error(`操作失败: ${error.message}`);

  await logAdminAction({
    actionType: isPinned ? "post_pinned" : "post_unpinned",
    targetType: "post",
    targetId: postId,
  });

  revalidatePath("/admin/posts");
  return { success: true };
}

/**
 * 锁定/解锁评论
 */
export async function toggleLockPost(postId: string, isLocked: boolean) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("posts")
    .update({ is_locked: isLocked })
    .eq("id", postId);

  if (error) throw new Error(`操作失败: ${error.message}`);

  await logAdminAction({
    actionType: isLocked ? "post_locked" : "post_unlocked",
    targetType: "post",
    targetId: postId,
  });

  revalidatePath("/admin/posts");
  return { success: true };
}

/**
 * 调整用户积分
 */
export async function adjustCredits(
  userId: string,
  amount: number,
  reason: string
) {
  const supabase = await createClient();

  // 获取当前余额
  const { data: currentCredits } = await supabase
    .from("user_credits")
    .select("balance")
    .eq("user_id", userId)
    .single();

  if (!currentCredits) throw new Error("用户积分记录不存在");

  const newBalance = currentCredits.balance + amount;
  if (newBalance < 0) throw new Error("余额不能为负数");

  // 更新余额
  const { error: updateError } = await supabase
    .from("user_credits")
    .update({ balance: newBalance, updated_at: new Date().toISOString() })
    .eq("user_id", userId);

  if (updateError) throw new Error(`调整积分失败: ${updateError.message}`);

  // 创建流水记录
  await supabase.from("credit_transactions").insert({
    user_id: userId,
    amount,
    type: "admin_adjustment",
    description: reason,
    metadata: { adjusted_by: "admin" },
  });

  await logAdminAction({
    actionType: "credits_adjusted",
    targetType: "credits",
    targetId: userId,
    details: {
      amount,
      reason,
      old_balance: currentCredits.balance,
      new_balance: newBalance,
    },
  });

  revalidatePath("/admin/users");
  return { success: true, newBalance };
}

/**
 * 处理举报 — 联动执行实际惩罚操作
 */
export async function handleReport(
  reportId: string,
  action: {
    status: "resolved" | "rejected";
    actionTaken: string;
    handlerNote?: string;
  }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 先获取举报详情，用于联动操作
  const { data: report } = await supabase
    .from("reports")
    .select("target_type, target_id, reason, reporter_id")
    .eq("id", reportId)
    .single();

  if (!report) throw new Error("举报记录不存在");

  // 1. 更新举报状态
  const { error } = await supabase
    .from("reports")
    .update({
      status: action.status,
      action_taken: action.actionTaken,
      handler_note: action.handlerNote,
      handled_by: user?.id,
      handled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", reportId);

  if (error) throw new Error(`处理举报失败: ${error.message}`);

  // 2. 如果是"已处理"且有具体措施，执行联动操作
  if (action.status === "resolved" && action.actionTaken !== "none") {
    const actionNote = action.handlerNote || `举报处理: ${report.reason}`;

    try {
      switch (action.actionTaken) {
        case "content_hidden": {
          // 隐藏内容
          const hiddenAuthorId = await getTargetAuthorId(supabase, report.target_type, report.target_id);
          if (report.target_type === "post") {
            await supabase
              .from("posts")
              .update({
                is_hidden: true,
                hidden_reason: actionNote,
                hidden_by: user?.id,
              })
              .eq("id", report.target_id);

            await logAdminAction({
              actionType: "post_hidden",
              targetType: "post",
              targetId: report.target_id,
              details: { reason: actionNote, from_report: reportId },
            });
          } else if (report.target_type === "comment") {
            await supabase
              .from("comments")
              .update({ is_hidden: true })
              .eq("id", report.target_id);

            await logAdminAction({
              actionType: "comment_hidden",
              targetType: "comment",
              targetId: report.target_id,
              details: { reason: actionNote, from_report: reportId },
            });
          }
          // 通知内容作者
          if (hiddenAuthorId) {
            await supabase.from("notifications").insert({
              user_id: hiddenAuthorId,
              type: "system",
              title: "内容已被隐藏",
              content: `您的${report.target_type === "post" ? "帖子" : "评论"}因违反社区规范已被管理员隐藏。原因：${actionNote}`,
            });
          }
          break;
        }

        case "content_deleted": {
          // 删除内容（软删除 = 隐藏 + 标记删除原因）
          const deletedAuthorId = await getTargetAuthorId(supabase, report.target_type, report.target_id);
          if (report.target_type === "post") {
            await supabase
              .from("posts")
              .update({
                is_hidden: true,
                hidden_reason: `[已删除] ${actionNote}`,
                hidden_by: user?.id,
              })
              .eq("id", report.target_id);

            await logAdminAction({
              actionType: "post_deleted",
              targetType: "post",
              targetId: report.target_id,
              details: { reason: actionNote, from_report: reportId },
            });
          } else if (report.target_type === "comment") {
            await supabase
              .from("comments")
              .update({ is_hidden: true })
              .eq("id", report.target_id);

            await logAdminAction({
              actionType: "comment_deleted",
              targetType: "comment",
              targetId: report.target_id,
              details: { reason: actionNote, from_report: reportId },
            });
          }
          // 通知内容作者
          if (deletedAuthorId) {
            await supabase.from("notifications").insert({
              user_id: deletedAuthorId,
              type: "system",
              title: "内容已被删除",
              content: `您的${report.target_type === "post" ? "帖子" : "评论"}因严重违反社区规范已被管理员删除。原因：${actionNote}`,
            });
          }
          break;
        }

        case "warning": {
          // 警告用户 — 查找内容作者并发送通知
          const authorId = await getTargetAuthorId(supabase, report.target_type, report.target_id);
          if (authorId) {
            await supabase.from("notifications").insert({
              user_id: authorId,
              type: "system",
              title: "内容违规警告",
              content: `您的${report.target_type === "post" ? "帖子" : report.target_type === "comment" ? "评论" : "内容"}因「${report.reason}」被举报并经管理员审核，特此警告。请遵守社区规范，否则将受到更严厉的处罚。`,
            });

            await logAdminAction({
              actionType: "user_warned",
              targetType: "user",
              targetId: authorId,
              details: { reason: actionNote, from_report: reportId },
            });
          }
          break;
        }

        case "user_muted": {
          // 禁言用户 — 默认禁言24小时
          const muteTargetId = report.target_type === "user"
            ? report.target_id
            : await getTargetAuthorId(supabase, report.target_type, report.target_id);

          if (muteTargetId) {
            const muteUntil = new Date();
            muteUntil.setHours(muteUntil.getHours() + 24);

            await supabase
              .from("profiles")
              .update({
                is_muted: true,
                muted_until: muteUntil.toISOString(),
                muted_reason: actionNote,
              })
              .eq("id", muteTargetId);

            // 通知被禁言用户
            await supabase.from("notifications").insert({
              user_id: muteTargetId,
              type: "system",
              title: "账号已被禁言",
              content: `您的账号因违反社区规范已被禁言 24 小时（至 ${muteUntil.toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" })}）。禁言期间无法发帖和评论。原因：${actionNote}`,
            });

            await logAdminAction({
              actionType: "user_muted",
              targetType: "user",
              targetId: muteTargetId,
              details: { reason: actionNote, duration_hours: 24, from_report: reportId },
            });
          }
          break;
        }

        case "user_banned": {
          // 封禁用户
          const banTargetId = report.target_type === "user"
            ? report.target_id
            : await getTargetAuthorId(supabase, report.target_type, report.target_id);

          if (banTargetId) {
            await supabase
              .from("profiles")
              .update({
                is_banned: true,
                banned_at: new Date().toISOString(),
                banned_reason: actionNote,
              })
              .eq("id", banTargetId);

            // 通知被封禁用户
            await supabase.from("notifications").insert({
              user_id: banTargetId,
              type: "system",
              title: "账号已被封禁",
              content: `您的账号因严重违反社区规范已被永久封禁。封禁期间无法使用任何社区功能。原因：${actionNote}`,
            });

            await logAdminAction({
              actionType: "user_banned",
              targetType: "user",
              targetId: banTargetId,
              details: { reason: actionNote, from_report: reportId },
            });
          }
          break;
        }
      }
    } catch (actionErr) {
      console.error("Failed to execute report action:", actionErr);
      // 联动操作失败不回滚举报状态变更，但记录错误
      await logAdminAction({
        actionType: "report_action_failed",
        targetType: "report",
        targetId: reportId,
        details: {
          attempted_action: action.actionTaken,
          error: actionErr instanceof Error ? actionErr.message : "unknown",
        },
      });
    }
  }

  // 3. 通知举报人
  if (report.reporter_id) {
    const reportTargetStr = report.target_type === "post" ? "帖子" : report.target_type === "comment" ? "评论" : "用户";
    const statusStr = action.status === "resolved" ? "已处理" : "已被驳回";
    const noteStr = action.handlerNote ? `管理员留言：${action.handlerNote}` : (action.status === "resolved" ? "感谢您维护社区环境！" : "经管理员核实，该内容暂未发现违规。");
    
    await supabase.from("notifications").insert({
      user_id: report.reporter_id,
      type: "system",
      title: `举报处理结果通知`,
      content: `您对某个${reportTargetStr}的举报（原因：${report.reason}）${statusStr}。${noteStr}`,
    });
  }

  // 4. 记录举报处理日志
  await logAdminAction({
    actionType: "report_handled",
    targetType: "report",
    targetId: reportId,
    details: action,
  });

  revalidatePath("/admin/reports");
  revalidatePath("/admin/users");
  revalidatePath("/admin/posts");
  return { success: true };
}

/**
 * 根据举报目标类型和ID，获取内容作者的 user_id
 */
async function getTargetAuthorId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  targetType: string,
  targetId: string
): Promise<string | null> {
  if (targetType === "user") {
    return targetId;
  }
  if (targetType === "post") {
    const { data } = await supabase
      .from("posts")
      .select("author_id")
      .eq("id", targetId)
      .single();
    return data?.author_id ?? null;
  }
  if (targetType === "comment") {
    const { data } = await supabase
      .from("comments")
      .select("author_id")
      .eq("id", targetId)
      .single();
    return data?.author_id ?? null;
  }
  return null;
}

/**
 * 调整用户 VIP 等级
 */
export async function adjustVipLevel(userId: string, newLevel: number) {
  const supabase = await createClient();

  if (newLevel < 1 || newLevel > 6) throw new Error("VIP 等级必须在 1-6 之间");

  const { data: currentProfile } = await supabase
    .from("profiles")
    .select("vip_level")
    .eq("id", userId)
    .single();

  const { error } = await supabase
    .from("profiles")
    .update({ vip_level: newLevel })
    .eq("id", userId);

  if (error) throw new Error(`调整 VIP 等级失败: ${error.message}`);

  await logAdminAction({
    actionType: "vip_level_adjusted",
    targetType: "user",
    targetId: userId,
    details: {
      old_level: currentProfile?.vip_level,
      new_level: newLevel,
    },
  });

  revalidatePath("/admin/users");
  return { success: true };
}

/**
 * 删除用户评论
 */
export async function adminDeleteComment(commentId: string, postId: string) {
  const supabase = await createClient();

  // 获取评论作者信息以便记录日志和发通知
  const { data: comment } = await supabase
    .from("comments")
    .select("author_id, content")
    .eq("id", commentId)
    .single();

  if (!comment) throw new Error("评论不存在");

  const { error } = await supabase
    .from("comments")
    .delete()
    .eq("id", commentId);

  if (error) throw new Error(`删除评论失败: ${error.message}`);

  await logAdminAction({
    actionType: "comment_deleted",
    targetType: "comment",
    targetId: commentId,
  });

  // 发送通知
  if (comment.author_id) {
    await supabase.from("notifications").insert({
      user_id: comment.author_id,
      type: "system",
      title: "评论被删除",
      content: `您的评论由于违反社区规定已被管理员删除。`,
      is_read: false,
    });
  }

  revalidatePath(`/admin/posts/${postId}/comments`);
  revalidatePath(`/posts/${postId}`);
  return { success: true };
}

/**
 * 获取帖子对应的评论列表 (Admin)
 */
export async function getAdminComments(postId: string) {
  const supabase = await createClient();

  const { data: comments, error } = await supabase
    .from("comments")
    .select(`
      id,
      content,
      created_at,
      parent_id,
      like_count,
      author:profiles!author_id(
        id,
        username,
        full_name,
        avatar_url
      )
    `)
    .eq("post_id", postId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Get admin comments error:", error);
    return [];
  }

  return comments;
}
