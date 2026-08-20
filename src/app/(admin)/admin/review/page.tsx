import { requireAdmin } from "@/lib/admin/permissions";
import { getPendingReviewPosts, getReviewStats } from "@/lib/admin/review-actions";
import { ReviewClient } from "./ReviewClient";

export default async function AdminReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; risk?: string }>;
}) {
  await requireAdmin("moderator");
  const params = await searchParams;

  const page = parseInt(params.page ?? "1");
  const search = params.search ?? "";
  const risk = params.risk ?? "";

  const [stats, result] = await Promise.all([
    getReviewStats(),
    getPendingReviewPosts({
      page,
      search,
      riskLevel: risk,
    }),
  ]);

  return (
    <ReviewClient
      stats={stats}
      posts={result.posts}
      totalCount={result.totalCount}
      currentPage={result.currentPage}
      pageSize={result.pageSize}
      search={search}
      riskFilter={risk}
    />
  );
}
