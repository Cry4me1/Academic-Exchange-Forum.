"use client";

import React, { useRef, useCallback } from "react";
import {
    EditorRoot,
    EditorContent,
    EditorCommand,
    EditorCommandEmpty,
    EditorCommandList,
    EditorCommandItem,
    ImageResizer,
    type JSONContent,
} from "novel";
import { defaultExtensions } from "./extensions";
import { suggestionItems } from "./slash-command";
import { handleImageDrop, handleImagePaste } from "novel";
import { onUpload, onDelete } from "@/lib/image-upload";
import BubbleMenu from "./BubbleMenu";
import { SlashAISelector } from "./generative/slash-ai-selector";

interface NovelEditorProps {
    initialValue?: JSONContent;
    onChange?: (value: JSONContent) => void;
    editable?: boolean;
}

/**
 * Extract all image URLs from JSONContent
 */
function extractImageUrls(content: JSONContent): Set<string> {
    const urls = new Set<string>();

    function traverse(node: JSONContent) {
        if (node.type === 'image' && node.attrs?.src) {
            urls.add(node.attrs.src);
        }
        if (node.content && Array.isArray(node.content)) {
            node.content.forEach(traverse);
        }
    }

    traverse(content);
    return urls;
}

export default function NovelEditor({
    initialValue,
    onChange,
    editable = true,
}: NovelEditorProps) {
    const extensions = [...defaultExtensions];

    // Track previous image URLs to detect deletions
    const previousImageUrls = useRef<Set<string>>(new Set());

    // Initialize with images from initial content
    const isInitialized = useRef(false);

    const handleUpdate = useCallback(({ editor }: { editor: any }) => {
        const json = editor.getJSON();
        const currentUrls = extractImageUrls(json);

        // Initialize on first update
        if (!isInitialized.current) {
            previousImageUrls.current = currentUrls;
            isInitialized.current = true;
            onChange?.(json);
            return;
        }

        // Find deleted images (in previous but not in current)
        previousImageUrls.current.forEach((url) => {
            if (!currentUrls.has(url)) {
                // This image was deleted, remove from storage
                onDelete(url);
            }
        });

        // Update tracked URLs
        previousImageUrls.current = currentUrls;

        onChange?.(json);
    }, [onChange]);

    return (
        <div className="novel-editor-container relative w-full border rounded-lg bg-background">
            <EditorRoot>
                <EditorContent
                    initialContent={initialValue}
                    extensions={extensions}
                    immediatelyRender={false}
                    editorProps={{
                        handleDOMEvents: {
                            keydown: (_view, event) => {
                                // Default slash command behavior is handled by EditorCommand component
                                return false;
                            },
                        },
                        handlePaste: (view, event) =>
                            handleImagePaste(view, event, onUpload),
                        handleDrop: (view, event, _slice, moved) =>
                            handleImageDrop(view, event, moved, onUpload),
                        attributes: {
                            class: "prose prose-lg dark:prose-invert prose-headings:font-title font-default focus:outline-none max-w-full p-4 min-h-[300px]",
                        },
                        editable: () => editable,
                    }}
                    onUpdate={handleUpdate}
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
                                        <p className="font-medium">{item.title}</p>
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
