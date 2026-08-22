"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import {
    Bot,
    Brain,
    ChevronDown,
    ChevronUp,
    ChevronRight,
    CheckCircle2,
    ArrowLeft,
    Award,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { TutorialTaskChecklist, TaskItem } from "@/components/tutorials/TutorialTaskChecklist";

interface Step6AiReviewTourProps {
    onPrev: () => void;
}

const mockReasoningText = `1. 首先解析论文核心论点：基于拓扑超导量子比特与马约拉纳零能模构建高容错逻辑门。
2. 验证哈密顿量构建：检查 Kitaev 链模型的边界态代数关系，确认在非平庸相下的奇偶校验自洽。
3. 评估实验可行性：分析塞曼能与超导能隙的比值阈值，评估有限温退相干影响。
4. 整理审稿意见：总体理论完备，逻辑自洽，建议补充微扰噪声分析。给出推荐录用结论。`;

const mockReviewMarkdown = `### 📋 评审报告摘要 (Reviewer #2 Report)

**综合评价：** **Strong Accept (强烈推荐录用)**

---

#### 1. 论文主要贡献与创新性
本研究针对拓扑量子计算的核心瓶颈，基于一维纳米导线中的马约拉纳束缚态构建了高容错非阿贝尔编织逻辑门。论文在以下方面表现出色：
- **理论自洽性高**：哈密顿量建模严谨，严格推导了非阿贝尔任意子编织统计的幺正变换矩阵；
- **排版与公式规范**：KaTeX 矢量公式推导完整，无跳步现象。

#### 2. 详细技术评审意见
- **【公式 (2.1) 拓扑相判定】**：化学势条件 $|\mu| < 2t$ 与超导序参量匹配良好，零能模波函数在导线端点呈指数衰减衰减；
- **【抗噪鲁棒性】**：对于局部静电扰动具备天然拓扑保护，相干时间较传统超导传输子提升约 120 倍。

#### 3. 修改建议 (Minor Suggestions)
1. 建议在第 4 节补充有限温环境下热涨落对准粒子中毒 (Quasiparticle Poisoning) 速率的量化估算；
2. 建议在正式发表前通过本站 **IEEE 双栏排版工具** 进一步优化图表排布。

---
*审稿人：Scholarly 深度推理大模型 · 评审编号 #PR-2026-804*`;

const initialTasks: TaskItem[] = [
    {
        id: "inspect-reasoning",
        title: "1. 展开查看 DeepSeek 链式思维推理",
        description: "点击‘展开深度思考过程’，查看审稿 AI 对公式推导与实验参数的逐步推演分析。",
        isCompleted: false,
    },
    {
        id: "inspect-review",
        title: "2. 查阅标准同行评审报告与修改意见",
        description: "阅读包含理论自洽性评估、弱点分析与终审结论的顶刊级 Peer Review 完整报告。",
        isCompleted: false,
    },
    {
        id: "finish-cert",
        title: "3. 点亮‘全能研学者’结业荣誉勋章",
        description: "点击‘完成实操训练’大按钮，触发全屏绚丽礼花，完成全部 6 大核心实操实训！",
        isCompleted: false,
    },
];

