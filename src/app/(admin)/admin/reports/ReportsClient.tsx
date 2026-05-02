"use client";

import { useState, useTransition } from "react";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertTriangle,
  FileText,
  MessageSquare,
  User,
  Mail,
  ExternalLink,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "@/lib/utils";
import { handleReport } from "@/lib/admin/actions";
import { toast } from "sonner";

interface ReportRow {
  id: string;
  reporter_id: string;
  target_type: string;
  target_id: string;
  reason: string;
  details: string | null;
  status: string;
  handled_by: string | null;
  handled_at: string | null;
  action_taken: string | null;
  handler_note: string | null;
  content_snapshot: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

interface ProfileInfo {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
}

interface ReportsClientProps {
  reports: ReportRow[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  statusFilter: string;
  profileMap: Record<string, ProfileInfo>;
}

const reasonLabels: Record<string, string> = {
  spam: "垃圾信息",
  inappropriate: "不当内容",
  harassment: "骚扰攻击",
  misinformation: "虚假信息",
  copyright: "侵犯版权",
  other: "其他",
};

const targetTypeIcons: Record<string, React.ReactNode> = {
  post: <FileText className="h-4 w-4" />,
  comment: <MessageSquare className="h-4 w-4" />,
  user: <User className="h-4 w-4" />,
  message: <Mail className="h-4 w-4" />,
};

const targetTypeLabels: Record<string, string> = {
  post: "帖子",
  comment: "评论",
  user: "用户",
  message: "消息",
};

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; color: string }> = {
  pending: { label: "待处理", variant: "destructive", color: "text-red-600" },
  reviewing: { label: "审核中", variant: "default", color: "text-blue-600" },
  resolved: { label: "已处理", variant: "secondary", color: "text-emerald-600" },
  rejected: { label: "已驳回", variant: "outline", color: "text-gray-600" },
};

export function ReportsClient({
  reports,
  totalCount,
  currentPage,
  pageSize,
  statusFilter: initialStatusFilter,
  profileMap,
}: ReportsClientProps) {
  const router = useRouter();
  const [handleDialog, setHandleDialog] = useState<ReportRow | null>(null);
  const [actionType, setActionType] = useState<"resolved" | "rejected">(
    "resolved"
  );
  const [actionTaken, setActionTaken] = useState("none");
  const [handlerNote, setHandlerNote] = useState("");
  const [isPending, startTransition] = useTransition();

  const totalPages = Math.ceil(totalCount / pageSize);

  const handleStatusFilter = (value: string) => {
    const params = new URLSearchParams();
    if (value && value !== "all") params.set("status", value);
    router.push(`/admin/reports?${params.toString()}`);
  };

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams();
    if (initialStatusFilter) params.set("status", initialStatusFilter);
    params.set("page", page.toString());
    router.push(`/admin/reports?${params.toString()}`);
  };

