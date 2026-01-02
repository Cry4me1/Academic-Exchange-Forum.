import {
    StarterKit,
    TiptapLink,
    TiptapImage,
    TaskList,
    TaskItem,
    HorizontalRule,
    Placeholder,
    CodeBlockLowlight,
} from "novel";
import { common, createLowlight } from "lowlight";
import { Command, renderItems } from "./extensions/slash-command-extension";
import { suggestionItems } from "./slash-command";
import GlobalDragHandle from "tiptap-extension-global-drag-handle";
import AutoJoiner from "tiptap-extension-auto-joiner";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import { Mathematics } from "@tiptap/extension-mathematics";

// Explicitly create lowlight instance
const lowlight = createLowlight(common);

const codeBlockLowlight = CodeBlockLowlight.configure({
    lowlight,
});

// Configure Mathematics extension (v2 uses regex decorations)
const mathExtension = Mathematics.configure({
    // Optional: customize regex if needed, default usually handles $...$
});

// We prefer constructing the list from what Novel exposes + our adds
export const defaultExtensions: any[] = [
    StarterKit.configure({
        bulletList: {
            HTMLAttributes: {
                class: "list-disc list-outside leading-3 -mt-2",
            },
        },
        orderedList: {
            HTMLAttributes: {
                class: "list-decimal list-outside leading-3 -mt-2",
            },
        },
        listItem: {
            HTMLAttributes: {
                class: "leading-normal -mb-2",
            },
        },
        blockquote: {
            HTMLAttributes: {
                class: "border-l-4 border-primary",
            },
        },
        codeBlock: false,
        code: {
            HTMLAttributes: {
                class: "rounded-md bg-muted px-1.5 py-1 font-mono font-medium",
                spellcheck: "false",
            },
        },
        horizontalRule: false,
        dropcursor: {
            color: "#DBEAFE",
            width: 4,
        },
        gapcursor: false,
    }),
    // Core extensions
    TiptapLink.configure({
        openOnClick: false,
    }),
    TiptapImage.configure({
        allowBase64: true,
        HTMLAttributes: {
            class: "rounded-lg border shadow-sm",
        },
    }),
    TaskList,
    TaskItem.configure({
        nested: true,
    }),
    HorizontalRule,
    Placeholder.configure({
        placeholder: "输入 '/' 唤起命令...",
        includeChildren: true,
    }),
    // Custom extensions
    codeBlockLowlight,
    // Math extension (v2)
    mathExtension,
    // Slash command extension
    Command.configure({
        suggestion: {
            items: ({ query }: { query: string }) =>
                suggestionItems.filter((item) =>
                    item.title.toLowerCase().includes(query.toLowerCase()) ||
                    item.searchTerms.some((term) => term.includes(query.toLowerCase()))
                ),
            render: renderItems,
        },
    }),
    // Global drag handle - Notion-style block drag and drop
    GlobalDragHandle.configure({
        dragHandleWidth: 20,
        scrollTreshold: 100,
    }),
    // Auto joiner - fixes list joining when dragging
    AutoJoiner.configure({
        elementsToJoin: ["bulletList", "orderedList"],
    }),
    // Text styling extensions for color
    TextStyle,
    Color,
    Highlight.configure({
        multicolor: true,
    }),
];
