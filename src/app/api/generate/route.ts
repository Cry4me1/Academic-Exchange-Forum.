import { createDeepSeek } from "@ai-sdk/deepseek";
import { createServerClient } from "@supabase/ssr";
import { streamText } from "ai";

export const runtime = "edge";

// 使用专门的 DeepSeek SDK
const deepseek = createDeepSeek({
    apiKey: process.env.DEEPSEEK_API_KEY,
});

// ====== Token-Based 积分计费 ======
// 最低消费 8 积分，每 40 tokens ≈ 1 积分
const MIN_CREDIT_COST = 8;
const TOKENS_PER_CREDIT = 40;

function calculateCreditCost(totalTokens: number): number {
    return Math.max(MIN_CREDIT_COST, Math.ceil(totalTokens / TOKENS_PER_CREDIT));
}

// AI 功能中文名映射
const AI_OPTION_LABELS: Record<string, string> = {
    continue: "继续写作",
    improve: "改进写作",
    fix: "修复语法",
    shorter: "缩短文本",
    longer: "扩展文本",
    simplify: "简化文本",
    emojify: "添加表情",
    complete_sentence: "补全句子",
    summarize: "总结",
    translate: "翻译",
    adjust_tone: "更改语气",
    zap: "自定义指令",
};

// Edge 兼容的 Supabase Client（从 request cookies 读取）
function createSupabaseEdgeClient(req: Request) {
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    const cookieHeader = req.headers.get("cookie") || "";
                    return cookieHeader.split(";").map((c) => {
                        const [name, ...rest] = c.trim().split("=");
                        return { name, value: rest.join("=") };
                    }).filter((c) => c.name);
                },
                setAll() {
                    // Edge 函数中不设置 cookie
                },
            },
        }
    );
}

