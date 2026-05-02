"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { BookOpen, Clock, FileText, Lock, Pencil, Users } from "lucide-react";
import Link from "next/link";

interface LabRoomCardProps {
    room: {
        id: string;
        name: string;
        description?: string;
        room_type: string;
        is_encrypted: boolean;
        max_members: number;
        is_archived: boolean;
        updated_at: string;
        lab_members: { count: number }[];
        lab_post_links: { count: number }[];
    };
}

const roomTypeConfig: Record<string, { label: string; icon: typeof BookOpen; color: string }> = {
    reading: { label: "帖子共读", icon: BookOpen, color: "text-blue-500" },
    whiteboard: { label: "白板推导", icon: Pencil, color: "text-purple-500" },
    hybrid: { label: "混合模式", icon: FileText, color: "text-emerald-500" },
};

function formatRelativeTime(dateStr: string): string {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHour = Math.floor(diffMs / 3600000);
    const diffDay = Math.floor(diffMs / 86400000);

    if (diffMin < 1) return "刚刚";
    if (diffMin < 60) return `${diffMin}分钟前`;
    if (diffHour < 24) return `${diffHour}小时前`;
    if (diffDay < 30) return `${diffDay}天前`;
    return date.toLocaleDateString("zh-CN");
}

export function LabRoomCard({ room }: LabRoomCardProps) {
    const config = roomTypeConfig[room.room_type] || roomTypeConfig.hybrid;
    const TypeIcon = config.icon;
    const memberCount = room.lab_members?.[0]?.count || 0;
    const postCount = room.lab_post_links?.[0]?.count || 0;

    return (
        <Link href={`/lab/${room.id}`}>
            <Card className={cn(
                "group relative overflow-hidden transition-all duration-300",
                "hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1",
                "border-border/50 hover:border-primary/30",
                room.is_archived && "opacity-60"
            )}>
                {/* 顶部渐变装饰 */}
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary/60 via-primary to-primary/60 opacity-0 group-hover:opacity-100 transition-opacity" />

                <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                            <div className={cn("p-2 rounded-lg bg-muted/80", config.color)}>
                                <TypeIcon className="h-4 w-4" />
                            </div>
                            <h3 className="font-semibold text-foreground truncate text-lg">
                                {room.name}
                            </h3>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                            {room.is_encrypted && (
                                <Badge variant="outline" className="text-xs gap-1 border-amber-500/30 text-amber-600">
                                    <Lock className="h-3 w-3" />
                                    加密
                                </Badge>
                            )}
                            <Badge variant="secondary" className="text-xs">
                                {config.label}
                            </Badge>
                        </div>
                    </div>
                    {room.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                            {room.description}
                        </p>
                    )}
                </CardHeader>

                <CardContent className="pb-3">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                            <FileText className="h-4 w-4" />
                            <span>{postCount} 篇共读帖子</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Users className="h-4 w-4" />
                            <span>{memberCount}/{room.max_members} 成员</span>
                        </div>
                    </div>
                </CardContent>

                <CardFooter className="pt-0 pb-4">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        <span>最近活动: {formatRelativeTime(room.updated_at)}</span>
                    </div>
                </CardFooter>
            </Card>
        </Link>
    );
}
