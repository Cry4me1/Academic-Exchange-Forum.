import { requireAdmin } from "@/lib/admin/permissions";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { UserDetailClient } from "./UserDetailClient";

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireAdmin("moderator");

  const supabase = await createClient();

  // 1. 获取用户信息
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single();

  if (!profile) {
    notFound();
  }

  // 2. 获取用户帖子统计
  const { count: postsCount } = await supabase
    .from("posts")
    .select("id", { count: "exact", head: true })
    .eq("author_id", id);

  // 3. 获取用户评论统计
  const { count: commentsCount } = await supabase
    .from("comments")
    .select("id", { count: "exact", head: true })
    .eq("author_id", id);

  // 获取该用户的帖子ID
  const { data: userPosts } = await supabase.from("posts").select("id").eq("author_id", id);
  const postIds = (userPosts ?? []).map((p) => p.id);

  // 获取该用户的评论ID
  const { data: userComments } = await supabase.from("comments").select("id").eq("author_id", id);
  const commentIds = (userComments ?? []).map((c) => c.id);

  const targetIds = [id, ...postIds, ...commentIds];

  // 4. 获取用户收到的举报 (针对其账号、帖子、评论)
  let reportsAgainst: any[] = [];
  if (targetIds.length > 0) {
    const { data } = await supabase
      .from("reports")
      .select("id, status, reason, created_at, reporter_id, target_type")
      .in("target_id", targetIds)
      .order("created_at", { ascending: false });
    reportsAgainst = data ?? [];
  }

  // 获取举报人信息
  const reporterIds = [...new Set((reportsAgainst ?? []).map((r) => r.reporter_id))];
  let reportersMap: Record<string, any> = {};
  if (reporterIds.length > 0) {
    const { data: reporters } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url")
      .in("id", reporterIds);
    reportersMap = Object.fromEntries((reporters ?? []).map((r) => [r.id, r]));
  }

  // 5. 获取管理操作日志
  const { data: actionLogs } = await supabase
    .from("admin_action_logs")
    .select("id, action_type, details, created_at, admin_id")
    .eq("target_type", "user")
    .eq("target_id", id)
    .order("created_at", { ascending: false });

  // 获取操作管理员信息
  const adminIds = [...new Set((actionLogs ?? []).map((l) => l.admin_id))];
  let adminsMap: Record<string, any> = {};
  if (adminIds.length > 0) {
    const { data: admins } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url")
      .in("id", adminIds);
    adminsMap = Object.fromEntries((admins ?? []).map((a) => [a.id, a]));
  }

  return (
    <UserDetailClient
      profile={profile}
      stats={{
        posts: postsCount ?? 0,
        comments: commentsCount ?? 0,
      }}
      reports={reportsAgainst ?? []}
      reportersMap={reportersMap}
      actionLogs={actionLogs ?? []}
      adminsMap={adminsMap}
    />
  );
}