export async function POST(req: Request): Promise<Response> {
    console.log("[API Generate] 开始处理请求");

    // 检查 API Key 是否配置
    const apiKey = process.env.DEEPSEEK_API_KEY;
    console.log("[API Generate] DEEPSEEK_API_KEY 存在:", !!apiKey);

    if (!apiKey || apiKey === "") {
        console.log("[API Generate] 错误: 缺少 DEEPSEEK_API_KEY");
        return new Response("缺少 DEEPSEEK_API_KEY - 请在 .env.local 中添加。", {
            status: 400,
        });
    }

    // ====== 余额预检流程 ======
    const supabase = createSupabaseEdgeClient(req);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return new Response("请先登录", { status: 401 });
    }

    // 预检余额：至少需要最低消费积分
    const { data: creditData } = await supabase
        .from("user_credits")
        .select("balance")
        .eq("user_id", user.id)
        .single();

    if (!creditData) {
        // 老用户首次使用：自动补发注册奖励 100 积分
        console.log("[API Generate] 老用户无积分记录，自动补发注册奖励");
        await supabase.rpc("add_user_credits", {
            p_user_id: user.id,
            p_amount: 100,
            p_type: "signup_bonus",
            p_description: "老用户积分系统初始化奖励",
        });
    } else if (creditData.balance < MIN_CREDIT_COST) {
        return new Response(
            JSON.stringify({ error: "INSUFFICIENT_CREDITS", balance: creditData.balance }),
            { status: 402, headers: { "Content-Type": "application/json" } }
        );
    }

    try {
        const body = await req.json();
        console.log("[API Generate] 请求 body:", JSON.stringify(body));

        // useCompletion 发送 prompt 在顶层，option 和 command 在 body 中
        const prompt = body.prompt || "";
        const option = body.option || "zap";
        const command = body.command || "";

        console.log("[API Generate] prompt:", prompt);
        console.log("[API Generate] option:", option);
        console.log("[API Generate] command:", command);

        let messages: { role: "system" | "user"; content: string }[];

        switch (option) {
            case "continue":
                messages = [
                    {
                        role: "system",
                        content:
                            "你是一个 AI 写作助手，根据上下文继续撰写文本。" +
                            "优先考虑后面的内容而不是开头。" +
                            "将回复限制在 200 字符以内，但确保构成完整的句子。" +
                            "适当时使用 Markdown 格式。",
                    },
                    {
                        role: "user",
                        content: prompt,
                    },
                ];
                break;
            case "improve":
                messages = [
                    {
                        role: "system",
                        content:
                            "你是一个 AI 写作助手，负责改进现有文本。" +
                            "将回复限制在 200 字符以内，但确保构成完整的句子。" +
                            "适当时使用 Markdown 格式。",
                    },
                    {
                        role: "user",
                        content: `需要改进的文本是：${prompt}`,
                    },
                ];
                break;
            case "shorter":
                messages = [
                    {
                        role: "system",
                        content:
                            "你是一个 AI 写作助手，负责缩短现有文本。" +
                            "适当时使用 Markdown 格式。",
                    },
                    {
                        role: "user",
                        content: `需要缩短的文本是：${prompt}`,
                    },
                ];
                break;
            case "longer":
                messages = [
                    {
                        role: "system",
                        content:
                            "你是一个 AI 写作助手，负责扩展现有文本。" +
                            "适当时使用 Markdown 格式。",
                    },
                    {
                        role: "user",
                        content: `需要扩展的文本是：${prompt}`,
                    },
                ];
                break;
            case "fix":
                messages = [
                    {
                        role: "system",
                        content:
                            "你是一个 AI 写作助手，负责修复现有文本中的语法和拼写错误。" +
                            "将回复限制在 200 字符以内，但确保构成完整的句子。" +
                            "适当时使用 Markdown 格式。",
                    },
                    {
                        role: "user",
                        content: `需要修复的文本是：${prompt}`,
                    },
                ];
                break;
            case "simplify":
                messages = [
                    {
                        role: "system",
                        content:
                            "你是一个 AI 写作助手，负责将现有文本简化为更易懂的语言。" +
                            "使内容更通俗易懂，适合更广泛的读者。" +
                            "适当时使用 Markdown 格式。",
                    },
                    {
                        role: "user",
                        content: `需要简化的文本是：${prompt}`,
                    },
                ];
                break;
            case "emojify":
                messages = [
                    {
                        role: "system",
                        content:
                            "你是一个 AI 写作助手，负责在现有文本中添加适当的表情符号。" +
                            "保持原有意思不变，只是增加趣味性和视觉吸引力。" +
                            "适当时使用 Markdown 格式。",
                    },
                    {
                        role: "user",
                        content: `需要添加表情符号的文本是：${prompt}`,
                    },
                ];
                break;
            case "complete_sentence":
                messages = [
                    {
                        role: "system",
                        content:
                            "你是一个 AI 写作助手，负责补全用户未完成的句子。" +
                            "根据上下文逻辑自然地完成句子。" +
                            "适当时使用 Markdown 格式。",
                    },
                    {
                        role: "user",
                        content: `需要补全的文本是：${prompt}`,
                    },
                ];
                break;
            case "summarize":
                messages = [
                    {
                        role: "system",
                        content:
                            "你是一个 AI 写作助手，负责总结现有文本的核心内容。" +
                            "提供简洁明了的摘要。" +
                            "适当时使用 Markdown 格式。",
                    },
                    {
                        role: "user",
                        content: `需要总结的文本是：${prompt}`,
                    },
                ];
                break;
            case "translate":
                messages = [
                    {
                        role: "system",
                        content:
                            `你是一个专业的翻译助手。请将以下文本翻译成 ${command}。` +
                            "保持原文的语气和风格。" +
                            "仅输出翻译后的结果，不要包含额外的解释。",
                    },
                    {
                        role: "user",
                        content: `${prompt}`,
                    },
                ];
                break;
            case "adjust_tone":
                messages = [
                    {
                        role: "system",
                        content:
                            `你是一个 AI 写作助手，负责调整现有文本的语气为 ${command} 风格。` +
                            "重写文本以匹配指定的语气，同时保持原意不变。" +
                            "适当时使用 Markdown 格式。",
                    },
                    {
                        role: "user",
                        content: `需要调整语气的文本是：${prompt}`,
                    },
                ];
                break;
            case "zap":
            default:
                messages = [
                    {
                        role: "system",
                        content:
                            "你是一个 AI 写作助手，根据提示生成文本。" +
                            "你接收用户输入和操作文本的指令。" +
                            "适当时使用 Markdown 格式。",
                    },
                    {
                        role: "user",
                        content: command ? `对于这段文本：${prompt}。你需要执行的指令是：${command}` : prompt,
                    },
                ];
                break;
        }

        console.log("[API Generate] 准备调用 DeepSeek API，messages:", JSON.stringify(messages));

        const optionLabel = AI_OPTION_LABELS[option] || option;
        const userId = user.id;

        const result = streamText({
            model: deepseek("deepseek-chat"),
            messages,
            temperature: 0.7,
            onFinish: async ({ usage }) => {
                // 流完成后根据实际 token 用量扣费
                const totalTokens = usage?.totalTokens || ((usage?.inputTokens || 0) + (usage?.outputTokens || 0));
                const creditCost = calculateCreditCost(totalTokens);

                console.log(`[API Generate] Token 用量: input=${usage?.inputTokens}, output=${usage?.outputTokens}, total=${totalTokens}`);
                console.log(`[API Generate] 积分消耗: ${creditCost} (功能: ${optionLabel})`);

                try {
                    const { data: deductResult, error: deductError } = await supabase.rpc(
                        "deduct_user_credits",
                        {
                            p_user_id: userId,
                            p_amount: creditCost,
                            p_description: `Ask AI · ${optionLabel}`,
                            p_metadata: {
                                option,
                                option_label: optionLabel,
                                input_tokens: usage?.inputTokens || 0,
                                output_tokens: usage?.outputTokens || 0,
                                total_tokens: totalTokens,
                                credit_cost: creditCost,
                            },
                        }
                    );

                    if (deductError) {
                        console.error("[API Generate] 后置扣费 RPC 错误:", deductError);
                    } else {
                        const res = deductResult as { success: boolean; new_balance?: number; error?: string };
                        if (res.success) {
                            console.log("[API Generate] 后置扣费成功, 剩余:", res.new_balance);
                        } else {
                            console.error("[API Generate] 后置扣费失败:", res.error);
                        }
                    }
                } catch (err) {
                    console.error("[API Generate] 后置扣费异常:", err);
                }
            },
        });

        console.log("[API Generate] streamText 调用成功，返回流响应");
        return result.toTextStreamResponse();
    } catch (error) {
        console.error("[API Generate] 错误详情:", error);
        console.error("[API Generate] 错误类型:", typeof error);
        console.error("[API Generate] 错误消息:", error instanceof Error ? error.message : String(error));
        return new Response("处理请求时发生错误: " + (error instanceof Error ? error.message : String(error)), { status: 500 });
    }
}
