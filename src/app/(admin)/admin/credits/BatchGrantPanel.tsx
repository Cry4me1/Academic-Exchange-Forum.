"use client";

import { useState, useTransition, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Gift,
  Plus,
  Loader2,
  Users,
  Crown,
  UserCheck,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Send,
  Search,
  X,
} from "lucide-react";
import { toast } from "sonner";
import type { BatchGrant } from "@/lib/admin/credits";
import { executeBatchGrant, getUserCreditsOverview } from "@/lib/admin/credits";

interface Props {
  initialGrants: BatchGrant[];
}

interface UserOption {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  vip_level: number;
  balance: number;
}

const statusConfig: Record<
  string,
  { label: string; icon: React.ReactNode; color: string }
> = {
  pending: {
    label: "待执行",
    icon: <Clock className="h-3.5 w-3.5" />,
    color:
      "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20",
  },
  processing: {
    label: "执行中",
    icon: <Loader2 className="h-3.5 w-3.5 animate-spin" />,
    color:
      "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  },
  completed: {
    label: "已完成",
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    color:
      "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  },
  failed: {
    label: "失败",
    icon: <XCircle className="h-3.5 w-3.5" />,
    color:
      "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
  },
};

const targetTypeLabels: Record<
  string,
  { label: string; icon: React.ReactNode }
> = {
  all: { label: "所有用户", icon: <Users className="h-4 w-4" /> },
  vip_level: { label: "VIP 等级", icon: <Crown className="h-4 w-4" /> },
  user_ids: { label: "指定用户", icon: <UserCheck className="h-4 w-4" /> },
};

export function BatchGrantPanel({ initialGrants }: Props) {
  const [grants, setGrants] = useState(initialGrants);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  // 表单状态
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState(100);
  const [grantType, setGrantType] = useState("event_bonus");
  const [targetType, setTargetType] = useState<
    "all" | "vip_level" | "user_ids"
  >("all");
  const [minVipLevel, setMinVipLevel] = useState(1);

  // 用户选择状态
  const [allUsers, setAllUsers] = useState<UserOption[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<UserOption[]>([]);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 加载用户列表
  const loadUsers = useCallback(async () => {
    if (allUsers.length > 0) return;
    setIsLoadingUsers(true);
    try {
      const users = await getUserCreditsOverview();
      setAllUsers(users);
    } catch {
      toast.error("加载用户列表失败");
    } finally {
      setIsLoadingUsers(false);
    }
  }, [allUsers.length]);

  // 当选择 "指定用户" 时加载用户列表
  useEffect(() => {
    if (targetType === "user_ids" && allUsers.length === 0) {
      loadUsers();
    }
  }, [targetType, allUsers.length, loadUsers]);

  // 点击外部关闭下拉
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 过滤用户
  const filteredUsers = userSearchQuery
    ? allUsers.filter(
        (u) =>
          !selectedUsers.find((s) => s.id === u.id) &&
          (u.full_name?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
            u.email?.toLowerCase().includes(userSearchQuery.toLowerCase()))
      )
    : allUsers.filter((u) => !selectedUsers.find((s) => s.id === u.id));

  const addUser = (user: UserOption) => {
    setSelectedUsers((prev) => [...prev, user]);
    setUserSearchQuery("");
    setIsDropdownOpen(false);
  };

  const removeUser = (userId: string) => {
    setSelectedUsers((prev) => prev.filter((u) => u.id !== userId));
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setAmount(100);
    setGrantType("event_bonus");
    setTargetType("all");
    setMinVipLevel(1);
    setSelectedUsers([]);
    setUserSearchQuery("");
  };

  const handleSubmit = () => {
    if (!title.trim()) {
      toast.error("请输入活动标题");
      return;
    }
    if (amount <= 0) {
      toast.error("发放金额必须大于 0");
      return;
    }

    const userIds =
      targetType === "user_ids"
        ? selectedUsers.map((u) => u.id)
        : undefined;

    if (targetType === "user_ids" && (!userIds || userIds.length === 0)) {
      toast.error("请至少选择一位用户");
      return;
    }

    startTransition(async () => {
      try {
        const result = await executeBatchGrant({
          title,
          description: description || undefined,
          amount,
          grantType,
          targetType,
          minVipLevel: targetType === "vip_level" ? minVipLevel : undefined,
          userIds,
        });

        toast.success(
          `发放成功！共 ${result.affectedUsers} 位用户，合计 ${result.totalGranted.toLocaleString("zh-CN")} 积分`
        );

        setIsDialogOpen(false);
        resetForm();
        window.location.reload();
      } catch (err) {
        toast.error(
          `发放失败: ${err instanceof Error ? err.message : "未知错误"}`
        );
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* 新建发放按钮 */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">批量积分发放</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            为用户批量发放活动奖励、补偿积分等
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white shadow-lg shadow-pink-500/25">
              <Plus className="h-4 w-4 mr-2" />
              新建发放
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Gift className="h-5 w-5 text-pink-500" />
                批量积分发放
              </DialogTitle>
              <DialogDescription>
                为指定范围的用户批量发放积分奖励，执行后不可撤销。
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              {/* 活动标题 */}
              <div className="space-y-2">
                <Label htmlFor="batch-title">活动标题 *</Label>
                <Input
                  id="batch-title"
                  placeholder="如：五一劳动节奖励"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              {/* 描述 */}
              <div className="space-y-2">
                <Label htmlFor="batch-desc">活动描述</Label>
                <Textarea
                  id="batch-desc"
                  placeholder="可选，将随通知发送给用户"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                />
              </div>

              {/* 金额和类型 */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="batch-amount">发放金额 *</Label>
                  <Input
                    id="batch-amount"
                    type="number"
                    min={1}
                    value={amount}
                    onChange={(e) => setAmount(parseInt(e.target.value) || 0)}
                    className="text-lg font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <Label>发放类型</Label>
                  <Select value={grantType} onValueChange={setGrantType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="event_bonus">活动奖励</SelectItem>
                      <SelectItem value="admin_adjustment">
                        管理员调整
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* 目标用户 */}
              <div className="space-y-2">
                <Label>目标用户范围</Label>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    Object.entries(targetTypeLabels) as [
                      "all" | "vip_level" | "user_ids",
                      { label: string; icon: React.ReactNode },
                    ][]
                  ).map(([key, cfg]) => (
                    <Button
                      key={key}
                      variant={targetType === key ? "default" : "outline"}
                      size="sm"
                      onClick={() => setTargetType(key)}
                      className="h-auto py-2 flex flex-col items-center gap-1"
                    >
                      {cfg.icon}
                      <span className="text-[10px]">{cfg.label}</span>
                    </Button>
                  ))}
                </div>
              </div>

              {/* VIP 等级选择 */}
              {targetType === "vip_level" && (
                <div className="space-y-2">
                  <Label>最低 VIP 等级</Label>
                  <Select
                    value={String(minVipLevel)}
                    onValueChange={(v) => setMinVipLevel(parseInt(v))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6].map((level) => (
                        <SelectItem key={level} value={String(level)}>
                          V{level} 及以上
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* 用户搜索选择器 */}
              {targetType === "user_ids" && (
                <div className="space-y-2">
                  <Label>选择用户</Label>
                  {/* 已选用户标签 */}
                  {selectedUsers.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 p-2 rounded-lg border bg-muted/30 max-h-[120px] overflow-y-auto">
                      {selectedUsers.map((user) => (
                        <Badge
                          key={user.id}
                          variant="secondary"
                          className="flex items-center gap-1 pr-1 text-xs"
                        >
                          <Avatar className="h-4 w-4">
                            <AvatarImage src={user.avatar_url ?? undefined} />
                            <AvatarFallback className="text-[8px]">
                              {user.full_name?.charAt(0) ?? "?"}
                            </AvatarFallback>
                          </Avatar>
                          <span>{user.full_name ?? user.email ?? "未知"}</span>
                          <button
                            onClick={() => removeUser(user.id)}
                            className="ml-0.5 rounded-full p-0.5 hover:bg-destructive/20 hover:text-destructive transition-colors"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* 搜索框 */}
                  <div className="relative" ref={dropdownRef}>
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="搜索用户名或邮箱..."
                        value={userSearchQuery}
                        onChange={(e) => {
                          setUserSearchQuery(e.target.value);
                          setIsDropdownOpen(true);
                        }}
                        onFocus={() => setIsDropdownOpen(true)}
                        className="pl-8 text-sm"
                      />
                    </div>

                    {/* 下拉列表 */}
                    {isDropdownOpen && (
                      <div className="absolute z-50 w-full mt-1 max-h-[200px] overflow-y-auto rounded-lg border bg-popover shadow-lg">
                        {isLoadingUsers ? (
                          <div className="flex items-center justify-center py-4">
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                            <span className="ml-2 text-xs text-muted-foreground">
                              加载用户列表...
                            </span>
                          </div>
                        ) : filteredUsers.length === 0 ? (
                          <div className="py-4 text-center text-xs text-muted-foreground">
                            {userSearchQuery
                              ? "未找到匹配用户"
                              : "所有用户已选择"}
                          </div>
                        ) : (
                          filteredUsers.slice(0, 20).map((user) => (
                            <button
                              key={user.id}
                              onClick={() => addUser(user)}
                              className="flex items-center gap-2 w-full px-3 py-2 text-left hover:bg-accent transition-colors"
                            >
                              <Avatar className="h-7 w-7 shrink-0">
                                <AvatarImage
                                  src={user.avatar_url ?? undefined}
                                />
                                <AvatarFallback className="text-[10px]">
                                  {user.full_name?.charAt(0) ?? "?"}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">
                                  {user.full_name || "未设置昵称"}
                                </p>
                                <p className="text-[10px] text-muted-foreground truncate">
                                  {user.email} · V{user.vip_level} · 余额{" "}
                                  {user.balance}
                                </p>
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    已选择 {selectedUsers.length} 位用户
                  </p>
                </div>
              )}

              {/* 预估信息 */}
              <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                  <div className="text-xs text-muted-foreground">
                    <p className="font-medium text-foreground">
                      请确认发放信息
                    </p>
                    <p className="mt-1">
                      每人发放{" "}
                      <span className="font-bold text-amber-500">
                        {amount}
                      </span>{" "}
                      积分，
                      {targetType === "all" && "范围：所有注册用户"}
                      {targetType === "vip_level" &&
                        `范围：V${minVipLevel} 及以上用户`}
                      {targetType === "user_ids" &&
                        `范围：${selectedUsers.length} 位指定用户`}
                    </p>
                    <p className="mt-1 text-amber-600 dark:text-amber-400">
                      此操作不可撤销，请仔细确认。
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={isPending}
              >
                取消
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isPending || !title.trim() || amount <= 0}
                className="bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    发放中...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    确认发放
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* 发放历史 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Gift className="h-4 w-4" />
            发放历史
            <Badge variant="secondary" className="ml-1">
              {grants.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {grants.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Gift className="h-10 w-10 mb-3 opacity-50" />
              <p className="text-sm">暂无批量发放记录</p>
              <p className="text-xs mt-1">点击「新建发放」开始</p>
            </div>
          ) : (
            <div className="space-y-3">
              {grants.map((grant) => {
                const status =
                  statusConfig[grant.status] ?? statusConfig.pending;
                const targetInfo = grant.target_criteria as Record<
                  string,
                  unknown
                >;
                const targetLabel =
                  targetTypeLabels[targetInfo.type as string] ??
                  targetTypeLabels.all;

                return (
                  <div
                    key={grant.id}
                    className="flex items-center gap-4 p-4 rounded-lg border hover:bg-accent/30 transition-colors"
                  >
                    {/* 状态图标 */}
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                        grant.status === "completed"
                          ? "bg-gradient-to-br from-emerald-500/20 to-green-500/20"
                          : grant.status === "failed"
                            ? "bg-gradient-to-br from-rose-500/20 to-red-500/20"
                            : "bg-gradient-to-br from-blue-500/20 to-indigo-500/20"
                      }`}
                    >
                      <Gift
                        className={`h-5 w-5 ${
                          grant.status === "completed"
                            ? "text-emerald-500"
                            : grant.status === "failed"
                              ? "text-rose-500"
                              : "text-blue-500"
                        }`}
                      />
                    </div>

                    {/* 详情 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-semibold truncate">
                          {grant.title}
                        </p>
                        <Badge variant="outline" className={status.color}>
                          <span className="mr-1">{status.icon}</span>
                          {status.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1">
                          {targetLabel.icon}
                          {targetLabel.label}
                          {targetInfo.type === "vip_level" &&
                            ` (≥V${targetInfo.min_level})`}
                        </span>
                        <span>·</span>
                        <span>
                          {grant.affected_user_count} 人 × {grant.amount} ={" "}
                          <span className="font-medium text-amber-500">
                            {grant.total_amount_granted.toLocaleString("zh-CN")}
                          </span>
                        </span>
                        <span>·</span>
                        <span>{grant.creator_name ?? "未知"}</span>
                      </div>
                      {grant.description && (
                        <p className="text-[11px] text-muted-foreground mt-1 truncate">
                          {grant.description}
                        </p>
                      )}
                    </div>

                    {/* 时间 */}
                    <div className="text-right text-xs text-muted-foreground shrink-0">
                      <p>
                        {new Date(grant.created_at).toLocaleDateString("zh-CN")}
                      </p>
                      <p>
                        {new Date(grant.created_at).toLocaleTimeString(
                          "zh-CN",
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
