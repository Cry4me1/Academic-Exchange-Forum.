
import { getFileStream } from "@/lib/r2";
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { Readable } from "stream";

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const attachmentId = searchParams.get("attachmentId");

    if (!attachmentId) {
        return NextResponse.json({ error: "缺少 attachmentId" }, { status: 400 });
    }

    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "未授权" }, { status: 401 });
        }

        // 1. 获取附件信息
        const { data: attachment, error: attachError } = await supabase
            .from("message_attachments")
            .select("*, message:messages(sender_id, receiver_id)")
            .eq("id", attachmentId)
            .single();

        if (attachError || !attachment) {
            return NextResponse.json({ error: "附件不存在" }, { status: 404 });
        }

        // 2. 验证权限
        // @ts-ignore
        const message = attachment.message;
        if (message.sender_id !== user.id && message.receiver_id !== user.id) {
            return NextResponse.json({ error: "无权访问此附件" }, { status: 403 });
        }

        // 3. 获取文件流
        const fileStream = await getFileStream(attachment.storage_path);

        if (!fileStream) {
            return NextResponse.json({ error: "文件读取失败" }, { status: 500 });
        }

        // 4. 返回流式响应
        // @ts-ignore - ReadableStream/Node Stream compatibility
        const stream = Readable.fromWeb(fileStream.transformToWebStream());

        return new NextResponse(stream as any, {
            headers: {
                "Content-Disposition": `attachment; filename="${encodeURIComponent(attachment.file_name)}"`,
                "Content-Type": attachment.file_type || "application/octet-stream",
                "Content-Length": attachment.file_size.toString(),
            },
        });

    } catch (error) {
        console.error("下载失败:", error);
        return NextResponse.json(
            { error: "服务器内部错误" },
            { status: 500 }
        );
    }
}
