"use client";

import { getMyCredits } from "@/app/(protected)/credits/actions";
import { Button } from "@/components/ui/button";
import { Command, CommandInput, CommandList } from "@/components/ui/command";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCompletion } from "@ai-sdk/react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUp, Coins, Zap } from "lucide-react";
import { useEditor } from "novel";
import { useCallback, useEffect, useRef, useState } from "react";
import Markdown from "react-markdown";
import { toast } from "sonner";
import AICompletionCommands from "./ai-completion-command";
import AISelectorCommands from "./ai-selector-commands";
import CrazySpinner from "./icons/crazy-spinner";
import Magic from "./icons/magic";

const AI_COST_PER_CALL = 5;

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
    const [creditBalance, setCreditBalance] = useState<number | null>(null);
    const [showDeduction, setShowDeduction] = useState(false);
    const prevBalanceRef = useRef<number | null>(null);

    // 加载积分余额
    const refreshCredits = useCallback(async () => {
        const result = await getMyCredits();
        const newBalance = result.balance;
        // 检测是否发生了扣费（余额减少了）
        if (prevBalanceRef.current !== null && newBalance < prevBalanceRef.current) {
            setShowDeduction(true);
            setTimeout(() => setShowDeduction(false), 1800);
        }
        prevBalanceRef.current = newBalance;
        setCreditBalance(newBalance);
    }, []);

    useEffect(() => {
        refreshCredits();
    }, [refreshCredits]);

    const { completion, complete, isLoading, error } = useCompletion({
        api: "/api/generate",
        streamProtocol: "text",
        onFinish: () => {
            // AI 调用完成后刷新余额（触发扣费动画）
            refreshCredits();
        },
        onError: (err: Error) => {
            // 拦截 402 积分不足错误
            if (err.message.includes("402") || err.message.includes("INSUFFICIENT_CREDITS") || err.message.includes("NO_CREDIT_RECORD")) {
                toast.error("积分不足，请先充值！每次 AI 调用消耗 5 积分。", {
                    action: {
                        label: "去充值",
                        onClick: () => {
                            window.dispatchEvent(new CustomEvent("open-recharge-dialog"));
                        },
                    },
                });
                return;
            }
        },
    });

    // Handle initialOption execution
    useEffect(() => {
        if (initialOption && !completion && !isLoading && editor) {
            if (initialOption === "continue") {
                const text = getSelectedText(editor) || editor.state.doc.textBetween(Math.max(0, editor.state.selection.from - 500), editor.state.selection.from, " ");
                complete(text, { body: { option: "continue" } });
            }
        }
    }, [initialOption, editor, completion, isLoading, complete]);

    // Handle error display (skip 402 as it's handled by onError)
    useEffect(() => {
        if (error && !error.message.includes("402")) {
            toast.error(error.message);
        }
    }, [error]);

    // 监听斜杠命令触发的事件
    useEffect(() => {
        const handleContinue = () => {
            if (!completion && !isLoading && editor) {
                const text = getSelectedText(editor) || editor.state.doc.textBetween(Math.max(0, editor.state.selection.from - 500), editor.state.selection.from, " ");
                complete(text, { body: { option: "continue" } });
            }
        };

        window.addEventListener("trigger-ai-continue", handleContinue);
        return () => {
            window.removeEventListener("trigger-ai-continue", handleContinue);
        };
    }, [editor, completion, isLoading, complete]);

    const hasCompletion = completion.length > 0;

    if (!editor) return null;

    const handleSubmit = () => {
        const selectedText = getSelectedText(editor);

        if (completion) {
            complete(completion, {
                body: { option: "zap", command: inputValue },
            }).then(() => setInputValue(""));
        } else if (selectedText || inputValue) {
            complete(selectedText || inputValue, {
                body: { option: "zap", command: inputValue },
            }).then(() => setInputValue(""));
        } else {
            toast.error("请先选择文本或输入内容");
        }
    };

    const insufficientCredits = creditBalance !== null && creditBalance < AI_COST_PER_CALL;

    return (
        <Command className="w-[350px]">
            {/* ====== 积分状态栏 ====== */}
            <div className="flex items-center justify-between px-3 py-1.5 border-b border-border/50 bg-muted/30">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Zap className="h-3 w-3 text-purple-500" />
                    <span>单次消耗</span>
                    <span className="font-semibold text-purple-500">{AI_COST_PER_CALL}</span>
                    <span>积分</span>
                </div>
                <div className="flex items-center gap-1 relative">
                    <Coins className="h-3 w-3 text-amber-500" />
                    <AnimatePresence mode="popLayout">
                        <motion.span
                            key={creditBalance}
                            initial={{ y: -8, opacity: 0, scale: 0.8 }}
                            animate={{ y: 0, opacity: 1, scale: 1 }}
                            exit={{ y: 8, opacity: 0, scale: 0.8 }}
                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                            className={`text-xs font-semibold tabular-nums ${insufficientCredits ? "text-red-500" : "text-amber-500"
                                }`}
                        >
                            {creditBalance !== null ? creditBalance : "..."}
                        </motion.span>
                    </AnimatePresence>

                    {/* 扣费飘字动画 */}
                    <AnimatePresence>
                        {showDeduction && (
                            <motion.span
                                initial={{ opacity: 1, y: 0, x: 4 }}
                                animate={{ opacity: 0, y: -20 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 1.5, ease: "easeOut" }}
                                className="absolute -top-1 right-0 text-[10px] font-bold text-red-400 pointer-events-none whitespace-nowrap"
                            >
                                -{AI_COST_PER_CALL}
                            </motion.span>
                        )}
                    </AnimatePresence>
                </div>
            </div>

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
                            placeholder={
                                insufficientCredits
                                    ? "积分不足，请先充值..."
                                    : hasCompletion
                                        ? "告诉 AI 接下来做什么"
                                        : "让 AI 编辑或生成..."
                            }
                        />
                        <Button
                            size="icon"
                            className="absolute right-2 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-purple-500 hover:bg-purple-900 disabled:opacity-50"
                            onClick={insufficientCredits
                                ? () => window.dispatchEvent(new CustomEvent("open-recharge-dialog"))
                                : handleSubmit
                            }
                            disabled={insufficientCredits && false} // keep clickable to open recharge
                        >
                            {insufficientCredits ? (
                                <Coins className="h-3.5 w-3.5 text-amber-300" />
                            ) : (
                                <ArrowUp className="h-4 w-4" />
                            )}
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
