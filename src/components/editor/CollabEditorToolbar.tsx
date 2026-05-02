"use client";

import { BubbleMenu, type Editor } from "@tiptap/react";
import {
    Bold,
    Code,
    Code2,
    Heading1,
    Heading2,
    Heading3,
    Highlighter,
    Italic,
    List,
    ListOrdered,
    ListTodo,
    Minus,
    Palette,
    Quote,
    Sigma,
    Strikethrough,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

// ---------- 颜色配置 ----------

const TEXT_COLORS = [
    { name: "默认", color: "inherit" },
    { name: "红色", color: "#ef4444" },
    { name: "橙色", color: "#f97316" },
    { name: "黄色", color: "#eab308" },
    { name: "绿色", color: "#22c55e" },
    { name: "蓝色", color: "#3b82f6" },
    { name: "紫色", color: "#a855f7" },
    { name: "粉色", color: "#ec4899" },
];

const HIGHLIGHT_COLORS = [
    { name: "无", color: "" },
    { name: "黄色", color: "#fef08a" },
    { name: "绿色", color: "#bbf7d0" },
    { name: "蓝色", color: "#bfdbfe" },
    { name: "紫色", color: "#e9d5ff" },
    { name: "粉色", color: "#fbcfe8" },
    { name: "红色", color: "#fecaca" },
    { name: "橙色", color: "#fed7aa" },
];

// ---------- 子组件 ----------

function ToolbarButton({
    children,
    isActive,
    onClick,
    tooltip,
    shortcut,
}: {
    children: React.ReactNode;
    isActive?: boolean;
    onClick: () => void;
    tooltip: string;
    shortcut?: string;
}) {
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <button
                    type="button"
                    onClick={onClick}
                    className={cn(
                        "p-1.5 rounded-md hover:bg-accent/80 transition-colors",
                        isActive && "bg-accent text-accent-foreground"
                    )}
                >
                    {children}
                </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
                {tooltip}
                {shortcut && (
                    <span className="ml-1.5 text-muted-foreground">
                        {shortcut}
                    </span>
                )}
            </TooltipContent>
        </Tooltip>
    );
}

function ColorPanel({
    colors,
    title,
    onSelect,
    onClose,
}: {
    colors: { name: string; color: string }[];
    title: string;
    onSelect: (color: string) => void;
    onClose: () => void;
}) {
    return (
        <div className="flex flex-col gap-2 p-2 min-w-[160px]">
            <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-medium">
                    {title}
                </span>
                <button
                    type="button"
                    onClick={onClose}
                    className="text-xs text-muted-foreground hover:text-foreground"
                >
                    ✕
                </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
                {colors.map((c) => (
                    <button
                        key={c.name}
                        type="button"
                        onClick={() => {
                            onSelect(c.color);
                            onClose();
                        }}
                        title={c.name}
                        className="w-6 h-6 rounded border border-border hover:scale-110 transition-transform"
                        style={{
                            backgroundColor: c.color || "transparent",
                            ...(c.color === "" && {
                                backgroundImage:
                                    "linear-gradient(135deg, transparent 45%, #dc2626 45%, #dc2626 55%, transparent 55%)",
                            }),
                            ...(c.color === "inherit" && {
                                background:
                                    "linear-gradient(135deg, #000 25%, #fff 25%, #fff 50%, #000 50%, #000 75%, #fff 75%)",
                                backgroundSize: "6px 6px",
                            }),
                        }}
                    />
                ))}
            </div>
        </div>
    );
}

// ---------- 固定工具栏 ----------

interface CollabEditorToolbarProps {
    editor: Editor | null;
}

