import { deleteFromR2, isR2Configured, isR2Url, uploadToR2 } from "@/lib/r2";
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const runtime = 'edge';

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

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

        if (!file) {
            return NextResponse.json(
                { error: "未找到文件" },
                { status: 400 }
            );
        }

        // 验证文件大小
        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json(
                { error: `图片大小不能超过 2MB，当前大小：${(file.size / 1024 / 1024).toFixed(2)}MB` },
                { status: 400 }
            );
        }

        // 验证文件类型
        if (!ALLOWED_TYPES.includes(file.type)) {
            return NextResponse.json(
                { error: "不支持的文件类型，请上传 JPEG、PNG、GIF 或 WebP 格式的图片" },
                { status: 400 }
            );
        }

        // 生成唯一文件名
        const fileExt = file.name.split(".").pop() || "jpg";
        const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;

        // 检查是否配置了 R2，如果没有则降级到 Supabase
        if (isR2Configured()) {
            // 使用 R2 上传 (使用 Uint8Array 代替 Buffer 以兼容 Edge Runtime)
            const arrayBuffer = await file.arrayBuffer();
            const uint8Array = new Uint8Array(arrayBuffer);
            const publicUrl = await uploadToR2(uint8Array, fileName, file.type);

            return NextResponse.json({ url: publicUrl });
        } else {
            // 降级：使用 Supabase Storage
            const { error: uploadError } = await supabase.storage
                .from("post-images")
                .upload(fileName, file, {
                    cacheControl: "3600",
                    upsert: false,
                });

            if (uploadError) {
                throw uploadError;
            }

            const { data: { publicUrl } } = supabase.storage
                .from("post-images")
                .getPublicUrl(fileName);

            return NextResponse.json({ url: publicUrl });
        }
    } catch (error) {
        console.error("上传失败:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "上传失败" },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest) {
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

        const { url } = await request.json();

        if (!url || typeof url !== "string") {
            return NextResponse.json(
                { error: "未提供有效的 URL" },
                { status: 400 }
            );
        }

        // 根据 URL 类型删除
        if (isR2Url(url)) {
            await deleteFromR2(url);
            return NextResponse.json({ success: true });
        } else if (url.includes(".supabase.co/storage")) {
            // Supabase Storage 删除
            const urlObj = new URL(url);
            const pathParts = urlObj.pathname.split('/');
            const bucketIndex = pathParts.indexOf('post-images');

            if (bucketIndex === -1) {
                return NextResponse.json(
                    { error: "URL 不属于 post-images 存储桶" },
                    { status: 400 }
                );
            }

            const filePath = pathParts.slice(bucketIndex + 1).join('/');
            if (!filePath) {
                return NextResponse.json(
                    { error: "无法从 URL 提取文件路径" },
                    { status: 400 }
                );
            }

            const { error } = await supabase.storage
                .from('post-images')
                .remove([filePath]);

            if (error) {
                throw error;
            }

            return NextResponse.json({ success: true });
        } else {
            return NextResponse.json(
                { error: "未知的 URL 格式" },
                { status: 400 }
            );
        }
    } catch (error) {
        console.error("删除失败:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "删除失败" },
            { status: 500 }
        );
    }
}

