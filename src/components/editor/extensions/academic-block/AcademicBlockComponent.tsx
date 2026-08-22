"use client";

import { NodeViewContent, NodeViewProps, NodeViewWrapper } from "@tiptap/react";
import {
    ChevronDown,
    ChevronRight,
    Copy,
    Hash,
    MoreHorizontal,
    Sparkles,
    Trash2,
    Check,
    Square,
    BookOpen,
} from "lucide-react";
import { useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
    ACADEMIC_TYPE_CONFIG,
    AcademicType,
} from "./academic-block";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function AcademicBlockComponent({
    node,
    updateAttributes,
    editor,
    deleteNode,
}: NodeViewProps) {
    const isEditable = editor.isEditable;
    const academicType = (node.attrs.academicType as AcademicType) || "theorem";
    const title = node.attrs.title || "";
    const number = node.attrs.number || "";
    const isFolded = Boolean(node.attrs.isFolded);
    const academicId =
        node.attrs.academicId ||
        `academic-${academicType}-${Math.random().toString(36).substring(2, 8)}`;

    const [isEditingHeader, setIsEditingHeader] = useState(false);
    const [copied, setCopied] = useState(false);

    const config =
        ACADEMIC_TYPE_CONFIG[academicType] || ACADEMIC_TYPE_CONFIG.theorem;

    // 切换折叠状态
    const toggleFold = useCallback(() => {
        updateAttributes({ isFolded: !isFolded });
    }, [isFolded, updateAttributes]);

    // 复制锚点定位 ID / 引用语法
    const handleCopyAnchor = useCallback(
        (e: React.MouseEvent) => {
            e.stopPropagation();
            const refText = `@${academicType}:${number || title || "1"}`;
            navigator.clipboard.writeText(refText);
            setCopied(true);
            toast.success(`已复制交叉引用代码: ${refText}`);
            setTimeout(() => setCopied(false), 2000);
        },
        [academicType, number, title]
    );

    const isProof = academicType === "proof";

    return (
        <NodeViewWrapper
            id={academicId}
            data-academic-id={academicId}
            data-academic-type={academicType}
            className={cn(
                "academic-block-wrapper my-5 rounded-xl border transition-all duration-200 overflow-hidden shadow-xs",
                config.borderClass,
                config.bgClass,
                "relative group/academic"
            )}
        >
            {/* 顶部标题栏 */}
            <div
                className={cn(
                    "academic-header flex items-center justify-between px-4 py-2.5 select-none border-b border-border/40 bg-background/50 backdrop-blur-xs",
                    isProof && "cursor-pointer hover:bg-muted/40"
                )}
                onClick={isProof ? toggleFold : undefined}
            >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    {/* 折叠切换图标 (仅 Proof 或可折叠块) */}
                    {isProof && (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                toggleFold();
                            }}
                            className="p-1 -ml-1 text-muted-foreground hover:text-foreground rounded-md transition-colors"
                            title={isFolded ? "展开证明" : "折叠证明"}
                        >
                            {isFolded ? (
                                <ChevronRight className="w-4 h-4 text-slate-500" />
                            ) : (
                                <ChevronDown className="w-4 h-4 text-slate-500" />
                            )}
                        </button>
                    )}

                    {/* 类型徽章 */}
                    <span
                        className={cn(
                            "inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold tracking-wide shrink-0",
                            config.badgeBg
                        )}
                    >
                        {config.label}
                    </span>

                    {/* 编号与名称 */}
                    <div className="flex items-center gap-1.5 text-sm font-medium truncate">
                        {number ? (
                            <span className={cn("font-semibold", config.badgeText)}>
                                {number}
                            </span>
                        ) : null}

                        {title ? (
                            <span className="text-foreground/90 font-medium tracking-tight">
                                ({title})
                            </span>
                        ) : null}

                        {!number && !title && (
                            <span className="text-muted-foreground/70 text-xs italic">
                                {config.enLabel}
                            </span>
                        )}
                    </div>
                </div>

                {/* 操作工具栏 */}
                <div className="flex items-center gap-1 shrink-0 ml-2">
                    {/* 复制交叉引用 ID */}
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 opacity-0 group-hover/academic:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
                        onClick={handleCopyAnchor}
                        title="复制引用代号"
                    >
                        {copied ? (
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                            <Copy className="w-3.5 h-3.5" />
                        )}
                    </Button>

                    {/* 编辑态专属配置菜单 */}
                    {isEditable && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                >
                                    <MoreHorizontal className="w-3.5 h-3.5" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuLabel className="text-xs text-muted-foreground">
                                    切换学术环境
                                </DropdownMenuLabel>
                                {(
                                    Object.keys(
                                        ACADEMIC_TYPE_CONFIG
                                    ) as AcademicType[]
                                ).map((typeKey) => {
                                    const itemConfig = ACADEMIC_TYPE_CONFIG[typeKey];
                                    return (
                                        <DropdownMenuItem
                                            key={typeKey}
                                            onClick={() =>
                                                updateAttributes({
                                                    academicType: typeKey,
                                                })
                                            }
                                            className={cn(
                                                "text-xs flex items-center justify-between",
                                                academicType === typeKey &&
                                                    "font-bold text-primary"
                                            )}
                                        >
                                            <span>
                                                {itemConfig.label} ({itemConfig.enLabel})
                                            </span>
                                            {academicType === typeKey && (
                                                <Check className="w-3.5 h-3.5" />
                                            )}
                                        </DropdownMenuItem>
                                    );
                                })}

                                <DropdownMenuSeparator />

                                <DropdownMenuItem
                                    onClick={() =>
                                        setIsEditingHeader(!isEditingHeader)
                                    }
                                    className="text-xs"
                                >
                                    <Hash className="w-3.5 h-3.5 mr-2" />
                                    {isEditingHeader
                                        ? "收起属性设置"
                                        : "设置编号与名称"}
                                </DropdownMenuItem>

                                <DropdownMenuSeparator />

                                <DropdownMenuItem
                                    onClick={() => deleteNode()}
                                    className="text-xs text-destructive focus:text-destructive"
                                >
                                    <Trash2 className="w-3.5 h-3.5 mr-2" />
                                    删除学术块
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>
            </div>

            {/* 编辑态：属性编辑折叠面板 */}
            {isEditable && isEditingHeader && (
                <div className="px-4 py-2.5 bg-background/80 border-b border-border/50 flex flex-wrap items-center gap-3 text-xs">
                    <div className="flex items-center gap-1.5">
                        <label className="text-muted-foreground font-medium">
                            编号:
                        </label>
                        <input
                            type="text"
                            value={number}
                            placeholder="如: 1.1 或 3"
                            onChange={(e) =>
                                updateAttributes({ number: e.target.value })
                            }
                            className="h-6 w-20 px-1.5 rounded border border-border bg-background text-foreground text-xs focus:outline-hidden focus:ring-1 focus:ring-primary"
                        />
                    </div>
                    <div className="flex items-center gap-1.5 flex-1 min-w-[140px]">
                        <label className="text-muted-foreground font-medium">
                            名称:
                        </label>
                        <input
                            type="text"
                            value={title}
                            placeholder="如: 费马大定理 或 均值不等式"
                            onChange={(e) =>
                                updateAttributes({ title: e.target.value })
                            }
                            className="h-6 flex-1 px-1.5 rounded border border-border bg-background text-foreground text-xs focus:outline-hidden focus:ring-1 focus:ring-primary"
                        />
                    </div>
                </div>
            )}

            {/* 内容区域 (带折叠动效与 NodeViewContent) */}
            <AnimatePresence initial={false}>
                {!isFolded && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                    >
                        <div className="p-4 relative">
                            {/* 富文本嵌套渲染槽位 */}
                            <NodeViewContent className="academic-block-inner prose dark:prose-invert max-w-none focus:outline-hidden text-foreground leading-relaxed" />

                            {/* 证明块结尾：经典学术 Q.E.D. 印章 */}
                            {isProof && (
                                <div className="flex items-center justify-end gap-1.5 mt-4 pt-2 text-xs font-mono text-muted-foreground/80 select-none">
                                    <span className="italic font-serif">
                                        Q.E.D.
                                    </span>
                                    <span
                                        className="inline-block w-2.5 h-2.5 bg-foreground/70 dark:bg-foreground/60 rounded-2xs"
                                        title="证明完毕 (Quod Erat Demonstrandum)"
                                    />
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 当被折叠时显示的提示条 */}
            {isFolded && (
                <div
                    onClick={toggleFold}
                    className="px-4 py-2 text-xs text-muted-foreground/70 italic cursor-pointer hover:bg-muted/20 flex items-center justify-between"
                >
                    <span>证明推导过程已折叠（点击展开查看详细步骤）</span>
                    <span className="font-serif text-[11px]">Q.E.D. ∎</span>
                </div>
            )}
        </NodeViewWrapper>
    );
}

export default AcademicBlockComponent;
