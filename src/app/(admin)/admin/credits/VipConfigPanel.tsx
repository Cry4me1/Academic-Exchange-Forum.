"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Crown,
  Edit,
  Loader2,
  Save,
  Star,
  Trophy,
  Sparkles,
  Shield,
  Gem,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import type { VipLevelConfigRow } from "@/lib/admin/credits";
import { updateVipLevelConfig } from "@/lib/admin/credits";

interface Props {
  initialConfig: VipLevelConfigRow[];
  adminRole: string;
}

const levelIcons = [Star, Trophy, Sparkles, Shield, Gem, Zap];

const levelGradients = [
  "from-zinc-400 to-zinc-500",
  "from-green-400 to-emerald-500",
  "from-blue-400 to-cyan-500",
  "from-purple-400 to-violet-500",
  "from-amber-400 to-orange-500",
  "from-rose-400 via-pink-500 to-fuchsia-500",
];

const levelBgGradients = [
  "from-zinc-500/10 to-zinc-500/5",
  "from-green-500/10 to-emerald-500/5",
  "from-blue-500/10 to-cyan-500/5",
  "from-purple-500/10 to-violet-500/5",
  "from-amber-500/10 to-orange-500/5",
  "from-rose-500/10 to-pink-500/5",
];

const levelBorderColors = [
  "border-zinc-400/30",
  "border-green-400/30",
  "border-blue-400/30",
  "border-purple-400/30",
  "border-amber-400/30",
  "border-rose-400/30",
];

