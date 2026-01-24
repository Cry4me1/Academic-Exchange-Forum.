import { deleteObjectsFromR2 } from "@/lib/r2";
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// 用于 Vercel Cron 或手动触发的过期文件清理 API
// 在 vercel.json 中配置 cron 任务每天运行一次

export async function GET(request: NextRequest) {
    try {
        // 验证请求来源（Vercel Cron 或管理员）
        const authHeader = request.headers.get("authorization");
        const cronSecret = process.env.CRON_SECRET;

        // 如果配置了 CRON_SECRET，验证请求
        if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json(
                { error: "未授权" },
                { status: 401 }
            );
        }

        const supabase = await createClient();

        // 1. 查找所有已过期但未标记的附件
        const { data: expiredAttachments, error: queryError } = await supabase
            .from("message_attachments")
            .select("id, storage_path, file_name")
            .eq("is_expired", false)
            .lt("expires_at", new Date().toISOString());

        if (queryError) {
            console.error("查询过期附件失败:", queryError);
            return NextResponse.json(
                { error: "查询失败" },
                { status: 500 }
            );
        }

        if (!expiredAttachments || expiredAttachments.length === 0) {
            return NextResponse.json({
                success: true,
                message: "没有需要清理的过期文件",
                cleanedCount: 0,
            });
        }

        console.log(`找到 ${expiredAttachments.length} 个过期文件待清理`);

        // 2. 从 R2 中批量删除文件
        const storagePaths = expiredAttachments.map(a => a.storage_path);
        await deleteObjectsFromR2(storagePaths);

        // 3. 更新数据库记录为已过期
        const attachmentIds = expiredAttachments.map(a => a.id);
        const { error: updateError } = await supabase
            .from("message_attachments")
            .update({ is_expired: true })
            .in("id", attachmentIds);

        if (updateError) {
            console.error("更新附件状态失败:", updateError);
            return NextResponse.json(
                { error: "更新状态失败" },
                { status: 500 }
            );
        }

        console.log(`成功清理 ${expiredAttachments.length} 个过期文件`);

        return NextResponse.json({
            success: true,
            message: `成功清理 ${expiredAttachments.length} 个过期文件`,
            cleanedCount: expiredAttachments.length,
            cleanedFiles: expiredAttachments.map(a => a.file_name),
        });
    } catch (error) {
        console.error("清理处理失败:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "清理失败" },
            { status: 500 }
        );
    }
}

// 支持 POST 方法（用于手动触发）
export async function POST(request: NextRequest) {
    return GET(request);
}
