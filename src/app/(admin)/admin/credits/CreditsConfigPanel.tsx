"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Settings2,
  Save,
  Loader2,
  Coins,
  Gift,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import type { CreditsConfig } from "@/lib/admin/credits";
import { updateCreditsConfig } from "@/lib/admin/credits";

interface Props {
  config: CreditsConfig;
  adminRole: string;
}

export function CreditsConfigPanel({ config, adminRole }: Props) {
  const [formData, setFormData] = useState<CreditsConfig>({ ...config });
  const [isPending, startTransition] = useTransition();

  const hasChanges =
    formData.signup_bonus !== config.signup_bonus ||
    formData.monthly_bonus !== config.monthly_bonus;

  const handleSave = () => {
    startTransition(async () => {
      try {
        await updateCreditsConfig(formData);
        toast.success("积分策略已更新");
      } catch (err) {
        toast.error(
          `保存失败: ${err instanceof Error ? err.message : "未知错误"}`
        );
      }
    });
  };

  const configItems = [
    {
      key: "signup_bonus" as const,
      label: "注册奖励",
      description: "新用户注册时自动发放的积分数量",
      icon: Gift,
      color: "from-emerald-500 to-green-600",
      bgColor: "from-emerald-500/10 to-green-500/10",
      borderColor: "border-emerald-500/20",
      unit: "积分",
    },
    {
      key: "monthly_bonus" as const,
      label: "每月奖励",
      description: "每月自动发放给所有活跃用户的积分数量",
      icon: Coins,
      color: "from-amber-500 to-yellow-600",
      bgColor: "from-amber-500/10 to-yellow-500/10",
      borderColor: "border-amber-500/20",
      unit: "积分/月",
    },
  ];

  return (
    <div className="space-y-6">
      {/* 说明卡片 */}
      <Card className="border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-indigo-500/5">
        <CardContent className="flex items-start gap-3 p-4">
          <Info className="h-5 w-5 text-blue-500 mt-0.5 shrink-0" />
          <div className="text-sm text-muted-foreground">
            <p className="font-medium text-foreground mb-1">积分发放策略配置</p>
            <p>
              修改这些参数将会影响新用户注册奖励和每月自动发放金额。修改后立即生效，但不会影响已发放的积分。
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 配置项 */}
      <div className="grid gap-4 md:grid-cols-2">
        {configItems.map((item) => (
          <Card
            key={item.key}
            className={`relative overflow-hidden border ${item.borderColor} bg-gradient-to-br ${item.bgColor} transition-all duration-300 hover:shadow-md`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${item.color} shadow-sm`}
                >
                  <item.icon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-sm font-semibold">
                    {item.label}
                  </CardTitle>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {item.description}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label
                  htmlFor={`config-${item.key}`}
                  className="text-xs text-muted-foreground"
                >
                  数值 ({item.unit})
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id={`config-${item.key}`}
                    type="number"
                    min={0}
                    value={formData[item.key]}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        [item.key]: parseInt(e.target.value) || 0,
                      }))
                    }
                    className="h-10 text-lg font-bold bg-background/60"
                  />
                  {formData[item.key] !== config[item.key] && (
                    <Badge
                      variant="outline"
                      className="shrink-0 text-amber-600 border-amber-500/30 bg-amber-500/10"
                    >
                      已修改
                    </Badge>
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground">
                  当前值: {config[item.key]} {item.unit}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 保存按钮 */}
      {hasChanges && (
        <div className="flex justify-end">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => setFormData({ ...config })}
              disabled={isPending}
            >
              重置
            </Button>
            <Button
              onClick={handleSave}
              disabled={isPending}
              className="bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white shadow-lg shadow-amber-500/25"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  保存中...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  保存配置
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* 当前策略总结 */}
      <Card className="border-dashed">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Settings2 className="h-4 w-4" />
            当前策略摘要
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-1">
              <p className="text-muted-foreground">注册奖励机制</p>
              <p>
                新用户注册后自动获得{" "}
                <span className="font-bold text-emerald-500">
                  {config.signup_bonus}
                </span>{" "}
                积分
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground">月度奖励机制</p>
              <p>
                每月自动发放{" "}
                <span className="font-bold text-amber-500">
                  {config.monthly_bonus}
                </span>{" "}
                积分给所有用户
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
