"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Copy, Download, Loader2, Check, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface BatchGenerateDialogProps {
    onSuccess: () => void;
}

interface GeneratedCode {
    code: string;
    usage_limit: number;
    expires_at: string | null;
    note: string;
}

export function BatchGenerateDialog({ onSuccess }: BatchGenerateDialogProps) {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [generatedCodes, setGeneratedCodes] = useState<GeneratedCode[]>([]);
    const [copiedAll, setCopiedAll] = useState(false);

    // 表单状态（仅前缀、数量、上限、有效期、备注用途，无积分）
    const [prefix, setPrefix] = useState("SCHOLAR");
    const [count, setCount] = useState<number>(10);
    const [usageLimit, setUsageLimit] = useState<number>(1);
    const [validDays, setValidDays] = useState<number>(30);
    const [note, setNote] = useState("Hansszh 官方特邀");

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const res = await fetch("/api/admin/invites", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    prefix: prefix.trim() || "SCHOLAR",
                    count: Number(count) || 1,
                    usageLimit: Number(usageLimit) || 1,
                    validDays: Number(validDays) || 0,
                    note: note.trim() || "Hansszh 签发",
                }),
            });

            const data = await res.json();
            if (!res.ok) {
                toast.error(data.error || "生成失败");
                return;
            }

            setGeneratedCodes(data.codes || []);
            toast.success(data.message || `成功签发 ${count} 个邀请码`);
            onSuccess();
        } catch {
            toast.error("网络异常，生成失败");
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopyAll = () => {
        const text = generatedCodes.map((c) => c.code).join("\n");
        navigator.clipboard.writeText(text);
        setCopiedAll(true);
        toast.success("已复制全部邀请码到剪贴板");
        setTimeout(() => setCopiedAll(false), 2000);
    };

    const handleExportCSV = () => {
        const header = "邀请码,可用上限,过期时间,用途备注\n";
        const rows = generatedCodes
            .map(
                (c) =>
                    `"${c.code}","${c.usage_limit}","${c.expires_at || "永久有效"}","${c.note}"`
            )
            .join("\n");
        const blob = new Blob([`\uFEFF${header}${rows}`], {
            type: "text/csv;charset=utf-8;",
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `invitation_codes_${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    };

    const handleReset = () => {
        setGeneratedCodes([]);
        setOpen(false);
    };

    return (
        <Dialog
            open={open}
            onOpenChange={(v) => {
                setOpen(v);
                if (!v) setGeneratedCodes([]);
            }}
        >
            <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-medium shadow-md shadow-orange-500/20">
                    <Plus className="w-4 h-4 mr-2" />
                    签发学术邀请码
                </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                {generatedCodes.length > 0 ? (
                    <div className="space-y-4 py-2">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-green-600 dark:text-green-400">
                                <Sparkles className="w-5 h-5" />
                                成功签发 {generatedCodes.length} 个学术邀请码
                            </DialogTitle>
                            <DialogDescription>
                                请妥善分发给受邀学者，您可一键复制或导出为表格。
                            </DialogDescription>
                        </DialogHeader>

                        {/* 邀请码展示区域 */}
                        <div className="rounded-xl border border-border/60 bg-muted/40 p-3 max-h-60 overflow-y-auto font-mono text-sm space-y-1.5">
                            {generatedCodes.map((item, i) => (
                                <div
                                    key={i}
                                    className="flex items-center justify-between px-2.5 py-1.5 bg-background rounded-lg border border-border/40 text-xs"
                                >
                                    <span className="font-semibold text-foreground tracking-wider">
                                        {item.code}
                                    </span>
                                    <span className="text-muted-foreground">
                                        上限 {item.usage_limit} 次
                                    </span>
                                </div>
                            ))}
                        </div>

                        <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleCopyAll}
                                className="flex-1"
                            >
                                {copiedAll ? (
                                    <>
                                        <Check className="w-4 h-4 mr-2 text-green-500" />
                                        已复制到剪贴板
                                    </>
                                ) : (
                                    <>
                                        <Copy className="w-4 h-4 mr-2" />
                                        一键复制全部
                                    </>
                                )}
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleExportCSV}
                                className="flex-1"
                            >
                                <Download className="w-4 h-4 mr-2" />
                                导出为 CSV
                            </Button>
                            <Button
                                type="button"
                                onClick={handleReset}
                                className="bg-orange-500 hover:bg-orange-600 text-white"
                            >
                                完成并返回
                            </Button>
                        </DialogFooter>
                    </div>
                ) : (
                    <form onSubmit={handleGenerate} className="space-y-4 py-2">
                        <DialogHeader>
                            <DialogTitle>签发学术邀请码 (Hansszh 专属)</DialogTitle>
                            <DialogDescription>
                                设定邀请码前缀、数量、使用次数上限与有效期限。
                            </DialogDescription>
                        </DialogHeader>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* 前缀 */}
                            <div className="space-y-1.5">
                                <Label htmlFor="code-prefix">邀请码前缀</Label>
                                <Input
                                    id="code-prefix"
                                    value={prefix}
                                    onChange={(e) => setPrefix(e.target.value.toUpperCase())}
                                    placeholder="如 SCHOLAR 或 VIP"
                                    className="uppercase font-mono"
                                    maxLength={16}
                                />
                            </div>

                            {/* 生成数量 */}
                            <div className="space-y-1.5">
                                <Label htmlFor="code-count">签发数量 (1 ~ 500)</Label>
                                <Input
                                    id="code-count"
                                    type="number"
                                    min={1}
                                    max={500}
                                    value={count}
                                    onChange={(e) => setCount(Math.max(1, parseInt(e.target.value) || 1))}
                                />
                            </div>

                            {/* 单码可用次数 */}
                            <div className="space-y-1.5">
                                <Label htmlFor="code-limit">单码使用次数上限</Label>
                                <Input
                                    id="code-limit"
                                    type="number"
                                    min={1}
                                    value={usageLimit}
                                    onChange={(e) => setUsageLimit(Math.max(1, parseInt(e.target.value) || 1))}
                                    placeholder="1 为单人独占码"
                                />
                                <p className="text-[11px] text-muted-foreground">
                                    设为 1 即为单次专属码；设为 100+ 可作为特邀会议通用码
                                </p>
                            </div>

                            {/* 有效天数 */}
                            <div className="space-y-1.5">
                                <Label htmlFor="code-days">有效期 (天)</Label>
                                <Input
                                    id="code-days"
                                    type="number"
                                    min={0}
                                    value={validDays}
                                    onChange={(e) => setValidDays(Math.max(0, parseInt(e.target.value) || 0))}
                                    placeholder="0 为永久有效"
                                />
                                <p className="text-[11px] text-muted-foreground">
                                    输入 0 表示永久有效，不过期
                                </p>
                            </div>
                        </div>

                        {/* 备注用途 */}
                        <div className="space-y-1.5">
                            <Label htmlFor="code-note">用途备注</Label>
                            <Input
                                id="code-note"
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                placeholder="如：清华大学计算机系学者内测、特邀学术同行"
                                maxLength={100}
                            />
                        </div>

                        <DialogFooter className="pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setOpen(false)}
                                disabled={isLoading}
                            >
                                取消
                            </Button>
                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                        正在签发...
                                    </>
                                ) : (
                                    `确认签发 ${count} 个邀请码`
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
}
