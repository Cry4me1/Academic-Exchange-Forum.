"use server";

import { createClient } from "@/lib/supabase/server";
import { sendReportEmail } from "@/lib/email";

interface ReportData {
    type: "post" | "comment" | "user";
    targetId: string;
    targetTitle?: string;
    reason: string;
    details?: string;
}

export async function submitReport(data: ReportData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: "请先登录" };
    }

    // 获取举报者信息
    const { data: reporter } = await supabase
        .from("profiles")
        .select("username, email")
        .eq("id", user.id)
        .single();

    const reporterEmail = reporter?.email || user.email || "unknown@email.com";
    const reporterUsername = reporter?.username || "未知用户";

    // 构建内容快照（防止内容被删后无法审核）
    let contentSnapshot: Record<string, unknown> = {
        targetType: data.type,
        targetId: data.targetId,
        targetTitle: data.targetTitle,
    };

    try {
        if (data.type === "post") {
            const { data: post } = await supabase
                .from("posts")
                .select("id, title, content, author_id, tags, created_at, profiles!posts_author_id_fkey(full_name, username)")
                .eq("id", data.targetId)
                .single();
            if (post) {
                contentSnapshot = {
                    ...contentSnapshot,
                    post_title: post.title,
                    post_content: typeof post.content === 'string'
                        ? post.content.substring(0, 500) // 截取前500字符
                        : post.content,
                    post_author_id: post.author_id,
                    post_author: post.profiles,
                    post_tags: post.tags,
                    post_created_at: post.created_at,
                };
            }
        } else if (data.type === "comment") {
            const { data: comment } = await supabase
                .from("comments")
                .select("id, content, author_id, post_id, created_at, profiles!comments_author_id_fkey(full_name, username)")
                .eq("id", data.targetId)
                .single();
            if (comment) {
                contentSnapshot = {
                    ...contentSnapshot,
                    comment_content: typeof comment.content === 'string'
                        ? comment.content.substring(0, 500)
                        : comment.content,
                    comment_author_id: comment.author_id,
                    comment_author: comment.profiles,
                    comment_post_id: comment.post_id,
                    comment_created_at: comment.created_at,
                };
            }
        } else if (data.type === "user") {
            const { data: targetUser } = await supabase
                .from("profiles")
                .select("id, full_name, username, avatar_url, email")
                .eq("id", data.targetId)
                .single();
            if (targetUser) {
                contentSnapshot = {
                    ...contentSnapshot,
                    user_full_name: targetUser.full_name,
                    user_username: targetUser.username,
                    user_avatar_url: targetUser.avatar_url,
                };
            }
        }
    } catch {
        // 快照获取失败不影响举报提交
        console.warn("Failed to build content snapshot for report");
    }

    // 1. 写入 reports 表
    const { error: dbError } = await supabase.from("reports").insert({
        reporter_id: user.id,
        target_type: data.type,
        target_id: data.targetId,
        reason: data.reason,
        details: data.details || null,
        status: "pending",
        content_snapshot: contentSnapshot,
    });

    if (dbError) {
        console.error("Failed to insert report:", dbError);
        return { error: "举报提交失败，请稍后重试" };
    }

    // 2. 同时发送邮件通知（失败不影响举报提交）
    try {
        await sendReportEmail({
            reporterEmail,
            reporterUsername,
            targetType: data.type,
            targetId: data.targetId,
            targetTitle: data.targetTitle,
            reason: data.reason,
            details: data.details,
        });
    } catch (emailErr) {
        console.error("Report email sending failed:", emailErr);
        // 邮件发送失败不影响举报记录的持久化
    }

    return { success: true };
}

export async function getReportReasons() {
    return [
        { value: "spam", label: "垃圾信息/广告" },
        { value: "inappropriate", label: "不当内容" },
        { value: "harassment", label: "骚扰/攻击性言论" },
        { value: "misinformation", label: "虚假信息" },
        { value: "copyright", label: "侵犯版权" },
        { value: "other", label: "其他" },
    ];
}
