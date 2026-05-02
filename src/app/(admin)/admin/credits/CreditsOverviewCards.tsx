"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
  Coins,
  TrendingUp,
  TrendingDown,
  Wallet,
  Activity,
  Users,
} from "lucide-react";
import type { CreditStats } from "@/lib/admin/credits";

interface Props {
  stats: CreditStats;
}

function formatNumber(num: number): string {
  if (Math.abs(num) >= 1_000_000) {
    return (num / 1_000_000).toFixed(1) + "M";
  }
  if (Math.abs(num) >= 1_000) {
    return (num / 1_000).toFixed(1) + "K";
  }
  return num.toLocaleString("zh-CN");
}

const overviewCards = [
  {
    key: "totalBalance",
    label: "总流通余额",
    icon: Wallet,
    gradient: "from-amber-500 to-yellow-600",
    bgGlow: "from-amber-500/10 to-yellow-500/10",
    borderColor: "border-amber-500/20",
    getValue: (s: CreditStats) => formatNumber(s.totalBalance),
  },
  {
    key: "totalRecharged",
    label: "总发放积分",
    icon: TrendingUp,
    gradient: "from-emerald-500 to-green-600",
    bgGlow: "from-emerald-500/10 to-green-500/10",
    borderColor: "border-emerald-500/20",
    getValue: (s: CreditStats) => formatNumber(s.totalRecharged),
  },
  {
    key: "totalSpent",
    label: "总消耗积分",
    icon: TrendingDown,
    gradient: "from-rose-500 to-red-600",
    bgGlow: "from-rose-500/10 to-red-500/10",
    borderColor: "border-rose-500/20",
    getValue: (s: CreditStats) => formatNumber(s.totalSpent),
  },
  {
    key: "totalTransactions",
    label: "总流水笔数",
    icon: Activity,
    gradient: "from-blue-500 to-indigo-600",
    bgGlow: "from-blue-500/10 to-indigo-500/10",
    borderColor: "border-blue-500/20",
    getValue: (s: CreditStats) => s.totalTransactions.toLocaleString("zh-CN"),
  },
  {
    key: "avgBalance",
    label: "人均余额",
    icon: Users,
    gradient: "from-violet-500 to-purple-600",
    bgGlow: "from-violet-500/10 to-purple-500/10",
    borderColor: "border-violet-500/20",
    getValue: (s: CreditStats) => formatNumber(s.avgBalance),
  },
  {
    key: "todayTransactions",
    label: "今日流水",
    icon: Coins,
    gradient: "from-cyan-500 to-teal-600",
    bgGlow: "from-cyan-500/10 to-teal-500/10",
    borderColor: "border-cyan-500/20",
    getValue: (s: CreditStats) =>
      `${s.todayTransactions} 笔 / ${s.todayAmount >= 0 ? "+" : ""}${formatNumber(s.todayAmount)}`,
  },
];

export function CreditsOverviewCards({ stats }: Props) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {overviewCards.map((card) => (
        <Card
          key={card.key}
          className={`relative overflow-hidden border ${card.borderColor} bg-gradient-to-br ${card.bgGlow} hover:shadow-lg transition-all duration-300 group`}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br ${card.gradient} shadow-sm`}
              >
                <card.icon className="h-4 w-4 text-white" />
              </div>
            </div>
            <p className="text-lg font-bold tracking-tight leading-none">
              {card.getValue(stats)}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1.5">
              {card.label}
            </p>
          </CardContent>
          {/* 装饰光效 */}
          <div className="absolute -top-8 -right-8 h-16 w-16 rounded-full bg-gradient-to-br opacity-0 group-hover:opacity-20 transition-opacity duration-500" />
        </Card>
      ))}
    </div>
  );
}
