import { mergeAttributes, Node } from "@tiptap/core";
import Suggestion, { SuggestionOptions } from "@tiptap/suggestion";
import { ReactRenderer } from "@tiptap/react";
import { ReactNodeViewRenderer, NodeViewWrapper } from "@tiptap/react";
import tippy, { Instance } from "tippy.js";
import {
    forwardRef,
    useEffect,
    useImperativeHandle,
    useState,
    useCallback,
} from "react";
import { cn } from "@/lib/utils";
import { PluginKey } from "prosemirror-state";

// ============================================================
// 1. WikiLink Suggestion Plugin Key
// ============================================================
const wikiLinkPluginKey = new PluginKey("wikiLink");

// ============================================================
// 2. WikiLink Search Result Interface
// ============================================================
export interface WikiLinkItem {
    postId: string;
    title: string;
}

// ============================================================
// 3. WikiLink Inline Node
// ============================================================
export const WikiLink = Node.create({
    name: "wikiLink",
    group: "inline",
    inline: true,
    atom: true,

    addAttributes() {
        return {
            postId: {
                default: null,
                parseHTML: (element) => element.getAttribute("data-post-id"),
                renderHTML: (attributes) => ({
                    "data-post-id": attributes.postId,
                }),
            },
            title: {
                default: null,
                parseHTML: (element) => element.textContent?.trim() ?? "",
                renderHTML: () => ({}),
            },
        };
    },

    parseHTML() {
        return [
            {
                tag: "a[data-wiki-link]",
            },
        ];
    },

    renderHTML({ node, HTMLAttributes }) {
        return [
            "a",
            mergeAttributes(HTMLAttributes, {
                "data-wiki-link": "",
                href: `/posts/${node.attrs.postId}`,
                class: "wiki-link",
            }),
            node.attrs.title,
        ];
    },

    addNodeView() {
        return ReactNodeViewRenderer(WikiLinkNodeView);
    },

    addOptions() {
        return {
            suggestion: {
                char: "[[",
                pluginKey: wikiLinkPluginKey,
                findSuggestionMatch: ({ $position }: any) => {
                    const text = $position.parent.textBetween(
                        0,
                        $position.parentOffset,
                        null,
                        "\ufffc"
                    );
                    // 匹配 [[ 且后面可以跟任意非 ] 的字符（支持中文）
                    const regex = /\[\[([^\]]*)$/;
                    const match = regex.exec(text);
                    if (match) {
                        const from = $position.pos - match[0].length;
                        const to = $position.pos;
                        return {
                            range: { from, to },
                            query: match[1],
                            text: match[0],
                        };
                    }
                    return null;
                },
                items: async ({ query }: { query: string }) => {
                    try {
                        const res = await fetch(
                            `/api/posts/search?q=${encodeURIComponent(query || "")}`,
                        );
                        if (!res.ok) return [];
                        const data = await res.json();
                        return (data ?? []).map((item: any) => ({
                            postId: item.id ?? item.postId,
                            title: item.title,
                        })) as WikiLinkItem[];
                    } catch {
                        return [];
                    }
                },
                command: ({
                    editor,
                    range,
                    props,
                }: {
                    editor: any;
                    range: any;
                    props: WikiLinkItem;
                }) => {
                    editor
                        .chain()
                        .focus()
                        .deleteRange({ from: range.from, to: range.to })
                        .insertContentAt(range.from, [
                            {
                                type: "wikiLink",
                                attrs: {
                                    postId: props.postId,
                                    title: props.title,
                                },
                            },
                            { type: "text", text: " " },
                        ])
                        .run();
                },
                render: renderWikiLinkItems,
            } as Partial<SuggestionOptions<WikiLinkItem>>,
        };
    },

    addProseMirrorPlugins() {
        return [
            Suggestion({
                editor: this.editor,
                ...this.options.suggestion,
            }),
        ];
    },
});

// ============================================================
// 4. React Node View — inline badge with 📎 icon
// ============================================================
function WikiLinkNodeView({ node }: { node: any }) {
    const { postId, title } = node.attrs;

    const handleClick = useCallback(
        (e: React.MouseEvent) => {
            e.preventDefault();
            window.open(`/posts/${postId}`, "_blank");
        },
        [postId],
    );

    return (
        <NodeViewWrapper as="span" className="inline">
            <a
                href={`/posts/${postId}`}
                onClick={handleClick}
                data-wiki-link=""
                data-post-id={postId}
                className={cn(
                    "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5",
                    "bg-primary/10 text-primary hover:bg-primary/20",
                    "text-sm font-medium no-underline cursor-pointer",
                    "transition-colors duration-150",
                    "border border-primary/20",
                )}
            >
                <span className="text-xs">📎</span>
                <span>{title}</span>
            </a>
        </NodeViewWrapper>
    );
}

// ============================================================
// 5. Suggestion Dropdown List — forwardRef component
// ============================================================
const WikiLinkList = forwardRef<any, any>((props, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0);

    const selectItem = (index: number) => {
        const item = props.items[index];
        if (item) {
            props.command(item);
        }
    };

    useEffect(() => {
        setSelectedIndex(0);
    }, [props.items]);

    useImperativeHandle(ref, () => ({
        onKeyDown: ({ event }: { event: KeyboardEvent }) => {
            if (event.key === "ArrowUp") {
                setSelectedIndex(
                    (selectedIndex + props.items.length - 1) %
                        props.items.length,
                );
                return true;
            }
            if (event.key === "ArrowDown") {
                setSelectedIndex(
                    (selectedIndex + 1) % props.items.length,
                );
                return true;
            }
            if (event.key === "Enter") {
                selectItem(selectedIndex);
                return true;
            }
            return false;
        },
    }));

    if (props.items.length === 0) {
        return (
            <div className="flex flex-col overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md p-2">
                <span className="text-xs text-muted-foreground px-2 py-1">
                    输入关键词搜索帖子…
                </span>
            </div>
        );
    }

    return (
        <div className="flex z-50 flex-col overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md animate-in fade-in zoom-in-95">
            <div className="max-h-[300px] overflow-y-auto p-1">
                {props.items.map((item: WikiLinkItem, index: number) => (
                    <button
                        key={item.postId}
                        className={cn(
                            "flex w-full select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors",
                            index === selectedIndex
                                ? "bg-accent text-accent-foreground"
                                : "hover:bg-accent hover:text-accent-foreground",
                        )}
                        onClick={() => selectItem(index)}
                    >
                        <span className="text-base">📄</span>
                        <span className="truncate">{item.title}</span>
                    </button>
                ))}
            </div>
        </div>
    );
});

