import { Heading1, List, ImageIcon, Code, Sigma, TextQuote, CheckSquare, ListOrdered, Heading2, Heading3 } from "lucide-react";
import { CommandItemProps } from "./extensions/slash-command-extension";
import { onUpload } from "@/lib/image-upload";

export const suggestionItems: CommandItemProps[] = [
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
