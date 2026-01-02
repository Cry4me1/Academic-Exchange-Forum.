"use client";

import { EditorRoot, EditorContent, type JSONContent } from "novel";
import { defaultExtensions } from "./extensions";

interface NovelViewerProps {
    initialValue?: JSONContent;
}

export default function NovelViewer({ initialValue }: NovelViewerProps) {
    if (!initialValue) return null;

    return (
        <div className="novel-viewer-container w-full bg-background">
            <EditorRoot>
                <EditorContent
                    initialContent={initialValue}
                    extensions={defaultExtensions}
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
