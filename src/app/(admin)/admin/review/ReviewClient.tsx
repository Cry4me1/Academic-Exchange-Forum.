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
  MessageSquare,
  FileText,
  ExternalLink,
} from "lucide-react";
import { formatDistanceToNow } from "@/lib/utils";
import {
  approvePostReview,
  rejectPostReview,
  approveCommentReview,
  rejectCommentReview,
} from "@/lib/admin/review-actions";
import { toast } from "sonner";
import { extractPlainTextFromContent, extractImageUrls } from "@/lib/moderation/utils";
import NovelViewer from "@/components/editor/NovelViewer";
import Link from "next/link";

export interface PostItem {
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
    username: string | null;
    avatar_url: string | null;
    email: string | null;
  } | null;
}

export interface CommentReviewItem {
  id: string;
  post_id: string;
  parent_id: string | null;
  content: any;
  author_id: string;
  review_status: string;
  ai_score: number | null;
  ai_risk_level: string | null;
  ai_reason: string | null;
  matched_sensitive_words: string[] | null;
  created_at: string | null;
  post: {
    id: string;
    title: string;
  } | null;
  profile: {
    id: string;
    username: string | null;
    avatar_url: string | null;
    email: string | null;
  } | null;
}

interface ReviewClientProps {
  stats: {
    pendingCount: number;
    pendingPostsCount?: number;
    pendingCommentsCount?: number;
    approvedCount: number;
    approvedPostsCount?: number;
    approvedCommentsCount?: number;
    rejectedCount: number;
    rejectedPostsCount?: number;
    rejectedCommentsCount?: number;
    activeWordsCount: number;
  };
  posts: PostItem[];
  postsTotalCount: number;
  postsCurrentPage: number;
  comments: CommentReviewItem[];
  commentsTotalCount: number;
  commentsCurrentPage: number;
  pageSize: number;
  search: string;
  riskFilter: string;
  activeTab: "posts" | "comments";
}

