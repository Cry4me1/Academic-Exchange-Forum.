"use client";

import { NodeViewProps, NodeViewWrapper } from "@tiptap/react";
import { Link2, Sparkles, Sigma, Image as ImageIcon, Table, BookOpen } from "lucide-react";
import { useCallback, useState } from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

export function CrossRefComponent({
    node,
    updateAttributes,
    editor,
}: NodeViewProps) {
    const isEditable = editor.isEditable;
    const refType = node.attrs.refType || "theorem";
    const targetId = node.attrs.targetId || "";
    const label = node.attrs.label || "引用";

    const [isOpen, setIsOpen] = useState(false);
    const [editLabel, setEditLabel] = useState(label);
    const [editTargetId, setEditTargetId] = useState(targetId);

    // 点击交叉引用定位跳转
    const handleClick = useCallback(
        (e: React.MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();

            if (!targetId) {
                if (isEditable) {
                    setIsOpen(true);
                } else {
                    toast.info("未设置引用的目标锚点");
                }
                return;
            }

            // 查找目标 DOM 元素
            const targetElement =
                document.getElementById(targetId) ||
                document.querySelector(`[data-academic-id="${targetId}"]`) ||
                document.querySelector(`[data-equation-id="${targetId}"]`) ||
                document.querySelector(`[data-figure-id="${targetId}"]`);

            if (targetElement) {
                // 平滑居中滚动
                targetElement.scrollIntoView({
                    behavior: "smooth",
                    block: "center",
                });

                // 触发 1.5 秒脉冲高亮聚焦
                targetElement.classList.add("academic-pulse-highlight");
                setTimeout(() => {
                    targetElement.classList.remove("academic-pulse-highlight");
                }, 1800);
            } else {
                toast.error(`未在当前文章中找到引用目标: ${label}`);
            }
        },
        [targetId, label, isEditable]
    );

    const handleSave = () => {
        updateAttributes({
            label: editLabel,
            targetId: editTargetId,
        });
        setIsOpen(false);
        toast.success("已更新交叉引用信息");
    };

    // 根据引用类型展示不同前缀图标
    const renderIcon = () => {
        switch (refType) {
            case "equation":
                return <Sigma className="w-3 h-3" />;
            case "figure":
                return <ImageIcon className="w-3 h-3" />;
            case "table":
                return <Table className="w-3 h-3" />;
            default:
                return <BookOpen className="w-3 h-3" />;
        }
    };

    const badge = (
        <span
            onClick={handleClick}
            className={cn(
                "academic-cross-ref inline-flex items-center gap-1 px-2 py-0.5 mx-0.5 rounded-md text-xs font-semibold tracking-tight transition-all duration-150 select-none cursor-pointer",
                "bg-primary/10 text-primary hover:bg-primary/20 border border-primary/25 hover:border-primary/40",
                "active:scale-95 shadow-2xs"
            )}
            title={`点击跳转至: ${targetId || "未指定目标"}`}
        >
            {renderIcon()}
            <span>{label}</span>
        </span>
    );

    if (!isEditable) {
        return (
            <NodeViewWrapper as="span" className="inline-block align-baseline">
                {badge}
            </NodeViewWrapper>
        );
    }

    return (
        <NodeViewWrapper as="span" className="inline-block align-baseline">
            <Popover open={isOpen} onOpenChange={setIsOpen}>
                <PopoverTrigger asChild>{badge}</PopoverTrigger>
                <PopoverContent className="w-72 p-3 text-xs" align="start">
                    <div className="space-y-2.5">
                        <div className="font-semibold text-foreground flex items-center justify-between">
                            <span>编辑交叉引用</span>
                            <span className="text-[10px] text-muted-foreground uppercase">
                                Cross-Ref
                            </span>
                        </div>
                        <div className="space-y-1">
                            <label className="text-muted-foreground">
                                显示文本 (Label)
                            </label>
                            <input
                                type="text"
                                value={editLabel}
                                onChange={(e) => setEditLabel(e.target.value)}
                                placeholder="如: 式 (1), 图 2, 定理 1.1"
                                className="w-full h-7 px-2 rounded border border-border bg-background text-foreground text-xs focus:outline-hidden focus:ring-1 focus:ring-primary"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-muted-foreground">
                                目标锚点 ID (Target ID)
                            </label>
                            <input
                                type="text"
                                value={editTargetId}
                                onChange={(e) =>
                                    setEditTargetId(e.target.value)
                                }
                                placeholder="如: academic-theorem-xxx 或 eq-1"
                                className="w-full h-7 px-2 font-mono rounded border border-border bg-background text-foreground text-xs focus:outline-hidden focus:ring-1 focus:ring-primary"
                            />
                        </div>
                        <div className="flex justify-end gap-1.5 pt-1">
                            <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                className="h-6 text-xs px-2"
                                onClick={() => setIsOpen(false)}
                            >
                                取消
                            </Button>
                            <Button
                                type="button"
                                size="sm"
                                className="h-6 text-xs px-2"
                                onClick={handleSave}
                            >
                                保存
                            </Button>
                        </div>
                    </div>
                </PopoverContent>
            </Popover>
        </NodeViewWrapper>
    );
}

export default CrossRefComponent;
