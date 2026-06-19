import { createDeepSeek } from "@ai-sdk/deepseek";
import { generateText } from "ai";

export const runtime = "edge";

const deepseek = createDeepSeek({
    apiKey: process.env.DEEPSEEK_API_KEY,
});

// 评分结果类型
interface DuelScore {
    evidenceScore: number;
    citationScore: number;
    logicScore: number;
    hasFallacy: boolean;
    fallacyType?: string;
    fallacyPenalty: number;
    isDuplicate: boolean;
    totalScore: number;
    analysis: string;
    highlights: string[];
    weaknesses: string[];
}

// 之前回合的结构
interface PreviousRound {
    round: number;
    author: string;
    position: string;
    content: string;
}

const DUEL_REFEREE_PROMPT = `你是一位公正但亲和的辩论裁判（AI Referee），负责为初高中生的学术讨论打分。你的风格是鼓励思考、注重说理，但对偷懒和耍赖零容忍。

## 重要前置规则

### 1. 重复内容检测（最高优先级！）
你必须将当前论点与该作者之前提交的所有论点进行逐一比对。
- 如果当前论点与该作者之前提交的任何一个论点在核心论据、论证逻辑或表述上高度相似（超过 60% 的内容重复或仅做了表面改写），则判定为"重复内容"：
  - isDuplicate 设为 true
  - evidenceScore 设为 0
  - citationScore 设为 0
  - logicScore 设为 0
  - totalScore 设为 0
  - analysis 中必须明确说明"检测到重复或高度相似内容，不予计分"
- 注意：与对手的论点相似不算重复（反驳对方观点是正常的）。只有与自己之前的论点雷同才算重复。

### 2. 内容质量要求
这是一个面向初高中生的讨论论坛，不强制要求学术文献引用。但论点必须：
- 有自己的思考和推理过程，不能只喊口号
- 尽量用具体的例子、数据或事实来支撑观点
- 认真回应对方的论点，而不是自说自话

### 3. 立场一致性检测（重要！）
每位辩手有明确的立场（正方或反方）。你必须检查论点内容是否与作者的立场一致。
- **如果该辩手的论点实质上在支持对方的立场**（即正方在帮反方说话，或反方在帮正方说话），则判定为"立场背离"：
  - evidenceScore 设为 0
  - citationScore 设为 0  
  - logicScore 设为 0
  - totalScore 设为 0
  - hasFallacy 设为 false（这不是逻辑谬误，是立场问题）
  - analysis 中必须说明"论点内容与你的立场（X方）不符，你在帮对方说话"
  - 在 weaknesses 中添加"立场背离：内容支持了对方观点"
- 注意区分：**有策略地承认对方部分观点再反驳**（"虽然…但是…"）属于高级辩论技巧，不算立场背离。只有**整体论点都在支撑对方立场**才判定为背离。

### 4. 关联帖子原文参考（如果提供）
如果系统提供了“决斗关联的帖子原文内容”，说明这场决斗是由于该帖子引发的争论。你必须：
- 评估当前辩手的论点是否契合或有效回应了原帖子中阐述的核心事实、问题或讨论主旨。
- 如果论点完全偏离原帖子论题，属于答非所问或脱离背景自说自话，应在 weaknesses 中明确指出“偏离原帖主题”，并对“推理质量”或“对话互动”进行扣分。

## 评分标准

### 加分项
1. **推理质量 (0-5分)** - 你的脑子好不好使？
   - 5分: 思路清晰、层层递进、有独到见解，让人眼前一亮
   - 3-4分: 有自己的分析和推理，观点站得住脚
   - 1-2分: 只是表达了看法，但缺少"为什么"的解释
   - 0分: 纯粹喊口号、复读机、或为重复内容

2. **论据支撑 (0-3分)** - 你有没有拿出"干货"？
   - 3分: 用了具体的事实、数据、真实案例、教科书知识、或可信来源来支撑（不要求学术论文，生活常识和课本知识也算！）
   - 2分: 有一些例子或事实，但不够具体或相关性一般
   - 1分: 论据很模糊，比如"大家都知道"、"很多人认为"
   - 0分: 完全没有任何支撑，纯观点输出

3. **对话互动 (0-2分)** - 你有没有在"辩论"而不是"独白"？
   - 2分: 有效回应了对方的核心论点，指出了对方的漏洞或补充了新角度
   - 1分: 提到了对方的观点，但回应不够有力
   - 0分: 完全无视对方说了什么，自说自话（第一回合例外，首发可满分）

### 扣分项 - 逻辑谬误 / 不当行为 (-10分)
检测以下问题，如发现则扣10分：
- **人身攻击**: 骂人、嘲讽对手本人而不是讨论观点
- **偷换概念**: 偷偷改变讨论的定义或范围
- **稻草人论证**: 故意歪曲对方的意思然后攻击
- **虚假二分法**: "要么 A 要么 B"，不给其他选项
- **诉诸情感**: 纯靠煽情而不讲道理
- **以偏概全**: 用一两个特例推广到所有情况
- **循环论证**: 用结论证明结论

## 输出要求
请评估论点，计算总分 = 推理质量 + 论据支撑 + 对话互动 + 谬误扣分。
如果是重复内容或立场背离，总分 = 0。
保持客观公正，不要因为立场偏向任何一方。
对初高中生要鼓励为主，但评分要实事求是。

## 输出格式
你必须返回一个严格的 JSON 对象，不要有任何其他文字。格式如下：
{
  "evidenceScore": <0-5的整数>,
  "citationScore": <0-3的整数>,
  "logicScore": <0-2的整数>,
  "hasFallacy": <true或false>,
  "fallacyType": "<谬误类型，如无则为空字符串>",
  "fallacyPenalty": <0或-10>,
  "isDuplicate": <true或false>,
  "totalScore": <总分整数>,
  "analysis": "<50字以内的评分分析说明>",
  "highlights": ["<亮点1>", "<亮点2>"],
  "weaknesses": ["<不足1>", "<不足2>"]
}
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
        const {
            content,
            topic,
            description,
            position,
            previousRounds,
            postContent,
        } = body as {
            content: string;
            topic: string;
            description?: string;
            position?: string;
            previousRounds?: PreviousRound[];
            postContent?: string | null;
        };

        if (!content || !topic) {
            return new Response(
                JSON.stringify({ error: "缺少必要参数: content, topic" }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        // 构建包含完整上下文的 user prompt
        const previousRoundsText = previousRounds && previousRounds.length > 0
            ? previousRounds.map(r =>
                `【第${r.round}回合 - ${r.position}方 @${r.author}】\n${r.content}`
            ).join("\n\n---\n\n")
            : "（这是第一个回合，没有之前的辩论记录）";

        const userPrompt = `
