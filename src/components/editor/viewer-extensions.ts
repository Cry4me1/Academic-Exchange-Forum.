import { Color } from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import { Mathematics } from "@tiptap/extension-mathematics";
import { TextStyle } from "@tiptap/extension-text-style";
import { all, createLowlight } from "lowlight";
import {
    CodeBlockLowlight,
    HorizontalRule,
    StarterKit,
    TaskItem,
    TaskList,
    TiptapLink,
} from "novel";
import { CustomImage } from "./extensions/custom-image";
import { MermaidBlock } from "./extensions/mermaid-block";

// Explicitly create lowlight instance
const lowlight = createLowlight(all);

const codeBlockLowlight = CodeBlockLowlight.configure({
    lowlight,
});

// Configure Mathematics extension (v2 uses regex decorations)
const mathExtension = Mathematics.configure({
    // Standard dollar sign syntax for inline math: $E=mc^2$
    regex: /\$([^\$]+)\$/gi,
});

/**
 * Viewer-specific extensions (readonly, no slash commands or drag handles)
 */
export const viewerExtensions: any[] = [
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
        dropcursor: false,
        gapcursor: false,
    }),
    // Core extensions
    TiptapLink.configure({
        openOnClick: true, // Allow clicking links in viewer
    }),
    CustomImage,
    TaskList,
    TaskItem.configure({
        nested: true,
    }),
    HorizontalRule,
    // Custom extensions
    codeBlockLowlight,
    // Math extension (v2)
    mathExtension,
    // Mermaid flowchart block
    MermaidBlock,
    // Text styling extensions for color
    TextStyle,
    Color,
    Highlight.configure({
        multicolor: true,
    }),
];
