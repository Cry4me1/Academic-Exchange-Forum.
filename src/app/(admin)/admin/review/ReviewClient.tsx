"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldAlert,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Eye,
  AlertTriangle,
  FileCheck,
  Tag,
  BookOpen,
  ImageIcon,
} from "lucide-react";
import { formatDistanceToNow } from "@/lib/utils";
import { approvePostReview, rejectPostReview } from "@/lib/admin/review-actions";
import { toast } from "sonner";
import { extractPlainTextFromContent, extractImageUrls } from "@/lib/moderation/utils";

interface PostItem {
  id: string;
  title: string;
  content: any;
  tags: string[] | null;
  author_id: string;
  review_status: string;
  ai_score: number | null;
  ai_risk_level: string | null;
  ai_reason: string | null;
  ai_suggested_tags: string[] | null;
  matched_sensitive_words: string[] | null;
  created_at: string | null;
  profile: {
    id: string;
    full_name: string | null;
    username: string | null;
    avatar_url: string | null;
    email: string | null;
  } | null;
}

interface ReviewClientProps {
  stats: {
    pendingCount: number;
    approvedCount: number;
    rejectedCount: number;
    activeWordsCount: number;
  };
  posts: PostItem[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  search: string;
  riskFilter: string;
}

export function ReviewClient({
  stats,
  posts,
  totalCount,
  currentPage,
  pageSize,
  search: initialSearch,
  riskFilter: initialRiskFilter,
}: ReviewClientProps) {
  const router = useRouter();
  const [search, setSearch] = useState(initialSearch);
  const [isPending, startTransition] = useTransition();

  // 弹窗状态
  const [previewPost, setPreviewPost] = useState<PostItem | null>(null);
  const [approveDialog, setApproveDialog] = useState<PostItem | null>(null);
  const [approveNote, setApproveNote] = useState("");
  const [rejectDialog, setRejectDialog] = useState<PostItem | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const totalPages = Math.ceil(totalCount / pageSize);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (initialRiskFilter) params.set("risk", initialRiskFilter);
    router.push(`/admin/review?${params.toString()}`);
  };

