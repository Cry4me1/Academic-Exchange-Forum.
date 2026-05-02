"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  Ban,
  ShieldCheck,
  VolumeX,
  Volume2,
  ChevronLeft,
  ChevronRight,
  Crown,
  Loader2,
} from "lucide-react";
import { formatDistanceToNow } from "@/lib/utils";
import { banUser, unbanUser, muteUser, unmuteUser } from "@/lib/admin/actions";
import { toast } from "sonner";
import Link from "next/link";

interface UserRow {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  email: string | null;
  created_at: string | null;
  vip_level: number;
  is_banned: boolean | null;
  is_muted: boolean | null;
  muted_until: string | null;
  reputation_score: number | null;
  is_developer: boolean | null;
}

interface UsersClientProps {
  users: UserRow[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  search: string;
  vipFilter: string;
}

export function UsersClient({
  users,
  totalCount,
  currentPage,
  pageSize,
  search: initialSearch,
  vipFilter: initialVipFilter,
}: UsersClientProps) {
  const router = useRouter();
  const [search, setSearch] = useState(initialSearch);
  const [banDialog, setBanDialog] = useState<{
    userId: string;
    userName: string;
  } | null>(null);
  const [muteDialog, setMuteDialog] = useState<{
    userId: string;
    userName: string;
  } | null>(null);
  const [reason, setReason] = useState("");
  const [muteDuration, setMuteDuration] = useState("24");
  const [isPending, startTransition] = useTransition();

  const totalPages = Math.ceil(totalCount / pageSize);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (initialVipFilter) params.set("vip", initialVipFilter);
    router.push(`/admin/users?${params.toString()}`);
  };

