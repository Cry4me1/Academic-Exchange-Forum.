import { Resend } from "resend";

// 初始化 Resend 客户端
// 需要在 .env.local 中设置 RESEND_API_KEY
const resend = new Resend(process.env.RESEND_API_KEY);

interface SendReportEmailParams {
    reporterEmail: string;
    reporterUsername: string;
    targetType: "post" | "comment" | "user";
    targetId: string;
    targetTitle?: string;
    reason: string;
    details?: string;
}

export async function sendReportEmail(params: SendReportEmailParams) {
    const {
        reporterEmail,
        reporterUsername,
        targetType,
        targetId,
        targetTitle,
        reason,
        details,
    } = params;

    const typeLabel = targetType === "post" ? "帖子" : targetType === "comment" ? "评论" : "用户";

    const emailContent = `
        <h2>Scholarly 举报通知</h2>
        <hr />
        <p><strong>举报类型:</strong> ${typeLabel}</p>
        <p><strong>目标ID:</strong> ${targetId}</p>
        ${targetTitle ? `<p><strong>标题:</strong> ${targetTitle}</p>` : ""}
        <p><strong>举报原因:</strong> ${reason}</p>
        ${details ? `<p><strong>详细说明:</strong> ${details}</p>` : ""}
        <hr />
        <p><strong>举报人:</strong> ${reporterUsername} (${reporterEmail})</p>
        <p><strong>举报时间:</strong> ${new Date().toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" })}</p>
        <hr />
        <p style="color: #666; font-size: 12px;">此邮件由 Scholarly 学术论坛系统自动发送</p>
    `;

    try {
        const { data, error } = await resend.emails.send({
            from: "Scholarly 举报系统 <noreply@scholarly.app>", // 需要配置已验证的发送域名
            to: ["ddanthumytrang@gmail.com"],
            subject: `[Scholarly 举报] ${typeLabel}举报 - ${reason}`,
            html: emailContent,
        });

        if (error) {
            console.error("Failed to send report email:", error);
            return { success: false, error: error.message };
        }

        console.log("Report email sent successfully:", data?.id);
        return { success: true, emailId: data?.id };
    } catch (error) {
        console.error("Error sending report email:", error);
        return { success: false, error: "发送邮件失败" };
    }
}
