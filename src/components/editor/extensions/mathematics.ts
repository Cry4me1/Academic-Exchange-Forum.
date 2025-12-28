import { Node, mergeAttributes, InputRule } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import MathematicsNodeView from "@/components/editor/MathematicsNodeView";

export interface MathematicsOptions {
    HTMLAttributes: Record<string, unknown>;
}

declare module "@tiptap/core" {
    interface Commands<ReturnType> {
        mathematics: {
            /**
             * 插入数学公式
             */
            setMathematics: (latex: string, isBlock?: boolean) => ReturnType;
        };
    }
}

export const Mathematics = Node.create<MathematicsOptions>({
    name: "mathematics",

    group: "inline",

    inline: true,

    atom: true,

    addOptions() {
        return {
            HTMLAttributes: {},
        };
    },

    addAttributes() {
        return {
            latex: {
                default: "",
                parseHTML: (element) => element.getAttribute("data-latex"),
                renderHTML: (attributes) => ({
                    "data-latex": attributes.latex,
                }),
            },
            isBlock: {
                default: false,
                parseHTML: (element) => element.getAttribute("data-block") === "true",
                renderHTML: (attributes) => ({
                    "data-block": attributes.isBlock ? "true" : "false",
                }),
            },
        };
    },

    parseHTML() {
        return [
            {
                tag: 'span[data-type="mathematics"]',
            },
        ];
    },

    renderHTML({ HTMLAttributes }) {
        return [
            "span",
            mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
                "data-type": "mathematics",
            }),
        ];
    },

    addNodeView() {
        return ReactNodeViewRenderer(MathematicsNodeView);
    },

    addCommands() {
        return {
            setMathematics:
                (latex: string, isBlock = false) =>
                    ({ commands }) => {
                        return commands.insertContent({
                            type: this.name,
                            attrs: { latex, isBlock },
                        });
                    },
        };
    },

    addInputRules() {
        // 块级公式: $$...$$
        const blockMathRule = new InputRule({
            find: /\$\$([^$]+)\$\$$/,
            handler: ({ state, range, match }) => {
                const latex = match[1];
                const { tr } = state;

                if (latex) {
                    const node = this.type.create({ latex, isBlock: true });
                    tr.replaceWith(range.from, range.to, node);
                }
            },
        });

        // 行内公式: $...$
        const inlineMathRule = new InputRule({
            find: /(?:^|[^$])\$([^$\s][^$]*[^$\s]|[^$\s])\$$/,
            handler: ({ state, range, match }) => {
                const latex = match[1];
                const { tr } = state;

                // 调整范围，跳过可能的前导字符
                const from = match[0].startsWith("$") ? range.from : range.from + 1;

                if (latex) {
                    const node = this.type.create({ latex, isBlock: false });
                    tr.replaceWith(from, range.to, node);
                }
            },
        });

        return [blockMathRule, inlineMathRule];
    },
});

export default Mathematics;

