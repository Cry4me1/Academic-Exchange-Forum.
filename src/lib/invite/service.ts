import { createAdminClient } from "@/lib/supabase/admin";

export type RegistrationMode = "OPEN" | "INVITE_ONLY" | "CLOSED";

export interface InviteValidationResult {
    valid: boolean;
    error?: string;
    code?: string;
    remaining_uses?: number;
    inviter_name?: string;
    note?: string;
}

export interface InviteConsumeResult {
    success: boolean;
    error?: string;
    code_id?: string;
    code?: string;
    inviter_id?: string;
}

// 获取当前系统注册模式
export async function getRegistrationMode(): Promise<RegistrationMode> {
    try {
        const adminClient = createAdminClient();
        const { data, error } = await adminClient
            .from("system_settings")
            .select("value")
            .eq("key", "registration_mode")
            .maybeSingle();

        if (error || !data || !data.value) {
            return "INVITE_ONLY"; // 默认严格邀请制
        }

        const mode = typeof data.value === "string" ? data.value : JSON.parse(JSON.stringify(data.value));
        if (["OPEN", "INVITE_ONLY", "CLOSED"].includes(mode)) {
            return mode as RegistrationMode;
        }

        return "INVITE_ONLY";
    } catch {
        return "INVITE_ONLY";
    }
}

// 服务端预检邀请码
export async function validateInviteCodeServer(code: string): Promise<InviteValidationResult> {
    const cleanCode = (code || "").trim().toUpperCase();
    if (!cleanCode) {
        return { valid: false, error: "请输入邀请码" };
    }

    try {
        const adminClient = createAdminClient();
        const { data, error } = await adminClient.rpc("validate_invite_code", {
            p_code: cleanCode,
        });

        if (error) {
            console.error("[Invite Service] validate_invite_code RPC error:", error);
            return { valid: false, error: "邀请码校验异常，请稍后重试" };
        }

        return data as InviteValidationResult;
    } catch (e: any) {
        console.error("[Invite Service] validateInviteCodeServer exception:", e);
        return { valid: false, error: "服务器校验邀请码失败" };
    }
}

// 原子核销邀请码（无积分奖励）
export async function consumeInviteCodeServer(params: {
    code: string;
    userId: string;
    username: string;
    email: string;
    ip?: string;
    userAgent?: string;
}): Promise<InviteConsumeResult> {
    try {
        const adminClient = createAdminClient();
        const { data, error } = await adminClient.rpc("consume_invite_code", {
            p_code: params.code.trim().toUpperCase(),
            p_user_id: params.userId,
            p_username: params.username,
            p_email: params.email,
            p_ip: params.ip || null,
            p_user_agent: params.userAgent || null,
        });

        if (error) {
            console.error("[Invite Service] consume_invite_code RPC error:", error);
            return { success: false, error: error.message || "邀请码核销失败" };
        }

        return data as InviteConsumeResult;
    } catch (e: any) {
        console.error("[Invite Service] consumeInviteCodeServer exception:", e);
        return { success: false, error: "邀请码核销处理异常" };
    }
}
