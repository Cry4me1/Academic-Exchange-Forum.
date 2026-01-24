"use client";

import { EditorContent, EditorRoot, type JSONContent } from "novel";
import { viewerExtensions } from "./viewer-extensions";

interface NovelViewerProps {
    initialValue?: JSONContent;
}

export default function NovelViewer({ initialValue }: NovelViewerProps) {
    if (!initialValue) return null;

    return (
        <div className="novel-viewer-container rich-text-content w-full bg-background">
            <EditorRoot>
                <EditorContent
                    initialContent={initialValue}
                    extensions={viewerExtensions}
                    immediatelyRender={false}
                    editorProps={{
                        attributes: {
                            class: "prose prose-lg dark:prose-invert prose-headings:font-title font-default focus:outline-none max-w-full",
                        },
                        editable: () => false,
                    }}
                    className="w-full"
                />
            </EditorRoot>
        </div>
    );
}
