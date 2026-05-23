import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generatePostEmbedding } from "@/lib/post-embed";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const force = searchParams.get("force") === "true"; // 是否强制重新生成所有帖子的 Embedding
        
        const supabase = await createClient();

        // 1. 权限拦截 (仅允许开发环境下执行，或生产环境下要求匹配管理员秘钥)
        const secret = searchParams.get("secret");
        const isDev = process.env.NODE_ENV === "development";
        const adminSecret = process.env.ADMIN_SECRET || "scholarly_dev_secret_2026";
        
        if (!isDev && secret !== adminSecret) {
            return NextResponse.json({ error: "无权访问此敏感管理接口" }, { status: 403 });
        }

        // 2. 查询需要生成向量的帖子
        let query = supabase.from("posts").select("id, title");
        
        if (!force) {
            // 默认情况下仅查询尚未生成向量的历史帖子
            query = query.is("embedding", null);
        }

        const { data: posts, error: fetchError } = await query;

        if (fetchError || !posts) {
            console.error("[batch-embed] 获取帖子列表失败:", fetchError);
            return NextResponse.json({ error: "获取帖子列表失败" }, { status: 500 });
        }

        if (posts.length === 0) {
            return NextResponse.json({
                message: "未发现需要处理的帖子。历史数据已是最新状态！",
                total_processed: 0,
            });
        }

        console.log(`[batch-embed] 正在批量为 ${posts.length} 篇帖子生成 1024 维 Embedding...`);

        const results = {
            total: posts.length,
            success: 0,
            failed: 0,
            details: [] as Array<{ id: string; title: string; success: boolean; error?: string }>
        };

        // 3. 循环逐个调用生成逻辑 (配以 Rate Limit 防御性延时)
        for (const post of posts) {
            try {
                const result = await generatePostEmbedding(post.id);
                
                if (result.success) {
                    results.success++;
                    results.details.push({ id: post.id, title: post.title, success: true });
                } else {
                    results.failed++;
                    results.details.push({ id: post.id, title: post.title, success: false, error: result.error });
                }
            } catch (err: any) {
                results.failed++;
                results.details.push({ id: post.id, title: post.title, success: false, error: err.message || "未知异常" });
            }

            // 🛡️ 延时防御：每次请求后休眠 600ms，以防触发 Cohere Trial Key 的频率限制（Rate Limit）
            await new Promise(resolve => setTimeout(resolve, 600));
        }

        console.log(`[batch-embed] 批量向量化已完成。成功: ${results.success}, 失败: ${results.failed}`);

        return NextResponse.json({
            message: "批量历史帖子向量化执行完毕",
            results
        });

    } catch (err: any) {
        console.error("Batch embed API error:", err);
        return NextResponse.json({ error: "内部服务器错误", details: err.message }, { status: 500 });
    }
}
