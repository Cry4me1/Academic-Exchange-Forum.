import crypto from "crypto";
import { createClient } from "@/lib/supabase/server";
import { reviewContentWithAI } from "./ai-moderator";
import { auditPostImages } from "./image-moderator";
import { scanSensitiveWords } from "./sensitive-words";
import { FinalAction, ModerationResult, RiskLevel, ReviewStatus } from "./types";
import { extractPlainTextFromContent, extractImageUrls } from "./utils";

export { extractPlainTextFromContent, extractImageUrls };

/**
 * 计算文本内容的 SHA-256 哈希
 */
export function calculateContentHash(title: string, contentText: string): string {
  const normalized = `${title.trim()}\n---\n${contentText.trim()}`;
  return crypto.createHash("sha256").update(normalized).digest("hex");
}

/**
 * 内容安全审核核心调度引擎
 */
export async function moderatePostContent(params: {
  postId?: string;
  authorId: string;
  title: string;
  content: any;
  tags?: string[];
}): Promise<ModerationResult> {
  const { postId, authorId, title, content, tags = [] } = params;
  const startTime = Date.now();
  const contentText = extractPlainTextFromContent(content);
  const fullText = `${title}\n${contentText}`;
  const contentHash = calculateContentHash(title, contentText);
  const supabase = await createClient();

  // ==========================================
  // Layer 1: 敏感词库快速过滤
  // ==========================================
  const sensitiveScan = await scanSensitiveWords(fullText);

  // 命中 block 级违规词 -> 直接拦截
  if (sensitiveScan.hasBlock) {
    const reason = `内容包含平台禁止的违规关键词（如：${sensitiveScan.matchedBlockWords.slice(0, 3).join("、")}）`;
    const latencyMs = Date.now() - startTime;

    const result: ModerationResult = {
      reviewStatus: "rejected",
      riskLevel: "dangerous",
      score: 10,
      reason,
      suggestedTags: tags,
      matchedSensitiveWords: sensitiveScan.allMatchedWords,
      finalAction: "auto_rejected",
      isCached: false,
      latencyMs,
      canPublish: false,
      errorMessage: `发布失败：${reason}，请修改后重新提交。`,
    };

    await logModerationRecord(supabase, {
      postId,
      authorId,
      contentHash,
      result,
      modelName: "sensitive-keyword-rule",
    });

    return result;
  }

  // 命中 pending 级敏感词 -> 直接进入人工待审
  if (sensitiveScan.hasPending) {
    const reason = `内容触发平台敏感词关注机制（如：${sensitiveScan.matchedPendingWords.slice(0, 3).join("、")}），已自动转入人工审核队列`;
    const latencyMs = Date.now() - startTime;

    const result: ModerationResult = {
      reviewStatus: "pending",
      riskLevel: "sensitive",
      score: 65,
      reason,
      suggestedTags: tags,
      matchedSensitiveWords: sensitiveScan.allMatchedWords,
      finalAction: "auto_pending",
      isCached: false,
      latencyMs,
      canPublish: false,
      errorMessage: "帖子已提交进入人工待审队列",
    };

    await logModerationRecord(supabase, {
      postId,
      authorId,
      contentHash,
      result,
      modelName: "sensitive-keyword-rule",
    });

    return result;
  }

  // ==========================================
  // Layer 2: 图片内容安全审核 (Baidu AI Image Censor)
  // ==========================================
  const imageUrls = extractImageUrls(content);
  if (imageUrls.length > 0) {
    try {
      const imageAudit = await auditPostImages(imageUrls);

      // 图片存在严重违规（色情/暴恐/违禁）
      if (imageAudit.hasDangerous) {
        const reason = imageAudit.reasons[0] || "文章配图中包含严重违规内容";
        const latencyMs = Date.now() - startTime;

        const result: ModerationResult = {
          reviewStatus: "rejected",
          riskLevel: "dangerous",
          score: 20,
          reason,
          suggestedTags: tags,
          matchedSensitiveWords: [],
          finalAction: "auto_rejected",
          isCached: false,
          latencyMs,
          canPublish: false,
          errorMessage: `发布失败：${reason}，请更换配图后重新发布。`,
        };

        await logModerationRecord(supabase, {
          postId,
          authorId,
          contentHash,
          result,
          modelName: "baidu-image-censor",
        });

        return result;
      }

      // 图片疑似敏感
      if (imageAudit.hasSensitive) {
        const reason = imageAudit.reasons[0] || "文章配图疑似存在违规风险，转入人工审核";
        const latencyMs = Date.now() - startTime;

        const result: ModerationResult = {
          reviewStatus: "pending",
          riskLevel: "sensitive",
          score: 60,
          reason,
          suggestedTags: tags,
          matchedSensitiveWords: [],
          finalAction: "auto_pending",
          isCached: false,
          latencyMs,
          canPublish: false,
          errorMessage: "帖子配图疑似敏感，已提交人工审核",
        };

        await logModerationRecord(supabase, {
          postId,
          authorId,
          contentHash,
          result,
          modelName: "baidu-image-censor",
        });

        return result;
      }
    } catch (imgErr) {
      console.warn("[ModerationEngine] 图像审核发生异常，继续执行文本审核:", imgErr);
    }
  }

  // ==========================================
  // Layer 3: 审核结果缓存预检 (SHA-256)
  // ==========================================
  try {
    const { data: cached } = await supabase
      .from("content_moderation_cache")
      .select("score, risk_level, reason, tags, expires_at")
      .eq("content_hash", contentHash)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (cached) {
      const latencyMs = Date.now() - startTime;
      const score = cached.score;
      const riskLevel = cached.risk_level as RiskLevel;
      const decision = makeDecision(score, riskLevel);

      const result: ModerationResult = {
        reviewStatus: decision.reviewStatus,
        riskLevel,
        score,
        reason: `${cached.reason} (缓存复用)`,
        suggestedTags: cached.tags || tags,
        matchedSensitiveWords: [],
        finalAction: decision.finalAction,
        isCached: true,
        latencyMs,
        canPublish: decision.canPublish,
        errorMessage: decision.errorMessage,
      };

      await logModerationRecord(supabase, {
        postId,
        authorId,
        contentHash,
        result,
        modelName: "cache-hit",
      });

      return result;
    }
  } catch (cacheErr) {
    console.warn("[ModerationEngine] 检查缓存异常，继续调用 AI 初审:", cacheErr);
  }

  // ==========================================
  // Layer 3: DeepSeek AI 结构化初审
  // ==========================================
  const { output: aiOutput, costTokens, latencyMs: aiLatency } = await reviewContentWithAI(
    title,
    contentText,
    tags
  );

  const totalLatencyMs = Date.now() - startTime;
  const decision = makeDecision(aiOutput.score, aiOutput.riskLevel);

  const result: ModerationResult = {
    reviewStatus: decision.reviewStatus,
    riskLevel: aiOutput.riskLevel,
    score: aiOutput.score,
    reason: aiOutput.reason,
    suggestedTags: aiOutput.tags && aiOutput.tags.length > 0 ? aiOutput.tags : tags,
    matchedSensitiveWords: [],
    finalAction: decision.finalAction,
    isCached: false,
    latencyMs: totalLatencyMs,
    costTokens,
    canPublish: decision.canPublish,
    errorMessage: decision.errorMessage,
  };

  // 异步将有效结果写入缓存（保留 7 天）
  writeModerationCache(supabase, contentHash, aiOutput).catch((e) =>
    console.error("[ModerationEngine] 写入审核缓存失败:", e)
  );

  // 记录详细审计日志
  await logModerationRecord(supabase, {
    postId,
    authorId,
    contentHash,
    result,
    modelName: "deepseek-chat",
  });

  return result;
}

