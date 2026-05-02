"use client";

import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    label: string;
  };
  gradient?: string;
  className?: string;
}

export function StatsCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  gradient = "from-violet-500/10 to-purple-500/10",
  className,
}: StatsCardProps) {
  const trendDirection = trend
    ? trend.value > 0
      ? "up"
      : trend.value < 0
        ? "down"
        : "neutral"
    : null;

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-xl border border-border/50 bg-card p-5 shadow-sm transition-all duration-300 hover:shadow-md hover:border-border",
        className
      )}
    >
      {/* Gradient Background Blob */}
      <div
        className={cn(
          "absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br opacity-50 blur-2xl transition-all duration-500 group-hover:opacity-80 group-hover:scale-125",
          gradient
        )}
      />

      <div className="relative flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-bold tracking-tight">
              {typeof value === "number" ? value.toLocaleString() : value}
            </p>
          </div>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
          )}
          {trend && trendDirection && (
            <div className="flex items-center gap-2 mt-1">
              <p className="text-xs text-muted-foreground">{trend.label}</p>
              <span
                className={cn(
                  "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-medium",
                  trendDirection === "up" &&
                    "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                  trendDirection === "down" &&
                    "bg-red-500/10 text-red-600 dark:text-red-400",
                  trendDirection === "neutral" &&
                    "bg-gray-500/10 text-gray-600 dark:text-gray-400"
                )}
              >
                {trendDirection === "up" && (
                  <TrendingUp className="h-3 w-3" />
                )}
                {trendDirection === "down" && (
                  <TrendingDown className="h-3 w-3" />
                )}
                {trendDirection === "neutral" && (
                  <Minus className="h-3 w-3" />
                )}
                {trend.value > 0 ? "+" : ""}
                {trend.value}
              </span>
            </div>
          )}
        </div>

        <div
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br shadow-sm transition-transform duration-300 group-hover:scale-110",
            gradient
          )}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}
