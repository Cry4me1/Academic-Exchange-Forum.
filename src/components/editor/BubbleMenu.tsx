"use client";

import { EditorBubble, EditorBubbleItem, useEditor } from "novel";
import { Bold, Italic, Strikethrough, Code, Link, Palette, Highlighter, Sigma } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { toast } from "sonner";

interface BubbleButtonProps {
    children: React.ReactNode;
    isActive?: boolean;
    onClick: () => void;
    style?: React.CSSProperties;
    title?: string;
}

const BubbleButton = ({ children, isActive, onClick, style, title }: BubbleButtonProps) => (
    <button
        type="button"
        onClick={onClick}
        style={style}
        title={title}
        className={cn(
            "p-2 rounded-md hover:bg-accent transition-colors",
            isActive && "bg-accent text-accent-foreground"
        )}
    >
        {children}
    </button>
);

interface LinkInputProps {
    onSubmit: (url: string) => void;
    onCancel: () => void;
}

const LinkInput = ({ onSubmit, onCancel }: LinkInputProps) => {
    const [url, setUrl] = useState("");

    return (
        <div className="flex items-center gap-1">
            <input
                type="url"
                placeholder="输入链接..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === "Enter") {
                        e.preventDefault();
                        onSubmit(url);
                    }
                    if (e.key === "Escape") {
                        onCancel();
                    }
                }}
                className="h-8 px-2 text-sm bg-background border rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                autoFocus
            />
            <button
                type="button"
                onClick={() => onSubmit(url)}
                className="px-2 py-1 text-xs bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
                确定
            </button>
            <button
                type="button"
                onClick={onCancel}
                className="px-2 py-1 text-xs bg-muted rounded-md hover:bg-muted/80"
            >
                取消
            </button>
        </div>
    );
};

// Predefined colors for text and highlight
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

interface ColorPickerProps {
    colors: { name: string; color: string }[];
    onSelect: (color: string) => void;
    onClose: () => void;
    title: string;
}

const ColorPicker = ({ colors, onSelect, onClose, title }: ColorPickerProps) => (
    <div className="flex flex-col gap-2 p-2">
        <span className="text-xs text-muted-foreground font-medium">{title}</span>
        <div className="flex flex-wrap gap-1">
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
                            backgroundImage: "linear-gradient(135deg, transparent 45%, #dc2626 45%, #dc2626 55%, transparent 55%)",
                        }),
                    }}
                />
            ))}
        </div>
    </div>
);

