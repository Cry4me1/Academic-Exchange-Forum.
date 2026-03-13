import { createDeepSeek } from "@ai-sdk/deepseek";
import { createServerClient } from "@supabase/ssr";
import { streamText } from "ai";

export const runtime = "edge";

const deepseek = createDeepSeek({
    apiKey: process.env.DEEPSEEK_API_KEY,
});

// ====== 审稿专属积分参数 ======
const MIN_REVIEW_CREDIT_COST = 15;
const TOKENS_PER_CREDIT = 40;

function calculateReviewCreditCost(totalTokens: number): number {
    return Math.max(
        MIN_REVIEW_CREDIT_COST,
        Math.ceil(totalTokens / TOKENS_PER_CREDIT)
    );
}

// Edge 兼容的 Supabase Client
function createSupabaseEdgeClient(req: Request) {
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    const cookieHeader = req.headers.get("cookie") || "";
                    return cookieHeader
                        .split(";")
                        .map((c) => {
                            const [name, ...rest] = c.trim().split("=");
                            return { name, value: rest.join("=") };
                        })
                        .filter((c) => c.name);
                },
                setAll() {
                    // Edge 函数中不设置 cookie
                },
            },
        }
    );
}

// ====== 学术审稿人 System Prompt ======
const REVIEWER_SYSTEM_PROMPT = `你是一位严谨的学术论文审稿人（Reviewer #2），拥有跨学科的学术背景。
你的任务是对提交的学术文章进行全面、客观的同行评审。

## 评审标准

请从以下四个维度进行评审，每个维度给出 1-10 的评分：

1. **🔬 创新性 (Originality)**：论点是否新颖？是否提出了独到见解或新的研究视角？
2. **🧠 逻辑严密性 (Logical Rigor)**：论证链条是否完整？前提与结论之间的推理是否合理？是否存在逻辑漏洞或跳跃？
3. **📚 文献与引用 (References)**：主张是否有充分的证据或文献支撑？是否存在无根据的断言？
4. **✍️ 表述质量 (Writing Quality)**：语言是否准确专业？文章结构是否清晰？术语使用是否恰当？

## 输出格式

请严格按照以下 Markdown 格式输出：

### 📝 审稿报告

| 维度 | 评分 | 简评 |
|------|------|------|
| 🔬 创新性 | X/10 | 一句话评价 |
| 🧠 逻辑严密性 | X/10 | 一句话评价 |
| 📚 文献与引用 | X/10 | 一句话评价 |
| ✍️ 表述质量 | X/10 | 一句话评价 |

**综合评级**: [A/B/C/D]
- A = 优秀，强烈推荐发表
- B = 良好，小幅修改后可发表
- C = 一般，需要较大修改
- D = 不足，建议大幅重写

### 💡 具体修改建议

按优先级列出 3~5 条具体、可操作的修改建议，每条建议需：
- 指出原文中的具体段落或表述
- 说明问题所在
- 给出修改方向

### 🌟 亮点

列出文章中 1~2 个值得肯定的优点。

## 审稿原则
- 保持客观公正，避免人身攻击
- 批评要有建设性，给出具体改进方案
- 承认文章的优点，不要一味否定
- 如果文章包含 LaTeX 公式或代码，也需评估其正确性
- 使用中文输出`;

