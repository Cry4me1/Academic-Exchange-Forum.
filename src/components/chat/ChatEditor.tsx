"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import renderMathInElement from "katex/dist/contrib/auto-render";
import {
    Bold,
    Code,
    Italic,
    Link as LinkIcon,
    List,
    ListOrdered,
    Quote,
    Strikethrough,
} from "lucide-react";
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
// @ts-ignore

// 使用 TipTap 核心库创建轻量级编辑器
import Link from "@tiptap/extension-link";
import { Mathematics } from "@tiptap/extension-mathematics";
import Placeholder from "@tiptap/extension-placeholder";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

// 聊天编辑器扩展配置
const chatExtensions = [
    StarterKit.configure({
        heading: false,
        horizontalRule: false,
        blockquote: {
            HTMLAttributes: {
                class: "border-l-2 border-primary pl-3 my-1",
            },
        },
        bulletList: {
            HTMLAttributes: {
                class: "list-disc list-inside my-1",
            },
        },
        orderedList: {
            HTMLAttributes: {
                class: "list-decimal list-inside my-1",
            },
        },
        code: {
            HTMLAttributes: {
                class: "rounded bg-muted px-1.5 py-0.5 font-mono text-sm",
            },
        },
        codeBlock: {
            HTMLAttributes: {
                class: "rounded-lg bg-muted p-3 font-mono text-sm my-1",
            },
        },
    }),
    Link.configure({
        openOnClick: false,
        HTMLAttributes: {
            class: "text-primary underline cursor-pointer",
        },
    }),
    Placeholder.configure({
        placeholder: "输入消息... 支持 Markdown 格式",
    }),
    // LaTeX 公式支持
    Mathematics.configure({
        regex: /\$([^\$]+)\$/gi,
    }),
];

interface ChatEditorProps {
    value?: string;
    onChange?: (html: string, text: string) => void;
    onSubmit?: () => void;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
    minHeight?: string;
}

export interface ChatEditorRef {
    focus: () => void;
    clear: () => void;
    getHTML: () => string;
    getText: () => string;
    isEmpty: () => boolean;
}

export const ChatEditor = forwardRef<ChatEditorRef, ChatEditorProps>(
    function ChatEditor(
        {
            value,
            onChange,
            onSubmit,
            placeholder,
            disabled = false,
            className,
            minHeight = "40px",
        },
        ref
    ) {
        const [linkUrl, setLinkUrl] = useState("");
        const [showLinkPopover, setShowLinkPopover] = useState(false);

        const editor = useEditor({
            extensions: placeholder
                ? [
                    ...chatExtensions.filter(ext => ext.name !== "placeholder"),
                    Placeholder.configure({ placeholder }),
                ]
                : chatExtensions,
            content: value || "",
            editable: !disabled,
            editorProps: {
                attributes: {
                    class: cn(
                        "prose prose-sm dark:prose-invert max-w-none focus:outline-none px-3 py-2",
                        "min-h-[40px] max-h-[200px] overflow-y-auto"
                    ),
                    style: `min-height: ${minHeight}`,
                },
                handleKeyDown: (view, event) => {
                    // Enter 发送消息 (非 Shift+Enter)
                    if (event.key === "Enter" && !event.shiftKey && !event.ctrlKey) {
                        // 检查是否在代码块或列表中
                        const { state } = view;
                        const { $from } = state.selection;
                        const isInCodeBlock = $from.parent.type.name === "codeBlock";
                        const isInList = $from.parent.type.name === "listItem";

                        if (!isInCodeBlock && !isInList) {
                            event.preventDefault();
                            onSubmit?.();
                            return true;
                        }
                    }
                    return false;
                },
            },
            onUpdate: ({ editor }) => {
                onChange?.(editor.getHTML(), editor.getText());
            },
        });

        // 暴露方法给父组件
        useImperativeHandle(ref, () => ({
            focus: () => editor?.commands.focus(),
            clear: () => editor?.commands.clearContent(),
            getHTML: () => editor?.getHTML() || "",
            getText: () => editor?.getText() || "",
            isEmpty: () => editor?.isEmpty ?? true,
        }));

        // 添加链接
        const addLink = useCallback(() => {
            if (!editor || !linkUrl) return;

            editor
                .chain()
                .focus()
                .extendMarkRange("link")
                .setLink({ href: linkUrl })
                .run();

            setLinkUrl("");
            setShowLinkPopover(false);
        }, [editor, linkUrl]);

        // 移除链接
        const removeLink = useCallback(() => {
            if (!editor) return;
            editor.chain().focus().unsetLink().run();
        }, [editor]);

        if (!editor) return null;

        return (
            <div className={cn("relative rounded-lg border bg-background", className)}>
                {/* 工具栏 */}
                <div className="flex items-center gap-0.5 px-2 py-1 border-b bg-muted/30">
                    <ToolbarButton
                        icon={Bold}
                        isActive={editor.isActive("bold")}
                        onClick={() => editor.chain().focus().toggleBold().run()}
                        tooltip="加粗"
                    />
                    <ToolbarButton
                        icon={Italic}
                        isActive={editor.isActive("italic")}
                        onClick={() => editor.chain().focus().toggleItalic().run()}
                        tooltip="斜体"
                    />
                    <ToolbarButton
                        icon={Strikethrough}
                        isActive={editor.isActive("strike")}
                        onClick={() => editor.chain().focus().toggleStrike().run()}
                        tooltip="删除线"
                    />
                    <ToolbarButton
                        icon={Code}
                        isActive={editor.isActive("code")}
                        onClick={() => editor.chain().focus().toggleCode().run()}
                        tooltip="行内代码"
                    />

                    <div className="w-px h-4 bg-border mx-1" />

                    <ToolbarButton
                        icon={List}
                        isActive={editor.isActive("bulletList")}
                        onClick={() => editor.chain().focus().toggleBulletList().run()}
                        tooltip="无序列表"
                    />
                    <ToolbarButton
                        icon={ListOrdered}
                        isActive={editor.isActive("orderedList")}
                        onClick={() => editor.chain().focus().toggleOrderedList().run()}
                        tooltip="有序列表"
                    />
                    <ToolbarButton
                        icon={Quote}
                        isActive={editor.isActive("blockquote")}
                        onClick={() => editor.chain().focus().toggleBlockquote().run()}
                        tooltip="引用"
                    />

                    <div className="w-px h-4 bg-border mx-1" />

                    {/* 链接按钮 */}
                    <Popover open={showLinkPopover} onOpenChange={setShowLinkPopover}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className={cn(
                                    "h-7 w-7",
                                    editor.isActive("link") && "bg-muted"
                                )}
                            >
                                <LinkIcon className="h-4 w-4" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 p-3" align="start">
                            <div className="flex gap-2">
                                <Input
                                    placeholder="输入链接地址..."
                                    value={linkUrl}
                                    onChange={(e) => setLinkUrl(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            e.preventDefault();
                                            addLink();
                                        }
                                    }}
                                />
                                <Button size="sm" onClick={addLink}>
                                    确定
                                </Button>
                            </div>
                            {editor.isActive("link") && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="mt-2 text-destructive"
                                    onClick={removeLink}
                                >
                                    移除链接
                                </Button>
                            )}
                        </PopoverContent>
                    </Popover>
                </div>

                {/* 编辑区域 */}
                <EditorContent editor={editor} />

                {/* LaTeX 提示 */}
                <div className="px-3 py-1 text-[10px] text-muted-foreground border-t bg-muted/20">
                    提示：使用 $公式$ 输入 LaTeX 数学公式，Shift+Enter 换行
                </div>
            </div>
        );
    }
);

