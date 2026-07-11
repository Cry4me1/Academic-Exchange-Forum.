import { NextRequest, NextResponse } from "next/server";
import { createPublicClient } from "@/lib/supabase/server";
import { generatePostEmbedding } from "@/lib/post-embed";

export const dynamic = "force-dynamic"; // ⚡ 强制动态渲染，打碎 Next.js 在服务端的强缓存

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const supabase = createPublicClient();

        console.log(`🔍 [recommendations-api] 正在请求帖子 ${id} 的相似推荐...`);

        // 1. 获取当前帖子的 embedding 向量与 tags 属性
        const { data: initialPost, error: postError } = await supabase
            .from("posts")
            .select("id, title, embedding, tags")
            .eq("id", id)
            .single();

        if (postError || !initialPost) {
            console.warn(`[recommendations-api] 帖子 ${id} 未找到，返回空推荐列表`);
            return NextResponse.json([]);
        }

        let post = initialPost;

        // 🌟 向量自愈：若发现当前帖子无向量数据，实时触发静默补全生成向量
        if (!post.embedding) {
            console.log(`[recommendations-api] 帖子 ${id} 无向量数据，启动实时静默补全...`);
            const embedRes = await generatePostEmbedding(id);
            if (embedRes.success) {
                // 重新拉取以加载最新的 embedding
                const { data: updatedPost } = await supabase
                    .from("posts")
                    .select("id, title, embedding, tags")
                    .eq("id", id)
                    .single();
                if (updatedPost && updatedPost.embedding) {
                    post = updatedPost;
                    console.log(`[recommendations-api] 帖子 ${id} 向量静默自愈成功，已加载 1024 维 Embedding。`);
                }
            } else {
                console.error(`[recommendations-api] 帖子 ${id} 向量静默自愈失败:`, embedRes.error);
            }
        }

        const currentTags = post.tags || [];
        console.log(`[recommendations-api] 当前帖子标题: "${post.title}", 标签:`, currentTags);

        // 2. 进阶学术维度发现算法
        const extractCommonConcepts = (pTags: string[], pTitle: string) => {
            // 2.1 优先提取公共交集标签
            let common = pTags.filter((t: string) => currentTags.includes(t));
            
            // 2.2 若无重合标签，匹配标题中共同的核心学术短词
            if (common.length === 0) {
                const keywords = ["数论", "图论", "算法", "求助", "Treap", "测试", "网络流", "平面图", "决斗", "编辑器", "指南", "性能", "卷积", "题解", "答案"];
                keywords.forEach(kw => {
                    if (post.title.includes(kw) && pTitle.includes(kw)) {
                        common.push(kw);
                    }
                });
            }
            
            // 2.3 若依然为空，兜底显示对方帖子的主分类领域标签
            if (common.length === 0 && pTags.length > 0) {
                common = pTags.slice(0, 2);
            }
            
            return common.slice(0, 3);
        };

        // 3. 判断是否存在 embedding 向量并调用 match_posts RPC 进行向量匹配
        if (post.embedding) {
            console.log(`[recommendations-api] 检测到向量，进行 HNSW 向量余弦相似匹配...`);
            const { data: recPosts, error: recError } = await supabase.rpc("match_posts", {
                query_embedding: post.embedding,
                match_threshold: 0.3,
                match_count: 5,
                current_post_id: id,
            });

            if (!recError && recPosts && recPosts.length > 0) {
                const formattedPosts = recPosts.map((p: any) => {
                    const concepts = extractCommonConcepts(p.tags || [], p.title);
                    console.log(`   ➡️ 匹配到帖子: "${p.title}" (相似度: ${Math.round(p.similarity * 100)}%), 提炼概念:`, concepts);
                    return {
                        ...p,
                        common_concepts: concepts,
                    };
                });
                return NextResponse.json(formattedPosts);
            }
            if (recError) {
                console.error("[recommendations-api] 向量匹配 RPC 发生错误:", recError);
            }
        }

        // 4. 降级方案：若无向量或向量匹配为空，优雅退回到本地标签交集匹配 (match_posts_by_tags)
        console.log(`[recommendations-api] 降级至标签交集相似推荐模式...`);
        const { data: backupPosts, error: backupError } = await supabase.rpc("match_posts_by_tags", {
            current_post_id: id,
            match_count: 5,
        });

        if (backupError) {
            console.error("[recommendations-api] 标签匹配 RPC 降级失败:", backupError);
            return NextResponse.json([]);
        }

        const formattedBackupPosts = (backupPosts || []).map((p: any) => {
            const concepts = extractCommonConcepts(p.tags || [], p.title);
            console.log(`   ➡️ (降级匹配) 帖子: "${p.title}", 提炼概念:`, concepts);
            return {
                ...p,
                similarity: 0.8,
                is_tag_match: true,
                common_concepts: concepts,
            };
        });

        return NextResponse.json(formattedBackupPosts);
    } catch (err) {
        console.error("Recommendations API Route error:", err);
        return NextResponse.json([], { status: 500 });
    }
}
