import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generatePostEmbedding } from "@/lib/post-embed";

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const supabase = await createClient();

        // 验证用户身份
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: "未认证" }, { status: 401 });
        }

        // 获取帖子作者信息
        const { data: post, error: postError } = await supabase
            .from("posts")
            .select("id, author_id")
            .eq("id", id)
            .single();

        if (postError || !post) {
            return NextResponse.json({ error: "帖子不存在" }, { status: 404 });
        }

        // 仅作者或管理员可以手动触发 embedding
        if (post.author_id !== user.id) {
            return NextResponse.json({ error: "无权操作" }, { status: 403 });
        }

        // 执行向量化计算与更新
        const result = await generatePostEmbedding(id);

        if (result.error) {
            return NextResponse.json({ error: result.error }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("Embed API Route error:", err);
        return NextResponse.json({ error: "内部服务器错误" }, { status: 500 });
    }
}
