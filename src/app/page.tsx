import { Hero } from "@/components/landing/hero";
import { Features } from "@/components/landing/features";
import { Footer } from "@/components/landing/footer";
import { getCachedStats, getCachedTrendingPosts } from "@/lib/cache";

export default async function Home() {
  const stats = await getCachedStats();
  const rawHotTopics = await getCachedTrendingPosts("hot", 2);

  const hotTopics = rawHotTopics.map(post => ({
    id: post.id,
    title: post.title,
    comment_count: post.comment_count || 0,
    like_count: post.like_count || 0
  }));

  return (
    <main className="min-h-screen">
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
