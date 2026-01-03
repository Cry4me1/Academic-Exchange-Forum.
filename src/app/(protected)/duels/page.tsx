import { createClient } from "@/lib/supabase/server";
import DuelsPageClient from "./duels-page-client";

export const dynamic = "force-dynamic";

// 获取进行中的热门决斗
async function getActiveDuels() {
    const supabase = await createClient();

    const { data: duels } = await supabase
        .from("duels")
        .select(`
            id,
            topic,
            description,
            status,
            challenger_id,
            opponent_id,
            challenger_score,
            opponent_score,
            current_round,
            max_rounds,
            created_at,
            challenger:profiles!challenger_id (
                id, username, full_name, avatar_url, reputation_score
            ),
            opponent:profiles!opponent_id (
                id, username, full_name, avatar_url, reputation_score
            )
        `)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(10);

    return (duels || []).map((duel: any) => ({
        ...duel,
        challenger: Array.isArray(duel.challenger) ? duel.challenger[0] : duel.challenger,
        opponent: Array.isArray(duel.opponent) ? duel.opponent[0] : duel.opponent,
    }));
}

// 获取最近完成的决斗
async function getRecentCompletedDuels() {
    const supabase = await createClient();

    const { data: duels } = await supabase
        .from("duels")
        .select(`
            id,
            topic,
            description,
            status,
            challenger_id,
            opponent_id,
            challenger_score,
            opponent_score,
            ko_type,
            ended_at,
            challenger:profiles!challenger_id (
                id, username, full_name, avatar_url
            ),
            opponent:profiles!opponent_id (
                id, username, full_name, avatar_url
            ),
            winner:profiles!winner_id (
                id, username
            )
        `)
        .eq("status", "completed")
        .order("ended_at", { ascending: false })
        .limit(5);

    return (duels || []).map((duel: any) => ({
        ...duel,
        challenger: Array.isArray(duel.challenger) ? duel.challenger[0] : duel.challenger,
        opponent: Array.isArray(duel.opponent) ? duel.opponent[0] : duel.opponent,
        winner: Array.isArray(duel.winner) ? duel.winner[0] : duel.winner,
    }));
}

// 获取当前用户的决斗
async function getMyDuels() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return [];

    const { data: duels } = await supabase
        .from("duels")
        .select(`
            id,
            topic,
            status,
            challenger_id,
            opponent_id,
            challenger_score,
            opponent_score,
            current_round,
            max_rounds,
            current_turn_user_id,
            created_at,
            challenger:profiles!challenger_id (
                id, username, full_name, avatar_url
            ),
            opponent:profiles!opponent_id (
                id, username, full_name, avatar_url
            )
        `)
        .or(`challenger_id.eq.${user.id},opponent_id.eq.${user.id}`)
        // .in("status", ["pending", "active"]) // Removed to show all history (completed, cancelled, etc.)
        .order("created_at", { ascending: false });

    return (duels || []).map((duel: any) => ({
        ...duel,
        challenger: Array.isArray(duel.challenger) ? duel.challenger[0] : duel.challenger,
        opponent: Array.isArray(duel.opponent) ? duel.opponent[0] : duel.opponent,
    }));
}

// 获取待处理的决斗邀请
async function getPendingInvitations() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return [];

    const { data: invitations } = await supabase
        .from("duel_invitations")
        .select(`
            id,
            created_at,
            duel:duels (
                id,
                topic,
                description,
                challenger_position,
                max_rounds,
                challenger:profiles!challenger_id (
                    id, username, full_name, avatar_url, reputation_score
                )
            )
        `)
        .eq("invitee_id", user.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

    // Filter out invitations where duel data is missing (e.g. due to RLS)
    return (invitations || [])
        .filter(invitation => invitation.duel)
        .map((invitation: any) => ({
            ...invitation,
            duel: {
                ...invitation.duel,
                challenger: Array.isArray(invitation.duel.challenger) ? invitation.duel.challenger[0] : invitation.duel.challenger
            }
        }));
}

// 获取当前用户
async function getCurrentUser() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    const { data: profile } = await supabase
        .from("profiles")
        .select("id, username, avatar_url, reputation_score")
        .eq("id", user.id)
        .single();

    return profile;
}

export default async function DuelsPage() {
    const [activeDuels, recentCompletedDuels, myDuels, pendingInvitations, currentUser] = await Promise.all([
        getActiveDuels(),
        getRecentCompletedDuels(),
        getMyDuels(),
        getPendingInvitations(),
        getCurrentUser(),
    ]);

    return (
        <DuelsPageClient
            activeDuels={activeDuels}
            recentCompletedDuels={recentCompletedDuels}
            myDuels={myDuels}
            pendingInvitations={pendingInvitations}
            currentUser={currentUser}
        />
    );
}
