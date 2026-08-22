import { createClient } from "@/lib/supabase/server";
import { academicToLatex, academicToMarkdown } from "@/lib/academic-meta";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const { searchParams } = new URL(request.url);
        const format = (searchParams.get("format") || "latex").toLowerCase();

        const supabase = await createClient();

        // 1. 查询帖子内容及作者信息
        const { data: post, error } = await supabase
            .from("posts")
            .select(`
                id,
                title,
                content,
                created_at,
                author:profiles!author_id(username)
            `)
            .eq("id", id)
            .maybeSingle();

        if (error || !post) {
            return NextResponse.json(
                { error: error?.message || "未找到对应的学术帖子" },
                { status: 404 }
            );
        }

        const safeTitle = (post.title || "scholarly-post")
            .replace(/[/\\?%*:|"<>]/g, "_")
            .trim() || "scholarly-post";

        // 2. 根据格式进行学术源码渲染并返回下载流
        if (format === "latex" || format === "tex") {
            const latexSource = academicToLatex({
                title: post.title,
                author: { username: (post.author as any)?.username },
                content: post.content,
                created_at: post.created_at,
            });

            const encodedFilename = encodeURIComponent(`${safeTitle}.tex`);

            return new NextResponse(latexSource, {
                headers: {
                    "Content-Type": "application/x-tex; charset=utf-8",
                    // 标准 RFC 6266 Header 规范：filename 用 ASCII fallback，filename* 用 UTF-8 编码，彻底杜绝中文 header 报错
                    "Content-Disposition": `attachment; filename="export.tex"; filename*=UTF-8''${encodedFilename}`,
                    "Cache-Control": "no-cache",
                },
            });
        }

        // 默认或指定 markdown 格式导出
        const markdownSource = academicToMarkdown({
            title: post.title,
            author: { username: (post.author as any)?.username },
            content: post.content,
            created_at: post.created_at,
        });

        const encodedFilename = encodeURIComponent(`${safeTitle}.md`);

        return new NextResponse(markdownSource, {
            headers: {
                "Content-Type": "text/markdown; charset=utf-8",
                "Content-Disposition": `attachment; filename="export.md"; filename*=UTF-8''${encodedFilename}`,
                "Cache-Control": "no-cache",
            },
        });
    } catch (err: any) {
        console.error("[/api/posts/[id]/export] 导出失败:", err);
        return NextResponse.json(
            { error: err?.message || "导出服务发生异常，请稍后重试" },
            { status: 500 }
        );
    }
}
