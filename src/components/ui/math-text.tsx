"use client";

import React, { useMemo } from "react";
import katex from "katex";
import { cn } from "@/lib/utils";

export interface MathTextProps {
    text: string;
    className?: string;
    inlineOnly?: boolean;
    as?: React.ElementType;
}

export interface MathSegment {
    type: "text" | "inline-math" | "block-math";
    content: string;
}

/**
 * 解析带有 LaTeX 数学公式标记的文本
 * 支持 $...$ (行内公式), $$...$$ (块级公式), \(...\) (行内), \[...\] (块级)
 */
export function parseMathText(text: string): MathSegment[] {
    if (!text) return [];

    // 正则匹配顺序：优先匹配块级 $$...$$ 或 \[...\]，再匹配行内 $...$ 或 \(...\)
    const regex = /(\$\$[\s\S]+?\$\$|\\\[[\s\S]+?\\\]|\$[^$\n]+?\$|\\\([\s\S]+?\\\))/g;

    const segments: MathSegment[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
        if (match.index > lastIndex) {
            segments.push({
                type: "text",
                content: text.slice(lastIndex, match.index),
            });
        }

        const m = match[0];
        if (m.startsWith("$$") && m.endsWith("$$")) {
            segments.push({
                type: "block-math",
                content: m.slice(2, -2),
            });
        } else if (m.startsWith("\\[") && m.endsWith("\\]")) {
            segments.push({
                type: "block-math",
                content: m.slice(2, -2),
            });
        } else if (m.startsWith("$") && m.endsWith("$")) {
            segments.push({
                type: "inline-math",
                content: m.slice(1, -1),
            });
        } else if (m.startsWith("\\(") && m.endsWith("\\)")) {
            segments.push({
                type: "inline-math",
                content: m.slice(2, -2),
            });
        } else {
            segments.push({
                type: "text",
                content: m,
            });
        }

        lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
        segments.push({
            type: "text",
            content: text.slice(lastIndex),
        });
    }

    return segments;
}

function escapeHtml(str: string): string {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function renderKatexToString(mathStr: string, displayMode: boolean): string {
    try {
        return katex.renderToString(mathStr, {
            displayMode,
            throwOnError: false,
            output: "html",
        });
    } catch {
        // HTML 转义防止 XSS：畸形 LaTeX 可能包含恶意 HTML 标签
        const safe = escapeHtml(mathStr);
        return displayMode ? `\\[${safe}\\]` : `\\(${safe}\\)`;
    }
}

export function MathText({
    text,
    className,
    inlineOnly = false,
    as: Component = "span",
}: MathTextProps) {
    const segments = useMemo(() => parseMathText(text), [text]);

    // 如果没有任何公式标记，直接渲染文本
    const hasMath = segments.some((s) => s.type !== "text");
    if (!hasMath) {
        return <Component className={className}>{text}</Component>;
    }

    return (
        <Component className={cn("inline-math-container", className)}>
            {segments.map((segment, index) => {
                if (segment.type === "text") {
                    return <React.Fragment key={index}>{segment.content}</React.Fragment>;
                }

                const isBlock = segment.type === "block-math" && !inlineOnly;
                const html = renderKatexToString(segment.content, isBlock);

                if (isBlock) {
                    return (
                        <span
                            key={index}
                            className="block my-1 text-center overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden select-none"
                            dangerouslySetInnerHTML={{ __html: html }}
                        />
                    );
                }

                return (
                    <span
                        key={index}
                        className="inline-katex inline-block px-0.5 align-baseline select-none"
                        dangerouslySetInnerHTML={{ __html: html }}
                    />
                );
            })}
        </Component>
    );
}
