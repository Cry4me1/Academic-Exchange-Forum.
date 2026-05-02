import { requireAdmin } from "@/lib/admin/permissions";
import { createClient } from "@/lib/supabase/server";
import { UsersClient } from "./UsersClient";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; vip?: string }>;
}) {
  await requireAdmin("moderator");
  const params = await searchParams;

  const supabase = await createClient();
  const page = parseInt(params.page ?? "1");
  const pageSize = 20;
  const search = params.search ?? "";
  const vipFilter = params.vip ?? "";

  let query = supabase
    .from("profiles")
    .select(
      "id, full_name, username, avatar_url, email, created_at, vip_level, is_banned, is_muted, muted_until, reputation_score, is_developer",
      { count: "exact" }
    );

  if (search) {
    query = query.or(
      `full_name.ilike.%${search}%,username.ilike.%${search}%,email.ilike.%${search}%`
    );
  }

  if (vipFilter) {
    query = query.eq("vip_level", parseInt(vipFilter));
  }

  const { data: users, count } = await query
    .order("created_at", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  return (
    <UsersClient
      users={users ?? []}
      totalCount={count ?? 0}
      currentPage={page}
      pageSize={pageSize}
      search={search}
      vipFilter={vipFilter}
    />
  );
}
