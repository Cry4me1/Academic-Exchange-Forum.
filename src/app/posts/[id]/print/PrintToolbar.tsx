"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, Columns2, Printer, Square } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

interface PrintToolbarProps {
    postId: string;
    currentLayout: string;
}

export function PrintToolbar({ postId, currentLayout }: PrintToolbarProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const switchLayout = (newLayout: "single" | "double") => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("layout", newLayout);
        router.push(`/posts/${postId}/print?${params.toString()}`);
    };

    return (
        <aside
            aria-label="打印工具栏"
            className="print:hidden sticky top-4 z-50 max-w-4xl mx-auto mb-6 bg-slate-900/90 text-white backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-xl flex items-center justify-between gap-3 text-xs"
        >
            <div className="flex items-center gap-2">
                <Link href={`/posts/${postId}`}>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 text-slate-300 hover:text-white hover:bg-slate-800 text-xs gap-1.5"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        返回文章
                    </Button>
                </Link>

                <div className="h-4 w-px bg-slate-700 mx-1" />

                {/* 单双栏切换 */}
                <div className="flex items-center gap-1 bg-slate-800 p-0.5 rounded-lg border border-slate-700">
                    <button
                        type="button"
                        onClick={() => switchLayout("single")}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                            currentLayout === "single"
                                ? "bg-blue-600 text-white shadow-xs"
                                : "text-slate-400 hover:text-white"
                        }`}
                    >
                        <Square className="w-3 h-3" />
                        单栏预印本
                    </button>
                    <button
                        type="button"
                        onClick={() => switchLayout("double")}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                            currentLayout === "double"
                                ? "bg-purple-600 text-white shadow-xs"
                                : "text-slate-400 hover:text-white"
                        }`}
                    >
                        <Columns2 className="w-3 h-3" />
                        双栏期刊
                    </button>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <Button
                    type="button"
                    size="sm"
                    onClick={() => window.print()}
                    className="h-8 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-3 gap-1.5 shadow-xs"
                >
                    <Printer className="w-3.5 h-3.5" />
                    调起打印 / 保存为 PDF
                </Button>
            </div>
        </aside>
    );
}

export default PrintToolbar;
