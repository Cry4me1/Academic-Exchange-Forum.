import { requireAdmin } from "@/lib/admin/permissions";
import { Settings, Construction } from "lucide-react";

export default async function AdminSettingsPage() {
  await requireAdmin("super_admin");

  return (
    <div className="animate-fade-in flex flex-col items-center justify-center py-20">
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-500/20 to-gray-500/20 blur-3xl rounded-full" />
        <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-500/10 to-gray-500/10 border border-slate-500/20">
          <Settings className="h-10 w-10 text-slate-600 dark:text-slate-400" />
        </div>
      </div>
      <h2 className="mt-6 text-xl font-bold">系统设置</h2>
      <p className="mt-2 text-sm text-muted-foreground text-center max-w-md">
        注册设置、AI 功能开关、全局通知、积分策略配置等功能正在开发中。
      </p>
      <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
        <Construction className="h-4 w-4" />
        <span>Phase 4 计划功能</span>
      </div>
    </div>
  );
}
