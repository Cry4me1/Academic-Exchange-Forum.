"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PenTool, Sparkles, ArrowRight, Loader2, Sigma, Layers, Wand2 } from "lucide-react";
import { type JSONContent } from "novel";
import { toast } from "sonner";
import { TutorialTaskChecklist, TaskItem } from "@/components/tutorials/TutorialTaskChecklist";

const NovelEditor = dynamic(() => import("@/components/editor/NovelEditor"), {
    ssr: false,
    loading: () => (
        <div className="flex flex-col items-center justify-center min-h-[360px] text-muted-foreground gap-3">
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
            <p className="text-xs">正在载入真实学术创作台...</p>
        </div>
    ),
});

interface Step1EditorTourProps {
    onNext: () => void;
}

const sampleAcademicContent: JSONContent = {
    type: "doc",
    content: [
        {
            type: "heading",
            attrs: { level: 2 },
            content: [{ type: "text", text: "分布式共识与拓扑量子计算的交叉研究" }],
        },
        {
            type: "paragraph",
            content: [
                { type: "text", text: "欢迎来到 Scholarly 真实学术创作台。本编辑器专为学术交流设计，原生支持 " },
                { type: "text", marks: [{ type: "bold" }], text: "Slash 斜杠菜单 (/)" },
                { type: "text", text: "、" },
                { type: "text", marks: [{ type: "bold" }], text: "LaTeX 矢量公式 ($)" },
                { type: "text", text: " 以及 " },
                { type: "text", marks: [{ type: "bold" }], text: "学术定理证明块" },
                { type: "text", text: "。" },
            ],
        },
        {
            type: "academicBlock",
            attrs: { type: "theorem", label: "拜占庭容错安全下界定理" },
            content: [
                {
                    type: "paragraph",
                    content: [
                        {
                            type: "text",
                            text: "在含有 n 个节点的异步网络中，若存在 f 个拜占庭故障节点，则系统达成一致性的充分必要条件为 n ≥ 3f + 1。",
                        },
                    ],
                },
            ],
        },
        {
            type: "paragraph",
            content: [
                {
                    type: "text",
                    text: "👉 请在下方空白行直接键入 '/' 体验学术组件菜单，或用鼠标选中段落文字唤出 AI 润色气泡条：",
                },
            ],
        },
        {
            type: "paragraph",
            content: [],
        },
    ],
};

const initialTasks: TaskItem[] = [
    {
        id: "task-slash",
        title: "1. 唤起 Slash 斜杠创作菜单",
        description: "在下方真实编辑器空白行中键入 '/'，唤起包含标题、LaTeX 公式、定理证明块的学术创作菜单。",
        isCompleted: false,
    },
    {
        id: "task-math",
        title: "2. 插入并渲染 LaTeX 矢量公式",
        description: "输入 '$E=mc^2$' 或在斜杠菜单中选择 'LaTeX 数学公式'，实时编译高质量数学方程。",
        isCompleted: false,
    },
    {
        id: "task-academic-block",
        title: "3. 插入学术定理证明框 (AcademicBlock)",
        description: "在斜杠菜单中选择‘学术定理证明’，插入带有 Theorem / Proof / Lemma 标识的标准学术框。",
        isCompleted: false,
    },
    {
        id: "task-bubble-ai",
        title: "4. 选中文本体验 Bubble Menu 与 AI 润色",
        description: "使用鼠标划选段落中的任意几个词或一句话，唤起浮动气泡工具条体验加粗、代码高亮与 AI 润色。",
        isCompleted: false,
    },
];

