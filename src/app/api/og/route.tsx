import { ImageResponse } from "@vercel/og";
import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";

// 使用 nodejs runtime（@vercel/og 自动处理 WASM）
export const runtime = "edge";

// 主题配置
const themes = {
    dark: {
        background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
        titleColor: "#ffffff",
        summaryColor: "#94a3b8",
        authorColor: "#e2e8f0",
        accentColor: "#8b5cf6",
        tagBg: "rgba(139, 92, 246, 0.3)",
        tagColor: "#a78bfa",
    },
    light: {
        background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 50%, #f1f5f9 100%)",
        titleColor: "#1f2937",
        summaryColor: "#64748b",
        authorColor: "#374151",
        accentColor: "#3b82f6",
        tagBg: "rgba(59, 130, 246, 0.15)",
        tagColor: "#3b82f6",
    },
    academic: {
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)",
        titleColor: "#38bdf8",
        summaryColor: "#94a3b8",
        authorColor: "#e2e8f0",
        accentColor: "#38bdf8",
        tagBg: "rgba(56, 189, 248, 0.2)",
        tagColor: "#38bdf8",
    },
};

// 从内容中提取纯文本
function extractTextFromContent(content: unknown): string {
    if (!content || typeof content !== "object") return "";

    let text = "";
    const traverse = (node: Record<string, unknown>) => {
        if (node.type === "text" && typeof node.text === "string") {
            text += node.text + " ";
        }
        if (node.content && Array.isArray(node.content)) {
            node.content.forEach(traverse);
        }
    };

    const contentObj = content as Record<string, unknown>;
    if (contentObj.content && Array.isArray(contentObj.content)) {
        contentObj.content.forEach(traverse);
    }

    return text.trim().slice(0, 200);
}

// 生成简单摘要
function generateSimpleSummary(text: string, maxLength: number = 80): string {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength - 3) + "...";
}

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const postId = searchParams.get("postId");
    const themeName = (searchParams.get("theme") || "dark") as keyof typeof themes;

    if (!postId) {
        return new Response("Missing postId parameter", { status: 400 });
    }

    const theme = themes[themeName] || themes.dark;

    try {
        // 获取帖子数据
        const supabase = await createClient();
        const { data: post, error } = await supabase
            .from("posts")
            .select(`
                id,
                title,
                content,
                tags,
                author:profiles!author_id (
                    username,
                    full_name,
                    avatar_url
                )
            `)
            .eq("id", postId)
            .single();

        if (error || !post) {
            return new Response("Post not found", { status: 404 });
        }

        // 提取文本并生成摘要
        const textContent = extractTextFromContent(post.content);
        const summary = generateSimpleSummary(textContent, 80);

        // 作者信息
        const author = post.author as { username?: string; full_name?: string; avatar_url?: string } | null;
        const authorName = author?.full_name || author?.username || "匿名用户";
        const authorInitials = (author?.username || "?").slice(0, 2).toUpperCase();
        const title = post.title.length > 60 ? post.title.slice(0, 57) + "..." : post.title;
        const tags = (post.tags || []).slice(0, 3);

        // 使用 @vercel/og 的 ImageResponse
        return new ImageResponse(
            (
                <div
                    style={{
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        padding: "60px",
                        background: theme.background,
                        fontFamily: "sans-serif",
                    }}
                >
                    {/* Logo / 品牌区 */}
                    <div style={{ display: "flex", alignItems: "center" }}>
                        <div
                            style={{
                                width: "40px",
                                height: "40px",
                                borderRadius: "10px",
                                background: theme.accentColor,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "#ffffff",
                                fontSize: "20px",
                                fontWeight: "bold",
                                marginRight: "12px",
                            }}
                        >
                            S
                        </div>
                        <span
                            style={{
                                fontSize: "24px",
                                fontWeight: 600,
                                color: theme.titleColor,
                            }}
                        >
                            Scholarly
                        </span>
                    </div>

                    {/* 主内容区 */}
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            flex: 1,
                            justifyContent: "center",
                            marginTop: "20px",
                            marginBottom: "20px",
                        }}
                    >
                        {/* 标签 */}
                        {tags.length > 0 && (
                            <div style={{ display: "flex", marginBottom: "20px" }}>
                                {tags.map((tag: string, i: number) => (
                                    <span
                                        key={i}
                                        style={{
                                            padding: "8px 16px",
                                            background: theme.tagBg,
                                            color: theme.tagColor,
                                            borderRadius: "20px",
                                            fontSize: "14px",
                                            fontWeight: 500,
                                            marginRight: "8px",
                                        }}
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* 标题 */}
                        <h1
                            style={{
                                fontSize: title.length > 40 ? "36px" : "48px",
                                fontWeight: "bold",
                                color: theme.titleColor,
                                lineHeight: 1.3,
                                margin: 0,
                                marginBottom: "20px",
                            }}
                        >
                            {title}
                        </h1>

                        {/* 摘要 */}
                        {summary && (
                            <p
                                style={{
                                    fontSize: "20px",
                                    color: theme.summaryColor,
                                    lineHeight: 1.6,
                                    margin: 0,
                                }}
                            >
                                {summary}
                            </p>
                        )}
                    </div>

                    {/* 作者信息 */}
                    <div style={{ display: "flex", alignItems: "center" }}>
                        {author?.avatar_url ? (
                            <img
                                src={author.avatar_url}
                                width={56}
                                height={56}
                                style={{
                                    borderRadius: "50%",
                                    marginRight: "16px",
                                }}
                            />
                        ) : (
                            <div
                                style={{
                                    width: "56px",
                                    height: "56px",
                                    borderRadius: "50%",
                                    background: `linear-gradient(135deg, ${theme.accentColor}, ${theme.tagColor})`,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: "#ffffff",
                                    fontSize: "20px",
                                    fontWeight: "bold",
                                    marginRight: "16px",
                                }}
                            >
                                {authorInitials}
                            </div>
                        )}
                        <div style={{ display: "flex", flexDirection: "column" }}>
                            <span
                                style={{
                                    fontSize: "18px",
                                    fontWeight: 600,
                                    color: theme.authorColor,
                                }}
                            >
                                {authorName}
                            </span>
                            <span
                                style={{
                                    fontSize: "14px",
                                    color: theme.summaryColor,
                                }}
                            >
                                学术分享
                            </span>
                        </div>
                    </div>
                </div>
            ),
            {
                width: 1200,
                height: 630,
            }
        );
    } catch (error) {
        console.error("OG image generation error:", error);
        return new Response(`Failed to generate image: ${error}`, { status: 500 });
    }
}
