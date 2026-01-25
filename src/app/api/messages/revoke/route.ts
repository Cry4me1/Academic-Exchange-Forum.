import { deleteObjectsFromR2 } from "@/lib/r2";
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const runtime = 'edge';

// 撤回时间限制：2分钟
const REVOKE_TIME_LIMIT_MS = 2 * 60 * 1000;

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

        const { messageId } = await request.json();

        if (!messageId) {
            return NextResponse.json(
                { error: "缺少消息 ID" },
                { status: 400 }
            );
        }

        // 获取消息信息
        const { data: message, error: msgError } = await supabase
            .from("messages")
            .select("id, sender_id, created_at, is_revoked")
            .eq("id", messageId)
            .single();

        if (msgError || !message) {
            return NextResponse.json(
                { error: "消息不存在" },
                { status: 404 }
            );
        }

        // 验证是否是消息发送者
        if (message.sender_id !== user.id) {
            return NextResponse.json(
                { error: "只能撤回自己发送的消息" },
                { status: 403 }
            );
        }

        // 检查是否已经撤回
        if (message.is_revoked) {
            return NextResponse.json(
                { error: "消息已撤回" },
                { status: 400 }
            );
        }

        // 5. 检查是否在其两分钟内
        const messageCreatedAt = new Date(message.created_at).getTime();
        const now = Date.now();
        const timeDiff = now - messageCreatedAt;

        if (timeDiff > REVOKE_TIME_LIMIT_MS) {
            const remainingSeconds = Math.floor((REVOKE_TIME_LIMIT_MS - timeDiff) / 1000);
            return NextResponse.json(
                {
                    error: "消息已超过两分钟，无法撤回",
                    details: {
                        timeElapsed: Math.floor(timeDiff / 1000),
                        timeLimit: REVOKE_TIME_LIMIT_MS / 1000,
                    }
                },
                { status: 400 }
            );
        }

        // 6. 查找是否存在附件，如果在则删除 R2 文件
        const { data: attachments } = await supabase
            .from("message_attachments")
            .select("storage_path, id")
            .eq("message_id", messageId);

        if (attachments && attachments.length > 0) {
            const storagePaths = attachments.map((a) => a.storage_path);
            const attachmentIds = attachments.map((a) => a.id);

            // 并行执行：从 R2 删除文件
            // 注意：即使 R2 删除失败，我们仍然允许撤回消息，但会记录错误
            try {
                // 1. 从 R2 删除
                await deleteObjectsFromR2(storagePaths);
                console.log(`消息撤回：已从 R2 删除 ${storagePaths.length} 个文件`);

                // 2. 标记数据库记录为 expired (虽然 trigger 可能会做，但双重保险)
                await supabase
                    .from("message_attachments")
                    .update({ is_expired: true })
                    .in("id", attachmentIds);
            } catch (err) {
                console.error("消息撤回时删除文件失败:", err);
                // 不中断撤回流程
            }
        }

        // 7. 执行撤回
        const { error: updateError } = await supabase
            .from("messages")
            .update({
                is_revoked: true,
                revoked_at: new Date().toISOString(),
                // 保留原始内容但清空显示内容
                content: "[消息已撤回]",
            })
            .eq("id", messageId);

        if (updateError) {
            console.error("撤回消息失败:", updateError);
            return NextResponse.json(
                { error: "撤回消息失败" },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: "消息已撤回",
            revokedAt: new Date().toISOString(),
        });
    } catch (error) {
        console.error("撤回处理失败:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "撤回失败" },
            { status: 500 }
        );
    }
}
