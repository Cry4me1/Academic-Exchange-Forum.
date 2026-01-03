import { z } from "zod";

const passwordSchema = z.string().min(6, "密码至少 6 个字符").max(100, "密码过长");

export const loginSchema = z.object({
    email: z.string().email("请输入有效的邮箱地址"),
    password: passwordSchema.optional(), // 兼容旧的 OTP 登录
});

export const registerSchema = z.object({
    username: z
        .string()
        .min(2, "用户名至少 2 个字符")
        .max(20, "用户名最多 20 个字符")
        .regex(/^[a-zA-Z0-9_\u4e00-\u9fa5]+$/, "用户名只能包含字母、数字、下划线或中文"),
    email: z.string().email("请输入有效的邮箱地址"),
    password: passwordSchema,
    confirmPassword: passwordSchema,
}).refine((data) => data.password === data.confirmPassword, {
    message: "两次输入的密码不一致",
    path: ["confirmPassword"],
});

export const forgotPasswordSchema = z.object({
    email: z.string().email("请输入有效的邮箱地址"),
});

export const resetPasswordSchema = z.object({
    password: passwordSchema,
    confirmPassword: passwordSchema,
}).refine((data) => data.password === data.confirmPassword, {
    message: "两次输入的密码不一致",
    path: ["confirmPassword"],
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