export function VipConfigPanel({ initialConfig, adminRole }: Props) {
  const [config, setConfig] = useState(initialConfig);
  const [editingLevel, setEditingLevel] = useState<VipLevelConfigRow | null>(
    null
  );
  const [isPending, startTransition] = useTransition();

  // 编辑表单状态
  const [editForm, setEditForm] = useState({
    name: "",
    title: "",
    min_spent: 0,
    perks: [] as string[],
    is_active: true,
    newPerk: "",
  });

  const openEdit = (level: VipLevelConfigRow) => {
    setEditingLevel(level);
    setEditForm({
      name: level.name,
      title: level.title,
      min_spent: level.min_spent,
      perks: [...level.perks],
      is_active: level.is_active,
      newPerk: "",
    });
  };

  const handleSave = () => {
    if (!editingLevel) return;

    startTransition(async () => {
      try {
        await updateVipLevelConfig(editingLevel.level, {
          name: editForm.name,
          title: editForm.title,
          min_spent: editForm.min_spent,
          perks: editForm.perks,
          is_active: editForm.is_active,
        });

        // 更新本地状态
        setConfig((prev) =>
          prev.map((c) =>
            c.level === editingLevel.level
              ? {
                  ...c,
                  name: editForm.name,
                  title: editForm.title,
                  min_spent: editForm.min_spent,
                  perks: editForm.perks,
                  is_active: editForm.is_active,
                }
              : c
          )
        );

        setEditingLevel(null);
        toast.success(`V${editingLevel.level} 配置已更新`);
      } catch (err) {
        toast.error(
          `保存失败: ${err instanceof Error ? err.message : "未知错误"}`
        );
      }
    });
  };

  const addPerk = () => {
    if (editForm.newPerk.trim()) {
      setEditForm((prev) => ({
        ...prev,
        perks: [...prev.perks, prev.newPerk.trim()],
        newPerk: "",
      }));
    }
  };

  const removePerk = (index: number) => {
    setEditForm((prev) => ({
      ...prev,
      perks: prev.perks.filter((_, i) => i !== index),
    }));
  };

  return (
    <div className="space-y-6">
      {/* 说明 */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Crown className="h-4 w-4 text-amber-500" />
            VIP 等级配置
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            配置 VIP 等级的名称、阈值和特权，点击卡片右上角编辑按钮修改
          </p>
        </div>
      </div>

      {/* VIP 等级卡片网格 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {config.map((level, index) => {
          const Icon = levelIcons[index] ?? Star;
          const gradient = levelGradients[index] ?? levelGradients[0];
          const bgGradient = levelBgGradients[index] ?? levelBgGradients[0];
          const borderColor = levelBorderColors[index] ?? levelBorderColors[0];

          return (
            <Card
              key={level.level}
              className={`relative overflow-hidden border ${borderColor} bg-gradient-to-br ${bgGradient} transition-all duration-300 hover:shadow-lg ${
                !level.is_active ? "opacity-60" : ""
              }`}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} shadow-lg`}
                    >
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        {level.name}
                        {!level.is_active && (
                          <Badge variant="outline" className="text-[10px]">
                            已禁用
                          </Badge>
                        )}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {level.title}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => openEdit(level)}
                    className="h-8 w-8 shrink-0"
                  >
                    <Edit className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                {/* 消费阈值 */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">消费阈值</span>
                  <span className="font-bold">
                    {level.min_spent.toLocaleString("zh-CN")} 积分
                  </span>
                </div>

                {/* 特权列表 */}
                <div className="space-y-1.5">
                  <p className="text-xs text-muted-foreground">等级特权</p>
                  <div className="flex flex-wrap gap-1">
                    {level.perks.map((perk, i) => (
                      <Badge
                        key={i}
                        variant="outline"
                        className="text-[10px] bg-background/50"
                      >
                        {perk}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* 等级阈值对比 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">等级阈值对比</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {config.map((level, index) => {
              const maxThreshold = Math.max(...config.map((c) => c.min_spent));
              // 使用对数刻度使小值也能清晰展示
              const logMax = Math.log10(Math.max(maxThreshold, 1) + 1);
              const logVal = Math.log10(Math.max(level.min_spent, 0) + 1);
              const percentage = logMax > 0 ? (logVal / logMax) * 100 : 0;
              // 确保最小宽度，即使 0 也有一个小条
              const barWidth = Math.max(percentage, 8);
              const gradient = levelGradients[index] ?? levelGradients[0];

              return (
                <div key={level.level} className="flex items-center gap-3">
                  <span className="text-xs font-medium w-16 shrink-0">
                    {level.name}
                  </span>
                  <div className="flex-1 h-7 rounded-full bg-muted/50 overflow-hidden relative">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${gradient} transition-all duration-700 ease-out flex items-center pr-2`}
                      style={{ width: `${barWidth}%` }}
                    >
                      <span className="text-[10px] font-bold text-white drop-shadow-sm ml-auto whitespace-nowrap">
                        {level.min_spent.toLocaleString("zh-CN")}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-[10px] text-muted-foreground mt-3">
            * 图表使用对数刻度展示，便于比较不同等级间的差异
          </p>
        </CardContent>
      </Card>

      {/* 编辑对话框 */}
      <Dialog
        open={!!editingLevel}
        onOpenChange={(open) => !open && setEditingLevel(null)}
      >
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-amber-500" />
              编辑 {editingLevel?.name} 配置
            </DialogTitle>
            <DialogDescription>
              修改 VIP 等级 {editingLevel?.level} 的相关配置
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* 等级名称 */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="vip-name">等级名称</Label>
                <Input
                  id="vip-name"
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="V1"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vip-title">称号</Label>
                <Input
                  id="vip-title"
                  value={editForm.title}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, title: e.target.value }))
                  }
                  placeholder="学术新星"
                />
              </div>
            </div>

            {/* 消费阈值 */}
            <div className="space-y-2">
              <Label htmlFor="vip-threshold">消费阈值 (积分)</Label>
              <Input
                id="vip-threshold"
                type="number"
                min={0}
                value={editForm.min_spent}
                onChange={(e) =>
                  setEditForm((prev) => ({
                    ...prev,
                    min_spent: parseInt(e.target.value) || 0,
                  }))
                }
              />
            </div>

            {/* 特权管理 */}
            <div className="space-y-2">
              <Label>等级特权</Label>
              <div className="flex flex-wrap gap-1.5 min-h-[32px] p-2 rounded-lg border bg-muted/30">
                {editForm.perks.map((perk, i) => (
                  <Badge
                    key={i}
                    variant="outline"
                    className="text-xs cursor-pointer hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-colors"
                    onClick={() => removePerk(i)}
                  >
                    {perk} ×
                  </Badge>
                ))}
                {editForm.perks.length === 0 && (
                  <span className="text-xs text-muted-foreground">
                    暂无特权
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="添加新特权..."
                  value={editForm.newPerk}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      newPerk: e.target.value,
                    }))
                  }
                  onKeyDown={(e) =>
                    e.key === "Enter" && (e.preventDefault(), addPerk())
                  }
                  className="text-sm"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addPerk}
                  disabled={!editForm.newPerk.trim()}
                >
                  添加
                </Button>
              </div>
            </div>

            {/* 启用/禁用 */}
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">启用此等级</p>
                <p className="text-xs text-muted-foreground">
                  禁用后用户仍保留等级，但不再升入此等级
                </p>
              </div>
              <Switch
                checked={editForm.is_active}
                onCheckedChange={(checked) =>
                  setEditForm((prev) => ({ ...prev, is_active: checked }))
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditingLevel(null)}
              disabled={isPending}
            >
              取消
            </Button>
            <Button
              onClick={handleSave}
              disabled={isPending}
              className="bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white"
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
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
