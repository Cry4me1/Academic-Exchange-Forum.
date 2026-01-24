import { deleteFromR2, uploadToR2 } from "@/lib/r2";
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// 文件大小限制：10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// 允许的文件类型（扩展列表，支持更多类型）
const ALLOWED_TYPES: Record<string, string[]> = {
    // 图片
    image: ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"],
    // 视频
    video: ["video/mp4", "video/webm", "video/ogg", "video/quicktime"],
    // 文档
    document: [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-powerpoint",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "text/plain",
        "text/markdown",
        "text/csv",
    ],
    // 压缩包
    archive: [
        "application/zip",
        "application/x-rar-compressed",
        "application/x-7z-compressed",
        "application/gzip",
    ],
    // 代码
    code: [
        "application/json",
        "application/javascript",
        "text/html",
        "text/css",
        "application/xml",
    ],
};

// 获取所有允许的 MIME 类型
const ALL_ALLOWED_TYPES = Object.values(ALLOWED_TYPES).flat();

// 获取文件类别
function getFileCategory(mimeType: string): string {
    for (const [category, types] of Object.entries(ALLOWED_TYPES)) {
        if (types.includes(mimeType)) {
            return category;
        }
    }
    return "other";
}

export async function POST(request: NextRequest) {
    try {
        // 验证用户身份
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: "未授权" },
                { status: 401 }
            );
        }

        const formData = await request.formData();
        const file = formData.get("file") as File | null;
        const messageId = formData.get("messageId") as string | null;

        if (!file) {
            return NextResponse.json(
                { error: "未找到文件" },
                { status: 400 }
            );
        }

        if (!messageId) {
            return NextResponse.json(
                { error: "缺少消息 ID" },
                { status: 400 }
            );
        }

        // 验证消息所有权
        const { data: message, error: msgError } = await supabase
            .from("messages")
            .select("sender_id")
            .eq("id", messageId)
            .single();

        if (msgError || !message) {
            return NextResponse.json(
                { error: "消息不存在" },
                { status: 404 }
            );
        }

        if (message.sender_id !== user.id) {
            return NextResponse.json(
                { error: "无权操作此消息" },
                { status: 403 }
            );
        }

        // 验证文件大小
        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json(
                { error: `文件大小不能超过 10MB，当前大小：${(file.size / 1024 / 1024).toFixed(2)}MB` },
                { status: 400 }
            );
        }

        // 验证文件类型
        if (!ALL_ALLOWED_TYPES.includes(file.type)) {
            return NextResponse.json(
                { error: `不支持的文件类型：${file.type}` },
                { status: 400 }
            );
        }

        // 生成唯一文件名
        const fileExt = file.name.split(".").pop() || "bin";
        const uniqueFileName = `${user.id}/${Date.now()}_${Math.random().toString(36).substring(2, 10)}.${fileExt}`;

        // 上传到 R2
        const buffer = Buffer.from(await file.arrayBuffer());
        const publicUrl = await uploadToR2(buffer, uniqueFileName, file.type);

        // 计算过期时间（7天后）
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        // 保存附件记录
        const { data: attachment, error: attachError } = await supabase
            .from("message_attachments")
            .insert({
                message_id: messageId,
                file_name: file.name,
                file_type: file.type,
                file_size: file.size,
                storage_path: uniqueFileName,
                public_url: publicUrl,
                expires_at: expiresAt.toISOString(),
            })
            .select()
            .single();

        if (attachError) {
            console.error("保存附件记录失败:", attachError);
            // 尝试删除已上传的文件
            await deleteFromR2(publicUrl);
            return NextResponse.json(
                { error: "保存附件记录失败" },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            attachment: {
                id: attachment.id,
                fileName: file.name,
                fileType: file.type,
                fileSize: file.size,
                category: getFileCategory(file.type),
                publicUrl,
                expiresAt: expiresAt.toISOString(),
            },
        });
    } catch (error) {
        console.error("上传处理失败:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "上传失败" },
            { status: 500 }
        );
    }
}