  const handleVipFilter = (value: string) => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (value && value !== "all") params.set("vip", value);
    router.push(`/admin/users?${params.toString()}`);
  };

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (initialVipFilter) params.set("vip", initialVipFilter);
    params.set("page", page.toString());
    router.push(`/admin/users?${params.toString()}`);
  };

  const handleBan = async () => {
    if (!banDialog || !reason.trim()) return;
    startTransition(async () => {
      try {
        await banUser(banDialog.userId, reason);
        toast.success(`已封禁用户 ${banDialog.userName}`);
        setBanDialog(null);
        setReason("");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "操作失败");
      }
    });
  };

  const handleUnban = async (userId: string, userName: string) => {
    startTransition(async () => {
      try {
        await unbanUser(userId);
        toast.success(`已解封用户 ${userName}`);
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "操作失败");
      }
    });
  };

  const handleMute = async () => {
    if (!muteDialog || !reason.trim()) return;
    startTransition(async () => {
      try {
        await muteUser(muteDialog.userId, parseInt(muteDuration), reason);
        toast.success(`已禁言用户 ${muteDialog.userName} ${muteDuration} 小时`);
        setMuteDialog(null);
        setReason("");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "操作失败");
      }
    });
  };

  const handleUnmute = async (userId: string, userName: string) => {
    startTransition(async () => {
      try {
        await unmuteUser(userId);
        toast.success(`已解除禁言 ${userName}`);
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
          <h2 className="text-lg font-semibold">用户列表</h2>
          <p className="text-sm text-muted-foreground">
            共 {totalCount} 位注册用户
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索用户名、昵称或邮箱..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="pl-9"
          />
        </div>
        <Select
          value={initialVipFilter || "all"}
          onValueChange={handleVipFilter}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="VIP 等级" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部等级</SelectItem>
            {[1, 2, 3, 4, 5, 6].map((level) => (
              <SelectItem key={level} value={level.toString()}>
                VIP {level}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={handleSearch} variant="secondary">
          <Search className="h-4 w-4 mr-2" />
          搜索
        </Button>
      </div>

      {/* User Table */}
      <div className="rounded-xl border border-border/50 bg-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50 bg-muted/30">
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                  用户
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground hidden sm:table-cell">
                  邮箱
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">
                  VIP
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground hidden md:table-cell">
                  声望
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">
                  状态
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground hidden lg:table-cell">
                  注册时间
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {users.map((user) => {
                const displayName =
                  user.full_name ?? user.username ?? "未设置昵称";
                const isMutedNow =
                  user.is_muted &&
                  user.muted_until &&
                  new Date(user.muted_until) > new Date();

                return (
                  <tr
                    key={user.id}
                    className="hover:bg-accent/30 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/users/${user.id}`}
                        className="flex items-center gap-3 group"
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.avatar_url ?? undefined} />
                          <AvatarFallback className="bg-gradient-to-br from-violet-500 to-purple-600 text-white text-xs">
                            {displayName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                            {displayName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            @{user.username ?? "—"}
                          </p>
                        </div>
                        {user.is_developer && (
                          <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 text-[10px]">
                            DEV
                          </Badge>
                        )}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground hidden sm:table-cell">
                      {user.email ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge
                        variant="outline"
                        className="gap-1 text-xs"
                      >
                        <Crown className="h-3 w-3 text-amber-500" />
                        {user.vip_level}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-center text-sm hidden md:table-cell">
                      {user.reputation_score ?? 0}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {user.is_banned ? (
                        <Badge variant="destructive" className="text-[10px]">
                          已封禁
                        </Badge>
                      ) : isMutedNow ? (
                        <Badge
                          className="bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20 text-[10px]"
                        >
                          禁言中
                        </Badge>
                      ) : (
                        <Badge
                          className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px]"
                        >
                          正常
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground hidden lg:table-cell">
                      {user.created_at
                        ? formatDistanceToNow(user.created_at)
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {user.is_banned ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-emerald-600"
                            onClick={() =>
                              handleUnban(user.id, displayName)
                            }
                            disabled={isPending}
                            title="解封"
                          >
                            <ShieldCheck className="h-4 w-4" />
                          </Button>
                        ) : (
                          <>
                            {isMutedNow ? (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-emerald-600"
                                onClick={() =>
                                  handleUnmute(user.id, displayName)
                                }
                                disabled={isPending}
                                title="解除禁言"
                              >
                                <Volume2 className="h-4 w-4" />
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-orange-600"
                                onClick={() =>
                                  setMuteDialog({
                                    userId: user.id,
                                    userName: displayName,
                                  })
                                }
                                disabled={isPending}
                                title="禁言"
                              >
                                <VolumeX className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-600"
                              onClick={() =>
                                setBanDialog({
                                  userId: user.id,
                                  userName: displayName,
                                })
                              }
                              disabled={isPending}
                              title="封禁"
                            >
                              <Ban className="h-4 w-4" />
                            </Button>
                          </>
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

      {/* Ban Dialog */}
      <Dialog
        open={!!banDialog}
        onOpenChange={(open) => !open && setBanDialog(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>封禁用户</DialogTitle>
            <DialogDescription>
              确定要封禁用户 <strong>{banDialog?.userName}</strong>？封禁后该用户将无法登录。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label>封禁原因 *</Label>
              <Textarea
                placeholder="请输入封禁原因..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBanDialog(null)}>
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={handleBan}
              disabled={!reason.trim() || isPending}
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Ban className="h-4 w-4 mr-2" />
              )}
              确认封禁
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mute Dialog */}
      <Dialog
        open={!!muteDialog}
        onOpenChange={(open) => !open && setMuteDialog(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>禁言用户</DialogTitle>
            <DialogDescription>
              确定要禁言用户 <strong>{muteDialog?.userName}</strong>？
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label>禁言时长</Label>
              <Select value={muteDuration} onValueChange={setMuteDuration}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 小时</SelectItem>
                  <SelectItem value="6">6 小时</SelectItem>
                  <SelectItem value="24">1 天</SelectItem>
                  <SelectItem value="72">3 天</SelectItem>
                  <SelectItem value="168">7 天</SelectItem>
                  <SelectItem value="720">30 天</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>禁言原因 *</Label>
              <Textarea
                placeholder="请输入禁言原因..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMuteDialog(null)}>
              取消
            </Button>
            <Button
              className="bg-orange-600 hover:bg-orange-700 text-white"
              onClick={handleMute}
              disabled={!reason.trim() || isPending}
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <VolumeX className="h-4 w-4 mr-2" />
              )}
              确认禁言
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
