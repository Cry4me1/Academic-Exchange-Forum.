"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { FlaskConical, Users } from "lucide-react";
import Link from "next/link";

export interface CoAuthor {
    id: string;
    role: "co_author" | "contributor" | "annotator";
    contribution_summary?: string;
    lab_room_id?: string;
    user: {
        id: string;
        full_name?: string;
        username?: string;
        avatar_url?: string;
    };
}

interface CoAuthorPanelProps {
    coAuthors: CoAuthor[];
    labRoomName?: string;
    labRoomId?: string;
    className?: string;
}

const roleConfig: Record<string, { label: string; color: string }> = {
    co_author: { label: "共创作者", color: "bg-violet-500/10 text-violet-600 border-violet-500/20" },
    contributor: { label: "贡献者", color: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
    annotator: { label: "批注者", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
};

export function CoAuthorPanel({ coAuthors, labRoomName, labRoomId, className }: CoAuthorPanelProps) {
    if (!coAuthors || coAuthors.length === 0) return null;

    return (
        <div className={cn(
            "rounded-xl border border-violet-500/20 bg-gradient-to-br from-violet-500/5 to-fuchsia-500/5 p-4",
            className
        )}>
            <div className="flex items-center gap-2 mb-3">
                <Users className="h-4 w-4 text-violet-500" />
                <span className="text-sm font-semibold text-foreground">共创团队</span>
                {labRoomName && labRoomId && (
                    <Link href={`/lab/${labRoomId}`} className="ml-auto">
                        <Badge variant="outline" className="text-xs gap-1 hover:bg-muted/50 transition-colors cursor-pointer">
                            <FlaskConical className="h-3 w-3" />
                            {labRoomName}
                        </Badge>
                    </Link>
                )}
            </div>

            <div className="space-y-2.5">
                {coAuthors.map((ca) => {
                    const config = roleConfig[ca.role] || roleConfig.co_author;
                    return (
                        <div key={ca.id} className="flex items-center gap-3">
                            <Link href={`/user/${ca.user.username || ca.user.id}`}>
                                <Avatar className="h-8 w-8 ring-1 ring-violet-500/20 hover:ring-violet-500/50 transition-all">
                                    <AvatarImage src={ca.user.avatar_url} />
                                    <AvatarFallback className="text-xs bg-violet-500/10 text-violet-600">
                                        {(ca.user.username || "?").slice(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                            </Link>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <Link href={`/user/${ca.user.username || ca.user.id}`}>
                                        <span className="text-sm font-medium text-foreground hover:text-primary transition-colors">
                                            {ca.user.full_name || ca.user.username}
                                        </span>
                                    </Link>
                                    <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", config.color)}>
                                        {config.label}
                                    </Badge>
                                </div>
                                {ca.contribution_summary && (
                                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                                        {ca.contribution_summary}
                                    </p>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