export default function BubbleMenu() {
    const { editor } = useEditor();
    const [showLinkInput, setShowLinkInput] = useState(false);
    const [showColorPicker, setShowColorPicker] = useState<"text" | "highlight" | null>(null);

    if (!editor) return null;

    const handleLink = (url: string) => {
        if (url) {
            editor.chain().focus().setLink({ href: url }).run();
        }
        setShowLinkInput(false);
    };

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

    // Handle LaTeX rendering - wrap selected text with $ for regex-based rendering
    const handleMathRender = () => {
        const { from, to } = editor.state.selection;
        const selectedText = editor.state.doc.textBetween(from, to, "");

        if (!selectedText.trim()) {
            toast.error("请先选择 LaTeX 公式文本");
            return;
        }

        // Check if already wrapped
        const isWrapped = selectedText.startsWith("$") && selectedText.endsWith("$");

        if (isWrapped) {
            // Optional: Unwrap if already wrapped? Or just do nothing.
            // For now, let's just properly wrap it if not wrapped.
            toast.info("已经是公式格式");
            return;
        }

        // Replace selection with wrapped text
        editor.chain()
            .focus()
            .insertContent(`$${selectedText.trim()}$`)
            .run();

        toast.success("公式已标记");
    };

    return (
        <EditorBubble
            tippyOptions={{
                placement: "top",
            }}
            className="flex items-center gap-0.5 bg-background border rounded-lg shadow-xl p-1"
        >
            {showLinkInput ? (
                <LinkInput
                    onSubmit={handleLink}
                    onCancel={() => setShowLinkInput(false)}
                />
            ) : showColorPicker === "text" ? (
                <ColorPicker
                    colors={TEXT_COLORS}
                    onSelect={handleTextColor}
                    onClose={() => setShowColorPicker(null)}
                    title="文字颜色"
                />
            ) : showColorPicker === "highlight" ? (
                <ColorPicker
                    colors={HIGHLIGHT_COLORS}
                    onSelect={handleHighlight}
                    onClose={() => setShowColorPicker(null)}
                    title="高亮颜色"
                />
            ) : (
                <>
                    <EditorBubbleItem
                        onSelect={(editor) => {
                            editor.chain().focus().toggleBold().run();
                        }}
                    >
                        <BubbleButton
                            isActive={editor.isActive("bold")}
                            onClick={() => { }}
                            title="加粗"
                        >
                            <Bold className="h-4 w-4" />
                        </BubbleButton>
                    </EditorBubbleItem>

                    <EditorBubbleItem
                        onSelect={(editor) => {
                            editor.chain().focus().toggleItalic().run();
                        }}
                    >
                        <BubbleButton
                            isActive={editor.isActive("italic")}
                            onClick={() => { }}
                            title="斜体"
                        >
                            <Italic className="h-4 w-4" />
                        </BubbleButton>
                    </EditorBubbleItem>

                    <EditorBubbleItem
                        onSelect={(editor) => {
                            editor.chain().focus().toggleStrike().run();
                        }}
                    >
                        <BubbleButton
                            isActive={editor.isActive("strike")}
                            onClick={() => { }}
                            title="删除线"
                        >
                            <Strikethrough className="h-4 w-4" />
                        </BubbleButton>
                    </EditorBubbleItem>

                    <EditorBubbleItem
                        onSelect={(editor) => {
                            editor.chain().focus().toggleCode().run();
                        }}
                    >
                        <BubbleButton
                            isActive={editor.isActive("code")}
                            onClick={() => { }}
                            title="代码"
                        >
                            <Code className="h-4 w-4" />
                        </BubbleButton>
                    </EditorBubbleItem>

                    <div className="w-px h-6 bg-border mx-1" />

                    {/* Text Color */}
                    <EditorBubbleItem
                        onSelect={() => {
                            setShowColorPicker("text");
                        }}
                    >
                        <BubbleButton
                            isActive={editor.isActive("textStyle")}
                            onClick={() => { }}
                            title="文字颜色"
                        >
                            <Palette className="h-4 w-4" />
                        </BubbleButton>
                    </EditorBubbleItem>

                    {/* Highlight Color */}
                    <EditorBubbleItem
                        onSelect={() => {
                            setShowColorPicker("highlight");
                        }}
                    >
                        <BubbleButton
                            isActive={editor.isActive("highlight")}
                            onClick={() => { }}
                            title="高亮颜色"
                        >
                            <Highlighter className="h-4 w-4" />
                        </BubbleButton>
                    </EditorBubbleItem>

                    <div className="w-px h-6 bg-border mx-1" />

                    {/* Math Render Button */}
                    <EditorBubbleItem
                        onSelect={handleMathRender}
                    >
                        <BubbleButton
                            isActive={false}
                            onClick={() => { }}
                            title="渲染为数学公式（选中 LaTeX 文本后点击）"
                        >
                            <Sigma className="h-4 w-4" />
                        </BubbleButton>
                    </EditorBubbleItem>

                    <EditorBubbleItem
                        onSelect={() => {
                            if (editor.isActive("link")) {
                                editor.chain().focus().unsetLink().run();
                            } else {
                                setShowLinkInput(true);
                            }
                        }}
                    >
                        <BubbleButton
                            isActive={editor.isActive("link")}
                            onClick={() => { }}
                            title="链接"
                        >
                            <Link className="h-4 w-4" />
                        </BubbleButton>
                    </EditorBubbleItem>
                </>
            )}
        </EditorBubble>
    );
}
