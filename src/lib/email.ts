import { Resend } from "resend";
import { extractPlainTextFromContent, extractImageUrls } from "@/lib/moderation/utils";

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
            from: "Scholarly 举报系统 <onboarding@resend.dev>", // 使用 Resend 测试域名
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

export interface SendPendingReviewEmailParams {
    postId: string;
    title: string;
    content: any;
    tags?: string[];
    author: {
        id: string;
        username?: string;
        fullName?: string;
        email?: string;
    };
    moderation: {
        score: number;
        riskLevel: string;
        reason: string;
        suggestedTags?: string[];
        matchedSensitiveWords?: string[];
        latencyMs?: number;
    };
}

/**
 * 当帖子进入待人工审核区时，向管理员发送详细审核通知邮件
 */
export async function sendPendingReviewEmail(params: SendPendingReviewEmailParams) {
    const { postId, title, content, tags = [], author, moderation } = params;

    const plainTextContent = extractPlainTextFromContent(content);
    const imageUrls = extractImageUrls(content);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const reviewUrl = `${appUrl}/admin/review`;

    // 风险等级中英文转换与配色
    let riskLevelText = "疑似敏感 / 中风险";
    let riskBadgeColor = "#d97706"; // Amber 600
    let riskBadgeBg = "#fef3c7"; // Amber 100

    if (moderation.riskLevel === "dangerous") {
        riskLevelText = "高危风险 / 违规";
        riskBadgeColor = "#dc2626";
        riskBadgeBg = "#fee2e2";
    } else if (moderation.riskLevel === "safe") {
        riskLevelText = "安全 / 低风险";
        riskBadgeColor = "#16a34a";
        riskBadgeBg = "#dcfce7";
    }

    const scoreColor = moderation.score >= 80 ? "#16a34a" : moderation.score >= 60 ? "#d97706" : "#dc2626";
    const authorDisplayName = author.fullName || author.username || "匿名用户";
    const nowTime = new Date().toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" });

    const emailHtml = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Scholarly 待人工审核通知</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1e293b; background-color: #f8fafc; margin: 0; padding: 24px 12px; }
    .container { max-width: 680px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
    .header { background: #0f172a; padding: 24px; color: #ffffff; }
    .header-badge { display: inline-block; background: #ea580c; color: #ffffff; font-size: 12px; font-weight: 600; padding: 3px 10px; border-radius: 9999px; text-transform: uppercase; margin-bottom: 8px; }
    .header h1 { margin: 0; font-size: 20px; font-weight: 700; color: #ffffff; letter-spacing: -0.025em; }
    .content { padding: 24px; }
    .section { margin-bottom: 24px; }
    .section-title { font-size: 14px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 12px; border-bottom: 1px solid #f1f5f9; padding-bottom: 6px; }
    .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 12px; }
    .grid-2 { display: table; width: 100%; table-layout: fixed; }
    .grid-col { display: table-cell; width: 50%; vertical-align: top; padding-right: 8px; }
    .stat-label { font-size: 12px; color: #64748b; margin-bottom: 4px; }
    .stat-value { font-size: 18px; font-weight: 700; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 600; }
    .tag { display: inline-block; background: #e0e7ff; color: #3730a3; padding: 2px 8px; border-radius: 4px; font-size: 12px; margin-right: 6px; margin-bottom: 4px; }
    .sensitive-word { display: inline-block; background: #fee2e2; color: #991b1b; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 600; margin-right: 6px; margin-bottom: 4px; }
    .reason-box { background: #fffbeb; border-left: 4px solid #f59e0b; padding: 12px 16px; border-radius: 4px; font-size: 14px; color: #92400e; line-height: 1.5; margin-top: 8px; }
    .post-body { background: #ffffff; border: 1px solid #cbd5e1; border-radius: 6px; padding: 14px; font-size: 13px; color: #334155; max-height: 300px; overflow-y: auto; white-space: pre-wrap; word-break: break-word; font-family: Consolas, Monaco, monospace; line-height: 1.5; }
    .btn-container { text-align: center; margin-top: 28px; margin-bottom: 12px; }
    .btn { display: inline-block; background: #2563eb; color: #ffffff !important; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 600; font-size: 14px; box-shadow: 0 2px 4px rgba(37, 99, 235, 0.2); }
    .footer { background: #f1f5f9; padding: 16px 24px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="header-badge">人工审核工单</div>
      <h1>Scholarly 论坛内容待审核通知</h1>
    </div>

    <div class="content">
      <!-- 帖子基本信息 -->
      <div class="section">
        <div class="section-title">📄 帖子概览</div>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr>
            <td style="width: 90px; color: #64748b; padding: 4px 0;"><strong>帖子标题:</strong></td>
            <td style="color: #0f172a; font-weight: 600; padding: 4px 0;">${title}</td>
          </tr>
          <tr>
            <td style="color: #64748b; padding: 4px 0;"><strong>帖子 ID:</strong></td>
            <td style="color: #475569; font-family: monospace; font-size: 13px; padding: 4px 0;">${postId}</td>
          </tr>
          <tr>
            <td style="color: #64748b; padding: 4px 0;"><strong>作者信息:</strong></td>
            <td style="color: #334155; padding: 4px 0;">${authorDisplayName} ${author.email ? `&lt;${author.email}&gt;` : ""} (ID: ${author.id})</td>
          </tr>
          <tr>
            <td style="color: #64748b; padding: 4px 0;"><strong>提交时间:</strong></td>
            <td style="color: #334155; padding: 4px 0;">${nowTime}</td>
          </tr>
          ${tags && tags.length > 0 ? `
          <tr>
            <td style="color: #64748b; padding: 4px 0;"><strong>原始标签:</strong></td>
            <td style="padding: 4px 0;">
              ${tags.map(t => `<span class="tag">${t}</span>`).join("")}
            </td>
          </tr>
          ` : ""}
        </table>
      </div>

      <!-- AI 审核评分与评估依据 -->
      <div class="section">
        <div class="section-title">🤖 AI 审核评分与依据数据</div>
        <div class="card">
          <div class="grid-2">
            <div class="grid-col">
              <div class="stat-label">AI 安全健康评分</div>
              <div class="stat-value" style="color: ${scoreColor};">${moderation.score} <span style="font-size: 13px; font-weight: normal; color: #64748b;">/ 100 分</span></div>
            </div>
            <div class="grid-col">
              <div class="stat-label">风险等级评定</div>
              <span class="badge" style="background-color: ${riskBadgeBg}; color: ${riskBadgeColor};">${riskLevelText} (${moderation.riskLevel})</span>
            </div>
          </div>

          <div style="margin-top: 14px;">
            <div class="stat-label"><strong>AI 审核判定依据 / 理由：</strong></div>
            <div class="reason-box">
              ${moderation.reason || "系统检测到需要人工二次复核的内容特征。"}
            </div>
          </div>

          ${moderation.matchedSensitiveWords && moderation.matchedSensitiveWords.length > 0 ? `
          <div style="margin-top: 12px;">
            <div class="stat-label"><strong>触发敏感词：</strong></div>
            <div>
              ${moderation.matchedSensitiveWords.map(w => `<span class="sensitive-word">⚠️ ${w}</span>`).join("")}
            </div>
          </div>
          ` : ""}

          ${moderation.suggestedTags && moderation.suggestedTags.length > 0 ? `
          <div style="margin-top: 12px;">
            <div class="stat-label"><strong>AI 建议标签：</strong></div>
            <div>
              ${moderation.suggestedTags.map(t => `<span class="tag"># ${t}</span>`).join("")}
            </div>
          </div>
          ` : ""}

          ${moderation.latencyMs ? `
          <div style="margin-top: 10px; font-size: 11px; color: #94a3b8;">
            审核耗时：${moderation.latencyMs} ms
          </div>
          ` : ""}
        </div>
      </div>

      <!-- 帖子包含的内容 -->
      <div class="section">
        <div class="section-title">📝 文章包含的内容</div>
        <div class="card" style="padding: 12px;">
          <div style="font-size: 12px; color: #64748b; margin-bottom: 8px;">
            正文文本预览（共 ${plainTextContent.length} 字）:
          </div>
          <div class="post-body">${plainTextContent || "（正文内容为空或仅包含特殊富文本元素）"}</div>

          ${imageUrls && imageUrls.length > 0 ? `
          <div style="margin-top: 14px;">
            <div style="font-size: 12px; color: #64748b; margin-bottom: 6px;">
              <strong>配图列表（共 ${imageUrls.length} 张）:</strong>
            </div>
            <ol style="margin: 0; padding-left: 20px; font-size: 12px; color: #2563eb; word-break: break-all;">
              ${imageUrls.slice(0, 5).map((url, index) => `<li><a href="${url}" target="_blank" style="color: #2563eb;">图片 ${index + 1} 链接</a></li>`).join("")}
              ${imageUrls.length > 5 ? `<li style="color: #64748b;">... 还有 ${imageUrls.length - 5} 张图片</li>` : ""}
            </ol>
          </div>
          ` : ""}
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="btn-container">
        <a href="${reviewUrl}" class="btn" target="_blank">进入后台人工审核</a>
      </div>
    </div>

    <div class="footer">
      <p style="margin: 0;">此邮件由 <strong>Scholarly 学术论坛</strong> 内容安全审核系统自动推送</p>
      <p style="margin: 4px 0 0 0;">接收邮箱: ddanthumytrang@gmail.com</p>
    </div>
  </div>
</body>
</html>
    `;

    try {
        const { data, error } = await resend.emails.send({
            from: "Scholarly 审核中心 <onboarding@resend.dev>",
            to: ["ddanthumytrang@gmail.com"],
            subject: `[待人工审核] 《${title}》(得分:${moderation.score}, 评级:${moderation.riskLevel})`,
            html: emailHtml,
        });

        if (error) {
            console.error("[sendPendingReviewEmail] 发送邮件失败:", error);
            return { success: false, error: error.message };
        }

        console.log("[sendPendingReviewEmail] 待审通知邮件发送成功, ID:", data?.id);
        return { success: true, emailId: data?.id };
    } catch (error) {
        console.error("[sendPendingReviewEmail] 邮件发送异常:", error);
        return { success: false, error: "发送待审通知邮件失败" };
    }
}

