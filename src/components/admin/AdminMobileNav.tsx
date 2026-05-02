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
  X,
} from "lucide-react";
import { useEffect } from "react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { label: "仪表盘", href: "/admin", icon: <LayoutDashboard className="h-5 w-5" /> },
  { label: "用户管理", href: "/admin/users", icon: <Users className="h-5 w-5" /> },
  { label: "内容管理", href: "/admin/posts", icon: <FileText className="h-5 w-5" /> },
  { label: "举报处理", href: "/admin/reports", icon: <AlertTriangle className="h-5 w-5" /> },
  { label: "积分管理", href: "/admin/credits", icon: <Coins className="h-5 w-5" /> },
  { label: "对决管理", href: "/admin/duels", icon: <Swords className="h-5 w-5" /> },
  { label: "公告管理", href: "/admin/announcements", icon: <Megaphone className="h-5 w-5" /> },
  { label: "操作日志", href: "/admin/logs", icon: <ScrollText className="h-5 w-5" /> },
  { label: "系统设置", href: "/admin/settings", icon: <Settings className="h-5 w-5" /> },
];

interface AdminMobileNavProps {
  role: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AdminMobileNav({ role, open, onOpenChange }: AdminMobileNavProps) {
  const pathname = usePathname();

  // Close when navigating
  useEffect(() => {
    onOpenChange(false);
  }, [pathname, onOpenChange]);

  // Prevent scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
        onClick={() => onOpenChange(false)}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 left-0 z-50 w-72 bg-card border-r border-border/50 shadow-2xl md:hidden animate-in slide-in-from-left duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-4 h-16 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/25">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="text-sm font-bold">Scholarly</div>
              <div className="text-[10px] text-muted-foreground">管理控制台</div>
            </div>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="p-2 rounded-lg hover:bg-accent transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/admin" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-all",
                  isActive
                    ? "bg-gradient-to-r from-violet-500/10 to-purple-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                )}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Back to site */}
        <div className="border-t border-border/50 p-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-xs text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
          >
            ← 返回主站
          </Link>
        </div>
      </div>
    </>
  );
}
