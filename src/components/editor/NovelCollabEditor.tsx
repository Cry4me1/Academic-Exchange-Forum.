"use client";

import { onUpload } from "@/lib/image-upload";
import {
    EditorCommand,
    EditorCommandEmpty,
    EditorCommandItem,
    EditorCommandList,
    EditorContent,
    EditorRoot,
    handleImageDrop,
    handleImagePaste,
    ImageResizer,
    type JSONContent,
} from "novel";
import { useMemo } from "react";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCursor from "@tiptap/extension-collaboration-cursor";
import BubbleMenu from "./BubbleMenu";
import { SlashAISelector } from "./generative/slash-ai-selector";
import { createExtensions } from "./extensions";
import { suggestionItems } from "./slash-command";
import type * as Y from "yjs";

interface NovelCollabEditorProps {
    ydoc: Y.Doc;
    awarenessProvider: { awareness: any };
    currentUser: { name: string; color: string };
    onUpdate?: (value: JSONContent) => void;
}

/**
 * 基于 Novel 的协作编辑器
 * 复用发帖页面的全部 UI：代码块语言选择、slash 命令、BubbleMenu、图片上传等
 * 同时注入 Yjs Collaboration + CollaborationCursor 扩展
 */
export default function NovelCollabEditor({
    ydoc,
    awarenessProvider,
    currentUser,
    onUpdate,
}: NovelCollabEditorProps) {
    // 合并默认扩展（禁用 history）+ 协作扩展
    const extensions = useMemo(() => {
        const baseExtensions = createExtensions({
            disableHistory: true,
            placeholder: "输入 '/' 唤起命令，开始协作笔记...",
        });

        return [
            ...baseExtensions,
            // Yjs 文档协作
            Collaboration.configure({
                document: ydoc,
            }),
            // 协作光标
            CollaborationCursor.configure({
                provider: awarenessProvider,
                user: currentUser,
                render: (user: { name: string; color: string }) => {
                    const cursor = document.createElement("span");
                    cursor.classList.add("collaboration-cursor__caret");
                    cursor.style.borderColor = user.color;

                    const label = document.createElement("div");
                    label.classList.add("collaboration-cursor__label");
                    label.style.backgroundColor = user.color;
                    label.textContent = user.name;
                    cursor.appendChild(label);

                    return cursor;
                },
            }),
        ];
    }, [ydoc, awarenessProvider, currentUser]);

    return (
        <div className="novel-editor-container relative w-full h-full">
            <EditorRoot>
                <EditorContent
                    extensions={extensions}
                    immediatelyRender={false}
                    editorProps={{
                        handleDOMEvents: {
                            keydown: (_view, _event) => {
                                return false;
                            },
                        },
                        handlePaste: (view, event) =>
                            handleImagePaste(view, event, onUpload),
                        handleDrop: (view, event, _slice, moved) =>
                            handleImageDrop(view, event, moved, onUpload),
                        attributes: {
                            class: "prose prose-sm dark:prose-invert prose-headings:font-title font-default focus:outline-none max-w-full p-4 min-h-[200px]",
                        },
                    }}
                    onUpdate={({ editor }) => {
                        onUpdate?.(editor.getJSON());
                    }}
                    className="w-full h-full"
                >
                    <EditorCommand className="z-50 h-auto max-h-[330px] overflow-y-auto rounded-md border border-muted bg-background px-1 py-2 shadow-md transition-all">
                        <EditorCommandEmpty className="px-2 text-muted-foreground">
                            没有找到命令
                        </EditorCommandEmpty>
                        <EditorCommandList>
                            {suggestionItems.map((item) => (
                                <EditorCommandItem
                                    key={item.title}
                                    value={item.title}
                                    onCommand={(val) => item.command?.(val)}
                                    className="flex w-full items-center space-x-2 rounded-md px-2 py-1 text-left text-sm hover:bg-accent aria-selected:bg-accent cursor-pointer"
                                >
                                    <div className="flex h-10 w-10 items-center justify-center rounded-md border border-muted bg-background">
                                        {item.icon}
                                    </div>
                                    <div>
                                        <p className="font-medium">
                                            {item.title}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {item.description}
                                        </p>
                                    </div>
                                </EditorCommandItem>
                            ))}
                        </EditorCommandList>
                    </EditorCommand>
                    <ImageResizer />
                    <BubbleMenu />
                    <SlashAISelector />
                </EditorContent>
            </EditorRoot>
        </div>
    );
}
