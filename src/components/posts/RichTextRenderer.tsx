"use client";

import { useMemo, useEffect, useLayoutEffect, useRef, useState, useCallback, useId } from "react";
import { generateHTML } from "@tiptap/html";
import { Node } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import katex from "katex";
import { common, createLowlight } from "lowlight";
import { X } from "lucide-react";

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

// 自定义 Mathematics Node 用于 HTML 生成 - 必须与编辑器扩展匹配
const MathematicsNode = Node.create({
    name: "mathematics",
    group: "inline",
    inline: true,
    atom: true,

    addAttributes() {
        return {
            latex: {
                default: "",
                parseHTML: (element: Element) => element.getAttribute("data-latex"),
                renderHTML: (attributes: { latex?: string }) => ({
                    "data-latex": attributes.latex || "",
                }),
            },
            isBlock: {
                default: false,
                parseHTML: (element: Element) => element.getAttribute("data-block") === "true",
                renderHTML: (attributes: { isBlock?: boolean }) => ({
                    "data-block": attributes.isBlock ? "true" : "false",
                }),
            },
        };
    },

    parseHTML() {
        return [{ tag: 'span[data-type="mathematics"]' }];
    },

    renderHTML({ node }) {
        const latex = node.attrs.latex || "";
        const isBlock = node.attrs.isBlock === true;
        // 使用 base64 编码避免特殊字符问题
        const encodedLatex = typeof btoa !== 'undefined' ? btoa(encodeURIComponent(latex)) : latex;
        return [
            "span",
            {
                "data-type": "mathematics",
                "data-latex": latex,
                "data-latex-encoded": encodedLatex,
                "data-block": isBlock ? "true" : "false",
                "data-pending": "true",
                class: `math-formula ${isBlock ? "math-block" : "math-inline"}`,
            },
            latex, // 显示原始 LaTeX 作为回退
        ];
    },
});

// 生成内容的唯一标识
function getContentKey(content: string | object): string {
    if (typeof content === "string") {
        return content.slice(0, 100);
    }
    return JSON.stringify(content).slice(0, 100);
}

// 转义 HTML
function escapeHtml(text: string): string {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
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

export function RichTextRenderer({ content, className = "", onHeadingsExtracted }: RichTextRendererProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [lightboxImage, setLightboxImage] = useState<string | null>(null);
    const [isRendered, setIsRendered] = useState(false);
    const uniqueId = useId();
    const contentKey = useMemo(() => getContentKey(content), [content]);

    // 将纯文本中的 LaTeX 语法转换为可渲染的元素
    const processLatexInHtml = useCallback((html: string): string => {
        // 处理块级公式 $$...$$
        html = html.replace(/\$\$([^$]+)\$\$/g, (_, latex) => {
            const trimmedLatex = latex.trim();
            // 对 data-latex 使用 base64 编码避免转义问题
            const encodedLatex = btoa(encodeURIComponent(trimmedLatex));
            return `<span class="math-formula math-block" data-latex-encoded="${encodedLatex}" data-block="true" data-pending="true">${escapeHtml(trimmedLatex)}</span>`;
        });
        // 处理行内公式 $...$ (确保不匹配已处理的)
        html = html.replace(/(?<!["\w])\$([^$\n]+)\$(?!["\w])/g, (match, latex) => {
            // 确保不是在属性中
            if (match.includes('data-')) return match;
            const trimmedLatex = latex.trim();
            const encodedLatex = btoa(encodeURIComponent(trimmedLatex));
            return `<span class="math-formula math-inline" data-latex-encoded="${encodedLatex}" data-block="false" data-pending="true">${escapeHtml(trimmedLatex)}</span>`;
        });
        return html;
    }, []);

    // 生成 HTML
    const html = useMemo(() => {
        let result: string;

        if (typeof content === "string") {
            result = content;
        } else {
            try {
                result = generateHTML(content as Parameters<typeof generateHTML>[0], [
                    StarterKit,
                    Image,
                    MathematicsNode,
                ]);
            } catch (error) {
                console.error("Failed to generate HTML:", error);
                result = "<p>内容加载失败</p>";
            }
        }

        // 处理纯文本中的 LaTeX 语法
        return processLatexInHtml(result);
    }, [content, processLatexInHtml]);

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
    // 使用 useLayoutEffect 确保在绘制前同步执行
    useLayoutEffect(() => {
        if (!containerRef.current) return;

        // 渲染数学公式 - 只处理待处理的元素
        const mathElements = containerRef.current.querySelectorAll(".math-formula[data-pending='true']");
        console.log("Found math elements to render:", mathElements.length);

        mathElements.forEach((el) => {
            // 尝试从 base64 编码获取 LaTeX
            const encodedLatex = el.getAttribute("data-latex-encoded");
            const rawLatex = el.getAttribute("data-latex");
            let latex: string | null = null;

            if (encodedLatex) {
                try {
                    latex = decodeURIComponent(atob(encodedLatex));
                } catch {
                    latex = el.textContent;
                }
            } else if (rawLatex) {
                latex = rawLatex;
            } else {
                latex = el.textContent;
            }

            const isBlock = el.getAttribute("data-block") === "true";

            if (latex) {
                try {
                    console.log("Rendering LaTeX:", latex);
                    katex.render(latex, el as HTMLElement, {
                        throwOnError: false,
                        displayMode: isBlock,
                        output: "html",
                    });
                    // 标记为已处理
                    el.removeAttribute("data-pending");
                    el.removeAttribute("data-latex-encoded");
                } catch (error) {
                    el.innerHTML = `<span class="text-red-500">${escapeHtml(latex)}</span>`;
                    console.error("KaTeX render error:", error);
                }
            }
        });

        // 高亮代码块并添加复制按钮
        const codeBlocks = containerRef.current.querySelectorAll("pre:not([data-highlighted])");
        codeBlocks.forEach((pre) => {
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
            pre.setAttribute("data-highlighted", "true");

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
        const images = containerRef.current.querySelectorAll("img:not([data-lightbox])");
        images.forEach((img) => {
            img.setAttribute("data-lightbox", "true");
            (img as HTMLImageElement).style.cursor = "zoom-in";
            (img as HTMLImageElement).onclick = () => {
                setLightboxImage((img as HTMLImageElement).src);
            };
        });

        // 提取标题用于目录
        if (onHeadingsExtracted) {
            const headings: HeadingItem[] = [];
            const headingElements = containerRef.current.querySelectorAll("h1, h2, h3");
            headingElements.forEach((el, index) => {
                const level = parseInt(el.tagName[1]);
                const text = el.textContent || "";
                const id = `heading-${uniqueId}-${index}`;
                el.id = id;
                headings.push({ id, text, level });
            });
            onHeadingsExtracted(headings);
        }

        setIsRendered(true);
    }, [html, copyToClipboard, onHeadingsExtracted, uniqueId]);

    // 关闭 Lightbox
    const closeLightbox = () => setLightboxImage(null);

    return (
        <>
            {/* KaTeX 样式 (CDN) */}
            <link
                rel="stylesheet"
                href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css"
                integrity="sha384-n8MVd4RsNIU0tAv4ct0nTaAbDJwPJzDEaqSD1odI+WdtXRGWt2kTvGFasHpSy3SV"
                crossOrigin="anonymous"
            />

            <div
                key={contentKey}
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

export default RichTextRenderer;
