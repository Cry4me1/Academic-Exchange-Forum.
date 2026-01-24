/**
 * 存储清理工具库
 * 用于在帖子/评论删除或更新时清理关联的图片资源
 */

import { deleteFromR2, isR2Url } from "@/lib/r2";
import { createClient } from "@/lib/supabase/server";

// 简化的 JSONContent 类型定义
interface JSONContentNode {
    type?: string;
    attrs?: Record<string, unknown>;
    content?: JSONContentNode[];
}

/**
 * 从 JSONContent 中提取所有图片 URL
 * @param content 帖子或评论的 JSON 内容
 * @returns 图片 URL 数组
 */
export function extractImageUrls(content: JSONContentNode | null | undefined): string[] {
    if (!content) return [];

    const urls: string[] = [];

    function traverse(node: JSONContentNode) {
        if (node.type === 'image' && node.attrs?.src && typeof node.attrs.src === 'string') {
            urls.push(node.attrs.src);
        }
        if (node.content && Array.isArray(node.content)) {
            node.content.forEach(traverse);
        }
    }

    traverse(content);
    return urls;
}

/**
 * 检查 URL 是否是 Supabase Storage URL
 */
function isSupabaseStorageUrl(url: string): boolean {
    return url.includes(".supabase.co/storage");
}

/**
 * 从 Supabase Storage URL 中提取文件路径
 */
function extractSupabaseFilePath(url: string): string | null {
    try {
        const urlObj = new URL(url);
        const pathParts = urlObj.pathname.split('/');
        const bucketIndex = pathParts.indexOf('post-images');

        if (bucketIndex === -1) {
            return null;
        }

        return pathParts.slice(bucketIndex + 1).join('/') || null;
    } catch {
        return null;
    }
}

/**
 * 批量删除存储中的图片
 * 支持 Supabase Storage 和 Cloudflare R2
 * 
 * @param urls 要删除的图片 URL 数组
 */
export async function deleteImages(urls: string[]): Promise<void> {
    if (urls.length === 0) return;

    const supabaseUrls: string[] = [];
    const r2Urls: string[] = [];

    // 按存储类型分类 URL
    for (const url of urls) {
        if (isR2Url(url)) {
            r2Urls.push(url);
        } else if (isSupabaseStorageUrl(url)) {
            supabaseUrls.push(url);
        } else {
            console.warn("[storage-cleanup] 未知的图片 URL 格式:", url);
        }
    }

    // 批量删除 Supabase Storage 图片
    if (supabaseUrls.length > 0) {
        try {
            const supabase = await createClient();
            const filePaths = supabaseUrls
                .map(extractSupabaseFilePath)
                .filter((path): path is string => path !== null);

            if (filePaths.length > 0) {
                const { error } = await supabase.storage
                    .from('post-images')
                    .remove(filePaths);

                if (error) {
                    console.error("[storage-cleanup] Supabase Storage 删除失败:", error);
                } else {
                    console.log(`[storage-cleanup] 已删除 ${filePaths.length} 个 Supabase 图片`);
                }
            }
        } catch (error) {
            console.error("[storage-cleanup] Supabase Storage 删除异常:", error);
        }
    }

    // 批量删除 R2 图片
    if (r2Urls.length > 0) {
        try {
            await Promise.all(r2Urls.map(deleteFromR2));
            console.log(`[storage-cleanup] 已删除 ${r2Urls.length} 个 R2 图片`);
        } catch (error) {
            console.error("[storage-cleanup] R2 删除异常:", error);
        }
    }
}

/**
 * 对比新旧内容，找出被移除的图片 URL
 * 
 * @param oldContent 旧的 JSON 内容
 * @param newContent 新的 JSON 内容
 * @returns 被移除的图片 URL 数组
 */
export function findRemovedImages(
    oldContent: JSONContentNode | null | undefined,
    newContent: JSONContentNode | null | undefined
): string[] {
    const oldUrls = new Set(extractImageUrls(oldContent));
    const newUrls = new Set(extractImageUrls(newContent));

    const removedUrls: string[] = [];
    oldUrls.forEach((url) => {
        if (!newUrls.has(url)) {
            removedUrls.push(url);
        }
    });

    return removedUrls;
}
