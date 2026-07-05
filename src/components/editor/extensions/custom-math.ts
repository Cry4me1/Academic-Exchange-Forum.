import { getChangedRanges, Extension } from "@tiptap/core";
import { EditorState, Plugin, PluginKey, Transaction } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import { createRoot } from "react-dom/client";
import React from "react";
import MathViewerComponent from "./MathViewerComponent";

type PluginState =
  | { decorations: DecorationSet; isEditable: boolean }
  | { decorations: undefined; isEditable: undefined };

const defaultShouldRender = (state: EditorState, pos: number) => {
  const $pos = state.doc.resolve(pos);
  const isInCodeBlock = $pos.parent.type.name === "codeBlock";
  return !isInCodeBlock;
};

export const CustomMathematics = Extension.create<any>({
  name: "customMathematics",

  addOptions() {
    return {
      regex: /\$([^\$]*)\$/gi,
      shouldRender: defaultShouldRender,
    };
  },

  addProseMirrorPlugins() {
    const { regex, shouldRender } = this.options;
    const editor = this.editor;

    return [
      new Plugin<PluginState>({
        key: new PluginKey("customMathematics"),

        state: {
          init() {
            return { decorations: undefined, isEditable: undefined };
          },
          apply(tr: Transaction, previousPluginState: PluginState, state: EditorState, newState: EditorState) {
            if (!tr.docChanged && !tr.selectionSet && previousPluginState.decorations) {
              return previousPluginState;
            }

            const nextDecorationSet = (previousPluginState.decorations || DecorationSet.empty).map(
              tr.mapping,
              tr.doc
            );
            const { selection } = newState;
            const isEditable = editor.isEditable;
            const decorationsToAdd = [] as any[];
            
            // 计算更新范围
            const docSize = newState.doc.nodeSize - 2;
            let minFrom = 0;
            let maxTo = docSize;

            if (previousPluginState.isEditable !== isEditable) {
              minFrom = 0;
              maxTo = docSize;
            } else if (tr.docChanged) {
              minFrom = docSize;
              maxTo = 0;

              getChangedRanges(tr).forEach(range => {
                minFrom = Math.min(minFrom, range.newRange.from - 1, range.oldRange.from - 1);
                maxTo = Math.max(maxTo, range.newRange.to + 1, range.oldRange.to + 1);
              });
            } else if (tr.selectionSet) {
              const { $from, $to } = state.selection;
              const { $from: $newFrom, $to: $newTo } = newState.selection;

              minFrom = Math.min(
                $from.depth === 0 ? 0 : $from.before(),
                $newFrom.depth === 0 ? 0 : $newFrom.before()
              );
              maxTo = Math.max(
                $to.depth === 0 ? maxTo : $to.after(),
                $newTo.depth === 0 ? maxTo : $newTo.after()
              );
            }

            minFrom = Math.max(minFrom, 0);
            maxTo = Math.min(maxTo, docSize);

            newState.doc.nodesBetween(minFrom, maxTo, (node, pos) => {
              const enabled = shouldRender(newState, pos, node);

              if (node.isText && node.text && enabled) {
                let match: RegExpExecArray | null;
                
                // 重置 RegExp 状态，防止多次执行匹配偏移
                regex.lastIndex = 0;

                while ((match = regex.exec(node.text))) {
                  const from = pos + match.index;
                  const to = from + match[0].length;
                  const content = match.slice(1).find(Boolean);

                  if (content) {
                    const selectionSize = selection.from - selection.to;
                    const anchorIsInside = selection.anchor >= from && selection.anchor <= to;
                    const rangeIsInside = selection.from >= from && selection.to <= to;
                    const isEditing = (selectionSize === 0 && anchorIsInside) || rangeIsInside;

                    if (
                      nextDecorationSet.find(
                        from,
                        to,
                        (deco: any) => isEditing === deco.spec.isEditing
                          && content === deco.spec.content
                          && isEditable === deco.spec.isEditable
                      ).length
                    ) {
                      continue;
                    }

                    // 添加 inline decoration 以隐藏原始编辑文本 (在只读或非编辑状态下)
                    decorationsToAdd.push(
                      Decoration.inline(
                        from,
                        to,
                        {
                          class:
                            isEditing && isEditable
                              ? "Tiptap-mathematics-editor"
                              : "Tiptap-mathematics-editor Tiptap-mathematics-editor--hidden",
                          style:
                            !isEditing || !isEditable
                              ? "display: inline-block; height: 0; opacity: 0; overflow: hidden; position: absolute; width: 0;"
                              : undefined,
                        },
                        {
                          content,
                          isEditable,
                          isEditing,
                        }
                      )
                    );

                    if (!isEditable || !isEditing) {
                      // 注入自定义的 React Widget 渲染
                      decorationsToAdd.push(
                        Decoration.widget(
                          from,
                          (() => {
                            const element = document.createElement("span");
                            element.classList.add("Tiptap-mathematics-render-wrapper", "inline-block");
                            if (isEditable) {
                              element.classList.add("Tiptap-mathematics-render--editable");
                            }

                            // 挂载 React 根节点并渲染 MathViewerComponent
                            const root = createRoot(element);
                            root.render(
                              React.createElement(MathViewerComponent, { content })
                            );

                            // 返回 DOM 节点和销毁回调
                            return {
                              dom: element,
                              destroy: () => {
                                root.unmount();
                              },
                            };
                          }) as any,
                          {
                            content,
                            isEditable,
                            isEditing,
                          }
                        )
                      );
                    }
                  }
                }
              }
            });

            const decorationsToRemove = decorationsToAdd.flatMap(deco => nextDecorationSet.find(deco.from, deco.to));

            return {
              decorations: nextDecorationSet
                .remove(decorationsToRemove)
                .add(tr.doc, decorationsToAdd),
              isEditable,
            };
          },
        },

        props: {
          decorations(state) {
            return this.getState(state)?.decorations ?? DecorationSet.empty;
          },
        },
      }),
    ];
  },
});

export default CustomMathematics;