export default function CollabEditorToolbar({ editor }: CollabEditorToolbarProps) {
    const [colorMode, setColorMode] = useState<"text" | "highlight" | null>(null);

    if (!editor) return null;

    const handleTextColor = (color: string) => {
        if (color === "inherit") {
            editor.chain().focus().unsetColor().run();
        } else {
            editor.chain().focus().setColor(color).run();
        }
    };

    const handleHighlight = (color: string) => {
        if (!color) {
            editor.chain().focus().unsetHighlight().run();
        } else {
            editor.chain().focus().setHighlight({ color }).run();
        }
    };

    return (
        <div className="flex-shrink-0 border-b border-border/30 bg-muted/20">
            {/* 主工具栏 */}
            <div className="flex items-center gap-0.5 px-2 py-1.5 flex-wrap">
                {/* 标题 */}
                <ToolbarButton
                    isActive={editor.isActive("heading", { level: 1 })}
                    onClick={() =>
                        editor.chain().focus().toggleHeading({ level: 1 }).run()
                    }
                    tooltip="标题 1"
                    shortcut="Ctrl+Alt+1"
                >
                    <Heading1 className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton
                    isActive={editor.isActive("heading", { level: 2 })}
                    onClick={() =>
                        editor.chain().focus().toggleHeading({ level: 2 }).run()
                    }
                    tooltip="标题 2"
                    shortcut="Ctrl+Alt+2"
                >
                    <Heading2 className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton
                    isActive={editor.isActive("heading", { level: 3 })}
                    onClick={() =>
                        editor.chain().focus().toggleHeading({ level: 3 }).run()
                    }
                    tooltip="标题 3"
                    shortcut="Ctrl+Alt+3"
                >
                    <Heading3 className="h-4 w-4" />
                </ToolbarButton>

                <div className="w-px h-5 bg-border/50 mx-1" />

                {/* 文本格式 */}
                <ToolbarButton
                    isActive={editor.isActive("bold")}
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    tooltip="加粗"
                    shortcut="Ctrl+B"
                >
                    <Bold className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton
                    isActive={editor.isActive("italic")}
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    tooltip="斜体"
                    shortcut="Ctrl+I"
                >
                    <Italic className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton
                    isActive={editor.isActive("strike")}
                    onClick={() => editor.chain().focus().toggleStrike().run()}
                    tooltip="删除线"
                    shortcut="Ctrl+Shift+S"
                >
                    <Strikethrough className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton
                    isActive={editor.isActive("code")}
                    onClick={() => editor.chain().focus().toggleCode().run()}
                    tooltip="行内代码"
                    shortcut="Ctrl+E"
                >
                    <Code className="h-4 w-4" />
                </ToolbarButton>

                <div className="w-px h-5 bg-border/50 mx-1" />

                {/* 列表 */}
                <ToolbarButton
                    isActive={editor.isActive("bulletList")}
                    onClick={() =>
                        editor.chain().focus().toggleBulletList().run()
                    }
                    tooltip="无序列表"
                    shortcut="Ctrl+Shift+8"
                >
                    <List className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton
                    isActive={editor.isActive("orderedList")}
                    onClick={() =>
                        editor.chain().focus().toggleOrderedList().run()
                    }
                    tooltip="有序列表"
                    shortcut="Ctrl+Shift+7"
                >
                    <ListOrdered className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton
                    isActive={editor.isActive("taskList")}
                    onClick={() =>
                        editor.chain().focus().toggleTaskList().run()
                    }
                    tooltip="待办事项"
                >
                    <ListTodo className="h-4 w-4" />
                </ToolbarButton>

                <div className="w-px h-5 bg-border/50 mx-1" />

                {/* 块级元素 */}
                <ToolbarButton
                    isActive={editor.isActive("blockquote")}
                    onClick={() =>
                        editor.chain().focus().toggleBlockquote().run()
                    }
                    tooltip="引用"
                    shortcut="Ctrl+Shift+B"
                >
                    <Quote className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton
                    isActive={editor.isActive("codeBlock")}
                    onClick={() =>
                        editor.chain().focus().toggleCodeBlock().run()
                    }
                    tooltip="代码块"
                    shortcut="Ctrl+Alt+C"
                >
                    <Code2 className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton
                    isActive={false}
                    onClick={() =>
                        editor.chain().focus().setHorizontalRule().run()
                    }
                    tooltip="分割线"
                >
                    <Minus className="h-4 w-4" />
                </ToolbarButton>

                <div className="w-px h-5 bg-border/50 mx-1" />

                {/* 颜色 */}
                <ToolbarButton
                    isActive={colorMode === "text"}
                    onClick={() =>
                        setColorMode(colorMode === "text" ? null : "text")
                    }
                    tooltip="文字颜色"
                >
                    <Palette className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton
                    isActive={colorMode === "highlight"}
                    onClick={() =>
                        setColorMode(
                            colorMode === "highlight" ? null : "highlight"
                        )
                    }
                    tooltip="高亮"
                >
                    <Highlighter className="h-4 w-4" />
                </ToolbarButton>

                <div className="w-px h-5 bg-border/50 mx-1" />

                {/* LaTeX 公式 */}
                <ToolbarButton
                    isActive={false}
                    onClick={() => {
                        const { from, to } = editor.state.selection;
                        const selectedText = editor.state.doc.textBetween(
                            from,
                            to,
                            ""
                        );
                        if (selectedText.trim()) {
                            const isWrapped =
                                selectedText.startsWith("$") &&
                                selectedText.endsWith("$");
                            if (!isWrapped) {
                                editor
                                    .chain()
                                    .focus()
                                    .insertContent(
                                        `$${selectedText.trim()}$`
                                    )
                                    .run();
                            }
                        } else {
                            editor
                                .chain()
                                .focus()
                                .insertContent("$公式$")
                                .run();
                        }
                    }}
                    tooltip="LaTeX 公式（选中文本或插入模板）"
                >
                    <Sigma className="h-4 w-4" />
                </ToolbarButton>
            </div>

            {/* 颜色选择面板 */}
            {colorMode && (
                <div className="px-2 pb-2">
                    <ColorPanel
                        colors={
                            colorMode === "text"
                                ? TEXT_COLORS
                                : HIGHLIGHT_COLORS
                        }
                        title={
                            colorMode === "text" ? "文字颜色" : "高亮颜色"
                        }
                        onSelect={
                            colorMode === "text"
                                ? handleTextColor
                                : handleHighlight
                        }
                        onClose={() => setColorMode(null)}
                    />
                </div>
            )}
        </div>
    );
}
