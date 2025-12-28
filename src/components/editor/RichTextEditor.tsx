"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Image from "@tiptap/extension-image";
import { Mathematics, CodeBlockHighlight, ImageUpload } from "./extensions";
import { EditorToolbar } from "./EditorToolbar";
import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

export interface RichTextEditorProps {
    content?: string;
    placeholder?: string;
    onChange?: (content: string) => void;
    onJsonChange?: (json: object) => void;
    editable?: boolean;
    className?: string;
}

interface UploadStatus {
    type: "uploading" | "success" | "error";
    message: string;
}

export function RichTextEditor({
    content = "",
    placeholder = "开始输入你的内容... 使用 $...$ 插入数学公式，拖拽图片直接上传",
    onChange,
    onJsonChange,
    editable = true,
    className = "",
}: RichTextEditorProps) {
    const [uploadStatus, setUploadStatus] = useState<UploadStatus | null>(null);

    const clearUploadStatus = useCallback(() => {
        setTimeout(() => setUploadStatus(null), 3000);
    }, []);

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                codeBlock: false, // 使用自定义代码块
            }),
            Placeholder.configure({
                placeholder,
                emptyEditorClass: "is-editor-empty",
            }),
            Image.configure({
                HTMLAttributes: {
                    class: "rounded-lg max-w-full my-4 mx-auto shadow-md",
                },
            }),
            Mathematics,
            CodeBlockHighlight,
            ImageUpload.configure({
                onUploadStart: (fileName) => {
                    setUploadStatus({ type: "uploading", message: `正在上传: ${fileName}` });
                },
                onUploadComplete: (url, fileName) => {
                    setUploadStatus({ type: "success", message: `上传成功: ${fileName}` });
                    clearUploadStatus();
                },
                onUploadError: (error) => {
                    setUploadStatus({ type: "error", message: `上传失败: ${error}` });
                    clearUploadStatus();
                },
            }),
        ],
        content,
        editable,
        immediatelyRender: false, // 避免 SSR 水化不匹配
        onUpdate: ({ editor }) => {
            const html = editor.getHTML();
            const json = editor.getJSON();
            onChange?.(html);
            onJsonChange?.(json);
        },
        editorProps: {
            attributes: {
                class: "prose prose-sm sm:prose lg:prose-lg dark:prose-invert max-w-none focus:outline-none min-h-[200px] px-4 py-3",
            },
        },
    });

    return (
        <div className={`relative rounded-lg border border-border/50 bg-background overflow-hidden ${className}`}>
            {/* 工具栏 */}
            <EditorToolbar
                editor={editor}
                onUploadStart={() => {
                    setUploadStatus({ type: "uploading", message: "正在上传..." });
                }}
                onUploadComplete={() => {
                    setUploadStatus({ type: "success", message: "上传成功" });
                    clearUploadStatus();
                }}
                onUploadError={(error) => {
                    setUploadStatus({ type: "error", message: error });
                    clearUploadStatus();
                }}
            />

            {/* 编辑器内容 */}
            <EditorContent editor={editor} className="editor-content" />

            {/* 上传状态提示 */}
            <AnimatePresence>
                {uploadStatus && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className={`
              absolute bottom-4 left-4 right-4 
              flex items-center gap-2 px-4 py-2 rounded-lg
              text-sm font-medium
              ${uploadStatus.type === "uploading"
                                ? "bg-blue-500/10 text-blue-600 border border-blue-500/20"
                                : uploadStatus.type === "success"
                                    ? "bg-green-500/10 text-green-600 border border-green-500/20"
                                    : "bg-red-500/10 text-red-600 border border-red-500/20"
                            }
            `}
                    >
                        {uploadStatus.type === "uploading" && (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        )}
                        {uploadStatus.type === "success" && (
                            <CheckCircle className="h-4 w-4" />
                        )}
                        {uploadStatus.type === "error" && (
                            <XCircle className="h-4 w-4" />
                        )}
                        <span>{uploadStatus.message}</span>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default RichTextEditor;
