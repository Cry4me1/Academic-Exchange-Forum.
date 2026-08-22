import { mergeAttributes, Node } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { CrossRefComponent } from "./CrossRefComponent";

export const CrossRefNode = Node.create({
    name: "crossRef",
    group: "inline",
    inline: true,
    atom: true,

    addAttributes() {
        return {
            targetId: {
                default: "",
                parseHTML: (element) => element.getAttribute("data-target-id") || "",
                renderHTML: (attributes) => ({
                    "data-target-id": attributes.targetId,
                }),
            },
            label: {
                default: "引用",
                parseHTML: (element) => element.getAttribute("data-label") || "引用",
                renderHTML: (attributes) => ({
                    "data-label": attributes.label,
                }),
            },
            refType: {
                default: "theorem",
                parseHTML: (element) => element.getAttribute("data-ref-type") || "theorem",
                renderHTML: (attributes) => ({
                    "data-ref-type": attributes.refType,
                }),
            },
        };
    },

    parseHTML() {
        return [{ tag: 'span[data-type="cross-ref"]' }];
    },

    renderHTML({ HTMLAttributes }) {
        return [
            "span",
            mergeAttributes(HTMLAttributes, { "data-type": "cross-ref" }),
        ];
    },

    addNodeView() {
        return ReactNodeViewRenderer(CrossRefComponent);
    },
});

export default CrossRefNode;
