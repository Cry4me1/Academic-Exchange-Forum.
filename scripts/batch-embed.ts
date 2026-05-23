import { readFileSync } from "fs";
import { resolve } from "path";

// 1. 手动解析 .env.local 环境变量 (免除外部 dotenv 模块依赖，极大增强兼容性)
try {
    const envPath = resolve(process.cwd(), ".env.local");
    const envContent = readFileSync(envPath, "utf-8");
    envContent.split("\n").forEach((line) => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith("#")) {
            const index = trimmed.indexOf("=");
            if (index !== -1) {
                const key = trimmed.substring(0, index).trim();
                let val = trimmed.substring(index + 1).trim();
                // 剔除可能存在的包裹引号
                if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
                    val = val.substring(1, val.length - 1);
                }
                process.env[key] = val;
            }
        }
    });
    console.log("📝 成功加载并解析 .env.local 本地环境变量配置。");
} catch (e) {
    console.warn("⚠️ 未能成功自动加载 .env.local 文件，将直接使用系统环境变量运行。");
}

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("错误：未在环境变量中寻找到有效的 Supabase 密钥，请确认 .env.local 配置！");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * 纯文本提取逻辑 (Tiptap JSON -> 纯文本，零依赖)
 */
function extractPlainText(content: unknown): string {
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
 * 执行单条向量化请求与数据库存入
 */
async function embedPost(post: any) {
    const plainText = extractPlainText(post.content);
    const textToEmbed = `${post.title}\n\n${post.tags?.join(", ") || ""}\n\n${plainText}`.slice(0, 8000);

    const apiUrl = process.env.EMBEDDING_API_URL || "https://api.cohere.com/v1/embed";
    const apiKey = process.env.EMBEDDING_API_KEY;
    const modelName = process.env.EMBEDDING_MODEL || (apiUrl.includes("cohere") ? "embed-multilingual-v3.0" : undefined);

    if (!apiKey) {
        return { error: "未配置 EMBEDDING_API_KEY，请检查 .env.local 变量" };
    }

    const isCohere = apiUrl.includes("cohere.com");
    let requestBody: Record<string, any>;

    if (isCohere) {
        requestBody = {
            model: modelName,
            texts: [textToEmbed],
            input_type: "search_document",
        };
    } else {
        requestBody = {
            model: modelName,
            input: textToEmbed,
        };
    }

    const res = await fetch(apiUrl, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(requestBody),
    });

    if (!res.ok) {
        const errBody = await res.text();
        return { error: `API 接口错误: ${res.status} - ${errBody}` };
    }

    const resData = await res.json();
    let embedding: number[] | undefined;

    if (isCohere) {
        embedding = resData.embeddings?.[0];
    } else {
        embedding = resData.data?.[0]?.embedding;
    }

    if (!embedding || !Array.isArray(embedding)) {
        return { error: "向量解析为空" };
    }

    // 写入 Supabase 数据库
    const { error: updateError } = await supabase
        .from("posts")
        .update({ embedding: JSON.stringify(embedding) })
        .eq("id", post.id);

    if (updateError) {
        return { error: `数据库更新失败: ${updateError.message}` };
    }

    return { success: true };
}

async function run() {
    console.log("==================================================");
    console.log("🚀 Scholarly 历史数据批量 Embedding 向量刷入系统");
    console.log("==================================================");

    console.log("扫描尚未生成向量的帖子数据中...");
    const { data: posts, error } = await supabase
        .from("posts")
        .select("id, title, content, tags")
        .is("embedding", null);

    if (error || !posts) {
        console.error("读取数据库失败:", error);
        process.exit(1);
    }

    if (posts.length === 0) {
        console.log("✨ 扫描完毕：没有发现遗留的历史帖子，全部帖子均已拥有向量数据！");
        process.exit(0);
    }

    console.log(`发现共有 ${posts.length} 篇帖子需要生成向量。开始批量同步...\n`);

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < posts.length; i++) {
        const post = posts[i];
        console.log(`[${i + 1}/${posts.length}] 正在生成: "${post.title}" (ID: ${post.id})`);
        
        try {
            const result = await embedPost(post);
            if (result.success) {
                successCount++;
                console.log("   ✅ 成功同步至数据库！");
            } else {
                failCount++;
                console.error(`   ❌ 失败: ${result.error}`);
            }
        } catch (err: any) {
            failCount++;
            console.error(`   ❌ 抛出异常: ${err.message || err}`);
        }

        // 🛡️ 频控防御延时：每次请求后休眠 600ms，以防触发 Cohere Trial Key 的频控机制
        await new Promise(resolve => setTimeout(resolve, 600));
    }

    console.log("\n==================================================");
    console.log("🎉 历史数据批量向量化导入全部结束！");
    console.log(`总计扫描: ${posts.length} 篇 | 成功: ${successCount} 篇 | 失败: ${failCount} 篇`);
    console.log("==================================================");
}

run().catch(console.error);
