"use client";

import { Command, CommandInput, CommandList } from "@/components/ui/command";
import { useCompletion } from "@ai-sdk/react";
import { ArrowUp } from "lucide-react";
import { useEditor } from "novel";
import { useState, useEffect } from "react";
import Markdown from "react-markdown";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import CrazySpinner from "./icons/crazy-spinner";
import Magic from "./icons/magic";
import { ScrollArea } from "@/components/ui/scroll-area";
import AICompletionCommands from "./ai-completion-command";
import AISelectorCommands from "./ai-selector-commands";

interface AISelectorProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialOption?: string;
}

// Helper function to get selected text from editor
function getSelectedText(editor: ReturnType<typeof useEditor>["editor"]): string {
    if (!editor) return "";
    const { from, to } = editor.state.selection;
    return editor.state.doc.textBetween(from, to, " ");
}

export function AISelector({ onOpenChange, initialOption }: AISelectorProps) {
    const { editor } = useEditor();
    const [inputValue, setInputValue] = useState("");

    const { completion, complete, isLoading, error } = useCompletion({
        api: "/api/generate",
        streamProtocol: "text",
    });

    // Handle initialOption execution
    useEffect(() => {
        if (initialOption && !completion && !isLoading && editor) {
            if (initialOption === "continue") {
                const text = getSelectedText(editor) || editor.state.doc.textBetween(Math.max(0, editor.state.selection.from - 500), editor.state.selection.from, " ");
                complete(text, { body: { option: "continue" } });
            }
            // Handle other initial options if needed
        }
    }, [initialOption, editor, completion, isLoading, complete]);

    // Handle error display
    useEffect(() => {
        if (error) {
            toast.error(error.message);
        }
    }, [error]);

    // Debug: 监控 completion 值
    useEffect(() => {
        console.log("[AI Debug] completion:", completion);
        console.log("[AI Debug] completion length:", completion.length);
        console.log("[AI Debug] isLoading:", isLoading);
    }, [completion, isLoading]);

    // 监听斜杠命令触发的事件
    useEffect(() => {
        const handleContinue = () => {
            // 只有当没有 completion 时才触发，避免冲突
            if (!completion && !isLoading && editor) {
                const text = getSelectedText(editor) || editor.state.doc.textBetween(Math.max(0, editor.state.selection.from - 500), editor.state.selection.from, " ");
                complete(text, { body: { option: "continue" } });
            }
        };

        const handleAsk = () => {
            if (!completion && !isLoading) {
                // 强制打开 input（通过 onOpenChange 应该已经打开了，这里主要是聚焦或清空状态）
                // 实际上 AISelector 是渲染在 BubbleMenu 里的吗？不，它通常是独立的。
                // 如果 AISelector 是 BubbleMenu 的一部分（根据 BubbleMenu.tsx 似乎是封装在 GenerativeMenuSwitch 里），
                // 那么我们需要确保它被设置为 open。
                // GenerativeMenuSwitch 控制 open 状态。
                // 只有当 openAI 为 true 时，AISelector 才会被渲染。
                // BubbleMenu.tsx 里有 openAI state。
                // 这意味着我们需要在 BubbleMenu 里监听这些事件来打开菜单。
                // AISelector 本身可能不总是挂载的。
            }
        };

        window.addEventListener("trigger-ai-continue", handleContinue);
        // window.addEventListener("trigger-ai-ask", handleAsk); // Ask 由 BubbleMenu 处理打开

        return () => {
            window.removeEventListener("trigger-ai-continue", handleContinue);
            // window.removeEventListener("trigger-ai-ask", handleAsk);
        };
    }, [editor, completion, isLoading, complete]);

    const hasCompletion = completion.length > 0;

    if (!editor) return null;

    const handleSubmit = () => {
        const selectedText = getSelectedText(editor);

        if (completion) {
            // Continue with existing completion
            complete(completion, {
                body: { option: "zap", command: inputValue },
            }).then(() => setInputValue(""));
        } else if (selectedText || inputValue) {
            // Use selected text or input
            complete(selectedText || inputValue, {
                body: { option: "zap", command: inputValue },
            }).then(() => setInputValue(""));
        } else {
            toast.error("请先选择文本或输入内容");
        }
    };

    return (
        <Command className="w-[350px]">
            {hasCompletion && (
                <div className="flex max-h-[400px]">
                    <ScrollArea>
                        <div className="prose p-2 px-4 prose-sm dark:prose-invert">
                            <Markdown>{completion}</Markdown>
                        </div>
                    </ScrollArea>
                </div>
            )}

            {isLoading && (
                <div className="flex h-12 w-full items-center px-4 text-sm font-medium text-muted-foreground text-purple-500">
                    <Magic className="mr-2 h-4 w-4 shrink-0" />
                    AI 正在思考
                    <div className="ml-2 mt-1">
                        <CrazySpinner />
                    </div>
                </div>
            )}
            {!isLoading && (
                <>
                    <div className="relative">
                        <CommandInput
                            value={inputValue}
                            onValueChange={setInputValue}
                            autoFocus
                            placeholder={hasCompletion ? "告诉 AI 接下来做什么" : "让 AI 编辑或生成..."}
                        />
                        <Button
                            size="icon"
                            className="absolute right-2 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-purple-500 hover:bg-purple-900"
                            onClick={handleSubmit}
                        >
                            <ArrowUp className="h-4 w-4" />
                        </Button>
                    </div>
                    <CommandList>
                        {hasCompletion ? (
                            <AICompletionCommands
                                onDiscard={() => {
                                    onOpenChange(false);
                                }}
                                completion={completion}
                            />
                        ) : (
                            <AISelectorCommands onSelect={(value, option, command) => complete(value, { body: { option, command } })} />
                        )}
                    </CommandList>
                </>
            )}
        </Command>
    );
}