  const handleRiskFilter = (value: string) => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (value && value !== "all") params.set("risk", value);
    router.push(`/admin/review?${params.toString()}`);
  };

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (initialRiskFilter) params.set("risk", initialRiskFilter);
    params.set("page", page.toString());
    router.push(`/admin/review?${params.toString()}`);
  };

  const handleApprove = async () => {
    if (!approveDialog) return;
    startTransition(async () => {
      try {
        await approvePostReview(approveDialog.id, approveNote);
        toast.success("审核已通过，帖子已全站公开发布！");
        setApproveDialog(null);
        setApproveNote("");
        router.refresh();
      } catch (err: any) {
        toast.error(err.message || "操作失败");
      }
    });
  };

  const handleReject = async () => {
    if (!rejectDialog || !rejectReason.trim()) return;
    startTransition(async () => {
      try {
        await rejectPostReview(rejectDialog.id, rejectReason);
        toast.success("已驳回该帖子并通知作者");
        setRejectDialog(null);
        setRejectReason("");
        router.refresh();
      } catch (err: any) {
        toast.error(err.message || "操作失败");
      }
    });
  };

  const getScoreBadge = (score: number | null) => {
    const val = score ?? 100;
    if (val >= 80) {
      return (
        <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
          健康分 {val}
        </Badge>
      );
    }
    if (val >= 60) {
      return (
        <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20">
          健康分 {val}
        </Badge>
      );
    }
    return (
      <Badge className="bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20">
        健康分 {val}
      </Badge>
    );
  };

  const getRiskBadge = (risk: string | null) => {
    switch (risk) {
      case "safe":
        return (
          <Badge variant="outline" className="text-emerald-600 border-emerald-500/30">
            安全 Safe
          </Badge>
        );
      case "sensitive":
        return (
          <Badge variant="outline" className="text-amber-600 border-amber-500/30">
            敏感待审 Sensitive
          </Badge>
        );
      case "dangerous":
        return (
          <Badge variant="destructive">
            高危 Dangerous
          </Badge>
        );
      default:
        return <Badge variant="secondary">未知</Badge>;
    }
  };

  return (
    <div className="animate-fade-in space-y-6">
      {/* 顶部标题 */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">内容审核工作台</h2>
          <p className="text-sm text-muted-foreground">
            AI 初审辅助分流 + 管理员人工复核，保障学术社区内容合规
          </p>
        </div>
      </div>

      {/* 统计指标卡片 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-600">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">待人工审核</p>
            <p className="text-2xl font-bold text-foreground">{stats.pendingCount}</p>
          </div>
        </div>

        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-600">
            <FileCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">已通过文章</p>
            <p className="text-2xl font-bold text-foreground">{stats.approvedCount}</p>
          </div>
        </div>

        <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-red-500/10 text-red-600">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">已驳回/拦截</p>
            <p className="text-2xl font-bold text-foreground">{stats.rejectedCount}</p>
          </div>
        </div>

        <div className="rounded-xl border border-border/50 bg-card p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
            <Tag className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">生效敏感词</p>
            <p className="text-2xl font-bold text-foreground">{stats.activeWordsCount}</p>
          </div>
        </div>
      </div>

      {/* 筛选与搜索 */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索待审帖子标题..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="pl-9"
          />
        </div>
        <Select
          value={initialRiskFilter || "all"}
          onValueChange={handleRiskFilter}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="AI 风险等级" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部风险等级</SelectItem>
            <SelectItem value="sensitive">敏感 Sensitive</SelectItem>
            <SelectItem value="dangerous">高危 Dangerous</SelectItem>
            <SelectItem value="safe">安全 Safe</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={handleSearch} variant="secondary">
          <Search className="h-4 w-4 mr-2" />
          筛选
        </Button>
      </div>

      {/* 待审列表 */}
      {posts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/80 p-12 text-center bg-card/40">
          <div className="mx-auto w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-3">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <h3 className="text-base font-semibold">待审队列空空如也</h3>
          <p className="text-sm text-muted-foreground mt-1">
            所有提交的帖子均已自动过审或完成人工处理。
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => {
            const author = post.profile;
            const plainText = extractPlainTextFromContent(post.content);

            return (
              <div
                key={post.id}
                className="rounded-xl border border-border/60 bg-card p-5 shadow-sm hover:border-border transition-all"
              >
                <div className="flex flex-col lg:flex-row items-start justify-between gap-4">
                  {/* 左侧主要信息 */}
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      {getScoreBadge(post.ai_score)}
                      {getRiskBadge(post.ai_risk_level)}
                      {post.matched_sensitive_words && post.matched_sensitive_words.length > 0 && (
                        <Badge variant="destructive" className="gap-1 text-xs">
                          <AlertTriangle className="h-3 w-3" />
                          命中敏感词: {post.matched_sensitive_words.join(", ")}
                        </Badge>
                      )}
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-foreground">
                        {post.title}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {plainText || "（暂无文本正文）"}
                      </p>
                    </div>

                    {/* AI 研判依据 */}
                    {post.ai_reason && (
                      <div className="p-3 rounded-lg bg-muted/40 border border-border/40 text-xs text-muted-foreground flex items-start gap-2">
                        <Sparkles className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-semibold text-foreground">AI 研判依据：</span>
                          {post.ai_reason}
                        </div>
                      </div>
                    )}

                    {/* 作者与标签 */}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={author?.avatar_url || undefined} />
                          <AvatarFallback className="text-[10px]">
                            {author?.full_name?.charAt(0) || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <span>{author?.full_name || author?.username || "未知作者"}</span>
                      </div>
                      <span>•</span>
                      <span>
                        提交于 {post.created_at ? formatDistanceToNow(post.created_at) : "刚刚"}
                      </span>
                      {post.tags && post.tags.length > 0 && (
                        <>
                          <span>•</span>
                          <div className="flex gap-1 flex-wrap">
                            {post.tags.map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-[10px]">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* 右侧操作按钮 */}
                  <div className="flex sm:flex-row lg:flex-col gap-2 w-full lg:w-auto shrink-0 justify-end pt-2 lg:pt-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPreviewPost(post)}
                      className="gap-1 text-xs"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      预览全文
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => setApproveDialog(post)}
                      className="gap-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                      disabled={isPending}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      通过发布
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setRejectDialog(post)}
                      className="gap-1 text-xs"
                      disabled={isPending}
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      驳回拦截
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 分页 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-border/50 px-4 py-3">
          <p className="text-sm text-muted-foreground">
            第 {currentPage} / {totalPages} 页（共 {totalCount} 篇待审）
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

      {/* 预览全文弹窗 */}
      <Dialog open={!!previewPost} onOpenChange={(open) => !open && setPreviewPost(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              {previewPost?.title}
            </DialogTitle>
            <DialogDescription>
              作者：{previewPost?.profile?.full_name || previewPost?.profile?.username || "未知"} |
              提交时间：{previewPost?.created_at ? new Date(previewPost.created_at).toLocaleString("zh-CN") : ""}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-4 py-4 pr-1">
            {/* AI 初审结果卡片 */}
            <div className="p-3.5 rounded-lg bg-muted/40 border border-border/60 text-sm space-y-2">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-500" />
                <span className="font-semibold">AI 初审分析报告：</span>
                {getScoreBadge(previewPost?.ai_score || null)}
                {getRiskBadge(previewPost?.ai_risk_level || null)}
              </div>
              <p className="text-xs text-muted-foreground">{previewPost?.ai_reason}</p>
              {previewPost?.matched_sensitive_words && previewPost.matched_sensitive_words.length > 0 && (
                <p className="text-xs text-red-500">
                  ⚠️ 命中的敏感词库：{previewPost.matched_sensitive_words.join("、")}
                </p>
              )}
            </div>

            {/* 正文预览 */}
            <div className="prose dark:prose-invert max-w-none p-4 rounded-lg bg-background border border-border/40 text-sm leading-relaxed whitespace-pre-wrap font-sans">
              {extractPlainTextFromContent(previewPost?.content)}
            </div>

            {/* 包含的图片/图表预览 */}
            {(() => {
              const images = extractImageUrls(previewPost?.content);
              if (images.length === 0) return null;
              return (
                <div className="space-y-2 pt-2 border-t border-border/40">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                    <ImageIcon className="h-4 w-4 text-primary" />
                    <span>文章包含的插图 / 图表 ({images.length} 张)：</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {images.map((src, i) => (
                      <a
                        key={i}
                        href={src}
                        target="_blank"
                        rel="noreferrer"
                        className="group relative block aspect-video rounded-lg overflow-hidden border border-border/60 bg-muted/40 hover:opacity-90 transition-opacity"
                      >
                        <img
                          src={src}
                          alt={`文章插图 ${i + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/60 text-[10px] text-white">
                          点击放大
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setPreviewPost(null)}>
              关闭
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                const target = previewPost;
                setPreviewPost(null);
                setRejectDialog(target);
              }}
            >
              驳回
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => {
                const target = previewPost;
                setPreviewPost(null);
                setApproveDialog(target);
              }}
            >
              通过
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 通过确认弹窗 */}
      <Dialog open={!!approveDialog} onOpenChange={(open) => !open && setApproveDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认通过审核</DialogTitle>
            <DialogDescription>
              确定通过文章《{approveDialog?.title}》？通过后该文章将全站公开发布并对所有用户可见。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label>审核备注（可选）</Label>
            <Input
              placeholder="例如：经人工复核学术论述严谨，予以通过"
              value={approveNote}
              onChange={(e) => setApproveNote(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveDialog(null)}>
              取消
            </Button>
            <Button
              onClick={handleApprove}
              disabled={isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              确认通过
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 驳回确认弹窗 */}
      <Dialog open={!!rejectDialog} onOpenChange={(open) => !open && setRejectDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>驳回并拦截文章</DialogTitle>
            <DialogDescription>
              驳回后文章将不会在前台展示，作者将收到系统通知并可根据驳回原因修改后重新提交。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label>驳回原因说明 *</Label>
              <Textarea
                placeholder="请详细说明未通过审核的原因，例如：文章含有涉嫌学术不端/违规导流/不当言论的内容..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialog(null)}>
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={!rejectReason.trim() || isPending}
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              确认驳回
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
