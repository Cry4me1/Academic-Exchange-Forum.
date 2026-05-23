import { createClient } from "@/lib/supabase/server";

/**
 * 从 Tiptap JSON 内容中提取纯文本
 */
export function extractPlainText(content: unknown): string {
    if (!content || typeof content !== "object") return "";

    const texts: string[] = [];

    function walk(node: any) {
        if (node.type === "text" && node.text) {
            texts.push(node.text);
        }
        if (node.content && Array.isArray(node.content)) {
            for (const child of node.content) {
                walk(child);
            }
        }
    }

    walk(content);
    return texts.join(" ");
}

/**
 * 为帖子生成 1024 维度的 Embedding 并保存到数据库
 * 自动兼容：火山引擎豆包模型 与 Cohere 国际模型
 */
export async function generatePostEmbedding(postId: string) {
    const supabase = await createClient();

    // 1. 获取帖子内容
    const { data: post, error: postError } = await supabase
        .from("posts")
        .select("id, title, content, tags")
        .eq("id", postId)
        .single();

    if (postError || !post) {
        console.error(`[generatePostEmbedding] 帖子不存在: ${postId}`, postError);
        return { error: "帖子不存在" };
    }

    // 2. 提取纯文本内容并拼接为 Embedding 输入
    const plainText = extractPlainText(post.content);
    const textToEmbed = `${post.title}\n\n${post.tags?.join(", ") || ""}\n\n${plainText}`.slice(0, 8000);

    // 3. 读取环境变量 (默认退回到 Cohere API，极速免实名开箱即用)
    const apiUrl = process.env.EMBEDDING_API_URL || "https://api.cohere.com/v1/embed";
    const apiKey = process.env.EMBEDDING_API_KEY;
    const modelName = process.env.EMBEDDING_MODEL || (apiUrl.includes("cohere") ? "embed-multilingual-v3.0" : undefined);

    if (!apiKey) {
        console.warn("[generatePostEmbedding] 未配置 EMBEDDING_API_KEY，跳过向量化并降级为本地标签检索");
        return { error: "未配置 AI 向量服务密钥" };
    }

    const isCohere = apiUrl.includes("cohere.com");

    try {
        let requestBody: Record<string, any>;
        
        // 自动适配请求格式
        if (isCohere) {
            requestBody = {
                model: modelName,
                texts: [textToEmbed],
                input_type: "search_document",
            };
        } else {
            // 火山方舟/OpenAI 兼容格式
            requestBody = {
                model: modelName,
                input: textToEmbed,
            };
        }

        const embeddingRes = await fetch(apiUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify(requestBody),
        });

        if (!embeddingRes.ok) {
            const errBody = await embeddingRes.text();
            console.error(`[generatePostEmbedding] 向量服务 API 错误: ${errBody}`);
            return { error: "Embedding 生成失败" };
        }

        const embeddingData = await embeddingRes.json();
        let embedding: number[] | undefined;

        // 自动适配返回报文解析
        if (isCohere) {
            embedding = embeddingData.embeddings?.[0];
        } else {
            embedding = embeddingData.data?.[0]?.embedding;
        }

        if (!embedding || !Array.isArray(embedding)) {
            console.error("[generatePostEmbedding] 向量结果为空或格式不正确", embeddingData);
            return { error: "向量为空" };
        }

        // 校验向量维度，必须为 1024 维
        if (embedding.length !== 1024) {
            console.warn(`[generatePostEmbedding] 警告：获取的向量维度为 ${embedding.length} 维，而不是系统预设的 1024 维。`);
        }

        // 4. 更新帖子的 embedding
        const { error: updateError } = await supabase
            .from("posts")
            .update({ embedding: JSON.stringify(embedding) })
            .eq("id", postId);

        if (updateError) {
            console.error("[generatePostEmbedding] 保存向量到数据库失败:", updateError);
            return { error: "保存向量失败" };
        }

        console.log(`[generatePostEmbedding] 帖子 ${postId} 成功生成并更新了 1024 维 Embedding (来源: ${isCohere ? 'Cohere' : '豆包/OpenAI兼容'})`);
        return { success: true };
    } catch (err) {
        console.error("[generatePostEmbedding] 捕获到内部错误:", err);
        return { error: "内部错误" };
    }
}
