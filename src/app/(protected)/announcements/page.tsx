import { createClient } from "@/lib/supabase/server";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { Bell, Rocket, Sparkles, Wrench, Megaphone, ArrowLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const categoryStyles: Record<string, { icon: any, label: string, color: string, bg: string }> = {
  update: { icon: Rocket, label: "版本更新", color: "text-violet-500", bg: "from-primary to-violet-500" },
  activity: { icon: Sparkles, label: "活动通知", color: "text-purple-500", bg: "from-primary to-purple-500" },
  system: { icon: Megaphone, label: "系统通知", color: "text-blue-500", bg: "from-blue-500 to-indigo-500" },
  maintenance: { icon: Wrench, label: "维护通知", color: "text-amber-500", bg: "from-amber-500 to-orange-500" },
};

export default async function AnnouncementsPage() {
  const supabase = await createClient();

  const now = new Date().toISOString();
  
  const { data: announcements, error } = await supabase
    .from("system_announcements")
    .select(`
      *,
      creator:profiles!system_announcements_created_by_fkey(full_name)
    `)
    .eq("is_active", true)
    .lte("start_time", now)
    .order("start_time", { ascending: false });

  // Filter out ended announcements
  const validData = announcements?.filter(a => !a.end_time || a.end_time > now) || [];

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8 min-h-screen">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="outline" size="icon" className="shrink-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">全部公告</h1>
            <p className="text-sm text-muted-foreground mt-1">Scholarly 平台的系统通知、活动与版本更新</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {validData.length === 0 ? (
          <div className="text-center py-20 bg-card rounded-2xl border border-border/50">
            <Bell className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium text-foreground">暂无公告</h3>
            <p className="text-sm text-muted-foreground mt-1">暂时没有需要展示的公告信息</p>
          </div>
        ) : (
          validData.map((announcement) => {
            const style = categoryStyles[announcement.category] || categoryStyles.system;
            const Icon = style.icon;
            const isNew = (new Date().getTime() - new Date(announcement.start_time).getTime()) < 3 * 24 * 60 * 60 * 1000;

            let href = `/announcements/${announcement.id}`;
            if (announcement.title.includes("v1.0.0")) href = "/updates";
            else if (announcement.title.includes("上线啦")) href = "/announcements/launch-2026";
            else if (announcement.title.includes("新手教程指南")) href = "/announcements/tutorials";

            return (
              <Link key={announcement.id} href={href} className="block group">
                <article className="bg-card border border-border/50 rounded-xl p-5 hover:border-primary/40 hover:shadow-md transition-all duration-200">
                  <div className="flex items-start sm:items-center gap-4">
                    <div className={`h-12 w-12 shrink-0 rounded-full bg-gradient-to-br ${style.bg} flex items-center justify-center shadow-inner`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full bg-muted ${style.color}`}>
                          {style.label}
                        </span>
                        {isNew && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-500 text-white animate-pulse">
                            NEW
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground ml-auto sm:ml-2">
                          {format(new Date(announcement.start_time), "yyyy-MM-dd HH:mm", { locale: zhCN })}
                        </span>
                      </div>
                      <h2 className="text-base sm:text-lg font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                        {announcement.title}
                      </h2>
                      <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2">
                        {announcement.content}
                      </p>
                    </div>

                    <div className="hidden sm:flex shrink-0 items-center justify-center h-8 w-8 rounded-full bg-muted group-hover:bg-primary/10 transition-colors">
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </div>
                </article>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
