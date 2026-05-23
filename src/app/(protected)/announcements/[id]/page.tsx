import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { Bell, Rocket, Sparkles, Wrench, Megaphone, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic"; // ⚡ 强力打碎详情页的服务端静态路由预编译缓存

interface AnnouncementPageProps {
  params: Promise<{
    id: string;
  }>;
}

const categoryStyles: Record<string, { icon: any, label: string, color: string, bg: string }> = {
  update: { icon: Rocket, label: "版本更新", color: "text-violet-500", bg: "from-primary to-violet-500" },
  activity: { icon: Sparkles, label: "活动通知", color: "text-purple-500", bg: "from-primary to-purple-500" },
  system: { icon: Megaphone, label: "系统通知", color: "text-blue-500", bg: "from-blue-500 to-indigo-500" },
  maintenance: { icon: Wrench, label: "维护通知", color: "text-amber-500", bg: "from-amber-500 to-orange-500" },
};

export default async function AnnouncementDetailPage({ params }: AnnouncementPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // 1. Fetch announcement
  const { data: announcement, error } = await supabase
    .from("system_announcements")
    .select(`
      *,
      creator:profiles!system_announcements_created_by_fkey(full_name, avatar_url)
    `)
    .eq("id", id)
    .single();

  if (error || !announcement) {
    notFound();
  }

  // 2. Fetch style info
  const style = categoryStyles[announcement.category] || categoryStyles.system;
  const Icon = style.icon;
  
  const creator = Array.isArray(announcement.creator) ? announcement.creator[0] : announcement.creator;
  const creatorName = creator?.full_name || "系统管理员";

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8 min-h-screen">
      <Link href="/dashboard">
        <Button variant="ghost" className="mb-6 -ml-4 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-2 h-4 w-4" />
          返回主页
        </Button>
      </Link>

      <article className="bg-card border border-border/50 rounded-2xl shadow-sm overflow-hidden">
        {/* Header Section */}
        <div className={`h-2 w-full bg-gradient-to-r ${style.bg}`} />
        <div className="p-6 md:p-10 pb-6 border-b border-border/50">
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <Badge variant="outline" className={`font-normal ${style.color} border-current/20 bg-current/5`}>
              <Icon className="mr-1.5 h-3.5 w-3.5" />
              {style.label}
            </Badge>
            <span className="text-sm text-muted-foreground">
              发布于 {format(new Date(announcement.start_time), "yyyy年MM月dd日 HH:mm", { locale: zhCN })}
            </span>
          </div>

          <h1 className="text-2xl md:text-4xl font-bold text-foreground mb-4 leading-tight">
            {announcement.title}
          </h1>

          <div className="flex items-center gap-3 mt-8">
            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center overflow-hidden border border-border">
              {creator?.avatar_url ? (
                <img src={creator.avatar_url} alt={creatorName} className="h-full w-full object-cover" />
              ) : (
                <Bell className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">{creatorName}</p>
              <p className="text-xs text-muted-foreground">Scholarly 官方</p>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-6 md:p-10 prose prose-slate dark:prose-invert max-w-none prose-p:leading-relaxed prose-headings:font-bold">
          {announcement.content.split('\n').map((paragraph: string, idx: number) => (
            paragraph.trim() ? <p key={idx}>{paragraph}</p> : <br key={idx} />
          ))}
        </div>
        
        {/* 如果是版本更新类型的公告，在正文下方展现高规格的 CTA 大卡片引导至 /updates */}
        {announcement.category === "update" && (
          <div className="mx-6 md:mx-10 mb-8 p-6 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-violet-500/5 to-transparent relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h4 className="font-bold text-base text-foreground flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                  查看更详尽的 v1.1.0 联合更新日志
                </h4>
                <p className="text-xs text-muted-foreground">
                  内含双向链接织网、1024维语义推荐与中国地区 5 倍爆速提速底层的交互图解。
                </p>
              </div>
              <Link href="/updates">
                <Button className="bg-gradient-to-r from-primary to-violet-600 hover:from-primary/90 hover:to-violet-600/90 text-white font-medium text-xs sm:text-sm rounded-xl shrink-0 group shadow-md shadow-primary/10">
                  立即前往更新日志
                  <Rocket className="ml-1.5 h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                </Button>
              </Link>
            </div>
          </div>
        )}
        
        {/* Footer info (optional end time) */}
        {announcement.end_time && (
          <div className="px-6 md:px-10 py-4 bg-muted/30 border-t border-border/50">
            <p className="text-xs text-muted-foreground">
              注意: 本次公告有效截止至 {format(new Date(announcement.end_time), "yyyy年MM月dd日 HH:mm", { locale: zhCN })}
            </p>
          </div>
        )}
      </article>
    </div>
  );
}
