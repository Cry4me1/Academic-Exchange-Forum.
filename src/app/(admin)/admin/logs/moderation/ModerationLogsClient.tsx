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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Zap,
  Clock,
  ShieldCheck,
  AlertTriangle,
  XCircle,
} from "lucide-react";
import { formatDistanceToNow } from "@/lib/utils";

interface ModerationLogItem {
  id: string;
  post_id: string | null;
  author_id: string;
  content_hash: string;
  model_name: string;
  score: number;
  risk_level: string;
  reason: string | null;
  detected_tags: string[] | null;
  matched_sensitive_words: string[] | null;
  final_action: string;
  cost_tokens: number;
  latency_ms: number;
  is_cached: boolean;
  created_at: string;
  post: { title: string } | null;
  profile: {
    full_name: string | null;
    username: string | null;
    avatar_url: string | null;
  } | null;
}

interface ModerationLogsClientProps {
  logs: ModerationLogItem[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  riskFilter: string;
  actionFilter: string;
}

const ACTION_MAP: Record<string, { label: string; color: string; icon: any }> = {
  auto_approved: { label: "AI 自动通过", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20", icon: ShieldCheck },
  auto_pending: { label: "转入待审", color: "bg-amber-500/10 text-amber-600 border-amber-500/20", icon: AlertTriangle },
  auto_rejected: { label: "自动拦截", color: "bg-red-500/10 text-red-600 border-red-500/20", icon: XCircle },
  manual_approved: { label: "人工放行", color: "bg-teal-500/10 text-teal-600 border-teal-500/20", icon: ShieldCheck },
  manual_rejected: { label: "人工驳回", color: "bg-rose-500/10 text-rose-600 border-rose-500/20", icon: XCircle },
};

export function ModerationLogsClient({
  logs,
  totalCount,
  currentPage,
  pageSize,
  riskFilter: initialRiskFilter,
  actionFilter: initialActionFilter,
}: ModerationLogsClientProps) {
  const router = useRouter();
  const totalPages = Math.ceil(totalCount / pageSize);

  const handleFilter = (key: string, val: string) => {
    const params = new URLSearchParams();
    if (initialRiskFilter) params.set("risk", initialRiskFilter);
    if (initialActionFilter) params.set("action", initialActionFilter);

    if (val && val !== "all") {
      params.set(key, val);
    } else {
      params.delete(key);
    }
    router.push(`/admin/logs/moderation?${params.toString()}`);
  };

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams();
    if (initialRiskFilter) params.set("risk", initialRiskFilter);
    if (initialActionFilter) params.set("action", initialActionFilter);
    params.set("page", page.toString());
    router.push(`/admin/logs/moderation?${params.toString()}`);
  };

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">AI 审核审计日志</h2>
          <p className="text-sm text-muted-foreground">
            追踪全站文章的初审决策记录、大模型 Token 用量与敏感词命中审计
          </p>
        </div>
      </div>

      {/* 筛选 */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Select
          value={initialRiskFilter || "all"}
          onValueChange={(val) => handleFilter("risk", val)}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="AI 风险等级" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部风险等级</SelectItem>
            <SelectItem value="safe">安全 (Safe)</SelectItem>
            <SelectItem value="sensitive">敏感 (Sensitive)</SelectItem>
            <SelectItem value="dangerous">高危 (Dangerous)</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={initialActionFilter || "all"}
          onValueChange={(val) => handleFilter("action", val)}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="处置动作" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部处置动作</SelectItem>
            <SelectItem value="auto_approved">AI 自动通过</SelectItem>
            <SelectItem value="auto_pending">转入待审</SelectItem>
            <SelectItem value="auto_rejected">自动拦截</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 日志表格 */}
      <div className="rounded-xl border border-border/50 bg-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50 bg-muted/30">
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">文章 / 内容摘要</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">作者</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">AI 评分</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">处置动作</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground hidden md:table-cell">模型 & 性能</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground hidden lg:table-cell">时间</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    暂无审核日志记录
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const author = log.profile;
                  const act = ACTION_MAP[log.final_action] || {
                    label: log.final_action,
                    color: "bg-muted text-muted-foreground",
                    icon: Sparkles,
                  };
                  const ActionIcon = act.icon;

                  return (
                    <tr key={log.id} className="hover:bg-accent/30 transition-colors">
                      <td className="px-4 py-3 max-w-[280px]">
                        <div className="space-y-1">
                          <p className="text-sm font-semibold truncate text-foreground">
                            {log.post?.title || "未命名或已拦截提交"}
                          </p>
                          <p className="text-xs text-muted-foreground truncate" title={log.reason || ""}>
                            {log.reason || "无评判理由"}
                          </p>
                          {log.matched_sensitive_words && log.matched_sensitive_words.length > 0 && (
                            <div className="flex gap-1 flex-wrap">
                              {log.matched_sensitive_words.map((w) => (
                                <Badge key={w} variant="destructive" className="text-[10px] px-1 py-0">
                                  命中: {w}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={author?.avatar_url || undefined} />
                            <AvatarFallback className="text-[10px]">
                              {author?.full_name?.charAt(0) || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs text-muted-foreground">
                            {author?.full_name || author?.username || "未知"}
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-3 text-center">
                        <div className="inline-flex flex-col items-center">
                          <span
                            className={`text-sm font-bold ${
                              log.score >= 80
                                ? "text-emerald-600 dark:text-emerald-400"
                                : log.score >= 60
                                ? "text-amber-600 dark:text-amber-400"
                                : "text-red-600 dark:text-red-400"
                            }`}
                          >
                            {log.score}
                          </span>
                          <span className="text-[10px] text-muted-foreground capitalize">
                            {log.risk_level}
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <Badge variant="outline" className={`gap-1 text-xs ${act.color}`}>
                          <ActionIcon className="h-3 w-3" />
                          {act.label}
                        </Badge>
                      </td>

                      <td className="px-4 py-3 hidden md:table-cell">
                        <div className="space-y-0.5 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            {log.is_cached ? (
                              <Badge variant="secondary" className="text-[10px] px-1 bg-violet-500/10 text-violet-600 border-violet-500/20">
                                ⚡ 缓存命中
                              </Badge>
                            ) : (
                              <span className="font-mono text-[11px]">{log.model_name}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[11px]">
                            <span className="flex items-center gap-0.5">
                              <Zap className="h-2.5 w-2.5" />
                              {log.cost_tokens} tok
                            </span>
                            <span className="flex items-center gap-0.5">
                              <Clock className="h-2.5 w-2.5" />
                              {log.latency_ms}ms
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3 text-xs text-muted-foreground hidden lg:table-cell">
                        {log.created_at ? formatDistanceToNow(log.created_at) : "—"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 分页 */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border/50 px-4 py-3">
            <p className="text-sm text-muted-foreground">
              第 {currentPage} / {totalPages} 页（共 {totalCount} 条记录）
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
    </div>
  );
}
