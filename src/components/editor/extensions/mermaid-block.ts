import { mergeAttributes, Node } from "@tiptap/core";

/**
 * MermaidBlock — TipTap Node Extension (纯 DOM NodeView，SSR 安全)
 * - 编辑模式: textarea + 实时预览
 * - 只读模式: 直接渲染 SVG
 */
export const MermaidBlock = Node.create({
    name: "mermaidBlock",
    group: "block",
    atom: true,

    addAttributes() {
        return {
            content: {
                default:
                    "graph TD\n    A[开始] --> B{判断}\n    B -->|是| C[执行]\n    B -->|否| D[结束]",
            },
        };
    },

    parseHTML() {
        return [{ tag: 'div[data-type="mermaid-block"]' }];
    },

    renderHTML({ HTMLAttributes }) {
        return [
            "div",
            mergeAttributes(HTMLAttributes, { "data-type": "mermaid-block" }),
        ];
    },

    addNodeView() {
        return ({ node, getPos, editor }) => {
            // --- 容器结构 ---
            const wrapper = document.createElement("div");
            wrapper.classList.add("mermaid-block-wrapper", "my-4");
            wrapper.setAttribute("data-type", "mermaid-block");

            const previewArea = document.createElement("div");
            previewArea.classList.add(
                "mermaid-preview-area",
                "flex",
                "justify-center",
                "p-4",
                "overflow-x-auto"
            );
            previewArea.style.minHeight = "60px";

            const errorArea = document.createElement("div");
            errorArea.classList.add(
                "p-3",
                "text-sm",
                "font-mono",
                "rounded-lg",
                "hidden"
            );
            errorArea.style.cssText =
                "color: var(--color-orange-600); background: rgba(249,115,22,0.1); border: 1px solid rgba(249,115,22,0.2);";

            let renderCounter = 0;

            // --- Mermaid 渲染 ---
            const renderMermaid = async (source: string) => {
                if (!source.trim()) {
                    previewArea.innerHTML = "";
                    errorArea.classList.add("hidden");
                    return;
                }
                try {
                    const mermaid = (await import("mermaid")).default;
                    mermaid.initialize({
                        startOnLoad: false,
                        theme: document.documentElement.classList.contains(
                            "dark"
                        )
                            ? "dark"
                            : "default",
                        securityLevel: "loose",
                        fontFamily: "inherit",
                    });

                    const id = `mermaid-r${++renderCounter}-${Date.now()}`;
                    const { svg } = await mermaid.render(id, source);
                    previewArea.innerHTML = svg;
                    errorArea.classList.add("hidden");
                } catch (err: unknown) {
                    // mermaid.render 出错时 DOM 内可能残留错误节点
                    document
                        .querySelectorAll('[id^="dmermaid-"]')
                        .forEach((el) => el.remove());
                    previewArea.innerHTML = "";
                    errorArea.textContent = `⚠ ${err instanceof Error ? err.message : "流程图语法错误"}`;
                    errorArea.classList.remove("hidden");
                }
            };

            let debounceTimer: ReturnType<typeof setTimeout>;
            const debouncedRender = (source: string) => {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => renderMermaid(source), 300);
            };

            // --- 编辑模式 ---
            if (editor.isEditable) {
                const editorSection = document.createElement("div");
                editorSection.classList.add("mermaid-editor-section");

                // 顶部标题栏
                const header = document.createElement("div");
                header.className =
                    "flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground border-b border-border/50 bg-muted/30 rounded-t-lg";
                header.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3h6v6H3z"/><path d="M15 3h6v6H15z"/><path d="M9 15h6v6H9z"/><path d="M6 9v3a3 3 0 0 0 3 3h0"/><path d="M18 9v3a3 3 0 0 1-3 3h0"/></svg><span class="font-medium">Mermaid 流程图</span>`;

                // 代码输入区
                const textarea = document.createElement("textarea");
                textarea.value = node.attrs.content || "";
                textarea.spellcheck = false;
                textarea.className =
                    "w-full bg-[#282c34] text-[#abb2bf] font-mono text-sm p-4 rounded-b-lg border-0 outline-none resize-y leading-relaxed";
                textarea.style.minHeight = "120px";
                textarea.style.tabSize = "4";
                textarea.placeholder =
                    "graph TD\n    A[开始] --> B{判断}\n    B -->|是| C[执行]\n    B -->|否| D[结束]";

                // 阻止 ProseMirror 拦截 textarea 的键盘事件
                textarea.addEventListener("keydown", (e) => e.stopPropagation());
                textarea.addEventListener("keypress", (e) => e.stopPropagation());
                textarea.addEventListener("keyup", (e) => e.stopPropagation());

                textarea.addEventListener("input", () => {
                    const val = textarea.value;
                    if (typeof getPos === "function") {
                        // 保存焦点，防止 dispatch 后 ProseMirror 抢走焦点
                        const selStart = textarea.selectionStart;
                        const selEnd = textarea.selectionEnd;
                        editor.view.dispatch(
                            editor.view.state.tr.setNodeMarkup(
                                getPos(),
                                undefined,
                                { content: val }
                            )
                        );
                        // 恢复焦点和光标位置
                        textarea.focus();
                        textarea.setSelectionRange(selStart, selEnd);
                    }
                    debouncedRender(val);
                });

                editorSection.appendChild(header);
                editorSection.appendChild(textarea);
                wrapper.appendChild(editorSection);
            }

            wrapper.appendChild(errorArea);
            wrapper.appendChild(previewArea);

            // 首次渲染
            renderMermaid(node.attrs.content || "");

            // 监听主题切换
            const themeObserver = new MutationObserver(() => {
                renderMermaid(node.attrs.content || "");
            });
            themeObserver.observe(document.documentElement, {
                attributes: true,
                attributeFilter: ["class"],
            });

            return {
                dom: wrapper,
                // mermaid 块完全自管理，ProseMirror 不需要处理内部任何事件
                // 这同时阻止了 click 时创建 NodeSelection（防止按键删除节点）
                stopEvent() {
                    return true;
                },
                update(updatedNode) {
                    if (updatedNode.type.name !== "mermaidBlock") return false;
                    debouncedRender(updatedNode.attrs.content || "");
                    return true;
                },
                destroy() {
                    clearTimeout(debounceTimer);
                    themeObserver.disconnect();
                },
            };
        };
    },
});
