import { createDeepSeek } from "@ai-sdk/deepseek";
import { generateText } from "ai";
import { AIReviewOutput } from "./types";

const MODERATION_SYSTEM_PROMPT = `你是一位专业的学术论坛（Scholarly）内容安全审核与合规专家。
你需要对用户提交的学术交流帖子（标题、正文、标签）进行多维度内容安全与合规性评估。

## 学术语境准则（非常重要）：
1. 学术讨论（例如：马克思主义哲学、历史唯物主义、政治经济学批判、正当学术辩论、经典哲学著作引用、历史事件探讨）属于合法严肃学术研究，【绝不可】仅因出现历史政治人物、政治学术概念而误判为 dangerous。
2. 严厉打击与零容忍：
   - 煽动暴力暴恐、分裂颠覆言论；
   - 人身攻击、恶意诽谤与仇恨言论；
   - 淫秽色情、低俗不良信息；
   - 商业广告、赌博灰产、兼职刷单；
   - 学术不端：论文代写买卖、代考枪手、造假等。
3. 判定标准与分流：
   - safe: 健康正常的学术讨论、提问、科普、论文分享，无不良信息。（健康分 80-100）
   - sensitive: 涉及边界争议、敏感政治哲学议题但态度严肃、具有一定讨论价值，建议人工复审。（健康分 60-79）
   - dangerous: 明显违规、违法违规、辱骂攻击、学术不端、广告。（健康分 0-59）

## 输出要求：
请务必返回且仅返回一个合法的 JSON 对象，格式如下：
{
  "score": 95,
  "riskLevel": "safe",
  "tags": ["计算机科学", "人工智能"],
  "reason": "内容为严谨的算法与学术探讨，无任何违规风险。"
}
不得输出除此 JSON 以外的任何文本或解释说明。`;

export async function reviewContentWithAI(
  title: string,
  content: string,
  tags: string[] = []
): Promise<{ output: AIReviewOutput; costTokens: number; latencyMs: number }> {
  const startTime = Date.now();
  const apiKey = process.env.DEEPSEEK_API_KEY;

  if (!apiKey) {
    console.warn("[AIModerator] 未配置 DEEPSEEK_API_KEY，降级为默认安全待审");
    return {
      output: {
        score: 75,
        riskLevel: "sensitive",
        tags: tags.length > 0 ? tags : ["学术讨论"],
        reason: "审核服务暂未配置 API Key，已转入人工待审队列",
      },
      costTokens: 0,
      latencyMs: Date.now() - startTime,
    };
  }

  const deepseek = createDeepSeek({ apiKey });

  const userPrompt = `【待审核帖子】\n标题：${title}\n标签：${tags.join(", ") || "无"}\n正文内容：\n${content.slice(0, 3000)}`;

  try {
    const response = await generateText({
      model: deepseek("deepseek-chat"),
      system: MODERATION_SYSTEM_PROMPT,
      prompt: userPrompt,
      temperature: 0.1,
    });

    const latencyMs = Date.now() - startTime;
    const rawText = response.text.trim();
    const costTokens = response.usage?.totalTokens || 0;

    // 清理可能的 markdown 代码块标识
    let cleanJson = rawText;
    if (cleanJson.startsWith("```")) {
      cleanJson = cleanJson.replace(/^```(json)?\n?/, "").replace(/\n?```$/, "").trim();
    }

    let parsed: any;
    try {
      parsed = JSON.parse(cleanJson);
    } catch {
      // 若 JSON 解析失败，尝试正则提取
      const match = cleanJson.match(/\{[\s\S]*\}/);
      if (match) {
        parsed = JSON.parse(match[0]);
      } else {
        throw new Error("无法解析 AI 返回的 JSON 格式");
      }
    }

    const score = typeof parsed.score === "number" ? Math.max(0, Math.min(100, Math.round(parsed.score))) : 75;
    const riskLevel = ["safe", "sensitive", "dangerous"].includes(parsed.riskLevel)
      ? parsed.riskLevel
      : score >= 80 ? "safe" : score >= 60 ? "sensitive" : "dangerous";
    const resultTags = Array.isArray(parsed.tags) ? parsed.tags.map(String) : tags;
    const reason = typeof parsed.reason === "string" ? parsed.reason : "AI 自动化初审完成";

    return {
      output: {
        score,
        riskLevel,
        tags: resultTags,
        reason,
      },
      costTokens,
      latencyMs,
    };
  } catch (error) {
    const latencyMs = Date.now() - startTime;
    console.error("[AIModerator] DeepSeek 审核调用失败:", error);

    // 调用异常时降级策略：评定为 sensitive 待人工复核，保障系统可用性
    return {
      output: {
        score: 70,
        riskLevel: "sensitive",
        tags: tags.length > 0 ? tags : ["学术讨论"],
        reason: "AI 初审服务暂时无响应，已自动转入人工审核队列",
      },
      costTokens: 0,
      latencyMs,
    };
  }
}
