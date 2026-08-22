"use client";

import { useState, useRef } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
    FileText,
    Columns2,
    Square,
    Printer,
    Download,
    ExternalLink,
    Sparkles,
    BookOpen,
    Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { PostAcademicMeta } from "@/lib/academic-meta";

interface AcademicPdfExportDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    post: {
        id: string;
        title: string;
        created_at: string;
        author: {
            username: string;
            is_verified?: boolean;
            special_title?: string | null;
        };
        tags?: string[];
    };
    academicMeta?: PostAcademicMeta | null;
}

export function AcademicPdfExportDialog({
    open,
    onOpenChange,
    post,
    academicMeta,
}: AcademicPdfExportDialogProps) {
    const [layout, setLayout] = useState<"single" | "double">("single");
    const [includeSynopsis, setIncludeSynopsis] = useState(true);
    const [includeBibtex, setIncludeBibtex] = useState(true);
    const [isPrinting, setIsPrinting] = useState(false);
    const iframeRef = useRef<HTMLIFrameElement>(null);

    const printUrl = `/posts/${post.id}/print?layout=${layout}&synopsis=${includeSynopsis}&bibtex=${includeBibtex}`;

    const handlePrint = () => {
        setIsPrinting(true);
        toast.info("正在调起学术排版打印与 PDF 生成流...");

        const printWindow = window.open(printUrl, "_blank");
        if (printWindow) {
            printWindow.focus();
        } else {
            toast.error("弹窗被浏览器拦截，请允许弹窗后重试");
        }
        setIsPrinting(false);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-xl p-6 bg-background/95 backdrop-blur-xl border border-border/80 rounded-2xl shadow-2xl">
                <DialogHeader className="space-y-2">
                    <div className="flex items-center gap-2">
                        <div className="p-2 rounded-xl bg-primary/10 text-primary">
                            <FileText className="w-5 h-5" />
                        </div>
                        <div>
                            <DialogTitle className="text-lg font-bold text-foreground">
                                导出标准学术排版 PDF
                            </DialogTitle>
                            <DialogDescription className="text-xs text-muted-foreground">
                                自动排版学术页眉、论文标题、作者信息、KaTeX 矢量公式、高清图表与参考文献
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="space-y-5 py-2">
                    {/* 排版版式选择 */}
                    <div className="space-y-2.5">
                        <Label className="text-xs font-semibold text-foreground">
                            选择学术出版版式
                        </Label>
                        <RadioGroup
                            value={layout}
                            onValueChange={(val: "single" | "double") =>
                                setLayout(val)
                            }
                            className="grid grid-cols-2 gap-3"
                        >
                            {/* 单栏选项 */}
                            <Label
                                htmlFor="layout-single"
                                className={`flex flex-col items-start justify-between p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                                    layout === "single"
                                        ? "border-primary bg-primary/5 shadow-xs"
                                        : "border-border/60 hover:border-border hover:bg-muted/30"
                                }`}
                            >
                                <div className="flex items-center justify-between w-full mb-2">
                                    <div className="flex items-center gap-1.5 font-semibold text-xs text-foreground">
                                        <Square className="w-4 h-4 text-blue-500" />
                                        <span>单栏排版 (Single Column)</span>
                                    </div>
                                    <RadioGroupItem
                                        value="single"
                                        id="layout-single"
                                    />
                                </div>
                                <p className="text-[11px] text-muted-foreground leading-relaxed">
                                    arXiv / Nature 现代预印本风，适合长公式推导与宽幅图表
                                </p>
                            </Label>

                            {/* 双栏选项 */}
                            <Label
                                htmlFor="layout-double"
                                className={`flex flex-col items-start justify-between p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                                    layout === "double"
                                        ? "border-primary bg-primary/5 shadow-xs"
                                        : "border-border/60 hover:border-border hover:bg-muted/30"
                                }`}
                            >
                                <div className="flex items-center justify-between w-full mb-2">
                                    <div className="flex items-center gap-1.5 font-semibold text-xs text-foreground">
                                        <Columns2 className="w-4 h-4 text-purple-500" />
                                        <span>双栏排版 (Two Column)</span>
                                    </div>
                                    <RadioGroupItem
                                        value="double"
                                        id="layout-double"
                                    />
                                </div>
                                <p className="text-[11px] text-muted-foreground leading-relaxed">
                                    IEEE / ACM 经典期刊会议风，紧凑严谨，信息密度高
                                </p>
                            </Label>
                        </RadioGroup>
                    </div>

                    {/* 要素勾选项 */}
                    <div className="space-y-2.5 p-3 rounded-xl bg-muted/40 border border-border/50 text-xs">
                        <span className="font-semibold text-foreground block">
                            学术要素选项
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                                <Checkbox
                                    checked={includeSynopsis}
                                    onCheckedChange={(checked) =>
                                        setIncludeSynopsis(Boolean(checked))
                                    }
                                />
                                <span className="text-muted-foreground hover:text-foreground">
                                    包含学术要素速览（定理/定义统计）
                                </span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                                <Checkbox
                                    checked={includeBibtex}
                                    onCheckedChange={(checked) =>
                                        setIncludeBibtex(Boolean(checked))
                                    }
                                />
                                <span className="text-muted-foreground hover:text-foreground">
                                    包含文末 BibTeX 引用代码块
                                </span>
                            </label>
                        </div>
                    </div>

                    {/* 帖子信息摘要卡片 */}
                    <div className="p-3 rounded-xl border border-border/40 bg-card flex items-center justify-between text-xs">
                        <div className="truncate mr-3">
                            <p className="font-semibold text-foreground truncate">
                                {post.title}
                            </p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                                作者: {post.author.username} · 日期:{" "}
                                {new Date(post.created_at).toLocaleDateString(
                                    "zh-CN"
                                )}
                            </p>
                        </div>
                        {academicMeta && academicMeta.totalAcademicCount > 0 && (
                            <Badge
                                variant="secondary"
                                className="shrink-0 bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 text-[10px]"
                            >
                                <Sparkles className="w-3 h-3 mr-1" />
                                {academicMeta.totalAcademicCount} 个学术块
                            </Badge>
                        )}
                    </div>
                </div>

                <DialogFooter className="flex items-center justify-between sm:justify-between gap-2 pt-2 border-t border-border/50">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(printUrl, "_blank")}
                        className="text-xs"
                    >
                        <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                        新标签页预览
                    </Button>

                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => onOpenChange(false)}
                            className="text-xs"
                        >
                            取消
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            onClick={handlePrint}
                            disabled={isPrinting}
                            className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs shadow-xs"
                        >
                            {isPrinting ? (
                                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                            ) : (
                                <Printer className="w-3.5 h-3.5 mr-1.5" />
                            )}
                            生成并保存 PDF
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default AcademicPdfExportDialog;
