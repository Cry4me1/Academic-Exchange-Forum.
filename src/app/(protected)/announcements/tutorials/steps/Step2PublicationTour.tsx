"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { AcademicPdfExportDialog } from "@/components/posts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    BookOpen,
    Printer,
    Columns2,
    AlignJustify,
    ArrowLeft,
    ArrowRight,
    ListTree,
    Sparkles,
    Loader2,
} from "lucide-react";
import { type JSONContent } from "novel";
import { TutorialTaskChecklist, TaskItem } from "@/components/tutorials/TutorialTaskChecklist";

const NovelViewer = dynamic(() => import("@/components/editor/NovelViewer"), {
    ssr: false,
    loading: () => (
        <div className="flex flex-col items-center justify-center min-h-[300px] text-muted-foreground gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
            <p className="text-xs">正在渲染论文出版排版...</p>
        </div>
    ),
});

interface Step2PublicationTourProps {
    onPrev: () => void;
    onNext: () => void;
}

const samplePublicationContent: JSONContent = {
    type: "doc",
    content: [
        {
            type: "heading",
            attrs: { level: 2 },
            content: [{ type: "text", text: "基于拓扑超导量子比特的高容错逻辑门实现" }],
        },
        {
            type: "paragraph",
            content: [
                {
                    type: "text",
                    text: "拓扑量子计算因其非阿贝尔任意子的编织统计特性，在硬件底层具备内在的拓扑保护能力，能够天然抑制退相干噪声。",
                },
            ],
        },
        {
            type: "academicBlock",
            attrs: { type: "theorem", label: "马约拉纳零能模存在性引理" },
            content: [
                {
                    type: "paragraph",
                    content: [
                        {
                            type: "text",
                            text: "在纳米超导导线两端，当外加塞曼能分裂大于超导能隙时，系统处于拓扑非平庸态，两端各存在一个局域的零能马约拉纳束缚态。",
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
                    text: "实验测得逻辑量子比特的相干时间较传统超导传输子提升了两个数量级，验证了大规模容错量子计算的工程可行性。",
                },
            ],
        },
    ],
};

const STATIC_CREATED_AT = "2026-08-22T08:00:00.000Z";

const initialTasks: TaskItem[] = [
    {
        id: "switch-column",
        title: "1. 切换出版级 Nature 双栏排版",
        description: "点击右上角‘切换 Nature 双栏’按钮，观察文章自适应切换为紧凑的双栏顶刊排版模式。",
        isCompleted: false,
    },
    {
        id: "toc-jump",
        title: "2. 体验智能 TOC 目录定位与要素脉冲",
        description: "点击右侧目录中的引理条目，页面平滑滚动至对应定理并触发呼吸高亮脉冲。",
        isCompleted: false,
    },
    {
        id: "pdf-dialog",
        title: "3. 打开标准学术 PDF 导出面板",
        description: "点击‘导出学术 PDF’按钮，体验 Nature 与 IEEE 双栏出版模板的配置与导出预览。",
        isCompleted: false,
    },
];

export function Step2PublicationTour({ onPrev, onNext }: Step2PublicationTourProps) {
    const [tasks, setTasks] = useState<TaskItem[]>(initialTasks);
    const [isTwoColumn, setIsTwoColumn] = useState(false);
    const [showPdfDialog, setShowPdfDialog] = useState(false);

    const markTaskDone = (id: string) => {
        setTasks((prev) =>
            prev.map((t) => (t.id === id ? { ...t, isCompleted: true } : t))
        );
    };

    const handleToggleColumns = () => {
        setIsTwoColumn(!isTwoColumn);
        markTaskDone("switch-column");
    };

    const handleOpenPdf = () => {
        setShowPdfDialog(true);
        markTaskDone("pdf-dialog");
    };

    const mockPost = {
        id: "tutorial-sample-post-1",
        title: "基于拓扑超导量子比特的高容错逻辑门实现",
        created_at: STATIC_CREATED_AT,
        author: {
            username: "Scholarly 量子研究组",
            is_verified: true,
            special_title: "量子拓扑学者",
        },
        tags: ["Quantum Computing", "Physics", "Topology"],
    };

    return (
        <div className="space-y-6">
            {/* 顶栏实操任务清单卡片 */}
            <TutorialTaskChecklist
                tasks={tasks}
                stepTitle="Step 2 · 体验顶刊出版排版与 PDF 导出"
                stepBadge="3 大实操子任务"
                hintText="点击右上角按钮可一键切换 Nature/IEEE 双栏排版，点击“导出学术 PDF”可打开真实配置面板。"
            />

            {/* 宽幅真实阅读器容器 */}
            <div className="rounded-3xl border border-border/80 bg-card/85 backdrop-blur-2xl shadow-xl p-5 sm:p-7 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/50 pb-3">
                    <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600">
                            <BookOpen className="h-4 w-4" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-foreground">
                                真实学术阅读引擎 (Live NovelViewer)
                            </h3>
                            <p className="text-xs text-muted-foreground">
                                Nature / IEEE 出版级排版与矢量公式自适应
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleToggleColumns}
                            className="h-8 text-xs gap-1.5 bg-background rounded-xl"
                        >
                            {isTwoColumn ? <AlignJustify className="h-3.5 w-3.5" /> : <Columns2 className="h-3.5 w-3.5" />}
                            <span>{isTwoColumn ? "切换单栏" : "切换 Nature 双栏"}</span>
                        </Button>

                        <Button
                            size="sm"
                            onClick={handleOpenPdf}
                            className="h-8 text-xs gap-1.5 bg-gradient-to-r from-indigo-500 to-primary text-white shadow-sm rounded-xl"
                        >
                            <Printer className="h-3.5 w-3.5" />
                            导出学术 PDF
                        </Button>
                    </div>
                </div>

                {/* 挂载真实 NovelViewer 内容阅读器 */}
                <div className="rounded-2xl border border-border/60 bg-background/90 p-5 sm:p-8 shadow-inner min-h-[380px]">
                    <div className={`transition-all duration-300 ${isTwoColumn ? "sm:columns-2 sm:gap-8" : "max-w-3xl mx-auto"}`}>
                        <NovelViewer content={samplePublicationContent} />
                    </div>
                </div>
            </div>

            {/* 底部导航操作条 */}
            <div className="flex items-center justify-between pt-2">
                <Button
                    variant="ghost"
                    size="lg"
                    onClick={onPrev}
                    className="h-11 px-5 rounded-2xl text-muted-foreground hover:text-foreground gap-2 cursor-pointer"
                >
                    <ArrowLeft className="h-4 w-4" />
                    上一步：学术编辑器
                </Button>

                <Button
                    size="lg"
                    onClick={onNext}
                    className="h-11 px-6 rounded-2xl bg-gradient-to-r from-primary to-violet-600 text-white font-bold shadow-lg shadow-primary/25 gap-2 hover:opacity-95 cursor-pointer"
                >
                    下一步：学术决斗竞技场
                    <ArrowRight className="h-4 w-4" />
                </Button>
            </div>

            {/* 真实学术 PDF 导出弹窗 */}
            <AcademicPdfExportDialog
                open={showPdfDialog}
                onOpenChange={setShowPdfDialog}
                post={mockPost}
            />
        </div>
    );
}
