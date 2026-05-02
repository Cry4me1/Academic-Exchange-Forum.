"use client";

import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";

interface CoAuthorBadgeProps {
    count: number;
    className?: string;
}

export function CoAuthorBadge({ count, className }: CoAuthorBadgeProps) {
    if (count <= 0) return null;

    return (
        <Badge
            variant="secondary"
            className={`gap-1 bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20 ${className || ""}`}
        >
            <Users className="h-3 w-3" />
            <span>{count}人共创</span>
        </Badge>
    );
}
