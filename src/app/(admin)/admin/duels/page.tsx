import { requireAdmin } from "@/lib/admin/permissions";
import { Swords, Construction } from "lucide-react";

export default async function AdminDuelsPage() {
  await requireAdmin("admin");

  return (
    <div className="animate-fade-in flex flex-col items-center justify-center py-20">
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-blue-500/20 blur-3xl rounded-full" />
        <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/10 to-blue-500/10 border border-indigo-500/20">
          <Swords className="h-10 w-10 text-indigo-600 dark:text-indigo-400" />
        </div>
      </div>
      <h2 className="mt-6 text-xl font-bold">对决管理</h2>
      <p className="mt-2 text-sm text-muted-foreground text-center max-w-md">
        对决列表查看、异常干预、AI 裁判参数调整等功能正在开发中。
      </p>
      <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
        <Construction className="h-4 w-4" />
        <span>Phase 4 计划功能</span>
      </div>
    </div>
  );
}
