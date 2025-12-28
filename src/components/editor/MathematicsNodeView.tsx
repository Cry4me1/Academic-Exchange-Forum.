"use client";

import { NodeViewWrapper, NodeViewProps } from "@tiptap/react";
import { useEffect, useRef, useState } from "react";
import katex from "katex";

export default function MathematicsNodeView({
    node,
    updateAttributes,
    selected,
}: NodeViewProps) {
    const latex = (node.attrs.latex as string) || "";
    const isBlock = (node.attrs.isBlock as boolean) || false;
    const containerRef = useRef<HTMLSpanElement>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(latex);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (containerRef.current && !isEditing) {
            try {
                katex.render(latex || "\\text{公式}", containerRef.current, {
                    throwOnError: false,
                    displayMode: isBlock,
                    output: "html",
                });
                setError(null);
            } catch (err) {
                setError((err as Error).message);
                if (containerRef.current) {
                    containerRef.current.innerHTML = `<span class="text-red-500 text-sm">${latex}</span>`;
                }
            }
        }
    }, [latex, isBlock, isEditing]);

    const handleDoubleClick = () => {
        setIsEditing(true);
        setEditValue(latex);
    };

    const handleBlur = () => {
        setIsEditing(false);
        if (editValue !== latex) {
            updateAttributes({ latex: editValue });
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleBlur();
        }
        if (e.key === "Escape") {
            setIsEditing(false);
            setEditValue(latex);
        }
    };

    if (isEditing) {
        return (
            <NodeViewWrapper
                as="span"
                className={`inline-flex items-center ${isBlock ? "w-full justify-center my-2" : ""}`}
            >
                <input
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    autoFocus
                    className={`
            bg-muted border border-primary/50 rounded px-2 py-1
            text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30
            ${isBlock ? "w-full max-w-md text-center" : "min-w-[100px]"}
          `}
                    placeholder="输入 LaTeX 公式..."
                />
            </NodeViewWrapper>
        );
    }

    return (
        <NodeViewWrapper
            as="span"
            className={`
        inline-flex items-center cursor-pointer transition-all duration-200
        ${isBlock ? "w-full justify-center my-4 py-2" : "mx-0.5"}
        ${selected ? "bg-primary/10 rounded" : ""}
        hover:bg-primary/5 rounded
      `}
            onDoubleClick={handleDoubleClick}
        >
            <span
                ref={containerRef}
                className={`
          ${isBlock ? "text-lg" : "text-base"}
          ${error ? "text-red-500" : "text-foreground"}
        `}
            />
        </NodeViewWrapper>
    );
}
