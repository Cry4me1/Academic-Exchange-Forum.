import type { JSONContent } from "novel";

/**
 * 从 JSONContent (Tiptap/Novel 编辑器格式) 递归提取纯文本
 * 保留段落换行，代码块前后添加 ``` 标记以保留格式上下文
 */
export function extractTextFromJSON(content: JSONContent): string {
    const parts: string[] = [];

    function traverse(node: JSONContent) {
        // 文本节点
        if (node.type === "text" && node.text) {
            parts.push(node.text);
            return;
        }

        // 代码块保留格式
        if (node.type === "codeBlock") {
            const lang = (node.attrs?.language as string) || "";
            const code =
                node.content?.map((n) => n.text || "").join("") || "";
            parts.push(`\n\`\`\`${lang}\n${code}\n\`\`\`\n`);
            return;
        }

        // 数学公式保留 LaTeX
        if (node.type === "math" || node.type === "mathBlock") {
            const latex = (node.attrs?.latex as string) || "";
            if (latex) {
                parts.push(node.type === "mathBlock" ? `\n$$${latex}$$\n` : `$${latex}$`);
            }
            return;
        }

        // 图片跳过（审稿不处理图片）
        if (node.type === "image") {
            parts.push("\n[图片]\n");
            return;
        }

        // 段落/标题等块级元素后加换行
        if (
            [
                "paragraph",
                "heading",
                "blockquote",
                "listItem",
                "bulletList",
                "orderedList",
            ].includes(node.type || "")
        ) {
            // 标题前加标记
            if (node.type === "heading") {
                const level = (node.attrs?.level as number) || 1;
                parts.push("\n" + "#".repeat(level) + " ");
            }

            if (node.type === "blockquote") {
                parts.push("\n> ");
            }

            node.content?.forEach(traverse);
            parts.push("\n");
            return;
        }

        // 递归子节点
        node.content?.forEach(traverse);
    }

    traverse(content);
    return parts.join("").trim();
}

/**
 * 截断文本到指定字符数，确保不会在单词中间截断
 */
export function truncateText(text: string, maxLength: number = 8000): string {
    if (text.length <= maxLength) return text;

    const truncated = text.slice(0, maxLength);
    // 尝试在最后一个换行符处截断
    const lastNewline = truncated.lastIndexOf("\n");
    const cutPoint = lastNewline > maxLength * 0.8 ? lastNewline : maxLength;

    return (
        truncated.slice(0, cutPoint) +
        "\n\n[注：原文过长，以上为前 " +
        cutPoint +
        " 字符的内容]"
    );
}
