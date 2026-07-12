"use client";

import { Component, type ErrorInfo, type ReactNode, useRef, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { EditorContent, EditorRoot, type JSONContent } from "novel";
import { viewerExtensions } from "./viewer-extensions";
import MathViewerComponent from "./extensions/MathViewerComponent";

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

// 辅助函数，判定 LaTeX 是否为函数公式
function checkIsFunction(latex: string) {
    const trimmed = latex.trim();
    const clean = trimmed.replace(/^\$+|\$+$/g, "").trim();
    const lower = clean.toLowerCase();

    const hasXOrTheta = lower.includes("x") || lower.includes("\\theta") || lower.includes("t") || lower.includes("y");
    if (!hasXOrTheta) return { isFunc: false, desmosLatex: "" };

    const invalidKeywords = ["\\sum", "\\int", "\\lim", "\\matrix", "\\frac{d}{dx}", "\\approx", ">", "<", "\\ge", "\\le"];
    const hasInvalid = invalidKeywords.some(keyword => lower.includes(keyword));
    if (hasInvalid) return { isFunc: false, desmosLatex: "" };

    if (clean.includes("=")) {
        return { isFunc: true, desmosLatex: clean };
    } else {
        return { isFunc: true, desmosLatex: `y = ${clean}` };
    }
}

export default function NovelViewer({ initialValue }: NovelViewerProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [mathPortals, setMathPortals] = useState<{ id: string; element: HTMLElement; latex: string }[]>([]);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        // 设置定时器，等待 Tiptap 渲染与 KaTeX 异步装饰挂载就绪
        const timer = setTimeout(() => {
            const renders = container.querySelectorAll(".Tiptap-mathematics-render");
            const newPortals: typeof mathPortals = [];

            renders.forEach((renderEl, index) => {
                // 检查是否已经挂载过
                const sibling = renderEl.nextSibling as HTMLElement;
                if (sibling && sibling.classList?.contains("math-desmos-portal-container")) {
                    return;
                }

                // 在同级或父节点下寻找原 LaTeX 隐藏编辑节点
                let editorEl = renderEl.previousElementSibling as HTMLElement;
                if (!editorEl || !editorEl.classList.contains("Tiptap-mathematics-editor")) {
                    editorEl = renderEl.parentNode?.querySelector(".Tiptap-mathematics-editor") as HTMLElement;
                }

                if (editorEl && editorEl.classList.contains("Tiptap-mathematics-editor")) {
                    const latex = editorEl.textContent || "";
                    const { isFunc } = checkIsFunction(latex);

                    if (isFunc) {
                        const portalEl = document.createElement("span");
                        portalEl.className = "math-desmos-portal-container inline-block align-middle";
                        renderEl.parentNode?.insertBefore(portalEl, renderEl.nextSibling);

                        newPortals.push({
                            id: `math-portal-${index}-${Date.now()}`,
                            element: portalEl,
                            latex,
                        });
                    }
                }
            });

            if (newPortals.length > 0) {
                setMathPortals(prev => [...prev, ...newPortals]);
            }
        }, 500);

        return () => {
            clearTimeout(timer);
            setMathPortals([]);
            // 清理手动插入 DOM 中的 portal 容器节点，防止重复检查机制被绕过及内存泄漏
            if (container) {
                const portals = container.querySelectorAll(".math-desmos-portal-container");
                portals.forEach(el => el.remove());
            }
        };
    }, [JSON.stringify(initialValue)]);

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
        <div ref={containerRef} className="novel-viewer-container rich-text-content w-full bg-background relative">
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

            {/* 通过 React Portal 挂载 Desmos 交互窗格与按钮到 KaTeX 渲染节点后方 */}
            {mathPortals.map(portal => 
                createPortal(
                    <MathViewerComponent content={portal.latex} />,
                    portal.element
                )
            )}
        </div>
    );
}
