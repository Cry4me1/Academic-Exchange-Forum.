"use client";

import { useMemo, useEffect, useRef } from "react";
import { generateHTML } from "@tiptap/html";
import { Node } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import katex from "katex";
import { common, createLowlight } from "lowlight";

const lowlight = createLowlight(common);

interface RichTextRendererProps {
    content: string | object;
    className?: string;
}

// 自定义 Mathematics Node 用于 HTML 生成
const MathematicsNode = Node.create({
    name: "mathematics",
    group: "inline",
    inline: true,
    atom: true,

    addAttributes() {
        return {
            latex: {
                default: "",
            },
            isBlock: {
                default: false,
            },
        };
    },

    parseHTML() {
        return [{ tag: 'span[data-type="mathematics"]' }];
    },

    renderHTML({ node }) {
        const latex = node.attrs.latex || "";
        const isBlock = node.attrs.isBlock === true;
        return [
            "span",
            {
                "data-type": "mathematics",
                "data-latex": latex,
                "data-block": isBlock ? "true" : "false",
                class: `math-formula ${isBlock ? "math-block" : "math-inline"}`,
            },
            latex,
        ];
    },
});

export function RichTextRenderer({ content, className = "" }: RichTextRendererProps) {
    const containerRef = useRef<HTMLDivElement>(null);

    // 生成 HTML
    const html = useMemo(() => {
        if (typeof content === "string") {
            return content;
        }

        try {
            return generateHTML(content as Parameters<typeof generateHTML>[0], [
                StarterKit,
                Image,
                MathematicsNode,
            ]);
        } catch (error) {
            console.error("Failed to generate HTML:", error);
            return "<p>内容加载失败</p>";
        }
    }, [content]);

    // 客户端渲染 LaTeX 公式
    useEffect(() => {
        if (!containerRef.current) return;

        // 渲染数学公式
        const mathElements = containerRef.current.querySelectorAll(".math-formula");
        mathElements.forEach((el) => {
            const latex = el.getAttribute("data-latex") || el.textContent;
            const isBlock = el.getAttribute("data-block") === "true";

            if (latex) {
                try {
                    katex.render(latex, el as HTMLElement, {
                        throwOnError: false,
                        displayMode: isBlock,
                        output: "html",
                    });
                } catch (error) {
                    el.innerHTML = `<span class="text-red-500">${latex}</span>`;
                    console.error("KaTeX render error:", error);
                }
            }
        });

        // 高亮代码块
        const codeBlocks = containerRef.current.querySelectorAll("pre code");
        codeBlocks.forEach((block) => {
            const language = block.className.match(/language-(\w+)/)?.[1] || "plaintext";
            const code = block.textContent || "";

            try {
                const highlighted = lowlight.highlight(language, code);
                // 转换 lowlight 输出为 HTML
                block.innerHTML = nodesToHtml(highlighted.children);
                block.classList.add("hljs");
            } catch {
                // 如果高亮失败，保持原样
            }
        });
    }, [html]);

    return (
        <div
            ref={containerRef}
            className={`rich-text-content prose prose-sm sm:prose lg:prose-lg dark:prose-invert max-w-none ${className}`}
            dangerouslySetInnerHTML={{ __html: html }}
        />
    );
}

// 将 lowlight 节点转换为 HTML 字符串
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function nodesToHtml(nodes: any[]): string {
    return nodes
        .map((node) => {
            if (node.type === "text") {
                return escapeHtml(node.value);
            }
            if (node.type === "element") {
                const className = node.properties?.className?.join(" ") || "";
                const children = nodesToHtml(node.children || []);
                return `<span class="${className}">${children}</span>`;
            }
            return "";
        })
        .join("");
}

function escapeHtml(text: string): string {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

export default RichTextRenderer;
