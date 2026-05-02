import { requireAdmin } from "@/lib/admin/permissions";
import { createClient } from "@/lib/supabase/server";
import { PostsClient } from "./PostsClient";

export default async function AdminPostsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; status?: string }>;
}) {
  await requireAdmin("moderator");
  const params = await searchParams;

  const supabase = await createClient();
  const page = parseInt(params.page ?? "1");
  const pageSize = 20;
  const search = params.search ?? "";
  const statusFilter = params.status ?? "";

  let query = supabase
    .from("posts")
    .select(
      "id, title, author_id, created_at, updated_at, view_count, like_count, comment_count, is_published, is_pinned, is_locked, is_hidden, tags, profiles!posts_author_id_fkey(full_name, username, avatar_url)",
      { count: "exact" }
    );

  if (search) {
    query = query.ilike("title", `%${search}%`);
  }

  if (statusFilter === "hidden") {
    query = query.eq("is_hidden", true);
  } else if (statusFilter === "pinned") {
    query = query.eq("is_pinned", true);
  } else if (statusFilter === "locked") {
    query = query.eq("is_locked", true);
  }

  const { data: posts, count } = await query
    .order("created_at", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  const formattedPosts = (posts ?? []).map((post: any) => ({
    ...post,
    profiles: Array.isArray(post.profiles) ? post.profiles[0] : post.profiles,
  }));

  return (
    <PostsClient
      posts={formattedPosts as any}
      totalCount={count ?? 0}
      currentPage={page}
      pageSize={pageSize}
      search={search}
      statusFilter={statusFilter}
    />
  );
}
