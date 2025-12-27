import { z } from "zod";

export const loginSchema = z.object({
    email: z.string().email("请输入有效的邮箱地址"),
});

export const registerSchema = z.object({
    username: z
        .string()
        .min(2, "用户名至少 2 个字符")
        .max(20, "用户名最多 20 个字符")
        .regex(/^[a-zA-Z0-9_\u4e00-\u9fa5]+$/, "用户名只能包含字母、数字、下划线或中文"),
    email: z.string().email("请输入有效的邮箱地址"),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
