import { z } from "zod";

const passwordSchema = z.string().min(6, "密码至少 6 个字符").max(100, "密码过长");

export const loginSchema = z.object({
    email: z.string().email("请输入有效的邮箱地址"),
    password: passwordSchema.optional(), // 兼容旧的 OTP 登录
});

export const registerSchema = z
    .object({
        username: z
            .string()
            .min(2, "用户名至少 2 个字符")
            .max(20, "用户名最多 20 个字符")
            .regex(/^[a-zA-Z0-9_\u4e00-\u9fa5]+$/, "用户名只能包含字母、数字、下划线或中文"),
        full_name: z
            .string()
            .min(2, "真实姓名至少 2 个字符")
            .max(30, "真实姓名最多 30 个字符"),
        email: z.string().email("请输入有效的邮箱地址"),
        password: passwordSchema,
        confirmPassword: passwordSchema,
        captchaCode: z.string().min(1, "请输入人机验证码"),
        captchaToken: z.string().min(1, "缺少人机验证签名"),
        inviteCode: z.string().optional(),
        honeypot: z.string().optional(),
        renderedAt: z.number().optional(),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "两次输入的密码不一致",
        path: ["confirmPassword"],
    });

export const forgotPasswordSchema = z.object({
    email: z.string().email("请输入有效的邮箱地址"),
});

export const resetPasswordSchema = z
    .object({
        password: passwordSchema,
        confirmPassword: passwordSchema,
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "两次输入的密码不一致",
        path: ["confirmPassword"],
    });

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

// 用户名登录验证
export const usernameLoginSchema = z.object({
    username: z
        .string()
        .min(2, "用户名至少 2 个字符")
        .max(20, "用户名最多 20 个字符"),
    password: passwordSchema,
});

// 纯用户名注册验证（无需邮箱）
export const usernameRegisterSchema = z
    .object({
        username: z
            .string()
            .min(2, "用户名至少 2 个字符")
            .max(20, "用户名最多 20 个字符")
            .regex(/^[a-zA-Z0-9_\u4e00-\u9fa5]+$/, "用户名只能包含字母、数字、下划线或中文"),
        full_name: z
            .string()
            .min(2, "真实姓名至少 2 个字符")
            .max(30, "真实姓名最多 30 个字符"),
        password: passwordSchema,
        confirmPassword: passwordSchema,
        captchaCode: z.string().min(1, "请输入人机验证码"),
        captchaToken: z.string().min(1, "缺少人机验证签名"),
        inviteCode: z.string().optional(),
        honeypot: z.string().optional(),
        renderedAt: z.number().optional(),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "两次输入的密码不一致",
        path: ["confirmPassword"],
    });

export type UsernameLoginFormData = z.infer<typeof usernameLoginSchema>;
export type UsernameRegisterFormData = z.infer<typeof usernameRegisterSchema>;

// 邀请码批量生成 Schema (仅 super_admin Hansszh 账号)
export const generateInviteCodesSchema = z.object({
    prefix: z.string().max(16, "前缀最多16个字符").default("SCHOLAR"),
    count: z.number().int().min(1, "至少生成1个").max(500, "单次最多生成500个").default(1),
    usageLimit: z.number().int().min(1, "单码使用次数至少为1").max(99999, "次数过大").default(1),
    validDays: z.number().int().min(0, "有效天数不能为负数").max(3650, "最多有效10年").optional(), // 0 或 null 代表永久有效
    note: z.string().max(100, "备注最多100字").default("Hansszh 签发"),
});

export type GenerateInviteCodesFormData = z.infer<typeof generateInviteCodesSchema>;