export function Step1EditorTour({ onNext }: Step1EditorTourProps) {
    const [tasks, setTasks] = useState<TaskItem[]>(initialTasks);

    const markTaskDone = (id: string) => {
        setTasks((prev) =>
            prev.map((t) => (t.id === id ? { ...t, isCompleted: true } : t))
        );
    };

    const handleEditorChange = (content?: JSONContent) => {
        // 用户在编辑器产生输入交互
        markTaskDone("task-slash");
        markTaskDone("task-math");
        markTaskDone("task-academic-block");
    };

    const handleMouseUpInEditor = () => {
        const selection = window.getSelection();
        if (selection && selection.toString().trim().length > 0) {
            markTaskDone("task-bubble-ai");
        }
    };

    const handleTaskClick = (taskId: string) => {
        markTaskDone(taskId);
        if (taskId === "task-academic-block") {
            toast.success("✓ 已掌握学术定理证明块功能！支持 Theorem、Proof、Lemma 与自定义标签。");
        } else if (taskId === "task-slash") {
            toast.success("✓ 已掌握 Slash 斜杠菜单！键入 '/' 即可快速插入标题、列表与代码块。");
        } else if (taskId === "task-math") {
            toast.success("✓ 已掌握 LaTeX 公式！输入 $公式$ 即可实时编译 KaTeX 矢量数学方程。");
        } else if (taskId === "task-bubble-ai") {
            toast.success("✓ 已掌握 Bubble Menu 气泡条！划选文字即可加粗、代码化或调用 AI 润色。");
        }
    };

    return (
        <div className="space-y-6">
            {/* 顶栏实操任务清单卡片 */}
            <TutorialTaskChecklist
                tasks={tasks}
                onTaskClick={handleTaskClick}
                stepTitle="Step 1 · 学术编辑器核心创作技能实战"
                stepBadge="4 大实操子任务"
                hintText="在下方真实编辑器中键入 '/' 可唤出学术组件菜单，划选文字可弹出浮动气泡条，亦可点击上方任务卡片快速标记。"
            />

            {/* 宽幅真实编辑器容器 */}
            <div className="rounded-3xl border border-border/80 bg-card/85 backdrop-blur-2xl shadow-xl p-5 sm:p-7 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/50 pb-3">
                    <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600">
                            <PenTool className="h-4 w-4" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                                Scholarly 学术创作台 (Live Novel Editor)
                                <Badge variant="secondary" className="text-[10px] text-blue-600 bg-blue-500/10 border-blue-500/20">
                                    真实业务组件
                                </Badge>
                            </h3>
                            <p className="text-xs text-muted-foreground">
                                真实创作环境 · 支持 Markdown、Slash 菜单、KaTeX 矢量公式与学术定理块
                            </p>
                        </div>
                    </div>

                    {/* 辅助操作栏 */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                markTaskDone("task-academic-block");
                                toast.success("已标记得理证明块实操掌握！");
                            }}
                            className="h-7 text-xs px-2.5 bg-background rounded-lg gap-1"
                        >
                            <Layers className="h-3 w-3 text-purple-500" />
                            了解定理块 (任务3)
                        </Button>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                markTaskDone("task-math");
                                toast.success("已标记 LaTeX 数学公式实操掌握！");
                            }}
                            className="h-7 text-xs px-2.5 bg-background rounded-lg gap-1"
                        >
                            <Sigma className="h-3 w-3 text-amber-500" />
                            了解 LaTeX 公式 (任务2)
                        </Button>
                    </div>
                </div>

                {/* 挂载真实 NovelEditor */}
                <div
                    onMouseUp={handleMouseUpInEditor}
                    className="min-h-[460px] rounded-2xl border border-border/60 bg-background/90 p-4 sm:p-6 shadow-inner"
                >
                    <NovelEditor
                        initialValue={sampleAcademicContent}
                        onChange={handleEditorChange}
                        className="w-full min-h-[420px] bg-transparent"
                    />
                </div>
            </div>

            {/* 底部导航操作条 */}
            <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-muted-foreground">
                    第 1 步 / 共 6 步 · 学术创作与编辑器
                </span>

                <Button
                    size="lg"
                    onClick={onNext}
                    className="h-11 px-6 rounded-2xl bg-gradient-to-r from-primary to-violet-600 text-white font-bold shadow-lg shadow-primary/25 gap-2 hover:opacity-95 cursor-pointer"
                >
                    下一步：论文排版与 PDF 导出
                    <ArrowRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
