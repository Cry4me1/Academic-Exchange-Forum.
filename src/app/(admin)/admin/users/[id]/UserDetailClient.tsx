"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDistanceToNow } from "@/lib/utils";
import { banUser, unbanUser, muteUser, unmuteUser, resetUserPassword, updateUserBadges } from "@/lib/admin/actions";
import { toast } from "sonner";
import { ArrowLeft, Ban, CheckCircle, Clock, FileText, Loader2, MessageSquare, Shield, ShieldAlert, User, VolumeX, ExternalLink, Key, Medal, AlertTriangle } from "lucide-react";
import Link from "next/link";

interface UserDetailClientProps {
  profile: any;
  stats: {
    posts: number;
    comments: number;
  };
  reports: any[];
  reportersMap: Record<string, any>;
  actionLogs: any[];
  adminsMap: Record<string, any>;
}

export function UserDetailClient({
  profile,
  stats,
  reports,
  reportersMap,
  actionLogs,
  adminsMap,
}: UserDetailClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Dialog states
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [muteDialogOpen, setMuteDialogOpen] = useState(false);
  const [resetPwdDialogOpen, setResetPwdDialogOpen] = useState(false);
  const [badgesDialogOpen, setBadgesDialogOpen] = useState(false);
  
  // Form states
  const [reason, setReason] = useState("");
  const [muteDuration, setMuteDuration] = useState("24");
  const [newPassword, setNewPassword] = useState("");
  const [specialTitle, setSpecialTitle] = useState(profile.special_title || "");
  const [badgesInput, setBadgesInput] = useState((profile.badges || []).join(", "));

  const displayName = profile.full_name || profile.username || profile.email?.split("@")[0] || "未知用户";

  const handleBan = () => {
    if (!reason.trim()) return toast.error("请输入封禁原因");
    startTransition(async () => {
      try {
        await banUser(profile.id, reason);
        toast.success("用户已封禁");
        setBanDialogOpen(false);
        setReason("");
        router.refresh();
      } catch (err: any) {
        toast.error(err.message || "封禁失败");
      }
    });
  };

  const handleUnban = () => {
    startTransition(async () => {
      try {
        await unbanUser(profile.id);
        toast.success("用户已解封");
        router.refresh();
      } catch (err: any) {
        toast.error(err.message || "解封失败");
      }
    });
  };

  const handleMute = () => {
    if (!reason.trim()) return toast.error("请输入禁言原因");
    startTransition(async () => {
      try {
        await muteUser(profile.id, parseInt(muteDuration), reason);
        toast.success("用户已禁言");
        setMuteDialogOpen(false);
        setReason("");
        router.refresh();
      } catch (err: any) {
        toast.error(err.message || "禁言失败");
      }
    });
  };

  const handleUnmute = () => {
    startTransition(async () => {
      try {
        await unmuteUser(profile.id);
        toast.success("禁言已解除");
        router.refresh();
      } catch (err: any) {
        toast.error(err.message || "解除禁言失败");
      }
    });
  };

  const handleResetPassword = () => {
    if (!newPassword || newPassword.length < 6) return toast.error("密码至少需要 6 个字符");
    startTransition(async () => {
      try {
        await resetUserPassword(profile.id, newPassword);
        toast.success("密码重置成功");
        setResetPwdDialogOpen(false);
        setNewPassword("");
      } catch (err: any) {
        toast.error(err.message || "重置失败，请检查是否配置了 SUPABASE_SERVICE_ROLE_KEY");
      }
    });
  };

  const handleUpdateBadges = () => {
    startTransition(async () => {
      try {
        const badgesArr = badgesInput.split(",").map((s: string) => s.trim()).filter(Boolean);
        await updateUserBadges(profile.id, specialTitle || null, badgesArr);
        toast.success("称号与勋章已更新");
        setBadgesDialogOpen(false);
        router.refresh();
      } catch (err: any) {
        toast.error(err.message || "更新失败");
      }
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Link href="/admin/users">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            用户详情
          </h2>
          <p className="text-sm text-muted-foreground">
            查看和管理用户信息
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 左侧主要信息卡片 */}
        <Card className="md:col-span-1 shadow-sm">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-4 relative w-24 h-24">
              <Avatar className="w-24 h-24 border-4 border-background shadow-md">
                <AvatarImage src={profile.avatar_url} />
                <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                  {displayName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {profile.is_banned && (
                <div className="absolute -bottom-2 -right-2 bg-red-500 text-white p-1.5 rounded-full shadow-sm">
                  <Ban className="h-4 w-4" />
                </div>
              )}
              {!profile.is_banned && profile.is_muted && (
                <div className="absolute -bottom-2 -right-2 bg-amber-500 text-white p-1.5 rounded-full shadow-sm">
                  <VolumeX className="h-4 w-4" />
                </div>
              )}
            </div>
            <CardTitle className="text-xl">{displayName}</CardTitle>
            <CardDescription className="flex flex-col items-center gap-1 mt-1">
              <span>{profile.email}</span>
              <div className="flex items-center gap-2 mt-2">
                {profile.is_banned ? (
                  <Badge variant="destructive">已封禁</Badge>
                ) : profile.email_verified === false ? (
                  <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white border-transparent">等待验证</Badge>
                ) : profile.is_muted ? (
                  <Badge className="bg-amber-500 hover:bg-amber-600 text-white border-transparent">已禁言</Badge>
                ) : (
                  <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white">状态正常</Badge>
                )}
                {profile.email_verified !== false && (
                  <Badge variant="outline">VIP {profile.vip_level || 1}</Badge>
                )}
                {profile.special_title && (
                  <Badge variant="default" className="bg-purple-500 hover:bg-purple-600">
                    {profile.special_title}
                  </Badge>
                )}
              </div>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-4">
            <div className="flex justify-center gap-2">
              <Link href={`/user/${profile.id}`} target="_blank">
                <Button variant="outline" size="sm" className="w-full">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  前台主页
                </Button>
              </Link>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-center divide-x divide-border">
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.posts}</p>
                <p className="text-xs text-muted-foreground flex items-center justify-center gap-1 mt-1">
                  <FileText className="h-3 w-3" /> 帖子
                </p>
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.comments}</p>
                <p className="text-xs text-muted-foreground flex items-center justify-center gap-1 mt-1">
                  <MessageSquare className="h-3 w-3" /> 评论
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-border">
              <h4 className="text-sm font-medium">管理操作</h4>
              <div className="grid grid-cols-2 gap-2">
                {profile.is_banned ? (
                  <Button variant="outline" size="sm" onClick={handleUnban} disabled={isPending}>
                    {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2 text-emerald-500" />}
                    解除封禁
                  </Button>
                ) : (
                  <Button variant="destructive" size="sm" onClick={() => setBanDialogOpen(true)} disabled={isPending}>
                    <Ban className="h-4 w-4 mr-2" />
                    封禁用户
                  </Button>
                )}

                {profile.is_muted ? (
                  <Button variant="outline" size="sm" onClick={handleUnmute} disabled={isPending || profile.is_banned}>
                    {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2 text-emerald-500" />}
                    解除禁言
                  </Button>
                ) : (
                  <Button variant="secondary" size="sm" onClick={() => setMuteDialogOpen(true)} disabled={isPending || profile.is_banned} className="bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-400">
                    <VolumeX className="h-4 w-4 mr-2" />
                    禁言用户
                  </Button>
                )}

                <Button variant="outline" size="sm" onClick={() => setResetPwdDialogOpen(true)} disabled={isPending}>
                  <Key className="h-4 w-4 mr-2" />
                  重置密码
                </Button>

                <Button variant="outline" size="sm" onClick={() => setBadgesDialogOpen(true)} disabled={isPending}>
                  <Medal className="h-4 w-4 mr-2" />
                  勋章称号
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 右侧详细信息和标签页 */}
        <Card className="md:col-span-2 shadow-sm">
          <Tabs defaultValue="overview" className="w-full h-full flex flex-col">
            <CardHeader className="pb-0">
              <TabsList className="grid grid-cols-3 w-full max-w-md">
                <TabsTrigger value="overview">基本信息</TabsTrigger>
                <TabsTrigger value="reports">相关举报 ({reports.length})</TabsTrigger>
                <TabsTrigger value="logs">操作日志 ({actionLogs.length})</TabsTrigger>
              </TabsList>
            </CardHeader>
            <CardContent className="flex-1 pt-6">
              
              <TabsContent value="overview" className="space-y-6 mt-0">
                <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-sm">
                  <div>
                    <span className="text-muted-foreground block mb-1">用户 ID</span>
                    <span className="font-mono">{profile.id}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block mb-1">注册时间</span>
                    <span>{new Date(profile.created_at).toLocaleString("zh-CN")}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block mb-1">国家/地区</span>
                    <span>{profile.country || "未设置"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block mb-1">性别</span>
                    <span>{profile.gender === "male" ? "男" : profile.gender === "female" ? "女" : profile.gender === "other" ? "其他" : "未公开"}</span>
                  </div>
                  {(profile.badges && profile.badges.length > 0) && (
                    <div className="col-span-2">
                      <span className="text-muted-foreground block mb-1">荣誉勋章</span>
                      <div className="flex gap-2 flex-wrap mt-1">
                        {profile.badges.map((b: string, i: number) => (
                          <Badge key={i} variant="outline" className="bg-blue-50 dark:bg-blue-950/20 text-blue-600 border-blue-200">
                            {b}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="col-span-2">
                    <span className="text-muted-foreground block mb-1">个人简介</span>
                    <p className="bg-muted/50 p-3 rounded-md min-h-[60px]">
                      {profile.bio || "该用户还没有填写简介。"}
                    </p>
                  </div>
                </div>

                {profile.is_banned && (
                  <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-lg p-4 flex gap-3">
                    <ShieldAlert className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <h5 className="font-medium text-red-800 dark:text-red-400">封禁信息</h5>
                      <p className="text-sm text-red-600/80 dark:text-red-400/80 mt-1">
                        时间: {profile.banned_at ? new Date(profile.banned_at).toLocaleString("zh-CN") : "未知"}<br/>
                        原因: {profile.banned_reason || "未提供原因"}
                      </p>
                    </div>
                  </div>
                )}

                {profile.is_muted && !profile.is_banned && (
                  <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 rounded-lg p-4 flex gap-3">
                    <VolumeX className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <h5 className="font-medium text-amber-800 dark:text-amber-400">禁言信息</h5>
                      <p className="text-sm text-amber-600/80 dark:text-amber-400/80 mt-1">
                        解禁时间: {profile.muted_until ? new Date(profile.muted_until).toLocaleString("zh-CN") : "未知"}<br/>
                        原因: {profile.muted_reason || "未提供原因"}
                      </p>
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="reports" className="mt-0">
                {reports.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground flex flex-col items-center">
                    <Shield className="h-10 w-10 opacity-20 mb-2" />
                    <p>没有收到针对该用户的举报</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reports.map(report => (
                      <div key={report.id} className="border border-border rounded-lg p-4 text-sm">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex gap-2 items-center">
                            <Badge variant={report.status === "resolved" ? "secondary" : report.status === "rejected" ? "outline" : "destructive"}>
                              {report.status === "resolved" ? "已处理" : report.status === "rejected" ? "已驳回" : "待处理"}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {report.target_type === "user" ? "被举报用户" : report.target_type === "post" ? "被举报帖子" : report.target_type === "comment" ? "被举报评论" : report.target_type}
                            </Badge>
                          </div>
                          <span className="text-muted-foreground text-xs">{formatDistanceToNow(report.created_at)}</span>
                        </div>
                        <p className="mb-2"><span className="font-medium text-foreground">举报原因：</span> {report.reason}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-3">
                          <Avatar className="h-5 w-5">
                            <AvatarImage src={reportersMap[report.reporter_id]?.avatar_url} />
                            <AvatarFallback>{reportersMap[report.reporter_id]?.full_name?.charAt(0) || "?"}</AvatarFallback>
                          </Avatar>
                          <span>举报人：{reportersMap[report.reporter_id]?.full_name || "未知"}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="logs" className="mt-0">
                {actionLogs.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground flex flex-col items-center">
                    <Clock className="h-10 w-10 opacity-20 mb-2" />
                    <p>暂无管理操作记录</p>
                  </div>
                ) : (
                  <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
                    {actionLogs.map((log, i) => (
                      <div key={log.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full border border-background bg-muted text-muted-foreground shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                          {log.action_type.includes("ban") ? <Ban className="h-4 w-4" /> : log.action_type.includes("mute") ? <VolumeX className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
                        </div>
                        <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] border border-border bg-card p-4 rounded-xl shadow-sm">
                          <div className="flex items-center justify-between space-x-2 mb-1">
                            <div className="font-bold text-foreground text-sm">{
                              log.action_type === "user_banned" ? "封禁用户" :
                              log.action_type === "user_unbanned" ? "解除封禁" :
                              log.action_type === "user_muted" ? "禁言用户" :
                              log.action_type === "user_unmuted" ? "解除禁言" :
                              log.action_type === "vip_level_adjusted" ? "调整VIP" :
                              log.action_type === "credits_adjusted" ? "调整积分" : log.action_type
                            }</div>
                            <time className="font-mono text-xs text-muted-foreground">{new Date(log.created_at).toLocaleString("zh-CN")}</time>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {log.details?.reason && <p>原因: {log.details.reason}</p>}
                            {log.details?.duration_hours && <p>时长: {log.details.duration_hours} 小时</p>}
                            <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-border text-xs">
                              <User className="h-3 w-3" /> 操作人: {adminsMap[log.admin_id]?.full_name || "管理员"}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

            </CardContent>
          </Tabs>
        </Card>
      </div>

      {/* Ban Dialog */}
      <Dialog open={banDialogOpen} onOpenChange={setBanDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>封禁用户</DialogTitle>
            <DialogDescription>
              封禁后用户将无法登录和使用系统的任何功能。此操作会被记录。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>封禁原因 *</Label>
              <Textarea 
                placeholder="请输入详细的封禁原因，这将作为系统通知发送给用户" 
                value={reason} 
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBanDialogOpen(false)}>取消</Button>
            <Button variant="destructive" onClick={handleBan} disabled={isPending || !reason.trim()}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              确认封禁
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mute Dialog */}
      <Dialog open={muteDialogOpen} onOpenChange={setMuteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>禁言用户</DialogTitle>
            <DialogDescription>
              被禁言的用户可以浏览内容，但无法发布帖子和评论。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>禁言时长</Label>
              <Select value={muteDuration} onValueChange={setMuteDuration}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="24">24 小时</SelectItem>
                  <SelectItem value="72">3 天</SelectItem>
                  <SelectItem value="168">7 天</SelectItem>
                  <SelectItem value="720">30 天</SelectItem>
                  <SelectItem value="8760">永久 (1年)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>禁言原因 *</Label>
              <Textarea 
                placeholder="请输入禁言原因，将作为系统通知发送给用户" 
                value={reason} 
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMuteDialogOpen(false)}>取消</Button>
            <Button onClick={handleMute} disabled={isPending || !reason.trim()} className="bg-amber-500 hover:bg-amber-600 text-white">
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              确认禁言
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={resetPwdDialogOpen} onOpenChange={setResetPwdDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>重置用户密码</DialogTitle>
            <DialogDescription>
              此操作将直接修改用户的登录密码。请确保你有足够的权限。
              <div className="mt-2 text-amber-600 dark:text-amber-400 flex items-start gap-2 bg-amber-50 dark:bg-amber-950/30 p-2 rounded-md">
                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                <span className="text-xs">需要在环境变量中配置 SUPABASE_SERVICE_ROLE_KEY 才能执行此操作。</span>
              </div>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>新密码 *</Label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pl-10"
                  placeholder="请输入新密码 (至少6位)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetPwdDialogOpen(false)}>取消</Button>
            <Button onClick={handleResetPassword} disabled={isPending || newPassword.length < 6} className="bg-red-600 hover:bg-red-700 text-white">
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              确认重置
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Badges & Title Dialog */}
      <Dialog open={badgesDialogOpen} onOpenChange={setBadgesDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>管理称号与勋章</DialogTitle>
            <DialogDescription>
              为该用户发放特殊的专属称号和荣誉勋章。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>特殊称号</Label>
              <input
                type="text"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="例如：学术泰斗、核心贡献者..."
                value={specialTitle}
                onChange={(e) => setSpecialTitle(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">称号将在用户头像旁以特殊徽章显示，留空表示移除。</p>
            </div>
            <div className="space-y-2">
              <Label>荣誉勋章 (用逗号分隔)</Label>
              <Textarea 
                placeholder="例如：论文达人, 优秀版主, 最佳辩手" 
                value={badgesInput} 
                onChange={(e) => setBadgesInput(e.target.value)}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">多个勋章请用英文或中文逗号隔开。</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBadgesDialogOpen(false)}>取消</Button>
            <Button onClick={handleUpdateBadges} disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              保存设置
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