export function Step6AiReviewTour({ onPrev }: Step6AiReviewTourProps) {
    const [tasks, setTasks] = useState<TaskItem[]>(initialTasks);
    const [isExpanded, setIsExpanded] = useState(true);
    const [showReasoning, setShowReasoning] = useState(true);
    const [isComplete, setIsComplete] = useState(false);
    const router = useRouter();

    const markTaskDone = (id: string) => {
        setTasks((prev) =>
            prev.map((t) => (t.id === id ? { ...t, isCompleted: true } : t))
        );
    };

    const toggleReasoning = () => {
        setShowReasoning(!showReasoning);
        markTaskDone("inspect-reasoning");
    };

    const triggerGrandFireworks = () => {
        const count = 250;
        const defaults = {
            origin: { y: 0.65 },
            zIndex: 9999,
        };

        function fire(particleRatio: number, opts: confetti.Options) {
            confetti({
                ...defaults,
                ...opts,
                particleCount: Math.floor(count * particleRatio),
            });
        }

        fire(0.25, { spread: 35, startVelocity: 65 });
        fire(0.2, { spread: 70 });
        fire(0.35, { spread: 120, decay: 0.92, scalar: 1.1 });
        fire(0.1, { spread: 140, startVelocity: 30, decay: 0.94, scalar: 1.3 });
        fire(0.1, { spread: 160, startVelocity: 55 });
    };

    const handleFinishAll = () => {
        markTaskDone("inspect-review");
        markTaskDone("finish-cert");
        setIsComplete(true);
        triggerGrandFireworks();
        toast.success("🎉 恭喜！您已成功通关 Scholarly 全真实操训练营！");

        try {
            localStorage.setItem(
                "scholarly_tutorials_completed_modules_v1",
                JSON.stringify(["editor", "publication", "duels", "messages", "credits", "moderation"])
            );
        } catch {
            // ignore
        }

        setTimeout(() => {
            router.push("/dashboard");
            router.refresh();
        }, 2200);
    };

    return (
        <div className="space-y-6">
            {/* 顶栏实操任务清单卡片 */}
            <TutorialTaskChecklist
                tasks={tasks}
                stepTitle="Step 6 · 掌握 AI 同行评审审稿系统 (Peer Review)"
                stepBadge="3 大实操子任务"
                hintText="本页面 100% 采用平台真实 PeerReviewPanel 界面与排版，零费用纯顶刊样例。"
            />

            {/* 1:1 真实 PeerReviewPanel 结构卡片 */}
            <div className="rounded-3xl border border-border/70 bg-gradient-to-br from-violet-500/5 via-background to-indigo-500/5 shadow-xl overflow-hidden">
                {/* 头部 (与真实 PeerReviewPanel 100% 一致) */}
                <button
                    type="button"
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="w-full flex items-center justify-between px-6 py-4.5 hover:bg-muted/30 transition-colors border-b border-border/40"
                >
                    <div className="flex items-center gap-3.5">
                        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-md text-white">
                            <Bot className="h-5 w-5" />
                        </div>
                        <div className="text-left">
                            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                                AI 同行评审报告 (作者已公开)
                                <Badge className="text-[10px] bg-violet-500/15 text-violet-600 dark:text-violet-400 border-violet-500/30">
                                    真实业务 UI 样例
                                </Badge>
                            </h3>
                            <p className="text-xs text-muted-foreground">
                                Reviewer #2 · DeepSeek 深度推理模型
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                        <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full flex items-center gap-1">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            评审完成 · Strong Accept
                        </span>
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
                            className="p-6 sm:p-7 space-y-5"
                        >
                            {/* 深度思考过程折叠条 */}
                            <div className="rounded-2xl border border-violet-500/20 bg-violet-500/5 overflow-hidden">
                                <button
                                    type="button"
                                    onClick={toggleReasoning}
                                    className="w-full flex items-center justify-between px-4 py-2.5 text-xs text-violet-600 dark:text-violet-400 font-semibold hover:bg-violet-500/10 transition-colors"
                                >
                                    <div className="flex items-center gap-2">
                                        <Brain className="h-4 w-4" />
                                        <span>DeepSeek 深度思维链推理过程 · 耗时 4.2s</span>
                                    </div>
                                    {showReasoning ? (
                                        <ChevronDown className="h-3.5 w-3.5" />
                                    ) : (
                                        <ChevronRight className="h-3.5 w-3.5" />
                                    )}
                                </button>

                                {showReasoning && (
                                    <div className="px-4 py-3 border-t border-violet-500/20 bg-background/50 text-xs font-mono text-muted-foreground whitespace-pre-wrap leading-relaxed">
                                        {mockReasoningText}
                                    </div>
                                )}
                            </div>

                            {/* 真实 Markdown 评审正文 */}
                            <div
                                onClick={() => markTaskDone("inspect-review")}
                                className="prose prose-sm dark:prose-invert max-w-none rounded-2xl bg-card/60 border border-border/50 p-5 sm:p-6 text-foreground leading-relaxed shadow-sm"
                            >
                                <Markdown remarkPlugins={[remarkGfm]}>
                                    {mockReviewMarkdown}
                                </Markdown>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* 底部导航操作条 */}
            <div className="flex items-center justify-between pt-2">
                <Button
                    variant="ghost"
                    size="lg"
                    onClick={onPrev}
                    disabled={isComplete}
                    className="h-11 px-5 rounded-2xl text-muted-foreground hover:text-foreground gap-2 cursor-pointer"
                >
                    <ArrowLeft className="h-4 w-4" />
                    上一步：积分与特权
                </Button>

                <Button
                    size="lg"
                    disabled={isComplete}
                    onClick={handleFinishAll}
                    className="h-12 px-8 rounded-2xl bg-gradient-to-r from-primary via-violet-600 to-indigo-600 text-white font-bold shadow-xl shadow-primary/30 gap-2 hover:opacity-95 cursor-pointer text-sm"
                >
                    <Award className="h-5 w-5 animate-pulse" />
                    完成实操训练，点亮研学者勋章
                </Button>
            </div>
        </div>
    );
}
