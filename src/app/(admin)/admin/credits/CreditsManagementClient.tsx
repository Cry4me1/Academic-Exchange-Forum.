"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Coins,
  Settings2,
  ScrollText,
  Gift,
  Crown,
} from "lucide-react";
import type {
  CreditsConfig,
  CreditStats,
  CreditTransaction,
  VipLevelConfigRow,
  BatchGrant,
} from "@/lib/admin/credits";
import { CreditsConfigPanel } from "./CreditsConfigPanel";
import { CreditsAuditPanel } from "./CreditsAuditPanel";
import { BatchGrantPanel } from "./BatchGrantPanel";
import { VipConfigPanel } from "./VipConfigPanel";
import { CreditsOverviewCards } from "./CreditsOverviewCards";

interface Props {
  adminRole: string;
  initialConfig: CreditsConfig;
  initialStats: CreditStats;
  initialTransactions: { data: CreditTransaction[]; total: number };
  initialVipConfig: VipLevelConfigRow[];
  initialBatchGrants: BatchGrant[];
}

export function CreditsManagementClient({
  adminRole,
  initialConfig,
  initialStats,
  initialTransactions,
  initialVipConfig,
  initialBatchGrants,
}: Props) {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="animate-fade-in space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/20 to-yellow-500/20 border border-amber-500/30">
          <Coins className="h-5 w-5 text-amber-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">积分与经济系统</h1>
          <p className="text-sm text-muted-foreground">
            管理积分策略、审计流水、批量发放和 VIP 等级配置
          </p>
        </div>
      </div>

      {/* 概览卡片 */}
      <CreditsOverviewCards stats={initialStats} />

      {/* Tab 面板 */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 h-11 bg-muted/50 p-1">
          <TabsTrigger
            value="overview"
            className="flex items-center gap-2 text-xs sm:text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            <Settings2 className="h-4 w-4" />
            <span className="hidden sm:inline">策略配置</span>
            <span className="sm:hidden">配置</span>
          </TabsTrigger>
          <TabsTrigger
            value="audit"
            className="flex items-center gap-2 text-xs sm:text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            <ScrollText className="h-4 w-4" />
            <span className="hidden sm:inline">流水审计</span>
            <span className="sm:hidden">流水</span>
          </TabsTrigger>
          <TabsTrigger
            value="batch"
            className="flex items-center gap-2 text-xs sm:text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            <Gift className="h-4 w-4" />
            <span className="hidden sm:inline">批量发放</span>
            <span className="sm:hidden">发放</span>
          </TabsTrigger>
          <TabsTrigger
            value="vip"
            className="flex items-center gap-2 text-xs sm:text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            <Crown className="h-4 w-4" />
            <span className="hidden sm:inline">VIP 配置</span>
            <span className="sm:hidden">VIP</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <CreditsConfigPanel
            config={initialConfig}
            adminRole={adminRole}
          />
        </TabsContent>

        <TabsContent value="audit" className="space-y-6">
          <CreditsAuditPanel
            initialData={initialTransactions}
            typeBreakdown={initialStats.typeBreakdown}
          />
        </TabsContent>

        <TabsContent value="batch" className="space-y-6">
          <BatchGrantPanel
            initialGrants={initialBatchGrants}
          />
        </TabsContent>

        <TabsContent value="vip" className="space-y-6">
          <VipConfigPanel
            initialConfig={initialVipConfig}
            adminRole={adminRole}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