WikiLinkList.displayName = "WikiLinkList";

// ============================================================
// 6. Tippy.js Render Functions (matches slash-command pattern)
// ============================================================
export function renderWikiLinkItems() {
    let component: ReactRenderer<any>;
    let popup: Instance[];

    return {
        onStart: (props: any) => {
            component = new ReactRenderer(WikiLinkList, {
                props,
                editor: props.editor,
            });

            if (!props.clientRect) {
                return;
            }

            // @ts-ignore
            popup = tippy("body", {
                getReferenceClientRect: props.clientRect,
                appendTo: () => document.body,
                content: component.element,
                showOnCreate: true,
                interactive: true,
                trigger: "manual",
                placement: "bottom-start",
            });
        },
        onUpdate(props: any) {
            component?.updateProps(props);
            if (!props.clientRect) {
                return;
            }
            popup?.[0]?.setProps({
                getReferenceClientRect: props.clientRect,
            });
        },
        onKeyDown(props: any) {
            if (props.event.key === "Escape") {
                popup?.[0].hide();
                return true;
            }
            return component?.ref?.onKeyDown(props);
        },
        onExit() {
            popup?.[0].destroy();
            component?.destroy();
        },
    };
};

// ============================================================
// 7. Read-only WikiLink Node (for NovelViewer / viewer-extensions)
//    — No Suggestion plugin, no editor interaction, pure rendering
// ============================================================
export const WikiLinkViewer = Node.create({
    name: "wikiLink",
    group: "inline",
    inline: true,
    atom: true,

    addAttributes() {
        return {
            postId: {
                default: null,
                parseHTML: (element) => element.getAttribute("data-post-id"),
                renderHTML: (attributes) => ({
                    "data-post-id": attributes.postId,
                }),
            },
            title: {
                default: null,
                parseHTML: (element) => element.textContent?.trim() ?? "",
                renderHTML: () => ({}),
            },
        };
    },

    parseHTML() {
        return [{ tag: "a[data-wiki-link]" }];
    },

    renderHTML({ node, HTMLAttributes }) {
        return [
            "a",
            mergeAttributes(HTMLAttributes, {
                "data-wiki-link": "",
                href: `/posts/${node.attrs.postId}`,
                class: "wiki-link",
            }),
            node.attrs.title,
        ];
    },

    addNodeView() {
        return ReactNodeViewRenderer(WikiLinkNodeView);
    },
});
