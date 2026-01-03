"use client";

import { CommandGroup, CommandItem, CommandSeparator, CommandInput } from "@/components/ui/command";
import { useEditor } from "novel";
import { Check, TextQuote, TrashIcon, RefreshCcw, Send } from "lucide-react";
import { useState } from "react";
// import { Button } from "@/components/ui/button"; // CommandInput is inside Command, custom buttons might need structure adjustment

interface AICompletionCommandsProps {
    completion: string;
    onDiscard: () => void;
}

const AICompletionCommands = ({ completion, onDiscard }: AICompletionCommandsProps) => {
    const { editor } = useEditor();
    const [feedback, setFeedback] = useState("");

    if (!editor) return null;

    return (
        <>
            <CommandGroup>
                <CommandItem
                    className="gap-2 px-4"
                    value="replace"
                    onSelect={() => {
                        const selection = editor.view.state.selection;

                        editor
                            .chain()
                            .focus()
                            .insertContentAt(
                                {
                                    from: selection.from,
                                    to: selection.to,
                                },
                                completion
                            )
                            .run();
                    }}
                >
                    <Check className="h-4 w-4 text-muted-foreground" />
                    替换选中内容
                </CommandItem>
                <CommandItem
                    className="gap-2 px-4"
                    value="insert"
                    onSelect={() => {
                        const selection = editor.view.state.selection;
                        const docSize = editor.view.state.doc.content.size;
                        const insertPos = Math.min(selection.to + 1, docSize);

                        editor
                            .chain()
                            .focus()
                            .insertContentAt(insertPos, completion)
                            .run();
                    }}
                >
                    <TextQuote className="h-4 w-4 text-muted-foreground" />
                    在下方插入
                </CommandItem>
            </CommandGroup>

            <CommandSeparator />

            {/* 反馈/重试区域 - 暂时用 CommandItem 模拟，因为 Command 组件限制 */}
            <CommandGroup heading="不满意结果？">
                <CommandItem
                    onSelect={() => {
                        // 这里理想情况是触发重新生成，但当前架构需要回调到父组件
                        // 我们暂时只提供重新生成的文案，需在父组件处理 retry 逻辑
                        // 由于 props 中没有 onRetry，我们先暂时保留 UI
                        // 实际项目需重构以支持 onRetry(feedback)
                        console.log("Retry with feedback:", feedback);
                    }}
                    value="retry"
                    className="gap-2 px-4 text-muted-foreground"
                >
                    <RefreshCcw className="h-4 w-4" />
                    再试一次
                </CommandItem>

                <CommandItem onSelect={onDiscard} value="discard" className="gap-2 px-4 text-red-500">
                    <TrashIcon className="h-4 w-4" />
                    放弃
                </CommandItem>
            </CommandGroup>
        </>
    );
};

export default AICompletionCommands;
