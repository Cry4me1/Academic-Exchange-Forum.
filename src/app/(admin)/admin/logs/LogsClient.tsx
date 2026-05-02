"use client";

import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ScrollText,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "@/lib/utils";

interface LogRow {
  id: string;
  admin_id: string;
  action_type: string;
  target_type: string;
  target_id: string | null;
  details: Record<string, unknown>;
  created_at: string;
}

interface ProfileInfo {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
}

interface LogsClientProps {
  logs: LogRow[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  actionFilter: string;
  profileMap: Record<string, ProfileInfo>;
}

const actionLabels: Record<string, { label: string; color: string }> = {
  user_banned: { label: "封禁用户", color: "bg-red-500/10 text-red-600 dark:text-red-400" },
  user_unbanned: { label: "解封用户", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  user_muted: { label: "禁言用户", color: "bg-orange-500/10 text-orange-600 dark:text-orange-400" },
  user_unmuted: { label: "解除禁言", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  post_hidden: { label: "隐藏帖子", color: "bg-red-500/10 text-red-600 dark:text-red-400" },
  post_unhidden: { label: "恢复帖子", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  post_pinned: { label: "置顶帖子", color: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
  post_unpinned: { label: "取消置顶", color: "bg-gray-500/10 text-gray-600 dark:text-gray-400" },
  post_locked: { label: "锁定评论", color: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
  post_unlocked: { label: "解锁评论", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  credits_adjusted: { label: "调整积分", color: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400" },
  report_handled: { label: "处理举报", color: "bg-violet-500/10 text-violet-600 dark:text-violet-400" },
  vip_level_adjusted: { label: "调整VIP", color: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
};

export function LogsClient({
  logs,
  totalCount,
  currentPage,
  pageSize,
  actionFilter: initialActionFilter,
  profileMap,
}: LogsClientProps) {
  const router = useRouter();
  const totalPages = Math.ceil(totalCount / pageSize);

  const handleFilter = (value: string) => {
    const params = new URLSearchParams();
    if (value && value !== "all") params.set("action", value);
    router.push(`/admin/logs?${params.toString()}`);
  };

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams();
    if (initialActionFilter) params.set("action", initialActionFilter);
    params.set("page", page.toString());
    router.push(`/admin/logs?${params.toString()}`);
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <ScrollText className="h-5 w-5 text-violet-500" />
            操作日志
          </h2>
          <p className="text-sm text-muted-foreground">
            共 {totalCount} 条记录
          </p>
        </div>
        <Select
          value={initialActionFilter || "all"}
          onValueChange={handleFilter}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="筛选操作" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部类型</SelectItem>
            {Object.entries(actionLabels).map(([key, config]) => (
              <SelectItem key={key} value={key}>
                {config.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Timeline */}
      <div className="space-y-2">
        {logs.length === 0 && (
          <div className="rounded-xl border border-border/50 bg-card p-12 text-center shadow-sm">
            <ScrollText className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">暂无操作日志</p>
          </div>
        )}
        {logs.map((log) => {
          const admin = profileMap[log.admin_id];
          const config = actionLabels[log.action_type] ?? {
            label: log.action_type,
            color: "bg-gray-500/10 text-gray-600",
          };
          const details = log.details as Record<string, unknown>;

          return (
            <div
              key={log.id}
              className="flex items-start gap-3 rounded-lg border border-border/30 bg-card px-4 py-3 hover:border-border/50 transition-colors"
            >
              <Avatar className="h-8 w-8 mt-0.5 shrink-0">
                <AvatarImage src={admin?.avatar_url ?? undefined} />
                <AvatarFallback className="text-xs bg-gradient-to-br from-violet-500 to-purple-600 text-white">
                  {admin?.full_name?.charAt(0) ?? "A"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium">
                    {admin?.full_name ?? "管理员"}
                  </span>
                  <Badge className={`text-[10px] border-0 ${config.color}`}>
                    {config.label}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(log.created_at)}
                  </span>
                </div>
                {details && Object.keys(details).length > 0 && (
                  <div className="mt-1 text-xs text-muted-foreground">
                    {!!details.reason && (
                      <span>原因: {String(details.reason)}</span>
                    )}
                    {details.amount !== undefined && (
                      <span>
                        {" "}
                        金额: {Number(details.amount) > 0 ? "+" : ""}
                        {String(details.amount)}
                      </span>
                    )}
                    {details.old_level !== undefined && (
                      <span>
                        {" "}
                        等级: V{String(details.old_level)} → V
                        {String(details.new_level)}
                      </span>
                    )}
                  </div>
                )}
              </div>
              <span className="text-[10px] text-muted-foreground shrink-0 hidden sm:block">
                {log.target_type}
              </span>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            第 {currentPage} / {totalPages} 页
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
