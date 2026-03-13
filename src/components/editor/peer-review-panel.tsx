"use client";

import { getMyCredits } from "@/app/(protected)/credits/actions";
import { Button } from "@/components/ui/button";
import { extractTextFromJSON, truncateText } from "@/lib/extract-text";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { AnimatePresence, motion } from "framer-motion";
import {
    Bot,
    Brain,
    ChevronDown,
    ChevronRight,
    ChevronUp,
    Coins,
    FileSearch,
    Sparkles,
} from "lucide-react";
import type { JSONContent } from "novel";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";

const MIN_REVIEW_CREDIT_COST = 15;

interface PeerReviewPanelProps {
    content: JSONContent | undefined;
    title: string;
    tags: string[];
}

export default function PeerReviewPanel({
    content,
    title,
    tags,
}: PeerReviewPanelProps) {
    const [isExpanded, setIsExpanded] = useState(true);
    const [creditBalance, setCreditBalance] = useState<number | null>(null);
    const [showReasoning, setShowReasoning] = useState(false);
    const [showDeduction, setShowDeduction] = useState(false);
    const [deductedAmount, setDeductedAmount] = useState<number>(0);
    const prevBalanceRef = useRef<number | null>(null);

    // 加载积分余额
    const refreshCredits = useCallback(async () => {
        const result = await getMyCredits();
        const newBalance = result.balance;
        if (
            prevBalanceRef.current !== null &&
            newBalance < prevBalanceRef.current
        ) {
            setDeductedAmount(prevBalanceRef.current - newBalance);
            setShowDeduction(true);
            setTimeout(() => setShowDeduction(false), 3000);
        }
        prevBalanceRef.current = newBalance;
        setCreditBalance(newBalance);
    }, []);

    useEffect(() => {
        if (isExpanded) {
            refreshCredits();
        }
    }, [isExpanded, refreshCredits]);

    // 初始化时从 localStorage 恢复数据 (解决刷新消失问题)
    const [initialMessages] = useState(() => {
        if (typeof window !== "undefined" && title) {
            try {
                const saved = localStorage.getItem(`peer-review-${title}`);
                if (saved) return JSON.parse(saved);
            } catch (e) {
                console.error("Failed to parse cached peer review", e);
            }
        }
        return [];
    });

    // useChat (AI SDK v6): sendMessage / status / messages / setMessages
    const { messages, sendMessage, status, setMessages } = useChat({
        id: "peer-review",
        messages: initialMessages,
        transport: new DefaultChatTransport({
            api: "/api/ai/peer-review",
        }),
        onFinish: () => {
            refreshCredits();
        },
        onError: (err: Error) => {
            if (
                err.message.includes("402") ||
                err.message.includes("INSUFFICIENT_CREDITS")
            ) {
                toast.error(
                    `积分不足，同行评审最低消耗 ${MIN_REVIEW_CREDIT_COST} 积分。`,
                    {
                        action: {
                            label: "去充值",
                            onClick: () => {
                                window.dispatchEvent(
                                    new CustomEvent("open-recharge-dialog")
                                );
                            },
                        },
                    }
                );
                return;
            }
            toast.error("评审失败：" + err.message);
        },
    });

    // 每次 messages 更新时同步到 localStorage
    useEffect(() => {
        if (typeof window !== "undefined" && title) {
            if (messages.length > 0) {
                localStorage.setItem(`peer-review-${title}`, JSON.stringify(messages));
            } else if (messages.length === 0) {
                localStorage.removeItem(`peer-review-${title}`);
            }
        }
    }, [messages, title]);

    // 从 assistant 消息的 parts 中提取推理和正文
    const assistantMsg = messages.find((m) => m.role === "assistant");

    const { reasoningText, reviewText } = useMemo(() => {
        if (!assistantMsg?.parts) return { reasoningText: "", reviewText: "" };

        let reasoning = "";
        let review = "";

        for (const part of assistantMsg.parts) {
            if (part.type === "reasoning") {
                // AI SDK v6: ReasoningUIPart.text
                reasoning += part.text || "";
            } else if (part.type === "text") {
                // AI SDK v6: TextUIPart.text
                review += part.text || "";
            }
        }

        return { reasoningText: reasoning, reviewText: review };
    }, [assistantMsg]);

    // 状态检测 (AI SDK v6: status = 'submitted' | 'streaming' | 'ready' | 'error')
    const isActive = status === "submitted" || status === "streaming";
    const hasStarted = messages.length > 0;
    const isThinking = isActive && !!reasoningText && !reviewText;
    const isWritingReview = isActive && !!reviewText;
    const hasResult = status === "ready" && !!reviewText;

    const handleStartReview = async () => {
        if (!content) {
            toast.error("请先输入文章内容");
            return;
        }

        if (tags.length === 0) {
            toast.error("请至少选择一个标签");
            return;
        }

        const plainText = extractTextFromJSON(content);

        if (!plainText || plainText.length < 50) {
            toast.error("内容太短，至少需要 50 个字符才能进行评审");
            return;
        }

        const truncatedContent = truncateText(plainText, 8000);

        // 清除之前的评审
        setMessages([]);
        setShowReasoning(false);

        // 发送评审请求 (AI SDK v6: sendMessage)
        await sendMessage(
            { text: "请评审以下文章" },
            {
                body: {
                    content: truncatedContent,
                    title,
                    tags,
                },
            }
        );
    };

    const insufficientCredits =
        creditBalance !== null && creditBalance < MIN_REVIEW_CREDIT_COST;

    return (
        <div className="rounded-xl border border-border/60 bg-gradient-to-br from-violet-500/5 via-background to-indigo-500/5 shadow-lg overflow-hidden">
            {/* 头部 */}
            <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-muted/30 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 shadow-md">
                        <Bot className="h-4 w-4 text-white" />
                    </div>
                    <div className="text-left">
                        <h3 className="text-sm font-semibold text-foreground">
                            AI 同行评审
                        </h3>
                        <p className="text-xs text-muted-foreground">
                            Reviewer #2 · DeepSeek 深度推理模型
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {hasResult && (
                        <span className="text-[10px] font-medium text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full">
                            评审完成
                        </span>
                    )}
                    {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                </div>
            </button>

            {/* 展开内容 */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="overflow-hidden"
                    >
                        <div className="border-t border-border/50">
                            {/* 积分信息栏 */}
                            <div className="flex items-center justify-between px-5 py-2.5 bg-muted/20">
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Sparkles className="h-3.5 w-3.5 text-violet-500 shrink-0" />
                                    <span>
                                        预计消耗 ≥{" "}
                                        <span className="font-semibold text-violet-500">
                                            {MIN_REVIEW_CREDIT_COST}
                                        </span>{" "}
                                        积分
                                    </span>
                                </div>
                                <div className="flex items-center gap-1.5 relative">
                                    <Coins className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                                    <AnimatePresence mode="popLayout">
                                        <motion.span
                                            key={creditBalance}
                                            initial={{
                                                y: -8,
                                                opacity: 0,
                                                scale: 0.8,
                                            }}
                                            animate={{
                                                y: 0,
                                                opacity: 1,
                                                scale: 1,
                                            }}
                                            exit={{
                                                y: 8,
                                                opacity: 0,
                                                scale: 0.8,
                                            }}
                                            transition={{
                                                type: "spring",
                                                stiffness: 500,
                                                damping: 30,
                                            }}
                                            className={`text-xs font-semibold tabular-nums ${insufficientCredits
                                                ? "text-red-500"
                                                : "text-amber-500"
                                                }`}
                                        >
                                            {creditBalance !== null
                                                ? creditBalance
                                                : "..."}
                                        </motion.span>
                                    </AnimatePresence>
                                    {/* 扣费飘字 */}
                                    <AnimatePresence>
                                        {showDeduction && (
                                            <motion.span
                                                initial={{
                                                    opacity: 1,
                                                    y: 0,
                                                    x: 4,
                                                }}
                                                animate={{
                                                    opacity: 0,
                                                    y: -24,
                                                }}
                                                exit={{ opacity: 0 }}
                                                transition={{
                                                    duration: 2,
                                                    ease: "easeOut",
                                                }}
                                                className="absolute -top-2 right-0 text-[11px] font-bold text-red-400 pointer-events-none whitespace-nowrap"
                                            >
                                                -{deductedAmount}
                                            </motion.span>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>

                            {/* ====== 操作按钮（初始状态） ====== */}
                            {!hasStarted && !isActive && (
                                <div className="px-5 py-4">
                                    {insufficientCredits ? (
                                        <div className="space-y-3">
                                            <p className="text-xs text-red-500/80 text-center">
                                                余额不足，同行评审需要至少{" "}
                                                {MIN_REVIEW_CREDIT_COST} 积分
                                            </p>
                                            <Button
                                                onClick={() =>
                                                    window.dispatchEvent(
                                                        new CustomEvent(
                                                            "open-recharge-dialog"
                                                        )
                                                    )
                                                }
                                                variant="outline"
                                                className="w-full gap-2 text-amber-600 border-amber-500/30 hover:bg-amber-500/10"
                                            >
                                                <Coins className="h-4 w-4" />
                                                去充值
                                            </Button>
                                        </div>
                                    ) : (
                                        <Button
                                            onClick={handleStartReview}
                                            className="w-full gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-md"
                                        >
                                            <FileSearch className="h-4 w-4" />
                                            开始评审（-{MIN_REVIEW_CREDIT_COST}
                                            + 积分）
                                        </Button>
                                    )}
                                </div>
                            )}

                            {/* ====== 思考中状态 ====== */}
                            {isActive && !reviewText && (
                                <div className="px-5 py-6">
                                    <div className="flex flex-col items-center gap-4">
                                        {/* 脉动大脑动画 */}
                                        <motion.div
                                            animate={{
                                                scale: [1, 1.1, 1],
                                                opacity: [0.7, 1, 0.7],
                                            }}
                                            transition={{
                                                duration: 2,
                                                repeat: Infinity,
                                                ease: "easeInOut",
                                            }}
                                            className="flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-violet-500/20 to-indigo-500/20 border border-violet-500/30"
                                        >
                                            <Brain className="h-7 w-7 text-violet-500" />
                                        </motion.div>
                                        <div className="text-center">
                                            <p className="text-sm font-semibold text-foreground flex items-center gap-1.5 justify-center">
                                                Reviewer #2 正在深度思考
                                                <motion.span
                                                    animate={{
                                                        opacity: [0, 1, 0],
                                                    }}
                                                    transition={{
                                                        duration: 1.5,
                                                        repeat: Infinity,
                                                        ease: "easeInOut",
                                                    }}
                                                >
                                                    ...
                                                </motion.span>
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-1.5">
                                                推理模型正在仔细分析文章，这可能需要一些时间
                                            </p>
                                        </div>
                                        {/* 思考进度点 */}
                                        <div className="flex gap-1.5">
                                            {[0, 1, 2].map((i) => (
                                                <motion.div
                                                    key={i}
                                                    animate={{
                                                        scale: [1, 1.4, 1],
                                                        backgroundColor: [
                                                            "rgba(139, 92, 246, 0.3)",
                                                            "rgba(139, 92, 246, 0.8)",
                                                            "rgba(139, 92, 246, 0.3)",
                                                        ],
                                                    }}
                                                    transition={{
                                                        duration: 1.2,
                                                        repeat: Infinity,
                                                        delay: i * 0.3,
                                                        ease: "easeInOut",
                                                    }}
                                                    className="w-2 h-2 rounded-full"
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ====== 评审结果区域 ====== */}
                            {(reviewText || (hasResult && reasoningText)) && (
                                <div className="border-t border-border/50">
                                    {/* 可折叠的思考过程 */}
                                    {reasoningText && (
                                        <div className="border-b border-border/30">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setShowReasoning(
                                                        !showReasoning
                                                    )
                                                }
                                                className="w-full flex items-center gap-2 px-5 py-2.5 text-xs text-muted-foreground hover:bg-muted/30 transition-colors"
                                            >
                                                <Brain className="h-3.5 w-3.5 text-violet-400 shrink-0" />
                                                <span className="font-medium">
                                                    查看思考过程
                                                </span>
                                                <span className="text-violet-400/60">
                                                    (
                                                    {reasoningText.length > 500
                                                        ? `${Math.round(reasoningText.length / 100) * 100}+ 字`
                                                        : `${reasoningText.length} 字`}
                                                    )
                                                </span>
                                                {showReasoning ? (
                                                    <ChevronDown className="h-3.5 w-3.5 ml-auto shrink-0" />
                                                ) : (
                                                    <ChevronRight className="h-3.5 w-3.5 ml-auto shrink-0" />
                                                )}
                                            </button>

                                            <AnimatePresence>
                                                {showReasoning && (
                                                    <motion.div
                                                        initial={{
                                                            height: 0,
                                                            opacity: 0,
                                                        }}
                                                        animate={{
                                                            height: "auto",
                                                            opacity: 1,
                                                        }}
                                                        exit={{
                                                            height: 0,
                                                            opacity: 0,
                                                        }}
                                                        transition={{
                                                            duration: 0.25,
                                                            ease: "easeInOut",
                                                        }}
                                                        className="overflow-hidden"
                                                    >
                                                        <div className="max-h-[300px] overflow-y-auto px-5 py-3 bg-violet-500/5 border-t border-violet-500/10">
                                                            <pre className="text-xs text-muted-foreground/80 whitespace-pre-wrap font-mono leading-relaxed break-words">
                                                                {reasoningText}
                                                            </pre>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    )}

                                    {/* 评审报告 */}
                                    <div className="max-h-[500px] overflow-y-auto">
                                        <div className="prose prose-sm dark:prose-invert max-w-none px-5 py-4 prose-headings:text-foreground prose-table:text-sm prose-td:border prose-th:border prose-table:border-collapse prose-th:p-2 prose-td:p-2 prose-th:bg-muted/50">
                                            <Markdown remarkPlugins={[remarkGfm]}>{reviewText}</Markdown>
                                        </div>
                                    </div>

                                    {/* 正在生成指示 */}
                                    {isWritingReview && (
                                        <div className="flex items-center gap-2 px-5 py-2 border-t border-border/30 bg-muted/10">
                                            <motion.div
                                                animate={{
                                                    opacity: [0.4, 1, 0.4],
                                                }}
                                                transition={{
                                                    duration: 1.5,
                                                    repeat: Infinity,
                                                }}
                                                className="w-1.5 h-1.5 rounded-full bg-violet-500"
                                            />
                                            <span className="text-xs text-muted-foreground">
                                                正在生成评审报告...
                                            </span>
                                        </div>
                                    )}

                                    {/* 完成状态栏 */}
                                    {hasResult && (
                                        <div className="flex items-center justify-between px-5 py-2.5 border-t border-border/50 bg-green-500/5">
                                            <div className="flex items-center gap-2 text-xs text-green-600">
                                                <div className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
                                                <span>评审完成</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                {deductedAmount > 0 && (
                                                    <span className="text-xs text-muted-foreground">
                                                        消耗{" "}
                                                        <span className="font-semibold text-violet-500">
                                                            {deductedAmount}
                                                        </span>{" "}
                                                        积分
                                                    </span>
                                                )}
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={handleStartReview}
                                                    className="h-7 text-xs text-muted-foreground hover:text-foreground"
                                                >
                                                    重新评审
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
