"use client";

import { NodeViewContent, NodeViewProps, NodeViewWrapper } from "@tiptap/react";
import { Check, ChevronDown, Copy } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

// 常用编程语言列表
const LANGUAGES = [
    { value: "", label: "自动检测" },
    { value: "cpp", label: "C++" },
    { value: "c", label: "C" },
    { value: "python", label: "Python" },
    { value: "java", label: "Java" },
    { value: "javascript", label: "JavaScript" },
    { value: "typescript", label: "TypeScript" },
    { value: "go", label: "Go" },
    { value: "rust", label: "Rust" },
    { value: "sql", label: "SQL" },
    { value: "bash", label: "Bash" },
    { value: "html", label: "HTML" },
    { value: "css", label: "CSS" },
    { value: "json", label: "JSON" },
    { value: "yaml", label: "YAML" },
    { value: "markdown", label: "Markdown" },
    { value: "latex", label: "LaTeX" },
    { value: "plaintext", label: "纯文本" },
];

export function CodeBlockComponent({
    node,
    updateAttributes,
    extension,
}: NodeViewProps) {
    const [copied, setCopied] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const language = node.attrs.language || "";
    const currentLabel =
        LANGUAGES.find((l) => l.value === language)?.label ||
        language ||
        "自动检测";

    // 点击外部关闭下拉菜单
    useEffect(() => {
        if (!showDropdown) return;

        const handleClickOutside = (e: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(e.target as Node)
            ) {
                setShowDropdown(false);
            }
        };

        // 用 mousedown 而非 click，确保在 blur 之前就处理
        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, [showDropdown]);

    const handleCopy = useCallback(() => {
        const text = node.textContent;
        navigator.clipboard.writeText(text).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    }, [node]);

    const handleLanguageChange = useCallback(
        (lang: string) => {
            updateAttributes({ language: lang || null });
            setShowDropdown(false);
        },
        [updateAttributes]
    );

    const isEditable = extension.options.editable !== false;

    return (
        <NodeViewWrapper className="code-block-wrapper relative group my-5">
            {/* 顶部工具栏 */}
            <div className="code-block-toolbar flex items-center justify-between px-4 py-2 bg-[#21252b] rounded-t-xl border-b border-white/5 select-none">
                {/* 语言选择器 */}
                <div className="relative" ref={dropdownRef}>
                    {isEditable ? (
                        <>
                            <button
                                type="button"
                                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-200 transition-colors font-mono cursor-pointer"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setShowDropdown((prev) => !prev);
                                }}
                            >
                                <span>{currentLabel}</span>
                                <ChevronDown className="h-3 w-3" />
                            </button>
                            {showDropdown && (
                                <div
                                    className="absolute top-full left-0 mt-1 w-44 bg-[#1e1e1e] border border-white/10 rounded-lg shadow-2xl py-1 max-h-60 overflow-y-auto"
                                    style={{ zIndex: 9999 }}
                                >
                                    {LANGUAGES.map((lang) => (
                                        <button
                                            key={lang.value}
                                            type="button"
                                            className={`w-full text-left px-3 py-1.5 text-xs font-mono transition-colors cursor-pointer ${
                                                language === lang.value
                                                    ? "text-blue-400 bg-blue-500/10"
                                                    : "text-gray-300 hover:bg-white/5"
                                            }`}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                handleLanguageChange(
                                                    lang.value
                                                );
                                            }}
                                        >
                                            {lang.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </>
                    ) : (
                        <span className="text-xs text-gray-400 font-mono">
                            {currentLabel}
                        </span>
                    )}
                </div>

                {/* 复制按钮 */}
                <button
                    type="button"
                    className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-200 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                    onClick={handleCopy}
                >
                    {copied ? (
                        <>
                            <Check className="h-3.5 w-3.5 text-green-400" />
                            <span className="text-green-400">已复制</span>
                        </>
                    ) : (
                        <>
                            <Copy className="h-3.5 w-3.5" />
                            <span>复制</span>
                        </>
                    )}
                </button>
            </div>

            {/* 代码内容 */}
            <pre className="!rounded-t-none !mt-0 !border-t-0">
                <NodeViewContent as="code" />
            </pre>
        </NodeViewWrapper>
    );
}
