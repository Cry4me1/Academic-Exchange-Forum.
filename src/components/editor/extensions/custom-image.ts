import Image from "@tiptap/extension-image";

/**
 * Custom Image Extension
 * Extends the default Tiptap Image extension to ensure all attributes
 * (especially 'src') are properly saved when calling getJSON()
 */
export const CustomImage = Image.extend({
    name: "image",

    // Ensure the image is treated as a block-level node
    group: "block",

    // Make it an atom (single unit, not editable)
    atom: true,

    // Allow dragging in edit mode
    draggable: true,

    addAttributes() {
        // IMPORTANT: Inherit parent attributes first, then extend
        return {
            ...this.parent?.(),
            src: {
                default: null,
                parseHTML: (element: HTMLElement) => element.getAttribute("src"),
                renderHTML: (attributes: Record<string, unknown>) => {
                    if (!attributes.src) {
                        return {};
                    }
                    return { src: attributes.src };
                },
            },
            alt: {
                default: null,
                parseHTML: (element: HTMLElement) => element.getAttribute("alt"),
                renderHTML: (attributes: Record<string, unknown>) => {
                    if (!attributes.alt) {
                        return {};
                    }
                    return { alt: attributes.alt };
                },
            },
            title: {
                default: null,
                parseHTML: (element: HTMLElement) => element.getAttribute("title"),
                renderHTML: (attributes: Record<string, unknown>) => {
                    if (!attributes.title) {
                        return {};
                    }
                    return { title: attributes.title };
                },
            },
            width: {
                default: null,
                parseHTML: (element: HTMLElement) => element.getAttribute("width"),
                renderHTML: (attributes: Record<string, unknown>) => {
                    if (!attributes.width) {
                        return {};
                    }
                    return { width: attributes.width };
                },
            },
            height: {
                default: null,
                parseHTML: (element: HTMLElement) => element.getAttribute("height"),
                renderHTML: (attributes: Record<string, unknown>) => {
                    if (!attributes.height) {
                        return {};
                    }
                    return { height: attributes.height };
                },
            },
        };
    },

    parseHTML() {
        return [
            {
                tag: "img[src]",
            },
        ];
    },

    renderHTML({ HTMLAttributes }) {
        return ["img", { ...HTMLAttributes, class: "rounded-lg border shadow-sm" }];
    },
});

