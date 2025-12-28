"use client";

import { Editor } from "@tiptap/react";
import { Button } from "@/components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    Bold,
    Italic,
    Strikethrough,
    Code,
    Heading1,
    Heading2,
    Heading3,
    List,
    ListOrdered,
    Quote,
    Minus,
    Undo,
    Redo,
    Image as ImageIcon,
    FileCode,
    Sigma,
} from "lucide-react";
import { useRef } from "react";
import { uploadMedia } from "./utils/upload";

interface EditorToolbarProps {
    editor: Editor | null;
    onUploadStart?: () => void;
    onUploadComplete?: () => void;
    onUploadError?: (error: string) => void;
}

interface ToolbarButtonProps {
    onClick: () => void;
    isActive?: boolean;
    disabled?: boolean;
    tooltip: string;
    children: React.ReactNode;
}

function ToolbarButton({
    onClick,
    isActive,
    disabled,
    tooltip,
    children,
}: ToolbarButtonProps) {
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClick}
                    disabled={disabled}
                    className={`
            h-8 w-8 p-0 
            ${isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"}
            transition-colors duration-200
          `}
                >
                    {children}
                </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
                {tooltip}
            </TooltipContent>
        </Tooltip>
    );
}

function ToolbarDivider() {
    return <div className="h-6 w-px bg-border mx-1" />;
}

export function EditorToolbar({
    editor,
    onUploadStart,
    onUploadComplete,
    onUploadError,
}: EditorToolbarProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!editor) {
        return null;
    }

    const handleImageClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const file = files[0];
        onUploadStart?.();

        try {
            const result = await uploadMedia(file);

            if (result.type === "image") {
                editor.chain().focus().setImage({ src: result.url, alt: result.fileName }).run();
            }

            onUploadComplete?.();
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "上传失败";
            onUploadError?.(errorMessage);
        }

        // 清空 input 以便重复选择同一文件
        e.target.value = "";
    };

    const insertMathFormula = () => {
        const latex = prompt("输入 LaTeX 公式：", "E = mc^2");
        if (latex) {
            editor.chain().focus().setMathematics(latex).run();
        }
    };

    return (
        <TooltipProvider delayDuration={300}>
            <div className="flex flex-wrap items-center gap-0.5 p-2 border-b border-border/50 bg-muted/30 rounded-t-lg">
                {/* 撤销/重做 */}
                <ToolbarButton
                    onClick={() => editor.chain().focus().undo().run()}
                    disabled={!editor.can().undo()}
                    tooltip="撤销"
                >
                    <Undo className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().redo().run()}
                    disabled={!editor.can().redo()}
                    tooltip="重做"
                >
                    <Redo className="h-4 w-4" />
                </ToolbarButton>

                <ToolbarDivider />

                {/* 文本格式 */}
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    isActive={editor.isActive("bold")}
                    tooltip="粗体"
                >
                    <Bold className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    isActive={editor.isActive("italic")}
                    tooltip="斜体"
                >
                    <Italic className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleStrike().run()}
                    isActive={editor.isActive("strike")}
                    tooltip="删除线"
                >
                    <Strikethrough className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleCode().run()}
                    isActive={editor.isActive("code")}
                    tooltip="行内代码"
                >
                    <Code className="h-4 w-4" />
                </ToolbarButton>

                <ToolbarDivider />

                {/* 标题 */}
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                    isActive={editor.isActive("heading", { level: 1 })}
                    tooltip="一级标题"
                >
                    <Heading1 className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    isActive={editor.isActive("heading", { level: 2 })}
                    tooltip="二级标题"
                >
                    <Heading2 className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                    isActive={editor.isActive("heading", { level: 3 })}
                    tooltip="三级标题"
                >
                    <Heading3 className="h-4 w-4" />
                </ToolbarButton>

                <ToolbarDivider />

                {/* 列表 */}
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    isActive={editor.isActive("bulletList")}
                    tooltip="无序列表"
                >
                    <List className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    isActive={editor.isActive("orderedList")}
                    tooltip="有序列表"
                >
                    <ListOrdered className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleBlockquote().run()}
                    isActive={editor.isActive("blockquote")}
                    tooltip="引用"
                >
                    <Quote className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().setHorizontalRule().run()}
                    tooltip="分割线"
                >
                    <Minus className="h-4 w-4" />
                </ToolbarButton>

                <ToolbarDivider />

                {/* 学术功能 */}
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                    isActive={editor.isActive("codeBlock")}
                    tooltip="代码块"
                >
                    <FileCode className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton onClick={insertMathFormula} tooltip="数学公式">
                    <Sigma className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton onClick={handleImageClick} tooltip="插入图片">
                    <ImageIcon className="h-4 w-4" />
                </ToolbarButton>

                {/* 隐藏的文件输入 */}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleFileChange}
                    className="hidden"
                />
            </div>
        </TooltipProvider>
    );
}

export default EditorToolbar;
