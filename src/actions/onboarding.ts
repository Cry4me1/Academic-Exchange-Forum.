"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface OnboardingProfileInput {
    username?: string;
    gender?: string;
    country?: string;
    language?: string;
    timezone?: string;
    bio?: string;
    banner_style?: string;
    avatar_url?: string;
}

export interface OnboardingStatusResult {
    isAuthenticated: boolean;
    userId?: string;
    email?: string;
    username?: string;
    avatar_url?: string;
    gender?: string;
    country?: string;
    language?: string;
    timezone?: string;
    bio?: string;
    banner_style?: string;
    onboarding_completed: boolean;
    terms_accepted_at?: string | null;
    onboarding_step?: number;
}

/**
 * 获取当前用户的入驻状态与现有资料
 */
export async function getOnboardingStatus(): Promise<OnboardingStatusResult> {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return {
            isAuthenticated: false,
            onboarding_completed: false,
        };
    }

    const { data: profile } = await supabase
        .from("profiles")
        .select("id, email, username, avatar_url, gender, country, language, timezone, bio, banner_style, onboarding_completed, terms_accepted_at, onboarding_step")
        .eq("id", user.id)
        .single();

    return {
        isAuthenticated: true,
        userId: user.id,
        email: user.email ?? profile?.email ?? "",
        username: profile?.username ?? "",
        avatar_url: profile?.avatar_url ?? "",
        gender: profile?.gender ?? "",
        country: profile?.country ?? "",
        language: profile?.language ?? "zh",
        timezone: profile?.timezone ?? "Asia/Shanghai",
        bio: profile?.bio ?? "",
        banner_style: profile?.banner_style ?? "default",
        onboarding_completed: profile?.onboarding_completed ?? false,
        terms_accepted_at: profile?.terms_accepted_at ?? null,
        onboarding_step: profile?.onboarding_step ?? 1,
    };
}

/**
 * 步骤一：确认并签署社区公约与用户协议
 */
export async function recordTermsAcceptance(): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return { success: false, error: "未登录或登录状态已过期" };
    }

    const now = new Date().toISOString();
    const { error } = await supabase
        .from("profiles")
        .update({
            terms_accepted_at: now,
            onboarding_step: 2,
            updated_at: now,
        })
        .eq("id", user.id);

    if (error) {
        console.error("记录公约签署状态失败:", error);
        return { success: false, error: error.message };
    }

    return { success: true };
}

/**
 * 步骤三完成：全量保存学者资料、选择的主题色，并正式标记入驻完成
 */
export async function completeOnboarding(
    input: OnboardingProfileInput
): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return { success: false, error: "未登录或登录状态已过期" };
    }

    const now = new Date().toISOString();

    const updatePayload: Record<string, any> = {
        onboarding_completed: true,
        onboarding_step: 3,
        updated_at: now,
    };

    if (input.username !== undefined) updatePayload.username = input.username ? input.username.trim() : null;
    if (input.gender !== undefined) updatePayload.gender = input.gender || null;
    if (input.country !== undefined) updatePayload.country = input.country ? input.country.trim() : null;
    if (input.language !== undefined) updatePayload.language = input.language || "zh";
    if (input.timezone !== undefined) updatePayload.timezone = input.timezone || "Asia/Shanghai";
    if (input.bio !== undefined) updatePayload.bio = input.bio ? input.bio.trim() : null;
    if (input.banner_style !== undefined) updatePayload.banner_style = input.banner_style || "default";
    if (input.avatar_url !== undefined && input.avatar_url) updatePayload.avatar_url = input.avatar_url;

    // 确保 terms_accepted_at 存在
    const { data: existingProfile } = await supabase
        .from("profiles")
        .select("terms_accepted_at")
        .eq("id", user.id)
        .single();

    if (!existingProfile?.terms_accepted_at) {
        updatePayload.terms_accepted_at = now;
    }

    const { error } = await supabase
        .from("profiles")
        .update(updatePayload)
        .eq("id", user.id);

    if (error) {
        console.error("完成入驻资料更新失败:", error);
        return { success: false, error: error.message };
    }

    // 刷新缓存路径
    revalidatePath("/", "layout");
    revalidatePath("/dashboard");
    revalidatePath(`/user/${user.id}`);

    return { success: true };
}
