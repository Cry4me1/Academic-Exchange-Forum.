"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  FileText,
  AlertTriangle,
  Coins,
  Swords,
  Megaphone,
  ScrollText,
  Settings,
  Shield,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  minRole?: string;
}

const navItems: NavItem[] = [
  {
    label: "仪表盘",
    href: "/admin",
    icon: <LayoutDashboard className="h-5 w-5" />,
  },
  {
    label: "用户管理",
    href: "/admin/users",
    icon: <Users className="h-5 w-5" />,
  },
  {
    label: "内容管理",
    href: "/admin/posts",
    icon: <FileText className="h-5 w-5" />,
  },
  {
    label: "举报处理",
    href: "/admin/reports",
    icon: <AlertTriangle className="h-5 w-5" />,
  },
  {
    label: "积分管理",
    href: "/admin/credits",
    icon: <Coins className="h-5 w-5" />,
  },
  {
    label: "对决管理",
    href: "/admin/duels",
    icon: <Swords className="h-5 w-5" />,
  },
  {
    label: "公告管理",
    href: "/admin/announcements",
    icon: <Megaphone className="h-5 w-5" />,
  },
  {
    label: "操作日志",
    href: "/admin/logs",
    icon: <ScrollText className="h-5 w-5" />,
  },
  {
    label: "系统设置",
    href: "/admin/settings",
    icon: <Settings className="h-5 w-5" />,
    minRole: "super_admin",
  },
];

const roleLabels: Record<string, string> = {
  super_admin: "超级管理员",
  admin: "管理员",
  moderator: "审核员",
  analyst: "分析员",
};

const roleColors: Record<string, string> = {
  super_admin: "from-amber-500 to-orange-600",
  admin: "from-blue-500 to-indigo-600",
  moderator: "from-emerald-500 to-teal-600",
  analyst: "from-slate-500 to-gray-600",
};

export function AdminSidebar({ role }: { role: string }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "relative flex flex-col border-r border-border/50 bg-card/50 backdrop-blur-xl transition-all duration-300 ease-in-out",
          "hidden md:flex",
          collapsed ? "w-[70px]" : "w-[260px]"
        )}
      >
        {/* Logo & Title */}
        <div className="flex items-center gap-3 px-4 h-16 border-b border-border/50">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/25">
            <Shield className="h-5 w-5 text-white" />
          </div>
          {!collapsed && (
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-bold tracking-tight">
                Scholarly
              </span>
              <span className="text-[10px] text-muted-foreground">
                管理控制台
              </span>
            </div>
          )}
        </div>

        {/* Role Badge */}
        {!collapsed && (
          <div className="px-4 py-3">
            <div
              className={cn(
                "flex items-center gap-2 rounded-lg bg-gradient-to-r px-3 py-2 text-white shadow-sm",
                roleColors[role] ?? "from-slate-500 to-gray-600"
              )}
            >
              <div className="h-2 w-2 rounded-full bg-white/80 animate-pulse" />
              <span className="text-xs font-medium">
                {roleLabels[role] ?? role}
              </span>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/admin" && pathname.startsWith(item.href));

            const linkContent = (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-gradient-to-r from-violet-500/10 to-purple-500/10 text-violet-600 dark:text-violet-400 shadow-sm border border-violet-500/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
                  collapsed && "justify-center px-2"
                )}
              >
                <span
                  className={cn(
                    "shrink-0 transition-colors",
                    isActive
                      ? "text-violet-600 dark:text-violet-400"
                      : "text-muted-foreground group-hover:text-foreground"
                  )}
                >
                  {item.icon}
                </span>
                {!collapsed && <span>{item.label}</span>}
                {isActive && !collapsed && (
                  <div className="ml-auto h-1.5 w-1.5 rounded-full bg-violet-500" />
                )}
              </Link>
            );

            if (collapsed) {
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                  <TooltipContent side="right" className="font-medium">
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              );
            }

            return linkContent;
          })}
        </nav>

        {/* Collapse Button */}
        <div className="border-t border-border/50 p-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed(!collapsed)}
            className={cn(
              "w-full justify-center text-muted-foreground hover:text-foreground",
              !collapsed && "justify-start"
            )}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4 mr-2" />
                <span className="text-xs">收起菜单</span>
              </>
            )}
          </Button>
        </div>

        {/* Back to site link */}
        <div className="border-t border-border/50 p-3">
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href="/dashboard"
                  className="flex items-center justify-center rounded-lg px-2 py-2.5 text-xs text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">返回主站</TooltipContent>
            </Tooltip>
          ) : (
            <Link
              href="/dashboard"
              className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-xs text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>返回主站</span>
            </Link>
          )}
        </div>
      </aside>
    </TooltipProvider>
  );
}