// 工具栏按钮组件
interface ToolbarButtonProps {
    icon: React.ComponentType<{ className?: string }>;
    isActive?: boolean;
    onClick: () => void;
    tooltip: string;
}

function ToolbarButton({ icon: Icon, isActive, onClick, tooltip }: ToolbarButtonProps) {
    return (
        <Button
            variant="ghost"
            size="icon"
            className={cn("h-7 w-7", isActive && "bg-muted")}
            onClick={onClick}
            title={tooltip}
        >
            <Icon className="h-4 w-4" />
        </Button>
    );
}

// 简化版只读渲染器（用于聊天气泡）
interface ChatContentViewerProps {
    content: string;
    className?: string;
}

export function ChatContentViewer({ content, className }: ChatContentViewerProps) {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (containerRef.current) {
            // 使用 KaTeX 自动渲染容器内的 LaTeX 公式
            try {
                renderMathInElement(containerRef.current, {
                    delimiters: [
                        { left: "$$", right: "$$", display: true },
                        { left: "$", right: "$", display: false },
                        { left: "\\(", right: "\\)", display: false },
                        { left: "\\[", right: "\\]", display: true },
                    ],
                    throwOnError: false,
                    output: "html",
                });
            } catch (e) {
                console.error("KaTeX rendering error:", e);
            }
        }
    }, [content]);

    // 始终使用 dangerouslySetInnerHTML 以支持富文本和公式
    return (
        <div
            ref={containerRef}
            className={cn(
                "prose prose-sm dark:prose-invert max-w-none break-words",
                "prose-p:my-0 prose-ul:my-1 prose-ol:my-1 prose-blockquote:my-1",
                className
            )}
            dangerouslySetInnerHTML={{ __html: content }}
        />
    );
}

// 纯文本 + LaTeX 渲染器 (安全，防 XSS)
interface ChatTextMathViewerProps {
    content: string;
    className?: string;
}

export function ChatTextMathViewer({ content, className }: ChatTextMathViewerProps) {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (containerRef.current) {
            try {
                renderMathInElement(containerRef.current, {
                    delimiters: [
                        { left: "$$", right: "$$", display: true },
                        { left: "$", right: "$", display: false },
                        { left: "\\(", right: "\\)", display: false },
                        { left: "\\[", right: "\\]", display: true },
                    ],
                    throwOnError: false,
                    output: "html",
                });
            } catch (e) {
                console.error("KaTeX rendering error:", e);
            }
        }
    }, [content]);

    return (
        <div
            ref={containerRef}
            className={cn(
                "whitespace-pre-wrap break-words",
                className
            )}
        >
            {content}
        </div>
    );
}
