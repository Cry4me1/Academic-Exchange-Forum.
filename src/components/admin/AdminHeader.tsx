"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Bell,
  Menu,
  Moon,
  Sun,
  LogOut,
  User,
  ExternalLink,
  AlertTriangle,
  FileText,
  Users,
  ScrollText,
} from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { AdminMobileNav } from "@/components/admin/AdminMobileNav";

interface AdminHeaderProps {
  user: {
    id: string;
    role: string;
    fullName: string;
    avatarUrl: string | null;
    email: string;
  };
}

const pageTitles: Record<string, string> = {
  "/admin": "仪表盘",
  "/admin/users": "用户管理",
  "/admin/posts": "内容管理",
  "/admin/reports": "举报处理",
  "/admin/credits": "积分管理",
  "/admin/duels": "对决管理",
  "/admin/announcements": "公告管理",
  "/admin/logs": "操作日志",
  "/admin/settings": "系统设置",
};

export function AdminHeader({ user }: AdminHeaderProps) {
  const pathname = usePathname();
  const [isDark, setIsDark] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [pendingReports, setPendingReports] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);

  const fetchPendingReports = useCallback(async () => {
    try {
      const supabase = createClient();
      const { count } = await supabase
        .from("reports")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending");
      setPendingReports(count ?? 0);
    } catch {
      // 静默失败
    }
  }, []);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
    fetchPendingReports();
  }, [fetchPendingReports]);

  const toggleTheme = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    document.documentElement.classList.toggle("dark", newIsDark);
    localStorage.setItem("theme", newIsDark ? "dark" : "light");
  };

  const currentTitle =
    Object.entries(pageTitles).find(([path]) => pathname === path)?.[1] ??
    "管理后台";

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border/50 bg-background/80 backdrop-blur-xl px-4 md:px-6">
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Mobile Navigation Sheet */}
      {mobileMenuOpen && (
        <AdminMobileNav
          role={user.role}
          open={mobileMenuOpen}
          onOpenChange={setMobileMenuOpen}
        />
      )}

      {/* Page Title */}
      <div className="flex-1">
        <h1 className="text-lg font-semibold tracking-tight">
          {currentTitle}
        </h1>
        <p className="text-xs text-muted-foreground hidden sm:block">
          Scholarly 管理控制台
        </p>
      </div>

      {/* Quick Actions */}
      <div className="flex items-center gap-2">
        {/* View Site */}
        <Link href="/dashboard" target="_blank">
          <Button variant="ghost" size="icon" className="hidden sm:flex">
            <ExternalLink className="h-4 w-4" />
          </Button>
        </Link>

        {/* Theme Toggle */}
        <Button variant="ghost" size="icon" onClick={toggleTheme}>
          {isDark ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </Button>

        {/* Notifications */}
        <Popover open={notifOpen} onOpenChange={setNotifOpen}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-4 w-4" />
              {pendingReports > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-red-500 text-[9px] font-bold text-white flex items-center justify-center">
                  {pendingReports > 9 ? "9+" : pendingReports}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 p-0">
            <div className="border-b border-border/50 px-4 py-3">
              <h3 className="text-sm font-semibold">通知中心</h3>
              <p className="text-xs text-muted-foreground">管理后台快捷入口</p>
            </div>
            <div className="divide-y divide-border/30">
              {/* 待处理举报 */}
              <Link
                href="/admin/reports?status=pending"
                onClick={() => setNotifOpen(false)}
                className="flex items-center gap-3 px-4 py-3 hover:bg-accent/50 transition-colors"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500/10">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">待处理举报</p>
                  <p className="text-xs text-muted-foreground">
                    {pendingReports > 0
                      ? `${pendingReports} 条举报等待审核`
                      : "暂无待处理举报 🎉"}
                  </p>
                </div>
                {pendingReports > 0 && (
                  <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                )}
              </Link>

              {/* 用户管理 */}
              <Link
                href="/admin/users"
                onClick={() => setNotifOpen(false)}
                className="flex items-center gap-3 px-4 py-3 hover:bg-accent/50 transition-colors"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-500/10">
                  <Users className="h-4 w-4 text-violet-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">用户管理</p>
                  <p className="text-xs text-muted-foreground">查看和管理用户</p>
                </div>
              </Link>

              {/* 内容管理 */}
              <Link
                href="/admin/posts"
                onClick={() => setNotifOpen(false)}
                className="flex items-center gap-3 px-4 py-3 hover:bg-accent/50 transition-colors"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-500/10">
                  <FileText className="h-4 w-4 text-cyan-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">内容管理</p>
                  <p className="text-xs text-muted-foreground">审核帖子内容</p>
                </div>
              </Link>

              {/* 操作日志 */}
              <Link
                href="/admin/logs"
                onClick={() => setNotifOpen(false)}
                className="flex items-center gap-3 px-4 py-3 hover:bg-accent/50 transition-colors"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/10">
                  <ScrollText className="h-4 w-4 text-amber-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">操作日志</p>
                  <p className="text-xs text-muted-foreground">查看管理操作记录</p>
                </div>
              </Link>
            </div>
          </PopoverContent>
        </Popover>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center gap-2 pl-2 pr-3 h-9"
            >
              <Avatar className="h-7 w-7">
                <AvatarImage src={user.avatarUrl ?? undefined} />
                <AvatarFallback className="bg-gradient-to-br from-violet-500 to-purple-600 text-white text-xs">
                  {user.fullName?.charAt(0) ?? "A"}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium hidden sm:block">
                {user.fullName}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-3 py-2">
              <p className="text-sm font-medium">{user.fullName}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={`/user/${user.id}`} className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                查看个人主页
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/dashboard" className="cursor-pointer">
                <ExternalLink className="mr-2 h-4 w-4" />
                返回主站
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-500 cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" />
              退出登录
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
