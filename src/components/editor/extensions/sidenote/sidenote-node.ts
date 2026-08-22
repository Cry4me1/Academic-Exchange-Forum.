import { mergeAttributes, Node } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { SidenoteComponent } from "./SidenoteComponent";

export const SidenoteNode = Node.create({
    name: "sidenote",
    group: "inline",
    inline: true,
    atom: true,

    addAttributes() {
        return {
            noteNumber: {
                default: "1",
                parseHTML: (element) => element.getAttribute("data-note-number") || "1",
                renderHTML: (attributes) => ({
                    "data-note-number": attributes.noteNumber,
                }),
            },
            content: {
                default: "补充学术注记内容...",
                parseHTML: (element) => element.getAttribute("data-note-content") || "",
                renderHTML: (attributes) => ({
                    "data-note-content": attributes.content,
                }),
            },
        };
    },

    parseHTML() {
        return [{ tag: 'span[data-type="sidenote"]' }];
    },

    renderHTML({ HTMLAttributes }) {
        return [
            "span",
            mergeAttributes(HTMLAttributes, { "data-type": "sidenote" }),
        ];
    },

    addNodeView() {
        return ReactNodeViewRenderer(SidenoteComponent);
    },
});

export default SidenoteNode;
