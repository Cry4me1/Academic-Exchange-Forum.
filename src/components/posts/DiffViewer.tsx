"use client";

import { useMemo } from "react";
import * as jsondiffpatch from "jsondiffpatch";

interface DiffViewerProps {
    oldContent: object;
    newContent: object;
    oldTitle?: string;
    newTitle?: string;
}

// 将 TipTap JSON 内容转换为纯文本用于对比
function extractTextFromTiptap(content: object): string {
    const lines: string[] = [];

    function traverse(node: any, depth = 0) {
        if (!node) return;

        if (node.type === "heading") {
            const text = node.content?.map((c: any) => c.text || "").join("") || "";
            const level = node.attrs?.level || 1;
            lines.push(`${"#".repeat(level)} ${text}`);
        } else if (node.type === "paragraph") {
            const text = node.content?.map((c: any) => c.text || "").join("") || "";
            lines.push(text);
        } else if (node.type === "bulletList" || node.type === "orderedList") {
            node.content?.forEach((item: any, index: number) => {
                const prefix = node.type === "orderedList" ? `${index + 1}. ` : "• ";
                const text =
                    item.content?.[0]?.content?.map((c: any) => c.text || "").join("") ||
                    "";
                lines.push(`${prefix}${text}`);
            });
        } else if (node.type === "codeBlock") {
            const text = node.content?.map((c: any) => c.text || "").join("") || "";
            lines.push("```");
            lines.push(text);
            lines.push("```");
        } else if (node.type === "blockquote") {
            node.content?.forEach((p: any) => {
                const text = p.content?.map((c: any) => c.text || "").join("") || "";
                lines.push(`> ${text}`);
            });
        } else if (node.content && Array.isArray(node.content)) {
            node.content.forEach((child: any) => traverse(child, depth + 1));
        }
    }

    traverse(content);
    return lines.join("\n");
}

// 简单的行级 Diff 实现
function computeLineDiff(
    oldText: string,
    newText: string
): { type: "same" | "add" | "remove"; content: string }[] {
    const oldLines = oldText.split("\n");
    const newLines = newText.split("\n");
    const result: { type: "same" | "add" | "remove"; content: string }[] = [];

    // 使用简单的最长公共子序列算法
    const lcs = getLCS(oldLines, newLines);
    let oldIdx = 0;
    let newIdx = 0;
    let lcsIdx = 0;

    while (oldIdx < oldLines.length || newIdx < newLines.length) {
        if (
            lcsIdx < lcs.length &&
            oldIdx < oldLines.length &&
            oldLines[oldIdx] === lcs[lcsIdx]
        ) {
            // 检查新行是否也匹配
            if (newIdx < newLines.length && newLines[newIdx] === lcs[lcsIdx]) {
                result.push({ type: "same", content: lcs[lcsIdx] });
                oldIdx++;
                newIdx++;
                lcsIdx++;
            } else if (newIdx < newLines.length) {
                result.push({ type: "add", content: newLines[newIdx] });
                newIdx++;
            }
        } else if (oldIdx < oldLines.length) {
            if (
                lcsIdx >= lcs.length ||
                oldLines[oldIdx] !== (lcs[lcsIdx] || undefined)
            ) {
                result.push({ type: "remove", content: oldLines[oldIdx] });
                oldIdx++;
            }
        } else if (newIdx < newLines.length) {
            result.push({ type: "add", content: newLines[newIdx] });
            newIdx++;
        } else {
            break;
        }
    }

    return result;
}

// 获取最长公共子序列
function getLCS(a: string[], b: string[]): string[] {
    const m = a.length;
    const n = b.length;
    const dp: number[][] = Array(m + 1)
        .fill(null)
        .map(() => Array(n + 1).fill(0));

    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            if (a[i - 1] === b[j - 1]) {
                dp[i][j] = dp[i - 1][j - 1] + 1;
            } else {
                dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
            }
        }
    }

    // 回溯构建 LCS
    const lcs: string[] = [];
    let i = m,
        j = n;
    while (i > 0 && j > 0) {
        if (a[i - 1] === b[j - 1]) {
            lcs.unshift(a[i - 1]);
            i--;
            j--;
        } else if (dp[i - 1][j] > dp[i][j - 1]) {
            i--;
        } else {
            j--;
        }
    }

    return lcs;
}

export function DiffViewer({
    oldContent,
    newContent,
    oldTitle,
    newTitle,
}: DiffViewerProps) {
    const diffLines = useMemo(() => {
        const oldText = extractTextFromTiptap(oldContent);
        const newText = extractTextFromTiptap(newContent);
        return computeLineDiff(oldText, newText);
    }, [oldContent, newContent]);

    const hasChanges = diffLines.some((line) => line.type !== "same");

    return (
        <div className="space-y-4">
            {/* 标题变化 */}
            {oldTitle !== newTitle && (
                <div className="p-4 bg-muted/50 rounded-lg border">
                    <h4 className="text-sm font-medium mb-3 text-muted-foreground">
                        标题变化
                    </h4>
                    <div className="space-y-2">
                        <div className="flex items-start gap-2">
                            <span className="shrink-0 w-6 h-6 rounded bg-red-500/20 text-red-600 flex items-center justify-center text-xs font-bold">
                                -
                            </span>
                            <p className="text-red-600 line-through">{oldTitle}</p>
                        </div>
                        <div className="flex items-start gap-2">
                            <span className="shrink-0 w-6 h-6 rounded bg-green-500/20 text-green-600 flex items-center justify-center text-xs font-bold">
                                +
                            </span>
                            <p className="text-green-600">{newTitle}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* 内容 Diff */}
            <div className="p-4 bg-muted/30 rounded-lg border">
                <h4 className="text-sm font-medium mb-3 text-muted-foreground">
                    内容变化
                </h4>

                {!hasChanges ? (
                    <p className="text-muted-foreground text-sm">内容无变化</p>
                ) : (
                    <div className="font-mono text-sm space-y-0.5 overflow-x-auto">
                        {diffLines.map((line, index) => (
                            <div
                                key={index}
                                className={`px-3 py-1 rounded-sm ${line.type === "remove"
                                        ? "bg-red-500/10 text-red-700 dark:text-red-400"
                                        : line.type === "add"
                                            ? "bg-green-500/10 text-green-700 dark:text-green-400"
                                            : "text-foreground/80"
                                    }`}
                            >
                                <span className="inline-block w-5 text-center mr-2 opacity-60">
                                    {line.type === "remove"
                                        ? "-"
                                        : line.type === "add"
                                            ? "+"
                                            : " "}
                                </span>
                                {line.content || " "}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
