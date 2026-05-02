import { requireAdmin } from "@/lib/admin/permissions";
import { createClient } from "@/lib/supabase/server";
import { ReportsClient } from "./ReportsClient";

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string }>;
}) {
  await requireAdmin("moderator");
  const params = await searchParams;

  const supabase = await createClient();
  const page = parseInt(params.page ?? "1");
  const pageSize = 20;
  const statusFilter = params.status ?? "";

  let query = supabase
    .from("reports")
    .select("*", { count: "exact" });

  if (statusFilter && statusFilter !== "all") {
    query = query.eq("status", statusFilter);
  }

  const { data: reports, count } = await query
    .order("created_at", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  // Fetch reporter and handler profiles
  const userIds = new Set<string>();
  (reports ?? []).forEach((r) => {
    userIds.add(r.reporter_id);
    if (r.handled_by) userIds.add(r.handled_by);
  });

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url")
    .in("id", Array.from(userIds));

  const profileMap = Object.fromEntries(
    (profiles ?? []).map((p) => [p.id, p])
  );

  return (
    <ReportsClient
      reports={reports ?? []}
      totalCount={count ?? 0}
      currentPage={page}
      pageSize={pageSize}
      statusFilter={statusFilter}
      profileMap={profileMap}
    />
  );
}
