"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { EditorContent, EditorRoot, type JSONContent } from "novel";
import { viewerExtensions } from "./viewer-extensions";

// Error boundary to catch Tiptap rendering crashes
class ViewerErrorBoundary extends Component<
    { children: ReactNode },
    { hasError: boolean; error: Error | null }
> {
    constructor(props: { children: ReactNode }) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error) {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("[NovelViewer] Render error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="p-4 rounded-lg border border-orange-500/30 bg-orange-500/5 text-sm">
                    <p className="font-semibold text-orange-600 mb-1">
                        ⚠ 内容渲染出错
                    </p>
                    <pre className="text-xs text-muted-foreground whitespace-pre-wrap">
                        {this.state.error?.message}
                    </pre>
                </div>
            );
        }
        return this.props.children;
    }
}

interface NovelViewerProps {
    initialValue?: JSONContent;
}

export default function NovelViewer({ initialValue }: NovelViewerProps) {
    if (!initialValue) return null;

    // Debug: log what content shape we receive and the names of registered extensions
    if (typeof window !== "undefined") {
        console.log(
            "[NovelViewer] initialValue type:",
            typeof initialValue,
            "keys:",
            Object.keys(initialValue),
        );
        console.log(
            "[NovelViewer] registered extensions:",
            viewerExtensions.map((ext: any) => ext?.name || ext?.constructor?.name)
        );
    }

    return (
        <div className="novel-viewer-container rich-text-content w-full bg-background">
            <ViewerErrorBoundary>
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
            </ViewerErrorBoundary>
        </div>
    );
}
