"use client";

import { StatsCard } from "@/components/admin/StatsCard";
import { AdminTrendChart } from "@/components/admin/charts/AdminTrendChart";
import {
  Users,
  FileText,
  MessageSquare,
  Swords,
  Coins,
  AlertTriangle,
  UserPlus,
  Activity,
  Mail,
  Eye,
  Heart,
  TrendingUp,
} from "lucide-react";
import type {
  DashboardStats,
  TrendDataPoint,
  RecentUser,
  RecentPost,
  RecentReport,
} from "@/lib/admin/queries";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { formatDistanceToNow } from "@/lib/utils";

interface DashboardClientProps {
  stats: DashboardStats;
  trendData: TrendDataPoint[];
  recentUsers: RecentUser[];
  recentPosts: RecentPost[];
  recentReports: RecentReport[];
}

const reasonLabels: Record<string, string> = {
  spam: "垃圾信息",
  inappropriate: "不当内容",
  harassment: "骚扰攻击",
  misinformation: "虚假信息",
  copyright: "侵犯版权",
  other: "其他",
};

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "待处理", variant: "destructive" },
  reviewing: { label: "审核中", variant: "default" },
  resolved: { label: "已处理", variant: "secondary" },
  rejected: { label: "已驳回", variant: "outline" },
};

export function DashboardClient({
  stats,
  trendData,
  recentUsers,
  recentPosts,
  recentReports,
}: DashboardClientProps) {
  return (
    <div className="animate-fade-in space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-xl border border-border/50 bg-gradient-to-r from-violet-500/10 via-purple-500/5 to-fuchsia-500/10 p-6">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-violet-500/10 blur-3xl" />
        <div className="absolute -left-10 -bottom-10 h-40 w-40 rounded-full bg-fuchsia-500/10 blur-3xl" />
        <div className="relative">
          <h2 className="text-xl font-bold">
            欢迎回来 👋
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            以下是 Scholarly 平台的实时概览。今天需要处理{" "}
            <span className="font-semibold text-orange-500">
              {stats.pendingReports}
            </span>{" "}
            条待审核举报。
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="总用户数"
          value={stats.totalUsers}
          icon={<Users className="h-5 w-5 text-violet-600 dark:text-violet-400" />}
          gradient="from-violet-500/10 to-purple-500/10"
          trend={{
            value: stats.newUsersToday,
            label: "今日新增",
          }}
        />
        <StatsCard
          title="帖子总量"
          value={stats.totalPosts}
          icon={<FileText className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />}
          gradient="from-cyan-500/10 to-blue-500/10"
          trend={{
            value: stats.postsToday,
            label: "今日发布",
          }}
        />
        <StatsCard
          title="评论总量"
          value={stats.totalComments}
          icon={<MessageSquare className="h-5 w-5 text-amber-600 dark:text-amber-400" />}
          gradient="from-amber-500/10 to-orange-500/10"
          trend={{
            value: stats.commentsToday,
            label: "今日评论",
          }}
        />
        <StatsCard
          title="待处理举报"
          value={stats.pendingReports}
          icon={<AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />}
          gradient="from-red-500/10 to-rose-500/10"
          subtitle="需要立即处理"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="7日活跃用户"
          value={stats.activeUsers7d}
          icon={<Activity className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />}
          gradient="from-emerald-500/10 to-green-500/10"
        />
        <StatsCard
          title="学术对决"
          value={stats.totalDuels}
          subtitle={`${stats.activeDuels} 场进行中`}
          icon={<Swords className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />}
          gradient="from-indigo-500/10 to-blue-500/10"
        />
        <StatsCard
          title="积分流通"
          value={stats.totalCreditsBalance.toLocaleString()}
          subtitle={`总消费 ${stats.totalCreditsSpent.toLocaleString()}`}
          icon={<Coins className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />}
          gradient="from-yellow-500/10 to-amber-500/10"
        />
        <StatsCard
          title="私信总量"
          value={stats.totalMessages}
          icon={<Mail className="h-5 w-5 text-pink-600 dark:text-pink-400" />}
          gradient="from-pink-500/10 to-rose-500/10"
        />
      </div>

      {/* Trend Chart */}
      <AdminTrendChart data={trendData} />

      {/* Recent Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Users */}
        <div className="rounded-xl border border-border/50 bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-violet-500" />
                最近注册
              </h3>
            </div>
            <Link
              href="/admin/users"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              查看全部 →
            </Link>
          </div>
          <div className="space-y-3">
            {recentUsers.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                暂无数据
              </p>
            )}
            {recentUsers.map((user) => (
              <Link
                key={user.id}
                href={`/admin/users/${user.id}`}
                className="flex items-center gap-3 rounded-lg px-2 py-2 -mx-2 hover:bg-accent/50 transition-colors group"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.avatar_url ?? undefined} />
                  <AvatarFallback className="bg-gradient-to-br from-violet-500 to-purple-600 text-white text-xs">
                    {user.full_name?.charAt(0) ?? "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                    {user.full_name ?? user.username ?? "未设置昵称"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(user.created_at)}
                  </p>
                </div>
                <Badge variant="outline" className="shrink-0 text-[10px]">
                  V{user.vip_level}
                </Badge>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Posts */}
        <div className="rounded-xl border border-border/50 bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-cyan-500" />
              最新帖子
            </h3>
            <Link
              href="/admin/posts"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              查看全部 →
            </Link>
          </div>
          <div className="space-y-3">
            {recentPosts.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                暂无数据
              </p>
            )}
            {recentPosts.map((post) => (
              <Link
                key={post.id}
                href={`/admin/posts/${post.id}`}
                className="block rounded-lg px-2 py-2 -mx-2 hover:bg-accent/50 transition-colors group"
              >
                <p className="text-sm font-medium truncate group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                  {post.title}
                </p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-muted-foreground">
                    {post.author_name ?? "匿名"}
                  </span>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-0.5">
                      <Eye className="h-3 w-3" />
                      {post.view_count}
                    </span>
                    <span className="flex items-center gap-0.5">
                      <Heart className="h-3 w-3" />
                      {post.like_count}
                    </span>
                    <span className="flex items-center gap-0.5">
                      <MessageSquare className="h-3 w-3" />
                      {post.comment_count}
                    </span>
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {formatDistanceToNow(post.created_at)}
                </p>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Reports */}
        <div className="rounded-xl border border-border/50 bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              最新举报
            </h3>
            <Link
              href="/admin/reports"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              查看全部 →
            </Link>
          </div>
          <div className="space-y-3">
            {recentReports.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                暂无举报 🎉
              </p>
            )}
            {recentReports.map((report) => (
              <Link
                key={report.id}
                href={`/admin/reports?status=${report.status}`}
                className="block rounded-lg px-2 py-2 -mx-2 hover:bg-accent/50 transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                    {reasonLabels[report.reason] ?? report.reason}
                  </span>
                  <Badge
                    variant={statusLabels[report.status]?.variant ?? "outline"}
                    className="text-[10px]"
                  >
                    {statusLabels[report.status]?.label ?? report.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                  <span>
                    {report.target_type === "post"
                      ? "帖子"
                      : report.target_type === "comment"
                        ? "评论"
                        : report.target_type === "user"
                          ? "用户"
                          : "消息"}
                  </span>
                  <span>·</span>
                  <span>举报人: {report.reporter_name}</span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {formatDistanceToNow(report.created_at)}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
