import { Hero } from "@/components/landing/hero";
import { Features } from "@/components/landing/features";
import { Footer } from "@/components/landing/footer";
import { CursorFollower } from "@/components/landing/cursor-follower";
import { getCachedStats, getCachedTrendingPosts, getCachedLatestPosts } from "@/lib/cache";

export default async function Home() {
  const stats = await getCachedStats();
  const rawTrendingPosts = await getCachedTrendingPosts("hot", 6);
  const rawLatestPosts = await getCachedLatestPosts(6);

  // 优先采用热门前沿研讨，兜底采用最新帖子
  const rawPosts = rawTrendingPosts && rawTrendingPosts.length > 0 ? rawTrendingPosts : rawLatestPosts;

  const hotTopics = rawPosts.map((post) => {
    const authorObj = (Array.isArray(post.author) ? post.author[0] : post.author) as any;
    return {
      id: post.id,
      title: post.title,
      content: typeof post.content === "string" ? post.content : JSON.stringify(post.content || ""),
      tags: post.tags || [],
      created_at: post.created_at || "",
      view_count: post.view_count || 0,
      comment_count: post.comment_count || 0,
      like_count: post.like_count || 0,
      author: {
        id: authorObj?.id || "",
        username: authorObj?.username || "学者",
        avatar_url: authorObj?.avatar_url || null,
        special_title: authorObj?.special_title || "同行评议学者",
      },
    };
  });

  return (
    <main className="min-h-screen relative">
      {/* 极度丝滑的 Lerp 全局光标跟随特效 */}
      <CursorFollower />

      <Hero 
        postsCount={stats.postsCount} 
        tagsCount={stats.tagsCount} 
        hotTopics={hotTopics}
      />
      <Features />
      <Footer />
    </main>
  );
}
