import { requireAdmin } from "@/lib/admin/permissions";
import {
  getPendingReviewPosts,
  getPendingReviewComments,
  getReviewStats,
} from "@/lib/admin/review-actions";
import { ReviewClient } from "./ReviewClient";

export default async function AdminReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; risk?: string; tab?: string }>;
}) {
  await requireAdmin("moderator");
  const params = await searchParams;

  const page = parseInt(params.page ?? "1");
  const search = params.search ?? "";
  const risk = params.risk ?? "";
  const currentTab = params.tab === "comments" ? "comments" : "posts";

  const [stats, postsResult, commentsResult] = await Promise.all([
    getReviewStats(),
    getPendingReviewPosts({
      page: currentTab === "posts" ? page : 1,
      search: currentTab === "posts" ? search : "",
      riskLevel: risk,
    }),
    getPendingReviewComments({
      page: currentTab === "comments" ? page : 1,
      search: currentTab === "comments" ? search : "",
      riskLevel: risk,
    }),
  ]);

  return (
    <ReviewClient
      stats={stats}
      posts={postsResult.posts}
      postsTotalCount={postsResult.totalCount}
      postsCurrentPage={postsResult.currentPage}
      comments={commentsResult.comments}
      commentsTotalCount={commentsResult.totalCount}
      commentsCurrentPage={commentsResult.currentPage}
      pageSize={postsResult.pageSize}
      search={search}
      riskFilter={risk}
      activeTab={currentTab}
    />
  );
}

