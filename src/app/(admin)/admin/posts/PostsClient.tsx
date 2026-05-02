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
import {
  Search,
  Eye,
  EyeOff,
  Pin,
  PinOff,
  Lock,
  Unlock,
  Heart,
  MessageSquare,
  History,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { formatDistanceToNow } from "@/lib/utils";
import {
  hidePost,
  unhidePost,
  togglePinPost,
  toggleLockPost,
} from "@/lib/admin/actions";
import { toast } from "sonner";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface PostRow {
  id: string;
  title: string;
  author_id: string;
  created_at: string | null;
  updated_at: string | null;
  view_count: number | null;
  like_count: number | null;
  comment_count: number | null;
  is_published: boolean | null;
  is_pinned: boolean | null;
  is_locked: boolean | null;
  is_hidden: boolean | null;
  tags: string[] | null;
  profiles: { full_name: string | null; username: string | null; avatar_url: string | null } | null;
}

interface PostsClientProps {
  posts: PostRow[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  search: string;
  statusFilter: string;
}

export function PostsClient({
  posts,
  totalCount,
  currentPage,
  pageSize,
  search: initialSearch,
  statusFilter: initialStatusFilter,
}: PostsClientProps) {
  const router = useRouter();
  const [search, setSearch] = useState(initialSearch);
  const [hideDialog, setHideDialog] = useState<{
    postId: string;
    postTitle: string;
  } | null>(null);
  const [reason, setReason] = useState("");
  const [isPending, startTransition] = useTransition();

  const totalPages = Math.ceil(totalCount / pageSize);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (initialStatusFilter) params.set("status", initialStatusFilter);
    router.push(`/admin/posts?${params.toString()}`);
  };

  const handleStatusFilter = (value: string) => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (value && value !== "all") params.set("status", value);
    router.push(`/admin/posts?${params.toString()}`);
  };

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (initialStatusFilter) params.set("status", initialStatusFilter);
    params.set("page", page.toString());
    router.push(`/admin/posts?${params.toString()}`);
  };

  const handleHide = async () => {
    if (!hideDialog || !reason.trim()) return;
    startTransition(async () => {
      try {
        await hidePost(hideDialog.postId, reason);
        toast.success("帖子已隐藏");
        setHideDialog(null);
        setReason("");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "操作失败");
      }
    });
  };

  const handleUnhide = async (postId: string) => {
    startTransition(async () => {
      try {
        await unhidePost(postId);
        toast.success("帖子已恢复");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "操作失败");
      }
    });
  };

  const handleTogglePin = async (postId: string, current: boolean) => {
    startTransition(async () => {
      try {
        await togglePinPost(postId, !current);
        toast.success(current ? "已取消置顶" : "已置顶帖子");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "操作失败");
      }
    });
  };

  const handleToggleLock = async (postId: string, current: boolean) => {
    startTransition(async () => {
      try {
        await toggleLockPost(postId, !current);
        toast.success(current ? "已解锁评论" : "已锁定评论");
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
          <h2 className="text-lg font-semibold">内容管理</h2>
          <p className="text-sm text-muted-foreground">
            共 {totalCount} 篇帖子
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索帖子标题..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="pl-9"
          />
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
            <SelectItem value="hidden">已隐藏</SelectItem>
            <SelectItem value="pinned">已置顶</SelectItem>
            <SelectItem value="locked">已锁定</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={handleSearch} variant="secondary">
          <Search className="h-4 w-4 mr-2" />
          搜索
        </Button>
      </div>

      {/* Posts Table */}
      <div className="rounded-xl border border-border/50 bg-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50 bg-muted/30">
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                  帖子
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground hidden sm:table-cell">
                  作者
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground hidden md:table-cell">
                  互动
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">
                  状态
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground hidden lg:table-cell">
                  发布时间
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {posts.map((post) => {
                const profile = post.profiles as { full_name: string | null; username: string | null; avatar_url: string | null } | null;

                return (
                  <tr
                    key={post.id}
                    className="hover:bg-accent/30 transition-colors"
                  >
                    <td className="px-4 py-3 max-w-[300px]">
                      <div className="space-y-1">
                        <p className="text-sm font-medium truncate">
                          {post.title}
                        </p>
                        {post.tags && post.tags.length > 0 && (
                          <div className="flex gap-1 flex-wrap">
                            {post.tags.slice(0, 3).map((tag) => (
                              <Badge
                                key={tag}
                                variant="secondary"
                                className="text-[10px] px-1.5"
                              >
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={profile?.avatar_url ?? undefined} />
                          <AvatarFallback className="text-[10px] bg-gradient-to-br from-violet-500 to-purple-600 text-white">
                            {profile?.full_name?.charAt(0) ?? "?"}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm text-muted-foreground">
                          {profile?.full_name ?? "匿名"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-0.5" title="浏览">
                          <Eye className="h-3 w-3" />
                          {post.view_count ?? 0}
                        </span>
                        <span className="flex items-center gap-0.5" title="点赞">
                          <Heart className="h-3 w-3" />
                          {post.like_count ?? 0}
                        </span>
                        <span className="flex items-center gap-0.5" title="评论">
                          <MessageSquare className="h-3 w-3" />
                          {post.comment_count ?? 0}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1 flex-wrap">
                        {post.is_hidden && (
                          <Badge variant="destructive" className="text-[10px]">
                            隐藏
                          </Badge>
                        )}
                        {post.is_pinned && (
                          <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 text-[10px]">
                            置顶
                          </Badge>
                        )}
                        {post.is_locked && (
                          <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 text-[10px]">
                            锁定
                          </Badge>
                        )}
                        {!post.is_hidden && !post.is_pinned && !post.is_locked && (
                          <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px]">
                            正常
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground hidden lg:table-cell">
                      {post.created_at
                        ? formatDistanceToNow(post.created_at)
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/posts/${post.id}`} target="_blank">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            title="查看帖子"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                        <Link href={`/admin/posts/${post.id}/comments`}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-primary"
                            title="管理评论"
                          >
                            <MessageSquare className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                        <Link href={`/posts/${post.id}/history`} target="_blank">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-purple-600"
                            title="修订历史"
                          >
                            <History className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() =>
                            handleTogglePin(post.id, !!post.is_pinned)
                          }
                          disabled={isPending}
                          title={post.is_pinned ? "取消置顶" : "置顶"}
                        >
                          {post.is_pinned ? (
                            <PinOff className="h-3.5 w-3.5 text-amber-500" />
                          ) : (
                            <Pin className="h-3.5 w-3.5" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() =>
                            handleToggleLock(post.id, !!post.is_locked)
                          }
                          disabled={isPending}
                          title={post.is_locked ? "解锁评论" : "锁定评论"}
                        >
                          {post.is_locked ? (
                            <Unlock className="h-3.5 w-3.5 text-blue-500" />
                          ) : (
                            <Lock className="h-3.5 w-3.5" />
                          )}
                        </Button>
                        {post.is_hidden ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-emerald-600"
                            onClick={() => handleUnhide(post.id)}
                            disabled={isPending}
                            title="恢复"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-600"
                            onClick={() =>
                              setHideDialog({
                                postId: post.id,
                                postTitle: post.title,
                              })
                            }
                            disabled={isPending}
                            title="隐藏"
                          >
                            <EyeOff className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border/50 px-4 py-3">
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

      {/* Hide Dialog */}
      <Dialog
        open={!!hideDialog}
        onOpenChange={(open) => !open && setHideDialog(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>隐藏帖子</DialogTitle>
            <DialogDescription>
              确定要隐藏帖子《{hideDialog?.postTitle}》？隐藏后其他用户将无法查看。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label>隐藏原因 *</Label>
              <Textarea
                placeholder="请输入隐藏原因..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setHideDialog(null)}>
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={handleHide}
              disabled={!reason.trim() || isPending}
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              确认隐藏
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
