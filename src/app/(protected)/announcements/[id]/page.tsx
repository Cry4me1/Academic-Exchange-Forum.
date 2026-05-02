import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { Bell, Rocket, Sparkles, Wrench, Megaphone, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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