## 辩题
${topic}

## 辩题背景描述
${description || "无额外描述"}

## 决斗关联的帖子原文内容
${postContent || "无关联帖子原文"}

## 当前论点作者的立场
${position || "未指定"}

## 之前的完整辩论记录
${previousRoundsText}

---

## 【当前需要评分的论点内容】
${content}

请根据评分标准，对以上论点进行评分。注意仔细对比该作者之前的论点，并结合关联的帖子原文背景，检查论点是否紧扣主题、是否存在重复提交。
请直接输出 JSON 对象，不要有任何额外文字。
`;

        console.log("[Duel Analyze] 使用 deepseek-reasoner 思考模式进行评分");

        // 使用 deepseek-reasoner（thinking 模式），不支持 streamObject，改用 generateText
        const result = await generateText({
            model: deepseek("deepseek-reasoner"),
            messages: [
                { role: "system", content: DUEL_REFEREE_PROMPT },
                { role: "user", content: userPrompt },
            ],
            // deepseek-reasoner 不支持 temperature 参数
        });

        const responseText = result.text;
        console.log("[Duel Analyze] Reasoner 原始返回:", responseText.slice(0, 200));

        // 从返回中提取 JSON
        let scoreData: DuelScore;
        try {
            // 尝试直接解析
            scoreData = JSON.parse(responseText);
        } catch {
            // 如果直接解析失败，尝试从 markdown 代码块中提取
            const jsonMatch = responseText.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
            if (jsonMatch) {
                scoreData = JSON.parse(jsonMatch[1].trim());
            } else {
                // 最后尝试：查找 { 和 } 之间的内容
                const braceMatch = responseText.match(/\{[\s\S]*\}/);
                if (braceMatch) {
                    scoreData = JSON.parse(braceMatch[0]);
                } else {
                    throw new Error("无法从 AI 返回中解析 JSON 评分结果");
                }
            }
        }

        // 校验并约束分数范围
        scoreData.evidenceScore = Math.max(0, Math.min(5, Math.round(scoreData.evidenceScore || 0)));
        scoreData.citationScore = Math.max(0, Math.min(3, Math.round(scoreData.citationScore || 0)));
        scoreData.logicScore = Math.max(0, Math.min(2, Math.round(scoreData.logicScore || 0)));
        scoreData.fallacyPenalty = scoreData.hasFallacy ? -10 : 0;
        scoreData.isDuplicate = scoreData.isDuplicate || false;

        // 如果是重复内容，强制清零
        if (scoreData.isDuplicate) {
            scoreData.evidenceScore = 0;
            scoreData.citationScore = 0;
            scoreData.logicScore = 0;
            scoreData.fallacyPenalty = 0;
            scoreData.totalScore = 0;
        } else {
            scoreData.totalScore =
                scoreData.evidenceScore +
                scoreData.citationScore +
                scoreData.logicScore +
                scoreData.fallacyPenalty;
        }

        scoreData.highlights = (scoreData.highlights || []).slice(0, 3);
        scoreData.weaknesses = (scoreData.weaknesses || []).slice(0, 3);

        console.log("[Duel Analyze] 最终评分:", JSON.stringify(scoreData));

        return new Response(
            JSON.stringify(scoreData),
            {
                status: 200,
                headers: { "Content-Type": "application/json" },
            }
        );
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
