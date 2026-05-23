import { SupabaseClient } from "@supabase/supabase-js";

/**
 * 从 Tiptap JSON 内容中解析 WikiLink 节点，提取所有 target post IDs，
 * 然后同步到 post_links 关联表（先删除旧记录再插入新记录）。
 */
export async function syncPostLinks(
    supabase: SupabaseClient,
    sourcePostId: string,
    content: unknown
): Promise<void> {
    // 1. 从内容中提取所有 wiki-link 节点的 postId
    const targetPostIds = extractWikiLinkIds(content);

    // 2. 去重（排除引用自己）
    const uniqueTargetIds = [...new Set(targetPostIds)].filter(
        (id) => id !== sourcePostId
    );

    // 3. 删除该帖子现有的所有外链记录
    await supabase
        .from("post_links")
        .delete()
        .eq("source_post_id", sourcePostId);

    // 4. 如果没有链接则结束
    if (uniqueTargetIds.length === 0) return;

    // 5. 批量插入新的链接记录
    const records = uniqueTargetIds.map((targetId) => ({
        source_post_id: sourcePostId,
        target_post_id: targetId,
    }));

    const { error } = await supabase.from("post_links").insert(records);

    if (error) {
        console.error("Failed to sync post links:", error);
    }
}

/**
 * 递归遍历 Tiptap JSON 内容树，提取所有 wikiLink 节点的 postId 属性
 */
function extractWikiLinkIds(content: unknown): string[] {
    const ids: string[] = [];

    function walk(node: any) {
        if (!node || typeof node !== "object") return;

        if (node.type === "wikiLink" && node.attrs?.postId) {
            ids.push(node.attrs.postId);
        }

        if (Array.isArray(node.content)) {
            for (const child of node.content) {
                walk(child);
            }
        }
    }

    walk(content);
    return ids;
}
