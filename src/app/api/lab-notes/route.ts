import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/lab-notes?roomId=xxx
 * 加载房间的 Yjs 文档快照
 * 返回 base64 编码的 Yjs state
 */
export async function GET(request: NextRequest) {
    const roomId = request.nextUrl.searchParams.get("roomId");
    if (!roomId) {
        return NextResponse.json({ error: "缺少 roomId" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    // 验证是房间成员
    const { data: member } = await supabase
        .from("lab_members")
        .select("id")
        .eq("room_id", roomId)
        .eq("user_id", user.id)
        .single();

    if (!member) {
        return NextResponse.json({ error: "无权访问" }, { status: 403 });
    }

    // 获取当前状态
    const { data, error } = await supabase
        .from("lab_notes")
        .select("yjs_state, updated_at, updated_by")
        .eq("room_id", roomId)
        .single();

    if (error || !data) {
        // 没有保存过，返回空
        return NextResponse.json({ state: null });
    }

    // Supabase 以 \x 前缀的 hex 返回 bytea -> 我们需要编码为 base64
    // 实际上 supabase-js 自动把 bytea 变成 base64 字符串
    return NextResponse.json({
        state: data.yjs_state,
        updatedAt: data.updated_at,
        updatedBy: data.updated_by,
    });
}

/**
 * POST /api/lab-notes
 * 保存 Yjs 文档快照（自动保存 + 可选创建版本快照）
 * Body: { roomId, state: number[] (Uint8Array), createSnapshot?: boolean, snapshotLabel?: string }
 */
export async function POST(request: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const body = await request.json();
    const { roomId, state, createSnapshot, snapshotLabel, snapshotType } = body as {
        roomId: string;
        state: number[];
        createSnapshot?: boolean;
        snapshotLabel?: string;
        snapshotType?: string;
    };

    if (!roomId || !state || !Array.isArray(state)) {
        return NextResponse.json({ error: "参数不完整" }, { status: 400 });
    }

    // 验证成员身份
    const { data: member } = await supabase
        .from("lab_members")
        .select("id, role")
        .eq("room_id", roomId)
        .eq("user_id", user.id)
        .single();

    if (!member) {
        return NextResponse.json({ error: "无权操作" }, { status: 403 });
    }

    // 将 number[] 转为 bytea hex 字符串
    const hexStr = "\\x" + state.map((b) => b.toString(16).padStart(2, "0")).join("");

    // Upsert 当前状态
    const { error: upsertError } = await supabase
        .from("lab_notes")
        .upsert(
            {
                room_id: roomId,
                yjs_state: hexStr,
                updated_by: user.id,
                updated_at: new Date().toISOString(),
            },
            { onConflict: "room_id" }
        );

    if (upsertError) {
        console.error("保存笔记失败:", upsertError);
        return NextResponse.json({ error: "保存失败" }, { status: 500 });
    }

    // 如果需要创建版本快照
    if (createSnapshot) {
        const { error: snapError } = await supabase
            .from("lab_note_snapshots")
            .insert({
                room_id: roomId,
                yjs_state: hexStr,
                snapshot_type: snapshotType || "auto",
                label: snapshotLabel || null,
                created_by: user.id,
            });

        if (snapError) {
            console.error("创建快照失败:", snapError);
            // 不影响主保存
        }

        // 清理旧的自动快照（保留最近50个）
        await supabase.rpc("cleanup_old_lab_snapshots", {
            target_room_id: roomId,
        });
    }

    return NextResponse.json({ success: true });
}
