import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCursor from "@tiptap/extension-collaboration-cursor";
import { Color } from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import { Mathematics } from "@tiptap/extension-mathematics";
import { Placeholder } from "@tiptap/extension-placeholder";
import { TaskItem } from "@tiptap/extension-task-item";
import { TaskList } from "@tiptap/extension-task-list";
import { TextStyle } from "@tiptap/extension-text-style";
import StarterKit from "@tiptap/starter-kit";
import type * as Y from "yjs";

/**
 * 创建带有 Yjs 协作支持的 Tiptap 扩展列表
 * 支持 CollaborationCursor（通过 SupabaseAwarenessProvider）
 */
export function createCollabExtensions(
    ydoc: Y.Doc,
    awarenessProvider: { awareness: any },
    currentUser: { name: string; color: string }
) {
    return [
        StarterKit.configure({
            history: false,
            bulletList: {
                HTMLAttributes: { class: "list-disc list-outside leading-3 -mt-2" },
            },
            orderedList: {
                HTMLAttributes: { class: "list-decimal list-outside leading-3 -mt-2" },
            },
            listItem: {
                HTMLAttributes: { class: "leading-normal -mb-2" },
            },
            blockquote: {
                HTMLAttributes: { class: "border-l-4 border-primary" },
            },
            code: {
                HTMLAttributes: {
                    class: "rounded-md bg-muted px-1.5 py-1 font-mono font-medium",
                    spellcheck: "false",
                },
            },
            dropcursor: { color: "#DBEAFE", width: 4 },
            gapcursor: false,
        }),
        TaskList,
        TaskItem.configure({ nested: true }),
        Mathematics.configure({ regex: /\$([^\$]+)\$/gi }),
        Placeholder.configure({
            placeholder: "开始写协作笔记...",
            includeChildren: true,
        }),
        TextStyle,
        Color,
        Highlight.configure({ multicolor: true }),

        // Yjs 协作
        Collaboration.configure({
            document: ydoc,
        }),

        // 协作光标 - 必须传入 user 属性，否则默认 name 为 null
        CollaborationCursor.configure({
            provider: awarenessProvider,
            user: currentUser,
            render: (user: { name: string; color: string }) => {
                const cursor = document.createElement("span");
                cursor.classList.add("collaboration-cursor__caret");
                cursor.style.borderColor = user.color;

                const label = document.createElement("div");
                label.classList.add("collaboration-cursor__label");
                label.style.backgroundColor = user.color;
                label.textContent = user.name;
                cursor.appendChild(label);

                return cursor;
            },
        }),
    ];
}
