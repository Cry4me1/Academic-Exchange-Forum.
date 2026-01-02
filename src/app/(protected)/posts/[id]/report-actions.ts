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

    // 尝试发送邮件
    const emailResult = await sendReportEmail({
        reporterEmail,
        reporterUsername,
        targetType: data.type,
        targetId: data.targetId,
        targetTitle: data.targetTitle,
        reason: data.reason,
        details: data.details,
    });

    if (!emailResult.success) {
        console.error("Email sending failed:", emailResult.error);
        // 邮件发送失败也要记录到控制台
    }

    // 记录到控制台（作为备份）
    console.log("=== REPORT SUBMITTED ===");
    console.log(`To: ddanthumytrang@gmail.com`);
    console.log(`Reporter: ${reporterUsername} (${reporterEmail})`);
    console.log(`Type: ${data.type}`);
    console.log(`Target ID: ${data.targetId}`);
    console.log(`Reason: ${data.reason}`);
    console.log(`Email sent: ${emailResult.success}`);
    console.log("========================");

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
