"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Search,
  Plus,
  Trash2,
  AlertOctagon,
  AlertTriangle,
  UploadCloud,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";
import {
  addSensitiveWord,
  batchAddSensitiveWords,
  deleteSensitiveWord,
  toggleSensitiveWordActive,
} from "@/lib/admin/review-actions";
import { toast } from "sonner";
import { formatDistanceToNow } from "@/lib/utils";

interface SensitiveWordItem {
  id: string;
  word: string;
  category: string;
  match_level: "pending" | "block";
  is_active: boolean;
  created_at: string;
}

interface SensitiveWordsClientProps {
  words: SensitiveWordItem[];
  search: string;
  categoryFilter: string;
  levelFilter: string;
}

const CATEGORY_MAP: Record<string, { label: string; color: string }> = {
  academic_fraud: { label: "学术不端", color: "bg-red-500/10 text-red-600 border-red-500/20" },
  politics: { label: "政治敏感", color: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
  violence: { label: "暴恐违法", color: "bg-rose-500/10 text-rose-600 border-rose-500/20" },
  porn: { label: "色情低俗", color: "bg-pink-500/10 text-pink-600 border-pink-500/20" },
  ad: { label: "广告推广", color: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  general: { label: "通用违规", color: "bg-slate-500/10 text-slate-600 border-slate-500/20" },
};

export function SensitiveWordsClient({
  words,
  search: initialSearch,
  categoryFilter: initialCategoryFilter,
  levelFilter: initialLevelFilter,
}: SensitiveWordsClientProps) {
  const router = useRouter();
  const [search, setSearch] = useState(initialSearch);
  const [isPending, startTransition] = useTransition();

  // 添加弹窗
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [singleWord, setSingleWord] = useState("");
  const [singleCategory, setSingleCategory] = useState("general");
  const [singleLevel, setSingleLevel] = useState<"pending" | "block">("pending");

  // 批量导入弹窗
  const [isBatchOpen, setIsBatchOpen] = useState(false);
  const [batchWords, setBatchWords] = useState("");
  const [batchCategory, setBatchCategory] = useState("general");
  const [batchLevel, setBatchLevel] = useState<"pending" | "block">("pending");

  // 删除确认弹窗
  const [deleteTarget, setDeleteTarget] = useState<SensitiveWordItem | null>(null);

  const handleFilter = (key: string, val: string) => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (initialCategoryFilter) params.set("category", initialCategoryFilter);
    if (initialLevelFilter) params.set("level", initialLevelFilter);

    if (val && val !== "all") {
      params.set(key, val);
    } else {
      params.delete(key);
    }
    router.push(`/admin/sensitive-words?${params.toString()}`);
  };

  const handleSearchSubmit = () => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (initialCategoryFilter) params.set("category", initialCategoryFilter);
    if (initialLevelFilter) params.set("level", initialLevelFilter);
    router.push(`/admin/sensitive-words?${params.toString()}`);
  };

  const handleAddSingle = async () => {
    if (!singleWord.trim()) return;
    startTransition(async () => {
      try {
        await addSensitiveWord(singleWord, singleCategory, singleLevel);
        toast.success("敏感词添加成功");
        setIsAddOpen(false);
        setSingleWord("");
        router.refresh();
      } catch (err: any) {
        toast.error(err.message || "添加失败");
      }
    });
  };

  const handleBatchAdd = async () => {
    if (!batchWords.trim()) return;
    startTransition(async () => {
      try {
        const res = await batchAddSensitiveWords(batchWords, batchCategory, batchLevel);
        toast.success(`成功导入 ${res.count} 个敏感词`);
        setIsBatchOpen(false);
        setBatchWords("");
        router.refresh();
      } catch (err: any) {
        toast.error(err.message || "批量导入失败");
      }
    });
  };

  const handleToggleActive = async (item: SensitiveWordItem) => {
    startTransition(async () => {
      try {
        await toggleSensitiveWordActive(item.id, !item.is_active);
        toast.success(item.is_active ? "已禁用该敏感词" : "已启用该敏感词");
        router.refresh();
      } catch (err: any) {
        toast.error(err.message || "操作失败");
      }
    });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    startTransition(async () => {
      try {
        await deleteSensitiveWord(deleteTarget.id);
        toast.success("敏感词已删除");
        setDeleteTarget(null);
        router.refresh();
      } catch (err: any) {
        toast.error(err.message || "删除失败");
      }
    });
  };

  return (
    <div className="animate-fade-in space-y-6">
      {/* 顶部标题与操作 */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">敏感词库管理</h2>
          <p className="text-sm text-muted-foreground">
            配置前置过滤词库（支持直接拦截与自动转入待审），有效降低大模型调用开销
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsBatchOpen(true)}
            className="gap-1.5"
          >
            <UploadCloud className="h-4 w-4" />
            批量导入
          </Button>
          <Button
            size="sm"
            onClick={() => setIsAddOpen(true)}
            className="gap-1.5"
          >
            <Plus className="h-4 w-4" />
            添加敏感词
          </Button>
        </div>
      </div>

      {/* 筛选与搜索 */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索敏感词..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearchSubmit()}
            className="pl-9"
          />
        </div>
        <Select
          value={initialCategoryFilter || "all"}
          onValueChange={(val) => handleFilter("category", val)}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="分类筛选" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部分类</SelectItem>
            <SelectItem value="academic_fraud">学术不端</SelectItem>
            <SelectItem value="politics">政治敏感</SelectItem>
            <SelectItem value="violence">暴恐违法</SelectItem>
            <SelectItem value="porn">色情低俗</SelectItem>
            <SelectItem value="ad">广告推广</SelectItem>
            <SelectItem value="general">通用违规</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={initialLevelFilter || "all"}
          onValueChange={(val) => handleFilter("level", val)}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="处置策略" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部处置策略</SelectItem>
            <SelectItem value="block">直接拦截 (Block)</SelectItem>
            <SelectItem value="pending">转人工待审 (Pending)</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={handleSearchSubmit} variant="secondary">
          <Search className="h-4 w-4 mr-2" />
          搜索
        </Button>
      </div>

      {/* 敏感词表格 */}
      <div className="rounded-xl border border-border/50 bg-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50 bg-muted/30">
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">敏感词</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">分类</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">触发策略</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">状态</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground hidden sm:table-cell">创建时间</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {words.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    未找到匹配的敏感词记录
                  </td>
                </tr>
              ) : (
                words.map((item) => {
                  const cat = CATEGORY_MAP[item.category] || { label: item.category, color: "" };

                  return (
                    <tr key={item.id} className="hover:bg-accent/30 transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-semibold text-foreground text-sm font-mono">
                          {item.word}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={`text-xs ${cat.color}`}>
                          {cat.label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        {item.match_level === "block" ? (
                          <Badge variant="destructive" className="gap-1 text-[11px]">
                            <AlertOctagon className="h-3 w-3" />
                            直接拦截 Block
                          </Badge>
                        ) : (
                          <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 gap-1 text-[11px]">
                            <AlertTriangle className="h-3 w-3" />
                            转待审 Pending
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleActive(item)}
                          disabled={isPending}
                          className={`h-7 px-2 text-xs gap-1 ${
                            item.is_active
                              ? "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10"
                              : "text-muted-foreground hover:bg-muted"
                          }`}
                        >
                          {item.is_active ? (
                            <>
                              <CheckCircle className="h-3.5 w-3.5" />
                              已启用
                            </>
                          ) : (
                            <>
                              <XCircle className="h-3.5 w-3.5" />
                              已禁用
                            </>
                          )}
                        </Button>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground hidden sm:table-cell">
                        {item.created_at ? formatDistanceToNow(item.created_at) : "—"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteTarget(item)}
                          disabled={isPending}
                          className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-500/10"
                          title="删除敏感词"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 单个添加弹窗 */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>添加单个敏感词</DialogTitle>
            <DialogDescription>
              添加后将立即同步至前置扫描引擎，发帖时命中将自动触发相应处置。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>敏感词内容 *</Label>
              <Input
                placeholder="例如：代写论文"
                value={singleWord}
                onChange={(e) => setSingleWord(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>分类</Label>
                <Select value={singleCategory} onValueChange={setSingleCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="academic_fraud">学术不端</SelectItem>
                    <SelectItem value="politics">政治敏感</SelectItem>
                    <SelectItem value="violence">暴恐违法</SelectItem>
                    <SelectItem value="porn">色情低俗</SelectItem>
                    <SelectItem value="ad">广告推广</SelectItem>
                    <SelectItem value="general">通用违规</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>触发策略</Label>
                <Select
                  value={singleLevel}
                  onValueChange={(val: any) => setSingleLevel(val)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">转人工待审 (Pending)</SelectItem>
                    <SelectItem value="block">直接拦截 (Block)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>
              取消
            </Button>
            <Button
              onClick={handleAddSingle}
              disabled={!singleWord.trim() || isPending}
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              确认添加
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 批量导入弹窗 */}
      <Dialog open={isBatchOpen} onOpenChange={setIsBatchOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>批量导入敏感词</DialogTitle>
            <DialogDescription>
              支持多行粘贴或逗号分隔，系统将自动去重并录入词库。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>敏感词列表 (换行或逗号分隔) *</Label>
              <Textarea
                placeholder={"代写SCI\n论文枪手\n保过毕业\n买卖论文"}
                value={batchWords}
                onChange={(e) => setBatchWords(e.target.value)}
                rows={6}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>统一分类</Label>
                <Select value={batchCategory} onValueChange={setBatchCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="academic_fraud">学术不端</SelectItem>
                    <SelectItem value="politics">政治敏感</SelectItem>
                    <SelectItem value="violence">暴恐违法</SelectItem>
                    <SelectItem value="porn">色情低俗</SelectItem>
                    <SelectItem value="ad">广告推广</SelectItem>
                    <SelectItem value="general">通用违规</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>统一策略</Label>
                <Select
                  value={batchLevel}
                  onValueChange={(val: any) => setBatchLevel(val)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">转人工待审 (Pending)</SelectItem>
                    <SelectItem value="block">直接拦截 (Block)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBatchOpen(false)}>
              取消
            </Button>
            <Button
              onClick={handleBatchAdd}
              disabled={!batchWords.trim() || isPending}
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              确认批量导入
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认弹窗 */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>删除敏感词</DialogTitle>
            <DialogDescription>
              确定删除敏感词「{deleteTarget?.word}」？删除后前置扫描引擎将不再匹配此词。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isPending}
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              确认删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
