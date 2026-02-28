import { onUpload } from "@/lib/image-upload";
import { CheckSquare, Code, Heading1, Heading2, Heading3, ImageIcon, List, ListOrdered, MessageSquarePlus, Sigma, Sparkles, TextQuote, Workflow } from "lucide-react";
import { CommandItemProps } from "./extensions/slash-command-extension";

export const suggestionItems: CommandItemProps[] = [
    {
        title: "继续写作",
        description: "让 AI 继续写一段",
        searchTerms: ["continue", "ai", "writing", "generate"],
        icon: <Sparkles size={18} />,
        command: ({ editor, range }) => {
            // 我们不能直接在这里调用 complete，因为 slash-command 本身不包含 AI 状态。
            // 通常做法：模拟输入 "++" 或其他触发 AI 的快捷键，或者通过 event bus。
            // 但既然要求实现，我们可能需要 hack 一下：
            // 简单方案：插入一个特殊占位符，然后让 NovelEditor 监听并触发 AI。
            // 或者：直接利用 AISelector 的逻辑：如果选中文本，AISelector 会出现。
            // 这里我们可能只需把斜杠命令删除，然后让 AI Selector 弹出？
            // 实际上 Novel 的 AI Selector 是基于选区弹出的。

            // 更好的方案：模拟一个空格输入触发 "continue"？
            // 这里我们简单地删除斜杠文本，保留光标。用户需要手动点 AI？
            // 不，用户希望直接触发。
            // 让我们观察 ai-selector.tsx：它监听 selection。
            // 如果我们想要 "/继续写作" 直接触发 AI continue，我们需要 access 到 complete 函数。
            // 这在静态列表里很难。

            // 替代方案：不做这个，或者仅作为 UI 展示（用户可能疑惑为什么没反应）。
            // 许多编辑器实现方式是 slash command 是 editor 的一部分，可以访问 context。
            // 但这里的 suggestionItems 是静态导出的。

            // 妥协方案：删除 range，并聚焦。用户需要手动打开 AI 菜单（如果选中了文本）
            // 或者我们在此处不做 "继续写作" 的具体 AI 调用，留给后续集成。
            // 
            // 实际上，Novel 文档或示例中，ask ai 通常是一个独立于 slash command 的功能（空格键触发）。
            // 但用户想要在 slash command 里有。

            editor.chain().focus().deleteRange(range).run();
            // 触发 AI 的一种方式是发送自定义事件
            window.dispatchEvent(new CustomEvent("trigger-ai-continue"));
        },
    },
    {
        title: "询问 AI",
        description: "输入指令让 AI 生成内容",
        searchTerms: ["ask", "ai", "question", "generate"],
        icon: <MessageSquarePlus size={18} />,
        command: ({ editor, range }) => {
            editor.chain().focus().deleteRange(range).run();
            window.dispatchEvent(new CustomEvent("trigger-ai-ask"));
        },
    },
    {
        title: "一级标题",
        description: "大标题",
        searchTerms: ["title", "big", "large", "heading", "h1"],
        icon: <Heading1 size={18} />,
        command: ({ editor, range }) => {
            editor.chain().focus().deleteRange(range).setNode("heading", { level: 1 }).run();
        },
    },
    {
        title: "二级标题",
        description: "中标题",
        searchTerms: ["subtitle", "medium", "heading", "h2"],
        icon: <Heading2 size={18} />,
        command: ({ editor, range }) => {
            editor.chain().focus().deleteRange(range).setNode("heading", { level: 2 }).run();
        },
    },
    {
        title: "三级标题",
        description: "小标题",
        searchTerms: ["subtitle", "small", "heading", "h3"],
        icon: <Heading3 size={18} />,
        command: ({ editor, range }) => {
            editor.chain().focus().deleteRange(range).setNode("heading", { level: 3 }).run();
        },
    },
    {
        title: "无序列表",
        description: "创建一个简单的无序列表",
        searchTerms: ["bullet", "list", "unordered", "point"],
        icon: <List size={18} />,
        command: ({ editor, range }) => {
            editor.chain().focus().deleteRange(range).toggleBulletList().run();
        },
    },
    {
        title: "有序列表",
        description: "创建一个有序列表",
        searchTerms: ["numbered", "list", "ordered", "point"],
        icon: <ListOrdered size={18} />,
        command: ({ editor, range }) => {
            editor.chain().focus().deleteRange(range).toggleOrderedList().run();
        },
    },
    {
        title: "待办列表",
        description: "跟踪任务列表",
        searchTerms: ["todo", "task", "list", "check", "checkbox"],
        icon: <CheckSquare size={18} />,
        command: ({ editor, range }) => {
            editor.chain().focus().deleteRange(range).toggleTaskList().run();
        },
    },
    {
        title: "引用",
        description: "引用一段文字",
        searchTerms: ["quote", "blockquote"],
        icon: <TextQuote size={18} />,
        command: ({ editor, range }) => {
            editor.chain().focus().deleteRange(range).toggleBlockquote().run();
        },
    },
    {
        title: "代码块",
        description: "插入代码片段",
        searchTerms: ["code", "block", "snippet"],
        icon: <Code size={18} />,
        command: ({ editor, range }) => {
            editor.chain().focus().deleteRange(range).toggleCodeBlock().run();
        },
    },
    {
        title: "流程图",
        description: "插入 Mermaid 流程图 / 时序图 / 类图",
        searchTerms: ["flowchart", "mermaid", "diagram", "sequence", "流程图", "时序图"],
        icon: <Workflow size={18} />,
        command: ({ editor, range }) => {
            editor
                .chain()
                .focus()
                .deleteRange(range)
                .insertContent({
                    type: "mermaidBlock",
                    attrs: {
                        content: "graph TD\n    A[开始] --> B{判断}\n    B -->|是| C[执行]\n    B -->|否| D[结束]",
                    },
                })
                .run();
        },
    },
    {
        title: "数学公式",
        description: "插入 LaTeX 公式（选中后点击工具栏 Σ 渲染）",
        searchTerms: ["math", "latex", "formula", "equation"],
        icon: <Sigma size={18} />,
        command: ({ editor, range }) => {
            // Delete the slash command range and insert example LaTeX wrapped in $
            editor.chain()
                .focus()
                .deleteRange(range)
                .insertContent("$E = mc^2$")
                .run();
        },
    },
    {
        title: "上传图片",
        description: "从设备上传图片（最大 2MB）",
        searchTerms: ["image", "photo", "picture", "upload"],
        icon: <ImageIcon size={18} />,
        command: ({ editor, range }) => {
            editor.chain().focus().deleteRange(range).run();

            const input = document.createElement("input");
            input.type = "file";
            input.accept = "image/*";
            input.onchange = async () => {
                if (input.files?.length) {
                    const file = input.files[0];
                    try {
                        // Upload and get URL
                        const url = await onUpload(file);
                        // Insert image into editor
                        if (url) {
                            editor.chain().focus().setImage({ src: url }).run();
                        }
                    } catch (error) {
                        console.error("Failed to upload image:", error);
                    }
                }
            };
            input.click();
        },
    },
];
