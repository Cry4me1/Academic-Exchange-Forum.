import { createDeepSeek } from "@ai-sdk/deepseek";
import { streamObject } from "ai";
import { z } from "zod";

export const runtime = "edge";

const deepseek = createDeepSeek({
    apiKey: process.env.DEEPSEEK_API_KEY,
});

// 评分结果 Schema
const DuelScoreSchema = z.object({
    evidenceScore: z.number().min(0).max(5).describe("证据力度评分 (0-5分)"),
    citationScore: z.number().min(0).max(3).describe("引用权威性评分 (0-3分)"),
    logicScore: z.number().min(0).max(2).describe("逻辑严密度评分 (0-2分)"),
    hasFallacy: z.boolean().describe("是否存在逻辑谬误"),
    fallacyType: z.string().optional().describe("谬误类型，如人身攻击、稻草人论证等"),
    fallacyPenalty: z.number().min(-10).max(0).describe("谬误扣分 (0 或 -10)"),
    totalScore: z.number().describe("总得分"),
    analysis: z.string().describe("简短的评分分析说明（50字以内）"),
    highlights: z.array(z.string()).max(3).describe("论点中的亮点（最多3条）"),
    weaknesses: z.array(z.string()).max(3).describe("论点中的不足（最多3条）"),
});

const DUEL_REFEREE_PROMPT = `你是一位严谨而公正的学术辩论裁判。你的任务是分析辩论中的论点，并给出客观、结构化的评分。

## 评分标准

### 加分项
1. **证据力度 (0-5分)**
   - 5分: 引用了高质量的研究数据、实验结果、或可验证的事实
   - 3-4分: 有一定的证据支持，但来源或数据不够完整
   - 1-2分: 仅有主观论述，缺乏具体证据
   - 0分: 完全没有证据支持

2. **引用权威性 (0-3分)**
   - 3分: 引用顶级期刊论文、知名学者观点、官方数据
   - 2分: 引用一般学术资料或可信来源
   - 1分: 引用普通网页或非学术来源
   - 0分: 没有引用任何来源

3. **逻辑严密度 (0-2分)**
   - 2分: 论证结构清晰，推理无漏洞，因果关系明确
   - 1分: 论证基本合理，但有小瑕疵
   - 0分: 论证混乱或存在明显逻辑跳跃

### 扣分项 - 逻辑谬误 (-10分)
检测以下逻辑谬误，如发现则扣10分：
- **人身攻击 (Ad Hominem)**: 攻击对手个人而非论点
- **偷换概念 (Equivocation)**: 在论证中偷偷改变概念含义
- **稻草人论证 (Straw Man)**: 歪曲对方观点后再攻击
- **虚假二分法 (False Dichotomy)**: 只给出两个选项，忽略其他可能
- **滑坡谬误 (Slippery Slope)**: 不合理地推断极端后果
- **诉诸权威谬误 (Appeal to Authority)**: 以不相关权威为依据
- **循环论证 (Circular Reasoning)**: 结论在前提中已假设
- **以偏概全 (Hasty Generalization)**: 从少数案例推广到全体

## 输出要求
请评估论点，计算总分 = 证据力度 + 引用权威性 + 逻辑严密度 + 谬误扣分。
保持客观公正，不要因为立场偏向任何一方。
`;

export async function POST(req: Request): Promise<Response> {
    const apiKey = process.env.DEEPSEEK_API_KEY;

    if (!apiKey) {
        return new Response(
            JSON.stringify({ error: "缺少 DEEPSEEK_API_KEY" }),
            { status: 400, headers: { "Content-Type": "application/json" } }
        );
    }

    try {
        const body = await req.json();
        const { content, topic, position, previousContext } = body;

        if (!content || !topic) {
            return new Response(
                JSON.stringify({ error: "缺少必要参数: content, topic" }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        const userPrompt = `
## 辩题
${topic}

## 当前论点作者的立场
${position || "未指定"}

${previousContext ? `## 之前的辩论背景\n${previousContext}\n` : ""}

## 需要评分的论点内容
${content}

请根据评分标准，对以上论点进行评分。
`;

        const result = streamObject({
            model: deepseek("deepseek-chat"),
            schema: DuelScoreSchema,
            system: DUEL_REFEREE_PROMPT,
            prompt: userPrompt,
            temperature: 0.3, // 降低温度以获得更一致的评分
        });

        return result.toTextStreamResponse();
    } catch (error) {
        console.error("[Duel Analyze] Error:", error);
        return new Response(
            JSON.stringify({
                error: "分析失败: " + (error instanceof Error ? error.message : String(error)),
            }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
}
