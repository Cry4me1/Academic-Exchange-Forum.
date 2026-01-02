"use client";

import { useState, useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bold, Send, Loader2 } from "lucide-react";

interface CommentInputProps {
    currentUser?: {
        id: string;
        username: string;
        avatar_url?: string;
    } | null;
    parentId?: string | null;
    onSubmit: (content: object, parentId?: string | null) => Promise<void>;
    onCancel?: () => void;
    placeholder?: string;
    autoFocus?: boolean;
}

export function CommentInput({
    currentUser,
    parentId = null,
    onSubmit,
    onCancel,
    placeholder = "写下你的评论...",
    autoFocus = false,
}: CommentInputProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isEditorReady, setIsEditorReady] = useState(false);
    const [hasContent, setHasContent] = useState(false);

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: false,
                codeBlock: false,
                horizontalRule: false,
                blockquote: false,
            }),
            Placeholder.configure({
                placeholder,
            }),
        ],
        content: "",
        autofocus: autoFocus,
        immediatelyRender: false,
        editorProps: {
            attributes: {
                class: "prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[60px] p-3",
            },
        },
        onUpdate: ({ editor }) => {
            setHasContent(!editor.isEmpty);
        },
        onCreate: () => {
            setIsEditorReady(true);
        },
    });

    // 确保编辑器状态同步
    useEffect(() => {
        if (editor) {
            setIsEditorReady(true);
            setHasContent(!editor.isEmpty);
        }
    }, [editor]);

    const handleSubmit = async () => {
        if (!editor || editor.isEmpty) return;

        setIsSubmitting(true);
        try {
            const content = editor.getJSON();
            await onSubmit(content, parentId);
            editor.commands.clearContent();
            setHasContent(false);
        } catch (error) {
            console.error("Failed to submit comment:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const toggleBold = () => {
        editor?.chain().focus().toggleBold().run();
    };

    const userInitials = currentUser?.username?.slice(0, 2).toUpperCase() || "?";

    if (!currentUser) {
        return (
            <div className="bg-muted/50 rounded-lg p-4 text-center">
                <p className="text-sm text-muted-foreground">
                    请先登录后发表评论
                </p>
            </div>
        );
    }

    return (
        <div className="border border-border/50 rounded-lg overflow-hidden bg-card">
            <div className="flex gap-3 p-3">
                <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarImage src={currentUser.avatar_url} alt={currentUser.username} />
                    <AvatarFallback className="bg-gradient-to-br from-primary/30 to-primary/10 text-primary text-xs font-semibold">
                        {userInitials}
                    </AvatarFallback>
                </Avatar>

                <div className="flex-1">
                    {!isEditorReady ? (
                        <div className="border border-border/50 rounded-md bg-background h-[84px] flex items-center justify-center">
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        <EditorContent
                            editor={editor}
                            className="border border-border/50 rounded-md bg-background focus-within:ring-2 focus-within:ring-primary/20"
                        />
                    )}
                </div>
            </div>

            {/* 工具栏和提交按钮 */}
            <div className="flex items-center justify-between px-3 pb-3">
                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={toggleBold}
                        title="加粗"
                        disabled={!isEditorReady}
                    >
                        <Bold className="h-4 w-4" />
                    </Button>
                    <span className="text-xs text-muted-foreground ml-2">
                        支持 <code className="bg-muted px-1 rounded">$公式$</code> 语法
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    {onCancel && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onCancel}
                            disabled={isSubmitting}
                        >
                            取消
                        </Button>
                    )}
                    <Button
                        size="sm"
                        onClick={handleSubmit}
                        disabled={isSubmitting || !isEditorReady || !hasContent}
                        className="gap-1.5"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                发送中
                            </>
                        ) : (
                            <>
                                <Send className="h-4 w-4" />
                                发表
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}

export default CommentInput;
