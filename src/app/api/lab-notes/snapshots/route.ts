import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/lab-notes/snapshots?roomId=xxx
 * 获取房间的版本快照列表
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

    // 验证成员
    const { data: member } = await supabase
        .from("lab_members")
        .select("id")
        .eq("room_id", roomId)
        .eq("user_id", user.id)
        .single();

    if (!member) {
        return NextResponse.json({ error: "无权访问" }, { status: 403 });
    }

    // 获取快照列表（不含 yjs_state 二进制，节省传输）
    const { data, error } = await supabase
        .from("lab_note_snapshots")
        .select("id, snapshot_type, label, created_by, created_at")
        .eq("room_id", roomId)
        .order("created_at", { ascending: false })
        .limit(100);

    if (error) {
        console.error("获取快照列表失败:", error);
        return NextResponse.json({ error: "获取失败" }, { status: 500 });
    }

    // 获取创建者信息
    const userIds = [...new Set((data || []).map((s) => s.created_by).filter(Boolean))];
    let profileMap: Record<string, { full_name?: string; username?: string; avatar_url?: string }> = {};

    if (userIds.length > 0) {
        const { data: profiles } = await supabase
            .from("profiles")
            .select("id, full_name, username, avatar_url")
            .in("id", userIds);

        if (profiles) {
            profileMap = Object.fromEntries(profiles.map((p) => [p.id, p]));
        }
    }

    const snapshots = (data || []).map((s) => ({
        ...s,
        createdByUser: s.created_by ? profileMap[s.created_by] || null : null,
    }));

    return NextResponse.json({ snapshots });
}

/**
 * POST /api/lab-notes/snapshots
 * 回滚到指定快照
 * Body: { roomId, snapshotId }
 */
export async function POST(request: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const { roomId, snapshotId } = await request.json();
    if (!roomId || !snapshotId) {
        return NextResponse.json({ error: "参数不完整" }, { status: 400 });
    }

    // 验证成员且角色 >= editor
    const { data: member } = await supabase
        .from("lab_members")
        .select("id, role")
        .eq("room_id", roomId)
        .eq("user_id", user.id)
        .single();

    if (!member || !["owner", "admin", "editor"].includes(member.role)) {
        return NextResponse.json({ error: "无权操作" }, { status: 403 });
    }

    // 获取目标快照
    const { data: snapshot, error: snapError } = await supabase
        .from("lab_note_snapshots")
        .select("id, yjs_state")
        .eq("id", snapshotId)
        .eq("room_id", roomId)
        .single();

    if (snapError || !snapshot) {
        return NextResponse.json({ error: "快照不存在" }, { status: 404 });
    }

    // 在回滚前，先把当前状态保存为 pre_rollback 快照
    const { data: currentNote } = await supabase
        .from("lab_notes")
        .select("yjs_state")
        .eq("room_id", roomId)
        .single();

    if (currentNote) {
        await supabase
            .from("lab_note_snapshots")
            .insert({
                room_id: roomId,
                yjs_state: currentNote.yjs_state,
                snapshot_type: "pre_rollback",
                label: "回滚前自动备份",
                created_by: user.id,
            });
    }

    // 用快照数据覆盖当前状态
    const { error: updateError } = await supabase
        .from("lab_notes")
        .upsert(
            {
                room_id: roomId,
                yjs_state: snapshot.yjs_state,
                updated_by: user.id,
                updated_at: new Date().toISOString(),
            },
            { onConflict: "room_id" }
        );

    if (updateError) {
        console.error("回滚失败:", updateError);
        return NextResponse.json({ error: "回滚失败" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}

/**
 * DELETE /api/lab-notes/snapshots?snapshotId=xxx&roomId=xxx
 * 删除指定快照
 */
export async function DELETE(request: NextRequest) {
    const snapshotId = request.nextUrl.searchParams.get("snapshotId");
    const roomId = request.nextUrl.searchParams.get("roomId");
    if (!snapshotId || !roomId) {
        return NextResponse.json({ error: "参数不完整" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    // 验证管理员权限
    const { data: member } = await supabase
        .from("lab_members")
        .select("id, role")
        .eq("room_id", roomId)
        .eq("user_id", user.id)
        .single();

    if (!member || !["owner", "admin"].includes(member.role)) {
        return NextResponse.json({ error: "仅管理员可删除快照" }, { status: 403 });
    }

    const { error } = await supabase
        .from("lab_note_snapshots")
        .delete()
        .eq("id", snapshotId)
        .eq("room_id", roomId);

    if (error) {
        console.error("删除快照失败:", error);
        return NextResponse.json({ error: "删除失败" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}
