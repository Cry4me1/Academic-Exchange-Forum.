import { requireAdmin } from "@/lib/admin/permissions";
import { createClient } from "@/lib/supabase/server";
import { LogsClient } from "./LogsClient";

export default async function AdminLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; action?: string }>;
}) {
  await requireAdmin("admin");
  const params = await searchParams;

  const supabase = await createClient();
  const page = parseInt(params.page ?? "1");
  const pageSize = 30;
  const actionFilter = params.action ?? "";

  let query = supabase
    .from("admin_action_logs")
    .select("*", { count: "exact" });

  if (actionFilter && actionFilter !== "all") {
    query = query.eq("action_type", actionFilter);
  }

  const { data: logs, count } = await query
    .order("created_at", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  // Fetch admin profiles
  const adminIds = [...new Set((logs ?? []).map((l) => l.admin_id))];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url")
    .in("id", adminIds);

  const profileMap = Object.fromEntries(
    (profiles ?? []).map((p) => [p.id, p])
  );

  return (
    <LogsClient
      logs={logs ?? []}
      totalCount={count ?? 0}
      currentPage={page}
      pageSize={pageSize}
      actionFilter={actionFilter}
      profileMap={profileMap}
    />
  );
}