export function ReviewClient({
  stats,
  posts,
  postsTotalCount,
  postsCurrentPage,
  comments,
  commentsTotalCount,
  commentsCurrentPage,
  pageSize,
  search: initialSearch,
  riskFilter: initialRiskFilter,
  activeTab: initialTab,
}: ReviewClientProps) {
  const router = useRouter();
  const [tab, setTab] = useState<"posts" | "comments">(initialTab);
  const [search, setSearch] = useState(initialSearch);
  const [isPending, startTransition] = useTransition();

  // 帖子弹窗状态
  const [previewPost, setPreviewPost] = useState<PostItem | null>(null);
  const [approveDialog, setApproveDialog] = useState<PostItem | null>(null);
  const [approveNote, setApproveNote] = useState("");
  const [rejectDialog, setRejectDialog] = useState<PostItem | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  // 评论弹窗状态
  const [previewComment, setPreviewComment] = useState<CommentReviewItem | null>(null);
  const [approveCommentDialog, setApproveCommentDialog] = useState<CommentReviewItem | null>(null);
  const [approveCommentNote, setApproveCommentNote] = useState("");
  const [rejectCommentDialog, setRejectCommentDialog] = useState<CommentReviewItem | null>(null);
  const [rejectCommentReason, setRejectCommentReason] = useState("");

  const currentTotal = tab === "posts" ? postsTotalCount : commentsTotalCount;
  const currentPage = tab === "posts" ? postsCurrentPage : commentsCurrentPage;
  const totalPages = Math.ceil(currentTotal / pageSize);

  const handleTabChange = (nextTab: "posts" | "comments") => {
    setTab(nextTab);
    const params = new URLSearchParams();
    params.set("tab", nextTab);
    if (search) params.set("search", search);
    if (initialRiskFilter) params.set("risk", initialRiskFilter);
    router.push(`/admin/review?${params.toString()}`);
  };

  const handleSearch = () => {
    const params = new URLSearchParams();
    params.set("tab", tab);
    if (search) params.set("search", search);
    if (initialRiskFilter) params.set("risk", initialRiskFilter);
    router.push(`/admin/review?${params.toString()}`);
  };

  const handleRiskFilter = (value: string) => {
    const params = new URLSearchParams();
    params.set("tab", tab);
    if (search) params.set("search", search);
    if (value && value !== "all") params.set("risk", value);
    router.push(`/admin/review?${params.toString()}`);
  };

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams();
    params.set("tab", tab);
    if (search) params.set("search", search);
    if (initialRiskFilter) params.set("risk", initialRiskFilter);
    params.set("page", page.toString());
    router.push(`/admin/review?${params.toString()}`);
  };

  // 帖子操作
  const handleApprovePost = async () => {
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

  const handleRejectPost = async () => {
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

  // 评论操作
  const handleApproveComment = async () => {
    if (!approveCommentDialog) return;
    startTransition(async () => {
      try {
        await approveCommentReview(approveCommentDialog.id, approveCommentNote);
        toast.success("评论审核已通过并已公开！");
        setApproveCommentDialog(null);
        setApproveCommentNote("");
        router.refresh();
      } catch (err: any) {
        toast.error(err.message || "操作失败");
      }
    });
  };

  const handleRejectComment = async () => {
    if (!rejectCommentDialog || !rejectCommentReason.trim()) return;
    startTransition(async () => {
      try {
        await rejectCommentReview(rejectCommentDialog.id, rejectCommentReason);
        toast.success("已驳回该评论并通知作者");
        setRejectCommentDialog(null);
        setRejectCommentReason("");
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
            AI 初审辅助分流 + 管理员人工复核，保障学术社区主贴与评论安全合规
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
            <p className="text-xs text-muted-foreground font-medium">待审总量 (主贴/评论)</p>
            <p className="text-2xl font-bold text-foreground">
              {stats.pendingCount}{" "}
              <span className="text-xs font-normal text-muted-foreground">
                ({stats.pendingPostsCount ?? 0} 贴 / {stats.pendingCommentsCount ?? 0} 评)
              </span>
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-600">
            <FileCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">已通过总量</p>
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

      {/* Tab 选项卡与检索筛选 */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
        {/* Tab 切换按钮 */}
        <div className="flex items-center gap-2 bg-muted/40 p-1 rounded-xl border border-border/40">
          <Button
            variant={tab === "posts" ? "default" : "ghost"}
            size="sm"
            onClick={() => handleTabChange("posts")}
            className="gap-2 text-xs h-8"
          >
            <FileText className="h-4 w-4" />
            待审文章
            {(stats.pendingPostsCount ?? 0) > 0 && (
              <span className="bg-amber-500/20 text-amber-600 dark:text-amber-400 px-1.5 py-0.2 rounded-full text-[10px] font-semibold">
                {stats.pendingPostsCount}
              </span>
            )}
          </Button>
          <Button
            variant={tab === "comments" ? "default" : "ghost"}
            size="sm"
            onClick={() => handleTabChange("comments")}
            className="gap-2 text-xs h-8"
          >
            <MessageSquare className="h-4 w-4" />
            待审评论
            {(stats.pendingCommentsCount ?? 0) > 0 && (
              <span className="bg-amber-500/20 text-amber-600 dark:text-amber-400 px-1.5 py-0.2 rounded-full text-[10px] font-semibold">
                {stats.pendingCommentsCount}
              </span>
            )}
          </Button>
        </div>

        {/* 筛选与搜索 */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={tab === "posts" ? "搜索待审帖子标题..." : "搜索评论内容或帖子..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="pl-9 h-8 text-xs"
            />
          </div>
          <Select
            value={initialRiskFilter || "all"}
            onValueChange={handleRiskFilter}
          >
            <SelectTrigger className="w-[140px] h-8 text-xs">
              <SelectValue placeholder="AI 风险等级" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部风险等级</SelectItem>
              <SelectItem value="sensitive">敏感 Sensitive</SelectItem>
              <SelectItem value="dangerous">高危 Dangerous</SelectItem>
              <SelectItem value="safe">安全 Safe</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleSearch} variant="secondary" size="sm" className="h-8 text-xs">
            <Search className="h-3.5 w-3.5 mr-1" />
            筛选
          </Button>
        </div>
      </div>

      {/* 待审帖子列表 */}
      {tab === "posts" && (
        <>
          {posts.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/80 p-12 text-center bg-card/40">
              <div className="mx-auto w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-3">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h3 className="text-base font-semibold">待审帖子队列空空如也</h3>
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
                                {(author?.username || "U").slice(0, 1).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span>{author?.username || "学者"}</span>
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
        </>
      )}

      {/* 待审评论列表 */}
      {tab === "comments" && (
        <>
          {comments.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/80 p-12 text-center bg-card/40">
              <div className="mx-auto w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-3">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h3 className="text-base font-semibold">待审评论队列空空如也</h3>
              <p className="text-sm text-muted-foreground mt-1">
                所有提交的评论均已审核或无需人工复核。
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => {
                const author = comment.profile;
                const post = comment.post;
                const plainText = extractPlainTextFromContent(comment.content);

                return (
                  <div
                    key={comment.id}
                    className="rounded-xl border border-border/60 bg-card p-5 shadow-sm hover:border-border transition-all"
                  >
                    <div className="flex flex-col lg:flex-row items-start justify-between gap-4">
                      {/* 左侧主要信息 */}
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          {getScoreBadge(comment.ai_score)}
                          {getRiskBadge(comment.ai_risk_level)}
                          {comment.matched_sensitive_words && comment.matched_sensitive_words.length > 0 && (
                            <Badge variant="destructive" className="gap-1 text-xs">
                              <AlertTriangle className="h-3 w-3" />
                              命中敏感词: {comment.matched_sensitive_words.join(", ")}
                            </Badge>
                          )}
                          {comment.parent_id && (
                            <Badge variant="secondary" className="text-[10px]">
                              二级回复
                            </Badge>
                          )}
                        </div>

                        {/* 所属帖子信息 */}
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <BookOpen className="h-3.5 w-3.5 text-primary" />
                          <span>所属文章：</span>
                          <Link
                            href={`/posts/${comment.post_id}`}
                            target="_blank"
                            className="font-medium text-foreground hover:text-primary transition-colors flex items-center gap-1 line-clamp-1"
                          >
                            {post?.title || "查看原帖"}
                            <ExternalLink className="h-3 w-3 inline" />
                          </Link>
                        </div>

                        {/* 评论内容预览 */}
                        <div className="p-3 rounded-lg bg-muted/20 border border-border/50 text-sm text-foreground">
                          <p className="line-clamp-3 leading-relaxed">
                            {plainText || "（富文本评论）"}
                          </p>
                        </div>

                        {/* AI 研判依据 */}
                        {comment.ai_reason && (
                          <div className="p-3 rounded-lg bg-muted/40 border border-border/40 text-xs text-muted-foreground flex items-start gap-2">
                            <Sparkles className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-semibold text-foreground">AI 研判依据：</span>
                              {comment.ai_reason}
                            </div>
                          </div>
                        )}

                        {/* 评论者与时间 */}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-5 w-5">
                              <AvatarImage src={author?.avatar_url || undefined} />
                              <AvatarFallback className="text-[10px]">
                                {(author?.username || "U").slice(0, 1).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span>{author?.username || "学者"}</span>
                          </div>
                          <span>•</span>
                          <span>
                            发表于 {comment.created_at ? formatDistanceToNow(comment.created_at) : "刚刚"}
                          </span>
                        </div>
                      </div>

                      {/* 右侧操作按钮 */}
                      <div className="flex sm:flex-row lg:flex-col gap-2 w-full lg:w-auto shrink-0 justify-end pt-2 lg:pt-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPreviewComment(comment)}
                          className="gap-1 text-xs"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          查看详情
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => setApproveCommentDialog(comment)}
                          className="gap-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                          disabled={isPending}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          通过公开
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setRejectCommentDialog(comment)}
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
        </>
      )}

      {/* 分页 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-border/50 px-4 py-3">
          <p className="text-sm text-muted-foreground">
            第 {currentPage} / {totalPages} 页（共 {currentTotal} 条待审）
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

      {/* 帖子预览弹窗 */}
      <Dialog open={!!previewPost} onOpenChange={(open) => !open && setPreviewPost(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              {previewPost?.title}
            </DialogTitle>
            <DialogDescription>
              作者：{previewPost?.profile?.username || "学者"} |
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

      {/* 评论详情预览弹窗 */}
      <Dialog open={!!previewComment} onOpenChange={(open) => !open && setPreviewComment(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-lg flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              评论审核详情
            </DialogTitle>
            <DialogDescription>
              作者：{previewComment?.profile?.username || "学者"} |
              所属文章：《{previewComment?.post?.title || "未知文章"}》
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-4 py-4 pr-1">
            {/* AI 初审结果卡片 */}
            <div className="p-3.5 rounded-lg bg-muted/40 border border-border/60 text-sm space-y-2">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-500" />
                <span className="font-semibold">AI 初审报告：</span>
                {getScoreBadge(previewComment?.ai_score || null)}
                {getRiskBadge(previewComment?.ai_risk_level || null)}
              </div>
              <p className="text-xs text-muted-foreground">{previewComment?.ai_reason}</p>
              {previewComment?.matched_sensitive_words && previewComment.matched_sensitive_words.length > 0 && (
                <p className="text-xs text-red-500">
                  ⚠️ 命中的敏感词库：{previewComment.matched_sensitive_words.join("、")}
                </p>
              )}
            </div>

            {/* 评论富文本完整渲染 */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">评论完整内容：</Label>
              <div className="p-4 rounded-lg bg-muted/20 border border-border/50 text-sm">
                <NovelViewer initialValue={previewComment?.content as any} />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setPreviewComment(null)}>
              关闭
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                const target = previewComment;
                setPreviewComment(null);
                setRejectCommentDialog(target);
              }}
            >
              驳回
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => {
                const target = previewComment;
                setPreviewComment(null);
                setApproveCommentDialog(target);
              }}
            >
              通过
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 帖子通过确认弹窗 */}
      <Dialog open={!!approveDialog} onOpenChange={(open) => !open && setApproveDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认通过帖子审核</DialogTitle>
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
              onClick={handleApprovePost}
              disabled={isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              确认通过
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 帖子驳回确认弹窗 */}
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
              onClick={handleRejectPost}
              disabled={!rejectReason.trim() || isPending}
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              确认驳回
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 评论通过确认弹窗 */}
      <Dialog open={!!approveCommentDialog} onOpenChange={(open) => !open && setApproveCommentDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认通过评论审核</DialogTitle>
            <DialogDescription>
              通过后该评论将在文章《{approveCommentDialog?.post?.title || "对应文章"}》下公开展出。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label>审核备注（可选）</Label>
            <Input
              placeholder="例如：经人工复查合规，予以公开"
              value={approveCommentNote}
              onChange={(e) => setApproveCommentNote(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveCommentDialog(null)}>
              取消
            </Button>
            <Button
              onClick={handleApproveComment}
              disabled={isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              确认通过
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 评论驳回确认弹窗 */}
      <Dialog open={!!rejectCommentDialog} onOpenChange={(open) => !open && setRejectCommentDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>驳回并拦截评论</DialogTitle>
            <DialogDescription>
              驳回后该评论将不会在前台展示，作者将收到系统通知。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label>驳回原因说明 *</Label>
              <Textarea
                placeholder="请填写驳回原因，例如：包含不当言论/灌水广告..."
                value={rejectCommentReason}
                onChange={(e) => setRejectCommentReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectCommentDialog(null)}>
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectComment}
              disabled={!rejectCommentReason.trim() || isPending}
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