export async function POST(req: Request): Promise<Response> {
    console.log("[AI Peer Review] 开始处理审稿请求");

    // 检查 API Key
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey || apiKey === "") {
        return new Response("缺少 DEEPSEEK_API_KEY", { status: 400 });
    }

    // ====== 鉴权 ======
    const supabase = createSupabaseEdgeClient(req);
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return new Response("请先登录", { status: 401 });
    }

    // ====== 余额预检 ======
    const { data: creditData } = await supabase
        .from("user_credits")
        .select("balance")
        .eq("user_id", user.id)
        .single();

    if (!creditData) {
        console.log("[AI Peer Review] 老用户无积分记录，自动补发");
        await supabase.rpc("add_user_credits", {
            p_user_id: user.id,
            p_amount: 100,
            p_type: "signup_bonus",
            p_description: "老用户积分系统初始化奖励",
        });
    } else if (creditData.balance < MIN_REVIEW_CREDIT_COST) {
        return new Response(
            JSON.stringify({
                error: "INSUFFICIENT_CREDITS",
                balance: creditData.balance,
                required: MIN_REVIEW_CREDIT_COST,
            }),
            {
                status: 402,
                headers: { "Content-Type": "application/json" },
            }
        );
    }

    try {
        const body = await req.json();
        // useChat 发送 messages，我们读取自定义字段
        const content = body.content as string;
        const title = body.title as string;
        const tags = (body.tags as string[]) || [];

        if (!content || !title) {
            return new Response("缺少必要参数 (content, title)", {
                status: 400,
            });
        }

        // 构建用户消息
        const userMessage = [
            `## 文章标题\n${title}`,
            tags?.length ? `## 学科领域\n${tags.join("、")}` : "",
            `## 文章正文\n${content}`,
        ]
            .filter(Boolean)
            .join("\n\n");

        console.log(
            `[AI Peer Review] 用户: ${user.id}, 内容长度: ${content.length} 字符`
        );

        const userId = user.id;

        // 使用 deepseek-reasoner 推理模型
        const result = streamText({
            model: deepseek("deepseek-reasoner"),
            messages: [
                { role: "system", content: REVIEWER_SYSTEM_PROMPT },
                { role: "user", content: userMessage },
            ],
            // deepseek-reasoner 不支持 temperature 参数
            onFinish: async ({ usage }) => {
                const totalTokens =
                    usage?.totalTokens ||
                    (usage?.inputTokens || 0) + (usage?.outputTokens || 0);
                const creditCost = calculateReviewCreditCost(totalTokens);

                console.log(
                    `[AI Peer Review] Token 用量: input=${usage?.inputTokens}, output=${usage?.outputTokens}, total=${totalTokens}`
                );
                console.log(
                    `[AI Peer Review] 积分消耗: ${creditCost}`
                );

                try {
                    const { data: deductResult, error: deductError } =
                        await supabase.rpc("deduct_user_credits", {
                            p_user_id: userId,
                            p_amount: creditCost,
                            p_description: "Ask AI · 同行评审",
                            p_metadata: {
                                option: "peer_review",
                                option_label: "同行评审 (Reasoner)",
                                input_tokens: usage?.inputTokens || 0,
                                output_tokens: usage?.outputTokens || 0,
                                total_tokens: totalTokens,
                                credit_cost: creditCost,
                                content_length: content.length,
                            },
                        });

                    if (deductError) {
                        console.error(
                            "[AI Peer Review] 后置扣费 RPC 错误:",
                            deductError
                        );
                    } else {
                        const res = deductResult as {
                            success: boolean;
                            new_balance?: number;
                            error?: string;
                        };
                        if (res.success) {
                            console.log(
                                "[AI Peer Review] 后置扣费成功, 剩余:",
                                res.new_balance
                            );
                        } else {
                            console.error(
                                "[AI Peer Review] 后置扣费失败:",
                                res.error
                            );
                        }
                    }
                } catch (err) {
                    console.error("[AI Peer Review] 后置扣费异常:", err);
                }
            },
        });

        console.log("[AI Peer Review] 开始流式输出（Reasoner 推理模式）");
        // 使用 UIMessageStream 协议，发送推理过程
        return result.toUIMessageStreamResponse({
            sendReasoning: true,
        });
    } catch (error) {
        console.error("[AI Peer Review] 错误:", error);
        return new Response(
            "审稿请求处理失败: " +
            (error instanceof Error ? error.message : String(error)),
            { status: 500 }
        );
    }
}
