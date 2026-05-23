import { NextRequest, NextResponse } from "next/server";

interface LiteratureResult {
    source_type: "arxiv" | "doi";
    source_id: string;
    title: string;
    authors: string[];
    published_at: string | null;
    summary: string;
    pdf_url: string | null;
    journal: string | null;
}

export async function GET(request: NextRequest) {
    const identifier = request.nextUrl.searchParams.get("id")?.trim();

    if (!identifier) {
        return NextResponse.json({ error: "缺少 id 参数" }, { status: 400 });
    }

    try {
        let result: LiteratureResult | null = null;

        // 判断 arXiv 还是 DOI
        const arxivMatch = identifier.match(
            /(?:arXiv:)?(\d{4}\.\d{4,5}(?:v\d+)?)/i
        );
        const doiMatch = identifier.match(
            /(?:https?:\/\/doi\.org\/)?(\d{2}\.\d{4,}\/\S+)/i
        );

        if (arxivMatch) {
            result = await fetchArxivMetadata(arxivMatch[1]);
        } else if (doiMatch) {
            result = await fetchDOIMetadata(doiMatch[1]);
        } else {
            return NextResponse.json(
                { error: "无法识别的文献标识符，请使用 arXiv:XXXX.XXXX 或 DOI 格式" },
                { status: 400 }
            );
        }

        if (!result) {
            return NextResponse.json(
                { error: "未找到该文献" },
                { status: 404 }
            );
        }

        return NextResponse.json(result);
    } catch (err) {
        console.error("Literature parse error:", err);
        return NextResponse.json(
            { error: "文献解析失败" },
            { status: 500 }
        );
    }
}

/**
 * 从 arXiv API 获取论文元数据
 */
async function fetchArxivMetadata(
    arxivId: string
): Promise<LiteratureResult | null> {
    const url = `https://export.arxiv.org/api/query?id_list=${arxivId}`;
    const res = await fetch(url, { next: { revalidate: 3600 } });

    if (!res.ok) return null;

    const xml = await res.text();

    // 简单 XML 解析（Edge Runtime 兼容）
    const titleMatch = xml.match(/<title[^>]*>([\s\S]*?)<\/title>/g);
    const title = titleMatch?.[1]
        ?.replace(/<\/?title[^>]*>/g, "")
        ?.replace(/\s+/g, " ")
        ?.trim();

    if (!title) return null;

    const summaryMatch = xml.match(/<summary[^>]*>([\s\S]*?)<\/summary>/);
    const summary = summaryMatch?.[1]?.replace(/\s+/g, " ")?.trim() || "";

    const authorMatches = xml.matchAll(/<name>(.*?)<\/name>/g);
    const authors: string[] = [];
    for (const match of authorMatches) {
        authors.push(match[1].trim());
    }

    const publishedMatch = xml.match(/<published>(.*?)<\/published>/);
    const published_at = publishedMatch?.[1] || null;

    const pdfUrl = `https://arxiv.org/pdf/${arxivId}.pdf`;

    // 尝试提取 journal_ref
    const journalMatch = xml.match(
        /<arxiv:journal_ref[^>]*>(.*?)<\/arxiv:journal_ref>/
    );
    const journal = journalMatch?.[1]?.trim() || null;

    return {
        source_type: "arxiv",
        source_id: `arXiv:${arxivId}`,
        title,
        authors,
        published_at,
        summary,
        pdf_url: pdfUrl,
        journal,
    };
}

/**
 * 从 CrossRef API 获取 DOI 论文元数据
 */
async function fetchDOIMetadata(
    doi: string
): Promise<LiteratureResult | null> {
    const url = `https://api.crossref.org/works/${encodeURIComponent(doi)}`;
    const res = await fetch(url, {
        headers: {
            Accept: "application/json",
            "User-Agent": "Scholarly/1.0 (mailto:dev@scholarly.wiki)",
        },
        next: { revalidate: 3600 },
    });

    if (!res.ok) return null;

    const data = await res.json();
    const work = data?.message;

    if (!work) return null;

    const title =
        work.title?.[0]?.replace(/\s+/g, " ")?.trim() || "未知标题";

    const authors = (work.author || []).map(
        (a: { given?: string; family?: string }) =>
            [a.given, a.family].filter(Boolean).join(" ")
    );

    // 发表日期
    const dateParts = work.published?.["date-parts"]?.[0];
    const published_at = dateParts
        ? new Date(dateParts[0], (dateParts[1] || 1) - 1, dateParts[2] || 1).toISOString()
        : null;

    const summary = work.abstract
        ? work.abstract.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim()
        : "";

    const journal =
        work["container-title"]?.[0] || work.publisher || null;

    // PDF URL (尝试从 link 中提取)
    const pdfLink = work.link?.find(
        (l: { "content-type"?: string; URL?: string }) =>
            l["content-type"] === "application/pdf"
    );
    const pdf_url = pdfLink?.URL || null;

    return {
        source_type: "doi",
        source_id: `doi:${doi}`,
        title,
        authors,
        published_at,
        summary,
        pdf_url,
        journal,
    };
}
