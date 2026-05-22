import { getCachedTrendingPosts } from "@/lib/cache";
import TrendingClient from "./TrendingClient";
import type { TrendingPost } from "./TrendingClient";

/**
 * 热门学术页面 - Server Component
 * 使用缓存的数据（5分钟TTL），避免每个用户都独立查询东京数据库
 * 
 * 性能提升:
 *   之前: 每个用户在浏览器中独立发起 Supabase 查询 (~150ms 从中国)
 *   现在: 使用 unstable_cache 缓存，5分钟内共享同一份数据 (~0ms 缓存命中)
 */
export default async function TrendingPage() {
    // 服务端获取带缓存的热门帖子（默认按热度排序）
    const posts = await getCachedTrendingPosts("hot", 30);

    return <TrendingClient initialPosts={posts as unknown as TrendingPost[]} />;
}