/**
 * 自动化决策矩阵
 */
function makeDecision(
  score: number,
  riskLevel: RiskLevel
): { reviewStatus: ReviewStatus; finalAction: FinalAction; canPublish: boolean; errorMessage?: string } {
  // 1. safe 且 score >= 80 -> 自动通过
  if (riskLevel === "safe" && score >= 80) {
    return {
      reviewStatus: "approved",
      finalAction: "auto_approved",
      canPublish: true,
    };
  }

  // 2. dangerous 或 score < 60 -> 高危拦截
  if (riskLevel === "dangerous" || score < 60) {
    return {
      reviewStatus: "rejected",
      finalAction: "auto_rejected",
      canPublish: false,
      errorMessage: "内容未通过学术论坛安全审核规范（被判定为高风险违规），请修改后重新提交。",
    };
  }

  // 3. 其余情况（sensitive 或 60 <= score < 80）-> 进入人工待审队列
  return {
    reviewStatus: "pending",
    finalAction: "auto_pending",
    canPublish: false,
    errorMessage: "帖子已提交，正在等待管理员人工审核，审核通过后将公开展出。",
  };
}

/**
 * 记录审核审计日志
 */
async function logModerationRecord(
  supabase: any,
  params: {
    postId?: string;
    authorId: string;
    contentHash: string;
    result: ModerationResult;
    modelName: string;
  }
) {
  try {
    const { postId, authorId, contentHash, result, modelName } = params;
    await supabase.from("content_moderation_logs").insert({
      post_id: postId || null,
      author_id: authorId,
      content_hash: contentHash,
      model_name: modelName,
      score: result.score,
      risk_level: result.riskLevel,
      reason: result.reason,
      detected_tags: result.suggestedTags,
      matched_sensitive_words: result.matchedSensitiveWords,
      final_action: result.finalAction,
      cost_tokens: result.costTokens || 0,
      latency_ms: result.latencyMs,
      is_cached: result.isCached,
    });
  } catch (err) {
    console.error("[ModerationEngine] 写入审计日志异常:", err);
  }
}

/**
 * 写入缓存表
 */
async function writeModerationCache(
  supabase: any,
  contentHash: string,
  output: { score: number; riskLevel: RiskLevel; reason: string; tags: string[] }
) {
  try {
    await supabase.from("content_moderation_cache").upsert({
      content_hash: contentHash,
      score: output.score,
      risk_level: output.riskLevel,
      reason: output.reason,
      tags: output.tags,
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    });
  } catch (err) {
    console.error("[ModerationEngine] 更新审核缓存失败:", err);
  }
}
