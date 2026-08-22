import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { extractAcademicMeta } from "@/lib/academic-meta";
import NovelViewer from "@/components/editor/NovelViewer";
import { Badge } from "@/components/ui/badge";
import {
    Sparkles,
    Printer,
    ArrowLeft,
    FileText,
    Calendar,
    User,
    Columns2,
    Square,
    BookOpen,
} from "lucide-react";
import Link from "next/link";
import { PrintToolbar } from "./PrintToolbar";

interface PrintPageProps {
    params: Promise<{ id: string }>;
    searchParams: Promise<{
        layout?: string;
        synopsis?: string;
        bibtex?: string;
    }>;
}

export default async function AcademicPrintPage({
    params,
    searchParams,
}: PrintPageProps) {
    const { id } = await params;
    const { layout = "single", synopsis = "true", bibtex = "true" } =
        await searchParams;

    const isDoubleColumn = layout === "double";
    const showSynopsis = synopsis === "true";
    const showBibtex = bibtex === "true";

    const supabase = await createClient();

    // 1. 查询帖子详情
    const { data: post, error } = await supabase
        .from("posts")
        .select(`
            id,
            title,
            content,
            tags,
            created_at,
            author:profiles!author_id (
                id,
                username,
                special_title,
                is_verified
            )
        `)
        .eq("id", id)
        .maybeSingle();

    if (error || !post) {
        notFound();
    }

    const academicMeta = extractAcademicMeta(post.content);
    const author = post.author as any;

    const formattedDate = new Date(post.created_at).toLocaleDateString("zh-CN", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });

    const bibtexSnippet = `@article{scholarly_${post.id.substring(0, 8)},
  title = {${post.title}},
  author = {${author?.username || "Scholarly Author"}},
  journal = {Scholarly Academic Exchange Forum},
  year = {${new Date(post.created_at).getFullYear()}},
  url = {https://scholarly.forum/posts/${post.id}}
}`;

    return (
        <div className="min-h-screen bg-white text-slate-900 font-serif selection:bg-blue-100 p-0 md:p-8 print:p-0">
            {/* 仅屏幕显示的悬浮工具条 */}
            <PrintToolbar postId={post.id} currentLayout={layout} />

            {/* A4 打印与 PDF 渲染主体 */}
            <article className="max-w-[210mm] mx-auto bg-white p-6 sm:p-12 print:p-0 print:max-w-none shadow-sm print:shadow-none">
                {/* 顶部学术页眉 (Running Header) */}
                <header className="border-b-2 border-slate-900 pb-3 mb-8 flex items-center justify-between text-xs font-sans text-slate-600 tracking-wider uppercase">
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">
                            SCHOLARLY PREPRINT
                        </span>
                        <span>·</span>
                        <span>ISSN 2834-920X</span>
                        <span>·</span>
                        <span>VOL. {new Date(post.created_at).getFullYear()}</span>
                    </div>
                    <div className="text-right">
                        <span>POST ID: {post.id.substring(0, 13)}</span>
                    </div>
                </header>

                {/* 论文大标题 */}
                <div className="text-center my-6">
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 leading-tight mb-4 font-serif">
                        {post.title}
                    </h1>

                    {/* 作者与机构信息 */}
                    <div className="flex flex-wrap items-center justify-center gap-3 text-sm font-sans text-slate-700 mb-4">
                        <span className="font-semibold text-slate-900">
                            {author?.username || "匿名学者"}
                        </span>
                        {author?.special_title && (
                            <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-sm border border-slate-200">
                                {author.special_title}
                            </span>
                        )}
                        <span>·</span>
                        <span className="text-xs text-slate-500">
                            发表于 {formattedDate}
                        </span>
                    </div>

                    {/* 关键词/标签 */}
                    {post.tags && post.tags.length > 0 && (
                        <div className="flex flex-wrap justify-center gap-1.5 font-sans text-xs">
                            <span className="font-semibold text-slate-600 mr-1">
                                Keywords:
                            </span>
                            {post.tags.map((tag: string) => (
                                <span
                                    key={tag}
                                    className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded text-[11px] font-medium"
                                >
                                    {tag}
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                {/* 摘要与学术要素速览栏 */}
                {showSynopsis && (
                    <div className="my-6 p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs font-sans">
                        <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-200 font-semibold text-slate-800 uppercase tracking-wider text-[11px]">
                            <span className="flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                                学术要素提要 (Academic Synopsis)
                            </span>
                            <span>Scholarly Indexed</span>
                        </div>
                        <div className="flex flex-wrap gap-4 text-slate-600 text-xs">
                            <div>
                                <strong className="text-slate-900">
                                    学术定理/环境块:
                                </strong>{" "}
                                {academicMeta.totalAcademicCount} 处
                            </div>
                            <div>
                                <strong className="text-slate-900">
                                    定义与引理:
                                </strong>{" "}
                                {academicMeta.definitions.length +
                                    academicMeta.theorems.filter(
                                        (t) => t.type === "lemma"
                                    ).length}{" "}
                                处
                            </div>
                            <div>
                                <strong className="text-slate-900">
                                    证明与推导:
                                </strong>{" "}
                                {academicMeta.proofs.length} 处
                            </div>
                            <div>
                                <strong className="text-slate-900">
                                    交叉引用/边注:
                                </strong>{" "}
                                {academicMeta.crossRefCount +
                                    academicMeta.sidenoteCount}{" "}
                                处
                            </div>
                        </div>
                    </div>
                )}

                {/* 正文区域（支持单栏或双栏分栏流式排版） */}
                <main
                    className={
                        isDoubleColumn
                            ? "academic-two-column font-serif leading-relaxed text-slate-800 text-sm"
                            : "academic-single-column font-serif leading-relaxed text-slate-800 text-[15px]"
                    }
                >
                    <div className="prose prose-slate max-w-none dark:prose-invert">
                        <NovelViewer initialValue={post.content} />
                    </div>
                </main>

                {/* 文末参考文献与 BibTeX 引用代码 */}
                {showBibtex && (
                    <section className="mt-12 pt-6 border-t-2 border-slate-900 font-sans text-xs break-inside-avoid">
                        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">
                            引用此文献 (How to Cite)
                        </h2>
                        <p className="text-slate-600 mb-2">
                            若在您的研究或论文中参考了本文成果，请引用如下 BibTeX 条目：
                        </p>
                        <pre className="p-3.5 rounded-lg bg-slate-900 text-slate-100 font-mono text-[11px] overflow-x-auto leading-normal">
                            {bibtexSnippet}
                        </pre>
                    </section>
                )}

                {/* 学术页脚 (Footer) */}
                <footer className="mt-12 pt-4 border-t border-slate-300 flex items-center justify-between text-[11px] font-sans text-slate-500">
                    <div>
                        <span>© {new Date().getFullYear()} Scholarly Academic Platform. All Rights Reserved.</span>
                    </div>
                    <div>
                        <span>Page 1 · Published under Open Academic Exchange</span>
                    </div>
                </footer>
            </article>
        </div>
    );
}
