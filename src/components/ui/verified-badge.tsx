import { cn } from "@/lib/utils";
import { BadgeCheck, Shield } from "lucide-react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface VerifiedBadgeProps {
    provider?: string | null;
    size?: "sm" | "md" | "lg";
    className?: string;
    showTooltip?: boolean;
}

const providerLabels: Record<string, string> = {
    email: "邮箱已验证",
    username: "用户名已验证",
    luogu: "洛谷已验证",
};

const sizeClasses = {
    sm: "h-3.5 w-3.5",
    md: "h-4 w-4",
    lg: "h-5 w-5",
};

export function VerifiedBadge({
    provider,
    size = "sm",
    className,
    showTooltip = true,
}: VerifiedBadgeProps) {
    const label = providerLabels[provider || "email"] || "已验证";
    const iconSize = sizeClasses[size];

    const badge = (
        <BadgeCheck
            className={cn(
                iconSize,
                "text-blue-500 dark:text-blue-400 shrink-0",
                className
            )}
        />
    );

    if (!showTooltip) {
        return badge;
    }

    return (
        <TooltipProvider delayDuration={200}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <span className="inline-flex cursor-help">{badge}</span>
                </TooltipTrigger>
                <TooltipContent
                    side="top"
                    className="text-xs"
                >
                    <div className="flex items-center gap-1.5">
                        <Shield className="h-3 w-3 text-blue-500" />
                        <span>{label}</span>
                    </div>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