  const handleSubmitReport = async () => {
    if (!handleDialog) return;
    startTransition(async () => {
      try {
        await handleReport(handleDialog.id, {
          status: actionType,
          actionTaken,
          handlerNote: handlerNote.trim() || undefined,
        });
        toast.success(
          actionType === "resolved" ? "举报已处理" : "举报已驳回"
        );
        setHandleDialog(null);
        setHandlerNote("");
        setActionTaken("none");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "操作失败");
      }
    });
  };

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            举报管理
          </h2>
          <p className="text-sm text-muted-foreground">
            共 {totalCount} 条举报记录
          </p>
        </div>
        <Select
          value={initialStatusFilter || "all"}
          onValueChange={handleStatusFilter}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="筛选状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部</SelectItem>
            <SelectItem value="pending">待处理</SelectItem>
            <SelectItem value="reviewing">审核中</SelectItem>
            <SelectItem value="resolved">已处理</SelectItem>
            <SelectItem value="rejected">已驳回</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Reports List */}
      <div className="space-y-3">
        {reports.length === 0 && (
          <div className="rounded-xl border border-border/50 bg-card p-12 text-center shadow-sm">
            <AlertTriangle className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">暂无举报记录</p>
          </div>
        )}
        {reports.map((report) => {
          const reporter = profileMap[report.reporter_id];
          const handler = report.handled_by
            ? profileMap[report.handled_by]
            : null;
          const config = statusConfig[report.status] ?? statusConfig.pending;

          return (
            <div
              key={report.id}
              className="rounded-xl border border-border/50 bg-card p-5 shadow-sm hover:border-border transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex-1 space-y-2">
                  {/* Type & Reason */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 text-sm font-medium">
                      {targetTypeIcons[report.target_type]}
                      <span>{targetTypeLabels[report.target_type]}</span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {reasonLabels[report.reason] ?? report.reason}
                    </Badge>
                    <Badge variant={config.variant} className="text-xs">
                      {config.label}
                    </Badge>
                  </div>

                  {/* 被举报内容链接 */}
                  <div className="flex items-center gap-2 text-sm">
                    {report.target_type === "post" && (
                      <a
                        href={`/posts/${report.target_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline font-medium truncate max-w-[400px] inline-flex items-center gap-1"
                      >
                        <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                        {String(report.content_snapshot?.post_title ||
                         report.content_snapshot?.targetTitle ||
                         `帖子 ${report.target_id.slice(0, 8)}...`)}
                      </a>
                    )}
                    {report.target_type === "comment" && (
                      <a
                        href={report.content_snapshot?.comment_post_id
                          ? `/posts/${String(report.content_snapshot.comment_post_id)}#comment-${report.target_id}`
                          : `#`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline font-medium truncate max-w-[400px] inline-flex items-center gap-1"
                      >
                        <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                        {`评论 #${report.target_id.slice(0, 8)}...`}
                      </a>
                    )}
                    {report.target_type === "user" && (
                      <a
                        href={`/user/${report.target_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline font-medium truncate max-w-[400px] inline-flex items-center gap-1"
                      >
                        <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                        {String(report.content_snapshot?.user_username ||
                         report.content_snapshot?.user_full_name ||
                         `用户 ${report.target_id.slice(0, 8)}...`)}
                      </a>
                    )}
                    {!["post", "comment", "user"].includes(report.target_type) && (
                      <span className="text-muted-foreground text-xs">
                        {`ID: ${report.target_id.slice(0, 12)}...`}
                      </span>
                    )}
                  </div>

                  {/* Details */}
                  {report.details && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {report.details}
                    </p>
                  )}

                  {/* Reporter Info */}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={reporter?.avatar_url ?? undefined} />
                      <AvatarFallback className="text-[8px] bg-muted">
                        {reporter?.full_name?.charAt(0) ?? "?"}
                      </AvatarFallback>
                    </Avatar>
                    <span>
                      {reporter?.full_name ?? "未知用户"} 举报于{" "}
                      {formatDistanceToNow(report.created_at)}
                    </span>
                  </div>

                  {/* Handler Info */}
                  {handler && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                      <span>
                        {handler.full_name ?? "管理员"} 处理于{" "}
                        {report.handled_at
                          ? formatDistanceToNow(report.handled_at)
                          : "—"}
                      </span>
                      {report.handler_note && (
                        <span className="text-muted-foreground">
                          — {report.handler_note}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions */}
                {report.status === "pending" && (
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={() => {
                        setActionType("resolved");
                        setHandleDialog(report);
                      }}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      处理
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setActionType("rejected");
                        setHandleDialog(report);
                      }}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      驳回
                    </Button>
                  </div>
                )}
              </div>
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

      {/* Handle Report Dialog */}
      <Dialog
        open={!!handleDialog}
        onOpenChange={(open) => !open && setHandleDialog(null)}
      >
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>
              {actionType === "resolved" ? "处理举报" : "驳回举报"}
            </DialogTitle>
            <DialogDescription>
              {actionType === "resolved"
                ? "请选择处理措施并填写备注。"
                : "请说明驳回原因。"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {actionType === "resolved" && (
              <div>
                <Label>处理措施</Label>
                <Select value={actionTaken} onValueChange={setActionTaken}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">仅标记已处理</SelectItem>
                    <SelectItem value="warning">警告用户</SelectItem>
                    <SelectItem value="content_hidden">隐藏内容</SelectItem>
                    <SelectItem value="content_deleted">删除内容</SelectItem>
                    <SelectItem value="user_muted">禁言用户</SelectItem>
                    <SelectItem value="user_banned">封禁用户</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label>
                备注{actionType === "rejected" ? " *" : "（可选）"}
              </Label>
              <Textarea
                placeholder="请填写处理备注..."
                value={handlerNote}
                onChange={(e) => setHandlerNote(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setHandleDialog(null)}>
              取消
            </Button>
            <Button
              onClick={handleSubmitReport}
              disabled={
                isPending ||
                (actionType === "rejected" && !handlerNote.trim())
              }
              className={
                actionType === "resolved"
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                  : ""
              }
              variant={actionType === "rejected" ? "destructive" : "default"}
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {actionType === "resolved" ? "确认处理" : "确认驳回"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
