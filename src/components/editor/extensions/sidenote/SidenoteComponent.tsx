"use client";

import { NodeViewProps, NodeViewWrapper } from "@tiptap/react";
import { MessageSquareText, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

export function SidenoteComponent({
    node,
    updateAttributes,
    editor,
    deleteNode,
}: NodeViewProps) {
    const isEditable = editor.isEditable;
    const noteNumber = node.attrs.noteNumber || "1";
    const content = node.attrs.content || "补充学术注记内容...";

    const [isOpen, setIsOpen] = useState(false);
    const [editNumber, setEditNumber] = useState(noteNumber);
    const [editContent, setEditContent] = useState(content);

    const handleSave = () => {
        updateAttributes({
            noteNumber: editNumber,
            content: editContent,
        });
        setIsOpen(false);
    };

    return (
        <NodeViewWrapper as="span" className="inline-block align-super select-none">
            <Popover open={isOpen} onOpenChange={setIsOpen}>
                <PopoverTrigger asChild>
                    <button
                        type="button"
                        className={cn(
                            "sidenote-badge inline-flex items-center justify-center min-w-[1.25rem] h-4 px-1 mx-0.5 rounded-full text-[10px] font-bold cursor-pointer transition-all",
                            "bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60",
                            "hover:scale-110 hover:bg-amber-200 dark:hover:bg-amber-900"
                        )}
                        title="查看学术边注"
                    >
                        {noteNumber}
                    </button>
                </PopoverTrigger>
                <PopoverContent
                    className="w-80 p-3.5 text-xs shadow-lg border border-border/80 bg-background/95 backdrop-blur-md rounded-xl"
                    align="start"
                >
                    {!isEditable ? (
                        <div className="space-y-1.5">
                            <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 font-semibold text-[11px] uppercase tracking-wider">
                                <MessageSquareText className="w-3.5 h-3.5" />
                                <span>学术边注 [{noteNumber}]</span>
                            </div>
                            <p className="text-foreground/90 leading-relaxed whitespace-pre-wrap font-sans text-xs">
                                {content}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between font-semibold text-foreground text-xs">
                                <span className="flex items-center gap-1">
                                    <Pencil className="w-3 h-3 text-amber-600" />
                                    编辑学术边注
                                </span>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => deleteNode()}
                                    className="h-5 w-5 text-destructive hover:text-destructive"
                                    title="删除此边注"
                                >
                                    <Trash2 className="w-3 h-3" />
                                </Button>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[11px] text-muted-foreground font-medium">
                                    边注编号
                                </label>
                                <input
                                    type="text"
                                    value={editNumber}
                                    onChange={(e) =>
                                        setEditNumber(e.target.value)
                                    }
                                    placeholder="如: 1, 2, A"
                                    className="w-full h-7 px-2 text-xs rounded border border-border bg-background text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-[11px] text-muted-foreground font-medium">
                                    注记内容 (支持公式与说明)
                                </label>
                                <textarea
                                    value={editContent}
                                    onChange={(e) =>
                                        setEditContent(e.target.value)
                                    }
                                    rows={3}
                                    placeholder="输入详细的补充解释或定理适用边界..."
                                    className="w-full p-2 text-xs rounded border border-border bg-background text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary resize-none"
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
                                    className="h-6 text-xs px-2 bg-amber-600 hover:bg-amber-700 text-white"
                                    onClick={handleSave}
                                >
                                    保存
                                </Button>
                            </div>
                        </div>
                    )}
                </PopoverContent>
            </Popover>
        </NodeViewWrapper>
    );
}

export default SidenoteComponent;
