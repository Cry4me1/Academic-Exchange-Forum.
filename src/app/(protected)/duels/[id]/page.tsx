import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DuelDetailClient from "./DuelDetailClient";

interface PageProps {
    params: Promise<{ id: string }>;
}

// 获取决斗详情
async function getDuel(id: string) {
    const supabase = await createClient();

    const { data: duel, error } = await supabase
        .from("duels")
        .select(`
            *,
            challenger:profiles!challenger_id (
                id, username, full_name, avatar_url, reputation_score, duel_wins, duel_losses
            ),
            opponent:profiles!opponent_id (
                id, username, full_name, avatar_url, reputation_score, duel_wins, duel_losses
            ),
            winner:profiles!winner_id (
                id, username
            )
        `)
        .eq("id", id)
        .single();

    if (error || !duel) {
        return null;
    }

    return duel;
}

// 获取决斗回合
async function getDuelRounds(duelId: string) {
    const supabase = await createClient();

    const { data: rounds } = await supabase
        .from("duel_rounds")
        .select(`
            *,
            author:profiles!author_id (
                id, username, full_name, avatar_url
            )
        `)
        .eq("duel_id", duelId)
        .order("round_number", { ascending: true })
        .order("created_at", { ascending: true });

    return rounds || [];
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

export default async function DuelDetailPage({ params }: PageProps) {
    const { id } = await params;

    const [duel, rounds, currentUser] = await Promise.all([
        getDuel(id),
        getDuelRounds(id),
        getCurrentUser(),
    ]);

    if (!duel) {
        notFound();
    }

    // 检查当前用户是否是参与者
    const isParticipant = currentUser && (
        currentUser.id === duel.challenger_id ||
        currentUser.id === duel.opponent_id
    );

    // 检查是否轮到当前用户
    const isMyTurn = currentUser && duel.current_turn_user_id === currentUser.id;

    return (
        <DuelDetailClient
            duel={duel}
            rounds={rounds}
            currentUser={currentUser}
            isParticipant={!!isParticipant}
            isMyTurn={!!isMyTurn}
        />
    );
}
