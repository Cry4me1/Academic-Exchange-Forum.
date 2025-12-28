import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, Megaphone } from "lucide-react";

const announcements = [
    {
        id: "1",
        type: "announcement" as const,
        title: "学术论坛 2.0 版本上线",
        content: "新版本支持 LaTeX 公式渲染、代码高亮等功能！",
        date: "2024-12-28",
    },
    {
        id: "2",
        type: "notification" as const,
        title: "系统维护通知",
        content: "本周六凌晨 2:00-4:00 进行系统升级维护",
        date: "2024-12-27",
    },
];

export function AnnouncementCard() {
    return (
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                    <Bell className="h-4 w-4 text-primary" />
                    公告通知
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                {announcements.map((item) => (
                    <div
                        key={item.id}
                        className="p-3 rounded-lg bg-background/50 hover:bg-background/80 transition-colors cursor-pointer group"
                    >
                        <div className="flex items-start gap-2">
                            {item.type === "announcement" ? (
                                <Megaphone className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                            ) : (
                                <Bell className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-medium text-foreground group-hover:text-primary transition-colors line-clamp-1">
                                    {item.title}
                                </h4>
                                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                                    {item.content}
                                </p>
                                <p className="text-xs text-muted-foreground/60 mt-1">
                                    {item.date}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}
