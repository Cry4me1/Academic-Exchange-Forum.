"use client";

import { useState, useTransition, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ScrollText,
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Loader2,
  BarChart3,
} from "lucide-react";
import type { CreditTransaction } from "@/lib/admin/credits";
import { getCreditTransactions } from "@/lib/admin/credits";

interface Props {
  initialData: { data: CreditTransaction[]; total: number };
  typeBreakdown: { type: string; count: number; total_amount: number }[];
}

const typeLabels: Record<string, string> = {
  signup_bonus: "注册奖励",
  monthly_bonus: "每月奖励",
  purchase: "充值",
  ask_ai_usage: "AI 消耗",
  admin_adjustment: "管理员调整",
  event_bonus: "活动奖励",
};

const typeBadgeStyles: Record<string, string> = {
  signup_bonus:
    "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  monthly_bonus:
    "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  purchase:
    "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  ask_ai_usage:
    "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20",
  admin_adjustment:
    "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
  event_bonus:
    "bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20",
};

export function CreditsAuditPanel({ initialData, typeBreakdown }: Props) {
  const [transactions, setTransactions] = useState(initialData.data);
  const [total, setTotal] = useState(initialData.total);
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isPending, startTransition] = useTransition();
  const pageSize = 20;
  const totalPages = Math.ceil(total / pageSize);

  const fetchData = useCallback(
    (newPage: number, newType: string) => {
      startTransition(async () => {
        try {
          const result = await getCreditTransactions({
            page: newPage,
            pageSize,
            type: newType !== "all" ? newType : undefined,
          });
          setTransactions(result.data);
          setTotal(result.total);
          setPage(newPage);
        } catch (err) {
          console.error("Failed to fetch transactions:", err);
        }
      });
    },
    [pageSize]
  );

  const handleTypeChange = (value: string) => {
    setTypeFilter(value);
    fetchData(1, value);
  };

  const handlePageChange = (newPage: number) => {
    fetchData(newPage, typeFilter);
  };

  const filteredTransactions = searchQuery
    ? transactions.filter(
        (t) =>
          t.user_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.user_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : transactions;

  return (
    <div className="space-y-6">
      {/* 类型分布统计 */}
      <Card className="border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-indigo-500/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-blue-500" />
            交易类型分布
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {typeBreakdown.map((item) => (
              <div
                key={item.type}
                className="flex flex-col gap-1 p-3 rounded-lg bg-background/60 border border-border/50"
              >
                <Badge
                  variant="outline"
                  className={`w-fit text-[10px] ${typeBadgeStyles[item.type] ?? ""}`}
                >
                  {typeLabels[item.type] ?? item.type}
                </Badge>
                <p className="text-lg font-bold">{item.count}</p>
                <p className="text-[10px] text-muted-foreground">
                  合计:{" "}
                  <span
                    className={
                      item.total_amount >= 0
                        ? "text-emerald-500"
                        : "text-rose-500"
                    }
                  >
                    {item.total_amount >= 0 ? "+" : ""}
                    {item.total_amount.toLocaleString("zh-CN")}
                  </span>
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 筛选栏 */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <ScrollText className="h-4 w-4" />
              积分流水明细
              <Badge variant="secondary" className="ml-1">
                共 {total} 条
              </Badge>
            </CardTitle>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-[200px]">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜索用户 / 描述..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-9 text-sm"
                />
              </div>
              <Select value={typeFilter} onValueChange={handleTypeChange}>
                <SelectTrigger className="w-[140px] h-9 text-sm">
                  <Filter className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                  <SelectValue placeholder="全部类型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部类型</SelectItem>
                  {Object.entries(typeLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isPending ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <ScrollText className="h-10 w-10 mb-3 opacity-50" />
              <p className="text-sm">暂无流水记录</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors border border-transparent hover:border-border/50 group"
                >
                  {/* 金额方向指示 */}
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                      tx.amount >= 0
                        ? "bg-emerald-500/10 text-emerald-500"
                        : "bg-rose-500/10 text-rose-500"
                    }`}
                  >
                    {tx.amount >= 0 ? (
                      <ArrowUpRight className="h-4 w-4" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4" />
                    )}
                  </div>

                  {/* 用户信息 */}
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <Avatar className="h-7 w-7 shrink-0">
                      <AvatarImage src={tx.user_avatar ?? undefined} />
                      <AvatarFallback className="text-[10px]">
                        {tx.user_name?.charAt(0) ?? "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">
                          {tx.user_name ?? "未知用户"}
                        </p>
                        <Badge
                          variant="outline"
                          className={`text-[10px] shrink-0 ${typeBadgeStyles[tx.type] ?? ""}`}
                        >
                          {typeLabels[tx.type] ?? tx.type}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {tx.description ?? "无描述"}
                      </p>
                    </div>
                  </div>

                  {/* 金额和时间 */}
                  <div className="text-right shrink-0">
                    <p
                      className={`text-sm font-bold ${
                        tx.amount >= 0 ? "text-emerald-500" : "text-rose-500"
                      }`}
                    >
                      {tx.amount >= 0 ? "+" : ""}
                      {tx.amount.toLocaleString("zh-CN")}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(tx.created_at).toLocaleString("zh-CN", {
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 分页 */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <p className="text-xs text-muted-foreground">
                第 {page}/{totalPages} 页，共 {total} 条
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1 || isPending}
                  onClick={() => handlePageChange(page - 1)}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {/* 页码按钮 */}
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (page <= 3) {
                    pageNum = i + 1;
                  } else if (page >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }
                  return (
                    <Button
                      key={pageNum}
                      variant={page === pageNum ? "default" : "outline"}
                      size="sm"
                      disabled={isPending}
                      onClick={() => handlePageChange(pageNum)}
                      className="h-8 w-8 p-0 text-xs"
                    >
                      {pageNum}
                    </Button>
                  );
                })}
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages || isPending}
                  onClick={() => handlePageChange(page + 1)}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
