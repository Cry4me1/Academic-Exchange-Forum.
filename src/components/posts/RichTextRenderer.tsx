"use client";

import { useMemo, useEffect, useRef, useState, useCallback } from "react";
import { generateHTML } from "@tiptap/html";
import { Node } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import katex from "katex";
import { common, createLowlight } from "lowlight";
import { Check, Copy, X } from "lucide-react";

const lowlight = createLowlight(common);

interface RichTextRendererProps {
    content: string | object;
    className?: string;
    onHeadingsExtracted?: (headings: HeadingItem[]) => void;
}

export interface HeadingItem {
    id: string;
    text: string;
    level: number;
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

export function RichTextRenderer({ content, className = "", onHeadingsExtracted }: RichTextRendererProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [lightboxImage, setLightboxImage] = useState<string | null>(null);

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

    // 复制代码到剪贴板
    const copyToClipboard = useCallback(async (code: string, button: HTMLButtonElement) => {
        try {
            await navigator.clipboard.writeText(code);
            button.classList.add("copied");
            const icon = button.querySelector(".copy-icon");
            const checkIcon = button.querySelector(".check-icon");
            if (icon) icon.classList.add("hidden");
            if (checkIcon) checkIcon.classList.remove("hidden");

            setTimeout(() => {
                button.classList.remove("copied");
                if (icon) icon.classList.remove("hidden");
                if (checkIcon) checkIcon.classList.add("hidden");
            }, 2000);
        } catch (err) {
            console.error("Failed to copy:", err);
        }
    }, []);

    // 客户端渲染 LaTeX 公式、代码高亮、提取标题
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

        // 高亮代码块并添加复制按钮
        const codeBlocks = containerRef.current.querySelectorAll("pre");
        codeBlocks.forEach((pre, index) => {
            const code = pre.querySelector("code");
            if (!code) return;

            const language = code.className.match(/language-(\w+)/)?.[1] || "plaintext";
            const codeText = code.textContent || "";

            try {
                const highlighted = lowlight.highlight(language, codeText);
                code.innerHTML = nodesToHtml(highlighted.children);
                code.classList.add("hljs");
            } catch {
                // 如果高亮失败，保持原样
            }

            // 添加代码块容器样式
            pre.classList.add("code-block-container");
            pre.setAttribute("data-language", language);

            // 添加复制按钮（如果还没有）
            if (!pre.querySelector(".copy-button")) {
                const copyBtn = document.createElement("button");
                copyBtn.className = "copy-button";
                copyBtn.innerHTML = `
                    <svg class="copy-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
                        <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
                    </svg>
                    <svg class="check-icon hidden" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                    </svg>
                `;
                copyBtn.title = "复制代码";
                copyBtn.onclick = (e) => {
                    e.preventDefault();
                    copyToClipboard(codeText, copyBtn);
                };
                pre.appendChild(copyBtn);
            }
        });

        // 为图片添加点击事件（Lightbox）
        const images = containerRef.current.querySelectorAll("img");
        images.forEach((img) => {
            img.style.cursor = "zoom-in";
            img.onclick = () => {
                setLightboxImage(img.src);
            };
        });

        // 提取标题用于目录
        if (onHeadingsExtracted) {
            const headings: HeadingItem[] = [];
            const headingElements = containerRef.current.querySelectorAll("h1, h2, h3");
            headingElements.forEach((el, index) => {
                const level = parseInt(el.tagName[1]);
                const text = el.textContent || "";
                const id = `heading-${index}`;
                el.id = id;
                headings.push({ id, text, level });
            });
            onHeadingsExtracted(headings);
        }
    }, [html, copyToClipboard, onHeadingsExtracted]);

    // 关闭 Lightbox
    const closeLightbox = () => setLightboxImage(null);

    return (
        <>
            <div
                ref={containerRef}
                className={`rich-text-content prose prose-sm sm:prose lg:prose-lg dark:prose-invert max-w-none ${className}`}
                dangerouslySetInnerHTML={{ __html: html }}
            />

            {/* Lightbox 弹窗 */}
            {lightboxImage && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
                    onClick={closeLightbox}
                >
                    <button
                        className="absolute top-4 right-4 p-2 text-white/80 hover:text-white transition-colors"
                        onClick={closeLightbox}
                    >
                        <X className="h-8 w-8" />
                    </button>
                    <img
                        src={lightboxImage}
                        alt="放大预览"
                        className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
        </>
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
