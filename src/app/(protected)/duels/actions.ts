"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// 接受决斗
export async function acceptDuel(duelId: string, invitationId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: "请先登录" };
    }

    try {
        // 1. 更新邀请状态为 accepted
        const { error: inviteError } = await supabase
            .from("duel_invitations")
            .update({ status: "accepted", responded_at: new Date().toISOString() })
            .eq("id", invitationId)
            .eq("invitee_id", user.id);

        if (inviteError) throw inviteError;

        // 2. 更新决斗状态为 active，设置对手和开始时间
        const { error: duelError } = await supabase
            .from("duels")
            .update({
                status: "active",
                started_at: new Date().toISOString(),
                opponent_id: user.id
            })
            .eq("id", duelId);

        if (duelError) throw duelError;

        revalidatePath("/duels");
        return { success: true };
    } catch (error) {
        console.error("Accept duel error:", error);
        return { error: "接受决斗失败" };
    }
}

// 拒绝决斗
export async function rejectDuel(duelId: string, invitationId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: "请先登录" };
    }

    try {
        // 1. 更新邀请状态为 declined
        const { error: inviteError } = await supabase
            .from("duel_invitations")
            .update({ status: "declined", responded_at: new Date().toISOString() })
            .eq("id", invitationId)
            .eq("invitee_id", user.id);

        if (inviteError) throw inviteError;

        // 2. 更新决斗状态为 cancelled (或者 rejected? 通常拒绝后决斗就取消了)
        // 只有当这是唯一的邀请时才取消决斗。但目前简化模型是一对一，所以直接 cancel
        const { error: duelError } = await supabase
            .from("duels")
            .update({ status: "cancelled" })
            .eq("id", duelId);

        if (duelError) throw duelError;

        revalidatePath("/duels");
        return { success: true };
    } catch (error) {
        console.error("Reject duel error:", error);
        return { error: "拒绝决斗失败" };
    }
}

// 取消决斗 (发起者)
export async function cancelDuel(duelId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: "请先登录" };
    }

    try {
        // 检查是否是发起者且状态为 pending
        const { data: duel, error: fetchError } = await supabase
            .from("duels")
            .select("challenger_id, status")
            .eq("id", duelId)
            .single();

        if (fetchError || !duel) throw new Error("Duel not found");

        if (duel.challenger_id !== user.id) {
            return { error: "只有发起者可以取消决斗" };
        }

        if (duel.status !== "pending") {
            return { error: "只能取消等待中的决斗" };
        }

        // 更新状态为 cancelled
        const { error: updateError } = await supabase
            .from("duels")
            .update({ status: "cancelled" })
            .eq("id", duelId);

        if (updateError) throw updateError;

        revalidatePath("/duels");
        return { success: true };
    } catch (error) {
        console.error("Cancel duel error:", error);
        return { error: "取消决斗失败" };
    }
}

// 删除决斗记录 (仅限已取消/已拒绝的)
export async function deleteDuel(duelId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: "请先登录" };
    }

    try {
        // 检查用户是否有权限删除 (发起者或对手，且状态为 cancelled)
        const { data: duel, error: fetchError } = await supabase
            .from("duels")
            .select("challenger_id, opponent_id, status")
            .eq("id", duelId)
            .single();

        if (fetchError || !duel) throw new Error("Duel not found");

        if (duel.challenger_id !== user.id && duel.opponent_id !== user.id) {
            return { error: "没有权限删除" };
        }

        if (duel.status !== "cancelled" && duel.status !== "declined") {
            return { error: "只能删除已取消或已拒绝的决斗记录" };
        }

        // 删除
        const { error: deleteError } = await supabase
            .from("duels")
            .delete()
            .eq("id", duelId);

        if (deleteError) throw deleteError;

        revalidatePath("/duels");
        return { success: true };
    } catch (error) {
        console.error("Delete duel error:", error);
        return { error: "删除决斗失败" };
    }
}
