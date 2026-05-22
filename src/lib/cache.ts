import { unstable_cache } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/**
 * 缓存热门帖子列表 — 5 分钟刷新
 * 避免每个用户都独立查询东京数据库
 */
export const getCachedTrendingPosts = unstable_cache(
  async (sortBy: string = "hot", limit: number = 30) => {
    const supabase = await createClient();

    const orderColumn = sortBy === "likes" ? "like_count" : "view_count";

    const { data, error } = await supabase
      .from("posts")
      .select(
        `
        id, title, content, tags, created_at, view_count, like_count, comment_count,
        author:profiles!author_id (id, username, avatar_url)
      `
      )
      .eq("is_published", true)
      .eq("is_hidden", false)
      .order(orderColumn, { ascending: false })
      .order("like_count", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("getCachedTrendingPosts error:", error);
      return [];
    }

    if (sortBy === "hot" && data) {
      return data
        .map((post) => ({
          ...post,
          hotScore:
            (post.view_count || 0) * 1 +
            (post.like_count || 0) * 5 +
            (post.comment_count || 0) * 3,
        }))
        .sort(
          (a, b) =>
            (b as { hotScore: number }).hotScore -
            (a as { hotScore: number }).hotScore
        );
    }

    return data || [];
  },
  ["trending-posts"],
  { revalidate: 300, tags: ["trending"] }
);

/**
 * 缓存最新帖子 Feed — 1 分钟刷新
 */
export const getCachedLatestPosts = unstable_cache(
  async (limit: number = 20) => {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("posts")
      .select(
        `
        id, title, content, tags, created_at, updated_at,
        view_count, like_count, comment_count,
        author:profiles!author_id (id, username, full_name, avatar_url, special_title, badges)
      `
      )
      .eq("is_published", true)
      .eq("is_hidden", false)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("getCachedLatestPosts error:", error);
      return [];
    }

    return data || [];
  },
  ["latest-posts"],
  { revalidate: 60, tags: ["posts"] }
);

/**
 * 缓存公告 — 5 分钟刷新
 */
export const getCachedAnnouncements = unstable_cache(
  async () => {
    const supabase = await createClient();

    const { data } = await supabase
      .from("announcements")
      .select("*")
      .eq("is_active", true)
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(5);

    return data || [];
  },
  ["announcements"],
  { revalidate: 300, tags: ["announcements"] }
);

/**
 * 缓存热门标签 — 10 分钟刷新
 */
export const getCachedPopularTags = unstable_cache(
  async () => {
    const supabase = await createClient();

    // 从 posts 表聚合标签
    const { data: posts } = await supabase
      .from("posts")
      .select("tags")
      .eq("is_published", true)
      .eq("is_hidden", false)
      .order("created_at", { ascending: false })
      .limit(200);

    if (!posts) return [];

    // 统计标签频次
    const tagCount: Record<string, number> = {};
    posts.forEach((post) => {
      if (Array.isArray(post.tags)) {
        post.tags.forEach((tag: string) => {
          tagCount[tag] = (tagCount[tag] || 0) + 1;
        });
      }
    });

    return Object.entries(tagCount)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);
  },
  ["popular-tags"],
  { revalidate: 600, tags: ["tags"] }
);

/**
 * 缓存热门帖子列表（首页 StoryBanner）— 10 分钟刷新
 */
export const getCachedFeaturedPosts = unstable_cache(
  async () => {
    const supabase = await createClient();

    const { data } = await supabase
      .from("posts")
      .select(
        `
        id, title, tags, created_at, view_count, like_count,
        author:profiles!author_id (id, username, avatar_url)
      `
      )
      .eq("is_published", true)
      .eq("is_hidden", false)
      .order("like_count", { ascending: false })
      .limit(6);

    return data || [];
  },
  ["featured-posts"],
  { revalidate: 600, tags: ["posts"] }
);
