"use server";

import { createClient } from "@/lib/supabase/server";

export interface DashboardStats {
  totalUsers: number;
  newUsersToday: number;
  activeUsers7d: number;
  totalPosts: number;
  postsToday: number;
  totalComments: number;
  commentsToday: number;
  totalDuels: number;
  activeDuels: number;
  totalCreditsBalance: number;
  totalCreditsSpent: number;
  totalCreditsRecharged: number;
  pendingReports: number;
  totalMessages: number;
}

export interface TrendDataPoint {
  date: string;
  users: number;
  posts: number;
  comments: number;
}

export interface RecentUser {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  email: string | null;
  created_at: string;
  vip_level: number;
  is_banned: boolean;
}

export interface RecentPost {
  id: string;
  title: string;
  author_id: string;
  author_name: string | null;
  created_at: string;
  view_count: number;
  like_count: number;
  comment_count: number;
  is_hidden: boolean;
}

export interface RecentReport {
  id: string;
  reporter_name: string | null;
  target_type: string;
  reason: string;
  status: string;
  created_at: string;
}

/**
 * 获取仪表盘统计数据
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = await createClient();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayISO = today.toISOString();

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysAgoISO = sevenDaysAgo.toISOString();

  // 并行查询所有统计数据
  const [
    usersResult,
    newUsersResult,
    activeUsersResult,
    postsResult,
    postsTodayResult,
    commentsResult,
    commentsTodayResult,
    duelsResult,
    activeDuelsResult,
    creditsResult,
    reportsResult,
    messagesResult,
  ] = await Promise.all([
    // 总用户数
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    // 今日新增用户
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .gte("created_at", todayISO),
    // 7日活跃用户（发帖或评论）
    supabase.rpc("get_active_users_count", { days_ago: 7 }).single(),
    // 总帖子数
    supabase.from("posts").select("id", { count: "exact", head: true }),
    // 今日帖子
    supabase
      .from("posts")
      .select("id", { count: "exact", head: true })
      .gte("created_at", todayISO),
    // 总评论数
    supabase.from("comments").select("id", { count: "exact", head: true }),
    // 今日评论
    supabase
      .from("comments")
      .select("id", { count: "exact", head: true })
      .gte("created_at", todayISO),
    // 总对决数
    supabase.from("duels").select("id", { count: "exact", head: true }),
    // 活跃对决
    supabase
      .from("duels")
      .select("id", { count: "exact", head: true })
      .eq("status", "active"),
    // 积分统计
    supabase
      .from("user_credits")
      .select("balance, total_spent, total_recharged"),
    // 待处理举报
    supabase
      .from("reports")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    // 消息总数
    supabase.from("messages").select("id", { count: "exact", head: true }),
  ]);

  // 计算积分总数
  const creditsData = creditsResult.data ?? [];
  const totalCreditsBalance = creditsData.reduce(
    (sum, c) => sum + (c.balance ?? 0),
    0
  );
  const totalCreditsSpent = creditsData.reduce(
    (sum, c) => sum + (c.total_spent ?? 0),
    0
  );
  const totalCreditsRecharged = creditsData.reduce(
    (sum, c) => sum + (c.total_recharged ?? 0),
    0
  );

  return {
    totalUsers: usersResult.count ?? 0,
    newUsersToday: newUsersResult.count ?? 0,
    activeUsers7d: (activeUsersResult.data as unknown as number) ?? 0,
    totalPosts: postsResult.count ?? 0,
    postsToday: postsTodayResult.count ?? 0,
    totalComments: commentsResult.count ?? 0,
    commentsToday: commentsTodayResult.count ?? 0,
    totalDuels: duelsResult.count ?? 0,
    activeDuels: activeDuelsResult.count ?? 0,
    totalCreditsBalance,
    totalCreditsSpent,
    totalCreditsRecharged,
    pendingReports: reportsResult.count ?? 0,
    totalMessages: messagesResult.count ?? 0,
  };
}

/**
 * 获取过去 N 天的趋势数据
 */
export async function getTrendData(days: number = 14): Promise<TrendDataPoint[]> {
  const supabase = await createClient();

  const result: TrendDataPoint[] = [];
  const now = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    const [usersRes, postsRes, commentsRes] = await Promise.all([
      supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .gte("created_at", dayStart.toISOString())
        .lte("created_at", dayEnd.toISOString()),
      supabase
        .from("posts")
        .select("id", { count: "exact", head: true })
        .gte("created_at", dayStart.toISOString())
        .lte("created_at", dayEnd.toISOString()),
      supabase
        .from("comments")
        .select("id", { count: "exact", head: true })
        .gte("created_at", dayStart.toISOString())
        .lte("created_at", dayEnd.toISOString()),
    ]);

    result.push({
      date: `${date.getMonth() + 1}/${date.getDate()}`,
      users: usersRes.count ?? 0,
      posts: postsRes.count ?? 0,
      comments: commentsRes.count ?? 0,
    });
  }

  return result;
}

/**
 * 获取最近注册的用户
 */
export async function getRecentUsers(limit: number = 5): Promise<RecentUser[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("profiles")
    .select(
      "id, full_name, username, avatar_url, email, created_at, vip_level, is_banned"
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []) as RecentUser[];
}

/**
 * 获取最近的帖子
 */
export async function getRecentPosts(
  limit: number = 5
): Promise<RecentPost[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("posts")
    .select(
      "id, title, author_id, created_at, view_count, like_count, comment_count, is_hidden, profiles!posts_author_id_fkey(full_name)"
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []).map((post) => ({
    id: post.id,
    title: post.title,
    author_id: post.author_id,
    author_name: (post.profiles as unknown as { full_name: string | null })
      ?.full_name ?? null,
    created_at: post.created_at!,
    view_count: post.view_count ?? 0,
    like_count: post.like_count ?? 0,
    comment_count: post.comment_count ?? 0,
    is_hidden: post.is_hidden ?? false,
  }));
}

/**
 * 获取最近的举报
 */
export async function getRecentReports(
  limit: number = 5
): Promise<RecentReport[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("reports")
    .select(
      "id, target_type, reason, status, created_at, reporter_id"
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (!data || data.length === 0) return [];

  // 获取举报者信息
  const reporterIds = [...new Set(data.map((r) => r.reporter_id))];
  const { data: reporters } = await supabase
    .from("profiles")
    .select("id, full_name")
    .in("id", reporterIds);

  const reporterMap = new Map(
    (reporters ?? []).map((r) => [r.id, r.full_name])
  );

  return data.map((report) => ({
    id: report.id,
    reporter_name: reporterMap.get(report.reporter_id) ?? "未知用户",
    target_type: report.target_type,
    reason: report.reason,
    status: report.status,
    created_at: report.created_at!,
  }));
}
