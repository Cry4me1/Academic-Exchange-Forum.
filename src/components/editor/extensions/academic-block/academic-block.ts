import { mergeAttributes, Node } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { AcademicBlockComponent } from "./AcademicBlockComponent";

export type AcademicType =
    | "theorem"
    | "lemma"
    | "definition"
    | "proposition"
    | "corollary"
    | "proof"
    | "example"
    | "remark";

export const ACADEMIC_TYPE_CONFIG: Record<
    AcademicType,
    {
        label: string;
        enLabel: string;
        prefix: string;
        colorTheme: string;
        borderClass: string;
        bgClass: string;
        badgeBg: string;
        badgeText: string;
        defaultTitle: string;
    }
> = {
    theorem: {
        label: "定理",
        enLabel: "Theorem",
        prefix: "Thm",
        colorTheme: "blue",
        borderClass: "border-blue-500/50 dark:border-blue-400/40",
        bgClass: "bg-blue-50/50 dark:bg-blue-950/20",
        badgeBg: "bg-blue-600 text-white dark:bg-blue-500",
        badgeText: "text-blue-700 dark:text-blue-300",
        defaultTitle: "",
    },
    lemma: {
        label: "引理",
        enLabel: "Lemma",
        prefix: "Lem",
        colorTheme: "cyan",
        borderClass: "border-cyan-500/50 dark:border-cyan-400/40",
        bgClass: "bg-cyan-50/50 dark:bg-cyan-950/20",
        badgeBg: "bg-cyan-600 text-white dark:bg-cyan-500",
        badgeText: "text-cyan-700 dark:text-cyan-300",
        defaultTitle: "",
    },
    definition: {
        label: "定义",
        enLabel: "Definition",
        prefix: "Def",
        colorTheme: "emerald",
        borderClass: "border-emerald-500/50 dark:border-emerald-400/40",
        bgClass: "bg-emerald-50/50 dark:bg-emerald-950/20",
        badgeBg: "bg-emerald-600 text-white dark:bg-emerald-500",
        badgeText: "text-emerald-700 dark:text-emerald-300",
        defaultTitle: "",
    },
    proposition: {
        label: "命题",
        enLabel: "Proposition",
        prefix: "Prop",
        colorTheme: "purple",
        borderClass: "border-purple-500/50 dark:border-purple-400/40",
        bgClass: "bg-purple-50/50 dark:bg-purple-950/20",
        badgeBg: "bg-purple-600 text-white dark:bg-purple-500",
        badgeText: "text-purple-700 dark:text-purple-300",
        defaultTitle: "",
    },
    corollary: {
        label: "推论",
        enLabel: "Corollary",
        prefix: "Cor",
        colorTheme: "amber",
        borderClass: "border-amber-500/50 dark:border-amber-400/40",
        bgClass: "bg-amber-50/50 dark:bg-amber-950/20",
        badgeBg: "bg-amber-600 text-white dark:bg-amber-500",
        badgeText: "text-amber-700 dark:text-amber-300",
        defaultTitle: "",
    },
    proof: {
        label: "证明",
        enLabel: "Proof",
        prefix: "Pf",
        colorTheme: "slate",
        borderClass: "border-slate-400/50 dark:border-slate-600/50 border-dashed",
        bgClass: "bg-slate-50/60 dark:bg-slate-900/30",
        badgeBg: "bg-slate-700 text-white dark:bg-slate-600",
        badgeText: "text-slate-700 dark:text-slate-300",
        defaultTitle: "",
    },
    example: {
        label: "例题",
        enLabel: "Example",
        prefix: "Ex",
        colorTheme: "indigo",
        borderClass: "border-indigo-500/50 dark:border-indigo-400/40",
        bgClass: "bg-indigo-50/50 dark:bg-indigo-950/20",
        badgeBg: "bg-indigo-600 text-white dark:bg-indigo-500",
        badgeText: "text-indigo-700 dark:text-indigo-300",
        defaultTitle: "",
    },
    remark: {
        label: "注记",
        enLabel: "Remark",
        prefix: "Rem",
        colorTheme: "orange",
        borderClass: "border-orange-500/50 dark:border-orange-400/40",
        bgClass: "bg-orange-50/50 dark:bg-orange-950/20",
        badgeBg: "bg-orange-600 text-white dark:bg-orange-500",
        badgeText: "text-orange-700 dark:text-orange-300",
        defaultTitle: "",
    },
};

export const AcademicBlock = Node.create({
    name: "academicBlock",
    group: "block",
    content: "block+",
    defining: true,

    addAttributes() {
        return {
            academicType: {
                default: "theorem" as AcademicType,
                parseHTML: (element) =>
                    (element.getAttribute("data-academic-type") as AcademicType) || "theorem",
                renderHTML: (attributes) => ({
                    "data-academic-type": attributes.academicType,
                }),
            },
            title: {
                default: "",
                parseHTML: (element) => element.getAttribute("data-academic-title") || "",
                renderHTML: (attributes) => ({
                    "data-academic-title": attributes.title,
                }),
            },
            number: {
                default: "",
                parseHTML: (element) => element.getAttribute("data-academic-number") || "",
                renderHTML: (attributes) => ({
                    "data-academic-number": attributes.number,
                }),
            },
            isFolded: {
                default: false,
                parseHTML: (element) => element.getAttribute("data-academic-folded") === "true",
                renderHTML: (attributes) => ({
                    "data-academic-folded": attributes.isFolded ? "true" : "false",
                }),
            },
            academicId: {
                default: "",
                parseHTML: (element) => element.getAttribute("data-academic-id") || "",
                renderHTML: (attributes) => ({
                    "data-academic-id": attributes.academicId,
                    id: attributes.academicId || undefined,
                }),
            },
        };
    },

    parseHTML() {
        return [{ tag: 'div[data-type="academic-block"]' }];
    },

    renderHTML({ HTMLAttributes }) {
        return [
            "div",
            mergeAttributes(HTMLAttributes, { "data-type": "academic-block" }),
            0,
        ];
    },

    addNodeView() {
        return ReactNodeViewRenderer(AcademicBlockComponent);
    },
});

export default AcademicBlock;
